import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import type { EditLevelNormalizationResult } from '../../src/types'
import { createMockEditLevelRecommendationInput } from '../../src/lib/edit-level-recommendation-fixtures'
import { createMockEditLevelApiClient } from '../../src/lib/edit-level-api-client-adapter'
import {
  assertEditLevelApiClientResultIsMockOnly,
  summarizeEditLevelApiClientResult,
} from '../../src/lib/edit-level-api-client-summaries'

const requiredDocs = [
  'docs/edit-level-api-client.md',
  'docs/edit-level-client-transition-plan.md',
  'docs/edit-level-selection-lifecycle.md',
]

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

for (const doc of requiredDocs) {
  assert.equal(existsSync(repoFile(doc)), true, `Missing RP-EDITLEVEL-03 API client doc: ${doc}`)
}

const docsText = requiredDocs.map(readRepoFile).join('\n').toLowerCase()
for (const term of ['browser-safe client', 'mock transport', 'no live ui wiring', 'no runtime implementation', 'rp-editlevel-04']) {
  assert.ok(docsText.includes(term), `API client docs must include: ${term}`)
}

const client = createMockEditLevelApiClient({ resetState: true })
const profiles = await client.profiles.list()
assert.equal(profiles.data?.length, 3)
assert.equal(assertEditLevelApiClientResultIsMockOnly(profiles), true)

assert.equal((await client.profiles.get({ level: 'ultra_premium' })).data?.profile?.displayName, 'Ultra Premium')
const legacyPremium = await client.compatibility.normalize({
  input: { value: 'premium', inputSource: 'legacy_runtime' },
})
assert.equal((legacyPremium.data as EditLevelNormalizationResult).canonicalLevel, 'ultra_premium')
const explicitPremium = await client.compatibility.normalize({
  input: { value: 'premium', inputSource: 'explicit_canonical' },
})
assert.equal((explicitPremium.data as EditLevelNormalizationResult).canonicalLevel, 'premium')

const cards = await client.uiCards.create({ recommendedLevel: 'premium' })
assert.equal(cards.data?.length, 3)
assert.equal(cards.data?.find((card) => card.level === 'premium')?.recommended, true)

const recommendation = await client.recommendation.create({
  projectId: 'mock-project-client-smoke',
  sessionId: 'mock-session-client-smoke',
  input: createMockEditLevelRecommendationInput({
    userPrompt: 'Studio-level complex brand ad',
    desiredPolish: 'studio',
    editBriefMarkerCount: 6,
    attachmentCount: 4,
  }),
})
assert.equal(recommendation.data?.recommendation.recommendedLevel, 'ultra_premium')

const listedRecommendations = await client.recommendations.list({ projectId: 'mock-project-client-smoke' })
assert.equal(listedRecommendations.data?.length, 1)
assert.equal((await client.recommendation.get({ id: recommendation.data?.id ?? 'missing-recommendation' })).data?.id, recommendation.data?.id)

const selection = await client.selection.save({
  projectId: 'mock-project-client-smoke',
  sessionId: 'mock-session-client-smoke',
  input: { value: 'basic', inputSource: 'legacy_runtime' },
  recommendationId: recommendation.data?.id,
})
assert.equal(selection.data?.selectedLevel, 'normal')

const updatedSelection = await client.selection.update({
  id: selection.data?.id ?? 'missing-selection',
  input: { value: 'premium', inputSource: 'public_beta' },
})
assert.equal(updatedSelection.data?.selectedLevel, 'premium')
assert.equal((await client.selection.get({ id: selection.data?.id ?? 'missing-selection' })).data?.selectedLevel, 'premium')

assert.ok((await client.toolRouting.summary({ level: 'premium' })).data?.includes('Qwen 3.7'))
assert.ok((await client.qwenRouting.summary({ level: 'ultra_premium' })).data?.includes('Qwen2.5-VL'))
assert.ok((await client.qaProfile.summary({ level: 'normal' })).data?.includes('QA profile'))
assert.ok((await client.estimate.summary({ level: 'premium' })).data?.includes('credit estimate only'))
assert.ok((await client.fallback.summary({ level: 'premium' })).data?.includes('mock-safe'))

const readiness = await client.readiness.create({
  projectId: 'mock-project-client-smoke',
  sessionId: 'mock-session-client-smoke',
  level: 'premium',
})
assert.equal(readiness.data?.productionReady, false)
assert.equal((await client.readiness.get({ id: readiness.data?.id ?? 'missing-readiness' })).data?.level, 'premium')

const log = await client.applicationLogs.append({
  projectId: 'mock-project-client-smoke',
  sessionId: 'mock-session-client-smoke',
  operation: 'repository.summary',
  level: 'premium',
  message: 'client smoke log',
})
assert.equal(log.data?.sideEffects.creditReservedOrSpent, false)
assert.equal((await client.applicationLogs.list({ projectId: 'mock-project-client-smoke' })).data?.length, 1)
assert.equal((await client.selection.clear({ id: selection.data?.id ?? 'missing-selection' })).data?.cleared, true)

const repositorySummary = await client.repository.summary()
assert.equal(repositorySummary.data?.nextRecommendedPrompt, 'RP-EDITLEVEL-04 - UI Cards + Recommendation')
assert.equal(assertEditLevelApiClientResultIsMockOnly(repositorySummary), true)
assert.ok(summarizeEditLevelApiClientResult(repositorySummary).join('\n').includes('mockOnly=true'))

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-level-api-client'],
  'tsx server/smoke/edit-level-api-client-smoke.ts',
)

console.log('edit-level-api-client-smoke passed')
