import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Storage } from '@google-cloud/storage'
import { extractThumbnailFrame, checkAudioStreamWithFfmpeg } from '../media/ffmpeg-analysis'
import { probeMediaFile } from '../media/ffprobe'
import {
  buildMediaAnalysisReport,
  createMediaAnalysisSafetyFlags,
} from '../media/media-analysis-report'
import type {
  AudioStreamSummary,
  MediaAnalysisCanaryResult,
  MediaAnalysisReport,
  OptionalAnalysisReadiness,
} from '../media/media-analysis-contracts'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { normalizeStoragePath } from '../storage/storage-paths'
import type { EditingToolReadinessSummary } from '../tools/editing-tool-readiness'
import { runEditingToolReadiness } from '../tools/editing-tool-readiness'
import type { ServiceContext } from '../types'
import {
  runPersistedGcsMediaAnalysisSmoke,
  type PersistedMediaAnalysisArtifactRecord,
  type PersistedRenderSourceFixtureFactoryResult,
} from './supabase-e2e-smoke-service'
import type { SupabaseSmokeLeftoverRecord } from './supabase-smoke-leftover-service'

const MEDIA_ANALYSIS_MODE = 'staging_media_analysis_canary'
const SMOKE_RUN_PATTERN = /^rp-e2e-smoke-[0-9a-f-]{36}$/i
const PRODUCTION_WORD_PATTERN = /\b(prod|production|live)\b/i
const SOURCE_FILE_NAME = 'tiny-media-analysis-source.mp4'
const TINY_FIXTURE = {
  durationSeconds: 3,
  width: 160,
  height: 90,
  fps: 15,
}

export interface StagingMediaAnalysisCanaryPreflightInput {
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

export interface StagingMediaAnalysisCanaryPreflightResult {
  ok: boolean
  status: 'skipped' | 'blocked' | 'ready'
  blockers: string[]
  strictValidation: {
    ok: boolean
    mode: typeof MEDIA_ANALYSIS_MODE
    allowWritesAcknowledged: boolean
    allowMediaAnalysisAcknowledged: boolean
    cleanupAcknowledged: boolean
    stagingOnly: boolean
    requiredTools: ['ffmpeg', 'ffprobe']
    remotionRequired: false
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

export interface MediaAnalysisGcsStore {
  uploadLocalFile(input: GcsObjectRef & {
    localPath: string
    contentType: string
    metadata: Record<string, string>
  }): Promise<void>
  downloadToFile(input: GcsObjectRef & { localPath: string }): Promise<void>
  exists(input: GcsObjectRef): Promise<boolean>
  delete(input: GcsObjectRef): Promise<boolean>
}

export interface MediaAnalysisExecutionResult {
  report: MediaAnalysisReport
  artifacts: PersistedMediaAnalysisArtifactRecord[]
}

export interface StagingMediaAnalysisCanaryDeps {
  sourceEnv?: Record<string, string | undefined>
  gcsStore?: MediaAnalysisGcsStore
  runToolReadiness?: (input: {
    strict: boolean
    requiredToolIds: ['ffmpeg', 'ffprobe']
    sourceEnv: Record<string, string | undefined>
  }) => Promise<EditingToolReadinessSummary>
  createSourceFixture?: (input: {
    smokeRunId: string
    localPath: string
    tempDir: string
    context: ServiceContext
  }) => Promise<PersistedRenderSourceFixtureFactoryResult & { localPath: string }>
  analyzeSource?: (input: {
    smokeRunId: string
    workspaceId: string
    projectId: string
    source: GcsObjectRef & {
      sizeBytes: number
      checksumSha256: string
    }
    tempDir: string
    context: ServiceContext
    gcsStore: MediaAnalysisGcsStore
    optionalReadiness: OptionalAnalysisReadiness[]
  }) => Promise<MediaAnalysisExecutionResult>
  runPersistedSmoke?: typeof runPersistedGcsMediaAnalysisSmoke
}

export function evaluateStagingMediaAnalysisCanaryPreflight(
  input: StagingMediaAnalysisCanaryPreflightInput,
): StagingMediaAnalysisCanaryPreflightResult {
  const allowMediaAnalysis = input.sourceEnv.SUPABASE_E2E_ALLOW_MEDIA_ANALYSIS === 'true'
  if (
    input.expectDisabled &&
    (
      input.env.supabaseE2eSmokeMode !== 'live' ||
      !input.env.supabaseE2eAllowWrites ||
      !allowMediaAnalysis
    )
  ) {
    return preflightResult('skipped', [], input.env, allowMediaAnalysis)
  }

  const blockers = [
    ...validateRuntimeInputs(input.env, input.sourceEnv, allowMediaAnalysis),
    ...validatePreviousLeftovers(input.previousSmokeLeftoverChecks ?? []),
  ]
  return preflightResult(blockers.length > 0 ? 'blocked' : 'ready', blockers, input.env, allowMediaAnalysis)
}

export async function runStagingMediaAnalysisCanary(
  context: ServiceContext,
  deps: StagingMediaAnalysisCanaryDeps = {},
): Promise<MediaAnalysisCanaryResult> {
  const sourceEnv = deps.sourceEnv ?? process.env
  const preflight = evaluateStagingMediaAnalysisCanaryPreflight({
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
    requiredToolIds: ['ffmpeg', 'ffprobe']
    sourceEnv: Record<string, string | undefined>
  }) => runEditingToolReadiness({
    ...input,
    sourceEnv: input.sourceEnv as NodeJS.ProcessEnv,
  }))
  const readiness = await runReadiness({
    strict: true,
    requiredToolIds: ['ffmpeg', 'ffprobe'],
    sourceEnv,
  })
  const requiredMissing = readiness.missingRequiredToolIds
  if (requiredMissing.includes('ffprobe')) return failedResult(['MEDIA_ANALYSIS_FFPROBE_REQUIRED: FFprobe is required for RP-MEDIA-01.'])
  if (requiredMissing.includes('ffmpeg')) return failedResult(['MEDIA_ANALYSIS_FFMPEG_REQUIRED: FFmpeg is required for RP-MEDIA-01.'])
  const optionalReadiness = extractOptionalReadiness(readiness)

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'rp-media-analysis-canary-'))
  const gcsStore = deps.gcsStore ?? new GoogleCloudMediaAnalysisStore(context.env.googleCloudProjectId)
  const runPersistedSmoke = deps.runPersistedSmoke ?? runPersistedGcsMediaAnalysisSmoke
  const gcsObjects: GcsObjectRef[] = []
  let sourceArtifact: MediaAnalysisCanaryResult['sourceArtifact']
  let analysisReport: MediaAnalysisReport | undefined

  try {
    const result = await runPersistedSmoke(context, {
      sourceFileName: SOURCE_FILE_NAME,
      sourceFixtureFactory: async ({ smokeRunId, bucketName, objectPath }) => {
        assertSmokeObject({ bucketName, objectPath }, smokeRunId, '/source-media/', 'MEDIA_ANALYSIS_SOURCE_NOT_SMOKE_TAGGED')
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
            canary: MEDIA_ANALYSIS_MODE,
            checksumSha256: fixture.checksumSha256,
          },
        })
        if (!await gcsStore.exists(ref)) {
          throw new Error('MEDIA_ANALYSIS_SOURCE_NOT_SMOKE_TAGGED: uploaded source fixture was not readable in GCS.')
        }
        gcsObjects.push(ref)
        sourceArtifact = {
          ...ref,
          sizeBytes: fixture.sizeBytes,
          checksumSha256: fixture.checksumSha256,
        }
        return fixture
      },
      analyzeSource: async (input) => {
        const analysis = await (deps.analyzeSource ?? executeDefaultMediaAnalysis)({
          smokeRunId: input.smokeRunId,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
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
        analysisReport = analysis.report
        for (const artifact of analysis.artifacts) {
          gcsObjects.push({ bucketName: artifact.bucketName, objectPath: artifact.objectPath })
        }
        return analysis
      },
    })

    const gcsCleanup = await cleanupGcsObjects(gcsStore, gcsObjects)
    const strictValidation = buildStrictValidation(result, gcsCleanup, analysisReport)
    return {
      ok: result.ok && result.status === 'passed' && strictValidation.ok,
      status: result.ok && result.status === 'passed' && strictValidation.ok ? 'passed' : 'failed',
      smokeRunId: result.records?.smokeRunId,
      sourceArtifact,
      analysisArtifacts: analysisReport?.thumbnail ? [analysisReport.thumbnail] : [],
      mediaProbe: analysisReport?.probe,
      audioSummary: analysisReport?.audio,
      optionalReadiness,
      report: analysisReport,
      cleanup: result.cleanup,
      gcsCleanup,
      leftoverRecords: result.leftoverRecords,
      leftoverQueryErrors: result.leftoverQueryErrors,
      strictValidation,
      warnings: [...readiness.warnings, ...result.warnings],
      error: strictValidation.ok ? result.error : {
        code: stableErrorCodeFromMessages(strictValidation.blockers) ?? 'staging_media_analysis_canary_failed',
        message: strictValidation.blockers.join('; '),
      },
    }
  } catch (error) {
    const gcsCleanup = await cleanupGcsObjects(gcsStore, gcsObjects)
    return {
      ...failedResult([error instanceof Error ? error.message : 'Staging media analysis canary failed.']),
      sourceArtifact,
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
    durationSeconds: TINY_FIXTURE.durationSeconds,
    width: TINY_FIXTURE.width,
    height: TINY_FIXTURE.height,
    fps: TINY_FIXTURE.fps,
  })
  if (!fixture.available || !fixture.sizeBytes || !fixture.checksumSha256) {
    throw new Error(`MEDIA_ANALYSIS_FFMPEG_REQUIRED: FFmpeg could not create the media analysis fixture: ${fixture.warnings.join('; ')}`)
  }
  return {
    localPath: input.localPath,
    sizeBytes: fixture.sizeBytes,
    checksumSha256: fixture.checksumSha256,
    durationSeconds: TINY_FIXTURE.durationSeconds,
    width: TINY_FIXTURE.width,
    height: TINY_FIXTURE.height,
    fps: TINY_FIXTURE.fps,
  }
}

async function executeDefaultMediaAnalysis(input: {
  smokeRunId: string
  workspaceId: string
  projectId: string
  source: GcsObjectRef & { sizeBytes: number; checksumSha256: string }
  tempDir: string
  context: ServiceContext
  gcsStore: MediaAnalysisGcsStore
  optionalReadiness: OptionalAnalysisReadiness[]
}): Promise<MediaAnalysisExecutionResult> {
  assertSmokeObject(input.source, input.smokeRunId, '/source-media/', 'MEDIA_ANALYSIS_SOURCE_NOT_SMOKE_TAGGED')
  const downloadedSourcePath = path.join(input.tempDir, `${input.smokeRunId}-downloaded-source.mp4`)
  await input.gcsStore.downloadToFile({ ...input.source, localPath: downloadedSourcePath })
  const probe = await probeMediaFile(downloadedSourcePath, {
    ffprobeBin: input.context.env.ffprobeBin,
    timeoutMs: input.context.env.toolCheckTimeoutMs,
  })
  const thumbnailPath = path.join(input.tempDir, 'thumbnail.jpg')
  const thumbnail = await extractThumbnailFrame({
    inputPath: downloadedSourcePath,
    outputPath: thumbnailPath,
    localStorageRoot: input.tempDir,
    ffmpegBin: input.context.env.ffmpegBin,
    timeoutMs: input.context.env.toolCheckTimeoutMs,
    width: TINY_FIXTURE.width,
    height: TINY_FIXTURE.height,
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

  const basePath = mediaAnalysisBasePath(input.workspaceId, input.projectId, input.smokeRunId)
  const thumbnailArtifact = await uploadArtifact(input.gcsStore, {
    localPath: thumbnail.outputPath,
    bucketName: input.source.bucketName,
    objectPath: `${basePath}/thumbnail.jpg`,
    contentType: thumbnail.mimeType,
    metadata: { smokeRunId: input.smokeRunId, canary: MEDIA_ANALYSIS_MODE, artifact: 'thumbnail' },
    objectPurpose: 'thumbnail',
  })
  const report = buildMediaAnalysisReport({
    smokeRunId: input.smokeRunId,
    source: {
      bucketName: input.source.bucketName,
      objectPath: input.source.objectPath,
      mimeType: 'video/mp4',
      sizeBytes: input.source.sizeBytes,
      checksumSha256: input.source.checksumSha256,
    },
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
  const probePath = path.join(input.tempDir, 'probe-summary.json')
  const audioPath = path.join(input.tempDir, 'audio-summary.json')
  const reportPath = path.join(input.tempDir, 'media-analysis-report.json')
  await writeJson(probePath, probe)
  await writeJson(audioPath, audio)
  await writeJson(reportPath, report)

  const jsonArtifacts = await Promise.all([
    uploadArtifact(input.gcsStore, {
      localPath: probePath,
      bucketName: input.source.bucketName,
      objectPath: `${basePath}/probe-summary.json`,
      contentType: 'application/json',
      metadata: { smokeRunId: input.smokeRunId, canary: MEDIA_ANALYSIS_MODE, artifact: 'probe-summary' },
      objectPurpose: 'qa_artifact',
    }),
    uploadArtifact(input.gcsStore, {
      localPath: audioPath,
      bucketName: input.source.bucketName,
      objectPath: `${basePath}/audio-summary.json`,
      contentType: 'application/json',
      metadata: { smokeRunId: input.smokeRunId, canary: MEDIA_ANALYSIS_MODE, artifact: 'audio-summary' },
      objectPurpose: 'qa_artifact',
    }),
    uploadArtifact(input.gcsStore, {
      localPath: reportPath,
      bucketName: input.source.bucketName,
      objectPath: `${basePath}/media-analysis-report.json`,
      contentType: 'application/json',
      metadata: { smokeRunId: input.smokeRunId, canary: MEDIA_ANALYSIS_MODE, artifact: 'media-analysis-report' },
      objectPurpose: 'qa_artifact',
    }),
  ])

  return {
    report,
    artifacts: [
      {
        ...thumbnailArtifact,
        objectPurpose: 'thumbnail',
      },
      ...jsonArtifacts,
    ],
  }
}

async function uploadArtifact(
  store: MediaAnalysisGcsStore,
  input: GcsObjectRef & {
    localPath: string
    contentType: string
    metadata: Record<string, string>
    objectPurpose: PersistedMediaAnalysisArtifactRecord['objectPurpose']
  },
): Promise<PersistedMediaAnalysisArtifactRecord> {
  assertSmokeObject(input, input.metadata.smokeRunId, '/media-analysis/', 'MEDIA_ANALYSIS_ARTIFACT_NOT_SMOKE_TAGGED')
  const bytes = await readFile(input.localPath)
  const sizeBytes = bytes.byteLength
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
  await store.uploadLocalFile(input)
  if (!await store.exists(input)) {
    throw new Error(`MEDIA_ANALYSIS_ARTIFACT_NOT_SMOKE_TAGGED: artifact ${input.objectPath} was not readable after upload.`)
  }
  return {
    bucketName: input.bucketName,
    objectPath: input.objectPath,
    mimeType: input.contentType,
    sizeBytes,
    checksumSha256,
    objectPurpose: input.objectPurpose,
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

class GoogleCloudMediaAnalysisStore implements MediaAnalysisGcsStore {
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
    await this.storage.bucket(input.bucketName).file(input.objectPath).download({ destination: input.localPath })
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

async function cleanupGcsObjects(
  store: MediaAnalysisGcsStore,
  records: GcsObjectRef[],
): Promise<MediaAnalysisCanaryResult['gcsCleanup']> {
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
  result: Awaited<ReturnType<typeof runPersistedGcsMediaAnalysisSmoke>>,
  gcsCleanup: MediaAnalysisCanaryResult['gcsCleanup'],
  report: MediaAnalysisReport | undefined,
): MediaAnalysisCanaryResult['strictValidation'] {
  const blockers: string[] = []
  if (!result.ok || result.status !== 'passed') blockers.push(result.error?.message ?? 'Media analysis canary did not pass.')
  if (!report) blockers.push('Media analysis report was not created.')
  if (!report?.probe.durationSeconds || !report.probe.width || !report.probe.height || !report.probe.videoCodec) {
    blockers.push('FFprobe summary is missing required media metadata.')
  }
  if (!report?.thumbnail.sizeBytes || !report.thumbnail.smokeTraceable) {
    blockers.push('FFmpeg thumbnail artifact was missing or not smoke-traceable.')
  }
  if (!report?.audio.checkedWithFfmpeg) blockers.push('FFmpeg audio stream presence check did not run.')
  if (!result.cleanup?.attempted) blockers.push('Supabase cleanup was not attempted.')
  if ((result.cleanup?.errors ?? []).length > 0) blockers.push(`Supabase cleanup reported ${(result.cleanup?.errors ?? []).length} error(s).`)
  if (!gcsCleanup.attempted) blockers.push('GCS cleanup was not attempted.')
  if (gcsCleanup.errors.length > 0) blockers.push(`GCS cleanup reported ${gcsCleanup.errors.length} error(s).`)
  if ((result.leftoverRecords ?? []).length > 0) blockers.push(`Supabase cleanup left ${(result.leftoverRecords ?? []).length} record(s).`)
  if ((result.leftoverQueryErrors ?? []).length > 0) blockers.push(`Supabase leftover check reported ${(result.leftoverQueryErrors ?? []).length} query error(s).`)

  return {
    ok: blockers.length === 0,
    blockers,
    cleanupDeletedCount: result.cleanup?.deleted.length ?? 0,
    gcsCleanupDeletedCount: gcsCleanup.deleted.length,
    safety: createMediaAnalysisSafetyFlags(),
  }
}

function failedResult(
  blockers: string[],
  input: { ok?: boolean; status?: MediaAnalysisCanaryResult['status'] } = {},
): MediaAnalysisCanaryResult {
  return {
    ok: input.ok ?? false,
    status: input.status ?? 'failed',
    analysisArtifacts: [],
    optionalReadiness: [],
    gcsCleanup: { attempted: false, deleted: [], errors: [] },
    strictValidation: {
      ok: false,
      blockers,
      cleanupDeletedCount: 0,
      gcsCleanupDeletedCount: 0,
      safety: createMediaAnalysisSafetyFlags(),
    },
    warnings: [],
    error: blockers.length > 0
      ? {
        code: stableErrorCodeFromMessages(blockers) ?? 'staging_media_analysis_canary_failed',
        message: blockers.join('; '),
      }
      : undefined,
  }
}

function preflightResult(
  status: 'skipped' | 'blocked' | 'ready',
  blockers: string[],
  env: ServiceContext['env'],
  allowMediaAnalysis: boolean,
): StagingMediaAnalysisCanaryPreflightResult {
  return {
    ok: status !== 'blocked',
    status,
    blockers,
    strictValidation: {
      ok: blockers.length === 0,
      mode: MEDIA_ANALYSIS_MODE,
      allowWritesAcknowledged: env.supabaseE2eAllowWrites,
      allowMediaAnalysisAcknowledged: allowMediaAnalysis,
      cleanupAcknowledged: env.supabaseE2eCleanup,
      stagingOnly: env.supabaseE2eSmokeMode === 'live' || status === 'skipped',
      requiredTools: ['ffmpeg', 'ffprobe'],
      remotionRequired: false,
      noProductionFlowsRan: true,
      noStripePaymentFlowsRan: true,
      noExternalProviderGenerationCallsRan: true,
      noBroadE2eSuiteRan: true,
      noCustomerMediaUsed: true,
      noQueueDrainRan: true,
    },
  }
}

function validateRuntimeInputs(
  env: ServiceContext['env'],
  sourceEnv: Record<string, string | undefined>,
  allowMediaAnalysis: boolean,
): string[] {
  const blockers: string[] = []
  if (env.supabaseE2eSmokeMode !== 'live') blockers.push('SUPABASE_E2E_SMOKE_MODE=live is required for staging media analysis.')
  if (!env.supabaseE2eAllowWrites) blockers.push('MEDIA_ANALYSIS_WRITES_DISABLED: SUPABASE_E2E_ALLOW_WRITES=true is required.')
  if (!allowMediaAnalysis) blockers.push('MEDIA_ANALYSIS_NOT_ALLOWED: SUPABASE_E2E_ALLOW_MEDIA_ANALYSIS=true is required.')
  if (!env.supabaseE2eCleanup) blockers.push('MEDIA_ANALYSIS_CLEANUP_REQUIRED: SUPABASE_E2E_CLEANUP=true is required.')
  if (env.storageMode !== 'gcs') blockers.push('MEDIA_ANALYSIS_GCS_REQUIRED: STORAGE_MODE=gcs is required.')
  if (!env.hasSupabaseAdmin) blockers.push('Live staging Supabase admin env is required.')
  if (!env.supabaseE2eUserId) blockers.push('SUPABASE_E2E_USER_ID is required.')
  if (env.googleCloudProjectId && PRODUCTION_WORD_PATTERN.test(env.googleCloudProjectId)) blockers.push('Production-looking GCP project is not allowed.')
  for (const bucket of [
    env.gcsSourceMediaBucket,
    env.gcsQaArtifactsBucket,
    env.gcsThumbnailsBucket,
  ]) {
    if (!bucket) blockers.push('Staging media analysis GCS buckets are required.')
    else if (!isSafeStagingBucket(bucket)) blockers.push(`Production-looking or non-smoke bucket is not allowed: ${bucket}.`)
  }
  const maxWaitSeconds = Number(sourceEnv.SUPABASE_E2E_MAX_WAIT_SECONDS ?? '180')
  if (!Number.isFinite(maxWaitSeconds) || maxWaitSeconds < 30 || maxWaitSeconds > 300) {
    blockers.push('SUPABASE_E2E_MAX_WAIT_SECONDS must be between 30 and 300.')
  }
  for (const [key, value] of Object.entries(sourceEnv)) {
    const name = key.toLowerCase()
    if (!value) continue
    if (name.includes('stripe')) blockers.push('Stripe/payment env must be disabled for media analysis canary.')
    if (name.includes('openai') || name.includes('wan') || name.includes('hailuo') || name.includes('veo') || name.includes('lyria') || name.includes('mirelo') || name.includes('mmaudio')) {
      blockers.push('Provider env must be disabled for media analysis canary.')
    }
    if (name.includes('queue_drain') && value === 'true') blockers.push('Queue drain is not allowed for media analysis canary.')
  }
  return blockers
}

function validatePreviousLeftovers(
  checks: NonNullable<StagingMediaAnalysisCanaryPreflightInput['previousSmokeLeftoverChecks']>,
): string[] {
  const blockers: string[] = []
  for (const check of checks) {
    if (check.error) blockers.push(`${check.label}: ${check.error}`)
    if (check.smokeRunId && !SMOKE_RUN_PATTERN.test(check.smokeRunId)) blockers.push(`${check.label}: invalid smoke run id`)
    if (check.ok === false) blockers.push(`${check.label}: leftover check failed`)
    for (const leftover of check.leftovers ?? []) blockers.push(`${check.label}: leftover ${leftover.table}/${leftover.id}`)
    for (const queryError of check.queryErrors ?? []) blockers.push(`${check.label}: ${queryError}`)
  }
  return blockers
}

function extractOptionalReadiness(readiness: EditingToolReadinessSummary): OptionalAnalysisReadiness[] {
  const optionalIds = new Set(['pyscenedetect', 'whisper', 'opencv', 'audioflux'])
  return readiness.checks
    .filter((check) => optionalIds.has(check.toolId))
    .map((check) => ({
      toolId: check.toolId as OptionalAnalysisReadiness['toolId'],
      status: check.status,
      enabled: false,
      required: false,
      summary: check.summary,
    }))
}

function mediaAnalysisBasePath(workspaceId: string, projectId: string, smokeRunId: string): string {
  return normalizeStoragePath(`workspaces/${workspaceId}/projects/${projectId}/media-analysis/${smokeRunId}`)
}

function assertSmokeObject(
  ref: GcsObjectRef,
  smokeRunId: string | undefined,
  requiredSegment: string,
  code: string,
): void {
  const normalized = normalizeStoragePath(ref.objectPath)
  if (
    !smokeRunId ||
    !SMOKE_RUN_PATTERN.test(smokeRunId) ||
    !normalized.startsWith('workspaces/') ||
    !normalized.includes(requiredSegment) ||
    !normalized.includes(`/${smokeRunId}/`) ||
    normalized.includes('customer-media') ||
    normalized.includes('signed')
  ) {
    throw new Error(`${code}: ${ref.bucketName}/${ref.objectPath} is not a smoke-scoped canonical object.`)
  }
}

function isSmokeGcsObject(ref: GcsObjectRef): boolean {
  const normalized = ref.objectPath.replace(/\\/g, '/')
  return normalized.startsWith('workspaces/')
    && normalized.includes('/rp-e2e-smoke-')
    && !normalized.includes('customer-media')
    && !normalized.includes('signed')
    && !PRODUCTION_WORD_PATTERN.test(ref.bucketName)
}

function uniqueGcsRefs(records: GcsObjectRef[]): GcsObjectRef[] {
  return Array.from(new Map(records.map((record) => [`${record.bucketName}/${record.objectPath}`, record])).values())
}

function isSafeStagingBucket(bucket: string): boolean {
  return !PRODUCTION_WORD_PATTERN.test(bucket) && /staging/i.test(bucket) && /(smoke|canary)/i.test(bucket)
}

function stableErrorCodeFromMessages(messages: string[]): string | undefined {
  const joined = messages.join(' ')
  const codes = [
    'MEDIA_ANALYSIS_WRITES_DISABLED',
    'MEDIA_ANALYSIS_NOT_ALLOWED',
    'MEDIA_ANALYSIS_CLEANUP_REQUIRED',
    'MEDIA_ANALYSIS_GCS_REQUIRED',
    'MEDIA_ANALYSIS_FFPROBE_REQUIRED',
    'MEDIA_ANALYSIS_FFMPEG_REQUIRED',
    'MEDIA_ANALYSIS_SOURCE_NOT_SMOKE_TAGGED',
    'MEDIA_ANALYSIS_ARTIFACT_NOT_SMOKE_TAGGED',
    'MEDIA_ANALYSIS_SIGNED_URL_CANONICAL_FORBIDDEN',
  ]
  return codes.find((code) => joined.includes(code))
}
