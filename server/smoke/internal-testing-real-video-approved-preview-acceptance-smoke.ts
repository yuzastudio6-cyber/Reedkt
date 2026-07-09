import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { runMockApprovedGenerationFlow } from '../../src/backend/orchestrators/mock-e2e-orchestrator'
import { createMockDatabase, resetMockIds } from '../../src/backend/mock/mock-database'
import { unwrapServiceResult } from '../../src/backend/service-result'

const root = process.cwd()
const fixturePath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), 'Documents/test video/internal testing.MP4'))
const rawFixtureFileName = basename(fixturePath)
const uploadedFixtureFileName = rawFixtureFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')
const prompt = 'Create a clean professional social edit from this source video. Keep the pacing tight, preserve the meaning, add readable captions, lightly polish the audio, avoid clutter, and prepare a private review plan before any final export.'

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

assert.equal(existsSync(fixturePath), true, `Real-video approved-preview fixture is missing: ${fixturePath}`)
const fixtureStat = statSync(fixturePath)
assert.equal(fixtureStat.isFile(), true, 'Real-video approved-preview fixture must be a file.')
assert.ok(fixtureStat.size > 0, 'Real-video approved-preview fixture must be non-empty.')
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Real-video approved-preview fixture must be an MP4.')

resetMockIds()
const db = createMockDatabase()
const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({
  projectTitle: 'Internal testing real-video approved preview acceptance',
  prompt,
  clips: [
    {
      fileName: uploadedFixtureFileName,
      mimeType: 'video/mp4',
      userNotes: 'Real internal testing source video uploaded through backend-local acceptance. Duration is intentionally not decoded in this gate.',
      uploadedOrder: 1,
    },
  ],
  includeMusicDirectorPlanning: true,
  requestedStrokeMotion: true,
}, db))

assert.equal(planningState.sourceAssets.length, 1)
assert.equal(planningState.sourceAssets[0]?.fileName, uploadedFixtureFileName)
assert.equal(planningState.editPlan.status, 'awaiting_approval')
assert.equal(planningState.creditEstimate.status, 'shown_to_user')
assert.equal(db.creditReservations.length, 0)
assert.equal(db.jobs.length, 0)
assert.equal(db.renderJobs.length, 0)
assert.equal(db.renders.length, 0)

const approvedState = unwrapServiceResult(runMockApprovedGenerationFlow(db, planningState))

assert.equal(approvedState.sourceAssets[0]?.fileName, uploadedFixtureFileName)
assert.equal(approvedState.editPlan.status, 'approved')
assert.equal(approvedState.editPlan.approvalStatus, 'approved')
assert.equal(approvedState.creditEstimate.status, 'approved')
assert.equal(approvedState.creditReservation.status, 'reserved')
assert.equal(approvedState.creditReservation.reservedCredits, approvedState.creditEstimate.totalEstimatedCredits)
assert.equal(approvedState.generationRequest.status, 'completed')
assert.equal((approvedState.generationRequest.metadata as Record<string, unknown>).noRealProviderCall, true)
assert.equal(approvedState.generatedAsset.storageProvider, 'local_mock')
assert.match(approvedState.generatedAsset.storagePath ?? '', /^mock:\/\//)
assert.equal(approvedState.renderJob.status, 'completed')
assert.equal((approvedState.renderJob.renderSettings as Record<string, unknown>).noFfmpegOrRemotionExecution, true)
assert.equal(approvedState.previewRender.status, 'ready')
assert.equal(approvedState.previewRender.storageProvider, 'local_mock')
assert.match(approvedState.previewRender.storagePath ?? '', /^mock:\/\//)
assert.doesNotMatch(approvedState.previewRender.safePreviewUrl ?? '', /^https?:\/\//)
assert.equal(approvedState.qaReport.status, 'passed')
assert.equal((approvedState.qaReport.qaPayload as Record<string, unknown>).noRealRenderingChecked, true)
assert.equal(approvedState.previewReady, true)
assert.equal(db.jobBatches.length, 1)
assert.equal(db.jobs.length, 7)
assert.equal(db.jobs.every((job) => job.status === 'completed'), true)
assert.equal(db.jobDependencies.length, 6)
assert.equal(db.workerLeases.length, 0, 'Approved-preview acceptance must not claim real worker leases.')
assert.equal(db.generationRequests.length, 1)
assert.equal(db.generatedAssets.length, 1)
assert.equal(db.renderJobs.length, 1)
assert.equal(db.renders.length, 1)
assert.equal(db.previewReviews.length, 1)
assert.equal(db.qaReports.length, 1)
assert.equal(db.revisionRequests.length, 1)
assert.equal(db.exports.length, 1)
const draftExport = db.exports[0]
assert.ok(draftExport, 'Approved-preview acceptance should create a draft export placeholder.')
const draftExportSettings = draftExport.exportSettings
assert.ok(draftExportSettings, 'Approved-preview draft export should keep review-gated settings.')
assert.equal(draftExport.status, 'draft')
assert.match(draftExport.storagePath ?? '', /^mock:\/\//)
assert.equal(draftExportSettings.requiresPreviewApproval, true)
assert.equal(draftExportSettings.requiresQaReadiness, true)
assert.equal(db.projects[0]?.status, 'preview_ready')

const previewCard = db.inlineChatCards.find((card) => card.cardType === 'preview_ready')
assert.ok(previewCard, 'Approved-preview acceptance should create a preview-ready chat card.')
assert.equal(previewCard.status, 'completed')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-real-video-approved-preview-acceptance'],
  'tsx server/smoke/internal-testing-real-video-approved-preview-acceptance-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['test:internal-testing:real-video-approved-preview-acceptance'],
  'node scripts/dev/internal-testing-real-video-approved-preview-acceptance.mjs',
)

const wrapper = read('scripts/dev/internal-testing-real-video-approved-preview-acceptance.mjs')
for (const phrase of [
  'test:internal-testing:real-video-prompt-plan-acceptance',
  'smoke:internal-testing-real-video-approved-preview-acceptance',
  'mock credit approval/reservation',
  'mock work graph',
  'private preview QA',
  'No real provider calls, live Qwen calls, real tool execution, real media processing, real rendering/export, Supabase writes, GCS writes, public delivery, external beta, or production.',
]) {
  assert.match(wrapper, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Approved-preview wrapper should mention ${phrase}`)
}
assert.doesNotMatch(wrapper, /supabase db|docker build|gcloud|STRIPE_SECRET|worker:run|tools:check|smoke:prod-real|apt-get|ffmpeg|ffprobe|MP4Box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-real-video-approved-preview-acceptance',
  fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
  sizeBytes: fixtureStat.size,
  uploadedFixtureFileName,
  prompt,
  sourceClipCount: approvedState.sourceAssets.length,
  editPlanStatus: approvedState.editPlan.status,
  creditEstimateStatus: approvedState.creditEstimate.status,
  reservedCredits: approvedState.creditReservation.reservedCredits,
  jobCount: db.jobs.length,
  generationRequestStatus: approvedState.generationRequest.status,
  renderStatus: approvedState.previewRender.status,
  qaStatus: approvedState.qaReport.status,
  exportPlaceholderStatus: draftExport.status,
  previewReady: approvedState.previewReady,
  productReady: false,
  blockedScope: {
    realProviderCalls: false,
    liveQwenCalls: false,
    realToolExecution: false,
    realMediaProcessing: false,
    realRendering: false,
    finalExport: false,
    supabaseWrites: false,
    gcsWrites: false,
    publicDelivery: false,
    externalBeta: false,
    paidProduction: false,
  },
}, null, 2))
