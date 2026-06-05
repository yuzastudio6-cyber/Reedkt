import type {
  MetadataRouteCostEntry,
  MetadataRouteCostGuardReport,
} from './metadataRouteDryRunTypes'

export function validateMetadataRouteCostGuard(input: {
  costEntry: MetadataRouteCostEntry | undefined
  hardBlockRequested?: boolean
}): MetadataRouteCostGuardReport {
  const blockedReasons: string[] = []
  if (input.hardBlockRequested) blockedReasons.push('cost_hard_block_requested')
  if (!input.costEntry) blockedReasons.push('duckdb_cost_mapping_missing')
  if (input.costEntry?.toolId !== 'duckdb') blockedReasons.push('duckdb_cost_mapping_missing')
  if (input.costEntry?.executionClass !== 'metadata_only') blockedReasons.push('duckdb_cost_not_metadata_only')
  if (input.costEntry?.estimateAllowed !== true) blockedReasons.push('duckdb_metadata_cost_estimate_blocked')
  if (input.costEntry?.costRiskClass !== 'free_or_negligible') blockedReasons.push('duckdb_metadata_cost_not_free_or_negligible')

  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  const passed = uniqueBlockedReasons.length === 0
  return {
    status: passed ? 'passed' : 'blocked',
    passed,
    blockedReasons: uniqueBlockedReasons,
    warnings: passed ? ['phase44h_cost_snapshot_is_static_planning_metadata'] : [],
    costGuardStatus: passed ? 'passed' : 'blocked',
    billingApiCalls: 'not_run',
    cloudCalls: 'not_run',
    metadataOnlyCostAllowed: passed,
  }
}
