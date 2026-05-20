export type MockWorkerLeaseScenarioId =
  | 'claim-available-job-lease'
  | 'claim-already-leased-job-blocked'
  | 'expired-lease-reclaimed'
  | 'heartbeat-renews-lease'
  | 'lease-released-after-completion'
  | 'lease-failed-after-worker-error'
  | 'stale-lease-detected'
  | 'stale-lease-recovery-schedules-retry'
  | 'provider-retry-blocked-idempotency-unknown'
  | 'render-job-long-lease'
  | 'lyria-worker-lease-mock-flow'
  | 'sfx-worker-lease-mock-flow'
  | 'render-worker-lease-mock-flow'
  | 'credit-spend-idempotency-check'
  | 'duplicate-dispatch-idempotency-conflict'
  | 'backend-transport-mock-envelope-sent'
  | 'cloud-run-transport-placeholder-backend-required'
  | 'frontend-safe-route-cannot-claim-real-lease'

export interface MockWorkerLeaseScenario {
  id: MockWorkerLeaseScenarioId
  label: string
  expectedNextStep: string
  notes: string[]
}

export const mockWorkerLeaseScenarios: MockWorkerLeaseScenario[] = [
  scenario('claim-available-job-lease', 'Claim available job lease.', 'lease_claimed'),
  scenario('claim-already-leased-job-blocked', 'Claim already leased job blocked.', 'wait_for_active_lease'),
  scenario('expired-lease-reclaimed', 'Expired lease reclaimed.', 'lease_reclaimed'),
  scenario('heartbeat-renews-lease', 'Heartbeat renews lease.', 'heartbeat_recorded'),
  scenario('lease-released-after-completion', 'Lease released after completion.', 'lease_completed'),
  scenario('lease-failed-after-worker-error', 'Lease failed after worker error.', 'retry_or_recover'),
  scenario('stale-lease-detected', 'Stale lease detected.', 'recover_stale_lease'),
  scenario('stale-lease-recovery-schedules-retry', 'Stale lease recovery schedules retry.', 'retry_scheduled'),
  scenario('provider-retry-blocked-idempotency-unknown', 'Provider job retry blocked because idempotency is unknown.', 'manual_review_required'),
  scenario('render-job-long-lease', 'Render job lease uses longer duration.', 'lease_claimed'),
  scenario('lyria-worker-lease-mock-flow', 'Lyria worker lease mock flow.', 'worker_completed_mock'),
  scenario('sfx-worker-lease-mock-flow', 'SFX worker lease mock flow.', 'worker_review_or_retry'),
  scenario('render-worker-lease-mock-flow', 'Render worker lease mock flow.', 'worker_completed_mock'),
  scenario('credit-spend-idempotency-check', 'Credit spend idempotency check.', 'idempotency_recorded'),
  scenario('duplicate-dispatch-idempotency-conflict', 'Duplicate dispatch idempotency conflict.', 'block_duplicate_dispatch'),
  scenario('backend-transport-mock-envelope-sent', 'Backend transport mock envelope sent.', 'runtime_message_acknowledged'),
  scenario('cloud-run-transport-placeholder-backend-required', 'Real Cloud Run transport placeholder returns backend-required.', 'backend_required'),
  scenario('frontend-safe-route-cannot-claim-real-lease', 'Frontend-safe route cannot claim real lease.', 'backend_required'),
]

export function getMockWorkerLeaseScenarioById(
  id: MockWorkerLeaseScenarioId,
): MockWorkerLeaseScenario | undefined {
  return mockWorkerLeaseScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockWorkerLeaseScenario(): MockWorkerLeaseScenario {
  return mockWorkerLeaseScenarios[0]
}

function scenario(
  id: MockWorkerLeaseScenarioId,
  label: string,
  expectedNextStep: string,
  notes: string[] = [],
): MockWorkerLeaseScenario {
  return {
    id,
    label,
    expectedNextStep,
    notes: [
      'Mock/local scenario only; it must not mutate remote Supabase or call providers, Stripe, Cloud Run, Pub/Sub, or render workers.',
      ...notes,
    ],
  }
}
