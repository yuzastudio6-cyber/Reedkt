import type { ProviderRoute } from '../../cloud/provider-gateway-contracts'
import { REEDITPRO_LIVE_GCP_RESOURCE_MAP, type ReeditProSecretName } from '../../cloud/live-gcp-resource-map'
import type { ProviderSecretReference } from './provider-gateway-types'

export function getProviderSecretReference(providerRoute: ProviderRoute): ProviderSecretReference | undefined {
  const secretName = REEDITPRO_LIVE_GCP_RESOURCE_MAP.providerSecretByRoute[providerRoute]

  if (!secretName) {
    return undefined
  }

  return {
    providerRoute,
    secretName,
    purpose: `Secret Manager reference for ${providerRoute}.`,
    neverExposeToClient: true,
  }
}

export function isKnownProviderSecretName(secretName: string): secretName is ReeditProSecretName {
  return Object.prototype.hasOwnProperty.call(REEDITPRO_LIVE_GCP_RESOURCE_MAP.secretNames, secretName)
}

export const PROVIDER_SECRET_BOUNDARY_RULES = [
  'This module returns Secret Manager reference names only.',
  'It must never read, log, fetch, cache, or return raw secret values.',
  'Future real provider clients must read secrets only in secure backend/worker runtimes.',
  'Frontend code must never import this module for runtime execution.',
] as const
