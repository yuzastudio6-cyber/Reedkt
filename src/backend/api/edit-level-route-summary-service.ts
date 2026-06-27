import { EDIT_LEVEL_API_ROUTES } from './edit-level-api-route-registry'

export function createEditLevelApiRouteSummary() {
  return {
    routeCount: EDIT_LEVEL_API_ROUTES.length,
    mockReadyRouteCount: EDIT_LEVEL_API_ROUTES.filter((route) => route.status === 'mock_ready').length,
    planningDomainRouteCount: EDIT_LEVEL_API_ROUTES.filter((route) => route.domain === 'planning').length,
    productionReady: false,
    backendOnlyInProductionRouteCount: EDIT_LEVEL_API_ROUTES.filter((route) =>
      route.notes.some((note) => note.includes('backend-only')),
    ).length,
    routeIds: EDIT_LEVEL_API_ROUTES.map((route) => route.id),
    warnings: [
      'Edit Level API routes are mock local metadata and mock-router handlers only.',
      'No production HTTP route, Supabase query, service-role mutation, worker, render, provider, or credit operation exists in RP-EDITLEVEL-03.',
    ],
  }
}
