import type {
  ProductionToolId,
} from '../tool-registry'

export type SoundGate1CMergedItemType =
  | 'planned_image_name'
  | 'preserved_worker_name'
  | 'preserved_job_type'
  | 'gate_1c_doc_surface'
  | 'blocked_gate'
  | 'owner_handoff_surface'
  | 'related_sound_tool'
  | 'gate_1d_next_prompt'
  | 'gate_1e_next_prompt'

export type SoundGate1CMergedEvidenceStatus =
  | 'merged_owner_source_evidence'
  | 'blocked_by_owner_gate'
  | 'owner_next_prompt_only'
  | 'unknown'

export type SoundGate1CMergedExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_pending_gate_1d_worker_runtime_owner_handoff'
  | 'blocked_pending_gate_1e_dockerfile_static_plan'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_model_review'
  | 'blocked_owner_handoff_required'
  | 'planning_only'

export type SoundGate1CMergedPendingAction =
  | 'wait_for_gate_1d_worker_runtime_owner_handoff'
  | 'wait_for_gate_1e_dockerfile_static_plan'
  | 'wait_for_media_policy_handoff'
  | 'wait_for_model_weight_review'
  | 'future_worker_route_dry_run_after_owner_gate'
  | 'do_not_duplicate_owner_lane'
  | 'none'

export type SoundGate1CMergedDuplicateRisk =
  | 'none'
  | 'do_not_duplicate_owner_lane'
  | 'possible_duplicate_worker_route'
  | 'possible_duplicate_worker_image_plan'
  | 'possible_duplicate_dockerfile_plan'
  | 'possible_duplicate_owner_lane'

export interface SoundGate1CMergedCoverage {
  hasFirstClassStudyCard: boolean
  hasCandidateStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasControlledProbe: boolean
  hasWorkerRouteDryRun: boolean
}

export interface SoundGate1CMergedSafetyFlags {
  acceptedForExecution: false
  imageBuildAllowedNow: false
  dockerfileMutationAllowedNow: false
  gcpCallAllowedNow: false
  cloudRunAllowedNow: false
  serviceAccountAllowedNow: false
  secretManagerAllowedNow: false
  workerDispatchAllowedNow: false
  routeExecutionAllowedNow: false
  toolExecutionAllowedNow: false
  mediaProcessingAllowedNow: false
  supabaseMutationAllowedNow: false
  sqlAllowedNow: false
  publicArtifactsAllowedNow: false
  betaProductionAllowedNow: false
}

export interface SoundGate1CMergedSeedRow {
  normalizedItemId: string
  displayName: string
  itemType: SoundGate1CMergedItemType
  sourceEvidence: readonly string[]
  relatedProductionToolIds: readonly ProductionToolId[]
  relatedCandidateStudyCards: readonly string[]
  acceptedByGate1C: boolean
  currentToolCallingCoverage: SoundGate1CMergedCoverage
  executionGate: SoundGate1CMergedExecutionGate
  toolCallingPendingAction: SoundGate1CMergedPendingAction
  duplicateRisk: SoundGate1CMergedDuplicateRisk
  notes: string
}

export interface SoundGate1CMergedRow extends SoundGate1CMergedSeedRow, SoundGate1CMergedSafetyFlags {
  gate1cEvidenceStatus: readonly SoundGate1CMergedEvidenceStatus[]
  prNumber: 660
  prMerged: true
  mergeCommit: 'b46509a54695dd049d044fd7135b37a8faaef18e'
  evidenceIsFinalSourceOfTruth: true
}

export interface SoundGate1CMergedReconciliationMatrixDocument {
  schema: 'reeditpro.soundGate1CMergedReconciliationMatrix.v1'
  evidenceSummary: {
    sourcePr: 660
    sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1C'
    sourceDecision: string
    prMerged: true
    mergeCommit: 'b46509a54695dd049d044fd7135b37a8faaef18e'
    evidenceIsFinalSourceOfTruth: true
    plannedImageNameCount: 2
    preservedWorkerNameCount: 2
    preservedJobTypeCount: 4
    docSurfaceCount: 6
    blockedGateCount: number
    relatedSoundToolCount: 23
    nextPromptCount: 2
    plannedImageNames: readonly string[]
    preservedWorkerNames: readonly string[]
    preservedJobTypes: readonly string[]
    docSurfaces: readonly string[]
    blockedGates: readonly string[]
    relatedSoundTools: readonly string[]
    nextOwnerPrompts: readonly string[]
    gate1bAcceptedEvidence: {
      sourcePr: 653
      mergeCommit: '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91'
      acceptedWorkerNameCount: 2
      acceptedJobTypeCount: 4
    }
    gate1aAcceptedEvidence: {
      sourcePr: 647
      mergeCommit: '0126327c19f1af18bb1ca040c31d06736693d1b6'
      metadataPassed: 13
      importsPassed: 14
      failedImports: 0
      tempVenvRemoved: true
    }
    imageBuildsPerformed: false
    dockerfilesAdded: false
    dockerActionPerformed: false
    gcpActionPerformed: false
    cloudRunActionPerformed: false
    workerRouteDryRunAdded: false
    workerExecutionPerformed: false
    importsRun: false
    adaptersAdded: 0
    commandIntentsAdded: 0
    probesAdded: 0
  }
  rows: readonly SoundGate1CMergedSeedRow[]
}

export interface SoundGate1CMergedSourceBundle {
  matrixDocument: SoundGate1CMergedReconciliationMatrixDocument
}

export interface SoundGate1CMergedRecommendation {
  milestone: string
  reason: string
  affectedItemIds: readonly string[]
}

export interface SoundGate1CMergedCoverageAnalysis {
  matrixRows: readonly SoundGate1CMergedRow[]
  sourcePr: 660
  mergeCommit: 'b46509a54695dd049d044fd7135b37a8faaef18e'
  evidenceIsFinalSourceOfTruth: true
  gate1cMatrixRows: number
  plannedImageNameCount: 2
  preservedWorkerNameCount: 2
  preservedJobTypeCount: 4
  docSurfaceCount: 6
  blockedRowCount: number
  relatedSoundToolCount: 23
  nextPromptCount: 2
  productionToolIdCount: number
  productionToolIdCountChanged: false
  adaptersAdded: 0
  commandIntentsAdded: 0
  probesAdded: 0
  workerRouteDryRunAdded: false
  workerExecutionPerformed: false
  imageBuildsPerformed: false
  dockerfilesAdded: false
  dockerActionPerformed: false
  gcpActionPerformed: false
  cloudRunActionPerformed: false
  importsRun: false
  plannedImageNames: readonly string[]
  preservedWorkerNames: readonly string[]
  preservedJobTypes: readonly string[]
  docSurfaces: readonly string[]
  blockedRows: readonly string[]
  nextPrompts: readonly string[]
  recommendedNextMilestones: readonly SoundGate1CMergedRecommendation[]
  safety: {
    executesTools: false
    importsRun: false
    audioProcessingPerformed: false
    mediaProcessingPerformed: false
    workerExecutionPerformed: false
    workerRouteDryRunAdded: false
    imageBuildsPerformed: false
    dockerActionPerformed: false
    gcpActionPerformed: false
    cloudRunActionPerformed: false
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
