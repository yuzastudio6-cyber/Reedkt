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
  professionalLongFormContinuousProgramAudioQaArtifactSchema,
  type ProfessionalLongFormContinuousProgramAudioQaArtifact,
} from './professional-long-form-continuous-program-audio-execution-contract'
import {
  professionalLongFormDeliveryH264CompletionSchema,
} from './professional-long-form-customer-delivery-execution-contract'
import {
  professionalLongFormDeliveryH264QaArtifactSchema,
  professionalLongFormDeliveryH264QaCompletionSchema,
  type ProfessionalLongFormDeliveryH264QaArtifact,
} from './professional-long-form-customer-delivery-h264-qa-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECIPE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RUNTIME_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_TERMINAL_VERSION,
  professionalLongFormDeliveryMuxArtifactRefSchema,
  professionalLongFormDeliveryMuxAuthoritySchema,
  professionalLongFormDeliveryMuxAuthorizationSchema,
  professionalLongFormDeliveryMuxCompletionSchema,
  professionalLongFormDeliveryMuxReconciliationSchema,
  professionalLongFormDeliveryMuxRuntimeEvidenceSchema,
  professionalLongFormDeliveryMuxTerminalSchema,
  type ProfessionalLongFormDeliveryMuxArtifactRef,
  type ProfessionalLongFormDeliveryMuxAttempt,
  type ProfessionalLongFormDeliveryMuxAuthority,
  type ProfessionalLongFormDeliveryMuxAuthorization,
  type ProfessionalLongFormDeliveryMuxCompletion,
  type ProfessionalLongFormDeliveryMuxReconciliation,
  type ProfessionalLongFormDeliveryMuxRuntimeEvidence,
  type ProfessionalLongFormDeliveryMuxTerminal,
} from './professional-long-form-customer-delivery-mux-execution-contract'

const operation = {
  operationId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
  fixedRecipeProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECIPE_ID,
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

export interface ProfessionalLongFormDeliveryMuxChunkQaEvidence {
  chunkId: string
  qaArtifactRef: AuthorityJsonBlobRef
  qaArtifact: ProfessionalLongFormDeliveryH264QaArtifact
}

export interface ProfessionalLongFormDeliveryMuxDependencyEvidence {
  chunkQa: ProfessionalLongFormDeliveryMuxChunkQaEvidence[]
  programAudioQaArtifactRef: AuthorityJsonBlobRef
  programAudioQaArtifact: ProfessionalLongFormContinuousProgramAudioQaArtifact
}

export function buildProfessionalLongFormDeliveryMuxAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  dependencies: ProfessionalLongFormDeliveryMuxDependencyEvidence
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
}): ProfessionalLongFormDeliveryMuxAuthority {
  const deliveryPackage = input.current.package
  const selection = selectMux(input.current)
  const chunks = buildCompletedChunks(input.current, input.dependencies.chunkQa)
  const programAudio = buildProgramAudio(
    input.current,
    input.dependencies.programAudioQaArtifactRef,
    input.dependencies.programAudioQaArtifact,
  )
  const dependencyCompletions = chunks.map((chunk) => ({
    kind: 'qa_customer_delivery_h264_chunk' as const,
    jobId: chunk.qaJobId,
    approvedWorkItemId: chunk.qaApprovedWorkItemId,
    queueCompletionHash: chunk.qaQueueCompletionHash,
    canonicalResultHash: chunk.qaCanonicalResultHash,
    attemptInternalCostEvidenceHash: chunk.qaAttemptInternalCostEvidenceHash,
    artifactHash: chunk.qaArtifactHash,
  }))
  const expectedOrder = deliveryPackage.outputContract.chunkCount * 2 + 1
  if (
    input.ownerUserId !== deliveryPackage.identity.ownerUserId ||
    input.ownerUserId !== deliveryPackage.approval.approvedByUserId ||
    deliveryPackage.approval.reservationStatus !== 'reserved' ||
    deliveryPackage.approval.remainingReservedCredits <= 0 ||
    selection.workItem.canonicalOrder !== expectedOrder ||
    selection.workItem.toolPlan.toolId !== 'ffmpeg' ||
    selection.workItem.toolPlan.operationId !== operation.operationId ||
    selection.workItem.toolPlan.runnerClass !== operation.runnerClass ||
    selection.workItem.toolPlan.attemptCostProfileId !==
      operation.attemptCostProfileId ||
    selection.workItem.toolPlan.fixedRecipeProfileId !==
      operation.fixedRecipeProfileId ||
    selection.workItem.expectedOutputIdentity !==
      deliveryPackage.outputContract.expectedPrivateMasterObjectIdentity ||
    selection.workItem.dependencyJobIds.length !== chunks.length ||
    stableAuthorityStringify(selection.workItem.dependencyJobIds) !==
      stableAuthorityStringify(dependencyCompletions.map((item) => item.jobId)) ||
    selection.placement.workerType !== 'render_worker' ||
    selection.placement.resourceClassId !== 'render_cpu_high_memory_v1' ||
    selection.placement.vcpuCount !== 4 || selection.placement.memoryGib !== 8 ||
    selection.placement.maxAttempts !== 2 ||
    selection.placement.attemptTimeoutSeconds !== 21_600 ||
    selection.placement.privateExecutionReady ||
    selection.placement.providerExecutionMode !== 'none' ||
    selection.queueJob.definitionHash !==
      selection.queueEntry.definition.definitionHash ||
    selection.queueJob.placementHash !== selection.placement.placementHash ||
    input.runtimeAuthority.readiness.privateInternalCustomerDeliveryMuxReady !==
      true ||
    input.runtimeAuthority.readiness.productReady !== false ||
    input.runtimeAuthority.readiness.productionReady !== false ||
    !input.runtimeAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === 'ffmpeg' &&
      candidate.operationId === PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID)
  ) throw new Error(
    'Customer-delivery mux lost package, queue, dependency, runtime, or reservation authority.',
  )

  const approvedMuxPlan = buildApprovedMuxPlan({
    current: input.current,
    expectedOutputIdentity: selection.workItem.expectedOutputIdentity,
    chunks,
    programAudio,
  })
  const authorizedAt = latestDependencyCompletionTimestamp(
    input.current,
    dependencyCompletions.map((item) => item.jobId),
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_customer_delivery_mux_authority' as const,
    purpose:
      'authorize_one_private_h264_stream_copy_and_single_aac_customer_delivery_mux' as const,
    status:
      'private_customer_delivery_mux_authorized_decoded_qa_and_download_blocked' as const,
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
      jobId: selection.queueJob.jobId,
      approvedWorkItemId: selection.queueJob.approvedWorkItemId,
      expectedOutputIdentity: selection.workItem.expectedOutputIdentity,
      kind: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND,
    },
    approval: {
      approvedByUserId: deliveryPackage.approval.approvedByUserId,
      approvalRecordId: deliveryPackage.approval.approvalRecordId,
      approvedEstimateId: deliveryPackage.identity.approvedEstimateId,
      creditReservationId: deliveryPackage.identity.creditReservationId,
      reservationStatus: 'reserved' as const,
      remainingReservedCredits: deliveryPackage.approval.remainingReservedCredits,
      reservationExpiresAt: deliveryPackage.approval.reservationExpiresAt,
      snapshotApprovedAt: deliveryPackage.approval.snapshotApprovedAt,
    },
    approvedMuxPlan,
    lineage: {
      deliveryPackageHash: deliveryPackage.packageHash,
      deliveryPackageRef: input.current.packageRef,
      deliveryPlacementManifestHash:
        input.current.placementManifest.manifestHash,
      deliveryPlacementManifestRef: input.current.placementManifestRef,
      queueDefinitionHash: input.current.queueDefinition.definitionHash,
      muxJobDefinitionHash: selection.queueJob.definitionHash,
      muxPlacementHash: selection.placement.placementHash,
      sourceEvidenceHash: deliveryPackage.sourceReview.sourceEvidenceHash,
      dependencyCompletions,
      dependencySetHash: sha256AuthorityValue(dependencyCompletions),
      mediaBinaryRuntimeAuthorityHash:
        stableMediaBinaryRuntimeAuthorityHash(input.runtimeAuthority),
      mediaBinaryImageIdentityHash:
        input.runtimeAuthority.image.imageIdentityHash,
    },
    operation: {
      ...operation,
      workerType: 'render_worker' as const,
      resourceClassId: 'render_cpu_high_memory_v1' as const,
      maximumAttempts: 2 as const,
      attemptTimeoutSeconds: 21_600 as const,
      leaseDurationMilliseconds: 300_000 as const,
      heartbeatIntervalMilliseconds: 30_000 as const,
      vcpuCount: 4 as const,
      memoryGib: 8 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableH264AndIndependentQaCompletionsRequired: true as const,
      exactQaPassedPrivateH264ChunksRead: true as const,
      exactQaPassedPrivateProgramAudioRead: true as const,
      fixedH264StreamCopyAndSingleAacEncodeRecipe: true as const,
      completeProgramVideoReencodeAllowed: false as const,
      privateCustomerDeliveryMasterCreateOnly: true as const,
      independentDecodedVideoQaRequired: true as const,
      independentDecodedAudioQaRequired: true as const,
      privateDownloadReconciliationSeparatelyGated: true as const,
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
  return professionalLongFormDeliveryMuxAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormDeliveryMuxAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  dependencies: ProfessionalLongFormDeliveryMuxDependencyEvidence
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
}): ProfessionalLongFormDeliveryMuxAuthority {
  const parsed = professionalLongFormDeliveryMuxAuthoritySchema.parse(
    input.value,
  )
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormDeliveryMuxAuthority(input)
  assertExact(parsed, expected, 'Customer-delivery mux authority changed.')
  return expected
}

export function buildProfessionalLongFormDeliveryMuxAuthorization(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryMuxAuthorization {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_customer_delivery_mux_authority' as const,
    authorizationId: `long-form-delivery-mux-auth-${sha256AuthorityValue({
      authorityHash: input.authority.authorityHash,
      authorityRef: input.authorityRef,
    }).slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.muxJobDefinitionHash,
    placementHash: input.authority.lineage.muxPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      exactDependencyArtifactsRead: true as const,
      fixedVideoStreamCopyAndSingleAudioEncode: true as const,
      createOnlyPrivateMp4Persistence: true as const,
      decodedQaSeparatelyGated: true as const,
      downloadSeparatelyGated: true as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormDeliveryMuxAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryMuxArtifactRef(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  byteLength: number
  sha256: string
}): ProfessionalLongFormDeliveryMuxArtifactRef {
  const plan = input.authority.approvedMuxPlan
  return professionalLongFormDeliveryMuxArtifactRefSchema.parse({
    objectIdentity: plan.privateObjectIdentityHash,
    mediaFormat: 'mp4',
    contentType: 'video/mp4',
    byteLength: input.byteLength,
    sha256: input.sha256,
    width: plan.width,
    height: plan.height,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
    frameCount: plan.totalFrames,
    videoCodec: 'h264',
    videoProfile: 'high',
    videoStreamCopiedWithoutReencode: true,
    pixelFormat: 'yuv420p',
    colorRange: 'tv',
    colorSpace: 'bt709',
    colorTransfer: 'bt709',
    colorPrimaries: 'bt709',
    audioCodec: 'aac_lc',
    audioBitrate: 192_000,
    sampleRate: 48_000,
    channels: 2,
    audioEncodeCount: 1,
    frontLoadedInitializationMetadata: true,
    initializationMode: 'fragmented_mp4_front_loaded_moov_v1',
    objectVersion: 1,
    assetRole: 'processed',
    renderPurpose: 'private_4k_customer_delivery_master_v1',
    placeholderAllowed: false,
    privateLocalCreateOnly: true,
    databaseBacked: false,
    publicDeliveryAuthorized: false,
  })
}

export function buildProfessionalLongFormDeliveryMuxRuntimeEvidence(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  authorization: ProfessionalLongFormDeliveryMuxAuthorization
  executionAttempt: ProfessionalLongFormDeliveryMuxAttempt
  queueLeaseEvidence: ProfessionalLongFormDeliveryMuxRuntimeEvidence[
    'queueLeaseEvidence'
  ]
  requestEnvelopeSha256: string
  chunkSha256s: string[]
  programAudioSha256: string
  outputArtifact: ProfessionalLongFormDeliveryMuxArtifactRef
  outputProbeRef: AuthorityJsonBlobRef
  outputProbeHash: string
  frontLoadedInitializationRef: AuthorityJsonBlobRef
  frontLoadedInitializationHash: string
  confinementEvidenceHash: string
  imageIdentityHash: string
  attestationRecordId: string
  attestationHash: string
  completedAt: string
}): ProfessionalLongFormDeliveryMuxRuntimeEvidence {
  assertExecutionLineage(input)
  const plan = input.authority.approvedMuxPlan
  if (
    input.queueLeaseEvidence.claimId !== input.executionAttempt.claimId ||
    input.queueLeaseEvidence.initialClaimHash !==
      input.executionAttempt.claimHash ||
    input.queueLeaseEvidence.deliveryAttempt !==
      input.executionAttempt.deliveryAttempt ||
    input.queueLeaseEvidence.heartbeatCount < 1 ||
    stableAuthorityStringify(input.chunkSha256s) !==
      stableAuthorityStringify(plan.chunks.map((chunk) => chunk.artifact.sha256)) ||
    input.programAudioSha256 !== plan.programAudio.artifact.sha256 ||
    input.outputProbeRef.sha256 !== input.outputProbeHash ||
    input.frontLoadedInitializationRef.sha256 !==
      input.frontLoadedInitializationHash ||
    input.outputArtifact.objectIdentity !== plan.privateObjectIdentityHash ||
    input.outputArtifact.width !== plan.width ||
    input.outputArtifact.height !== plan.height ||
    input.outputArtifact.frameCount !== plan.totalFrames
  ) throw new Error('Customer-delivery mux runtime evidence changed.')
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RUNTIME_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_mux_ffmpeg_runner' as const,
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
    requestEnvelopeSha256: input.requestEnvelopeSha256,
    inputSetHash: sha256AuthorityValue({
      chunks: input.chunkSha256s,
      programAudio: input.programAudioSha256,
      chunkQa: plan.chunks.map((chunk) => chunk.qaArtifactHash),
      programAudioQa: plan.programAudio.sourceQaArtifactHash,
    }),
    chunkSha256s: input.chunkSha256s,
    programAudioSha256: input.programAudioSha256,
    outputArtifact: input.outputArtifact,
    outputProbeRef: input.outputProbeRef,
    outputProbeHash: input.outputProbeHash,
    frontLoadedInitializationRef: input.frontLoadedInitializationRef,
    frontLoadedInitializationHash: input.frontLoadedInitializationHash,
    confinementEvidenceHash: input.confinementEvidenceHash,
    runtime: {
      binaryVersion: '8.1.2' as const,
      imageIdentityHash: input.imageIdentityHash,
      attestationRecordId: input.attestationRecordId,
      attestationHash: input.attestationHash,
      networkMode: 'none' as const,
      containerExitCode: 0 as const,
      oomKilled: false as const,
    },
    checks: {
      everyDependencyCompletionReopened: 'passed' as const,
      everyPrivateInputChecksumReopened: 'passed' as const,
      exactOrderedH264TimelineVerified: 'passed' as const,
      exactContinuousProgramAudioVerified: 'passed' as const,
      h264VideoStreamCopiedWithoutReencode: 'passed' as const,
      continuousFlacEncodedToAacExactlyOnce: 'passed' as const,
      frontLoadedMp4InitializationVerified: 'passed' as const,
      independentOutputProbeExecuted: 'passed' as const,
      privateMasterPersistedCreateOnly: 'passed' as const,
      decodedVideoQaStillRequired: true as const,
      decodedAudioQaStillRequired: true as const,
      privateDownloadStillRequired: true as const,
    },
    completedAt: input.completedAt,
  }
  return professionalLongFormDeliveryMuxRuntimeEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryMuxReconciliation(input: {
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryMuxAuthority
  executionAttempt: ProfessionalLongFormDeliveryMuxAttempt
  outputArtifact: ProfessionalLongFormDeliveryMuxArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciledAt: string
  allowCompletedMux?: boolean
}): ProfessionalLongFormDeliveryMuxReconciliation {
  const selection = selectMux(input.current)
  const videoQa = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.canonicalOrder === selection.queueEntry.definition.canonicalOrder + 1)
  const audioQa = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.canonicalOrder === selection.queueEntry.definition.canonicalOrder + 2)
  const download = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.canonicalOrder === selection.queueEntry.definition.canonicalOrder + 3)
  if (
    !videoQa || !audioQa || !download ||
    videoQa.state !== 'queued' || audioQa.state !== 'queued' ||
    download.state !== 'queued' ||
    videoQa.definition.dependencyJobIds.length !== 1 ||
    audioQa.definition.dependencyJobIds.length !== 1 ||
    videoQa.definition.dependencyJobIds[0] !== input.authority.identity.jobId ||
    audioQa.definition.dependencyJobIds[0] !== input.authority.identity.jobId ||
    stableAuthorityStringify(download.definition.dependencyJobIds) !==
      stableAuthorityStringify([
        videoQa.definition.jobId,
        audioQa.definition.jobId,
      ]) ||
    [videoQa, audioQa, download].some((entry) =>
      entry.professionalLongFormExecutionAuthorization ||
      entry.professionalLongFormExecutionAttempt || entry.completion) ||
    (selection.queueEntry.state !== 'leased' &&
      !(input.allowCompletedMux && selection.queueEntry.state === 'completed'))
  ) throw new Error(
    'Customer-delivery mux reconciliation lost decoded-QA or download gating.',
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_mux_reconciliation' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    downstreamDecodedVideoQa: {
      jobId: videoQa.definition.jobId,
      approvedWorkItemId: videoQa.definition.approvedWorkItemId,
      dependencyJobId: input.authority.identity.jobId,
      thisDependencySatisfied: true as const,
      everyRequiredDependencySatisfied: true as const,
      executionAuthorized: false as const,
    },
    downstreamDecodedAudioQa: {
      jobId: audioQa.definition.jobId,
      approvedWorkItemId: audioQa.definition.approvedWorkItemId,
      dependencyJobId: input.authority.identity.jobId,
      thisDependencySatisfied: true as const,
      everyRequiredDependencySatisfied: true as const,
      executionAuthorized: false as const,
    },
    privateDownload: {
      jobId: download.definition.jobId,
      approvedWorkItemId: download.definition.approvedWorkItemId,
      dependencyJobIds: [...download.definition.dependencyJobIds],
      executionAuthorized: false as const,
      capabilityBlockedPendingBothDecodedQa: true as const,
    },
    decision:
      'private_customer_delivery_master_ready_decoded_qa_and_download_require_separate_authority' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormDeliveryMuxReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormDeliveryMuxResultHash(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  executionAttempt: ProfessionalLongFormDeliveryMuxAttempt
  outputArtifact: ProfessionalLongFormDeliveryMuxArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_customer_delivery_mux_result_v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormDeliveryMuxTerminal(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  authorization: ProfessionalLongFormDeliveryMuxAuthorization
  executionAttempt: ProfessionalLongFormDeliveryMuxAttempt
  outputArtifact: ProfessionalLongFormDeliveryMuxArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormDeliveryMuxTerminal {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    decodedVideoQaCompleted: false as const,
    decodedAudioQaCompleted: false as const,
    privateDownloadReconciled: false as const,
    publicDeliveryAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormDeliveryMuxTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryMuxCompletion(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  authorization: ProfessionalLongFormDeliveryMuxAuthorization
  executionAttempt: ProfessionalLongFormDeliveryMuxAttempt
  outputArtifact: ProfessionalLongFormDeliveryMuxArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
}): ProfessionalLongFormDeliveryMuxCompletion {
  assertExecutionLineage(input)
  return professionalLongFormDeliveryMuxCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

function buildCompletedChunks(
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
  evidence: ProfessionalLongFormDeliveryMuxChunkQaEvidence[],
) {
  const sourceChunks = [...current.package.sourceReview.chunks]
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
  const byChunk = new Map(evidence.map((entry) => [entry.chunkId, entry]))
  if (
    sourceChunks.length < 2 || sourceChunks.length > 124 ||
    evidence.length !== sourceChunks.length || byChunk.size !== sourceChunks.length
  ) throw new Error('Customer-delivery mux requires every unique chunk QA.')
  return sourceChunks.map((sourceChunk, index) => {
    const h264Entry = current.queueAggregate.entries.find((entry) =>
      entry.definition.canonicalOrder === sourceChunk.chunkIndex * 2 - 1)
    const qaEntry = current.queueAggregate.entries.find((entry) =>
      entry.definition.canonicalOrder === sourceChunk.chunkIndex * 2)
    const item = byChunk.get(sourceChunk.chunkId)
    if (
      !h264Entry?.completion || h264Entry.state !== 'completed' ||
      !qaEntry?.completion || qaEntry.state !== 'completed' || !item
    ) throw new Error('Customer-delivery mux dependency is not completed.')
    const h264 = professionalLongFormDeliveryH264CompletionSchema.parse(
      h264Entry.completion.outcome.professionalLongFormExecution,
    )
    const qa = professionalLongFormDeliveryH264QaCompletionSchema.parse(
      qaEntry.completion.outcome.professionalLongFormExecution,
    )
    const qaArtifact = professionalLongFormDeliveryH264QaArtifactSchema.parse(
      item.qaArtifact,
    )
    assertHashed(qaArtifact, 'qaHash')
    if (
      sourceChunk.chunkIndex !== index + 1 ||
      sourceChunk.chunkCount !== sourceChunks.length ||
      h264Entry.definition.expectedOutputIdentity !==
        h264.outputArtifact.objectIdentity ||
      qaEntry.definition.dependencyJobIds.length !== 1 ||
      qaEntry.definition.dependencyJobIds[0] !== h264Entry.definition.jobId ||
      item.qaArtifactRef.sha256 !== qa.validationArtifactRef.sha256 ||
      item.qaArtifactRef.byteLength !== qa.validationArtifactRef.byteLength ||
      qaArtifact.qaHash !== item.qaArtifact.qaHash ||
      qaArtifact.outcome !== 'passed' ||
      stableAuthorityStringify(qaArtifact.h264Artifact) !==
        stableAuthorityStringify(h264.outputArtifact) ||
      h264.outputArtifact.sourceChunkId !== sourceChunk.chunkId ||
      h264.outputArtifact.chunkIndex !== sourceChunk.chunkIndex ||
      h264.outputArtifact.chunkCount !== sourceChunk.chunkCount ||
      h264.outputArtifact.globalStartFrame !== sourceChunk.globalStartFrame ||
      h264.outputArtifact.globalEndFrameExclusive !==
        sourceChunk.globalEndFrameExclusive ||
      h264.outputArtifact.durationFrames !== sourceChunk.durationFrames
    ) throw new Error('Customer-delivery mux chunk QA lineage changed.')
    return {
      chunkId: sourceChunk.chunkId,
      chunkIndex: sourceChunk.chunkIndex,
      chunkCount: sourceChunk.chunkCount,
      globalStartFrame: sourceChunk.globalStartFrame,
      globalEndFrameExclusive: sourceChunk.globalEndFrameExclusive,
      durationFrames: sourceChunk.durationFrames,
      h264JobId: h264Entry.definition.jobId,
      h264ApprovedWorkItemId: h264Entry.definition.approvedWorkItemId,
      h264QueueCompletionHash: h264Entry.completion.completionHash,
      h264CanonicalResultHash: h264.canonicalResultHash,
      h264AttemptInternalCostEvidenceHash:
        h264.attemptInternalCostEvidenceHash,
      h264RuntimeEvidenceRef: h264.runtimeEvidenceRef,
      h264ReconciliationEvidenceRef: h264.reconciliationEvidenceRef,
      h264TerminalEvidenceRef: h264.terminalEvidenceRef,
      qaJobId: qaEntry.definition.jobId,
      qaApprovedWorkItemId: qaEntry.definition.approvedWorkItemId,
      qaQueueCompletionHash: qaEntry.completion.completionHash,
      qaCanonicalResultHash: qa.canonicalResultHash,
      qaAttemptInternalCostEvidenceHash: qa.attemptInternalCostEvidenceHash,
      qaArtifactRef: item.qaArtifactRef,
      qaArtifactHash: qaArtifact.qaHash,
      qaReconciliationEvidenceRef: qa.reconciliationEvidenceRef,
      qaTerminalEvidenceRef: qa.terminalEvidenceRef,
      artifact: h264.outputArtifact,
    }
  })
}

function buildProgramAudio(
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
  qaArtifactRef: AuthorityJsonBlobRef,
  qaValue: ProfessionalLongFormContinuousProgramAudioQaArtifact,
) {
  const source = current.package.sourceReview.continuousProgramAudio
  const qaArtifact = professionalLongFormContinuousProgramAudioQaArtifactSchema
    .parse(qaValue)
  assertHashed(qaArtifact, 'qaHash')
  if (
    qaArtifactRef.sha256 !== source.sourceQaArtifactRef.sha256 ||
    qaArtifactRef.byteLength !== source.sourceQaArtifactRef.byteLength ||
    qaArtifact.qaHash !== source.sourceQaArtifactHash ||
    qaArtifact.outcome !== 'passed' ||
    stableAuthorityStringify(qaArtifact.outputArtifact) !==
      stableAuthorityStringify(source.artifact)
  ) throw new Error('Customer-delivery mux program-audio QA changed.')
  return {
    sourceJobId: source.sourceJobId,
    sourceQueueCompletionHash: source.sourceQueueCompletionHash,
    sourceCanonicalResultHash: source.sourceCanonicalResultHash,
    sourceAttemptInternalCostEvidenceHash:
      source.sourceAttemptInternalCostEvidenceHash,
    sourceQaAttemptInternalCostEvidenceHash:
      source.sourceQaAttemptInternalCostEvidenceHash,
    sourceQaArtifactRef: source.sourceQaArtifactRef,
    sourceQaArtifactHash: source.sourceQaArtifactHash,
    artifact: source.artifact,
  }
}

function buildApprovedMuxPlan(input: {
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  expectedOutputIdentity: string
  chunks: ReturnType<typeof buildCompletedChunks>
  programAudio: ReturnType<typeof buildProgramAudio>
}) {
  const output = input.current.package.outputContract
  if (
    output.deliveryProfileId !== 'uhd_2160' ||
    output.estimateCostBasisProfileId !== 'uhd_2160' ||
    output.outputContainer !== 'mp4' || output.outputVideoCodec !== 'h264' ||
    output.outputVideoProfile !== 'high' ||
    output.outputPixelFormat !== 'yuv420p' ||
    output.outputAudioCodec !== 'aac' || output.outputAudioSampleRate !== 48_000 ||
    output.outputAudioChannels !== 2 || !output.fastStartRequired ||
    output.expectedPrivateMasterObjectIdentity !== input.expectedOutputIdentity ||
    input.chunks[0]?.globalStartFrame !== 0 ||
    input.chunks.at(-1)?.globalEndFrameExclusive !== output.totalFrames ||
    input.programAudio.artifact.totalFrames !== output.totalFrames
  ) throw new Error('Customer-delivery mux output contract is unsupported.')
  const muxAuthorityHash = sha256AuthorityValue({
    domain: 'professional_long_form_customer_delivery_mux_plan_authority_v1',
    approvedPlanSnapshotId:
      input.current.package.identity.approvedPlanSnapshotId,
    expectedOutputIdentity: input.expectedOutputIdentity,
    chunks: input.chunks,
    programAudio: input.programAudio,
    outputContractHash: output.contractHash,
  })
  const withoutHash = {
    muxAuthorityHash,
    privateObjectIdentityHash: input.expectedOutputIdentity,
    recipeProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECIPE_ID,
    width: output.width,
    height: output.height,
    fps: 30 as const,
    totalFrames: output.totalFrames,
    chunkCount: input.chunks.length,
    chunks: input.chunks,
    programAudio: input.programAudio,
    videoAssemblyPolicy:
      'ordered_compatible_h264_chunk_stream_copy_v1' as const,
    audioAssemblyPolicy:
      'encode_exact_continuous_flac_program_audio_to_aac_once_v1' as const,
    timestampPolicy:
      'normalize_from_zero_preserve_frame_and_sample_time_v1' as const,
    compatibilityPolicy:
      'exact_h264_high_yuv420p_bt709_4k_30fps_and_flac_48k_stereo_v1' as const,
    outputContainer: 'mp4' as const,
    outputVideoCodec: 'copy_h264' as const,
    outputAudioCodec: 'aac_lc' as const,
    outputAudioBitrate: 192_000 as const,
    outputAudioSampleRate: 48_000 as const,
    outputAudioChannels: 2 as const,
    frontLoadedInitializationMetadataRequired: true as const,
    fullProgramVideoReencodeAllowed: false as const,
    audioEncodeCount: 1 as const,
    renderPurpose: 'private_4k_customer_delivery_master_v1' as const,
  }
  return { ...withoutHash, planHash: sha256AuthorityValue(withoutHash) }
}

function selectMux(
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
) {
  const workItem = current.package.graph.workItems.find((item) =>
    item.kind === PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND)
  const placement = current.placementManifest.placements.find((entry) =>
    entry.jobId === workItem?.jobId)
  const queueJob = current.queueDefinition.jobs.find((entry) =>
    entry.jobId === workItem?.jobId)
  const queueEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === workItem?.jobId)
  if (!workItem || !placement || !queueJob || !queueEntry) {
    throw new Error('Canonical customer-delivery mux job is missing.')
  }
  return { workItem, placement, queueJob, queueEntry }
}

function latestDependencyCompletionTimestamp(
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
  jobIds: string[],
): string {
  const timestamps = jobIds.map((jobId) => {
    const value = current.queueAggregate.entries.find((entry) =>
      entry.definition.jobId === jobId)?.completion?.completedAt
    if (!value) throw new Error('Customer-delivery mux dependency time is missing.')
    return Date.parse(value)
  })
  return new Date(Math.max(...timestamps)).toISOString()
}

function assertExecutionLineage(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  authorization: ProfessionalLongFormDeliveryMuxAuthorization
  executionAttempt: ProfessionalLongFormDeliveryMuxAttempt
}): void {
  assertHashed(input.authority, 'authorityHash')
  assertHashed(input.authorization, 'receiptHash')
  assertHashed(input.executionAttempt, 'attemptHash')
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.authorizationId !==
      input.authorization.authorizationId ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    input.executionAttempt.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId ||
    stableAuthorityStringify(input.executionAttempt.operation) !==
      stableAuthorityStringify(operation)
  ) throw new Error('Customer-delivery mux execution lineage changed.')
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  const byteLength = Buffer.byteLength(stableAuthorityStringify(value), 'utf8')
  if (
    ref.sha256 !== sha256AuthorityValue(value) ||
    ref.byteLength !== byteLength
  ) throw new Error('Customer-delivery mux blob commitment changed.')
}

function assertHashed<T extends Record<string, unknown>>(
  value: T,
  key: keyof T,
): void {
  const payload = { ...value }
  const actual = payload[key]
  delete payload[key]
  if (typeof actual !== 'string' || actual !== sha256AuthorityValue(payload)) {
    throw new Error('Customer-delivery mux evidence checksum is invalid.')
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
    domain:
      'professional_long_form_customer_delivery_mux_media_runtime_identity_v1',
    schemaVersion: authority.schemaVersion,
    imageIdentityHash: authority.image.imageIdentityHash,
    supportedOperations: authority.supportedOperations,
    privateInternalCustomerDeliveryMuxReady:
      authority.readiness.privateInternalCustomerDeliveryMuxReady,
    productReady: authority.readiness.productReady,
    productionReady: authority.readiness.productionReady,
  })
}
