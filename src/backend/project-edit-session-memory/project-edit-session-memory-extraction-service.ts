import type {
  ProjectEditSessionMemoryLayer,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionMemoryConfidence,
  ProjectEditSessionMemoryExtraction,
  ProjectEditSessionMemorySafetyStatus,
  ProjectEditSessionMemoryUpdateSource,
} from '../../types/project-edit-session-memory'
import { classifyProjectEditSessionMemorySafety } from './project-edit-session-memory-policy-service'

type ExtractionInput = {
  projectId: string
  editSessionId: string
  text: string
  sourceMessageId?: string
  sourceRevisionId?: string
  source?: ProjectEditSessionMemoryUpdateSource
}

function createMemoryExtractionId(source: ProjectEditSessionMemoryUpdateSource): string {
  return `project-edit-session-memory-extraction-${source}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function includesAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase()
  return terms.some((term) => normalized.includes(term))
}

function createExtraction(input: {
  projectId: string
  editSessionId: string
  source: ProjectEditSessionMemoryUpdateSource
  sourceMessageId?: string
  sourceRevisionId?: string
  targetLayers: ProjectEditSessionMemoryLayer[]
  facts?: string[]
  preferences?: string[]
  warnings?: string[]
  proposedSummary?: string
  confidence?: ProjectEditSessionMemoryConfidence
  safetyStatus?: ProjectEditSessionMemorySafetyStatus
  notes?: string[]
}): ProjectEditSessionMemoryExtraction {
  return {
    id: createMemoryExtractionId(input.source),
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    source: input.source,
    sourceMessageId: input.sourceMessageId,
    sourceRevisionId: input.sourceRevisionId,
    targetLayers: unique(input.targetLayers),
    extractedFacts: unique(input.facts ?? []),
    extractedPreferences: unique(input.preferences ?? []),
    extractedWarnings: unique(input.warnings ?? []),
    proposedSummary: input.proposedSummary,
    confidence: input.confidence ?? 'medium',
    safetyStatus: input.safetyStatus ?? 'safe_mock_update',
    mockOnly: true,
    notes: input.notes ?? ['Deterministic mock extraction only; no model call made.'],
  }
}

export function createNoOpMemoryExtraction(input: {
  projectId: string
  editSessionId: string
  source?: ProjectEditSessionMemoryUpdateSource
  sourceMessageId?: string
  text?: string
}): ProjectEditSessionMemoryExtraction {
  return createExtraction({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    source: input.source ?? 'manual_mock_update',
    sourceMessageId: input.sourceMessageId,
    targetLayers: [],
    proposedSummary: input.text ? `No durable mock memory extracted from: ${input.text.slice(0, 80)}` : undefined,
    confidence: 'low',
    notes: ['No deterministic memory keyword matched; no persistence required.'],
  })
}

export function extractMemoryFromProjectEditSessionMessage(input: ExtractionInput): ProjectEditSessionMemoryExtraction {
  const text = input.text.trim()
  const targetLayers: ProjectEditSessionMemoryLayer[] = []
  const facts: string[] = []
  const preferences: string[] = []
  const warnings: string[] = []
  const notes: string[] = ['Deterministic keyword extraction from user message; no Qwen, DeepSeek, embeddings, or vector DB.']

  if (includesAny(text, ['faster', 'hook', 'pacing', 'slow it down'])) {
    targetLayers.push('revision_memory', 'user_instruction_memory')
    preferences.push(text)
    facts.push('User gave pacing or hook direction.')
  }

  if (includesAny(text, ['captions', 'subtitles', 'text'])) {
    targetLayers.push('user_instruction_memory', 'session_memory')
    preferences.push(text)
    facts.push('User gave caption or text direction.')
  }

  if (includesAny(text, ['music', 'sfx', 'fake sounds'])) {
    targetLayers.push('user_instruction_memory', 'dna_application_memory')
    preferences.push(text)
    warnings.push(includesAny(text, ['fake sounds']) ? 'Avoid fake source sounds.' : 'Audio/SFX preference captured as mock memory only.')
  }

  if (includesAny(text, ['source', 'clip', 'broll', 'b-roll'])) {
    targetLayers.push('source_memory')
    facts.push(text)
  }

  if (includesAny(text, ['approve', 'keep this version', 'keep it'])) {
    targetLayers.push('approval_memory')
    facts.push('User referenced approval or keeping the current version.')
  }

  if (includesAny(text, ['preview', 'version'])) {
    targetLayers.push('preview_memory')
    facts.push('User referenced preview or version state.')
  }

  if (includesAny(text, ['premium', 'polished', 'clean', 'calm'])) {
    targetLayers.push('session_memory', 'preference_memory')
    preferences.push(text)
  }

  const safetyStatus = classifyProjectEditSessionMemorySafety({
    text,
    facts,
    preferences,
    warnings,
  })

  if (!targetLayers.length) {
    const noOp = createNoOpMemoryExtraction({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      source: input.source ?? 'user_message',
      sourceMessageId: input.sourceMessageId,
      text,
    })
    return safetyStatus === 'safe_mock_update'
      ? noOp
      : {
          ...noOp,
          safetyStatus,
          confidence: 'low',
          notes: [...noOp.notes, 'No memory keyword matched, but safety policy still blocked the input.'],
        }
  }

  return createExtraction({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    source: input.source ?? 'user_message',
    sourceMessageId: input.sourceMessageId,
    targetLayers,
    facts,
    preferences,
    warnings,
    proposedSummary: `Latest mock memory from chat: ${text.slice(0, 120)}`,
    confidence: safetyStatus === 'safe_mock_update' ? 'high' : 'low',
    safetyStatus,
    notes,
  })
}

export function extractMemoryFromRevisionRequest(input: ExtractionInput): ProjectEditSessionMemoryExtraction {
  const base = extractMemoryFromProjectEditSessionMessage({
    ...input,
    source: 'revision_request',
  })
  return {
    ...base,
    source: 'revision_request',
    sourceRevisionId: input.sourceRevisionId,
    targetLayers: unique([...base.targetLayers, 'revision_memory', 'user_instruction_memory']),
    extractedFacts: unique([...base.extractedFacts, 'Revision request captured from persistent Edit Chat.']),
    extractedWarnings: unique([
      ...base.extractedWarnings,
      'Approval remains reset until a future planning milestone.',
    ]),
  }
}

export function extractMemoryFromSourceNote(input: ExtractionInput): ProjectEditSessionMemoryExtraction {
  const safetyStatus = classifyProjectEditSessionMemorySafety({ text: input.text, facts: [input.text] })
  return createExtraction({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    source: 'source_note',
    sourceMessageId: input.sourceMessageId,
    targetLayers: ['source_memory'],
    facts: [input.text],
    proposedSummary: `Source note remembered: ${input.text.slice(0, 120)}`,
    confidence: safetyStatus === 'safe_mock_update' ? 'high' : 'low',
    safetyStatus,
    notes: ['Source note is metadata-only; no file bytes, uploads, or media processing.'],
  })
}

export function extractMemoryFromPreferenceDNAApplication(input: ExtractionInput): ProjectEditSessionMemoryExtraction {
  return createExtraction({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    source: 'preference_dna_application',
    sourceMessageId: input.sourceMessageId,
    targetLayers: ['dna_application_memory', 'preference_memory'],
    facts: ['Preference DNA context is active for this Edit Chat.'],
    preferences: [input.text],
    warnings: ['Do-not-copy rules remain active and outrank DNA adaptation.'],
    proposedSummary: `Preference DNA memory: ${input.text.slice(0, 120)}`,
    confidence: 'high',
  })
}

export function extractMemoryFromApprovalEvent(input: ExtractionInput): ProjectEditSessionMemoryExtraction {
  return createExtraction({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    source: 'approval_event',
    sourceMessageId: input.sourceMessageId,
    targetLayers: ['approval_memory'],
    facts: [input.text],
    proposedSummary: `Approval memory: ${input.text.slice(0, 120)}`,
    confidence: 'medium',
  })
}

export function extractMemoryFromPreviewEvent(input: ExtractionInput): ProjectEditSessionMemoryExtraction {
  return createExtraction({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    source: 'preview_event',
    sourceMessageId: input.sourceMessageId,
    targetLayers: ['preview_memory'],
    facts: [input.text],
    proposedSummary: `Preview/version memory: ${input.text.slice(0, 120)}`,
    confidence: 'medium',
  })
}

export function createProjectEditSessionMemoryExtractionSummary(
  extraction: ProjectEditSessionMemoryExtraction,
): string {
  if (!extraction.targetLayers.length) return 'No mock memory update proposed.'
  return `${extraction.targetLayers.length} memory layer(s) targeted from ${extraction.source}; ${extraction.safetyStatus}.`
}
