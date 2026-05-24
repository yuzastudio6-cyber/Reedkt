import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import {
  STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  runStagingRenderInfrastructureCanary,
  validateStagingRealVideoUploadPreviewCanaryRequest,
  validateStagingRenderInfrastructureCanaryRequest,
  type CanaryArtifactStore,
  type CanaryRenderer,
} from '../services/staging-render-infrastructure-canary-service'
import { evaluateStagingRealVideoUploadPreviewCanaryPreflight } from '../services/staging-real-video-upload-preview-canary-service'

const smokeRunId = 'rp-e2e-smoke-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const sourceBytes = Buffer.from('fake tiny source video bytes')
const sourceChecksum = createHash('sha256').update(sourceBytes).digest('hex')
let lastRenderInput: Parameters<CanaryRenderer['render']>[0] | undefined

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
  STAGING_RENDER_CANARY_MODE: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
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
    mimeType: 'video/mp4',
  },
  render: {
    maxDurationSeconds: 3,
    width: 160,
    height: 90,
    fps: 15,
    maxFrames: 45,
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
const syntheticRejectsRealVideo = validateStagingRenderInfrastructureCanaryRequest(safePayload)
const validRequest = validateStagingRealVideoUploadPreviewCanaryRequest(safePayload)
const syntheticFixtureRequest = validateStagingRealVideoUploadPreviewCanaryRequest({
  ...safePayload,
  fixture: 'tiny-muted-3s',
})
const missingSource = validateStagingRealVideoUploadPreviewCanaryRequest({
  ...safePayload,
  source: undefined,
})
const missingPreview = validateStagingRealVideoUploadPreviewCanaryRequest({
  ...safePayload,
  preview: undefined,
})
const nonSmokeSource = validateStagingRealVideoUploadPreviewCanaryRequest({
  ...safePayload,
  source: {
    ...safePayload.source,
    objectPath: 'workspaces/ws/projects/prj/source-media/customer-upload/tiny-source.mp4',
  },
})
const signedUrlSource = validateStagingRealVideoUploadPreviewCanaryRequest({
  ...safePayload,
  source: {
    ...safePayload.source,
    signedUrl: 'https://signed.example.invalid/source.mp4',
  },
})
const oversizedRender = validateStagingRealVideoUploadPreviewCanaryRequest({
  ...safePayload,
  render: {
    ...safePayload.render,
    maxDurationSeconds: 8,
    width: 640,
  },
})
const customerMediaPreview = validateStagingRealVideoUploadPreviewCanaryRequest({
  ...safePayload,
  preview: {
    ...safePayload.preview,
    objectPath: 'workspaces/ws/projects/prj/customer-media/render.mp4',
  },
})
const providerStripeRequest = validateStagingRealVideoUploadPreviewCanaryRequest({
  ...safePayload,
  allowProviders: true,
  allowStripe: true,
})
const cleanupFalseRequest = validateStagingRealVideoUploadPreviewCanaryRequest({ ...safePayload, cleanup: false })
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
const stagingCanaryServiceSource = await readFile(new URL('../services/staging-render-infrastructure-canary-service.ts', import.meta.url), 'utf8')
const remotionEntrySource = await readFile(new URL('../remotion/staging-canary-remotion-entry.ts', import.meta.url), 'utf8')
const supabaseSmokeServiceSource = await readFile(new URL('../services/supabase-e2e-smoke-service.ts', import.meta.url), 'utf8')
const serializedPayload = JSON.stringify(safePayload).toLowerCase()
const sourceHandoffSource = `${stagingCanaryServiceSource}\n${remotionEntrySource}`
const tempRoot = path.join(os.tmpdir(), 'reeditpro-canary', smokeRunId)

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
  !syntheticRejectsRealVideo.ok
    && syntheticRejectsRealVideo.blockers.some((blocker) => blocker.includes(`mode must be ${STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE}`))
    ? 'synthetic_validator_rejects_real_video_mode'
    : undefined,
  validRequest.ok ? 'strict_real_video_payload_accepted' : undefined,
  !syntheticFixtureRequest.ok && syntheticFixtureRequest.blockers.some((blocker) => blocker.includes('fixture is not required'))
    ? 'real_video_rejects_synthetic_fixture_requirement'
    : undefined,
  !missingSource.ok && missingSource.blockers.some((blocker) => blocker.includes('source bucket/object metadata')) ? 'missing_source_rejected' : undefined,
  !missingPreview.ok && missingPreview.blockers.some((blocker) => blocker.includes('preview bucket/object metadata')) ? 'missing_preview_rejected' : undefined,
  !nonSmokeSource.ok && nonSmokeSource.blockers.some((blocker) => blocker.includes('source object path')) ? 'non_smoke_source_rejected' : undefined,
  !signedUrlSource.ok && signedUrlSource.blockers.some((blocker) => blocker.includes('signed URLs')) ? 'signed_url_source_rejected' : undefined,
  !oversizedRender.ok && oversizedRender.blockers.some((blocker) => blocker.includes('width/height')) ? 'oversized_render_rejected' : undefined,
  !customerMediaPreview.ok && customerMediaPreview.blockers.some((blocker) => blocker.includes('preview object path')) ? 'customer_media_preview_rejected' : undefined,
  !providerStripeRequest.ok
    && providerStripeRequest.blockers.some((blocker) => blocker.includes('allowProviders'))
    && providerStripeRequest.blockers.some((blocker) => blocker.includes('allowStripe'))
    ? 'provider_and_stripe_request_rejected'
    : undefined,
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
  !sourceHandoffSource.includes('sourceDataUrl')
    && !sourceHandoffSource.includes('data:video/mp4;base64')
    && !stagingCanaryServiceSource.includes("toString('base64')")
    ? 'real_video_handoff_excludes_base64_data_urls'
    : undefined,
  stagingCanaryServiceSource.includes("sourceStaticFilePath: REAL_VIDEO_STATIC_SOURCE_FILE")
    && stagingCanaryServiceSource.includes("publicDir: input.sourcePublicDir")
    && stagingCanaryServiceSource.includes('symlinkPublicDir: false')
    ? 'real_video_renderer_uses_remotion_public_dir'
    : undefined,
  stagingCanaryServiceSource.includes("path.join(os.tmpdir(), 'reeditpro-canary', input.smokeRunId)")
    && stagingCanaryServiceSource.includes("path.join(tempDir, 'public')")
    ? 'real_video_source_download_uses_smoke_scoped_temp_path'
    : undefined,
  remotionEntrySource.includes('sourceStaticFilePath')
    && remotionEntrySource.includes('staticFile(sourceStaticFilePath)')
    ? 'remotion_entry_uses_static_file_source'
    : undefined,
  remotionEntrySource.includes("value === 'source.mp4'")
    && remotionEntrySource.includes("lower.includes('data:video')")
    && remotionEntrySource.includes("lower.includes('base64')")
    && remotionEntrySource.includes("lower.includes('/proxy?src=data')")
    && remotionEntrySource.includes("lower.startsWith('file:')")
    ? 'remotion_entry_rejects_unsafe_source_references'
    : undefined,
  lastRenderInput?.sourcePath?.endsWith(path.join('reeditpro-canary', smokeRunId, 'source.mp4'))
    && lastRenderInput?.sourcePublicDir?.endsWith(path.join('reeditpro-canary', smokeRunId, 'public'))
    && lastRenderInput?.sourceStaticFilePath === 'source.mp4'
    ? 'renderer_received_short_static_source_reference'
    : undefined,
  !existsSync(tempRoot) ? 'smoke_scoped_temp_source_cleanup_completed' : undefined,
  serviceSuccess.ok
    && serviceSuccess.status === 'completed'
    && serviceSuccess.outputArtifact?.cleanupDelegatedToCaller
    && serviceSuccess.sourceArtifact?.downloaded
    ? 'cloud_run_real_video_service_mock_success'
    : undefined,
].filter(Boolean)

const ok = checks.length === 32
console.log(JSON.stringify({ ok, checks }, null, 2))
if (!ok) process.exitCode = 1

function fakeDeps() {
  const objects = new Set<string>()
  const renderer: CanaryRenderer = {
    async render(input) {
      lastRenderInput = input
      const renderedInput = JSON.stringify(input).toLowerCase()
      if (renderedInput.includes('data:video') || renderedInput.includes('base64') || renderedInput.includes('/proxy?src=data')) {
        throw new Error('Real-video renderer input must not contain raw video data URLs.')
      }
      if (!input.sourcePath?.endsWith(path.join('reeditpro-canary', smokeRunId, 'source.mp4'))) {
        throw new Error('Real-video renderer did not receive the smoke-scoped downloaded source path.')
      }
      if (!input.sourcePublicDir?.endsWith(path.join('reeditpro-canary', smokeRunId, 'public'))) {
        throw new Error('Real-video renderer did not receive the smoke-scoped Remotion public directory.')
      }
      if (input.sourceStaticFilePath !== 'source.mp4') {
        throw new Error('Real-video renderer did not receive a short static source reference.')
      }
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
