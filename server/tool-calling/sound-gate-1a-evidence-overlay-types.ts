import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  SoundMusicAudioCategory,
} from './sound-music-audio-owner-expansion-types'

export type SoundGate1AEvidenceStatus =
  | 'open_pr_candidate_evidence'
  | 'merged_owner_source_evidence'
  | 'no_gate_1a_evidence'
  | 'failed_or_rejected_evidence'
  | 'blocked_by_owner_gate'
  | 'unknown'

export type SoundGate1APrState = 'open' | 'closed' | 'merged' | 'unknown'

export type SoundGate1AExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_unmerged_gate_1a_candidate_only'
  | 'blocked_pending_gate_1b_worker_contract_review'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_model_review'
  | 'planning_only'

export type SoundGate1APendingAction =
  | 'wait_for_gate_1a_merge'
  | 'wait_for_gate_1b_worker_contract_review'
  | 'wait_for_media_policy_handoff'
  | 'wait_for_model_weight_review'
  | 'future_controlled_import_probe_reconciliation'
  | 'future_registry_expansion_after_owner_merge'
  | 'do_not_duplicate_owner_lane'
  | 'none'

export type SoundGate1ADuplicateRisk =
  | 'none'
  | 'do_not_duplicate_owner_lane'
  | 'wait_for_owner_merge'
  | 'possible_duplicate_worker_route'
  | 'possible_duplicate_probe_layer'
  | 'possible_duplicate_registry_id'

export interface SoundGate1AReportedResult {
  metadataCheckPassed: number
  metadataCheckFailed: number
  importCheckPassed: number
  importCheckFailed: number
  failedImports: readonly string[]
  pythonObserved: string
  tempVenvRemoved: boolean
  proofRunnerPath: string
}

export interface SoundGate1ACoverage {
  hasFirstClassStudyCard: boolean
  hasCandidateStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasControlledProbe: boolean
}

export interface SoundGate1AEvidenceSeedRow {
  normalizedToolId: string
  displayName: string
  gate1aEvidenceStatus: readonly SoundGate1AEvidenceStatus[]
  prNumber: 647
  prState: SoundGate1APrState
  draft: boolean | null
  mergeable: string | null
  evidenceIsFinalSourceOfTruth: boolean
  packageName: string | null
  aliasFor: string | null
  productionToolId: ProductionToolId | null
  candidateStudyCardId: string | null
  soundCategory: SoundMusicAudioCategory
  sourceEvidence: readonly string[]
  gate1aReportedResult: SoundGate1AReportedResult
  currentToolCallingCoverage: SoundGate1ACoverage
  selectableAsRuntimeTool: boolean
  executionGate: SoundGate1AExecutionGate
  toolCallingPendingAction: SoundGate1APendingAction
  duplicateRisk: SoundGate1ADuplicateRisk
  notes: string
}

export interface SoundGate1AEvidenceOverlayMatrixDocument {
  schema: 'reeditpro.soundGate1AEvidenceOverlayMatrix.v1'
  evidenceSummary: {
    sourcePr: 647
    sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1A'
    sourceDecision: string
    requirementsPath: string
    proofRunnerPath: string
    reportedPython3: string
    reportedPython: 'unavailable'
    metadataCheckPassed: 13
    metadataCheckFailed: 0
    importCheckPassed: 14
    importCheckFailed: 0
    failedImports: readonly string[]
    aliasCoveredToolCount: 2
    directPinnedPackageCount: 13
    tempVenvRemoved: true
  }
  rows: readonly SoundGate1AEvidenceSeedRow[]
}

export interface SoundGate1APr647Status {
  githubPrScanAvailable: boolean
  pr647Found: boolean
  pr647State: SoundGate1APrState
  pr647Draft: boolean | null
  pr647Merged: boolean
  pr647Mergeable: string | null
  pr647Url: string | null
  evidenceIsFinalSourceOfTruth: boolean
  scanError: string | null
}

export interface SoundGate1AEvidenceOverlayRow extends SoundGate1AEvidenceSeedRow {
  githubPrScanAvailable: boolean
  pr647Found: boolean
  pr647Merged: boolean
  pr647Url: string | null
}

export interface SoundGate1AEvidenceSourceBundle {
  matrixDocument: SoundGate1AEvidenceOverlayMatrixDocument
}

export interface SoundGate1ARecommendation {
  milestone: string
  reason: string
  affectedToolIds: readonly string[]
}

export interface SoundGate1AEvidenceOverlayAnalysis {
  matrixRows: readonly SoundGate1AEvidenceOverlayRow[]
  gate1aMatrixRows: number
  pr647Found: boolean
  pr647State: SoundGate1APrState
  pr647Draft: boolean | null
  pr647Merged: boolean
  evidenceIsFinalSourceOfTruth: boolean
  directPinnedPackageCount: 13
  aliasCoveredToolCount: 2
  candidateEvidenceCount: number
  mergedEvidenceCount: number
  blockedCount: number
  productionToolIdCount: number
  productionToolIdCountChanged: false
  adaptersAdded: 0
  commandIntentsAdded: 0
  probesAdded: 0
  importsRun: false
  recommendedNextMilestones: readonly SoundGate1ARecommendation[]
  safety: {
    executesTools: false
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
