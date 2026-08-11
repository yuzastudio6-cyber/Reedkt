import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  CAPTION_CAP20_DEPENDENCY_LICENSE_REVIEW,
  CAPTION_CAP20_SECURITY_REVIEW,
  createCaptionFinalJobQualificationReport,
  createCaptionFutureOrchestraMountingGuide,
  createCaptionPrivateInternalReleaseManifest,
  createCaptionPrivatePerformanceCostEvidence,
  parseCaptionFinalJobQualificationReport,
  parseCaptionFutureOrchestraMountingGuide,
  parseCaptionPrivateDependencyLicenseReview,
  parseCaptionPrivateInternalReleaseManifest,
  parseCaptionPrivatePerformanceCostEvidence,
  parseCaptionPrivateSecurityReview,
} from '../captions-specialist/caption-private-internal-release'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  CAP_18_POST_RUNTIME_QUALIFICATION_REPORT_FIXTURE,
} from './captions-specialist-cap-18-smoke'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function sourceRef(): CaptionDomainRef {
  const commit = '82dda896feb1cd585a6466234614a10482e4b444'
  return {
    id: `captions.specialist.release.cap19.${commit}`,
    version: 'captions-specialist-v1',
    contentHash: hash(commit),
  }
}
function redigest(value: unknown, field: string): Record<string, unknown> {
  const record = structuredClone(value) as Record<string, unknown>
  record[field] = calculateSkillContractDigest(record, field)
  return record
}
function changed(value: unknown, edit: (record: Record<string, unknown>) => void):
Record<string, unknown> {
  const record = structuredClone(value) as Record<string, unknown>
  edit(record)
  return record
}

export const CAP_20_FINAL_JOB_REPORT_FIXTURE =
createCaptionFinalJobQualificationReport({
  reportId: 'captions.final.job.qualification.cap20',
  cap18Report: CAP_18_POST_RUNTIME_QUALIFICATION_REPORT_FIXTURE,
})

export const CAP_20_PERFORMANCE_COST_EVIDENCE_FIXTURE =
createCaptionPrivatePerformanceCostEvidence({
  sourceCap18ReportRef:
    CAP_20_FINAL_JOB_REPORT_FIXTURE.sourceCap18ReportRef,
})

export const CAP_20_FUTURE_ORCHESTRA_MOUNTING_GUIDE_FIXTURE =
createCaptionFutureOrchestraMountingGuide({
  finalJobReport: CAP_20_FINAL_JOB_REPORT_FIXTURE,
})

const milestoneIds = [
  'CAP-00R', ...Array.from({ length: 20 }, (_, index) =>
    `CAP-${String(index + 1).padStart(2, '0')}`),
]

export const CAP_20_PRIVATE_INTERNAL_RELEASE_MANIFEST_FIXTURE =
createCaptionPrivateInternalReleaseManifest({
  releaseId: 'captions.private.internal.release.cap20',
  sourceCommitRef: sourceRef(),
  finalJobReport: CAP_20_FINAL_JOB_REPORT_FIXTURE,
  performanceCostEvidence: CAP_20_PERFORMANCE_COST_EVIDENCE_FIXTURE,
  futureOrchestraMountingGuide:
    CAP_20_FUTURE_ORCHESTRA_MOUNTING_GUIDE_FIXTURE,
  sourceRegressionMilestoneIds: milestoneIds,
})

const report = parseCaptionFinalJobQualificationReport(
  CAP_20_FINAL_JOB_REPORT_FIXTURE)
const release = parseCaptionPrivateInternalReleaseManifest(
  CAP_20_PRIVATE_INTERNAL_RELEASE_MANIFEST_FIXTURE)

check(report.jobs.length === 41
  && report.counts.admittedPrivateInternal === 25
  && report.counts.admittedContractBoundary === 4
  && report.counts.conditionalSharedOwnerNotAdmitted === 12,
'CAP-20 must account for all 41 jobs as 25 private, four contract, and 12 conditional.')
check(report.currentAdmittedJobTypes.length === 29
  && report.conditionalJobTypes.length === 12
  && new Set([...report.currentAdmittedJobTypes,
    ...report.conditionalJobTypes]).size === 41,
'The current and conditional surfaces must be disjoint and exhaustive.')
check(report.jobs.filter((job) => job.requiredForCurrentAdmittedSurface)
  .every((job) => job.admission !== 'conditional_shared_owner_not_admitted'
    && job.blockerCodes.length === 0 && job.sharedOwnerKeys.length === 0),
'No admitted job may carry a blocker or shared-owner dependency.')
check(report.jobs.filter((job) => !job.requiredForCurrentAdmittedSurface)
  .every((job) => job.admission === 'conditional_shared_owner_not_admitted'
    && job.blockerCodes.length > 0 && job.sharedOwnerKeys.length > 0),
'Every excluded conditional job must name its blocker and shared owner.')

const expectedConditionalJobs = [
  'plan_caption_blocking_preview',
  'resolve_multi_track_caption_scene',
  'resolve_spatial_typography',
  'resolve_subject_occluded_typography',
  'resolve_front_of_subject_typography',
  'resolve_object_anchored_typography',
  'resolve_environmental_typography',
  'provide_typographic_transition_support',
  'prepare_caption_boundary_timing_requirements',
  'provide_caption_safe_region_constraints',
  'provide_typographic_transition_component',
  'provide_caption_broll_composition_constraints',
]
check(report.conditionalJobTypes.join('|') === expectedConditionalJobs.join('|'),
  'The exact 12 shared-owner-dependent jobs must remain conditional.')
check([...new Set(report.jobs.flatMap((job) => job.sharedOwnerKeys))].join('|')
  === 'visual_intelligence|canonical_transcript|track_all|soundsync|broll_owner',
'The blocked surface must identify only the five actual shared owners.')
check(report.sourceFixtureCounts.verifiedPrivate === 10
  && report.sourceFixtureCounts.verifiedContract === 6
  && report.sourceFixtureCounts.missingIntegration === 7
  && report.sourceFixtureCounts.blockedExternal === 0,
'CAP-20 must preserve the exact CAP-18 fixture disposition counts.')
check(report.captionOwnedRequirementsComplete
  && report.admittedSurfaceHasNoBlockedJob
  && report.conditionalJobsExcludedFromAdmittedSurface
  && !report.sharedOwnerIntegrationComplete
  && !report.privateInternalSpecialistQualified,
'Caption-owned completion must not be relabeled as whole-specialist completion.')

const security = parseCaptionPrivateSecurityReview(
  CAPTION_CAP20_SECURITY_REVIEW)
check(security.productionDependencyAudit.productionDependencyCount === 319
  && security.productionDependencyAudit.vulnerabilityCounts.total === 0,
'The point-in-time production dependency audit must record zero findings.')
check(security.passedCheckIds.length === 10
  && security.closedContractValidationRequired
  && security.unsafeTextAndUnknownFieldsRejected
  && security.inheritedAccessorAndCycleInputsRejected,
'The security review must bind contract, boundary, secret, and audit checks.')
check(!security.rawChatMediaBytesPathsUrlsAndCredentialsSerialized
  && !security.runtimeNetworkRequiredByCaptionFixture
  && !security.browserLocalCompletionAccepted
  && !security.secretValuePrinted,
'Private Caption evidence must remain byte-free, path-free, offline, and reread-owned.')
check(!security.providerOrModelCallMade
  && !security.operationDispatchAuthority
  && !security.billingAuthority
  && !security.publicDeliveryAuthority
  && !security.productionAuthority,
'The security review cannot promote external authority.')

const dependencies = parseCaptionPrivateDependencyLicenseReview(
  CAPTION_CAP20_DEPENDENCY_LICENSE_REVIEW)
check(dependencies.items.length === 7
  && dependencies.items.map((item) => item.dependencyId).join('|')
    === 'root_npm_production_graph|remotion_renderer|libass|noto_caption_font_pack|fonttools|opentype_sanitizer|ffmpeg_packaging_owner',
'Dependency review must cover the exact seven Caption/runtime owner records.')
check(dependencies.items.find((item) => item.dependencyId === 'libass')
  ?.licenseIdentity === 'ISC'
  && dependencies.items.find((item) =>
    item.dependencyId === 'noto_caption_font_pack')?.licenseIdentity
      === 'SIL-OFL-1.1',
'libass and the reviewed Noto font pack must retain their exact licenses.')
check(dependencies.items.find((item) => item.dependencyId === 'remotion_renderer')
  ?.openGateCodes.includes(
    'remotion_commercial_license_owner_review_before_production')
  && dependencies.items.find((item) =>
    item.dependencyId === 'ffmpeg_packaging_owner')?.openGateCodes.length === 1,
'Remotion and FFmpeg public-production legal gates must remain explicit.')
check(dependencies.items.every((item) => !item.runtimeDownloadAllowed
  && !item.callerSelectedBinaryOrFontPathAllowed
  && !item.publicProductionLegalApprovalClaimed)
  && !dependencies.productionLegalApprovalClaimed
  && !dependencies.publicDistributionApprovalClaimed,
'Private dependency review must not claim public legal or distribution approval.')

const performance = parseCaptionPrivatePerformanceCostEvidence(
  CAP_20_PERFORMANCE_COST_EVIDENCE_FIXTURE)
check(performance.actualPrivateMediaOutputCount === 9
  && performance.actualRenderedFrameCount === 1200
  && performance.actualRenderedDurationMilliseconds === 44000
  && performance.actualDirectlyInspectedFrameCount === 35,
'Performance evidence must bind the exact nine outputs, 1,200 frames, 44 seconds, and 35 opened frames.')
check(performance.maximumCpuCores === 2
  && performance.maximumMemoryBytes === 4294967296
  && performance.maximumRuntimeMilliseconds === 900000
  && performance.measuredCpuExecutionObserved,
'Bounded Remotion evidence must retain its 2-vCPU, 4-GiB, 15-minute profile.')
check(performance.providerOrModelCallCount === 0
  && performance.providerCostMicrousd === 0
  && performance.creditReservationOrSpendCount === 0
  && !performance.localComputeUnitCostMeasured,
'CAP-20 must distinguish zero provider cost from unmeasured local unit cost.')
check(!performance.customerScaleThroughputBenchmarkPerformed
  && !performance.fullResolutionProductionBenchmarkPerformed
  && !performance.productionPerformanceQualified,
'Private proxy evidence cannot claim customer-scale production performance.')

const guide = parseCaptionFutureOrchestraMountingGuide(
  CAP_20_FUTURE_ORCHESTRA_MOUNTING_GUIDE_FIXTURE)
check(guide.publicContractVersions.capabilityManifest
  === 'skill-capability-manifest-v2'
  && guide.publicContractVersions.skillCall === 'orchestra-skill-call-v1'
  && guide.publicContractVersions.supportRequest === 'skill-support-request-v1'
  && guide.publicContractVersions.jobResult === 'orchestra-skill-job-result-v1',
'The future mount must use the neutral public specialist contract family.')
check(guide.mountingSteps.length === 7
  && guide.supportTargetSkillKeys.length === 8
  && guide.hqMediatedSupportRequired
  && !guide.directPeerDispatchAllowed,
'The mount must mediate support and exact-call resumption through future HQ.')
check(guide.mountingReadyForCurrentAdmittedSurface
  && !guide.fullJobSurfaceMountingReady
  && !guide.centralOrchestraImplemented
  && !guide.globalSchedulerImplemented
  && !guide.externalAuthorityPromoted,
'The guide may be mount-ready without implementing or claiming Orchestra.')

check(release.sourceRegressionMilestoneIds.join('|') === milestoneIds.join('|')
  && release.fullSourceRegressionPassed && release.documentationComplete,
'The release candidate must account for CAP-00R through CAP-20.')
check(release.captionOwnedBoundaryComplete
  && release.currentAdmittedSurfaceQualified
  && !release.conditionalSharedOwnerSurfaceQualified
  && release.sharedBackendWorkflowIntegrationRequired,
'The release must distinguish local completion from shared workflow integration.')
check(release.releaseStatus === 'ready_for_shared_pipeline_integration'
  && release.targetTerminalStatus
    === 'caption_specialist_private_internal_qualified'
  && !release.privateInternalSpecialistQualified
  && !release.finalGoalCompletionClaimed,
'The candidate must not claim the terminal status before shared integrations exist.')
check(release.noCentralOrchestraImplemented
  && release.noRequiredCurrentAdmittedJobBlocked
  && !release.providerOrModelRuntimeAuthority
  && !release.operationDispatchAuthority
  && !release.assetMutationAuthority
  && !release.finalQaApprovalAuthority
  && !release.creditOrBillingAuthority
  && !release.publicDeliveryAuthority
  && !release.productionAuthority,
'CAP-20 must preserve every ownership and authority boundary.')

const requiredDocs = [
  'caption-specialist-amendment.md',
  'implementation-roadmap.md',
  'definition-of-done.md',
  'cap-18-private-qualification-report.md',
  'cap-19-migration-retirement-report.md',
  'cap-20-private-internal-release-report.md',
  'future-orchestra-caption-mounting-guide.md',
]
check(requiredDocs.every((file) => existsSync(join(
  process.cwd(), 'docs', 'caption-direction', file))),
'Every required Caption roadmap, qualification, release, and mounting document must exist.')
const releaseDoc = readFileSync(join(process.cwd(), 'docs',
  'caption-direction', 'cap-20-private-internal-release-report.md'), 'utf8')
check(releaseDoc.includes('29') && releaseDoc.includes('12')
  && releaseDoc.includes('ready_for_shared_pipeline_integration')
  && releaseDoc.includes('caption_specialist_private_internal_qualified')
  && releaseDoc.includes('not yet'),
'CAP-20 documentation must state exact admitted/conditional counts and avoid a false terminal claim.')

expectThrow(() => parseCaptionFinalJobQualificationReport(redigest(changed(
  report, (record) => {
    record.jobs = [...structuredClone(record.jobs) as unknown[]].reverse()
  }), 'reportDigestSha256')))
expectThrow(() => parseCaptionFinalJobQualificationReport(redigest(changed(
  report, (record) => {
    const jobs = structuredClone(record.jobs) as Array<Record<string, unknown>>
    const conditional = jobs.find((job) =>
      job.admission === 'conditional_shared_owner_not_admitted')!
    conditional.admission = 'admitted_private_internal'
    conditional.requiredForCurrentAdmittedSurface = true
    record.jobs = jobs
  }), 'reportDigestSha256')))
expectThrow(() => parseCaptionFinalJobQualificationReport(redigest(changed(
  report, (record) => {
    const jobs = structuredClone(record.jobs) as Array<Record<string, unknown>>
    const conditional = jobs.find((job) =>
      job.admission === 'conditional_shared_owner_not_admitted')!
    conditional.blockerCodes = []
    record.jobs = jobs
  }), 'reportDigestSha256')))
expectThrow(() => parseCaptionFinalJobQualificationReport(redigest(changed(
  report, (record) => {
    const jobs = structuredClone(record.jobs) as Array<Record<string, unknown>>
    const conditional = jobs.find((job) =>
      job.admission === 'conditional_shared_owner_not_admitted')!
    conditional.sharedOwnerKeys = []
    record.jobs = jobs
  }), 'reportDigestSha256')))
expectThrow(() => parseCaptionFinalJobQualificationReport(redigest(changed(
  report, (record) => {
    const jobs = structuredClone(record.jobs) as Array<Record<string, unknown>>
    const evidence = structuredClone(jobs[0]!.evidenceRefs) as unknown[]
    jobs[0]!.evidenceRefs = [...evidence, evidence[0]]
    record.jobs = jobs
  }), 'reportDigestSha256')))
expectThrow(() => parseCaptionFinalJobQualificationReport(redigest(changed(
  report, (record) => {
    record.sourceCap18ReportRef = {
      id: 'caption.private.qualification.cap18.substituted',
      version: 'caption-private-qualification-report-v1',
      contentHash: hash('substituted-cap18'),
    }
  }), 'reportDigestSha256')))
expectThrow(() => parseCaptionFinalJobQualificationReport(redigest(changed(
  report, (record) => { record.privateInternalSpecialistQualified = true }),
'reportDigestSha256')))

expectThrow(() => parseCaptionPrivateSecurityReview(redigest(changed(
  security, (record) => {
    const audit = structuredClone(record.productionDependencyAudit) as
      Record<string, unknown>
    const counts = structuredClone(audit.vulnerabilityCounts) as
      Record<string, unknown>
    counts.high = 1
    counts.total = 1
    audit.vulnerabilityCounts = counts
    record.productionDependencyAudit = audit
  }), 'reviewDigestSha256')))
expectThrow(() => parseCaptionPrivateSecurityReview(redigest(changed(
  security, (record) => { record.providerOrModelCallMade = true }),
'reviewDigestSha256')))
expectThrow(() => parseCaptionPrivateSecurityReview(redigest(changed(
  security, (record) => {
    record.passedCheckIds = [...structuredClone(record.passedCheckIds) as
      string[]].reverse()
  }), 'reviewDigestSha256')))

expectThrow(() => parseCaptionPrivateDependencyLicenseReview(redigest(changed(
  dependencies, (record) => {
    record.items = [...structuredClone(record.items) as unknown[]].reverse()
  }), 'reviewDigestSha256')))
expectThrow(() => parseCaptionPrivateDependencyLicenseReview(redigest(changed(
  dependencies, (record) => {
    const items = structuredClone(record.items) as Array<Record<string, unknown>>
    items[1]!.openGateCodes = []
    record.items = items
  }), 'reviewDigestSha256')))
expectThrow(() => parseCaptionPrivateDependencyLicenseReview(redigest(changed(
  dependencies, (record) => {
    const items = structuredClone(record.items) as Array<Record<string, unknown>>
    items[2]!.runtimeDownloadAllowed = true
    record.items = items
  }), 'reviewDigestSha256')))
expectThrow(() => parseCaptionPrivateDependencyLicenseReview(redigest(changed(
  dependencies,
  (record) => { record.productionLegalApprovalClaimed = true }),
'reviewDigestSha256')))

expectThrow(() => parseCaptionPrivatePerformanceCostEvidence(redigest(changed(
  performance, (record) => { record.actualRenderedFrameCount = 1199 }),
'evidenceDigestSha256')))
expectThrow(() => parseCaptionPrivatePerformanceCostEvidence(redigest(changed(
  performance, (record) => { record.providerCostMicrousd = 1 }),
'evidenceDigestSha256')))
expectThrow(() => parseCaptionPrivatePerformanceCostEvidence(redigest(changed(
  performance,
  (record) => { record.productionPerformanceQualified = true }),
'evidenceDigestSha256')))

expectThrow(() => parseCaptionFutureOrchestraMountingGuide(redigest(changed(
  guide, (record) => { record.fullJobSurfaceMountingReady = true }),
'guideDigestSha256')))
expectThrow(() => parseCaptionFutureOrchestraMountingGuide(redigest(changed(
  guide, (record) => { record.directPeerDispatchAllowed = true }),
'guideDigestSha256')))
expectThrow(() => parseCaptionFutureOrchestraMountingGuide(redigest(changed(
  guide, (record) => { record.centralOrchestraImplemented = true }),
'guideDigestSha256')))

expectThrow(() => parseCaptionPrivateInternalReleaseManifest(redigest(changed(
  release, (record) => { record.sourceRegressionMilestoneIds = ['CAP-20'] }),
'releaseDigestSha256')))
expectThrow(() => parseCaptionPrivateInternalReleaseManifest(redigest(changed(
  release, (record) => {
    record.sourceCommitRef = {
      id: 'captions.specialist.release.stale',
      version: 'captions-specialist-v1', contentHash: hash('stale'),
    }
  }), 'releaseDigestSha256')))
expectThrow(() => parseCaptionPrivateInternalReleaseManifest(redigest(changed(
  release,
  (record) => { record.conditionalSharedOwnerSurfaceQualified = true }),
'releaseDigestSha256')))
expectThrow(() => parseCaptionPrivateInternalReleaseManifest(redigest(changed(
  release, (record) => {
    record.privateInternalSpecialistQualified = true
    record.finalGoalCompletionClaimed = true
  }), 'releaseDigestSha256')))
expectThrow(() => parseCaptionPrivateInternalReleaseManifest(redigest(changed(
  release, (record) => { record.operationDispatchAuthority = true }),
'releaseDigestSha256')))
expectThrow(() => parseCaptionPrivateInternalReleaseManifest({
  ...release, releaseDigestSha256: hash('tampered-release'),
}))

const cyclic = structuredClone(release) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseCaptionPrivateInternalReleaseManifest(cyclic))
const inherited = Object.create({ inheritedAuthority: true }) as
Record<string, unknown>
Object.assign(inherited, release)
expectThrow(() => parseCaptionPrivateInternalReleaseManifest(inherited))

console.log(JSON.stringify({
  smoke: 'captions_specialist_cap_20',
  assertions,
  declaredJobs: report.counts.totalDeclaredJobs,
  currentAdmittedJobs: report.currentAdmittedJobTypes.length,
  conditionalSharedOwnerJobs: report.conditionalJobTypes.length,
  privateMediaOutputs: performance.actualPrivateMediaOutputCount,
  renderedFrames: performance.actualRenderedFrameCount,
  directlyInspectedFrames: performance.actualDirectlyInspectedFrameCount,
  productionDependencyVulnerabilities:
    security.productionDependencyAudit.vulnerabilityCounts.total,
  releaseStatus: release.releaseStatus,
  targetTerminalStatus: release.targetTerminalStatus,
  terminalStatusClaimed: release.privateInternalSpecialistQualified,
  centralOrchestraImplemented: false,
  providerOrModelCallMade: false,
  operationDispatchAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
  result: 'passed',
}, null, 2))
