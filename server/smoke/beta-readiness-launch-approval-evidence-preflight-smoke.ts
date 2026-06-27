import assert from 'node:assert/strict'
import { buildBetaReadinessLaunchApprovalEvidencePreflight } from '../cli/beta-readiness-launch-approval-evidence-preflight'
import type { BetaReadinessLaunchApprovalEvidenceEnv } from '../cli/beta-readiness-launch-approval-evidence'

const completeEnv: BetaReadinessLaunchApprovalEvidenceEnv = {
  REEDITPRO_BETA_LAUNCH_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_LAUNCH_BEARER_TOKEN: 'launch-approval-secret-token',
  REEDITPRO_BETA_LAUNCH_WORKSPACE_ID: 'workspace-launch-approval-smoke',
  REEDITPRO_BETA_LAUNCH_PROJECT_ID: 'project-launch-approval-smoke',
  REEDITPRO_BETA_LAUNCH_SOURCE_ID: 'beta-launch-approval-preflight-smoke',
  REEDITPRO_BETA_LAUNCH_SOURCE_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY: 'launch-approval-preflight-smoke',
  REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE: 'Model and license owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE: 'Deployment owner approved staging deployment evidence.',
  REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE: 'Security owner approved external beta readiness.',
  REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE: 'Storage/privacy owner approved external beta storage scope.',
  REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE: 'Legal owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE: 'Monitoring owner approved alerting coverage.',
  REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE: 'Support owner approved incident response coverage.',
}

const readyReport = buildBetaReadinessLaunchApprovalEvidencePreflight(completeEnv)
assert.equal(readyReport.readyToRecordLaunchApprovalEvidence, true, 'complete launch approval inputs should be ready')
assert.equal(readyReport.plannedEndpoint, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence', 'preflight should name evidence endpoint')
assert.equal(readyReport.secretLikeInputPaths.length, 0, 'complete launch approval inputs should not trip secret checks')
assert.equal(JSON.stringify(readyReport).includes('launch-approval-secret-token'), false, 'preflight report must not include bearer token')

const missingReport = buildBetaReadinessLaunchApprovalEvidencePreflight({
  REEDITPRO_BETA_LAUNCH_API_BASE_URL: 'https://api.staging.reeditpro.example',
})
assert.equal(missingReport.readyToRecordLaunchApprovalEvidence, false, 'missing launch approval inputs should fail closed')
assert.ok(missingReport.missingConfiguration.some((item) => item.includes('BEARER_TOKEN')), 'missing report should name bearer token configuration')
assert.ok(missingReport.missingOwnerApprovals.some((item) => item.includes('deployment')), 'missing report should name deployment approval gap')
assert.ok(missingReport.missingEvidenceNotes.some((item) => item.includes('model/license evidence')), 'missing report should name model/license evidence gap')
assert.ok(missingReport.confirmationGaps.some((item) => item.includes('CONFIRM_EXTERNAL_BETA_APPROVAL')), 'missing report should name confirmation gap')

const rejectedScopeReport = buildBetaReadinessLaunchApprovalEvidencePreflight({
  ...completeEnv,
  REEDITPRO_BETA_LAUNCH_APPROVE_REAL_USER_MEDIA_BETA: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION: 'true',
})
assert.equal(rejectedScopeReport.readyToRecordLaunchApprovalEvidence, false, 'real-user-media/production approvals should be rejected in this lane')
assert.equal(rejectedScopeReport.rejectedScope.length, 2, 'preflight should name both rejected wider scopes')

const secretReport = buildBetaReadinessLaunchApprovalEvidencePreflight({
  ...completeEnv,
  REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE: 'sk-secret-launch-approval',
})
assert.equal(secretReport.readyToRecordLaunchApprovalEvidence, false, 'secret-like evidence should fail closed')
assert.ok(secretReport.secretLikeInputPaths.some((path) => path.includes('legalEvidence')), 'secret-like evidence path should be reported')

console.log(JSON.stringify({
  ok: true,
  readyToRecordLaunchApprovalEvidence: readyReport.readyToRecordLaunchApprovalEvidence,
  missingConfigurationCount: missingReport.missingConfiguration.length,
  missingOwnerApprovalCount: missingReport.missingOwnerApprovals.length,
  missingEvidenceNoteCount: missingReport.missingEvidenceNotes.length,
  rejectedScopeCount: rejectedScopeReport.rejectedScope.length,
  secretEvidenceRejected: secretReport.secretLikeInputPaths.length > 0,
  tokenInSummary: JSON.stringify(readyReport).includes('launch-approval-secret-token'),
}, null, 2))
