import { z } from 'zod'

import {
  assertCanonicalSam31AnyCloudImageBuildAuthority,
  assertCanonicalSam31CloudImageBuildSubmission,
  assertCanonicalSam31CloudImageBuildTerminalObservation,
  type CanonicalSam31AnyCloudImageBuildAuthority,
  type CanonicalSam31CloudImageBuildSubmission,
  type CanonicalSam31CloudImageBuildTerminalObservation,
} from './canonical-sam3_1-cloud-image-build-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION =
  'canonical-sam3_1-image-supply-chain-build-admission-v1' as const
export const CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION =
  'canonical-sam3_1-image-supply-chain-build-submission-v1' as const
export const CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_OBSERVATION_VERSION =
  'canonical-sam3_1-image-supply-chain-build-observation-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PROJECT_NUMBER = '390722338345' as const
const BUILD_COLLECTION =
  'projects/reeditpro/locations/us-central1/builds' as const
const PROVIDER_BUILD_COLLECTIONS = new Set([
  BUILD_COLLECTION,
  `projects/${PROJECT_NUMBER}/locations/us-central1/builds`,
])
const BUILD_COLLECTION_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const
const BUILD_CREATE_ENDPOINT =
  `${BUILD_COLLECTION_ENDPOINT}?projectId=reeditpro` as const
const IMAGE_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu' as const
const EVIDENCE_BUCKET =
  'reeditpro-production-reeditpro-image-supply-chain-evidence' as const
const SIGNER_SERVICE_ACCOUNT =
  'projects/reeditpro/serviceAccounts/reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com' as const
const DOCKER_BUILDER_IMAGE =
  'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147' as const
const SYFT_IMAGE =
  'docker.io/anchore/syft@sha256:2baa4d24d90599840c0100a8d30deaa533821fcd99f405ce6f90e3d225bd836d' as const
const COSIGN_IMAGE =
  'gcr.io/projectsigstore/cosign@sha256:de9c65609e6bde17e6b48de485ee788407c9502fa08b8f4459f595b21f56cd00' as const
const SBOM_PATH = 'sam31.spdx.json' as const
const SIGNATURE_BUNDLE_PATH = 'cosign-signature.bundle.json' as const
const SIGNATURE_VERIFICATION_PATH = 'cosign-verification.json' as const
const ARTIFACT_PATHS = Object.freeze([
  SBOM_PATH,
  SIGNATURE_BUNDLE_PATH,
  SIGNATURE_VERIFICATION_PATH,
] as const)

const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const kmsKeyVersionSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/keyRings\/weeditpro-image-signing\/cryptoKeys\/sam31-image-signing\/cryptoKeyVersions\/[1-9][0-9]*$/u,
)
const immutableImageUriSchema = z.string().regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
)
const artifactPrefixSchema = z.string().regex(
  /^private\/sam3_1\/image-supply-chain\/v1\/[a-f0-9]{64}$/u,
)
const artifactManifestSchema = z.string().regex(
  /^gs:\/\/reeditpro-production-reeditpro-image-supply-chain-evidence\/private\/sam3_1\/image-supply-chain\/v1\/[a-f0-9]{64}\/[A-Za-z0-9._/-]+\.json(?:#[1-9][0-9]{0,30})?$/u,
)

const toolchainSchema = z.object({
  dockerBuilderImage: z.literal(DOCKER_BUILDER_IMAGE),
  dockerBuilderRelease: z.literal('cloud-builders-docker-2026-08-03'),
  syftImage: z.literal(SYFT_IMAGE),
  syftRelease: z.literal('v1.44.0'),
  syftLicense: z.literal('Apache-2.0'),
  cosignImage: z.literal(COSIGN_IMAGE),
  cosignRelease: z.literal('v3.0.6'),
  cosignLicense: z.literal('Apache-2.0'),
  mutableToolTagUsed: z.literal(false),
}).strict()

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION,
  ),
  source: z.literal('canonical_sam3_1_image_supply_chain_build_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('authorized_for_private_supply_chain_build'),
  admissionId: safeId,
  admissionVersion: z.literal(1),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  buildAuthorityRef: evidenceRefSchema,
  imageBuildSubmissionRef: evidenceRefSchema,
  imageBuildTerminalObservationRef: evidenceRefSchema,
  cloudImageBuildId: z.string().uuid(),
  cloudImageBuildResource: z.string(),
  immutableImageUri: immutableImageUriSchema,
  immutableImageDigest: prefixedSha256,
  artifactRegistryPackage: z.literal(IMAGE_PACKAGE),
  kmsKeyVersionResource: kmsKeyVersionSchema,
  kmsKeyUri: z.string().regex(
    /^gcpkms:\/\/projects\/reeditpro\/locations\/us-central1\/keyRings\/weeditpro-image-signing\/cryptoKeys\/sam31-image-signing\/cryptoKeyVersions\/[1-9][0-9]*$/u,
  ),
  evidenceBucket: z.literal(EVIDENCE_BUCKET),
  evidencePrefix: artifactPrefixSchema,
  evidenceArtifactPaths: z.tuple([
    z.literal(SBOM_PATH),
    z.literal(SIGNATURE_BUNDLE_PATH),
    z.literal(SIGNATURE_VERIFICATION_PATH),
  ]),
  toolchain: toolchainSchema,
  buildPolicy: z.object({
    serviceAccount: z.literal(SIGNER_SERVICE_ACCOUNT),
    timeout: z.literal('3600s'),
    queueTtl: z.literal('600s'),
    machineType: z.literal('E2_HIGHCPU_8'),
    diskSizeGb: z.literal(200),
    requestedVerifyOption: z.literal('VERIFIED'),
    logging: z.literal('CLOUD_LOGGING_ONLY'),
    sbomFormat: z.literal('spdx_2_3_json'),
    transparencyLogUploadAllowed: z.literal(false),
    publicSigstoreServiceRequired: z.literal(false),
    automaticRetryAllowed: z.literal(false),
  }).strict(),
  admittedAt: timestamp,
  authority: z.object({
    exactCanonicalImageBuildReread: z.literal(true),
    exactImmutableImageDigestBound: z.literal(true),
    exactNumericKmsKeyVersionBound: z.literal(true),
    supplyChainBuildAuthorized: z.literal(true),
    callerSelectedImageAllowed: z.literal(false),
    callerSelectedBuildStepsAllowed: z.literal(false),
    callerSelectedArtifactLocationAllowed: z.literal(false),
    callerPromptCommandOrSecretAllowed: z.literal(false),
    modelCheckpointIncluded: z.literal(false),
    customerMediaIncluded: z.literal(false),
    gpuRuntimeAuthorized: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (
    value.cloudImageBuildResource !==
      `${BUILD_COLLECTION}/${value.cloudImageBuildId}`
    || value.immutableImageUri !== value.immutableImageUri.replace(
      /@sha256:[a-f0-9]{64}$/u,
      `@${value.immutableImageDigest}`,
    )
    || value.kmsKeyUri !== `gcpkms://${value.kmsKeyVersionResource}`
    || value.evidencePrefix !==
      `private/sam3_1/image-supply-chain/v1/${value.imageBuildTerminalObservationRef.contentHash.slice(7)}`
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 supply-chain admission lost immutable lineage.',
  })
})

export const canonicalSam31ImageSupplyChainBuildAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: rawSha256 }).strict()
export type CanonicalSam31ImageSupplyChainBuildAdmission = z.infer<
  typeof canonicalSam31ImageSupplyChainBuildAdmissionSchema
>

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION,
  ),
  source: z.literal('canonical_sam3_1_image_supply_chain_build_submission_owner'),
  disposition: z.enum([
    'rejected_before_creation',
    'submitted',
    'outcome_unknown',
  ]),
  admissionRef: evidenceRefSchema,
  buildRequestHash: rawSha256.nullable(),
  buildRequestBodyRef: evidenceRefSchema.nullable(),
  providerHttpStatus: z.number().int().min(100).max(599).nullable(),
  cloudBuildOperationName: safeId.nullable(),
  cloudBuildId: z.string().uuid().nullable(),
  cloudBuildResource: z.string().nullable(),
  providerOutcome: z.enum(['not_executed', 'executed', 'unknown']),
  durableAdmissionConsumptionCreated: z.boolean(),
  durableSubmissionObservationCreated: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  supplyChainBuildKnownStarted: z.boolean(),
  imageSignatureKnownCreated: z.literal(false),
  sbomKnownCreated: z.literal(false),
  imageSupplyChainReleaseGranted: z.literal(false),
  gpuRuntimeAuthorized: z.literal(false),
  customerCreditMutationCreated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const submitted = value.disposition === 'submitted'
  const rejected = value.disposition === 'rejected_before_creation'
  const knownExecuted = value.disposition === 'outcome_unknown'
    && value.providerOutcome === 'executed'
  if (
    submitted
      ? !value.buildRequestHash
        || !value.buildRequestBodyRef
        || value.providerHttpStatus === null
        || !value.cloudBuildOperationName
        || !value.cloudBuildId
        || value.cloudBuildResource !==
          `${BUILD_COLLECTION}/${value.cloudBuildId}`
        || value.providerOutcome !== 'executed'
        || !value.durableAdmissionConsumptionCreated
        || !value.durableSubmissionObservationCreated
        || !value.supplyChainBuildKnownStarted
      : rejected
        ? value.providerOutcome !== 'not_executed'
          || value.supplyChainBuildKnownStarted
        : knownExecuted
          ? !value.cloudBuildOperationName
            || !value.cloudBuildId
            || value.cloudBuildResource !==
              `${BUILD_COLLECTION}/${value.cloudBuildId}`
            || !value.supplyChainBuildKnownStarted
          : value.providerOutcome !== 'unknown'
            || value.cloudBuildOperationName !== null
            || value.cloudBuildId !== null
            || value.cloudBuildResource !== null
            || value.supplyChainBuildKnownStarted
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 supply-chain build submission crossed execution truth.',
  })
})

export const canonicalSam31ImageSupplyChainBuildSubmissionSchema =
  submissionWithoutHashSchema.extend({ submissionHash: rawSha256 }).strict()
export type CanonicalSam31ImageSupplyChainBuildSubmission = z.infer<
  typeof canonicalSam31ImageSupplyChainBuildSubmissionSchema
>

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_OBSERVATION_VERSION,
  ),
  source: z.literal('canonical_sam3_1_image_supply_chain_build_terminal_owner'),
  disposition: z.enum([
    'pending',
    'supply_chain_artifacts_ready_pending_exact_reread',
    'terminal_failure',
    'outcome_unknown',
  ]),
  admissionRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  cloudBuildId: z.string().uuid(),
  cloudBuildResource: z.string(),
  providerHttpStatus: z.number().int().min(100).max(599).nullable(),
  cloudBuildStatus: z.enum([
    'PENDING',
    'QUEUED',
    'WORKING',
    'SUCCESS',
    'FAILURE',
    'INTERNAL_ERROR',
    'TIMEOUT',
    'CANCELLED',
    'EXPIRED',
    'STATUS_UNKNOWN',
  ]).nullable(),
  exactBuildConfigurationEchoVerified: z.boolean(),
  warningsAbsent: z.boolean(),
  immutableImageUri: immutableImageUriSchema,
  immutableImageDigest: prefixedSha256,
  kmsKeyVersionResource: kmsKeyVersionSchema,
  evidenceArtifactManifestUri: artifactManifestSchema.nullable(),
  evidenceArtifactCount: z.number().int().min(0).max(3),
  durableTerminalObservationCreated: z.boolean(),
  allPinnedBuildStepsCompleted: z.boolean(),
  sbomBuildArtifactCreated: z.boolean(),
  digestSignatureCreatedAndVerified: z.boolean(),
  evidenceArtifactsExactReread: z.literal(false),
  vulnerabilityOccurrencesReread: z.literal(false),
  originalBuildProvenanceReread: z.literal(false),
  imageSupplyChainReleaseGranted: z.literal(false),
  gpuRuntimeAuthorized: z.literal(false),
  customerCreditMutationCreated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const success = value.disposition ===
    'supply_chain_artifacts_ready_pending_exact_reread'
  const pending = value.disposition === 'pending'
  if (
    value.cloudBuildResource !== `${BUILD_COLLECTION}/${value.cloudBuildId}`
    || (success
      ? value.cloudBuildStatus !== 'SUCCESS'
        || !value.exactBuildConfigurationEchoVerified
        || !value.warningsAbsent
        || !value.evidenceArtifactManifestUri
        || value.evidenceArtifactCount !== 3
        || !value.durableTerminalObservationCreated
        || !value.allPinnedBuildStepsCompleted
        || !value.sbomBuildArtifactCreated
        || !value.digestSignatureCreatedAndVerified
      : value.evidenceArtifactManifestUri !== null
        || value.evidenceArtifactCount !== 0
        || value.allPinnedBuildStepsCompleted
        || value.sbomBuildArtifactCreated
        || value.digestSignatureCreatedAndVerified)
    || (pending && !['PENDING', 'QUEUED', 'WORKING'].includes(
      value.cloudBuildStatus ?? '',
    ))
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 supply-chain build observation lost terminal truth.',
  })
})

export const canonicalSam31ImageSupplyChainBuildObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: rawSha256 }).strict()
export type CanonicalSam31ImageSupplyChainBuildObservation = z.infer<
  typeof canonicalSam31ImageSupplyChainBuildObservationSchema
>

export interface CanonicalSam31ImageSupplyChainBuildAdmissionReadPort {
  rereadAdmission(input: {
    readonly admissionRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalSam31ImageSupplyChainBuildAdmission | null>
}

export interface CanonicalSam31ImageSupplyChainBuildStatePort {
  consumeAdmissionCreateOnly(input: {
    readonly admissionRef: z.infer<typeof evidenceRefSchema>
    readonly buildRequestHash: string
    readonly consumedAt: string
  }): Promise<boolean>
  persistSubmissionCreateOnly(input: {
    readonly submission: CanonicalSam31ImageSupplyChainBuildSubmission
  }): Promise<boolean>
  persistTerminalObservationCreateOnly(input: {
    readonly observation: CanonicalSam31ImageSupplyChainBuildObservation
  }): Promise<boolean>
}

export interface CanonicalSam31ImageSupplyChainCloudBuildTransport {
  request(input: {
    readonly method: 'GET' | 'POST'
    readonly url: string
    readonly body?: Readonly<Record<string, unknown>>
  }): Promise<{ readonly status: number; readonly json: unknown }>
}

export function createCanonicalSam31ImageSupplyChainBuildAdmission(input: {
  readonly admissionId: string
  readonly authority: CanonicalSam31AnyCloudImageBuildAuthority
  readonly imageBuildSubmission: CanonicalSam31CloudImageBuildSubmission
  readonly imageBuildTerminalObservation:
    CanonicalSam31CloudImageBuildTerminalObservation
  readonly kmsKeyVersionResource: string
  readonly admittedAt: string
}): CanonicalSam31ImageSupplyChainBuildAdmission {
  const authority = assertCanonicalSam31AnyCloudImageBuildAuthority(
    input.authority,
  )
  const submission = assertCanonicalSam31CloudImageBuildSubmission(
    input.imageBuildSubmission,
  )
  const terminal = assertCanonicalSam31CloudImageBuildTerminalObservation(
    input.imageBuildTerminalObservation,
  )
  const buildAuthorityRef = buildAuthorityReference(authority)
  const imageBuildSubmissionRef = imageBuildSubmissionReference(submission)
  const imageBuildTerminalObservationRef =
    imageBuildTerminalObservationReference(terminal)
  if (
    authority.evidenceClass !== 'canonical_private_reread'
    || authority.status !== 'authorized_for_private_cloud_build'
    || submission.disposition !== 'submitted'
    || terminal.disposition !==
      'image_built_pending_scan_signature_and_gpu_qualification'
    || !terminal.immutableImageUri
    || !terminal.immutableImageDigest
    || terminal.artifactRegistryPackage !== IMAGE_PACKAGE
    || terminal.cloudBuildId !== submission.cloudBuildId
    || !sameRef(submission.authorityRef, buildAuthorityRef)
    || !sameRef(terminal.authorityRef, buildAuthorityRef)
    || !sameRef(terminal.submissionRef, imageBuildSubmissionRef)
  ) throw new Error('SAM 3.1 has no canonical immutable image to qualify.')

  const kmsKeyVersionResource = kmsKeyVersionSchema.parse(
    input.kmsKeyVersionResource,
  )
  const evidencePrefix =
    `private/sam3_1/image-supply-chain/v1/${terminal.observationHash}` as const
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION,
    source: 'canonical_sam3_1_image_supply_chain_build_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'authorized_for_private_supply_chain_build',
    admissionId: input.admissionId,
    admissionVersion: 1,
    operationId: authority.operationId,
    buildAuthorityRef,
    imageBuildSubmissionRef,
    imageBuildTerminalObservationRef,
    cloudImageBuildId: terminal.cloudBuildId,
    cloudImageBuildResource: terminal.cloudBuildResource,
    immutableImageUri: terminal.immutableImageUri,
    immutableImageDigest: terminal.immutableImageDigest,
    artifactRegistryPackage: terminal.artifactRegistryPackage,
    kmsKeyVersionResource,
    kmsKeyUri: `gcpkms://${kmsKeyVersionResource}`,
    evidenceBucket: EVIDENCE_BUCKET,
    evidencePrefix,
    evidenceArtifactPaths: [...ARTIFACT_PATHS],
    toolchain: {
      dockerBuilderImage: DOCKER_BUILDER_IMAGE,
      dockerBuilderRelease: 'cloud-builders-docker-2026-08-03',
      syftImage: SYFT_IMAGE,
      syftRelease: 'v1.44.0',
      syftLicense: 'Apache-2.0',
      cosignImage: COSIGN_IMAGE,
      cosignRelease: 'v3.0.6',
      cosignLicense: 'Apache-2.0',
      mutableToolTagUsed: false,
    },
    buildPolicy: {
      serviceAccount: SIGNER_SERVICE_ACCOUNT,
      timeout: '3600s',
      queueTtl: '600s',
      machineType: 'E2_HIGHCPU_8',
      diskSizeGb: 200,
      requestedVerifyOption: 'VERIFIED',
      logging: 'CLOUD_LOGGING_ONLY',
      sbomFormat: 'spdx_2_3_json',
      transparencyLogUploadAllowed: false,
      publicSigstoreServiceRequired: false,
      automaticRetryAllowed: false,
    },
    admittedAt: input.admittedAt,
    authority: {
      exactCanonicalImageBuildReread: true,
      exactImmutableImageDigestBound: true,
      exactNumericKmsKeyVersionBound: true,
      supplyChainBuildAuthorized: true,
      callerSelectedImageAllowed: false,
      callerSelectedBuildStepsAllowed: false,
      callerSelectedArtifactLocationAllowed: false,
      callerPromptCommandOrSecretAllowed: false,
      modelCheckpointIncluded: false,
      customerMediaIncluded: false,
      gpuRuntimeAuthorized: false,
      customerCreditMutationAllowed: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalSam31ImageSupplyChainBuildAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalSam31ImageSupplyChainBuildService(input: {
  readonly admissionReadPort:
    CanonicalSam31ImageSupplyChainBuildAdmissionReadPort
  readonly statePort: CanonicalSam31ImageSupplyChainBuildStatePort
  readonly authenticatedTransport:
    CanonicalSam31ImageSupplyChainCloudBuildTransport
  readonly now?: () => string
}) {
  return Object.freeze({
    startOneSupplyChainBuild: async (request: {
      readonly admissionRef: z.infer<typeof evidenceRefSchema>
    }): Promise<CanonicalSam31ImageSupplyChainBuildSubmission> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      let admission: CanonicalSam31ImageSupplyChainBuildAdmission
      try {
        const ref = evidenceRefSchema.parse(request.admissionRef)
        admission = assertCanonicalSam31ImageSupplyChainBuildAdmission(
          await input.admissionReadPort.rereadAdmission({ admissionRef: ref }),
        )
        if (!sameRef(ref, imageSupplyChainBuildAdmissionReference(admission))) {
          throw new Error('Supply-chain admission reread crossed identity.')
        }
      } catch {
        return buildSubmission({
          disposition: 'rejected_before_creation',
          admissionRef: safeEvidenceRef(request.admissionRef),
          buildRequestHash: null,
          buildRequestBodyRef: null,
          providerHttpStatus: null,
          cloudBuildOperationName: null,
          cloudBuildId: null,
          cloudBuildResource: null,
          providerOutcome: 'not_executed',
          durableAdmissionConsumptionCreated: false,
          durableSubmissionObservationCreated: false,
          supplyChainBuildKnownStarted: false,
          observedAt,
        })
      }

      const admissionRef = imageSupplyChainBuildAdmissionReference(admission)
      const buildBody = compileCanonicalSam31ImageSupplyChainCloudBuildBody(
        admission,
      )
      const buildRequestHash = sha256AuthorityValue(buildBody)
      const buildRequestBodyRef = evidenceRefSchema.parse({
        id: `sam31-supply-chain-build-request-${buildRequestHash.slice(0, 24)}`,
        version: 1,
        contentHash: `sha256:${buildRequestHash}`,
      })
      const consumed = await input.statePort.consumeAdmissionCreateOnly({
        admissionRef,
        buildRequestHash,
        consumedAt: observedAt,
      })
      if (!consumed) return buildSubmission({
        disposition: 'rejected_before_creation',
        admissionRef,
        buildRequestHash,
        buildRequestBodyRef,
        providerHttpStatus: null,
        cloudBuildOperationName: null,
        cloudBuildId: null,
        cloudBuildResource: null,
        providerOutcome: 'not_executed',
        durableAdmissionConsumptionCreated: false,
        durableSubmissionObservationCreated: false,
        supplyChainBuildKnownStarted: false,
        observedAt,
      })

      let status: number | null = null
      let accepted: ReturnType<typeof parseBuildCreateOperation> | null = null
      try {
        const response = await input.authenticatedTransport.request({
          method: 'POST',
          url: BUILD_CREATE_ENDPOINT,
          body: buildBody,
        })
        status = response.status
        if (status < 200 || status >= 300) {
          throw new Error('Supply-chain Cloud Build create failed.')
        }
        accepted = parseBuildCreateOperation(response.json)
        const submission = buildSubmission({
          disposition: 'submitted',
          admissionRef,
          buildRequestHash,
          buildRequestBodyRef,
          providerHttpStatus: status,
          cloudBuildOperationName: accepted.operationName,
          cloudBuildId: accepted.buildId,
          cloudBuildResource: `${BUILD_COLLECTION}/${accepted.buildId}`,
          providerOutcome: 'executed',
          durableAdmissionConsumptionCreated: true,
          durableSubmissionObservationCreated: true,
          supplyChainBuildKnownStarted: true,
          observedAt,
        })
        if (!await input.statePort.persistSubmissionCreateOnly({ submission })) {
          throw new Error('Supply-chain build submission was not durable.')
        }
        return submission
      } catch {
        const providerKnown = accepted !== null
        const unknown = buildSubmission({
          disposition: 'outcome_unknown',
          admissionRef,
          buildRequestHash,
          buildRequestBodyRef,
          providerHttpStatus: status,
          cloudBuildOperationName: accepted?.operationName ?? null,
          cloudBuildId: accepted?.buildId ?? null,
          cloudBuildResource: accepted
            ? `${BUILD_COLLECTION}/${accepted.buildId}`
            : null,
          providerOutcome: providerKnown ? 'executed' : 'unknown',
          durableAdmissionConsumptionCreated: true,
          durableSubmissionObservationCreated: false,
          supplyChainBuildKnownStarted: providerKnown,
          observedAt,
        })
        await input.statePort.persistSubmissionCreateOnly({
          submission: unknown,
        }).catch(() => false)
        return unknown
      }
    },

    observeOneSupplyChainBuild: async (request: {
      readonly admission: CanonicalSam31ImageSupplyChainBuildAdmission
      readonly submission: CanonicalSam31ImageSupplyChainBuildSubmission
    }): Promise<CanonicalSam31ImageSupplyChainBuildObservation> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const admission = assertCanonicalSam31ImageSupplyChainBuildAdmission(
        request.admission,
      )
      const submission = assertCanonicalSam31ImageSupplyChainBuildSubmission(
        request.submission,
      )
      const admissionRef = imageSupplyChainBuildAdmissionReference(admission)
      if (
        submission.disposition !== 'submitted'
        || !submission.cloudBuildId
        || !sameRef(submission.admissionRef, admissionRef)
      ) throw new Error('Supply-chain build observation is not admitted.')
      const submissionRef = imageSupplyChainBuildSubmissionReference(
        submission,
      )
      const base = {
        admissionRef,
        submissionRef,
        cloudBuildId: submission.cloudBuildId,
        cloudBuildResource: `${BUILD_COLLECTION}/${submission.cloudBuildId}`,
        immutableImageUri: admission.immutableImageUri,
        immutableImageDigest: admission.immutableImageDigest,
        kmsKeyVersionResource: admission.kmsKeyVersionResource,
        observedAt,
      }
      let providerStatus: number | null = null
      try {
        const response = await input.authenticatedTransport.request({
          method: 'GET',
          url: `${BUILD_COLLECTION_ENDPOINT}/${submission.cloudBuildId}`,
        })
        providerStatus = response.status
        if (providerStatus < 200 || providerStatus >= 300) {
          throw new Error('Supply-chain Cloud Build reread failed.')
        }
        const build = parseBuildResource(response.json)
        if (
          build.id !== submission.cloudBuildId
          || !providerBuildNameMatches(
            build.name,
            submission.cloudBuildId,
          )
        ) throw new Error('Supply-chain Cloud Build reread crossed identity.')
        if (['PENDING', 'QUEUED', 'WORKING'].includes(build.status)) {
          return buildObservation({
            ...base,
            disposition: 'pending',
            providerHttpStatus: providerStatus,
            cloudBuildStatus: build.status as 'PENDING' | 'QUEUED' | 'WORKING',
            exactBuildConfigurationEchoVerified: false,
            warningsAbsent: build.warnings.length === 0,
            evidenceArtifactManifestUri: null,
            evidenceArtifactCount: 0,
            durableTerminalObservationCreated: false,
            allPinnedBuildStepsCompleted: false,
            sbomBuildArtifactCreated: false,
            digestSignatureCreatedAndVerified: false,
          })
        }
        if (build.status !== 'SUCCESS') {
          const failed = buildObservation({
            ...base,
            disposition: 'terminal_failure',
            providerHttpStatus: providerStatus,
            cloudBuildStatus: build.status,
            exactBuildConfigurationEchoVerified: false,
            warningsAbsent: build.warnings.length === 0,
            evidenceArtifactManifestUri: null,
            evidenceArtifactCount: 0,
            durableTerminalObservationCreated: true,
            allPinnedBuildStepsCompleted: false,
            sbomBuildArtifactCreated: false,
            digestSignatureCreatedAndVerified: false,
          })
          if (!await input.statePort.persistTerminalObservationCreateOnly({
            observation: failed,
          })) throw new Error('Supply-chain failure was not durable.')
          return failed
        }
        const expectedBody = compileCanonicalSam31ImageSupplyChainCloudBuildBody(
          admission,
        )
        assertCloudBuildEcho(build, expectedBody, admission)
        const success = buildObservation({
          ...base,
          disposition: 'supply_chain_artifacts_ready_pending_exact_reread',
          providerHttpStatus: providerStatus,
          cloudBuildStatus: 'SUCCESS',
          exactBuildConfigurationEchoVerified: true,
          warningsAbsent: true,
          evidenceArtifactManifestUri: build.artifactManifest,
          evidenceArtifactCount: build.numArtifacts,
          durableTerminalObservationCreated: true,
          allPinnedBuildStepsCompleted: true,
          sbomBuildArtifactCreated: true,
          digestSignatureCreatedAndVerified: true,
        })
        if (!await input.statePort.persistTerminalObservationCreateOnly({
          observation: success,
        })) throw new Error('Supply-chain success was not durable.')
        return success
      } catch {
        return buildObservation({
          ...base,
          disposition: 'outcome_unknown',
          providerHttpStatus: providerStatus,
          cloudBuildStatus: null,
          exactBuildConfigurationEchoVerified: false,
          warningsAbsent: false,
          evidenceArtifactManifestUri: null,
          evidenceArtifactCount: 0,
          durableTerminalObservationCreated: false,
          allPinnedBuildStepsCompleted: false,
          sbomBuildArtifactCreated: false,
          digestSignatureCreatedAndVerified: false,
        })
      }
    },
  })
}

export function compileCanonicalSam31ImageSupplyChainCloudBuildBody(
  value: CanonicalSam31ImageSupplyChainBuildAdmission,
): Readonly<Record<string, unknown>> {
  const admission = assertCanonicalSam31ImageSupplyChainBuildAdmission(value)
  const image = admission.immutableImageUri
  const key = admission.kmsKeyUri
  return deepFreeze({
    steps: [
      {
        id: 'pull-immutable-sam31-image',
        name: admission.toolchain.dockerBuilderImage,
        args: ['pull', image],
      },
      {
        id: 'archive-immutable-sam31-image',
        name: admission.toolchain.dockerBuilderImage,
        waitFor: ['pull-immutable-sam31-image'],
        args: ['save', '--output', '/workspace/sam31-image.tar', image],
      },
      {
        id: 'generate-spdx-2-3-sbom',
        name: admission.toolchain.syftImage,
        waitFor: ['archive-immutable-sam31-image'],
        args: [
          'scan',
          'docker-archive:/workspace/sam31-image.tar',
          '--output',
          `spdx-json=/workspace/${SBOM_PATH}`,
        ],
      },
      {
        id: 'prepare-nonroot-signature-output',
        name: admission.toolchain.dockerBuilderImage,
        waitFor: ['generate-spdx-2-3-sbom'],
        args: [
          'run',
          '--rm',
          '--network=none',
          '--volume=/workspace:/workspace',
          '--entrypoint=/bin/sh',
          admission.toolchain.dockerBuilderImage,
          '-ceu',
          'chmod 0777 /workspace',
        ],
      },
      {
        id: 'sign-immutable-sam31-image',
        name: admission.toolchain.cosignImage,
        waitFor: ['prepare-nonroot-signature-output'],
        args: [
          'sign',
          '--yes',
          '--key',
          key,
          '--use-signing-config=false',
          '--tlog-upload=false',
          '--bundle',
          `/workspace/${SIGNATURE_BUNDLE_PATH}`,
          image,
        ],
      },
      {
        id: 'verify-immutable-sam31-image-signature',
        name: admission.toolchain.cosignImage,
        waitFor: ['sign-immutable-sam31-image'],
        args: [
          'verify',
          '--key',
          key,
          '--insecure-ignore-tlog=true',
          '--output',
          'json',
          '--output-file',
          `/workspace/${SIGNATURE_VERIFICATION_PATH}`,
          image,
        ],
      },
    ],
    artifacts: {
      objects: {
        location:
          `gs://${admission.evidenceBucket}/${admission.evidencePrefix}/`,
        paths: [...admission.evidenceArtifactPaths],
      },
    },
    timeout: admission.buildPolicy.timeout,
    queueTtl: admission.buildPolicy.queueTtl,
    options: {
      machineType: admission.buildPolicy.machineType,
      diskSizeGb: admission.buildPolicy.diskSizeGb,
      requestedVerifyOption: admission.buildPolicy.requestedVerifyOption,
      logging: admission.buildPolicy.logging,
    },
    serviceAccount: admission.buildPolicy.serviceAccount,
    tags: ['weeditpro', 'sam3-1', 'private-image-supply-chain'],
  })
}

export function assertCanonicalSam31ImageSupplyChainBuildAdmission(
  value: unknown,
): CanonicalSam31ImageSupplyChainBuildAdmission {
  assertClosedPlainData(value, 'sam3_1_supply_chain_build_admission')
  const parsed = canonicalSam31ImageSupplyChainBuildAdmissionSchema.parse(value)
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 supply-chain admission hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31ImageSupplyChainBuildSubmission(
  value: unknown,
): CanonicalSam31ImageSupplyChainBuildSubmission {
  assertClosedPlainData(value, 'sam3_1_supply_chain_build_submission')
  const parsed = canonicalSam31ImageSupplyChainBuildSubmissionSchema.parse(
    value,
  )
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 supply-chain submission hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31ImageSupplyChainBuildObservation(
  value: unknown,
): CanonicalSam31ImageSupplyChainBuildObservation {
  assertClosedPlainData(value, 'sam3_1_supply_chain_build_observation')
  const parsed = canonicalSam31ImageSupplyChainBuildObservationSchema.parse(
    value,
  )
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 supply-chain observation hash is invalid.')
  }
  return parsed
}

export function imageSupplyChainBuildAdmissionReference(
  value: CanonicalSam31ImageSupplyChainBuildAdmission,
) {
  const admission = assertCanonicalSam31ImageSupplyChainBuildAdmission(value)
  return evidenceRefSchema.parse({
    id: admission.admissionId,
    version: admission.admissionVersion,
    contentHash: `sha256:${admission.admissionHash}`,
  })
}

export function imageSupplyChainBuildSubmissionReference(
  value: CanonicalSam31ImageSupplyChainBuildSubmission,
) {
  const submission = assertCanonicalSam31ImageSupplyChainBuildSubmission(value)
  return evidenceRefSchema.parse({
    id: `sam31-supply-chain-submission-${submission.submissionHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${submission.submissionHash}`,
  })
}

export function imageSupplyChainBuildObservationReference(
  value: CanonicalSam31ImageSupplyChainBuildObservation,
) {
  const observation = assertCanonicalSam31ImageSupplyChainBuildObservation(
    value,
  )
  return evidenceRefSchema.parse({
    id: `sam31-supply-chain-observation-${observation.observationHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${observation.observationHash}`,
  })
}

function buildAuthorityReference(
  authority: CanonicalSam31AnyCloudImageBuildAuthority,
) {
  return evidenceRefSchema.parse({
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}`,
  })
}

function imageBuildSubmissionReference(
  submission: CanonicalSam31CloudImageBuildSubmission,
) {
  return evidenceRefSchema.parse({
    id: `sam31-cloud-build-submission-${submission.submissionHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${submission.submissionHash}`,
  })
}

function imageBuildTerminalObservationReference(
  observation: CanonicalSam31CloudImageBuildTerminalObservation,
) {
  return evidenceRefSchema.parse({
    id: `sam31-cloud-build-terminal-${observation.observationHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${observation.observationHash}`,
  })
}

function parseBuildCreateOperation(value: unknown) {
  assertClosedPlainData(value, 'sam3_1_supply_chain_build_create_operation')
  const root = record(value)
  const operationName = safeId.parse(root.name)
  const build = record(record(root.metadata).build)
  const buildId = z.string().uuid().parse(build.id)
  if (
    !providerBuildNameMatches(z.string().parse(build.name), buildId)
    || build.projectId !== PROJECT_ID
  ) throw new Error('Supply-chain Cloud Build create crossed project.')
  return { operationName, buildId }
}

function providerBuildNameMatches(name: string, buildId: string): boolean {
  return [...PROVIDER_BUILD_COLLECTIONS].some(
    (collection) => name === `${collection}/${buildId}`,
  )
}

function parseBuildResource(value: unknown) {
  assertClosedPlainData(value, 'sam3_1_supply_chain_build_resource')
  const root = record(value)
  const results = root.results === undefined ? {} : record(root.results)
  const artifactManifest = results.artifactManifest === undefined
    ? null
    : artifactManifestSchema.parse(results.artifactManifest)
  const numArtifacts = results.numArtifacts === undefined
    ? 0
    : z.coerce.number().int().min(0).max(3).parse(results.numArtifacts)
  return {
    raw: root,
    id: z.string().uuid().parse(root.id),
    name: z.string().parse(root.name),
    projectId: z.literal(PROJECT_ID).parse(root.projectId),
    status: z.enum([
      'PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'FAILURE', 'INTERNAL_ERROR',
      'TIMEOUT', 'CANCELLED', 'EXPIRED', 'STATUS_UNKNOWN',
    ]).parse(root.status),
    warnings: Array.isArray(root.warnings) ? root.warnings : [],
    artifactManifest,
    numArtifacts,
  }
}

function assertCloudBuildEcho(
  build: ReturnType<typeof parseBuildResource>,
  expected: Readonly<Record<string, unknown>>,
  admission: CanonicalSam31ImageSupplyChainBuildAdmission,
): void {
  const root = build.raw
  const actualSteps = z.array(z.unknown()).parse(root.steps)
  const expectedSteps = z.array(z.unknown()).parse(expected.steps)
  const normalizedSteps = actualSteps.map((entry) => {
    const step = record(entry)
    if (
      hasNonEmptyValue(step.env)
      || hasNonEmptyValue(step.secretEnv)
      || hasNonEmptyValue(step.volumes)
      || hasNonEmptyValue(step.dir)
      || hasNonEmptyValue(step.entrypoint)
    ) throw new Error('Cloud Build step gained unapproved execution input.')
    return {
      id: step.id,
      name: step.name,
      ...(Array.isArray(step.waitFor) && step.waitFor.length > 0
        ? { waitFor: step.waitFor }
        : {}),
      args: step.args,
    }
  })
  const actualArtifacts = record(record(root.artifacts).objects)
  const expectedArtifacts = record(record(expected.artifacts).objects)
  const actualOptions = record(root.options)
  const expectedOptions = record(expected.options)
  if (
    build.status !== 'SUCCESS'
    || build.warnings.length !== 0
    || !sameJson(normalizedSteps, expectedSteps)
    || actualArtifacts.location !== expectedArtifacts.location
    || !sameJson(actualArtifacts.paths, expectedArtifacts.paths)
    || root.timeout !== expected.timeout
    || root.queueTtl !== expected.queueTtl
    || root.serviceAccount !== expected.serviceAccount
    || actualOptions.machineType !== expectedOptions.machineType
    || canonicalCloudBuildInteger(actualOptions.diskSizeGb) !==
      canonicalCloudBuildInteger(expectedOptions.diskSizeGb)
    || actualOptions.requestedVerifyOption !==
      expectedOptions.requestedVerifyOption
    || actualOptions.logging !== expectedOptions.logging
    || !sameJson(root.tags, expected.tags)
    || hasNonEmptyValue(root.logsBucket)
    || hasNonEmptyValue(root.source)
    || hasNonEmptyValue(root.images)
    || hasNonEmptyValue(root.substitutions)
    || hasNonEmptyValue(root.secrets)
    || hasNonEmptyValue(root.availableSecrets)
    || hasNonEmptyValue(root.buildTriggerId)
    || hasNonEmptyValue(actualOptions.pool)
    || build.numArtifacts !== admission.evidenceArtifactPaths.length
    || !build.artifactManifest
    || !build.artifactManifest.startsWith(
      `gs://${admission.evidenceBucket}/${admission.evidencePrefix}/`,
    )
  ) throw new Error('Supply-chain Cloud Build differs from admission.')
}

function canonicalCloudBuildInteger(value: unknown): string {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    return String(value)
  }
  return z.string().regex(/^(?:0|[1-9][0-9]{0,9})$/u).parse(value)
}

function buildSubmission(input: Omit<
  z.input<typeof submissionWithoutHashSchema>,
  | 'schemaVersion'
  | 'source'
  | 'automaticRetryAllowed'
  | 'imageSignatureKnownCreated'
  | 'sbomKnownCreated'
  | 'imageSupplyChainReleaseGranted'
  | 'gpuRuntimeAuthorized'
  | 'customerCreditMutationCreated'
  | 'productionReady'
>): CanonicalSam31ImageSupplyChainBuildSubmission {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION,
    source: 'canonical_sam3_1_image_supply_chain_build_submission_owner',
    ...input,
    automaticRetryAllowed: false,
    imageSignatureKnownCreated: false,
    sbomKnownCreated: false,
    imageSupplyChainReleaseGranted: false,
    gpuRuntimeAuthorized: false,
    customerCreditMutationCreated: false,
    productionReady: false,
  })
  return canonicalSam31ImageSupplyChainBuildSubmissionSchema.parse({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function buildObservation(input: Omit<
  z.input<typeof observationWithoutHashSchema>,
  | 'schemaVersion'
  | 'source'
  | 'evidenceArtifactsExactReread'
  | 'vulnerabilityOccurrencesReread'
  | 'originalBuildProvenanceReread'
  | 'imageSupplyChainReleaseGranted'
  | 'gpuRuntimeAuthorized'
  | 'customerCreditMutationCreated'
  | 'productionReady'
>): CanonicalSam31ImageSupplyChainBuildObservation {
  const payload = observationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_OBSERVATION_VERSION,
    source: 'canonical_sam3_1_image_supply_chain_build_terminal_owner',
    ...input,
    evidenceArtifactsExactReread: false,
    vulnerabilityOccurrencesReread: false,
    originalBuildProvenanceReread: false,
    imageSupplyChainReleaseGranted: false,
    gpuRuntimeAuthorized: false,
    customerCreditMutationCreated: false,
    productionReady: false,
  })
  return canonicalSam31ImageSupplyChainBuildObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function safeEvidenceRef(value: unknown) {
  const parsed = evidenceRefSchema.safeParse(value)
  return parsed.success ? parsed.data : {
    id: 'sam31-supply-chain-invalid-admission',
    version: 1 as const,
    contentHash: `sha256:${'0'.repeat(64)}` as const,
  }
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a record.')
  }
  return value as Record<string, unknown>
}

function hasNonEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return value !== ''
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (item: unknown): void => {
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw new Error(`${label} contains a cycle.`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new Error(`${label} must contain plain data only.`)
    }
    seen.add(item)
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') {
        throw new Error(`${label} contains a symbol key.`)
      }
      const descriptor = Object.getOwnPropertyDescriptor(item, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label} contains an accessor.`)
      }
      visit(descriptor.value)
    }
    seen.delete(item)
  }
  visit(value)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}
