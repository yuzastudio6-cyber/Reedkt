import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ApprovedPlanSnapshotRecord } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import { validateApprovedPlanSnapshotForWorker } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import {
  runMockCreditGateAllowedFlow,
  runMockCreditGateBlockedFlow,
  runMockCreditReservationFlow,
} from '../../src/backend/orchestrators/mock-credit-runtime-orchestrator'
import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

function assertText(path: string, phrases: string[]) {
  const text = read(path)
  for (const phrase of phrases) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${path} should mention ${phrase}`)
  }
}

const requiredFiles = [
  'docs/internal-testing-approval-credit-gates.md',
  'docs/internal-testing-approval-credit-gates.json',
  'server/smoke/internal-testing-approval-credit-gates-smoke.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-approval-credit-gates'],
  'tsx server/smoke/internal-testing-approval-credit-gates-smoke.ts',
)

assertText('src/pages/InternalTestingPage.tsx', [
  'internal-testing-approval-credit-gates',
  'approvedPlanSnapshotId',
  'creditEstimateId',
  'creditReservationId',
  'No provider call',
  'No external beta',
])

assertText('src/lib/internal-testing-scenarios.ts', [
  'approval-credit-gate-readiness',
  'approvedPlanSnapshotId',
  'creditReservationId',
])

assertText('docs/internal-testing-approval-credit-gates.md', [
  'internal_testing_approval_credit_gates_passed_ready_for_repeated_local_internal_testing',
  'approvedPlanSnapshotId',
  'creditEstimateId',
  'creditReservationId',
  'No provider',
  'No Supabase',
  'product-ready',
])

const docJson = JSON.parse(read('docs/internal-testing-approval-credit-gates.json')) as {
  decision?: string
  requiredIds?: string[]
  blockedScope?: Record<string, boolean>
}
assert.equal(docJson.decision, 'internal_testing_approval_credit_gates_passed_ready_for_repeated_local_internal_testing')
assert.deepEqual(docJson.requiredIds, ['approvedPlanSnapshotId', 'creditEstimateId', 'creditReservationId'])
assert.equal(docJson.blockedScope?.creditSpend, false)
assert.equal(docJson.blockedScope?.workerDispatch, false)
assert.equal(docJson.blockedScope?.providerCalls, false)
assert.equal(docJson.blockedScope?.productReady, false)

const allowed = runMockCreditGateAllowedFlow()
assert.equal(allowed.creditGateResult.ok, true, 'Approved edit plan, approved estimate, and reservation should pass mock credit gate.')
assert.equal(allowed.creditGateResult.decision, 'allowed')
assert.ok(allowed.creditGateResult.creditEstimateId, 'Allowed credit gate should carry creditEstimateId.')
assert.ok(allowed.creditGateResult.creditReservationId, 'Allowed credit gate should carry creditReservationId.')
assert.equal(allowed.nextStep, 'queue_generation')

const reservation = runMockCreditReservationFlow()
assert.equal(reservation.creditGateResult.ok, true, 'Reservation flow should create a valid mock reservation.')
assert.ok(reservation.reservation?.id, 'Reservation flow should return a reservation id.')

const blocked = runMockCreditGateBlockedFlow()
assert.equal(blocked.creditGateResult.ok, false, 'Missing reservation should block expensive work.')
assert.equal(blocked.creditGateResult.decision, 'blocked_reservation_missing')
assert.match(blocked.creditGateResult.message, /reservation/i)

const now = new Date().toISOString()
const approvedSnapshot: ApprovedPlanSnapshotRecord = {
  id: 'approved-snapshot-internal-testing-smoke',
  workspaceId: 'workspace-internal-testing-smoke',
  projectId: 'project-internal-testing-smoke',
  chatSessionId: 'chat-session-internal-testing-smoke',
  editPlanId: 'edit-plan-internal-testing-smoke',
  creditEstimateId: 'credit-estimate-internal-testing-smoke',
  creditApprovalId: 'credit-approval-internal-testing-smoke',
  creditReservationId: 'credit-reservation-internal-testing-smoke',
  snapshotStatus: 'approved',
  snapshotVersion: 1,
  snapshotHash: 'sha256:internal-testing-smoke',
  approvedByUserId: 'user-internal-testing-smoke',
  approvedAt: now,
  snapshotPayload: {
    compiledIntent: { summary: 'Mock internal testing approved snapshot.' },
    confirmedSettings: { frame: '9:16', fps: 30 },
    sourceOrder: [{ clipId: 'clip-1', order: 1 }],
    professionalEditingDirective: { tone: 'clean' },
    segmentOperations: [{ segmentId: 'segment-1', operation: 'trim_plan_only' }],
    visualAssetPlan: { assets: [] },
    rendererPlan: { mode: 'mock_preview_blocked' },
    qaPlan: { gates: ['intent_match'] },
    providerRouting: { providersEnabled: false },
    modelTierPolicy: { tier: 'mock' },
    fallbackPolicy: { action: 'request_review' },
    creditEstimate: { id: 'credit-estimate-internal-testing-smoke', credits: 12 },
    approvalRecord: { id: 'approval-internal-testing-smoke', approved: true },
  },
  createdAt: now,
  updatedAt: now,
}

const snapshotResult = validateApprovedPlanSnapshotForWorker(approvedSnapshot, { requiresCreditReservation: true })
assert.equal(snapshotResult.ok, true, `Approved snapshot should validate: ${snapshotResult.errors.join(', ')}`)

const missingReservationResult = validateApprovedPlanSnapshotForWorker(
  { ...approvedSnapshot, id: 'approved-snapshot-missing-reservation', creditReservationId: undefined },
  { requiresCreditReservation: true },
)
assert.equal(missingReservationResult.ok, false, 'Approved snapshot validation should require creditReservationId for expensive work.')
assert.ok(
  missingReservationResult.errors.some((error) => error.includes('creditReservationId')),
  'Missing credit reservation should be reported clearly.',
)

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  STRICT_TOOL_READINESS: 'false',
  TOOL_CHECK_TIMEOUT_MS: '10000',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'internal-testing-approval-credit-gates-smoke',
  auth: { userId: 'internal-testing-smoke-user', isMockUser: true },
}

const missingIdsWorker = await runWorkerClaimRunner(context, {
  jobId: 'job-internal-testing-missing-ids',
  workspaceId: approvedSnapshot.workspaceId,
  projectId: approvedSnapshot.projectId,
  jobType: 'provider_request',
  workerType: 'noop_worker',
  idempotencyKey: 'internal-testing-missing-ids',
  dryRun: true,
})
assert.equal(missingIdsWorker.status, 'blocked', 'Expensive worker dry-run should block without approved snapshot and reservation IDs.')
assert.ok(missingIdsWorker.gateChecks.some((gate) => gate.gate === 'approved_snapshot' && !gate.passed))
assert.ok(missingIdsWorker.gateChecks.some((gate) => gate.gate === 'credit_reservation' && !gate.passed))

const readyWorker = await runWorkerClaimRunner(context, {
  jobId: 'job-internal-testing-ready-ids',
  workspaceId: approvedSnapshot.workspaceId,
  projectId: approvedSnapshot.projectId,
  jobType: 'provider_request',
  workerType: 'noop_worker',
  idempotencyKey: 'internal-testing-ready-ids',
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: approvedSnapshot.creditReservationId,
  dryRun: true,
})
assert.equal(readyWorker.status, 'dry_run', 'Expensive worker dry-run should pass gates when approved snapshot and reservation IDs exist.')
assert.ok(readyWorker.gateChecks.some((gate) => gate.gate === 'approved_snapshot' && gate.passed))
assert.ok(readyWorker.gateChecks.some((gate) => gate.gate === 'credit_reservation' && gate.passed))
assert.equal(readyWorker.events.length, 0, 'Dry-run gate validation should not execute worker events.')

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-approval-credit-gates',
  decision: docJson.decision,
  requiredIds: docJson.requiredIds,
  checks: [
    'mock_credit_gate_allows_approved_estimate_and_reservation',
    'mock_credit_gate_blocks_missing_reservation',
    'approved_snapshot_requires_credit_reservation_for_worker',
    'expensive_worker_blocks_without_ids',
    'expensive_worker_dry_run_passes_with_ids',
    'no_real_spend_or_worker_execution',
  ],
  blockedScope: docJson.blockedScope,
}, null, 2))
