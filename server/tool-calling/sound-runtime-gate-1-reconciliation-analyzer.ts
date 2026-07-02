import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import type {
  ProductionToolId,
} from '../tool-registry'
import {
  listToolAdapterContracts,
} from './adapter-registry'
import {
  listControlledLowRiskProbePolicies,
} from './controlled-low-risk-execution-policy'
import {
  listCommandIntentPolicies,
} from './safe-command-plan-policy'
import {
  loadSoundCandidateStudyCards,
} from './sound-candidate-study-card-loader'
import {
  buildSoundMusicAudioOwnerExpansionMatrix,
} from './sound-music-audio-owner-expansion-analyzer'
import {
  listSyntheticFixtureDefinitions,
} from './synthetic-fixture-catalog'
import {
  listExplicitToolStudyCards,
} from './tool-capability-card-loader'
import type {
  UnmergedOwnerEvidenceItem,
} from './unmerged-owner-evidence-types'
import {
  SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS,
  SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES,
  SOUND_RUNTIME_GATE_1_PLANNING_ONLY_JOB_TYPES,
  SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS,
  loadSoundRuntimeGate1Sources,
} from './sound-runtime-gate-1-reconciliation-loader'
import type {
  SoundRuntimeGate1Coverage,
  SoundRuntimeGate1CoverageAnalysis,
  SoundRuntimeGate1EvidenceStatus,
  SoundRuntimeGate1FutureOwnerPrompt,
  SoundRuntimeGate1Recommendation,
  SoundRuntimeGate1ReconciliationRow,
  SoundRuntimeGate1SeedRow,
} from './sound-runtime-gate-1-reconciliation-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function rowMatchesTool(row: Pick<SoundRuntimeGate1SeedRow, 'normalizedToolId' | 'aliasFor' | 'productionToolId' | 'candidateStudyCardId'>, toolId: string): boolean {
  return row.normalizedToolId === toolId ||
    row.aliasFor === toolId ||
    row.productionToolId === toolId ||
    row.candidateStudyCardId === toolId
}

function unmergedRefsForTool(toolId: string, evidence: readonly UnmergedOwnerEvidenceItem[]): string[] {
  return evidence
    .filter((item) => item.affectedTools.includes(toolId))
    .map((item) => `#${item.prNumber}:${item.headBranch}`)
}

function coverageForRow(
  row: SoundRuntimeGate1SeedRow,
  indexes: {
    studyToolIds: ReadonlySet<string>
    candidateCardIds: ReadonlySet<string>
    adapterToolIds: ReadonlySet<string>
    commandToolIds: ReadonlySet<string>
    fixtureToolIds: ReadonlySet<string>
    controlledProbeToolIds: ReadonlySet<string>
  },
): SoundRuntimeGate1Coverage {
  const productionToolId = row.productionToolId
  const candidateStudyCardId = row.candidateStudyCardId ?? row.aliasFor ?? row.normalizedToolId

  return {
    hasFirstClassStudyCard: row.currentToolCallingCoverage.hasFirstClassStudyCard ||
      Boolean(productionToolId && indexes.studyToolIds.has(productionToolId)),
    hasCandidateStudyCard: row.currentToolCallingCoverage.hasCandidateStudyCard ||
      indexes.candidateCardIds.has(candidateStudyCardId),
    hasAdapterContract: row.currentToolCallingCoverage.hasAdapterContract ||
      Boolean(productionToolId && indexes.adapterToolIds.has(productionToolId)),
    hasSafeCommandIntent: row.currentToolCallingCoverage.hasSafeCommandIntent ||
      Boolean(productionToolId && indexes.commandToolIds.has(productionToolId)),
    hasFixturePlan: row.currentToolCallingCoverage.hasFixturePlan ||
      Boolean(productionToolId && indexes.fixtureToolIds.has(productionToolId)),
    hasControlledProbe: row.currentToolCallingCoverage.hasControlledProbe ||
      Boolean(productionToolId && indexes.controlledProbeToolIds.has(productionToolId)),
  }
}

function mergeEvidenceStatuses(row: SoundRuntimeGate1SeedRow, coverage: SoundRuntimeGate1Coverage): SoundRuntimeGate1EvidenceStatus[] {
  const statuses: SoundRuntimeGate1EvidenceStatus[] = [...row.gate1EvidenceStatus]
  if (row.productionToolId && !statuses.includes('first_class_production_tool_id')) {
    statuses.push('first_class_production_tool_id')
  }
  if (coverage.hasCandidateStudyCard && !row.productionToolId && !statuses.includes('candidate_study_card_only')) {
    statuses.push('candidate_study_card_only')
  }

  return uniqueSorted(statuses)
}

function sourceEvidenceForRow(row: SoundRuntimeGate1SeedRow): string[] {
  const ownerRows = buildSoundMusicAudioOwnerExpansionMatrix()
  const matchingOwnerRows = ownerRows.filter((ownerRow) => (
    rowMatchesTool(row, ownerRow.normalizedToolId) ||
    ownerRow.aliases.some((alias) => rowMatchesTool(row, alias))
  ))

  return uniqueSorted([
    ...row.sourceEvidence,
    ...matchingOwnerRows.flatMap((ownerRow) => ownerRow.sourceEvidence),
  ])
}

function assertNoCandidateRuntimeExpansion(rows: readonly SoundRuntimeGate1ReconciliationRow[]): void {
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
    throw new Error(`Sound Runtime Gate 1 candidate rows gained runtime expansion: ${expandedRows.map((row) => row.normalizedToolId).join(', ')}`)
  }
}

function buildRecommendations(rows: readonly SoundRuntimeGate1ReconciliationRow[]): SoundRuntimeGate1Recommendation[] {
  const gate1ATools = rows
    .filter((row) => row.futureOwnerPrompt === 'SOUND-RUNTIME-MEDIA-GATE-1A')
    .map((row) => row.normalizedToolId)
  const gate1BTools = rows
    .filter((row) => row.futureOwnerPrompt === 'SOUND-RUNTIME-MEDIA-GATE-1B')
    .map((row) => row.normalizedToolId)
  const gate2Tools = rows
    .filter((row) => row.futureOwnerPrompt === 'SOUND-RUNTIME-MEDIA-GATE-2')
    .map((row) => row.normalizedToolId)
  const gate3Tools = rows
    .filter((row) => row.futureOwnerPrompt === 'SOUND-RUNTIME-MEDIA-GATE-3')
    .map((row) => row.normalizedToolId)

  return [
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1A',
      reason: 'Wait for controlled CPU install proof before tool-calling package-resolution or import probes for Gate 1 tools.',
      affectedToolIds: uniqueSorted(gate1ATools),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1B',
      reason: 'Wait for worker contract owner review before sound-specific worker route dry-run integration.',
      affectedToolIds: uniqueSorted(gate1BTools),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Keep model, GPU, and provenance tools blocked until owner model review clears them.',
      affectedToolIds: uniqueSorted(gate2Tools),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'Keep pydub media operations and audioread file-open blocked until media-policy owner handoff.',
      affectedToolIds: uniqueSorted(gate3Tools),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-GATE-1A-CONTROLLED-PROBE-RECONCILIATION',
      reason: 'After owner Gate 1A exists, reconcile controlled package-resolution and import probe eligibility without automatic registry promotion.',
      affectedToolIds: uniqueSorted(gate1ATools),
    },
  ]
}

export function buildSoundRuntimeGate1ReconciliationMatrix(
  unmergedOwnerEvidence: readonly UnmergedOwnerEvidenceItem[] = [],
): SoundRuntimeGate1ReconciliationRow[] {
  const sourceBundle = loadSoundRuntimeGate1Sources()
  const studyToolIds = new Set<string>(
    listExplicitToolStudyCards()
      .map((card) => card.toolId)
      .filter((toolId): toolId is ProductionToolId => Boolean(toolId)),
  )
  const candidateCardIds = new Set<string>(loadSoundCandidateStudyCards().map((card) => card.externalToolId))
  const adapterToolIds = new Set<string>(listToolAdapterContracts().map((contract) => contract.toolId))
  const commandToolIds = new Set<string>(listCommandIntentPolicies().map((policy) => policy.toolId))
  const fixtureToolIds = new Set<string>(listSyntheticFixtureDefinitions().flatMap((fixture) => fixture.applicableToolIds))
  const controlledProbeToolIds = new Set<string>(listControlledLowRiskProbePolicies().map((policy) => policy.toolId))
  const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)

  const rows = sourceBundle.matrixDocument.rows.map((row) => {
    const coverage = coverageForRow(row, {
      studyToolIds,
      candidateCardIds,
      adapterToolIds,
      commandToolIds,
      fixtureToolIds,
      controlledProbeToolIds,
    })
    const productionToolId = row.productionToolId && productionToolIds.has(row.productionToolId)
      ? row.productionToolId
      : row.productionToolId

    return {
      ...row,
      productionToolId,
      candidateStudyCardId: row.candidateStudyCardId && candidateCardIds.has(row.candidateStudyCardId)
        ? row.candidateStudyCardId
        : row.candidateStudyCardId,
      gate1EvidenceStatus: mergeEvidenceStatuses(row, coverage),
      sourceEvidence: sourceEvidenceForRow(row),
      currentToolCallingCoverage: coverage,
      selectableAsRuntimeTool: Boolean(productionToolId) && row.selectableAsRuntimeTool,
      unmergedOwnerEvidenceRefs: uniqueSorted(unmergedRefsForTool(row.normalizedToolId, unmergedOwnerEvidence)),
    }
  })

  assertNoCandidateRuntimeExpansion(rows)

  return rows
}

export function listGate1DirectPinnedPackages(
  rows: readonly SoundRuntimeGate1ReconciliationRow[] = buildSoundRuntimeGate1ReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.gate1EvidenceStatus.includes('direct_pinned_package'))
      .map((row) => row.normalizedToolId),
  )
}

export function listGate1AliasCoveredTools(
  rows: readonly SoundRuntimeGate1ReconciliationRow[] = buildSoundRuntimeGate1ReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.gate1EvidenceStatus.includes('alias_covered_tool'))
      .map((row) => row.normalizedToolId),
  )
}

export function listGate1BlockedTools(
  rows: readonly SoundRuntimeGate1ReconciliationRow[] = buildSoundRuntimeGate1ReconciliationMatrix(),
): string[] {
  return uniqueSorted(
    rows
      .filter((row) => row.executionGate.startsWith('blocked_'))
      .map((row) => row.normalizedToolId),
  )
}

export function listGate1FutureOwnerPrompts(
  rows: readonly SoundRuntimeGate1ReconciliationRow[] = buildSoundRuntimeGate1ReconciliationMatrix(),
): SoundRuntimeGate1FutureOwnerPrompt[] {
  return uniqueSorted(
    rows
      .map((row) => row.futureOwnerPrompt)
      .filter((prompt): prompt is Exclude<SoundRuntimeGate1FutureOwnerPrompt, 'none'> => prompt !== 'none'),
  )
}

export function recommendSoundRuntimeGate1NextMilestones(
  rows: readonly SoundRuntimeGate1ReconciliationRow[] = buildSoundRuntimeGate1ReconciliationMatrix(),
): SoundRuntimeGate1Recommendation[] {
  return buildRecommendations(rows)
}

export function analyzeSoundRuntimeGate1Coverage(): SoundRuntimeGate1CoverageAnalysis {
  const rows = buildSoundRuntimeGate1ReconciliationMatrix()
  const directPinnedPackages = listGate1DirectPinnedPackages(rows)
  const aliasCoveredTools = listGate1AliasCoveredTools(rows)
  const blockedTools = listGate1BlockedTools(rows)
  const nonFirstClassRows = rows.filter((row) => !row.productionToolId)
  const adaptersAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasAdapterContract).length
  const commandIntentsAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasSafeCommandIntent).length
  const probesAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasControlledProbe).length

  if (directPinnedPackages.length !== SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.length) {
    throw new Error(`Expected ${SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.length} direct pinned packages; received ${directPinnedPackages.length}.`)
  }
  if (aliasCoveredTools.length !== SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS.length) {
    throw new Error(`Expected ${SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS.length} alias-covered tools; received ${aliasCoveredTools.length}.`)
  }
  if (adaptersAdded !== 0 || commandIntentsAdded !== 0 || probesAdded !== 0) {
    throw new Error('Sound Runtime Gate 1 must not add adapters, command intents, or probes for candidate-only rows.')
  }

  return {
    matrixRows: rows,
    gate1MatrixRows: rows.length,
    directPinnedPackageCount: 13,
    aliasCoveredToolCount: 2,
    cpuInstallCandidateCount: 15,
    planningOnlyWorkerCount: rows.filter((row) => SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS.includes(row.normalizedToolId as typeof SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS[number])).length,
    planningOnlyJobTypeCount: rows.filter((row) => SOUND_RUNTIME_GATE_1_PLANNING_ONLY_JOB_TYPES.includes(row.normalizedToolId as typeof SOUND_RUNTIME_GATE_1_PLANNING_ONLY_JOB_TYPES[number])).length,
    firstClassCoveredCount: rows.filter((row) => Boolean(row.productionToolId)).length,
    candidateOnlyCount: rows.filter((row) => !row.productionToolId && row.currentToolCallingCoverage.hasCandidateStudyCard).length,
    blockedCount: blockedTools.length,
    productionToolIdCount: PRODUCTION_TOOL_IDS.length,
    productionToolIdCountChanged: false,
    adaptersAdded: 0,
    commandIntentsAdded: 0,
    probesAdded: 0,
    directPinnedPackages,
    aliasCoveredTools,
    blockedTools,
    futureOwnerPrompts: listGate1FutureOwnerPrompts(rows),
    recommendedNextMilestones: recommendSoundRuntimeGate1NextMilestones(rows),
    safety: {
      executesTools: false,
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
