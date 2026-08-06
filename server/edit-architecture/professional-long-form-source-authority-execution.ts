import type {
  CanonicalProfessionalLongFormCurrentChildPackageAuthority,
} from '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
  professionalLongFormFirstChildCompletionSchema,
} from './professional-long-form-first-child-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_AUTHORIZATION_RECEIPT_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_KIND,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_QA_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_RECONCILIATION_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_TERMINAL_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_VALIDATION_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
  professionalLongFormSourceAuthorityAuthorizationReceiptSchema,
  professionalLongFormSourceAuthorityCompletionSchema,
  professionalLongFormSourceAuthorityExecutionAuthoritySchema,
  professionalLongFormSourceAuthorityQaEvidenceSchema,
  professionalLongFormSourceAuthorityReconciliationEvidenceSchema,
  professionalLongFormSourceAuthorityTerminalEvidenceSchema,
  professionalLongFormSourceAuthorityValidationArtifactSchema,
  type ProfessionalLongFormSourceAuthorityAuthorizationReceipt,
  type ProfessionalLongFormSourceAuthorityExecutionAttempt,
  type ProfessionalLongFormSourceAuthorityExecutionAuthority,
  type ProfessionalLongFormSourceAuthorityQaEvidence,
  type ProfessionalLongFormSourceAuthorityReconciliationEvidence,
  type ProfessionalLongFormSourceAuthorityTerminalEvidence,
  type ProfessionalLongFormSourceAuthorityValidationArtifact,
} from './professional-long-form-source-authority-execution-contract'

const exactOperation = {
  operationId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID,
} as const

const commercialBoundary = {
  internalProductionCostOnly: true as const,
  customerPriceAuthorityIncluded: false as const,
  customerCreditAuthorityIncluded: false as const,
  serviceFeeAuthorityIncluded: false as const,
  walletMutationAuthorized: false as const,
  billingAuthorized: false as const,
}

const sourceExecutionPermissions = {
  privateLocalLease: true as const,
  oneUseInternalDispatch: true as const,
  canonicalLoaderSourceAuthorityRevalidationRequired: true as const,
  structuredApprovedSourceAuthorityValidation: true as const,
  privateValidationArtifact: true as const,
  privateQaAndReconciliation: true as const,
  runnerDirectSourceMediaByteRead: false as const,
  sourceMediaDecodeOrTransform: false as const,
  render: false as const,
  providerCall: false as const,
  googleCloudDispatch: false as const,
  publicDelivery: false as const,
}

export interface ProfessionalLongFormSourceAuthorityValidationSummary {
  sourceCoverage: ProfessionalLongFormSourceAuthorityValidationArtifact['sourceCoverage']
  hashes: ProfessionalLongFormSourceAuthorityValidationArtifact['hashes']
}

export function buildProfessionalLongFormSourceAuthorityExecutionAuthority(
  input: {
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  },
): ProfessionalLongFormSourceAuthorityExecutionAuthority {
  const { current } = input
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const plan = current.postApproval.bridge.binding.plan
  const sourceManifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID)
  const sourcePlacement = current.placementManifest.placements.find((placement) =>
    placement.childWorkItemId === PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID)
  const sourceQueueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID)
  const sourceQueueEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID)
  const rootEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const rootCompletion = professionalLongFormFirstChildCompletionSchema.safeParse(
    rootEntry?.completion?.outcome.professionalLongFormExecution,
  )
  const rootCompletionEvent = current.queueAggregate.events.find((event) =>
    event.eventType === 'job_completed' &&
    event.jobId === rootEntry?.definition.jobId)
  const queueCreatedEvent = current.queueAggregate.events[0]
  const remainingReservedCredits = reservation.reservedCredits -
    reservation.spentCredits - reservation.releasedCredits -
    reservation.refundedCredits
  const sourceRangesHash = sha256AuthorityValue(plan.request.sourceRanges)
  const sourceComponentSequenceHash = sha256AuthorityValue(
    current.authority.components.sourceSequence,
  )
  const sourceCleanupPlanHash = sha256AuthorityValue(
    current.authority.components.sourceCleanupPlan,
  )

  deriveProfessionalLongFormSourceAuthorityValidationSummary(current)
  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    current.authority.approval.id !== snapshot.approvalId ||
    current.authority.approval.approvedByUserId !== input.ownerUserId ||
    reservation.status !== 'reserved' ||
    reservation.id !== snapshot.reservationId ||
    remainingReservedCredits <= 0 ||
    !sourceManifestJob ||
    sourceManifestJob.kind !== PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_KIND ||
    sourceManifestJob.expectedOutputIdentity !== sourceRangesHash ||
    sourceManifestJob.dependencyJobIds.length !== 1 ||
    !sourcePlacement ||
    sourcePlacement.kind !== PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_KIND ||
    sourcePlacement.workerType !== 'api_service' ||
    sourcePlacement.resourceClassId !== 'control_plane_cpu_v1' ||
    sourcePlacement.maxAttempts !== 1 ||
    sourcePlacement.attemptTimeoutSeconds !== 300 ||
    sourcePlacement.privateExecutionReady ||
    sourcePlacement.providerExecutionMode !== 'none' ||
    sourcePlacement.queueDependencyJobIds.length !== 1 ||
    sourcePlacement.satisfiedPromotionDependencyJobIds.length !== 0 ||
    !sourceQueueJob ||
    sourceQueueJob.canonicalOrder !== 1 ||
    sourceQueueJob.jobId !== sourceManifestJob.jobId ||
    sourceQueueJob.definitionHash.length !== 64 ||
    sourceQueueJob.placementHash !== sourcePlacement.placementHash ||
    sourceQueueJob.dependencyJobIds.length !== 1 ||
    sourceQueueJob.dependencyJobIds[0] !== rootEntry?.definition.jobId ||
    sourceQueueJob.privateExecutionReady ||
    !sourceQueueEntry ||
    !rootEntry ||
    rootEntry.state !== 'completed' ||
    rootEntry.definition.canonicalOrder !== 0 ||
    !rootEntry.professionalLongFormExecutionAuthorization ||
    !rootEntry.professionalLongFormExecutionAttempt ||
    !rootEntry.completion ||
    !rootCompletion.success ||
    rootCompletion.data.authorityHash !==
      rootEntry.professionalLongFormExecutionAuthorization.authorityHash ||
    rootCompletion.data.executionAttemptId !==
      rootEntry.professionalLongFormExecutionAttempt.executionAttemptId ||
    !rootCompletionEvent ||
    queueCreatedEvent?.eventType !== 'queue_created' ||
    snapshot.approvedSourceAssetManifestHash !==
      current.authority.sourceAssetManifest.manifestHash ||
    snapshot.approvedSourceAssetManifestRef.sha256 !==
      sha256AuthorityValue(current.authority.sourceAssetManifest) ||
    snapshot.sourceSequenceHash !== sourceComponentSequenceHash ||
    snapshot.componentRefs.sourceCleanupPlan?.sha256 !== sourceCleanupPlanHash
  ) {
    throw new Error(
      'Professional long-form source-authority execution lost approved source, root, or queue lineage.',
    )
  }

  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_AUTHORITY_VERSION,
    source:
      'server_reopened_canonical_professional_long_form_source_authority' as const,
    purpose:
      'authorize_one_private_structured_source_authority_validation_child' as const,
    status:
      'source_authority_private_execution_authorized_media_children_blocked' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      packageRecordId: current.package.identity.packageRecordId,
      jobId: sourceManifestJob.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
      kind: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_KIND,
      expectedOutputIdentity: sourceManifestJob.expectedOutputIdentity,
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
      approvedSourceManifestHash:
        current.authority.sourceAssetManifest.manifestHash,
      approvedSourceManifestRef: snapshot.approvedSourceAssetManifestRef,
      sourceCandidateHash:
        current.authority.sourceAssetManifest.sourceCandidateHash,
      sourceManifestSequenceHash:
        current.authority.sourceAssetManifest.sourceSequenceHash,
      sourceComponentSequenceHash,
      sourceRangesHash,
      sourceCleanupPlanHash,
      sourceJobAuthorityHash: sourceManifestJob.jobAuthorityHash,
      sourceJobDefinitionHash: sourceQueueJob.definitionHash,
      sourcePlacementHash: sourcePlacement.placementHash,
      rootJobId: rootEntry.definition.jobId,
      rootQueueCompletionHash: rootEntry.completion.completionHash,
      rootCanonicalResultHash: rootCompletion.data.canonicalResultHash,
      rootValidationArtifactRef: rootCompletion.data.validationArtifactRef,
      rootQaEvidenceRef: rootCompletion.data.qaEvidenceRef,
      rootReconciliationEvidenceRef:
        rootCompletion.data.reconciliationEvidenceRef,
      rootTerminalEvidenceRef: rootCompletion.data.terminalEvidenceRef,
      rootAttemptInternalCostEvidenceHash:
        rootCompletion.data.attemptInternalCostEvidenceHash,
      rootCompletionEventHash: rootCompletionEvent.eventHash,
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
      ...sourceExecutionPermissions,
      immutableRootCompletionRequired: true as const,
      exactApprovedSourceManifestRequired: true as const,
      exactFrameRangeAndCleanupLineageRequired: true as const,
      directDownstreamDependencyEvidence: true as const,
      furtherChildExecution: false as const,
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
    authorizedAt: rootEntry.completion.completedAt,
  }
  return professionalLongFormSourceAuthorityExecutionAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormSourceAuthorityExecutionAuthority(
  input: {
    value: unknown
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  },
): ProfessionalLongFormSourceAuthorityExecutionAuthority {
  const parsed = professionalLongFormSourceAuthorityExecutionAuthoritySchema.parse(
    input.value,
  )
  const expected = buildProfessionalLongFormSourceAuthorityExecutionAuthority(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form source-authority execution authority failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormSourceAuthorityAuthorizationReceipt(
  input: {
    authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
    authorityRef: AuthorityJsonBlobRef
  },
): ProfessionalLongFormSourceAuthorityAuthorizationReceipt {
  const authority = professionalLongFormSourceAuthorityExecutionAuthoritySchema.parse(
    input.authority,
  )
  assertHashedRecord(authority, 'authorityHash')
  if (
    input.authorityRef.sha256 !== sha256AuthorityValue(authority) ||
    input.authorityRef.byteLength <= 0
  ) {
    throw new Error(
      'Professional long-form source-authority ref does not match persisted bytes.',
    )
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_AUTHORIZATION_RECEIPT_VERSION,
    source:
      'server_persisted_professional_long_form_source_authority_execution_authority' as const,
    authorizationId: `long-form-source-auth-${authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: authority.authorityHash,
    queueDefinitionHash: authority.lineage.queueDefinitionHash,
    jobId: authority.identity.jobId,
    approvedWorkItemId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
    jobDefinitionHash: authority.lineage.sourceJobDefinitionHash,
    placementHash: authority.lineage.sourcePlacementHash,
    kind: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_KIND,
    expectedOutputIdentity: authority.identity.expectedOutputIdentity,
    operation: exactOperation,
    authorizedAt: authority.authorizedAt,
    reservationExpiresAt: authority.approval.reservationExpiresAt,
    permissions: sourceExecutionPermissions,
    commercialBoundary,
  }
  return professionalLongFormSourceAuthorityAuthorizationReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function deriveProfessionalLongFormSourceAuthorityValidationSummary(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
): ProfessionalLongFormSourceAuthorityValidationSummary {
  const plan = current.postApproval.bridge.binding.plan
  const request = plan.request
  const manifest = current.authority.sourceAssetManifest
  const sourceSequence = current.authority.components.sourceSequence
  const cleanupDecisions = current.authority.components.sourceCleanupPlan.decisions
  const segments = current.authority.components.segments
  const ranges = request.sourceRanges
  const sourceRangesHash = sha256AuthorityValue(ranges)
  const sourceJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID)
  const { manifestHash, ...manifestPayload } = manifest
  if (
    !sourceJob ||
    sourceJob.expectedOutputIdentity !== sourceRangesHash ||
    manifestHash !== sha256AuthorityValue(manifestPayload) ||
    current.authority.snapshot.approvedSourceAssetManifestHash !== manifestHash ||
    current.authority.snapshot.approvedSourceAssetManifestRef.sha256 !==
      sha256AuthorityValue(manifest) ||
    manifest.snapshotId !== current.authority.snapshot.snapshotId ||
    manifest.workspaceId !== current.authority.snapshot.workspaceId ||
    manifest.projectId !== current.authority.snapshot.projectId ||
    manifest.bindings.length !== sourceSequence.length ||
    manifest.requiredBindingCount !==
      manifest.bindings.filter((binding) => binding.required).length ||
    request.totalFrames !== current.authority.components.timingSummary.totalFrames ||
    plan.capacity.sourceRangeCount !== ranges.length
  ) {
    throw new Error(
      'Professional long-form approved source manifest or range authority is invalid.',
    )
  }

  const bindingBySequenceId = new Map(manifest.bindings.map((binding) => [
    binding.sourceSequenceItemId,
    binding,
  ]))
  const cleanupById = new Map(cleanupDecisions.map((decision) => [
    decision.decisionId,
    decision,
  ]))
  const segmentById = new Map(segments.map((segment) => [
    segment.segmentId,
    segment,
  ]))
  if (
    bindingBySequenceId.size !== manifest.bindings.length ||
    cleanupById.size !== cleanupDecisions.length ||
    segmentById.size !== segments.length
  ) {
    throw new Error(
      'Professional long-form source, cleanup, or segment identity is not unique.',
    )
  }
  sourceSequence.forEach((source, index) => {
    const binding = manifest.bindings[index]
    if (
      !binding ||
      source.uploadedOrder !== index + 1 ||
      binding.uploadedOrder !== source.uploadedOrder ||
      binding.sourceSequenceItemId !== source.sourceSequenceItemId ||
      binding.mediaAssetId !== source.mediaAssetId ||
      binding.required !== source.required ||
      !source.checksumSha256 ||
      binding.checksumSha256 !== source.checksumSha256
    ) {
      throw new Error(
        'Professional long-form source sequence does not match its approved binding order.',
      )
    }
  })

  const referencedBindingIds = new Set<string>()
  const referencedRequiredBindingIds = new Set<string>()
  const referencedCleanupDecisionIds = new Set<string>()
  const matchedSegmentIds = new Set<string>()
  const rangeToBindingLineage: Record<string, unknown>[] = []
  const rangeToCleanupLineage: Record<string, unknown>[] = []
  const segmentTimelineLineage: Record<string, unknown>[] = []
  const timelineCoverage: Record<string, unknown>[] = []
  let expectedTimelineStart = 0
  let localGenerationConventionRangeCount = 0
  let exactGenerationRangeCount = 0

  ranges.forEach((range, index) => {
    const binding = bindingBySequenceId.get(range.sourceSequenceItemId)
    const cleanup = cleanupById.get(range.sourceCleanupDecisionId)
    const segment = segmentById.get(range.segmentId)
    const sourceDuration = range.sourceEndFrameExclusive - range.sourceStartFrame
    const timelineDuration = range.timelineEndFrameExclusive -
      range.timelineStartFrame
    const expectedBoundary = index === 0
      ? 'timeline_start'
      : 'approved_hard_cut'
    const localBindingValid = binding?.storageProvider === 'local_private' &&
      binding.generation === undefined &&
      binding.etag === undefined &&
      range.sourceObjectGeneration === '1'
    const gcsBindingValid = binding?.storageProvider === 'google_cloud_storage' &&
      Boolean(binding.generation) &&
      Boolean(binding.etag) &&
      binding.generation === range.sourceObjectGeneration
    if (
      !binding ||
      binding.mediaAssetId !== range.mediaAssetId ||
      binding.sizeBytes !== range.sourceByteLength ||
      binding.checksumSha256 !== range.sourceSha256 ||
      (!localBindingValid && !gcsBindingValid) ||
      range.sourceObjectRegion !== request.runtimeRegion ||
      !cleanup ||
      cleanup.sourceSequenceItemId !== range.sourceSequenceItemId ||
      cleanup.action === 'cut' ||
      range.sourceStartFrame < cleanup.startFrame ||
      range.sourceEndFrameExclusive > cleanup.endFrameExclusive ||
      !segment ||
      segment.startFrame !== range.timelineStartFrame ||
      segment.endFrameExclusive !== range.timelineEndFrameExclusive ||
      matchedSegmentIds.has(range.segmentId) ||
      range.timelineStartFrame !== expectedTimelineStart ||
      range.timelineEndFrameExclusive <= range.timelineStartFrame ||
      sourceDuration <= 0 ||
      sourceDuration !== timelineDuration ||
      range.editorialBoundaryBefore !== expectedBoundary
    ) {
      throw new Error(
        `Professional long-form source range ${index + 1} lost approved object, cleanup, segment, region, or frame authority.`,
      )
    }

    referencedBindingIds.add(binding.sourceSequenceItemId)
    if (binding.required) referencedRequiredBindingIds.add(binding.sourceSequenceItemId)
    referencedCleanupDecisionIds.add(cleanup.decisionId)
    matchedSegmentIds.add(segment.segmentId)
    if (localBindingValid) localGenerationConventionRangeCount += 1
    exactGenerationRangeCount += 1
    rangeToBindingLineage.push({
      rangeIndex: index,
      segmentId: range.segmentId,
      sourceSequenceItemId: binding.sourceSequenceItemId,
      mediaAssetId: binding.mediaAssetId,
      bindingHash: binding.bindingHash,
      storageIdentityHash: binding.storageIdentityHash,
      storageProvider: binding.storageProvider,
      sourceObjectGeneration: range.sourceObjectGeneration,
      sourceByteLength: range.sourceByteLength,
      sourceSha256: range.sourceSha256,
    })
    rangeToCleanupLineage.push({
      rangeIndex: index,
      sourceCleanupDecisionId: cleanup.decisionId,
      sourceSequenceItemId: cleanup.sourceSequenceItemId,
      cleanupStartFrame: cleanup.startFrame,
      cleanupEndFrameExclusive: cleanup.endFrameExclusive,
      sourceStartFrame: range.sourceStartFrame,
      sourceEndFrameExclusive: range.sourceEndFrameExclusive,
      action: cleanup.action,
    })
    segmentTimelineLineage.push({
      rangeIndex: index,
      segmentId: segment.segmentId,
      segmentStartFrame: segment.startFrame,
      segmentEndFrameExclusive: segment.endFrameExclusive,
      timelineStartFrame: range.timelineStartFrame,
      timelineEndFrameExclusive: range.timelineEndFrameExclusive,
    })
    timelineCoverage.push({
      rangeIndex: index,
      timelineStartFrame: range.timelineStartFrame,
      timelineEndFrameExclusive: range.timelineEndFrameExclusive,
      sourceStartFrame: range.sourceStartFrame,
      sourceEndFrameExclusive: range.sourceEndFrameExclusive,
      durationFrames: timelineDuration,
      editorialBoundaryBefore: range.editorialBoundaryBefore,
    })
    expectedTimelineStart = range.timelineEndFrameExclusive
  })

  const requiredBindingIds = new Set(manifest.bindings
    .filter((binding) => binding.required)
    .map((binding) => binding.sourceSequenceItemId))
  if (
    expectedTimelineStart !== request.totalFrames ||
    referencedBindingIds.size !== manifest.bindings.length ||
    [...requiredBindingIds].some((id) => !referencedRequiredBindingIds.has(id)) ||
    matchedSegmentIds.size !== ranges.length ||
    exactGenerationRangeCount !== ranges.length ||
    plan.capacity.uniqueSourceObjectCount !== new Set(ranges.map((range) =>
      `${range.mediaAssetId}:${range.sourceObjectGeneration}`)).size
  ) {
    throw new Error(
      'Professional long-form ranges do not provide complete required-binding or frame-exact coverage.',
    )
  }

  const localPrivateBindingCount = manifest.bindings.filter((binding) =>
    binding.storageProvider === 'local_private').length
  const googleCloudStorageBindingCount = manifest.bindings.length -
    localPrivateBindingCount
  const gcsGenerationAndEtagBindingCount = manifest.bindings.filter((binding) =>
    binding.storageProvider === 'google_cloud_storage' &&
    Boolean(binding.generation) && Boolean(binding.etag)).length
  return {
    sourceCoverage: {
      sourceRangeCount: ranges.length,
      approvedBindingCount: manifest.bindings.length,
      requiredBindingCount: manifest.requiredBindingCount,
      referencedBindingCount: referencedBindingIds.size,
      referencedRequiredBindingCount: referencedRequiredBindingIds.size,
      cleanupDecisionCount: cleanupDecisions.length,
      referencedCleanupDecisionCount: referencedCleanupDecisionIds.size,
      matchedSegmentCount: matchedSegmentIds.size,
      totalFrames: request.totalFrames,
      runtimeRegion: request.runtimeRegion,
      localPrivateBindingCount,
      googleCloudStorageBindingCount,
      gcsGenerationAndEtagBindingCount,
      localGenerationConventionRangeCount,
      exactGenerationRangeCount,
    },
    hashes: {
      sourceRangesHash,
      bindingSetHash: sha256AuthorityValue(manifest.bindings),
      cleanupDecisionSetHash: sha256AuthorityValue(cleanupDecisions),
      rangeToBindingLineageHash: sha256AuthorityValue(rangeToBindingLineage),
      rangeToCleanupLineageHash: sha256AuthorityValue(rangeToCleanupLineage),
      segmentTimelineLineageHash: sha256AuthorityValue(segmentTimelineLineage),
      timelineCoverageHash: sha256AuthorityValue({
        totalFrames: request.totalFrames,
        frameRate: request.confirmedOutputFrame.frameRate,
        coverage: timelineCoverage,
      }),
    },
  }
}

export function buildProfessionalLongFormSourceAuthorityValidationArtifact(
  input: {
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
    authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
    executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
    validatedAt: string
  },
): ProfessionalLongFormSourceAuthorityValidationArtifact {
  assertExecutionLineage(input)
  const summary = deriveProfessionalLongFormSourceAuthorityValidationSummary(
    input.current,
  )
  if (
    summary.hashes.sourceRangesHash !== input.authority.lineage.sourceRangesHash ||
    summary.hashes.sourceRangesHash !==
      input.authority.identity.expectedOutputIdentity
  ) {
    throw new Error(
      'Professional long-form source validation summary lost expected-output authority.',
    )
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_VALIDATION_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_private_source_authority_runner' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      editSessionId: input.authority.identity.editSessionId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      packageRecordId: input.authority.identity.packageRecordId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authority: {
      executionAuthorityId: input.authorization.authorizationId,
      authorityHash: input.authority.authorityHash,
      executionAttemptHash: input.executionAttempt.attemptHash,
      queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
      claimHash: input.executionAttempt.claimHash,
      approvedPlanSnapshotHash:
        input.authority.identity.approvedPlanSnapshotHash,
      approvedSourceManifestHash:
        input.authority.lineage.approvedSourceManifestHash,
      sourceRangesHash: input.authority.lineage.sourceRangesHash,
      sourceCleanupPlanHash: input.authority.lineage.sourceCleanupPlanHash,
      sourceJobAuthorityHash: input.authority.lineage.sourceJobAuthorityHash,
      sourceJobDefinitionHash: input.authority.lineage.sourceJobDefinitionHash,
      sourcePlacementHash: input.authority.lineage.sourcePlacementHash,
      rootQueueCompletionHash:
        input.authority.lineage.rootQueueCompletionHash,
      rootCanonicalResultHash: input.authority.lineage.rootCanonicalResultHash,
    },
    operation: exactOperation,
    sourceCoverage: summary.sourceCoverage,
    hashes: summary.hashes,
    checks: [
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
    ].map((checkId) => ({ checkId, status: 'passed' as const })),
    readinessTruth: {
      canonicalLoaderSourceAuthorityRevalidated: true as const,
      runnerDirectSourceBytesRead: false as const,
      mediaDecoded: false as const,
      sourceObjectResidencyVerified: false as const,
      sourceFrameCapacityVerified: false as const,
      sourceTransformed: false as const,
      rendered: false as const,
    },
    valid: true as const,
    validatedAt: input.validatedAt,
  }
  return professionalLongFormSourceAuthorityValidationArtifactSchema.parse({
    ...payload,
    artifactHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormSourceAuthorityValidationArtifact(
  input: {
    value: unknown
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
    authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
    executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  },
): ProfessionalLongFormSourceAuthorityValidationArtifact {
  const parsed = professionalLongFormSourceAuthorityValidationArtifactSchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'artifactHash')
  const expected = buildProfessionalLongFormSourceAuthorityValidationArtifact({
    ...input,
    validatedAt: parsed.validatedAt,
  })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form source validation artifact failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormSourceAuthorityQaEvidence(input: {
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifact: ProfessionalLongFormSourceAuthorityValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
  evaluatedAt: string
}): ProfessionalLongFormSourceAuthorityQaEvidence {
  assertExecutionLineage(input)
  assertBlobRef(input.validationArtifactRef, input.validationArtifact)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_QA_EVIDENCE_VERSION,
    source: 'canonical_professional_long_form_source_authority_qa' as const,
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
      approvedManifestAndRangeLineage: 'passed' as const,
      checksumSizeGenerationAndCleanup: 'passed' as const,
      frameExactTimelineCoverage: 'passed' as const,
      queueRootAttemptAndReservationBoundary: 'passed' as const,
      noDecodeTransformRenderOrCommercialAuthority: 'passed' as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.evaluatedAt,
  }
  return professionalLongFormSourceAuthorityQaEvidenceSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormSourceAuthorityQaEvidence(input: {
  value: unknown
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifact: ProfessionalLongFormSourceAuthorityValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
}): ProfessionalLongFormSourceAuthorityQaEvidence {
  const parsed = professionalLongFormSourceAuthorityQaEvidenceSchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'qaHash')
  const expected = buildProfessionalLongFormSourceAuthorityQaEvidence({
    ...input,
    evaluatedAt: parsed.evaluatedAt,
  })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form source-authority QA evidence failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormSourceAuthorityReconciliationEvidence(
  input: {
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
    authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
    executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
    validationArtifactRef: AuthorityJsonBlobRef
    qaEvidence: ProfessionalLongFormSourceAuthorityQaEvidence
    qaEvidenceRef: AuthorityJsonBlobRef
    reconciledAt: string
    requireCurrentDownstreamBlockedState?: boolean
  },
): ProfessionalLongFormSourceAuthorityReconciliationEvidence {
  assertExecutionLineage(input)
  assertBlobRef(input.qaEvidenceRef, input.qaEvidence)
  const kindByWorkItemId = new Map(
    input.current.postApproval.childJobManifest.jobs.map((job) => [
      job.childWorkItemId,
      job.kind,
    ]),
  )
  const directDownstream = input.current.queueAggregate.entries
    .filter((entry) => entry.definition.dependencyJobIds.includes(
      input.authority.identity.jobId,
    ))
    .map((entry) => ({ entry, kind: kindByWorkItemId.get(
      entry.definition.approvedWorkItemId,
    ) }))
    .filter((value): value is typeof value & {
      kind: 'render_object_mezzanine_chunk' | 'mix_continuous_program_audio'
    } => value.kind === 'render_object_mezzanine_chunk' ||
      value.kind === 'mix_continuous_program_audio')
    .map(({ entry, kind }) => {
      if (input.requireCurrentDownstreamBlockedState !== false && (
        entry.state !== 'queued' ||
        entry.deliveryAttemptCount !== 0 ||
        entry.professionalLongFormExecutionAuthorization ||
        entry.professionalLongFormExecutionAttempt ||
        entry.completion ||
        entry.definition.privateExecutionReady
      )) {
        throw new Error(
          'Professional long-form direct source downstream already has execution authority.',
        )
      }
      return {
        jobId: entry.definition.jobId,
        approvedWorkItemId: entry.definition.approvedWorkItemId,
        kind,
        dependencyJobIds: [...entry.definition.dependencyJobIds],
        sourceDependencyJobId: input.authority.identity.jobId,
        sourceDependencySatisfiedByThisCompletion: true as const,
        executionAuthorized: false as const,
        capabilityBlocked: true as const,
      }
    })
  const expectedDirectDownstreamCount =
    input.current.postApproval.bridge.binding.plan.chunks.length + 1
  const renderJobCount = directDownstream.filter((entry) =>
    entry.kind === 'render_object_mezzanine_chunk').length
  if (
    directDownstream.length !== expectedDirectDownstreamCount ||
    renderJobCount !==
      input.current.postApproval.bridge.binding.plan.chunks.length ||
    directDownstream.filter((entry) =>
      entry.kind === 'mix_continuous_program_audio').length !== 1
  ) {
    throw new Error(
      'Professional long-form source reconciliation lost exact render/audio dependencies.',
    )
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_RECONCILIATION_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_source_dependency_reconciliation' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      completedJobId: input.authority.identity.jobId,
      completedWorkItemId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    executionAuthorityId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    qaOutcome: 'passed' as const,
    directDownstream,
    summary: {
      directDownstreamCount: directDownstream.length,
      renderJobCount,
      continuousAudioJobCount: 1 as const,
      remainingQueueJobCountAfterCompletion:
        input.current.queueAggregate.summary.totalJobCount - 2,
      allDirectDownstreamExecutionBlocked: true as const,
      directDownstreamHash: sha256AuthorityValue(directDownstream),
    },
    decision:
      'source_dependency_evidence_ready_downstream_operation_and_other_dependencies_blocked' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormSourceAuthorityReconciliationEvidenceSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormSourceAuthorityReconciliationEvidence(
  input: {
    value: unknown
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
    authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
    executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
    validationArtifactRef: AuthorityJsonBlobRef
    qaEvidence: ProfessionalLongFormSourceAuthorityQaEvidence
    qaEvidenceRef: AuthorityJsonBlobRef
  },
): ProfessionalLongFormSourceAuthorityReconciliationEvidence {
  const parsed =
    professionalLongFormSourceAuthorityReconciliationEvidenceSchema.parse(
      input.value,
    )
  assertHashedRecord(parsed, 'reconciliationHash')
  const expected =
    buildProfessionalLongFormSourceAuthorityReconciliationEvidence({
      ...input,
      reconciledAt: parsed.reconciledAt,
      requireCurrentDownstreamBlockedState: false,
    })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form source reconciliation failed exact replay.',
    )
  }
  return expected
}

export function professionalLongFormSourceAuthorityCanonicalResultHash(input: {
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:professional-long-form-source-authority-result:v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: exactOperation,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormSourceAuthorityTerminalEvidence(input: {
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormSourceAuthorityTerminalEvidence {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_TERMINAL_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_source_authority_execution_service' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
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
      structuredSourceAuthorityValidated: true as const,
      directDownstreamDependencyEvidenceCreated: true as const,
      downstreamExecutionAuthorized: false as const,
      sourceMediaDecodeOrTransformAuthorized: false as const,
      providerCallAuthorized: false as const,
      renderAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
    },
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormSourceAuthorityTerminalEvidenceSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormSourceAuthorityTerminalEvidence(input: {
  value: unknown
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
}): ProfessionalLongFormSourceAuthorityTerminalEvidence {
  const parsed = professionalLongFormSourceAuthorityTerminalEvidenceSchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'terminalHash')
  const expected = buildProfessionalLongFormSourceAuthorityTerminalEvidence({
    ...input,
    completedAt: parsed.completedAt,
  })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form source terminal evidence failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormSourceAuthorityCompletion(input: {
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}) {
  assertExecutionLineage(input)
  return professionalLongFormSourceAuthorityCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COMPLETION_VERSION,
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
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
}): void {
  assertHashedRecord(input.authority, 'authorityHash')
  assertHashedRecord(input.authorization, 'receiptHash')
  assertHashedRecord(input.executionAttempt, 'attemptHash')
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.authorization.jobId !== input.authority.identity.jobId ||
    input.authorization.queueDefinitionHash !==
      input.authority.lineage.queueDefinitionHash ||
    input.executionAttempt.authorizationId !==
      input.authorization.authorizationId ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    stableAuthorityStringify(input.authorization.operation) !==
      stableAuthorityStringify(exactOperation) ||
    stableAuthorityStringify(input.executionAttempt.operation) !==
      stableAuthorityStringify(exactOperation)
  ) {
    throw new Error(
      'Professional long-form source-authority execution lineage is inconsistent.',
    )
  }
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (ref.sha256 !== sha256AuthorityValue(value) || ref.byteLength <= 0) {
    throw new Error(
      'Professional long-form source-authority content-addressed ref is invalid.',
    )
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
    throw new Error(
      `Professional long-form source-authority ${hashKey} is invalid.`,
    )
  }
}
