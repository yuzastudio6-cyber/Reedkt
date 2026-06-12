import type {
  QwenTimeoutCalibrationCase,
  QwenTimeoutCalibrationResult,
  QwenTimeoutFailure,
  TokenUsage,
} from './qwen-timeout-calibration-types'
import {
  buildBlockedQwenTimeoutResult,
  classifyQwenTimeoutHttpError,
  normalizeQwenTimeoutUsage,
  parseAndValidateQwenTimeoutContent,
} from './qwen-timeout-target-runner'

type StreamReadResult = ReadableStreamReadResult<Uint8Array>

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function timeoutFailure<T>(ms: number, failure: QwenTimeoutFailure): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(failure)), ms)
  })
}

export async function runQwenTimeoutStreamingCase(input: {
  currentCase: QwenTimeoutCalibrationCase
  baseUrl: string
  apiKey: string
}): Promise<QwenTimeoutCalibrationResult> {
  const started = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.currentCase.timeoutMs)
  try {
    const response = await fetch(`${input.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(buildStreamingRequestBody(input.currentCase)),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text()
      return buildBlockedQwenTimeoutResult(input.currentCase, classifyQwenTimeoutHttpError(response.status, text), {
        httpStatus: response.status,
        latencyMs: Date.now() - started,
        responseContentCharacters: text.length,
      })
    }

    const reader = response.body?.getReader()
    if (!reader) {
      return buildBlockedQwenTimeoutResult(input.currentCase, 'stream_timeout', {
        httpStatus: response.status,
        latencyMs: Date.now() - started,
      })
    }

    const firstByteStarted = Date.now()
    let firstChunk: StreamReadResult
    try {
      firstChunk = await Promise.race([
        reader.read(),
        timeoutFailure<StreamReadResult>(input.currentCase.firstByteTimeoutMs ?? 12000, 'first_byte_timeout'),
      ])
    } catch (error) {
      return buildBlockedQwenTimeoutResult(input.currentCase, error instanceof Error && error.message === 'first_byte_timeout'
        ? 'first_byte_timeout'
        : 'stream_timeout', {
        httpStatus: response.status,
        latencyMs: Date.now() - started,
      })
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let content = ''
    let finishReason = ''
    let usage: TokenUsage | undefined
    let responseCharacters = 0

    const consumeChunk = (chunk: Uint8Array | undefined) => {
      if (!chunk) return
      const text = decoder.decode(chunk, { stream: true })
      responseCharacters += text.length
      buffer += text
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice('data:'.length).trim()
        if (!payload || payload === '[DONE]') continue
        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(payload) as Record<string, unknown>
        } catch {
          continue
        }
        const choice = asRecord(asArray(parsed.choices)[0])
        const delta = asRecord(choice.delta)
        content += asString(delta.content)
        finishReason = asString(choice.finish_reason) || finishReason
        const currentUsage = normalizeQwenTimeoutUsage(asRecord(parsed.usage))
        if (currentUsage.totalTokens !== undefined || currentUsage.promptTokens !== undefined) usage = currentUsage
      }
    }

    consumeChunk(firstChunk.value)
    while (!firstChunk.done) {
      const next = await reader.read()
      consumeChunk(next.value)
      if (next.done) break
      firstChunk = next
    }

    const validation = parseAndValidateQwenTimeoutContent(content, input.currentCase)
    if (!validation.ok) {
      return buildBlockedQwenTimeoutResult(input.currentCase, validation.blocker, {
        httpStatus: response.status,
        latencyMs: Date.now() - started,
        firstByteLatencyMs: Date.now() - firstByteStarted,
        finishReason,
        usage,
        responseContentCharacters: content.length || responseCharacters,
      })
    }

    return {
      caseId: input.currentCase.caseId,
      sourceCaseId: input.currentCase.sourceCaseId,
      modelId: input.currentCase.modelId,
      stage: input.currentCase.stage,
      mode: input.currentCase.mode,
      schemaId: input.currentCase.schemaId,
      status: 'passed',
      httpStatus: response.status,
      latencyMs: Date.now() - started,
      firstByteLatencyMs: Date.now() - firstByteStarted,
      finishReason,
      usage,
      responseContentCharacters: content.length,
      normalizedOutput: validation.normalized,
      rawProviderResponseStored: false,
      rawProviderResponsePrinted: false,
      secretPayloadPrinted: false,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      routeExecutionAllowed: false,
      publicArtifactsAllowed: false,
      signedUrlsAllowed: false,
      rawPromptForwardingAllowed: false,
      directMutationAllowed: false,
      productionMutationAllowed: false,
    }
  } catch (error) {
    const blocker: QwenTimeoutFailure = error instanceof Error && error.name === 'AbortError'
      ? 'stream_timeout'
      : 'stream_timeout'
    return buildBlockedQwenTimeoutResult(input.currentCase, blocker, {
      latencyMs: Date.now() - started,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function buildStreamingRequestBody(currentCase: QwenTimeoutCalibrationCase) {
  return {
    model: currentCase.modelId,
    messages: [
      {
        role: 'system',
        content: [
          'You are a schema-only timeout calibration evaluator for ReeditPro.',
          'Return one JSON object only. Do not include markdown or prose outside JSON.',
          'Use synthetic metadata only. Do not ask to run workers, tools, routes, media, Supabase, public artifacts, signed URLs, production, external beta, or paid production.',
        ].join(' '),
      },
      {
        role: 'user',
        content: currentCase.prompt,
      },
    ],
    max_tokens: currentCase.maxOutputTokens,
    temperature: 0,
    stream: true,
    stream_options: {
      include_usage: true,
    },
  }
}
