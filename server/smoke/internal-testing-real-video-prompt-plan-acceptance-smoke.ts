import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { createMockDatabase, resetMockIds } from '../../src/backend/mock/mock-database'

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

assert.equal(existsSync(fixturePath), true, `Real-video prompt-plan fixture is missing: ${fixturePath}`)
const fixtureStat = statSync(fixturePath)
assert.equal(fixtureStat.isFile(), true, 'Real-video prompt-plan fixture must be a file.')
assert.ok(fixtureStat.size > 0, 'Real-video prompt-plan fixture must be non-empty.')
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Real-video prompt-plan fixture must be an MP4.')

resetMockIds()
const db = createMockDatabase()
const result = runChatNativeEditPlanningFlow({
  projectTitle: 'Internal testing real-video prompt plan acceptance',
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
}, db)

if (!result.ok) {
  throw new Error(result.error.message)
}

const state = result.data
assert.equal(state.sourceAssets.length, 1, 'Planner should receive exactly the accepted real-video source metadata.')
assert.equal(state.sourceAssets[0]?.fileName, uploadedFixtureFileName)
assert.equal(db.sourceClipSequenceItems.length, 1, 'Source order should contain exactly one uploaded source item.')
assert.equal(state.intentAnalysis.userGoalSummary, prompt)
assert.equal(state.intentAnalysis.explicitInstructions[0], prompt)
assert.equal(state.editPlan.status, 'awaiting_approval')
assert.equal(state.editPlan.approvalStatus, 'pending')
assert.equal(state.editPlan.approvalRequiredBeforeGeneration, true)
assert.equal((state.editPlan.metadata as Record<string, unknown>).generationAllowed, false)
assert.equal(state.creditEstimate.status, 'shown_to_user')
assert.ok(state.creditEstimate.totalEstimatedCredits > 0)
assert.ok((state.creditEstimate.lineItems?.length ?? 0) > 0)
assert.equal(state.nextRequiredAction, 'approve_plan_and_credits')
assert.equal(db.inlineChatCards.some((card) => card.cardType === 'edit_plan'), true)
assert.equal(db.inlineChatCards.some((card) => card.cardType === 'credit_estimate'), true)
assert.equal(db.creditApprovals.length, 0, 'Prompt-to-plan acceptance must not approve credits.')
assert.equal(db.creditReservations.length, 0, 'Prompt-to-plan acceptance must not reserve credits.')
assert.equal(db.jobs.length, 0, 'Prompt-to-plan acceptance must not create worker jobs.')
assert.equal(db.workerLeases.length, 0, 'Prompt-to-plan acceptance must not claim worker leases.')
assert.equal(db.generationRequests.length, 0, 'Prompt-to-plan acceptance must not create generation requests.')
assert.equal(db.generatedAssets.length, 0, 'Prompt-to-plan acceptance must not create generated assets.')
assert.equal(db.renderJobs.length, 0, 'Prompt-to-plan acceptance must not create render jobs.')
assert.equal(db.renders.length, 0, 'Prompt-to-plan acceptance must not create renders.')
assert.equal(db.exports.length, 0, 'Prompt-to-plan acceptance must not create exports.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-real-video-prompt-plan-acceptance'],
  'tsx server/smoke/internal-testing-real-video-prompt-plan-acceptance-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['test:internal-testing:real-video-prompt-plan-acceptance'],
  'node scripts/dev/internal-testing-real-video-prompt-plan-acceptance.mjs',
)

const wrapper = read('scripts/dev/internal-testing-real-video-prompt-plan-acceptance.mjs')
for (const phrase of [
  'test:internal-testing:real-video-upload-acceptance',
  'smoke:internal-testing-real-video-prompt-plan-acceptance',
  'mock-safe edit-plan and credit-estimate preview',
  'No provider calls, live Qwen calls, worker execution, render/export, Supabase writes, GCS writes, public delivery, beta, or production.',
]) {
  assert.match(wrapper, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Prompt-plan wrapper should mention ${phrase}`)
}
assert.doesNotMatch(wrapper, /supabase db|docker build|gcloud|STRIPE_SECRET|worker:run|tools:check|smoke:prod-real|apt-get|ffmpeg|ffprobe|MP4Box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-real-video-prompt-plan-acceptance',
  fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
  sizeBytes: fixtureStat.size,
  uploadedFixtureFileName,
  prompt,
  sourceClipCount: state.sourceAssets.length,
  editPlanStatus: state.editPlan.status,
  creditEstimateStatus: state.creditEstimate.status,
  totalEstimatedCredits: state.creditEstimate.totalEstimatedCredits,
  nextRequiredAction: state.nextRequiredAction,
  productReady: false,
  blockedScope: {
    providerCalls: false,
    liveQwenCalls: false,
    workerExecution: false,
    toolExecution: false,
    mediaProcessing: false,
    renderExport: false,
    creditApproval: false,
    creditReservation: false,
    supabaseWrites: false,
    gcsWrites: false,
    publicDelivery: false,
    externalBeta: false,
    paidProduction: false,
  },
}, null, 2))
