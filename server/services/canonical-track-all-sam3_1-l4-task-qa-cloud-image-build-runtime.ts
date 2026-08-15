import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef,
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildService,
  type CanonicalTrackAllSam31L4TaskQaCloudBuildTransport,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityReadPort,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildStatePort,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-repository-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_GOOGLE_CLOUD_BUILD_TRANSPORT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-google-cloud-build-transport-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const CREATE_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds?projectId=reeditpro' as const
const DEFAULT_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/cloud-image-build'
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform'
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..') && !value.endsWith('/'))
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..')),
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-consumption-v1',
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_repository',
  ),
  authorityRef: evidenceRefSchema,
  buildRequestHash: rawSha256,
  consumedAt: z.string().datetime({ offset: true }),
  createOnly: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  developerMachineModelInstallAllowed: z.literal(false),
  customerCreditMutationAllowed: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: rawSha256,
}).strict()

type EvidenceRef = z.infer<typeof evidenceRefSchema>
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface CanonicalTrackAllSam31L4TaskQaCloudImageBuildRepository
  extends CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityReadPort,
    CanonicalTrackAllSam31L4TaskQaCloudImageBuildStatePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_REPOSITORY_VERSION
  readonly evidenceClass: 'create_only_exact_reread'
  persistBuildAuthorityCreateOnly(input: {
    readonly authority:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
  }): Promise<EvidenceRef>
  rereadSubmission(input: {
    readonly submissionRef: EvidenceRef
  }): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission | null>
}

export function canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef(
  value: unknown,
): EvidenceRef {
  const authority =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(value)
  return evidenceRefSchema.parse({
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}`,
  })
}

export function createCanonicalTrackAllSam31L4TaskQaCloudImageBuildRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31L4TaskQaCloudImageBuildRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_REPOSITORY_VERSION,
    evidenceClass: 'create_only_exact_reread' as const,

    async persistBuildAuthorityCreateOnly({ authority }: {
      readonly authority:
        CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
    }) {
      const parsed =
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(
          authority,
        )
      const ref =
        canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef(parsed)
      await persistExact(
        input.objectPort,
        authorityPath(prefix, ref),
        parsed,
      )
      return ref
    },

    async rereadBuildAuthority({ authorityRef }: {
      readonly authorityRef: EvidenceRef
    }) {
      const ref = evidenceRefSchema.parse(authorityRef)
      const value = await readRecord(
        input.objectPort,
        authorityPath(prefix, ref),
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
      )
      if (!value) return null
      if (!sameRef(
        ref,
        canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef(value),
      )) throw new Error('track_all_l4_build_authority_ref_mismatch')
      return value
    },

    async consumeAuthorityCreateOnly(value: {
      readonly authorityRef: EvidenceRef
      readonly buildRequestHash: string
      readonly consumedAt: string
    }) {
      const payload = consumptionWithoutHashSchema.parse({
        schemaVersion:
          'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-consumption-v1',
        source:
          'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_repository',
        authorityRef: value.authorityRef,
        buildRequestHash: value.buildRequestHash,
        consumedAt: value.consumedAt,
        createOnly: true,
        automaticRetryAllowed: false,
        developerMachineModelInstallAllowed: false,
        customerCreditMutationAllowed: false,
        runtimeReleaseGranted: false,
      })
      const record = consumptionSchema.parse({
        ...payload,
        consumptionHash: sha256AuthorityValue(payload),
      })
      const body = recordBody(record)
      const result = await input.objectPort.createOnly({
        objectPath: consumptionPath(prefix, payload.authorityRef),
        body,
        contentSha256: sha256(body),
      })
      if (result === 'already_exists') return false
      const reread = await input.objectPort.readExact(
        consumptionPath(prefix, payload.authorityRef),
      )
      if (!reread || !reread.equals(body)) {
        throw new Error('track_all_l4_build_consumption_reread_mismatch')
      }
      return true
    },

    async persistSubmissionCreateOnly({ submission }: {
      readonly submission:
        CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
    }) {
      const parsed =
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(
          submission,
        )
      await persistExact(
        input.objectPort,
        submissionPath(
          prefix,
          canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(parsed),
        ),
        parsed,
      )
      return true
    },

    async rereadSubmission({ submissionRef }: {
      readonly submissionRef: EvidenceRef
    }) {
      const ref = evidenceRefSchema.parse(submissionRef)
      const value = await readRecord(
        input.objectPort,
        submissionPath(prefix, ref),
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
      )
      if (!value) return null
      if (!sameRef(
        ref,
        canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(value),
      )) throw new Error('track_all_l4_build_submission_ref_mismatch')
      return value
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGoogleCloudBuildTransport(
  input: {
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
  } = {},
): CanonicalTrackAllSam31L4TaskQaCloudBuildTransport {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const timeout = input.requestTimeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('track_all_l4_cloud_build_timeout_invalid')
  }
  return Object.freeze({
    async request(request: Parameters<
      CanonicalTrackAllSam31L4TaskQaCloudBuildTransport['request']
    >[0]) {
      if (request.method !== 'POST' || request.url !== CREATE_ENDPOINT) {
        throw new Error('track_all_l4_cloud_build_request_not_allowlisted')
      }
      assertClosedJson(request.body, 'track_all_l4_cloud_build_request')
      const response = await auth.request<unknown>({
        url: request.url,
        method: request.method,
        data: request.body,
        timeout,
        retry: false,
        maxRedirects: 0,
        responseType: 'json',
        validateStatus: () => true,
      })
      if (!Number.isInteger(response.status)
        || response.status < 100 || response.status > 599) {
        throw new Error('track_all_l4_cloud_build_status_invalid')
      }
      assertClosedJson(response.data, 'track_all_l4_cloud_build_response')
      return {
        status: response.status,
        json: structuredClone(response.data),
      }
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaCloudImageBuildRuntime(
  input: {
    readonly repository:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildRepository
    readonly authenticatedTransport?:
      CanonicalTrackAllSam31L4TaskQaCloudBuildTransport
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
    readonly now?: () => string
  },
) {
  const transport = input.authenticatedTransport
    ?? createCanonicalTrackAllSam31L4TaskQaGoogleCloudBuildTransport({
      auth: input.auth,
      requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
    })
  const service =
    createCanonicalTrackAllSam31L4TaskQaCloudImageBuildService({
      authorityReadPort: input.repository,
      statePort: input.repository,
      authenticatedTransport: transport,
      now: input.now,
    })
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_RUNTIME_VERSION,
    cloudOnlyOfflineImageBuild: true as const,
    developerMachineModelCheckpointCudaOrGpuInstallAllowed: false as const,
    persistBuildAuthorityCreateOnly:
      input.repository.persistBuildAuthorityCreateOnly.bind(input.repository),
    startOneImageBuild: service.startOneImageBuild,
    rereadSubmission:
      input.repository.rereadSubmission.bind(input.repository),
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime(
  input: {
    readonly storage?: Storage
    readonly authenticatedTransport?:
      CanonicalTrackAllSam31L4TaskQaCloudBuildTransport
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
    readonly now?: () => string
  } = {},
) {
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage: input.storage ?? new Storage({ projectId: PROJECT_ID }),
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const repository =
    createCanonicalTrackAllSam31L4TaskQaCloudImageBuildRepository({
      objectPort,
    })
  return Object.freeze({
    ...createCanonicalTrackAllSam31L4TaskQaCloudImageBuildRuntime({
      repository,
      authenticatedTransport: input.authenticatedTransport,
      auth: input.auth,
      requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
      now: input.now,
    }),
    repository,
    projectId: PROJECT_ID,
    controlPlaneStateBucketName: CONTROL_PLANE_BUCKET,
    persistenceMode: 'private_gcs_create_only_exact_reread' as const,
    callerSelectedBucketAllowed: false as const,
  })
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<void> {
  const body = recordBody(value)
  await port.createOnly({
    objectPath,
    body,
    contentSha256: sha256(body),
  })
  const reread = await port.readExact(objectPath)
  if (!reread || !reread.equals(body)) {
    throw new Error('track_all_l4_cloud_build_exact_reread_failed')
  }
}

async function readRecord<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength > 16 * 1024 * 1024) {
    throw new Error('track_all_l4_cloud_build_record_too_large')
  }
  return parse(JSON.parse(body.toString('utf8')))
}

function authorityPath(prefix: string, ref: EvidenceRef): string {
  return `${prefix}/authorities/${ref.contentHash.slice(7)}.json`
}

function consumptionPath(prefix: string, ref: EvidenceRef): string {
  return `${prefix}/consumptions/${ref.contentHash.slice(7)}.json`
}

function submissionPath(prefix: string, ref: EvidenceRef): string {
  return `${prefix}/submissions/${ref.contentHash.slice(7)}.json`
}

function recordBody(value: unknown): Buffer {
  return Buffer.from(stableAuthorityStringify(value), 'utf8')
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('track_all_l4_cloud_build_object_port_invalid')
  }
}

function assertClosedJson(value: unknown, label: string): void {
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
          || !descriptor.enumerable) throw new Error(`${label}_unsafe_array`)
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
