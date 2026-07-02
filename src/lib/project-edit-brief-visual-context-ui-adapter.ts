import type {
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerRecord,
} from '../types/project-edit-brief'
import type {
  ProjectEditBriefSampledFrameReference,
  ProjectEditBriefVisualContext,
  ProjectEditBriefVisualContextAnalysisResult,
  ProjectEditBriefVisualContextMarkerInput,
  ProjectEditBriefVisualContextRequest,
  ProjectEditBriefVisualContextRuntimeSource,
} from '../types/project-edit-brief-visual-context'
import { PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS } from '../types/project-edit-brief-visual-context'
import type { ProjectEditBriefApiClient } from './project-edit-brief-api-client'
import { createDefaultMockProjectEditBriefApiClient } from './project-edit-brief-api-client'

type VisualContextEnvelopeData = ProjectEditBriefVisualContextAnalysisResult & {
  visualContext?: ProjectEditBriefVisualContext
}

function nowIso(): string {
  return new Date().toISOString()
}

function defaultClient(client?: ProjectEditBriefApiClient): ProjectEditBriefApiClient {
  return client ?? createDefaultMockProjectEditBriefApiClient()
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function visualContextFromUnknown(value: unknown): ProjectEditBriefVisualContext | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<ProjectEditBriefVisualContext>
  return typeof record.visualSummary === 'string' && typeof record.markerId === 'string'
    ? record as ProjectEditBriefVisualContext
    : undefined
}

function markerTimeLabel(marker: Pick<ProjectEditBriefMarkerRecord, 'timeMode' | 'startTimeSeconds' | 'endTimeSeconds'>): string {
  if (marker.timeMode === 'range' && typeof marker.endTimeSeconds === 'number') {
    return `${Math.round(marker.startTimeSeconds)}s-${Math.round(marker.endTimeSeconds)}s`
  }
  return `${Math.round(marker.startTimeSeconds)}s`
}

export function createProjectEditBriefVisualContextMarkerInput(
  marker: ProjectEditBriefMarkerRecord,
  drawer?: ProjectEditBriefMarkerDrawerModel,
): ProjectEditBriefVisualContextMarkerInput {
  return {
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    markerType: marker.markerType,
    title: marker.title,
    userNote: marker.userNote,
    aiMode: marker.aiMode,
    timeMode: marker.timeMode,
    startTimeSeconds: marker.startTimeSeconds,
    endTimeSeconds: marker.endTimeSeconds,
    attachmentLabels: drawer?.attachments.map((attachment) => attachment.label) ?? [],
  }
}

export function readProjectEditBriefVisualContextFromMarker(
  marker?: ProjectEditBriefMarkerRecord,
): ProjectEditBriefVisualContext | undefined {
  return visualContextFromUnknown(marker?.metadata?.latestVisualContext)
}

export function createProjectEditBriefVisualContextFallback(input: {
  marker: ProjectEditBriefMarkerRecord
  sourceVideoLabel?: string
  sampledFrameCount?: number
  reason: string
  runtimeSource?: ProjectEditBriefVisualContextRuntimeSource
}): ProjectEditBriefVisualContext {
  const summary = `Visual context unavailable: local fallback only, no Qwen2.5-VL call. Marker "${input.marker.title}" at ${markerTimeLabel(input.marker)}${input.sourceVideoLabel ? ` for ${input.sourceVideoLabel}` : ''}.`
  return {
    ...PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
    id: `marker-visual-context-local-${input.marker.id}-${Date.now().toString(36)}`,
    projectId: input.marker.projectId,
    editSessionId: input.marker.editSessionId,
    briefId: input.marker.briefId,
    markerId: input.marker.id,
    sourceVideoLabel: input.sourceVideoLabel,
    visualSummary: summary,
    setting: 'Unavailable in local fallback.',
    visibleObjects: ['Unavailable until sampled frames are analyzed by Qwen2.5-VL.'],
    visiblePeople: ['Unavailable until sampled frames are analyzed by Qwen2.5-VL.'],
    actions: [input.marker.userNote || `Marker type: ${input.marker.markerType}.`],
    cameraMotion: 'Unavailable in local fallback.',
    visibleText: ['Unavailable until sampled frames are analyzed.'],
    layoutNotes: ['Local fallback is marker metadata only.'],
    brollOpportunities: ['Run owner-approved Qwen2.5-VL visual analysis before using this as visual evidence.'],
    visualRisks: ['Fallback is not model-seen video evidence.'],
    doNotCopyNotes: ['Do not claim Qwen2.5-VL analyzed frames when fallback was used.'],
    confidence: 'low',
    timeRange: {
      startTimeSeconds: input.marker.startTimeSeconds,
      endTimeSeconds: input.marker.endTimeSeconds ?? input.marker.startTimeSeconds,
      label: markerTimeLabel(input.marker),
    },
    sampledFrameCount: input.sampledFrameCount ?? 0,
    runtimeSource: input.runtimeSource ?? 'deterministic_visual_fallback',
    fallbackReason: input.reason,
    summaryForQwen3: `${summary} Reason: ${input.reason}.`,
    boundarySummary: 'Browser-local fallback only. No provider call, no frame persistence, no render/export, no workers, and no credits.',
    createdAt: nowIso(),
    mockOnly: true,
  }
}

export function createProjectEditBriefVisualContextRequest(input: {
  marker: ProjectEditBriefMarkerRecord
  drawer?: ProjectEditBriefMarkerDrawerModel
  sampledFrames: ProjectEditBriefSampledFrameReference[]
  sourceVideoLabel?: string
}): ProjectEditBriefVisualContextRequest {
  return {
    projectId: input.marker.projectId,
    editSessionId: input.marker.editSessionId,
    briefId: input.marker.briefId,
    markerId: input.marker.id,
    marker: createProjectEditBriefVisualContextMarkerInput(input.marker, input.drawer),
    sampledFrames: input.sampledFrames,
    sourceVideoLabel: input.sourceVideoLabel,
    requestedAt: nowIso(),
  }
}

export function createProjectEditBriefVisualContextSummary(context?: ProjectEditBriefVisualContext): string {
  if (!context) return 'Visual context unavailable.'
  if (context.runtimeSource === 'qwen25vl_live') return `Visual context available from Qwen2.5-VL: ${context.visualSummary}`
  if (context.runtimeSource === 'qwen25vl_fake') return `Visual context available from Qwen2.5-VL fake beta: ${context.visualSummary}`
  return `Visual context fallback used: ${context.fallbackReason ?? context.runtimeSource}.`
}

export function createProjectEditBriefMarkerVisualContextPatch(input: {
  marker: ProjectEditBriefMarkerRecord
  visualContext: ProjectEditBriefVisualContext
}) {
  return {
    markerId: input.marker.id,
    patch: {
      metadata: {
        ...(input.marker.metadata ?? {}),
        latestVisualContext: input.visualContext,
        latestVisualContextSummary: input.visualContext.summaryForQwen3,
        visualContextUpdatedAt: input.visualContext.createdAt,
        sampledFramesPersisted: false,
        rawProviderPayloadStored: false,
        fullVideoUploaded: false,
        renderJobCreated: false,
        workerJobCreated: false,
        creditReservedOrSpent: false,
      },
    },
  }
}

export async function saveProjectEditBriefVisualContextToMarker(input: {
  marker: ProjectEditBriefMarkerRecord
  visualContext: ProjectEditBriefVisualContext
  client?: ProjectEditBriefApiClient
}): Promise<ProjectEditBriefMarkerRecord | undefined> {
  const response = await defaultClient(input.client).markers.update<{ marker: ProjectEditBriefMarkerRecord }>(
    createProjectEditBriefMarkerVisualContextPatch(input),
  )
  return response.data?.marker
}

export async function analyzeProjectEditBriefMarkerVisualContextViaApi(input: {
  marker: ProjectEditBriefMarkerRecord
  sampledFrames: ProjectEditBriefSampledFrameReference[]
  sourceVideoLabel?: string
  client?: ProjectEditBriefApiClient
}): Promise<{
  visualContext: ProjectEditBriefVisualContext
  updatedMarker?: ProjectEditBriefMarkerRecord
  runtimeSource: ProjectEditBriefVisualContextRuntimeSource
  warnings: string[]
}> {
  const client = defaultClient(input.client)
  const drawerResponse = await client.drawer.get<{ drawer: ProjectEditBriefMarkerDrawerModel }>(input.marker.id)
  const drawer = drawerResponse.data?.drawer
  const request = createProjectEditBriefVisualContextRequest({
    marker: input.marker,
    drawer,
    sampledFrames: input.sampledFrames,
    sourceVideoLabel: input.sourceVideoLabel,
  })
  const response = await client.visualContext.analyze<VisualContextEnvelopeData>(request)
  const data = response.data
  const visualContext = data?.visualContext ?? createProjectEditBriefVisualContextFallback({
    marker: input.marker,
    sourceVideoLabel: input.sourceVideoLabel,
    sampledFrameCount: input.sampledFrames.length,
    reason: response.error?.code ?? 'visual_context_response_unavailable',
    runtimeSource: 'deterministic_visual_fallback',
  })
  const updatedMarker = await saveProjectEditBriefVisualContextToMarker({
    marker: input.marker,
    visualContext,
    client,
  })
  return {
    visualContext,
    updatedMarker,
    runtimeSource: visualContext.runtimeSource,
    warnings: [
      ...stringArray(response.warnings),
      ...stringArray(data?.warnings),
      'Only structured visual summary metadata was stored on the marker; sampled frames were not persisted.',
    ],
  }
}
