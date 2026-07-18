import { z } from 'zod'

export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_AUTHORITY_VERSION =
  'professional-long-form-source-authority-execution-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_AUTHORIZATION_RECEIPT_VERSION =
  'professional-long-form-source-authority-authorization-receipt-v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_ATTEMPT_VERSION =
  'professional-long-form-source-authority-execution-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_VALIDATION_ARTIFACT_VERSION =
  'professional-long-form-source-authority-validation-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_QA_EVIDENCE_VERSION =
  'professional-long-form-source-authority-qa-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_RECONCILIATION_EVIDENCE_VERSION =
  'professional-long-form-source-authority-reconciliation-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_TERMINAL_EVIDENCE_VERSION =
  'professional-long-form-source-authority-terminal-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COMPLETION_VERSION =
  'professional-long-form-source-authority-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_KIND =
  'validate_private_source_authority' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID =
  'long-form-validate-private-sources' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID =
  'internal.validate_professional_long_form_private_source_authority.v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_RUNNER_CLASS =
  'canonical_professional_long_form_private_source_authority_runner_v1' as const
export const PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID =
  'reeditpro_long_form_source_authority_validation_cpu_2vcpu_4gib_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const expectedOutputIdentity = z.string().trim().min(1).max(512)
const boundedCount = z.number().int().nonnegative().max(100_000)
const jsonBlobRef = z.object({
  sha256,
  byteLength: z.number().int().positive().max(4 * 1024 * 1024),
}).strict()

const exactOperationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID,
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

const sourceExecutionPermissionsSchema = z.object({
  privateLocalLease: z.literal(true),
  oneUseInternalDispatch: z.literal(true),
  canonicalLoaderSourceAuthorityRevalidationRequired: z.literal(true),
  structuredApprovedSourceAuthorityValidation: z.literal(true),
  privateValidationArtifact: z.literal(true),
  privateQaAndReconciliation: z.literal(true),
  runnerDirectSourceMediaByteRead: z.literal(false),
  sourceMediaDecodeOrTransform: z.literal(false),
  render: z.literal(false),
  providerCall: z.literal(false),
  googleCloudDispatch: z.literal(false),
  publicDelivery: z.literal(false),
}).strict()

export const professionalLongFormSourceAuthorityAuthorizationReceiptSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_AUTHORIZATION_RECEIPT_VERSION,
    ),
    source: z.literal(
      'server_persisted_professional_long_form_source_authority_execution_authority',
    ),
    authorizationId: identity,
    authorityRef: jsonBlobRef,
    authorityHash: sha256,
    queueDefinitionHash: sha256,
    jobId: identity,
    approvedWorkItemId: z.literal(
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
    ),
    jobDefinitionHash: sha256,
    placementHash: sha256,
    kind: z.literal(PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_KIND),
    expectedOutputIdentity,
    operation: exactOperationSchema,
    authorizedAt: timestamp,
    reservationExpiresAt: timestamp,
    permissions: sourceExecutionPermissionsSchema,
    commercialBoundary: commercialBoundarySchema,
    receiptHash: sha256,
  }).strict()

export const professionalLongFormSourceAuthorityExecutionAttemptSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_ATTEMPT_VERSION,
    ),
    source: z.literal('private_canonical_package_work_queue_store'),
    executionAttemptId: identity,
    authorizationId: identity,
    authorityHash: sha256,
    jobId: identity,
    approvedWorkItemId: z.literal(
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
    ),
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

export const professionalLongFormSourceAuthorityCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COMPLETION_VERSION,
  ),
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

export const professionalLongFormSourceAuthorityExecutionAuthoritySchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_AUTHORITY_VERSION,
    ),
    source: z.literal(
      'server_reopened_canonical_professional_long_form_source_authority',
    ),
    purpose: z.literal(
      'authorize_one_private_structured_source_authority_validation_child',
    ),
    status: z.literal(
      'source_authority_private_execution_authorized_media_children_blocked',
    ),
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
      approvedWorkItemId: z.literal(
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
      ),
      kind: z.literal(PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_KIND),
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
      approvedSourceManifestHash: sha256,
      approvedSourceManifestRef: jsonBlobRef,
      sourceCandidateHash: sha256,
      sourceManifestSequenceHash: sha256,
      sourceComponentSequenceHash: sha256,
      sourceRangesHash: sha256,
      sourceCleanupPlanHash: sha256,
      sourceJobAuthorityHash: sha256,
      sourceJobDefinitionHash: sha256,
      sourcePlacementHash: sha256,
      rootJobId: identity,
      rootQueueCompletionHash: sha256,
      rootCanonicalResultHash: sha256,
      rootValidationArtifactRef: jsonBlobRef,
      rootQaEvidenceRef: jsonBlobRef,
      rootReconciliationEvidenceRef: jsonBlobRef,
      rootTerminalEvidenceRef: jsonBlobRef,
      rootAttemptInternalCostEvidenceHash: sha256,
      rootCompletionEventHash: sha256,
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
    permissions: sourceExecutionPermissionsSchema.extend({
      immutableRootCompletionRequired: z.literal(true),
      exactApprovedSourceManifestRequired: z.literal(true),
      exactFrameRangeAndCleanupLineageRequired: z.literal(true),
      directDownstreamDependencyEvidence: z.literal(true),
      furtherChildExecution: z.literal(false),
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

export const professionalLongFormSourceAuthorityValidationArtifactSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_VALIDATION_ARTIFACT_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_private_source_authority_runner',
    ),
    identity: z.object({
      workspaceId: identity,
      projectId: identity,
      editSessionId: identity,
      approvedPlanSnapshotId: identity,
      packageRecordId: identity,
      jobId: identity,
      approvedWorkItemId: z.literal(
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
      ),
      executionAttemptId: identity,
    }).strict(),
    authority: z.object({
      executionAuthorityId: identity,
      authorityHash: sha256,
      executionAttemptHash: sha256,
      queueDefinitionHash: sha256,
      claimHash: sha256,
      approvedPlanSnapshotHash: sha256,
      approvedSourceManifestHash: sha256,
      sourceRangesHash: sha256,
      sourceCleanupPlanHash: sha256,
      sourceJobAuthorityHash: sha256,
      sourceJobDefinitionHash: sha256,
      sourcePlacementHash: sha256,
      rootQueueCompletionHash: sha256,
      rootCanonicalResultHash: sha256,
    }).strict(),
    operation: exactOperationSchema,
    sourceCoverage: z.object({
      sourceRangeCount: z.number().int().positive().max(512),
      approvedBindingCount: z.number().int().positive().max(1_000),
      requiredBindingCount: boundedCount,
      referencedBindingCount: z.number().int().positive().max(1_000),
      referencedRequiredBindingCount: boundedCount,
      cleanupDecisionCount: z.number().int().positive().max(10_000),
      referencedCleanupDecisionCount: z.number().int().positive().max(10_000),
      matchedSegmentCount: z.number().int().positive().max(2_000),
      totalFrames: z.number().int().positive().max(1_296_000),
      runtimeRegion: z.enum(['us-east1', 'europe-west1']),
      localPrivateBindingCount: boundedCount,
      googleCloudStorageBindingCount: boundedCount,
      gcsGenerationAndEtagBindingCount: boundedCount,
      localGenerationConventionRangeCount: boundedCount,
      exactGenerationRangeCount: boundedCount,
    }).strict(),
    hashes: z.object({
      sourceRangesHash: sha256,
      bindingSetHash: sha256,
      cleanupDecisionSetHash: sha256,
      rangeToBindingLineageHash: sha256,
      rangeToCleanupLineageHash: sha256,
      segmentTimelineLineageHash: sha256,
      timelineCoverageHash: sha256,
    }).strict(),
    checks: z.array(z.object({
      checkId: z.enum([
        'approved_source_manifest_integrity',
        'source_sequence_order_and_binding_integrity',
        'source_range_expected_output_integrity',
        'source_object_checksum_size_generation_integrity',
        'source_cleanup_decision_containment_integrity',
        'segment_timeline_authority_integrity',
        'frame_exact_gap_free_timeline_coverage',
        'single_region_range_policy_integrity',
        'root_dependency_and_one_use_attempt_integrity',
        'required_binding_coverage_integrity',
        'commercial_boundary_integrity',
        'no_direct_media_execution_authority',
      ]),
      status: z.literal('passed'),
    }).strict()).length(12),
    readinessTruth: z.object({
      canonicalLoaderSourceAuthorityRevalidated: z.literal(true),
      runnerDirectSourceBytesRead: z.literal(false),
      mediaDecoded: z.literal(false),
      sourceObjectResidencyVerified: z.literal(false),
      sourceFrameCapacityVerified: z.literal(false),
      sourceTransformed: z.literal(false),
      rendered: z.literal(false),
    }).strict(),
    valid: z.literal(true),
    validatedAt: timestamp,
    artifactHash: sha256,
  }).strict().superRefine((artifact, context) => {
    const coverage = artifact.sourceCoverage
    if (
      coverage.referencedBindingCount > coverage.approvedBindingCount ||
      coverage.requiredBindingCount > coverage.approvedBindingCount ||
      coverage.referencedRequiredBindingCount !== coverage.requiredBindingCount ||
      coverage.localPrivateBindingCount + coverage.googleCloudStorageBindingCount !==
        coverage.approvedBindingCount ||
      coverage.gcsGenerationAndEtagBindingCount !==
        coverage.googleCloudStorageBindingCount ||
      coverage.exactGenerationRangeCount !== coverage.sourceRangeCount
    ) {
      context.addIssue({
        code: 'custom',
        path: ['sourceCoverage'],
        message: 'Professional long-form source coverage counts are inconsistent.',
      })
    }
  })

export const professionalLongFormSourceAuthorityQaEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_QA_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_professional_long_form_source_authority_qa'),
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
    approvedManifestAndRangeLineage: z.literal('passed'),
    checksumSizeGenerationAndCleanup: z.literal('passed'),
    frameExactTimelineCoverage: z.literal('passed'),
    queueRootAttemptAndReservationBoundary: z.literal('passed'),
    noDecodeTransformRenderOrCommercialAuthority: z.literal('passed'),
  }).strict(),
  outcome: z.literal('passed'),
  evaluatedAt: timestamp,
  qaHash: sha256,
}).strict()

const directDownstreamSchema = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  kind: z.enum([
    'render_object_mezzanine_chunk',
    'mix_continuous_program_audio',
  ]),
  dependencyJobIds: z.array(identity).min(1).max(128),
  sourceDependencyJobId: identity,
  sourceDependencySatisfiedByThisCompletion: z.literal(true),
  executionAuthorized: z.literal(false),
  capabilityBlocked: z.literal(true),
}).strict()

export const professionalLongFormSourceAuthorityReconciliationEvidenceSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_RECONCILIATION_EVIDENCE_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_source_dependency_reconciliation',
    ),
    identity: z.object({
      workspaceId: identity,
      projectId: identity,
      approvedPlanSnapshotId: identity,
      completedJobId: identity,
      completedWorkItemId: z.literal(
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
      ),
      executionAttemptId: identity,
    }).strict(),
    executionAuthorityId: identity,
    authorityHash: sha256,
    validationArtifactRef: jsonBlobRef,
    qaEvidenceRef: jsonBlobRef,
    qaOutcome: z.literal('passed'),
    directDownstream: z.array(directDownstreamSchema).min(1).max(128),
    summary: z.object({
      directDownstreamCount: z.number().int().positive().max(128),
      renderJobCount: boundedCount,
      continuousAudioJobCount: z.literal(1),
      remainingQueueJobCountAfterCompletion: boundedCount,
      allDirectDownstreamExecutionBlocked: z.literal(true),
      directDownstreamHash: sha256,
    }).strict(),
    decision: z.literal(
      'source_dependency_evidence_ready_downstream_operation_and_other_dependencies_blocked',
    ),
    reconciledAt: timestamp,
    reconciliationHash: sha256,
  }).strict().superRefine((evidence, context) => {
    if (
      evidence.directDownstream.length !== evidence.summary.directDownstreamCount ||
      evidence.directDownstream.filter((entry) =>
        entry.kind === 'render_object_mezzanine_chunk').length !==
        evidence.summary.renderJobCount ||
      evidence.directDownstream.filter((entry) =>
        entry.kind === 'mix_continuous_program_audio').length !== 1
    ) {
      context.addIssue({
        code: 'custom',
        path: ['summary'],
        message: 'Professional long-form source reconciliation counts are inconsistent.',
      })
    }
  })

export const professionalLongFormSourceAuthorityTerminalEvidenceSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_TERMINAL_EVIDENCE_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_source_authority_execution_service',
    ),
    identity: z.object({
      workspaceId: identity,
      projectId: identity,
      approvedPlanSnapshotId: identity,
      jobId: identity,
      approvedWorkItemId: z.literal(
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
      ),
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
      structuredSourceAuthorityValidated: z.literal(true),
      directDownstreamDependencyEvidenceCreated: z.literal(true),
      downstreamExecutionAuthorized: z.literal(false),
      sourceMediaDecodeOrTransformAuthorized: z.literal(false),
      providerCallAuthorized: z.literal(false),
      renderAuthorized: z.literal(false),
      publicDeliveryAuthorized: z.literal(false),
    }).strict(),
    commercialBoundary: commercialBoundarySchema,
    completedAt: timestamp,
    terminalHash: sha256,
  }).strict()

export type ProfessionalLongFormSourceAuthorityAuthorizationReceipt = z.infer<
  typeof professionalLongFormSourceAuthorityAuthorizationReceiptSchema
>
export type ProfessionalLongFormSourceAuthorityExecutionAttempt = z.infer<
  typeof professionalLongFormSourceAuthorityExecutionAttemptSchema
>
export type ProfessionalLongFormSourceAuthorityCompletion = z.infer<
  typeof professionalLongFormSourceAuthorityCompletionSchema
>
export type ProfessionalLongFormSourceAuthorityExecutionAuthority = z.infer<
  typeof professionalLongFormSourceAuthorityExecutionAuthoritySchema
>
export type ProfessionalLongFormSourceAuthorityValidationArtifact = z.infer<
  typeof professionalLongFormSourceAuthorityValidationArtifactSchema
>
export type ProfessionalLongFormSourceAuthorityQaEvidence = z.infer<
  typeof professionalLongFormSourceAuthorityQaEvidenceSchema
>
export type ProfessionalLongFormSourceAuthorityReconciliationEvidence = z.infer<
  typeof professionalLongFormSourceAuthorityReconciliationEvidenceSchema
>
export type ProfessionalLongFormSourceAuthorityTerminalEvidence = z.infer<
  typeof professionalLongFormSourceAuthorityTerminalEvidenceSchema
>
