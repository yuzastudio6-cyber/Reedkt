import { Storage } from '@google-cloud/storage'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import type {
  VisualIntelligenceConcurrencyPort,
} from './visual-intelligence-lifecycle-service'

export const VISUAL_INTELLIGENCE_GCS_CONCURRENCY_PORT_VERSION =
  'visual-intelligence-gcs-concurrency-port-v1' as const

const DEFAULT_PREFIX = 'private/visual-intelligence/v1/concurrency'
const DEFAULT_LEASE_TTL_MS = 20 * 60 * 1_000
const MAX_LEASE_TTL_MS = 30 * 60 * 1_000
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const GCS_BUCKET = /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u

interface LeaseRecord {
  readonly schemaVersion: 'visual-intelligence-provider-concurrency-lease-v1'
  readonly workspaceId: string
  readonly projectId: string
  readonly requestId: string
  readonly slot: number
  readonly acquiredAtEpochMs: number
  readonly expiresAtEpochMs: number
  readonly leaseNonceSha256: string
}

interface ActiveLease {
  readonly objectPath: string
  readonly generation: string
  readonly record: LeaseRecord
}

export function createVisualIntelligenceGcsConcurrencyPort(input: {
  readonly projectId: string
  readonly bucketName: string
  readonly storage?: Storage
  readonly prefix?: string
  readonly leaseTtlMs?: number
  readonly now?: () => number
}): VisualIntelligenceConcurrencyPort {
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const leaseTtlMs = input.leaseTtlMs ?? DEFAULT_LEASE_TTL_MS
  if (
    !SAFE_ID.test(input.projectId)
    || !GCS_BUCKET.test(input.bucketName)
    || !Number.isSafeInteger(leaseTtlMs)
    || leaseTtlMs < 60_000
    || leaseTtlMs > MAX_LEASE_TTL_MS
  ) throw notReady('visual_intelligence_concurrency_configuration_invalid')
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const bucket = storage.bucket(input.bucketName)
  const now = input.now ?? Date.now
  const active = new Map<string, ActiveLease>()

  const port: VisualIntelligenceConcurrencyPort = {
    async acquire(request) {
      validateAcquire(request)
      const workspaceHash = visualIntelligenceDigest({
        workspaceId: request.workspaceId,
      }).slice('sha256:'.length)
      for (
        let slot = 1;
        slot <= request.maximumConcurrentProviderCalls;
        slot += 1
      ) {
        const acquiredAtEpochMs = now()
        const record: LeaseRecord = {
          schemaVersion:
            'visual-intelligence-provider-concurrency-lease-v1',
          workspaceId: request.workspaceId,
          projectId: request.projectId,
          requestId: request.requestId,
          slot,
          acquiredAtEpochMs,
          expiresAtEpochMs: acquiredAtEpochMs + leaseTtlMs,
          leaseNonceSha256: visualIntelligenceDigest({
            ...request,
            slot,
            acquiredAtEpochMs,
          }),
        }
        const objectPath = `${prefix}/${workspaceHash}/slot-${slot}.json`
        const created = await createLease({
          bucket,
          objectPath,
          record,
          now,
        })
        if (!created) continue
        const leaseRef = createVisualIntelligenceEvidenceRef(
          `vi-lease-${workspaceHash.slice(0, 32)}-${slot}`,
          {
            record,
            generation: created.generation,
            objectIdentitySha256: visualIntelligenceDigest(objectPath),
          },
        )
        active.set(refKey(leaseRef), {
          objectPath,
          generation: created.generation,
          record,
        })
        return { status: 'acquired', leaseRef }
      }
      return { status: 'capacity_exhausted' }
    },

    async release(untrustedRef) {
      const leaseRef = requireRef(untrustedRef)
      const lease = active.get(refKey(leaseRef))
      if (!lease) throw notReady('visual_intelligence_concurrency_lease_unknown')
      const file = bucket.file(lease.objectPath, {
        generation: lease.generation,
      })
      try {
        const [body] = await file.download({ validation: 'crc32c' })
        if (body.toString('utf8') !== visualIntelligenceCanonicalJson(lease.record)) {
          throw conflict('visual_intelligence_concurrency_release_mismatch')
        }
        await file.delete({
          ifGenerationMatch: lease.generation,
        })
      } catch (error) {
        if (cloudErrorCode(error) !== 404) throw error
      } finally {
        active.delete(refKey(leaseRef))
      }
    },
  }
  return Object.freeze(port)
}

async function createLease(input: {
  bucket: ReturnType<Storage['bucket']>
  objectPath: string
  record: LeaseRecord
  now: () => number
}): Promise<{ generation: string } | null> {
  const file = input.bucket.file(input.objectPath)
  try {
    await file.save(
      Buffer.from(visualIntelligenceCanonicalJson(input.record), 'utf8'),
      {
        contentType: 'application/json',
        resumable: false,
        preconditionOpts: { ifGenerationMatch: 0 },
      },
    )
    return await verifyLease(file, input.record)
  } catch (error) {
    if (cloudErrorCode(error) !== 412) throw error
  }

  const current = await readLease(input.bucket, input.objectPath)
  if (!current || current.record.expiresAtEpochMs > input.now()) return null
  try {
    await input.bucket.file(input.objectPath, {
      generation: current.generation,
    }).delete({
      ifGenerationMatch: current.generation,
    })
  } catch (error) {
    if (cloudErrorCode(error) !== 404 && cloudErrorCode(error) !== 412) {
      throw error
    }
    return null
  }
  return createLease(input)
}

async function verifyLease(
  file: ReturnType<ReturnType<Storage['bucket']>['file']>,
  expected: LeaseRecord,
): Promise<{ generation: string }> {
  const [metadata] = await file.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const size = Number(metadata.size ?? -1)
  if (
    !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || !Number.isSafeInteger(size)
    || size < 2
    || size > 16_384
    || metadata.contentType !== 'application/json'
  ) throw conflict('visual_intelligence_concurrency_lease_metadata_invalid')
  const exact = file.bucket.file(file.name, { generation })
  const [body] = await exact.download({ validation: 'crc32c' })
  const [stable] = await exact.getMetadata()
  if (
    body.byteLength !== size
    || String(stable.generation ?? '') !== generation
    || String(stable.etag ?? '') !== etag
    || body.toString('utf8') !== visualIntelligenceCanonicalJson(expected)
  ) throw conflict('visual_intelligence_concurrency_lease_reread_invalid')
  return { generation }
}

async function readLease(
  bucket: ReturnType<Storage['bucket']>,
  objectPath: string,
): Promise<{ generation: string; record: LeaseRecord } | null> {
  const file = bucket.file(objectPath)
  let metadata: Record<string, unknown>
  try {
    const [raw] = await file.getMetadata()
    metadata = raw as unknown as Record<string, unknown>
  } catch (error) {
    if (cloudErrorCode(error) === 404) return null
    throw error
  }
  const generation = String(metadata.generation ?? '')
  if (!/^[1-9][0-9]{0,30}$/u.test(generation)) {
    throw conflict('visual_intelligence_concurrency_generation_invalid')
  }
  const exact = bucket.file(objectPath, { generation })
  const [body] = await exact.download({ validation: 'crc32c' })
  return { generation, record: parseLease(JSON.parse(body.toString('utf8'))) }
}

function parseLease(value: unknown): LeaseRecord {
  if (!isPlainRecord(value)) {
    throw conflict('visual_intelligence_concurrency_lease_invalid')
  }
  const keys = [
    'schemaVersion', 'workspaceId', 'projectId', 'requestId', 'slot',
    'acquiredAtEpochMs', 'expiresAtEpochMs', 'leaseNonceSha256',
  ]
  if (
    Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || value.schemaVersion !==
      'visual-intelligence-provider-concurrency-lease-v1'
    || !safeId(value.workspaceId)
    || !safeId(value.projectId)
    || !safeId(value.requestId)
    || !Number.isSafeInteger(value.slot)
    || Number(value.slot) < 1
    || !Number.isSafeInteger(value.acquiredAtEpochMs)
    || !Number.isSafeInteger(value.expiresAtEpochMs)
    || Number(value.expiresAtEpochMs) <= Number(value.acquiredAtEpochMs)
    || typeof value.leaseNonceSha256 !== 'string'
    || !/^sha256:[a-f0-9]{64}$/u.test(value.leaseNonceSha256)
  ) throw conflict('visual_intelligence_concurrency_lease_invalid')
  return value as unknown as LeaseRecord
}

function validateAcquire(value: {
  workspaceId: string
  projectId: string
  requestId: string
  maximumConcurrentProviderCalls: number
}): void {
  if (
    !safeId(value.workspaceId)
    || !safeId(value.projectId)
    || !safeId(value.requestId)
    || !Number.isSafeInteger(value.maximumConcurrentProviderCalls)
    || value.maximumConcurrentProviderCalls < 1
    || value.maximumConcurrentProviderCalls > 16
  ) throw notReady('visual_intelligence_concurrency_request_invalid')
}

function requireRef(value: unknown): VisualIntelligenceEvidenceRef {
  if (
    !isPlainRecord(value)
    || Reflect.ownKeys(value).length !== 3
    || !safeId(value.id)
    || !Number.isSafeInteger(value.version)
    || Number(value.version) < 1
    || typeof value.contentHash !== 'string'
    || !/^sha256:[a-f0-9]{64}$/u.test(value.contentHash)
  ) throw conflict('visual_intelligence_concurrency_ref_invalid')
  return {
    id: value.id,
    version: Number(value.version),
    contentHash: value.contentHash,
  }
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !safeId(part))
  ) throw notReady('visual_intelligence_concurrency_prefix_invalid')
  return normalized
}

function safeId(value: unknown): value is string {
  return typeof value === 'string'
    && SAFE_ID.test(value)
    && !value.includes('..')
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'number' ? code : Number(code)
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Visual Intelligence provider concurrency is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Visual Intelligence provider concurrency evidence conflicted.',
    409,
    { requiredGate },
  )
}
