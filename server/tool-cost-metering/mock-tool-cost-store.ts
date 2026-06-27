import { nowIso } from '../services/service-helpers'
import {
  buildPricingSnapshot,
  calculateToolActualCostMicros,
  createToolCostCredits,
  microsToCentsCeil,
  validatePricingSnapshotHasNoSecrets,
} from './cost-math'
import { COST_MICROS_PER_CENT, TOOL_COST_RATE_CARD_VERSION } from './rate-card'
import type {
  CalculateToolActualCostMicrosInput,
  MockToolCostEvent,
  ToolCostFailureCategory,
  ToolCostPricingSnapshot,
  ToolCostUsageCategory,
  ToolRuntimeComputeLevel,
} from './types'

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
  lineItemType?: MockToolCostEvent['lineItemType']
  computeLevel?: ToolRuntimeComputeLevel
  billableToUser?: boolean
  actualInternalCostCents?: number
  actualInternalCostMicros?: number
  actualCostInput?: CalculateToolActualCostMicrosInput
  pricingSnapshot?: ToolCostPricingSnapshot
  failureCategory?: ToolCostFailureCategory
  retryAttempt?: number
  idempotencyKey?: string | null
  nonBillableReason?: string
  metadata?: MockToolCostEvent['metadata']
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
    createdAt: nowIso(),
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

function resolveMockToolCost(input: CreateMockToolCostEventInput): {
  sourceKind: MockToolCostEvent['sourceKind']
  actualInternalCostMicros: number
  actualInternalCostCents: number
  pricingSnapshot: ToolCostPricingSnapshot
} {
  if (input.pricingSnapshot) {
    const snapshotValidation = validatePricingSnapshotHasNoSecrets(input.pricingSnapshot)
    if (!snapshotValidation.ok) throw new Error(snapshotValidation.error.message)
  }

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
    const snapshot = input.pricingSnapshot ?? buildPricingSnapshot({
      sourceKind: 'mock_manual_entry',
      pricingUnits: {
        actualInternalCostMicros: input.actualInternalCostMicros,
        actualInternalCostCents: cents.data,
      },
    })
    if (!snapshot.ok) throw new Error(snapshot.error.message)
    return {
      sourceKind: 'mock_manual_entry',
      actualInternalCostMicros: input.actualInternalCostMicros,
      actualInternalCostCents: cents.data,
      pricingSnapshot: snapshot.data,
    }
  }

  if (input.actualInternalCostCents !== undefined) {
    const calculated = calculateToolActualCostMicros({
      sourceKind: 'mock_manual_entry',
      actualInternalCostCents: input.actualInternalCostCents,
    })
    if (!calculated.ok) throw new Error(calculated.error.message)
    return {
      sourceKind: 'mock_manual_entry',
      actualInternalCostMicros: input.actualInternalCostCents * COST_MICROS_PER_CENT,
      actualInternalCostCents: input.actualInternalCostCents,
      pricingSnapshot: input.pricingSnapshot ?? calculated.data.pricingSnapshot,
    }
  }

  throw new Error('actualInternalCostCents, actualInternalCostMicros, or actualCostInput is required.')
}
