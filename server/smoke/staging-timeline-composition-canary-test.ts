import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { loadRuntimeEnv } from '../config/env'
import { buildFixedTimelineCompositionSpec, STAGING_TIMELINE_COMPOSITION_CANARY_MODE } from '../timeline/timeline-composition-contracts'
import {
  STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  validateStagingRenderInfrastructureCanaryRequest,
  validateStagingTimelineCompositionCanaryRequest,
} from '../services/staging-render-infrastructure-canary-service'
import {
  evaluateStagingTimelineCompositionCanaryPreflight,
  runStagingTimelineCompositionCanary,
  type StagingTimelineCompositionCanaryDeps,
  type TimelineCanaryGcsStore,
} from '../services/staging-timeline-composition-canary-service'
import type { runPersistedGcsTimelineCompositionSmoke } from '../services/supabase-e2e-smoke-service'
import type { EditingToolReadinessSummary } from '../tools/editing-tool-readiness'
import type { ServiceContext } from '../types'

const smokeRunId = 'rp-e2e-smoke-cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const workspaceId = '00000000-0000-4000-8000-000000000301'
const projectId = '00000000-0000-4000-8000-000000000302'
const bucketName = 'reeditpro-staging-render-canary-smoke'
const sourceBytes = Buffer.from('rp-edit-01 tiny fixture bytes')
const sourceChecksum = createHash('sha256').update(sourceBytes).digest('hex')
let persistedSmokeCalled = false
let cloudRunPayload: Parameters<NonNullable<StagingTimelineCompositionCanaryDeps['invokeCloudRun']>>[0] | undefined

const safeSourceEnv: Record<string, string> = {
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'gcs',
  SUPABASE_URL: 'https://staging-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-placeholder',
  SUPABASE_E2E_SMOKE_MODE: 'live',
  SUPABASE_E2E_ALLOW_WRITES: 'true',
  SUPABASE_E2E_ALLOW_RENDER_EXECUTION: 'true',
  SUPABASE_E2E_ALLOW_CLOUD_RUN: 'true',
  SUPABASE_E2E_ALLOW_TIMELINE_COMPOSITION: 'true',
  SUPABASE_E2E_CLEANUP: 'true',
  SUPABASE_E2E_USER_ID: 'bb300bde-97fa-438d-ab97-a47dec0ca7d1',
  SUPABASE_E2E_MAX_WAIT_SECONDS: '180',
  GOOGLE_CLOUD_PROJECT_ID: 'reeditpro',
  GOOGLE_CLOUD_REGION: 'us-east1',
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-east1',
  GCP_WORKLOAD_IDENTITY_PROVIDER: 'projects/1/locations/global/workloadIdentityPools/github-actions/providers/reedkt',
  GCP_SERVICE_ACCOUNT: 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com',
  STAGING_CLOUD_RUN_RENDER_CANARY_URL: 'https://reeditpro-staging-render-canary-4wkjiqvdqa-ue.a.run.app/canary/render',
  STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE: 'https://reeditpro-staging-render-canary-4wkjiqvdqa-ue.a.run.app',
  STAGING_RENDER_CANARY_ID_TOKEN: 'placeholder-id-token',
  STAGING_RENDER_CANARY_MODE: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
  STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX: 'gs://reeditpro-staging-render-canary-smoke/previews',
  STAGING_RENDER_CANARY_MEMORY: '2Gi',
  STAGING_RENDER_CANARY_CPU: '2',
  STAGING_RENDER_CANARY_CONCURRENCY: '1',
  STAGING_RENDER_CANARY_TIMEOUT_SECONDS: '300',
  STAGING_RENDER_CANARY_NODE_OPTIONS: '--max-old-space-size=1536',
  GCS_SOURCE_MEDIA_BUCKET: bucketName,
  GCS_GENERATED_ASSETS_BUCKET: bucketName,
  GCS_PROCESSED_MEDIA_BUCKET: bucketName,
  GCS_PREVIEWS_BUCKET: bucketName,
  GCS_EXPORTS_BUCKET: bucketName,
  GCS_THUMBNAILS_BUCKET: bucketName,
  GCS_QA_ARTIFACTS_BUCKET: bucketName,
  GCS_WORKER_TEMP_BUCKET: bucketName,
}

const sourceObjectPath = `workspaces/${workspaceId}/projects/${projectId}/source-media/${smokeRunId}/tiny-timeline-source.mp4`
const previewObjectPath = `workspaces/${workspaceId}/projects/${projectId}/previews/00000000-0000-4000-8000-000000000303/${smokeRunId}-timeline-preview.mp4`
const timeline = buildFixedTimelineCompositionSpec({
  smokeRunId,
  source: {
    bucketName,
    objectPath: sourceObjectPath,
    storageObjectId: 'source-storage-object-id',
    mediaAssetId: 'source-media-asset-id',
    mimeType: 'video/mp4',
    sizeBytes: sourceBytes.byteLength,
    checksumSha256: sourceChecksum,
    durationSeconds: 3,
    width: 160,
    height: 90,
    fps: 15,
  },
})
const safePayload = {
  canary: true,
  mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
  smokeRunId,
  stagingOnly: true,
  allowCloudRun: true,
  allowRemotion: true,
  allowProviders: false,
  allowStripe: false,
  allowPaymentFlows: false,
  allowQueueDrain: false,
  allowUserMedia: false,
  allowProduction: false,
  cleanup: true,
  source: {
    bucketName,
    objectPath: sourceObjectPath,
    mimeType: 'video/mp4',
    sizeBytes: sourceBytes.byteLength,
    checksumSha256: sourceChecksum,
  },
  preview: {
    bucketName,
    objectPath: previewObjectPath,
    mimeType: 'video/mp4',
  },
  analysis: {
    probe: { durationSeconds: 3, width: 160, height: 90, videoCodec: 'mpeg4', formatName: 'mp4', sizeBytes: sourceBytes.byteLength, streamCount: 1, rawSummary: {} },
  },
  timeline,
  render: {
    maxDurationSeconds: 3,
    width: 160,
    height: 90,
    fps: 15,
    maxFrames: 45,
  },
  allow: {
    writes: true,
    renderExecution: true,
    cloudRun: true,
    remotion: true,
    timelineComposition: true,
    providers: false,
    stripe: false,
    paymentFlows: false,
    queueDrain: false,
    userMedia: false,
    production: false,
  },
}

const env = loadRuntimeEnv(safeSourceEnv)
const readyPreflight = evaluateStagingTimelineCompositionCanaryPreflight({ env, sourceEnv: safeSourceEnv })
const disabledPreflight = evaluateStagingTimelineCompositionCanaryPreflight({
  env: loadRuntimeEnv({
    ...safeSourceEnv,
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
    SUPABASE_E2E_ALLOW_WRITES: 'false',
    SUPABASE_E2E_ALLOW_TIMELINE_COMPOSITION: 'false',
  }),
  sourceEnv: {
    ...safeSourceEnv,
    SUPABASE_E2E_ALLOW_RENDER_EXECUTION: 'false',
    SUPABASE_E2E_ALLOW_CLOUD_RUN: 'false',
    SUPABASE_E2E_ALLOW_TIMELINE_COMPOSITION: 'false',
  },
  expectDisabled: true,
})
const missingWrites = evaluateStagingTimelineCompositionCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_ALLOW_WRITES: 'false' }),
  sourceEnv: safeSourceEnv,
})
const missingRenderExecution = evaluateStagingTimelineCompositionCanaryPreflight({
  env,
  sourceEnv: { ...safeSourceEnv, SUPABASE_E2E_ALLOW_RENDER_EXECUTION: 'false' },
})
const missingCloudRun = evaluateStagingTimelineCompositionCanaryPreflight({
  env,
  sourceEnv: { ...safeSourceEnv, SUPABASE_E2E_ALLOW_CLOUD_RUN: 'false' },
})
const missingTimelineAllow = evaluateStagingTimelineCompositionCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_ALLOW_TIMELINE_COMPOSITION: 'false' }),
  sourceEnv: { ...safeSourceEnv, SUPABASE_E2E_ALLOW_TIMELINE_COMPOSITION: 'false' },
})
const cleanupFalse = evaluateStagingTimelineCompositionCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_CLEANUP: 'false' }),
  sourceEnv: safeSourceEnv,
})
const localStorage = evaluateStagingTimelineCompositionCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, STORAGE_MODE: 'local' }),
  sourceEnv: { ...safeSourceEnv, STORAGE_MODE: 'local' },
})
const providerStripe = evaluateStagingTimelineCompositionCanaryPreflight({
  env,
  sourceEnv: { ...safeSourceEnv, OPENAI_API_KEY: 'configured', STRIPE_SECRET_KEY: 'configured' },
})
const productionBucket = evaluateStagingTimelineCompositionCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-production-media' }),
  sourceEnv: { ...safeSourceEnv, GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-production-media' },
})
const syntheticRejectsTimeline = validateStagingRenderInfrastructureCanaryRequest(safePayload)
const validTimelineRequest = validateStagingTimelineCompositionCanaryRequest(safePayload)
const missingTimeline = validateStagingTimelineCompositionCanaryRequest({ ...safePayload, timeline: undefined })
const nonSmokeSource = validateStagingTimelineCompositionCanaryRequest({
  ...safePayload,
  source: { ...safePayload.source, objectPath: 'workspaces/ws/projects/prj/source-media/customer-upload/source.mp4' },
})
const customerMediaPreview = validateStagingTimelineCompositionCanaryRequest({
  ...safePayload,
  preview: { ...safePayload.preview, objectPath: 'workspaces/ws/projects/prj/customer-media/render.mp4' },
})
const signedUrlTimeline = validateStagingTimelineCompositionCanaryRequest({
  ...safePayload,
  timeline: { ...timeline, signedUrl: 'https://signed.example.invalid/timeline.json' },
})
const providerStripeRequest = validateStagingTimelineCompositionCanaryRequest({
  ...safePayload,
  allowProviders: true,
  allowStripe: true,
})
const cleanupFalseRequest = validateStagingTimelineCompositionCanaryRequest({ ...safePayload, cleanup: false })

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'staging-timeline-composition-canary-test',
  auth: { userId: env.supabaseE2eUserId ?? 'test-user', isMockUser: true },
}
const success = await runStagingTimelineCompositionCanary(context, {
  sourceEnv: safeSourceEnv,
  gcsStore: fakeGcsStore(),
  runToolReadiness: async () => fakeReadinessSummary(),
  createSourceFixture: async (input) => {
    await writeFile(input.localPath, sourceBytes)
    return {
      localPath: input.localPath,
      sizeBytes: sourceBytes.byteLength,
      checksumSha256: sourceChecksum,
      durationSeconds: 3,
      width: 160,
      height: 90,
      fps: 15,
    }
  },
  analyzeAndBuildTimeline: async (input) => ({
    analysis: {
      probe: {
        durationSeconds: 3,
        width: 160,
        height: 90,
        videoCodec: 'mpeg4',
        formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
        sizeBytes: input.source.sizeBytes,
        streamCount: 1,
        rawSummary: { streamTypes: ['video'] },
      },
      thumbnail: {
        bucketName: input.source.bucketName,
        objectPath: `workspaces/${workspaceId}/projects/${projectId}/media-analysis/${smokeRunId}/timeline-thumbnail.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 512,
        checksumSha256: createHash('sha256').update('thumbnail').digest('hex'),
        width: 160,
        height: 90,
        smokeTraceable: true,
      },
      audio: { checkedWithFfmpeg: true, hasAudio: false, summary: 'FFmpeg found no audio stream.' },
      optionalReadiness: input.optionalReadiness,
    },
    analysisArtifacts: [{
      bucketName: input.source.bucketName,
      objectPath: `workspaces/${workspaceId}/projects/${projectId}/media-analysis/${smokeRunId}/timeline-thumbnail.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 512,
      checksumSha256: createHash('sha256').update('thumbnail').digest('hex'),
      objectPurpose: 'thumbnail',
    }],
    timeline: buildFixedTimelineCompositionSpec({
      smokeRunId,
      source: {
        bucketName: input.source.bucketName,
        objectPath: input.source.objectPath,
        storageObjectId: input.sourceStorageObjectId,
        mediaAssetId: input.sourceMediaAssetId,
        mimeType: 'video/mp4',
        sizeBytes: input.source.sizeBytes,
        checksumSha256: input.source.checksumSha256,
        durationSeconds: 3,
        width: 160,
        height: 90,
        fps: 15,
      },
    }),
  }),
  invokeCloudRun: async (input) => {
    cloudRunPayload = input
    return {
      outputBucketName: input.config.preview.bucketName,
      outputObjectPath: input.config.preview.objectPath,
      durationSeconds: 3,
      width: 160,
      height: 90,
      fps: 15,
      frameCount: 45,
      sizeBytes: 12345,
      checksumSha256: createHash('sha256').update('preview').digest('hex'),
      commandSummary: {
        cloudRunInvoked: true,
        remotionRenderMediaInvoked: true,
        remotionBundleInvoked: true,
        remotionSelectCompositionInvoked: true,
        sourceVideoDownloaded: true,
        timelineCompositionRendered: true,
        captionPlaceholderLayerRendered: true,
        safeZoneOverlayRendered: true,
      },
      outputArtifactSummary: {
        bucketName: input.config.preview.bucketName,
        objectPath: input.config.preview.objectPath,
        mimeType: 'video/mp4',
        smokeTraceable: true,
      },
    }
  },
  runPersistedSmoke: fakeRunPersistedSmoke,
})
const missingRemotion = await runStagingTimelineCompositionCanary(context, {
  sourceEnv: safeSourceEnv,
  runToolReadiness: async () => fakeReadinessSummary({ missingRequiredToolIds: ['remotion'] }),
  runPersistedSmoke: async () => {
    throw new Error('Persisted smoke should not run when Remotion is missing.')
  },
})

const serialized = JSON.stringify({ safePayload, success, cloudRunPayload }).toLowerCase()
const supabaseSmokeServiceSource = await readFile(new URL('../services/supabase-e2e-smoke-service.ts', import.meta.url), 'utf8')
const e2eRuntimeServiceSource = await readFile(new URL('../services/e2e-service-role-runtime-service.ts', import.meta.url), 'utf8')
const checks = [
  readyPreflight.ok && readyPreflight.status === 'ready' ? 'preflight_ready' : undefined,
  disabledPreflight.ok && disabledPreflight.status === 'skipped' ? 'expect_disabled_skips' : undefined,
  !missingWrites.ok && missingWrites.blockers.some((blocker) => blocker.includes('ALLOW_WRITES')) ? 'writes_required' : undefined,
  !missingRenderExecution.ok && missingRenderExecution.blockers.some((blocker) => blocker.includes('ALLOW_RENDER_EXECUTION')) ? 'render_execution_required' : undefined,
  !missingCloudRun.ok && missingCloudRun.blockers.some((blocker) => blocker.includes('ALLOW_CLOUD_RUN')) ? 'cloud_run_required' : undefined,
  !missingTimelineAllow.ok && missingTimelineAllow.blockers.some((blocker) => blocker.includes('TIMELINE_COMPOSITION_NOT_ALLOWED')) ? 'timeline_allow_required' : undefined,
  !cleanupFalse.ok && cleanupFalse.blockers.some((blocker) => blocker.includes('CLEANUP')) ? 'cleanup_required' : undefined,
  !localStorage.ok && localStorage.blockers.some((blocker) => blocker.includes('TIMELINE_COMPOSITION_GCS_REQUIRED')) ? 'gcs_required' : undefined,
  !providerStripe.ok && providerStripe.blockers.some((blocker) => blocker.includes('Provider')) ? 'provider_and_stripe_rejected' : undefined,
  !productionBucket.ok && productionBucket.blockers.some((blocker) => blocker.includes('Production')) ? 'production_bucket_rejected' : undefined,
  !syntheticRejectsTimeline.ok
    && syntheticRejectsTimeline.blockers.some((blocker) => blocker.includes(`mode must be ${STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE}`))
    ? 'synthetic_validator_rejects_timeline_mode'
    : undefined,
  validTimelineRequest.ok ? 'timeline_validator_accepts_safe_request' : undefined,
  !missingTimeline.ok && missingTimeline.blockers.some((blocker) => blocker.includes('timeline spec')) ? 'missing_timeline_rejected' : undefined,
  !nonSmokeSource.ok && nonSmokeSource.blockers.some((blocker) => blocker.includes('source object path')) ? 'non_smoke_source_rejected' : undefined,
  !customerMediaPreview.ok && customerMediaPreview.blockers.some((blocker) => blocker.includes('preview object path')) ? 'customer_media_preview_rejected' : undefined,
  !signedUrlTimeline.ok && signedUrlTimeline.blockers.some((blocker) => blocker.includes('signed URLs')) ? 'signed_url_timeline_rejected' : undefined,
  !providerStripeRequest.ok && providerStripeRequest.blockers.some((blocker) => blocker.includes('allowProviders')) ? 'provider_request_rejected' : undefined,
  !cleanupFalseRequest.ok && cleanupFalseRequest.blockers.some((blocker) => blocker.includes('cleanup')) ? 'request_cleanup_required' : undefined,
  missingRemotion.error?.code === 'TIMELINE_COMPOSITION_REMOTION_REQUIRED' ? 'remotion_required' : undefined,
  success.ok && success.status === 'passed' && success.strictValidation.ok ? 'mock_success_passes' : undefined,
  success.mediaProbe?.durationSeconds === 3 && success.mediaProbe.width === 160 && success.mediaProbe.height === 90 ? 'probe_metadata_recorded' : undefined,
  success.thumbnailArtifact?.objectPath.includes(`/media-analysis/${smokeRunId}/`) ? 'thumbnail_artifact_smoke_tagged' : undefined,
  success.timeline?.segments.length === 1 && success.timeline.layers.some((layer) => layer.layerType === 'caption_placeholder') ? 'timeline_has_one_segment_and_caption' : undefined,
  success.timeline?.layers.some((layer) => layer.layerType === 'lower_third_placeholder') ? 'timeline_has_lower_third_overlay' : undefined,
  cloudRunPayload?.config.timeline.mode === STAGING_TIMELINE_COMPOSITION_CANARY_MODE ? 'cloud_run_payload_uses_timeline_mode' : undefined,
  cloudRunPayload?.config.source.objectPath.includes(`/source-media/${smokeRunId}/`) && cloudRunPayload?.config.preview.objectPath.includes('/previews/')
    ? 'cloud_run_payload_uses_smoke_gcs_paths'
    : undefined,
  success.strictValidation.outputArtifactSummary?.smokeTraceable === true ? 'preview_artifact_smoke_tagged' : undefined,
  success.gcsCleanup.attempted && success.gcsCleanup.errors.length === 0 && success.gcsCleanup.deleted.length >= 1 ? 'gcs_cleanup_succeeded' : undefined,
  success.cleanup?.attempted && success.cleanup.errors.length === 0 && (success.leftoverRecords ?? []).length === 0 ? 'supabase_cleanup_succeeded' : undefined,
  !serialized.includes('https://signed') && !serialized.includes('signed_url') && !serialized.includes('data:video') && !serialized.includes('base64')
    ? 'no_signed_urls_or_raw_video_bytes'
    : undefined,
  !supabaseSmokeServiceSource.includes('timeline_composition_plan') ? 'timeline_metadata_uses_schema_safe_job_type' : undefined,
  !supabaseSmokeServiceSource.includes("worker_target: 'timeline_composition_agent'") ? 'timeline_metadata_uses_schema_safe_worker_target' : undefined,
  !supabaseSmokeServiceSource.includes("actor_agent_type: 'timeline_composition_agent'") ? 'timeline_metadata_uses_schema_safe_agent_type' : undefined,
  e2eRuntimeServiceSource.includes('p_snapshot_json: sanitizeRpcPayload({') ? 'approved_snapshot_payload_is_sanitized' : undefined,
  persistedSmokeCalled ? 'uses_timeline_persisted_smoke_path' : undefined,
].filter(Boolean)

const ok = checks.length === 35
console.log(JSON.stringify({ ok, checks }, null, 2))
if (!ok) process.exitCode = 1

function fakeGcsStore(): TimelineCanaryGcsStore {
  const objects = new Set<string>()
  return {
    async uploadLocalFile(input) {
      objects.add(`${input.bucketName}/${input.objectPath}`)
    },
    async downloadToFile(input) {
      await writeFile(input.localPath, sourceBytes)
    },
    async exists(input) {
      return objects.has(`${input.bucketName}/${input.objectPath}`)
    },
    async delete(input) {
      return objects.delete(`${input.bucketName}/${input.objectPath}`)
    },
  }
}

async function fakeRunPersistedSmoke(
  _context: Parameters<NonNullable<StagingTimelineCompositionCanaryDeps['runPersistedSmoke']>>[0],
  options: Parameters<NonNullable<StagingTimelineCompositionCanaryDeps['runPersistedSmoke']>>[1],
): Promise<Awaited<ReturnType<typeof runPersistedGcsTimelineCompositionSmoke>>> {
  persistedSmokeCalled = true
  const fixture = await options.sourceFixtureFactory!({
    smokeRunId,
    workspaceId,
    projectId,
    bucketName,
    objectPath: sourceObjectPath,
    fileName: 'tiny-timeline-source.mp4',
  })
  const preparation = await options.analyzeAndBuildTimeline({
    smokeRunId,
    workspaceId,
    projectId,
    sourceStorageObjectId: 'source-storage-object-id',
    sourceMediaAssetId: 'source-media-asset-id',
    sourceBucketName: bucketName,
    sourceObjectPath,
    sourceSizeBytes: fixture.sizeBytes,
    sourceChecksumSha256: fixture.checksumSha256,
  })
  const preview = await options.createExternalRenderArtifacts!({
    smokeRunId,
    workspaceId,
    projectId,
    editPlanId: 'edit-plan-id',
    approvedPlanSnapshotId: 'approved-plan-snapshot-id',
    creditReservationId: 'credit-reservation-id',
    jobId: 'job-id',
    renderJobId: 'render-job-id',
    workerJobClaimId: 'worker-claim-id',
    sourceStorageObjectId: 'source-storage-object-id',
    sourceMediaAssetId: 'source-media-asset-id',
    sourceBucketName: bucketName,
    sourceObjectPath,
    sourceSizeBytes: fixture.sizeBytes,
    sourceChecksumSha256: fixture.checksumSha256,
    plannedRenderId: 'render-id',
    outputBucketName: bucketName,
    outputObjectPath: previewObjectPath,
  })
  return {
    ok: true,
    status: 'passed',
    smokeMode: 'live',
    liveSupabaseConfigured: true,
    writesAllowed: true,
    cleanupEnabled: true,
    records: {
      smokeRunId,
      workspaceId,
      projectId,
      sourceStorageObjectId: 'source-storage-object-id',
      mediaAssetId: 'source-media-asset-id',
      sourceBucketName: bucketName,
      sourceObjectPath,
      sourceSizeBytes: fixture.sizeBytes,
      sourceChecksumSha256: fixture.checksumSha256,
      approvedPlanSnapshotId: 'approved-plan-snapshot-id',
      creditReservationId: 'credit-reservation-id',
      jobBatchId: 'job-batch-id',
      jobId: 'job-id',
      renderJobId: 'render-job-id',
      workerJobClaimId: 'worker-claim-id',
      renderId: 'render-id',
      previewStorageObjectId: 'preview-storage-object-id',
      qaReportId: 'qa-report-id',
    },
    cleanup: {
      attempted: true,
      deleted: [
        { table: 'jobs', id: 'job-id' },
        { table: 'render_jobs', id: 'render-job-id' },
        { table: 'storage_object_records', id: 'preview-storage-object-id' },
      ],
      errors: [],
    },
    renderSmoke: {
      ok: true,
      status: 'preview_ready',
      renderExecutionMode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
      outputArtifactSummary: preview.outputArtifactSummary,
      previewRender: {
        commandSummary: preview.previewRender.commandSummary,
      },
      events: [
        { eventName: 'worker_claimed', status: 'recorded', jobEventId: 'event-1' },
        { eventName: 'completed', status: 'recorded', jobEventId: 'event-2' },
      ],
    },
    mediaAnalysis: preparation.analysis,
    readback: { ok: true, checked: [], blockers: [] },
    leftoverRecords: [],
    leftoverQueryErrors: [],
    warnings: [],
  }
}

function fakeReadinessSummary(input: {
  missingRequiredToolIds?: Array<'ffmpeg' | 'ffprobe' | 'remotion'>
} = {}): EditingToolReadinessSummary {
  const missingRequiredToolIds = input.missingRequiredToolIds ?? []
  const requiredToolIds: Array<'ffmpeg' | 'ffprobe' | 'remotion'> = ['ffmpeg', 'ffprobe', 'remotion']
  return {
    ok: missingRequiredToolIds.length === 0,
    strict: true,
    runtimeMode: 'local',
    requiredToolIds,
    missingRequiredToolIds,
    checks: [
      ...requiredToolIds.map((toolId) => ({
        toolId,
        displayName: toolId,
        required: true,
        status: missingRequiredToolIds.includes(toolId) ? 'missing' as const : 'passed' as const,
        capabilities: [],
        summary: missingRequiredToolIds.includes(toolId) ? `${toolId} missing.` : `${toolId} ready.`,
        currentReadiness: 'code_enforced_proven_staging' as const,
        productionApprovalStatus: 'staging_smoke_only' as const,
      })),
      {
        toolId: 'pyscenedetect' as const,
        displayName: 'PySceneDetect',
        required: false,
        status: 'missing' as const,
        capabilities: [],
        summary: 'Optional scene detection slot not installed.',
        currentReadiness: 'planned_stub' as const,
        productionApprovalStatus: 'planning_only' as const,
      },
    ],
    warnings: ['Optional editing tools are warnings only.'],
    generatedAt: new Date().toISOString(),
  }
}
