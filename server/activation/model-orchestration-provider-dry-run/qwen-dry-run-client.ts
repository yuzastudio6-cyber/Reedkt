import type { ModelProviderDryRunCase, ProviderCallResult } from './model-provider-dry-run-types'

const QWEN_COMPATIBLE_CHAT_COMPLETIONS_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

export async function callQwenDryRunCase(input: {
  dryRunCase: ModelProviderDryRunCase
  apiKey: string
}): Promise<ProviderCallResult> {
  return callOpenAiCompatibleProvider({
    url: QWEN_COMPATIBLE_CHAT_COMPLETIONS_URL,
    apiKey: input.apiKey,
    dryRunCase: input.dryRunCase,
  })
}

async function callOpenAiCompatibleProvider(input: {
  url: string
  apiKey: string
  dryRunCase: ModelProviderDryRunCase
}): Promise<ProviderCallResult> {
  const startedAt = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.dryRunCase.timeoutMs)
  try {
    const response = await fetch(input.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: input.dryRunCase.modelId,
        messages: [
          { role: 'system', content: input.dryRunCase.systemPrompt },
          { role: 'user', content: input.dryRunCase.userPrompt },
        ],
        max_tokens: input.dryRunCase.maxTokens,
        temperature: 0,
        stream: false,
        response_format: { type: 'json_object' },
      }),
    })
    const body = await response.json() as {
      choices?: Array<{ message?: { content?: string }, finish_reason?: string }>
      usage?: { prompt_tokens?: number, completion_tokens?: number, total_tokens?: number }
      error?: { message?: string }
    }
    if (!response.ok) {
      return {
        caseId: input.dryRunCase.caseId,
        providerId: input.dryRunCase.providerId,
        modelId: input.dryRunCase.modelId,
        status: 'blocked',
        httpStatus: response.status,
        latencyMs: Date.now() - startedAt,
        blocker: `provider_http_error:${response.status}:${body.error?.message?.slice(0, 160) ?? 'no_message'}`,
      }
    }
    return {
      caseId: input.dryRunCase.caseId,
      providerId: input.dryRunCase.providerId,
      modelId: input.dryRunCase.modelId,
      status: 'passed',
      httpStatus: response.status,
      latencyMs: Date.now() - startedAt,
      rawContent: body.choices?.[0]?.message?.content ?? '',
      finishReason: body.choices?.[0]?.finish_reason,
      usage: {
        promptTokens: body.usage?.prompt_tokens,
        completionTokens: body.usage?.completion_tokens,
        totalTokens: body.usage?.total_tokens,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.name : 'unknown_error'
    return {
      caseId: input.dryRunCase.caseId,
      providerId: input.dryRunCase.providerId,
      modelId: input.dryRunCase.modelId,
      status: 'blocked',
      latencyMs: Date.now() - startedAt,
      blocker: `provider_request_failed:${message}`,
    }
  } finally {
    clearTimeout(timeout)
  }
}
