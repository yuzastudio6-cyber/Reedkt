import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import {
  createEditLevelBoundarySummary,
  createEditLevelCardGroupModel,
  createEditLevelEstimateNoticeModel,
  createEditLevelSelectedSummaryModel,
  createEditLevelToolDepthSummaryModel,
  editLevelUIResultHasNoSideEffects,
  loadEditLevelCardsForUI,
  loadEditLevelRecommendationForUI,
  loadEditLevelSelectionForUI,
  mapCanonicalEditLevelToLegacyRuntime,
  mapLegacyRuntimeEditLevelToCanonical,
  saveEditLevelSelectionForUI,
  updateEditLevelSelectionForUI,
  clearEditLevelSelectionForUI,
} from '../../src/lib/edit-level-ui-adapter'

const requiredFiles = [
  'src/lib/edit-level-ui-adapter.ts',
  'src/components/edit-level/EditLevelCard.tsx',
  'src/components/edit-level/EditLevelCardGroup.tsx',
  'src/components/edit-level/EditLevelRecommendationBanner.tsx',
  'src/components/edit-level/EditLevelSelectedSummary.tsx',
  'src/components/edit-level/EditLevelToolDepthSummary.tsx',
  'src/components/edit-level/EditLevelEstimateNotice.tsx',
  'src/components/edit-level/EditLevelBoundaryNotice.tsx',
  'src/styles/edit-level.css',
  'tests/e2e/edit-level-ui.spec.ts',
  'docs/edit-level-ui-cards.md',
  'docs/edit-level-recommendation-ui.md',
  'docs/edit-level-selection-ui.md',
  'docs/edit-level-session-brief-display.md',
  'docs/edit-level-ui-boundary.md',
  'docs/edit-level-next-tool-router.md',
]

function repoPath(filePath: string) {
  return new URL(`../../${filePath}`, import.meta.url)
}

function readRepoFile(filePath: string) {
  return readFileSync(repoPath(filePath), 'utf8')
}

function collectComponentFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectComponentFiles(entryPath)
    return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}

for (const filePath of requiredFiles) {
  assert.equal(existsSync(repoPath(filePath)), true, `Missing RP-EDITLEVEL-04 file: ${filePath}`)
}

const docsText = requiredFiles
  .filter((filePath) => filePath.startsWith('docs/'))
  .map(readRepoFile)
  .join('\n')
  .toLowerCase()

for (const term of [
  'ui cards are visible',
  'mock/local',
  'no live planner',
  'credit estimate only',
  'render/revision budget is future metadata',
  'rp-editlevel-05',
]) {
  assert.ok(docsText.includes(term), `RP-EDITLEVEL-04 docs must include: ${term}`)
}

const componentFiles = collectComponentFiles(new URL('../../src/components/edit-level', import.meta.url).pathname)
for (const filePath of componentFiles) {
  const source = readFileSync(filePath, 'utf8')
  assert.equal(source.includes('../../backend'), false, `${filePath} must not import backend modules`)
  assert.equal(source.includes('../backend'), false, `${filePath} must not import backend modules`)
  assert.equal(source.includes('MockDatabase'), false, `${filePath} must not reference MockDatabase`)
}

assert.equal(mapCanonicalEditLevelToLegacyRuntime('normal'), 'basic')
assert.equal(mapCanonicalEditLevelToLegacyRuntime('premium'), 'pro')
assert.equal(mapCanonicalEditLevelToLegacyRuntime('ultra_premium'), 'premium')
assert.equal(mapLegacyRuntimeEditLevelToCanonical('premium'), 'ultra_premium')

const cardGroup = createEditLevelCardGroupModel({ selectedLevel: 'premium', recommendedLevel: 'premium' })
assert.equal(cardGroup.cards.length, 3)
assert.equal(cardGroup.cards.some((card) => card.displayName === 'Normal' && /professional/i.test(card.tagline)), true)
assert.equal(cardGroup.cards.some((card) => card.displayName === 'Premium' && /Enhanced creative edit/i.test(card.tagline)), true)
assert.equal(cardGroup.cards.some((card) => card.displayName === 'Ultra Premium' && /Studio-level creative treatment/i.test(card.tagline)), true)

assert.equal(createEditLevelSelectedSummaryModel('ultra_premium').displayName, 'Ultra Premium')
assert.ok(createEditLevelToolDepthSummaryModel('premium').summary.join('\n').includes('Qwen 3.7'))
assert.equal(createEditLevelEstimateNoticeModel('normal').creditsReservedOrSpent, false)
assert.ok(createEditLevelBoundarySummary().join('\n').includes('does not call Qwen 3.7'))

const cardsResult = await loadEditLevelCardsForUI({ selectedLevel: 'premium' })
assert.equal(cardsResult.data?.cards.length, 3)
assert.equal(editLevelUIResultHasNoSideEffects(cardsResult), true)

const recommendationResult = await loadEditLevelRecommendationForUI({
  desiredPolish: 'studio',
  userPrompt: 'studio brand launch ad',
  editBriefMarkerCount: 6,
  attachmentCount: 4,
})
assert.equal(recommendationResult.data?.recommendation.recommendedLevel, 'ultra_premium')
assert.equal(editLevelUIResultHasNoSideEffects(recommendationResult), true)

const saved = await saveEditLevelSelectionForUI({ level: 'premium', recommendationId: recommendationResult.data?.recordId })
assert.equal(saved.data?.selectedLevel, 'premium')
assert.equal(editLevelUIResultHasNoSideEffects(saved), true)

const loaded = await loadEditLevelSelectionForUI(saved.data?.id)
assert.equal(loaded.data?.selectedLevel, 'premium')
assert.equal(editLevelUIResultHasNoSideEffects(loaded), true)

const updated = await updateEditLevelSelectionForUI({ selectionId: saved.data?.id ?? 'missing-selection', level: 'ultra_premium' })
assert.equal(updated.data?.selectedLevel, 'ultra_premium')
assert.equal(editLevelUIResultHasNoSideEffects(updated), true)

const cleared = await clearEditLevelSelectionForUI(saved.data?.id ?? 'missing-selection')
assert.equal(cleared.data?.cleared, true)
assert.equal(editLevelUIResultHasNoSideEffects(cleared), true)

const migrationCount = readdirSync(new URL('../../supabase/migrations', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .length
assert.equal(migrationCount, 25, 'RP-EDITLEVEL-04 must not create or modify migration files.')

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:edit-level-ui'], 'tsx server/smoke/edit-level-ui-smoke.ts')

console.log('edit-level-ui-smoke passed')
