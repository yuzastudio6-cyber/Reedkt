import { writeFile } from 'node:fs/promises'
import { stringifyCanaryJson } from '../cloud-run/canary-safe-json'
import {
  STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  runStagingRenderInfrastructureCanary,
  validateStagingRenderInfrastructureCanaryEnv,
  validateStagingRenderInfrastructureCanaryRequest,
  type CanaryArtifactStore,
  type CanaryRenderer,
} from '../services/staging-render-infrastructure-canary-service'

process.env.STAGING_RENDER_CANARY_DISABLE_AUTOSTART = 'true'
const { createStagingRenderCanaryRuntimeSummary } = await import('../cloud-run/staging-render-canary-service')

const smokeRunId = 'rp-e2e-smoke-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const safeEnv = {
  serviceMode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
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
const strictManualPayload = {
  ...safePayload,
  smokeRunId: 'rp-e2e-smoke-00000000-0000-4000-8000-000000000000',
  stagingOnly: true,
  allowCloudRun: true,
  allowRemotion: true,
  allowProviders: false,
  allowStripe: false,
  maxWaitSeconds: 180,
}

const requestValidation = validateStagingRenderInfrastructureCanaryRequest(safePayload)
const strictManualRequestValidation = validateStagingRenderInfrastructureCanaryRequest(strictManualPayload)
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
  googleCloudProject: 'reeditpro-production',
  outputBucketOrPrefix: 'gs://reeditpro-production-canary/previews',
}, fakeDeps())
const neutralProjectWithoutDedicatedControls = validateStagingRenderInfrastructureCanaryEnv({
  ...safeEnv,
  serviceMode: '',
})
const providerStripeEnv = validateStagingRenderInfrastructureCanaryEnv({
  ...safeEnv,
  forbiddenEnvNames: ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY'],
})
const excessiveResourceEnv = validateStagingRenderInfrastructureCanaryEnv({
  ...safeEnv,
  memory: '4Gi',
  cpu: 4,
  concurrency: 2,
  renderTimeoutSeconds: 600,
  nodeOptions: '--max-old-space-size=4096',
})
const missingNodeOptionsEnv = validateStagingRenderInfrastructureCanaryEnv({
  ...safeEnv,
  nodeOptions: '',
})
const cleanupFailure = await runStagingRenderInfrastructureCanary(safePayload, safeEnv, fakeDeps({ deleteSucceeds: false }))
const success = await runStagingRenderInfrastructureCanary(safePayload, safeEnv, fakeDeps())
const strictManualSuccess = await runStagingRenderInfrastructureCanary(strictManualPayload, safeEnv, fakeDeps())
const runtimeSummary = createStagingRenderCanaryRuntimeSummary({
  STAGING_RENDER_CANARY_MODE: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
  STAGING_RENDER_CANARY_MEMORY: '2Gi',
  STAGING_RENDER_CANARY_CPU: '2',
  STAGING_RENDER_CANARY_CONCURRENCY: '1',
  STAGING_RENDER_CANARY_TIMEOUT_SECONDS: '300',
  STAGING_RENDER_CANARY_MAX_ARTIFACT_BYTES: '750000',
  NODE_OPTIONS: '--max-old-space-size=1536',
})
const hugeCircularError = createHugeCircularError()
const serializedHugeError = stringifyCanaryJson(hugeCircularError)
const hugeFailure = await runStagingRenderInfrastructureCanary(safePayload, safeEnv, fakeDeps({ renderError: hugeCircularError }))
const serializedHugeFailure = stringifyCanaryJson(hugeFailure)

const checks = [
  requestValidation.ok ? 'valid_request_passes' : undefined,
  strictManualRequestValidation.ok && strictManualSuccess.ok ? 'strict_manual_payload_passes' : undefined,
  validateStagingRenderInfrastructureCanaryEnv(safeEnv).length === 0 ? 'neutral_reeditpro_project_with_dedicated_controls_passes' : undefined,
  neutralProjectWithoutDedicatedControls.some((blocker) => blocker.includes('verified neutral reeditpro staging project')) ? 'neutral_project_requires_dedicated_controls' : undefined,
  providerStripeEnv.some((blocker) => blocker.includes('OPENAI_API_KEY')) && providerStripeEnv.some((blocker) => blocker.includes('STRIPE_SECRET_KEY')) ? 'provider_and_stripe_env_rejected' : undefined,
  excessiveResourceEnv.some((blocker) => blocker.includes('2Gi'))
    && excessiveResourceEnv.some((blocker) => blocker.includes('exactly 2'))
    && excessiveResourceEnv.some((blocker) => blocker.includes('CONCURRENCY'))
    && excessiveResourceEnv.some((blocker) => blocker.includes('NODE_OPTIONS'))
    ? 'excessive_resource_env_rejected'
    : undefined,
  missingNodeOptionsEnv.some((blocker) => blocker.includes('NODE_OPTIONS')) ? 'missing_node_options_env_rejected' : undefined,
  !missingCleanup.ok && missingCleanup.blockers.some((blocker) => blocker.includes('cleanup')) ? 'cleanup_required' : undefined,
  !oversized.ok && oversized.blockers.some((blocker) => blocker.includes('320x240')) ? 'oversized_render_rejected' : undefined,
  !productionEnvResult.ok && productionEnvResult.strictValidation.blockers.some((blocker) => blocker.includes('production')) ? 'production_env_rejected' : undefined,
  !cleanupFailure.ok && cleanupFailure.error?.message.includes('cleanup') ? 'artifact_cleanup_failure_rejected' : undefined,
  success.ok && success.outputArtifact?.existsBeforeCleanup && success.outputArtifact.existsAfterCleanup === false ? 'artifact_create_verify_cleanup_passes' : undefined,
  success.outputArtifact?.objectPath.includes(smokeRunId) ? 'artifact_path_smoke_traceable' : undefined,
  serializedHugeError.length < 12_000
    && serializedHugeError.includes('[redacted]')
    && serializedHugeError.includes('"byteLength":1048576')
    && !serializedHugeError.includes('service-role-secret')
    && !serializedHugeError.includes('Bearer secret-token-value')
    ? 'safe_serializer_bounds_huge_circular_error'
    : undefined,
  !hugeFailure.ok
    && serializedHugeFailure.length < 6_000
    && !serializedHugeFailure.includes('service-role-secret')
    && !serializedHugeFailure.includes('Bearer secret-token-value')
    ? 'failure_path_sanitizes_huge_error'
    : undefined,
  runtimeSummary.runtime.nodeOptionsPresent
    && runtimeSummary.runtime.memory === '2Gi'
    && runtimeSummary.runtime.cpu === 2
    && runtimeSummary.runtime.concurrency === 1
    && runtimeSummary.runtime.timeoutSeconds === 300
    && runtimeSummary.noSecretsReported
    ? 'runtime_health_summary_reports_bounded_limits'
    : undefined,
].filter(Boolean)

const ok = checks.length === 16
console.log(JSON.stringify({ ok, checks }, null, 2))
if (!ok) process.exitCode = 1

function fakeDeps(options: { deleteSucceeds?: boolean; renderError?: unknown } = {}) {
  const objects = new Set<string>()
  const renderer: CanaryRenderer = {
    async render(input) {
      if (options.renderError) throw options.renderError
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

function createHugeCircularError(): Error {
  const error = new Error(`Huge circular render failure ${'x'.repeat(50_000)} secret-token-value`)
  error.stack = [
    `Error: Huge circular render failure ${'x'.repeat(10_000)} secret-token-value`,
    ...Array.from({ length: 100 }, (_, index) => `    at hugeStackFrame${index} (secret-file-${index}.ts:1:1)`),
  ].join('\n')
  const record = error as Error & Record<string, unknown>
  record.authorization = 'Bearer secret-token-value'
  record.service_role_key = 'service-role-secret'
  record.buffer = Buffer.alloc(1024 * 1024)
  record.self = record
  record.items = Array.from({ length: 100 }, (_, index) => ({
    index,
    secret: `secret-${index}`,
    value: 'x'.repeat(10_000),
  }))
  return error
}
