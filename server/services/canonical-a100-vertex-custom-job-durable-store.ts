import { createHash } from 'node:crypto'

import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalA100VertexCustomJobConsumption,
  assertCanonicalA100VertexCustomJobExecutionRecord,
  type CanonicalA100VertexCustomJobConsumption,
  type CanonicalA100VertexCustomJobConsumptionPort,
  type CanonicalA100VertexCustomJobExecutionRecord,
  type CanonicalA100VertexCustomJobExecutionRepository,
} from './canonical-a100-vertex-custom-job-launch-port'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_A100_VERTEX_CUSTOM_JOB_DURABLE_STORE_VERSION =
  'canonical-a100-vertex-custom-job-durable-store-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v2/vertex-a100-launch'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024

export function createCanonicalA100VertexCustomJobDurableStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalA100VertexCustomJobConsumptionPort
  & CanonicalA100VertexCustomJobExecutionRepository
  & { readonly schemaVersion:
    typeof CANONICAL_A100_VERTEX_CUSTOM_JOB_DURABLE_STORE_VERSION } {
  if (!input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new Error('Vertex A100 durable store object port is unavailable.')
  }
  const prefix = safePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_DURABLE_STORE_VERSION,
    async consumeCreateOnlyAndReread(
      value: CanonicalA100VertexCustomJobConsumption,
    ) {
      const parsed = assertCanonicalA100VertexCustomJobConsumption(value)
      return persistAndReread({
        objectPort: input.objectPort,
        objectPath: `${prefix}/consumptions/${parsed.consumptionHash}.json`,
        value: parsed,
        parse: assertCanonicalA100VertexCustomJobConsumption,
      })
    },
    async createOnlyAndReread(
      value: CanonicalA100VertexCustomJobExecutionRecord,
    ) {
      const parsed = assertCanonicalA100VertexCustomJobExecutionRecord(value)
      return persistAndReread({
        objectPort: input.objectPort,
        objectPath:
          `${prefix}/executions/${parsed.executionRecordHash}.json`,
        value: parsed,
        parse: assertCanonicalA100VertexCustomJobExecutionRecord,
      })
    },
  })
}

async function persistAndReread<T>(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly objectPath: string
  readonly value: T
  readonly parse: (value: unknown) => T
}): Promise<T> {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Vertex A100 durable record size is invalid.')
  }
  await input.objectPort.createOnly({
    objectPath: input.objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await input.objectPort.readExact(input.objectPath)
  if (!reread || !Buffer.isBuffer(reread)
    || !reread.equals(body)) {
    throw new Error('Vertex A100 durable record reread changed.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(reread.toString('utf8'))
  } catch {
    throw new Error('Vertex A100 durable record is not JSON.')
  }
  assertPlainSerializedData(decoded, 'vertex_a100_durable_record')
  return input.parse(decoded)
}

function safePrefix(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,510}[A-Za-z0-9]$/u.test(value)
    || value.includes('..') || value.includes('//')) {
    throw new Error('Vertex A100 durable store prefix is invalid.')
  }
  return value
}
