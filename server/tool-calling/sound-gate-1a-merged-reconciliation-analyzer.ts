import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS,
  SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES,
} from './sound-runtime-gate-1-reconciliation-loader'
import {
  buildSoundRuntimeGate1ReconciliationMatrix,
} from './sound-runtime-gate-1-reconciliation-analyzer'
import {
  SOUND_GATE_1A_MERGED_MERGE_COMMIT,
  loadSoundGate1AMergedSources,
} from './sound-gate-1a-merged-reconciliation-loader'
import type {
  SoundGate1AMergedCoverageAnalysis,
  SoundGate1AMergedRecommendation,
  SoundGate1AMergedReconciliationRow,
} from './sound-gate-1a-merged-reconciliation-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function assertNoCandidateRuntimeExpansion(rows: readonly SoundGate1AMergedReconciliationRow[]): void {
  const expandedRows = rows.filter((row) => (
    !row.productionToolId &&
    (
      row.selectableAsRuntimeTool ||
      row.currentToolCallingCoverage.hasAdapterContract ||
      row.currentToolCallingCoverage.hasSafeCommandIntent ||
      row.currentToolCallingCoverage.hasFixturePlan ||
      row.currentToolCallingCoverage.hasControlledProbe
    )
  ))
  if (expandedRows.length > 0) {
    throw new Error(`Sound Gate 1A merged candidate rows gained runtime expansion: ${expandedRows.map((row) => row.normalizedToolId).join(', ')}`)
  }
}

function assertNoToolCallingImportProbe(rows: readonly SoundGate1AMergedReconciliationRow[]): void {
  const importProbeRows = rows.filter((row) => (
    row.currentToolCallingCoverage.hasControlledProbe &&
    row.futureOwnerPrompt === 'SOUND-RUNTIME-MEDIA-GATE-1A'
  ))
  if (importProbeRows.length > 0) {
    throw new Error(`Sound Gate 1A merged reconciliation must not add import probes: ${importProbeRows.map((row) => row.normalizedToolId).join(', ')}`)
  }
}

function buildRecommendations(rows: readonly SoundGate1AMergedReconciliationRow[]): SoundGate1AMergedRecommendation[] {
  const gate1BTools = rows
    .filter((row) => row.futureOwnerPrompt === 'SOUND-RUNTIME-MEDIA-GATE-1B')
    .map((row) => row.normalizedToolId)
  const gate1AImportPlanningTools = rows
    .filter((row) => row.toolCallingPendingAction === 'future_controlled_import_probe_planning')
    .map((row) => row.normalizedToolId)
  const gate2Tools = rows
    .filter((row) => row.futureOwnerPrompt === 'SOUND-RUNTIME-MEDIA-GATE-2')
    .map((row) => row.normalizedToolId)
  const gate3Tools = rows
    .filter((row) => row.futureOwnerPrompt === 'SOUND-RUNTIME-MEDIA-GATE-3')
    .map((row) => row.normalizedToolId)

  return [
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-GATE-1B-WORKER-CONTRACT-RECONCILIATION-1',
      reason: 'Gate 1A merged owner proof is now recorded; worker and job surfaces still require Gate 1B contract reconciliation before any worker-route planning.',
      affectedToolIds: uniqueSorted(gate1BTools),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-GATE-1A-MERGED-IMPORT-PROBE-PLANNING-1',
      reason: 'Future import probe planning can be considered only as a separate milestone; this reconciliation records merged proof and runs no imports.',
      affectedToolIds: uniqueSorted(gate1AImportPlanningTools),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Model, GPU, and provenance-sensitive Sound tools remain blocked even after Gate 1A merged.',
      affectedToolIds: uniqueSorted(gate2Tools),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'pydub media operations and audioread file-open remain blocked pending media-policy handoff.',
      affectedToolIds: uniqueSorted(gate3Tools),
    },
  ]
}

export function buildSoundGate1AMergedReconciliationMatrix(): SoundGate1AMergedReconciliationRow[] {
  const sourceBundle = loadSoundGate1AMergedSources()
  const gate1Rows = new Map(
    buildSoundRuntimeGate1ReconciliationMatrix().map((row) => [row.normalizedToolId, row]),
  )
  const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)

  const rows = sourceBundle.matrixDocument.rows.map((row) => {
    const gate1Row = gate1Rows.get(row.normalizedToolId)
    const currentToolCallingCoverage = gate1Row?.currentToolCallingCoverage ?? row.currentToolCallingCoverage
    const productionToolId = row.productionToolId && productionToolIds.has(row.productionToolId)
      ? row.productionToolId
      : row.productionToolId

    return {
      ...row,
      currentToolCallingCoverage,
      productionToolId,
      selectableAsRuntimeTool: Boolean(productionToolId) && row.selectableAsRuntimeTool,
      gate1RuntimeCoverageMatched: Boolean(gate1Row),
    }
  })

  assertNoCandidateRuntimeExpansion(rows)
  assertNoToolCallingImportProbe(rows)

  return rows
}

export function listGate1AMergedEvidenceRows(
  rows: readonly SoundGate1AMergedReconciliationRow[] = buildSoundGate1AMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.gate1aEvidenceStatus.includes('merged_owner_source_evidence'))
      .map((row) => row.normalizedToolId),
  )
}

export function listGate1ABlockedRows(
  rows: readonly SoundGate1AMergedReconciliationRow[] = buildSoundGate1AMergedReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.executionGate.startsWith('blocked_'))
      .map((row) => row.normalizedToolId),
  )
}

export function recommendSoundGate1AMergedNextMilestones(
  rows: readonly SoundGate1AMergedReconciliationRow[] = buildSoundGate1AMergedReconciliationMatrix(),
): SoundGate1AMergedRecommendation[] {
  return buildRecommendations(rows)
}

export function analyzeSoundGate1AMergedReconciliation(): SoundGate1AMergedCoverageAnalysis {
  const rows = buildSoundGate1AMergedReconciliationMatrix()
  const directPinnedPackages = uniqueSorted(
    rows
      .filter((row) => row.gate1EvidenceStatus.includes('direct_pinned_package'))
      .map((row) => row.normalizedToolId),
  )
  const aliasCoveredTools = uniqueSorted(
    rows
      .filter((row) => row.gate1EvidenceStatus.includes('alias_covered_tool'))
      .map((row) => row.normalizedToolId),
  )
  const blockedRows = listGate1ABlockedRows(rows)
  const nonFirstClassRows = rows.filter((row) => !row.productionToolId)
  const adaptersAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasAdapterContract).length
  const commandIntentsAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasSafeCommandIntent).length
  const probesAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasControlledProbe).length

  if (rows.length !== 29) {
    throw new Error(`Expected 29 Sound Gate 1A merged matrix rows; received ${rows.length}.`)
  }
  if (directPinnedPackages.length !== SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.length) {
    throw new Error(`Expected ${SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.length} direct pinned packages; received ${directPinnedPackages.length}.`)
  }
  if (aliasCoveredTools.length !== SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS.length) {
    throw new Error(`Expected ${SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS.length} alias-covered tools; received ${aliasCoveredTools.length}.`)
  }
  if (adaptersAdded !== 0 || commandIntentsAdded !== 0 || probesAdded !== 0) {
    throw new Error('Sound Gate 1A merged reconciliation must not add adapters, command intents, or probes for candidate-only rows.')
  }
  if (rows.some((row) => row.mergeCommit !== SOUND_GATE_1A_MERGED_MERGE_COMMIT || !row.evidenceIsFinalSourceOfTruth)) {
    throw new Error('Every Sound Gate 1A merged row must reference the expected merged owner source evidence.')
  }

  return {
    matrixRows: rows,
    sourcePr: 647,
    mergeCommit: SOUND_GATE_1A_MERGED_MERGE_COMMIT,
    evidenceIsFinalSourceOfTruth: true,
    gate1aMatrixRows: 29,
    directPinnedPackageCount: 13,
    aliasCoveredToolCount: 2,
    mergedEvidenceRowCount: listGate1AMergedEvidenceRows(rows).length,
    blockedRowCount: blockedRows.length,
    firstClassCoveredCount: rows.filter((row) => Boolean(row.productionToolId)).length,
    candidateOnlyCount: rows.filter((row) => !row.productionToolId && row.currentToolCallingCoverage.hasCandidateStudyCard).length,
    productionToolIdCount: PRODUCTION_TOOL_IDS.length,
    productionToolIdCountChanged: false,
    adaptersAdded: 0,
    commandIntentsAdded: 0,
    probesAdded: 0,
    importsRun: false,
    directPinnedPackages,
    aliasCoveredTools,
    blockedRows,
    recommendedNextMilestones: recommendSoundGate1AMergedNextMilestones(rows),
    safety: {
      executesTools: false,
      importsRun: false,
      audioProcessingPerformed: false,
      mediaProcessingPerformed: false,
      workerExecutionPerformed: false,
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
