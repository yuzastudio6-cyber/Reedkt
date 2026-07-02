import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefFixtureBundle,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefRecord,
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import { createProjectEditBriefFixtureBundleSummary } from './project-edit-brief-fixture-mappers'

export function createProjectEditBriefReadableSummary(
  brief: ProjectEditBriefRecord,
): string {
  return `${brief.title}: ${brief.status.replace(/_/g, ' ')} with ${brief.markerCount} markers; ${brief.summary ?? 'no summary'}`
}

export function createProjectEditBriefMarkerReadableSummary(
  marker: ProjectEditBriefMarkerRecord,
): string {
  const timeLabel = marker.timeMode === 'range' && marker.endTimeSeconds !== undefined
    ? `${marker.startTimeSeconds}s-${marker.endTimeSeconds}s`
    : `${marker.startTimeSeconds}s`
  return `${marker.title} (${marker.markerType.replace(/_/g, ' ')}) at ${timeLabel}: ${marker.status.replace(/_/g, ' ')}`
}

export function createProjectEditBriefIntentReadableSummary(
  intent: ProjectEditBriefMarkerIntentRecord,
): string {
  return `${intent.action.replace(/_/g, ' ')} is ${intent.status.replace(/_/g, ' ')} with ${intent.confidence} confidence: ${intent.instruction}`
}

export function createProjectEditBriefAttachmentSummary(
  attachment: ProjectEditBriefMarkerAttachmentRecord,
): string {
  return `${attachment.label}: ${attachment.attachmentKind.replace(/_/g, ' ')} is ${attachment.status.replace(/_/g, ' ')}; metadata-only mock boundary active.`
}

export function createProjectEditBriefConflictSummary(
  conflict: ProjectEditBriefMarkerConflictRecord,
): string {
  return `${conflict.title}: ${conflict.summary} Resolution: ${conflict.recommendedResolution}`
}

export function createProjectEditBriefExportSettingsSummary(
  settings: ProjectEditSessionExportSettingsRecord,
): string {
  return `${settings.deliveryPreset} ${settings.resolution.width}x${settings.resolution.height} ${settings.frameRate}fps ${settings.format}; ${settings.summary}`
}

export function createProjectEditBriefBundleReadableSummary(
  bundle: ProjectEditBriefBundleRecord,
): string {
  return `${createProjectEditBriefReadableSummary(bundle.brief)}; ${bundle.timelineMarkers.length} timeline markers; ${bundle.conflicts.length} conflicts.`
}

export function createProjectEditBriefDebugSummary(
  fixture: ProjectEditBriefFixtureBundle,
): {
  counts: ReturnType<typeof createProjectEditBriefFixtureBundleSummary>
  warningCount: number
  warnings: string[]
  noExecution: boolean
} {
  const warnings = [
    ...fixture.conflicts.map(createProjectEditBriefConflictSummary),
    ...fixture.markers
      .filter((marker) => marker.status === 'needs_asset' || marker.status === 'needs_clarification')
      .map(createProjectEditBriefMarkerReadableSummary),
  ]

  return {
    counts: createProjectEditBriefFixtureBundleSummary(fixture),
    warningCount: warnings.length,
    warnings,
    noExecution: JSON.stringify(fixture).includes('"providerCallMade":true') === false
      && JSON.stringify(fixture).includes('"renderJobCreated":true') === false
      && JSON.stringify(fixture).includes('"creditReservedOrSpent":true') === false
      && JSON.stringify(fixture).includes('"fileBytesRead":true') === false
      && JSON.stringify(fixture).includes('"storageWriteMade":true') === false,
  }
}
