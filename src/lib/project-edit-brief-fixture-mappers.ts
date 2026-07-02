import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefFixtureBundle,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefRecord,
} from '../types/project-edit-brief'
import {
  createProjectEditBriefTimelineMarkerModels,
} from './project-edit-brief-timeline-mappers'

export interface ProjectEditBriefAttachmentChipModel {
  id: string
  label: string
  kindLabel: string
  statusLabel: string
  metadataOnly: boolean
  mockOnly: boolean
}

export function createProjectEditBriefBundle(
  brief: ProjectEditBriefRecord,
  fixture: ProjectEditBriefFixtureBundle,
): ProjectEditBriefBundleRecord {
  const markers = fixture.markers.filter((marker) => marker.briefId === brief.id)
  const attachments = fixture.attachments.filter((attachment) => attachment.briefId === brief.id)
  const messages = fixture.messages.filter((message) => message.briefId === brief.id)
  const intents = fixture.intents.filter((intent) => intent.briefId === brief.id)
  const confirmations = fixture.confirmations.filter((confirmation) => confirmation.briefId === brief.id)
  const conflicts = fixture.conflicts.filter((conflict) => conflict.briefId === brief.id)
  const revisions = fixture.revisions.filter((revision) => revision.briefId === brief.id)
  const applicationLogs = fixture.applicationLogs.filter((log) => log.briefId === brief.id)
  const exportSettings = fixture.exportSettings.find((settings) => settings.id === brief.exportSettingsId)

  return {
    brief,
    markers,
    attachments,
    messages,
    intents,
    confirmations,
    conflicts,
    revisions,
    applicationLogs,
    exportSettings,
    timelineMarkers: createProjectEditBriefTimelineMarkerModels(markers),
    mockOnly: true,
    warnings: conflicts.map((conflict) => conflict.summary),
  }
}

export function createProjectEditBriefStatusBadges(
  brief: ProjectEditBriefRecord,
  markers: ProjectEditBriefMarkerRecord[] = [],
): string[] {
  const badges = [
    brief.status.replace(/_/g, ' '),
    brief.availability.replace(/_/g, ' '),
    `${brief.markerCount} marker${brief.markerCount === 1 ? '' : 's'}`,
  ]

  if (brief.confirmedMarkerCount > 0) badges.push(`${brief.confirmedMarkerCount} confirmed`)
  if (brief.conflictCount > 0) badges.push(`${brief.conflictCount} conflict`)
  if (brief.needsAssetCount > 0) badges.push('needs asset')
  if (brief.needsClarificationCount > 0) badges.push('needs clarification')
  if (markers.some((marker) => marker.priority === 'must_follow')) badges.push('must follow')
  if (markers.some((marker) => marker.priority === 'avoid')) badges.push('avoid rule')
  badges.push('mock only')

  return Array.from(new Set(badges))
}

export function createProjectEditBriefAvailabilitySummary(brief: ProjectEditBriefRecord): string {
  if (brief.availability === 'optional_not_opened') {
    return 'Edit Brief is optional and has not been opened for this Edit Chat.'
  }
  if (brief.availability === 'ready_for_plan') {
    return 'Edit Brief markers are ready as future planner hints.'
  }
  if (brief.availability === 'has_conflicts') {
    return 'Edit Brief has conflicts that require owner review before planning.'
  }
  if (brief.availability === 'has_confirmed_markers') {
    return 'Edit Brief has confirmed marker guidance.'
  }
  if (brief.availability === 'has_markers') {
    return 'Edit Brief has marker guidance that is not fully planner-ready.'
  }
  return 'Edit Brief is open with no timeline markers yet.'
}

export function createProjectEditBriefAttachmentChipModel(
  attachment: ProjectEditBriefMarkerAttachmentRecord,
): ProjectEditBriefAttachmentChipModel {
  return {
    id: attachment.id,
    label: attachment.label,
    kindLabel: attachment.attachmentKind.replace(/_/g, ' '),
    statusLabel: attachment.status.replace(/_/g, ' '),
    metadataOnly: attachment.status === 'metadata_only' || attachment.status === 'mock_attached',
    mockOnly: attachment.mockOnly,
  }
}

export function createProjectEditBriefDrawerModel(
  marker: ProjectEditBriefMarkerRecord,
  fixture: ProjectEditBriefFixtureBundle,
): ProjectEditBriefMarkerDrawerModel {
  const intent = fixture.intents.find((candidate) => candidate.id === marker.intentId)
  const attachments = fixture.attachments.filter((attachment) => attachment.markerId === marker.id)
  const messages = fixture.messages.filter((message) => message.markerId === marker.id)
  const confirmations = fixture.confirmations.filter((confirmation) => confirmation.markerId === marker.id)
  const conflicts = fixture.conflicts.filter((conflict) => conflict.markerId === marker.id)
  const warnings = [
    ...conflicts.map((conflict) => conflict.summary),
    ...(marker.status === 'needs_asset' ? ['Marker needs a future uploaded or selected asset.'] : []),
    ...(marker.status === 'needs_clarification' ? ['Marker needs owner clarification.'] : []),
  ]

  return {
    marker,
    intent,
    attachments,
    messages,
    confirmations,
    conflicts,
    statusLabel: marker.status.replace(/_/g, ' '),
    actionLabels: [
      marker.markerType.replace(/_/g, ' '),
      marker.priority.replace(/_/g, ' '),
      marker.aiMode.replace(/_/g, ' '),
    ],
    mockOnly: marker.mockOnly && attachments.every((attachment) => attachment.mockOnly),
    warnings,
  }
}

export function createProjectEditBriefMarkerDrawerModels(
  fixture: ProjectEditBriefFixtureBundle,
  briefId?: string,
): ProjectEditBriefMarkerDrawerModel[] {
  return fixture.markers
    .filter((marker) => !briefId || marker.briefId === briefId)
    .map((marker) => createProjectEditBriefDrawerModel(marker, fixture))
}

export function createProjectEditBriefFixtureBundleSummary(
  fixture: ProjectEditBriefFixtureBundle,
): {
  briefCount: number
  markerCount: number
  attachmentCount: number
  messageCount: number
  intentCount: number
  confirmationCount: number
  conflictCount: number
  revisionCount: number
  applicationLogCount: number
  exportSettingsCount: number
  timelineMarkerCount: number
  bundleCount: number
  mockOnly: boolean
} {
  const records = [
    ...fixture.briefs,
    ...fixture.markers,
    ...fixture.attachments,
    ...fixture.messages,
    ...fixture.intents,
    ...fixture.confirmations,
    ...fixture.conflicts,
    ...fixture.revisions,
    ...fixture.applicationLogs,
    ...fixture.exportSettings,
    ...fixture.timelineMarkers,
    ...fixture.bundles,
  ]

  return {
    briefCount: fixture.briefs.length,
    markerCount: fixture.markers.length,
    attachmentCount: fixture.attachments.length,
    messageCount: fixture.messages.length,
    intentCount: fixture.intents.length,
    confirmationCount: fixture.confirmations.length,
    conflictCount: fixture.conflicts.length,
    revisionCount: fixture.revisions.length,
    applicationLogCount: fixture.applicationLogs.length,
    exportSettingsCount: fixture.exportSettings.length,
    timelineMarkerCount: fixture.timelineMarkers.length,
    bundleCount: fixture.bundles.length,
    mockOnly: records.every((record) => record.mockOnly === true),
  }
}
