import type {
  SFXDurationPlan,
  SFXEventPlanRecord,
  SFXGeneratedDurationPolicy,
  SFXPromptPlanRecord,
} from '../../types'

function isAmbientCue(eventPlan: SFXEventPlanRecord): boolean {
  return eventPlan.targetLayer === 'ambient_bridge' ||
    eventPlan.targetLayer === 'source_footage_repair' ||
    eventPlan.useCase === 'ambient_bridge' ||
    eventPlan.useCase === 'ambient_soft_bridge' ||
    eventPlan.useCase === 'lifestyle_restaurant_ambience_bridge' ||
    eventPlan.useCase === 'lifestyle_water_boat_ambience'
}

function isMediumCue(eventPlan: SFXEventPlanRecord): boolean {
  return eventPlan.targetLayer === 'real_motion' ||
    eventPlan.targetLayer === 'chapter_card' ||
    eventPlan.targetLayer === 'title_card' ||
    eventPlan.useCase === 'stroke_line_trace' ||
    eventPlan.useCase === 'stroke_soft_pencil_draw' ||
    eventPlan.useCase === 'graphic_diagram_trace' ||
    eventPlan.useCase === 'graphic_line_draw' ||
    eventPlan.useCase === 'real_motion_object_enter' ||
    eventPlan.useCase === 'real_motion_object_settle'
}

export function chooseSFXGeneratedDurationPolicy(
  eventPlan: SFXEventPlanRecord,
  promptPlan?: SFXPromptPlanRecord,
): SFXGeneratedDurationPolicy {
  if (promptPlan?.generatedDurationPolicy && promptPlan.generatedDurationPolicy !== 'custom') {
    return promptPlan.generatedDurationPolicy
  }

  if (isAmbientCue(eventPlan)) return 'generate_6_to_8_seconds'
  if (isMediumCue(eventPlan)) return 'generate_3_to_5_seconds'
  return 'generate_2_to_3_seconds'
}

export function calculateNeededSFXDurationSeconds(
  eventPlan: SFXEventPlanRecord,
  promptPlan?: SFXPromptPlanRecord,
): number {
  if (promptPlan && promptPlan.durationNeededSeconds > 0) return promptPlan.durationNeededSeconds

  if (eventPlan.endTimeSeconds !== undefined && eventPlan.startTimeSeconds !== undefined) {
    return Number(Math.max(0.3, eventPlan.endTimeSeconds - eventPlan.startTimeSeconds).toFixed(3))
  }

  if (isAmbientCue(eventPlan)) return 4
  if (isMediumCue(eventPlan)) return 1.5
  return 0.5
}

export function calculateSFXDurationToGenerateSeconds(
  eventPlan: SFXEventPlanRecord,
  promptPlan?: SFXPromptPlanRecord,
): number {
  if (promptPlan && promptPlan.durationToGenerateSeconds > 0) return promptPlan.durationToGenerateSeconds

  const policy = chooseSFXGeneratedDurationPolicy(eventPlan, promptPlan)
  if (policy === 'generate_6_to_8_seconds') return 7
  if (policy === 'generate_3_to_5_seconds') return 4
  if (policy === 'generate_2_to_3_seconds') return 2.5

  return calculateNeededSFXDurationSeconds(eventPlan, promptPlan)
}

export function createSFXDurationPlan(
  eventPlan: SFXEventPlanRecord,
  promptPlan?: SFXPromptPlanRecord,
): SFXDurationPlan {
  const policy = chooseSFXGeneratedDurationPolicy(eventPlan, promptPlan)
  const neededDurationSeconds = calculateNeededSFXDurationSeconds(eventPlan, promptPlan)
  const durationToGenerateSeconds = calculateSFXDurationToGenerateSeconds(eventPlan, promptPlan)
  const category = policy === 'generate_6_to_8_seconds'
    ? 'ambient_bridge'
    : policy === 'generate_3_to_5_seconds'
      ? 'medium_motion'
      : policy === 'generate_2_to_3_seconds'
        ? 'short_hit'
        : 'custom'

  return {
    policy,
    category,
    neededDurationSeconds,
    durationToGenerateSeconds,
    reason: 'Generated SFX is planned longer than the final cue so the best region can be trimmed and hit-aligned.',
    warnings: durationToGenerateSeconds < neededDurationSeconds
      ? ['Generated duration is shorter than needed; timing planner should require manual review.']
      : [],
  }
}

export function createSFXDurationSummary(durationPlan: SFXDurationPlan): string[] {
  return [
    `Needed final SFX duration: ${durationPlan.neededDurationSeconds}s.`,
    `Mock generated duration target: ${durationPlan.durationToGenerateSeconds}s.`,
    `Duration policy: ${durationPlan.policy}.`,
    durationPlan.reason,
  ]
}
