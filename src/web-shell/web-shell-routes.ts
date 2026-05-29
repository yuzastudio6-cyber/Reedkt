import type { WebShellRouteDefinition, WebShellRouteId, WebShellStructureMode } from './web-shell-types'

export const WEB_SHELL_STRUCTURE_DECISION: WebShellStructureMode = 'transitional'
export const WEB_SHELL_CANONICAL_WEB_BOUNDARY = 'apps/web'
export const WEB_SHELL_ACTIVE_SOURCE_PATH = 'src'
export const WEB_SHELL_NEXT_PHASE = 'Phase 44D web backend integration'
export const WEB_SHELL_SAMPLE_PROJECT_ID = 'project-controlled-video-chain'

export const webShellRoutes: WebShellRouteDefinition[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    kind: 'global',
    summary: 'Overview of the controlled web launch surface and safety gates.',
  },
  {
    id: 'projects',
    label: 'Projects',
    path: '/projects',
    kind: 'global',
    summary: 'Project dashboard for private controlled editing work.',
  },
  {
    id: 'project_intake',
    label: 'New Project',
    path: '/projects/new',
    kind: 'global',
    summary: 'Mock-safe intake placeholder with upload execution disabled.',
  },
  {
    id: 'project_overview',
    label: 'Project Overview',
    path: '/projects/:projectId',
    kind: 'project',
    summary: 'Project state, readiness, and next safe actions.',
  },
  {
    id: 'editor_workspace',
    label: 'Editor',
    path: '/projects/:projectId/editor',
    kind: 'project',
    summary: 'Static editor workspace shell for preview, timeline, captions, tools, inspector, and export review.',
  },
  {
    id: 'job_queue',
    label: 'Jobs',
    path: '/projects/:projectId/jobs',
    kind: 'project',
    summary: 'Mock-safe worker job status and blocker visibility.',
  },
  {
    id: 'artifact_library',
    label: 'Artifacts',
    path: '/projects/:projectId/artifacts',
    kind: 'project',
    summary: 'Private artifact review shell without public delivery controls.',
  },
  {
    id: 'system_readiness',
    label: 'Readiness',
    path: '/system/readiness',
    kind: 'system',
    summary: 'Report-driven staging/runtime readiness without live cloud calls.',
  },
  {
    id: 'compute_routes',
    label: 'Compute Routes',
    path: '/system/compute-routes',
    kind: 'system',
    summary: 'Informational compute route manifest with execution disabled.',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    kind: 'global',
    summary: 'Web shell settings and blocked launch controls.',
  },
  {
    id: 'not_found',
    label: 'Not Found',
    path: '*',
    kind: 'fallback',
    summary: 'Fallback route for unknown web shell paths.',
  },
]

export const webShellRouteIds: WebShellRouteId[] = webShellRoutes.map((route) => route.id)

export function getWebShellRoute(routeId: WebShellRouteId): WebShellRouteDefinition {
  const route = webShellRoutes.find((candidate) => candidate.id === routeId)
  if (!route) throw new Error(`Unknown web shell route: ${routeId}`)
  return route
}

export function getProjectRoutePath(routeId: WebShellRouteId, projectId = WEB_SHELL_SAMPLE_PROJECT_ID): string {
  return getWebShellRoute(routeId).path.replace(':projectId', projectId)
}
