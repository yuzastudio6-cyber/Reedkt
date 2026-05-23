import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { loadRuntimeEnv } from '../config/env'
import {
  STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_FIXTURE,
  STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
  runStagingRenderInfrastructureCanary,
  validateStagingRenderInfrastructureCanaryRequest,
  type CanaryArtifactStore,
  type CanaryRenderer,
} from '../services/staging-render-infrastructure-canary-service'
import { evaluateStagingRealVideoUploadPreviewCanaryPreflight } from '../services/staging-real-video-upload-preview-canary-service'

const smokeRunId = 'rp-e2e-smoke-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const sourceBytes = Buffer.from('fake tiny source video bytes')
const sourceChecksum = createHash('sha256').update(sourceBytes).digest('hex')

const safeSourceEnv = {
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'gcs',
  SUPABASE_URL: 'https://staging-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-placeholder',
  SUPABASE_E2E_SMOKE_MODE: 'live',
  SUPABASE_E2E_ALLOW_WRITES: 'true',
  SUPABASE_E2E_CLEANUP: 'true',
  SUPABASE_E2E_USER_ID: 'bb300bde-97fa-438d-ab97-a47dec0ca7d1',
  SUPABASE_E2E_ALLOW_RENDER_EXECUTION: 'true',
  SUPABASE_E2E_ALLOW_CLOUD_RUN: 'true',
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-east1',
  GOOGLE_CLOUD_PROJECT_ID: 'reeditpro',
  GOOGLE_CLOUD_REGION: 'us-east1',
  GCP_WORKLOAD_IDENTITY_PROVIDER: 'projects/1/locations/global/workloadIdentityPools/github-actions/providers/reedkt',
  GCP_SERVICE_ACCOUNT: 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com',
  STAGING_CLOUD_RUN_RENDER_CANARY_URL: 'https://reeditpro-staging-render-canary-4wkjiqvdqa-ue.a.run.app/canary/render',
  STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE: 'https://reeditpro-staging-render-canary-4wkjiqvdqa-ue.a.run.app',
  STAGING_RENDER_CANARY_ID_TOKEN: 'placeholder-id-token',
  STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX: 'gs://reeditpro-staging-render-canary-smoke/previews',
  STAGING_RENDER_CANARY_MEMORY: '2Gi',
  STAGING_RENDER_CANARY_CPU: '2',
  STAGING_RENDER_CANARY_CONCURRENCY: '1',
  STAGING_RENDER_CANARY_TIMEOUT_SECONDS: '300',
  STAGING_RENDER_CANARY_NODE_OPTIONS: '--max-old-space-size=1536',
  GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-staging-render-canary-smoke',
  GCS_GENERATED_ASSETS_BUCKET: 'reeditpro-staging-render-canary-smoke',
  GCS_PROCESSED_MEDIA_BUCKET: 'reeditpro-staging-render-canary-smoke',
  GCS_PREVIEWS_BUCKET: 'reeditpro-staging-render-canary-smoke',
  GCS_EXPORTS_BUCKET: 'reeditpro-staging-render-canary-smoke',
  GCS_THUMBNAILS_BUCKET: 'reeditpro-staging-render-canary-smoke',
  GCS_QA_ARTIFACTS_BUCKET: 'reeditpro-staging-render-canary-smoke',
  GCS_WORKER_TEMP_BUCKET: 'reeditpro-staging-render-canary-smoke',
}

const safePayload = {
  canary: true,
  mode: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
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
  fixture: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_FIXTURE,
  maxDurationSeconds: 3,
  width: 160,
  height: 90,
  fps: 15,
  maxFrames: 45,
  maxWaitSeconds: 180,
  cleanup: true,
  source: {
    bucketName: 'reeditpro-staging-render-canary-smoke',
    objectPath: `workspaces/00000000-0000-4000-8000-000000000001/projects/00000000-0000-4000-8000-000000000002/source-media/${smokeRunId}/tiny-source.mp4`,
    mimeType: 'video/mp4',
    sizeBytes: sourceBytes.byteLength,
    checksumSha256: sourceChecksum,
  },
  preview: {
    bucketName: 'reeditpro-staging-render-canary-smoke',
    objectPath: `workspaces/00000000-0000-4000-8000-000000000001/projects/00000000-0000-4000-8000-000000000002/previews/00000000-0000-4000-8000-000000000003/${smokeRunId}-tiny-preview.mp4`,
  },
}

const env = loadRuntimeEnv(safeSourceEnv)
const readyPreflight = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env,
  sourceEnv: safeSourceEnv,
})
const disabledPreflight = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_SMOKE_MODE: 'disabled', SUPABASE_E2E_ALLOW_WRITES: 'false' }),
  sourceEnv: { ...safeSourceEnv, SUPABASE_E2E_ALLOW_RENDER_EXECUTION: 'false', SUPABASE_E2E_ALLOW_CLOUD_RUN: 'false' },
  expectDisabled: true,
})
const missingWrites = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_ALLOW_WRITES: 'false' }),
  sourceEnv: safeSourceEnv,
})
const missingRenderExecution = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env,
  sourceEnv: { ...safeSourceEnv, SUPABASE_E2E_ALLOW_RENDER_EXECUTION: 'false' },
})
const missingCloudRun = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env,
  sourceEnv: { ...safeSourceEnv, SUPABASE_E2E_ALLOW_CLOUD_RUN: 'false' },
})
const cleanupFalse = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, SUPABASE_E2E_CLEANUP: 'false' }),
  sourceEnv: safeSourceEnv,
})
const localStorageMode = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, STORAGE_MODE: 'local' }),
  sourceEnv: { ...safeSourceEnv, STORAGE_MODE: 'local' },
})
const providerStripe = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env,
  sourceEnv: { ...safeSourceEnv, OPENAI_API_KEY: 'configured', STRIPE_SECRET_KEY: 'configured' },
})
const productionBucket = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env: loadRuntimeEnv({ ...safeSourceEnv, GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-production-source-media' }),
  sourceEnv: { ...safeSourceEnv, GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-production-source-media' },
})
const validRequest = validateStagingRenderInfrastructureCanaryRequest(safePayload)
const nonSmokeSource = validateStagingRenderInfrastructureCanaryRequest({
  ...safePayload,
  source: {
    ...safePayload.source,
    objectPath: 'workspaces/ws/projects/prj/source-media/customer-upload/tiny-source.mp4',
  },
})
const customerMediaPreview = validateStagingRenderInfrastructureCanaryRequest({
  ...safePayload,
  preview: {
    ...safePayload.preview,
    objectPath: 'workspaces/ws/projects/prj/customer-media/render.mp4',
  },
})
const cleanupFalseRequest = validateStagingRenderInfrastructureCanaryRequest({ ...safePayload, cleanup: false })
const serviceSuccess = await runStagingRenderInfrastructureCanary(safePayload, {
  serviceMode: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
  projectId: 'reeditpro',
  googleCloudProject: 'reeditpro',
  region: 'us-east1',
  outputBucketOrPrefix: 'gs://reeditpro-staging-render-canary-smoke/previews',
  expectedHostSuffix: '.run.app',
  renderTimeoutSeconds: 300,
  maxArtifactBytes: 750_000,
  memory: '2Gi',
  cpu: 2,
  concurrency: 1,
  nodeOptions: '--max-old-space-size=1536',
  remotionEntrypoint: 'server/remotion/staging-canary-remotion-entry.ts',
  forbiddenEnvNames: [],
}, fakeDeps())
const realVideoServiceSource = await readFile(new URL('../services/staging-real-video-upload-preview-canary-service.ts', import.meta.url), 'utf8')
const supabaseSmokeServiceSource = await readFile(new URL('../services/supabase-e2e-smoke-service.ts', import.meta.url), 'utf8')
const serializedPayload = JSON.stringify(safePayload).toLowerCase()

const checks = [
  readyPreflight.status === 'ready' ? 'preflight_ready_with_safe_config' : undefined,
  disabledPreflight.ok && disabledPreflight.status === 'skipped' ? 'expect_disabled_skips_without_mutation' : undefined,
  !missingWrites.ok && missingWrites.blockers.some((blocker) => blocker.includes('ALLOW_WRITES')) ? 'allow_writes_required' : undefined,
  !missingRenderExecution.ok && missingRenderExecution.blockers.some((blocker) => blocker.includes('ALLOW_RENDER_EXECUTION')) ? 'allow_render_execution_required' : undefined,
  !missingCloudRun.ok && missingCloudRun.blockers.some((blocker) => blocker.includes('ALLOW_CLOUD_RUN')) ? 'allow_cloud_run_required' : undefined,
  !cleanupFalse.ok && cleanupFalse.blockers.some((blocker) => blocker.includes('CLEANUP')) ? 'cleanup_required' : undefined,
  !localStorageMode.ok && localStorageMode.blockers.some((blocker) => blocker.includes('GCS_STORAGE_REQUIRED')) ? 'gcs_storage_required_for_real_video_canary' : undefined,
  !providerStripe.ok && providerStripe.blockers.some((blocker) => blocker.includes('Provider')) ? 'provider_and_stripe_env_rejected' : undefined,
  !productionBucket.ok && productionBucket.blockers.some((blocker) => blocker.includes('Production')) ? 'production_bucket_rejected' : undefined,
  validRequest.ok ? 'strict_real_video_payload_accepted' : undefined,
  !nonSmokeSource.ok && nonSmokeSource.blockers.some((blocker) => blocker.includes('source object path')) ? 'non_smoke_source_rejected' : undefined,
  !customerMediaPreview.ok && customerMediaPreview.blockers.some((blocker) => blocker.includes('preview object path')) ? 'customer_media_preview_rejected' : undefined,
  !cleanupFalseRequest.ok && cleanupFalseRequest.blockers.some((blocker) => blocker.includes('cleanup')) ? 'request_cleanup_required' : undefined,
  realVideoServiceSource.includes('runPersistedGcsRealVideoUploadPreviewSmoke')
    && !realVideoServiceSource.includes('runPersistedBasicRenderSmoke(context')
    ? 'real_video_canary_uses_gcs_metadata_helper'
    : undefined,
  supabaseSmokeServiceSource.includes('runPersistedGcsRealVideoUploadPreviewSmoke')
    && supabaseSmokeServiceSource.includes('Persisted render smoke requires STORAGE_MODE=local.')
    ? 'local_and_gcs_persisted_paths_are_split'
    : undefined,
  !serializedPayload.includes('signedurl') && !serializedPayload.includes('signed_url') && !serializedPayload.includes('http://')
    ? 'canonical_payload_excludes_signed_urls'
    : undefined,
  safePayload.source.objectPath.includes('/source-media/') && safePayload.preview.objectPath.includes('/previews/')
    ? 'gcs_source_and_preview_use_bucket_object_paths'
    : undefined,
  serviceSuccess.ok
    && serviceSuccess.status === 'completed'
    && serviceSuccess.outputArtifact?.cleanupDelegatedToCaller
    && serviceSuccess.sourceArtifact?.downloaded
    ? 'cloud_run_real_video_service_mock_success'
    : undefined,
].filter(Boolean)

const ok = checks.length === 18
console.log(JSON.stringify({ ok, checks }, null, 2))
if (!ok) process.exitCode = 1

function fakeDeps() {
  const objects = new Set<string>()
  const renderer: CanaryRenderer = {
    async render(input) {
      await writeFile(input.outputPath, Buffer.from('tiny preview render'))
    },
  }
  const artifactStore: CanaryArtifactStore = {
    async download(input) {
      await writeFile(input.localPath, sourceBytes)
    },
    async upload(input) {
      objects.add(`${input.bucketName}/${input.objectPath}`)
    },
    async exists(bucketName, objectPath) {
      return objects.has(`${bucketName}/${objectPath}`)
    },
    async delete(bucketName, objectPath) {
      return objects.delete(`${bucketName}/${objectPath}`)
    },
  }
  return { renderer, artifactStore }
}
