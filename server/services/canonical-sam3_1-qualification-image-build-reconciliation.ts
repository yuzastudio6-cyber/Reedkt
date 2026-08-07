import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageBuildAuthority,
  type CanonicalSam31QualificationImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import {
  assertCanonicalSam31QualificationImageBuildSubmission,
  compileCanonicalSam31QualificationImageBuildRequestBody,
  type CanonicalSam31QualificationImageBuildSubmission,
} from './canonical-sam3_1-qualification-image-build-phase'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RECONCILIATION_VERSION =
  'canonical-sam3_1-qualification-image-build-reconciliation-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RECONCILED_TERMINAL_VERSION =
  'canonical-sam3_1-qualification-image-build-reconciled-terminal-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PROJECT_NUMBER = '390722338345' as const
const BUILD_COLLECTION =
  'projects/reeditpro/locations/us-central1/builds' as const
const PROVIDER_BUILD_COLLECTIONS = new Set([
  BUILD_COLLECTION,
  `projects/${PROJECT_NUMBER}/locations/us-central1/builds`,
])
const BUILD_RESOURCE_ENDPOINT_PREFIX =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds/' as const
const ARTIFACT_REGISTRY_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification' as const
const BUILD_LIST_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds?projectId=reeditpro&pageSize=100&filter=tags%3Dweeditpro%20AND%20tags%3Dsam3-1%20AND%20tags%3Dsource-checkpoint-qualification-image' as const
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
const buildStatusSchema = z.enum([
  'STATUS_UNKNOWN', 'PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'FAILURE',
  'INTERNAL_ERROR', 'TIMEOUT', 'CANCELLED', 'EXPIRED',
])

const CLOUD_BUILD_CREATE_CONTRACT = Object.freeze({
  provider: 'google_cloud_build_v1',
  method: 'projects.locations.builds.create',
  httpMethod: 'POST',
  regionalPath: 'v1/{+parent}/builds',
  parent: 'projects/reeditpro/locations/us-central1',
  requiredProjectIdQueryParameter: 'reeditpro',
  successfulResponseType: 'Operation',
  observedDocumentationDate: '2026-08-07',
})

const reconciliationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_qualification_image_build_reconciliation_owner',
  ),
  disposition: z.enum([
    'precreation_rejection_no_build_found',
    'accepted_response_no_build_found',
    'matched_exact_build',
    'ambiguous',
  ]),
  reconciliationId: safeId,
  reconciliationVersion: z.literal(1),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  authorityRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  buildRequestHash: rawSha256,
  providerHttpStatus: z.union([z.literal(200), z.literal(400)]),
  cloudBuildCreateContractRef: evidenceRefSchema,
  originalRegionalCreateRequestMissingRequiredProjectIdQuery:
    z.boolean(),
  correctedRegionalCreateRequestIncludesRequiredProjectIdQuery:
    z.literal(true),
  cloudBuildListRequestRef: evidenceRefSchema,
  cloudBuildListResponseSha256: rawSha256,
  cloudBuildListExactlyReread: z.literal(true),
  cloudBuildListPaginationComplete: z.literal(true),
  matchingBuildCount: z.number().int().min(0).max(100),
  matchedCloudBuildId: z.string().uuid().nullable(),
  matchedCloudBuildResource: safeId.nullable(),
  matchedCloudBuildStatus: buildStatusSchema.nullable(),
  matchedCloudBuildCreateTime: timestamp.nullable(),
  exactFixedBuildRequestEchoVerified: z.boolean(),
  exactStorageGenerationProvenanceVerified: z.boolean(),
  originalSubmissionHadNoCreateOperationOrBuildId: z.literal(true),
  predecessorProviderExecutionKnownAbsent: z.boolean(),
  predecessorImageBuildKnownStarted: z.boolean(),
  predecessorImagePushKnownCompleted: z.literal(false),
  predecessorImmutableImageDigestKnown: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  distinctSuccessorAuthorityMayBeIssued: z.boolean(),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const notFound = value.disposition ===
    'precreation_rejection_no_build_found'
  const acceptedNotFound = value.disposition ===
    'accepted_response_no_build_found'
  const matched = value.disposition === 'matched_exact_build'
  if (
    value.originalRegionalCreateRequestMissingRequiredProjectIdQuery !==
      (value.providerHttpStatus === 400)
    || (notFound
      ? value.providerHttpStatus !== 400
        || value.matchingBuildCount !== 0
        || value.matchedCloudBuildId !== null
        || value.matchedCloudBuildResource !== null
        || value.matchedCloudBuildStatus !== null
        || value.matchedCloudBuildCreateTime !== null
        || value.exactFixedBuildRequestEchoVerified
        || value.exactStorageGenerationProvenanceVerified
        || !value.predecessorProviderExecutionKnownAbsent
        || value.predecessorImageBuildKnownStarted
        || !value.distinctSuccessorAuthorityMayBeIssued
      : acceptedNotFound
        ? value.providerHttpStatus !== 200
          || value.matchingBuildCount !== 0
          || value.matchedCloudBuildId !== null
          || value.matchedCloudBuildResource !== null
          || value.matchedCloudBuildStatus !== null
          || value.matchedCloudBuildCreateTime !== null
          || value.exactFixedBuildRequestEchoVerified
          || value.exactStorageGenerationProvenanceVerified
          || value.predecessorProviderExecutionKnownAbsent
          || value.predecessorImageBuildKnownStarted
          || value.distinctSuccessorAuthorityMayBeIssued
        : matched
        ? value.matchingBuildCount !== 1
          || !value.matchedCloudBuildId
          || value.matchedCloudBuildResource !==
            `${BUILD_COLLECTION}/${value.matchedCloudBuildId}`
          || !value.matchedCloudBuildStatus
          || !value.matchedCloudBuildCreateTime
          || !value.exactFixedBuildRequestEchoVerified
          || !value.exactStorageGenerationProvenanceVerified
          || value.predecessorProviderExecutionKnownAbsent
          || !value.predecessorImageBuildKnownStarted
          || value.distinctSuccessorAuthorityMayBeIssued
        : value.matchingBuildCount < 2
          || value.matchedCloudBuildId !== null
          || value.matchedCloudBuildResource !== null
          || value.matchedCloudBuildStatus !== null
          || value.matchedCloudBuildCreateTime !== null
          || value.exactFixedBuildRequestEchoVerified
          || value.exactStorageGenerationProvenanceVerified
          || value.predecessorProviderExecutionKnownAbsent
          || value.predecessorImageBuildKnownStarted
          || value.distinctSuccessorAuthorityMayBeIssued)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification build reconciliation truth changed.',
  })
})

export const canonicalSam31QualificationImageBuildReconciliationSchema =
  reconciliationWithoutHashSchema.extend({
    reconciliationHash: rawSha256,
  }).strict()
export type CanonicalSam31QualificationImageBuildReconciliation = z.infer<
  typeof canonicalSam31QualificationImageBuildReconciliationSchema
>

const reconciledTerminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RECONCILED_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_qualification_image_build_reconciled_terminal_owner',
  ),
  disposition: z.enum([
    'pending',
    'qualification_image_built_pending_supply_chain_release',
    'terminal_failure',
    'outcome_unknown',
  ]),
  terminalId: safeId,
  terminalVersion: z.literal(1),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  authorityRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  reconciliationRef: evidenceRefSchema,
  buildRequestHash: rawSha256,
  cloudBuildId: z.string().uuid(),
  cloudBuildResource: safeId,
  providerProjectIdentityNormalized: z.literal(true),
  providerHttpStatus: z.literal(200),
  cloudBuildStatus: buildStatusSchema,
  cloudBuildCreateTime: timestamp,
  cloudBuildStartTime: timestamp.nullable(),
  cloudBuildFinishTime: timestamp.nullable(),
  exactFixedBuildRequestEchoVerified: z.literal(true),
  exactStorageGenerationProvenanceVerified: z.literal(true),
  warningsAbsent: z.boolean(),
  taggedImageUri: z.string().trim().min(1).max(2_048),
  immutableImageDigest: prefixedSha256.nullable(),
  immutableImageUri: z.string().trim().min(1).max(2_048).nullable(),
  artifactRegistryPackage: safeId.nullable(),
  durableTerminalObservationCreated: z.boolean(),
  imageBuiltAndPushed: z.boolean(),
  sbomReread: z.literal(false),
  artifactAnalysisScanPassed: z.literal(false),
  imageSignatureVerified: z.literal(false),
  provenanceVerified: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const success = value.disposition ===
    'qualification_image_built_pending_supply_chain_release'
  const pending = value.disposition === 'pending'
  const failed = value.disposition === 'terminal_failure'
  if (
    value.cloudBuildResource !== `${BUILD_COLLECTION}/${value.cloudBuildId}`
    || (success
      ? value.cloudBuildStatus !== 'SUCCESS'
        || !value.cloudBuildStartTime
        || !value.cloudBuildFinishTime
        || !value.warningsAbsent
        || !value.immutableImageDigest
        || value.immutableImageUri !==
          `${value.taggedImageUri.split(':')[0]}@${value.immutableImageDigest}`
        || value.artifactRegistryPackage !== ARTIFACT_REGISTRY_PACKAGE
        || !value.durableTerminalObservationCreated
        || !value.imageBuiltAndPushed
      : value.immutableImageDigest !== null
        || value.immutableImageUri !== null
        || value.artifactRegistryPackage !== null
        || value.imageBuiltAndPushed)
    || (pending
      ? !['PENDING', 'QUEUED', 'WORKING'].includes(value.cloudBuildStatus)
        || value.durableTerminalObservationCreated
      : failed
        ? ['PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'STATUS_UNKNOWN']
          .includes(value.cloudBuildStatus)
          || !value.durableTerminalObservationCreated
        : value.disposition === 'outcome_unknown'
          && (value.cloudBuildStatus !== 'STATUS_UNKNOWN'
            || value.durableTerminalObservationCreated))
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 reconciled terminal truth changed.',
  })
})

export const canonicalSam31QualificationImageBuildReconciledTerminalSchema =
  reconciledTerminalWithoutHashSchema.extend({
    terminalHash: rawSha256,
  }).strict()
export type CanonicalSam31QualificationImageBuildReconciledTerminal = z.infer<
  typeof canonicalSam31QualificationImageBuildReconciledTerminalSchema
>

export interface CanonicalSam31QualificationImageBuildReconciliationReadPort {
  rereadQualificationImageBuildAuthority(input: {
    readonly authorityRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalSam31QualificationImageBuildAuthority | null>
  rereadSubmission(input: {
    readonly submissionRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalSam31QualificationImageBuildSubmission | null>
}

export interface CanonicalSam31QualificationImageBuildReconciledTerminalReadPort {
  rereadQualificationImageBuildAuthority(input: {
    readonly authorityRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalSam31QualificationImageBuildAuthority | null>
  rereadReconciliation(input: {
    readonly reconciliationRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalSam31QualificationImageBuildReconciliation | null>
}

export interface CanonicalSam31QualificationImageBuildListTransport {
  request(input: {
    readonly method: 'GET'
    readonly url: string
  }): Promise<{ readonly status: number; readonly json: unknown }>
}

export interface CanonicalSam31QualificationImageBuildReadTransport {
  request(input: {
    readonly method: 'GET'
    readonly url: string
  }): Promise<{ readonly status: number; readonly json: unknown }>
}

export function createCanonicalSam31QualificationImageBuildReconciler(input: {
  readonly readPort:
    CanonicalSam31QualificationImageBuildReconciliationReadPort
  readonly transport: CanonicalSam31QualificationImageBuildListTransport
  readonly now?: () => string
}) {
  return Object.freeze({
    reconcileUnknownSubmission: async (request: {
      readonly reconciliationId: string
      readonly submissionRef: z.infer<typeof evidenceRefSchema>
    }): Promise<CanonicalSam31QualificationImageBuildReconciliation> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const submission = assertCanonicalSam31QualificationImageBuildSubmission(
        await input.readPort.rereadSubmission({
          submissionRef: request.submissionRef,
        }),
      )
      if (
        submission.disposition !== 'outcome_unknown'
        || submission.providerOutcome !== 'unknown'
        || (submission.providerHttpStatus !== 200
          && submission.providerHttpStatus !== 400)
        || submission.buildRequestHash === null
        || submission.cloudBuildOperationName !== null
        || submission.cloudBuildId !== null
        || submission.cloudBuildResource !== null
        || submission.imageBuildKnownStarted
        || !submission.durableAuthorityConsumptionCreated
        || submission.durableSubmissionObservationCreated
        || !sameRef(
          request.submissionRef,
          canonicalSam31QualificationImageBuildSubmissionRef(submission),
        )
      ) throw new Error('SAM 3.1 submission is not reconcilable.')
      const authority = assertCanonicalSam31QualificationImageBuildAuthority(
        await input.readPort.rereadQualificationImageBuildAuthority({
          authorityRef: submission.authorityRef,
        }),
      )
      if (
        authority.evidenceClass !== 'canonical_private_reread'
        || authority.status !== 'authorized_for_private_cloud_build'
        || !sameRef(authorityRef(authority), submission.authorityRef)
      ) throw new Error('SAM 3.1 reconciliation authority changed.')
      const response = await input.transport.request({
        method: 'GET',
        url: BUILD_LIST_ENDPOINT,
      })
      if (response.status !== 200) {
        throw new Error('SAM 3.1 Cloud Build list reread failed.')
      }
      const list = parseBuildList(response.json)
      const matches = list.builds.filter((build) =>
        exactBuildEchoMatches(build, authority, submission.observedAt))
      const matched = matches.length === 1 ? matches[0] : null
      return buildReconciliation({
        reconciliationId: request.reconciliationId,
        disposition: matched
          ? 'matched_exact_build'
          : matches.length === 0
            ? submission.providerHttpStatus === 400
              ? 'precreation_rejection_no_build_found'
              : 'accepted_response_no_build_found'
            : 'ambiguous',
        authorityRef: submission.authorityRef,
        submissionRef: request.submissionRef,
        buildRequestHash: submission.buildRequestHash,
        providerHttpStatus: submission.providerHttpStatus,
        cloudBuildCreateContractRef: {
          id: 'google-cloud-build-v1-regional-create-contract-20260807',
          version: 1,
          contentHash: `sha256:${sha256AuthorityValue(
            CLOUD_BUILD_CREATE_CONTRACT,
          )}`,
        },
        cloudBuildListRequestRef: {
          id: 'sam31-qualification-image-build-list-request-v1',
          version: 1,
          contentHash: `sha256:${sha256AuthorityValue({
            method: 'GET', url: BUILD_LIST_ENDPOINT,
          })}`,
        },
        cloudBuildListResponseSha256: sha256AuthorityValue(response.json),
        matchingBuildCount: matches.length,
        matchedCloudBuildId: matched?.id ?? null,
        matchedCloudBuildResource: matched
          ? `${BUILD_COLLECTION}/${matched.id}` : null,
        matchedCloudBuildStatus: matched?.status ?? null,
        matchedCloudBuildCreateTime: matched?.createTime ?? null,
        exactFixedBuildRequestEchoVerified: matched !== null,
        exactStorageGenerationProvenanceVerified: matched !== null,
        predecessorProviderExecutionKnownAbsent:
          matches.length === 0 && submission.providerHttpStatus === 400,
        predecessorImageBuildKnownStarted: matched !== null,
        distinctSuccessorAuthorityMayBeIssued:
          matches.length === 0 && submission.providerHttpStatus === 400,
        observedAt,
      })
    },
  })
}

export function createCanonicalSam31QualificationImageBuildReconciledTerminalObserver(
  input: {
    readonly readPort:
      CanonicalSam31QualificationImageBuildReconciledTerminalReadPort
    readonly transport: CanonicalSam31QualificationImageBuildReadTransport
    readonly now?: () => string
  },
) {
  return Object.freeze({
    observeTerminal: async (request: {
      readonly terminalId: string
      readonly reconciliationRef: z.infer<typeof evidenceRefSchema>
    }): Promise<CanonicalSam31QualificationImageBuildReconciledTerminal> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const reconciliation =
        assertCanonicalSam31QualificationImageBuildReconciliation(
          await input.readPort.rereadReconciliation({
            reconciliationRef: request.reconciliationRef,
          }),
        )
      if (
        reconciliation.disposition !== 'matched_exact_build'
        || !reconciliation.matchedCloudBuildId
        || !sameRef(
          request.reconciliationRef,
          canonicalSam31QualificationImageBuildReconciliationRef(
            reconciliation,
          ),
        )
      ) throw new Error('SAM 3.1 exact build reconciliation changed.')
      const authority = assertCanonicalSam31QualificationImageBuildAuthority(
        await input.readPort.rereadQualificationImageBuildAuthority({
          authorityRef: reconciliation.authorityRef,
        }),
      )
      if (
        authority.evidenceClass !== 'canonical_private_reread'
        || authority.status !== 'authorized_for_private_cloud_build'
        || !sameRef(authorityRef(authority), reconciliation.authorityRef)
      ) throw new Error('SAM 3.1 terminal authority changed.')
      const response = await input.transport.request({
        method: 'GET',
        url: `${BUILD_RESOURCE_ENDPOINT_PREFIX}${reconciliation.matchedCloudBuildId}`,
      })
      if (response.status !== 200) {
        throw new Error('SAM 3.1 exact Cloud Build reread failed.')
      }
      const build = parseBuild(response.json)
      if (
        build.id !== reconciliation.matchedCloudBuildId
        || build.projectId !== PROJECT_ID
        || !providerBuildNameMatches(build.name, build.id)
        || !exactBuildEchoMatches(
          build,
          authority,
          reconciliation.matchedCloudBuildCreateTime
            ?? '1970-01-01T00:00:00.000Z',
        )
      ) throw new Error('SAM 3.1 reconciled build identity changed.')
      const success = build.status === 'SUCCESS'
      const pending = ['PENDING', 'QUEUED', 'WORKING'].includes(build.status)
      const image = success ? exactBuiltImage(build, authority) : null
      return buildReconciledTerminal({
        terminalId: request.terminalId,
        disposition: success
          ? 'qualification_image_built_pending_supply_chain_release'
          : pending
            ? 'pending'
            : build.status === 'STATUS_UNKNOWN'
              ? 'outcome_unknown'
              : 'terminal_failure',
        authorityRef: reconciliation.authorityRef,
        submissionRef: reconciliation.submissionRef,
        reconciliationRef: request.reconciliationRef,
        buildRequestHash: reconciliation.buildRequestHash,
        cloudBuildId: build.id,
        cloudBuildResource: `${BUILD_COLLECTION}/${build.id}`,
        providerHttpStatus: 200,
        cloudBuildStatus: build.status,
        cloudBuildCreateTime: build.createTime,
        cloudBuildStartTime: build.startTime ?? null,
        cloudBuildFinishTime: build.finishTime ?? null,
        warningsAbsent: build.warnings.length === 0,
        taggedImageUri: authority.imageDestination.taggedUri,
        immutableImageDigest: image?.digest ?? null,
        immutableImageUri: image
          ? `${authority.imageDestination.repository}/${authority.imageDestination.imageName}@${image.digest}`
          : null,
        artifactRegistryPackage: image?.artifactRegistryPackage ?? null,
        durableTerminalObservationCreated: success || (!pending
          && build.status !== 'STATUS_UNKNOWN'),
        imageBuiltAndPushed: image !== null,
        observedAt,
      })
    },
  })
}

export function assertCanonicalSam31QualificationImageBuildReconciliation(
  value: unknown,
): CanonicalSam31QualificationImageBuildReconciliation {
  assertPlainSerializedData(value, 'sam31_qualification_build_reconciliation')
  const parsed = canonicalSam31QualificationImageBuildReconciliationSchema
    .parse(value)
  const { reconciliationHash, ...payload } = parsed
  if (reconciliationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification reconciliation hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationImageBuildReconciledTerminal(
  value: unknown,
): CanonicalSam31QualificationImageBuildReconciledTerminal {
  assertPlainSerializedData(value, 'sam31_qualification_reconciled_terminal')
  const parsed = canonicalSam31QualificationImageBuildReconciledTerminalSchema
    .parse(value)
  const { terminalHash, ...payload } = parsed
  if (terminalHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 reconciled terminal hash changed.')
  }
  return parsed
}

export function canonicalSam31QualificationImageBuildReconciliationRef(
  value: unknown,
) {
  const record = assertCanonicalSam31QualificationImageBuildReconciliation(
    value,
  )
  return evidenceRefSchema.parse({
    id: record.reconciliationId,
    version: record.reconciliationVersion,
    contentHash: `sha256:${record.reconciliationHash}`,
  })
}

export function canonicalSam31QualificationImageBuildReconciledTerminalRef(
  value: unknown,
) {
  const record =
    assertCanonicalSam31QualificationImageBuildReconciledTerminal(value)
  return evidenceRefSchema.parse({
    id: record.terminalId,
    version: record.terminalVersion,
    contentHash: `sha256:${record.terminalHash}`,
  })
}

export function canonicalSam31QualificationImageBuildSubmissionRef(
  submission: CanonicalSam31QualificationImageBuildSubmission,
) {
  const parsed = assertCanonicalSam31QualificationImageBuildSubmission(
    submission,
  )
  return evidenceRefSchema.parse({
    id: `sam31-qualification-image-submission-${parsed.submissionHash.slice(0, 20)}`,
    version: 1,
    contentHash: `sha256:${parsed.submissionHash}`,
  })
}

function buildReconciliation(input: {
  readonly reconciliationId: string
  readonly disposition:
    | 'precreation_rejection_no_build_found'
    | 'accepted_response_no_build_found'
    | 'matched_exact_build'
    | 'ambiguous'
  readonly authorityRef: z.infer<typeof evidenceRefSchema>
  readonly submissionRef: z.infer<typeof evidenceRefSchema>
  readonly buildRequestHash: string
  readonly providerHttpStatus: 200 | 400
  readonly cloudBuildCreateContractRef: z.infer<typeof evidenceRefSchema>
  readonly cloudBuildListRequestRef: z.infer<typeof evidenceRefSchema>
  readonly cloudBuildListResponseSha256: string
  readonly matchingBuildCount: number
  readonly matchedCloudBuildId: string | null
  readonly matchedCloudBuildResource: string | null
  readonly matchedCloudBuildStatus: z.infer<typeof buildStatusSchema> | null
  readonly matchedCloudBuildCreateTime: string | null
  readonly exactFixedBuildRequestEchoVerified: boolean
  readonly exactStorageGenerationProvenanceVerified: boolean
  readonly predecessorProviderExecutionKnownAbsent: boolean
  readonly predecessorImageBuildKnownStarted: boolean
  readonly distinctSuccessorAuthorityMayBeIssued: boolean
  readonly observedAt: string
}) {
  const payload = reconciliationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RECONCILIATION_VERSION,
    source: 'canonical_sam3_1_qualification_image_build_reconciliation_owner',
    reconciliationVersion: 1,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    originalRegionalCreateRequestMissingRequiredProjectIdQuery:
      input.providerHttpStatus === 400,
    correctedRegionalCreateRequestIncludesRequiredProjectIdQuery: true,
    cloudBuildListExactlyReread: true,
    cloudBuildListPaginationComplete: true,
    originalSubmissionHadNoCreateOperationOrBuildId: true,
    predecessorImagePushKnownCompleted: false,
    predecessorImmutableImageDigestKnown: false,
    automaticRetryAllowed: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionReady: false,
    ...input,
  })
  return canonicalSam31QualificationImageBuildReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

function buildReconciledTerminal(input: Omit<
  z.input<typeof reconciledTerminalWithoutHashSchema>,
  | 'schemaVersion' | 'source' | 'terminalVersion' | 'operationId'
  | 'providerProjectIdentityNormalized'
  | 'exactFixedBuildRequestEchoVerified'
  | 'exactStorageGenerationProvenanceVerified'
  | 'sbomReread' | 'artifactAnalysisScanPassed'
  | 'imageSignatureVerified' | 'provenanceVerified'
  | 'sourceCheckpointQualificationGranted' | 'runtimeReleaseGranted'
  | 'gpuJobDispatched' | 'customerCreditsMutated' | 'productionReady'
>) {
  const payload = reconciledTerminalWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RECONCILED_TERMINAL_VERSION,
    source:
      'canonical_sam3_1_qualification_image_build_reconciled_terminal_owner',
    terminalVersion: 1,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    providerProjectIdentityNormalized: true,
    exactFixedBuildRequestEchoVerified: true,
    exactStorageGenerationProvenanceVerified: true,
    sbomReread: false,
    artifactAnalysisScanPassed: false,
    imageSignatureVerified: false,
    provenanceVerified: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionReady: false,
    ...input,
  })
  return canonicalSam31QualificationImageBuildReconciledTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

type ParsedBuild = ReturnType<typeof parseBuild>

function parseBuildList(value: unknown): {
  readonly builds: readonly ParsedBuild[]
} {
  assertPlainSerializedData(value, 'sam31_qualification_cloud_build_list')
  const root = z.object({
    builds: z.array(z.unknown()).max(100).default([]),
    nextPageToken: z.string().optional(),
  }).passthrough().parse(value)
  if (root.nextPageToken) {
    throw new Error('SAM 3.1 Cloud Build list pagination is incomplete.')
  }
  return { builds: root.builds.map(parseBuild) }
}

function parseBuild(value: unknown) {
  return z.object({
    id: z.string().uuid(),
    name: safeId,
    projectId: z.literal(PROJECT_ID),
    status: buildStatusSchema,
    createTime: timestamp,
    startTime: timestamp.optional(),
    finishTime: timestamp.optional(),
    warnings: z.array(z.unknown()).max(1_000).default([]),
    source: z.unknown(),
    sourceProvenance: z.unknown().optional(),
    steps: z.unknown(),
    images: z.unknown(),
    timeout: z.unknown(),
    queueTtl: z.unknown(),
    serviceAccount: z.unknown(),
    options: z.unknown(),
    tags: z.unknown(),
    results: z.unknown().optional(),
  }).passthrough().parse(value)
}

function exactBuiltImage(
  build: ParsedBuild,
  authority: CanonicalSam31QualificationImageBuildAuthority,
) {
  const results = record(build.results)
  const images = z.array(z.unknown()).length(1).parse(results.images)
  const image = z.object({
    name: z.literal(authority.imageDestination.taggedUri),
    digest: prefixedSha256,
    artifactRegistryPackage: z.literal(ARTIFACT_REGISTRY_PACKAGE),
  }).passthrough().parse(images[0])
  return image
}

function providerBuildNameMatches(name: string, buildId: string): boolean {
  return [...PROVIDER_BUILD_COLLECTIONS].some(
    (collection) => name === `${collection}/${buildId}`,
  )
}

function exactBuildEchoMatches(
  build: ParsedBuild,
  authority: CanonicalSam31QualificationImageBuildAuthority,
  earliestCreateTime: string,
): boolean {
  if (Date.parse(build.createTime) < Date.parse(earliestCreateTime)) return false
  const expected = compileCanonicalSam31QualificationImageBuildRequestBody(
    authority,
  ) as Record<string, unknown>
  const observedResolvedStorage = (build.sourceProvenance as {
    resolvedStorageSource?: unknown
  } | undefined)?.resolvedStorageSource
  const expectedStorage = (expected.source as {
    storageSource?: unknown
  }).storageSource
  return sameJson(build.source, expected.source)
    && sameBuildSteps(build.steps, expected.steps)
    && sameJson(build.images, expected.images)
    && build.timeout === expected.timeout
    && build.queueTtl === expected.queueTtl
    && build.serviceAccount === expected.serviceAccount
    && sameBuildOptions(build.options, expected.options)
    && sameJson(build.tags, expected.tags)
    && sameJson(observedResolvedStorage, expectedStorage)
}

function sameBuildSteps(observed: unknown, expected: unknown): boolean {
  const observedSteps = z.array(z.object({
    id: z.unknown(),
    name: z.unknown(),
    args: z.unknown(),
  }).passthrough()).max(100).safeParse(observed)
  const expectedSteps = z.array(z.object({
    id: z.unknown(),
    name: z.unknown(),
    args: z.unknown(),
  }).strict()).max(100).safeParse(expected)
  if (!observedSteps.success || !expectedSteps.success) return false
  return sameJson(observedSteps.data.map(({ id, name, args }) => ({
    id, name, args,
  })), expectedSteps.data)
}

function sameBuildOptions(observed: unknown, expected: unknown): boolean {
  const keys = [
    'machineType', 'diskSizeGb', 'sourceProvenanceHash',
    'requestedVerifyOption', 'logging',
  ] as const
  const observedRecord = record(observed)
  const expectedRecord = record(expected)
  return sameJson(
    Object.fromEntries(keys.map((key) => [key, observedRecord[key]])),
    Object.fromEntries(keys.map((key) => [key, expectedRecord[key]])),
  )
}

function authorityRef(
  authority: CanonicalSam31QualificationImageBuildAuthority,
) {
  return evidenceRefSchema.parse({
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameJson(left: unknown, right: unknown): boolean {
  try {
    return stableAuthorityStringify(left) === stableAuthorityStringify(right)
  } catch {
    return false
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('SAM 3.1 Cloud Build options are invalid.')
  }
  return value as Record<string, unknown>
}

export const canonicalSam31QualificationImageBuildListEndpoint =
  BUILD_LIST_ENDPOINT
export const canonicalSam31QualificationImageBuildResourceEndpointPattern =
  /^https:\/\/cloudbuild\.googleapis\.com\/v1\/projects\/reeditpro\/locations\/us-central1\/builds\/[a-f0-9-]{36}$/u
