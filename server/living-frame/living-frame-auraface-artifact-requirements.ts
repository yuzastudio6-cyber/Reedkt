import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  validateLivingFrameControlledIllustrationQualification,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-qualification-contract'
import {
  validateLivingFrameControlledIllustrationSourceObservation,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-contract'
import {
  LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENT_IDS,
  LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_CLASS,
  LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_ISSUES,
  LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES,
  LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_VERSION,
  type LivingFrameAuraFaceArtifactRequirement,
  type LivingFrameAuraFaceArtifactRequirements,
  type LivingFrameAuraFaceArtifactRequirementsAuthority,
  type LivingFrameAuraFaceArtifactRequirementsDraft,
  type LivingFrameAuraFaceArtifactRequirementsIssue,
  type LivingFrameAuraFaceArtifactRequirementsIssueCode,
} from '../../src/types/living-frame-auraface-artifact-requirements'
import type {
  LivingFrameControlledIllustrationQualification,
} from '../../src/types/living-frame-controlled-illustration-qualification'
import type {
  LivingFrameControlledIllustrationSourceObservationPacket,
} from '../../src/types/living-frame-controlled-illustration-source-observation'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,159}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const SOURCE_REVISION =
  'af6d057c9b0ec4071d4c49c80e3539258798b609' as const
const MODEL_CARD_DIGEST =
  '106272348689716d3c159ff16ec42e5f36aafebca591b3678b375f8aa2d12cde' as const
const LICENSE_DIGEST =
  'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4' as const

const AUTHORITY_BOUNDARY:
  LivingFrameAuraFaceArtifactRequirementsAuthority =
  deepFreeze({
    controlledArtifactRequirementAuthority: true,
    currentSourceAuthority: false,
    legalReviewAuthority: false,
    trainingDataRightsAuthority: false,
    consentAuthority: false,
    modelArtifactIngestAuthority: false,
    modelArtifactMountAuthority: false,
    packageAuthority: false,
    operationAuthority: false,
    providerAuthority: false,
    dispatchAuthority: false,
    workerCompletionAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    serviceFeeAuthority: false,
    planningAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    identityApprovalAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const authoritySchema = z.object({
  controlledArtifactRequirementAuthority: z.literal(true),
  currentSourceAuthority: z.literal(false),
  legalReviewAuthority: z.literal(false),
  trainingDataRightsAuthority: z.literal(false),
  consentAuthority: z.literal(false),
  modelArtifactIngestAuthority: z.literal(false),
  modelArtifactMountAuthority: z.literal(false),
  packageAuthority: z.literal(false),
  operationAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  workerCompletionAuthority: z.literal(false),
  actualCostAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  serviceFeeAuthority: z.literal(false),
  planningAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workItemAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  identityApprovalAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const artifactSchema = z.object({
  canonicalOrder: z.union([z.literal(0), z.literal(1)]),
  requirementId: z.enum(
    LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENT_IDS,
  ),
  sourceLocatorCode: z.literal('hf_fal_auraface_v1'),
  sourceRevision: z.literal(SOURCE_REVISION),
  artifactIdentityCode: z.union([
    z.literal('glintr100_onnx'),
    z.literal('scrfd_10g_bnkps_onnx'),
  ]),
  artifactFormat: z.literal('onnx'),
  artifactRole: z.union([
    z.literal('face_embedding_measurement'),
    z.literal('face_detection_and_landmark_alignment'),
  ]),
  modelFamily: z.union([
    z.literal('auraface_v1_glintr100'),
    z.literal('auraface_v1_scrfd_10g_bnkps'),
  ]),
  byteLength: z.union([
    z.literal(260_694_151),
    z.literal(16_923_827),
  ]),
  contentSha256: z.union([
    z.literal(
      'a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60',
    ),
    z.literal(
      '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91',
    ),
  ]),
  consumerScope: z.literal(
    'living-frame.auraface-continuity-measurement',
  ),
  executionClass: z.literal('cpu_permitted'),
  requiredExecutionTarget: z.literal('private_controlled_cpu'),
  accelerator: z.literal('none'),
  cpuFallbackAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
  exactBytesFetched: z.literal(false),
  exactBytesIndependentlyVerified: z.literal(false),
  modelArtifactIngested: z.literal(false),
  requirementDigestSha256: z.string().regex(SHA256),
}).strict()

const draftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_CLASS,
  ),
  requirementSetId: z.literal(
    'living-frame.auraface-v1.continuity-measurement.candidate',
  ),
  sourceBindings: z.object({
    controlledIllustrationQualificationDigestSha256:
      z.string().regex(SHA256),
    controlledSourceObservationPacketId: z.string().regex(SAFE_ID),
    controlledSourceObservationDigestSha256:
      z.string().regex(SHA256),
    sourceLocatorCode: z.literal('hf_fal_auraface_v1'),
    sourceRevision: z.literal(SOURCE_REVISION),
    sourceObservedOnDate: z.literal('2026-07-28'),
    modelCardDigestSha256: z.literal(MODEL_CARD_DIGEST),
    licenseDocumentDigestSha256: z.literal(LICENSE_DIGEST),
    declaredLicenseLabelObservation: z.literal(
      'apache_2_0_source_label',
    ),
    sourceObservationIsCurrentTruth: z.literal(false),
    legalOrCommercialConclusionProvided: z.literal(false),
  }).strict(),
  artifacts: z.tuple([artifactSchema, artifactSchema]),
  bundleSummary: z.object({
    artifactCount: z.literal(2),
    totalByteLength: z.literal(277_617_978),
    embeddingModelCount: z.literal(1),
    detectorModelCount: z.literal(1),
    genderOrAgeModelIncluded: z.literal(false),
    identityGenerationAdapterIncluded: z.literal(false),
    measurementOnly: z.literal(true),
  }).strict(),
  measurementPolicy: z.object({
    capabilityKey: z.literal('auraface'),
    placement: z.literal('post_generation_cpu_continuity_qa'),
    purpose: z.literal(
      'compare_approved_reference_and_candidate_face_embeddings',
    ),
    mayGenerateOrConditionIdentity: z.literal(false),
    mayApproveLikenessOrHistoricalIdentity: z.literal(false),
    canonicalIllustrativeInterpretationRemainsIllustrative:
      z.literal(true),
    noFaceOrMultipleFacesRequiresUserReview: z.literal(true),
    projectCalibratedThresholdRequired: z.literal(true),
    universalSimilarityThresholdAllowed: z.literal(false),
    embeddingBytesSerializable: z.literal(false),
    embeddingPersistenceAllowed: z.literal(false),
    identityReferencePersistenceAllowed: z.literal(false),
  }).strict(),
  safetyPolicy: z.object({
    explicitConsentRequiredForRealPersonReference: z.literal(true),
    publicFigureAndDocumentarySafetyReviewRequired: z.literal(true),
    minorProtectionRequired: z.literal(true),
    impersonationAndDeepfakeSafeguardsRequired: z.literal(true),
    retentionAndDeletionPolicyRequired: z.literal(true),
    demographicFairnessReviewRequired: z.literal(true),
    provenanceAndTrainingDataRightsUnresolved: z.literal(true),
    paidProductionUseApproved: z.literal(false),
  }).strict(),
  costLineage: z.object({
    separateCpuContinuityMeasurementAttempt: z.literal(true),
    excludedFromSharedComfyuiGpuAttempt: z.literal(true),
    exactReuseAddsNoAttempt: z.literal(true),
    actualAttemptCostOwnedByExistingToolCostAuthority:
      z.literal(true),
    failedOrUnknownAttemptCostMustBeRetained: z.literal(true),
    costAmountIncluded: z.literal(false),
    customerPriceOrCreditIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES,
  )).length(
    LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES.length,
  ),
  authorityBoundary: authoritySchema,
  controlledSourceObservationRevalidated: z.literal(true),
  exactArtifactIdentityObservationOnly: z.literal(true),
  artifactRepositoryLocatorCreated: z.literal(false),
  artifactIngested: z.literal(false),
  operationRegistered: z.literal(false),
  runtimeExecuted: z.literal(false),
  continuityMeasurementCreated: z.literal(false),
  containsUrlPathCredentialBytesEmbeddingOrIdentityReference:
    z.literal(false),
  containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    z.literal(false),
  subjectSpecificRouting: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const requirementsSchema = draftSchema.extend({
  requirementSetDigestSha256: z.string().regex(SHA256),
}).strict()

export class LivingFrameAuraFaceArtifactRequirementsError
  extends Error {
  readonly issues:
    readonly LivingFrameAuraFaceArtifactRequirementsIssue[]

  constructor(
    issues:
      readonly LivingFrameAuraFaceArtifactRequirementsIssue[],
  ) {
    super('Living Frame AuraFace artifact requirements failed.')
    this.name = 'LivingFrameAuraFaceArtifactRequirementsError'
    this.issues = issues
  }
}

export async function createLivingFrameAuraFaceArtifactRequirements(
  input: {
    readonly qualification:
      LivingFrameControlledIllustrationQualification
    readonly sourceObservation:
      LivingFrameControlledIllustrationSourceObservationPacket
  },
): Promise<LivingFrameAuraFaceArtifactRequirements> {
  if (
    !isRecord(input)
    || !hasExactKeys(input, ['qualification', 'sourceObservation'])
  ) throw invalid('input_invalid', '$')
  const qualificationValidation =
    await validateLivingFrameControlledIllustrationQualification(
      input.qualification,
    )
  if (!qualificationValidation.ok) {
    throw invalid('qualification_invalid', '$.qualification')
  }
  const qualification = qualificationValidation.qualification
  const sourceValidation =
    await validateLivingFrameControlledIllustrationSourceObservation(
      input.sourceObservation,
      qualification,
    )
  if (!sourceValidation.ok) {
    throw invalid(
      'source_observation_invalid',
      '$.sourceObservation',
    )
  }
  const sourceObservation = sourceValidation.packet
  const candidate = sourceObservation.candidateObservations.find(
    (entry) => entry.candidateKey === 'auraface',
  )
  if (!candidate) {
    throw invalid(
      'auraface_candidate_missing',
      '$.sourceObservation.candidateObservations',
    )
  }
  const source = candidate.sourceObservations.find(
    (entry) => entry.sourceLocatorCode === 'hf_fal_auraface_v1',
  )
  const modelCard = source?.declaredDocumentObservations.find(
    (entry) => entry.documentClass === 'model_card',
  )
  if (
    candidate.disposition
      !== 'continuity_measurement_only_unqualified'
    || candidate.controlledObservationOnly !== true
    || candidate.evaluationOnly !== true
    || candidate.productionReady !== false
    || !source
    || source.observedImmutableRevisionSha1 !== SOURCE_REVISION
    || source.observedOnDate !== '2026-07-28'
    || source.currentSourceAuthority !== false
    || source.releasedEvidence !== false
    || source.artifactBytesFetched !== false
    || source.artifactChecksumIndependentlyVerified !== false
    || source.sourceLicenseLegallyReviewed !== false
    || source.commercialUseApproved !== false
    || !modelCard
    || modelCard.observedContentDigestSha256 !== MODEL_CARD_DIGEST
    || modelCard.declaredLabelObservation
      !== 'apache_2_0_source_label'
  ) throw invalid(
    'source_lineage_invalid',
    '$.sourceObservation.candidateObservations',
  )

  const artifacts = [
    artifact({
      canonicalOrder: 0,
      requirementId: 'auraface_v1_embedding_model',
      artifactIdentityCode: 'glintr100_onnx',
      artifactRole: 'face_embedding_measurement',
      modelFamily: 'auraface_v1_glintr100',
      byteLength: 260_694_151,
      contentSha256:
        'a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60',
    }),
    artifact({
      canonicalOrder: 1,
      requirementId: 'auraface_v1_face_detector',
      artifactIdentityCode: 'scrfd_10g_bnkps_onnx',
      artifactRole: 'face_detection_and_landmark_alignment',
      modelFamily: 'auraface_v1_scrfd_10g_bnkps',
      byteLength: 16_923_827,
      contentSha256:
        '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91',
    }),
  ] as const
  const draft: LivingFrameAuraFaceArtifactRequirementsDraft = {
    contractVersion:
      LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_VERSION,
    resultClass:
      LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_CLASS,
    requirementSetId:
      'living-frame.auraface-v1.continuity-measurement.candidate',
    sourceBindings: {
      controlledIllustrationQualificationDigestSha256:
        qualification.qualificationDigestSha256,
      controlledSourceObservationPacketId:
        sourceObservation.observationPacketId,
      controlledSourceObservationDigestSha256:
        sourceObservation.observationPacketDigestSha256,
      sourceLocatorCode: 'hf_fal_auraface_v1',
      sourceRevision: SOURCE_REVISION,
      sourceObservedOnDate: '2026-07-28',
      modelCardDigestSha256: MODEL_CARD_DIGEST,
      licenseDocumentDigestSha256: LICENSE_DIGEST,
      declaredLicenseLabelObservation:
        'apache_2_0_source_label',
      sourceObservationIsCurrentTruth: false,
      legalOrCommercialConclusionProvided: false,
    },
    artifacts,
    bundleSummary: {
      artifactCount: 2,
      totalByteLength: 277_617_978,
      embeddingModelCount: 1,
      detectorModelCount: 1,
      genderOrAgeModelIncluded: false,
      identityGenerationAdapterIncluded: false,
      measurementOnly: true,
    },
    measurementPolicy: {
      capabilityKey: 'auraface',
      placement: 'post_generation_cpu_continuity_qa',
      purpose:
        'compare_approved_reference_and_candidate_face_embeddings',
      mayGenerateOrConditionIdentity: false,
      mayApproveLikenessOrHistoricalIdentity: false,
      canonicalIllustrativeInterpretationRemainsIllustrative: true,
      noFaceOrMultipleFacesRequiresUserReview: true,
      projectCalibratedThresholdRequired: true,
      universalSimilarityThresholdAllowed: false,
      embeddingBytesSerializable: false,
      embeddingPersistenceAllowed: false,
      identityReferencePersistenceAllowed: false,
    },
    safetyPolicy: {
      explicitConsentRequiredForRealPersonReference: true,
      publicFigureAndDocumentarySafetyReviewRequired: true,
      minorProtectionRequired: true,
      impersonationAndDeepfakeSafeguardsRequired: true,
      retentionAndDeletionPolicyRequired: true,
      demographicFairnessReviewRequired: true,
      provenanceAndTrainingDataRightsUnresolved: true,
      paidProductionUseApproved: false,
    },
    costLineage: {
      separateCpuContinuityMeasurementAttempt: true,
      excludedFromSharedComfyuiGpuAttempt: true,
      exactReuseAddsNoAttempt: true,
      actualAttemptCostOwnedByExistingToolCostAuthority: true,
      failedOrUnknownAttemptCostMustBeRetained: true,
      costAmountIncluded: false,
      customerPriceOrCreditIncluded: false,
      serviceFeeIncluded: false,
    },
    openGateCodes:
      LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    controlledSourceObservationRevalidated: true,
    exactArtifactIdentityObservationOnly: true,
    artifactRepositoryLocatorCreated: false,
    artifactIngested: false,
    operationRegistered: false,
    runtimeExecuted: false,
    continuityMeasurementCreated: false,
    containsUrlPathCredentialBytesEmbeddingOrIdentityReference: false,
    containsPriceCreditServiceFeeReservationWalletOrLedgerData: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  assertRequirements(draft)
  return deepFreeze({
    ...draft,
    requirementSetDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameAuraFaceArtifactRequirements(
  value: unknown,
): value is LivingFrameAuraFaceArtifactRequirements {
  try {
    const parsed = requirementsSchema.safeParse(value)
    if (!parsed.success) return false
    const { requirementSetDigestSha256, ...draft } = parsed.data
    assertRequirements(draft)
    return digest(draft) === requirementSetDigestSha256
  } catch {
    return false
  }
}

function artifact(
  input: Pick<
    LivingFrameAuraFaceArtifactRequirement,
    | 'canonicalOrder'
    | 'requirementId'
    | 'artifactIdentityCode'
    | 'artifactRole'
    | 'modelFamily'
    | 'byteLength'
    | 'contentSha256'
  >,
): LivingFrameAuraFaceArtifactRequirement {
  const draft = {
    ...input,
    sourceLocatorCode: 'hf_fal_auraface_v1' as const,
    sourceRevision: SOURCE_REVISION,
    artifactFormat: 'onnx' as const,
    consumerScope:
      'living-frame.auraface-continuity-measurement' as const,
    executionClass: 'cpu_permitted' as const,
    requiredExecutionTarget: 'private_controlled_cpu' as const,
    accelerator: 'none' as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
    exactBytesFetched: false as const,
    exactBytesIndependentlyVerified: false as const,
    modelArtifactIngested: false as const,
  }
  return {
    ...draft,
    requirementDigestSha256: digest(draft),
  }
}

function assertRequirements(
  draft: LivingFrameAuraFaceArtifactRequirementsDraft,
): void {
  if (!draftSchema.safeParse(draft).success) {
    throw invalid('artifact_requirement_invalid', '$')
  }
  const [embedding, detector] = draft.artifacts
  if (
    embedding.canonicalOrder !== 0
    || embedding.requirementId !== 'auraface_v1_embedding_model'
    || embedding.artifactIdentityCode !== 'glintr100_onnx'
    || embedding.artifactRole !== 'face_embedding_measurement'
    || embedding.modelFamily !== 'auraface_v1_glintr100'
    || embedding.byteLength !== 260_694_151
    || embedding.contentSha256
      !==
        'a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60'
    || detector.canonicalOrder !== 1
    || detector.requirementId !== 'auraface_v1_face_detector'
    || detector.artifactIdentityCode !== 'scrfd_10g_bnkps_onnx'
    || detector.artifactRole
      !== 'face_detection_and_landmark_alignment'
    || detector.modelFamily !== 'auraface_v1_scrfd_10g_bnkps'
    || detector.byteLength !== 16_923_827
    || detector.contentSha256
      !==
        '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91'
  ) throw invalid('artifact_order_invalid', '$.artifacts')
  for (const entry of draft.artifacts) {
    const { requirementDigestSha256, ...requirementDraft } = entry
    if (digest(requirementDraft) !== requirementDigestSha256) {
      throw invalid(
        'artifact_requirement_invalid',
        '$.artifacts',
      )
    }
  }
  if (
    canonicalJson(draft.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES,
      )
  ) throw invalid('gate_set_invalid', '$.openGateCodes')
  if (
    canonicalJson(draft.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || draft.artifactRepositoryLocatorCreated !== false
    || draft.artifactIngested !== false
    || draft.operationRegistered !== false
    || draft.runtimeExecuted !== false
    || draft.continuityMeasurementCreated !== false
    || draft.productionReady !== false
  ) throw invalid(
    'authority_promotion_forbidden',
    '$.authorityBoundary',
  )
  if (
    draft.measurementPolicy.mayGenerateOrConditionIdentity !== false
    || draft.measurementPolicy
      .mayApproveLikenessOrHistoricalIdentity !== false
    || draft.measurementPolicy.embeddingBytesSerializable !== false
    || draft.measurementPolicy.embeddingPersistenceAllowed !== false
    || draft.measurementPolicy
      .identityReferencePersistenceAllowed !== false
    || draft.measurementPolicy
      .universalSimilarityThresholdAllowed !== false
    || draft.bundleSummary.measurementOnly !== true
    || draft.bundleSummary.genderOrAgeModelIncluded !== false
    || draft.bundleSummary.identityGenerationAdapterIncluded !== false
  ) throw invalid(
    'measurement_scope_invalid',
    '$.measurementPolicy',
  )
  if (
    draft.safetyPolicy.provenanceAndTrainingDataRightsUnresolved
      !== true
    || draft.safetyPolicy.paidProductionUseApproved !== false
  ) throw invalid('safety_boundary_invalid', '$.safetyPolicy')
  if (
    draft.costLineage.separateCpuContinuityMeasurementAttempt
      !== true
    || draft.costLineage.excludedFromSharedComfyuiGpuAttempt
      !== true
    || draft.costLineage.costAmountIncluded !== false
    || draft.costLineage.customerPriceOrCreditIncluded !== false
    || draft.costLineage.serviceFeeIncluded !== false
  ) throw invalid('cost_boundary_invalid', '$.costLineage')
  const serialized = canonicalJson(draft).toLowerCase()
  for (const forbidden of [
    'https://',
    'http://',
    'file://',
    'data:',
    '/tmp/',
    'sk-',
    'begin private key',
    '"embeddingbytes"',
    '"identityreference"',
    '"priceusd"',
    '"customercredits"',
    '"servicefee"',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    if (serialized.includes(forbidden)) {
      throw invalid('unsafe_payload_forbidden', '$')
    }
  }
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (
      typeof value === 'number'
      && Number.isFinite(value)
    )
  ) return value
  throw new TypeError('non-JSON value')
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return canonicalJson(Object.keys(value).sort())
    === canonicalJson([...keys].sort())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}

function invalid(
  code: LivingFrameAuraFaceArtifactRequirementsIssueCode,
  path: string,
): LivingFrameAuraFaceArtifactRequirementsError {
  if (
    !(
      LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_ISSUES as
        readonly string[]
    ).includes(code)
  ) throw new TypeError('unknown issue code')
  return new LivingFrameAuraFaceArtifactRequirementsError([
    { code, path },
  ])
}
