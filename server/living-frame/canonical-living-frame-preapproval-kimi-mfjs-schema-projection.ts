import { z } from 'zod'

import {
  createLivingFrameSemanticSceneProposalJsonSchema,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-contract'
import {
  verifyCanonicalLivingFramePreapprovalKimiApiCompatibility,
  verifyCanonicalLivingFramePreapprovalKimiApiContractObservation,
  type CanonicalLivingFramePreapprovalKimiApiCompatibility,
  type CanonicalLivingFramePreapprovalKimiApiContractObservation,
} from './canonical-living-frame-preapproval-kimi-api-contract-observation'
import {
  verifyCanonicalLivingFramePreapprovalKimiRequestMaterial,
  type CanonicalLivingFramePreapprovalKimiRequestMaterial,
} from './canonical-living-frame-preapproval-kimi-request-material'
import {
  type CanonicalLivingFramePreapprovalReasoningAttemptReservation,
} from './canonical-living-frame-preapproval-reasoning-attempt-reservation'
import {
  type CanonicalLivingFramePreapprovalReasoningRun,
} from './canonical-living-frame-preapproval-reasoning-lifecycle'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_SCHEMA_PROJECTION_VERSION =
  'canonical-living-frame-preapproval-kimi-mfjs-schema-projection-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_PROJECTION_ALGORITHM =
  'replace_const_with_singleton_enum_and_defer_pattern_to_canonical_acceptance_v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_OBSERVED_AT =
  '2026-07-27T21:10:16.000Z' as const

const EXPECTED_CANONICAL_SCHEMA_DIGEST_SHA256 =
  '8f59cebee2f24d4c46b97e9f06ec2063f10ec0fa5f4983fdc02a52f99630b686'
const EXPECTED_CANONICAL_SCHEMA_BYTE_LENGTH = 16_284
const EXPECTED_PROVIDER_SCHEMA_DIGEST_SHA256 =
  'ad37256789c35be7a482caac420d7b3f1b5775f49fa4da05731684bc2d44635c'
const EXPECTED_PROVIDER_SCHEMA_BYTE_LENGTH = 15_145
const EXPECTED_SOURCE_CONST_COUNT = 13
const EXPECTED_SOURCE_PATTERN_COUNT = 24
const EXPECTED_SOURCE_ENUM_COUNT = 39
const EXPECTED_PROVIDER_ENUM_COUNT = 52

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const jsonSchemaObjectSchema = z.record(z.string(), z.unknown())

const VALIDATOR_SOURCE_ARTIFACTS = [
  {
    artifactId: 'readme',
    repositoryPath: 'README.md',
    byteLength: 5_245,
    sha256:
      '234a350f35e3bfabd626438a4db9892d4496e56049a234f800ed8056e0a0282a',
  },
  {
    artifactId: 'mfjs_spec',
    repositoryPath: 'docs/mfjs-spec.md',
    byteLength: 15_581,
    sha256:
      '2a9923c6c5990eea385c149862a5dcffb695f2386a2cab9e33dec0406b315619',
  },
  {
    artifactId: 'mfjs_comparison',
    repositoryPath: 'docs/mfjs-walle-vs-draft-2020-12.md',
    byteLength: 5_576,
    sha256:
      '416c54384ec83e1fb2773d39b253517e46922e639b9c766ef46353c91c06d5eb',
  },
  {
    artifactId: 'validator_rules',
    repositoryPath: 'docs/walle.md',
    byteLength: 5_313,
    sha256:
      'd34780ca6b869a9e9f503055673322af20f407ed6f5608d772669524a506d20c',
  },
  {
    artifactId: 'go_module',
    repositoryPath: 'go.mod',
    byteLength: 493,
    sha256:
      '407aab59099c8d2cb974d284be0ba3fc76b38e4d253411c99be5271ce3031985',
  },
  {
    artifactId: 'go_module_sums',
    repositoryPath: 'go.sum',
    byteLength: 2_342,
    sha256:
      '3cd7ff302a608dca584755d6f60840cd278a6e5018ceb26dd1f66c22a338fb54',
  },
  {
    artifactId: 'library_entry',
    repositoryPath: 'walle.go',
    byteLength: 761,
    sha256:
      '91512a0930be9b81d662db0d18470a70198f0475091eb1e530e16a46bb839c36',
  },
  {
    artifactId: 'validator',
    repositoryPath: 'validator.go',
    byteLength: 34_359,
    sha256:
      '1b7690d4daf0465b97ef81d663a508f6fa8e04e696424dbe4b3af28e177c05cb',
  },
  {
    artifactId: 'keyword_validators',
    repositoryPath: 'keyword_validators.go',
    byteLength: 21_954,
    sha256:
      'b1a9e4ea584caff2b60eae9ccde9c506c95bac749de361182f2a0f769fae37f6',
  },
  {
    artifactId: 'schema_model',
    repositoryPath: 'model.go',
    byteLength: 3_984,
    sha256:
      'f64d4b2947b4b2fb116b1e23baf43c4b4be863dd31b79ddd054f3048ef7276d6',
  },
  {
    artifactId: 'validator_config',
    repositoryPath: 'conf.go',
    byteLength: 3_983,
    sha256:
      'e615693b3f47f66b3f0e32cd5671709e91d557a9e16a265fa650522f6be6d983',
  },
  {
    artifactId: 'cli_entry',
    repositoryPath: 'cmd/walle/main.go',
    byteLength: 4_376,
    sha256:
      '9a275389e0ecc50ff56f73fbf53ded7757d972cea1740f5c2c20d1ffd1780c7e',
  },
] as const

const validatorArtifactIdSchema = z.enum([
  'readme',
  'mfjs_spec',
  'mfjs_comparison',
  'validator_rules',
  'go_module',
  'go_module_sums',
  'library_entry',
  'validator',
  'keyword_validators',
  'schema_model',
  'validator_config',
  'cli_entry',
])

const validatorSourceArtifactSchema = z.object({
  artifactId: validatorArtifactIdSchema,
  repositoryPath: z.string().min(1).max(128),
  byteLength: z.number().int().positive().max(1_000_000),
  sha256: sha256Schema,
}).strict()

const authorityBoundarySchema = z.object({
  deterministicProviderSchemaProjectionAuthority: z.literal(true),
  controlledStaticValidatorObservationAuthority: z.literal(true),
  currentValidatorSourceAuthorityAtTransport: z.literal(false),
  canonicalAcceptanceSchemaAuthority: z.literal(false),
  providerSchemaCompatibilityAuthority: z.literal(false),
  liveTargetSchemaProbeAuthority: z.literal(false),
  completionTokenCeilingAuthority: z.literal(false),
  providerApiContractQualificationAuthority: z.literal(false),
  providerModelRevisionQualificationAuthority: z.literal(false),
  providerRequestBodyAuthority: z.literal(false),
  providerRequestReservationAuthority: z.literal(false),
  oneUseSubmissionAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerObservationAuthority: z.literal(false),
  providerAttemptCostAuthority: z.literal(false),
  fallbackAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_SCHEMA_PROJECTION_BOUNDARY =
  Object.freeze({
    deterministicProviderSchemaProjectionAuthority: true as const,
    controlledStaticValidatorObservationAuthority: true as const,
    currentValidatorSourceAuthorityAtTransport: false as const,
    canonicalAcceptanceSchemaAuthority: false as const,
    providerSchemaCompatibilityAuthority: false as const,
    liveTargetSchemaProbeAuthority: false as const,
    completionTokenCeilingAuthority: false as const,
    providerApiContractQualificationAuthority: false as const,
    providerModelRevisionQualificationAuthority: false as const,
    providerRequestBodyAuthority: false as const,
    providerRequestReservationAuthority: false as const,
    oneUseSubmissionAuthority: false as const,
    providerTransportAuthority: false as const,
    providerCredentialAuthority: false as const,
    providerCallAuthority: false as const,
    providerObservationAuthority: false as const,
    providerAttemptCostAuthority: false as const,
    fallbackAuthority: false as const,
    customerPriceAuthority: false as const,
    customerCreditAuthority: false as const,
    approvalAuthority: false as const,
    snapshotAuthority: false as const,
    workGraphAuthority: false as const,
    queueAuthority: false as const,
    renderAuthority: false as const,
    runtimeAuthority: false as const,
    productionReady: false as const,
  })

const projectionDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_SCHEMA_PROJECTION_VERSION,
  ),
  recordClass: z.literal(
    'controlled_kimi_mfjs_provider_schema_projection',
  ),
  state: z.literal(
    'static_mfjs_projection_validated_transport_blocked',
  ),
  observedAt: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_OBSERVED_AT,
  ),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  canonicalBindings: z.object({
    requestMaterialRecordDigestSha256: sha256Schema,
    apiObservationRecordDigestSha256: sha256Schema,
    apiCompatibilityRecordDigestSha256: sha256Schema,
    canonicalAcceptanceJsonSchemaDigestSha256: sha256Schema,
    providerMfjsJsonSchemaDigestSha256: sha256Schema,
  }).strict(),
  schemaProjection: z.object({
    algorithmId: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_PROJECTION_ALGORITHM,
    ),
    schemaName: z.literal(
      'living_frame_semantic_scene_proposal_result_v1',
    ),
    canonicalAcceptanceJsonSchemaByteLength:
      z.literal(EXPECTED_CANONICAL_SCHEMA_BYTE_LENGTH),
    providerMfjsJsonSchemaByteLength:
      z.literal(EXPECTED_PROVIDER_SCHEMA_BYTE_LENGTH),
    canonicalAcceptanceJsonSchemaDigestSha256:
      z.literal(EXPECTED_CANONICAL_SCHEMA_DIGEST_SHA256),
    providerMfjsJsonSchemaDigestSha256:
      z.literal(EXPECTED_PROVIDER_SCHEMA_DIGEST_SHA256),
    providerMfjsJsonSchema: jsonSchemaObjectSchema,
    transformationAudit: z.object({
      sourceConstCount: z.literal(EXPECTED_SOURCE_CONST_COUNT),
      constToSingletonEnumCount:
        z.literal(EXPECTED_SOURCE_CONST_COUNT),
      sourcePatternCount:
        z.literal(EXPECTED_SOURCE_PATTERN_COUNT),
      patternsDeferredToCanonicalAcceptanceCount:
        z.literal(EXPECTED_SOURCE_PATTERN_COUNT),
      sourceEnumCount: z.literal(EXPECTED_SOURCE_ENUM_COUNT),
      providerEnumCount:
        z.literal(EXPECTED_PROVIDER_ENUM_COUNT),
      typeShapeChanged: z.literal(false),
      objectPropertyShapeChanged: z.literal(false),
      arrayCardinalityChanged: z.literal(false),
      constSemanticsPreservedBySingletonEnum: z.literal(true),
      patternConstraintsPresentInProviderSchema: z.literal(false),
      providerSchemaIsCanonicalAcceptanceAuthority:
        z.literal(false),
      canonicalPostParseRevalidationRequired: z.literal(true),
    }).strict(),
  }).strict(),
  validatorObservation: z.object({
    observationClass: z.literal(
      'controlled_official_walle_source_and_execution_observation',
    ),
    repositoryUrl: z.literal(
      'https://github.com/MoonshotAI/walle',
    ),
    releaseTag: z.literal('v0.1.13'),
    releasePublishedAt:
      z.literal('2026-06-29T14:05:32.000Z'),
    sourceCommitSha:
      z.literal('196bb0ca9c2f2271cfa9623108308f0780e411ee'),
    sourceTreeSha:
      z.literal('62bd4d8d001ab64d85fa5dfaeb6e6299cfbfe129'),
    sourceArtifacts: z.array(validatorSourceArtifactSchema)
      .length(VALIDATOR_SOURCE_ARTIFACTS.length),
    toolchain: z.object({
      goVersion: z.literal('go1.23.12'),
      platform: z.literal('darwin_arm64'),
      officialArchiveSha256: z.literal(
        '5bfa117e401ae64e7ffb960243c448b535fe007e682a13ff6c7371f4a6f0ccaa',
      ),
      buildFlags: z.tuple([
        z.literal('-trimpath'),
        z.literal('-buildvcs=false'),
      ]),
      observedBinaryByteLength: z.literal(3_575_986),
      observedBinarySha256: z.literal(
        '3bb099fbff27436afd23e5a97760900abf5524194c90b460acbe77cd5d9606b2',
      ),
    }).strict(),
    inputSerialization:
      z.literal('stable_canonical_json_utf8'),
    originalCanonicalSchema: z.object({
      strictLevelPassed: z.literal(true),
      ultraLevelPassed: z.literal(false),
      firstUltraFailureKeyword: z.literal('const'),
      firstUltraFailurePath: z.literal(
        'properties.sceneProposals.items.properties.semanticTimingConstraints.items.properties.exactFramesProvided',
      ),
    }).strict(),
    providerMfjsProjection: z.object({
      strictLevelPassed: z.literal(true),
      ultraLevelPassed: z.literal(true),
      exitCode: z.literal(0),
      stdoutSha256: z.literal(
        '5ec2c661a9602c1b704be3cb355629753835dd3ccf74a92c795d0ba32b8f5158',
      ),
      stderrByteLength: z.literal(0),
    }).strict(),
    validationReexecutedByThisRuntime: z.literal(false),
    currentValidatorSourceRereadRequiredAtTransport:
      z.literal(true),
  }).strict(),
  acceptanceBoundary: z.object({
    constrainedDecodeUsesProviderMfjsProjection: z.literal(true),
    providerOutputParsedFromFinalContentOnly: z.literal(true),
    canonicalAcceptanceSchemaRevalidationRequired: z.literal(true),
    canonicalSemanticCrossValidationRequired: z.literal(true),
    invalidPatternOrAuthorityLiteralStillRejected:
      z.literal(true),
    liveTargetModelProbeCompleted: z.literal(false),
    canonicalMaximumCompletionTokens: z.null(),
    providerRequestBodyCreated: z.literal(false),
    executable: z.literal(false),
  }).strict(),
  runtimeBlockers: z.tuple([
    z.literal('current_official_source_reread_required'),
    z.literal('current_walle_release_reread_required'),
    z.literal('current_account_model_availability_required'),
    z.literal('immutable_provider_model_revision_required'),
    z.literal('live_target_schema_probe_required'),
    z.literal('canonical_completion_token_ceiling_required'),
    z.literal('distributed_one_use_lifecycle_required'),
    z.literal('provider_credential_capability_required'),
    z.literal('unknown_outcome_operator_reconciliation_required'),
  ]),
  browserShareable: z.literal(false),
  providerCallMade: z.literal(false),
  credentialReadMade: z.literal(false),
  remoteMutationMade: z.literal(false),
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const canonicalLivingFramePreapprovalKimiMfjsSchemaProjectionSchema =
  projectionDraftSchema.extend({
    recordDigestSha256: sha256Schema,
  }).strict()

export type CanonicalLivingFramePreapprovalKimiMfjsSchemaProjection =
  z.infer<
    typeof canonicalLivingFramePreapprovalKimiMfjsSchemaProjectionSchema
  >

type ProjectionAudit = {
  sourceConstCount: number
  constToSingletonEnumCount: number
  sourcePatternCount: number
  patternsDeferredToCanonicalAcceptanceCount: number
  sourceEnumCount: number
  providerEnumCount: number
}

const SOURCE_SCHEMA_KEYWORDS = new Set([
  '$defs',
  '$id',
  '$ref',
  'additionalProperties',
  'anyOf',
  'const',
  'default',
  'description',
  'enum',
  'items',
  'maxItems',
  'maxLength',
  'maximum',
  'minItems',
  'minLength',
  'minimum',
  'pattern',
  'properties',
  'required',
  'title',
  'type',
])

export function createCanonicalLivingFramePreapprovalKimiMfjsSchemaProjection(
  input: {
    readonly requestMaterial:
      CanonicalLivingFramePreapprovalKimiRequestMaterial
    readonly preparedRun:
      CanonicalLivingFramePreapprovalReasoningRun
    readonly attemptReservation:
      CanonicalLivingFramePreapprovalReasoningAttemptReservation
    readonly apiObservation:
      CanonicalLivingFramePreapprovalKimiApiContractObservation
    readonly apiCompatibility:
      CanonicalLivingFramePreapprovalKimiApiCompatibility
  },
): CanonicalLivingFramePreapprovalKimiMfjsSchemaProjection {
  const verified = verifyInputs(input)
  const draft = createExpectedDraft(verified)
  return verifyCanonicalLivingFramePreapprovalKimiMfjsSchemaProjection({
    projection: {
      ...draft,
      recordDigestSha256: sha256AuthorityValue(draft),
    },
    ...input,
  })
}

export function verifyCanonicalLivingFramePreapprovalKimiMfjsSchemaProjection(
  input: {
    readonly projection: unknown
    readonly requestMaterial: unknown
    readonly preparedRun:
      CanonicalLivingFramePreapprovalReasoningRun
    readonly attemptReservation:
      CanonicalLivingFramePreapprovalReasoningAttemptReservation
    readonly apiObservation: unknown
    readonly apiCompatibility: unknown
  },
): CanonicalLivingFramePreapprovalKimiMfjsSchemaProjection {
  const projection =
    canonicalLivingFramePreapprovalKimiMfjsSchemaProjectionSchema
      .parse(input.projection)
  const verified = verifyInputs(input)
  const {
    recordDigestSha256,
    ...draft
  } = projection
  const expected = createExpectedDraft(verified)
  if (
    recordDigestSha256 !== sha256AuthorityValue(draft)
    || stableAuthorityStringify(draft) !==
      stableAuthorityStringify(expected)
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_mfjs_schema_projection_invalid',
    )
  }
  return structuredClone(projection)
}

function verifyInputs(input: {
  readonly requestMaterial: unknown
  readonly preparedRun:
    CanonicalLivingFramePreapprovalReasoningRun
  readonly attemptReservation:
    CanonicalLivingFramePreapprovalReasoningAttemptReservation
  readonly apiObservation: unknown
  readonly apiCompatibility: unknown
}) {
  const requestMaterial =
    verifyCanonicalLivingFramePreapprovalKimiRequestMaterial({
      material: input.requestMaterial,
      preparedRun: input.preparedRun,
      attemptReservation: input.attemptReservation,
    })
  const apiObservation =
    verifyCanonicalLivingFramePreapprovalKimiApiContractObservation(
      input.apiObservation,
    )
  const apiCompatibility =
    verifyCanonicalLivingFramePreapprovalKimiApiCompatibility({
      compatibility: input.apiCompatibility,
      requestMaterial,
      preparedRun: input.preparedRun,
      attemptReservation: input.attemptReservation,
      apiObservation,
    })
  return {
    requestMaterial,
    apiObservation,
    apiCompatibility,
  }
}

function createExpectedDraft(input: {
  requestMaterial: CanonicalLivingFramePreapprovalKimiRequestMaterial
  apiObservation:
    CanonicalLivingFramePreapprovalKimiApiContractObservation
  apiCompatibility:
    CanonicalLivingFramePreapprovalKimiApiCompatibility
}): z.infer<typeof projectionDraftSchema> {
  const canonicalSchema =
    input.requestMaterial.internalRequestMaterial
      .responseContract.jsonSchema
  const currentCanonicalSchema =
    createLivingFrameSemanticSceneProposalJsonSchema()
  if (
    stableAuthorityStringify(canonicalSchema) !==
      stableAuthorityStringify(currentCanonicalSchema)
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_mfjs_canonical_schema_stale',
    )
  }
  const canonicalSchemaText =
    stableAuthorityStringify(canonicalSchema)
  const canonicalSchemaDigestSha256 =
    sha256AuthorityValue(canonicalSchema)
  const projected = projectSchema(canonicalSchema)
  const providerSchemaText =
    stableAuthorityStringify(projected.schema)
  const providerSchemaDigestSha256 =
    sha256AuthorityValue(projected.schema)
  if (
    canonicalSchemaDigestSha256 !==
      EXPECTED_CANONICAL_SCHEMA_DIGEST_SHA256
    || Buffer.byteLength(canonicalSchemaText, 'utf8') !==
      EXPECTED_CANONICAL_SCHEMA_BYTE_LENGTH
    || providerSchemaDigestSha256 !==
      EXPECTED_PROVIDER_SCHEMA_DIGEST_SHA256
    || Buffer.byteLength(providerSchemaText, 'utf8') !==
      EXPECTED_PROVIDER_SCHEMA_BYTE_LENGTH
    || stableAuthorityStringify(projected.audit) !==
      stableAuthorityStringify({
        sourceConstCount: EXPECTED_SOURCE_CONST_COUNT,
        constToSingletonEnumCount: EXPECTED_SOURCE_CONST_COUNT,
        sourcePatternCount: EXPECTED_SOURCE_PATTERN_COUNT,
        patternsDeferredToCanonicalAcceptanceCount:
          EXPECTED_SOURCE_PATTERN_COUNT,
        sourceEnumCount: EXPECTED_SOURCE_ENUM_COUNT,
        providerEnumCount: EXPECTED_PROVIDER_ENUM_COUNT,
      })
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_mfjs_observed_schema_changed',
    )
  }
  if (
    canonicalSchemaDigestSha256 !==
      input.requestMaterial.canonicalBindings
        .outputJsonSchemaDigestSha256
    || canonicalSchemaDigestSha256 !==
      input.apiCompatibility.canonicalBindings
        .outputJsonSchemaDigestSha256
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_mfjs_schema_binding_invalid',
    )
  }

  return projectionDraftSchema.parse({
    contractVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_SCHEMA_PROJECTION_VERSION,
    recordClass:
      'controlled_kimi_mfjs_provider_schema_projection',
    state:
      'static_mfjs_projection_validated_transport_blocked',
    observedAt:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_OBSERVED_AT,
    promotionAllowed: false,
    productionReady: false,
    canonicalBindings: {
      requestMaterialRecordDigestSha256:
        input.requestMaterial.recordDigestSha256,
      apiObservationRecordDigestSha256:
        input.apiObservation.recordDigestSha256,
      apiCompatibilityRecordDigestSha256:
        input.apiCompatibility.recordDigestSha256,
      canonicalAcceptanceJsonSchemaDigestSha256:
        canonicalSchemaDigestSha256,
      providerMfjsJsonSchemaDigestSha256:
        providerSchemaDigestSha256,
    },
    schemaProjection: {
      algorithmId:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_PROJECTION_ALGORITHM,
      schemaName:
        'living_frame_semantic_scene_proposal_result_v1',
      canonicalAcceptanceJsonSchemaByteLength:
        Buffer.byteLength(canonicalSchemaText, 'utf8'),
      providerMfjsJsonSchemaByteLength:
        Buffer.byteLength(providerSchemaText, 'utf8'),
      canonicalAcceptanceJsonSchemaDigestSha256:
        canonicalSchemaDigestSha256,
      providerMfjsJsonSchemaDigestSha256:
        providerSchemaDigestSha256,
      providerMfjsJsonSchema: projected.schema,
      transformationAudit: {
        ...projected.audit,
        typeShapeChanged: false,
        objectPropertyShapeChanged: false,
        arrayCardinalityChanged: false,
        constSemanticsPreservedBySingletonEnum: true,
        patternConstraintsPresentInProviderSchema: false,
        providerSchemaIsCanonicalAcceptanceAuthority: false,
        canonicalPostParseRevalidationRequired: true,
      },
    },
    validatorObservation: {
      observationClass:
        'controlled_official_walle_source_and_execution_observation',
      repositoryUrl: 'https://github.com/MoonshotAI/walle',
      releaseTag: 'v0.1.13',
      releasePublishedAt: '2026-06-29T14:05:32.000Z',
      sourceCommitSha:
        '196bb0ca9c2f2271cfa9623108308f0780e411ee',
      sourceTreeSha:
        '62bd4d8d001ab64d85fa5dfaeb6e6299cfbfe129',
      sourceArtifacts: VALIDATOR_SOURCE_ARTIFACTS,
      toolchain: {
        goVersion: 'go1.23.12',
        platform: 'darwin_arm64',
        officialArchiveSha256:
          '5bfa117e401ae64e7ffb960243c448b535fe007e682a13ff6c7371f4a6f0ccaa',
        buildFlags: ['-trimpath', '-buildvcs=false'],
        observedBinaryByteLength: 3_575_986,
        observedBinarySha256:
          '3bb099fbff27436afd23e5a97760900abf5524194c90b460acbe77cd5d9606b2',
      },
      inputSerialization: 'stable_canonical_json_utf8',
      originalCanonicalSchema: {
        strictLevelPassed: true,
        ultraLevelPassed: false,
        firstUltraFailureKeyword: 'const',
        firstUltraFailurePath:
          'properties.sceneProposals.items.properties.semanticTimingConstraints.items.properties.exactFramesProvided',
      },
      providerMfjsProjection: {
        strictLevelPassed: true,
        ultraLevelPassed: true,
        exitCode: 0,
        stdoutSha256:
          '5ec2c661a9602c1b704be3cb355629753835dd3ccf74a92c795d0ba32b8f5158',
        stderrByteLength: 0,
      },
      validationReexecutedByThisRuntime: false,
      currentValidatorSourceRereadRequiredAtTransport: true,
    },
    acceptanceBoundary: {
      constrainedDecodeUsesProviderMfjsProjection: true,
      providerOutputParsedFromFinalContentOnly: true,
      canonicalAcceptanceSchemaRevalidationRequired: true,
      canonicalSemanticCrossValidationRequired: true,
      invalidPatternOrAuthorityLiteralStillRejected: true,
      liveTargetModelProbeCompleted: false,
      canonicalMaximumCompletionTokens: null,
      providerRequestBodyCreated: false,
      executable: false,
    },
    runtimeBlockers: [
      'current_official_source_reread_required',
      'current_walle_release_reread_required',
      'current_account_model_availability_required',
      'immutable_provider_model_revision_required',
      'live_target_schema_probe_required',
      'canonical_completion_token_ceiling_required',
      'distributed_one_use_lifecycle_required',
      'provider_credential_capability_required',
      'unknown_outcome_operator_reconciliation_required',
    ],
    browserShareable: false,
    providerCallMade: false,
    credentialReadMade: false,
    remoteMutationMade: false,
    authorityBoundary:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_MFJS_SCHEMA_PROJECTION_BOUNDARY,
  })
}

function projectSchema(input: Record<string, unknown>): {
  schema: Record<string, unknown>
  audit: ProjectionAudit
} {
  const audit: ProjectionAudit = {
    sourceConstCount: 0,
    constToSingletonEnumCount: 0,
    sourcePatternCount: 0,
    patternsDeferredToCanonicalAcceptanceCount: 0,
    sourceEnumCount: 0,
    providerEnumCount: 0,
  }
  const schema = projectSchemaNode(input, audit, 'root')
  return { schema, audit }
}

function projectSchemaNode(
  input: unknown,
  audit: ProjectionAudit,
  path: string,
): Record<string, unknown> {
  if (!isPlainRecord(input)) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_mfjs_schema_node_invalid:${path}`,
    )
  }
  const output: Record<string, unknown> = {}
  for (const [keyword, value] of Object.entries(input)) {
    if (!SOURCE_SCHEMA_KEYWORDS.has(keyword)) {
      throw new Error(
        `canonical_living_frame_preapproval_kimi_mfjs_keyword_unsupported:${keyword}`,
      )
    }
    switch (keyword) {
      case 'properties':
      case '$defs':
        output[keyword] = projectSchemaMap(
          value,
          audit,
          `${path}.${keyword}`,
        )
        break
      case 'items':
        output[keyword] = projectSchemaNode(
          value,
          audit,
          `${path}.items`,
        )
        break
      case 'additionalProperties':
        output[keyword] = isPlainRecord(value)
          ? projectSchemaNode(
              value,
              audit,
              `${path}.additionalProperties`,
            )
          : structuredClone(value)
        break
      case 'anyOf':
        if (!Array.isArray(value)) {
          throw new Error(
            `canonical_living_frame_preapproval_kimi_mfjs_anyof_invalid:${path}`,
          )
        }
        output.anyOf = value.map((branch, index) =>
          projectSchemaNode(
            branch,
            audit,
            `${path}.anyOf[${index}]`,
          ),
        )
        break
      case 'const':
        if (Object.hasOwn(input, 'enum')) {
          throw new Error(
            `canonical_living_frame_preapproval_kimi_mfjs_const_enum_conflict:${path}`,
          )
        }
        audit.sourceConstCount += 1
        audit.constToSingletonEnumCount += 1
        audit.providerEnumCount += 1
        output.enum = [structuredClone(value)]
        break
      case 'pattern':
        if (typeof value !== 'string') {
          throw new Error(
            `canonical_living_frame_preapproval_kimi_mfjs_pattern_invalid:${path}`,
          )
        }
        audit.sourcePatternCount += 1
        audit.patternsDeferredToCanonicalAcceptanceCount += 1
        break
      case 'enum':
        if (!Array.isArray(value)) {
          throw new Error(
            `canonical_living_frame_preapproval_kimi_mfjs_enum_invalid:${path}`,
          )
        }
        audit.sourceEnumCount += 1
        audit.providerEnumCount += 1
        output.enum = structuredClone(value)
        break
      default:
        output[keyword] = structuredClone(value)
    }
  }
  return output
}

function projectSchemaMap(
  input: unknown,
  audit: ProjectionAudit,
  path: string,
): Record<string, unknown> {
  if (!isPlainRecord(input)) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_mfjs_schema_map_invalid:${path}`,
    )
  }
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      projectSchemaNode(value, audit, `${path}.${key}`),
    ]),
  )
}

function isPlainRecord(
  input: unknown,
): input is Record<string, unknown> {
  return typeof input === 'object'
    && input !== null
    && !Array.isArray(input)
}
