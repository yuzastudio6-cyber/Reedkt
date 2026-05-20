import type {
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProvider,
} from '../../types'
import { nowIso } from '../mock/mock-database'
import { isMMAudioProviderKey } from '../providers/sfx/sfx-provider-contracts'
import type {
  MockSFXProviderResponse,
  SFXWorkerContext,
  SFXWorkerInput,
} from './sfx-worker-contracts'

function modelForProvider(provider: SFXProvider, promptPlan?: SFXPromptPlanRecord) {
  if (promptPlan?.modelName) return promptPlan.modelName
  if (provider === 'mirelo_sfx_v1_5') return 'mirelo-sfx-v1.5'
  if (isMMAudioProviderKey(provider)) return 'mmaudio-v2'
  if (provider === 'reeditpro_internal_library') return 'reeditpro-internal-sfx-library'
  return 'no-sfx'
}

export function createMockSFXStoragePath(
  projectId: string,
  eventPlanId: string,
  provider: SFXProvider,
): string {
  const providerFolder = provider === 'mirelo_sfx_v1_5'
    ? 'mirelo'
    : isMMAudioProviderKey(provider)
      ? 'mmaudio'
      : 'library'

  return `mock://generated-sfx/${projectId}/${eventPlanId}/${providerFolder}.wav`
}

export function createMockSFXWaveformHint(eventPlan: SFXEventPlanRecord): string[] {
  if (eventPlan.targetLayer === 'transition') {
    return ['whoosh_rise_hit_tail', 'clean mid-file hit', 'short smooth tail']
  }

  if (eventPlan.targetLayer === 'stroke_motion') {
    return ['draw_texture', 'soft motion peak', 'line-synced texture']
  }

  if (eventPlan.targetLayer === 'real_motion') {
    return ['object_movement', 'soft settle transient', 'room-matched tail']
  }

  if (eventPlan.targetLayer === 'ambient_bridge') {
    return ['ambient_swell', 'no sharp transient', 'crossfade-ready clean region']
  }

  return ['single_hit', 'clean transient', 'short tail']
}

export function simulateSFXGenerationDelay(provider: SFXProvider): number {
  if (provider === 'mirelo_sfx_v1_5') return 1800
  if (isMMAudioProviderKey(provider)) return 700
  return 120
}

export function createMockSFXProviderResponse(input: {
  workerInput: SFXWorkerInput
  context: SFXWorkerContext
  eventPlan: SFXEventPlanRecord
  promptPlan: SFXPromptPlanRecord
  provider: Exclude<SFXProvider, 'no_sfx' | 'manual_upload' | 'unknown'>
  matchedLibraryAssetId?: string
}): MockSFXProviderResponse {
  const { workerInput, eventPlan, promptPlan, provider } = input
  const isLibrary = provider === 'reeditpro_internal_library'

  return {
    provider: provider === 'mirelo_sfx_v1_5'
      ? 'Mirelo SFX V1.5'
      : isMMAudioProviderKey(provider)
        ? 'MMAudio V2'
        : 'ReeditPro Internal Library',
    providerKey: isMMAudioProviderKey(provider) ? 'mmaudio_v2' : provider,
    modelName: modelForProvider(provider, promptPlan),
    mockAudioBytes: null,
    mockStoragePath: isLibrary
      ? `mock://internal-sfx-library/${input.matchedLibraryAssetId ?? `approved-${eventPlan.useCase}`}.wav`
      : createMockSFXStoragePath(workerInput.projectId, eventPlan.id, provider),
    matchedLibraryAssetId: input.matchedLibraryAssetId,
    durationSeconds: isLibrary
      ? Math.max(promptPlan.durationNeededSeconds, 0.5)
      : Math.max(promptPlan.durationToGenerateSeconds, promptPlan.durationNeededSeconds),
    format: 'wav',
    generatedAt: nowIso(),
    mockOnly: true,
    waveformHint: [
      ...createMockSFXWaveformHint(eventPlan),
      isLibrary ? 'approved library match; provider generation skipped' : 'mock provider output; no audio bytes created',
    ],
  }
}

export function simulateMireloSFXGeneration(input: {
  workerInput: SFXWorkerInput
  context: SFXWorkerContext
  eventPlan: SFXEventPlanRecord
  promptPlan: SFXPromptPlanRecord
}): MockSFXProviderResponse {
  return createMockSFXProviderResponse({ ...input, provider: 'mirelo_sfx_v1_5' })
}

export function simulateMMAudioSFXGeneration(input: {
  workerInput: SFXWorkerInput
  context: SFXWorkerContext
  eventPlan: SFXEventPlanRecord
  promptPlan: SFXPromptPlanRecord
}): MockSFXProviderResponse {
  return createMockSFXProviderResponse({ ...input, provider: 'mmaudio_v2' })
}

export function simulateInternalLibrarySFXMatch(input: {
  workerInput: SFXWorkerInput
  context: SFXWorkerContext
  eventPlan: SFXEventPlanRecord
  promptPlan: SFXPromptPlanRecord
  matchedLibraryAssetId: string
}): MockSFXProviderResponse {
  return createMockSFXProviderResponse({
    ...input,
    provider: 'reeditpro_internal_library',
    matchedLibraryAssetId: input.matchedLibraryAssetId,
  })
}

export function simulateSFXProviderGeneration(input: {
  workerInput: SFXWorkerInput
  context: SFXWorkerContext
  eventPlan: SFXEventPlanRecord
  promptPlan: SFXPromptPlanRecord
}): MockSFXProviderResponse {
  if (input.context.providerKey === 'mirelo_sfx_v1_5') return simulateMireloSFXGeneration(input)
  if (isMMAudioProviderKey(input.context.providerKey)) return simulateMMAudioSFXGeneration(input)

  return simulateInternalLibrarySFXMatch({
    ...input,
    matchedLibraryAssetId: `mock-approved-sfx-library-${input.eventPlan.useCase}`,
  })
}
