import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createDefaultMockProjectEditBriefApiClient,
} from '../../src/lib/project-edit-brief-api-client'
import {
  loadProjectEditBriefMarkerChatPanelForUI,
  sendProjectEditBriefMarkerChatMessageViaApi,
} from '../../src/lib/project-edit-brief-marker-chat-ui-adapter'
import {
  PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  extractProjectEditBriefMarkerIntentFromMessage,
} from '../../src/lib/project-edit-brief-marker-chat-rules'
import { createMockProjectEditBriefFixtureBundle } from '../../src/lib/mock-project-edit-briefs'
import {
  listMockProjectEditBriefMarkerChatScenarios,
  runMockProjectEditBriefMarkerChatOrchestrator,
  validateProjectEditBriefMarkerChatRequestForBackend,
  createProjectEditBriefMarkerChatReadinessSummary,
} from '../../src/backend'
import { REEDITPRO_QWEN_MAIN_BRAIN_LABEL } from '../../src/types'

const root = process.cwd()
const projectId = 'mock-project-edit-chat-foundation'
const markerId = 'marker-calm-soundtrack'

function assertFalseFlags(value: unknown, label: string) {
  const record = value as Record<string, unknown>
  for (const key of Object.keys(PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS)) {
    assert.equal(record[key], false, `${label}.${key} must remain false`)
  }
}

function assertDoc(path: string) {
  const fullPath = join(root, path)
  assert.ok(existsSync(fullPath), `${path} should exist`)
  const content = readFileSync(fullPath, 'utf8')
  for (const phrase of [
    'Marker Chat',
    'mock/local',
    'no Qwen',
    'no provider',
    'no Supabase',
  ]) {
    assert.ok(content.includes(phrase), `${path} should include ${phrase}`)
  }
}

const scenarios = listMockProjectEditBriefMarkerChatScenarios()
assert.ok(scenarios.length >= 64, 'Marker Chat scenarios should cover at least 64 cases')
assert.ok(scenarios.some((scenario) => scenario.expectedResponseKind === 'mock_confirmation'), 'confirmation scenarios should exist')
assert.ok(scenarios.some((scenario) => scenario.expectedResponseKind === 'mock_clarifying_question'), 'clarification scenarios should exist')
assert.ok(scenarios.some((scenario) => scenario.expectedResponseKind === 'mock_suggestions'), 'suggestion scenarios should exist')
assert.ok(scenarios.some((scenario) => scenario.expectedResponseKind === 'none'), 'AI-off scenarios should exist')

const bundle = createMockProjectEditBriefFixtureBundle()
const marker = bundle.markers.find((candidate) => candidate.id === markerId) ?? bundle.markers[0]
const brollExtraction = extractProjectEditBriefMarkerIntentFromMessage({
  marker,
  messageText: 'Use this attached B-roll clip here and keep original audio',
  userMessageId: 'smoke-user-message-1',
})
assert.equal(brollExtraction.intentDraft?.action, 'add_broll')
assert.equal(brollExtraction.intentDraft?.visualBehavior, 'insert_broll')
assert.equal(brollExtraction.intentDraft?.audioBehavior, 'keep_original_audio')
assert.equal(brollExtraction.responseKind, 'mock_confirmation')
assertFalseFlags(brollExtraction, 'brollExtraction')

const needsAssetExtraction = extractProjectEditBriefMarkerIntentFromMessage({
  marker,
  messageText: 'Add city B-roll here',
})
assert.equal(needsAssetExtraction.extractionStatus, 'processed_needs_asset')
assert.equal(needsAssetExtraction.markerStatusSuggestion, 'needs_asset')

const validation = validateProjectEditBriefMarkerChatRequestForBackend({
  projectId,
  editSessionId: marker.editSessionId,
  briefId: marker.briefId,
  markerId: marker.id,
  messageText: 'Add captions here',
  aiMode: marker.aiMode,
  mockOnly: true,
})
assert.equal(validation.ok, true)
assertFalseFlags(validation, 'validation')

const orchestratorResult = runMockProjectEditBriefMarkerChatOrchestrator({
  markerId,
  messageText: 'Use this attached B-roll clip here and keep original audio',
})
assert.equal(orchestratorResult.nextStep, 'RP-EDITBRIEF-08 — Marker Attachments: B-roll, Image, Music, SFX')
assert.equal(orchestratorResult.validation.ok, true)
assert.ok(orchestratorResult.intent)
assertFalseFlags(orchestratorResult, 'orchestratorResult')

const client = createDefaultMockProjectEditBriefApiClient({
  projectId,
  preserveMockSession: true,
})
const firstSend = await sendProjectEditBriefMarkerChatMessageViaApi({
  markerId,
  messageText: 'Use this attached B-roll clip here and keep original audio',
}, client)
assert.ok(firstSend?.ok, 'confirm-only send should succeed')
assert.ok(firstSend?.userMessage, 'user message should save')
assert.ok(firstSend?.assistantMessage, 'assistant confirmation should save')
assert.ok(firstSend?.intent, 'intent should save')
assert.equal(firstSend.intent?.visualBehavior, 'insert_broll')
assert.equal(firstSend.intent?.audioBehavior, 'keep_original_audio')
assert.ok(firstSend?.confirmation, 'confirmation should save')
assertFalseFlags(firstSend, 'firstSend')

await client.markers.update({ markerId, patch: { aiMode: 'ask_clarifying_questions' } })
const clarifySend = await sendProjectEditBriefMarkerChatMessageViaApi({
  markerId,
  messageText: 'Make this better',
}, client)
assert.ok(clarifySend?.assistantMessage?.text.includes('What should this marker focus on'), 'clarifying response should be deterministic')
assert.equal(clarifySend?.extraction.extractionStatus, 'processed_needs_clarification')

await client.markers.update({ markerId, patch: { aiMode: 'off' } })
const aiOffSend = await sendProjectEditBriefMarkerChatMessageViaApi({
  markerId,
  messageText: 'Add captions here',
}, client)
assert.ok(aiOffSend?.userMessage, 'AI-off should still save user message')
assert.equal(aiOffSend?.assistantMessage, undefined)
assert.ok(aiOffSend?.intent, 'AI-off should still save extracted intent')

const panel = await loadProjectEditBriefMarkerChatPanelForUI(markerId, client)
assert.ok(panel, 'panel should load')
assert.ok(panel.messages.length >= 3, 'panel should include marker-scoped messages')
assert.ok(panel.intent, 'panel should include latest intent')
assert.ok(panel.boundarySummary.includes(REEDITPRO_QWEN_MAIN_BRAIN_LABEL), 'panel should identify Qwen 3.7 Max as the backend reasoning brain')
assertFalseFlags(panel, 'panel')
assert.ok(createProjectEditBriefMarkerChatReadinessSummary().includes('mock/local'))

for (const path of [
  'docs/project-edit-brief-marker-chat-system.md',
  'docs/project-edit-brief-marker-intent-capture.md',
  'docs/project-edit-brief-marker-ai-mode-policy.md',
  'docs/project-edit-brief-marker-chat-ui.md',
  'docs/project-edit-brief-marker-chat-boundary.md',
  'docs/project-edit-brief-marker-chat-next-attachments.md',
]) {
  assertDoc(path)
}

for (const path of [
  'src/lib/project-edit-brief-marker-chat-ui-adapter.ts',
  'src/components/projects/brief/ProjectEditBriefMarkerChatPanel.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerChatInput.tsx',
]) {
  const content = readFileSync(join(root, path), 'utf8')
  assert.equal(content.includes('src/backend'), false, `${path} must not import backend modules`)
  assert.equal(content.includes('MockDatabase'), false, `${path} must not import MockDatabase`)
  assert.equal(content.includes('supabase'), false, `${path} must not import Supabase`)
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-marker-chat'], 'tsx server/smoke/project-edit-brief-marker-chat-smoke.ts')

const migrationCount = readdirSync(join(root, 'supabase/migrations')).filter((name) => !name.startsWith('.')).length
assert.equal(migrationCount, 24, 'Supabase migration count must remain 24')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-marker-chat',
  status: 'passed',
  scenarios: scenarios.length,
  migrationCount,
  boundaries: {
    providerCallMade: false,
    modelCallMade: false,
    supabaseCommandRun: false,
    migrationCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
  },
}, null, 2))
