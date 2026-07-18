import {
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_KIND,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_TERMINAL_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_VALIDATION_VERSION,
  professionalLongFormCrossChunkColorAuthoritySchema,
  professionalLongFormCrossChunkColorAuthorizationSchema,
  professionalLongFormCrossChunkColorCompletionSchema,
  professionalLongFormCrossChunkColorReconciliationSchema,
  professionalLongFormCrossChunkColorTerminalSchema,
  professionalLongFormCrossChunkColorValidationArtifactSchema,
  type ProfessionalLongFormCrossChunkColorAttempt,
  type ProfessionalLongFormCrossChunkColorAuthority,
  type ProfessionalLongFormCrossChunkColorAuthorization,
  type ProfessionalLongFormCrossChunkColorCompletion,
  type ProfessionalLongFormCrossChunkColorReconciliation,
  type ProfessionalLongFormCrossChunkColorTerminal,
  type ProfessionalLongFormCrossChunkColorValidationArtifact,
} from './professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  professionalLongFormFirstObjectChunkQaArtifactSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
  type ProfessionalLongFormFirstObjectChunkQaArtifact,
} from './professional-long-form-first-object-chunk-execution-contract'
import type { CanonicalProfessionalLongFormCurrentChildPackageAuthority } from
  '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'

const operation = {
  operationId: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
} as const

const commercialBoundary = {
  internalProductionCostOnly: true as const,
  customerPriceAuthorityIncluded: false as const,
  customerCreditAuthorityIncluded: false as const,
  serviceFeeAuthorityIncluded: false as const,
  approvedFourKEstimateAndReservationReused: true as const,
  secondExportEstimateCreated: false as const,
  secondExportChargeCreated: false as const,
  walletMutationAuthorized: false as const,
  billingAuthorized: false as const,
}

export interface ProfessionalLongFormCrossChunkColorQaDependencyEvidence {
  chunkId: string
  qaArtifactRef: AuthorityJsonBlobRef
  qaArtifact: ProfessionalLongFormFirstObjectChunkQaArtifact
}

export function buildProfessionalLongFormCrossChunkColorAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  qaDependencies: ProfessionalLongFormCrossChunkColorQaDependencyEvidence[]
  heartbeatIntervalMilliseconds: number
}): ProfessionalLongFormCrossChunkColorAuthority {
  const { current } = input
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const selection = selectColorJob(current)
  const remainingReservedCredits = reservation.reservedCredits -
    reservation.spentCredits - reservation.releasedCredits -
    reservation.refundedCredits
  const parentWorkItem = current.authority.workItems.find((workItem) =>
    workItem.id === current.package.identity.parentControllerApprovedWorkItemId)
  const chunks = buildApprovedChunks(current, input.qaDependencies)
  const expectedOrder = chunks.length * 2 + 4
  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    current.authority.approval.approvedByUserId !== input.ownerUserId ||
    current.authority.approval.id !== snapshot.approvalId ||
    reservation.status !== 'reserved' || reservation.id !== snapshot.reservationId ||
    remainingReservedCredits <= 0 || !parentWorkItem ||
    selection.queueEntry.definition.canonicalOrder !== expectedOrder ||
    selection.manifestJob.kind !== PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_KIND ||
    selection.placement.workerType !== 'qa_worker' ||
    selection.placement.resourceClassId !== 'qa_cpu_standard_v1' ||
    selection.placement.maxAttempts !== 2 ||
    selection.placement.attemptTimeoutSeconds !== 1_800 ||
    selection.placement.privateExecutionReady ||
    selection.placement.providerExecutionMode !== 'none' ||
    selection.queueJob.definitionHash !==
      selection.queueEntry.definition.definitionHash ||
    selection.placement.placementHash !==
      selection.queueEntry.definition.placementHash ||
    stableAuthorityStringify(selection.queueEntry.definition.dependencyJobIds) !==
      stableAuthorityStringify(chunks.map((chunk) => chunk.qaJobId))
  ) throw new Error(
    'Cross-chunk color lost approved snapshot, reservation, placement, or dependency authority.',
  )

  const approvedColorPlan = buildApprovedColorPlan({
    current,
    chunks,
    expectedOutputIdentity: selection.workItem.expectedOutputIdentity,
  })
  const authorizedAt = latestCompletionTimestamp(
    current,
    chunks.map((chunk) => chunk.qaJobId),
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_cross_chunk_color_authority' as const,
    purpose:
      'authorize_one_private_pairwise_cross_chunk_color_continuity_validation' as const,
    status: 'cross_chunk_color_authorized_all_chunk_qa_required' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      packageRecordId: current.package.identity.packageRecordId,
      jobId: selection.manifestJob.jobId,
      approvedWorkItemId: selection.manifestJob.childWorkItemId,
      expectedOutputIdentity: selection.workItem.expectedOutputIdentity,
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
    approvedColorPlan,
    lineage: {
      planningAuthorityHash: sha256AuthorityValue(current.authority),
      planHash: snapshot.planHash,
      workGraphHash: snapshot.workGraphHash,
      timingHash: snapshot.timingHash,
      objectPlanAuthorityHash: current.postApproval.bridge.binding.plan.authorityHash,
      bridgeAuthorityHash: current.postApproval.bridge.authorityHash,
      childJobManifestHash: current.postApproval.childJobManifest.manifestHash,
      childPackageHash: current.package.packageHash,
      childPlacementManifestHash: current.placementManifest.manifestHash,
      queueDefinitionHash: current.queueDefinition.definitionHash,
      colorJobAuthorityHash: selection.manifestJob.jobAuthorityHash,
      colorJobDefinitionHash: selection.queueJob.definitionHash,
      colorPlacementHash: selection.placement.placementHash,
      dependencySetHash: sha256AuthorityValue(chunks),
    },
    operation: {
      ...operation,
      workerType: 'qa_worker' as const,
      resourceClassId: 'qa_cpu_standard_v1' as const,
      maximumAttempts: 2 as const,
      attemptTimeoutSeconds: 1_800 as const,
      leaseDurationMilliseconds: 300_000 as const,
      heartbeatIntervalMilliseconds: Math.max(
        1_000,
        Math.min(60_000, Math.floor(input.heartbeatIntervalMilliseconds)),
      ),
      vcpuCount: 2 as const,
      memoryGib: 4 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableQaCompletionsRequired: true as const,
      exactPrivateChunkRead: true as const,
      pairwiseBoundedAnalysis: true as const,
      independentProbeAndRgbSampling: true as const,
      createOnlyBoundaryCheckpointPersistence: true as const,
      mediaMutationAllowed: false as const,
      providerCall: false as const,
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
    authorizedAt,
  }
  return professionalLongFormCrossChunkColorAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormCrossChunkColorAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  qaDependencies: ProfessionalLongFormCrossChunkColorQaDependencyEvidence[]
  heartbeatIntervalMilliseconds: number
}): ProfessionalLongFormCrossChunkColorAuthority {
  const parsed = professionalLongFormCrossChunkColorAuthoritySchema.parse(
    input.value,
  )
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormCrossChunkColorAuthority(input)
  assertExact(parsed, expected, 'Cross-chunk color authority failed exact replay.')
  return expected
}

export function buildProfessionalLongFormCrossChunkColorAuthorization(input: {
  authority: ProfessionalLongFormCrossChunkColorAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormCrossChunkColorAuthorization {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_cross_chunk_color_authority' as const,
    authorizationId:
      `long-form-color-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.colorJobDefinitionHash,
    placementHash: input.authority.lineage.colorPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      exactQaPassedPrivateChunkRead: true as const,
      fixedPairwiseColorAnalysis: true as const,
      createOnlyBoundaryCheckpointPersistence: true as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormCrossChunkColorAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormCrossChunkColorValidationArtifact(
  input: {
    authority: ProfessionalLongFormCrossChunkColorAuthority
    authorization: ProfessionalLongFormCrossChunkColorAuthorization
    executionAttempt: ProfessionalLongFormCrossChunkColorAttempt
    queueLeaseEvidence: ProfessionalLongFormCrossChunkColorValidationArtifact[
      'queueLeaseEvidence'
    ]
    boundaryResults: ProfessionalLongFormCrossChunkColorValidationArtifact[
      'boundaryResults'
    ]
    imageIdentityHash: string
    evaluatedAt: string
  },
): ProfessionalLongFormCrossChunkColorValidationArtifact {
  assertExecutionLineage(input)
  const boundaries = input.authority.approvedColorPlan.boundaries
  if (
    input.queueLeaseEvidence.claimId !== input.executionAttempt.claimId ||
    input.queueLeaseEvidence.initialClaimHash !== input.executionAttempt.claimHash ||
    input.queueLeaseEvidence.deliveryAttempt !== 1 ||
    input.queueLeaseEvidence.heartbeatCount < 1 ||
    input.boundaryResults.length !== boundaries.length ||
    input.boundaryResults.some((result, index) => {
      const expected = boundaries[index]
      return !expected || result.boundaryId !== expected.boundaryId ||
        result.leftChunkIndex !== expected.leftChunkIndex ||
        result.rightChunkIndex !== expected.rightChunkIndex ||
        result.boundaryBefore !== expected.boundaryBefore ||
        result.outcome !== 'passed'
    })
  ) throw new Error('Cross-chunk color runtime evidence changed from authority.')
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_VALIDATION_VERSION,
    source:
      'canonical_professional_long_form_cross_chunk_color_ffmpeg_runner' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation,
    queueLeaseEvidence: input.queueLeaseEvidence,
    colorAuthorityHash: input.authority.approvedColorPlan.colorAuthorityHash,
    chunkCount: input.authority.approvedColorPlan.chunkCount,
    boundaryCount: boundaries.length,
    boundaryResults: input.boundaryResults,
    runtime: {
      binaryVersion: '8.1.2' as const,
      imageIdentityHash: input.imageIdentityHash,
      networkMode: 'none' as const,
      containerExitCode: 0 as const,
      oomKilled: false as const,
    },
    checks: {
      everyChunkQaCompletionReopened: 'passed' as const,
      everyPrivateChunkChecksumReopened: 'passed' as const,
      everyAdjacentBoundaryEvaluatedExactlyOnce: 'passed' as const,
      everyTechnicalContinuationWithinTolerance: 'passed' as const,
      everyEditorialCutAcceptedOrWithinTolerance: 'passed' as const,
      noMediaMutation: 'passed' as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.evaluatedAt,
  }
  return professionalLongFormCrossChunkColorValidationArtifactSchema.parse({
    ...payload,
    validationHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormCrossChunkColorReconciliation(input: {
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormCrossChunkColorAuthority
  executionAttempt: ProfessionalLongFormCrossChunkColorAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  reconciledAt: string
  allowCompletedColor?: boolean
}): ProfessionalLongFormCrossChunkColorReconciliation {
  const colorEntry = selectColorJob(input.current).queueEntry
  const finalizationWorkItem = input.current.postApproval.bridge.binding.plan
    .workGraph.workItems.find((workItem) =>
      workItem.kind === 'finalize_private_4k_master')
  const finalizationEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === finalizationWorkItem?.workItemId)
  if (
    !finalizationWorkItem || !finalizationEntry ||
    !finalizationEntry.definition.dependencyJobIds.includes(
      input.authority.identity.jobId,
    ) || finalizationEntry.state !== 'queued' ||
    finalizationEntry.professionalLongFormExecutionAuthorization ||
    finalizationEntry.professionalLongFormExecutionAttempt ||
    finalizationEntry.completion ||
    (colorEntry.state !== 'leased' &&
      !(input.allowCompletedColor && colorEntry.state === 'completed'))
  ) throw new Error('Cross-chunk color reconciliation lost finalization authority.')
  const everyRequiredDependencySatisfied =
    finalizationEntry.definition.dependencyJobIds.every((dependencyJobId) =>
      dependencyJobId === input.authority.identity.jobId ||
      input.current.queueAggregate.entries.some((entry) =>
        entry.definition.jobId === dependencyJobId && entry.state === 'completed'))
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_cross_chunk_color_reconciliation' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    downstreamFinalization: {
      jobId: finalizationEntry.definition.jobId,
      approvedWorkItemId: finalizationEntry.definition.approvedWorkItemId,
      dependencyJobId: input.authority.identity.jobId,
      thisDependencySatisfied: true as const,
      everyRequiredDependencySatisfied,
      executionAuthorized: false as const,
    },
    decision:
      'cross_chunk_color_passed_finalization_requires_separate_authority' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormCrossChunkColorReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormCrossChunkColorResultHash(input: {
  authority: ProfessionalLongFormCrossChunkColorAuthority
  executionAttempt: ProfessionalLongFormCrossChunkColorAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_cross_chunk_color_result_v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    validationArtifactRef: input.validationArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormCrossChunkColorTerminal(input: {
  authority: ProfessionalLongFormCrossChunkColorAuthority
  authorization: ProfessionalLongFormCrossChunkColorAuthorization
  executionAttempt: ProfessionalLongFormCrossChunkColorAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormCrossChunkColorTerminal {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_cross_chunk_color_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation,
    validationArtifactRef: input.validationArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    remainingPipelineExecutionAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormCrossChunkColorTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormCrossChunkColorCompletion(input: {
  authority: ProfessionalLongFormCrossChunkColorAuthority
  authorization: ProfessionalLongFormCrossChunkColorAuthorization
  executionAttempt: ProfessionalLongFormCrossChunkColorAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
}): ProfessionalLongFormCrossChunkColorCompletion {
  assertExecutionLineage(input)
  return professionalLongFormCrossChunkColorCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    validationArtifactRef: input.validationArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

function buildApprovedChunks(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  dependencies: ProfessionalLongFormCrossChunkColorQaDependencyEvidence[],
) {
  const planChunks = [...current.postApproval.bridge.binding.plan.chunks]
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
  if (planChunks.length < 2 || planChunks.length > 124 ||
    dependencies.length !== planChunks.length) {
    throw new Error('Cross-chunk color requires every approved object chunk QA.')
  }
  const dependencyByChunkId = new Map(dependencies.map((dependency) => [
    dependency.chunkId,
    dependency,
  ]))
  if (dependencyByChunkId.size !== dependencies.length) {
    throw new Error('Cross-chunk color QA dependency identities are duplicated.')
  }
  return planChunks.map((chunk, index) => {
    const dependency = dependencyByChunkId.get(chunk.chunkId)
    const qaEntry = current.queueAggregate.entries.find((entry) =>
      entry.definition.approvedWorkItemId === `${chunk.chunkId}:qa`)
    if (!dependency || !qaEntry?.completion || qaEntry.state !== 'completed') {
      throw new Error('Cross-chunk color QA dependency is not completed.')
    }
    const completion = professionalLongFormFirstObjectChunkQaCompletionSchema
      .parse(qaEntry.completion.outcome.professionalLongFormExecution)
    const qaArtifact = professionalLongFormFirstObjectChunkQaArtifactSchema
      .parse(dependency.qaArtifact)
    assertHashed(qaArtifact, 'qaHash')
    const boundaryBefore = chunk.sourceSlices[0]?.boundaryBefore
    if (
      chunk.chunkIndex !== index + 1 || chunk.chunkCount !== planChunks.length ||
      dependency.qaArtifactRef.sha256 !== completion.validationArtifactRef.sha256 ||
      dependency.qaArtifactRef.byteLength !== completion.validationArtifactRef.byteLength ||
      qaArtifact.identity.chunkId !== chunk.chunkId ||
      qaArtifact.identity.jobId !== qaEntry.definition.jobId ||
      qaArtifact.renderArtifact.objectIdentity !== chunk.expectedObject.objectIdentity ||
      qaArtifact.renderArtifact.rendererLayerIdentity !==
        chunk.expectedObject.rendererLayerIdentity ||
      qaArtifact.observed.frameCount !== chunk.durationFrames ||
      qaArtifact.observed.width !== current.postApproval.bridge.binding.plan.request
        .confirmedOutputFrame.width ||
      qaArtifact.observed.height !== current.postApproval.bridge.binding.plan.request
        .confirmedOutputFrame.height ||
      (index === 0 ? boundaryBefore !== 'timeline_start' :
        !['approved_hard_cut', 'continuous_technical_split'].includes(
          String(boundaryBefore),
        ))
    ) throw new Error('Cross-chunk color QA artifact changed from approved chunk.')
    return {
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      chunkCount: chunk.chunkCount,
      globalStartFrame: chunk.globalStartFrame,
      globalEndFrameExclusive: chunk.globalEndFrameExclusive,
      durationFrames: chunk.durationFrames,
      width: current.postApproval.bridge.binding.plan.request.confirmedOutputFrame.width,
      height: current.postApproval.bridge.binding.plan.request.confirmedOutputFrame.height,
      fps: 30 as const,
      boundaryBefore: boundaryBefore!,
      qaJobId: qaEntry.definition.jobId,
      qaApprovedWorkItemId: qaEntry.definition.approvedWorkItemId,
      queueCompletionHash: qaEntry.completion.completionHash,
      qaCanonicalResultHash: completion.canonicalResultHash,
      qaAttemptInternalCostEvidenceHash:
        completion.attemptInternalCostEvidenceHash,
      qaArtifactRef: dependency.qaArtifactRef,
      qaArtifactHash: qaArtifact.qaHash,
      renderArtifact: qaArtifact.renderArtifact,
    }
  })
}

function buildApprovedColorPlan(input: {
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  chunks: ReturnType<typeof buildApprovedChunks>
  expectedOutputIdentity: string
}) {
  const request = input.current.postApproval.bridge.binding.plan.request
  const width = request.confirmedOutputFrame.width
  const height = request.confirmedOutputFrame.height
  if (
    request.confirmedOutputFrame.frameRate.numerator !== 30 ||
    request.confirmedOutputFrame.frameRate.denominator !== 1 ||
    input.chunks.some((chunk) =>
      chunk.width !== width || chunk.height !== height || chunk.fps !== 30)
  ) throw new Error('Cross-chunk color requires one exact approved 4K/30 frame.')
  const colorAuthorityHash = sha256AuthorityValue({
    domain: 'professional_long_form_cross_chunk_color_plan_authority_v1',
    approvedPlanSnapshotId: request.identity.approvedPlanSnapshotId,
    expectedOutputIdentity: input.expectedOutputIdentity,
    chunks: input.chunks,
  })
  const boundaries = input.chunks.slice(1).map((right, index) => {
    const left = input.chunks[index]!
    if (
      left.chunkIndex + 1 !== right.chunkIndex ||
      left.globalEndFrameExclusive !== right.globalStartFrame ||
      right.boundaryBefore === 'timeline_start'
    ) throw new Error('Cross-chunk color lost exact adjacent timeline identity.')
    return {
      boundaryId: `color-boundary-${colorAuthorityHash.slice(0, 32)}-${left.chunkIndex}-${right.chunkIndex}`,
      leftChunkIndex: left.chunkIndex,
      rightChunkIndex: right.chunkIndex,
      boundaryBefore: right.boundaryBefore,
      expectedEvidenceIdentity:
        `color-evidence-${colorAuthorityHash.slice(0, 32)}-${left.chunkIndex}-${right.chunkIndex}`,
    }
  })
  const withoutHash = {
    colorAuthorityHash,
    continuityPolicyId: 'bt709_adjacent_chunk_boundary_rgb_policy_v1' as const,
    recipeProfileId:
      'approved_cross_chunk_color_continuity_rgb_sample_v1' as const,
    sampleWindowFrames: 30 as const,
    sampleFramesPerSide: 3 as const,
    width,
    height,
    fps: 30 as const,
    chunkCount: input.chunks.length,
    boundaryCount: boundaries.length,
    chunks: input.chunks,
    boundaries,
    sourcePolicy:
      'independently_qa_passed_private_vp9_bt709_chunks_v1' as const,
    technicalSplitMismatchDisposition: 'block_finalization' as const,
    editorialCutMismatchDisposition: 'review_required' as const,
    mediaMutationAllowed: false as const,
  }
  return { ...withoutHash, planHash: sha256AuthorityValue(withoutHash) }
}

function selectColorJob(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const workItem = current.postApproval.bridge.binding.plan.workGraph.workItems
    .find((item) => item.kind === PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_KIND)
  const manifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === workItem?.workItemId)
  const placement = current.placementManifest.placements.find((entry) =>
    entry.childWorkItemId === workItem?.workItemId)
  const queueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === workItem?.workItemId)
  const queueEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === workItem?.workItemId)
  if (!workItem || !manifestJob || !placement || !queueJob || !queueEntry) {
    throw new Error('Canonical cross-chunk color job is missing.')
  }
  return { workItem, manifestJob, placement, queueJob, queueEntry }
}

function latestCompletionTimestamp(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  jobIds: string[],
): string {
  const values = jobIds.map((jobId) => {
    const completedAt = current.queueAggregate.entries.find((entry) =>
      entry.definition.jobId === jobId)?.completion?.completedAt
    if (!completedAt) throw new Error('Cross-chunk color dependency time is missing.')
    return Date.parse(completedAt)
  })
  return new Date(Math.max(...values)).toISOString()
}

function assertExecutionLineage(input: {
  authority: ProfessionalLongFormCrossChunkColorAuthority
  authorization: ProfessionalLongFormCrossChunkColorAuthorization
  executionAttempt: ProfessionalLongFormCrossChunkColorAttempt
}): void {
  assertHashed(input.authority, 'authorityHash')
  assertHashed(input.authorization, 'receiptHash')
  assertHashed(input.executionAttempt, 'attemptHash')
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.authorizationId !== input.authorization.authorizationId ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    input.executionAttempt.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId
  ) throw new Error('Cross-chunk color execution lineage changed.')
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (ref.sha256 !== sha256AuthorityValue(value)) {
    throw new Error('Cross-chunk color blob reference changed.')
  }
}

function assertHashed<T extends string>(
  value: Record<T, string>,
  key: T,
): void {
  const { [key]: actual, ...withoutHash } = value
  if (actual !== sha256AuthorityValue(withoutHash)) {
    throw new Error(`Cross-chunk color ${String(key)} is invalid.`)
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw new Error(message)
  }
}
