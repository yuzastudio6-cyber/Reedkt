import { getMireloModelName } from '../sfx-provider-config'
import type { SFXProviderGenerateRequest } from '../sfx-provider-contracts'
import type { MireloSFXInternalRequest } from './mirelo-contracts'

export function buildMireloSFXInternalRequest(input: {
  prompt: string
  negativePrompt?: string
  durationSeconds: number
  modelName?: string
  outputFormat?: 'wav' | 'mp3'
  promptStyle?: string
  metadata?: Record<string, unknown>
}): MireloSFXInternalRequest {
  return {
    modelName: getMireloModelName(input.modelName),
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    durationSeconds: Math.max(input.durationSeconds, 0.5),
    outputFormat: input.outputFormat ?? 'wav',
    promptStyle: input.promptStyle ?? 'structured_sentence',
    metadata: {
      mockOnly: true,
      realProviderCall: false,
      ...input.metadata,
    },
  }
}

export function buildMireloRequestFromSFXProviderRequest(
  request: SFXProviderGenerateRequest,
): MireloSFXInternalRequest {
  return buildMireloSFXInternalRequest({
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    durationSeconds: request.durationSeconds,
    modelName: request.modelName,
    outputFormat: request.outputFormat === 'mp3' ? 'mp3' : 'wav',
    promptStyle: typeof request.metadata?.promptStyle === 'string'
      ? request.metadata.promptStyle
      : 'structured_sentence',
    metadata: request.metadata,
  })
}
