import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import type { EditLevelRepositoryResult } from '../../src/types'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { runMockEditLevelRepositoryFlow } from '../../src/backend/orchestrators/mock-edit-level-repository-orchestrator'
import { createMockEditLevelRepository } from '../../src/backend/repositories/mock-edit-level-repository'
import { listMockEditLevelRepositoryScenarios } from '../../src/backend/repositories/mock-edit-level-repository-scenarios'
import { createDisabledSupabaseEditLevelRepository } from '../../src/backend/repositories/supabase-edit-level-repository'
import { validateEditLevelRepositoryNoSideEffects } from '../../src/backend/repositories/edit-level-repository-validation-service'

const requiredDocs = [
  'docs/edit-level-repository-layer.md',
  'docs/edit-level-mock-database.md',
  'docs/edit-level-supabase-boundary.md',
  'docs/edit-level-selection-lifecycle.md',
]

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

function assertMockOnly(result: EditLevelRepositoryResult<unknown>) {
  assert.deepEqual(validateEditLevelRepositoryNoSideEffects(result), [])
}

for (const doc of requiredDocs) {
  assert.equal(existsSync(repoFile(doc)), true, `Missing RP-EDITLEVEL-03 repository doc: ${doc}`)
}

const docsText = requiredDocs.map(readRepoFile).join('\n').toLowerCase()
for (const term of ['mock repository', 'mockdatabase', 'supabase disabled', 'no runtime implementation', 'rp-editlevel-04']) {
  assert.ok(docsText.includes(term), `Repository docs must include: ${term}`)
}

const db = createMockDatabase()
assert.equal(db.editLevelProfileCatalog.length, 0)
assert.equal(db.editLevelSelections.length, 0)
assert.equal(db.editLevelRecommendations.length, 0)
assert.equal(db.editLevelReadiness.length, 0)
assert.equal(db.editLevelApplicationLogs.length, 0)

const repository = createMockEditLevelRepository(db)
assert.equal(db.editLevelProfileCatalog.length, 3)

const profiles = repository.listProfiles()
assert.equal(profiles.ok, true)
assert.equal(profiles.data?.length, 3)
assertMockOnly(profiles)

assert.equal(repository.getProfile({ level: 'normal' }).data?.profile?.displayName, 'Normal')
assert.equal(repository.normalizeInput({ input: { value: 'premium', inputSource: 'legacy_runtime' } }).data?.canonicalLevel, 'ultra_premium')
assert.equal(repository.normalizeInput({ input: { value: 'premium', inputSource: 'public_beta' } }).data?.canonicalLevel, 'premium')

const recommendation = repository.createRecommendation({
  projectId: 'mock-project',
  sessionId: 'mock-session',
  input: {
    userPrompt: 'Studio brand launch ad',
    desiredPolish: 'studio',
    editBriefMarkerCount: 6,
    attachmentCount: 4,
    mockOnly: true,
  },
})
assert.equal(recommendation.data?.recommendation.recommendedLevel, 'ultra_premium')
assertMockOnly(recommendation)

const selection = repository.saveSelection({
  projectId: 'mock-project',
  sessionId: 'mock-session',
  input: { value: 'pro', inputSource: 'legacy_runtime' },
  recommendationId: recommendation.data?.id,
})
assert.equal(selection.data?.selectedLevel, 'premium')
assert.equal(selection.data?.lockedForRuntime, false)
assertMockOnly(selection)

const updatedSelection = repository.updateSelection({
  id: selection.data?.id ?? 'missing-selection',
  input: { value: 'premium', inputSource: 'public_beta' },
})
assert.equal(updatedSelection.data?.selectedLevel, 'premium')
assertMockOnly(updatedSelection)

assert.ok(repository.createToolRoutingSummary({ level: 'premium' }).data?.includes('Qwen 3.7'))
assert.ok(repository.createQwenRoutingSummary({ level: 'ultra_premium' }).data?.includes('Qwen2.5-VL'))
assert.ok(repository.createQAProfileSummary({ level: 'normal' }).data?.includes('QA profile'))
assert.ok(repository.createEstimateSummary({ level: 'premium' }).data?.includes('credit estimate only'))
assert.ok(repository.createFallbackSummary({ level: 'ultra_premium' }).data?.includes('mock-safe'))
assert.equal(repository.createEstimateProfile({ level: 'premium' }).data?.creditsReservedOrSpent, false)

const readiness = repository.createReadiness({
  projectId: 'mock-project',
  sessionId: 'mock-session',
  level: 'premium',
})
assert.equal(readiness.data?.productionReady, false)
assertMockOnly(readiness)
assert.equal(repository.getReadiness({ id: readiness.data?.id ?? 'missing-readiness' }).data?.level, 'premium')

const log = repository.appendApplicationLog({
  projectId: 'mock-project',
  sessionId: 'mock-session',
  operation: 'repository.summary',
  level: 'premium',
  message: 'smoke log',
})
assert.equal(log.data?.sideEffects.creditReservedOrSpent, false)
assert.equal(repository.listApplicationLogs({ projectId: 'mock-project' }).data?.length, 1)

assert.equal(repository.clearSelection({ id: selection.data?.id ?? 'missing-selection' }).data?.cleared, true)
const summary = repository.createRepositorySummary()
assert.equal(summary.data?.nextRecommendedPrompt, 'RP-EDITLEVEL-04 - UI Cards + Recommendation')
assert.equal(summary.data?.sideEffects.supabaseWriteMade, false)
assertMockOnly(summary)

const disabledSupabase = createDisabledSupabaseEditLevelRepository().listProfiles()
assert.equal(disabledSupabase.ok, false)
assert.equal(disabledSupabase.mode, 'supabase_disabled')
assert.equal(disabledSupabase.supabaseReadMade, false)
assert.equal(disabledSupabase.supabaseWriteMade, false)

assert.ok(listMockEditLevelRepositoryScenarios().length >= 27)
assert.equal(runMockEditLevelRepositoryFlow().noProductionRepository, true)

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-level-repository'],
  'tsx server/smoke/edit-level-repository-smoke.ts',
)

console.log('edit-level-repository-smoke passed')
