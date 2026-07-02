import { nowIso } from '../../../mock/mock-database'
import type { SFXProviderResult } from '../sfx-provider-contracts'
import type { MMAudioInternalRequest, MMAudioInternalResponse } from './mmaudio-contracts'
import { parseMMAudioInternalResponse } from './mmaudio-response-parser'

function mockStoragePath(request: MMAudioInternalRequest) {
  const projectId = typeof request.metadata?.projectId === 'string' ? request.metadata.projectId : 'mock-project'
  const eventPlanId = typeof request.metadata?.sfxEventPlanId === 'string' ? request.metadata.sfxEventPlanId : 'mock-event'
  return `mock://generated-sfx/${projectId}/${eventPlanId}/mmaudio.wav`
}

export function createMockMMAudioResponse(request: MMAudioInternalRequest): MMAudioInternalResponse {
  const outputFormat = request.outputFormat ?? 'wav'

  return {
    providerName: 'MMAudio V2',
    modelName: request.modelName,
    mockAudioBytes: null,
    mockStoragePath: mockStoragePath(request),
    durationSeconds: request.durationSeconds,
    outputFormat,
    rawResponse: {
      parts: [
        {
          text: [
            'Mock MMAudio V2 SFX draft.',
            `Prompt summary: ${request.prompt.slice(0, 120)}${request.prompt.length > 120 ? '...' : ''}`,
            'Video-conditioned placeholder only; no real audio was generated.',
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

export function generateMockMMAudioSFX(request: MMAudioInternalRequest): SFXProviderResult {
  const parsed = parseMMAudioInternalResponse(createMockMMAudioResponse(request))

  return {
    ok: true,
    response: parsed.response,
    warnings: [
      'Mock MMAudio V2 client used. No MMAudio API call was made.',
      ...parsed.warnings,
    ],
  }
}
