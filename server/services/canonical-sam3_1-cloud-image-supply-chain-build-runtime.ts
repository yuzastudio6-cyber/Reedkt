import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import type { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31ImageSupplyChainBuildAdmission,
  assertCanonicalSam31ImageSupplyChainBuildObservation,
  assertCanonicalSam31ImageSupplyChainBuildSubmission,
  createCanonicalSam31ImageSupplyChainBuildService,
  imageSupplyChainBuildAdmissionReference,
  imageSupplyChainBuildSubmissionReference,
  type CanonicalSam31ImageSupplyChainBuildAdmission,
  type CanonicalSam31ImageSupplyChainBuildAdmissionReadPort,
  type CanonicalSam31ImageSupplyChainBuildObservation,
  type CanonicalSam31ImageSupplyChainBuildStatePort,
  type CanonicalSam31ImageSupplyChainBuildSubmission,
} from './canonical-sam3_1-cloud-image-supply-chain-build-service'
import {
  createCanonicalSam31GoogleCloudBuildAuthenticatedTransport,
} from './canonical-sam3_1-cloud-image-build-runtime'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_REPOSITORY_VERSION =
  'canonical-sam3_1-image-supply-chain-build-repository-v1' as const
export const CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_RUNTIME_VERSION =
  'canonical-sam3_1-image-supply-chain-build-runtime-v1' as const

const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const EVIDENCE_BUCKET =
  'reeditpro-production-reeditpro-image-supply-chain-evidence' as const
const DEFAULT_PREFIX = 'private/sam3_1/image-supply-chain-build/v1'
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
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..')),
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-image-supply-chain-build-consumption-v1',
  ),
  source: z.literal(
    'canonical_server_sam3_1_image_supply_chain_build_repository',
  ),
  admissionRef: evidenceRefSchema,
  buildRequestHash: rawSha256,
  consumedAt: timestamp,
  createOnly: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  callerSelectedBuildAllowed: z.literal(false),
  developerMachineModelInstallAllowed: z.literal(false),
  customerCreditMutationAllowed: z.literal(false),
  imageSupplyChainReleaseGranted: z.literal(false),
  gpuRuntimeAuthorized: z.literal(false),
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: rawSha256,
}).strict().superRefine((value, context) => {
  const { consumptionHash, ...payload } = value
  if (consumptionHash !== sha256AuthorityValue(payload)) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 supply-chain build consumption hash is invalid.',
  })
})

type EvidenceRef = z.infer<typeof evidenceRefSchema>
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface CanonicalSam31ImageSupplyChainBuildRepository
  extends CanonicalSam31ImageSupplyChainBuildAdmissionReadPort,
    CanonicalSam31ImageSupplyChainBuildStatePort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_REPOSITORY_VERSION
  readonly evidenceClass: 'create_only_exact_reread'
  persistAdmissionCreateOnly(input: {
    readonly admission: CanonicalSam31ImageSupplyChainBuildAdmission
  }): Promise<EvidenceRef>
  rereadSubmission(input: {
    readonly submissionRef: EvidenceRef
  }): Promise<CanonicalSam31ImageSupplyChainBuildSubmission | null>
  rereadTerminalObservationForSubmission(input: {
    readonly submissionRef: EvidenceRef
  }): Promise<CanonicalSam31ImageSupplyChainBuildObservation | null>
}

export function createCanonicalSam31ImageSupplyChainBuildRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31ImageSupplyChainBuildRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31ImageSupplyChainBuildRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_REPOSITORY_VERSION,
    evidenceClass: 'create_only_exact_reread',

    async persistAdmissionCreateOnly({ admission }) {
      const parsed = assertCanonicalSam31ImageSupplyChainBuildAdmission(
        admission,
      )
      const ref = imageSupplyChainBuildAdmissionReference(parsed)
      await persistExact(
        input.objectPort,
        recordPath(prefix, 'admissions', ref),
        parsed,
      )
      return ref
    },

    async rereadAdmission({ admissionRef }) {
      const ref = evidenceRefSchema.parse(admissionRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'admissions', ref),
        assertCanonicalSam31ImageSupplyChainBuildAdmission,
      )
      if (!value) return null
      if (!sameRef(ref, imageSupplyChainBuildAdmissionReference(value))) {
        throw conflict('sam3_1_supply_chain_admission_reread_ref_mismatch')
      }
      return value
    },

    async consumeAdmissionCreateOnly(value) {
      const payload = consumptionWithoutHashSchema.parse({
        schemaVersion:
          'canonical-sam3_1-image-supply-chain-build-consumption-v1',
        source:
          'canonical_server_sam3_1_image_supply_chain_build_repository',
        admissionRef: value.admissionRef,
        buildRequestHash: value.buildRequestHash,
        consumedAt: value.consumedAt,
        createOnly: true,
        automaticRetryAllowed: false,
        callerSelectedBuildAllowed: false,
        developerMachineModelInstallAllowed: false,
        customerCreditMutationAllowed: false,
        imageSupplyChainReleaseGranted: false,
        gpuRuntimeAuthorized: false,
      })
      const record = consumptionSchema.parse({
        ...payload,
        consumptionHash: sha256AuthorityValue(payload),
      })
      const body = recordBody(record)
      const path = recordPath(prefix, 'consumptions', payload.admissionRef)
      const result = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: sha256(body),
      })
      if (result === 'already_exists') return false
      const reread = await input.objectPort.readExact(path)
      if (!reread || !reread.equals(body)) {
        throw conflict('sam3_1_supply_chain_consumption_reread_mismatch')
      }
      return true
    },

    async persistSubmissionCreateOnly({ submission }) {
      const parsed = assertCanonicalSam31ImageSupplyChainBuildSubmission(
        submission,
      )
      await persistExact(
        input.objectPort,
        recordPath(
          prefix,
          'submissions',
          imageSupplyChainBuildSubmissionReference(parsed),
        ),
        parsed,
      )
      return true
    },

    async persistTerminalObservationCreateOnly({ observation }) {
      const parsed = assertCanonicalSam31ImageSupplyChainBuildObservation(
        observation,
      )
      const path = recordPath(
        prefix,
        'terminal-observations-by-submission',
        parsed.submissionRef,
      )
      const body = recordBody(parsed)
      const result = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: sha256(body),
      })
      if (result === 'already_exists') return false
      const reread = await input.objectPort.readExact(path)
      if (!reread || !reread.equals(body)) {
        throw conflict('sam3_1_supply_chain_terminal_reread_mismatch')
      }
      return true
    },

    async rereadSubmission({ submissionRef }) {
      const ref = evidenceRefSchema.parse(submissionRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'submissions', ref),
        assertCanonicalSam31ImageSupplyChainBuildSubmission,
      )
      if (!value) return null
      if (!sameRef(ref, imageSupplyChainBuildSubmissionReference(value))) {
        throw conflict('sam3_1_supply_chain_submission_reread_ref_mismatch')
      }
      return value
    },

    async rereadTerminalObservationForSubmission({
      submissionRef,
    }) {
      const parentRef = evidenceRefSchema.parse(submissionRef)
      const value = await readExact(
        input.objectPort,
        recordPath(
          prefix,
          'terminal-observations-by-submission',
          parentRef,
        ),
        assertCanonicalSam31ImageSupplyChainBuildObservation,
      )
      if (!value) return null
      if (!sameRef(parentRef, value.submissionRef)) {
        throw conflict('sam3_1_supply_chain_observation_reread_ref_mismatch')
      }
      return value
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31ImageSupplyChainBuildRuntime(input: {
  readonly repository: CanonicalSam31ImageSupplyChainBuildRepository
  readonly authenticatedTransport?: ReturnType<
    typeof createCanonicalSam31GoogleCloudBuildAuthenticatedTransport
  >
  readonly auth?: GoogleAuthRequest
  readonly requestTimeoutMilliseconds?: number
  readonly now?: () => string
}) {
  const transport = input.authenticatedTransport
    ?? createCanonicalSam31GoogleCloudBuildAuthenticatedTransport({
      auth: input.auth,
      requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
    })
  const service = createCanonicalSam31ImageSupplyChainBuildService({
    admissionReadPort: input.repository,
    statePort: input.repository,
    authenticatedTransport: transport,
    now: input.now,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_RUNTIME_VERSION,
    cloudSupplyChainBuildOnly: true as const,
    developerMachineModelCheckpointCudaOrGpuRuntimeInstallAllowed:
      false as const,
    persistAdmissionCreateOnly:
      input.repository.persistAdmissionCreateOnly.bind(input.repository),
    startOneSupplyChainBuild: service.startOneSupplyChainBuild,
    async observeOnePersistedSupplyChainBuild(request: {
      readonly admissionRef: EvidenceRef
      readonly submissionRef: EvidenceRef
    }) {
      const admission = await input.repository.rereadAdmission({
        admissionRef: request.admissionRef,
      })
      const submission = await input.repository.rereadSubmission({
        submissionRef: request.submissionRef,
      })
      if (!admission || !submission) {
        throw notReady('sam3_1_supply_chain_persisted_lineage_missing')
      }
      if (
        !sameRef(
          request.admissionRef,
          imageSupplyChainBuildAdmissionReference(admission),
        )
        || !sameRef(
          request.submissionRef,
          imageSupplyChainBuildSubmissionReference(submission),
        )
        || !sameRef(submission.admissionRef, request.admissionRef)
      ) throw conflict('sam3_1_supply_chain_persisted_lineage_mismatch')
      const existingTerminal = await input.repository
        .rereadTerminalObservationForSubmission({
          submissionRef: request.submissionRef,
        })
      if (existingTerminal) return existingTerminal
      const observation = await service.observeOneSupplyChainBuild({
        admission,
        submission,
      })
      if (!observation.durableTerminalObservationCreated) return observation
      const reread = await input.repository
        .rereadTerminalObservationForSubmission({
          submissionRef: request.submissionRef,
        })
      if (!reread || reread.observationHash !== observation.observationHash) {
        throw conflict('sam3_1_supply_chain_terminal_not_exactly_reread')
      }
      return reread
    },
  })
}

export function createCanonicalSam31GcpImageSupplyChainBuildRuntime(input: {
  readonly storage?: Storage
  readonly authenticatedTransport?: ReturnType<
    typeof createCanonicalSam31GoogleCloudBuildAuthenticatedTransport
  >
  readonly auth?: GoogleAuthRequest
  readonly requestTimeoutMilliseconds?: number
  readonly now?: () => string
} = {}) {
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage: input.storage ?? new Storage({ projectId: 'reeditpro' }),
    bucketName: CONTROL_PLANE_STATE_BUCKET,
  })
  const repository = createCanonicalSam31ImageSupplyChainBuildRepository({
    objectPort,
  })
  const runtime = createCanonicalSam31ImageSupplyChainBuildRuntime({
    repository,
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
    imageSupplyChainEvidenceBucketName: EVIDENCE_BUCKET,
    persistenceMode: 'private_gcs_create_only_exact_reread' as const,
    callerSelectedBucketAllowed: false as const,
  })
}

function recordBody(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 1 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw notReady('sam3_1_supply_chain_record_size_invalid')
  }
  return body
}

function recordPath(prefix: string, kind: string, ref: EvidenceRef): string {
  const idHash = createHash('sha256').update(ref.id, 'utf8').digest('hex')
  return `${prefix}/${kind}/${idHash}/${ref.contentHash.slice(7)}.json`
}

async function persistExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: T,
): Promise<void> {
  const body = recordBody(value)
  const result = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: sha256(body),
  })
  if (result === 'already_exists') {
    const existing = await port.readExact(path)
    if (!existing || !existing.equals(body)) {
      throw conflict('sam3_1_supply_chain_create_only_collision')
    }
  }
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw conflict('sam3_1_supply_chain_exact_reread_mismatch')
  }
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  assertValue: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 1 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('sam3_1_supply_chain_record_size_invalid')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('sam3_1_supply_chain_record_json_invalid')
  }
  return assertValue(value)
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw notReady('sam3_1_supply_chain_object_port_missing')
}

function sha256(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex')
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'SAM 3.1 image supply-chain state is not canonical.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'SAM 3.1 image supply-chain runtime is not ready.',
    503,
    { requiredGate },
  )
}
