import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ARTIFACT_FAMILIES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_CLASSES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_HYPOTHESIS_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_EVIDENCE_CLASS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_SOURCE,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_STATUS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_VERSION,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_REVIEW_GATE_CODES,
  type LivingFrameControlledIllustrationArtifactFamily,
  type LivingFrameControlledIllustrationCandidateClass,
  type LivingFrameControlledIllustrationCandidateKey,
  type LivingFrameControlledIllustrationHypothesisCode,
  type LivingFrameControlledIllustrationQualification,
  type LivingFrameControlledIllustrationQualificationAuthorityBoundary,
  type LivingFrameControlledIllustrationQualificationDraft,
  type LivingFrameControlledIllustrationReviewGateCode,
  type LivingFrameControlledIllustrationValidationIssue,
  type LivingFrameControlledIllustrationValidationIssueCode,
  type LivingFrameControlledIllustrationValidationResult,
} from '../../types/living-frame-controlled-illustration-qualification'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

const FORBIDDEN_KEYS = new Set([
  'rawChat',
  'raw_chat',
  'rawTranscript',
  'raw_transcript',
  'transcript',
  'customInstructions',
  'custom_instructions',
  'prompt',
  'systemPrompt',
  'system_prompt',
  'userPrompt',
  'user_prompt',
  'instructions',
  'chainOfThought',
  'chain_of_thought',
  'hiddenReasoning',
  'hidden_reasoning',
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
  'command',
  'script',
  'code',
  'apiKey',
  'api_key',
  'secret',
  'credentials',
  'providerId',
  'provider_id',
  'modelId',
  'model_id',
  'toolId',
  'tool_id',
  'operationId',
  'operation_id',
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
  'assetManifest',
  'asset_manifest',
  'price',
  'dollars',
  'credits',
  'serviceFee',
  'service_fee',
  'toolCost',
  'tool_cost',
  'packageName',
  'package_name',
  'packageVersion',
  'package_version',
  'checkpointId',
  'checkpoint_id',
  'containerId',
  'container_id',
  'productionAuthority',
  'production_authority',
])

const CANDIDATE_CLASS_BY_KEY: Readonly<
Record<
  LivingFrameControlledIllustrationCandidateKey,
  LivingFrameControlledIllustrationCandidateClass
>
> = {
  comfyui: 'execution_host_orchestrator',
  comfyui_controlnet_aux: 'preprocessing_bundle',
  controlnet: 'model_adapter_or_checkpoint_capability',
  ip_adapter: 'model_adapter_or_checkpoint_capability',
  auraface: 'identity_continuity_measurement_capability',
  peft_lora: 'training_or_loading_mechanism',
}

const REQUIRED_ARTIFACTS: Readonly<
Record<
  LivingFrameControlledIllustrationCandidateKey,
  readonly LivingFrameControlledIllustrationArtifactFamily[]
>
> = {
  comfyui: [
    'source_repository',
    'source_license',
    'package_dependency_lock',
    'container_image',
    'workflow_definition',
    'runtime_protocol',
    'security_configuration',
    'benchmark_fixture',
    'benchmark_result',
  ],
  comfyui_controlnet_aux: [
    'source_repository',
    'source_license',
    'copied_source_inventory',
    'copied_source_license_inventory',
    'package_dependency_lock',
    'preprocessor_checkpoint_inventory',
    'workflow_definition',
    'security_configuration',
    'benchmark_fixture',
    'benchmark_result',
  ],
  controlnet: [
    'source_repository',
    'source_license',
    'base_model',
    'model_checkpoint',
    'preprocessor_checkpoint_inventory',
    'workflow_definition',
    'benchmark_fixture',
    'benchmark_result',
  ],
  ip_adapter: [
    'source_repository',
    'source_license',
    'base_model',
    'adapter_checkpoint',
    'identity_dependency',
    'workflow_definition',
    'benchmark_fixture',
    'benchmark_result',
  ],
  auraface: [
    'source_license',
    'model_checkpoint',
    'identity_dependency',
    'training_data_rights',
    'runtime_protocol',
    'security_configuration',
    'benchmark_fixture',
    'benchmark_result',
  ],
  peft_lora: [
    'source_repository',
    'source_license',
    'base_model',
    'adapter_checkpoint',
    'training_data_rights',
    'workflow_definition',
    'security_configuration',
    'benchmark_fixture',
    'benchmark_result',
  ],
}

const COMMON_REVIEW_GATES = [
  'exact_source_version_review',
  'source_license_review',
  'exact_artifact_inventory_review',
  'commercial_use_review',
  'security_review',
  'reproducibility_review',
  'runtime_resource_review',
  'quality_benchmark_review',
  'component_separability_review',
  'alpha_quality_review',
  'independent_verification_review',
  'canonical_registry_admission_review',
  'canonical_operation_admission_review',
  'canonical_dispatch_admission_review',
] as const satisfies readonly LivingFrameControlledIllustrationReviewGateCode[]

const REQUIRED_REVIEW_GATES: Readonly<
Record<
  LivingFrameControlledIllustrationCandidateKey,
  readonly LivingFrameControlledIllustrationReviewGateCode[]
>
> = {
  comfyui: [
    ...COMMON_REVIEW_GATES,
    'arbitrary_node_or_code_review',
    'workflow_allowlist_review',
    'network_egress_review',
    'runtime_download_prohibition_review',
  ],
  comfyui_controlnet_aux: [
    ...COMMON_REVIEW_GATES,
    'copied_source_inventory_review',
    'copied_source_license_review',
    'model_weight_license_review',
    'workflow_allowlist_review',
    'runtime_download_prohibition_review',
    'pose_control_review',
  ],
  controlnet: [
    ...COMMON_REVIEW_GATES,
    'model_weight_license_review',
    'base_model_license_review',
    'runtime_download_prohibition_review',
    'pose_control_review',
    'style_control_review',
  ],
  ip_adapter: [
    ...COMMON_REVIEW_GATES,
    'model_weight_license_review',
    'base_model_license_review',
    'runtime_download_prohibition_review',
    'character_continuity_review',
    'pose_control_review',
    'style_control_review',
    'consent_review',
    'likeness_and_deepfake_review',
  ],
  auraface: [
    ...COMMON_REVIEW_GATES,
    'model_weight_license_review',
    'training_data_rights_review',
    'runtime_download_prohibition_review',
    'character_continuity_review',
    'consent_review',
    'likeness_and_deepfake_review',
    'minor_safety_review',
    'retention_review',
    'documentary_fact_safety_review',
  ],
  peft_lora: [
    ...COMMON_REVIEW_GATES,
    'model_weight_license_review',
    'base_model_license_review',
    'training_data_rights_review',
    'runtime_download_prohibition_review',
    'character_continuity_review',
    'style_control_review',
    'consent_review',
    'retention_review',
    'documentary_fact_safety_review',
  ],
}

const REQUIRED_HYPOTHESES: Readonly<
Record<
  LivingFrameControlledIllustrationCandidateKey,
  readonly LivingFrameControlledIllustrationHypothesisCode[]
>
> = {
  comfyui: [
    'host_source_labels_gpl3_pending_exact_review',
    'host_custom_nodes_create_arbitrary_code_risk',
  ],
  comfyui_controlnet_aux: [
    'copied_annotator_sources_require_independent_pin_and_license',
    'downloaded_preprocessor_checkpoints_require_independent_pin_and_license',
  ],
  controlnet: [
    'source_code_and_checkpoint_terms_are_separate',
    'adapter_terms_do_not_override_base_model_terms',
  ],
  ip_adapter: [
    'source_code_and_checkpoint_terms_are_separate',
    'base_adapter_does_not_promote_faceid_variant',
    'faceid_variant_research_only_noncommercial_due_identity_dependency',
    'adapter_terms_do_not_override_base_model_terms',
  ],
  auraface: [
    'model_card_license_label_does_not_prove_training_data_rights',
    'identity_measurement_does_not_authorize_generation_or_likeness',
    'measurement_runtime_dependencies_require_independent_qualification',
    'identity_workflow_requires_consent_likeness_and_documentary_review',
  ],
  peft_lora: [
    'adapter_terms_do_not_override_base_model_terms',
    'mechanism_terms_do_not_qualify_loaded_adapters',
  ],
}

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_AUTHORITY_BOUNDARY:
LivingFrameControlledIllustrationQualificationAuthorityBoundary = {
  controlledSourceRequirementsOnly: true,
  installationAuthority: false,
  packageAuthority: false,
  containerAuthority: false,
  modelWeightAuthority: false,
  providerAuthority: false,
  toolRegistryAuthority: false,
  operationAuthority: false,
  dispatchAuthority: false,
  planningAuthority: false,
  selectedSceneAuthority: false,
  estimateAuthority: false,
  customerPriceAuthority: false,
  customerCreditAuthority: false,
  approvalAuthority: false,
  snapshotAuthority: false,
  workGraphAuthority: false,
  queueAuthority: false,
  assetManifestAuthority: false,
  costAuthority: false,
  qaApprovalAuthority: false,
  renderAuthority: false,
  runtimeAuthority: false,
  productionReady: false,
}

const safeIdSchema = z.string().min(1).max(240)
  .regex(SAFE_ID)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const sha256Schema = z.string().regex(SHA256)
const orderSchema = z.number().int().nonnegative().max(5)

const artifactExpectationSchema = z.object({
  artifactExpectationId: safeIdSchema,
  artifactFamily: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ARTIFACT_FAMILIES,
  ),
  exactVersionRequired: z.literal(true),
  exactDigestRequired: z.literal(true),
  independentReviewRequired: z.literal(true),
  suppliedInQualification: z.literal(false),
  verifiedInQualification: z.literal(false),
}).strict()

const benchmarkExpectationSchema = z.object({
  benchmarkExpectationId: safeIdSchema,
  benchmarkCode: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES,
  ),
  measurementRequired: z.literal(true),
  measuredInQualification: z.literal(false),
  passedInQualification: z.literal(false),
}).strict()

const candidateRequirementSchema = z.object({
  candidateRequirementId: safeIdSchema,
  candidateKey: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  ),
  order: orderSchema,
  candidateClass: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_CLASSES,
  ),
  artifactExpectations: z.array(artifactExpectationSchema).min(1).max(32),
  reviewGateCodes: z.array(
    z.enum(LIVING_FRAME_CONTROLLED_ILLUSTRATION_REVIEW_GATE_CODES),
  ).min(1).max(40),
  benchmarkExpectations: z.array(benchmarkExpectationSchema).min(1).max(20),
  hypothesisCodes: z.array(
    z.enum(LIVING_FRAME_CONTROLLED_ILLUSTRATION_HYPOTHESIS_CODES),
  ).min(1).max(20),
  evaluationOnly: z.literal(true),
  installationAuthorized: z.literal(false),
  exactVersionSelected: z.literal(false),
  artifactManifestPresent: z.literal(false),
  packageOrArtifactPinned: z.literal(false),
  sourceLicenseVerified: z.literal(false),
  copiedSourceLicenseVerified: z.literal(false),
  modelWeightLicenseVerified: z.literal(false),
  baseModelLicenseVerified: z.literal(false),
  commercialUseApproved: z.literal(false),
  securityReviewPassed: z.literal(false),
  privacyReviewPassed: z.literal(false),
  benchmarkMeasured: z.literal(false),
  benchmarkPassed: z.literal(false),
  canonicalToolIdAssigned: z.literal(false),
  canonicalOperationIdAssigned: z.literal(false),
  canonicalRegistryAdmitted: z.literal(false),
  independentVerificationPassed: z.literal(false),
  dispatchAuthorized: z.literal(false),
  imageRouteQualified: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const imageCapabilityBoundarySchema = z.object({
  capabilityBoundaryCodes: z.array(
    z.enum(LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES),
  ).length(LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES.length),
  gptImage2TransparentOutputSupported: z.literal(false),
  opaqueGenerationRequired: z.literal(true),
  providerEditMaskIsProductionMatte: z.literal(false),
  qualifiedSegmentationOrMattingRequired: z.literal(true),
  edgeDecontaminationRequired: z.literal(true),
  trueAlphaArtifactRequired: z.literal(true),
  multiBackgroundQaRequired: z.literal(true),
  destinationCompositeQaRequired: z.literal(true),
  providerRuntimeQualified: z.literal(false),
  imageRouteQualified: z.literal(false),
}).strict()

const authorityBoundarySchema = z.object({
  controlledSourceRequirementsOnly: z.literal(true),
  installationAuthority: z.literal(false),
  packageAuthority: z.literal(false),
  containerAuthority: z.literal(false),
  modelWeightAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  operationAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  planningAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  costAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const livingFrameControlledIllustrationQualificationDraftSchema =
  z.object({
    contractVersion: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_VERSION,
    ),
    source: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_SOURCE,
    ),
    status: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_STATUS,
    ),
    evidenceClass: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_EVIDENCE_CLASS,
    ),
    qualificationId: safeIdSchema,
    candidateRequirements: z.array(candidateRequirementSchema).length(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS.length,
    ),
    imageCapabilityBoundary: imageCapabilityBoundarySchema,
    deterministicRouteRequiredForExactGraphics: z.literal(true),
    generatedVideoIsLastResort: z.literal(true),
    candidateSetComplete: z.literal(true),
    authorityBoundary: authorityBoundarySchema,
  }).strict()

export const livingFrameControlledIllustrationQualificationSchema =
  livingFrameControlledIllustrationQualificationDraftSchema.extend({
    qualificationDigestSha256: sha256Schema,
  }).strict()

export class LivingFrameControlledIllustrationQualificationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledIllustrationValidationIssue[]

  constructor(
    issues: readonly LivingFrameControlledIllustrationValidationIssue[],
  ) {
    super('Living Frame controlled-illustration qualification failed.')
    this.name = 'LivingFrameControlledIllustrationQualificationError'
    this.issues = issues
  }
}

export function normalizeLivingFrameControlledIllustrationQualificationDraft(
  draft: LivingFrameControlledIllustrationQualificationDraft,
): LivingFrameControlledIllustrationQualificationDraft {
  return {
    ...draft,
    candidateRequirements: [...draft.candidateRequirements]
      .sort((left, right) => left.order - right.order)
      .map((candidate) => ({
        ...candidate,
        artifactExpectations: [...candidate.artifactExpectations]
          .sort((left, right) => compareText(
            left.artifactFamily,
            right.artifactFamily,
          ))
          .map((entry) => ({ ...entry })),
        reviewGateCodes: sortText(candidate.reviewGateCodes),
        benchmarkExpectations: [...candidate.benchmarkExpectations]
          .sort((left, right) => compareText(
            left.benchmarkCode,
            right.benchmarkCode,
          ))
          .map((entry) => ({ ...entry })),
        hypothesisCodes: sortText(candidate.hypothesisCodes),
      })),
    imageCapabilityBoundary: {
      ...draft.imageCapabilityBoundary,
      capabilityBoundaryCodes: sortText(
        draft.imageCapabilityBoundary.capabilityBoundaryCodes,
      ),
    },
    authorityBoundary: { ...draft.authorityBoundary },
  }
}

export async function calculateLivingFrameControlledIllustrationQualificationDigest(
  input: unknown,
): Promise<string> {
  const normalized = parseAndValidateDraft(input)
  if (!globalThis.crypto?.subtle) {
    throw new LivingFrameControlledIllustrationQualificationError([
      issue('crypto_unavailable', '$.qualificationDigestSha256'),
    ])
  }
  try {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonicalJsonStringify(normalized)),
    )
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    throw new LivingFrameControlledIllustrationQualificationError([
      issue('digest_calculation_failed', '$.qualificationDigestSha256'),
    ])
  }
}

export async function createLivingFrameControlledIllustrationQualification(
  input: unknown,
): Promise<LivingFrameControlledIllustrationQualification> {
  const normalized = parseAndValidateDraft(input)
  return {
    ...normalized,
    qualificationDigestSha256:
      await calculateLivingFrameControlledIllustrationQualificationDigest(
        normalized,
      ),
  }
}

export async function validateLivingFrameControlledIllustrationQualification(
  input: unknown,
): Promise<LivingFrameControlledIllustrationValidationResult> {
  const preflightIssues = inspectJsonInput(input)
  if (preflightIssues.length > 0) return { ok: false, issues: preflightIssues }
  const parsed =
    livingFrameControlledIllustrationQualificationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, issues: mapZodIssues(parsed.error.issues) }
  }
  const { qualificationDigestSha256, ...draft } = parsed.data
  const normalized =
    normalizeLivingFrameControlledIllustrationQualificationDraft(draft)
  const semanticIssues = validateSemanticQualification(normalized)
  if (semanticIssues.length > 0) {
    return { ok: false, issues: semanticIssues }
  }
  let expectedDigest: string
  try {
    expectedDigest =
      await calculateLivingFrameControlledIllustrationQualificationDigest(
        normalized,
      )
  } catch (error) {
    return {
      ok: false,
      issues:
        error instanceof LivingFrameControlledIllustrationQualificationError
          ? error.issues
          : [issue(
            'digest_calculation_failed',
            '$.qualificationDigestSha256',
          )],
    }
  }
  if (qualificationDigestSha256 !== expectedDigest) {
    return {
      ok: false,
      issues: [issue(
        'digest_mismatch',
        '$.qualificationDigestSha256',
      )],
    }
  }
  return {
    ok: true,
    qualification: {
      ...normalized,
      qualificationDigestSha256: expectedDigest,
    },
    issues: [],
  }
}

function parseAndValidateDraft(
  input: unknown,
): LivingFrameControlledIllustrationQualificationDraft {
  const preflightIssues = inspectJsonInput(input)
  if (preflightIssues.length > 0) {
    throw new LivingFrameControlledIllustrationQualificationError(
      preflightIssues,
    )
  }
  const parsed =
    livingFrameControlledIllustrationQualificationDraftSchema.safeParse(input)
  if (!parsed.success) {
    throw new LivingFrameControlledIllustrationQualificationError(
      mapZodIssues(parsed.error.issues),
    )
  }
  const normalized =
    normalizeLivingFrameControlledIllustrationQualificationDraft(parsed.data)
  const semanticIssues = validateSemanticQualification(normalized)
  if (semanticIssues.length > 0) {
    throw new LivingFrameControlledIllustrationQualificationError(
      semanticIssues,
    )
  }
  return normalized
}

function validateSemanticQualification(
  draft: LivingFrameControlledIllustrationQualificationDraft,
): readonly LivingFrameControlledIllustrationValidationIssue[] {
  const issues: LivingFrameControlledIllustrationValidationIssue[] = []
  const add = (
    code: LivingFrameControlledIllustrationValidationIssueCode,
    path: string,
  ) => issues.push(issue(code, path))

  if (
    canonicalJsonStringify(draft.authorityBoundary)
    !== canonicalJsonStringify(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_AUTHORITY_BOUNDARY,
    )
  ) add('authority_promotion_forbidden', '$.authorityBoundary')

  validateUnique(
    draft.candidateRequirements.map((entry) => entry.candidateRequirementId),
    '$.candidateRequirements',
    'duplicate_id',
    add,
  )
  validateUnique(
    draft.candidateRequirements.map((entry) => entry.candidateKey),
    '$.candidateRequirements',
    'duplicate_value',
    add,
  )
  validateUnique(
    draft.candidateRequirements.map((entry) => String(entry.order)),
    '$.candidateRequirements',
    'duplicate_value',
    add,
  )

  const expectedKeys = new Set(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  )
  const actualKeys = new Set(
    draft.candidateRequirements.map((entry) => entry.candidateKey),
  )
  if (!setsEqual(actualKeys, expectedKeys)) {
    add('candidate_set_invalid', '$.candidateRequirements')
  }

  for (
    let index = 0;
    index < draft.candidateRequirements.length;
    index += 1
  ) {
    const candidate = draft.candidateRequirements[index]
    const path = `$.candidateRequirements[${index}]`
    const expectedKey =
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS[index]
    if (candidate.order !== index || candidate.candidateKey !== expectedKey) {
      add('candidate_order_invalid', path)
    }
    if (
      candidate.candidateClass !==
      CANDIDATE_CLASS_BY_KEY[candidate.candidateKey]
    ) add('candidate_class_invalid', `${path}.candidateClass`)
    if (
      candidate.candidateRequirementId !==
      `qualification.${candidate.candidateKey}`
    ) add('candidate_set_invalid', `${path}.candidateRequirementId`)

    validateCandidateRequirements(candidate, path, add)
  }

  const imageCodes = new Set(
    draft.imageCapabilityBoundary.capabilityBoundaryCodes,
  )
  if (
    !setsEqual(
      imageCodes,
      new Set(
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES,
      ),
    )
  ) {
    add(
      'image_capability_boundary_invalid',
      '$.imageCapabilityBoundary.capabilityBoundaryCodes',
    )
  }

  if (
    !draft.deterministicRouteRequiredForExactGraphics
    || !draft.generatedVideoIsLastResort
  ) add('deterministic_route_required', '$')

  return dedupeIssues(issues)
}

function validateCandidateRequirements(
  candidate: LivingFrameControlledIllustrationQualificationDraft[
    'candidateRequirements'
  ][number],
  path: string,
  add: (
    code: LivingFrameControlledIllustrationValidationIssueCode,
    path: string,
  ) => void,
): void {
  const artifactFamilies = candidate.artifactExpectations.map(
    (entry) => entry.artifactFamily,
  )
  validateUnique(
    candidate.artifactExpectations.map(
      (entry) => entry.artifactExpectationId,
    ),
    `${path}.artifactExpectations`,
    'duplicate_id',
    add,
  )
  validateUnique(
    artifactFamilies,
    `${path}.artifactExpectations`,
    'duplicate_value',
    add,
  )
  for (let index = 0; index < candidate.artifactExpectations.length; index += 1) {
    const entry = candidate.artifactExpectations[index]
    if (
      entry.artifactExpectationId !==
      `artifact.${candidate.candidateKey}.${entry.artifactFamily}`
    ) {
      add(
        'artifact_expectation_invalid',
        `${path}.artifactExpectations[${index}].artifactExpectationId`,
      )
    }
  }
  if (
    !setsEqual(
      new Set(artifactFamilies),
      new Set(REQUIRED_ARTIFACTS[candidate.candidateKey]),
    )
  ) {
    add('artifact_family_missing', `${path}.artifactExpectations`)
  }

  validateUnique(
    candidate.reviewGateCodes,
    `${path}.reviewGateCodes`,
    'duplicate_value',
    add,
  )
  if (
    !setsEqual(
      new Set(candidate.reviewGateCodes),
      new Set(REQUIRED_REVIEW_GATES[candidate.candidateKey]),
    )
  ) add('review_gate_missing', `${path}.reviewGateCodes`)

  validateUnique(
    candidate.benchmarkExpectations.map(
      (entry) => entry.benchmarkExpectationId,
    ),
    `${path}.benchmarkExpectations`,
    'duplicate_id',
    add,
  )
  validateUnique(
    candidate.benchmarkExpectations.map((entry) => entry.benchmarkCode),
    `${path}.benchmarkExpectations`,
    'duplicate_value',
    add,
  )
  for (
    let index = 0;
    index < candidate.benchmarkExpectations.length;
    index += 1
  ) {
    const entry = candidate.benchmarkExpectations[index]
    if (
      entry.benchmarkExpectationId !==
      `benchmark.${candidate.candidateKey}.${entry.benchmarkCode}`
    ) {
      add(
        'benchmark_expectation_invalid',
        `${path}.benchmarkExpectations[${index}].benchmarkExpectationId`,
      )
    }
  }
  if (
    !setsEqual(
      new Set(
        candidate.benchmarkExpectations.map((entry) => entry.benchmarkCode),
      ),
      new Set(LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES),
    )
  ) add('benchmark_expectation_invalid', `${path}.benchmarkExpectations`)

  validateUnique(
    candidate.hypothesisCodes,
    `${path}.hypothesisCodes`,
    'duplicate_value',
    add,
  )
  if (
    !setsEqual(
      new Set(candidate.hypothesisCodes),
      new Set(REQUIRED_HYPOTHESES[candidate.candidateKey]),
    )
  ) add('hypothesis_missing', `${path}.hypothesisCodes`)

  if (
    candidate.candidateKey === 'comfyui_controlnet_aux'
    && !(
      artifactFamilies.includes('copied_source_inventory')
      && artifactFamilies.includes('copied_source_license_inventory')
      && artifactFamilies.includes('preprocessor_checkpoint_inventory')
      && candidate.reviewGateCodes.includes(
        'copied_source_inventory_review',
      )
      && candidate.reviewGateCodes.includes(
        'copied_source_license_review',
      )
      && candidate.reviewGateCodes.includes(
        'model_weight_license_review',
      )
    )
  ) add('copied_source_scope_missing', path)

  if (
    ['controlnet', 'ip_adapter', 'peft_lora'].includes(
      candidate.candidateKey,
    )
    && !(
      artifactFamilies.includes('base_model')
      && candidate.reviewGateCodes.includes('base_model_license_review')
      && candidate.hypothesisCodes.includes(
        'adapter_terms_do_not_override_base_model_terms',
      )
    )
  ) add('base_model_scope_missing', path)

  if (
    candidate.candidateKey === 'controlnet'
    && !candidate.hypothesisCodes.includes(
      'source_code_and_checkpoint_terms_are_separate',
    )
  ) add('source_license_scope_collapsed', path)

  if (
    candidate.candidateKey === 'ip_adapter'
    && !(
      candidate.hypothesisCodes.includes(
        'base_adapter_does_not_promote_faceid_variant',
      )
      && candidate.hypothesisCodes.includes(
        'faceid_variant_research_only_noncommercial_due_identity_dependency',
      )
    )
  ) add('identity_safety_gate_missing', path)

  if (
    candidate.candidateKey === 'auraface'
    && !(
      candidate.hypothesisCodes.includes(
        'model_card_license_label_does_not_prove_training_data_rights',
      )
      && candidate.hypothesisCodes.includes(
        'identity_measurement_does_not_authorize_generation_or_likeness',
      )
      && candidate.hypothesisCodes.includes(
        'measurement_runtime_dependencies_require_independent_qualification',
      )
      && [
        'consent_review',
        'likeness_and_deepfake_review',
        'minor_safety_review',
        'retention_review',
        'documentary_fact_safety_review',
      ].every((gate) => candidate.reviewGateCodes.includes(
        gate as LivingFrameControlledIllustrationReviewGateCode,
      ))
    )
  ) add('identity_safety_gate_missing', path)
}

function inspectJsonInput(
  input: unknown,
): readonly LivingFrameControlledIllustrationValidationIssue[] {
  const issues: LivingFrameControlledIllustrationValidationIssue[] = []
  const seen = new Set<object>()
  const visit = (value: unknown, path: string): void => {
    if (
      value === undefined
      || typeof value === 'bigint'
      || typeof value === 'function'
      || typeof value === 'symbol'
      || typeof value === 'number' && !Number.isFinite(value)
    ) {
      issues.push(issue('non_json_input', path))
      return
    }
    if (value === null || typeof value !== 'object') return
    if (seen.has(value)) {
      issues.push(issue('non_json_input', path))
      return
    }
    seen.add(value)
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`))
      return
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      issues.push(issue('non_json_input', path))
      return
    }
    for (const [key, entry] of Object.entries(value)) {
      const childPath = `${path}.${key}`
      if (FORBIDDEN_KEYS.has(key)) {
        issues.push(issue('forbidden_key', childPath))
      } else visit(entry, childPath)
    }
  }
  visit(input, '$')
  return dedupeIssues(issues)
}

function mapZodIssues(
  zodIssues: readonly z.ZodIssue[],
): readonly LivingFrameControlledIllustrationValidationIssue[] {
  return dedupeIssues(zodIssues.map((entry) => {
    const path = zodIssuePath(entry)
    const code: LivingFrameControlledIllustrationValidationIssueCode =
      path.startsWith('$.authorityBoundary.')
        ? 'authority_promotion_forbidden'
        : path === '$.imageCapabilityBoundary.capabilityBoundaryCodes'
          ? 'image_capability_boundary_invalid'
        : [
          '$.deterministicRouteRequiredForExactGraphics',
          '$.generatedVideoIsLastResort',
        ].includes(path)
          ? 'deterministic_route_required'
        : isQualificationPromotionPath(path)
          ? 'qualification_promotion_forbidden'
          : 'schema_rejected'
    return issue(code, path)
  }))
}

function zodIssuePath(entry: z.ZodIssue): string {
  return entry.path.reduce<string>((path, part) =>
    typeof part === 'number' ? `${path}[${part}]` : `${path}.${String(part)}`, '$')
}

function isQualificationPromotionPath(path: string): boolean {
  return [
    '.installationAuthorized',
    '.exactVersionSelected',
    '.artifactManifestPresent',
    '.packageOrArtifactPinned',
    '.sourceLicenseVerified',
    '.copiedSourceLicenseVerified',
    '.modelWeightLicenseVerified',
    '.baseModelLicenseVerified',
    '.commercialUseApproved',
    '.securityReviewPassed',
    '.privacyReviewPassed',
    '.benchmarkMeasured',
    '.benchmarkPassed',
    '.canonicalToolIdAssigned',
    '.canonicalOperationIdAssigned',
    '.canonicalRegistryAdmitted',
    '.independentVerificationPassed',
    '.dispatchAuthorized',
    '.imageRouteQualified',
    '.productionReady',
    '.measuredInQualification',
    '.passedInQualification',
    '.suppliedInQualification',
    '.verifiedInQualification',
    '.gptImage2TransparentOutputSupported',
    '.providerEditMaskIsProductionMatte',
    '.providerRuntimeQualified',
  ].some((suffix) => path.endsWith(suffix))
}

function validateUnique(
  values: readonly string[],
  path: string,
  code: 'duplicate_id' | 'duplicate_value',
  add: (
    code: LivingFrameControlledIllustrationValidationIssueCode,
    path: string,
  ) => void,
): void {
  if (new Set(values).size !== values.length) add(code, path)
}

function setsEqual<T>(
  left: ReadonlySet<T>,
  right: ReadonlySet<T>,
): boolean {
  return left.size === right.size && [...left].every((entry) => right.has(entry))
}

function issue(
  code: LivingFrameControlledIllustrationValidationIssueCode,
  path: string,
): LivingFrameControlledIllustrationValidationIssue {
  return { code, path }
}

function dedupeIssues(
  issues: readonly LivingFrameControlledIllustrationValidationIssue[],
): readonly LivingFrameControlledIllustrationValidationIssue[] {
  const seen = new Set<string>()
  return issues.filter((entry) => {
    const key = `${entry.code}:${entry.path}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function canonicalJsonStringify(value: unknown): string {
  const stringify = (entry: unknown): string => {
    if (entry === null) return 'null'
    if (typeof entry === 'string' || typeof entry === 'boolean') {
      return JSON.stringify(entry)
    }
    if (typeof entry === 'number') {
      if (!Number.isFinite(entry)) throw new TypeError('Non-JSON number.')
      return JSON.stringify(entry)
    }
    if (Array.isArray(entry)) {
      return `[${entry.map((item) => stringify(item)).join(',')}]`
    }
    if (typeof entry === 'object') {
      const record = entry as Record<string, unknown>
      return `{${Object.keys(record).sort().map(
        (key) => `${JSON.stringify(key)}:${stringify(record[key])}`,
      ).join(',')}}`
    }
    throw new TypeError('Non-JSON value.')
  }
  return stringify(value)
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function sortText<T extends string>(values: readonly T[]): T[] {
  return [...values].sort(compareText)
}
