import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_DECISION,
  reviewInternalTestingWorkerClaimDryRun,
} from '../tool-calling/internal-testing-worker-claim-dry-run'
import type {
  InternalTestingWorkerPayloadDryRunInput,
} from '../tool-calling/internal-testing-worker-payload-dry-run'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string): void {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const requiredFiles = [
  'server/tool-calling/internal-testing-worker-claim-dry-run.ts',
  'server/smoke/internal-testing-worker-claim-dry-run-smoke.ts',
  'src/lib/internal-testing-worker-claim-dry-run-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-worker-claim-dry-run'],
  'tsx server/smoke/internal-testing-worker-claim-dry-run-smoke.ts',
)

const completeInput: InternalTestingWorkerPayloadDryRunInput = {
  workspaceId: 'workspace-internal-testing',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  approvedPlanSnapshotId: 'approved-snapshot-internal-testing',
  editPlanId: 'edit-plan-internal-testing',
  creditEstimateId: 'credit-estimate-internal-testing',
  creditReservationId: 'credit-reservation-internal-testing',
  toolExecutionPlanId: 'tool-execution-plan-internal-testing',
  idempotencyKey: 'internal-testing-worker-claim-dry-run-001',
  requestedPatternId: 'raw_footage_to_social_short',
  privateArtifactReferences: [
    {
      storageReferenceId: 'private-source-media-001',
      artifactType: 'source_media',
      storageUri: 'private://workspace-internal-testing/project/mock-project-edit-chat-foundation/source/source-video.mp4',
      source: 'finalized_source_upload',
    },
    {
      storageReferenceId: 'private-review-manifest-001',
      artifactType: 'qa_report',
      storageUri: 'storage://private/workspace-internal-testing/project/mock-project-edit-chat-foundation/review/manifest.json',
      source: 'private_review_manifest',
    },
  ],
}

const review = reviewInternalTestingWorkerClaimDryRun(completeInput)

assert.equal(review.decision, INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_DECISION)
assert.equal(review.status, 'passed_ready_for_mock_worker_execution_harness')
assert.equal(review.productReady, false)
assert.equal(review.blockers.length, 0)
assert.equal(review.queuedItemCount, 14)
assert.equal(review.claimAttemptCount, 15)
assert.equal(review.claimedLeaseCount, 14)
assert.equal(review.releasedLeaseCount, 14)
assert.equal(review.duplicateClaimBlocked, true)
assert.equal(review.duplicateClaimResult, 'already_claimed')
assert.equal(review.claimSummaries.length, 14)
assert.equal(review.queueStatusAfterClaim.length, 14)

for (const summary of review.claimSummaries) {
  assert.equal(summary.claimResult, 'claimed')
  assert.equal(summary.leaseStatus, 'claimed')
  assert.equal(summary.released, true)
  assert.ok(summary.jobId.length > 0)
}

for (const queueStatus of review.queueStatusAfterClaim) {
  assert.equal(queueStatus.queueStatus, 'queued')
}

assert.deepEqual(review.blockedScope, {
  frontendToolExecution: false,
  rawPromptExecution: false,
  publicOrSignedUrlArtifacts: false,
  serviceRoleBrowserAccess: false,
  providerOrModelCalls: false,
  workerDispatch: false,
  workerExecution: false,
  toolExecution: false,
  mediaProcessing: false,
  renderOrExport: false,
  creditSpend: false,
  ledgerWrites: false,
  supabaseWrites: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
})

const blockedReview = reviewInternalTestingWorkerClaimDryRun({
  workspaceId: completeInput.workspaceId,
  projectId: completeInput.projectId,
  editSessionId: completeInput.editSessionId,
})
assert.equal(blockedReview.status, 'blocked_by_queue_or_claim_gate')
assert.equal(blockedReview.claimedLeaseCount, 0)
assert.ok(blockedReview.blockers.includes('approvedPlanSnapshotId_missing'))

const signedArtifactReview = reviewInternalTestingWorkerClaimDryRun({
  ...completeInput,
  privateArtifactReferences: [
    {
      storageReferenceId: 'signed-url-source-media',
      artifactType: 'source_media',
      storageUri: 'https://storage.example.test/source.mp4?signature=secret',
      source: 'finalized_source_upload',
    },
  ],
})
assert.equal(signedArtifactReview.status, 'blocked_by_queue_or_claim_gate')
assert.equal(signedArtifactReview.claimedLeaseCount, 0)
assert.ok(signedArtifactReview.blockers.includes('privateArtifactReference_invalid_signed-url-source-media'))

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-worker-claim-dry-run')
assert.ok(scenario, 'Worker claim dry-run scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const reviewSource = read('server/tool-calling/internal-testing-worker-claim-dry-run.ts')
assert.doesNotMatch(reviewSource, /dispatchMockWorkerJob|runWorkerClaimRunner|markJobRunning|markJobCompleted|execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(reviewSource, /\bworkerDispatch:\s*true|\bworkerExecution:\s*true|\btoolExecution:\s*true|\bmediaProcessing:\s*true|\bproductReady:\s*true/i)

const uiSource = read('src/lib/internal-testing-worker-claim-dry-run-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /mockLeaseOnly:\s*true/)
assert.match(uiSource, /workerDispatchAllowed:\s*false/)
assert.match(uiSource, /workerExecutionAllowed:\s*false/)
assert.match(pageSource, /internal-testing-worker-claim-dry-run/)
assert.match(pageSource, /Worker claim dry run/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-worker-claim-dry-run"')
const sectionEnd = pageSource.indexOf('data-testid="internal-testing-preference-video-limits"')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded worker claim dry-run section.')
const sectionSource = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(sectionSource, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-worker-claim-dry-run',
  decision: review.decision,
  status: review.status,
  queuedItemCount: review.queuedItemCount,
  claimedLeaseCount: review.claimedLeaseCount,
  releasedLeaseCount: review.releasedLeaseCount,
  duplicateClaimResult: review.duplicateClaimResult,
  productReady: review.productReady,
}, null, 2))
