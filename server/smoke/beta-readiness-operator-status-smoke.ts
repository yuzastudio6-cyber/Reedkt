import assert from 'node:assert/strict'
import {
  buildBetaReadinessOperatorStatus,
  type BetaReadinessOperatorStatusEnv,
} from '../cli/beta-readiness-operator-status'

const completeEnv: BetaReadinessOperatorStatusEnv = {
  REEDITPRO_BETA_TOOLS_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_TOOLS_BEARER_TOKEN: 'tool-bearer-token-secret-for-smoke',
  REEDITPRO_BETA_TOOLS_WORKSPACE_ID: 'workspace-operator-status-smoke',
  REEDITPRO_BETA_TOOLS_PROJECT_ID: 'project-operator-status-smoke',
  REEDITPRO_BETA_TOOLS_SOURCE_ID: 'beta-tools-operator-status-smoke',
  REEDITPRO_BETA_TOOLS_SOURCE_SHA: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  REEDITPRO_BETA_TOOLS_IDEMPOTENCY_KEY: 'beta-tools-operator-status-smoke',
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES: 'Staging operator prepared bounded tool evidence.',
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS: 'ffmpeg,ffprobe,sharp,remotion',
  REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_PLATFORM_BEARER_TOKEN: 'platform-bearer-token-secret-for-smoke',
  REEDITPRO_BETA_PLATFORM_WORKSPACE_ID: 'workspace-operator-status-smoke',
  REEDITPRO_BETA_PLATFORM_PROJECT_ID: 'project-operator-status-smoke',
  REEDITPRO_BETA_PLATFORM_SOURCE_ID: 'beta-platform-operator-status-smoke',
  REEDITPRO_BETA_PLATFORM_SOURCE_SHA: 'ffffffffffffffffffffffffffffffffffffffff',
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT: 'staging',
  REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY: 'beta-platform-operator-status-smoke',
  REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES: 'true',
  REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID: 'tool-cost-event-operator-status-smoke',
  REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_REQUIRE_READY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE: 'Staging member and non-member RLS readback passed with scoped rows only.',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE: 'Billing owner approved Stripe boundary and service-fee exclusion.',
  REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE: 'Monitoring dashboard, alert routing, and thresholds verified in staging.',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE: 'Staging billing QA passed for write, replay, summary, settlement, and non-billable failure cases.',
  REEDITPRO_BETA_LAUNCH_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_LAUNCH_BEARER_TOKEN: 'launch-bearer-token-secret-for-smoke',
  REEDITPRO_BETA_LAUNCH_WORKSPACE_ID: 'workspace-operator-status-smoke',
  REEDITPRO_BETA_LAUNCH_PROJECT_ID: 'project-operator-status-smoke',
  REEDITPRO_BETA_LAUNCH_SOURCE_ID: 'beta-launch-operator-status-smoke',
  REEDITPRO_BETA_LAUNCH_SOURCE_SHA: 'dddddddddddddddddddddddddddddddddddddddd',
  REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY: 'beta-launch-operator-status-smoke',
  REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE: 'Model/license owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE: 'Deployment owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE: 'Security owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE: 'Storage/privacy owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE: 'Legal owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE: 'Monitoring owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE: 'Support owner approved external beta scope.',
}

const readyReport = buildBetaReadinessOperatorStatus(completeEnv)
assert.equal(readyReport.ok, true, 'complete operator inputs should pass combined readiness')
assert.equal(readyReport.operatorInputsReady, true, 'complete operator inputs should be ready')
assert.equal(readyReport.toolEvidenceReady, true, 'complete tool evidence inputs should be ready')
assert.equal(readyReport.platformEvidenceReady, true, 'complete platform evidence inputs should be ready')
assert.equal(readyReport.launchApprovalEvidenceReady, true, 'complete launch approval inputs should be ready')
assert.equal(readyReport.currentGate.totalTools, 49, 'operator report should include current total tool count')
assert.equal(readyReport.currentGate.externalBetaToolExecutionAllowed, false, 'operator status must not claim external beta is enabled')
assert.equal(readyReport.currentGate.productionToolExecutionAllowed, false, 'operator status must not claim production is enabled')
assert.equal(readyReport.currentGate.safeBlockerReductionAllowed, true, 'operator status should allow safe blocker-reduction lanes')
assert.deepEqual(readyReport.currentGate.blockedActionScope, ['external_beta_tool_execution', 'paid_production_tool_execution'], 'operator status should block only beta/production execution actions')
assert.ok(readyReport.currentGate.allowedForwardProgressScopes.includes('owner_approval_packet_collection'), 'operator status should preserve owner approval collection as allowed forward progress')
assert.ok(readyReport.currentGate.allowedForwardProgressScopes.includes('bounded_command_import_container_proof'), 'operator status should preserve bounded proof lanes as allowed forward progress')
assert.ok(readyReport.currentGate.allowedForwardProgressScopes.includes('safe_blocker_reduction_preview'), 'operator status should expose local preview as allowed forward progress')
assert.equal(readyReport.manifest.blockersAreEvidenceGaps, true, 'operator status should preserve evidence-driven blocker policy')
assert.equal(readyReport.toolEvidence.previewCommand, 'npm run beta:tools:core-real-check-preview', 'operator status should name the local preview command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:tools:core-real-check-evidence')), 'ready report should name tool evidence command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:platform:staging-evidence-probe')), 'ready report should name platform evidence command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:launch-approval-evidence')), 'ready report should name launch approval evidence command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:scope-approval-evidence-preflight')), 'ready report should name later scope approval evidence preflight command')
assert.equal(JSON.stringify(readyReport).includes('tool-bearer-token-secret-for-smoke'), false, 'operator report must not print tool bearer token')
assert.equal(JSON.stringify(readyReport).includes('platform-bearer-token-secret-for-smoke'), false, 'operator report must not print platform bearer token')
assert.equal(JSON.stringify(readyReport).includes('launch-bearer-token-secret-for-smoke'), false, 'operator report must not print launch bearer token')

const emptyReport = buildBetaReadinessOperatorStatus({})
assert.equal(emptyReport.ok, false, 'missing operator env should fail combined readiness')
assert.equal(emptyReport.operatorInputsReady, false, 'missing operator env should not be ready')
assert.equal(emptyReport.toolEvidenceReady, false, 'missing operator env should block tool evidence readiness')
assert.equal(emptyReport.platformEvidenceReady, false, 'missing operator env should block platform evidence readiness')
assert.equal(emptyReport.launchApprovalEvidenceReady, false, 'missing operator env should block launch approval evidence readiness')
assert.ok(emptyReport.toolEvidence.missingConfiguration.some((item) => item.includes('REEDITPRO_BETA_TOOLS_API_BASE_URL')), 'empty report should name missing tool API base URL')
assert.ok(emptyReport.platformEvidence.missingConfiguration.some((item) => item.includes('REEDITPRO_BETA_PLATFORM_API_BASE_URL')), 'empty report should name missing platform API base URL')
assert.ok(emptyReport.launchApprovalEvidence.missingConfiguration.some((item) => item.includes('REEDITPRO_BETA_LAUNCH_API_BASE_URL')), 'empty report should name missing launch API base URL')
assert.ok(emptyReport.launchApprovalEvidence.missingOwnerApprovals.some((item) => item.includes('support')), 'empty report should name launch approval gaps')
assert.ok(emptyReport.platformEvidence.missingOwnerApprovals.includes('support owner approval'), 'empty report should name owner approval gaps')
assert.ok(emptyReport.platformEvidence.missingAttestations.includes('staging_billing_qa_verified'), 'empty report should name attestation gaps')
assert.ok(emptyReport.nextActions.some((action) => action.includes('core-real-check-preview')), 'empty report should direct operator to the local blocker-reduction preview')
assert.ok(emptyReport.nextActions.some((action) => action.includes('core-real-check-evidence-preflight')), 'empty report should direct operator to tool preflight')
assert.ok(emptyReport.nextActions.some((action) => action.includes('staging-evidence-preflight')), 'empty report should direct operator to platform preflight')
assert.ok(emptyReport.nextActions.some((action) => action.includes('launch-approval-evidence-preflight')), 'empty report should direct operator to launch approval preflight')
assert.ok(emptyReport.nextActions.some((action) => action.includes('REEDITPRO_BETA_SCOPE_APPROVAL_MODE=real_user_media_beta')), 'empty report should preserve later scope approval lane guidance')

console.log(JSON.stringify({
  ok: true,
  readyOperatorInputs: readyReport.operatorInputsReady,
  emptyOperatorInputsReady: emptyReport.operatorInputsReady,
  currentBlockers: readyReport.currentGate.blockers,
  currentPlatformBlockers: readyReport.currentGate.platformBlockers,
  externalBetaAllowed: readyReport.currentGate.externalBetaToolExecutionAllowed,
  productionAllowed: readyReport.currentGate.productionToolExecutionAllowed,
  allowedForwardProgressScopes: readyReport.currentGate.allowedForwardProgressScopes,
  tokenInSummary: JSON.stringify(readyReport).includes('bearer-token-secret-for-smoke'),
}, null, 2))
