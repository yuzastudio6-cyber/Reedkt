import type {
  CleanAssembly,
  CleanAssemblySegment,
  CleanupPlan,
  CleanupPlanItem,
  CleanupReviewItemState,
  SourceTimeMapping,
  WorkflowTimeRange,
} from '../../types'
import { MOCK_CREATED_AT } from './mock-footage-prep-data'
import { createSourceTimeMapping } from './source-time-mapping'

type RebuildCleanAssemblyFromReviewInput = {
  cleanupPlan: CleanupPlan
  cleanupPlanItems: CleanupPlanItem[]
  baseCleanAssembly: CleanAssembly
  baseCleanAssemblySegments: CleanAssemblySegment[]
  baseSourceTimeMappings: SourceTimeMapping[]
  itemStates: CleanupReviewItemState[]
  accepted?: boolean
  operationCount?: number
}

function rangesOverlap(first: WorkflowTimeRange, second: WorkflowTimeRange) {
  return first.startMs < second.endMs && first.endMs > second.startMs
}

function rangeDuration(range: WorkflowTimeRange) {
  return Math.max(0, range.endMs - range.startMs)
}

function itemStateFor(itemStates: CleanupReviewItemState[], cleanupPlanItemId: string) {
  return itemStates.find((state) => state.cleanupPlanItemId === cleanupPlanItemId)
}

function segmentMatchesItem(segment: CleanAssemblySegment, item: CleanupPlanItem) {
  return segment.cleanupPlanItemIds?.includes(item.id) || rangesOverlap(segment.rawSourceRange, item.sourceRange)
}

function restoredSegmentId(baseCleanAssembly: CleanAssembly, cleanupPlanItemId: string) {
  return `${baseCleanAssembly.id}-restored-segment-${cleanupPlanItemId}`
}

function restoredMappingId(baseCleanAssembly: CleanAssembly, cleanupPlanItemId: string) {
  return `${baseCleanAssembly.id}-review-source-time-map-${cleanupPlanItemId}`
}

function hasMatchingSourceSegment(segments: CleanAssemblySegment[], item: CleanupPlanItem) {
  return segments.some((segment) => segmentMatchesItem(segment, item))
}

function buildRestoredSegment(input: {
  baseCleanAssembly: CleanAssembly
  item: CleanupPlanItem
}): CleanAssemblySegment {
  return {
    id: restoredSegmentId(input.baseCleanAssembly, input.item.id),
    projectId: input.item.projectId,
    workspaceId: input.item.workspaceId,
    userId: input.item.userId,
    cleanAssemblyId: input.baseCleanAssembly.id,
    mediaAssetId: input.item.mediaAssetId,
    kind: 'user_restored',
    rawSourceRange: input.item.sourceRange,
    cleanAssemblyRange: { startMs: 0, endMs: rangeDuration(input.item.sourceRange) },
    label: `Restored: ${input.item.label ?? input.item.reason.replaceAll('_', ' ')}`,
    transcriptText: input.item.explanation,
    sourceTimeMappingId: restoredMappingId(input.baseCleanAssembly, input.item.id),
    cleanupPlanItemIds: [input.item.id],
    locked: false,
    userRestored: true,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

function compareSegmentsBySource(first: CleanAssemblySegment, second: CleanAssemblySegment) {
  if (first.rawSourceRange.startMs !== second.rawSourceRange.startMs) {
    return first.rawSourceRange.startMs - second.rawSourceRange.startMs
  }

  return first.rawSourceRange.endMs - second.rawSourceRange.endMs
}

function recomputeCleanRanges(segments: CleanAssemblySegment[], cleanAssemblyId: string) {
  let nextStartMs = 0

  return segments.sort(compareSegmentsBySource).map((segment) => {
    const durationMs = rangeDuration(segment.rawSourceRange)
    const cleanAssemblyRange = {
      startMs: nextStartMs,
      endMs: nextStartMs + durationMs,
    }
    nextStartMs = cleanAssemblyRange.endMs

    return {
      ...segment,
      cleanAssemblyId,
      cleanAssemblyRange,
      updatedAt: MOCK_CREATED_AT,
    }
  })
}

function buildSegmentMapping(input: {
  segment: CleanAssemblySegment
  baseMapping?: SourceTimeMapping
}): SourceTimeMapping {
  const mappingReason = input.segment.userRestored
    ? 'kept'
    : input.baseMapping?.cleanAssemblyRange?.startMs === input.segment.cleanAssemblyRange.startMs &&
      input.baseMapping.cleanAssemblyRange.endMs === input.segment.cleanAssemblyRange.endMs
      ? input.baseMapping.mappingReason
      : 'moved'

  return createSourceTimeMapping({
    id: input.segment.sourceTimeMappingId ?? `${input.segment.id}-source-time-map`,
    mediaAssetId: input.segment.mediaAssetId,
    rawSourceRange: input.segment.rawSourceRange,
    cleanAssemblyRange: input.segment.cleanAssemblyRange,
    mappingReason,
    confidence: input.baseMapping?.confidence ?? 0.9,
  })
}

export function rebuildCleanAssemblyFromReview(input: RebuildCleanAssemblyFromReviewInput): {
  cleanAssembly: CleanAssembly
  cleanAssemblySegments: CleanAssemblySegment[]
  sourceTimeMappings: SourceTimeMapping[]
} {
  const hasReviewOperations = Boolean(input.operationCount && input.operationCount > 0)
  const cleanAssemblyId = hasReviewOperations ? `${input.baseCleanAssembly.id}-review` : input.baseCleanAssembly.id
  const restoredItemIds = new Set(
    input.itemStates
      .filter((state) => state.decision === 'restored')
      .map((state) => state.cleanupPlanItemId),
  )
  const doNotUseItemIds = new Set(
    input.itemStates
      .filter((state) => state.decision === 'marked_do_not_use')
      .map((state) => state.cleanupPlanItemId),
  )

  const segments: CleanAssemblySegment[] = input.baseCleanAssemblySegments
    .filter((segment) =>
      !segment.userRestored ||
      !segment.cleanupPlanItemIds?.some((itemId) => doNotUseItemIds.has(itemId)),
    )
    .map((segment) => {
      const important = segment.cleanupPlanItemIds?.some((itemId) =>
        itemStateFor(input.itemStates, itemId)?.decision === 'marked_important',
      )

      return {
        ...segment,
        cleanAssemblyId,
        locked: Boolean(segment.locked || important),
        updatedAt: MOCK_CREATED_AT,
      }
    })

  input.cleanupPlanItems.forEach((item) => {
    if (!restoredItemIds.has(item.id) || doNotUseItemIds.has(item.id)) {
      return
    }

    if (hasMatchingSourceSegment(segments, item)) {
      return
    }

    segments.push(buildRestoredSegment({
      baseCleanAssembly: { ...input.baseCleanAssembly, id: cleanAssemblyId },
      item,
    }))
  })

  const cleanAssemblySegments = recomputeCleanRanges(segments, cleanAssemblyId)
  const usedMappingIds = new Set(cleanAssemblySegments.map((segment) => segment.sourceTimeMappingId).filter(Boolean))
  const restoredRanges = input.cleanupPlanItems
    .filter((item) => restoredItemIds.has(item.id))
    .map((item) => item.sourceRange)

  const segmentMappings = cleanAssemblySegments.map((segment) =>
    buildSegmentMapping({
      segment,
      baseMapping: input.baseSourceTimeMappings.find((mapping) => mapping.id === segment.sourceTimeMappingId),
    }),
  )

  const preservedBaseMappings = input.baseSourceTimeMappings.filter((mapping) => {
    if (usedMappingIds.has(mapping.id)) {
      return false
    }

    if (mapping.mappingReason === 'removed' && restoredRanges.some((range) => rangesOverlap(mapping.rawSourceRange, range))) {
      return false
    }

    return true
  })

  const durationMs = cleanAssemblySegments.at(-1)?.cleanAssemblyRange.endMs ?? 0
  const sourceTimeMappings = [...segmentMappings, ...preservedBaseMappings]
  const cleanAssembly: CleanAssembly = {
    ...input.baseCleanAssembly,
    id: cleanAssemblyId,
    status: input.accepted ? 'accepted' : 'ready',
    durationMs,
    segmentIds: cleanAssemblySegments.map((segment) => segment.id),
    sourceTimeMappingIds: sourceTimeMappings.map((mapping) => mapping.id),
    summary: hasReviewOperations
      ? 'A locally reviewed Clean Assembly is ready with non-destructive source references and updated raw-to-clean mappings.'
      : input.baseCleanAssembly.summary,
    version: hasReviewOperations ? input.baseCleanAssembly.version + 1 : input.baseCleanAssembly.version,
    updatedAt: MOCK_CREATED_AT,
  }

  return {
    cleanAssembly,
    cleanAssemblySegments,
    sourceTimeMappings,
  }
}
