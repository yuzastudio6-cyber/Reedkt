import type { QwenSecretRedactionResult } from '../../types'

const secretPatterns = [
  /Bearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
  /sk-[A-Za-z0-9_-]{8,}/g,
  /AIza[A-Za-z0-9_-]{8,}/g,
  /eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /projects\/[^/\s]+\/secrets\/[^/\s]+(?:\/versions\/[^/\s]+)?/gi,
  /\b[A-Za-z0-9_-]{32,}\b/g,
]

export function redactQwenSecretLikeValue(value: string): QwenSecretRedactionResult {
  let redactedText = value
  let replacements = 0
  for (const pattern of secretPatterns) {
    redactedText = redactedText.replace(pattern, () => {
      replacements += 1
      return '[REDACTED_QWEN_SECRET_BOUNDARY]'
    })
  }

  return {
    inputContainedSecretLikeValue: replacements > 0,
    redactedText,
    replacements,
    secretValuePrinted: false,
    mockOnly: true,
  }
}

export function redactQwenRuntimeLogPayload(payload: unknown): QwenSecretRedactionResult {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return redactQwenSecretLikeValue(serialized ?? '')
}

export function detectQwenSecretLeakRisk(payload: unknown): boolean {
  return redactQwenRuntimeLogPayload(payload).inputContainedSecretLikeValue
}

export function createQwenSecretRedactionSummary(result: QwenSecretRedactionResult): string {
  return result.inputContainedSecretLikeValue
    ? `Qwen redaction replaced ${result.replacements} secret-like value(s); secret values printed: false.`
    : 'Qwen redaction found no secret-like values; secret values printed: false.'
}
