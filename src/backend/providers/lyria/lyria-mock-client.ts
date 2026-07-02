import type {
  LyriaGenerateMusicRequest,
  LyriaGenerateMusicResponse,
  LyriaGeneratedAudioPart,
  LyriaGeneratedTextPart,
  LyriaProviderResult,
} from './lyria-provider-contracts'
import { nowIso } from '../../mock/mock-database'

export function createMockLyriaTextPart(request: LyriaGenerateMusicRequest): LyriaGeneratedTextPart {
  return {
    type: 'text',
    text: [
      'Mock Lyria song structure:',
      `Model: ${request.model}.`,
      `Prompt summary: ${request.prompt.slice(0, 180)}${request.prompt.length > 180 ? '...' : ''}`,
      'Structure: intro, development, cue-safe resolve.',
      'This is placeholder text only; no real lyrics or music were generated.',
    ].join(' '),
  }
}

export function createMockLyriaAudioPart(request: LyriaGenerateMusicRequest): LyriaGeneratedAudioPart {
  return {
    type: 'audio',
    mimeType: request.outputMimeType ?? 'audio/wav',
    data: null,
    sizeBytes: 0,
  }
}

export function createMockLyriaResponse(request: LyriaGenerateMusicRequest): LyriaGenerateMusicResponse {
  const textPart = createMockLyriaTextPart(request)
  const audioPart = createMockLyriaAudioPart(request)
  const parts = [textPart, audioPart]

  return {
    provider: 'Lyria Pro',
    model: request.model,
    parts,
    textParts: parts.filter((part) => part.type === 'text').map((part) => part.text),
    audioParts: parts.filter((part): part is LyriaGeneratedAudioPart => part.type === 'audio'),
    rawResponse: {
      candidates: [
        {
          content: {
            parts: [
              { text: textPart.text },
              { inlineData: { mimeType: audioPart.mimeType, data: null } },
            ],
          },
        },
      ],
    },
    mockOnly: true,
    generatedAt: nowIso(),
  }
}

export function generateMockLyriaMusic(request: LyriaGenerateMusicRequest): LyriaProviderResult {
  return {
    ok: true,
    response: createMockLyriaResponse(request),
    warnings: ['Mock Lyria client used. No Google API call was made.'],
  }
}
