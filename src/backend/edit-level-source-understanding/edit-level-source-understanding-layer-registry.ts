import type {
  EditLevelSourceUnderstandingLayerDefinition,
} from '../../types'
import { listEditLevelSourceUnderstandingLayerDefinitions } from '../../lib/edit-level-source-understanding-rules'

export interface EditLevelSourceUnderstandingLayerRegistryResult {
  layers: EditLevelSourceUnderstandingLayerDefinition[]
  layerCount: number
  mockOnly: true
}

export function listEditLevelSourceUnderstandingLayers(): EditLevelSourceUnderstandingLayerRegistryResult {
  const layers = listEditLevelSourceUnderstandingLayerDefinitions()

  return {
    layers,
    layerCount: layers.length,
    mockOnly: true,
  }
}

export function createEditLevelSourceUnderstandingLayerRegistrySummary() {
  const result = listEditLevelSourceUnderstandingLayers()

  return {
    layerCount: result.layerCount,
    summary: `RP-EDITLEVEL-06 source-understanding registry exposes ${result.layerCount} mock/local layers and executes none of them.`,
    mockOnly: true,
  }
}
