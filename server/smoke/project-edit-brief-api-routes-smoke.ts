import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS,
  PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY,
  PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS,
  createProjectEditBriefApiRouteRegistrySummary,
  createProjectEditBriefRouteSafetySummary,
  createProjectEditBriefRouteSummary,
  getApiRouteById,
  handleMockApiRequest,
  handleProjectEditBriefMockRoute,
  runMockProjectEditBriefApiRouteRegistryFlow,
  runMockProjectEditBriefRouteAttachmentFlow,
  runMockProjectEditBriefRouteBriefFlow,
  runMockProjectEditBriefRouteExportSettingsFlow,
  runMockProjectEditBriefRouteMarkerFlow,
  runMockProjectEditBriefRouteReadinessFlow,
  runMockProjectEditBriefRouteSafetyFlow,
  runMockProjectEditBriefRouteTimelineDrawerBundleFlow,
  validateApiRouteDefinition,
} from '../../src/backend'
import { PROJECT_EDIT_BRIEF_API_ROUTE_IDS } from '../../src/types/api-routes'
import { createMockApiRuntimeContext } from '../../src/backend/api/mock-api-router'
import { createMockDatabase, type MockDatabase } from '../../src/backend/mock/mock-database'
import type { ApiRequestEnvelope, ApiResponseEnvelope } from '../../src/backend/api/api-runtime-contracts'

interface SmokeCheck {
  name: string
  ok: boolean
  details?: unknown
}

interface MockContextWithDb {
  mockDatabase: MockDatabase
}

const repoRoot = process.cwd()
const PROJECT_ID = 'mock-project-edit-chat-foundation'
const WORKSPACE_ID = 'mock-workspace-edit-brief'
const USER_ID = 'mock-user-edit-brief-owner'
const checks: SmokeCheck[] = []
const db = createMockDatabase()

const requiredDocs = [
  'docs/project-edit-brief-api-routes.md',
  'docs/project-edit-brief-api-client.md',
  'docs/project-edit-brief-api-route-boundary.md',
  'docs/project-edit-brief-route-repository-integration.md',
  'docs/project-edit-brief-client-transition-plan.md',
]

function record(name: string, ok: boolean, details?: unknown) {
  checks.push({ name, ok, details })
}

function request(routeId: string, body: unknown = {}): ApiRequestEnvelope {
  return {
    routeId,
    context: {
      ...createMockApiRuntimeContext({
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        userId: USER_ID,
        mockOnly: true,
      }),
      mockDatabase: db,
    } as ApiRequestEnvelope['context'] & MockContextWithDb,
    body,
  }
}

async function route(routeId: string, body: unknown = {}) {
  return handleMockApiRequest(request(routeId, body))
}

function migrationCount(): number {
  return readdirSync(path.join(repoRoot, 'supabase/migrations'))
    .filter((entry) => entry.endsWith('.sql'))
    .length
}

function noEnvelopeEffects(response: ApiResponseEnvelope) {
  return response.providerCallMade === false &&
    response.supabaseWriteMade === false &&
    response.generationRequestCreated === false &&
    response.renderJobCreated === false &&
    response.workerJobCreated === false &&
    response.creditReservedOrSpent === false
}

function assertSafe(response: ApiResponseEnvelope, label: string) {
  const safety = createProjectEditBriefRouteSafetySummary(response)
  record(`${label}_envelope_side_effects_false`, noEnvelopeEffects(response), response)
  record(`${label}_data_safety_flags_false`, safety.ok, safety)
  assert.equal(noEnvelopeEffects(response), true, `${label} envelope side-effect flags should be false`)
  assert.equal(safety.ok, true, `${label} data safety flags should be false`)
}

const registrySummary = createProjectEditBriefApiRouteRegistrySummary()
const routeSummary = createProjectEditBriefRouteSummary()

record('route_registry_loads', registrySummary.totalRoutes === PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length, registrySummary)
record('route_summary_loads', routeSummary.totalRoutes === PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length, routeSummary)
record('all_35_route_ids_registered', PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length === 35 && PROJECT_EDIT_BRIEF_API_ROUTE_IDS.every((id) => Boolean(getApiRouteById(id))))
record('all_route_definitions_validate', PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.every((routeDefinition) => validateApiRouteDefinition(routeDefinition).ok))
record('all_route_handlers_present', PROJECT_EDIT_BRIEF_API_ROUTE_IDS.every((id) => Boolean(PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS[id])))
record('scenario_count_at_least_60', MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS.length >= 60, MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS.length)
record('scenario_safety_flags', MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS.every((scenario) =>
  scenario.mockOnly &&
  scenario.expectedMockOnly &&
  scenario.expectedProviderCallMade === false &&
  scenario.expectedSupabaseWriteMade === false &&
  scenario.expectedStorageWriteMade === false &&
  scenario.expectedFileBytesRead === false &&
  scenario.expectedExternalUrlFetched === false &&
  scenario.expectedMediaProcessingStarted === false &&
  scenario.expectedRenderJobCreated === false,
))

const getSeeded = await route('project.editBrief.get')
const seededBriefId = (getSeeded.data as { brief?: { id?: string; editSessionId?: string } } | undefined)?.brief?.id
const seededEditSessionId = (getSeeded.data as { brief?: { editSessionId?: string } } | undefined)?.brief?.editSessionId
record('get_route_works', getSeeded.ok && Boolean(seededBriefId), getSeeded.data)
assertSafe(getSeeded, 'get')
assert.ok(seededBriefId, 'Expected seeded Edit Brief.')
assert.ok(seededEditSessionId, 'Expected seeded Edit Brief session id.')

const bySession = await route('project.editBrief.forSession.get', { editSessionId: seededEditSessionId })
record('for_session_route_works', bySession.ok && (bySession.data as { brief?: { editSessionId?: string } } | undefined)?.brief?.editSessionId === seededEditSessionId, bySession.data)
assertSafe(bySession, 'for_session')

const created = await route('project.editBrief.create', {
  projectId: PROJECT_ID,
  editSessionId: 'edit-session-edit-brief-api-smoke',
  title: 'API Route Smoke Edit Brief',
  summary: 'Created by RP-EDITBRIEF-04 route smoke.',
})
const createdBrief = (created.data as { brief?: { id?: string; editSessionId?: string; title?: string } } | undefined)?.brief
record('create_route_works', created.ok && createdBrief?.title === 'API Route Smoke Edit Brief', created.data)
assertSafe(created, 'create')
assert.ok(createdBrief?.id, 'Expected created brief id.')

const updated = await route('project.editBrief.update', {
  briefId: createdBrief.id,
  patch: { title: 'Updated API Route Smoke Edit Brief', status: 'active' },
})
record('update_route_works', updated.ok && (updated.data as { brief?: { title?: string } } | undefined)?.brief?.title === 'Updated API Route Smoke Edit Brief', updated.data)
assertSafe(updated, 'update')

const summary = await route('project.editBrief.summary', { briefId: createdBrief.id })
record('summary_route_works', summary.ok && typeof (summary.data as { summary?: unknown } | undefined)?.summary === 'string', summary.data)
assertSafe(summary, 'summary')

const bundle = await route('project.editBrief.bundle', { briefId: createdBrief.id })
record('bundle_route_works', bundle.ok && Boolean((bundle.data as { bundle?: { brief?: unknown } } | undefined)?.bundle?.brief), bundle.data)
assertSafe(bundle, 'bundle')

const markerCreate = await route('project.editBrief.markers.create', {
  briefId: createdBrief.id,
  editSessionId: createdBrief.editSessionId,
  markerType: 'caption_text',
  priority: 'must_follow',
  startTimeSeconds: 7,
  title: 'Add route smoke hook caption',
  userNote: 'Use a short metadata-only caption instruction.',
})
const marker = (markerCreate.data as { marker?: { id?: string; status?: string } } | undefined)?.marker
record('marker_create_route_works', markerCreate.ok && Boolean(marker?.id), markerCreate.data)
assertSafe(markerCreate, 'marker_create')
assert.ok(marker?.id, 'Expected marker id.')

const markersList = await route('project.editBrief.markers.list', { briefId: createdBrief.id })
record('markers_list_route_works', markersList.ok && ((markersList.data as { markers?: unknown[] } | undefined)?.markers?.length ?? 0) >= 1, markersList.data)
assertSafe(markersList, 'markers_list')

const markerGet = await route('project.editBrief.markers.get', { markerId: marker.id })
record('marker_get_route_works', markerGet.ok && (markerGet.data as { marker?: { id?: string } } | undefined)?.marker?.id === marker.id, markerGet.data)
assertSafe(markerGet, 'marker_get')

const markerUpdate = await route('project.editBrief.markers.update', {
  markerId: marker.id,
  patch: { status: 'needs_clarification', qaStatus: 'needs_clarification' },
})
record('marker_update_route_works', markerUpdate.ok && (markerUpdate.data as { marker?: { status?: string } } | undefined)?.marker?.status === 'needs_clarification', markerUpdate.data)
assertSafe(markerUpdate, 'marker_update')

const markerConfirm = await route('project.editBrief.markers.confirm', { markerId: marker.id, summary: 'Route smoke marker confirmed.' })
record('marker_confirm_route_works', markerConfirm.ok && (markerConfirm.data as { marker?: { status?: string } } | undefined)?.marker?.status === 'confirmed', markerConfirm.data)
assertSafe(markerConfirm, 'marker_confirm')

const attachmentAdd = await route('project.editBrief.markerAttachments.add', {
  markerId: marker.id,
  attachmentKind: 'reference_label',
  label: 'Route smoke attachment',
  notes: ['Metadata only.'],
})
const attachmentId = (attachmentAdd.data as { attachment?: { id?: string } } | undefined)?.attachment?.id
record('attachment_add_route_works', attachmentAdd.ok && Boolean(attachmentId), attachmentAdd.data)
assertSafe(attachmentAdd, 'attachment_add')
assert.ok(attachmentId, 'Expected attachment id.')

const attachmentList = await route('project.editBrief.markerAttachments.list', { markerId: marker.id })
record('attachment_list_route_works', attachmentList.ok && ((attachmentList.data as { attachments?: unknown[] } | undefined)?.attachments?.length ?? 0) >= 1, attachmentList.data)
assertSafe(attachmentList, 'attachment_list')

const markerMessageAppend = await route('project.editBrief.markerMessages.append', {
  markerId: marker.id,
  role: 'user',
  kind: 'note',
  text: 'Route smoke Marker Chat note.',
})
record('marker_message_append_route_works', markerMessageAppend.ok && Boolean((markerMessageAppend.data as { message?: unknown } | undefined)?.message), markerMessageAppend.data)
assertSafe(markerMessageAppend, 'marker_message_append')

const markerMessagesList = await route('project.editBrief.markerMessages.list', { markerId: marker.id })
record('marker_messages_list_route_works', markerMessagesList.ok && ((markerMessagesList.data as { messages?: unknown[] } | undefined)?.messages?.length ?? 0) >= 1, markerMessagesList.data)
assertSafe(markerMessagesList, 'marker_messages_list')

const intentSave = await route('project.editBrief.markerIntent.save', {
  markerId: marker.id,
  action: 'add_caption_or_text',
  instruction: 'Add a concise caption hook.',
})
const intentId = (intentSave.data as { intent?: { id?: string } } | undefined)?.intent?.id
record('intent_save_route_works', intentSave.ok && Boolean(intentId), intentSave.data)
assertSafe(intentSave, 'intent_save')
assert.ok(intentId, 'Expected intent id.')

const intentGet = await route('project.editBrief.markerIntent.get', { markerId: marker.id })
record('intent_get_route_works', intentGet.ok && (intentGet.data as { intent?: { id?: string } } | undefined)?.intent?.id === intentId, intentGet.data)
assertSafe(intentGet, 'intent_get')

const intentUpdate = await route('project.editBrief.markerIntent.update', {
  intentId,
  patch: { status: 'confirmed', confidence: 'high' },
})
record('intent_update_route_works', intentUpdate.ok && (intentUpdate.data as { intent?: { status?: string } } | undefined)?.intent?.status === 'confirmed', intentUpdate.data)
assertSafe(intentUpdate, 'intent_update')

const confirmationSave = await route('project.editBrief.markerConfirmations.save', {
  markerId: marker.id,
  intentId,
  summary: 'Route smoke confirmation.',
})
record('confirmation_save_route_works', confirmationSave.ok && Boolean((confirmationSave.data as { confirmation?: unknown } | undefined)?.confirmation), confirmationSave.data)
assertSafe(confirmationSave, 'confirmation_save')

const confirmationsList = await route('project.editBrief.markerConfirmations.list', { markerId: marker.id })
record('confirmations_list_route_works', confirmationsList.ok && ((confirmationsList.data as { confirmations?: unknown[] } | undefined)?.confirmations?.length ?? 0) >= 1, confirmationsList.data)
assertSafe(confirmationsList, 'confirmations_list')

const conflictSave = await route('project.editBrief.markerConflicts.save', {
  markerId: marker.id,
  title: 'Route smoke conflict',
  summary: 'Test conflict.',
})
record('conflict_save_route_works', conflictSave.ok && Boolean((conflictSave.data as { conflict?: unknown } | undefined)?.conflict), conflictSave.data)
assertSafe(conflictSave, 'conflict_save')

const conflictsList = await route('project.editBrief.markerConflicts.list', { briefId: createdBrief.id })
record('conflicts_list_route_works', conflictsList.ok && ((conflictsList.data as { conflicts?: unknown[] } | undefined)?.conflicts?.length ?? 0) >= 1, conflictsList.data)
assertSafe(conflictsList, 'conflicts_list')

const revisionSave = await route('project.editBrief.markerRevisions.save', {
  markerId: marker.id,
  previousIntentId: intentId,
  summary: 'Route smoke marker revision.',
  reason: 'Test revision.',
})
record('revision_save_route_works', revisionSave.ok && Boolean((revisionSave.data as { revision?: unknown } | undefined)?.revision), revisionSave.data)
assertSafe(revisionSave, 'revision_save')

const revisionsList = await route('project.editBrief.markerRevisions.list', { markerId: marker.id })
record('revisions_list_route_works', revisionsList.ok && ((revisionsList.data as { revisions?: unknown[] } | undefined)?.revisions?.length ?? 0) >= 1, revisionsList.data)
assertSafe(revisionsList, 'revisions_list')

const logAppend = await route('project.editBrief.applicationLogs.append', {
  briefId: createdBrief.id,
  markerId: marker.id,
  summary: 'Route smoke application log.',
})
record('application_log_append_route_works', logAppend.ok && Boolean((logAppend.data as { applicationLog?: unknown } | undefined)?.applicationLog), logAppend.data)
assertSafe(logAppend, 'application_log_append')

const logsList = await route('project.editBrief.applicationLogs.list', { briefId: createdBrief.id })
record('application_logs_list_route_works', logsList.ok && ((logsList.data as { applicationLogs?: unknown[] } | undefined)?.applicationLogs?.length ?? 0) >= 1, logsList.data)
assertSafe(logsList, 'application_logs_list')

const exportRecommend = await route('project.editBrief.exportSettings.recommend', {
  projectId: PROJECT_ID,
  editSessionId: createdBrief.editSessionId,
  platformTarget: 'youtube_standard',
})
record('export_settings_recommend_route_works', exportRecommend.ok && Boolean((exportRecommend.data as { exportSettings?: unknown } | undefined)?.exportSettings), exportRecommend.data)
assertSafe(exportRecommend, 'export_settings_recommend')

const exportGet = await route('project.editBrief.exportSettings.get', { editSessionId: createdBrief.editSessionId })
record('export_settings_get_route_works', exportGet.ok && Boolean((exportGet.data as { exportSettings?: unknown } | undefined)?.exportSettings), exportGet.data)
assertSafe(exportGet, 'export_settings_get')

const exportUpdate = await route('project.editBrief.exportSettings.update', {
  editSessionId: createdBrief.editSessionId,
  patch: { frameRate: 30, summary: 'Updated route smoke export settings.' },
})
record('export_settings_update_route_works', exportUpdate.ok && (exportUpdate.data as { exportSettings?: { summary?: string } } | undefined)?.exportSettings?.summary === 'Updated route smoke export settings.', exportUpdate.data)
assertSafe(exportUpdate, 'export_settings_update')

const timeline = await route('project.editBrief.timeline.models', { briefId: createdBrief.id })
record('timeline_models_route_works', timeline.ok && ((timeline.data as { timelineMarkers?: unknown[] } | undefined)?.timelineMarkers?.length ?? 0) >= 1, timeline.data)
assertSafe(timeline, 'timeline_models')

const drawer = await route('project.editBrief.markerDrawer.get', { markerId: marker.id })
record('marker_drawer_route_works', drawer.ok && Boolean((drawer.data as { drawer?: unknown } | undefined)?.drawer), drawer.data)
assertSafe(drawer, 'marker_drawer')

const archivedMarker = await route('project.editBrief.markers.archive', { markerId: marker.id })
record('marker_archive_route_works', archivedMarker.ok && (archivedMarker.data as { marker?: { status?: string } } | undefined)?.marker?.status === 'archived', archivedMarker.data)
assertSafe(archivedMarker, 'marker_archive')

const deleteMarkerCreate = await route('project.editBrief.markers.create', {
  briefId: createdBrief.id,
  editSessionId: createdBrief.editSessionId,
  title: 'Delete route smoke marker',
})
const deleteMarkerId = (deleteMarkerCreate.data as { marker?: { id?: string } } | undefined)?.marker?.id
assert.ok(deleteMarkerId, 'Expected marker id for delete route.')
const deletedMarker = await route('project.editBrief.markers.delete', { markerId: deleteMarkerId })
record('marker_delete_route_works', deletedMarker.ok && (deletedMarker.data as { deleted?: boolean } | undefined)?.deleted === true, deletedMarker.data)
assertSafe(deletedMarker, 'marker_delete')

const attachmentRemoved = await route('project.editBrief.markerAttachments.remove', { attachmentId })
record('attachment_remove_route_works', attachmentRemoved.ok && (attachmentRemoved.data as { removed?: boolean } | undefined)?.removed === true, attachmentRemoved.data)
assertSafe(attachmentRemoved, 'attachment_remove')

const archivedBrief = await route('project.editBrief.archive', { briefId: createdBrief.id })
record('archive_route_works', archivedBrief.ok && (archivedBrief.data as { brief?: { status?: string } } | undefined)?.brief?.status === 'archived', archivedBrief.data)
assertSafe(archivedBrief, 'archive')

const unknown = await handleProjectEditBriefMockRoute(request('project.editBrief.unknown'))
record('unknown_route_safe_error', !unknown.ok && unknown.mockOnly, unknown)
assertSafe(unknown, 'unknown')

const registryFlow = runMockProjectEditBriefApiRouteRegistryFlow()
const briefFlow = await runMockProjectEditBriefRouteBriefFlow()
const markerFlow = await runMockProjectEditBriefRouteMarkerFlow()
const attachmentFlow = await runMockProjectEditBriefRouteAttachmentFlow()
const exportFlow = await runMockProjectEditBriefRouteExportSettingsFlow()
const timelineFlow = await runMockProjectEditBriefRouteTimelineDrawerBundleFlow()
const safetyFlow = await runMockProjectEditBriefRouteSafetyFlow()
const readinessFlow = runMockProjectEditBriefRouteReadinessFlow()
record('orchestrator_registry_flow_works', registryFlow.ok, registryFlow)
record('orchestrator_brief_flow_works', briefFlow.ok, briefFlow.summary)
record('orchestrator_marker_flow_works', markerFlow.ok, markerFlow.summary)
record('orchestrator_attachment_flow_works', attachmentFlow.ok, attachmentFlow.summary)
record('orchestrator_export_flow_works', exportFlow.ok, exportFlow.summary)
record('orchestrator_timeline_flow_works', timelineFlow.ok, timelineFlow.summary)
record('orchestrator_safety_flow_works', safetyFlow.ok, safetyFlow.summary)
record('orchestrator_readiness_flow_works', readinessFlow.ok, readinessFlow.summary)

for (const doc of requiredDocs) {
  const exists = existsSync(path.join(repoRoot, doc))
  record(`${doc}_exists`, exists)
  if (exists) {
    const content = readFileSync(path.join(repoRoot, doc), 'utf8')
    record(`${doc}_mentions_mock_boundary`, /mock\/local|mock route|No production/i.test(content), doc)
  }
}

record('migration_count_remains_24', migrationCount() === 24, migrationCount())

const failedChecks = checks.filter((check) => !check.ok)
assert.equal(failedChecks.length, 0, `RP-EDITBRIEF-04 API route smoke failed: ${failedChecks.map((check) => check.name).join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-EDITBRIEF-04',
  routeCount: PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length,
  scenarioCount: MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS.length,
  checkedRoutes: PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length,
  migrationCount: migrationCount(),
  productionHttpCreated: false,
  supabaseCommandRun: false,
  noProductionEffects: true,
  nextStep: 'RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline',
}, null, 2))
