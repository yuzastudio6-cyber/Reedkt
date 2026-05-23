import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Storage } from '@google-cloud/storage'
import {
  readRenderCanaryConfig,
  readRenderCanaryLimits,
  validateRenderCanaryConfig,
} from '../cloud-run/render-canary-config'
import { invokeStagingRealVideoUploadPreviewCanary } from '../cloud-run/render-canary-client'
import type {
  RealVideoUploadPreviewCanaryInvocationConfig,
  RenderCanaryInvocationResult,
} from '../cloud-run/render-canary-types'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { createSmokeRunId } from '../supabase/live-write-guard'
import type { ServiceContext } from '../types'
import { runPersistedBasicRenderSmoke, type PersistedRenderSourceFixtureFactoryResult } from './supabase-e2e-smoke-service'
import type { SupabaseSmokeLeftoverRecord } from './supabase-smoke-leftover-service'

const REAL_VIDEO_MODE = 'staging_real_video_upload_preview_canary'
const SMOKE_RUN_PATTERN = /^rp-e2e-smoke-[0-9a-f-]{36}$/i
const PRODUCTION_WORD_PATTERN = /\b(prod|production|live)\b/i
const SOURCE_FILE_NAME = 'tiny-source.mp4'
const TINY_FIXTURE = {
  durationSeconds: 3,
  width: 160,
  height: 90,
  fps: 15,
  maxFrames: 45,
}

export interface StagingRealVideoUploadPreviewCanaryPreflightInput {
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

export interface StagingRealVideoUploadPreviewCanaryPreflightResult {
  ok: boolean
  status: 'skipped' | 'blocked' | 'ready'
  blockers: string[]
  strictValidation: {
    ok: boolean
    allowWritesAcknowledged: boolean
    allowRenderExecutionAcknowledged: boolean
    allowCloudRunAcknowledged: boolean
    cleanupAcknowledged: boolean
    stagingOnly: boolean
    mode: typeof REAL_VIDEO_MODE
    noProductionFlowsRan: true
    noStripePaymentFlowsRan: true
    noExternalProviderGenerationCallsRan: true
    noBroadE2eSuiteRan: true
    noCustomerMediaUsed: true
    noQueueDrainRan: true
  }
}

export interface StagingRealVideoUploadPreviewCanaryResult {
  ok: boolean
  status: 'passed' | 'failed' | 'skipped'
  smokeRunId?: string
  renderSmoke?: unknown
  records?: Record<string, unknown>
  sourceArtifact?: GcsObjectRef
  previewArtifact?: GcsObjectRef
  gcsCleanup: {
    attempted: boolean
    deleted: GcsObjectRef[]
    errors: string[]
  }
  cleanup?: {
    attempted: boolean
    deleted: Array<{ table: string; id: string }>
    errors: string[]
  }
  leftoverRecords?: SupabaseSmokeLeftoverRecord[]
  leftoverQueryErrors?: string[]
  strictValidation: {
    ok: boolean
    blockers: string[]
    renderExecutionMode?: string
    finalRenderStatus?: string
    outputArtifactSummary?: Record<string, unknown>
    jobStatusTransitionsObserved: unknown[]
    cleanupDeletedCount: number
    gcsCleanupDeletedCount: number
    noProductionFlowsRan: true
    noStripePaymentFlowsRan: true
    noExternalProviderGenerationCallsRan: true
    noBroadE2eSuiteRan: true
    noCustomerMediaUsed: true
    noQueueDrainRan: true
  }
  warnings: string[]
  error?: {
    code: string
    message: string
  }
}

export interface GcsObjectRef {
  bucketName: string
  objectPath: string
}

export interface RealVideoCanaryGcsStore {
  uploadLocalFile(input: GcsObjectRef & {
    localPath: string
    contentType: string
    metadata: Record<string, string>
  }): Promise<void>
  exists(input: GcsObjectRef): Promise<boolean>
  delete(input: GcsObjectRef): Promise<boolean>
}

export interface StagingRealVideoUploadPreviewCanaryDeps {
  gcsStore?: RealVideoCanaryGcsStore
  invokeCloudRun?: (input: {
    smokeRunId: string
    config: RealVideoUploadPreviewCanaryInvocationConfig
  }) => Promise<RenderCanaryInvocationResult>
}

export function evaluateStagingRealVideoUploadPreviewCanaryPreflight(
  input: StagingRealVideoUploadPreviewCanaryPreflightInput,
): StagingRealVideoUploadPreviewCanaryPreflightResult {
  const sourceEnv = input.sourceEnv
  const allowRenderExecution = sourceEnv.SUPABASE_E2E_ALLOW_RENDER_EXECUTION === 'true'
  const allowCloudRun = sourceEnv.SUPABASE_E2E_ALLOW_CLOUD_RUN === 'true'
  const config = readRenderCanaryConfig(sourceEnv)
  const limits = readRenderCanaryLimits(sourceEnv)

  if (
    input.expectDisabled &&
    (
      input.env.supabaseE2eSmokeMode !== 'live' ||
      !input.env.supabaseE2eAllowWrites ||
      !allowRenderExecution ||
      !allowCloudRun
    )
  ) {
    return preflightResult('skipped', [], input.env, allowRenderExecution, allowCloudRun)
  }

  const configIssues = validateRenderCanaryConfig({
    config,
    limits,
    sourceEnv,
    allowRenderExecution,
    allowCloudRun,
    allowRemotion: true,
    cleanupAcknowledged: input.env.supabaseE2eCleanup,
  })
  const blockers = [
    ...validateRuntimeInputs(input.env, sourceEnv),
    ...configIssues.map((issue) => issue.message),
    ...validatePreviousLeftovers(input.previousSmokeLeftoverChecks ?? []),
  ]

  return preflightResult(blockers.length > 0 ? 'blocked' : 'ready', blockers, input.env, allowRenderExecution, allowCloudRun)
}

export async function runStagingRealVideoUploadPreviewCanary(
  context: ServiceContext,
  deps: StagingRealVideoUploadPreviewCanaryDeps = {},
): Promise<StagingRealVideoUploadPreviewCanaryResult> {
  const preflight = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
    env: context.env,
    sourceEnv: process.env,
  })
  if (!preflight.ok || preflight.status !== 'ready') {
    return {
      ok: preflight.status === 'skipped',
      status: preflight.status === 'skipped' ? 'skipped' : 'failed',
      gcsCleanup: { attempted: false, deleted: [], errors: [] },
      strictValidation: {
        ok: false,
        blockers: preflight.blockers,
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
      error: preflight.blockers.length > 0
        ? { code: 'real_video_upload_preview_canary_blocked', message: preflight.blockers.join('; ') }
        : undefined,
    }
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'rp-real-video-upload-preview-'))
  const gcsStore = deps.gcsStore ?? new GoogleCloudRealVideoCanaryStore(context.env.googleCloudProjectId)
  const invokeCloudRun = deps.invokeCloudRun ?? invokeStagingRealVideoUploadPreviewCanary
  const liveConfig = readRenderCanaryConfig(process.env)
  const sourceAndPreviewObjects: GcsObjectRef[] = []
  let sourceArtifact: GcsObjectRef | undefined
  let previewArtifact: GcsObjectRef | undefined

  try {
    const result = await runPersistedBasicRenderSmoke(context, {
      renderExecutionMode: REAL_VIDEO_MODE,
      sourceObjectOwner: 'smoke_run',
      sourceFileName: SOURCE_FILE_NAME,
      precreateRenderIdForOutputPath: true,
      sourceFixtureFactory: async ({ smokeRunId, bucketName, objectPath }) => {
        const localSourcePath = path.join(tempDir, `${smokeRunId}-source.mp4`)
        const fixture = await createSyntheticMp4Fixture({
          outputPath: localSourcePath,
          localStorageRoot: tempDir,
          ffmpegBin: context.env.ffmpegBin,
          timeoutMs: context.env.toolCheckTimeoutMs,
          durationSeconds: TINY_FIXTURE.durationSeconds,
          width: TINY_FIXTURE.width,
          height: TINY_FIXTURE.height,
          fps: TINY_FIXTURE.fps,
        })
        if (!fixture.available || !fixture.sizeBytes || !fixture.checksumSha256) {
          throw new Error(`FFmpeg could not create the real-video source fixture: ${fixture.warnings.join('; ')}`)
        }
        const ref = { bucketName, objectPath }
        await gcsStore.uploadLocalFile({
          ...ref,
          localPath: localSourcePath,
          contentType: 'video/mp4',
          metadata: {
            smokeRunId,
            canary: REAL_VIDEO_MODE,
            checksumSha256: fixture.checksumSha256,
          },
        })
        if (!await gcsStore.exists(ref)) {
          throw new Error('Uploaded source fixture was not readable in GCS.')
        }
        sourceArtifact = ref
        sourceAndPreviewObjects.push(ref)
        return {
          sizeBytes: fixture.sizeBytes,
          checksumSha256: fixture.checksumSha256,
          durationSeconds: TINY_FIXTURE.durationSeconds,
          width: TINY_FIXTURE.width,
          height: TINY_FIXTURE.height,
          fps: TINY_FIXTURE.fps,
        } satisfies PersistedRenderSourceFixtureFactoryResult
      },
      createExternalRenderArtifacts: async (input) => {
        if (!input.plannedRenderId || !input.outputBucketName || !input.outputObjectPath) {
          throw new Error('Real-video canary requires a precreated render id and canonical preview output path.')
        }
        if (!input.sourceBucketName || !input.sourceObjectPath || !input.sourceSizeBytes || !input.sourceChecksumSha256) {
          throw new Error('Real-video canary source metadata is incomplete.')
        }
        const invocation = await invokeCloudRun({
          smokeRunId: input.smokeRunId,
          config: {
            cloudRunUrl: liveConfig.cloudRunUrl!,
            audience: liveConfig.cloudRunAudience!,
            idToken: liveConfig.idToken!,
            durationSeconds: TINY_FIXTURE.durationSeconds,
            width: TINY_FIXTURE.width,
            height: TINY_FIXTURE.height,
            fps: TINY_FIXTURE.fps,
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
          },
        })
        previewArtifact = {
          bucketName: invocation.outputBucketName,
          objectPath: invocation.outputObjectPath,
        }
        sourceAndPreviewObjects.push(previewArtifact)
        return {
          outputBucketName: invocation.outputBucketName,
          outputObjectPath: invocation.outputObjectPath,
          durationSeconds: invocation.durationSeconds,
          sizeBytes: invocation.sizeBytes,
          checksumSha256: invocation.checksumSha256,
          mediaProbe: {
            durationSeconds: invocation.durationSeconds,
            width: invocation.width,
            height: invocation.height,
            videoCodec: 'h264',
            audioCodec: 'muted',
            formatName: 'mp4',
            sizeBytes: invocation.sizeBytes,
            streamCount: 1,
            rawSummary: {
              mode: REAL_VIDEO_MODE,
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

    const gcsCleanup = await cleanupGcsObjects(gcsStore, sourceAndPreviewObjects)
    const strictValidation = buildStrictValidation(result, gcsCleanup)
    return {
      ok: result.ok && result.status === 'passed' && strictValidation.ok,
      status: result.ok && result.status === 'passed' && strictValidation.ok ? 'passed' : 'failed',
      smokeRunId: result.records?.smokeRunId,
      renderSmoke: result.renderSmoke,
      records: result.records as Record<string, unknown> | undefined,
      sourceArtifact,
      previewArtifact,
      gcsCleanup,
      cleanup: result.cleanup,
      leftoverRecords: result.leftoverRecords,
      leftoverQueryErrors: result.leftoverQueryErrors,
      strictValidation,
      warnings: result.warnings,
      error: strictValidation.ok ? result.error : {
        code: 'real_video_upload_preview_canary_failed',
        message: strictValidation.blockers.join('; '),
      },
    }
  } catch (error) {
    const gcsCleanup = await cleanupGcsObjects(gcsStore, sourceAndPreviewObjects)
    return {
      ok: false,
      status: 'failed',
      sourceArtifact,
      previewArtifact,
      gcsCleanup,
      strictValidation: {
        ok: false,
        blockers: [error instanceof Error ? error.message : 'Real-video upload-to-preview canary failed.'],
        jobStatusTransitionsObserved: [],
        cleanupDeletedCount: 0,
        gcsCleanupDeletedCount: gcsCleanup.deleted.length,
        noProductionFlowsRan: true,
        noStripePaymentFlowsRan: true,
        noExternalProviderGenerationCallsRan: true,
        noBroadE2eSuiteRan: true,
        noCustomerMediaUsed: true,
        noQueueDrainRan: true,
      },
      warnings: [],
      error: {
        code: 'real_video_upload_preview_canary_failed',
        message: error instanceof Error ? error.message : 'Real-video upload-to-preview canary failed.',
      },
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

class GoogleCloudRealVideoCanaryStore implements RealVideoCanaryGcsStore {
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
  store: RealVideoCanaryGcsStore,
  records: GcsObjectRef[],
): Promise<StagingRealVideoUploadPreviewCanaryResult['gcsCleanup']> {
  const deleted: GcsObjectRef[] = []
  const errors: string[] = []
  for (const record of uniqueGcsRefs(records).reverse()) {
    if (!isSmokeGcsObject(record)) {
      errors.push(`${record.bucketName}/${record.objectPath}: cleanup refused because object is not smoke-scoped`)
      continue
    }
    try {
      const didDelete = await store.delete(record)
      const exists = await store.exists(record)
      if (didDelete || !exists) {
        deleted.push(record)
      }
      if (exists) {
        errors.push(`${record.bucketName}/${record.objectPath}: object still exists after cleanup`)
      }
    } catch (error) {
      errors.push(`${record.bucketName}/${record.objectPath}: ${error instanceof Error ? error.message : 'delete failed'}`)
    }
  }
  return { attempted: true, deleted, errors }
}

function buildStrictValidation(
  result: Awaited<ReturnType<typeof runPersistedBasicRenderSmoke>>,
  gcsCleanup: StagingRealVideoUploadPreviewCanaryResult['gcsCleanup'],
): StagingRealVideoUploadPreviewCanaryResult['strictValidation'] {
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
  if (!result.ok || result.status !== 'passed') blockers.push(result.error?.message ?? 'Real-video canary did not pass.')
  if (renderSmoke?.status !== 'preview_ready') blockers.push('Real-video canary did not reach preview_ready.')
  if (renderSmoke?.renderExecutionMode !== REAL_VIDEO_MODE) blockers.push(`Render execution mode was not ${REAL_VIDEO_MODE}.`)
  if (commandSummary?.cloudRunInvoked !== true) blockers.push('Cloud Run invocation was not confirmed.')
  if (commandSummary?.remotionRenderMediaInvoked !== true) blockers.push('Remotion renderMedia invocation was not confirmed.')
  if (commandSummary?.sourceVideoDownloaded !== true) blockers.push('Cloud Run did not confirm source video download.')
  if (outputArtifactSummary?.smokeTraceable !== true) blockers.push('Preview artifact was not smoke-traceable.')
  if (!result.cleanup?.attempted) blockers.push('Supabase cleanup was not attempted.')
  if ((result.cleanup?.errors ?? []).length > 0) blockers.push(`Supabase cleanup reported ${(result.cleanup?.errors ?? []).length} error(s).`)
  if (!gcsCleanup.attempted) blockers.push('GCS cleanup was not attempted.')
  if (gcsCleanup.errors.length > 0) blockers.push(`GCS cleanup reported ${gcsCleanup.errors.length} error(s).`)
  if ((result.leftoverRecords ?? []).length > 0) blockers.push(`Supabase cleanup left ${(result.leftoverRecords ?? []).length} record(s).`)
  if ((result.leftoverQueryErrors ?? []).length > 0) blockers.push(`Supabase leftover check reported ${(result.leftoverQueryErrors ?? []).length} query error(s).`)
  for (const idName of ['uploadIntentId', 'mediaAssetId', 'sourceStorageObjectId', 'approvedPlanSnapshotId', 'creditReservationId', 'jobBatchId', 'jobId', 'renderJobId', 'workerJobClaimId', 'renderId', 'previewStorageObjectId', 'qaReportId']) {
    if (!result.records?.[idName as keyof typeof result.records]) blockers.push(`Smoke result missing ${idName}.`)
  }

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

function validateRuntimeInputs(env: ServiceContext['env'], sourceEnv: Record<string, string | undefined>): string[] {
  const blockers: string[] = []
  if (env.supabaseE2eSmokeMode !== 'live' || !env.hasSupabaseAdmin) {
    blockers.push('SUPABASE_E2E_SMOKE_MODE=live with staging Supabase service-role env is required.')
  }
  if (!env.supabaseE2eAllowWrites) blockers.push('SUPABASE_E2E_ALLOW_WRITES=true is required.')
  if (!env.supabaseE2eCleanup) blockers.push('SUPABASE_E2E_CLEANUP=true is required.')
  if (sourceEnv.SUPABASE_E2E_ALLOW_RENDER_EXECUTION !== 'true') blockers.push('SUPABASE_E2E_ALLOW_RENDER_EXECUTION=true is required.')
  if (sourceEnv.SUPABASE_E2E_ALLOW_CLOUD_RUN !== 'true') blockers.push('SUPABASE_E2E_ALLOW_CLOUD_RUN=true is required.')
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

function validatePreviousLeftovers(checks: NonNullable<StagingRealVideoUploadPreviewCanaryPreflightInput['previousSmokeLeftoverChecks']>): string[] {
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
  status: StagingRealVideoUploadPreviewCanaryPreflightResult['status'],
  blockers: string[],
  env: ServiceContext['env'],
  allowRenderExecution: boolean,
  allowCloudRun: boolean,
): StagingRealVideoUploadPreviewCanaryPreflightResult {
  return {
    ok: status !== 'blocked',
    status,
    blockers,
    strictValidation: {
      ok: blockers.length === 0,
      allowWritesAcknowledged: env.supabaseE2eAllowWrites,
      allowRenderExecutionAcknowledged: allowRenderExecution,
      allowCloudRunAcknowledged: allowCloudRun,
      cleanupAcknowledged: env.supabaseE2eCleanup,
      stagingOnly: env.supabaseE2eSmokeMode === 'live' && env.hasSupabaseAdmin,
      mode: REAL_VIDEO_MODE,
      noProductionFlowsRan: true,
      noStripePaymentFlowsRan: true,
      noExternalProviderGenerationCallsRan: true,
      noBroadE2eSuiteRan: true,
      noCustomerMediaUsed: true,
      noQueueDrainRan: true,
    },
  }
}

function isSmokeGcsObject(record: GcsObjectRef): boolean {
  return isSafeCanaryBucket(record.bucketName)
    && record.objectPath.startsWith('workspaces/')
    && record.objectPath.includes('/projects/')
    && (record.objectPath.includes('/source-media/rp-e2e-smoke-') || record.objectPath.includes('/previews/'))
    && !PRODUCTION_WORD_PATTERN.test(record.objectPath)
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

export function createStagingRealVideoSmokeRunId(): string {
  return createSmokeRunId()
}
