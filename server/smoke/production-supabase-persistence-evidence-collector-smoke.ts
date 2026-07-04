import assert from 'node:assert/strict'
import {
  runProductionSupabasePersistenceEvidenceCollectorFromEnv,
  type ProductionSupabasePersistenceEvidenceCollectorEnv,
} from '../cli/production-supabase-persistence-evidence-collector'
import type { ProductionToolExecutionReadinessEvidenceCollectorFetch } from '../cli/production-tool-execution-readiness-evidence-collector'

let dryRunFetchCalled = false
const dryRun = await runProductionSupabasePersistenceEvidenceCollectorFromEnv(supabasePersistenceEnv(), async () => {
  dryRunFetchCalled = true
  throw new Error('fetch must not run in dry-run mode')
})
assert.equal(dryRun.ok, true, 'complete Supabase persistence evidence should pass dry-run mode')
assert.equal(dryRun.mode, 'dry_run', 'collector should default to dry-run mode')
assert.equal(dryRun.readyForSupabasePersistenceEvidence, true, 'Supabase persistence evidence should be locally ready')
assert.equal(dryRun.recordConfirmationRequired, true, 'collector should require explicit record confirmation')
assert.equal(Object.values(dryRun.supabasePersistence.checks).every(Boolean), true, 'all Supabase persistence checks should pass')
assert.equal(dryRunFetchCalled, false, 'dry-run must not call backend fetch')

const blocked = await runProductionSupabasePersistenceEvidenceCollectorFromEnv({
  ...supabasePersistenceEnv(),
  REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT: 'staging',
}, async () => {
  throw new Error('fetch must not run with incomplete Supabase persistence evidence')
})
assert.equal(blocked.ok, false, 'staging Supabase evidence should block production persistence')
assert.equal(blocked.supabasePersistence.ready, false, 'Supabase slice should be blocked')
assert.equal(blocked.supabasePersistence.blockers.includes('productionEnvironment is not verified.'), true)

await assert.rejects(
  () => runProductionSupabasePersistenceEvidenceCollectorFromEnv({
    ...supabasePersistenceEnv(),
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES: 'Supabase review contains service_role_key',
  }, async () => {
    throw new Error('fetch must not run with secret-like Supabase notes')
  }),
  /secret-like|SUPABASE_EVIDENCE_NOTES/,
  'collector should reject secret-like Supabase evidence fields before backend calls',
)

await assert.rejects(
  () => runProductionSupabasePersistenceEvidenceCollectorFromEnv({
    ...supabasePersistenceEnv(),
    REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE: 'true',
  }, async () => {
    throw new Error('fetch must not run when the all-up production packet is incomplete')
  }),
  /all-up production readiness evidence collector did not record/,
  'confirmed recording should fail closed until the all-up production packet is complete',
)

const calls: Array<{ url: string; method: string; headers: Record<string, string>; body?: Record<string, unknown> }> = []
const recorded = await runProductionSupabasePersistenceEvidenceCollectorFromEnv(completeEnv(), fakeFetch(calls))
assert.equal(recorded.ok, true, 'confirmed collector should record through the production readiness route')
assert.equal(recorded.mode, 'recorded', 'collector should report recorded mode after backend route evidence')
assert.equal(recorded.record?.mode, 'recorded', 'underlying production readiness collector should record')
assert.equal(recorded.supabasePersistence.ready, true, 'Supabase persistence slice should remain ready')
assert.equal(calls.length, 2, 'confirmed collector should POST evidence and GET readback')
assert.equal(calls[0]?.method, 'POST')
assert.equal(calls[1]?.method, 'GET')
assert.equal(calls[0]?.headers['idempotency-key'], 'production-supabase-persistence-evidence-smoke')
assert.equal(JSON.stringify(recorded).includes('production-supabase-persistence-bearer-token'), false, 'collector result must not expose bearer token')

console.log(JSON.stringify({
  ok: true,
  dryRunMode: dryRun.mode,
  recordedMode: recorded.mode,
  checks: recorded.supabasePersistence.checks,
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
            id: 'production-supabase-persistence-evidence-packet-smoke',
            workspaceId: body?.workspaceId,
          },
          report: {
            status: 'ready_for_paid_production',
            productionToolExecutionAllowed: true,
            paidProductionAllowed: true,
            blockers: [],
          },
        },
        warnings: ['Production Supabase persistence route smoke response.'],
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
            id: 'production-supabase-persistence-evidence-packet-smoke',
            workspaceId: 'workspace-production-supabase-persistence-smoke',
          },
          packets: [
            {
              id: 'production-supabase-persistence-evidence-packet-smoke',
              workspaceId: 'workspace-production-supabase-persistence-smoke',
            },
          ],
          readinessSummary: {
            workspaceId: 'workspace-production-supabase-persistence-smoke',
            evidencePacketCount: 1,
            latestEvidencePacketId: 'production-supabase-persistence-evidence-packet-smoke',
            latestGateStatus: 'ready_for_paid_production',
            latestProductionToolExecutionAllowed: true,
            latestPaidProductionAllowed: true,
            durableEvidenceStored: true,
            backendPersistenceMode: 'persistent_supabase',
            productionActivationAttempted: false,
          },
        },
        warnings: ['Production Supabase persistence readback smoke response.'],
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

function supabasePersistenceEnv(): ProductionSupabasePersistenceEvidenceCollectorEnv {
  const yes = 'true'
  return {
    REEDITPRO_PRODUCTION_READINESS_SOURCE_ID: 'production-supabase-persistence-evidence-smoke',
    REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA: '3a672fcb5096ed2589f79f7b79616b63140c2034',
    REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID: 'workspace-production-supabase-persistence-smoke',
    REEDITPRO_PRODUCTION_READINESS_PROJECT_ID: 'project-production-supabase-persistence-smoke',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW: yes,
    REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY: 'production-supabase-persistence-reviewer',
    REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT: '2026-07-03T00:00:00.000Z',
    REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT: 'production',
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:supabase',
    REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_MIGRATION_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_SUPABASE_WALLET_SETTLEMENT_STATE_MIGRATION_DEPLOYED: yes,
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
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES: 'Supabase production persistence evidence reviewed for migrations, explicit grants, backend-only packet access, RLS readback, advisors, backups, and storage policies.',
  }
}

function completeEnv(): ProductionSupabasePersistenceEvidenceCollectorEnv {
  const yes = 'true'
  return {
    ...supabasePersistenceEnv(),
    REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE: yes,
    REEDITPRO_PRODUCTION_READINESS_API_BASE_URL: 'https://api.production.reeditpro.example',
    REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN: 'production-supabase-persistence-bearer-token',
    REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY: 'production-supabase-persistence-evidence-smoke',
    REEDITPRO_PRODUCTION_TOOL_COST_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:tool-cost-ledger',
    REEDITPRO_PRODUCTION_TOOL_COST_EVENT_WRITE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_APPEND_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_SUMMARY_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES: 'Tool cost ledger evidence reviewed.',
    REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:wallet',
    REEDITPRO_PRODUCTION_WALLET_RESERVATION_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_RELEASE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_BALANCE_BEFORE_AFTER_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_SERVICE_ROLE_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NO_SILENT_CHARGE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NOTES: 'Wallet settlement evidence reviewed.',
    REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:stripe',
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_BILLING_OWNER_APPROVED: yes,
    REEDITPRO_PRODUCTION_STRIPE_NO_TOOL_COST_SURFACE_CALLS: yes,
    REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED: yes,
    REEDITPRO_PRODUCTION_STRIPE_WEBHOOK_SEPARATED: yes,
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES: 'Stripe boundary evidence reviewed.',
    REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:observability',
    REEDITPRO_PRODUCTION_OBSERVABILITY_DASHBOARDS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERT_ROUTING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_BILLING_QA_MONITORING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES: 'Observability evidence reviewed.',
    REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:operations',
    REEDITPRO_PRODUCTION_OPERATIONS_ROLLBACK_APPROVED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCHES_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCH_BLOCK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMITS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMIT_BLOCK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMITS_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMIT_BLOCK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_SERVICE_ROLE_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_INCIDENT_RUNBOOK_APPROVED: yes,
    REEDITPRO_PRODUCTION_OPERATIONS_NOTES: 'Operations controls evidence reviewed.',
    REEDITPRO_PRODUCTION_TOOLS_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID: 'production-supabase-persistence-evidence-smoke:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA: '3a672fcb5096ed2589f79f7b79616b63140c2034',
    REEDITPRO_PRODUCTION_TOOLS_ALL_ACCEPTED: yes,
    REEDITPRO_PRODUCTION_TOOLS_MODEL_LICENSE_APPROVED: yes,
    REEDITPRO_PRODUCTION_TOOLS_NOTES: 'Production tool and model/license evidence reviewed.',
    REEDITPRO_PRODUCTION_HARD_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:hard-safety',
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
    REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID: 'prod-supabase-persistence-artifact:owner-signoff',
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
