import type { SFXPromptPlanRecord, SFXProviderRouteRecord } from '../../types'
import type { SFXWorkerContext, SFXWorkerInput } from './sfx-worker-contracts'

function contextForProvider(provider: SFXWorkerContext['providerKey'], modelName?: string): SFXWorkerContext {
  if (provider === 'mirelo_sfx_v1_5') {
    return {
      runtime: 'mock',
      provider: 'Mirelo SFX V1.5',
      providerKey: provider,
      modelName: modelName ?? 'mirelo-sfx-v1.5',
      region: 'us-central1',
      secretReferenceName: 'GOOGLE_SECRET_MIRELO_API_KEY_NAME',
      outputBucket: 'mock-reeditpro-sfx-output',
      outputPathPrefix: 'generated-sfx',
    }
  }

  if (provider === 'mmaudio_v') {
    return {
      runtime: 'mock',
      provider: 'MMAudio V',
      providerKey: provider,
      modelName: modelName ?? 'mmaudio-v',
      region: 'us-central1',
      secretReferenceName: 'GOOGLE_SECRET_MMAUDIO_API_KEY_NAME',
      outputBucket: 'mock-reeditpro-sfx-output',
      outputPathPrefix: 'generated-sfx',
    }
  }

  if (provider === 'reeditpro_internal_library') {
    return {
      runtime: 'mock',
      provider: 'ReeditPro Internal Library',
      providerKey: provider,
      modelName: modelName ?? 'reeditpro-internal-sfx-library',
      outputBucket: 'mock-reeditpro-sfx-output',
      outputPathPrefix: 'internal-library-sfx',
    }
  }

  return {
    runtime: 'mock',
    provider: 'No SFX',
    providerKey: 'no_sfx',
    modelName: 'no-sfx',
  }
}

export function shouldUseInternalLibraryInWorker(route: SFXProviderRouteRecord, hasApprovedMatch = false): boolean {
  return hasApprovedMatch && (route.recommendedProvider === 'reeditpro_internal_library' || route.useInternalLibraryFirst)
}

export function shouldUseMMAudioInWorker(route: SFXProviderRouteRecord, input?: SFXWorkerInput): boolean {
  return route.recommendedProvider === 'mmaudio_v' || Boolean(input?.providerUnavailable && route.fallbackProvider === 'mmaudio_v')
}

export function shouldUseMireloInWorker(route: SFXProviderRouteRecord, input?: SFXWorkerInput): boolean {
  return route.recommendedProvider === 'mirelo_sfx_v1_5' && !input?.providerUnavailable
}

export function shouldSkipSFXGenerationInWorker(route: SFXProviderRouteRecord): boolean {
  return route.recommendedProvider === 'no_sfx'
}

export function routeSFXWorkerProvider(input: {
  providerRoute: SFXProviderRouteRecord
  promptPlan: SFXPromptPlanRecord
  workerInput?: SFXWorkerInput
  hasApprovedLibraryMatch?: boolean
}): SFXWorkerContext {
  const { providerRoute, promptPlan, workerInput } = input

  if (shouldSkipSFXGenerationInWorker(providerRoute)) return contextForProvider('no_sfx')
  if (shouldUseInternalLibraryInWorker(providerRoute, input.hasApprovedLibraryMatch)) {
    return contextForProvider('reeditpro_internal_library', promptPlan.modelName)
  }
  if (providerRoute.recommendedProvider === 'reeditpro_internal_library' && !input.hasApprovedLibraryMatch) {
    if (providerRoute.fallbackProvider === 'mmaudio_v') return contextForProvider('mmaudio_v', 'mmaudio-v')
    if (providerRoute.fallbackProvider === 'mirelo_sfx_v1_5') return contextForProvider('mirelo_sfx_v1_5', 'mirelo-sfx-v1.5')
    return contextForProvider('no_sfx')
  }
  if (shouldUseMMAudioInWorker(providerRoute, workerInput)) return contextForProvider('mmaudio_v', promptPlan.modelName)
  if (shouldUseMireloInWorker(providerRoute, workerInput)) return contextForProvider('mirelo_sfx_v1_5', promptPlan.modelName)

  if (providerRoute.fallbackProvider === 'mmaudio_v') return contextForProvider('mmaudio_v', 'mmaudio-v')
  return contextForProvider('no_sfx')
}
