import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  type LivingFrameControlledIllustrationCandidateKey,
  type LivingFrameControlledIllustrationQualification,
} from '../../types/living-frame-controlled-illustration-qualification'
import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_VERSION,
  type LivingFrameControlledIllustrationCandidateSourceObservation,
  type LivingFrameControlledIllustrationDeclaredLabelObservation,
  type LivingFrameControlledIllustrationDependencyScopeRule,
  type LivingFrameControlledIllustrationDocumentClass,
  type LivingFrameControlledIllustrationDocumentPathCode,
  type LivingFrameControlledIllustrationObservationDisposition,
  type LivingFrameControlledIllustrationSourceClass,
  type LivingFrameControlledIllustrationSourceLocatorCode,
  type LivingFrameControlledIllustrationSourceObservationIssueCode,
  type LivingFrameControlledIllustrationSourceObservationPacket,
  type LivingFrameControlledIllustrationSourceObservationPacketDraft,
  type LivingFrameControlledIllustrationUpstreamSourceObservation,
} from '../../types/living-frame-controlled-illustration-source-observation'
import {
  createLivingFrameControlledIllustrationQualificationFixtures,
} from './living-frame-controlled-illustration-qualification-fixtures'
import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_AUTHORITY_BOUNDARY,
  createLivingFrameControlledIllustrationSourceObservation,
} from './living-frame-controlled-illustration-source-observation-contract'

const OBSERVED_ON_DATE = '2026-07-28'
const APACHE_LICENSE_SHA256 =
  'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'

interface SourceFixture {
  readonly locator:
    LivingFrameControlledIllustrationSourceLocatorCode
  readonly sourceClass: LivingFrameControlledIllustrationSourceClass
  readonly revision: string
  readonly documentClass: LivingFrameControlledIllustrationDocumentClass
  readonly documentPathCode:
    LivingFrameControlledIllustrationDocumentPathCode
  readonly documentDigest: string
  readonly declaredLabel:
    LivingFrameControlledIllustrationDeclaredLabelObservation
}

const SOURCES = {
  comfyui: [
    sourceFixture(
      'github_comfy_org_comfyui',
      'source_repository',
      '806e092ed42772e4ce7abf44c97c50021cc4bd10',
      'source_license',
      'license_file',
      '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986',
      'gpl_3_0_source_label',
    ),
  ],
  comfyui_controlnet_aux: [
    sourceFixture(
      'github_fannovel16_comfyui_controlnet_aux',
      'source_repository',
      'e8b689a513c3e6b63edc44066560ca5919c0576e',
      'source_license',
      'license_txt_file',
      APACHE_LICENSE_SHA256,
      'apache_2_0_source_label',
    ),
  ],
  controlnet: [
    sourceFixture(
      'github_lllyasviel_controlnet',
      'source_repository',
      'ed85cd1e25a5ed592f7d8178495b4483de0331bf',
      'source_license',
      'license_file',
      APACHE_LICENSE_SHA256,
      'apache_2_0_source_label',
    ),
    sourceFixture(
      'hf_lllyasviel_controlnet_v1_1',
      'model_repository',
      '69fc48b9cbd98661f6d0288dc59b59a5ccb32a6b',
      'model_card',
      'readme_model_card',
      'ae6b19b1bb5627d57aed65ac50ce8c5863827303817d81bbb576092c4ed10210',
      'openrail_model_card_label',
    ),
  ],
  ip_adapter: [
    sourceFixture(
      'github_tencent_ailab_ip_adapter',
      'source_repository',
      '62e4af9d0c1ac7d5f8dd386a0ccf2211346af1a2',
      'source_license',
      'license_file',
      APACHE_LICENSE_SHA256,
      'apache_2_0_source_label',
    ),
    sourceFixture(
      'hf_h94_ip_adapter',
      'model_repository',
      '018e402774aeeddd60609b4ecdb7e298259dc729',
      'model_card',
      'readme_model_card',
      'ba3a50dc2093d0eb075890e9af7409382874669d83939e64323246d0c4403cf8',
      'apache_2_0_source_label',
    ),
    sourceFixture(
      'hf_h94_ip_adapter_faceid',
      'model_repository',
      '43907e6f44d079bf1a9102d9a6e56aef7a219bae',
      'model_card',
      'readme_model_card',
      '6a5615bff6aca188a6ede083633fa98fb1c3e26c5e0d33b58877edf3287b9bb1',
      'research_only_noncommercial_model_card_statement',
    ),
    sourceFixture(
      'github_deepinsight_insightface',
      'source_repository',
      '1456819742fd09bc4ad5293856a143a3e807c78e',
      'model_card',
      'readme_model_card',
      '8c2adcb8169704139d3a85c9585cd2ed660fdcfd3da56a5cc1d0f24d4fc67638',
      'research_only_noncommercial_model_card_statement',
    ),
  ],
  auraface: [
    sourceFixture(
      'hf_fal_auraface_v1',
      'model_repository',
      'af6d057c9b0ec4071d4c49c80e3539258798b609',
      'model_card',
      'readme_model_card',
      '106272348689716d3c159ff16ec42e5f36aafebca591b3678b375f8aa2d12cde',
      'apache_2_0_source_label',
    ),
  ],
  peft_lora: [
    sourceFixture(
      'github_huggingface_peft',
      'source_repository',
      '051b2c5d9f2a94413418e6a8f65881bb2e31bc71',
      'source_license',
      'license_file',
      APACHE_LICENSE_SHA256,
      'apache_2_0_source_label',
    ),
  ],
} as const satisfies Readonly<
  Record<
    LivingFrameControlledIllustrationCandidateKey,
    readonly SourceFixture[]
  >
>

const DISPOSITIONS = {
  comfyui: 'candidate_source_only',
  comfyui_controlnet_aux: 'dependency_scope_unresolved',
  controlnet: 'dependency_scope_unresolved',
  ip_adapter: 'dependency_scope_unresolved',
  auraface: 'continuity_measurement_only_unqualified',
  peft_lora: 'mechanism_only_no_loaded_artifact',
} as const satisfies Readonly<
  Record<
    LivingFrameControlledIllustrationCandidateKey,
    LivingFrameControlledIllustrationObservationDisposition
  >
>

export interface LivingFrameControlledIllustrationSourceObservationFixtureSet {
  readonly controlled:
    LivingFrameControlledIllustrationSourceObservationPacket
}

export interface LivingFrameControlledIllustrationSourceObservationAdversarialFixture {
  readonly fixtureId: string
  readonly payload: unknown
  readonly expectedIssueCode:
    LivingFrameControlledIllustrationSourceObservationIssueCode
}

export async function createLivingFrameControlledIllustrationSourceObservationFixtureDraft(
  qualification?: LivingFrameControlledIllustrationQualification,
): Promise<{
  readonly qualification: LivingFrameControlledIllustrationQualification
  readonly draft:
    LivingFrameControlledIllustrationSourceObservationPacketDraft
}> {
  const resolvedQualification = qualification ??
    (await createLivingFrameControlledIllustrationQualificationFixtures())
      .evaluationOnly
  const candidateByKey = new Map(
    resolvedQualification.candidateRequirements.map(
      (candidate) => [candidate.candidateKey, candidate],
    ),
  )
  const candidateObservations =
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS.map(
      (candidateKey, order) => {
        const requirement = candidateByKey.get(candidateKey)
        if (!requirement) {
          throw new Error(
            `Controlled fixture lacks ${candidateKey} qualification.`,
          )
        }
        return candidateObservation(
          candidateKey,
          order,
          requirement.candidateClass,
          requirement.artifactExpectations.map(
            (entry) => entry.artifactFamily,
          ),
          requirement.reviewGateCodes,
        )
      },
    )
  return {
    qualification: resolvedQualification,
    draft: {
      contractVersion:
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_VERSION,
      contractSource:
        'living_frame_controlled_illustration_upstream_observation_only',
      status: 'controlled_source_observation',
      evidenceClass:
        'controlled_non_promotable_upstream_source_observation',
      observationPacketId:
        'living-frame.controlled-illustration.source-observation.2026-07-26',
      observedOnDate: OBSERVED_ON_DATE,
      qualificationContractDigestSha256:
        resolvedQualification.qualificationDigestSha256,
      candidateObservations,
      dependencyScopeRules: dependencyScopeRules(),
      authorityBoundary:
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_AUTHORITY_BOUNDARY,
    },
  }
}

export async function createLivingFrameControlledIllustrationSourceObservationFixtures(
): Promise<LivingFrameControlledIllustrationSourceObservationFixtureSet> {
  const { qualification, draft } =
    await createLivingFrameControlledIllustrationSourceObservationFixtureDraft()
  return {
    controlled:
      await createLivingFrameControlledIllustrationSourceObservation({
        qualification,
        draft,
      }),
  }
}

export function createLivingFrameControlledIllustrationSourceObservationAdversarialFixtures(
  draft: LivingFrameControlledIllustrationSourceObservationPacketDraft,
): readonly LivingFrameControlledIllustrationSourceObservationAdversarialFixture[] {
  const fixtures:
    LivingFrameControlledIllustrationSourceObservationAdversarialFixture[] = []
  const add = (
    fixtureId: string,
    payload: unknown,
    expectedIssueCode:
      LivingFrameControlledIllustrationSourceObservationIssueCode,
  ) => fixtures.push({ fixtureId, payload, expectedIssueCode })

  add('wrong_qualification_digest', {
    ...cloneJson(draft),
    qualificationContractDigestSha256: 'a'.repeat(64),
  }, 'qualification_digest_mismatch')

  const missingCandidate = cloneJson(draft)
  missingCandidate.candidateObservations =
    missingCandidate.candidateObservations.slice(0, -1)
  add('missing_candidate', missingCandidate, 'schema_rejected')

  const wrongCandidateOrder = cloneJson(draft)
  wrongCandidateOrder.candidateObservations[0]!.order = 1
  wrongCandidateOrder.candidateObservations[1]!.order = 0
  add(
    'candidate_order_metadata_changed',
    wrongCandidateOrder,
    'candidate_order_invalid',
  )

  const wrongClass = cloneJson(draft)
  wrongClass.candidateObservations[0]!.candidateClass =
    'preprocessing_bundle'
  add('candidate_class_changed', wrongClass, 'candidate_class_invalid')

  const wrongDisposition = cloneJson(draft)
  wrongDisposition.candidateObservations[4]!.disposition =
    'candidate_source_only'
  add(
    'auraface_measurement_disposition_promoted',
    wrongDisposition,
    'candidate_disposition_invalid',
  )

  const duplicateId = cloneJson(draft)
  duplicateId.candidateObservations[1]!.candidateObservationId =
    duplicateId.candidateObservations[0]!.candidateObservationId
  add('duplicate_observation_id', duplicateId, 'duplicate_id')

  const missingSource = cloneJson(draft)
  missingSource.candidateObservations[3]!.sourceObservations =
    missingSource.candidateObservations[3]!.sourceObservations.slice(0, -1)
  add('missing_insightface_source', missingSource, 'source_set_invalid')

  const mutableRevision = cloneJson(draft)
  mutableRevision.candidateObservations[0]!.sourceObservations[0]!
    .observedImmutableRevisionSha1 = 'main'
  add('mutable_source_revision', mutableRevision, 'source_revision_invalid')

  const wrongSourceClass = cloneJson(draft)
  wrongSourceClass.candidateObservations[2]!.sourceObservations[1]!
    .sourceClass = 'source_repository'
  add('model_repository_scope_changed', wrongSourceClass, 'source_scope_invalid')

  const staleSourceDate = cloneJson(draft)
  staleSourceDate.candidateObservations[0]!.sourceObservations[0]!
    .observedOnDate = '2026-07-25'
  add('source_date_mismatch', staleSourceDate, 'observation_date_invalid')

  const malformedDocumentDigest = cloneJson(draft)
  malformedDocumentDigest.candidateObservations[0]!.sourceObservations[0]!
    .declaredDocumentObservations[0]!.observedContentDigestSha256 = 'bad'
  add(
    'malformed_document_digest',
    malformedDocumentDigest,
    'document_digest_invalid',
  )

  const collapsedSourceLicense = cloneJson(draft)
  collapsedSourceLicense.candidateObservations[2]!.sourceObservations[1]!
    .declaredDocumentObservations[0]!.documentClass = 'source_license'
  add(
    'checkpoint_terms_collapsed_into_source_license',
    collapsedSourceLicense,
    'document_scope_invalid',
  )

  const wrongAuxPath = cloneJson(draft)
  wrongAuxPath.candidateObservations[1]!.sourceObservations[0]!
    .declaredDocumentObservations[0]!.relativeDocumentPathCode =
      'license_file'
  add('aux_license_path_changed', wrongAuxPath, 'document_scope_invalid')

  const artifactScope = cloneJson(draft)
  artifactScope.candidateObservations[1]!.unresolvedArtifactFamilyCodes =
    artifactScope.candidateObservations[1]!
      .unresolvedArtifactFamilyCodes.filter(
        (code) => code !== 'copied_source_license_inventory',
      )
  add('aux_copied_source_scope_hidden', artifactScope, 'artifact_scope_invalid')

  const gateScope = cloneJson(draft)
  gateScope.candidateObservations[4]!.requiredReviewGateCodes =
    gateScope.candidateObservations[4]!.requiredReviewGateCodes.filter(
      (code) => code !== 'likeness_and_deepfake_review',
    )
  add('auraface_identity_gate_removed', gateScope, 'review_gate_scope_invalid')

  const missingRule = cloneJson(draft)
  missingRule.dependencyScopeRules =
    missingRule.dependencyScopeRules.slice(0, -1)
  add('missing_dependency_rule', missingRule, 'schema_rejected')

  const faceIdPromotion = cloneJson(draft)
  const faceIdRule = faceIdPromotion.dependencyScopeRules.find(
    (rule) =>
      rule.ruleCode ===
        'faceid_insightface_route_is_noncommercial_blocked',
  )!
  faceIdRule.relatedSourceLocatorCodes = ['hf_h94_ip_adapter']
  add('faceid_scope_promoted', faceIdPromotion, 'faceid_promotion_forbidden')

  const auraFacePromotion = cloneJson(draft)
  const auraFaceRule = auraFacePromotion.dependencyScopeRules.find(
    (rule) =>
      rule.ruleCode ===
        'auraface_measurement_does_not_authorize_identity_generation',
  )!
  auraFaceRule.affectedCandidateKeys = ['ip_adapter']
  add(
    'auraface_identity_generation_scope_promoted',
    auraFacePromotion,
    'auraface_promotion_forbidden',
  )

  const peftPromotion = cloneJson(draft)
  const peftRule = peftPromotion.dependencyScopeRules.find(
    (rule) =>
      rule.ruleCode ===
        'peft_does_not_qualify_loaded_adapter_data_or_base_model',
  )!
  peftRule.affectedCandidateKeys = ['comfyui']
  add(
    'peft_loaded_artifact_scope_promoted',
    peftPromotion,
    'loaded_adapter_promotion_forbidden',
  )

  const fabricatedArtifactRead = cloneJson(draft)
  const fabricatedArtifactSource = fabricatedArtifactRead
    .candidateObservations[0]!.sourceObservations[0]! as unknown as {
    artifactBytesFetched: boolean
  }
  fabricatedArtifactSource.artifactBytesFetched = true
  add(
    'fabricated_artifact_download',
    fabricatedArtifactRead,
    'observation_promotion_forbidden',
  )

  const fabricatedCommercialApproval = cloneJson(draft)
  const fabricatedCommercialCandidate =
    fabricatedCommercialApproval.candidateObservations[3]! as unknown as {
      commercialUseApproved: boolean
    }
  fabricatedCommercialCandidate.commercialUseApproved = true
  add(
    'fabricated_commercial_approval',
    fabricatedCommercialApproval,
    'observation_promotion_forbidden',
  )

  const forgedAuthority = cloneJson(draft)
  const forgedAuthorityBoundary =
    forgedAuthority.authorityBoundary as unknown as {
      runtimeAuthority: boolean
    }
  forgedAuthorityBoundary.runtimeAuthority = true
  add('forged_runtime_authority', forgedAuthority, 'authority_promotion_forbidden')

  const duplicateSetValue = cloneJson(draft)
  duplicateSetValue.candidateObservations[0]!
    .unresolvedArtifactFamilyCodes.push(
      duplicateSetValue.candidateObservations[0]!
        .unresolvedArtifactFamilyCodes[0]!,
    )
  add('duplicate_set_value', duplicateSetValue, 'duplicate_value')

  add('raw_prompt_leakage', {
    ...cloneJson(draft),
    prompt: 'Draw the candidate source.',
  }, 'forbidden_key')

  add('upstream_url_leakage', {
    ...cloneJson(draft),
    url: 'https://example.invalid/source',
  }, 'forbidden_key')

  add('executable_payload_leakage', {
    ...cloneJson(draft),
    command: 'install everything',
  }, 'forbidden_key')

  add('control_character_payload', {
    ...cloneJson(draft),
    observationPacketId: 'unsafe\u0000packet',
  }, 'unsafe_text')

  return fixtures
}

function candidateObservation(
  candidateKey: LivingFrameControlledIllustrationCandidateKey,
  order: number,
  candidateClass:
    LivingFrameControlledIllustrationCandidateSourceObservation[
      'candidateClass'
    ],
  unresolvedArtifactFamilyCodes:
    LivingFrameControlledIllustrationCandidateSourceObservation[
      'unresolvedArtifactFamilyCodes'
    ],
  requiredReviewGateCodes:
    LivingFrameControlledIllustrationCandidateSourceObservation[
      'requiredReviewGateCodes'
    ],
): LivingFrameControlledIllustrationCandidateSourceObservation {
  return {
    candidateObservationId:
      `living-frame.source-observation.${candidateKey}`,
    order,
    candidateKey,
    candidateClass,
    disposition: DISPOSITIONS[candidateKey],
    sourceObservations: SOURCES[candidateKey].map(
      (source, sourceOrder) =>
        sourceObservation(candidateKey, source, sourceOrder),
    ),
    unresolvedArtifactFamilyCodes: [...unresolvedArtifactFamilyCodes],
    requiredReviewGateCodes: [...requiredReviewGateCodes],
    controlledObservationOnly: true,
    evaluationOnly: true,
    exactArtifactInventoryPresent: false,
    dependencyClosurePresent: false,
    packageOrArtifactPinnedForRuntime: false,
    sourceLicenseVerified: false,
    copiedSourceLicenseVerified: false,
    modelWeightLicenseVerified: false,
    baseModelLicenseVerified: false,
    trainingDataRightsVerified: false,
    commercialUseApproved: false,
    securityReviewPassed: false,
    privacyReviewPassed: false,
    benchmarkMeasured: false,
    benchmarkPassed: false,
    canonicalRegistryAdmitted: false,
    canonicalOperationAdmitted: false,
    dispatchAuthorized: false,
    runtimeAuthorized: false,
    productionReady: false,
  }
}

function sourceObservation(
  candidateKey: LivingFrameControlledIllustrationCandidateKey,
  source: SourceFixture,
  order: number,
): LivingFrameControlledIllustrationUpstreamSourceObservation {
  const identity = `${candidateKey}.${source.locator}`
  return {
    sourceObservationId: `living-frame.source.${identity}`,
    order,
    sourceLocatorCode: source.locator,
    sourceClass: source.sourceClass,
    observedImmutableRevisionSha1: source.revision,
    observedOnDate: OBSERVED_ON_DATE,
    declaredDocumentObservations: [{
      documentObservationId: `living-frame.document.${identity}`,
      order: 0,
      documentClass: source.documentClass,
      relativeDocumentPathCode: source.documentPathCode,
      observedContentDigestSha256: source.documentDigest,
      declaredLabelObservation: source.declaredLabel,
      observedOnDate: OBSERVED_ON_DATE,
      controlledDocumentObservationOnly: true,
      independentSourceReReadRequired: true,
      currentTruthAuthority: false,
      releasedEvidence: false,
      legalInterpretationProvided: false,
      commercialApprovalProvided: false,
      redistributionApprovalProvided: false,
      modelWeightApprovalProvided: false,
    }],
    controlledSourceObservationOnly: true,
    independentSourceReReadRequired: true,
    currentSourceAuthority: false,
    releasedEvidence: false,
    artifactBytesFetched: false,
    artifactChecksumIndependentlyVerified: false,
    sourceLicenseLegallyReviewed: false,
    commercialUseApproved: false,
    redistributionApproved: false,
    canonicalModelWeightManifestApproved: false,
    installationAuthorized: false,
    dispatchAuthorized: false,
    runtimeAuthorized: false,
    productionReady: false,
  }
}

function dependencyScopeRules(
): readonly LivingFrameControlledIllustrationDependencyScopeRule[] {
  return [
    dependencyRule(
      'aux_copied_annotators_require_independent_admission',
      ['comfyui_controlnet_aux'],
      ['github_fannovel16_comfyui_controlnet_aux'],
    ),
    dependencyRule(
      'aux_checkpoints_require_independent_admission',
      ['comfyui_controlnet_aux'],
      ['github_fannovel16_comfyui_controlnet_aux'],
    ),
    dependencyRule(
      'controlnet_code_weights_and_base_model_are_separate',
      ['controlnet'],
      [
        'github_lllyasviel_controlnet',
        'hf_lllyasviel_controlnet_v1_1',
      ],
    ),
    dependencyRule(
      'ip_adapter_generic_does_not_promote_faceid',
      ['ip_adapter'],
      ['hf_h94_ip_adapter', 'hf_h94_ip_adapter_faceid'],
    ),
    dependencyRule(
      'faceid_insightface_route_is_noncommercial_blocked',
      ['ip_adapter'],
      [
        'hf_h94_ip_adapter_faceid',
        'github_deepinsight_insightface',
      ],
    ),
    dependencyRule(
      'auraface_model_card_does_not_prove_training_data_rights',
      ['auraface'],
      ['hf_fal_auraface_v1'],
    ),
    dependencyRule(
      'auraface_measurement_does_not_authorize_identity_generation',
      ['auraface'],
      ['hf_fal_auraface_v1'],
    ),
    dependencyRule(
      'peft_does_not_qualify_loaded_adapter_data_or_base_model',
      ['peft_lora'],
      ['github_huggingface_peft'],
    ),
  ]
}

function dependencyRule(
  ruleCode: LivingFrameControlledIllustrationDependencyScopeRule[
    'ruleCode'
  ],
  affectedCandidateKeys:
    LivingFrameControlledIllustrationCandidateKey[],
  relatedSourceLocatorCodes:
    LivingFrameControlledIllustrationSourceLocatorCode[],
): LivingFrameControlledIllustrationDependencyScopeRule {
  return {
    dependencyScopeRuleId: `living-frame.dependency-scope.${ruleCode}`,
    ruleCode,
    affectedCandidateKeys,
    relatedSourceLocatorCodes,
    unresolved: true,
    independentArtifactAdmissionRequired: true,
    promotionAllowed: false,
    legalOrCommercialConclusionProvided: false,
  }
}

function sourceFixture(
  locator: LivingFrameControlledIllustrationSourceLocatorCode,
  sourceClass: LivingFrameControlledIllustrationSourceClass,
  revision: string,
  documentClass: LivingFrameControlledIllustrationDocumentClass,
  documentPathCode:
    LivingFrameControlledIllustrationDocumentPathCode,
  documentDigest: string,
  declaredLabel:
    LivingFrameControlledIllustrationDeclaredLabelObservation,
): SourceFixture {
  return {
    locator,
    sourceClass,
    revision,
    documentClass,
    documentPathCode,
    documentDigest,
    declaredLabel,
  }
}

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

function cloneJson<T>(value: T): DeepMutable<T> {
  return JSON.parse(JSON.stringify(value)) as DeepMutable<T>
}
