export const LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_VERSION =
  'living-frame-control-image-workflow-binding-v3' as const

export const LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_CLASS =
  'controlled_non_promotable_control_image_workflow_binding' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_CONTROL_IMAGE_KINDS = [
  'canny',
  'depth',
  'pose',
] as const
export type LivingFrameControlImageKind =
  ValueOf<typeof LIVING_FRAME_CONTROL_IMAGE_KINDS>

export const LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_OPEN_GATES = [
  'control_image_input_evidence_binding_required',
  'canonical_control_image_artifact_creation_required',
  'canonical_control_image_artifact_qa_required',
  'canonical_asset_manifest_binding_required',
  'controlnet_checkpoint_resolution_required',
  'comfyui_runtime_artifact_resolution_required',
  'canonical_dispatch_admission_required',
] as const
export type LivingFrameControlImageWorkflowBindingOpenGate =
  ValueOf<typeof LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_OPEN_GATES>

export const LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_ISSUE_CODES = [
  'input_invalid',
  'unknown_key',
  'unsafe_input',
  'control_image_kind_invalid',
  'canny_report_invalid',
  'depth_report_invalid',
  'depth_verification_context_invalid',
  'pose_report_invalid',
  'pose_verification_context_invalid',
  'workflow_expectation_invalid',
  'controlnet_profile_required',
  'frame_mismatch',
  'control_image_binding_missing',
  'control_image_binding_duplicate',
  'control_image_digest_mismatch',
  'source_lineage_invalid',
  'binding_invalid',
  'gate_set_invalid',
  'authority_promotion_forbidden',
  'subject_specific_routing_forbidden',
  'digest_mismatch',
] as const
export type LivingFrameControlImageWorkflowBindingIssueCode =
  ValueOf<typeof LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_ISSUE_CODES>

export interface LivingFrameControlImageWorkflowBindingAuthorityBoundary {
  readonly controlledCrossContractBindingOnly: true
  readonly sourceAnalysisAuthority: false
  readonly poseDetectionAuthority: false
  readonly poseEvidenceAuthority: false
  readonly depthEstimationAuthority: false
  readonly depthEvidenceAuthority: false
  readonly semanticControlChoiceAuthority: false
  readonly selectedSceneAuthority: false
  readonly artifactCreationAuthority: false
  readonly artifactQaAuthority: false
  readonly assetManifestAuthority: false
  readonly modelWeightAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCannyControlImageSourceBinding {
  readonly controlImageKind: 'canny'
  readonly controlImageReportDigestSha256: string
  readonly sourceArtifactId: string
  readonly sourceArtifactDigestSha256: string
  readonly measuredSourceRgbaDigestSha256: string
}

export interface LivingFramePoseControlImageSourceBinding {
  readonly controlImageKind: 'pose'
  readonly controlImageReportDigestSha256: string
  readonly sourceArtifactId: string
  readonly sourceArtifactDigestSha256: string
  readonly poseLandmarkPacketId: string
  readonly poseLandmarkPacketDigestSha256: string
  readonly poseLandmarkSchema: 'coco17'
}

export interface LivingFrameDepthControlImageSourceBinding {
  readonly controlImageKind: 'depth'
  readonly controlImageReportDigestSha256: string
  readonly sourceArtifactId: string
  readonly sourceArtifactDigestSha256: string
  readonly depthSamplePacketId: string
  readonly depthSamplePacketDigestSha256: string
  readonly depthSampleEncoding: 'uint16_big_endian_digest'
  readonly depthPolarity: 'larger_value_is_nearer'
}

export type LivingFrameControlImageSourceBinding =
  | LivingFrameCannyControlImageSourceBinding
  | LivingFrameDepthControlImageSourceBinding
  | LivingFramePoseControlImageSourceBinding

export interface LivingFrameControlImageWorkflowBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_CLASS
  readonly bindingId: string
  readonly sourceBindings: {
    readonly controlImage: LivingFrameControlImageSourceBinding
    readonly measuredControlImageRgbaDigestSha256: string
    readonly workflowExpectationId: string
    readonly workflowExpectationDigestSha256: string
  }
  readonly frameExpectation: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly controlImageAndWorkflowFramesMatch: true
    readonly exactOutputFrameRevalidationRequired: true
  }
  readonly controlImageBinding: {
    readonly bindingExpectationId: string
    readonly targetNodeId: string
    readonly targetPort: 'image'
    readonly bindingDigestMatchesMeasuredPixels: true
    readonly contentAddressedArtifactExpected: true
    readonly canonicalArtifactIdPresent: false
    readonly artifactResolved: false
    readonly artifactQaPassed: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlImageWorkflowBindingOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlImageWorkflowBindingAuthorityBoundary
  readonly parentContractsRevalidationRequired: true
  readonly rawPixelsPresent: false
  readonly rawLandmarksPresent: false
  readonly filePathOrUrlPresent: false
  readonly providerOrToolIdentifierPresent: false
  readonly workOrQueueIdentifierPresent: false
  readonly executableWorkflowPresent: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlImageWorkflowBinding
  extends LivingFrameControlImageWorkflowBindingDraft {
  readonly bindingDigestSha256: string
}

export interface LivingFrameControlImageWorkflowBindingIssue {
  readonly code: LivingFrameControlImageWorkflowBindingIssueCode
  readonly path: string
}

export type LivingFrameControlImageWorkflowBindingValidationResult =
  | {
      readonly ok: true
      readonly binding: LivingFrameControlImageWorkflowBinding
    }
  | {
      readonly ok: false
      readonly issues:
        readonly LivingFrameControlImageWorkflowBindingIssue[]
    }
