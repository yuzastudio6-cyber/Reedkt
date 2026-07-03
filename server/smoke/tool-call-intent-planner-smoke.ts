import assert from 'node:assert/strict'

import { getChatPlanningCards } from '../../src/lib/chat-planning-flow'
import { createMockEditPlan } from '../../src/lib/mock-planner'
import { validateMockEditPlan } from '../../src/lib/planner-validation'
import { runPlannerRegression } from '../../src/lib/planner-regression'
import {
  createToolCallIntentPlan,
  defaultToolForCapability,
} from '../../src/lib/tool-call-intent-planner'
import { defaultChatPlannerInput } from '../../src/components/editor/chatNativeData'

const input = {
  ...defaultChatPlannerInput,
  aspectRatioConfirmed: true,
  cleanupPreference: 'balanced_cleanup' as const,
  cleanupPreferenceConfirmed: true,
  sourceOrderConfirmed: true,
}

const plan = createMockEditPlan(input)
const toolCallIntentPlan = plan.toolCallIntentPlan

assert.ok(toolCallIntentPlan, 'mock edit plan should include a tool-call intent plan')
assert.equal(toolCallIntentPlan?.planningOnly, true, 'tool-call intent plan must be planning-only')
assert.equal(toolCallIntentPlan?.approvalRequiredBeforeExecution, true, 'tool-call intent plan must require approval before execution')
assert.ok((toolCallIntentPlan?.intents.length ?? 0) >= 6, 'tool-call intent plan should include baseline and strategy-derived intents')
assert.equal(toolCallIntentPlan?.creditGateSummary.executionAllowed, false, 'planning-only intent plan must not allow execution by default')
assert.ok(
  toolCallIntentPlan?.creditGateSummary.userFacingSummary.includes('Approval, estimate, and reservation'),
  'tool-call plan should include user-facing approval/estimate/reservation summary',
)

const requiredToolIds = ['ffmpeg', 'opencv', 'opencolorio', 'remotion', 'faster_whisper']
for (const toolId of requiredToolIds) {
  assert.ok(toolCallIntentPlan?.intents.some((intent) => intent.toolId === toolId), `tool-call intents should include ${toolId}`)
}

for (const intent of toolCallIntentPlan?.intents ?? []) {
  assert.ok(intent.toolId.length > 0, `${intent.id} should include a tool ID`)
  assert.ok(intent.capabilityId.length > 0, `${intent.id} should include a capability`)
  assert.ok(intent.reason.length > 20, `${intent.id} should explain why the tool may be used`)
  assert.ok(intent.inputArtifactDependency.description.length > 20, `${intent.id} should include an input artifact dependency`)
  assert.ok(intent.expectedOutputArtifact.description.length > 20, `${intent.id} should include an expected output artifact`)
  assert.ok(Number.isInteger(intent.costEstimate.credits), `${intent.id} should include an integer credit estimate`)
  assert.ok(Number.isInteger(intent.costEstimate.expectedCredits), `${intent.id} should include an expected credit estimate`)
  assert.ok(Number.isInteger(intent.costEstimate.highCredits), `${intent.id} should include a high credit estimate`)
  assert.ok(intent.costEstimate.basis.length > 20, `${intent.id} should include a cost basis`)
  assert.equal(intent.creditGate.executionBlocked, true, `${intent.id} should be blocked until snapshot/estimate/reservation exist`)
  assert.ok(intent.creditGate.blockerReasons.length >= 3, `${intent.id} should list missing credit-gate prerequisites`)
  assert.ok(intent.fallback.strategy.length > 20, `${intent.id} should include a fallback strategy`)
  assert.equal(intent.approvalRequiredBeforeExecution, true, `${intent.id} should require approval before execution`)
  assert.equal(intent.frontendExecutionAllowed, false, `${intent.id} should forbid frontend execution`)
}

const opencolorio = toolCallIntentPlan?.intents.find((intent) => intent.toolId === 'opencolorio')
assert.equal(opencolorio?.readinessState, 'ready_for_backend_execution', 'OpenColorIO should be a backend-gated candidate')
assert.equal(opencolorio?.toolLabel, 'OpenColorIO', 'OpenColorIO should use professional display casing')

const ffmpeg = toolCallIntentPlan?.intents.find((intent) => intent.toolId === 'ffmpeg')
assert.equal(ffmpeg?.toolLabel, 'FFmpeg', 'FFmpeg should use professional display casing')

const nativePlan = createToolCallIntentPlan({
  includeBaselineIntents: false,
  requestedCapabilities: [
    'streamer_render_pipeline_support',
    'mkvtoolnix_container_validation',
    'gpac_mp4box_packaging_validation',
  ],
})

assert.equal(nativePlan.intents.length, 3, 'requested Track A capabilities should produce three explicit tool-call intents')
assert.deepEqual(
  nativePlan.intents.map((intent) => intent.capabilityId),
  ['streamer_render_pipeline_support', 'mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation'],
  'requested Track A capabilities should preserve exact agent-facing IDs',
)
assert.deepEqual(
  nativePlan.intents.map((intent) => intent.toolId),
  ['gstreamer', 'mkvtoolnix', 'gpac_mp4box'],
  'requested Track A capabilities should route to the expected backend tool IDs',
)
assert.ok(
  nativePlan.intents.every((intent) => intent.lane === 'track_a_native_container'),
  'requested Track A capabilities should stay in the Track A native-container lane',
)
assert.ok(
  nativePlan.intents.every((intent) => intent.readinessState === 'ready_for_backend_execution'),
  'requested Track A capabilities should be backend-gated ready',
)
assert.ok(
  nativePlan.intents.every((intent) => intent.frontendExecutionAllowed === false),
  'requested Track A capabilities must never be frontend-executable',
)
assert.equal(
  defaultToolForCapability('gpac_mp4box_packaging_validation'),
  'gpac_mp4box',
  'MP4 packaging validation should have a default backend tool route',
)
assert.ok(
  !/GStreamer|MKVToolNix|GPAC|MP4Box/.test(nativePlan.summary),
  'guided native capability summaries should avoid raw tool names',
)

const transcript = toolCallIntentPlan?.intents.find((intent) => intent.toolId === 'faster_whisper')
assert.equal(transcript?.readinessState, 'blocked_by_owner_approval', 'faster-whisper should preserve its owner/model approval blocker')

const validationReport = validateMockEditPlan({ input, plan, scenarioId: 'tool-call-intent-smoke' })
const regressionReport = runPlannerRegression()
const cards = getChatPlanningCards({
  approved: false,
  aspectRatioConfirmed: true,
  clipsAttached: true,
  clipCount: input.clips.length,
  editLevelConfirmed: true,
  intentApproved: false,
  plan,
  previewReady: false,
  regressionReport,
  selectedScenarioId: 'tool-call-intent-smoke',
  sourceOrderConfirmed: true,
  validationReport,
  visualPreferenceConfirmed: true,
})

const card = cards.find((item) => item.id === 'tool_call_intents')
assert.ok(card, 'chat planning cards should include tool_call_intents')
assert.equal(card?.label, 'Planned edit work', 'tool-call intent card should use edit-activity language in guided chat')
assert.equal(card?.phase, 'credits_approval', 'tool-call intent card should appear before approval/credits')
assert.equal(card?.requiredBeforeApproval, false, 'tool-call intent card should inform approval without blocking setup')
assert.ok(card?.summary.includes('planned edit activit'), 'tool-call intent card should summarize planned edit activities')

console.log(JSON.stringify({
  ok: true,
  intents: toolCallIntentPlan?.intents.length,
  backendCandidates: toolCallIntentPlan?.readinessCounts.ready_for_backend_execution,
  dryRunOnly: toolCallIntentPlan?.readinessCounts.dry_run_only,
  ownerGated: toolCallIntentPlan?.readinessCounts.blocked_by_owner_approval,
  totalEstimatedCredits: toolCallIntentPlan?.totalEstimatedCredits,
  highEstimatedCredits: toolCallIntentPlan?.creditGateSummary.totalHighCredits,
  cardStatus: card?.status,
}, null, 2))
