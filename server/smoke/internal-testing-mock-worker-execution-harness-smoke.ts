import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_DECISION,
  reviewInternalTestingMockWorkerExecutionHarness,
} from '../tool-calling/internal-testing-mock-worker-execution-harness'
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
  'server/tool-calling/internal-testing-mock-worker-execution-harness.ts',
  'server/smoke/internal-testing-mock-worker-execution-harness-smoke.ts',
  'src/lib/internal-testing-mock-worker-execution-harness-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-mock-worker-execution-harness'],
  'tsx server/smoke/internal-testing-mock-worker-execution-harness-smoke.ts',
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
  idempotencyKey: 'internal-testing-mock-worker-execution-harness-001',
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

const review = reviewInternalTestingMockWorkerExecutionHarness(completeInput)

assert.equal(review.decision, INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_DECISION)
assert.equal(review.status, 'passed_ready_for_private_review_result_dry_run')
assert.equal(review.productReady, false)
assert.equal(review.blockers.length, 0)
assert.equal(review.queuedItemCount, 14)
assert.equal(review.completedItemCount, 14)
assert.equal(review.completedLeaseCount, 14)
assert.equal(review.eventCount, 42)
assert.equal(review.metadataResultCount, 14)
assert.equal(review.executionSummaries.length, 14)
assert.equal(review.metadataResults.length, 14)

for (const summary of review.executionSummaries) {
  assert.equal(summary.claimResult, 'claimed')
  assert.equal(summary.finalQueueStatus, 'completed')
  assert.equal(summary.finalLeaseStatus, 'completed')
  assert.deepEqual(summary.eventTypes, ['started', 'progress', 'completed'])
  assert.equal(summary.metadataOnly, true)
}

for (const result of review.metadataResults) {
  assert.equal(result.resultType, 'metadata_only_completion')
  assert.equal(result.privateManifestOnly, true)
  assert.equal(result.generatedMedia, false)
  assert.equal(result.providerCalls, false)
  assert.equal(result.toolExecution, false)
}

assert.deepEqual(review.blockedScope, {
  frontendToolExecution: false,
  rawPromptExecution: false,
  publicOrSignedUrlArtifacts: false,
  serviceRoleBrowserAccess: false,
  providerOrModelCalls: false,
  workerDispatch: false,
  realWorkerExecution: false,
  toolExecution: false,
  mediaProcessing: false,
  renderOrExport: false,
  generatedMediaArtifacts: false,
  creditSpend: false,
  ledgerWrites: false,
  supabaseWrites: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
})

const blockedReview = reviewInternalTestingMockWorkerExecutionHarness({
  workspaceId: completeInput.workspaceId,
  projectId: completeInput.projectId,
  editSessionId: completeInput.editSessionId,
})
assert.equal(blockedReview.status, 'blocked_by_claim_or_completion_gate')
assert.equal(blockedReview.completedItemCount, 0)
assert.ok(blockedReview.blockers.includes('approvedPlanSnapshotId_missing'))

const signedArtifactReview = reviewInternalTestingMockWorkerExecutionHarness({
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
assert.equal(signedArtifactReview.status, 'blocked_by_claim_or_completion_gate')
assert.equal(signedArtifactReview.completedItemCount, 0)
assert.ok(signedArtifactReview.blockers.includes('privateArtifactReference_invalid_signed-url-source-media'))

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-mock-worker-execution-harness')
assert.ok(scenario, 'Mock worker execution harness scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const reviewSource = read('server/tool-calling/internal-testing-mock-worker-execution-harness.ts')
assert.doesNotMatch(reviewSource, /dispatchMockWorkerJob|runWorkerClaimRunner|runMockLyriaWorkerFlow|runMockSFXWorkerFlow|execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(reviewSource, /\bworkerDispatch:\s*true|\brealWorkerExecution:\s*true|\btoolExecution:\s*true|\bmediaProcessing:\s*true|\bgeneratedMediaArtifacts:\s*true|\bproductReady:\s*true/i)

const uiSource = read('src/lib/internal-testing-mock-worker-execution-harness-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /metadataOnly:\s*true/)
assert.match(uiSource, /workerDispatchAllowed:\s*false/)
assert.match(uiSource, /realWorkerExecutionAllowed:\s*false/)
assert.match(pageSource, /internal-testing-mock-worker-execution-harness/)
assert.match(pageSource, /Mock worker execution harness/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-mock-worker-execution-harness"')
const sectionEnd = pageSource.indexOf('data-testid="internal-testing-preference-video-limits"')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded mock execution harness section.')
const sectionSource = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(sectionSource, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-mock-worker-execution-harness',
  decision: review.decision,
  status: review.status,
  completedItemCount: review.completedItemCount,
  completedLeaseCount: review.completedLeaseCount,
  eventCount: review.eventCount,
  metadataResultCount: review.metadataResultCount,
  productReady: review.productReady,
}, null, 2))
