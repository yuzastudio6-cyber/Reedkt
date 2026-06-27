import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'

import {
  createEditLevelQAFallbackNoticeModel,
  createEditLevelQAGateListModel,
  createEditLevelQAGateSummaryModel,
  createEditLevelQAReadinessCardModel,
  loadEditLevelQAGatesForUI,
} from '../../src/lib/edit-level-qa-gates-ui-adapter'
import {
  createAllEditLevelQAGatePackages,
  createEditLevelQAGateBoundarySummary,
  createEditLevelQAGatePackage,
  createEditLevelQAGateSideEffectFlags,
  listEditLevelQAGateDefinitions,
} from '../../src/lib/edit-level-qa-gates-rules'
import {
  createEditLevelQAGateStatusSummary,
  createEditLevelQAGateSummary,
  createEditLevelQAGateTechnicalSummary,
  createEditLevelQAGateUserSummary,
  findEditLevelQAGateRoute,
  qaReadinessLabel,
  qaStrictnessLabel,
} from '../../src/lib/edit-level-qa-gates-summaries'
import {
  createEditLevelQAFallbackReport,
  createEditLevelQAGateRegistrySummary,
  createEditLevelQAGateSummary as createBackendQAGateSummary,
  createEditLevelQAReadinessReport,
  createMockEditLevelQAGatePackage,
  createMockEditLevelQAGatePackages,
  listEditLevelQAGates,
  listMockEditLevelQAGateScenarios,
  runMockEditLevelQAGateFlow,
  runMockNormalQAGateFlow,
  runMockPremiumQAGateFlow,
  runMockQAGateFallbackFlow,
  runMockQAGateReadinessFlow,
  runMockQAGateValidationFlow,
  runMockUltraQAGateFlow,
  validateEditLevelQAGatePackage,
} from '../../src/backend'
import type {
  EditLevelQAGateId,
  EditLevelQAGatePackage,
  EditLevelQAGateSideEffectFlags,
} from '../../src/types'

const requiredFiles = [
  'src/types/edit-level-qa-gates.ts',
  'src/lib/edit-level-qa-gates-rules.ts',
  'src/lib/edit-level-qa-gates-ui-adapter.ts',
  'src/lib/edit-level-qa-gates-summaries.ts',
  'src/backend/edit-level-qa-gates/edit-level-qa-gate-registry.ts',
  'src/backend/edit-level-qa-gates/edit-level-qa-gate-routing-service.ts',
  'src/backend/edit-level-qa-gates/edit-level-qa-readiness-service.ts',
  'src/backend/edit-level-qa-gates/edit-level-qa-fallback-service.ts',
  'src/backend/edit-level-qa-gates/edit-level-qa-validation-service.ts',
  'src/backend/edit-level-qa-gates/edit-level-qa-summary-service.ts',
  'src/backend/edit-level-qa-gates/mock-edit-level-qa-gate-scenarios.ts',
  'src/backend/orchestrators/mock-edit-level-qa-gate-orchestrator.ts',
  'src/backend/contracts/edit-level-qa-gate-contracts.ts',
  'src/components/edit-level/EditLevelQAGateSummary.tsx',
  'src/components/edit-level/EditLevelQAGateList.tsx',
  'src/components/edit-level/EditLevelQAGateBadge.tsx',
  'src/components/edit-level/EditLevelQAFallbackNotice.tsx',
  'src/components/edit-level/EditLevelQAReadinessCard.tsx',
  'server/smoke/edit-level-qa-gates-smoke.ts',
  'tests/e2e/edit-level-qa-gates.spec.ts',
  'docs/edit-level-qa-gates.md',
  'docs/edit-level-qa-gate-registry.md',
  'docs/edit-level-qa-by-level.md',
  'docs/edit-level-qa-readiness-policy.md',
  'docs/edit-level-qa-fallback-policy.md',
  'docs/edit-level-qa-gates-ui.md',
  'docs/edit-level-qa-gates-boundary.md',
  'docs/edit-level-qa-gates-next-estimates.md',
]

const expectedGateIds: EditLevelQAGateId[] = [
  'safety_do_not_copy',
  'copy_risk',
  'source_video_present',
  'source_metadata_ready',
  'export_settings_valid',
  'caption_safe_zone',
  'caption_readability',
  'audio_basic_sanity',
  'audio_music_ducking',
  'sfx_restraint',
  'sound_design_coherence',
  'marker_missing_asset',
  'marker_needs_clarification',
  'marker_conflict',
  'marker_time_range_valid',
  'edit_brief_priority_consistency',
  'preference_dna_match',
  'qwen_response_validation',
  'qwen25vl_visual_confidence',
  'transcript_coverage',
  'source_context_coverage',
  'broll_timing',
  'pacing_consistency',
  'story_arc_quality',
  'style_consistency',
  'graphic_layout_consistency',
  'plan_completeness',
  'render_readiness_future',
  'revision_budget_future',
  'credit_gate_future',
]

const falseFlagKeys: Array<Exclude<keyof EditLevelQAGateSideEffectFlags, 'mockOnly'>> = [
  'providerCallMade',
  'qwenCallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'plannerExecuted',
  'editPlanCreated',
  'mediaProcessingStarted',
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

function assertNoSideEffects(flags: EditLevelQAGateSideEffectFlags) {
  assert.equal(flags.mockOnly, true)

  for (const flagKey of falseFlagKeys) {
    assert.equal(flags[flagKey], false, `${flagKey} must remain false`)
  }
}

function assertPackageNoSideEffects(qaPackage: EditLevelQAGatePackage) {
  assertNoSideEffects(qaPackage)
  assertNoSideEffects(qaPackage.sideEffectFlags)

  for (const gate of qaPackage.gates) {
    assertNoSideEffects(gate)
    assertNoSideEffects(gate.sideEffectFlags)
  }
}

for (const filePath of requiredFiles) {
  assert.equal(existsSync(repoPath(filePath)), true, `Missing RP-EDITLEVEL-08 file: ${filePath}`)
}

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:edit-level-qa-gates'], 'tsx server/smoke/edit-level-qa-gates-smoke.ts')

const definitions = listEditLevelQAGateDefinitions()
assert.equal(definitions.length, 30)
assert.deepEqual(definitions.map((definition) => definition.gateId), expectedGateIds)
assert.equal(listEditLevelQAGates().gateCount, 30)
assert.equal(createEditLevelQAGateRegistrySummary().gateCount, 30)

const normal = createEditLevelQAGatePackage('normal')
const premium = createEditLevelQAGatePackage('premium')
const ultra = createEditLevelQAGatePackage('ultra_premium')

assert.equal(normal.qaStrictness, 'baseline')
assert.equal(normal.readinessStatus, 'ready_for_mock_planning')
assert.equal(normal.requiredGates.includes('safety_do_not_copy'), true)
assert.equal(normal.warningOnlyGates.includes('marker_conflict'), true)
assert.equal(normal.futureOnlyGates.includes('render_readiness_future'), true)
assert.equal(findEditLevelQAGateRoute(normal, 'audio_music_ducking').requiredness, 'not_used')

assert.equal(premium.qaStrictness, 'premium')
assert.equal(premium.readinessStatus, 'ready_with_warnings')
assert.equal(premium.requiredGates.includes('caption_readability'), true)
assert.equal(premium.recommendedGates.includes('audio_music_ducking'), true)
assert.equal(premium.warningOnlyGates.includes('qwen25vl_visual_confidence'), true)
assert.equal(premium.requiredGates.includes('plan_completeness'), true)

assert.equal(ultra.qaStrictness, 'ultra')
assert.equal(ultra.readinessStatus, 'blocked_by_future_runtime_gate')
assert.equal(ultra.requiredGates.includes('story_arc_quality'), true)
assert.equal(ultra.requiredGates.includes('style_consistency'), true)
assert.equal(ultra.requiredGates.includes('graphic_layout_consistency'), true)
assert.equal(ultra.requiredGates.includes('preference_dna_match'), true)
assert.equal(ultra.futureOnlyGates.includes('render_readiness_future'), true)
assert.equal(ultra.futureOnlyGates.includes('revision_budget_future'), true)
assert.equal(ultra.futureOnlyGates.includes('credit_gate_future'), true)
assert.equal(ultra.degradedGates.includes('qwen25vl_visual_confidence'), true)

for (const qaPackage of [normal, premium, ultra]) {
  assert.equal(qaPackage.gates.length, 30)
  assert.equal(validateEditLevelQAGatePackage({ qaPackage }).ok, true)
  assertPackageNoSideEffects(qaPackage)
}

assert.equal(createAllEditLevelQAGatePackages().length, 3)
assert.equal(createMockEditLevelQAGatePackage({ level: 'premium' }).qaStrictness, 'premium')
assert.equal(createMockEditLevelQAGatePackages().length, 3)
assert.equal(createEditLevelQAReadinessReport({ level: 'ultra_premium' }).readinessStatus, 'blocked_by_future_runtime_gate')
assert.equal(createEditLevelQAFallbackReport({ level: 'ultra_premium' }).fallbacks.join(' ').includes('Premium-safe'), true)
assert.equal(createBackendQAGateSummary({ level: 'premium' }).gateCount, 30)

assert.equal(qaStrictnessLabel('baseline'), 'baseline QA')
assert.equal(qaStrictnessLabel('premium'), 'stronger creative QA')
assert.equal(qaStrictnessLabel('ultra'), 'studio-level strict QA')
assert.equal(qaReadinessLabel('blocked_by_future_runtime_gate'), 'blocked by future runtime gate')
assert.equal(createEditLevelQAGateUserSummary('premium').includes('stronger creative QA'), true)
assert.equal(createEditLevelQAGateTechnicalSummary('premium').includes('all side-effect flags remain false'), true)
assert.equal(createEditLevelQAGateStatusSummary(ultra).includes('future-gated'), true)
assert.equal(createEditLevelQAGateSummary(findEditLevelQAGateRoute(premium, 'caption_readability')).includes('Caption readability'), true)
assert.equal(createEditLevelQAGateBoundarySummary().join(' ').includes('no QA tool executes'), true)

assert.equal(loadEditLevelQAGatesForUI('normal').qaStrictness, 'baseline')
assert.equal(createEditLevelQAGateSummaryModel('normal').qaStrictnessLabel, 'baseline QA')
assert.equal(createEditLevelQAGateSummaryModel('premium').qaStrictnessLabel, 'stronger creative QA')
assert.equal(createEditLevelQAGateSummaryModel('ultra_premium').qaStrictnessLabel, 'studio-level strict QA')
assert.equal(createEditLevelQAGateListModel('premium').futureGated.length >= 3, true)
assert.equal(createEditLevelQAFallbackNoticeModel('ultra_premium').boundary.includes('No Qwen'), true)
assert.equal(createEditLevelQAReadinessCardModel('ultra_premium').readinessStatus, 'blocked_by_future_runtime_gate')

for (const flagKey of falseFlagKeys) {
  const unsafe = {
    ...premium,
    [flagKey]: true,
    sideEffectFlags: {
      ...premium.sideEffectFlags,
      [flagKey]: true,
    },
  } as never

  assert.equal(validateEditLevelQAGatePackage({ qaPackage: unsafe }).blocked, true, `${flagKey} should block validation`)
}

assertNoSideEffects(createEditLevelQAGateSideEffectFlags())
assert.equal(runMockNormalQAGateFlow().qaStrictness, 'baseline')
assert.equal(runMockPremiumQAGateFlow().qaStrictness, 'premium')
assert.equal(runMockUltraQAGateFlow().qaStrictness, 'ultra')
assert.equal(runMockQAGateFallbackFlow('premium').mockOnly, true)
assert.equal(runMockQAGateValidationFlow().every((result) => result.ok), true)
assert.equal(runMockQAGateReadinessFlow().allSideEffectsFalse, true)
assert.equal(runMockEditLevelQAGateFlow('premium').nextStep, 'RP-EDITLEVEL-09 - Level-Aware Estimates: Time, Credits, Render Budget')
assert.equal(listMockEditLevelQAGateScenarios().length >= 80, true)

const docsText = [
  'docs/edit-level-qa-gates.md',
  'docs/edit-level-qa-gate-registry.md',
  'docs/edit-level-qa-by-level.md',
  'docs/edit-level-qa-readiness-policy.md',
  'docs/edit-level-qa-fallback-policy.md',
  'docs/edit-level-qa-gates-ui.md',
  'docs/edit-level-qa-gates-boundary.md',
  'docs/edit-level-qa-gates-next-estimates.md',
].map(readRepoFile).join('\n')

for (const term of [
  'normal',
  'premium',
  'ultra_premium',
  'baseline QA',
  'stronger creative QA',
  'studio-level strict QA',
  'render',
  'revision',
  'credit',
  'no runtime implementation',
  'No Qwen',
  'No Qwen2.5-VL',
  'DeepSeek',
  'mockOnly: true',
]) {
  assert.equal(docsText.includes(term), true, `Docs missing term: ${term}`)
}

const frontendFiles = [
  readRepoFile('src/components/edit-level/EditLevelQAGateSummary.tsx'),
  readRepoFile('src/components/edit-level/EditLevelQAGateList.tsx'),
  readRepoFile('src/components/edit-level/EditLevelQAGateBadge.tsx'),
  readRepoFile('src/components/edit-level/EditLevelQAFallbackNotice.tsx'),
  readRepoFile('src/components/edit-level/EditLevelQAReadinessCard.tsx'),
  readRepoFile('src/pages/CreateProjectPage.tsx'),
  readRepoFile('src/components/editor/InlineEditLevelCard.tsx'),
  readRepoFile('src/components/editor/InlinePlanningContextCard.tsx'),
  readRepoFile('src/components/editor/edit-brief/EditBriefSummaryCard.tsx'),
].join('\n')

assert.equal(frontendFiles.includes("from '../../src/backend'"), false)
assert.equal(frontendFiles.includes("from '../../backend"), false)
assert.equal(frontendFiles.includes("from '../../../backend"), false)
assert.equal(frontendFiles.includes('MockDatabase'), false)

const migrationDir = repoPath('supabase/migrations')
const migrationCount = readdirSync(migrationDir).filter((entry) => statSync(new URL(entry, `${migrationDir.href}/`)).isFile()).length
assert.equal(migrationCount, 25)

console.log(`RP-EDITLEVEL-08 QA gate smoke passed with ${definitions.length} gates and ${listMockEditLevelQAGateScenarios().length} scenarios.`)
