import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  QualityGateType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  SoundMusicAudioCategory,
} from './sound-music-audio-owner-expansion-types'

export type SoundCandidateOwnerLane = 'sound_music_audio' | 'sfx_soundsync'

export type SoundCandidateRuntimeResolutionStatus =
  | 'owner_inventory_only'
  | 'install_plan_only'
  | 'blocked_pending_license'
  | 'blocked_pending_model_weight'
  | 'blocked_pending_runtime_gate'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_registry_expansion'

export type SoundCandidateOwnerGateStatus =
  | 'wait_for_sound_runtime_media_gate_1'
  | 'wait_for_model_weight_owner_review'
  | 'wait_for_media_policy_owner_handoff'
  | 'wait_for_license_provenance_review'
  | 'do_not_duplicate_owner_lane'
  | 'planning_only_owner_surface'
  | 'owner_gate_required_before_runtime_selection'

export interface SoundCandidateStudyCardSourceEvidence {
  evidenceType: string
  sourcePath: string
  summary: string
}

export interface SoundCandidateRuntimeResolution {
  status: SoundCandidateRuntimeResolutionStatus
  selectableAsRuntimeTool: false
  productionToolId: null
  reason: string
}

export interface SoundCandidateStudyOperation {
  operationId: ToolCallingOperationId
  supportLevel: 'future'
  bestFor: readonly string[]
  notFor: readonly string[]
  inputArtifacts: readonly ToolCallingArtifactType[]
  outputArtifacts: readonly ToolCallingArtifactType[]
  validators: readonly QualityGateType[]
  fallbackToolIds: readonly ProductionToolId[]
  notes: readonly string[]
}

export interface SoundCandidateStudyCardSafetyFlags {
  selectableAsRuntimeTool: false
  adapterContractAllowedNow: false
  commandIntentAllowedNow: false
  fixturePlanAllowedNow: false
  controlledProbeAllowedNow: false
  toolExecutionAllowedNow: false
  mediaProcessingAllowedNow: false
  workerExecutionAllowedNow: false
  supabaseMutationAllowedNow: false
  betaProductionAllowedNow: false
}

export interface SoundCandidateStudyCard extends SoundCandidateStudyCardSafetyFlags {
  schema: 'reeditpro.soundCandidateStudyCard.v1'
  externalToolId: string
  displayName: string
  aliases: readonly string[]
  ownerLane: SoundCandidateOwnerLane
  soundCategory: SoundMusicAudioCategory
  runtimeResolution: SoundCandidateRuntimeResolution
  operations: readonly SoundCandidateStudyOperation[]
  bestFor: readonly string[]
  notFor: readonly string[]
  inputArtifacts: readonly ToolCallingArtifactType[]
  outputArtifacts: readonly ToolCallingArtifactType[]
  validators: readonly QualityGateType[]
  fallbackToolIds: readonly ProductionToolId[]
  knownFailureModes: readonly string[]
  professionalEditingUses: readonly string[]
  sourceEvidence: readonly SoundCandidateStudyCardSourceEvidence[]
  ownerGateStatus: SoundCandidateOwnerGateStatus
  futurePromotionRequirements: readonly string[]
  readinessNotes: readonly string[]
  benchmarkPlaceholders: readonly string[]
  telemetryPlaceholders: readonly string[]
}

export interface SoundCandidateStudyCardsIndex {
  schema: 'reeditpro.soundCandidateStudyCardsIndex.v1'
  sourcePrs: readonly number[]
  sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-0'
  candidateStudyCardCount: number
  cardPaths: readonly string[]
  candidateExternalToolIds: readonly string[]
  selectableAsRuntimeTool: false
  adapterContractsAdded: 0
  commandIntentsAdded: 0
  controlledProbesAdded: 0
}

export interface SoundCandidateRecommendation {
  milestone: string
  reason: string
  candidateExternalToolIds: readonly string[]
}

export interface SoundCandidateStudyCardAnalysis {
  candidateStudyCards: readonly SoundCandidateStudyCard[]
  candidateStudyCardCount: number
  evidenceNotFound: readonly string[]
  evidenceNotFoundCount: number
  blockedCandidateExternalToolIds: readonly string[]
  blockedCandidateCount: number
  installPlanOnlyExternalToolIds: readonly string[]
  installPlanOnlyCount: number
  ownerInventoryOnlyExternalToolIds: readonly string[]
  ownerInventoryOnlyCount: number
  futureRegistryEligibleExternalToolIds: readonly string[]
  futureRegistryEligibleCount: number
  selectableCandidateCount: 0
  adapterContractsAdded: 0
  commandIntentsAdded: 0
  controlledProbesAdded: 0
  productionToolIdCount: number
  productionToolIdCountChanged: false
  recommendedNextMilestones: readonly SoundCandidateRecommendation[]
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
