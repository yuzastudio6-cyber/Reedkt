export const MS011B_INTERNAL_COST_RATE_CARD = Object.freeze({
  schemaVersion: 'motion-studio.ms011b-internal-cost-rate-card.v1' as const,
  rateCardVersionId: 'ms011b-public-research-local-v1' as const,
  currency: 'USD' as const,
  providerFeeMicrosPerRequest: 0,
  requestControlMicrosPerRequest: 1_000,
  capturedDataMicrosPerKibibyte: 2,
  privateStorageMicrosPerKibibyte: 2,
  localCpuMicrosPerSecond: 1_000,
  qaMicrosPerEvent: 500,
  customerPricingIncluded: false,
  customerCreditsIncluded: false,
})

export interface Ms011bInternalUsage {
  requestCount: number
  capturedResponseBytes: number
  privateStorageBytes: number
  localCpuMilliseconds: number
  qaEventCount: number
  providerFeeMicros: 0
  attemptUsages?: readonly Ms011bAttemptUsage[]
}

export interface Ms011bAttemptUsage {
  attemptId: string
  ordinal: 1 | 2 | 3
  responseBytes: number
  privateStorageBytes: number
  localCpuMilliseconds: number
  qaEventCount: number
}

export interface Ms011bInternalCostResult {
  currency: 'USD'
  requestControlMicros: number
  capturedDataMicros: number
  privateStorageMicros: number
  localCpuMicros: number
  qaMicros: number
  providerFeeMicros: 0
  totalInternalCostMicros: number
  maximumAuthorizedInternalCostMicros: 250_000
  customerPricingIncluded: false
  customerCreditsIncluded: false
}

export function calculateMs011bInternalCost(usage: Ms011bInternalUsage): Ms011bInternalCostResult {
  assertSafeUsage(usage)
  const requestControlMicros = usage.requestCount * MS011B_INTERNAL_COST_RATE_CARD.requestControlMicrosPerRequest
  const capturedDataMicros = roundedAttemptTotal(usage, 'responseBytes', 1_024) *
    MS011B_INTERNAL_COST_RATE_CARD.capturedDataMicrosPerKibibyte
  const privateStorageMicros = roundedAttemptTotal(usage, 'privateStorageBytes', 1_024) *
    MS011B_INTERNAL_COST_RATE_CARD.privateStorageMicrosPerKibibyte
  const localCpuMicros = roundedAttemptTotal(usage, 'localCpuMilliseconds', 1_000) *
    MS011B_INTERNAL_COST_RATE_CARD.localCpuMicrosPerSecond
  const qaMicros = usage.qaEventCount * MS011B_INTERNAL_COST_RATE_CARD.qaMicrosPerEvent
  const totalInternalCostMicros = requestControlMicros + capturedDataMicros + privateStorageMicros + localCpuMicros + qaMicros
  if (!Number.isSafeInteger(totalInternalCostMicros) || totalInternalCostMicros > 250_000) {
    throw new Error('MS-011B actual internal cost exceeds the exact owner authorization.')
  }
  return {
    currency: 'USD',
    requestControlMicros,
    capturedDataMicros,
    privateStorageMicros,
    localCpuMicros,
    qaMicros,
    providerFeeMicros: 0,
    totalInternalCostMicros,
    maximumAuthorizedInternalCostMicros: 250_000,
    customerPricingIncluded: false,
    customerCreditsIncluded: false,
  }
}

export function calculateMs011bWorstCaseInternalCost(): Ms011bInternalCostResult {
  return calculateMs011bInternalCost({
    requestCount: 3,
    capturedResponseBytes: 9_961_472,
    privateStorageBytes: 9_961_472,
    localCpuMilliseconds: 30_000,
    qaEventCount: 16,
    providerFeeMicros: 0,
    attemptUsages: [
      { attemptId: 'worst-1', ordinal: 1, responseBytes: 524_288, privateStorageBytes: 524_288, localCpuMilliseconds: 10_000, qaEventCount: 4 },
      { attemptId: 'worst-2', ordinal: 2, responseBytes: 1_048_576, privateStorageBytes: 1_048_576, localCpuMilliseconds: 10_000, qaEventCount: 4 },
      { attemptId: 'worst-3', ordinal: 3, responseBytes: 8_388_608, privateStorageBytes: 8_388_608, localCpuMilliseconds: 10_000, qaEventCount: 8 },
    ],
  })
}

function assertSafeUsage(usage: Ms011bInternalUsage): void {
  const integers = [
    usage.requestCount,
    usage.capturedResponseBytes,
    usage.privateStorageBytes,
    usage.localCpuMilliseconds,
    usage.qaEventCount,
  ]
  if (integers.some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error('MS-011B usage must use non-negative safe integers.')
  }
  if (usage.requestCount > 3 || usage.capturedResponseBytes > 9_961_472 ||
      usage.privateStorageBytes > 9_961_472 || usage.localCpuMilliseconds > 30_000 ||
      usage.providerFeeMicros !== 0) {
    throw new Error('MS-011B usage exceeds an exact authorization ceiling.')
  }
  if (usage.attemptUsages) {
    const attempts = usage.attemptUsages
    if (attempts.length !== usage.requestCount || attempts.length > 3 ||
        new Set(attempts.map((attempt) => attempt.attemptId)).size !== attempts.length ||
        attempts.some((attempt, index) => attempt.ordinal !== index + 1 ||
          !Number.isSafeInteger(attempt.responseBytes) || attempt.responseBytes < 0 ||
          !Number.isSafeInteger(attempt.privateStorageBytes) || attempt.privateStorageBytes < 0 ||
          !Number.isSafeInteger(attempt.localCpuMilliseconds) || attempt.localCpuMilliseconds < 0 ||
          !Number.isSafeInteger(attempt.qaEventCount) || attempt.qaEventCount < 1 || attempt.qaEventCount > 16) ||
        sum(attempts, 'responseBytes') !== usage.capturedResponseBytes ||
        sum(attempts, 'privateStorageBytes') !== usage.privateStorageBytes ||
        sum(attempts, 'localCpuMilliseconds') !== usage.localCpuMilliseconds ||
        sum(attempts, 'qaEventCount') !== usage.qaEventCount) {
      throw new Error('MS-011B attempt usage must conserve the exact run totals in request order.')
    }
  }
}

function roundedAttemptTotal(
  usage: Ms011bInternalUsage,
  field: 'responseBytes' | 'privateStorageBytes' | 'localCpuMilliseconds',
  divisor: number,
): number {
  return usage.attemptUsages
    ? usage.attemptUsages.reduce((total, attempt) => total + Math.ceil(attempt[field] / divisor), 0)
    : Math.ceil(usage[field === 'responseBytes'
      ? 'capturedResponseBytes'
      : field] / divisor)
}

function sum(
  attempts: readonly Ms011bAttemptUsage[],
  field: 'responseBytes' | 'privateStorageBytes' | 'localCpuMilliseconds' | 'qaEventCount',
): number {
  return attempts.reduce((total, attempt) => total + attempt[field], 0)
}
