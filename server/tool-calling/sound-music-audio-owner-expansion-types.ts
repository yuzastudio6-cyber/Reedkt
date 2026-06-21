import type {
  ProductionToolId,
} from '../tool-registry'

export type SoundMusicAudioCategory =
  | 'audio_cleanup'
  | 'denoise'
  | 'stem_separation'
  | 'audio_analysis'
  | 'beat_timing'
  | 'music_sync'
  | 'time_stretch'
  | 'loudness_qa'
  | 'sound_effects'
  | 'soundsync'
  | 'cue_manifest'
  | 'sfx_director'
  | 'speech_audio_support'
  | 'unknown_or_pending'

export type SoundOwnerEvidenceStatus =
  | 'merged_owner_inventory'
  | 'merged_runtime_media_gate'
  | 'approved_install_plan_only'
  | 'pinned_requirement_only'
  | 'first_class_production_tool_id'
  | 'explicit_tool_calling_study_card'
  | 'planning_only_adapter_contract'
  | 'blocked_pending_license'
  | 'blocked_pending_model_weight'
  | 'blocked_pending_runtime_gate'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_registry_expansion'
  | 'provider_or_api_only'
  | 'unknown'

export type SoundInstallEvidenceStatus =
  | 'not_declared'
  | 'owner_inventory_only'
  | 'install_plan_only'
  | 'requirements_pinned'
  | 'bounded_install_proof'
  | 'runtime_proof'
  | 'unknown'

export type SoundExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_pending_cpu_worker_install_plan'
  | 'blocked_pending_model_review'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_license'
  | 'planning_only'
  | 'future_controlled_probe_candidate'

export type SoundPendingAction =
  | 'none'
  | 'add_tool_calling_study_card'
  | 'add_runtime_registry_id'
  | 'add_adapter_contract'
  | 'add_safe_command_intent'
  | 'add_fixture_plan'
  | 'wait_for_sound_runtime_media_gate_1'
  | 'wait_for_model_weight_owner_review'
  | 'wait_for_media_policy_owner_handoff'
  | 'wait_for_license_provenance_review'
  | 'do_not_duplicate_owner_lane'

export type SoundDuplicateRisk =
  | 'none'
  | 'possible_duplicate_owner_lane'
  | 'possible_duplicate_registry_id'
  | 'possible_duplicate_study_card'
  | 'possible_duplicate_adapter'
  | 'wait_for_unmerged_owner_pr'

export interface SoundToolCallingCoverage {
  hasStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasControlledProbe: boolean
  hasFixtureBoundProbe: boolean
}

export interface SoundMusicAudioOwnerExpansionMatrixDocument {
  schema: 'reeditpro.soundMusicAudioOwnerExpansionMatrix.v1'
  evidenceSummary: {
    sourcePr: 636
    sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-0'
    sourceDecision: string
    candidateInventoryCount: number
    pinnedRequirementCount: number
    approvedInstallPlanToolCount: number
    githubPrScanAvailable: boolean
  }
  rows: readonly SoundMusicAudioOwnerExpansionSeedRow[]
}

export interface SoundMusicAudioOwnerExpansionSeedRow {
  normalizedToolId: string
  displayName: string
  soundCategory: SoundMusicAudioCategory
  ownerEvidenceStatus: readonly SoundOwnerEvidenceStatus[]
  sourceEvidence: readonly string[]
  productionToolId: ProductionToolId | null
  packageNames: readonly string[]
  aliases: readonly string[]
  currentToolCallingCoverage: SoundToolCallingCoverage
  selectableAsRuntimeTool: boolean
  installEvidenceStatus: SoundInstallEvidenceStatus
  executionGate: SoundExecutionGate
  pendingAction: SoundPendingAction
  duplicateRisk: SoundDuplicateRisk
  notes: string
}

export interface SoundMusicAudioOwnerExpansionRow extends SoundMusicAudioOwnerExpansionSeedRow {
  unmergedOwnerEvidenceRefs: readonly string[]
}

export interface SoundMusicAudioOwnerSourceBundle {
  matrixDocument: SoundMusicAudioOwnerExpansionMatrixDocument
}

export interface SoundMusicAudioRecommendation {
  milestone: string
  reason: string
  candidateToolIds: readonly string[]
}

export interface SoundMusicAudioCoverageAnalysis {
  matrixRows: readonly SoundMusicAudioOwnerExpansionRow[]
  soundMatrixRows: number
  firstClassSoundToolCount: number
  ownerInventoryOnlyCount: number
  installPlanOnlyCount: number
  blockedSoundToolCount: number
  toolsNeedingRegistryExpansion: readonly string[]
  toolsNeedingRegistryExpansionCount: number
  toolsNeedingStudyCards: readonly string[]
  toolsNeedingStudyCardsCount: number
  toolsEligibleForFutureRegistryExpansion: readonly string[]
  recommendedNextMilestones: readonly SoundMusicAudioRecommendation[]
  githubPrScanAvailable: boolean
  duplicateRiskCount: number
  candidateToolsMissingFromMatrix: readonly string[]
  safety: {
    executesTools: false
    audioProcessingPerformed: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    sqlExecuted: false
    duplicateSystemsCreated: false
  }
}
