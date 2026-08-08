import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest,
  type CanonicalSam31VertexSourceCheckpointWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  assertCanonicalSam31VertexQualificationAdmission,
  assertCanonicalSam31VertexQualificationConsumption,
  assertCanonicalSam31VertexQualificationExecution,
  type CanonicalSam31VertexQualificationAdmissionRepository,
  type CanonicalSam31VertexQualificationConsumptionPort,
  type CanonicalSam31VertexQualificationExecutionRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  canonicalSam31VertexQualificationCostReceiptSchema,
  canonicalSam31VertexQualificationProviderUsageSchema,
  type CanonicalSam31VertexQualificationCostReceipt,
  type CanonicalSam31VertexQualificationCostReceiptStore,
  type CanonicalSam31VertexQualificationProviderUsage,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-terminal-reconciliation'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RUNTIME_REPOSITORY_VERSION =
  'canonical-sam3_1-vertex-qualification-runtime-repository-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/source-checkpoint-qualification/v2/runtime'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export interface CanonicalSam31VertexQualificationWorkerRequestRepository {
  persistCreateOnly(
    value: CanonicalSam31VertexSourceCheckpointWorkerRequest,
  ): Promise<z.infer<typeof evidenceRefSchema>>
  rereadExact(
    requestRef: z.infer<typeof evidenceRefSchema>,
  ): Promise<CanonicalSam31VertexSourceCheckpointWorkerRequest | null>
}

export interface CanonicalSam31VertexQualificationProviderUsageStore {
  createOnlyAndReread(
    value: CanonicalSam31VertexQualificationProviderUsage,
  ): Promise<unknown>
}

export interface CanonicalSam31VertexQualificationRuntimeRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RUNTIME_REPOSITORY_VERSION
  readonly workerRequests:
    CanonicalSam31VertexQualificationWorkerRequestRepository
  readonly admissions: CanonicalSam31VertexQualificationAdmissionRepository
  readonly consumptions: CanonicalSam31VertexQualificationConsumptionPort
  readonly executions: CanonicalSam31VertexQualificationExecutionRepository
  readonly providerUsage: CanonicalSam31VertexQualificationProviderUsageStore
  readonly costs: CanonicalSam31VertexQualificationCostReceiptStore
}

/** Create-only metadata storage. No checkpoint, media, URL, or secret bytes. */
export function createCanonicalSam31VertexQualificationRuntimeRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31VertexQualificationRuntimeRepository {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw new Error('Vertex qualification runtime repository is absent.')
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const workerRequests: CanonicalSam31VertexQualificationWorkerRequestRepository = {
    async persistCreateOnly(value) {
      const request = assertCanonicalSam31VertexSourceCheckpointWorkerRequest(
        value,
      )
      const reference = ref(request.qualificationId, request.requestHash, 2)
      await persist(input.objectPort, path(prefix, 'requests', reference), request)
      const reread = await read(input.objectPort,
        path(prefix, 'requests', reference),
        assertCanonicalSam31VertexSourceCheckpointWorkerRequest)
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(request)) {
        throw new Error('Vertex worker request reread changed.')
      }
      return reference
    },
    async rereadExact(value) {
      const reference = evidenceRefSchema.parse(value)
      if (reference.version !== 2) {
        throw new Error('Vertex worker request reference version changed.')
      }
      const request = await read(input.objectPort,
        path(prefix, 'requests', reference),
        assertCanonicalSam31VertexSourceCheckpointWorkerRequest)
      if (!request) return null
      if (!sameRef(reference, ref(
        request.qualificationId,
        request.requestHash,
        2,
      ))) throw new Error('Vertex worker request reference changed.')
      return structuredClone(request)
    },
  }
  const admissions: CanonicalSam31VertexQualificationAdmissionRepository = {
    async createOnlyAndReread(value) {
      return persistAndReread({
        port: input.objectPort,
        objectPath: path(prefix, 'admissions', ref(
          value.attemptId,
          value.admissionHash,
        )),
        value,
        parse: assertCanonicalSam31VertexQualificationAdmission,
      })
    },
    async reread(reference) {
      return read(
        input.objectPort,
        path(prefix, 'admissions', evidenceRefSchema.parse(reference)),
        assertCanonicalSam31VertexQualificationAdmission,
      )
    },
  }
  const consumptions: CanonicalSam31VertexQualificationConsumptionPort = {
    async createOnly(value) {
      const reference = ref(
        `sam31-vertex-consumption-${value.consumptionHash.slice(0, 24)}`,
        value.consumptionHash,
      )
      const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
      return input.objectPort.createOnly({
        objectPath: path(prefix, 'consumptions', reference),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
    },
    async reread(reference) {
      return read(
        input.objectPort,
        path(prefix, 'consumptions', evidenceRefSchema.parse(reference)),
        assertCanonicalSam31VertexQualificationConsumption,
      )
    },
  }
  const executions: CanonicalSam31VertexQualificationExecutionRepository = {
    async createOnlyAndReread(value) {
      const persisted = await persistAndReread({
        port: input.objectPort,
        objectPath: path(prefix, 'executions', ref(
          value.executionId,
          value.executionHash,
          2,
        )),
        value,
        parse: assertCanonicalSam31VertexQualificationExecution,
      })
      await persistAndReread({
        port: input.objectPort,
        objectPath: path(prefix, 'executions-by-admission',
          value.admissionRef),
        value,
        parse: assertCanonicalSam31VertexQualificationExecution,
      })
      return persisted
    },
    async reread(reference) {
      return read(
        input.objectPort,
        path(prefix, 'executions', evidenceRefSchema.parse(reference)),
        assertCanonicalSam31VertexQualificationExecution,
      )
    },
    async rereadByAdmission(reference) {
      return read(
        input.objectPort,
        path(prefix, 'executions-by-admission',
          evidenceRefSchema.parse(reference)),
        assertCanonicalSam31VertexQualificationExecution,
      )
    },
  }
  const providerUsage: CanonicalSam31VertexQualificationProviderUsageStore = {
    async createOnlyAndReread(value) {
      const parsed = assertProviderUsage(value)
      return persistAndReread({
        port: input.objectPort,
        objectPath: path(prefix, 'provider-usage', ref(
          `sam31-vertex-provider-usage-${parsed.evidenceHash.slice(0, 32)}`,
          parsed.evidenceHash,
        )),
        value: parsed,
        parse: assertProviderUsage,
      })
    },
  }
  const costs: CanonicalSam31VertexQualificationCostReceiptStore = {
    async createOnlyAndReread(value) {
      const parsed = assertCost(value)
      return persistAndReread({
        port: input.objectPort,
        objectPath: path(prefix, 'costs', ref(
          parsed.receiptId,
          parsed.receiptHash,
        )),
        value: parsed,
        parse: assertCost,
      })
    },
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RUNTIME_REPOSITORY_VERSION,
    workerRequests: Object.freeze(workerRequests),
    admissions: Object.freeze(admissions),
    consumptions: Object.freeze(consumptions),
    executions: Object.freeze(executions),
    providerUsage: Object.freeze(providerUsage),
    costs: Object.freeze(costs),
  })
}

function assertProviderUsage(value: unknown) {
  assertPlainSerializedData(value, 'sam31_vertex_provider_usage_record')
  const parsed = canonicalSam31VertexQualificationProviderUsageSchema
    .parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex provider usage record digest changed.')
  }
  return parsed
}

function assertCost(value: unknown): CanonicalSam31VertexQualificationCostReceipt {
  assertPlainSerializedData(value, 'sam31_vertex_cost_record')
  const parsed = canonicalSam31VertexQualificationCostReceiptSchema.parse(value)
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex cost record digest changed.')
  }
  return parsed
}

async function persistAndReread<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  value: T
  parse(value: unknown): T
}): Promise<T> {
  await persist(input.port, input.objectPath, input.value)
  const reread = await read(input.port, input.objectPath, input.parse)
  if (!reread || stableAuthorityStringify(reread) !==
    stableAuthorityStringify(input.value)) {
    throw new Error('Vertex qualification create-only reread changed.')
  }
  return structuredClone(reread)
}

async function persist(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
) {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  await port.createOnly({
    objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
}

async function read<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  let value: unknown
  try { value = JSON.parse(body.toString('utf8')) } catch {
    throw new Error('Vertex qualification repository JSON is invalid.')
  }
  const parsed = parse(value)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new Error('Vertex qualification repository bytes changed.')
  }
  return parsed
}

function path(
  prefix: string,
  kind: string,
  reference: z.infer<typeof evidenceRefSchema>,
) {
  const digest = createHash('sha256')
    .update(stableAuthorityStringify(reference), 'utf8').digest('hex')
  return `${prefix}/${kind}/${digest}.json`
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
