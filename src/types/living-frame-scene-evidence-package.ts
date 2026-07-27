import type {
  LivingFrameAlphaEdgeDecontaminationFindingCode,
  LivingFrameAlphaEdgeDecontaminationReport,
} from './living-frame-alpha-edge-decontamination'
import type {
  LivingFrameAlphaFindingCode,
  LivingFrameAlphaMeasurementReport,
} from './living-frame-alpha-measurement'
import type {
  LivingFrameTemporalMaskFindingCode,
  LivingFrameTemporalMaskMeasurementReport,
} from './living-frame-temporal-mask-measurement'
import type {
  LivingFrameVisualContinuityFindingCode,
  LivingFrameVisualContinuityMeasurementReport,
} from './living-frame-visual-continuity-measurement'

export const LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_VERSION =
  'living-frame-scene-evidence-package-v1' as const

export const LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_PROFILE =
  'component_measurement_lineage_binding_v1' as const

export const LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_CLASS =
  'controlled_non_promotable_scene_evidence_package' as const

export const LIVING_FRAME_SCENE_ARTIFACT_KINDS = [
  'opaque_raster',
  'still_rgba',
  'source_a_roll',
  'procedural_alpha_primitive',
  'additive_effect_primitive',
] as const
export type LivingFrameSceneArtifactKind =
  (typeof LIVING_FRAME_SCENE_ARTIFACT_KINDS)[number]

export const LIVING_FRAME_SCENE_CONTINUITY_EXPECTATIONS = [
  'required',
  'not_applicable',
] as const
export type LivingFrameSceneContinuityExpectation =
  (typeof LIVING_FRAME_SCENE_CONTINUITY_EXPECTATIONS)[number]

export const LIVING_FRAME_SCENE_EVIDENCE_STATES = [
  'evidence_bound_pending_canonical_qa',
  'blocked_by_measurement_findings',
  'blocked_by_unresolved_primitive_qa',
] as const
export type LivingFrameSceneEvidenceState =
  (typeof LIVING_FRAME_SCENE_EVIDENCE_STATES)[number]

export const LIVING_FRAME_SCENE_EVIDENCE_BLOCKER_CODES = [
  'alpha_measurement_findings_block',
  'temporal_mask_measurement_findings_block',
  'alpha_decontamination_findings_block',
  'visual_continuity_measurement_findings_block',
  'procedural_alpha_qa_required',
  'additive_effect_qa_required',
  'depth_transition_compilation_required',
  'canonical_artifact_qa_required',
  'canonical_snapshot_revalidation_required',
] as const
export type LivingFrameSceneEvidenceBlockerCode =
  (typeof LIVING_FRAME_SCENE_EVIDENCE_BLOCKER_CODES)[number]

export interface LivingFrameSceneArtifactRef {
  readonly artifactId: string
  readonly artifactDigestSha256: string
}

export interface LivingFrameScenePrimitiveQaExpectationRef {
  readonly refId: string
  readonly version: string
  readonly digestSha256: string
  readonly currentCanonicalQaRevalidationRequired: true
}

export interface LivingFrameSceneComponentEvidenceInput {
  readonly componentId: string
  readonly artifactKind: LivingFrameSceneArtifactKind
  readonly artifact: LivingFrameSceneArtifactRef
  readonly maskArtifact: LivingFrameSceneArtifactRef | null
  readonly continuityExpectation: LivingFrameSceneContinuityExpectation
  readonly continuityReferenceArtifact: LivingFrameSceneArtifactRef | null
  readonly alphaMeasurementReport: LivingFrameAlphaMeasurementReport | null
  readonly temporalMaskMeasurementReport:
    LivingFrameTemporalMaskMeasurementReport | null
  readonly alphaEdgeDecontaminationReport:
    LivingFrameAlphaEdgeDecontaminationReport | null
  readonly visualContinuityMeasurementReport:
    LivingFrameVisualContinuityMeasurementReport | null
  readonly primitiveQaExpectationRef:
    LivingFrameScenePrimitiveQaExpectationRef | null
}

export interface LivingFrameSceneComponentEvidenceBinding {
  readonly componentId: string
  readonly order: number
  readonly artifactKind: LivingFrameSceneArtifactKind
  readonly artifact: LivingFrameSceneArtifactRef
  readonly maskArtifact: LivingFrameSceneArtifactRef | null
  readonly continuityExpectation: LivingFrameSceneContinuityExpectation
  readonly continuityReferenceArtifact: LivingFrameSceneArtifactRef | null
  readonly alphaMeasurementReportDigestSha256: string | null
  readonly temporalMaskMeasurementReportDigestSha256: string | null
  readonly alphaEdgeDecontaminationReportDigestSha256: string | null
  readonly visualContinuityMeasurementReportDigestSha256: string | null
  readonly alphaFindingCodes: readonly LivingFrameAlphaFindingCode[]
  readonly temporalMaskFindingCodes:
    readonly LivingFrameTemporalMaskFindingCode[]
  readonly alphaEdgeDecontaminationFindingCodes:
    readonly LivingFrameAlphaEdgeDecontaminationFindingCode[]
  readonly visualContinuityFindingCodes:
    readonly LivingFrameVisualContinuityFindingCode[]
  readonly primitiveQaExpectationRef:
    LivingFrameScenePrimitiveQaExpectationRef | null
  readonly componentBlockerCodes:
    readonly LivingFrameSceneEvidenceBlockerCode[]
}

export interface LivingFrameSceneEvidencePackageMetrics {
  readonly visualComponentCount: number
  readonly componentEvidenceBindingCount: number
  readonly opaqueArtifactCount: number
  readonly stillAlphaArtifactCount: number
  readonly temporalMaskArtifactCount: number
  readonly proceduralPrimitiveCount: number
  readonly additivePrimitiveCount: number
  readonly continuityMeasurementCount: number
  readonly alphaMeasurementCount: number
  readonly temporalMaskMeasurementCount: number
  readonly decontaminationMeasurementCount: number
  readonly blockedComponentCount: number
  readonly unresolvedDepthTransitionCount: number
}

export interface LivingFrameSceneEvidencePackageAuthorityBoundary {
  readonly structuralEvidenceBindingOnly: true
  readonly selectedSceneAuthority: false
  readonly sourceTruthAuthority: false
  readonly identityVerificationAuthority: false
  readonly likenessSafetyAuthority: false
  readonly documentaryFactAuthority: false
  readonly artifactQaAuthority: false
  readonly continuityQaAuthority: false
  readonly alphaQaAuthority: false
  readonly temporalMaskQaAuthority: false
  readonly fallbackAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly renderExecutionAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSceneEvidencePackageDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_VERSION
  readonly bindingProfile:
    typeof LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_PROFILE
  readonly evidenceClass:
    typeof LIVING_FRAME_SCENE_EVIDENCE_PACKAGE_CLASS
  readonly sceneId: string
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly motionBundleDigestSha256: string
  readonly componentGeometryBundleDigestSha256: string
  readonly componentEvidenceBindings:
    readonly LivingFrameSceneComponentEvidenceBinding[]
  readonly packageState: LivingFrameSceneEvidenceState
  readonly packageBlockerCodes:
    readonly LivingFrameSceneEvidenceBlockerCode[]
  readonly metrics: LivingFrameSceneEvidencePackageMetrics
  readonly authorityBoundary:
    LivingFrameSceneEvidencePackageAuthorityBoundary
  readonly containsRawMediaOrMaskBytes: false
  readonly containsPathUrlCredentialOrInstruction: false
  readonly containsProviderToolWorkOrAssetManifestRoute: false
  readonly currentEvidenceReReadStillRequired: true
  readonly canonicalArtifactQaStillRequired: true
  readonly approvedSnapshotProjectionStillRequired: true
}

export interface LivingFrameSceneEvidencePackage
  extends LivingFrameSceneEvidencePackageDraft {
  readonly packageDigestSha256: string
}
