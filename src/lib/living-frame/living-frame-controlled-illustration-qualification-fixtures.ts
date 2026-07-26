import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ARTIFACT_FAMILIES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_EVIDENCE_CLASS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_SOURCE,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_STATUS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_VERSION,
  type LivingFrameControlledIllustrationArtifactFamily,
  type LivingFrameControlledIllustrationCandidateClass,
  type LivingFrameControlledIllustrationCandidateKey,
  type LivingFrameControlledIllustrationHypothesisCode,
  type LivingFrameControlledIllustrationQualification,
  type LivingFrameControlledIllustrationQualificationDraft,
  type LivingFrameControlledIllustrationReviewGateCode,
  type LivingFrameControlledIllustrationValidationIssueCode,
} from '../../types/living-frame-controlled-illustration-qualification'
import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_AUTHORITY_BOUNDARY,
  createLivingFrameControlledIllustrationQualification,
} from './living-frame-controlled-illustration-qualification-contract'

export interface LivingFrameControlledIllustrationQualificationFixtureSet {
  readonly evaluationOnly:
    LivingFrameControlledIllustrationQualification
}

export interface LivingFrameControlledIllustrationQualificationAdversarialFixture {
  readonly fixtureId: string
  readonly expectedIssueCode:
    LivingFrameControlledIllustrationValidationIssueCode
  readonly payload: unknown
}

interface CandidateDefinition {
  readonly candidateKey: LivingFrameControlledIllustrationCandidateKey
  readonly candidateClass: LivingFrameControlledIllustrationCandidateClass
  readonly artifactFamilies:
    readonly LivingFrameControlledIllustrationArtifactFamily[]
  readonly reviewGateCodes:
    readonly LivingFrameControlledIllustrationReviewGateCode[]
  readonly hypothesisCodes:
    readonly LivingFrameControlledIllustrationHypothesisCode[]
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

const CANDIDATE_DEFINITIONS: readonly CandidateDefinition[] = [
  {
    candidateKey: 'comfyui',
    candidateClass: 'execution_host_orchestrator',
    artifactFamilies: [
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
    reviewGateCodes: [
      ...COMMON_REVIEW_GATES,
      'arbitrary_node_or_code_review',
      'workflow_allowlist_review',
      'network_egress_review',
      'runtime_download_prohibition_review',
    ],
    hypothesisCodes: [
      'host_source_labels_gpl3_pending_exact_review',
      'host_custom_nodes_create_arbitrary_code_risk',
    ],
  },
  {
    candidateKey: 'comfyui_controlnet_aux',
    candidateClass: 'preprocessing_bundle',
    artifactFamilies: [
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
    reviewGateCodes: [
      ...COMMON_REVIEW_GATES,
      'copied_source_inventory_review',
      'copied_source_license_review',
      'model_weight_license_review',
      'workflow_allowlist_review',
      'runtime_download_prohibition_review',
      'pose_control_review',
    ],
    hypothesisCodes: [
      'copied_annotator_sources_require_independent_pin_and_license',
      'downloaded_preprocessor_checkpoints_require_independent_pin_and_license',
    ],
  },
  {
    candidateKey: 'controlnet',
    candidateClass: 'model_adapter_or_checkpoint_capability',
    artifactFamilies: [
      'source_repository',
      'source_license',
      'base_model',
      'model_checkpoint',
      'preprocessor_checkpoint_inventory',
      'workflow_definition',
      'benchmark_fixture',
      'benchmark_result',
    ],
    reviewGateCodes: [
      ...COMMON_REVIEW_GATES,
      'model_weight_license_review',
      'base_model_license_review',
      'runtime_download_prohibition_review',
      'pose_control_review',
      'style_control_review',
    ],
    hypothesisCodes: [
      'source_code_and_checkpoint_terms_are_separate',
      'adapter_terms_do_not_override_base_model_terms',
    ],
  },
  {
    candidateKey: 'ip_adapter',
    candidateClass: 'model_adapter_or_checkpoint_capability',
    artifactFamilies: [
      'source_repository',
      'source_license',
      'base_model',
      'adapter_checkpoint',
      'identity_dependency',
      'workflow_definition',
      'benchmark_fixture',
      'benchmark_result',
    ],
    reviewGateCodes: [
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
    hypothesisCodes: [
      'source_code_and_checkpoint_terms_are_separate',
      'base_adapter_does_not_promote_faceid_variant',
      'faceid_variant_research_only_noncommercial_due_identity_dependency',
      'adapter_terms_do_not_override_base_model_terms',
    ],
  },
  {
    candidateKey: 'pulid',
    candidateClass: 'identity_adapter_or_checkpoint_capability',
    artifactFamilies: [
      'source_repository',
      'source_license',
      'base_model',
      'adapter_checkpoint',
      'identity_dependency',
      'training_data_rights',
      'workflow_definition',
      'security_configuration',
      'benchmark_fixture',
      'benchmark_result',
    ],
    reviewGateCodes: [
      ...COMMON_REVIEW_GATES,
      'model_weight_license_review',
      'base_model_license_review',
      'training_data_rights_review',
      'runtime_download_prohibition_review',
      'character_continuity_review',
      'style_control_review',
      'consent_review',
      'likeness_and_deepfake_review',
      'minor_safety_review',
      'retention_review',
      'documentary_fact_safety_review',
    ],
    hypothesisCodes: [
      'source_code_and_checkpoint_terms_are_separate',
      'adapter_terms_do_not_override_base_model_terms',
      'pulid_flux_route_inherits_flux1_dev_noncommercial_constraint',
      'identity_workflow_requires_consent_likeness_and_documentary_review',
    ],
  },
  {
    candidateKey: 'peft_lora',
    candidateClass: 'training_or_loading_mechanism',
    artifactFamilies: [
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
    reviewGateCodes: [
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
    hypothesisCodes: [
      'adapter_terms_do_not_override_base_model_terms',
      'mechanism_terms_do_not_qualify_loaded_adapters',
    ],
  },
]

export function createLivingFrameControlledIllustrationQualificationFixtureDraft():
LivingFrameControlledIllustrationQualificationDraft {
  return {
    contractVersion:
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_VERSION,
    source: LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_SOURCE,
    status: LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_STATUS,
    evidenceClass:
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_EVIDENCE_CLASS,
    qualificationId: 'living-frame.controlled-illustration.v1',
    candidateRequirements: CANDIDATE_DEFINITIONS.map(
      (definition, order) => ({
        candidateRequirementId:
          `qualification.${definition.candidateKey}`,
        candidateKey: definition.candidateKey,
        order,
        candidateClass: definition.candidateClass,
        artifactExpectations: definition.artifactFamilies.map(
          (artifactFamily) => ({
            artifactExpectationId:
              `artifact.${definition.candidateKey}.${artifactFamily}`,
            artifactFamily,
            exactVersionRequired: true,
            exactDigestRequired: true,
            independentReviewRequired: true,
            suppliedInQualification: false,
            verifiedInQualification: false,
          }),
        ),
        reviewGateCodes: definition.reviewGateCodes,
        benchmarkExpectations:
          LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES.map(
            (benchmarkCode) => ({
              benchmarkExpectationId:
                `benchmark.${definition.candidateKey}.${benchmarkCode}`,
              benchmarkCode,
              measurementRequired: true,
              measuredInQualification: false,
              passedInQualification: false,
            }),
          ),
        hypothesisCodes: definition.hypothesisCodes,
        evaluationOnly: true,
        installationAuthorized: false,
        exactVersionSelected: false,
        artifactManifestPresent: false,
        packageOrArtifactPinned: false,
        sourceLicenseVerified: false,
        copiedSourceLicenseVerified: false,
        modelWeightLicenseVerified: false,
        baseModelLicenseVerified: false,
        commercialUseApproved: false,
        securityReviewPassed: false,
        privacyReviewPassed: false,
        benchmarkMeasured: false,
        benchmarkPassed: false,
        canonicalToolIdAssigned: false,
        canonicalOperationIdAssigned: false,
        canonicalRegistryAdmitted: false,
        independentVerificationPassed: false,
        dispatchAuthorized: false,
        imageRouteQualified: false,
        productionReady: false,
      }),
    ),
    imageCapabilityBoundary: {
      capabilityBoundaryCodes:
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES,
      gptImage2TransparentOutputSupported: false,
      opaqueGenerationRequired: true,
      providerEditMaskIsProductionMatte: false,
      qualifiedSegmentationOrMattingRequired: true,
      edgeDecontaminationRequired: true,
      trueAlphaArtifactRequired: true,
      multiBackgroundQaRequired: true,
      destinationCompositeQaRequired: true,
      providerRuntimeQualified: false,
      imageRouteQualified: false,
    },
    deterministicRouteRequiredForExactGraphics: true,
    generatedVideoIsLastResort: true,
    candidateSetComplete: true,
    authorityBoundary:
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_AUTHORITY_BOUNDARY,
  }
}

export async function createLivingFrameControlledIllustrationQualificationFixtures():
Promise<LivingFrameControlledIllustrationQualificationFixtureSet> {
  return {
    evaluationOnly:
      await createLivingFrameControlledIllustrationQualification(
        createLivingFrameControlledIllustrationQualificationFixtureDraft(),
      ),
  }
}

export function createLivingFrameControlledIllustrationQualificationAdversarialFixtures(
  draft = createLivingFrameControlledIllustrationQualificationFixtureDraft(),
): readonly LivingFrameControlledIllustrationQualificationAdversarialFixture[] {
  return [
    adversarial('raw_prompt', 'forbidden_key', draft, (root) => {
      root.prompt = 'Install and execute an unreviewed model.'
    }),
    adversarial('provider_route', 'forbidden_key', draft, (root) => {
      root.providerId = 'caller-selected-provider'
    }),
    adversarial('tool_route', 'forbidden_key', draft, (root) => {
      root.toolId = 'caller-selected-tool'
    }),
    adversarial('package_pin', 'forbidden_key', draft, (root) => {
      root.packageVersion = 'unreviewed-version'
    }),
    adversarial('duplicate_candidate', 'duplicate_value', draft, (root) => {
      const candidates = arrayField(root, 'candidateRequirements')
      objectField(candidates[1]).candidateKey = 'comfyui'
    }),
    adversarial('wrong_candidate_order', 'candidate_order_invalid', draft, (root) => {
      const candidates = arrayField(root, 'candidateRequirements')
      objectField(candidates[0]).order = 1
      objectField(candidates[1]).order = 0
    }),
    adversarial('wrong_candidate_class', 'candidate_class_invalid', draft, (root) => {
      objectField(arrayField(root, 'candidateRequirements')[0])
        .candidateClass = 'training_or_loading_mechanism'
    }),
    adversarial('missing_aux_copied_source', 'artifact_family_missing', draft, (root) => {
      removeArtifact(root, 'comfyui_controlnet_aux', 'copied_source_inventory')
    }),
    adversarial('missing_aux_copied_license', 'artifact_family_missing', draft, (root) => {
      removeArtifact(
        root,
        'comfyui_controlnet_aux',
        'copied_source_license_inventory',
      )
    }),
    adversarial('missing_aux_checkpoint_inventory', 'artifact_family_missing', draft, (root) => {
      removeArtifact(
        root,
        'comfyui_controlnet_aux',
        'preprocessor_checkpoint_inventory',
      )
    }),
    adversarial('missing_controlnet_base_model', 'artifact_family_missing', draft, (root) => {
      removeArtifact(root, 'controlnet', 'base_model')
    }),
    adversarial('missing_controlnet_weight_gate', 'review_gate_missing', draft, (root) => {
      removeGate(root, 'controlnet', 'model_weight_license_review')
    }),
    adversarial('ip_adapter_faceid_promotion', 'hypothesis_missing', draft, (root) => {
      removeHypothesis(
        root,
        'ip_adapter',
        'faceid_variant_research_only_noncommercial_due_identity_dependency',
      )
    }),
    adversarial('ip_adapter_variant_collapse', 'hypothesis_missing', draft, (root) => {
      removeHypothesis(
        root,
        'ip_adapter',
        'base_adapter_does_not_promote_faceid_variant',
      )
    }),
    adversarial('pulid_flux_constraint_removed', 'hypothesis_missing', draft, (root) => {
      removeHypothesis(
        root,
        'pulid',
        'pulid_flux_route_inherits_flux1_dev_noncommercial_constraint',
      )
    }),
    adversarial('pulid_consent_gate_removed', 'review_gate_missing', draft, (root) => {
      removeGate(root, 'pulid', 'consent_review')
    }),
    adversarial('pulid_minor_gate_removed', 'review_gate_missing', draft, (root) => {
      removeGate(root, 'pulid', 'minor_safety_review')
    }),
    adversarial('pulid_fact_safety_removed', 'review_gate_missing', draft, (root) => {
      removeGate(root, 'pulid', 'documentary_fact_safety_review')
    }),
    adversarial('lora_mechanism_promotes_adapter', 'hypothesis_missing', draft, (root) => {
      removeHypothesis(
        root,
        'peft_lora',
        'mechanism_terms_do_not_qualify_loaded_adapters',
      )
    }),
    adversarial('benchmark_marked_measured', 'qualification_promotion_forbidden', draft, (root) => {
      objectField(
        arrayField(
          candidate(root, 'comfyui'),
          'benchmarkExpectations',
        )[0],
      ).measuredInQualification = true
    }),
    adversarial('benchmark_marked_passed', 'qualification_promotion_forbidden', draft, (root) => {
      candidate(root, 'comfyui').benchmarkPassed = true
    }),
    adversarial('installation_authorized', 'qualification_promotion_forbidden', draft, (root) => {
      candidate(root, 'comfyui').installationAuthorized = true
    }),
    adversarial('registry_admitted', 'qualification_promotion_forbidden', draft, (root) => {
      candidate(root, 'controlnet').canonicalRegistryAdmitted = true
    }),
    adversarial('dispatch_authorized', 'qualification_promotion_forbidden', draft, (root) => {
      candidate(root, 'ip_adapter').dispatchAuthorized = true
    }),
    adversarial('production_ready', 'qualification_promotion_forbidden', draft, (root) => {
      candidate(root, 'pulid').productionReady = true
    }),
    adversarial('authority_forged_green', 'authority_promotion_forbidden', draft, (root) => {
      objectField(root.authorityBoundary).runtimeAuthority = true
    }),
    adversarial('native_alpha_forged', 'qualification_promotion_forbidden', draft, (root) => {
      objectField(root.imageCapabilityBoundary)
        .gptImage2TransparentOutputSupported = true
    }),
    adversarial('edit_mask_promoted_to_matte', 'qualification_promotion_forbidden', draft, (root) => {
      objectField(root.imageCapabilityBoundary)
        .providerEditMaskIsProductionMatte = true
    }),
    adversarial('alpha_qa_removed', 'image_capability_boundary_invalid', draft, (root) => {
      const boundary = objectField(root.imageCapabilityBoundary)
      boundary.capabilityBoundaryCodes = arrayField(
        boundary,
        'capabilityBoundaryCodes',
      ).filter((code) => code !== 'destination_composite_qa_required')
    }),
    adversarial('deterministic_exact_graphics_disabled', 'deterministic_route_required', draft, (root) => {
      root.deterministicRouteRequiredForExactGraphics = false
    }),
    adversarial('generated_video_first', 'deterministic_route_required', draft, (root) => {
      root.generatedVideoIsLastResort = false
    }),
  ]
}

function candidate(
  root: Record<string, unknown>,
  candidateKey: LivingFrameControlledIllustrationCandidateKey,
): Record<string, unknown> {
  const found = arrayField(root, 'candidateRequirements').find(
    (entry) => objectField(entry).candidateKey === candidateKey,
  )
  if (!found) throw new Error(`Missing candidate ${candidateKey}.`)
  return objectField(found)
}

function removeArtifact(
  root: Record<string, unknown>,
  candidateKey: LivingFrameControlledIllustrationCandidateKey,
  artifactFamily: ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_ARTIFACT_FAMILIES>,
): void {
  const target = candidate(root, candidateKey)
  target.artifactExpectations = arrayField(
    target,
    'artifactExpectations',
  ).filter(
    (entry) => objectField(entry).artifactFamily !== artifactFamily,
  )
}

function removeGate(
  root: Record<string, unknown>,
  candidateKey: LivingFrameControlledIllustrationCandidateKey,
  gate: LivingFrameControlledIllustrationReviewGateCode,
): void {
  const target = candidate(root, candidateKey)
  target.reviewGateCodes =
    arrayField(target, 'reviewGateCodes').filter((entry) => entry !== gate)
}

function removeHypothesis(
  root: Record<string, unknown>,
  candidateKey: LivingFrameControlledIllustrationCandidateKey,
  hypothesis: LivingFrameControlledIllustrationHypothesisCode,
): void {
  const target = candidate(root, candidateKey)
  target.hypothesisCodes =
    arrayField(target, 'hypothesisCodes').filter(
      (entry) => entry !== hypothesis,
    )
}

function adversarial(
  fixtureId: string,
  expectedIssueCode:
    LivingFrameControlledIllustrationValidationIssueCode,
  source: LivingFrameControlledIllustrationQualificationDraft,
  mutate: (root: Record<string, unknown>) => void,
): LivingFrameControlledIllustrationQualificationAdversarialFixture {
  const payload = objectField(cloneJson(source))
  mutate(payload)
  return { fixtureId, expectedIssueCode, payload }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function objectField(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Expected object fixture field.')
  }
  return value as Record<string, unknown>
}

function arrayField(
  value: Record<string, unknown>,
  key: string,
): unknown[] {
  const result = value[key]
  if (!Array.isArray(result)) {
    throw new TypeError(`Expected array fixture field ${key}.`)
  }
  return result
}

type ValueOf<T extends readonly string[]> = T[number]
