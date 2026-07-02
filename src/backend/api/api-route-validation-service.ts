import type {
  ReeditProApiRequestEnvelope,
  ReeditProApiResponseEnvelope,
  ReeditProApiRouteDefinition,
  ReeditProApiRouteRegistrySummary,
  ReeditProApiRouteValidationResult,
} from '../../types/api-routes'

function validationResult(blockedReasons: string[], warnings: string[] = []): ReeditProApiRouteValidationResult {
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    warnings,
  }
}

export function validateApiRouteDefinition(
  route: ReeditProApiRouteDefinition | undefined,
): ReeditProApiRouteValidationResult {
  if (!route) return validationResult(['Route definition is missing.'])

  const blockedReasons: string[] = []
  const warnings: string[] = []

  if (!route.id) blockedReasons.push('Route id is required.')
  if (route.runtime !== 'mock_local') blockedReasons.push(`${route.id} must remain mock_local in RP-API-01.`)
  if (!route.mockOnly) blockedReasons.push(`${route.id} must be mockOnly.`)
  if (route.productionReady) blockedReasons.push(`${route.id} must not be productionReady in RP-API-01.`)
  if (!route.safetyGates.includes('mock_only')) blockedReasons.push(`${route.id} must include mock_only safety gate.`)
  if (!route.safetyGates.includes('no_provider_calls')) blockedReasons.push(`${route.id} must include no_provider_calls safety gate.`)
  if (!route.safetyGates.includes('no_supabase_writes')) blockedReasons.push(`${route.id} must include no_supabase_writes safety gate.`)
  if (!route.safetyGates.includes('no_generation_requests')) blockedReasons.push(`${route.id} must include no_generation_requests safety gate.`)
  if (!route.safetyGates.includes('no_render_jobs')) blockedReasons.push(`${route.id} must include no_render_jobs safety gate.`)
  if (!route.safetyGates.includes('no_worker_jobs')) blockedReasons.push(`${route.id} must include no_worker_jobs safety gate.`)
  if (!route.safetyGates.includes('no_credit_reservation')) blockedReasons.push(`${route.id} must include no_credit_reservation safety gate.`)
  if (!route.requestSchemaName || !route.responseSchemaName) warnings.push(`${route.id} should expose request and response schema names.`)

  return validationResult(blockedReasons, warnings)
}

export function validateApiRequestEnvelope(
  envelope: ReeditProApiRequestEnvelope | undefined,
): ReeditProApiRouteValidationResult {
  if (!envelope) return validationResult(['Request envelope is missing.'])

  const blockedReasons: string[] = []
  if (!envelope.routeId) blockedReasons.push('Request routeId is required.')
  if (!envelope.requestId) blockedReasons.push('Request requestId is required.')
  if (!envelope.mockOnly) blockedReasons.push('Request must be mockOnly for RP-API-01.')
  if (!envelope.requestedAt) blockedReasons.push('Request requestedAt is required.')
  return validationResult(blockedReasons)
}

export function validateApiResponseEnvelope(
  envelope: ReeditProApiResponseEnvelope | undefined,
): ReeditProApiRouteValidationResult {
  if (!envelope) return validationResult(['Response envelope is missing.'])

  const blockedReasons: string[] = []
  if (!envelope.routeId) blockedReasons.push('Response routeId is required.')
  if (!envelope.requestId) blockedReasons.push('Response requestId is required.')
  if (!envelope.mockOnly) blockedReasons.push('Response must be mockOnly for RP-API-01.')
  if (envelope.providerCallMade !== false) blockedReasons.push('Response must prove providerCallMade is false.')
  if (envelope.supabaseWriteMade !== false) blockedReasons.push('Response must prove supabaseWriteMade is false.')
  if (envelope.generationRequestCreated !== false) blockedReasons.push('Response must prove generationRequestCreated is false.')
  if (envelope.renderJobCreated !== false) blockedReasons.push('Response must prove renderJobCreated is false.')
  if (envelope.workerJobCreated !== false) blockedReasons.push('Response must prove workerJobCreated is false.')
  if (envelope.creditReservedOrSpent !== false) blockedReasons.push('Response must prove creditReservedOrSpent is false.')
  return validationResult(blockedReasons)
}

export function validateMockRouteSafety(
  route: ReeditProApiRouteDefinition | undefined,
  response?: ReeditProApiResponseEnvelope,
): ReeditProApiRouteValidationResult {
  const routeValidation = validateApiRouteDefinition(route)
  const responseValidation = response ? validateApiResponseEnvelope(response) : validationResult([])
  return validationResult(
    [...routeValidation.blockedReasons, ...responseValidation.blockedReasons],
    [...routeValidation.warnings, ...responseValidation.warnings],
  )
}

export function validateNoProductionEffects(
  response: {
    providerCallMade?: boolean
    supabaseWriteMade?: boolean
    generationRequestCreated?: boolean
    renderJobCreated?: boolean
    workerJobCreated?: boolean
    creditReservedOrSpent?: boolean
  },
): ReeditProApiRouteValidationResult {
  const blockedReasons: string[] = []
  if (response.providerCallMade !== false) blockedReasons.push('providerCallMade must be false.')
  if (response.supabaseWriteMade !== false) blockedReasons.push('supabaseWriteMade must be false.')
  if (response.generationRequestCreated !== false) blockedReasons.push('generationRequestCreated must be false.')
  if (response.renderJobCreated !== false) blockedReasons.push('renderJobCreated must be false.')
  if (response.workerJobCreated !== false) blockedReasons.push('workerJobCreated must be false.')
  if (response.creditReservedOrSpent !== false) blockedReasons.push('creditReservedOrSpent must be false.')
  return validationResult(blockedReasons)
}

export function validateFrontendCallableMockRoute(
  route: ReeditProApiRouteDefinition | undefined,
): ReeditProApiRouteValidationResult {
  const routeValidation = validateApiRouteDefinition(route)
  const blockedReasons = [...routeValidation.blockedReasons]
  if (route && !route.frontendCallableInMock) blockedReasons.push(`${route.id} is not frontend-callable in mock mode.`)
  if (route && route.backendOnlyInProduction && !route.safetyGates.includes('backend_secret_boundary')) {
    blockedReasons.push(`${route.id} is backend-only in production but missing backend_secret_boundary.`)
  }
  return validationResult(blockedReasons, routeValidation.warnings)
}

export function createApiRouteValidationSummary(
  routes: ReeditProApiRouteDefinition[] = [],
): ReeditProApiRouteRegistrySummary & { invalidRouteIds: string[] } {
  const invalidRouteIds = routes
    .filter((route) => !validateApiRouteDefinition(route).ok)
    .map((route) => route.id)
  const routeGroups = Array.from(new Set(routes.map((route) => route.group)))

  return {
    totalRoutes: routes.length,
    mockHandlerReadyCount: routes.filter((route) => route.status === 'mock_handler_ready').length,
    blockedProductionCount: routes.filter((route) => route.backendOnlyInProduction || route.status.startsWith('blocked_') || route.status === 'production_not_ready').length,
    productionReadyCount: routes.filter((route) => route.productionReady).length,
    routeGroups,
    warnings: [
      'RP-API-01 route validation is mock/local only.',
      invalidRouteIds.length ? `${invalidRouteIds.length} invalid route definition(s) found.` : 'All mock route definitions validate.',
    ],
    invalidRouteIds,
  }
}
