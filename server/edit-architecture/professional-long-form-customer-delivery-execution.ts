import type {
  OfflineRemotionDeliveryH264ChunkStreamingResult,
  OfflineRemotionRuntimeAuthority,
} from '../tool-execution/remotion-render-execution'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  './canonical-private-package-work-queue-authority'
import type {
  CanonicalProfessionalLongFormCustomerDeliveryPackage,
  CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest,
} from './professional-long-form-customer-delivery-package'
import type { CanonicalPrivatePackageWorkQueueAggregate } from
  '../validation/canonical-private-package-work-queue-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_RECIPE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_RUNTIME_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_TERMINAL_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_QA_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_TERMINAL_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_VALIDATION_VERSION,
  professionalLongFormDeliveryH264AuthoritySchema,
  professionalLongFormDeliveryH264AuthorizationSchema,
  professionalLongFormDeliveryH264CompletionSchema,
  professionalLongFormDeliveryH264ReconciliationSchema,
  professionalLongFormDeliveryH264RuntimeEvidenceSchema,
  professionalLongFormDeliveryH264TerminalSchema,
  professionalLongFormDeliveryRootAuthoritySchema,
  professionalLongFormDeliveryRootAuthorizationSchema,
  professionalLongFormDeliveryRootCompletionSchema,
  professionalLongFormDeliveryRootQaEvidenceSchema,
  professionalLongFormDeliveryRootReconciliationSchema,
  professionalLongFormDeliveryRootTerminalSchema,
  professionalLongFormDeliveryRootValidationArtifactSchema,
  type ProfessionalLongFormDeliveryH264ArtifactRef,
  type ProfessionalLongFormDeliveryH264Attempt,
  type ProfessionalLongFormDeliveryH264Authority,
  type ProfessionalLongFormDeliveryH264Authorization,
  type ProfessionalLongFormDeliveryH264Completion,
  type ProfessionalLongFormDeliveryH264Reconciliation,
  type ProfessionalLongFormDeliveryH264RuntimeEvidence,
  type ProfessionalLongFormDeliveryH264Terminal,
  type ProfessionalLongFormDeliveryRootAttempt,
  type ProfessionalLongFormDeliveryRootAuthority,
  type ProfessionalLongFormDeliveryRootAuthorization,
  type ProfessionalLongFormDeliveryRootCompletion,
  type ProfessionalLongFormDeliveryRootQaEvidence,
  type ProfessionalLongFormDeliveryRootReconciliation,
  type ProfessionalLongFormDeliveryRootTerminal,
  type ProfessionalLongFormDeliveryRootValidationArtifact,
} from './professional-long-form-customer-delivery-execution-contract'

export interface CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority {
  package: CanonicalProfessionalLongFormCustomerDeliveryPackage
  packageRef: AuthorityJsonBlobRef
  placementManifest:
    CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest
  placementManifestRef: AuthorityJsonBlobRef
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

const rootOperation = {
  operationId: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
} as const

const h264Operation = {
  operationId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_DELIVERY_H264_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
  fixedRecipeProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_RECIPE_ID,
} as const

const commercialBoundary = {
  internalProductionCostOnly: true as const,
  customerPriceAuthorityIncluded: false as const,
  customerCreditAuthorityIncluded: false as const,
  serviceFeeAuthorityIncluded: false as const,
  approvedFourKEstimateAndReservationReused: true as const,
  customerDeliveryCoveredByOriginalApprovedEstimate: true as const,
  secondExportEstimateCreated: false as const,
  secondExportChargeCreated: false as const,
  exportTimeEstimatePromptAllowed: false as const,
  exportTimeCreditPromptAllowed: false as const,
  walletMutationAuthorized: false as const,
  settlementAuthorized: false as const,
  billingAuthorized: false as const,
}

const persistence = {
  privateLocalContentAddressed: true as const,
  queueReceiptRequiredBeforeLease: true as const,
  queueAttemptRequiredBeforeOperation: true as const,
  queueCompletionIsAuthorityCommit: true as const,
  orphanBlobsGrantExecutionAuthority: false as const,
  distributedDatabaseBacked: false as const,
  productionDurabilityProven: false as const,
}

export function buildProfessionalLongFormDeliveryRootAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
}): ProfessionalLongFormDeliveryRootAuthority {
  const { current } = input
  const deliveryPackage = current.package
  const rootWorkItem = deliveryPackage.graph.workItems[0]
  const rootPlacement = current.placementManifest.placements[0]
  const rootJob = current.queueDefinition.jobs[0]
  const rootEntry = current.queueAggregate.entries[0]
  const queueCreatedEvent = current.queueAggregate.events[0]
  if (
    input.ownerUserId !== deliveryPackage.identity.ownerUserId ||
    input.ownerUserId !== deliveryPackage.approval.approvedByUserId ||
    deliveryPackage.approval.reservationStatus !== 'reserved' ||
    deliveryPackage.approval.remainingReservedCredits <= 0 ||
    !rootWorkItem || !rootPlacement || !rootJob || !rootEntry ||
    !queueCreatedEvent || queueCreatedEvent.eventType !== 'queue_created' ||
    rootWorkItem.kind !== PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_KIND ||
    rootWorkItem.canonicalOrder !== 0 ||
    rootWorkItem.toolPlan.operationId !== rootOperation.operationId ||
    rootWorkItem.toolPlan.runnerClass !== rootOperation.runnerClass ||
    rootWorkItem.toolPlan.attemptCostProfileId !==
      rootOperation.attemptCostProfileId ||
    rootPlacement.jobId !== rootWorkItem.jobId ||
    rootPlacement.workItemId !== rootWorkItem.workItemId ||
    rootPlacement.workerType !== 'api_service' ||
    rootPlacement.resourceClassId !== 'control_plane_cpu_v1' ||
    rootPlacement.vcpuCount !== 1 || rootPlacement.memoryGib !== 1 ||
    rootPlacement.maxAttempts !== 1 ||
    rootPlacement.attemptTimeoutSeconds !== 300 ||
    rootJob.definitionHash !== rootEntry.definition.definitionHash ||
    rootJob.placementHash !== rootPlacement.placementHash ||
    rootJob.expectedOutputIdentity !== rootWorkItem.expectedOutputIdentity ||
    rootJob.satisfiedPromotionDependencyJobIds?.length !== 1 ||
    rootJob.satisfiedPromotionDependencyJobIds[0] !==
      deliveryPackage.sourceReview.privateMasterQa.sourceJobId ||
    rootJob.dependencyJobIds.length !== 0 ||
    current.queueDefinition.identity.professionalLongFormCustomerDeliveryAuthority
      ?.deliveryPackageHash !== deliveryPackage.packageHash
  ) throw new Error(
    'Customer-delivery root lost exact package, placement, queue, or reservation authority.',
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_customer_delivery_root_authority' as const,
    purpose:
      'authorize_one_private_customer_delivery_source_review_validation' as const,
    status:
      'delivery_root_private_execution_authorized_h264_children_blocked' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: deliveryPackage.identity.workspaceId,
      projectId: deliveryPackage.identity.projectId,
      editSessionId: deliveryPackage.identity.editSessionId,
      approvedPlanId: deliveryPackage.identity.approvedPlanId,
      approvedPlanSnapshotId:
        deliveryPackage.identity.approvedPlanSnapshotId,
      approvedPlanSnapshotHash:
        deliveryPackage.identity.approvedPlanSnapshotHash,
      packageRecordId: deliveryPackage.identity.packageRecordId,
      jobId: rootJob.jobId,
      approvedWorkItemId: rootJob.approvedWorkItemId,
      kind: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_KIND,
      expectedOutputIdentity: rootJob.expectedOutputIdentity!,
    },
    approval: deliveryApproval(deliveryPackage),
    lineage: {
      ...deliveryLineage(current),
      rootJobDefinitionHash: rootJob.definitionHash,
      rootPlacementHash: rootPlacement.placementHash,
      sourceReviewDependencyJobId:
        deliveryPackage.sourceReview.privateMasterQa.sourceJobId,
    },
    operation: {
      ...rootOperation,
      workerType: 'api_service' as const,
      resourceClassId: 'control_plane_cpu_v1' as const,
      maximumAttempts: 1 as const,
      attemptTimeoutSeconds: 300 as const,
      leaseDurationMilliseconds: 60_000 as const,
      vcpuCount: 1 as const,
      memoryGib: 1 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableDeliveryPackageRequired: true as const,
      immutablePlacementAndQueueRequired: true as const,
      passedPrivateMasterQaLineageRequired: true as const,
      originalReservationRequired: true as const,
      privateValidationArtifact: true as const,
      privateQa: true as const,
      privateReconciliation: true as const,
      downstreamDependencyEvidence: true as const,
      furtherDeliveryExecution: false as const,
      mediaReadOrTransform: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence,
    authorizedAt: deliveryPackage.preparedAt,
  }
  return professionalLongFormDeliveryRootAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormDeliveryRootAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
}): ProfessionalLongFormDeliveryRootAuthority {
  const parsed = professionalLongFormDeliveryRootAuthoritySchema.parse(input.value)
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormDeliveryRootAuthority(input)
  assertExact(parsed, expected, 'Customer-delivery root authority changed.')
  return expected
}

export function buildProfessionalLongFormDeliveryRootAuthorization(input: {
  authority: ProfessionalLongFormDeliveryRootAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryRootAuthorization {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_customer_delivery_root_authority' as const,
    authorizationId:
      `long-form-delivery-root-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.rootJobDefinitionHash,
    placementHash: input.authority.lineage.rootPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation: rootOperation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      immutableDeliveryAuthorityValidation: true as const,
      privateValidationArtifact: true as const,
      privateQaAndReconciliation: true as const,
      mediaReadOrTransform: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormDeliveryRootAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryRootValidationArtifact(input: {
  authority: ProfessionalLongFormDeliveryRootAuthority
  executionAttempt: ProfessionalLongFormDeliveryRootAttempt
  validatedAt: string
}): ProfessionalLongFormDeliveryRootValidationArtifact {
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_VALIDATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_root_validation' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      editSessionId: input.authority.identity.editSessionId,
      approvedPlanSnapshotId:
        input.authority.identity.approvedPlanSnapshotId,
      packageRecordId: input.authority.identity.packageRecordId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: rootOperation,
    checks: {
      exactApprovedSnapshotAndReservation: 'passed' as const,
      exactDeliveryPackageAndPlacement: 'passed' as const,
      exactQueueAndRootJob: 'passed' as const,
      passedPrivateMasterQaSourceLineage: 'passed' as const,
      originalFourKEstimateReused: 'passed' as const,
      noSecondEstimateOrCharge: 'passed' as const,
      oneUseAttemptAndCommercialBoundary: 'passed' as const,
    },
    valid: true as const,
    validatedAt: input.validatedAt,
  }
  return professionalLongFormDeliveryRootValidationArtifactSchema.parse({
    ...payload,
    artifactHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryRootQaEvidence(input: {
  authority: ProfessionalLongFormDeliveryRootAuthority
  executionAttempt: ProfessionalLongFormDeliveryRootAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  validationArtifactHash: string
  evaluatedAt: string
}): ProfessionalLongFormDeliveryRootQaEvidence {
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_QA_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_root_qa' as const,
    jobId: input.authority.identity.jobId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    validationArtifactHash: input.validationArtifactHash,
    checks: {
      schemaAndChecksum: 'passed' as const,
      deliveryAndSourceReviewLineage: 'passed' as const,
      queueAttemptAndReservationBoundary: 'passed' as const,
      noMediaProviderOrCommercialMutation: 'passed' as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.evaluatedAt,
  }
  return professionalLongFormDeliveryRootQaEvidenceSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryRootReconciliation(input: {
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryRootAuthority
  executionAttempt: ProfessionalLongFormDeliveryRootAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciledAt: string
  allowMonotonicDownstreamProgress?: boolean
}): ProfessionalLongFormDeliveryRootReconciliation {
  const downstreamH264Chunks = input.current.package.graph.workItems
    .filter((item) => item.kind === PROFESSIONAL_LONG_FORM_DELIVERY_H264_KIND)
    .map((item) => {
      const queueEntry = input.current.queueAggregate.entries.find((entry) =>
        entry.definition.jobId === item.jobId)
      if (
        !queueEntry || queueEntry.definition.dependencyJobIds.length !== 1 ||
        queueEntry.definition.dependencyJobIds[0] !==
          input.authority.identity.jobId ||
        !item.sourceChunkId ||
        (!input.allowMonotonicDownstreamProgress && (
          queueEntry.state !== 'queued' ||
          queueEntry.professionalLongFormExecutionAuthorization ||
          queueEntry.professionalLongFormExecutionAttempt || queueEntry.completion
        ))
      ) throw new Error(
        'Customer-delivery root reconciliation found a changed H.264 child.',
      )
      return {
        jobId: item.jobId,
        approvedWorkItemId: item.workItemId,
        sourceChunkId: item.sourceChunkId,
        dependencyJobId: input.authority.identity.jobId,
        dependencySatisfiedByThisCompletion: true as const,
        executionAuthorized: false as const,
        capabilityBlockedPendingExactAuthority: true as const,
      }
    })
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_root_reconciliation' as const,
    rootJobId: input.authority.identity.jobId,
    rootApprovedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    downstreamH264Chunks,
    decision:
      'delivery_source_review_valid_h264_execution_still_exact_authority_gated' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormDeliveryRootReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormDeliveryRootResultHash(input: {
  authority: ProfessionalLongFormDeliveryRootAuthority
  executionAttempt: ProfessionalLongFormDeliveryRootAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_customer_delivery_root_result_v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormDeliveryRootTerminal(input: {
  authority: ProfessionalLongFormDeliveryRootAuthority
  executionAttempt: ProfessionalLongFormDeliveryRootAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormDeliveryRootTerminal {
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.executionAttempt.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: rootOperation,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    h264ExecutionAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormDeliveryRootTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryRootCompletion(input: {
  authority: ProfessionalLongFormDeliveryRootAuthority
  authorization: ProfessionalLongFormDeliveryRootAuthorization
  executionAttempt: ProfessionalLongFormDeliveryRootAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryRootCompletion {
  return professionalLongFormDeliveryRootCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: rootOperation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

export function buildProfessionalLongFormDeliveryH264Authority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  chunkIndex: number
  runtimeAuthority: OfflineRemotionRuntimeAuthority
}): ProfessionalLongFormDeliveryH264Authority {
  const { current } = input
  const deliveryPackage = current.package
  const sourceChunk = deliveryPackage.sourceReview.chunks.find((chunk) =>
    chunk.chunkIndex === input.chunkIndex)
  const workItem = deliveryPackage.graph.workItems.find((item) =>
    item.kind === PROFESSIONAL_LONG_FORM_DELIVERY_H264_KIND &&
    item.sourceChunkId === sourceChunk?.chunkId)
  const placement = current.placementManifest.placements.find((item) =>
    item.workItemId === workItem?.workItemId)
  const queueJob = current.queueDefinition.jobs.find((item) =>
    item.approvedWorkItemId === workItem?.workItemId)
  const queueEntry = current.queueAggregate.entries.find((item) =>
    item.definition.jobId === queueJob?.jobId)
  const rootEntry = current.queueAggregate.entries[0]
  const rootCompletion = professionalLongFormDeliveryRootCompletionSchema
    .safeParse(rootEntry?.completion?.outcome.professionalLongFormExecution)
  if (
    input.ownerUserId !== deliveryPackage.identity.ownerUserId ||
    deliveryPackage.approval.reservationStatus !== 'reserved' ||
    deliveryPackage.approval.remainingReservedCredits <= 0 ||
    !sourceChunk || !workItem || !placement || !queueJob || !queueEntry ||
    !rootEntry?.completion || !rootCompletion.success ||
    rootEntry.state !== 'completed' ||
    workItem.canonicalOrder !== input.chunkIndex * 2 - 1 ||
    workItem.expectedOutputIdentity !== queueJob.expectedOutputIdentity ||
    workItem.toolPlan.operationId !== h264Operation.operationId ||
    workItem.toolPlan.runnerClass !== h264Operation.runnerClass ||
    workItem.toolPlan.attemptCostProfileId !==
      h264Operation.attemptCostProfileId ||
    workItem.toolPlan.fixedRecipeProfileId !==
      h264Operation.fixedRecipeProfileId ||
    placement.workerType !== 'render_worker' ||
    placement.resourceClassId !== 'render_cpu_high_memory_v1' ||
    placement.vcpuCount !== 4 || placement.memoryGib !== 8 ||
    placement.maxAttempts !== 2 ||
    placement.attemptTimeoutSeconds !== 21_600 ||
    queueEntry.definition.definitionHash !== queueJob.definitionHash ||
    queueEntry.definition.placementHash !== placement.placementHash ||
    queueEntry.definition.dependencyJobIds.length !== 1 ||
    queueEntry.definition.dependencyJobIds[0] !== rootEntry.definition.jobId ||
    input.runtimeAuthority.readiness
      .serverInjectedStreamingDeliveryH264ChunkReady !== true ||
    input.runtimeAuthority.readiness.productionReady !== false ||
    input.runtimeAuthority.image.imageIdentityHash.length !== 64
  ) throw new Error(
    'Customer-delivery H.264 chunk lost root, source, runner, placement, or reservation authority.',
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_customer_delivery_h264_authority' as const,
    purpose:
      'authorize_one_private_passed_vp9_chunk_to_h264_delivery_transcode' as const,
    status:
      'delivery_h264_chunk_private_execution_authorized_independent_qa_required' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: deliveryPackage.identity.workspaceId,
      projectId: deliveryPackage.identity.projectId,
      editSessionId: deliveryPackage.identity.editSessionId,
      approvedPlanId: deliveryPackage.identity.approvedPlanId,
      approvedPlanSnapshotId:
        deliveryPackage.identity.approvedPlanSnapshotId,
      approvedPlanSnapshotHash:
        deliveryPackage.identity.approvedPlanSnapshotHash,
      packageRecordId: deliveryPackage.identity.packageRecordId,
      jobId: queueJob.jobId,
      approvedWorkItemId: queueJob.approvedWorkItemId,
      kind: PROFESSIONAL_LONG_FORM_DELIVERY_H264_KIND,
      expectedOutputIdentity: workItem.expectedOutputIdentity,
    },
    approval: deliveryApproval(deliveryPackage),
    approvedChunk: {
      chunkId: sourceChunk.chunkId,
      chunkIndex: sourceChunk.chunkIndex,
      chunkCount: sourceChunk.chunkCount,
      globalStartFrame: sourceChunk.globalStartFrame,
      globalEndFrameExclusive: sourceChunk.globalEndFrameExclusive,
      durationFrames: sourceChunk.durationFrames,
      width: deliveryPackage.outputContract.width,
      height: deliveryPackage.outputContract.height,
      fps: 30 as const,
      chunkAuthorityHash: sourceChunk.chunkAuthorityHash,
      sourceQaArtifactHash: sourceChunk.sourceQaArtifactHash,
      sourceVp9Artifact: sourceChunk.vp9Artifact,
      expectedH264ObjectIdentity: workItem.expectedOutputIdentity,
    },
    lineage: {
      ...deliveryLineage(current),
      h264JobDefinitionHash: queueJob.definitionHash,
      h264PlacementHash: placement.placementHash,
      rootJobId: rootEntry.definition.jobId,
      rootQueueCompletionHash: rootEntry.completion.completionHash,
      rootCanonicalResultHash: rootCompletion.data.canonicalResultHash,
      rootAttemptInternalCostEvidenceHash:
        rootCompletion.data.attemptInternalCostEvidenceHash,
      sourceRenderJobId: sourceChunk.sourceRenderJobId,
      sourceRenderQueueCompletionHash:
        sourceChunk.sourceRenderQueueCompletionHash,
      sourceRenderCanonicalResultHash:
        sourceChunk.sourceRenderCanonicalResultHash,
      sourceQaJobId: sourceChunk.sourceQaJobId,
      sourceQaQueueCompletionHash: sourceChunk.sourceQaQueueCompletionHash,
      sourceQaCanonicalResultHash: sourceChunk.sourceQaCanonicalResultHash,
      remotionRuntimeAuthorityHash:
        stableRemotionRuntimeAuthorityHash(input.runtimeAuthority),
      remotionImageIdentityHash:
        input.runtimeAuthority.image.imageIdentityHash,
    },
    operation: {
      ...h264Operation,
      workerType: 'render_worker' as const,
      resourceClassId: 'render_cpu_high_memory_v1' as const,
      maximumAttempts: 2 as const,
      attemptTimeoutSeconds: 21_600 as const,
      leaseDurationMilliseconds: 300_000 as const,
      vcpuCount: 4 as const,
      memoryGib: 8 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableRootCompletionRequired: true as const,
      exactPassedVp9ArtifactRead: true as const,
      exactSourceChecksumRequired: true as const,
      fixedH264HighCrf18MediumRecipe: true as const,
      privateMediaArtifactCreateOnly: true as const,
      independentQaRequiredBeforeDownstream: true as const,
      furtherDeliveryExecution: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence,
    authorizedAt: rootEntry.completion.completedAt,
  }
  return professionalLongFormDeliveryH264AuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormDeliveryH264Authority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  chunkIndex: number
  runtimeAuthority: OfflineRemotionRuntimeAuthority
}): ProfessionalLongFormDeliveryH264Authority {
  const parsed = professionalLongFormDeliveryH264AuthoritySchema.parse(input.value)
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormDeliveryH264Authority(input)
  assertExact(parsed, expected, 'Customer-delivery H.264 authority changed.')
  return expected
}

export function buildProfessionalLongFormDeliveryH264Authorization(input: {
  authority: ProfessionalLongFormDeliveryH264Authority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryH264Authorization {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_customer_delivery_h264_authority' as const,
    authorizationId:
      `long-form-delivery-h264-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.h264JobDefinitionHash,
    placementHash: input.authority.lineage.h264PlacementHash,
    kind: PROFESSIONAL_LONG_FORM_DELIVERY_H264_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation: h264Operation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      exactPassedVp9ArtifactRead: true as const,
      fixedH264Recipe: true as const,
      createOnlyPrivateMediaPersistence: true as const,
      independentQaRequiredBeforeDownstream: true as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormDeliveryH264AuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryH264RuntimeEvidence(input: {
  authority: ProfessionalLongFormDeliveryH264Authority
  executionAttempt: ProfessionalLongFormDeliveryH264Attempt
  outputArtifact: ProfessionalLongFormDeliveryH264ArtifactRef
  result: OfflineRemotionDeliveryH264ChunkStreamingResult
}): ProfessionalLongFormDeliveryH264RuntimeEvidence {
  const result = input.result
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_H264_RUNTIME_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_h264_runner' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId:
        input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      chunkId: input.authority.approvedChunk.chunkId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: h264Operation,
    requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
    sourceVp9Sha256: input.authority.approvedChunk.sourceVp9Artifact.sha256,
    outputArtifact: input.outputArtifact,
    runtime: {
      packageVersion: result.evidence.packageVersion,
      imageIdentityHash: result.evidence.image.imageIdentityHash,
      attestationRecordId: result.attestation.recordId,
      attestationHash: result.attestation.attestationHash,
      resourceProfileId: result.evidence.resourceProfileId,
      networkMode: result.evidence.confinement.networkMode,
      readOnlyRootFilesystem:
        result.evidence.confinement.readOnlyRootFilesystem,
      nonRootUser: result.evidence.confinement.user,
      containerExitCode: result.evidence.containerExitCode,
      oomKilled: result.evidence.oomKilled,
    },
    checks: {
      exactPassedVp9ArtifactReopened: 'passed' as const,
      sourceChecksumReverified: 'passed' as const,
      fixedH264HighCrf18MediumRecipeExecuted: 'passed' as const,
      frameTimingAndUhdFramePreserved: 'passed' as const,
      videoOnlyAndBt709LimitedEncoded: 'passed' as const,
      exactPrivateCreateOnlyPersistence: 'passed' as const,
      independentQaStillRequired: true as const,
    },
    completedAt: result.attestation.completedAt,
  }
  return professionalLongFormDeliveryH264RuntimeEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryH264Reconciliation(input: {
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryH264Authority
  executionAttempt: ProfessionalLongFormDeliveryH264Attempt
  outputArtifact: ProfessionalLongFormDeliveryH264ArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciledAt: string
  allowCompletedQa?: boolean
}): ProfessionalLongFormDeliveryH264Reconciliation {
  const currentWorkItem = input.current.package.graph.workItems.find((item) =>
    item.workItemId === input.authority.identity.approvedWorkItemId)
  const qaWorkItem = input.current.package.graph.workItems.find((item) =>
    item.kind === 'qa_customer_delivery_h264_chunk' &&
    item.sourceChunkId === input.authority.approvedChunk.chunkId)
  const qaEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === qaWorkItem?.workItemId)
  if (
    !currentWorkItem || !qaWorkItem || !qaEntry ||
    qaEntry.definition.dependencyJobIds.length !== 1 ||
    qaEntry.definition.dependencyJobIds[0] !== currentWorkItem.jobId ||
    (qaEntry.state !== 'queued' &&
      !(input.allowCompletedQa && qaEntry.state === 'completed')) ||
    (!input.allowCompletedQa && (
      qaEntry.completion ||
      qaEntry.professionalLongFormExecutionAuthorization ||
      qaEntry.professionalLongFormExecutionAttempt))
  ) throw new Error('Customer-delivery H.264 QA dependency changed.')
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_H264_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_h264_reconciliation' as const,
    h264JobId: input.authority.identity.jobId,
    h264ApprovedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    qaDependency: {
      jobId: qaEntry.definition.jobId,
      approvedWorkItemId: qaEntry.definition.approvedWorkItemId,
      dependencyJobId: input.authority.identity.jobId,
      dependencySatisfiedByThisCompletion: true as const,
      executionAuthorized: false as const,
      capabilityBlockedPendingQueueGate: true as const,
    },
    decision:
      'private_h264_chunk_ready_independent_qa_execution_not_yet_authorized' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormDeliveryH264ReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormDeliveryH264ResultHash(input: {
  authority: ProfessionalLongFormDeliveryH264Authority
  executionAttempt: ProfessionalLongFormDeliveryH264Attempt
  outputArtifact: ProfessionalLongFormDeliveryH264ArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_customer_delivery_h264_result_v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormDeliveryH264Terminal(input: {
  authority: ProfessionalLongFormDeliveryH264Authority
  executionAttempt: ProfessionalLongFormDeliveryH264Attempt
  outputArtifact: ProfessionalLongFormDeliveryH264ArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormDeliveryH264Terminal {
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.executionAttempt.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: h264Operation,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    independentQaCompleted: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormDeliveryH264TerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryH264Completion(input: {
  authority: ProfessionalLongFormDeliveryH264Authority
  authorization: ProfessionalLongFormDeliveryH264Authorization
  executionAttempt: ProfessionalLongFormDeliveryH264Attempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  outputArtifact: ProfessionalLongFormDeliveryH264ArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryH264Completion {
  return professionalLongFormDeliveryH264CompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: h264Operation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

function deliveryApproval(
  deliveryPackage: CanonicalProfessionalLongFormCustomerDeliveryPackage,
) {
  return {
    approvedByUserId: deliveryPackage.approval.approvedByUserId,
    approvalRecordId: deliveryPackage.approval.approvalRecordId,
    approvedEstimateId: deliveryPackage.identity.approvedEstimateId,
    creditReservationId: deliveryPackage.identity.creditReservationId,
    reservationStatus: 'reserved' as const,
    remainingReservedCredits:
      deliveryPackage.approval.remainingReservedCredits,
    reservationExpiresAt: deliveryPackage.approval.reservationExpiresAt,
    snapshotApprovedAt: deliveryPackage.approval.snapshotApprovedAt,
  }
}

function deliveryLineage(
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
) {
  const deliveryPackage = current.package
  const queueCreatedEvent = current.queueAggregate.events[0]
  if (!queueCreatedEvent || queueCreatedEvent.eventType !== 'queue_created') {
    throw new Error('Customer-delivery queue creation authority is missing.')
  }
  return {
    sourceReviewPackageRecordId:
      deliveryPackage.identity.sourceReviewPackageRecordId,
    sourceReviewPackageHash: deliveryPackage.sourceReview.reviewPackageHash,
    sourceReviewQueueDefinitionHash:
      deliveryPackage.sourceReview.reviewQueueDefinitionHash,
    sourceReviewQueueAggregateHash:
      deliveryPackage.sourceReview.reviewQueueAggregateHash,
    sourcePrivateMasterQaJobId:
      deliveryPackage.sourceReview.privateMasterQa.sourceJobId,
    sourcePrivateMasterQaApprovedWorkItemId:
      deliveryPackage.sourceReview.privateMasterQa.sourceApprovedWorkItemId,
    sourcePrivateMasterQaQueueCompletionHash:
      deliveryPackage.sourceReview.privateMasterQa.sourceQueueCompletionHash,
    sourcePrivateMasterQaCanonicalResultHash:
      deliveryPackage.sourceReview.privateMasterQa.sourceCanonicalResultHash,
    sourcePrivateMasterQaArtifactHash:
      deliveryPackage.sourceReview.privateMasterQa.validationArtifactHash,
    deliveryPackageHash: deliveryPackage.packageHash,
    deliveryPackageRef: current.packageRef,
    deliveryPlacementManifestHash: current.placementManifest.manifestHash,
    deliveryPlacementManifestRef: current.placementManifestRef,
    deliveryWorkGraphHash: deliveryPackage.graph.workGraphHash,
    deliveryOperationBoundaryHash: deliveryPackage.policy.operationBoundaryHash,
    deliveryPlacementAuthorityHash:
      deliveryPackage.policy.placementProfileAuthorityHash,
    queueDefinitionHash: current.queueDefinition.definitionHash,
    queueCreatedEventHash: queueCreatedEvent.eventHash,
  }
}

function stableRemotionRuntimeAuthorityHash(
  authority: OfflineRemotionRuntimeAuthority,
): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_delivery_remotion_runtime_identity_v1',
    schemaVersion: authority.schemaVersion,
    imageIdentityHash: authority.image.imageIdentityHash,
    sourceTreeSha256: authority.image.sourceTreeSha256,
    supportedOperations: authority.supportedOperations,
    deliveryProfileReady:
      authority.readiness.serverInjectedStreamingDeliveryH264ChunkReady,
    productionReady: authority.readiness.productionReady,
  })
}

function assertHashed<T extends Record<string, unknown>>(
  value: T,
  key: keyof T,
): void {
  const hash = value[key]
  const payload = { ...value }
  delete payload[key]
  if (typeof hash !== 'string' || hash !== sha256AuthorityValue(payload)) {
    throw new Error('Customer-delivery evidence checksum is invalid.')
  }
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  const bytes = Buffer.byteLength(stableAuthorityStringify(value), 'utf8')
  if (ref.sha256 !== sha256AuthorityValue(value) || ref.byteLength !== bytes) {
    throw new Error('Customer-delivery authority blob commitment is invalid.')
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw new Error(message)
  }
}
