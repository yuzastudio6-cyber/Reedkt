import assert from 'node:assert/strict'

import {
  buildChatToolActivityCards,
  findRawToolNamesInChatToolActivityText,
} from '../../src/lib/chat-tool-activity-ux'
import { getChatPlanningCards } from '../../src/lib/chat-planning-flow'
import { createMockEditPlan } from '../../src/lib/mock-planner'
import { runPlannerRegression } from '../../src/lib/planner-regression'
import { validateMockEditPlan } from '../../src/lib/planner-validation'
import { defaultChatPlannerInput } from '../../src/components/editor/chatNativeData'
import type { ChatToolActivityCardKind } from '../../src/lib/chat-tool-activity-ux'

const input = {
  ...defaultChatPlannerInput,
  aspectRatioConfirmed: true,
  cleanupPreference: 'balanced_cleanup' as const,
  cleanupPreferenceConfirmed: true,
  sourceOrderConfirmed: true,
}

const plan = createMockEditPlan(input)
const guidedCards = buildChatToolActivityCards({
  displayMode: 'guided',
  plan,
})
const expectedKinds: ChatToolActivityCardKind[] = [
  'tool_plan',
  'tool_readiness',
  'approval_cost',
  'progress',
  'result_artifact',
  'blocker_next_action',
  'qa_summary',
]

assert.deepEqual(
  guidedCards.map((card) => card.kind),
  expectedKinds,
  'guided chat tool UX should expose the seven required activity cards in order',
)
assert.deepEqual(
  findRawToolNamesInChatToolActivityText(guidedCards),
  [],
  'guided chat activity cards must not expose raw execution names',
)

const planCard = guidedCards.find((card) => card.kind === 'tool_plan')
assert.ok(planCard, 'guided cards should include planned edit work')
assert.equal(planCard?.title, 'Planned edit work', 'plan card should describe edit work, not raw tool names')
assert.ok((planCard?.items.length ?? 0) > 0, 'plan card should summarize planned edit activities')

const readinessCard = guidedCards.find((card) => card.kind === 'tool_readiness')
assert.ok(readinessCard, 'guided cards should include readiness')
assert.ok(
  readinessCard?.items.some((item) => item.label === 'Backend-only work'),
  'readiness card should explain browser/backend boundary',
)

const approvalCard = guidedCards.find((card) => card.kind === 'approval_cost')
assert.ok(approvalCard, 'guided cards should include approval/cost')
assert.equal(approvalCard?.status, 'needs_approval', 'approval card should be gated before approval IDs exist')
assert.ok(approvalCard?.summary.includes('credits'), 'approval card should include credit range copy')

const blockerCard = guidedCards.find((card) => card.kind === 'blocker_next_action')
assert.ok(blockerCard?.nextAction, 'blocker card should include the next action')

const qaCard = guidedCards.find((card) => card.kind === 'qa_summary')
assert.ok(qaCard, 'guided cards should include QA summary')
assert.ok((qaCard?.items.length ?? 0) >= 3, 'QA card should summarize intent, timing, and private result checks')

const developerCards = buildChatToolActivityCards({
  displayMode: 'developer',
  plan,
})
const developerDetails = developerCards.flatMap((card) => card.developerDetails ?? [])
assert.ok(developerDetails.length > 0, 'developer mode should expose technical details')
assert.ok(
  developerDetails.some((detail) => detail.values.includes('ffmpeg')),
  'developer mode should retain raw execution identifiers for audit/debug review',
)

const resultCards = buildChatToolActivityCards({
  displayMode: 'guided',
  outputArtifacts: [{
    artifactType: 'ocr_report_json',
    isPrivate: true,
    sourceOfTruth: true,
    storageBucketPurpose: 'analysis_artifacts',
    storageObjectPath: 'workspaces/workspace-chat/projects/project-chat/analysis/text-safe-zone.json',
  }],
  plan,
  previewReady: true,
  progressStarted: true,
})
const resultCard = resultCards.find((card) => card.kind === 'result_artifact')
assert.equal(resultCard?.status, 'complete', 'private result card should complete when safe artifacts are present')
assert.deepEqual(
  findRawToolNamesInChatToolActivityText(resultCards),
  [],
  'guided result cards must still hide raw execution names',
)

const unsafeCards = buildChatToolActivityCards({
  displayMode: 'guided',
  outputArtifacts: [{
    artifactType: 'preview_video',
    isPrivate: false,
    sourceOfTruth: false,
    storageBucketPurpose: 'previews',
    storageObjectPath: 'https://storage.example.com/public-preview.mp4?X-Goog-Signature=abc',
  }],
  plan,
})
assert.equal(
  unsafeCards.find((card) => card.kind === 'result_artifact')?.status,
  'blocked',
  'result card should block public/signed URL artifact references',
)

const validationReport = validateMockEditPlan({ input, plan, scenarioId: 'frontend-chat-tool-ux-smoke' })
const cards = getChatPlanningCards({
  approved: false,
  aspectRatioConfirmed: true,
  clipsAttached: true,
  clipCount: input.clips.length,
  editLevelConfirmed: true,
  intentApproved: false,
  plan,
  previewReady: false,
  regressionReport: runPlannerRegression(),
  selectedScenarioId: 'frontend-chat-tool-ux-smoke',
  sourceOrderConfirmed: true,
  validationReport,
  visualPreferenceConfirmed: true,
})
const descriptor = cards.find((card) => card.id === 'tool_call_intents')
assert.equal(descriptor?.label, 'Planned edit work', 'planning descriptor should use edit-work language')
assert.ok(
  descriptor?.summary.includes('planned edit activit'),
  'planning descriptor should summarize edit activities instead of tool calls',
)

console.log(JSON.stringify({
  ok: true,
  cardKinds: guidedCards.map((card) => card.kind),
  guidedRawNameLeaks: findRawToolNamesInChatToolActivityText(guidedCards),
  developerDetails: developerDetails.map((detail) => detail.label),
  resultStatus: resultCard?.status,
  descriptorLabel: descriptor?.label,
}, null, 2))
