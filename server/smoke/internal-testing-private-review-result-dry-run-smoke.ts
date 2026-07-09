import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_DECISION,
  reviewInternalTestingPrivateReviewResultDryRun,
} from '../tool-calling/internal-testing-private-review-result-dry-run'
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
  'server/tool-calling/internal-testing-private-review-result-dry-run.ts',
  'server/smoke/internal-testing-private-review-result-dry-run-smoke.ts',
  'src/lib/internal-testing-private-review-result-dry-run-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-private-review-result-dry-run'],
  'tsx server/smoke/internal-testing-private-review-result-dry-run-smoke.ts',
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
  idempotencyKey: 'internal-testing-private-review-result-dry-run-001',
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

const review = reviewInternalTestingPrivateReviewResultDryRun(completeInput)

assert.equal(review.decision, INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_DECISION)
assert.equal(review.status, 'passed_ready_for_internal_tester_review_panel')
assert.equal(review.productReady, false)
assert.equal(review.completedItemCount, 14)
assert.equal(review.reviewSectionCount, 7)
assert.equal(review.nextAction, 'open_internal_tester_review_panel')
assert.equal(review.blockers.length, 0)
assert.equal(review.userFacingSummary.title, 'Private review draft is ready for internal inspection')
assert.match(review.userFacingSummary.summary, /metadata-only result summary/i)
assert.match(review.userFacingSummary.disclaimer, /no edited media, export, or public delivery/i)
assert.equal(review.reviewSections.length, 7)
assert.equal(review.reviewSections.reduce((sum, section) => sum + section.evidenceCount, 0), 14)
assert.deepEqual(review.reviewSections.map((section) => section.label), [
  'Source preparation',
  'Speech and captions',
  'Story cleanup',
  'Audio polish',
  'Visual review',
  'Private review build',
  'Delivery check',
])

for (const section of review.reviewSections) {
  assert.equal(section.status, 'ready_for_internal_review')
  assert.ok(section.evidenceCount >= 2)
}

assert.equal(review.privateManifest.visibility, 'private_internal_testing_only')
assert.equal(review.privateManifest.storageMode, 'metadata_only_no_uploaded_artifact')
assert.equal(review.privateManifest.generatedMedia, false)
assert.equal(review.privateManifest.publicArtifact, false)
assert.equal(review.privateManifest.signedUrl, false)

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

const blockedReview = reviewInternalTestingPrivateReviewResultDryRun({
  workspaceId: completeInput.workspaceId,
  projectId: completeInput.projectId,
  editSessionId: completeInput.editSessionId,
})
assert.equal(blockedReview.status, 'blocked_by_metadata_completion_gate')
assert.equal(blockedReview.nextAction, 'resolve_completion_blockers')
assert.equal(blockedReview.reviewSectionCount, 0)
assert.ok(blockedReview.blockers.includes('approvedPlanSnapshotId_missing'))

const signedArtifactReview = reviewInternalTestingPrivateReviewResultDryRun({
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
assert.equal(signedArtifactReview.status, 'blocked_by_metadata_completion_gate')
assert.equal(signedArtifactReview.reviewSectionCount, 0)
assert.ok(signedArtifactReview.blockers.includes('privateArtifactReference_invalid_signed-url-source-media'))

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-private-review-result-dry-run')
assert.ok(scenario, 'Private review result dry-run scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const reviewSource = read('server/tool-calling/internal-testing-private-review-result-dry-run.ts')
assert.doesNotMatch(reviewSource, /dispatchMockWorkerJob|runWorkerClaimRunner|execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(reviewSource, /\bworkerDispatch:\s*true|\brealWorkerExecution:\s*true|\btoolExecution:\s*true|\bmediaProcessing:\s*true|\bgeneratedMediaArtifacts:\s*true|\bproductReady:\s*true/i)
assert.doesNotMatch(JSON.stringify(review), /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

const uiSource = read('src/lib/internal-testing-private-review-result-dry-run-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /privateInternalOnly:\s*true/)
assert.match(uiSource, /editedMediaAvailable:\s*false/)
assert.match(uiSource, /publicDeliveryAllowed:\s*false/)
assert.match(pageSource, /internal-testing-private-review-result-dry-run/)
assert.match(pageSource, /Private review result dry run/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-private-review-result-dry-run"')
const sectionEnd = pageSource.indexOf('data-testid="internal-testing-preference-video-limits"')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded private review result section.')
const sectionSource = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(sectionSource, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-private-review-result-dry-run',
  decision: review.decision,
  status: review.status,
  completedItemCount: review.completedItemCount,
  reviewSectionCount: review.reviewSectionCount,
  nextAction: review.nextAction,
  productReady: review.productReady,
}, null, 2))
