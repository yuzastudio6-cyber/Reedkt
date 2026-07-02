import {
  PROJECT_EDIT_BRIEF_API_ROUTE_IDS,
  type ProjectEditBriefApiRouteId,
} from '../../types/api-routes'

export interface MockProjectEditBriefApiRouteScenario {
  id: string
  title: string
  routeId: ProjectEditBriefApiRouteId | 'project.editBrief.unknown'
  expectedOk: boolean
  expectedMockOnly: true
  expectedProviderCallMade: false
  expectedSupabaseWriteMade: false
  expectedStorageWriteMade: false
  expectedFileBytesRead: false
  expectedExternalUrlFetched: false
  expectedMediaProcessingStarted: false
  expectedRenderJobCreated: false
  mockOnly: true
  notes: string[]
}

const scenarioTitles: Array<[MockProjectEditBriefApiRouteScenario['routeId'], string]> = [
  ['project.editBrief.get', 'Get brief route works.'],
  ['project.editBrief.forSession.get', 'Get brief for session route works.'],
  ['project.editBrief.create', 'Create brief route works.'],
  ['project.editBrief.update', 'Update brief route works.'],
  ['project.editBrief.archive', 'Archive brief route works.'],
  ['project.editBrief.summary', 'Brief summary route works.'],
  ['project.editBrief.bundle', 'Brief bundle route works.'],
  ['project.editBrief.markers.list', 'List markers route works.'],
  ['project.editBrief.markers.get', 'Get marker route works.'],
  ['project.editBrief.markers.create', 'Create marker route works.'],
  ['project.editBrief.markers.update', 'Update marker route works.'],
  ['project.editBrief.markers.delete', 'Delete marker route works.'],
  ['project.editBrief.markers.confirm', 'Confirm marker route works.'],
  ['project.editBrief.markers.archive', 'Archive marker route works.'],
  ['project.editBrief.markerAttachments.list', 'List marker attachments route works.'],
  ['project.editBrief.markerAttachments.add', 'Add marker attachment route works.'],
  ['project.editBrief.markerAttachments.remove', 'Remove marker attachment route works.'],
  ['project.editBrief.markerMessages.list', 'List Marker Chat messages route works.'],
  ['project.editBrief.markerMessages.append', 'Append Marker Chat message route works.'],
  ['project.editBrief.markerIntent.get', 'Get marker intent route works.'],
  ['project.editBrief.markerIntent.save', 'Save marker intent route works.'],
  ['project.editBrief.markerIntent.update', 'Update marker intent route works.'],
  ['project.editBrief.markerConfirmations.list', 'List marker confirmations route works.'],
  ['project.editBrief.markerConfirmations.save', 'Save marker confirmation route works.'],
  ['project.editBrief.markerConflicts.list', 'List marker conflicts route works.'],
  ['project.editBrief.markerConflicts.save', 'Save marker conflict route works.'],
  ['project.editBrief.markerRevisions.list', 'List marker revisions route works.'],
  ['project.editBrief.markerRevisions.save', 'Save marker revision route works.'],
  ['project.editBrief.applicationLogs.list', 'List application logs route works.'],
  ['project.editBrief.applicationLogs.append', 'Append application log route works.'],
  ['project.editBrief.exportSettings.get', 'Get session export settings route works.'],
  ['project.editBrief.exportSettings.recommend', 'Recommend session export settings route works.'],
  ['project.editBrief.exportSettings.update', 'Update session export settings route works.'],
  ['project.editBrief.timeline.models', 'Timeline model route works.'],
  ['project.editBrief.markerDrawer.get', 'Marker drawer route works.'],
  ['project.editBrief.unknown', 'Unknown route returns safe error.'],
  ['project.editBrief.get', 'Route registry lists all Project Edit Brief routes.'],
  ['project.editBrief.summary', 'Route summary is readable.'],
  ['project.editBrief.get', 'Route response flags provider false.'],
  ['project.editBrief.get', 'Route response flags Supabase read false.'],
  ['project.editBrief.get', 'Route response flags Supabase write false.'],
  ['project.editBrief.get', 'Route response flags storage write false.'],
  ['project.editBrief.get', 'Route response flags signed URL false.'],
  ['project.editBrief.get', 'Route response flags file bytes false.'],
  ['project.editBrief.get', 'Route response flags external URL fetch false.'],
  ['project.editBrief.get', 'Route response flags media processing false.'],
  ['project.editBrief.get', 'Route response flags worker false.'],
  ['project.editBrief.get', 'Route response flags render false.'],
  ['project.editBrief.get', 'Route response flags credit false.'],
  ['project.editBrief.forSession.get', 'Session brief lookup preserves optional Brief semantics.'],
  ['project.editBrief.create', 'Create brief keeps Edit Brief distinct from Edit Chat.'],
  ['project.editBrief.create', 'Create brief keeps Edit Brief distinct from Edit Preference.'],
  ['project.editBrief.markers.create', 'Marker creation is metadata only.'],
  ['project.editBrief.markerAttachments.add', 'Attachment route stores metadata only.'],
  ['project.editBrief.markerMessages.append', 'Marker Chat stays scoped to a marker.'],
  ['project.editBrief.markerIntent.save', 'Structured intent is planning metadata only.'],
  ['project.editBrief.markerConflicts.save', 'Conflict route records owner-review needs only.'],
  ['project.editBrief.exportSettings.recommend', 'Export settings are session-owned metadata only.'],
  ['project.editBrief.timeline.models', 'Timeline models do not create UI routes.'],
  ['project.editBrief.markerDrawer.get', 'Drawer model does not open UI behavior.'],
  ['project.editBrief.bundle', 'Bundle combines repository records for future UI.'],
  ['project.editBrief.applicationLogs.append', 'Application log does not run planner execution.'],
  ['project.editBrief.markers.delete', 'Marker deletion remains mock repository state only.'],
  ['project.editBrief.archive', 'Brief archive does not delete session data.'],
]

export const MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS: MockProjectEditBriefApiRouteScenario[] =
  scenarioTitles.map(([routeId, title], index) => ({
    id: `project-edit-brief-api-route-scenario-${String(index + 1).padStart(2, '0')}`,
    title,
    routeId,
    expectedOk: routeId !== 'project.editBrief.unknown',
    expectedMockOnly: true,
    expectedProviderCallMade: false,
    expectedSupabaseWriteMade: false,
    expectedStorageWriteMade: false,
    expectedFileBytesRead: false,
    expectedExternalUrlFetched: false,
    expectedMediaProcessingStarted: false,
    expectedRenderJobCreated: false,
    mockOnly: true,
    notes: [
      PROJECT_EDIT_BRIEF_API_ROUTE_IDS.includes(routeId as ProjectEditBriefApiRouteId)
        ? 'Registered Project Edit Brief route.'
        : 'Unknown route is expected to return a safe mock error.',
      'No provider, Supabase, storage, signed URL, file-byte, external URL, media-processing, worker, render, generation, credit, or production HTTP effect is allowed.',
    ],
  }))

export function listMockProjectEditBriefApiRouteScenarios() {
  return MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS
}
