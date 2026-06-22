import {
  execFileSync,
} from 'node:child_process'
import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES,
} from './sound-runtime-gate-1-reconciliation-loader'
import {
  buildSoundRuntimeGate1ReconciliationMatrix,
} from './sound-runtime-gate-1-reconciliation-analyzer'
import {
  loadSoundGate1AEvidenceSources,
} from './sound-gate-1a-evidence-overlay-loader'
import type {
  SoundGate1AEvidenceOverlayAnalysis,
  SoundGate1AEvidenceOverlayRow,
  SoundGate1AEvidenceStatus,
  SoundGate1APr647Status,
  SoundGate1APrState,
  SoundGate1ARecommendation,
  SoundGate1AEvidenceSeedRow,
} from './sound-gate-1a-evidence-overlay-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function childEnvWithoutDeveloperDir(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  return env
}

function normalizePrState(value: unknown, mergedAt: unknown): SoundGate1APrState {
  if (typeof mergedAt === 'string' && mergedAt.length > 0) return 'merged'
  if (typeof value !== 'string') return 'unknown'
  const normalized = value.toLowerCase()
  if (normalized === 'open') return 'open'
  if (normalized === 'closed') return 'closed'

  return 'unknown'
}

export function getSoundGate1APr647StatusFromGithub(): SoundGate1APr647Status {
  try {
    const output = execFileSync('gh', [
      'pr',
      'view',
      '647',
      '--json',
      'number,state,isDraft,mergedAt,mergeStateStatus,title,headRefName,baseRefName,url',
    ], {
      cwd: process.cwd(),
      env: childEnvWithoutDeveloperDir(),
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    })
    const parsed = JSON.parse(output) as {
      number?: number
      state?: string
      isDraft?: boolean
      mergedAt?: string | null
      mergeStateStatus?: string | null
      url?: string | null
    }
    const merged = typeof parsed.mergedAt === 'string' && parsed.mergedAt.length > 0
    const prState = normalizePrState(parsed.state, parsed.mergedAt)

    return {
      githubPrScanAvailable: true,
      pr647Found: parsed.number === 647,
      pr647State: prState,
      pr647Draft: typeof parsed.isDraft === 'boolean' ? parsed.isDraft : null,
      pr647Merged: merged,
      pr647Mergeable: parsed.mergeStateStatus ?? null,
      pr647Url: parsed.url ?? null,
      evidenceIsFinalSourceOfTruth: merged,
      scanError: null,
    }
  } catch (error) {
    return {
      githubPrScanAvailable: false,
      pr647Found: false,
      pr647State: 'unknown',
      pr647Draft: null,
      pr647Merged: false,
      pr647Mergeable: null,
      pr647Url: null,
      evidenceIsFinalSourceOfTruth: false,
      scanError: error instanceof Error ? error.message : String(error),
    }
  }
}

function statusesForPrStatus(row: SoundGate1AEvidenceSeedRow, prStatus: SoundGate1APr647Status): SoundGate1AEvidenceStatus[] {
  const statuses: SoundGate1AEvidenceStatus[] = []
  if (prStatus.evidenceIsFinalSourceOfTruth) {
    statuses.push('merged_owner_source_evidence')
  } else if (prStatus.pr647State === 'closed') {
    statuses.push('failed_or_rejected_evidence')
  } else if (row.gate1aEvidenceStatus.includes('open_pr_candidate_evidence') || !prStatus.githubPrScanAvailable) {
    statuses.push('open_pr_candidate_evidence')
  } else {
    statuses.push('unknown')
  }
  if (row.gate1aEvidenceStatus.includes('blocked_by_owner_gate')) {
    statuses.push('blocked_by_owner_gate')
  }

  return uniqueSorted(statuses)
}

function mergedImportCandidate(row: SoundGate1AEvidenceSeedRow): boolean {
  return (
    SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES.includes(row.normalizedToolId as typeof SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES[number]) ||
    row.normalizedToolId === 'ebu_r128_pyloudnorm' ||
    row.normalizedToolId === 'signalsmith_stretch'
  ) &&
  row.normalizedToolId !== 'audioread' &&
  row.normalizedToolId !== 'pydub'
}

function executionGateFor(row: SoundGate1AEvidenceSeedRow, prStatus: SoundGate1APr647Status): SoundGate1AEvidenceSeedRow['executionGate'] {
  if (row.executionGate === 'blocked_pending_media_policy') return 'blocked_pending_media_policy'
  if (row.executionGate === 'blocked_pending_model_review') return 'blocked_pending_model_review'
  if (row.executionGate === 'blocked_pending_gate_1b_worker_contract_review') return 'blocked_pending_gate_1b_worker_contract_review'
  if (row.executionGate === 'blocked_no_execution') return 'blocked_no_execution'
  if (prStatus.evidenceIsFinalSourceOfTruth && mergedImportCandidate(row)) return 'planning_only'
  if (mergedImportCandidate(row)) return 'blocked_unmerged_gate_1a_candidate_only'

  return row.executionGate
}

function pendingActionFor(row: SoundGate1AEvidenceSeedRow, prStatus: SoundGate1APr647Status): SoundGate1AEvidenceSeedRow['toolCallingPendingAction'] {
  const gate = executionGateFor(row, prStatus)
  if (gate === 'blocked_pending_media_policy') return 'wait_for_media_policy_handoff'
  if (gate === 'blocked_pending_model_review') return 'wait_for_model_weight_review'
  if (gate === 'blocked_pending_gate_1b_worker_contract_review') return 'wait_for_gate_1b_worker_contract_review'
  if (gate === 'blocked_unmerged_gate_1a_candidate_only') return 'wait_for_gate_1a_merge'
  if (prStatus.evidenceIsFinalSourceOfTruth && gate === 'planning_only' && mergedImportCandidate(row)) {
    return row.productionToolId ? 'future_controlled_import_probe_reconciliation' : 'future_registry_expansion_after_owner_merge'
  }

  return row.toolCallingPendingAction
}

function sourceEvidenceFor(row: SoundGate1AEvidenceSeedRow, prStatus: SoundGate1APr647Status): string[] {
  const evidence = [...row.sourceEvidence]
  if (prStatus.pr647Url) evidence.push('PR #647 live GitHub metadata')
  if (!prStatus.githubPrScanAvailable) evidence.push('PR #647 GitHub metadata unavailable in local diagnostics')

  return uniqueSorted(evidence)
}

function rowWithLiveCoverage(row: SoundGate1AEvidenceSeedRow, prStatus: SoundGate1APr647Status): SoundGate1AEvidenceOverlayRow {
  const gate1Rows = buildSoundRuntimeGate1ReconciliationMatrix()
  const gate1Row = gate1Rows.find((candidate) => candidate.normalizedToolId === row.normalizedToolId)
  const coverage = gate1Row?.currentToolCallingCoverage ?? row.currentToolCallingCoverage
  const executionGate = executionGateFor(row, prStatus)

  return {
    ...row,
    gate1aEvidenceStatus: statusesForPrStatus(row, prStatus),
    prState: prStatus.pr647State,
    draft: prStatus.pr647Draft,
    mergeable: prStatus.pr647Mergeable,
    evidenceIsFinalSourceOfTruth: prStatus.evidenceIsFinalSourceOfTruth,
    sourceEvidence: sourceEvidenceFor(row, prStatus),
    currentToolCallingCoverage: coverage,
    selectableAsRuntimeTool: Boolean(row.productionToolId) && row.selectableAsRuntimeTool,
    executionGate,
    toolCallingPendingAction: pendingActionFor(row, prStatus),
    duplicateRisk: prStatus.evidenceIsFinalSourceOfTruth ? row.duplicateRisk : 'wait_for_owner_merge',
    githubPrScanAvailable: prStatus.githubPrScanAvailable,
    pr647Found: prStatus.pr647Found,
    pr647Merged: prStatus.pr647Merged,
    pr647Url: prStatus.pr647Url,
  }
}

function assertNoCandidateRuntimeExpansion(rows: readonly SoundGate1AEvidenceOverlayRow[]): void {
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
    throw new Error(`Sound Gate 1A candidate rows gained runtime expansion: ${expandedRows.map((row) => row.normalizedToolId).join(', ')}`)
  }
}

export function buildSoundGate1AEvidenceOverlayMatrix(
  prStatus: SoundGate1APr647Status = getSoundGate1APr647StatusFromGithub(),
): SoundGate1AEvidenceOverlayRow[] {
  const sourceBundle = loadSoundGate1AEvidenceSources()
  const rows = sourceBundle.matrixDocument.rows.map((row) => rowWithLiveCoverage(row, prStatus))
  assertNoCandidateRuntimeExpansion(rows)

  return rows
}

export function listGate1ACandidateEvidenceRows(
  rows: readonly SoundGate1AEvidenceOverlayRow[] = buildSoundGate1AEvidenceOverlayMatrix(),
): SoundGate1AEvidenceOverlayRow[] {
  return rows.filter((row) => row.gate1aEvidenceStatus.includes('open_pr_candidate_evidence') && !row.evidenceIsFinalSourceOfTruth)
}

export function listGate1AMergedEvidenceRows(
  rows: readonly SoundGate1AEvidenceOverlayRow[] = buildSoundGate1AEvidenceOverlayMatrix(),
): SoundGate1AEvidenceOverlayRow[] {
  return rows.filter((row) => row.gate1aEvidenceStatus.includes('merged_owner_source_evidence') && row.evidenceIsFinalSourceOfTruth)
}

export function listGate1ABlockedRows(
  rows: readonly SoundGate1AEvidenceOverlayRow[] = buildSoundGate1AEvidenceOverlayMatrix(),
): SoundGate1AEvidenceOverlayRow[] {
  return rows.filter((row) => row.executionGate.startsWith('blocked_'))
}

export function recommendSoundGate1ANextMilestones(
  rows: readonly SoundGate1AEvidenceOverlayRow[] = buildSoundGate1AEvidenceOverlayMatrix(),
): SoundGate1ARecommendation[] {
  const merged = rows.some((row) => row.evidenceIsFinalSourceOfTruth)
  const importCandidates = rows
    .filter((row) => row.toolCallingPendingAction === 'future_controlled_import_probe_reconciliation' || row.toolCallingPendingAction === 'future_registry_expansion_after_owner_merge' || row.toolCallingPendingAction === 'wait_for_gate_1a_merge')
    .map((row) => row.normalizedToolId)
  const workerRows = rows
    .filter((row) => row.toolCallingPendingAction === 'wait_for_gate_1b_worker_contract_review')
    .map((row) => row.normalizedToolId)

  if (!merged) {
    return [
      {
        milestone: 'REEDITPRO-TOOL-CALLING-SOUND-GATE-1A-MERGE-RECONCILIATION-1',
        reason: 'Wait for PR #647 to merge before treating Gate 1A install/import proof as source-of-truth.',
        affectedToolIds: uniqueSorted(importCandidates),
      },
      {
        milestone: 'SOUND-RUNTIME-MEDIA-GATE-1B',
        reason: 'Worker contract owner review remains required before worker route dry-run integration.',
        affectedToolIds: uniqueSorted(workerRows),
      },
    ]
  }

  return [
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-GATE-1A-MERGED-IMPORT-PROBE-PLANNING-1',
      reason: 'Gate 1A merged evidence can be reconciled into future planning for controlled import probes without adding execution here.',
      affectedToolIds: uniqueSorted(importCandidates),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-GATE-1B-WORKER-CONTRACT-RECONCILIATION-1',
      reason: 'Worker route integration should wait for owner Gate 1B contract evidence.',
      affectedToolIds: uniqueSorted(workerRows),
    },
  ]
}

export function analyzeSoundGate1AEvidenceOverlay(
  prStatus: SoundGate1APr647Status = getSoundGate1APr647StatusFromGithub(),
): SoundGate1AEvidenceOverlayAnalysis {
  const rows = buildSoundGate1AEvidenceOverlayMatrix(prStatus)
  const nonFirstClassRows = rows.filter((row) => !row.productionToolId)
  const adaptersAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasAdapterContract).length
  const commandIntentsAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasSafeCommandIntent).length
  const probesAdded = nonFirstClassRows.filter((row) => row.currentToolCallingCoverage.hasControlledProbe).length
  if (adaptersAdded !== 0 || commandIntentsAdded !== 0 || probesAdded !== 0) {
    throw new Error('Sound Gate 1A evidence overlay must not add adapters, command intents, or probes.')
  }

  return {
    matrixRows: rows,
    gate1aMatrixRows: rows.length,
    pr647Found: prStatus.pr647Found,
    pr647State: prStatus.pr647State,
    pr647Draft: prStatus.pr647Draft,
    pr647Merged: prStatus.pr647Merged,
    evidenceIsFinalSourceOfTruth: prStatus.evidenceIsFinalSourceOfTruth,
    directPinnedPackageCount: 13,
    aliasCoveredToolCount: 2,
    candidateEvidenceCount: listGate1ACandidateEvidenceRows(rows).length,
    mergedEvidenceCount: listGate1AMergedEvidenceRows(rows).length,
    blockedCount: listGate1ABlockedRows(rows).length,
    productionToolIdCount: PRODUCTION_TOOL_IDS.length,
    productionToolIdCountChanged: false,
    adaptersAdded: 0,
    commandIntentsAdded: 0,
    probesAdded: 0,
    importsRun: false,
    recommendedNextMilestones: recommendSoundGate1ANextMilestones(rows),
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
