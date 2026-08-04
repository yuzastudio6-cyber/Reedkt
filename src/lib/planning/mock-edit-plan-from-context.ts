import type {
  ContextAwareMockEditPlanResult,
  PlanningAssetUsage,
  PlanningContext,
  PlanningContextSummary,
  PlanningCueUsage,
} from '../../types'
import type { EditPlan, PlannerInput, PlanningContextTrace } from '../../types/reeditpro'
import { createMockEditPlan } from '../mock-planner/full'
import {
  appendOrderedUserInstruction,
  normalizeOrderedUserInstructions,
} from '../planning-input-safety'
import { createProfessionalSkillPlan } from '../professional-skills'
import { buildPlanningContextSummary } from './build-planning-context'

type CreateContextAwareMockEditPlanInput = {
  planningContext: PlanningContext
  existingPlannerInput?: PlannerInput
  existingWorkflowChoice?: string
  existingUserPrompt?: string
  fallbackEditPlan?: EditPlan
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`
}

function labels(items: PlanningAssetUsage[]) {
  const labels = items.map((item) => item.label)
  const visibleLabels = labels.slice(0, 8)
  const remainingCount = labels.length - visibleLabels.length

  return [
    visibleLabels.join(', ') || 'none',
    remainingCount > 0 ? `(+${remainingCount} more)` : '',
  ].filter(Boolean).join(' ')
}

function boundedValues(values: string[], limit = 8) {
  const normalized = values.map((value) => value.trim()).filter(Boolean)
  const visibleValues = normalized.slice(0, limit)
  const remainingCount = normalized.length - visibleValues.length

  return [
    visibleValues.join('; '),
    remainingCount > 0 ? `(+${remainingCount} more)` : '',
  ].filter(Boolean).join(' ')
}

function statement(label: string, value: string) {
  const normalizedValue = value.trim()
  return `${label}: ${normalizedValue}${/[.!?]$/.test(normalizedValue) ? '' : '.'}`
}

function appendUniqueInstruction(history: string[], instruction: string | undefined) {
  if (!instruction?.trim()) return history

  const normalizedInstruction = normalizeOrderedUserInstructions([instruction])[0]
  if (!normalizedInstruction || history.includes(normalizedInstruction)) return history

  return appendOrderedUserInstruction(history, normalizedInstruction)
}

function cueSummary(cueUsages: PlanningCueUsage[]) {
  const willUse = cueUsages.filter((cue) => cue.status === 'will_use').length
  const willAdjust = cueUsages.filter((cue) => cue.status === 'will_adjust').length
  const needsReview = cueUsages.filter((cue) => cue.status === 'needs_review').length
  const blocked = cueUsages.filter((cue) => cue.status === 'blocked').length

  return `${willUse} will use, ${willAdjust} will adjust, ${needsReview} need review, ${blocked} blocked`
}

function buildContextInstruction(context: PlanningContext) {
  const mustUseAssets = context.sourceAssets.filter((asset) => asset.status === 'must_use' || asset.status === 'main_footage')
  const avoidAssets = context.sourceAssets.filter((asset) => asset.status === 'avoid' || asset.status === 'do_not_use')
  const readyCueTitles = context.cueUsages
    .filter((cue) => cue.status === 'will_use' || cue.status === 'will_adjust')
    .map((cue) => cue.title)
    .slice(0, 5)
  const reviewCueTitles = context.cueUsages
    .filter((cue) => cue.status === 'needs_review' || cue.status === 'blocked')
    .map((cue) => cue.title)
    .slice(0, 5)
  const brief = context.editBrief
  const editBriefDirection = brief
    ? [
        brief.goal?.trim() ? statement('Edit Brief goal', brief.goal) : '',
        brief.audience?.trim() ? statement('Audience', brief.audience) : '',
        brief.targetPlatforms.length ? statement('Target platforms', brief.targetPlatforms.join(', ')) : '',
        brief.targetDurationMs ? statement('Target duration', formatDuration(brief.targetDurationMs)) : '',
        brief.styleKeywords.length ? statement('Style keywords', boundedValues(brief.styleKeywords)) : '',
        brief.pacingPreference ? statement('Pacing preference', brief.pacingPreference) : '',
        brief.captionPreference ? statement('Caption preference', brief.captionPreference) : '',
        brief.musicPreference ? statement('Music preference', brief.musicPreference) : '',
        brief.bRollPreference?.trim() ? statement('B-roll preference', brief.bRollPreference) : '',
        brief.brandNotes?.trim() ? statement('Brand notes', brief.brandNotes) : '',
        brief.specialInstructions?.trim() ? statement('Special instructions', brief.specialInstructions) : '',
        brief.mustUseAssetIds.length ? statement('Brief must-use asset IDs', boundedValues(brief.mustUseAssetIds)) : '',
        brief.avoidAssetIds.length ? statement('Brief avoid asset IDs', boundedValues(brief.avoidAssetIds)) : '',
        brief.mustIncludeNotes.length ? statement('Must include', boundedValues(brief.mustIncludeNotes)) : '',
        brief.avoidNotes.length ? statement('Avoid', boundedValues(brief.avoidNotes)) : '',
        brief.userProvidedReferenceUrls.length
          ? statement('User-provided reference links', boundedValues(brief.userProvidedReferenceUrls, 5))
          : '',
      ].filter(Boolean)
    : ['Edit Brief: not provided.']

  return [
    'Planning Context:',
    `Plan from Clean Assembly ${context.cleanAssembly.cleanAssemblyId} v${context.cleanAssembly.version}, duration ${formatDuration(context.cleanAssembly.durationMs)}.`,
    `Cleanup review accepted: ${context.cleanAssembly.accepted ? 'yes' : 'no'}.`,
    `Must-use or main assets: ${labels(mustUseAssets)}.`,
    `Avoid or do-not-use assets: ${labels(avoidAssets)}.`,
    ...editBriefDirection,
    readyCueTitles.length ? `Ready cues to use: ${readyCueTitles.join(', ')}.` : 'No ready cues were provided.',
    reviewCueTitles.length ? `Cues needing review or blocked: ${reviewCueTitles.join(', ')}.` : 'No cue review blockers were provided.',
    context.unresolvedConflictIds.length ? `Unresolved cue conflicts: ${context.unresolvedConflictIds.join(', ')}.` : 'No unresolved cue conflicts.',
    context.status === 'blocked'
      ? 'Create a draft plan only; generation must wait for blocking issues to be resolved.'
      : 'Create a mock AI Edit Plan from the planning context; generation still waits for plan and credit approval.',
  ].join('\n')
}

export function createPlanningContextTrace(
  context: PlanningContext,
  readinessSummary: PlanningContextSummary = buildPlanningContextSummary(context),
  selectedSkillCount = 0,
  selectedSkillFamilies: string[] = [],
): PlanningContextTrace {
  const editBriefDirectionCount = [
    context.editBrief?.goal,
    context.editBrief?.audience,
    context.editBrief?.targetPlatforms.length ? 'platforms' : undefined,
    context.editBrief?.targetDurationMs ? 'duration' : undefined,
    context.editBrief?.styleKeywords.length ? 'style' : undefined,
    context.editBrief?.pacingPreference,
    context.editBrief?.captionPreference,
    context.editBrief?.musicPreference,
    context.editBrief?.bRollPreference,
    context.editBrief?.brandNotes,
    context.editBrief?.specialInstructions,
    context.editBrief?.mustUseAssetIds.length ? 'must-use-assets' : undefined,
    context.editBrief?.avoidAssetIds.length ? 'avoid-assets' : undefined,
    context.editBrief?.mustIncludeNotes.length ? 'must-include-notes' : undefined,
    context.editBrief?.avoidNotes.length ? 'avoid-notes' : undefined,
    context.editBrief?.userProvidedReferenceUrls.length ? 'reference-links' : undefined,
  ].filter(Boolean).length

  return {
    source: 'planning_context',
    planningContextId: context.id,
    status: context.status,
    editBriefReady: readinessSummary.editBriefReady,
    editBriefOptional: true,
    editBriefDirectionCount,
    cueUsageCount: readinessSummary.totalCues,
    readyCueUsageCount: readinessSummary.readyCues,
    blockedCueUsageCount: readinessSummary.blockedCues,
    unresolvedConflictCount: readinessSummary.unresolvedConflicts,
    sourceAssetCount: readinessSummary.totalAssets,
    mustUseAssetCount: readinessSummary.mustUseAssets,
    avoidAssetCount: readinessSummary.avoidAssets,
    selectedSkillCount,
    selectedSkillFamilies,
  }
}

export function createContextAwarePlannerInput(
  context: PlanningContext,
  existingPlannerInput: PlannerInput,
  existingUserPrompt?: string,
): PlannerInput {
  const contextInstruction = buildContextInstruction(context)
  const baseInstructionHistory = normalizeOrderedUserInstructions(
    existingPlannerInput.userInstructionHistory,
    existingPlannerInput.customInstructions,
  )
  const instructionHistoryWithPrompt = appendUniqueInstruction(
    baseInstructionHistory,
    existingUserPrompt,
  )
  const userInstructionHistory = appendUniqueInstruction(
    instructionHistoryWithPrompt,
    contextInstruction,
  )
  const customInstructionParts = [
    existingPlannerInput.customInstructions,
    existingUserPrompt,
    contextInstruction,
  ].reduce<string[]>((parts, instruction) => appendUniqueInstruction(parts, instruction), [])

  return {
    ...existingPlannerInput,
    customInstructions: customInstructionParts.join('\n\n'),
    userInstructionHistory,
  }
}

export function attachPlanningContextTraceToEditPlan(
  editPlan: EditPlan,
  context: PlanningContext,
  readinessSummary?: PlanningContextSummary,
): EditPlan {
  const skillPlan = editPlan.professionalSkillPlan

  return {
    ...editPlan,
    planningContextTrace: createPlanningContextTrace(
      context,
      readinessSummary,
      skillPlan?.selectedSkillCount ?? 0,
      skillPlan?.selectedFamilies ?? [],
    ),
  }
}

function buildPlanSummary(context: PlanningContext, readinessSummary: PlanningContextSummary, skillSummary: string) {
  const mustUseCount = readinessSummary.mustUseAssets
  const avoidCount = readinessSummary.avoidAssets
  const cueCopy = cueSummary(context.cueUsages)
  const issueCopy = readinessSummary.blockingIssues > 0
    ? `${readinessSummary.blockingIssues} blocking issue${readinessSummary.blockingIssues === 1 ? '' : 's'}`
    : readinessSummary.warnings > 0
      ? `${readinessSummary.warnings} warning${readinessSummary.warnings === 1 ? '' : 's'}`
      : 'no readiness issues'

  return [
    `AI Edit Plan draft uses Clean Assembly v${context.cleanAssembly.version} (${formatDuration(context.cleanAssembly.durationMs)}).`,
    `It understands ${context.sourceAssets.length} source asset${context.sourceAssets.length === 1 ? '' : 's'}, including ${mustUseCount} must-use/main and ${avoidCount} avoid/do-not-use asset${avoidCount === 1 ? '' : 's'}.`,
    context.editBrief?.goal ? `Edit Brief direction: ${context.editBrief.goal}` : 'No Edit Brief was used; planning continues from the user prompt, Clean Assembly, and Source Library context.',
    skillSummary,
    `Edit Cue usage: ${cueCopy}.`,
    `Planning readiness: ${context.status} with ${issueCopy}.`,
    'Professional Integration remains a future stage; cues are planning direction, not render commands.',
  ].join(' ')
}

export function createContextAwareMockEditPlan(input: CreateContextAwareMockEditPlanInput): ContextAwareMockEditPlanResult {
  const readinessSummary = buildPlanningContextSummary(input.planningContext)
  const contextAwarePlannerInput = input.existingPlannerInput
    ? createContextAwarePlannerInput(
        input.planningContext,
        input.existingPlannerInput,
        input.existingUserPrompt,
      )
    : undefined
  const professionalSkillPlan = createProfessionalSkillPlan({
    planningContext: input.planningContext,
    plannerInput: contextAwarePlannerInput ?? input.existingPlannerInput ?? {
      projectName: input.planningContext.projectId,
      targetPlatform: 'custom',
      aspectRatio: 'let_ai_decide',
      editingCategory: 'storytelling',
      workflowType: 'custom_let_ai_decide',
      editLevel: 'basic',
      structurePreference: 'let_ai_recommend',
      moodStyle: 'let_ai_decide',
      visualPreference: 'balanced_visual_mix',
      referenceUrl: '',
      customInstructions: '',
      creditPreference: 'balanced',
      clips: [],
    },
  })
  const editPlan = input.existingPlannerInput
    ? createMockEditPlan(contextAwarePlannerInput!)
    : input.fallbackEditPlan

  if (!editPlan) {
    throw new Error('createContextAwareMockEditPlan requires existingPlannerInput or fallbackEditPlan.')
  }

  const skillAwareEditPlan: EditPlan = {
    ...editPlan,
    goalSummary: input.planningContext.editBrief?.goal?.trim() || editPlan.goalSummary,
    professionalSkillPlan,
  }
  const tracedEditPlan = attachPlanningContextTraceToEditPlan(skillAwareEditPlan, input.planningContext, readinessSummary)

  return {
    planningContext: input.planningContext,
    editPlan: tracedEditPlan,
    planSummary: buildPlanSummary(input.planningContext, readinessSummary, professionalSkillPlan.userFacingSummary),
    professionalSkillPlan,
    cueUsageSummary: input.planningContext.cueUsages,
    assetUsageSummary: input.planningContext.sourceAssets,
    readinessSummary,
  }
}
