import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  SoundMusicAudioCategory,
} from './sound-music-audio-owner-expansion-types'

export type SoundRuntimeGate1EvidenceStatus =
  | 'direct_pinned_package'
  | 'alias_covered_tool'
  | 'approved_plan_covered_planning_only'
  | 'first_class_production_tool_id'
  | 'candidate_study_card_only'
  | 'owner_inventory_only'
  | 'blocked_model_gpu'
  | 'blocked_system_binary_runtime_handoff'
  | 'blocked_evaluation'
  | 'provider_handoff_only'
  | 'blocked_media_policy'
  | 'unknown'

export type SoundRuntimeGate1InstallProofStatus =
  | 'planning_only_no_install_proof'
  | 'pinned_requirement_only'
  | 'future_gate_1a_required'
  | 'not_applicable'
  | 'unknown'

export type SoundRuntimeGate1ExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_pending_gate_1a_controlled_install_proof'
  | 'blocked_pending_gate_1b_worker_contract_review'
  | 'blocked_pending_model_review'
  | 'blocked_pending_media_policy'
  | 'blocked_provider_handoff_only'
  | 'planning_only'

export type SoundRuntimeGate1FutureOwnerPrompt =
  | 'SOUND-RUNTIME-MEDIA-GATE-1A'
  | 'SOUND-RUNTIME-MEDIA-GATE-1B'
  | 'SOUND-RUNTIME-MEDIA-GATE-2'
  | 'SOUND-RUNTIME-MEDIA-GATE-3'
  | 'none'

export type SoundRuntimeGate1PendingAction =
  | 'none'
  | 'wait_for_sound_gate_1a'
  | 'wait_for_sound_gate_1b'
  | 'wait_for_model_weight_review'
  | 'wait_for_media_policy_handoff'
  | 'add_candidate_study_card'
  | 'future_registry_expansion_after_owner_proof'
  | 'do_not_duplicate_owner_lane'

export type SoundRuntimeGate1DuplicateRisk =
  | 'none'
  | 'do_not_duplicate_owner_lane'
  | 'possible_duplicate_registry_id'
  | 'possible_duplicate_adapter'
  | 'possible_duplicate_worker_route'
  | 'possible_duplicate_owner_lane'

export interface SoundRuntimeGate1Coverage {
  hasFirstClassStudyCard: boolean
  hasCandidateStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasControlledProbe: boolean
}

export interface SoundRuntimeGate1SeedRow {
  normalizedToolId: string
  displayName: string
  gate1EvidenceStatus: readonly SoundRuntimeGate1EvidenceStatus[]
  packageName: string | null
  aliasFor: string | null
  productionToolId: ProductionToolId | null
  candidateStudyCardId: string | null
  soundCategory: SoundMusicAudioCategory
  sourceEvidence: readonly string[]
  currentToolCallingCoverage: SoundRuntimeGate1Coverage
  selectableAsRuntimeTool: boolean
  installProofStatus: SoundRuntimeGate1InstallProofStatus
  executionGate: SoundRuntimeGate1ExecutionGate
  futureOwnerPrompt: SoundRuntimeGate1FutureOwnerPrompt
  toolCallingPendingAction: SoundRuntimeGate1PendingAction
  duplicateRisk: SoundRuntimeGate1DuplicateRisk
  notes: string
}

export interface SoundRuntimeGate1ReconciliationMatrixDocument {
  schema: 'reeditpro.soundRuntimeGate1ReconciliationMatrix.v1'
  evidenceSummary: {
    sourcePr: 640
    sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1'
    sourceDecision: string
    cpuInstallCandidateCount: number
    directPinnedPackageCount: 13
    aliasCoveredToolCount: 2
    planningOnlyWorkerNames: readonly string[]
    planningOnlyJobTypes: readonly string[]
    nextOwnerPrompts: readonly SoundRuntimeGate1FutureOwnerPrompt[]
  }
  rows: readonly SoundRuntimeGate1SeedRow[]
}

export interface SoundRuntimeGate1ReconciliationRow extends SoundRuntimeGate1SeedRow {
  unmergedOwnerEvidenceRefs: readonly string[]
}

export interface SoundRuntimeGate1SourceBundle {
  matrixDocument: SoundRuntimeGate1ReconciliationMatrixDocument
}

export interface SoundRuntimeGate1Recommendation {
  milestone: string
  reason: string
  affectedToolIds: readonly string[]
}

export interface SoundRuntimeGate1CoverageAnalysis {
  matrixRows: readonly SoundRuntimeGate1ReconciliationRow[]
  gate1MatrixRows: number
  directPinnedPackageCount: 13
  aliasCoveredToolCount: 2
  cpuInstallCandidateCount: 15
  planningOnlyWorkerCount: number
  planningOnlyJobTypeCount: number
  firstClassCoveredCount: number
  candidateOnlyCount: number
  blockedCount: number
  productionToolIdCount: number
  productionToolIdCountChanged: false
  adaptersAdded: 0
  commandIntentsAdded: 0
  probesAdded: 0
  directPinnedPackages: readonly string[]
  aliasCoveredTools: readonly string[]
  blockedTools: readonly string[]
  futureOwnerPrompts: readonly SoundRuntimeGate1FutureOwnerPrompt[]
  recommendedNextMilestones: readonly SoundRuntimeGate1Recommendation[]
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
