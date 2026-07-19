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
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID,
  professionalLongFormMasterAssemblyCompletionSchema,
} from './professional-long-form-master-assembly-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_KIND,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_TERMINAL_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID,
  professionalLongFormPrivateMasterQaArtifactSchema,
  professionalLongFormPrivateMasterQaAuthoritySchema,
  professionalLongFormPrivateMasterQaAuthorizationSchema,
  professionalLongFormPrivateMasterQaCompletionSchema,
  professionalLongFormPrivateMasterQaReconciliationSchema,
  professionalLongFormPrivateMasterQaTerminalSchema,
  type ProfessionalLongFormPrivateMasterQaArtifact,
  type ProfessionalLongFormPrivateMasterQaAttempt,
  type ProfessionalLongFormPrivateMasterQaAuthority,
  type ProfessionalLongFormPrivateMasterQaAuthorization,
  type ProfessionalLongFormPrivateMasterQaReconciliation,
  type ProfessionalLongFormPrivateMasterQaTerminal,
} from './professional-long-form-private-master-qa-execution-contract'

const operation = {
  operationId: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
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

const persistence = {
  privateLocalContentAddressed: true as const,
  queueReceiptRequiredBeforeLease: true as const,
  queueAttemptRequiredBeforeOperation: true as const,
  queueCompletionIsAuthorityCommit: true as const,
  orphanBlobsGrantExecutionAuthority: false as const,
  distributedDatabaseBacked: false as const,
  productionDurabilityProven: false as const,
}

export function buildProfessionalLongFormPrivateMasterQaAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  heartbeatIntervalMilliseconds: number
}): ProfessionalLongFormPrivateMasterQaAuthority {
  const { current } = input
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const selection = selectPrivateMasterQa(current)
  const assemblyCompletion = professionalLongFormMasterAssemblyCompletionSchema
    .safeParse(selection.assemblyEntry.completion?.outcome
      .professionalLongFormExecution)
  const remainingReservedCredits = reservation.reservedCredits -
    reservation.spentCredits - reservation.releasedCredits -
    reservation.refundedCredits
  const chunkCount = current.postApproval.bridge.binding.plan.chunks.length
  const expectedOrder = chunkCount * 2 + 6
  const expectedOutput = `${snapshot.snapshotId}:private-4k-master-qa`
  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    current.authority.approval.approvedByUserId !== input.ownerUserId ||
    current.authority.approval.id !== snapshot.approvalId ||
    reservation.status !== 'reserved' || reservation.id !== snapshot.reservationId ||
    remainingReservedCredits <= 0 ||
    !assemblyCompletion.success || selection.assemblyEntry.state !== 'completed' ||
    selection.assemblyEntry.definition.approvedWorkItemId !==
      PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID ||
    selection.qaWorkItem.kind !== PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_KIND ||
    selection.qaWorkItem.workItemId !==
      PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID ||
    selection.qaEntry.definition.canonicalOrder !== expectedOrder ||
    selection.qaEntry.definition.workerType !== 'qa_worker' ||
    selection.qaEntry.definition.resourceClassId !== 'qa_cpu_standard_v1' ||
    selection.qaEntry.definition.maxAttempts !== 2 ||
    selection.qaEntry.definition.attemptTimeoutSeconds !== 3_600 ||
    selection.qaEntry.definition.dependencyJobIds.length !== 1 ||
    selection.qaEntry.definition.dependencyJobIds[0] !==
      selection.assemblyEntry.definition.jobId ||
    selection.qaEntry.definition.expectedOutputIdentity !== expectedOutput ||
    selection.qaManifestJob.expectedOutputIdentity !== expectedOutput ||
    selection.qaPlacement.workerType !== 'qa_worker' ||
    selection.qaPlacement.resourceClassId !== 'qa_cpu_standard_v1' ||
    selection.qaPlacement.maxAttempts !== 2 ||
    selection.qaPlacement.attemptTimeoutSeconds !== 3_600 ||
    selection.qaPlacement.placementHash !==
      selection.qaEntry.definition.placementHash ||
    selection.qaQueueJob.definitionHash !==
      selection.qaEntry.definition.definitionHash ||
    assemblyCompletion.data.outputArtifact.objectIdentity !==
      selection.assemblyEntry.completion?.outcome.artifactId ||
    assemblyCompletion.data.outputArtifact.sha256 !==
      selection.assemblyEntry.completion?.outcome.sha256
  ) throw new Error(
    'Private-master QA lost snapshot, reservation, assembly, placement, or exact queue authority.',
  )

  const expectationWithoutHash = {
    inspectionProfileId: 'private_long_form_master_qa_v1' as const,
    container: 'matroska' as const,
    videoCodec: 'vp9' as const,
    audioCodec: 'flac' as const,
    width: assemblyCompletion.data.outputArtifact.width,
    height: assemblyCompletion.data.outputArtifact.height,
    fps: 30 as const,
    totalFrames: assemblyCompletion.data.outputArtifact.frameCount,
    pixelFormat: 'yuv420p' as const,
    colorRange: 'tv' as const,
    colorSpace: 'bt709' as const,
    colorTransfer: 'bt709' as const,
    colorPrimaries: 'bt709' as const,
    sampleRate: 48_000 as const,
    channels: 2 as const,
    channelLayout: 'stereo' as const,
    expectedDurationSeconds:
      assemblyCompletion.data.outputArtifact.frameCount / 30,
    maximumDurationDriftSeconds: 1 / 30 + 0.001,
  }
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_private_master_qa_authority' as const,
    purpose:
      'authorize_one_independent_private_probe_of_exact_long_form_review_master' as const,
    status: 'private_long_form_master_independent_qa_authorized' as const,
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
      expectedOutputIdentity: expectedOutput,
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
    approvedMaster: assemblyCompletion.data.outputArtifact,
    approvedQaExpectation: {
      ...expectationWithoutHash,
      expectationHash: sha256AuthorityValue(expectationWithoutHash),
    },
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
      qaJobAuthorityHash: selection.qaManifestJob.jobAuthorityHash,
      qaJobDefinitionHash: selection.qaQueueJob.definitionHash,
      qaPlacementHash: selection.qaPlacement.placementHash,
      assemblyJobId: selection.assemblyEntry.definition.jobId,
      assemblyApprovedWorkItemId:
        selection.assemblyEntry.definition.approvedWorkItemId,
      assemblyQueueCompletionHash:
        selection.assemblyEntry.completion!.completionHash,
      assemblyCanonicalResultHash: assemblyCompletion.data.canonicalResultHash,
      assemblyAttemptInternalCostEvidenceHash:
        assemblyCompletion.data.attemptInternalCostEvidenceHash,
      assemblyRuntimeEvidenceRef: assemblyCompletion.data.runtimeEvidenceRef,
      assemblyReconciliationEvidenceRef:
        assemblyCompletion.data.reconciliationEvidenceRef,
      assemblyTerminalEvidenceRef: assemblyCompletion.data.terminalEvidenceRef,
    },
    operation: {
      ...operation,
      workerType: 'qa_worker' as const,
      resourceClassId: 'qa_cpu_standard_v1' as const,
      maximumAttempts: 2 as const,
      attemptTimeoutSeconds: 3_600 as const,
      leaseDurationMilliseconds: 300_000 as const,
      heartbeatIntervalMilliseconds: input.heartbeatIntervalMilliseconds,
      vcpuCount: 2 as const,
      memoryGib: 4 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableAssemblyCompletionRequired: true as const,
      exactPrivateMasterRead: true as const,
      independentFullInputFfprobe: true as const,
      exactContainerStreamFrameColorAudioDurationValidation: true as const,
      mediaMutationAllowed: false as const,
      privateQaArtifactCreateOnly: true as const,
      customerDeliveryMasterExecution: false as const,
      exportExecution: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence,
    authorizedAt: selection.assemblyEntry.completion!.completedAt,
  }
  return professionalLongFormPrivateMasterQaAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormPrivateMasterQaAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  heartbeatIntervalMilliseconds: number
}): ProfessionalLongFormPrivateMasterQaAuthority {
  const parsed = professionalLongFormPrivateMasterQaAuthoritySchema.parse(
    input.value,
  )
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormPrivateMasterQaAuthority(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error('Private-master QA authority failed exact replay.')
  }
  return expected
}

export function buildProfessionalLongFormPrivateMasterQaAuthorization(input: {
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormPrivateMasterQaAuthorization {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_private_master_qa_authority' as const,
    authorizationId:
      `long-form-private-master-qa-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.qaJobDefinitionHash,
    placementHash: input.authority.lineage.qaPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      exactPrivateMasterRead: true as const,
      independentFullInputProbe: true as const,
      privateQaPersistence: true as const,
      customerDeliveryMasterExecution: false as const,
      exportExecution: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormPrivateMasterQaAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormPrivateMasterQaArtifact(input: {
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  authorization: ProfessionalLongFormPrivateMasterQaAuthorization
  executionAttempt: ProfessionalLongFormPrivateMasterQaAttempt
  rawProbeResultRef: AuthorityJsonBlobRef
  probeRuntimeEvidenceRef: AuthorityJsonBlobRef
  queueLeaseEvidence: {
    claimId: string
    deliveryAttempt: 1
    initialClaimHash: string
    heartbeatClaimHash: string
    heartbeatCount: number
    heartbeatAt: string
    expiresAt: string
    attemptDeadlineAt: string
    boundedLeaseRenewalObserved: true
  }
  result: OfflineFfprobeExecutionResult
  evaluatedAt: string
}): ProfessionalLongFormPrivateMasterQaArtifact {
  assertExecutionLineage(input)
  assertBlobRef(input.rawProbeResultRef, input.result.resultJson.document)
  assertBlobRef(
    input.probeRuntimeEvidenceRef,
    professionalLongFormPrivateMasterQaRuntimeReceipt(input.result),
  )
  const document = input.result.resultJson.document
  const streams = Array.isArray(document.streams)
    ? document.streams as Array<Record<string, unknown>>
    : []
  const videoStreams = streams.filter((stream) => stream.codecType === 'video')
  const audioStreams = streams.filter((stream) => stream.codecType === 'audio')
  const video = videoStreams[0]
  const audio = audioStreams[0]
  const expectation = input.authority.approvedQaExpectation
  const formatStart = finiteNumber(document.formatStartTimeSeconds)
  const videoStart = finiteNumber(video?.startTimeSeconds)
  const audioStart = finiteNumber(audio?.startTimeSeconds)
  const durationSeconds = finiteNumber(document.durationSeconds)
  const sizeBytes = integer(document.sizeBytes)
  const startTolerance = expectation.maximumDurationDriftSeconds
  if (
    document.profileId !== expectation.inspectionProfileId ||
    !String(document.formatName).split(',').includes('matroska') ||
    streams.length !== 2 || videoStreams.length !== 1 ||
    audioStreams.length !== 1 || !video || !audio ||
    video.codecName !== expectation.videoCodec ||
    audio.codecName !== expectation.audioCodec ||
    video.pixelFormat !== expectation.pixelFormat ||
    video.width !== expectation.width || video.height !== expectation.height ||
    video.fps !== expectation.fps ||
    video.readFrameCount !== expectation.totalFrames ||
    video.colorRange !== expectation.colorRange ||
    video.colorSpace !== expectation.colorSpace ||
    video.colorTransfer !== expectation.colorTransfer ||
    video.colorPrimaries !== expectation.colorPrimaries ||
    audio.sampleRate !== expectation.sampleRate ||
    audio.channels !== expectation.channels ||
    audio.channelLayout !== expectation.channelLayout ||
    formatStart === undefined || formatStart < 0 || formatStart > startTolerance ||
    videoStart === undefined || videoStart < 0 || videoStart > startTolerance ||
    audioStart === undefined || audioStart < 0 || audioStart > startTolerance ||
    Math.abs(videoStart - audioStart) > startTolerance ||
    durationSeconds === undefined ||
    Math.abs(durationSeconds - expectation.expectedDurationSeconds) >
      expectation.maximumDurationDriftSeconds ||
    sizeBytes !== input.authority.approvedMaster.byteLength ||
    input.result.evidence.sourceSha256 !== input.authority.approvedMaster.sha256 ||
    input.result.evidence.resultSha256 !== input.result.resultJson.sha256 ||
    input.result.evidence.containerExitCode !== 0 ||
    input.result.evidence.oomKilled ||
    input.result.evidence.semanticEvidence.sourceBytesVerified !== true ||
    input.result.evidence.semanticEvidence.frameCountsRequested !== true ||
    input.result.readiness.privateInternalOnly !== true ||
    input.result.readiness.productReady || input.result.readiness.productionReady
  ) throw new Error(
    'Private-master independent QA failed container, stream, frame, color, audio, timestamp, duration, or checksum lineage.',
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_private_master_ffprobe_qa' as const,
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
    masterArtifact: input.authority.approvedMaster,
    rawProbeResultRef: input.rawProbeResultRef,
    probeRuntimeEvidenceRef: input.probeRuntimeEvidenceRef,
    requestEnvelopeSha256: input.result.evidence.requestEnvelopeSha256,
    probeAttestationHash: input.result.attestation.attestationHash,
    observed: {
      container: 'matroska' as const,
      streamCount: 2 as const,
      videoStreamCount: 1 as const,
      audioStreamCount: 1 as const,
      videoCodec: 'vp9' as const,
      audioCodec: 'flac' as const,
      pixelFormat: 'yuv420p' as const,
      width: expectation.width,
      height: expectation.height,
      frameRateNumerator: 30 as const,
      frameRateDenominator: 1 as const,
      frameCount: expectation.totalFrames,
      colorRange: 'tv' as const,
      colorSpace: 'bt709' as const,
      colorTransfer: 'bt709' as const,
      colorPrimaries: 'bt709' as const,
      sampleRate: 48_000 as const,
      channels: 2 as const,
      channelLayout: 'stereo' as const,
      formatStartTimeSeconds: formatStart,
      videoStartTimeSeconds: videoStart,
      audioStartTimeSeconds: audioStart,
      durationSeconds,
      expectedDurationSeconds: expectation.expectedDurationSeconds,
      maximumDurationDriftSeconds: expectation.maximumDurationDriftSeconds,
      sizeBytes,
    },
    checks: {
      exactPersistedMasterReopened: 'passed' as const,
      independentFullInputProbeExecuted: 'passed' as const,
      exactContainerAndStreamTopology: 'passed' as const,
      exactFrameCountRateAndDuration: 'passed' as const,
      exactOutputFrame: 'passed' as const,
      exactVp9PixelAndBt709Metadata: 'passed' as const,
      exactFlac48kStereoMetadata: 'passed' as const,
      videoAudioStartSyncWithinOneFrame: 'passed' as const,
      exactImmutableMasterChecksum: 'passed' as const,
      mediaMutationOccurred: false as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.evaluatedAt,
  }
  return professionalLongFormPrivateMasterQaArtifactSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormPrivateMasterQaRuntimeReceipt(
  result: OfflineFfprobeExecutionResult,
) {
  return {
    schemaVersion:
      'professional-long-form-private-master-qa-runtime-receipt-v1' as const,
    source: 'offline_media_binary_ffprobe_runtime' as const,
    resultSha256: result.resultJson.sha256,
    resultByteLength: result.resultJson.byteLength,
    evidence: result.evidence,
    image: result.image,
    attestation: result.attestation,
    readiness: result.readiness,
  }
}

export function buildProfessionalLongFormPrivateMasterQaReconciliation(input: {
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  authorization: ProfessionalLongFormPrivateMasterQaAuthorization
  executionAttempt: ProfessionalLongFormPrivateMasterQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciledAt: string
  allowCompletedQa?: boolean
}): ProfessionalLongFormPrivateMasterQaReconciliation {
  assertExecutionLineage(input)
  const entry = selectPrivateMasterQa(input.current).qaEntry
  const total = input.current.queueAggregate.summary.totalJobCount
  const completedBefore = entry.state === 'completed'
    ? input.current.queueAggregate.summary.completedJobCount - 1
    : input.current.queueAggregate.summary.completedJobCount
  if (
    (entry.state !== 'leased' &&
      !(input.allowCompletedQa && entry.state === 'completed')) ||
    total < 11 || total > 255 || completedBefore !== total - 1 ||
    input.current.queueAggregate.summary.queuedJobCount !== 0 ||
    (entry.state === 'leased' &&
      input.current.queueAggregate.summary.leasedJobCount !== 1) ||
    (entry.state === 'completed' &&
      input.current.queueAggregate.summary.leasedJobCount !== 0)
  ) throw new Error(
    'Private-master QA reconciliation did not close exactly one final graph job.',
  )
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_private_master_qa_reconciliation' as const,
    qaJobId: input.authority.identity.jobId,
    qaApprovedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    masterArtifact: input.authority.approvedMaster,
    qaArtifactRef: input.qaArtifactRef,
    graph: {
      totalChildJobCount: total,
      completedBeforeThisQa: completedBefore,
      completedAfterThisQa: completedBefore + 1,
      remainingIncompleteAfterThisQa: 0 as const,
      privateReviewGraphComplete: true as const,
    },
    downstream: {
      customerDeliveryMasterCreated: false as const,
      customerDeliveryMasterExecutionAuthorized: false as const,
      exportExecutionAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      revisedScopeApprovalCreated: false as const,
    },
    decision:
      'private_review_graph_complete_customer_delivery_and_export_separately_gated' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormPrivateMasterQaReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormPrivateMasterQaResultHash(input: {
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  executionAttempt: ProfessionalLongFormPrivateMasterQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:professional-long-form-private-master-qa:v1',
    authorityHash: input.authority.authorityHash,
    attemptHash: input.executionAttempt.attemptHash,
    masterArtifact: input.authority.approvedMaster,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormPrivateMasterQaTerminal(input: {
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  authorization: ProfessionalLongFormPrivateMasterQaAuthorization
  executionAttempt: ProfessionalLongFormPrivateMasterQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormPrivateMasterQaTerminal {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_private_master_qa_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation,
    masterArtifact: input.authority.approvedMaster,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    privateReviewGraphComplete: true as const,
    customerDeliveryMasterCreated: false as const,
    exportExecutionAuthorized: false as const,
    publicDeliveryAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormPrivateMasterQaTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormPrivateMasterQaCompletion(input: {
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  authorization: ProfessionalLongFormPrivateMasterQaAuthorization
  executionAttempt: ProfessionalLongFormPrivateMasterQaAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}) {
  assertExecutionLineage(input)
  return professionalLongFormPrivateMasterQaCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COMPLETION_VERSION,
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

function selectPrivateMasterQa(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const qaWorkItem = current.postApproval.bridge.binding.plan.workGraph.workItems
    .find((item) => item.kind === PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_KIND)
  const qaManifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === qaWorkItem?.workItemId)
  const qaPlacement = current.placementManifest.placements.find((placement) =>
    placement.childWorkItemId === qaWorkItem?.workItemId)
  const qaQueueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === qaWorkItem?.workItemId)
  const qaEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === qaWorkItem?.workItemId)
  const assemblyEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID)
  if (
    !qaWorkItem || !qaManifestJob || !qaPlacement || !qaQueueJob || !qaEntry ||
    !assemblyEntry
  ) throw new Error('Canonical private-master QA job is missing.')
  return {
    qaWorkItem,
    qaManifestJob,
    qaPlacement,
    qaQueueJob,
    qaEntry,
    assemblyEntry,
  }
}

function assertExecutionLineage(input: {
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  authorization: ProfessionalLongFormPrivateMasterQaAuthorization
  executionAttempt?: ProfessionalLongFormPrivateMasterQaAttempt
}): void {
  const { receiptHash, ...authorizationPayload } = input.authorization
  if (
    input.authority.authorityHash !== input.authorization.authorityHash ||
    receiptHash !== sha256AuthorityValue(authorizationPayload) ||
    input.authorization.jobId !== input.authority.identity.jobId ||
    input.authorization.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId ||
    input.authorization.operation.operationId !== operation.operationId ||
    input.authorization.operation.runnerClass !== operation.runnerClass ||
    input.authorization.operation.attemptCostProfileId !==
      operation.attemptCostProfileId ||
    (input.executionAttempt && (
      input.executionAttempt.authorizationId !==
        input.authorization.authorizationId ||
      input.executionAttempt.authorityHash !== input.authority.authorityHash ||
      input.executionAttempt.jobId !== input.authority.identity.jobId ||
      input.executionAttempt.approvedWorkItemId !==
        input.authority.identity.approvedWorkItemId ||
      stableAuthorityStringify(input.executionAttempt.operation) !==
        stableAuthorityStringify(operation)
    ))
  ) throw new Error('Private-master QA execution lineage changed.')
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  const serialized = stableAuthorityStringify(value)
  if (
    ref.sha256 !== sha256AuthorityValue(value) ||
    ref.byteLength !== Buffer.byteLength(serialized, 'utf8')
  ) throw new Error('Private-master QA content-addressed blob changed.')
}

function assertHashed<T extends string>(
  value: Record<T, string> & Record<string, unknown>,
  key: T,
): void {
  const payload = { ...value }
  const expected = payload[key]
  delete payload[key]
  if (expected !== sha256AuthorityValue(payload)) {
    throw new Error(`Private-master QA ${key} checksum changed.`)
  }
}

function finiteNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function integer(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}
