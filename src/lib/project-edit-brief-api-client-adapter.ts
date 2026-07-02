import type { ReeditProApiResponseEnvelope } from '../types/api-routes'
import type {
  ProjectEditBriefApplicationLogRecord,
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefQAStatus,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefRecord,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import {
  createDefaultMockProjectEditBriefApiClient,
  type ProjectEditBriefApiClient,
} from './project-edit-brief-api-client'
import {
  createProjectEditBriefApiResultSummary,
  createProjectEditBriefBundleSummaryForUI,
  createProjectEditBriefTimelineSummaryForUI,
} from './project-edit-brief-api-client-summaries'

function defaultClient(client?: ProjectEditBriefApiClient): ProjectEditBriefApiClient {
  return client ?? createDefaultMockProjectEditBriefApiClient()
}

function resultSummary(response: ReeditProApiResponseEnvelope) {
  return createProjectEditBriefApiResultSummary(response)
}

export async function getProjectEditBriefForSessionViaApi(
  editSessionId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).brief.getForSession<{ brief: ProjectEditBriefRecord }>(editSessionId)
  return {
    ...response,
    brief: response.data?.brief,
    summary: resultSummary(response),
  }
}

export async function createProjectEditBriefViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).brief.create<{ brief: ProjectEditBriefRecord }>(input)
  return {
    ...response,
    brief: response.data?.brief,
    summary: resultSummary(response),
  }
}

export async function getProjectEditBriefBundleViaApi(
  briefId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).brief.bundle<{ bundle: ProjectEditBriefBundleRecord }>(briefId)
  return {
    ...response,
    bundle: response.data?.bundle,
    uiSummary: response.data?.bundle ? createProjectEditBriefBundleSummaryForUI(response.data.bundle) : undefined,
    summary: resultSummary(response),
  }
}

export async function listProjectEditBriefMarkersViaApi(
  briefId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).markers.list<{ markers: ProjectEditBriefMarkerRecord[] }>(briefId)
  return {
    ...response,
    markers: response.data?.markers ?? [],
    summary: resultSummary(response),
  }
}

export async function createProjectEditBriefMarkerViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).markers.create<{ marker: ProjectEditBriefMarkerRecord }>(input)
  return {
    ...response,
    marker: response.data?.marker,
    summary: resultSummary(response),
  }
}

export async function updateProjectEditBriefMarkerViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).markers.update<{ marker: ProjectEditBriefMarkerRecord }>(input)
  return {
    ...response,
    marker: response.data?.marker,
    summary: resultSummary(response),
  }
}

export async function confirmProjectEditBriefMarkerViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).markers.confirm<{ marker: ProjectEditBriefMarkerRecord }>(input)
  return {
    ...response,
    marker: response.data?.marker,
    summary: resultSummary(response),
  }
}

export async function archiveProjectEditBriefMarkerViaApi(
  markerId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).markers.archive<{ marker: ProjectEditBriefMarkerRecord }>(markerId)
  return {
    ...response,
    marker: response.data?.marker,
    summary: resultSummary(response),
  }
}

export async function updateProjectEditBriefMarkerQAStatusViaApi(
  input: { markerId: string; qaStatus: ProjectEditBriefQAStatus },
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).markers.update<{ marker: ProjectEditBriefMarkerRecord }>({
    markerId: input.markerId,
    patch: { qaStatus: input.qaStatus },
  })
  return {
    ...response,
    marker: response.data?.marker,
    summary: resultSummary(response),
  }
}

export async function listProjectEditBriefMarkerMessagesViaApi(
  markerId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).markerMessages.list<{ messages: ProjectEditBriefMarkerMessageRecord[] }>(markerId)
  return {
    ...response,
    messages: response.data?.messages ?? [],
    summary: resultSummary(response),
  }
}

export async function appendProjectEditBriefMarkerMessageViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).markerMessages.append<{ message: ProjectEditBriefMarkerMessageRecord }>(input)
  return {
    ...response,
    message: response.data?.message,
    summary: resultSummary(response),
  }
}

export async function saveProjectEditBriefMarkerIntentViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).intent.save<{ intent: ProjectEditBriefMarkerIntentRecord }>(input)
  return {
    ...response,
    intent: response.data?.intent,
    summary: resultSummary(response),
  }
}

export async function listProjectEditBriefMarkerConflictsViaApi(
  input: { briefId?: string; markerId?: string },
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).conflicts.list<{ conflicts: ProjectEditBriefMarkerConflictRecord[] }>(input)
  return {
    ...response,
    conflicts: response.data?.conflicts ?? [],
    summary: resultSummary(response),
  }
}

export async function saveProjectEditBriefMarkerConflictViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).conflicts.save<{ conflict: ProjectEditBriefMarkerConflictRecord }>(input)
  return {
    ...response,
    conflict: response.data?.conflict,
    summary: resultSummary(response),
  }
}

export async function updateProjectEditBriefMarkerIntentViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).intent.update<{ intent: ProjectEditBriefMarkerIntentRecord }>(input)
  return {
    ...response,
    intent: response.data?.intent,
    summary: resultSummary(response),
  }
}

export async function listProjectEditBriefMarkerAttachmentsViaApi(
  markerId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).attachments.list<{ attachments: ProjectEditBriefMarkerAttachmentRecord[] }>(markerId)
  return {
    ...response,
    attachments: response.data?.attachments ?? [],
    summary: resultSummary(response),
  }
}

export async function addProjectEditBriefMarkerAttachmentViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).attachments.add<{ attachment: ProjectEditBriefMarkerAttachmentRecord }>(input)
  return {
    ...response,
    attachment: response.data?.attachment,
    summary: resultSummary(response),
  }
}

export async function removeProjectEditBriefMarkerAttachmentViaApi(
  attachmentId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).attachments.remove<{ attachmentId: string; removed: true }>(attachmentId)
  return {
    ...response,
    attachmentId: response.data?.attachmentId,
    removed: response.data?.removed ?? false,
    summary: resultSummary(response),
  }
}

export async function listProjectEditBriefApplicationLogsViaApi(
  briefId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).applicationLogs.list<{ applicationLogs: ProjectEditBriefApplicationLogRecord[] }>(briefId)
  return {
    ...response,
    applicationLogs: response.data?.applicationLogs ?? [],
    summary: resultSummary(response),
  }
}

export async function appendProjectEditBriefApplicationLogViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).applicationLogs.append<{ applicationLog: ProjectEditBriefApplicationLogRecord }>(input)
  return {
    ...response,
    applicationLog: response.data?.applicationLog,
    summary: resultSummary(response),
  }
}

export async function getProjectEditBriefMarkerDrawerViaApi(
  markerId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).drawer.get<{ drawer: ProjectEditBriefMarkerDrawerModel }>(markerId)
  return {
    ...response,
    drawer: response.data?.drawer,
    uiModel: response.data?.drawer ? createProjectEditBriefDrawerForUI(response.data.drawer) : undefined,
    summary: resultSummary(response),
  }
}

export async function getProjectEditBriefTimelineModelsViaApi(
  briefId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).timeline.models<{ timelineMarkers: ProjectEditBriefTimelineMarkerModel[] }>(briefId)
  const timelineMarkers = response.data?.timelineMarkers ?? []
  return {
    ...response,
    timelineMarkers,
    uiModel: createProjectEditBriefTimelineForUI(timelineMarkers),
    summary: resultSummary(response),
  }
}

export async function getProjectEditSessionExportSettingsViaApi(
  editSessionId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).exportSettings.get<{ exportSettings: ProjectEditSessionExportSettingsRecord }>(editSessionId)
  return {
    ...response,
    exportSettings: response.data?.exportSettings,
    summary: resultSummary(response),
  }
}

export async function recommendProjectEditSessionExportSettingsViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).exportSettings.recommend<{ exportSettings: ProjectEditSessionExportSettingsRecord }>(input)
  return {
    ...response,
    exportSettings: response.data?.exportSettings,
    summary: resultSummary(response),
  }
}

export async function updateProjectEditSessionExportSettingsViaApi(
  input: unknown,
  client?: ProjectEditBriefApiClient,
) {
  const response = await defaultClient(client).exportSettings.update<{ exportSettings: ProjectEditSessionExportSettingsRecord }>(input)
  return {
    ...response,
    exportSettings: response.data?.exportSettings,
    summary: resultSummary(response),
  }
}

export function createProjectEditBriefSummaryForUI(bundle: ProjectEditBriefBundleRecord) {
  return createProjectEditBriefBundleSummaryForUI(bundle)
}

export function createProjectEditBriefTimelineForUI(timelineMarkers: ProjectEditBriefTimelineMarkerModel[]) {
  return createProjectEditBriefTimelineSummaryForUI(timelineMarkers)
}

export function createProjectEditBriefDrawerForUI(drawer: ProjectEditBriefMarkerDrawerModel) {
  return {
    markerId: drawer.marker.id,
    title: drawer.marker.title,
    statusLabel: drawer.statusLabel,
    actionLabels: drawer.actionLabels,
    attachmentCount: drawer.attachments.length,
    messageCount: drawer.messages.length,
    conflictCount: drawer.conflicts.length,
    hasIntent: Boolean(drawer.intent),
    warnings: drawer.warnings,
    mockOnly: drawer.mockOnly,
    boundary: 'Mock/local marker drawer model only; opening UI and planner execution remain future work.',
  }
}
