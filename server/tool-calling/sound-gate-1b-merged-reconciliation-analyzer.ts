import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  buildSoundGate1AMergedReconciliationMatrix,
} from './sound-gate-1a-merged-reconciliation-analyzer'
import {
  SOUND_GATE_1B_ACCEPTED_JOB_TYPES,
  SOUND_GATE_1B_ACCEPTED_WORKER_NAMES,
  SOUND_GATE_1B_MERGED_MERGE_COMMIT,
  SOUND_GATE_1B_NOT_ACCEPTED_JOB_TYPES,
  SOUND_GATE_1B_OWNER_HANDOFF_SURFACES,
  loadSoundGate1BMergedSources,
} from './sound-gate-1b-merged-reconciliation-loader'
import type {
  SoundGate1BMergedCoverage,
  SoundGate1BMergedCoverageAnalysis,
  SoundGate1BMergedRecommendation,
  SoundGate1BMergedSeedRow,
} from './sound-gate-1b-merged-reconciliation-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function coverageWithWorkerRouteFlag(coverage: Omit<SoundGate1BMergedCoverage, 'hasWorkerRouteDryRun'>): SoundGate1BMergedCoverage {
  return {
    ...coverage,
    hasWorkerRouteDryRun: false,
  }
}

function assertNoWorkerRouteOrExecutionRows(rows: readonly SoundGate1BMergedSeedRow[]): void {
  const unsafeRows = rows.filter((row) => (
    row.acceptedForExecution ||
    row.workerDispatchAllowedNow ||
    row.routeExecutionAllowedNow ||
    row.toolExecutionAllowedNow ||
    row.mediaProcessingAllowedNow ||
    row.supabaseMutationAllowedNow ||
    row.sqlAllowedNow ||
    row.publicArtifactsAllowedNow ||
    row.betaProductionAllowedNow ||
    row.currentToolCallingCoverage.hasWorkerRouteDryRun
  ))
  if (unsafeRows.length > 0) {
    throw new Error(`Sound Gate 1B merged rows enabled execution or worker-route dry-run: ${unsafeRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function assertNoNewToolCallingSurfaceRows(rows: readonly SoundGate1BMergedSeedRow[]): void {
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
    throw new Error(`Sound Gate 1B worker/job/handoff rows gained tool-calling runtime coverage: ${expandedRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function buildRecommendations(rows: readonly SoundGate1BMergedSeedRow[]): SoundGate1BMergedRecommendation[] {
  const gate1CItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_gate_1c_cpu_worker_image_plan')
    .map((row) => row.normalizedItemId)
  const gate1DItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_gate_1d_worker_runtime_owner_handoff')
    .map((row) => row.normalizedItemId)
  const mediaItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_media_policy')
    .map((row) => row.normalizedItemId)
  const modelItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_model_review')
    .map((row) => row.normalizedItemId)

  return [
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-GATE-1C-EVIDENCE-OVERLAY-1',
      reason: 'Gate 1B is merged owner evidence; CPU worker image planning remains owner-gated by Gate 1C and must be reconciled before worker image metadata is consumed.',
      affectedItemIds: uniqueSorted(gate1CItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1D',
      reason: 'Worker runtime owner handoff remains required before worker execution, route execution, or job creation can be considered.',
      affectedItemIds: uniqueSorted(gate1DItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'Media file-open, pydub operations, FFmpeg/ffprobe expansion, artifact writes, and public delivery policy remain blocked.',
      affectedItemIds: uniqueSorted(mediaItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Provider/model calls, model weights, and model/provenance tools remain blocked.',
      affectedItemIds: uniqueSorted(modelItems),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-WORKER-ROUTE-DRY-RUN-1',
      reason: 'Only a later explicit milestone may add generic planning-only route metadata; this Gate 1B reconciliation adds no worker-route dry-run.',
      affectedItemIds: uniqueSorted([
        ...SOUND_GATE_1B_ACCEPTED_WORKER_NAMES,
        ...SOUND_GATE_1B_ACCEPTED_JOB_TYPES,
      ]),
    },
  ]
}

export function buildSoundGate1BMergedReconciliationMatrix(): SoundGate1BMergedSeedRow[] {
  const sourceBundle = loadSoundGate1BMergedSources()
  const gate1ARows = new Map(
    buildSoundGate1AMergedReconciliationMatrix().map((row) => [row.normalizedToolId, row]),
  )

  const rows = sourceBundle.matrixDocument.rows.map((row) => {
    if (row.itemType !== 'related_sound_tool') return row
    const gate1ARow = gate1ARows.get(row.normalizedItemId)
    if (!gate1ARow) return row

    return {
      ...row,
      relatedProductionToolIds: gate1ARow.productionToolId ? [gate1ARow.productionToolId] : row.relatedProductionToolIds,
      relatedCandidateStudyCards: gate1ARow.candidateStudyCardId ? [gate1ARow.candidateStudyCardId] : row.relatedCandidateStudyCards,
      currentToolCallingCoverage: coverageWithWorkerRouteFlag(gate1ARow.currentToolCallingCoverage),
    }
  })

  assertNoWorkerRouteOrExecutionRows(rows)
  assertNoNewToolCallingSurfaceRows(rows)

  return rows
}

export function listGate1BAcceptedWorkerNames(
  rows: readonly SoundGate1BMergedSeedRow[] = buildSoundGate1BMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'accepted_worker_name' && row.acceptedByGate1B)
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1BAcceptedJobTypes(
  rows: readonly SoundGate1BMergedSeedRow[] = buildSoundGate1BMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'accepted_job_type' && row.acceptedByGate1B)
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1BBlockedRows(
  rows: readonly SoundGate1BMergedSeedRow[] = buildSoundGate1BMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.executionGate.startsWith('blocked_'))
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1BOwnerHandoffSurfaces(
  rows: readonly SoundGate1BMergedSeedRow[] = buildSoundGate1BMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'owner_handoff_surface')
      .map((row) => row.normalizedItemId),
  )
}

export function recommendSoundGate1BNextMilestones(
  rows: readonly SoundGate1BMergedSeedRow[] = buildSoundGate1BMergedReconciliationMatrix(),
): SoundGate1BMergedRecommendation[] {
  return buildRecommendations(rows)
}

export function analyzeSoundGate1BMergedReconciliation(): SoundGate1BMergedCoverageAnalysis {
  const rows = buildSoundGate1BMergedReconciliationMatrix()
  const acceptedWorkerNames = listGate1BAcceptedWorkerNames(rows)
  const acceptedJobTypes = listGate1BAcceptedJobTypes(rows)
  const notAcceptedJobTypes = uniqueSorted(
    rows
      .filter((row) => row.itemType === 'rejected_job_type')
      .map((row) => row.normalizedItemId),
  )
  const ownerHandoffSurfaces = listGate1BOwnerHandoffSurfaces(rows)
  const blockedRows = listGate1BBlockedRows(rows)

  if (rows.length !== 58) {
    throw new Error(`Expected 58 Sound Gate 1B merged matrix rows; received ${rows.length}.`)
  }
  if (acceptedWorkerNames.length !== SOUND_GATE_1B_ACCEPTED_WORKER_NAMES.length) {
    throw new Error(`Expected ${SOUND_GATE_1B_ACCEPTED_WORKER_NAMES.length} accepted worker names; received ${acceptedWorkerNames.length}.`)
  }
  if (acceptedJobTypes.length !== SOUND_GATE_1B_ACCEPTED_JOB_TYPES.length) {
    throw new Error(`Expected ${SOUND_GATE_1B_ACCEPTED_JOB_TYPES.length} accepted job types; received ${acceptedJobTypes.length}.`)
  }
  if (notAcceptedJobTypes.length !== SOUND_GATE_1B_NOT_ACCEPTED_JOB_TYPES.length) {
    throw new Error(`Expected ${SOUND_GATE_1B_NOT_ACCEPTED_JOB_TYPES.length} rejected job types; received ${notAcceptedJobTypes.length}.`)
  }
  if (ownerHandoffSurfaces.length !== SOUND_GATE_1B_OWNER_HANDOFF_SURFACES.length) {
    throw new Error(`Expected ${SOUND_GATE_1B_OWNER_HANDOFF_SURFACES.length} owner handoff surfaces; received ${ownerHandoffSurfaces.length}.`)
  }
  if (rows.some((row) => row.mergeCommit !== SOUND_GATE_1B_MERGED_MERGE_COMMIT || !row.evidenceIsFinalSourceOfTruth)) {
    throw new Error('Every Sound Gate 1B merged row must reference the expected merged owner source evidence.')
  }

  return {
    matrixRows: rows,
    sourcePr: 653,
    mergeCommit: SOUND_GATE_1B_MERGED_MERGE_COMMIT,
    evidenceIsFinalSourceOfTruth: true,
    gate1bMatrixRows: rows.length,
    acceptedWorkerNameCount: 2,
    acceptedJobTypeCount: 4,
    notAcceptedJobTypeCount: notAcceptedJobTypes.length,
    blockedRowCount: blockedRows.length,
    ownerHandoffSurfaceCount: 9,
    relatedSoundToolCount: 23,
    productionToolIdCount: PRODUCTION_TOOL_IDS.length,
    productionToolIdCountChanged: false,
    adaptersAdded: 0,
    commandIntentsAdded: 0,
    probesAdded: 0,
    workerRouteDryRunAdded: false,
    workerExecutionPerformed: false,
    importsRun: false,
    acceptedWorkerNames,
    acceptedJobTypes,
    notAcceptedJobTypes,
    ownerHandoffSurfaces,
    blockedRows,
    recommendedNextMilestones: recommendSoundGate1BNextMilestones(rows),
    safety: {
      executesTools: false,
      importsRun: false,
      audioProcessingPerformed: false,
      mediaProcessingPerformed: false,
      workerExecutionPerformed: false,
      workerRouteDryRunAdded: false,
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
