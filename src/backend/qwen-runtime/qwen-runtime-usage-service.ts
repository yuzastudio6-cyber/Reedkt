import type { QwenRuntimeUsageRecord } from '../../types'

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.35))
}

export function createQwenRuntimeUsageRecord(input: {
  providerUsage?: unknown
  promptText: string
  responseText?: string
}): QwenRuntimeUsageRecord {
  const usage = input.providerUsage && typeof input.providerUsage === 'object' ? input.providerUsage as Record<string, unknown> : undefined
  const inputTokens = typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : typeof usage?.input_tokens === 'number' ? usage.input_tokens : undefined
  const outputTokens = typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : typeof usage?.output_tokens === 'number' ? usage.output_tokens : undefined
  const totalTokens = typeof usage?.total_tokens === 'number' ? usage.total_tokens : inputTokens !== undefined && outputTokens !== undefined ? inputTokens + outputTokens : undefined
  return {
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedInputTokens: inputTokens === undefined ? estimateTokens(input.promptText) : undefined,
    estimatedOutputTokens: outputTokens === undefined ? estimateTokens(input.responseText ?? '') : undefined,
    providerUsageReturned: Boolean(inputTokens !== undefined || outputTokens !== undefined || totalTokens !== undefined),
    usageEstimated: inputTokens === undefined || outputTokens === undefined,
    creditReservedOrSpent: false,
    notes: [
      'Qwen beta usage is recorded or estimated for diagnostics only.',
      'Credit reservation and spend remain disabled.',
    ],
  }
}
