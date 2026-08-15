import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission,
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal,
  createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildService,
  imageSupplyChainAdmissionRef,
  imageSupplyChainSubmissionRef,
  imageSupplyChainTerminalRef,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainStatePort,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainTransport,
} from './canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/image-supply-chain-build/v1'
const BUILD_COLLECTION_ENDPOINT =
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const
const BUILD_CREATE_ENDPOINT =
  `${BUILD_COLLECTION_ENDPOINT}?projectId=reeditpro` as const
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..') && !value.includes('://')),
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-consumption-v1',
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_repository',
  ),
  admissionRef: evidenceRefSchema,
  buildRequestHash: z.string().regex(/^[a-f0-9]{64}$/u),
  consumedAt: z.string().datetime({ offset: true }),
  createOnly: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  callerSelectedBuildAllowed: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionReady: z.literal(false),
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()

type EvidenceRef = z.infer<typeof evidenceRefSchema>
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildRepository
  extends CanonicalTrackAllSam31L4TaskQaImageSupplyChainStatePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_REPOSITORY_VERSION
  persistAdmissionCreateOnly(input: {
    readonly admission:
      CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
  }): Promise<EvidenceRef>
  rereadAdmission(input: { readonly admissionRef: EvidenceRef }):
    Promise<CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission | null>
  rereadSubmission(input: { readonly submissionRef: EvidenceRef }):
    Promise<CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission | null>
  rereadTerminalForSubmission(input: { readonly submissionRef: EvidenceRef }):
    Promise<CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal | null>
}

export function createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildRepository {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_BUILD_REPOSITORY_VERSION,
    async persistAdmissionCreateOnly({ admission }: {
      readonly admission:
        CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
    }) {
      const parsed =
        assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(
          admission,
        )
      const ref = imageSupplyChainAdmissionRef(parsed)
      await persistExact(input.objectPort, recordPath(prefix, 'admissions', ref), parsed)
      return ref
    },
    async rereadAdmission({ admissionRef }: {
      readonly admissionRef: EvidenceRef
    }) {
      const ref = evidenceRefSchema.parse(admissionRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'admissions', ref),
        assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
      )
      if (value && !sameRef(ref, imageSupplyChainAdmissionRef(value))) {
        throw new Error('track_all_l4_supply_chain_admission_reread_changed')
      }
      return value
    },
    async consumeAdmissionCreateOnly(value: {
      readonly admissionRef: EvidenceRef
      readonly buildRequestHash: string
      readonly consumedAt: string
    }) {
      const payload = consumptionWithoutHashSchema.parse({
        schemaVersion:
          'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-consumption-v1',
        source:
          'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_repository',
        admissionRef: value.admissionRef,
        buildRequestHash: value.buildRequestHash,
        consumedAt: value.consumedAt,
        createOnly: true,
        automaticRetryAllowed: false,
        callerSelectedBuildAllowed: false,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        productionReady: false,
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
        throw new Error('track_all_l4_supply_chain_consumption_reread_failed')
      }
      return true
    },
    async persistSubmissionCreateOnly({ submission }: {
      readonly submission:
        CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission
    }) {
      const parsed =
        assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission(
          submission,
        )
      await persistExact(
        input.objectPort,
        recordPath(prefix, 'submissions', imageSupplyChainSubmissionRef(parsed)),
        parsed,
      )
      return true
    },
    async rereadSubmission({ submissionRef }: {
      readonly submissionRef: EvidenceRef
    }) {
      const ref = evidenceRefSchema.parse(submissionRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'submissions', ref),
        assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission,
      )
      if (value && !sameRef(ref, imageSupplyChainSubmissionRef(value))) {
        throw new Error('track_all_l4_supply_chain_submission_reread_changed')
      }
      return value
    },
    async persistTerminalCreateOnly({ terminal }: {
      readonly terminal:
        CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal
    }) {
      const parsed =
        assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal(
          terminal,
        )
      const path = recordPath(
        prefix,
        'terminals-by-submission',
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
        throw new Error('track_all_l4_supply_chain_terminal_reread_failed')
      }
      return true
    },
    async rereadTerminalForSubmission({ submissionRef }: {
      readonly submissionRef: EvidenceRef
    }) {
      const ref = evidenceRefSchema.parse(submissionRef)
      const value = await readExact(
        input.objectPort,
        recordPath(prefix, 'terminals-by-submission', ref),
        assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal,
      )
      if (value && !sameRef(ref, value.submissionRef)) {
        throw new Error('track_all_l4_supply_chain_terminal_parent_changed')
      }
      return value
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaImageSupplyChainTransport(
  input: {
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
  } = {},
): CanonicalTrackAllSam31L4TaskQaImageSupplyChainTransport {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const timeout = input.requestTimeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('track_all_l4_supply_chain_timeout_invalid')
  }
  return Object.freeze({
    async request(request: {
      readonly method: 'GET' | 'POST'
      readonly url: string
      readonly body?: Readonly<Record<string, unknown>>
    }) {
      const validUrl = request.method === 'POST'
        ? request.url === BUILD_CREATE_ENDPOINT
        : request.url.startsWith(`${BUILD_COLLECTION_ENDPOINT}/`)
          && /^[a-f0-9-]{36}$/u.test(
            request.url.slice(BUILD_COLLECTION_ENDPOINT.length + 1),
          )
      if (!validUrl || (request.method === 'GET' && request.body)) {
        throw new Error('track_all_l4_supply_chain_url_not_allowlisted')
      }
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
      return { status: response.status, json: structuredClone(response.data) }
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainBuildRuntime(
  input: {
    readonly storage?: Storage
    readonly auth?: GoogleAuthRequest
    readonly transport?: CanonicalTrackAllSam31L4TaskQaImageSupplyChainTransport
    readonly now?: () => string
  } = {},
) {
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const repository =
    createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildRepository({
      objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
        storage,
        bucketName: CONTROL_PLANE_BUCKET,
      }),
    })
  const service =
    createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildService({
      readPort: repository,
      statePort: repository,
      transport: input.transport
        ?? createCanonicalTrackAllSam31L4TaskQaImageSupplyChainTransport({
          auth: input.auth,
        }),
      now: input.now,
    })
  return Object.freeze({
    repository,
    persistAdmissionCreateOnly:
      repository.persistAdmissionCreateOnly.bind(repository),
    start: service.start,
    async observe(inputValue: { readonly submissionRef: EvidenceRef }) {
      const submissionRef = evidenceRefSchema.parse(inputValue.submissionRef)
      const submission = await repository.rereadSubmission({ submissionRef })
      if (!submission) {
        throw new Error('track_all_l4_supply_chain_submission_missing')
      }
      const admission = await repository.rereadAdmission({
        admissionRef: submission.admissionRef,
      })
      if (!admission) {
        throw new Error('track_all_l4_supply_chain_admission_missing')
      }
      const existing = await repository.rereadTerminalForSubmission({
        submissionRef,
      })
      if (existing) return existing
      const terminal = await service.observe({ admission, submission })
      if (!terminal.durableTerminalCreated) return terminal
      const reread = await repository.rereadTerminalForSubmission({
        submissionRef,
      })
      if (!reread || !sameRef(
        imageSupplyChainTerminalRef(reread),
        imageSupplyChainTerminalRef(terminal),
      )) throw new Error('track_all_l4_supply_chain_terminal_not_reread')
      return reread
    },
    projectId: PROJECT_ID,
    controlPlaneBucket: CONTROL_PLANE_BUCKET,
    runtimeReleaseGranted: false as const,
    gpuJobDispatched: false as const,
    customerCreditsMutated: false as const,
    productionReady: false as const,
  })
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
): Promise<void> {
  const body = recordBody(value)
  await port.createOnly({
    objectPath: path,
    body,
    contentSha256: sha256(body),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('track_all_l4_supply_chain_exact_reread_failed')
  }
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 1 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('track_all_l4_supply_chain_record_size_invalid')
  }
  return parse(JSON.parse(body.toString('utf8')))
}

function recordPath(
  prefix: string,
  kind: string,
  ref: EvidenceRef,
): string {
  const idHash = createHash('sha256').update(ref.id, 'utf8').digest('hex')
  return `${prefix}/${kind}/${idHash}/${ref.contentHash.slice(7)}.json`
}

function recordBody(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 1 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('track_all_l4_supply_chain_record_size_invalid')
  }
  return body
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
