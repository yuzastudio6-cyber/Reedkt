import type {
  ProjectEditSessionBreadcrumbItem,
  ProjectEditSessionRouteModel,
  ProjectEditSessionRouteParams,
  ProjectEditSessionRouteSection,
  ProjectEditSessionRouteStatus,
  ProjectEditSessionRouteTab,
} from '../types/project-edit-session-navigation'
import {
  createLegacyEditorPath,
  createProjectEditSessionBriefPath,
  createProjectEditSessionChatPath,
  createProjectEditSessionDetailsPath,
  createProjectEditSessionHistoryPath,
  createProjectEditSessionPath,
  createProjectEditSessionPreviewPath,
  createProjectEditSessionVersionsPath,
  createProjectHomePath,
} from './project-edit-session-navigation'

const TAB_SECTIONS: ProjectEditSessionRouteSection[] = ['chat', 'brief', 'preview']

function titleCase(value: string): string {
  return value
    .replace(/^@/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusFor(section: ProjectEditSessionRouteSection): ProjectEditSessionRouteStatus {
  if (section === 'project_home') return 'active_mock_route'
  if (section === 'legacy_editor') return 'legacy_compatibility_route'
  if (section === 'chat') return 'alias_route'
  if (section === 'history' || section === 'brief') return 'active_mock_route'
  return 'placeholder_future_route'
}

function pathFor(section: ProjectEditSessionRouteSection, projectId?: string, editSessionId?: string): string {
  if (section === 'legacy_editor') return createLegacyEditorPath()
  if (!projectId) return ''
  if (section === 'project_home' || !editSessionId) return createProjectHomePath(projectId)
  if (section === 'chat') return createProjectEditSessionChatPath(projectId, editSessionId)
  if (section === 'brief') return createProjectEditSessionBriefPath(projectId, editSessionId)
  if (section === 'history') return createProjectEditSessionHistoryPath(projectId, editSessionId)
  if (section === 'versions') return createProjectEditSessionVersionsPath(projectId, editSessionId)
  if (section === 'preview') return createProjectEditSessionPreviewPath(projectId, editSessionId)
  if (section === 'details') return createProjectEditSessionDetailsPath(projectId, editSessionId)
  return createProjectEditSessionPath(projectId, editSessionId)
}

export function getProjectEditSessionRouteSectionFromPath(pathname: string): ProjectEditSessionRouteSection {
  if (pathname === '/editor') return 'legacy_editor'
  if (!pathname.includes('/edits/')) return 'project_home'
  if (pathname.endsWith('/brief')) return 'brief'
  if (pathname.endsWith('/history')) return 'history'
  if (pathname.endsWith('/versions')) return 'versions'
  if (pathname.endsWith('/preview')) return 'preview'
  if (pathname.endsWith('/details')) return 'details'
  return 'chat'
}

export function createProjectEditSessionRouteModels(
  params: ProjectEditSessionRouteParams,
): ProjectEditSessionRouteModel[] {
  const { editSessionId, projectId } = params
  return (['project_home', ...TAB_SECTIONS, 'legacy_editor'] as ProjectEditSessionRouteSection[]).map((section) => {
    const requiresProjectId = section !== 'legacy_editor'
    const requiresEditSessionId = !['project_home', 'legacy_editor'].includes(section)
    const missingRequired = (requiresProjectId && !projectId) || (requiresEditSessionId && !editSessionId)
    return {
      section,
      status: missingRequired ? 'blocked_missing_params' : statusFor(section),
      label: section === 'project_home' ? 'Project' : section === 'legacy_editor' ? 'Retired editor alias' : titleCase(section),
      path: missingRequired ? '' : pathFor(section, projectId, editSessionId),
      requiresProjectId,
      requiresEditSessionId,
      mockOnly: true,
      warnings: missingRequired
        ? ['Missing route parameters; navigation is blocked safely.']
        : section === 'legacy_editor'
          ? ['Retired /editor redirects to Project start; use Project, Edit, and Brief for testing.']
          : section === 'versions' || section === 'preview'
            ? ['This section is a mock history view; real render/export remains future gated.']
            : [],
    }
  })
}

export function createProjectEditSessionBreadcrumbs(input: {
  projectId?: string
  editSessionId?: string
  editSessionTitle?: string
  section: ProjectEditSessionRouteSection
}): ProjectEditSessionBreadcrumbItem[] {
  const projectPath = input.projectId ? createProjectHomePath(input.projectId) : undefined
  const editPath = input.projectId && input.editSessionId
    ? createProjectEditSessionPath(input.projectId, input.editSessionId)
    : undefined
  const items: ProjectEditSessionBreadcrumbItem[] = [
    { label: 'Projects', path: '/projects', current: false, mockOnly: true },
    {
      label: 'Project',
      path: projectPath,
      current: input.section === 'project_home',
      mockOnly: true,
    },
    {
      label: 'Edit',
      path: editPath,
      current: false,
      mockOnly: true,
    },
    {
      label: input.editSessionTitle ?? 'Edit',
      path: editPath,
      current: false,
      mockOnly: true,
    },
    {
      label: input.section === 'chat' ? 'Chat' : titleCase(input.section),
      current: true,
      mockOnly: true,
    },
  ]
  return input.editSessionId ? items : items.slice(0, 2)
}

export function createProjectEditSessionRouteTabs(input: {
  projectId?: string
  editSessionId?: string
  activeSection: ProjectEditSessionRouteSection
}): ProjectEditSessionRouteTab[] {
  return TAB_SECTIONS.map((section) => {
    const disabled = !input.projectId || !input.editSessionId
    return {
      section,
      label: titleCase(section),
      path: disabled ? '' : pathFor(section, input.projectId, input.editSessionId),
      active: input.activeSection === section || (section === 'chat' && input.activeSection === 'project_home'),
      disabled,
      badge: section === 'brief' ? 'Upload' : section === 'versions' || section === 'preview' ? 'Soon' : undefined,
      mockOnly: true,
    }
  })
}

export function createProjectEditSessionRouteSummary(section: ProjectEditSessionRouteSection): string {
  if (section === 'brief') return 'Use Brief to upload or select source video, add instructions, mark moments, and prepare the edit before approval.'
  if (section === 'history') return 'History focuses existing snapshots, versions, previews, revisions, approval state, and events.'
  if (section === 'versions') return 'Versions will show saved edit versions and comparisons as the edit evolves.'
  if (section === 'preview') return 'Preview will show the latest generated preview and review actions.'
  if (section === 'details') return 'Details focuses session context, sources, memory, preference DNA, and boundary state.'
  if (section === 'legacy_editor') return 'Retired /editor redirects to Project start so testing stays in the Project/Edit Chat flow.'
  return 'Chat is the main workspace for the edit plan, questions, approvals, progress, and review.'
}
