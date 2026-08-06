import { z } from 'zod'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import {
  canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build-admission-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build-submission-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_TERMINAL_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build-terminal-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PROJECT_NUMBER = '390722338345' as const
const BUILD_COLLECTION =
  'projects/reeditpro/locations/us-central1/builds' as const
const BUILD_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const
const IMAGE_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-track-all-l4-task-qa' as const
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
const KMS_KEY_VERSION =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-image-signing/cryptoKeys/sam31-image-signing/cryptoKeyVersions/1' as const
const ARTIFACT_PATHS = Object.freeze([
  'track-all-l4-task-qa.spdx.json',
  'cosign-signature.bundle.json',
  'cosign-verification.json',
] as const)

const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const imageUriSchema = z.string().regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-track-all-l4-task-qa@sha256:[a-f0-9]{64}$/u,
)
const buildStatusSchema = z.enum([
  'STATUS_UNKNOWN', 'PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'FAILURE',
  'INTERNAL_ERROR', 'TIMEOUT', 'CANCELLED', 'EXPIRED',
])

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_build_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('authorized_for_private_supply_chain_build'),
  admissionId: safeId,
  admissionVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  accelerator: z.literal('nvidia_l4'),
  routeId: z.literal('l4_standard_primary'),
  imageBuildAuthorityRef: evidenceRefSchema,
  imageBuildSubmissionRef: evidenceRefSchema,
  imageBuildTerminalRef: evidenceRefSchema,
  imageBuildId: z.string().uuid(),
  imageBuildResource: safeId,
  buildSourceCoordinate: z.object({
    projectId: z.literal(PROJECT_ID),
    bucketName: z.literal('reeditpro-production-reeditpro-image-build-inputs'),
    objectName: z.string().startsWith(
      'private/image-build-inputs/track-all-l4-task-qa/',
    ).endsWith('.tar.gz'),
    generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
    etag: z.string().min(1).max(256),
    byteLength: z.number().int().positive().safe(),
    sha256: rawSha256,
  }).strict(),
  immutableImageUri: imageUriSchema,
  immutableImageDigest: prefixedSha256,
  artifactRegistryPackage: z.literal(IMAGE_PACKAGE),
  kmsKeyVersionResource: z.literal(KMS_KEY_VERSION),
  evidenceBucket: z.literal(EVIDENCE_BUCKET),
  evidencePrefix: z.string().regex(
    /^private\/track-all\/sam3_1\/l4-task-qa\/image-supply-chain\/v1\/[a-f0-9]{64}$/u,
  ),
  evidenceArtifactPaths: z.tuple([
    z.literal(ARTIFACT_PATHS[0]),
    z.literal(ARTIFACT_PATHS[1]),
    z.literal(ARTIFACT_PATHS[2]),
  ]),
  buildPolicy: z.object({
    endpoint: z.literal(BUILD_ENDPOINT),
    serviceAccount: z.literal(SIGNER_SERVICE_ACCOUNT),
    dockerBuilderImage: z.literal(DOCKER_BUILDER_IMAGE),
    syftImage: z.literal(SYFT_IMAGE),
    syftRelease: z.literal('v1.44.0'),
    cosignImage: z.literal(COSIGN_IMAGE),
    cosignRelease: z.literal('v3.0.6'),
    timeout: z.literal('3600s'),
    queueTtl: z.literal('600s'),
    machineType: z.literal('E2_HIGHCPU_8'),
    diskSizeGb: z.literal(200),
    requestedVerifyOption: z.literal('VERIFIED'),
    logging: z.literal('CLOUD_LOGGING_ONLY'),
    transparencyLogUploadAllowed: z.literal(false),
    automaticRetryAllowed: z.literal(false),
  }).strict(),
  authority: z.object({
    exactImageBuildLineageReread: z.literal(true),
    exactImmutableDigestBound: z.literal(true),
    exactNumericKmsVersionBound: z.literal(true),
    callerImageCommandArtifactPathOrBuildStepAccepted: z.literal(false),
    checkpointOrModelWeightsIncluded: z.literal(false),
    customerMediaIncluded: z.literal(false),
    gpuRuntimeAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  admittedAt: timestamp,
}).strict().superRefine((value, context) => {
  const expectedPrefix =
    `private/track-all/sam3_1/l4-task-qa/image-supply-chain/v1/${value.imageBuildTerminalRef.contentHash.slice(7)}`
  if (
    value.imageBuildResource !== `${BUILD_COLLECTION}/${value.imageBuildId}`
    || value.immutableImageUri !==
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa@${value.immutableImageDigest}`
    || value.evidencePrefix !== expectedPrefix
  ) context.addIssue({
    code: 'custom',
    message: 'Track All L4 supply-chain admission lost immutable lineage.',
  })
})

export const canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission =
  z.infer<
    typeof canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmissionSchema
  >

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_submission_owner',
  ),
  disposition: z.enum(['rejected_before_creation', 'submitted', 'outcome_unknown']),
  admissionRef: evidenceRefSchema,
  buildRequestHash: rawSha256.nullable(),
  buildRequestRef: evidenceRefSchema.nullable(),
  providerHttpStatus: z.number().int().min(100).max(599).nullable(),
  cloudBuildOperationName: safeId.nullable(),
  cloudBuildId: z.string().uuid().nullable(),
  cloudBuildResource: safeId.nullable(),
  providerOutcome: z.enum(['not_executed', 'executed', 'unknown']),
  durableAdmissionConsumptionCreated: z.boolean(),
  durableSubmissionCreated: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  supplyChainBuildKnownStarted: z.boolean(),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const submitted = value.disposition === 'submitted'
  if (submitted
    ? !value.buildRequestHash || !value.buildRequestRef
      || value.providerOutcome !== 'executed'
      || !value.cloudBuildId
      || value.cloudBuildResource !== `${BUILD_COLLECTION}/${value.cloudBuildId}`
      || !value.durableAdmissionConsumptionCreated
      || !value.durableSubmissionCreated
      || !value.supplyChainBuildKnownStarted
    : value.disposition === 'rejected_before_creation'
      ? value.providerOutcome !== 'not_executed'
        || value.supplyChainBuildKnownStarted
      : value.providerOutcome === 'not_executed') context.addIssue({
    code: 'custom',
    message: 'Track All L4 supply-chain submission truth changed.',
  })
})

export const canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmissionSchema =
  submissionWithoutHashSchema.extend({ submissionHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission =
  z.infer<
    typeof canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmissionSchema
  >

const terminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_terminal_owner',
  ),
  disposition: z.enum([
    'pending', 'supply_chain_artifacts_ready_pending_exact_reread',
    'terminal_failure', 'outcome_unknown',
  ]),
  admissionRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  cloudBuildId: z.string().uuid(),
  cloudBuildResource: safeId,
  immutableImageUri: imageUriSchema,
  immutableImageDigest: prefixedSha256,
  cloudBuildStatus: buildStatusSchema.nullable(),
  providerHttpStatus: z.number().int().min(100).max(599).nullable(),
  exactBuildConfigurationEchoVerified: z.boolean(),
  warningsAbsent: z.boolean(),
  evidenceArtifactManifestUri: z.string().nullable(),
  evidenceArtifactCount: z.number().int().nonnegative().safe(),
  durableTerminalCreated: z.boolean(),
  allPinnedBuildStepsCompleted: z.boolean(),
  sbomArtifactCreated: z.boolean(),
  kmsDigestSignatureCreatedAndVerified: z.boolean(),
  exactEvidenceReread: z.literal(false),
  vulnerabilityScanPassed: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const success =
    value.disposition === 'supply_chain_artifacts_ready_pending_exact_reread'
  if (
    value.cloudBuildResource !== `${BUILD_COLLECTION}/${value.cloudBuildId}`
    || (success
      ? value.cloudBuildStatus !== 'SUCCESS'
        || !value.exactBuildConfigurationEchoVerified
        || !value.warningsAbsent
        || !value.evidenceArtifactManifestUri
        || value.evidenceArtifactCount !== ARTIFACT_PATHS.length
        || !value.durableTerminalCreated
        || !value.allPinnedBuildStepsCompleted
        || !value.sbomArtifactCreated
        || !value.kmsDigestSignatureCreatedAndVerified
      : value.evidenceArtifactManifestUri !== null
        || value.evidenceArtifactCount !== 0)
  ) context.addIssue({
    code: 'custom',
    message: 'Track All L4 supply-chain terminal truth changed.',
  })
})

export const canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminalSchema =
  terminalWithoutHashSchema.extend({ terminalHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal =
  z.infer<
    typeof canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminalSchema
  >

export interface CanonicalTrackAllSam31L4TaskQaImageSupplyChainReadPort {
  rereadAdmission(input: { readonly admissionRef: EvidenceRef }):
    Promise<CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission | null>
}

export interface CanonicalTrackAllSam31L4TaskQaImageSupplyChainStatePort {
  consumeAdmissionCreateOnly(input: {
    readonly admissionRef: EvidenceRef
    readonly buildRequestHash: string
    readonly consumedAt: string
  }): Promise<boolean>
  persistSubmissionCreateOnly(input: {
    readonly submission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission
  }): Promise<boolean>
  persistTerminalCreateOnly(input: {
    readonly terminal: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal
  }): Promise<boolean>
}

export interface CanonicalTrackAllSam31L4TaskQaImageSupplyChainTransport {
  request(input: {
    readonly method: 'GET' | 'POST'
    readonly url: string
    readonly body?: Readonly<Record<string, unknown>>
  }): Promise<{ readonly status: number; readonly json: unknown }>
}

type EvidenceRef = z.infer<typeof evidenceRefSchema>

export function createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(
  input: {
    readonly admissionId: string
    readonly authority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
    readonly imageBuildSubmission:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
    readonly imageBuildTerminal:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
    readonly admittedAt: string
  },
): CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission {
  const authority =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(
      input.authority,
    )
  const submission =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(
      input.imageBuildSubmission,
    )
  const terminal =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal(
      input.imageBuildTerminal,
    )
  const authorityRef =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef(authority)
  const submissionRef =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(submission)
  const terminalRef =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(terminal)
  if (
    authority.evidenceClass !== 'canonical_private_reread'
    || authority.status !== 'authorized_for_private_cloud_build'
    || submission.disposition !== 'outcome_unknown'
    || submission.providerOutcome !== 'unknown'
    || submission.automaticRetryAllowed
    || !terminal.reconciliationRef
    || terminal.disposition !== 'image_built_pending_supply_chain_release'
    || !terminal.immutableImageUri
    || !terminal.immutableImageDigest
    || !terminal.imageBuiltAndPushed
    || !sameRef(submission.authorityRef, authorityRef)
    || !sameRef(terminal.authorityRef, authorityRef)
    || !sameRef(terminal.submissionRef, submissionRef)
  ) throw new Error('track_all_l4_supply_chain_image_build_not_admitted')

  const payload = admissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_build_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'authorized_for_private_supply_chain_build',
    admissionId: input.admissionId,
    admissionVersion: 1,
    operationId: authority.operationId,
    accelerator: 'nvidia_l4',
    routeId: 'l4_standard_primary',
    imageBuildAuthorityRef: authorityRef,
    imageBuildSubmissionRef: submissionRef,
    imageBuildTerminalRef: terminalRef,
    imageBuildId: terminal.cloudBuildId,
    imageBuildResource: terminal.cloudBuildResource,
    buildSourceCoordinate: authority.buildSourceCoordinate,
    immutableImageUri: terminal.immutableImageUri,
    immutableImageDigest: terminal.immutableImageDigest,
    artifactRegistryPackage: IMAGE_PACKAGE,
    kmsKeyVersionResource: KMS_KEY_VERSION,
    evidenceBucket: EVIDENCE_BUCKET,
    evidencePrefix:
      `private/track-all/sam3_1/l4-task-qa/image-supply-chain/v1/${terminalRef.contentHash.slice(7)}`,
    evidenceArtifactPaths: [...ARTIFACT_PATHS],
    buildPolicy: {
      endpoint: BUILD_ENDPOINT,
      serviceAccount: SIGNER_SERVICE_ACCOUNT,
      dockerBuilderImage: DOCKER_BUILDER_IMAGE,
      syftImage: SYFT_IMAGE,
      syftRelease: 'v1.44.0',
      cosignImage: COSIGN_IMAGE,
      cosignRelease: 'v3.0.6',
      timeout: '3600s',
      queueTtl: '600s',
      machineType: 'E2_HIGHCPU_8',
      diskSizeGb: 200,
      requestedVerifyOption: 'VERIFIED',
      logging: 'CLOUD_LOGGING_ONLY',
      transparencyLogUploadAllowed: false,
      automaticRetryAllowed: false,
    },
    authority: {
      exactImageBuildLineageReread: true,
      exactImmutableDigestBound: true,
      exactNumericKmsVersionBound: true,
      callerImageCommandArtifactPathOrBuildStepAccepted: false,
      checkpointOrModelWeightsIncluded: false,
      customerMediaIncluded: false,
      gpuRuntimeAuthorized: false,
      customerCreditsMutated: false,
      qaApproved: false,
      productionReady: false,
    },
    admittedAt: input.admittedAt,
  })
  return canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmissionSchema
    .parse({ ...payload, admissionHash: sha256AuthorityValue(payload) })
}

export function compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody(
  value: unknown,
): Readonly<Record<string, unknown>> {
  const admission =
    assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(value)
  const image = admission.immutableImageUri
  const key = `gcpkms://${admission.kmsKeyVersionResource}`
  return Object.freeze({
    steps: [
      {
        id: 'pull-immutable-track-all-l4-task-qa-image',
        name: admission.buildPolicy.dockerBuilderImage,
        args: ['pull', image],
      },
      {
        id: 'archive-immutable-track-all-l4-task-qa-image',
        name: admission.buildPolicy.dockerBuilderImage,
        waitFor: ['pull-immutable-track-all-l4-task-qa-image'],
        args: ['save', '--output', '/workspace/track-all-l4-task-qa-image.tar', image],
      },
      {
        id: 'generate-spdx-2-3-sbom',
        name: admission.buildPolicy.syftImage,
        waitFor: ['archive-immutable-track-all-l4-task-qa-image'],
        args: [
          'scan',
          'docker-archive:/workspace/track-all-l4-task-qa-image.tar',
          '--output',
          `spdx-json=/workspace/${ARTIFACT_PATHS[0]}`,
        ],
      },
      {
        id: 'prepare-cosign-workspace-artifacts',
        name: admission.buildPolicy.dockerBuilderImage,
        waitFor: ['generate-spdx-2-3-sbom'],
        entrypoint: '/bin/sh',
        args: [
          '-ceu',
          [
            `: > /workspace/${ARTIFACT_PATHS[1]}`,
            `: > /workspace/${ARTIFACT_PATHS[2]}`,
            `chmod 0666 /workspace/${ARTIFACT_PATHS[1]} /workspace/${ARTIFACT_PATHS[2]}`,
          ].join('\n'),
        ],
      },
      {
        id: 'sign-immutable-track-all-l4-task-qa-image',
        name: admission.buildPolicy.cosignImage,
        waitFor: ['prepare-cosign-workspace-artifacts'],
        args: [
          'sign', '--yes', '--key', key, '--use-signing-config=false',
          '--tlog-upload=false', '--bundle',
          `/workspace/${ARTIFACT_PATHS[1]}`, image,
        ],
      },
      {
        id: 'verify-immutable-track-all-l4-task-qa-image-signature',
        name: admission.buildPolicy.cosignImage,
        waitFor: ['sign-immutable-track-all-l4-task-qa-image'],
        args: [
          'verify', '--key', key, '--insecure-ignore-tlog=true',
          '--output', 'json', '--output-file',
          `/workspace/${ARTIFACT_PATHS[2]}`, image,
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
    tags: ['weeditpro', 'sam3-1', 'track-all-l4-task-qa', 'private-image-supply-chain'],
  })
}

export function createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildService(
  input: {
    readonly readPort: CanonicalTrackAllSam31L4TaskQaImageSupplyChainReadPort
    readonly statePort: CanonicalTrackAllSam31L4TaskQaImageSupplyChainStatePort
    readonly transport: CanonicalTrackAllSam31L4TaskQaImageSupplyChainTransport
    readonly now?: () => string
  },
) {
  return Object.freeze({
    async start(inputValue: { readonly admissionRef: EvidenceRef }) {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const requestedRef = evidenceRefSchema.parse(inputValue.admissionRef)
      let admission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
      try {
        admission =
          assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(
            await input.readPort.rereadAdmission({ admissionRef: requestedRef }),
          )
        if (!sameRef(requestedRef, imageSupplyChainAdmissionRef(admission))) {
          throw new Error('track_all_l4_supply_chain_admission_ref_changed')
        }
      } catch {
        return buildSubmission({
          disposition: 'rejected_before_creation',
          admissionRef: requestedRef,
          buildRequestHash: null,
          buildRequestRef: null,
          providerHttpStatus: null,
          cloudBuildOperationName: null,
          cloudBuildId: null,
          cloudBuildResource: null,
          providerOutcome: 'not_executed',
          durableAdmissionConsumptionCreated: false,
          durableSubmissionCreated: false,
          supplyChainBuildKnownStarted: false,
          observedAt,
        })
      }
      const admissionRef = imageSupplyChainAdmissionRef(admission)
      const body = compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody(
        admission,
      )
      const buildRequestHash = sha256AuthorityValue(body)
      const buildRequestRef = evidenceRefSchema.parse({
        id: `track-all-l4-supply-chain-request-${buildRequestHash.slice(0, 24)}`,
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
        buildRequestRef,
        providerHttpStatus: null,
        cloudBuildOperationName: null,
        cloudBuildId: null,
        cloudBuildResource: null,
        providerOutcome: 'not_executed',
        durableAdmissionConsumptionCreated: false,
        durableSubmissionCreated: false,
        supplyChainBuildKnownStarted: false,
        observedAt,
      })

      let status: number | null = null
      let accepted: { operationName: string; buildId: string } | null = null
      try {
        const response = await input.transport.request({
          method: 'POST', url: BUILD_ENDPOINT, body,
        })
        status = response.status
        if (status < 200 || status >= 300) {
          throw new Error('track_all_l4_supply_chain_create_failed')
        }
        accepted = parseBuildCreateOperation(response.json)
        const submission = buildSubmission({
          disposition: 'submitted',
          admissionRef,
          buildRequestHash,
          buildRequestRef,
          providerHttpStatus: status,
          cloudBuildOperationName: accepted.operationName,
          cloudBuildId: accepted.buildId,
          cloudBuildResource: `${BUILD_COLLECTION}/${accepted.buildId}`,
          providerOutcome: 'executed',
          durableAdmissionConsumptionCreated: true,
          durableSubmissionCreated: true,
          supplyChainBuildKnownStarted: true,
          observedAt,
        })
        if (!await input.statePort.persistSubmissionCreateOnly({ submission })) {
          throw new Error('track_all_l4_supply_chain_submission_not_durable')
        }
        return submission
      } catch {
        const unknown = buildSubmission({
          disposition: 'outcome_unknown',
          admissionRef,
          buildRequestHash,
          buildRequestRef,
          providerHttpStatus: status,
          cloudBuildOperationName: accepted?.operationName ?? null,
          cloudBuildId: accepted?.buildId ?? null,
          cloudBuildResource: accepted
            ? `${BUILD_COLLECTION}/${accepted.buildId}` : null,
          providerOutcome: accepted ? 'executed' : 'unknown',
          durableAdmissionConsumptionCreated: true,
          durableSubmissionCreated: false,
          supplyChainBuildKnownStarted: Boolean(accepted),
          observedAt,
        })
        await input.statePort.persistSubmissionCreateOnly({
          submission: unknown,
        }).catch(() => false)
        return unknown
      }
    },

    async observe(inputValue: {
      readonly admission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
      readonly submission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission
    }) {
      const admission =
        assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(
          inputValue.admission,
        )
      const submission =
        assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission(
          inputValue.submission,
        )
      if (
        submission.disposition !== 'submitted'
        || !submission.cloudBuildId
        || !sameRef(submission.admissionRef, imageSupplyChainAdmissionRef(admission))
      ) throw new Error('track_all_l4_supply_chain_observation_not_admitted')
      const base = {
        admissionRef: imageSupplyChainAdmissionRef(admission),
        submissionRef: imageSupplyChainSubmissionRef(submission),
        cloudBuildId: submission.cloudBuildId,
        cloudBuildResource: `${BUILD_COLLECTION}/${submission.cloudBuildId}`,
        immutableImageUri: admission.immutableImageUri,
        immutableImageDigest: admission.immutableImageDigest,
        observedAt: input.now?.() ?? new Date().toISOString(),
      }
      let providerHttpStatus: number | null = null
      try {
        const response = await input.transport.request({
          method: 'GET', url: `${BUILD_ENDPOINT}/${submission.cloudBuildId}`,
        })
        providerHttpStatus = response.status
        if (providerHttpStatus < 200 || providerHttpStatus >= 300) {
          throw new Error('track_all_l4_supply_chain_read_failed')
        }
        const envelope = parseBuildTerminalEnvelope(response.json)
        if (
          envelope.id !== submission.cloudBuildId
          || !isExpectedCloudBuildResourceName(
            envelope.name,
            submission.cloudBuildId,
          )
        ) throw new Error('track_all_l4_supply_chain_build_crossed')
        if (['PENDING', 'QUEUED', 'WORKING'].includes(envelope.status)) {
          return buildTerminal({
            ...base,
            disposition: 'pending',
            cloudBuildStatus: envelope.status,
            providerHttpStatus,
            exactBuildConfigurationEchoVerified: false,
            warningsAbsent: envelope.warnings.length === 0,
            evidenceArtifactManifestUri: null,
            evidenceArtifactCount: 0,
            durableTerminalCreated: false,
            allPinnedBuildStepsCompleted: false,
            sbomArtifactCreated: false,
            kmsDigestSignatureCreatedAndVerified: false,
          })
        }
        if (envelope.status !== 'SUCCESS') {
          const terminal = buildTerminal({
            ...base,
            disposition: 'terminal_failure',
            cloudBuildStatus: envelope.status,
            providerHttpStatus,
            exactBuildConfigurationEchoVerified: false,
            warningsAbsent: envelope.warnings.length === 0,
            evidenceArtifactManifestUri: null,
            evidenceArtifactCount: 0,
            durableTerminalCreated: true,
            allPinnedBuildStepsCompleted: false,
            sbomArtifactCreated: false,
            kmsDigestSignatureCreatedAndVerified: false,
          })
          if (!await input.statePort.persistTerminalCreateOnly({ terminal })) {
            throw new Error('track_all_l4_supply_chain_failure_not_durable')
          }
          return terminal
        }
        const build = parseBuildResource(response.json)
        assertBuildEcho(build, admission)
        const terminal = buildTerminal({
          ...base,
          disposition: 'supply_chain_artifacts_ready_pending_exact_reread',
          cloudBuildStatus: 'SUCCESS',
          providerHttpStatus,
          exactBuildConfigurationEchoVerified: true,
          warningsAbsent: true,
          evidenceArtifactManifestUri: build.artifactManifest,
          evidenceArtifactCount: build.numArtifacts,
          durableTerminalCreated: true,
          allPinnedBuildStepsCompleted: true,
          sbomArtifactCreated: true,
          kmsDigestSignatureCreatedAndVerified: true,
        })
        if (!await input.statePort.persistTerminalCreateOnly({ terminal })) {
          throw new Error('track_all_l4_supply_chain_success_not_durable')
        }
        return terminal
      } catch {
        return buildTerminal({
          ...base,
          disposition: 'outcome_unknown',
          cloudBuildStatus: null,
          providerHttpStatus,
          exactBuildConfigurationEchoVerified: false,
          warningsAbsent: false,
          evidenceArtifactManifestUri: null,
          evidenceArtifactCount: 0,
          durableTerminalCreated: false,
          allPinnedBuildStepsCompleted: false,
          sbomArtifactCreated: false,
          kmsDigestSignatureCreatedAndVerified: false,
        })
      }
    },
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(
  value: unknown,
) {
  assertClosedPlainData(value, 'track_all_l4_supply_chain_admission')
  const parsed =
    canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmissionSchema.parse(
      value,
    )
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('track_all_l4_supply_chain_admission_hash_changed')
  }
  return parsed
}

export function assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission(
  value: unknown,
) {
  assertClosedPlainData(value, 'track_all_l4_supply_chain_submission')
  const parsed =
    canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmissionSchema.parse(
      value,
    )
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('track_all_l4_supply_chain_submission_hash_changed')
  }
  return parsed
}

export function assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal(
  value: unknown,
) {
  assertClosedPlainData(value, 'track_all_l4_supply_chain_terminal')
  const parsed =
    canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminalSchema.parse(
      value,
    )
  const { terminalHash, ...payload } = parsed
  if (terminalHash !== sha256AuthorityValue(payload)) {
    throw new Error('track_all_l4_supply_chain_terminal_hash_changed')
  }
  return parsed
}

export function imageSupplyChainAdmissionRef(value: unknown): EvidenceRef {
  const record =
    assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(value)
  return evidenceRefSchema.parse({
    id: record.admissionId,
    version: record.admissionVersion,
    contentHash: `sha256:${record.admissionHash}`,
  })
}

export function imageSupplyChainSubmissionRef(value: unknown): EvidenceRef {
  const record =
    assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission(value)
  return evidenceRefSchema.parse({
    id: `track-all-l4-supply-chain-submission-${record.submissionHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${record.submissionHash}`,
  })
}

export function imageSupplyChainTerminalRef(value: unknown): EvidenceRef {
  const record =
    assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal(value)
  return evidenceRefSchema.parse({
    id: `track-all-l4-supply-chain-terminal-${record.terminalHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${record.terminalHash}`,
  })
}

function buildSubmission(input: Omit<
  z.input<typeof submissionWithoutHashSchema>,
  'schemaVersion' | 'source' | 'automaticRetryAllowed' | 'gpuJobDispatched'
    | 'customerCreditsMutated' | 'productionReady'
>) {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_SUBMISSION_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_submission_owner',
    ...input,
    automaticRetryAllowed: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionReady: false,
  })
  return canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmissionSchema
    .parse({ ...payload, submissionHash: sha256AuthorityValue(payload) })
}

function buildTerminal(input: Omit<
  z.input<typeof terminalWithoutHashSchema>,
  'schemaVersion' | 'source' | 'exactEvidenceReread'
    | 'vulnerabilityScanPassed' | 'runtimeReleaseGranted'
    | 'gpuJobDispatched' | 'customerCreditsMutated' | 'qaApproved'
    | 'productionReady'
>) {
  const payload = terminalWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_TERMINAL_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_terminal_owner',
    ...input,
    exactEvidenceReread: false,
    vulnerabilityScanPassed: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    qaApproved: false,
    productionReady: false,
  })
  return canonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminalSchema
    .parse({ ...payload, terminalHash: sha256AuthorityValue(payload) })
}

function parseBuildCreateOperation(value: unknown) {
  assertClosedPlainData(value, 'track_all_l4_supply_chain_create_response')
  const root = z.object({
    name: safeId,
    metadata: z.object({ build: z.object({ id: z.string().uuid() }).passthrough() })
      .passthrough(),
  }).passthrough().parse(value)
  return { operationName: root.name, buildId: root.metadata.build.id }
}

function parseBuildResource(value: unknown) {
  assertClosedPlainData(value, 'track_all_l4_supply_chain_build_response')
  const root = z.object({
    id: z.string().uuid(),
    name: safeId,
    status: buildStatusSchema,
    warnings: z.array(z.unknown()).max(128).default([]),
    steps: z.array(z.object({
      id: z.string(),
      name: z.string(),
      status: buildStatusSchema,
    }).passthrough()).max(16).default([]),
    serviceAccount: z.string().optional(),
    timeout: z.string().optional(),
    queueTtl: z.string().optional(),
    options: z.object({
      machineType: z.string().optional(),
      diskSizeGb: z.union([z.string(), z.number()]).optional(),
      requestedVerifyOption: z.string().optional(),
      logging: z.string().optional(),
    }).passthrough().optional(),
    artifacts: z.object({
      objects: z.object({
        location: z.string(),
        paths: z.array(z.string()),
      }).passthrough(),
    }).passthrough().optional(),
    results: z.object({
      artifactManifest: z.string().optional(),
      numArtifacts: z.union([z.string(), z.number()]).optional(),
    }).passthrough().optional(),
  }).passthrough().parse(value)
  return {
    ...root,
    artifactManifest: root.results?.artifactManifest ?? null,
    numArtifacts: Number(root.results?.numArtifacts ?? 0),
  }
}

function parseBuildTerminalEnvelope(value: unknown) {
  assertClosedPlainData(value, 'track_all_l4_supply_chain_build_envelope')
  return z.object({
    id: z.string().uuid(),
    name: safeId,
    status: buildStatusSchema,
    warnings: z.array(z.unknown()).max(128).default([]),
  }).passthrough().parse(value)
}

function isExpectedCloudBuildResourceName(name: string, buildId: string): boolean {
  return name === `${BUILD_COLLECTION}/${buildId}`
    || name ===
      `projects/${PROJECT_NUMBER}/locations/us-central1/builds/${buildId}`
}

function assertBuildEcho(
  build: ReturnType<typeof parseBuildResource>,
  admission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
): void {
  const expected =
    compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody(admission)
  const expectedSteps = z.array(z.object({
    id: z.string(), name: z.string(),
  }).passthrough()).parse(expected.steps)
  if (
    build.warnings.length !== 0
    || build.serviceAccount !== admission.buildPolicy.serviceAccount
    || build.timeout !== admission.buildPolicy.timeout
    || build.queueTtl !== admission.buildPolicy.queueTtl
    || build.options?.machineType !== admission.buildPolicy.machineType
    || String(build.options?.diskSizeGb) !== String(admission.buildPolicy.diskSizeGb)
    || build.options?.requestedVerifyOption !==
      admission.buildPolicy.requestedVerifyOption
    || build.options?.logging !== admission.buildPolicy.logging
    || build.artifacts?.objects.location !==
      `gs://${admission.evidenceBucket}/${admission.evidencePrefix}/`
    || JSON.stringify(build.artifacts?.objects.paths)
      !== JSON.stringify(admission.evidenceArtifactPaths)
    || build.artifactManifest === null
    || build.numArtifacts !== ARTIFACT_PATHS.length
    || build.steps.length !== expectedSteps.length
    || build.steps.some((step, index) =>
      step.status !== 'SUCCESS'
      || step.id !== expectedSteps[index].id
      || step.name !== expectedSteps[index].name)
  ) throw new Error('track_all_l4_supply_chain_build_echo_invalid')
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (item: unknown): void => {
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw new Error(`${label}_cycle`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new Error(`${label}_not_plain`)
    }
    seen.add(item)
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') throw new Error(`${label}_symbol_key`)
      const descriptor = Object.getOwnPropertyDescriptor(item, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label}_accessor`)
      }
      visit(descriptor.value)
    }
    seen.delete(item)
  }
  visit(value)
}
