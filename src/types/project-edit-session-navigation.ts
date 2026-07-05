export type ProjectEditSessionRouteSection =
  | 'project_home'
  | 'chat'
  | 'brief'
  | 'history'
  | 'versions'
  | 'preview'
  | 'details'
  | 'legacy_editor'

export type ProjectEditSessionRouteStatus =
  | 'active_mock_route'
  | 'alias_route'
  | 'placeholder_future_route'
  | 'legacy_compatibility_route'
  | 'blocked_missing_params'

export type ProjectEditSessionNavigationAction =
  | 'open_project_home'
  | 'open_edit_chat'
  | 'open_chat_section'
  | 'open_brief_section'
  | 'open_history_section'
  | 'open_versions_section'
  | 'open_preview_section'
  | 'open_details_section'
  | 'open_legacy_editor'

export interface ProjectEditSessionRouteParams {
  projectId?: string
  editSessionId?: string
  section: ProjectEditSessionRouteSection
}

export interface ProjectEditSessionRouteModel {
  section: ProjectEditSessionRouteSection
  status: ProjectEditSessionRouteStatus
  label: string
  path: string
  requiresProjectId: boolean
  requiresEditSessionId: boolean
  mockOnly: boolean
  warnings: string[]
}

export interface ProjectEditSessionBreadcrumbItem {
  label: string
  path?: string
  current: boolean
  mockOnly: boolean
}

export interface ProjectEditSessionRouteTab {
  section: ProjectEditSessionRouteSection
  label: string
  path: string
  active: boolean
  disabled: boolean
  badge?: string
  mockOnly: boolean
}

export interface ProjectEditSessionNavigationBoundary {
  mockOnly: boolean
  startsProgress: false
  startsRender: false
  startsWorker: false
  callsProvider: false
  callsModel: false
  reservesCredits: false
  writesRemoteSupabase: false
  warnings: string[]
}

export const REEDITPRO_PROJECT_EDIT_SESSION_NAVIGATION_RULE =
  'Project Edit Session navigation may move between mock/local UI routes but must not start edit execution, rendering, workers, providers, model calls, credits, or remote persistence.'

export const REEDITPRO_LEGACY_EDITOR_COMPATIBILITY_RULE =
  'The retired /editor route redirects to /projects/new; user-facing navigation must use Project Home, Edit Chat, and Brief routes.'

export const REEDITPRO_PROJECT_EDIT_SESSION_ROUTE_MODEL_RULE =
  'Session-specific editing routes use /projects/:projectId/edits/:editSessionId and must keep Project, ProjectEditSession, and Edit Preference as separate concepts.'
