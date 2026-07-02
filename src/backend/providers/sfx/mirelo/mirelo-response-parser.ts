import type { SFXProviderGenerateResponse } from '../sfx-provider-contracts'
import { parseSFXProviderResponse } from '../sfx-provider-response-parser'
import type { MireloSFXInternalResponse } from './mirelo-contracts'

export function parseMireloSFXInternalResponse(response: MireloSFXInternalResponse): {
  response: SFXProviderGenerateResponse
  warnings: string[]
} {
  return parseSFXProviderResponse({
    rawResponse: response.rawResponse ?? {
      parts: [
        { text: `Mock Mirelo response for ${response.modelName}.` },
        { type: 'audio', mimeType: response.outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav', data: null },
      ],
    },
    providerKey: 'mirelo_sfx_v1_5',
    providerName: response.providerName,
    modelName: response.modelName,
    durationSeconds: response.durationSeconds,
    outputFormat: response.outputFormat,
    mockStoragePath: response.mockStoragePath,
    mockOnly: response.mockOnly,
  })
}
