import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  approvedSnapshotInternalTestAdapterToolNames,
  createProfessionalSkillPlan,
  listProfessionalSkillHiddenAdapterNames,
  summarizeProfessionalBackendPreparation,
} from '../../src/lib/professional-skills'
import {
  hideInternalToolNamesInCopy,
  userFacingActivityLabel,
  userFacingActivityList,
} from '../../src/lib/tool-display-labels'
import {
  createEditLevelQwenFallbackNoticeModel,
  createEditLevelQwenPlanningSummaryModel,
  createEditLevelQwenUsageEstimateNoticeModel,
} from '../../src/lib/edit-level-qwen-planning-ui-adapter'
import {
  createEditLevelToolCapabilitySummaryModel,
  createEditLevelToolFallbackNoticeModel,
} from '../../src/lib/edit-level-tool-router-ui-adapter'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  createProfessionalToolAdapterPlan,
  resolveProfessionalToolAdapterContract,
} from '../tool-registry'

const plannerInput: PlannerInput = {
  projectName: 'User-facing copy boundary smoke',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'education_explainer',
  workflowType: 'education_explainer',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'premium',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Clean the voice, add readable captions, use a simple data visual, and keep the edit polished.',
  creditPreference: 'balanced',
  clips: [
    {
      id: 'clip-user-facing-copy-1',
      uploadedOrder: 1,
      fileName: 'user-facing-copy-source.mp4',
      duration: '0:42',
      detectedType: 'talking_head',
      sourceOrderLocked: true,
    },
  ],
}

const readyAdapterNames = approvedSnapshotInternalTestAdapterToolNames
const hiddenAdapterNames = listProfessionalSkillHiddenAdapterNames()
const forbiddenTerms = [
  ...new Set([
    ...readyAdapterNames,
    ...hiddenAdapterNames,
    'Qwen',
    'Qwen 3.7',
    'Qwen 3.7 Max',
    'Qwen2.5-VL',
    'DeepSeek',
    'DeepSeek V4 Pro',
    'provider',
    'provider calls',
    'backend',
    'backend required',
    'worker',
    'worker-only',
    'source-truth',
    'source_truth',
    'external service required',
    'tool-code',
  ]),
]

const checks: string[] = []

for (const name of forbiddenTerms) {
  const sanitized = hideInternalToolNamesInCopy(`Preparing ${name} with backend provider source-truth checks.`)
  assertClean(`sanitizer_${name}`, sanitized)
}
checks.push('sanitizer_covers_ready_adapter_names')

const professionalSkillPlan = createProfessionalSkillPlan({ plannerInput })
const preparationSummaries = summarizeProfessionalBackendPreparation(professionalSkillPlan.backendIntents)
const professionalSkillUserCopy = [
  professionalSkillPlan.userFacingSummary,
  ...professionalSkillPlan.userFacingActivities,
  ...professionalSkillPlan.warnings,
  ...professionalSkillPlan.blockers,
  ...professionalSkillPlan.activityGroups.flatMap((group) => [group.label, group.userFacingSummary]),
  ...professionalSkillPlan.selectedSkills.flatMap((skill) => [
    skill.userFacingName,
    skill.userFacingActivity,
    skill.reason,
    ...skill.selectionEvidence.flatMap((evidence) => [evidence.label, evidence.summary]),
  ]),
  ...preparationSummaries.flatMap((summary) => [summary.label, summary.summary]),
]
for (const value of professionalSkillUserCopy) assertClean('professional_skill_plan_user_copy', value)
assert.equal(professionalSkillPlan.editBriefOptional, true)
assert.equal(professionalSkillPlan.promptFirstPlanning, true)
checks.push('professional_skill_plan_user_copy_hides_internal_names')

const adapterPlan = createProfessionalToolAdapterPlan({
  workspaceId: 'workspace-user-copy-boundary-smoke',
  projectId: 'project-user-copy-boundary-smoke',
  requestedToolNames: [...readyAdapterNames],
  mode: 'dry_run',
  evidence: {
    approvedPlanSnapshotId: 'approved-snapshot-user-copy-boundary-smoke',
    privateArtifactRefs: [{ artifactId: 'private-reference', storageObjectPath: 'private/review/reference.json' }],
  },
})
assertClean('adapter_plan_user_facing_summary', adapterPlan.userFacingSummary)
assertClean('adapter_plan_user_facing_readiness_summary', adapterPlan.userFacingReadinessSummary)
for (const name of readyAdapterNames) {
  const contract = resolveProfessionalToolAdapterContract(name)
  assert.ok(contract, `Expected adapter contract for ${name}.`)
  assertClean(`adapter_contract_${name}_activity`, contract.userFacingActivity)
  assertClean(`adapter_activity_label_${name}`, userFacingActivityLabel(name))
}
assertClean('adapter_activity_list', userFacingActivityList([...readyAdapterNames]))
checks.push('adapter_plan_user_copy_hides_internal_names')

const unresolvedSourceTruthPlan = createProfessionalToolAdapterPlan({
  workspaceId: 'workspace-user-copy-boundary-smoke',
  projectId: 'project-user-copy-boundary-smoke',
  requestedToolNames: ['paddleocr', 'pyav', 'revideo', 'ffmpeg'],
  mode: 'bounded_execution',
  evidence: {
    approvedPlanSnapshotId: 'approved-snapshot-user-copy-boundary-smoke',
  },
})
const unresolvedInternalNames = ['paddleocr', 'pyav', 'revideo', 'ffmpeg']
const unresolvedUserFacingCopy = [
  unresolvedSourceTruthPlan.userFacingSummary,
  unresolvedSourceTruthPlan.userFacingReadinessSummary,
  ...unresolvedSourceTruthPlan.sourceTruthIssues.map((issue) => issue.userFacingSummary),
]
for (const value of unresolvedUserFacingCopy) {
  assertClean('unresolved_source_truth_user_copy', value)
  for (const name of unresolvedInternalNames) {
    assert.equal(
      containsForbiddenTerm(value, name),
      false,
      `Unresolved source-truth user copy exposes internal package "${name}" in "${value}".`,
    )
  }
}
checks.push('unresolved_source_truth_user_copy_hides_internal_names')

const editLevelUiCopy = [
  ...collectStringValues(createEditLevelToolCapabilitySummaryModel('normal')),
  ...collectStringValues(createEditLevelToolCapabilitySummaryModel('premium')),
  ...collectStringValues(createEditLevelToolCapabilitySummaryModel('ultra_premium')),
  ...collectStringValues(createEditLevelToolFallbackNoticeModel('premium')),
  ...collectStringValues(createEditLevelQwenPlanningSummaryModel('normal')),
  ...collectStringValues(createEditLevelQwenPlanningSummaryModel('premium')),
  ...collectStringValues(createEditLevelQwenPlanningSummaryModel('ultra_premium')),
  ...collectStringValues(createEditLevelQwenFallbackNoticeModel('premium')),
  ...collectStringValues(createEditLevelQwenUsageEstimateNoticeModel('premium')),
]
for (const value of editLevelUiCopy) assertClean('edit_level_ui_model_copy', value)
checks.push('edit_level_ui_models_hide_model_provider_names')

const advancedCapabilitySources = [
  await readFile('src/components/editor/InlineToolRegistryCard.tsx', 'utf8'),
  await readFile('src/components/editor/InlineLaunchToolStackCard.tsx', 'utf8'),
  await readFile('src/components/editor/planning-context/PlanningSkillSummaryCard.tsx', 'utf8'),
]
const staleVisiblePhrases = [
  'Backend activity planning',
  'No browser execution',
  'Backend gate pending',
  'Provider models separate',
  'Worker-only',
  'Backend/worker asset pipeline',
  'source-truth checks',
]
for (const phrase of staleVisiblePhrases) {
  assert.equal(
    advancedCapabilitySources.some((source) => source.includes(phrase)),
    false,
    `Advanced capability UI source still contains stale visible phrase: ${phrase}`,
  )
}
checks.push('advanced_capability_copy_uses_product_language')

console.log(JSON.stringify({
  ok: true,
  suite: 'editor_user_facing_copy_boundary',
  checks,
  readyAdapterNameCount: readyAdapterNames.length,
  hiddenAdapterNameCount: hiddenAdapterNames.length,
  sampledProfessionalSkillCopyCount: professionalSkillUserCopy.length,
  sampledEditLevelUiCopyCount: editLevelUiCopy.length,
}, null, 2))

function collectStringValues(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStringValues)
  if (!value || typeof value !== 'object') return []

  return Object.values(value as Record<string, unknown>).flatMap(collectStringValues)
}

function assertClean(label: string, value: string): void {
  for (const term of forbiddenTerms) {
    assert.equal(
      containsForbiddenTerm(value, term),
      false,
      `${label} exposes internal term "${term}" in "${value}".`,
    )
  }
}

function containsForbiddenTerm(value: string, term: string): boolean {
  const normalized = value.toLowerCase()
  const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+')
  const pattern = /^[a-z0-9_.+-]+$/i.test(term)
    ? new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i')
    : new RegExp(escaped, 'i')

  return pattern.test(normalized)
}
