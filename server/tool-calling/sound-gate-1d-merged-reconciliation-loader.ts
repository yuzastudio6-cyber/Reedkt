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
  SoundGate1DMergedCoverage,
  SoundGate1DMergedDuplicateRisk,
  SoundGate1DMergedEvidenceStatus,
  SoundGate1DMergedExecutionGate,
  SoundGate1DMergedItemType,
  SoundGate1DMergedPendingAction,
  SoundGate1DMergedReconciliationMatrixDocument,
  SoundGate1DMergedRow,
  SoundGate1DMergedSeedRow,
  SoundGate1DMergedSourceBundle,
} from './sound-gate-1d-merged-reconciliation-types'

export const SOUND_GATE_1D_MERGED_RECONCILIATION_MATRIX_SCHEMA = 'reeditpro.soundGate1DMergedReconciliationMatrix.v1'
export const SOUND_GATE_1D_MERGED_SOURCE_PR = 663
export const SOUND_GATE_1D_MERGED_MERGE_COMMIT = 'dbb6d7fe56e7a710059fd80385f11e6fe186f5e0'

export const SOUND_GATE_1D_TARGET_OWNERS = [
  'WORKER_RUNTIME_JOBS',
] as const

export const SOUND_GATE_1D_PACKET_SURFACES = [
  'owner_handoff_summary',
  'dependency_map',
  'job_contract_register',
  'blocker_register',
  'owner_acceptance_request',
  'runtime_claim_policy',
] as const

export const SOUND_GATE_1D_ACCEPTED_WORKER_NAMES = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const SOUND_GATE_1D_PLANNED_IMAGE_NAMES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
] as const

export const SOUND_GATE_1D_PLANNING_ONLY_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export const SOUND_GATE_1D_BLOCKED_GATES = [
  'worker_dispatch',
  'worker_claim',
  'worker_lease',
  'route_execution',
  'tool_execution',
  'dockerfile_creation',
  'docker_build',
  'gcp_cloud_run',
  'secret_manager',
  'media_file_open',
  'audioread_file_open',
  'pydub_media_ops',
  'ffmpeg_sound_expansion',
  'real_audio_processing',
  'artifacts_storage',
  'supabase_sql',
  'signed_public_artifacts',
  'provider_model_calls',
  'model_weights_gpu',
  'billing',
  'beta',
  'production',
  'fixture_dry_run_readiness',
  'runtime_media_readiness',
] as const

export const SOUND_GATE_1D_OWNER_HANDOFF_SURFACES = [
  'WORKER_RUNTIME_JOBS_HANDOFF',
  'SOUND_RUNTIME_MEDIA_GATE_1E',
  'TRACK_B_MEDIA_PROCESSING',
  'PROVIDER_GATEWAY_MODELS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'PRODUCT_BETA_READINESS',
] as const

export const SOUND_GATE_1D_RELATED_SOUND_TOOLS = [
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

export const SOUND_GATE_1D_NEXT_PROMPTS = [
  'WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW',
  'SOUND-RUNTIME-MEDIA-GATE-1E',
] as const

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/sound-gate-1d-merged-reconciliation-matrix.json', import.meta.url)

const itemTypes = new Set<SoundGate1DMergedItemType>([
  'target_owner',
  'owner_handoff_summary',
  'dependency_map',
  'job_contract_register',
  'blocker_register',
  'owner_acceptance_request',
  'runtime_claim_policy',
  'accepted_worker_name',
  'planned_image_name',
  'planning_only_job_type',
  'blocked_gate',
  'owner_handoff_surface',
  'related_sound_tool',
  'gate_1e_next_prompt',
  'worker_runtime_review_next_prompt',
])

const executionGates = new Set<SoundGate1DMergedExecutionGate>([
  'blocked_no_execution',
  'blocked_pending_worker_runtime_jobs_sound_cpu_handoff_review',
  'blocked_pending_gate_1e_dockerfile_static_plan',
  'blocked_pending_media_policy',
  'blocked_pending_model_review',
  'blocked_owner_handoff_required',
  'planning_only',
])

const pendingActions = new Set<SoundGate1DMergedPendingAction>([
  'wait_for_worker_runtime_jobs_sound_cpu_handoff_review',
  'wait_for_gate_1e_dockerfile_static_plan',
  'wait_for_media_policy_handoff',
  'wait_for_model_weight_review',
  'future_worker_route_dry_run_after_worker_owner_review',
  'do_not_duplicate_owner_lane',
  'none',
])

const duplicateRisks = new Set<SoundGate1DMergedDuplicateRisk>([
  'none',
  'do_not_duplicate_owner_lane',
  'possible_duplicate_worker_route',
  'possible_duplicate_worker_runtime_claim',
  'possible_duplicate_worker_job_table',
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

function readCoverage(value: unknown, context: string): SoundGate1DMergedCoverage {
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

function readSeedRow(value: unknown, context: string): SoundGate1DMergedSeedRow {
  assertObject(value, context)

  return {
    normalizedItemId: readString(value.normalizedItemId, `${context}.normalizedItemId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    itemType: readEnum(value.itemType, itemTypes, `${context}.itemType`),
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    relatedProductionToolIds: readProductionToolIds(value.relatedProductionToolIds, `${context}.relatedProductionToolIds`),
    relatedCandidateStudyCards: readStringArray(value.relatedCandidateStudyCards, `${context}.relatedCandidateStudyCards`),
    acceptedByGate1D: readBoolean(value.acceptedByGate1D, `${context}.acceptedByGate1D`),
    currentToolCallingCoverage: readCoverage(value.currentToolCallingCoverage, `${context}.currentToolCallingCoverage`),
    executionGate: readEnum(value.executionGate, executionGates, `${context}.executionGate`),
    toolCallingPendingAction: readEnum(value.toolCallingPendingAction, pendingActions, `${context}.toolCallingPendingAction`),
    duplicateRisk: readEnum(value.duplicateRisk, duplicateRisks, `${context}.duplicateRisk`),
    notes: readString(value.notes, `${context}.notes`),
  }
}

function expandMergedRow(row: SoundGate1DMergedSeedRow): SoundGate1DMergedRow {
  const gate1dEvidenceStatus: SoundGate1DMergedEvidenceStatus[] = ['merged_owner_source_evidence']
  if (row.executionGate.startsWith('blocked_')) gate1dEvidenceStatus.push('blocked_by_owner_gate')
  if (row.itemType === 'worker_runtime_review_next_prompt') {
    gate1dEvidenceStatus.push('worker_runtime_review_pending')
  }
  if (row.itemType === 'worker_runtime_review_next_prompt' || row.itemType === 'gate_1e_next_prompt') {
    gate1dEvidenceStatus.push('owner_next_prompt_only')
  }

  return {
    ...row,
    gate1dEvidenceStatus,
    prNumber: 663,
    prMerged: true,
    mergeCommit: SOUND_GATE_1D_MERGED_MERGE_COMMIT,
    evidenceIsFinalSourceOfTruth: true,
    acceptedForExecution: false,
    workerRuntimeOwnerReviewRequired: true,
    workerDispatchAllowedNow: false,
    workerClaimAllowedNow: false,
    workerLeaseAllowedNow: false,
    routeExecutionAllowedNow: false,
    toolExecutionAllowedNow: false,
    dockerfileMutationAllowedNow: false,
    imageBuildAllowedNow: false,
    gcpCallAllowedNow: false,
    cloudRunAllowedNow: false,
    serviceAccountAllowedNow: false,
    secretManagerAllowedNow: false,
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

function assertRequiredRows(rows: readonly SoundGate1DMergedSeedRow[]): void {
  const ids = rows.map((row) => row.normalizedItemId)
  assertIncludesAll(ids, SOUND_GATE_1D_TARGET_OWNERS, 'Gate 1D target owners')
  assertIncludesAll(ids, SOUND_GATE_1D_PACKET_SURFACES, 'Gate 1D packet surfaces')
  assertIncludesAll(ids, SOUND_GATE_1D_ACCEPTED_WORKER_NAMES, 'Gate 1D accepted worker names')
  assertIncludesAll(ids, SOUND_GATE_1D_PLANNED_IMAGE_NAMES, 'Gate 1D planned image names')
  assertIncludesAll(ids, SOUND_GATE_1D_PLANNING_ONLY_JOB_TYPES, 'Gate 1D planning-only job types')
  assertIncludesAll(ids, SOUND_GATE_1D_BLOCKED_GATES, 'Gate 1D blocked gates')
  assertIncludesAll(ids, SOUND_GATE_1D_OWNER_HANDOFF_SURFACES, 'Gate 1D owner handoff surfaces')
  assertIncludesAll(ids, SOUND_GATE_1D_RELATED_SOUND_TOOLS, 'Gate 1D related Sound tools')
  assertIncludesAll(ids, SOUND_GATE_1D_NEXT_PROMPTS, 'Gate 1D next prompts')

  const duplicateIds = ids.filter((itemId, index, values) => values.indexOf(itemId) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`Sound Gate 1D merged matrix has duplicate rows: ${duplicateIds.join(', ')}`)
  }
}

function readMatrixDocument(parsed: Record<string, unknown>, rows: readonly SoundGate1DMergedSeedRow[]): SoundGate1DMergedReconciliationMatrixDocument {
  assertObject(parsed.evidenceSummary, 'sound gate 1d merged matrix evidenceSummary')
  if (parsed.evidenceSummary.sourcePr !== SOUND_GATE_1D_MERGED_SOURCE_PR) {
    throw new Error('Sound Gate 1D merged matrix must reference PR #663.')
  }
  if (parsed.evidenceSummary.sourceMilestone !== 'SOUND-RUNTIME-MEDIA-GATE-1D') {
    throw new Error('Sound Gate 1D merged matrix must reference SOUND-RUNTIME-MEDIA-GATE-1D.')
  }
  if (parsed.evidenceSummary.mergeCommit !== SOUND_GATE_1D_MERGED_MERGE_COMMIT) {
    throw new Error('Sound Gate 1D merged matrix has the wrong merge commit.')
  }
  if (parsed.evidenceSummary.evidenceIsFinalSourceOfTruth !== true || parsed.evidenceSummary.prMerged !== true) {
    throw new Error('Sound Gate 1D merged matrix must mark PR #663 as merged final owner evidence.')
  }

  return {
    schema: SOUND_GATE_1D_MERGED_RECONCILIATION_MATRIX_SCHEMA,
    evidenceSummary: {
      sourcePr: 663,
      sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1D',
      sourceDecision: readString(parsed.evidenceSummary.sourceDecision, 'evidenceSummary.sourceDecision'),
      prMerged: true,
      mergeCommit: SOUND_GATE_1D_MERGED_MERGE_COMMIT,
      evidenceIsFinalSourceOfTruth: true,
      targetOwnerCount: readNumber(parsed.evidenceSummary.targetOwnerCount, 'evidenceSummary.targetOwnerCount') as 1,
      packetSurfaceCount: readNumber(parsed.evidenceSummary.packetSurfaceCount, 'evidenceSummary.packetSurfaceCount') as 6,
      acceptedWorkerNameCount: readNumber(parsed.evidenceSummary.acceptedWorkerNameCount, 'evidenceSummary.acceptedWorkerNameCount') as 2,
      plannedImageNameCount: readNumber(parsed.evidenceSummary.plannedImageNameCount, 'evidenceSummary.plannedImageNameCount') as 2,
      planningOnlyJobTypeCount: readNumber(parsed.evidenceSummary.planningOnlyJobTypeCount, 'evidenceSummary.planningOnlyJobTypeCount') as 4,
      blockedGateCount: readNumber(parsed.evidenceSummary.blockedGateCount, 'evidenceSummary.blockedGateCount'),
      ownerHandoffSurfaceCount: readNumber(parsed.evidenceSummary.ownerHandoffSurfaceCount, 'evidenceSummary.ownerHandoffSurfaceCount'),
      relatedSoundToolCount: readNumber(parsed.evidenceSummary.relatedSoundToolCount, 'evidenceSummary.relatedSoundToolCount') as 23,
      nextPromptCount: readNumber(parsed.evidenceSummary.nextPromptCount, 'evidenceSummary.nextPromptCount') as 2,
      targetOwners: readStringArray(parsed.evidenceSummary.targetOwners, 'evidenceSummary.targetOwners'),
      packetSurfaces: readStringArray(parsed.evidenceSummary.packetSurfaces, 'evidenceSummary.packetSurfaces'),
      acceptedWorkerNames: readStringArray(parsed.evidenceSummary.acceptedWorkerNames, 'evidenceSummary.acceptedWorkerNames'),
      plannedImageNames: readStringArray(parsed.evidenceSummary.plannedImageNames, 'evidenceSummary.plannedImageNames'),
      planningOnlyJobTypes: readStringArray(parsed.evidenceSummary.planningOnlyJobTypes, 'evidenceSummary.planningOnlyJobTypes'),
      blockedGates: readStringArray(parsed.evidenceSummary.blockedGates, 'evidenceSummary.blockedGates'),
      ownerHandoffSurfaces: readStringArray(parsed.evidenceSummary.ownerHandoffSurfaces, 'evidenceSummary.ownerHandoffSurfaces'),
      relatedSoundTools: readStringArray(parsed.evidenceSummary.relatedSoundTools, 'evidenceSummary.relatedSoundTools'),
      nextOwnerPrompts: readStringArray(parsed.evidenceSummary.nextOwnerPrompts, 'evidenceSummary.nextOwnerPrompts'),
      gate1cAcceptedEvidence: {
        sourcePr: 660,
        mergeCommit: 'b46509a54695dd049d044fd7135b37a8faaef18e',
        plannedImageNameCount: 2,
        acceptedWorkerNameCount: 2,
        planningOnlyJobTypeCount: 4,
      },
      gate1bAcceptedEvidence: {
        sourcePr: 653,
        mergeCommit: '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91',
        acceptedWorkerNameCount: 2,
        acceptedJobTypeCount: 4,
      },
      gate1aAcceptedEvidence: {
        sourcePr: 647,
        metadataPassed: 13,
        importsPassed: 14,
        failedImports: 0,
        packageLockUnchangedByProof: true,
      },
      workerRouteDryRunAdded: false,
      workerExecutionPerformed: false,
      workerClaimPerformed: false,
      workerLeasePerformed: false,
      importsRun: false,
      dockerActionPerformed: false,
      gcpActionPerformed: false,
      cloudRunActionPerformed: false,
      secretManagerActionPerformed: false,
      adaptersAdded: 0,
      commandIntentsAdded: 0,
      probesAdded: 0,
    },
    rows,
  }
}

export function loadSoundGate1DMergedSources(): SoundGate1DMergedSourceBundle {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'sound gate 1d merged matrix')
  if (parsed.schema !== SOUND_GATE_1D_MERGED_RECONCILIATION_MATRIX_SCHEMA) {
    throw new Error('Sound Gate 1D merged matrix schema is unsupported.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('Sound Gate 1D merged matrix rows must be an array.')
  }

  const rows = parsed.rows.map((entry, index) => readSeedRow(entry, `rows[${index}]`))
  assertRequiredRows(rows)

  return {
    matrixDocument: readMatrixDocument(parsed, rows),
  }
}

export function expandSoundGate1DMergedRow(row: SoundGate1DMergedSeedRow): SoundGate1DMergedRow {
  return expandMergedRow(row)
}
