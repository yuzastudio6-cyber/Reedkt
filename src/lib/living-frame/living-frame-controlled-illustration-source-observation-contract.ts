import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ARTIFACT_FAMILIES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_CLASSES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_REVIEW_GATE_CODES,
  type LivingFrameControlledIllustrationCandidateClass,
  type LivingFrameControlledIllustrationCandidateKey,
  type LivingFrameControlledIllustrationQualification,
} from '../../types/living-frame-controlled-illustration-qualification'
import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_DECLARED_LABEL_OBSERVATIONS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_DEPENDENCY_SCOPE_RULE_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_DOCUMENT_CLASSES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_DOCUMENT_PATH_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_OBSERVATION_DISPOSITIONS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_CLASSES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_LOCATOR_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_EVIDENCE_CLASS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_SOURCE,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_STATUS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_VERSION,
  type LivingFrameControlledIllustrationCandidateSourceObservation,
  type LivingFrameControlledIllustrationDependencyScopeRule,
  type LivingFrameControlledIllustrationDependencyScopeRuleCode,
  type LivingFrameControlledIllustrationDocumentClass,
  type LivingFrameControlledIllustrationDocumentPathCode,
  type LivingFrameControlledIllustrationDeclaredLabelObservation,
  type LivingFrameControlledIllustrationObservationDisposition,
  type LivingFrameControlledIllustrationSourceClass,
  type LivingFrameControlledIllustrationSourceLocatorCode,
  type LivingFrameControlledIllustrationSourceObservationAuthorityBoundary,
  type LivingFrameControlledIllustrationSourceObservationIssue,
  type LivingFrameControlledIllustrationSourceObservationIssueCode,
  type LivingFrameControlledIllustrationSourceObservationPacket,
  type LivingFrameControlledIllustrationSourceObservationPacketDraft,
  type LivingFrameControlledIllustrationSourceObservationValidationResult,
} from '../../types/living-frame-controlled-illustration-source-observation'
import {
  validateLivingFrameControlledIllustrationQualification,
} from './living-frame-controlled-illustration-qualification-contract'

const SHA1 = /^[a-f0-9]{40}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u
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
  'chainOfThought',
  'chain_of_thought',
  'hiddenReasoning',
  'hidden_reasoning',
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
  'packageName',
  'package_name',
  'packageVersion',
  'package_version',
  'containerId',
  'container_id',
  'price',
  'dollars',
  'credits',
  'serviceFee',
  'service_fee',
  'toolCost',
  'tool_cost',
])

const safeIdSchema = z.string().trim().regex(SAFE_ID)
const sha1Schema = z.string().regex(SHA1)
const sha256Schema = z.string().regex(SHA256)
const dateOnlySchema = z.string().regex(DATE_ONLY).refine(isValidDateOnly)

const CANDIDATE_CLASS_BY_KEY = {
  comfyui: 'execution_host_orchestrator',
  comfyui_controlnet_aux: 'preprocessing_bundle',
  controlnet: 'model_adapter_or_checkpoint_capability',
  ip_adapter: 'model_adapter_or_checkpoint_capability',
  pulid: 'identity_adapter_or_checkpoint_capability',
  peft_lora: 'training_or_loading_mechanism',
} as const satisfies Readonly<
  Record<
    LivingFrameControlledIllustrationCandidateKey,
    LivingFrameControlledIllustrationCandidateClass
  >
>

const CANDIDATE_DISPOSITION_BY_KEY = {
  comfyui: 'candidate_source_only',
  comfyui_controlnet_aux: 'dependency_scope_unresolved',
  controlnet: 'dependency_scope_unresolved',
  ip_adapter: 'dependency_scope_unresolved',
  pulid: 'noncommercial_route_blocked',
  peft_lora: 'mechanism_only_no_loaded_artifact',
} as const satisfies Readonly<
  Record<
    LivingFrameControlledIllustrationCandidateKey,
    LivingFrameControlledIllustrationObservationDisposition
  >
>

interface SourceSpec {
  readonly locator:
    LivingFrameControlledIllustrationSourceLocatorCode
  readonly sourceClass: LivingFrameControlledIllustrationSourceClass
  readonly documentClass: LivingFrameControlledIllustrationDocumentClass
  readonly pathCode: LivingFrameControlledIllustrationDocumentPathCode
  readonly declaredLabel:
    LivingFrameControlledIllustrationDeclaredLabelObservation
}

const SOURCE_SPECS_BY_CANDIDATE = {
  comfyui: [
    sourceSpec(
      'github_comfy_org_comfyui',
      'source_repository',
      'source_license',
      'license_file',
      'gpl_3_0_source_label',
    ),
  ],
  comfyui_controlnet_aux: [
    sourceSpec(
      'github_fannovel16_comfyui_controlnet_aux',
      'source_repository',
      'source_license',
      'license_txt_file',
      'apache_2_0_source_label',
    ),
  ],
  controlnet: [
    sourceSpec(
      'github_lllyasviel_controlnet',
      'source_repository',
      'source_license',
      'license_file',
      'apache_2_0_source_label',
    ),
    sourceSpec(
      'hf_lllyasviel_controlnet_v1_1',
      'model_repository',
      'model_card',
      'readme_model_card',
      'openrail_model_card_label',
    ),
  ],
  ip_adapter: [
    sourceSpec(
      'github_tencent_ailab_ip_adapter',
      'source_repository',
      'source_license',
      'license_file',
      'apache_2_0_source_label',
    ),
    sourceSpec(
      'hf_h94_ip_adapter',
      'model_repository',
      'model_card',
      'readme_model_card',
      'apache_2_0_source_label',
    ),
    sourceSpec(
      'hf_h94_ip_adapter_faceid',
      'model_repository',
      'model_card',
      'readme_model_card',
      'research_only_noncommercial_model_card_statement',
    ),
    sourceSpec(
      'github_deepinsight_insightface',
      'source_repository',
      'model_card',
      'readme_model_card',
      'research_only_noncommercial_model_card_statement',
    ),
  ],
  pulid: [
    sourceSpec(
      'github_to_the_beginning_pulid',
      'source_repository',
      'source_license',
      'license_file',
      'apache_2_0_source_label',
    ),
    sourceSpec(
      'hf_guozinan_pulid',
      'model_repository',
      'model_card',
      'readme_model_card',
      'apache_2_0_source_label',
    ),
    sourceSpec(
      'hf_black_forest_labs_flux_1_dev',
      'model_repository',
      'model_card',
      'readme_model_card',
      'gated_other_license_model_card',
    ),
    sourceSpec(
      'github_deepinsight_insightface',
      'source_repository',
      'model_card',
      'readme_model_card',
      'research_only_noncommercial_model_card_statement',
    ),
  ],
  peft_lora: [
    sourceSpec(
      'github_huggingface_peft',
      'source_repository',
      'source_license',
      'license_file',
      'apache_2_0_source_label',
    ),
  ],
} as const satisfies Readonly<
  Record<
    LivingFrameControlledIllustrationCandidateKey,
    readonly SourceSpec[]
  >
>

interface DependencyRuleSpec {
  readonly candidateKeys:
    readonly LivingFrameControlledIllustrationCandidateKey[]
  readonly sourceLocatorCodes:
    readonly LivingFrameControlledIllustrationSourceLocatorCode[]
}

const DEPENDENCY_RULE_SPECS = {
  aux_copied_annotators_require_independent_admission: {
    candidateKeys: ['comfyui_controlnet_aux'],
    sourceLocatorCodes: ['github_fannovel16_comfyui_controlnet_aux'],
  },
  aux_checkpoints_require_independent_admission: {
    candidateKeys: ['comfyui_controlnet_aux'],
    sourceLocatorCodes: ['github_fannovel16_comfyui_controlnet_aux'],
  },
  controlnet_code_weights_and_base_model_are_separate: {
    candidateKeys: ['controlnet'],
    sourceLocatorCodes: [
      'github_lllyasviel_controlnet',
      'hf_lllyasviel_controlnet_v1_1',
    ],
  },
  ip_adapter_generic_does_not_promote_faceid: {
    candidateKeys: ['ip_adapter'],
    sourceLocatorCodes: [
      'hf_h94_ip_adapter',
      'hf_h94_ip_adapter_faceid',
    ],
  },
  faceid_insightface_route_is_noncommercial_blocked: {
    candidateKeys: ['ip_adapter'],
    sourceLocatorCodes: [
      'hf_h94_ip_adapter_faceid',
      'github_deepinsight_insightface',
    ],
  },
  pulid_adapter_does_not_promote_flux_base_model: {
    candidateKeys: ['pulid'],
    sourceLocatorCodes: [
      'hf_guozinan_pulid',
      'hf_black_forest_labs_flux_1_dev',
    ],
  },
  pulid_insightface_identity_dependency_is_unresolved: {
    candidateKeys: ['pulid'],
    sourceLocatorCodes: [
      'hf_guozinan_pulid',
      'github_deepinsight_insightface',
    ],
  },
  peft_does_not_qualify_loaded_adapter_data_or_base_model: {
    candidateKeys: ['peft_lora'],
    sourceLocatorCodes: ['github_huggingface_peft'],
  },
} as const satisfies Readonly<
  Record<
    LivingFrameControlledIllustrationDependencyScopeRuleCode,
    DependencyRuleSpec
  >
>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_AUTHORITY_BOUNDARY =
  Object.freeze({
    controlledUpstreamObservationOnly: true,
    currentSourceAuthority: false,
    releasedEvidenceAuthority: false,
    legalReviewAuthority: false,
    commercialUseAuthority: false,
    redistributionAuthority: false,
    packageAuthority: false,
    containerAuthority: false,
    modelWeightAuthority: false,
    artifactManifestAuthority: false,
    installationAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    planningAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  } as const satisfies
    LivingFrameControlledIllustrationSourceObservationAuthorityBoundary)

const documentObservationSchema = z.object({
  documentObservationId: safeIdSchema,
  order: z.number().int().nonnegative().max(32),
  documentClass: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_DOCUMENT_CLASSES,
  ),
  relativeDocumentPathCode: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_DOCUMENT_PATH_CODES,
  ),
  observedContentDigestSha256: sha256Schema,
  declaredLabelObservation: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_DECLARED_LABEL_OBSERVATIONS,
  ),
  observedOnDate: dateOnlySchema,
  controlledDocumentObservationOnly: z.literal(true),
  independentSourceReReadRequired: z.literal(true),
  currentTruthAuthority: z.literal(false),
  releasedEvidence: z.literal(false),
  legalInterpretationProvided: z.literal(false),
  commercialApprovalProvided: z.literal(false),
  redistributionApprovalProvided: z.literal(false),
  modelWeightApprovalProvided: z.literal(false),
}).strict()

const upstreamSourceObservationSchema = z.object({
  sourceObservationId: safeIdSchema,
  order: z.number().int().nonnegative().max(32),
  sourceLocatorCode: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_LOCATOR_CODES,
  ),
  sourceClass: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_CLASSES,
  ),
  observedImmutableRevisionSha1: sha1Schema,
  observedOnDate: dateOnlySchema,
  declaredDocumentObservations: z.array(documentObservationSchema)
    .min(1).max(8),
  controlledSourceObservationOnly: z.literal(true),
  independentSourceReReadRequired: z.literal(true),
  currentSourceAuthority: z.literal(false),
  releasedEvidence: z.literal(false),
  artifactBytesFetched: z.literal(false),
  artifactChecksumIndependentlyVerified: z.literal(false),
  sourceLicenseLegallyReviewed: z.literal(false),
  commercialUseApproved: z.literal(false),
  redistributionApproved: z.literal(false),
  canonicalModelWeightManifestApproved: z.literal(false),
  installationAuthorized: z.literal(false),
  dispatchAuthorized: z.literal(false),
  runtimeAuthorized: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const candidateObservationSchema = z.object({
  candidateObservationId: safeIdSchema,
  order: z.number().int().nonnegative().max(16),
  candidateKey: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  ),
  candidateClass: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_CLASSES,
  ),
  disposition: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_OBSERVATION_DISPOSITIONS,
  ),
  sourceObservations: z.array(upstreamSourceObservationSchema).min(1).max(12),
  unresolvedArtifactFamilyCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ARTIFACT_FAMILIES,
  )).min(1).max(32),
  requiredReviewGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_REVIEW_GATE_CODES,
  )).min(1).max(64),
  controlledObservationOnly: z.literal(true),
  evaluationOnly: z.literal(true),
  exactArtifactInventoryPresent: z.literal(false),
  dependencyClosurePresent: z.literal(false),
  packageOrArtifactPinnedForRuntime: z.literal(false),
  sourceLicenseVerified: z.literal(false),
  copiedSourceLicenseVerified: z.literal(false),
  modelWeightLicenseVerified: z.literal(false),
  baseModelLicenseVerified: z.literal(false),
  trainingDataRightsVerified: z.literal(false),
  commercialUseApproved: z.literal(false),
  securityReviewPassed: z.literal(false),
  privacyReviewPassed: z.literal(false),
  benchmarkMeasured: z.literal(false),
  benchmarkPassed: z.literal(false),
  canonicalRegistryAdmitted: z.literal(false),
  canonicalOperationAdmitted: z.literal(false),
  dispatchAuthorized: z.literal(false),
  runtimeAuthorized: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const dependencyScopeRuleSchema = z.object({
  dependencyScopeRuleId: safeIdSchema,
  ruleCode: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_DEPENDENCY_SCOPE_RULE_CODES,
  ),
  affectedCandidateKeys: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  )).min(1).max(6),
  relatedSourceLocatorCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_LOCATOR_CODES,
  )).min(1).max(12),
  unresolved: z.literal(true),
  independentArtifactAdmissionRequired: z.literal(true),
  promotionAllowed: z.literal(false),
  legalOrCommercialConclusionProvided: z.literal(false),
}).strict()

const authorityBoundarySchema = z.object({
  controlledUpstreamObservationOnly: z.literal(true),
  currentSourceAuthority: z.literal(false),
  releasedEvidenceAuthority: z.literal(false),
  legalReviewAuthority: z.literal(false),
  commercialUseAuthority: z.literal(false),
  redistributionAuthority: z.literal(false),
  packageAuthority: z.literal(false),
  containerAuthority: z.literal(false),
  modelWeightAuthority: z.literal(false),
  artifactManifestAuthority: z.literal(false),
  installationAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  operationAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  planningAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerCommercialAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const livingFrameControlledIllustrationSourceObservationPacketDraftSchema =
  z.object({
    contractVersion: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_VERSION,
    ),
    contractSource: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_SOURCE,
    ),
    status: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_STATUS,
    ),
    evidenceClass: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_EVIDENCE_CLASS,
    ),
    observationPacketId: safeIdSchema,
    observedOnDate: dateOnlySchema,
    qualificationContractDigestSha256: sha256Schema,
    candidateObservations: z.array(candidateObservationSchema).length(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS.length,
    ),
    dependencyScopeRules: z.array(dependencyScopeRuleSchema).length(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_DEPENDENCY_SCOPE_RULE_CODES.length,
    ),
    authorityBoundary: authorityBoundarySchema,
  }).strict()

export const livingFrameControlledIllustrationSourceObservationPacketSchema =
  livingFrameControlledIllustrationSourceObservationPacketDraftSchema.extend({
    observationPacketDigestSha256: sha256Schema,
  }).strict()

export class LivingFrameControlledIllustrationSourceObservationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledIllustrationSourceObservationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledIllustrationSourceObservationIssue[],
  ) {
    super('Living Frame controlled-illustration source observation failed.')
    this.name =
      'LivingFrameControlledIllustrationSourceObservationError'
    this.issues = issues
  }
}

export interface CreateLivingFrameControlledIllustrationSourceObservationInput {
  readonly qualification: LivingFrameControlledIllustrationQualification
  readonly draft:
    LivingFrameControlledIllustrationSourceObservationPacketDraft
}

export async function createLivingFrameControlledIllustrationSourceObservation(
  input: CreateLivingFrameControlledIllustrationSourceObservationInput,
): Promise<LivingFrameControlledIllustrationSourceObservationPacket> {
  const normalized = await validateAndNormalizeDraft(
    input.draft,
    input.qualification,
  )
  const observationPacketDigestSha256 =
    await calculateLivingFrameControlledIllustrationSourceObservationDigest(
      normalized,
    )
  return livingFrameControlledIllustrationSourceObservationPacketSchema.parse({
    ...normalized,
    observationPacketDigestSha256,
  }) as LivingFrameControlledIllustrationSourceObservationPacket
}

export async function calculateLivingFrameControlledIllustrationSourceObservationDigest(
  draft: LivingFrameControlledIllustrationSourceObservationPacketDraft,
): Promise<string> {
  const parsed =
    livingFrameControlledIllustrationSourceObservationPacketDraftSchema.safeParse(
      draft,
    )
  if (!parsed.success) {
    throw new LivingFrameControlledIllustrationSourceObservationError(
      mapZodIssues(parsed.error.issues),
    )
  }
  return sha256CanonicalJson(
    normalizeLivingFrameControlledIllustrationSourceObservationDraft(
      parsed.data as
        LivingFrameControlledIllustrationSourceObservationPacketDraft,
    ),
  )
}

export async function validateLivingFrameControlledIllustrationSourceObservation(
  input: unknown,
  qualification: LivingFrameControlledIllustrationQualification,
): Promise<
  LivingFrameControlledIllustrationSourceObservationValidationResult
> {
  const inspectionIssues = inspectJsonInput(input)
  if (inspectionIssues.length > 0) {
    return { ok: false, issues: inspectionIssues }
  }
  const parsed =
    livingFrameControlledIllustrationSourceObservationPacketSchema.safeParse(
      input,
    )
  if (!parsed.success) {
    return {
      ok: false,
      issues: dedupeIssues(mapZodIssues(parsed.error.issues)),
    }
  }
  try {
    const packet =
      parsed.data as LivingFrameControlledIllustrationSourceObservationPacket
    const { observationPacketDigestSha256, ...draft } = packet
    const normalized = await validateAndNormalizeDraft(draft, qualification)
    const expectedDigest =
      await calculateLivingFrameControlledIllustrationSourceObservationDigest(
        normalized,
      )
    if (observationPacketDigestSha256 !== expectedDigest) {
      return {
        ok: false,
        issues: [{
          code: 'digest_mismatch',
          path: '$.observationPacketDigestSha256',
        }],
      }
    }
    return {
      ok: true,
      packet: livingFrameControlledIllustrationSourceObservationPacketSchema
        .parse({
          ...normalized,
          observationPacketDigestSha256,
        }) as LivingFrameControlledIllustrationSourceObservationPacket,
      issues: [],
    }
  } catch (error) {
    return {
      ok: false,
      issues: error instanceof
        LivingFrameControlledIllustrationSourceObservationError
        ? error.issues
        : [{
            code: 'digest_calculation_failed',
            path: '$',
          }],
    }
  }
}

export function normalizeLivingFrameControlledIllustrationSourceObservationDraft(
  draft: LivingFrameControlledIllustrationSourceObservationPacketDraft,
): LivingFrameControlledIllustrationSourceObservationPacketDraft {
  return {
    ...draft,
    candidateObservations: [...draft.candidateObservations]
      .sort(compareOrdered)
      .map((candidate) => ({
        ...candidate,
        sourceObservations: [...candidate.sourceObservations]
          .sort(compareOrdered)
          .map((source) => ({
            ...source,
            declaredDocumentObservations: [
              ...source.declaredDocumentObservations,
            ].sort(compareOrdered),
          })),
        unresolvedArtifactFamilyCodes:
          sortText(candidate.unresolvedArtifactFamilyCodes),
        requiredReviewGateCodes:
          sortText(candidate.requiredReviewGateCodes),
      })),
    dependencyScopeRules: [...draft.dependencyScopeRules]
      .sort((left, right) => left.ruleCode.localeCompare(right.ruleCode))
      .map((rule) => ({
        ...rule,
        affectedCandidateKeys: sortText(rule.affectedCandidateKeys),
        relatedSourceLocatorCodes:
          sortText(rule.relatedSourceLocatorCodes),
      })),
  }
}

async function validateAndNormalizeDraft(
  input: unknown,
  qualification: LivingFrameControlledIllustrationQualification,
): Promise<LivingFrameControlledIllustrationSourceObservationPacketDraft> {
  const issues = inspectJsonInput(input)
  const qualificationValidation =
    await validateLivingFrameControlledIllustrationQualification(qualification)
  if (!qualificationValidation.ok) {
    issues.push({ code: 'qualification_invalid', path: '$.qualification' })
  }
  const parsed =
    livingFrameControlledIllustrationSourceObservationPacketDraftSchema
      .safeParse(input)
  if (!parsed.success) {
    issues.push(...mapZodIssues(parsed.error.issues))
  }
  if (!parsed.success || !qualificationValidation.ok) {
    throw new LivingFrameControlledIllustrationSourceObservationError(
      dedupeIssues(issues),
    )
  }

  const draft =
    parsed.data as
      LivingFrameControlledIllustrationSourceObservationPacketDraft
  const verifiedQualification = qualificationValidation.qualification
  if (
    draft.qualificationContractDigestSha256 !==
      verifiedQualification.qualificationDigestSha256
  ) {
    issues.push({
      code: 'qualification_digest_mismatch',
      path: '$.qualificationContractDigestSha256',
    })
  }
  validateCandidates(draft, verifiedQualification, issues)
  validateDependencyRules(draft.dependencyScopeRules, issues)
  validateUniqueIds(draft, issues)
  if (issues.length > 0) {
    throw new LivingFrameControlledIllustrationSourceObservationError(
      dedupeIssues(issues),
    )
  }
  return normalizeLivingFrameControlledIllustrationSourceObservationDraft(
    draft,
  )
}

function validateCandidates(
  draft: LivingFrameControlledIllustrationSourceObservationPacketDraft,
  qualification: LivingFrameControlledIllustrationQualification,
  issues: LivingFrameControlledIllustrationSourceObservationIssue[],
): void {
  const orderedCandidates = [...draft.candidateObservations]
    .sort(compareOrdered)
  const observedKeys = orderedCandidates.map(
    (candidate) => candidate.candidateKey,
  )
  if (
    !sameOrderedValues(
      observedKeys,
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
    )
  ) {
    issues.push({
      code: 'candidate_set_invalid',
      path: '$.candidateObservations',
    })
  }
  if (
    orderedCandidates.some(
      (candidate) => candidate.order !==
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS
          .indexOf(candidate.candidateKey),
    )
  ) {
    issues.push({
      code: 'candidate_order_invalid',
      path: '$.candidateObservations',
    })
  }
  for (const [index, candidate] of orderedCandidates.entries()) {
    const path = `$.candidateObservations[${index}]`
    if (
      candidate.candidateClass !==
        CANDIDATE_CLASS_BY_KEY[candidate.candidateKey]
    ) {
      issues.push({ code: 'candidate_class_invalid', path })
    }
    if (
      candidate.disposition !==
        CANDIDATE_DISPOSITION_BY_KEY[candidate.candidateKey]
    ) {
      issues.push({ code: 'candidate_disposition_invalid', path })
    }
    validateSourceSet(candidate, draft.observedOnDate, path, issues)
    const qualificationCandidate = qualification.candidateRequirements.find(
      (entry) => entry.candidateKey === candidate.candidateKey,
    )
    if (!qualificationCandidate) {
      issues.push({ code: 'qualification_invalid', path })
      continue
    }
    const expectedArtifacts = qualificationCandidate.artifactExpectations
      .map((entry) => entry.artifactFamily)
    if (
      !sameSetValues(
        candidate.unresolvedArtifactFamilyCodes,
        expectedArtifacts,
      )
    ) {
      issues.push({ code: 'artifact_scope_invalid', path })
    }
    if (
      !sameSetValues(
        candidate.requiredReviewGateCodes,
        qualificationCandidate.reviewGateCodes,
      )
    ) {
      issues.push({ code: 'review_gate_scope_invalid', path })
    }
  }
}

function validateSourceSet(
  candidate: LivingFrameControlledIllustrationCandidateSourceObservation,
  packetDate: string,
  path: string,
  issues: LivingFrameControlledIllustrationSourceObservationIssue[],
): void {
  const specs = SOURCE_SPECS_BY_CANDIDATE[candidate.candidateKey]
  const orderedSources = [...candidate.sourceObservations]
    .sort(compareOrdered)
  if (
    !sameOrderedValues(
      orderedSources.map((source) => source.sourceLocatorCode),
      specs.map((spec) => spec.locator),
    )
  ) {
    issues.push({ code: 'source_set_invalid', path: `${path}.sourceObservations` })
  }
  if (
    orderedSources.some(
      (source) => source.order !== specs.findIndex(
        (spec) => spec.locator === source.sourceLocatorCode,
      ),
    )
  ) {
    issues.push({
      code: 'source_order_invalid',
      path: `${path}.sourceObservations`,
    })
  }
  for (const [sourceIndex, source] of orderedSources.entries()) {
    const sourcePath = `${path}.sourceObservations[${sourceIndex}]`
    const spec = specs[sourceIndex]
    if (
      !spec ||
      source.sourceLocatorCode !== spec.locator ||
      source.sourceClass !== spec.sourceClass
    ) {
      issues.push({ code: 'source_scope_invalid', path: sourcePath })
      continue
    }
    if (!SHA1.test(source.observedImmutableRevisionSha1)) {
      issues.push({ code: 'source_revision_invalid', path: sourcePath })
    }
    if (source.observedOnDate !== packetDate) {
      issues.push({ code: 'observation_date_invalid', path: sourcePath })
    }
    if (
      source.declaredDocumentObservations.length !== 1 ||
      source.declaredDocumentObservations[0]?.order !== 0
    ) {
      issues.push({ code: 'document_set_invalid', path: sourcePath })
      continue
    }
    const document = source.declaredDocumentObservations[0]
    if (
      document.documentClass !== spec.documentClass ||
      document.relativeDocumentPathCode !== spec.pathCode ||
      document.declaredLabelObservation !== spec.declaredLabel
    ) {
      issues.push({ code: 'document_scope_invalid', path: sourcePath })
    }
    if (document.observedOnDate !== packetDate) {
      issues.push({ code: 'observation_date_invalid', path: sourcePath })
    }
  }
}

function validateDependencyRules(
  rules: readonly LivingFrameControlledIllustrationDependencyScopeRule[],
  issues: LivingFrameControlledIllustrationSourceObservationIssue[],
): void {
  const observedCodes = rules.map((rule) => rule.ruleCode).sort()
  const expectedCodes = [
    ...LIVING_FRAME_CONTROLLED_ILLUSTRATION_DEPENDENCY_SCOPE_RULE_CODES,
  ].sort()
  if (!sameOrderedValues(observedCodes, expectedCodes)) {
    issues.push({
      code: 'dependency_rule_set_invalid',
      path: '$.dependencyScopeRules',
    })
  }
  for (const [index, rule] of rules.entries()) {
    const spec = DEPENDENCY_RULE_SPECS[rule.ruleCode]
    const path = `$.dependencyScopeRules[${index}]`
    if (
      !spec ||
      !sameSetValues(rule.affectedCandidateKeys, spec.candidateKeys) ||
      !sameSetValues(
        rule.relatedSourceLocatorCodes,
        spec.sourceLocatorCodes,
      )
    ) {
      issues.push({
        code: dependencyScopeIssueCode(rule.ruleCode),
        path,
      })
    }
  }
}

function dependencyScopeIssueCode(
  code: LivingFrameControlledIllustrationDependencyScopeRuleCode,
): LivingFrameControlledIllustrationSourceObservationIssueCode {
  if (code.includes('faceid')) return 'faceid_promotion_forbidden'
  if (code.includes('pulid')) return 'pulid_flux_promotion_forbidden'
  if (code.includes('peft')) return 'loaded_adapter_promotion_forbidden'
  return 'dependency_scope_collapse_forbidden'
}

function validateUniqueIds(
  draft: LivingFrameControlledIllustrationSourceObservationPacketDraft,
  issues: LivingFrameControlledIllustrationSourceObservationIssue[],
): void {
  const ids = [
    draft.observationPacketId,
    ...draft.candidateObservations.flatMap((candidate) => [
      candidate.candidateObservationId,
      ...candidate.sourceObservations.flatMap((source) => [
        source.sourceObservationId,
        ...source.declaredDocumentObservations.map(
          (document) => document.documentObservationId,
        ),
      ]),
    ]),
    ...draft.dependencyScopeRules.map(
      (rule) => rule.dependencyScopeRuleId,
    ),
  ]
  if (new Set(ids).size !== ids.length) {
    issues.push({ code: 'duplicate_id', path: '$' })
  }
  for (const candidate of draft.candidateObservations) {
    if (
      new Set(candidate.unresolvedArtifactFamilyCodes).size !==
        candidate.unresolvedArtifactFamilyCodes.length ||
      new Set(candidate.requiredReviewGateCodes).size !==
        candidate.requiredReviewGateCodes.length
    ) {
      issues.push({
        code: 'duplicate_value',
        path: `$.candidateObservations.${candidate.candidateKey}`,
      })
    }
  }
}

function mapZodIssues(
  zodIssues: readonly z.ZodIssue[],
): LivingFrameControlledIllustrationSourceObservationIssue[] {
  return zodIssues.map((issue) => {
    const path = zodPath(issue.path)
    return {
      code: zodIssueCode(path, issue),
      path,
    }
  })
}

function zodIssueCode(
  path: string,
  issue: z.ZodIssue,
): LivingFrameControlledIllustrationSourceObservationIssueCode {
  if (path.includes('observedImmutableRevisionSha1')) {
    return 'source_revision_invalid'
  }
  if (path.includes('observedContentDigestSha256')) {
    return 'document_digest_invalid'
  }
  if (path.includes('observedOnDate')) return 'observation_date_invalid'
  if (
    path.includes('authorityBoundary') ||
    path.includes('productionReady') ||
    path.includes('Authorized') ||
    path.includes('Approved') ||
    path.includes('Verified') ||
    path.includes('Passed') ||
    path.includes('Present') ||
    path.includes('Fetched')
  ) {
    return path.includes('authorityBoundary')
      ? 'authority_promotion_forbidden'
      : 'observation_promotion_forbidden'
  }
  if (issue.code === 'unrecognized_keys') return 'schema_rejected'
  return 'schema_rejected'
}

function inspectJsonInput(
  input: unknown,
): LivingFrameControlledIllustrationSourceObservationIssue[] {
  const issues: LivingFrameControlledIllustrationSourceObservationIssue[] = []
  const seen = new WeakSet<object>()
  const visit = (value: unknown, path: string): void => {
    if (
      value === undefined ||
      typeof value === 'function' ||
      typeof value === 'symbol' ||
      typeof value === 'bigint' ||
      (typeof value === 'number' && !Number.isFinite(value))
    ) {
      issues.push({ code: 'non_json_input', path })
      return
    }
    if (typeof value === 'string') {
      if (hasControlCharacter(value)) {
        issues.push({ code: 'unsafe_text', path })
      } else if (
        URL_OR_EXECUTABLE_URI.test(value) ||
        FILESYSTEM_PATH_PREFIX.test(value) ||
        SECRET_LIKE.test(value)
      ) {
        issues.push({ code: 'unsafe_text', path })
      }
      return
    }
    if (value === null || typeof value !== 'object') return
    if (seen.has(value)) {
      issues.push({ code: 'non_json_input', path })
      return
    }
    seen.add(value)
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`))
      return
    }
    if (!isPlainRecord(value)) {
      issues.push({ code: 'non_json_input', path })
      return
    }
    for (const [key, entry] of Object.entries(value)) {
      const childPath = `${path}.${safeIssuePathKey(key)}`
      if (FORBIDDEN_KEYS.has(key)) {
        issues.push({ code: 'forbidden_key', path: childPath })
        continue
      }
      visit(entry, childPath)
    }
  }
  visit(input, '$')
  return dedupeIssues(issues)
}

async function sha256CanonicalJson(value: unknown): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new LivingFrameControlledIllustrationSourceObservationError([{
      code: 'crypto_unavailable',
      path: '$',
    }])
  }
  try {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(canonicalJsonValue(value))),
    )
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    throw new LivingFrameControlledIllustrationSourceObservationError([{
      code: 'digest_calculation_failed',
      path: '$',
    }])
  }
}

function canonicalJsonValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new LivingFrameControlledIllustrationSourceObservationError([{
        code: 'non_json_input',
        path: '$',
      }])
    }
    return value
  }
  if (Array.isArray(value)) return value.map(canonicalJsonValue)
  if (!isPlainRecord(value)) {
    throw new LivingFrameControlledIllustrationSourceObservationError([{
      code: 'non_json_input',
      path: '$',
    }])
  }
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(value).sort()) {
    const entry = value[key]
    if (entry === undefined) {
      throw new LivingFrameControlledIllustrationSourceObservationError([{
        code: 'non_json_input',
        path: `$.${key}`,
      }])
    }
    result[key] = canonicalJsonValue(entry)
  }
  return result
}

function sourceSpec(
  locator: LivingFrameControlledIllustrationSourceLocatorCode,
  sourceClass: LivingFrameControlledIllustrationSourceClass,
  documentClass: LivingFrameControlledIllustrationDocumentClass,
  pathCode: LivingFrameControlledIllustrationDocumentPathCode,
  declaredLabel:
    LivingFrameControlledIllustrationDeclaredLabelObservation,
): SourceSpec {
  return {
    locator,
    sourceClass,
    documentClass,
    pathCode,
    declaredLabel,
  }
}

function compareOrdered(
  left: { readonly order: number },
  right: { readonly order: number },
): number {
  return left.order - right.order
}

function sortText<T extends string>(values: readonly T[]): T[] {
  return [...values].sort((left, right) => left.localeCompare(right))
}

function sameOrderedValues(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index])
}

function sameSetValues(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return sameOrderedValues(sortText(left), sortText(right))
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if ((code >= 0 && code <= 8) || code === 11 || code === 12 ||
      (code >= 14 && code <= 31) || code === 127) return true
  }
  return false
}

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
}

function isPlainRecord(
  value: unknown,
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function safeIssuePathKey(key: string): string {
  return SAFE_ID.test(key) && key.length <= 64
    ? key
    : '<unknown>'
}

function zodPath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((result, part) => (
    typeof part === 'number'
      ? `${result}[${part}]`
      : `${result}.${String(part)}`
  ), '$')
}

function dedupeIssues(
  issues:
    readonly LivingFrameControlledIllustrationSourceObservationIssue[],
): LivingFrameControlledIllustrationSourceObservationIssue[] {
  const seen = new Set<string>()
  return issues.filter((issue) => {
    const key = `${issue.code}:${issue.path}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
