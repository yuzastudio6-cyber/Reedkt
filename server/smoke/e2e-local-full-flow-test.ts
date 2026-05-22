import { loadRuntimeEnv } from '../config/env'
import { runLocalFullEditingFlow } from '../services/e2e-editing-flow-service'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'smoke-e2e-local-full-flow',
  auth: { userId: 'local-full-flow-smoke', isMockUser: true },
}

const result = await runLocalFullEditingFlow(context, {
  workspaceId: 'workspace-e2e-local-full-smoke',
  projectName: 'RP-E2E local full flow smoke',
})

const workerResult = result.workerResult as { gateChecks?: Array<{ gate?: string }> } | undefined
const gateNames = workerResult?.gateChecks?.map((gate) => gate.gate).filter((gate): gate is string => Boolean(gate)) ?? []
const serialized = JSON.stringify(result)
const checks = [
  result.ok && result.status === 'preview_ready' ? 'local_full_flow_preview_ready' : undefined,
  result.providerCallsAttempted === false ? 'no_provider_calls_attempted' : undefined,
  result.remotionUsed === false ? 'remotion_not_used' : undefined,
  result.signedUrlStoredAsCanonical === false ? 'no_signed_url_canonical_output' : undefined,
  result.checksumSha256 ? 'checksum_created' : undefined,
  gateNames.includes('approved_snapshot') ? 'approved_snapshot_gate_checked' : undefined,
  gateNames.includes('credit_reservation') ? 'credit_reservation_gate_checked' : undefined,
  gateNames.includes('worker_claim') ? 'worker_claim_gate_checked' : undefined,
  !serialized.toLowerCase().includes('service_role') ? 'no_service_role_leak' : undefined,
].filter(Boolean)

const ok = checks.length === 9
console.log(JSON.stringify({ ok, checks, result }, null, 2))
if (!ok) process.exitCode = 1
