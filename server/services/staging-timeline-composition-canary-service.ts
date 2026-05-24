import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Storage } from '@google-cloud/storage'
import {
  readRenderCanaryConfig,
  readRenderCanaryLimits,
  validateRenderCanaryConfig,
} from '../cloud-run/render-canary-config'
import { invokeStagingTimelineCompositionCanary } from '../cloud-run/render-canary-client'
import type {
  RenderCanaryInvocationResult,
  TimelineCompositionCanaryInvocationConfig,
} from '../cloud-run/render-canary-types'
import { extractThumbnailFrame, checkAudioStreamWithFfmpeg } from '../media/ffmpeg-analysis'
import { probeMediaFile } from '../media/ffprobe'
import { buildMediaAnalysisReport } from '../media/media-analysis-report'
import type { AudioStreamSummary, OptionalAnalysisReadiness } from '../media/media-analysis-contracts'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import {
  buildFixedTimelineCompositionSpec,
  STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
  type TimelineAnalysisSummary,
  type TimelineCompositionCanaryResult,
} from '../timeline/timeline-composition-contracts'
import type { EditingToolReadinessSummary } from '../tools/editing-tool-readiness'
import { runEditingToolReadiness } from '../tools/editing-tool-readiness'
import type { ServiceContext } from '../types'
import type { JSONObject } from '../../src/types'
import {
  runPersistedGcsTimelineCompositionSmoke,
  type PersistedMediaAnalysisArtifactRecord,
  type PersistedRenderSourceFixtureFactoryResult,
} from './supabase-e2e-smoke-service'
import type { SupabaseSmokeLeftoverRecord } from './supabase-smoke-leftover-service'

const SMOKE_RUN_PATTERN = /^rp-e2e-smoke-[0-9a-f-]{36}$/i
const PRODUCTION_WORD_PATTERN = /\b(prod|production|live)\b/i
const SOURCE_FILE_NAME = 'tiny-timeline-source.mp4'
const TINY_TIMELINE = {
  durationSeconds: 3,
  width: 160,
  height: 90,
  fps: 15,
  maxFrames: 45,
}

export interface StagingTimelineCompositionCanaryPreflightInput {
  env: ServiceContext['env']
  sourceEnv: Record<string, string | undefined>
  expectDisabled?: boolean
  previousSmokeLeftoverChecks?: Array<{
    label: string
    smokeRunId?: string
    ok?: boolean
    leftovers?: SupabaseSmokeLeftoverRecord[]
    queryErrors?: string[]
    error?: string
  }>
}

export interface StagingTimelineCompositionCanaryPreflightResult {
  ok: boolean
  status: 'skipped' | 'blocked' | 'ready'
  blockers: string[]
  strictValidation: {
    ok: boolean
    allowWritesAcknowledged: boolean
    allowRenderExecutionAcknowledged: boolean
    allowCloudRunAcknowledged: boolean
    allowTimelineCompositionAcknowledged: boolean
    cleanupAcknowledged: boolean
    stagingOnly: boolean
    mode: typeof STAGING_TIMELINE_COMPOSITION_CANARY_MODE
    requiredTools: ['ffmpeg', 'ffprobe', 'remotion']
    noProductionFlowsRan: true
    noStripePaymentFlowsRan: true
    noExternalProviderGenerationCallsRan: true
    noBroadE2eSuiteRan: true
    noCustomerMediaUsed: true
    noQueueDrainRan: true
  }
}

export interface GcsObjectRef {
  bucketName: string
  objectPath: string
}

export interface TimelineCanaryGcsStore {
  uploadLocalFile(input: GcsObjectRef & {
    localPath: string
    contentType: string
    metadata: Record<string, string>
  }): Promise<void>
  downloadToFile(input: GcsObjectRef & { localPath: string }): Promise<void>
  exists(input: GcsObjectRef): Promise<boolean>
  delete(input: GcsObjectRef): Promise<boolean>
}

export interface TimelinePreparationResult {
  analysis: TimelineAnalysisSummary
  analysisArtifacts: PersistedMediaAnalysisArtifactRecord[]
  timeline: ReturnType<typeof buildFixedTimelineCompositionSpec>
}

export interface StagingTimelineCompositionCanaryDeps {
  sourceEnv?: Record<string, string | undefined>
  gcsStore?: TimelineCanaryGcsStore
  runToolReadiness?: (input: {
    strict: boolean
    requiredToolIds: ['ffmpeg', 'ffprobe', 'remotion']
    sourceEnv: Record<string, string | undefined>
  }) => Promise<EditingToolReadinessSummary>
  createSourceFixture?: (input: {
    smokeRunId: string
    localPath: string
    tempDir: string
    context: ServiceContext
  }) => Promise<PersistedRenderSourceFixtureFactoryResult & { localPath: string }>
  analyzeAndBuildTimeline?: (input: {
    smokeRunId: string
    workspaceId: string
    projectId: string
    sourceStorageObjectId: string
    sourceMediaAssetId?: string
    source: GcsObjectRef & {
      sizeBytes: number
      checksumSha256: string
    }
    tempDir: string
    context: ServiceContext
    gcsStore: TimelineCanaryGcsStore
    optionalReadiness: OptionalAnalysisReadiness[]
  }) => Promise<TimelinePreparationResult>
  invokeCloudRun?: (input: {
    smokeRunId: string
    config: TimelineCompositionCanaryInvocationConfig
  }) => Promise<RenderCanaryInvocationResult>
  runPersistedSmoke?: typeof runPersistedGcsTimelineCompositionSmoke
}

export function evaluateStagingTimelineCompositionCanaryPreflight(
  input: StagingTimelineCompositionCanaryPreflightInput,
): StagingTimelineCompositionCanaryPreflightResult {
  const sourceEnv = input.sourceEnv
  const allowRenderExecution = sourceEnv.SUPABASE_E2E_ALLOW_RENDER_EXECUTION === 'true'
  const allowCloudRun = sourceEnv.SUPABASE_E2E_ALLOW_CLOUD_RUN === 'true'
  const allowTimelineComposition = sourceEnv.SUPABASE_E2E_ALLOW_TIMELINE_COMPOSITION === 'true'
  const config = readRenderCanaryConfig(sourceEnv)
  const limits = readRenderCanaryLimits(sourceEnv)

  if (
    input.expectDisabled
    && (
      input.env.supabaseE2eSmokeMode !== 'live'
      || !input.env.supabaseE2eAllowWrites
      || !allowRenderExecution
      || !allowCloudRun
      || !allowTimelineComposition
    )
  ) {
    return preflightResult('skipped', [], input.env, allowRenderExecution, allowCloudRun, allowTimelineComposition)
  }

  const configIssues = validateRenderCanaryConfig({
    config,
    limits,
    sourceEnv,
    allowRenderExecution,
    allowCloudRun,
    allowRemotion: true,
    cleanupAcknowledged: input.env.supabaseE2eCleanup,
    expectedMode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
  })
  const blockers = [
    ...validateRuntimeInputs(input.env, sourceEnv, allowTimelineComposition),
    ...configIssues.map((issue) => issue.message),
    ...validatePreviousLeftovers(input.previousSmokeLeftoverChecks ?? []),
  ]

  return preflightResult(blockers.length > 0 ? 'blocked' : 'ready', blockers, input.env, allowRenderExecution, allowCloudRun, allowTimelineComposition)
}

export async function runStagingTimelineCompositionCanary(
  context: ServiceContext,
  deps: StagingTimelineCompositionCanaryDeps = {},
): Promise<TimelineCompositionCanaryResult> {
  const sourceEnv = deps.sourceEnv ?? process.env
  const preflight = evaluateStagingTimelineCompositionCanaryPreflight({
    env: context.env,
    sourceEnv,
  })
  if (!preflight.ok || preflight.status !== 'ready') {
    return failedResult(preflight.blockers, {
      status: preflight.status === 'skipped' ? 'skipped' : 'failed',
      ok: preflight.status === 'skipped',
    })
  }

  const runReadiness = deps.runToolReadiness ?? ((input: {
    strict: boolean
    requiredToolIds: ['ffmpeg', 'ffprobe', 'remotion']
    sourceEnv: Record<string, string | undefined>
  }) => runEditingToolReadiness({
    ...input,
    sourceEnv: input.sourceEnv as NodeJS.ProcessEnv,
  }))
  const readiness = await runReadiness({
    strict: true,
    requiredToolIds: ['ffmpeg', 'ffprobe', 'remotion'],
    sourceEnv,
  })
  const requiredMissing = readiness.missingRequiredToolIds
  if (requiredMissing.includes('ffprobe')) return failedResult(['TIMELINE_COMPOSITION_FFPROBE_REQUIRED: FFprobe is required for RP-EDIT-01.'])
  if (requiredMissing.includes('ffmpeg')) return failedResult(['TIMELINE_COMPOSITION_FFMPEG_REQUIRED: FFmpeg is required for RP-EDIT-01.'])
  if (requiredMissing.includes('remotion')) return failedResult(['TIMELINE_COMPOSITION_REMOTION_REQUIRED: Remotion is required for RP-EDIT-01.'])
  const optionalReadiness = extractOptionalReadiness(readiness)

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'rp-timeline-composition-canary-'))
  const gcsStore = deps.gcsStore ?? new GoogleCloudTimelineCanaryStore(context.env.googleCloudProjectId)
  const runPersistedSmoke = deps.runPersistedSmoke ?? runPersistedGcsTimelineCompositionSmoke
  const invokeCloudRun = deps.invokeCloudRun ?? invokeStagingTimelineCompositionCanary
  const liveConfig = readRenderCanaryConfig(sourceEnv)
  const gcsObjects: GcsObjectRef[] = []
  let sourceArtifact: TimelineCompositionCanaryResult['sourceArtifact']
  let timelinePreparation: TimelinePreparationResult | undefined
  let previewArtifact: GcsObjectRef | undefined

  try {
    const result = await runPersistedSmoke(context, {
      sourceObjectOwner: 'smoke_run',
      sourceFileName: SOURCE_FILE_NAME,
      precreateRenderIdForOutputPath: true,
      sourceFixtureFactory: async ({ smokeRunId, bucketName, objectPath }) => {
        assertSmokeObject({ bucketName, objectPath }, smokeRunId, '/source-media/', 'TIMELINE_COMPOSITION_SOURCE_NOT_SMOKE_TAGGED')
        const localSourcePath = path.join(tempDir, `${smokeRunId}-source.mp4`)
        const fixture = await (deps.createSourceFixture ?? createDefaultSourceFixture)({
          smokeRunId,
          localPath: localSourcePath,
          tempDir,
          context,
        })
        const ref = { bucketName, objectPath }
        await gcsStore.uploadLocalFile({
          ...ref,
          localPath: fixture.localPath,
          contentType: 'video/mp4',
          metadata: {
            smokeRunId,
            canary: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
            checksumSha256: fixture.checksumSha256,
          },
        })
        if (!await gcsStore.exists(ref)) {
          throw new Error('TIMELINE_COMPOSITION_SOURCE_NOT_SMOKE_TAGGED: uploaded source fixture was not readable in GCS.')
        }
        gcsObjects.push(ref)
        sourceArtifact = {
          ...ref,
          sizeBytes: fixture.sizeBytes,
          checksumSha256: fixture.checksumSha256,
        }
        return fixture
      },
      analyzeAndBuildTimeline: async (input) => {
        const preparation = await (deps.analyzeAndBuildTimeline ?? executeDefaultTimelinePreparation)({
          smokeRunId: input.smokeRunId,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          sourceStorageObjectId: input.sourceStorageObjectId,
          sourceMediaAssetId: input.sourceMediaAssetId,
          source: {
            bucketName: input.sourceBucketName,
            objectPath: input.sourceObjectPath,
            sizeBytes: input.sourceSizeBytes,
            checksumSha256: input.sourceChecksumSha256,
          },
          tempDir,
          context,
          gcsStore,
          optionalReadiness,
        })
        timelinePreparation = preparation
        for (const artifact of preparation.analysisArtifacts) {
          gcsObjects.push({ bucketName: artifact.bucketName, objectPath: artifact.objectPath })
        }
        return preparation
      },
      createExternalRenderArtifacts: async (input) => {
        if (!input.plannedRenderId || !input.outputBucketName || !input.outputObjectPath) {
          throw new Error('GCS_PREVIEW_OBJECT_MISSING: timeline canary requires a precreated render id and canonical preview output path.')
        }
        if (!input.sourceBucketName || !input.sourceObjectPath || !input.sourceSizeBytes || !input.sourceChecksumSha256) {
          throw new Error('GCS_SOURCE_OBJECT_MISSING: timeline canary source metadata is incomplete.')
        }
        if (!timelinePreparation) throw new Error('TIMELINE_COMPOSITION_METADATA_MISSING: timeline metadata was not prepared before render invocation.')
        const invocation = await invokeCloudRun({
          smokeRunId: input.smokeRunId,
          config: {
            cloudRunUrl: liveConfig.cloudRunUrl!,
            audience: liveConfig.cloudRunAudience!,
            idToken: liveConfig.idToken!,
            durationSeconds: TINY_TIMELINE.durationSeconds,
            width: TINY_TIMELINE.width,
            height: TINY_TIMELINE.height,
            fps: TINY_TIMELINE.fps,
            timeoutSeconds: liveConfig.timeoutSeconds,
            source: {
              bucketName: input.sourceBucketName,
              objectPath: input.sourceObjectPath,
              sizeBytes: input.sourceSizeBytes,
              checksumSha256: input.sourceChecksumSha256,
            },
            preview: {
              bucketName: input.outputBucketName,
              objectPath: input.outputObjectPath,
            },
            analysis: timelinePreparation.analysis as unknown as JSONObject,
            timeline: timelinePreparation.timeline as unknown as JSONObject,
          },
        })
        previewArtifact = {
          bucketName: invocation.outputBucketName,
          objectPath: invocation.outputObjectPath,
        }
        gcsObjects.push(previewArtifact)
        return {
          outputBucketName: invocation.outputBucketName,
          outputObjectPath: invocation.outputObjectPath,
          durationSeconds: invocation.durationSeconds,
          sizeBytes: invocation.sizeBytes,
          checksumSha256: invocation.checksumSha256,
          mediaProbe: {
            durationSeconds: timelinePreparation.analysis.probe.durationSeconds,
            width: timelinePreparation.analysis.probe.width,
            height: timelinePreparation.analysis.probe.height,
            videoCodec: timelinePreparation.analysis.probe.videoCodec,
            audioCodec: timelinePreparation.analysis.probe.audioCodec,
            formatName: timelinePreparation.analysis.probe.formatName,
            sizeBytes: timelinePreparation.analysis.probe.sizeBytes,
            streamCount: timelinePreparation.analysis.probe.streamCount,
            rawSummary: {
              mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
              sourceObjectPath: input.sourceObjectPath,
              frameCount: invocation.frameCount,
            },
          },
          previewRender: {
            durationSeconds: invocation.durationSeconds,
            sizeBytes: invocation.sizeBytes,
            checksumSha256: invocation.checksumSha256,
            commandSummary: invocation.commandSummary,
          },
          outputArtifactSummary: invocation.outputArtifactSummary,
        }
      },
    })

    const gcsCleanup = await cleanupGcsObjects(gcsStore, gcsObjects)
    const strictValidation = buildStrictValidation(result, gcsCleanup, timelinePreparation)
    return {
      ok: result.ok && result.status === 'passed' && strictValidation.ok,
      status: result.ok && result.status === 'passed' && strictValidation.ok ? 'passed' : 'failed',
      smokeRunId: result.records?.smokeRunId,
      sourceArtifact,
      mediaProbe: timelinePreparation?.analysis.probe,
      thumbnailArtifact: timelinePreparation?.analysis.thumbnail,
      timeline: timelinePreparation?.timeline,
      previewArtifact,
      optionalReadiness,
      cleanup: result.cleanup,
      gcsCleanup,
      leftoverRecords: result.leftoverRecords as Array<Record<string, unknown>> | undefined,
      leftoverQueryErrors: result.leftoverQueryErrors,
      strictValidation,
      warnings: [...readiness.warnings, ...result.warnings],
      error: strictValidation.ok ? result.error : {
        code: stableErrorCodeFromMessages(strictValidation.blockers) ?? 'staging_timeline_composition_canary_failed',
        message: strictValidation.blockers.join('; '),
      },
    }
  } catch (error) {
    const gcsCleanup = await cleanupGcsObjects(gcsStore, gcsObjects)
    return {
      ...failedResult([error instanceof Error ? error.message : 'Staging timeline composition canary failed.']),
      sourceArtifact,
      previewArtifact,
      optionalReadiness,
      gcsCleanup,
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

async function createDefaultSourceFixture(input: {
  localPath: string
  tempDir: string
  context: ServiceContext
}): Promise<PersistedRenderSourceFixtureFactoryResult & { localPath: string }> {
  const fixture = await createSyntheticMp4Fixture({
    outputPath: input.localPath,
    localStorageRoot: input.tempDir,
    ffmpegBin: input.context.env.ffmpegBin,
    timeoutMs: input.context.env.toolCheckTimeoutMs,
    durationSeconds: TINY_TIMELINE.durationSeconds,
    width: TINY_TIMELINE.width,
    height: TINY_TIMELINE.height,
    fps: TINY_TIMELINE.fps,
  })
  if (!fixture.available || !fixture.sizeBytes || !fixture.checksumSha256) {
    throw new Error(`TIMELINE_COMPOSITION_FFMPEG_REQUIRED: FFmpeg could not create the timeline source fixture: ${fixture.warnings.join('; ')}`)
  }
  return {
    localPath: input.localPath,
    sizeBytes: fixture.sizeBytes,
    checksumSha256: fixture.checksumSha256,
    durationSeconds: TINY_TIMELINE.durationSeconds,
    width: TINY_TIMELINE.width,
    height: TINY_TIMELINE.height,
    fps: TINY_TIMELINE.fps,
  }
}

async function executeDefaultTimelinePreparation(input: {
  smokeRunId: string
  workspaceId: string
  projectId: string
  sourceStorageObjectId: string
  sourceMediaAssetId?: string
  source: GcsObjectRef & { sizeBytes: number; checksumSha256: string }
  tempDir: string
  context: ServiceContext
  gcsStore: TimelineCanaryGcsStore
  optionalReadiness: OptionalAnalysisReadiness[]
}): Promise<TimelinePreparationResult> {
  assertSmokeObject(input.source, input.smokeRunId, '/source-media/', 'TIMELINE_COMPOSITION_SOURCE_NOT_SMOKE_TAGGED')
  const downloadedSourcePath = path.join(input.tempDir, `${input.smokeRunId}-downloaded-source.mp4`)
  await input.gcsStore.downloadToFile({ ...input.source, localPath: downloadedSourcePath })
  const probe = await probeMediaFile(downloadedSourcePath, {
    ffprobeBin: input.context.env.ffprobeBin,
    timeoutMs: input.context.env.toolCheckTimeoutMs,
  })
  const thumbnailPath = path.join(input.tempDir, 'timeline-thumbnail.jpg')
  const thumbnail = await extractThumbnailFrame({
    inputPath: downloadedSourcePath,
    outputPath: thumbnailPath,
    localStorageRoot: input.tempDir,
    ffmpegBin: input.context.env.ffmpegBin,
    timeoutMs: input.context.env.toolCheckTimeoutMs,
    width: TINY_TIMELINE.width,
    height: TINY_TIMELINE.height,
  })
  const audioCheck = await checkAudioStreamWithFfmpeg({
    inputPath: downloadedSourcePath,
    ffmpegBin: input.context.env.ffmpegBin,
    timeoutMs: input.context.env.toolCheckTimeoutMs,
  })
  const audio: AudioStreamSummary = {
    ...audioCheck,
    codec: probe.audioCodec,
    summary: probe.audioCodec
      ? `FFmpeg found audio codec ${probe.audioCodec}.`
      : audioCheck.summary,
  }

  const basePath = `workspaces/${input.workspaceId}/projects/${input.projectId}/media-analysis/${input.smokeRunId}`
  const thumbnailArtifact = await uploadArtifact(input.gcsStore, {
    localPath: thumbnail.outputPath,
    bucketName: input.source.bucketName,
    objectPath: `${basePath}/timeline-thumbnail.jpg`,
    contentType: thumbnail.mimeType,
    metadata: { smokeRunId: input.smokeRunId, canary: STAGING_TIMELINE_COMPOSITION_CANARY_MODE, artifact: 'timeline-thumbnail' },
    objectPurpose: 'thumbnail',
  })
  const source = {
    bucketName: input.source.bucketName,
    objectPath: input.source.objectPath,
    storageObjectId: input.sourceStorageObjectId,
    mediaAssetId: input.sourceMediaAssetId,
    mimeType: 'video/mp4' as const,
    sizeBytes: input.source.sizeBytes,
    checksumSha256: input.source.checksumSha256,
    durationSeconds: TINY_TIMELINE.durationSeconds,
    width: TINY_TIMELINE.width,
    height: TINY_TIMELINE.height,
    fps: TINY_TIMELINE.fps,
  }
  const timeline = buildFixedTimelineCompositionSpec({
    smokeRunId: input.smokeRunId,
    source,
  })
  const analysis = buildMediaAnalysisReport({
    smokeRunId: input.smokeRunId,
    source,
    probe,
    thumbnail: {
      ...thumbnailArtifact,
      width: thumbnail.width,
      height: thumbnail.height,
      smokeTraceable: thumbnailArtifact.objectPath.includes(input.smokeRunId),
    },
    audio,
    optionalReadiness: input.optionalReadiness,
  })
  const analysisSummary: TimelineAnalysisSummary = {
    probe: analysis.probe,
    thumbnail: analysis.thumbnail,
    audio: analysis.audio,
    optionalReadiness: analysis.optionalReadiness,
  }
  const reportPath = path.join(input.tempDir, 'timeline-analysis-report.json')
  const timelinePath = path.join(input.tempDir, 'timeline-spec.json')
  await writeJson(reportPath, analysis)
  await writeJson(timelinePath, timeline)
  const jsonArtifacts = await Promise.all([
    uploadArtifact(input.gcsStore, {
      localPath: reportPath,
      bucketName: input.source.bucketName,
      objectPath: `${basePath}/timeline-analysis-report.json`,
      contentType: 'application/json',
      metadata: { smokeRunId: input.smokeRunId, canary: STAGING_TIMELINE_COMPOSITION_CANARY_MODE, artifact: 'timeline-analysis-report' },
      objectPurpose: 'qa_artifact',
    }),
    uploadArtifact(input.gcsStore, {
      localPath: timelinePath,
      bucketName: input.source.bucketName,
      objectPath: `${basePath}/timeline-spec.json`,
      contentType: 'application/json',
      metadata: { smokeRunId: input.smokeRunId, canary: STAGING_TIMELINE_COMPOSITION_CANARY_MODE, artifact: 'timeline-spec' },
      objectPurpose: 'qa_artifact',
    }),
  ])

  return {
    analysis: analysisSummary,
    analysisArtifacts: [
      thumbnailArtifact,
      ...jsonArtifacts,
    ].map((artifact): PersistedMediaAnalysisArtifactRecord => ({
      bucketName: artifact.bucketName,
      objectPath: artifact.objectPath,
      mimeType: artifact.mimeType,
      sizeBytes: artifact.sizeBytes,
      checksumSha256: artifact.checksumSha256,
      objectPurpose: artifact.objectPurpose,
    })),
    timeline,
  }
}

class GoogleCloudTimelineCanaryStore implements TimelineCanaryGcsStore {
  private readonly storage: Storage

  constructor(projectId: string | undefined) {
    this.storage = new Storage(projectId ? { projectId } : undefined)
  }

  async uploadLocalFile(input: GcsObjectRef & {
    localPath: string
    contentType: string
    metadata: Record<string, string>
  }): Promise<void> {
    await this.storage.bucket(input.bucketName).upload(input.localPath, {
      destination: input.objectPath,
      metadata: {
        contentType: input.contentType,
        metadata: input.metadata,
      },
    })
  }

  async downloadToFile(input: GcsObjectRef & { localPath: string }): Promise<void> {
    await this.storage.bucket(input.bucketName).file(input.objectPath).download({
      destination: input.localPath,
    })
  }

  async exists(input: GcsObjectRef): Promise<boolean> {
    const [exists] = await this.storage.bucket(input.bucketName).file(input.objectPath).exists()
    return exists
  }

  async delete(input: GcsObjectRef): Promise<boolean> {
    const file = this.storage.bucket(input.bucketName).file(input.objectPath)
    const [exists] = await file.exists()
    if (!exists) return false
    await file.delete()
    return true
  }
}

async function uploadArtifact(store: TimelineCanaryGcsStore, input: {
  localPath: string
  bucketName: string
  objectPath: string
  contentType: string
  metadata: Record<string, string>
  objectPurpose: PersistedMediaAnalysisArtifactRecord['objectPurpose']
}): Promise<PersistedMediaAnalysisArtifactRecord> {
  const bytes = await readFile(input.localPath)
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
  await store.uploadLocalFile({
    bucketName: input.bucketName,
    objectPath: input.objectPath,
    localPath: input.localPath,
    contentType: input.contentType,
    metadata: input.metadata,
  })
  if (!await store.exists({ bucketName: input.bucketName, objectPath: input.objectPath })) {
    throw new Error('TIMELINE_COMPOSITION_ARTIFACT_NOT_SMOKE_TAGGED: uploaded analysis artifact was not readable in GCS.')
  }
  return {
    bucketName: input.bucketName,
    objectPath: input.objectPath,
    mimeType: input.contentType,
    sizeBytes: bytes.byteLength,
    checksumSha256,
    objectPurpose: input.objectPurpose,
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function cleanupGcsObjects(
  store: TimelineCanaryGcsStore,
  records: GcsObjectRef[],
): Promise<TimelineCompositionCanaryResult['gcsCleanup']> {
  const deleted: GcsObjectRef[] = []
  const errors: string[] = []
  const warnings: string[] = []
  for (const record of uniqueGcsRefs(records).reverse()) {
    if (!isSmokeGcsObject(record)) {
      errors.push(`${record.bucketName}/${record.objectPath}: cleanup refused because object is not smoke-scoped`)
      continue
    }
    try {
      const didDelete = await store.delete(record)
      const exists = await store.exists(record)
      if (didDelete || !exists) deleted.push(record)
      if (exists) errors.push(`${record.bucketName}/${record.objectPath}: object still exists after cleanup`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'delete failed'
      try {
        const exists = await store.exists(record)
        if (!exists) {
          deleted.push(record)
          warnings.push(`${record.bucketName}/${record.objectPath}: ${message}; exact readback confirmed the object was already gone.`)
        } else {
          errors.push(`${record.bucketName}/${record.objectPath}: ${message}; object still exists after cleanup failure`)
        }
      } catch (readbackError) {
        errors.push(`${record.bucketName}/${record.objectPath}: ${message}; cleanup state could not be verified after delete error: ${readbackError instanceof Error ? readbackError.message : 'readback failed'}`)
      }
    }
  }
  return { attempted: true, deleted, errors, warnings }
}

function buildStrictValidation(
  result: Awaited<ReturnType<typeof runPersistedGcsTimelineCompositionSmoke>>,
  gcsCleanup: TimelineCompositionCanaryResult['gcsCleanup'],
  timelinePreparation: TimelinePreparationResult | undefined,
): TimelineCompositionCanaryResult['strictValidation'] {
  const renderSmoke = result.renderSmoke && typeof result.renderSmoke === 'object' && !Array.isArray(result.renderSmoke)
    ? result.renderSmoke as Record<string, unknown>
    : undefined
  const previewRender = renderSmoke?.previewRender && typeof renderSmoke.previewRender === 'object' && !Array.isArray(renderSmoke.previewRender)
    ? renderSmoke.previewRender as Record<string, unknown>
    : undefined
  const commandSummary = previewRender?.commandSummary && typeof previewRender.commandSummary === 'object' && !Array.isArray(previewRender.commandSummary)
    ? previewRender.commandSummary as Record<string, unknown>
    : undefined
  const outputArtifactSummary = renderSmoke?.outputArtifactSummary && typeof renderSmoke.outputArtifactSummary === 'object' && !Array.isArray(renderSmoke.outputArtifactSummary)
    ? renderSmoke.outputArtifactSummary as Record<string, unknown>
    : undefined
  const events = Array.isArray(renderSmoke?.events)
    ? renderSmoke.events.filter((event): event is Record<string, unknown> => Boolean(event && typeof event === 'object' && !Array.isArray(event)))
    : []
  const blockers: string[] = []
  if (!result.ok || result.status !== 'passed') blockers.push(result.error?.message ?? 'Timeline composition canary did not pass.')
  if (renderSmoke?.status !== 'preview_ready') blockers.push('Timeline composition canary did not reach preview_ready.')
  if (renderSmoke?.renderExecutionMode !== STAGING_TIMELINE_COMPOSITION_CANARY_MODE) blockers.push(`Render execution mode was not ${STAGING_TIMELINE_COMPOSITION_CANARY_MODE}.`)
  if (commandSummary?.cloudRunInvoked !== true) blockers.push('Cloud Run invocation was not confirmed.')
  if (commandSummary?.remotionRenderMediaInvoked !== true) blockers.push('Remotion renderMedia invocation was not confirmed.')
  if (commandSummary?.remotionBundleInvoked !== true) blockers.push('Remotion bundle invocation was not confirmed.')
  if (commandSummary?.remotionSelectCompositionInvoked !== true) blockers.push('Remotion selectComposition invocation was not confirmed.')
  if (commandSummary?.timelineCompositionRendered !== true) blockers.push('Timeline composition render was not confirmed.')
  if (commandSummary?.captionPlaceholderLayerRendered !== true) blockers.push('Caption placeholder layer was not confirmed.')
  if (commandSummary?.safeZoneOverlayRendered !== true) blockers.push('Safe-zone overlay layer was not confirmed.')
  if (outputArtifactSummary?.smokeTraceable !== true) blockers.push('Preview artifact was not smoke-traceable.')
  if (!timelinePreparation?.timeline || timelinePreparation.timeline.segments.length !== 1) blockers.push('Timeline spec did not include exactly one segment.')
  if (!result.cleanup?.attempted) blockers.push('Supabase cleanup was not attempted.')
  if ((result.cleanup?.errors ?? []).length > 0) blockers.push(`Supabase cleanup reported ${(result.cleanup?.errors ?? []).length} error(s).`)
  if (!gcsCleanup.attempted) blockers.push('GCS cleanup was not attempted.')
  if (gcsCleanup.errors.length > 0) blockers.push(`GCS cleanup reported ${gcsCleanup.errors.length} error(s).`)
  if ((result.leftoverRecords ?? []).length > 0) blockers.push(`Supabase cleanup left ${(result.leftoverRecords ?? []).length} record(s).`)
  if ((result.leftoverQueryErrors ?? []).length > 0) blockers.push(`Supabase leftover check reported ${(result.leftoverQueryErrors ?? []).length} query error(s).`)

  return {
    ok: blockers.length === 0,
    blockers,
    renderExecutionMode: typeof renderSmoke?.renderExecutionMode === 'string' ? renderSmoke.renderExecutionMode : undefined,
    finalRenderStatus: typeof renderSmoke?.status === 'string' ? renderSmoke.status : undefined,
    outputArtifactSummary,
    jobStatusTransitionsObserved: events.map((event) => ({
      eventName: event.eventName,
      eventType: event.eventType,
      status: event.status,
      jobEventId: event.jobEventId,
    })),
    cleanupDeletedCount: result.cleanup?.deleted.length ?? 0,
    gcsCleanupDeletedCount: gcsCleanup.deleted.length,
    noProductionFlowsRan: true,
    noStripePaymentFlowsRan: true,
    noExternalProviderGenerationCallsRan: true,
    noBroadE2eSuiteRan: true,
    noCustomerMediaUsed: true,
    noQueueDrainRan: true,
  }
}

function failedResult(
  blockers: string[],
  input: { status?: TimelineCompositionCanaryResult['status']; ok?: boolean } = {},
): TimelineCompositionCanaryResult {
  return {
    ok: input.ok ?? false,
    status: input.status ?? 'failed',
    optionalReadiness: [],
    gcsCleanup: { attempted: false, deleted: [], errors: [] },
    strictValidation: {
      ok: false,
      blockers,
      jobStatusTransitionsObserved: [],
      cleanupDeletedCount: 0,
      gcsCleanupDeletedCount: 0,
      noProductionFlowsRan: true,
      noStripePaymentFlowsRan: true,
      noExternalProviderGenerationCallsRan: true,
      noBroadE2eSuiteRan: true,
      noCustomerMediaUsed: true,
      noQueueDrainRan: true,
    },
    warnings: [],
    error: blockers.length > 0 ? {
      code: stableErrorCodeFromMessages(blockers) ?? 'staging_timeline_composition_canary_failed',
      message: blockers.join('; '),
    } : undefined,
  }
}

function validateRuntimeInputs(
  env: ServiceContext['env'],
  sourceEnv: Record<string, string | undefined>,
  allowTimelineComposition: boolean,
): string[] {
  const blockers: string[] = []
  if (env.supabaseE2eSmokeMode !== 'live' || !env.hasSupabaseAdmin) {
    blockers.push('SUPABASE_E2E_SMOKE_MODE=live with staging Supabase service-role env is required.')
  }
  if (env.storageMode !== 'gcs') blockers.push('TIMELINE_COMPOSITION_GCS_REQUIRED: STORAGE_MODE=gcs is required for the staging timeline composition canary.')
  if (!env.supabaseE2eAllowWrites) blockers.push('SUPABASE_E2E_ALLOW_WRITES=true is required.')
  if (!env.supabaseE2eCleanup) blockers.push('SUPABASE_E2E_CLEANUP=true is required.')
  if (sourceEnv.SUPABASE_E2E_ALLOW_RENDER_EXECUTION !== 'true') blockers.push('SUPABASE_E2E_ALLOW_RENDER_EXECUTION=true is required.')
  if (sourceEnv.SUPABASE_E2E_ALLOW_CLOUD_RUN !== 'true') blockers.push('SUPABASE_E2E_ALLOW_CLOUD_RUN=true is required.')
  if (!allowTimelineComposition || !env.supabaseE2eAllowTimelineComposition) blockers.push('TIMELINE_COMPOSITION_NOT_ALLOWED: SUPABASE_E2E_ALLOW_TIMELINE_COMPOSITION=true is required.')
  if (!env.supabaseE2eUserId) blockers.push('SUPABASE_E2E_USER_ID is required.')
  if (Object.entries(sourceEnv).some(([name, value]) => Boolean(value?.trim()) && /^(STRIPE|PAYMENT|BILLING|OPENAI|WAN_|HAILUO|VEO|LYRIA|MIRELO|MMAUDIO)/i.test(name))) {
    blockers.push('Provider, Stripe, payment, and billing env must be absent for this staging canary.')
  }
  if ([env.supabaseUrl, env.googleCloudProjectId, env.gcsSourceMediaBucket, env.gcsPreviewsBucket].some((value) => value && PRODUCTION_WORD_PATTERN.test(value))) {
    blockers.push('Production-looking Supabase, GCP project, or GCS bucket config is not allowed.')
  }
  if (!env.gcsSourceMediaBucket || !isSafeCanaryBucket(env.gcsSourceMediaBucket)) {
    blockers.push('GCS_SOURCE_MEDIA_BUCKET must be staging smoke/canary-scoped.')
  }
  if (!env.gcsPreviewsBucket || !isSafeCanaryBucket(env.gcsPreviewsBucket)) {
    blockers.push('GCS_PREVIEWS_BUCKET must be staging smoke/canary-scoped.')
  }
  return blockers
}

function validatePreviousLeftovers(checks: NonNullable<StagingTimelineCompositionCanaryPreflightInput['previousSmokeLeftoverChecks']>): string[] {
  const blockers: string[] = []
  for (const check of checks) {
    if (check.error) blockers.push(`${check.label} leftover check failed: ${check.error}`)
    if (check.smokeRunId && !SMOKE_RUN_PATTERN.test(check.smokeRunId)) blockers.push(`${check.label} smokeRunId is invalid.`)
    if (check.ok === false) blockers.push(`${check.label} previous smoke leftover check did not pass.`)
    if ((check.leftovers ?? []).length > 0) blockers.push(`${check.label} previous smoke leftover check found ${(check.leftovers ?? []).length} record(s).`)
    if ((check.queryErrors ?? []).length > 0) blockers.push(`${check.label} previous smoke leftover check reported ${(check.queryErrors ?? []).length} query error(s).`)
  }
  return blockers
}

function preflightResult(
  status: StagingTimelineCompositionCanaryPreflightResult['status'],
  blockers: string[],
  env: ServiceContext['env'],
  allowRenderExecution: boolean,
  allowCloudRun: boolean,
  allowTimelineComposition: boolean,
): StagingTimelineCompositionCanaryPreflightResult {
  return {
    ok: status !== 'blocked',
    status,
    blockers,
    strictValidation: {
      ok: blockers.length === 0,
      allowWritesAcknowledged: env.supabaseE2eAllowWrites,
      allowRenderExecutionAcknowledged: allowRenderExecution,
      allowCloudRunAcknowledged: allowCloudRun,
      allowTimelineCompositionAcknowledged: allowTimelineComposition && env.supabaseE2eAllowTimelineComposition,
      cleanupAcknowledged: env.supabaseE2eCleanup,
      stagingOnly: env.supabaseE2eSmokeMode === 'live' && env.hasSupabaseAdmin,
      mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
      requiredTools: ['ffmpeg', 'ffprobe', 'remotion'],
      noProductionFlowsRan: true,
      noStripePaymentFlowsRan: true,
      noExternalProviderGenerationCallsRan: true,
      noBroadE2eSuiteRan: true,
      noCustomerMediaUsed: true,
      noQueueDrainRan: true,
    },
  }
}

function extractOptionalReadiness(readiness: EditingToolReadinessSummary): OptionalAnalysisReadiness[] {
  const optionalIds = new Set(['pyscenedetect', 'whisper', 'opencv', 'audioflux'])
  return readiness.checks
    .filter((check) => optionalIds.has(check.toolId))
    .map((check) => ({
      toolId: check.toolId as OptionalAnalysisReadiness['toolId'],
      status: check.status === 'passed' ? 'passed' : check.status === 'missing' ? 'missing' : check.status === 'failed' ? 'failed' : check.status === 'blocked' ? 'blocked' : 'warning',
      enabled: false,
      required: false,
      summary: check.summary,
    }))
}

function assertSmokeObject(record: GcsObjectRef, smokeRunId: string, segment: string, code: string): void {
  if (!isSmokeGcsObject(record) || !record.objectPath.includes(segment) || !record.objectPath.includes(smokeRunId)) {
    throw new Error(`${code}: ${record.bucketName}/${record.objectPath} is not smoke-scoped.`)
  }
}

function isSmokeGcsObject(record: GcsObjectRef): boolean {
  return isSafeCanaryBucket(record.bucketName)
    && record.objectPath.startsWith('workspaces/')
    && record.objectPath.includes('/projects/')
    && (
      record.objectPath.includes('/source-media/rp-e2e-smoke-')
      || record.objectPath.includes('/media-analysis/rp-e2e-smoke-')
      || record.objectPath.includes('/previews/')
    )
    && !PRODUCTION_WORD_PATTERN.test(record.objectPath)
    && !record.objectPath.includes('customer-media')
    && !record.objectPath.includes('://')
}

function isSafeCanaryBucket(value: string): boolean {
  return /staging/i.test(value) && /canary|smoke/i.test(value) && !PRODUCTION_WORD_PATTERN.test(value)
}

function uniqueGcsRefs(records: GcsObjectRef[]): GcsObjectRef[] {
  const seen = new Set<string>()
  return records.filter((record) => {
    const key = `${record.bucketName}/${record.objectPath}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function stableErrorCodeFromMessages(blockers: string[]): string | undefined {
  const joined = blockers.join('; ')
  if (joined.includes('TIMELINE_COMPOSITION_GCS_REQUIRED')) return 'TIMELINE_COMPOSITION_GCS_REQUIRED'
  if (joined.includes('TIMELINE_COMPOSITION_NOT_ALLOWED')) return 'TIMELINE_COMPOSITION_NOT_ALLOWED'
  if (joined.includes('CLEANUP')) return 'TIMELINE_COMPOSITION_CLEANUP_REQUIRED'
  if (joined.includes('FFPROBE')) return 'TIMELINE_COMPOSITION_FFPROBE_REQUIRED'
  if (joined.includes('FFMPEG')) return 'TIMELINE_COMPOSITION_FFMPEG_REQUIRED'
  if (joined.includes('REMOTION')) return 'TIMELINE_COMPOSITION_REMOTION_REQUIRED'
  if (joined.includes('SOURCE_NOT_SMOKE_TAGGED')) return 'TIMELINE_COMPOSITION_SOURCE_NOT_SMOKE_TAGGED'
  if (joined.includes('ARTIFACT_NOT_SMOKE_TAGGED')) return 'TIMELINE_COMPOSITION_ARTIFACT_NOT_SMOKE_TAGGED'
  if (/signed URL/i.test(joined)) return 'TIMELINE_COMPOSITION_SIGNED_URL_CANONICAL_FORBIDDEN'
  return undefined
}
