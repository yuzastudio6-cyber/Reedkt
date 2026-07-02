import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  buildWorkerRuntimeSoundCpuHandoffReviewMatrix,
} from './worker-runtime-sound-cpu-handoff-review-reconciliation-analyzer'
import {
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_IMAGE_NAMES,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_JOB_TYPES,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_WORKER_NAMES,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_RELATED_SOUND_TOOLS,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MERGE_COMMIT,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_ROWS,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_STATIC_AREAS,
  WORKER_RUNTIME_SOUND_CPU_DOCKERFILE_STATIC_REVIEW_NEXT_PROMPT,
  loadWorkerRuntimeSoundCpuContractOwnerReviewMergedSources,
} from './worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-loader'
import type {
  WorkerRuntimeSoundCpuContractOwnerReviewAnalysis,
  WorkerRuntimeSoundCpuContractOwnerReviewRecommendation,
  WorkerRuntimeSoundCpuContractOwnerReviewRow,
} from './worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function assertNoRuntimeOrPolicyEnablementRows(rows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[]): void {
  const unsafeRows = rows.filter((row) => (
    row.acceptedForRuntimeExecution ||
    row.workerDispatchAllowedNow ||
    row.workerClaimAllowedNow ||
    row.workerLeaseAllowedNow ||
    row.workerExecutionAllowedNow ||
    row.routeExecutionAllowedNow ||
    row.toolExecutionAllowedNow ||
    row.dockerfileMutationAllowedNow ||
    row.imageBuildAllowedNow ||
    row.gcpCallAllowedNow ||
    row.cloudRunAllowedNow ||
    row.serviceAccountAllowedNow ||
    row.secretManagerAllowedNow ||
    row.observabilityPolicyAllowedNow ||
    row.retryPolicyAllowedNow ||
    row.artifactPolicyAllowedNow ||
    row.mediaProcessingAllowedNow ||
    row.supabaseMutationAllowedNow ||
    row.sqlAllowedNow ||
    row.publicArtifactsAllowedNow ||
    row.betaProductionAllowedNow ||
    row.currentToolCallingCoverage.hasWorkerRouteDryRun
  ))
  if (unsafeRows.length > 0) {
    throw new Error(`Worker Runtime Sound CPU contract owner review rows enabled forbidden surfaces: ${unsafeRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function assertNoNewToolCallingSurfaceRows(rows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[]): void {
  const expandedRows = rows.filter((row) => (
    row.itemType !== 'related_sound_tool' &&
    (
      row.currentToolCallingCoverage.hasFirstClassStudyCard ||
      row.currentToolCallingCoverage.hasCandidateStudyCard ||
      row.currentToolCallingCoverage.hasAdapterContract ||
      row.currentToolCallingCoverage.hasSafeCommandIntent ||
      row.currentToolCallingCoverage.hasFixturePlan ||
      row.currentToolCallingCoverage.hasControlledProbe ||
      row.currentToolCallingCoverage.hasWorkerRouteDryRun
    )
  ))
  if (expandedRows.length > 0) {
    throw new Error(`Worker Runtime Sound CPU contract owner review rows gained tool-calling runtime coverage: ${expandedRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function buildRecommendations(rows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[]): WorkerRuntimeSoundCpuContractOwnerReviewRecommendation[] {
  const dockerfileRows = rows
    .filter((row) => row.toolCallingPendingAction === 'wait_for_dockerfile_static_review_merge')
    .map((row) => row.normalizedItemId)
  const gate1ERows = rows
    .filter((row) => row.toolCallingPendingAction === 'wait_for_gate_1e_dockerfile_static_plan')
    .map((row) => row.normalizedItemId)
  const workerRouteRows = rows
    .filter((row) => row.toolCallingPendingAction === 'wait_for_worker_route_dry_run_decision')
    .map((row) => row.normalizedItemId)
  const mediaRows = rows
    .filter((row) => row.toolCallingPendingAction === 'wait_for_media_policy_handoff')
    .map((row) => row.normalizedItemId)
  const modelRows = rows
    .filter((row) => row.toolCallingPendingAction === 'wait_for_model_weight_review')
    .map((row) => row.normalizedItemId)

  return [
    {
      milestone: 'REEDITPRO-TOOL-CALLING-WORKER-RUNTIME-SOUND-CPU-DOCKERFILE-STATIC-REVIEW-RECONCILIATION-1',
      reason: 'PR #684 Dockerfile static review evidence must be merged before tool-calling treats it as final source truth.',
      affectedItemIds: uniqueSorted(dockerfileRows),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1E',
      reason: 'Gate 1E Dockerfile static plan remains required before static image planning integration.',
      affectedItemIds: uniqueSorted(gate1ERows),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-GENERIC-WORKER-ROUTE-DRY-RUN-READINESS-DECISION-1',
      reason: 'Worker-route dry-run remains blocked until Dockerfile static review and Gate 1E evidence are reconciled.',
      affectedItemIds: uniqueSorted(workerRouteRows),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'pydub, audioread, FFmpeg Sound expansion, and media/file operations remain blocked pending media policy handoff.',
      affectedItemIds: uniqueSorted(mediaRows),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Model, GPU, and provider/provenance-sensitive tools remain blocked.',
      affectedItemIds: uniqueSorted(modelRows),
    },
  ]
}

export function buildWorkerRuntimeSoundCpuContractOwnerReviewMergedMatrix(): WorkerRuntimeSoundCpuContractOwnerReviewRow[] {
  const sourceBundle = loadWorkerRuntimeSoundCpuContractOwnerReviewMergedSources()
  const handoffRows = new Map(
    buildWorkerRuntimeSoundCpuHandoffReviewMatrix().map((row) => [row.normalizedItemId, row]),
  )

  const rows = sourceBundle.matrixDocument.rows.map((row) => {
    if (row.itemType !== 'related_sound_tool') return row

    const handoffRow = handoffRows.get(row.normalizedItemId)
    if (!handoffRow) return row

    return {
      ...row,
      relatedProductionToolIds: handoffRow.relatedProductionToolIds,
      relatedCandidateStudyCards: handoffRow.relatedCandidateStudyCards,
      currentToolCallingCoverage: handoffRow.currentToolCallingCoverage,
    }
  })

  assertNoRuntimeOrPolicyEnablementRows(rows)
  assertNoNewToolCallingSurfaceRows(rows)

  return rows
}

export function listAcceptedSoundContractAreas(
  rows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[] = buildWorkerRuntimeSoundCpuContractOwnerReviewMergedMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => (
        (
          row.itemType === 'accepted_worker_name' ||
          row.itemType === 'accepted_image_name' ||
          row.itemType === 'accepted_job_type' ||
          row.itemType === 'accepted_static_contract_area' ||
          row.itemType === 'accepted_static_field' ||
          row.itemType === 'placeholder_policy_surface'
        ) &&
        row.acceptedForFutureStaticPlanning
      ))
      .map((row) => row.normalizedItemId),
  )
}

export function listWorkerRuntimeContractOwnerReviewBlockedRows(
  rows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[] = buildWorkerRuntimeSoundCpuContractOwnerReviewMergedMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.executionGate.startsWith('blocked_'))
      .map((row) => row.normalizedItemId),
  )
}

export function listDockerfileStaticReviewEvidenceRows(
  rows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[] = buildWorkerRuntimeSoundCpuContractOwnerReviewMergedMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'dockerfile_static_review_candidate_evidence' || row.itemType === 'dockerfile_static_review_next_prompt')
      .map((row) => row.normalizedItemId),
  )
}

export function recommendWorkerRuntimeSoundCpuContractOwnerReviewNextMilestones(
  rows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[] = buildWorkerRuntimeSoundCpuContractOwnerReviewMergedMatrix(),
): WorkerRuntimeSoundCpuContractOwnerReviewRecommendation[] {
  return buildRecommendations(rows)
}

export function analyzeWorkerRuntimeSoundCpuContractOwnerReviewMerged(): WorkerRuntimeSoundCpuContractOwnerReviewAnalysis {
  const rows = buildWorkerRuntimeSoundCpuContractOwnerReviewMergedMatrix()
  const acceptedSoundContractAreas = listAcceptedSoundContractAreas(rows)
  const blockedRows = listWorkerRuntimeContractOwnerReviewBlockedRows(rows)
  const dockerfileStaticReviewEvidenceRows = listDockerfileStaticReviewEvidenceRows(rows)
  const pr684Rows = rows.filter((row) => row.prNumber === 684)

  if (rows.filter((row) => row.itemType === 'worker_runtime_contract_owner_review').length !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_ROWS.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_ROWS.length} Worker Runtime Sound CPU contract owner review row.`)
  }
  if (rows.filter((row) => row.itemType === 'accepted_worker_name').length !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_WORKER_NAMES.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_WORKER_NAMES.length} accepted worker names.`)
  }
  if (rows.filter((row) => row.itemType === 'accepted_image_name').length !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_IMAGE_NAMES.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_IMAGE_NAMES.length} accepted image names.`)
  }
  if (rows.filter((row) => row.itemType === 'accepted_job_type').length !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_JOB_TYPES.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_JOB_TYPES.length} accepted job types.`)
  }
  if (rows.filter((row) => row.itemType === 'accepted_static_contract_area').length !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_STATIC_AREAS.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_STATIC_AREAS.length} accepted static contract areas.`)
  }
  if (rows.filter((row) => row.itemType === 'related_sound_tool').length !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_RELATED_SOUND_TOOLS.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_RELATED_SOUND_TOOLS.length} related Sound tool rows.`)
  }
  if (!rows.some((row) => row.normalizedItemId === WORKER_RUNTIME_SOUND_CPU_DOCKERFILE_STATIC_REVIEW_NEXT_PROMPT)) {
    throw new Error('Dockerfile static review next prompt row is missing.')
  }
  if (rows.some((row) => row.prNumber === 679 && (row.mergeCommit !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MERGE_COMMIT || !row.evidenceIsFinalSourceOfTruth))) {
    throw new Error('Every PR #679 row must reference merged owner source evidence.')
  }
  if (pr684Rows.length === 0) {
    throw new Error('PR #684 Dockerfile static review evidence row is missing.')
  }
  if (pr684Rows.some((row) => !row.prMerged && row.evidenceIsFinalSourceOfTruth)) {
    throw new Error('Open PR #684 candidate evidence must not be final source truth.')
  }

  return {
    matrixRows: rows,
    sourcePr: 679,
    mergeCommit: WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MERGE_COMMIT,
    evidenceIsFinalSourceOfTruth: true,
    contractOwnerReviewMatrixRows: rows.length,
    pr684Found: pr684Rows.length > 0,
    pr684Merged: pr684Rows.some((row) => row.prMerged),
    pr684EvidenceIsFinalSourceOfTruth: pr684Rows.some((row) => row.evidenceIsFinalSourceOfTruth),
    acceptedWorkerNameCount: 2,
    acceptedImageNameCount: 2,
    acceptedJobTypeCount: 4,
    acceptedStaticContractAreaCount: rows.filter((row) => row.itemType === 'accepted_static_contract_area').length,
    acceptedStaticFieldCount: rows.filter((row) => row.itemType === 'accepted_static_field').length,
    placeholderPolicyCount: rows.filter((row) => row.itemType === 'placeholder_policy_surface').length,
    blockedRowCount: blockedRows.length,
    relatedSoundToolCount: 23,
    productionToolIdCount: PRODUCTION_TOOL_IDS.length,
    productionToolIdCountChanged: false,
    adaptersAdded: 0,
    commandIntentsAdded: 0,
    probesAdded: 0,
    workerRouteDryRunAdded: false,
    workerExecutionPerformed: false,
    workerClaimPerformed: false,
    workerLeasePerformed: false,
    workerJobsCreated: false,
    dockerfileStaticPlanAdded: false,
    dockerActionPerformed: false,
    gcpActionPerformed: false,
    cloudRunActionPerformed: false,
    secretManagerActionPerformed: false,
    observabilityPolicyEnabled: false,
    retryPolicyEnabled: false,
    artifactPolicyEnabled: false,
    importsRun: false,
    acceptedSoundContractAreas,
    blockedRows,
    dockerfileStaticReviewEvidenceRows,
    recommendedNextMilestones: recommendWorkerRuntimeSoundCpuContractOwnerReviewNextMilestones(rows),
    safety: {
      executesTools: false,
      importsRun: false,
      audioProcessingPerformed: false,
      mediaProcessingPerformed: false,
      workerExecutionPerformed: false,
      workerRouteDryRunAdded: false,
      workerClaimPerformed: false,
      workerLeasePerformed: false,
      workerJobsCreated: false,
      dockerActionPerformed: false,
      gcpActionPerformed: false,
      cloudRunActionPerformed: false,
      secretManagerActionPerformed: false,
      observabilityPolicyEnabled: false,
      retryPolicyEnabled: false,
      artifactPolicyEnabled: false,
      providerCallsPerformed: false,
      supabaseMutationPerformed: false,
      sqlExecuted: false,
      migrationsCreated: false,
      signedUrlsCreated: false,
      packageLockMutated: false,
      betaProductionUnlocked: false,
      duplicateSystemsCreated: false,
    },
  }
}
