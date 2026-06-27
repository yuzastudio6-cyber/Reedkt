import { buildToolCostSummaryFromEvents } from './tool-cost-summary'
import type { ToolCostEvent, ToolCostSummary } from './types'

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

function projectStoreKey(workspaceId: string, projectId: string): string {
  return `${workspaceId}:${projectId}`
}
