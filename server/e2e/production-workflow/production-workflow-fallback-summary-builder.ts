import type { ProductionWorkflowFallbackSummary, ProductionWorkflowStageResult } from './production-workflow-types'

export function buildProductionWorkflowFallbackSummary(stageResults: ProductionWorkflowStageResult[]): ProductionWorkflowFallbackSummary {
  const decisions = stageResults.flatMap((stage) => [
    ...stage.skippedReasons.map((reason) => `${stage.stage}:${reason}`),
    ...stage.fallbackDecisions.map((decision) => `${stage.stage}:${decision}`),
  ])
  const text = decisions.join('\n').toLowerCase()
  const qaBlocked = stageResults.some((stage) => stage.qaResults.some((gate) => gate.blocking || gate.status === 'blocked' || gate.status === 'failed'))

  return {
    modelUnavailable: countMatches(text, ['model', 'checkpoint', 'weight']),
    readinessBlocked: countMatches(text, ['readiness', 'production_ready']),
    toolUnavailable: countMatches(text, ['unavailable', 'missing', 'not installed', 'skip']),
    qaBlocked: qaBlocked ? 1 : 0,
    localDevSkipped: countMatches(text, ['local_dev', 'disabled', 'not_enabled']),
    productionBlocked: countMatches(text, ['production', 'blocked']),
    qaBypassDetected: decisions.some((decision) => /bypass.*qa|skip.*blocking qa/i.test(decision)),
    decisions,
  }
}

function countMatches(text: string, patterns: string[]): number {
  return patterns.reduce((count, pattern) => count + (text.includes(pattern) ? 1 : 0), 0)
}
