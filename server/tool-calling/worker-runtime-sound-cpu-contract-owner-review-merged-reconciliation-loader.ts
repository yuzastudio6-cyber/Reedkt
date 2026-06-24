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
  WorkerRuntimeSoundCpuContractOwnerReviewDuplicateRisk,
  WorkerRuntimeSoundCpuContractOwnerReviewEvidenceStatus,
  WorkerRuntimeSoundCpuContractOwnerReviewExecutionGate,
  WorkerRuntimeSoundCpuContractOwnerReviewItemType,
  WorkerRuntimeSoundCpuContractOwnerReviewMatrixDocument,
  WorkerRuntimeSoundCpuContractOwnerReviewPendingAction,
  WorkerRuntimeSoundCpuContractOwnerReviewRow,
  WorkerRuntimeSoundCpuContractOwnerReviewSourceBundle,
} from './worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-types'

export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MATRIX_SCHEMA = 'reeditpro.workerRuntimeSoundCpuContractOwnerReviewMergedReconciliationMatrix.v1'
export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_SOURCE_PR = 679
export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MERGE_COMMIT = '1091f901729334389918f3b1ea28b584ebf7686b'

export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_ROWS = [
  'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTRACT-OWNER-REVIEW',
] as const

export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_WORKER_NAMES = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_IMAGE_NAMES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
] as const

export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_STATIC_AREAS = [
  'static_contract_areas_from_pr_672',
  'payload_result_contract_categories_from_pr_672',
  'static_runtime_policy_placeholders_from_pr_672',
] as const

export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_BLOCKED_GATES = [
  'worker_dispatch',
  'worker_claim',
  'worker_lease',
  'worker_execution',
  'route_execution',
  'tool_execution',
  'docker_gcp',
  'media_model_artifact_supabase_sql',
  'billing',
  'beta',
  'production',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'worker_readiness',
  'runtime_readiness',
  'pydub_media_operations',
  'audioread_file_open',
  'ffmpeg_ffprobe_sound_expansion',
  'model_gpu_provenance',
  'provider_handoffs',
] as const

export const WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_RELATED_SOUND_TOOLS = [
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

export const WORKER_RUNTIME_SOUND_CPU_DOCKERFILE_STATIC_REVIEW_NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW'
export const WORKER_RUNTIME_SOUND_CPU_DOCKERFILE_STATIC_REVIEW_PR = 684

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-matrix.json', import.meta.url)

const itemTypes = new Set<WorkerRuntimeSoundCpuContractOwnerReviewItemType>([
  'worker_runtime_contract_owner_review',
  'accepted_worker_name',
  'accepted_image_name',
  'accepted_job_type',
  'accepted_static_contract_area',
  'accepted_static_field',
  'placeholder_policy_surface',
  'blocked_execution_gate',
  'dockerfile_static_review_next_prompt',
  'dockerfile_static_review_candidate_evidence',
  'related_sound_tool',
])

const evidenceStatuses = new Set<WorkerRuntimeSoundCpuContractOwnerReviewEvidenceStatus>([
  'merged_owner_source_evidence',
  'open_pr_candidate_evidence',
  'blocked_by_worker_runtime_gate',
  'owner_next_prompt_only',
  'unknown',
])

const executionGates = new Set<WorkerRuntimeSoundCpuContractOwnerReviewExecutionGate>([
  'blocked_no_execution',
  'blocked_pending_dockerfile_static_review_merge',
  'blocked_pending_gate_1e_dockerfile_static_plan',
  'blocked_pending_worker_route_dry_run_decision',
  'blocked_pending_media_policy',
  'blocked_pending_model_review',
  'planning_only',
])

const pendingActions = new Set<WorkerRuntimeSoundCpuContractOwnerReviewPendingAction>([
  'wait_for_dockerfile_static_review_merge',
  'wait_for_gate_1e_dockerfile_static_plan',
  'wait_for_worker_route_dry_run_decision',
  'wait_for_media_policy_handoff',
  'wait_for_model_weight_review',
  'do_not_duplicate_owner_lane',
  'none',
])

const duplicateRisks = new Set<WorkerRuntimeSoundCpuContractOwnerReviewDuplicateRisk>([
  'none',
  'do_not_duplicate_owner_lane',
  'possible_duplicate_worker_route',
  'possible_duplicate_worker_runtime_claim',
  'possible_duplicate_worker_job_table',
  'possible_duplicate_dockerfile_plan',
  'possible_duplicate_policy_enablement',
])

function assertObject(value: unknown, context: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`)
  }
}

function readString(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${context} must be a non-empty string.`)
  return value
}

function readNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${context} must be a finite number.`)
  return value
}

function readBoolean(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${context} must be a boolean.`)
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
  if (!allowed.has(normalized as T)) throw new Error(`${context} is unsupported: ${normalized}`)
  return normalized as T
}

function readEnumArray<T extends string>(value: unknown, allowed: ReadonlySet<T>, context: string): T[] {
  return readStringArray(value, context).map((entry) => {
    if (!allowed.has(entry as T)) throw new Error(`${context} contains unsupported value: ${entry}`)
    return entry as T
  })
}

function readProductionToolIds(value: unknown, context: string): ProductionToolId[] {
  return readStringArray(value, context).map((toolId) => {
    if (!isProductionToolId(toolId)) throw new Error(`${context} contains non-first-class ProductionToolId: ${toolId}`)
    return toolId
  })
}

function readCoverage(value: unknown, context: string) {
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

function readRow(value: unknown, index: number): WorkerRuntimeSoundCpuContractOwnerReviewRow {
  assertObject(value, `rows[${index}]`)
  const prNumber = readNumber(value.prNumber, `rows[${index}].prNumber`)
  if (prNumber !== 679 && prNumber !== 684) throw new Error(`rows[${index}].prNumber must be 679 or 684.`)
  const mergeCommitValue = value.mergeCommit === null ? null : readString(value.mergeCommit, `rows[${index}].mergeCommit`)

  return {
    normalizedItemId: readString(value.normalizedItemId, `rows[${index}].normalizedItemId`),
    displayName: readString(value.displayName, `rows[${index}].displayName`),
    itemType: readEnum(value.itemType, itemTypes, `rows[${index}].itemType`),
    ownerReviewEvidenceStatus: readEnumArray(value.ownerReviewEvidenceStatus, evidenceStatuses, `rows[${index}].ownerReviewEvidenceStatus`),
    prNumber,
    prMerged: readBoolean(value.prMerged, `rows[${index}].prMerged`),
    prDraft: readBoolean(value.prDraft, `rows[${index}].prDraft`),
    mergeCommit: mergeCommitValue,
    evidenceIsFinalSourceOfTruth: readBoolean(value.evidenceIsFinalSourceOfTruth, `rows[${index}].evidenceIsFinalSourceOfTruth`),
    sourceEvidence: readStringArray(value.sourceEvidence, `rows[${index}].sourceEvidence`),
    relatedProductionToolIds: readProductionToolIds(value.relatedProductionToolIds, `rows[${index}].relatedProductionToolIds`),
    relatedCandidateStudyCards: readStringArray(value.relatedCandidateStudyCards, `rows[${index}].relatedCandidateStudyCards`),
    acceptedForFutureDockerfileStaticPlanning: readBoolean(value.acceptedForFutureDockerfileStaticPlanning, `rows[${index}].acceptedForFutureDockerfileStaticPlanning`),
    acceptedForFutureStaticPlanning: readBoolean(value.acceptedForFutureStaticPlanning, `rows[${index}].acceptedForFutureStaticPlanning`),
    acceptedForRuntimeExecution: false,
    workerDispatchAllowedNow: false,
    workerClaimAllowedNow: false,
    workerLeaseAllowedNow: false,
    workerExecutionAllowedNow: false,
    routeExecutionAllowedNow: false,
    toolExecutionAllowedNow: false,
    dockerfileMutationAllowedNow: false,
    imageBuildAllowedNow: false,
    gcpCallAllowedNow: false,
    cloudRunAllowedNow: false,
    serviceAccountAllowedNow: false,
    secretManagerAllowedNow: false,
    observabilityPolicyAllowedNow: false,
    retryPolicyAllowedNow: false,
    artifactPolicyAllowedNow: false,
    mediaProcessingAllowedNow: false,
    supabaseMutationAllowedNow: false,
    sqlAllowedNow: false,
    publicArtifactsAllowedNow: false,
    betaProductionAllowedNow: false,
    currentToolCallingCoverage: readCoverage(value.currentToolCallingCoverage, `rows[${index}].currentToolCallingCoverage`),
    executionGate: readEnum(value.executionGate, executionGates, `rows[${index}].executionGate`),
    toolCallingPendingAction: readEnum(value.toolCallingPendingAction, pendingActions, `rows[${index}].toolCallingPendingAction`),
    duplicateRisk: readEnum(value.duplicateRisk, duplicateRisks, `rows[${index}].duplicateRisk`),
    notes: readString(value.notes, `rows[${index}].notes`),
  }
}

function readMatrixDocument(value: unknown): WorkerRuntimeSoundCpuContractOwnerReviewMatrixDocument {
  assertObject(value, 'matrix')
  if (value.schema !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MATRIX_SCHEMA) {
    throw new Error(`Unsupported Worker Runtime Sound CPU contract owner review schema: ${String(value.schema)}`)
  }
  assertObject(value.evidenceSummary, 'matrix.evidenceSummary')
  const rowsValue = value.rows
  if (!Array.isArray(rowsValue)) throw new Error('matrix.rows must be an array.')

  return {
    schema: WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MATRIX_SCHEMA,
    evidenceSummary: value.evidenceSummary as WorkerRuntimeSoundCpuContractOwnerReviewMatrixDocument['evidenceSummary'],
    rows: rowsValue.map(readRow),
  }
}

export function loadWorkerRuntimeSoundCpuContractOwnerReviewMergedSources(): WorkerRuntimeSoundCpuContractOwnerReviewSourceBundle {
  return {
    matrixDocument: readMatrixDocument(JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8'))),
  }
}
