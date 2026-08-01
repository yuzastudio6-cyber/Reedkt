import type {
  LivingFrameNonCharacterProfessionalCheckId,
} from './living-frame-non-character-professional-review'

export const LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_REQUEST_VERSION =
  'living-frame-postrender-visual-inspection-request-v1' as const

export const LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_RESULT_VERSION =
  'living-frame-postrender-visual-inspection-result-v1' as const

export const LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_CHECKLIST_VERSION =
  'living-frame-postrender-visual-inspection-checklist-v1' as const

export const LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_CLASS =
  'server_derived_living_frame_postrender_qwen_visual_evidence_request_candidate' as const

export const LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_OPEN_GATES = [
  'canonical_postrender_visual_qa_work_item_projection_required',
  'qwen_postrender_video_and_complete_time_coverage_adapter_required',
  'canonical_provider_queue_lease_attempt_and_cost_evidence_required',
  'create_only_private_result_persistence_qa_and_reconciliation_required',
  'separate_audio_speech_sfx_music_and_ducking_evidence_required',
  'kimi_primary_terra_fallback_head_qa_recommendation_required',
  'canonical_private_review_assembly_dependency_required',
] as const

export type LivingFramePostrenderVisualInspectionOpenGate =
  typeof LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_OPEN_GATES[number]

export type LivingFramePostrenderPhaseSampleRole =
  | 'entry'
  | 'peak'
  | 'hold'
  | 'settle'
  | 'exit'

export type LivingFramePostrenderCoverageWindowKind =
  | 'complete_timeline_chunk'
  | 'scene'
  | 'transition'
  | 'boundary'

export interface LivingFramePostrenderFrameRange {
  readonly startFrame: number
  readonly endFrameExclusive: number
}

export interface LivingFramePostrenderPhaseSample {
  readonly order: number
  readonly role: LivingFramePostrenderPhaseSampleRole
  readonly sampleId: string
  readonly qwenPlanSampleId: string
  readonly frame: number
  readonly frameChecksumSha256: string
}

export interface LivingFramePostrenderCoverageWindow
  extends LivingFramePostrenderFrameRange {
  readonly order: number
  readonly windowId: string
  readonly kind: LivingFramePostrenderCoverageWindowKind
  readonly selectedSceneId: string
  readonly required: true
  readonly sampleIds: readonly string[]
}

export interface LivingFramePostrenderCompleteCoverageManifest {
  readonly coverageManifestId: string
  readonly coverageMode:
    | 'model_video_temporal_windows'
    | 'deterministic_dense_frame_batches'
  readonly frameCount: number
  readonly completeTimelineWindows:
    readonly LivingFramePostrenderCoverageWindow[]
  readonly sceneWindows:
    readonly LivingFramePostrenderCoverageWindow[]
  readonly transitionWindows:
    readonly LivingFramePostrenderCoverageWindow[]
  readonly boundaryWindows:
    readonly LivingFramePostrenderCoverageWindow[]
  readonly transitionPresent: boolean
  readonly phaseSamples:
    readonly LivingFramePostrenderPhaseSample[]
  readonly coveredFrameCount: number
  readonly startsAtFrameZero: true
  readonly endsAtFinalFrame: true
  readonly noTimelineGap: true
  readonly noTimelineOverlap: true
  readonly completeTimeCoverageProofRequired: true
  readonly coverageDigestSha256: string
}

export interface LivingFramePostrenderVisualInspectionRequestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_REQUEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_CLASS
  readonly requestState:
    'exact_private_postrender_visual_evidence_request_compiled_canonical_admission_pending'
  readonly requestId: string
  readonly scope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly executionPackageId: string
    readonly approvedWorkItemId: string
    readonly idempotencyKey: string
  }
  readonly sourceBindings: {
    readonly ownerScopeAmendmentVersion:
      'living-frame-owner-scope-amendment-v1'
    readonly ownerScopeAmendmentDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly rendererBindingDigestSha256: string
    readonly rendererLayerManifestDigestSha256: string
    readonly visualOccupancyDigestSha256: string
    readonly captionDirectionDigestSha256: string
    readonly soundSyncDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
  }
  readonly finalRender: {
    readonly artifactId: string
    readonly expectedAssetId: string
    readonly privateObjectIdentityHash: string
    readonly sha256: string
    readonly byteLength: number
    readonly contentType: 'video/mp4'
    readonly widthPixels: number
    readonly heightPixels: number
    readonly frameRateNumerator: number
    readonly frameRateDenominator: number
    readonly frameCount: number
    readonly durationFrames: number
    readonly privateArtifact: true
    readonly finalCanvasOwnedByRemotion: true
  }
  readonly deterministicFinalQa: {
    readonly workItemId: string
    readonly artifactId: string
    readonly evidenceHashSha256: string
    readonly ffprobeOperation:
      'tool.ffprobe.inspect_approved_media.v1'
    readonly passed: true
  }
  readonly qwenAuthority: {
    readonly existingPlanContractVersion:
      'private-gcp-qwen25vl-visual-understanding-v1'
    readonly existingEvidencePackageSchemaVersion:
      'private-gcp-qwen25vl-evidence-package-v1'
    readonly existingEvidenceVerifier:
      'verifyPrivateGcpVisualEvidencePackage'
    readonly existingEvidencePackageCanProveProviderCall: false
    readonly existingPlanHashSha256: string
    readonly phase: 'postrender_private_visual_qa'
    readonly analysisRunId: string
    readonly attemptId: string
    readonly modelRoleId:
      'qwen2_5_vl_visual_understanding'
    readonly modelId: 'qwen2.5-vl-7b-instruct'
    readonly providerBoundary:
      'qwen2_5_vl_7b_instruct_provider_boundary'
    readonly checkpointSha256: string
    readonly containerImageDigest: string
    readonly qwenProducesVisualEvidenceOnly: true
    readonly qwenMayApproveEdit: false
    readonly qwenMaySetCreativeDirection: false
    readonly qwenMayClaimAudioOrTranscriptAuthority: false
  }
  readonly coverage:
    LivingFramePostrenderCompleteCoverageManifest
  readonly orderedCheckIds:
    readonly LivingFrameNonCharacterProfessionalCheckId[]
  readonly resultRequirements: {
    readonly exactRequestPlanArtifactSnapshotAndSceneBinding: true
    readonly exactCoveredWindowSampleAndTimeRangeEvidence: true
    readonly oneDispositionAndGroundedObservationPerOrderedCheck: true
    readonly confidenceUncertaintyAndEvidenceFramesPerObservation: true
    readonly visualRisksAndRepairTargets: true
    readonly unsupportedClaimCountMustBeZero: true
    readonly deterministicCoverageAndIntegrityVerification: true
    readonly checkpointImageRuntimeLeaseAttemptAndCostProvenance: true
    readonly audioOrTranscriptAuthorityClaimedMustBeFalse: true
    readonly noRawPathsUrlsPromptsBytesCredentialsCommandsOrEnvironment: true
  }
  readonly headQaPolicy: {
    readonly primaryModelRoleId: 'kimi_k3_main_edit_agent'
    readonly fallbackModelRoleId:
      'gpt_5_6_terra_fallback_edit_agent'
    readonly fallbackOnlyAfterAllowedClassifiedPrimaryFailure: true
    readonly exactImmutableEvidencePackageRequired: true
    readonly verifiedQwenVisualEvidenceRequired: true
    readonly separateVerifiedDeterministicAndAudioEvidenceRequired: true
    readonly recommendationOnly:
      readonly ['accept', 'repair', 'reject']
    readonly modelRecommendationMayReplaceCanonicalApproval: false
    readonly modelRecommendationMayReplaceUserPrivateReview: false
  }
  readonly activeScope: {
    readonly nonCharacterOnly: true
    readonly animatedLivingOrOrganicSubjectAllowed: false
    readonly completeCharacterKeyposeOrInterpolationAllowed: false
    readonly livingSubjectRiggingAllowed: false
    readonly mechanicalRiggingAllowed: false
    readonly staticIllustrationMayRemainUnanimated: true
  }
  readonly currentProviderAdapterSupportsThisRequest: false
  readonly currentExistingEvidencePackageCanProveActualProviderCall: false
  readonly callerInspectionAssertionsMaySatisfyProfessionalReview: false
  readonly canonicalAdmissionRequired: true
  readonly openGateCodes:
    readonly LivingFramePostrenderVisualInspectionOpenGate[]
  readonly authorityBoundary: {
    readonly requestCandidateAuthority: true
    readonly providerSelectionAuthority: false
    readonly providerCallAuthority: false
    readonly workGraphAuthority: false
    readonly queueAuthority: false
    readonly leaseAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly costAuthority: false
    readonly artifactAuthority: false
    readonly artifactQaAuthority: false
    readonly reconciliationAuthority: false
    readonly professionalReviewAcceptanceAuthority: false
    readonly canonicalQaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly resultArtifactCreated: false
  readonly professionalVisualAcceptancePassed: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFramePostrenderVisualInspectionRequest
  extends LivingFramePostrenderVisualInspectionRequestDraft {
  readonly requestDigestSha256: string
}

export type LivingFramePostrenderCheckDisposition =
  | 'pass'
  | 'repair_required'
  | 'required_review'

export interface LivingFramePostrenderGroundedObservation
  extends LivingFramePostrenderFrameRange {
  readonly observationId: string
  readonly summary: string
  readonly confidenceBasisPoints: number
  readonly uncertainty:
    | 'none'
    | 'low'
    | 'material'
  readonly evidenceSampleIds: readonly string[]
}

export interface LivingFramePostrenderCheckResult {
  readonly order: number
  readonly checkId:
    LivingFrameNonCharacterProfessionalCheckId
  readonly disposition:
    LivingFramePostrenderCheckDisposition
  readonly observations:
    readonly LivingFramePostrenderGroundedObservation[]
}

export interface LivingFramePostrenderVisualInspectionProviderResultDraft {
  readonly schemaVersion:
    typeof LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_RESULT_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly existingQwenPlanHashSha256: string
  readonly scope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly approvedSnapshotId: string
    readonly approvedWorkItemId: string
  }
  readonly artifactBinding: {
    readonly artifactId: string
    readonly privateObjectIdentityHash: string
    readonly sha256: string
  }
  readonly providerExecutionClaim: {
    readonly modelRoleId:
      'qwen2_5_vl_visual_understanding'
    readonly modelId: 'qwen2.5-vl-7b-instruct'
    readonly providerBoundary:
      'qwen2_5_vl_7b_instruct_provider_boundary'
    readonly checkpointSha256: string
    readonly containerImageDigest: string
    readonly runtimeEvidenceDigestSha256: string
    readonly dispatchReceiptDigestSha256: string
    readonly oneUseLeaseReceiptDigestSha256: string
    readonly attemptReceiptDigestSha256: string
    readonly attemptCostEvidenceDigestSha256: string
    readonly providerCallClaimed: true
    readonly oneProviderAttemptClaimed: true
  }
  readonly coverageResult: {
    readonly requestCoverageDigestSha256: string
    readonly coveredWindowIds: readonly string[]
    readonly coveredSampleIds: readonly string[]
    readonly coveredFrameCount: number
    readonly completeTimelineCovered: true
    readonly deterministicCoverageIntegrityPassed: true
  }
  readonly checks:
    readonly LivingFramePostrenderCheckResult[]
  readonly visualRiskIds: readonly string[]
  readonly repairTargetIds: readonly string[]
  readonly unsupportedClaimCount: 0
  readonly audioOrTranscriptAuthorityClaimed: false
  readonly rawFramePersisted: false
  readonly containsRawPathsUrlsPromptsBytesCredentialsCommandsOrEnvironment:
    false
}

export interface LivingFramePostrenderVisualInspectionProviderResult
  extends LivingFramePostrenderVisualInspectionProviderResultDraft {
  readonly resultDigestSha256: string
}

export interface LivingFramePostrenderVisualInspectionChecklist {
  readonly contractVersion:
    typeof LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_CHECKLIST_VERSION
  readonly requestDigestSha256: string
  readonly resultDigestSha256: string
  readonly structuralResultVerified: true
  readonly exactRequestArtifactCoverageAndCheckBindingVerified: true
  readonly providerExecutionClaimIsNotCanonicalEvidence: true
  readonly canonicalQueueLeaseAttemptAndCostRereadRequired: true
  readonly canonicalCreateOnlyPersistenceQaAndReconciliationRequired: true
  readonly canonicalEvidenceMustPassExistingGeneralVerifierOrVersionedSuccessor:
    true
  readonly separateAudioEvidenceRequired: boolean
  readonly headQaRecommendationRequired: true
  readonly existingProfessionalReviewV1CallerAssertionMayApprove: false
  readonly eligibleForCanonicalAdmissionReview: true
  readonly professionalReviewInputReady: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly productionReady: false
  readonly checklistDigestSha256: string
}
