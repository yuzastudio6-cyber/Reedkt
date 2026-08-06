import type {
  CanonicalProfessionalLongFormCurrentChildPackageAuthority,
} from '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_AUTHORIZATION_RECEIPT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_KIND,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_WORK_ITEM_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_KIND,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_QA_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_RECONCILIATION_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_TERMINAL_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_VALIDATION_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
  professionalLongFormFirstChildAuthorizationReceiptSchema,
  professionalLongFormFirstChildCompletionSchema,
  professionalLongFormFirstChildExecutionAuthoritySchema,
  professionalLongFormFirstChildQaEvidenceSchema,
  professionalLongFormFirstChildReconciliationEvidenceSchema,
  professionalLongFormFirstChildTerminalEvidenceSchema,
  professionalLongFormFirstChildValidationArtifactSchema,
  type ProfessionalLongFormFirstChildAuthorizationReceipt,
  type ProfessionalLongFormFirstChildExecutionAttempt,
  type ProfessionalLongFormFirstChildExecutionAuthority,
  type ProfessionalLongFormFirstChildQaEvidence,
  type ProfessionalLongFormFirstChildReconciliationEvidence,
  type ProfessionalLongFormFirstChildTerminalEvidence,
  type ProfessionalLongFormFirstChildValidationArtifact,
} from './professional-long-form-first-child-execution-contract'

const exactOperation = {
  operationId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_FIRST_CHILD_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID,
} as const

const commercialBoundary = {
  internalProductionCostOnly: true as const,
  customerPriceAuthorityIncluded: false as const,
  customerCreditAuthorityIncluded: false as const,
  serviceFeeAuthorityIncluded: false as const,
  walletMutationAuthorized: false as const,
  billingAuthorized: false as const,
}

export function buildProfessionalLongFormFirstChildExecutionAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): ProfessionalLongFormFirstChildExecutionAuthority {
  const { current } = input
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const rootManifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const downstreamManifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_WORK_ITEM_ID)
  const rootPlacement = current.placementManifest.placements.find((placement) =>
    placement.childWorkItemId === PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const rootQueueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const remainingReservedCredits = reservation.reservedCredits -
    reservation.spentCredits - reservation.releasedCredits -
    reservation.refundedCredits
  const queueCreatedEvent = current.queueAggregate.events[0]
  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    current.authority.approval.id !== snapshot.approvalId ||
    current.authority.approval.approvedByUserId !== input.ownerUserId ||
    reservation.status !== 'reserved' ||
    reservation.id !== snapshot.reservationId ||
    remainingReservedCredits <= 0 ||
    Date.parse(reservation.expiresAt) <=
      Date.parse(current.queueAggregate.createdAt) ||
    !rootManifestJob ||
    rootManifestJob.kind !== PROFESSIONAL_LONG_FORM_FIRST_CHILD_KIND ||
    rootManifestJob.expectedOutputIdentity !== snapshot.snapshotHash ||
    rootManifestJob.dependencyJobIds.length !== 1 ||
    !downstreamManifestJob ||
    downstreamManifestJob.kind !== PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_KIND ||
    !downstreamManifestJob.dependencyJobIds.includes(rootManifestJob.jobId) ||
    !rootPlacement ||
    rootPlacement.kind !== PROFESSIONAL_LONG_FORM_FIRST_CHILD_KIND ||
    rootPlacement.workerType !== 'api_service' ||
    rootPlacement.resourceClassId !== 'control_plane_cpu_v1' ||
    rootPlacement.maxAttempts !== 1 ||
    rootPlacement.attemptTimeoutSeconds !== 300 ||
    rootPlacement.privateExecutionReady ||
    rootPlacement.providerExecutionMode !== 'none' ||
    rootPlacement.queueDependencyJobIds.length !== 0 ||
    rootPlacement.satisfiedPromotionDependencyJobIds.length !== 1 ||
    !rootQueueJob ||
    rootQueueJob.canonicalOrder !== 0 ||
    rootQueueJob.jobId !== rootManifestJob.jobId ||
    rootQueueJob.definitionHash.length !== 64 ||
    rootQueueJob.placementHash !== rootPlacement.placementHash ||
    rootQueueJob.dependencyJobIds.length !== 0 ||
    rootQueueJob.privateExecutionReady ||
    current.queueDefinition.identity.snapshotHash !== snapshot.snapshotHash ||
    current.queueDefinition.identity.packageHash !== current.package.packageHash ||
    current.queueDefinition.identity.placementManifestHash !==
      current.placementManifest.manifestHash ||
    queueCreatedEvent?.eventType !== 'queue_created'
  ) {
    throw new Error(
      'Professional long-form first-child authority lost approved root lineage.',
    )
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_AUTHORITY_VERSION,
    source: 'server_reopened_canonical_professional_long_form_authority' as const,
    purpose: 'authorize_one_private_snapshot_validation_child' as const,
    status:
      'first_child_private_execution_authorized_remaining_children_blocked' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      packageRecordId: current.package.identity.packageRecordId,
      jobId: rootManifestJob.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
      kind: PROFESSIONAL_LONG_FORM_FIRST_CHILD_KIND,
      expectedOutputIdentity: rootManifestJob.expectedOutputIdentity,
    },
    approval: {
      approvedByUserId: snapshot.approvedByUserId,
      approvalRecordId: current.authority.approval.id,
      approvedEstimateId: current.authority.estimate.id,
      creditReservationId: reservation.id,
      reservationStatus: 'reserved' as const,
      remainingReservedCredits,
      reservationExpiresAt: reservation.expiresAt,
      snapshotApprovedAt: snapshot.approvedAt,
    },
    lineage: {
      planningAuthorityHash: sha256AuthorityValue(current.authority),
      planHash: snapshot.planHash,
      estimateHash: snapshot.estimateHash,
      workGraphHash: snapshot.workGraphHash,
      timingHash: snapshot.timingHash,
      bridgeAuthorityHash: current.postApproval.bridge.authorityHash,
      bridgeRef: current.postApproval.bridgeRef,
      childJobManifestHash: current.postApproval.childJobManifest.manifestHash,
      childJobManifestRef: current.postApproval.childJobManifestRef,
      childPackageHash: current.package.packageHash,
      childPackageRef: current.packageRef,
      childPlacementManifestHash: current.placementManifest.manifestHash,
      childPlacementManifestRef: current.placementManifestRef,
      queueDefinitionHash: current.queueDefinition.definitionHash,
      queueCreatedEventHash: queueCreatedEvent.eventHash,
      rootJobAuthorityHash: rootManifestJob.jobAuthorityHash,
      rootJobDefinitionHash: rootQueueJob.definitionHash,
      rootPlacementHash: rootPlacement.placementHash,
    },
    operation: {
      ...exactOperation,
      workerType: 'api_service' as const,
      resourceClassId: 'control_plane_cpu_v1' as const,
      maximumAttempts: 1 as const,
      attemptTimeoutSeconds: 300 as const,
      leaseDurationMilliseconds: 60_000 as const,
      vcpuCount: 2 as const,
      memoryGib: 4 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      immutableAuthorityValidation: true as const,
      privateValidationArtifact: true as const,
      privateQa: true as const,
      privateReconciliation: true as const,
      downstreamDependencyEvidence: true as const,
      furtherChildExecution: false as const,
      providerCall: false as const,
      sourceMediaReadOrTransform: false as const,
      render: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence: {
      privateLocalContentAddressed: true as const,
      queueReceiptRequiredBeforeLease: true as const,
      queueAttemptRequiredBeforeOperation: true as const,
      queueCompletionIsAuthorityCommit: true as const,
      orphanBlobsGrantExecutionAuthority: false as const,
      distributedDatabaseBacked: false as const,
      productionDurabilityProven: false as const,
    },
    authorizedAt: current.queueAggregate.createdAt,
  }
  return professionalLongFormFirstChildExecutionAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormFirstChildExecutionAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): ProfessionalLongFormFirstChildExecutionAuthority {
  const parsed = professionalLongFormFirstChildExecutionAuthoritySchema.parse(
    input.value,
  )
  const expected = buildProfessionalLongFormFirstChildExecutionAuthority(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form first-child execution authority failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormFirstChildAuthorizationReceipt(input: {
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormFirstChildAuthorizationReceipt {
  const authority = professionalLongFormFirstChildExecutionAuthoritySchema.parse(
    input.authority,
  )
  assertHashedRecord(authority, 'authorityHash')
  if (
    input.authorityRef.sha256 !== sha256AuthorityValue(authority) ||
    input.authorityRef.byteLength <= 0
  ) {
    throw new Error(
      'Professional long-form first-child authority ref does not match persisted bytes.',
    )
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_AUTHORIZATION_RECEIPT_VERSION,
    source: 'server_persisted_professional_long_form_first_child_authority' as const,
    authorizationId: `long-form-child-auth-${authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: authority.authorityHash,
    queueDefinitionHash: authority.lineage.queueDefinitionHash,
    jobId: authority.identity.jobId,
    approvedWorkItemId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
    jobDefinitionHash: authority.lineage.rootJobDefinitionHash,
    placementHash: authority.lineage.rootPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_FIRST_CHILD_KIND,
    expectedOutputIdentity: authority.identity.expectedOutputIdentity,
    operation: exactOperation,
    authorizedAt: authority.authorizedAt,
    reservationExpiresAt: authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      privateValidationArtifact: true as const,
      privateQaAndReconciliation: true as const,
      providerCall: false as const,
      sourceMediaReadOrTransform: false as const,
      render: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormFirstChildAuthorizationReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormFirstChildValidationArtifact(input: {
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validatedAt: string
}): ProfessionalLongFormFirstChildValidationArtifact {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_CHILD_VALIDATION_ARTIFACT_VERSION,
    source: 'canonical_professional_long_form_snapshot_validation_runner' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      editSessionId: input.authority.identity.editSessionId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      packageRecordId: input.authority.identity.packageRecordId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authority: {
      executionAuthorityId: input.authorization.authorizationId,
      authorityHash: input.authority.authorityHash,
      executionAttemptHash: input.executionAttempt.attemptHash,
      queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
      claimHash: input.executionAttempt.claimHash,
      approvedPlanSnapshotHash: input.authority.identity.approvedPlanSnapshotHash,
      childPackageHash: input.authority.lineage.childPackageHash,
      childJobManifestHash: input.authority.lineage.childJobManifestHash,
      childPlacementManifestHash:
        input.authority.lineage.childPlacementManifestHash,
      rootJobAuthorityHash: input.authority.lineage.rootJobAuthorityHash,
      rootJobDefinitionHash: input.authority.lineage.rootJobDefinitionHash,
      rootPlacementHash: input.authority.lineage.rootPlacementHash,
    },
    operation: exactOperation,
    checks: [
      'approved_snapshot_integrity',
      'funded_reservation_integrity',
      'bridge_and_child_manifest_integrity',
      'child_package_and_placement_integrity',
      'queue_definition_integrity',
      'root_job_identity_integrity',
      'one_use_execution_attempt_integrity',
      'commercial_boundary_integrity',
    ].map((checkId) => ({ checkId, status: 'passed' as const })),
    valid: true as const,
    validatedAt: input.validatedAt,
  }
  return professionalLongFormFirstChildValidationArtifactSchema.parse({
    ...payload,
    artifactHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormFirstChildValidationArtifact(input: {
  value: unknown
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
}): ProfessionalLongFormFirstChildValidationArtifact {
  const parsed = professionalLongFormFirstChildValidationArtifactSchema.parse(input.value)
  assertHashedRecord(parsed, 'artifactHash')
  assertExecutionLineage(input)
  if (
    parsed.authority.authorityHash !== input.authority.authorityHash ||
    parsed.authority.executionAuthorityId !== input.authorization.authorizationId ||
    parsed.authority.executionAttemptHash !== input.executionAttempt.attemptHash ||
    parsed.authority.claimHash !== input.executionAttempt.claimHash ||
    parsed.identity.executionAttemptId !== input.executionAttempt.executionAttemptId ||
    parsed.identity.jobId !== input.authority.identity.jobId
  ) throw new Error('Professional long-form validation artifact lost execution lineage.')
  return parsed
}

export function buildProfessionalLongFormFirstChildQaEvidence(input: {
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifact: ProfessionalLongFormFirstChildValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
  evaluatedAt: string
}): ProfessionalLongFormFirstChildQaEvidence {
  assertExecutionLineage(input)
  assertBlobRef(input.validationArtifactRef, input.validationArtifact)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_CHILD_QA_EVIDENCE_VERSION,
    source: 'canonical_professional_long_form_snapshot_validation_qa' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    executionAuthorityId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    validationArtifactHash: input.validationArtifact.artifactHash,
    checks: {
      schemaAndChecksum: 'passed' as const,
      approvedAuthorityLineage: 'passed' as const,
      queueAndAttemptLineage: 'passed' as const,
      reservationBoundary: 'passed' as const,
      noProviderMediaRenderOrCommercialAuthority: 'passed' as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.evaluatedAt,
  }
  return professionalLongFormFirstChildQaEvidenceSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormFirstChildQaEvidence(input: {
  value: unknown
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifact: ProfessionalLongFormFirstChildValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
}): ProfessionalLongFormFirstChildQaEvidence {
  const parsed = professionalLongFormFirstChildQaEvidenceSchema.parse(input.value)
  assertHashedRecord(parsed, 'qaHash')
  assertExecutionLineage(input)
  assertBlobRef(input.validationArtifactRef, input.validationArtifact)
  if (
    parsed.authorityHash !== input.authority.authorityHash ||
    parsed.executionAuthorityId !== input.authorization.authorizationId ||
    parsed.identity.executionAttemptId !== input.executionAttempt.executionAttemptId ||
    parsed.validationArtifactRef.sha256 !== input.validationArtifactRef.sha256 ||
    parsed.validationArtifactHash !== input.validationArtifact.artifactHash
  ) throw new Error('Professional long-form QA evidence lost validation lineage.')
  return parsed
}

export function buildProfessionalLongFormFirstChildReconciliationEvidence(input: {
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormFirstChildQaEvidence
  qaEvidenceRef: AuthorityJsonBlobRef
  downstreamJobId: string
  reconciledAt: string
}): ProfessionalLongFormFirstChildReconciliationEvidence {
  assertExecutionLineage(input)
  assertBlobRef(input.qaEvidenceRef, input.qaEvidence)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_RECONCILIATION_EVIDENCE_VERSION,
    source: 'canonical_professional_long_form_dependency_reconciliation' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      completedJobId: input.authority.identity.jobId,
      completedWorkItemId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    executionAuthorityId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    qaOutcome: 'passed' as const,
    downstream: {
      jobId: input.downstreamJobId,
      approvedWorkItemId:
        PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_WORK_ITEM_ID,
      kind: PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_KIND,
      dependencyJobId: input.authority.identity.jobId,
      dependencySatisfiedByThisCompletion: true as const,
      executionAuthorized: false as const,
      capabilityBlocked: true as const,
    },
    decision:
      'private_dependency_evidence_ready_downstream_execution_blocked' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormFirstChildReconciliationEvidenceSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormFirstChildReconciliationEvidence(input: {
  value: unknown
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormFirstChildQaEvidence
  qaEvidenceRef: AuthorityJsonBlobRef
}): ProfessionalLongFormFirstChildReconciliationEvidence {
  const parsed = professionalLongFormFirstChildReconciliationEvidenceSchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'reconciliationHash')
  assertExecutionLineage(input)
  assertBlobRef(input.qaEvidenceRef, input.qaEvidence)
  if (
    parsed.authorityHash !== input.authority.authorityHash ||
    parsed.executionAuthorityId !== input.authorization.authorizationId ||
    parsed.identity.executionAttemptId !== input.executionAttempt.executionAttemptId ||
    parsed.validationArtifactRef.sha256 !== input.validationArtifactRef.sha256 ||
    parsed.qaEvidenceRef.sha256 !== input.qaEvidenceRef.sha256 ||
    parsed.downstream.dependencyJobId !== input.authority.identity.jobId
  ) throw new Error('Professional long-form reconciliation lost terminal lineage.')
  return parsed
}

export function professionalLongFormFirstChildCanonicalResultHash(input: {
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:professional-long-form-first-child-result:v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: exactOperation,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormFirstChildTerminalEvidence(input: {
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormFirstChildTerminalEvidence {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_CHILD_TERMINAL_EVIDENCE_VERSION,
    source: 'canonical_professional_long_form_first_child_execution_service' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    executionAuthorityId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: exactOperation,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    permissions: {
      downstreamDependencyEvidenceCreated: true as const,
      downstreamExecutionAuthorized: false as const,
      mediaExecutionAuthorized: false as const,
      providerCallAuthorized: false as const,
      renderAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
    },
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormFirstChildTerminalEvidenceSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormFirstChildTerminalEvidence(input: {
  value: unknown
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
}): ProfessionalLongFormFirstChildTerminalEvidence {
  const parsed = professionalLongFormFirstChildTerminalEvidenceSchema.parse(input.value)
  assertHashedRecord(parsed, 'terminalHash')
  assertExecutionLineage(input)
  if (
    parsed.canonicalResultHash !== input.canonicalResultHash ||
    parsed.attemptInternalCostEvidenceHash !==
      input.attemptInternalCostEvidenceHash ||
    parsed.authorityHash !== input.authority.authorityHash ||
    parsed.executionAuthorityId !== input.authorization.authorizationId ||
    parsed.identity.executionAttemptId !== input.executionAttempt.executionAttemptId
  ) throw new Error('Professional long-form terminal evidence lost exact outcome lineage.')
  return parsed
}

export function buildProfessionalLongFormFirstChildCompletion(input: {
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}) {
  assertExecutionLineage(input)
  return professionalLongFormFirstChildCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_CHILD_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: exactOperation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

function assertExecutionLineage(input: {
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
}): void {
  assertHashedRecord(input.authority, 'authorityHash')
  assertHashedRecord(input.authorization, 'receiptHash')
  assertHashedRecord(input.executionAttempt, 'attemptHash')
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.authorization.jobId !== input.authority.identity.jobId ||
    input.authorization.queueDefinitionHash !==
      input.authority.lineage.queueDefinitionHash ||
    input.executionAttempt.authorizationId !== input.authorization.authorizationId ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    stableAuthorityStringify(input.authorization.operation) !==
      stableAuthorityStringify(exactOperation) ||
    stableAuthorityStringify(input.executionAttempt.operation) !==
      stableAuthorityStringify(exactOperation)
  ) throw new Error('Professional long-form execution lineage is inconsistent.')
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (ref.sha256 !== sha256AuthorityValue(value) || ref.byteLength <= 0) {
    throw new Error('Professional long-form content-addressed blob ref is invalid.')
  }
}

function assertHashedRecord<T extends string>(
  value: Record<T, string> & Record<string, unknown>,
  hashKey: T,
): void {
  const payload = { ...value }
  const expected = payload[hashKey]
  delete payload[hashKey]
  if (expected !== sha256AuthorityValue(payload)) {
    throw new Error(`Professional long-form ${hashKey} is invalid.`)
  }
}
