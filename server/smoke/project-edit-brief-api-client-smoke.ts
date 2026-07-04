import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import type { ReeditProApiResponseEnvelope } from '../../src/types/api-routes'
import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerRecord,
  ProjectEditSessionExportSettingsRecord,
} from '../../src/types/project-edit-brief'
import {
  addProjectEditBriefMarkerAttachmentViaApi,
  appendProjectEditBriefMarkerMessageViaApi,
  confirmProjectEditBriefMarkerViaApi,
  createProjectEditBriefMarkerViaApi,
  createProjectEditBriefSummaryForUI,
  createProjectEditBriefTimelineForUI,
  createProjectEditBriefViaApi,
  getProjectEditBriefBundleViaApi,
  getProjectEditBriefForSessionViaApi,
  getProjectEditBriefMarkerDrawerViaApi,
  getProjectEditBriefTimelineModelsViaApi,
  getProjectEditSessionExportSettingsViaApi,
  listProjectEditBriefMarkerAttachmentsViaApi,
  listProjectEditBriefMarkerMessagesViaApi,
  listProjectEditBriefMarkersViaApi,
  recommendProjectEditSessionExportSettingsViaApi,
  saveProjectEditBriefMarkerIntentViaApi,
  updateProjectEditBriefMarkerViaApi,
  updateProjectEditSessionExportSettingsViaApi,
} from '../../src/lib/project-edit-brief-api-client-adapter'
import {
  createDefaultMockProjectEditBriefApiClient,
  listProjectEditBriefApiClientRouteIds,
} from '../../src/lib/project-edit-brief-api-client'
import {
  createProjectEditBriefApiClientSummary,
  createProjectEditBriefApiResultSummary,
} from '../../src/lib/project-edit-brief-api-client-summaries'

interface SmokeCheck {
  name: string
  ok: boolean
  details?: unknown
}

const repoRoot = process.cwd()
const PROJECT_ID = 'mock-project-edit-chat-foundation'
const checks: SmokeCheck[] = []

const browserSafeFiles = [
  'src/lib/project-edit-brief-api-client.ts',
  'src/lib/project-edit-brief-api-client-adapter.ts',
  'src/lib/project-edit-brief-api-client-summaries.ts',
]

function record(name: string, ok: boolean, details?: unknown) {
  checks.push({ name, ok, details })
}

function migrationCount(): number {
  return readdirSync(path.join(repoRoot, 'supabase/migrations'))
    .filter((entry) => entry.endsWith('.sql'))
    .length
}

function assertSafe(response: ReeditProApiResponseEnvelope, label: string) {
  const summary = createProjectEditBriefApiResultSummary(response)
  record(`${label}_client_response_safe`, summary.ok, summary)
  assert.equal(summary.ok, true, `${label} violated Project Edit Brief API client safety: ${summary.blockedReasons.join(', ')}`)
}

function assertOk<T>(response: ReeditProApiResponseEnvelope<T>, label: string): T {
  assertSafe(response, label)
  assert.equal(response.ok, true, `${label} failed: ${response.error?.message ?? 'unknown error'}`)
  assert.ok(response.data, `${label} did not return data`)
  return response.data
}

for (const file of browserSafeFiles) {
  const content = readFileSync(path.join(repoRoot, file), 'utf8')
  record(`${file}_has_no_backend_import`, !/from ['"]\.\.\/backend|from ['"].*src\/backend|from ['"].*\/backend\//.test(content), file)
  record(`${file}_has_no_server_only_runtime_import`, !/from ['"].*(supabase|service-role|child_process|ffmpeg|ffprobe|whisper|opencv|worker)/i.test(content), file)
}

const client = createDefaultMockProjectEditBriefApiClient({
  projectId: PROJECT_ID,
  workspaceId: 'mock-workspace-edit-brief',
  userId: 'mock-user-edit-brief-owner',
  preserveMockSession: true,
})

const clientSummary = createProjectEditBriefApiClientSummary()
record('client_summary_ready', clientSummary.status === 'browser_mock_api_client_ready', clientSummary)
record('client_uses_mock_transport', client.transport.mode === 'mock_browser' && client.safety.mockOnly, client.safety)
record('client_lists_35_route_ids', listProjectEditBriefApiClientRouteIds().length === 35, listProjectEditBriefApiClientRouteIds())
const qwenReadiness = await client.loadQwenMarkerChatReadiness()
record('client_exposes_local_qwen_readiness', qwenReadiness.status === 'local_fallback_active' && !qwenReadiness.ready, qwenReadiness)
record('client_qwen_readiness_flags_safe', !qwenReadiness.providerCallMade && !qwenReadiness.qwenCallMade && !qwenReadiness.secretValuePrinted, qwenReadiness)

const forSession = assertOk(await client.brief.get<{ brief: { id: string; editSessionId: string } }>('project-edit-brief-broll-attached'), 'brief_get')
record('client_gets_brief_for_session', Boolean(forSession.brief.id), forSession.brief)
const seededBriefId = forSession.brief.id

const seededBundle = assertOk(await client.brief.bundle<{ bundle: ProjectEditBriefBundleRecord }>(seededBriefId), 'brief_bundle')
record('client_gets_seeded_bundle', seededBundle.bundle.markers.length >= 1, seededBundle.bundle)
const seededMarkerId = seededBundle.bundle.markers[0]?.id
assert.ok(seededMarkerId, 'Expected seeded marker id.')

const created = assertOk(await client.brief.create<{ brief: { id: string; editSessionId: string; title: string } }>({
  projectId: PROJECT_ID,
  editSessionId: 'edit-session-edit-brief-api-client-smoke',
  title: 'API Client Smoke Edit Brief',
}), 'brief_create')
record('client_creates_brief', created.brief.title === 'API Client Smoke Edit Brief', created.brief)

const createdMarker = assertOk(await client.markers.create<{ marker: ProjectEditBriefMarkerRecord }>({
  briefId: created.brief.id,
  editSessionId: created.brief.editSessionId,
  markerType: 'broll',
  title: 'API client B-roll marker',
  userNote: 'Metadata-only B-roll instruction.',
  startTimeSeconds: 12,
}), 'marker_create')
record('client_creates_marker', createdMarker.marker.markerType === 'broll', createdMarker.marker)

const markers = assertOk(await client.markers.list<{ markers: ProjectEditBriefMarkerRecord[] }>(created.brief.id), 'markers_list')
record('client_lists_markers', markers.markers.some((marker) => marker.id === createdMarker.marker.id), markers.markers)

const updatedMarker = assertOk(await client.markers.update<{ marker: ProjectEditBriefMarkerRecord }>({
  markerId: createdMarker.marker.id,
  patch: { status: 'needs_asset', qaStatus: 'needs_asset' },
}), 'marker_update')
record('client_updates_marker', updatedMarker.marker.status === 'needs_asset', updatedMarker.marker)

const confirmedMarker = assertOk(await client.markers.confirm<{ marker: ProjectEditBriefMarkerRecord }>({
  markerId: createdMarker.marker.id,
  summary: 'API client smoke marker confirmed.',
}), 'marker_confirm')
record('client_confirms_marker', confirmedMarker.marker.status === 'confirmed', confirmedMarker.marker)

const attachment = assertOk(await client.attachments.add<{ attachment: unknown }>({
  markerId: createdMarker.marker.id,
  attachmentKind: 'reference_label',
  label: 'API client metadata attachment',
  notes: ['Metadata only.'],
}), 'attachment_add')
record('client_adds_attachment', Boolean(attachment.attachment), attachment)

const attachments = assertOk(await client.attachments.list<{ attachments: unknown[] }>(createdMarker.marker.id), 'attachment_list')
record('client_lists_attachments', attachments.attachments.length >= 1, attachments.attachments)

const message = assertOk(await client.markerMessages.append<{ message: unknown }>({
  markerId: createdMarker.marker.id,
  role: 'user',
  kind: 'note',
  text: 'API client Marker Chat note.',
}), 'marker_message_append')
record('client_appends_marker_message', Boolean(message.message), message)

const messages = assertOk(await client.markerMessages.list<{ messages: unknown[] }>(createdMarker.marker.id), 'marker_messages_list')
record('client_lists_marker_messages', messages.messages.length >= 1, messages.messages)

const intent = assertOk(await client.intent.save<{ intent: unknown }>({
  markerId: createdMarker.marker.id,
  action: 'add_broll',
  instruction: 'Use metadata-only B-roll instruction.',
}), 'intent_save')
record('client_saves_intent', Boolean(intent.intent), intent)

const confirmation = assertOk(await client.confirmations.save<{ confirmation: unknown }>({
  markerId: createdMarker.marker.id,
  summary: 'API client confirmation.',
}), 'confirmation_save')
record('client_saves_confirmation', Boolean(confirmation.confirmation), confirmation)

const conflict = assertOk(await client.conflicts.save<{ conflict: unknown }>({
  markerId: createdMarker.marker.id,
  title: 'API client mock conflict',
}), 'conflict_save')
record('client_saves_conflict', Boolean(conflict.conflict), conflict)

const revision = assertOk(await client.revisions.save<{ revision: unknown }>({
  markerId: createdMarker.marker.id,
  summary: 'API client revision.',
  reason: 'Test change.',
}), 'revision_save')
record('client_saves_revision', Boolean(revision.revision), revision)

const log = assertOk(await client.applicationLogs.append<{ applicationLog: unknown }>({
  briefId: created.brief.id,
  markerId: createdMarker.marker.id,
  summary: 'API client application log.',
}), 'application_log_append')
record('client_appends_application_log', Boolean(log.applicationLog), log)

const exportSettings = assertOk(await client.exportSettings.recommend<{ exportSettings: ProjectEditSessionExportSettingsRecord }>({
  projectId: PROJECT_ID,
  editSessionId: created.brief.editSessionId,
  platformTarget: 'youtube_standard',
}), 'export_settings_recommend')
record('client_recommends_export_settings', exportSettings.exportSettings.aspectRatio === '16:9', exportSettings.exportSettings)

const exportGet = assertOk(await client.exportSettings.get<{ exportSettings: ProjectEditSessionExportSettingsRecord }>(created.brief.editSessionId), 'export_settings_get')
record('client_gets_export_settings', exportGet.exportSettings.editSessionId === created.brief.editSessionId, exportGet.exportSettings)

const exportUpdate = assertOk(await client.exportSettings.update<{ exportSettings: ProjectEditSessionExportSettingsRecord }>({
  editSessionId: created.brief.editSessionId,
  patch: { summary: 'API client updated export settings.' },
}), 'export_settings_update')
record('client_updates_export_settings', exportUpdate.exportSettings.summary === 'API client updated export settings.', exportUpdate.exportSettings)

const timeline = assertOk(await client.timeline.models<{ timelineMarkers: unknown[] }>(created.brief.id), 'timeline_models')
record('client_loads_timeline_models', timeline.timelineMarkers.length >= 1, timeline.timelineMarkers)

const drawer = assertOk(await client.drawer.get<{ drawer: ProjectEditBriefMarkerDrawerModel }>(createdMarker.marker.id), 'drawer_get')
record('client_loads_drawer_model', drawer.drawer.marker.id === createdMarker.marker.id, drawer.drawer)

const adapterBrief = await getProjectEditBriefForSessionViaApi(created.brief.editSessionId, client)
record('adapter_gets_brief_for_session', adapterBrief.summary.ok && adapterBrief.brief?.id === created.brief.id, adapterBrief.summary)

const adapterCreated = await createProjectEditBriefViaApi({
  projectId: PROJECT_ID,
  editSessionId: 'edit-session-adapter-brief-smoke',
  title: 'Adapter Smoke Edit Brief',
}, client)
record('adapter_creates_brief', adapterCreated.summary.ok && Boolean(adapterCreated.brief), adapterCreated.summary)

const adapterMarker = await createProjectEditBriefMarkerViaApi({
  briefId: adapterCreated.brief?.id,
  editSessionId: 'edit-session-adapter-brief-smoke',
  title: 'Adapter marker',
}, client)
record('adapter_creates_marker', adapterMarker.summary.ok && Boolean(adapterMarker.marker), adapterMarker.summary)

const adapterMarkers = await listProjectEditBriefMarkersViaApi(created.brief.id, client)
record('adapter_lists_markers', adapterMarkers.markers.length >= 1, adapterMarkers.markers)

const adapterMarkerUpdate = await updateProjectEditBriefMarkerViaApi({
  markerId: createdMarker.marker.id,
  patch: { status: 'confirmed' },
}, client)
record('adapter_updates_marker', adapterMarkerUpdate.summary.ok, adapterMarkerUpdate.summary)

const adapterConfirm = await confirmProjectEditBriefMarkerViaApi({
  markerId: createdMarker.marker.id,
  summary: 'Adapter confirmation.',
}, client)
record('adapter_confirms_marker', adapterConfirm.summary.ok, adapterConfirm.summary)

const adapterMessages = await listProjectEditBriefMarkerMessagesViaApi(createdMarker.marker.id, client)
record('adapter_lists_marker_messages', adapterMessages.messages.length >= 1, adapterMessages.messages)

const adapterMessage = await appendProjectEditBriefMarkerMessageViaApi({
  markerId: createdMarker.marker.id,
  text: 'Adapter Marker Chat message.',
}, client)
record('adapter_appends_marker_message', adapterMessage.summary.ok, adapterMessage.summary)

const adapterIntent = await saveProjectEditBriefMarkerIntentViaApi({
  markerId: createdMarker.marker.id,
  instruction: 'Adapter structured intent.',
}, client)
record('adapter_saves_intent', adapterIntent.summary.ok, adapterIntent.summary)

const adapterAttachments = await listProjectEditBriefMarkerAttachmentsViaApi(createdMarker.marker.id, client)
record('adapter_lists_attachments', adapterAttachments.attachments.length >= 1, adapterAttachments.attachments)

const adapterAttachment = await addProjectEditBriefMarkerAttachmentViaApi({
  markerId: createdMarker.marker.id,
  label: 'Adapter metadata attachment',
}, client)
record('adapter_adds_attachment', adapterAttachment.summary.ok, adapterAttachment.summary)

const adapterBundle = await getProjectEditBriefBundleViaApi(created.brief.id, client)
record('adapter_gets_bundle', adapterBundle.summary.ok && Boolean(adapterBundle.uiSummary), adapterBundle.uiSummary)

const adapterDrawer = await getProjectEditBriefMarkerDrawerViaApi(createdMarker.marker.id, client)
record('adapter_gets_drawer', adapterDrawer.summary.ok && Boolean(adapterDrawer.uiModel), adapterDrawer.uiModel)

const adapterTimeline = await getProjectEditBriefTimelineModelsViaApi(created.brief.id, client)
record('adapter_gets_timeline', adapterTimeline.summary.ok && adapterTimeline.timelineMarkers.length >= 1, adapterTimeline.uiModel)

const adapterExportGet = await getProjectEditSessionExportSettingsViaApi(created.brief.editSessionId, client)
record('adapter_gets_export_settings', adapterExportGet.summary.ok, adapterExportGet.summary)

const adapterExportRecommend = await recommendProjectEditSessionExportSettingsViaApi({
  editSessionId: 'edit-session-adapter-export',
  platformTarget: 'instagram_reel',
}, client)
record('adapter_recommends_export_settings', adapterExportRecommend.summary.ok, adapterExportRecommend.summary)

const adapterExportUpdate = await updateProjectEditSessionExportSettingsViaApi({
  editSessionId: created.brief.editSessionId,
  patch: { summary: 'Adapter updated export settings.' },
}, client)
record('adapter_updates_export_settings', adapterExportUpdate.summary.ok, adapterExportUpdate.summary)

const uiSummary = createProjectEditBriefSummaryForUI(seededBundle.bundle)
record('ui_summary_ready', uiSummary.ok && uiSummary.markerCount >= 1, uiSummary)

const uiTimeline = createProjectEditBriefTimelineForUI(seededBundle.bundle.timelineMarkers)
record('ui_timeline_ready', uiTimeline.count === seededBundle.bundle.timelineMarkers.length, uiTimeline)

record('docs_exist', [
  'docs/project-edit-brief-api-routes.md',
  'docs/project-edit-brief-api-client.md',
  'docs/project-edit-brief-api-route-boundary.md',
  'docs/project-edit-brief-route-repository-integration.md',
  'docs/project-edit-brief-client-transition-plan.md',
].every((doc) => existsSync(path.join(repoRoot, doc))))

record('migration_count_remains_24', migrationCount() === 24, migrationCount())

const failedChecks = checks.filter((check) => !check.ok)
assert.equal(failedChecks.length, 0, `RP-EDITBRIEF-04 API client smoke failed: ${failedChecks.map((check) => check.name).join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-EDITBRIEF-04',
  routeClient: 'browser_mock',
  routeCount: listProjectEditBriefApiClientRouteIds().length,
  realHttpUsed: false,
  backendImportsInClient: false,
  noProductionEffects: true,
  migrationCount: migrationCount(),
  nextStep: 'RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline',
}, null, 2))
