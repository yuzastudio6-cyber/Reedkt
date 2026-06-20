import type {
  ProductionToolId,
} from '../tool-registry'
import {
  getOperationDefinition,
} from './operation-ontology'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationDefinition,
  ToolCallingOperationId,
} from './operation-ontology'
import {
  listSelectableToolCapabilityCards,
  OPERATION_TOOL_SEEDS,
} from './tool-capability-card-loader'
import type {
  ToolCapabilityCard,
} from './tool-capability-card-types'

const artifactAliases: Record<string, readonly string[]> = {
  audio: ['extracted_audio', 'processed_audio', 'cleaned_audio'],
  extracted_audio: ['audio'],
  processed_audio: ['audio', 'cleaned_audio'],
  video: ['source_media', 'proxy_media', 'proxy_video', 'processed_video', 'preview_video', 'final_export'],
  source_media: ['video', 'audio'],
  proxy_media: ['video', 'proxy_video'],
  proxy_video: ['proxy_media', 'video'],
  processed_video: ['video', 'enhanced_video', 'interpolated_video'],
  image: ['image_asset', 'keyframe_image', 'representative_frame'],
  image_asset: ['image', 'keyframe_image', 'representative_frame'],
  caption_segments: ['caption_segments_json'],
  caption_segments_json: ['caption_segments'],
  mask: ['mask_image', 'mask_sequence'],
  mask_image: ['mask'],
  mask_sequence: ['mask'],
  timeline_manifest: ['opentimelineio_manifest', 'render_manifest'],
  opentimelineio_manifest: ['timeline_manifest'],
  render_manifest: ['timeline_manifest'],
  analysis_report: ['json_spec', 'qa_report'],
  qa_report: ['analysis_report', 'json_spec'],
}

function expandArtifact(artifactType: ToolCallingArtifactType | string): Set<string> {
  return new Set([artifactType, ...(artifactAliases[artifactType] ?? [])])
}

export function artifactsCompatible(
  requestedArtifact: ToolCallingArtifactType | string,
  availableArtifacts: readonly (ToolCallingArtifactType | string)[],
): boolean {
  const requested = expandArtifact(requestedArtifact)
  return availableArtifacts.some((artifact) => requested.has(artifact) || expandArtifact(artifact).has(requestedArtifact))
}

export function listToolCapabilityCards(): ToolCapabilityCard[] {
  return listSelectableToolCapabilityCards()
}

export function getToolCapabilityCard(toolId: ProductionToolId | string): ToolCapabilityCard | undefined {
  return listToolCapabilityCards().find((card) => card.toolId === toolId || card.aliases?.includes(toolId))
}

export function findToolsForOperation(operationId: ToolCallingOperationId | string): ToolCapabilityCard[] {
  const operation = getOperationDefinition(operationId)
  if (!operation) return []

  const resolvedOperationId = operation.operationId as ToolCallingOperationId
  const seededToolIds = new Set<ProductionToolId>(OPERATION_TOOL_SEEDS[resolvedOperationId])

  return listToolCapabilityCards()
    .filter((card) => card.operations.includes(resolvedOperationId) || seededToolIds.has(card.toolId))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
}

export function findToolsProducingArtifact(artifactType: ToolCallingArtifactType | string): ToolCapabilityCard[] {
  return listToolCapabilityCards()
    .filter((card) => artifactsCompatible(artifactType, card.outputArtifacts))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
}

export function findToolsConsumingArtifact(artifactType: ToolCallingArtifactType | string): ToolCapabilityCard[] {
  return listToolCapabilityCards()
    .filter((card) => artifactsCompatible(artifactType, card.inputArtifacts))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
}

export {
  getOperationDefinition,
  OPERATION_TOOL_SEEDS,
}
export type { ToolCallingOperationDefinition }
