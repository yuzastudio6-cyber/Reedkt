import type {
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionMemoryExtraction,
  ProjectEditSessionMemoryUpdatePlan,
} from '../../types/project-edit-session-memory'
import { shouldPersistProjectEditSessionMemoryExtraction } from './project-edit-session-memory-policy-service'

function createMemoryUpdateId(): string {
  return `project-edit-session-memory-plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

export function createProjectEditSessionMemoryUpdatePlan(
  extraction: ProjectEditSessionMemoryExtraction,
): ProjectEditSessionMemoryUpdatePlan {
  const actions: ProjectEditSessionMemoryUpdatePlan['actions'] = []

  for (const layer of extraction.targetLayers) {
    if (extraction.proposedSummary) {
      actions.push({
        layer,
        action: 'replace_summary',
        value: extraction.proposedSummary,
        reason: `Update ${layer} summary from ${extraction.source}.`,
      })
    }
    for (const fact of extraction.extractedFacts) {
      actions.push({ layer, action: 'append_fact', value: fact, reason: 'Deterministic mock fact extraction.' })
    }
    for (const preference of extraction.extractedPreferences) {
      actions.push({ layer, action: 'append_preference', value: preference, reason: 'Deterministic mock preference extraction.' })
    }
    for (const warning of extraction.extractedWarnings) {
      actions.push({ layer, action: 'append_warning', value: warning, reason: 'Deterministic mock warning extraction.' })
    }
  }

  if (!actions.length) {
    actions.push({
      layer: 'session_memory',
      action: 'no_op',
      value: 'No mock memory update required.',
      reason: 'No target layers or extracted values were found.',
    })
  }

  const shouldPersist = shouldPersistProjectEditSessionMemoryExtraction(extraction)
  return {
    id: createMemoryUpdateId(),
    projectId: extraction.projectId,
    editSessionId: extraction.editSessionId,
    extraction,
    actions,
    shouldPersist,
    mockOnly: true,
    warnings: shouldPersist ? [] : ['Memory plan is no-op or blocked and should not be persisted.'],
  }
}

export function mergeProjectEditSessionMemoryLayer(input: {
  existing?: ProjectEditSessionMemoryRecord
  projectId: string
  editSessionId: string
  layer: ProjectEditSessionMemoryLayer
  summary?: string
  facts?: string[]
  preferences?: string[]
  warnings?: string[]
  updatedFromMessageId?: string
  updatedFromRevisionId?: string
  metadata?: Record<string, unknown>
}): ProjectEditSessionMemoryRecord {
  const timestamp = nowIso()
  return {
    id: input.existing?.id ?? `project-edit-session-memory-${input.layer}-${timestamp}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    layer: input.layer,
    summary: input.summary ?? input.existing?.summary ?? 'Mock Edit Chat memory layer.',
    facts: unique([...(input.existing?.facts ?? []), ...(input.facts ?? [])]),
    preferences: unique([...(input.existing?.preferences ?? []), ...(input.preferences ?? [])]),
    warnings: unique([...(input.existing?.warnings ?? []), ...(input.warnings ?? [])]),
    updatedFromMessageId: input.updatedFromMessageId ?? input.existing?.updatedFromMessageId,
    updatedFromRevisionId: input.updatedFromRevisionId ?? input.existing?.updatedFromRevisionId,
    createdAt: input.existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    mockOnly: true,
    metadata: {
      ...(input.existing?.metadata ?? {}),
      ...(input.metadata ?? {}),
      rpMilestone: 'RP-EDITSESSION-08',
    },
  }
}

export function createMemoryRecordFromExtraction(input: {
  extraction: ProjectEditSessionMemoryExtraction
  layer: ProjectEditSessionMemoryLayer
  existing?: ProjectEditSessionMemoryRecord
}): ProjectEditSessionMemoryRecord {
  return mergeProjectEditSessionMemoryLayer({
    existing: input.existing,
    projectId: input.extraction.projectId,
    editSessionId: input.extraction.editSessionId,
    layer: input.layer,
    summary: input.extraction.proposedSummary,
    facts: input.extraction.extractedFacts,
    preferences: input.extraction.extractedPreferences,
    warnings: input.extraction.extractedWarnings,
    updatedFromMessageId: input.extraction.sourceMessageId,
    updatedFromRevisionId: input.extraction.sourceRevisionId,
    metadata: {
      source: input.extraction.source,
      extractionId: input.extraction.id,
      confidence: input.extraction.confidence,
      safetyStatus: input.extraction.safetyStatus,
    },
  })
}

export function applyProjectEditSessionMemoryUpdatePlan(input: {
  plan: ProjectEditSessionMemoryUpdatePlan
  existingLayers?: ProjectEditSessionMemoryRecord[]
}): ProjectEditSessionMemoryRecord[] {
  if (!input.plan.shouldPersist) return []
  return input.plan.extraction.targetLayers.map((layer) => createMemoryRecordFromExtraction({
    extraction: input.plan.extraction,
    layer,
    existing: input.existingLayers?.find((memory) => memory.layer === layer),
  }))
}

export function createProjectEditSessionMemoryUpdateSummary(
  plan: ProjectEditSessionMemoryUpdatePlan,
): string {
  return plan.shouldPersist
    ? `${plan.actions.length} mock memory action(s) prepared for ${plan.extraction.targetLayers.join(', ')}.`
    : 'No mock memory persistence action prepared.'
}
