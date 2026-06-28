import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import type {
  ListEditLevelProfilesRequest,
  ListEditLevelProfilesResponse,
} from '../../src/backend/contracts/edit-level-contracts'
import {
  runMockEditLevelCompatibilityFlow,
  runMockEditLevelProfileFlow,
  runMockEditLevelQAEstimateFlow,
  runMockEditLevelReadinessFlow,
  runMockEditLevelRecommendationFlow,
  runMockEditLevelToolRoutingFlow,
} from '../../src/backend/orchestrators/mock-edit-level-orchestrator'
import { listMockEditLevelScenarios } from '../../src/backend/mock/mock-edit-level-scenarios'
import {
  normalizeEditLevelInput,
} from '../../src/lib/edit-level-compatibility-mappers'
import {
  createEditLevelEstimateProfile,
  createEditLevelQAProfileDefinition,
  createEditLevelToolRoutingProfile,
  createEditLevelUICardModels,
} from '../../src/lib/edit-level-profile-mappers'
import {
  createNormalRecommendationFixture,
  createPremiumRecommendationFixture,
  createUltraPremiumRecommendationFixture,
} from '../../src/lib/edit-level-recommendation-fixtures'
import {
  EDIT_LEVEL_LEGACY_ALIAS_MAPPINGS,
  EDIT_LEVEL_PROFILES,
  getEditLevelProfile,
  getEditLevelProfileByLegacyAlias,
  listEditLevelProfiles,
} from '../../src/lib/mock-edit-level-profiles'

const requiredDocs = [
  'docs/edit-level-type-contracts.md',
  'docs/edit-level-mock-profiles.md',
  'docs/edit-level-legacy-compatibility-contract.md',
  'docs/edit-level-tool-budget-contract.md',
  'docs/edit-level-qwen-profile-contract.md',
  'docs/edit-level-qa-estimate-contract.md',
  'docs/edit-level-recommendation-fixtures.md',
  'docs/edit-level-contract-boundary.md',
]

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

for (const doc of requiredDocs) {
  assert.equal(existsSync(repoFile(doc)), true, `Missing required RP-EDITLEVEL-02 doc: ${doc}`)
}

const docsText = requiredDocs.map(readRepoFile).join('\n').toLowerCase()
for (const term of ['types/profiles/fixtures only', 'no runtime behavior', 'no production repository', 'no production api route', 'no ui behavior', 'no credit spend', 'no render', 'no migration']) {
  assert.ok(docsText.includes(term), `Boundary docs must include: ${term}`)
}

assert.equal(listEditLevelProfiles().length, 3, 'three canonical profiles exist')
assert.deepEqual(EDIT_LEVEL_PROFILES.map((profile) => profile.level), ['normal', 'premium', 'ultra_premium'])
assert.equal(getEditLevelProfile('normal')?.displayName, 'Normal')
assert.equal(getEditLevelProfile('premium')?.displayName, 'Premium')
assert.equal(getEditLevelProfile('ultra_premium')?.displayName, 'Ultra Premium')

assert.equal(getEditLevelProfileByLegacyAlias('basic')?.level, 'normal')
assert.equal(getEditLevelProfileByLegacyAlias('pro')?.level, 'premium')
assert.equal(getEditLevelProfileByLegacyAlias('premium')?.level, 'ultra_premium')
assert.equal(EDIT_LEVEL_LEGACY_ALIAS_MAPPINGS.length, 3)

assert.equal(normalizeEditLevelInput({ value: 'basic', inputSource: 'legacy_runtime' }).canonicalLevel, 'normal')
assert.equal(normalizeEditLevelInput({ value: 'pro', inputSource: 'legacy_runtime' }).canonicalLevel, 'premium')
assert.equal(normalizeEditLevelInput({ value: 'premium', inputSource: 'legacy_runtime' }).canonicalLevel, 'ultra_premium')
assert.equal(normalizeEditLevelInput({ value: 'premium', inputSource: 'public_beta' }).canonicalLevel, 'premium')
assert.equal(normalizeEditLevelInput({ value: 'premium', inputSource: 'explicit_canonical' }).canonicalLevel, 'premium')
assert.equal(normalizeEditLevelInput({ value: 'premium', inputSource: 'legacy_runtime' }).ambiguous, true)

for (const profile of EDIT_LEVEL_PROFILES) {
  const routing = createEditLevelToolRoutingProfile(profile.level)
  const qaProfile = createEditLevelQAProfileDefinition(profile.level)
  const estimate = createEditLevelEstimateProfile(profile.level)
  assert.ok(routing.qwen3ReasoningDepth)
  assert.ok(routing.qwen25vlVisualDepth)
  assert.ok(profile.editBriefPolicy)
  assert.ok(qaProfile.checks.length > 0)
  assert.equal(estimate.estimateOnly, true)
  assert.equal(estimate.creditsReservedOrSpent, false)
  assert.equal(profile.mockOnly, true)
  assert.equal(profile.productionReady, false)
}

assert.equal(createEditLevelUICardModels().length, 3)
assert.equal(createNormalRecommendationFixture().recommendedLevel, 'normal')
assert.equal(createPremiumRecommendationFixture().recommendedLevel, 'premium')
assert.equal(createUltraPremiumRecommendationFixture().recommendedLevel, 'ultra_premium')

const contractRequest: ListEditLevelProfilesRequest = { includeMockOnly: true }
const contractResponse: ListEditLevelProfilesResponse = { profiles: listEditLevelProfiles(), mockOnly: true }
assert.equal(contractRequest.includeMockOnly, true)
assert.equal(contractResponse.profiles.length, 3)

assert.ok(listMockEditLevelScenarios().length >= 72, 'scenarios >= 72')
assert.equal(runMockEditLevelProfileFlow().profiles.length, 3)
assert.equal(runMockEditLevelCompatibilityFlow().legacyPremium.canonicalLevel, 'ultra_premium')
assert.equal(runMockEditLevelToolRoutingFlow().length, 3)
assert.equal(runMockEditLevelQAEstimateFlow().every((item) => item.estimate.estimateOnly), true)
assert.equal(runMockEditLevelRecommendationFlow().ultraPremium.recommendedLevel, 'ultra_premium')
assert.equal(runMockEditLevelReadinessFlow().noRuntimeBehavior, true)

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-level-types'],
  'tsx server/smoke/edit-level-types-smoke.ts',
  'package.json must expose smoke:edit-level-types.',
)

console.log('edit-level-types-smoke passed')
