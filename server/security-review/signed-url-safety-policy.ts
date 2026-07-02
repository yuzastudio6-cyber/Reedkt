import { sanitizeLogPayload } from '../observability'
import type { SecurityReviewFinding } from './security-review-types'

export function detectSignedUrlSafetyFindings(payload: unknown): SecurityReviewFinding[] {
  const sanitized = sanitizeLogPayload(payload)
  return sanitized.findings
    .filter((finding) => finding.reason === 'signed_url')
    .map((finding) => ({
      area: 'signed_url_safety' as const,
      status: 'blocked' as const,
      message: `Persistent signed URL field/value detected at ${finding.path}.`,
    }))
}

export function assertNoPersistentSignedUrls(payload: unknown): void {
  const findings = detectSignedUrlSafetyFindings(payload)
  if (findings.length > 0) throw new Error(findings.map((finding) => finding.message).join('; '))
}
