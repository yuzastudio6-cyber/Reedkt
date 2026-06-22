import type {
  ProductionToolId,
} from '../tool-registry'

export type SoundGate1BMergedItemType =
  | 'accepted_worker_name'
  | 'accepted_job_type'
  | 'rejected_job_type'
  | 'blocked_gate'
  | 'owner_handoff_surface'
  | 'related_sound_tool'
  | 'gate_1c_next_prompt'

export type SoundGate1BMergedEvidenceStatus =
  | 'merged_owner_source_evidence'
  | 'blocked_by_owner_gate'
  | 'not_accepted_for_worker_contract'
  | 'owner_next_prompt_only'
  | 'unknown'

export type SoundGate1BMergedExecutionGate =
  | 'blocked_no_execution'
  | 'blocked_pending_gate_1c_cpu_worker_image_plan'
  | 'blocked_pending_gate_1d_worker_runtime_owner_handoff'
  | 'blocked_pending_media_policy'
  | 'blocked_pending_model_review'
  | 'blocked_owner_handoff_required'
  | 'planning_only'

export type SoundGate1BMergedPendingAction =
  | 'wait_for_gate_1c_cpu_worker_image_plan'
  | 'wait_for_gate_1d_worker_runtime_owner_handoff'
  | 'wait_for_media_policy_handoff'
  | 'wait_for_model_weight_review'
  | 'future_worker_route_dry_run_after_owner_gate'
  | 'do_not_duplicate_owner_lane'
  | 'none'

export type SoundGate1BMergedDuplicateRisk =
  | 'none'
  | 'do_not_duplicate_owner_lane'
  | 'possible_duplicate_worker_route'
  | 'possible_duplicate_worker_job_table'
  | 'possible_duplicate_owner_lane'

export interface SoundGate1BMergedCoverage {
  hasFirstClassStudyCard: boolean
  hasCandidateStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasControlledProbe: boolean
  hasWorkerRouteDryRun: boolean
}

export interface SoundGate1BMergedSafetyFlags {
  acceptedForExecution: false
  workerDispatchAllowedNow: false
  routeExecutionAllowedNow: false
  toolExecutionAllowedNow: false
  mediaProcessingAllowedNow: false
  supabaseMutationAllowedNow: false
  sqlAllowedNow: false
  publicArtifactsAllowedNow: false
  betaProductionAllowedNow: false
}

export interface SoundGate1BMergedSeedRow extends SoundGate1BMergedSafetyFlags {
  normalizedItemId: string
  displayName: string
  itemType: SoundGate1BMergedItemType
  gate1bEvidenceStatus: readonly SoundGate1BMergedEvidenceStatus[]
  prNumber: 653
  prMerged: true
  mergeCommit: '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91'
  evidenceIsFinalSourceOfTruth: true
  sourceEvidence: readonly string[]
  relatedProductionToolIds: readonly ProductionToolId[]
  relatedCandidateStudyCards: readonly string[]
  acceptedByGate1B: boolean
  currentToolCallingCoverage: SoundGate1BMergedCoverage
  executionGate: SoundGate1BMergedExecutionGate
  toolCallingPendingAction: SoundGate1BMergedPendingAction
  duplicateRisk: SoundGate1BMergedDuplicateRisk
  notes: string
}

export interface SoundGate1BMergedReconciliationMatrixDocument {
  schema: 'reeditpro.soundGate1BMergedReconciliationMatrix.v1'
  evidenceSummary: {
    sourcePr: 653
    sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-1B'
    sourceDecision: string
    prMerged: true
    mergeCommit: '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91'
    evidenceIsFinalSourceOfTruth: true
    acceptedWorkerNameCount: 2
    acceptedJobTypeCount: 4
    notAcceptedJobTypeCount: 1
    blockedGateCount: 18
    ownerHandoffSurfaceCount: 9
    relatedSoundToolCount: 23
    gate1cNextPromptCount: 1
    acceptedWorkerNames: readonly ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
    acceptedJobTypes: readonly [
      'sound.package_import_smoke',
      'sound.numeric_array_analysis',
      'sound.symbolic_midi_analysis',
      'sound.loudness_synthetic_analysis',
    ]
    notAcceptedJobTypes: readonly ['sound.synthetic_fixture_validate']
    blockedGates: readonly string[]
    ownerHandoffSurfaces: readonly string[]
    nextOwnerPrompt: 'SOUND-RUNTIME-MEDIA-GATE-1C: CPU worker image plan, no Docker/GCP execution'
    gate1aAcceptedEvidence: {
      sourcePr: 647
      requirementsPath: 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'
      metadataPassed: 13
      importsPassed: 14
      failedImports: 0
      tempVenvRemoved: true
      packageLockUnchangedByProof: true
    }
    workerRouteDryRunAdded: false
    workerExecutionPerformed: false
    importsRun: false
    adaptersAdded: 0
    commandIntentsAdded: 0
    probesAdded: 0
  }
  rows: readonly SoundGate1BMergedSeedRow[]
}

export interface SoundGate1BMergedSourceBundle {
  matrixDocument: SoundGate1BMergedReconciliationMatrixDocument
}

export interface SoundGate1BMergedRecommendation {
  milestone: string
  reason: string
  affectedItemIds: readonly string[]
}

export interface SoundGate1BMergedCoverageAnalysis {
  matrixRows: readonly SoundGate1BMergedSeedRow[]
  sourcePr: 653
  mergeCommit: '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91'
  evidenceIsFinalSourceOfTruth: true
  gate1bMatrixRows: number
  acceptedWorkerNameCount: 2
  acceptedJobTypeCount: 4
  notAcceptedJobTypeCount: number
  blockedRowCount: number
  ownerHandoffSurfaceCount: 9
  relatedSoundToolCount: 23
  productionToolIdCount: number
  productionToolIdCountChanged: false
  adaptersAdded: 0
  commandIntentsAdded: 0
  probesAdded: 0
  workerRouteDryRunAdded: false
  workerExecutionPerformed: false
  importsRun: false
  acceptedWorkerNames: readonly string[]
  acceptedJobTypes: readonly string[]
  notAcceptedJobTypes: readonly string[]
  ownerHandoffSurfaces: readonly string[]
  blockedRows: readonly string[]
  recommendedNextMilestones: readonly SoundGate1BMergedRecommendation[]
  safety: {
    executesTools: false
    importsRun: false
    audioProcessingPerformed: false
    mediaProcessingPerformed: false
    workerExecutionPerformed: false
    workerRouteDryRunAdded: false
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
