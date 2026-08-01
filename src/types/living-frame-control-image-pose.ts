export const LIVING_FRAME_CONTROL_IMAGE_POSE_VERSION =
  'living-frame-control-image-pose-v1' as const

export const LIVING_FRAME_CONTROL_IMAGE_POSE_CLASS =
  'controlled_deterministic_pose_control_image_reference' as const

export const LIVING_FRAME_CONTROL_IMAGE_POSE_PROFILE =
  'coco17_openpose_style_opaque_rgba_v1' as const

export const LIVING_FRAME_POSE_KEYPOINTS = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const
export type LivingFramePoseKeypoint =
  (typeof LIVING_FRAME_POSE_KEYPOINTS)[number]

export interface LivingFramePoseLandmark {
  readonly keypoint: LivingFramePoseKeypoint
  readonly xNormalized: number
  readonly yNormalized: number
  readonly confidence: number
}

export interface LivingFramePosePerson {
  readonly personId: string
  readonly order: number
  readonly keypoints: readonly LivingFramePoseLandmark[]
}

export interface LivingFrameControlImagePoseMetrics {
  readonly pixelCount: number
  readonly personCount: number
  readonly keypointCount: number
  readonly visibleKeypointCount: number
  readonly renderedLimbCount: number
  readonly nonBackgroundPixelCount: number
  readonly nonBackgroundCoverageRatio: number
}

export interface LivingFrameControlImagePoseAuthorityBoundary {
  readonly deterministicReferencePixelProcessingOnly: true
  readonly poseDetectionAuthority: false
  readonly poseEvidenceAuthority: false
  readonly sourceAnalysisAuthority: false
  readonly semanticControlChoiceAuthority: false
  readonly selectedSceneAuthority: false
  readonly artifactCreationAuthority: false
  readonly artifactCommitmentAuthority: false
  readonly artifactQaAuthority: false
  readonly assetManifestAuthority: false
  readonly modelWeightAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
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
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlImagePoseReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROL_IMAGE_POSE_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROL_IMAGE_POSE_CLASS
  readonly algorithmProfile:
    typeof LIVING_FRAME_CONTROL_IMAGE_POSE_PROFILE
  readonly sourceArtifact: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
  }
  readonly poseLandmarkPacket: {
    readonly packetId: string
    readonly measuredPacketDigestSha256: string
    readonly coordinateSystem: 'normalized_output_frame_xy'
    readonly keypointSchema: 'coco17'
  }
  readonly outputRaster: {
    readonly width: number
    readonly height: number
    readonly pixelFormat: 'rgba8'
    readonly alphaMode: 'opaque'
    readonly measuredOutputRgbaDigestSha256: string
  }
  readonly processingContract: {
    readonly minimumConfidence: number
    readonly coordinateQuantization:
      'round_normalized_to_nearest_output_pixel'
    readonly lineRasterization: 'integer_bresenham_with_disc_brush'
    readonly lineWidthPixels: number
    readonly jointRadiusPixels: number
    readonly backgroundRgba:
      readonly [0, 0, 0, 255]
    readonly colorPaletteProfile: 'openpose_style_fixed_rgb_v1'
    readonly limbTopology: 'coco17_fixed_topology_v1'
  }
  readonly metrics: LivingFrameControlImagePoseMetrics
  readonly authorityBoundary:
    LivingFrameControlImagePoseAuthorityBoundary
  readonly outputPixelsReturnedOutOfBand: true
  readonly inputLandmarkCoordinatesRetained: false
  readonly reportContainsRawLandmarksOrPixels: false
  readonly reportContainsPathOrUrl: false
  readonly reportContainsCredentialsOrRawInstructions: false
  readonly poseControlImageArtifactCreated: false
  readonly passesCanonicalQa: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlImagePoseReport
  extends LivingFrameControlImagePoseReportDraft {
  readonly reportDigestSha256: string
}
