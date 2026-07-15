import type {
  AspectRatio,
  CompiledEditingIntent,
  FrameTemplateType,
  PlannerInput,
  PlanningInputTrace,
  TargetPlatform,
  VisualPreference,
} from '../types/reeditpro'

export const MAX_USER_INSTRUCTION_HISTORY = 64
export const MAX_USER_INSTRUCTION_LENGTH = 4_000

export type MaterialPlanningState = Pick<
  PlannerInput,
  | 'aspectRatio'
  | 'editLevel'
  | 'frameTemplateType'
  | 'targetPlatform'
  | 'visualPreference'
  | 'workflowType'
  | 'cleanupPreference'
  | 'moodStyle'
  | 'creditPreference'
>

export type MaterialPlanningInstructionResolution = {
  next: MaterialPlanningState
  changedFields: Array<keyof MaterialPlanningState>
  invalidates: {
    outputFrame: boolean
    editLevel: boolean
    visualPreference: boolean
    cleanupPreference: boolean
    editPreferences: boolean
  }
  reasons: string[]
}

type MaterialInstructionPatch = Partial<MaterialPlanningState>

export function appendOrderedUserInstruction(history: string[], instruction: string): string[] {
  const normalizedHistory = history
    .map(normalizeInstruction)
    .filter(Boolean)
  const normalizedInstruction = normalizeInstruction(instruction)

  if (!normalizedInstruction) return normalizedHistory.slice(-MAX_USER_INSTRUCTION_HISTORY)
  return [...normalizedHistory, normalizedInstruction].slice(-MAX_USER_INSTRUCTION_HISTORY)
}

export function normalizeOrderedUserInstructions(
  history: string[] | undefined,
  fallbackInstruction = '',
): string[] {
  const normalized = (history ?? [])
    .map(normalizeInstruction)
    .filter(Boolean)

  if (normalized.length > 0) return normalized.slice(-MAX_USER_INSTRUCTION_HISTORY)
  const fallback = normalizeInstruction(fallbackInstruction)
  return fallback ? [fallback] : []
}

export function joinOrderedUserInstructions(history: string[]): string {
  return normalizeOrderedUserInstructions(history).join('\n\n')
}

export function resolveMaterialPlanningInstruction(
  instruction: string,
  current: MaterialPlanningState,
): MaterialPlanningInstructionResolution {
  const patch = extractMaterialInstructionPatch(instruction)
  const next: MaterialPlanningState = { ...current, ...patch }
  const changedFields = (Object.keys(patch) as Array<keyof MaterialPlanningState>)
    .filter((field) => patch[field] !== undefined && patch[field] !== current[field])
  const outputFrameChanged = changedFields.some((field) =>
    field === 'aspectRatio' || field === 'frameTemplateType' || field === 'targetPlatform',
  )
  const editLevelChanged = changedFields.includes('editLevel')
  const visualPreferenceChanged = changedFields.includes('visualPreference')
  const cleanupPreferenceChanged = changedFields.includes('cleanupPreference')
  const editPreferencesChanged = changedFields.some((field) =>
    field === 'workflowType' ||
    field === 'cleanupPreference' ||
    field === 'moodStyle' ||
    field === 'creditPreference',
  )
  const reasons = [
    outputFrameChanged ? 'The latest chat instruction changes the target platform or output frame.' : '',
    editLevelChanged ? 'The latest chat instruction changes the resolved edit level.' : '',
    visualPreferenceChanged ? 'The latest chat instruction changes the resolved visual preference.' : '',
    cleanupPreferenceChanged ? 'The latest chat instruction changes the source cleanup preference.' : '',
    editPreferencesChanged ? 'The latest chat instruction changes structured Edit Preferences.' : '',
  ].filter(Boolean)

  return {
    next,
    changedFields,
    invalidates: {
      outputFrame: outputFrameChanged,
      editLevel: editLevelChanged,
      visualPreference: visualPreferenceChanged,
      cleanupPreference: cleanupPreferenceChanged,
      editPreferences: editPreferencesChanged,
    },
    reasons,
  }
}

export function createPlanningInputTrace(input: PlannerInput): PlanningInputTrace {
  const instructionHistory = normalizeOrderedUserInstructions(
    input.userInstructionHistory,
    input.userInstructionHistory === undefined ? input.customInstructions : '',
  )
  const preferenceApplication = input.preferenceSnapshotId
    ? {
        applied: input.preferenceDefaultsApplied === true,
        appliedAt: input.preferenceSnapshotAppliedAt,
        snapshotId: input.preferenceSnapshotId,
        source: input.preferencePersistenceSource ?? 'browser_local_edit_preferences',
        currentEditOverrideKeys: input.currentEditPreferenceOverrideKeys,
        currentEditRevision: input.currentEditPreferenceRevision,
      }
    : undefined

  return {
    fingerprint: createPlanningInputFingerprint({ ...input, userInstructionHistory: instructionHistory }),
    instructionCount: instructionHistory.length,
    instructionHistory,
    effectiveEditPreferences: {
      editLevel: input.editLevel,
      workflowType: input.workflowType,
      cleanupPreference: input.cleanupPreference,
      visualPreference: input.visualPreference,
      moodStyle: input.moodStyle,
      creditPreference: input.creditPreference,
      targetPlatform: input.targetPlatform,
    },
    preferenceApplication,
  }
}

export function findConfirmedMaterialPlanningConflicts(
  input: PlannerInput,
  compiledIntent: CompiledEditingIntent | undefined,
): string[] {
  if (!compiledIntent) return ['Compiled editing intent is missing.']

  const resolved = compiledIntent.resolvedSettings
  return [
    input.aspectRatioConfirmed === true && resolved.aspectRatio !== input.aspectRatio
      ? `Resolved aspect ratio ${resolved.aspectRatio} does not match confirmed aspect ratio ${input.aspectRatio}.`
      : '',
    input.aspectRatioConfirmed === true && resolved.targetPlatform !== input.targetPlatform
      ? `Resolved target platform ${resolved.targetPlatform} does not match confirmed target platform ${input.targetPlatform}.`
      : '',
    input.aspectRatioConfirmed === true && (resolved.frameTemplateType ?? null) !== (input.frameTemplateType ?? null)
      ? 'Resolved frame template does not match the confirmed frame template.'
      : '',
    resolved.editLevel !== input.editLevel
      ? `Resolved edit level ${resolved.editLevel} does not match the selected edit level ${input.editLevel}.`
      : '',
    resolved.visualPreference !== input.visualPreference
      ? `Resolved visual preference ${resolved.visualPreference} does not match the selected visual preference ${input.visualPreference}.`
      : '',
  ].filter(Boolean)
}

export function createPlanningInputFingerprint(input: PlannerInput): string {
  const instructionHistory = normalizeOrderedUserInstructions(
    input.userInstructionHistory,
    input.userInstructionHistory === undefined ? input.customInstructions : '',
  )
  const canonicalInput = {
    aspectRatio: input.aspectRatio,
    aspectRatioConfirmed: input.aspectRatioConfirmed === true,
    aspectRatioSource: input.aspectRatioSource ?? null,
    cleanupPreference: input.cleanupPreference ?? null,
    cleanupPreferenceConfirmed: input.cleanupPreferenceConfirmed === true,
    clips: input.clips.map((clip) => ({
      fileName: clip.fileName,
      id: clip.id,
      important: clip.isImportant === true,
      optional: clip.isOptional === true,
      sourceRole: clip.sourceRole ?? null,
      uploadedOrder: clip.uploadedOrder,
    })),
    creditPreference: input.creditPreference,
    editLevel: input.editLevel,
    editingCategory: input.editingCategory,
    frameTemplateType: input.frameTemplateType ?? null,
    instructionHistory,
    moodStyle: input.moodStyle,
    preferenceDefaultsApplied: input.preferenceDefaultsApplied === true,
    preferencePersistenceSource: input.preferencePersistenceSource ?? null,
    preferenceSnapshotAppliedAt: input.preferenceSnapshotAppliedAt ?? null,
    preferenceSnapshotId: input.preferenceSnapshotId ?? null,
    currentEditPreferenceOverrideKeys: input.currentEditPreferenceOverrideKeys ?? [],
    currentEditPreferenceRevision: input.currentEditPreferenceRevision ?? 0,
    projectName: input.projectName,
    referenceUrl: input.referenceUrl,
    sourceOrderConfirmed: input.sourceOrderConfirmed === true,
    sourceSequenceMode: input.sourceSequenceMode ?? null,
    targetPlatform: input.targetPlatform,
    visualPreference: input.visualPreference,
    workflowType: input.workflowType,
  }
  const text = stableStringify(canonicalInput)
  let hash = 2166136261

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `planning-input-fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function extractMaterialInstructionPatch(instruction: string): MaterialInstructionPatch {
  const text = normalizeInstruction(instruction).toLowerCase()
  if (!text) return {}

  return {
    ...extractPlatformAndFramePatch(text),
    ...extractEditLevelPatch(text),
    ...extractVisualPreferencePatch(text),
    ...extractWorkflowPatch(text),
    ...extractCleanupPreferencePatch(text),
    ...extractMoodStylePatch(text),
    ...extractCreditPreferencePatch(text),
  }
}

function extractPlatformAndFramePatch(text: string): MaterialInstructionPatch {
  if (hasAny(text, ['9:16', '9x16', 'vertical short', 'vertical video', 'tiktok', 'reels', 'youtube shorts', 'short form', 'short-form'])) {
    return framePatch('9:16', 'tiktok_reels_shorts')
  }
  if (hasAny(text, ['16:9', '16x9', 'youtube landscape', 'landscape youtube', 'standard youtube'])) {
    return framePatch('16:9', 'youtube')
  }
  if (/\byoutube\b/.test(text) && !/\bshorts?\b/.test(text)) {
    return framePatch('16:9', 'youtube')
  }
  if (hasAny(text, ['1:1', '1x1', 'square video', 'square social', 'square format', 'make it square', 'use square'])) {
    return framePatch('1:1', 'custom')
  }
  if (hasAny(text, ['4:5', '4x5', 'portrait feed', 'instagram feed'])) {
    return framePatch('4:5', 'custom')
  }
  if (hasAny(text, ['4:3', '4x3', 'classic documentary', 'archive frame'])) {
    return framePatch('4:3', 'custom')
  }
  if (/\bwebsite\b/.test(text)) return { targetPlatform: 'website' }
  if (hasAny(text, ['course platform', 'training platform', 'course or training'])) {
    return { targetPlatform: 'course_training' }
  }
  if (hasAny(text, ['client review', 'send to client'])) return { targetPlatform: 'client_review' }
  return {}
}

function extractEditLevelPatch(text: string): MaterialInstructionPatch {
  if (hasAny(text, ['ultra premium', 'highest edit level', 'best possible edit', 'premium best result'])) {
    return { editLevel: 'premium' }
  }
  if (hasAny(text, ['normal edit level', 'basic edit level', 'switch to basic', 'use basic'])) {
    return { editLevel: 'basic' }
  }
  if (hasAny(text, ['premium edit level', 'pro edit level', 'switch to pro', 'use pro'])) {
    return { editLevel: 'pro' }
  }
  return {}
}

function extractVisualPreferencePatch(text: string): MaterialInstructionPatch {
  const matches: Array<[VisualPreference, string[]]> = [
    ['no_extra_visuals', [
      'no extra visuals',
      'no visuals',
      'no b-roll',
      'no broll',
      'source only',
      'source footage only',
      'uploaded footage only',
      'only use the source',
      'use only the source',
    ]],
    ['keep_visuals_minimal', ['keep visuals minimal', 'minimal visuals', 'not too much', "don't overdo", 'dont overdo']],
    ['more_stroke_motion', ['more stroke motion', 'use stroke motion']],
    ['more_graphic_design', ['more graphic design', 'use visualexplain', 'more diagrams']],
    ['real_motion_if_useful', ['real motion if useful', 'use real motion']],
    ['balanced_visual_mix', ['balanced visual mix', 'balance the visuals']],
    ['let_ai_decide', ['let ai decide the visuals', 'let reeditpro decide the visuals']],
  ]
  const match = matches.find(([, keywords]) => hasAny(text, keywords))
  return match ? { visualPreference: match[0] } : {}
}

function extractWorkflowPatch(text: string): MaterialInstructionPatch {
  const matches: Array<[PlannerInput['workflowType'], string[]]> = [
    ['social_short_viral_clip', ['social short workflow', 'short-form workflow', 'short form workflow', 'viral clip workflow']],
    ['talking_head_personal_brand', ['talking head workflow', 'personal brand workflow', 'speaker-led workflow']],
    ['podcast_clip', ['podcast workflow', 'podcast clip workflow']],
    ['vlog_lifestyle', ['vlog workflow', 'lifestyle workflow']],
    ['product_demo', ['product demo workflow', 'demo workflow']],
    ['real_estate_property_tour', ['property tour workflow', 'real estate workflow']],
    ['education_explainer', ['education workflow', 'explainer workflow', 'tutorial workflow']],
    ['marketing_ad', ['marketing ad workflow', 'advertising workflow', 'ad workflow']],
    ['testimonial_case_study', ['testimonial workflow', 'case study workflow']],
    ['simple_clean_edit', ['clean edit workflow', 'simple edit workflow']],
    ['custom_let_ai_decide', ['let reeditpro choose the workflow', 'let ai choose the workflow']],
  ]
  const match = matches.find(([, keywords]) => hasAny(text, keywords))
  return match ? { workflowType: match[0] } : {}
}

function extractCleanupPreferencePatch(text: string): MaterialInstructionPatch {
  const matches: Array<[NonNullable<PlannerInput['cleanupPreference']>, string[]]> = [
    ['preserve_natural', ['preserve natural rhythm', 'keep the natural pauses', 'do not tighten the pauses']],
    ['light_cleanup', ['light cleanup', 'only obvious mistakes', 'minimal cleanup']],
    ['balanced_cleanup', ['balanced cleanup', 'normal cleanup']],
    ['tight_retention_cleanup', ['tight retention cleanup', 'tighten for retention', 'faster cleanup']],
    ['aggressive_cleanup', ['aggressive cleanup', 'remove all filler', 'dense cleanup']],
    ['documentary_faithful', ['documentary faithful cleanup', 'protect documentary context', 'preserve evidence context']],
    ['tutorial_complete', ['tutorial complete cleanup', 'keep every tutorial step', 'keep every required step']],
  ]
  const match = matches.find(([, keywords]) => hasAny(text, keywords))
  return match ? { cleanupPreference: match[0] } : {}
}

function extractMoodStylePatch(text: string): MaterialInstructionPatch {
  const matches: Array<[PlannerInput['moodStyle'], string[]]> = [
    ['cinematic', ['cinematic mood', 'cinematic tone']],
    ['premium', ['premium mood', 'premium tone', 'high-end mood', 'high end mood']],
    ['energetic', ['energetic mood', 'energetic tone', 'upbeat mood']],
    ['educational', ['educational mood', 'teaching tone']],
    ['luxury', ['luxury mood', 'luxury tone']],
    ['clean', ['clean mood', 'clean tone', 'natural mood']],
    ['let_ai_decide', ['let reeditpro choose the mood', 'let ai choose the mood']],
  ]
  const match = matches.find(([, keywords]) => hasAny(text, keywords))
  return match ? { moodStyle: match[0] } : {}
}

function extractCreditPreferencePatch(text: string): MaterialInstructionPatch {
  if (hasAny(text, ['save credits', 'lower credit cost', 'use fewer credits', 'low credit cost'])) {
    return { creditPreference: 'low_credit_cost' }
  }
  if (hasAny(text, ['best result', 'best possible result', 'premium result regardless of cost'])) {
    return { creditPreference: 'premium_best_result' }
  }
  if (hasAny(text, ['balanced credit use', 'balanced cost', 'balance cost and quality'])) {
    return { creditPreference: 'balanced' }
  }
  if (hasAny(text, ['let the estimate decide', 'let reeditpro decide the credit posture'])) {
    return { creditPreference: 'let_ai_estimate' }
  }
  return {}
}

function framePatch(aspectRatio: AspectRatio, targetPlatform: TargetPlatform): MaterialInstructionPatch {
  return {
    aspectRatio,
    frameTemplateType: frameTemplateForAspectRatio(aspectRatio),
    targetPlatform,
  }
}

function frameTemplateForAspectRatio(aspectRatio: AspectRatio): FrameTemplateType {
  if (aspectRatio === '16:9') return 'youtube_side_panel'
  if (aspectRatio === '1:1') return 'square_center_panel'
  if (aspectRatio === '4:5') return 'portrait_feed_lower_panel'
  if (aspectRatio === '4:3') return 'classic_documentary_center_panel'
  if (aspectRatio === 'let_ai_decide') return 'let_ai_decide'
  return 'vertical_talking_head_lower_panel'
}

function normalizeInstruction(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_USER_INSTRUCTION_LENGTH)
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword))
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableJsonValue(nested)]),
    )
  }
  return value
}
