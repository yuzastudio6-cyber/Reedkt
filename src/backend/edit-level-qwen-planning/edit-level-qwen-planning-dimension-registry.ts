import type { EditLevelQwenPlanningDimensionDefinition } from '../../types'
import { listEditLevelQwenPlanningDimensionDefinitions } from '../../lib/edit-level-qwen-planning-rules'

export interface EditLevelQwenPlanningDimensionRegistryResult {
  dimensions: EditLevelQwenPlanningDimensionDefinition[]
  dimensionCount: number
  mockOnly: true
}

export function listEditLevelQwenPlanningDimensions(): EditLevelQwenPlanningDimensionRegistryResult {
  const dimensions = listEditLevelQwenPlanningDimensionDefinitions()

  return {
    dimensions,
    dimensionCount: dimensions.length,
    mockOnly: true,
  }
}

export function createEditLevelQwenPlanningDimensionRegistrySummary() {
  const result = listEditLevelQwenPlanningDimensions()

  return {
    dimensionCount: result.dimensionCount,
    summary: `RP-EDITLEVEL-07 Qwen planning registry exposes ${result.dimensionCount} mock/local dimensions and executes none of them.`,
    mockOnly: true,
  }
}
