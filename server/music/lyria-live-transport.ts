import { createHash } from 'node:crypto'
import type {
  Lyria3InteractionRequest,
  LyriaProviderCandidateBytes,
  LyriaTransport,
  LyriaTransportResult,
} from './lyria-provider'
import { LYRIA_3_PROVIDER_PROFILE } from './lyria-provider'

const MAX_LYRIA_RESPONSE_BYTES = 32 * 1024 * 1024
const PROJECT_ENDPOINT = /^\/v1beta1\/projects\/[a-z][a-z0-9-]{4,62}[a-z0-9]\/locations\/global\/interactions$/u

export interface LyriaProviderRejectionSummary {
  httpStatus: number
  providerStatus?: string
  providerReason?: string
  safeMessage?: string
  responseHash: string
}

type LyriaInteractionOutput = {
  type?: unknown
  mime_type?: unknown
  data?: unknown
  content?: unknown
}

type LyriaInteractionResponse = {
  id?: unknown
  status?: unknown
  outputs?: unknown
}

function safeProviderToken(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^[A-Z][A-Z0-9_]{2,63}$/u.test(value)) return undefined
  return value
}

function redactProviderMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const redacted = value
    .replace(/https?:\/\/\S+/giu, '[redacted-url]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, '[redacted-email]')
    .replace(/\b(?:ya29\.|eyJ)[A-Za-z0-9._-]+\b/gu, '[redacted-token]')
    .replace(/\b[A-Za-z0-9_-]{48,}\b/gu, '[redacted-identifier]')
    .replace(/[\u0000-\u001f\u007f]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
  return redacted ? redacted.slice(0, 320) : undefined
}

export function summarizeLyriaProviderRejection(input: {
  httpStatus: number
  responseText: string
}): LyriaProviderRejectionSummary {
  let providerStatus: string | undefined
  let providerReason: string | undefined
  let safeMessage: string | undefined
  try {
    const body = JSON.parse(input.responseText) as { error?: unknown }
    const error = body.error && typeof body.error === 'object'
      ? body.error as { status?: unknown; message?: unknown; details?: unknown }
      : undefined
    providerStatus = safeProviderToken(error?.status)
    safeMessage = redactProviderMessage(error?.message)
    if (Array.isArray(error?.details)) {
      for (const detail of error.details) {
        if (!detail || typeof detail !== 'object') continue
        providerReason = safeProviderToken((detail as { reason?: unknown }).reason)
        if (providerReason) break
      }
    }
  } catch {
    // A malformed provider error is still represented by its hash and HTTP status.
  }
  return {
    httpStatus: input.httpStatus,
    providerStatus,
    providerReason,
    safeMessage,
    responseHash: createHash('sha256').update(input.responseText).digest('hex'),
  }
}

function exactEndpoint(value: string): URL {
  const endpoint = new URL(value)
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'aiplatform.googleapis.com' ||
      endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
      !PROJECT_ENDPOINT.test(endpoint.pathname)) {
    throw new Error('Lyria transport rejected a non-canonical endpoint.')
  }
  return endpoint
}

function audioOutputs(response: LyriaInteractionResponse): LyriaInteractionOutput[] {
  if (!Array.isArray(response.outputs)) return []
  const candidates: LyriaInteractionOutput[] = []
  for (const output of response.outputs) {
    if (!output || typeof output !== 'object') continue
    const item = output as LyriaInteractionOutput
    if (item.type === 'audio') candidates.push(item)
    if (item.type === 'model_output' && Array.isArray(item.content)) {
      for (const child of item.content) {
        if (child && typeof child === 'object' && (child as LyriaInteractionOutput).type === 'audio') {
          candidates.push(child as LyriaInteractionOutput)
        }
      }
    }
  }
  return candidates
}

function decodeAudioOutput(output: LyriaInteractionOutput, index: number): LyriaProviderCandidateBytes {
  if (output.mime_type !== 'audio/mpeg' && output.mime_type !== 'audio/mp3') {
    throw new Error('Lyria transport rejected an unexpected output media type.')
  }
  if (typeof output.data !== 'string' || output.data.length === 0 ||
      output.data.length > Math.ceil(MAX_LYRIA_RESPONSE_BYTES * 4 / 3) + 8 ||
      !/^[A-Za-z0-9+/]+={0,2}$/u.test(output.data)) {
    throw new Error('Lyria transport rejected malformed or oversized audio bytes.')
  }
  const bytes = Buffer.from(output.data, 'base64')
  if (bytes.length === 0 || bytes.length > MAX_LYRIA_RESPONSE_BYTES) {
    throw new Error('Lyria transport rejected empty or oversized decoded audio.')
  }
  return {
    bytes: new Uint8Array(bytes),
    contentType: 'audio/mpeg',
    providerOutputId: `lyria-output-${index + 1}`,
  }
}

export class GoogleLyria3InteractionsTransport implements LyriaTransport {
  readonly #getAccessToken: () => Promise<string>
  readonly #fetch: typeof fetch
  readonly #onRejectedResponse?: (summary: LyriaProviderRejectionSummary) => void

  constructor(input: {
    getAccessToken: () => Promise<string>
    fetchImplementation?: typeof fetch
    onRejectedResponse?: (summary: LyriaProviderRejectionSummary) => void
  }) {
    this.#getAccessToken = input.getAccessToken
    this.#fetch = input.fetchImplementation ?? fetch
    this.#onRejectedResponse = input.onRejectedResponse
  }

  async execute(input: {
    endpoint: string
    request: Lyria3InteractionRequest
    idempotencyKey: string
    timeoutMilliseconds: number
  }): Promise<LyriaTransportResult> {
    const endpoint = exactEndpoint(input.endpoint)
    if (input.request.store !== false || input.request.background !== false ||
        input.request.model !== LYRIA_3_PROVIDER_PROFILE.modelId &&
        input.request.model !== LYRIA_3_PROVIDER_PROFILE.clipModelId) {
      throw new Error('Lyria live transport received a non-canonical request profile.')
    }
    const accessToken = await this.#getAccessToken()
    if (!accessToken || /\s/u.test(accessToken)) throw new Error('Lyria access token loader returned no usable token.')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), input.timeoutMilliseconds)
    try {
      const response = await this.#fetch(endpoint, {
        method: 'POST',
        redirect: 'error',
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(input.request),
      })
      const declaredLength = Number(response.headers.get('content-length') ?? 0)
      if (Number.isFinite(declaredLength) && declaredLength > MAX_LYRIA_RESPONSE_BYTES) {
        return { status: 'failed', candidates: [], actualCostUsd: 0, failureCode: 'response_too_large' }
      }
      const text = await response.text()
      if (Buffer.byteLength(text, 'utf8') > MAX_LYRIA_RESPONSE_BYTES) {
        return { status: 'failed', candidates: [], actualCostUsd: 0, failureCode: 'response_too_large' }
      }
      if (!response.ok) {
        const rejection = summarizeLyriaProviderRejection({ httpStatus: response.status, responseText: text })
        this.#onRejectedResponse?.(rejection)
        const providerCode = rejection.providerReason ?? rejection.providerStatus
        return {
          status: response.status >= 500 ? 'unknown_outcome' : 'failed',
          candidates: [], actualCostUsd: 0,
          failureCode: `http_${response.status}${providerCode ? `_${providerCode.toLowerCase()}` : ''}`,
        }
      }
      const body = JSON.parse(text) as LyriaInteractionResponse
      const providerRequestId = typeof body.id === 'string' ? body.id : undefined
      if (body.status !== 'completed') {
        return { status: 'unknown_outcome', providerRequestId, candidates: [], actualCostUsd: 0,
          failureCode: 'interaction_not_completed' }
      }
      const candidates = audioOutputs(body).map(decodeAudioOutput)
      if (candidates.length !== 1) {
        return { status: 'failed', providerRequestId, candidates: [], actualCostUsd: 0,
          failureCode: 'unexpected_output_cardinality' }
      }
      return {
        status: 'succeeded', providerRequestId, candidates,
        actualCostUsd: input.request.model === LYRIA_3_PROVIDER_PROFILE.modelId
          ? LYRIA_3_PROVIDER_PROFILE.pricing.proTrackUpToThreeMinutes
          : LYRIA_3_PROVIDER_PROFILE.pricing.clipThirtySeconds,
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { status: 'failed', candidates: [], actualCostUsd: 0, failureCode: 'invalid_json' }
      }
      return { status: 'unknown_outcome', candidates: [], actualCostUsd: 0, failureCode: 'transport_unknown_outcome' }
    } finally {
      clearTimeout(timeout)
    }
  }
}
