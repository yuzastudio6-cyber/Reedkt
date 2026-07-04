import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  runProductionToolExecutionReadinessEvidenceCollectorFromEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorFetch,
} from '../cli/production-tool-execution-readiness-evidence-collector'

const tempRoot = mkdtempSync(join(tmpdir(), 'reeditpro-production-evidence-collector-'))

const dryRunEnv = completeEnv()
let dryRunFetchCalled = false
const dryRun = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv(dryRunEnv, async () => {
  dryRunFetchCalled = true
  throw new Error('fetch must not run in dry-run mode')
})
assert.equal(dryRun.ok, true, 'complete evidence should pass dry-run collector mode')
assert.equal(dryRun.mode, 'dry_run', 'collector should default to dry-run mode')
assert.equal(dryRun.readyForRecord, true, 'complete dry-run evidence should be ready for backend record')
assert.equal(dryRun.recordConfirmationRequired, true, 'dry-run should require explicit record confirmation')
assert.equal(dryRunFetchCalled, false, 'dry-run mode must not call fetch')

const evidenceFile = writeEvidenceFile('collector-complete-evidence.json', completeEnv())
let fileDryRunFetchCalled = false
const fileDryRun = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv({
  REEDITPRO_PRODUCTION_READINESS_EVIDENCE_FILE: evidenceFile,
}, async () => {
  fileDryRunFetchCalled = true
  throw new Error('fetch must not run in evidence-file dry-run mode')
})
assert.equal(fileDryRun.ok, true, 'collector dry-run should accept a complete non-secret evidence file')
assert.equal(fileDryRun.mode, 'dry_run', 'evidence-file collector should remain dry-run without record confirmation')
assert.equal(fileDryRun.preflight.evidenceFile.loaded, true, 'collector preflight should report loaded evidence file')
assert.equal(fileDryRunFetchCalled, false, 'evidence-file dry-run mode must not call fetch')

let blockedFetchCalled = false
const blocked = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv({}, async () => {
  blockedFetchCalled = true
  throw new Error('fetch must not run when preflight is blocked')
})
assert.equal(blocked.ok, false, 'missing evidence should fail collector preflight')
assert.equal(blocked.readyForRecord, false, 'missing evidence should not be ready for backend record')
assert.equal(blocked.readyForBlockedAuditRecord, false, 'missing identity/configuration should not be ready for blocked audit recording')
assert.equal(blockedFetchCalled, false, 'blocked preflight must not call fetch')

const blockedAuditCalls: Array<{ url: string; method: string; headers: Record<string, string>; body?: Record<string, unknown> }> = []
const blockedAuditRecord = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv(
  blockedAuditEnv(),
  fakeFetch(blockedAuditCalls, false),
)
assert.equal(blockedAuditRecord.ok, true, 'collector should record blocked audit packets when explicitly confirmed')
assert.equal(blockedAuditRecord.mode, 'blocked_recorded', 'blocked audit packet recording should have its own mode')
assert.equal(blockedAuditRecord.readyForRecord, false, 'blocked audit packet must not be treated as paid-production-ready')
assert.equal(blockedAuditRecord.readyForBlockedAuditRecord, true, 'blocked audit packet should report audit-readiness')
assert.equal(blockedAuditRecord.record?.status, 201, 'blocked audit packet route should still return a durable record response')
assert.equal(blockedAuditRecord.record?.productionToolExecutionAllowed, false, 'blocked audit packet must preserve production execution denied')
assert.equal(blockedAuditRecord.record?.paidProductionAllowed, false, 'blocked audit packet must preserve paid production denied')
assert.equal(blockedAuditRecord.readback?.latestProductionToolExecutionAllowed, false, 'blocked audit readback must preserve production execution denied')
assert.equal(blockedAuditRecord.readback?.recordedEvidencePacketPresent, true, 'blocked audit readback should prove exact packet presence')
assert.equal(blockedAuditCalls[0]?.url.includes('recordBlockedEvidence=true'), true, 'blocked audit recording should use explicit backend query flag')
assert.equal(blockedAuditCalls[0]?.headers['idempotency-key'], 'production-readiness-blocked-audit-smoke')
assert.equal(JSON.stringify(blockedAuditRecord).includes('production-readiness-blocked-audit-token'), false, 'blocked audit summary must not expose bearer token')

await assert.rejects(
  () => runProductionToolExecutionReadinessEvidenceCollectorFromEnv({
    ...completeEnv(),
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'true',
  }, async () => {
    throw new Error('fetch must not run without collector API configuration')
  }),
  /API_BASE_URL|BEARER_TOKEN|IDEMPOTENCY_KEY/,
  'confirmed recording should require API base URL, bearer token, and idempotency key',
)

await assert.rejects(
  () => runProductionToolExecutionReadinessEvidenceCollectorFromEnv({
    ...confirmedEnv(),
    REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY: 'operator-secret-token',
  }, async () => {
    throw new Error('fetch must not run with secret-like collector configuration')
  }),
  /secret-like|IDEMPOTENCY/,
  'collector should reject secret-like idempotency/configuration before backend calls',
)

const calls: Array<{ url: string; method: string; headers: Record<string, string>; body?: Record<string, unknown> }> = []
const recorded = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv(confirmedEnv(), fakeFetch(calls))
assert.equal(recorded.ok, true, 'collector should pass when record and readback confirm production readiness')
assert.equal(recorded.mode, 'recorded', 'confirmed collector should run in recorded mode')
assert.equal(recorded.record?.status, 201, 'first evidence record should return created status')
assert.equal(recorded.record?.replayed, false, 'first evidence record should not be replayed')
assert.equal(recorded.record?.productionToolExecutionAllowed, true, 'record response should preserve production tool execution readiness')
assert.equal(recorded.readback?.evidencePacketCount, 1, 'readback should include one recorded production readiness evidence packet')
assert.equal(recorded.readback?.latestEvidencePacketId, 'production-readiness-evidence-packet-smoke', 'readback should expose the latest evidence packet id')
assert.equal(recorded.readback?.recordedEvidencePacketPresent, true, 'readback should prove the exact recorded evidence packet is present')
assert.equal(recorded.readback?.recordedEvidencePacketLatest, true, 'single-packet smoke readback should mark the recorded packet as latest')
assert.equal(recorded.readback?.latestPaidProductionAllowed, true, 'readback should preserve paid-production readiness')
assert.equal(calls.length, 2, 'collector should POST once and read back once')
assert.equal(calls[0]?.method, 'POST', 'first call should record evidence')
assert.equal(calls[1]?.method, 'GET', 'second call should read evidence back')
assert.equal(calls[0]?.headers['idempotency-key'], 'production-readiness-evidence-collector-smoke')
assert.equal(calls[0]?.headers.authorization, 'Bearer production-readiness-evidence-collector-token')
assert.equal(calls[1]?.headers.authorization, 'Bearer production-readiness-evidence-collector-token')
assert.equal(calls[0]?.body?.workspaceId, 'workspace-production-readiness-collector-smoke')
assert.equal(JSON.stringify(recorded).includes('production-readiness-evidence-collector-token'), false, 'collector result must not expose bearer token')
assert.equal(JSON.stringify(recorded).includes('service_role_key'), false, 'collector result must not expose secret-like text')

await assert.rejects(
  () => runProductionToolExecutionReadinessEvidenceCollectorFromEnv(confirmedEnv(), fakeFetch([], false)),
  /readback did not confirm|record did not return/,
  'collector should fail closed when backend readback is not production-ready',
)

await assert.rejects(
  () => runProductionToolExecutionReadinessEvidenceCollectorFromEnv(confirmedEnv(), fakeFetch([], true, false, { recordStatus: 500 })),
  /record did not return/,
  'collector should fail closed when the record response body is ready but HTTP status is not successful',
)

await assert.rejects(
  () => runProductionToolExecutionReadinessEvidenceCollectorFromEnv(confirmedEnv(), fakeFetch([], true, false, { readbackStatus: 503 })),
  /readback did not confirm/,
  'collector should fail closed when the readback response body is ready but HTTP status is not successful',
)

await assert.rejects(
  () => runProductionToolExecutionReadinessEvidenceCollectorFromEnv(confirmedEnv(), fakeFetch([], true, true)),
  /latest exact evidence packet id/,
  'collector should fail closed when the recorded evidence packet is present but not the latest readback packet',
)

console.log(JSON.stringify({
  ok: true,
  dryRunMode: dryRun.mode,
  recordMode: recorded.mode,
  recordEndpoint: recorded.record?.endpoint,
  readbackEndpoint: recorded.readback?.endpoint,
  calls: calls.map((call) => ({ method: call.method, url: call.url, idempotencyKey: call.headers['idempotency-key'] })),
  tokenInSummary: JSON.stringify(recorded).includes('production-readiness-evidence-collector-token'),
}, null, 2))

rmSync(tempRoot, { force: true, recursive: true })

function writeEvidenceFile(name: string, env: ProductionToolExecutionReadinessEvidenceCollectorEnv): string {
  const filePath = join(tempRoot, name)
  writeFileSync(filePath, JSON.stringify({
    version: 'production-tool-execution-readiness-evidence-v1',
    environment: env,
  }, null, 2))
  return filePath
}

function fakeFetch(
  calls: Array<{ url: string; method: string; headers: Record<string, string>; body?: Record<string, unknown> }>,
  ready = true,
  staleLatest = false,
  statusOverrides: { recordStatus?: number; readbackStatus?: number } = {},
): ProductionToolExecutionReadinessEvidenceCollectorFetch {
  const latestPacketId = staleLatest
    ? 'production-readiness-evidence-packet-newer-than-recorded'
    : 'production-readiness-evidence-packet-smoke'
  return async (url, init) => {
    const body = init.body ? JSON.parse(init.body) as Record<string, unknown> : undefined
    calls.push({ url, method: init.method, headers: init.headers, body })
    const blockedAudit = url.includes('recordBlockedEvidence=true')
    const acceptedRecord = ready || blockedAudit
    if (init.method === 'POST' && url.includes('/v1/beta-readiness/production-tool-execution-readiness/evidence')) {
      return jsonResponse(statusOverrides.recordStatus ?? (acceptedRecord ? 201 : 400), {
        ok: acceptedRecord,
        data: {
          replayed: false,
          packet: {
            id: 'production-readiness-evidence-packet-smoke',
            workspaceId: body?.workspaceId,
          },
          report: {
            status: ready ? 'ready_for_paid_production' : 'blocked',
            productionToolExecutionAllowed: ready,
            paidProductionAllowed: ready,
            blockers: ready ? [] : ['paid production evidence readback was not ready'],
          },
        },
        warnings: ['Production readiness evidence recording route smoke response.'],
      })
    }

    if (init.method === 'GET' && url.includes('/v1/beta-readiness/production-tool-execution-readiness/evidence')) {
      return jsonResponse(statusOverrides.readbackStatus ?? 200, {
        ok: true,
        data: {
          evidencePacketCount: 1,
          latestReport: {
            status: ready ? 'ready_for_paid_production' : 'blocked',
            productionToolExecutionAllowed: ready,
            paidProductionAllowed: ready,
          },
          latestPacket: {
            id: latestPacketId,
            workspaceId: 'workspace-production-readiness-collector-smoke',
          },
          packets: [
            {
              id: 'production-readiness-evidence-packet-smoke',
              workspaceId: 'workspace-production-readiness-collector-smoke',
            },
            ...(staleLatest
              ? [{
                  id: latestPacketId,
                  workspaceId: 'workspace-production-readiness-collector-smoke',
                }]
              : []),
          ],
          readinessSummary: {
            workspaceId: 'workspace-production-readiness-collector-smoke',
            evidencePacketCount: staleLatest ? 2 : 1,
            latestEvidencePacketId: latestPacketId,
            latestGateStatus: ready ? 'ready_for_paid_production' : 'blocked',
            latestProductionToolExecutionAllowed: ready,
            latestPaidProductionAllowed: ready,
            durableEvidenceStored: true,
            backendPersistenceMode: 'persistent_supabase',
            productionActivationAttempted: false,
          },
        },
        warnings: ['Production readiness evidence readback route smoke response.'],
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

function blockedAuditEnv(): ProductionToolExecutionReadinessEvidenceCollectorEnv {
  return {
    ...completeEnv(),
    REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED: 'false',
    REEDITPRO_PRODUCTION_READINESS_API_BASE_URL: 'https://api.production.reeditpro.example',
    REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN: 'production-readiness-blocked-audit-token',
    REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY: 'production-readiness-blocked-audit-smoke',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_BLOCKED_EVIDENCE: 'true',
  }
}

function confirmedEnv(): ProductionToolExecutionReadinessEvidenceCollectorEnv {
  return {
    ...completeEnv(),
    REEDITPRO_PRODUCTION_READINESS_API_BASE_URL: 'https://api.production.reeditpro.example',
    REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN: 'production-readiness-evidence-collector-token',
    REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY: 'production-readiness-evidence-collector-smoke',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'true',
  }
}

function completeEnv(): ProductionToolExecutionReadinessEvidenceCollectorEnv {
  const yes = 'true'
  return {
    REEDITPRO_PRODUCTION_READINESS_SOURCE_ID: 'production-readiness-evidence-collector-smoke',
    REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA: 'fe57a1c3c937663e152ddc64c012df3f051365a8',
    REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID: 'workspace-production-readiness-collector-smoke',
    REEDITPRO_PRODUCTION_READINESS_PROJECT_ID: 'project-production-readiness-collector-smoke',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW: yes,
    REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY: 'production-collector-smoke-reviewer',
    REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT: '2026-07-03T00:00:00.000Z',
    REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT: 'production',
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:supabase',
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
    REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES: 'Supabase production persistence evidence reviewed.',
    REEDITPRO_PRODUCTION_TOOL_COST_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:tool-cost-ledger',
    REEDITPRO_PRODUCTION_TOOL_COST_EVENT_WRITE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_APPEND_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_SUMMARY_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES: 'Tool cost ledger write and readback evidence reviewed.',
    REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:wallet',
    REEDITPRO_PRODUCTION_WALLET_RESERVATION_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_RELEASE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_BALANCE_BEFORE_AFTER_READBACK_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_SERVICE_ROLE_ONLY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_IDEMPOTENT_REPLAY_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NO_SILENT_CHARGE_VERIFIED: yes,
    REEDITPRO_PRODUCTION_WALLET_NOTES: 'Wallet reserve spend release refund evidence reviewed.',
    REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:stripe',
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_BILLING_OWNER_APPROVED: yes,
    REEDITPRO_PRODUCTION_STRIPE_NO_TOOL_COST_SURFACE_CALLS: yes,
    REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED: yes,
    REEDITPRO_PRODUCTION_STRIPE_WEBHOOK_SEPARATED: yes,
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES: 'Stripe boundary owner approval reviewed.',
    REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:observability',
    REEDITPRO_PRODUCTION_OBSERVABILITY_DASHBOARDS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_ALERT_ROUTING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_BILLING_QA_MONITORING_VERIFIED: yes,
    REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES: 'Observability dashboard and alert evidence reviewed.',
    REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:operations',
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
    REEDITPRO_PRODUCTION_TOOLS_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID: 'production-readiness-evidence-collector-smoke:tools',
    REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA: 'fe57a1c3c937663e152ddc64c012df3f051365a8',
    REEDITPRO_PRODUCTION_TOOLS_ALL_ACCEPTED: yes,
    REEDITPRO_PRODUCTION_TOOLS_MODEL_LICENSE_APPROVED: yes,
    REEDITPRO_PRODUCTION_TOOLS_NOTES: 'All production tools and model license evidence reviewed.',
    REEDITPRO_PRODUCTION_HARD_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:hard-safety',
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
    REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID: 'prod-collector-artifact:owner-signoff',
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
