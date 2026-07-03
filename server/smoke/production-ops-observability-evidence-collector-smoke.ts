import assert from 'node:assert/strict'
import {
  runProductionOpsObservabilityEvidenceCollectorFromEnv,
  type ProductionOpsObservabilityEvidenceCollectorEnv,
} from '../cli/production-ops-observability-evidence-collector'
import type { ProductionToolExecutionReadinessEvidenceCollectorFetch } from '../cli/production-tool-execution-readiness-evidence-collector'

let dryRunFetchCalled = false
const dryRun = await runProductionOpsObservabilityEvidenceCollectorFromEnv(opsObservabilityEnv(), async () => {
  dryRunFetchCalled = true
  throw new Error('fetch must not run in dry-run mode')
})
assert.equal(dryRun.ok, true, 'complete ops/observability evidence should pass dry-run mode')
assert.equal(dryRun.mode, 'dry_run', 'collector should default to dry-run mode')
assert.equal(dryRun.readyForOpsObservabilityEvidence, true, 'ops/observability evidence should be locally ready')
assert.equal(dryRun.recordConfirmationRequired, true, 'collector should require explicit record confirmation')
assert.equal(dryRun.catalogCoverage.metricCount > 0, true, 'metrics catalog should be covered')
assert.equal(dryRun.catalogCoverage.alertRuleCount > 0, true, 'alert catalog should be covered')
assert.equal(dryRun.catalogCoverage.billingAlertRuleCount > 0, true, 'billing alert catalog should be covered')
assert.equal(dryRun.catalogCoverage.costControlBlockers.length, 0, 'static cost controls should have no policy blockers')
assert.equal(dryRunFetchCalled, false, 'dry-run must not call backend fetch')

const blocked = await runProductionOpsObservabilityEvidenceCollectorFromEnv({
  ...opsObservabilityEnv(),
  REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES: '',
}, async () => {
  throw new Error('fetch must not run with incomplete ops/observability evidence')
})
assert.equal(blocked.ok, false, 'missing observability notes should block')
assert.equal(blocked.evidence.observability.ready, false, 'observability slice should be blocked')
assert.equal(blocked.evidence.observability.blockers.includes('evidence notes are missing.'), true)

await assert.rejects(
  () => runProductionOpsObservabilityEvidenceCollectorFromEnv({
    ...opsObservabilityEnv(),
    REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY: 'sk-ops-observability-secret',
  }, async () => {
    throw new Error('fetch must not run with secret-like idempotency key')
  }),
  /secret-like|IDEMPOTENCY/,
  'collector should reject secret-like route configuration before backend calls',
)

await assert.rejects(
  () => runProductionOpsObservabilityEvidenceCollectorFromEnv({
    ...opsObservabilityEnv(),
    REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE: 'true',
  }, async () => {
    throw new Error('fetch must not run when the all-up production packet is incomplete')
  }),
  /all-up production readiness evidence collector did not record/,
  'confirmed recording should fail closed until the all-up production packet is complete',
)

const calls: Array<{ url: string; method: string; headers: Record<string, string>; body?: Record<string, unknown> }> = []
const recorded = await runProductionOpsObservabilityEvidenceCollectorFromEnv(completeEnv(), fakeFetch(calls))
assert.equal(recorded.ok, true, 'confirmed collector should record through the production readiness route')
assert.equal(recorded.mode, 'recorded', 'collector should report recorded mode after backend route evidence')
assert.equal(recorded.record?.mode, 'recorded', 'underlying production readiness collector should record')
assert.equal(recorded.evidence.observability.ready, true, 'observability slice should remain ready')
assert.equal(recorded.evidence.operationsControls.ready, true, 'operations controls slice should remain ready')
assert.equal(calls.length, 2, 'confirmed collector should POST evidence and GET readback')
assert.equal(calls[0]?.method, 'POST')
assert.equal(calls[1]?.method, 'GET')
assert.equal(calls[0]?.headers['idempotency-key'], 'production-ops-observability-evidence-smoke')
assert.equal(JSON.stringify(recorded).includes('production-ops-observability-bearer-token'), false, 'collector result must not expose bearer token')

console.log(JSON.stringify({
  ok: true,
  dryRunMode: dryRun.mode,
  recordedMode: recorded.mode,
  catalogCoverage: recorded.catalogCoverage,
  calls: calls.map((call) => ({
    method: call.method,
    url: call.url,
    idempotencyKey: call.headers['idempotency-key'],
  })),
}, null, 2))

function fakeFetch(
  calls: Array<{ url: string; method: string; headers: Record<string, string>; body?: Record<string, unknown> }>,
): ProductionToolExecutionReadinessEvidenceCollectorFetch {
  return async (url, init) => {
    const body = init.body ? JSON.parse(init.body) as Record<string, unknown> : undefined
    calls.push({ url, method: init.method, headers: init.headers, body })
    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/production-tool-execution-readiness/evidence')) {
      return jsonResponse(201, {
        ok: true,
        data: {
          replayed: false,
          packet: {
            id: 'production-ops-observability-evidence-packet-smoke',
            workspaceId: body?.workspaceId,
          },
          report: {
            status: 'ready_for_paid_production',
            productionToolExecutionAllowed: true,
            paidProductionAllowed: true,
            blockers: [],
          },
        },
        warnings: ['Production ops/observability route smoke response.'],
      })
    }

    if (init.method === 'GET' && url.includes('/v1/beta-readiness/production-tool-execution-readiness/evidence')) {
      return jsonResponse(200, {
        ok: true,
        data: {
          evidencePacketCount: 1,
          latestReport: {
            status: 'ready_for_paid_production',
            productionToolExecutionAllowed: true,
            paidProductionAllowed: true,
          },
          latestPacket: {
            id: 'production-ops-observability-evidence-packet-smoke',
            workspaceId: 'workspace-production-ops-observability-smoke',
          },
          packets: [
            {
              id: 'production-ops-observability-evidence-packet-smoke',
              workspaceId: 'workspace-production-ops-observability-smoke',
            },
          ],
          readinessSummary: {
            workspaceId: 'workspace-production-ops-observability-smoke',
            evidencePacketCount: 1,
            latestEvidencePacketId: 'production-ops-observability-evidence-packet-smoke',
            latestGateStatus: 'ready_for_paid_production',
            latestProductionToolExecutionAllowed: true,
            latestPaidProductionAllowed: true,
            durableEvidenceStored: true,
            backendPersistenceMode: 'persistent_supabase',
            productionActivationAttempted: false,
          },
        },
        warnings: ['Production ops/observability readback smoke response.'],
      })
    }

    throw new Error(`unexpected fetch ${init.method} ${url}`)
  }
}

function jsonResponse(status: number, payload: unknown): Promise<{ status: number; json(): Promise<unknown> }> {
  return Promise.resolve({
    status,
    async json() {
      return payload
    },
  })
}

function opsObservabilityEnv(): ProductionOpsObservabilityEvidenceCollectorEnv {
  const yes = 'true'
  return {
    REEDITPRO_PRODUCTION_READINESS_SOURCE_ID: 'production-ops-observability-evidence-smoke',
    REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA: 'a9864ff984c0fe3790c95dec78e349e553809ec9',
    REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID: 'workspace-production-ops-observability-smoke',
    REEDITPRO_PRODUCTION_READINESS_PROJECT_ID: 'project-production-ops-observability-smoke',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW: yes,
    REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY: 'production-ops-observability-reviewer',
    REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT: '2026-07-03T00:00:00.000Z',
    REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:observability',
    REEDITPRO_PRODUCTION_OBSERVABILITY_DASHBOARDS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERT_ROUTING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_BILLING_QA_MONITORING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES: 'Production monitoring dashboards, alerts, routing, and billing QA monitoring evidence reviewed.',
    REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:operations',
    REEDITPRO_PRODUCTION_OPERATIONS_ROLLBACK_APPROVED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCHES_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMITS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMITS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_SERVICE_ROLE_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_INCIDENT_RUNBOOK_APPROVED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_NOTES: 'Production rollback, kill switch, rate limit, concurrency, atomic ops-admission RPC, and incident runbook evidence reviewed.',
  }
}

function completeEnv(): ProductionOpsObservabilityEvidenceCollectorEnv {
  const yes = 'true'
  return {
    ...opsObservabilityEnv(),
    REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE: yes,
    REEDITPRO_PRODUCTION_READINESS_API_BASE_URL: 'https://api.production.reeditpro.example',
    REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN: 'production-ops-observability-bearer-token',
    REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY: 'production-ops-observability-evidence-smoke',
    REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT: 'production',
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:supabase',
    REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_SERVICE_ROLE_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_READBACK_VERIFIED: yes,
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
    REEDITPRO_PRODUCTION_TOOL_COST_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:tool-cost-ledger',
    REEDITPRO_PRODUCTION_TOOL_COST_EVENT_WRITE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_APPEND_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_SUMMARY_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES: 'Tool cost ledger evidence reviewed.',
    REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:wallet',
    REEDITPRO_PRODUCTION_WALLET_RESERVATION_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_RELEASE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_SERVICE_ROLE_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NO_SILENT_CHARGE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NOTES: 'Wallet settlement evidence reviewed.',
    REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:stripe',
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_BILLING_OWNER_APPROVED: yes,
    REEDITPRO_PRODUCTION_STRIPE_NO_TOOL_COST_SURFACE_CALLS: yes,
    REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED: yes,
    REEDITPRO_PRODUCTION_STRIPE_WEBHOOK_SEPARATED: yes,
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES: 'Stripe boundary evidence reviewed.',
    REEDITPRO_PRODUCTION_TOOLS_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID: 'production-ops-observability-evidence-smoke:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA: 'a9864ff984c0fe3790c95dec78e349e553809ec9',
    REEDITPRO_PRODUCTION_TOOLS_ALL_ACCEPTED: yes,
    REEDITPRO_PRODUCTION_TOOLS_MODEL_LICENSE_APPROVED: yes,
    REEDITPRO_PRODUCTION_TOOLS_NOTES: 'Production tool and model/license evidence reviewed.',
    REEDITPRO_PRODUCTION_HARD_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:hard-safety',
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
    REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID: 'prod-ops-observability-artifact:owner-signoff',
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
