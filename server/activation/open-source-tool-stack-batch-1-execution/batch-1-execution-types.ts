export type Batch1ProofStatus =
  | 'passed'
  | 'blocked_missing_dependency_or_module'
  | 'blocked_missing_system_binary'
  | 'blocked_validation_failed'
  | 'not_run'

export type Batch1ExecutionDecision =
  | 'open_source_tool_stack_batch_1_execution_passed_ready_for_batch_1_qa_review'
  | 'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools'
  | 'blocked_pending_batch_1_dependency_presence'
  | 'blocked_pending_batch_1_system_binary_presence'
  | 'blocked_pending_batch_1_proof_validation'
  | 'blocked_pending_package_lock_integrity'
  | 'rejected_due_runtime_safety_risk'

export type Batch1ProofReport = {
  schema: string
  generatedAt: string
  targetId: string
  targetName: string
  status: Batch1ProofStatus
  passed: boolean
  optional: boolean
  commandClass: string
  installAttempted: false
  packageLockMutationAttempted: false
  mediaProcessingAttempted: false
  stdoutPreview?: string
  stderrPreview?: string
  version?: string | null
  details?: Record<string, unknown>
  blocker?: string | null
}

export type Batch1ExecutionFlags = Record<string, false>

export type Batch1ExecutionReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  dependencyBaselineValidation: Record<string, unknown>
  selectedTargetGuard: Record<string, unknown>
  duckdbProof: Batch1ProofReport
  polarsProof: Batch1ProofReport
  sharpLibvipsProof: Batch1ProofReport
  ffmpegProof: Batch1ProofReport
  ffprobeProof: Batch1ProofReport
  routeCapabilityManifestValidation: Record<string, unknown>
  fixtureReportValidation: Record<string, unknown>
  inventoryProofMatrixValidation: Record<string, unknown>
  sideEffectAndLockIntegrity: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
