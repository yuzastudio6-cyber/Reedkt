import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCaptionPostrenderVisualIntelligenceResult,
} from '../../src/types/canonical-caption-postrender-visual-intelligence-result'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_RESULT_VERSION,
} from '../../src/types/canonical-caption-postrender-visual-intelligence-result'
import type {
  VisualInspectionRequirement,
  VisualInspectionResult,
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceReport,
  VisualIntelligenceRequest,
  VisualIntelligenceSpatialEvidence,
} from '../../src/types/visual-intelligence'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseVisualInspectionRequirement,
  parseVisualInspectionResult,
  parseVisualIntelligenceReport,
  parseVisualIntelligenceRequest,
  parseVisualIntelligenceSpatialEvidence,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  getVisualIntelligenceProfileDefinition,
} from '../visual-intelligence/visual-intelligence-profile-registry'
import {
  canonicalConfirmedOutputBindingSchema,
} from '../validation/canonical-confirmed-output-frame-schemas'

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const nonnegative = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const refSchema = z.object({
  id: safeId,
  version: positive,
  contentHash: prefixedSha256,
}).strict()
const captionDomainRefSchema = z.object({
  id: safeId,
  version: safeId,
  contentHash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()
const rangeSchema = z.object({
  startFrame: nonnegative,
  endFrameExclusive: positive,
  frameRate: z.object({
    numerator: positive,
    denominator: positive,
  }).strict(),
}).strict().superRefine((value, context) => {
  if (value.endFrameExclusive <= value.startFrame) {
    context.addIssue({ code: 'custom', message: 'Frame range is empty.' })
  }
})
const safeSummary = z.string().trim().min(1).max(1_000).superRefine(
  (value, context) => {
    if (/(?:https?:\/\/|file:|data:|blob:|javascript:|\/Users\/|\/Volumes\/|\/tmp\/|\\|api[_ -]?key|password|credential|secret|access[_ -]?token|refresh[_ -]?token|\bsk-[A-Za-z0-9_-]{8,})/iu.test(value)) {
      context.addIssue({
        code: 'custom',
        message: 'Post-render visual-review summary contains unsafe text.',
      })
    }
  },
)

const coreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_RESULT_VERSION),
  resultId: safeId,
  resultDigestSha256: prefixedSha256,
  scope: z.object({
    ownerUserId: safeId,
    workspaceId: safeId,
    projectId: safeId,
    editSessionId: safeId,
    approvedSnapshotId: safeId,
  }).strict(),
  output: z.object({
    outputId: safeId,
    aspectRatio: z.enum([
      '16:9', '9:16', '1:1', '4:5', 'original', 'custom',
    ]),
    width: positive.max(16_384),
    height: positive.max(16_384),
    fpsNumerator: positive.max(240_000),
    fpsDenominator: positive.max(10_000),
    frameCount: positive,
    confirmedOutputFrameRef: refSchema,
    captionConfirmedOutputFrameRef: captionDomainRefSchema,
    confirmedOutputFrameBindingDigestSha256: prefixedSha256,
    confirmedByUser: z.literal(true),
    confirmationRecordId: safeId,
  }).strict(),
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  approvedWorkItemRef: refSchema,
  privateRenderArtifactRef: refSchema,
  deterministicCompleteTimeQaRef: refSchema,
  independentArtifactQaRef: refSchema,
  assetManifestReconciliationRef: refSchema,
  visualInspectionRequirementRef: refSchema,
  visualIntelligenceRequestRef: refSchema,
  visualIntelligenceReportRef: refSchema,
  visualIntelligenceSpatialEvidenceRef: refSchema,
  visualInspectionResultRef: refSchema,
  expectedOutcomeRefs: z.array(refSchema).min(1).max(64),
  requestedRanges: z.array(rangeSchema).min(1).max(64),
  analyzedRanges: z.array(rangeSchema).min(1).max(64),
  decision: z.enum([
    'passed',
    'repair_required',
    'needs_human_review',
    'blocked_evidence_reconciliation',
  ]),
  userFacingSummary: safeSummary,
  findingIds: z.array(safeId).max(1_000),
  captionFindingIds: z.array(safeId).max(1_000),
  blockingOrRevisionFindingIds: z.array(safeId).max(1_000),
  deterministicCompleteTimeQaPassed: z.literal(true),
  exactApprovedPrivateRenderRereadVerified: z.literal(true),
  exactConfirmedOutputFrameRereadVerified: z.literal(true),
  exactExpectedOutcomeLineageVerified: z.literal(true),
  completeRequestedRangeSemanticCoverageVerified: z.literal(true),
  incompleteRangeCount: z.literal(0),
  actualVisualIntelligenceInferenceVerified: z.literal(true),
  semanticModelEveryTimelineFrameInspectedClaimed: z.literal(false),
  semanticModelExactPixelInspectionClaimed: z.literal(false),
  deterministicEveryFrameTechnicalQaRemainsSeparate: z.literal(true),
  completeTimelineCompositeReviewPassed: z.boolean(),
  deterministicAndSemanticEvidenceAgree: z.boolean(),
  canonicalEvidenceReconciled: z.boolean(),
  smallestScopeRepairRequired: z.boolean(),
  privateHumanReviewRequired: z.boolean(),
  providerCapabilityId: z.literal('visual_intelligence'),
  providerOperationId: z.literal('visual_intelligence.inspect_edit'),
  providerProfile: z.literal('final_render_visual_qa'),
  providerAdapterId: z.literal('vertex_gemini_pro'),
  providerModelId: z.literal('gemini-3.1-pro-preview'),
  thinkingLevel: z.literal('high'),
  mediaResolution: z.literal('high'),
  qwenVisualFallbackUsed: z.literal(false),
  reportDisposition: z.enum([
    'pass', 'pass_with_warnings', 'needs_revision', 'blocked',
  ]),
  reportImmutable: z.literal(true),
  providerCallObserved: z.literal(true),
  accountEffectiveCostEvidenceBound: z.literal(true),
  rawProviderPayloadIncluded: z.literal(false),
  rawModelTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  browserLocalStateUsed: z.literal(false),
  directPeerDispatchAuthority: z.literal(false),
  providerRuntimeAuthority: z.literal(false),
  timelineMutationAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  repairExecutionAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const resultSchema: z.ZodType<
  CanonicalCaptionPostrenderVisualIntelligenceResult
> = coreSchema.superRefine((value, context) => {
  const decisionMatches = value.reportDisposition === 'pass'
    ? value.decision === 'passed'
    : value.reportDisposition === 'pass_with_warnings'
      ? value.decision === 'needs_human_review'
      : value.reportDisposition === 'needs_revision'
        ? value.decision === 'repair_required'
        : value.decision === 'blocked_evidence_reconciliation'
  if (
    value.resultDigestSha256 !== digestResult(value)
    || !decisionMatches
    || value.completeTimelineCompositeReviewPassed
      !== (value.decision === 'passed')
    || value.smallestScopeRepairRequired
      !== (value.decision === 'repair_required')
    || value.privateHumanReviewRequired
      !== (value.decision === 'needs_human_review')
    || value.output.captionConfirmedOutputFrameRef.id
      !== value.output.confirmedOutputFrameRef.id
    || value.output.captionConfirmedOutputFrameRef.contentHash
      !== value.output.confirmedOutputFrameRef.contentHash.slice(7)
    || value.approvedSnapshotRef.id !== value.scope.approvedSnapshotId
    || value.canonicalEvidenceReconciled
      !== (value.decision !== 'blocked_evidence_reconciliation')
    || (value.decision === 'passed'
      && !value.deterministicAndSemanticEvidenceAgree)
    || new Set(value.findingIds).size !== value.findingIds.length
    || new Set(value.captionFindingIds).size !== value.captionFindingIds.length
    || new Set(value.blockingOrRevisionFindingIds).size
      !== value.blockingOrRevisionFindingIds.length
    || value.captionFindingIds.some((id) => !value.findingIds.includes(id))
    || value.blockingOrRevisionFindingIds.some(
      (id) => !value.findingIds.includes(id))
    || !rangesCoverWholeOutput(value.requestedRanges, value.output.frameCount,
      value.output.fpsNumerator, value.output.fpsDenominator)
    || !sameRanges(value.requestedRanges, value.analyzedRanges)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Caption Visual Intelligence post-render result is inconsistent.',
    })
  }
})

export interface CreateCanonicalCaptionPostrenderVisualIntelligenceResultInput {
  resultId: string
  approvedSnapshotRef: VisualIntelligenceEvidenceRef
  executionPackageRef: VisualIntelligenceEvidenceRef
  approvedWorkItemRef: VisualIntelligenceEvidenceRef
  deterministicCompleteTimeQaRef: VisualIntelligenceEvidenceRef
  independentArtifactQaRef: VisualIntelligenceEvidenceRef
  assetManifestReconciliationRef: VisualIntelligenceEvidenceRef
  confirmedOutputFrameBindingDigestSha256: string
  captionConfirmedOutputFrameRef: CaptionDomainRef
  confirmationRecordId: string
  requirement: VisualInspectionRequirement
  request: VisualIntelligenceRequest
  report: VisualIntelligenceReport
  spatialEvidence: VisualIntelligenceSpatialEvidence
  inspectionResult: VisualInspectionResult
  deterministicAndSemanticEvidenceAgree: boolean
  exactApprovedPrivateRenderRereadVerified: true
}

export function createCanonicalCaptionPostrenderVisualIntelligenceResult(
  input: CreateCanonicalCaptionPostrenderVisualIntelligenceResultInput,
): CanonicalCaptionPostrenderVisualIntelligenceResult {
  const requirement = parseVisualInspectionRequirement(input.requirement)
  const request = parseVisualIntelligenceRequest(input.request)
  const report = parseVisualIntelligenceReport(input.report)
  const spatialEvidence = parseVisualIntelligenceSpatialEvidence(
    input.spatialEvidence)
  const inspectionResult = parseVisualInspectionResult(input.inspectionResult)
  assertSourceLineage({
    requirement,
    request,
    report,
    spatialEvidence,
    inspectionResult,
    approvedSnapshotRef: input.approvedSnapshotRef,
    executionPackageRef: input.executionPackageRef,
    approvedWorkItemRef: input.approvedWorkItemRef,
    deterministicCompleteTimeQaRef: input.deterministicCompleteTimeQaRef,
    independentArtifactQaRef: input.independentArtifactQaRef,
    assetManifestReconciliationRef: input.assetManifestReconciliationRef,
  })
  const source = request.sourceArtifacts[0]!
  const output = request.outputFrame!
  const confirmedOutputBinding = canonicalConfirmedOutputBindingSchema.parse({
    outputId: output.outputId,
    aspectRatioLabel: output.aspectRatioLabel,
    aspectRatioNumerator: output.aspectRatioNumerator,
    aspectRatioDenominator: output.aspectRatioDenominator,
    width: output.width,
    height: output.height,
    fpsNumerator: output.frameRate.numerator,
    fpsDenominator: output.frameRate.denominator,
    confirmedOutputFrameRef: output.confirmedOutputFrameRef,
    confirmedOutputFrameBindingDigestSha256:
      input.confirmedOutputFrameBindingDigestSha256,
    confirmedByUser: true,
    confirmationRecordId: input.confirmationRecordId,
  })
  const findingIds = report.findings.map((finding) => finding.findingId)
  const captionFindingIds = report.findings.filter((finding) =>
    finding.recommendedOwner === 'caption').map((finding) => finding.findingId)
  const blockingOrRevisionFindingIds = report.findings.filter((finding) =>
    finding.severity === 'blocking'
      || finding.severity === 'revision_required')
    .map((finding) => finding.findingId)
  const decision = report.disposition === 'pass'
    ? 'passed' as const
    : report.disposition === 'pass_with_warnings'
      ? 'needs_human_review' as const
      : report.disposition === 'needs_revision'
        ? 'repair_required' as const
        : 'blocked_evidence_reconciliation' as const
  const withoutDigest = coreSchema.omit({ resultDigestSha256: true }).parse({
    schemaVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_RESULT_VERSION,
    resultId: input.resultId,
    scope: request.scope,
    output: {
      outputId: output.outputId,
      aspectRatio: output.aspectRatioLabel,
      width: output.width,
      height: output.height,
      fpsNumerator: output.frameRate.numerator,
      fpsDenominator: output.frameRate.denominator,
      frameCount: source.durationFrames,
      confirmedOutputFrameRef: output.confirmedOutputFrameRef,
      captionConfirmedOutputFrameRef:
        input.captionConfirmedOutputFrameRef,
      confirmedOutputFrameBindingDigestSha256:
        confirmedOutputBinding.confirmedOutputFrameBindingDigestSha256,
      confirmedByUser: true,
      confirmationRecordId: input.confirmationRecordId,
    },
    approvedSnapshotRef: input.approvedSnapshotRef,
    executionPackageRef: input.executionPackageRef,
    approvedWorkItemRef: input.approvedWorkItemRef,
    privateRenderArtifactRef: {
      id: source.artifactId,
      version: 1,
      contentHash: `sha256:${source.checksumSha256}`,
    },
    deterministicCompleteTimeQaRef: input.deterministicCompleteTimeQaRef,
    independentArtifactQaRef: input.independentArtifactQaRef,
    assetManifestReconciliationRef: input.assetManifestReconciliationRef,
    visualInspectionRequirementRef: requirementRef(requirement),
    visualIntelligenceRequestRef: requestRef(request),
    visualIntelligenceReportRef: reportRef(report),
    visualIntelligenceSpatialEvidenceRef: spatialRef(spatialEvidence),
    visualInspectionResultRef: inspectionResultRef(inspectionResult),
    expectedOutcomeRefs: request.expectedOutcomeRefs,
    requestedRanges: request.requestedRanges,
    analyzedRanges: report.coverage.analyzedRanges,
    decision,
    userFacingSummary: report.semanticSummary,
    findingIds,
    captionFindingIds,
    blockingOrRevisionFindingIds,
    deterministicCompleteTimeQaPassed: true,
    exactApprovedPrivateRenderRereadVerified:
      input.exactApprovedPrivateRenderRereadVerified,
    exactConfirmedOutputFrameRereadVerified: true,
    exactExpectedOutcomeLineageVerified: true,
    completeRequestedRangeSemanticCoverageVerified: true,
    incompleteRangeCount: 0,
    actualVisualIntelligenceInferenceVerified: true,
    semanticModelEveryTimelineFrameInspectedClaimed: false,
    semanticModelExactPixelInspectionClaimed: false,
    deterministicEveryFrameTechnicalQaRemainsSeparate: true,
    completeTimelineCompositeReviewPassed: decision === 'passed',
    deterministicAndSemanticEvidenceAgree:
      input.deterministicAndSemanticEvidenceAgree,
    canonicalEvidenceReconciled:
      decision !== 'blocked_evidence_reconciliation',
    smallestScopeRepairRequired: decision === 'repair_required',
    privateHumanReviewRequired: decision === 'needs_human_review',
    providerCapabilityId: 'visual_intelligence',
    providerOperationId: 'visual_intelligence.inspect_edit',
    providerProfile: 'final_render_visual_qa',
    providerAdapterId: 'vertex_gemini_pro',
    providerModelId: 'gemini-3.1-pro-preview',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    qwenVisualFallbackUsed: false,
    reportDisposition: report.disposition,
    reportImmutable: true,
    providerCallObserved: true,
    accountEffectiveCostEvidenceBound: true,
    rawProviderPayloadIncluded: false,
    rawModelTextIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    browserLocalStateUsed: false,
    directPeerDispatchAuthority: false,
    providerRuntimeAuthority: false,
    timelineMutationAuthority: false,
    qaApprovalAuthority: false,
    repairExecutionAuthority: false,
    assetMutationAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })
  return parseCanonicalCaptionPostrenderVisualIntelligenceResult({
    ...withoutDigest,
    resultDigestSha256: digestResult(withoutDigest),
  })
}

export function parseCanonicalCaptionPostrenderVisualIntelligenceResult(
  value: unknown,
): CanonicalCaptionPostrenderVisualIntelligenceResult {
  assertClosedContractTree(value,
    'Canonical Caption post-render Visual Intelligence result')
  return structuredClone(resultSchema.parse(value))
}

export function digestCanonicalCaptionPostrenderVisualIntelligenceResult(
  value: Omit<CanonicalCaptionPostrenderVisualIntelligenceResult,
    'resultDigestSha256'> | CanonicalCaptionPostrenderVisualIntelligenceResult,
): string {
  return digestResult(value)
}

function assertSourceLineage(input: {
  requirement: VisualInspectionRequirement
  request: VisualIntelligenceRequest
  report: VisualIntelligenceReport
  spatialEvidence: VisualIntelligenceSpatialEvidence
  inspectionResult: VisualInspectionResult
  approvedSnapshotRef: VisualIntelligenceEvidenceRef
  executionPackageRef: VisualIntelligenceEvidenceRef
  approvedWorkItemRef: VisualIntelligenceEvidenceRef
  deterministicCompleteTimeQaRef: VisualIntelligenceEvidenceRef
  independentArtifactQaRef: VisualIntelligenceEvidenceRef
  assetManifestReconciliationRef: VisualIntelligenceEvidenceRef
}): void {
  const { requirement, request, report, spatialEvidence, inspectionResult } =
    input
  const source = request.sourceArtifacts[0]
  const requiredTools = getVisualIntelligenceProfileDefinition(
    'inspect_edit', 'final_render_visual_qa').toolPolicies.filter(
    (policy) => policy.requirement === 'required')
  if (
    requirement.profile !== 'final_render_visual_qa'
    || requirement.owningSkillId !== 'captions'
    || !requirement.required
    || request.operation !== 'inspect_edit'
    || request.profile !== requirement.profile
    || request.scope.approvedSnapshotId === null
    || request.admission.mode !== 'approved_edit_inspection'
    || refKey(input.approvedSnapshotRef)
      !== refKey(request.admission.approvedPlanSnapshotRef)
    || !request.admission.workNodeRefs.some((reference) =>
      refKey(reference) === refKey(input.approvedWorkItemRef))
    || !request.requiredEvidenceRefs.some((reference) =>
      refKey(reference) === refKey(input.executionPackageRef))
    || !request.requiredEvidenceRefs.some((reference) =>
      refKey(reference) === refKey(input.deterministicCompleteTimeQaRef))
    || !request.requiredEvidenceRefs.some((reference) =>
      refKey(reference) === refKey(input.independentArtifactQaRef))
    || !request.requiredEvidenceRefs.some((reference) =>
      refKey(reference) === refKey(input.assetManifestReconciliationRef))
    || request.sourceArtifacts.length !== 1
    || request.comparisonArtifacts.length !== 0
    || !source
    || source.mediaKind !== 'video'
    || request.outputFrame === null
    || request.admission.privatePreviewArtifactRef.id !== source.artifactId
    || request.admission.privatePreviewArtifactRef.contentHash
      !== `sha256:${source.checksumSha256}`
    || !sameRefs(requirement.expectedOutcomeRefs,
      request.expectedOutcomeRefs)
    || !sameRanges(requirement.requestedRanges, request.requestedRanges)
    || report.operation !== request.operation
    || report.profile !== request.profile
    || !sameScope(report.scope, request.scope)
    || refKey(report.requestRef) !== refKey(requestRef(request))
    || report.sourceArtifacts.length !== 1
    || report.sourceArtifacts[0]?.artifactId !== source.artifactId
    || report.sourceArtifacts[0]?.checksumSha256 !== source.checksumSha256
    || report.sourceArtifacts[0]?.durationFrames !== source.durationFrames
    || !report.coverage.completeRequestedRangeCoverage
    || report.coverage.incompleteRanges.length !== 0
    || report.coverage.everyTimelineFrameInspected
    || report.coverage.completeTimePixelInspectionClaimAllowed
    || !sameRanges(report.coverage.requestedRanges,
      request.requestedRanges)
    || !sameRanges(report.coverage.analyzedRanges,
      request.requestedRanges)
    || !sameRefs(report.expectedOutcomeRefs, request.expectedOutcomeRefs)
    || !report.usage.providerCallMade
    || report.usage.costEvidenceRef === null
    || report.provenance.providerAdapterId !== 'vertex_gemini_pro'
    || report.provenance.exactModelId !== 'gemini-3.1-pro-preview'
    || report.provenance.thinkingLevel !== 'high'
    || report.provenance.mediaResolution !== 'high'
    || !report.immutableReport
    || requiredTools.some((policy) =>
      !report.deterministicToolExecutions.some((execution) =>
        execution.tool === policy.tool
          && execution.requirement === 'required'
          && execution.executionClass === policy.executionClass
          && !execution.substantiveCpuExecutionUsed
          && execution.sourceArtifactChecksumBound))
    || refKey(spatialEvidence.requestRef) !== refKey(requestRef(request))
    || refKey(spatialEvidence.reportRef) !== refKey(reportRef(report))
    || !sameScope(spatialEvidence.scope, request.scope)
    || spatialEvidence.operation !== request.operation
    || spatialEvidence.profile !== request.profile
    || JSON.stringify(spatialEvidence.outputFrame)
      !== JSON.stringify(request.outputFrame)
    || spatialEvidence.sourceArtifacts.length !== 1
    || spatialEvidence.sourceArtifacts[0]?.artifactId !== source.artifactId
    || spatialEvidence.sourceArtifacts[0]?.checksumSha256
      !== source.checksumSha256
    || spatialEvidence.sourceArtifacts[0]?.width !== source.width
    || spatialEvidence.sourceArtifacts[0]?.height !== source.height
    || spatialEvidence.sourceArtifacts[0]?.durationFrames
      !== source.durationFrames
    || spatialEvidence.observations.length === 0
    || !spatialEvidence.actualVisualInferenceObserved
    || !spatialEvidence.exactCanonicalPrivateMediaSuppliedToProvider
    || spatialEvidence.everyTimelineFrameInspected
    || spatialEvidence.completeTimePixelInspectionClaimAllowed
    || refKey(inspectionResult.inspectionRef)
      !== refKey(requirementRef(requirement))
    || refKey(inspectionResult.reportRef) !== refKey(reportRef(report))
    || inspectionResult.disposition !== report.disposition
    || inspectionResult.owningSkillId !== requirement.owningSkillId
    || inspectionResult.findingIds.join('|')
      !== report.findings.map((finding) => finding.findingId).join('|')
    || inspectionResult.visualIntelligenceMutatedEdit
  ) throw new Error(
    'Visual Intelligence post-render evidence does not match Caption authority.')
}

function rangesCoverWholeOutput(
  ranges: readonly { startFrame: number; endFrameExclusive: number;
    frameRate: { numerator: number; denominator: number } }[],
  frameCount: number,
  fpsNumerator: number,
  fpsDenominator: number,
): boolean {
  let cursor = 0
  for (const range of ranges) {
    if (range.startFrame !== cursor
      || range.endFrameExclusive <= range.startFrame
      || range.frameRate.numerator !== fpsNumerator
      || range.frameRate.denominator !== fpsDenominator) return false
    cursor = range.endFrameExclusive
  }
  return cursor === frameCount
}

function requirementRef(value: VisualInspectionRequirement):
VisualIntelligenceEvidenceRef {
  return { id: value.inspectionId, version: 1,
    contentHash: value.inspectionDigestSha256 }
}

function requestRef(value: VisualIntelligenceRequest):
VisualIntelligenceEvidenceRef {
  return { id: value.requestId, version: 1,
    contentHash: value.requestDigestSha256 }
}

function reportRef(value: VisualIntelligenceReport):
VisualIntelligenceEvidenceRef {
  return { id: value.reportId, version: 1,
    contentHash: value.reportDigestSha256 }
}

function spatialRef(value: VisualIntelligenceSpatialEvidence):
VisualIntelligenceEvidenceRef {
  return { id: value.spatialEvidenceId, version: 1,
    contentHash: value.spatialEvidenceDigestSha256 }
}

function inspectionResultRef(value: VisualInspectionResult):
VisualIntelligenceEvidenceRef {
  return {
    id: `visual-inspection-result-${value.inspectionRef.id}`,
    version: 1,
    contentHash: digest(value),
  }
}

function sameScope(
  left: VisualIntelligenceRequest['scope'],
  right: VisualIntelligenceRequest['scope'],
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function sameRefs(
  left: readonly VisualIntelligenceEvidenceRef[],
  right: readonly VisualIntelligenceEvidenceRef[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => refKey(value) === refKey(right[index]!))
}

function sameRanges(
  left: readonly { startFrame: number; endFrameExclusive: number;
    frameRate: { numerator: number; denominator: number } }[],
  right: readonly { startFrame: number; endFrameExclusive: number;
    frameRate: { numerator: number; denominator: number } }[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => {
      const expected = right[index]!
      return value.startFrame === expected.startFrame
        && value.endFrameExclusive === expected.endFrameExclusive
        && value.frameRate.numerator === expected.frameRate.numerator
        && value.frameRate.denominator === expected.frameRate.denominator
    })
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function digestResult(value: unknown): string {
  const record = value as Record<string, unknown>
  return digest({ ...record, resultDigestSha256: null })
}

function digest(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableStringify(value))
    .digest('hex')}`
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value))
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, item]) => [key, stableValue(item)]))
}
