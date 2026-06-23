import type {
  ProductionToolId,
} from '../tool-registry'

export type SoundGate1DMergedItemType =
  | 'target_owner'
  | 'owner_handoff_summary'
  | 'dependency_map'
  | 'job_contract_register'
  | 'blocker_register'
  | 'owner_acceptance_request'
  | 'runtime_claim_policy'
  | 'accepted_worker_name'
  | 'planned_image_name'
  | 'planning_only_job_type'
  | 'blocked_gate'
  | 'owner_handoff_surface'
  | 'related_sound_tool'
  | 'gate_1e_next_prompt'
  | 'worker_runtime_review_next_prompt'

export type SoundGate1DMergedEvidenceStatus =
  | 'merged_owner_source_evidence'
  | 'blocked_by_owner_gate'
  | 'owner_next_prompt_only'
  | 'worker_runtime_review_pending'
  | 'unknown'

export type SoundGate1DMergedExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_pending_worker_runtime_jobs_sound_cpu_handoff_review'
  | 'blocked_pending_gate_1e_dockerfile_static_plan'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_model_review'
  | 'blocked_owner_handoff_required'
  | 'planning_only'

export type SoundGate1DMergedPendingAction =
  | 'wait_for_worker_runtime_jobs_sound_cpu_handoff_review'
  | 'wait_for_gate_1e_dockerfile_static_plan'
  | 'wait_for_media_policy_handoff'
  | 'wait_for_model_weight_review'
  | 'future_worker_route_dry_run_after_worker_owner_review'
  | 'do_not_duplicate_owner_lane'
  | 'none'

export type SoundGate1DMergedDuplicateRisk =
  | 'none'
  | 'do_not_duplicate_owner_lane'
  | 'possible_duplicate_worker_route'
  | 'possible_duplicate_worker_runtime_claim'
  | 'possible_duplicate_worker_job_table'
  | 'possible_duplicate_dockerfile_plan'
  | 'possible_duplicate_owner_lane'

export interface SoundGate1DMergedCoverage {
  hasFirstClassStudyCard: boolean
  hasCandidateStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasControlledProbe: boolean
  hasWorkerRouteDryRun: boolean
}

export interface SoundGate1DMergedSafetyFlags {
  acceptedForExecution: false
  workerRuntimeOwnerReviewRequired: true
  workerDispatchAllowedNow: false
  workerClaimAllowedNow: false
  workerLeaseAllowedNow: false
  routeExecutionAllowedNow: false
  toolExecutionAllowedNow: false
  dockerfileMutationAllowedNow: false
  imageBuildAllowedNow: false
  gcpCallAllowedNow: false
  cloudRunAllowedNow: false
  serviceAccountAllowedNow: false
  secretManagerAllowedNow: false
  mediaProcessingAllowedNow: false
  supabaseMutationAllowedNow: false
  sqlAllowedNow: false
  publicArtifactsAllowedNow: false
  betaProductionAllowedNow: false
}

export interface SoundGate1DMergedSeedRow {
  normalizedItemId: string
  displayName: string
  itemType: SoundGate1DMergedItemType
  sourceEvidence: readonly string[]
  relatedProductionToolIds: readonly ProductionToolId[]
  relatedCandidateStudyCards: readonly string[]
  acceptedByGate1D: boolean
  currentToolCallingCoverage: SoundGate1DMergedCoverage
  executionGate: SoundGate1DMergedExecutionGate
  toolCallingPendingAction: SoundGate1DMergedPendingAction
  duplicateRisk: SoundGate1DMergedDuplicateRisk
  notes: string
}

export interface SoundGate1DMergedRow extends SoundGate1DMergedSeedRow, SoundGate1DMergedSafetyFlags {
  gate1dEvidenceStatus: readonly SoundGate1DMergedEvidenceStatus[]
  prNumber: 663
  prMerged: true
  mergeCommit: 'dbb6d7fe56e7a710059fd80385f11e6fe186f5e0'
  evidenceIsFinalSourceOfTruth: true
}

export interface SoundGate1DMergedReconciliationMatrixDocument {
  schema: 'reeditpro.soundGate1DMergedReconciliationMatrix.v1'
  evidenceSummary: {
    sourcePr: 663
    sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1D'
    sourceDecision: string
    prMerged: true
    mergeCommit: 'dbb6d7fe56e7a710059fd80385f11e6fe186f5e0'
    evidenceIsFinalSourceOfTruth: true
    targetOwnerCount: 1
    packetSurfaceCount: 6
    acceptedWorkerNameCount: 2
    plannedImageNameCount: 2
    planningOnlyJobTypeCount: 4
    blockedGateCount: number
    ownerHandoffSurfaceCount: number
    relatedSoundToolCount: 23
    nextPromptCount: 2
    targetOwners: readonly string[]
    packetSurfaces: readonly string[]
    acceptedWorkerNames: readonly string[]
    plannedImageNames: readonly string[]
    planningOnlyJobTypes: readonly string[]
    blockedGates: readonly string[]
    ownerHandoffSurfaces: readonly string[]
    relatedSoundTools: readonly string[]
    nextOwnerPrompts: readonly string[]
    gate1cAcceptedEvidence: {
      sourcePr: 660
      mergeCommit: 'b46509a54695dd049d044fd7135b37a8faaef18e'
      plannedImageNameCount: 2
      acceptedWorkerNameCount: 2
      planningOnlyJobTypeCount: 4
    }
    gate1bAcceptedEvidence: {
      sourcePr: 653
      mergeCommit: '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91'
      acceptedWorkerNameCount: 2
      acceptedJobTypeCount: 4
    }
    gate1aAcceptedEvidence: {
      sourcePr: 647
      metadataPassed: 13
      importsPassed: 14
      failedImports: 0
      packageLockUnchangedByProof: true
    }
    workerRouteDryRunAdded: false
    workerExecutionPerformed: false
    workerClaimPerformed: false
    workerLeasePerformed: false
    importsRun: false
    dockerActionPerformed: false
    gcpActionPerformed: false
    cloudRunActionPerformed: false
    secretManagerActionPerformed: false
    adaptersAdded: 0
    commandIntentsAdded: 0
    probesAdded: 0
  }
  rows: readonly SoundGate1DMergedSeedRow[]
}

export interface SoundGate1DMergedSourceBundle {
  matrixDocument: SoundGate1DMergedReconciliationMatrixDocument
}

export interface SoundGate1DMergedRecommendation {
  milestone: string
  reason: string
  affectedItemIds: readonly string[]
}

export interface SoundGate1DMergedCoverageAnalysis {
  matrixRows: readonly SoundGate1DMergedRow[]
  sourcePr: 663
  mergeCommit: 'dbb6d7fe56e7a710059fd80385f11e6fe186f5e0'
  evidenceIsFinalSourceOfTruth: true
  gate1dMatrixRows: number
  targetOwnerCount: 1
  packetSurfaceCount: 6
  acceptedWorkerNameCount: 2
  plannedImageNameCount: 2
  planningOnlyJobTypeCount: 4
  blockedRowCount: number
  ownerHandoffSurfaceCount: number
  relatedSoundToolCount: 23
  nextPromptCount: 2
  productionToolIdCount: number
  productionToolIdCountChanged: false
  adaptersAdded: 0
  commandIntentsAdded: 0
  probesAdded: 0
  workerRouteDryRunAdded: false
  workerExecutionPerformed: false
  workerClaimPerformed: false
  workerLeasePerformed: false
  dockerActionPerformed: false
  gcpActionPerformed: false
  cloudRunActionPerformed: false
  secretManagerActionPerformed: false
  importsRun: false
  targetOwners: readonly string[]
  planningTerms: readonly string[]
  ownerHandoffSurfaces: readonly string[]
  blockedRows: readonly string[]
  nextPrompts: readonly string[]
  recommendedNextMilestones: readonly SoundGate1DMergedRecommendation[]
  safety: {
    executesTools: false
    importsRun: false
    audioProcessingPerformed: false
    mediaProcessingPerformed: false
    workerExecutionPerformed: false
    workerRouteDryRunAdded: false
    workerClaimPerformed: false
    workerLeasePerformed: false
    dockerActionPerformed: false
    gcpActionPerformed: false
    cloudRunActionPerformed: false
    secretManagerActionPerformed: false
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
