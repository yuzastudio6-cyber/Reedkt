import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31VertexServingReconciledWindowCostReceipt,
  type CanonicalSam31VertexServingReconciledWindowCostReceipt,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-reconciled-window-cost'

export const CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_COST_REPOSITORY_VERSION =
  'canonical-sam3_1-vertex-serving-reconciled-window-cost-repository-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/reconciled-serving-costs'
const MAXIMUM_BYTES = 8 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type ReceiptRef = z.infer<typeof refSchema>

export interface CanonicalSam31VertexServingReconciledWindowCostRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_COST_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly receipt: CanonicalSam31VertexServingReconciledWindowCostReceipt
  }): Promise<'created' | 'identical_replay'>
  rereadExact(input: {
    readonly receiptRef: ReceiptRef
  }): Promise<CanonicalSam31VertexServingReconciledWindowCostReceipt | null>
  rereadServingWindowCostReceipt(input: {
    readonly receiptId: string
  }): Promise<CanonicalSam31VertexServingReconciledWindowCostReceipt | null>
}

export function canonicalSam31VertexServingReconciledWindowCostReceiptRef(
  value: unknown,
): ReceiptRef {
  const receipt =
    assertCanonicalSam31VertexServingReconciledWindowCostReceipt(value)
  return Object.freeze({
    id: receipt.receiptId,
    version: 1,
    contentHash: `sha256:${receipt.receiptHash}`,
  })
}

export function createCanonicalSam31VertexServingReconciledWindowCostRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31VertexServingReconciledWindowCostRepository {
  if (!input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new TypeError('SAM 3.1 reconciled cost object port is unavailable.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31VertexServingReconciledWindowCostRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_COST_REPOSITORY_VERSION,
    async persistCreateOnly({ receipt }) {
      const parsed =
        assertCanonicalSam31VertexServingReconciledWindowCostReceipt(receipt)
      const body = Buffer.from(stableAuthorityStringify(parsed), 'utf8')
      if (body.byteLength > MAXIMUM_BYTES) {
        throw new TypeError('SAM 3.1 reconciled cost receipt is too large.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: path(prefix, parsed.receiptId),
        body,
        contentSha256: bytesSha256(body),
      })
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadExact({ receiptRef }) {
      const expected = refSchema.parse(receiptRef)
      const receipt = await read(input.objectPort, path(prefix, expected.id))
      if (receipt && stableAuthorityStringify(
        canonicalSam31VertexServingReconciledWindowCostReceiptRef(receipt),
      ) !== stableAuthorityStringify(expected)) {
        throw new TypeError('SAM 3.1 reconciled cost receipt ref changed.')
      }
      return receipt
    },
    rereadServingWindowCostReceipt({ receiptId }) {
      return read(input.objectPort, path(prefix, safeId.parse(receiptId)))
    },
  }
  return Object.freeze(repository)
}

async function read(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<CanonicalSam31VertexServingReconciledWindowCostReceipt | null> {
  const body = await objectPort.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_BYTES) {
    throw new TypeError('SAM 3.1 reconciled cost receipt bytes are invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new TypeError('SAM 3.1 reconciled cost receipt JSON is invalid.')
  }
  assertPlainSerializedData(value, 'sam31_reconciled_cost_repository_read')
  const receipt =
    assertCanonicalSam31VertexServingReconciledWindowCostReceipt(value)
  return structuredClone(receipt)
}

function path(prefix: string, receiptId: string): string {
  return `${prefix}/${encodeURIComponent(receiptId)}.json`
}

function bytesSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
