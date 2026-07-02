export type ReeditProApiRouteGroup =
  | 'preference_library'
  | 'preference_creation'
  | 'preference_source_video'
  | 'preference_signals'
  | 'preference_auto'
  | 'preference_project'
  | 'preference_project_setup'
  | 'preference_apply'
  | 'preference_qa'
  | 'preference_revision'
  | 'preference_internal'
  | 'media_assets'
  | 'storage_runtime'
  | 'source_sequence'
  | 'project_edit_sessions'
  | 'project_edit_brief'
  | 'model_routing'
  | 'provider_config'
  | 'tool_stack'
  | 'internal_testing'

export type ReeditProApiRouteRuntime =
  | 'mock_local'
  | 'backend_local'
  | 'backend_production_future'
  | 'worker_future'
  | 'disabled'

export type ReeditProApiRouteMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'DELETE'
  | 'MOCK'

export type ReeditProApiRouteAuthRequirement =
  | 'none_mock_only'
  | 'user_session_required'
  | 'workspace_member_required'
  | 'project_member_required'
  | 'service_role_backend_only'
  | 'worker_lease_required'
  | 'future'

export type ReeditProApiRouteSafetyGate =
  | 'mock_only'
  | 'no_provider_calls'
  | 'no_supabase_writes'
  | 'no_generation_requests'
  | 'no_render_jobs'
  | 'no_worker_jobs'
  | 'no_credit_reservation'
  | 'no_storage_writes'
  | 'no_signed_urls'
  | 'no_file_reads'
  | 'no_external_url_fetch'
  | 'no_media_processing'
  | 'approval_required'
  | 'credit_estimate_required'
  | 'credit_reservation_required_future'
  | 'backend_secret_boundary'
  | 'frontend_safe_response'

export type ReeditProApiRouteStatus =
  | 'registered_mock'
  | 'mock_handler_ready'
  | 'blocked_pending_persistence'
  | 'blocked_pending_auth'
  | 'blocked_pending_supabase'
  | 'blocked_pending_worker_runtime'
  | 'blocked_pending_provider_runtime'
  | 'production_not_ready'
  | 'disabled'

export const EDIT_PREFERENCE_API_ROUTE_IDS = [
  'preference.library.list',
  'preference.library.get',
  'preference.library.getByHandle',
  'preference.library.search',
  'preference.library.create',
  'preference.library.update',
  'preference.library.archive',
  'preference.library.unarchive',
  'preference.library.duplicate',
  'preference.library.tags.list',
  'preference.library.tags.add',
  'preference.library.tags.remove',
  'preference.library.versions.list',
  'preference.library.versions.create',
  'preference.library.versions.setCurrent',
  'preference.create.blank',
  'preference.create.chatDescription',
  'preference.create.reference',
  'preference.create.previousEdit',
  'preference.sourceVideo.preview',
  'preference.sourceVideo.study.plan',
  'preference.sourceVideo.study.runMock',
  'preference.sourceVideo.dna.buildMock',
  'preference.sourceVideo.dna.get',
  'preference.sourceVideo.dna.layers',
  'preference.sourceVideo.dna.qa.run',
  'preference.sourceVideo.dna.summary',
  'preference.signals.collect',
  'preference.signals.list',
  'preference.signals.summary',
  'preference.auto.createCandidate',
  'preference.auto.preview',
  'preference.project.selectSaved',
  'preference.project.selectAuto',
  'preference.project.selectCreated',
  'preference.project.snapshot.create',
  'preference.project.snapshot.current',
  'preference.project.snapshot.approve',
  'preference.project.resolve',
  'preference.project.contract.get',
  'preference.project.dna.summary',
  'preference.project.dna.applyMock',
  'preference.project.dna.reviewStatus',
  'preference.projectSetup.run',
  'preference.projectSetup.auto',
  'preference.projectSetup.saved',
  'preference.projectSetup.created',
  'preference.projectSetup.readiness',
  'preference.projectSetup.summary',
  'preference.apply.editPlan',
  'preference.apply.creativeSystems',
  'preference.qa.run',
  'preference.qa.summary',
  'preference.revision.learn',
  'preference.revision.applyProject',
  'preference.revision.suggestSave',
  'preference.revision.saveToPreference',
  'preference.revision.saveAsNewPreference',
  'preference.internal.status',
  'preference.internal.scenarios',
  'preference.internal.mockReset',
] as const

export type EditPreferenceApiRouteId = typeof EDIT_PREFERENCE_API_ROUTE_IDS[number]

export const MEDIA_ASSET_API_ROUTE_IDS = [
  'media.assets.createMock',
  'media.assets.get',
  'media.assets.listProject',
  'media.assets.listPreferenceSources',
  'media.assets.update',
  'media.uploadSession.createMock',
  'media.uploadSession.completeMock',
  'media.preview.createMock',
  'media.thumbnail.createMock',
  'media.sourceOrder.save',
  'media.sourceOrder.load',
  'media.sourceOrder.summary',
  'media.preferenceSource.attach',
  'media.projectSource.attach',
  'media.externalReference.createMetadataOnly',
  'media.storage.readiness',
  'media.storage.status',
] as const

export type MediaAssetApiRouteId = typeof MEDIA_ASSET_API_ROUTE_IDS[number]

export const PROJECT_EDIT_SESSION_API_ROUTE_IDS = [
  'project.editSessions.list',
  'project.editSessions.get',
  'project.editSessions.create',
  'project.editSessions.update',
  'project.editSessions.archive',
  'project.editSessions.duplicate',
  'project.editSessions.cardModels.list',
  'project.editSessions.cardModels.get',
  'project.editSessions.bundle.get',
  'project.editSessions.summary.get',
  'project.editSessions.messages.list',
  'project.editSessions.messages.append',
  'project.editSessions.sources.list',
  'project.editSessions.sources.save',
  'project.editSessions.sources.saveMany',
  'project.editSessions.memory.list',
  'project.editSessions.memory.getLayer',
  'project.editSessions.memory.upsert',
  'project.editSessions.snapshots.save',
  'project.editSessions.snapshots.latest',
  'project.editSessions.snapshots.list',
  'project.editSessions.versions.save',
  'project.editSessions.versions.latest',
  'project.editSessions.versions.list',
  'project.editSessions.previews.save',
  'project.editSessions.previews.latest',
  'project.editSessions.previews.list',
  'project.editSessions.revisions.save',
  'project.editSessions.revisions.list',
  'project.editSessions.events.append',
  'project.editSessions.events.list',
  'project.editSessions.preference.options',
  'project.editSessions.preference.get',
  'project.editSessions.preference.apply',
  'project.editSessions.preference.clear',
  'project.editSessions.preference.dnaSummary',
  'project.editSessions.preference.applicationSummary',
] as const

export type ProjectEditSessionApiRouteId = typeof PROJECT_EDIT_SESSION_API_ROUTE_IDS[number]

export const PROJECT_EDIT_BRIEF_API_ROUTE_IDS = [
  'project.editBrief.get',
  'project.editBrief.forSession.get',
  'project.editBrief.create',
  'project.editBrief.update',
  'project.editBrief.archive',
  'project.editBrief.summary',
  'project.editBrief.bundle',
  'project.editBrief.markers.list',
  'project.editBrief.markers.get',
  'project.editBrief.markers.create',
  'project.editBrief.markers.update',
  'project.editBrief.markers.delete',
  'project.editBrief.markers.confirm',
  'project.editBrief.markers.archive',
  'project.editBrief.markerAttachments.list',
  'project.editBrief.markerAttachments.add',
  'project.editBrief.markerAttachments.remove',
  'project.editBrief.markerMessages.list',
  'project.editBrief.markerMessages.append',
  'project.editBrief.markerIntent.get',
  'project.editBrief.markerIntent.save',
  'project.editBrief.markerIntent.update',
  'project.editBrief.markerConfirmations.list',
  'project.editBrief.markerConfirmations.save',
  'project.editBrief.markerConflicts.list',
  'project.editBrief.markerConflicts.save',
  'project.editBrief.markerRevisions.list',
  'project.editBrief.markerRevisions.save',
  'project.editBrief.applicationLogs.list',
  'project.editBrief.applicationLogs.append',
  'project.editBrief.exportSettings.get',
  'project.editBrief.exportSettings.recommend',
  'project.editBrief.exportSettings.update',
  'project.editBrief.timeline.models',
  'project.editBrief.markerDrawer.get',
] as const

export type ProjectEditBriefApiRouteId = typeof PROJECT_EDIT_BRIEF_API_ROUTE_IDS[number]

export type ReeditProMockApiRouteId =
  | EditPreferenceApiRouteId
  | MediaAssetApiRouteId
  | ProjectEditSessionApiRouteId
  | ProjectEditBriefApiRouteId

export interface ReeditProApiRouteDefinition<RouteId extends string = string> {
  id: RouteId
  group: ReeditProApiRouteGroup
  displayName: string
  description: string
  method: ReeditProApiRouteMethod
  runtime: ReeditProApiRouteRuntime
  status: ReeditProApiRouteStatus
  authRequirement: ReeditProApiRouteAuthRequirement
  safetyGates: ReeditProApiRouteSafetyGate[]
  mockOnly: boolean
  productionReady: boolean
  frontendCallableInMock: boolean
  backendOnlyInProduction: boolean
  requestSchemaName: string
  responseSchemaName: string
  notes: string[]
}

export interface ReeditProApiRequestEnvelope<TPayload = unknown> {
  routeId: string
  requestId: string
  workspaceId?: string
  projectId?: string
  userId?: string
  payload: TPayload
  mockOnly: boolean
  requestedAt: string
  metadata?: Record<string, unknown>
}

export interface ReeditProApiResponseEnvelope<TData = unknown> {
  routeId: string
  requestId: string
  ok: boolean
  data?: TData
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  warnings: string[]
  mockOnly: boolean
  providerCallMade: false
  supabaseWriteMade: false
  generationRequestCreated: false
  renderJobCreated: false
  workerJobCreated: false
  creditReservedOrSpent: false
  respondedAt: string
}

export interface ReeditProApiRouteValidationResult {
  ok: boolean
  blocked: boolean
  blockedReasons: string[]
  warnings: string[]
}

export interface ReeditProApiRouteRegistrySummary {
  totalRoutes: number
  mockHandlerReadyCount: number
  blockedProductionCount: number
  productionReadyCount: number
  routeGroups: ReeditProApiRouteGroup[]
  warnings: string[]
}

export const REEDITPRO_API_ROUTE_MOCK_BOUNDARY_RULE =
  'RP-API-01 registers mock API route handlers only; no production route, provider call, Supabase write, generation, render, worker, or credit execution is enabled.'

export const REEDITPRO_API_ROUTE_FRONTEND_TRANSITION_RULE =
  'Frontend should transition toward API clients, but this milestone must not force production backend behavior.'

export const REEDITPRO_API_ROUTE_APPROVAL_GATE_RULE =
  'API routes that can eventually trigger expensive work must preserve plan approval, credit approval, credit reservation, and job lease gates.'
