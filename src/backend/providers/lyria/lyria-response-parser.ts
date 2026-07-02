import type {
  LyriaGenerateMusicResponse,
  LyriaGeneratedAudioPart,
  LyriaGeneratedPart,
  LyriaGeneratedTextPart,
  LyriaModelName,
  LyriaOutputMimeType,
} from './lyria-provider-contracts'
import { nowIso } from '../../mock/mock-database'

type RawPart = {
  type?: unknown
  text?: unknown
  inlineData?: {
    mimeType?: unknown
    data?: unknown
  }
  inline_data?: {
    mime_type?: unknown
    mimeType?: unknown
    data?: unknown
  }
  mimeType?: unknown
  data?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractCandidateParts(rawResponse: unknown): unknown[] {
  if (!rawResponse) return []
  if (isRecord(rawResponse) && Array.isArray(rawResponse.parts)) return rawResponse.parts
  if (isRecord(rawResponse) && Array.isArray(rawResponse.candidates)) {
    return rawResponse.candidates.flatMap((candidate) => {
      if (!isRecord(candidate)) return []
      const content = candidate.content
      if (!isRecord(content) || !Array.isArray(content.parts)) return []
      return content.parts
    })
  }
  return []
}

export function normalizeLyriaAudioMimeType(value: unknown): LyriaOutputMimeType | string {
  if (value === 'audio/wav' || value === 'audio/mp3' || value === 'audio/mpeg') return value
  return typeof value === 'string' && value.length > 0 ? value : 'audio/mpeg'
}

function partToGeneratedPart(part: unknown): LyriaGeneratedPart | undefined {
  if (!isRecord(part)) return undefined
  const rawPart = part as RawPart

  if (rawPart.type === 'text' && typeof rawPart.text === 'string') {
    return { type: 'text', text: rawPart.text }
  }

  if (typeof rawPart.text === 'string') {
    return { type: 'text', text: rawPart.text }
  }

  const inlineData = rawPart.inlineData ?? rawPart.inline_data
  if (inlineData) {
    const data = inlineData.data
    const mimeType = 'mimeType' in inlineData
      ? inlineData.mimeType
      : (inlineData as { mime_type?: unknown }).mime_type
    return {
      type: 'audio',
      mimeType: normalizeLyriaAudioMimeType(mimeType),
      data: data instanceof Uint8Array || typeof data === 'string' || data === null ? data : null,
      sizeBytes: typeof data === 'string' ? data.length : data instanceof Uint8Array ? data.byteLength : undefined,
    }
  }

  if (rawPart.type === 'audio') {
    const data = rawPart.data
    return {
      type: 'audio',
      mimeType: normalizeLyriaAudioMimeType(rawPart.mimeType),
      data: data instanceof Uint8Array || typeof data === 'string' || data === null ? data : null,
      sizeBytes: typeof data === 'string' ? data.length : data instanceof Uint8Array ? data.byteLength : undefined,
    }
  }

  return undefined
}

export function extractLyriaTextParts(parts: LyriaGeneratedPart[]): string[] {
  return parts
    .filter((part): part is LyriaGeneratedTextPart => part.type === 'text')
    .map((part) => part.text)
}

export function extractLyriaAudioParts(parts: LyriaGeneratedPart[]): LyriaGeneratedAudioPart[] {
  return parts.filter((part): part is LyriaGeneratedAudioPart => part.type === 'audio')
}

export function parseLyriaResponse(input: {
  rawResponse: unknown
  model?: LyriaModelName
  mockOnly?: boolean
}): {
  response: LyriaGenerateMusicResponse
  warnings: string[]
} {
  const rawParts = extractCandidateParts(input.rawResponse)
  const parts = rawParts.map(partToGeneratedPart).filter((part): part is LyriaGeneratedPart => Boolean(part))
  const textParts = extractLyriaTextParts(parts)
  const audioParts = extractLyriaAudioParts(parts)
  const warnings: string[] = []

  if (parts.length === 0) {
    warnings.push('Lyria response parser found no recognized parts.')
  }
  if (audioParts.length === 0) {
    warnings.push('Lyria response did not include an audio part.')
  }
  if (audioParts.length > 1) {
    warnings.push('Lyria response included multiple audio parts; downstream storage should choose intentionally.')
  }
  if (textParts.length > 0 && audioParts.length === 0) {
    warnings.push('Lyria response returned text or song structure only.')
  }

  return {
    response: {
      provider: 'Lyria Pro',
      model: input.model ?? 'lyria-3-pro-preview',
      parts,
      textParts,
      audioParts,
      rawResponse: input.rawResponse,
      mockOnly: input.mockOnly ?? true,
      generatedAt: nowIso(),
    },
    warnings,
  }
}

export function createLyriaResponseSummary(response: LyriaGenerateMusicResponse) {
  return [
    `${response.textParts.length} text part(s)`,
    `${response.audioParts.length} audio part(s)`,
    `model ${response.model}`,
    response.mockOnly ? 'mock response' : 'provider response',
  ].join(' | ')
}
