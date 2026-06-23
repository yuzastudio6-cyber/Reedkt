import type {
  ProductionToolId,
} from '../tool-registry'

export type WorkerRuntimeSoundCpuHandoffReviewItemType =
  | 'worker_runtime_owner_review'
  | 'accepted_worker_name'
  | 'planned_image_name'
  | 'accepted_job_type'
  | 'blocked_execution_gate'
  | 'blocked_policy_surface'
  | 'related_sound_tool'
  | 'static_contract_next_prompt'

export type WorkerRuntimeSoundCpuHandoffReviewEvidenceStatus =
  | 'merged_owner_source_evidence'
  | 'blocked_by_worker_runtime_gate'
  | 'owner_next_prompt_only'
  | 'unknown'

export type WorkerRuntimeSoundCpuHandoffReviewExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_pending_static_contract_plan'
  | 'blocked_pending_worker_runtime_static_contract'
  | 'blocked_pending_dockerfile_static_plan'
  | 'blocked_pending_worker_runtime_policy'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_model_review'
  | 'planning_only'

export type WorkerRuntimeSoundCpuHandoffReviewPendingAction =
  | 'wait_for_worker_runtime_static_contract_plan'
  | 'wait_for_dockerfile_static_plan'
  | 'wait_for_worker_runtime_policy'
  | 'wait_for_media_policy_handoff'
  | 'wait_for_model_weight_review'
  | 'future_worker_route_dry_run_after_static_contract'
  | 'do_not_duplicate_owner_lane'
  | 'none'

export type WorkerRuntimeSoundCpuHandoffReviewDuplicateRisk =
  | 'none'
  | 'do_not_duplicate_owner_lane'
  | 'possible_duplicate_worker_route'
  | 'possible_duplicate_worker_runtime_claim'
  | 'possible_duplicate_worker_job_table'
  | 'possible_duplicate_static_contract_plan'
  | 'possible_duplicate_dockerfile_plan'
  | 'possible_duplicate_policy_enablement'

export interface WorkerRuntimeSoundCpuHandoffReviewCoverage {
  hasFirstClassStudyCard: boolean
  hasCandidateStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasControlledProbe: boolean
  hasWorkerRouteDryRun: boolean
}

export interface WorkerRuntimeSoundCpuHandoffReviewSafetyFlags {
  acceptedForFutureStaticPlanning: boolean
  acceptedForExecution: false
  workerRuntimeOwnerReviewAccepted: boolean
  staticContractPlanRequired: true
  workerDispatchAllowedNow: false
  workerClaimAllowedNow: false
  workerLeaseAllowedNow: false
  workerExecutionAllowedNow: false
  workerJobsCreatedNow: false
  routeExecutionAllowedNow: false
  toolExecutionAllowedNow: false
  dockerfileMutationAllowedNow: false
  imageBuildAllowedNow: false
  gcpCallAllowedNow: false
  cloudRunAllowedNow: false
  serviceAccountAllowedNow: false
  secretManagerAllowedNow: false
  observabilityPolicyAllowedNow: false
  retryPolicyAllowedNow: false
  artifactPolicyAllowedNow: false
  mediaProcessingAllowedNow: false
  supabaseMutationAllowedNow: false
  sqlAllowedNow: false
  publicArtifactsAllowedNow: false
  betaProductionAllowedNow: false
}

export interface WorkerRuntimeSoundCpuHandoffReviewRow extends WorkerRuntimeSoundCpuHandoffReviewSafetyFlags {
  normalizedItemId: string
  displayName: string
  itemType: WorkerRuntimeSoundCpuHandoffReviewItemType
  workerReviewEvidenceStatus: readonly WorkerRuntimeSoundCpuHandoffReviewEvidenceStatus[]
  prNumber: 670
  prMerged: true
  mergeCommit: 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc'
  evidenceIsFinalSourceOfTruth: true
  sourceEvidence: readonly string[]
  relatedProductionToolIds: readonly ProductionToolId[]
  relatedCandidateStudyCards: readonly string[]
  currentToolCallingCoverage: WorkerRuntimeSoundCpuHandoffReviewCoverage
  executionGate: WorkerRuntimeSoundCpuHandoffReviewExecutionGate
  toolCallingPendingAction: WorkerRuntimeSoundCpuHandoffReviewPendingAction
  duplicateRisk: WorkerRuntimeSoundCpuHandoffReviewDuplicateRisk
  notes: string
}

export interface WorkerRuntimeSoundCpuHandoffReviewMatrixDocument {
  schema: 'reeditpro.workerRuntimeSoundCpuHandoffReviewReconciliationMatrix.v1'
  evidenceSummary: {
    sourcePr: 670
    sourceMilestone: 'WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW'
    sourceDecision: 'worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan'
    sourceBranch: string
    sourceHeadCommit: 'dbb6d7fe56e7a710059fd80385f11e6fe186f5e0'
    prMerged: true
    mergeCommit: 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc'
    evidenceIsFinalSourceOfTruth: true
    workerReviewRowCount: 1
    acceptedWorkerNameCount: 2
    plannedImageNameCount: 2
    acceptedJobTypeCount: 4
    blockedGateCount: number
    relatedSoundToolCount: 23
    nextPromptCount: 1
    acceptedWorkerNames: readonly string[]
    plannedImageNames: readonly string[]
    acceptedJobTypes: readonly string[]
    blockedGates: readonly string[]
    relatedSoundTools: readonly string[]
    nextOwnerPrompts: readonly string[]
    soundGate1dEvidence: {
      sourcePr: 663
      mergeCommit: 'dbb6d7fe56e7a710059fd80385f11e6fe186f5e0'
      targetOwner: 'WORKER_RUNTIME_JOBS'
      acceptedWorkerNameCount: 2
      planningOnlyJobTypeCount: 4
    }
    staticContractPlanEvidenceStatus: 'owner_next_prompt_only' | 'candidate_evidence_only' | 'merged_owner_source_evidence'
    workerRouteDryRunAdded: false
    workerExecutionPerformed: false
    workerClaimPerformed: false
    workerLeasePerformed: false
    workerJobsCreated: false
    staticContractPlanAdded: false
    importsRun: false
    dockerActionPerformed: false
    gcpActionPerformed: false
    cloudRunActionPerformed: false
    secretManagerActionPerformed: false
    observabilityPolicyEnabled: false
    retryPolicyEnabled: false
    artifactPolicyEnabled: false
    adaptersAdded: 0
    commandIntentsAdded: 0
    probesAdded: 0
  }
  rows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[]
}

export interface WorkerRuntimeSoundCpuHandoffReviewSourceBundle {
  matrixDocument: WorkerRuntimeSoundCpuHandoffReviewMatrixDocument
}

export interface WorkerRuntimeSoundCpuHandoffReviewRecommendation {
  milestone: string
  reason: string
  affectedItemIds: readonly string[]
}

export interface WorkerRuntimeSoundCpuHandoffReviewAnalysis {
  matrixRows: readonly WorkerRuntimeSoundCpuHandoffReviewRow[]
  sourcePr: 670
  mergeCommit: 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc'
  evidenceIsFinalSourceOfTruth: true
  workerReviewMatrixRows: number
  acceptedWorkerNameCount: 2
  plannedImageNameCount: 2
  acceptedJobTypeCount: 4
  blockedRowCount: number
  relatedSoundToolCount: 23
  nextPromptCount: 1
  productionToolIdCount: number
  productionToolIdCountChanged: false
  adaptersAdded: 0
  commandIntentsAdded: 0
  probesAdded: 0
  workerRouteDryRunAdded: false
  workerExecutionPerformed: false
  workerClaimPerformed: false
  workerLeasePerformed: false
  workerJobsCreated: false
  staticContractPlanAdded: false
  dockerActionPerformed: false
  gcpActionPerformed: false
  cloudRunActionPerformed: false
  secretManagerActionPerformed: false
  observabilityPolicyEnabled: false
  retryPolicyEnabled: false
  artifactPolicyEnabled: false
  importsRun: false
  acceptedWorkerNames: readonly string[]
  acceptedJobTypes: readonly string[]
  blockedRows: readonly string[]
  nextPrompts: readonly string[]
  recommendedNextMilestones: readonly WorkerRuntimeSoundCpuHandoffReviewRecommendation[]
  safety: {
    executesTools: false
    importsRun: false
    audioProcessingPerformed: false
    mediaProcessingPerformed: false
    workerExecutionPerformed: false
    workerRouteDryRunAdded: false
    workerClaimPerformed: false
    workerLeasePerformed: false
    workerJobsCreated: false
    dockerActionPerformed: false
    gcpActionPerformed: false
    cloudRunActionPerformed: false
    secretManagerActionPerformed: false
    observabilityPolicyEnabled: false
    retryPolicyEnabled: false
    artifactPolicyEnabled: false
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
