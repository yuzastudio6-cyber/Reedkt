import { sanitizeLogPayload } from '../observability'
import type { SecurityReviewFinding } from './security-review-types'

export function detectRawPromptExecutionFindings(payload: unknown): SecurityReviewFinding[] {
  const sanitized = sanitizeLogPayload(payload)
  return sanitized.findings
    .filter((finding) => finding.reason === 'raw_prompt')
    .map((finding) => ({
      area: 'raw_prompt_execution' as const,
      status: 'blocked' as const,
      message: `Raw prompt execution field detected at ${finding.path}.`,
    }))
}

export function assertNoRawPromptExecution(payload: unknown): void {
  const findings = detectRawPromptExecutionFindings(payload)
  if (findings.length > 0) throw new Error(findings.map((finding) => finding.message).join('; '))
}
