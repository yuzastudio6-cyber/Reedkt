import { getMMAudioModelName } from '../sfx-provider-config'
import type { SFXProviderGenerateRequest } from '../sfx-provider-contracts'
import type { MMAudioInternalRequest } from './mmaudio-contracts'

export function buildMMAudioInternalRequest(input: {
  prompt: string
  negativePrompt?: string
  durationSeconds: number
  modelName?: string
  outputFormat?: 'wav' | 'mp3'
  videoConditioning?: MMAudioInternalRequest['videoConditioning']
  metadata?: Record<string, unknown>
}): MMAudioInternalRequest {
  return {
    modelName: getMMAudioModelName(input.modelName),
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    durationSeconds: Math.max(input.durationSeconds, 0.5),
    outputFormat: input.outputFormat ?? 'wav',
    videoConditioning: input.videoConditioning,
    metadata: {
      mockOnly: true,
      realProviderCall: false,
      ...input.metadata,
    },
  }
}

export function buildMMAudioRequestFromSFXProviderRequest(
  request: SFXProviderGenerateRequest,
): MMAudioInternalRequest {
  return buildMMAudioInternalRequest({
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    durationSeconds: request.durationSeconds,
    modelName: request.modelName,
    outputFormat: request.outputFormat === 'mp3' ? 'mp3' : 'wav',
    videoConditioning: {
      sceneSummary: request.videoContext?.sceneSummary,
    },
    metadata: request.metadata,
  })
}
