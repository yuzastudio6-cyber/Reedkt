import { z } from 'zod'

import {
  LIVING_FRAME_ACTIVATION_DECISIONS,
  LIVING_FRAME_ACTIVATION_ROLES,
  LIVING_FRAME_ALPHA_QA_EXPECTATIONS,
  LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS,
  LIVING_FRAME_ATTENTION_EVENT_TYPES,
  LIVING_FRAME_ATTENTION_METHODS,
  LIVING_FRAME_ATTENTION_TARGETS,
  LIVING_FRAME_CAPABILITY_KEYS,
  LIVING_FRAME_CAPABILITY_REQUIREMENT_ROLES,
  LIVING_FRAME_CLOSED_GATE_CODES,
  LIVING_FRAME_COMPLEXITY_LEVELS,
  LIVING_FRAME_COMPONENT_ROLES,
  LIVING_FRAME_CONTINUITY_KINDS,
  LIVING_FRAME_CONTRACT_SOURCE,
  LIVING_FRAME_CONTRACT_STATUSES,
  LIVING_FRAME_CONTRACT_VERSION,
  LIVING_FRAME_DEPTH_BANDS,
  LIVING_FRAME_DEPENDENCY_KINDS,
  LIVING_FRAME_DUCKING_EXPECTATIONS,
  LIVING_FRAME_EVIDENCE_CLASSES,
  LIVING_FRAME_FACTUAL_SCALE_GUARDS,
  LIVING_FRAME_FALLBACK_STEPS,
  LIVING_FRAME_FOCAL_ROLES,
  LIVING_FRAME_GENERATED_VIDEO_EXPECTATIONS,
  LIVING_FRAME_IMPORTANCE_LEVELS,
  LIVING_FRAME_INTENSITIES,
  LIVING_FRAME_MINI_SKILL_KEYS,
  LIVING_FRAME_MODES,
  LIVING_FRAME_NARRATION_PROTECTION,
  LIVING_FRAME_NARRATIVE_PURPOSE_CODES,
  LIVING_FRAME_PROVENANCE_EXPECTATIONS,
  LIVING_FRAME_QA_CODES,
  LIVING_FRAME_REASON_CODES,
  LIVING_FRAME_REGION_SAFETY_EXPECTATIONS,
  LIVING_FRAME_RUNTIME_READINESS,
  LIVING_FRAME_SCENE_DECISIONS,
  LIVING_FRAME_SEMANTIC_CUE_CODES,
  LIVING_FRAME_SEMANTIC_SCALE_MEANINGS,
  LIVING_FRAME_SEMANTIC_SCALE_MODES,
  LIVING_FRAME_SOUND_PRIORITIES,
  LIVING_FRAME_SOUND_PURPOSES,
  LIVING_FRAME_SOURCE_TRUTH_MODES,
  LIVING_FRAME_TIMING_PHASES,
  LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
  LIVING_FRAME_VALIDATION_ISSUE_CODES,
  LIVING_FRAME_VISUAL_VERBS,
  LIVING_FRAME_DECISIONS,
} from '../../types/living-frame'
import type {
  LivingFrameComplexityLevel,
  LivingFrameEstimateInputs,
  LivingFrameGeneratedVideoExpectation,
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
  LivingFrameScenePlan,
  LivingFrameValidationIssue,
  LivingFrameValidationIssueCode,
  LivingFrameValidationResult,
} from '../../types/living-frame'

const stableIdSchema = z.string()
  .min(3)
  .max(128)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/)
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const orderSchema = z.number().int().nonnegative().max(10_000)
const positiveVersionSchema = z.number().int().positive().max(1_000_000)
const nonNegativeCountSchema = z.number().int().nonnegative().max(100_000)

const URL_PATTERN = /(?:\b(?:https?|ftp):\/\/|www\.|(?:^|\s)[a-z0-9.-]+\.(?:com|net|org|io|ai|dev)(?:\b|\/))/i
const SECRET_PATTERN = /(?:\bsk-[a-z0-9_-]{10,}|\b(?:api[_-]?key|secret|bearer|password|access[_-]?token)\s*[:=]\s*\S+)/i

const FORBIDDEN_INPUT_KEYS = new Set([
  'rawChat',
  'raw_chat',
  'rawTranscript',
  'raw_transcript',
  'customInstructions',
  'custom_instructions',
  'prompt',
  'systemPrompt',
  'system_prompt',
  'userPrompt',
  'user_prompt',
  'instruction',
  'instructions',
  'mediaBytes',
  'media_bytes',
  'base64',
  'filePath',
  'file_path',
  'signedUrl',
  'signed_url',
  'url',
  'apiKey',
  'api_key',
  'secret',
  'credentials',
  'command',
  'script',
  'code',
  'executableCode',
  'executable_code',
  'providerId',
  'provider_id',
  'modelId',
  'model_id',
  'toolId',
  'tool_id',
  'canonicalToolId',
  'canonical_tool_id',
  'toolRoute',
  'tool_route',
  'workItem',
  'workItems',
  'work_item',
  'work_items',
  'jobId',
  'job_id',
  'queueId',
  'queue_id',
  'dispatchId',
  'dispatch_id',
  'webhook',
  'approvalId',
  'approval_id',
  'snapshotId',
  'snapshot_id',
  'reservationId',
  'reservation_id',
  'ledgerId',
  'ledger_id',
  'price',
  'dollars',
  'credits',
  'serviceFee',
  'service_fee',
  'toolCost',
  'tool_cost',
  'exactFrames',
  'exact_frames',
  'gainDb',
  'gain_db',
  'pan',
  'mixDb',
  'mix_db',
])

const REQUIRED_CLOSED_GATES = [
  'canonical_planner_integration_required',
  'canonical_timing_revalidation_required',
  'canonical_estimate_required',
  'canonical_approval_required',
  'approved_snapshot_required',
  'controlled_illustration_qualification_required',
  'provider_route_review_required',
  'worker_schema_admission_required',
  'artifact_qa_required',
  'private_remotion_review_required',
] as const

const safeTextSchema = (maximumLength: number) => z.string()
  .min(1)
  .max(maximumLength)
  .superRefine((value, context) => {
    if (
      containsControlCharacter(value)
      || URL_PATTERN.test(value)
      || SECRET_PATTERN.test(value)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'unsafe_text',
      })
    }
  })

function containsControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0)
    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127)
  })
}

const expectationRefSchema = z.object({
  expectationRefId: stableIdSchema,
  expectedDigestSha256: sha256Schema,
  evidenceClass: z.enum(LIVING_FRAME_EVIDENCE_CLASSES),
}).strict()

const outputFrameExpectationSchema = expectationRefSchema.extend({
  confirmationStatus: z.literal('expected_confirmed'),
  expectedWidth: z.number().int().positive().max(16_384),
  expectedHeight: z.number().int().positive().max(16_384),
  expectedAspectRatioNumerator: z.number().int().positive().max(10_000),
  expectedAspectRatioDenominator: z.number().int().positive().max(10_000),
  liveAuthorityVerified: z.literal(false),
}).strict()

const masterTimingExpectationSchema = expectationRefSchema.extend({
  bindingStatus: z.literal('expected_current'),
  exactFrameAuthorityProvided: z.literal(false),
  liveAuthorityVerified: z.literal(false),
}).strict()

const segmentExpectationSchema = z.object({
  segmentExpectationId: stableIdSchema,
  order: orderSchema,
  sourceSegmentRef: expectationRefSchema,
  outputFrameExpectationRefId: stableIdSchema,
  masterTimingExpectationRefId: stableIdSchema,
}).strict()

const inputBindingsSchema = z.object({
  compiledIntent: expectationRefSchema,
  sourceSequence: expectationRefSchema,
  videoUnderstanding: expectationRefSchema,
  adaptiveStrategy: expectationRefSchema,
  outputFrame: outputFrameExpectationSchema,
  masterTiming: masterTimingExpectationSchema,
  safeZoneRefs: z.array(expectationRefSchema).max(32),
  faceProtectionRefs: z.array(expectationRefSchema).max(32),
  gestureProtectionRefs: z.array(expectationRefSchema).max(32),
  factSafetyRefs: z.array(expectationRefSchema).max(32),
  characterSafetyRefs: z.array(expectationRefSchema).max(32),
  segmentExpectations: z.array(segmentExpectationSchema).max(256),
}).strict()

const continuityPackRefSchema = z.object({
  continuityRefId: stableIdSchema,
  kind: z.enum(LIVING_FRAME_CONTINUITY_KINDS),
  version: positiveVersionSchema,
  expectedDigestSha256: sha256Schema,
  evidenceClass: z.enum(LIVING_FRAME_EVIDENCE_CLASSES),
  liveAuthorityVerified: z.literal(false),
}).strict()

const rejectedConceptSchema = z.object({
  conceptId: stableIdSchema,
  reasonCode: z.enum(LIVING_FRAME_REASON_CODES),
  reasonSummary: safeTextSchema(320),
}).strict()

const decisionSummarySchema = z.object({
  decision: z.enum(LIVING_FRAME_DECISIONS),
  reasonCode: z.enum(LIVING_FRAME_REASON_CODES),
  summary: safeTextSchema(480),
  selectedMode: z.enum(LIVING_FRAME_MODES).nullable(),
  rejectedConcepts: z.array(rejectedConceptSchema).max(24),
}).strict()

const componentDependencySchema = z.object({
  componentId: stableIdSchema,
  dependsOnComponentId: stableIdSchema,
  kind: z.enum(LIVING_FRAME_DEPENDENCY_KINDS),
}).strict()

const componentPlanSchema = z.object({
  componentId: stableIdSchema,
  order: orderSchema,
  role: z.enum(LIVING_FRAME_COMPONENT_ROLES),
  focalRole: z.enum(LIVING_FRAME_FOCAL_ROLES),
  summary: safeTextSchema(320),
  parentComponentId: stableIdSchema.nullable(),
  anchorComponentId: stableIdSchema.nullable(),
  depthBand: z.enum(LIVING_FRAME_DEPTH_BANDS),
  transparencyExpectation: z.enum(LIVING_FRAME_TRANSPARENCY_EXPECTATIONS),
  alphaSourceExpectation: z.enum(LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS),
  alphaQaExpectation: z.enum(LIVING_FRAME_ALPHA_QA_EXPECTATIONS),
  rectangularBackgroundRejectionRequired: z.boolean(),
  provenanceExpectation: z.enum(LIVING_FRAME_PROVENANCE_EXPECTATIONS),
  evidenceClass: z.enum(LIVING_FRAME_EVIDENCE_CLASSES),
  capabilityKeys: z.array(z.enum(LIVING_FRAME_CAPABILITY_KEYS)).max(24),
  continuityRefIds: z.array(stableIdSchema).max(32),
  qaExpectationCodes: z.array(z.enum(LIVING_FRAME_QA_CODES)).max(32),
}).strict()

const skillActivationSchema = z.object({
  activationId: stableIdSchema,
  order: orderSchema,
  miniSkillKey: z.enum(LIVING_FRAME_MINI_SKILL_KEYS),
  role: z.enum(LIVING_FRAME_ACTIVATION_ROLES),
  decision: z.enum(LIVING_FRAME_ACTIVATION_DECISIONS),
  intensity: z.enum(LIVING_FRAME_INTENSITIES),
  reasonCode: z.enum(LIVING_FRAME_REASON_CODES),
  reasonSummary: safeTextSchema(320),
  linkedComponentIds: z.array(stableIdSchema).max(64),
  linkedTimingRequestIds: z.array(stableIdSchema).max(32),
  dependsOnActivationIds: z.array(stableIdSchema).max(32),
  conflictsWithActivationIds: z.array(stableIdSchema).max(32),
  qaExpectationCodes: z.array(z.enum(LIVING_FRAME_QA_CODES)).max(32),
}).strict()

const semanticTimingRequestSchema = z.object({
  timingRequestId: stableIdSchema,
  order: orderSchema,
  phase: z.enum(LIVING_FRAME_TIMING_PHASES),
  cueCode: z.enum(LIVING_FRAME_SEMANTIC_CUE_CODES),
  summary: safeTextSchema(320),
  exactFramesProvided: z.literal(false),
}).strict()

const attentionEventSchema = z.object({
  attentionEventId: stableIdSchema,
  order: orderSchema,
  eventType: z.enum(LIVING_FRAME_ATTENTION_EVENT_TYPES),
  target: z.enum(LIVING_FRAME_ATTENTION_TARGETS),
  methods: z.array(z.enum(LIVING_FRAME_ATTENTION_METHODS)).max(7),
  summary: safeTextSchema(320),
  exactFramesProvided: z.literal(false),
}).strict()

const semanticScaleRequestSchema = z.object({
  semanticScaleRequestId: stableIdSchema,
  componentId: stableIdSchema,
  mode: z.enum(LIVING_FRAME_SEMANTIC_SCALE_MODES),
  meaning: z.enum(LIVING_FRAME_SEMANTIC_SCALE_MEANINGS),
  factualGuard: z.enum(LIVING_FRAME_FACTUAL_SCALE_GUARDS),
  summary: safeTextSchema(320),
}).strict()

const soundRequestSchema = z.object({
  soundRequestId: stableIdSchema,
  order: orderSchema,
  linkedComponentId: stableIdSchema.nullable(),
  purpose: z.enum(LIVING_FRAME_SOUND_PURPOSES),
  priority: z.enum(LIVING_FRAME_SOUND_PRIORITIES),
  narrationProtection: z.enum(LIVING_FRAME_NARRATION_PROTECTION),
  duckingExpectation: z.enum(LIVING_FRAME_DUCKING_EXPECTATIONS),
  summary: safeTextSchema(320),
  exactCuePlacementProvided: z.literal(false),
  exactMixProvided: z.literal(false),
}).strict()

const regionSafetySchema = z.object({
  captions: z.enum(LIVING_FRAME_REGION_SAFETY_EXPECTATIONS),
  face: z.enum(LIVING_FRAME_REGION_SAFETY_EXPECTATIONS),
  gestures: z.enum(LIVING_FRAME_REGION_SAFETY_EXPECTATIONS),
}).strict()

const scenePlanSchema = z.object({
  sceneId: stableIdSchema,
  order: orderSchema,
  segmentExpectationId: stableIdSchema,
  mode: z.enum(LIVING_FRAME_MODES),
  decision: z.enum(LIVING_FRAME_SCENE_DECISIONS),
  sourceTruthMode: z.enum(LIVING_FRAME_SOURCE_TRUTH_MODES),
  narrativePurposeCode: z.enum(LIVING_FRAME_NARRATIVE_PURPOSE_CODES),
  visualVerb: z.enum(LIVING_FRAME_VISUAL_VERBS),
  importance: z.enum(LIVING_FRAME_IMPORTANCE_LEVELS),
  summary: safeTextSchema(480),
  focalPrimaryComponentId: stableIdSchema,
  components: z.array(componentPlanSchema).min(1).max(128),
  componentDependencies: z.array(componentDependencySchema).max(256),
  skillActivations: z.array(skillActivationSchema).max(64),
  semanticTimingRequests: z.array(semanticTimingRequestSchema).max(16),
  attentionSequence: z.array(attentionEventSchema).max(16),
  semanticScaleRequests: z.array(semanticScaleRequestSchema).max(64),
  soundRequests: z.array(soundRequestSchema).max(64),
  regionSafety: regionSafetySchema,
  fallbackLadder: z.array(z.enum(LIVING_FRAME_FALLBACK_STEPS)).min(1).max(9),
  continuityRefIds: z.array(stableIdSchema).max(32),
  qaExpectationCodes: z.array(z.enum(LIVING_FRAME_QA_CODES)).max(32),
  closedGateCodes: z.array(z.enum(LIVING_FRAME_CLOSED_GATE_CODES)).max(16),
}).strict()

const capabilityRequirementSchema = z.object({
  capabilityKey: z.enum(LIVING_FRAME_CAPABILITY_KEYS),
  role: z.enum(LIVING_FRAME_CAPABILITY_REQUIREMENT_ROLES),
  linkedSceneIds: z.array(stableIdSchema).max(256),
  qualificationStatus: z.literal('abstract_capability_expectation_only'),
}).strict()

const estimateInputsSchema = z.object({
  sceneCount: nonNegativeCountSchema,
  componentCount: nonNegativeCountSchema,
  generatedStillCount: nonNegativeCountSchema,
  deterministicDrawCount: nonNegativeCountSchema,
  stillAlphaCount: nonNegativeCountSchema,
  temporalMaskCount: nonNegativeCountSchema,
  semanticTimingRequestCount: nonNegativeCountSchema,
  soundRequestCount: nonNegativeCountSchema,
  qaExpectationCount: nonNegativeCountSchema,
  continuityReferenceCount: nonNegativeCountSchema,
  motionComplexity: z.enum(LIVING_FRAME_COMPLEXITY_LEVELS),
  cameraComplexity: z.enum(LIVING_FRAME_COMPLEXITY_LEVELS),
  controlledIllustrationComplexity: z.enum(LIVING_FRAME_COMPLEXITY_LEVELS),
  generatedVideoExpectation: z.enum(LIVING_FRAME_GENERATED_VIDEO_EXPECTATIONS),
  pricingAuthorityProvided: z.literal(false),
}).strict()

const authorityBoundarySchema = z.object({
  planningOnly: z.literal(true),
  executable: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  costAuthority: z.literal(false),
}).strict()

export const livingFrameProfessionalSkillComponentDraftSchema = z.object({
  contractVersion: z.literal(LIVING_FRAME_CONTRACT_VERSION),
  contractSource: z.literal(LIVING_FRAME_CONTRACT_SOURCE),
  status: z.enum(LIVING_FRAME_CONTRACT_STATUSES),
  runtimeReadiness: z.literal(LIVING_FRAME_RUNTIME_READINESS),
  authorityBoundary: authorityBoundarySchema,
  inputBindings: inputBindingsSchema,
  decisionSummary: decisionSummarySchema,
  scenePlans: z.array(scenePlanSchema).max(256),
  continuityPackRefs: z.array(continuityPackRefSchema).max(256),
  capabilityRequirements: z.array(capabilityRequirementSchema).max(64),
  estimateInputs: estimateInputsSchema,
  qaExpectationCodes: z.array(z.enum(LIVING_FRAME_QA_CODES)).max(32),
  closedGateCodes: z.array(z.enum(LIVING_FRAME_CLOSED_GATE_CODES)).max(16),
}).strict()

export const livingFrameProfessionalSkillComponentSchema =
  livingFrameProfessionalSkillComponentDraftSchema.extend({
    contractDigestSha256: sha256Schema,
  }).strict()

export const LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY = Object.freeze({
  planningOnly: true,
  executable: false,
  timingAuthority: false,
  soundAuthority: false,
  estimateAuthority: false,
  approvalAuthority: false,
  runtimeAuthority: false,
  queueAuthority: false,
  providerAuthority: false,
  toolRouteAuthority: false,
  costAuthority: false,
} as const)

export class LivingFrameContractError extends Error {
  readonly issues: readonly LivingFrameValidationIssue[]

  constructor(issues: readonly LivingFrameValidationIssue[]) {
    super('Living Frame contract validation failed.')
    this.name = 'LivingFrameContractError'
    this.issues = issues
  }
}

interface EstimateComplexityInput {
  readonly scenePlans: readonly LivingFrameScenePlan[]
  readonly continuityReferenceCount: number
  readonly topLevelQaExpectationCount: number
  readonly motionComplexity: LivingFrameComplexityLevel
  readonly cameraComplexity: LivingFrameComplexityLevel
  readonly controlledIllustrationComplexity: LivingFrameComplexityLevel
  readonly generatedVideoExpectation: LivingFrameGeneratedVideoExpectation
}

export function deriveLivingFrameEstimateInputs(
  input: EstimateComplexityInput,
): LivingFrameEstimateInputs {
  const components = input.scenePlans.flatMap((scene) => scene.components)
  const qaExpectationCount = input.topLevelQaExpectationCount
    + input.scenePlans.reduce((total, scene) => (
      total
      + scene.qaExpectationCodes.length
      + scene.components.reduce(
        (componentTotal, component) => componentTotal + component.qaExpectationCodes.length,
        0,
      )
      + scene.skillActivations.reduce(
        (activationTotal, activation) => activationTotal + activation.qaExpectationCodes.length,
        0,
      )
    ), 0)

  return {
    sceneCount: input.scenePlans.length,
    componentCount: components.length,
    generatedStillCount: components.filter(
      (component) => component.provenanceExpectation === 'generated_illustration_expectation',
    ).length,
    deterministicDrawCount: components.filter(
      (component) => (
        component.provenanceExpectation === 'deterministic_draw_expectation'
        || component.provenanceExpectation === 'exact_map_data_expectation'
      ),
    ).length,
    stillAlphaCount: components.filter(
      (component) => (
        component.transparencyExpectation === 'native_alpha_preferred'
        || component.transparencyExpectation === 'still_alpha_required'
      ),
    ).length,
    temporalMaskCount: components.filter(
      (component) => component.transparencyExpectation === 'temporal_mask_required',
    ).length,
    semanticTimingRequestCount: input.scenePlans.reduce(
      (total, scene) => total + scene.semanticTimingRequests.length,
      0,
    ),
    soundRequestCount: input.scenePlans.reduce(
      (total, scene) => total + scene.soundRequests.length,
      0,
    ),
    qaExpectationCount,
    continuityReferenceCount: input.continuityReferenceCount,
    motionComplexity: input.motionComplexity,
    cameraComplexity: input.cameraComplexity,
    controlledIllustrationComplexity: input.controlledIllustrationComplexity,
    generatedVideoExpectation: input.generatedVideoExpectation,
    pricingAuthorityProvided: false,
  }
}

export function normalizeLivingFrameContractDraft(
  draft: LivingFrameProfessionalSkillComponentDraft,
): LivingFrameProfessionalSkillComponentDraft {
  const normalizeExpectationRefs = (
    refs: LivingFrameProfessionalSkillComponentDraft['inputBindings']['safeZoneRefs'],
  ) => [...refs].sort((left, right) => compareText(left.expectationRefId, right.expectationRefId))

  return {
    ...draft,
    inputBindings: {
      ...draft.inputBindings,
      safeZoneRefs: normalizeExpectationRefs(draft.inputBindings.safeZoneRefs),
      faceProtectionRefs: normalizeExpectationRefs(draft.inputBindings.faceProtectionRefs),
      gestureProtectionRefs: normalizeExpectationRefs(draft.inputBindings.gestureProtectionRefs),
      factSafetyRefs: normalizeExpectationRefs(draft.inputBindings.factSafetyRefs),
      characterSafetyRefs: normalizeExpectationRefs(draft.inputBindings.characterSafetyRefs),
      segmentExpectations: [...draft.inputBindings.segmentExpectations]
        .sort(compareOrdered)
        .map((segment) => ({ ...segment })),
    },
    decisionSummary: {
      ...draft.decisionSummary,
      rejectedConcepts: [...draft.decisionSummary.rejectedConcepts]
        .sort((left, right) => compareText(left.conceptId, right.conceptId))
        .map((concept) => ({ ...concept })),
    },
    scenePlans: [...draft.scenePlans].sort(compareOrdered).map(normalizeScenePlan),
    continuityPackRefs: [...draft.continuityPackRefs]
      .sort((left, right) => compareText(left.continuityRefId, right.continuityRefId))
      .map((reference) => ({ ...reference })),
    capabilityRequirements: [...draft.capabilityRequirements]
      .sort((left, right) => compareText(left.capabilityKey, right.capabilityKey))
      .map((requirement) => ({
        ...requirement,
        linkedSceneIds: sortText(requirement.linkedSceneIds),
      })),
    estimateInputs: { ...draft.estimateInputs },
    qaExpectationCodes: sortText(draft.qaExpectationCodes),
    closedGateCodes: sortText(draft.closedGateCodes),
  }
}

export async function calculateLivingFrameContractDigest(
  input: unknown,
): Promise<string> {
  const preflightIssues = inspectJsonInput(input)
  if (preflightIssues.length > 0) {
    throw new LivingFrameContractError(preflightIssues)
  }
  const parsed = livingFrameProfessionalSkillComponentDraftSchema.safeParse(input)
  if (!parsed.success) {
    throw new LivingFrameContractError(mapZodIssues(parsed.error.issues))
  }
  const normalized = normalizeLivingFrameContractDraft(parsed.data)
  const semanticIssues = validateSemanticContract(normalized)
  if (semanticIssues.length > 0) {
    throw new LivingFrameContractError(semanticIssues)
  }
  if (!globalThis.crypto?.subtle) {
    throw new LivingFrameContractError([issue('crypto_unavailable', '$.contractDigestSha256')])
  }

  const canonicalJson = canonicalJsonStringify(normalized)

  try {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonicalJson),
    )
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    throw new LivingFrameContractError([
      issue('digest_calculation_failed', '$.contractDigestSha256'),
    ])
  }
}

export async function createLivingFrameProfessionalSkillComponent(
  input: unknown,
): Promise<LivingFrameProfessionalSkillComponent> {
  const preflightIssues = inspectJsonInput(input)
  if (preflightIssues.length > 0) {
    throw new LivingFrameContractError(preflightIssues)
  }

  const parsed = livingFrameProfessionalSkillComponentDraftSchema.safeParse(input)
  if (!parsed.success) {
    throw new LivingFrameContractError(mapZodIssues(parsed.error.issues))
  }

  const normalized = normalizeLivingFrameContractDraft(parsed.data)
  const semanticIssues = validateSemanticContract(normalized)
  if (semanticIssues.length > 0) {
    throw new LivingFrameContractError(semanticIssues)
  }

  return {
    ...normalized,
    contractDigestSha256: await calculateLivingFrameContractDigest(normalized),
  }
}

export async function validateLivingFrameProfessionalSkillComponent(
  input: unknown,
): Promise<LivingFrameValidationResult> {
  const preflightIssues = inspectJsonInput(input)
  if (preflightIssues.length > 0) {
    return { ok: false, issues: preflightIssues }
  }

  const parsed = livingFrameProfessionalSkillComponentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, issues: mapZodIssues(parsed.error.issues) }
  }

  const { contractDigestSha256, ...draftInput } = parsed.data
  const normalizedDraft = normalizeLivingFrameContractDraft(draftInput)
  const semanticIssues = validateSemanticContract(normalizedDraft)
  if (semanticIssues.length > 0) {
    return { ok: false, issues: semanticIssues }
  }

  let expectedDigest: string
  try {
    expectedDigest = await calculateLivingFrameContractDigest(normalizedDraft)
  } catch (error) {
    if (error instanceof LivingFrameContractError) {
      return { ok: false, issues: error.issues }
    }
    return {
      ok: false,
      issues: [issue('digest_calculation_failed', '$.contractDigestSha256')],
    }
  }

  if (expectedDigest !== contractDigestSha256) {
    return {
      ok: false,
      issues: [issue('digest_mismatch', '$.contractDigestSha256')],
    }
  }

  return {
    ok: true,
    component: {
      ...normalizedDraft,
      contractDigestSha256: expectedDigest,
    },
  }
}

function normalizeScenePlan(scene: LivingFrameScenePlan): LivingFrameScenePlan {
  return {
    ...scene,
    components: [...scene.components].sort(compareOrdered).map((component) => ({
      ...component,
      capabilityKeys: sortText(component.capabilityKeys),
      continuityRefIds: sortText(component.continuityRefIds),
      qaExpectationCodes: sortText(component.qaExpectationCodes),
    })),
    componentDependencies: [...scene.componentDependencies]
      .sort((left, right) => compareText(
        `${left.componentId}:${left.dependsOnComponentId}:${left.kind}`,
        `${right.componentId}:${right.dependsOnComponentId}:${right.kind}`,
      ))
      .map((dependency) => ({ ...dependency })),
    skillActivations: [...scene.skillActivations].sort(compareOrdered).map((activation) => ({
      ...activation,
      linkedComponentIds: sortText(activation.linkedComponentIds),
      linkedTimingRequestIds: sortText(activation.linkedTimingRequestIds),
      dependsOnActivationIds: sortText(activation.dependsOnActivationIds),
      conflictsWithActivationIds: sortText(activation.conflictsWithActivationIds),
      qaExpectationCodes: sortText(activation.qaExpectationCodes),
    })),
    semanticTimingRequests: [...scene.semanticTimingRequests]
      .sort(compareOrdered)
      .map((request) => ({ ...request })),
    attentionSequence: [...scene.attentionSequence].sort(compareOrdered).map((event) => ({
      ...event,
      methods: sortText(event.methods),
    })),
    semanticScaleRequests: [...scene.semanticScaleRequests]
      .sort((left, right) => compareText(
        left.semanticScaleRequestId,
        right.semanticScaleRequestId,
      ))
      .map((request) => ({ ...request })),
    soundRequests: [...scene.soundRequests].sort(compareOrdered).map((request) => ({ ...request })),
    regionSafety: { ...scene.regionSafety },
    fallbackLadder: [...scene.fallbackLadder],
    continuityRefIds: sortText(scene.continuityRefIds),
    qaExpectationCodes: sortText(scene.qaExpectationCodes),
    closedGateCodes: sortText(scene.closedGateCodes),
  }
}

function validateSemanticContract(
  draft: LivingFrameProfessionalSkillComponentDraft,
): LivingFrameValidationIssue[] {
  const issues: LivingFrameValidationIssue[] = []
  const add = (code: LivingFrameValidationIssueCode, path: string) => {
    issues.push(issue(code, path))
  }

  if (draft.inputBindings.outputFrame.expectedWidth
    * draft.inputBindings.outputFrame.expectedAspectRatioDenominator
    !== draft.inputBindings.outputFrame.expectedHeight
      * draft.inputBindings.outputFrame.expectedAspectRatioNumerator
  ) {
    add('frame_expectation_invalid', '$.inputBindings.outputFrame')
  }

  validateUniqueExpectationRefs(draft, add)
  validateOrderedCollection(
    draft.inputBindings.segmentExpectations,
    '$.inputBindings.segmentExpectations',
    add,
  )

  const outputFrameExpectationRefId = draft.inputBindings.outputFrame.expectationRefId
  const masterTimingExpectationRefId = draft.inputBindings.masterTiming.expectationRefId
  for (const [index, segment] of draft.inputBindings.segmentExpectations.entries()) {
    if (segment.outputFrameExpectationRefId !== outputFrameExpectationRefId) {
      add(
        'frame_expectation_invalid',
        `$.inputBindings.segmentExpectations[${index}].outputFrameExpectationRefId`,
      )
    }
    if (segment.masterTimingExpectationRefId !== masterTimingExpectationRefId) {
      add(
        'timing_expectation_invalid',
        `$.inputBindings.segmentExpectations[${index}].masterTimingExpectationRefId`,
      )
    }
  }

  for (const requiredGate of REQUIRED_CLOSED_GATES) {
    if (!draft.closedGateCodes.includes(requiredGate)) {
      add('required_gate_missing', '$.closedGateCodes')
    }
  }

  const decision = draft.decisionSummary.decision
  if (decision === 'selected') {
    if (
      draft.status !== 'planning_only'
      || draft.decisionSummary.selectedMode === null
      || draft.scenePlans.length === 0
      || !draft.scenePlans.some((scene) => scene.mode === draft.decisionSummary.selectedMode)
    ) {
      add('schema_rejected', '$.decisionSummary')
    }
  } else if (draft.decisionSummary.selectedMode !== null) {
    add('schema_rejected', '$.decisionSummary.selectedMode')
  }

  if (decision === 'non_use') {
    const nonUseCarriesWork = draft.scenePlans.length > 0
      || draft.capabilityRequirements.length > 0
      || draft.continuityPackRefs.length > 0
      || hasNonZeroEstimateCount(draft.estimateInputs)
      || draft.estimateInputs.motionComplexity !== 'none'
      || draft.estimateInputs.cameraComplexity !== 'none'
      || draft.estimateInputs.controlledIllustrationComplexity !== 'none'
      || draft.estimateInputs.generatedVideoExpectation !== 'not_required'
    if (nonUseCarriesWork) {
      add('non_use_carries_work', '$')
    }
  }

  validateOrderedCollection(draft.scenePlans, '$.scenePlans', add)
  validateUniqueIds(
    draft.scenePlans.map((scene) => scene.sceneId),
    '$.scenePlans',
    add,
  )
  validateUniqueIds(
    draft.decisionSummary.rejectedConcepts.map((concept) => concept.conceptId),
    '$.decisionSummary.rejectedConcepts',
    add,
  )
  validateUniqueIds(
    draft.continuityPackRefs.map((reference) => reference.continuityRefId),
    '$.continuityPackRefs',
    add,
  )
  validateUniqueIds(
    draft.capabilityRequirements.map((requirement) => requirement.capabilityKey),
    '$.capabilityRequirements',
    add,
  )

  const segmentIds = new Set(
    draft.inputBindings.segmentExpectations.map((segment) => segment.segmentExpectationId),
  )
  const sceneIds = new Set(draft.scenePlans.map((scene) => scene.sceneId))
  const continuityIds = new Set(
    draft.continuityPackRefs.map((reference) => reference.continuityRefId),
  )
  validateUniqueIds(
    draft.scenePlans.flatMap(
      (scene) => scene.components.map((component) => component.componentId),
    ),
    '$.scenePlans[*].components',
    add,
  )
  validateUniqueIds(
    draft.scenePlans.flatMap(
      (scene) => scene.skillActivations.map((activation) => activation.activationId),
    ),
    '$.scenePlans[*].skillActivations',
    add,
  )
  validateUniqueIds(
    draft.scenePlans.flatMap(
      (scene) => scene.semanticTimingRequests.map((request) => request.timingRequestId),
    ),
    '$.scenePlans[*].semanticTimingRequests',
    add,
  )
  validateUniqueIds(
    draft.scenePlans.flatMap(
      (scene) => scene.attentionSequence.map((event) => event.attentionEventId),
    ),
    '$.scenePlans[*].attentionSequence',
    add,
  )
  validateUniqueIds(
    draft.scenePlans.flatMap(
      (scene) => scene.semanticScaleRequests.map(
        (request) => request.semanticScaleRequestId,
      ),
    ),
    '$.scenePlans[*].semanticScaleRequests',
    add,
  )
  validateUniqueIds(
    draft.scenePlans.flatMap(
      (scene) => scene.soundRequests.map((request) => request.soundRequestId),
    ),
    '$.scenePlans[*].soundRequests',
    add,
  )

  for (const [sceneIndex, scene] of draft.scenePlans.entries()) {
    validateScene(scene, sceneIndex, segmentIds, continuityIds, draft, add)
  }

  for (const [index, requirement] of draft.capabilityRequirements.entries()) {
    validateUniqueIds(
      requirement.linkedSceneIds,
      `$.capabilityRequirements[${index}].linkedSceneIds`,
      add,
    )
    for (const sceneId of requirement.linkedSceneIds) {
      if (!sceneIds.has(sceneId)) {
        add(
          'dangling_reference',
          `$.capabilityRequirements[${index}].linkedSceneIds`,
        )
      }
    }
  }

  const allCapabilityKeys = new Set(
    draft.scenePlans.flatMap(
      (scene) => scene.components.flatMap((component) => component.capabilityKeys),
    ),
  )
  for (const capabilityKey of allCapabilityKeys) {
    if (!draft.capabilityRequirements.some(
      (requirement) => requirement.capabilityKey === capabilityKey,
    )) {
      add('capability_policy_invalid', '$.capabilityRequirements')
    }
  }

  if (
    allCapabilityKeys.has('identity_conditioned_illustration')
    && !draft.closedGateCodes.includes('identity_safety_review_required')
  ) {
    add('identity_safety_gate_missing', '$.closedGateCodes')
  }

  if (
    allCapabilityKeys.has('bounded_video_asset_generation')
    && !draft.qaExpectationCodes.includes('generated_video_restraint_required')
  ) {
    add('capability_policy_invalid', '$.qaExpectationCodes')
  }

  const expectedEstimateInputs = deriveLivingFrameEstimateInputs({
    scenePlans: draft.scenePlans,
    continuityReferenceCount: draft.continuityPackRefs.length,
    topLevelQaExpectationCount: draft.qaExpectationCodes.length,
    motionComplexity: draft.estimateInputs.motionComplexity,
    cameraComplexity: draft.estimateInputs.cameraComplexity,
    controlledIllustrationComplexity: draft.estimateInputs.controlledIllustrationComplexity,
    generatedVideoExpectation: draft.estimateInputs.generatedVideoExpectation,
  })
  if (canonicalJsonStringify(expectedEstimateInputs)
    !== canonicalJsonStringify(draft.estimateInputs)
  ) {
    add('count_mismatch', '$.estimateInputs')
  }

  return dedupeIssues(issues)
}

function validateScene(
  scene: LivingFrameScenePlan,
  sceneIndex: number,
  segmentIds: ReadonlySet<string>,
  continuityIds: ReadonlySet<string>,
  draft: LivingFrameProfessionalSkillComponentDraft,
  add: (code: LivingFrameValidationIssueCode, path: string) => void,
): void {
  const scenePath = `$.scenePlans[${sceneIndex}]`
  if (!segmentIds.has(scene.segmentExpectationId)) {
    add('dangling_reference', `${scenePath}.segmentExpectationId`)
  }

  validateOrderedCollection(scene.components, `${scenePath}.components`, add)
  validateOrderedCollection(scene.skillActivations, `${scenePath}.skillActivations`, add)
  validateOrderedCollection(
    scene.semanticTimingRequests,
    `${scenePath}.semanticTimingRequests`,
    add,
  )
  validateOrderedCollection(scene.attentionSequence, `${scenePath}.attentionSequence`, add)
  validateOrderedCollection(scene.soundRequests, `${scenePath}.soundRequests`, add)

  validateUniqueIds(
    scene.components.map((component) => component.componentId),
    `${scenePath}.components`,
    add,
  )
  validateUniqueIds(
    scene.skillActivations.map((activation) => activation.activationId),
    `${scenePath}.skillActivations`,
    add,
  )
  validateUniqueIds(
    scene.semanticTimingRequests.map((request) => request.timingRequestId),
    `${scenePath}.semanticTimingRequests`,
    add,
  )
  validateUniqueIds(
    scene.attentionSequence.map((event) => event.attentionEventId),
    `${scenePath}.attentionSequence`,
    add,
  )
  validateUniqueIds(
    scene.semanticScaleRequests.map((request) => request.semanticScaleRequestId),
    `${scenePath}.semanticScaleRequests`,
    add,
  )
  validateUniqueIds(
    scene.soundRequests.map((request) => request.soundRequestId),
    `${scenePath}.soundRequests`,
    add,
  )

  const componentIds = new Set(scene.components.map((component) => component.componentId))
  const primaryComponents = scene.components.filter((component) => component.focalRole === 'primary')
  if (
    primaryComponents.length !== 1
    || primaryComponents[0]?.componentId !== scene.focalPrimaryComponentId
  ) {
    add('focal_primary_rule', `${scenePath}.focalPrimaryComponentId`)
  }

  const componentEdges: Array<readonly [string, string]> = []
  for (const [componentIndex, component] of scene.components.entries()) {
    const componentPath = `${scenePath}.components[${componentIndex}]`
    if (component.parentComponentId !== null) {
      if (!componentIds.has(component.parentComponentId)) {
        add('dangling_reference', `${componentPath}.parentComponentId`)
      } else {
        componentEdges.push([component.componentId, component.parentComponentId])
      }
    }
    if (component.anchorComponentId !== null) {
      if (!componentIds.has(component.anchorComponentId)) {
        add('dangling_reference', `${componentPath}.anchorComponentId`)
      } else {
        componentEdges.push([component.componentId, component.anchorComponentId])
      }
    }

    validateUniqueIds(component.capabilityKeys, `${componentPath}.capabilityKeys`, add)
    validateUniqueIds(component.continuityRefIds, `${componentPath}.continuityRefIds`, add)
    validateUniqueIds(
      component.qaExpectationCodes,
      `${componentPath}.qaExpectationCodes`,
      add,
    )
    for (const continuityRefId of component.continuityRefIds) {
      if (!continuityIds.has(continuityRefId)) {
        add('dangling_reference', `${componentPath}.continuityRefIds`)
      }
    }
    validateAlphaExpectation(component, componentPath, add)

    if (
      (component.role === 'exact_map_component' || component.role === 'exact_data_component')
      && component.capabilityKeys.includes('bounded_video_asset_generation')
    ) {
      add('capability_policy_invalid', `${componentPath}.capabilityKeys`)
    }
  }

  validateUniqueIds(
    scene.componentDependencies.map(
      (dependency) => `${dependency.componentId}:${dependency.dependsOnComponentId}:${dependency.kind}`,
    ),
    `${scenePath}.componentDependencies`,
    add,
  )
  for (const [dependencyIndex, dependency] of scene.componentDependencies.entries()) {
    const dependencyPath = `${scenePath}.componentDependencies[${dependencyIndex}]`
    if (
      !componentIds.has(dependency.componentId)
      || !componentIds.has(dependency.dependsOnComponentId)
    ) {
      add('dangling_reference', dependencyPath)
    } else {
      componentEdges.push([dependency.componentId, dependency.dependsOnComponentId])
    }
  }
  if (hasDirectedCycle(componentIds, componentEdges)) {
    add('cyclic_dependency', `${scenePath}.componentDependencies`)
  }

  const timingIds = new Set(
    scene.semanticTimingRequests.map((request) => request.timingRequestId),
  )
  const activationIds = new Set(
    scene.skillActivations.map((activation) => activation.activationId),
  )
  const activationEdges: Array<readonly [string, string]> = []
  for (const [activationIndex, activation] of scene.skillActivations.entries()) {
    const activationPath = `${scenePath}.skillActivations[${activationIndex}]`
    validateUniqueIds(
      activation.linkedComponentIds,
      `${activationPath}.linkedComponentIds`,
      add,
    )
    validateUniqueIds(
      activation.linkedTimingRequestIds,
      `${activationPath}.linkedTimingRequestIds`,
      add,
    )
    validateUniqueIds(
      activation.dependsOnActivationIds,
      `${activationPath}.dependsOnActivationIds`,
      add,
    )
    validateUniqueIds(
      activation.conflictsWithActivationIds,
      `${activationPath}.conflictsWithActivationIds`,
      add,
    )
    for (const componentId of activation.linkedComponentIds) {
      if (!componentIds.has(componentId)) {
        add('dangling_reference', `${activationPath}.linkedComponentIds`)
      }
    }
    for (const timingId of activation.linkedTimingRequestIds) {
      if (!timingIds.has(timingId)) {
        add('dangling_reference', `${activationPath}.linkedTimingRequestIds`)
      }
    }
    for (const dependencyId of activation.dependsOnActivationIds) {
      if (!activationIds.has(dependencyId)) {
        add('dangling_reference', `${activationPath}.dependsOnActivationIds`)
      } else {
        activationEdges.push([activation.activationId, dependencyId])
      }
    }
    for (const conflictId of activation.conflictsWithActivationIds) {
      const opposite = scene.skillActivations.find(
        (candidate) => candidate.activationId === conflictId,
      )
      if (
        !opposite
        || !opposite.conflictsWithActivationIds.includes(activation.activationId)
      ) {
        add('conflict_invalid', `${activationPath}.conflictsWithActivationIds`)
      }
    }
  }
  if (hasDirectedCycle(activationIds, activationEdges)) {
    add('cyclic_dependency', `${scenePath}.skillActivations`)
  }

  const timingRanks = scene.semanticTimingRequests.map(
    (request) => LIVING_FRAME_TIMING_PHASES.indexOf(request.phase),
  )
  if (
    timingRanks.length !== LIVING_FRAME_TIMING_PHASES.length
    || timingRanks.some((rank, index) => rank !== index)
  ) {
    add('semantic_order_invalid', `${scenePath}.semanticTimingRequests`)
  }

  const focusHandoffActivated = scene.skillActivations.some(
    (activation) => (
      activation.miniSkillKey === 'focus_handoff'
      && activation.decision !== 'do_not_use'
    ),
  )
  if (focusHandoffActivated) {
    const handoffIndex = scene.attentionSequence.findIndex(
      (event) => event.eventType === 'handoff',
    )
    const restorationIndex = scene.attentionSequence.findIndex(
      (event) => event.eventType === 'restore' || event.eventType === 'transition_away',
    )
    if (handoffIndex < 0 || restorationIndex <= handoffIndex) {
      add('handoff_restore_missing', `${scenePath}.attentionSequence`)
    }
  }

  const attentionRanks = scene.attentionSequence.map((event) => {
    if (event.eventType === 'prepare') return 0
    if (event.eventType === 'handoff') return 1
    if (event.eventType === 'hold') return 2
    return 3
  })
  if (
    attentionRanks.some(
      (rank, index) => index > 0 && rank < attentionRanks[index - 1],
    )
    || scene.attentionSequence.some(
      (event, index) => (
        (event.eventType === 'restore' || event.eventType === 'transition_away')
        && index !== scene.attentionSequence.length - 1
      ),
    )
  ) {
    add('semantic_order_invalid', `${scenePath}.attentionSequence`)
  }

  if (Object.values(scene.regionSafety).includes('blocked_collision')) {
    add('collision_unresolved', `${scenePath}.regionSafety`)
  }

  validateUniqueIds(scene.fallbackLadder, `${scenePath}.fallbackLadder`, add)
  const fallbackRanks = scene.fallbackLadder.map(
    (step) => LIVING_FRAME_FALLBACK_STEPS.indexOf(step),
  )
  if (
    scene.fallbackLadder.at(-1) !== 'no_extra_visual'
    || fallbackRanks.some((rank, index) => index > 0 && rank <= fallbackRanks[index - 1])
  ) {
    add('fallback_order_invalid', `${scenePath}.fallbackLadder`)
  }

  validateUniqueIds(scene.continuityRefIds, `${scenePath}.continuityRefIds`, add)
  for (const continuityRefId of scene.continuityRefIds) {
    if (!continuityIds.has(continuityRefId)) {
      add('dangling_reference', `${scenePath}.continuityRefIds`)
    }
  }

  for (const [requestIndex, request] of scene.semanticScaleRequests.entries()) {
    const requestPath = `${scenePath}.semanticScaleRequests[${requestIndex}]`
    const component = scene.components.find(
      (candidate) => candidate.componentId === request.componentId,
    )
    if (!component) {
      add('dangling_reference', `${requestPath}.componentId`)
      continue
    }
    if (
      request.mode === 'editorial_symbolic'
      && (component.role === 'exact_map_component' || component.role === 'exact_data_component')
    ) {
      add('factual_distortion', requestPath)
    }
  }

  for (const [soundIndex, request] of scene.soundRequests.entries()) {
    if (request.linkedComponentId !== null && !componentIds.has(request.linkedComponentId)) {
      add('dangling_reference', `${scenePath}.soundRequests[${soundIndex}].linkedComponentId`)
    }
  }

  const needsDocumentaryFactGate = [
    'exact_geography_verification_required',
    'exact_data_verification_required',
    'documentary_source_verification_required',
  ].includes(scene.sourceTruthMode)
  if (needsDocumentaryFactGate) {
    if (
      !scene.closedGateCodes.includes('documentary_fact_verification_required')
      || draft.inputBindings.factSafetyRefs.length === 0
    ) {
      add('required_gate_missing', `${scenePath}.closedGateCodes`)
    }
  }
}

function validateAlphaExpectation(
  component: LivingFrameScenePlan['components'][number],
  path: string,
  add: (code: LivingFrameValidationIssueCode, path: string) => void,
): void {
  const validByTransparency = {
    opaque_plate: {
      source: 'opaque_plate',
      qa: 'not_applicable',
      rectangularBackgroundRejectionRequired: false,
    },
    native_alpha_preferred: {
      source: 'native_alpha_claim_requires_qa',
      qa: 'future_alpha_qa_required',
      rectangularBackgroundRejectionRequired: true,
    },
    still_alpha_required: {
      source: 'postprocessed_still_mask_requires_qa',
      qa: 'future_alpha_qa_required',
      rectangularBackgroundRejectionRequired: true,
    },
    temporal_mask_required: {
      source: 'temporal_mask_sequence_requires_qa',
      qa: 'temporal_mask_qa_required',
      rectangularBackgroundRejectionRequired: true,
    },
    procedural_alpha: {
      source: 'procedural_alpha_requires_qa',
      qa: 'procedural_alpha_validation_required',
      rectangularBackgroundRejectionRequired: true,
    },
    additive_effect: {
      source: 'additive_blend_requires_qa',
      qa: 'procedural_alpha_validation_required',
      rectangularBackgroundRejectionRequired: true,
    },
  } as const
  const expected = validByTransparency[component.transparencyExpectation]
  if (
    component.alphaSourceExpectation !== expected.source
    || component.alphaQaExpectation !== expected.qa
    || component.rectangularBackgroundRejectionRequired
      !== expected.rectangularBackgroundRejectionRequired
  ) {
    add('alpha_expectation_invalid', path)
  }
}

function validateUniqueExpectationRefs(
  draft: LivingFrameProfessionalSkillComponentDraft,
  add: (code: LivingFrameValidationIssueCode, path: string) => void,
): void {
  const allExpectationRefs = [
    draft.inputBindings.compiledIntent,
    draft.inputBindings.sourceSequence,
    draft.inputBindings.videoUnderstanding,
    draft.inputBindings.adaptiveStrategy,
    draft.inputBindings.outputFrame,
    draft.inputBindings.masterTiming,
    ...draft.inputBindings.safeZoneRefs,
    ...draft.inputBindings.faceProtectionRefs,
    ...draft.inputBindings.gestureProtectionRefs,
    ...draft.inputBindings.factSafetyRefs,
    ...draft.inputBindings.characterSafetyRefs,
    ...draft.inputBindings.segmentExpectations.map(
      (segment) => segment.sourceSegmentRef,
    ),
  ]
  validateUniqueIds(
    allExpectationRefs.map((reference) => reference.expectationRefId),
    '$.inputBindings',
    add,
  )

  const bindingCollections = [
    ['safeZoneRefs', draft.inputBindings.safeZoneRefs],
    ['faceProtectionRefs', draft.inputBindings.faceProtectionRefs],
    ['gestureProtectionRefs', draft.inputBindings.gestureProtectionRefs],
    ['factSafetyRefs', draft.inputBindings.factSafetyRefs],
    ['characterSafetyRefs', draft.inputBindings.characterSafetyRefs],
  ] as const
  for (const [key, refs] of bindingCollections) {
    validateUniqueIds(
      refs.map((reference) => reference.expectationRefId),
      `$.inputBindings.${key}`,
      add,
    )
  }
  validateUniqueIds(
    draft.inputBindings.segmentExpectations.map(
      (segment) => segment.segmentExpectationId,
    ),
    '$.inputBindings.segmentExpectations',
    add,
  )
}

function validateOrderedCollection<T extends { readonly order: number }>(
  values: readonly T[],
  path: string,
  add: (code: LivingFrameValidationIssueCode, path: string) => void,
): void {
  const orders = values.map((value) => value.order)
  if (new Set(orders).size !== orders.length) {
    add('duplicate_order', path)
    return
  }
  const sorted = [...orders].sort((left, right) => left - right)
  if (sorted.some((order, index) => order !== index)) {
    add('semantic_order_invalid', path)
  }
}

function validateUniqueIds(
  values: readonly string[],
  path: string,
  add: (code: LivingFrameValidationIssueCode, path: string) => void,
): void {
  if (new Set(values).size !== values.length) {
    add('duplicate_id', path)
  }
}

function hasDirectedCycle(
  nodeIds: ReadonlySet<string>,
  edges: readonly (readonly [string, string])[],
): boolean {
  const adjacency = new Map<string, string[]>()
  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, [])
  }
  for (const [from, to] of edges) {
    adjacency.get(from)?.push(to)
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true
    if (visited.has(nodeId)) return false
    visiting.add(nodeId)
    for (const next of adjacency.get(nodeId) ?? []) {
      if (visit(next)) return true
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
    return false
  }

  return [...nodeIds].some(visit)
}

function hasNonZeroEstimateCount(estimate: LivingFrameEstimateInputs): boolean {
  return [
    estimate.sceneCount,
    estimate.componentCount,
    estimate.generatedStillCount,
    estimate.deterministicDrawCount,
    estimate.stillAlphaCount,
    estimate.temporalMaskCount,
    estimate.semanticTimingRequestCount,
    estimate.soundRequestCount,
    estimate.qaExpectationCount,
    estimate.continuityReferenceCount,
  ].some((value) => value !== 0)
}

function inspectJsonInput(input: unknown): LivingFrameValidationIssue[] {
  const issues: LivingFrameValidationIssue[] = []
  const ancestors = new WeakSet<object>()

  const inspect = (value: unknown, path: string): void => {
    if (
      value === null
      || typeof value === 'string'
      || typeof value === 'boolean'
      || (typeof value === 'number' && Number.isFinite(value))
    ) {
      return
    }
    if (typeof value !== 'object') {
      issues.push(issue('non_json_input', path))
      return
    }
    if (ancestors.has(value)) {
      issues.push(issue('non_json_input', path))
      return
    }
    ancestors.add(value)
    if (Array.isArray(value)) {
      value.forEach((entry, index) => inspect(entry, `${path}[${index}]`))
      ancestors.delete(value)
      return
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      issues.push(issue('non_json_input', path))
      ancestors.delete(value)
      return
    }
    for (const [key, entry] of Object.entries(value)) {
      const childPath = `${path}.${key}`
      if (FORBIDDEN_INPUT_KEYS.has(key)) {
        issues.push(issue('forbidden_key', childPath))
        continue
      }
      inspect(entry, childPath)
    }
    ancestors.delete(value)
  }

  inspect(input, '$')
  return dedupeIssues(issues)
}

function mapZodIssues(zodIssues: readonly z.core.$ZodIssue[]): LivingFrameValidationIssue[] {
  return dedupeIssues(zodIssues.map((zodIssue) => issue(
    zodIssue.code === 'custom' && zodIssue.message === 'unsafe_text'
      ? 'unsafe_text'
      : 'schema_rejected',
    zodPath(zodIssue.path),
  )))
}

function zodPath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((result, part) => (
    typeof part === 'number'
      ? `${result}[${part}]`
      : `${result}.${String(part)}`
  ), '$')
}

function canonicalJsonStringify(value: unknown): string {
  const normalized = canonicalizeJsonValue(value)
  return JSON.stringify(normalized)
}

function canonicalizeJsonValue(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeJsonValue)
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareText(left, right))
        .map(([key, entry]) => [key, canonicalizeJsonValue(entry)]),
    )
  }
  throw new LivingFrameContractError([issue('non_json_input', '$')])
}

function compareText(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function compareOrdered(
  left: { readonly order: number },
  right: { readonly order: number },
): number {
  return left.order - right.order
}

function sortText<T extends string>(values: readonly T[]): T[] {
  return [...values].sort(compareText)
}

function issue(
  code: LivingFrameValidationIssueCode,
  path: string,
): LivingFrameValidationIssue {
  if (!LIVING_FRAME_VALIDATION_ISSUE_CODES.includes(code)) {
    return { code: 'schema_rejected', path }
  }
  return { code, path }
}

function dedupeIssues(
  issues: readonly LivingFrameValidationIssue[],
): LivingFrameValidationIssue[] {
  const byIdentity = new Map<string, LivingFrameValidationIssue>()
  for (const candidate of issues) {
    byIdentity.set(`${candidate.code}:${candidate.path}`, candidate)
  }
  return [...byIdentity.values()].sort((left, right) => compareText(
    `${left.path}:${left.code}`,
    `${right.path}:${right.code}`,
  ))
}
