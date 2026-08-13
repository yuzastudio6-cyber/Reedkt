import { z } from 'zod'

import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_SCHEDULE_VERSION =
  'canonical-professional-gpu-fair-queue-schedule-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_SCHEDULER_VERSION =
  'canonical-professional-gpu-fair-queue-scheduler-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES = 10_000 as const
export const CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE = 2 as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const queueEntrySchema = z.object({
  queueEntryId: safeId,
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  routeId: routeIdSchema,
  approvedSnapshotRef: refSchema,
  approvedWorkItemRef: refSchema,
  fundedDispatchAdmissionRef: refSchema,
  executionAttemptRef: refSchema,
  userTriggerRecordRef: refSchema,
  enqueuedAt: timestamp,
  enqueueOrdinal: z.number().int().positive().safe(),
  userTriggeredAfterApprovalAndFunding: z.literal(true),
  callerSelectedPriorityCapacityOrRoute: z.literal(false),
}).strict()
export const canonicalProfessionalGpuFairQueueEntrySchema = queueEntrySchema
export type CanonicalProfessionalGpuFairQueueEntry = z.infer<
  typeof queueEntrySchema
>

const activeAttemptSchema = z.object({
  queueEntryId: safeId,
  workspaceId: safeId,
  routeId: routeIdSchema,
  executionAttemptRef: refSchema,
  startedAt: timestamp,
}).strict()
export const canonicalProfessionalGpuFairQueueActiveAttemptSchema =
  activeAttemptSchema
export type CanonicalProfessionalGpuFairQueueActiveAttempt = z.infer<
  typeof activeAttemptSchema
>

const capacitySchema = z.object({
  routeId: routeIdSchema,
  capacityObservationRef: refSchema,
  maximumConcurrentAttempts: z.number().int().min(1).max(64),
  currentActiveAttempts: z.number().int().min(0).max(64),
  minimumIdleGpuInstances: z.literal(0),
  exactCurrentQuotaAndRuntimeCapacityReread: z.literal(true),
}).strict().superRefine((capacity, context) => {
  if (capacity.currentActiveAttempts > capacity.maximumConcurrentAttempts) {
    context.addIssue({
      code: 'custom',
      message: 'GPU route active count exceeds current capacity.',
    })
  }
})
export const canonicalProfessionalGpuFairQueueCapacitySchema = capacitySchema
export type CanonicalProfessionalGpuFairQueueCapacity = z.infer<
  typeof capacitySchema
>

export function assertCanonicalProfessionalGpuFairQueueEntry(
  value: unknown,
): CanonicalProfessionalGpuFairQueueEntry {
  return queueEntrySchema.parse(cloneBoundedPlainSerializedData(
    value,
    'professional_gpu_fair_queue_entry',
  ))
}

export function assertCanonicalProfessionalGpuFairQueueActiveAttempt(
  value: unknown,
): CanonicalProfessionalGpuFairQueueActiveAttempt {
  return activeAttemptSchema.parse(cloneBoundedPlainSerializedData(
    value,
    'professional_gpu_fair_queue_active_attempt',
  ))
}

export function assertCanonicalProfessionalGpuFairQueueCapacity(
  value: unknown,
): CanonicalProfessionalGpuFairQueueCapacity {
  return capacitySchema.parse(cloneBoundedPlainSerializedData(
    value,
    'professional_gpu_fair_queue_capacity',
  ))
}

const scheduledRefSchema = z.object({
  queueEntryId: safeId,
  executionAttemptRef: refSchema,
  workspaceId: safeId,
  routeId: routeIdSchema,
}).strict()

const deferredRefSchema = scheduledRefSchema.extend({
  reason: z.enum([
    'route_capacity_busy',
    'workspace_concurrency_limit',
  ]),
}).strict()

const scheduleWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_SCHEDULE_VERSION,
  ),
  source: z.literal('canonical_server_gpu_fair_queue_scheduler'),
  evidenceClass: z.literal('deterministic_server_schedule'),
  scheduleId: safeId,
  queueSnapshotRef: refSchema,
  capacityObservationRefs: z.array(refSchema).min(1).max(3),
  inputQueueEntryCount: z.number().int().min(0).max(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  ),
  inputActiveAttemptCount: z.number().int().min(0).max(192),
  admittedEntries: z.array(scheduledRefSchema).max(192),
  deferredEntries: z.array(deferredRefSchema).max(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  ),
  admittedCount: z.number().int().min(0).max(192),
  deferredCount: z.number().int().min(0).max(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  ),
  maximumActiveAttemptsPerWorkspace: z.literal(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE,
  ),
  workspaceRoundRobinFairnessApplied: z.literal(true),
  editLevelDoesNotChangeOutputQualityOrBypassFairness: z.literal(true),
  overloadDisposition: z.literal('remain_queued_with_backpressure'),
  cpuSubstantiveFallbackAllowed: z.literal(false),
  automaticQualityReductionAllowed: z.literal(false),
  silentAdditionalCreditApprovalAllowed: z.literal(false),
  callerSelectedPriorityCapacityOrRouteAccepted: z.literal(false),
  cloudGpuDispatchStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  scheduledAt: timestamp,
}).strict().superRefine((schedule, context) => {
  const all = [...schedule.admittedEntries, ...schedule.deferredEntries]
  if (schedule.admittedCount !== schedule.admittedEntries.length
    || schedule.deferredCount !== schedule.deferredEntries.length
    || schedule.inputQueueEntryCount !== all.length
    || new Set(all.map((entry) => entry.queueEntryId)).size !== all.length
    || new Set(all.map((entry) =>
      stableAuthorityStringify(entry.executionAttemptRef))).size !==
      all.length
    || new Set(schedule.capacityObservationRefs.map((entry) =>
      stableAuthorityStringify(entry))).size !==
      schedule.capacityObservationRefs.length) context.addIssue({
    code: 'custom',
    message: 'GPU fair-queue schedule counts or identities differ.',
  })
})

export const canonicalProfessionalGpuFairQueueScheduleSchema =
  scheduleWithoutHashSchema.extend({ scheduleHash: sha256 }).strict()
export type CanonicalProfessionalGpuFairQueueSchedule = z.infer<
  typeof canonicalProfessionalGpuFairQueueScheduleSchema
>

export function compileCanonicalProfessionalGpuFairQueueSchedule(input: {
  readonly scheduleId: string
  readonly queueEntries: readonly CanonicalProfessionalGpuFairQueueEntry[]
  readonly activeAttempts:
    readonly CanonicalProfessionalGpuFairQueueActiveAttempt[]
  readonly capacities: readonly CanonicalProfessionalGpuFairQueueCapacity[]
  readonly scheduledAt: string
}): CanonicalProfessionalGpuFairQueueSchedule {
  const safeInput = cloneBoundedPlainSerializedData(
    input,
    'professional_gpu_fair_queue_input',
  ) as typeof input
  const scheduleId = safeId.parse(safeInput.scheduleId)
  const queueEntries = z.array(queueEntrySchema).max(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  ).parse(safeInput.queueEntries)
  const activeAttempts = z.array(activeAttemptSchema).max(192)
    .parse(safeInput.activeAttempts)
  const capacities = z.array(capacitySchema).min(1).max(3)
    .parse(safeInput.capacities)
  const scheduledAt = timestamp.parse(safeInput.scheduledAt)
  assertInputIdentities(queueEntries, activeAttempts, capacities)

  const canonicalQueueEntries = [...queueEntries].sort(compareEntries)
  const canonicalActiveAttempts = [...activeAttempts].sort(compareActiveAttempts)
  const canonicalCapacities = [...capacities].sort((left, right) =>
    routeOrder(left.routeId) - routeOrder(right.routeId))
  const admitted: CanonicalProfessionalGpuFairQueueEntry[] = []
  const deferred: Array<{
    readonly entry: CanonicalProfessionalGpuFairQueueEntry
    readonly reason: z.infer<typeof deferredRefSchema>['reason']
  }> = []
  const knownRoutes = new Set(canonicalCapacities.map((capacity) =>
    capacity.routeId))
  if (canonicalQueueEntries.some((entry) => !knownRoutes.has(entry.routeId))
    || canonicalActiveAttempts.some((entry) =>
      !knownRoutes.has(entry.routeId))) {
    throw new Error('GPU queue has no current capacity observation for route.')
  }
  const availableByRoute = new Map<
    CanonicalProfessionalGpuFairQueueEntry['routeId'],
    number
  >()
  for (const capacity of canonicalCapacities) {
    const routeActive = canonicalActiveAttempts.filter((attempt) =>
      attempt.routeId === capacity.routeId)
    if (routeActive.length !== capacity.currentActiveAttempts) {
      throw new Error('GPU route capacity and active attempts differ.')
    }
    availableByRoute.set(
      capacity.routeId,
      capacity.maximumConcurrentAttempts - capacity.currentActiveAttempts,
    )
  }
  const activeByWorkspace = countByWorkspace(canonicalActiveAttempts)
  if ([...activeByWorkspace.values()].some((count) =>
    count > CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE)) {
    throw new Error('GPU workspace active count exceeds the fairness limit.')
  }
  const lanes = groupWorkspaceLanes(canonicalQueueEntries)
  while ([...availableByRoute.values()].some((available) => available > 0)
    && [...lanes.values()].some((lane) => lane.length > 0)) {
    let admittedThisRound = 0
    const laneOrder = [...lanes.entries()].filter(([, lane]) =>
      lane.length > 0).sort((left, right) =>
      compareEntries(left[1][0]!, right[1][0]!)
        || compareUtf16(left[0], right[0]))
    for (const [workspaceId, lane] of laneOrder) {
      const active = activeByWorkspace.get(workspaceId) ?? 0
      if (active >= CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE) {
        continue
      }
      const eligibleIndex = lane.findIndex((entry) =>
        (availableByRoute.get(entry.routeId) ?? 0) > 0)
      if (eligibleIndex < 0) continue
      const [entry] = lane.splice(eligibleIndex, 1)
      if (!entry) continue
      admitted.push(entry)
      activeByWorkspace.set(workspaceId, active + 1)
      availableByRoute.set(
        entry.routeId,
        (availableByRoute.get(entry.routeId) ?? 0) - 1,
      )
      admittedThisRound += 1
    }
    if (admittedThisRound === 0) break
  }
  const admittedIds = new Set(admitted.map((entry) => entry.queueEntryId))
  for (const entry of canonicalQueueEntries) {
    if (admittedIds.has(entry.queueEntryId)) continue
    deferred.push({
      entry,
      reason: (activeByWorkspace.get(entry.workspaceId) ?? 0) >=
        CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE
        ? 'workspace_concurrency_limit'
        : 'route_capacity_busy',
    })
  }
  const capacityObservationRefs = canonicalCapacities.map((capacity) =>
    capacity.capacityObservationRef)
  const queueSnapshotRef = contentRef(
    `gpu-queue-snapshot:${scheduleId}`,
    {
      queueEntries: canonicalQueueEntries,
      activeAttempts: canonicalActiveAttempts,
      capacities: canonicalCapacities,
    },
  )
  const payload = scheduleWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_SCHEDULE_VERSION,
    source: 'canonical_server_gpu_fair_queue_scheduler',
    evidenceClass: 'deterministic_server_schedule',
    scheduleId,
    queueSnapshotRef,
    capacityObservationRefs,
    inputQueueEntryCount: queueEntries.length,
    inputActiveAttemptCount: activeAttempts.length,
    admittedEntries: admitted.map(scheduledRef),
    deferredEntries: deferred.map(({ entry, reason }) => ({
      ...scheduledRef(entry),
      reason,
    })),
    admittedCount: admitted.length,
    deferredCount: deferred.length,
    maximumActiveAttemptsPerWorkspace:
      CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE,
    workspaceRoundRobinFairnessApplied: true,
    editLevelDoesNotChangeOutputQualityOrBypassFairness: true,
    overloadDisposition: 'remain_queued_with_backpressure',
    cpuSubstantiveFallbackAllowed: false,
    automaticQualityReductionAllowed: false,
    silentAdditionalCreditApprovalAllowed: false,
    callerSelectedPriorityCapacityOrRouteAccepted: false,
    cloudGpuDispatchStarted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    scheduledAt,
  })
  return assertCanonicalProfessionalGpuFairQueueSchedule({
    ...payload,
    scheduleHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalGpuFairQueueSchedule(
  value: unknown,
): CanonicalProfessionalGpuFairQueueSchedule {
  const safeValue = cloneBoundedPlainSerializedData(
    value,
    'professional_gpu_fair_queue_schedule',
  )
  const parsed = canonicalProfessionalGpuFairQueueScheduleSchema.parse(safeValue)
  const { scheduleHash, ...payload } = parsed
  if (scheduleHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU fair-queue schedule digest changed.')
  }
  return parsed
}

function assertInputIdentities(
  queueEntries: readonly CanonicalProfessionalGpuFairQueueEntry[],
  activeAttempts: readonly CanonicalProfessionalGpuFairQueueActiveAttempt[],
  capacities: readonly CanonicalProfessionalGpuFairQueueCapacity[],
): void {
  const queueIds = queueEntries.map((entry) => entry.queueEntryId)
  const queueAttempts = queueEntries.map((entry) =>
    stableAuthorityStringify(entry.executionAttemptRef))
  const activeIds = activeAttempts.map((entry) => entry.queueEntryId)
  const activeRefs = activeAttempts.map((entry) =>
    stableAuthorityStringify(entry.executionAttemptRef))
  const capacityRoutes = capacities.map((entry) => entry.routeId)
  if (new Set(queueIds).size !== queueIds.length
    || new Set(queueAttempts).size !== queueAttempts.length
    || new Set(activeIds).size !== activeIds.length
    || new Set(activeRefs).size !== activeRefs.length
    || queueIds.some((id) => activeIds.includes(id))
    || queueAttempts.some((value) => activeRefs.includes(value))
    || new Set(capacityRoutes).size !== capacityRoutes.length) {
    throw new Error('GPU fair-queue input repeats or crosses identities.')
  }
}

function cloneBoundedPlainSerializedData(
  value: unknown,
  label: string,
  state: { readonly seen: Set<object>; entries: number } = {
    seen: new Set<object>(),
    entries: 0,
  },
  depth = 0,
): unknown {
  if (depth > 16) throw new Error(`${label} nesting is too deep.`)
  if (value === null || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))) return value
  if (typeof value === 'string') {
    if (value.length > 16_384) throw new Error(`${label} string is too long.`)
    return value
  }
  if (typeof value !== 'object') {
    throw new Error(`${label} is not serialized plain data.`)
  }
  if (state.seen.has(value)) throw new Error(`${label} contains a cycle.`)
  let ownKeys: readonly PropertyKey[]
  let descriptors: PropertyDescriptorMap
  let prototype: object | null
  try {
    prototype = Object.getPrototypeOf(value)
    ownKeys = Reflect.ownKeys(value)
    descriptors = Object.getOwnPropertyDescriptors(value)
  } catch {
    throw new Error(`${label} could not be inspected safely.`)
  }
  const isArray = Array.isArray(value)
  if (prototype !== (isArray ? Array.prototype : Object.prototype)) {
    throw new Error(`${label} has a non-plain prototype.`)
  }
  if (ownKeys.some((key) => typeof key !== 'string')) {
    throw new Error(`${label} has a symbol key.`)
  }
  state.entries += ownKeys.length
  if (state.entries > 500_000) {
    throw new Error(`${label} serialized tree is too large.`)
  }
  state.seen.add(value)
  if (isArray) {
    const lengthDescriptor = descriptors.length
    if (!lengthDescriptor || !('value' in lengthDescriptor)
      || !Number.isSafeInteger(lengthDescriptor.value)
      || lengthDescriptor.value < 0
      || lengthDescriptor.value > CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES) {
      throw new Error(`${label} exceeds its bounded array length.`)
    }
    const length = lengthDescriptor.value as number
    if (ownKeys.length !== length + 1) {
      throw new Error(`${label} must be dense and index-only.`)
    }
    const cloned = Array.from({ length }, (_, index) => {
      const descriptor = descriptors[String(index)]
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label}[${index}] must be a data property.`)
      }
      return cloneBoundedPlainSerializedData(
        descriptor.value,
        `${label}[${index}]`,
        state,
        depth + 1,
      )
    })
    state.seen.delete(value)
    return cloned
  }
  if (ownKeys.length > 512) {
    throw new Error(`${label} has too many object entries.`)
  }
  const cloned: Record<string, unknown> = {}
  for (const key of ownKeys as readonly string[]) {
    const descriptor = descriptors[key]
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${label}.${key} must be a data property.`)
    }
    cloned[key] = cloneBoundedPlainSerializedData(
      descriptor.value,
      `${label}.${key}`,
      state,
      depth + 1,
    )
  }
  state.seen.delete(value)
  return cloned
}

function groupWorkspaceLanes(
  entries: readonly CanonicalProfessionalGpuFairQueueEntry[],
): Map<string, CanonicalProfessionalGpuFairQueueEntry[]> {
  const lanes = new Map<string, CanonicalProfessionalGpuFairQueueEntry[]>()
  for (const entry of entries) {
    const lane = lanes.get(entry.workspaceId) ?? []
    lane.push(entry)
    lanes.set(entry.workspaceId, lane)
  }
  return lanes
}

function countByWorkspace(
  entries: readonly CanonicalProfessionalGpuFairQueueActiveAttempt[],
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    counts.set(entry.workspaceId, (counts.get(entry.workspaceId) ?? 0) + 1)
  }
  return counts
}

function compareEntries(
  left: CanonicalProfessionalGpuFairQueueEntry,
  right: CanonicalProfessionalGpuFairQueueEntry,
): number {
  return compareUtf16(left.enqueuedAt, right.enqueuedAt)
    || left.enqueueOrdinal - right.enqueueOrdinal
    || compareUtf16(left.queueEntryId, right.queueEntryId)
}

function compareActiveAttempts(
  left: CanonicalProfessionalGpuFairQueueActiveAttempt,
  right: CanonicalProfessionalGpuFairQueueActiveAttempt,
): number {
  return compareUtf16(left.startedAt, right.startedAt)
    || compareUtf16(left.queueEntryId, right.queueEntryId)
}

function routeOrder(
  routeId: CanonicalProfessionalGpuFairQueueEntry['routeId'],
): number {
  return routeId === 'a100_80gb_heavy_primary'
    ? 0
    : routeId === 'l4_heavy_fallback'
      ? 1
      : 2
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function scheduledRef(entry: CanonicalProfessionalGpuFairQueueEntry) {
  return scheduledRefSchema.parse({
    queueEntryId: entry.queueEntryId,
    executionAttemptRef: entry.executionAttemptRef,
    workspaceId: entry.workspaceId,
    routeId: entry.routeId,
  })
}

function contentRef(id: string, value: unknown) {
  const hash = sha256AuthorityValue(value)
  return refSchema.parse({ id, version: 1, contentHash: `sha256:${hash}` })
}
