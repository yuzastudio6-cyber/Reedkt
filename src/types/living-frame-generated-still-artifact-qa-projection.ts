import type {
  LivingFrameAlphaFindingCode,
} from './living-frame-alpha-measurement'

export const
LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_VERSION =
  'living-frame-generated-still-artifact-qa-projection-v1' as const

export const
LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_CLASS =
  'controlled_non_promotable_generated_still_artifact_qa_projection' as const

export const
LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_STATE =
  'measured_alpha_ready_for_canonical_execution_admission' as const

export const
LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES = [
  'canonical_generated_still_work_item_required',
  'canonical_generated_still_source_variant_admission_required',
  'canonical_source_and_mask_artifact_reread_required',
  'canonical_worker_lease_and_sharp_execution_required',
  'canonical_private_image_artifact_persistence_required',
  'canonical_asset_received_and_quality_qa_required',
  'canonical_asset_manifest_reconciliation_required',
  'destination_composite_continuity_fact_and_private_review_required',
] as const

export type LivingFrameGeneratedStillArtifactQaOpenGate =
  (typeof
    LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES)[number]

export const
LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_ISSUE_CODES = [
  'input_invalid',
  'bridge_receipt_invalid',
  'rembg_runtime_receipt_invalid',
  'alpha_measurement_invalid',
  'bridge_measurement_lineage_mismatch',
  'blocking_alpha_finding_present',
  'dependency_projection_invalid',
  'canonical_execution_projection_invalid',
  'authority_promotion_forbidden',
  'unsafe_payload_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameGeneratedStillArtifactQaIssueCode =
  (typeof
    LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_ISSUE_CODES)[number]

export interface LivingFrameGeneratedStillArtifactDependencyProjection {
  readonly order: 0 | 1
  readonly role: 'opaque_generated_source' | 'verified_alpha_mask'
  readonly artifactId: string
  readonly contentSha256: string
  readonly expectedArtifactType:
    | 'living_frame_generated_opaque_still_png'
    | 'living_frame_alpha_mask_png'
  readonly contentType: 'image/png'
  readonly serverRereadRequired: true
  readonly qaReconciliationRequired: true
}

export interface LivingFrameGeneratedStillArtifactQaAuthorityBoundary {
  readonly structuralProjectionOnly: true
  readonly sourceTruthAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly serviceFeeAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly workerLeaseAuthority: false
  readonly queueAuthority: false
  readonly toolRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly artifactQaAuthority: false
  readonly assetManifestAuthority: false
  readonly continuityQaAuthority: false
  readonly documentaryFactAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameGeneratedStillArtifactQaProjectionDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_CLASS
  readonly projectionId: string
  readonly projectionState:
    typeof
      LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_PROJECTION_STATE
  readonly sourceBindings: {
    readonly bridgeObservationId: string
    readonly bridgeObservationDigestSha256: string
    readonly rembgRuntimeObservationDigestSha256: string
    readonly approvedPlanSnapshotId: string
    readonly expectedMaskAssetId: string
    readonly expectedAlphaComponentAssetId: string
    readonly alphaMeasurementReportDigestSha256: string
    readonly measuredRgbaDigestSha256: string
  }
  readonly dependencyProjection:
    readonly [
      LivingFrameGeneratedStillArtifactDependencyProjection,
      LivingFrameGeneratedStillArtifactDependencyProjection,
    ]
  readonly canonicalSharpExpectation: {
    readonly canonicalToolId: 'sharp'
    readonly operationId:
      'tool.sharp.prepare_approved_image_asset.v1'
    readonly imageRecipeId:
      'approved_living_frame_alpha_component_v1'
    readonly runnerClass:
      'offline_sharp_structured_execution_v1'
    readonly outputArtifactId: string
    readonly outputArtifactType:
      'living_frame_component_rgba_png'
    readonly outputContentType: 'image/png'
    readonly outputContentSha256: string
    readonly outputDecodedRgbaSha256: string
    readonly alphaMode: 'straight_alpha'
    readonly transparentRgbCleared: true
    readonly sourcePixelsUnmodified: true
    readonly canonicalDispatchRereadRequired: true
    readonly canonicalWorkerLeaseRequired: true
    readonly canonicalExecutionStillRequired: true
  }
  readonly canonicalQaExpectation: {
    readonly requiredGateIds:
      readonly ['asset_received_gate', 'asset_quality_gate']
    readonly alphaMeasurementFindingCodes:
      readonly LivingFrameAlphaFindingCode[]
    readonly onlyNonBlockingAlphaVariationFindingPresent: true
    readonly multiBackgroundMeasurementPresent: true
    readonly destinationCompositeMeasurementPresent: false
    readonly canonicalArtifactQaStillRequired: true
    readonly destinationCompositeQaStillRequired: true
  }
  readonly existingAuthorityReuse: {
    readonly canonicalWorkerLeaseAuthorityReused: true
    readonly canonicalPrivateImageArtifactStorageReused: true
    readonly canonicalPrivateArtifactQaAuthorityReused: true
    readonly canonicalAssetManifestReconciliationReused: true
    readonly canonicalPrivateReviewReused: true
    readonly duplicateTimingSystemCreated: false
    readonly duplicateWorkerSystemCreated: false
    readonly duplicateCreditSystemCreated: false
    readonly duplicateApprovalSystemCreated: false
    readonly duplicateQaSystemCreated: false
    readonly duplicateRendererCreated: false
  }
  readonly openGateCodes:
    readonly LivingFrameGeneratedStillArtifactQaOpenGate[]
  readonly authorityBoundary:
    LivingFrameGeneratedStillArtifactQaAuthorityBoundary
  readonly containsRawImageMaskOrAlphaBytes: false
  readonly containsPathUrlCredentialPromptOrCommand: false
  readonly artifactPersisted: false
  readonly artifactQaPassed: false
  readonly assetManifestUpdated: false
  readonly renderAuthorized: false
  readonly productionReady: false
}

export interface LivingFrameGeneratedStillArtifactQaProjection
  extends LivingFrameGeneratedStillArtifactQaProjectionDraft {
  readonly projectionDigestSha256: string
}

export interface LivingFrameGeneratedStillArtifactQaIssue {
  readonly code: LivingFrameGeneratedStillArtifactQaIssueCode
  readonly path: string
}
