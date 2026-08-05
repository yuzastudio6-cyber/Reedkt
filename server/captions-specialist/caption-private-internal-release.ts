import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  CAPTION_FINAL_JOB_QUALIFICATION_REPORT_VERSION,
  CAPTION_FUTURE_ORCHESTRA_MOUNTING_GUIDE_VERSION,
  CAPTION_PRIVATE_DEPENDENCY_LICENSE_REVIEW_VERSION,
  CAPTION_PRIVATE_INTERNAL_RELEASE_MANIFEST_VERSION,
  CAPTION_PRIVATE_PERFORMANCE_COST_EVIDENCE_VERSION,
  CAPTION_PRIVATE_SECURITY_REVIEW_VERSION,
  type CaptionFinalJobAdmission,
  type CaptionFinalJobQualificationItem,
  type CaptionFinalJobQualificationReport,
  type CaptionFutureOrchestraMountingGuide,
  type CaptionPrivateDependencyLicenseReview,
  type CaptionPrivateInternalReleaseManifest,
  type CaptionPrivatePerformanceCostEvidence,
  type CaptionPrivateSecurityReview,
} from '../../src/types/caption-private-internal-release'
import {
  CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS,
} from '../../src/types/caption-private-qualification'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
} from '../../src/types/captions-specialist'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionPrivateQualificationReport,
} from './caption-private-qualification'
import { CAPTION_MIGRATION_RETIREMENT_RELEASE } from
  './caption-migration-retirement'
import { CAPTIONS_SPECIALIST_MANIFEST } from './captions-specialist-manifest'
import { CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT } from
  './captions-specialist-qualification'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const sharedOwnerSchema = z.enum([
  'track_all', 'broll_owner', 'soundsync', 'canonical_transcript',
  'visual_intelligence',
])
const jobTypeSchema = z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)
const fixtureIdSchema = z.enum(CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS)

const jobItemSchema = z.object({
  jobType: jobTypeSchema,
  sourceDisposition: z.enum([
    'qualified_private_evidence', 'qualified_contract_evidence',
    'blocked_shared_dependency',
  ]),
  admission: z.enum([
    'admitted_private_internal', 'admitted_contract_boundary',
    'conditional_shared_owner_not_admitted',
  ]),
  supportingFixtureIds: z.array(fixtureIdSchema).min(1).max(23),
  evidenceRefs: z.array(refSchema).min(1).max(128),
  blockerCodes: z.array(safeKey).max(64),
  sharedOwnerKeys: z.array(sharedOwnerSchema).max(5),
  fallbackOrRepairCodes: z.array(safeKey).max(64),
  planningModeQualified: z.literal(true),
  captionOwnedImplementationComplete: z.literal(true),
  requiredForCurrentAdmittedSurface: z.boolean(),
  runtimeOwnershipTransferredToCaption: z.literal(false),
  duplicateSharedOwnerCreated: z.literal(false),
}).strict()

const finalJobReportSchema = z.object({
  schemaVersion: z.literal(CAPTION_FINAL_JOB_QUALIFICATION_REPORT_VERSION),
  reportId: safeKey,
  reportDigestSha256: sha256,
  sourceCap18ReportRef: refSchema,
  jobs: z.array(jobItemSchema).length(CAPTIONS_SUPPORTED_JOB_TYPES.length),
  counts: z.object({
    totalDeclaredJobs: z.literal(41),
    admittedPrivateInternal: z.number().int().nonnegative(),
    admittedContractBoundary: z.number().int().nonnegative(),
    conditionalSharedOwnerNotAdmitted: z.number().int().nonnegative(),
  }).strict(),
  sourceFixtureCounts: z.object({
    verifiedPrivate: z.number().int().nonnegative(),
    verifiedContract: z.number().int().nonnegative(),
    missingIntegration: z.number().int().nonnegative(),
    blockedExternal: z.number().int().nonnegative(),
  }).strict(),
  currentAdmittedJobTypes: z.array(jobTypeSchema).max(41),
  conditionalJobTypes: z.array(jobTypeSchema).max(41),
  allDeclaredJobTypesAccountedFor: z.literal(true),
  admittedSurfaceHasNoBlockedJob: z.literal(true),
  conditionalJobsExcludedFromAdmittedSurface: z.literal(true),
  captionOwnedRequirementsComplete: z.literal(true),
  sharedOwnerIntegrationComplete: z.literal(false),
  externalEvidenceComplete: z.literal(true),
  privateInternalSpecialistQualified: z.literal(false),
  productionQualificationClaimed: z.literal(false),
}).strict()

const vulnerabilityCountsSchema = z.object({
  info: z.literal(0),
  low: z.literal(0),
  moderate: z.literal(0),
  high: z.literal(0),
  critical: z.literal(0),
  total: z.literal(0),
}).strict()

const securityReviewSchema = z.object({
  schemaVersion: z.literal(CAPTION_PRIVATE_SECURITY_REVIEW_VERSION),
  reviewId: safeKey,
  reviewDigestSha256: sha256,
  sourceReleaseRef: refSchema,
  observedAt: z.string().datetime({ offset: true }),
  packageLockRef: refSchema,
  productionDependencyAudit: z.object({
    auditLevel: z.literal('high'),
    productionDependencyCount: z.literal(319),
    vulnerabilityCounts: vulnerabilityCountsSchema,
  }).strict(),
  passedCheckIds: z.array(safeKey).min(9).max(32),
  openExternalGateCodes: z.array(safeKey).min(1).max(16),
  closedContractValidationRequired: z.literal(true),
  unsafeTextAndUnknownFieldsRejected: z.literal(true),
  inheritedAccessorAndCycleInputsRejected: z.literal(true),
  tenantAndApprovedSnapshotScopeRequired: z.literal(true),
  rawChatMediaBytesPathsUrlsAndCredentialsSerialized: z.literal(false),
  runtimeNetworkRequiredByCaptionFixture: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  secretValuePrinted: z.literal(false),
  providerOrModelCallMade: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  billingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
  disposition: z.literal(
    'passed_caption_private_boundary_external_lifecycle_gated'),
}).strict()

const dependencyItemSchema = z.object({
  dependencyId: safeKey,
  version: safeKey,
  sourceRef: refSchema,
  licenseIdentity: safeKey,
  privateFixtureUseDisposition: z.enum([
    'reviewed_and_pinned', 'existing_canonical_owner_boundary',
  ]),
  runtimeDownloadAllowed: z.literal(false),
  callerSelectedBinaryOrFontPathAllowed: z.literal(false),
  publicProductionLegalApprovalClaimed: z.literal(false),
  openGateCodes: z.array(safeKey).max(16),
}).strict()

const dependencyReviewSchema = z.object({
  schemaVersion: z.literal(
    CAPTION_PRIVATE_DEPENDENCY_LICENSE_REVIEW_VERSION),
  reviewId: safeKey,
  reviewDigestSha256: sha256,
  sourceReleaseRef: refSchema,
  items: z.array(dependencyItemSchema).length(7),
  reviewedFontPackRef: refSchema,
  remotionPackageLockRef: refSchema,
  exactDependencyInventoryReviewed: z.literal(true),
  captionBundledDependenciesAcceptedForBoundedPrivateFixtures: z.literal(true),
  runtimeDependencyDownloadPerformedByReview: z.literal(false),
  modelWeightIntroducedByCaption: z.literal(false),
  externalProviderDependencyIntroducedByCaption: z.literal(false),
  productionLegalApprovalClaimed: z.literal(false),
  publicDistributionApprovalClaimed: z.literal(false),
  disposition: z.literal(
    'passed_private_internal_with_production_license_gates'),
}).strict()

const performanceEvidenceSchema = z.object({
  schemaVersion: z.literal(
    CAPTION_PRIVATE_PERFORMANCE_COST_EVIDENCE_VERSION),
  evidenceId: safeKey,
  evidenceDigestSha256: sha256,
  sourceCap18ReportRef: refSchema,
  actualPrivateMediaOutputCount: z.literal(9),
  actualRenderedFrameCount: z.literal(1200),
  actualRenderedDurationMilliseconds: z.literal(44000),
  actualDirectlyInspectedFrameCount: z.literal(35),
  standardRemotionResourceProfileId: z.literal(
    'standard_remotion_cpu_2vcpu_4gib_v1'),
  maximumCpuCores: z.literal(2),
  maximumMemoryBytes: z.literal(4294967296),
  maximumRuntimeMilliseconds: z.literal(900000),
  measuredCpuExecutionObserved: z.literal(true),
  deterministicTechnicalQaPassed: z.literal(true),
  providerOrModelCallCount: z.literal(0),
  providerCostMicrousd: z.literal(0),
  creditReservationOrSpendCount: z.literal(0),
  localComputeUnitCostMeasured: z.literal(false),
  customerScaleThroughputBenchmarkPerformed: z.literal(false),
  fullResolutionProductionBenchmarkPerformed: z.literal(false),
  performanceDisposition: z.literal('passed_bounded_private_fixtures_only'),
  costDisposition: z.literal(
    'zero_provider_cost_local_compute_not_unit_costed'),
  estimateAndCreditOwnerRemainsExternal: z.literal(true),
  billingAuthority: z.literal(false),
  productionPerformanceQualified: z.literal(false),
}).strict()

const mountingGuideSchema = z.object({
  schemaVersion: z.literal(CAPTION_FUTURE_ORCHESTRA_MOUNTING_GUIDE_VERSION),
  guideId: safeKey,
  guideDigestSha256: sha256,
  specialistKey: z.literal('captions'),
  specialistManifestRef: refSchema,
  planningQualificationSnapshotRef: refSchema,
  finalJobReportRef: refSchema,
  publicContractVersions: z.object({
    capabilityManifest: z.literal('skill-capability-manifest-v2'),
    qualificationSnapshot: z.literal('skill-qualification-snapshot-v1'),
    skillCall: z.literal('orchestra-skill-call-v1'),
    supportRequest: z.literal('skill-support-request-v1'),
    jobResult: z.literal('orchestra-skill-job-result-v1'),
  }).strict(),
  mountingSteps: z.tuple([
    z.literal('reread_manifest_and_qualification'),
    z.literal('validate_bounded_skill_call'),
    z.literal('invoke_caption_standalone_harness'),
    z.literal('mediate_needs_followup_support_requests'),
    z.literal('inject_authenticated_support_artifacts'),
    z.literal('resume_exact_original_call'),
    z.literal('persist_and_reread_job_result'),
  ]),
  supportTargetSkillKeys: z.tuple([
    z.literal('visual_intelligence'), z.literal('track_all'),
    z.literal('living_frame'), z.literal('soundsync'),
    z.literal('transitions'), z.literal('broll_owner'),
    z.literal('canonical_timing_owner'), z.literal('canonical_layout_owner'),
  ]),
  currentAdmittedJobTypes: z.array(jobTypeSchema).max(41),
  conditionalJobTypes: z.array(jobTypeSchema).max(41),
  mountingReadyForCurrentAdmittedSurface: z.literal(true),
  fullJobSurfaceMountingReady: z.literal(false),
  hqMediatedSupportRequired: z.literal(true),
  directPeerDispatchAllowed: z.literal(false),
  rawChatOrMediaBytesAllowed: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  globalSchedulerImplemented: z.literal(false),
  externalAuthorityPromoted: z.literal(false),
}).strict()

const releaseManifestSchema = z.object({
  schemaVersion: z.literal(CAPTION_PRIVATE_INTERNAL_RELEASE_MANIFEST_VERSION),
  releaseId: safeKey,
  releaseDigestSha256: sha256,
  sourceCommitRef: refSchema,
  sourceCap18ReportRef: refSchema,
  sourceCap19ReleaseRef: refSchema,
  specialistManifestRef: refSchema,
  planningQualificationSnapshotRef: refSchema,
  finalJobReport: finalJobReportSchema,
  securityReview: securityReviewSchema,
  dependencyLicenseReview: dependencyReviewSchema,
  performanceCostEvidence: performanceEvidenceSchema,
  futureOrchestraMountingGuide: mountingGuideSchema,
  sourceRegressionMilestoneIds: z.array(safeKey).length(21),
  fullSourceRegressionPassed: z.literal(true),
  documentationComplete: z.literal(true),
  captionOwnedBoundaryComplete: z.literal(true),
  currentAdmittedSurfaceQualified: z.literal(true),
  conditionalSharedOwnerSurfaceQualified: z.literal(false),
  sharedBackendWorkflowIntegrationRequired: z.literal(true),
  releaseStatus: z.literal('ready_for_shared_pipeline_integration'),
  targetTerminalStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  privateInternalSpecialistQualified: z.literal(false),
  finalGoalCompletionClaimed: z.literal(false),
  noCentralOrchestraImplemented: z.literal(true),
  noRequiredCurrentAdmittedJobBlocked: z.literal(true),
  providerOrModelRuntimeAuthority: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const sharedOwnerKeys = [
  'track_all', 'broll_owner', 'soundsync', 'canonical_transcript',
  'visual_intelligence',
] as const
const sourceReleaseRef: CaptionDomainRef = {
  id: 'captions.specialist.release.cap19.82dda896feb1cd585a6466234614a10482e4b444',
  version: 'captions-specialist-v1',
  contentHash: hashText('82dda896feb1cd585a6466234614a10482e4b444'),
}
const packageLockRef: CaptionDomainRef = {
  id: 'captions.root.package-lock.cap20',
  version: 'npm-package-lock-v3',
  contentHash:
    '9c53f067360f43078c50cae36b519a34eabbbc31ac0ac47fda8c1386c6495c94',
}
const remotionPackageLockRef: CaptionDomainRef = {
  id: 'captions.remotion.package-lock.cap20',
  version: 'offline-remotion-package-lock-v1',
  contentHash:
    '92e1b04002a50bdd9557a7b68226e2e67d27ade8cc27a8a411b3e72c0072ed51',
}
const fontPackRef: CaptionDomainRef = {
  id: 'captions.reviewed.font-pack.cap18',
  version: 'reeditpro_reviewed_fonts_v2',
  contentHash:
    '43bf35b675482f3aeaf9422eb7921f4960ce98d71b33318335b454f2c8887b13',
}
const libassSourceRef: CaptionDomainRef = {
  id: 'captions.libass.source-provenance.cap20',
  version: 'libass-source-provenance-v1',
  contentHash:
    'df9ad84891cf7fe13b2b6f4af92aaa5ec3f0fe9c3cee1f0cfd40f582f7a54c91',
}
const cap18ReportRef: CaptionDomainRef = {
  id: 'caption.private.qualification.cap18.post-runtime',
  version: 'caption-private-qualification-report-v1',
  contentHash:
    '7fe4aa4266d45ddd1cf689e0bc7fbc83b19ace28230fd079c25afe27fe26649e',
}
const passedSecurityCheckIds = [
  'caption_cap03_closed_contract_regression',
  'caption_cap04_transcript_lineage_regression',
  'caption_cap08_visual_support_boundary',
  'caption_cap09_track_all_support_boundary',
  'caption_cap17_authenticated_reread_boundary',
  'caption_cap19_retired_owner_boundary',
  'frontend_server_import_boundary',
  'current_tree_secret_scan',
  'reachable_history_secret_scan',
  'npm_production_high_audit_zero_findings',
] as const
const securityExternalGateCodes = [
  'canonical_shared_provider_lifecycle_persistence_and_private_review',
] as const
const dependencyExpectations = [
  dependency('root_npm_production_graph', 'package-lock-v3', packageLockRef,
    'mixed_spdx_metadata', 'reviewed_and_pinned', [
      'canonical_legal_owner_review_required_before_public_distribution',
    ]),
  dependency('remotion_renderer', '4.0.487', remotionPackageLockRef,
    'Remotion_License', 'reviewed_and_pinned', [
      'remotion_commercial_license_owner_review_before_production',
    ]),
  dependency('libass', '0.17.5', libassSourceRef, 'ISC',
    'reviewed_and_pinned', []),
  dependency('noto_caption_font_pack',
    'reeditpro-reviewed-noto-caption-fonts-2026-08-04-v1', fontPackRef,
    'SIL-OFL-1.1', 'reviewed_and_pinned', []),
  dependency('fonttools', '4.38.0', fontPackRef, 'MIT',
    'reviewed_and_pinned', []),
  dependency('opentype_sanitizer', '8.2.1', fontPackRef,
    'BSD-3-Clause', 'reviewed_and_pinned', []),
  dependency('ffmpeg_packaging_owner',
    'tool.ffmpeg.execute_approved_media_recipe.v1',
    ref('captions.ffmpeg.canonical-owner.cap20',
      'canonical-ffmpeg-operation-v1'), 'canonical_owner_license_policy',
    'existing_canonical_owner_boundary', [
      'ffmpeg_codec_patent_and_lgpl_owner_review_before_production',
    ]),
] as const

const specialistManifestRef: CaptionDomainRef = {
  id: CAPTIONS_SPECIALIST_MANIFEST.manifestId,
  version: CAPTIONS_SPECIALIST_MANIFEST.manifestSchemaVersion,
  contentHash: CAPTIONS_SPECIALIST_MANIFEST.manifestHash,
}
const planningQualificationSnapshotRef: CaptionDomainRef = {
  id: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotId,
  version: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.schemaVersion,
  contentHash:
    CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotDigestSha256,
}

export const CAPTION_CAP20_SECURITY_REVIEW = parseCaptionPrivateSecurityReview(
  withDigest({
    schemaVersion: CAPTION_PRIVATE_SECURITY_REVIEW_VERSION,
    reviewId: 'captions.private.security.review.cap20',
    sourceReleaseRef,
    observedAt: '2026-08-04T23:58:00.000-04:00',
    packageLockRef,
    productionDependencyAudit: {
      auditLevel: 'high',
      productionDependencyCount: 319,
      vulnerabilityCounts: {
        info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0,
      },
    },
    passedCheckIds: [...passedSecurityCheckIds],
    openExternalGateCodes: [...securityExternalGateCodes],
    closedContractValidationRequired: true,
    unsafeTextAndUnknownFieldsRejected: true,
    inheritedAccessorAndCycleInputsRejected: true,
    tenantAndApprovedSnapshotScopeRequired: true,
    rawChatMediaBytesPathsUrlsAndCredentialsSerialized: false,
    runtimeNetworkRequiredByCaptionFixture: false,
    browserLocalCompletionAccepted: false,
    secretValuePrinted: false,
    providerOrModelCallMade: false,
    operationDispatchAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
    disposition: 'passed_caption_private_boundary_external_lifecycle_gated',
  }, 'reviewDigestSha256'))

export const CAPTION_CAP20_DEPENDENCY_LICENSE_REVIEW =
parseCaptionPrivateDependencyLicenseReview(withDigest({
  schemaVersion: CAPTION_PRIVATE_DEPENDENCY_LICENSE_REVIEW_VERSION,
  reviewId: 'captions.private.dependency.license.review.cap20',
  sourceReleaseRef,
  items: dependencyExpectations.map((item) => structuredClone(item)),
  reviewedFontPackRef: fontPackRef,
  remotionPackageLockRef,
  exactDependencyInventoryReviewed: true,
  captionBundledDependenciesAcceptedForBoundedPrivateFixtures: true,
  runtimeDependencyDownloadPerformedByReview: false,
  modelWeightIntroducedByCaption: false,
  externalProviderDependencyIntroducedByCaption: false,
  productionLegalApprovalClaimed: false,
  publicDistributionApprovalClaimed: false,
  disposition: 'passed_private_internal_with_production_license_gates',
}, 'reviewDigestSha256'))

export function createCaptionFinalJobQualificationReport(input: {
  reportId: string
  cap18Report: unknown
}): CaptionFinalJobQualificationReport {
  assertClosedContractTree(input, 'Caption final job report input')
  const source = parseCaptionPrivateQualificationReport(input.cap18Report)
  if (!source.captionOwnedRequirementsComplete
    || source.sharedOwnerIntegrationComplete
    || !source.externalEvidenceComplete
    || source.counts.totalJobs !== 41
    || source.counts.verifiedPrivate !== 10
    || source.counts.verifiedContract !== 6
    || source.counts.missingIntegration !== 7
    || source.counts.blockedExternal !== 0
    || !sameRef(ref(source.reportId, source.schemaVersion,
      source.reportDigestSha256), cap18ReportRef)) {
    throw new Error('CAP-20 requires the exact accepted CAP-18 source state.')
  }
  const jobs = source.jobEvidenceSet.jobs.map((job) => {
    if (job.disposition === 'blocked_external_evidence') {
      throw new Error('CAP-20 cannot admit externally blocked Caption work.')
    }
    const fixtures = source.fixtureResults.filter((fixture) =>
      fixture.requiredJobTypes.includes(job.jobType))
    const owners = unique(fixtures.filter((fixture) =>
      fixture.disposition === 'missing_integration')
      .flatMap((fixture) => fixture.ownerIds)
      .filter((owner): owner is typeof sharedOwnerKeys[number] =>
        sharedOwnerKeys.includes(owner as typeof sharedOwnerKeys[number])))
    const admission: CaptionFinalJobAdmission =
      job.disposition === 'qualified_private_evidence'
        ? 'admitted_private_internal'
        : job.disposition === 'qualified_contract_evidence'
          ? 'admitted_contract_boundary'
          : 'conditional_shared_owner_not_admitted'
    return {
      jobType: job.jobType,
      sourceDisposition: job.disposition,
      admission,
      supportingFixtureIds: unique(fixtures.map((item) => item.fixtureId)),
      evidenceRefs: uniqueRefs([
        ...job.evidenceRefs, ...fixtures.flatMap((item) => item.evidenceRefs),
      ]),
      blockerCodes: unique(job.blockerCodes),
      sharedOwnerKeys: owners,
      fallbackOrRepairCodes: unique(fixtures.flatMap((item) =>
        item.fallbackOrRepairCodes)),
      planningModeQualified: true,
      captionOwnedImplementationComplete: true,
      requiredForCurrentAdmittedSurface:
        admission !== 'conditional_shared_owner_not_admitted',
      runtimeOwnershipTransferredToCaption: false,
      duplicateSharedOwnerCreated: false,
    } satisfies CaptionFinalJobQualificationItem
  })
  const currentAdmittedJobTypes = jobs.filter((job) =>
    job.admission !== 'conditional_shared_owner_not_admitted')
    .map((job) => job.jobType)
  const conditionalJobTypes = jobs.filter((job) =>
    job.admission === 'conditional_shared_owner_not_admitted')
    .map((job) => job.jobType)
  return parseCaptionFinalJobQualificationReport(withDigest({
    schemaVersion: CAPTION_FINAL_JOB_QUALIFICATION_REPORT_VERSION,
    reportId: safeKey.parse(input.reportId),
    sourceCap18ReportRef: ref(source.reportId, source.schemaVersion,
      source.reportDigestSha256),
    jobs,
    counts: {
      totalDeclaredJobs: 41,
      admittedPrivateInternal: jobs.filter((job) =>
        job.admission === 'admitted_private_internal').length,
      admittedContractBoundary: jobs.filter((job) =>
        job.admission === 'admitted_contract_boundary').length,
      conditionalSharedOwnerNotAdmitted: conditionalJobTypes.length,
    },
    sourceFixtureCounts: {
      verifiedPrivate: source.counts.verifiedPrivate,
      verifiedContract: source.counts.verifiedContract,
      missingIntegration: source.counts.missingIntegration,
      blockedExternal: source.counts.blockedExternal,
    },
    currentAdmittedJobTypes,
    conditionalJobTypes,
    allDeclaredJobTypesAccountedFor: true,
    admittedSurfaceHasNoBlockedJob: true,
    conditionalJobsExcludedFromAdmittedSurface: true,
    captionOwnedRequirementsComplete: true,
    sharedOwnerIntegrationComplete: false,
    externalEvidenceComplete: true,
    privateInternalSpecialistQualified: false,
    productionQualificationClaimed: false,
  }, 'reportDigestSha256'))
}

export function createCaptionPrivatePerformanceCostEvidence(input: {
  sourceCap18ReportRef: CaptionDomainRef
}): CaptionPrivatePerformanceCostEvidence {
  assertClosedContractTree(input, 'Caption private performance input')
  if (!sameRef(input.sourceCap18ReportRef, cap18ReportRef)) {
    throw new Error('Caption performance evidence requires exact CAP-18 lineage.')
  }
  return parseCaptionPrivatePerformanceCostEvidence(withDigest({
    schemaVersion: CAPTION_PRIVATE_PERFORMANCE_COST_EVIDENCE_VERSION,
    evidenceId: 'captions.private.performance.cost.cap20',
    sourceCap18ReportRef: refSchema.parse(input.sourceCap18ReportRef),
    actualPrivateMediaOutputCount: 9,
    actualRenderedFrameCount: 1200,
    actualRenderedDurationMilliseconds: 44000,
    actualDirectlyInspectedFrameCount: 35,
    standardRemotionResourceProfileId:
      'standard_remotion_cpu_2vcpu_4gib_v1',
    maximumCpuCores: 2,
    maximumMemoryBytes: 4294967296,
    maximumRuntimeMilliseconds: 900000,
    measuredCpuExecutionObserved: true,
    deterministicTechnicalQaPassed: true,
    providerOrModelCallCount: 0,
    providerCostMicrousd: 0,
    creditReservationOrSpendCount: 0,
    localComputeUnitCostMeasured: false,
    customerScaleThroughputBenchmarkPerformed: false,
    fullResolutionProductionBenchmarkPerformed: false,
    performanceDisposition: 'passed_bounded_private_fixtures_only',
    costDisposition: 'zero_provider_cost_local_compute_not_unit_costed',
    estimateAndCreditOwnerRemainsExternal: true,
    billingAuthority: false,
    productionPerformanceQualified: false,
  }, 'evidenceDigestSha256'))
}

export function createCaptionFutureOrchestraMountingGuide(input: {
  finalJobReport: unknown
}): CaptionFutureOrchestraMountingGuide {
  assertClosedContractTree(input, 'Caption future Orchestra guide input')
  const report = parseCaptionFinalJobQualificationReport(input.finalJobReport)
  return parseCaptionFutureOrchestraMountingGuide(withDigest({
    schemaVersion: CAPTION_FUTURE_ORCHESTRA_MOUNTING_GUIDE_VERSION,
    guideId: 'captions.future.orchestra.mounting.guide.cap20',
    specialistKey: 'captions',
    specialistManifestRef,
    planningQualificationSnapshotRef,
    finalJobReportRef: ref(report.reportId, report.schemaVersion,
      report.reportDigestSha256),
    publicContractVersions: {
      capabilityManifest: 'skill-capability-manifest-v2',
      qualificationSnapshot: 'skill-qualification-snapshot-v1',
      skillCall: 'orchestra-skill-call-v1',
      supportRequest: 'skill-support-request-v1',
      jobResult: 'orchestra-skill-job-result-v1',
    },
    mountingSteps: [
      'reread_manifest_and_qualification',
      'validate_bounded_skill_call',
      'invoke_caption_standalone_harness',
      'mediate_needs_followup_support_requests',
      'inject_authenticated_support_artifacts',
      'resume_exact_original_call',
      'persist_and_reread_job_result',
    ],
    supportTargetSkillKeys: [
      'visual_intelligence', 'track_all', 'living_frame', 'soundsync',
      'transitions', 'broll_owner', 'canonical_timing_owner',
      'canonical_layout_owner',
    ],
    currentAdmittedJobTypes: [...report.currentAdmittedJobTypes],
    conditionalJobTypes: [...report.conditionalJobTypes],
    mountingReadyForCurrentAdmittedSurface: true,
    fullJobSurfaceMountingReady: false,
    hqMediatedSupportRequired: true,
    directPeerDispatchAllowed: false,
    rawChatOrMediaBytesAllowed: false,
    centralOrchestraImplemented: false,
    globalSchedulerImplemented: false,
    externalAuthorityPromoted: false,
  }, 'guideDigestSha256'))
}

export function createCaptionPrivateInternalReleaseManifest(input: {
  releaseId: string
  sourceCommitRef: CaptionDomainRef
  finalJobReport: unknown
  performanceCostEvidence: unknown
  futureOrchestraMountingGuide: unknown
  sourceRegressionMilestoneIds: string[]
}): CaptionPrivateInternalReleaseManifest {
  assertClosedContractTree(input, 'Caption private release input')
  const report = parseCaptionFinalJobQualificationReport(input.finalJobReport)
  const performance = parseCaptionPrivatePerformanceCostEvidence(
    input.performanceCostEvidence)
  const guide = parseCaptionFutureOrchestraMountingGuide(
    input.futureOrchestraMountingGuide)
  if (!sameRef(input.sourceCommitRef, sourceReleaseRef)) {
    throw new Error('Caption private release source foundation is stale.')
  }
  return parseCaptionPrivateInternalReleaseManifest(withDigest({
    schemaVersion: CAPTION_PRIVATE_INTERNAL_RELEASE_MANIFEST_VERSION,
    releaseId: safeKey.parse(input.releaseId),
    sourceCommitRef: refSchema.parse(input.sourceCommitRef),
    sourceCap18ReportRef: report.sourceCap18ReportRef,
    sourceCap19ReleaseRef: ref(
      CAPTION_MIGRATION_RETIREMENT_RELEASE.releaseId,
      CAPTION_MIGRATION_RETIREMENT_RELEASE.schemaVersion,
      CAPTION_MIGRATION_RETIREMENT_RELEASE.releaseDigestSha256),
    specialistManifestRef,
    planningQualificationSnapshotRef,
    finalJobReport: report,
    securityReview: CAPTION_CAP20_SECURITY_REVIEW,
    dependencyLicenseReview: CAPTION_CAP20_DEPENDENCY_LICENSE_REVIEW,
    performanceCostEvidence: performance,
    futureOrchestraMountingGuide: guide,
    sourceRegressionMilestoneIds: [...input.sourceRegressionMilestoneIds],
    fullSourceRegressionPassed: true,
    documentationComplete: true,
    captionOwnedBoundaryComplete: true,
    currentAdmittedSurfaceQualified: true,
    conditionalSharedOwnerSurfaceQualified: false,
    sharedBackendWorkflowIntegrationRequired: true,
    releaseStatus: 'ready_for_shared_pipeline_integration',
    targetTerminalStatus: 'caption_specialist_private_internal_qualified',
    privateInternalSpecialistQualified: false,
    finalGoalCompletionClaimed: false,
    noCentralOrchestraImplemented: true,
    noRequiredCurrentAdmittedJobBlocked: true,
    providerOrModelRuntimeAuthority: false,
    operationDispatchAuthority: false,
    assetMutationAuthority: false,
    finalQaApprovalAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }, 'releaseDigestSha256'))
}

export function parseCaptionFinalJobQualificationReport(
  value: unknown,
): CaptionFinalJobQualificationReport {
  assertClosedContractTree(value, 'Caption final job report')
  const parsed = finalJobReportSchema.parse(value)
  verifyDigest(parsed as Record<string, unknown>, 'reportDigestSha256',
    'Caption final job report')
  const expectedOrder = CAPTIONS_SUPPORTED_JOB_TYPES.join('|')
  const current = parsed.jobs.filter((job) =>
    job.admission !== 'conditional_shared_owner_not_admitted')
  const conditional = parsed.jobs.filter((job) =>
    job.admission === 'conditional_shared_owner_not_admitted')
  if (parsed.jobs.map((job) => job.jobType).join('|') !== expectedOrder
    || !sameRef(parsed.sourceCap18ReportRef, cap18ReportRef)
    || parsed.currentAdmittedJobTypes.join('|')
      !== current.map((job) => job.jobType).join('|')
    || parsed.conditionalJobTypes.join('|')
      !== conditional.map((job) => job.jobType).join('|')
    || parsed.counts.admittedPrivateInternal !== parsed.jobs.filter((job) =>
      job.admission === 'admitted_private_internal').length
    || parsed.counts.admittedContractBoundary !== parsed.jobs.filter((job) =>
      job.admission === 'admitted_contract_boundary').length
    || parsed.counts.conditionalSharedOwnerNotAdmitted !== conditional.length
    || parsed.counts.admittedPrivateInternal !== 25
    || parsed.counts.admittedContractBoundary !== 4
    || parsed.counts.conditionalSharedOwnerNotAdmitted !== 12
    || parsed.sourceFixtureCounts.verifiedPrivate !== 10
    || parsed.sourceFixtureCounts.verifiedContract !== 6
    || parsed.sourceFixtureCounts.missingIntegration !== 7
    || parsed.sourceFixtureCounts.blockedExternal !== 0
    || parsed.jobs.some((job) => !uniqueLists(job)
      || !validJobAdmission(job))) {
    throw new Error('Caption final job qualification semantics are invalid.')
  }
  return structuredClone(parsed)
}

export function parseCaptionPrivateSecurityReview(
  value: unknown,
): CaptionPrivateSecurityReview {
  assertClosedContractTree(value, 'Caption private security review')
  const parsed = securityReviewSchema.parse(value)
  verifyDigest(parsed as Record<string, unknown>, 'reviewDigestSha256',
    'Caption private security review')
  if (new Set(parsed.passedCheckIds).size !== parsed.passedCheckIds.length
    || new Set(parsed.openExternalGateCodes).size
      !== parsed.openExternalGateCodes.length
    || !sameRef(parsed.sourceReleaseRef, sourceReleaseRef)
    || !sameRef(parsed.packageLockRef, packageLockRef)
    || parsed.passedCheckIds.join('|') !== passedSecurityCheckIds.join('|')
    || parsed.openExternalGateCodes.join('|')
      !== securityExternalGateCodes.join('|')) {
    throw new Error('Caption private security review lineage is invalid.')
  }
  return structuredClone(parsed)
}

export function parseCaptionPrivateDependencyLicenseReview(
  value: unknown,
): CaptionPrivateDependencyLicenseReview {
  assertClosedContractTree(value, 'Caption dependency/license review')
  const parsed = dependencyReviewSchema.parse(value)
  verifyDigest(parsed as Record<string, unknown>, 'reviewDigestSha256',
    'Caption dependency/license review')
  if (JSON.stringify(parsed.items) !== JSON.stringify(dependencyExpectations)
    || !sameRef(parsed.sourceReleaseRef, sourceReleaseRef)
    || !sameRef(parsed.reviewedFontPackRef, fontPackRef)
    || !sameRef(parsed.remotionPackageLockRef, remotionPackageLockRef)
    || parsed.items.some((item) =>
      new Set(item.openGateCodes).size !== item.openGateCodes.length)) {
    throw new Error('Caption dependency/license review lineage is invalid.')
  }
  return structuredClone(parsed)
}

export function parseCaptionPrivatePerformanceCostEvidence(
  value: unknown,
): CaptionPrivatePerformanceCostEvidence {
  assertClosedContractTree(value, 'Caption performance/cost evidence')
  const parsed = performanceEvidenceSchema.parse(value)
  verifyDigest(parsed as Record<string, unknown>, 'evidenceDigestSha256',
    'Caption performance/cost evidence')
  if (!sameRef(parsed.sourceCap18ReportRef, cap18ReportRef)) {
    throw new Error('Caption performance evidence lineage is stale.')
  }
  return structuredClone(parsed)
}

export function parseCaptionFutureOrchestraMountingGuide(
  value: unknown,
): CaptionFutureOrchestraMountingGuide {
  assertClosedContractTree(value, 'Caption future Orchestra guide')
  const parsed = mountingGuideSchema.parse(value)
  verifyDigest(parsed as Record<string, unknown>, 'guideDigestSha256',
    'Caption future Orchestra guide')
  if (!sameRef(parsed.specialistManifestRef, specialistManifestRef)
    || !sameRef(parsed.planningQualificationSnapshotRef,
      planningQualificationSnapshotRef)
    || parsed.currentAdmittedJobTypes.length !== 29
    || parsed.conditionalJobTypes.length !== 12
    || new Set([...parsed.currentAdmittedJobTypes,
      ...parsed.conditionalJobTypes]).size !== 41) {
    throw new Error('Caption future Orchestra guide lineage is invalid.')
  }
  return structuredClone(parsed)
}

export function parseCaptionPrivateInternalReleaseManifest(
  value: unknown,
): CaptionPrivateInternalReleaseManifest {
  assertClosedContractTree(value, 'Caption private release manifest')
  const parsed = releaseManifestSchema.parse(value)
  verifyDigest(parsed as Record<string, unknown>, 'releaseDigestSha256',
    'Caption private release manifest')
  const jobs = parseCaptionFinalJobQualificationReport(parsed.finalJobReport)
  const security = parseCaptionPrivateSecurityReview(parsed.securityReview)
  const dependencies = parseCaptionPrivateDependencyLicenseReview(
    parsed.dependencyLicenseReview)
  const performance = parseCaptionPrivatePerformanceCostEvidence(
    parsed.performanceCostEvidence)
  const guide = parseCaptionFutureOrchestraMountingGuide(
    parsed.futureOrchestraMountingGuide)
  const expectedMilestones = [
    'CAP-00R', ...Array.from({ length: 20 }, (_, index) =>
      `CAP-${String(index + 1).padStart(2, '0')}`),
  ]
  if (parsed.sourceRegressionMilestoneIds.join('|')
      !== expectedMilestones.join('|')
    || !sameRef(parsed.sourceCommitRef, sourceReleaseRef)
    || !sameRef(parsed.sourceCap18ReportRef, jobs.sourceCap18ReportRef)
    || !sameRef(parsed.specialistManifestRef, specialistManifestRef)
    || !sameRef(parsed.planningQualificationSnapshotRef,
      planningQualificationSnapshotRef)
    || !sameRef(parsed.futureOrchestraMountingGuide.finalJobReportRef,
      ref(jobs.reportId, jobs.schemaVersion, jobs.reportDigestSha256))
    || parsed.futureOrchestraMountingGuide.currentAdmittedJobTypes.join('|')
      !== jobs.currentAdmittedJobTypes.join('|')
    || parsed.futureOrchestraMountingGuide.conditionalJobTypes.join('|')
      !== jobs.conditionalJobTypes.join('|')
    || !sameRef(performance.sourceCap18ReportRef,
      parsed.sourceCap18ReportRef)
    || !sameRef(parsed.sourceCap19ReleaseRef, ref(
      CAPTION_MIGRATION_RETIREMENT_RELEASE.releaseId,
      CAPTION_MIGRATION_RETIREMENT_RELEASE.schemaVersion,
      CAPTION_MIGRATION_RETIREMENT_RELEASE.releaseDigestSha256))) {
    throw new Error('Caption private release lineage is inconsistent.')
  }
  return structuredClone({
    ...parsed,
    finalJobReport: jobs,
    securityReview: security,
    dependencyLicenseReview: dependencies,
    performanceCostEvidence: performance,
    futureOrchestraMountingGuide: guide,
  }) as CaptionPrivateInternalReleaseManifest
}

function validJobAdmission(job: CaptionFinalJobQualificationItem): boolean {
  if (job.admission === 'admitted_private_internal') {
    return job.sourceDisposition === 'qualified_private_evidence'
      && job.requiredForCurrentAdmittedSurface
      && job.blockerCodes.length === 0 && job.sharedOwnerKeys.length === 0
  }
  if (job.admission === 'admitted_contract_boundary') {
    return job.sourceDisposition === 'qualified_contract_evidence'
      && job.requiredForCurrentAdmittedSurface
      && job.blockerCodes.length === 0 && job.sharedOwnerKeys.length === 0
  }
  return job.sourceDisposition === 'blocked_shared_dependency'
    && !job.requiredForCurrentAdmittedSurface
    && job.blockerCodes.length > 0 && job.sharedOwnerKeys.length > 0
}

function uniqueLists(job: CaptionFinalJobQualificationItem): boolean {
  return new Set(job.supportingFixtureIds).size
      === job.supportingFixtureIds.length
    && new Set(job.evidenceRefs.map(refKey)).size === job.evidenceRefs.length
    && new Set(job.blockerCodes).size === job.blockerCodes.length
    && new Set(job.sharedOwnerKeys).size === job.sharedOwnerKeys.length
    && new Set(job.fallbackOrRepairCodes).size
      === job.fallbackOrRepairCodes.length
}

function dependency(
  dependencyId: string,
  version: string,
  sourceRef: CaptionDomainRef,
  licenseIdentity: string,
  disposition: 'reviewed_and_pinned' | 'existing_canonical_owner_boundary',
  openGateCodes: string[],
): CaptionPrivateDependencyLicenseReview['items'][number] {
  return {
    dependencyId, version, sourceRef, licenseIdentity,
    privateFixtureUseDisposition: disposition,
    runtimeDownloadAllowed: false,
    callerSelectedBinaryOrFontPathAllowed: false,
    publicProductionLegalApprovalClaimed: false,
    openGateCodes,
  }
}

function withDigest<T extends Record<string, unknown>>(
  value: T,
  field: string,
): T & Record<string, string> {
  return {
    ...value,
    [field]: calculateSkillContractDigest({ ...value, [field]: '' }, field),
  }
}

function verifyDigest(
  value: Record<string, unknown>,
  field: string,
  label: string,
): void {
  if (calculateSkillContractDigest(value, field) !== value[field]) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function ref(id: string, version: string, contentHash = hashText(id)):
CaptionDomainRef {
  return { id, version, contentHash }
}

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function uniqueRefs(values: CaptionDomainRef[]): CaptionDomainRef[] {
  const refs = new Map(values.map((value) => [refKey(value), value]))
  return [...refs.values()].map((value) => structuredClone(value))
}
