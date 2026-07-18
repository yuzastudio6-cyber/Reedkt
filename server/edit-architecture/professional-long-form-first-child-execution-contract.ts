import { z } from 'zod'

export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_AUTHORITY_VERSION =
  'professional-long-form-first-child-execution-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_AUTHORIZATION_RECEIPT_VERSION =
  'professional-long-form-first-child-authorization-receipt-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_ATTEMPT_VERSION =
  'professional-long-form-first-child-execution-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_VALIDATION_ARTIFACT_VERSION =
  'professional-long-form-first-child-validation-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_QA_EVIDENCE_VERSION =
  'professional-long-form-first-child-qa-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_RECONCILIATION_EVIDENCE_VERSION =
  'professional-long-form-first-child-reconciliation-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_TERMINAL_EVIDENCE_VERSION =
  'professional-long-form-first-child-terminal-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_COMPLETION_VERSION =
  'professional-long-form-first-child-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_KIND =
  'validate_approved_snapshot' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID =
  'long-form-validate-approved-snapshot' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_KIND =
  'validate_private_source_authority' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_WORK_ITEM_ID =
  'long-form-validate-private-sources' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID =
  'internal.validate_professional_long_form_snapshot_authority.v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_RUNNER_CLASS =
  'canonical_professional_long_form_snapshot_validation_runner_v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID =
  'reeditpro_long_form_snapshot_validation_cpu_2vcpu_4gib_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const expectedOutputIdentity = z.string().trim().min(1).max(512)
const jsonBlobRef = z.object({
  sha256,
  byteLength: z.number().int().positive().max(4 * 1024 * 1024),
}).strict()

const exactOperationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID,
  ),
}).strict()

const commercialBoundarySchema = z.object({
  internalProductionCostOnly: z.literal(true),
  customerPriceAuthorityIncluded: z.literal(false),
  customerCreditAuthorityIncluded: z.literal(false),
  serviceFeeAuthorityIncluded: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

export const professionalLongFormFirstChildAuthorizationReceiptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_AUTHORIZATION_RECEIPT_VERSION,
  ),
  source: z.literal('server_persisted_professional_long_form_first_child_authority'),
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID),
  jobDefinitionHash: sha256,
  placementHash: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_KIND),
  expectedOutputIdentity,
  operation: exactOperationSchema,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    privateValidationArtifact: z.literal(true),
    privateQaAndReconciliation: z.literal(true),
    providerCall: z.literal(false),
    sourceMediaReadOrTransform: z.literal(false),
    render: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}).strict()

export const professionalLongFormFirstChildExecutionAttemptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_ATTEMPT_VERSION,
  ),
  source: z.literal('private_canonical_package_work_queue_store'),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  jobId: identity,
  approvedWorkItemId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID),
  claimId: identity,
  claimHash: sha256,
  workerIdentityHash: sha256,
  deliveryAttempt: z.literal(1),
  operation: exactOperationSchema,
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}).strict()

export const professionalLongFormFirstChildCompletionSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_COMPLETION_VERSION),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: exactOperationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  validationArtifactRef: jsonBlobRef,
  qaEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export const professionalLongFormFirstChildExecutionAuthoritySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_AUTHORITY_VERSION,
  ),
  source: z.literal('server_reopened_canonical_professional_long_form_authority'),
  purpose: z.literal('authorize_one_private_snapshot_validation_child'),
  status: z.literal('first_child_private_execution_authorized_remaining_children_blocked'),
  identity: z.object({
    ownerUserId: identity,
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanId: identity,
    approvedPlanSnapshotId: identity,
    approvedPlanSnapshotHash: sha256,
    packageRecordId: identity,
    jobId: identity,
    approvedWorkItemId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID),
    kind: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_KIND),
    expectedOutputIdentity,
  }).strict(),
  approval: z.object({
    approvedByUserId: identity,
    approvalRecordId: identity,
    approvedEstimateId: identity,
    creditReservationId: identity,
    reservationStatus: z.literal('reserved'),
    remainingReservedCredits: z.number().int().positive(),
    reservationExpiresAt: timestamp,
    snapshotApprovedAt: timestamp,
  }).strict(),
  lineage: z.object({
    planningAuthorityHash: sha256,
    planHash: sha256,
    estimateHash: sha256,
    workGraphHash: sha256,
    timingHash: sha256,
    bridgeAuthorityHash: sha256,
    bridgeRef: jsonBlobRef,
    childJobManifestHash: sha256,
    childJobManifestRef: jsonBlobRef,
    childPackageHash: sha256,
    childPackageRef: jsonBlobRef,
    childPlacementManifestHash: sha256,
    childPlacementManifestRef: jsonBlobRef,
    queueDefinitionHash: sha256,
    queueCreatedEventHash: sha256,
    rootJobAuthorityHash: sha256,
    rootJobDefinitionHash: sha256,
    rootPlacementHash: sha256,
  }).strict(),
  operation: exactOperationSchema.extend({
    workerType: z.literal('api_service'),
    resourceClassId: z.literal('control_plane_cpu_v1'),
    maximumAttempts: z.literal(1),
    attemptTimeoutSeconds: z.literal(300),
    leaseDurationMilliseconds: z.literal(60_000),
    vcpuCount: z.literal(2),
    memoryGib: z.literal(4),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    immutableAuthorityValidation: z.literal(true),
    privateValidationArtifact: z.literal(true),
    privateQa: z.literal(true),
    privateReconciliation: z.literal(true),
    downstreamDependencyEvidence: z.literal(true),
    furtherChildExecution: z.literal(false),
    providerCall: z.literal(false),
    sourceMediaReadOrTransform: z.literal(false),
    render: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  persistence: z.object({
    privateLocalContentAddressed: z.literal(true),
    queueReceiptRequiredBeforeLease: z.literal(true),
    queueAttemptRequiredBeforeOperation: z.literal(true),
    queueCompletionIsAuthorityCommit: z.literal(true),
    orphanBlobsGrantExecutionAuthority: z.literal(false),
    distributedDatabaseBacked: z.literal(false),
    productionDurabilityProven: z.literal(false),
  }).strict(),
  authorizedAt: timestamp,
  authorityHash: sha256,
}).strict()

export const professionalLongFormFirstChildValidationArtifactSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_VALIDATION_ARTIFACT_VERSION,
  ),
  source: z.literal('canonical_professional_long_form_snapshot_validation_runner'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    jobId: identity,
    approvedWorkItemId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID),
    executionAttemptId: identity,
  }).strict(),
  authority: z.object({
    executionAuthorityId: identity,
    authorityHash: sha256,
    executionAttemptHash: sha256,
    queueDefinitionHash: sha256,
    claimHash: sha256,
    approvedPlanSnapshotHash: sha256,
    childPackageHash: sha256,
    childJobManifestHash: sha256,
    childPlacementManifestHash: sha256,
    rootJobAuthorityHash: sha256,
    rootJobDefinitionHash: sha256,
    rootPlacementHash: sha256,
  }).strict(),
  operation: exactOperationSchema,
  checks: z.array(z.object({
    checkId: z.enum([
      'approved_snapshot_integrity',
      'funded_reservation_integrity',
      'bridge_and_child_manifest_integrity',
      'child_package_and_placement_integrity',
      'queue_definition_integrity',
      'root_job_identity_integrity',
      'one_use_execution_attempt_integrity',
      'commercial_boundary_integrity',
    ]),
    status: z.literal('passed'),
  }).strict()).length(8),
  valid: z.literal(true),
  validatedAt: timestamp,
  artifactHash: sha256,
}).strict()

export const professionalLongFormFirstChildQaEvidenceSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_QA_EVIDENCE_VERSION),
  source: z.literal('canonical_professional_long_form_snapshot_validation_qa'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    approvedPlanSnapshotId: identity,
    jobId: identity,
    executionAttemptId: identity,
  }).strict(),
  executionAuthorityId: identity,
  authorityHash: sha256,
  validationArtifactRef: jsonBlobRef,
  validationArtifactHash: sha256,
  checks: z.object({
    schemaAndChecksum: z.literal('passed'),
    approvedAuthorityLineage: z.literal('passed'),
    queueAndAttemptLineage: z.literal('passed'),
    reservationBoundary: z.literal('passed'),
    noProviderMediaRenderOrCommercialAuthority: z.literal('passed'),
  }).strict(),
  outcome: z.literal('passed'),
  evaluatedAt: timestamp,
  qaHash: sha256,
}).strict()

export const professionalLongFormFirstChildReconciliationEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_RECONCILIATION_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_professional_long_form_dependency_reconciliation'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    approvedPlanSnapshotId: identity,
    completedJobId: identity,
    completedWorkItemId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID),
    executionAttemptId: identity,
  }).strict(),
  executionAuthorityId: identity,
  authorityHash: sha256,
  validationArtifactRef: jsonBlobRef,
  qaEvidenceRef: jsonBlobRef,
  qaOutcome: z.literal('passed'),
  downstream: z.object({
    jobId: identity,
    approvedWorkItemId: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_WORK_ITEM_ID,
    ),
    kind: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_KIND),
    dependencyJobId: identity,
    dependencySatisfiedByThisCompletion: z.literal(true),
    executionAuthorized: z.literal(false),
    capabilityBlocked: z.literal(true),
  }).strict(),
  decision: z.literal('private_dependency_evidence_ready_downstream_execution_blocked'),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormFirstChildTerminalEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_TERMINAL_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_professional_long_form_first_child_execution_service'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    approvedPlanSnapshotId: identity,
    jobId: identity,
    approvedWorkItemId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID),
    executionAttemptId: identity,
  }).strict(),
  executionAuthorityId: identity,
  authorityHash: sha256,
  operation: exactOperationSchema,
  validationArtifactRef: jsonBlobRef,
  qaEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  permissions: z.object({
    downstreamDependencyEvidenceCreated: z.literal(true),
    downstreamExecutionAuthorized: z.literal(false),
    mediaExecutionAuthorized: z.literal(false),
    providerCallAuthorized: z.literal(false),
    renderAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export type ProfessionalLongFormFirstChildAuthorizationReceipt = z.infer<
  typeof professionalLongFormFirstChildAuthorizationReceiptSchema
>
export type ProfessionalLongFormFirstChildExecutionAttempt = z.infer<
  typeof professionalLongFormFirstChildExecutionAttemptSchema
>
export type ProfessionalLongFormFirstChildCompletion = z.infer<
  typeof professionalLongFormFirstChildCompletionSchema
>
export type ProfessionalLongFormFirstChildExecutionAuthority = z.infer<
  typeof professionalLongFormFirstChildExecutionAuthoritySchema
>
export type ProfessionalLongFormFirstChildValidationArtifact = z.infer<
  typeof professionalLongFormFirstChildValidationArtifactSchema
>
export type ProfessionalLongFormFirstChildQaEvidence = z.infer<
  typeof professionalLongFormFirstChildQaEvidenceSchema
>
export type ProfessionalLongFormFirstChildReconciliationEvidence = z.infer<
  typeof professionalLongFormFirstChildReconciliationEvidenceSchema
>
export type ProfessionalLongFormFirstChildTerminalEvidence = z.infer<
  typeof professionalLongFormFirstChildTerminalEvidenceSchema
>
