import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  INTERNAL_TESTING_APPROVED_SNAPSHOT_ROUTE_REVIEW_DECISION,
  reviewInternalTestingApprovedSnapshotAdapterRoutes,
  type InternalTestingApprovedSnapshotRouteReviewInput,
} from '../tool-calling/internal-testing-approved-snapshot-route-review'
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
  'server/tool-calling/internal-testing-approved-snapshot-route-review.ts',
  'server/smoke/internal-testing-approved-snapshot-route-review-smoke.ts',
  'src/lib/internal-testing-approved-snapshot-route-review-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-approved-snapshot-route-review'],
  'tsx server/smoke/internal-testing-approved-snapshot-route-review-smoke.ts',
)

const completeInput: InternalTestingApprovedSnapshotRouteReviewInput = {
  workspaceId: 'workspace-internal-testing',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  approvedPlanSnapshotId: 'approved-snapshot-internal-testing',
  creditEstimateId: 'credit-estimate-internal-testing',
  creditReservationId: 'credit-reservation-internal-testing',
  toolExecutionPlanId: 'tool-execution-plan-internal-testing',
  idempotencyKey: 'internal-testing-tool-route-review-001',
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

const review = reviewInternalTestingApprovedSnapshotAdapterRoutes(completeInput)

assert.equal(review.decision, INTERNAL_TESTING_APPROVED_SNAPSHOT_ROUTE_REVIEW_DECISION)
assert.equal(review.status, 'passed_ready_for_worker_payload_dry_run')
assert.equal(review.productReady, false)
assert.equal(review.blockers.length, 0)
assert.equal(review.requestedPatternId, 'raw_footage_to_social_short')
assert.ok(review.routeCount > 0, 'Route review should include at least one route.')
assert.equal(review.adapterPlanCount, review.routeCount)
assert.equal(review.workerRouteBridgePlanCount, review.routeCount)
assert.equal(review.privateArtifactReferenceCount, 2)
assert.equal(review.requiredGateCount, 9)

for (const route of review.routeSummaries) {
  assert.equal(route.approvedSnapshotRequired, true)
  assert.equal(route.rawPromptAllowed, false)
  assert.equal(route.signedUrlAllowed, false)
  assert.equal(route.serviceRoleAllowed, false)
  assert.equal(route.executesTools, false)
  assert.equal(route.mediaProcessingAllowed, false)
  assert.equal(route.payloadDryRunReady, true)
  assert.equal(route.storageReferenceMode, 'private_artifact_references_only')
  assert.ok(route.requiredPayloadFields.includes('approvedSnapshotId'))
  assert.ok(route.requiredPayloadFields.includes('toolExecutionPlanId'))
  assert.ok(route.requiredPayloadFields.includes('storageReferenceIds'))
}

assert.deepEqual(review.blockedScope, {
  frontendToolExecution: false,
  rawPromptExecution: false,
  publicOrSignedUrlArtifacts: false,
  serviceRoleBrowserAccess: false,
  providerOrModelCalls: false,
  workerDispatch: false,
  mediaProcessing: false,
  renderOrExport: false,
  creditSpend: false,
  ledgerWrites: false,
  supabaseWrites: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
})

const missingGateReview = reviewInternalTestingApprovedSnapshotAdapterRoutes({
  workspaceId: completeInput.workspaceId,
  projectId: completeInput.projectId,
  editSessionId: completeInput.editSessionId,
})
assert.equal(missingGateReview.status, 'blocked_missing_approval_or_private_artifacts')
assert.ok(missingGateReview.blockers.includes('approvedPlanSnapshotId_missing'))
assert.ok(missingGateReview.blockers.includes('creditReservationId_missing'))
assert.ok(missingGateReview.blockers.includes('privateArtifactReferences_missing'))
assert.ok(missingGateReview.routeSummaries.every((route) => route.payloadDryRunReady === false))

const unsafeArtifactReview = reviewInternalTestingApprovedSnapshotAdapterRoutes({
  ...completeInput,
  privateArtifactReferences: [
    {
      storageReferenceId: 'signed-url-source-media',
      artifactType: 'source_media',
      storageUri: 'https://storage.example.test/source.mp4?token=secret',
      source: 'finalized_source_upload',
    },
  ],
})
assert.equal(unsafeArtifactReview.status, 'blocked_missing_approval_or_private_artifacts')
assert.ok(unsafeArtifactReview.blockers.includes('privateArtifactReference_invalid_signed-url-source-media'))

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-approved-snapshot-route-review')
assert.ok(scenario, 'Approved snapshot route review scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const reviewSource = read('server/tool-calling/internal-testing-approved-snapshot-route-review.ts')
assert.doesNotMatch(reviewSource, /execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(reviewSource, /workerDispatch:\s*true|mediaProcessing:\s*true|productReady:\s*true/i)

const uiSource = read('src/lib/internal-testing-approved-snapshot-route-review-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /frontendExecutionAllowed:\s*false/)
assert.match(uiSource, /workerDispatchAllowed:\s*false/)
assert.match(uiSource, /mediaProcessingAllowed:\s*false/)
assert.match(pageSource, /internal-testing-approved-snapshot-route-review/)
assert.match(pageSource, /Approved route review/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-approved-snapshot-route-review"')
const sectionEnd = pageSource.indexOf('data-testid="internal-testing-preference-video-limits"')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded approved route review section.')
const sectionSource = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(sectionSource, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-approved-snapshot-route-review',
  decision: review.decision,
  status: review.status,
  routeCount: review.routeCount,
  requiredGateCount: review.requiredGateCount,
  productReady: review.productReady,
}, null, 2))
