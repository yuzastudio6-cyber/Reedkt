import type { ID, ISODateString } from '../shared'
import type { ClaimClassification, VisualNeedKind } from './story'
import type { MotionStudioOwnership, MotionStudioVersionReference } from './shared'

export type MotionStudioResearchSourceKind =
  | 'user_upload'
  | 'web_page'
  | 'official_record'
  | 'archive'
  | 'interview'
  | 'dataset'
  | 'tutorial_video'
  | 'reference_production'
  | 'user_assertion'

export type MotionStudioResearchTrustStatus =
  | 'unreviewed'
  | 'reviewed'
  | 'authoritative'
  | 'disputed'
  | 'rejected'

export type MotionStudioResearchRightsStatus =
  | 'unknown'
  | 'user_authorized'
  | 'licensed'
  | 'public_domain'
  | 'restricted'
  | 'expired'

export type MotionStudioResearchAuthenticityClass =
  | 'authentic_archive'
  | 'licensed_stock'
  | 'user_supplied'
  | 'official_document'
  | 'representative_footage'
  | 'deterministic_illustration'
  | 'ai_reconstruction'
  | 'unknown'

export type MotionStudioResearchRelationship =
  | 'primary'
  | 'secondary'
  | 'official'
  | 'commentary'
  | 'user_asserted'
  | 'unknown'

export type MotionStudioResearchReviewStatus =
  | 'draft'
  | 'needs_evidence'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'superseded'

export type MotionStudioExternalResearchState =
  | 'not_requested'
  | 'authorized'
  | 'preflight_passed'
  | 'processing'
  | 'reconciliation'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'blocked'
  | 'failure'
  | 'cancelled'

export type MotionStudioResearchSourceLocator =
  | {
      locatorType: 'public_https'
      canonicalUrl: string
      canonicalUrlHash: string
      displayHost: string
    }
  | {
      locatorType: 'private_asset_version'
      assetId: ID
      assetVersionId: ID
      contentDigest: string
    }
  | {
      locatorType: 'fixture'
      fixtureId: string
      fixtureDigest: string
    }
  | {
      locatorType: 'user_assertion'
      assertionId: ID
    }

export interface MotionStudioResearchRightsProfile {
  status: MotionStudioResearchRightsStatus
  reviewStatus: 'unreviewed' | 'reviewed' | 'blocked'
  evidenceIds: readonly ID[]
  permittedUses: readonly string[]
  restrictions: readonly string[]
  territories: readonly string[]
  expiresAt?: ISODateString
}

export interface MotionStudioResearchSourceVersionV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.research-source-version.v2'
  moduleId: 'storytelling'
  moduleCatalogVersion: 'motion-studio-module-catalog-v1'
  stageProfileId: 'motion-studio-storytelling-stage-profile-v1'
  productionId: ID
  sourceId: ID
  sourceVersionId: ID
  sourceVersionNumber: number
  sourceKind: MotionStudioResearchSourceKind
  retrievalMethod: 'fixture' | 'private_upload' | 'authorized_https_capture'
  locator: MotionStudioResearchSourceLocator
  title: string
  creatorOrPublisher?: string
  publishedAt?: ISODateString
  accessedAt: ISODateString
  language?: string
  contentDigest: string
  trustStatus: MotionStudioResearchTrustStatus
  trustRationale: string
  rights: MotionStudioResearchRightsProfile
  authenticityClass: MotionStudioResearchAuthenticityClass
  relationship: MotionStudioResearchRelationship
  promptInjection: {
    status: 'not_detected' | 'detected' | 'needs_review'
    findings: readonly string[]
  }
  privacyClass: 'standard' | 'sensitive' | 'restricted'
  retentionClass: 'project_lifetime' | 'review_window' | 'legal_hold'
  sourceContentExecutable: false
  canApproveWork: false
  canAuthorizeSpend: false
  supersedesSourceVersionId?: ID
  tombstonedAt?: ISODateString
  createdAt: ISODateString
  immutable: true
}

export type MotionStudioEvidenceLocator =
  | { locatorType: 'page'; pageNumber: number }
  | { locatorType: 'timestamp'; startMilliseconds: number; endMilliseconds: number }
  | { locatorType: 'paragraph'; paragraphNumber: number }
  | { locatorType: 'table_cell'; tableId: string; row: number; column: number }
  | { locatorType: 'frame'; frameNumber: number }
  | { locatorType: 'dataset_row'; datasetId: string; rowKey: string }
  | { locatorType: 'user_assertion'; assertionId: ID }

export type MotionStudioEvidenceRelationship =
  | 'supports'
  | 'contradicts'
  | 'context_only'
  | 'background'

export interface MotionStudioResearchEvidenceFragmentV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.research-evidence-fragment.v2'
  productionId: ID
  evidenceFragmentId: ID
  sourceId: ID
  sourceVersionId: ID
  locator: MotionStudioEvidenceLocator
  normalizedParaphrase: string
  copyrightSafeExcerpt?: string
  contentDigest: string
  relationship: MotionStudioEvidenceRelationship
  extraction: {
    method: 'fixture' | 'human' | 'ocr' | 'transcription' | 'structured_parse'
    skillRunId?: ID
    toolRunId?: ID
    confidence: 'low' | 'medium' | 'high'
  }
  reviewStatus: 'unreviewed' | 'reviewed' | 'rejected'
  qualityWarnings: readonly string[]
  sourceContentExecutable: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioClaimEvidenceLinkV2 {
  evidenceFragmentId: ID
  relationship: MotionStudioEvidenceRelationship
  weight: 'corroborating' | 'primary' | 'material_contradiction' | 'contextual'
}

export interface MotionStudioClaimDownstreamReferences {
  scriptArtifactVersionIds: readonly ID[]
  narrationSegmentIds: readonly ID[]
  sceneIds: readonly ID[]
  shotIds: readonly ID[]
  visualNeedIds: readonly ID[]
  finalUseIds: readonly ID[]
}

export interface MotionStudioResearchClaimV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.research-claim.v2'
  productionId: ID
  claimId: ID
  claimLedgerArtifactVersion: MotionStudioVersionReference
  claimText: string
  classification: ClaimClassification
  evidenceLinks: readonly MotionStudioClaimEvidenceLinkV2[]
  namedAttributionRequired: boolean
  namedAttribution?: string
  confidence: 'low' | 'medium' | 'high'
  confidenceRationale: string
  materiality: 'background' | 'supporting' | 'material'
  alternativeInterpretations: readonly string[]
  realPersonRisk: 'none' | 'caution' | 'high'
  legalReviewRequired: boolean
  disclosureRequired: boolean
  disclosureText?: string
  safeWording: string
  downstreamReferences: MotionStudioClaimDownstreamReferences
  status: MotionStudioResearchReviewStatus
  reviewedBy?: ID
  reviewedAt?: ISODateString
  approvedArtifactVersionId?: ID
  approvedArtifactDigest?: string
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioResearchChronologyEventV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.research-chronology-event.v1'
  productionId: ID
  chronologyEventId: ID
  title: string
  description: string
  timePrecision: 'exact' | 'day' | 'month' | 'year' | 'range' | 'unknown'
  startAt?: ISODateString
  endAt?: ISODateString
  eraLabel?: string
  timezone?: string
  participantIds: readonly ID[]
  placeIds: readonly ID[]
  evidenceFragmentIds: readonly ID[]
  uncertainty: readonly string[]
  contradictionStatus: 'none' | 'unresolved' | 'resolved_with_disclosure'
  reviewStatus: MotionStudioResearchReviewStatus
  createdAt: ISODateString
  immutable: true
}

export type MotionStudioVisualTreatment =
  | 'authentic_archive'
  | 'user_or_licensed_media'
  | 'representative_footage'
  | 'deterministic_graphic'
  | 'deterministic_map_chart_document'
  | 'illustration'
  | 'labeled_ai_reconstruction'
  | 'layered_motion'
  | 'generated_motion'

export interface MotionStudioVisualNeedV2 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.visual-need.v2'
  productionId: ID
  visualNeedId: ID
  visualCoverageArtifactVersion: MotionStudioVersionReference
  narrativePurpose: string
  narrativeFunctionVersion?: MotionStudioVersionReference
  kind: VisualNeedKind
  narrationSegmentIds: readonly ID[]
  sceneIds: readonly ID[]
  shotIds: readonly ID[]
  linkedClaimIds: readonly ID[]
  evidenceFragmentIds: readonly ID[]
  requiredAuthenticity: MotionStudioResearchAuthenticityClass | 'any_labeled'
  requiredAccuracy: 'representative' | 'precise' | 'source_exact'
  acceptableTreatments: readonly MotionStudioVisualTreatment[]
  prohibitedTreatments: readonly MotionStudioVisualTreatment[]
  disclosureRules: readonly string[]
  candidateIds: readonly ID[]
  selectedAssetVersionIds: readonly ID[]
  missingCoverageReason?: string
  recommendation: {
    route: 'deterministic' | 'existing_asset' | 'candidate_ingest' | 'future_generation'
    editability: 'low' | 'medium' | 'high'
    costClass: 'no_incremental_provider_cost' | 'low' | 'medium' | 'high'
    risk: 'low' | 'medium' | 'high'
    rationale: string
  }
  status: MotionStudioResearchReviewStatus
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioVisualAssetCandidateV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.visual-asset-candidate.v1'
  productionId: ID
  candidateId: ID
  visualNeedId: ID
  sourceId: ID
  sourceVersionId: ID
  candidateType: MotionStudioVisualTreatment
  preview: {
    label: string
    mimeType?: string
    pixelWidth?: number
    pixelHeight?: number
    mediaDurationMilliseconds?: number
  }
  authenticityClass: MotionStudioResearchAuthenticityClass
  contentMatch: 'low' | 'medium' | 'high'
  technicalSuitability: 'unsuitable' | 'review_needed' | 'suitable'
  rights: MotionStudioResearchRightsProfile
  privacyRisk: 'none' | 'caution' | 'blocked'
  likenessRisk: 'none' | 'caution' | 'blocked'
  linkedClaimIds: readonly ID[]
  proposedUse: string
  expectedIncrementalInternalCostMicros: number
  currency: 'USD'
  expiresAt?: ISODateString
  selectionStatus: 'discovered' | 'needs_review' | 'selected' | 'rejected' | 'expired'
  selectedAssetVersionId?: ID
  rejectionReason?: string
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioResearchReviewEventV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.research-review-event.v1'
  productionId: ID
  reviewEventId: ID
  reviewKind: 'claim' | 'rights' | 'provenance' | 'authenticity' | 'visual_candidate' | 'research_qa'
  subjectType: 'source_version' | 'evidence_fragment' | 'claim' | 'chronology_event' | 'visual_need' | 'visual_candidate' | 'technique_blueprint'
  subjectId: ID
  decision: 'approved' | 'rejected' | 'needs_review' | 'blocked'
  rationale: string
  reviewerId: ID
  priorReviewEventId?: ID
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioTechniqueBlueprintV1 extends MotionStudioOwnership {
  schemaVersion: 'motion_studio.reference.technique-blueprint.v1'
  productionId: ID
  techniqueBlueprintId: ID
  referenceContractArtifactVersion: MotionStudioVersionReference
  sourceVersionId: ID
  title: string
  timestampedSteps: readonly {
    stepId: ID
    startMilliseconds: number
    endMilliseconds: number
    summary: string
    evidenceFragmentIds: readonly ID[]
  }[]
  toolsAndModelsMentioned: readonly string[]
  promptPatternSummaries: readonly string[]
  motionPrinciples: readonly string[]
  stylePrinciples: readonly string[]
  decisionRules: readonly string[]
  failureCases: readonly string[]
  manualCorrections: readonly string[]
  reusableTechniques: readonly string[]
  claimsRequiringVerification: readonly ID[]
  sourceInstructionsExecutable: false
  toolExecutionAllowed: false
  spendingAuthorityAllowed: false
  copiedPublisherIdentityAllowed: false
  copiedExactLayoutAllowed: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioResearchWorkspaceDto {
  productionId: ID
  moduleId: 'storytelling'
  moduleCatalogVersion: 'motion-studio-module-catalog-v1'
  stageProfileId: 'motion-studio-storytelling-stage-profile-v1'
  stage: 'research'
  state: 'empty' | 'partial' | 'processing' | 'reconciliation' | 'needs_review' | 'blocked' | 'failure' | 'cancelled' | 'approved'
  scope: {
    approvedStoryUnderstandingVersionId?: ID
    externalRetrievalAllowed: false
    fixtureOnly: boolean
    maximumAuthorizedInternalCostMicros: number
  }
  sources: readonly {
    sourceId: ID
    sourceVersionId: ID
    title: string
    sourceKind: MotionStudioResearchSourceKind
    displayOrigin: string
    trustStatus: MotionStudioResearchTrustStatus
    rightsStatus: MotionStudioResearchRightsStatus
    authenticityClass: MotionStudioResearchAuthenticityClass
    promptInjectionStatus: 'not_detected' | 'detected' | 'needs_review'
    reviewStatus: 'unreviewed' | 'reviewed' | 'blocked'
  }[]
  evidence: readonly {
    evidenceFragmentId: ID
    sourceVersionId: ID
    locatorLabel: string
    normalizedParaphrase: string
    relationship: MotionStudioEvidenceRelationship
    reviewStatus: 'unreviewed' | 'reviewed' | 'rejected'
    warnings: readonly string[]
  }[]
  claims: readonly {
    claimId: ID
    claimText: string
    classification: ClaimClassification
    confidence: 'low' | 'medium' | 'high'
    materiality: 'background' | 'supporting' | 'material'
    status: MotionStudioResearchReviewStatus
    supportCount: number
    contradictionCount: number
    disclosureRequired: boolean
    blockingReason?: string
  }[]
  chronology: readonly {
    chronologyEventId: ID
    title: string
    timeLabel: string
    contradictionStatus: 'none' | 'unresolved' | 'resolved_with_disclosure'
    reviewStatus: MotionStudioResearchReviewStatus
  }[]
  visualNeeds: readonly {
    visualNeedId: ID
    narrativePurpose: string
    kind: VisualNeedKind
    route: 'deterministic' | 'existing_asset' | 'candidate_ingest' | 'future_generation'
    candidateCount: number
    selectedAssetCount: number
    status: MotionStudioResearchReviewStatus
    blockingReason?: string
  }[]
  candidates: readonly {
    candidateId: ID
    visualNeedId: ID
    label: string
    candidateType: MotionStudioVisualTreatment
    authenticityClass: MotionStudioResearchAuthenticityClass
    rightsStatus: MotionStudioResearchRightsStatus
    technicalSuitability: 'unsuitable' | 'review_needed' | 'suitable'
    selectionStatus: 'discovered' | 'needs_review' | 'selected' | 'rejected' | 'expired'
    blockingReason?: string
  }[]
  techniqueBlueprints: readonly {
    techniqueBlueprintId: ID
    title: string
    stepCount: number
    failureCaseCount: number
    sourceInstructionsExecutable: false
  }[]
  reviewQueue: readonly {
    subjectType: 'source_version' | 'evidence_fragment' | 'claim' | 'chronology_event' | 'visual_need' | 'visual_candidate' | 'technique_blueprint'
    subjectId: ID
    label: string
    reason: string
    severity: 'info' | 'warning' | 'blocking'
  }[]
  summary: {
    sourceCount: number
    evidenceCount: number
    claimCount: number
    approvedClaimCount: number
    unresolvedContradictionCount: number
    visualNeedCount: number
    missingVisualCoverageCount: number
    rightsBlockedCandidateCount: number
  }
  externalEvidence: {
    state: MotionStudioExternalResearchState
    requestCount: number
    capturedRecordCount: number
    binaryCaptureCount: number
    externalSourceCount: number
    openQuestionCount: number
    openQuestions: readonly string[]
    reviewOnlyCandidateCount: number
    finalAssetRegistrationAllowed: false
    timelineMutationAllowed: false
    updatedAt: ISODateString
  }
  externalRetrievalPerformed: boolean
  providerCallMade: false
  providerCostMicros: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
  localFixtureOnly: boolean
  updatedAt: ISODateString
}
