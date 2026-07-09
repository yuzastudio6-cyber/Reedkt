import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_DECISION,
  reviewInternalTestingMockWorkerQueue,
} from '../tool-calling/internal-testing-mock-worker-queue-review'
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
  'server/tool-calling/internal-testing-mock-worker-queue-review.ts',
  'server/smoke/internal-testing-mock-worker-queue-review-smoke.ts',
  'src/lib/internal-testing-mock-worker-queue-review-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-mock-worker-queue-review'],
  'tsx server/smoke/internal-testing-mock-worker-queue-review-smoke.ts',
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
  idempotencyKey: 'internal-testing-mock-worker-queue-review-001',
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

const review = reviewInternalTestingMockWorkerQueue(completeInput)

assert.equal(review.decision, INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_DECISION)
assert.equal(review.status, 'passed_ready_for_worker_claim_dry_run_review')
assert.equal(review.productReady, false)
assert.equal(review.blockers.length, 0)
assert.equal(review.payloadCount, 14)
assert.equal(review.queuedItemCount, review.payloadCount)
assert.equal(review.replayedItemCount, review.payloadCount)
assert.equal(review.duplicateQueuedItemCount, 0)
assert.equal(review.blockedItemCount, 0)
assert.equal(review.queueItems.length, review.payloadCount)
assert.equal(review.replayedQueueItems.length, review.payloadCount)

const queueItemIds = new Set(review.queueItems.map((item) => item.id))
assert.equal(queueItemIds.size, review.queueItems.length)
for (const replayedItem of review.replayedQueueItems) {
  assert.ok(queueItemIds.has(replayedItem.id), 'Replayed queue items should reuse the first-pass item IDs.')
}

for (const item of review.queueItems) {
  assert.equal(item.queueStatus, 'queued')
  assert.equal(item.gateCheck.ok, true)
  assert.equal(item.mockOnly, true)
  assert.equal(item.payload.mockOnly, true)
  assert.equal(item.payload.dryRunOnly, true)
  assert.equal(item.payload.noWorkerClaim, true)
  assert.equal(item.payload.noWorkerDispatch, true)
  assert.equal(item.payload.noToolExecution, true)
  assert.equal(item.payload.noMediaProcessing, true)
  assert.equal(item.payload.noCreditSpend, true)
  assert.equal(typeof item.payload.idempotencyKey, 'string')
}

for (const summary of review.queueSummaries) {
  assert.equal(summary.queueStatus, 'queued')
  assert.equal(summary.gateStatus, 'passed')
  assert.equal(summary.replayed, true)
  assert.ok(summary.idempotencyKey.startsWith(completeInput.idempotencyKey ?? ''))
}

assert.deepEqual(review.blockedScope, {
  frontendToolExecution: false,
  rawPromptExecution: false,
  publicOrSignedUrlArtifacts: false,
  serviceRoleBrowserAccess: false,
  providerOrModelCalls: false,
  workerDispatch: false,
  workerClaim: false,
  mediaProcessing: false,
  renderOrExport: false,
  creditSpend: false,
  ledgerWrites: false,
  supabaseWrites: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
})

const blockedReview = reviewInternalTestingMockWorkerQueue({
  workspaceId: completeInput.workspaceId,
  projectId: completeInput.projectId,
  editSessionId: completeInput.editSessionId,
})
assert.equal(blockedReview.status, 'blocked_by_worker_payload_or_queue_gate')
assert.equal(blockedReview.queuedItemCount, 0)
assert.ok(blockedReview.blockers.includes('approvedPlanSnapshotId_missing'))

const signedArtifactReview = reviewInternalTestingMockWorkerQueue({
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
assert.equal(signedArtifactReview.status, 'blocked_by_worker_payload_or_queue_gate')
assert.equal(signedArtifactReview.queuedItemCount, 0)
assert.ok(signedArtifactReview.blockers.includes('privateArtifactReference_invalid_signed-url-source-media'))

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-mock-worker-queue-review')
assert.ok(scenario, 'Mock worker queue review scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const reviewSource = read('server/tool-calling/internal-testing-mock-worker-queue-review.ts')
assert.doesNotMatch(reviewSource, /execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(reviewSource, /\bworkerDispatch:\s*true|\bworkerClaim:\s*true|\bmediaProcessing:\s*true|\bproductReady:\s*true/i)

const uiSource = read('src/lib/internal-testing-mock-worker-queue-review-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /mockQueueOnly:\s*true/)
assert.match(uiSource, /workerClaimAllowed:\s*false/)
assert.match(uiSource, /workerDispatchAllowed:\s*false/)
assert.match(pageSource, /internal-testing-mock-worker-queue-review/)
assert.match(pageSource, /Mock worker queue review/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-mock-worker-queue-review"')
const sectionEnd = pageSource.indexOf('data-testid="internal-testing-preference-video-limits"')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded mock queue review section.')
const sectionSource = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(sectionSource, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-mock-worker-queue-review',
  decision: review.decision,
  status: review.status,
  queuedItemCount: review.queuedItemCount,
  replayedItemCount: review.replayedItemCount,
  duplicateQueuedItemCount: review.duplicateQueuedItemCount,
  productReady: review.productReady,
}, null, 2))
