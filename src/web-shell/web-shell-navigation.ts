import { getProjectRoutePath } from './web-shell-routes'
import type { WebShellRouteId } from './web-shell-types'

export interface WebShellNavigationItem {
  routeId: WebShellRouteId
  label: string
  href: string
  description: string
}

export interface WebShellNavigationSection {
  label: string
  items: WebShellNavigationItem[]
}

export const webShellNavigationSections: WebShellNavigationSection[] = [
  {
    label: 'Workspace',
    items: [
      {
        routeId: 'home',
        label: 'Home',
        href: '/',
        description: 'Safety posture and controlled web shell overview.',
      },
      {
        routeId: 'projects',
        label: 'Projects',
        href: '/projects',
        description: 'Project dashboard and current controlled project.',
      },
      {
        routeId: 'project_intake',
        label: 'Intake',
        href: '/projects/new',
        description: 'Disabled upload/intake placeholder.',
      },
    ],
  },
  {
    label: 'Project',
    items: [
      {
        routeId: 'project_overview',
        label: 'Overview',
        href: getProjectRoutePath('project_overview'),
        description: 'Project state, blockers, and private-test posture.',
      },
      {
        routeId: 'editor_workspace',
        label: 'Editor',
        href: getProjectRoutePath('editor_workspace'),
        description: 'Static editor workspace shell.',
      },
      {
        routeId: 'job_queue',
        label: 'Jobs',
        href: getProjectRoutePath('job_queue'),
        description: 'Mock-safe job queue visibility.',
      },
      {
        routeId: 'artifact_library',
        label: 'Artifacts',
        href: getProjectRoutePath('artifact_library'),
        description: 'Private artifact library.',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        routeId: 'system_readiness',
        label: 'Readiness',
        href: '/system/readiness',
        description: 'Report-driven staging and launch readiness.',
      },
      {
        routeId: 'compute_routes',
        label: 'Compute Routes',
        href: '/system/compute-routes',
        description: 'Informational compute routing categories.',
      },
      {
        routeId: 'settings',
        label: 'Settings',
        href: '/settings',
        description: 'Disabled launch and delivery controls.',
      },
    ],
  },
]
