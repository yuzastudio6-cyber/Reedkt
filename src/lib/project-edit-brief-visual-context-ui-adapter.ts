import type { ProjectEditBriefMarkerRecord } from '../types/project-edit-brief'
import type {
  ProjectEditBriefVisualContext,
  ProjectEditBriefVisualContextRuntimeSource,
} from '../types/project-edit-brief-visual-context'
import {
  PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
} from '../types/project-edit-brief-visual-context'

const CURRENT_RUNTIME_SOURCE =
  'visual_intelligence_authenticated_read' as const
const HISTORICAL_RUNTIME_SOURCES = new Set<ProjectEditBriefVisualContextRuntimeSource>([
  'qwen25vl_live',
  'qwen25vl_fake',
])
const RUNTIME_SOURCES = new Set<ProjectEditBriefVisualContextRuntimeSource>([
  CURRENT_RUNTIME_SOURCE,
  ...HISTORICAL_RUNTIME_SOURCES,
  'deterministic_visual_fallback',
  'blocked_missing_orchestra_report',
  'blocked_provider_error',
  'blocked_validation_error',
])
const CONFIDENCE_VALUES = new Set(['low', 'medium', 'high'])

function isPlainDataRecord(value: unknown): value is Record<string, unknown> {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) return false
    return Object.values(Object.getOwnPropertyDescriptors(value)).every(
      (descriptor) => 'value' in descriptor,
    )
  } catch {
    return false
  }
}

function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false
  try {
    const descriptors = Object.getOwnPropertyDescriptors(value)
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)]
      if (!descriptor || !('value' in descriptor) || typeof descriptor.value !== 'string') {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function visualContextFromUnknown(
  value: unknown,
): ProjectEditBriefVisualContext | undefined {
  if (!isPlainDataRecord(value)) return undefined
  const timeRange = value.timeRange
  if (
    typeof value.id !== 'string'
    || typeof value.projectId !== 'string'
    || typeof value.editSessionId !== 'string'
    || typeof value.briefId !== 'string'
    || typeof value.markerId !== 'string'
    || typeof value.visualSummary !== 'string'
    || typeof value.runtimeSource !== 'string'
    || !RUNTIME_SOURCES.has(value.runtimeSource as ProjectEditBriefVisualContextRuntimeSource)
    || value.runtimeSource === CURRENT_RUNTIME_SOURCE
    || typeof value.boundarySummary !== 'string'
    || !CONFIDENCE_VALUES.has(String(value.confidence))
    || typeof value.sampledFrameCount !== 'number'
    || !Number.isInteger(value.sampledFrameCount)
    || Number(value.sampledFrameCount) < 0
    || !isPlainDataRecord(timeRange)
    || typeof timeRange.startTimeSeconds !== 'number'
    || !Number.isFinite(timeRange.startTimeSeconds)
    || typeof timeRange.endTimeSeconds !== 'number'
    || !Number.isFinite(timeRange.endTimeSeconds)
    || typeof timeRange.label !== 'string'
    || !isStringArray(value.visibleObjects)
    || !isStringArray(value.visiblePeople)
    || !isStringArray(value.actions)
    || !isStringArray(value.visibleText)
    || !isStringArray(value.layoutNotes)
    || !isStringArray(value.brollOpportunities)
    || !isStringArray(value.visualRisks)
    || !isStringArray(value.doNotCopyNotes)
    || Object.keys(PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS).some(
      (key) => value[key] !== false,
    )
  ) return undefined

  const summaryForOrchestra = typeof value.summaryForOrchestra === 'string'
    ? value.summaryForOrchestra
    : typeof value.summaryForQwen3 === 'string'
      ? value.summaryForQwen3
      : value.visualSummary

  return {
    ...PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
    id: value.id,
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    briefId: value.briefId,
    markerId: value.markerId,
    sourceVideoLabel: optionalString(value.sourceVideoLabel),
    visualSummary: value.visualSummary,
    setting: optionalString(value.setting) ?? 'Unknown',
    visibleObjects: [...value.visibleObjects],
    visiblePeople: [...value.visiblePeople],
    actions: [...value.actions],
    cameraMotion: optionalString(value.cameraMotion) ?? 'Unknown',
    visibleText: [...value.visibleText],
    layoutNotes: [...value.layoutNotes],
    brollOpportunities: [...value.brollOpportunities],
    visualRisks: [...value.visualRisks],
    doNotCopyNotes: [...value.doNotCopyNotes],
    confidence: value.confidence as ProjectEditBriefVisualContext['confidence'],
    timeRange: {
      startTimeSeconds: timeRange.startTimeSeconds,
      endTimeSeconds: timeRange.endTimeSeconds,
      label: timeRange.label,
    },
    sampledFrameCount: value.sampledFrameCount,
    runtimeSource: value.runtimeSource as ProjectEditBriefVisualContextRuntimeSource,
    fallbackReason: optionalString(value.fallbackReason),
    summaryForOrchestra,
    summaryForQwen3: optionalString(value.summaryForQwen3),
    visualSummaryFromQwen25VL: optionalString(value.visualSummaryFromQwen25VL),
    boundarySummary: value.boundarySummary,
    createdAt: optionalString(value.createdAt) ?? '',
    mockOnly: value.mockOnly === true,
  }
}

export function readProjectEditBriefVisualContextFromMarker(
  marker?: ProjectEditBriefMarkerRecord,
): ProjectEditBriefVisualContext | undefined {
  const context = visualContextFromUnknown(marker?.metadata?.latestVisualContext)
  return context
    && context.projectId === marker?.projectId
    && context.editSessionId === marker.editSessionId
    && context.briefId === marker.briefId
    && context.markerId === marker.id
    ? context
    : undefined
}

export function isCurrentProjectEditBriefVisualContext(
  context?: ProjectEditBriefVisualContext,
): boolean {
  return context?.runtimeSource === CURRENT_RUNTIME_SOURCE
}

export function isHistoricalProjectEditBriefVisualContext(
  context?: ProjectEditBriefVisualContext,
): boolean {
  return Boolean(context && HISTORICAL_RUNTIME_SOURCES.has(context.runtimeSource))
}

export function createProjectEditBriefVisualContextSummary(
  context?: ProjectEditBriefVisualContext,
): string {
  if (!context) {
    return 'Awaiting an authenticated Visual Intelligence report from Orchestra.'
  }
  if (isCurrentProjectEditBriefVisualContext(context)) {
    return `Authenticated Visual Intelligence evidence: ${context.visualSummary}`
  }
  if (isHistoricalProjectEditBriefVisualContext(context)) {
    return 'Historical Qwen visual metadata is visible for audit only and cannot drive a new plan, cut, or approval.'
  }
  return `Visual Intelligence evidence unavailable: ${context.fallbackReason ?? context.runtimeSource}.`
}
