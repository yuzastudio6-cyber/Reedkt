import { callMockReeditProApi } from '../backend/api/frontend-api-client'
import { resetMockEditLevelRouteState } from '../backend/api/edit-level-mock-route-handlers'
import { createEditLevelApiClient, type EditLevelApiClient, type EditLevelApiTransport } from './edit-level-api-client'

export const mockEditLevelApiTransport: EditLevelApiTransport = (routeId, body) =>
  callMockReeditProApi(routeId, body)

export function createMockEditLevelApiClient(options: { resetState?: boolean } = {}): EditLevelApiClient {
  if (options.resetState) {
    resetMockEditLevelRouteState()
  }

  return createEditLevelApiClient(mockEditLevelApiTransport)
}
