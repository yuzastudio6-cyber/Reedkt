import { centsToCredits } from './cost-math'
import { toolCostRateCard } from './rate-card'
import { TOOL_COST_USAGE_CATEGORIES, type ToolCostEvent, type ToolCostSummary } from './types'

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
  const billableEvents = events.filter((event) => event.billableToUser)
  const nonBillableEvents = events.filter((event) => !event.billableToUser)
  const actualToolCostCents = billableEvents.reduce((sum, event) => sum + event.actualInternalCostCents, 0)
  const byUsageCategory = Object.fromEntries(TOOL_COST_USAGE_CATEGORIES.map((category) => {
    const matchingEvents = billableEvents.filter((event) => event.usageCategory === category)
    const actualInternalCostCents = matchingEvents.reduce((sum, event) => sum + event.actualInternalCostCents, 0)
    return [category, {
      eventCount: matchingEvents.length,
      actualInternalCostCents,
      credits: centsToCredits(actualInternalCostCents),
    }]
  })) as ToolCostSummary['byUsageCategory']

  return {
    workspaceId,
    projectId,
    rateCardVersion: toolCostRateCard.version,
    billableEventCount: billableEvents.length,
    nonBillableEventCount: nonBillableEvents.length,
    actualToolCostCents,
    actualToolCostCredits: centsToCredits(actualToolCostCents),
    byUsageCategory,
    events,
    warnings: [
      'Mock in-memory summary only; production aggregation requires backend persistence.',
      'ReEditPro service/edit fee is intentionally excluded.',
    ],
  }
}

export function resetMockToolCostStore(): void {
  eventsByIdempotencyKey.clear()
  eventsByProject.clear()
}

function projectStoreKey(workspaceId: string, projectId: string): string {
  return `${workspaceId}:${projectId}`
}
