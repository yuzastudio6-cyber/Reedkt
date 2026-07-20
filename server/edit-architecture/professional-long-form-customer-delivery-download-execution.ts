import type {
  ObjectiveDecodedAudioQualitySyncEvidence,
  ObjectiveDecodedVideoIntegrityEvidence,
} from '../final-master-qa/objective-final-master-qa-types'
import {
  sha256AuthorityValue,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import type {
  CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
} from './professional-long-form-customer-delivery-execution'
import {
  professionalLongFormDeliveryDecodedAudioQaArtifactSchema,
  professionalLongFormDeliveryDecodedAudioQaCompletionSchema,
  professionalLongFormDeliveryDecodedVideoQaArtifactSchema,
  professionalLongFormDeliveryDecodedVideoQaCompletionSchema,
  type ProfessionalLongFormDeliveryDecodedAudioQaArtifact,
  type ProfessionalLongFormDeliveryDecodedAudioQaCompletion,
  type ProfessionalLongFormDeliveryDecodedVideoQaArtifact,
  type ProfessionalLongFormDeliveryDecodedVideoQaCompletion,
} from './professional-long-form-customer-delivery-decoded-qa-execution-contract'
import {
  professionalLongFormDeliveryMuxCompletionSchema,
  type ProfessionalLongFormDeliveryMuxCompletion,
} from './professional-long-form-customer-delivery-mux-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RECIPE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_TERMINAL_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_DECISION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_REVIEW_PACKET_VERSION,
  professionalLongFormDeliveryDownloadArtifactSchema,
  professionalLongFormDeliveryDownloadAuthoritySchema,
  professionalLongFormDeliveryDownloadAuthorizationSchema,
  professionalLongFormDeliveryDownloadCompletionSchema,
  professionalLongFormDeliveryDownloadReconciliationSchema,
  professionalLongFormDeliveryDownloadTerminalSchema,
  professionalLongFormDeliveryQualityDecisionSchema,
  professionalLongFormDeliveryQualityReviewPacketSchema,
  type ProfessionalLongFormDeliveryDownloadArtifact,
  type ProfessionalLongFormDeliveryDownloadAttempt,
  type ProfessionalLongFormDeliveryDownloadAuthority,
  type ProfessionalLongFormDeliveryDownloadAuthorization,
  type ProfessionalLongFormDeliveryDownloadCompletion,
  type ProfessionalLongFormDeliveryDownloadReconciliation,
  type ProfessionalLongFormDeliveryDownloadTerminal,
  type ProfessionalLongFormDeliveryQualityDecision,
  type ProfessionalLongFormDeliveryQualityReviewPacket,
  type RecordProfessionalLongFormDeliveryQualityDecision,
} from './professional-long-form-customer-delivery-download-execution-contract'
import type {
  ProfessionalLongFormDeliveryWatchEvidence,
} from './professional-long-form-customer-delivery-watch-evidence-contract'

const operation = {
  operationId: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID,
  fixedRecipeProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RECIPE_ID,
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
  privateDecisionCreateOnly: true as const,
  queueReceiptRequiredBeforeLease: true as const,
  queueAttemptRequiredBeforeOperation: true as const,
  queueCompletionIsAuthorityCommit: true as const,
  orphanBlobsGrantExecutionAuthority: false as const,
  distributedDatabaseBacked: false as const,
  productionDurabilityProven: false as const,
}

export interface ProfessionalLongFormDeliveryCompletedDecodedQaSet {
  muxCompletion: ProfessionalLongFormDeliveryMuxCompletion
  video: {
    queueCompletionHash: string
    completion: ProfessionalLongFormDeliveryDecodedVideoQaCompletion
    artifact: ProfessionalLongFormDeliveryDecodedVideoQaArtifact
    objectiveEvidence: ObjectiveDecodedVideoIntegrityEvidence & {
      outcome: 'passed' | 'needs_user_review'
    }
  }
  audio: {
    queueCompletionHash: string
    completion: ProfessionalLongFormDeliveryDecodedAudioQaCompletion
    artifact: ProfessionalLongFormDeliveryDecodedAudioQaArtifact
    objectiveEvidence: ObjectiveDecodedAudioQualitySyncEvidence & {
      outcome: 'passed' | 'needs_user_review'
    }
  }
}

export function buildProfessionalLongFormDeliveryQualityReviewPacket(input: {
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  completed: ProfessionalLongFormDeliveryCompletedDecodedQaSet
}): ProfessionalLongFormDeliveryQualityReviewPacket {
  const muxCompletion = professionalLongFormDeliveryMuxCompletionSchema.parse(
    input.completed.muxCompletion,
  )
  const videoCompletion =
    professionalLongFormDeliveryDecodedVideoQaCompletionSchema.parse(
      input.completed.video.completion,
    )
  const audioCompletion =
    professionalLongFormDeliveryDecodedAudioQaCompletionSchema.parse(
      input.completed.audio.completion,
    )
  const videoArtifact =
    professionalLongFormDeliveryDecodedVideoQaArtifactSchema.parse(
      input.completed.video.artifact,
    )
  const audioArtifact =
    professionalLongFormDeliveryDecodedAudioQaArtifactSchema.parse(
      input.completed.audio.artifact,
    )
  const video = {
    jobId: videoArtifact.identity.jobId,
    approvedWorkItemId: videoArtifact.identity.approvedWorkItemId,
    queueCompletionHash: input.completed.video.queueCompletionHash,
    canonicalResultHash: videoCompletion.canonicalResultHash,
    attemptInternalCostEvidenceHash:
      videoCompletion.attemptInternalCostEvidenceHash,
    validationArtifactRef: videoCompletion.validationArtifactRef,
    validationArtifactHash: videoArtifact.qaHash,
    objectiveEvidenceRef: videoArtifact.objectiveEvidenceRef,
    objectiveEvidenceHash: videoArtifact.objectiveEvidenceHash,
    outcome: videoArtifact.outcome,
  }
  const audio = {
    jobId: audioArtifact.identity.jobId,
    approvedWorkItemId: audioArtifact.identity.approvedWorkItemId,
    queueCompletionHash: input.completed.audio.queueCompletionHash,
    canonicalResultHash: audioCompletion.canonicalResultHash,
    attemptInternalCostEvidenceHash:
      audioCompletion.attemptInternalCostEvidenceHash,
    validationArtifactRef: audioCompletion.validationArtifactRef,
    validationArtifactHash: audioArtifact.qaHash,
    objectiveEvidenceRef: audioArtifact.objectiveEvidenceRef,
    objectiveEvidenceHash: audioArtifact.objectiveEvidenceHash,
    outcome: audioArtifact.outcome,
    actualSpeechIntelligibilityAnalysisPerformed: false as const,
  }
  const reviewItems = [
    reviewItem({
      category: 'decoded_video_integrity',
      gateId: 'decoded_video_integrity',
      evidenceHash: video.objectiveEvidenceHash,
      outcome: video.outcome,
    }),
    reviewItem({
      category: 'decoded_audio_quality_sync',
      gateId: 'decoded_audio_quality_sync',
      evidenceHash: audio.objectiveEvidenceHash,
      outcome: audio.outcome,
    }),
    speechReviewItem(audio.objectiveEvidenceHash),
  ] as const
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_REVIEW_PACKET_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_quality_review_service' as const,
    purpose:
      'present_exact_customer_delivery_decoded_qa_for_authenticated_quality_decision' as const,
    status:
      'exact_customer_delivery_quality_review_required_before_private_download' as const,
    identity: {
      workspaceId: input.current.package.identity.workspaceId,
      projectId: input.current.package.identity.projectId,
      editSessionId: input.current.package.identity.editSessionId,
      approvedPlanId: input.current.package.identity.approvedPlanId,
      approvedPlanSnapshotId:
        input.current.package.identity.approvedPlanSnapshotId,
      packageRecordId: input.current.package.identity.packageRecordId,
    },
    deliveryPackageHash: input.current.package.packageHash,
    deliveryPackageRef: input.current.packageRef,
    placementManifestHash: input.current.placementManifest.manifestHash,
    queueDefinitionHash: input.current.queueDefinition.definitionHash,
    reviewedQueueAggregateHash: input.current.queueAggregate.aggregateHash,
    master: muxCompletion.outputArtifact,
    decodedQa: { video, audio },
    reviewItems,
    reviewItemSetHash: sha256AuthorityValue(reviewItems),
    userReviewRequired: true as const,
    actualSpeechIntelligibilityAnalysisPerformed: false as const,
    privateDownloadExecutionAuthorized: false as const,
    publicDeliveryAuthorized: false as const,
    commercialBoundary,
  }
  return professionalLongFormDeliveryQualityReviewPacketSchema.parse({
    ...payload,
    packetHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryQualityDecision(input: {
  ownerUserId: string
  packet: ProfessionalLongFormDeliveryQualityReviewPacket
  watchEvidence: ProfessionalLongFormDeliveryWatchEvidence | null
  request: RecordProfessionalLongFormDeliveryQualityDecision
  decidedAt: string
}): ProfessionalLongFormDeliveryQualityDecision {
  const packet = professionalLongFormDeliveryQualityReviewPacketSchema.parse(
    input.packet,
  )
  if (
    input.request.workspaceId !== packet.identity.workspaceId ||
    input.request.approvedPlanSnapshotId !==
      packet.identity.approvedPlanSnapshotId ||
    input.request.expectedReviewPacketHash !== packet.packetHash ||
    input.request.expectedMasterSha256 !== packet.master.sha256 ||
    input.request.expectedVideoObjectiveEvidenceHash !==
      packet.decodedQa.video.objectiveEvidenceHash ||
    input.request.expectedAudioObjectiveEvidenceHash !==
      packet.decodedQa.audio.objectiveEvidenceHash
  ) throw new Error(
    'Customer-delivery quality decision does not match the exact review packet.',
  )
  const accepted =
    input.request.decision === 'accept_exact_private_customer_delivery'
  if (input.request.decision ===
    'accept_exact_private_customer_delivery') {
    if (
      !input.watchEvidence ||
      input.request.expectedWatchEvidenceHash !==
        input.watchEvidence.evidenceHash ||
      input.watchEvidence.authority.reviewPacketHash !== packet.packetHash ||
      input.watchEvidence.authority.masterSha256 !== packet.master.sha256 ||
      input.watchEvidence.authority.masterFrameCount !==
        packet.master.frameCount ||
      input.watchEvidence.identity.ownerUserId !== input.ownerUserId ||
      input.watchEvidence.identity.workspaceId !==
        packet.identity.workspaceId ||
      input.watchEvidence.identity.projectId !== packet.identity.projectId ||
      input.watchEvidence.identity.editSessionId !==
        packet.identity.editSessionId ||
      input.watchEvidence.identity.approvedPlanSnapshotId !==
        packet.identity.approvedPlanSnapshotId ||
      input.watchEvidence.identity.packageRecordId !==
        packet.identity.packageRecordId ||
      !input.watchEvidence.acceptanceGateSatisfied ||
      !input.watchEvidence.fullProgramPlaybackObserved
    ) throw new Error(
      'Customer-delivery acceptance requires exact complete watch evidence.',
    )
  } else if (input.watchEvidence !== null) {
    throw new Error(
      'Customer-delivery revision must not receive acceptance watch authority.',
    )
  }
  const identitySeed = sha256AuthorityValue({
    ownerUserId: input.ownerUserId,
    packageRecordId: packet.identity.packageRecordId,
    reviewPacketHash: packet.packetHash,
  })
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_DECISION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_quality_review_service' as const,
    purpose:
      'record_one_authenticated_exact_customer_delivery_quality_decision' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      ...packet.identity,
      qualityDecisionId:
        `long-form-delivery-quality-${identitySeed.slice(0, 40)}`,
    },
    decision: input.request.decision,
    reviewPacketHash: packet.packetHash,
    masterSha256: packet.master.sha256,
    videoObjectiveEvidenceHash:
      packet.decodedQa.video.objectiveEvidenceHash,
    audioObjectiveEvidenceHash:
      packet.decodedQa.audio.objectiveEvidenceHash,
    watchEvidenceHash: input.watchEvidence?.evidenceHash ?? null,
    attestation:
      input.request.decision === 'accept_exact_private_customer_delivery'
        ? input.request.attestation
        : null,
    revisionReasonCodes:
      input.request.decision === 'accept_exact_private_customer_delivery'
        ? []
        : input.request.revisionReasonCodes,
    outcome: {
      privateDownloadReconciliationAuthorized: accepted,
      revisionRequired: !accepted,
      requiresFreshPlanEstimateAndApproval: !accepted,
      approvedSnapshotMutated: false as const,
      approvedEstimateMutated: false as const,
      creditReservationMutated: false as const,
    },
    permissions: {
      privateDownloadReconciliation: accepted,
      publicDelivery: false as const,
      providerCall: false as const,
      additionalRender: false as const,
      customerCharge: false as const,
      walletMutation: false as const,
      billing: false as const,
      deployment: false as const,
    },
    decidedAt: input.decidedAt,
  }
  return professionalLongFormDeliveryQualityDecisionSchema.parse({
    ...payload,
    decisionHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDownloadAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  packet: ProfessionalLongFormDeliveryQualityReviewPacket
  decision: ProfessionalLongFormDeliveryQualityDecision
  authorizedAt: string
}): ProfessionalLongFormDeliveryDownloadAuthority {
  const packet = professionalLongFormDeliveryQualityReviewPacketSchema.parse(
    input.packet,
  )
  const decision = professionalLongFormDeliveryQualityDecisionSchema.parse(
    input.decision,
  )
  const workItem = input.current.package.graph.workItems.find((candidate) =>
    candidate.kind === PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_KIND)
  const entry = input.current.queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === workItem?.jobId)
  if (
    !workItem || !entry || entry.state !== 'queued' ||
    entry.definition.approvedWorkItemId !== workItem.workItemId ||
    decision.decision !== 'accept_exact_private_customer_delivery' ||
    decision.identity.ownerUserId !== input.ownerUserId ||
    decision.identity.packageRecordId !==
      input.current.package.identity.packageRecordId ||
    decision.reviewPacketHash !== packet.packetHash ||
    decision.masterSha256 !== packet.master.sha256 ||
    packet.reviewedQueueAggregateHash !==
      input.current.queueAggregate.aggregateHash ||
    entry.definition.dependencyJobIds.length !== 2 ||
    entry.definition.dependencyJobIds.some((jobId) =>
      input.current.queueAggregate.entries.find((candidate) =>
        candidate.definition.jobId === jobId)?.state !== 'completed')
  ) throw new Error(
    'Private customer-delivery download authority lacks exact accepted QA lineage.',
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_customer_delivery_download_authority' as const,
    purpose:
      'authorize_one_exact_private_customer_delivery_download_reconciliation' as const,
    status:
      'authenticated_quality_acceptance_authorizes_private_download_reconciliation_only' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: input.current.package.identity.workspaceId,
      projectId: input.current.package.identity.projectId,
      editSessionId: input.current.package.identity.editSessionId,
      approvedPlanId: input.current.package.identity.approvedPlanId,
      approvedPlanSnapshotId:
        input.current.package.identity.approvedPlanSnapshotId,
      approvedPlanSnapshotHash:
        input.current.package.identity.approvedPlanSnapshotHash,
      packageRecordId: input.current.package.identity.packageRecordId,
      jobId: workItem.jobId,
      approvedWorkItemId: workItem.workItemId,
      expectedOutputIdentity: workItem.expectedOutputIdentity,
      kind: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_KIND,
    },
    approval: {
      approvedByUserId: input.current.package.approval.approvedByUserId,
      approvalRecordId: input.current.package.approval.approvalRecordId,
      approvedEstimateId: input.current.package.identity.approvedEstimateId,
      creditReservationId:
        input.current.package.identity.creditReservationId,
      reservationStatus: input.current.package.approval.reservationStatus,
      remainingReservedCredits:
        input.current.package.approval.remainingReservedCredits,
      reservationExpiresAt:
        input.current.package.approval.reservationExpiresAt,
      snapshotApprovedAt: input.current.package.approval.snapshotApprovedAt,
    },
    qualityDecision: {
      qualityDecisionId: decision.identity.qualityDecisionId,
      qualityDecisionHash: decision.decisionHash,
      reviewPacketHash: packet.packetHash,
      decidedByUserId: decision.identity.ownerUserId,
      decision: decision.decision,
    },
    master: packet.master,
    decodedQa: packet.decodedQa,
    lineage: {
      deliveryPackageHash: input.current.package.packageHash,
      deliveryPackageRef: input.current.packageRef,
      deliveryPlacementManifestHash:
        input.current.placementManifest.manifestHash,
      queueDefinitionHash: input.current.queueDefinition.definitionHash,
      downloadJobDefinitionHash: entry.definition.definitionHash,
      downloadPlacementHash: entry.definition.placementHash,
      sourceEvidenceHash: input.current.package.sourceReview.sourceEvidenceHash,
    },
    operation: {
      ...operation,
      workerType: 'api_service' as const,
      resourceClassId: 'control_plane_cpu_v1' as const,
      maximumAttempts: 1 as const,
      attemptTimeoutSeconds: 300 as const,
      leaseDurationMilliseconds: 300_000 as const,
      heartbeatIntervalMilliseconds: 30_000 as const,
      vcpuCount: 1 as const,
      memoryGib: 1 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableQualityAcceptanceRequired: true as const,
      exactPrivateMasterChecksumRequired: true as const,
      exactDecodedQaEvidenceRequired: true as const,
      authenticatedPrivateByteStreamAllowedAfterCompletion: true as const,
      publicUrlCreationAllowed: false as const,
      externalDownloadLinkCreationAllowed: false as const,
      mediaMutationAllowed: false as const,
      providerCallAllowed: false as const,
      googleCloudDispatchAllowed: false as const,
      publicDeliveryAllowed: false as const,
    },
    commercialBoundary,
    persistence,
    authorizedAt: input.authorizedAt,
  }
  return professionalLongFormDeliveryDownloadAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDownloadAuthorization(input: {
  authority: ProfessionalLongFormDeliveryDownloadAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryDownloadAuthorization {
  const authority = professionalLongFormDeliveryDownloadAuthoritySchema.parse(
    input.authority,
  )
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORIZATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_download_service' as const,
    authorizationId: `long-form-delivery-download-auth-${
      authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: authority.authorityHash,
    queueDefinitionHash: authority.lineage.queueDefinitionHash,
    jobId: authority.identity.jobId,
    approvedWorkItemId: authority.identity.approvedWorkItemId,
    jobDefinitionHash: authority.lineage.downloadJobDefinitionHash,
    placementHash: authority.lineage.downloadPlacementHash,
    expectedOutputIdentity: authority.identity.expectedOutputIdentity,
    operation,
    qualityDecisionHash: authority.qualityDecision.qualityDecisionHash,
    authorizedAt: authority.authorizedAt,
    reservationExpiresAt: authority.approval.reservationExpiresAt,
    singleUseDispatchRequired: true as const,
  }
  return professionalLongFormDeliveryDownloadAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDownloadArtifact(input: {
  authority: ProfessionalLongFormDeliveryDownloadAuthority
  attempt: ProfessionalLongFormDeliveryDownloadAttempt
  reconciledAt: string
}): ProfessionalLongFormDeliveryDownloadArtifact {
  const deliveryIdSeed = sha256AuthorityValue({
    authorityHash: input.authority.authorityHash,
    attemptHash: input.attempt.attemptHash,
    masterSha256: input.authority.master.sha256,
  })
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_download_service' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      editSessionId: input.authority.identity.editSessionId,
      approvedPlanSnapshotId:
        input.authority.identity.approvedPlanSnapshotId,
      packageRecordId: input.authority.identity.packageRecordId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      executionAttemptId: input.attempt.executionAttemptId,
      privateDownloadDeliveryId:
        `long-form-private-download-${deliveryIdSeed.slice(0, 40)}`,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.attempt.attemptHash,
    qualityDecisionId: input.authority.qualityDecision.qualityDecisionId,
    qualityDecisionHash: input.authority.qualityDecision.qualityDecisionHash,
    reviewPacketHash: input.authority.qualityDecision.reviewPacketHash,
    master: input.authority.master,
    decodedQa: {
      videoObjectiveEvidenceHash:
        input.authority.decodedQa.video.objectiveEvidenceHash,
      videoOutcome: input.authority.decodedQa.video.outcome,
      audioObjectiveEvidenceHash:
        input.authority.decodedQa.audio.objectiveEvidenceHash,
      audioOutcome: input.authority.decodedQa.audio.outcome,
      actualSpeechIntelligibilityAnalysisPerformed: false as const,
    },
    verification: {
      exactPrivateMasterReopened: true as const,
      exactMasterChecksumVerified: true as const,
      exactMasterByteLengthVerified: true as const,
      exactQualityDecisionReopened: true as const,
      exactDecodedQaLineageVerified: true as const,
      currentWorkspaceReadAccessRequiredPerDownload: true as const,
      mediaMutated: false as const,
    },
    delivery: {
      mimeType: 'video/mp4' as const,
      fileName: `reeditpro-private-delivery-${
        input.authority.master.sha256.slice(0, 16)}.mp4`,
      byteSize: input.authority.master.byteLength,
      sha256: input.authority.master.sha256,
      byteRangeSupported: true as const,
      publicUrlCreated: false as const,
      externalDownloadLinkCreated: false as const,
      publicDeliveryAuthorized: false as const,
    },
    commercialBoundary,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormDeliveryDownloadArtifactSchema.parse({
    ...payload,
    artifactHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDownloadReconciliation(input: {
  authority: ProfessionalLongFormDeliveryDownloadAuthority
  attempt: ProfessionalLongFormDeliveryDownloadAttempt
  artifact: ProfessionalLongFormDeliveryDownloadArtifact
  artifactRef: AuthorityJsonBlobRef
}): ProfessionalLongFormDeliveryDownloadReconciliation {
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_download_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.attempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    qualityDecisionHash: input.authority.qualityDecision.qualityDecisionHash,
    downloadArtifactRef: input.artifactRef,
    downloadArtifactHash: input.artifact.artifactHash,
    decision:
      'exact_quality_accepted_private_customer_delivery_ready_for_authenticated_stream' as const,
    privateDownloadReconciled: true as const,
    publicDeliveryAuthorized: false as const,
    reconciledAt: input.artifact.reconciledAt,
  }
  return professionalLongFormDeliveryDownloadReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDownloadTerminal(input: {
  authority: ProfessionalLongFormDeliveryDownloadAuthority
  authorization: ProfessionalLongFormDeliveryDownloadAuthorization
  attempt: ProfessionalLongFormDeliveryDownloadAttempt
  artifactRef: AuthorityJsonBlobRef
  reconciliationRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormDeliveryDownloadTerminal {
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_download_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.attempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.artifactRef,
    reconciliationEvidenceRef: input.reconciliationRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    operation,
    outcome: 'completed_private_test' as const,
    privateDownloadReconciled: true as const,
    authenticatedPrivateStreamReady: true as const,
    publicDeliveryAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormDeliveryDownloadTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDownloadCompletion(input: {
  authority: ProfessionalLongFormDeliveryDownloadAuthority
  authorization: ProfessionalLongFormDeliveryDownloadAuthorization
  attempt: ProfessionalLongFormDeliveryDownloadAttempt
  artifact: ProfessionalLongFormDeliveryDownloadArtifact
  artifactRef: AuthorityJsonBlobRef
  reconciliationRef: AuthorityJsonBlobRef
  terminalRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
}): ProfessionalLongFormDeliveryDownloadCompletion {
  return professionalLongFormDeliveryDownloadCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COMPLETION_VERSION,
    executionAttemptId: input.attempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    validationArtifactRef: input.artifactRef,
    reconciliationEvidenceRef: input.reconciliationRef,
    terminalEvidenceRef: input.terminalRef,
    operation,
    qualityDecisionHash: input.authority.qualityDecision.qualityDecisionHash,
    privateDownloadDeliveryId:
      input.artifact.identity.privateDownloadDeliveryId,
  })
}

function reviewItem(input: {
  category: 'decoded_video_integrity' | 'decoded_audio_quality_sync'
  gateId: 'decoded_video_integrity' | 'decoded_audio_quality_sync'
  evidenceHash: string
  outcome: 'passed' | 'needs_user_review'
}) {
  const payload = {
    itemId: `delivery-review-${input.category}-${input.evidenceHash.slice(0, 32)}`,
    category: input.category,
    gateId: input.gateId,
    evidenceHash: input.evidenceHash,
    automatedOutcome: input.outcome,
    userDecisionRequired: input.outcome === 'needs_user_review',
    automaticAcceptanceAllowed: input.outcome === 'passed',
    safeSummaryCode: input.category === 'decoded_video_integrity'
      ? input.outcome === 'passed'
        ? 'full_video_decode_passed' as const
        : 'full_video_decode_requires_human_acceptance' as const
      : input.outcome === 'passed'
        ? 'full_audio_quality_sync_passed' as const
        : 'full_audio_quality_sync_requires_human_acceptance' as const,
  }
  return { ...payload, itemHash: sha256AuthorityValue(payload) }
}

function speechReviewItem(audioEvidenceHash: string) {
  const evidenceHash = sha256AuthorityValue({
    domain: 'manual_customer_delivery_speech_intelligibility_review_v1',
    audioEvidenceHash,
    actualSpeechIntelligibilityAnalysisPerformed: false,
  })
  const payload = {
    itemId: `delivery-review-speech-${evidenceHash.slice(0, 32)}`,
    category: 'speech_intelligibility_attestation' as const,
    gateId: 'manual_speech_intelligibility_review' as const,
    evidenceHash,
    automatedOutcome: 'not_automatically_analyzed' as const,
    userDecisionRequired: true,
    automaticAcceptanceAllowed: false,
    safeSummaryCode:
      'speech_intelligibility_requires_manual_or_not_applicable_attestation' as const,
  }
  return { ...payload, itemHash: sha256AuthorityValue(payload) }
}
