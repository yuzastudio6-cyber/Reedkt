import { z } from 'zod'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
  compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-submission-v1' as const

const PROJECT_ID = 'reeditpro' as const
const BUILD_COLLECTION =
  'projects/reeditpro/locations/us-central1/builds' as const
const CREATE_AUTHORITY_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const
const CREATE_TRANSPORT_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds?projectId=reeditpro' as const
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

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_owner',
  ),
  disposition: z.enum([
    'rejected_before_creation',
    'submitted',
    'outcome_unknown',
  ]),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  authorityRef: evidenceRefSchema,
  buildRequestRef: evidenceRefSchema.nullable(),
  buildRequestHash: rawSha256.nullable(),
  providerHttpStatus: z.number().int().min(100).max(599).nullable(),
  cloudBuildOperationName: safeId.nullable(),
  cloudBuildId: z.string().uuid().nullable(),
  cloudBuildResource: z.string().nullable(),
  providerOutcome: z.enum(['executed', 'not_executed', 'unknown']),
  durableAuthorityConsumptionCreated: z.boolean(),
  durableSubmissionObservationCreated: z.boolean(),
  imageBuildKnownStarted: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  developerMachineModelInstallAllowed: z.literal(false),
  checkpointOrModelWeightsRead: z.literal(false),
  imagePushKnownCompleted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditMutationCreated: z.literal(false),
  qaApproved: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((record, context) => {
  const submitted = record.disposition === 'submitted'
  const rejected = record.disposition === 'rejected_before_creation'
  const operationResource = record.cloudBuildId
    ? `${BUILD_COLLECTION}/${record.cloudBuildId}`
    : null
  if (
    submitted
      ? !record.buildRequestRef
        || !record.buildRequestHash
        || record.buildRequestRef.contentHash !==
          `sha256:${record.buildRequestHash}`
        || record.providerOutcome !== 'executed'
        || !record.durableAuthorityConsumptionCreated
        || !record.durableSubmissionObservationCreated
        || !record.imageBuildKnownStarted
        || !record.cloudBuildOperationName
        || !record.cloudBuildId
        || record.cloudBuildResource !== operationResource
        || !record.providerHttpStatus
        || record.providerHttpStatus < 200
        || record.providerHttpStatus >= 300
      : rejected
        ? record.providerOutcome !== 'not_executed'
          || record.durableAuthorityConsumptionCreated
          || record.durableSubmissionObservationCreated
          || record.imageBuildKnownStarted
          || record.providerHttpStatus !== null
          || record.cloudBuildOperationName !== null
          || record.cloudBuildId !== null
          || record.cloudBuildResource !== null
        : !record.durableAuthorityConsumptionCreated
          || record.durableSubmissionObservationCreated
          || record.providerOutcome === 'not_executed'
  ) context.addIssue({
    code: 'custom',
    message: 'Track All L4 Cloud Build submission lost provider truth.',
  })
})

export const canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionSchema =
  submissionWithoutHashSchema.extend({ submissionHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionSchema
>

export interface CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityReadPort {
  rereadBuildAuthority(input: {
    readonly authorityRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority | null>
}

export interface CanonicalTrackAllSam31L4TaskQaCloudImageBuildStatePort {
  consumeAuthorityCreateOnly(input: {
    readonly authorityRef: z.infer<typeof evidenceRefSchema>
    readonly buildRequestHash: string
    readonly consumedAt: string
  }): Promise<boolean>
  persistSubmissionCreateOnly(input: {
    readonly submission:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
  }): Promise<boolean>
}

export interface CanonicalTrackAllSam31L4TaskQaCloudBuildTransport {
  request(input: {
    readonly method: 'POST'
    readonly url: typeof CREATE_TRANSPORT_ENDPOINT
    readonly body: Readonly<Record<string, unknown>>
  }): Promise<{ readonly status: number, readonly json: unknown }>
}

export function createCanonicalTrackAllSam31L4TaskQaCloudImageBuildService(
  input: {
    readonly authorityReadPort:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityReadPort
    readonly statePort:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildStatePort
    readonly authenticatedTransport:
      CanonicalTrackAllSam31L4TaskQaCloudBuildTransport
    readonly now?: () => string
  },
) {
  return Object.freeze({
    startOneImageBuild: async (request: {
      readonly authorityRef: z.infer<typeof evidenceRefSchema>
    }): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission> => {
      const observedAt = input.now?.() ?? new Date().toISOString()
      let authority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
      let canonicalAuthorityRef: z.infer<typeof evidenceRefSchema>
      try {
        const requestedRef = evidenceRefSchema.parse(request.authorityRef)
        authority =
          assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(
            await input.authorityReadPort.rereadBuildAuthority({
              authorityRef: requestedRef,
            }),
          )
        canonicalAuthorityRef = authorityRef(authority)
        if (!sameRef(requestedRef, canonicalAuthorityRef)
          || authority.evidenceClass !== 'canonical_private_reread'
          || authority.status !== 'authorized_for_private_cloud_build'
          || !authority.authority.cloudImageBuildAuthorized
          || !authority.authority
            .durableSingleUseConsumptionRequiredBeforeCloudCall) {
          throw new Error('Track All L4 image build authority not admitted.')
        }
      } catch {
        return buildSubmission({
          disposition: 'rejected_before_creation',
          authorityRef: safeAuthorityRef(request.authorityRef),
          buildRequestRef: null,
          buildRequestHash: null,
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

      const buildRequest =
        compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest(authority)
      if (!buildRequest.cloudCallAuthorized
        || buildRequest.endpoint !== CREATE_AUTHORITY_ENDPOINT) {
        throw new Error('Track All L4 cloud build request is not authorized.')
      }
      const buildRequestRef = {
        id: `track-all-l4-cloud-build-request-${buildRequest.requestHash.slice(0, 24)}`,
        version: 1 as const,
        contentHash: `sha256:${buildRequest.requestHash}` as const,
      }
      const consumed = await input.statePort.consumeAuthorityCreateOnly({
        authorityRef: canonicalAuthorityRef,
        buildRequestHash: buildRequest.requestHash,
        consumedAt: observedAt,
      })
      if (!consumed) return buildSubmission({
        disposition: 'rejected_before_creation',
        authorityRef: canonicalAuthorityRef,
        buildRequestRef,
        buildRequestHash: buildRequest.requestHash,
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

      let providerHttpStatus: number | null = null
      let accepted: ReturnType<typeof parseCreateOperation> | null = null
      try {
        const response = await input.authenticatedTransport.request({
          method: 'POST',
          url: CREATE_TRANSPORT_ENDPOINT,
          body: buildRequest.body,
        })
        providerHttpStatus = response.status
        if (response.status < 200 || response.status >= 300) {
          throw new Error('Cloud Build create returned non-success.')
        }
        accepted = parseCreateOperation(response.json)
        const submission = buildSubmission({
          disposition: 'submitted',
          authorityRef: canonicalAuthorityRef,
          buildRequestRef,
          buildRequestHash: buildRequest.requestHash,
          providerHttpStatus,
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
        if (!persisted) throw new Error('Cloud Build submission not durable.')
        return submission
      } catch {
        const submission = buildSubmission({
          disposition: 'outcome_unknown',
          authorityRef: canonicalAuthorityRef,
          buildRequestRef,
          buildRequestHash: buildRequest.requestHash,
          providerHttpStatus,
          cloudBuildOperationName: accepted?.operationName ?? null,
          cloudBuildId: accepted?.buildId ?? null,
          cloudBuildResource: accepted
            ? `${BUILD_COLLECTION}/${accepted.buildId}`
            : null,
          providerOutcome: accepted ? 'executed' : 'unknown',
          durableAuthorityConsumptionCreated: true,
          durableSubmissionObservationCreated: false,
          imageBuildKnownStarted: accepted !== null,
          observedAt,
        })
        await input.statePort.persistSubmissionCreateOnly({ submission })
          .catch(() => false)
        return submission
      }
    },
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission {
  assertClosedPlainData(value, 'track_all_l4_cloud_build_submission')
  const parsed =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionSchema.parse(value)
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 Cloud Build submission hash invalid.')
  }
  return parsed
}

export function canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(
  value: unknown,
) {
  const submission =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(value)
  return evidenceRefSchema.parse({
    id: `track-all-l4-cloud-build-submission-${submission.submissionHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${submission.submissionHash}`,
  })
}

function authorityRef(
  authority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
): z.infer<typeof evidenceRefSchema> {
  return evidenceRefSchema.parse({
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}`,
  })
}

function safeAuthorityRef(value: unknown): z.infer<typeof evidenceRefSchema> {
  const fallback = {
    id: 'invalid-track-all-l4-cloud-build-authority',
    version: 1 as const,
    contentHash: `sha256:${sha256AuthorityValue({ invalid: true })}` as const,
  }
  try {
    return evidenceRefSchema.parse(value)
  } catch {
    return evidenceRefSchema.parse(fallback)
  }
}

function buildSubmission(input: Omit<
  z.input<typeof submissionWithoutHashSchema>,
  | 'schemaVersion' | 'source' | 'operationId'
  | 'automaticRetryAllowed' | 'developerMachineModelInstallAllowed'
  | 'checkpointOrModelWeightsRead' | 'imagePushKnownCompleted'
  | 'runtimeReleaseGranted' | 'gpuJobDispatched'
  | 'customerCreditMutationCreated' | 'qaApproved' | 'productionReady'
>): CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_owner',
    operationId: 'tool.kornia.refine_mask.v1',
    automaticRetryAllowed: false,
    developerMachineModelInstallAllowed: false,
    checkpointOrModelWeightsRead: false,
    imagePushKnownCompleted: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditMutationCreated: false,
    qaApproved: false,
    productionReady: false,
    ...input,
  })
  return canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionSchema.parse({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function parseCreateOperation(value: unknown): {
  readonly operationName: string
  readonly buildId: string
} {
  assertClosedPlainData(value, 'track_all_l4_cloud_build_create_operation')
  const root = record(value)
  const operationName = safeId.parse(root.name)
  const build = record(record(root.metadata).build)
  const buildId = z.string().uuid().parse(build.id)
  if (build.name !== `${BUILD_COLLECTION}/${buildId}`
    || build.projectId !== PROJECT_ID) {
    throw new Error('Track All L4 Cloud Build crossed project or build.')
  }
  return { operationName, buildId }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Track All L4 provider record invalid.')
  }
  return value as Record<string, unknown>
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (current: unknown): void => {
    if (current === null || ['string', 'number', 'boolean'].includes(
      typeof current,
    )) return
    if (typeof current !== 'object') throw new Error(`${label}_not_json`)
    if (seen.has(current)) throw new Error(`${label}_cyclic`)
    seen.add(current)
    if (Array.isArray(current)) {
      if (Object.keys(current).length !== current.length) {
        throw new Error(`${label}_sparse_array`)
      }
      for (let index = 0; index < current.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(
          current,
          String(index),
        )
        if (!descriptor || descriptor.get || descriptor.set
          || !descriptor.enumerable) {
          throw new Error(`${label}_unsafe_array_property`)
        }
        visit(descriptor.value)
      }
      seen.delete(current)
      return
    }
    if (Object.getPrototypeOf(current) !== Object.prototype) {
      throw new Error(`${label}_not_plain`)
    }
    for (const key of Reflect.ownKeys(current)) {
      if (typeof key !== 'string') throw new Error(`${label}_symbol_key`)
      const descriptor = Object.getOwnPropertyDescriptor(current, key)
      if (!descriptor || descriptor.get || descriptor.set
        || !descriptor.enumerable) throw new Error(`${label}_unsafe_property`)
      visit(descriptor.value)
    }
    seen.delete(current)
  }
  visit(value)
}
