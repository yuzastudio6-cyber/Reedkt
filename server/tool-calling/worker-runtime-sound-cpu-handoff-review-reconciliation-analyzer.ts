import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  buildSoundGate1DMergedReconciliationMatrix,
} from './sound-gate-1d-merged-reconciliation-analyzer'
import {
  WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES,
  WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES,
  WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MERGE_COMMIT,
  WORKER_RUNTIME_SOUND_CPU_NEXT_PROMPTS,
  WORKER_RUNTIME_SOUND_CPU_PLANNED_IMAGE_NAMES,
  WORKER_RUNTIME_SOUND_CPU_REVIEW_ROWS,
  loadWorkerRuntimeSoundCpuHandoffReviewSources,
} from './worker-runtime-sound-cpu-handoff-review-reconciliation-loader'
import type {
  WorkerRuntimeSoundCpuHandoffReviewAnalysis,
  WorkerRuntimeSoundCpuHandoffReviewRecommendation,
  WorkerRuntimeSoundCpuHandoffReviewRow,
} from './worker-runtime-sound-cpu-handoff-review-reconciliation-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function assertNoRuntimeOrPolicyEnablementRows(rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[]): void {
  const unsafeRows = rows.filter((row) => (
    row.acceptedForExecution ||
    row.workerDispatchAllowedNow ||
    row.workerClaimAllowedNow ||
    row.workerLeaseAllowedNow ||
    row.workerExecutionAllowedNow ||
    row.workerJobsCreatedNow ||
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
    throw new Error(`Worker Runtime Sound CPU handoff review rows enabled forbidden runtime or policy surfaces: ${unsafeRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function assertNoNewToolCallingSurfaceRows(rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[]): void {
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
    throw new Error(`Worker Runtime Sound CPU review rows gained tool-calling runtime coverage: ${expandedRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function buildRecommendations(rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[]): WorkerRuntimeSoundCpuHandoffReviewRecommendation[] {
  const staticContractItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_static_contract_plan' || row.executionGate === 'blocked_pending_worker_runtime_static_contract')
    .map((row) => row.normalizedItemId)
  const workerPolicyItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_worker_runtime_policy')
    .map((row) => row.normalizedItemId)
  const dockerItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_dockerfile_static_plan')
    .map((row) => row.normalizedItemId)
  const mediaItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_media_policy')
    .map((row) => row.normalizedItemId)
  const modelItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_model_review')
    .map((row) => row.normalizedItemId)

  return [
    {
      milestone: 'REEDITPRO-TOOL-CALLING-WORKER-RUNTIME-SOUND-CPU-STATIC-CONTRACT-PLAN-RECONCILIATION-1',
      reason: 'Worker Runtime owner review passed for future static planning only; static contract plan evidence is required before worker-route dry-run or static runtime integration.',
      affectedItemIds: uniqueSorted(staticContractItems),
    },
    {
      milestone: 'WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-PLAN',
      reason: 'Owner lane must define static worker runtime contract details before tool-calling consumes route, claim, lease, retry, observability, artifact, or idempotency policy.',
      affectedItemIds: uniqueSorted(workerPolicyItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1E',
      reason: 'Dockerfile and image static planning remain blocked until separate owner evidence exists.',
      affectedItemIds: uniqueSorted(dockerItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'pydub, audioread, FFmpeg Sound expansion, media open/process, artifacts, and public delivery remain blocked pending media policy handoff.',
      affectedItemIds: uniqueSorted(mediaItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Model download, GPU, provider, and provenance-sensitive tools remain blocked.',
      affectedItemIds: uniqueSorted(modelItems),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-GENERIC-WORKER-ROUTE-DRY-RUN-READINESS-DECISION-1',
      reason: 'Generic worker-route dry-run remains a decision gate only and must wait until static contract plan evidence exists.',
      affectedItemIds: uniqueSorted([
        ...WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES,
        ...WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES,
      ]),
    },
  ]
}

export function buildWorkerRuntimeSoundCpuHandoffReviewMatrix(): WorkerRuntimeSoundCpuHandoffReviewRow[] {
  const sourceBundle = loadWorkerRuntimeSoundCpuHandoffReviewSources()
  const gate1DRows = new Map(
    buildSoundGate1DMergedReconciliationMatrix().map((row) => [row.normalizedItemId, row]),
  )

  const rows = sourceBundle.matrixDocument.rows.map((row) => {
    if (row.itemType !== 'related_sound_tool') return row

    const gate1DRow = gate1DRows.get(row.normalizedItemId)
    if (!gate1DRow) return row

    return {
      ...row,
      relatedProductionToolIds: gate1DRow.relatedProductionToolIds,
      relatedCandidateStudyCards: gate1DRow.relatedCandidateStudyCards,
      currentToolCallingCoverage: gate1DRow.currentToolCallingCoverage,
    }
  })

  assertNoRuntimeOrPolicyEnablementRows(rows)
  assertNoNewToolCallingSurfaceRows(rows)

  return rows
}

export function listAcceptedSoundWorkerNames(
  rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[] = buildWorkerRuntimeSoundCpuHandoffReviewMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'accepted_worker_name' && row.acceptedForFutureStaticPlanning)
      .map((row) => row.normalizedItemId),
  )
}

export function listAcceptedSoundJobTypes(
  rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[] = buildWorkerRuntimeSoundCpuHandoffReviewMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'accepted_job_type' && row.acceptedForFutureStaticPlanning)
      .map((row) => row.normalizedItemId),
  )
}

export function listWorkerRuntimeBlockedRows(
  rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[] = buildWorkerRuntimeSoundCpuHandoffReviewMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.executionGate.startsWith('blocked_'))
      .map((row) => row.normalizedItemId),
  )
}

export function recommendWorkerRuntimeSoundCpuNextMilestones(
  rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[] = buildWorkerRuntimeSoundCpuHandoffReviewMatrix(),
): WorkerRuntimeSoundCpuHandoffReviewRecommendation[] {
  return buildRecommendations(rows)
}

export function analyzeWorkerRuntimeSoundCpuHandoffReview(): WorkerRuntimeSoundCpuHandoffReviewAnalysis {
  const rows = buildWorkerRuntimeSoundCpuHandoffReviewMatrix()
  const acceptedWorkerNames = listAcceptedSoundWorkerNames(rows)
  const acceptedJobTypes = listAcceptedSoundJobTypes(rows)
  const blockedRows = listWorkerRuntimeBlockedRows(rows)
  const plannedImageNameCount = rows.filter((row) => row.itemType === 'planned_image_name' && row.acceptedForFutureStaticPlanning).length
  const relatedSoundToolCount = rows.filter((row) => row.itemType === 'related_sound_tool').length
  const nextPrompts = uniqueSorted(
    rows
      .filter((row) => row.itemType === 'static_contract_next_prompt')
      .map((row) => row.normalizedItemId),
  )

  if (rows.length !== 55) {
    throw new Error(`Expected 55 Worker Runtime Sound CPU handoff review matrix rows; received ${rows.length}.`)
  }
  if (rows.filter((row) => row.itemType === 'worker_runtime_owner_review').length !== WORKER_RUNTIME_SOUND_CPU_REVIEW_ROWS.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_REVIEW_ROWS.length} Worker Runtime owner review row.`)
  }
  if (acceptedWorkerNames.length !== WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES.length} accepted worker names; received ${acceptedWorkerNames.length}.`)
  }
  if (plannedImageNameCount !== WORKER_RUNTIME_SOUND_CPU_PLANNED_IMAGE_NAMES.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_PLANNED_IMAGE_NAMES.length} planned image names; received ${plannedImageNameCount}.`)
  }
  if (acceptedJobTypes.length !== WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES.length} accepted job types; received ${acceptedJobTypes.length}.`)
  }
  if (relatedSoundToolCount !== 23) {
    throw new Error(`Expected 23 related Sound tool rows; received ${relatedSoundToolCount}.`)
  }
  if (nextPrompts.length !== WORKER_RUNTIME_SOUND_CPU_NEXT_PROMPTS.length) {
    throw new Error(`Expected ${WORKER_RUNTIME_SOUND_CPU_NEXT_PROMPTS.length} static contract next prompt; received ${nextPrompts.length}.`)
  }
  if (rows.some((row) => row.mergeCommit !== WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MERGE_COMMIT || !row.evidenceIsFinalSourceOfTruth)) {
    throw new Error('Every Worker Runtime Sound CPU handoff review row must reference the expected merged owner source evidence.')
  }

  return {
    matrixRows: rows,
    sourcePr: 670,
    mergeCommit: WORKER_RUNTIME_SOUND_CPU_HANDOFF_REVIEW_MERGE_COMMIT,
    evidenceIsFinalSourceOfTruth: true,
    workerReviewMatrixRows: rows.length,
    acceptedWorkerNameCount: 2,
    plannedImageNameCount: 2,
    acceptedJobTypeCount: 4,
    blockedRowCount: blockedRows.length,
    relatedSoundToolCount: 23,
    nextPromptCount: 1,
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
    staticContractPlanAdded: false,
    dockerActionPerformed: false,
    gcpActionPerformed: false,
    cloudRunActionPerformed: false,
    secretManagerActionPerformed: false,
    observabilityPolicyEnabled: false,
    retryPolicyEnabled: false,
    artifactPolicyEnabled: false,
    importsRun: false,
    acceptedWorkerNames,
    acceptedJobTypes,
    blockedRows,
    nextPrompts,
    recommendedNextMilestones: recommendWorkerRuntimeSoundCpuNextMilestones(rows),
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
