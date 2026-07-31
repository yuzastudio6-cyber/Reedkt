import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameActiveNonIllustrationScope,
} from './living-frame-owner-scope-amendment'

export const LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_ADMISSION_VERSION =
  'living-frame-active-non-illustration-evidence-admission-v1' as const

export const LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_ADMISSION_CLASS =
  'byte_free_non_executable_structural_evidence_admission_candidate' as const

export interface LivingFrameActiveEvidenceDigestRef {
  readonly refId: string
  readonly refVersion: string
  readonly digestSha256: string
  readonly canonicalRereadRequired: true
}

export interface LivingFrameActiveEvidenceCaseIdentity {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly approvedSnapshotId: string
  readonly executionPackageId: string
  readonly sceneId: string
  readonly approvedWorkItemId: string
  readonly outputKey: string
  readonly expectedAssetId: string
}

export interface LivingFrameActiveEvidenceCanonicalPlanBindings {
  readonly approvedSnapshot:
    LivingFrameActiveEvidenceDigestRef & {
      readonly refVersion:
        'private-edit-authority-approved-snapshot-v3'
    }
  readonly executionPackage:
    LivingFrameActiveEvidenceDigestRef & {
      readonly refVersion:
        'canonical-approved-edit-execution-package-v5'
    }
  readonly selectedScene:
    LivingFrameActiveEvidenceDigestRef
  readonly masterTiming:
    LivingFrameActiveEvidenceDigestRef
  readonly confirmedOutputFrame:
    LivingFrameActiveEvidenceDigestRef
  readonly approvedWorkItem:
    LivingFrameActiveEvidenceDigestRef
  readonly approvedOutput:
    LivingFrameActiveEvidenceDigestRef
  readonly assetManifest:
    LivingFrameActiveEvidenceDigestRef
  readonly assetManifestEntry:
    LivingFrameActiveEvidenceDigestRef
  readonly rendererBinding:
    LivingFrameActiveEvidenceDigestRef
}

export interface LivingFrameActiveEvidenceFinalRemotionArtifact {
  readonly artifactId: string
  readonly artifactVersion: number
  readonly approvedWorkItemId: string
  readonly outputKey: string
  readonly expectedAssetId: string
  readonly privateObjectIdentityHash: string
  readonly sha256: string
  readonly contentType: 'video/mp4'
  readonly privateArtifact: true
  readonly finalCanvasOwnedByRemotion: true
}

export interface LivingFrameActiveEvidenceVisualDependencies {
  readonly postrenderRequest:
    LivingFrameActiveEvidenceDigestRef
  readonly qwenProviderLifecycle:
    LivingFrameActiveEvidenceDigestRef
  readonly postrenderResult:
    LivingFrameActiveEvidenceDigestRef
  readonly completeTimeCoverage:
    LivingFrameActiveEvidenceDigestRef
  readonly orderedProfessionalCheckCount: 13
  readonly completeTimelineCovered: true
  readonly deterministicCoverageIntegrityPassed: true
  readonly qwenProducesVisualEvidenceOnly: true
  readonly callerInspectionAssertionUsed: false
  readonly technicalMetricsOnlyAcceptanceUsed: false
  readonly canonicalQwenLifecycleRereadPending: true
}

export interface LivingFrameActiveEvidenceAudioDependencies {
  readonly verifiedAudioEvidence:
    LivingFrameActiveEvidenceDigestRef
  readonly fullDurationCovered: true
  readonly narrationProtectionVerified: true
  readonly speechSfxMusicAndDuckingEvidenceIncluded: true
  readonly evidenceProducedSeparatelyFromQwen: true
  readonly callerAudioAssertionUsed: false
}

export interface LivingFrameActiveEvidenceHeadQaDependencies {
  readonly recommendation:
    LivingFrameActiveEvidenceDigestRef
  readonly primaryModelRoleId: 'kimi_k3_main_edit_agent'
  readonly fallbackModelRoleId:
    'gpt_5_6_terra_fallback_edit_agent'
  readonly fallbackUsed: boolean
  readonly fallbackUsedOnlyAfterAllowedClassifiedPrimaryFailure: true
  readonly recommendationDisposition: 'accept'
  readonly verifiedVisualDeterministicAndAudioEvidenceRequired: true
  readonly canonicalApprovalClaimed: false
  readonly userPrivateReviewReplaced: false
}

export interface LivingFrameActiveEvidencePriorArtifactRef {
  readonly artifactId: string
  readonly artifactVersion: number
  readonly sha256: string
}

export interface LivingFrameActiveEvidenceRepairNotRequired {
  readonly repairState: 'not_required'
  readonly priorArtifact: null
  readonly priorEvidenceSetDigestSha256: null
  readonly rerunEvidenceSetDigestSha256: null
}

export interface LivingFrameActiveEvidenceRepairNPlusOne {
  readonly repairState: 'repaired_n_plus_one'
  readonly priorArtifact:
    LivingFrameActiveEvidencePriorArtifactRef
  readonly priorEvidenceSetDigestSha256: string
  readonly rerunEvidenceSetDigestSha256: string
}

export type LivingFrameActiveEvidenceRepairLineage =
  | LivingFrameActiveEvidenceRepairNotRequired
  | LivingFrameActiveEvidenceRepairNPlusOne

export interface LivingFrameActiveEvidenceTerminalDependencies {
  readonly deterministicFinalQa:
    LivingFrameActiveEvidenceDigestRef
  readonly artifactReconciliation:
    LivingFrameActiveEvidenceDigestRef
  readonly canonicalPrivateReviewAssembly:
    LivingFrameActiveEvidenceDigestRef & {
      readonly refVersion: 'canonical-private-review-manifest-v1'
    }
  readonly deterministicFinalQaPassedClaimRequiresCanonicalReread:
    true
  readonly artifactReconciliationPassedClaimRequiresCanonicalReread:
    true
  readonly privateReviewPassedClaimRequiresCanonicalReread:
    true
}

export interface LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly manifestCaseDigestSha256: string
  readonly identity: LivingFrameActiveEvidenceCaseIdentity
  readonly canonicalPlanBindings:
    LivingFrameActiveEvidenceCanonicalPlanBindings
  readonly finalRemotionArtifact:
    LivingFrameActiveEvidenceFinalRemotionArtifact
  readonly visualEvidence:
    LivingFrameActiveEvidenceVisualDependencies
  readonly audioEvidence:
    LivingFrameActiveEvidenceAudioDependencies
  readonly headQaEvidence:
    LivingFrameActiveEvidenceHeadQaDependencies
  readonly repairLineage:
    LivingFrameActiveEvidenceRepairLineage
  readonly terminalEvidence:
    LivingFrameActiveEvidenceTerminalDependencies
  readonly canonicalConsumptionPending: true
  readonly structuralAdmissionCandidate: true
  readonly canonicalAdmissionGranted: false
  readonly pausedScopeEvidenceUsed: false
  readonly historicalAggregateEvidenceUsed: false
  readonly allEvidenceOpaqueUntilCanonicalReread: true
}

export interface LivingFrameActiveNonIllustrationEvidenceAdmissionCase
  extends LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft {
  readonly evidenceSetDigestSha256: string
  readonly caseAdmissionDigestSha256: string
}

export interface LivingFrameActiveNonIllustrationEvidenceAdmissionAuthorityBoundary {
  readonly structuralValidationAuthority: true
  readonly canonicalConsumerAuthority: false
  readonly approvedSnapshotAuthority: false
  readonly workGraphAuthority: false
  readonly assetManifestAuthority: false
  readonly providerAuthority: false
  readonly audioAuthority: false
  readonly headQaAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly artifactQaAuthority: false
  readonly reconciliationAuthority: false
  readonly privateReviewAuthority: false
  readonly canonicalQaApprovalAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameActiveNonIllustrationEvidenceAdmissionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_ADMISSION_VERSION
  readonly admissionClass:
    typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_ADMISSION_CLASS
  readonly admissionState:
    'all_active_case_dependencies_structurally_bound_canonical_consumption_and_reread_pending'
  readonly aggregateManifestVersion:
    'living-frame-active-non-illustration-aggregate-v1'
  readonly aggregateManifestDigestSha256: string
  readonly ownerScopeAmendmentVersion:
    'living-frame-owner-scope-amendment-v1'
  readonly ownerScopeAmendmentDigestSha256: string
  readonly cases:
    readonly LivingFrameActiveNonIllustrationEvidenceAdmissionCase[]
  readonly activeCaseCount: 12
  readonly pausedScopeCount: 7
  readonly canonicalConsumptionPending: true
  readonly canonicalPrivateReviewSupplementalDependencyPending: true
  readonly directCanonicalPrivateReviewAdapterClaimed: false
  readonly historicalAggregateImported: false
  readonly callerAssertionsAcceptedAsEvidence: false
  readonly technicalMetricsOnlyAcceptanceAllowed: false
  readonly partialTimelineCoverageAllowed: false
  readonly partialAudioCoverageAllowed: false
  readonly repairedArtifactVersionReuseAllowed: false
  readonly pausedScopeEvidenceAllowed: false
  readonly authorityBoundary:
    LivingFrameActiveNonIllustrationEvidenceAdmissionAuthorityBoundary
  readonly containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly artifactCreated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameActiveNonIllustrationEvidenceAdmission
  extends LivingFrameActiveNonIllustrationEvidenceAdmissionDraft {
  readonly admissionDigestSha256: string
}
