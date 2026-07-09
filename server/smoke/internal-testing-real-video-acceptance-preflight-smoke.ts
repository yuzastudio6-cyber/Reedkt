import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  getDefaultInternalTestingRealVideoFixturePath,
  INTERNAL_TESTING_REAL_VIDEO_ACCEPTANCE_PREFLIGHT_DECISION,
  reviewInternalTestingRealVideoAcceptancePreflight,
} from '../tool-calling/internal-testing-real-video-acceptance-preflight'
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
  'server/tool-calling/internal-testing-real-video-acceptance-preflight.ts',
  'server/smoke/internal-testing-real-video-acceptance-preflight-smoke.ts',
  'src/lib/internal-testing-real-video-acceptance-preflight-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-real-video-acceptance-preflight'],
  'tsx server/smoke/internal-testing-real-video-acceptance-preflight-smoke.ts',
)

const fixturePath = getDefaultInternalTestingRealVideoFixturePath()
assert.equal(existsSync(fixturePath), true, `Real-video acceptance fixture is missing: ${fixturePath}`)

const completeInput: InternalTestingWorkerPayloadDryRunInput = {
  workspaceId: 'workspace-internal-testing',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  approvedPlanSnapshotId: 'approved-snapshot-internal-testing',
  editPlanId: 'edit-plan-internal-testing',
  creditEstimateId: 'credit-estimate-internal-testing',
  creditReservationId: 'credit-reservation-internal-testing',
  toolExecutionPlanId: 'tool-execution-plan-internal-testing',
  idempotencyKey: 'internal-testing-real-video-acceptance-preflight-001',
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

const review = reviewInternalTestingRealVideoAcceptancePreflight({
  ...completeInput,
  fixturePath,
})

assert.equal(review.decision, INTERNAL_TESTING_REAL_VIDEO_ACCEPTANCE_PREFLIGHT_DECISION)
assert.equal(review.status, 'passed_ready_for_backend_local_upload_acceptance')
assert.equal(review.nextAction, 'run_backend_local_upload_acceptance')
assert.equal(review.productReady, false)
assert.equal(review.blockers.length, 0)
assert.equal(review.fixture.displayPath, 'Documents/test video/internal testing.MP4')
assert.equal(review.fixture.exists, true)
assert.equal(review.fixture.isFile, true)
assert.equal(review.fixture.basename, 'internal testing.MP4')
assert.equal(review.fixture.extension, '.MP4')
assert.ok(review.fixture.sizeBytes > 0)
assert.equal(review.fixture.readableForPreflight, true)
assert.equal(review.fixture.fileBytesRead, false)
assert.equal(review.fixture.mediaDecoded, false)
assert.equal(review.fixture.uploaded, false)
assert.deepEqual(review.checklist.map((item) => item.status), [
  'passed',
  'passed',
  'passed',
  'passed',
  'passed',
])
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
  uploadStarted: false,
  fileBytesRead: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
})

const missingFixtureReview = reviewInternalTestingRealVideoAcceptancePreflight({
  ...completeInput,
  fixturePath: '/tmp/reeditpro-missing-internal-testing-video.mp4',
})
assert.equal(missingFixtureReview.status, 'blocked_by_missing_real_video_fixture')
assert.ok(missingFixtureReview.blockers.includes('real_video_fixture_missing'))

const blockedReview = reviewInternalTestingRealVideoAcceptancePreflight({
  workspaceId: completeInput.workspaceId,
  projectId: completeInput.projectId,
  editSessionId: completeInput.editSessionId,
  fixturePath,
})
assert.equal(blockedReview.status, 'blocked_by_internal_tester_review_panel_gate')
assert.equal(blockedReview.nextAction, 'resolve_real_video_preflight_blockers')
assert.ok(blockedReview.blockers.includes('approvedPlanSnapshotId_missing'))

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-real-video-acceptance-preflight')
assert.ok(scenario, 'Real-video acceptance preflight scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const reviewSource = read('server/tool-calling/internal-testing-real-video-acceptance-preflight.ts')
assert.doesNotMatch(reviewSource, /createReadStream|readFileSync|readFile\(|decode[A-Z]?\w*\(|probe\(|ffprobe|dispatchMockWorkerJob|execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(reviewSource, /\buploadStarted:\s*true|\bfileBytesRead:\s*true|\bmediaProcessing:\s*true|\btoolExecution:\s*true|\bproductReady:\s*true/i)
assert.doesNotMatch(JSON.stringify(review), /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

const uiSource = read('src/lib/internal-testing-real-video-acceptance-preflight-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /statOnlyPreflight:\s*true/)
assert.match(uiSource, /uploadStarted:\s*false/)
assert.match(uiSource, /productReady:\s*false/)
assert.match(pageSource, /internal-testing-real-video-acceptance-preflight/)
assert.match(pageSource, /Real-video acceptance preflight/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-real-video-acceptance-preflight"')
const sectionEnd = pageSource.indexOf('data-testid="internal-testing-preference-video-limits"')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded real-video acceptance preflight section.')
const sectionSource = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(sectionSource, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-real-video-acceptance-preflight',
  decision: review.decision,
  status: review.status,
  fixtureDisplayPath: review.fixture.displayPath,
  sizeBytes: review.fixture.sizeBytes,
  nextAction: review.nextAction,
  productReady: review.productReady,
}, null, 2))
