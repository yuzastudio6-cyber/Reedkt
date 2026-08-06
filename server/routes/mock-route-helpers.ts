import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'

export function assertLocalMockRoute(
  context: ServiceContext,
  featureLabel: string,
): void {
  if (context.env.nodeEnv !== 'production' && context.env.mockOnly) return

  throw new ApiError(
    'MOCK_ONLY',
    `${featureLabel} is available only in the explicit local mock runtime.`,
    501,
    {
      productionMutationAllowed: false,
      requiredBackendGate: 'canonical_tenant_scoped_persistence',
    },
  )
}
