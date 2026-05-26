import { sanitizeLogPayload } from '../observability'
import type { SecurityReviewFinding, SourceFileSnapshot } from './security-review-types'

const obviousSecretPatterns = [
  /sk-[a-z0-9_-]{12,}/i,
  /service[_-]?role[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  /provider[_-]?api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
]

export function detectSecretSafetyFindings(payload: unknown, files: SourceFileSnapshot[] = []): SecurityReviewFinding[] {
  const findings: SecurityReviewFinding[] = []
  const sanitized = sanitizeLogPayload(payload)

  for (const finding of sanitized.findings.filter((item) => item.reason === 'secret' || item.reason === 'auth_header' || item.reason === 'cookie')) {
    findings.push({
      area: 'secret_safety',
      status: 'blocked',
      message: `Sensitive log/config field detected at ${finding.path}.`,
    })
  }

  for (const file of files) {
    if (obviousSecretPatterns.some((pattern) => pattern.test(file.content))) {
      findings.push({
        area: 'secret_safety',
        status: 'blocked',
        path: file.path,
        message: 'Potential hardcoded secret or provider key detected.',
      })
    }
    if (/src[\\/].*\.(ts|tsx|js|jsx)$/.test(file.path) && /(service_role|serviceRole|providerApiKey|PROVIDER_API_KEY)/.test(file.content)) {
      findings.push({
        area: 'secret_safety',
        status: 'blocked',
        path: file.path,
        message: 'Frontend code must not reference service-role or provider secrets.',
      })
    }
  }

  return findings
}
