import { z } from 'zod'

import {
  assertCanonicalSam31CloudImageBuildAuthority,
  type CanonicalSam31CloudImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION =
  'canonical-sam3_1-cloud-image-build-submission-v1' as const
export const CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_TERMINAL_OBSERVATION_VERSION =
  'canonical-sam3_1-cloud-image-build-terminal-observation-v1' as const

const PROJECT_ID = 'reeditpro' as const
const BUILD_COLLECTION =
  'projects/reeditpro/locations/us-central1/builds' as const
const BUILD_CREATE_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const
const ARTIFACT_REGISTRY_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const authorityRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION,
  ),
  source: z.literal('canonical_sam3_1_cloud_image_build_submission_owner'),
  disposition: z.enum([
    'rejected_before_creation',
    'submitted',
    'outcome_unknown',
  ]),
  authorityRef: authorityRefSchema,
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  buildRequestHash: rawSha256.nullable(),
  buildRequestBodyRef: z.object({
    id: safeId,
    version: z.literal(1),
    contentHash: prefixedSha256,
  }).strict().nullable(),
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
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditMutationCreated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const submitted = value.disposition === 'submitted'
  const rejected = value.disposition === 'rejected_before_creation'
  const outcomeUnknown = value.disposition === 'outcome_unknown'
  const knownExecutedOutcome = outcomeUnknown
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
        : !outcomeUnknown
          || !value.durableAuthorityConsumptionCreated
          || value.durableSubmissionObservationCreated
          || (knownExecutedOutcome
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
    message: 'SAM 3.1 Cloud Build submission lost its execution boundary.',
  })
})

export const canonicalSam31CloudImageBuildSubmissionSchema =
  submissionWithoutHashSchema.extend({ submissionHash: rawSha256 }).strict()
export type CanonicalSam31CloudImageBuildSubmission = z.infer<
  typeof canonicalSam31CloudImageBuildSubmissionSchema
>

const terminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_TERMINAL_OBSERVATION_VERSION,
  ),
  source: z.literal('canonical_sam3_1_cloud_image_build_terminal_owner'),
  disposition: z.enum([
    'pending',
    'image_built_pending_scan_signature_and_gpu_qualification',
    'terminal_failure',
    'outcome_unknown',
  ]),
  authorityRef: authorityRefSchema,
  submissionRef: z.object({
    id: safeId,
    version: z.literal(1),
    contentHash: prefixedSha256,
  }).strict(),
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
  exactStorageGenerationProvenanceVerified: z.boolean(),
  verifiedProvenanceAndAttestationRequested: z.literal(true),
  warningsAbsent: z.boolean(),
  taggedImageUri: z.string(),
  immutableImageDigest: prefixedSha256.nullable(),
  immutableImageUri: z.string().nullable(),
  artifactRegistryPackage: z.string().nullable(),
  durableTerminalObservationCreated: z.boolean(),
  imageBuiltAndPushed: z.boolean(),
  imageScanPassed: z.literal(false),
  imageSignatureVerified: z.literal(false),
  sbomReread: z.literal(false),
  a100RuntimeQualified: z.literal(false),
  l4RuntimeQualified: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditMutationCreated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const success = value.disposition ===
    'image_built_pending_scan_signature_and_gpu_qualification'
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
    message: 'SAM 3.1 Cloud Build observation lost terminal image truth.',
  })
})

export const canonicalSam31CloudImageBuildTerminalObservationSchema =
  terminalWithoutHashSchema.extend({ observationHash: rawSha256 }).strict()
export type CanonicalSam31CloudImageBuildTerminalObservation = z.infer<
  typeof canonicalSam31CloudImageBuildTerminalObservationSchema
>

export interface CanonicalSam31CloudImageBuildAuthorityReadPort {
  rereadBuildAuthority(input: {
    readonly authorityRef: z.infer<typeof authorityRefSchema>
  }): Promise<CanonicalSam31CloudImageBuildAuthority | null>
}

export interface CanonicalSam31CloudImageBuildStatePort {
  consumeAuthorityCreateOnly(input: {
    readonly authorityRef: z.infer<typeof authorityRefSchema>
    readonly buildRequestHash: string
    readonly consumedAt: string
  }): Promise<boolean>
  persistSubmissionCreateOnly(input: {
    readonly submission: CanonicalSam31CloudImageBuildSubmission
  }): Promise<boolean>
  persistTerminalObservationCreateOnly(input: {
    readonly observation: CanonicalSam31CloudImageBuildTerminalObservation
  }): Promise<boolean>
}

export interface CanonicalSam31CloudBuildAuthenticatedTransport {
  request(input: {
    readonly method: 'GET' | 'POST'
    readonly url: string
    readonly body?: Readonly<Record<string, unknown>>
  }): Promise<{
    readonly status: number
    readonly json: unknown
  }>
}

export function createCanonicalSam31CloudImageBuildService(input: {
  readonly authorityReadPort: CanonicalSam31CloudImageBuildAuthorityReadPort
  readonly statePort: CanonicalSam31CloudImageBuildStatePort
  readonly authenticatedTransport: CanonicalSam31CloudBuildAuthenticatedTransport
  readonly now?: () => string
}) {
  return Object.freeze({
    startOneImageBuild: async (request: {
      readonly authorityRef: z.infer<typeof authorityRefSchema>
    }): Promise<CanonicalSam31CloudImageBuildSubmission> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      let authority: CanonicalSam31CloudImageBuildAuthority
      try {
        const parsedRef = authorityRefSchema.parse(request.authorityRef)
        authority = assertCanonicalSam31CloudImageBuildAuthority(
          await input.authorityReadPort.rereadBuildAuthority({
            authorityRef: parsedRef,
          }),
        )
        assertAuthorityRef(parsedRef, authority)
        if (
          authority.evidenceClass !== 'canonical_private_reread'
          || authority.status !== 'authorized_for_private_cloud_build'
          || !authority.authority.cloudImageBuildAuthorized
        ) throw new Error('SAM 3.1 image build authority is not canonical.')
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

      const buildBody = compileCloudBuildBody(authority)
      const buildRequestHash = sha256AuthorityValue(buildBody)
      const buildRequestBodyRef = {
        id: `sam31-cloud-build-request-${buildRequestHash.slice(0, 24)}`,
        version: 1 as const,
        contentHash: `sha256:${buildRequestHash}` as const,
      }
      const authorityRef = authorityReference(authority)
      const consumed = await input.statePort.consumeAuthorityCreateOnly({
        authorityRef,
        buildRequestHash,
        consumedAt: observedAt,
      })
      if (!consumed) {
        return buildSubmission({
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
      }

      let providerStatus: number | null = null
      let accepted: ReturnType<typeof parseCloudBuildCreateOperation> | null =
        null
      try {
        const response = await input.authenticatedTransport.request({
          method: 'POST',
          url: BUILD_CREATE_ENDPOINT,
          body: buildBody,
        })
        providerStatus = response.status
        if (response.status < 200 || response.status >= 300) {
          throw new Error('Cloud Build create did not return success.')
        }
        accepted = parseCloudBuildCreateOperation(response.json)
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
        const persisted = await input.statePort.persistSubmissionCreateOnly({
          submission,
        })
        if (!persisted) throw new Error('Cloud Build submission was not durable.')
        return submission
      } catch {
        const providerExecutionKnown = accepted !== null
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
          providerOutcome: providerExecutionKnown ? 'executed' : 'unknown',
          durableAuthorityConsumptionCreated: true,
          durableSubmissionObservationCreated: false,
          imageBuildKnownStarted: providerExecutionKnown,
          observedAt,
        })
        await input.statePort.persistSubmissionCreateOnly({
          submission: unknown,
        }).catch(() => false)
        return unknown
      }
    },

    observeOneImageBuild: async (request: {
      readonly authority: CanonicalSam31CloudImageBuildAuthority
      readonly submission: CanonicalSam31CloudImageBuildSubmission
    }): Promise<CanonicalSam31CloudImageBuildTerminalObservation> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const authority = assertCanonicalSam31CloudImageBuildAuthority(
        request.authority,
      )
      const submission = assertCanonicalSam31CloudImageBuildSubmission(
        request.submission,
      )
      if (
        submission.disposition !== 'submitted'
        || !submission.cloudBuildId
        || !sameRef(submission.authorityRef, authorityReference(authority))
      ) throw new Error('SAM 3.1 Cloud Build observation is not admitted.')
      const submissionRef = {
        id: `sam31-cloud-build-submission-${submission.submissionHash.slice(0, 24)}`,
        version: 1 as const,
        contentHash: `sha256:${submission.submissionHash}` as const,
      }
      const base = {
        authorityRef: submission.authorityRef,
        submissionRef,
        cloudBuildId: submission.cloudBuildId,
        cloudBuildResource: `${BUILD_COLLECTION}/${submission.cloudBuildId}`,
        taggedImageUri: authority.imageDestination.taggedUri,
        observedAt,
      }
      let status: number | null = null
      try {
        const response = await input.authenticatedTransport.request({
          method: 'GET',
          url: `${BUILD_CREATE_ENDPOINT}/${submission.cloudBuildId}`,
        })
        status = response.status
        if (status < 200 || status >= 300) {
          throw new Error('Cloud Build reread did not return success.')
        }
        const build = parseCloudBuildResource(response.json)
        if (
          build.id !== submission.cloudBuildId
          || build.name !== `${BUILD_COLLECTION}/${submission.cloudBuildId}`
        ) throw new Error('Cloud Build reread crossed build identity.')
        if (['PENDING', 'QUEUED', 'WORKING'].includes(build.status)) {
          return buildTerminalObservation({
            ...base,
            disposition: 'pending',
            providerHttpStatus: status,
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
          const failure = buildTerminalObservation({
            ...base,
            disposition: 'terminal_failure',
            providerHttpStatus: status,
            cloudBuildStatus: build.status,
            exactBuildConfigurationEchoVerified: false,
            exactStorageGenerationProvenanceVerified: false,
            warningsAbsent: build.warnings.length === 0,
            immutableImageDigest: null,
            immutableImageUri: null,
            artifactRegistryPackage: null,
            durableTerminalObservationCreated: true,
            imageBuiltAndPushed: false,
          })
          const persisted = await input.statePort
            .persistTerminalObservationCreateOnly({ observation: failure })
          if (!persisted) throw new Error('Terminal failure was not durable.')
          return failure
        }
        const buildBody = compileCloudBuildBody(authority)
        assertCloudBuildEcho(build, buildBody, authority)
        const image = build.results.images[0]
        const immutableImageUri = `${authority.imageDestination.repository}/${authority.imageDestination.imageName}@${image.digest}`
        const success = buildTerminalObservation({
          ...base,
          disposition: 'image_built_pending_scan_signature_and_gpu_qualification',
          providerHttpStatus: status,
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
          .persistTerminalObservationCreateOnly({ observation: success })
        if (!persisted) throw new Error('Terminal success was not durable.')
        return success
      } catch {
        return buildTerminalObservation({
          ...base,
          disposition: 'outcome_unknown',
          providerHttpStatus: status,
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

export function assertCanonicalSam31CloudImageBuildSubmission(
  value: unknown,
): CanonicalSam31CloudImageBuildSubmission {
  assertClosedPlainData(value, 'sam3_1_cloud_image_build_submission')
  const parsed = canonicalSam31CloudImageBuildSubmissionSchema.parse(value)
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 Cloud Build submission hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31CloudImageBuildTerminalObservation(
  value: unknown,
): CanonicalSam31CloudImageBuildTerminalObservation {
  assertClosedPlainData(value, 'sam3_1_cloud_image_build_terminal')
  const parsed = canonicalSam31CloudImageBuildTerminalObservationSchema.parse(
    value,
  )
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 Cloud Build terminal hash is invalid.')
  }
  return parsed
}

export function compileCanonicalSam31CloudBuildRequestBody(
  authority: CanonicalSam31CloudImageBuildAuthority,
): Readonly<Record<string, unknown>> {
  return compileCloudBuildBody(
    assertCanonicalSam31CloudImageBuildAuthority(authority),
  )
}

function compileCloudBuildBody(
  authority: CanonicalSam31CloudImageBuildAuthority,
): Readonly<Record<string, unknown>> {
  const policy = authority.cloudBuildPolicy
  const coordinate = authority.capsuleCoordinate
  const buildArgs = [
    `SAM31_DEPENDENCY_LOCK_SHA256=${authority.buildClosure.dependencyLockSha256}`,
    `SAM31_DEPENDENCY_CLOSURE_RECEIPT_SHA256=${authority.buildClosure.dependencyClosureReceiptSha256}`,
    `SAM31_PATCH_APPLICATION_RECEIPT_SHA256=${authority.buildClosure.patchApplicationReceiptSha256}`,
    `SAM31_PRIVATE_ARTIFACT_BUILD_BINDING_FILE_SHA256=${authority.buildClosure.artifactBuildBindingFileSha256}`,
    `SAM31_SOURCE_CHECKPOINT_QUALIFICATION_HASH=${authority.buildClosure.sourceCheckpointQualificationRecordHash}`,
    `SAM31_SOURCE_CHECKPOINT_COMPATIBILITY_RECEIPT_SHA256=${authority.buildClosure.sourceCheckpointCompatibilityReceiptSha256}`,
    `SAM31_CUDA_FORWARD_COMPAT_INGEST_RECEIPT_SHA256=${authority.buildClosure.cudaForwardCompatIngestReceiptSha256}`,
  ]
  const args = [
    'build',
    '--pull=false',
    '--no-cache',
    '--network=none',
    '--platform=linux/amd64',
    '--file',
    authority.buildClosure.dockerfilePath,
    '--tag',
    authority.imageDestination.taggedUri,
    ...buildArgs.flatMap((entry) => ['--build-arg', entry]),
    '.',
  ]
  return deepFreeze({
    source: {
      storageSource: {
        bucket: coordinate.bucketName,
        object: coordinate.objectName,
        generation: coordinate.generation,
        sourceFetcher: policy.sourceFetcher,
      },
    },
    steps: [{
      id: 'sam31-offline-image-build',
      name: policy.builderImage,
      args,
    }],
    images: [authority.imageDestination.taggedUri],
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
    tags: ['weeditpro', 'sam3-1', 'private-offline-image-build'],
  })
}

function parseCloudBuildCreateOperation(value: unknown): {
  operationName: string
  buildId: string
} {
  assertClosedPlainData(value, 'cloud_build_create_operation')
  const root = record(value)
  const operationName = safeId.parse(root.name)
  const metadata = record(root.metadata)
  const build = record(metadata.build)
  const buildId = z.string().uuid().parse(build.id)
  if (
    build.name !== `${BUILD_COLLECTION}/${buildId}`
    || build.projectId !== PROJECT_ID
  ) throw new Error('Cloud Build create operation crossed project or build.')
  return { operationName, buildId }
}

type ParsedBuild = ReturnType<typeof parseCloudBuildResource>

function parseCloudBuildResource(value: unknown) {
  assertClosedPlainData(value, 'cloud_build_resource')
  const root = record(value)
  const status = z.enum([
    'PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'FAILURE', 'INTERNAL_ERROR',
    'TIMEOUT', 'CANCELLED', 'EXPIRED', 'STATUS_UNKNOWN',
  ]).parse(root.status)
  const results = root.results === undefined ? {} : record(root.results)
  const sourceProvenance = root.sourceProvenance === undefined
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
    sourceProvenance,
  }
}

function assertCloudBuildEcho(
  build: ParsedBuild,
  expectedBody: Readonly<Record<string, unknown>>,
  authority: CanonicalSam31CloudImageBuildAuthority,
): void {
  const raw = build.raw
  const expected = expectedBody
  const actualSource = record(raw.source)
  const actualStorage = record(actualSource.storageSource)
  const expectedStorage = record(record(expected.source).storageSource)
  const resolvedStorage = record(build.sourceProvenance.resolvedStorageSource)
  const actualSteps = z.array(z.unknown()).parse(raw.steps)
  const expectedSteps = z.array(z.unknown()).parse(expected.steps)
  const actualImages = z.array(z.string()).parse(raw.images)
  const expectedImages = z.array(z.string()).parse(expected.images)
  const actualOptions = record(raw.options)
  const expectedOptions = record(expected.options)
  const image = build.results.images[0]
  if (
    build.status !== 'SUCCESS'
    || build.warnings.length !== 0
    || build.results.images.length !== 1
    || image.name !== authority.imageDestination.taggedUri
    || image.artifactRegistryPackage !== ARTIFACT_REGISTRY_PACKAGE
    || raw.serviceAccount !== expected.serviceAccount
    || !sameJson(actualStorage, expectedStorage)
    || !sameJson(resolvedStorage, expectedStorage)
    || !sameJson(actualSteps, expectedSteps)
    || !sameJson(actualImages, expectedImages)
    || actualOptions.machineType !== expectedOptions.machineType
    || actualOptions.diskSizeGb !== expectedOptions.diskSizeGb
    || actualOptions.requestedVerifyOption !==
      expectedOptions.requestedVerifyOption
    || actualOptions.logging !== expectedOptions.logging
    || !sameJson(
      actualOptions.sourceProvenanceHash,
      expectedOptions.sourceProvenanceHash,
    )
    || hasNonEmptyValue(raw.substitutions)
    || hasNonEmptyValue(raw.secrets)
    || hasNonEmptyValue(raw.availableSecrets)
    || hasNonEmptyValue(raw.buildTriggerId)
  ) throw new Error('Cloud Build terminal resource differs from authority.')
}

function buildSubmission(input: Omit<
  z.input<typeof submissionWithoutHashSchema>,
  | 'schemaVersion'
  | 'source'
  | 'operationId'
  | 'automaticRetryAllowed'
  | 'imagePushKnownCompleted'
  | 'immutableImageDigestKnown'
  | 'runtimeReleaseGranted'
  | 'gpuJobDispatched'
  | 'customerCreditMutationCreated'
  | 'productionReady'
>): CanonicalSam31CloudImageBuildSubmission {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_submission_owner',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    automaticRetryAllowed: false,
    imagePushKnownCompleted: false,
    immutableImageDigestKnown: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditMutationCreated: false,
    productionReady: false,
    ...input,
  })
  return canonicalSam31CloudImageBuildSubmissionSchema.parse({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function buildTerminalObservation(input: Omit<
  z.input<typeof terminalWithoutHashSchema>,
  | 'schemaVersion'
  | 'source'
  | 'verifiedProvenanceAndAttestationRequested'
  | 'imageScanPassed'
  | 'imageSignatureVerified'
  | 'sbomReread'
  | 'a100RuntimeQualified'
  | 'l4RuntimeQualified'
  | 'runtimeReleaseGranted'
  | 'gpuJobDispatched'
  | 'customerCreditMutationCreated'
  | 'productionReady'
>): CanonicalSam31CloudImageBuildTerminalObservation {
  const payload = terminalWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_TERMINAL_OBSERVATION_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_terminal_owner',
    verifiedProvenanceAndAttestationRequested: true,
    imageScanPassed: false,
    imageSignatureVerified: false,
    sbomReread: false,
    a100RuntimeQualified: false,
    l4RuntimeQualified: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditMutationCreated: false,
    productionReady: false,
    ...input,
  })
  return canonicalSam31CloudImageBuildTerminalObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function authorityReference(authority: CanonicalSam31CloudImageBuildAuthority) {
  return {
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}` as const,
  }
}

function safeAuthorityRef(value: unknown): z.infer<typeof authorityRefSchema> {
  const parsed = authorityRefSchema.safeParse(value)
  if (parsed.success) return parsed.data
  return {
    id: 'invalid-sam31-cloud-image-build-authority',
    version: 1,
    contentHash: `sha256:${'0'.repeat(64)}`,
  }
}

function assertAuthorityRef(
  ref: z.infer<typeof authorityRefSchema>,
  authority: CanonicalSam31CloudImageBuildAuthority,
): void {
  if (!sameRef(ref, authorityReference(authority))) {
    throw new Error('SAM 3.1 image build authority reread crossed identity.')
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
    throw new Error('Cloud Build response record is invalid.')
  }
  return value as Record<string, unknown>
}

function hasNonEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Reflect.ownKeys(value).length > 0
  return true
}

function sameJson(left: unknown, right: unknown): boolean {
  return sha256AuthorityValue(left) === sha256AuthorityValue(right)
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
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[key])
    }
  }
  return value
}
