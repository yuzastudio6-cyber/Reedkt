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
  SoundRuntimeGate1DuplicateRisk,
  SoundRuntimeGate1EvidenceStatus,
  SoundRuntimeGate1FutureOwnerPrompt,
  SoundRuntimeGate1Coverage,
} from './sound-runtime-gate-1-reconciliation-types'
import type {
  SoundGate1AMergedEvidenceStatus,
  SoundGate1AMergedExecutionGate,
  SoundGate1AMergedInstallProofStatus,
  SoundGate1AMergedPendingAction,
  SoundGate1AMergedReportedResult,
  SoundGate1AMergedSeedRow,
  SoundGate1AMergedSourceBundle,
} from './sound-gate-1a-merged-reconciliation-types'

export const SOUND_GATE_1A_MERGED_RECONCILIATION_MATRIX_SCHEMA = 'reeditpro.soundGate1AMergedReconciliationMatrix.v1'
export const SOUND_GATE_1A_MERGED_SOURCE_PR = 647
export const SOUND_GATE_1A_MERGED_MERGE_COMMIT = '0126327c19f1af18bb1ca040c31d06736693d1b6'
export const SOUND_GATE_1A_REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'
export const SOUND_GATE_1A_PROOF_RUNNER_PATH = 'scripts/validation/sound-runtime-media-gate-1a-controlled-cpu-install-proof-runner.py'

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/sound-gate-1a-merged-reconciliation-matrix.json', import.meta.url)

const gate1aEvidenceStatuses = new Set<SoundGate1AMergedEvidenceStatus>([
  'merged_owner_source_evidence',
  'blocked_by_owner_gate',
])

const gate1EvidenceStatuses = new Set<SoundRuntimeGate1EvidenceStatus>([
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

const installProofStatuses = new Set<SoundGate1AMergedInstallProofStatus>([
  'gate_1a_merged_controlled_install_proof',
  'planning_only_no_install_proof',
  'pinned_requirement_only',
  'future_gate_1a_required',
  'not_applicable',
  'unknown',
])

const executionGates = new Set<SoundGate1AMergedExecutionGate>([
  'blocked_no_execution',
  'blocked_pending_gate_1b_worker_contract_review',
  'blocked_pending_model_review',
  'blocked_pending_media_policy',
  'planning_only',
])

const futureOwnerPrompts = new Set<SoundRuntimeGate1FutureOwnerPrompt>([
  'SOUND-RUNTIME-MEDIA-GATE-1A',
  'SOUND-RUNTIME-MEDIA-GATE-1B',
  'SOUND-RUNTIME-MEDIA-GATE-2',
  'SOUND-RUNTIME-MEDIA-GATE-3',
  'none',
])

const pendingActions = new Set<SoundGate1AMergedPendingAction>([
  'none',
  'future_controlled_import_probe_planning',
  'future_registry_expansion_after_owner_proof',
  'wait_for_sound_gate_1b',
  'wait_for_model_weight_review',
  'wait_for_media_policy_handoff',
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

function readEnum<T extends string>(value: unknown, allowed: ReadonlySet<T>, context: string): T {
  const normalized = readString(value, context)
  if (!allowed.has(normalized as T)) {
    throw new Error(`${context} is unsupported: ${normalized}`)
  }

  return normalized as T
}

function readEnumArray<T extends string>(value: unknown, allowed: ReadonlySet<T>, context: string): T[] {
  return readStringArray(value, context).map((entry) => readEnum(entry, allowed, context))
}

function readSoundCategory(value: unknown, context: string): SoundMusicAudioCategory {
  return readEnum(value, soundCategories, context)
}

function readProductionToolId(value: unknown, context: string): SoundGate1AMergedSeedRow['productionToolId'] {
  if (value === null) return null
  const toolId = readString(value, context)
  if (!isProductionToolId(toolId)) {
    throw new Error(`${context} is not a first-class ProductionToolId: ${toolId}`)
  }

  return toolId
}

function readReportedResult(value: unknown, context: string): SoundGate1AMergedReportedResult {
  assertObject(value, context)
  const importChecksInclude = readStringArray(value.importChecksInclude, `${context}.importChecksInclude`)
  const failedImports = readStringArray(value.failedImports, `${context}.failedImports`)
  if (importChecksInclude.length !== 1 || importChecksInclude[0] !== 'scipy.signal') {
    throw new Error(`${context}.importChecksInclude must include only scipy.signal.`)
  }
  if (failedImports.length !== 0) {
    throw new Error(`${context}.failedImports must be empty.`)
  }

  return {
    metadataChecksPassed: readNumber(value.metadataChecksPassed, `${context}.metadataChecksPassed`) as 13,
    metadataChecksFailed: readNumber(value.metadataChecksFailed, `${context}.metadataChecksFailed`) as 0,
    importChecksPassed: readNumber(value.importChecksPassed, `${context}.importChecksPassed`) as 14,
    importChecksFailed: readNumber(value.importChecksFailed, `${context}.importChecksFailed`) as 0,
    importChecksInclude: ['scipy.signal'],
    failedImports: [],
    python3Observed: readString(value.python3Observed, `${context}.python3Observed`) as '3.13.13',
    pythonUnavailable: readBoolean(value.pythonUnavailable, `${context}.pythonUnavailable`) as true,
    tempVenvRemoved: readBoolean(value.tempVenvRemoved, `${context}.tempVenvRemoved`) as true,
    requirementsPath: readString(value.requirementsPath, `${context}.requirementsPath`) as SoundGate1AMergedReportedResult['requirementsPath'],
    proofRunnerPath: readString(value.proofRunnerPath, `${context}.proofRunnerPath`) as SoundGate1AMergedReportedResult['proofRunnerPath'],
  }
}

function assertReportedResult(result: SoundGate1AMergedReportedResult, context: string): void {
  if (
    result.metadataChecksPassed !== 13 ||
    result.metadataChecksFailed !== 0 ||
    result.importChecksPassed !== 14 ||
    result.importChecksFailed !== 0 ||
    result.python3Observed !== '3.13.13' ||
    result.pythonUnavailable !== true ||
    result.tempVenvRemoved !== true ||
    result.requirementsPath !== SOUND_GATE_1A_REQUIREMENTS_PATH ||
    result.proofRunnerPath !== SOUND_GATE_1A_PROOF_RUNNER_PATH
  ) {
    throw new Error(`${context} does not match expected Gate 1A proof facts.`)
  }
}

function readSeedRow(value: unknown, context: string): SoundGate1AMergedSeedRow {
  assertObject(value, context)
  const gate1aReportedResult = readReportedResult(value.gate1aReportedResult, `${context}.gate1aReportedResult`)
  assertReportedResult(gate1aReportedResult, `${context}.gate1aReportedResult`)
  const row = {
    normalizedToolId: readString(value.normalizedToolId, `${context}.normalizedToolId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    gate1EvidenceStatus: readEnumArray(value.gate1EvidenceStatus, gate1EvidenceStatuses, `${context}.gate1EvidenceStatus`),
    gate1aEvidenceStatus: readEnumArray(value.gate1aEvidenceStatus, gate1aEvidenceStatuses, `${context}.gate1aEvidenceStatus`),
    prNumber: readNumber(value.prNumber, `${context}.prNumber`) as 647,
    prMerged: readBoolean(value.prMerged, `${context}.prMerged`) as true,
    mergeCommit: readString(value.mergeCommit, `${context}.mergeCommit`) as '0126327c19f1af18bb1ca040c31d06736693d1b6',
    evidenceIsFinalSourceOfTruth: readBoolean(value.evidenceIsFinalSourceOfTruth, `${context}.evidenceIsFinalSourceOfTruth`) as true,
    gate1aReportedResult,
    packageName: readNullableString(value.packageName, `${context}.packageName`),
    aliasFor: readNullableString(value.aliasFor, `${context}.aliasFor`),
    productionToolId: readProductionToolId(value.productionToolId, `${context}.productionToolId`),
    candidateStudyCardId: readNullableString(value.candidateStudyCardId, `${context}.candidateStudyCardId`),
    soundCategory: readSoundCategory(value.soundCategory, `${context}.soundCategory`),
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    currentToolCallingCoverage: readCoverage(value.currentToolCallingCoverage, `${context}.currentToolCallingCoverage`),
    selectableAsRuntimeTool: readBoolean(value.selectableAsRuntimeTool, `${context}.selectableAsRuntimeTool`),
    installProofStatus: readEnum(value.installProofStatus, installProofStatuses, `${context}.installProofStatus`),
    executionGate: readEnum(value.executionGate, executionGates, `${context}.executionGate`),
    futureOwnerPrompt: readEnum(value.futureOwnerPrompt, futureOwnerPrompts, `${context}.futureOwnerPrompt`),
    toolCallingPendingAction: readEnum(value.toolCallingPendingAction, pendingActions, `${context}.toolCallingPendingAction`),
    duplicateRisk: readEnum(value.duplicateRisk, duplicateRisks, `${context}.duplicateRisk`),
    notes: readString(value.notes, `${context}.notes`),
  }

  if (row.prNumber !== SOUND_GATE_1A_MERGED_SOURCE_PR || row.prMerged !== true) {
    throw new Error(`${context} must reference merged PR #647.`)
  }
  if (row.mergeCommit !== SOUND_GATE_1A_MERGED_MERGE_COMMIT) {
    throw new Error(`${context} must reference merge commit ${SOUND_GATE_1A_MERGED_MERGE_COMMIT}.`)
  }
  if (row.evidenceIsFinalSourceOfTruth !== true) {
    throw new Error(`${context} must mark PR #647 as final owner source evidence.`)
  }
  if (!row.gate1aEvidenceStatus.includes('merged_owner_source_evidence')) {
    throw new Error(`${context} must include merged_owner_source_evidence.`)
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

function assertRequiredRows(rows: readonly SoundGate1AMergedSeedRow[]): void {
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
    throw new Error(`Sound Gate 1A merged matrix is missing required rows: ${missingIds.join(', ')}`)
  }

  const directPinnedCount = rows.filter((row) => row.gate1EvidenceStatus.includes('direct_pinned_package')).length
  if (directPinnedCount !== SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.length) {
    throw new Error(`Sound Gate 1A direct-pinned count must be ${SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.length}; received ${directPinnedCount}.`)
  }
  const aliasCoveredCount = rows.filter((row) => row.gate1EvidenceStatus.includes('alias_covered_tool')).length
  if (aliasCoveredCount !== SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS.length) {
    throw new Error(`Sound Gate 1A alias-covered count must be ${SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS.length}; received ${aliasCoveredCount}.`)
  }
  const duplicateIds = rows
    .map((row) => row.normalizedToolId)
    .filter((toolId, index, values) => values.indexOf(toolId) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`Sound Gate 1A merged matrix has duplicate rows: ${duplicateIds.join(', ')}`)
  }
}

export function loadSoundGate1AMergedSources(): SoundGate1AMergedSourceBundle {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'sound gate 1a merged matrix')
  if (parsed.schema !== SOUND_GATE_1A_MERGED_RECONCILIATION_MATRIX_SCHEMA) {
    throw new Error('Sound Gate 1A merged matrix schema is unsupported.')
  }
  assertObject(parsed.evidenceSummary, 'sound gate 1a merged matrix evidenceSummary')
  if (parsed.evidenceSummary.sourcePr !== SOUND_GATE_1A_MERGED_SOURCE_PR) {
    throw new Error('Sound Gate 1A merged matrix must reference PR #647.')
  }
  if (parsed.evidenceSummary.sourceMilestone !== 'SOUND-RUNTIME-MEDIA-GATE-1A') {
    throw new Error('Sound Gate 1A merged matrix must reference SOUND-RUNTIME-MEDIA-GATE-1A.')
  }
  if (parsed.evidenceSummary.mergeCommit !== SOUND_GATE_1A_MERGED_MERGE_COMMIT) {
    throw new Error('Sound Gate 1A merged matrix has the wrong merge commit.')
  }
  if (parsed.evidenceSummary.evidenceIsFinalSourceOfTruth !== true || parsed.evidenceSummary.prMerged !== true) {
    throw new Error('Sound Gate 1A merged matrix must mark PR #647 as merged final owner evidence.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('Sound Gate 1A merged matrix rows must be an array.')
  }

  const rows = parsed.rows.map((row, index) => readSeedRow(row, `rows[${index}]`))
  assertRequiredRows(rows)

  return {
    matrixDocument: {
      schema: SOUND_GATE_1A_MERGED_RECONCILIATION_MATRIX_SCHEMA,
      evidenceSummary: {
        sourcePr: 647,
        sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1A',
        sourceDecision: readString(parsed.evidenceSummary.sourceDecision, 'evidenceSummary.sourceDecision'),
        prMerged: true,
        mergeCommit: SOUND_GATE_1A_MERGED_MERGE_COMMIT,
        evidenceIsFinalSourceOfTruth: true,
        requirementsPath: SOUND_GATE_1A_REQUIREMENTS_PATH,
        proofRunnerPath: SOUND_GATE_1A_PROOF_RUNNER_PATH,
        metadataChecksPassed: readNumber(parsed.evidenceSummary.metadataChecksPassed, 'evidenceSummary.metadataChecksPassed') as 13,
        metadataChecksFailed: readNumber(parsed.evidenceSummary.metadataChecksFailed, 'evidenceSummary.metadataChecksFailed') as 0,
        importChecksPassed: readNumber(parsed.evidenceSummary.importChecksPassed, 'evidenceSummary.importChecksPassed') as 14,
        importChecksFailed: readNumber(parsed.evidenceSummary.importChecksFailed, 'evidenceSummary.importChecksFailed') as 0,
        importChecksInclude: ['scipy.signal'],
        failedImports: [],
        python3Observed: readString(parsed.evidenceSummary.python3Observed, 'evidenceSummary.python3Observed') as '3.13.13',
        pythonUnavailable: readBoolean(parsed.evidenceSummary.pythonUnavailable, 'evidenceSummary.pythonUnavailable') as true,
        tempVenvRemoved: readBoolean(parsed.evidenceSummary.tempVenvRemoved, 'evidenceSummary.tempVenvRemoved') as true,
        directPinnedPackageCount: readNumber(parsed.evidenceSummary.directPinnedPackageCount, 'evidenceSummary.directPinnedPackageCount') as 13,
        aliasCoveredToolCount: readNumber(parsed.evidenceSummary.aliasCoveredToolCount, 'evidenceSummary.aliasCoveredToolCount') as 2,
        gate1RowCount: readNumber(parsed.evidenceSummary.gate1RowCount, 'evidenceSummary.gate1RowCount') as 29,
        noImportsRunByToolCalling: readBoolean(parsed.evidenceSummary.noImportsRunByToolCalling, 'evidenceSummary.noImportsRunByToolCalling') as true,
        adaptersAdded: readNumber(parsed.evidenceSummary.adaptersAdded, 'evidenceSummary.adaptersAdded') as 0,
        commandIntentsAdded: readNumber(parsed.evidenceSummary.commandIntentsAdded, 'evidenceSummary.commandIntentsAdded') as 0,
        probesAdded: readNumber(parsed.evidenceSummary.probesAdded, 'evidenceSummary.probesAdded') as 0,
        nextOwnerPrompts: readStringArray(parsed.evidenceSummary.nextOwnerPrompts, 'evidenceSummary.nextOwnerPrompts')
          .map((prompt) => readEnum(prompt, futureOwnerPrompts, 'evidenceSummary.nextOwnerPrompts')),
      },
      rows,
    },
  }
}
