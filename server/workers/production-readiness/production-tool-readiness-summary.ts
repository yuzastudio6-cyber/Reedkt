import {
  getLaunchCoreProductionTools,
  getToolsWithModelWeights,
} from '../../tool-registry'
import type { ProductionToolId } from '../../tool-registry'
import type {
  ProductionReadinessStatus,
  ProductionToolReadinessResult,
  ProductionToolReadinessSummary,
} from './production-tool-readiness-types'

const readinessStatuses: ProductionReadinessStatus[] = [
  'passed',
  'warning',
  'missing',
  'blocked',
  'not_installed',
  'future_only',
  'evaluation_only',
  'needs_license_review',
  'pending_manual_review',
  'not_checked',
]

function emptyStatusCounts(): Record<ProductionReadinessStatus, number> {
  return Object.fromEntries(readinessStatuses.map((status) => [status, 0])) as Record<ProductionReadinessStatus, number>
}

function uniqueToolIds(toolIds: ProductionToolId[]): ProductionToolId[] {
  return Array.from(new Set(toolIds))
}

export function summarizeProductionToolReadiness(
  results: ProductionToolReadinessResult[],
): ProductionToolReadinessSummary {
  const statuses = emptyStatusCounts()

  for (const result of results) {
    statuses[result.status] += 1
  }

  return {
    totalSpecs: results.length,
    launchCoreTools: getLaunchCoreProductionTools().map((profile) => profile.toolId),
    missingTools: uniqueToolIds(results
      .filter((result) => result.status === 'missing' || result.status === 'not_installed')
      .map((result) => result.toolId)),
    futureOnlyTools: uniqueToolIds(results
      .filter((result) => result.status === 'future_only')
      .map((result) => result.toolId)),
    evaluationOnlyTools: uniqueToolIds(results
      .filter((result) => result.status === 'evaluation_only')
      .map((result) => result.toolId)),
    modelWeightTools: getToolsWithModelWeights().map((profile) => profile.toolId),
    productionBlockedTools: uniqueToolIds(results
      .filter((result) => result.blocksProduction)
      .map((result) => result.toolId)),
    statuses,
    notes: [
      'Milestone 5 readiness is spec-first and dry-run only; command/import/model checks are not executed.',
      'Launch-core tools are surfaced so future container validation can block worker execution when missing.',
      'Model-weight tools remain blocked until package license and model/checkpoint license reviews are explicit.',
      'Revideo remains evaluation-only and blocked from production readiness.',
      'M10 core install readiness may surface pending_manual_review for FFmpeg LGPL and libass verification.',
      'M11 GPU readiness surfaces model-weight blockers without importing heavy GPU packages by default.',
    ],
  }
}
