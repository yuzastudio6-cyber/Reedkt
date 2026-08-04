import type {
  ObjectiveDecodedAudioQualitySyncEvidence,
  ObjectiveDecodedVideoIntegrityEvidence,
} from '../final-master-qa/objective-final-master-qa-types'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import {
  sealOfflineFinalMasterAudioExceptionManifest,
  sealOfflineFinalMasterVisualExceptionManifest,
  type OfflineFinalMasterAudioQaExecutionResult,
  type OfflineFinalMasterVideoQaExecutionResult,
  type OfflineMediaBinaryRuntimeAuthority,
} from '../tool-execution/media-binary-execution'
import type {
  CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
} from './professional-long-form-customer-delivery-execution'
import {
  professionalLongFormDeliveryMuxCompletionSchema,
} from './professional-long-form-customer-delivery-mux-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECIPE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_TERMINAL_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECIPE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_TERMINAL_VERSION,
  professionalLongFormDeliveryDecodedAudioQaArtifactSchema,
  professionalLongFormDeliveryDecodedAudioQaAuthoritySchema,
  professionalLongFormDeliveryDecodedAudioQaAuthorizationSchema,
  professionalLongFormDeliveryDecodedAudioQaCompletionSchema,
  professionalLongFormDeliveryDecodedAudioQaReconciliationSchema,
  professionalLongFormDeliveryDecodedAudioQaTerminalSchema,
  professionalLongFormDeliveryDecodedVideoQaArtifactSchema,
  professionalLongFormDeliveryDecodedVideoQaAuthoritySchema,
  professionalLongFormDeliveryDecodedVideoQaAuthorizationSchema,
  professionalLongFormDeliveryDecodedVideoQaCompletionSchema,
  professionalLongFormDeliveryDecodedVideoQaReconciliationSchema,
  professionalLongFormDeliveryDecodedVideoQaTerminalSchema,
  type ProfessionalLongFormDeliveryDecodedAudioQaArtifact,
  type ProfessionalLongFormDeliveryDecodedAudioQaAttempt,
  type ProfessionalLongFormDeliveryDecodedAudioQaAuthority,
  type ProfessionalLongFormDeliveryDecodedAudioQaAuthorization,
  type ProfessionalLongFormDeliveryDecodedAudioQaCompletion,
  type ProfessionalLongFormDeliveryDecodedAudioQaReconciliation,
  type ProfessionalLongFormDeliveryDecodedAudioQaTerminal,
  type ProfessionalLongFormDeliveryDecodedVideoQaArtifact,
  type ProfessionalLongFormDeliveryDecodedVideoQaAttempt,
  type ProfessionalLongFormDeliveryDecodedVideoQaAuthority,
  type ProfessionalLongFormDeliveryDecodedVideoQaAuthorization,
  type ProfessionalLongFormDeliveryDecodedVideoQaCompletion,
  type ProfessionalLongFormDeliveryDecodedVideoQaReconciliation,
  type ProfessionalLongFormDeliveryDecodedVideoQaTerminal,
} from './professional-long-form-customer-delivery-decoded-qa-execution-contract'

const videoOperation = {
  operationId: PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RUNNER_CLASS,
  attemptCostProfileId:
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
  fixedRecipeProfileId:
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECIPE_ID,
} as const

const audioOperation = {
  operationId: PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RUNNER_CLASS,
  attemptCostProfileId:
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
  fixedRecipeProfileId:
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECIPE_ID,
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

type QaKind = 'video' | 'audio'

export function buildProfessionalLongFormDeliveryDecodedVideoQaAuthority(
  input: {
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
    runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  },
): ProfessionalLongFormDeliveryDecodedVideoQaAuthority {
  const common = buildAuthorityCommon({ ...input, kind: 'video' })
  const visualExceptionManifest = sealOfflineFinalMasterVisualExceptionManifest([])
  const approvedQaPlanWithoutHash = {
    ...common.qaPlan,
    recipeProfileId:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECIPE_ID,
    anomalyPolicyId: 'approved_objective_visual_anomaly_policy_v1' as const,
    blackMinimumDurationFrames: 2,
    freezeMinimumDurationFrames: 60,
    flashSceneChangeThreshold: 0.8 as const,
    visualExceptionManifest,
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_customer_delivery_decoded_video_qa_authority' as const,
    purpose:
      'authorize_one_full_decode_and_visual_integrity_scan_of_exact_private_customer_delivery_master' as const,
    status:
      'decoded_video_qa_authorized_private_download_separately_blocked' as const,
    identity: {
      ...common.identity,
      kind: PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND,
    },
    approval: common.approval,
    approvedQaPlan: {
      ...approvedQaPlanWithoutHash,
      planHash: sha256AuthorityValue(approvedQaPlanWithoutHash),
    },
    muxArtifact: common.muxArtifact,
    lineage: common.lineage,
    operation: {
      ...videoOperation,
      ...operationRuntime,
    },
    permissions: {
      immutableMuxCompletionRequired: true as const,
      exactPrivateMasterChecksumRequired: true as const,
      independentTechnicalProbe: true as const,
      fullDecodedFrameIntegrity: true as const,
      visualAnomalyPolicyRequired: true as const,
      privateQaArtifactCreateOnly: true as const,
      downloadExecutionAuthorized: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence: persistenceBoundary,
    authorizedAt: common.authorizedAt,
  }
  return professionalLongFormDeliveryDecodedVideoQaAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDecodedAudioQaAuthority(
  input: {
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
    runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  },
): ProfessionalLongFormDeliveryDecodedAudioQaAuthority {
  const common = buildAuthorityCommon({ ...input, kind: 'audio' })
  const audioExceptionManifest = sealOfflineFinalMasterAudioExceptionManifest([])
  const speechClarityEvidenceHash = sha256AuthorityValue({
    domain: 'professional_long_form_delivery_bound_upstream_audio_acceptance_v1',
    approvedPlanSnapshotId: common.identity.approvedPlanSnapshotId,
    sourceEvidenceHash: common.lineage.sourceEvidenceHash,
    sourceProgramAudioQaArtifactHash:
      input.current.package.sourceReview.continuousProgramAudio
        .sourceQaArtifactHash,
    sourcePrivateMasterQaArtifactHash:
      input.current.package.sourceReview.privateMasterQa.validationArtifactHash,
    actualSpeechIntelligibilityAnalysisPerformed: false,
  })
  const approvedQaPlanWithoutHash = {
    ...common.qaPlan,
    recipeProfileId:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECIPE_ID,
    audioPolicyId: 'approved_web_delivery_audio_policy_v1' as const,
    sampleRate: 48_000 as const,
    channels: 2 as const,
    targetIntegratedLufs: -14 as const,
    integratedLufsTolerance: 1 as const,
    maximumTruePeakDbtp: -1 as const,
    maximumLoudnessRangeLufs: 7 as const,
    maximumAvSyncDriftFrames: 2 as const,
    silenceMinimumDurationFrames: 30 as const,
    speechClarityEvidenceHash,
    speechClarityEvidenceSource:
      'bound_upstream_private_review_audio_acceptance_v1' as const,
    actualSpeechIntelligibilityAnalysisPerformed: false as const,
    audioExceptionManifest,
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_customer_delivery_decoded_audio_qa_authority' as const,
    purpose:
      'authorize_one_full_decode_audio_quality_and_av_sync_scan_of_exact_private_customer_delivery_master' as const,
    status:
      'decoded_audio_qa_authorized_private_download_separately_blocked' as const,
    identity: {
      ...common.identity,
      kind: PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND,
    },
    approval: common.approval,
    approvedQaPlan: {
      ...approvedQaPlanWithoutHash,
      planHash: sha256AuthorityValue(approvedQaPlanWithoutHash),
    },
    muxArtifact: common.muxArtifact,
    lineage: common.lineage,
    operation: {
      ...audioOperation,
      ...operationRuntime,
    },
    permissions: {
      immutableMuxCompletionRequired: true as const,
      exactPrivateMasterChecksumRequired: true as const,
      independentTechnicalProbe: true as const,
      fullDecodedAudioIntegrity: true as const,
      loudnessPeakSilenceAndAvSyncPolicyRequired: true as const,
      separateSpeechClarityEvidenceRequired: true as const,
      ffmpegSpeechUnderstandingAllowed: false as const,
      privateQaArtifactCreateOnly: true as const,
      downloadExecutionAuthorized: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence: persistenceBoundary,
    authorizedAt: common.authorizedAt,
  }
  return professionalLongFormDeliveryDecodedAudioQaAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormDeliveryDecodedVideoQaAuthority(
  input: {
    value: unknown
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
    runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  },
): ProfessionalLongFormDeliveryDecodedVideoQaAuthority {
  const parsed = professionalLongFormDeliveryDecodedVideoQaAuthoritySchema.parse(
    input.value,
  )
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormDeliveryDecodedVideoQaAuthority(input)
  assertExact(parsed, expected, 'Customer-delivery decoded-video QA authority changed.')
  return expected
}

export function assertProfessionalLongFormDeliveryDecodedAudioQaAuthority(
  input: {
    value: unknown
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
    runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  },
): ProfessionalLongFormDeliveryDecodedAudioQaAuthority {
  const parsed = professionalLongFormDeliveryDecodedAudioQaAuthoritySchema.parse(
    input.value,
  )
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormDeliveryDecodedAudioQaAuthority(input)
  assertExact(parsed, expected, 'Customer-delivery decoded-audio QA authority changed.')
  return expected
}

export function buildProfessionalLongFormDeliveryDecodedVideoQaAuthorization(
  input: {
    authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority
    authorityRef: AuthorityJsonBlobRef
  },
): ProfessionalLongFormDeliveryDecodedVideoQaAuthorization {
  return buildAuthorization(input, 'video')
}

export function buildProfessionalLongFormDeliveryDecodedAudioQaAuthorization(
  input: {
    authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority
    authorityRef: AuthorityJsonBlobRef
  },
): ProfessionalLongFormDeliveryDecodedAudioQaAuthorization {
  return buildAuthorization(input, 'audio')
}

export function professionalLongFormDeliveryDecodedVideoQaRuntimeReceipt(
  result: OfflineFinalMasterVideoQaExecutionResult,
) {
  return runtimeReceipt(result, 'decoded-video')
}

export function professionalLongFormDeliveryDecodedAudioQaRuntimeReceipt(
  result: OfflineFinalMasterAudioQaExecutionResult,
) {
  return runtimeReceipt(result, 'decoded-audio')
}

export function buildProfessionalLongFormDeliveryDecodedVideoQaArtifact(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt
  rawRunnerResultRef: AuthorityJsonBlobRef
  runtimeReceiptRef: AuthorityJsonBlobRef
  objectiveEvidenceRef: AuthorityJsonBlobRef
  objectiveEvidence: ObjectiveDecodedVideoIntegrityEvidence
  runnerResult: OfflineFinalMasterVideoQaExecutionResult
}): ProfessionalLongFormDeliveryDecodedVideoQaArtifact {
  assertExecutionLineage(input, 'video')
  assertBlobRef(input.rawRunnerResultRef, input.runnerResult.resultJson.document)
  assertBlobRef(
    input.runtimeReceiptRef,
    professionalLongFormDeliveryDecodedVideoQaRuntimeReceipt(input.runnerResult),
  )
  assertObjectiveEvidence(input.objectiveEvidenceRef, input.objectiveEvidence, {
    gateId: 'decoded_video_integrity',
    authority: input.authority,
    attemptId: input.executionAttempt.executionAttemptId,
  })
  const metrics = input.objectiveEvidence.metrics
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_decoded_video_qa' as const,
    identity: artifactIdentity(input.authority, input.executionAttempt),
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: videoOperation,
    muxArtifact: input.authority.muxArtifact,
    rawRunnerResultRef: input.rawRunnerResultRef,
    runtimeReceiptRef: input.runtimeReceiptRef,
    objectiveEvidenceRef: input.objectiveEvidenceRef,
    objectiveEvidenceHash: input.objectiveEvidence.evidenceHash,
    requestEnvelopeSha256: input.runnerResult.evidence.requestEnvelopeSha256,
    runtimeImageIdentityHash: input.runnerResult.image.imageIdentityHash,
    runtimeAttestationHash: input.runnerResult.attestation.attestationHash,
    approvedVisualExceptionManifestHash:
      input.authority.approvedQaPlan.visualExceptionManifest.manifestHash,
    observed: {
      fullFrameDecodeCompleted: true as const,
      decodedFrameCount: metrics.decodedFrameCount,
      decodeErrorCount: 0 as const,
      nonMonotonicTimestampCount: 0 as const,
      unexpectedBlackFrameCount: metrics.unexpectedBlackFrameCount,
      unexpectedFreezeFrameCount: metrics.unexpectedFreezeFrameCount,
      unexpectedFlashFrameCount: metrics.unexpectedFlashFrameCount,
      fullFrameCoverage: true as const,
    },
    checks: {
      exactPersistedCustomerDeliveryMasterReopened: 'passed' as const,
      independentPinnedFfmpegExecution: 'passed' as const,
      exactH264Yuv420pBt709FrameContract: 'passed' as const,
      everyDecodedFrameAccountedFor: 'passed' as const,
      visualAnomaliesReconciledAgainstApprovedExceptions:
        input.objectiveEvidence.outcome,
      noMediaMutationOrCommercialAction: 'passed' as const,
    },
    outcome: input.objectiveEvidence.outcome,
    evaluatedAt: input.objectiveEvidence.evaluatedAt,
  }
  return professionalLongFormDeliveryDecodedVideoQaArtifactSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDecodedAudioQaArtifact(input: {
  authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  rawRunnerResultRef: AuthorityJsonBlobRef
  runtimeReceiptRef: AuthorityJsonBlobRef
  objectiveEvidenceRef: AuthorityJsonBlobRef
  objectiveEvidence: ObjectiveDecodedAudioQualitySyncEvidence
  runnerResult: OfflineFinalMasterAudioQaExecutionResult
}): ProfessionalLongFormDeliveryDecodedAudioQaArtifact {
  assertExecutionLineage(input, 'audio')
  assertBlobRef(input.rawRunnerResultRef, input.runnerResult.resultJson.document)
  assertBlobRef(
    input.runtimeReceiptRef,
    professionalLongFormDeliveryDecodedAudioQaRuntimeReceipt(input.runnerResult),
  )
  assertObjectiveEvidence(input.objectiveEvidenceRef, input.objectiveEvidence, {
    gateId: 'decoded_audio_quality_sync',
    authority: input.authority,
    attemptId: input.executionAttempt.executionAttemptId,
  })
  const metrics = input.objectiveEvidence.metrics
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_decoded_audio_qa' as const,
    identity: artifactIdentity(input.authority, input.executionAttempt),
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: audioOperation,
    muxArtifact: input.authority.muxArtifact,
    rawRunnerResultRef: input.rawRunnerResultRef,
    runtimeReceiptRef: input.runtimeReceiptRef,
    objectiveEvidenceRef: input.objectiveEvidenceRef,
    objectiveEvidenceHash: input.objectiveEvidence.evidenceHash,
    requestEnvelopeSha256: input.runnerResult.evidence.requestEnvelopeSha256,
    runtimeImageIdentityHash: input.runnerResult.image.imageIdentityHash,
    runtimeAttestationHash: input.runnerResult.attestation.attestationHash,
    approvedAudioExceptionManifestHash:
      input.authority.approvedQaPlan.audioExceptionManifest.manifestHash,
    speechClarityEvidenceHash:
      input.authority.approvedQaPlan.speechClarityEvidenceHash,
    speechClarityEvidenceSource:
      'bound_upstream_private_review_audio_acceptance_v1' as const,
    actualSpeechIntelligibilityAnalysisPerformed: false as const,
    observed: {
      fullProgramAudioDecodeCompleted: true as const,
      sampleRate: 48_000 as const,
      channels: 2 as const,
      decodedSampleFrameCount: metrics.decodedSampleFrameCount,
      integratedLufs: metrics.integratedLufs,
      truePeakDbtp: metrics.truePeakDbtp,
      loudnessRangeLufs: metrics.loudnessRangeLufs,
      avSyncDriftFrames: metrics.avSyncDriftFrames,
      unexpectedClippedSampleCount: metrics.unexpectedClippedSampleCount,
      unexpectedDigitalSilenceFrameCount:
        metrics.unexpectedDigitalSilenceFrameCount,
      speechClarityGatePassed: metrics.speechClarityGatePassed,
    },
    checks: {
      exactPersistedCustomerDeliveryMasterReopened: 'passed' as const,
      independentPinnedFfmpegExecution: 'passed' as const,
      exactAac48kStereoContract: 'passed' as const,
      everyDecodedAudioSampleRangeAccountedFor: 'passed' as const,
      loudnessPeakSilenceAndAvSyncPolicy: input.objectiveEvidence.outcome,
      separateSpeechClarityEvidenceBound: 'passed' as const,
      ffmpegClaimedSpeechUnderstanding: false as const,
      noMediaMutationOrCommercialAction: 'passed' as const,
    },
    outcome: input.objectiveEvidence.outcome,
    evaluatedAt: input.objectiveEvidence.evaluatedAt,
  }
  return professionalLongFormDeliveryDecodedAudioQaArtifactSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDecodedVideoQaReconciliation(
  input: {
    current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
    authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority
    authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization
    executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt
    qaArtifactRef: AuthorityJsonBlobRef
    qaOutcome: 'passed' | 'needs_user_review'
    reconciledAt: string
    allowCompletedQa?: boolean
  },
): ProfessionalLongFormDeliveryDecodedVideoQaReconciliation {
  const common = buildReconciliationCommon(input, 'video')
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_decoded_video_qa_reconciliation' as const,
    ...common,
    decision:
      'decoded_video_qa_finished_decoded_audio_and_private_download_remain_separately_gated' as const,
  }
  return professionalLongFormDeliveryDecodedVideoQaReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDecodedAudioQaReconciliation(
  input: {
    current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
    authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority
    authorization: ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
    executionAttempt: ProfessionalLongFormDeliveryDecodedAudioQaAttempt
    qaArtifactRef: AuthorityJsonBlobRef
    qaOutcome: 'passed' | 'needs_user_review'
    reconciledAt: string
    allowCompletedQa?: boolean
  },
): ProfessionalLongFormDeliveryDecodedAudioQaReconciliation {
  const common = buildReconciliationCommon(input, 'audio')
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_decoded_audio_qa_reconciliation' as const,
    ...common,
    actualSpeechIntelligibilityAnalysisPerformed: false as const,
    decision:
      'decoded_audio_quality_and_sync_qa_finished_private_download_requires_exact_qa_reconciliation' as const,
  }
  return professionalLongFormDeliveryDecodedAudioQaReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormDeliveryDecodedVideoQaResultHash(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return decodedQaResultHash(input, 'video')
}

export function professionalLongFormDeliveryDecodedAudioQaResultHash(input: {
  authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  executionAttempt: ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return decodedQaResultHash(input, 'audio')
}

export function buildProfessionalLongFormDeliveryDecodedVideoQaTerminal(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  objectiveQaOutcome: 'passed' | 'needs_user_review'
  decodedAudioQaCompleted: boolean
  completedAt: string
}): ProfessionalLongFormDeliveryDecodedVideoQaTerminal {
  assertExecutionLineage(input, 'video')
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service' as const,
    ...terminalCommon(input),
    operation: videoOperation,
    decodedAudioQaCompleted: input.decodedAudioQaCompleted,
  }
  return professionalLongFormDeliveryDecodedVideoQaTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDecodedAudioQaTerminal(input: {
  authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  objectiveQaOutcome: 'passed' | 'needs_user_review'
  decodedVideoQaCompleted: boolean
  completedAt: string
}): ProfessionalLongFormDeliveryDecodedAudioQaTerminal {
  assertExecutionLineage(input, 'audio')
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service' as const,
    ...terminalCommon(input),
    operation: audioOperation,
    decodedVideoQaCompleted: input.decodedVideoQaCompleted,
    actualSpeechIntelligibilityAnalysisPerformed: false as const,
  }
  return professionalLongFormDeliveryDecodedAudioQaTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormDeliveryDecodedVideoQaCompletion(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
  objectiveQaOutcome: 'passed' | 'needs_user_review'
}): ProfessionalLongFormDeliveryDecodedVideoQaCompletion {
  assertExecutionLineage(input, 'video')
  return professionalLongFormDeliveryDecodedVideoQaCompletionSchema.parse({
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COMPLETION_VERSION,
    ...completionCommon(input),
    operation: videoOperation,
  })
}

export function buildProfessionalLongFormDeliveryDecodedAudioQaCompletion(input: {
  authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
  objectiveQaOutcome: 'passed' | 'needs_user_review'
}): ProfessionalLongFormDeliveryDecodedAudioQaCompletion {
  assertExecutionLineage(input, 'audio')
  return professionalLongFormDeliveryDecodedAudioQaCompletionSchema.parse({
    schemaVersion:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COMPLETION_VERSION,
    ...completionCommon(input),
    operation: audioOperation,
    actualSpeechIntelligibilityAnalysisPerformed: false,
  })
}

const operationRuntime = {
  workerType: 'qa_worker' as const,
  resourceClassId: 'qa_cpu_standard_v1' as const,
  maximumAttempts: 2 as const,
  attemptTimeoutSeconds: 21_600 as const,
  leaseDurationMilliseconds: 300_000 as const,
  heartbeatIntervalMilliseconds: 30_000 as const,
  vcpuCount: 2 as const,
  memoryGib: 2 as const,
  gpuCount: 0 as const,
}

const persistenceBoundary = {
  privateLocalContentAddressed: true as const,
  queueReceiptRequiredBeforeLease: true as const,
  queueAttemptRequiredBeforeOperation: true as const,
  queueCompletionIsAuthorityCommit: true as const,
  orphanBlobsGrantExecutionAuthority: false as const,
  distributedDatabaseBacked: false as const,
  productionDurabilityProven: false as const,
}

function buildAuthorityCommon(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  kind: QaKind
}) {
  const deliveryPackage = input.current.package
  const selectedKind = input.kind === 'video'
    ? PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND
    : PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND
  const expectedOperation = input.kind === 'video' ? videoOperation : audioOperation
  const selection = selectQa(input.current, selectedKind)
  const muxEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.canonicalOrder === deliveryPackage.outputContract.chunkCount * 2 + 1)
  if (!muxEntry?.completion || muxEntry.state !== 'completed') {
    throw new Error('Customer-delivery decoded QA requires the exact completed mux.')
  }
  const muxCompletion = professionalLongFormDeliveryMuxCompletionSchema.parse(
    muxEntry.completion.outcome.professionalLongFormExecution,
  )
  const muxCompletionEvidence = {
    jobId: muxEntry.definition.jobId,
    approvedWorkItemId: muxEntry.definition.approvedWorkItemId,
    queueCompletionHash: muxEntry.completion.completionHash,
    canonicalResultHash: muxCompletion.canonicalResultHash,
    attemptInternalCostEvidenceHash:
      muxCompletion.attemptInternalCostEvidenceHash,
    runtimeEvidenceRef: muxCompletion.runtimeEvidenceRef,
    reconciliationEvidenceRef: muxCompletion.reconciliationEvidenceRef,
    terminalEvidenceRef: muxCompletion.terminalEvidenceRef,
    artifact: muxCompletion.outputArtifact,
  }
  const expectedOrder = deliveryPackage.outputContract.chunkCount * 2 +
    (input.kind === 'video' ? 2 : 3)
  const readinessKey = input.kind === 'video'
    ? 'privateInternalFinalMasterDecodedVideoQaReady'
    : 'privateInternalFinalMasterDecodedAudioQaReady'
  if (
    input.ownerUserId !== deliveryPackage.identity.ownerUserId ||
    input.ownerUserId !== deliveryPackage.approval.approvedByUserId ||
    deliveryPackage.approval.reservationStatus !== 'reserved' ||
    deliveryPackage.approval.remainingReservedCredits <= 0 ||
    selection.workItem.canonicalOrder !== expectedOrder ||
    selection.workItem.toolPlan.toolId !== 'ffmpeg' ||
    selection.workItem.toolPlan.operationId !== expectedOperation.operationId ||
    selection.workItem.toolPlan.runnerClass !== expectedOperation.runnerClass ||
    selection.workItem.toolPlan.attemptCostProfileId !==
      expectedOperation.attemptCostProfileId ||
    selection.workItem.toolPlan.fixedRecipeProfileId !==
      expectedOperation.fixedRecipeProfileId ||
    selection.workItem.dependencyJobIds.length !== 1 ||
    selection.workItem.dependencyJobIds[0] !== muxEntry.definition.jobId ||
    selection.workItem.expectedOutputIdentity !==
      `${muxCompletion.outputArtifact.objectIdentity}:decoded-${input.kind}-qa` ||
    selection.placement.workerType !== 'qa_worker' ||
    selection.placement.resourceClassId !== 'qa_cpu_standard_v1' ||
    selection.placement.vcpuCount !== 2 || selection.placement.memoryGib !== 2 ||
    selection.placement.maxAttempts !== 2 ||
    selection.placement.attemptTimeoutSeconds !== 21_600 ||
    selection.placement.privateExecutionReady ||
    selection.placement.providerExecutionMode !== 'none' ||
    selection.queueJob.definitionHash !== selection.queueEntry.definition.definitionHash ||
    selection.queueJob.placementHash !== selection.placement.placementHash ||
    input.runtimeAuthority.readiness[readinessKey] !== true ||
    input.runtimeAuthority.readiness.productReady !== false ||
    input.runtimeAuthority.readiness.productionReady !== false
  ) throw new Error(
    `Customer-delivery decoded-${input.kind} QA lost package, queue, mux, runtime, or reservation authority.`,
  )
  const qaRunId = `long-form-delivery-${input.kind}-qa-${sha256AuthorityValue({
    packageHash: deliveryPackage.packageHash,
    jobId: selection.queueJob.jobId,
    muxSha256: muxCompletion.outputArtifact.sha256,
  }).slice(0, 40)}`
  return {
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: deliveryPackage.identity.workspaceId,
      projectId: deliveryPackage.identity.projectId,
      editSessionId: deliveryPackage.identity.editSessionId,
      approvedPlanId: deliveryPackage.identity.approvedPlanId,
      approvedPlanSnapshotId: deliveryPackage.identity.approvedPlanSnapshotId,
      approvedPlanSnapshotHash: deliveryPackage.identity.approvedPlanSnapshotHash,
      packageRecordId: deliveryPackage.identity.packageRecordId,
      jobId: selection.queueJob.jobId,
      approvedWorkItemId: selection.queueJob.approvedWorkItemId,
      expectedOutputIdentity: selection.workItem.expectedOutputIdentity,
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
    qaPlan: {
      qaRunId,
      approvedExecutionPackageHash: deliveryPackage.packageHash,
      approvedDeliverableId: deliveryPackage.identity.packageRecordId,
      expectedEvidenceIdentity: selection.workItem.expectedOutputIdentity,
      finalMasterArtifactId: muxCompletion.outputArtifact.objectIdentity,
      finalMasterObjectIdentityHash: muxCompletion.outputArtifact.objectIdentity,
      width: deliveryPackage.outputContract.width,
      height: deliveryPackage.outputContract.height,
      fps: 30 as const,
      totalFrames: deliveryPackage.outputContract.totalFrames,
      mediaPolicyId:
        'approved_h264_aac_yuv420p_bt709_web_master_v1' as const,
      usesApprovedEditReservation: true as const,
      requiresSeparateExportEstimate: false as const,
      allowsAdditionalExportCharge: false as const,
      mediaMutationAllowed: false as const,
      providerCallAllowed: false as const,
    },
    muxArtifact: muxCompletion.outputArtifact,
    lineage: {
      deliveryPackageHash: deliveryPackage.packageHash,
      deliveryPackageRef: input.current.packageRef,
      deliveryPlacementManifestHash: input.current.placementManifest.manifestHash,
      deliveryPlacementManifestRef: input.current.placementManifestRef,
      queueDefinitionHash: input.current.queueDefinition.definitionHash,
      qaJobDefinitionHash: selection.queueJob.definitionHash,
      qaPlacementHash: selection.placement.placementHash,
      sourceEvidenceHash: deliveryPackage.sourceReview.sourceEvidenceHash,
      muxCompletion: muxCompletionEvidence,
      muxCompletionHash: sha256AuthorityValue(muxCompletionEvidence),
      mediaBinaryRuntimeAuthorityHash:
        stableMediaBinaryRuntimeAuthorityHash(input.runtimeAuthority, input.kind),
      mediaBinaryImageIdentityHash:
        input.runtimeAuthority.image.imageIdentityHash,
    },
    authorizedAt: muxEntry.completion.completedAt,
  }
}

function buildAuthorization(
  input: {
    authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority
    authorityRef: AuthorityJsonBlobRef
  },
  kind: 'video',
): ProfessionalLongFormDeliveryDecodedVideoQaAuthorization
function buildAuthorization(
  input: {
    authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority
    authorityRef: AuthorityJsonBlobRef
  },
  kind: 'audio',
): ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
function buildAuthorization(
  input: {
    authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
      ProfessionalLongFormDeliveryDecodedAudioQaAuthority
    authorityRef: AuthorityJsonBlobRef
  },
  kind: QaKind,
) {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const operation = kind === 'video' ? videoOperation : audioOperation
  const payload = {
    schemaVersion: kind === 'video'
      ? PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORIZATION_VERSION
      : PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORIZATION_VERSION,
    source: kind === 'video'
      ? 'server_persisted_professional_long_form_customer_delivery_decoded_video_qa_authority' as const
      : 'server_persisted_professional_long_form_customer_delivery_decoded_audio_qa_authority' as const,
    authorizationId:
      `long-form-delivery-decoded-${kind}-qa-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.qaJobDefinitionHash,
    placementHash: input.authority.lineage.qaPlacementHash,
    kind: kind === 'video'
      ? PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND
      : PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      exactCompletedPrivateMasterRead: true as const,
      fullDecodedStreamAnalysis: true as const,
      privateQaPersistence: true as const,
      mediaMutationAllowed: false as const,
      downloadExecutionAuthorized: false as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  const sealed = { ...payload, receiptHash: sha256AuthorityValue(payload) }
  return kind === 'video'
    ? professionalLongFormDeliveryDecodedVideoQaAuthorizationSchema.parse(sealed)
    : professionalLongFormDeliveryDecodedAudioQaAuthorizationSchema.parse(sealed)
}

function runtimeReceipt(
  result: OfflineFinalMasterVideoQaExecutionResult |
    OfflineFinalMasterAudioQaExecutionResult,
  kind: 'decoded-video' | 'decoded-audio',
) {
  return {
    schemaVersion:
      `professional-long-form-customer-delivery-${kind}-qa-runtime-receipt-v1` as const,
    source: 'offline_media_binary_final_master_qa_runtime' as const,
    resultSha256: result.resultJson.sha256,
    resultByteLength: result.resultJson.byteLength,
    evidence: result.evidence,
    image: result.image,
    attestation: result.attestation,
    readiness: result.readiness,
  }
}

function buildReconciliationCommon(input: {
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  qaOutcome: 'passed' | 'needs_user_review'
  reconciledAt: string
  allowCompletedQa?: boolean
}, kind: QaKind) {
  assertExecutionLineage(input, kind)
  const currentKind = kind === 'video'
    ? PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND
    : PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND
  const siblingKind = kind === 'video'
    ? PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND
    : PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND
  const qaItem = input.current.package.graph.workItems.find((item) =>
    item.kind === currentKind)
  const siblingItem = input.current.package.graph.workItems.find((item) =>
    item.kind === siblingKind)
  const downloadItem = input.current.package.graph.workItems.find((item) =>
    item.kind === 'reconcile_private_customer_delivery_download')
  const qaEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === qaItem?.jobId)
  const siblingEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === siblingItem?.jobId)
  const downloadEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === downloadItem?.jobId)
  if (
    !qaItem || !siblingItem || !downloadItem || !qaEntry || !siblingEntry ||
    !downloadEntry ||
    (qaEntry.state !== 'leased' &&
      !(input.allowCompletedQa && qaEntry.state === 'completed')) ||
    !downloadEntry.definition.dependencyJobIds.includes(qaEntry.definition.jobId) ||
    !downloadEntry.definition.dependencyJobIds.includes(siblingEntry.definition.jobId) ||
    downloadEntry.state !== 'queued' || downloadEntry.deliveryAttemptCount !== 0 ||
    downloadEntry.professionalLongFormExecutionAuthorization ||
    downloadEntry.professionalLongFormExecutionAttempt || downloadEntry.completion
  ) throw new Error(
    `Customer-delivery decoded-${kind} QA lost the separately gated private-download dependency.`,
  )
  return {
    qaJobId: input.authority.identity.jobId,
    qaApprovedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    muxArtifact: input.authority.muxArtifact,
    qaArtifactRef: input.qaArtifactRef,
    qaOutcome: input.qaOutcome,
    siblingDecodedQa: {
      jobId: siblingEntry.definition.jobId,
      approvedWorkItemId: siblingEntry.definition.approvedWorkItemId,
      state: siblingEntry.state === 'completed' ? 'completed' as const : 'queued' as const,
      executionAuthorized: Boolean(
        siblingEntry.professionalLongFormExecutionAuthorization,
      ),
    },
    privateDownload: {
      jobId: downloadEntry.definition.jobId,
      approvedWorkItemId: downloadEntry.definition.approvedWorkItemId,
      dependencyJobIds: [...downloadEntry.definition.dependencyJobIds] as [string, string],
      thisQaDependencySatisfied: true as const,
      executionAuthorized: false as const,
      capabilityBlockedPendingExactReconciliationAuthority: true as const,
    },
    publicDeliveryAuthorized: false as const,
    reconciledAt: input.reconciledAt,
  }
}

function decodedQaResultHash(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}, kind: QaKind): string {
  return sha256AuthorityValue({
    domain: `professional_long_form_customer_delivery_decoded_${kind}_qa_result_v1`,
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    muxArtifact: input.authority.muxArtifact,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

function terminalCommon(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  objectiveQaOutcome: 'passed' | 'needs_user_review'
  completedAt: string
}) {
  return {
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    objectiveQaOutcome: input.objectiveQaOutcome,
    privateDownloadReconciled: false as const,
    publicDeliveryAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
}

function completionCommon(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
  objectiveQaOutcome: 'passed' | 'needs_user_review'
}) {
  return {
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    validationArtifactRef: input.validationArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
    objectiveQaOutcome: input.objectiveQaOutcome,
  }
}

function artifactIdentity(
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority,
  attempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt,
) {
  return {
    workspaceId: authority.identity.workspaceId,
    projectId: authority.identity.projectId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    packageRecordId: authority.identity.packageRecordId,
    jobId: authority.identity.jobId,
    approvedWorkItemId: authority.identity.approvedWorkItemId,
    executionAttemptId: attempt.executionAttemptId,
  }
}

function assertObjectiveEvidence(
  ref: AuthorityJsonBlobRef,
  evidence: ObjectiveDecodedVideoIntegrityEvidence |
    ObjectiveDecodedAudioQualitySyncEvidence,
  expectation: {
    gateId: 'decoded_video_integrity' | 'decoded_audio_quality_sync'
    authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
      ProfessionalLongFormDeliveryDecodedAudioQaAuthority
    attemptId: string
  },
): void {
  assertHashed(evidence, 'evidenceHash')
  assertBlobRef(ref, evidence)
  if (
    evidence.gateId !== expectation.gateId ||
    evidence.qaRunId !== expectation.authority.approvedQaPlan.qaRunId ||
    evidence.approvedPlanSnapshotId !==
      expectation.authority.identity.approvedPlanSnapshotId ||
    evidence.approvedExecutionPackageHash !==
      expectation.authority.approvedQaPlan.approvedExecutionPackageHash ||
    evidence.sourceMasterArtifactId !==
      expectation.authority.muxArtifact.objectIdentity ||
    evidence.sourceMasterSha256 !== expectation.authority.muxArtifact.sha256 ||
    evidence.executionAttemptId !== expectation.attemptId ||
    evidence.providerCallMade ||
    evidence.commercialBoundary.customerPriceAuthorityIncluded ||
    evidence.commercialBoundary.customerCreditAuthorityIncluded ||
    evidence.commercialBoundary.serviceFeeAuthorityIncluded
  ) throw new Error('Customer-delivery decoded QA objective evidence changed.')
}

function assertExecutionLineage(
  input: {
    authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
      ProfessionalLongFormDeliveryDecodedAudioQaAuthority
    authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization |
      ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
    executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
      ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  },
  kind: QaKind,
): void {
  const operation = kind === 'video' ? videoOperation : audioOperation
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.authorizationId !== input.authorization.authorizationId ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    input.executionAttempt.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId ||
    stableAuthorityStringify(input.executionAttempt.operation) !==
      stableAuthorityStringify(operation)
  ) throw new Error(
    `Customer-delivery decoded-${kind} QA lost authority, receipt, or one-use attempt lineage.`,
  )
}

function selectQa(
  current: CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
  kind: typeof PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND |
    typeof PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND,
) {
  const workItem = current.package.graph.workItems.find((item) => item.kind === kind)
  const placement = current.placementManifest.placements.find((entry) =>
    entry.jobId === workItem?.jobId)
  const queueJob = current.queueDefinition.jobs.find((entry) =>
    entry.jobId === workItem?.jobId)
  const queueEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === workItem?.jobId)
  if (!workItem || !placement || !queueJob || !queueEntry) {
    throw new Error(`Canonical customer-delivery ${kind} job is missing.`)
  }
  return { workItem, placement, queueJob, queueEntry }
}

function stableMediaBinaryRuntimeAuthorityHash(
  authority: OfflineMediaBinaryRuntimeAuthority,
  kind: QaKind,
): string {
  return sha256AuthorityValue({
    domain: `professional_long_form_customer_delivery_decoded_${kind}_qa_media_runtime_identity_v1`,
    schemaVersion: authority.schemaVersion,
    imageIdentityHash: authority.image.imageIdentityHash,
    supportedOperations: authority.supportedOperations,
    readiness: kind === 'video'
      ? authority.readiness.privateInternalFinalMasterDecodedVideoQaReady
      : authority.readiness.privateInternalFinalMasterDecodedAudioQaReady,
    productReady: authority.readiness.productReady,
    productionReady: authority.readiness.productionReady,
  })
}

function assertHashed<T extends object>(
  value: T,
  key: keyof T,
): void {
  const payload = { ...value } as Record<PropertyKey, unknown>
  const propertyKey = key as PropertyKey
  const actual = payload[propertyKey]
  delete payload[propertyKey]
  if (typeof actual !== 'string' || actual !== sha256AuthorityValue(payload)) {
    throw new Error('Customer-delivery decoded QA evidence checksum is invalid.')
  }
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (
    ref.sha256 !== sha256AuthorityValue(value) ||
    ref.byteLength !== Buffer.byteLength(stableAuthorityStringify(value), 'utf8')
  ) throw new Error('Customer-delivery decoded QA blob commitment changed.')
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw new Error(message)
  }
}
