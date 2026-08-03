import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  VISUAL_INSPECTION_REQUIREMENT_VERSION,
  VISUAL_INSPECTION_RESULT_VERSION,
  VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
  VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
  VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_OPERATIONS,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_RESULT_VERSION,
  VISUAL_INTELLIGENCE_PLANNING_OPERATION_VERSION,
  VISUAL_INTELLIGENCE_QUALITY_PROFILE,
  VISUAL_INTELLIGENCE_QUERY_PROFILES,
  VISUAL_INTELLIGENCE_REPORT_VERSION,
  VISUAL_INTELLIGENCE_REQUEST_VERSION,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
  type VisualInspectionRequirement,
  type VisualInspectionResult,
  type VisualIntelligenceCoverage,
  type VisualIntelligenceEvidence,
  type VisualIntelligenceEvidenceRef,
  type VisualIntelligenceOperation,
  type VisualIntelligencePlanningOperationInput,
  type VisualIntelligencePreparedEvidence,
  type VisualIntelligenceProfile,
  type VisualIntelligenceProviderNormalizedResult,
  type VisualIntelligenceQualityPolicy,
  type VisualIntelligenceReport,
  type VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'

export const VISUAL_INTELLIGENCE_CONTRACT_VALIDATOR_VERSION =
  'visual-intelligence-contract-validator-v1' as const

const MAX_JSON_NODES = 50_000
const MAX_JSON_DEPTH = 48
const MAX_STRING_LENGTH = 16_384
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^sha256:[a-f0-9]{64}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const SAFE_VERSION = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/u
const MIME_TYPE = /^(?:video\/(?:mp4|quicktime|webm)|image\/(?:png|jpeg))$/u
const GCS_URI = /^gs:\/\/[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]\/[^?#\\]+$/u
const UNSAFE_SERIALIZED_TEXT =
  /(?:https?:\/\/|file:|data:|blob:|javascript:|\/Users\/|\/Volumes\/|\/tmp\/|\\|x-goog-|api[_ -]?key|password|credential|secret|access[_ -]?token|refresh[_ -]?token|\bsk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/iu
const EXECUTABLE_TEXT =
  /(?:\b(?:curl|wget|powershell|bash|zsh|cmd\.exe)\b|\brm\s+-rf\b|\bsudo\b|<script\b|\$\([^)]*\)|`[^`]+`)/iu

const safeIdSchema = z.string().regex(SAFE_ID)
const versionSchema = z.string().regex(SAFE_VERSION)
const prefixedShaSchema = z.string().regex(SHA256)
const rawShaSchema = z.string().regex(RAW_SHA256)
const safeNarrativeSchema = z.string().trim().min(1).max(MAX_STRING_LENGTH)
  .superRefine((value, context) => {
    if (UNSAFE_SERIALIZED_TEXT.test(value) || EXECUTABLE_TEXT.test(value)) {
      context.addIssue({
        code: 'custom',
        message: 'Serialized Visual Intelligence text contains unsafe material.',
      })
    }
  })

const evidenceRefSchema = z.object({
  id: safeIdSchema,
  version: z.number().int().positive().max(1_000_000),
  contentHash: prefixedShaSchema,
}).strict()

const frameRateSchema = z.object({
  numerator: z.number().int().positive().max(1_000_000),
  denominator: z.number().int().positive().max(1_000_000),
}).strict()

const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  endFrameExclusive: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  frameRate: frameRateSchema,
}).strict().superRefine((value, context) => {
  if (value.endFrameExclusive <= value.startFrame) {
    context.addIssue({
      code: 'custom',
      message: 'A Visual Intelligence frame range must be non-empty.',
    })
  }
})

const artifactBindingSchema = z.object({
  artifactId: safeIdSchema,
  mediaKind: z.enum(['video', 'image']),
  contentType: z.string().regex(MIME_TYPE),
  checksumSha256: rawShaSchema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  width: z.number().int().positive().max(32_768),
  height: z.number().int().positive().max(32_768),
  durationFrames: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  frameRate: frameRateSchema,
  finalizedMediaAuthorityRef: evidenceRefSchema,
  immutableStorageObjectAuthorityRef: evidenceRefSchema,
  mediaProbeEvidenceRef: evidenceRefSchema,
  privateArtifact: z.literal(true),
  exactGenerationRereadRequiredAtDispatch: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.mediaKind === 'video' && !value.contentType.startsWith('video/')) {
    context.addIssue({ code: 'custom', message: 'Video artifact MIME mismatch.' })
  }
  if (value.mediaKind === 'image' && !value.contentType.startsWith('image/')) {
    context.addIssue({ code: 'custom', message: 'Image artifact MIME mismatch.' })
  }
  if (value.mediaKind === 'image' && value.durationFrames !== 1) {
    context.addIssue({ code: 'custom', message: 'Image artifacts have one frame.' })
  }
})

const outputFrameSchema = z.object({
  outputId: safeIdSchema,
  aspectRatioLabel: safeNarrativeSchema.max(80),
  aspectRatioNumerator: z.number().int().positive().max(100_000),
  aspectRatioDenominator: z.number().int().positive().max(100_000),
  width: z.number().int().positive().max(32_768),
  height: z.number().int().positive().max(32_768),
  frameRate: frameRateSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  confirmedByUser: z.literal(true),
}).strict()

const protectedZoneSchema = z.object({
  zoneId: safeIdSchema,
  role: z.enum([
    'face', 'speaker', 'product', 'caption', 'graphic', 'map_label',
    'chart_label', 'source_label', 'fact_safety_note', 'custom',
  ]),
  xBasisPoints: z.number().int().min(0).max(10_000),
  yBasisPoints: z.number().int().min(0).max(10_000),
  widthBasisPoints: z.number().int().positive().max(10_000),
  heightBasisPoints: z.number().int().positive().max(10_000),
  protectedZoneRef: evidenceRefSchema,
}).strict().superRefine((value, context) => {
  if (
    value.xBasisPoints + value.widthBasisPoints > 10_000
    || value.yBasisPoints + value.heightBasisPoints > 10_000
  ) {
    context.addIssue({ code: 'custom', message: 'Protected zone exceeds output.' })
  }
})

const qualityPolicySchema = z.object({
  profile: z.literal(VISUAL_INTELLIGENCE_QUALITY_PROFILE),
  providerAdapterId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  thinkingLevel: z.literal(VISUAL_INTELLIGENCE_THINKING_LEVEL),
  mediaResolution: z.literal(VISUAL_INTELLIGENCE_MEDIA_RESOLUTION),
  proClassModelRequired: z.literal(true),
  flashFallbackAllowed: z.literal(false),
  cheaperModelFallbackAllowed: z.literal(false),
  lowerQualityFallbackAllowed: z.literal(false),
  silentModelSubstitutionAllowed: z.literal(false),
  providerToolsAllowed: z.literal(false),
  functionCallingAllowed: z.literal(false),
  searchGroundingAllowed: z.literal(false),
  urlContextAllowed: z.literal(false),
  codeExecutionAllowed: z.literal(false),
}).strict()

const costPreflightSchema = z.object({
  pricingSnapshotRef: evidenceRefSchema,
  accountEffectiveRateAuthorityRef: evidenceRefSchema,
  currency: z.string().regex(/^[A-Z]{3}$/u),
  maximumAuthorizedCostMicros: z.number().int().nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  estimatedMinimumCostMicros: z.number().int().nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  estimatedMaximumCostMicros: z.number().int().nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  serviceFeeIncluded: z.literal(false),
  publicListPriceUsedAsSettlementAuthority: z.literal(false),
  preflightPassed: z.literal(true),
}).strict().superRefine((value, context) => {
  if (
    value.estimatedMinimumCostMicros > value.estimatedMaximumCostMicros
    || value.estimatedMaximumCostMicros > value.maximumAuthorizedCostMicros
  ) context.addIssue({ code: 'custom', message: 'Cost preflight range is invalid.' })
})

const planningAdmissionSchema = z.object({
  mode: z.literal('planning_evidence'),
  authenticatedPrincipalRef: evidenceRefSchema,
  workspaceAuthorizationRef: evidenceRefSchema,
  finalizedSourceAuthorityRefs: z.array(evidenceRefSchema).min(1).max(64),
  sourceChecksumSetRef: evidenceRefSchema,
  analysisAllowanceRef: evidenceRefSchema,
  costPreflight: costPreflightSchema,
  retentionPolicyRef: evidenceRefSchema,
  privacyPolicyRef: evidenceRefSchema,
  providerReleaseRef: evidenceRefSchema,
  globalKillSwitchOpen: z.literal(false),
  providerKillSwitchOpen: z.literal(false),
  reportPersistenceAllowed: z.literal(true),
  timelineMutationAllowed: z.literal(false),
  editingWorkerExecutionAllowed: z.literal(false),
  generationAllowed: z.literal(false),
  renderAllowed: z.literal(false),
  exportAllowed: z.literal(false),
  deliveryAllowed: z.literal(false),
}).strict()

const inspectionAdmissionSchema = z.object({
  mode: z.literal('approved_edit_inspection'),
  authenticatedPrincipalRef: evidenceRefSchema,
  workspaceAuthorizationRef: evidenceRefSchema,
  approvedPlanSnapshotRef: evidenceRefSchema,
  approvedEstimateRef: evidenceRefSchema,
  creditReservationRef: evidenceRefSchema,
  privatePreviewArtifactRef: evidenceRefSchema,
  expectedOutcomeRefs: z.array(evidenceRefSchema).min(1).max(512),
  workNodeRefs: z.array(evidenceRefSchema).min(1).max(512),
  timelineRefs: z.array(evidenceRefSchema).min(1).max(512),
  qaPolicyRef: evidenceRefSchema,
  costPreflight: costPreflightSchema,
  retentionPolicyRef: evidenceRefSchema,
  privacyPolicyRef: evidenceRefSchema,
  providerReleaseRef: evidenceRefSchema,
  globalKillSwitchOpen: z.literal(false),
  providerKillSwitchOpen: z.literal(false),
  reportPersistenceAllowed: z.literal(true),
  timelineMutationAllowed: z.literal(false),
  owningSkillRepairAllowed: z.literal(true),
  directRepairAllowed: z.literal(false),
  finalQaApprovalAllowed: z.literal(false),
  exportReleaseAllowed: z.literal(false),
  deliveryAllowed: z.literal(false),
}).strict()

const scopeSchema = z.object({
  ownerUserId: safeIdSchema,
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  approvedSnapshotId: safeIdSchema.nullable(),
}).strict()

const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_REQUEST_VERSION),
  requestId: safeIdSchema,
  idempotencyKey: safeIdSchema,
  scope: scopeSchema,
  operation: z.enum(VISUAL_INTELLIGENCE_OPERATIONS),
  profile: z.enum([
    ...VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
    ...VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
    ...VISUAL_INTELLIGENCE_QUERY_PROFILES,
    ...VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
  ]),
  sourceArtifacts: z.array(artifactBindingSchema).min(1).max(64),
  comparisonArtifacts: z.array(artifactBindingSchema).max(64),
  requestedRanges: z.array(frameRangeSchema).min(1).max(1_024),
  requiredEvidenceRefs: z.array(evidenceRefSchema).max(512),
  expectedOutcomeRefs: z.array(evidenceRefSchema).max(512),
  outputFrame: outputFrameSchema.nullable(),
  protectedZones: z.array(protectedZoneSchema).max(512),
  qualityPolicy: qualityPolicySchema,
  admission: z.discriminatedUnion('mode', [
    planningAdmissionSchema,
    inspectionAdmissionSchema,
  ]),
  callerQuestion: safeNarrativeSchema.max(2_000).nullable(),
  byteFreeRequest: z.literal(true),
  callerPromptAccepted: z.literal(false),
  providerCredentialIncluded: z.literal(false),
  publicMediaUrlIncluded: z.literal(false),
  signedUrlIsSourceTruth: z.literal(false),
  shellCommandIncluded: z.literal(false),
  providerToolDefinitionIncluded: z.literal(false),
}).strict()

const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: prefixedShaSchema,
}).strict().superRefine(validateRequestSemantics)

const planningOperationInputWithoutDigestSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_PLANNING_OPERATION_VERSION),
  requestId: safeIdSchema,
  idempotencyKey: safeIdSchema,
  scope: scopeSchema.extend({
    approvedSnapshotId: z.null(),
  }).strict(),
  operation: z.enum(['analyze_media', 'query_range', 'compare_media']),
  profile: z.enum([
    ...VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
    ...VISUAL_INTELLIGENCE_QUERY_PROFILES,
    ...VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
  ]),
  sourceEvidenceRequests: z.array(requestSchema).min(1).max(8),
  comparisonEvidenceRequests: z.array(requestSchema).max(8),
  requestedRanges: z.array(frameRangeSchema).min(1).max(64),
  expectedOutcomeRefs: z.array(evidenceRefSchema).max(256),
  outputFrame: outputFrameSchema.nullable(),
  protectedZones: z.array(protectedZoneSchema).max(256),
  callerQuestion: safeNarrativeSchema.max(2_000).nullable(),
  byteFreeRequest: z.literal(true),
  callerPromptAccepted: z.literal(false),
  callerAdmissionAccepted: z.literal(false),
  callerCostAssertionAccepted: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  providerCredentialIncluded: z.literal(false),
}).strict()

const planningOperationInputSchema =
  planningOperationInputWithoutDigestSchema.extend({
    inputDigestSha256: prefixedShaSchema,
  }).strict().superRefine(validatePlanningOperationInputSemantics)

const evidenceSchema = z.object({
  evidenceId: safeIdSchema,
  evidenceRef: evidenceRefSchema,
  artifactId: safeIdSchema,
  range: frameRangeSchema.nullable(),
  authority: z.enum([
    'media_probe', 'media_transform', 'scene_detection', 'pixel_measurement',
    'canonical_transcript', 'exact_ocr', 'semantic_visual_judgment',
  ]),
  producingTool: z.enum([
    'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'faster_whisper', 'ocr',
    'gemini_pro_high',
  ]),
  toolVersion: versionSchema,
  summary: safeNarrativeSchema,
  privateEvidence: z.literal(true),
  providerInstructionAccepted: z.literal(false),
}).strict()

const toolExecutionEvidenceSchema = z.object({
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
  policyId: safeIdSchema,
  policyVersion: versionSchema,
  mode: z.enum([
    'native_complete_video', 'scene_aware_complete_coverage',
    'general_overview', 'moderate_visual_change', 'fast_motion',
    'transition_detail', 'high_frequency_defect',
  ]),
  targetFramesPerSecondNumerator: z.number().int().positive().max(1_000),
  targetFramesPerSecondDenominator: z.number().int().positive().max(1_000),
  sceneAware: z.boolean(),
  highDetail: z.boolean(),
  requestedRange: frameRangeSchema,
  analyzedRange: frameRangeSchema,
  samplingPolicyRef: evidenceRefSchema,
}).strict()

const coverageSchema = z.object({
  requestedRanges: z.array(frameRangeSchema).min(1).max(1_024),
  analyzedRanges: z.array(frameRangeSchema).min(1).max(4_096),
  incompleteRanges: z.array(frameRangeSchema).max(4_096),
  sceneBoundaryRefs: z.array(evidenceRefSchema).max(4_096),
  samplingPolicies: z.array(samplingPolicySchema).min(1).max(4_096),
  targetedFollowupRanges: z.array(frameRangeSchema).max(4_096),
  completeRequestedRangeCoverage: z.boolean(),
  everyTimelineFrameInspected: z.literal(false),
  completeTimePixelInspectionClaimAllowed: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.completeRequestedRangeCoverage !== (value.incompleteRanges.length === 0)) {
    context.addIssue({ code: 'custom', message: 'Coverage completeness is inconsistent.' })
  }
})

const privateMediaInputSchema = z.object({
  artifactId: safeIdSchema,
  gcsUri: z.string().regex(GCS_URI).max(2_048),
  contentType: z.string().regex(MIME_TYPE),
  checksumSha256: rawShaSchema,
  exactGenerationRereadVerified: z.literal(true),
}).strict().superRefine((value, context) => {
  if (
    containsAsciiControlCharacter(value.gcsUri)
    || value.gcsUri.includes('/../')
    || value.gcsUri.includes('/./')
  ) context.addIssue({
    code: 'custom',
    message: 'Private Visual Intelligence media coordinate is invalid.',
  })
})

function containsAsciiControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 31 || codePoint === 127
  })
}

const preparedEvidenceSchema = z.object({
  deterministicEvidence: z.array(evidenceSchema).min(1).max(20_000),
  coveragePlan: coverageSchema,
  privateMediaInputs: z.array(privateMediaInputSchema).min(1).max(64),
  transcriptVersion: versionSchema.nullable(),
  ocrVersion: versionSchema.nullable(),
  toolExecutionEvidence: z.array(toolExecutionEvidenceSchema).min(1).max(64),
  preparedEvidenceRef: evidenceRefSchema,
}).strict()

const sourcePlanningObservationSchema = z.object({
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
  segmentId: safeIdSchema,
  artifactId: safeIdSchema,
  range: frameRangeSchema,
  sceneId: safeIdSchema.nullable(),
  summary: safeNarrativeSchema,
  subjectIds: z.array(safeIdSchema).max(256),
  objectIds: z.array(safeIdSchema).max(256),
  actionLabels: z.array(safeNarrativeSchema.max(160)).max(256),
  visibleTextEvidenceRefs: z.array(evidenceRefSchema).max(256),
  transcriptEvidenceRefs: z.array(evidenceRefSchema).max(256),
  evidenceRefs: z.array(evidenceRefSchema).min(1).max(512),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  uncertainty: safeNarrativeSchema.nullable(),
  sourcePlanning: sourcePlanningObservationSchema.nullable(),
}).strict()

const findingSchema = z.object({
  findingId: safeIdSchema,
  artifactId: safeIdSchema,
  range: frameRangeSchema,
  category: safeIdSchema,
  severity: z.enum(['info', 'warning', 'revision_required', 'blocking']),
  summary: safeNarrativeSchema,
  evidenceRefs: z.array(evidenceRefSchema).min(1).max(512),
  expectedOutcomeRefs: z.array(evidenceRefSchema).max(512),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  uncertainty: safeNarrativeSchema.nullable(),
  recommendedOwner: z.enum([
    'planning', 'caption', 'graphics', 'motion_graphics', 'living_frame',
    'smart_cut', 'compositing', 'color', 'aspect_ratio', 'render',
    'private_review', 'human_review',
  ]),
  reinspectionRequired: z.boolean(),
  directTimelineMutationAllowed: z.literal(false),
  providerInstructionAccepted: z.literal(false),
}).strict()

const usageSchema = z.object({
  promptTokenCount: z.number().int().nonnegative(),
  candidateTokenCount: z.number().int().nonnegative(),
  thinkingTokenCount: z.number().int().nonnegative(),
  cachedTokenCount: z.number().int().nonnegative(),
  totalTokenCount: z.number().int().nonnegative(),
  providerResponseId: safeIdSchema,
  providerModelVersion: versionSchema,
  estimatedCostMicros: z.number().int().nonnegative(),
  settledCostMicros: z.number().int().nonnegative().nullable(),
  costEvidenceRef: evidenceRefSchema.nullable(),
  billingAccountEffectiveRateUsed: z.literal(true),
  publicListPriceUsed: z.literal(false),
  duplicateSettlementPerformed: z.literal(false),
  replayedFromCache: z.boolean(),
  providerCallMade: z.boolean(),
}).strict().superRefine((value, context) => {
  const expected = value.promptTokenCount + value.candidateTokenCount
    + value.thinkingTokenCount
  if (value.totalTokenCount < expected) {
    context.addIssue({ code: 'custom', message: 'Provider usage total is inconsistent.' })
  }
  if (!value.providerCallMade && !value.replayedFromCache) {
    context.addIssue({ code: 'custom', message: 'Usage lacks execution or replay evidence.' })
  }
})

const provenanceSchema = z.object({
  providerAdapterId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID),
  providerId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ID),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  thinkingLevel: z.literal(VISUAL_INTELLIGENCE_THINKING_LEVEL),
  mediaResolution: z.literal(VISUAL_INTELLIGENCE_MEDIA_RESOLUTION),
  promptVersion: versionSchema,
  responseSchemaVersion: versionSchema,
  deterministicEvidenceVersion: versionSchema,
  transcriptVersion: versionSchema.nullable(),
  ocrVersion: versionSchema.nullable(),
  cacheIdentitySha256: prefixedShaSchema,
  requestDigestSha256: prefixedShaSchema,
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
  artifactId: safeIdSchema,
  checksumSha256: rawShaSchema,
  mediaKind: z.enum(['video', 'image']),
  durationFrames: z.number().int().positive(),
}).strict()

const reportWithoutDigestSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_REPORT_VERSION),
  reportId: safeIdSchema,
  requestRef: evidenceRefSchema,
  scope: scopeSchema,
  operation: z.enum(VISUAL_INTELLIGENCE_OPERATIONS),
  profile: requestWithoutDigestSchema.shape.profile,
  sourceArtifacts: z.array(reportArtifactSchema).min(1).max(64),
  comparisonArtifacts: z.array(reportArtifactSchema).max(64),
  coverage: coverageSchema,
  semanticSummary: safeNarrativeSchema,
  segments: z.array(segmentSchema).max(10_000),
  findings: z.array(findingSchema).max(10_000),
  evidence: z.array(evidenceSchema).min(1).max(20_000),
  deterministicToolExecutions: z.array(toolExecutionEvidenceSchema)
    .min(1).max(64),
  expectedOutcomeRefs: z.array(evidenceRefSchema).max(512),
  disposition: z.enum(['pass', 'pass_with_warnings', 'needs_revision', 'blocked']),
  reinspectionRequired: z.boolean(),
  usage: usageSchema,
  provenance: provenanceSchema,
  blockers: z.array(safeNarrativeSchema).max(512),
  warnings: z.array(safeNarrativeSchema).max(512),
  immutableReport: z.literal(true),
  planningMayConsumeValidatedEvidence: z.boolean(),
  directTimelineMutationAllowed: z.literal(false),
  renderPerformedByVisualIntelligence: z.literal(false),
  exportAuthorized: z.literal(false),
  deliveryAuthorized: z.literal(false),
}).strict()

const reportSchema = reportWithoutDigestSchema.extend({
  reportDigestSha256: prefixedShaSchema,
}).strict().superRefine((value, context) => {
  validateUnique(value.evidence.map((item) => item.evidenceId), context, 'evidence ID')
  validateUnique(value.segments.map((item) => item.segmentId), context, 'segment ID')
  validateUnique(value.findings.map((item) => item.findingId), context, 'finding ID')
  validateUnique(
    value.deterministicToolExecutions.map((item) => item.tool),
    context,
    'deterministic tool execution',
  )
  const evidenceHashes = new Set(value.evidence.map((item) => refKey(item.evidenceRef)))
  const artifactIds = new Set([
    ...value.sourceArtifacts.map((item) => item.artifactId),
    ...value.comparisonArtifacts.map((item) => item.artifactId),
  ])
  for (const segment of value.segments) {
    if (!artifactIds.has(segment.artifactId)) {
      context.addIssue({ code: 'custom', message: 'Segment cites an unknown artifact.' })
    }
    for (const ref of segment.evidenceRefs) {
      if (!evidenceHashes.has(refKey(ref))) {
        context.addIssue({ code: 'custom', message: 'Segment cites unknown evidence.' })
      }
    }
  }
  for (const finding of value.findings) {
    if (!artifactIds.has(finding.artifactId)) {
      context.addIssue({ code: 'custom', message: 'Finding cites an unknown artifact.' })
    }
    for (const ref of finding.evidenceRefs) {
      if (!evidenceHashes.has(refKey(ref))) {
        context.addIssue({ code: 'custom', message: 'Finding cites unknown evidence.' })
      }
    }
  }
  const expectedDisposition = deriveDisposition(value.findings, value.blockers)
  if (value.disposition !== expectedDisposition) {
    context.addIssue({ code: 'custom', message: 'Report disposition is not derived.' })
  }
  const expectedReinspection = value.findings.some((item) => item.reinspectionRequired)
  if (value.reinspectionRequired !== expectedReinspection) {
    context.addIssue({ code: 'custom', message: 'Reinspection status is inconsistent.' })
  }
  if (value.planningMayConsumeValidatedEvidence !== (
    value.operation !== 'inspect_edit'
    && value.blockers.length === 0
    && value.coverage.completeRequestedRangeCoverage
  )) context.addIssue({ code: 'custom', message: 'Planning evidence status is invalid.' })
  if (!visualIntelligenceSourcePlanningSegmentsAreComplete({
    profile: value.profile,
    sourceArtifacts: value.sourceArtifacts,
    segments: value.segments,
    targetedFollowupRangeCount: value.coverage.targetedFollowupRanges.length,
  })) context.addIssue({
    code: 'custom',
    message: 'Source-planning segment classifications are incomplete or profile-scoped incorrectly.',
  })
})

const providerResultSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_PROVIDER_RESULT_VERSION),
  requestId: safeIdSchema,
  semanticSummary: safeNarrativeSchema,
  segments: z.array(segmentSchema).max(10_000),
  findings: z.array(findingSchema).max(10_000),
  targetedFollowupRanges: z.array(frameRangeSchema).max(4_096),
  warnings: z.array(safeNarrativeSchema).max(512),
  mediaContentTreatedAsUntrusted: z.literal(true),
  providerInstructionsFollowedFromMedia: z.literal(false),
  editingOrRenderingClaimed: z.literal(false),
}).strict()

const inspectionRequirementWithoutDigestSchema = z.object({
  schemaVersion: z.literal(VISUAL_INSPECTION_REQUIREMENT_VERSION),
  inspectionId: safeIdSchema,
  owningWorkNodeId: safeIdSchema,
  owningSkillId: safeIdSchema,
  profile: z.enum(VISUAL_INTELLIGENCE_INSPECTION_PROFILES),
  expectedOutcomeRefs: z.array(evidenceRefSchema).min(1).max(512),
  requestedRanges: z.array(frameRangeSchema).min(1).max(1_024),
  required: z.boolean(),
  blocksNextWorkNode: z.boolean(),
  blocksPreview: z.boolean(),
  blocksFinalExport: z.boolean(),
  maximumRepairCycles: z.literal(2),
  currentRepairCycle: z.union([z.literal(0), z.literal(1), z.literal(2)]),
}).strict()

const inspectionRequirementSchema = inspectionRequirementWithoutDigestSchema.extend({
  inspectionDigestSha256: prefixedShaSchema,
}).strict()

const inspectionResultSchema = z.object({
  schemaVersion: z.literal(VISUAL_INSPECTION_RESULT_VERSION),
  inspectionRef: evidenceRefSchema,
  reportRef: evidenceRefSchema,
  disposition: z.enum(['pass', 'pass_with_warnings', 'needs_revision', 'blocked']),
  owningSkillId: safeIdSchema,
  findingIds: z.array(safeIdSchema).max(10_000),
  repairCycle: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  routeToOwningSkill: z.boolean(),
  automaticRepairAllowed: z.boolean(),
  automaticSpendStopped: z.boolean(),
  blocksNextWorkNode: z.boolean(),
  blocksPreview: z.boolean(),
  blocksFinalExport: z.boolean(),
  planningOrHumanReviewRequired: z.boolean(),
  visualIntelligenceMutatedEdit: z.literal(false),
}).strict().superRefine((value, context) => {
  const needsRepair = value.disposition === 'needs_revision'
  const blocked = value.disposition === 'blocked'
  const exhausted = needsRepair && value.repairCycle >= 2
  if (
    value.routeToOwningSkill !== needsRepair
    || value.automaticRepairAllowed !== (needsRepair && !exhausted)
    || value.automaticSpendStopped !== (blocked || exhausted)
    || value.planningOrHumanReviewRequired !== (blocked || exhausted)
  ) context.addIssue({ code: 'custom', message: 'Repair-loop state is inconsistent.' })
})

export function createProfessionalHighVisualIntelligenceQualityPolicy():
VisualIntelligenceQualityPolicy {
  return Object.freeze(qualityPolicySchema.parse({
    profile: VISUAL_INTELLIGENCE_QUALITY_PROFILE,
    providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    thinkingLevel: VISUAL_INTELLIGENCE_THINKING_LEVEL,
    mediaResolution: VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
    proClassModelRequired: true,
    flashFallbackAllowed: false,
    cheaperModelFallbackAllowed: false,
    lowerQualityFallbackAllowed: false,
    silentModelSubstitutionAllowed: false,
    providerToolsAllowed: false,
    functionCallingAllowed: false,
    searchGroundingAllowed: false,
    urlContextAllowed: false,
    codeExecutionAllowed: false,
  }))
}

export function createVisualIntelligenceRequest(
  input: Omit<VisualIntelligenceRequest, 'schemaVersion' | 'requestDigestSha256'>,
): VisualIntelligenceRequest {
  const safeInput = clonePlainJson(input)
  const draft = requestWithoutDigestSchema.parse({
    schemaVersion: VISUAL_INTELLIGENCE_REQUEST_VERSION,
    ...safeInput,
  })
  const request = requestSchema.parse({
    ...draft,
    requestDigestSha256: digestRef(draft),
  })
  return deepFreeze(request)
}

export function parseVisualIntelligenceRequest(
  value: unknown,
): VisualIntelligenceRequest {
  const parsed = requestSchema.parse(clonePlainJson(value))
  if (parsed.requestDigestSha256 !== digestRef(omit(parsed, 'requestDigestSha256'))) {
    throw new Error('Visual Intelligence request digest mismatch.')
  }
  return deepFreeze(parsed)
}

export function createVisualIntelligencePlanningOperationInput(
  input: Omit<
    VisualIntelligencePlanningOperationInput,
    'schemaVersion' | 'inputDigestSha256'
  >,
): VisualIntelligencePlanningOperationInput {
  const safeInput = clonePlainJson(input)
  const draft = planningOperationInputWithoutDigestSchema.parse({
    schemaVersion: VISUAL_INTELLIGENCE_PLANNING_OPERATION_VERSION,
    ...safeInput,
  })
  return deepFreeze(planningOperationInputSchema.parse({
    ...draft,
    inputDigestSha256: digestRef(draft),
  }))
}

export function parseVisualIntelligencePlanningOperationInput(
  value: unknown,
): VisualIntelligencePlanningOperationInput {
  const parsed = planningOperationInputSchema.parse(clonePlainJson(value))
  if (
    parsed.inputDigestSha256
      !== digestRef(omit(parsed, 'inputDigestSha256'))
  ) throw new Error('Visual Intelligence planning operation digest mismatch.')
  return deepFreeze(parsed)
}

export function createVisualIntelligenceReport(
  input: Omit<VisualIntelligenceReport, 'schemaVersion' | 'reportDigestSha256'>,
): VisualIntelligenceReport {
  const safeInput = clonePlainJson(input)
  const draft = reportWithoutDigestSchema.parse({
    schemaVersion: VISUAL_INTELLIGENCE_REPORT_VERSION,
    ...safeInput,
  })
  const report = reportSchema.parse({
    ...draft,
    reportDigestSha256: digestRef(draft),
  })
  return deepFreeze(report)
}

export function parseVisualIntelligenceReport(
  value: unknown,
): VisualIntelligenceReport {
  const parsed = reportSchema.parse(clonePlainJson(value))
  if (parsed.reportDigestSha256 !== digestRef(omit(parsed, 'reportDigestSha256'))) {
    throw new Error('Visual Intelligence report digest mismatch.')
  }
  return deepFreeze(parsed)
}

export function parseVisualIntelligenceProviderNormalizedResult(
  value: unknown,
): VisualIntelligenceProviderNormalizedResult {
  return deepFreeze(providerResultSchema.parse(clonePlainJson(value)))
}

export function parseVisualIntelligenceEvidence(
  value: unknown,
): VisualIntelligenceEvidence {
  return deepFreeze(evidenceSchema.parse(clonePlainJson(value)))
}

export function parseVisualIntelligenceCoverage(
  value: unknown,
): VisualIntelligenceCoverage {
  return deepFreeze(coverageSchema.parse(clonePlainJson(value)))
}

export function parseVisualIntelligencePreparedEvidence(
  value: unknown,
): VisualIntelligencePreparedEvidence {
  return deepFreeze(preparedEvidenceSchema.parse(clonePlainJson(value)))
}

export function createVisualInspectionRequirement(
  input: Omit<VisualInspectionRequirement,
    'schemaVersion' | 'inspectionDigestSha256' | 'maximumRepairCycles'>,
): VisualInspectionRequirement {
  const draft = inspectionRequirementWithoutDigestSchema.parse({
    schemaVersion: VISUAL_INSPECTION_REQUIREMENT_VERSION,
    maximumRepairCycles: 2,
    ...clonePlainJson(input),
  })
  return deepFreeze(inspectionRequirementSchema.parse({
    ...draft,
    inspectionDigestSha256: digestRef(draft),
  }))
}

export function parseVisualInspectionRequirement(
  value: unknown,
): VisualInspectionRequirement {
  const parsed = inspectionRequirementSchema.parse(clonePlainJson(value))
  if (
    parsed.inspectionDigestSha256
    !== digestRef(omit(parsed, 'inspectionDigestSha256'))
  ) throw new Error('Visual inspection requirement digest mismatch.')
  return deepFreeze(parsed)
}

export function parseVisualInspectionResult(value: unknown): VisualInspectionResult {
  return deepFreeze(inspectionResultSchema.parse(clonePlainJson(value)))
}

export function createVisualInspectionResult(
  input: VisualInspectionResult,
): VisualInspectionResult {
  return deepFreeze(inspectionResultSchema.parse(clonePlainJson(input)))
}

export function createVisualIntelligenceEvidenceRef(
  id: string,
  value: unknown,
  version = 1,
): VisualIntelligenceEvidenceRef {
  return deepFreeze(evidenceRefSchema.parse({
    id,
    version,
    contentHash: digestRef(value),
  }))
}

export function visualIntelligenceDigest(value: unknown): string {
  return digestRef(value)
}

export function visualIntelligenceCanonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(clonePlainJson(value)))
}

export function assertVisualIntelligenceProfileForOperation(
  operation: VisualIntelligenceOperation,
  profile: VisualIntelligenceProfile,
): void {
  const valid = operation === 'analyze_media'
    ? (VISUAL_INTELLIGENCE_ANALYZE_PROFILES as readonly string[]).includes(profile)
    : operation === 'inspect_edit'
      ? (VISUAL_INTELLIGENCE_INSPECTION_PROFILES as readonly string[]).includes(profile)
      : operation === 'query_range'
        ? (VISUAL_INTELLIGENCE_QUERY_PROFILES as readonly string[]).includes(profile)
        : (VISUAL_INTELLIGENCE_COMPARISON_PROFILES as readonly string[]).includes(profile)
  if (!valid) throw new Error('Visual Intelligence profile/operation mismatch.')
}

function validatePlanningOperationInputSemantics(
  value: z.infer<typeof planningOperationInputWithoutDigestSchema> & {
    inputDigestSha256: string
  },
  context: z.RefinementCtx,
): void {
  try {
    assertVisualIntelligenceProfileForOperation(value.operation, value.profile)
  } catch {
    context.addIssue({
      code: 'custom',
      message: 'Planning operation profile does not belong to operation.',
    })
  }
  if (
    value.profile === 'source_edit_planning'
    || value.profile === 'reference_preference_dna'
  ) context.addIssue({
    code: 'custom',
    message: 'Dedicated source/reference owners must create this profile.',
  })
  const allParents = [
    ...value.sourceEvidenceRequests,
    ...value.comparisonEvidenceRequests,
  ]
  const parentRequestIds = allParents.map((request) => request.requestId)
  if (
    new Set(parentRequestIds).size !== parentRequestIds.length
    || parentRequestIds.includes(value.requestId)
  ) context.addIssue({
    code: 'custom',
    message: 'Planning operation upstream request identities are invalid.',
  })
  for (const parent of allParents) {
    if (
      parent.operation !== 'analyze_media'
      || parent.admission.mode !== 'planning_evidence'
      || parent.scope.approvedSnapshotId !== null
      || !sameScope(parent.scope, value.scope)
      || parent.sourceArtifacts.length !== 1
      || parent.comparisonArtifacts.length !== 0
    ) context.addIssue({
      code: 'custom',
      message: 'Planning operation needs exact admitted analysis parents.',
    })
  }
  const sourceArtifacts = value.sourceEvidenceRequests.flatMap(
    (request) => request.sourceArtifacts,
  )
  const comparisonArtifacts = value.comparisonEvidenceRequests.flatMap(
    (request) => request.sourceArtifacts,
  )
  const artifactIds = [...sourceArtifacts, ...comparisonArtifacts].map(
    (artifact) => artifact.artifactId,
  )
  if (new Set(artifactIds).size !== artifactIds.length) context.addIssue({
    code: 'custom',
    message: 'Planning operation media artifacts must be unique.',
  })
  if (
    (value.operation === 'compare_media'
      && comparisonArtifacts.length === 0)
    || (value.operation !== 'compare_media'
      && comparisonArtifacts.length > 0)
    || (value.operation !== 'compare_media' && sourceArtifacts.length !== 1)
  ) context.addIssue({
    code: 'custom',
    message: 'Planning operation media roles are invalid.',
  })
  if (
    (value.operation === 'query_range' && value.callerQuestion === null)
    || (value.operation !== 'query_range' && value.callerQuestion !== null)
  ) context.addIssue({
    code: 'custom',
    message: 'Only range queries may carry one bounded question.',
  })
  for (const range of value.requestedRanges) {
    if ([...sourceArtifacts, ...comparisonArtifacts].some(
      (artifact) => range.endFrameExclusive > artifact.durationFrames
        || range.frameRate.numerator !== artifact.frameRate.numerator
        || range.frameRate.denominator !== artifact.frameRate.denominator,
    )) context.addIssue({
      code: 'custom',
      message: 'Planning operation range exceeds or mismatches its media.',
    })
  }
}

function sameScope(
  left: z.infer<typeof scopeSchema>,
  right: z.infer<typeof scopeSchema>,
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function validateRequestSemantics(
  value: z.infer<typeof requestWithoutDigestSchema> & { requestDigestSha256: string },
  context: z.RefinementCtx,
): void {
  try {
    assertVisualIntelligenceProfileForOperation(value.operation, value.profile)
  } catch {
    context.addIssue({ code: 'custom', message: 'Profile does not belong to operation.' })
  }
  validateUnique(value.sourceArtifacts.map((item) => item.artifactId), context, 'source artifact')
  validateUnique(value.comparisonArtifacts.map((item) => item.artifactId), context, 'comparison artifact')
  validateUnique([
    ...value.sourceArtifacts,
    ...value.comparisonArtifacts,
  ].map((item) => item.artifactId), context, 'cross-role artifact')
  validateUnique(value.requiredEvidenceRefs.map(refKey), context, 'required evidence')
  validateUnique(value.protectedZones.map((item) => item.zoneId), context, 'protected zone')
  if (value.operation === 'compare_media' && value.comparisonArtifacts.length === 0) {
    context.addIssue({ code: 'custom', message: 'Comparison operation needs comparison media.' })
  }
  if (value.operation !== 'compare_media' && value.comparisonArtifacts.length > 0) {
    context.addIssue({ code: 'custom', message: 'Comparison media is operation-scoped.' })
  }
  if (value.operation === 'query_range' && value.callerQuestion === null) {
    context.addIssue({ code: 'custom', message: 'Range query needs a bounded question.' })
  }
  if (value.operation !== 'query_range' && value.callerQuestion !== null) {
    context.addIssue({ code: 'custom', message: 'Caller question is range-query only.' })
  }
  const approvedAdmission = value.admission.mode
    === 'approved_edit_inspection'
  if (value.operation === 'analyze_media' && approvedAdmission) {
    context.addIssue({
      code: 'custom',
      message: 'Whole-media analysis is planning evidence only.',
    })
  }
  if (value.operation === 'inspect_edit' && !approvedAdmission) {
    context.addIssue({
      code: 'custom',
      message: 'Edit inspection needs approved admission.',
    })
  }
  if (value.admission.mode === 'approved_edit_inspection') {
    if (
      value.scope.approvedSnapshotId === null
      || value.admission.approvedPlanSnapshotRef.id
        !== value.scope.approvedSnapshotId
      || value.outputFrame === null
      || !sameOrderedRefs(
        value.expectedOutcomeRefs,
        value.admission.expectedOutcomeRefs,
      )
    ) context.addIssue({
      code: 'custom',
      message: 'Approved Visual Intelligence evidence lost snapshot, frame, or outcome authority.',
    })
    if (
      value.operation === 'inspect_edit'
      && value.expectedOutcomeRefs.length === 0
    ) context.addIssue({
      code: 'custom',
      message: 'Edit inspection needs expected-outcome authority.',
    })
  } else if (value.scope.approvedSnapshotId !== null) {
    context.addIssue({
      code: 'custom',
      message: 'Planning evidence is preapproval.',
    })
  }
  const allowedRangeByArtifact = new Map<string, number>([
    ...value.sourceArtifacts,
    ...value.comparisonArtifacts,
  ].map((item) => [item.artifactId, item.durationFrames]))
  if (allowedRangeByArtifact.size === 0) {
    context.addIssue({ code: 'custom', message: 'No authorized media exists.' })
  }
  for (const range of value.requestedRanges) {
    if ([...value.sourceArtifacts, ...value.comparisonArtifacts].some(
      (artifact) => range.endFrameExclusive > artifact.durationFrames
        || range.frameRate.numerator !== artifact.frameRate.numerator
        || range.frameRate.denominator !== artifact.frameRate.denominator,
    )) context.addIssue({
      code: 'custom',
      message: 'Requested range exceeds or mismatches authorized media.',
    })
  }
  if (value.profile === 'source_edit_planning') {
    const source = value.sourceArtifacts[0]
    const requested = value.requestedRanges[0]
    if (
      value.sourceArtifacts.length !== 1
      || value.comparisonArtifacts.length !== 0
      || value.requestedRanges.length !== 1
      || !source
      || !requested
      || requested.startFrame !== 0
      || requested.endFrameExclusive !== source.durationFrames
      || requested.frameRate.numerator !== source.frameRate.numerator
      || requested.frameRate.denominator !== source.frameRate.denominator
    ) context.addIssue({
      code: 'custom',
      message: 'Source edit planning requires one exact full-source range.',
    })
  }
}

/**
 * The provider may semantically summarize windows, but source cleanup must
 * receive an explicit ordered partition of the complete source. This is not a
 * claim that the model inspected every pixel of every frame.
 */
export function visualIntelligenceSourcePlanningSegmentsAreComplete(input: {
  readonly profile: VisualIntelligenceProfile
  readonly sourceArtifacts: readonly {
    readonly artifactId: string
    readonly durationFrames: number
  }[]
  readonly segments: readonly {
    readonly artifactId: string
    readonly range: { readonly startFrame: number; readonly endFrameExclusive: number }
    readonly sourcePlanning: unknown | null
  }[]
  readonly targetedFollowupRangeCount: number
}): boolean {
  if (input.profile !== 'source_edit_planning') {
    return input.segments.every((segment) => segment.sourcePlanning === null)
  }
  const source = input.sourceArtifacts[0]
  if (
    input.sourceArtifacts.length !== 1
    || !source
    || input.segments.length < 1
    || input.targetedFollowupRangeCount !== 0
  ) return false
  let nextFrame = 0
  for (const segment of input.segments) {
    if (
      segment.artifactId !== source.artifactId
      || segment.sourcePlanning === null
      || segment.range.startFrame !== nextFrame
      || segment.range.endFrameExclusive <= segment.range.startFrame
      || segment.range.endFrameExclusive - segment.range.startFrame > 240
      || segment.range.endFrameExclusive > source.durationFrames
    ) return false
    nextFrame = segment.range.endFrameExclusive
  }
  return nextFrame === source.durationFrames
}

function deriveDisposition(
  findings: Array<{ severity: string }>,
  blockers: string[],
): VisualIntelligenceReport['disposition'] {
  if (blockers.length > 0 || findings.some((item) => item.severity === 'blocking')) {
    return 'blocked'
  }
  if (findings.some((item) => item.severity === 'revision_required')) {
    return 'needs_revision'
  }
  if (findings.some((item) => item.severity === 'warning')) {
    return 'pass_with_warnings'
  }
  return 'pass'
}

function validateUnique(
  values: string[],
  context: z.RefinementCtx,
  label: string,
): void {
  if (new Set(values).size !== values.length) {
    context.addIssue({ code: 'custom', message: `Duplicate ${label}.` })
  }
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function sameOrderedRefs(
  left: readonly VisualIntelligenceEvidenceRef[],
  right: readonly VisualIntelligenceEvidenceRef[],
): boolean {
  return left.length === right.length
    && left.every((ref, index) => refKey(ref) === refKey(right[index]!))
}

function digestRef(value: unknown): string {
  return `sha256:${createHash('sha256')
    .update(visualIntelligenceCanonicalJson(value))
    .digest('hex')}`
}

function omit<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const output = { ...value }
  Reflect.deleteProperty(output, key)
  return output
}

function clonePlainJson<T>(value: T): T {
  let nodes = 0
  const seen = new Set<object>()
  const visit = (current: unknown, depth: number): unknown => {
    nodes += 1
    if (nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) {
      throw new TypeError('Visual Intelligence payload exceeds structural bounds.')
    }
    if (
      current === null || typeof current === 'boolean'
      || (typeof current === 'number' && Number.isFinite(current))
      || (typeof current === 'string' && current.length <= MAX_STRING_LENGTH)
    ) return current
    if (typeof current !== 'object') {
      throw new TypeError('Visual Intelligence payload must be plain JSON.')
    }
    if (seen.has(current)) throw new TypeError('Visual Intelligence payload is cyclic.')
    seen.add(current)
    try {
      if (Array.isArray(current)) {
        if (Object.getPrototypeOf(current) !== Array.prototype) {
          throw new TypeError('Visual Intelligence arrays must be ordinary arrays.')
        }
        const descriptors = Object.getOwnPropertyDescriptors(current)
        const keys = Reflect.ownKeys(descriptors)
        for (let index = 0; index < current.length; index += 1) {
          const descriptor = descriptors[String(index)]
          if (!descriptor || !('value' in descriptor)) {
            throw new TypeError('Sparse or accessor-backed arrays are forbidden.')
          }
        }
        if (keys.some((key) => typeof key === 'symbol')) {
          throw new TypeError('Symbol keys are forbidden.')
        }
        return current.map((item) => visit(item, depth + 1))
      }
      const prototype = Object.getPrototypeOf(current)
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError('Visual Intelligence objects must be plain records.')
      }
      const descriptors = Object.getOwnPropertyDescriptors(current)
      const output: Record<string, unknown> = {}
      for (const key of Reflect.ownKeys(descriptors)) {
        if (typeof key !== 'string') throw new TypeError('Symbol keys are forbidden.')
        const descriptor = descriptors[key]
        if (!descriptor || !('value' in descriptor)) {
          throw new TypeError('Accessors are forbidden in Visual Intelligence payloads.')
        }
        if (descriptor.value !== undefined) {
          output[key] = visit(descriptor.value, depth + 1)
        }
      }
      return output
    } finally {
      seen.delete(current)
    }
  }
  try {
    return visit(value, 0) as T
  } catch (error) {
    if (error instanceof TypeError) throw error
    throw new TypeError(
      'Visual Intelligence payload cannot be safely inspected.',
      { cause: error },
    )
  }
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, item]) => [key, canonicalValue(item)]))
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item)
  return value
}
