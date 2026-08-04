import type {
  CanonicalModelArtifactGpuBundle,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import type {
  CanonicalSam2GpuBundleRequirementProjection,
  CanonicalSam2ModelArtifactRequirementSet,
} from './canonical-sam2-model-artifact-requirement-types'

export const CANONICAL_SAM2_SUBJECT_PROMPT_PACKET_VERSION =
  'canonical-sam2-subject-prompt-packet-v1' as const
export const CANONICAL_SAM2_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION =
  'canonical-sam2-cloud-run-gpu-execution-admission-candidate-v1' as const

export interface CanonicalSam2NormalizedBoundingBox {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface CanonicalSam2NormalizedPointPrompt {
  readonly x: number
  readonly y: number
  readonly label: 'foreground' | 'background'
}

interface CanonicalSam2SubjectPromptPacketBase {
  readonly promptPacketVersion:
    typeof CANONICAL_SAM2_SUBJECT_PROMPT_PACKET_VERSION
  readonly promptPacketClass:
    'server_compiled_normalized_subject_selection'
  readonly subjectSelectionId: string
  readonly sourceArtifactId: string
  readonly sourceArtifactSha256: string
  readonly sourceFrameIndex: number
  readonly sourceFrameWidth: number
  readonly sourceFrameHeight: number
  readonly coordinateSpace: 'normalized_source_frame'
  readonly subjectCount: 1
  readonly approvedSubjectLabelIncluded: false
  readonly rawChatIncluded: false
  readonly rawMediaIncluded: false
  readonly promptDigestSha256: string
}

export interface CanonicalSam2BoxSubjectPromptPacket
  extends CanonicalSam2SubjectPromptPacketBase {
  readonly promptMode: 'box'
  readonly boundingBox: CanonicalSam2NormalizedBoundingBox
  readonly points: readonly []
}

export interface CanonicalSam2PointSubjectPromptPacket
  extends CanonicalSam2SubjectPromptPacketBase {
  readonly promptMode: 'points'
  readonly boundingBox: null
  readonly points: readonly CanonicalSam2NormalizedPointPrompt[]
}

export type CanonicalSam2SubjectPromptPacket =
  | CanonicalSam2BoxSubjectPromptPacket
  | CanonicalSam2PointSubjectPromptPacket

interface CanonicalSam2SubjectPromptPacketInputBase {
  readonly subjectSelectionId: string
  readonly sourceArtifactId: string
  readonly sourceArtifactSha256: string
  readonly sourceFrameIndex: number
  readonly sourceFrameWidth: number
  readonly sourceFrameHeight: number
}

export type CanonicalSam2SubjectPromptPacketInput =
  | (CanonicalSam2SubjectPromptPacketInputBase & {
      readonly promptMode: 'box'
      readonly boundingBox: CanonicalSam2NormalizedBoundingBox
    })
  | (CanonicalSam2SubjectPromptPacketInputBase & {
      readonly promptMode: 'points'
      readonly points: readonly CanonicalSam2NormalizedPointPrompt[]
    })

export interface CanonicalSam2SourceVideoExpectation {
  readonly artifactId: string
  readonly artifactKind: 'video'
  readonly contentType: 'video/mp4'
  readonly contentSha256: string
  readonly byteLength: number
  readonly width: number
  readonly height: number
  readonly frameCount: number
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly durationMilliseconds: number
  readonly dependencyQaEvaluationId: string
  readonly dependencyReconciliationId: string
  readonly sourceExpectationDigestSha256: string
}

export interface CanonicalSam2SourceVideoExpectationInput {
  readonly artifactId: string
  readonly contentSha256: string
  readonly byteLength: number
  readonly width: number
  readonly height: number
  readonly frameCount: number
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly durationMilliseconds: number
  readonly dependencyQaEvaluationId: string
  readonly dependencyReconciliationId: string
}

export interface CanonicalSam2OperationSettings {
  readonly confidenceThreshold: number
  readonly maximumSubjects: 1
  readonly frameStride: number
  readonly edgeRefinementProfileId?: string
  readonly preserveContactObjects: boolean
  readonly subjectPromptProfile:
    'normalized_box_or_points_v1'
  readonly subjectPromptSha256: string
}

export interface CanonicalSam2CloudRunGpuExecutionAdmissionCandidate {
  readonly admissionVersion:
    typeof CANONICAL_SAM2_CLOUD_RUN_GPU_EXECUTION_ADMISSION_VERSION
  readonly admissionClass:
    'controlled_non_executable_sam2_gpu_operation_preflight'
  readonly admissionId: string
  readonly identity: {
    readonly approvedToolId: 'sam2'
    readonly approvedOperationId:
      'tool.sam2.segment_and_track_subject.v1'
    readonly requirementSetDigestSha256: string
    readonly requirementProjectionDigestSha256: string
    readonly gpuBundleDigestSha256: string
    readonly gpuBundleRequirementsDigestSha256: string
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHash: string
    readonly workItemId: string
    readonly workItemHash: string
    readonly creditEstimateId: string
    readonly creditReservationId: string
    readonly workerLeaseId: string
    readonly idempotencyKey: string
    readonly operationRequestDigestSha256: string
  }
  readonly modelArtifactBinding: {
    readonly artifactCount: 1
    readonly slotId: 'sam2_checkpoint'
    readonly artifactRecordId: string
    readonly artifactId:
      'meta-sam2.1-hiera-small-checkpoint'
    readonly revision:
      'ee5bba1d82bb8749febdf90f45e84b687142ba03'
    readonly modelFamily: 'sam2.1-hiera-small'
    readonly byteLength: 184_416_285
    readonly contentSha256:
      '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38'
    readonly consumerScope: 'sam2.private-inference'
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly cloudRunAccelerator: 'nvidia_l4'
    readonly modelAccelerator: 'cuda'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly source: CanonicalSam2SourceVideoExpectation
  readonly subjectPromptArtifactBinding: {
    readonly artifactId: string
    readonly artifactKind: 'json_data'
    readonly contentType: 'application/json'
    readonly contentSha256: string
    readonly byteLength: number
    readonly canonicalJsonEncoding:
      'stable_authority_json_utf8_no_bom'
  }
  readonly subjectPrompt: CanonicalSam2SubjectPromptPacket
  readonly settings: CanonicalSam2OperationSettings
  readonly expectedOutputs: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'mask_sequence'
      readonly contentType: 'video/x-matroska'
      readonly encodingProfile:
        'gray8_ffv1_matroska_mask_sequence_v1'
      readonly frameCountMustMatchSource: true
      readonly dimensionsMustMatchSource: true
      readonly frameTimingMustMatchSource: true
      readonly privateArtifactRequired: true
    },
    {
      readonly canonicalOrder: 1
      readonly artifactKind: 'analysis_report'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'sam2_tracking_analysis_report_json_v1'
      readonly privateArtifactRequired: true
    },
    {
      readonly canonicalOrder: 2
      readonly artifactKind: 'qa_report'
      readonly contentType: 'application/json'
      readonly encodingProfile:
        'sam2_mask_qa_measurement_report_json_v1'
      readonly privateArtifactRequired: true
    },
  ]
  readonly requiredQaGates: readonly [
    'mask_edge_quality',
    'mask_temporal_stability',
    'mask_subject_coverage',
  ]
  readonly summary: {
    readonly exactModelArtifactIdentityMatched: true
    readonly exactCloudRunGpuAttemptIdentityMatched: true
    readonly exactPrivateSourceBindingMatched: true
    readonly exactStructuredSubjectPromptBindingMatched: true
    readonly exactOperationSettingsMatched: true
    readonly exactOutputAndQaContractDeclared: true
    readonly subjectCount: 1
    readonly sourceFrameCount: number
    readonly outputFrameCount: number
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly canonicalOperationArtifactSetVerified: false
    readonly freshRepositoryByteRehashRequired: true
    readonly approvedPackageRereadRequired: true
    readonly approvedSnapshotRereadRequired: true
    readonly workerLeaseRereadRequired: true
    readonly privateSourceArtifactReadVerified: false
    readonly privatePromptArtifactReadVerified: false
    readonly cloudRunReadOnlyModelMountVerified: false
    readonly cloudRunL4RuntimeImageVerified: false
    readonly cloudRunL4CudaBenchmarkVerified: false
    readonly sam2SourceInstallVerified: false
    readonly sam2CheckpointLoadVerified: false
    readonly sam2InferenceVerified: false
    readonly privateMaskOutputArtifactVerified: false
    readonly maskQaVerified: false
    readonly paidProductionOwnerApproval: false
    readonly callerBytesAccepted: false
    readonly callerPathAccepted: false
    readonly callerUrlAccepted: false
    readonly rawChatAccepted: false
    readonly arbitraryPromptAccepted: false
    readonly arbitraryModelAccepted: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly customerCostAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly admissionDigestSha256: string
}

export interface CanonicalSam2CloudRunGpuExecutionAdmissionCandidateInput {
  readonly requirementSet: CanonicalSam2ModelArtifactRequirementSet
  readonly requirementProjection:
    CanonicalSam2GpuBundleRequirementProjection
  readonly gpuBundle: CanonicalModelArtifactGpuBundle
  readonly source: CanonicalSam2SourceVideoExpectationInput
  readonly subjectPromptArtifactId: string
  readonly subjectPromptArtifactByteLength: number
  readonly subjectPrompt: CanonicalSam2SubjectPromptPacket
  readonly operationRequest: unknown
}

export interface CanonicalSam2CloudRunGpuExecutionAdmissionAssertionInput {
  readonly value: unknown
  readonly requirementSet: CanonicalSam2ModelArtifactRequirementSet
  readonly requirementProjection:
    CanonicalSam2GpuBundleRequirementProjection
  readonly gpuBundle: CanonicalModelArtifactGpuBundle
  readonly source: CanonicalSam2SourceVideoExpectationInput
  readonly operationRequest: unknown
}
