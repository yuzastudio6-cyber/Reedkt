import { writeFile } from 'node:fs/promises'
import {
  STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  runStagingRenderInfrastructureCanary,
  validateStagingRenderInfrastructureCanaryRequest,
  type CanaryArtifactStore,
  type CanaryRenderer,
} from '../services/staging-render-infrastructure-canary-service'

const smokeRunId = 'rp-e2e-smoke-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const safeEnv = {
  serviceMode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  projectId: 'reeditpro-staging-canary',
  outputBucketOrPrefix: 'gs://reeditpro-staging-render-canary-smoke/previews',
  expectedHostSuffix: '.run.app',
  renderTimeoutSeconds: 120,
  maxArtifactBytes: 750_000,
  remotionEntrypoint: 'server/remotion/staging-canary-remotion-entry.ts',
}
const safePayload = {
  canary: true,
  mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  smokeRunId,
  fixture: STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
  maxDurationSeconds: 3,
  maxFrames: 45,
  width: 160,
  height: 90,
  fps: 15,
  cleanup: true,
}

const requestValidation = validateStagingRenderInfrastructureCanaryRequest(safePayload)
const missingCleanup = validateStagingRenderInfrastructureCanaryRequest({ ...safePayload, cleanup: false })
const oversized = validateStagingRenderInfrastructureCanaryRequest({
  ...safePayload,
  width: 640,
  height: 480,
  maxDurationSeconds: 8,
})
const productionEnvResult = await runStagingRenderInfrastructureCanary(safePayload, {
  ...safeEnv,
  projectId: 'reeditpro-production',
  outputBucketOrPrefix: 'gs://reeditpro-production-canary/previews',
}, fakeDeps())
const cleanupFailure = await runStagingRenderInfrastructureCanary(safePayload, safeEnv, fakeDeps({ deleteSucceeds: false }))
const success = await runStagingRenderInfrastructureCanary(safePayload, safeEnv, fakeDeps())

const checks = [
  requestValidation.ok ? 'valid_request_passes' : undefined,
  !missingCleanup.ok && missingCleanup.blockers.some((blocker) => blocker.includes('cleanup')) ? 'cleanup_required' : undefined,
  !oversized.ok && oversized.blockers.some((blocker) => blocker.includes('320x240')) ? 'oversized_render_rejected' : undefined,
  !productionEnvResult.ok && productionEnvResult.strictValidation.blockers.some((blocker) => blocker.includes('production')) ? 'production_env_rejected' : undefined,
  !cleanupFailure.ok && cleanupFailure.error?.message.includes('cleanup') ? 'artifact_cleanup_failure_rejected' : undefined,
  success.ok && success.outputArtifact?.existsBeforeCleanup && success.outputArtifact.existsAfterCleanup === false ? 'artifact_create_verify_cleanup_passes' : undefined,
  success.outputArtifact?.objectPath.includes(smokeRunId) ? 'artifact_path_smoke_traceable' : undefined,
].filter(Boolean)

const ok = checks.length === 7
console.log(JSON.stringify({ ok, checks }, null, 2))
if (!ok) process.exitCode = 1

function fakeDeps(options: { deleteSucceeds?: boolean } = {}) {
  const objects = new Set<string>()
  const renderer: CanaryRenderer = {
    async render(input) {
      await writeFile(input.outputPath, Buffer.from('tiny fake mp4 canary artifact'))
    },
  }
  const store: CanaryArtifactStore = {
    async upload(input) {
      objects.add(`${input.bucketName}/${input.objectPath}`)
    },
    async exists(bucketName, objectPath) {
      return objects.has(`${bucketName}/${objectPath}`)
    },
    async delete(bucketName, objectPath) {
      if (options.deleteSucceeds === false) return false
      return objects.delete(`${bucketName}/${objectPath}`)
    },
  }
  return { renderer, artifactStore: store }
}
