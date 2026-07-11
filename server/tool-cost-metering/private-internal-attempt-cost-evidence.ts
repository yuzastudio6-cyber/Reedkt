import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { calculateToolActualCostMicros } from './cost-math'
import { TOOL_COST_RATE_CARD_VERSION } from './rate-card'
import type { ToolCostFailureCategory } from './types'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = safeInteger.refine((value) => value > 0)
const failureCategory = z.enum([
  'none',
  'provider_error',
  'provider_variance_absorbed',
  'reeditpro_error_absorbed',
  'user_requested_retry',
  'validation_error',
  'timeout',
  'cancelled',
  'unknown',
])

export const privateInternalAttemptCostEvidenceSchema = z.object({
  schemaVersion: z.literal('private-internal-attempt-cost-evidence-v1'),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClassification: z.literal('provisional_local_metered'),
  evidenceId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    approvedWorkItemId: identity,
    jobId: identity,
    executionAttemptId: identity,
    retryAttempt: safeInteger,
    toolId: z.literal('deepfilternet'),
    operationId: z.literal('tool.deepfilternet.enhance_voice.v1'),
  }).strict(),
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  sourceKind: z.literal('infrastructure_runtime'),
  resourceUsage: z.object({
    wallTimeMilliseconds: positiveSafeInteger,
    billableMilliseconds: positiveSafeInteger,
    vcpuCount: z.literal(4),
    memoryGib: z.literal(4),
    gpuCount: z.literal(0),
    outputByteLength: safeInteger.nullable(),
    networkEgressMib: z.literal(0),
  }).strict(),
  breakdownMicros: z.record(z.string(), safeInteger),
  actualInternalCostMicros: safeInteger,
  outcome: z.object({
    status: z.enum(['completed', 'failed']),
    failureCategory,
  }).strict(),
  linkedCanonicalOutcomeHash: sha256.nullable(),
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
    invoiceReconciled: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  if (value.outcome.status === 'completed') {
    if (value.outcome.failureCategory !== 'none') {
      context.addIssue({ code: 'custom', path: ['outcome', 'failureCategory'], message: 'Completed attempts cannot have a failure category.' })
    }
    if (!value.linkedCanonicalOutcomeHash || value.resourceUsage.outputByteLength === null) {
      context.addIssue({ code: 'custom', path: ['linkedCanonicalOutcomeHash'], message: 'Completed attempts require an output and canonical outcome hash.' })
    }
  } else {
    if (value.outcome.failureCategory === 'none') {
      context.addIssue({ code: 'custom', path: ['outcome', 'failureCategory'], message: 'Failed attempts require a failure category.' })
    }
    if (value.linkedCanonicalOutcomeHash !== null) {
      context.addIssue({ code: 'custom', path: ['linkedCanonicalOutcomeHash'], message: 'Failed attempts cannot claim a canonical outcome.' })
    }
  }
})

export type PrivateInternalAttemptCostEvidence = z.infer<typeof privateInternalAttemptCostEvidenceSchema>

export interface BeginPrivateInternalAttemptCostEvidenceInput {
  localStorageRoot: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  approvedWorkItemId: string
  jobId: string
  executionAttemptId: string
  retryAttempt: number
  toolId: 'deepfilternet'
  operationId: 'tool.deepfilternet.enhance_voice.v1'
}

export interface FinalizePrivateInternalAttemptCostEvidenceInput {
  status: 'completed' | 'failed'
  failureCategory: ToolCostFailureCategory
  outputByteLength: number | null
  linkedCanonicalOutcomeHash: string | null
}

export interface PrivateInternalAttemptCostEvidenceResult {
  evidence: PrivateInternalAttemptCostEvidence
  idempotencyStatus: 'inserted' | 'duplicate_returned'
}

export interface PrivateInternalAttemptCostClock {
  nowIso(): string
  monotonicNanoseconds(): bigint
}

const beginInputSchema = z.object({
  localStorageRoot: z.string().min(1),
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  approvedWorkItemId: identity,
  jobId: identity,
  executionAttemptId: identity,
  retryAttempt: safeInteger.max(10),
  toolId: z.literal('deepfilternet'),
  operationId: z.literal('tool.deepfilternet.enhance_voice.v1'),
}).strict()

const finalizeInputSchema = z.object({
  status: z.enum(['completed', 'failed']),
  failureCategory,
  outputByteLength: safeInteger.nullable(),
  linkedCanonicalOutcomeHash: sha256.nullable(),
}).strict()

const defaultClock: PrivateInternalAttemptCostClock = {
  nowIso: () => new Date().toISOString(),
  monotonicNanoseconds: () => process.hrtime.bigint(),
}

export async function beginPrivateInternalAttemptCostEvidence(
  rawInput: BeginPrivateInternalAttemptCostEvidenceInput,
  clock: PrivateInternalAttemptCostClock = defaultClock,
) {
  const input = parse(beginInputSchema, rawInput, 'Internal attempt-cost identity is invalid.')
  const attemptIdentityHash = attemptIdentity(input)
  const attemptInputHash = sha256AuthorityValue({
    domain: 'private_internal_attempt_cost_input_v1',
    identity: costIdentity(input),
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    resourceEnvelope: fixedResourceEnvelope(),
  })
  const existing = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.localStorageRoot,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionAttemptId: input.executionAttemptId,
  })
  if (existing && existing.attemptInputHash !== attemptInputHash) {
    throw conflict('Execution-attempt cost identity conflicts with existing evidence.')
  }
  const startedAtNanoseconds = clock.monotonicNanoseconds()

  return {
    async finalize(
      rawFinal: FinalizePrivateInternalAttemptCostEvidenceInput,
    ): Promise<PrivateInternalAttemptCostEvidenceResult> {
      const final = parse(finalizeInputSchema, rawFinal, 'Internal attempt-cost outcome is invalid.')
      assertOutcome(final)
      if (existing) {
        assertReplay(existing, final)
        return { evidence: existing, idempotencyStatus: 'duplicate_returned' }
      }

      const finishedAtNanoseconds = clock.monotonicNanoseconds()
      const wallTimeMilliseconds = elapsedMilliseconds(startedAtNanoseconds, finishedAtNanoseconds)
      const calculated = calculateToolActualCostMicros({
        sourceKind: 'infrastructure_runtime',
        runtime: {
          wallTimeMilliseconds,
          renderSeconds: 0,
          vcpuCount: 4,
          memoryGib: 4,
          gpuCount: 0,
          tempStorageGibHours: 0,
          outputStorageGibHours: 0,
          networkEgressMib: 0,
          computeLevel: 'standard',
        },
      })
      if (!calculated.ok) {
        throw new ApiError('VALIDATION_FAILED', `Internal attempt-cost calculation failed: ${calculated.error.code}.`, 400)
      }
      if (
        calculated.data.rateCardVersion !== TOOL_COST_RATE_CARD_VERSION ||
        !Number.isSafeInteger(calculated.data.actualInternalCostMicros) ||
        calculated.data.actualInternalCostMicros < 0 ||
        !Number.isSafeInteger(calculated.data.billableMilliseconds) ||
        (calculated.data.billableMilliseconds ?? 0) <= 0
      ) throw invalid('Internal attempt-cost calculation lost integer-micro precision.')

      const recordWithoutHash = {
        schemaVersion: 'private-internal-attempt-cost-evidence-v1' as const,
        boundary: 'internal_production_cost_only' as const,
        evidenceClassification: 'provisional_local_metered' as const,
        evidenceId: `internalcost_${attemptIdentityHash.slice(0, 48)}`,
        identity: costIdentity(input),
        attemptIdentityHash,
        attemptInputHash,
        rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
        sourceKind: 'infrastructure_runtime' as const,
        resourceUsage: {
          wallTimeMilliseconds,
          billableMilliseconds: calculated.data.billableMilliseconds!,
          ...fixedResourceEnvelope(),
          outputByteLength: final.outputByteLength,
          networkEgressMib: 0 as const,
        },
        breakdownMicros: numericBreakdown(calculated.data.breakdownMicros),
        actualInternalCostMicros: calculated.data.actualInternalCostMicros,
        outcome: { status: final.status, failureCategory: final.failureCategory },
        linkedCanonicalOutcomeHash: final.linkedCanonicalOutcomeHash,
        persistence: {
          privateLocalCreateOnly: true as const,
          databaseBacked: false as const,
          productionDurability: false as const,
          invoiceReconciled: false as const,
        },
        createdAt: clock.nowIso(),
      }
      assertNoCommercialFields(recordWithoutHash)
      const evidence = parse(privateInternalAttemptCostEvidenceSchema, {
        ...recordWithoutHash,
        evidenceHash: sha256AuthorityValue(recordWithoutHash),
      }, 'Internal attempt-cost evidence is invalid.')
      const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`)
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(attemptIdentityHash),
        content: bytes,
      })
      const persisted = await readPrivateInternalAttemptCostEvidence({
        localStorageRoot: input.localStorageRoot,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        executionAttemptId: input.executionAttemptId,
      })
      if (!persisted || persisted.evidenceHash !== evidence.evidenceHash) {
        throw invalid('Internal attempt-cost evidence changed during create-only persistence.')
      }
      return { evidence: persisted, idempotencyStatus: 'inserted' }
    },
  }
}

export async function readPrivateInternalAttemptCostEvidence(input: {
  localStorageRoot: string
  workspaceId: string
  projectId: string
  executionAttemptId: string
}): Promise<PrivateInternalAttemptCostEvidence | undefined> {
  const attemptIdentityHash = attemptIdentity(input)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(attemptIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 2 || bytes.byteLength > 64 * 1024) throw invalid('Stored internal attempt-cost evidence exceeds its byte boundary.')
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Stored internal attempt-cost evidence is not valid JSON.')
  }
  const evidence = parse(privateInternalAttemptCostEvidenceSchema, decoded, 'Stored internal attempt-cost evidence is invalid.')
  if (
    evidence.identity.workspaceId !== input.workspaceId ||
    evidence.identity.projectId !== input.projectId ||
    evidence.identity.executionAttemptId !== input.executionAttemptId ||
    evidence.attemptIdentityHash !== attemptIdentityHash
  ) throw conflict('Stored internal attempt-cost evidence has conflicting identity.')
  const { evidenceHash, ...withoutHash } = evidence
  if (sha256AuthorityValue(withoutHash) !== evidenceHash) throw invalid('Stored internal attempt-cost checksum is invalid.')
  assertNoCommercialFields(evidence)
  return evidence
}

function attemptIdentity(input: {
  workspaceId: string
  projectId: string
  executionAttemptId: string
}): string {
  return createHash('sha256').update(stableAuthorityStringify({
    domain: 'private_internal_attempt_cost_identity_v1',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionAttemptId: input.executionAttemptId,
  })).digest('hex')
}

function costIdentity(input: BeginPrivateInternalAttemptCostEvidenceInput) {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedWorkItemId: input.approvedWorkItemId,
    jobId: input.jobId,
    executionAttemptId: input.executionAttemptId,
    retryAttempt: input.retryAttempt,
    toolId: input.toolId,
    operationId: input.operationId,
  }
}

function fixedResourceEnvelope() {
  return { vcpuCount: 4 as const, memoryGib: 4 as const, gpuCount: 0 as const }
}

function assertOutcome(input: FinalizePrivateInternalAttemptCostEvidenceInput): void {
  if (input.status === 'completed') {
    if (input.failureCategory !== 'none' || input.outputByteLength === null || !input.linkedCanonicalOutcomeHash) {
      throw invalid('Completed internal attempts require output identity and no failure category.')
    }
    return
  }
  if (input.failureCategory === 'none' || input.linkedCanonicalOutcomeHash !== null) {
    throw invalid('Failed internal attempts require a failure category and no canonical outcome claim.')
  }
}

function assertReplay(
  existing: PrivateInternalAttemptCostEvidence,
  input: FinalizePrivateInternalAttemptCostEvidenceInput,
): void {
  if (
    existing.outcome.status !== input.status ||
    existing.outcome.failureCategory !== input.failureCategory ||
    existing.resourceUsage.outputByteLength !== input.outputByteLength ||
    existing.linkedCanonicalOutcomeHash !== input.linkedCanonicalOutcomeHash
  ) throw conflict('Execution-attempt replay conflicts with immutable internal cost evidence.')
}

function elapsedMilliseconds(start: bigint, finish: bigint): number {
  if (finish < start) throw invalid('Monotonic attempt-cost clock moved backwards.')
  const elapsed = (finish - start + 999_999n) / 1_000_000n
  const milliseconds = Number(elapsed > 0n ? elapsed : 1n)
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) throw invalid('Attempt duration exceeds the integer boundary.')
  return milliseconds
}

function numericBreakdown(value: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'number' || !Number.isSafeInteger(entry) || entry < 0) {
      throw invalid(`Internal attempt-cost breakdown field ${key} is not a safe integer.`)
    }
    result[key] = entry
  }
  return result
}

function assertNoCommercialFields(value: unknown, path = '$'): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoCommercialFields(entry, `${path}[${index}]`))
    return
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
    if (
      normalized.includes('customerprice') || normalized.includes('customercredit') ||
      normalized.includes('servicefee') || normalized.includes('markup') ||
      normalized.includes('margin') || normalized.includes('discount') ||
      normalized.includes('wallet') || normalized.includes('settlement') ||
      normalized.includes('billabletouser') || normalized.includes('toolcostcredit') ||
      normalized === 'credits' || normalized === 'tax' || normalized.startsWith('tax')
    ) throw invalid(`Internal attempt-cost evidence contains forbidden commercial field ${path}.${key}.`)
    assertNoCommercialFields(entry, `${path}.${key}`)
  }
}

function relativePath(attemptIdentityHash: string): string {
  return `canonical-internal-cost-evidence/private-v1/${attemptIdentityHash.slice(0, 2)}/${attemptIdentityHash}.json`
}

function parse<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  return parsed.data
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'private_internal_attempt_cost_evidence_integrity',
  })
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate: 'private_internal_attempt_cost_evidence_idempotency',
  })
}
