import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

import {
  createEditLevelQwenFallbackNoticeModel,
  createEditLevelQwenPlanningDimensionListModel,
  createEditLevelQwenPlanningSummaryModel,
  createEditLevelQwenUsageEstimateNoticeModel,
  loadEditLevelQwenPlanningForUI,
} from '../../src/lib/edit-level-qwen-planning-ui-adapter'
import {
  createEditLevelQwenPlanningBoundarySummary,
  createEditLevelQwenPlanningProfilePackage,
  createEditLevelQwenPlanningSideEffectFlags,
  createEditLevelQwenPromptPolicy,
  listEditLevelQwenPlanningDimensionDefinitions,
} from '../../src/lib/edit-level-qwen-planning-rules'
import {
  createEditLevelQwenDimensionSummary,
  createEditLevelQwenPlanningTechnicalSummary,
  createEditLevelQwenPlanningUserSummary,
  findEditLevelQwenPlanningDimensionRoute,
  qwenReasoningLabel,
  structuredOutputLabel,
} from '../../src/lib/edit-level-qwen-planning-summaries'
import {
  createAllMockEditLevelQwenPromptPolicies,
  createAllMockEditLevelQwenStructuredOutputPolicies,
  createEditLevelQwenFallbackReport,
  createEditLevelQwenPlanningDimensionRegistrySummary,
  createEditLevelQwenPlanningSummary,
  createEditLevelQwenUsageEstimatePolicy,
  createMockEditLevelQwenPlanningProfile,
  listEditLevelQwenPlanningDimensions,
  listMockEditLevelQwenPlanningScenarios,
  runMockEditLevelQwenPlanningFlow,
  runMockNormalQwenPlanningFlow,
  runMockPremiumQwenPlanningFlow,
  runMockQwenFallbackFlow,
  runMockQwenPlanningReadinessFlow,
  runMockQwenPlanningValidationFlow,
  runMockQwenPromptPolicyFlow,
  runMockQwenStructuredOutputPolicyFlow,
  runMockUltraQwenPlanningFlow,
  validateEditLevelQwenPlanningProfile,
} from '../../src/backend'
import type {
  EditLevelQwenPlanningDimensionId,
  EditLevelQwenPlanningProfilePackage,
  EditLevelQwenPlanningSideEffectFlags,
} from '../../src/types'

const requiredFiles = [
  'src/types/edit-level-qwen-planning.ts',
  'src/lib/edit-level-qwen-planning-rules.ts',
  'src/lib/edit-level-qwen-planning-ui-adapter.ts',
  'src/lib/edit-level-qwen-planning-summaries.ts',
  'src/backend/edit-level-qwen-planning/edit-level-qwen-planning-dimension-registry.ts',
  'src/backend/edit-level-qwen-planning/edit-level-qwen-planning-profile-service.ts',
  'src/backend/edit-level-qwen-planning/edit-level-qwen-prompt-policy-service.ts',
  'src/backend/edit-level-qwen-planning/edit-level-qwen-structured-output-policy-service.ts',
  'src/backend/edit-level-qwen-planning/edit-level-qwen-fallback-policy-service.ts',
  'src/backend/edit-level-qwen-planning/edit-level-qwen-usage-estimate-policy-service.ts',
  'src/backend/edit-level-qwen-planning/edit-level-qwen-planning-validation-service.ts',
  'src/backend/edit-level-qwen-planning/edit-level-qwen-planning-summary-service.ts',
  'src/backend/edit-level-qwen-planning/mock-edit-level-qwen-planning-scenarios.ts',
  'src/backend/orchestrators/mock-edit-level-qwen-planning-orchestrator.ts',
  'src/backend/contracts/edit-level-qwen-planning-contracts.ts',
  'src/components/edit-level/EditLevelQwenPlanningSummary.tsx',
  'src/components/edit-level/EditLevelQwenPlanningDimensionList.tsx',
  'src/components/edit-level/EditLevelQwenFallbackNotice.tsx',
  'src/components/edit-level/EditLevelQwenUsageEstimateNotice.tsx',
  'server/smoke/edit-level-qwen-planning-smoke.ts',
  'tests/e2e/edit-level-qwen-planning.spec.ts',
  'docs/edit-level-qwen-planning-profile.md',
  'docs/edit-level-qwen-prompt-policy.md',
  'docs/edit-level-qwen-structured-output-policy.md',
  'docs/edit-level-qwen-planning-by-level.md',
  'docs/edit-level-qwen-fallback-policy.md',
  'docs/edit-level-qwen-planning-ui.md',
  'docs/edit-level-qwen-planning-boundary.md',
  'docs/edit-level-qwen-planning-next-qa-gates.md',
]

const expectedDimensionIds: EditLevelQwenPlanningDimensionId[] = [
  'qwen_reasoning_depth',
  'planning_pass_count',
  'prompt_context_budget',
  'source_context_depth',
  'marker_context_depth',
  'edit_brief_marker_priority',
  'preference_dna_usage',
  'qwen25vl_visual_summary_usage',
  'transcript_usage',
  'audio_context_usage',
  'graphic_text_context_usage',
  'qa_warning_usage',
  'plan_hint_complexity',
  'fallback_behavior',
  'usage_estimate_policy',
  'credit_behavior',
]

const falseFlagKeys: Array<Exclude<keyof EditLevelQwenPlanningSideEffectFlags, 'mockOnly'>> = [
  'providerCallMade',
  'qwenCallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'plannerExecuted',
  'editPlanCreated',
  'workerJobCreated',
  'renderJobCreated',
  'creditReservedOrSpent',
  'fileBytesRead',
  'externalUrlFetched',
]

function repoPath(filePath: string) {
  return new URL(`../../${filePath}`, import.meta.url)
}

function readRepoFile(filePath: string) {
  return readFileSync(repoPath(filePath), 'utf8')
}

function assertNoSideEffects(flags: EditLevelQwenPlanningSideEffectFlags) {
  assert.equal(flags.mockOnly, true)

  for (const flagKey of falseFlagKeys) {
    assert.equal(flags[flagKey], false, `${flagKey} must remain false`)
  }
}

function assertPackageNoSideEffects(qwenPackage: EditLevelQwenPlanningProfilePackage) {
  assertNoSideEffects(qwenPackage)
  assertNoSideEffects(qwenPackage.sideEffectFlags)

  for (const dimension of qwenPackage.dimensions) {
    assertNoSideEffects(dimension)
    assertNoSideEffects(dimension.sideEffectFlags)
  }
}

for (const filePath of requiredFiles) {
  assert.equal(existsSync(repoPath(filePath)), true, `Missing RP-EDITLEVEL-07 file: ${filePath}`)
}

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:edit-level-qwen-planning'], 'tsx server/smoke/edit-level-qwen-planning-smoke.ts')

const definitions = listEditLevelQwenPlanningDimensionDefinitions()
assert.equal(definitions.length, 16)
assert.deepEqual(definitions.map((definition) => definition.dimensionId), expectedDimensionIds)
assert.equal(listEditLevelQwenPlanningDimensions().dimensionCount, 16)
assert.equal(createEditLevelQwenPlanningDimensionRegistrySummary().dimensionCount, 16)

const normal = createEditLevelQwenPlanningProfilePackage('normal')
const premium = createEditLevelQwenPlanningProfilePackage('premium')
const ultra = createEditLevelQwenPlanningProfilePackage('ultra_premium')

assert.equal(normal.qwenReasoningDepth, 'standard')
assert.equal(normal.planningPassPolicy, 'single_pass')
assert.equal(normal.promptContextPolicy, 'compact')
assert.equal(normal.structuredOutputPolicy, 'simple_professional_plan_hints')
assert.equal(normal.usageEstimatePolicy, 'low_estimate')
assert.equal(findEditLevelQwenPlanningDimensionRoute(normal, 'source_context_depth').policyValue, 'metadata + targeted context')

assert.equal(premium.qwenReasoningDepth, 'deep')
assert.equal(premium.planningPassPolicy, 'two_pass')
assert.equal(premium.promptContextPolicy, 'enhanced')
assert.equal(premium.structuredOutputPolicy, 'layered_creative_plan_hints')
assert.equal(premium.usageEstimatePolicy, 'medium_estimate')
assert.equal(findEditLevelQwenPlanningDimensionRoute(premium, 'source_context_depth').policyValue, 'key moments + marker windows')

assert.equal(ultra.qwenReasoningDepth, 'multi_pass')
assert.equal(ultra.planningPassPolicy, 'studio_multi_pass')
assert.equal(ultra.promptContextPolicy, 'studio')
assert.equal(ultra.structuredOutputPolicy, 'studio_multi_layer_plan_hints')
assert.equal(ultra.usageEstimatePolicy, 'high_estimate')
assert.equal(findEditLevelQwenPlanningDimensionRoute(ultra, 'source_context_depth').policyValue, 'scene-level deep context')

for (const qwenPackage of [normal, premium, ultra]) {
  assert.equal(qwenPackage.dimensions.length, 16)
  assert.equal(qwenPackage.creditBehavior, 'estimate_only_no_spend')
  assert.equal(validateEditLevelQwenPlanningProfile({ qwenPackage }).ok, true)
  assertPackageNoSideEffects(qwenPackage)
}

assert.equal(createEditLevelQwenPromptPolicy('normal').promptContextPolicy, 'compact')
assert.equal(createEditLevelQwenPromptPolicy('normal').includeQwen25VLVisualSummary, false)
assert.equal(createEditLevelQwenPromptPolicy('premium').promptContextPolicy, 'enhanced')
assert.equal(createEditLevelQwenPromptPolicy('premium').includeQwen25VLVisualSummary, true)
assert.equal(createEditLevelQwenPromptPolicy('ultra_premium').promptContextPolicy, 'studio')
assert.equal(createEditLevelQwenPromptPolicy('ultra_premium').includePlanHistory, true)
assert.equal(createAllMockEditLevelQwenPromptPolicies().length, 3)

assert.equal(createAllMockEditLevelQwenStructuredOutputPolicies().length, 3)
assert.equal(structuredOutputLabel(normal.structuredOutputPolicy), 'simple professional plan hints')
assert.equal(structuredOutputLabel(premium.structuredOutputPolicy), 'layered creative plan hints')
assert.equal(structuredOutputLabel(ultra.structuredOutputPolicy), 'studio multi-layer plan hints')

assert.equal(qwenReasoningLabel('normal'), 'standard reasoning')
assert.equal(qwenReasoningLabel('premium'), 'deep creative reasoning')
assert.equal(qwenReasoningLabel('ultra_premium'), 'studio multi-pass reasoning')
assert.equal(createEditLevelQwenPlanningUserSummary('premium').includes('deeper Qwen reasoning'), true)
assert.equal(createEditLevelQwenPlanningTechnicalSummary('premium').includes('all side-effect flags remain false'), true)
assert.equal(createEditLevelQwenDimensionSummary(findEditLevelQwenPlanningDimensionRoute(premium, 'planning_pass_count')).includes('two_pass'), true)
assert.equal(createEditLevelQwenPlanningBoundarySummary().join(' ').includes('no Qwen call'), true)

for (const flagKey of falseFlagKeys) {
  const unsafe = {
    ...premium,
    [flagKey]: true,
    sideEffectFlags: {
      ...premium.sideEffectFlags,
      [flagKey]: true,
    },
  } as never

  assert.equal(validateEditLevelQwenPlanningProfile({ qwenPackage: unsafe }).blocked, true, `${flagKey} should block validation`)
}

assertNoSideEffects(createEditLevelQwenPlanningSideEffectFlags())

assert.equal(loadEditLevelQwenPlanningForUI('premium').level, 'premium')
assert.equal(createEditLevelQwenPlanningSummaryModel('normal').qwenReasoningDepth, 'standard reasoning')
assert.equal(createEditLevelQwenPlanningSummaryModel('premium').qwenReasoningDepth, 'deep creative reasoning')
assert.equal(createEditLevelQwenPlanningSummaryModel('ultra_premium').qwenReasoningDepth, 'studio multi-pass reasoning')
assert.equal(createEditLevelQwenPlanningDimensionListModel('premium').futureGated.length > 0, true)
assert.equal(createEditLevelQwenFallbackNoticeModel('ultra_premium').notices.join(' ').includes('Premium-safe'), true)
assert.equal(createEditLevelQwenUsageEstimateNoticeModel('premium').notice.includes('Estimate only'), true)

assert.equal(createMockEditLevelQwenPlanningProfile({ level: 'normal' }).qwenReasoningDepth, 'standard')
assert.equal(createEditLevelQwenPlanningSummary({ level: 'premium' }).userFacingSummary.includes('deeper Qwen reasoning'), true)
assert.equal(createEditLevelQwenFallbackReport({ level: 'premium' }).fallbacks.length > 0, true)
assert.equal(createEditLevelQwenUsageEstimatePolicy({ level: 'ultra_premium' }).usageEstimatePolicy, 'high_estimate')
assert.equal(runMockEditLevelQwenPlanningFlow('ultra_premium').nextStep, 'RP-EDITLEVEL-08 - Level-Aware QA Gates')
assert.equal(runMockEditLevelQwenPlanningFlow('ultra_premium').selectedPackage.qwenReasoningDepth, 'multi_pass')
assert.equal(runMockNormalQwenPlanningFlow().planningPassPolicy, 'single_pass')
assert.equal(runMockPremiumQwenPlanningFlow().planningPassPolicy, 'two_pass')
assert.equal(runMockUltraQwenPlanningFlow().planningPassPolicy, 'studio_multi_pass')
assert.equal(runMockQwenPromptPolicyFlow().length, 3)
assert.equal(runMockQwenStructuredOutputPolicyFlow().length, 3)
assert.equal(runMockQwenFallbackFlow('premium').fallbacks.length > 0, true)
assert.equal(runMockQwenPlanningValidationFlow().every((result) => result.ok), true)
assert.equal(runMockQwenPlanningReadinessFlow().allSideEffectsFalse, true)
assert.equal(listMockEditLevelQwenPlanningScenarios().length >= 72, true)

for (const filePath of [
  'src/components/edit-level/EditLevelQwenPlanningSummary.tsx',
  'src/components/edit-level/EditLevelQwenPlanningDimensionList.tsx',
  'src/components/edit-level/EditLevelQwenFallbackNotice.tsx',
  'src/components/edit-level/EditLevelQwenUsageEstimateNotice.tsx',
  'src/pages/CreateProjectPage.tsx',
  'src/components/editor/InlineEditLevelCard.tsx',
  'src/components/editor/InlinePlanningContextCard.tsx',
  'src/components/editor/edit-brief/EditBriefSummaryCard.tsx',
]) {
  const source = readRepoFile(filePath)
  assert.equal(source.includes('../backend'), false, `${filePath} must not import backend modules`)
  assert.equal(source.includes('MockDatabase'), false, `${filePath} must not reference MockDatabase`)
}

const docsText = requiredFiles
  .filter((filePath) => filePath.startsWith('docs/'))
  .map(readRepoFile)
  .join('\n')

for (const term of [
  'Qwen planning profile only',
  'no Qwen call',
  'no Qwen2.5-VL call',
  'no DeepSeek call',
  'no provider call',
  'no real planner',
  'no edit plan creation',
  'Marker Chat',
  'Preference DNA',
  'estimate-only',
  'RP-EDITLEVEL-08',
]) {
  assert.ok(docsText.includes(term), `RP-EDITLEVEL-07 docs must include: ${term}`)
}

const migrationCount = readdirSync(new URL('../../supabase/migrations', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .length
assert.equal(migrationCount, 25, 'RP-EDITLEVEL-07 must not create or modify migration files.')

console.log('edit-level-qwen-planning-smoke passed')
