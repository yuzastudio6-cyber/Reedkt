import type {
  QwenProviderTransportRequest,
  QwenProviderTransportResult,
  QwenRuntimeTransportProfile,
} from '../../types'
import { createQwenRuntimeSafetyFlags } from './qwen-runtime-config-service'
import { redactQwenRuntimeLogPayload } from './qwen-secret-redaction-service'

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  let normalizedPath = path.replace(/^\/+/, '')
  if (/\/v1$/i.test(normalizedBase) && /^v1\//i.test(normalizedPath)) {
    normalizedPath = normalizedPath.replace(/^v1\//i, '')
  }
  return `${normalizedBase}/${normalizedPath}`
}

function buildBody(profile: QwenRuntimeTransportProfile, request: QwenProviderTransportRequest): Record<string, unknown> {
  if (profile === 'generic_json_post') {
    return {
      model: request.modelId,
      prompt: {
        system: request.systemPrompt,
        user: request.userPrompt,
      },
      outputSchema: request.outputSchemaName ?? 'QwenMarkerChatStructuredResponse',
    }
  }
  return {
    model: request.modelId,
    messages: [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userPrompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  }
}

function extractJsonObjectText(value: string): unknown {
  const trimmed = value.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]?.trim()
  const candidate = fenced ?? trimmed
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1))
      } catch {
        return candidate
      }
    }
    return candidate
  }
}

function contentText(content: unknown): string | undefined {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return undefined
  const parts = content
    .map((part) => {
      if (typeof part === 'string') return part
      if (!part || typeof part !== 'object') return ''
      const record = part as Record<string, unknown>
      return typeof record.text === 'string'
        ? record.text
        : typeof record.content === 'string'
          ? record.content
          : ''
    })
    .filter(Boolean)
  return parts.length ? parts.join('\n') : undefined
}

function safeResult(input: Omit<QwenProviderTransportResult, keyof ReturnType<typeof createQwenRuntimeSafetyFlags>>): QwenProviderTransportResult {
  return {
    ...createQwenRuntimeSafetyFlags(input.status === 'completed'
      ? { providerCallMade: true, modelCallMade: true, qwenCallMade: true }
      : { providerCallMade: input.status !== 'not_attempted' && input.status !== 'request_built', modelCallMade: input.status !== 'not_attempted' && input.status !== 'request_built', qwenCallMade: input.status !== 'not_attempted' && input.status !== 'request_built' }),
    ...input,
  }
}

function extractJsonFromResponse(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const record = payload as Record<string, unknown>
  const choices = record.choices
  if (Array.isArray(choices)) {
    const first = choices[0]
    if (first && typeof first === 'object') {
      const message = (first as Record<string, unknown>).message
      if (message && typeof message === 'object') {
        const content = contentText((message as Record<string, unknown>).content)
        if (content) return extractJsonObjectText(content)
      }
    }
  }
  if ('output' in record) return record.output
  if ('response' in record) return record.response
  return payload
}

export async function sendQwenProviderTransportRequest(input: {
  request: QwenProviderTransportRequest
  apiKey: string
  fetchImpl?: typeof fetch
}): Promise<QwenProviderTransportResult> {
  const fetcher = input.fetchImpl ?? fetch
  const url = joinUrl(input.request.baseUrl, input.request.requestPath)
  const body = JSON.stringify(buildBody(input.request.profile, input.request))
  const attempts = Math.max(1, input.request.maxRetries + 1)

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), input.request.timeoutMs)
    try {
      const response = await fetcher(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.apiKey}`,
        },
        body,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const text = await response.text()
      const redacted = redactQwenRuntimeLogPayload(text)
      if (response.status === 429 && attempt < attempts - 1) continue
      if (response.status >= 500 && attempt < attempts - 1) continue
      if (response.status === 429) {
        return safeResult({
          status: 'rate_limited',
          httpStatus: response.status,
          redactedRawPreview: redacted.redactedText.slice(0, 500),
          warnings: ['Qwen provider returned rate limit; deterministic fallback should be used.'],
        })
      }
      if (!response.ok) {
        return safeResult({
          status: 'failed',
          httpStatus: response.status,
          redactedRawPreview: redacted.redactedText.slice(0, 500),
          warnings: ['Qwen provider returned non-success status; deterministic fallback should be used.'],
        })
      }
      if (!text.trim()) {
        return safeResult({
          status: 'empty_response',
          httpStatus: response.status,
          redactedRawPreview: '',
          warnings: ['Qwen provider returned empty response; deterministic fallback should be used.'],
        })
      }
      try {
        const parsed = JSON.parse(text)
        return safeResult({
          status: 'completed',
          httpStatus: response.status,
          parsedJson: extractJsonFromResponse(parsed),
          redactedRawPreview: redacted.redactedText.slice(0, 500),
          warnings: ['Qwen provider response parsed with redacted preview only.'],
        })
      } catch {
        return safeResult({
          status: 'invalid_json',
          httpStatus: response.status,
          redactedRawPreview: redacted.redactedText.slice(0, 500),
          warnings: ['Qwen provider returned invalid JSON; deterministic fallback should be used.'],
        })
      }
    } catch (error) {
      clearTimeout(timeout)
      const message = error instanceof Error ? error.message : String(error)
      if (/abort/i.test(message)) {
        if (attempt < attempts - 1) continue
        return safeResult({
          status: 'timeout',
          warnings: ['Qwen provider request timed out; deterministic fallback should be used.'],
        })
      }
      const redacted = redactQwenRuntimeLogPayload(message)
      return safeResult({
        status: 'failed',
        redactedRawPreview: redacted.redactedText.slice(0, 500),
        warnings: ['Qwen provider request failed with redacted error; deterministic fallback should be used.'],
      })
    }
  }

  return safeResult({
    status: 'failed',
    warnings: ['Qwen provider transport exhausted retries; deterministic fallback should be used.'],
  })
}

export function createQwenProviderTransportSafeRequestSummary(request: QwenProviderTransportRequest): string {
  return `Qwen transport ${request.profile} to configured backend base URL with path ${request.requestPath}; Authorization header is constructed server-side and never logged.`
}
