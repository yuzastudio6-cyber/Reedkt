export const LIVING_FRAME_AURAFACE_CPU_RUNTIME_VERSION =
  'living-frame-auraface-cpu-runtime-v1' as const

export const LIVING_FRAME_AURAFACE_CPU_RUNTIME_RECEIPT_CLASS =
  'private_internal_subject_neutral_auraface_cpu_runtime_observation' as const

export const LIVING_FRAME_AURAFACE_CPU_RUNTIME_EVIDENCE_CLASSES = [
  'controlled_non_promotable_auraface_cpu_runtime_fixture',
  'private_internal_auraface_cpu_runtime_observation_unreleased',
] as const

export type LivingFrameAuraFaceCpuRuntimeEvidenceClass =
  (typeof LIVING_FRAME_AURAFACE_CPU_RUNTIME_EVIDENCE_CLASSES)[number]

export const LIVING_FRAME_AURAFACE_CPU_RUNTIME_TERMINAL_STATES = [
  'completed',
  'failed',
  'outcome_unknown',
  'user_review_required',
] as const

export type LivingFrameAuraFaceCpuRuntimeTerminalState =
  (typeof LIVING_FRAME_AURAFACE_CPU_RUNTIME_TERMINAL_STATES)[number]

export const LIVING_FRAME_AURAFACE_CPU_RUNTIME_FACE_OUTCOMES = [
  'not_observed',
  'exactly_one_face_each',
  'reference_no_face',
  'candidate_no_face',
  'reference_multiple_faces',
  'candidate_multiple_faces',
  'reference_and_candidate_face_count_invalid',
] as const

export type LivingFrameAuraFaceCpuRuntimeFaceOutcome =
  (typeof LIVING_FRAME_AURAFACE_CPU_RUNTIME_FACE_OUTCOMES)[number]

export const LIVING_FRAME_AURAFACE_CPU_RUNTIME_FAILURE_CODES = [
  'none',
  'input_artifact_read_failed',
  'model_artifact_binding_failed',
  'host_execution_failed',
  'host_connection_closed',
  'host_timeout',
  'host_protocol_invalid',
  'embedding_output_invalid',
  'face_review_required',
] as const

export type LivingFrameAuraFaceCpuRuntimeFailureCode =
  (typeof LIVING_FRAME_AURAFACE_CPU_RUNTIME_FAILURE_CODES)[number]

export const LIVING_FRAME_AURAFACE_CPU_RUNTIME_ISSUE_CODES = [
  'artifact_requirements_invalid',
  'canonical_dispatch_invalid',
  'canonical_dispatch_replay_forbidden',
  'canonical_operation_mismatch',
  'source_binding_invalid',
  'input_port_invalid',
  'input_port_reused',
  'input_packet_invalid',
  'input_packet_lineage_invalid',
  'model_binding_port_invalid',
  'model_binding_port_reused',
  'model_binding_invalid',
  'host_port_invalid',
  'host_execution_result_invalid',
  'face_outcome_invalid',
  'embedding_output_invalid',
  'output_lease_invalid',
  'output_lease_reused',
  'unsafe_receipt_forbidden',
] as const

export type LivingFrameAuraFaceCpuRuntimeIssueCode =
  (typeof LIVING_FRAME_AURAFACE_CPU_RUNTIME_ISSUE_CODES)[number]

export const LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES = [
  'canonical_transformers_auraface_operation_admission_required',
  'qualified_private_cpu_auraface_host_image_required',
  'canonical_model_artifact_mount_binding_required',
  'canonical_private_input_artifact_reader_required',
  'consent_likeness_minor_and_documentary_safety_admission_required',
  'detector_alignment_embedding_compatibility_benchmark_required',
  'embedding_retention_deletion_and_access_policy_required',
  'project_threshold_calibration_and_fairness_review_required',
  'canonical_attempt_completion_and_resource_usage_cost_evidence_required',
  'continuity_measurement_qa_private_review_and_release_required',
] as const

export type LivingFrameAuraFaceCpuRuntimeOpenGate =
  (typeof LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES)[number]

export interface LivingFrameAuraFaceCpuRuntimeAuthority {
  readonly processBoundInputObservation: true
  readonly processBoundModelBindingObservation: true
  readonly processBoundSafetyAdmissionObservation: true
  readonly processBoundHostInvocationObservation: true
  readonly canonicalDispatchAuthority: false
  readonly modelArtifactRepositoryAuthority: false
  readonly modelArtifactMountAuthority: false
  readonly inputArtifactReadAuthority: false
  readonly consentAuthority: false
  readonly identityVerificationAuthority: false
  readonly likenessApprovalAuthority: false
  readonly continuityDecisionAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameAuraFaceCpuRuntimeSourceBindings {
  readonly artifactRequirementSetDigestSha256: string
  readonly referenceArtifactId: string
  readonly referenceArtifactDigestSha256: string
  readonly referenceContinuityEntryDigestSha256: string
  readonly candidateArtifactId: string
  readonly candidateArtifactDigestSha256: string
  readonly candidateContinuityEntryDigestSha256: string
  readonly preprocessingSpecDigestSha256: string
  readonly consentAndSafetyAdmissionDigestSha256: string
}

export interface LivingFrameAuraFaceCpuRuntimeModelBindingObservation {
  readonly canonicalOrder: 0 | 1
  readonly requirementId:
    | 'auraface_v1_embedding_model'
    | 'auraface_v1_face_detector'
  readonly artifactIdentityCode:
    | 'glintr100_onnx'
    | 'scrfd_10g_bnkps_onnx'
  readonly sourceRevision:
    'af6d057c9b0ec4071d4c49c80e3539258798b609'
  readonly artifactFormat: 'onnx'
  readonly byteLength: 260_694_151 | 16_923_827
  readonly contentSha256:
    | 'a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60'
    | '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91'
  readonly artifactRecordIdDigestSha256: string
  readonly descriptorDigestSha256: string
  readonly mountConsumptionDigestSha256: string
  readonly consumerScope:
    'living-frame.auraface-continuity-measurement'
  readonly executionTarget: 'private_controlled_cpu'
  readonly objectVerifiedBeforeConsumer: true
  readonly objectVerifiedAfterConsumer: true
  readonly readOnlySourcePresented: true
  readonly hostPathIncluded: false
  readonly mountAliasIncluded: false
}

export interface LivingFrameAuraFaceCpuRuntimeOutput {
  readonly embeddingDimension: 512
  readonly referenceFaceCount: 1
  readonly candidateFaceCount: 1
  readonly referenceInferenceOutputDigestSha256: string
  readonly candidateInferenceOutputDigestSha256: string
  readonly referenceEmbeddingDigestSha256: string
  readonly candidateEmbeddingDigestSha256: string
  readonly embeddingsIncluded: false
  readonly rawImagesIncluded: false
  readonly identityReferenceIncluded: false
  readonly thresholdApplied: false
  readonly identityOrLikenessApproved: false
  readonly continuityDecisionCreated: false
}

export interface LivingFrameAuraFaceCpuRuntimeReceipt {
  readonly contractVersion:
    typeof LIVING_FRAME_AURAFACE_CPU_RUNTIME_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_AURAFACE_CPU_RUNTIME_RECEIPT_CLASS
  readonly runtimeObservationId: string
  readonly evidenceClass:
    LivingFrameAuraFaceCpuRuntimeEvidenceClass
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly sourceBindings:
    LivingFrameAuraFaceCpuRuntimeSourceBindings & {
      readonly canonicalDispatchConsumptionResponseHash: string
      readonly executionAttemptId: string
      readonly approvedPlanSnapshotId: string
      readonly approvedWorkItemId: string
      readonly expectedAssetId: string
    }
  readonly operation: {
    readonly canonicalToolId: 'transformers'
    readonly operationId:
      'tool.transformers.measure_auraface_identity_continuity.v1'
    readonly separateCpuContinuityAttempt: true
    readonly excludedFromSharedComfyuiGpuAttempt: true
    readonly exactReuseAddsNoAttempt: true
  }
  readonly modelBindings:
    readonly [
      LivingFrameAuraFaceCpuRuntimeModelBindingObservation,
      LivingFrameAuraFaceCpuRuntimeModelBindingObservation,
    ]
  readonly inputObservation: {
    readonly referenceContentType: 'image/png' | 'image/jpeg'
    readonly candidateContentType: 'image/png' | 'image/jpeg'
    readonly referenceByteLength: number
    readonly candidateByteLength: number
    readonly referenceContentSha256: string
    readonly candidateContentSha256: string
    readonly inputBytesIncluded: false
    readonly callerBytesPathUrlOrCredentialAccepted: false
  }
  readonly hostObservation: {
    readonly terminalState:
      LivingFrameAuraFaceCpuRuntimeTerminalState
    readonly failureCode:
      LivingFrameAuraFaceCpuRuntimeFailureCode
    readonly faceOutcome:
      LivingFrameAuraFaceCpuRuntimeFaceOutcome
    readonly attemptAccepted: boolean
    readonly detectorInferenceExecuted: boolean
    readonly embeddingInferenceExecuted: boolean
    readonly startedAt: string
    readonly finishedAt: string
    readonly elapsedMilliseconds: number
  }
  readonly output?: LivingFrameAuraFaceCpuRuntimeOutput
  readonly outputLeaseIssued: boolean
  readonly outputArtifactPersisted: false
  readonly measurementPersisted: false
  readonly assetManifestUpdated: false
  readonly actualCostEvidenceCreated: false
  readonly customerChargeCreated: false
  readonly providerCallPerformed: false
  readonly externalNetworkPerformed: false
  readonly runtimeDownloadPerformed: false
  readonly callerEndpointAccepted: false
  readonly callerPathUrlCredentialCommandOrBytesAccepted: false
  readonly openGateCodes:
    readonly LivingFrameAuraFaceCpuRuntimeOpenGate[]
  readonly authorityBoundary:
    LivingFrameAuraFaceCpuRuntimeAuthority
  readonly subjectSpecificRouting: false
  readonly productionReady: false
  readonly runtimeObservationDigestSha256: string
}

export interface LivingFrameAuraFaceCpuEmbeddingOutputLease {
  readonly leaseClass:
    'process_bound_single_use_unpersisted_auraface_embedding_output_lease_v1'
  readonly leaseId: string
  readonly runtimeObservationDigestSha256: string
  readonly evidenceClass:
    LivingFrameAuraFaceCpuRuntimeEvidenceClass
  readonly artifactRequirementSetDigestSha256: string
  readonly referenceArtifactDigestSha256: string
  readonly candidateArtifactDigestSha256: string
  readonly referenceContinuityEntryDigestSha256: string
  readonly candidateContinuityEntryDigestSha256: string
  readonly preprocessingSpecDigestSha256: string
  readonly referenceInferenceOutputDigestSha256: string
  readonly candidateInferenceOutputDigestSha256: string
  readonly embeddingDimension: 512
  readonly callerSerializable: false
  readonly embeddingPersistenceAuthority: false
  readonly identityApprovalAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
}
