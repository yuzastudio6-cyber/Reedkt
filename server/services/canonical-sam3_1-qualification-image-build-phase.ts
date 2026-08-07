import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageBuildAuthority,
  type CanonicalSam31QualificationImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import { assertPlainSerializedData } from './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_SUBMISSION_VERSION =
  'canonical-sam3_1-qualification-image-build-submission-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_TERMINAL_VERSION =
  'canonical-sam3_1-qualification-image-build-terminal-observation-v1' as const

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
const ARTIFACT_REGISTRY_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const authorityRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_SUBMISSION_VERSION,
  ),
  source: z.literal('canonical_sam3_1_cloud_image_build_submission_owner'),
  buildPurpose: z.literal('source_checkpoint_qualification'),
  disposition: z.enum([
    'rejected_before_creation',
    'submitted',
    'outcome_unknown',
  ]),
  authorityRef: authorityRefSchema,
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  buildRequestHash: sha256.nullable(),
  buildRequestBodyRef: authorityRefSchema.nullable(),
  providerHttpStatus: z.number().int().min(100).max(599).nullable(),
  cloudBuildOperationName: safeId.nullable(),
  cloudBuildId: z.string().uuid().nullable(),
  cloudBuildResource: z.string().nullable(),
  providerOutcome: z.enum(['not_executed', 'executed', 'unknown']),
  durableAuthorityConsumptionCreated: z.boolean(),
  durableSubmissionObservationCreated: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  imageBuildKnownStarted: z.boolean(),
  imagePushKnownCompleted: z.literal(false),
  immutableImageDigestKnown: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditMutationCreated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const submitted = value.disposition === 'submitted'
  const rejected = value.disposition === 'rejected_before_creation'
  const executedUnknown = value.disposition === 'outcome_unknown'
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
        || !value.durableAuthorityConsumptionCreated
        || !value.durableSubmissionObservationCreated
        || !value.imageBuildKnownStarted
      : rejected
        ? value.providerOutcome !== 'not_executed'
          || value.imageBuildKnownStarted
        : value.disposition !== 'outcome_unknown'
          || !value.durableAuthorityConsumptionCreated
          || value.durableSubmissionObservationCreated
          || (executedUnknown
            ? !value.cloudBuildOperationName
              || !value.cloudBuildId
              || value.cloudBuildResource !==
                `${BUILD_COLLECTION}/${value.cloudBuildId}`
              || !value.imageBuildKnownStarted
            : value.providerOutcome !== 'unknown'
              || value.cloudBuildOperationName !== null
              || value.cloudBuildId !== null
              || value.cloudBuildResource !== null
              || value.imageBuildKnownStarted)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification image submission is not admissible.',
  })
})

export const canonicalSam31QualificationImageBuildSubmissionSchema =
  submissionWithoutHashSchema.extend({ submissionHash: sha256 }).strict()
export type CanonicalSam31QualificationImageBuildSubmission = z.infer<
  typeof canonicalSam31QualificationImageBuildSubmissionSchema
>

const terminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_TERMINAL_VERSION,
  ),
  source: z.literal('canonical_sam3_1_cloud_image_build_terminal_owner'),
  buildPurpose: z.literal('source_checkpoint_qualification'),
  disposition: z.enum([
    'pending',
    'qualification_image_built_pending_supply_chain_release',
    'terminal_failure',
    'outcome_unknown',
  ]),
  authorityRef: authorityRefSchema,
  submissionRef: authorityRefSchema,
  cloudBuildId: z.string().uuid(),
  cloudBuildResource: z.string(),
  providerHttpStatus: z.number().int().min(100).max(599).nullable(),
  cloudBuildStatus: z.enum([
    'PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'FAILURE', 'INTERNAL_ERROR',
    'TIMEOUT', 'CANCELLED', 'EXPIRED', 'STATUS_UNKNOWN',
  ]).nullable(),
  exactBuildConfigurationEchoVerified: z.boolean(),
  exactStorageGenerationProvenanceVerified: z.boolean(),
  verifiedProvenanceAndAttestationRequested: z.literal(true),
  warningsAbsent: z.boolean(),
  taggedImageUri: z.string(),
  immutableImageDigest: prefixedSha256.nullable(),
  immutableImageUri: z.string().nullable(),
  artifactRegistryPackage: z.string().nullable(),
  durableTerminalObservationCreated: z.boolean(),
  imageBuiltAndPushed: z.boolean(),
  sbomReread: z.literal(false),
  imageScanPassed: z.literal(false),
  imageSignatureVerified: z.literal(false),
  provenanceVerified: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditMutationCreated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const success = value.disposition ===
    'qualification_image_built_pending_supply_chain_release'
  const pending = value.disposition === 'pending'
  if (
    value.cloudBuildResource !== `${BUILD_COLLECTION}/${value.cloudBuildId}`
    || (success
      ? value.cloudBuildStatus !== 'SUCCESS'
        || !value.exactBuildConfigurationEchoVerified
        || !value.exactStorageGenerationProvenanceVerified
        || !value.warningsAbsent
        || !value.immutableImageDigest
        || !value.immutableImageUri
        || value.artifactRegistryPackage !== ARTIFACT_REGISTRY_PACKAGE
        || !value.durableTerminalObservationCreated
        || !value.imageBuiltAndPushed
      : value.immutableImageDigest !== null
        || value.immutableImageUri !== null
        || value.imageBuiltAndPushed)
    || (pending && !['PENDING', 'QUEUED', 'WORKING'].includes(
      value.cloudBuildStatus ?? '',
    ))
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification image terminal truth changed.',
  })
})

export const canonicalSam31QualificationImageBuildTerminalSchema =
  terminalWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31QualificationImageBuildTerminal = z.infer<
  typeof canonicalSam31QualificationImageBuildTerminalSchema
>

export interface CanonicalSam31QualificationImageBuildAuthorityReadPort {
  rereadQualificationImageBuildAuthority(input: {
    readonly authorityRef: z.infer<typeof authorityRefSchema>
  }): Promise<CanonicalSam31QualificationImageBuildAuthority | null>
}

export interface CanonicalSam31QualificationImageBuildStatePort {
  consumeQualificationAuthorityCreateOnly(input: {
    readonly authorityRef: z.infer<typeof authorityRefSchema>
    readonly buildRequestHash: string
    readonly consumedAt: string
  }): Promise<boolean>
  persistQualificationSubmissionCreateOnly(input: {
    readonly submission: CanonicalSam31QualificationImageBuildSubmission
  }): Promise<boolean>
  persistQualificationTerminalCreateOnly(input: {
    readonly observation: CanonicalSam31QualificationImageBuildTerminal
  }): Promise<boolean>
}

export interface CanonicalSam31QualificationCloudBuildTransport {
  request(input: {
    readonly method: 'GET' | 'POST'
    readonly url: string
    readonly body?: Readonly<Record<string, unknown>>
  }): Promise<{ readonly status: number; readonly json: unknown }>
}

export interface CanonicalSam31QualificationCloudBuildCreateResponseSummary {
  readonly providerHttpStatus: number
  readonly responseSha256: string
  readonly providerErrorCode: number | null
  readonly providerErrorStatus: string | null
  readonly providerErrorReason:
    | 'required_project_id_query_missing'
    | 'invalid_build_configuration'
    | 'permission_denied'
    | 'quota_or_capacity'
    | 'unclassified'
    | null
  readonly safeProviderMessage: string | null
}

/**
 * Qualification-image phase of the canonical SAM 3.1 Cloud Build owner. It is
 * deliberately separate from the runtime-image phase while retaining the same
 * one-writer authority/source identities and durable single-use semantics.
 */
export function createCanonicalSam31QualificationImageBuildPhase(input: {
  readonly authorityReadPort:
    CanonicalSam31QualificationImageBuildAuthorityReadPort
  readonly statePort: CanonicalSam31QualificationImageBuildStatePort
  readonly authenticatedTransport:
    CanonicalSam31QualificationCloudBuildTransport
  readonly observeCreateResponse?: (
    summary: CanonicalSam31QualificationCloudBuildCreateResponseSummary,
  ) => void
  readonly now?: () => string
}) {
  return Object.freeze({
    startOneQualificationImageBuild: async (request: {
      readonly authorityRef: z.infer<typeof authorityRefSchema>
    }): Promise<CanonicalSam31QualificationImageBuildSubmission> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      let authority: CanonicalSam31QualificationImageBuildAuthority
      try {
        const ref = authorityRefSchema.parse(request.authorityRef)
        authority = assertCanonicalSam31QualificationImageBuildAuthority(
          await input.authorityReadPort
            .rereadQualificationImageBuildAuthority({ authorityRef: ref }),
        )
        if (
          !sameRef(ref, authorityReference(authority))
          || authority.evidenceClass !== 'canonical_private_reread'
          || authority.status !== 'authorized_for_private_cloud_build'
          || !authority.authority.qualificationImageBuildAuthorized
        ) throw new Error('Qualification image authority is not canonical.')
      } catch {
        return buildSubmission({
          disposition: 'rejected_before_creation',
          authorityRef: safeAuthorityRef(request.authorityRef),
          buildRequestHash: null,
          buildRequestBodyRef: null,
          providerHttpStatus: null,
          cloudBuildOperationName: null,
          cloudBuildId: null,
          cloudBuildResource: null,
          providerOutcome: 'not_executed',
          durableAuthorityConsumptionCreated: false,
          durableSubmissionObservationCreated: false,
          imageBuildKnownStarted: false,
          observedAt,
        })
      }
      const body = compileCanonicalSam31QualificationImageBuildRequestBody(
        authority,
      )
      const buildRequestHash = sha256AuthorityValue(body)
      const buildRequestBodyRef = {
        id: `sam31-qualification-image-build-request-${buildRequestHash.slice(0, 20)}`,
        version: 1 as const,
        contentHash: `sha256:${buildRequestHash}` as const,
      }
      const authorityRef = authorityReference(authority)
      const consumed = await input.statePort
        .consumeQualificationAuthorityCreateOnly({
          authorityRef,
          buildRequestHash,
          consumedAt: observedAt,
        })
      if (!consumed) return buildSubmission({
        disposition: 'rejected_before_creation',
        authorityRef,
        buildRequestHash,
        buildRequestBodyRef,
        providerHttpStatus: null,
        cloudBuildOperationName: null,
        cloudBuildId: null,
        cloudBuildResource: null,
        providerOutcome: 'not_executed',
        durableAuthorityConsumptionCreated: false,
        durableSubmissionObservationCreated: false,
        imageBuildKnownStarted: false,
        observedAt,
      })
      let providerStatus: number | null = null
      let accepted: { operationName: string; buildId: string } | null = null
      try {
        const response = await input.authenticatedTransport.request({
          method: 'POST',
          url: BUILD_CREATE_ENDPOINT,
          body,
        })
        providerStatus = response.status
        input.observeCreateResponse?.(
          summarizeCanonicalSam31QualificationCloudBuildCreateResponse(
            response.status,
            response.json,
          ),
        )
        if (response.status < 200 || response.status >= 300) {
          if (response.status >= 400 && response.status < 500) {
            const rejected = buildSubmission({
              disposition: 'rejected_before_creation',
              authorityRef,
              buildRequestHash,
              buildRequestBodyRef,
              providerHttpStatus: response.status,
              cloudBuildOperationName: null,
              cloudBuildId: null,
              cloudBuildResource: null,
              providerOutcome: 'not_executed',
              durableAuthorityConsumptionCreated: true,
              durableSubmissionObservationCreated: true,
              imageBuildKnownStarted: false,
              observedAt,
            })
            const persisted = await input.statePort
              .persistQualificationSubmissionCreateOnly({
                submission: rejected,
              })
            if (!persisted) {
              throw new Error('Qualification rejection not durable.')
            }
            return rejected
          }
          throw new Error('Qualification Cloud Build create failed.')
        }
        accepted = parseCreateOperation(response.json)
        const submission = buildSubmission({
          disposition: 'submitted',
          authorityRef,
          buildRequestHash,
          buildRequestBodyRef,
          providerHttpStatus: response.status,
          cloudBuildOperationName: accepted.operationName,
          cloudBuildId: accepted.buildId,
          cloudBuildResource: `${BUILD_COLLECTION}/${accepted.buildId}`,
          providerOutcome: 'executed',
          durableAuthorityConsumptionCreated: true,
          durableSubmissionObservationCreated: true,
          imageBuildKnownStarted: true,
          observedAt,
        })
        const persisted = await input.statePort
          .persistQualificationSubmissionCreateOnly({ submission })
        if (!persisted) throw new Error('Qualification submission not durable.')
        return submission
      } catch {
        const executionKnown = accepted !== null
        const unknown = buildSubmission({
          disposition: 'outcome_unknown',
          authorityRef,
          buildRequestHash,
          buildRequestBodyRef,
          providerHttpStatus: providerStatus,
          cloudBuildOperationName: accepted?.operationName ?? null,
          cloudBuildId: accepted?.buildId ?? null,
          cloudBuildResource: accepted
            ? `${BUILD_COLLECTION}/${accepted.buildId}`
            : null,
          providerOutcome: executionKnown ? 'executed' : 'unknown',
          durableAuthorityConsumptionCreated: true,
          durableSubmissionObservationCreated: false,
          imageBuildKnownStarted: executionKnown,
          observedAt,
        })
        await input.statePort.persistQualificationSubmissionCreateOnly({
          submission: unknown,
        }).catch(() => false)
        return unknown
      }
    },

    observeOneQualificationImageBuild: async (request: {
      readonly authority: CanonicalSam31QualificationImageBuildAuthority
      readonly submission: CanonicalSam31QualificationImageBuildSubmission
    }): Promise<CanonicalSam31QualificationImageBuildTerminal> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const authority = assertCanonicalSam31QualificationImageBuildAuthority(
        request.authority,
      )
      const submission = assertCanonicalSam31QualificationImageBuildSubmission(
        request.submission,
      )
      if (
        submission.disposition !== 'submitted'
        || !submission.cloudBuildId
        || !sameRef(submission.authorityRef, authorityReference(authority))
      ) throw new Error('Qualification image observation is not admitted.')
      const base = {
        authorityRef: submission.authorityRef,
        submissionRef: {
          id: `sam31-qualification-image-submission-${submission.submissionHash.slice(0, 20)}`,
          version: 1 as const,
          contentHash: `sha256:${submission.submissionHash}` as const,
        },
        cloudBuildId: submission.cloudBuildId,
        cloudBuildResource:
          `${BUILD_COLLECTION}/${submission.cloudBuildId}`,
        taggedImageUri: authority.imageDestination.taggedUri,
        observedAt,
      }
      let providerStatus: number | null = null
      try {
        const response = await input.authenticatedTransport.request({
          method: 'GET',
          url: `${BUILD_COLLECTION_ENDPOINT}/${submission.cloudBuildId}`,
        })
        providerStatus = response.status
        if (response.status < 200 || response.status >= 300) {
          throw new Error('Qualification Cloud Build reread failed.')
        }
        const build = parseBuildResource(response.json)
        if (
          build.id !== submission.cloudBuildId
          || !providerBuildNameMatches(build.name, submission.cloudBuildId)
        ) throw new Error('Qualification Cloud Build crossed identity.')
        if (['PENDING', 'QUEUED', 'WORKING'].includes(build.status)) {
          return buildTerminal({
            ...base,
            disposition: 'pending',
            providerHttpStatus: response.status,
            cloudBuildStatus: build.status as 'PENDING' | 'QUEUED' | 'WORKING',
            exactBuildConfigurationEchoVerified: false,
            exactStorageGenerationProvenanceVerified: false,
            warningsAbsent: build.warnings.length === 0,
            immutableImageDigest: null,
            immutableImageUri: null,
            artifactRegistryPackage: null,
            durableTerminalObservationCreated: false,
            imageBuiltAndPushed: false,
          })
        }
        if (build.status !== 'SUCCESS') {
          const expectedBody =
            compileCanonicalSam31QualificationImageBuildRequestBody(authority)
          assertBuildConfigurationEcho(build, expectedBody)
          const failure = buildTerminal({
            ...base,
            disposition: 'terminal_failure',
            providerHttpStatus: response.status,
            cloudBuildStatus: build.status,
            exactBuildConfigurationEchoVerified: true,
            exactStorageGenerationProvenanceVerified: true,
            warningsAbsent: build.warnings.length === 0,
            immutableImageDigest: null,
            immutableImageUri: null,
            artifactRegistryPackage: null,
            durableTerminalObservationCreated: true,
            imageBuiltAndPushed: false,
          })
          const persisted = await input.statePort
            .persistQualificationTerminalCreateOnly({ observation: failure })
          if (!persisted) throw new Error('Qualification failure not durable.')
          return failure
        }
        const expectedBody =
          compileCanonicalSam31QualificationImageBuildRequestBody(authority)
        assertBuildEcho(build, expectedBody, authority)
        const image = build.results.images[0]
        const immutableImageUri =
          `${authority.imageDestination.repository}/${authority.imageDestination.imageName}@${image.digest}`
        const success = buildTerminal({
          ...base,
          disposition: 'qualification_image_built_pending_supply_chain_release',
          providerHttpStatus: response.status,
          cloudBuildStatus: 'SUCCESS',
          exactBuildConfigurationEchoVerified: true,
          exactStorageGenerationProvenanceVerified: true,
          warningsAbsent: true,
          immutableImageDigest: image.digest,
          immutableImageUri,
          artifactRegistryPackage: image.artifactRegistryPackage,
          durableTerminalObservationCreated: true,
          imageBuiltAndPushed: true,
        })
        const persisted = await input.statePort
          .persistQualificationTerminalCreateOnly({ observation: success })
        if (!persisted) throw new Error('Qualification success not durable.')
        return success
      } catch {
        return buildTerminal({
          ...base,
          disposition: 'outcome_unknown',
          providerHttpStatus: providerStatus,
          cloudBuildStatus: null,
          exactBuildConfigurationEchoVerified: false,
          exactStorageGenerationProvenanceVerified: false,
          warningsAbsent: false,
          immutableImageDigest: null,
          immutableImageUri: null,
          artifactRegistryPackage: null,
          durableTerminalObservationCreated: false,
          imageBuiltAndPushed: false,
        })
      }
    },
  })
}

export function summarizeCanonicalSam31QualificationCloudBuildCreateResponse(
  providerHttpStatus: number,
  value: unknown,
): CanonicalSam31QualificationCloudBuildCreateResponseSummary {
  const responseSha256 = sha256AuthorityValue(value)
  const root = z.object({
    error: z.object({
      code: z.number().int().min(100).max(599).optional(),
      status: z.string().trim().min(1).max(128).optional(),
      message: z.string().trim().min(1).max(4_096).optional(),
    }).passthrough().optional(),
  }).passthrough().safeParse(value)
  const error = root.success ? root.data.error : undefined
  const message = error?.message ?? ''
  const normalized = message.toLowerCase()
  const providerErrorReason = providerHttpStatus >= 200
    && providerHttpStatus < 300
    ? null
    : normalized.includes('projectid')
        && (normalized.includes('required') || normalized.includes('missing'))
      ? 'required_project_id_query_missing'
      : providerHttpStatus === 401 || providerHttpStatus === 403
        || normalized.includes('permission')
        || normalized.includes('not authorized')
        ? 'permission_denied'
        : providerHttpStatus === 429
          || normalized.includes('quota')
          || normalized.includes('capacity')
          ? 'quota_or_capacity'
          : providerHttpStatus === 400
            || providerHttpStatus === 422
            ? 'invalid_build_configuration'
            : 'unclassified'
  return Object.freeze({
    providerHttpStatus,
    responseSha256,
    providerErrorCode: error?.code ?? null,
    providerErrorStatus: error?.status ?? null,
    providerErrorReason,
    safeProviderMessage: safeProviderMessage(message),
  })
}

export function compileCanonicalSam31QualificationImageBuildRequestBody(
  authority: CanonicalSam31QualificationImageBuildAuthority,
): Readonly<Record<string, unknown>> {
  const value = assertCanonicalSam31QualificationImageBuildAuthority(authority)
  const policy = value.cloudBuildPolicy
  const coordinate = value.capsuleCoordinate
  const buildArgs = [
    `SAM31_DEPENDENCY_LOCK_SHA256=${value.buildClosure.dependencyLockSha256}`,
    `SAM31_DEPENDENCY_CLOSURE_RECEIPT_SHA256=${value.buildClosure.dependencyClosureReceiptSha256}`,
    `SAM31_DEPENDENCY_WHEEL_MANIFEST_SHA256=${value.buildClosure.dependencyWheelManifestSha256}`,
    `SAM31_PATCH_APPLICATION_RECEIPT_SHA256=${value.buildClosure.patchApplicationReceiptSha256}`,
    `SAM31_CUDA_FORWARD_COMPAT_INGEST_RECEIPT_SHA256=${value.buildClosure.cudaForwardCompatIngestReceiptSha256}`,
  ]
  const args = [
    'build', '--pull=false', '--no-cache', '--network=none',
    '--platform=linux/amd64', '--file', value.buildClosure.dockerfilePath,
    '--tag', value.imageDestination.taggedUri,
    ...buildArgs.flatMap((entry) => ['--build-arg', entry]),
    '.',
  ]
  return deepFreeze({
    source: { storageSource: {
      bucket: coordinate.bucketName,
      object: coordinate.objectName,
      generation: coordinate.generation,
      sourceFetcher: policy.sourceFetcher,
    } },
    steps: [{
      id: 'sam31-qualification-offline-image-build',
      name: policy.builderImage,
      args,
    }],
    images: [value.imageDestination.taggedUri],
    timeout: policy.timeout,
    queueTtl: policy.queueTtl,
    options: {
      machineType: policy.machineType,
      diskSizeGb: policy.diskSizeGb,
      sourceProvenanceHash: [...policy.sourceProvenanceHashes],
      requestedVerifyOption: policy.requestedVerifyOption,
      logging: policy.logging,
    },
    serviceAccount: policy.serviceAccount,
    tags: [
      'weeditpro', 'sam3-1', 'source-checkpoint-qualification-image',
    ],
  })
}

export function assertCanonicalSam31QualificationImageBuildSubmission(
  value: unknown,
): CanonicalSam31QualificationImageBuildSubmission {
  assertPlainSerializedData(value, 'sam3_1_qualification_image_submission')
  const parsed = canonicalSam31QualificationImageBuildSubmissionSchema
    .parse(value)
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification image submission hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationImageBuildTerminal(
  value: unknown,
): CanonicalSam31QualificationImageBuildTerminal {
  assertPlainSerializedData(value, 'sam3_1_qualification_image_terminal')
  const parsed = canonicalSam31QualificationImageBuildTerminalSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification image terminal hash changed.')
  }
  return parsed
}

function parseCreateOperation(value: unknown) {
  assertPlainSerializedData(value, 'sam3_1_cloud_build_create_operation')
  const root = record(value)
  const operationName = safeId.parse(root.name)
  const build = record(record(root.metadata).build)
  const buildId = z.string().uuid().parse(build.id)
  if (
    !providerBuildNameMatches(z.string().parse(build.name), buildId)
    || build.projectId !== PROJECT_ID
  ) throw new Error('Qualification build create crossed project.')
  return { operationName, buildId }
}

type ParsedBuild = ReturnType<typeof parseBuildResource>

function parseBuildResource(value: unknown) {
  assertPlainSerializedData(value, 'sam3_1_cloud_build_resource')
  const root = record(value)
  const status = z.enum([
    'PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'FAILURE', 'INTERNAL_ERROR',
    'TIMEOUT', 'CANCELLED', 'EXPIRED', 'STATUS_UNKNOWN',
  ]).parse(root.status)
  const results = root.results === undefined ? {} : record(root.results)
  const provenance = root.sourceProvenance === undefined
    ? {}
    : record(root.sourceProvenance)
  return {
    raw: root,
    id: z.string().uuid().parse(root.id),
    name: z.string().parse(root.name),
    projectId: z.literal(PROJECT_ID).parse(root.projectId),
    status,
    warnings: Array.isArray(root.warnings) ? root.warnings : [],
    results: {
      images: Array.isArray(results.images)
        ? results.images.map((entry) => {
          const image = record(entry)
          return {
            name: z.string().parse(image.name),
            digest: prefixedSha256.parse(image.digest),
            artifactRegistryPackage: z.string().parse(
              image.artifactRegistryPackage,
            ),
          }
        })
        : [],
    },
    sourceProvenance: provenance,
  }
}

function providerBuildNameMatches(name: string, buildId: string): boolean {
  return [...PROVIDER_BUILD_COLLECTIONS].some(
    (collection) => name === `${collection}/${buildId}`,
  )
}

function assertBuildEcho(
  build: ParsedBuild,
  expected: Readonly<Record<string, unknown>>,
  authority: CanonicalSam31QualificationImageBuildAuthority,
): void {
  assertBuildConfigurationEcho(build, expected)
  const image = build.results.images[0]
  if (
    build.status !== 'SUCCESS'
    || build.warnings.length !== 0
    || build.results.images.length !== 1
    || image.name !== authority.imageDestination.taggedUri
    || image.artifactRegistryPackage !== ARTIFACT_REGISTRY_PACKAGE
  ) throw new Error('Qualification Cloud Build output differs from authority.')
}

function assertBuildConfigurationEcho(
  build: ParsedBuild,
  expected: Readonly<Record<string, unknown>>,
): void {
  const raw = build.raw
  const actualStorage = record(record(raw.source).storageSource)
  const expectedStorage = record(record(expected.source).storageSource)
  const resolvedStorage = record(
    build.sourceProvenance.resolvedStorageSource,
  )
  const actualSteps = z.array(z.unknown()).parse(raw.steps)
  const expectedSteps = z.array(z.unknown()).parse(expected.steps)
  const actualImages = z.array(z.string()).parse(raw.images)
  const expectedImages = z.array(z.string()).parse(expected.images)
  const actualOptions = record(raw.options)
  const expectedOptions = record(expected.options)
  if (
    raw.serviceAccount !== expected.serviceAccount
    || !sameJson(actualStorage, expectedStorage)
    || !sameJson(resolvedStorage, expectedStorage)
    || !sameJson(actualSteps, expectedSteps)
    || !sameJson(actualImages, expectedImages)
    || !sameJson(raw.tags, expected.tags)
    || actualOptions.machineType !== expectedOptions.machineType
    || actualOptions.diskSizeGb !== expectedOptions.diskSizeGb
    || actualOptions.requestedVerifyOption !==
      expectedOptions.requestedVerifyOption
    || actualOptions.logging !== expectedOptions.logging
    || !sameJson(
      actualOptions.sourceProvenanceHash,
      expectedOptions.sourceProvenanceHash,
    )
    || hasNonEmpty(raw.substitutions)
    || hasNonEmpty(raw.secrets)
    || hasNonEmpty(raw.availableSecrets)
    || hasNonEmpty(raw.buildTriggerId)
  ) throw new Error('Qualification Cloud Build configuration differs from authority.')
}

function buildSubmission(input: Omit<
  z.input<typeof submissionWithoutHashSchema>,
  | 'schemaVersion' | 'source' | 'buildPurpose' | 'operationId'
  | 'automaticRetryAllowed' | 'imagePushKnownCompleted'
  | 'immutableImageDigestKnown' | 'sourceCheckpointQualificationGranted'
  | 'runtimeReleaseGranted' | 'gpuJobDispatched'
  | 'customerCreditMutationCreated' | 'productionReady'
>): CanonicalSam31QualificationImageBuildSubmission {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_SUBMISSION_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_submission_owner',
    buildPurpose: 'source_checkpoint_qualification',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    automaticRetryAllowed: false,
    imagePushKnownCompleted: false,
    immutableImageDigestKnown: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditMutationCreated: false,
    productionReady: false,
    ...input,
  })
  return canonicalSam31QualificationImageBuildSubmissionSchema.parse({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function buildTerminal(input: Omit<
  z.input<typeof terminalWithoutHashSchema>,
  | 'schemaVersion' | 'source' | 'buildPurpose'
  | 'verifiedProvenanceAndAttestationRequested' | 'sbomReread'
  | 'imageScanPassed' | 'imageSignatureVerified' | 'provenanceVerified'
  | 'sourceCheckpointQualificationGranted' | 'runtimeReleaseGranted'
  | 'gpuJobDispatched' | 'customerCreditMutationCreated' | 'productionReady'
>): CanonicalSam31QualificationImageBuildTerminal {
  const payload = terminalWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_TERMINAL_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_terminal_owner',
    buildPurpose: 'source_checkpoint_qualification',
    verifiedProvenanceAndAttestationRequested: true,
    sbomReread: false,
    imageScanPassed: false,
    imageSignatureVerified: false,
    provenanceVerified: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditMutationCreated: false,
    productionReady: false,
    ...input,
  })
  return canonicalSam31QualificationImageBuildTerminalSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function authorityReference(
  authority: CanonicalSam31QualificationImageBuildAuthority,
) {
  return {
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}` as const,
  }
}

function safeAuthorityRef(value: unknown): z.infer<typeof authorityRefSchema> {
  const parsed = authorityRefSchema.safeParse(value)
  return parsed.success ? parsed.data : {
    id: 'invalid-sam31-qualification-image-authority',
    version: 1,
    contentHash: `sha256:${'0'.repeat(64)}`,
  }
}

function sameRef(
  left: z.infer<typeof authorityRefSchema>,
  right: z.infer<typeof authorityRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Qualification Cloud Build record is invalid.')
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

function safeProviderMessage(value: string): string | null {
  if (!value) return null
  if (/\b(?:authorization|bearer|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|password|credential|secret)\b/iu.test(value)) {
    return '[provider message withheld by credential-safety policy]'
  }
  return value
    .replace(/https?:\/\/\S+/giu, '[url]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, '[service-account]')
    .slice(0, 1_000)
}
