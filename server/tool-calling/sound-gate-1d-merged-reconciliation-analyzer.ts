import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  buildSoundGate1CMergedReconciliationMatrix,
} from './sound-gate-1c-merged-reconciliation-analyzer'
import {
  SOUND_GATE_1D_ACCEPTED_WORKER_NAMES,
  SOUND_GATE_1D_MERGED_MERGE_COMMIT,
  SOUND_GATE_1D_NEXT_PROMPTS,
  SOUND_GATE_1D_OWNER_HANDOFF_SURFACES,
  SOUND_GATE_1D_PACKET_SURFACES,
  SOUND_GATE_1D_PLANNED_IMAGE_NAMES,
  SOUND_GATE_1D_PLANNING_ONLY_JOB_TYPES,
  SOUND_GATE_1D_TARGET_OWNERS,
  expandSoundGate1DMergedRow,
  loadSoundGate1DMergedSources,
} from './sound-gate-1d-merged-reconciliation-loader'
import type {
  SoundGate1DMergedCoverageAnalysis,
  SoundGate1DMergedRecommendation,
  SoundGate1DMergedRow,
} from './sound-gate-1d-merged-reconciliation-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function assertNoWorkerRuntimeOrExecutionRows(rows: readonly SoundGate1DMergedRow[]): void {
  const unsafeRows = rows.filter((row) => (
    row.acceptedForExecution ||
    row.workerDispatchAllowedNow ||
    row.workerClaimAllowedNow ||
    row.workerLeaseAllowedNow ||
    row.routeExecutionAllowedNow ||
    row.toolExecutionAllowedNow ||
    row.dockerfileMutationAllowedNow ||
    row.imageBuildAllowedNow ||
    row.gcpCallAllowedNow ||
    row.cloudRunAllowedNow ||
    row.serviceAccountAllowedNow ||
    row.secretManagerAllowedNow ||
    row.mediaProcessingAllowedNow ||
    row.supabaseMutationAllowedNow ||
    row.sqlAllowedNow ||
    row.publicArtifactsAllowedNow ||
    row.betaProductionAllowedNow ||
    row.currentToolCallingCoverage.hasWorkerRouteDryRun
  ))
  if (unsafeRows.length > 0) {
    throw new Error(`Sound Gate 1D merged rows enabled worker runtime, execution, build, deploy, mutation, or worker-route dry-run: ${unsafeRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function assertNoNewToolCallingSurfaceRows(rows: readonly SoundGate1DMergedRow[]): void {
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
    throw new Error(`Sound Gate 1D owner packet rows gained tool-calling runtime coverage: ${expandedRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function buildRecommendations(rows: readonly SoundGate1DMergedRow[]): SoundGate1DMergedRecommendation[] {
  const workerReviewItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_worker_runtime_jobs_sound_cpu_handoff_review')
    .map((row) => row.normalizedItemId)
  const gate1EItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_gate_1e_dockerfile_static_plan')
    .map((row) => row.normalizedItemId)
  const mediaItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_media_policy')
    .map((row) => row.normalizedItemId)
  const modelItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_model_review')
    .map((row) => row.normalizedItemId)

  return [
    {
      milestone: 'WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW',
      reason: 'Gate 1D is merged owner handoff evidence, but Worker Runtime Jobs must review and accept the packet before tool-calling can plan any worker-route dry-run or runtime claim path.',
      affectedItemIds: uniqueSorted(workerReviewItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1E',
      reason: 'Dockerfile static planning remains an owner-lane follow-up; this reconciliation records Gate 1D runtime handoff evidence and adds no Dockerfile, image build, or deployment action.',
      affectedItemIds: uniqueSorted(gate1EItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'Media file-open, pydub operations, audioread file-open, FFmpeg/ffprobe expansion, artifact storage, and public delivery policy remain blocked.',
      affectedItemIds: uniqueSorted(mediaItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Model, GPU, provenance, provider, and model-weight scopes remain blocked.',
      affectedItemIds: uniqueSorted(modelItems),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-GENERIC-WORKER-ROUTE-DRY-RUN-READINESS-DECISION-1',
      reason: 'A generic planning-only worker-route dry-run decision may be considered later, but this Gate 1D reconciliation intentionally adds no worker route, claim, lease, or job execution.',
      affectedItemIds: uniqueSorted([
        ...SOUND_GATE_1D_ACCEPTED_WORKER_NAMES,
        ...SOUND_GATE_1D_PLANNING_ONLY_JOB_TYPES,
      ]),
    },
  ]
}

export function buildSoundGate1DMergedReconciliationMatrix(): SoundGate1DMergedRow[] {
  const sourceBundle = loadSoundGate1DMergedSources()
  const gate1CRows = new Map(
    buildSoundGate1CMergedReconciliationMatrix().map((row) => [row.normalizedItemId, row]),
  )

  const rows = sourceBundle.matrixDocument.rows.map((row) => {
    const expandedRow = expandSoundGate1DMergedRow(row)
    if (expandedRow.itemType !== 'related_sound_tool') return expandedRow

    const gate1CRow = gate1CRows.get(expandedRow.normalizedItemId)
    if (!gate1CRow) return expandedRow

    return {
      ...expandedRow,
      relatedProductionToolIds: gate1CRow.relatedProductionToolIds,
      relatedCandidateStudyCards: gate1CRow.relatedCandidateStudyCards,
      currentToolCallingCoverage: gate1CRow.currentToolCallingCoverage,
    }
  })

  assertNoWorkerRuntimeOrExecutionRows(rows)
  assertNoNewToolCallingSurfaceRows(rows)

  return rows
}

export function listGate1DTargetOwners(
  rows: readonly SoundGate1DMergedRow[] = buildSoundGate1DMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'target_owner' && row.acceptedByGate1D)
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1DPlanningTerms(
  rows: readonly SoundGate1DMergedRow[] = buildSoundGate1DMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => (
        (row.itemType === 'accepted_worker_name' || row.itemType === 'planned_image_name' || row.itemType === 'planning_only_job_type') &&
        row.acceptedByGate1D
      ))
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1DBlockedRows(
  rows: readonly SoundGate1DMergedRow[] = buildSoundGate1DMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.executionGate.startsWith('blocked_'))
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1DOwnerHandoffSurfaces(
  rows: readonly SoundGate1DMergedRow[] = buildSoundGate1DMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'owner_handoff_surface')
      .map((row) => row.normalizedItemId),
  )
}

export function recommendSoundGate1DNextMilestones(
  rows: readonly SoundGate1DMergedRow[] = buildSoundGate1DMergedReconciliationMatrix(),
): SoundGate1DMergedRecommendation[] {
  return buildRecommendations(rows)
}

export function analyzeSoundGate1DMergedReconciliation(): SoundGate1DMergedCoverageAnalysis {
  const rows = buildSoundGate1DMergedReconciliationMatrix()
  const targetOwners = listGate1DTargetOwners(rows)
  const planningTerms = listGate1DPlanningTerms(rows)
  const ownerHandoffSurfaces = listGate1DOwnerHandoffSurfaces(rows)
  const blockedRows = listGate1DBlockedRows(rows)
  const nextPrompts = uniqueSorted(
    rows
      .filter((row) => row.itemType === 'worker_runtime_review_next_prompt' || row.itemType === 'gate_1e_next_prompt')
      .map((row) => row.normalizedItemId),
  )
  const packetSurfaceCount = rows.filter((row) => SOUND_GATE_1D_PACKET_SURFACES.includes(row.normalizedItemId as typeof SOUND_GATE_1D_PACKET_SURFACES[number])).length
  const relatedSoundToolCount = rows.filter((row) => row.itemType === 'related_sound_tool').length

  if (rows.length !== 71) {
    throw new Error(`Expected 71 Sound Gate 1D merged matrix rows; received ${rows.length}.`)
  }
  if (targetOwners.length !== SOUND_GATE_1D_TARGET_OWNERS.length) {
    throw new Error(`Expected ${SOUND_GATE_1D_TARGET_OWNERS.length} Gate 1D target owner; received ${targetOwners.length}.`)
  }
  if (packetSurfaceCount !== SOUND_GATE_1D_PACKET_SURFACES.length) {
    throw new Error(`Expected ${SOUND_GATE_1D_PACKET_SURFACES.length} Gate 1D packet surfaces; received ${packetSurfaceCount}.`)
  }
  if (planningTerms.length !== SOUND_GATE_1D_ACCEPTED_WORKER_NAMES.length + SOUND_GATE_1D_PLANNED_IMAGE_NAMES.length + SOUND_GATE_1D_PLANNING_ONLY_JOB_TYPES.length) {
    throw new Error(`Expected 8 Gate 1D accepted planning terms; received ${planningTerms.length}.`)
  }
  if (ownerHandoffSurfaces.length !== SOUND_GATE_1D_OWNER_HANDOFF_SURFACES.length) {
    throw new Error(`Expected ${SOUND_GATE_1D_OWNER_HANDOFF_SURFACES.length} Gate 1D owner handoff surfaces; received ${ownerHandoffSurfaces.length}.`)
  }
  if (nextPrompts.length !== SOUND_GATE_1D_NEXT_PROMPTS.length) {
    throw new Error(`Expected ${SOUND_GATE_1D_NEXT_PROMPTS.length} Gate 1D next prompts; received ${nextPrompts.length}.`)
  }
  if (relatedSoundToolCount !== 23) {
    throw new Error(`Expected 23 related Sound tool rows; received ${relatedSoundToolCount}.`)
  }
  if (rows.some((row) => row.mergeCommit !== SOUND_GATE_1D_MERGED_MERGE_COMMIT || !row.evidenceIsFinalSourceOfTruth)) {
    throw new Error('Every Sound Gate 1D merged row must reference the expected merged owner source evidence.')
  }

  return {
    matrixRows: rows,
    sourcePr: 663,
    mergeCommit: SOUND_GATE_1D_MERGED_MERGE_COMMIT,
    evidenceIsFinalSourceOfTruth: true,
    gate1dMatrixRows: rows.length,
    targetOwnerCount: 1,
    packetSurfaceCount: 6,
    acceptedWorkerNameCount: 2,
    plannedImageNameCount: 2,
    planningOnlyJobTypeCount: 4,
    blockedRowCount: blockedRows.length,
    ownerHandoffSurfaceCount: ownerHandoffSurfaces.length,
    relatedSoundToolCount: 23,
    nextPromptCount: 2,
    productionToolIdCount: PRODUCTION_TOOL_IDS.length,
    productionToolIdCountChanged: false,
    adaptersAdded: 0,
    commandIntentsAdded: 0,
    probesAdded: 0,
    workerRouteDryRunAdded: false,
    workerExecutionPerformed: false,
    workerClaimPerformed: false,
    workerLeasePerformed: false,
    dockerActionPerformed: false,
    gcpActionPerformed: false,
    cloudRunActionPerformed: false,
    secretManagerActionPerformed: false,
    importsRun: false,
    targetOwners,
    planningTerms,
    ownerHandoffSurfaces,
    blockedRows,
    nextPrompts,
    recommendedNextMilestones: recommendSoundGate1DNextMilestones(rows),
    safety: {
      executesTools: false,
      importsRun: false,
      audioProcessingPerformed: false,
      mediaProcessingPerformed: false,
      workerExecutionPerformed: false,
      workerRouteDryRunAdded: false,
      workerClaimPerformed: false,
      workerLeasePerformed: false,
      dockerActionPerformed: false,
      gcpActionPerformed: false,
      cloudRunActionPerformed: false,
      secretManagerActionPerformed: false,
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
