import { createHash } from 'node:crypto'

import type {
  PrivateGcpVisualAttemptCostAggregate,
  PrivateGcpVisualAttemptCostEvidence,
  PrivateGcpVisualAttemptCostEvidenceInput,
  PrivateGcpVisualCostResult,
  PrivateGcpVisualInfrastructureCost,
  PrivateGcpVisualInfrastructureRateSnapshot,
  PrivateGcpVisualInfrastructureUsage,
} from './types'

const SHA256 = /^[a-f0-9]{64}$/u
const MIB_PER_GIB = 1024n
const MILLISECONDS_PER_HOUR = 3_600_000n
const OPERATIONS_PER_THOUSAND = 1000n

export function calculatePrivateGcpVisualInfrastructureCost(input: {
  usage: PrivateGcpVisualInfrastructureUsage
  rateSnapshot: PrivateGcpVisualInfrastructureRateSnapshot
}): PrivateGcpVisualCostResult<PrivateGcpVisualInfrastructureCost> {
  const rateValidation = validateRateSnapshot(input.rateSnapshot)
  if (!rateValidation.ok) return rateValidation
  const usageValidation = validateUsage(input.usage)
  if (!usageValidation.ok) return usageValidation

  let breakdownUsdMicros: PrivateGcpVisualInfrastructureCost['breakdownUsdMicros']
  try {
    breakdownUsdMicros = {
      gpu: meteredCost(input.usage.gpuAllocatedMilliseconds, input.rateSnapshot.gpuMicrosPerHour, MILLISECONDS_PER_HOUR),
      cpu: meteredCost(input.usage.cpuVcpuAllocatedMilliseconds, input.rateSnapshot.cpuMicrosPerVcpuHour, MILLISECONDS_PER_HOUR),
      memory: meteredCost(input.usage.memoryGibAllocatedMilliseconds, input.rateSnapshot.memoryMicrosPerGibHour, MILLISECONDS_PER_HOUR),
      retainedStorage: meteredCost(
        input.usage.retainedArtifactMibMilliseconds,
        input.rateSnapshot.storageMicrosPerGibMonth,
        MIB_PER_GIB * BigInt(input.rateSnapshot.storageBillingMonthHours) * MILLISECONDS_PER_HOUR,
      ),
      networkEgress: meteredCost(
        input.usage.networkEgressBytes,
        input.rateSnapshot.networkEgressMicrosPerGib,
        MIB_PER_GIB * 1024n * 1024n,
      ),
      classAOperations: meteredCost(
        input.usage.classAOperationCount,
        input.rateSnapshot.classAOperationMicrosPerThousand,
        OPERATIONS_PER_THOUSAND,
      ),
      classBOperations: meteredCost(
        input.usage.classBOperationCount,
        input.rateSnapshot.classBOperationMicrosPerThousand,
        OPERATIONS_PER_THOUSAND,
      ),
    }
  } catch {
    return failure('cost_overflow', 'usage', 'Visual infrastructure cost exceeded safe integer precision.')
  }
  const totalUsdMicros = Object.values(breakdownUsdMicros)
    .reduce((sum, value) => sum + value, 0)
  if (!Number.isSafeInteger(totalUsdMicros)) {
    return failure('cost_overflow', 'totalUsdMicros', 'Visual infrastructure cost exceeded safe integer precision.')
  }

  return {
    ok: true,
    data: {
      schemaVersion: 'private-gcp-visual-infrastructure-cost-v1',
      boundary: 'internal_gcp_infrastructure_cost_only',
      rateSnapshot: { ...input.rateSnapshot },
      usage: { ...input.usage },
      breakdownUsdMicros,
      totalUsdMicros,
      providerTokenPriceUsed: false,
      providerInvoiceReconciled: false,
      customerPriceIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
    },
  }
}

export function createPrivateGcpVisualAttemptCostEvidence(
  input: PrivateGcpVisualAttemptCostEvidenceInput,
): PrivateGcpVisualCostResult<PrivateGcpVisualAttemptCostEvidence> {
  for (const [field, value] of Object.entries({
    analysisRunId: input.analysisRunId,
    attemptId: input.attemptId,
  })) {
    if (!validIdentity(value)) {
      return failure('invalid_identity', field, `${field} must be a bounded non-empty identity.`)
    }
  }
  for (const [field, value] of Object.entries({
    planHash: input.planHash,
    sourceChecksumSha256: input.sourceChecksumSha256,
    checkpointSha256: input.checkpointSha256,
    coverageDigestSha256: input.coverageDigestSha256,
    cacheKeySha256: input.cacheKeySha256,
  })) {
    if (!SHA256.test(value)) return failure('invalid_hash', field, `${field} must be lowercase SHA-256.`)
  }
  if (!Number.isInteger(input.attemptOrdinal) || input.attemptOrdinal < 1 || input.attemptOrdinal > 2) {
    return failure('invalid_attempt_ordinal', 'attemptOrdinal', 'Private visual analysis permits at most two canonical attempts.')
  }
  if (!validTimestamp(input.recordedAt)) {
    return failure('invalid_timestamp', 'recordedAt', 'recordedAt must be an ISO timestamp.')
  }
  for (const [field, value] of Object.entries({
    workerExecutionId: input.workerExecutionId,
    usageCaptureId: input.usageCaptureId,
  })) {
    if (!validIdentity(value)) {
      return failure('invalid_execution_identity', field, `${field} must be a bounded non-empty identity.`)
    }
  }
  if (input.outcome !== 'completed' && input.outcome !== 'failed') {
    return failure('invalid_outcome', 'outcome', 'Attempt outcome must be completed or failed.')
  }
  if (
    input.usage.cacheDisposition === 'miss_inference_executed' &&
    !validCloudRunExecutionResource(input.cloudRunExecutionResourceName)
  ) {
    return failure('missing_cloud_run_execution', 'cloudRunExecutionResourceName', 'A cache miss must bind one exact Cloud Run job execution resource.')
  }
  if (
    input.usage.cacheDisposition === 'validated_private_cache_hit' &&
    input.cloudRunExecutionResourceName !== null
  ) {
    return failure('unexpected_cloud_run_execution', 'cloudRunExecutionResourceName', 'A validated cache hit must not claim a new Cloud Run GPU execution.')
  }
  const cost = calculatePrivateGcpVisualInfrastructureCost({
    usage: input.usage,
    rateSnapshot: input.rateSnapshot,
  })
  if (!cost.ok) return cost

  const withoutHash = {
    schemaVersion: 'private-gcp-visual-attempt-cost-evidence-v1' as const,
    boundary: 'internal_gcp_infrastructure_cost_only' as const,
    evidenceClassification: 'provisional_metered_not_invoice_reconciled' as const,
    analysisRunId: input.analysisRunId,
    attemptId: input.attemptId,
    attemptOrdinal: input.attemptOrdinal,
    planHash: input.planHash,
    sourceChecksumSha256: input.sourceChecksumSha256,
    checkpointSha256: input.checkpointSha256,
    coverageDigestSha256: input.coverageDigestSha256,
    cacheKeySha256: input.cacheKeySha256,
    workerExecutionId: input.workerExecutionId,
    cloudRunExecutionResourceName: input.cloudRunExecutionResourceName,
    usageCaptureId: input.usageCaptureId,
    outcome: input.outcome,
    cost: cost.data,
    recordedAt: new Date(input.recordedAt).toISOString(),
    persistence: {
      databaseBacked: false as const,
      productionDurability: false as const,
      invoiceReconciled: false as const,
    },
    commercialBoundary: {
      customerPriceCalculated: false as const,
      customerCreditsCalculated: false as const,
      customerChargeCreated: false as const,
      walletMutationMade: false as const,
      serviceFeeIncluded: false as const,
    },
  }
  return {
    ok: true,
    data: {
      ...withoutHash,
      evidenceHash: sha256(stableStringify(withoutHash)),
    },
  }
}

export function aggregatePrivateGcpVisualAttemptCosts(
  attempts: readonly PrivateGcpVisualAttemptCostEvidence[],
): PrivateGcpVisualCostResult<PrivateGcpVisualAttemptCostAggregate> {
  if (attempts.length < 1 || attempts.length > 2) {
    return failure('invalid_attempt_count', 'attempts', 'Private visual cost aggregation requires one or two attempts.')
  }
  const first = attempts[0]
  const ids = new Set<string>()
  let totalUsdMicros = 0
  for (const [index, attempt] of attempts.entries()) {
    if (ids.has(attempt.attemptId)) return failure('duplicate_attempt', 'attemptId', 'Attempt IDs must be unique.')
    ids.add(attempt.attemptId)
    if (
      attempt.analysisRunId !== first.analysisRunId ||
      attempt.planHash !== first.planHash ||
      attempt.sourceChecksumSha256 !== first.sourceChecksumSha256
      || attempt.checkpointSha256 !== first.checkpointSha256
      || attempt.coverageDigestSha256 !== first.coverageDigestSha256
      || attempt.cacheKeySha256 !== first.cacheKeySha256
    ) return failure('mixed_attempt_authority', 'attempts', 'Attempts must share one analysis run, plan, and source authority.')
    if (attempt.attemptOrdinal !== index + 1) {
      return failure('non_contiguous_attempts', 'attempts', 'Visual attempts must be contiguous and ordered.')
    }
    if (index < attempts.length - 1 && attempt.outcome !== 'failed') {
      return failure('attempt_after_completion', 'attempts', 'A retry cannot follow a completed attempt.')
    }
    if (attempt.evidenceHash !== evidenceHash(attempt)) {
      return failure('invalid_evidence_hash', 'evidenceHash', `Attempt ${attempt.attemptId} failed integrity verification.`)
    }
    const validatedAttempt = validateAttemptEvidence(attempt)
    if (!validatedAttempt.ok) return validatedAttempt
    totalUsdMicros += attempt.cost.totalUsdMicros
    if (!Number.isSafeInteger(totalUsdMicros)) {
      return failure('cost_overflow', 'totalUsdMicros', 'Aggregate cost exceeded safe integer precision.')
    }
  }
  return {
    ok: true,
    data: {
      analysisRunId: first.analysisRunId,
      planHash: first.planHash,
      sourceChecksumSha256: first.sourceChecksumSha256,
      checkpointSha256: first.checkpointSha256,
      coverageDigestSha256: first.coverageDigestSha256,
      cacheKeySha256: first.cacheKeySha256,
      attemptCount: attempts.length,
      failedAttemptCount: attempts.filter((attempt) => attempt.outcome === 'failed').length,
      completedAttemptCount: attempts.filter((attempt) => attempt.outcome === 'completed').length,
      totalUsdMicros,
      customerChargeCreated: false,
      serviceFeeIncluded: false,
    },
  }
}

function validateRateSnapshot(
  rate: PrivateGcpVisualInfrastructureRateSnapshot,
): PrivateGcpVisualCostResult<PrivateGcpVisualInfrastructureRateSnapshot> {
  if (
    rate.schemaVersion !== 'private-gcp-visual-infrastructure-rate-snapshot-v1' ||
    !validIdentity(rate.snapshotId) ||
    !validIdentity(rate.pricingEvidenceArtifactId) ||
    !SHA256.test(rate.sourceContentSha256) ||
    rate.provider !== 'google_cloud' || rate.currency !== 'USD' ||
    rate.accelerator !== 'nvidia_l4' || !validIdentity(rate.billingRegion) ||
    !validTimestamp(rate.observedAt)
  ) return failure('invalid_rate_snapshot', 'rateSnapshot', 'Rate snapshot identity or timestamp is invalid.')
  try {
    const sourceUrl = new URL(rate.sourceUrl)
    if (
      sourceUrl.protocol !== 'https:' || sourceUrl.username || sourceUrl.password ||
      sourceUrl.search || sourceUrl.hash
    ) throw new Error('unsafe source URL')
  } catch {
    return failure('invalid_rate_source', 'sourceUrl', 'Rate snapshot source must be HTTPS.')
  }
  for (const [field, value] of Object.entries({
    gpuMicrosPerHour: rate.gpuMicrosPerHour,
    cpuMicrosPerVcpuHour: rate.cpuMicrosPerVcpuHour,
    memoryMicrosPerGibHour: rate.memoryMicrosPerGibHour,
    storageMicrosPerGibMonth: rate.storageMicrosPerGibMonth,
    networkEgressMicrosPerGib: rate.networkEgressMicrosPerGib,
    classAOperationMicrosPerThousand: rate.classAOperationMicrosPerThousand,
    classBOperationMicrosPerThousand: rate.classBOperationMicrosPerThousand,
  })) {
    if (!Number.isSafeInteger(value) || value < 0) {
      return failure('invalid_rate', field, `${field} must be a non-negative integer USD-micros rate.`)
    }
  }
  if (
    !Number.isSafeInteger(rate.storageBillingMonthHours) ||
    rate.storageBillingMonthHours < 672 || rate.storageBillingMonthHours > 744
  ) {
    return failure('invalid_storage_billing_month', 'storageBillingMonthHours', 'Storage billing month must be a versioned 28-31 day hour basis.')
  }
  if (rate.gpuMicrosPerHour === 0) {
    return failure('invalid_gpu_rate', 'gpuMicrosPerHour', 'An L4 rate snapshot must include a positive hourly GPU rate.')
  }
  return { ok: true, data: { ...rate } }
}

function validateUsage(
  usage: PrivateGcpVisualInfrastructureUsage,
): PrivateGcpVisualCostResult<PrivateGcpVisualInfrastructureUsage> {
  for (const [field, value] of Object.entries({
    gpuAllocatedMilliseconds: usage.gpuAllocatedMilliseconds,
    cpuVcpuAllocatedMilliseconds: usage.cpuVcpuAllocatedMilliseconds,
    memoryGibAllocatedMilliseconds: usage.memoryGibAllocatedMilliseconds,
    retainedArtifactMibMilliseconds: usage.retainedArtifactMibMilliseconds,
    networkEgressBytes: usage.networkEgressBytes,
    classAOperationCount: usage.classAOperationCount,
    classBOperationCount: usage.classBOperationCount,
  })) {
    if (!Number.isSafeInteger(value) || value < 0) {
      return failure('invalid_usage', field, `${field} must be a non-negative safe integer.`)
    }
  }
  if (
    usage.cacheDisposition !== 'miss_inference_executed' &&
    usage.cacheDisposition !== 'validated_private_cache_hit'
  ) return failure('invalid_cache_disposition', 'cacheDisposition', 'Cache disposition is not supported.')
  if (
    usage.cacheDisposition === 'validated_private_cache_hit' &&
    usage.gpuAllocatedMilliseconds !== 0
  ) return failure('invalid_cache_usage', 'gpuAllocatedMilliseconds', 'A validated cache hit cannot claim new GPU allocation time.')
  if (
    usage.cacheDisposition === 'miss_inference_executed' &&
    usage.gpuAllocatedMilliseconds < 1
  ) return failure('missing_gpu_usage', 'gpuAllocatedMilliseconds', 'A cache miss must include measured GPU allocation time.')
  return { ok: true, data: { ...usage } }
}

function validateAttemptEvidence(
  attempt: PrivateGcpVisualAttemptCostEvidence,
): PrivateGcpVisualCostResult<PrivateGcpVisualAttemptCostEvidence> {
  if (
    attempt.schemaVersion !== 'private-gcp-visual-attempt-cost-evidence-v1' ||
    attempt.boundary !== 'internal_gcp_infrastructure_cost_only' ||
    attempt.evidenceClassification !== 'provisional_metered_not_invoice_reconciled' ||
    attempt.persistence.databaseBacked !== false ||
    attempt.persistence.productionDurability !== false ||
    attempt.persistence.invoiceReconciled !== false ||
    attempt.commercialBoundary.customerPriceCalculated !== false ||
    attempt.commercialBoundary.customerCreditsCalculated !== false ||
    attempt.commercialBoundary.customerChargeCreated !== false ||
    attempt.commercialBoundary.walletMutationMade !== false ||
    attempt.commercialBoundary.serviceFeeIncluded !== false
  ) return failure('invalid_cost_boundary', 'attempt', 'Attempt crossed its provisional internal-infrastructure cost boundary.')
  const recreated = createPrivateGcpVisualAttemptCostEvidence({
    analysisRunId: attempt.analysisRunId,
    attemptId: attempt.attemptId,
    attemptOrdinal: attempt.attemptOrdinal,
    planHash: attempt.planHash,
    sourceChecksumSha256: attempt.sourceChecksumSha256,
    checkpointSha256: attempt.checkpointSha256,
    coverageDigestSha256: attempt.coverageDigestSha256,
    cacheKeySha256: attempt.cacheKeySha256,
    workerExecutionId: attempt.workerExecutionId,
    cloudRunExecutionResourceName: attempt.cloudRunExecutionResourceName,
    usageCaptureId: attempt.usageCaptureId,
    outcome: attempt.outcome,
    usage: attempt.cost.usage,
    rateSnapshot: attempt.cost.rateSnapshot,
    recordedAt: attempt.recordedAt,
  })
  if (!recreated.ok) return recreated
  if (stableStringify(recreated.data) !== stableStringify(attempt)) {
    return failure('invalid_cost_calculation', 'cost', 'Attempt evidence does not match its exact identities, rate snapshot, and measured usage.')
  }
  return { ok: true, data: attempt }
}

function meteredCost(usage: number, rateMicros: number, denominator: bigint): number {
  if (usage === 0 || rateMicros === 0) return 0
  return safeNumber(ceilDivide(BigInt(usage) * BigInt(rateMicros), denominator))
}

function evidenceHash(evidence: PrivateGcpVisualAttemptCostEvidence): string {
  const withoutHash: Partial<PrivateGcpVisualAttemptCostEvidence> = { ...evidence }
  delete withoutHash.evidenceHash
  return sha256(stableStringify(withoutHash))
}

function ceilDivide(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator
}

function safeNumber(value: bigint): number {
  const result = Number(value)
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('Visual infrastructure cost exceeded safe integer precision.')
  return result
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function failure<T>(code: string, field: string, message: string): PrivateGcpVisualCostResult<T> {
  return { ok: false, error: { code, field, message } }
}

function validIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value) && !value.includes('..')
}

function validCloudRunExecutionResource(value: string | null): boolean {
  return value !== null && /^projects\/[a-z][a-z0-9-]{4,28}\/(?:locations\/[a-z0-9-]+\/jobs\/[a-z][a-z0-9-]{0,62}\/executions\/[a-z][a-z0-9-]{0,62})$/u.test(value)
}

function validTimestamp(value: string): boolean {
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value
}
