import {
  readFileSync,
} from 'node:fs'
import {
  isProductionToolId,
} from '../tool-registry'
import type {
  SoundMusicAudioCategory,
} from './sound-music-audio-owner-expansion-types'
import type {
  SoundRuntimeGate1DuplicateRisk,
  SoundRuntimeGate1EvidenceStatus,
  SoundRuntimeGate1ExecutionGate,
  SoundRuntimeGate1FutureOwnerPrompt,
  SoundRuntimeGate1InstallProofStatus,
  SoundRuntimeGate1PendingAction,
  SoundRuntimeGate1SeedRow,
  SoundRuntimeGate1SourceBundle,
  SoundRuntimeGate1Coverage,
} from './sound-runtime-gate-1-reconciliation-types'

export const SOUND_RUNTIME_GATE_1_RECONCILIATION_MATRIX_SCHEMA = 'reeditpro.soundRuntimeGate1ReconciliationMatrix.v1'

export const SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
] as const

export const SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS = [
  'pydub_effects',
  'ebu_r128_pyloudnorm',
] as const

export const SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS = [
  'sound-audio-metadata-worker',
  'sound-cpu-analysis-worker',
] as const

export const SOUND_RUNTIME_GATE_1_PLANNING_ONLY_JOB_TYPES = [
  'loudness_synthetic_analysis_job_type',
  'numeric_array_analysis_job_type',
  'package_import_smoke_job_type',
  'symbolic_midi_analysis_job_type',
] as const

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/sound-runtime-gate-1-reconciliation-matrix.json', import.meta.url)

const evidenceStatuses = new Set<SoundRuntimeGate1EvidenceStatus>([
  'direct_pinned_package',
  'alias_covered_tool',
  'approved_plan_covered_planning_only',
  'first_class_production_tool_id',
  'candidate_study_card_only',
  'owner_inventory_only',
  'blocked_model_gpu',
  'blocked_system_binary_runtime_handoff',
  'blocked_evaluation',
  'provider_handoff_only',
  'blocked_media_policy',
  'unknown',
])

const installProofStatuses = new Set<SoundRuntimeGate1InstallProofStatus>([
  'planning_only_no_install_proof',
  'pinned_requirement_only',
  'future_gate_1a_required',
  'not_applicable',
  'unknown',
])

const executionGates = new Set<SoundRuntimeGate1ExecutionGate>([
  'blocked_no_execution',
  'blocked_pending_gate_1a_controlled_install_proof',
  'blocked_pending_gate_1b_worker_contract_review',
  'blocked_pending_model_review',
  'blocked_pending_media_policy',
  'blocked_provider_handoff_only',
  'planning_only',
])

const futureOwnerPrompts = new Set<SoundRuntimeGate1FutureOwnerPrompt>([
  'SOUND-RUNTIME-MEDIA-GATE-1A',
  'SOUND-RUNTIME-MEDIA-GATE-1B',
  'SOUND-RUNTIME-MEDIA-GATE-2',
  'SOUND-RUNTIME-MEDIA-GATE-3',
  'none',
])

const pendingActions = new Set<SoundRuntimeGate1PendingAction>([
  'none',
  'wait_for_sound_gate_1a',
  'wait_for_sound_gate_1b',
  'wait_for_model_weight_review',
  'wait_for_media_policy_handoff',
  'add_candidate_study_card',
  'future_registry_expansion_after_owner_proof',
  'do_not_duplicate_owner_lane',
])

const duplicateRisks = new Set<SoundRuntimeGate1DuplicateRisk>([
  'none',
  'do_not_duplicate_owner_lane',
  'possible_duplicate_registry_id',
  'possible_duplicate_adapter',
  'possible_duplicate_worker_route',
  'possible_duplicate_owner_lane',
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

function readStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${context} must be an array of strings.`)
  }

  return [...new Set(value)].sort((left, right) => left.localeCompare(right))
}

function readBoolean(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${context} must be a boolean.`)
  }

  return value
}

function readNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${context} must be a finite number.`)
  }

  return value
}

function readCoverage(value: unknown, context: string): SoundRuntimeGate1Coverage {
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

function readEvidenceStatuses(value: unknown, context: string): SoundRuntimeGate1EvidenceStatus[] {
  return readStringArray(value, context).map((status) => {
    if (!evidenceStatuses.has(status as SoundRuntimeGate1EvidenceStatus)) {
      throw new Error(`${context} contains unsupported Gate 1 evidence status: ${status}`)
    }

    return status as SoundRuntimeGate1EvidenceStatus
  })
}

function readSoundCategory(value: unknown, context: string): SoundMusicAudioCategory {
  const category = readString(value, context)
  if (!soundCategories.has(category as SoundMusicAudioCategory)) {
    throw new Error(`${context} is not a supported Sound category: ${category}`)
  }

  return category as SoundMusicAudioCategory
}

function readProductionToolId(value: unknown, context: string): SoundRuntimeGate1SeedRow['productionToolId'] {
  if (value === null) return null
  const toolId = readString(value, context)
  if (!isProductionToolId(toolId)) {
    throw new Error(`${context} is not a first-class ProductionToolId: ${toolId}`)
  }

  return toolId
}

function readInstallProofStatus(value: unknown, context: string): SoundRuntimeGate1InstallProofStatus {
  const status = readString(value, context)
  if (!installProofStatuses.has(status as SoundRuntimeGate1InstallProofStatus)) {
    throw new Error(`${context} is unsupported: ${status}`)
  }

  return status as SoundRuntimeGate1InstallProofStatus
}

function readExecutionGate(value: unknown, context: string): SoundRuntimeGate1ExecutionGate {
  const gate = readString(value, context)
  if (!executionGates.has(gate as SoundRuntimeGate1ExecutionGate)) {
    throw new Error(`${context} is unsupported: ${gate}`)
  }

  return gate as SoundRuntimeGate1ExecutionGate
}

function readFutureOwnerPrompt(value: unknown, context: string): SoundRuntimeGate1FutureOwnerPrompt {
  const prompt = readString(value, context)
  if (!futureOwnerPrompts.has(prompt as SoundRuntimeGate1FutureOwnerPrompt)) {
    throw new Error(`${context} is unsupported: ${prompt}`)
  }

  return prompt as SoundRuntimeGate1FutureOwnerPrompt
}

function readPendingAction(value: unknown, context: string): SoundRuntimeGate1PendingAction {
  const action = readString(value, context)
  if (!pendingActions.has(action as SoundRuntimeGate1PendingAction)) {
    throw new Error(`${context} is unsupported: ${action}`)
  }

  return action as SoundRuntimeGate1PendingAction
}

function readDuplicateRisk(value: unknown, context: string): SoundRuntimeGate1DuplicateRisk {
  const duplicateRisk = readString(value, context)
  if (!duplicateRisks.has(duplicateRisk as SoundRuntimeGate1DuplicateRisk)) {
    throw new Error(`${context} is unsupported: ${duplicateRisk}`)
  }

  return duplicateRisk as SoundRuntimeGate1DuplicateRisk
}

function readSeedRow(value: unknown, context: string): SoundRuntimeGate1SeedRow {
  assertObject(value, context)
  const row = {
    normalizedToolId: readString(value.normalizedToolId, `${context}.normalizedToolId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    gate1EvidenceStatus: readEvidenceStatuses(value.gate1EvidenceStatus, `${context}.gate1EvidenceStatus`),
    packageName: readNullableString(value.packageName, `${context}.packageName`),
    aliasFor: readNullableString(value.aliasFor, `${context}.aliasFor`),
    productionToolId: readProductionToolId(value.productionToolId, `${context}.productionToolId`),
    candidateStudyCardId: readNullableString(value.candidateStudyCardId, `${context}.candidateStudyCardId`),
    soundCategory: readSoundCategory(value.soundCategory, `${context}.soundCategory`),
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    currentToolCallingCoverage: readCoverage(value.currentToolCallingCoverage, `${context}.currentToolCallingCoverage`),
    selectableAsRuntimeTool: readBoolean(value.selectableAsRuntimeTool, `${context}.selectableAsRuntimeTool`),
    installProofStatus: readInstallProofStatus(value.installProofStatus, `${context}.installProofStatus`),
    executionGate: readExecutionGate(value.executionGate, `${context}.executionGate`),
    futureOwnerPrompt: readFutureOwnerPrompt(value.futureOwnerPrompt, `${context}.futureOwnerPrompt`),
    toolCallingPendingAction: readPendingAction(value.toolCallingPendingAction, `${context}.toolCallingPendingAction`),
    duplicateRisk: readDuplicateRisk(value.duplicateRisk, `${context}.duplicateRisk`),
    notes: readString(value.notes, `${context}.notes`),
  }

  if (!row.productionToolId && row.selectableAsRuntimeTool) {
    throw new Error(`${context} is selectable without a first-class ProductionToolId.`)
  }
  if (row.gate1EvidenceStatus.includes('direct_pinned_package') && !row.packageName) {
    throw new Error(`${context} is direct-pinned but has no packageName.`)
  }
  if (row.gate1EvidenceStatus.includes('alias_covered_tool') && !row.aliasFor) {
    throw new Error(`${context} is alias-covered but has no aliasFor.`)
  }

  return row
}

function assertRequiredRows(rows: readonly SoundRuntimeGate1SeedRow[]): void {
  const rowIds = new Set(rows.map((row) => row.normalizedToolId))
  const requiredIds = [
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
  const missingIds = requiredIds.filter((toolId) => !rowIds.has(toolId))
  if (missingIds.length > 0) {
    throw new Error(`Sound Runtime Gate 1 matrix is missing required rows: ${missingIds.join(', ')}`)
  }

  const directPinnedCount = rows.filter((row) => row.gate1EvidenceStatus.includes('direct_pinned_package')).length
  if (directPinnedCount !== SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.length) {
    throw new Error(`Sound Runtime Gate 1 direct-pinned count must be ${SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.length}; received ${directPinnedCount}.`)
  }
  const aliasCoveredCount = rows.filter((row) => row.gate1EvidenceStatus.includes('alias_covered_tool')).length
  if (aliasCoveredCount !== SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS.length) {
    throw new Error(`Sound Runtime Gate 1 alias-covered count must be ${SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS.length}; received ${aliasCoveredCount}.`)
  }
  const duplicateIds = rows
    .map((row) => row.normalizedToolId)
    .filter((toolId, index, values) => values.indexOf(toolId) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`Sound Runtime Gate 1 matrix has duplicate rows: ${duplicateIds.join(', ')}`)
  }
}

export function loadSoundRuntimeGate1Sources(): SoundRuntimeGate1SourceBundle {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'sound runtime gate 1 matrix')
  if (parsed.schema !== SOUND_RUNTIME_GATE_1_RECONCILIATION_MATRIX_SCHEMA) {
    throw new Error('Sound Runtime Gate 1 matrix schema is unsupported.')
  }
  assertObject(parsed.evidenceSummary, 'sound runtime gate 1 matrix evidenceSummary')
  if (parsed.evidenceSummary.sourcePr !== 640) {
    throw new Error('Sound Runtime Gate 1 matrix must reference PR #640.')
  }
  if (parsed.evidenceSummary.sourceMilestone !== 'SOUND-RUNTIME-MEDIA-GATE-1') {
    throw new Error('Sound Runtime Gate 1 matrix must reference SOUND-RUNTIME-MEDIA-GATE-1.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('Sound Runtime Gate 1 matrix rows must be an array.')
  }

  const rows = parsed.rows.map((row, index) => readSeedRow(row, `rows[${index}]`))
  assertRequiredRows(rows)

  return {
    matrixDocument: {
      schema: SOUND_RUNTIME_GATE_1_RECONCILIATION_MATRIX_SCHEMA,
      evidenceSummary: {
        sourcePr: 640,
        sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1',
        sourceDecision: readString(parsed.evidenceSummary.sourceDecision, 'evidenceSummary.sourceDecision'),
        cpuInstallCandidateCount: readNumber(parsed.evidenceSummary.cpuInstallCandidateCount, 'evidenceSummary.cpuInstallCandidateCount'),
        directPinnedPackageCount: readNumber(parsed.evidenceSummary.directPinnedPackageCount, 'evidenceSummary.directPinnedPackageCount') as 13,
        aliasCoveredToolCount: readNumber(parsed.evidenceSummary.aliasCoveredToolCount, 'evidenceSummary.aliasCoveredToolCount') as 2,
        planningOnlyWorkerNames: readStringArray(parsed.evidenceSummary.planningOnlyWorkerNames, 'evidenceSummary.planningOnlyWorkerNames'),
        planningOnlyJobTypes: readStringArray(parsed.evidenceSummary.planningOnlyJobTypes, 'evidenceSummary.planningOnlyJobTypes'),
        nextOwnerPrompts: readStringArray(parsed.evidenceSummary.nextOwnerPrompts, 'evidenceSummary.nextOwnerPrompts')
          .map((prompt) => readFutureOwnerPrompt(prompt, 'evidenceSummary.nextOwnerPrompts')) as SoundRuntimeGate1FutureOwnerPrompt[],
      },
      rows,
    },
  }
}
