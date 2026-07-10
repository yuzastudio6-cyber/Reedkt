import assert from 'node:assert/strict'
import {
  buildBetaToolsCoreRealCheckEvidenceRequest,
  runBetaToolsCoreRealCheckEvidenceFromEnv,
  summarizeCoreRealCheckEvidenceResponse,
  type BetaToolsCoreRealCheckEvidenceEnv,
  type CoreRealCheckEvidenceFetch,
} from '../cli/beta-tools-core-real-check-evidence'

const env: BetaToolsCoreRealCheckEvidenceEnv = {
  REEDITPRO_BETA_TOOLS_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_TOOLS_BEARER_TOKEN: 'bearer-token-secret-for-smoke',
  REEDITPRO_BETA_TOOLS_WORKSPACE_ID: 'workspace-core-real-check-cli-smoke',
  REEDITPRO_BETA_TOOLS_PROJECT_ID: 'project-core-real-check-cli-smoke',
  REEDITPRO_BETA_TOOLS_SOURCE_ID: 'beta-tools-core-real-check-cli-smoke',
  REEDITPRO_BETA_TOOLS_SOURCE_SHA: 'cccccccccccccccccccccccccccccccccccccccc',
  REEDITPRO_BETA_TOOLS_IDEMPOTENCY_KEY: 'beta-tools-core-real-check-cli-smoke',
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES: 'Staging operator requested bounded core tool evidence.',
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS: 'ffmpeg,ffprobe,sharp,remotion',
  REEDITPRO_BETA_TOOLS_INCLUDE_WARNINGS: 'false',
  REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE: 'true',
}

const request = buildBetaToolsCoreRealCheckEvidenceRequest(env)
assert.equal(request.workspaceId, env.REEDITPRO_BETA_TOOLS_WORKSPACE_ID)
assert.equal(request.toolIds?.length, 4, 'CLI should parse requested tool IDs')
assert.equal(request.acceptProductionReadiness, true, 'production-readiness acceptance should require explicit confirmation')
assert.equal(request.acceptProductReadyLocalOss, true, 'product-ready acceptance should require explicit confirmation')
assert.equal(JSON.stringify(request).includes('bearer-token-secret-for-smoke'), false, 'request body must not include bearer token')

assert.throws(() => buildBetaToolsCoreRealCheckEvidenceRequest({
  ...env,
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'false',
}), /PRODUCT_READY_LOCAL_OSS_ACCEPTANCE/, 'product-ready local OSS acceptance must require explicit confirmation')

assert.throws(() => buildBetaToolsCoreRealCheckEvidenceRequest({
  ...env,
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS: 'ffmpeg,unknown-tool',
}), /Unknown production tool IDs/, 'unknown production tool IDs should fail before backend call')

await assert.rejects(
  runBetaToolsCoreRealCheckEvidenceFromEnv({
    ...env,
    REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES: 'Bearer should-not-be-here',
  }, async () => {
    throw new Error('fetch should not run for secret-like notes')
  }),
  /secret-like/,
  'secret-like notes should fail before backend call',
)

let capturedUrl = ''
let capturedInit: Parameters<CoreRealCheckEvidenceFetch>[1] | undefined
const fetchImpl: CoreRealCheckEvidenceFetch = async (url, init) => {
  capturedUrl = url
  capturedInit = init
  return {
    status: 201,
    async json() {
      return {
        ok: true,
        data: {
          acceptedToolEvidence: [
            { toolId: 'ffmpeg' },
            { toolId: 'ffprobe' },
            { toolId: 'sharp' },
            { toolId: 'remotion' },
          ],
          skippedToolResults: [],
          readinessSummary: {
            totalSpecs: 4,
            statuses: { passed: 4 },
          },
          report: {
            toolExecutionReadiness: {
              productReadyLocalOssCount: 4,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
              blockers: [],
              platformBlockers: [{ blockerId: 'production_billing_deployment_unverified' }],
            },
          },
        },
        warnings: ['Fake server warning: no deployed backend was touched by this smoke.'],
      }
    },
  }
}

const result = await runBetaToolsCoreRealCheckEvidenceFromEnv(env, fetchImpl)
assert.equal(capturedUrl, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence/core-real-check', 'CLI should post to core real-check route')
assert.equal(capturedInit?.method, 'POST', 'CLI should use POST')
assert.equal(capturedInit?.headers.authorization, 'Bearer bearer-token-secret-for-smoke', 'bearer token should be sent only as auth header')
assert.equal(capturedInit?.headers['idempotency-key'], env.REEDITPRO_BETA_TOOLS_IDEMPOTENCY_KEY, 'CLI should send idempotency key')
assert.equal(result.acceptedToolCount, 4, 'CLI summary should count accepted tools')
assert.equal(result.skippedToolCount, 0, 'CLI summary should count skipped tools')
assert.equal(result.toolExecution.productReadyLocalOssCount, 4, 'CLI summary should surface product-ready local OSS count')
assert.equal(result.toolExecution.externalBetaToolExecutionAllowed, false, 'CLI summary must not claim external beta is enabled')
assert.equal(result.toolExecution.productionToolExecutionAllowed, false, 'CLI summary must not claim production is enabled')
assert.equal(JSON.stringify(result).includes('bearer-token-secret-for-smoke'), false, 'summary must not include bearer token')

await assert.rejects(
  runBetaToolsCoreRealCheckEvidenceFromEnv({
    ...env,
    REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE: 'true',
  }, async () => ({
    status: 200,
    async json() {
      return {
        ok: true,
        data: {
          acceptedToolEvidence: [],
          skippedToolResults: [{ toolId: 'ffmpeg', status: 'missing' }],
          report: {
            toolExecutionReadiness: {
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
            },
          },
        },
        warnings: [],
      }
    },
  })),
  /did not accept any tools/,
  'require-accepted-evidence should fail closed when backend accepts no tools',
)

const failedSummary = summarizeCoreRealCheckEvidenceResponse('https://api.example/core-real-check', 400, {
  ok: false,
  error: { code: 'VALIDATION_FAILED', message: 'details omitted' },
})
assert.equal(failedSummary.ok, false, 'failed response summary should keep ok=false')
assert.equal(failedSummary.acceptedToolCount, 0, 'failed response summary should not invent accepted tools')

console.log(JSON.stringify({
  ok: true,
  endpoint: result.endpoint,
  acceptedToolCount: result.acceptedToolCount,
  tokenInSummary: JSON.stringify(result).includes('bearer-token-secret-for-smoke'),
  productReadyRequiresConfirmation: true,
  unknownToolRejected: true,
  secretNotesRejected: true,
  requireAcceptedEvidenceFailsClosed: true,
  externalBetaAllowed: result.toolExecution.externalBetaToolExecutionAllowed,
  productionAllowed: result.toolExecution.productionToolExecutionAllowed,
}, null, 2))
