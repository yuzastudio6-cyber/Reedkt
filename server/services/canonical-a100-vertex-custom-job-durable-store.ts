import { createHash } from 'node:crypto'

import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalA100VertexCustomJobLaunchAuthority,
  assertCanonicalA100VertexCustomJobRelease,
  assertCanonicalA100VertexCustomJobConsumption,
  assertCanonicalA100VertexCustomJobExecutionRecord,
  type CanonicalA100VertexCustomJobLaunchAuthority,
  type CanonicalA100VertexCustomJobLaunchContextRepository,
  type CanonicalA100VertexCustomJobRelease,
  type CanonicalA100VertexCustomJobConsumption,
  type CanonicalA100VertexCustomJobConsumptionPort,
  type CanonicalA100VertexCustomJobExecutionRecord,
  type CanonicalA100VertexCustomJobExecutionRepository,
} from './canonical-a100-vertex-custom-job-launch-port'
import type {
  CanonicalA100VertexCustomJobExecutionReadRepository,
} from './canonical-a100-vertex-custom-job-terminal-port'
import {
  createCanonicalA100VertexTerminalCostContext,
  type CanonicalA100VertexTerminalCostContextReadPort,
} from './canonical-a100-vertex-terminal-cost-evidence-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_A100_VERTEX_CUSTOM_JOB_DURABLE_STORE_VERSION =
  'canonical-a100-vertex-custom-job-durable-store-v1' as const

export interface CanonicalA100VertexLaunchContextReadPort {
  rereadLaunchAuthority(input: {
    readonly authorityRef: {
      readonly id: string
      readonly version: number
      readonly contentHash: string
    }
  }): Promise<CanonicalA100VertexCustomJobLaunchAuthority>
  rereadLaunchRelease(input: {
    readonly releaseRef: {
      readonly id: string
      readonly version: number
      readonly contentHash: string
    }
  }): Promise<CanonicalA100VertexCustomJobRelease>
}

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v2/vertex-a100-launch'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024

export function createCanonicalA100VertexCustomJobDurableStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalA100VertexCustomJobConsumptionPort
  & CanonicalA100VertexCustomJobLaunchContextRepository
  & CanonicalA100VertexCustomJobExecutionRepository
  & CanonicalA100VertexCustomJobExecutionReadRepository
  & CanonicalA100VertexTerminalCostContextReadPort
  & CanonicalA100VertexLaunchContextReadPort
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
    async persistLaunchContextCreateOnlyAndReread(value: {
      readonly authority: CanonicalA100VertexCustomJobLaunchAuthority
      readonly release: CanonicalA100VertexCustomJobRelease
    }) {
      const authority = assertCanonicalA100VertexCustomJobLaunchAuthority(
        value.authority,
      )
      const release = assertCanonicalA100VertexCustomJobRelease(value.release)
      if (!sameRef(authority.releaseRef, release.releaseRef)) {
        throw new Error('Vertex A100 launch context release differs.')
      }
      const rereadRelease = await persistAndReread({
        objectPort: input.objectPort,
        objectPath:
          `${prefix}/releases/${hashFromRef(release.releaseRef)}.json`,
        value: release,
        parse: assertCanonicalA100VertexCustomJobRelease,
      })
      const rereadAuthority = await persistAndReread({
        objectPort: input.objectPort,
        objectPath: `${prefix}/authorities/${authority.authorityHash}.json`,
        value: authority,
        parse: assertCanonicalA100VertexCustomJobLaunchAuthority,
      })
      return Object.freeze({
        authority: rereadAuthority,
        release: rereadRelease,
      })
    },
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
    async rereadExecution(request: Parameters<
      CanonicalA100VertexCustomJobExecutionReadRepository['rereadExecution']
    >[0]) {
      const hash = hashFromRef(request.executionRef)
      const execution = await readAndParse({
        objectPort: input.objectPort,
        objectPath: `${prefix}/executions/${hash}.json`,
        parse: assertCanonicalA100VertexCustomJobExecutionRecord,
      })
      if (!sameRef(request.executionRef, {
        id: execution.executionRecordId,
        version: 1,
        contentHash: `sha256:${execution.executionRecordHash}`,
      })) throw new Error('Vertex A100 execution ref differs.')
      return execution
    },
    async rereadLaunchAuthority(request: Parameters<
      CanonicalA100VertexLaunchContextReadPort['rereadLaunchAuthority']
    >[0]) {
      const authority = await readAndParse({
        objectPort: input.objectPort,
        objectPath:
          `${prefix}/authorities/${hashFromRef(request.authorityRef)}.json`,
        parse: assertCanonicalA100VertexCustomJobLaunchAuthority,
      })
      if (!sameRef(request.authorityRef, {
        id: authority.authorityId,
        version: 1,
        contentHash: `sha256:${authority.authorityHash}`,
      })) throw new Error('Vertex A100 durable authority ref differs.')
      return authority
    },
    async rereadLaunchRelease(request: Parameters<
      CanonicalA100VertexLaunchContextReadPort['rereadLaunchRelease']
    >[0]) {
      const release = await readAndParse({
        objectPort: input.objectPort,
        objectPath:
          `${prefix}/releases/${hashFromRef(request.releaseRef)}.json`,
        parse: assertCanonicalA100VertexCustomJobRelease,
      })
      if (!sameRef(request.releaseRef, release.releaseRef)) {
        throw new Error('Vertex A100 durable release ref differs.')
      }
      return release
    },
    async rereadPrivateTerminalCostContext(request: Parameters<
      CanonicalA100VertexTerminalCostContextReadPort[
        'rereadPrivateTerminalCostContext'
      ]
    >[0]) {
      const execution = assertCanonicalA100VertexCustomJobExecutionRecord(
        request.execution,
      )
      if (!sameRef(request.executionRef, {
        id: execution.executionRecordId,
        version: 1,
        contentHash: `sha256:${execution.executionRecordHash}`,
      })) throw new Error('Vertex A100 terminal execution ref differs.')
      const authority = await readAndParse({
        objectPort: input.objectPort,
        objectPath:
          `${prefix}/authorities/${hashFromRef(execution.authorityRef)}.json`,
        parse: assertCanonicalA100VertexCustomJobLaunchAuthority,
      })
      const release = await readAndParse({
        objectPort: input.objectPort,
        objectPath:
          `${prefix}/releases/${hashFromRef(execution.releaseRef)}.json`,
        parse: assertCanonicalA100VertexCustomJobRelease,
      })
      if (!sameRef(execution.authorityRef, {
        id: authority.authorityId,
        version: 1,
        contentHash: `sha256:${authority.authorityHash}`,
      }) || !sameRef(execution.releaseRef, release.releaseRef)) {
        throw new Error('Vertex A100 terminal launch context differs.')
      }
      return createCanonicalA100VertexTerminalCostContext({
        execution,
        authority,
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

async function readAndParse<T>(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly objectPath: string
  readonly parse: (value: unknown) => T
}): Promise<T> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (!body || !Buffer.isBuffer(body)
    || body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Vertex A100 durable record is unavailable.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('Vertex A100 durable record is not JSON.')
  }
  assertPlainSerializedData(decoded, 'vertex_a100_durable_record')
  return input.parse(decoded)
}

function hashFromRef(value: {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value.id)
    || !Number.isSafeInteger(value.version) || value.version < 1
    || !/^sha256:[a-f0-9]{64}$/u.test(value.contentHash)) {
    throw new Error('Vertex A100 durable evidence ref is invalid.')
  }
  return value.contentHash.slice(7)
}

function sameRef(
  left: { readonly id: string; readonly version: number;
    readonly contentHash: string },
  right: { readonly id: string; readonly version: number;
    readonly contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function safePrefix(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,510}[A-Za-z0-9]$/u.test(value)
    || value.includes('..') || value.includes('//')) {
    throw new Error('Vertex A100 durable store prefix is invalid.')
  }
  return value
}
