import {
  PROJECT_EDIT_SESSION_API_ROUTE_IDS,
  type ProjectEditSessionApiRouteId,
} from '../../types/api-routes'

export interface MockProjectEditSessionApiRouteScenario {
  id: string
  title: string
  routeId: ProjectEditSessionApiRouteId | 'project.editSessions.unknown'
  expectedOk: boolean
  expectedMockOnly: true
  expectedProviderCallMade: false
  expectedSupabaseWriteMade: false
  expectedRenderJobCreated: false
  mockOnly: true
  notes: string[]
}

const scenarioTitles: Array<[ProjectEditSessionApiRouteId | 'project.editSessions.unknown', string]> = [
  ['project.editSessions.list', 'List sessions route works.'],
  ['project.editSessions.get', 'Get session route works.'],
  ['project.editSessions.create', 'Create session route works.'],
  ['project.editSessions.update', 'Update session route works.'],
  ['project.editSessions.archive', 'Archive session route works.'],
  ['project.editSessions.duplicate', 'Duplicate session route works.'],
  ['project.editSessions.cardModels.list', 'List card models route works.'],
  ['project.editSessions.cardModels.get', 'Get card model route works.'],
  ['project.editSessions.bundle.get', 'Get bundle route works.'],
  ['project.editSessions.summary.get', 'Get summary route works.'],
  ['project.editSessions.messages.list', 'List messages route works.'],
  ['project.editSessions.messages.append', 'Append message route works.'],
  ['project.editSessions.sources.list', 'List sources route works.'],
  ['project.editSessions.sources.save', 'Save source route works.'],
  ['project.editSessions.sources.saveMany', 'Save many sources route works.'],
  ['project.editSessions.memory.list', 'List memory route works.'],
  ['project.editSessions.memory.getLayer', 'Get memory layer route works.'],
  ['project.editSessions.memory.upsert', 'Upsert memory route works.'],
  ['project.editSessions.snapshots.save', 'Save snapshot route works.'],
  ['project.editSessions.snapshots.latest', 'Latest snapshot route works.'],
  ['project.editSessions.snapshots.list', 'List snapshots route works.'],
  ['project.editSessions.versions.save', 'Save version route works.'],
  ['project.editSessions.versions.latest', 'Latest version route works.'],
  ['project.editSessions.versions.list', 'List versions route works.'],
  ['project.editSessions.previews.save', 'Save preview route works.'],
  ['project.editSessions.previews.latest', 'Latest preview route works.'],
  ['project.editSessions.previews.list', 'List previews route works.'],
  ['project.editSessions.revisions.save', 'Save revision route works.'],
  ['project.editSessions.revisions.list', 'List revisions route works.'],
  ['project.editSessions.events.append', 'Append event route works.'],
  ['project.editSessions.events.list', 'List events route works.'],
  ['project.editSessions.preference.options', 'List Edit Preference options for an Edit Chat.'],
  ['project.editSessions.preference.get', 'Get current Edit Chat preference state.'],
  ['project.editSessions.preference.apply', 'Apply DNA-backed Edit Preference mock-locally.'],
  ['project.editSessions.preference.clear', 'Clear selected Edit Preference mock-locally.'],
  ['project.editSessions.preference.dnaSummary', 'Load Preference DNA summary for a selected option.'],
  ['project.editSessions.preference.applicationSummary', 'Load Edit Chat preference application summary.'],
  ['project.editSessions.unknown', 'Unknown route returns safe error.'],
  ['project.editSessions.list', 'Route registry lists all routes.'],
  ['project.editSessions.summary.get', 'Route summary is readable.'],
  ['project.editSessions.get', 'Route response flags provider false.'],
  ['project.editSessions.get', 'Route response flags Supabase write false.'],
  ['project.editSessions.get', 'Route response flags storage write false.'],
  ['project.editSessions.get', 'Route response flags worker false.'],
  ['project.editSessions.get', 'Route response flags render false.'],
  ['project.editSessions.get', 'Route response flags credit false.'],
  ['project.editSessions.create', 'Create session route returns card model capable data.'],
  ['project.editSessions.duplicate', 'Duplicate route resets approval status.'],
  ['project.editSessions.revisions.save', 'Append revision route can reset approval where relevant.'],
  ['project.editSessions.memory.upsert', 'Memory upsert preserves layer uniqueness.'],
  ['project.editSessions.sources.saveMany', 'Source save preserves source order.'],
  ['project.editSessions.bundle.get', 'Bundle route includes session/messages/sources/memory.'],
  ['project.editSessions.cardModels.get', 'Card model route respects aspect ratio.'],
  ['project.editSessions.cardModels.get', 'Legacy no-DNA session card still works.'],
  ['project.editSessions.cardModels.get', 'DNA-backed session card includes DNA badge.'],
  ['project.editSessions.list', 'No UI route is created.'],
  ['project.editSessions.list', 'No production HTTP endpoint is created.'],
  ['project.editSessions.list', 'No direct Supabase command is needed.'],
  ['project.editSessions.preference.apply', 'Preference apply updates session through repository seam.'],
  ['project.editSessions.preference.clear', 'Preference clear never mutates saved Edit Preference library.'],
  ['project.editSessions.preference.get', 'ProjectEditSession remains distinct from Edit Preference.'],
]

export const MOCK_PROJECT_EDIT_SESSION_API_ROUTE_SCENARIOS: MockProjectEditSessionApiRouteScenario[] =
  scenarioTitles.map(([routeId, title], index) => ({
    id: `project-edit-session-api-route-scenario-${String(index + 1).padStart(2, '0')}`,
    title,
    routeId,
    expectedOk: routeId !== 'project.editSessions.unknown',
    expectedMockOnly: true,
    expectedProviderCallMade: false,
    expectedSupabaseWriteMade: false,
    expectedRenderJobCreated: false,
    mockOnly: true,
    notes: [
      PROJECT_EDIT_SESSION_API_ROUTE_IDS.includes(routeId as ProjectEditSessionApiRouteId)
        ? 'Registered Project Edit Session route.'
        : 'Unknown route is expected to return a safe mock error.',
      'No provider, Supabase write, storage write, worker, render, generation, credit, file-byte, external URL, or media-processing effect is allowed.',
    ],
  }))

export function listMockProjectEditSessionApiRouteScenarios() {
  return MOCK_PROJECT_EDIT_SESSION_API_ROUTE_SCENARIOS
}
