import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildProductionToolExecutionReadinessEvidenceBundleFromEnv,
  type ProductionToolExecutionReadinessEvidenceBundleEnv,
} from '../cli/production-tool-execution-readiness-evidence-bundle'

const empty = await buildProductionToolExecutionReadinessEvidenceBundleFromEnv({})
assert.equal(empty.ok, false, 'empty production evidence bundle should remain blocked')
assert.equal(empty.backendCallsAttempted, false, 'bundle must not call backend routes')
assert.equal(empty.sections.some((section) => section.id === 'all_up_preflight' && section.ready === false), true)
assert.equal(empty.summary.productionToolCount >= 52, true, 'bundle summary should include the full production tool registry, including Track A native tools')
assert.equal(empty.summary.productReadyLocalOssCount, 0, 'product-ready local OSS count must remain zero')
assert.equal(empty.summary.reviewedRealBackendAdapterCount >= 16, true, 'bundle summary should expose reviewed real backend adapter coverage')
assert.equal(empty.summary.readyForScopedReviewedToolExecution, true, 'scoped reviewed handler coverage should be ready even when production evidence is missing')
assert.equal(empty.summary.paidProductionEvidenceReady, false, 'empty evidence should not be production-ready')
assert.equal(empty.milestone10Checklist.length, 10, 'bundle should publish the Milestone 10 production checklist')
assert.equal(
  empty.milestone10Checklist.some((item) => item.id === 'supabase_production_persistence' && item.status === 'blocked'),
  true,
  'empty bundle should show Supabase persistence as a real evidence blocker',
)
assert.equal(
  empty.milestone10Checklist.some((item) => item.id === 'scoped_real_backend_handlers' && item.status === 'ready'),
  true,
  'scoped real backend handlers should be ready in the local source while evidence remains blocked',
)
assert.equal(empty.recommendedSequence.length, 10, 'bundle should publish the full operator sequence')

const complete = await buildProductionToolExecutionReadinessEvidenceBundleFromEnv({
  ...completeEnv(),
  REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_PRODUCTION_WALLET_LIFECYCLE_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_PRODUCTION_OWNER_SIGNOFF_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE: 'true',
})
assert.equal(complete.ok, true, 'complete production evidence should pass when scoped reviewed real handler coverage is ready')
assert.equal(complete.mode, 'dry_run', 'bundle should be dry-run only')
assert.equal(complete.readyForAllUpRecord, true, 'bundle should identify all-up record readiness')
assert.equal(complete.backendCallsAttempted, false, 'complete bundle must still not call backend routes')
assert.equal(complete.summary.readySectionCount, complete.sections.length, 'complete fixture should mark every section ready')
assert.equal(complete.summary.blockedSectionCount, 0, 'complete fixture should have no blocked sections')
assert.equal(complete.summary.paidProductionEvidenceReady, true, 'complete fixture should mark paid production evidence ready')
assert.equal(
  complete.milestone10Checklist.every((item) => item.status === 'ready'),
  true,
  'complete fixture should mark every Milestone 10 checklist item ready',
)
assert.deepEqual(
  complete.milestone10Checklist.map((item) => item.id),
  [
    'supabase_production_persistence',
    'tool_cost_ledger_writes',
    'wallet_reserve_spend_release_refund',
    'stripe_boundary_confirmation',
    'observability_alerts',
    'rollback_kill_switches',
    'rate_concurrency_limits',
    'final_owner_signoff',
    'all_up_evidence_record_readback',
    'scoped_real_backend_handlers',
  ],
  'Milestone 10 checklist should preserve the professional production-readiness sequence',
)
assert.equal(
  complete.sections.filter((section) => section.id !== 'real_worker_handlers').every((section) => section.ready),
  true,
  'evidence sections should be ready for a complete fixture',
)
assert.equal(
  complete.sections.some((section) => section.id === 'real_worker_handlers' && section.ready === false),
  false,
  'bundle should not treat dry-run placeholder routes as blockers for scoped reviewed production handlers',
)
assert.equal(
  complete.recommendedSequence.map((item) => item.command).includes('npm run prod:readiness:tool-execution-evidence-collector'),
  true,
  'bundle should include the final all-up evidence collector path',
)
assert.equal(
  complete.recommendedSequence.map((item) => item.command).includes('npm run prod:readiness:real-worker-handler-readiness'),
  true,
  'bundle should include the real worker handler readiness check',
)

await assert.rejects(
  () => buildProductionToolExecutionReadinessEvidenceBundleFromEnv({
    ...completeEnv(),
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES: 'sk-live-example',
  }),
  /secret-like/,
  'bundle should fail closed on secret-like slice evidence before any backend call',
)

const packageJson = readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
const productionGateDoc = readFileSync(new URL('../../docs/production-tool-execution-readiness-gate.md', import.meta.url), 'utf8')
for (const command of complete.recommendedSequence.map((item) => item.command.replace('npm run ', ''))) {
  assert.ok(packageJson.includes(`"${command}"`), `package.json should expose ${command}`)
  assert.ok(productionGateDoc.includes(command), `production gate docs should mention ${command}`)
}

console.log(JSON.stringify({
  ok: true,
  emptyReady: empty.ok,
  completeReady: complete.ok,
  sections: complete.sections.map((section) => ({
    id: section.id,
    ready: section.ready,
    blockers: section.blockers.length,
  })),
  summary: complete.summary,
  milestone10Checklist: complete.milestone10Checklist.map((item) => ({
    id: item.id,
    status: item.status,
    blockers: item.blockerCount,
  })),
  sequence: complete.recommendedSequence.map((item) => item.command),
  backendCallsAttempted: complete.backendCallsAttempted,
}, null, 2))

function completeEnv(): ProductionToolExecutionReadinessEvidenceBundleEnv {
  const yes = 'true'
  return {
    REEDITPRO_PRODUCTION_READINESS_SOURCE_ID: 'production-readiness-evidence-bundle-smoke',
    REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA: '39d83522fd14edd0aa0e72d06671e205291b7b3b',
    REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID: 'workspace-production-readiness-bundle-smoke',
    REEDITPRO_PRODUCTION_READINESS_PROJECT_ID: 'project-production-readiness-bundle-smoke',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW: yes,
    REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY: 'production-bundle-smoke-reviewer',
    REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT: '2026-07-03T00:00:00.000Z',
    REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT: 'production',
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:supabase',
    REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_SERVICE_ROLE_WRITE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_RLS_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_DATA_API_GRANTS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_BACKEND_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_BACKEND_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_BACKUP_PITR_APPROVED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_SECURITY_ADVISOR_REVIEWED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_PERFORMANCE_ADVISOR_REVIEWED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_STORAGE_POLICIES_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES: 'Supabase production persistence evidence reviewed.',
    REEDITPRO_PRODUCTION_TOOL_COST_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:tool-cost-ledger',
    REEDITPRO_PRODUCTION_TOOL_COST_EVENT_WRITE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_APPEND_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_SUMMARY_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES: 'Tool cost ledger write and readback evidence reviewed.',
    REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:wallet',
    REEDITPRO_PRODUCTION_WALLET_RESERVATION_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_RELEASE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_SERVICE_ROLE_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NO_SILENT_CHARGE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NOTES: 'Wallet reserve spend release refund evidence reviewed.',
    REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:stripe',
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_BILLING_OWNER_APPROVED: yes,
    REEDITPRO_PRODUCTION_STRIPE_NO_TOOL_COST_SURFACE_CALLS: yes,
    REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED: yes,
    REEDITPRO_PRODUCTION_STRIPE_WEBHOOK_SEPARATED: yes,
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES: 'Stripe boundary owner approval reviewed.',
    REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:observability',
    REEDITPRO_PRODUCTION_OBSERVABILITY_DASHBOARDS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERT_ROUTING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_BILLING_QA_MONITORING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES: 'Observability dashboard and alert evidence reviewed.',
    REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:operations',
    REEDITPRO_PRODUCTION_OPERATIONS_ROLLBACK_APPROVED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCHES_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMITS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMITS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_INCIDENT_RUNBOOK_APPROVED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_NOTES: 'Operations controls evidence reviewed.',
    REEDITPRO_PRODUCTION_TOOLS_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID: 'production-readiness-evidence-bundle-smoke:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA: '39d83522fd14edd0aa0e72d06671e205291b7b3b',
    REEDITPRO_PRODUCTION_TOOLS_ALL_ACCEPTED: yes,
    REEDITPRO_PRODUCTION_TOOLS_MODEL_LICENSE_APPROVED: yes,
    REEDITPRO_PRODUCTION_TOOLS_NOTES: 'All production tools and model license evidence reviewed.',
    REEDITPRO_PRODUCTION_HARD_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:hard-safety',
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
    REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID: 'prod-bundle-artifact:owner-signoff',
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
