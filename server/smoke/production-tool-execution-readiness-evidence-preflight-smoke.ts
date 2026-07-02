import assert from 'node:assert/strict'
import {
  buildProductionToolExecutionReadinessEvidencePreflight,
  type ProductionToolExecutionReadinessEvidencePreflightEnv,
} from '../cli/production-tool-execution-readiness-evidence-preflight'

const passing = buildProductionToolExecutionReadinessEvidencePreflight(completeEnv())
assert.equal(passing.ok, true, 'complete production evidence preflight should pass')
assert.equal(passing.readyToEvaluateGate, true, 'complete production evidence should be ready for gate evaluation')
assert.equal(passing.readyForPaidProduction, true, 'complete production evidence should pass paid-production gate')
assert.equal(passing.gateStatus, 'ready_for_paid_production', 'complete production evidence should return ready status')
assert.equal(passing.secretLikeInputPaths.length, 0, 'complete fixture should not contain secret-like values')
assert.equal(passing.missingConfiguration.length, 0, 'complete fixture should not miss configuration')
assert.equal(passing.missingEvidence.length, 0, 'complete fixture should not miss evidence')
assert.ok(
  passing.requiredEnvironmentVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED'),
  'preflight should document wallet refund evidence variable',
)
assert.ok(
  passing.requiredEnvironmentVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_OWNER_PAID_PRODUCTION_APPROVED'),
  'preflight should document paid-production owner approval variable',
)

const missing = buildProductionToolExecutionReadinessEvidencePreflight({})
assert.equal(missing.ok, false, 'missing production evidence should fail preflight')
assert.equal(missing.readyForPaidProduction, false, 'missing evidence should not allow paid production')
assert.ok(
  missing.missingConfiguration.some((item) => item.includes('REEDITPRO_PRODUCTION_READINESS_SOURCE_ID')),
  'missing report should name source id',
)
assert.ok(
  missing.missingEvidence.some((item) => item.includes('tool_cost_events migration')),
  'missing report should name Supabase migration deployment',
)
assert.ok(
  missing.missingEvidence.some((item) => item.includes('wallet refund')),
  'missing report should name wallet refund proof',
)
assert.ok(
  missing.missingEvidence.some((item) => item.includes('paid production approval')),
  'missing report should name paid-production approval',
)

const stagingOnly = buildProductionToolExecutionReadinessEvidencePreflight({
  ...completeEnv(),
  REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT: 'staging',
})
assert.equal(stagingOnly.ok, false, 'staging-only evidence should not pass production preflight')
assert.ok(
  stagingOnly.missingEvidence.some((item) => item.includes('Evidence environment is not production')),
  'staging-only evidence should name production environment gap',
)

const missingConfirmation = buildProductionToolExecutionReadinessEvidencePreflight({
  ...completeEnv(),
  REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW: 'false',
})
assert.equal(missingConfirmation.readyForPaidProduction, true, 'gate evidence can be complete while confirmation is missing')
assert.equal(missingConfirmation.ok, false, 'missing explicit review confirmation should fail preflight ok')
assert.ok(
  missingConfirmation.missingConfiguration.some((item) => item.includes('CONFIRM_EVIDENCE_REVIEW')),
  'missing confirmation should be named',
)

const secretLike = buildProductionToolExecutionReadinessEvidencePreflight({
  ...completeEnv(),
  REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES: 'operator accidentally pasted service_role_key',
})
assert.equal(secretLike.ok, false, 'secret-like notes should fail preflight')
assert.ok(secretLike.secretLikeInputPaths.length > 0, 'secret-like note path should be reported')
assert.equal(secretLike.readyForPaidProduction, false, 'secret-like notes should not evaluate as production-ready')

console.log(JSON.stringify({
  ok: true,
  passingReady: passing.readyForPaidProduction,
  requiredVariables: passing.requiredEnvironmentVariables.length,
  missingBlockers: missing.missingEvidence.length,
  stagingBlockers: stagingOnly.missingEvidence.length,
  secretLikePaths: secretLike.secretLikeInputPaths.length,
}, null, 2))

function completeEnv(): ProductionToolExecutionReadinessEvidencePreflightEnv {
  const yes = 'true'
  return {
    REEDITPRO_PRODUCTION_READINESS_SOURCE_ID: 'production-readiness-evidence-preflight-smoke',
    REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA: 'fe57a1c3c937663e152ddc64c012df3f051365a8',
    REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID: 'workspace-production-readiness-preflight-smoke',
    REEDITPRO_PRODUCTION_READINESS_PROJECT_ID: 'project-production-readiness-preflight-smoke',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW: yes,
    REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT: 'production',
    REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_SERVICE_ROLE_WRITE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_RLS_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_BACKUP_PITR_APPROVED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_SECURITY_ADVISOR_REVIEWED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_PERFORMANCE_ADVISOR_REVIEWED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_STORAGE_POLICIES_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES: 'Supabase production persistence evidence reviewed.',
    REEDITPRO_PRODUCTION_TOOL_COST_EVENT_WRITE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_APPEND_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_SUMMARY_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES: 'Tool cost ledger write and readback evidence reviewed.',
    REEDITPRO_PRODUCTION_WALLET_RESERVATION_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_RELEASE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NO_SILENT_CHARGE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NOTES: 'Wallet reserve spend release refund evidence reviewed.',
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_BILLING_OWNER_APPROVED: yes,
    REEDITPRO_PRODUCTION_STRIPE_NO_TOOL_COST_SURFACE_CALLS: yes,
    REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED: yes,
    REEDITPRO_PRODUCTION_STRIPE_WEBHOOK_SEPARATED: yes,
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES: 'Stripe boundary owner approval reviewed.',
    REEDITPRO_PRODUCTION_OBSERVABILITY_DASHBOARDS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERT_ROUTING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_BILLING_QA_MONITORING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES: 'Observability dashboard and alert evidence reviewed.',
    REEDITPRO_PRODUCTION_OPERATIONS_ROLLBACK_APPROVED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCHES_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMITS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMITS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_INCIDENT_RUNBOOK_APPROVED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_NOTES: 'Operations controls evidence reviewed.',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID: 'production-readiness-evidence-preflight-smoke:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA: 'fe57a1c3c937663e152ddc64c012df3f051365a8',
    REEDITPRO_PRODUCTION_TOOLS_ALL_ACCEPTED: yes,
    REEDITPRO_PRODUCTION_TOOLS_MODEL_LICENSE_APPROVED: yes,
    REEDITPRO_PRODUCTION_TOOLS_NOTES: 'All production tools and model license evidence reviewed.',
    REEDITPRO_PRODUCTION_HARD_APPROVED_SNAPSHOT_REQUIRED: yes,
    REEDITPRO_PRODUCTION_HARD_CREDIT_ESTIMATE_RESERVATION_REQUIRED: yes,
    REEDITPRO_PRODUCTION_HARD_IDEMPOTENCY_REQUIRED: yes,
    REEDITPRO_PRODUCTION_HARD_RAW_PROMPTS_REJECTED: yes,
    REEDITPRO_PRODUCTION_HARD_SECRETS_REJECTED: yes,
    REEDITPRO_PRODUCTION_HARD_TEMP_ACCESS_LINKS_REJECTED: yes,
    REEDITPRO_PRODUCTION_HARD_FRONTEND_HEAVY_EXECUTION_BLOCKED: yes,
    REEDITPRO_PRODUCTION_HARD_LICENSE_MODEL_REVIEW_REQUIRED: yes,
    REEDITPRO_PRODUCTION_HARD_SILENT_BILLING_BLOCKED: yes,
    REEDITPRO_PRODUCTION_HARD_NOTES: 'Hard safety invariant evidence reviewed.',
    REEDITPRO_PRODUCTION_OWNER_DEPLOYMENT_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_SECURITY_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_STORAGE_PRIVACY_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_LEGAL_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_SUPPORT_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_BILLING_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_OPERATIONS_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_REAL_USER_MEDIA_BETA_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_PRIVATE_MEDIA_APPROVAL: yes,
    REEDITPRO_PRODUCTION_OWNER_ARTIFACT_PRIVACY_READY: yes,
    REEDITPRO_PRODUCTION_OWNER_PAID_PRODUCTION_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_FINAL_DELIVERY_SHARE_APPROVED: yes,
    REEDITPRO_PRODUCTION_OWNER_NOTES: 'Final owner signoff evidence reviewed.',
  }
}
