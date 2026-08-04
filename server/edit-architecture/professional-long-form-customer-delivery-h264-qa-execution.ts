import type {
  OfflineFfprobeExecutionResult,
} from '../tool-execution/media-binary-execution/offline-media-binary-types'
import type {
  OfflineMediaBinaryRuntimeAuthority,
} from '../tool-execution/media-binary-execution/offline-media-binary-runtime'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import type {
  CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
} from './professional-long-form-customer-delivery-execution'
import {
  professionalLongFormDeliveryH264CompletionSchema,
} from './professional-long-form-customer-delivery-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_INSPECTION_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RECIPE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_TERMINAL_VERSION,
  professionalLongFormDeliveryH264QaArtifactSchema,
  professionalLongFormDeliveryH264QaAuthoritySchema,
  professionalLongFormDeliveryH264QaAuthorizationSchema,
  professionalLongFormDeliveryH264QaCompletionSchema,
  professionalLongFormDeliveryH264QaReconciliationSchema,
  professionalLongFormDeliveryH264QaTerminalSchema,
  type ProfessionalLongFormDeliveryH264QaArtifact,
  type ProfessionalLongFormDeliveryH264QaAttempt,
  type ProfessionalLongFormDeliveryH264QaAuthority,
  type ProfessionalLongFormDeliveryH264QaAuthorization,
  type ProfessionalLongFormDeliveryH264QaCompletion,
  type ProfessionalLongFormDeliveryH264QaReconciliation,
  type ProfessionalLongFormDeliveryH264QaTerminal,
} from './professional-long-form-customer-delivery-h264-qa-execution-contract'

const qaOperation = {
  operationId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
  fixedRecipeProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RECIPE_ID,
  inspectionProfileId:
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_INSPECTION_PROFILE_ID,
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

export function buildProfessionalLongFormDeliveryH264QaAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  chunkIndex: number
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
}): ProfessionalLongFormDeliveryH264QaAuthority {
  const { current } = input
  const sourceChunk = current.package.sourceReview.chunks.find((chunk) =>
    chunk.chunkIndex === input.chunkIndex)
  const h264WorkItem = current.package.graph.workItems.find((item) =>
    item.kind === 'encode_customer_delivery_h264_chunk' &&
    item.sourceChunkId === sourceChunk?.chunkId)
  const qaWorkItem = current.package.graph.workItems.find((item) =>
    item.kind === PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_KIND &&
    item.sourceChunkId === sourceChunk?.chunkId)
  const h264Entry = current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === h264WorkItem?.jobId)
  const qaEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === qaWorkItem?.jobId)
  const qaPlacement = current.placementManifest.placements.find((placement) =>
    placement.jobId === qaWorkItem?.jobId)
  const h264Authorization = h264Entry?.professionalLongFormExecutionAuthorization
  const h264Completion = professionalLongFormDeliveryH264CompletionSchema.safeParse(
    h264Entry?.completion?.outcome.professionalLongFormExecution,
  )
  if (
    !sourceChunk || !h264WorkItem || !qaWorkItem || !h264Entry || !qaEntry ||
    !qaPlacement || !h264Authorization || !h264Completion.success ||
    h264Entry.state !== 'completed' || !h264Entry.completion ||
    h264WorkItem.canonicalOrder !== input.chunkIndex * 2 - 1 ||
    qaWorkItem.canonicalOrder !== input.chunkIndex * 2 ||
    qaEntry.definition.canonicalOrder !== qaWorkItem.canonicalOrder ||
    qaEntry.definition.dependencyJobIds.length !== 1 ||
    qaEntry.definition.dependencyJobIds[0] !== h264Entry.definition.jobId ||
    qaEntry.definition.expectedOutputIdentity !==
      `${h264Completion.data.outputArtifact.objectIdentity}:qa` ||
    qaPlacement.workerType !== 'qa_worker' ||
    qaPlacement.resourceClassId !== 'qa_cpu_standard_v1' ||
    qaPlacement.maxAttempts !== 2 ||
    qaPlacement.attemptTimeoutSeconds !== 3_600 ||
    qaPlacement.vcpuCount !== 2 || qaPlacement.memoryGib !== 4 ||
    qaPlacement.approvedToolIds.length !== 1 ||
    qaPlacement.approvedToolIds[0] !== 'ffprobe' ||
    qaPlacement.approvedToolOperationIds.length !== 1 ||
    qaPlacement.approvedToolOperationIds[0] !== qaOperation.operationId ||
    qaWorkItem.toolPlan.runnerClass !== qaOperation.runnerClass ||
    qaWorkItem.toolPlan.attemptCostProfileId !==
      qaOperation.attemptCostProfileId ||
    qaWorkItem.toolPlan.fixedRecipeProfileId !==
      qaOperation.fixedRecipeProfileId ||
    h264Completion.data.outputArtifact.sourceChunkId !== sourceChunk.chunkId ||
    h264Completion.data.outputArtifact.chunkIndex !== input.chunkIndex ||
    h264Completion.data.outputArtifact.chunkCount !==
      current.package.outputContract.chunkCount ||
    h264Completion.data.outputArtifact.objectIdentity !==
      h264WorkItem.expectedOutputIdentity ||
    h264Completion.data.authorityHash !== h264Authorization.authorityHash ||
    input.runtimeAuthority.readiness.privateInternalExecutionReady !== true ||
    input.runtimeAuthority.readiness.productionReady !== false
  ) throw new Error(
    'Customer-delivery H.264 QA authority lacks the exact completed H.264 chunk, queue, placement, or pinned probe runtime.',
  )
  const deliveryPackage = current.package
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_customer_delivery_h264_qa_authority' as const,
    purpose:
      'authorize_one_private_independent_probe_of_exact_customer_delivery_h264_chunk' as const,
    status:
      'delivery_h264_chunk_independent_qa_authorized_mux_blocked' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: deliveryPackage.identity.workspaceId,
      projectId: deliveryPackage.identity.projectId,
      editSessionId: deliveryPackage.identity.editSessionId,
      approvedPlanId: deliveryPackage.identity.approvedPlanId,
      approvedPlanSnapshotId: deliveryPackage.identity.approvedPlanSnapshotId,
      approvedPlanSnapshotHash:
        deliveryPackage.identity.approvedPlanSnapshotHash,
      packageRecordId: deliveryPackage.identity.packageRecordId,
      jobId: qaEntry.definition.jobId,
      approvedWorkItemId: qaEntry.definition.approvedWorkItemId,
      expectedOutputIdentity: qaEntry.definition.expectedOutputIdentity,
      kind: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_KIND,
    },
    approval: {
      approvedByUserId: deliveryPackage.approval.approvedByUserId,
      approvalRecordId: deliveryPackage.approval.approvalRecordId,
      approvedEstimateId: deliveryPackage.identity.approvedEstimateId,
      creditReservationId: deliveryPackage.identity.creditReservationId,
      reservationStatus: 'reserved' as const,
      remainingReservedCredits:
        deliveryPackage.approval.remainingReservedCredits,
      reservationExpiresAt: deliveryPackage.approval.reservationExpiresAt,
      snapshotApprovedAt: deliveryPackage.approval.snapshotApprovedAt,
    },
    h264Artifact: h264Completion.data.outputArtifact,
    lineage: {
      deliveryPackageHash: deliveryPackage.packageHash,
      deliveryPackageRef: current.packageRef,
      deliveryPlacementManifestHash: current.placementManifest.manifestHash,
      deliveryPlacementManifestRef: current.placementManifestRef,
      queueDefinitionHash: current.queueDefinition.definitionHash,
      qaJobDefinitionHash: qaEntry.definition.definitionHash,
      qaPlacementHash: qaPlacement.placementHash,
      h264JobId: h264Entry.definition.jobId,
      h264ApprovedWorkItemId: h264Entry.definition.approvedWorkItemId,
      h264AuthorityHash: h264Authorization.authorityHash,
      h264QueueCompletionHash: h264Entry.completion.completionHash,
      h264CanonicalResultHash: h264Completion.data.canonicalResultHash,
      h264AttemptInternalCostEvidenceHash:
        h264Completion.data.attemptInternalCostEvidenceHash,
      h264RuntimeEvidenceRef: h264Completion.data.runtimeEvidenceRef,
      h264ReconciliationEvidenceRef:
        h264Completion.data.reconciliationEvidenceRef,
      h264TerminalEvidenceRef: h264Completion.data.terminalEvidenceRef,
      mediaBinaryRuntimeAuthorityHash:
        stableMediaBinaryRuntimeAuthorityHash(input.runtimeAuthority),
      mediaBinaryImageIdentityHash:
        input.runtimeAuthority.image.imageIdentityHash,
    },
    operation: {
      ...qaOperation,
      workerType: 'qa_worker' as const,
      resourceClassId: 'qa_cpu_standard_v1' as const,
      maximumAttempts: 2 as const,
      attemptTimeoutSeconds: 3_600 as const,
      leaseDurationMilliseconds: 120_000 as const,
      vcpuCount: 2 as const,
      memoryGib: 4 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableH264CompletionRequired: true as const,
      exactPrivateArtifactRead: true as const,
      exactArtifactChecksumRequired: true as const,
      independentFfprobe: true as const,
      exactH264ProfileFrameColorDurationValidation: true as const,
      mediaMutationAllowed: false as const,
      privateQaArtifactCreateOnly: true as const,
      furtherDeliveryExecution: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence,
    authorizedAt: h264Entry.completion.completedAt,
  }
  assertBlobRef(current.packageRef, current.package)
  assertBlobRef(current.placementManifestRef, current.placementManifest)
  return professionalLongFormDeliveryH264QaAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormDeliveryH264QaAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  chunkIndex: number
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
}): ProfessionalLongFormDeliveryH264QaAuthority {
  const parsed = professionalLongFormDeliveryH264QaAuthoritySchema.parse(
    input.value,
  )
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormDeliveryH264QaAuthority(input)
  assertExact(parsed, expected,
    'Customer-delivery H.264 QA authority changed.')
  return expected
}

export function buildProfessionalLongFormDeliveryH264QaAuthorization(input: {
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryH264QaAuthorization {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_customer_delivery_h264_qa_authority' as const,
    authorizationId:
      `long-form-delivery-h264-qa-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.qaJobDefinitionHash,
    placementHash: input.authority.lineage.qaPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation: qaOperation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      exactCompletedH264ArtifactRead: true as const,
      independentFfprobe: true as const,
      privateQaPersistence: true as const,
      mediaMutationAllowed: false as const,
      muxExecutionAuthorized: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormDeliveryH264QaAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryH264QaArtifact(input: {
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  authorization: ProfessionalLongFormDeliveryH264QaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryH264QaAttempt
  rawProbeResultRef: AuthorityJsonBlobRef
  probeRuntimeEvidenceRef: AuthorityJsonBlobRef
  result: OfflineFfprobeExecutionResult
  evaluatedAt: string
}): ProfessionalLongFormDeliveryH264QaArtifact {
  assertQaLineage(input)
  assertBlobRef(input.rawProbeResultRef, input.result.resultJson.document)
  assertBlobRef(
    input.probeRuntimeEvidenceRef,
    professionalLongFormDeliveryH264QaRuntimeReceipt(input.result),
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
  const codecLevel = finiteInteger(video?.codecLevel)
  const expectedSeconds = input.authority.h264Artifact.durationFrames / 30
  const tolerance = 1 / 30 + 0.001
  if (
    document.profileId !==
      PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_INSPECTION_PROFILE_ID ||
    !String(document.formatName).includes('mp4') ||
    document.sizeBytes !== input.authority.h264Artifact.byteLength ||
    streams.length !== 1 || videoStreams.length !== 1 ||
    audioStreams.length !== 0 || !video ||
    video.codecName !== 'h264' || video.codecProfile !== 'High' ||
    codecLevel === undefined || codecLevel < 31 || codecLevel > 62 ||
    video.pixelFormat !== 'yuv420p' ||
    !['tv', 'limited'].includes(String(video.colorRange)) ||
    video.colorSpace !== 'bt709' || video.colorTransfer !== 'bt709' ||
    video.colorPrimaries !== 'bt709' ||
    video.width !== input.authority.h264Artifact.width ||
    video.height !== input.authority.h264Artifact.height ||
    video.fps !== 30 ||
    video.readFrameCount !== input.authority.h264Artifact.durationFrames ||
    formatStart === undefined || formatStart < 0 || formatStart > tolerance ||
    videoStart === undefined || videoStart < 0 || videoStart > tolerance ||
    durationSeconds === undefined ||
    Math.abs(durationSeconds - expectedSeconds) > tolerance ||
    input.result.evidence.sourceSha256 !==
      input.authority.h264Artifact.sha256 ||
    input.result.evidence.resultSha256 !== input.result.resultJson.sha256 ||
    input.result.image.imageIdentityHash !==
      input.authority.lineage.mediaBinaryImageIdentityHash ||
    input.result.evidence.containerExitCode !== 0 ||
    input.result.evidence.oomKilled || input.result.readiness.productReady
  ) throw new Error(
    'Customer-delivery H.264 independent QA failed codec profile, frame, color, timestamp, duration, or artifact lineage.',
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_h264_ffprobe_qa' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      packageRecordId: input.authority.identity.packageRecordId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      sourceChunkId: input.authority.h264Artifact.sourceChunkId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: qaOperation,
    h264Artifact: input.authority.h264Artifact,
    rawProbeResultRef: input.rawProbeResultRef,
    probeRuntimeEvidenceRef: input.probeRuntimeEvidenceRef,
    requestEnvelopeSha256: input.result.evidence.requestEnvelopeSha256,
    probeAttestationHash: input.result.attestation.attestationHash,
    observed: {
      container: 'mp4' as const,
      videoStreamCount: 1 as const,
      audioStreamCount: 0 as const,
      codecName: 'h264' as const,
      codecProfile: 'High' as const,
      codecLevel,
      pixelFormat: 'yuv420p' as const,
      width: input.authority.h264Artifact.width,
      height: input.authority.h264Artifact.height,
      frameRateNumerator: 30 as const,
      frameRateDenominator: 1 as const,
      frameCount: input.authority.h264Artifact.durationFrames,
      formatStartTimeSeconds: formatStart,
      videoStartTimeSeconds: videoStart,
      durationSeconds,
      durationFrames: input.authority.h264Artifact.durationFrames,
      colorRange: video.colorRange as 'tv' | 'limited',
      colorSpace: 'bt709' as const,
      colorTransfer: 'bt709' as const,
      colorPrimaries: 'bt709' as const,
    },
    checks: {
      exactPersistedH264ArtifactReopened: 'passed' as const,
      independentPinnedFfprobeExecuted: 'passed' as const,
      exactHighProfileH264VideoOnly: 'passed' as const,
      exactFrameCountRateAndDuration: 'passed' as const,
      exactUhdOutputFrame: 'passed' as const,
      exactYuv420pBt709LimitedMetadata: 'passed' as const,
      immutableChunkAndQueueLineage: 'passed' as const,
      noMediaMutationOrCommercialAction: 'passed' as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.evaluatedAt,
  }
  return professionalLongFormDeliveryH264QaArtifactSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormDeliveryH264QaRuntimeReceipt(
  result: OfflineFfprobeExecutionResult,
) {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-h264-qa-runtime-receipt-v1' as const,
    source: 'offline_media_binary_ffprobe_runtime' as const,
    resultSha256: result.resultJson.sha256,
    resultByteLength: result.resultJson.byteLength,
    evidence: result.evidence,
    image: result.image,
    attestation: result.attestation,
    readiness: result.readiness,
  }
}

export function buildProfessionalLongFormDeliveryH264QaReconciliation(input: {
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  authorization: ProfessionalLongFormDeliveryH264QaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryH264QaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciledAt: string
  allowCompletedQa?: boolean
  allowAdvancedMux?: boolean
}): ProfessionalLongFormDeliveryH264QaReconciliation {
  assertQaLineage(input)
  const qaEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === input.authority.identity.jobId)
  const muxWorkItem = input.current.package.graph.workItems.find((item) =>
    item.kind === 'mux_customer_delivery_h264_aac_master')
  const muxEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === muxWorkItem?.jobId)
  const qaWorkItems = input.current.package.graph.workItems.filter((item) =>
    item.kind === PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_KIND)
  if (
    !qaEntry || !muxWorkItem || !muxEntry ||
    (qaEntry.state !== 'leased' &&
      !(input.allowCompletedQa && qaEntry.state === 'completed')) ||
    qaWorkItems.length !== input.current.package.outputContract.chunkCount ||
    muxEntry.definition.dependencyJobIds.length !== qaWorkItems.length ||
    !muxEntry.definition.dependencyJobIds.includes(qaEntry.definition.jobId) ||
    qaWorkItems.some((item) =>
      !muxEntry.definition.dependencyJobIds.includes(item.jobId)) ||
    (!input.allowAdvancedMux && (
      muxEntry.state !== 'queued' || muxEntry.deliveryAttemptCount !== 0 ||
      muxEntry.professionalLongFormExecutionAuthorization ||
      muxEntry.professionalLongFormExecutionAttempt || muxEntry.completion))
  ) throw new Error(
    'Customer-delivery H.264 QA reconciliation lost its exact mux dependency gate.',
  )
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_h264_qa_reconciliation' as const,
    qaJobId: input.authority.identity.jobId,
    qaApprovedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    h264Artifact: input.authority.h264Artifact,
    qaArtifactRef: input.qaArtifactRef,
    muxDependency: {
      jobId: muxEntry.definition.jobId,
      approvedWorkItemId: muxEntry.definition.approvedWorkItemId,
      dependencyJobId: input.authority.identity.jobId,
      thisDependencySatisfied: true as const,
      requiredH264ChunkQaDependencyCount: qaWorkItems.length,
      executionAuthorized: false as const,
      capabilityBlockedPendingExactMuxAuthority: true as const,
    },
    decision:
      'private_h264_chunk_qa_passed_mux_remains_exact_authority_gated' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormDeliveryH264QaReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormDeliveryH264QaResultHash(input: {
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  executionAttempt: ProfessionalLongFormDeliveryH264QaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_customer_delivery_h264_qa_result_v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    h264Artifact: input.authority.h264Artifact,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormDeliveryH264QaTerminal(input: {
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  authorization: ProfessionalLongFormDeliveryH264QaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryH264QaAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormDeliveryH264QaTerminal {
  assertQaLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: qaOperation,
    validationArtifactRef: input.validationArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    muxExecutionAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormDeliveryH264QaTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryH264QaCompletion(input: {
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  authorization: ProfessionalLongFormDeliveryH264QaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryH264QaAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryH264QaCompletion {
  assertQaLineage(input)
  return professionalLongFormDeliveryH264QaCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COMPLETION_VERSION,
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

function assertQaLineage(input: {
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  authorization: ProfessionalLongFormDeliveryH264QaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryH264QaAttempt
}): void {
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.authorization.authorizationId !==
      input.executionAttempt.authorizationId ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    input.executionAttempt.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId ||
    stableAuthorityStringify(input.executionAttempt.operation) !==
      stableAuthorityStringify(qaOperation)
  ) throw new Error(
    'Customer-delivery H.264 QA lost authority, authorization, or attempt lineage.',
  )
}

function assertHashed<T extends Record<string, unknown>>(
  value: T,
  key: keyof T,
): void {
  const hash = value[key]
  const payload = { ...value }
  delete payload[key]
  if (typeof hash !== 'string' || hash !== sha256AuthorityValue(payload)) {
    throw new Error('Customer-delivery H.264 QA evidence checksum is invalid.')
  }
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  const bytes = Buffer.byteLength(stableAuthorityStringify(value), 'utf8')
  if (ref.sha256 !== sha256AuthorityValue(value) || ref.byteLength !== bytes) {
    throw new Error(
      'Customer-delivery H.264 QA authority blob commitment is invalid.',
    )
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw new Error(message)
  }
}

function stableMediaBinaryRuntimeAuthorityHash(
  authority: OfflineMediaBinaryRuntimeAuthority,
): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_delivery_h264_qa_media_runtime_identity_v1',
    schemaVersion: authority.schemaVersion,
    imageIdentityHash: authority.image.imageIdentityHash,
    supportedOperations: authority.supportedOperations,
    privateInternalExecutionReady:
      authority.readiness.privateInternalExecutionReady,
    productReady: authority.readiness.productReady,
    productionReady: authority.readiness.productionReady,
  })
}

function finiteNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function finiteInteger(value: unknown): number | undefined {
  const parsed = finiteNumber(value)
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined
}
