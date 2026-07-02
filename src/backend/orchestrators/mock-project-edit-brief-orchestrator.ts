import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefRecord,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'
import { createMockProjectEditBriefFixtureBundle } from '../../lib/mock-project-edit-briefs'
import {
  createProjectEditBriefFixtureBundleSummary,
  createProjectEditBriefMarkerDrawerModels,
} from '../../lib/project-edit-brief-fixture-mappers'
import {
  createProjectEditBriefAttachmentSummary,
  createProjectEditBriefConflictSummary,
  createProjectEditBriefDebugSummary,
  createProjectEditBriefExportSettingsSummary,
  createProjectEditBriefIntentReadableSummary,
  createProjectEditBriefReadableSummary,
} from '../../lib/project-edit-brief-summary-mappers'
import {
  createProjectEditBriefTimelineSummary,
} from '../../lib/project-edit-brief-timeline-mappers'
import { MOCK_PROJECT_EDIT_BRIEF_SCENARIOS } from '../mock/mock-project-edit-brief-scenarios'

export type MockProjectEditBriefNextStep =
  'RP-EDITBRIEF-03 — Mock Repository Layer'

export interface MockProjectEditBriefFlowResult {
  briefs: ProjectEditBriefRecord[]
  markers: ProjectEditBriefMarkerRecord[]
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[]
  drawerModels: ProjectEditBriefMarkerDrawerModel[]
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
  messages: ProjectEditBriefMarkerMessageRecord[]
  intents: ProjectEditBriefMarkerIntentRecord[]
  confirmations: ProjectEditBriefMarkerConfirmationRecord[]
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  exportSettings: ProjectEditSessionExportSettingsRecord[]
  bundles: ProjectEditBriefBundleRecord[]
  summary: Record<string, unknown>
  warnings: string[]
  nextStep: MockProjectEditBriefNextStep
}

const NEXT_STEP: MockProjectEditBriefNextStep =
  'RP-EDITBRIEF-03 — Mock Repository Layer'

function createBaseFlowResult(summary: Record<string, unknown>): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  const drawerModels = createProjectEditBriefMarkerDrawerModels(fixture)
  const debugSummary = createProjectEditBriefDebugSummary(fixture)

  return {
    briefs: fixture.briefs,
    markers: fixture.markers,
    timelineMarkers: fixture.timelineMarkers,
    drawerModels,
    attachments: fixture.attachments,
    messages: fixture.messages,
    intents: fixture.intents,
    confirmations: fixture.confirmations,
    conflicts: fixture.conflicts,
    exportSettings: fixture.exportSettings,
    bundles: fixture.bundles,
    summary: {
      scenarioCount: MOCK_PROJECT_EDIT_BRIEF_SCENARIOS.length,
      fixtureSummary: createProjectEditBriefFixtureBundleSummary(fixture),
      ...summary,
    },
    warnings: debugSummary.warnings,
    nextStep: NEXT_STEP,
  }
}

export function runMockProjectEditBriefFixtureFlow(): MockProjectEditBriefFlowResult {
  return createBaseFlowResult({
    flow: 'fixture',
    description: 'Loads deterministic ProjectEditBrief fixture bundle.',
  })
}

export function runMockProjectEditBriefTimelineFlow(): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  return createBaseFlowResult({
    flow: 'timeline',
    timelineSummary: createProjectEditBriefTimelineSummary(fixture.timelineMarkers),
    lanes: Array.from(new Set(fixture.timelineMarkers.map((marker) => marker.lane))).sort(),
  })
}

export function runMockProjectEditBriefMarkerDrawerFlow(): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  const drawerModels = createProjectEditBriefMarkerDrawerModels(fixture)
  return createBaseFlowResult({
    flow: 'marker_drawer',
    drawerCount: drawerModels.length,
    warningCount: drawerModels.filter((drawer) => drawer.warnings.length > 0).length,
  })
}

export function runMockProjectEditBriefMarkerChatFlow(): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  return createBaseFlowResult({
    flow: 'marker_chat',
    messageCount: fixture.messages.length,
    confirmationCount: fixture.confirmations.length,
    roles: Array.from(new Set(fixture.messages.map((message) => message.role))).sort(),
  })
}

export function runMockProjectEditBriefIntentFlow(): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  return createBaseFlowResult({
    flow: 'intent',
    intentCount: fixture.intents.length,
    intentSummaries: fixture.intents.map(createProjectEditBriefIntentReadableSummary),
  })
}

export function runMockProjectEditBriefAttachmentFlow(): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  return createBaseFlowResult({
    flow: 'attachment',
    attachmentCount: fixture.attachments.length,
    attachmentSummaries: fixture.attachments.map(createProjectEditBriefAttachmentSummary),
  })
}

export function runMockProjectEditBriefExportSettingsFlow(): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  return createBaseFlowResult({
    flow: 'export_settings',
    exportSettingsCount: fixture.exportSettings.length,
    exportSummaries: fixture.exportSettings.map(createProjectEditBriefExportSettingsSummary),
  })
}

export function runMockProjectEditBriefConflictFlow(): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  return createBaseFlowResult({
    flow: 'conflict',
    conflictCount: fixture.conflicts.length,
    conflictSummaries: fixture.conflicts.map(createProjectEditBriefConflictSummary),
  })
}

export function runMockProjectEditBriefSummaryFlow(): MockProjectEditBriefFlowResult {
  const fixture = createMockProjectEditBriefFixtureBundle()
  return createBaseFlowResult({
    flow: 'summary',
    briefSummaries: fixture.briefs.map(createProjectEditBriefReadableSummary),
    debug: createProjectEditBriefDebugSummary(fixture),
  })
}
