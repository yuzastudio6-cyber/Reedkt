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
  WorkerRuntimeSoundCpuHandoffReviewCoverage,
  WorkerRuntimeSoundCpuHandoffReviewDuplicateRisk,
  WorkerRuntimeSoundCpuHandoffReviewEvidenceStatus,
  WorkerRuntimeSoundCpuHandoffReviewExecutionGate,
  WorkerRuntimeSoundCpuHandoffReviewItemType,
  WorkerRuntimeSoundCpuHandoffReviewMatrixDocument,
  WorkerRuntimeSoundCpuHandoffReviewPendingAction,
  WorkerRuntimeSoundCpuHandoffReviewRow,
  WorkerRuntimeSoundCpuHandoffReviewSourceBundle,
} from './worker-runtime-sound-cpu-handoff-review-reconciliation-types'

export const WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MATRIX_SCHEMA = 'reeditpro.workerRuntimeSoundCpuHandoffReviewReconciliationMatrix.v1'
export const WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_SOURCE_PR = 670
export const WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MERGE_COMMIT = 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc'
export const WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_SOURCE_HEAD = 'dbb6d7fe56e7a710059fd80385f11e6fe186f5e0'

export const WORKER_RUNTIME_SOUND_CPU_REVIEW_ROWS = [
  'WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW',
] as const

export const WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker',
] as const

export const WORKER_RUNTIME_SOUND_CPU_PLANNED_IMAGE_NAMES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
] as const

export const WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
] as const

export const WORKER_RUNTIME_SOUND_CPU_BLOCKED_GATES = [
  'worker_dispatch',
  'worker_claim',
  'worker_lease',
  'worker_execution',
  'route_execution',
  'tool_execution',
  'dockerfile_build_cloud_run',
  'service_accounts',
  'secret_manager',
  'observability_retry_artifact_supabase_policy',
  'media_open_process',
  'pydub_operations',
  'ffmpeg_sound_expansion',
  'artifact_write',
  'generation',
  'model_download',
  'worker_readiness',
  'runtime_readiness',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'beta',
  'production',
] as const

export const WORKER_RUNTIME_SOUND_CPU_RELATED_SOUND_TOOLS = [
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

export const WORKER_RUNTIME_SOUND_CPU_NEXT_PROMPTS = [
  'WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-PLAN',
] as const

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/worker-runtime-sound-cpu-handoff-review-reconciliation-matrix.json', import.meta.url)

const itemTypes = new Set<WorkerRuntimeSoundCpuHandoffReviewItemType>([
  'worker_runtime_owner_review',
  'accepted_worker_name',
  'planned_image_name',
  'accepted_job_type',
  'blocked_execution_gate',
  'blocked_policy_surface',
  'related_sound_tool',
  'static_contract_next_prompt',
])

const evidenceStatuses = new Set<WorkerRuntimeSoundCpuHandoffReviewEvidenceStatus>([
  'merged_owner_source_evidence',
  'blocked_by_worker_runtime_gate',
  'owner_next_prompt_only',
  'unknown',
])

const executionGates = new Set<WorkerRuntimeSoundCpuHandoffReviewExecutionGate>([
  'blocked_no_execution',
  'blocked_pending_static_contract_plan',
  'blocked_pending_worker_runtime_static_contract',
  'blocked_pending_dockerfile_static_plan',
  'blocked_pending_worker_runtime_policy',
  'blocked_pending_media_policy',
  'blocked_pending_model_review',
  'planning_only',
])

const pendingActions = new Set<WorkerRuntimeSoundCpuHandoffReviewPendingAction>([
  'wait_for_worker_runtime_static_contract_plan',
  'wait_for_dockerfile_static_plan',
  'wait_for_worker_runtime_policy',
  'wait_for_media_policy_handoff',
  'wait_for_model_weight_review',
  'future_worker_route_dry_run_after_static_contract',
  'do_not_duplicate_owner_lane',
  'none',
])

const duplicateRisks = new Set<WorkerRuntimeSoundCpuHandoffReviewDuplicateRisk>([
  'none',
  'do_not_duplicate_owner_lane',
  'possible_duplicate_worker_route',
  'possible_duplicate_worker_runtime_claim',
  'possible_duplicate_worker_job_table',
  'possible_duplicate_static_contract_plan',
  'possible_duplicate_dockerfile_plan',
  'possible_duplicate_policy_enablement',
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
  return readStringArray(value, context).map((entry) => {
    if (!allowed.has(entry as T)) {
      throw new Error(`${context} contains unsupported value: ${entry}`)
    }

    return entry as T
  })
}

function readProductionToolIds(value: unknown, context: string): ProductionToolId[] {
  return readStringArray(value, context).map((toolId) => {
    if (!isProductionToolId(toolId)) {
      throw new Error(`${context} contains non-first-class ProductionToolId: ${toolId}`)
    }

    return toolId
  })
}

function readCoverage(value: unknown, context: string): WorkerRuntimeSoundCpuHandoffReviewCoverage {
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

function readRow(value: unknown, context: string): WorkerRuntimeSoundCpuHandoffReviewRow {
  assertObject(value, context)

  return {
    normalizedItemId: readString(value.normalizedItemId, `${context}.normalizedItemId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    itemType: readEnum(value.itemType, itemTypes, `${context}.itemType`),
    workerReviewEvidenceStatus: readEnumArray(value.workerReviewEvidenceStatus, evidenceStatuses, `${context}.workerReviewEvidenceStatus`),
    prNumber: readNumber(value.prNumber, `${context}.prNumber`) as 670,
    prMerged: readBoolean(value.prMerged, `${context}.prMerged`) as true,
    mergeCommit: readString(value.mergeCommit, `${context}.mergeCommit`) as 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc',
    evidenceIsFinalSourceOfTruth: readBoolean(value.evidenceIsFinalSourceOfTruth, `${context}.evidenceIsFinalSourceOfTruth`) as true,
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    relatedProductionToolIds: readProductionToolIds(value.relatedProductionToolIds, `${context}.relatedProductionToolIds`),
    relatedCandidateStudyCards: readStringArray(value.relatedCandidateStudyCards, `${context}.relatedCandidateStudyCards`),
    acceptedForFutureStaticPlanning: readBoolean(value.acceptedForFutureStaticPlanning, `${context}.acceptedForFutureStaticPlanning`),
    acceptedForExecution: readBoolean(value.acceptedForExecution, `${context}.acceptedForExecution`) as false,
    workerRuntimeOwnerReviewAccepted: readBoolean(value.workerRuntimeOwnerReviewAccepted, `${context}.workerRuntimeOwnerReviewAccepted`),
    staticContractPlanRequired: readBoolean(value.staticContractPlanRequired, `${context}.staticContractPlanRequired`) as true,
    workerDispatchAllowedNow: readBoolean(value.workerDispatchAllowedNow, `${context}.workerDispatchAllowedNow`) as false,
    workerClaimAllowedNow: readBoolean(value.workerClaimAllowedNow, `${context}.workerClaimAllowedNow`) as false,
    workerLeaseAllowedNow: readBoolean(value.workerLeaseAllowedNow, `${context}.workerLeaseAllowedNow`) as false,
    workerExecutionAllowedNow: readBoolean(value.workerExecutionAllowedNow, `${context}.workerExecutionAllowedNow`) as false,
    workerJobsCreatedNow: readBoolean(value.workerJobsCreatedNow, `${context}.workerJobsCreatedNow`) as false,
    routeExecutionAllowedNow: readBoolean(value.routeExecutionAllowedNow, `${context}.routeExecutionAllowedNow`) as false,
    toolExecutionAllowedNow: readBoolean(value.toolExecutionAllowedNow, `${context}.toolExecutionAllowedNow`) as false,
    dockerfileMutationAllowedNow: readBoolean(value.dockerfileMutationAllowedNow, `${context}.dockerfileMutationAllowedNow`) as false,
    imageBuildAllowedNow: readBoolean(value.imageBuildAllowedNow, `${context}.imageBuildAllowedNow`) as false,
    gcpCallAllowedNow: readBoolean(value.gcpCallAllowedNow, `${context}.gcpCallAllowedNow`) as false,
    cloudRunAllowedNow: readBoolean(value.cloudRunAllowedNow, `${context}.cloudRunAllowedNow`) as false,
    serviceAccountAllowedNow: readBoolean(value.serviceAccountAllowedNow, `${context}.serviceAccountAllowedNow`) as false,
    secretManagerAllowedNow: readBoolean(value.secretManagerAllowedNow, `${context}.secretManagerAllowedNow`) as false,
    observabilityPolicyAllowedNow: readBoolean(value.observabilityPolicyAllowedNow, `${context}.observabilityPolicyAllowedNow`) as false,
    retryPolicyAllowedNow: readBoolean(value.retryPolicyAllowedNow, `${context}.retryPolicyAllowedNow`) as false,
    artifactPolicyAllowedNow: readBoolean(value.artifactPolicyAllowedNow, `${context}.artifactPolicyAllowedNow`) as false,
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
}

function assertIncludesAll(actual: readonly string[], expected: readonly string[], context: string): void {
  const missing = expected.filter((entry) => !actual.includes(entry))
  if (missing.length > 0) {
    throw new Error(`${context} missing required rows: ${missing.join(', ')}`)
  }
}

function assertRequiredRows(rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[]): void {
  const ids = rows.map((row) => row.normalizedItemId)
  assertIncludesAll(ids, WORKER_RUNTIME_SOUND_CPU_REVIEW_ROWS, 'Worker Runtime Sound CPU review rows')
  assertIncludesAll(ids, WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES, 'accepted worker names')
  assertIncludesAll(ids, WORKER_RUNTIME_SOUND_CPU_PLANNED_IMAGE_NAMES, 'planned image names')
  assertIncludesAll(ids, WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES, 'accepted job types')
  assertIncludesAll(ids, WORKER_RUNTIME_SOUND_CPU_BLOCKED_GATES, 'blocked gates')
  assertIncludesAll(ids, WORKER_RUNTIME_SOUND_CPU_RELATED_SOUND_TOOLS, 'related Sound tools')
  assertIncludesAll(ids, WORKER_RUNTIME_SOUND_CPU_NEXT_PROMPTS, 'next prompts')

  const duplicateIds = ids.filter((itemId, index, values) => values.indexOf(itemId) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`Worker Runtime Sound CPU handoff review matrix has duplicate rows: ${duplicateIds.join(', ')}`)
  }
}

function readMatrixDocument(parsed: Record<string, unknown>, rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[]): WorkerRuntimeSoundCpuHandoffReviewMatrixDocument {
  assertObject(parsed.evidenceSummary, 'worker runtime sound cpu handoff review matrix evidenceSummary')
  if (parsed.evidenceSummary.sourcePr !== WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_SOURCE_PR) {
    throw new Error('Worker Runtime Sound CPU handoff review matrix must reference PR #670.')
  }
  if (parsed.evidenceSummary.sourceMilestone !== 'WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW') {
    throw new Error('Worker Runtime Sound CPU handoff review matrix must reference WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW.')
  }
  if (parsed.evidenceSummary.mergeCommit !== WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MERGE_COMMIT) {
    throw new Error('Worker Runtime Sound CPU handoff review matrix has the wrong merge commit.')
  }
  if (parsed.evidenceSummary.sourceHeadCommit !== WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_SOURCE_HEAD) {
    throw new Error('Worker Runtime Sound CPU handoff review matrix has the wrong source head commit.')
  }
  if (parsed.evidenceSummary.evidenceIsFinalSourceOfTruth !== true || parsed.evidenceSummary.prMerged !== true) {
    throw new Error('Worker Runtime Sound CPU handoff review matrix must mark PR #670 as merged final owner evidence.')
  }

  return {
    schema: WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MATRIX_SCHEMA,
    evidenceSummary: {
      sourcePr: 670,
      sourceMilestone: 'WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW',
      sourceDecision: 'worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan',
      sourceBranch: readString(parsed.evidenceSummary.sourceBranch, 'evidenceSummary.sourceBranch'),
      sourceHeadCommit: WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_SOURCE_HEAD,
      prMerged: true,
      mergeCommit: WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MERGE_COMMIT,
      evidenceIsFinalSourceOfTruth: true,
      workerReviewRowCount: readNumber(parsed.evidenceSummary.workerReviewRowCount, 'evidenceSummary.workerReviewRowCount') as 1,
      acceptedWorkerNameCount: readNumber(parsed.evidenceSummary.acceptedWorkerNameCount, 'evidenceSummary.acceptedWorkerNameCount') as 2,
      plannedImageNameCount: readNumber(parsed.evidenceSummary.plannedImageNameCount, 'evidenceSummary.plannedImageNameCount') as 2,
      acceptedJobTypeCount: readNumber(parsed.evidenceSummary.acceptedJobTypeCount, 'evidenceSummary.acceptedJobTypeCount') as 4,
      blockedGateCount: readNumber(parsed.evidenceSummary.blockedGateCount, 'evidenceSummary.blockedGateCount'),
      relatedSoundToolCount: readNumber(parsed.evidenceSummary.relatedSoundToolCount, 'evidenceSummary.relatedSoundToolCount') as 23,
      nextPromptCount: readNumber(parsed.evidenceSummary.nextPromptCount, 'evidenceSummary.nextPromptCount') as 1,
      acceptedWorkerNames: readStringArray(parsed.evidenceSummary.acceptedWorkerNames, 'evidenceSummary.acceptedWorkerNames'),
      plannedImageNames: readStringArray(parsed.evidenceSummary.plannedImageNames, 'evidenceSummary.plannedImageNames'),
      acceptedJobTypes: readStringArray(parsed.evidenceSummary.acceptedJobTypes, 'evidenceSummary.acceptedJobTypes'),
      blockedGates: readStringArray(parsed.evidenceSummary.blockedGates, 'evidenceSummary.blockedGates'),
      relatedSoundTools: readStringArray(parsed.evidenceSummary.relatedSoundTools, 'evidenceSummary.relatedSoundTools'),
      nextOwnerPrompts: readStringArray(parsed.evidenceSummary.nextOwnerPrompts, 'evidenceSummary.nextOwnerPrompts'),
      soundGate1dEvidence: {
        sourcePr: 663,
        mergeCommit: 'dbb6d7fe56e7a710059fd80385f11e6fe186f5e0',
        targetOwner: 'WORKER_RUNTIME_JOBS',
        acceptedWorkerNameCount: 2,
        planningOnlyJobTypeCount: 4,
      },
      staticContractPlanEvidenceStatus: readEnum(
        parsed.evidenceSummary.staticContractPlanEvidenceStatus,
        new Set(['owner_next_prompt_only', 'candidate_evidence_only', 'merged_owner_source_evidence']),
        'evidenceSummary.staticContractPlanEvidenceStatus',
      ),
      workerRouteDryRunAdded: false,
      workerExecutionPerformed: false,
      workerClaimPerformed: false,
      workerLeasePerformed: false,
      workerJobsCreated: false,
      staticContractPlanAdded: false,
      importsRun: false,
      dockerActionPerformed: false,
      gcpActionPerformed: false,
      cloudRunActionPerformed: false,
      secretManagerActionPerformed: false,
      observabilityPolicyEnabled: false,
      retryPolicyEnabled: false,
      artifactPolicyEnabled: false,
      adaptersAdded: 0,
      commandIntentsAdded: 0,
      probesAdded: 0,
    },
    rows,
  }
}

export function loadWorkerRuntimeSoundCpuHandoffReviewSources(): WorkerRuntimeSoundCpuHandoffReviewSourceBundle {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'worker runtime sound cpu handoff review matrix')
  if (parsed.schema !== WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MATRIX_SCHEMA) {
    throw new Error('Worker Runtime Sound CPU handoff review matrix schema is unsupported.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('Worker Runtime Sound CPU handoff review matrix rows must be an array.')
  }

  const rows = parsed.rows.map((entry, index) => readRow(entry, `rows[${index}]`))
  assertRequiredRows(rows)

  return {
    matrixDocument: readMatrixDocument(parsed, rows),
  }
}
