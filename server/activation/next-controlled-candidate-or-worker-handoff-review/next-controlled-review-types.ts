export type NextControlledCandidateDecision =
  | 'recommended_next_controlled_candidate_approval'
  | 'recommended_worker_handoff_review_before_next_candidate'
  | 'blocked_pending_candidate_inventory'
  | 'blocked_pending_worker_handoff_requirements'
  | 'blocked_pending_artifact_scope_policy'
  | 'blocked_pending_observability_cost_audit'
  | 'blocked_pending_route_manifest_evidence'
  | 'rejected_due_runtime_safety_risk'

export type NextControlledBooleanFlags = Record<
  | 'routeExecutionAllowed'
  | 'runtimeExecutionAllowed'
  | 'toolExecutionAllowed'
  | 'workerExecutionAllowed'
  | 'providerExecutionAllowed'
  | 'mediaProcessingAllowed'
  | 'audioProcessingAllowed'
  | 'renderExecutionAllowed'
  | 'exportExecutionAllowed'
  | 'imageGenerationAllowed'
  | 'imageEditingAllowed'
  | 'browserCaptureAllowed'
  | 'mapRenderingAllowed'
  | 'supabaseWritesAllowed'
  | 'sqlAllowed'
  | 'gcsUploadAllowed'
  | 'publicArtifactsAllowed'
  | 'signedUrlsAsSourceOfTruthAllowed'
  | 'dependencyMutationAllowed'
  | 'rawPromptExecutionAllowed'
  | 'externalBetaUnlockAllowed'
  | 'paidProductionUnlockAllowed'
  | 'productionUnlockAllowed'
  | 'githubPrMergeAllowed'
  | 'secretPayloadAccessed'
  | 'secretPayloadPrinted'
  | 'secretPayloadCommitted',
  boolean
>

export interface NextControlledPrEvidence {
  number: number
  title: string
  state: string
  mergedAt: string | null
  isDraft: boolean
  baseRefName: string
  headRefName: string
  headRefOid: string
  mergeStateStatus?: string
  url: string
}

export interface NextControlledCandidate {
  candidateId: string
  candidateClass: string
  ownerLane: string
  evidenceSource: string
  expectedInput: string
  expectedOutput: string
  sideEffects: string[]
  requiresWorker: boolean
  requiresSupabase: boolean
  requiresGcs: boolean
  requiresProvider: boolean
  requiresMedia: boolean
  requiresPublicArtifact: boolean
  routeCapabilityManifestSupport: string
  ownerStudyCoverage: string
  riskClass: 'lowest' | 'low' | 'medium' | 'blocked'
  approvedAsNextCandidate: boolean
  reason: string
  sourceFixtureId?: string
  sourceRouteCandidateId?: string
}

export interface NextControlledReportSet {
  sourceOfTruthAudit: Record<string, unknown>
  preReviewRevalidation: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  candidateInventory: Record<string, unknown>
  riskRanking: Record<string, unknown>
  workerHandoffReadinessReview: Record<string, unknown>
  artifactSourceOfTruthReview: Record<string, unknown>
  observabilityCostAuditReview: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
