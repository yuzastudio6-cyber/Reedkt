import {
  readFileSync,
} from 'node:fs'
import {
  isProductionToolId,
} from '../tool-registry'
import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  SoundGate1CMergedCoverage,
  SoundGate1CMergedDuplicateRisk,
  SoundGate1CMergedEvidenceStatus,
  SoundGate1CMergedExecutionGate,
  SoundGate1CMergedItemType,
  SoundGate1CMergedPendingAction,
  SoundGate1CMergedReconciliationMatrixDocument,
  SoundGate1CMergedRow,
  SoundGate1CMergedSeedRow,
  SoundGate1CMergedSourceBundle,
} from './sound-gate-1c-merged-reconciliation-types'

export const SOUND_GATE_1C_MERGED_RECONCILIATION_MATRIX_SCHEMA = 'reeditpro.soundGate1CMergedReconciliationMatrix.v1'
export const SOUND_GATE_1C_MERGED_SOURCE_PR = 660
export const SOUND_GATE_1C_MERGED_MERGE_COMMIT = 'b46509a54695dd049d044fd7135b37a8faaef18e'

export const SOUND_GATE_1C_PLANNED_IMAGE_NAMES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
] as const

export const SOUND_GATE_1C_PRESERVED_WORKER_NAMES = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const SOUND_GATE_1C_PRESERVED_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export const SOUND_GATE_1C_DOC_SURFACES = [
  'cpu_worker_image_planning',
  'image_layers',
  'proof_ci',
  'gcp_cloud_run_handoff',
  'runtime_disabled_defaults',
  'excluded_tools',
] as const

export const SOUND_GATE_1C_BLOCKED_GATES = [
  'dockerfiles',
  'image_builds',
  'docker_calls',
  'gcp_calls',
  'cloud_run_calls',
  'service_accounts',
  'secret_manager',
  'worker_execution',
  'route_execution',
  'tool_execution',
  'media_file_open',
  'media_process',
  'media_write',
  'model_downloads',
  'providers_models',
  'supabase_sql',
  'signed_public_artifacts',
  'billing',
  'beta',
  'production',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime_readiness',
  'media_readiness',
  'beta_readiness',
  'production_readiness',
] as const

export const SOUND_GATE_1C_RELATED_SOUND_TOOLS = [
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
  'pydub_effects',
  'ebu_r128_pyloudnorm',
  'signalsmith_stretch',
  'deepfilternet',
  'demucs',
  'rnnoise',
  'rubber_band',
  'soundtouch',
  'essentia',
  'whisper_cpp',
] as const

export const SOUND_GATE_1C_NEXT_PROMPTS = [
  'SOUND-RUNTIME-MEDIA-GATE-1D',
  'SOUND-RUNTIME-MEDIA-GATE-1E',
] as const

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/sound-gate-1c-merged-reconciliation-matrix.json', import.meta.url)

const itemTypes = new Set<SoundGate1CMergedItemType>([
  'planned_image_name',
  'preserved_worker_name',
  'preserved_job_type',
  'gate_1c_doc_surface',
  'blocked_gate',
  'owner_handoff_surface',
  'related_sound_tool',
  'gate_1d_next_prompt',
  'gate_1e_next_prompt',
])

const executionGates = new Set<SoundGate1CMergedExecutionGate>([
  'blocked_no_execution',
  'blocked_pending_gate_1d_worker_runtime_owner_handoff',
  'blocked_pending_gate_1e_dockerfile_static_plan',
  'blocked_pending_media_policy',
  'blocked_pending_model_review',
  'blocked_owner_handoff_required',
  'planning_only',
])

const pendingActions = new Set<SoundGate1CMergedPendingAction>([
  'wait_for_gate_1d_worker_runtime_owner_handoff',
  'wait_for_gate_1e_dockerfile_static_plan',
  'wait_for_media_policy_handoff',
  'wait_for_model_weight_review',
  'future_worker_route_dry_run_after_owner_gate',
  'do_not_duplicate_owner_lane',
  'none',
])

const duplicateRisks = new Set<SoundGate1CMergedDuplicateRisk>([
  'none',
  'do_not_duplicate_owner_lane',
  'possible_duplicate_worker_route',
  'possible_duplicate_worker_image_plan',
  'possible_duplicate_dockerfile_plan',
  'possible_duplicate_owner_lane',
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

function readNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${context} must be a finite number.`)
  }

  return value
}

function readBoolean(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${context} must be a boolean.`)
  }

  return value
}

function readStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${context} must be an array of strings.`)
  }

  return [...new Set(value)].sort((left, right) => left.localeCompare(right))
}

function readEnum<T extends string>(value: unknown, allowed: ReadonlySet<T>, context: string): T {
  const normalized = readString(value, context)
  if (!allowed.has(normalized as T)) {
    throw new Error(`${context} is unsupported: ${normalized}`)
  }

  return normalized as T
}

function readProductionToolIds(value: unknown, context: string): ProductionToolId[] {
  return readStringArray(value, context).map((toolId) => {
    if (!isProductionToolId(toolId)) {
      throw new Error(`${context} contains non-first-class ProductionToolId: ${toolId}`)
    }

    return toolId
  })
}

function readCoverage(value: unknown, context: string): SoundGate1CMergedCoverage {
  assertObject(value, context)

  return {
    hasFirstClassStudyCard: readBoolean(value.hasFirstClassStudyCard, `${context}.hasFirstClassStudyCard`),
    hasCandidateStudyCard: readBoolean(value.hasCandidateStudyCard, `${context}.hasCandidateStudyCard`),
    hasAdapterContract: readBoolean(value.hasAdapterContract, `${context}.hasAdapterContract`),
    hasSafeCommandIntent: readBoolean(value.hasSafeCommandIntent, `${context}.hasSafeCommandIntent`),
    hasFixturePlan: readBoolean(value.hasFixturePlan, `${context}.hasFixturePlan`),
    hasControlledProbe: readBoolean(value.hasControlledProbe, `${context}.hasControlledProbe`),
    hasWorkerRouteDryRun: readBoolean(value.hasWorkerRouteDryRun, `${context}.hasWorkerRouteDryRun`),
  }
}

function readSeedRow(value: unknown, context: string): SoundGate1CMergedSeedRow {
  assertObject(value, context)

  return {
    normalizedItemId: readString(value.normalizedItemId, `${context}.normalizedItemId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    itemType: readEnum(value.itemType, itemTypes, `${context}.itemType`),
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    relatedProductionToolIds: readProductionToolIds(value.relatedProductionToolIds, `${context}.relatedProductionToolIds`),
    relatedCandidateStudyCards: readStringArray(value.relatedCandidateStudyCards, `${context}.relatedCandidateStudyCards`),
    acceptedByGate1C: readBoolean(value.acceptedByGate1C, `${context}.acceptedByGate1C`),
    currentToolCallingCoverage: readCoverage(value.currentToolCallingCoverage, `${context}.currentToolCallingCoverage`),
    executionGate: readEnum(value.executionGate, executionGates, `${context}.executionGate`),
    toolCallingPendingAction: readEnum(value.toolCallingPendingAction, pendingActions, `${context}.toolCallingPendingAction`),
    duplicateRisk: readEnum(value.duplicateRisk, duplicateRisks, `${context}.duplicateRisk`),
    notes: readString(value.notes, `${context}.notes`),
  }
}

function expandMergedRow(row: SoundGate1CMergedSeedRow): SoundGate1CMergedRow {
  const gate1cEvidenceStatus: SoundGate1CMergedEvidenceStatus[] = ['merged_owner_source_evidence']
  if (row.executionGate.startsWith('blocked_')) gate1cEvidenceStatus.push('blocked_by_owner_gate')
  if (row.itemType === 'gate_1d_next_prompt' || row.itemType === 'gate_1e_next_prompt') {
    gate1cEvidenceStatus.push('owner_next_prompt_only')
  }

  return {
    ...row,
    gate1cEvidenceStatus,
    prNumber: 660,
    prMerged: true,
    mergeCommit: SOUND_GATE_1C_MERGED_MERGE_COMMIT,
    evidenceIsFinalSourceOfTruth: true,
    acceptedForExecution: false,
    imageBuildAllowedNow: false,
    dockerfileMutationAllowedNow: false,
    gcpCallAllowedNow: false,
    cloudRunAllowedNow: false,
    serviceAccountAllowedNow: false,
    secretManagerAllowedNow: false,
    workerDispatchAllowedNow: false,
    routeExecutionAllowedNow: false,
    toolExecutionAllowedNow: false,
    mediaProcessingAllowedNow: false,
    supabaseMutationAllowedNow: false,
    sqlAllowedNow: false,
    publicArtifactsAllowedNow: false,
    betaProductionAllowedNow: false,
  }
}

function assertIncludesAll(actual: readonly string[], expected: readonly string[], context: string): void {
  const missing = expected.filter((entry) => !actual.includes(entry))
  if (missing.length > 0) {
    throw new Error(`${context} missing required rows: ${missing.join(', ')}`)
  }
}

function assertRequiredRows(rows: readonly SoundGate1CMergedSeedRow[]): void {
  const ids = rows.map((row) => row.normalizedItemId)
  assertIncludesAll(ids, SOUND_GATE_1C_PLANNED_IMAGE_NAMES, 'Gate 1C planned image names')
  assertIncludesAll(ids, SOUND_GATE_1C_PRESERVED_WORKER_NAMES, 'Gate 1C preserved worker names')
  assertIncludesAll(ids, SOUND_GATE_1C_PRESERVED_JOB_TYPES, 'Gate 1C preserved job types')
  assertIncludesAll(ids, SOUND_GATE_1C_DOC_SURFACES, 'Gate 1C doc surfaces')
  assertIncludesAll(ids, SOUND_GATE_1C_BLOCKED_GATES, 'Gate 1C blocked gates')
  assertIncludesAll(ids, SOUND_GATE_1C_RELATED_SOUND_TOOLS, 'Gate 1C related Sound tools')
  assertIncludesAll(ids, SOUND_GATE_1C_NEXT_PROMPTS, 'Gate 1C next prompts')

  const duplicateIds = ids.filter((itemId, index, values) => values.indexOf(itemId) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`Sound Gate 1C merged matrix has duplicate rows: ${duplicateIds.join(', ')}`)
  }
}

function readMatrixDocument(parsed: Record<string, unknown>, rows: readonly SoundGate1CMergedSeedRow[]): SoundGate1CMergedReconciliationMatrixDocument {
  assertObject(parsed.evidenceSummary, 'sound gate 1c merged matrix evidenceSummary')
  if (parsed.evidenceSummary.sourcePr !== SOUND_GATE_1C_MERGED_SOURCE_PR) {
    throw new Error('Sound Gate 1C merged matrix must reference PR #660.')
  }
  if (parsed.evidenceSummary.sourceMilestone !== 'SOUND-RUNTIME-MEDIA-GATE-1C') {
    throw new Error('Sound Gate 1C merged matrix must reference SOUND-RUNTIME-MEDIA-GATE-1C.')
  }
  if (parsed.evidenceSummary.mergeCommit !== SOUND_GATE_1C_MERGED_MERGE_COMMIT) {
    throw new Error('Sound Gate 1C merged matrix has the wrong merge commit.')
  }
  if (parsed.evidenceSummary.evidenceIsFinalSourceOfTruth !== true || parsed.evidenceSummary.prMerged !== true) {
    throw new Error('Sound Gate 1C merged matrix must mark PR #660 as merged final owner evidence.')
  }

  return {
    schema: SOUND_GATE_1C_MERGED_RECONCILIATION_MATRIX_SCHEMA,
    evidenceSummary: {
      sourcePr: 660,
      sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1C',
      sourceDecision: readString(parsed.evidenceSummary.sourceDecision, 'evidenceSummary.sourceDecision'),
      prMerged: true,
      mergeCommit: SOUND_GATE_1C_MERGED_MERGE_COMMIT,
      evidenceIsFinalSourceOfTruth: true,
      plannedImageNameCount: readNumber(parsed.evidenceSummary.plannedImageNameCount, 'evidenceSummary.plannedImageNameCount') as 2,
      preservedWorkerNameCount: readNumber(parsed.evidenceSummary.preservedWorkerNameCount, 'evidenceSummary.preservedWorkerNameCount') as 2,
      preservedJobTypeCount: readNumber(parsed.evidenceSummary.preservedJobTypeCount, 'evidenceSummary.preservedJobTypeCount') as 4,
      docSurfaceCount: readNumber(parsed.evidenceSummary.docSurfaceCount, 'evidenceSummary.docSurfaceCount') as 6,
      blockedGateCount: readNumber(parsed.evidenceSummary.blockedGateCount, 'evidenceSummary.blockedGateCount'),
      relatedSoundToolCount: readNumber(parsed.evidenceSummary.relatedSoundToolCount, 'evidenceSummary.relatedSoundToolCount') as 23,
      nextPromptCount: readNumber(parsed.evidenceSummary.nextPromptCount, 'evidenceSummary.nextPromptCount') as 2,
      plannedImageNames: readStringArray(parsed.evidenceSummary.plannedImageNames, 'evidenceSummary.plannedImageNames'),
      preservedWorkerNames: readStringArray(parsed.evidenceSummary.preservedWorkerNames, 'evidenceSummary.preservedWorkerNames'),
      preservedJobTypes: readStringArray(parsed.evidenceSummary.preservedJobTypes, 'evidenceSummary.preservedJobTypes'),
      docSurfaces: readStringArray(parsed.evidenceSummary.docSurfaces, 'evidenceSummary.docSurfaces'),
      blockedGates: readStringArray(parsed.evidenceSummary.blockedGates, 'evidenceSummary.blockedGates'),
      relatedSoundTools: readStringArray(parsed.evidenceSummary.relatedSoundTools, 'evidenceSummary.relatedSoundTools'),
      nextOwnerPrompts: readStringArray(parsed.evidenceSummary.nextOwnerPrompts, 'evidenceSummary.nextOwnerPrompts'),
      gate1bAcceptedEvidence: {
        sourcePr: 653,
        mergeCommit: '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91',
        acceptedWorkerNameCount: 2,
        acceptedJobTypeCount: 4,
      },
      gate1aAcceptedEvidence: {
        sourcePr: 647,
        mergeCommit: '0126327c19f1af18bb1ca040c31d06736693d1b6',
        metadataPassed: 13,
        importsPassed: 14,
        failedImports: 0,
        tempVenvRemoved: true,
      },
      imageBuildsPerformed: false,
      dockerfilesAdded: false,
      dockerActionPerformed: false,
      gcpActionPerformed: false,
      cloudRunActionPerformed: false,
      workerRouteDryRunAdded: false,
      workerExecutionPerformed: false,
      importsRun: false,
      adaptersAdded: 0,
      commandIntentsAdded: 0,
      probesAdded: 0,
    },
    rows,
  }
}

export function loadSoundGate1CMergedSources(): SoundGate1CMergedSourceBundle {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'sound gate 1c merged matrix')
  if (parsed.schema !== SOUND_GATE_1C_MERGED_RECONCILIATION_MATRIX_SCHEMA) {
    throw new Error('Sound Gate 1C merged matrix schema is unsupported.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('Sound Gate 1C merged matrix rows must be an array.')
  }

  const rows = parsed.rows.map((entry, index) => readSeedRow(entry, `rows[${index}]`))
  assertRequiredRows(rows)

  return {
    matrixDocument: readMatrixDocument(parsed, rows),
  }
}

export function expandSoundGate1CMergedRow(row: SoundGate1CMergedSeedRow): SoundGate1CMergedRow {
  return expandMergedRow(row)
}
