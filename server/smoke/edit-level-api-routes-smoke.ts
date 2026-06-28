import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import type { EditLevelRepositoryResult } from '../../src/types'
import { createMockEditLevelRecommendationInput } from '../../src/lib/edit-level-recommendation-fixtures'
import { EDIT_LEVEL_API_ROUTES, listEditLevelApiRouteIds } from '../../src/backend/api/edit-level-api-route-registry'
import { createEditLevelApiRouteSummary } from '../../src/backend/api/edit-level-route-summary-service'
import { resetMockEditLevelRouteState } from '../../src/backend/api/edit-level-mock-route-handlers'
import { createMockApiRuntimeContext, handleMockApiRequest } from '../../src/backend/api/mock-api-router'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'
import { listMockEditLevelApiRouteScenarios } from '../../src/backend/api/mock-edit-level-api-route-scenarios'
import { runMockEditLevelApiRouteFlow } from '../../src/backend/orchestrators/mock-edit-level-api-route-orchestrator'

const requiredDocs = [
  'docs/edit-level-api-routes.md',
  'docs/edit-level-repository-layer.md',
  'docs/edit-level-api-client.md',
]

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

async function callRoute<TData>(routeId: string, body?: unknown) {
  const response = await handleMockApiRequest<unknown, EditLevelRepositoryResult<TData>>({
    routeId,
    body,
    context: createMockApiRuntimeContext({
      projectId: 'mock-project-route-smoke',
      workspaceId: 'mock-workspace-route-smoke',
      userId: 'mock-user-route-smoke',
    }),
  })
  assert.equal(response.ok, true, response.error?.message)
  assert.equal(response.mockOnly, true)
  assert.equal(response.data?.mockOnly, true)
  assert.equal(response.data?.providerCallMade, false)
  assert.equal(response.data?.mediaProcessingStarted, false)
  assert.equal(response.data?.workerJobCreated, false)
  assert.equal(response.data?.renderJobCreated, false)
  assert.equal(response.data?.creditReservedOrSpent, false)
  assert.equal(response.data?.supabaseReadMade, false)
  assert.equal(response.data?.supabaseWriteMade, false)
  assert.equal(response.data?.fileBytesRead, false)
  assert.equal(response.data?.externalUrlFetched, false)
  return response.data
}

for (const doc of requiredDocs) {
  assert.equal(existsSync(repoFile(doc)), true, `Missing RP-EDITLEVEL-03 API route doc: ${doc}`)
}

const docsText = requiredDocs.map(readRepoFile).join('\n').toLowerCase()
for (const term of ['mock local', 'planning domain', 'no production http route', 'no runtime implementation', 'rp-editlevel-04']) {
  assert.ok(docsText.includes(term), `API route docs must include: ${term}`)
}

assert.equal(EDIT_LEVEL_API_ROUTES.length, 21)
assert.equal(listEditLevelApiRouteIds().length, 21)
assert.equal(EDIT_LEVEL_API_ROUTES.every((route) => route.domain === 'planning'), true)
assert.equal(EDIT_LEVEL_API_ROUTES.every((route) => route.runtimeMode === 'mock'), true)
assert.equal(EDIT_LEVEL_API_ROUTES.every((route) => route.status === 'mock_ready'), true)

for (const route of EDIT_LEVEL_API_ROUTES) {
  assert.equal(getApiRouteById(route.id)?.id, route.id)
}

const summary = createEditLevelApiRouteSummary()
assert.equal(summary.routeCount, 21)
assert.equal(summary.mockReadyRouteCount, 21)
assert.equal(summary.productionReady, false)
assert.ok(listMockEditLevelApiRouteScenarios().length >= 50)

resetMockEditLevelRouteState()
const profiles = await callRoute<unknown[]>('project.editLevel.profiles.list')
assert.equal(Array.isArray(profiles?.data), true)
assert.equal(profiles?.data?.length, 3)

const legacyPremium = await callRoute<{ canonicalLevel?: string }>('project.editLevel.compatibility.normalize', {
  input: { value: 'premium', inputSource: 'legacy_runtime' },
})
assert.equal(legacyPremium?.data?.canonicalLevel, 'ultra_premium')

const recommendation = await callRoute<{ id: string }>('project.editLevel.recommendation.create', {
  projectId: 'mock-project-route-smoke',
  sessionId: 'mock-session-route-smoke',
  input: createMockEditLevelRecommendationInput({
    userPrompt: 'Enhanced social edit',
    desiredPolish: 'enhanced',
  }),
})
const recommendationId = recommendation?.data?.id ?? 'missing-recommendation'

const selection = await callRoute<{ id: string; selectedLevel: string }>('project.editLevel.selection.save', {
  projectId: 'mock-project-route-smoke',
  sessionId: 'mock-session-route-smoke',
  input: { value: 'premium', inputSource: 'legacy_runtime' },
  recommendationId,
})
assert.equal(selection?.data?.selectedLevel, 'ultra_premium')

assert.ok((await callRoute<string>('project.editLevel.toolRouting.summary', { level: 'premium' }))?.data?.includes('Qwen 3.7'))
assert.ok((await callRoute<string>('project.editLevel.qwenRouting.summary', { level: 'ultra_premium' }))?.data?.includes('Qwen2.5-VL'))
assert.ok((await callRoute<string>('project.editLevel.qaProfile.summary', { level: 'normal' }))?.data?.includes('QA profile'))
assert.ok((await callRoute<string>('project.editLevel.estimate.summary', { level: 'premium' }))?.data?.includes('render budget future'))
assert.ok((await callRoute<string>('project.editLevel.fallback.summary', { level: 'premium' }))?.data?.includes('mock-safe'))

const flow = await runMockEditLevelApiRouteFlow()
assert.equal(flow.noProductionRoute, true)
assert.equal(flow.routeSummary.routeCount, 21)

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-level-api-routes'],
  'tsx server/smoke/edit-level-api-routes-smoke.ts',
)

console.log('edit-level-api-routes-smoke passed')
