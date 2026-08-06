import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  canonicalDistributedPrePlanStudyAttemptViewSchema,
  canonicalDistributedPrePlanStudyPersistenceBoundariesSchema,
  canonicalDistributedPrePlanStudyRequestHash,
  canonicalDistributedPrePlanStudyRunViewSchema,
  canonicalDistributedPrePlanStudySeedSchema,
  canonicalDistributedPrePlanStudyWorkItemSeedSchema,
  canonicalDistributedPrePlanStudyWorkItemViewSchema,
  CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS,
  CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
  type CanonicalDistributedPrePlanStudyAttemptView,
  type CanonicalDistributedPrePlanStudyRunView,
  type CanonicalDistributedPrePlanStudySeed,
  type CanonicalDistributedPrePlanStudyWorkItemSeed,
  type CanonicalDistributedPrePlanStudyWorkItemView,
} from './canonical-distributed-pre-plan-study-state-port'
import {
  assertCanonicalDistributedPrePlanStudyLocalPostgresCapabilityForClient,
  type CanonicalDistributedPrePlanStudyLocalPostgresCapability,
  type CanonicalDistributedPrePlanStudyRpcClient,
} from './canonical-distributed-pre-plan-study-state-rpc-adapter'

export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_READ_PROJECTION_VERSION =
  'canonical-distributed-pre-plan-study-read-projection-v1' as const
export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_READ_PROJECTION_FUNCTION =
  'reeditpro_read_pre_plan_study_projection_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })

export const canonicalDistributedPrePlanStudyReadRequestSchema = z.object({
  runId: identity,
  idempotencyKey: identity.min(16),
  requestedAt: timestamp,
  requestHash: sha256,
}).strict().superRefine((request, context) => {
  if (request.requestHash !== canonicalDistributedPrePlanStudyRequestHash(
    'read_projection',
    request,
  )) {
    context.addIssue({
      code: 'custom',
      message: 'Pre-plan study read request hash is invalid.',
    })
  }
})

export const canonicalDistributedPrePlanStudyReadWorkItemSchema = z.object({
  seed: canonicalDistributedPrePlanStudyWorkItemSeedSchema,
  view: canonicalDistributedPrePlanStudyWorkItemViewSchema,
  latestAttempt: canonicalDistributedPrePlanStudyAttemptViewSchema.nullable(),
}).strict().superRefine((workItem, context) => {
  if (
    workItem.seed.workItemId !== workItem.view.workItemId
    || workItem.seed.sequence !== workItem.view.sequence
    || workItem.seed.stageId !== workItem.view.stageId
    || workItem.seed.required !== workItem.view.required
    || workItem.seed.workerClass !== workItem.view.workerClass
    || stableStringify(workItem.seed.dependencyWorkItemIds) !==
      stableStringify(workItem.view.dependencyWorkItemIds)
    || (workItem.latestAttempt !== null && (
      workItem.latestAttempt.attemptStart.workItemId !== workItem.seed.workItemId
      || workItem.latestAttempt.attemptStart.workItemHash !== workItem.seed.workItemHash
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Pre-plan study read work-item lineage is invalid.',
    })
  }
})

export const canonicalDistributedPrePlanStudyReadProjectionSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_READ_PROJECTION_VERSION,
  ),
  seed: canonicalDistributedPrePlanStudySeedSchema,
  run: canonicalDistributedPrePlanStudyRunViewSchema,
  workItems: z.array(canonicalDistributedPrePlanStudyReadWorkItemSchema)
    .min(1)
    .max(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_MAX_WORK_ITEMS),
  readAt: timestamp,
  boundaries: canonicalDistributedPrePlanStudyPersistenceBoundariesSchema.extend({
    readProjectionOnly: z.literal(true),
    mutationAuthorityIncluded: z.literal(false),
  }).strict(),
  responseHash: sha256,
}).strict().superRefine((projection, context) => {
  const orderedSeedIds = projection.seed.workItems
    .map((workItem) => workItem.workItemId)
  const orderedProjectionIds = projection.workItems
    .map((workItem) => workItem.seed.workItemId)
  if (
    projection.seed.runId !== projection.run.runId
    || projection.seed.planId !== projection.run.planId
    || projection.seed.planDigestSha256 !== projection.run.planDigestSha256
    || projection.seed.identity.identityHash !== projection.run.studyIdentityHash
    || projection.run.totalWorkItemCount !== projection.workItems.length
    || stableStringify(orderedSeedIds) !== stableStringify(orderedProjectionIds)
    || projection.workItems.some((workItem, index) => (
      stableStringify(workItem.seed) !== stableStringify(projection.seed.workItems[index])
    ))
    || projection.responseHash !==
      canonicalDistributedPrePlanStudyReadProjectionHash(projection)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Pre-plan study read projection is inconsistent.',
    })
  }
})

export type CanonicalDistributedPrePlanStudyReadRequest = z.infer<
  typeof canonicalDistributedPrePlanStudyReadRequestSchema
>
export type CanonicalDistributedPrePlanStudyReadWorkItem = {
  readonly seed: CanonicalDistributedPrePlanStudyWorkItemSeed
  readonly view: CanonicalDistributedPrePlanStudyWorkItemView
  readonly latestAttempt: CanonicalDistributedPrePlanStudyAttemptView | null
}
export interface CanonicalDistributedPrePlanStudyReadProjection {
  readonly schemaVersion:
    typeof CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_READ_PROJECTION_VERSION
  readonly seed: CanonicalDistributedPrePlanStudySeed
  readonly run: CanonicalDistributedPrePlanStudyRunView
  readonly workItems: readonly CanonicalDistributedPrePlanStudyReadWorkItem[]
  readonly readAt: string
  readonly boundaries: z.infer<
    typeof canonicalDistributedPrePlanStudyReadProjectionSchema
  >['boundaries']
  readonly responseHash: string
}

export interface CanonicalDistributedPrePlanStudyReadProjectionPort {
  readonly schemaVersion:
    typeof CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_READ_PROJECTION_VERSION
  readonly sourceAuthority: 'canonical_v3_loopback_postgres_read_projection'
  readonly mutationAuthorityIncluded: false
  readonly productionAuthority: false
  read(input: CanonicalDistributedPrePlanStudyReadRequest): Promise<
    CanonicalDistributedPrePlanStudyReadProjection | undefined
  >
}

const readProjectionPortBrands = new WeakSet<object>()

export function createCanonicalDistributedPrePlanStudyReadProjectionPort(input: {
  readonly client: CanonicalDistributedPrePlanStudyRpcClient
  readonly capability: CanonicalDistributedPrePlanStudyLocalPostgresCapability
}): CanonicalDistributedPrePlanStudyReadProjectionPort {
  assertCanonicalDistributedPrePlanStudyLocalPostgresCapabilityForClient(input)
  const port: CanonicalDistributedPrePlanStudyReadProjectionPort = {
    schemaVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_READ_PROJECTION_VERSION,
    sourceAuthority: 'canonical_v3_loopback_postgres_read_projection',
    mutationAuthorityIncluded: false,
    productionAuthority: false,
    async read(rawInput) {
      const request = canonicalDistributedPrePlanStudyReadRequestSchema.parse(rawInput)
      let result: Awaited<ReturnType<CanonicalDistributedPrePlanStudyRpcClient['rpc']>>
      try {
        result = await input.client.rpc(
          CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_READ_PROJECTION_FUNCTION,
          {
            p_contract_version: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
            p_request: request,
          },
        )
      } catch (error) {
        throw readFailure(error)
      }
      if (!result || typeof result !== 'object' || result.error) {
        throw readFailure(result?.error)
      }
      const normalized = normalizeRpcData(result.data)
      if (normalized === null) return undefined
      const parsed = canonicalDistributedPrePlanStudyReadProjectionSchema.safeParse(normalized)
      if (!parsed.success) {
        throw new ApiError(
          'IDEMPOTENCY_ATOMICITY_REQUIRED',
          'Pre-plan study read projection did not match its source-verified contract.',
          503,
          {
            issueCount: parsed.error.issues.length,
            mutationAuthorityIncluded: false,
            automaticRetryStarted: false,
          },
        )
      }
      if (parsed.data.seed.runId !== request.runId) {
        throw readFailure({ code: 'READ_PROJECTION_RUN_CHANGED' })
      }
      return parsed.data
    },
  }
  Object.freeze(port)
  readProjectionPortBrands.add(port)
  return port
}

export function assertCanonicalDistributedPrePlanStudyReadProjectionPort(
  input: unknown,
): asserts input is CanonicalDistributedPrePlanStudyReadProjectionPort {
  if (!input || typeof input !== 'object' || !readProjectionPortBrands.has(input)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'The pre-plan study read projection is not process-branded.',
      503,
    )
  }
}

export function canonicalDistributedPrePlanStudyReadProjectionHash(
  input: Record<string, unknown>,
): string {
  const { responseHash: _responseHash, ...payload } = input
  void _responseHash
  return sha256AuthorityValue({
    domain: 'canonical_distributed_pre_plan_study_read_projection_v1',
    payload,
  })
}

function normalizeRpcData(data: unknown): unknown {
  if (!Array.isArray(data)) return data
  if (data.length !== 1) {
    throw readFailure({ code: 'READ_PROJECTION_CARDINALITY_INVALID' })
  }
  return data[0]
}

function readFailure(error: unknown): ApiError {
  const source = error && typeof error === 'object'
    ? error as Record<string, unknown>
    : {}
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The canonical pre-plan study read projection is unavailable or unsafe.',
    503,
    {
      errorEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_distributed_pre_plan_study_read_projection_error_v1',
        code: cleanScalar(source.code),
        status: cleanScalar(source.status),
      }),
      mutationAuthorityIncluded: false,
      automaticRetryStarted: false,
      productionAuthority: false,
    },
  )
}

function cleanScalar(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned.length > 0 && cleaned.length <= 120 ? cleaned : null
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`
}
