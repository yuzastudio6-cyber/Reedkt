import type {
  SFXProvider,
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProviderRouteRecord,
} from '../../../types'
import type {
  SFXWorkerInput,
  SFXWorkerLoadedRecords,
} from '../../workers/sfx-worker-contracts'
import { getSFXProviderOutputFormat } from './sfx-provider-config'
import type {
  SFXProviderGenerateRequest,
  SFXProviderKey,
  SFXProviderOutputFormat,
} from './sfx-provider-contracts'

export function normalizeSFXProviderOutputFormat(outputFormat?: SFXProviderOutputFormat): SFXProviderOutputFormat {
  return getSFXProviderOutputFormat(outputFormat)
}

export function normalizeSFXProviderKey(provider?: SFXProvider | SFXProviderKey): SFXProviderKey {
  if (
    provider === 'mirelo_sfx_v1_5' ||
    provider === 'mmaudio_v' ||
    provider === 'reeditpro_internal_library' ||
    provider === 'no_sfx'
  ) {
    return provider
  }

  return 'no_sfx'
}

export function normalizeSFXProviderDuration(input: {
  providerKey: SFXProviderKey
  durationToGenerateSeconds?: number
  durationNeededSeconds?: number
}): number {
  if (input.providerKey === 'no_sfx') return 0
  if (input.providerKey === 'reeditpro_internal_library') return Math.max(input.durationNeededSeconds ?? 0.5, 0.5)
  return Math.max(input.durationToGenerateSeconds ?? 2.5, input.durationNeededSeconds ?? 0.5, 0.5)
}

export function buildSFXProviderGenerateRequest(input: {
  providerKey: SFXProviderKey
  modelName?: string
  prompt: string
  negativePrompt?: string
  durationSeconds: number
  durationNeededSeconds?: number
  outputFormat?: SFXProviderOutputFormat
  eventPlan?: SFXEventPlanRecord
  providerRoute?: SFXProviderRouteRecord
  promptPlan?: SFXPromptPlanRecord
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  metadata?: Record<string, unknown>
}): SFXProviderGenerateRequest {
  return {
    providerKey: input.providerKey,
    modelName: input.modelName,
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    durationSeconds: normalizeSFXProviderDuration({
      providerKey: input.providerKey,
      durationToGenerateSeconds: input.durationSeconds,
      durationNeededSeconds: input.durationNeededSeconds,
    }),
    durationNeededSeconds: input.durationNeededSeconds,
    outputFormat: normalizeSFXProviderOutputFormat(input.outputFormat),
    targetLayer: input.eventPlan?.targetLayer,
    useCase: input.eventPlan?.useCase,
    timingAnchor: input.eventPlan
      ? {
          anchorType: input.eventPlan.anchorType,
          anchorTimeSeconds: input.eventPlan.anchorTimeSeconds,
        }
      : undefined,
    videoContext: input.eventPlan
      ? {
          projectId: input.eventPlan.projectId,
          editPlanId: input.eventPlan.editPlanId,
          segmentId: input.eventPlan.editPlanSegmentId,
          sceneSummary: input.eventPlan.sceneContext,
          hasSpeech: input.speechPresent,
          hasMusic: input.musicPresent,
          ambienceImportant: input.ambienceImportant,
        }
      : undefined,
    mockOnly: true,
    metadata: {
      mockOnly: true,
      realProviderCall: false,
      sfxEventPlanId: input.eventPlan?.id,
      sfxProviderRouteId: input.providerRoute?.id,
      sfxPromptPlanId: input.promptPlan?.id,
      projectId: input.eventPlan?.projectId,
      editPlanId: input.eventPlan?.editPlanId,
      promptStyle: input.promptPlan?.promptStyle,
      librarySearchTags: input.promptPlan?.librarySearchTags,
      ...input.metadata,
    },
  }
}

export function buildSFXProviderRequestFromPromptPlan(input: {
  eventPlan: SFXEventPlanRecord
  providerRoute: SFXProviderRouteRecord
  promptPlan: SFXPromptPlanRecord
  providerKey?: SFXProviderKey
  outputFormat?: SFXProviderOutputFormat
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  metadata?: Record<string, unknown>
}): SFXProviderGenerateRequest {
  const providerKey = normalizeSFXProviderKey(input.providerKey ?? input.promptPlan.provider)

  return buildSFXProviderGenerateRequest({
    providerKey,
    modelName: input.promptPlan.modelName,
    prompt: input.promptPlan.prompt,
    negativePrompt: input.promptPlan.negativePrompt,
    durationSeconds: input.promptPlan.durationToGenerateSeconds,
    durationNeededSeconds: input.promptPlan.durationNeededSeconds,
    outputFormat: input.outputFormat,
    eventPlan: input.eventPlan,
    providerRoute: input.providerRoute,
    promptPlan: input.promptPlan,
    speechPresent: input.speechPresent,
    musicPresent: input.musicPresent,
    ambienceImportant: input.ambienceImportant,
    metadata: input.metadata,
  })
}

export function buildSFXProviderRequestFromWorkerInput(input: {
  workerInput: SFXWorkerInput
  records: SFXWorkerLoadedRecords
  providerKey?: SFXProviderKey
  outputFormat?: SFXProviderOutputFormat
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  matchedLibraryAssetId?: string
}): SFXProviderGenerateRequest {
  return buildSFXProviderRequestFromPromptPlan({
    eventPlan: input.records.sfxEventPlan,
    providerRoute: input.records.sfxProviderRoute,
    promptPlan: input.records.sfxPromptPlan,
    providerKey: input.providerKey,
    outputFormat: input.outputFormat,
    speechPresent: input.speechPresent,
    musicPresent: input.musicPresent,
    ambienceImportant: input.ambienceImportant,
    metadata: {
      workerJobId: input.workerInput.jobId,
      generationRequestId: input.workerInput.generationRequestId,
      creditReservationId: input.workerInput.creditReservationId,
      matchedLibraryAssetId: input.matchedLibraryAssetId,
    },
  })
}
