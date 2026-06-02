import type { PrivateSearxngServiceValidation } from './private-searxng-service-types'

export function validatePrivateSearxngEndpoint(input: { serviceValidation: PrivateSearxngServiceValidation }): { allowed: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (!input.serviceValidation.deployedOrResolved) blockers.push('Private SearXNG service is not deployed or resolved.')
  if (input.serviceValidation.publicUnauthenticatedAccess !== false) blockers.push('Public unauthenticated access must be disabled.')
  if (input.serviceValidation.allUsersPresent) blockers.push('Cloud Run service IAM contains allUsers.')
  if (input.serviceValidation.allAuthenticatedUsersPresent) blockers.push('Cloud Run service IAM contains allAuthenticatedUsers.')
  if (!input.serviceValidation.serviceUrlHost) blockers.push('Cloud Run service URL host is missing.')
  if (input.serviceValidation.cloudRunIngress === 'unknown') warnings.push('Cloud Run ingress could not be parsed; IAM still blocks public unauthenticated access.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
