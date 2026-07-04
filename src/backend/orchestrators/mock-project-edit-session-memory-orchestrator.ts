import type {
  ProjectEditSessionMemoryPackage,
  ProjectEditSessionMemoryUpdatePlan,
  ProjectEditSessionMemoryExtraction,
  ProjectEditSessionMemoryValidationResult,
} from '../../types/project-edit-session-memory'
import {
  createProjectEditSessionMemoryExtractionSummary,
  extractMemoryFromApprovalEvent,
  extractMemoryFromPreferenceDNAApplication,
  extractMemoryFromPreviewEvent,
  extractMemoryFromProjectEditSessionMessage,
  extractMemoryFromRevisionRequest,
  extractMemoryFromSourceNote,
} from '../project-edit-session-memory/project-edit-session-memory-extraction-service'
import {
  createProjectEditSessionMemoryLayerRegistrySummary,
  listProjectEditSessionMemoryLayers,
} from '../project-edit-session-memory/project-edit-session-memory-layer-registry'
import {
  applyProjectEditSessionMemoryUpdatePlan,
  createProjectEditSessionMemoryUpdatePlan,
  createProjectEditSessionMemoryUpdateSummary,
} from '../project-edit-session-memory/project-edit-session-memory-update-service'
import {
  createProjectEditSessionMemoryChatSummary,
  createProjectEditSessionMemoryPackage,
} from '../project-edit-session-memory/project-edit-session-memory-summary-service'
import {
  createProjectEditSessionMemoryValidationSummary,
  validateNoProjectEditSessionMemorySideEffects,
  validateProjectEditSessionMemoryExtraction,
  validateProjectEditSessionMemoryPackage,
  validateProjectEditSessionMemoryUpdatePlan,
} from '../project-edit-session-memory/project-edit-session-memory-validation-service'

export interface MockProjectEditSessionMemoryOrchestratorResult {
  layerRegistry: ReturnType<typeof createProjectEditSessionMemoryLayerRegistrySummary>
  extraction?: ProjectEditSessionMemoryExtraction
  updatePlan?: ProjectEditSessionMemoryUpdatePlan
  memoryPackage?: ProjectEditSessionMemoryPackage
  validation: ProjectEditSessionMemoryValidationResult
  summary: string[]
  warnings: string[]
  nextStep: 'RP-EDITSESSION-09 — Version, Revision, and Preview History'
}

const baseInput = {
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-vertical-dna',
}

function result(input: {
  extraction?: ProjectEditSessionMemoryExtraction
  updatePlan?: ProjectEditSessionMemoryUpdatePlan
  memoryPackage?: ProjectEditSessionMemoryPackage
  validation?: ProjectEditSessionMemoryValidationResult
  summary?: string[]
  warnings?: string[]
}): MockProjectEditSessionMemoryOrchestratorResult {
  return {
    layerRegistry: createProjectEditSessionMemoryLayerRegistrySummary(),
    extraction: input.extraction,
    updatePlan: input.updatePlan,
    memoryPackage: input.memoryPackage,
    validation: input.validation ?? validateNoProjectEditSessionMemorySideEffects({}),
    summary: input.summary ?? [],
    warnings: input.warnings ?? [],
    nextStep: 'RP-EDITSESSION-09 — Version, Revision, and Preview History',
  }
}

function extractionFlow(extraction: ProjectEditSessionMemoryExtraction): MockProjectEditSessionMemoryOrchestratorResult {
  const updatePlan = createProjectEditSessionMemoryUpdatePlan(extraction)
  const layers = applyProjectEditSessionMemoryUpdatePlan({ plan: updatePlan })
  const memoryPackage = createProjectEditSessionMemoryPackage({
    projectId: extraction.projectId,
    editSessionId: extraction.editSessionId,
    layers,
  })
  const validation = validateProjectEditSessionMemoryPackage(memoryPackage)
  return result({
    extraction,
    updatePlan,
    memoryPackage,
    validation,
    summary: [
      createProjectEditSessionMemoryExtractionSummary(extraction),
      createProjectEditSessionMemoryUpdateSummary(updatePlan),
      createProjectEditSessionMemoryChatSummary(memoryPackage),
      createProjectEditSessionMemoryValidationSummary(validation),
    ],
    warnings: updatePlan.warnings,
  })
}

export function runMockMessageMemoryExtractionFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  return extractionFlow(extractMemoryFromProjectEditSessionMessage({
    ...baseInput,
    text: 'Make it faster and captions smaller.',
    sourceMessageId: 'mock-message-memory',
  }))
}

export function runMockRevisionMemoryExtractionFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  return extractionFlow(extractMemoryFromRevisionRequest({
    ...baseInput,
    text: 'Revise this version and use less SFX.',
    sourceMessageId: 'mock-message-revision',
    sourceRevisionId: 'mock-revision-memory',
  }))
}

export function runMockSourceMemoryExtractionFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  return extractionFlow(extractMemoryFromSourceNote({
    ...baseInput,
    text: 'Source clip 2 is important for the opening.',
  }))
}

export function runMockPreferenceDNAMemoryExtractionFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  return extractionFlow(extractMemoryFromPreferenceDNAApplication({
    ...baseInput,
    text: '@lifestyle-travel-vlog DNA applied with do-not-copy active.',
  }))
}

export function runMockMemoryUpdatePlanFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  const extraction = extractMemoryFromProjectEditSessionMessage({
    ...baseInput,
    text: 'Keep this version but make the hook more premium.',
  })
  const updatePlan = createProjectEditSessionMemoryUpdatePlan(extraction)
  return result({
    extraction,
    updatePlan,
    validation: validateProjectEditSessionMemoryUpdatePlan(updatePlan),
    summary: [createProjectEditSessionMemoryUpdateSummary(updatePlan)],
    warnings: updatePlan.warnings,
  })
}

export function runMockMemoryPackageFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  const extraction = extractMemoryFromPreviewEvent({
    ...baseInput,
    text: 'Preview version is ready as a placeholder mock.',
  })
  const updatePlan = createProjectEditSessionMemoryUpdatePlan(extraction)
  const memoryPackage = createProjectEditSessionMemoryPackage({
    projectId: baseInput.projectId,
    editSessionId: baseInput.editSessionId,
    layers: applyProjectEditSessionMemoryUpdatePlan({ plan: updatePlan }),
  })
  return result({
    extraction,
    updatePlan,
    memoryPackage,
    validation: validateProjectEditSessionMemoryPackage(memoryPackage),
    summary: [createProjectEditSessionMemoryChatSummary(memoryPackage)],
  })
}

export function runMockMemoryValidationFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  const extraction = extractMemoryFromApprovalEvent({
    ...baseInput,
    text: 'Keep this version approved.',
  })
  return result({
    extraction,
    validation: validateProjectEditSessionMemoryExtraction(extraction),
    summary: [createProjectEditSessionMemoryExtractionSummary(extraction)],
  })
}

export function runMockMemoryReadinessFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  return result({
    validation: validateNoProjectEditSessionMemorySideEffects({}),
    summary: [
      `${listProjectEditSessionMemoryLayers().length} mock memory layers are registered.`,
      'No Qwen, DeepSeek, embeddings, vector DB, Supabase, provider, worker, render, or credit runtime is enabled.',
    ],
  })
}

export function runMockProjectEditSessionMemoryFlow(): MockProjectEditSessionMemoryOrchestratorResult {
  return runMockMessageMemoryExtractionFlow()
}
