import {
  readFileSync,
} from 'node:fs'
import {
  isProductionToolId,
} from '../tool-registry'
import type {
  SoundMusicAudioCategory,
} from './sound-music-audio-owner-expansion-types'
import {
  SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS,
  SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES,
  SOUND_RUNTIME_GATE_1_PLANNING_ONLY_JOB_TYPES,
  SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS,
} from './sound-runtime-gate-1-reconciliation-loader'
import type {
  SoundGate1ACoverage,
  SoundGate1ADuplicateRisk,
  SoundGate1AEvidenceSeedRow,
  SoundGate1AEvidenceSourceBundle,
  SoundGate1AEvidenceStatus,
  SoundGate1AExecutionGate,
  SoundGate1APendingAction,
  SoundGate1APrState,
  SoundGate1AReportedResult,
} from './sound-gate-1a-evidence-overlay-types'

export const SOUND_GATE_1A_EVIDENCE_OVERLAY_MATRIX_SCHEMA = 'reeditpro.soundGate1AEvidenceOverlayMatrix.v1'

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/sound-gate-1a-evidence-overlay-matrix.json', import.meta.url)

const evidenceStatuses = new Set<SoundGate1AEvidenceStatus>([
  'open_pr_candidate_evidence',
  'merged_owner_source_evidence',
  'no_gate_1a_evidence',
  'failed_or_rejected_evidence',
  'blocked_by_owner_gate',
  'unknown',
])

const prStates = new Set<SoundGate1APrState>([
  'open',
  'closed',
  'merged',
  'unknown',
])

const executionGates = new Set<SoundGate1AExecutionGate>([
  'blocked_no_execution',
  'blocked_unmerged_gate_1a_candidate_only',
  'blocked_pending_gate_1b_worker_contract_review',
  'blocked_pending_media_policy',
  'blocked_pending_model_review',
  'planning_only',
])

const pendingActions = new Set<SoundGate1APendingAction>([
  'wait_for_gate_1a_merge',
  'wait_for_gate_1b_worker_contract_review',
  'wait_for_media_policy_handoff',
  'wait_for_model_weight_review',
  'future_controlled_import_probe_reconciliation',
  'future_registry_expansion_after_owner_merge',
  'do_not_duplicate_owner_lane',
  'none',
])

const duplicateRisks = new Set<SoundGate1ADuplicateRisk>([
  'none',
  'do_not_duplicate_owner_lane',
  'wait_for_owner_merge',
  'possible_duplicate_worker_route',
  'possible_duplicate_probe_layer',
  'possible_duplicate_registry_id',
])

const soundCategories = new Set<SoundMusicAudioCategory>([
  'audio_cleanup',
  'denoise',
  'stem_separation',
  'audio_analysis',
  'beat_timing',
  'music_sync',
  'time_stretch',
  'loudness_qa',
  'sound_effects',
  'soundsync',
  'cue_manifest',
  'sfx_director',
  'speech_audio_support',
  'unknown_or_pending',
])

function assertObject(value: unknown, context: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`)
  }
}

function readString(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${context} must be a non-empty string.`)
  }

  return value
}

function readNullableString(value: unknown, context: string): string | null {
  if (value === null) return null

  return readString(value, context)
}

function readBoolean(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${context} must be a boolean.`)
  }

  return value
}

function readNullableBoolean(value: unknown, context: string): boolean | null {
  if (value === null) return null

  return readBoolean(value, context)
}

function readNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${context} must be a finite number.`)
  }

  return value
}

function readStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${context} must be an array of strings.`)
  }

  return [...new Set(value)].sort((left, right) => left.localeCompare(right))
}

function readEvidenceStatuses(value: unknown, context: string): SoundGate1AEvidenceStatus[] {
  return readStringArray(value, context).map((status) => {
    if (!evidenceStatuses.has(status as SoundGate1AEvidenceStatus)) {
      throw new Error(`${context} contains unsupported Gate 1A status: ${status}`)
    }

    return status as SoundGate1AEvidenceStatus
  })
}

function readPrState(value: unknown, context: string): SoundGate1APrState {
  const state = readString(value, context)
  if (!prStates.has(state as SoundGate1APrState)) {
    throw new Error(`${context} is unsupported: ${state}`)
  }

  return state as SoundGate1APrState
}

function readSoundCategory(value: unknown, context: string): SoundMusicAudioCategory {
  const category = readString(value, context)
  if (!soundCategories.has(category as SoundMusicAudioCategory)) {
    throw new Error(`${context} is unsupported: ${category}`)
  }

  return category as SoundMusicAudioCategory
}

function readProductionToolId(value: unknown, context: string): SoundGate1AEvidenceSeedRow['productionToolId'] {
  if (value === null) return null
  const toolId = readString(value, context)
  if (!isProductionToolId(toolId)) {
    throw new Error(`${context} is not a first-class ProductionToolId: ${toolId}`)
  }

  return toolId
}

function readCoverage(value: unknown, context: string): SoundGate1ACoverage {
  assertObject(value, context)

  return {
    hasFirstClassStudyCard: readBoolean(value.hasFirstClassStudyCard, `${context}.hasFirstClassStudyCard`),
    hasCandidateStudyCard: readBoolean(value.hasCandidateStudyCard, `${context}.hasCandidateStudyCard`),
    hasAdapterContract: readBoolean(value.hasAdapterContract, `${context}.hasAdapterContract`),
    hasSafeCommandIntent: readBoolean(value.hasSafeCommandIntent, `${context}.hasSafeCommandIntent`),
    hasFixturePlan: readBoolean(value.hasFixturePlan, `${context}.hasFixturePlan`),
    hasControlledProbe: readBoolean(value.hasControlledProbe, `${context}.hasControlledProbe`),
  }
}

function readReportedResult(value: unknown, context: string): SoundGate1AReportedResult {
  assertObject(value, context)
  const result = {
    metadataCheckPassed: readNumber(value.metadataCheckPassed, `${context}.metadataCheckPassed`),
    metadataCheckFailed: readNumber(value.metadataCheckFailed, `${context}.metadataCheckFailed`),
    importCheckPassed: readNumber(value.importCheckPassed, `${context}.importCheckPassed`),
    importCheckFailed: readNumber(value.importCheckFailed, `${context}.importCheckFailed`),
    failedImports: readStringArray(value.failedImports, `${context}.failedImports`),
    pythonObserved: readString(value.pythonObserved, `${context}.pythonObserved`),
    tempVenvRemoved: readBoolean(value.tempVenvRemoved, `${context}.tempVenvRemoved`),
    proofRunnerPath: readString(value.proofRunnerPath, `${context}.proofRunnerPath`),
  }

  if (result.metadataCheckPassed !== 13 || result.metadataCheckFailed !== 0) {
    throw new Error(`${context} must report 13 metadata checks passed and 0 failed.`)
  }
  if (result.importCheckPassed !== 14 || result.importCheckFailed !== 0 || result.failedImports.length !== 0) {
    throw new Error(`${context} must report 14 import checks passed, 0 failed, and no failed imports.`)
  }
  if (!result.tempVenvRemoved) {
    throw new Error(`${context} must report temp venv cleanup.`)
  }

  return result
}

function readExecutionGate(value: unknown, context: string): SoundGate1AExecutionGate {
  const gate = readString(value, context)
  if (!executionGates.has(gate as SoundGate1AExecutionGate)) {
    throw new Error(`${context} is unsupported: ${gate}`)
  }

  return gate as SoundGate1AExecutionGate
}

function readPendingAction(value: unknown, context: string): SoundGate1APendingAction {
  const action = readString(value, context)
  if (!pendingActions.has(action as SoundGate1APendingAction)) {
    throw new Error(`${context} is unsupported: ${action}`)
  }

  return action as SoundGate1APendingAction
}

function readDuplicateRisk(value: unknown, context: string): SoundGate1ADuplicateRisk {
  const duplicateRisk = readString(value, context)
  if (!duplicateRisks.has(duplicateRisk as SoundGate1ADuplicateRisk)) {
    throw new Error(`${context} is unsupported: ${duplicateRisk}`)
  }

  return duplicateRisk as SoundGate1ADuplicateRisk
}

function readSeedRow(value: unknown, context: string): SoundGate1AEvidenceSeedRow {
  assertObject(value, context)
  const row: SoundGate1AEvidenceSeedRow = {
    normalizedToolId: readString(value.normalizedToolId, `${context}.normalizedToolId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    gate1aEvidenceStatus: readEvidenceStatuses(value.gate1aEvidenceStatus, `${context}.gate1aEvidenceStatus`),
    prNumber: readNumber(value.prNumber, `${context}.prNumber`) as 647,
    prState: readPrState(value.prState, `${context}.prState`),
    draft: readNullableBoolean(value.draft, `${context}.draft`),
    mergeable: readNullableString(value.mergeable, `${context}.mergeable`),
    evidenceIsFinalSourceOfTruth: readBoolean(value.evidenceIsFinalSourceOfTruth, `${context}.evidenceIsFinalSourceOfTruth`),
    packageName: readNullableString(value.packageName, `${context}.packageName`),
    aliasFor: readNullableString(value.aliasFor, `${context}.aliasFor`),
    productionToolId: readProductionToolId(value.productionToolId, `${context}.productionToolId`),
    candidateStudyCardId: readNullableString(value.candidateStudyCardId, `${context}.candidateStudyCardId`),
    soundCategory: readSoundCategory(value.soundCategory, `${context}.soundCategory`),
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    gate1aReportedResult: readReportedResult(value.gate1aReportedResult, `${context}.gate1aReportedResult`),
    currentToolCallingCoverage: readCoverage(value.currentToolCallingCoverage, `${context}.currentToolCallingCoverage`),
    selectableAsRuntimeTool: readBoolean(value.selectableAsRuntimeTool, `${context}.selectableAsRuntimeTool`),
    executionGate: readExecutionGate(value.executionGate, `${context}.executionGate`),
    toolCallingPendingAction: readPendingAction(value.toolCallingPendingAction, `${context}.toolCallingPendingAction`),
    duplicateRisk: readDuplicateRisk(value.duplicateRisk, `${context}.duplicateRisk`),
    notes: readString(value.notes, `${context}.notes`),
  }

  if (row.prNumber !== 647) {
    throw new Error(`${context}.prNumber must be 647.`)
  }
  if (!row.productionToolId && row.selectableAsRuntimeTool) {
    throw new Error(`${context} is selectable without a first-class ProductionToolId.`)
  }
  if (row.evidenceIsFinalSourceOfTruth && row.prState !== 'merged') {
    throw new Error(`${context} cannot be final source-of-truth unless PR #647 is merged.`)
  }

  return row
}

function assertRequiredRows(rows: readonly SoundGate1AEvidenceSeedRow[]): void {
  const rowIds = new Set(rows.map((row) => row.normalizedToolId))
  const required = [
    ...SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES,
    ...SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS,
    'signalsmith_stretch',
    'deepfilternet',
    'demucs',
    'rnnoise',
    'rubber_band',
    'soundtouch',
    'essentia',
    'whisper_cpp',
    ...SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS,
    ...SOUND_RUNTIME_GATE_1_PLANNING_ONLY_JOB_TYPES,
  ]
  const missing = required.filter((toolId) => !rowIds.has(toolId))
  if (missing.length > 0) {
    throw new Error(`Sound Gate 1A matrix missing rows: ${missing.join(', ')}`)
  }
  const duplicates = rows
    .map((row) => row.normalizedToolId)
    .filter((toolId, index, values) => values.indexOf(toolId) !== index)
  if (duplicates.length > 0) {
    throw new Error(`Sound Gate 1A matrix has duplicate rows: ${duplicates.join(', ')}`)
  }
}

export function loadSoundGate1AEvidenceSources(): SoundGate1AEvidenceSourceBundle {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'sound gate 1a evidence matrix')
  if (parsed.schema !== SOUND_GATE_1A_EVIDENCE_OVERLAY_MATRIX_SCHEMA) {
    throw new Error('Sound Gate 1A evidence matrix schema is unsupported.')
  }
  assertObject(parsed.evidenceSummary, 'sound gate 1a evidence matrix evidenceSummary')
  if (parsed.evidenceSummary.sourcePr !== 647) {
    throw new Error('Sound Gate 1A evidence matrix must reference PR #647.')
  }
  if (parsed.evidenceSummary.sourceMilestone !== 'SOUND-RUNTIME-MEDIA-GATE-1A') {
    throw new Error('Sound Gate 1A evidence matrix must reference SOUND-RUNTIME-MEDIA-GATE-1A.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('Sound Gate 1A evidence matrix rows must be an array.')
  }

  const rows = parsed.rows.map((row, index) => readSeedRow(row, `rows[${index}]`))
  assertRequiredRows(rows)

  return {
    matrixDocument: {
      schema: SOUND_GATE_1A_EVIDENCE_OVERLAY_MATRIX_SCHEMA,
      evidenceSummary: {
        sourcePr: 647,
        sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1A',
        sourceDecision: readString(parsed.evidenceSummary.sourceDecision, 'evidenceSummary.sourceDecision'),
        requirementsPath: readString(parsed.evidenceSummary.requirementsPath, 'evidenceSummary.requirementsPath'),
        proofRunnerPath: readString(parsed.evidenceSummary.proofRunnerPath, 'evidenceSummary.proofRunnerPath'),
        reportedPython3: readString(parsed.evidenceSummary.reportedPython3, 'evidenceSummary.reportedPython3'),
        reportedPython: readString(parsed.evidenceSummary.reportedPython, 'evidenceSummary.reportedPython') as 'unavailable',
        metadataCheckPassed: readNumber(parsed.evidenceSummary.metadataCheckPassed, 'evidenceSummary.metadataCheckPassed') as 13,
        metadataCheckFailed: readNumber(parsed.evidenceSummary.metadataCheckFailed, 'evidenceSummary.metadataCheckFailed') as 0,
        importCheckPassed: readNumber(parsed.evidenceSummary.importCheckPassed, 'evidenceSummary.importCheckPassed') as 14,
        importCheckFailed: readNumber(parsed.evidenceSummary.importCheckFailed, 'evidenceSummary.importCheckFailed') as 0,
        failedImports: readStringArray(parsed.evidenceSummary.failedImports, 'evidenceSummary.failedImports'),
        aliasCoveredToolCount: readNumber(parsed.evidenceSummary.aliasCoveredToolCount, 'evidenceSummary.aliasCoveredToolCount') as 2,
        directPinnedPackageCount: readNumber(parsed.evidenceSummary.directPinnedPackageCount, 'evidenceSummary.directPinnedPackageCount') as 13,
        tempVenvRemoved: readBoolean(parsed.evidenceSummary.tempVenvRemoved, 'evidenceSummary.tempVenvRemoved') as true,
      },
      rows,
    },
  }
}
