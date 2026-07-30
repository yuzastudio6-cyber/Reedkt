import { z } from 'zod'

import {
  LIVING_FRAME_ACTIVATION_DECISIONS,
  LIVING_FRAME_ACTIVATION_ROLES,
  LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS,
  LIVING_FRAME_ATTENTION_EVENT_TYPES,
  LIVING_FRAME_ATTENTION_METHODS,
  LIVING_FRAME_ATTENTION_TARGETS,
  LIVING_FRAME_CAPABILITY_KEYS,
  LIVING_FRAME_COMPONENT_ROLES,
  LIVING_FRAME_DEPTH_BANDS,
  LIVING_FRAME_DUCKING_EXPECTATIONS,
  LIVING_FRAME_FACTUAL_SCALE_GUARDS,
  LIVING_FRAME_FALLBACK_STEPS,
  LIVING_FRAME_FOCAL_ROLES,
  LIVING_FRAME_IMPORTANCE_LEVELS,
  LIVING_FRAME_INTENSITIES,
  LIVING_FRAME_MINI_SKILL_KEYS,
  LIVING_FRAME_MODES,
  LIVING_FRAME_NARRATIVE_PURPOSE_CODES,
  LIVING_FRAME_NARRATION_PROTECTION,
  LIVING_FRAME_PROVENANCE_EXPECTATIONS,
  LIVING_FRAME_QA_CODES,
  LIVING_FRAME_REASON_CODES,
  LIVING_FRAME_SEMANTIC_CUE_CODES,
  LIVING_FRAME_SEMANTIC_SCALE_MEANINGS,
  LIVING_FRAME_SEMANTIC_SCALE_MODES,
  LIVING_FRAME_SOUND_PRIORITIES,
  LIVING_FRAME_SOUND_PURPOSES,
  LIVING_FRAME_SOURCE_TRUTH_MODES,
  LIVING_FRAME_TIMING_PHASES,
  LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
  LIVING_FRAME_VISUAL_VERBS,
} from '../../types/living-frame'
import {
  LIVING_FRAME_SEMANTIC_REASONING_REQUEST_EVIDENCE_CLASS,
  LIVING_FRAME_SEMANTIC_REASONING_REQUEST_SOURCE,
  LIVING_FRAME_SEMANTIC_REASONING_REQUEST_STATUS,
  LIVING_FRAME_SEMANTIC_REASONING_REQUEST_VERSION,
  LIVING_FRAME_SEMANTIC_REQUEST_BLOCKING_REASON_CODES,
  LIVING_FRAME_SEMANTIC_REQUEST_CONSTRAINT_KINDS,
  LIVING_FRAME_SEMANTIC_REQUEST_CONSTRAINT_PRIORITIES,
  LIVING_FRAME_SEMANTIC_REQUEST_DECISION_KINDS,
  LIVING_FRAME_SEMANTIC_REQUEST_INTENT_SIGNALS,
  LIVING_FRAME_SEMANTIC_REQUEST_RESTRAINT_SIGNALS,
  LIVING_FRAME_SEMANTIC_REQUEST_SAFE_SPACE_STATES,
  LIVING_FRAME_SEMANTIC_REQUEST_SOURCE_MODES,
  LIVING_FRAME_SEMANTIC_REQUEST_SPEAKER_STATES,
  LIVING_FRAME_SEMANTIC_REQUEST_SPEECH_STATES,
  LIVING_FRAME_SEMANTIC_REQUEST_VISUAL_CATEGORIES,
  LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_RESULT_VERSION,
  LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_SCHEMA_VERSION,
  type LivingFrameSemanticReasoningRequest,
  type LivingFrameSemanticReasoningRequestDraft,
  type LivingFrameSemanticRequestPayload,
  type LivingFrameSemanticRequestValidationIssue,
  type LivingFrameSemanticRequestValidationIssueCode,
  type LivingFrameSemanticRequestValidationResult,
} from '../../types/living-frame-semantic-reasoning-request'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const URL_OR_EXECUTABLE_URI =
  /(?:[A-Za-z][A-Za-z0-9+.-]*:\/\/|www\.|data:|javascript:|blob:|mailto:)/iu
const FILESYSTEM_PATH_PREFIX =
  /(?:^|[\s"'`])(?:\/|~\/|\.\.\/|[A-Za-z]:[\\/])/u
const SECRET_LIKE =
  /(?:\bBearer\s+[A-Za-z0-9._~+/-]+=*|\bsk-[A-Za-z0-9_-]{8,}|\bAIza[A-Za-z0-9_-]{8,}|BEGIN [A-Z ]*PRIVATE KEY|(?:api[_-]?key|password|secret|access[_-]?token)\s*[:=])/iu

const FORBIDDEN_KEYS = new Set([
  'rawChat',
  'raw_chat',
  'rawTranscript',
  'raw_transcript',
  'transcript',
  'transcriptText',
  'transcript_text',
  'customInstructions',
  'custom_instructions',
  'prompt',
  'systemPrompt',
  'system_prompt',
  'userPrompt',
  'user_prompt',
  'instructions',
  'hiddenReasoning',
  'hidden_reasoning',
  'chainOfThought',
  'chain_of_thought',
  'mediaBytes',
  'media_bytes',
  'base64',
  'filePath',
  'file_path',
  'localPath',
  'local_path',
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
  'providerId',
  'provider_id',
  'modelId',
  'model_id',
  'toolId',
  'tool_id',
  'toolRoute',
  'tool_route',
  'workItem',
  'workItems',
  'jobId',
  'job_id',
  'queueId',
  'queue_id',
  'dispatchId',
  'dispatch_id',
  'approvalId',
  'approval_id',
  'snapshotId',
  'snapshot_id',
  'price',
  'dollars',
  'credits',
  'reservationId',
  'reservation_id',
  'wallet',
  'serviceFee',
  'service_fee',
  'toolCost',
  'tool_cost',
  'exactFrames',
  'exact_frames',
  'gainDb',
  'gain_db',
  'mixDb',
  'mix_db',
])

const safeIdSchema = z.string().trim().min(1).max(240)
  .regex(SAFE_ID)
  .refine((value) => !value.includes('..'), 'unsafe_identity')
const sha256Schema = z.string().regex(SHA256)
const orderSchema = z.number().int().nonnegative().max(100_000)
const safeTextSchema = (maximumLength: number) => z.string().trim().min(1)
  .max(maximumLength)
  .superRefine((value, context) => {
    if (
      hasControlCharacter(value)
      || URL_OR_EXECUTABLE_URI.test(value)
      || FILESYSTEM_PATH_PREFIX.test(value)
      || SECRET_LIKE.test(value)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'unsafe_text',
      })
    }
  })

const workflowContextSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ordinary_edit_video'),
    motionProductionContext: z.null(),
  }).strict(),
  z.object({
    kind: z.literal('motion_storytelling_optional_context'),
    motionProductionContext: z.object({
      productionId: safeIdSchema,
      authorityHashSha256: sha256Schema,
      sourceProposalDigestSha256: sha256Schema,
      sourceArtifactApprovalSnapshotId: safeIdSchema,
    }).strict(),
  }).strict(),
])

const authorityBoundarySchema = z.object({
  controlledSourceContractOnly: z.literal(true),
  liveEvidenceAuthority: z.literal(false),
  sourceSpeechEvidenceAuthority: z.literal(false),
  routeDataAssuranceAuthority: z.literal(false),
  providerEnvelopeAuthority: z.literal(false),
  reasoningRunAuthority: z.literal(false),
  reasoningResultAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  providerAttemptReceiptAuthority: z.literal(false),
  providerAttemptCostAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  componentPlanAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  creditReservationAuthority: z.literal(false),
  walletAuthority: z.literal(false),
  serviceFeeAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  mediaGenerationAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  exportAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const canonicalBindingsSchema = z.object({
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  handoffId: safeIdSchema,
  preapprovalInputAuthorityDigestSha256: sha256Schema,
  visualEvidenceBindingDigestSha256: sha256Schema,
}).strict()

const sourceVisualEvidenceReferenceSchema = z.object({
  evidenceRefId: safeIdSchema,
  kind: z.literal('source_visual_observation'),
  sourceSequenceItemId: safeIdSchema,
  observationId: safeIdSchema,
  category: z.enum(LIVING_FRAME_SEMANTIC_REQUEST_VISUAL_CATEGORIES),
  derivedObservationSummary: safeTextSchema(600),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
}).strict()

const ideaFirstEvidenceReferenceSchema = z.object({
  evidenceRefId: safeIdSchema,
  kind: z.literal('canonical_idea_first_context'),
  ideaFirstAuthorityDigestSha256: sha256Schema,
  derivedContextSummary: safeTextSchema(600),
}).strict()

const evidenceReferenceSchema = z.discriminatedUnion('kind', [
  sourceVisualEvidenceReferenceSchema,
  ideaFirstEvidenceReferenceSchema,
])

const speechExpectationSchema = z.object({
  sourceContainsSpeech: z.boolean(),
  state: z.enum(LIVING_FRAME_SEMANTIC_REQUEST_SPEECH_STATES),
  genericSourceSpeechEvidenceDigestSha256: z.null(),
  futureSharedAuthorityRequired: z.boolean(),
}).strict()

const evidenceProjectionSchema = z.object({
  sourceMode: z.enum(LIVING_FRAME_SEMANTIC_REQUEST_SOURCE_MODES),
  visualEvidenceBindingDigestSha256: sha256Schema,
  evidenceReferences: z.array(evidenceReferenceSchema).max(128),
  speechExpectation: speechExpectationSchema,
}).strict()

const segmentContextSchema = z.object({
  segmentContextId: safeIdSchema,
  order: orderSchema,
  sourceSegmentRefId: safeIdSchema.nullable(),
  sourceSequenceItemId: safeIdSchema.nullable(),
  derivedVisualContextSummary: safeTextSchema(800),
  speakerState: z.enum(LIVING_FRAME_SEMANTIC_REQUEST_SPEAKER_STATES),
  safeSpaceState: z.enum(LIVING_FRAME_SEMANTIC_REQUEST_SAFE_SPACE_STATES),
  evidenceRefIds: z.array(safeIdSchema).max(64),
  candidateModeHints: z.array(z.enum(LIVING_FRAME_MODES)).max(5),
}).strict()

const semanticConstraintSchema = z.object({
  constraintId: safeIdSchema,
  order: orderSchema,
  kind: z.enum(LIVING_FRAME_SEMANTIC_REQUEST_CONSTRAINT_KINDS),
  priority: z.enum(LIVING_FRAME_SEMANTIC_REQUEST_CONSTRAINT_PRIORITIES),
  derivedSummary: safeTextSchema(700),
  evidenceRefIds: z.array(safeIdSchema).max(64),
}).strict()

export const livingFrameSemanticRequestPayloadSchema = z.object({
  purpose: z.literal('propose_living_frame_semantic_scene_candidates'),
  intentSignals: z.array(
    z.enum(LIVING_FRAME_SEMANTIC_REQUEST_INTENT_SIGNALS),
  ).max(16),
  restraintSignals: z.array(
    z.enum(LIVING_FRAME_SEMANTIC_REQUEST_RESTRAINT_SIGNALS),
  ).max(16),
  allowedModes: z.array(z.enum(LIVING_FRAME_MODES)).max(5),
  evidence: evidenceProjectionSchema,
  segmentContexts: z.array(segmentContextSchema).max(256),
  semanticConstraints: z.array(semanticConstraintSchema).min(1).max(256),
  requestedDecisionKinds: z.array(
    z.enum(LIVING_FRAME_SEMANTIC_REQUEST_DECISION_KINDS),
  ).min(1).max(4),
}).strict()

const routeAssuranceSchema = z.object({
  routeContract: z.literal(
    'reeditpro-reasoning-model-route-v2-kimi-terra-deepseek',
  ),
  orderedRouteIds: z.tuple([
    z.literal('kimi_k3_primary'),
    z.literal('gpt_5_6_terra_fallback'),
    z.literal('deepseek_v4_pro_fallback'),
  ]),
  state: z.literal('shared_route_data_assurance_required'),
  sharedRouteDataAssuranceDigestSha256: z.null(),
  providerEnvelopeState: z.literal('unbound'),
  providerEnvelopeDigestSha256: z.null(),
  providerTransportAuthorized: z.literal(false),
  providerCallMade: z.literal(false),
  oldKimiToGptFallbackAllowed: z.literal(false),
  qwen25VlReasoningRouteAllowed: z.literal(false),
  mediaProviderOperationAllowed: z.literal(false),
}).strict()

const outputContractDraftSchema = z.object({
  schemaVersion: z.literal(
    LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_SCHEMA_VERSION,
  ),
  strictJsonObjectRequired: z.literal(true),
  unknownKeysRejected: z.literal(true),
  hiddenReasoningOutputAllowed: z.literal(false),
  rawEvidenceOutputAllowed: z.literal(false),
  exactFrameOutputAllowed: z.literal(false),
  exactSoundCueOutputAllowed: z.literal(false),
  providerOrToolSelectionOutputAllowed: z.literal(false),
  selectedSceneOutputAuthority: z.literal(false),
}).strict()

const outputContractSchema = outputContractDraftSchema.extend({
  outputJsonSchemaDigestSha256: sha256Schema,
}).strict()

export const livingFrameSemanticReasoningRequestDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_SEMANTIC_REASONING_REQUEST_VERSION,
  ),
  contractSource: z.literal(
    LIVING_FRAME_SEMANTIC_REASONING_REQUEST_SOURCE,
  ),
  status: z.literal(LIVING_FRAME_SEMANTIC_REASONING_REQUEST_STATUS),
  evidenceClass: z.literal(
    LIVING_FRAME_SEMANTIC_REASONING_REQUEST_EVIDENCE_CLASS,
  ),
  promotionAllowed: z.literal(false),
  workflowContext: workflowContextSchema,
  canonicalBindings: canonicalBindingsSchema,
  semanticPayload: livingFrameSemanticRequestPayloadSchema,
  blockingReasonCodes: z.array(
    z.enum(LIVING_FRAME_SEMANTIC_REQUEST_BLOCKING_REASON_CODES),
  ).min(1).max(2),
  routeAssurance: routeAssuranceSchema,
  outputContract: outputContractDraftSchema,
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const livingFrameSemanticReasoningRequestSchema =
  livingFrameSemanticReasoningRequestDraftSchema
    .omit({ outputContract: true })
    .extend({
      outputContract: outputContractSchema,
      semanticPayloadDigestSha256: sha256Schema,
      contractDigestSha256: sha256Schema,
    })
    .strict()

const proposalEvidenceCitationSchema = z.object({
  evidenceRefId: safeIdSchema,
}).strict()

const componentProposalSchema = z.object({
  componentKey: safeIdSchema,
  order: orderSchema,
  role: z.enum(LIVING_FRAME_COMPONENT_ROLES),
  focalRole: z.enum(LIVING_FRAME_FOCAL_ROLES),
  derivedSummary: safeTextSchema(700),
  parentComponentKey: safeIdSchema.nullable(),
  anchorComponentKey: safeIdSchema.nullable(),
  depthBand: z.enum(LIVING_FRAME_DEPTH_BANDS),
  transparencyExpectation: z.enum(LIVING_FRAME_TRANSPARENCY_EXPECTATIONS),
  alphaSourceExpectation: z.enum(LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS),
  provenanceExpectation: z.enum(LIVING_FRAME_PROVENANCE_EXPECTATIONS),
  capabilityKeys: z.array(z.enum(LIVING_FRAME_CAPABILITY_KEYS)).max(16),
  evidenceCitations: z.array(proposalEvidenceCitationSchema).max(64),
}).strict()

const componentDependencyProposalSchema = z.object({
  componentKey: safeIdSchema,
  dependsOnComponentKey: safeIdSchema,
  kind: z.enum(['depends_on', 'anchored_to', 'occluded_by']),
}).strict()

const miniSkillProposalSchema = z.object({
  activationKey: safeIdSchema,
  order: orderSchema,
  miniSkillKey: z.enum(LIVING_FRAME_MINI_SKILL_KEYS),
  role: z.enum(LIVING_FRAME_ACTIVATION_ROLES),
  decision: z.enum(LIVING_FRAME_ACTIVATION_DECISIONS),
  intensity: z.enum(LIVING_FRAME_INTENSITIES),
  reasonCode: z.enum(LIVING_FRAME_REASON_CODES),
  derivedSummary: safeTextSchema(700),
  linkedComponentKeys: z.array(safeIdSchema).max(64),
  linkedTimingConstraintKeys: z.array(safeIdSchema).max(64),
  dependsOnActivationKeys: z.array(safeIdSchema).max(64),
  conflictsWithActivationKeys: z.array(safeIdSchema).max(64),
}).strict()

const timingConstraintProposalSchema = z.object({
  timingConstraintKey: safeIdSchema,
  order: orderSchema,
  phase: z.enum(LIVING_FRAME_TIMING_PHASES),
  cueCode: z.enum(LIVING_FRAME_SEMANTIC_CUE_CODES),
  derivedSummary: safeTextSchema(700),
  exactFramesProvided: z.literal(false),
}).strict()

const attentionConstraintProposalSchema = z.object({
  attentionConstraintKey: safeIdSchema,
  order: orderSchema,
  eventType: z.enum(LIVING_FRAME_ATTENTION_EVENT_TYPES),
  target: z.enum(LIVING_FRAME_ATTENTION_TARGETS),
  methods: z.array(z.enum(LIVING_FRAME_ATTENTION_METHODS)).max(7),
  derivedSummary: safeTextSchema(700),
  exactFramesProvided: z.literal(false),
}).strict()

const scaleConstraintProposalSchema = z.object({
  scaleConstraintKey: safeIdSchema,
  componentKey: safeIdSchema,
  mode: z.enum(LIVING_FRAME_SEMANTIC_SCALE_MODES),
  meaning: z.enum(LIVING_FRAME_SEMANTIC_SCALE_MEANINGS),
  factualGuard: z.enum(LIVING_FRAME_FACTUAL_SCALE_GUARDS),
  derivedSummary: safeTextSchema(700),
}).strict()

const soundConstraintProposalSchema = z.object({
  soundConstraintKey: safeIdSchema,
  order: orderSchema,
  linkedComponentKey: safeIdSchema.nullable(),
  purpose: z.enum(LIVING_FRAME_SOUND_PURPOSES),
  priority: z.enum(LIVING_FRAME_SOUND_PRIORITIES),
  narrationProtection: z.enum(LIVING_FRAME_NARRATION_PROTECTION),
  duckingExpectation: z.enum(LIVING_FRAME_DUCKING_EXPECTATIONS),
  derivedSummary: safeTextSchema(700),
  exactCuePlacementProvided: z.literal(false),
  exactMixProvided: z.literal(false),
}).strict()

const regionSafetyProposalSchema = z.object({
  captions: z.enum([
    'requires_downstream_verification',
    'blocked_collision',
  ]),
  face: z.enum([
    'requires_downstream_verification',
    'blocked_collision',
  ]),
  gestures: z.enum([
    'requires_downstream_verification',
    'blocked_collision',
  ]),
}).strict()

const sceneProposalSchema = z.object({
  sceneProposalKey: safeIdSchema,
  order: orderSchema,
  semanticDecisionKey: safeIdSchema,
  segmentContextIds: z.array(safeIdSchema).max(64),
  mode: z.enum(LIVING_FRAME_MODES),
  sourceTruthMode: z.enum(LIVING_FRAME_SOURCE_TRUTH_MODES),
  narrativePurposeCode: z.enum(LIVING_FRAME_NARRATIVE_PURPOSE_CODES),
  visualVerb: z.enum(LIVING_FRAME_VISUAL_VERBS),
  importance: z.enum(LIVING_FRAME_IMPORTANCE_LEVELS),
  derivedSummary: safeTextSchema(800),
  focalPrimaryComponentKey: safeIdSchema,
  components: z.array(componentProposalSchema).min(1).max(128),
  componentDependencies:
    z.array(componentDependencyProposalSchema).max(512),
  miniSkillProposals: z.array(miniSkillProposalSchema).max(128),
  semanticTimingConstraints:
    z.array(timingConstraintProposalSchema).min(1).max(64),
  attentionConstraints:
    z.array(attentionConstraintProposalSchema).min(1).max(64),
  semanticScaleConstraints:
    z.array(scaleConstraintProposalSchema).max(64),
  soundConstraints: z.array(soundConstraintProposalSchema).max(64),
  regionSafety: regionSafetyProposalSchema,
  fallbackLadder: z.array(z.enum(LIVING_FRAME_FALLBACK_STEPS)).min(1).max(9),
  continuityExpectationKinds: z.array(z.enum([
    'style_bible',
    'character_identity_sheet',
    'object_identity_sheet',
    'environment_identity_sheet',
    'scene_design_sheet',
    'motion_language_sheet',
    'sound_language_sheet',
    'alpha_edge_rules',
    'continuity_ledger',
  ])).min(1).max(9),
  qaExpectationCodes: z.array(z.enum(LIVING_FRAME_QA_CODES)).max(32),
}).strict()

const semanticDecisionProposalSchema = z.object({
  semanticDecisionKey: safeIdSchema,
  order: orderSchema,
  decisionKind: z.enum(LIVING_FRAME_SEMANTIC_REQUEST_DECISION_KINDS),
  reasonCode: z.enum(LIVING_FRAME_REASON_CODES),
  derivedSummary: safeTextSchema(700),
  evidenceCitations: z.array(proposalEvidenceCitationSchema).max(64),
  sceneProposalKeys: z.array(safeIdSchema).max(32),
}).strict()

export const livingFrameSemanticSceneProposalResultSchema = z.object({
  schemaVersion: z.literal(
    LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_RESULT_VERSION,
  ),
  resultClass: z.literal(
    'living_frame_semantic_scene_proposal_content_only',
  ),
  overallDecision: z.enum([
    'candidates_proposed',
    'deliberate_non_use',
    'blocked',
  ]),
  decisions: z.array(semanticDecisionProposalSchema).min(1).max(32),
  sceneProposals: z.array(sceneProposalSchema).max(32),
  selectedSceneAuthority: z.literal(false),
  exactFrameAuthority: z.literal(false),
  exactSoundCueAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  providerOrToolSelectionAuthority: z.literal(false),
  workOrRuntimeAuthority: z.literal(false),
}).strict()

export const LIVING_FRAME_SEMANTIC_REQUEST_AUTHORITY_BOUNDARY =
  Object.freeze({
    controlledSourceContractOnly: true,
    liveEvidenceAuthority: false,
    sourceSpeechEvidenceAuthority: false,
    routeDataAssuranceAuthority: false,
    providerEnvelopeAuthority: false,
    reasoningRunAuthority: false,
    reasoningResultAuthority: false,
    providerTransportAuthority: false,
    providerCallAuthority: false,
    providerCredentialAuthority: false,
    providerAttemptReceiptAuthority: false,
    providerAttemptCostAuthority: false,
    selectedSceneAuthority: false,
    componentPlanAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    creditReservationAuthority: false,
    walletAuthority: false,
    serviceFeeAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    toolRouteAuthority: false,
    mediaGenerationAuthority: false,
    renderAuthority: false,
    exportAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  } as const)

export class LivingFrameSemanticRequestContractError extends Error {
  readonly issues: readonly LivingFrameSemanticRequestValidationIssue[]

  constructor(issues: readonly LivingFrameSemanticRequestValidationIssue[]) {
    super('Living Frame semantic request contract validation failed.')
    this.name = 'LivingFrameSemanticRequestContractError'
    this.issues = issues
  }
}

export function normalizeLivingFrameSemanticReasoningRequestDraft(
  draft: LivingFrameSemanticReasoningRequestDraft,
): LivingFrameSemanticReasoningRequestDraft {
  return {
    ...draft,
    workflowContext: structuredClone(draft.workflowContext),
    canonicalBindings: { ...draft.canonicalBindings },
    semanticPayload: normalizeSemanticPayload(draft.semanticPayload),
    blockingReasonCodes: sortText(draft.blockingReasonCodes),
    routeAssurance: {
      ...draft.routeAssurance,
      orderedRouteIds: [...draft.routeAssurance.orderedRouteIds],
    },
    outputContract: { ...draft.outputContract },
    authorityBoundary: { ...draft.authorityBoundary },
  }
}

export async function calculateLivingFrameSemanticSceneProposalSchemaDigest():
Promise<string> {
  return sha256CanonicalJson(
    createLivingFrameSemanticSceneProposalJsonSchema(),
  )
}

export function createLivingFrameSemanticSceneProposalJsonSchema():
Record<string, unknown> {
  const generatedSchema = z.toJSONSchema(
    livingFrameSemanticSceneProposalResultSchema,
  )
  const {
    $schema: schemaIdentifier,
    ...schema
  } = generatedSchema
  void schemaIdentifier
  return schema
}

export async function calculateLivingFrameSemanticPayloadDigest(
  payload: LivingFrameSemanticRequestPayload,
): Promise<string> {
  const inspectionIssues: LivingFrameSemanticRequestValidationIssue[] = []
  inspectJsonInput(payload, '$.semanticPayload', inspectionIssues, new Set())
  if (inspectionIssues.length > 0) {
    throw new LivingFrameSemanticRequestContractError(
      dedupeIssues(inspectionIssues),
    )
  }
  const parsed = livingFrameSemanticRequestPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    throw new LivingFrameSemanticRequestContractError(
      mapZodIssues(parsed.error.issues, '$.semanticPayload'),
    )
  }
  return sha256CanonicalJson(normalizeSemanticPayload(parsed.data))
}

export async function calculateLivingFrameSemanticReasoningRequestDigest(
  draft: LivingFrameSemanticReasoningRequestDraft,
): Promise<string> {
  const normalized = parseAndValidateDraft(draft)
  const outputJsonSchemaDigestSha256 =
    await calculateLivingFrameSemanticSceneProposalSchemaDigest()
  const semanticPayloadDigestSha256 =
    await calculateLivingFrameSemanticPayloadDigest(
      normalized.semanticPayload,
    )
  return sha256CanonicalJson({
    ...normalized,
    outputContract: {
      ...normalized.outputContract,
      outputJsonSchemaDigestSha256,
    },
    semanticPayloadDigestSha256,
  })
}

export async function createLivingFrameSemanticReasoningRequest(
  draft: LivingFrameSemanticReasoningRequestDraft,
): Promise<LivingFrameSemanticReasoningRequest> {
  const normalized = parseAndValidateDraft(draft)
  const outputJsonSchemaDigestSha256 =
    await calculateLivingFrameSemanticSceneProposalSchemaDigest()
  const semanticPayloadDigestSha256 =
    await calculateLivingFrameSemanticPayloadDigest(
      normalized.semanticPayload,
    )
  const withoutContractDigest = {
    ...normalized,
    outputContract: {
      ...normalized.outputContract,
      outputJsonSchemaDigestSha256,
    },
    semanticPayloadDigestSha256,
  }
  const contractDigestSha256 =
    await sha256CanonicalJson(withoutContractDigest)
  const request = {
    ...withoutContractDigest,
    contractDigestSha256,
  }
  const parsed = livingFrameSemanticReasoningRequestSchema.parse(request)
  assertDigestSeparation(parsed)
  return parsed
}

export async function validateLivingFrameSemanticReasoningRequest(
  input: unknown,
): Promise<LivingFrameSemanticRequestValidationResult> {
  const inspectionIssues: LivingFrameSemanticRequestValidationIssue[] = []
  inspectJsonInput(input, '$', inspectionIssues, new Set())
  if (inspectionIssues.length > 0) {
    return { ok: false, issues: dedupeIssues(inspectionIssues) }
  }
  const parsed = livingFrameSemanticReasoningRequestSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      issues: mapZodIssues(parsed.error.issues),
    }
  }
  const {
    outputContract,
    semanticPayloadDigestSha256,
    contractDigestSha256,
    ...base
  } = parsed.data
  const draft = livingFrameSemanticReasoningRequestDraftSchema.parse({
    ...base,
    outputContract: {
      schemaVersion: outputContract.schemaVersion,
      strictJsonObjectRequired:
        outputContract.strictJsonObjectRequired,
      unknownKeysRejected: outputContract.unknownKeysRejected,
      hiddenReasoningOutputAllowed:
        outputContract.hiddenReasoningOutputAllowed,
      rawEvidenceOutputAllowed:
        outputContract.rawEvidenceOutputAllowed,
      exactFrameOutputAllowed:
        outputContract.exactFrameOutputAllowed,
      exactSoundCueOutputAllowed:
        outputContract.exactSoundCueOutputAllowed,
      providerOrToolSelectionOutputAllowed:
        outputContract.providerOrToolSelectionOutputAllowed,
      selectedSceneOutputAuthority:
        outputContract.selectedSceneOutputAuthority,
    },
  })
  const semanticIssues = validateSemanticRequest(
    normalizeLivingFrameSemanticReasoningRequestDraft(draft),
  )
  if (semanticIssues.length > 0) {
    return { ok: false, issues: dedupeIssues(semanticIssues) }
  }
  const expectedOutputSchemaDigest =
    await calculateLivingFrameSemanticSceneProposalSchemaDigest()
  if (
    outputContract.outputJsonSchemaDigestSha256
    !== expectedOutputSchemaDigest
  ) {
    return {
      ok: false,
      issues: [
        issue(
          'output_schema_digest_mismatch',
          '$.outputContract.outputJsonSchemaDigestSha256',
        ),
      ],
    }
  }
  const expectedSemanticPayloadDigest =
    await calculateLivingFrameSemanticPayloadDigest(
      draft.semanticPayload,
    )
  if (semanticPayloadDigestSha256 !== expectedSemanticPayloadDigest) {
    return {
      ok: false,
      issues: [
        issue(
          'semantic_payload_digest_mismatch',
          '$.semanticPayloadDigestSha256',
        ),
      ],
    }
  }
  const expectedContractDigest = await sha256CanonicalJson({
    ...normalizeLivingFrameSemanticReasoningRequestDraft(draft),
    outputContract: {
      ...normalizeLivingFrameSemanticReasoningRequestDraft(draft)
        .outputContract,
      outputJsonSchemaDigestSha256: expectedOutputSchemaDigest,
    },
    semanticPayloadDigestSha256: expectedSemanticPayloadDigest,
  })
  if (contractDigestSha256 !== expectedContractDigest) {
    return {
      ok: false,
      issues: [issue('digest_mismatch', '$.contractDigestSha256')],
    }
  }
  try {
    assertDigestSeparation(parsed.data)
  } catch (error) {
    if (error instanceof LivingFrameSemanticRequestContractError) {
      return { ok: false, issues: error.issues }
    }
    throw error
  }
  return { ok: true, request: parsed.data }
}

function parseAndValidateDraft(
  input: unknown,
): LivingFrameSemanticReasoningRequestDraft {
  const inspectionIssues: LivingFrameSemanticRequestValidationIssue[] = []
  inspectJsonInput(input, '$', inspectionIssues, new Set())
  if (inspectionIssues.length > 0) {
    throw new LivingFrameSemanticRequestContractError(
      dedupeIssues(inspectionIssues),
    )
  }
  const parsed = livingFrameSemanticReasoningRequestDraftSchema.safeParse(input)
  if (!parsed.success) {
    throw new LivingFrameSemanticRequestContractError(
      mapZodIssues(parsed.error.issues),
    )
  }
  const normalized =
    normalizeLivingFrameSemanticReasoningRequestDraft(parsed.data)
  const semanticIssues = validateSemanticRequest(normalized)
  if (semanticIssues.length > 0) {
    throw new LivingFrameSemanticRequestContractError(
      dedupeIssues(semanticIssues),
    )
  }
  return normalized
}

function validateSemanticRequest(
  draft: LivingFrameSemanticReasoningRequestDraft,
): LivingFrameSemanticRequestValidationIssue[] {
  const issues: LivingFrameSemanticRequestValidationIssue[] = []
  const payload = draft.semanticPayload
  const evidenceIds = validateUniqueIds(
    payload.evidence.evidenceReferences,
    (entry) => entry.evidenceRefId,
    '$.semanticPayload.evidence.evidenceReferences',
    issues,
  )
  validateOrdered(
    payload.segmentContexts,
    (entry) => entry.order,
    '$.semanticPayload.segmentContexts',
    issues,
  )
  validateUniqueIds(
    payload.segmentContexts,
    (entry) => entry.segmentContextId,
    '$.semanticPayload.segmentContexts',
    issues,
  )
  validateOrdered(
    payload.semanticConstraints,
    (entry) => entry.order,
    '$.semanticPayload.semanticConstraints',
    issues,
  )
  validateUniqueIds(
    payload.semanticConstraints,
    (entry) => entry.constraintId,
    '$.semanticPayload.semanticConstraints',
    issues,
  )

  if (
    payload.evidence.visualEvidenceBindingDigestSha256
    !== draft.canonicalBindings.visualEvidenceBindingDigestSha256
  ) {
    issues.push(issue(
      'digest_mismatch',
      '$.semanticPayload.evidence.visualEvidenceBindingDigestSha256',
    ))
  }

  const visualEvidence = payload.evidence.evidenceReferences.filter(
    (entry) => entry.kind === 'source_visual_observation',
  )
  const ideaFirstEvidence = payload.evidence.evidenceReferences.filter(
    (entry) => entry.kind === 'canonical_idea_first_context',
  )
  if (payload.evidence.sourceMode === 'uploaded_media') {
    if (
      visualEvidence.length === 0
      || ideaFirstEvidence.length !== 0
      || payload.segmentContexts.some(
        (segment) =>
          segment.sourceSegmentRefId === null
          || segment.sourceSequenceItemId === null,
      )
    ) {
      issues.push(issue(
        'source_mode_invalid',
        '$.semanticPayload.evidence.sourceMode',
      ))
    }
  } else if (
    ideaFirstEvidence.length !== 1
    || visualEvidence.length !== 0
    || payload.evidence.speechExpectation.sourceContainsSpeech
    || payload.segmentContexts.some(
      (segment) =>
        segment.sourceSegmentRefId !== null
        || segment.sourceSequenceItemId !== null,
    )
  ) {
    issues.push(issue(
      'source_mode_invalid',
      '$.semanticPayload.evidence.sourceMode',
    ))
  }

  for (const [index, segment] of payload.segmentContexts.entries()) {
    validateReferenceIds(
      segment.evidenceRefIds,
      evidenceIds,
      `$.semanticPayload.segmentContexts[${index}].evidenceRefIds`,
      issues,
    )
  }
  for (const [index, constraint] of payload.semanticConstraints.entries()) {
    validateReferenceIds(
      constraint.evidenceRefIds,
      evidenceIds,
      `$.semanticPayload.semanticConstraints[${index}].evidenceRefIds`,
      issues,
    )
  }

  const speech = payload.evidence.speechExpectation
  const speechBlockPresent = draft.blockingReasonCodes.includes(
    'generic_source_speech_evidence_required',
  )
  if (speech.sourceContainsSpeech) {
    if (
      speech.state !== 'generic_source_speech_evidence_required'
      || !speech.futureSharedAuthorityRequired
      || !speechBlockPresent
    ) {
      issues.push(issue(
        'speech_evidence_required',
        '$.semanticPayload.evidence.speechExpectation',
      ))
    }
  } else if (
    speech.state !== 'not_applicable_no_source_speech'
    || speech.futureSharedAuthorityRequired
    || speechBlockPresent
  ) {
    issues.push(issue(
      'speech_evidence_required',
      '$.semanticPayload.evidence.speechExpectation',
    ))
  }

  if (
    draft.routeAssurance.state
      !== 'shared_route_data_assurance_required'
    || draft.routeAssurance.sharedRouteDataAssuranceDigestSha256 !== null
    || !draft.blockingReasonCodes.includes(
      'shared_route_data_assurance_required',
    )
  ) {
    issues.push(issue(
      'route_data_assurance_required',
      '$.routeAssurance',
    ))
  }
  if (
    draft.routeAssurance.providerEnvelopeState !== 'unbound'
    || draft.routeAssurance.providerEnvelopeDigestSha256 !== null
  ) {
    issues.push(issue(
      'provider_envelope_must_be_unbound',
      '$.routeAssurance.providerEnvelopeState',
    ))
  }

  const hardRestraint = payload.restraintSignals.some(
    (signal) =>
      signal === 'no_animation_requested'
      || signal === 'no_extra_visuals_requested'
      || signal === 'talking_head_only_requested'
      || signal === 'emotional_face_priority',
  )
  if (
    hardRestraint
    && (
      payload.requestedDecisionKinds.includes('semantic_candidate')
      || !payload.requestedDecisionKinds.includes('deliberate_non_use')
      || payload.allowedModes.length !== 0
    )
  ) {
    issues.push(issue(
      'restraint_precedence_invalid',
      '$.semanticPayload.restraintSignals',
    ))
  }
  if (
    !hardRestraint
    && payload.requestedDecisionKinds.includes('semantic_candidate')
    && payload.allowedModes.length === 0
  ) {
    issues.push(issue(
      'restraint_precedence_invalid',
      '$.semanticPayload.allowedModes',
    ))
  }
  return issues
}

function assertDigestSeparation(
  request: LivingFrameSemanticReasoningRequest,
): void {
  const digests = [
    request.canonicalBindings.preapprovalInputAuthorityDigestSha256,
    request.canonicalBindings.visualEvidenceBindingDigestSha256,
    request.outputContract.outputJsonSchemaDigestSha256,
    request.semanticPayloadDigestSha256,
    request.contractDigestSha256,
  ]
  if (new Set(digests).size !== digests.length) {
    throw new LivingFrameSemanticRequestContractError([
      issue(
        'authority_digest_not_separated',
        '$.semanticPayloadDigestSha256',
      ),
    ])
  }
}

function normalizeSemanticPayload(
  payload: LivingFrameSemanticRequestPayload,
): LivingFrameSemanticRequestPayload {
  return {
    ...payload,
    intentSignals: sortText(payload.intentSignals),
    restraintSignals: sortText(payload.restraintSignals),
    allowedModes: sortText(payload.allowedModes),
    evidence: {
      ...payload.evidence,
      evidenceReferences: [...payload.evidence.evidenceReferences]
        .sort((left, right) =>
          compareText(left.evidenceRefId, right.evidenceRefId))
        .map((entry) => ({ ...entry })),
      speechExpectation: { ...payload.evidence.speechExpectation },
    },
    segmentContexts: [...payload.segmentContexts]
      .sort(compareOrdered)
      .map((segment) => ({
        ...segment,
        evidenceRefIds: sortText(segment.evidenceRefIds),
        candidateModeHints: sortText(segment.candidateModeHints),
      })),
    semanticConstraints: [...payload.semanticConstraints]
      .sort(compareOrdered)
      .map((constraint) => ({
        ...constraint,
        evidenceRefIds: sortText(constraint.evidenceRefIds),
      })),
    requestedDecisionKinds: sortText(payload.requestedDecisionKinds),
  }
}

function validateOrdered<T>(
  values: readonly T[],
  orderOf: (value: T) => number,
  path: string,
  issues: LivingFrameSemanticRequestValidationIssue[],
): void {
  const seen = new Set<number>()
  for (const [index, value] of values.entries()) {
    const order = orderOf(value)
    if (seen.has(order)) {
      issues.push(issue('duplicate_order', `${path}[${index}].order`))
    }
    seen.add(order)
    if (order !== index) {
      issues.push(issue('semantic_order_invalid', `${path}[${index}].order`))
    }
  }
}

function validateUniqueIds<T>(
  values: readonly T[],
  idOf: (value: T) => string,
  path: string,
  issues: LivingFrameSemanticRequestValidationIssue[],
): Set<string> {
  const ids = new Set<string>()
  for (const [index, value] of values.entries()) {
    const id = idOf(value)
    if (ids.has(id)) {
      issues.push(issue('duplicate_id', `${path}[${index}]`))
    }
    ids.add(id)
  }
  return ids
}

function validateReferenceIds(
  references: readonly string[],
  allowed: ReadonlySet<string>,
  path: string,
  issues: LivingFrameSemanticRequestValidationIssue[],
): void {
  for (const [index, reference] of references.entries()) {
    if (!allowed.has(reference)) {
      issues.push(issue('dangling_reference', `${path}[${index}]`))
    }
  }
}

function inspectJsonInput(
  value: unknown,
  path: string,
  issues: LivingFrameSemanticRequestValidationIssue[],
  seen: Set<object>,
): void {
  if (
    value === undefined
    || typeof value === 'function'
    || typeof value === 'symbol'
    || typeof value === 'bigint'
    || (typeof value === 'number' && !Number.isFinite(value))
  ) {
    issues.push(issue('non_json_input', path))
    return
  }
  if (typeof value === 'string') {
    if (
      hasControlCharacter(value)
      || URL_OR_EXECUTABLE_URI.test(value)
      || FILESYSTEM_PATH_PREFIX.test(value)
      || SECRET_LIKE.test(value)
    ) {
      issues.push(issue('unsafe_text', path))
    }
    return
  }
  if (value === null || typeof value !== 'object') return
  if (seen.has(value)) {
    issues.push(issue('non_json_input', path))
    return
  }
  seen.add(value)
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      inspectJsonInput(entry, `${path}[${index}]`, issues, seen))
    seen.delete(value)
    return
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    issues.push(issue('non_json_input', path))
    return
  }
  for (const [key, entry] of Object.entries(value)) {
    const nextPath = path === '$' ? `$.${key}` : `${path}.${key}`
    if (FORBIDDEN_KEYS.has(key)) {
      issues.push(issue('forbidden_key', nextPath))
      continue
    }
    inspectJsonInput(entry, nextPath, issues, seen)
  }
  seen.delete(value)
}

async function sha256CanonicalJson(value: unknown): Promise<string> {
  const inspectionIssues: LivingFrameSemanticRequestValidationIssue[] = []
  inspectJsonInput(value, '$', inspectionIssues, new Set())
  if (inspectionIssues.length > 0) {
    throw new LivingFrameSemanticRequestContractError(
      dedupeIssues(inspectionIssues),
    )
  }
  if (!globalThis.crypto?.subtle) {
    throw new LivingFrameSemanticRequestContractError([
      issue('crypto_unavailable', '$'),
    ])
  }
  try {
    const encoded = new TextEncoder().encode(canonicalJsonStringify(value))
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded)
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    throw new LivingFrameSemanticRequestContractError([
      issue('digest_calculation_failed', '$'),
    ])
  }
}

function canonicalJsonStringify(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJsonStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, entry]) =>
        `${JSON.stringify(key)}:${canonicalJsonStringify(entry)}`)
    return `{${entries.join(',')}}`
  }
  throw new LivingFrameSemanticRequestContractError([
    issue('non_json_input', '$'),
  ])
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
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

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function mapZodIssues(
  zodIssues: readonly z.core.$ZodIssue[],
  prefix = '$',
): LivingFrameSemanticRequestValidationIssue[] {
  return dedupeIssues(zodIssues.map((entry) => {
    const suffix = entry.path.length > 0
      ? `.${entry.path.map(String).join('.')}`
      : ''
    const code: LivingFrameSemanticRequestValidationIssueCode =
      entry.message === 'unsafe_text'
        ? 'unsafe_text'
        : 'schema_rejected'
    return issue(code, `${prefix}${suffix}`)
  }))
}

function issue(
  code: LivingFrameSemanticRequestValidationIssueCode,
  path: string,
): LivingFrameSemanticRequestValidationIssue {
  return { code, path }
}

function dedupeIssues(
  issues: readonly LivingFrameSemanticRequestValidationIssue[],
): LivingFrameSemanticRequestValidationIssue[] {
  const seen = new Set<string>()
  return issues.filter((entry) => {
    const key = `${entry.code}:${entry.path}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
