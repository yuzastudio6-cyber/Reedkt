import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  SoundMusicAudioCategory,
} from './sound-music-audio-owner-expansion-types'
import type {
  SoundRuntimeGate1DuplicateRisk,
  SoundRuntimeGate1EvidenceStatus,
  SoundRuntimeGate1FutureOwnerPrompt,
  SoundRuntimeGate1Coverage,
} from './sound-runtime-gate-1-reconciliation-types'

export type SoundGate1AMergedEvidenceStatus =
  | 'merged_owner_source_evidence'
  | 'blocked_by_owner_gate'

export type SoundGate1AMergedInstallProofStatus =
  | 'gate_1a_merged_controlled_install_proof'
  | 'planning_only_no_install_proof'
  | 'pinned_requirement_only'
  | 'future_gate_1a_required'
  | 'not_applicable'
  | 'unknown'

export type SoundGate1AMergedExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_pending_gate_1b_worker_contract_review'
  | 'blocked_pending_model_review'
  | 'blocked_pending_media_policy'
  | 'planning_only'

export type SoundGate1AMergedPendingAction =
  | 'none'
  | 'future_controlled_import_probe_planning'
  | 'future_registry_expansion_after_owner_proof'
  | 'wait_for_sound_gate_1b'
  | 'wait_for_model_weight_review'
  | 'wait_for_media_policy_handoff'
  | 'do_not_duplicate_owner_lane'

export interface SoundGate1AMergedReportedResult {
  metadataChecksPassed: 13
  metadataChecksFailed: 0
  importChecksPassed: 14
  importChecksFailed: 0
  importChecksInclude: readonly ['scipy.signal']
  failedImports: readonly []
  python3Observed: '3.13.13'
  pythonUnavailable: true
  tempVenvRemoved: true
  requirementsPath: 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'
  proofRunnerPath: 'scripts/validation/sound-runtime-media-gate-1a-controlled-cpu-install-proof-runner.py'
}

export interface SoundGate1AMergedSeedRow {
  normalizedToolId: string
  displayName: string
  gate1EvidenceStatus: readonly SoundRuntimeGate1EvidenceStatus[]
  gate1aEvidenceStatus: readonly SoundGate1AMergedEvidenceStatus[]
  prNumber: 647
  prMerged: true
  mergeCommit: '0126327c19f1af18bb1ca040c31d06736693d1b6'
  evidenceIsFinalSourceOfTruth: true
  gate1aReportedResult: SoundGate1AMergedReportedResult
  packageName: string | null
  aliasFor: string | null
  productionToolId: ProductionToolId | null
  candidateStudyCardId: string | null
  soundCategory: SoundMusicAudioCategory
  sourceEvidence: readonly string[]
  currentToolCallingCoverage: SoundRuntimeGate1Coverage
  selectableAsRuntimeTool: boolean
  installProofStatus: SoundGate1AMergedInstallProofStatus
  executionGate: SoundGate1AMergedExecutionGate
  futureOwnerPrompt: SoundRuntimeGate1FutureOwnerPrompt
  toolCallingPendingAction: SoundGate1AMergedPendingAction
  duplicateRisk: SoundRuntimeGate1DuplicateRisk
  notes: string
}

export interface SoundGate1AMergedReconciliationMatrixDocument {
  schema: 'reeditpro.soundGate1AMergedReconciliationMatrix.v1'
  evidenceSummary: {
    sourcePr: 647
    sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1A'
    sourceDecision: string
    prMerged: true
    mergeCommit: '0126327c19f1af18bb1ca040c31d06736693d1b6'
    evidenceIsFinalSourceOfTruth: true
    requirementsPath: SoundGate1AMergedReportedResult['requirementsPath']
    proofRunnerPath: SoundGate1AMergedReportedResult['proofRunnerPath']
    metadataChecksPassed: 13
    metadataChecksFailed: 0
    importChecksPassed: 14
    importChecksFailed: 0
    importChecksInclude: readonly ['scipy.signal']
    failedImports: readonly []
    python3Observed: '3.13.13'
    pythonUnavailable: true
    tempVenvRemoved: true
    directPinnedPackageCount: 13
    aliasCoveredToolCount: 2
    gate1RowCount: 29
    noImportsRunByToolCalling: true
    adaptersAdded: 0
    commandIntentsAdded: 0
    probesAdded: 0
    nextOwnerPrompts: readonly SoundRuntimeGate1FutureOwnerPrompt[]
  }
  rows: readonly SoundGate1AMergedSeedRow[]
}

export interface SoundGate1AMergedReconciliationRow extends SoundGate1AMergedSeedRow {
  gate1RuntimeCoverageMatched: boolean
}

export interface SoundGate1AMergedSourceBundle {
  matrixDocument: SoundGate1AMergedReconciliationMatrixDocument
}

export interface SoundGate1AMergedRecommendation {
  milestone: string
  reason: string
  affectedToolIds: readonly string[]
}

export interface SoundGate1AMergedCoverageAnalysis {
  matrixRows: readonly SoundGate1AMergedReconciliationRow[]
  sourcePr: 647
  mergeCommit: '0126327c19f1af18bb1ca040c31d06736693d1b6'
  evidenceIsFinalSourceOfTruth: true
  gate1aMatrixRows: 29
  directPinnedPackageCount: 13
  aliasCoveredToolCount: 2
  mergedEvidenceRowCount: number
  blockedRowCount: number
  firstClassCoveredCount: number
  candidateOnlyCount: number
  productionToolIdCount: number
  productionToolIdCountChanged: false
  adaptersAdded: 0
  commandIntentsAdded: 0
  probesAdded: 0
  importsRun: false
  directPinnedPackages: readonly string[]
  aliasCoveredTools: readonly string[]
  blockedRows: readonly string[]
  recommendedNextMilestones: readonly SoundGate1AMergedRecommendation[]
  safety: {
    executesTools: false
    importsRun: false
    audioProcessingPerformed: false
    mediaProcessingPerformed: false
    workerExecutionPerformed: false
    providerCallsPerformed: false
    supabaseMutationPerformed: false
    sqlExecuted: false
    migrationsCreated: false
    signedUrlsCreated: false
    packageLockMutated: false
    betaProductionUnlocked: false
    duplicateSystemsCreated: false
  }
}
