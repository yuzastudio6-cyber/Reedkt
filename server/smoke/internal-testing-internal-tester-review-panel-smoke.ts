import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_DECISION,
  reviewInternalTestingInternalTesterReviewPanel,
} from '../tool-calling/internal-testing-internal-tester-review-panel'
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
  'server/tool-calling/internal-testing-internal-tester-review-panel.ts',
  'server/smoke/internal-testing-internal-tester-review-panel-smoke.ts',
  'src/lib/internal-testing-internal-tester-review-panel-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-internal-tester-review-panel'],
  'tsx server/smoke/internal-testing-internal-tester-review-panel-smoke.ts',
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
  idempotencyKey: 'internal-testing-internal-tester-review-panel-001',
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

const review = reviewInternalTestingInternalTesterReviewPanel(completeInput)

assert.equal(review.decision, INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_DECISION)
assert.equal(review.status, 'passed_ready_for_real_video_acceptance_preflight')
assert.equal(review.productReady, false)
assert.equal(review.reviewSectionCount, 7)
assert.equal(review.checklistItemCount, 5)
assert.equal(review.dispositionCount, 3)
assert.equal(review.nextAction, 'prepare_real_video_acceptance_preflight')
assert.equal(review.blockers.length, 0)
assert.equal(review.panel.title, 'Internal tester review panel is ready')
assert.match(review.panel.summary, /metadata-only result summary/i)
assert.deepEqual(review.panel.checklist.map((item) => item.label), [
  'Review summary',
  'Inspect private sections',
  'Confirm boundaries',
  'Record local note',
  'Prepare real-video preflight',
])
assert.deepEqual(review.panel.dispositions.map((item) => item.id), [
  'accepted_for_preflight',
  'needs_revision_before_preflight',
  'blocked_before_preflight',
])

for (const item of review.panel.checklist) {
  assert.equal(item.status, 'ready_for_tester_review')
  assert.equal(item.required, true)
}

assert.deepEqual(review.feedbackCapture, {
  mode: 'browser_local_export_only',
  supabaseWrites: false,
  signedUrls: false,
  publicArtifacts: false,
})
assert.deepEqual(review.realVideoAcceptance, {
  requiredFixturePath: 'Documents/test video/internal testing.MP4',
  allowedInThisGate: false,
  nextGate: 'real_video_acceptance_preflight',
})
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

const blockedReview = reviewInternalTestingInternalTesterReviewPanel({
  workspaceId: completeInput.workspaceId,
  projectId: completeInput.projectId,
  editSessionId: completeInput.editSessionId,
})
assert.equal(blockedReview.status, 'blocked_by_private_review_result_gate')
assert.equal(blockedReview.nextAction, 'resolve_private_review_result_blockers')
assert.equal(blockedReview.checklistItemCount, 0)
assert.ok(blockedReview.blockers.includes('approvedPlanSnapshotId_missing'))

const signedArtifactReview = reviewInternalTestingInternalTesterReviewPanel({
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
assert.equal(signedArtifactReview.status, 'blocked_by_private_review_result_gate')
assert.equal(signedArtifactReview.checklistItemCount, 0)
assert.ok(signedArtifactReview.blockers.includes('privateArtifactReference_invalid_signed-url-source-media'))

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-internal-tester-review-panel')
assert.ok(scenario, 'Internal tester review panel scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const reviewSource = read('server/tool-calling/internal-testing-internal-tester-review-panel.ts')
assert.doesNotMatch(reviewSource, /dispatchMockWorkerJob|runWorkerClaimRunner|execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(reviewSource, /\bworkerDispatch:\s*true|\brealWorkerExecution:\s*true|\btoolExecution:\s*true|\bmediaProcessing:\s*true|\bgeneratedMediaArtifacts:\s*true|\bproductReady:\s*true/i)
assert.doesNotMatch(JSON.stringify(review), /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

const uiSource = read('src/lib/internal-testing-internal-tester-review-panel-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /browserLocalFeedbackOnly:\s*true/)
assert.match(uiSource, /allowedNow:\s*false/)
assert.match(uiSource, /productReady:\s*false/)
assert.match(pageSource, /internal-testing-internal-tester-review-panel/)
assert.match(pageSource, /Internal tester review panel/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-internal-tester-review-panel"')
const sectionEnd = pageSource.indexOf('data-testid="internal-testing-preference-video-limits"')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded internal tester review panel section.')
const sectionSource = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(sectionSource, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-internal-tester-review-panel',
  decision: review.decision,
  status: review.status,
  reviewSectionCount: review.reviewSectionCount,
  checklistItemCount: review.checklistItemCount,
  dispositionCount: review.dispositionCount,
  nextAction: review.nextAction,
  productReady: review.productReady,
}, null, 2))
