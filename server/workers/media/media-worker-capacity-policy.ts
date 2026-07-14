import { statfs } from 'node:fs/promises'
import path from 'node:path'

const GIB = 1024 ** 3

export const REEDITPRO_LARGE_MEDIA_WORKER_CAPACITY_POLICY = {
  id: 'large_media_worker_capacity_v1',
  fullSourceStageCopies: 1,
  minimumSafetyReserveBytes: 8 * GIB,
  proportionalSafetyReserve: 0.1,
} as const

export type MediaWorkerCapacityStatus = 'admitted' | 'insufficient' | 'unavailable'

export interface LargeMediaWorkerCapacityAssessment {
  policyId: typeof REEDITPRO_LARGE_MEDIA_WORKER_CAPACITY_POLICY.id
  status: MediaWorkerCapacityStatus
  expectedSourceBytes: number
  sourceStagingBytes: number
  safetyReserveBytes: number
  requiredAvailableBytes: number
  availableBytes?: number
  shortfallBytes?: number
  byteTraversalAuthorized: boolean
}

export interface LargeMediaWorkerCapacityReservation {
  acquired: boolean
  availableAfterExistingReservationsBytes?: number
  release: () => void
}

const activeReservations = new Map<string, Map<symbol, number>>()

export function clearLargeMediaWorkerCapacityReservationsForSmoke(): void {
  activeReservations.clear()
}

/**
 * The current finalizer materializes one exact private source copy before
 * FFprobe. Admission therefore requires the whole source plus operating
 * headroom. This prevents a huge object from entering byte traversal on a
 * worker that cannot finish the current implementation safely.
 */
export function assessLargeMediaFinalizationCapacity(input: {
  expectedSourceBytes: number
  availableBytes?: number
}): LargeMediaWorkerCapacityAssessment {
  const expectedSourceBytes = positiveSafeInteger(input.expectedSourceBytes, 'expectedSourceBytes')
  const sourceStagingBytes = expectedSourceBytes * REEDITPRO_LARGE_MEDIA_WORKER_CAPACITY_POLICY.fullSourceStageCopies
  const safetyReserveBytes = Math.max(
    REEDITPRO_LARGE_MEDIA_WORKER_CAPACITY_POLICY.minimumSafetyReserveBytes,
    Math.ceil(expectedSourceBytes * REEDITPRO_LARGE_MEDIA_WORKER_CAPACITY_POLICY.proportionalSafetyReserve),
  )
  const requiredAvailableBytes = safeSum(sourceStagingBytes, safetyReserveBytes)
  const availableBytes = optionalNonnegativeSafeInteger(input.availableBytes, 'availableBytes')

  if (availableBytes === undefined) {
    return {
      policyId: REEDITPRO_LARGE_MEDIA_WORKER_CAPACITY_POLICY.id,
      status: 'unavailable',
      expectedSourceBytes,
      sourceStagingBytes,
      safetyReserveBytes,
      requiredAvailableBytes,
      byteTraversalAuthorized: false,
    }
  }

  const admitted = availableBytes >= requiredAvailableBytes
  return {
    policyId: REEDITPRO_LARGE_MEDIA_WORKER_CAPACITY_POLICY.id,
    status: admitted ? 'admitted' : 'insufficient',
    expectedSourceBytes,
    sourceStagingBytes,
    safetyReserveBytes,
    requiredAvailableBytes,
    availableBytes,
    ...(admitted ? {} : { shortfallBytes: requiredAvailableBytes - availableBytes }),
    byteTraversalAuthorized: admitted,
  }
}

export async function inspectLargeMediaFinalizationCapacity(input: {
  filesystemPath: string
  expectedSourceBytes: number
}): Promise<LargeMediaWorkerCapacityAssessment> {
  let availableBytes: number | undefined
  try {
    const stats = await statfs(input.filesystemPath)
    const rawAvailableBytes = stats.bavail * stats.bsize
    if (Number.isSafeInteger(rawAvailableBytes) && rawAvailableBytes >= 0) {
      availableBytes = rawAvailableBytes
    }
  } catch {
    // A missing or unreadable capacity source must fail closed before bytes.
  }
  return assessLargeMediaFinalizationCapacity({
    expectedSourceBytes: input.expectedSourceBytes,
    availableBytes,
  })
}

/**
 * Prevents concurrent jobs inside the current single worker process from all
 * spending the same observed free bytes. A distributed scheduler must replace
 * this process-local reservation before multi-instance promotion.
 */
export function reserveLargeMediaWorkerCapacity(input: {
  filesystemPath: string
  assessment: LargeMediaWorkerCapacityAssessment
}): LargeMediaWorkerCapacityReservation {
  const availableBytes = input.assessment.availableBytes
  if (!input.assessment.byteTraversalAuthorized || availableBytes === undefined) {
    return { acquired: false, release: () => undefined }
  }

  const filesystemKey = path.resolve(input.filesystemPath)
  const reservations = activeReservations.get(filesystemKey) ?? new Map<symbol, number>()
  const reservedBytes = [...reservations.values()].reduce((total, value) => safeSum(total, value), 0)
  const availableAfterExistingReservationsBytes = Math.max(0, availableBytes - reservedBytes)
  if (availableAfterExistingReservationsBytes < input.assessment.requiredAvailableBytes) {
    return {
      acquired: false,
      availableAfterExistingReservationsBytes,
      release: () => undefined,
    }
  }

  const token = Symbol('large-media-worker-capacity')
  reservations.set(token, input.assessment.requiredAvailableBytes)
  activeReservations.set(filesystemKey, reservations)
  let released = false
  return {
    acquired: true,
    availableAfterExistingReservationsBytes,
    release: () => {
      if (released) return
      released = true
      const current = activeReservations.get(filesystemKey)
      current?.delete(token)
      if (current?.size === 0) activeReservations.delete(filesystemKey)
    },
  }
}

function positiveSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive safe integer.`)
  }
  return value
}

function optionalNonnegativeSafeInteger(value: number | undefined, label: string): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer.`)
  }
  return value
}

function safeSum(left: number, right: number): number {
  const sum = left + right
  if (!Number.isSafeInteger(sum)) throw new Error('Large-media capacity requirement exceeds safe integer range.')
  return sum
}
