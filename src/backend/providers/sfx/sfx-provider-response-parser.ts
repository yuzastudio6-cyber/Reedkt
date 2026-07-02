import { nowIso } from '../../mock/mock-database'
import type {
  SFXProviderAudioPart,
  SFXProviderGenerateResponse,
  SFXProviderGeneratedPart,
  SFXProviderKey,
  SFXProviderOutputFormat,
  SFXProviderTextPart,
} from './sfx-provider-contracts'
import { getSFXProviderDisplayLabel, normalizeSFXProviderKey } from './sfx-provider-contracts'

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

function providerName(providerKey: SFXProviderKey) {
  return getSFXProviderDisplayLabel(providerKey)
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

export function normalizeSFXAudioMimeType(value: unknown): string {
  if (value === 'audio/wav' || value === 'audio/mp3' || value === 'audio/mpeg') return value
  return typeof value === 'string' && value.length > 0 ? value : 'audio/wav'
}

function formatFromMime(mimeType: string): SFXProviderOutputFormat {
  if (mimeType === 'audio/wav') return 'wav'
  if (mimeType === 'audio/mp3' || mimeType === 'audio/mpeg') return 'mp3'
  return 'unknown'
}

function partToGeneratedPart(part: unknown): SFXProviderGeneratedPart | undefined {
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
      mimeType: normalizeSFXAudioMimeType(mimeType),
      data: data instanceof Uint8Array || typeof data === 'string' || data === null ? data : null,
      sizeBytes: typeof data === 'string' ? data.length : data instanceof Uint8Array ? data.byteLength : undefined,
    }
  }

  if (rawPart.type === 'audio') {
    const data = rawPart.data
    return {
      type: 'audio',
      mimeType: normalizeSFXAudioMimeType(rawPart.mimeType),
      data: data instanceof Uint8Array || typeof data === 'string' || data === null ? data : null,
      sizeBytes: typeof data === 'string' ? data.length : data instanceof Uint8Array ? data.byteLength : undefined,
    }
  }

  return undefined
}

export function extractSFXTextParts(parts: SFXProviderGeneratedPart[]): string[] {
  return parts
    .filter((part): part is SFXProviderTextPart => part.type === 'text')
    .map((part) => part.text)
}

export function extractSFXAudioParts(parts: SFXProviderGeneratedPart[]): SFXProviderAudioPart[] {
  return parts.filter((part): part is SFXProviderAudioPart => part.type === 'audio')
}

export function parseSFXProviderResponse(input: {
  rawResponse: unknown
  providerKey?: SFXProviderKey
  providerName?: string
  modelName?: string
  durationSeconds?: number
  outputFormat?: SFXProviderOutputFormat
  mockStoragePath?: string
  mockOnly?: boolean
}): {
  response: SFXProviderGenerateResponse
  warnings: string[]
} {
  const providerKey = normalizeSFXProviderKey(input.providerKey ?? (isRecord(input.rawResponse) && typeof input.rawResponse.providerKey === 'string'
    ? input.rawResponse.providerKey as SFXProviderKey
    : 'mirelo_sfx_v1_5')
  )
  const rawParts = extractCandidateParts(input.rawResponse)
  const parts = rawParts.map(partToGeneratedPart).filter((part): part is SFXProviderGeneratedPart => Boolean(part))
  const textParts = extractSFXTextParts(parts)
  const audioParts = extractSFXAudioParts(parts)
  const warnings: string[] = []

  if (parts.length === 0) {
    warnings.push('SFX provider response parser found no recognized parts.')
  }
  if (audioParts.length === 0 && providerKey !== 'no_sfx') {
    warnings.push('SFX provider response did not include an audio part.')
  }
  if (audioParts.length > 1) {
    warnings.push('SFX provider response included multiple audio parts; downstream storage should choose intentionally.')
  }
  if (textParts.length > 0 && audioParts.length === 0) {
    warnings.push('SFX provider response returned text only.')
  }

  const firstAudioFormat = audioParts[0] ? formatFromMime(audioParts[0].mimeType) : undefined

  return {
    response: {
      providerKey,
      providerName: input.providerName ?? providerName(providerKey),
      modelName: input.modelName,
      parts,
      audioParts,
      textParts,
      durationSeconds: input.durationSeconds,
      outputFormat: input.outputFormat ?? firstAudioFormat,
      mockStoragePath: input.mockStoragePath,
      rawResponse: input.rawResponse,
      mockOnly: input.mockOnly ?? true,
      generatedAt: nowIso(),
    },
    warnings,
  }
}

export function createSFXProviderResponseSummary(response: SFXProviderGenerateResponse) {
  return [
    response.providerName,
    response.modelName ? `model ${response.modelName}` : 'model unknown',
    `${response.textParts.length} text part(s)`,
    `${response.audioParts.length} audio part(s)`,
    response.durationSeconds ? `${response.durationSeconds}s` : 'duration unknown',
    response.mockOnly ? 'mock response' : 'provider response',
  ].join(' | ')
}
