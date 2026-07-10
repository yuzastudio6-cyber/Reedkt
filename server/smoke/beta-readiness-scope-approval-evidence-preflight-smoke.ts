import assert from 'node:assert/strict'
import {
  buildBetaReadinessScopeApprovalEvidencePreflight,
} from '../cli/beta-readiness-scope-approval-evidence-preflight'
import type { BetaReadinessScopeApprovalEvidenceEnv } from '../cli/beta-readiness-scope-approval-evidence'

const baseEnv: BetaReadinessScopeApprovalEvidenceEnv = {
  REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_SCOPE_APPROVAL_BEARER_TOKEN: 'scope-approval-secret-token',
  REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID: 'workspace-scope-approval-smoke',
  REEDITPRO_BETA_SCOPE_APPROVAL_PROJECT_ID: 'project-scope-approval-smoke',
  REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_ID: 'scope-approval-smoke',
  REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  REEDITPRO_BETA_SCOPE_APPROVAL_IDEMPOTENCY_KEY: 'scope-approval-smoke',
  REEDITPRO_BETA_SCOPE_APPROVAL_MODE: 'real_user_media_beta',
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA: 'true',
  REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE: 'Owner approved real-user-media beta only after external beta status passed.',
}

const realUserReport = buildBetaReadinessScopeApprovalEvidencePreflight(baseEnv)
assert.equal(realUserReport.readyToRecordScopeApprovalEvidence, true, 'complete real-user-media beta scope approval inputs should pass preflight')
assert.equal(realUserReport.mode, 'real_user_media_beta', 'preflight should preserve real-user-media beta mode')
assert.equal(realUserReport.prerequisiteGate, 'external_beta', 'real-user-media beta requires external beta first')
assert.equal(realUserReport.secretLikeInputPaths.length, 0, 'complete preflight should not trip secret checks')

const paidReport = buildBetaReadinessScopeApprovalEvidencePreflight({
  ...baseEnv,
  REEDITPRO_BETA_SCOPE_APPROVAL_MODE: 'paid_production',
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA: undefined,
  REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE: undefined,
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION: 'true',
  REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE: 'Owner approved paid production only after real-user-media beta passed.',
})
assert.equal(paidReport.readyToRecordScopeApprovalEvidence, true, 'complete paid-production scope approval inputs should pass preflight')
assert.equal(paidReport.mode, 'paid_production', 'preflight should preserve paid-production mode')
assert.equal(paidReport.prerequisiteGate, 'real_user_media_beta', 'paid production requires real-user-media beta first')

const missingReport = buildBetaReadinessScopeApprovalEvidencePreflight({})
assert.equal(missingReport.readyToRecordScopeApprovalEvidence, false, 'missing scope approval env should fail closed')
assert.ok(missingReport.missingConfiguration.some((item) => item.includes('REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL')), 'missing report should name API base URL')
assert.ok(missingReport.rejectedScope.some((item) => item.includes('MODE')), 'missing report should name invalid mode')

const mixedReport = buildBetaReadinessScopeApprovalEvidencePreflight({
  ...baseEnv,
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION: 'true',
})
assert.equal(mixedReport.readyToRecordScopeApprovalEvidence, false, 'mixed real-user and paid-production approvals should fail closed')
assert.ok(mixedReport.rejectedScope.some((item) => item.includes('Paid production')), 'mixed report should name rejected paid production scope')

const secretReport = buildBetaReadinessScopeApprovalEvidencePreflight({
  ...baseEnv,
  REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE: 'sk-live-secret-value',
})
assert.equal(secretReport.readyToRecordScopeApprovalEvidence, false, 'secret-like evidence should fail closed')
assert.ok(secretReport.secretLikeInputPaths.some((item) => item.includes('realUserMediaBetaEvidence')), 'secret-like evidence path should be reported')
assert.equal(JSON.stringify(realUserReport).includes('scope-approval-secret-token'), false, 'preflight summary must not print bearer token')

console.log(JSON.stringify({
  ok: true,
  realUserModeReady: realUserReport.readyToRecordScopeApprovalEvidence,
  paidModeReady: paidReport.readyToRecordScopeApprovalEvidence,
  missingConfigurationCount: missingReport.missingConfiguration.length,
  rejectedScopeCount: mixedReport.rejectedScope.length,
  secretEvidenceRejected: secretReport.secretLikeInputPaths.length > 0,
  tokenInSummary: JSON.stringify(realUserReport).includes('scope-approval-secret-token'),
}, null, 2))
