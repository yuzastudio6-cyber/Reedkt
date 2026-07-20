import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { CanonicalProviderWorkAuthorization } from
  '../edit-architecture/canonical-provider-work-authority'
import {
  resolveCanonicalProviderOperation,
} from '../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { TOOL_COST_RATE_CARD_VERSION } from './rate-card'

export const PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_VERSION =
  'private-provider-attempt-cost-evidence-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

export const privateProviderAttemptCostEvidenceSchema = z.object({
  schemaVersion: z.literal(PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_VERSION),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClass: z.enum([
    'private_injected_nonprovider_test',
    'canonical_backend_runtime_unreleased',
  ]),
  evidenceId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    approvedWorkItemId: identity,
    jobId: identity,
    claimId: identity,
    deliveryAttempt: z.number().int().positive().max(10),
    dispatchAttemptId: identity,
    providerOperationId: identity,
    providerRouteId: identity,
    providerModelId: identity,
  }).strict(),
  authorityHash: sha256,
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  priorUnknownCostEvidenceHash: sha256.nullable(),
  canonicalSharedRateCardCompatibilityVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  provider: z.object({
    requestCount: z.union([z.literal(0), z.literal(1)]),
    usageEvidenceDigest: sha256.nullable(),
    rateCardDigest: sha256,
    unit: z.literal('request'),
    unitPriceMicros: z.literal(80_000),
    actualInternalCostMicros: safeMicros.nullable(),
    costReconciled: z.boolean(),
    failedAttemptBillingDocumented: z.literal(false),
  }).strict(),
  infrastructure: z.object({
    measurementClass: z.enum([
      'allocated_wall_time_provisional',
      'observed_cpu_time_unreleased',
    ]),
    allocatedVcpuCount: z.literal(1),
    allocatedMemoryGib: z.literal(1),
    wallTimeMicroseconds: z.number().int().positive().max(120_000_000),
    observedCpuMicroseconds: z.number().int().positive().max(20_000_000).nullable(),
    observedPeakMemoryBytes: z.number().int().positive().nullable(),
    rawUsageEvidenceDigest: sha256,
    rateCardDigest: sha256,
    unit: z.literal('cpu_second'),
    unitPriceMicros: z.literal(1_000),
    minimumChargeMicros: z.literal(1_000),
    billableCpuSeconds: z.number().int().positive().max(20),
    actualInternalCostMicros: safeMicros,
    invoiceReconciled: z.literal(false),
  }).strict(),
  outcome: z.object({
    state: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    failedOrUnknownAttemptCostRetained: z.literal(true),
  }).strict(),
  reconciliation: z.object({
    state: z.enum(['complete', 'reconciliation_required']),
    providerCostMicros: safeMicros.nullable(),
    infrastructureCostMicros: safeMicros,
    totalInternalProductionCostMicros: safeMicros.nullable(),
  }).strict(),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const providerCost = value.provider.actualInternalCostMicros
  const complete = value.reconciliation.state === 'complete'
  const expectedProviderCost = value.provider.requestCount * value.provider.unitPriceMicros
  if (
    value.reconciliation.providerCostMicros !== providerCost ||
    value.reconciliation.infrastructureCostMicros !==
      value.infrastructure.actualInternalCostMicros ||
    value.infrastructure.actualInternalCostMicros !==
      Math.max(
        value.infrastructure.minimumChargeMicros,
        value.infrastructure.billableCpuSeconds * value.infrastructure.unitPriceMicros,
      ) ||
    (value.infrastructure.measurementClass === 'observed_cpu_time_unreleased') !==
      (value.infrastructure.observedCpuMicroseconds !== null) ||
    (complete && (
      !value.provider.costReconciled || providerCost === null ||
      providerCost !== expectedProviderCost ||
      value.reconciliation.totalInternalProductionCostMicros !==
        providerCost + value.infrastructure.actualInternalCostMicros
    )) ||
    (!complete && (
      value.provider.costReconciled || providerCost !== null ||
      value.reconciliation.totalInternalProductionCostMicros !== null ||
      value.outcome.state !== 'unknown_reconciliation_required'
    )) ||
    (value.outcome.state.startsWith('unknown_reconciled_') !==
      (value.priorUnknownCostEvidenceHash !== null))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider-attempt cost reconciliation is inconsistent.',
    })
  }
})

export type PrivateProviderAttemptCostEvidence = z.infer<
  typeof privateProviderAttemptCostEvidenceSchema
>

export interface CreatePrivateProviderAttemptCostEvidenceInput {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorization
  claim: {
    claimId: string
    claimHash: string
    deliveryAttempt: number
  }
  dispatchAttemptId: string
  attemptInputHash: string
  outcomeState: PrivateProviderAttemptCostEvidence['outcome']['state']
  providerRequestCount: 0 | 1
  providerUsageEvidenceDigest: string | null
  providerCostReconciled: boolean
  infrastructure: {
    measurementClass: PrivateProviderAttemptCostEvidence['infrastructure']['measurementClass']
    wallTimeMicroseconds: number
    observedCpuMicroseconds: number | null
    observedPeakMemoryBytes: number | null
    rawUsageEvidenceDigest: string
  }
  priorUnknownCostEvidenceHash?: string
  createdAt: string
}

export async function createPrivateProviderAttemptCostEvidence(
  input: CreatePrivateProviderAttemptCostEvidenceInput,
): Promise<{
  evidence: PrivateProviderAttemptCostEvidence
  idempotencyStatus: 'inserted' | 'duplicate_returned'
}> {
  const authorization = input.authorization
  const profile = resolveCanonicalProviderOperation(authorization.operationId)
  if (
    authorization.operationProfileHash !== profile.profileHash ||
    input.claim.deliveryAttempt < 1 || input.claim.deliveryAttempt > 10 ||
    !/^[a-f0-9]{64}$/u.test(input.claim.claimHash) ||
    !/^[a-f0-9]{64}$/u.test(input.attemptInputHash) ||
    Date.parse(input.createdAt) < Date.parse(authorization.authorizedAt) ||
    Date.parse(input.createdAt) > Date.parse(authorization.expiresAt)
  ) throw invalid('Provider-attempt cost authority is invalid or stale.')

  const measuredMicroseconds = input.infrastructure.observedCpuMicroseconds ??
    input.infrastructure.wallTimeMicroseconds
  if (!Number.isSafeInteger(measuredMicroseconds) || measuredMicroseconds <= 0) {
    throw invalid('Provider-attempt infrastructure duration is invalid.')
  }
  const billableCpuSeconds = Math.ceil(measuredMicroseconds / 1_000_000)
  const infrastructureCostMicros = Math.max(
    profile.costPolicy.infrastructureRate.minimumChargeMicros,
    billableCpuSeconds * profile.costPolicy.infrastructureRate.unitPriceMicros,
  )
  if (
    billableCpuSeconds > profile.costPolicy.infrastructureRate.maximumAuthorizedCpuSeconds ||
    infrastructureCostMicros >
      authorization.maximumAuthorizedInfrastructureCostMicros
  ) throw invalid('Provider-attempt infrastructure cost exceeds immutable authority.')

  const providerCostMicros = input.providerCostReconciled
    ? input.providerRequestCount * profile.costPolicy.providerRate.unitPriceMicros
    : null
  if (
    providerCostMicros !== null &&
    providerCostMicros > authorization.maximumAuthorizedProviderCostMicros
  ) throw invalid('Provider-attempt provider cost exceeds immutable authority.')
  const totalInternalProductionCostMicros = providerCostMicros === null
    ? null
    : providerCostMicros + infrastructureCostMicros
  if (
    totalInternalProductionCostMicros !== null &&
    totalInternalProductionCostMicros >
      authorization.maximumAuthorizedTotalInternalCostMicros
  ) throw invalid('Provider-attempt total internal cost exceeds immutable authority.')

  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v1',
    authorizationHash: authorization.authorityHash,
    claimId: input.claim.claimId,
    claimHash: input.claim.claimHash,
    deliveryAttempt: input.claim.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidenceId = `provider_cost_${attemptIdentityHash.slice(0, 48)}`
  const payload = {
    schemaVersion: PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_VERSION,
    boundary: 'internal_production_cost_only' as const,
    evidenceClass: authorization.authorityClass === 'private_injected_nonprovider_test'
      ? 'private_injected_nonprovider_test' as const
      : 'canonical_backend_runtime_unreleased' as const,
    evidenceId,
    identity: {
      workspaceId: authorization.workspaceId,
      projectId: authorization.projectId,
      editSessionId: authorization.editSessionId,
      approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
      packageRecordId: authorization.packageRecordId,
      approvedWorkItemId: authorization.approvedWorkItemId,
      jobId: authorization.queueJobId,
      claimId: input.claim.claimId,
      deliveryAttempt: input.claim.deliveryAttempt,
      dispatchAttemptId: input.dispatchAttemptId,
      providerOperationId: authorization.operationId,
      providerRouteId: authorization.providerRouteId,
      providerModelId: authorization.providerModelId,
    },
    authorityHash: authorization.authorityHash,
    attemptIdentityHash,
    attemptInputHash: input.attemptInputHash,
    priorUnknownCostEvidenceHash: input.priorUnknownCostEvidenceHash ?? null,
    canonicalSharedRateCardCompatibilityVersion: TOOL_COST_RATE_CARD_VERSION,
    provider: {
      requestCount: input.providerRequestCount,
      usageEvidenceDigest: input.providerUsageEvidenceDigest,
      rateCardDigest: sha256AuthorityValue(profile.costPolicy.providerRate),
      unit: 'request' as const,
      unitPriceMicros: profile.costPolicy.providerRate.unitPriceMicros,
      actualInternalCostMicros: providerCostMicros,
      costReconciled: input.providerCostReconciled,
      failedAttemptBillingDocumented: false as const,
    },
    infrastructure: {
      measurementClass: input.infrastructure.measurementClass,
      allocatedVcpuCount: 1 as const,
      allocatedMemoryGib: 1 as const,
      wallTimeMicroseconds: input.infrastructure.wallTimeMicroseconds,
      observedCpuMicroseconds: input.infrastructure.observedCpuMicroseconds,
      observedPeakMemoryBytes: input.infrastructure.observedPeakMemoryBytes,
      rawUsageEvidenceDigest: input.infrastructure.rawUsageEvidenceDigest,
      rateCardDigest: sha256AuthorityValue(profile.costPolicy.infrastructureRate),
      unit: 'cpu_second' as const,
      unitPriceMicros: profile.costPolicy.infrastructureRate.unitPriceMicros,
      minimumChargeMicros: profile.costPolicy.infrastructureRate.minimumChargeMicros,
      billableCpuSeconds,
      actualInternalCostMicros: infrastructureCostMicros,
      invoiceReconciled: false as const,
    },
    outcome: {
      state: input.outcomeState,
      failedOrUnknownAttemptCostRetained: true as const,
    },
    reconciliation: {
      state: input.providerCostReconciled
        ? 'complete' as const
        : 'reconciliation_required' as const,
      providerCostMicros,
      infrastructureCostMicros,
      totalInternalProductionCostMicros,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    persistence: {
      privateLocalCreateOnly: true as const,
      databaseBacked: false as const,
      productionDurability: false as const,
    },
    createdAt: input.createdAt,
  }
  const evidence = privateProviderAttemptCostEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
  assertNoCommercialFields(evidence)
  const relativePath = evidenceRelativePath(evidence)
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  const result = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
    content: bytes,
  })
  const persisted = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!persisted || !persisted.equals(bytes)) {
    throw invalid('Provider-attempt cost evidence failed create-only readback.')
  }
  return {
    evidence,
    idempotencyStatus: result.created ? 'inserted' : 'duplicate_returned',
  }
}

export async function readPrivateProviderAttemptCostEvidence(input: {
  localStorageRoot: string
  evidence: Pick<PrivateProviderAttemptCostEvidence, 'identity' | 'evidenceId' | 'evidenceHash'>
}): Promise<PrivateProviderAttemptCostEvidence> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: evidenceRelativePath(input.evidence),
  })
  if (!bytes || bytes.byteLength > 64 * 1024) {
    throw invalid('Provider-attempt cost evidence is missing or oversized.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Provider-attempt cost evidence is not valid JSON.')
  }
  const parsed = privateProviderAttemptCostEvidenceSchema.parse(decoded)
  const { evidenceHash, ...payload } = parsed
  if (
    evidenceHash !== sha256AuthorityValue(payload) ||
    parsed.evidenceId !== input.evidence.evidenceId ||
    parsed.evidenceHash !== input.evidence.evidenceHash
  ) throw invalid('Provider-attempt cost evidence integrity changed.')
  assertNoCommercialFields(parsed)
  return parsed
}

function evidenceRelativePath(input: Pick<
  PrivateProviderAttemptCostEvidence,
  'identity' | 'evidenceId' | 'evidenceHash'
>): string {
  const tenantHash = sha256Text(
    `${input.identity.workspaceId}\u0000${input.identity.projectId}\u0000${input.identity.editSessionId}`,
  ).slice(0, 32)
  return `private-internal/provider-attempt-cost/v1/${tenantHash}/${input.evidenceId}-${input.evidenceHash}.json`
}

function assertNoCommercialFields(value: unknown): void {
  const forbidden = /(^|\.)(price|customerPrice|credits|serviceFee|wallet|billing|charge|invoice)(\.|$)/iu
  walk(value, '', (path) => {
    if (forbidden.test(path) && ![
      'commercialBoundary.customerPriceIncluded',
      'commercialBoundary.customerCreditsIncluded',
      'commercialBoundary.serviceFeeIncluded',
      'commercialBoundary.walletMutationPerformed',
      'commercialBoundary.billingMutationPerformed',
      'infrastructure.invoiceReconciled',
    ].includes(path)) {
      throw invalid(`Provider-attempt cost evidence contains commercial field ${path}.`)
    }
  })
}

function walk(value: unknown, path: string, visit: (path: string) => void): void {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next = path ? `${path}.${key}` : key
    visit(next)
    walk(child, next, visit)
  }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'canonical_provider_attempt_internal_cost_integrity',
  })
}
