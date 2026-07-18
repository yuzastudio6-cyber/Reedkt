import type { OfflineFfprobeExecutionResult } from
  '../tool-execution/media-binary-execution'
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
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
  professionalLongFormSourceAuthorityCompletionSchema,
} from './professional-long-form-source-authority-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
  professionalLongFormMasterTimingCompletionSchema,
} from './professional-long-form-master-timing-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_KIND,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_TERMINAL_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_KIND,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_TERMINAL_VERSION,
  professionalLongFormFirstObjectChunkQaArtifactSchema,
  professionalLongFormFirstObjectChunkQaAuthoritySchema,
  professionalLongFormFirstObjectChunkQaAuthorizationSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
  professionalLongFormFirstObjectChunkQaReconciliationSchema,
  professionalLongFormFirstObjectChunkQaTerminalSchema,
  professionalLongFormFirstObjectChunkRenderAuthoritySchema,
  professionalLongFormFirstObjectChunkRenderAuthorizationSchema,
  professionalLongFormFirstObjectChunkRenderCompletionSchema,
  professionalLongFormFirstObjectChunkRenderEvidenceSchema,
  professionalLongFormFirstObjectChunkRenderReconciliationSchema,
  professionalLongFormFirstObjectChunkRenderTerminalSchema,
  type ProfessionalLongFormFirstObjectChunkMediaArtifactRef,
  type ProfessionalLongFormFirstObjectChunkQaArtifact,
  type ProfessionalLongFormFirstObjectChunkQaAttempt,
  type ProfessionalLongFormFirstObjectChunkQaAuthority,
  type ProfessionalLongFormFirstObjectChunkQaAuthorization,
  type ProfessionalLongFormFirstObjectChunkQaReconciliation,
  type ProfessionalLongFormFirstObjectChunkQaTerminal,
  type ProfessionalLongFormFirstObjectChunkRenderAttempt,
  type ProfessionalLongFormFirstObjectChunkRenderAuthority,
  type ProfessionalLongFormFirstObjectChunkRenderAuthorization,
  type ProfessionalLongFormFirstObjectChunkRenderEvidence,
  type ProfessionalLongFormFirstObjectChunkRenderReconciliation,
  type ProfessionalLongFormFirstObjectChunkRenderTerminal,
} from './professional-long-form-first-object-chunk-execution-contract'

const renderOperation = {
  operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_RUNNER_CLASS,
  attemptCostProfileId:
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
} as const

const qaOperation = {
  operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_RUNNER_CLASS,
  attemptCostProfileId:
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
} as const

const commercialBoundary = {
  internalProductionCostOnly: true as const,
  customerPriceAuthorityIncluded: false as const,
  customerCreditAuthorityIncluded: false as const,
  serviceFeeAuthorityIncluded: false as const,
  secondExportEstimateCreated: false as const,
  secondExportChargeCreated: false as const,
  approvedFourKEstimateAndReservationReused: true as const,
  walletMutationAuthorized: false as const,
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

export function buildProfessionalLongFormFirstObjectChunkRenderAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): ProfessionalLongFormFirstObjectChunkRenderAuthority {
  const selection = selectFirstChunk(input.current)
  const { current } = input
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const remainingReservedCredits = remainingReservationCredits(current)
  const dependencyCompletions = exactRenderDependencies(current, selection.queueEntry)
  const parentWorkItem = current.authority.workItems.find((workItem) =>
    workItem.id === current.package.identity.parentControllerApprovedWorkItemId)
  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    current.authority.approval.approvedByUserId !== input.ownerUserId ||
    current.authority.approval.id !== snapshot.approvalId ||
    reservation.status !== 'reserved' ||
    reservation.id !== snapshot.reservationId ||
    remainingReservedCredits <= 0 ||
    !parentWorkItem ||
    selection.queueEntry.definition.canonicalOrder !== 3 ||
    selection.manifestJob.kind !==
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_KIND ||
    selection.placement.workerType !== 'render_worker' ||
    selection.placement.resourceClassId !== 'render_cpu_high_memory_v1' ||
    selection.placement.maxAttempts !== 2 ||
    selection.placement.attemptTimeoutSeconds !== 3_600 ||
    selection.placement.privateExecutionReady ||
    selection.placement.providerExecutionMode !== 'none' ||
    selection.queueEntry.definition.definitionHash !==
      selection.queueJob.definitionHash ||
    selection.queueEntry.definition.placementHash !==
      selection.placement.placementHash ||
    stableAuthorityStringify(selection.queueEntry.definition.dependencyJobIds) !==
      stableAuthorityStringify(dependencyCompletions.map((entry) => entry.jobId))
  ) throw new Error(
    'First object-chunk render lost approved snapshot, reservation, placement, or dependency authority.',
  )

  const authorizedAt = latestCompletionTimestamp(
    current,
    dependencyCompletions.map((entry) => entry.jobId),
  )
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_first_object_chunk_render_authority' as const,
    purpose:
      'authorize_one_private_checksum_bound_first_object_chunk_stream_copy' as const,
    status:
      'first_object_chunk_render_authorized_independent_qa_required' as const,
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
      expectedOutputIdentity: selection.chunk.expectedObject.objectIdentity,
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
    approvedChunk: selection.approvedChunk,
    lineage: {
      planningAuthorityHash: sha256AuthorityValue(current.authority),
      planHash: snapshot.planHash,
      workGraphHash: snapshot.workGraphHash,
      timingHash: snapshot.timingHash,
      objectPlanAuthorityHash:
        current.postApproval.bridge.binding.plan.authorityHash,
      bridgeAuthorityHash: current.postApproval.bridge.authorityHash,
      childJobManifestHash: current.postApproval.childJobManifest.manifestHash,
      childPackageHash: current.package.packageHash,
      childPlacementManifestHash: current.placementManifest.manifestHash,
      queueDefinitionHash: current.queueDefinition.definitionHash,
      sourceManifestHash: sha256AuthorityValue(
        current.authority.sourceAssetManifest,
      ),
      parentApprovedWorkItemHash: sha256AuthorityValue(parentWorkItem),
      renderJobAuthorityHash: selection.manifestJob.jobAuthorityHash,
      renderJobDefinitionHash: selection.queueJob.definitionHash,
      renderPlacementHash: selection.placement.placementHash,
      dependencyCompletions,
      dependencySetHash: sha256AuthorityValue(dependencyCompletions),
    },
    operation: {
      ...renderOperation,
      workerType: 'render_worker' as const,
      resourceClassId: 'render_cpu_high_memory_v1' as const,
      maximumAttempts: 2 as const,
      attemptTimeoutSeconds: 3_600 as const,
      leaseDurationMilliseconds: 300_000 as const,
      vcpuCount: 2 as const,
      memoryGib: 4 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableDependencyCompletionsRequired: true as const,
      approvedPrivateSourceRead: true as const,
      exactSourceChecksumsRequired: true as const,
      fixedHardCutStreamCopyRecipe: true as const,
      decodeOrReencodeAllowed: false as const,
      privateMediaArtifactCreateOnly: true as const,
      independentQaRequiredBeforeDownstream: true as const,
      furtherChildExecution: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence,
    authorizedAt,
  }
  return professionalLongFormFirstObjectChunkRenderAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormFirstObjectChunkRenderAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): ProfessionalLongFormFirstObjectChunkRenderAuthority {
  const parsed = professionalLongFormFirstObjectChunkRenderAuthoritySchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormFirstObjectChunkRenderAuthority(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error('First object-chunk render authority failed exact replay.')
  }
  return expected
}

export function buildProfessionalLongFormFirstObjectChunkRenderAuthorization(
  input: {
    authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
    authorityRef: AuthorityJsonBlobRef
  },
): ProfessionalLongFormFirstObjectChunkRenderAuthorization {
  assertHashedRecord(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_first_object_chunk_render_authority' as const,
    authorizationId:
      `long-form-object-render-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.renderJobDefinitionHash,
    placementHash: input.authority.lineage.renderPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation: renderOperation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      approvedPrivateSourceRead: true as const,
      fixedStreamCopyRecipe: true as const,
      createOnlyPrivateMediaPersistence: true as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormFirstObjectChunkRenderAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormFirstObjectChunkQaAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): ProfessionalLongFormFirstObjectChunkQaAuthority {
  const selection = selectFirstChunk(input.current)
  const { current } = input
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const remainingReservedCredits = remainingReservationCredits(current)
  const renderCompletion =
    professionalLongFormFirstObjectChunkRenderCompletionSchema.safeParse(
      selection.queueEntry.completion?.outcome.professionalLongFormExecution,
    )
  const qaEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === selection.qaManifestJob.childWorkItemId)
  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    reservation.status !== 'reserved' || remainingReservedCredits <= 0 ||
    selection.queueEntry.state !== 'completed' ||
    !selection.queueEntry.completion || !renderCompletion.success ||
    !qaEntry || qaEntry.definition.canonicalOrder !== 4 ||
    qaEntry.definition.workerType !== 'qa_worker' ||
    qaEntry.definition.resourceClassId !== 'qa_cpu_standard_v1' ||
    qaEntry.definition.maxAttempts !== 2 ||
    qaEntry.definition.attemptTimeoutSeconds !== 900 ||
    qaEntry.definition.dependencyJobIds.length !== 1 ||
    qaEntry.definition.dependencyJobIds[0] !== selection.queueEntry.definition.jobId ||
    qaEntry.definition.expectedOutputIdentity !==
      selection.qaManifestJob.expectedOutputIdentity ||
    renderCompletion.data.outputArtifact.objectIdentity !==
      selection.chunk.expectedObject.objectIdentity ||
    renderCompletion.data.outputArtifact.sha256 !==
      selection.queueEntry.completion.outcome.sha256
  ) throw new Error(
    'First object-chunk QA lost exact render completion, artifact, placement, or reservation authority.',
  )
  const qaPlacement = current.placementManifest.placements.find((placement) =>
    placement.childWorkItemId === selection.qaManifestJob.childWorkItemId)
  const qaQueueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === selection.qaManifestJob.childWorkItemId)
  if (
    !qaPlacement || !qaQueueJob ||
    qaPlacement.placementHash !== qaEntry.definition.placementHash ||
    qaQueueJob.definitionHash !== qaEntry.definition.definitionHash ||
    qaPlacement.workerType !== 'qa_worker' ||
    qaPlacement.resourceClassId !== 'qa_cpu_standard_v1'
  ) throw new Error('First object-chunk QA placement authority changed.')
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_first_object_chunk_qa_authority' as const,
    purpose:
      'authorize_one_private_independent_probe_of_exact_first_object_chunk' as const,
    status: 'first_object_chunk_independent_qa_authorized' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      packageRecordId: current.package.identity.packageRecordId,
      jobId: selection.qaManifestJob.jobId,
      approvedWorkItemId: selection.qaManifestJob.childWorkItemId,
      expectedOutputIdentity: selection.qaManifestJob.expectedOutputIdentity,
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
    approvedChunk: selection.approvedChunk,
    renderArtifact: renderCompletion.data.outputArtifact,
    lineage: {
      planningAuthorityHash: sha256AuthorityValue(current.authority),
      objectPlanAuthorityHash:
        current.postApproval.bridge.binding.plan.authorityHash,
      queueDefinitionHash: current.queueDefinition.definitionHash,
      qaJobAuthorityHash: selection.qaManifestJob.jobAuthorityHash,
      qaJobDefinitionHash: qaQueueJob.definitionHash,
      qaPlacementHash: qaPlacement.placementHash,
      renderJobId: selection.queueEntry.definition.jobId,
      renderApprovedWorkItemId: selection.queueEntry.definition.approvedWorkItemId,
      renderQueueCompletionHash: selection.queueEntry.completion.completionHash,
      renderCanonicalResultHash: renderCompletion.data.canonicalResultHash,
      renderAttemptInternalCostEvidenceHash:
        renderCompletion.data.attemptInternalCostEvidenceHash,
      renderRuntimeEvidenceRef: renderCompletion.data.runtimeEvidenceRef,
      renderReconciliationEvidenceRef:
        renderCompletion.data.reconciliationEvidenceRef,
      renderTerminalEvidenceRef: renderCompletion.data.terminalEvidenceRef,
    },
    operation: {
      ...qaOperation,
      workerType: 'qa_worker' as const,
      resourceClassId: 'qa_cpu_standard_v1' as const,
      maximumAttempts: 2 as const,
      attemptTimeoutSeconds: 900 as const,
      leaseDurationMilliseconds: 120_000 as const,
      vcpuCount: 2 as const,
      memoryGib: 4 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableRenderCompletionRequired: true as const,
      exactPrivateArtifactRead: true as const,
      independentFfprobe: true as const,
      exactFrameColorDurationValidation: true as const,
      mediaMutationAllowed: false as const,
      privateQaArtifactCreateOnly: true as const,
      furtherChildExecution: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence,
    authorizedAt: selection.queueEntry.completion.completedAt,
  }
  return professionalLongFormFirstObjectChunkQaAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormFirstObjectChunkQaAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): ProfessionalLongFormFirstObjectChunkQaAuthority {
  const parsed = professionalLongFormFirstObjectChunkQaAuthoritySchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormFirstObjectChunkQaAuthority(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error('First object-chunk QA authority failed exact replay.')
  }
  return expected
}

export function buildProfessionalLongFormFirstObjectChunkQaAuthorization(input: {
  authority: ProfessionalLongFormFirstObjectChunkQaAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormFirstObjectChunkQaAuthorization {
  assertHashedRecord(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_first_object_chunk_qa_authority' as const,
    authorizationId:
      `long-form-object-qa-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.qaJobDefinitionHash,
    placementHash: input.authority.lineage.qaPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation: qaOperation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      exactPrivateArtifactRead: true as const,
      independentProbe: true as const,
      privateQaPersistence: true as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormFirstObjectChunkQaAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormFirstObjectChunkRenderEvidence(input: {
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
  authorization: ProfessionalLongFormFirstObjectChunkRenderAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkRenderAttempt
  sourceReadEvidenceHashes: string[]
  sourceStagingEvidenceHashes: string[]
  sourceSha256s: string[]
  capacityEvidenceHash: string
  outputArtifact: ProfessionalLongFormFirstObjectChunkMediaArtifactRef
  runtime: {
    requestEnvelopeSha256: string
    binaryVersion: '8.1.2'
    imageIdentityHash: string
    attestationRecordId: string
    attestationHash: string
    networkMode: 'none'
    containerExitCode: 0
    oomKilled: false
  }
  completedAt: string
}): ProfessionalLongFormFirstObjectChunkRenderEvidence {
  assertRenderLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_first_object_chunk_ffmpeg_runner' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      chunkId: input.authority.approvedChunk.chunkId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: renderOperation,
    requestEnvelopeSha256: input.runtime.requestEnvelopeSha256,
    sourceReadEvidenceHashes: input.sourceReadEvidenceHashes,
    sourceStagingEvidenceHashes: input.sourceStagingEvidenceHashes,
    sourceSha256s: input.sourceSha256s,
    capacityEvidenceHash: input.capacityEvidenceHash,
    outputArtifact: input.outputArtifact,
    runtime: {
      binaryVersion: input.runtime.binaryVersion,
      imageIdentityHash: input.runtime.imageIdentityHash,
      attestationRecordId: input.runtime.attestationRecordId,
      attestationHash: input.runtime.attestationHash,
      networkMode: input.runtime.networkMode,
      containerExitCode: input.runtime.containerExitCode,
      oomKilled: input.runtime.oomKilled,
    },
    checks: {
      approvedDependenciesReopened: 'passed' as const,
      immutableSourceBytesVerified: 'passed' as const,
      sourceOrderAndFrameRangesVerified: 'passed' as const,
      fixedHardCutStreamCopyExecuted: 'passed' as const,
      noDecodeOrReencode: 'passed' as const,
      noAudioEmbedded: 'passed' as const,
      exactPrivateCreateOnlyPersistence: 'passed' as const,
      independentQaStillRequired: true as const,
    },
    completedAt: input.completedAt,
  }
  return professionalLongFormFirstObjectChunkRenderEvidenceSchema.parse({
    ...payload,
    artifactHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormFirstObjectChunkRenderReconciliation(
  input: {
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
    authorization: ProfessionalLongFormFirstObjectChunkRenderAuthorization
    executionAttempt: ProfessionalLongFormFirstObjectChunkRenderAttempt
    outputArtifact: ProfessionalLongFormFirstObjectChunkMediaArtifactRef
    runtimeEvidenceRef: AuthorityJsonBlobRef
    reconciledAt: string
    allowCompletedRender?: boolean
    allowCompletedQa?: boolean
  },
): ProfessionalLongFormFirstObjectChunkRenderReconciliation {
  assertRenderLineage(input)
  const render = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === input.authority.identity.jobId)
  const downstream = input.current.queueAggregate.entries.filter((entry) =>
    entry.definition.dependencyJobIds.includes(input.authority.identity.jobId))
  if (
    !render || (render.state !== 'leased' &&
      !(input.allowCompletedRender && render.state === 'completed')) ||
    downstream.length !== 1 ||
    downstream[0]!.definition.canonicalOrder !== 4 ||
    (downstream[0]!.state !== 'queued' &&
      !(input.allowCompletedQa && downstream[0]!.state === 'completed')) ||
    (downstream[0]!.state === 'queued' && (
      downstream[0]!.professionalLongFormExecutionAuthorization ||
      downstream[0]!.professionalLongFormExecutionAttempt ||
      downstream[0]!.completion))
  ) throw new Error('First object-chunk render reconciliation lost paired QA state.')
  const qaManifest = input.current.postApproval.childJobManifest.jobs.find((job) =>
    job.jobId === downstream[0]!.definition.jobId)
  if (qaManifest?.kind !== PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_KIND) {
    throw new Error('First object-chunk render reconciliation lost QA identity.')
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_first_object_chunk_render_reconciliation' as const,
    renderJobId: input.authority.identity.jobId,
    renderApprovedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    qaDependency: {
      jobId: downstream[0]!.definition.jobId,
      approvedWorkItemId: downstream[0]!.definition.approvedWorkItemId,
      dependencyJobId: input.authority.identity.jobId,
      dependencySatisfiedByThisCompletion: true as const,
      executionAuthorized: false as const,
      capabilityBlockedPendingQueueGate: true as const,
    },
    decision:
      'private_render_artifact_ready_independent_qa_execution_not_yet_authorized' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormFirstObjectChunkRenderReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormFirstObjectChunkRenderResultHash(input: {
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
  executionAttempt: ProfessionalLongFormFirstObjectChunkRenderAttempt
  outputArtifact: ProfessionalLongFormFirstObjectChunkMediaArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:professional-long-form-first-object-chunk-render:v1',
    authorityHash: input.authority.authorityHash,
    attemptHash: input.executionAttempt.attemptHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormFirstObjectChunkRenderTerminal(input: {
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
  authorization: ProfessionalLongFormFirstObjectChunkRenderAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkRenderAttempt
  outputArtifact: ProfessionalLongFormFirstObjectChunkMediaArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormFirstObjectChunkRenderTerminal {
  assertRenderLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_first_object_chunk_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: renderOperation,
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
  return professionalLongFormFirstObjectChunkRenderTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormFirstObjectChunkRenderCompletion(input: {
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
  authorization: ProfessionalLongFormFirstObjectChunkRenderAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkRenderAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  outputArtifact: ProfessionalLongFormFirstObjectChunkMediaArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}) {
  assertRenderLineage(input)
  return professionalLongFormFirstObjectChunkRenderCompletionSchema.parse({
    schemaVersion:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: renderOperation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

export function buildProfessionalLongFormFirstObjectChunkQaArtifact(input: {
  authority: ProfessionalLongFormFirstObjectChunkQaAuthority
  authorization: ProfessionalLongFormFirstObjectChunkQaAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkQaAttempt
  rawProbeResultRef: AuthorityJsonBlobRef
  probeRuntimeEvidenceRef: AuthorityJsonBlobRef
  result: OfflineFfprobeExecutionResult
  evaluatedAt: string
}): ProfessionalLongFormFirstObjectChunkQaArtifact {
  assertQaLineage(input)
  assertBlobRef(input.rawProbeResultRef, input.result.resultJson.document)
  assertBlobRef(
    input.probeRuntimeEvidenceRef,
    professionalLongFormFirstObjectChunkQaRuntimeReceipt(input.result),
  )
  const document = input.result.resultJson.document
  const streams = Array.isArray(document.streams)
    ? document.streams as Array<Record<string, unknown>>
    : []
  const videoStreams = streams.filter((stream) => stream.codecType === 'video')
  const audioStreams = streams.filter((stream) => stream.codecType === 'audio')
  const video = videoStreams[0]
  const formatStart = finiteNumber(document.formatStartTimeSeconds)
  const videoStart = finiteNumber(video?.startTimeSeconds)
  const durationSeconds = finiteNumber(document.durationSeconds)
  const expectedSeconds = input.authority.approvedChunk.durationFrames / 30
  const tolerance = 1 / 30 + 0.001
  if (
    document.profileId !== 'object_mezzanine_chunk_qa_v1' ||
    !String(document.formatName).includes('matroska') ||
    videoStreams.length !== 1 || audioStreams.length !== 0 ||
    streams.length !== 1 || !video || video.codecName !== 'h264' ||
    video.pixelFormat !== 'yuv420p' ||
    video.colorRange !== 'tv' || video.colorSpace !== 'bt709' ||
    video.colorTransfer !== 'bt709' || video.colorPrimaries !== 'bt709' ||
    video.width !== input.authority.approvedChunk.width ||
    video.height !== input.authority.approvedChunk.height ||
    video.fps !== 30 ||
    video.readFrameCount !== input.authority.approvedChunk.durationFrames ||
    formatStart === undefined || formatStart < 0 || formatStart > tolerance ||
    videoStart === undefined || videoStart < 0 || videoStart > tolerance ||
    durationSeconds === undefined ||
    Math.abs(durationSeconds - expectedSeconds) > tolerance ||
    input.result.evidence.sourceSha256 !== input.authority.renderArtifact.sha256 ||
    input.result.evidence.resultSha256 !== input.result.resultJson.sha256 ||
    input.result.evidence.containerExitCode !== 0 ||
    input.result.evidence.oomKilled ||
    input.result.readiness.productReady
  ) throw new Error(
    'First object-chunk independent QA failed frame, color, timestamp, duration, or artifact lineage.',
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_first_object_chunk_ffprobe_qa' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      chunkId: input.authority.approvedChunk.chunkId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: qaOperation,
    renderArtifact: input.authority.renderArtifact,
    rawProbeResultRef: input.rawProbeResultRef,
    probeRuntimeEvidenceRef: input.probeRuntimeEvidenceRef,
    requestEnvelopeSha256: input.result.evidence.requestEnvelopeSha256,
    probeAttestationHash: input.result.attestation.attestationHash,
    observed: {
      container: 'matroska' as const,
      videoStreamCount: 1 as const,
      audioStreamCount: 0 as const,
      codecName: 'h264' as const,
      pixelFormat: 'yuv420p' as const,
      width: input.authority.approvedChunk.width,
      height: input.authority.approvedChunk.height,
      frameRateNumerator: 30 as const,
      frameRateDenominator: 1 as const,
      frameCount: input.authority.approvedChunk.durationFrames,
      formatStartTimeSeconds: formatStart,
      videoStartTimeSeconds: videoStart,
      durationSeconds,
      durationFrames: input.authority.approvedChunk.durationFrames,
      colorRange: 'tv' as const,
      colorSpace: 'bt709' as const,
      colorTransfer: 'bt709' as const,
      colorPrimaries: 'bt709' as const,
    },
    checks: {
      exactPersistedArtifactReopened: 'passed' as const,
      independentProbeExecuted: 'passed' as const,
      exactFrameCountRateAndDuration: 'passed' as const,
      exactOutputFrame: 'passed' as const,
      exactH264PixelAndColorMetadata: 'passed' as const,
      videoOnlyObjectChunk: 'passed' as const,
      sourceAndTimelineLineage: 'passed' as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.evaluatedAt,
  }
  return professionalLongFormFirstObjectChunkQaArtifactSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormFirstObjectChunkQaRuntimeReceipt(
  result: OfflineFfprobeExecutionResult,
) {
  return {
    schemaVersion:
      'professional-long-form-first-object-chunk-qa-runtime-receipt-v1' as const,
    source: 'offline_media_binary_ffprobe_runtime' as const,
    resultSha256: result.resultJson.sha256,
    resultByteLength: result.resultJson.byteLength,
    evidence: result.evidence,
    image: result.image,
    attestation: result.attestation,
    readiness: result.readiness,
  }
}

export function buildProfessionalLongFormFirstObjectChunkQaReconciliation(
  input: {
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormFirstObjectChunkQaAuthority
    authorization: ProfessionalLongFormFirstObjectChunkQaAuthorization
    executionAttempt: ProfessionalLongFormFirstObjectChunkQaAttempt
    qaArtifactRef: AuthorityJsonBlobRef
    reconciledAt: string
    allowCompletedQa?: boolean
  },
): ProfessionalLongFormFirstObjectChunkQaReconciliation {
  assertQaLineage(input)
  const qaEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === input.authority.identity.jobId)
  const kindByWorkItemId = new Map(
    input.current.postApproval.childJobManifest.jobs.map((job) => [
      job.childWorkItemId,
      job.kind,
    ]),
  )
  const downstreamEntries = input.current.queueAggregate.entries.filter((entry) =>
    entry.definition.dependencyJobIds.includes(input.authority.identity.jobId))
  const allowedKinds = new Set([
    'validate_cross_chunk_color_continuity',
    'finalize_private_4k_master',
  ])
  if (
    !qaEntry || (qaEntry.state !== 'leased' &&
      !(input.allowCompletedQa && qaEntry.state === 'completed')) ||
    downstreamEntries.length !== 2 ||
    downstreamEntries.some((entry) =>
      !allowedKinds.has(kindByWorkItemId.get(entry.definition.approvedWorkItemId) ?? '') ||
      entry.state !== 'queued' || entry.professionalLongFormExecutionAuthorization ||
      entry.professionalLongFormExecutionAttempt || entry.completion ||
      entry.definition.dependencyJobIds.every((dependencyId) =>
        dependencyId === input.authority.identity.jobId ||
        input.current.queueAggregate.entries.some((candidate) =>
          candidate.definition.jobId === dependencyId && candidate.state === 'completed')))
  ) throw new Error(
    'First object-chunk QA reconciliation lost blocked color or finalization state.',
  )
  const downstream = downstreamEntries.map((entry) => ({
    jobId: entry.definition.jobId,
    approvedWorkItemId: entry.definition.approvedWorkItemId,
    dependencyJobId: input.authority.identity.jobId,
    thisDependencySatisfied: true as const,
    everyRequiredDependencySatisfied: false as const,
    executionAuthorized: false as const,
  }))
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_first_object_chunk_qa_reconciliation' as const,
    qaJobId: input.authority.identity.jobId,
    qaApprovedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    renderArtifact: input.authority.renderArtifact,
    qaArtifactRef: input.qaArtifactRef,
    downstream,
    decision:
      'first_chunk_qa_passed_remaining_chunks_audio_color_and_finalization_blocked' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormFirstObjectChunkQaReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormFirstObjectChunkQaResultHash(input: {
  authority: ProfessionalLongFormFirstObjectChunkQaAuthority
  executionAttempt: ProfessionalLongFormFirstObjectChunkQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:professional-long-form-first-object-chunk-qa:v1',
    authorityHash: input.authority.authorityHash,
    attemptHash: input.executionAttempt.attemptHash,
    renderArtifact: input.authority.renderArtifact,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormFirstObjectChunkQaTerminal(input: {
  authority: ProfessionalLongFormFirstObjectChunkQaAuthority
  authorization: ProfessionalLongFormFirstObjectChunkQaAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormFirstObjectChunkQaTerminal {
  assertQaLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_first_object_chunk_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: qaOperation,
    renderArtifact: input.authority.renderArtifact,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    remainingPipelineExecutionAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormFirstObjectChunkQaTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormFirstObjectChunkQaCompletion(input: {
  authority: ProfessionalLongFormFirstObjectChunkQaAuthority
  authorization: ProfessionalLongFormFirstObjectChunkQaAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkQaAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}) {
  assertQaLineage(input)
  return professionalLongFormFirstObjectChunkQaCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: qaOperation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    validationArtifactRef: input.validationArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

function selectFirstChunk(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const plan = current.postApproval.bridge.binding.plan
  const chunk = plan.chunks[0]
  const renderWorkItem = plan.workGraph.workItems.find((workItem) =>
    workItem.kind === PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_KIND &&
    workItem.expectedOutputIdentity === chunk?.expectedObject.objectIdentity)
  const qaWorkItem = plan.workGraph.workItems.find((workItem) =>
    workItem.kind === PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_KIND &&
    workItem.dependsOn.length === 1 &&
    workItem.dependsOn[0] === renderWorkItem?.workItemId)
  const manifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === renderWorkItem?.workItemId)
  const qaManifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === qaWorkItem?.workItemId)
  const placement = current.placementManifest.placements.find((entry) =>
    entry.childWorkItemId === renderWorkItem?.workItemId)
  const queueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === renderWorkItem?.workItemId)
  const queueEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === renderWorkItem?.workItemId)
  const request = plan.request
  if (
    !chunk || chunk.chunkIndex !== 1 || chunk.globalStartFrame !== 0 ||
    !renderWorkItem || !qaWorkItem || !manifestJob || !qaManifestJob ||
    !placement || !queueJob || !queueEntry ||
    request.confirmedOutputFrame.frameRate.numerator !== 30 ||
    request.confirmedOutputFrame.frameRate.denominator !== 1 ||
    chunk.sourceSlices.length < 2 || chunk.sourceSlices.length > 16 ||
    chunk.sourceSlices.some((slice, index) =>
      slice.sourceStartFrame !== 0 ||
      !['timeline_start', 'approved_hard_cut'].includes(slice.boundaryBefore) ||
      (index === 0) !== (slice.boundaryBefore === 'timeline_start'))
  ) throw new Error(
    'Approved long-form plan does not contain the bounded first object-chunk profile.',
  )
  const approvedChunk = {
    chunkId: chunk.chunkId,
    chunkIndex: 1 as const,
    chunkCount: chunk.chunkCount,
    globalStartFrame: 0 as const,
    globalEndFrameExclusive: chunk.globalEndFrameExclusive,
    durationFrames: chunk.durationFrames,
    width: request.confirmedOutputFrame.width,
    height: request.confirmedOutputFrame.height,
    fps: 30 as const,
    sourceSlices: chunk.sourceSlices.map((slice, index) => ({
      sliceIndex: index + 1,
      segmentId: slice.segmentId,
      sourceSequenceItemId: slice.sourceSequenceItemId,
      mediaAssetId: slice.mediaAssetId,
      sourceObjectGeneration: slice.sourceObjectGeneration,
      sourceSha256: slice.sourceSha256,
      sourceCleanupDecisionId: slice.sourceCleanupDecisionId,
      sourceStartFrame: 0 as const,
      sourceEndFrameExclusive: slice.sourceEndFrameExclusive,
      globalTimelineStartFrame: slice.globalTimelineStartFrame,
      globalTimelineEndFrameExclusive: slice.globalTimelineEndFrameExclusive,
      chunkLocalStartFrame: slice.chunkLocalStartFrame,
      chunkLocalEndFrameExclusive: slice.chunkLocalEndFrameExclusive,
      boundaryBefore: slice.boundaryBefore as 'timeline_start' | 'approved_hard_cut',
    })),
    expectedObject: {
      objectIdentity: chunk.expectedObject.objectIdentity,
      runtimeRegion: chunk.expectedObject.runtimeRegion,
      contentType: 'video/x-matroska' as const,
      assetRole: chunk.expectedObject.assetRole,
      objectVersion: chunk.expectedObject.objectVersion,
      rendererLayerIdentity: chunk.expectedObject.rendererLayerIdentity,
      placeholderAllowed: chunk.expectedObject.placeholderAllowed,
      createOnlyRequired: chunk.expectedObject.createOnlyRequired,
    },
    chunkAuthorityHash: chunk.chunkAuthorityHash,
  }
  return {
    chunk,
    approvedChunk,
    renderWorkItem,
    qaWorkItem,
    manifestJob,
    qaManifestJob,
    placement,
    queueJob,
    queueEntry,
  }
}

function exactRenderDependencies(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  renderEntry: CanonicalProfessionalLongFormCurrentChildPackageAuthority[
    'queueAggregate'
  ]['entries'][number],
) {
  if (renderEntry.definition.dependencyJobIds.length !== 3) {
    throw new Error('First object-chunk render must have exactly three dependencies.')
  }
  return renderEntry.definition.dependencyJobIds.map((jobId) => {
    const entry = current.queueAggregate.entries.find((candidate) =>
      candidate.definition.jobId === jobId)
    if (!entry || entry.state !== 'completed' || !entry.completion) {
      throw new Error('First object-chunk render dependency is not completed.')
    }
    if (entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID) {
      const completion = professionalLongFormFirstChildCompletionSchema.parse(
        entry.completion.outcome.professionalLongFormExecution,
      )
      return dependencyRecord('validate_approved_snapshot', entry, completion)
    }
    if (entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID) {
      const completion = professionalLongFormSourceAuthorityCompletionSchema.parse(
        entry.completion.outcome.professionalLongFormExecution,
      )
      return dependencyRecord('validate_private_source_authority', entry, completion)
    }
    if (entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID) {
      const completion = professionalLongFormMasterTimingCompletionSchema.parse(
        entry.completion.outcome.professionalLongFormExecution,
      )
      return dependencyRecord('validate_master_timing', entry, completion)
    }
    throw new Error('First object-chunk render has an unexpected dependency.')
  })
}

function dependencyRecord(
  kind: 'validate_approved_snapshot' | 'validate_private_source_authority' |
    'validate_master_timing',
  entry: CanonicalProfessionalLongFormCurrentChildPackageAuthority[
    'queueAggregate'
  ]['entries'][number],
  completion: {
    canonicalResultHash: string
    attemptInternalCostEvidenceHash: string
  },
) {
  if (!entry.completion) {
    throw new Error('First object-chunk dependency completion is missing.')
  }
  return {
    kind,
    jobId: entry.definition.jobId,
    approvedWorkItemId: entry.definition.approvedWorkItemId,
    queueCompletionHash: entry.completion.completionHash,
    canonicalResultHash: completion.canonicalResultHash,
    attemptInternalCostEvidenceHash:
      completion.attemptInternalCostEvidenceHash,
  }
}

function latestCompletionTimestamp(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  jobIds: string[],
): string {
  const timestamps = jobIds.map((jobId) => {
    const completedAt = current.queueAggregate.entries.find((entry) =>
      entry.definition.jobId === jobId)?.completion?.completedAt
    if (!completedAt) throw new Error('Dependency completion timestamp is missing.')
    return Date.parse(completedAt)
  })
  return new Date(Math.max(...timestamps)).toISOString()
}

function remainingReservationCredits(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
): number {
  const reservation = current.authority.reservation
  return reservation.reservedCredits - reservation.spentCredits -
    reservation.releasedCredits - reservation.refundedCredits
}

function assertRenderLineage(input: {
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
  authorization: ProfessionalLongFormFirstObjectChunkRenderAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkRenderAttempt
}): void {
  assertHashedRecord(input.authority, 'authorityHash')
  assertHashedRecord(input.authorization, 'receiptHash')
  assertHashedRecord(input.executionAttempt, 'attemptHash')
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.authorization.jobId !== input.authority.identity.jobId ||
    input.authorization.expectedOutputIdentity !==
      input.authority.identity.expectedOutputIdentity ||
    input.executionAttempt.authorizationId !==
      input.authorization.authorizationId ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    stableAuthorityStringify(input.authorization.operation) !==
      stableAuthorityStringify(renderOperation) ||
    stableAuthorityStringify(input.executionAttempt.operation) !==
      stableAuthorityStringify(renderOperation)
  ) throw new Error('First object-chunk render execution lineage is invalid.')
}

function assertQaLineage(input: {
  authority: ProfessionalLongFormFirstObjectChunkQaAuthority
  authorization: ProfessionalLongFormFirstObjectChunkQaAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkQaAttempt
}): void {
  assertHashedRecord(input.authority, 'authorityHash')
  assertHashedRecord(input.authorization, 'receiptHash')
  assertHashedRecord(input.executionAttempt, 'attemptHash')
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.authorization.jobId !== input.authority.identity.jobId ||
    input.executionAttempt.authorizationId !==
      input.authorization.authorizationId ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    stableAuthorityStringify(input.authorization.operation) !==
      stableAuthorityStringify(qaOperation) ||
    stableAuthorityStringify(input.executionAttempt.operation) !==
      stableAuthorityStringify(qaOperation)
  ) throw new Error('First object-chunk QA execution lineage is invalid.')
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (ref.sha256 !== sha256AuthorityValue(value) || ref.byteLength <= 0) {
    throw new Error('First object-chunk content-addressed ref is invalid.')
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
    throw new Error(`First object-chunk ${hashKey} is invalid.`)
  }
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined
}
