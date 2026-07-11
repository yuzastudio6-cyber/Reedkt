import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'

import {
  createEditLevelCreditEstimateNoticeModel,
  createEditLevelEstimateBoundaryNoticeModel,
  createEditLevelEstimateItemListModel,
  createEditLevelEstimateSummaryModel,
  createEditLevelRenderBudgetNoticeModel,
  createEditLevelRevisionBudgetNoticeModel,
  loadEditLevelEstimatesForUI,
} from '../../src/lib/edit-level-estimates-ui-adapter'
import {
  createAllEditLevelEstimatePackages,
  createEditLevelEstimateBoundarySummary,
  createEditLevelEstimatePackage,
  createEditLevelEstimateSideEffectFlags,
  listEditLevelEstimateItemDefinitions,
} from '../../src/lib/edit-level-estimates-rules'
import {
  createEditLevelEstimateBudgetSummary,
  createEditLevelEstimateTechnicalSummary,
  findEditLevelEstimateItem,
  qwenPassBudgetLabel,
} from '../../src/lib/edit-level-estimates-summaries'
import {
  createEditLevelCreditEstimate,
  createEditLevelEstimateFallbackReport,
  createEditLevelEstimateItemRegistrySummary,
  createEditLevelEstimateSummary as createBackendEstimateSummary,
  createEditLevelRenderBudget,
  createEditLevelRevisionBudget,
  createEditLevelTimeEstimate,
  createMockEditLevelEstimatePackage,
  createMockEditLevelEstimatePackages,
  listEditLevelEstimateItems,
  listMockEditLevelEstimateScenarios,
  runMockCreditEstimateFlow,
  runMockEditLevelEstimateFlow,
  runMockEstimateReadinessFlow,
  runMockEstimateValidationFlow,
  runMockNormalEstimateFlow,
  runMockPremiumEstimateFlow,
  runMockRenderRevisionBudgetFlow,
  runMockTimeEstimateFlow,
  runMockUltraEstimateFlow,
  validateEditLevelEstimatePackage,
} from '../../src/backend'
import type {
  EditLevelEstimateItemId,
  EditLevelEstimatePackage,
  EditLevelEstimateSideEffectFlags,
} from '../../src/types'

const requiredFiles = [
  'src/types/edit-level-estimates.ts',
  'src/lib/edit-level-estimates-rules.ts',
  'src/lib/edit-level-estimates-ui-adapter.ts',
  'src/lib/edit-level-estimates-summaries.ts',
  'src/backend/edit-level-estimates/edit-level-estimate-item-registry.ts',
  'src/backend/edit-level-estimates/edit-level-estimate-package-service.ts',
  'src/backend/edit-level-estimates/edit-level-time-estimate-service.ts',
  'src/backend/edit-level-estimates/edit-level-credit-estimate-service.ts',
  'src/backend/edit-level-estimates/edit-level-render-budget-service.ts',
  'src/backend/edit-level-estimates/edit-level-revision-budget-service.ts',
  'src/backend/edit-level-estimates/edit-level-estimate-fallback-service.ts',
  'src/backend/edit-level-estimates/edit-level-estimate-validation-service.ts',
  'src/backend/edit-level-estimates/edit-level-estimate-summary-service.ts',
  'src/backend/edit-level-estimates/mock-edit-level-estimate-scenarios.ts',
  'src/backend/orchestrators/mock-edit-level-estimate-orchestrator.ts',
  'src/backend/contracts/edit-level-estimate-contracts.ts',
  'src/components/edit-level/EditLevelEstimateSummary.tsx',
  'src/components/edit-level/EditLevelEstimateItemList.tsx',
  'src/components/edit-level/EditLevelCreditEstimateNotice.tsx',
  'src/components/edit-level/EditLevelRenderBudgetNotice.tsx',
  'src/components/edit-level/EditLevelRevisionBudgetNotice.tsx',
  'src/components/edit-level/EditLevelEstimateBoundaryNotice.tsx',
  'server/smoke/edit-level-estimates-smoke.ts',
  'tests/e2e/edit-level-estimates.spec.ts',
  'docs/edit-level-estimates.md',
  'docs/edit-level-time-estimate-policy.md',
  'docs/edit-level-credit-estimate-policy.md',
  'docs/edit-level-render-budget-policy.md',
  'docs/edit-level-revision-budget-policy.md',
  'docs/edit-level-estimates-by-level.md',
  'docs/edit-level-estimates-ui.md',
  'docs/edit-level-estimates-boundary.md',
  'docs/edit-level-estimates-next-e2e.md',
]

const expectedEstimateItemIds: EditLevelEstimateItemId[] = [
  'time_estimate',
  'credit_estimate',
  'analysis_pass_budget',
  'qwen_reasoning_pass_budget',
  'qwen25vl_visual_pass_budget',
  'transcript_pass_budget',
  'audio_pass_budget',
  'graphic_pass_budget',
  'qa_pass_budget',
  'render_pass_budget_future',
  'revision_budget_future',
  'variant_budget_future',
  'storage_budget_future',
  'worker_budget_future',
  'degraded_capability_adjustment',
]

const falseFlagKeys: Array<Exclude<keyof EditLevelEstimateSideEffectFlags, 'mockOnly'>> = [
  'providerCallMade',
  'qwenCallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'plannerExecuted',
  'editPlanCreated',
  'mediaProcessingStarted',
  'workerJobCreated',
  'renderJobCreated',
  'progressStarted',
  'creditRecordCreated',
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

function assertNoSideEffects(flags: EditLevelEstimateSideEffectFlags) {
  assert.equal(flags.mockOnly, true)

  for (const flagKey of falseFlagKeys) {
    assert.equal(flags[flagKey], false, `${flagKey} must remain false`)
  }
}

function assertEstimatePackage(estimatePackage: EditLevelEstimatePackage) {
  assert.equal(estimatePackage.estimateOnly, true)
  assert.equal(estimatePackage.creditsReservedOrSpent, false)
  assert.equal(estimatePackage.creditRecordCreated, false)
  assert.equal(validateEditLevelEstimatePackage({ estimatePackage }).ok, true)
  assertNoSideEffects(estimatePackage)
  assertNoSideEffects(estimatePackage.sideEffectFlags)

  for (const item of estimatePackage.estimateItems) {
    assert.equal(item.estimateOnly, true)
    assertNoSideEffects(item)
    assertNoSideEffects(item.sideEffectFlags)
  }
}

for (const filePath of requiredFiles) {
  assert.equal(existsSync(repoPath(filePath)), true, `Missing RP-EDITLEVEL-09 file: ${filePath}`)
}

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:edit-level-estimates'], 'tsx server/smoke/edit-level-estimates-smoke.ts')

const definitions = listEditLevelEstimateItemDefinitions()
assert.equal(definitions.length, 15)
assert.deepEqual(definitions.map((definition) => definition.estimateId), expectedEstimateItemIds)
assert.equal(listEditLevelEstimateItems().itemCount, 15)
assert.equal(createEditLevelEstimateItemRegistrySummary().itemCount, 15)

const normal = createEditLevelEstimatePackage('normal')
const premium = createEditLevelEstimatePackage('premium')
const ultra = createEditLevelEstimatePackage('ultra_premium')

assert.equal(normal.estimateStatus, 'estimate_ready_mock')
assert.equal(normal.timeEstimateRange.label, '20-45 minutes')
assert.equal(normal.creditEstimateMultiplier, 1)
assert.equal(normal.analysisPassBudget, 1)
assert.equal(normal.qwenReasoningPassBudget, 1)
assert.equal(normal.qwen25vlVisualPassBudget, 'targeted_only')
assert.equal(normal.renderPassBudgetFuture, 1)
assert.equal(normal.revisionBudgetFuture, 1)
assert.equal(normal.variantBudgetFuture, 1)

assert.equal(premium.estimateStatus, 'estimate_ready_with_warnings')
assert.equal(premium.timeEstimateRange.label, '45-90 minutes')
assert.equal(premium.creditEstimateMultiplier, 2)
assert.equal(premium.analysisPassBudget, 2)
assert.equal(premium.qwenReasoningPassBudget, 2)
assert.equal(premium.qwen25vlVisualPassBudget, 'key_moments')
assert.equal(premium.renderPassBudgetFuture, 2)
assert.equal(premium.revisionBudgetFuture, 2)
assert.equal(premium.variantBudgetFuture, 2)

assert.equal(ultra.estimateStatus, 'estimate_degraded_by_missing_tool')
assert.equal(ultra.timeEstimateRange.label, '90-180 minutes')
assert.equal(ultra.creditEstimateMultiplier, 4)
assert.equal(ultra.analysisPassBudget, 3)
assert.equal(ultra.qwenReasoningPassBudget, 'multi_pass')
assert.equal(ultra.qwen25vlVisualPassBudget, 'scene_level')
assert.equal(ultra.renderPassBudgetFuture, 3)
assert.equal(ultra.revisionBudgetFuture, 3)
assert.equal(ultra.variantBudgetFuture, 3)

for (const estimatePackage of [normal, premium, ultra]) {
  assert.equal(estimatePackage.estimateItems.length, 15)
  assert.equal(estimatePackage.futureGatedItems.includes('render_pass_budget_future'), true)
  assert.equal(estimatePackage.futureGatedItems.includes('revision_budget_future'), true)
  assert.equal(estimatePackage.futureGatedItems.includes('variant_budget_future'), true)
  assert.equal(estimatePackage.futureGatedItems.includes('storage_budget_future'), true)
  assert.equal(estimatePackage.futureGatedItems.includes('worker_budget_future'), true)
  assert.equal(estimatePackage.needsProductValueItems.includes('credit_estimate'), true)
  assert.equal(estimatePackage.needsProductValueItems.includes('time_estimate'), true)
  assertEstimatePackage(estimatePackage)
}

assert.equal(premium.degradedItems.includes('qwen25vl_visual_pass_budget'), true)
assert.equal(ultra.degradedItems.includes('degraded_capability_adjustment'), true)
assert.equal(findEditLevelEstimateItem(premium, 'credit_estimate').estimateRange?.label, '2.0x placeholder')
assert.equal(qwenPassBudgetLabel('multi_pass'), 'multi-pass')
assert.equal(createEditLevelEstimateBudgetSummary(ultra).includes('4.0x credit multiplier placeholder'), true)
assert.equal(createEditLevelEstimateTechnicalSummary('premium').includes('all side-effect flags remain false'), true)
assert.equal(createEditLevelEstimateBoundarySummary().join(' ').includes('Estimate only - no credits are reserved'), true)

assert.equal(createAllEditLevelEstimatePackages().length, 3)
assert.equal(createMockEditLevelEstimatePackage({ level: 'normal' }).creditEstimateMultiplier, 1)
assert.equal(createMockEditLevelEstimatePackages().length, 3)
assert.equal(createEditLevelTimeEstimate({ level: 'ultra_premium' }).timeEstimateRange.label, '90-180 minutes')
assert.equal(createEditLevelCreditEstimate({ level: 'premium' }).creditEstimateMultiplier, 2)
assert.equal(createEditLevelRenderBudget({ level: 'ultra_premium' }).renderPassBudgetFuture, 3)
assert.equal(createEditLevelRevisionBudget({ level: 'ultra_premium' }).revisionBudgetFuture, 3)
assert.equal(createEditLevelEstimateFallbackReport({ level: 'ultra_premium' }).fallbacks.join(' ').includes('Premium-safe'), true)
assert.equal(createBackendEstimateSummary({ level: 'premium' }).technicalSummary.includes('Premium'), true)

assert.equal(runMockNormalEstimateFlow().timeEstimateRange.label, '20-45 minutes')
assert.equal(runMockPremiumEstimateFlow().creditEstimateMultiplier, 2)
assert.equal(runMockUltraEstimateFlow().qwenReasoningPassBudget, 'multi_pass')
assert.equal(runMockTimeEstimateFlow('premium').timeEstimateRange.label, '45-90 minutes')
assert.equal(runMockCreditEstimateFlow('ultra_premium').creditEstimateMultiplier, 4)
assert.equal(runMockRenderRevisionBudgetFlow('normal').renderBudget.renderPassBudgetFuture, 1)
assert.equal(runMockEstimateValidationFlow().every((result) => result.ok), true)
assert.equal(runMockEstimateReadinessFlow().allSideEffectsFalse, true)
assert.equal(runMockEditLevelEstimateFlow('premium').nextStep, 'RP-EDITLEVEL-10 — End-to-End Internal Testing + Playwright Coverage')

const uiPackage = loadEditLevelEstimatesForUI('premium')
assert.equal(uiPackage.level, 'premium')
assert.equal(createEditLevelEstimateSummaryModel('normal').timeEstimateSummary, '20-45 minutes')
assert.equal(createEditLevelEstimateSummaryModel('premium').creditEstimateMultiplier, '2.0x')
assert.equal(createEditLevelEstimateSummaryModel('ultra_premium').qwenReasoningPassBudget, 'multi-pass')
assert.equal(createEditLevelEstimateItemListModel('premium').futureGatedItems.length >= 5, true)
assert.equal(createEditLevelCreditEstimateNoticeModel('premium').notice.includes('no credits are reserved, spent, or recorded'), true)
assert.equal(createEditLevelRenderBudgetNoticeModel('ultra_premium').notice.includes('Future render pass budget: 3'), true)
assert.equal(createEditLevelRevisionBudgetNoticeModel('ultra_premium').notice.includes('Future revision budget: 3'), true)
assert.equal(createEditLevelEstimateBoundaryNoticeModel('premium').shortCopy, 'Estimate only - no credits are reserved and no render starts.')

const scenarios = listMockEditLevelEstimateScenarios()
assert.equal(scenarios.length >= 85, true, `Expected at least 85 scenarios, found ${scenarios.length}`)
assert.equal(scenarios.every((scenario) => scenario.mockOnly), true)

for (const flagKey of falseFlagKeys) {
  const unsafePackage = {
    ...premium,
    [flagKey]: true,
    sideEffectFlags: {
      ...premium.sideEffectFlags,
      [flagKey]: true,
    },
  }
  const result = validateEditLevelEstimatePackage({ estimatePackage: unsafePackage })
  assert.equal(result.ok, false, `${flagKey} must be blocked`)
  assert.equal(result.blocked, true, `${flagKey} must block validation`)
}

assertNoSideEffects(createEditLevelEstimateSideEffectFlags())

const docsText = [
  'docs/edit-level-estimates.md',
  'docs/edit-level-time-estimate-policy.md',
  'docs/edit-level-credit-estimate-policy.md',
  'docs/edit-level-render-budget-policy.md',
  'docs/edit-level-revision-budget-policy.md',
  'docs/edit-level-estimates-by-level.md',
  'docs/edit-level-estimates-ui.md',
  'docs/edit-level-estimates-boundary.md',
  'docs/edit-level-estimates-next-e2e.md',
].map(readRepoFile).join('\n')

for (const requiredText of [
  'RP-EDITLEVEL-09',
  'Normal',
  'Premium',
  'Ultra Premium',
  '20-45 minutes',
  '45-90 minutes',
  '90-180 minutes',
  '1.0x',
  '2.0x',
  '4.0x',
  'needsProductValue',
  'estimate-only',
  'no credit reservation',
  'no credit spend',
  'no credit record',
  'no render/export',
  'no worker',
  'no provider call',
  'no real planner',
  'RP-EDITLEVEL-10',
]) {
  assert.equal(docsText.includes(requiredText), true, `Docs missing required text: ${requiredText}`)
}

for (const frontendPath of [
  'src/lib/edit-level-estimates-ui-adapter.ts',
  'src/components/edit-level/EditLevelEstimateSummary.tsx',
  'src/components/edit-level/EditLevelEstimateItemList.tsx',
  'src/components/edit-level/EditLevelCreditEstimateNotice.tsx',
  'src/components/edit-level/EditLevelRenderBudgetNotice.tsx',
  'src/components/edit-level/EditLevelRevisionBudgetNotice.tsx',
  'src/components/edit-level/EditLevelEstimateBoundaryNotice.tsx',
  'src/pages/CreateProjectPage.tsx',
  'src/components/editor/InlineEditLevelCard.tsx',
  'src/components/editor/InlinePlanningContextCard.tsx',
  'src/components/editor/edit-brief/EditBriefSummaryCard.tsx',
]) {
  const source = readRepoFile(frontendPath)
  assert.equal(source.includes('src/backend'), false, `${frontendPath} must not import backend modules`)
  assert.equal(source.includes('MockDatabase'), false, `${frontendPath} must not import MockDatabase`)
}

const migrationCount = readdirSync(repoPath('supabase/migrations'))
  .filter((fileName) => statSync(repoPath(`supabase/migrations/${fileName}`)).isFile())
  .length
assert.equal(migrationCount, 25)

console.log(`RP-EDITLEVEL-09 smoke passed with ${definitions.length} estimate items and ${scenarios.length} scenarios.`)
