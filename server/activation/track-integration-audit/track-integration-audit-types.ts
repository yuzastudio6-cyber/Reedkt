export type TrackIntegrationAuditStatus = 'planned' | 'completed' | 'blocked'
export type TrackIntegrationReadinessStatus = 'ready' | 'partial' | 'blocked'

export type TrackIntegrationAuditGateId =
  | 'track_a_evidence_valid'
  | 'track_b_evidence_valid_or_blocked_with_reason'
  | 'ownership_boundaries_clear'
  | 'tool_registry_consistent'
  | 'package_scripts_consistent'
  | 'docs_consistent'
  | 'readiness_state_consistent'
  | 'no_stale_contradictory_status'
  | 'no_public_access'
  | 'production_beta_gates_blocked'
  | 'integration_readiness_decision'

export interface TrackIntegrationAuditConfig {
  phase: '47A'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'track_integration_audit'
  trackAClosureRunId: 'phase45f-20260601T01103'
  trackAEvidenceManifestGcsUri: string
  trackAReportGcsUri: string
  trackBCanonicalBranch: 'codex/rp-activation-39c-generated-vlm-runtime-verification'
  trackBVlmRunId: 'phase39c-20260531T214216'
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
}

export interface TrackIntegrationEvidenceItem {
  track: 'A' | 'B'
  phase: string
  label: string
  status: 'ready' | 'passed' | 'verified' | 'partial' | 'blocked' | 'planned'
  runId?: string
  reportScript?: string
  artifactUris: string[]
  blockers: string[]
  warnings: string[]
  summary: string
}

export interface TrackIntegrationTrackSummary {
  track: 'A' | 'B'
  status: TrackIntegrationReadinessStatus
  readyEvidenceCount: number
  blockedEvidenceCount: number
  evidence: TrackIntegrationEvidenceItem[]
  blockers: string[]
  warnings: string[]
  summary: string
}

export interface TrackIntegrationOwnershipEntry {
  toolId: string
  owner: 'Track A' | 'Track B' | 'Inactive' | 'Evaluation only'
  productScope: string
  status: 'active_internal' | 'blocked' | 'inactive_removed' | 'evaluation_only'
  notes: string
}

export interface TrackIntegrationOwnershipMatrix {
  trackATools: TrackIntegrationOwnershipEntry[]
  trackBTools: TrackIntegrationOwnershipEntry[]
  inactiveTools: TrackIntegrationOwnershipEntry[]
  sharedInfrastructureNotes: string[]
  conflicts: string[]
}

export interface TrackIntegrationConsistencyCheck {
  checkId: string
  status: 'passed' | 'blocked' | 'warning'
  summary: string
  blockers: string[]
  warnings: string[]
}

export interface TrackIntegrationRegistryReconciliation {
  packageScripts: TrackIntegrationConsistencyCheck
  toolRegistry: TrackIntegrationConsistencyCheck
  workerRuntimeOwnership: TrackIntegrationConsistencyCheck
}

export interface TrackIntegrationDocsReconciliation {
  docs: TrackIntegrationConsistencyCheck
  readinessState: TrackIntegrationConsistencyCheck
  staleContradictions: TrackIntegrationConsistencyCheck
}

export interface TrackIntegrationReadinessDecision {
  status: 'ready_for_system_level_internal_testing_gate' | 'blocked'
  reason: string
  remainingBlockers: string[]
}

export interface TrackIntegrationAuditArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface TrackIntegrationAuditQaGate {
  gateId: TrackIntegrationAuditGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface TrackIntegrationAuditQaSummary {
  status: 'passed' | 'blocked'
  gates: TrackIntegrationAuditQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface TrackIntegrationAuditManifest {
  phase: '47A'
  runId: string
  createdAt: string
  trackA: TrackIntegrationTrackSummary
  trackB: TrackIntegrationTrackSummary
  ownershipMatrix: TrackIntegrationOwnershipMatrix
  registryReconciliation: TrackIntegrationRegistryReconciliation
  docsReconciliation: TrackIntegrationDocsReconciliation
  readinessDecision: TrackIntegrationReadinessDecision
  blockedScopes: string[]
}

export interface TrackIntegrationAuditExecutionReport {
  ok: boolean
  phase: '47A'
  runId: string
  projectId: 'reeditpro'
  runtimeMode: 'track_integration_audit'
  trackA: TrackIntegrationTrackSummary
  trackB: TrackIntegrationTrackSummary
  ownershipMatrix: TrackIntegrationOwnershipMatrix
  registryReconciliation: TrackIntegrationRegistryReconciliation
  docsReconciliation: TrackIntegrationDocsReconciliation
  readinessDecision: TrackIntegrationReadinessDecision
  artifacts: TrackIntegrationAuditArtifact[]
  qa: TrackIntegrationAuditQaSummary
  safety: {
    mediaProcessed: false
    providerExecuted: false
    dockerBuiltOrPushed: false
    cloudRunDeployedOrExecuted: false
    publicAccessEnabled: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
    finalDeliveryAllowed: false
    revideoUsed: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedTrackIntegrationAuditEvidence {
  phase: '47A'
  status: 'not_run' | 'completed' | 'blocked'
  runId?: string
  integrationManifestUri?: string
  trackAEvidenceUri?: string
  trackBEvidenceUri?: string
  ownershipMatrixUri?: string
  registryReconciliationUri?: string
  docsReconciliationUri?: string
  qaReportUri?: string
  trackAReadiness: {
    status: TrackIntegrationReadinessStatus
    reason: string
  }
  trackBReadiness: {
    status: TrackIntegrationReadinessStatus
    reason: string
  }
  integrationReadiness: TrackIntegrationReadinessDecision
  blockers: string[]
  warnings: string[]
}

export interface TrackIntegrationAuditReport {
  reportId: 'activation-phase-47a-track-integration-audit'
  createdAt: string
  config: TrackIntegrationAuditConfig
  approvedEvidence: ApprovedTrackIntegrationAuditEvidence
  executionReport?: TrackIntegrationAuditExecutionReport
  status: TrackIntegrationAuditStatus
  trackA: TrackIntegrationTrackSummary
  trackB: TrackIntegrationTrackSummary
  ownershipMatrix: TrackIntegrationOwnershipMatrix
  registryReconciliation: TrackIntegrationRegistryReconciliation
  docsReconciliation: TrackIntegrationDocsReconciliation
  readinessDecision: TrackIntegrationReadinessDecision
  blockers: string[]
  warnings: string[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  finalDeliveryAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface TrackIntegrationAuditIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
  reportOnly: true
}

export interface TrackIntegrationAuditCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  warnings: string[]
}
