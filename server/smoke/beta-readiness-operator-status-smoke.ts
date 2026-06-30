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
assert.equal(readyReport.sourceTruth.localAcceptedEvidence.locallyAcceptedToolCount, 16, 'operator status should expose the current 16-tool local accepted bundle')
assert.equal(readyReport.sourceTruth.localAcceptedEvidence.readyToRecordDeployedEvidence, true, 'current local accepted bundle should be ready for deployed evidence recording')
assert.equal(readyReport.sourceTruth.localAcceptedEvidence.productReadyLocalOssCount, 0, 'bounded accepted evidence must not claim product-ready local OSS')
assert.ok(readyReport.sourceTruth.localAcceptedEvidence.locallyAcceptedToolIds.includes('opencolorio'), 'operator status should include Track B color/image accepted evidence')
assert.ok(readyReport.sourceTruth.localAcceptedEvidence.locallyAcceptedToolIds.includes('openimageio'), 'operator status should include Track B image pipeline accepted evidence')
assert.equal(readyReport.currentGate.totalTools, 49, 'operator report should include current total tool count')
assert.equal(readyReport.currentGate.externalBetaToolExecutionAllowed, false, 'operator status must not claim external beta is enabled')
assert.equal(readyReport.currentGate.productionToolExecutionAllowed, false, 'operator status must not claim production is enabled')
assert.equal(readyReport.currentGate.safeBlockerReductionAllowed, true, 'operator status should allow safe blocker-reduction lanes')
assert.equal(
  readyReport.currentGate.blockerForwardProgressPolicy.intentionalBlanketBlocksAllowed,
  false,
  'operator status should not allow intentional blanket blockers',
)
assert.equal(
  readyReport.currentGate.blockerForwardProgressPolicy.safeForwardProgressRequired,
  true,
  'operator status should require safe forward progress lanes',
)
assert.equal(
  readyReport.currentGate.blockerForwardProgressPolicy.nextSafeActionRequiredForBlockers,
  true,
  'operator status should require next safe actions for blockers',
)
assert.deepEqual(readyReport.currentGate.blockedActionScope, ['external_beta_tool_execution', 'paid_production_tool_execution'], 'operator status should block only beta/production execution actions')
assert.ok(readyReport.currentGate.allowedForwardProgressScopes.includes('owner_approval_packet_collection'), 'operator status should preserve owner approval collection as allowed forward progress')
assert.ok(readyReport.currentGate.allowedForwardProgressScopes.includes('bounded_command_import_container_proof'), 'operator status should preserve bounded proof lanes as allowed forward progress')
assert.ok(readyReport.currentGate.allowedForwardProgressScopes.includes('safe_blocker_reduction_preview'), 'operator status should expose local preview as allowed forward progress')
assert.equal(readyReport.manifest.blockersAreEvidenceGaps, true, 'operator status should preserve evidence-driven blocker policy')
assert.equal(readyReport.toolEvidence.previewCommand, 'npm run beta:tools:core-real-check-preview', 'operator status should name the local preview command')
assert.equal(readyReport.toolEvidence.hydratedPreviewCommand, 'npm run beta:tools:core-real-check-preview:hydrated', 'operator status should name the hydrated preview command')
assert.equal(readyReport.toolEvidence.hydrationSetupCommand, 'npm run tools:readiness:install-core-python', 'operator status should name the hydration setup command')
assert.equal(readyReport.toolEvidence.localAcceptedEvidenceBundleCommand, 'npm run beta:tools:local-accepted-evidence-bundle', 'operator status should name the local accepted evidence bundle command')
assert.equal(readyReport.toolEvidence.localAcceptedEvidenceCollectorCommand, 'npm run beta:tools:local-accepted-evidence-collector', 'operator status should name the local accepted evidence collector command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:tools:core-real-check-evidence')), 'ready report should name tool evidence command')
assert.ok(readyReport.nextActions.some((action) => action.includes('current 16-tool bounded bundle')), 'ready report should prefer the current bounded bundle collector path')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:tools:local-accepted-evidence-collector')), 'ready report should name the local accepted evidence collector command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:platform:staging-evidence-probe')), 'ready report should name platform evidence command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:launch-approval-evidence')), 'ready report should name launch approval evidence command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:external-beta-evidence-collector')), 'ready report should name the all-up external beta evidence collector')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:scope-approval-evidence-preflight')), 'ready report should name later scope approval evidence preflight command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:scope-approval-sequence')), 'ready report should name the all-up scope approval sequence')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:paid-production-evidence-collector')), 'ready report should name the final paid-production evidence collector')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:owner-approval-packet')), 'ready report should name the current owner approval packet CLI')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:owner-approval-env-template')), 'ready report should name the owner approval env template command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:external-beta-operator-autofill-env')), 'ready report should name the safe auto-fill env command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:external-beta-operator-human-input-checklist')), 'ready report should name the human input checklist command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:external-beta-operator-local-env-preflight')), 'ready report should name the local env preflight command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:owner-approval-intake-status')), 'ready report should name the value-free owner approval intake status command')
assert.ok(readyReport.nextActions.some((action) => action.includes('beta:readiness:owner-approval-intake-preflight')), 'ready report should require owner approval intake preflight before deployed evidence manifests')
assert.ok(readyReport.nextActions.some((action) => action.includes('owner-approval-packet-current-gates')), 'ready report should name the current owner approval packet docs')
assert.ok(readyReport.nextActions.some((action) => action.includes('reeditpro-tool-readiness-staging')), 'ready report should name the deployed tool-readiness service')
assert.ok(readyReport.nextActions.some((action) => action.includes('reeditpro-api-staging')), 'ready report should name the deployed normal API service')
assert.ok(readyReport.nextActions.some((action) => action.includes('api-deployment-preflight')), 'ready report should keep API deployment preflight before deployed evidence calls')
assert.equal(readyReport.nextActions.some((action) => action.includes('beta:readiness:owner-command-handoff plus')), false, 'ready report should not present the old owner command handoff as current')
assert.equal(readyReport.nextActions.some((action) => action.includes('exactRuntimeServiceAccount blocked')), false, 'ready report should not preserve stale runtime service account blocker as current')
assert.equal(readyReport.nextActions.some((action) => action.includes('does not exist')), false, 'ready report should not claim current staging API service account is absent')
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
assert.ok(emptyReport.nextActions.some((action) => action.includes('16 bounded accepted-proven Track B tools')), 'empty report should lead with current bounded accepted Track B evidence')
assert.ok(emptyReport.nextActions.some((action) => action.includes('local-accepted-evidence-bundle')), 'empty report should direct operator to the combined local accepted evidence bundle')
assert.ok(emptyReport.nextActions.some((action) => action.includes('local-accepted-evidence-collector')), 'empty report should direct operator to the deployed local accepted evidence collector')
assert.ok(emptyReport.nextActions.some((action) => action.includes('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT=0')), 'empty report should preserve bounded evidence without product-ready claims')
assert.equal(emptyReport.nextActions.some((action) => action.includes('libass-container-proof-preflight')), false, 'empty report should not lead operators back to stale libass filter proof when current bundle is ready')
assert.equal(emptyReport.nextActions.some((action) => action.includes('libass-synthetic-burnin-qa-evidence-preflight')), false, 'empty report should not lead operators back to individual libass recording when current bundle is ready')
assert.ok(emptyReport.nextActions.some((action) => action.includes('staging-evidence-preflight')), 'empty report should direct operator to platform preflight')
assert.ok(emptyReport.nextActions.some((action) => action.includes('launch-approval-evidence-preflight')), 'empty report should direct operator to launch approval preflight')
assert.ok(emptyReport.nextActions.some((action) => action.includes('external-beta-evidence-collector')), 'empty report should direct operator to the external beta evidence collector after preflights')
assert.ok(emptyReport.nextActions.some((action) => action.includes('REEDITPRO_BETA_SCOPE_APPROVAL_MODE=real_user_media_beta')), 'empty report should preserve later scope approval lane guidance')
assert.ok(emptyReport.nextActions.some((action) => action.includes('scope-approval-sequence')), 'empty report should preserve all-up scope approval sequence guidance')
assert.ok(emptyReport.nextActions.some((action) => action.includes('paid-production-evidence-collector')), 'empty report should preserve final paid-production collector guidance')
assert.ok(emptyReport.nextActions.some((action) => action.includes('beta:readiness:owner-approval-packet')), 'empty report should direct operator to the current owner approval packet')
assert.ok(emptyReport.nextActions.some((action) => action.includes('beta:readiness:owner-approval-env-template')), 'empty report should direct operator to the owner approval env template')
assert.ok(emptyReport.nextActions.some((action) => action.includes('beta:readiness:owner-approval-intake-status')), 'empty report should direct operator through owner approval intake status')
assert.ok(emptyReport.nextActions.some((action) => action.includes('beta:readiness:owner-approval-intake-preflight')), 'empty report should direct operator through owner approval intake preflight')
assert.ok(emptyReport.nextActions.some((action) => action.includes('owner-remediation packets as historical audit context')), 'empty report should preserve old IAM packets as historical context only')
assert.ok(emptyReport.nextActions.some((action) => action.includes('api-deployment-preflight')), 'empty report should name API deployment preflight before deployed evidence calls')
assert.equal(emptyReport.nextActions.some((action) => action.includes('deployer cannot self-remediate')), false, 'empty report should not preserve old self-remediation blocker as current next action')
assert.equal(emptyReport.nextActions.some((action) => action.includes('artifactregistry.repositories.get/uploadArtifacts')), false, 'empty report should not name old Artifact Registry blocker as current next action')

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
