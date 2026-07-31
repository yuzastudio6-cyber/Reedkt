export const LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_VERSION =
  'living-frame-articulated-puppet-sheet-internal-test-v1' as const

export const LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_CLASS =
  'private_internal_reviewed_articulated_puppet_sheet' as const

export const LIVING_FRAME_ARTICULATED_PUPPET_PART_ROLES = [
  'static_body',
  'head',
  'upper_arm',
  'forearm',
  'hand',
  'prop',
  'hair_follow',
  'coat_follow',
] as const

export type LivingFrameArticulatedPuppetPartRole =
  (typeof LIVING_FRAME_ARTICULATED_PUPPET_PART_ROLES)[number]

export interface LivingFrameArticulatedPuppetPixelRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface LivingFrameArticulatedPuppetPixelPoint {
  readonly x: number
  readonly y: number
}

export interface LivingFrameArticulatedPuppetNormalizedRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly depth: number
}

export interface LivingFrameArticulatedPuppetPart {
  readonly order: number
  readonly partId: string
  readonly role: LivingFrameArticulatedPuppetPartRole
  readonly sourceRectPixels:
    LivingFrameArticulatedPuppetPixelRect
  readonly sourcePivotPixels:
    LivingFrameArticulatedPuppetPixelPoint
  readonly destinationRectNormalized:
    LivingFrameArticulatedPuppetNormalizedRect
  readonly assignedBoneId: string
  readonly rigidWeight: 1
  readonly isolatedOnUniformChroma: true
  readonly hiddenJointOverlapArtworkPresent: boolean
  readonly manualRegionAndPivotReviewCompleted: true
}

export interface LivingFrameArticulatedPuppetSheetReceiptDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_VERSION
  readonly receiptClass:
    typeof LIVING_FRAME_ARTICULATED_PUPPET_SHEET_INTERNAL_TEST_CLASS
  readonly sourceArtifact: {
    readonly artifactId:
      'lf.airship-navigator.articulated-puppet-sheet.v1'
    readonly contentType: 'image/png'
    readonly widthPixels: 1_536
    readonly heightPixels: 1_024
    readonly byteLength: 1_960_401
    readonly sha256:
      '0a6d52335e32614d57a79ea4f93da81a3a325363aea319d21895cfcddde90b37'
    readonly generationProvenance:
      'openai_imagegen_generated_private_fixture'
    readonly generatedIllustration: true
    readonly illustrativeNotArchivalEvidence: true
    readonly fictionalCharacter: true
  }
  readonly decompositionProfile:
    'fixture_specific_reviewed_eight_part_chroma_atlas_v1'
  readonly topology:
    'separated_articulated_limb_parts'
  readonly expectedPartCount: 8
  readonly parts:
    readonly LivingFrameArticulatedPuppetPart[]
  readonly alphaPreparation: {
    readonly profile:
      'green_chroma_to_straight_alpha_with_edge_decontamination_v1'
    readonly sourceBackgroundRgb:
      readonly [0, 255, 0]
    readonly straightAlphaRequired: true
    readonly edgeDecontaminationRequired: true
    readonly sourceBytesMayReachRigAdapter: false
    readonly preparedAlphaAtlasOnly: true
  }
  readonly professionalReadiness: {
    readonly completeBodyAnchorPresent: true
    readonly headAndNeckSocketSeparated: true
    readonly upperArmSeparated: true
    readonly forearmSeparated: true
    readonly handSeparated: true
    readonly propSeparated: true
    readonly exactJointPivotsReviewed: true
    readonly hiddenJointArtworkReconstructed: true
    readonly protectedFaceMotionPathRequiresRenderedQa: true
    readonly attachmentContinuityRequiresRenderedQa: true
    readonly genericWholeImageDeformationForbidden: true
    readonly controlledGenerationCreatesAnchorPosesNotEveryFrame:
      true
  }
  readonly authorityBoundary: {
    readonly privateInternalFixtureEvidenceOnly: true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly masterTimingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetPersistenceAuthority: false
    readonly assetManifestAuthority: false
    readonly qaApprovalAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly finalCanvasAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
    readonly remotionOwnsFinalCanvas: true
  }
  readonly containsRawChatPathUrlCredentialCommandEnvironmentOrMediaBytes:
    false
}

export interface LivingFrameArticulatedPuppetSheetReceipt
  extends LivingFrameArticulatedPuppetSheetReceiptDraft {
  readonly receiptDigestSha256: string
}
