import type {
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionMemoryPackage,
} from '../../types/project-edit-session-memory'

function latestTimestamp(layers: ProjectEditSessionMemoryRecord[]): string {
  const timestamps = layers
    .map((layer) => new Date(layer.updatedAt).getTime())
    .filter((value) => Number.isFinite(value))
  if (!timestamps.length) return new Date().toISOString()
  return new Date(Math.max(...timestamps)).toISOString()
}

function layerName(layer: ProjectEditSessionMemoryLayer): string {
  return layer.replace(/_/g, ' ')
}

export function createProjectEditSessionLayerReadableSummary(
  memory: ProjectEditSessionMemoryRecord,
): string {
  return `${layerName(memory.layer)}: ${memory.summary} (${memory.facts.length} facts, ${memory.preferences.length} preferences, ${memory.warnings.length} warnings)`
}

export function createProjectEditSessionMemoryReadableSummary(
  layers: ProjectEditSessionMemoryRecord[],
): string {
  if (!layers.length) return 'No structured Edit Chat memory has been saved yet.'
  return layers.map(createProjectEditSessionLayerReadableSummary).join(' | ')
}

export function createProjectEditSessionMemoryPackage(input: {
  id?: string
  projectId: string
  editSessionId: string
  layers: ProjectEditSessionMemoryRecord[]
}): ProjectEditSessionMemoryPackage {
  const factsCount = input.layers.reduce((count, layer) => count + layer.facts.length, 0)
  const preferencesCount = input.layers.reduce((count, layer) => count + layer.preferences.length, 0)
  const warningsCount = input.layers.reduce((count, layer) => count + layer.warnings.length, 0)
  return {
    id: input.id ?? `project-edit-session-memory-package-${input.editSessionId}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    layers: input.layers,
    readableSummary: createProjectEditSessionMemoryReadableSummary(input.layers),
    factsCount,
    preferencesCount,
    warningsCount,
    updatedAt: latestTimestamp(input.layers),
    mockOnly: true,
  }
}

export function createProjectEditSessionMemoryDebugSummary(
  memoryPackage: ProjectEditSessionMemoryPackage,
): {
  layerCount: number
  factsCount: number
  preferencesCount: number
  warningsCount: number
  updatedAt: string
  mockOnly: true
} {
  return {
    layerCount: memoryPackage.layers.length,
    factsCount: memoryPackage.factsCount,
    preferencesCount: memoryPackage.preferencesCount,
    warningsCount: memoryPackage.warningsCount,
    updatedAt: memoryPackage.updatedAt,
    mockOnly: true,
  }
}

export function createProjectEditSessionMemoryChatSummary(
  memoryPackage: ProjectEditSessionMemoryPackage,
): string {
  return memoryPackage.layers.length
    ? `Memory refreshed across ${memoryPackage.layers.length} mock layer(s): ${memoryPackage.factsCount} facts, ${memoryPackage.preferencesCount} preferences, ${memoryPackage.warningsCount} warnings.`
    : 'Memory is ready, but no durable mock layer has been saved yet.'
}
