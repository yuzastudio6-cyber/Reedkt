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
  SoundGate1BMergedCoverage,
  SoundGate1BMergedDuplicateRisk,
  SoundGate1BMergedEvidenceStatus,
  SoundGate1BMergedExecutionGate,
  SoundGate1BMergedItemType,
  SoundGate1BMergedPendingAction,
  SoundGate1BMergedSeedRow,
  SoundGate1BMergedSourceBundle,
} from './sound-gate-1b-merged-reconciliation-types'

export const SOUND_GATE_1B_MERGED_RECONCILIATION_MATRIX_SCHEMA = 'reeditpro.soundGate1BMergedReconciliationMatrix.v1'
export const SOUND_GATE_1B_MERGED_SOURCE_PR = 653
export const SOUND_GATE_1B_MERGED_MERGE_COMMIT = '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91'

export const SOUND_GATE_1B_ACCEPTED_WORKER_NAMES = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const SOUND_GATE_1B_ACCEPTED_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export const SOUND_GATE_1B_NOT_ACCEPTED_JOB_TYPES = [
  'sound.synthetic_fixture_validate',
] as const

export const SOUND_GATE_1B_BLOCKED_GATES = [
  'media_file_open',
  'audioread.audio_open',
  'pydub_media_operations',
  'ffmpeg_ffprobe',
  'real_audio_processing',
  'artifact_writes',
  'worker_execution',
  'route_execution',
  'tool_execution',
  'gcp_cloud_run_docker',
  'supabase_sql',
  'provider_model_calls',
  'model_weights',
  'billing',
  'beta',
  'production',
  'generated_local_fixture_passed',
  'dry_run_passed',
] as const

export const SOUND_GATE_1B_OWNER_HANDOFF_SURFACES = [
  'WORKER_RUNTIME_JOBS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PROVIDER_GATEWAY_MODELS',
  'BILLING_STRIPE_CREDITS',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'PRODUCT_BETA_READINESS',
  'COMPLIANCE_SECURITY',
] as const

export const SOUND_GATE_1B_RELATED_SOUND_TOOLS = [
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

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/sound-gate-1b-merged-reconciliation-matrix.json', import.meta.url)

const itemTypes = new Set<SoundGate1BMergedItemType>([
  'accepted_worker_name',
  'accepted_job_type',
  'rejected_job_type',
  'blocked_gate',
  'owner_handoff_surface',
  'related_sound_tool',
  'gate_1c_next_prompt',
])

const evidenceStatuses = new Set<SoundGate1BMergedEvidenceStatus>([
  'merged_owner_source_evidence',
  'blocked_by_owner_gate',
  'not_accepted_for_worker_contract',
  'owner_next_prompt_only',
  'unknown',
])

const executionGates = new Set<SoundGate1BMergedExecutionGate>([
  'blocked_no_execution',
  'blocked_pending_gate_1c_cpu_worker_image_plan',
  'blocked_pending_gate_1d_worker_runtime_owner_handoff',
  'blocked_pending_media_policy',
  'blocked_pending_model_review',
  'blocked_owner_handoff_required',
  'planning_only',
])

const pendingActions = new Set<SoundGate1BMergedPendingAction>([
  'wait_for_gate_1c_cpu_worker_image_plan',
  'wait_for_gate_1d_worker_runtime_owner_handoff',
  'wait_for_media_policy_handoff',
  'wait_for_model_weight_review',
  'future_worker_route_dry_run_after_owner_gate',
  'do_not_duplicate_owner_lane',
  'none',
])

const duplicateRisks = new Set<SoundGate1BMergedDuplicateRisk>([
  'none',
  'do_not_duplicate_owner_lane',
  'possible_duplicate_worker_route',
  'possible_duplicate_worker_job_table',
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

function readEnumArray<T extends string>(value: unknown, allowed: ReadonlySet<T>, context: string): T[] {
  return readStringArray(value, context).map((entry) => readEnum(entry, allowed, context))
}

function readProductionToolIds(value: unknown, context: string): ProductionToolId[] {
  return readStringArray(value, context).map((toolId) => {
    if (!isProductionToolId(toolId)) {
      throw new Error(`${context} contains non-first-class ProductionToolId: ${toolId}`)
    }

    return toolId
  })
}

function readCoverage(value: unknown, context: string): SoundGate1BMergedCoverage {
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

function assertSafetyFlags(row: SoundGate1BMergedSeedRow, context: string): void {
  const unsafe = [
    row.acceptedForExecution,
    row.workerDispatchAllowedNow,
    row.routeExecutionAllowedNow,
    row.toolExecutionAllowedNow,
    row.mediaProcessingAllowedNow,
    row.supabaseMutationAllowedNow,
    row.sqlAllowedNow,
    row.publicArtifactsAllowedNow,
    row.betaProductionAllowedNow,
    row.currentToolCallingCoverage.hasWorkerRouteDryRun,
  ].some(Boolean)
  if (unsafe) {
    throw new Error(`${context} enables execution, worker route dry-run, mutation, or public artifact behavior.`)
  }
}

function readSeedRow(value: unknown, context: string): SoundGate1BMergedSeedRow {
  assertObject(value, context)
  const row = {
    normalizedItemId: readString(value.normalizedItemId, `${context}.normalizedItemId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    itemType: readEnum(value.itemType, itemTypes, `${context}.itemType`),
    gate1bEvidenceStatus: readEnumArray(value.gate1bEvidenceStatus, evidenceStatuses, `${context}.gate1bEvidenceStatus`),
    prNumber: readNumber(value.prNumber, `${context}.prNumber`) as 653,
    prMerged: readBoolean(value.prMerged, `${context}.prMerged`) as true,
    mergeCommit: readString(value.mergeCommit, `${context}.mergeCommit`) as '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91',
    evidenceIsFinalSourceOfTruth: readBoolean(value.evidenceIsFinalSourceOfTruth, `${context}.evidenceIsFinalSourceOfTruth`) as true,
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    relatedProductionToolIds: readProductionToolIds(value.relatedProductionToolIds, `${context}.relatedProductionToolIds`),
    relatedCandidateStudyCards: readStringArray(value.relatedCandidateStudyCards, `${context}.relatedCandidateStudyCards`),
    acceptedByGate1B: readBoolean(value.acceptedByGate1B, `${context}.acceptedByGate1B`),
    acceptedForExecution: readBoolean(value.acceptedForExecution, `${context}.acceptedForExecution`) as false,
    workerDispatchAllowedNow: readBoolean(value.workerDispatchAllowedNow, `${context}.workerDispatchAllowedNow`) as false,
    routeExecutionAllowedNow: readBoolean(value.routeExecutionAllowedNow, `${context}.routeExecutionAllowedNow`) as false,
    toolExecutionAllowedNow: readBoolean(value.toolExecutionAllowedNow, `${context}.toolExecutionAllowedNow`) as false,
    mediaProcessingAllowedNow: readBoolean(value.mediaProcessingAllowedNow, `${context}.mediaProcessingAllowedNow`) as false,
    supabaseMutationAllowedNow: readBoolean(value.supabaseMutationAllowedNow, `${context}.supabaseMutationAllowedNow`) as false,
    sqlAllowedNow: readBoolean(value.sqlAllowedNow, `${context}.sqlAllowedNow`) as false,
    publicArtifactsAllowedNow: readBoolean(value.publicArtifactsAllowedNow, `${context}.publicArtifactsAllowedNow`) as false,
    betaProductionAllowedNow: readBoolean(value.betaProductionAllowedNow, `${context}.betaProductionAllowedNow`) as false,
    currentToolCallingCoverage: readCoverage(value.currentToolCallingCoverage, `${context}.currentToolCallingCoverage`),
    executionGate: readEnum(value.executionGate, executionGates, `${context}.executionGate`),
    toolCallingPendingAction: readEnum(value.toolCallingPendingAction, pendingActions, `${context}.toolCallingPendingAction`),
    duplicateRisk: readEnum(value.duplicateRisk, duplicateRisks, `${context}.duplicateRisk`),
    notes: readString(value.notes, `${context}.notes`),
  }

  if (row.prNumber !== SOUND_GATE_1B_MERGED_SOURCE_PR || !row.prMerged) {
    throw new Error(`${context} must reference merged PR #653.`)
  }
  if (row.mergeCommit !== SOUND_GATE_1B_MERGED_MERGE_COMMIT) {
    throw new Error(`${context} must reference merge commit ${SOUND_GATE_1B_MERGED_MERGE_COMMIT}.`)
  }
  if (!row.evidenceIsFinalSourceOfTruth || !row.gate1bEvidenceStatus.includes('merged_owner_source_evidence')) {
    throw new Error(`${context} must mark PR #653 as final merged owner evidence.`)
  }
  if ((row.itemType === 'accepted_worker_name' || row.itemType === 'accepted_job_type') !== row.acceptedByGate1B) {
    throw new Error(`${context} has inconsistent Gate 1B acceptance flags.`)
  }
  assertSafetyFlags(row, context)

  return row
}

function assertIncludesAll(actual: readonly string[], expected: readonly string[], context: string): void {
  const missing = expected.filter((entry) => !actual.includes(entry))
  if (missing.length > 0) {
    throw new Error(`${context} missing required rows: ${missing.join(', ')}`)
  }
}

function assertRequiredRows(rows: readonly SoundGate1BMergedSeedRow[]): void {
  const ids = rows.map((row) => row.normalizedItemId)
  assertIncludesAll(ids, SOUND_GATE_1B_ACCEPTED_WORKER_NAMES, 'Gate 1B worker names')
  assertIncludesAll(ids, SOUND_GATE_1B_ACCEPTED_JOB_TYPES, 'Gate 1B job types')
  assertIncludesAll(ids, SOUND_GATE_1B_NOT_ACCEPTED_JOB_TYPES, 'Gate 1B not-accepted job types')
  assertIncludesAll(ids, SOUND_GATE_1B_BLOCKED_GATES, 'Gate 1B blocked gates')
  assertIncludesAll(ids, SOUND_GATE_1B_OWNER_HANDOFF_SURFACES, 'Gate 1B owner handoff surfaces')
  assertIncludesAll(ids, SOUND_GATE_1B_RELATED_SOUND_TOOLS, 'Gate 1B related Sound tools')
  assertIncludesAll(ids, ['SOUND-RUNTIME-MEDIA-GATE-1C'], 'Gate 1C next prompt')

  const duplicateIds = ids.filter((itemId, index, values) => values.indexOf(itemId) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`Sound Gate 1B merged matrix has duplicate rows: ${duplicateIds.join(', ')}`)
  }
}

export function loadSoundGate1BMergedSources(): SoundGate1BMergedSourceBundle {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'sound gate 1b merged matrix')
  if (parsed.schema !== SOUND_GATE_1B_MERGED_RECONCILIATION_MATRIX_SCHEMA) {
    throw new Error('Sound Gate 1B merged matrix schema is unsupported.')
  }
  assertObject(parsed.evidenceSummary, 'sound gate 1b merged matrix evidenceSummary')
  if (parsed.evidenceSummary.sourcePr !== SOUND_GATE_1B_MERGED_SOURCE_PR) {
    throw new Error('Sound Gate 1B merged matrix must reference PR #653.')
  }
  if (parsed.evidenceSummary.sourceMilestone !== 'SOUND-RUNTIME-MEDIA-GATE-1B') {
    throw new Error('Sound Gate 1B merged matrix must reference SOUND-RUNTIME-MEDIA-GATE-1B.')
  }
  if (parsed.evidenceSummary.mergeCommit !== SOUND_GATE_1B_MERGED_MERGE_COMMIT) {
    throw new Error('Sound Gate 1B merged matrix has the wrong merge commit.')
  }
  if (parsed.evidenceSummary.evidenceIsFinalSourceOfTruth !== true || parsed.evidenceSummary.prMerged !== true) {
    throw new Error('Sound Gate 1B merged matrix must mark PR #653 as merged final owner evidence.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('Sound Gate 1B merged matrix rows must be an array.')
  }

  const rows = parsed.rows.map((entry, index) => readSeedRow(entry, `rows[${index}]`))
  assertRequiredRows(rows)

  return {
    matrixDocument: {
      schema: SOUND_GATE_1B_MERGED_RECONCILIATION_MATRIX_SCHEMA,
      evidenceSummary: {
        sourcePr: 653,
        sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1B',
        sourceDecision: readString(parsed.evidenceSummary.sourceDecision, 'evidenceSummary.sourceDecision'),
        prMerged: true,
        mergeCommit: SOUND_GATE_1B_MERGED_MERGE_COMMIT,
        evidenceIsFinalSourceOfTruth: true,
        acceptedWorkerNameCount: readNumber(parsed.evidenceSummary.acceptedWorkerNameCount, 'evidenceSummary.acceptedWorkerNameCount') as 2,
        acceptedJobTypeCount: readNumber(parsed.evidenceSummary.acceptedJobTypeCount, 'evidenceSummary.acceptedJobTypeCount') as 4,
        notAcceptedJobTypeCount: readNumber(parsed.evidenceSummary.notAcceptedJobTypeCount, 'evidenceSummary.notAcceptedJobTypeCount') as 1,
        blockedGateCount: readNumber(parsed.evidenceSummary.blockedGateCount, 'evidenceSummary.blockedGateCount') as 18,
        ownerHandoffSurfaceCount: readNumber(parsed.evidenceSummary.ownerHandoffSurfaceCount, 'evidenceSummary.ownerHandoffSurfaceCount') as 9,
        relatedSoundToolCount: readNumber(parsed.evidenceSummary.relatedSoundToolCount, 'evidenceSummary.relatedSoundToolCount') as 23,
        gate1cNextPromptCount: readNumber(parsed.evidenceSummary.gate1cNextPromptCount, 'evidenceSummary.gate1cNextPromptCount') as 1,
        acceptedWorkerNames: SOUND_GATE_1B_ACCEPTED_WORKER_NAMES,
        acceptedJobTypes: SOUND_GATE_1B_ACCEPTED_JOB_TYPES,
        notAcceptedJobTypes: SOUND_GATE_1B_NOT_ACCEPTED_JOB_TYPES,
        blockedGates: readStringArray(parsed.evidenceSummary.blockedGates, 'evidenceSummary.blockedGates'),
        ownerHandoffSurfaces: readStringArray(parsed.evidenceSummary.ownerHandoffSurfaces, 'evidenceSummary.ownerHandoffSurfaces'),
        nextOwnerPrompt: 'SOUND-RUNTIME-MEDIA-GATE-1C: CPU worker image plan, no Docker/GCP execution',
        gate1aAcceptedEvidence: {
          sourcePr: 647,
          requirementsPath: 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt',
          metadataPassed: 13,
          importsPassed: 14,
          failedImports: 0,
          tempVenvRemoved: true,
          packageLockUnchangedByProof: true,
        },
        workerRouteDryRunAdded: false,
        workerExecutionPerformed: false,
        importsRun: false,
        adaptersAdded: 0,
        commandIntentsAdded: 0,
        probesAdded: 0,
      },
      rows,
    },
  }
}
