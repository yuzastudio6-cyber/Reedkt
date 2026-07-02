import assert from 'node:assert/strict'
import {
  buildOperatorStatusEndpoint,
  runBetaReadinessOperatorStatusApiFromEnv,
  summarizeOperatorStatusApiResponse,
} from '../cli/beta-readiness-operator-status-api.mjs'

const env = {
  REEDITPRO_BETA_STATUS_API_BASE_URL: 'https://api.staging.reeditpro.example/',
  REEDITPRO_BETA_STATUS_BEARER_TOKEN: 'status-api-secret-token',
  REEDITPRO_BETA_STATUS_WORKSPACE_ID: 'workspace-status-api-smoke',
}

assert.equal(
  buildOperatorStatusEndpoint('https://api.staging.reeditpro.example/', 'workspace/status smoke'),
  'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace%2Fstatus%20smoke',
  'operator status endpoint should encode workspaceId safely',
)
assert.equal(
  buildOperatorStatusEndpoint('https://api.staging.reeditpro.example/'),
  'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status',
  'operator status endpoint should omit query when workspaceId is absent',
)

let capturedUrl = ''
let capturedInit
const blockedFetch = async (url, init) => {
  capturedUrl = url
  capturedInit = init
  return {
    status: 200,
    async json() {
      return {
        ok: true,
        data: {
          status: {
            readyForExternalBeta: false,
            readyForRealUserMediaBeta: false,
            readyForPaidProduction: false,
            evidenceSource: 'stored_workspace_evidence',
            workspaceId: 'workspace-status-api-smoke',
            evidencePacketCount: 2,
            currentGate: {
              totalTools: 49,
              ownerCoverageToolCount: 49,
              readinessSpecToolCount: 49,
              toolBlockers: 4,
              platformBlockers: 1,
              productReadyLocalOssCount: 0,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
              blockerPolicy: 'evidence_driven_block_unsafe_actions_only',
              blockerForwardProgressPolicy: {
                intentionalBlanketBlocksAllowed: false,
                blockerScope: 'named_unsafe_action_only',
                safeForwardProgressRequired: true,
                nextSafeActionRequiredForBlockers: true,
              },
              safeBlockerReductionAllowed: true,
              blockedActionScope: ['external_beta_tool_execution', 'external_beta_launch'],
              allowedForwardProgressScopes: [
                'source_review',
                'local_dependency_install_proof',
                'bounded_command_import_container_proof',
                'diagnostics_and_qa_packets',
                'deployment_preflight_and_platform_evidence_collection',
                'owner_approval_packet_collection',
                'rollback_monitoring_support_planning',
              ],
            },
            evidenceGaps: {
              goNoGoBlockers: ['Production readiness summary remains blocked.'],
              blockedChecklistItems: ['model_weights_not_approved: Model weights not approved yet'],
              toolBlockers: 4,
              platformBlockers: ['Platform evidence is incomplete.'],
            },
            nextActions: [
              'Record accepted bounded per-tool evidence.',
              'After external beta is ready, run beta:readiness:scope-approval-evidence-preflight.',
            ],
            warnings: ['Read-only backend operator status.'],
          },
        },
        warnings: ['No evidence was written by this route.'],
      }
    },
  }
}

const blockedResult = await runBetaReadinessOperatorStatusApiFromEnv(env, blockedFetch)
assert.equal(capturedUrl, 'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace-status-api-smoke', 'CLI should call the operator status endpoint with workspaceId')
assert.equal(capturedInit?.method, 'GET', 'CLI should use GET')
assert.equal(capturedInit?.headers.authorization, 'Bearer status-api-secret-token', 'CLI should send bearer token only in the authorization header')
assert.equal(blockedResult.readyForExternalBeta, false, 'blocked status should remain blocked')
assert.equal(blockedResult.currentGate.safeBlockerReductionAllowed, true, 'CLI should preserve scoped blocker-reduction policy')
assert.equal(
  blockedResult.currentGate.blockerForwardProgressPolicy?.intentionalBlanketBlocksAllowed,
  false,
  'CLI should preserve the no intentional blanket blocker policy',
)
assert.equal(
  blockedResult.currentGate.blockerForwardProgressPolicy?.nextSafeActionRequiredForBlockers,
  true,
  'CLI should preserve next-safe-action requirement for blockers',
)
assert.ok(blockedResult.currentGate.allowedForwardProgressScopes.includes('owner_approval_packet_collection'), 'CLI should preserve owner approval collection as allowed forward progress')
assert.ok(blockedResult.currentGate.allowedForwardProgressScopes.includes('deployment_preflight_and_platform_evidence_collection'), 'CLI should preserve deployment evidence collection as allowed forward progress')
assert.equal(blockedResult.evidenceGaps.goNoGoBlockers, 1, 'CLI should summarize go/no-go blockers')
assert.ok(blockedResult.nextActions.some((action) => action.includes('scope-approval-evidence-preflight')), 'CLI should preserve later scope approval guidance')
assert.equal(JSON.stringify(blockedResult).includes('status-api-secret-token'), false, 'CLI summary must not include bearer token')

await assert.rejects(
  runBetaReadinessOperatorStatusApiFromEnv({
    ...env,
    REEDITPRO_BETA_STATUS_REQUIRE_EXTERNAL_BETA_READY: 'true',
  }, blockedFetch),
  /external beta is not ready/,
  'CLI should fail closed when external beta readiness is required but absent',
)

let noWorkspaceUrl = ''
await runBetaReadinessOperatorStatusApiFromEnv({
  REEDITPRO_BETA_STATUS_API_BASE_URL: 'https://api.staging.reeditpro.example/',
  REEDITPRO_BETA_STATUS_BEARER_TOKEN: 'status-api-secret-token',
}, async (url, init) => {
  noWorkspaceUrl = url
  return blockedFetch(url, init)
})
assert.equal(noWorkspaceUrl, 'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status', 'CLI should support default source-truth status without workspaceId')

let externalAliasUrl = ''
let externalAliasAuth = ''
const externalAliasResult = await runBetaReadinessOperatorStatusApiFromEnv({
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL: 'https://external-api.staging.reeditpro.example/',
  REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN: 'external-status-secret-token',
  REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID: 'workspace-external-alias',
}, async (url, init) => {
  externalAliasUrl = url
  externalAliasAuth = init.headers.authorization
  return blockedFetch(url, init)
})
assert.equal(
  externalAliasUrl,
  'https://external-api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace-external-alias',
  'CLI should reuse external beta operator template API/workspace values when status-specific values are absent',
)
assert.equal(
  externalAliasAuth,
  'Bearer external-status-secret-token',
  'CLI should reuse the external beta bearer token only in the authorization header',
)
assert.equal(
  JSON.stringify(externalAliasResult).includes('external-status-secret-token'),
  false,
  'external alias summary must not include bearer token',
)

await assert.rejects(
  runBetaReadinessOperatorStatusApiFromEnv({
    REEDITPRO_BETA_EXTERNAL_API_BASE_URL: 'https://external-api.staging.reeditpro.example/',
    REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN: 'external-status-secret-token',
    REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY: 'true',
  }, blockedFetch),
  /external beta is not ready/,
  'CLI should fail closed when the external beta template requires ready status but backend status is not ready',
)

const readySummary = summarizeOperatorStatusApiResponse('https://api.example/status', 200, {
  ok: true,
  data: {
    status: {
      readyForExternalBeta: true,
      readyForRealUserMediaBeta: false,
      readyForPaidProduction: false,
      evidenceSource: 'stored_workspace_evidence',
      evidencePacketCount: 3,
      currentGate: {
        blockedActionScope: ['real_user_media_beta', 'paid_production_launch'],
        safeBlockerReductionAllowed: true,
        allowedForwardProgressScopes: ['diagnostics_and_qa_packets'],
      },
      evidenceGaps: {
        goNoGoBlockers: [],
        blockedChecklistItems: [],
        platformBlockers: [],
      },
      nextActions: ['Keep paid production blocked.'],
    },
  },
})
assert.equal(readySummary.readyForExternalBeta, true, 'summary should preserve ready external beta status')
assert.equal(readySummary.readyForPaidProduction, false, 'summary should preserve paid production blocker')
assert.deepEqual(readySummary.currentGate.blockedActionScope, ['real_user_media_beta', 'paid_production_launch'], 'summary should preserve blocked action scopes')
assert.deepEqual(readySummary.currentGate.allowedForwardProgressScopes, ['diagnostics_and_qa_packets'], 'summary should preserve allowed forward-progress scopes')

console.log(JSON.stringify({
  ok: true,
  endpoint: blockedResult.endpoint,
  evidenceSource: blockedResult.evidenceSource,
  evidencePacketCount: blockedResult.evidencePacketCount,
  externalBetaReady: blockedResult.readyForExternalBeta,
  tokenInSummary: JSON.stringify(blockedResult).includes('status-api-secret-token'),
  requireReadyFailsClosed: true,
  defaultStatusUrl: noWorkspaceUrl,
  externalAliasUrl,
}, null, 2))
