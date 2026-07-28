import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createApprovedSnapshotService } from '../services/approved-snapshot-service'
import { findApprovedSnapshotSecretLikePaths } from '../services/approved-snapshot-validation'
import { createCreditGateService } from '../services/credit-gate-service'
import { createJobService } from '../services/job-service'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'legacy-authority-cutover-smoke',
  auth: { userId: 'legacy-authority-user', isMockUser: true },
}

assert.deepEqual(findApprovedSnapshotSecretLikePaths({
  planes: [
    { motionToken: 'ambient_drift' },
    { motionToken: 'headline_reveal' },
    { motionToken: 'subject_parallax' },
    { motionToken: 'caption_hold' },
  ],
}), [])
assert.deepEqual(
  findApprovedSnapshotSecretLikePaths({ motionToken: 'caller-selected-token-value' }),
  ['$.motionToken'],
)
assert.deepEqual(
  findApprovedSnapshotSecretLikePaths({ accessToken: 'not-a-real-secret' }),
  ['$.accessToken'],
)
assert.deepEqual(
  findApprovedSnapshotSecretLikePaths({
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
  }),
  [],
)
assert.deepEqual(
  findApprovedSnapshotSecretLikePaths({
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: true,
  }),
  ['$.containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials'],
)

await expectToolNotReady(
  () => createApprovedSnapshotService(context).createApprovedSnapshot({
    workspaceId: 'legacy-workspace',
    projectId: 'legacy-project',
    editPlanId: 'legacy-plan',
    creditEstimateId: 'legacy-estimate',
    creditApprovalId: 'legacy-approval',
    creditReservationId: 'legacy-reservation',
    snapshotVersion: 1,
    snapshotJson: {},
    planHash: 'caller-plan-hash',
    creditHash: 'caller-credit-hash',
    sourceSequenceHash: 'caller-source-hash',
    timingHash: 'caller-timing-hash',
    idempotencyKey: 'legacy-snapshot-create',
  }),
  'Caller-authored approved snapshot service must fail closed.',
)

await expectToolNotReady(
  () => createCreditGateService(context).approveCreditEstimate({
    workspaceId: 'legacy-workspace',
    creditEstimateId: 'legacy-estimate',
    idempotencyKey: 'legacy-credit-approve',
  }),
  'Standalone credit approval service must fail closed.',
)

await expectToolNotReady(
  () => createCreditGateService(context).reserveCredits({
    workspaceId: 'legacy-workspace',
    projectId: 'legacy-project',
    editPlanId: 'legacy-plan',
    creditEstimateId: 'legacy-estimate',
    idempotencyKey: 'legacy-credit-reserve',
  }),
  'Standalone credit reservation service must fail closed.',
)

await expectToolNotReady(
  () => createJobService(context).createJob({
    workspaceId: 'legacy-workspace',
    projectId: 'legacy-project',
    jobType: 'render_export',
    approvedPlanSnapshotId: 'caller-snapshot',
    creditReservationId: 'caller-reservation',
    payloadJson: { callerSelected: true },
  }),
  'Free-form job service must fail closed.',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'caller_authored_snapshot_service_disabled',
    'standalone_credit_approval_service_disabled',
    'standalone_credit_reservation_service_disabled',
    'free_form_job_service_disabled',
    'canonical_authority_is_only_mutation_path',
    'enumerated_motion_tokens_are_not_credentials',
    'caller_selected_or_auth_tokens_remain_rejected',
  ],
}))

async function expectToolNotReady(action: () => Promise<unknown>, message: string): Promise<void> {
  let caught: unknown
  try {
    await action()
  } catch (error) {
    caught = error
  }
  assert.ok(caught instanceof ApiError && caught.code === 'TOOL_NOT_READY', `${message} Received: ${String(caught)}`)
}
