import { EDIT_LEVEL_API_ROUTES } from './edit-level-api-route-registry'
import { defaultEditLevelProductionReadiness } from '../../lib/edit-level-production-readiness'

export function createEditLevelApiRouteSummary() {
  return {
    routeCount: EDIT_LEVEL_API_ROUTES.length,
    mockReadyRouteCount: EDIT_LEVEL_API_ROUTES.filter((route) => route.status === 'mock_ready').length,
    planningDomainRouteCount: EDIT_LEVEL_API_ROUTES.filter((route) => route.domain === 'planning').length,
    productionReady: defaultEditLevelProductionReadiness.productionReady,
    productionReadiness: defaultEditLevelProductionReadiness,
    backendOnlyInProductionRouteCount: EDIT_LEVEL_API_ROUTES.filter((route) =>
      route.notes.some((note) => note.includes('backend-only')),
    ).length,
    routeIds: EDIT_LEVEL_API_ROUTES.map((route) => route.id),
    warnings: [
      'Edit Level API routes are mock local metadata and mock-router handlers only.',
      ...defaultEditLevelProductionReadiness.blockers,
    ],
  }
}
