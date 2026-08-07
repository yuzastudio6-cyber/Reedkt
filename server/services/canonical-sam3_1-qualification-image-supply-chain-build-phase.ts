import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageBuildAuthority,
  type CanonicalSam31QualificationImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import {
  assertCanonicalSam31QualificationImageBuildSubmission,
  assertCanonicalSam31QualificationImageBuildTerminal,
  type CanonicalSam31QualificationImageBuildSubmission,
  type CanonicalSam31QualificationImageBuildTerminal,
} from './canonical-sam3_1-qualification-image-build-phase'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION =
  'canonical-sam3_1-qualification-image-supply-chain-build-admission-v1' as const
export const
CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION =
  'canonical-sam3_1-qualification-image-supply-chain-build-submission-v1' as const
export const
CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_OBSERVATION_VERSION =
  'canonical-sam3_1-qualification-image-supply-chain-build-observation-v1' as const

const PROJECT_ID = 'reeditpro' as const
const BUILD_COLLECTION =
  'projects/reeditpro/locations/us-central1/builds' as const
const BUILD_COLLECTION_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const
const BUILD_CREATE_ENDPOINT =
  `${BUILD_COLLECTION_ENDPOINT}?projectId=reeditpro` as const
const IMAGE_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification' as const
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
const SBOM_PATH = 'sam31-qualification.spdx.json' as const
const SIGNATURE_BUNDLE_PATH =
  'sam31-qualification-cosign-signature.bundle.json' as const
const SIGNATURE_VERIFICATION_PATH =
  'sam31-qualification-cosign-verification.json' as const
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
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-qualification@sha256:[a-f0-9]{64}$/u,
)
const artifactPrefixSchema = z.string().regex(
  /^private\/sam3_1\/qualification-image-supply-chain\/v1\/[a-f0-9]{64}$/u,
)
const artifactManifestSchema = z.string().regex(
  /^gs:\/\/reeditpro-production-reeditpro-image-supply-chain-evidence\/private\/sam3_1\/qualification-image-supply-chain\/v1\/[a-f0-9]{64}\/[A-Za-z0-9._/-]+\.json(?:#[1-9][0-9]{0,30})?$/u,
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
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION,
  ),
  source: z.literal('canonical_sam3_1_image_supply_chain_build_owner'),
  buildPurpose: z.literal('source_checkpoint_qualification'),
  imageRole: z.literal('qualification_image'),
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
    exactCanonicalQualificationImageBuildReread: z.literal(true),
    exactImmutableImageDigestBound: z.literal(true),
    exactNumericKmsKeyVersionBound: z.literal(true),
    supplyChainBuildAuthorized: z.literal(true),
    callerSelectedImageAllowed: z.literal(false),
    callerSelectedBuildStepsAllowed: z.literal(false),
    callerSelectedArtifactLocationAllowed: z.literal(false),
    callerPromptCommandOrSecretAllowed: z.literal(false),
    modelCheckpointIncluded: z.literal(false),
    sourceCheckpointQualificationReceiptIncluded: z.literal(false),
    customerMediaIncluded: z.literal(false),
    gpuQualificationJobAuthorized: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (
    value.cloudImageBuildResource !==
      `${BUILD_COLLECTION}/${value.cloudImageBuildId}`
    || !value.immutableImageUri.endsWith(`@${value.immutableImageDigest}`)
    || value.kmsKeyUri !== `gcpkms://${value.kmsKeyVersionResource}`
    || value.evidencePrefix !==
      `private/sam3_1/qualification-image-supply-chain/v1/${value.imageBuildTerminalObservationRef.contentHash.slice(7)}`
  ) context.addIssue({
    code: 'custom',
    message: 'Qualification image supply-chain admission lost lineage.',
  })
})

export const canonicalSam31QualificationImageSupplyChainBuildAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: rawSha256 }).strict()
export type CanonicalSam31QualificationImageSupplyChainBuildAdmission =
  z.infer<
    typeof canonicalSam31QualificationImageSupplyChainBuildAdmissionSchema
  >

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_image_supply_chain_build_submission_owner',
  ),
  buildPurpose: z.literal('source_checkpoint_qualification'),
  imageRole: z.literal('qualification_image'),
  disposition: z.enum([
    'rejected_before_creation', 'submitted', 'outcome_unknown',
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
  sourceCheckpointQualificationGranted: z.literal(false),
  gpuQualificationJobDispatched: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  customerCreditMutationCreated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const submitted = value.disposition === 'submitted'
  const rejected = value.disposition === 'rejected_before_creation'
  const known = value.disposition === 'outcome_unknown'
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
        : known
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
    message: 'Qualification image supply-chain submission changed truth.',
  })
})

export const
canonicalSam31QualificationImageSupplyChainBuildSubmissionSchema =
  submissionWithoutHashSchema.extend({ submissionHash: rawSha256 }).strict()
export type CanonicalSam31QualificationImageSupplyChainBuildSubmission =
  z.infer<
    typeof canonicalSam31QualificationImageSupplyChainBuildSubmissionSchema
  >

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_image_supply_chain_build_terminal_owner',
  ),
  buildPurpose: z.literal('source_checkpoint_qualification'),
  imageRole: z.literal('qualification_image'),
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
    'PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'FAILURE', 'INTERNAL_ERROR',
    'TIMEOUT', 'CANCELLED', 'EXPIRED', 'STATUS_UNKNOWN',
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
  sourceCheckpointQualificationGranted: z.literal(false),
  gpuQualificationJobDispatched: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
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
    message: 'Qualification image supply-chain observation changed truth.',
  })
})

export const
canonicalSam31QualificationImageSupplyChainBuildObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: rawSha256 }).strict()
export type CanonicalSam31QualificationImageSupplyChainBuildObservation =
  z.infer<
    typeof canonicalSam31QualificationImageSupplyChainBuildObservationSchema
  >

export interface CanonicalSam31QualificationImageSupplyChainAdmissionReadPort {
  rereadQualificationImageSupplyChainAdmission(input: {
    readonly admissionRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalSam31QualificationImageSupplyChainBuildAdmission | null>
}

export interface CanonicalSam31QualificationImageSupplyChainStatePort {
  consumeQualificationImageSupplyChainAdmissionCreateOnly(input: {
    readonly admissionRef: z.infer<typeof evidenceRefSchema>
    readonly buildRequestHash: string
    readonly consumedAt: string
  }): Promise<boolean>
  persistQualificationImageSupplyChainSubmissionCreateOnly(input: {
    readonly submission:
      CanonicalSam31QualificationImageSupplyChainBuildSubmission
  }): Promise<boolean>
  persistQualificationImageSupplyChainObservationCreateOnly(input: {
    readonly observation:
      CanonicalSam31QualificationImageSupplyChainBuildObservation
  }): Promise<boolean>
}

export interface CanonicalSam31QualificationImageSupplyChainTransport {
  request(input: {
    readonly method: 'GET' | 'POST'
    readonly url: string
    readonly body?: Readonly<Record<string, unknown>>
  }): Promise<{ readonly status: number; readonly json: unknown }>
}

export function createCanonicalSam31QualificationImageSupplyChainAdmission(
  input: {
    readonly admissionId: string
    readonly authority: CanonicalSam31QualificationImageBuildAuthority
    readonly imageBuildSubmission:
      CanonicalSam31QualificationImageBuildSubmission
    readonly imageBuildTerminal:
      CanonicalSam31QualificationImageBuildTerminal
    readonly kmsKeyVersionResource: string
    readonly admittedAt: string
  },
): CanonicalSam31QualificationImageSupplyChainBuildAdmission {
  const authority = assertCanonicalSam31QualificationImageBuildAuthority(
    input.authority,
  )
  const submission = assertCanonicalSam31QualificationImageBuildSubmission(
    input.imageBuildSubmission,
  )
  const terminal = assertCanonicalSam31QualificationImageBuildTerminal(
    input.imageBuildTerminal,
  )
  const buildAuthorityRef = qualificationImageBuildAuthorityReference(
    authority,
  )
  const imageBuildSubmissionRef = qualificationImageBuildSubmissionReference(
    submission,
  )
  const imageBuildTerminalObservationRef =
    qualificationImageBuildTerminalReference(terminal)
  if (
    authority.evidenceClass !== 'canonical_private_reread'
    || authority.status !== 'authorized_for_private_cloud_build'
    || submission.disposition !== 'submitted'
    || terminal.disposition !==
      'qualification_image_built_pending_supply_chain_release'
    || !terminal.immutableImageUri
    || !terminal.immutableImageDigest
    || terminal.artifactRegistryPackage !== IMAGE_PACKAGE
    || terminal.cloudBuildId !== submission.cloudBuildId
    || !sameRef(submission.authorityRef, buildAuthorityRef)
    || !sameRef(terminal.authorityRef, buildAuthorityRef)
    || !sameRef(terminal.submissionRef, imageBuildSubmissionRef)
  ) throw new Error('SAM 3.1 has no qualification image to secure.')
  const keyResource = kmsKeyVersionSchema.parse(input.kmsKeyVersionResource)
  const prefix =
    `private/sam3_1/qualification-image-supply-chain/v1/${terminal.observationHash}` as const
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION,
    source: 'canonical_sam3_1_image_supply_chain_build_owner',
    buildPurpose: 'source_checkpoint_qualification',
    imageRole: 'qualification_image',
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
    kmsKeyVersionResource: keyResource,
    kmsKeyUri: `gcpkms://${keyResource}`,
    evidenceBucket: EVIDENCE_BUCKET,
    evidencePrefix: prefix,
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
      exactCanonicalQualificationImageBuildReread: true,
      exactImmutableImageDigestBound: true,
      exactNumericKmsKeyVersionBound: true,
      supplyChainBuildAuthorized: true,
      callerSelectedImageAllowed: false,
      callerSelectedBuildStepsAllowed: false,
      callerSelectedArtifactLocationAllowed: false,
      callerPromptCommandOrSecretAllowed: false,
      modelCheckpointIncluded: false,
      sourceCheckpointQualificationReceiptIncluded: false,
      customerMediaIncluded: false,
      gpuQualificationJobAuthorized: false,
      runtimeReleaseGranted: false,
      customerCreditMutationAllowed: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalSam31QualificationImageSupplyChainBuildAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalSam31QualificationImageSupplyChainBuildPhase(
  input: {
    readonly admissionReadPort:
      CanonicalSam31QualificationImageSupplyChainAdmissionReadPort
    readonly statePort: CanonicalSam31QualificationImageSupplyChainStatePort
    readonly authenticatedTransport:
      CanonicalSam31QualificationImageSupplyChainTransport
    readonly now?: () => string
  },
) {
  return Object.freeze({
    startOneSupplyChainBuild: async (request: {
      readonly admissionRef: z.infer<typeof evidenceRefSchema>
    }): Promise<CanonicalSam31QualificationImageSupplyChainBuildSubmission> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      let admission: CanonicalSam31QualificationImageSupplyChainBuildAdmission
      try {
        const ref = evidenceRefSchema.parse(request.admissionRef)
        admission = assertCanonicalSam31QualificationImageSupplyChainAdmission(
          await input.admissionReadPort
            .rereadQualificationImageSupplyChainAdmission({
              admissionRef: ref,
            }),
        )
        if (!sameRef(
          ref,
          qualificationImageSupplyChainAdmissionReference(admission),
        )) throw new Error('Supply-chain admission crossed identity.')
      } catch {
        return buildSubmission({
          disposition: 'rejected_before_creation',
          admissionRef: safeRef(request.admissionRef),
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
      const admissionRef =
        qualificationImageSupplyChainAdmissionReference(admission)
      const body = compileCanonicalSam31QualificationImageSupplyChainBody(
        admission,
      )
      const buildRequestHash = sha256AuthorityValue(body)
      const buildRequestBodyRef = evidenceRefSchema.parse({
        id: `sam31-qualification-supply-chain-request-${buildRequestHash.slice(0, 20)}`,
        version: 1,
        contentHash: `sha256:${buildRequestHash}`,
      })
      const consumed = await input.statePort
        .consumeQualificationImageSupplyChainAdmissionCreateOnly({
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
          body,
        })
        status = response.status
        if (status < 200 || status >= 300) {
          throw new Error('Qualification supply-chain build create failed.')
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
        if (!await input.statePort
          .persistQualificationImageSupplyChainSubmissionCreateOnly({
            submission,
          })) throw new Error('Supply-chain submission was not durable.')
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
        await input.statePort
          .persistQualificationImageSupplyChainSubmissionCreateOnly({
            submission: unknown,
          }).catch(() => false)
        return unknown
      }
    },

    observeOneSupplyChainBuild: async (request: {
      readonly admission:
        CanonicalSam31QualificationImageSupplyChainBuildAdmission
      readonly submission:
        CanonicalSam31QualificationImageSupplyChainBuildSubmission
    }): Promise<CanonicalSam31QualificationImageSupplyChainBuildObservation> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const admission = assertCanonicalSam31QualificationImageSupplyChainAdmission(
        request.admission,
      )
      const submission = assertCanonicalSam31QualificationImageSupplyChainSubmission(
        request.submission,
      )
      const admissionRef =
        qualificationImageSupplyChainAdmissionReference(admission)
      if (
        submission.disposition !== 'submitted'
        || !submission.cloudBuildId
        || !sameRef(submission.admissionRef, admissionRef)
      ) throw new Error('Supply-chain observation is not admitted.')
      const base = {
        admissionRef,
        submissionRef:
          qualificationImageSupplyChainSubmissionReference(submission),
        cloudBuildId: submission.cloudBuildId,
        cloudBuildResource:
          `${BUILD_COLLECTION}/${submission.cloudBuildId}`,
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
          throw new Error('Supply-chain build reread failed.')
        }
        const build = parseBuildResource(response.json)
        if (
          build.id !== submission.cloudBuildId
          || build.name !== `${BUILD_COLLECTION}/${submission.cloudBuildId}`
        ) throw new Error('Supply-chain build crossed identity.')
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
          const failure = buildObservation({
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
          if (!await input.statePort
            .persistQualificationImageSupplyChainObservationCreateOnly({
              observation: failure,
            })) throw new Error('Supply-chain failure was not durable.')
          return failure
        }
        const expected =
          compileCanonicalSam31QualificationImageSupplyChainBody(admission)
        assertBuildEcho(build, expected, admission)
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
        if (!await input.statePort
          .persistQualificationImageSupplyChainObservationCreateOnly({
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

export function compileCanonicalSam31QualificationImageSupplyChainBody(
  value: CanonicalSam31QualificationImageSupplyChainBuildAdmission,
): Readonly<Record<string, unknown>> {
  const admission = assertCanonicalSam31QualificationImageSupplyChainAdmission(
    value,
  )
  const image = admission.immutableImageUri
  const key = admission.kmsKeyUri
  return deepFreeze({
    steps: [
      {
        id: 'pull-immutable-sam31-qualification-image',
        name: admission.toolchain.dockerBuilderImage,
        args: ['pull', image],
      },
      {
        id: 'archive-immutable-sam31-qualification-image',
        name: admission.toolchain.dockerBuilderImage,
        waitFor: ['pull-immutable-sam31-qualification-image'],
        args: ['save', '--output', '/workspace/sam31-qualification-image.tar',
          image],
      },
      {
        id: 'generate-qualification-spdx-2-3-sbom',
        name: admission.toolchain.syftImage,
        waitFor: ['archive-immutable-sam31-qualification-image'],
        args: [
          'scan',
          'docker-archive:/workspace/sam31-qualification-image.tar',
          '--output',
          `spdx-json=/workspace/${SBOM_PATH}`,
        ],
      },
      {
        id: 'sign-immutable-sam31-qualification-image',
        name: admission.toolchain.cosignImage,
        waitFor: ['generate-qualification-spdx-2-3-sbom'],
        args: [
          'sign', '--yes', '--key', key, '--use-signing-config=false',
          '--tlog-upload=false', '--bundle',
          `/workspace/${SIGNATURE_BUNDLE_PATH}`, image,
        ],
      },
      {
        id: 'verify-immutable-sam31-qualification-image-signature',
        name: admission.toolchain.cosignImage,
        waitFor: ['sign-immutable-sam31-qualification-image'],
        args: [
          'verify', '--key', key, '--insecure-ignore-tlog=true',
          '--output', 'json', '--output-file',
          `/workspace/${SIGNATURE_VERIFICATION_PATH}`, image,
        ],
      },
    ],
    artifacts: { objects: {
      location:
        `gs://${admission.evidenceBucket}/${admission.evidencePrefix}/`,
      paths: [...admission.evidenceArtifactPaths],
    } },
    timeout: admission.buildPolicy.timeout,
    queueTtl: admission.buildPolicy.queueTtl,
    options: {
      machineType: admission.buildPolicy.machineType,
      diskSizeGb: admission.buildPolicy.diskSizeGb,
      requestedVerifyOption: admission.buildPolicy.requestedVerifyOption,
      logging: admission.buildPolicy.logging,
    },
    serviceAccount: admission.buildPolicy.serviceAccount,
    tags: [
      'weeditpro', 'sam3-1', 'private-qualification-image-supply-chain',
    ],
  })
}

export function assertCanonicalSam31QualificationImageSupplyChainAdmission(
  value: unknown,
): CanonicalSam31QualificationImageSupplyChainBuildAdmission {
  assertPlainSerializedData(value, 'sam31_qualification_supply_admission')
  const parsed = canonicalSam31QualificationImageSupplyChainBuildAdmissionSchema
    .parse(value)
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Qualification supply-chain admission hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationImageSupplyChainSubmission(
  value: unknown,
): CanonicalSam31QualificationImageSupplyChainBuildSubmission {
  assertPlainSerializedData(value, 'sam31_qualification_supply_submission')
  const parsed =
    canonicalSam31QualificationImageSupplyChainBuildSubmissionSchema.parse(
      value,
    )
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Qualification supply-chain submission hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationImageSupplyChainObservation(
  value: unknown,
): CanonicalSam31QualificationImageSupplyChainBuildObservation {
  assertPlainSerializedData(value, 'sam31_qualification_supply_observation')
  const parsed =
    canonicalSam31QualificationImageSupplyChainBuildObservationSchema.parse(
      value,
    )
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Qualification supply-chain observation hash changed.')
  }
  return parsed
}

export function qualificationImageSupplyChainAdmissionReference(
  value: CanonicalSam31QualificationImageSupplyChainBuildAdmission,
) {
  const parsed = assertCanonicalSam31QualificationImageSupplyChainAdmission(
    value,
  )
  return evidenceRefSchema.parse({
    id: parsed.admissionId,
    version: parsed.admissionVersion,
    contentHash: `sha256:${parsed.admissionHash}`,
  })
}

export function qualificationImageSupplyChainSubmissionReference(
  value: CanonicalSam31QualificationImageSupplyChainBuildSubmission,
) {
  const parsed = assertCanonicalSam31QualificationImageSupplyChainSubmission(
    value,
  )
  return evidenceRefSchema.parse({
    id: `sam31-qualification-supply-submission-${parsed.submissionHash.slice(0, 20)}`,
    version: 1,
    contentHash: `sha256:${parsed.submissionHash}`,
  })
}

export function qualificationImageSupplyChainObservationReference(
  value: CanonicalSam31QualificationImageSupplyChainBuildObservation,
) {
  const parsed = assertCanonicalSam31QualificationImageSupplyChainObservation(
    value,
  )
  return evidenceRefSchema.parse({
    id: `sam31-qualification-supply-observation-${parsed.observationHash.slice(0, 20)}`,
    version: 1,
    contentHash: `sha256:${parsed.observationHash}`,
  })
}

function qualificationImageBuildAuthorityReference(
  value: CanonicalSam31QualificationImageBuildAuthority,
) {
  return evidenceRefSchema.parse({
    id: value.authorityId,
    version: value.authorityVersion,
    contentHash: `sha256:${value.authorityHash}`,
  })
}

function qualificationImageBuildSubmissionReference(
  value: CanonicalSam31QualificationImageBuildSubmission,
) {
  return evidenceRefSchema.parse({
    id: `sam31-qualification-image-submission-${value.submissionHash.slice(0, 20)}`,
    version: 1,
    contentHash: `sha256:${value.submissionHash}`,
  })
}

function qualificationImageBuildTerminalReference(
  value: CanonicalSam31QualificationImageBuildTerminal,
) {
  return evidenceRefSchema.parse({
    id: `sam31-qualification-image-terminal-${value.observationHash.slice(0, 20)}`,
    version: 1,
    contentHash: `sha256:${value.observationHash}`,
  })
}

function parseBuildCreateOperation(value: unknown) {
  assertPlainSerializedData(value, 'sam31_qualification_supply_create')
  const root = record(value)
  const operationName = safeId.parse(root.name)
  const build = record(record(root.metadata).build)
  const buildId = z.string().uuid().parse(build.id)
  if (
    build.name !== `${BUILD_COLLECTION}/${buildId}`
    || build.projectId !== PROJECT_ID
  ) throw new Error('Qualification supply-chain create crossed project.')
  return { operationName, buildId }
}

function parseBuildResource(value: unknown) {
  assertPlainSerializedData(value, 'sam31_qualification_supply_resource')
  const root = record(value)
  const results = root.results === undefined ? {} : record(root.results)
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
    artifactManifest: results.artifactManifest === undefined
      ? null
      : artifactManifestSchema.parse(results.artifactManifest),
    numArtifacts: results.numArtifacts === undefined
      ? 0
      : z.coerce.number().int().min(0).max(3).parse(results.numArtifacts),
  }
}

function assertBuildEcho(
  build: ReturnType<typeof parseBuildResource>,
  expected: Readonly<Record<string, unknown>>,
  admission: CanonicalSam31QualificationImageSupplyChainBuildAdmission,
): void {
  const root = build.raw
  const actualSteps = z.array(z.unknown()).parse(root.steps)
  const expectedSteps = z.array(z.unknown()).parse(expected.steps)
  const normalizedSteps = actualSteps.map((entry) => {
    const step = record(entry)
    if (
      hasNonEmpty(step.env)
      || hasNonEmpty(step.secretEnv)
      || hasNonEmpty(step.volumes)
      || hasNonEmpty(step.dir)
      || hasNonEmpty(step.entrypoint)
    ) throw new Error('Supply-chain step gained execution input.')
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
    || actualOptions.diskSizeGb !== expectedOptions.diskSizeGb
    || actualOptions.requestedVerifyOption !==
      expectedOptions.requestedVerifyOption
    || actualOptions.logging !== expectedOptions.logging
    || !sameJson(root.tags, expected.tags)
    || hasNonEmpty(root.source)
    || hasNonEmpty(root.images)
    || hasNonEmpty(root.substitutions)
    || hasNonEmpty(root.secrets)
    || hasNonEmpty(root.availableSecrets)
    || hasNonEmpty(root.buildTriggerId)
    || hasNonEmpty(actualOptions.pool)
    || build.numArtifacts !== admission.evidenceArtifactPaths.length
    || !build.artifactManifest
    || !build.artifactManifest.startsWith(
      `gs://${admission.evidenceBucket}/${admission.evidencePrefix}/`,
    )
  ) throw new Error('Qualification supply-chain build changed.')
}

function buildSubmission(input: Omit<
  z.input<typeof submissionWithoutHashSchema>,
  | 'schemaVersion' | 'source' | 'buildPurpose' | 'imageRole'
  | 'automaticRetryAllowed' | 'imageSignatureKnownCreated'
  | 'sbomKnownCreated' | 'imageSupplyChainReleaseGranted'
  | 'sourceCheckpointQualificationGranted' | 'gpuQualificationJobDispatched'
  | 'runtimeReleaseGranted' | 'customerCreditMutationCreated'
  | 'productionReady'
>): CanonicalSam31QualificationImageSupplyChainBuildSubmission {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION,
    source: 'canonical_sam3_1_image_supply_chain_build_submission_owner',
    buildPurpose: 'source_checkpoint_qualification',
    imageRole: 'qualification_image',
    automaticRetryAllowed: false,
    imageSignatureKnownCreated: false,
    sbomKnownCreated: false,
    imageSupplyChainReleaseGranted: false,
    sourceCheckpointQualificationGranted: false,
    gpuQualificationJobDispatched: false,
    runtimeReleaseGranted: false,
    customerCreditMutationCreated: false,
    productionReady: false,
    ...input,
  })
  return canonicalSam31QualificationImageSupplyChainBuildSubmissionSchema
    .parse({ ...payload, submissionHash: sha256AuthorityValue(payload) })
}

function buildObservation(input: Omit<
  z.input<typeof observationWithoutHashSchema>,
  | 'schemaVersion' | 'source' | 'buildPurpose' | 'imageRole'
  | 'evidenceArtifactsExactReread' | 'vulnerabilityOccurrencesReread'
  | 'originalBuildProvenanceReread' | 'imageSupplyChainReleaseGranted'
  | 'sourceCheckpointQualificationGranted' | 'gpuQualificationJobDispatched'
  | 'runtimeReleaseGranted' | 'customerCreditMutationCreated'
  | 'productionReady'
>): CanonicalSam31QualificationImageSupplyChainBuildObservation {
  const payload = observationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_OBSERVATION_VERSION,
    source: 'canonical_sam3_1_image_supply_chain_build_terminal_owner',
    buildPurpose: 'source_checkpoint_qualification',
    imageRole: 'qualification_image',
    evidenceArtifactsExactReread: false,
    vulnerabilityOccurrencesReread: false,
    originalBuildProvenanceReread: false,
    imageSupplyChainReleaseGranted: false,
    sourceCheckpointQualificationGranted: false,
    gpuQualificationJobDispatched: false,
    runtimeReleaseGranted: false,
    customerCreditMutationCreated: false,
    productionReady: false,
    ...input,
  })
  return canonicalSam31QualificationImageSupplyChainBuildObservationSchema
    .parse({ ...payload, observationHash: sha256AuthorityValue(payload) })
}

function safeRef(value: unknown) {
  const parsed = evidenceRefSchema.safeParse(value)
  return parsed.success ? parsed.data : {
    id: 'sam31-qualification-supply-invalid',
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
    throw new Error('Qualification supply-chain record is invalid.')
  }
  return value as Record<string, unknown>
}

function hasNonEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Reflect.ownKeys(value).length > 0
  return true
}

function sameJson(left: unknown, right: unknown): boolean {
  return sha256AuthorityValue(left) === sha256AuthorityValue(right)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[key])
    }
  }
  return value
}
