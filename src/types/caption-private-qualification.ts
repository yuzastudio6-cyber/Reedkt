import type { CaptionsSupportedJobType } from './captions-specialist'
import type { CaptionDomainRef } from './caption-domain-contracts'

export const CAPTION_PRIVATE_QUALIFICATION_REPORT_VERSION =
  'caption-private-qualification-report-v1' as const
export const CAPTION_PRIVATE_QUALIFICATION_FIXTURE_CATALOG_VERSION =
  'caption-private-qualification-fixture-catalog-v1' as const
export const CAPTION_PRIVATE_JOB_EVIDENCE_SET_VERSION =
  'caption-private-job-evidence-set-v1' as const
export const CAPTION_PRIVATE_VISUAL_INSPECTION_RECEIPT_VERSION =
  'caption-private-visual-inspection-receipt-v1' as const
export const CAPTION_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_VERSION =
  'caption-private-multilingual-inspection-receipt-v1' as const

export const CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS = [
  'uploaded_reference_video',
  'clean_documentary',
  'dynamic_short',
  'small_transcript_hero_track',
  'text_behind_subject',
  'text_in_front_of_subject',
  'object_anchor',
  'persistent_list',
  'broll_co_composition',
  'caption_to_visual',
  'caption_to_living_frame',
  'sound_designed_hero_word',
  'multi_speaker',
  'busy_background',
  'dark_light_change',
  'multilingual',
  'reduced_motion',
  'mask_failure',
  'alignment_failure',
  'visual_intelligence_failure',
  'remotion_failure',
  'old_snapshot_compatibility',
  'multiple_output_ratios',
] as const

export type CaptionPrivateQualificationFixtureId =
  typeof CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS[number]

export type CaptionPrivateQualificationDisposition =
  | 'verified_private'
  | 'verified_contract'
  | 'missing_integration'
  | 'blocked_external'

export type CaptionPrivateQualificationBlockerClass =
  | 'none'
  | 'caption_owned'
  | 'shared_owner'
  | 'external'

export interface CaptionPrivateMediaEvidence {
  evidenceId: string
  artifactRef: CaptionDomainRef
  sourceMediaRef: CaptionDomainRef
  canonicalUploadManifestRef: CaptionDomainRef | null
  canonicalUploadRereadVerified: boolean
  contentType: 'video/mp4' | 'image/png'
  width: number
  height: number
  fps: number | null
  durationFrames: number | null
  aspectRatio: '16:9' | '9:16' | '1:1'
  languageTags: string[]
  sourceClass:
    | 'controlled_private_actual_media'
    | 'prior_caption_private_runtime'
    | 'canonical_private_pipeline_artifact'
  actualFileBytesProcessed: true
  actualPackageRuntimeExecuted: true
  deterministicTechnicalQaPassed: true
  deterministicReplayMatched: boolean
  directVisualInspectionRequired: boolean
  directVisualInspectionReceiptRef: CaptionDomainRef | null
  completePlaybackInspected: boolean
  inspectedFrameNumbers: number[]
  privateInternalOnly: true
  customerMediaClaimed: false
  representativeProductionFootageClaimed: false
  pathsOrUrlsSerialized: false
  mediaBytesSerialized: false
  providerOrModelCallMade: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionPrivateVisualInspectionOutput {
  outputId: string
  sourceClass:
    | 'canonical_uploaded_source_composition'
    | 'caption_creative_scene_group_proxy'
  artifactRef: CaptionDomainRef
  width: number
  height: number
  fps: number
  durationFrames: number
  aspectRatio: '16:9' | '9:16' | '1:1'
  contactSheetRasterSha256: string
  requestedFrameNumbers: number[]
  inspectedFrames: Array<{
    frameNumber: number
    rasterSha256: string
    actualRasterOpenedAndInspected: true
    disposition: 'passed'
    findingCodes: string[]
  }>
  directInspectionDisposition: 'accepted_controlled_private_fixture'
}

export interface CaptionPrivateVisualInspectionReceipt {
  schemaVersion: typeof CAPTION_PRIVATE_VISUAL_INSPECTION_RECEIPT_VERSION
  receiptId: string
  receiptDigestSha256: string
  observedAt: string
  sourceManifestCandidateRef: CaptionDomainRef
  referenceManifestCandidateRef: CaptionDomainRef
  inspectedOutputs: CaptionPrivateVisualInspectionOutput[]
  exactOutputSetComplete: true
  actualRenderedPixelsOpenedAndInspected: true
  everyRequestedFrameInspected: true
  completePlaybackInspectionPerformed: false
  qualifiedAiCompleteTimeReviewPerformed: false
  controlledFixtureOnly: true
  customerMediaClaimed: false
  representativeProductionFootageClaimed: false
  technicalQaReplaced: false
  browserLocalCompletionAccepted: false
  pathsOrUrlsSerialized: false
  mediaBytesSerialized: false
  providerOrModelCallMade: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionPrivateMultilingualInspectionOutput {
  outputId: 'fr-combining' | 'ja' | 'ar' | 'hi'
  languageTag: 'fr' | 'ja' | 'ar' | 'hi'
  captionDigestSha256: string
  overlayArtifactRef: CaptionDomainRef
  compositeArtifactRef: CaptionDomainRef
  inspectedFrameRef: CaptionDomainRef
  width: 640
  height: 360
  fps: 24
  durationFrames: 48
  inspectedFrameNumber: 24
  alphaBoundingBox: {
    left: number
    top: number
    width: number
    height: number
  }
  nonTransparentPixelCount: number
  actualRasterOpenedAndInspected: true
  shapingDisposition: 'accepted_reviewed_script_fixture'
  findingCodes: string[]
}

export interface CaptionPrivateMultilingualInspectionReceipt {
  schemaVersion:
    typeof CAPTION_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_VERSION
  receiptId: string
  receiptDigestSha256: string
  observedAt: string
  controlledSourceArtifactRef: CaptionDomainRef
  libassImageRef: CaptionDomainRef
  remotionImageRef: CaptionDomainRef
  fontPackRef: CaptionDomainRef
  fontAssetRefs: CaptionDomainRef[]
  contactSheetRasterRef: CaptionDomainRef
  fontToolsVersion: '4.38.0'
  openTypeSanitizerVersion: '8.2.1'
  libassVersion: '0.17.5'
  outputs: CaptionPrivateMultilingualInspectionOutput[]
  exactOutputSetComplete: true
  actualFontToolsBuildValidationExecuted: true
  fontToolsSubsetRoundTripPassed: true
  actualOpenTypeSanitizerBuildValidationExecuted: true
  malformedFontRejectedByOpenTypeSanitizer: true
  actualLibassHarfBuzzFribidiRenderingExecuted: true
  actualRemotionFinalCompositionExecuted: true
  actualPinnedFfprobeQaExecuted: true
  directRenderedFrameInspectionExecuted: true
  completePlaybackInspectionPerformed: false
  remotionBrowserTextShapingClaimed: false
  colorEmojiIncluded: false
  runtimeFontDownloadOccurred: false
  callerFontPathAccepted: false
  controlledFixtureOnly: true
  customerMediaClaimed: false
  representativeProductionFootageClaimed: false
  pathsOrUrlsSerialized: false
  mediaBytesSerialized: false
  providerOrModelCallMade: false
  fullTrackOrVideoBurnInReady: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionPrivateQualificationFixtureResult {
  fixtureId: CaptionPrivateQualificationFixtureId
  disposition: CaptionPrivateQualificationDisposition
  blockerClass: CaptionPrivateQualificationBlockerClass
  requiredJobTypes: CaptionsSupportedJobType[]
  ownerIds: string[]
  evidenceRefs: CaptionDomainRef[]
  mediaEvidence: CaptionPrivateMediaEvidence[]
  blockerCodes: string[]
  fallbackOrRepairCodes: string[]
  directVisualInspectionSatisfied: boolean
  exactConfirmedOutputFrameBound: boolean
  exactMasterTimingOrStoryTimingBound: boolean
  privateArtifactPolicySatisfied: true
  noDuplicateOwnerCreated: true
}

export interface CaptionPrivateJobQualificationEvidence {
  jobType: CaptionsSupportedJobType
  disposition:
    | 'qualified_private_evidence'
    | 'qualified_contract_evidence'
    | 'blocked_shared_dependency'
    | 'blocked_external_evidence'
  planningModeQualified: true
  privateRuntimeOwnedByCaptions: false
  supportingFixtureIds: CaptionPrivateQualificationFixtureId[]
  evidenceRefs: CaptionDomainRef[]
  blockerCodes: string[]
}

export interface CaptionPrivateJobEvidenceSet {
  schemaVersion: typeof CAPTION_PRIVATE_JOB_EVIDENCE_SET_VERSION
  evidenceSetId: string
  evidenceSetDigestSha256: string
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  jobs: CaptionPrivateJobQualificationEvidence[]
  allCaptionJobTypesCovered: true
  planningQualificationPreserved: true
  runtimeOwnershipNotExpanded: true
  wholeSkillQualificationClaimed: false
  productionQualificationClaimed: false
}

export interface CaptionPrivateQualificationReport {
  schemaVersion: typeof CAPTION_PRIVATE_QUALIFICATION_REPORT_VERSION
  reportId: string
  reportDigestSha256: string
  observedAt: string
  fixtureCatalogVersion:
    typeof CAPTION_PRIVATE_QUALIFICATION_FIXTURE_CATALOG_VERSION
  sourceReleaseRef: CaptionDomainRef
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  jobEvidenceSetRef: CaptionDomainRef
  fixtureResults: CaptionPrivateQualificationFixtureResult[]
  jobEvidenceSet: CaptionPrivateJobEvidenceSet
  counts: {
    totalFixtures: number
    verifiedPrivate: number
    verifiedContract: number
    missingIntegration: number
    blockedExternal: number
    totalJobs: number
    jobsWithPrivateEvidence: number
    jobsWithContractEvidence: number
    jobsBlockedSharedDependency: number
    jobsBlockedExternalEvidence: number
  }
  captionOwnedRequirementsComplete: boolean
  sharedOwnerIntegrationComplete: boolean
  externalEvidenceComplete: boolean
  readyForCanonicalBackendWorkflowIntegration: boolean
  privateInternalSpecialistQualified: boolean
  privateInternalOnly: true
  actualMediaInspectedWhereClaimed: true
  historicalEvidenceRelabeledAsFreshRuntime: false
  planningContractRelabeledAsExecutionEvidence: false
  browserLocalCompletionAccepted: false
  operationDispatchAuthority: false
  providerRuntimeAuthority: false
  assetMutationAuthority: false
  creditOrBillingAuthority: false
  finalQaApprovalAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
