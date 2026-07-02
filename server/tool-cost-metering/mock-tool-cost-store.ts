import { buildToolCostSummaryFromEvents } from './tool-cost-summary'
import {
  buildPricingSnapshot,
  calculateToolActualCostMicros,
  createToolCostCredits,
  internalMicrosToCents,
  microsToCentsCeil,
} from './cost-math'
import { TOOL_COST_RATE_CARD_VERSION } from './rate-card'
import type {
  CalculateToolActualCostMicrosInput,
  MockToolCostEvent,
  ToolCostEvent,
  ToolCostPricingSnapshot,
  ToolCostSummary,
  ToolCostUsageCategory,
  ToolRuntimeComputeLevel,
} from './types'

const eventsByIdempotencyKey = new Map<string, ToolCostEvent>()
const eventsByProject = new Map<string, ToolCostEvent[]>()

export function recordMockToolCostEvent(idempotencyKey: string, event: ToolCostEvent): {
  event: ToolCostEvent
  replayed: boolean
} {
  const existing = eventsByIdempotencyKey.get(idempotencyKey)
  if (existing) return { event: existing, replayed: true }

  eventsByIdempotencyKey.set(idempotencyKey, event)
  const projectKey = projectStoreKey(event.workspaceId, event.projectId)
  eventsByProject.set(projectKey, [...(eventsByProject.get(projectKey) ?? []), event])
  return { event, replayed: false }
}

export function buildMockToolCostSummary(workspaceId: string, projectId: string): ToolCostSummary {
  const events = eventsByProject.get(projectStoreKey(workspaceId, projectId)) ?? []
  return buildToolCostSummaryFromEvents(workspaceId, projectId, events, [
    'Mock in-memory summary only; production aggregation requires backend persistence.',
    'ReEditPro service/edit fee is intentionally excluded.',
  ])
}

export function resetMockToolCostStore(): void {
  eventsByIdempotencyKey.clear()
  eventsByProject.clear()
}

export interface MockToolCostStore {
  toolCostEvents: MockToolCostEvent[]
}

export interface CreateMockToolCostEventInput {
  id: string
  workspaceId: string
  projectId: string
  creditEstimateId?: string | null
  creditReservationId?: string | null
  label: string
  usageCategory: ToolCostUsageCategory
  lineItemType?: string
  computeLevel?: ToolRuntimeComputeLevel
  billableToUser?: boolean
  actualInternalCostCents?: number
  actualInternalCostMicros?: number
  actualCostInput?: CalculateToolActualCostMicrosInput
  pricingSnapshot?: ToolCostPricingSnapshot
  failureCategory?: MockToolCostEvent['failureCategory']
  retryAttempt?: number
  idempotencyKey?: string | null
  nonBillableReason?: string
  metadata?: Record<string, unknown>
}

export function createMockToolCostStore(events: MockToolCostEvent[] = []): MockToolCostStore {
  return {
    toolCostEvents: [...events],
  }
}

export function createMockToolCostEvent(input: CreateMockToolCostEventInput): MockToolCostEvent {
  const calculated = resolveMockToolCost(input)
  const credits = createToolCostCredits(calculated.actualInternalCostCents)
  return {
    id: input.id,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    creditEstimateId: input.creditEstimateId ?? null,
    creditReservationId: input.creditReservationId ?? null,
    label: input.label,
    usageCategory: input.usageCategory,
    lineItemType: input.lineItemType,
    computeLevel: input.computeLevel ?? 'standard',
    billableToUser: input.billableToUser ?? true,
    serviceFeeIncluded: false,
    sourceKind: calculated.sourceKind,
    actualInternalCostMicros: calculated.actualInternalCostMicros,
    actualInternalCostCents: calculated.actualInternalCostCents,
    toolCostCredits: credits,
    credits,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    pricingSnapshot: calculated.pricingSnapshot,
    failureCategory: input.failureCategory ?? 'none',
    retryAttempt: input.retryAttempt ?? 0,
    idempotencyKey: input.idempotencyKey ?? null,
    nonBillableReason: input.nonBillableReason,
    createdAt: new Date().toISOString(),
    metadata: {
      mockOnly: true,
      ownerReportsActualInternalToolCostOnly: true,
      serviceFeeIncluded: false,
      rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
      ...(input.metadata ?? {}),
    },
  }
}

export function insertMockToolCostEvent(
  store: MockToolCostStore,
  event: MockToolCostEvent,
): MockToolCostEvent {
  store.toolCostEvents.push(event)
  return event
}

export function getMockToolCostEvent(
  store: MockToolCostStore,
  id: string,
): MockToolCostEvent | undefined {
  return store.toolCostEvents.find((event) => event.id === id)
}

export function getMockToolCostEventByIdempotencyKey(
  store: MockToolCostStore,
  workspaceId: string,
  projectId: string,
  idempotencyKey: string,
): MockToolCostEvent | undefined {
  return store.toolCostEvents.find((event) =>
    event.workspaceId === workspaceId &&
    event.projectId === projectId &&
    event.idempotencyKey === idempotencyKey
  )
}

export function listMockToolCostEventsForProject(
  store: MockToolCostStore,
  projectId: string,
): MockToolCostEvent[] {
  return store.toolCostEvents.filter((event) => event.projectId === projectId)
}

export function listMockToolCostEventsByIds(
  store: MockToolCostStore,
  eventIds: readonly string[],
): MockToolCostEvent[] {
  const requested = new Set(eventIds)
  return store.toolCostEvents.filter((event) => requested.has(event.id))
}

function projectStoreKey(workspaceId: string, projectId: string): string {
  return `${workspaceId}:${projectId}`
}

function resolveMockToolCost(input: CreateMockToolCostEventInput): {
  sourceKind: MockToolCostEvent['sourceKind']
  actualInternalCostMicros: number
  actualInternalCostCents: number
  pricingSnapshot: ToolCostPricingSnapshot
} {
  if (input.actualCostInput) {
    const calculated = calculateToolActualCostMicros(input.actualCostInput)
    if (!calculated.ok) throw new Error(calculated.error.message)
    const cents = microsToCentsCeil(calculated.data.actualInternalCostMicros)
    if (!cents.ok) throw new Error(cents.error.message)
    return {
      sourceKind: calculated.data.sourceKind,
      actualInternalCostMicros: calculated.data.actualInternalCostMicros,
      actualInternalCostCents: cents.data,
      pricingSnapshot: input.pricingSnapshot ?? calculated.data.pricingSnapshot,
    }
  }

  if (input.actualInternalCostMicros !== undefined) {
    const cents = microsToCentsCeil(input.actualInternalCostMicros)
    if (!cents.ok) throw new Error(cents.error.message)
    const snapshot = input.pricingSnapshot
      ? input.pricingSnapshot
      : buildRequiredPricingSnapshot({
          sourceKind: 'mock_manual_entry',
          pricingUnits: {
            actualInternalCostMicros: input.actualInternalCostMicros,
            actualInternalCostCents: cents.data,
          },
        })
    return {
      sourceKind: 'mock_manual_entry',
      actualInternalCostMicros: input.actualInternalCostMicros,
      actualInternalCostCents: cents.data,
      pricingSnapshot: snapshot,
    }
  }

  if (input.actualInternalCostCents !== undefined) {
    const micros = input.actualInternalCostCents * 10_000
    const snapshot = input.pricingSnapshot
      ? input.pricingSnapshot
      : buildRequiredPricingSnapshot({
          sourceKind: 'mock_manual_entry',
          pricingUnits: {
            actualInternalCostMicros: micros,
            actualInternalCostCents: input.actualInternalCostCents,
          },
        })
    return {
      sourceKind: 'mock_manual_entry',
      actualInternalCostMicros: micros,
      actualInternalCostCents: internalMicrosToCents(micros),
      pricingSnapshot: snapshot,
    }
  }

  throw new Error('actualInternalCostCents, actualInternalCostMicros, or actualCostInput is required.')
}

function buildRequiredPricingSnapshot(input: Parameters<typeof buildPricingSnapshot>[0]): ToolCostPricingSnapshot {
  const snapshot = buildPricingSnapshot(input)
  if (!snapshot.ok) throw new Error(snapshot.error.message)
  return snapshot.data
}
