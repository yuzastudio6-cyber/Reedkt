import { nowIso } from '../../../mock/mock-database'
import type { SFXProviderResult } from '../sfx-provider-contracts'
import type { MireloSFXInternalRequest, MireloSFXInternalResponse } from './mirelo-contracts'
import { parseMireloSFXInternalResponse } from './mirelo-response-parser'

function mockStoragePath(request: MireloSFXInternalRequest) {
  const projectId = typeof request.metadata?.projectId === 'string' ? request.metadata.projectId : 'mock-project'
  const eventPlanId = typeof request.metadata?.sfxEventPlanId === 'string' ? request.metadata.sfxEventPlanId : 'mock-event'
  return `mock://generated-sfx/${projectId}/${eventPlanId}/mirelo.wav`
}

export function createMockMireloSFXResponse(request: MireloSFXInternalRequest): MireloSFXInternalResponse {
  const outputFormat = request.outputFormat ?? 'wav'

  return {
    providerName: 'Mirelo SFX V1.5',
    modelName: request.modelName,
    mockAudioBytes: null,
    mockStoragePath: mockStoragePath(request),
    durationSeconds: request.durationSeconds,
    outputFormat,
    rawResponse: {
      parts: [
        {
          text: [
            'Mock Mirelo SFX structure.',
            `Prompt summary: ${request.prompt.slice(0, 180)}${request.prompt.length > 180 ? '...' : ''}`,
            'Production-style placeholder only; no real audio was generated.',
          ].join(' '),
        },
        {
          type: 'audio',
          mimeType: outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav',
          data: null,
        },
      ],
    },
    mockOnly: true,
    generatedAt: nowIso(),
  }
}

export function generateMockMireloSFX(request: MireloSFXInternalRequest): SFXProviderResult {
  const parsed = parseMireloSFXInternalResponse(createMockMireloSFXResponse(request))

  return {
    ok: true,
    response: parsed.response,
    warnings: [
      'Mock Mirelo SFX client used. No Mirelo API call was made.',
      ...parsed.warnings,
    ],
  }
}
