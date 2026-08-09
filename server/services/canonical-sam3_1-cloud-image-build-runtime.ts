import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31ImageBuildArtifactBinding,
  assertCanonicalSam31PrivateImageBuildCapsuleManifest,
  type CanonicalSam31ImageBuildArtifactBinding,
  type CanonicalSam31PrivateImageBuildCapsuleManifest,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31CloudImageBuildSubmission,
  assertCanonicalSam31CloudImageBuildTerminalObservation,
  assertCanonicalSam31AnyCloudImageBuildAuthority,
  createCanonicalSam31CloudImageBuildService,
  type CanonicalSam31AnyCloudImageBuildAuthority,
  type CanonicalSam31CloudBuildAuthenticatedTransport,
  type CanonicalSam31CloudImageBuildAuthorityReadPort,
  type CanonicalSam31CloudImageBuildQualificationReleaseReadPort,
  type CanonicalSam31CloudImageBuildStatePort,
  type CanonicalSam31CloudImageBuildSubmission,
  type CanonicalSam31CloudImageBuildTerminalObservation,
} from './canonical-sam3_1-cloud-image-build-service'
import {
  createCanonicalSam31VertexQualificationReleaseObjectReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_REPOSITORY_VERSION =
  'canonical-sam3_1-cloud-image-build-repository-v3' as const
export const CANONICAL_SAM3_1_GOOGLE_CLOUD_BUILD_TRANSPORT_VERSION =
  'canonical-sam3_1-google-cloud-build-transport-v1' as const
export const CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_RUNTIME_VERSION =
  'canonical-sam3_1-cloud-image-build-runtime-v2' as const

const BUILD_COLLECTION_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds'
const BUILD_CREATE_ENDPOINT = `${BUILD_COLLECTION_ENDPOINT}?projectId=reeditpro`
const BUILD_RESOURCE = new RegExp(
  '^https://cloudbuild\\.googleapis\\.com/v1/projects/reeditpro/locations/'
    + 'us-central1/builds/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-'
    + '[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  'u',
)
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform'
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state'
const DEFAULT_PREFIX = 'private/sam3_1/cloud-image-build/v2'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..')
    && !value.includes('//')
    && !value.endsWith('/'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
    .refine((value) => !value.includes('..')),
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-cloud-image-build-consumption-v1',
  ),
  source: z.literal(
    'canonical_server_sam3_1_cloud_image_build_repository',
  ),
  authorityRef: evidenceRefSchema,
  buildRequestHash: rawSha256,
  consumedAt: timestamp,
  createOnly: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  developerMachineModelInstallAllowed: z.literal(false),
  customerCreditMutationAllowed: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: rawSha256,
}).strict().superRefine((value, context) => {
  const { consumptionHash, ...payload } = value
  if (consumptionHash !== sha256AuthorityValue(payload)) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 build consumption digest is invalid.',
  })
})

type EvidenceRef = z.infer<typeof evidenceRefSchema>
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>
export interface CanonicalSam31CloudImageBuildRepository
  extends CanonicalSam31CloudImageBuildAuthorityReadPort,
    CanonicalSam31CloudImageBuildStatePort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_REPOSITORY_VERSION
  readonly evidenceClass: 'create_only_exact_reread'
  persistArtifactBindingCreateOnly(input: {
    readonly binding: CanonicalSam31ImageBuildArtifactBinding
  }): Promise<EvidenceRef>
  rereadArtifactBinding(input: {
    readonly bindingRef: EvidenceRef
  }): Promise<CanonicalSam31ImageBuildArtifactBinding | null>
  persistCapsuleManifestCreateOnly(input: {
    readonly manifest: CanonicalSam31PrivateImageBuildCapsuleManifest
  }): Promise<EvidenceRef>
  rereadCapsuleManifest(input: {
    readonly manifestRef: EvidenceRef
  }): Promise<CanonicalSam31PrivateImageBuildCapsuleManifest | null>
  persistBuildAuthorityCreateOnly(input: {
    readonly authority: CanonicalSam31AnyCloudImageBuildAuthority
  }): Promise<EvidenceRef>
  rereadSubmission(input: {
    readonly submissionRef: EvidenceRef
  }): Promise<CanonicalSam31CloudImageBuildSubmission | null>
  rereadTerminalObservation(input: {
    readonly observationRef: EvidenceRef
  }): Promise<CanonicalSam31CloudImageBuildTerminalObservation | null>
}

export function canonicalSam31ImageBuildArtifactBindingRef(
  binding: CanonicalSam31ImageBuildArtifactBinding,
): EvidenceRef {
  const parsed = assertCanonicalSam31ImageBuildArtifactBinding(binding)
  return evidenceRefSchema.parse({
    id: `sam31-build-binding-${parsed.bindingHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${parsed.bindingHash}`,
  })
}

export function canonicalSam31PrivateImageBuildCapsuleManifestRef(
  manifest: CanonicalSam31PrivateImageBuildCapsuleManifest,
): EvidenceRef {
  const parsed = assertCanonicalSam31PrivateImageBuildCapsuleManifest(manifest)
  return evidenceRefSchema.parse({
    id: parsed.manifestId,
    version: parsed.manifestVersion,
    contentHash: `sha256:${parsed.manifestHash}`,
  })
}

export function canonicalSam31CloudImageBuildAuthorityRef(
  authority: CanonicalSam31AnyCloudImageBuildAuthority,
): EvidenceRef {
  const parsed = assertCanonicalSam31AnyCloudImageBuildAuthority(authority)
  return evidenceRefSchema.parse({
    id: parsed.authorityId,
    version: parsed.authorityVersion,
    contentHash: `sha256:${parsed.authorityHash}`,
  })
}

export function canonicalSam31CloudImageBuildSubmissionRef(
  submission: CanonicalSam31CloudImageBuildSubmission,
): EvidenceRef {
  const parsed = assertCanonicalSam31CloudImageBuildSubmission(submission)
  return evidenceRefSchema.parse({
    id: `sam31-cloud-build-submission-${parsed.submissionHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${parsed.submissionHash}`,
  })
}

export function canonicalSam31CloudImageBuildTerminalObservationRef(
  observation: CanonicalSam31CloudImageBuildTerminalObservation,
): EvidenceRef {
  const parsed = assertCanonicalSam31CloudImageBuildTerminalObservation(
    observation,
  )
  return evidenceRefSchema.parse({
    id: `sam31-cloud-build-terminal-${parsed.observationHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${parsed.observationHash}`,
  })
}

/**
 * Durable single-writer repository. Authority consumption is keyed only by
 * the immutable authority hash, so neither a retry nor a changed request can
 * create a second Cloud Build call after an uncertain outcome.
 */
export function createCanonicalSam31CloudImageBuildRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31CloudImageBuildRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31CloudImageBuildRepository = {
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_REPOSITORY_VERSION,
    evidenceClass: 'create_only_exact_reread',

    async persistArtifactBindingCreateOnly({ binding }) {
      const parsed = assertCanonicalSam31ImageBuildArtifactBinding(binding)
      const ref = canonicalSam31ImageBuildArtifactBindingRef(parsed)
      await persistExact(
        input.objectPort,
        recordPath(prefix, 'artifact-bindings', ref),
        parsed,
      )
      return ref
    },

    async rereadArtifactBinding({ bindingRef }) {
      const ref = evidenceRefSchema.parse(bindingRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'artifact-bindings', ref),
        assertCanonicalSam31ImageBuildArtifactBinding,
      )
      if (!value) return null
      if (!sameRef(ref, canonicalSam31ImageBuildArtifactBindingRef(value))) {
        throw conflict('sam3_1_build_binding_reread_ref_mismatch')
      }
      return value
    },

    async persistCapsuleManifestCreateOnly({ manifest }) {
      const parsed = assertCanonicalSam31PrivateImageBuildCapsuleManifest(
        manifest,
      )
      const ref = canonicalSam31PrivateImageBuildCapsuleManifestRef(parsed)
      await persistExact(
        input.objectPort,
        recordPath(prefix, 'capsule-manifests', ref),
        parsed,
      )
      return ref
    },

    async rereadCapsuleManifest({ manifestRef }) {
      const ref = evidenceRefSchema.parse(manifestRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'capsule-manifests', ref),
        assertCanonicalSam31PrivateImageBuildCapsuleManifest,
      )
      if (!value) return null
      if (!sameRef(
        ref,
        canonicalSam31PrivateImageBuildCapsuleManifestRef(value),
      )) throw conflict('sam3_1_capsule_manifest_reread_ref_mismatch')
      return value
    },

    async persistBuildAuthorityCreateOnly({ authority }) {
      const parsed = assertCanonicalSam31AnyCloudImageBuildAuthority(authority)
      const ref = canonicalSam31CloudImageBuildAuthorityRef(parsed)
      await persistExact(
        input.objectPort,
        recordPath(prefix, 'authorities', ref),
        parsed,
      )
      return ref
    },

    async rereadBuildAuthority({ authorityRef }) {
      const ref = evidenceRefSchema.parse(authorityRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'authorities', ref),
        assertCanonicalSam31AnyCloudImageBuildAuthority,
      )
      if (!value) return null
      if (!sameRef(ref, canonicalSam31CloudImageBuildAuthorityRef(value))) {
        throw conflict('sam3_1_build_authority_reread_ref_mismatch')
      }
      return value
    },

    async consumeAuthorityCreateOnly(value) {
      const payload = consumptionWithoutHashSchema.parse({
        schemaVersion: 'canonical-sam3_1-cloud-image-build-consumption-v1',
        source: 'canonical_server_sam3_1_cloud_image_build_repository',
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
        objectPath: recordPath(prefix, 'consumptions', payload.authorityRef),
        body,
        contentSha256: sha256(body),
      })
      if (result === 'already_exists') return false
      const reread = await input.objectPort.readExact(
        recordPath(prefix, 'consumptions', payload.authorityRef),
      )
      if (!reread || !reread.equals(body)) {
        throw conflict('sam3_1_build_consumption_reread_mismatch')
      }
      return true
    },

    async persistSubmissionCreateOnly({ submission }) {
      const parsed = assertCanonicalSam31CloudImageBuildSubmission(submission)
      await persistExact(
        input.objectPort,
        recordPath(
          prefix,
          'submissions',
          canonicalSam31CloudImageBuildSubmissionRef(parsed),
        ),
        parsed,
      )
      return true
    },

    async persistTerminalObservationCreateOnly({ observation }) {
      const parsed = assertCanonicalSam31CloudImageBuildTerminalObservation(
        observation,
      )
      await persistExact(
        input.objectPort,
        recordPath(
          prefix,
          'terminal-observations',
          canonicalSam31CloudImageBuildTerminalObservationRef(parsed),
        ),
        parsed,
      )
      return true
    },

    async rereadSubmission({ submissionRef }) {
      const ref = evidenceRefSchema.parse(submissionRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'submissions', ref),
        assertCanonicalSam31CloudImageBuildSubmission,
      )
      if (!value) return null
      if (!sameRef(ref, canonicalSam31CloudImageBuildSubmissionRef(value))) {
        throw conflict('sam3_1_build_submission_reread_ref_mismatch')
      }
      return value
    },

    async rereadTerminalObservation({ observationRef }) {
      const ref = evidenceRefSchema.parse(observationRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'terminal-observations', ref),
        assertCanonicalSam31CloudImageBuildTerminalObservation,
      )
      if (!value) return null
      if (!sameRef(
        ref,
        canonicalSam31CloudImageBuildTerminalObservationRef(value),
      )) throw conflict('sam3_1_build_terminal_reread_ref_mismatch')
      return value
    },
  }
  return Object.freeze(repository)
}

/** Google ADC transport with one fixed API origin, no retry, and no redirect. */
export function createCanonicalSam31GoogleCloudBuildAuthenticatedTransport(
  input: {
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
  } = {},
): CanonicalSam31CloudBuildAuthenticatedTransport {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const timeout = input.requestTimeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw notReady('sam3_1_cloud_build_transport_timeout_invalid')
  }
  return Object.freeze({
    async request(
      request: Parameters<
        CanonicalSam31CloudBuildAuthenticatedTransport['request']
      >[0],
    ) {
      assertCloudBuildTransportRequest(request)
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
        || response.status < 100
        || response.status > 599) {
        throw notReady('sam3_1_cloud_build_transport_status_invalid')
      }
      assertClosedJson(response.data, 'sam3_1_cloud_build_response')
      return {
        status: response.status,
        json: structuredClone(response.data),
      }
    },
  })
}

export function createCanonicalSam31CloudImageBuildRuntime(input: {
  readonly repository: CanonicalSam31CloudImageBuildRepository
  readonly qualificationReleaseReadPort:
    CanonicalSam31CloudImageBuildQualificationReleaseReadPort
  readonly authenticatedTransport?: CanonicalSam31CloudBuildAuthenticatedTransport
  readonly auth?: GoogleAuthRequest
  readonly requestTimeoutMilliseconds?: number
  readonly now?: () => string
}) {
  const transport = input.authenticatedTransport
    ?? createCanonicalSam31GoogleCloudBuildAuthenticatedTransport({
      auth: input.auth,
      requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
    })
  const service = createCanonicalSam31CloudImageBuildService({
    authorityReadPort: input.repository,
    qualificationReleaseReadPort: input.qualificationReleaseReadPort,
    statePort: input.repository,
    authenticatedTransport: transport,
    now: input.now,
  })
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_RUNTIME_VERSION,
    cloudGpuImageBuildOnly: true as const,
    developerMachineModelCheckpointCudaOrGpuRuntimeInstallAllowed:
      false as const,
    persistBuildAuthorityCreateOnly:
      input.repository.persistBuildAuthorityCreateOnly.bind(input.repository),
    startOneImageBuild: service.startOneImageBuild,
    async observeOnePersistedImageBuild(request: {
      readonly authorityRef: EvidenceRef
      readonly submissionRef: EvidenceRef
    }) {
      const authority = await input.repository.rereadBuildAuthority({
        authorityRef: request.authorityRef,
      })
      const submission = await input.repository.rereadSubmission({
        submissionRef: request.submissionRef,
      })
      if (!authority || !submission) {
        throw notReady('sam3_1_cloud_build_persisted_lineage_missing')
      }
      if (!sameRef(
        request.authorityRef,
        canonicalSam31CloudImageBuildAuthorityRef(authority),
      ) || !sameRef(
        request.submissionRef,
        canonicalSam31CloudImageBuildSubmissionRef(submission),
      ) || !sameRef(submission.authorityRef, request.authorityRef)) {
        throw conflict('sam3_1_cloud_build_persisted_lineage_mismatch')
      }
      const observation = await service.observeOneImageBuild({
        authority,
        submission,
      })
      if (!observation.durableTerminalObservationCreated) return observation
      const observationRef =
        canonicalSam31CloudImageBuildTerminalObservationRef(observation)
      const reread = await input.repository.rereadTerminalObservation({
        observationRef,
      })
      if (!reread
        || reread.observationHash !== observation.observationHash) {
        throw conflict('sam3_1_cloud_build_terminal_not_exactly_reread')
      }
      return reread
    },
  })
}

/**
 * Production composition for the backend control plane. The bucket and Google
 * Cloud project are fixed source coordinates; neither an operator nor a worker
 * can redirect build authority to a caller-selected object store.
 */
export function createCanonicalSam31GcpCloudImageBuildRuntime(input: {
  readonly storage?: Storage
  readonly authenticatedTransport?: CanonicalSam31CloudBuildAuthenticatedTransport
  readonly auth?: GoogleAuthRequest
  readonly requestTimeoutMilliseconds?: number
  readonly now?: () => string
} = {}) {
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage: input.storage ?? new Storage({ projectId: 'reeditpro' }),
    bucketName: CONTROL_PLANE_STATE_BUCKET,
  })
  const repository = createCanonicalSam31CloudImageBuildRepository({
    objectPort,
  })
  const runtime = createCanonicalSam31CloudImageBuildRuntime({
    repository,
    qualificationReleaseReadPort:
      createCanonicalSam31VertexQualificationReleaseObjectReadPort({
        objectPort,
      }),
    authenticatedTransport: input.authenticatedTransport,
    auth: input.auth,
    requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
    now: input.now,
  })
  return Object.freeze({
    ...runtime,
    repository,
    projectId: 'reeditpro' as const,
    controlPlaneStateBucketName: CONTROL_PLANE_STATE_BUCKET,
    persistenceMode: 'private_gcs_create_only_exact_reread' as const,
    callerSelectedBucketAllowed: false as const,
  })
}

function assertCloudBuildTransportRequest(request: {
  readonly method: 'GET' | 'POST'
  readonly url: string
  readonly body?: Readonly<Record<string, unknown>>
}): void {
  const post = request.method === 'POST'
  if (
    post
      ? request.url !== BUILD_CREATE_ENDPOINT || request.body === undefined
      : !BUILD_RESOURCE.test(request.url) || request.body !== undefined
  ) throw notReady('sam3_1_cloud_build_transport_request_not_allowlisted')
  if (request.body !== undefined) {
    assertClosedJson(request.body, 'sam3_1_cloud_build_request')
  }
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  record: unknown,
): Promise<void> {
  const body = recordBody(record)
  await port.createOnly({
    objectPath,
    body,
    contentSha256: sha256(body),
  })
  const reread = await port.readExact(objectPath)
  if (!reread || !reread.equals(body)) {
    throw conflict('sam3_1_cloud_build_repository_reread_mismatch')
  }
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('sam3_1_cloud_build_repository_record_size_invalid')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('sam3_1_cloud_build_repository_record_json_invalid')
  }
  const parsed = parse(value)
  if (!recordBody(parsed).equals(body)) {
    throw conflict('sam3_1_cloud_build_repository_record_not_canonical')
  }
  return parsed
}

function recordBody(value: unknown): Buffer {
  assertClosedJson(value, 'sam3_1_cloud_build_repository_record')
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('sam3_1_cloud_build_repository_record_size_invalid')
  }
  return body
}

function recordPath(
  prefix: string,
  collection: string,
  ref: EvidenceRef,
): string {
  const parsed = evidenceRefSchema.parse(ref)
  return `${prefix}/${collection}/${parsed.contentHash.slice(7)}.json`
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw notReady('sam3_1_cloud_build_repository_port_invalid')
  }
}

function assertClosedJson(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (item: unknown): void => {
    if (item === null || typeof item === 'string'
      || typeof item === 'boolean') return
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) throw new Error(`${label} is not JSON.`)
      return
    }
    if (!item || typeof item !== 'object') {
      throw new Error(`${label} is not JSON.`)
    }
    if (seen.has(item)) throw new Error(`${label} contains a cycle.`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new Error(`${label} must contain plain JSON data.`)
    }
    seen.add(item)
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') throw new Error(`${label} has a symbol.`)
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

function sha256(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex')
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The SAM 3.1 cloud image-build record changed across its immutable boundary.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The private SAM 3.1 cloud image-build boundary is not ready.',
    503,
    { requiredGate },
  )
}
