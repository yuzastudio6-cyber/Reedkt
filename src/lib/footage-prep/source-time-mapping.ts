import type { SourceTimeMapping, WorkflowTimeRange } from '../../types'

type CreateSourceTimeMappingInput = {
  id: string
  mediaAssetId: string
  rawSourceRange: WorkflowTimeRange
  cleanAssemblyRange?: WorkflowTimeRange
  finalEditRange?: WorkflowTimeRange
  mappingReason: SourceTimeMapping['mappingReason']
  confidence?: number
}

export function createSourceTimeMapping(input: CreateSourceTimeMappingInput): SourceTimeMapping {
  return {
    id: input.id,
    mediaAssetId: input.mediaAssetId,
    rawSourceRange: input.rawSourceRange,
    cleanAssemblyRange: input.cleanAssemblyRange,
    finalEditRange: input.finalEditRange,
    mappingReason: input.mappingReason,
    confidence: input.confidence,
  }
}

export function mapRawTimeToCleanTime(rawMs: number, mappings: SourceTimeMapping[]): number | undefined {
  const mapping = mappings.find((item) =>
    rawMs >= item.rawSourceRange.startMs &&
    rawMs <= item.rawSourceRange.endMs,
  )

  if (!mapping?.cleanAssemblyRange || mapping.mappingReason === 'removed') {
    return undefined
  }

  const rawDuration = mapping.rawSourceRange.endMs - mapping.rawSourceRange.startMs
  if (rawDuration <= 0) return mapping.cleanAssemblyRange.startMs

  const progress = (rawMs - mapping.rawSourceRange.startMs) / rawDuration
  const cleanDuration = mapping.cleanAssemblyRange.endMs - mapping.cleanAssemblyRange.startMs

  return Math.round(mapping.cleanAssemblyRange.startMs + cleanDuration * progress)
}

export function mapRawRangeToCleanRange(rawRange: WorkflowTimeRange, mappings: SourceTimeMapping[]): WorkflowTimeRange | undefined {
  const startMs = mapRawTimeToCleanTime(rawRange.startMs, mappings)
  const endMs = mapRawTimeToCleanTime(rawRange.endMs, mappings)

  if (startMs === undefined || endMs === undefined) {
    return undefined
  }

  return { startMs, endMs }
}

export function isRawRangeRemoved(rawRange: WorkflowTimeRange, mappings: SourceTimeMapping[]): boolean {
  const overlapping = mappings.filter((mapping) =>
    mapping.rawSourceRange.startMs <= rawRange.endMs &&
    mapping.rawSourceRange.endMs >= rawRange.startMs,
  )

  return overlapping.length > 0 && overlapping.every((mapping) =>
    mapping.mappingReason === 'removed' || !mapping.cleanAssemblyRange,
  )
}
