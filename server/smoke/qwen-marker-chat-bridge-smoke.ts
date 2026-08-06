import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createQwenRuntimeSafetyFlags,
  PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS,
  runQwenMarkerChatBridge,
  validateQwenMarkerChatRuntimeRequest,
} from '../../src/backend'
import { REEDITPRO_QWEN_MAIN_BRAIN_LABEL } from '../../src/types'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { createMockProjectEditBriefRepository } from '../../src/backend/repositories/mock-project-edit-brief-repository'

const repoRoot = process.cwd()

const db = createMockDatabase()
const repository = createMockProjectEditBriefRepository({
  db,
  workspaceId: 'mock-workspace',
  projectId: 'mock-project-edit-chat-foundation',
  userId: 'mock-user',
})
const marker = db.projectEditBriefMarkers.find((candidate) => candidate.status !== 'archived')
assert.ok(marker, 'Seeded marker should exist for Qwen Marker Chat bridge smoke.')

const request = {
  source: 'runtime_smoke' as const,
  projectId: marker.projectId,
  editSessionId: marker.editSessionId,
  briefId: marker.briefId,
  markerId: marker.id,
  messageText: 'Add adapted city B-roll here, confirm it, and do not copy the source exactly.',
}

const validation = validateQwenMarkerChatRuntimeRequest({
  id: 'qwen-marker-chat-smoke-request',
  runtimeMode: 'qwen_beta',
  createdAt: new Date().toISOString(),
  ...request,
})
assert.equal(validation.ok, true)

const validStructuredResponse = {
  assistantMessage: 'Confirmed: add adapted city B-roll at this marker and avoid exact source recreation.',
  action: 'add_broll',
  status: 'confirmed',
  visualBehavior: 'insert_broll',
  audioBehavior: 'keep_original_audio',
  captionBehavior: 'unspecified',
  assetRequirement: 'Use metadata-only attachment labels in the mock flow.',
  confidence: 'high',
  blockingNeeds: [],
  plannerHints: ['Prepare a B-roll hint after QA; do not execute a planner.'],
  doNotCopyNotes: ['Do not copy exact shots, timing, or source footage.'],
  safetyWarnings: [],
}

const fakeSecretClient = {
  async accessSecretVersion(input: { name: string }) {
    assert.equal(input.name, 'projects/mock-project/secrets/qwen-reasoning-api-key/versions/7')
    return [{ payload: { data: Buffer.from('mock-qwen-secret-for-bridge') } }]
  },
}
const fakeProviderClient = {
  async sendStructuredMarkerChatRequest() {
    return {
      ...createQwenRuntimeSafetyFlags({ providerCallMade: true, modelCallMade: true, qwenCallMade: true }),
      status: 'completed' as const,
      httpStatus: 200,
      parsedJson: {
        ...validStructuredResponse,
        usage: { prompt_tokens: 30, completion_tokens: 18, total_tokens: 48 },
      },
      redactedRawPreview: '{"assistantMessage":"Confirmed"}',
      warnings: ['Fake provider client returned a structured smoke response.'],
    }
  },
}

const betaEnv = {
  REEDITPRO_QWEN_RUNTIME_MODE: 'beta_enabled',
  GOOGLE_CLOUD_PROJECT_ID: 'mock-project',
  QWEN_REASONING_API_KEY_SECRET: 'projects/mock-project/secrets/qwen-reasoning-api-key/versions/7',
  QWEN_REASONING_BASE_URL: 'https://qwen.example.invalid',
  QWEN_REASONING_MODEL_ID: 'qwen-3.7-marker-chat',
}

const betaResult = await runQwenMarkerChatBridge({
  repository,
  request,
  env: betaEnv,
  providerClient: fakeProviderClient,
  secretClient: fakeSecretClient,
})
assert.equal(betaResult.ok, true)
assert.equal(betaResult.status, 'qwen_beta_completed')
assert.equal(betaResult.qwenCallMade, true)
assert.equal(betaResult.secretValuePrinted, false)
assert.equal(betaResult.authorizationHeaderLogged, false)
assert.equal(betaResult.editPlanCreated, false)
assert.equal(betaResult.plannerExecuted, false)
assert.equal(betaResult.creditReservedOrSpent, false)
assert.ok(betaResult.promptPackage.systemPrompt.includes(REEDITPRO_QWEN_MAIN_BRAIN_LABEL), 'Qwen prompt should identify Qwen 3.7 Max as the Marker Chat reasoning brain.')
assert.equal(betaResult.intent?.action, 'add_broll')
assert.equal(betaResult.confirmation?.confirmedByUser, false)
assert.equal(betaResult.updatedMarker?.status, 'confirmed')

const fallbackResult = await runQwenMarkerChatBridge({
  repository,
  request: {
    ...request,
    markerId: marker.id,
    messageText: 'Please make this clearer with B-roll.',
  },
  env: {},
})
assert.equal(fallbackResult.ok, true)
assert.equal(fallbackResult.status, 'fallback_completed')
assert.equal(fallbackResult.qwenCallMade, false)
assert.equal(fallbackResult.providerCallMade, false)
assert.equal(fallbackResult.secretValuePrinted, false)
assert.equal(fallbackResult.intent?.mockOnly, true)

const routeHandler = PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS['project.editBrief.markerMessages.append']
assert.ok(routeHandler, 'Marker message append route handler should exist.')
const routeResponse = await routeHandler({
  routeId: 'project.editBrief.markerMessages.append',
  body: {
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    text: 'Use adapted B-roll via backend beta route request.',
    role: 'user',
    runtimeMode: 'qwen_beta',
  },
  context: {
    requestId: 'qwen-marker-chat-route-smoke',
    mode: 'mock',
    workspaceId: 'mock-workspace',
    projectId: marker.projectId,
    userId: 'mock-user',
    mockOnly: true,
    mockDatabase: db,
  },
})
assert.equal(routeResponse.ok, true)
assert.equal(routeResponse.mockOnly, true)
assert.equal(routeResponse.providerCallMade, false)
const routeData = routeResponse.data as Record<string, unknown>
assert.ok(routeData.qwenRuntime, 'Route beta response should include qwenRuntime diagnostics.')
assert.ok(routeData.safety, 'Route response should include route safety flags.')

for (const doc of [
  'docs/qwen-marker-chat-runtime-bridge.md',
  'docs/qwen-runtime-fallback-and-redaction.md',
  'docs/qwen-runtime-beta-boundary.md',
]) {
  const path = join(repoRoot, doc)
  assert.ok(existsSync(path), `${doc} should exist.`)
  const text = readFileSync(path, 'utf8')
  assert.match(text, /Marker Chat/i)
  assert.match(text, /fallback/i)
  assert.match(text, /no render/i)
}

const migrationCount = readdirSync(join(repoRoot, 'supabase/migrations')).filter((file) => file.endsWith('.sql')).length
assert.equal(migrationCount, 24, 'Supabase migration count must remain at the approved PR 637 reconciled baseline.')

console.log(JSON.stringify({
  smoke: 'qwen-marker-chat-bridge',
  ok: true,
  betaStatus: betaResult.status,
  fallbackStatus: fallbackResult.status,
  routeStatus: (routeData.qwenRuntime as { status?: string }).status,
  migrationCount,
  flags: {
    renderJobCreated: false,
    workerJobCreated: false,
    creditReservedOrSpent: false,
    supabaseCommandRun: false,
  },
}, null, 2))
