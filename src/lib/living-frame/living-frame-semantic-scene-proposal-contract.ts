import { z } from 'zod'

import {
  LIVING_FRAME_FALLBACK_STEPS,
  type LivingFrameFallbackStep,
} from '../../types/living-frame'
import type {
  LivingFrameSemanticReasoningRequest,
  LivingFrameSemanticSceneProposal,
  LivingFrameSemanticSceneProposalResult,
} from '../../types/living-frame-semantic-reasoning-request'
import type {
  LivingFrameVisualContinuityPack,
  LivingFrameVisualContinuitySceneDesignSheet,
} from '../../types/living-frame-visual-continuity'
import {
  livingFrameSemanticReasoningRequestSchema,
  livingFrameSemanticSceneProposalResultSchema,
  validateLivingFrameSemanticReasoningRequest,
} from './living-frame-semantic-reasoning-request-contract'
import {
  livingFrameVisualContinuityPackSchema,
  validateLivingFrameVisualContinuityPack,
} from './living-frame-visual-continuity-contract'

export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_VERSION =
  'living-frame-semantic-scene-proposal-binding-v1' as const
export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_CLASS =
  'controlled_non_promotable_semantic_scene_proposal_binding' as const
export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_EVIDENCE_CLASS =
  'controlled_non_promotable' as const

export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BLOCKING_REASON_CODES = [
  'generic_source_speech_evidence_required',
  'shared_route_data_assurance_required',
  'continuity_pack_required',
] as const
export type LivingFrameSemanticSceneProposalBlockingReasonCode =
  typeof LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BLOCKING_REASON_CODES[number]

export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_VALIDATION_EXPECTATIONS = [
  'request_contract_revalidated',
  'strict_result_schema_revalidated',
  'request_result_cross_references_validated',
  'candidate_graphs_validated',
  'semantic_order_validated',
  'focal_primary_validated',
  'attention_restoration_validated',
  'semantic_truth_validated',
  'alpha_expectations_validated',
  'continuity_scope_validated_or_blocked',
  'authority_boundary_revalidated',
] as const
export type LivingFrameSemanticSceneProposalValidationExpectation =
  typeof LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_VALIDATION_EXPECTATIONS[number]

export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_ISSUE_CODES = [
  'non_json_input',
  'forbidden_key',
  'unsafe_text',
  'request_invalid',
  'request_digest_mismatch',
  'semantic_payload_digest_mismatch',
  'output_schema_digest_mismatch',
  'proposal_schema_invalid',
  'proposal_result_digest_mismatch',
  'binding_digest_mismatch',
  'digest_not_separated',
  'continuity_pack_invalid',
  'continuity_pack_digest_mismatch',
  'continuity_scope_mismatch',
  'continuity_pack_unexpected',
  'continuity_expectation_missing',
  'duplicate_id',
  'duplicate_order',
  'duplicate_reference',
  'semantic_order_invalid',
  'overall_decision_invalid',
  'restraint_precedence_invalid',
  'dangling_request_evidence_reference',
  'dangling_segment_reference',
  'dangling_decision_reference',
  'dangling_scene_reference',
  'dangling_component_reference',
  'dangling_timing_reference',
  'dangling_activation_reference',
  'cyclic_component_graph',
  'cyclic_activation_graph',
  'activation_dependency_conflict',
  'focal_primary_invalid',
  'attention_restoration_required',
  'semantic_scale_truth_invalid',
  'source_truth_invalid',
  'alpha_expectation_invalid',
  'region_safety_invalid',
  'narration_protection_invalid',
  'fallback_ladder_invalid',
  'identity_or_fact_safety_invalid',
  'authority_boundary_invalid',
  'crypto_unavailable',
  'digest_calculation_failed',
] as const
export type LivingFrameSemanticSceneProposalIssueCode =
  typeof LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_ISSUE_CODES[number]

export interface LivingFrameSemanticSceneProposalAuthorityBoundary {
  readonly controlledCrossValidationOnly: true
  readonly liveEvidenceAuthority: false
  readonly sourceSpeechEvidenceAuthority: false
  readonly routeDataAssuranceAuthority: false
  readonly reasoningRunAuthority: false
  readonly reasoningResultAuthority: false
  readonly selectedSceneAuthority: false
  readonly canonicalComponentPlanAuthority: false
  readonly exactTimingAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly providerTransportAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly mediaGenerationAuthority: false
  readonly renderAuthority: false
  readonly exportAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface CreateLivingFrameSemanticSceneProposalBindingInput {
  readonly request: unknown
  readonly result: unknown
  readonly continuityPack?: unknown | null
}

export interface LivingFrameSemanticSceneProposalBindingDraft {
  readonly schemaVersion:
    typeof LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_VERSION
  readonly bindingClass:
    typeof LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_CLASS
  readonly evidenceClass:
    typeof LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_EVIDENCE_CLASS
  readonly promotionAllowed: false
  readonly request: LivingFrameSemanticReasoningRequest
  readonly normalizedResult: LivingFrameSemanticSceneProposalResult
  readonly continuityPack: LivingFrameVisualContinuityPack | null
  readonly requestContractDigestSha256: string
  readonly semanticPayloadDigestSha256: string
  readonly outputJsonSchemaDigestSha256: string
  readonly proposalResultDigestSha256: string
  readonly continuityPackDigestSha256: string | null
  readonly blockingReasonCodes:
    readonly LivingFrameSemanticSceneProposalBlockingReasonCode[]
  readonly validationExpectationCodes:
    readonly LivingFrameSemanticSceneProposalValidationExpectation[]
  readonly authorityBoundary:
    LivingFrameSemanticSceneProposalAuthorityBoundary
}

export interface LivingFrameSemanticSceneProposalBinding
  extends LivingFrameSemanticSceneProposalBindingDraft {
  readonly contractDigestSha256: string
}

export interface LivingFrameSemanticSceneProposalIssue {
  readonly code: LivingFrameSemanticSceneProposalIssueCode
  readonly path: string
}

export type LivingFrameSemanticSceneProposalValidationResult =
  | {
      readonly ok: true
      readonly binding: LivingFrameSemanticSceneProposalBinding
    }
  | {
      readonly ok: false
      readonly issues: readonly LivingFrameSemanticSceneProposalIssue[]
    }

const SHA256 = /^[a-f0-9]{64}$/u
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
  'rawEvidence',
  'raw_evidence',
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
  'assetManifest',
  'asset_manifest',
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

const sha256Schema = z.string().regex(SHA256)

export const LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_AUTHORITY_BOUNDARY =
  Object.freeze({
    controlledCrossValidationOnly: true,
    liveEvidenceAuthority: false,
    sourceSpeechEvidenceAuthority: false,
    routeDataAssuranceAuthority: false,
    reasoningRunAuthority: false,
    reasoningResultAuthority: false,
    selectedSceneAuthority: false,
    canonicalComponentPlanAuthority: false,
    exactTimingAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    providerTransportAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    mediaGenerationAuthority: false,
    renderAuthority: false,
    exportAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  } as const satisfies LivingFrameSemanticSceneProposalAuthorityBoundary)

const authorityBoundarySchema = z.object({
  controlledCrossValidationOnly: z.literal(true),
  liveEvidenceAuthority: z.literal(false),
  sourceSpeechEvidenceAuthority: z.literal(false),
  routeDataAssuranceAuthority: z.literal(false),
  reasoningRunAuthority: z.literal(false),
  reasoningResultAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  canonicalComponentPlanAuthority: z.literal(false),
  exactTimingAuthority: z.literal(false),
  soundSyncAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerCommercialAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  mediaGenerationAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  exportAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const livingFrameSemanticSceneProposalBindingDraftSchema = z.object({
  schemaVersion: z.literal(
    LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_VERSION,
  ),
  bindingClass: z.literal(
    LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_CLASS,
  ),
  evidenceClass: z.literal(
    LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_EVIDENCE_CLASS,
  ),
  promotionAllowed: z.literal(false),
  request: livingFrameSemanticReasoningRequestSchema,
  normalizedResult: livingFrameSemanticSceneProposalResultSchema,
  continuityPack: livingFrameVisualContinuityPackSchema.nullable(),
  requestContractDigestSha256: sha256Schema,
  semanticPayloadDigestSha256: sha256Schema,
  outputJsonSchemaDigestSha256: sha256Schema,
  proposalResultDigestSha256: sha256Schema,
  continuityPackDigestSha256: sha256Schema.nullable(),
  blockingReasonCodes: z.array(z.enum(
    LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BLOCKING_REASON_CODES,
  )).max(3),
  validationExpectationCodes: z.array(z.enum(
    LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_VALIDATION_EXPECTATIONS,
  )).length(LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_VALIDATION_EXPECTATIONS.length),
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const livingFrameSemanticSceneProposalBindingSchema =
  livingFrameSemanticSceneProposalBindingDraftSchema.extend({
    contractDigestSha256: sha256Schema,
  }).strict()

export class LivingFrameSemanticSceneProposalContractError extends Error {
  readonly issues: readonly LivingFrameSemanticSceneProposalIssue[]

  constructor(issues: readonly LivingFrameSemanticSceneProposalIssue[]) {
    super('Living Frame semantic scene proposal validation failed.')
    this.name = 'LivingFrameSemanticSceneProposalContractError'
    this.issues = issues
  }
}

export function normalizeLivingFrameSemanticSceneProposalResult(
  result: LivingFrameSemanticSceneProposalResult,
): LivingFrameSemanticSceneProposalResult {
  return {
    ...result,
    decisions: [...result.decisions]
      .sort(compareOrdered)
      .map((decision) => ({
        ...decision,
        evidenceCitations: sortCitations(decision.evidenceCitations),
        sceneProposalKeys: sortText(decision.sceneProposalKeys),
      })),
    sceneProposals: [...result.sceneProposals]
      .sort(compareOrdered)
      .map(normalizeSceneProposal),
  }
}

export async function calculateLivingFrameSemanticSceneProposalResultDigest(
  input: unknown,
): Promise<string> {
  const inspectionIssues = inspectJsonInput(input)
  if (inspectionIssues.length > 0) {
    throw new LivingFrameSemanticSceneProposalContractError(inspectionIssues)
  }
  const parsed = livingFrameSemanticSceneProposalResultSchema.safeParse(input)
  if (!parsed.success) {
    throw new LivingFrameSemanticSceneProposalContractError(
      mapZodIssues(parsed.error.issues, 'proposal_schema_invalid'),
    )
  }
  return sha256CanonicalJson(
    normalizeLivingFrameSemanticSceneProposalResult(
      parsed.data as unknown as LivingFrameSemanticSceneProposalResult,
    ),
  )
}

export async function calculateLivingFrameSemanticSceneProposalBindingDigest(
  draft: LivingFrameSemanticSceneProposalBindingDraft,
): Promise<string> {
  const parsed = livingFrameSemanticSceneProposalBindingDraftSchema.safeParse(
    draft,
  )
  if (!parsed.success) {
    throw new LivingFrameSemanticSceneProposalContractError(
      mapZodIssues(parsed.error.issues, 'proposal_schema_invalid'),
    )
  }
  return sha256CanonicalJson(parsed.data)
}

export async function createLivingFrameSemanticSceneProposalBinding(
  input: CreateLivingFrameSemanticSceneProposalBindingInput,
): Promise<LivingFrameSemanticSceneProposalBinding> {
  const prepared = await prepareBindingInput(input)
  if (prepared.issues.length > 0) {
    throw new LivingFrameSemanticSceneProposalContractError(
      dedupeIssues(prepared.issues),
    )
  }
  const draft = buildBindingDraft(prepared)
  const contractDigestSha256 =
    await calculateLivingFrameSemanticSceneProposalBindingDigest(draft)
  assertDigestSeparation(draft, contractDigestSha256)
  return livingFrameSemanticSceneProposalBindingSchema.parse({
    ...draft,
    contractDigestSha256,
  }) as unknown as LivingFrameSemanticSceneProposalBinding
}

export async function validateLivingFrameSemanticSceneProposalBinding(
  input: unknown,
): Promise<LivingFrameSemanticSceneProposalValidationResult> {
  const inspectionIssues = inspectJsonInput(input)
  if (inspectionIssues.length > 0) {
    return { ok: false, issues: inspectionIssues }
  }
  const parsed = livingFrameSemanticSceneProposalBindingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      issues: mapZodIssues(
        parsed.error.issues,
        'proposal_schema_invalid',
      ),
    }
  }
  const prepared = await prepareBindingInput({
    request: parsed.data.request,
    result: parsed.data.normalizedResult,
    continuityPack: parsed.data.continuityPack,
  })
  const issues = [...prepared.issues]
  if (prepared.request) {
    if (
      parsed.data.requestContractDigestSha256
      !== prepared.request.contractDigestSha256
    ) {
      issues.push(issue(
        'request_digest_mismatch',
        '$.requestContractDigestSha256',
      ))
    }
    if (
      parsed.data.semanticPayloadDigestSha256
      !== prepared.request.semanticPayloadDigestSha256
    ) {
      issues.push(issue(
        'semantic_payload_digest_mismatch',
        '$.semanticPayloadDigestSha256',
      ))
    }
    if (
      parsed.data.outputJsonSchemaDigestSha256
      !== prepared.request.outputContract.outputJsonSchemaDigestSha256
    ) {
      issues.push(issue(
        'output_schema_digest_mismatch',
        '$.outputJsonSchemaDigestSha256',
      ))
    }
  }
  if (
    prepared.proposalResultDigestSha256
    && parsed.data.proposalResultDigestSha256
      !== prepared.proposalResultDigestSha256
  ) {
    issues.push(issue(
      'proposal_result_digest_mismatch',
      '$.proposalResultDigestSha256',
    ))
  }
  const expectedContinuityDigest =
    prepared.continuityPack?.contractDigestSha256 ?? null
  if (
    parsed.data.continuityPackDigestSha256
    !== expectedContinuityDigest
  ) {
    issues.push(issue(
      'continuity_pack_digest_mismatch',
      '$.continuityPackDigestSha256',
    ))
  }
  const expectedBlockers = deriveBlockingReasonCodes(
    prepared.request,
    prepared.result,
    prepared.continuityPack,
  )
  if (!sameTextArray(parsed.data.blockingReasonCodes, expectedBlockers)) {
    issues.push(issue(
      'authority_boundary_invalid',
      '$.blockingReasonCodes',
    ))
  }
  if (
    !sameTextArray(
      parsed.data.validationExpectationCodes,
      LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_VALIDATION_EXPECTATIONS,
    )
  ) {
    issues.push(issue(
      'authority_boundary_invalid',
      '$.validationExpectationCodes',
    ))
  }
  if (issues.length > 0) {
    return { ok: false, issues: dedupeIssues(issues) }
  }
  const {
    contractDigestSha256,
    ...draft
  } = parsed.data
  const expectedBindingDigest =
    await calculateLivingFrameSemanticSceneProposalBindingDigest(
      draft as unknown as LivingFrameSemanticSceneProposalBindingDraft,
    )
  if (contractDigestSha256 !== expectedBindingDigest) {
    return {
      ok: false,
      issues: [
        issue('binding_digest_mismatch', '$.contractDigestSha256'),
      ],
    }
  }
  try {
    assertDigestSeparation(
      draft as unknown as LivingFrameSemanticSceneProposalBindingDraft,
      contractDigestSha256,
    )
  } catch (error) {
    return {
      ok: false,
      issues: error instanceof LivingFrameSemanticSceneProposalContractError
        ? error.issues
        : [issue('digest_not_separated', '$.contractDigestSha256')],
    }
  }
  return {
    ok: true,
    binding:
      parsed.data as unknown as LivingFrameSemanticSceneProposalBinding,
  }
}

interface PreparedBindingInput {
  readonly request: LivingFrameSemanticReasoningRequest | null
  readonly result: LivingFrameSemanticSceneProposalResult | null
  readonly continuityPack: LivingFrameVisualContinuityPack | null
  readonly proposalResultDigestSha256: string | null
  readonly issues: readonly LivingFrameSemanticSceneProposalIssue[]
}

async function prepareBindingInput(
  input: CreateLivingFrameSemanticSceneProposalBindingInput,
): Promise<PreparedBindingInput> {
  const inspectionIssues = inspectJsonInput(input)
  if (inspectionIssues.length > 0) {
    return {
      request: null,
      result: null,
      continuityPack: null,
      proposalResultDigestSha256: null,
      issues: inspectionIssues,
    }
  }

  const issues: LivingFrameSemanticSceneProposalIssue[] = []
  const requestValidation =
    await validateLivingFrameSemanticReasoningRequest(input.request)
  const request = requestValidation.ok ? requestValidation.request : null
  if (!requestValidation.ok) {
    issues.push(issue('request_invalid', '$.request'))
  }

  const resultParse =
    livingFrameSemanticSceneProposalResultSchema.safeParse(input.result)
  const result = resultParse.success
    ? normalizeLivingFrameSemanticSceneProposalResult(
      resultParse.data as unknown as LivingFrameSemanticSceneProposalResult,
    )
    : null
  if (!resultParse.success) {
    issues.push(...mapZodIssues(
      resultParse.error.issues,
      'proposal_schema_invalid',
      '$.result',
    ))
  }

  let continuityPack: LivingFrameVisualContinuityPack | null = null
  if (input.continuityPack !== undefined && input.continuityPack !== null) {
    const continuityValidation =
      await validateLivingFrameVisualContinuityPack(input.continuityPack)
    if (continuityValidation.ok) {
      continuityPack = continuityValidation.pack
    } else {
      issues.push(issue('continuity_pack_invalid', '$.continuityPack'))
    }
  }

  let proposalResultDigestSha256: string | null = null
  if (result) {
    proposalResultDigestSha256 =
      await calculateLivingFrameSemanticSceneProposalResultDigest(result)
  }
  if (request && result) {
    issues.push(...validateProposalAgainstRequest(
      request,
      result,
      continuityPack,
    ))
  }

  return {
    request,
    result,
    continuityPack,
    proposalResultDigestSha256,
    issues: dedupeIssues(issues),
  }
}

function buildBindingDraft(
  prepared: PreparedBindingInput,
): LivingFrameSemanticSceneProposalBindingDraft {
  if (
    !prepared.request
    || !prepared.result
    || !prepared.proposalResultDigestSha256
  ) {
    throw new LivingFrameSemanticSceneProposalContractError([
      issue('proposal_schema_invalid', '$'),
    ])
  }
  return {
    schemaVersion: LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_VERSION,
    bindingClass: LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_CLASS,
    evidenceClass:
      LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_BINDING_EVIDENCE_CLASS,
    promotionAllowed: false,
    request: prepared.request,
    normalizedResult: prepared.result,
    continuityPack: prepared.continuityPack,
    requestContractDigestSha256:
      prepared.request.contractDigestSha256,
    semanticPayloadDigestSha256:
      prepared.request.semanticPayloadDigestSha256,
    outputJsonSchemaDigestSha256:
      prepared.request.outputContract.outputJsonSchemaDigestSha256,
    proposalResultDigestSha256:
      prepared.proposalResultDigestSha256,
    continuityPackDigestSha256:
      prepared.continuityPack?.contractDigestSha256 ?? null,
    blockingReasonCodes: deriveBlockingReasonCodes(
      prepared.request,
      prepared.result,
      prepared.continuityPack,
    ),
    validationExpectationCodes: [
      ...LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_VALIDATION_EXPECTATIONS,
    ],
    authorityBoundary:
      LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_AUTHORITY_BOUNDARY,
  }
}

function deriveBlockingReasonCodes(
  request: LivingFrameSemanticReasoningRequest | null,
  result: LivingFrameSemanticSceneProposalResult | null,
  continuityPack: LivingFrameVisualContinuityPack | null,
): LivingFrameSemanticSceneProposalBlockingReasonCode[] {
  const reasons = new Set<
    LivingFrameSemanticSceneProposalBlockingReasonCode
  >()
  for (const reason of request?.blockingReasonCodes ?? []) {
    reasons.add(reason)
  }
  const continuityRequired = (result?.sceneProposals ?? []).some(
    (scene) => scene.continuityExpectationKinds.length > 0,
  )
  if (continuityRequired && !continuityPack) {
    reasons.add('continuity_pack_required')
  }
  return [...reasons].sort(compareText)
}

function validateProposalAgainstRequest(
  request: LivingFrameSemanticReasoningRequest,
  result: LivingFrameSemanticSceneProposalResult,
  continuityPack: LivingFrameVisualContinuityPack | null,
): LivingFrameSemanticSceneProposalIssue[] {
  const issues: LivingFrameSemanticSceneProposalIssue[] = []
  validateOrdered(result.decisions, '$.result.decisions', issues)
  const decisionKeys = validateUnique(
    result.decisions,
    (entry) => entry.semanticDecisionKey,
    '$.result.decisions',
    issues,
  )
  validateOrdered(result.sceneProposals, '$.result.sceneProposals', issues)
  const sceneKeys = validateUnique(
    result.sceneProposals,
    (entry) => entry.sceneProposalKey,
    '$.result.sceneProposals',
    issues,
  )

  const requestEvidenceIds = new Set(
    request.semanticPayload.evidence.evidenceReferences.map(
      (entry) => entry.evidenceRefId,
    ),
  )
  const requestSegmentIds = new Set(
    request.semanticPayload.segmentContexts.map(
      (entry) => entry.segmentContextId,
    ),
  )
  const requestDecisionKinds = new Set(
    request.semanticPayload.requestedDecisionKinds,
  )

  validateOverallDecision(result, issues)
  validateRestraintPrecedence(request, result, issues)

  for (const [decisionIndex, decision] of result.decisions.entries()) {
    if (!requestDecisionKinds.has(decision.decisionKind)) {
      issues.push(issue(
        'restraint_precedence_invalid',
        `$.result.decisions[${decisionIndex}].decisionKind`,
      ))
    }
    validateCitationReferences(
      decision.evidenceCitations,
      requestEvidenceIds,
      `$.result.decisions[${decisionIndex}].evidenceCitations`,
      issues,
    )
    validateUniqueText(
      decision.sceneProposalKeys,
      `$.result.decisions[${decisionIndex}].sceneProposalKeys`,
      issues,
    )
    validateReferences(
      decision.sceneProposalKeys,
      sceneKeys,
      'dangling_scene_reference',
      `$.result.decisions[${decisionIndex}].sceneProposalKeys`,
      issues,
    )
    const attachedSceneKeys = result.sceneProposals
      .filter(
        (scene) =>
          scene.semanticDecisionKey === decision.semanticDecisionKey,
      )
      .map((scene) => scene.sceneProposalKey)
      .sort(compareText)
    const declaredSceneKeys = sortText(decision.sceneProposalKeys)
    if (
      decision.decisionKind === 'semantic_candidate'
      && (
        attachedSceneKeys.length === 0
        || !sameTextArray(attachedSceneKeys, declaredSceneKeys)
      )
    ) {
      issues.push(issue(
        'dangling_scene_reference',
        `$.result.decisions[${decisionIndex}].sceneProposalKeys`,
      ))
    }
    if (
      decision.decisionKind !== 'semantic_candidate'
      && decision.sceneProposalKeys.length > 0
    ) {
      issues.push(issue(
        'overall_decision_invalid',
        `$.result.decisions[${decisionIndex}].sceneProposalKeys`,
      ))
    }
  }

  for (const [sceneIndex, scene] of result.sceneProposals.entries()) {
    if (!decisionKeys.has(scene.semanticDecisionKey)) {
      issues.push(issue(
        'dangling_decision_reference',
        `$.result.sceneProposals[${sceneIndex}].semanticDecisionKey`,
      ))
    } else {
      const decision = result.decisions.find(
        (entry) =>
          entry.semanticDecisionKey === scene.semanticDecisionKey,
      )
      if (decision?.decisionKind !== 'semantic_candidate') {
        issues.push(issue(
          'overall_decision_invalid',
          `$.result.sceneProposals[${sceneIndex}].semanticDecisionKey`,
        ))
      }
    }
    validateUniqueText(
      scene.segmentContextIds,
      `$.result.sceneProposals[${sceneIndex}].segmentContextIds`,
      issues,
    )
    validateReferences(
      scene.segmentContextIds,
      requestSegmentIds,
      'dangling_segment_reference',
      `$.result.sceneProposals[${sceneIndex}].segmentContextIds`,
      issues,
    )
    if (
      scene.segmentContextIds.length === 0
      || !request.semanticPayload.allowedModes.includes(scene.mode)
    ) {
      issues.push(issue(
        'dangling_segment_reference',
        `$.result.sceneProposals[${sceneIndex}]`,
      ))
    }
    validateScene(
      request,
      scene,
      sceneIndex,
      requestEvidenceIds,
      issues,
    )
  }

  validateContinuity(
    request,
    result,
    continuityPack,
    issues,
  )
  return dedupeIssues(issues)
}

function validateOverallDecision(
  result: LivingFrameSemanticSceneProposalResult,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const candidateDecisions = result.decisions.filter(
    (decision) => decision.decisionKind === 'semantic_candidate',
  )
  if (
    result.overallDecision === 'candidates_proposed'
    && (
      candidateDecisions.length === 0
      || result.sceneProposals.length === 0
    )
  ) {
    issues.push(issue('overall_decision_invalid', '$.result.overallDecision'))
  }
  if (
    result.overallDecision === 'deliberate_non_use'
    && (
      result.sceneProposals.length > 0
      || result.decisions.some(
        (decision) => decision.decisionKind !== 'deliberate_non_use',
      )
    )
  ) {
    issues.push(issue('overall_decision_invalid', '$.result.overallDecision'))
  }
  if (
    result.overallDecision === 'blocked'
    && (
      result.sceneProposals.length > 0
      || result.decisions.some(
        (decision) => decision.decisionKind !== 'blocked',
      )
    )
  ) {
    issues.push(issue('overall_decision_invalid', '$.result.overallDecision'))
  }
}

function validateRestraintPrecedence(
  request: LivingFrameSemanticReasoningRequest,
  result: LivingFrameSemanticSceneProposalResult,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const hardRestraint = request.semanticPayload.restraintSignals.some(
    (signal) =>
      signal === 'no_animation_requested'
      || signal === 'no_extra_visuals_requested'
      || signal === 'talking_head_only_requested'
      || signal === 'emotional_face_priority',
  )
  if (
    hardRestraint
    && (
      result.overallDecision === 'candidates_proposed'
      || result.sceneProposals.length > 0
      || result.decisions.some(
        (decision) => decision.decisionKind === 'semantic_candidate',
      )
    )
  ) {
    issues.push(issue(
      'restraint_precedence_invalid',
      '$.result.overallDecision',
    ))
  }
}

function validateScene(
  request: LivingFrameSemanticReasoningRequest,
  scene: LivingFrameSemanticSceneProposal,
  sceneIndex: number,
  requestEvidenceIds: ReadonlySet<string>,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const path = `$.result.sceneProposals[${sceneIndex}]`
  validateOrdered(scene.components, `${path}.components`, issues)
  const componentKeys = validateUnique(
    scene.components,
    (entry) => entry.componentKey,
    `${path}.components`,
    issues,
  )
  validateUniqueEdges(
    scene.componentDependencies.map((entry) => [
      entry.componentKey,
      entry.dependsOnComponentKey,
      entry.kind,
    ].join('\u0000')),
    `${path}.componentDependencies`,
    issues,
  )

  for (const [componentIndex, component] of scene.components.entries()) {
    const componentPath = `${path}.components[${componentIndex}]`
    validateOptionalReference(
      component.parentComponentKey,
      componentKeys,
      'dangling_component_reference',
      `${componentPath}.parentComponentKey`,
      issues,
    )
    validateOptionalReference(
      component.anchorComponentKey,
      componentKeys,
      'dangling_component_reference',
      `${componentPath}.anchorComponentKey`,
      issues,
    )
    validateUniqueText(
      component.capabilityKeys,
      `${componentPath}.capabilityKeys`,
      issues,
    )
    validateCitationReferences(
      component.evidenceCitations,
      requestEvidenceIds,
      `${componentPath}.evidenceCitations`,
      issues,
    )
    validateAlphaExpectation(component, componentPath, issues)
  }

  const componentEdges: Array<readonly [string, string]> = []
  for (const component of scene.components) {
    if (component.parentComponentKey) {
      componentEdges.push([
        component.componentKey,
        component.parentComponentKey,
      ])
    }
    if (component.anchorComponentKey) {
      componentEdges.push([
        component.componentKey,
        component.anchorComponentKey,
      ])
    }
  }
  for (
    const [dependencyIndex, dependency]
    of scene.componentDependencies.entries()
  ) {
    validateReference(
      dependency.componentKey,
      componentKeys,
      'dangling_component_reference',
      `${path}.componentDependencies[${dependencyIndex}].componentKey`,
      issues,
    )
    validateReference(
      dependency.dependsOnComponentKey,
      componentKeys,
      'dangling_component_reference',
      `${path}.componentDependencies[${dependencyIndex}].dependsOnComponentKey`,
      issues,
    )
    componentEdges.push([
      dependency.componentKey,
      dependency.dependsOnComponentKey,
    ])
  }
  if (hasDirectedCycle(componentKeys, componentEdges)) {
    issues.push(issue(
      'cyclic_component_graph',
      `${path}.componentDependencies`,
    ))
  }

  const primaryComponents = scene.components.filter(
    (component) => component.focalRole === 'primary',
  )
  if (
    primaryComponents.length !== 1
    || primaryComponents[0]?.componentKey
      !== scene.focalPrimaryComponentKey
  ) {
    issues.push(issue(
      'focal_primary_invalid',
      `${path}.focalPrimaryComponentKey`,
    ))
  }

  validateOrdered(
    scene.miniSkillProposals,
    `${path}.miniSkillProposals`,
    issues,
  )
  const activationKeys = validateUnique(
    scene.miniSkillProposals,
    (entry) => entry.activationKey,
    `${path}.miniSkillProposals`,
    issues,
  )
  validateOrdered(
    scene.semanticTimingConstraints,
    `${path}.semanticTimingConstraints`,
    issues,
  )
  const timingKeys = validateUnique(
    scene.semanticTimingConstraints,
    (entry) => entry.timingConstraintKey,
    `${path}.semanticTimingConstraints`,
    issues,
  )
  validatePhaseOrder(scene, path, issues)

  const activationEdges: Array<readonly [string, string]> = []
  for (
    const [activationIndex, activation]
    of scene.miniSkillProposals.entries()
  ) {
    const activationPath =
      `${path}.miniSkillProposals[${activationIndex}]`
    validateUniqueText(
      activation.linkedComponentKeys,
      `${activationPath}.linkedComponentKeys`,
      issues,
    )
    validateReferences(
      activation.linkedComponentKeys,
      componentKeys,
      'dangling_component_reference',
      `${activationPath}.linkedComponentKeys`,
      issues,
    )
    validateUniqueText(
      activation.linkedTimingConstraintKeys,
      `${activationPath}.linkedTimingConstraintKeys`,
      issues,
    )
    validateReferences(
      activation.linkedTimingConstraintKeys,
      timingKeys,
      'dangling_timing_reference',
      `${activationPath}.linkedTimingConstraintKeys`,
      issues,
    )
    validateUniqueText(
      activation.dependsOnActivationKeys,
      `${activationPath}.dependsOnActivationKeys`,
      issues,
    )
    validateReferences(
      activation.dependsOnActivationKeys,
      activationKeys,
      'dangling_activation_reference',
      `${activationPath}.dependsOnActivationKeys`,
      issues,
    )
    validateUniqueText(
      activation.conflictsWithActivationKeys,
      `${activationPath}.conflictsWithActivationKeys`,
      issues,
    )
    validateReferences(
      activation.conflictsWithActivationKeys,
      activationKeys,
      'dangling_activation_reference',
      `${activationPath}.conflictsWithActivationKeys`,
      issues,
    )
    const conflicts = new Set(activation.conflictsWithActivationKeys)
    if (
      activation.dependsOnActivationKeys.some(
        (dependency) => conflicts.has(dependency),
      )
    ) {
      issues.push(issue(
        'activation_dependency_conflict',
        `${activationPath}.conflictsWithActivationKeys`,
      ))
    }
    for (const dependency of activation.dependsOnActivationKeys) {
      activationEdges.push([activation.activationKey, dependency])
    }
  }
  if (hasDirectedCycle(activationKeys, activationEdges)) {
    issues.push(issue(
      'cyclic_activation_graph',
      `${path}.miniSkillProposals`,
    ))
  }

  validateOrdered(
    scene.attentionConstraints,
    `${path}.attentionConstraints`,
    issues,
  )
  validateUnique(
    scene.attentionConstraints,
    (entry) => entry.attentionConstraintKey,
    `${path}.attentionConstraints`,
    issues,
  )
  for (
    const [attentionIndex, attention]
    of scene.attentionConstraints.entries()
  ) {
    validateUniqueText(
      attention.methods,
      `${path}.attentionConstraints[${attentionIndex}].methods`,
      issues,
    )
  }
  validateAttentionRestoration(scene, path, issues)

  const scaleKeys = validateUnique(
    scene.semanticScaleConstraints,
    (entry) => entry.scaleConstraintKey,
    `${path}.semanticScaleConstraints`,
    issues,
  )
  void scaleKeys
  for (
    const [scaleIndex, scale]
    of scene.semanticScaleConstraints.entries()
  ) {
    validateReference(
      scale.componentKey,
      componentKeys,
      'dangling_component_reference',
      `${path}.semanticScaleConstraints[${scaleIndex}].componentKey`,
      issues,
    )
    validateScaleTruth(scene, scale, scaleIndex, path, issues)
  }

  validateOrdered(
    scene.soundConstraints,
    `${path}.soundConstraints`,
    issues,
  )
  validateUnique(
    scene.soundConstraints,
    (entry) => entry.soundConstraintKey,
    `${path}.soundConstraints`,
    issues,
  )
  for (const [soundIndex, sound] of scene.soundConstraints.entries()) {
    validateOptionalReference(
      sound.linkedComponentKey,
      componentKeys,
      'dangling_component_reference',
      `${path}.soundConstraints[${soundIndex}].linkedComponentKey`,
      issues,
    )
    if (sound.narrationProtection !== 'strict') {
      issues.push(issue(
        'narration_protection_invalid',
        `${path}.soundConstraints[${soundIndex}].narrationProtection`,
      ))
    }
  }

  if (
    Object.values(scene.regionSafety).some(
      (state) => state === 'blocked_collision',
    )
  ) {
    issues.push(issue('region_safety_invalid', `${path}.regionSafety`))
  }
  validateFallbackLadder(scene.fallbackLadder, path, issues)
  validateUniqueText(
    scene.continuityExpectationKinds,
    `${path}.continuityExpectationKinds`,
    issues,
  )
  if (!scene.continuityExpectationKinds.includes('style_bible')) {
    issues.push(issue(
      'continuity_expectation_missing',
      `${path}.continuityExpectationKinds`,
    ))
  }
  validateUniqueText(
    scene.qaExpectationCodes,
    `${path}.qaExpectationCodes`,
    issues,
  )
  validateSourceTruth(scene, path, issues)
  validateSegmentSafety(request, scene, path, issues)
}

function validatePhaseOrder(
  scene: LivingFrameSemanticSceneProposal,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const phaseOrder = [
    'prepare',
    'activate',
    'demonstrate',
    'resolve',
    'settle',
  ] as const
  const indexes = scene.semanticTimingConstraints.map(
    (constraint) => phaseOrder.indexOf(constraint.phase),
  )
  if (indexes.some((value, index) => index > 0 && value < indexes[index - 1]!)) {
    issues.push(issue(
      'semantic_order_invalid',
      `${path}.semanticTimingConstraints`,
    ))
  }
}

function validateAttentionRestoration(
  scene: LivingFrameSemanticSceneProposal,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  for (
    const [attentionIndex, attention]
    of scene.attentionConstraints.entries()
  ) {
    if (
      attention.eventType !== 'handoff'
      || attention.target === 'speaker'
      || attention.target === 'shared'
    ) continue
    const later = scene.attentionConstraints.slice(attentionIndex + 1)
    const restored = later.some(
      (entry) =>
        entry.eventType === 'transition_away'
        || (
          entry.eventType === 'restore'
          && (
            entry.target === 'speaker'
            || entry.target === 'shared'
          )
        ),
    )
    if (!restored) {
      issues.push(issue(
        'attention_restoration_required',
        `${path}.attentionConstraints[${attentionIndex}]`,
      ))
    }
  }
}

function validateScaleTruth(
  scene: LivingFrameSemanticSceneProposal,
  scale: LivingFrameSemanticSceneProposal[
    'semanticScaleConstraints'
  ][number],
  scaleIndex: number,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const expectedGuards = {
    literal_physical: 'literal_relationship_must_be_preserved',
    data_proportional: 'data_proportions_must_be_preserved',
    perspective: 'perspective_only',
    editorial_symbolic: 'symbolic_treatment_must_be_disclosed',
  } as const
  if (scale.factualGuard !== expectedGuards[scale.mode]) {
    issues.push(issue(
      'semantic_scale_truth_invalid',
      `${path}.semanticScaleConstraints[${scaleIndex}].factualGuard`,
    ))
  }
  const component = scene.components.find(
    (entry) => entry.componentKey === scale.componentKey,
  )
  if (
    component?.role === 'exact_map_component'
    && scale.mode === 'editorial_symbolic'
  ) {
    issues.push(issue(
      'semantic_scale_truth_invalid',
      `${path}.semanticScaleConstraints[${scaleIndex}].mode`,
    ))
  }
}

function validateSourceTruth(
  scene: LivingFrameSemanticSceneProposal,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  if (scene.sourceTruthMode === 'unknown_blocked') {
    issues.push(issue('source_truth_invalid', `${path}.sourceTruthMode`))
  }
  if (
    scene.sourceTruthMode === 'exact_geography_verification_required'
    && !scene.qaExpectationCodes.includes(
      'exact_geography_verification_required',
    )
  ) {
    issues.push(issue('source_truth_invalid', `${path}.qaExpectationCodes`))
  }
  if (
    scene.sourceTruthMode === 'exact_data_verification_required'
    && !scene.qaExpectationCodes.includes(
      'exact_data_verification_required',
    )
  ) {
    issues.push(issue('source_truth_invalid', `${path}.qaExpectationCodes`))
  }
  if (
    scene.sourceTruthMode === 'documentary_source_verification_required'
    && !scene.qaExpectationCodes.includes(
      'documentary_integrity_required',
    )
  ) {
    issues.push(issue('source_truth_invalid', `${path}.qaExpectationCodes`))
  }
  if (
    scene.components.some(
      (component) => component.role === 'exact_map_component',
    )
    && scene.sourceTruthMode !== 'exact_geography_verification_required'
  ) {
    issues.push(issue('source_truth_invalid', `${path}.sourceTruthMode`))
  }
}

function validateSegmentSafety(
  request: LivingFrameSemanticReasoningRequest,
  scene: LivingFrameSemanticSceneProposal,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const segments = request.semanticPayload.segmentContexts.filter(
    (segment) => scene.segmentContextIds.includes(segment.segmentContextId),
  )
  if (
    (scene.mode === 'living_a_roll' || scene.mode === 'hybrid_expansion')
    && segments.some(
      (segment) => segment.safeSpaceState === 'no_safe_space_observed',
    )
  ) {
    issues.push(issue('region_safety_invalid', `${path}.mode`))
  }
}

function validateAlphaExpectation(
  component: LivingFrameSemanticSceneProposal['components'][number],
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const allowed = {
    opaque_plate: ['opaque_plate'],
    native_alpha_preferred: ['native_alpha_claim_requires_qa'],
    still_alpha_required: [
      'native_alpha_claim_requires_qa',
      'postprocessed_still_mask_requires_qa',
    ],
    temporal_mask_required: ['temporal_mask_sequence_requires_qa'],
    procedural_alpha: ['procedural_alpha_requires_qa'],
    additive_effect: ['additive_blend_requires_qa'],
  } as const
  if (
    !(allowed[component.transparencyExpectation] as readonly string[])
      .includes(component.alphaSourceExpectation)
  ) {
    issues.push(issue(
      'alpha_expectation_invalid',
      `${path}.alphaSourceExpectation`,
    ))
  }
}

function validateFallbackLadder(
  ladder: readonly LivingFrameFallbackStep[],
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  validateUniqueText(ladder, `${path}.fallbackLadder`, issues)
  const indexes = ladder.map(
    (step) => LIVING_FRAME_FALLBACK_STEPS.indexOf(step),
  )
  if (
    ladder.at(-1) !== 'no_extra_visual'
    || indexes.some(
      (value, index) => index > 0 && value <= indexes[index - 1]!,
    )
  ) {
    issues.push(issue(
      'fallback_ladder_invalid',
      `${path}.fallbackLadder`,
    ))
  }
}

function validateContinuity(
  request: LivingFrameSemanticReasoningRequest,
  result: LivingFrameSemanticSceneProposalResult,
  pack: LivingFrameVisualContinuityPack | null,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const continuityRequired = result.sceneProposals.some(
    (scene) => scene.continuityExpectationKinds.length > 0,
  )
  if (!continuityRequired) {
    if (pack) {
      issues.push(issue(
        'continuity_pack_unexpected',
        '$.continuityPack',
      ))
    }
    return
  }
  if (!pack) return

  const requestBindings = request.canonicalBindings
  const packBindings = pack.canonicalBindings
  if (
    packBindings.workspaceId !== requestBindings.workspaceId
    || packBindings.projectId !== requestBindings.projectId
    || packBindings.editSessionId !== requestBindings.editSessionId
    || packBindings.handoffId !== requestBindings.handoffId
    || packBindings.planningEvidenceBindingDigestSha256
      !== requestBindings.visualEvidenceBindingDigestSha256
    || canonicalJsonStringify(pack.workflowContext)
      !== canonicalJsonStringify(request.workflowContext)
  ) {
    issues.push(issue(
      'continuity_scope_mismatch',
      '$.continuityPack.canonicalBindings',
    ))
    return
  }

  for (const [sceneIndex, scene] of result.sceneProposals.entries()) {
    const path = `$.result.sceneProposals[${sceneIndex}]`
    const matchingSheets = pack.sceneDesignSheets.filter(
      (sheet) =>
        sheet.semanticCandidateDecisionId === scene.semanticDecisionKey
        && sheet.mode === scene.mode
        && sheet.sourceTruthMode === scene.sourceTruthMode,
    )
    if (
      scene.continuityExpectationKinds.includes('scene_design_sheet')
      && matchingSheets.length !== 1
    ) {
      issues.push(issue(
        'continuity_expectation_missing',
        `${path}.continuityExpectationKinds`,
      ))
      continue
    }
    const sheet = matchingSheets[0]
    validateContinuityKinds(scene, pack, sheet, path, issues)
    if (sheet) {
      validateContinuityIdentityAndTruth(scene, pack, sheet, path, issues)
    }
  }
}

function validateContinuityKinds(
  scene: LivingFrameSemanticSceneProposal,
  pack: LivingFrameVisualContinuityPack,
  sheet: LivingFrameVisualContinuitySceneDesignSheet | undefined,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const kinds = new Set(scene.continuityExpectationKinds)
  const missing =
    (kinds.has('style_bible') && !pack.styleBible)
    || (kinds.has('character_identity_sheet')
      && pack.characterSheets.length === 0)
    || (kinds.has('object_identity_sheet')
      && pack.objectSheets.length === 0)
    || (kinds.has('environment_identity_sheet')
      && pack.environmentSheets.length === 0)
    || (kinds.has('scene_design_sheet') && !sheet)
    || (kinds.has('motion_language_sheet') && !pack.motionLanguageSheet)
    || (kinds.has('sound_language_sheet') && !pack.soundLanguageSheet)
    || (kinds.has('alpha_edge_rules') && !pack.alphaEdgeRules)
    || (kinds.has('continuity_ledger')
      && pack.continuityLedger.length === 0)
  if (missing) {
    issues.push(issue(
      'continuity_expectation_missing',
      `${path}.continuityExpectationKinds`,
    ))
  }
}

function validateContinuityIdentityAndTruth(
  scene: LivingFrameSemanticSceneProposal,
  pack: LivingFrameVisualContinuityPack,
  sheet: LivingFrameVisualContinuitySceneDesignSheet,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  if (
    scene.sourceTruthMode === 'canonical_illustrative_interpretation'
  ) {
    const characters = pack.characterSheets.filter(
      (character) => sheet.characterSheetIds.includes(
        character.characterSheetId,
      ),
    )
    if (
      characters.length === 0
      || characters.some(
        (character) =>
          character.identityKind
            !== 'canonical_illustrative_interpretation'
          || character.identitySafetyState
            !== 'canonical_interpretation_only'
          || !character.identityRuleCodes.includes(
            'do_not_claim_verified_likeness',
          )
          || !character.identityRuleCodes.includes(
            'do_not_imply_unsupported_action',
          )
          || character.verifiedLikenessClaimed
          || character.historicalEvidenceClaimed,
      )
    ) {
      issues.push(issue(
        'identity_or_fact_safety_invalid',
        `${path}.sourceTruthMode`,
      ))
    }
  }
  if (
    scene.sourceTruthMode === 'exact_geography_verification_required'
  ) {
    const mapObjects = pack.objectSheets.filter(
      (object) => sheet.objectSheetIds.includes(object.objectSheetId),
    )
    const environments = pack.environmentSheets.filter(
      (environment) => sheet.environmentSheetIds.includes(
        environment.environmentSheetId,
      ),
    )
    if (
      mapObjects.length === 0
      || mapObjects.some(
        (object) =>
          object.truthMode !== 'exact_geography_symbol_required'
          || object.exactGeometryVerified,
      )
      || environments.length === 0
      || environments.some(
        (environment) =>
          environment.truthMode !== 'exact_geography_required'
          || environment.exactGeographyVerified,
      )
      || sheet.scaleTruthGuard !== 'literal_relationship_preserved'
    ) {
      issues.push(issue(
        'identity_or_fact_safety_invalid',
        `${path}.sourceTruthMode`,
      ))
    }
  }
  if (
    pack.continuityLedger.some(
      (entry) =>
        entry.qaApprovedExecutableAsset
        || entry.assetManifestAuthority,
    )
    || pack.alphaEdgeRules.nativeAlphaClaimIsQaApproval
    || pack.alphaEdgeRules.checkerboardIsTransparency
    || !pack.alphaEdgeRules.rectangularBackgroundRejected
    || pack.alphaEdgeRules.qaApprovedAsset
  ) {
    issues.push(issue(
      'identity_or_fact_safety_invalid',
      '$.continuityPack',
    ))
  }
}

function normalizeSceneProposal(
  scene: LivingFrameSemanticSceneProposal,
): LivingFrameSemanticSceneProposal {
  return {
    ...scene,
    segmentContextIds: sortText(scene.segmentContextIds),
    components: [...scene.components]
      .sort(compareOrdered)
      .map((component) => ({
        ...component,
        capabilityKeys: sortText(component.capabilityKeys),
        evidenceCitations: sortCitations(component.evidenceCitations),
      })),
    componentDependencies: [...scene.componentDependencies].sort(
      (left, right) => compareText(
        componentDependencyIdentity(left),
        componentDependencyIdentity(right),
      ),
    ),
    miniSkillProposals: [...scene.miniSkillProposals]
      .sort(compareOrdered)
      .map((activation) => ({
        ...activation,
        linkedComponentKeys: sortText(activation.linkedComponentKeys),
        linkedTimingConstraintKeys:
          sortText(activation.linkedTimingConstraintKeys),
        dependsOnActivationKeys:
          sortText(activation.dependsOnActivationKeys),
        conflictsWithActivationKeys:
          sortText(activation.conflictsWithActivationKeys),
      })),
    semanticTimingConstraints:
      [...scene.semanticTimingConstraints].sort(compareOrdered),
    attentionConstraints: [...scene.attentionConstraints]
      .sort(compareOrdered)
      .map((attention) => ({
        ...attention,
        methods: sortText(attention.methods),
      })),
    semanticScaleConstraints:
      [...scene.semanticScaleConstraints].sort(
        (left, right) => compareText(
          left.scaleConstraintKey,
          right.scaleConstraintKey,
        ),
      ),
    soundConstraints: [...scene.soundConstraints].sort(compareOrdered),
    fallbackLadder: [...scene.fallbackLadder],
    continuityExpectationKinds: sortContinuityKinds(
      scene.continuityExpectationKinds,
    ),
    qaExpectationCodes: sortText(scene.qaExpectationCodes),
  }
}

function sortContinuityKinds(
  kinds: LivingFrameSemanticSceneProposal['continuityExpectationKinds'],
): LivingFrameSemanticSceneProposal['continuityExpectationKinds'] {
  const remaining = kinds
    .filter((kind) => kind !== 'style_bible')
    .sort(compareText)
  return [
    'style_bible',
    ...remaining,
  ] as LivingFrameSemanticSceneProposal['continuityExpectationKinds']
}

function sortCitations<T extends { readonly evidenceRefId: string }>(
  citations: readonly T[],
): T[] {
  return [...citations].sort(
    (left, right) => compareText(
      left.evidenceRefId,
      right.evidenceRefId,
    ),
  )
}

function componentDependencyIdentity(
  dependency: LivingFrameSemanticSceneProposal[
    'componentDependencies'
  ][number],
): string {
  return [
    dependency.componentKey,
    dependency.dependsOnComponentKey,
    dependency.kind,
  ].join('\u0000')
}

function validateOrdered<T extends { readonly order: number }>(
  entries: readonly T[],
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const seen = new Set<number>()
  for (const [index, entry] of entries.entries()) {
    if (seen.has(entry.order)) {
      issues.push(issue('duplicate_order', `${path}[${index}].order`))
    }
    seen.add(entry.order)
  }
  const ordered = [...seen].sort((left, right) => left - right)
  if (ordered.some((value, index) => value !== index)) {
    issues.push(issue('semantic_order_invalid', path))
  }
}

function validateUnique<T>(
  entries: readonly T[],
  identify: (entry: T) => string,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): Set<string> {
  const values = new Set<string>()
  for (const [index, entry] of entries.entries()) {
    const value = identify(entry)
    if (values.has(value)) {
      issues.push(issue('duplicate_id', `${path}[${index}]`))
    }
    values.add(value)
  }
  return values
}

function validateUniqueText(
  entries: readonly string[],
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  const seen = new Set<string>()
  for (const [index, entry] of entries.entries()) {
    if (seen.has(entry)) {
      issues.push(issue('duplicate_reference', `${path}[${index}]`))
    }
    seen.add(entry)
  }
}

function validateUniqueEdges(
  entries: readonly string[],
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  validateUniqueText(entries, path, issues)
}

function validateCitationReferences(
  citations: readonly { readonly evidenceRefId: string }[],
  allowed: ReadonlySet<string>,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  validateUniqueText(
    citations.map((citation) => citation.evidenceRefId),
    path,
    issues,
  )
  validateReferences(
    citations.map((citation) => citation.evidenceRefId),
    allowed,
    'dangling_request_evidence_reference',
    path,
    issues,
  )
}

function validateReferences(
  entries: readonly string[],
  allowed: ReadonlySet<string>,
  code: LivingFrameSemanticSceneProposalIssueCode,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  for (const [index, entry] of entries.entries()) {
    if (!allowed.has(entry)) {
      issues.push(issue(code, `${path}[${index}]`))
    }
  }
}

function validateReference(
  entry: string,
  allowed: ReadonlySet<string>,
  code: LivingFrameSemanticSceneProposalIssueCode,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  if (!allowed.has(entry)) issues.push(issue(code, path))
}

function validateOptionalReference(
  entry: string | null,
  allowed: ReadonlySet<string>,
  code: LivingFrameSemanticSceneProposalIssueCode,
  path: string,
  issues: LivingFrameSemanticSceneProposalIssue[],
): void {
  if (entry !== null) validateReference(entry, allowed, code, path, issues)
}

function hasDirectedCycle(
  nodes: ReadonlySet<string>,
  edges: readonly (readonly [string, string])[],
): boolean {
  const outgoing = new Map<string, string[]>()
  for (const node of nodes) outgoing.set(node, [])
  for (const [from, to] of edges) {
    if (nodes.has(from) && nodes.has(to)) outgoing.get(from)?.push(to)
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true
    if (visited.has(node)) return false
    visiting.add(node)
    for (const next of outgoing.get(node) ?? []) {
      if (visit(next)) return true
    }
    visiting.delete(node)
    visited.add(node)
    return false
  }
  return [...nodes].some(visit)
}

function assertDigestSeparation(
  draft: LivingFrameSemanticSceneProposalBindingDraft,
  contractDigestSha256: string,
): void {
  const digests = [
    draft.requestContractDigestSha256,
    draft.semanticPayloadDigestSha256,
    draft.outputJsonSchemaDigestSha256,
    draft.proposalResultDigestSha256,
    ...(draft.continuityPackDigestSha256
      ? [draft.continuityPackDigestSha256]
      : []),
    contractDigestSha256,
  ]
  if (new Set(digests).size !== digests.length) {
    throw new LivingFrameSemanticSceneProposalContractError([
      issue('digest_not_separated', '$.contractDigestSha256'),
    ])
  }
}

function inspectJsonInput(
  input: unknown,
): LivingFrameSemanticSceneProposalIssue[] {
  const issues: LivingFrameSemanticSceneProposalIssue[] = []
  const seen = new Set<object>()
  const visit = (value: unknown, path: string): void => {
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
        visit(entry, `${path}[${index}]`))
      seen.delete(value)
      return
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      issues.push(issue('non_json_input', path))
      seen.delete(value)
      return
    }
    for (const [key, entry] of Object.entries(value)) {
      const childPath = path === '$' ? `$.${key}` : `${path}.${key}`
      if (FORBIDDEN_KEYS.has(key)) {
        issues.push(issue('forbidden_key', childPath))
      } else {
        visit(entry, childPath)
      }
    }
    seen.delete(value)
  }
  visit(input, '$')
  return dedupeIssues(issues)
}

async function sha256CanonicalJson(value: unknown): Promise<string> {
  const issues = inspectJsonInput(value)
  if (issues.length > 0) {
    throw new LivingFrameSemanticSceneProposalContractError(issues)
  }
  if (!globalThis.crypto?.subtle) {
    throw new LivingFrameSemanticSceneProposalContractError([
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
    throw new LivingFrameSemanticSceneProposalContractError([
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
  throw new LivingFrameSemanticSceneProposalContractError([
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

function sameTextArray(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index])
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function mapZodIssues(
  zodIssues: readonly z.core.$ZodIssue[],
  fallbackCode: LivingFrameSemanticSceneProposalIssueCode,
  prefix = '$',
): LivingFrameSemanticSceneProposalIssue[] {
  return dedupeIssues(zodIssues.map((entry) => {
    const suffix = entry.path.length > 0
      ? `.${entry.path.map(String).join('.')}`
      : ''
    return issue(fallbackCode, `${prefix}${suffix}`)
  }))
}

function issue(
  code: LivingFrameSemanticSceneProposalIssueCode,
  path: string,
): LivingFrameSemanticSceneProposalIssue {
  return { code, path }
}

function dedupeIssues(
  issues: readonly LivingFrameSemanticSceneProposalIssue[],
): LivingFrameSemanticSceneProposalIssue[] {
  const seen = new Set<string>()
  return issues.filter((entry) => {
    const identity = `${entry.code}\u0000${entry.path}`
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}
