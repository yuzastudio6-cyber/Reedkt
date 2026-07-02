import type { EditLevelEstimateItemDefinition } from '../../types'
import { listEditLevelEstimateItemDefinitions } from '../../lib/edit-level-estimates-rules'

export interface EditLevelEstimateItemRegistryResult {
  items: EditLevelEstimateItemDefinition[]
  itemCount: number
  mockOnly: true
}

export function listEditLevelEstimateItems(): EditLevelEstimateItemRegistryResult {
  const items = listEditLevelEstimateItemDefinitions()

  return {
    items,
    itemCount: items.length,
    mockOnly: true,
  }
}

export function createEditLevelEstimateItemRegistrySummary() {
  const result = listEditLevelEstimateItems()

  return {
    itemCount: result.itemCount,
    summary: `RP-EDITLEVEL-09 estimate registry exposes ${result.itemCount} mock/local estimate items and executes none of them.`,
    mockOnly: true,
  }
}
