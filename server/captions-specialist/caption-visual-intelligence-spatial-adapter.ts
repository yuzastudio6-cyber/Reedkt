import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_VERSION,
  type CaptionVisualIntelligenceSpatialAdapterInput,
  type CaptionVisualIntelligenceSpatialAdapterOutput,
  type CaptionVisualIntelligenceSpatialAdapterReceipt,
} from '../../src/types/caption-visual-intelligence-spatial-adapter'
import type {
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionVisualIntelligenceEvidencePacket,
  CaptionVisualIntelligenceSupportPayload,
} from '../../src/types/caption-visual-intelligence-support'
import {
  VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
  VISUAL_INTELLIGENCE_AUTHENTICATED_READ_RESULT_VERSION,
  VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
  VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_OPERATIONS,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  VISUAL_INTELLIGENCE_QUERY_PROFILES,
  VISUAL_INTELLIGENCE_REPORT_VERSION,
  VISUAL_INTELLIGENCE_SPATIAL_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_SPATIAL_OBSERVATION_ROLES,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
  type VisualIntelligenceAuthenticatedReadResult,
  type VisualIntelligenceEvidenceRef,
  type VisualIntelligenceReport,
  type VisualIntelligenceSpatialEvidence,
} from '../../src/types/visual-intelligence'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionVisualIntelligenceEvidencePacket,
  parseCaptionVisualIntelligenceSupportPayload,
} from './caption-visual-intelligence-support'

const safeCaptionKey = z.string().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const safeId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u)
const safeVersion = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const unsafeSerializedText =
  /(?:https?:\/\/|file:|data:|blob:|javascript:|\/(?:Users|Volumes|tmp)\/|\\|x-goog-|api[_ -]?key|password|credential|secret|access[_ -]?token|refresh[_ -]?token|\bsk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/iu
const executableText =
  /(?:\b(?:curl|wget|powershell|bash|zsh|cmd\.exe)\b|\brm\s+-rf\b|\bsudo\b|<script\b|\$\([^)]*\)|`[^`]+`)/iu
const safeNarrative = z.string().trim().min(1).max(16_384)
  .superRefine((value, context) => {
    if (unsafeSerializedText.test(value) || executableText.test(value)) {
      context.addIssue({
        code: 'custom',
        message: 'Visual Intelligence narrative contains unsafe text.',
      })
    }
  })

const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().max(1_000_000),
  contentHash: prefixedSha256,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  approvedSnapshotId: safeId.nullable(),
}).strict()
const frameRateSchema = z.object({
  numerator: z.number().int().positive().max(1_000_000),
  denominator: z.number().int().positive().max(1_000_000),
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  endFrameExclusive: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  frameRate: frameRateSchema,
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const outputFrameSchema = z.object({
  outputId: safeId,
  aspectRatioLabel: safeNarrative.max(80),
  aspectRatioNumerator: z.number().int().positive().max(100_000),
  aspectRatioDenominator: z.number().int().positive().max(100_000),
  width: z.number().int().positive().max(32_768),
  height: z.number().int().positive().max(32_768),
  frameRate: frameRateSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  confirmedByUser: z.literal(true),
}).strict()
const operationSchema = z.enum(VISUAL_INTELLIGENCE_OPERATIONS)
const profileSchema = z.enum([
  ...VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
  ...VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
  ...VISUAL_INTELLIGENCE_QUERY_PROFILES,
  ...VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
])
const sourcePlanningSchema = z.object({
  sourceFunction: z.enum([
    'hook', 'active_action', 'setup', 'dialogue', 'reaction', 'detail',
    'transition', 'idle', 'unusable', 'uncertain',
  ]),
  actionIntensity: z.enum(['none', 'low', 'medium', 'high']),
  editUsability: z.enum(['strong', 'usable', 'weak', 'reject']),
  cameraStability: z.enum([
    'stable', 'usable_motion', 'unstable', 'uncertain',
  ]),
  continuity: z.enum(['continuous', 'discontinuous', 'uncertain']),
}).strict()
const segmentSchema = z.object({
  segmentId: safeId,
  artifactId: safeId,
  range: frameRangeSchema,
  sceneId: safeId.nullable(),
  summary: safeNarrative,
  subjectIds: z.array(safeId).max(10_000),
  objectIds: z.array(safeId).max(10_000),
  actionLabels: z.array(safeNarrative.max(240)).max(10_000),
  visibleTextEvidenceRefs: z.array(evidenceRefSchema).max(10_000),
  transcriptEvidenceRefs: z.array(evidenceRefSchema).max(10_000),
  evidenceRefs: z.array(evidenceRefSchema).max(10_000),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  uncertainty: safeNarrative.nullable(),
  sourcePlanning: sourcePlanningSchema.nullable(),
}).strict()
const findingSchema = z.object({
  findingId: safeId,
  artifactId: safeId,
  range: frameRangeSchema,
  category: safeId,
  severity: z.enum(['info', 'warning', 'revision_required', 'blocking']),
  summary: safeNarrative,
  evidenceRefs: z.array(evidenceRefSchema).max(10_000),
  expectedOutcomeRefs: z.array(evidenceRefSchema).max(10_000),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  uncertainty: safeNarrative.nullable(),
  recommendedOwner: z.enum([
    'planning', 'caption', 'graphics', 'motion_graphics', 'living_frame',
    'smart_cut', 'compositing', 'color', 'aspect_ratio', 'render',
    'private_review', 'human_review',
  ]),
  reinspectionRequired: z.boolean(),
  directTimelineMutationAllowed: z.literal(false),
  providerInstructionAccepted: z.literal(false),
}).strict()
const evidenceSchema = z.object({
  evidenceId: safeId,
  evidenceRef: evidenceRefSchema,
  artifactId: safeId,
  range: frameRangeSchema.nullable(),
  authority: z.enum([
    'media_probe', 'media_transform', 'scene_detection', 'pixel_measurement',
    'canonical_transcript', 'exact_ocr', 'semantic_visual_judgment',
  ]),
  producingTool: z.enum([
    'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'faster_whisper', 'ocr',
    'gemini_pro_high',
  ]),
  toolVersion: safeVersion,
  summary: safeNarrative,
  privateEvidence: z.literal(true),
  providerInstructionAccepted: z.literal(false),
}).strict()
const toolExecutionSchema = z.object({
  tool: z.enum([
    'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'faster_whisper', 'ocr',
  ]),
  requirement: z.enum(['required', 'conditional']),
  executionClass: z.enum(['l4_gpu_standard', 'a100_80gb_gpu_heavy']),
  releaseRef: evidenceRefSchema,
  executionRef: evidenceRefSchema,
  substantiveCpuExecutionUsed: z.literal(false),
  sourceArtifactChecksumBound: z.literal(true),
}).strict()
const samplingPolicySchema = z.object({
  policyId: safeId,
  policyVersion: safeVersion,
  mode: z.enum([
    'native_complete_video', 'scene_aware_complete_coverage',
    'general_overview', 'moderate_visual_change', 'fast_motion',
    'transition_detail', 'high_frequency_defect',
  ]),
  targetFramesPerSecondNumerator: z.number().int().positive(),
  targetFramesPerSecondDenominator: z.number().int().positive(),
  sceneAware: z.boolean(),
  highDetail: z.boolean(),
  requestedRange: frameRangeSchema,
  analyzedRange: frameRangeSchema,
  samplingPolicyRef: evidenceRefSchema,
}).strict()
const coverageSchema = z.object({
  requestedRanges: z.array(frameRangeSchema).min(1).max(4_096),
  analyzedRanges: z.array(frameRangeSchema).max(4_096),
  incompleteRanges: z.array(frameRangeSchema).max(4_096),
  sceneBoundaryRefs: z.array(evidenceRefSchema).max(10_000),
  samplingPolicies: z.array(samplingPolicySchema).max(4_096),
  targetedFollowupRanges: z.array(frameRangeSchema).max(4_096),
  completeRequestedRangeCoverage: z.boolean(),
  everyTimelineFrameInspected: z.literal(false),
  completeTimePixelInspectionClaimAllowed: z.literal(false),
}).strict()
const usageSchema = z.object({
  promptTokenCount: z.number().int().nonnegative(),
  candidateTokenCount: z.number().int().nonnegative(),
  thinkingTokenCount: z.number().int().nonnegative(),
  cachedTokenCount: z.number().int().nonnegative(),
  totalTokenCount: z.number().int().nonnegative(),
  providerResponseId: safeId,
  providerModelVersion: safeVersion,
  estimatedCostMicros: z.number().int().nonnegative(),
  settledCostMicros: z.number().int().nonnegative().nullable(),
  costEvidenceRef: evidenceRefSchema.nullable(),
  billingAccountEffectiveRateUsed: z.literal(true),
  publicListPriceUsed: z.literal(false),
  duplicateSettlementPerformed: z.literal(false),
  replayedFromCache: z.boolean(),
  providerCallMade: z.boolean(),
}).strict()
const provenanceSchema = z.object({
  providerAdapterId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID),
  providerId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ID),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  thinkingLevel: z.literal(VISUAL_INTELLIGENCE_THINKING_LEVEL),
  mediaResolution: z.literal(VISUAL_INTELLIGENCE_MEDIA_RESOLUTION),
  promptVersion: safeVersion,
  responseSchemaVersion: safeVersion,
  deterministicEvidenceVersion: safeVersion,
  transcriptVersion: safeVersion.nullable(),
  ocrVersion: safeVersion.nullable(),
  cacheIdentitySha256: prefixedSha256,
  requestDigestSha256: prefixedSha256,
  admissionRef: evidenceRefSchema,
  providerReleaseRef: evidenceRefSchema,
  applicationDefaultCredentialsUsed: z.literal(true),
  providerToolsUsed: z.literal(false),
  searchGroundingUsed: z.literal(false),
  urlContextUsed: z.literal(false),
  codeExecutionUsed: z.literal(false),
  rawProviderPayloadPersisted: z.literal(false),
}).strict()
const reportArtifactSchema = z.object({
  artifactId: safeId,
  checksumSha256: rawSha256,
  mediaKind: z.enum(['video', 'image']),
  durationFrames: z.number().int().positive(),
}).strict()
const reportSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_REPORT_VERSION),
  reportId: safeId,
  reportDigestSha256: prefixedSha256,
  requestRef: evidenceRefSchema,
  scope: scopeSchema,
  operation: operationSchema,
  profile: profileSchema,
  sourceArtifacts: z.array(reportArtifactSchema).min(1).max(64),
  comparisonArtifacts: z.array(reportArtifactSchema).max(64),
  coverage: coverageSchema,
  semanticSummary: safeNarrative,
  segments: z.array(segmentSchema).max(10_000),
  findings: z.array(findingSchema).max(10_000),
  evidence: z.array(evidenceSchema).max(20_000),
  deterministicToolExecutions: z.array(toolExecutionSchema).max(16),
  expectedOutcomeRefs: z.array(evidenceRefSchema).max(512),
  disposition: z.enum([
    'pass', 'pass_with_warnings', 'needs_revision', 'blocked',
  ]),
  reinspectionRequired: z.boolean(),
  usage: usageSchema,
  provenance: provenanceSchema,
  blockers: z.array(safeNarrative).max(512),
  warnings: z.array(safeNarrative).max(512),
  immutableReport: z.literal(true),
  planningMayConsumeValidatedEvidence: z.boolean(),
  directTimelineMutationAllowed: z.literal(false),
  renderPerformedByVisualIntelligence: z.literal(false),
  exportAuthorized: z.literal(false),
  deliveryAuthorized: z.literal(false),
}).strict()
const authorityBoundarySchema = z.object({
  operationDispatchAuthority: z.literal(false),
  providerRuntimeAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  repairExecutionAuthority: z.literal(false),
  timelineMutationAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingMutationAuthority: z.literal(false),
  exportAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()
const readResultSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_AUTHENTICATED_READ_RESULT_VERSION),
  resultDigestSha256: prefixedSha256,
  disposition: z.enum(['not_found', 'completed']),
  requestRef: evidenceRefSchema,
  scope: scopeSchema,
  requestedReportRef: evidenceRefSchema,
  report: z.unknown().nullable(),
  authenticatedPrincipalVerified: z.literal(true),
  exactCanonicalScopeReread: z.literal(true),
  immutableReportReread: z.boolean(),
  browserLocalStateUsed: z.literal(false),
  rawProviderPayloadIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  authorityBoundary: authorityBoundarySchema,
}).strict()
const spatialArtifactSchema = z.object({
  artifactId: safeId,
  checksumSha256: rawSha256,
  width: z.number().int().positive().max(32_768),
  height: z.number().int().positive().max(32_768),
  durationFrames: z.number().int().positive(),
  frameRate: frameRateSchema,
}).strict()
const rectSchema = z.object({
  x: z.number().int().min(0).max(10_000),
  y: z.number().int().min(0).max(10_000),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
}).strict().refine((rect) =>
  rect.x + rect.width <= 10_000 && rect.y + rect.height <= 10_000)
const spatialObservationSchema = z.object({
  observationId: safeId,
  artifactId: safeId,
  sceneId: safeId.nullable(),
  range: frameRangeSchema,
  role: z.enum(VISUAL_INTELLIGENCE_SPATIAL_OBSERVATION_ROLES),
  regionBasisPoints: rectSchema,
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  temporalStabilityBasisPoints: z.number().int().min(0).max(10_000),
  measuredContrastRatioMilli: z.null(),
  clutterBasisPoints: z.number().int().min(0).max(10_000),
  cropResilienceBasisPoints: z.number().int().min(0).max(10_000),
  compositionBalanceBasisPoints: z.number().int().min(0).max(10_000),
  findingIds: z.array(safeId).max(512),
  evidenceRefs: z.array(evidenceRefSchema).min(1).max(512),
  uncertaintyCode: safeId.nullable(),
  semanticGeometryOnly: z.literal(true),
  deterministicPixelGeometryClaimed: z.literal(false),
}).strict()
const spatialEvidenceSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_SPATIAL_EVIDENCE_VERSION),
  spatialEvidenceId: safeId,
  spatialEvidenceDigestSha256: prefixedSha256,
  requestRef: evidenceRefSchema,
  reportRef: evidenceRefSchema,
  scope: scopeSchema,
  operation: operationSchema,
  profile: profileSchema,
  outputFrame: outputFrameSchema.nullable(),
  sourceArtifacts: z.array(spatialArtifactSchema).min(1).max(64),
  comparisonArtifacts: z.array(spatialArtifactSchema).max(64),
  observations: z.array(spatialObservationSchema).max(10_000),
  actualVisualInferenceObserved: z.literal(true),
  exactCanonicalPrivateMediaSuppliedToProvider: z.literal(true),
  providerVisualPreprocessingExpected: z.literal(true),
  providerPreprocessingIsExactFrameInspection: z.literal(false),
  everyTimelineFrameInspected: z.literal(false),
  completeTimePixelInspectionClaimAllowed: z.literal(false),
  immutableSpatialEvidence: z.literal(true),
  directTimelineMutationAllowed: z.literal(false),
  renderPerformedByVisualIntelligence: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetMutationAllowed: z.literal(false),
  billingMutationAllowed: z.literal(false),
  exportAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorized: z.literal(false),
}).strict()
const receiptSchema: z.ZodType<
CaptionVisualIntelligenceSpatialAdapterReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_VERSION),
  adapterId: safeCaptionKey,
  adapterDigestSha256: rawSha256,
  backendSource: z.object({
    repository: z.literal('yuzastudio6-cyber/Reedkt'),
    branch: z.literal('codex/backend-workflow-pipeline-continuation'),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/u),
    sourceTree: z.string().regex(/^[a-f0-9]{40}$/u),
    visualIntelligencePublicTypeFileSha256: rawSha256,
  }).strict(),
  consumedReportVersion: z.literal('visual-intelligence-report-v1'),
  consumedAuthenticatedReadResultVersion: z.literal(
    'visual-intelligence-authenticated-read-result-v1'),
  consumedSpatialEvidenceVersion: z.literal(
    'visual-intelligence-spatial-evidence-v1'),
  projectedCaptionPacketVersion: z.literal(
    'caption-visual-intelligence-evidence-packet-v1'),
  requiredPayloadPurpose: z.literal('final_frame_occupancy'),
  sourcePublicTypeCopiedByteForByte: z.literal(true),
  backendImplementationImported: z.literal(false),
  exactAuthenticatedReportRereadRequired: z.literal(true),
  exactSpatialEvidenceDigestRereadRequired: z.literal(true),
  exactScopeFrameArtifactAndRangeBindingRequired: z.literal(true),
  semanticGeometryOnly: z.literal(true),
  deterministicPixelGeometryClaimed: z.literal(false),
  measuredContrastAvailableFromSpatialEvidenceV1: z.literal(false),
  renderedCaptionInspectionAdmitted: z.literal(false),
  directPeerDispatchAdded: z.literal(false),
  providerCallAuthorityGranted: z.literal(false),
  runtimeExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  costOrBillingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, item]) => [key, canonicalValue(item)]))
}

function visualIntelligenceDigest(value: unknown): string {
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(canonicalValue(value)))
    .digest('hex')}`
}

function withoutField(
  value: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  const output = { ...value }
  Reflect.deleteProperty(output, field)
  return output
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function exactRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function rawHash(value: string): string {
  return rawSha256.parse(value.startsWith('sha256:') ? value.slice(7) : value)
}

function sameScope(
  left: VisualIntelligenceReport['scope'],
  right: VisualIntelligenceReport['scope'],
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length
}

function reportRef(report: VisualIntelligenceReport): VisualIntelligenceEvidenceRef {
  return {
    id: report.reportId,
    version: 1,
    contentHash: report.reportDigestSha256,
  }
}

function derivedDisposition(
  report: VisualIntelligenceReport,
): VisualIntelligenceReport['disposition'] {
  if (report.blockers.length > 0
    || report.findings.some((item) => item.severity === 'blocking')) {
    return 'blocked'
  }
  if (report.findings.some((item) => item.severity === 'revision_required')) {
    return 'needs_revision'
  }
  if (report.findings.some((item) => item.severity === 'warning')) {
    return 'pass_with_warnings'
  }
  return 'pass'
}

export function parseCaptionVisualIntelligenceReport(
  value: unknown,
): VisualIntelligenceReport {
  assertClosedContractTree(value, 'Caption Visual Intelligence report read')
  const report = reportSchema.parse(value) as VisualIntelligenceReport
  const digest = visualIntelligenceDigest(withoutField(
    report as unknown as Record<string, unknown>, 'reportDigestSha256'))
  const artifactIds = new Set([
    ...report.sourceArtifacts.map((item) => item.artifactId),
    ...report.comparisonArtifacts.map((item) => item.artifactId),
  ])
  const evidenceRefs = new Set(report.evidence.map((item) =>
    refKey(item.evidenceRef)))
  if (report.reportDigestSha256 !== digest
    || !unique(report.evidence.map((item) => item.evidenceId))
    || !unique(report.segments.map((item) => item.segmentId))
    || !unique(report.findings.map((item) => item.findingId))
    || !unique(report.deterministicToolExecutions.map((item) => item.tool))
    || report.segments.some((item) =>
      !artifactIds.has(item.artifactId)
      || item.evidenceRefs.some((ref) => !evidenceRefs.has(refKey(ref))))
    || report.findings.some((item) =>
      !artifactIds.has(item.artifactId)
      || item.evidenceRefs.some((ref) => !evidenceRefs.has(refKey(ref))))
    || report.disposition !== derivedDisposition(report)
    || report.reinspectionRequired !== report.findings.some((item) =>
      item.reinspectionRequired)
    || report.planningMayConsumeValidatedEvidence !== (
      report.operation !== 'inspect_edit'
      && report.blockers.length === 0
      && report.coverage.completeRequestedRangeCoverage)) {
    throw new Error('Caption rejected invalid Visual Intelligence report.')
  }
  return structuredClone(report)
}

export function parseCaptionVisualIntelligenceAuthenticatedReadResult(
  value: unknown,
): VisualIntelligenceAuthenticatedReadResult {
  assertClosedContractTree(
    value, 'Caption Visual Intelligence authenticated read result')
  const envelope = readResultSchema.parse(value)
  const report = envelope.report === null
    ? null : parseCaptionVisualIntelligenceReport(envelope.report)
  const result = { ...envelope, report } as
    VisualIntelligenceAuthenticatedReadResult
  const completed = result.disposition === 'completed'
  if (result.resultDigestSha256 !== visualIntelligenceDigest(withoutField(
    result as unknown as Record<string, unknown>, 'resultDigestSha256'))
    || completed !== (report !== null)
    || completed !== result.immutableReportReread
    || (report !== null && (!exactRef(result.requestedReportRef,
      reportRef(report)) || !sameScope(result.scope, report.scope)))) {
    throw new Error('Caption rejected invalid authenticated report reread.')
  }
  return structuredClone(result)
}

export function parseCaptionVisualIntelligenceSpatialEvidence(
  value: unknown,
): VisualIntelligenceSpatialEvidence {
  assertClosedContractTree(value, 'Caption Visual Intelligence spatial evidence')
  const evidence = spatialEvidenceSchema.parse(value) as
    VisualIntelligenceSpatialEvidence
  const artifactIds = new Set([
    ...evidence.sourceArtifacts.map((item) => item.artifactId),
    ...evidence.comparisonArtifacts.map((item) => item.artifactId),
  ])
  if (evidence.spatialEvidenceDigestSha256 !== visualIntelligenceDigest(
    withoutField(evidence as unknown as Record<string, unknown>,
      'spatialEvidenceDigestSha256'))
    || !unique(evidence.observations.map((item) => item.observationId))
    || evidence.observations.some((item) =>
      !artifactIds.has(item.artifactId)
      || !unique(item.evidenceRefs.map(refKey)))) {
    throw new Error('Caption rejected invalid Visual Intelligence spatial evidence.')
  }
  return structuredClone(evidence)
}

function exactCaptionScope(
  payload: CaptionVisualIntelligenceSupportPayload,
  report: VisualIntelligenceReport,
): boolean {
  const approvedSnapshotRef = payload.canonicalScope.approvedSnapshotRef
  return approvedSnapshotRef !== null
    && report.scope.ownerUserId === payload.canonicalScope.ownerUserId
    && report.scope.workspaceId === payload.canonicalScope.workspaceId
    && report.scope.projectId === payload.canonicalScope.projectId
    && report.scope.editSessionId === payload.canonicalScope.editSessionId
    && report.scope.approvedSnapshotId === approvedSnapshotRef.id
}

function exactFrameRange(
  range: VisualIntelligenceSpatialEvidence['observations'][number]['range'],
  payload: CaptionVisualIntelligenceSupportPayload,
): boolean {
  return range.startFrame === payload.requestedRange.startFrame
    && range.endFrameExclusive === payload.requestedRange.endFrameExclusive
    && range.frameRate.numerator === payload.confirmedOutputFrame.fpsNumerator
    && range.frameRate.denominator === payload.confirmedOutputFrame.fpsDenominator
}

function rangeWithinPayload(
  range: VisualIntelligenceSpatialEvidence['observations'][number]['range'],
  payload: CaptionVisualIntelligenceSupportPayload,
): boolean {
  return range.startFrame >= payload.requestedRange.startFrame
    && range.endFrameExclusive <= payload.requestedRange.endFrameExclusive
    && range.frameRate.numerator === payload.confirmedOutputFrame.fpsNumerator
    && range.frameRate.denominator === payload.confirmedOutputFrame.fpsDenominator
}

function exactOutputFrame(
  frame: NonNullable<VisualIntelligenceSpatialEvidence['outputFrame']>,
  payload: CaptionVisualIntelligenceSupportPayload,
): boolean {
  const expected = payload.confirmedOutputFrame
  return frame.outputId === expected.outputId
    && frame.width === expected.width
    && frame.height === expected.height
    && frame.aspectRatioNumerator === expected.aspectRatioNumerator
    && frame.aspectRatioDenominator === expected.aspectRatioDenominator
    && frame.frameRate.numerator === expected.fpsNumerator
    && frame.frameRate.denominator === expected.fpsDenominator
    && rawHash(frame.confirmedOutputFrameRef.contentHash)
      === expected.confirmedOutputFrameDigestSha256
}

function exactReportAndSpatialArtifacts(
  report: VisualIntelligenceReport,
  spatial: VisualIntelligenceSpatialEvidence,
): boolean {
  const compact = (items: Array<{
    artifactId: string
    checksumSha256: string
    durationFrames: number
  }>) => items.map((item) => ({
    artifactId: item.artifactId,
    checksumSha256: item.checksumSha256,
    durationFrames: item.durationFrames,
  }))
  return JSON.stringify(compact(report.sourceArtifacts))
      === JSON.stringify(compact(spatial.sourceArtifacts))
    && JSON.stringify(compact(report.comparisonArtifacts))
      === JSON.stringify(compact(spatial.comparisonArtifacts))
}

function expectedOutcomeRefsMatch(
  payload: CaptionVisualIntelligenceSupportPayload,
  report: VisualIntelligenceReport,
): boolean {
  return payload.expectedOutcomeRefs.length === report.expectedOutcomeRefs.length
    && payload.expectedOutcomeRefs.every((ref, index) => {
      const reportRefValue = report.expectedOutcomeRefs[index]
      return reportRefValue !== undefined
        && ref.id === reportRefValue.id
        && ref.contentHash === rawHash(reportRefValue.contentHash)
    })
}

function readResultRef(
  result: VisualIntelligenceAuthenticatedReadResult,
): CaptionDomainRef {
  return {
    id: safeCaptionKey.parse(result.requestRef.id),
    version: result.schemaVersion,
    contentHash: rawHash(result.resultDigestSha256),
  }
}

export function projectCaptionVisualIntelligenceSpatialEvidence(
  input: CaptionVisualIntelligenceSpatialAdapterInput,
): CaptionVisualIntelligenceSpatialAdapterOutput {
  assertClosedContractTree(input, 'Caption Visual Intelligence spatial adapter input')
  const payload = parseCaptionVisualIntelligenceSupportPayload(input.payload)
  if (payload.purpose !== 'final_frame_occupancy') {
    throw new Error(
      'Spatial evidence v1 cannot satisfy rendered-caption inspection.')
  }
  const readResult = parseCaptionVisualIntelligenceAuthenticatedReadResult(
    input.authenticatedReadResult)
  const report = readResult.report
  if (report === null) {
    throw new Error('Caption Visual Intelligence report reread is incomplete.')
  }
  const spatial = parseCaptionVisualIntelligenceSpatialEvidence(
    input.spatialEvidence)
  const frame = spatial.outputFrame
  const supportRequest = input.supportRequest
  const reportEvidenceRefs = new Set(report.evidence.map((item) =>
    refKey(item.evidenceRef)))
  const findingIds = report.findings.map((item) => item.findingId)
  const findingIdSet = new Set(findingIds)
  const sourceArtifact = spatial.sourceArtifacts[0]
  if (frame === null
    || spatial.sourceArtifacts.length !== 1
    || spatial.comparisonArtifacts.length !== 0
    || report.sourceArtifacts.length !== 1
    || report.comparisonArtifacts.length !== 0
    || sourceArtifact?.artifactId !== payload.sourcePrivateArtifactRef.id
    || sourceArtifact.checksumSha256
      !== payload.sourcePrivateArtifactRef.contentHash
    || !exactCaptionScope(payload, report)
    || !sameScope(spatial.scope, report.scope)
    || spatial.operation !== report.operation
    || spatial.profile !== report.profile
    || report.operation !== payload.expectedVisualIntelligenceOperation
    || report.profile !== payload.expectedVisualIntelligenceProfile
    || !exactRef(spatial.requestRef, report.requestRef)
    || !exactRef(spatial.reportRef, reportRef(report))
    || !exactReportAndSpatialArtifacts(report, spatial)
    || !exactOutputFrame(frame, payload)
    || !expectedOutcomeRefsMatch(payload, report)
    || report.coverage.requestedRanges.length !== 1
    || !exactFrameRange(report.coverage.requestedRanges[0]!, payload)
    || report.coverage.analyzedRanges.some((range) =>
      !rangeWithinPayload(range, payload))
    || report.coverage.incompleteRanges.some((range) =>
      !rangeWithinPayload(range, payload))
    || report.coverage.targetedFollowupRanges.some((range) =>
      !rangeWithinPayload(range, payload))
    || spatial.observations.length === 0
    || !unique(spatial.observations.map((item) => item.observationId))
    || spatial.observations.some((item) =>
      item.sceneId !== payload.requestedSceneId
      || !rangeWithinPayload(item.range, payload)
      || item.findingIds.some((findingId) => !findingIdSet.has(findingId))
      || item.evidenceRefs.some((ref) => !reportEvidenceRefs.has(refKey(ref))))
    || payload.requiredObservationRoles.some((role) =>
      !spatial.observations.some((item) => item.role === role))) {
    throw new Error(
      'Caption rejected stale or crossed Visual Intelligence spatial evidence.')
  }
  const coverage = report.coverage
  const withoutDigest: Omit<
    CaptionVisualIntelligenceEvidencePacket,
    'packetDigestSha256'
  > = {
    schemaVersion: 'caption-visual-intelligence-evidence-packet-v1',
    packetId: safeCaptionKey.parse(input.packetId),
    supportRequestRef: {
      id: supportRequest.requestId,
      version: supportRequest.schemaVersion,
      contentHash: supportRequest.requestDigestSha256,
    },
    supportPayloadRef: {
      id: payload.payloadId,
      version: payload.schemaVersion,
      contentHash: payload.payloadDigestSha256,
    },
    canonicalScope: structuredClone(payload.canonicalScope),
    purpose: payload.purpose,
    sourcePrivateArtifactRef: structuredClone(payload.sourcePrivateArtifactRef),
    canonicalLayoutOccupancyRef:
      structuredClone(payload.canonicalLayoutOccupancyRef),
    pictureLockRef: structuredClone(payload.pictureLockRef),
    finishReadinessRef: structuredClone(payload.finishReadinessRef),
    confirmedOutputFrameDigestSha256:
      payload.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
    requestedSceneId: payload.requestedSceneId,
    requestedRange: structuredClone(payload.requestedRange),
    visualIntelligenceContractVersion: 'visual-intelligence-contract-v1',
    visualIntelligenceReportRef: reportRef(report),
    authenticatedReadResultRef: readResultRef(readResult),
    reportOperation: report.operation,
    reportProfile: report.profile,
    reportDisposition: report.disposition,
    coverage: {
      requestedRange: structuredClone(payload.requestedRange),
      analyzedRanges: coverage.analyzedRanges.map((range) => ({
        startFrame: range.startFrame,
        endFrameExclusive: range.endFrameExclusive,
      })),
      incompleteRanges: coverage.incompleteRanges.map((range) => ({
        startFrame: range.startFrame,
        endFrameExclusive: range.endFrameExclusive,
      })),
      targetedFollowupRanges: coverage.targetedFollowupRanges.map((range) => ({
        startFrame: range.startFrame,
        endFrameExclusive: range.endFrameExclusive,
      })),
      completeRequestedRangeCoverage: coverage.completeRequestedRangeCoverage,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    observations: spatial.observations.map((item) => ({
      observationId: item.observationId,
      sceneId: item.sceneId!,
      frameRange: {
        startFrame: item.range.startFrame,
        endFrameExclusive: item.range.endFrameExclusive,
      },
      role: item.role,
      regionBasisPoints: structuredClone(item.regionBasisPoints),
      confidenceBasisPoints: item.confidenceBasisPoints,
      temporalStabilityBasisPoints: item.temporalStabilityBasisPoints,
      measuredContrastRatioMilli: null,
      clutterBasisPoints: item.clutterBasisPoints,
      cropResilienceBasisPoints: item.cropResilienceBasisPoints,
      compositionBalanceBasisPoints: item.compositionBalanceBasisPoints,
      findingIds: [...item.findingIds],
      evidenceRefs: structuredClone(item.evidenceRefs),
      uncertaintyCode: item.uncertaintyCode,
    })),
    findingIds,
    evidenceMode: 'authenticated_private_runtime',
    canonicalReportRereadVerified: true,
    exactCanonicalScopeVerified: true,
    actualVisualInferenceObserved: true,
    actualRenderedPixelsInspected: false,
    immutableReportReread: true,
    browserLocalStateUsed: false,
    rawProviderPayloadIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    providerCallMadeByCaption: false,
    visualIntelligenceMutatedEdit: false,
    visualIntelligenceGrantedFinalQa: false,
    runtimeAuthorityGrantedToCaption: false,
    assetAuthorityGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const packet = parseCaptionVisualIntelligenceEvidencePacket({
    ...withoutDigest,
    packetDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      packetDigestSha256: '',
    }, 'packetDigestSha256'),
  }, { payload, supportRequest })
  return { packet, receipt: CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_RECEIPT }
}

export function parseCaptionVisualIntelligenceSpatialAdapterReceipt(
  value: unknown,
): CaptionVisualIntelligenceSpatialAdapterReceipt {
  assertClosedContractTree(
    value, 'Caption Visual Intelligence spatial adapter receipt')
  const receipt = receiptSchema.parse(value)
  if (receipt.adapterDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>, 'adapterDigestSha256')) {
    throw new Error('Caption Visual Intelligence spatial adapter receipt is stale.')
  }
  return structuredClone(receipt)
}

const receiptWithoutDigest: Omit<
  CaptionVisualIntelligenceSpatialAdapterReceipt,
  'adapterDigestSha256'
> = {
  schemaVersion: CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_VERSION,
  adapterId: 'captions.visual-intelligence.spatial-evidence.adapter',
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt',
    branch: 'codex/backend-workflow-pipeline-continuation',
    sourceCommit: '5130e3c70f3f633e6877aa3feff4dc296eba525b',
    sourceTree: '03c2f34cddf23e6d180869068c1c0367129e37d2',
    visualIntelligencePublicTypeFileSha256:
      '59b71de0c66c97c3129920c38c39262b259fc0434895d029c3b430ab895ca5c1',
  },
  consumedReportVersion: 'visual-intelligence-report-v1',
  consumedAuthenticatedReadResultVersion:
    'visual-intelligence-authenticated-read-result-v1',
  consumedSpatialEvidenceVersion: 'visual-intelligence-spatial-evidence-v1',
  projectedCaptionPacketVersion:
    'caption-visual-intelligence-evidence-packet-v1',
  requiredPayloadPurpose: 'final_frame_occupancy',
  sourcePublicTypeCopiedByteForByte: true,
  backendImplementationImported: false,
  exactAuthenticatedReportRereadRequired: true,
  exactSpatialEvidenceDigestRereadRequired: true,
  exactScopeFrameArtifactAndRangeBindingRequired: true,
  semanticGeometryOnly: true,
  deterministicPixelGeometryClaimed: false,
  measuredContrastAvailableFromSpatialEvidenceV1: false,
  renderedCaptionInspectionAdmitted: false,
  directPeerDispatchAdded: false,
  providerCallAuthorityGranted: false,
  runtimeExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  costOrBillingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_RECEIPT =
parseCaptionVisualIntelligenceSpatialAdapterReceipt({
  ...receiptWithoutDigest,
  adapterDigestSha256: calculateSkillContractDigest({
    ...receiptWithoutDigest,
    adapterDigestSha256: '',
  }, 'adapterDigestSha256'),
})
