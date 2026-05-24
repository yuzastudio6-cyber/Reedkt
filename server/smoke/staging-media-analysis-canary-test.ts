import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { loadRuntimeEnv } from '../config/env'
import { buildMediaAnalysisReport } from '../media/media-analysis-report'
import {
  evaluateStagingMediaAnalysisCanaryPreflight,
  runStagingMediaAnalysisCanary,
  type MediaAnalysisGcsStore,
  type StagingMediaAnalysisCanaryDeps,
} from '../services/staging-media-analysis-canary-service'
import type { runPersistedGcsMediaAnalysisSmoke } from '../services/supabase-e2e-smoke-service'
import type { EditingToolReadinessSummary } from '../tools/editing-tool-readiness'
import type { ServiceContext } from '../types'

const smokeRunId = 'rp-e2e-smoke-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const workspaceId = '00000000-0000-4000-8000-000000000101'
const projectId = '00000000-0000-4000-8000-000000000202'
const bucketName = 'reeditpro-staging-media-analysis-smoke'
const sourceBytes = Buffer.from('rp-media-01 tiny fixture bytes')
const sourceChecksum = createHash('sha256').update(sourceBytes).digest('hex')
let persistedSmokeCalled = false
const uploadedCanonicalRecords: Array<{ bucketName: string; objectPath: string }> = []

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
  SUPABASE_E2E_ALLOW_MEDIA_ANALYSIS: 'true',
  SUPABASE_E2E_CLEANUP: 'true',
  SUPABASE_E2E_USER_ID: 'bb300bde-97fa-438d-ab97-a47dec0ca7d1',
  SUPABASE_E2E_MAX_WAIT_SECONDS: '180',
  GOOGLE_CLOUD_PROJECT_ID: 'reeditpro',
  GOOGLE_CLOUD_REGION: 'us-east1',
  GCS_SOURCE_MEDIA_BUCKET: bucketName,
  GCS_GENERATED_ASSETS_BUCKET: bucketName,
  GCS_PROCESSED_MEDIA_BUCKET: bucketName,
  GCS_PREVIEWS_BUCKET: bucketName,
  GCS_EXPORTS_BUCKET: bucketName,
  GCS_THUMBNAILS_BUCKET: bucketName,
  GCS_QA_ARTIFACTS_BUCKET: bucketName,
  GCS_WORKER_TEMP_BUCKET: bucketName,
}

const env = loadRuntimeEnv(safeSourceEnv)
const readyPreflight = evaluateStagingMediaAnalysisCanaryPreflight({ env, sourceEnv: safeSourceEnv })
const disabledPreflight = evaluateStagingMediaAnalysisCanaryPreflight({
  env: loadRuntimeEnv({
    ...safeSourceEnv,
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
    SUPABASE_E2E_ALLOW_WRITES: 'false',
    SUPABASE_E2E_ALLOW_MEDIA_ANALYSIS: 'false',
  }),
  sourceEnv: {
    ...safeSourceEnv,
    SUPABASE_E2E_ALLOW_MEDIA_ANALYSIS: 'false',
  },
  expectDisabled: true,
})
const missingWrites = evaluateStagingMediaAnalysisCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_ALLOW_WRITES: 'false' }),
  sourceEnv: safeSourceEnv,
})
const missingMediaAnalysis = evaluateStagingMediaAnalysisCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_ALLOW_MEDIA_ANALYSIS: 'false' }),
  sourceEnv: { ...safeSourceEnv, SUPABASE_E2E_ALLOW_MEDIA_ANALYSIS: 'false' },
})
const cleanupFalse = evaluateStagingMediaAnalysisCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_CLEANUP: 'false' }),
  sourceEnv: safeSourceEnv,
})
const localStorage = evaluateStagingMediaAnalysisCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, STORAGE_MODE: 'local' }),
  sourceEnv: { ...safeSourceEnv, STORAGE_MODE: 'local' },
})
const providerStripe = evaluateStagingMediaAnalysisCanaryPreflight({
  env,
  sourceEnv: { ...safeSourceEnv, OPENAI_API_KEY: 'configured', STRIPE_SECRET_KEY: 'configured' },
})
const productionBucket = evaluateStagingMediaAnalysisCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-production-media' }),
  sourceEnv: { ...safeSourceEnv, GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-production-media' },
})
const previousLeftovers = evaluateStagingMediaAnalysisCanaryPreflight({
  env,
  sourceEnv: safeSourceEnv,
  previousSmokeLeftoverChecks: [{
    label: 'previous_real_video_smoke',
    smokeRunId: 'rp-e2e-smoke-11111111-1111-4111-8111-111111111111',
    ok: false,
    leftovers: [{ table: 'jobs', id: 'leftover-job', matchedBy: 'exact_id' }],
    queryErrors: [],
  }],
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'staging-media-analysis-canary-test',
  auth: { userId: env.supabaseE2eUserId ?? 'test-user', isMockUser: true },
}
const success = await runStagingMediaAnalysisCanary(context, {
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
  analyzeSource: async (input) => {
    if (!input.source.objectPath.includes(`/source-media/${smokeRunId}/`)) {
      throw new Error('MEDIA_ANALYSIS_SOURCE_NOT_SMOKE_TAGGED')
    }
    const thumbnail = {
      bucketName: input.source.bucketName,
      objectPath: `workspaces/${workspaceId}/projects/${projectId}/media-analysis/${smokeRunId}/thumbnail.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 512,
      checksumSha256: createHash('sha256').update('thumbnail').digest('hex'),
      width: 160,
      height: 90,
      smokeTraceable: true,
    }
    await input.gcsStore.uploadLocalFile({
      bucketName: thumbnail.bucketName,
      objectPath: thumbnail.objectPath,
      localPath: 'mock-thumbnail.jpg',
      contentType: thumbnail.mimeType,
      metadata: { smokeRunId, canary: 'staging_media_analysis_canary' },
    })
    const report = buildMediaAnalysisReport({
      smokeRunId,
      source: {
        bucketName: input.source.bucketName,
        objectPath: input.source.objectPath,
        mimeType: 'video/mp4',
        sizeBytes: input.source.sizeBytes,
        checksumSha256: input.source.checksumSha256,
      },
      probe: {
        durationSeconds: 3,
        width: 160,
        height: 90,
        videoCodec: 'mpeg4',
        formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
        sizeBytes: input.source.sizeBytes,
        streamCount: 1,
        rawSummary: {
          formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
          durationSeconds: 3,
          streamTypes: ['video'],
        },
      },
      thumbnail,
      audio: {
        checkedWithFfmpeg: true,
        hasAudio: false,
        summary: 'FFmpeg found no audio stream.',
      },
      optionalReadiness: input.optionalReadiness,
    })
    return {
      report,
      artifacts: [{
        bucketName: thumbnail.bucketName,
        objectPath: thumbnail.objectPath,
        mimeType: thumbnail.mimeType,
        sizeBytes: thumbnail.sizeBytes,
        checksumSha256: thumbnail.checksumSha256,
        objectPurpose: 'thumbnail',
      }],
    }
  },
  runPersistedSmoke: fakeRunPersistedSmoke,
})

const missingFfprobe = await runStagingMediaAnalysisCanary(context, {
  sourceEnv: safeSourceEnv,
  gcsStore: fakeGcsStore(),
  runToolReadiness: async () => fakeReadinessSummary({ missingRequiredToolIds: ['ffprobe'] }),
  runPersistedSmoke: async () => {
    throw new Error('Persisted smoke should not run when FFprobe is missing.')
  },
})
const missingFfmpeg = await runStagingMediaAnalysisCanary(context, {
  sourceEnv: safeSourceEnv,
  gcsStore: fakeGcsStore(),
  runToolReadiness: async () => fakeReadinessSummary({ missingRequiredToolIds: ['ffmpeg'] }),
  runPersistedSmoke: async () => {
    throw new Error('Persisted smoke should not run when FFmpeg is missing.')
  },
})

const serialized = JSON.stringify(success)
const checks = [
  readyPreflight.ok && readyPreflight.status === 'ready' ? 'preflight_ready' : undefined,
  disabledPreflight.ok && disabledPreflight.status === 'skipped' ? 'expect_disabled_skips' : undefined,
  !missingWrites.ok && missingWrites.blockers.some((blocker) => blocker.includes('MEDIA_ANALYSIS_WRITES_DISABLED')) ? 'writes_required' : undefined,
  !missingMediaAnalysis.ok && missingMediaAnalysis.blockers.some((blocker) => blocker.includes('MEDIA_ANALYSIS_NOT_ALLOWED')) ? 'media_analysis_allowed_required' : undefined,
  !cleanupFalse.ok && cleanupFalse.blockers.some((blocker) => blocker.includes('MEDIA_ANALYSIS_CLEANUP_REQUIRED')) ? 'cleanup_required' : undefined,
  !localStorage.ok && localStorage.blockers.some((blocker) => blocker.includes('MEDIA_ANALYSIS_GCS_REQUIRED')) ? 'gcs_required' : undefined,
  !providerStripe.ok
    && providerStripe.blockers.some((blocker) => blocker.includes('Provider env'))
    && providerStripe.blockers.some((blocker) => blocker.includes('Stripe'))
    ? 'provider_and_stripe_rejected'
    : undefined,
  !productionBucket.ok && productionBucket.blockers.some((blocker) => blocker.includes('Production-looking')) ? 'production_bucket_rejected' : undefined,
  !previousLeftovers.ok && previousLeftovers.blockers.some((blocker) => blocker.includes('leftover jobs/leftover-job')) ? 'previous_leftover_blocks' : undefined,
  missingFfprobe.error?.code === 'MEDIA_ANALYSIS_FFPROBE_REQUIRED' ? 'ffprobe_required' : undefined,
  missingFfmpeg.error?.code === 'MEDIA_ANALYSIS_FFMPEG_REQUIRED' ? 'ffmpeg_required' : undefined,
  success.ok && success.status === 'passed' && success.strictValidation.ok ? 'mock_success_passes' : undefined,
  success.strictValidation.safety.noExternalProviderGenerationCallsRan && success.strictValidation.safety.noStripePaymentFlowsRan ? 'safety_flags_clean' : undefined,
  success.mediaProbe?.durationSeconds === 3 && success.mediaProbe.width === 160 && success.mediaProbe.height === 90 ? 'probe_metadata_recorded' : undefined,
  success.audioSummary?.checkedWithFfmpeg === true ? 'audio_presence_checked_with_ffmpeg' : undefined,
  success.analysisArtifacts[0]?.objectPath.includes(`/media-analysis/${smokeRunId}/`) ? 'analysis_artifact_smoke_tagged' : undefined,
  success.sourceArtifact?.objectPath.includes(`/source-media/${smokeRunId}/`) ? 'source_artifact_smoke_tagged' : undefined,
  success.gcsCleanup.attempted && success.gcsCleanup.errors.length === 0 && success.gcsCleanup.deleted.length >= 2 ? 'gcs_cleanup_succeeded' : undefined,
  success.cleanup?.attempted && success.cleanup.errors.length === 0 && (success.leftoverRecords ?? []).length === 0 ? 'supabase_cleanup_succeeded' : undefined,
  success.optionalReadiness.some((tool) => tool.toolId === 'pyscenedetect' && tool.status === 'missing') ? 'optional_scene_detection_warns_only' : undefined,
  success.optionalReadiness.some((tool) => tool.toolId === 'whisper' && tool.status === 'missing') ? 'optional_transcript_warns_only' : undefined,
  !serialized.includes('"signedUrl"') && !serialized.includes('"signed_url"') ? 'signed_urls_not_canonical' : undefined,
  uploadedCanonicalRecords.every((record) => record.bucketName === bucketName && record.objectPath.includes(smokeRunId)) ? 'canonical_records_are_bucket_object_paths' : undefined,
  persistedSmokeCalled ? 'uses_media_analysis_persisted_smoke_path' : undefined,
].filter(Boolean)

const ok = checks.length === 24
console.log(JSON.stringify({ ok, checks }, null, 2))
if (!ok) process.exitCode = 1

function fakeGcsStore(): MediaAnalysisGcsStore {
  const objects = new Set<string>()
  return {
    async uploadLocalFile(input) {
      objects.add(`${input.bucketName}/${input.objectPath}`)
      uploadedCanonicalRecords.push({ bucketName: input.bucketName, objectPath: input.objectPath })
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
  _context: Parameters<NonNullable<StagingMediaAnalysisCanaryDeps['runPersistedSmoke']>>[0],
  options: Parameters<NonNullable<StagingMediaAnalysisCanaryDeps['runPersistedSmoke']>>[1],
) {
  persistedSmokeCalled = true
  const objectPath = `workspaces/${workspaceId}/projects/${projectId}/source-media/${smokeRunId}/tiny-media-analysis-source.mp4`
  const fixture = await options.sourceFixtureFactory({
    smokeRunId,
    workspaceId,
    projectId,
    bucketName,
    objectPath,
    fileName: options.sourceFileName ?? 'tiny-media-analysis-source.mp4',
  })
  const analysis = await options.analyzeSource({
    smokeRunId,
    workspaceId,
    projectId,
    sourceStorageObjectId: 'source-storage-object-id',
    sourceBucketName: bucketName,
    sourceObjectPath: objectPath,
    sourceSizeBytes: fixture.sizeBytes,
    sourceChecksumSha256: fixture.checksumSha256,
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
      sourceBucketName: bucketName,
      sourceObjectPath: objectPath,
      sourceSizeBytes: fixture.sizeBytes,
      sourceChecksumSha256: fixture.checksumSha256,
      mediaAnalysisJobId: 'media-analysis-job-id',
      mediaAnalysisJobEventId: 'media-analysis-event-id',
      analysisStorageObjectIds: ['thumbnail-storage-object-id'],
    },
    cleanup: {
      attempted: true,
      deleted: [
        { table: 'jobs', id: 'media-analysis-job-id' },
        { table: 'job_events', id: 'media-analysis-event-id' },
        { table: 'storage_object_records', id: 'thumbnail-storage-object-id' },
      ],
      errors: [],
    },
    mediaAnalysis: analysis.report,
    readback: { ok: true, checked: [], blockers: [] },
    leftoverRecords: [],
    leftoverQueryErrors: [],
    warnings: [],
  } satisfies Awaited<ReturnType<typeof runPersistedGcsMediaAnalysisSmoke>>
}

function fakeReadinessSummary(input: {
  missingRequiredToolIds?: Array<'ffmpeg' | 'ffprobe'>
} = {}): EditingToolReadinessSummary {
  const missingRequiredToolIds = input.missingRequiredToolIds ?? []
  return {
    ok: missingRequiredToolIds.length === 0,
    strict: true,
    runtimeMode: 'local',
    requiredToolIds: ['ffmpeg', 'ffprobe'],
    missingRequiredToolIds,
    checks: [
      {
        toolId: 'ffmpeg',
        displayName: 'FFmpeg',
        required: true,
        status: missingRequiredToolIds.includes('ffmpeg') ? 'missing' : 'passed',
        capabilities: [],
        summary: missingRequiredToolIds.includes('ffmpeg') ? 'FFmpeg missing.' : 'FFmpeg ready.',
        currentReadiness: 'code_enforced_proven_staging',
        productionApprovalStatus: 'staging_smoke_only',
      },
      {
        toolId: 'ffprobe',
        displayName: 'FFprobe',
        required: true,
        status: missingRequiredToolIds.includes('ffprobe') ? 'missing' : 'passed',
        capabilities: [],
        summary: missingRequiredToolIds.includes('ffprobe') ? 'FFprobe missing.' : 'FFprobe ready.',
        currentReadiness: 'code_enforced_proven_staging',
        productionApprovalStatus: 'staging_smoke_only',
      },
      {
        toolId: 'pyscenedetect',
        displayName: 'PySceneDetect',
        required: false,
        status: 'missing',
        capabilities: [],
        summary: 'Optional scene detection slot not installed.',
        currentReadiness: 'planned_stub',
        productionApprovalStatus: 'planning_only',
      },
      {
        toolId: 'whisper',
        displayName: 'Whisper',
        required: false,
        status: 'missing',
        capabilities: [],
        summary: 'Optional transcript slot not installed.',
        currentReadiness: 'planned_stub',
        productionApprovalStatus: 'planning_only',
      },
      {
        toolId: 'opencv',
        displayName: 'OpenCV',
        required: false,
        status: 'warning',
        capabilities: [],
        summary: 'Optional visual QA slot is not required for RP-MEDIA-01.',
        currentReadiness: 'safe_check_available',
        productionApprovalStatus: 'planning_only',
      },
      {
        toolId: 'audioflux',
        displayName: 'AudioFlux',
        required: false,
        status: 'warning',
        capabilities: [],
        summary: 'Optional audio analysis slot is not required for RP-MEDIA-01.',
        currentReadiness: 'safe_check_available',
        productionApprovalStatus: 'planning_only',
      },
    ],
    warnings: ['Optional analysis slots are warnings only.'],
    generatedAt: new Date().toISOString(),
  }
}
