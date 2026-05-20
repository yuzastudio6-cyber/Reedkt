import type { SFXProviderGenerateResponse } from '../sfx-provider-contracts'
import { parseSFXProviderResponse } from '../sfx-provider-response-parser'
import type { MMAudioInternalResponse } from './mmaudio-contracts'

export function parseMMAudioInternalResponse(response: MMAudioInternalResponse): {
  response: SFXProviderGenerateResponse
  warnings: string[]
} {
  return parseSFXProviderResponse({
    rawResponse: response.rawResponse ?? {
      parts: [
        { text: `Mock MMAudio V2 response for ${response.modelName}.` },
        { type: 'audio', mimeType: response.outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav', data: null },
      ],
    },
    providerKey: 'mmaudio_v2',
    providerName: response.providerName,
    modelName: response.modelName,
    durationSeconds: response.durationSeconds,
    outputFormat: response.outputFormat,
    mockStoragePath: response.mockStoragePath,
    mockOnly: response.mockOnly,
  })
}
