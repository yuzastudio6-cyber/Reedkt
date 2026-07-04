import type {
  ProjectEditSessionMemoryPackage,
  ProjectEditSessionMemoryUpdatePlan,
  ProjectEditSessionMemoryValidationResult,
  ProjectEditSessionMemoryExtraction,
} from '../../types/project-edit-session-memory'

export const PROJECT_EDIT_SESSION_MEMORY_NO_SIDE_EFFECTS = {
  providerCallMade: false,
  qwenCallMade: false,
  deepSeekCallMade: false,
  supabaseWriteMade: false,
  storageWriteMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
} as const

function result(blockedReasons: string[], warnings: string[] = []): ProjectEditSessionMemoryValidationResult {
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    warnings,
    ...PROJECT_EDIT_SESSION_MEMORY_NO_SIDE_EFFECTS,
  }
}

export function validateProjectEditSessionMemoryExtraction(
  extraction: ProjectEditSessionMemoryExtraction,
): ProjectEditSessionMemoryValidationResult {
  const blockedReasons = [
    extraction.mockOnly ? undefined : 'Extraction must be mockOnly.',
    extraction.safetyStatus.startsWith('blocked') ? `Extraction safety status is ${extraction.safetyStatus}.` : undefined,
    extraction.projectId ? undefined : 'Missing projectId.',
    extraction.editSessionId ? undefined : 'Missing editSessionId.',
  ].filter((reason): reason is string => Boolean(reason))
  return result(blockedReasons, extraction.targetLayers.length ? [] : ['Extraction has no target layers.'])
}

export function validateProjectEditSessionMemoryUpdatePlan(
  plan: ProjectEditSessionMemoryUpdatePlan,
): ProjectEditSessionMemoryValidationResult {
  const extractionValidation = validateProjectEditSessionMemoryExtraction(plan.extraction)
  const blockedReasons = [
    ...extractionValidation.blockedReasons,
    plan.mockOnly ? undefined : 'Update plan must be mockOnly.',
    plan.actions.length ? undefined : 'Update plan has no actions.',
  ].filter((reason): reason is string => Boolean(reason))
  return result(blockedReasons, [...extractionValidation.warnings, ...plan.warnings])
}

export function validateProjectEditSessionMemoryPackage(
  memoryPackage: ProjectEditSessionMemoryPackage,
): ProjectEditSessionMemoryValidationResult {
  const blockedReasons = [
    memoryPackage.mockOnly ? undefined : 'Memory package must be mockOnly.',
    memoryPackage.projectId ? undefined : 'Missing projectId.',
    memoryPackage.editSessionId ? undefined : 'Missing editSessionId.',
    memoryPackage.layers.some((layer) => !layer.mockOnly) ? 'All memory layers must be mockOnly.' : undefined,
  ].filter((reason): reason is string => Boolean(reason))
  return result(blockedReasons)
}

export function validateNoProjectEditSessionMemorySideEffects(flags: Partial<Record<keyof typeof PROJECT_EDIT_SESSION_MEMORY_NO_SIDE_EFFECTS, boolean>>): ProjectEditSessionMemoryValidationResult {
  const blockedReasons = Object.entries(PROJECT_EDIT_SESSION_MEMORY_NO_SIDE_EFFECTS)
    .filter(([key]) => flags[key as keyof typeof PROJECT_EDIT_SESSION_MEMORY_NO_SIDE_EFFECTS] === true)
    .map(([key]) => `${key} must remain false.`)
  return result(blockedReasons)
}

export function createProjectEditSessionMemoryValidationSummary(
  validation: ProjectEditSessionMemoryValidationResult,
): string {
  return validation.ok
    ? 'Project Edit Session memory validation passed with all production-effect flags false.'
    : `Project Edit Session memory validation blocked: ${validation.blockedReasons.join('; ')}`
}
