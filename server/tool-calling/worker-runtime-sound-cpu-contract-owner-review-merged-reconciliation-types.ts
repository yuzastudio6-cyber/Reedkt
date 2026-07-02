import type {
  ProductionToolId,
} from '../tool-registry'

export type WorkerRuntimeSoundCpuContractOwnerReviewItemType =
  | 'worker_runtime_contract_owner_review'
  | 'accepted_worker_name'
  | 'accepted_image_name'
  | 'accepted_job_type'
  | 'accepted_static_contract_area'
  | 'accepted_static_field'
  | 'placeholder_policy_surface'
  | 'blocked_execution_gate'
  | 'dockerfile_static_review_next_prompt'
  | 'dockerfile_static_review_candidate_evidence'
  | 'related_sound_tool'

export type WorkerRuntimeSoundCpuContractOwnerReviewEvidenceStatus =
  | 'merged_owner_source_evidence'
  | 'open_pr_candidate_evidence'
  | 'blocked_by_worker_runtime_gate'
  | 'owner_next_prompt_only'
  | 'unknown'

export type WorkerRuntimeSoundCpuContractOwnerReviewExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_pending_dockerfile_static_review_merge'
  | 'blocked_pending_gate_1e_dockerfile_static_plan'
  | 'blocked_pending_worker_route_dry_run_decision'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_model_review'
  | 'planning_only'

export type WorkerRuntimeSoundCpuContractOwnerReviewPendingAction =
  | 'wait_for_dockerfile_static_review_merge'
  | 'wait_for_gate_1e_dockerfile_static_plan'
  | 'wait_for_worker_route_dry_run_decision'
  | 'wait_for_media_policy_handoff'
  | 'wait_for_model_weight_review'
  | 'do_not_duplicate_owner_lane'
  | 'none'

export type WorkerRuntimeSoundCpuContractOwnerReviewDuplicateRisk =
  | 'none'
  | 'do_not_duplicate_owner_lane'
  | 'possible_duplicate_worker_route'
  | 'possible_duplicate_worker_runtime_claim'
  | 'possible_duplicate_worker_job_table'
  | 'possible_duplicate_dockerfile_plan'
  | 'possible_duplicate_policy_enablement'

export interface WorkerRuntimeSoundCpuContractOwnerReviewCoverage {
  hasFirstClassStudyCard: boolean
  hasCandidateStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasControlledProbe: boolean
  hasWorkerRouteDryRun: boolean
}

export interface WorkerRuntimeSoundCpuContractOwnerReviewRow {
  normalizedItemId: string
  displayName: string
  itemType: WorkerRuntimeSoundCpuContractOwnerReviewItemType
  ownerReviewEvidenceStatus: readonly WorkerRuntimeSoundCpuContractOwnerReviewEvidenceStatus[]
  prNumber: 679 | 684
  prMerged: boolean
  prDraft: boolean
  mergeCommit: string | null
  evidenceIsFinalSourceOfTruth: boolean
  sourceEvidence: readonly string[]
  relatedProductionToolIds: readonly ProductionToolId[]
  relatedCandidateStudyCards: readonly string[]
  acceptedForFutureDockerfileStaticPlanning: boolean
  acceptedForFutureStaticPlanning: boolean
  acceptedForRuntimeExecution: false
  workerDispatchAllowedNow: false
  workerClaimAllowedNow: false
  workerLeaseAllowedNow: false
  workerExecutionAllowedNow: false
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
  currentToolCallingCoverage: WorkerRuntimeSoundCpuContractOwnerReviewCoverage
  executionGate: WorkerRuntimeSoundCpuContractOwnerReviewExecutionGate
  toolCallingPendingAction: WorkerRuntimeSoundCpuContractOwnerReviewPendingAction
  duplicateRisk: WorkerRuntimeSoundCpuContractOwnerReviewDuplicateRisk
  notes: string
}

export interface WorkerRuntimeSoundCpuContractOwnerReviewMatrixDocument {
  schema: 'reeditpro.workerRuntimeSoundCpuContractOwnerReviewMergedReconciliationMatrix.v1'
  evidenceSummary: {
    sourcePr: 679
    sourceMilestone: 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTRACT-OWNER-REVIEW'
    sourceDecision: 'worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan'
    sourceBranch: string
    prMerged: true
    mergeCommit: '1091f901729334389918f3b1ea28b584ebf7686b'
    evidenceIsFinalSourceOfTruth: true
    pr684DefaultStatus: 'open_pr_candidate_evidence'
    pr684EvidenceIsFinalSourceOfTruth: false
    acceptedWorkerNameCount: 2
    acceptedImageNameCount: 2
    acceptedJobTypeCount: 4
    acceptedStaticContractAreaCount: 3
    acceptedStaticFieldCount: 10
    placeholderPolicyCount: 10
    blockedGateCount: number
    relatedSoundToolCount: 23
    nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW'
    acceptedWorkerNames: readonly string[]
    acceptedImageNames: readonly string[]
    acceptedJobTypes: readonly string[]
    relatedSoundTools: readonly string[]
    productionToolIdCountChanged: false
    adaptersAdded: 0
    commandIntentsAdded: 0
    probesAdded: 0
    workerRouteDryRunAdded: false
    workerExecutionPerformed: false
    workerClaimPerformed: false
    workerLeasePerformed: false
    workerJobsCreated: false
    dockerfileStaticPlanAdded: false
    importsRun: false
    dockerActionPerformed: false
    gcpActionPerformed: false
    cloudRunActionPerformed: false
    secretManagerActionPerformed: false
    observabilityPolicyEnabled: false
    retryPolicyEnabled: false
    artifactPolicyEnabled: false
  }
  rows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[]
}

export interface WorkerRuntimeSoundCpuContractOwnerReviewSourceBundle {
  matrixDocument: WorkerRuntimeSoundCpuContractOwnerReviewMatrixDocument
}

export interface WorkerRuntimeSoundCpuContractOwnerReviewRecommendation {
  milestone: string
  reason: string
  affectedItemIds: readonly string[]
}

export interface WorkerRuntimeSoundCpuContractOwnerReviewAnalysis {
  matrixRows: readonly WorkerRuntimeSoundCpuContractOwnerReviewRow[]
  sourcePr: 679
  mergeCommit: '1091f901729334389918f3b1ea28b584ebf7686b'
  evidenceIsFinalSourceOfTruth: true
  contractOwnerReviewMatrixRows: number
  pr684Found: boolean
  pr684Merged: boolean
  pr684EvidenceIsFinalSourceOfTruth: boolean
  acceptedWorkerNameCount: 2
  acceptedImageNameCount: 2
  acceptedJobTypeCount: 4
  acceptedStaticContractAreaCount: number
  acceptedStaticFieldCount: number
  placeholderPolicyCount: number
  blockedRowCount: number
  relatedSoundToolCount: 23
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
  dockerfileStaticPlanAdded: false
  dockerActionPerformed: false
  gcpActionPerformed: false
  cloudRunActionPerformed: false
  secretManagerActionPerformed: false
  observabilityPolicyEnabled: false
  retryPolicyEnabled: false
  artifactPolicyEnabled: false
  importsRun: false
  acceptedSoundContractAreas: readonly string[]
  blockedRows: readonly string[]
  dockerfileStaticReviewEvidenceRows: readonly string[]
  recommendedNextMilestones: readonly WorkerRuntimeSoundCpuContractOwnerReviewRecommendation[]
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
