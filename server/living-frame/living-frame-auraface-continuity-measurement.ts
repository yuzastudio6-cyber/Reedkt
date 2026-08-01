import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_CLASS,
  LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_EVIDENCE_CLASSES,
  LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_ISSUES,
  LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES,
  LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_VERSION,
  type LivingFrameAuraFaceContinuityMeasurement,
  type LivingFrameAuraFaceContinuityMeasurementAuthority,
  type LivingFrameAuraFaceContinuityMeasurementDraft,
  type LivingFrameAuraFaceContinuityMeasurementEvidenceClass,
  type LivingFrameAuraFaceContinuityMeasurementIssue,
  type LivingFrameAuraFaceContinuityMeasurementIssueCode,
} from '../../src/types/living-frame-auraface-continuity-measurement'
import type {
  LivingFrameAuraFaceArtifactRequirements,
} from '../../src/types/living-frame-auraface-artifact-requirements'
import {
  verifyLivingFrameAuraFaceArtifactRequirements,
} from './living-frame-auraface-artifact-requirements'

const SHA256 = /^[a-f0-9]{64}$/u
const EMBEDDING_DIMENSION = 512
const SCORE_SCALE = 1_000_000

export interface LivingFrameAuraFacePrivateEmbeddingPacket {
  readonly packetClass:
    | 'server_owned_controlled_auraface_embedding_fixture_packet_v1'
    | 'process_bound_private_auraface_cpu_embedding_packet_v1'
  readonly evidenceClass:
    LivingFrameAuraFaceContinuityMeasurementEvidenceClass
  readonly artifactRequirementSetDigestSha256: string
  readonly referenceArtifactDigestSha256: string
  readonly candidateArtifactDigestSha256: string
  readonly referenceContinuityEntryDigestSha256: string
  readonly candidateContinuityEntryDigestSha256: string
  readonly preprocessingSpecDigestSha256: string
  readonly referenceInferenceOutputDigestSha256: string
  readonly candidateInferenceOutputDigestSha256: string
  readonly referenceFaceCount: 1
  readonly candidateFaceCount: 1
  readonly embeddingDimension: 512
  readonly referenceEmbedding: Float32Array
  readonly candidateEmbedding: Float32Array
  readonly controlledFixtureOnly: boolean
  readonly callerThresholdAccepted: false
  readonly callerBytesPathUrlOrCredentialAccepted: false
  readonly liveInferenceAuthority: false
  readonly identityApprovalAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
}

export interface LivingFrameAuraFacePrivateEmbeddingReader {
  readonly readerVersion:
    'living-frame-auraface-private-embedding-reader-v1'
  readonly readerClass:
    | 'process_bound_server_owned_controlled_embedding_fixture_reader'
    | 'process_bound_private_auraface_cpu_embedding_reader'
  readonly evidenceClass:
    LivingFrameAuraFaceContinuityMeasurementEvidenceClass
  readonly binding: {
    readonly artifactRequirementSetDigestSha256: string
    readonly referenceArtifactDigestSha256: string
    readonly candidateArtifactDigestSha256: string
    readonly referenceContinuityEntryDigestSha256: string
    readonly candidateContinuityEntryDigestSha256: string
    readonly preprocessingSpecDigestSha256: string
    readonly referenceInferenceOutputDigestSha256: string
    readonly candidateInferenceOutputDigestSha256: string
    readonly readerBindingDigestSha256: string
  }
  readonly callerEmbeddingAccepted: false
  readonly callerThresholdAccepted: false
  readonly callerPathOrUrlAccepted: false
  readonly credentialsIncluded: false
  readonly browserShareable: false
  readonly liveInferenceAuthority: false
  readonly identityApprovalAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
  readServerOwnedEmbeddingFixture():
    Promise<LivingFrameAuraFacePrivateEmbeddingPacket>
}

const AUTHORITY_BOUNDARY:
  LivingFrameAuraFaceContinuityMeasurementAuthority =
  deepFreeze({
    processBoundEmbeddingReadAuthority: true,
    controlledVectorMathAuthority: true,
    liveInferenceAuthority: false,
    modelArtifactAuthority: false,
    operationAuthority: false,
    providerAuthority: false,
    dispatchAuthority: false,
    workerCompletionAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    serviceFeeAuthority: false,
    consentAuthority: false,
    identityVerificationAuthority: false,
    likenessApprovalAuthority: false,
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
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const authoritySchema = z.object({
  processBoundEmbeddingReadAuthority: z.literal(true),
  controlledVectorMathAuthority: z.literal(true),
  liveInferenceAuthority: z.literal(false),
  modelArtifactAuthority: z.literal(false),
  operationAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  workerCompletionAuthority: z.literal(false),
  actualCostAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  serviceFeeAuthority: z.literal(false),
  consentAuthority: z.literal(false),
  identityVerificationAuthority: z.literal(false),
  likenessApprovalAuthority: z.literal(false),
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
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const draftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_CLASS,
  ),
  evidenceClass: z.enum(
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_EVIDENCE_CLASSES,
  ),
  measurementId: z.string().regex(
    /^lfaurameas_[a-f0-9]{40}$/u,
  ),
  sourceBindings: z.object({
    artifactRequirementSetDigestSha256: z.string().regex(SHA256),
    readerBindingDigestSha256: z.string().regex(SHA256),
    referenceArtifactDigestSha256: z.string().regex(SHA256),
    candidateArtifactDigestSha256: z.string().regex(SHA256),
    referenceContinuityEntryDigestSha256: z.string().regex(SHA256),
    candidateContinuityEntryDigestSha256: z.string().regex(SHA256),
    preprocessingSpecDigestSha256: z.string().regex(SHA256),
    referenceInferenceOutputDigestSha256: z.string().regex(SHA256),
    candidateInferenceOutputDigestSha256: z.string().regex(SHA256),
  }).strict(),
  measurement: z.object({
    metric: z.literal('cosine_similarity'),
    embeddingDimension: z.literal(512),
    scoreScale: z.literal(1_000_000),
    scorePpm: z.number().int().min(-1_000_000).max(1_000_000),
    minimumScorePpm: z.literal(-1_000_000),
    maximumScorePpm: z.literal(1_000_000),
    referenceFaceCount: z.literal(1),
    candidateFaceCount: z.literal(1),
    normalizedBeforeComparison: z.literal(true),
    callerThresholdAccepted: z.literal(false),
    thresholdApplied: z.literal(false),
    universalThresholdAllowed: z.literal(false),
    projectCalibratedThresholdRequired: z.literal(true),
    outcome: z.literal(
      'measurement_only_project_calibration_and_user_review_required',
    ),
    identityOrLikenessApproved: z.literal(false),
    canonicalIllustrativeInterpretationRemainsIllustrative:
      z.literal(true),
  }).strict(),
  privacyBoundary: z.object({
    privateServerOnly: z.literal(true),
    browserShareable: z.literal(false),
    rawImagesIncluded: z.literal(false),
    embeddingsIncluded: z.literal(false),
    embeddingBytesSerializable: z.literal(false),
    embeddingPersistenceAuthorized: z.literal(false),
    identityReferencePersistenceAuthorized: z.literal(false),
    measurementPersistenceAuthorized: z.literal(false),
    sensitiveMeasurementEvidence: z.literal(true),
  }).strict(),
  costLineage: z.object({
    separateCpuMeasurementAttemptExpected: z.literal(true),
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
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES,
  )).length(
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES.length,
  ),
  authorityBoundary: authoritySchema,
  processBoundReaderConsumedExactlyOnce: z.literal(true),
  controlledFixtureVectorsCompared: z.boolean(),
  privateRuntimeVectorsComparedUnreleased: z.boolean(),
  liveInferenceExecuted: z.literal(false),
  continuityDecisionCreated: z.literal(false),
  containsEmbeddingImagePathUrlCredentialOrIdentityReference:
    z.literal(false),
  containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    z.literal(false),
  subjectSpecificRouting: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const resultSchema = draftSchema.extend({
  measurementDigestSha256: z.string().regex(SHA256),
}).strict()

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()

export class LivingFrameAuraFaceContinuityMeasurementError
  extends Error {
  readonly issues:
    readonly LivingFrameAuraFaceContinuityMeasurementIssue[]

  constructor(
    issues:
      readonly LivingFrameAuraFaceContinuityMeasurementIssue[],
  ) {
    super('Living Frame AuraFace continuity measurement failed.')
    this.name =
      'LivingFrameAuraFaceContinuityMeasurementError'
    this.issues = issues
  }
}

export function createLivingFrameAuraFacePrivateEmbeddingReader(
  input: {
    readonly artifactRequirements:
      LivingFrameAuraFaceArtifactRequirements
    readonly evidenceClass:
      LivingFrameAuraFaceContinuityMeasurementEvidenceClass
    readonly referenceArtifactDigestSha256: string
    readonly candidateArtifactDigestSha256: string
    readonly referenceContinuityEntryDigestSha256: string
    readonly candidateContinuityEntryDigestSha256: string
    readonly preprocessingSpecDigestSha256: string
    readonly referenceInferenceOutputDigestSha256: string
    readonly candidateInferenceOutputDigestSha256: string
    readonly readServerOwnedEmbeddingFixture:
      LivingFrameAuraFacePrivateEmbeddingReader[
        'readServerOwnedEmbeddingFixture'
      ]
  },
): LivingFrameAuraFacePrivateEmbeddingReader {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'artifactRequirements',
      'evidenceClass',
      'referenceArtifactDigestSha256',
      'candidateArtifactDigestSha256',
      'referenceContinuityEntryDigestSha256',
      'candidateContinuityEntryDigestSha256',
      'preprocessingSpecDigestSha256',
      'referenceInferenceOutputDigestSha256',
      'candidateInferenceOutputDigestSha256',
      'readServerOwnedEmbeddingFixture',
    ])
    || !verifyLivingFrameAuraFaceArtifactRequirements(
      input.artifactRequirements,
    )
    || !(
      LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_EVIDENCE_CLASSES as
        readonly string[]
    ).includes(input.evidenceClass)
    || !allSha256([
      input.referenceArtifactDigestSha256,
      input.candidateArtifactDigestSha256,
      input.referenceContinuityEntryDigestSha256,
      input.candidateContinuityEntryDigestSha256,
      input.preprocessingSpecDigestSha256,
      input.referenceInferenceOutputDigestSha256,
      input.candidateInferenceOutputDigestSha256,
    ])
    || typeof input.readServerOwnedEmbeddingFixture !== 'function'
  ) throw invalid('reader_invalid', '$.embeddingReader')

  const bindingDraft = {
    artifactRequirementSetDigestSha256:
      input.artifactRequirements.requirementSetDigestSha256,
    referenceArtifactDigestSha256:
      input.referenceArtifactDigestSha256,
    candidateArtifactDigestSha256:
      input.candidateArtifactDigestSha256,
    referenceContinuityEntryDigestSha256:
      input.referenceContinuityEntryDigestSha256,
    candidateContinuityEntryDigestSha256:
      input.candidateContinuityEntryDigestSha256,
    preprocessingSpecDigestSha256:
      input.preprocessingSpecDigestSha256,
    referenceInferenceOutputDigestSha256:
      input.referenceInferenceOutputDigestSha256,
    candidateInferenceOutputDigestSha256:
      input.candidateInferenceOutputDigestSha256,
  }
  const reader:
    LivingFrameAuraFacePrivateEmbeddingReader =
    Object.freeze({
      readerVersion:
        'living-frame-auraface-private-embedding-reader-v1',
      readerClass:
        input.evidenceClass
          === 'controlled_non_promotable_embedding_fixture'
          ? 'process_bound_server_owned_controlled_embedding_fixture_reader'
          : 'process_bound_private_auraface_cpu_embedding_reader',
      evidenceClass: input.evidenceClass,
      binding: Object.freeze({
        ...bindingDraft,
        readerBindingDigestSha256: digest(bindingDraft),
      }),
      callerEmbeddingAccepted: false,
      callerThresholdAccepted: false,
      callerPathOrUrlAccepted: false,
      credentialsIncluded: false,
      browserShareable: false,
      liveInferenceAuthority: false,
      identityApprovalAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
      readServerOwnedEmbeddingFixture:
        input.readServerOwnedEmbeddingFixture.bind(undefined),
    })
  readers.add(reader)
  return reader
}

export async function createLivingFrameAuraFaceContinuityMeasurement(
  input: {
    readonly artifactRequirements:
      LivingFrameAuraFaceArtifactRequirements
    readonly embeddingReader:
      LivingFrameAuraFacePrivateEmbeddingReader
  },
): Promise<LivingFrameAuraFaceContinuityMeasurement> {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'artifactRequirements',
      'embeddingReader',
    ])
    || !verifyLivingFrameAuraFaceArtifactRequirements(
      input.artifactRequirements,
    )
  ) throw invalid('input_invalid', '$')
  const reader = requireReader(
    input.embeddingReader,
    input.artifactRequirements,
  )
  consumedReaders.add(reader)
  let packetValue: LivingFrameAuraFacePrivateEmbeddingPacket
  try {
    packetValue =
      await reader.readServerOwnedEmbeddingFixture()
  } catch {
    throw invalid('reader_failed', '$.embeddingReader')
  }
  const packet = assertPacket(packetValue, reader)
  const referenceEmbedding = copyAndValidateEmbedding(
    packet.referenceEmbedding,
    '$.embeddingPacket.referenceEmbedding',
  )
  const candidateEmbedding = copyAndValidateEmbedding(
    packet.candidateEmbedding,
    '$.embeddingPacket.candidateEmbedding',
  )
  const scorePpm = cosineSimilarityPpm(
    referenceEmbedding,
    candidateEmbedding,
  )
  const bindings = reader.binding
  const measurementId =
    `lfaurameas_${digest({
      requirements:
        bindings.artifactRequirementSetDigestSha256,
      reference: bindings.referenceInferenceOutputDigestSha256,
      candidate: bindings.candidateInferenceOutputDigestSha256,
      reader: bindings.readerBindingDigestSha256,
      scorePpm,
    }).slice(0, 40)}`
  const draft: LivingFrameAuraFaceContinuityMeasurementDraft = {
    contractVersion:
      LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_VERSION,
    resultClass:
      LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_CLASS,
    evidenceClass: reader.evidenceClass,
    measurementId,
    sourceBindings: {
      artifactRequirementSetDigestSha256:
        bindings.artifactRequirementSetDigestSha256,
      readerBindingDigestSha256:
        bindings.readerBindingDigestSha256,
      referenceArtifactDigestSha256:
        bindings.referenceArtifactDigestSha256,
      candidateArtifactDigestSha256:
        bindings.candidateArtifactDigestSha256,
      referenceContinuityEntryDigestSha256:
        bindings.referenceContinuityEntryDigestSha256,
      candidateContinuityEntryDigestSha256:
        bindings.candidateContinuityEntryDigestSha256,
      preprocessingSpecDigestSha256:
        bindings.preprocessingSpecDigestSha256,
      referenceInferenceOutputDigestSha256:
        bindings.referenceInferenceOutputDigestSha256,
      candidateInferenceOutputDigestSha256:
        bindings.candidateInferenceOutputDigestSha256,
    },
    measurement: {
      metric: 'cosine_similarity',
      embeddingDimension: 512,
      scoreScale: 1_000_000,
      scorePpm,
      minimumScorePpm: -1_000_000,
      maximumScorePpm: 1_000_000,
      referenceFaceCount: 1,
      candidateFaceCount: 1,
      normalizedBeforeComparison: true,
      callerThresholdAccepted: false,
      thresholdApplied: false,
      universalThresholdAllowed: false,
      projectCalibratedThresholdRequired: true,
      outcome:
        'measurement_only_project_calibration_and_user_review_required',
      identityOrLikenessApproved: false,
      canonicalIllustrativeInterpretationRemainsIllustrative: true,
    },
    privacyBoundary: {
      privateServerOnly: true,
      browserShareable: false,
      rawImagesIncluded: false,
      embeddingsIncluded: false,
      embeddingBytesSerializable: false,
      embeddingPersistenceAuthorized: false,
      identityReferencePersistenceAuthorized: false,
      measurementPersistenceAuthorized: false,
      sensitiveMeasurementEvidence: true,
    },
    costLineage: {
      separateCpuMeasurementAttemptExpected: true,
      excludedFromSharedComfyuiGpuAttempt: true,
      exactReuseAddsNoAttempt: true,
      actualAttemptCostOwnedByExistingToolCostAuthority: true,
      failedOrUnknownAttemptCostMustBeRetained: true,
      costAmountIncluded: false,
      customerPriceOrCreditIncluded: false,
      serviceFeeIncluded: false,
    },
    openGateCodes:
      LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    processBoundReaderConsumedExactlyOnce: true,
    controlledFixtureVectorsCompared:
      reader.evidenceClass
        === 'controlled_non_promotable_embedding_fixture',
    privateRuntimeVectorsComparedUnreleased:
      reader.evidenceClass
        === 'private_internal_auraface_cpu_embedding_observation_unreleased',
    liveInferenceExecuted: false,
    continuityDecisionCreated: false,
    containsEmbeddingImagePathUrlCredentialOrIdentityReference: false,
    containsPriceCreditServiceFeeReservationWalletOrLedgerData: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    measurementDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameAuraFaceContinuityMeasurement(
  value: unknown,
): value is LivingFrameAuraFaceContinuityMeasurement {
  try {
    const parsed = resultSchema.safeParse(value)
    if (!parsed.success) return false
    const { measurementDigestSha256, ...draft } = parsed.data
    assertDraft(draft)
    return digest(draft) === measurementDigestSha256
  } catch {
    return false
  }
}

function requireReader(
  value: LivingFrameAuraFacePrivateEmbeddingReader,
  requirements: LivingFrameAuraFaceArtifactRequirements,
): LivingFrameAuraFacePrivateEmbeddingReader {
  if (
    !isRecord(value)
    || !readers.has(value)
    || consumedReaders.has(value)
    || value.binding.artifactRequirementSetDigestSha256
      !== requirements.requirementSetDigestSha256
    || value.callerEmbeddingAccepted !== false
    || value.callerThresholdAccepted !== false
    || value.liveInferenceAuthority !== false
    || value.identityApprovalAuthority !== false
    || value.actualCostAuthority !== false
    || value.productionReady !== false
    || digest({
      artifactRequirementSetDigestSha256:
        value.binding.artifactRequirementSetDigestSha256,
      referenceArtifactDigestSha256:
        value.binding.referenceArtifactDigestSha256,
      candidateArtifactDigestSha256:
        value.binding.candidateArtifactDigestSha256,
      referenceContinuityEntryDigestSha256:
        value.binding.referenceContinuityEntryDigestSha256,
      candidateContinuityEntryDigestSha256:
        value.binding.candidateContinuityEntryDigestSha256,
      preprocessingSpecDigestSha256:
        value.binding.preprocessingSpecDigestSha256,
      referenceInferenceOutputDigestSha256:
        value.binding.referenceInferenceOutputDigestSha256,
      candidateInferenceOutputDigestSha256:
        value.binding.candidateInferenceOutputDigestSha256,
    }) !== value.binding.readerBindingDigestSha256
  ) throw invalid(
    consumedReaders.has(value)
      ? 'reader_reused'
      : 'reader_invalid',
    '$.embeddingReader',
  )
  return value
}

function assertPacket(
  value: LivingFrameAuraFacePrivateEmbeddingPacket,
  reader: LivingFrameAuraFacePrivateEmbeddingReader,
): LivingFrameAuraFacePrivateEmbeddingPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'evidenceClass',
      'artifactRequirementSetDigestSha256',
      'referenceArtifactDigestSha256',
      'candidateArtifactDigestSha256',
      'referenceContinuityEntryDigestSha256',
      'candidateContinuityEntryDigestSha256',
      'preprocessingSpecDigestSha256',
      'referenceInferenceOutputDigestSha256',
      'candidateInferenceOutputDigestSha256',
      'referenceFaceCount',
      'candidateFaceCount',
      'embeddingDimension',
      'referenceEmbedding',
      'candidateEmbedding',
      'controlledFixtureOnly',
      'callerThresholdAccepted',
      'callerBytesPathUrlOrCredentialAccepted',
      'liveInferenceAuthority',
      'identityApprovalAuthority',
      'actualCostAuthority',
      'productionReady',
    ])
    || ![
      'server_owned_controlled_auraface_embedding_fixture_packet_v1',
      'process_bound_private_auraface_cpu_embedding_packet_v1',
    ].includes(value.packetClass)
    || value.evidenceClass !== reader.evidenceClass
    || value.controlledFixtureOnly
      !== (
        value.evidenceClass
          === 'controlled_non_promotable_embedding_fixture'
      )
    || (
      value.controlledFixtureOnly
      && value.packetClass
        !== 'server_owned_controlled_auraface_embedding_fixture_packet_v1'
    )
    || (
      !value.controlledFixtureOnly
      && value.packetClass
        !== 'process_bound_private_auraface_cpu_embedding_packet_v1'
    )
    || value.callerThresholdAccepted !== false
    || value.callerBytesPathUrlOrCredentialAccepted !== false
    || value.liveInferenceAuthority !== false
    || value.identityApprovalAuthority !== false
    || value.actualCostAuthority !== false
    || value.productionReady !== false
  ) throw invalid('packet_invalid', '$.embeddingPacket')
  const binding = reader.binding
  if (
    value.artifactRequirementSetDigestSha256
      !== binding.artifactRequirementSetDigestSha256
    || value.referenceArtifactDigestSha256
      !== binding.referenceArtifactDigestSha256
    || value.candidateArtifactDigestSha256
      !== binding.candidateArtifactDigestSha256
    || value.referenceContinuityEntryDigestSha256
      !== binding.referenceContinuityEntryDigestSha256
    || value.candidateContinuityEntryDigestSha256
      !== binding.candidateContinuityEntryDigestSha256
    || value.preprocessingSpecDigestSha256
      !== binding.preprocessingSpecDigestSha256
    || value.referenceInferenceOutputDigestSha256
      !== binding.referenceInferenceOutputDigestSha256
    || value.candidateInferenceOutputDigestSha256
      !== binding.candidateInferenceOutputDigestSha256
  ) throw invalid(
    'packet_lineage_invalid',
    '$.embeddingPacket',
  )
  if (
    value.referenceFaceCount !== 1
    || value.candidateFaceCount !== 1
  ) throw invalid(
    'face_count_invalid',
    '$.embeddingPacket',
  )
  if (value.embeddingDimension !== EMBEDDING_DIMENSION) {
    throw invalid(
      'embedding_dimension_invalid',
      '$.embeddingPacket.embeddingDimension',
    )
  }
  return value
}

function copyAndValidateEmbedding(
  value: unknown,
  path: string,
): Float32Array {
  if (!(value instanceof Float32Array)) {
    throw invalid('embedding_type_invalid', path)
  }
  if (
    typeof SharedArrayBuffer !== 'undefined'
    && value.buffer instanceof SharedArrayBuffer
  ) throw invalid('embedding_buffer_forbidden', path)
  if (value.length !== EMBEDDING_DIMENSION) {
    throw invalid('embedding_dimension_invalid', path)
  }
  const copy = new Float32Array(value)
  let normSquared = 0
  for (const component of copy) {
    if (!Number.isFinite(component)) {
      throw invalid('embedding_value_invalid', path)
    }
    normSquared += component * component
  }
  if (!Number.isFinite(normSquared) || normSquared <= 0) {
    throw invalid('embedding_zero_norm', path)
  }
  return copy
}

function cosineSimilarityPpm(
  reference: Float32Array,
  candidate: Float32Array,
): number {
  let dot = 0
  let referenceNormSquared = 0
  let candidateNormSquared = 0
  for (let index = 0; index < EMBEDDING_DIMENSION; index += 1) {
    const left = reference[index]
    const right = candidate[index]
    dot += left * right
    referenceNormSquared += left * left
    candidateNormSquared += right * right
  }
  const denominator =
    Math.sqrt(referenceNormSquared)
    * Math.sqrt(candidateNormSquared)
  const similarity = dot / denominator
  if (!Number.isFinite(similarity)) {
    throw invalid('measurement_invalid', '$.measurement')
  }
  const clamped = Math.max(-1, Math.min(1, similarity))
  const scaled = Math.round(clamped * SCORE_SCALE)
  return Object.is(scaled, -0) ? 0 : scaled
}

function assertDraft(
  draft: LivingFrameAuraFaceContinuityMeasurementDraft,
): void {
  if (!draftSchema.safeParse(draft).success) {
    throw invalid('measurement_invalid', '$')
  }
  if (
    canonicalJson(draft.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || draft.liveInferenceExecuted !== false
    || draft.continuityDecisionCreated !== false
    || draft.productionReady !== false
    || draft.controlledFixtureVectorsCompared
      === draft.privateRuntimeVectorsComparedUnreleased
  ) throw invalid(
    'authority_promotion_forbidden',
    '$.authorityBoundary',
  )
  if (
    canonicalJson(draft.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES,
      )
  ) throw invalid('measurement_invalid', '$.openGateCodes')
  if (
    draft.privacyBoundary.privateServerOnly !== true
    || draft.privacyBoundary.browserShareable !== false
    || draft.privacyBoundary.embeddingsIncluded !== false
    || draft.privacyBoundary.embeddingBytesSerializable !== false
    || draft.privacyBoundary.embeddingPersistenceAuthorized !== false
    || draft.privacyBoundary
      .identityReferencePersistenceAuthorized !== false
    || draft.privacyBoundary.measurementPersistenceAuthorized !== false
  ) throw invalid(
    'privacy_boundary_invalid',
    '$.privacyBoundary',
  )
  if (
    draft.costLineage.separateCpuMeasurementAttemptExpected
      !== true
    || draft.costLineage.excludedFromSharedComfyuiGpuAttempt
      !== true
    || draft.costLineage.costAmountIncluded !== false
    || draft.costLineage.customerPriceOrCreditIncluded !== false
    || draft.costLineage.serviceFeeIncluded !== false
  ) throw invalid('cost_boundary_invalid', '$.costLineage')
  if (
    draft.measurement.callerThresholdAccepted !== false
    || draft.measurement.thresholdApplied !== false
    || draft.measurement.universalThresholdAllowed !== false
    || draft.measurement.identityOrLikenessApproved !== false
  ) throw invalid('measurement_invalid', '$.measurement')
  const serialized = canonicalJson(draft).toLowerCase()
  for (const forbidden of [
    'https://',
    'http://',
    'file://',
    'data:',
    '/tmp/',
    'sk-',
    'begin private key',
    '"embedding"',
    '"referenceimage"',
    '"identityreference"',
    '"priceusd"',
    '"customercredits"',
    '"servicefee"',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    if (serialized.includes(forbidden)) {
      throw invalid('unsafe_result_forbidden', '$')
    }
  }
}

function allSha256(values: readonly unknown[]): boolean {
  return values.every(
    (value) => typeof value === 'string' && SHA256.test(value),
  )
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
  code: LivingFrameAuraFaceContinuityMeasurementIssueCode,
  path: string,
): LivingFrameAuraFaceContinuityMeasurementError {
  if (
    !(
      LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_ISSUES as
        readonly string[]
    ).includes(code)
  ) throw new TypeError('unknown issue code')
  return new LivingFrameAuraFaceContinuityMeasurementError([
    { code, path },
  ])
}
