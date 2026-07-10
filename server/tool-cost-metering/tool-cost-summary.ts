import { centsToCredits } from './cost-math'
import { toolCostRateCard } from './rate-card'
import { TOOL_COST_USAGE_CATEGORIES, type ToolCostEvent, type ToolCostSummary } from './types'

export function buildToolCostSummaryFromEvents(
  workspaceId: string,
  projectId: string,
  events: ToolCostEvent[],
  warnings: string[],
): ToolCostSummary {
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
    warnings,
  }
}
