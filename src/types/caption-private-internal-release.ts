import type {
  CaptionPrivateQualificationDisposition,
  CaptionPrivateQualificationFixtureId,
} from './caption-private-qualification'
import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CAPTION_FINAL_JOB_QUALIFICATION_REPORT_VERSION =
  'caption-final-job-qualification-report-v1' as const
export const CAPTION_PRIVATE_SECURITY_REVIEW_VERSION =
  'caption-private-security-review-v1' as const
export const CAPTION_PRIVATE_DEPENDENCY_LICENSE_REVIEW_VERSION =
  'caption-private-dependency-license-review-v1' as const
export const CAPTION_PRIVATE_PERFORMANCE_COST_EVIDENCE_VERSION =
  'caption-private-performance-cost-evidence-v1' as const
export const CAPTION_FUTURE_ORCHESTRA_MOUNTING_GUIDE_VERSION =
  'caption-future-orchestra-mounting-guide-v1' as const
export const CAPTION_PRIVATE_INTERNAL_RELEASE_MANIFEST_VERSION =
  'caption-private-internal-release-manifest-v1' as const

export type CaptionFinalJobAdmission =
  | 'admitted_private_internal'
  | 'admitted_contract_boundary'
  | 'conditional_shared_owner_not_admitted'

export interface CaptionFinalJobQualificationItem {
  jobType: CaptionsSupportedJobType
  sourceDisposition:
    | 'qualified_private_evidence'
    | 'qualified_contract_evidence'
    | 'blocked_shared_dependency'
  admission: CaptionFinalJobAdmission
  supportingFixtureIds: CaptionPrivateQualificationFixtureId[]
  evidenceRefs: CaptionDomainRef[]
  blockerCodes: string[]
  sharedOwnerKeys: Array<
    | 'track_all'
    | 'broll_owner'
    | 'soundsync'
    | 'canonical_transcript'
    | 'visual_intelligence'
  >
  fallbackOrRepairCodes: string[]
  planningModeQualified: true
  captionOwnedImplementationComplete: true
  requiredForCurrentAdmittedSurface: boolean
  runtimeOwnershipTransferredToCaption: false
  duplicateSharedOwnerCreated: false
}

export interface CaptionFinalJobQualificationReport {
  schemaVersion: typeof CAPTION_FINAL_JOB_QUALIFICATION_REPORT_VERSION
  reportId: string
  reportDigestSha256: string
  sourceCap18ReportRef: CaptionDomainRef
  jobs: CaptionFinalJobQualificationItem[]
  counts: {
    totalDeclaredJobs: 41
    admittedPrivateInternal: number
    admittedContractBoundary: number
    conditionalSharedOwnerNotAdmitted: number
  }
  sourceFixtureCounts: {
    verifiedPrivate: number
    verifiedContract: number
    missingIntegration: number
    blockedExternal: number
  }
  currentAdmittedJobTypes: CaptionsSupportedJobType[]
  conditionalJobTypes: CaptionsSupportedJobType[]
  allDeclaredJobTypesAccountedFor: true
  admittedSurfaceHasNoBlockedJob: true
  conditionalJobsExcludedFromAdmittedSurface: true
  captionOwnedRequirementsComplete: true
  sharedOwnerIntegrationComplete: false
  externalEvidenceComplete: true
  privateInternalSpecialistQualified: false
  productionQualificationClaimed: false
}

export interface CaptionPrivateSecurityReview {
  schemaVersion: typeof CAPTION_PRIVATE_SECURITY_REVIEW_VERSION
  reviewId: string
  reviewDigestSha256: string
  sourceReleaseRef: CaptionDomainRef
  observedAt: string
  packageLockRef: CaptionDomainRef
  productionDependencyAudit: {
    auditLevel: 'high'
    productionDependencyCount: 319
    vulnerabilityCounts: {
      info: 0
      low: 0
      moderate: 0
      high: 0
      critical: 0
      total: 0
    }
  }
  passedCheckIds: string[]
  openExternalGateCodes: string[]
  closedContractValidationRequired: true
  unsafeTextAndUnknownFieldsRejected: true
  inheritedAccessorAndCycleInputsRejected: true
  tenantAndApprovedSnapshotScopeRequired: true
  rawChatMediaBytesPathsUrlsAndCredentialsSerialized: false
  runtimeNetworkRequiredByCaptionFixture: false
  browserLocalCompletionAccepted: false
  secretValuePrinted: false
  providerOrModelCallMade: false
  operationDispatchAuthority: false
  billingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
  disposition: 'passed_caption_private_boundary_external_lifecycle_gated'
}

export interface CaptionPrivateDependencyLicenseItem {
  dependencyId: string
  version: string
  sourceRef: CaptionDomainRef
  licenseIdentity: string
  privateFixtureUseDisposition:
    | 'reviewed_and_pinned'
    | 'existing_canonical_owner_boundary'
  runtimeDownloadAllowed: false
  callerSelectedBinaryOrFontPathAllowed: false
  publicProductionLegalApprovalClaimed: false
  openGateCodes: string[]
}

export interface CaptionPrivateDependencyLicenseReview {
  schemaVersion: typeof CAPTION_PRIVATE_DEPENDENCY_LICENSE_REVIEW_VERSION
  reviewId: string
  reviewDigestSha256: string
  sourceReleaseRef: CaptionDomainRef
  items: CaptionPrivateDependencyLicenseItem[]
  reviewedFontPackRef: CaptionDomainRef
  remotionPackageLockRef: CaptionDomainRef
  exactDependencyInventoryReviewed: true
  captionBundledDependenciesAcceptedForBoundedPrivateFixtures: true
  runtimeDependencyDownloadPerformedByReview: false
  modelWeightIntroducedByCaption: false
  externalProviderDependencyIntroducedByCaption: false
  productionLegalApprovalClaimed: false
  publicDistributionApprovalClaimed: false
  disposition: 'passed_private_internal_with_production_license_gates'
}

export interface CaptionPrivatePerformanceCostEvidence {
  schemaVersion: typeof CAPTION_PRIVATE_PERFORMANCE_COST_EVIDENCE_VERSION
  evidenceId: string
  evidenceDigestSha256: string
  sourceCap18ReportRef: CaptionDomainRef
  actualPrivateMediaOutputCount: 9
  actualRenderedFrameCount: 1200
  actualRenderedDurationMilliseconds: 44000
  actualDirectlyInspectedFrameCount: 35
  standardRemotionResourceProfileId:
    'standard_remotion_cpu_2vcpu_4gib_v1'
  maximumCpuCores: 2
  maximumMemoryBytes: 4294967296
  maximumRuntimeMilliseconds: 900000
  measuredCpuExecutionObserved: true
  deterministicTechnicalQaPassed: true
  providerOrModelCallCount: 0
  providerCostMicrousd: 0
  creditReservationOrSpendCount: 0
  localComputeUnitCostMeasured: false
  customerScaleThroughputBenchmarkPerformed: false
  fullResolutionProductionBenchmarkPerformed: false
  performanceDisposition: 'passed_bounded_private_fixtures_only'
  costDisposition: 'zero_provider_cost_local_compute_not_unit_costed'
  estimateAndCreditOwnerRemainsExternal: true
  billingAuthority: false
  productionPerformanceQualified: false
}

export interface CaptionFutureOrchestraMountingGuide {
  schemaVersion: typeof CAPTION_FUTURE_ORCHESTRA_MOUNTING_GUIDE_VERSION
  guideId: string
  guideDigestSha256: string
  specialistKey: 'captions'
  specialistManifestRef: CaptionDomainRef
  planningQualificationSnapshotRef: CaptionDomainRef
  finalJobReportRef: CaptionDomainRef
  publicContractVersions: {
    capabilityManifest: 'skill-capability-manifest-v2'
    qualificationSnapshot: 'skill-qualification-snapshot-v1'
    skillCall: 'orchestra-skill-call-v1'
    supportRequest: 'skill-support-request-v1'
    jobResult: 'orchestra-skill-job-result-v1'
  }
  mountingSteps: [
    'reread_manifest_and_qualification',
    'validate_bounded_skill_call',
    'invoke_caption_standalone_harness',
    'mediate_needs_followup_support_requests',
    'inject_authenticated_support_artifacts',
    'resume_exact_original_call',
    'persist_and_reread_job_result'
  ]
  supportTargetSkillKeys: [
    'visual_intelligence',
    'track_all',
    'living_frame',
    'soundsync',
    'transitions',
    'broll_owner',
    'canonical_timing_owner',
    'canonical_layout_owner'
  ]
  currentAdmittedJobTypes: CaptionsSupportedJobType[]
  conditionalJobTypes: CaptionsSupportedJobType[]
  mountingReadyForCurrentAdmittedSurface: true
  fullJobSurfaceMountingReady: false
  hqMediatedSupportRequired: true
  directPeerDispatchAllowed: false
  rawChatOrMediaBytesAllowed: false
  centralOrchestraImplemented: false
  globalSchedulerImplemented: false
  externalAuthorityPromoted: false
}

export interface CaptionPrivateInternalReleaseManifest {
  schemaVersion: typeof CAPTION_PRIVATE_INTERNAL_RELEASE_MANIFEST_VERSION
  releaseId: string
  releaseDigestSha256: string
  sourceCommitRef: CaptionDomainRef
  sourceCap18ReportRef: CaptionDomainRef
  sourceCap19ReleaseRef: CaptionDomainRef
  specialistManifestRef: CaptionDomainRef
  planningQualificationSnapshotRef: CaptionDomainRef
  finalJobReport: CaptionFinalJobQualificationReport
  securityReview: CaptionPrivateSecurityReview
  dependencyLicenseReview: CaptionPrivateDependencyLicenseReview
  performanceCostEvidence: CaptionPrivatePerformanceCostEvidence
  futureOrchestraMountingGuide: CaptionFutureOrchestraMountingGuide
  sourceRegressionMilestoneIds: string[]
  fullSourceRegressionPassed: true
  documentationComplete: true
  captionOwnedBoundaryComplete: true
  currentAdmittedSurfaceQualified: true
  conditionalSharedOwnerSurfaceQualified: false
  sharedBackendWorkflowIntegrationRequired: true
  releaseStatus: 'ready_for_shared_pipeline_integration'
  targetTerminalStatus: 'caption_specialist_private_internal_qualified'
  privateInternalSpecialistQualified: false
  finalGoalCompletionClaimed: false
  noCentralOrchestraImplemented: true
  noRequiredCurrentAdmittedJobBlocked: true
  providerOrModelRuntimeAuthority: false
  operationDispatchAuthority: false
  assetMutationAuthority: false
  finalQaApprovalAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export interface CaptionQualificationFixtureSummary {
  fixtureId: CaptionPrivateQualificationFixtureId
  disposition: CaptionPrivateQualificationDisposition
}
