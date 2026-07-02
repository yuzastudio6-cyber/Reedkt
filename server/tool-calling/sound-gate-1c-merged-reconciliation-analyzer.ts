import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  buildSoundGate1BMergedReconciliationMatrix,
} from './sound-gate-1b-merged-reconciliation-analyzer'
import {
  SOUND_GATE_1C_DOC_SURFACES,
  SOUND_GATE_1C_MERGED_MERGE_COMMIT,
  SOUND_GATE_1C_NEXT_PROMPTS,
  SOUND_GATE_1C_PLANNED_IMAGE_NAMES,
  SOUND_GATE_1C_PRESERVED_JOB_TYPES,
  SOUND_GATE_1C_PRESERVED_WORKER_NAMES,
  expandSoundGate1CMergedRow,
  loadSoundGate1CMergedSources,
} from './sound-gate-1c-merged-reconciliation-loader'
import type {
  SoundGate1CMergedCoverageAnalysis,
  SoundGate1CMergedRecommendation,
  SoundGate1CMergedRow,
} from './sound-gate-1c-merged-reconciliation-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function assertNoBuildDeployOrExecutionRows(rows: readonly SoundGate1CMergedRow[]): void {
  const unsafeRows = rows.filter((row) => (
    row.acceptedForExecution ||
    row.imageBuildAllowedNow ||
    row.dockerfileMutationAllowedNow ||
    row.gcpCallAllowedNow ||
    row.cloudRunAllowedNow ||
    row.serviceAccountAllowedNow ||
    row.secretManagerAllowedNow ||
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
    throw new Error(`Sound Gate 1C merged rows enabled build, deploy, execution, mutation, or worker-route dry-run: ${unsafeRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function assertNoNewToolCallingSurfaceRows(rows: readonly SoundGate1CMergedRow[]): void {
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
    throw new Error(`Sound Gate 1C image/worker/job/doc rows gained tool-calling runtime coverage: ${expandedRows.map((row) => row.normalizedItemId).join(', ')}`)
  }
}

function buildRecommendations(rows: readonly SoundGate1CMergedRow[]): SoundGate1CMergedRecommendation[] {
  const gate1DItems = rows
    .filter((row) => row.executionGate === 'blocked_pending_gate_1d_worker_runtime_owner_handoff')
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
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-GATE-1D-EVIDENCE-OVERLAY-1',
      reason: 'Gate 1C is merged owner evidence for CPU worker image planning; worker runtime owner handoff remains required before Sound worker route or execution planning.',
      affectedItemIds: uniqueSorted(gate1DItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1E',
      reason: 'Dockerfile static planning remains an owner-lane follow-up; this reconciliation records image names only and adds no Dockerfile or image build plan.',
      affectedItemIds: uniqueSorted(gate1EItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'Media file-open, pydub operations, audioread file-open, FFmpeg/ffprobe expansion, and artifact/public delivery policy remain blocked.',
      affectedItemIds: uniqueSorted(mediaItems),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Model, GPU, provenance, provider, and model-weight scopes remain blocked.',
      affectedItemIds: uniqueSorted(modelItems),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-WORKER-ROUTE-DRY-RUN-1',
      reason: 'Generic planning-only worker-route dry-run may be considered only as a separate milestone and must not execute Sound workers.',
      affectedItemIds: uniqueSorted([
        ...SOUND_GATE_1C_PRESERVED_WORKER_NAMES,
        ...SOUND_GATE_1C_PRESERVED_JOB_TYPES,
      ]),
    },
  ]
}

export function buildSoundGate1CMergedReconciliationMatrix(): SoundGate1CMergedRow[] {
  const sourceBundle = loadSoundGate1CMergedSources()
  const gate1BRows = new Map(
    buildSoundGate1BMergedReconciliationMatrix().map((row) => [row.normalizedItemId, row]),
  )

  const rows = sourceBundle.matrixDocument.rows.map((row) => {
    const expandedRow = expandSoundGate1CMergedRow(row)
    if (expandedRow.itemType !== 'related_sound_tool') return expandedRow

    const gate1BRow = gate1BRows.get(expandedRow.normalizedItemId)
    if (!gate1BRow) return expandedRow

    return {
      ...expandedRow,
      relatedProductionToolIds: gate1BRow.relatedProductionToolIds,
      relatedCandidateStudyCards: gate1BRow.relatedCandidateStudyCards,
      currentToolCallingCoverage: gate1BRow.currentToolCallingCoverage,
    }
  })

  assertNoBuildDeployOrExecutionRows(rows)
  assertNoNewToolCallingSurfaceRows(rows)

  return rows
}

export function listGate1CPlannedImageNames(
  rows: readonly SoundGate1CMergedRow[] = buildSoundGate1CMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'planned_image_name' && row.acceptedByGate1C)
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1CPreservedWorkerNames(
  rows: readonly SoundGate1CMergedRow[] = buildSoundGate1CMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'preserved_worker_name' && row.acceptedByGate1C)
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1CPreservedJobTypes(
  rows: readonly SoundGate1CMergedRow[] = buildSoundGate1CMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'preserved_job_type' && row.acceptedByGate1C)
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1CBlockedRows(
  rows: readonly SoundGate1CMergedRow[] = buildSoundGate1CMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.executionGate.startsWith('blocked_'))
      .map((row) => row.normalizedItemId),
  )
}

export function listGate1CDocSurfaces(
  rows: readonly SoundGate1CMergedRow[] = buildSoundGate1CMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.itemType === 'gate_1c_doc_surface')
      .map((row) => row.normalizedItemId),
  )
}

export function recommendSoundGate1CNextMilestones(
  rows: readonly SoundGate1CMergedRow[] = buildSoundGate1CMergedReconciliationMatrix(),
): SoundGate1CMergedRecommendation[] {
  return buildRecommendations(rows)
}

export function analyzeSoundGate1CMergedReconciliation(): SoundGate1CMergedCoverageAnalysis {
  const rows = buildSoundGate1CMergedReconciliationMatrix()
  const plannedImageNames = listGate1CPlannedImageNames(rows)
  const preservedWorkerNames = listGate1CPreservedWorkerNames(rows)
  const preservedJobTypes = listGate1CPreservedJobTypes(rows)
  const docSurfaces = listGate1CDocSurfaces(rows)
  const blockedRows = listGate1CBlockedRows(rows)
  const nextPrompts = uniqueSorted(
    rows
      .filter((row) => row.itemType === 'gate_1d_next_prompt' || row.itemType === 'gate_1e_next_prompt')
      .map((row) => row.normalizedItemId),
  )
  const relatedSoundToolCount = rows.filter((row) => row.itemType === 'related_sound_tool').length

  if (rows.length !== 65) {
    throw new Error(`Expected 65 Sound Gate 1C merged matrix rows; received ${rows.length}.`)
  }
  if (plannedImageNames.length !== SOUND_GATE_1C_PLANNED_IMAGE_NAMES.length) {
    throw new Error(`Expected ${SOUND_GATE_1C_PLANNED_IMAGE_NAMES.length} planned image names; received ${plannedImageNames.length}.`)
  }
  if (preservedWorkerNames.length !== SOUND_GATE_1C_PRESERVED_WORKER_NAMES.length) {
    throw new Error(`Expected ${SOUND_GATE_1C_PRESERVED_WORKER_NAMES.length} preserved worker names; received ${preservedWorkerNames.length}.`)
  }
  if (preservedJobTypes.length !== SOUND_GATE_1C_PRESERVED_JOB_TYPES.length) {
    throw new Error(`Expected ${SOUND_GATE_1C_PRESERVED_JOB_TYPES.length} preserved job types; received ${preservedJobTypes.length}.`)
  }
  if (docSurfaces.length !== SOUND_GATE_1C_DOC_SURFACES.length) {
    throw new Error(`Expected ${SOUND_GATE_1C_DOC_SURFACES.length} Gate 1C doc surfaces; received ${docSurfaces.length}.`)
  }
  if (nextPrompts.length !== SOUND_GATE_1C_NEXT_PROMPTS.length) {
    throw new Error(`Expected ${SOUND_GATE_1C_NEXT_PROMPTS.length} Gate 1C next prompts; received ${nextPrompts.length}.`)
  }
  if (relatedSoundToolCount !== 23) {
    throw new Error(`Expected 23 related Sound tool rows; received ${relatedSoundToolCount}.`)
  }
  if (rows.some((row) => row.mergeCommit !== SOUND_GATE_1C_MERGED_MERGE_COMMIT || !row.evidenceIsFinalSourceOfTruth)) {
    throw new Error('Every Sound Gate 1C merged row must reference the expected merged owner source evidence.')
  }

  return {
    matrixRows: rows,
    sourcePr: 660,
    mergeCommit: SOUND_GATE_1C_MERGED_MERGE_COMMIT,
    evidenceIsFinalSourceOfTruth: true,
    gate1cMatrixRows: rows.length,
    plannedImageNameCount: 2,
    preservedWorkerNameCount: 2,
    preservedJobTypeCount: 4,
    docSurfaceCount: 6,
    blockedRowCount: blockedRows.length,
    relatedSoundToolCount: 23,
    nextPromptCount: 2,
    productionToolIdCount: PRODUCTION_TOOL_IDS.length,
    productionToolIdCountChanged: false,
    adaptersAdded: 0,
    commandIntentsAdded: 0,
    probesAdded: 0,
    workerRouteDryRunAdded: false,
    workerExecutionPerformed: false,
    imageBuildsPerformed: false,
    dockerfilesAdded: false,
    dockerActionPerformed: false,
    gcpActionPerformed: false,
    cloudRunActionPerformed: false,
    importsRun: false,
    plannedImageNames,
    preservedWorkerNames,
    preservedJobTypes,
    docSurfaces,
    blockedRows,
    nextPrompts,
    recommendedNextMilestones: recommendSoundGate1CNextMilestones(rows),
    safety: {
      executesTools: false,
      importsRun: false,
      audioProcessingPerformed: false,
      mediaProcessingPerformed: false,
      workerExecutionPerformed: false,
      workerRouteDryRunAdded: false,
      imageBuildsPerformed: false,
      dockerActionPerformed: false,
      gcpActionPerformed: false,
      cloudRunActionPerformed: false,
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
