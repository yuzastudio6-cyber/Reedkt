import type { SanitizedLogFinding, SanitizedLogResult } from './observability-types'

export const forbiddenLogFields = [
  'serviceRoleKey',
  'service_role_key',
  'providerApiKey',
  'provider_api_key',
  'secretValue',
  'secret_value',
  'signedUrl',
  'signed_url',
  'rawPrompt',
  'raw_prompt',
  'promptText',
  'prompt_text',
  'rawUserChat',
  'raw_user_chat',
  'authorization',
  'cookie',
  'set-cookie',
] as const

const redacted = '[REDACTED]'

export function sanitizeLogPayload<T>(payload: T): SanitizedLogResult<T> {
  const findings: SanitizedLogFinding[] = []
  const sanitized = sanitizeValue(payload, findings, '$') as T
  return { sanitized, findings }
}

export function assertNoForbiddenLogFields(payload: unknown): void {
  const { findings } = sanitizeLogPayload(payload)
  if (findings.length > 0) {
    throw new Error(`Forbidden log fields detected: ${findings.map((finding) => finding.path).join(', ')}`)
  }
}

function sanitizeValue(value: unknown, findings: SanitizedLogFinding[], path: string): unknown {
  if (Array.isArray(value)) return value.map((item, index) => sanitizeValue(item, findings, `${path}[${index}]`))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => {
      const reason = reasonForKeyOrValue(key, nested)
      if (reason) {
        findings.push({ path: `${path}.${key}`, reason })
        return [key, redacted]
      }
      return [key, sanitizeValue(nested, findings, `${path}.${key}`)]
    }))
  }
  if (typeof value === 'string') {
    const reason = reasonForString(value)
    if (reason) {
      findings.push({ path, reason })
      return redacted
    }
  }
  return value
}

function reasonForKeyOrValue(key: string, value: unknown): SanitizedLogFinding['reason'] | undefined {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (normalized.includes('authorization')) return 'auth_header'
  if (normalized.includes('cookie')) return 'cookie'
  if (normalized === 'signedurl' || normalized === 'signedurls' || normalized === 'signedurlfield') return 'signed_url'
  if (normalized === 'rawprompt' || normalized === 'prompttext' || normalized === 'rawuserchat') return 'raw_prompt'
  if (normalized.includes('secret') || normalized.includes('apikey') || normalized.includes('servicerole')) return 'secret'
  if (typeof value === 'string') return reasonForString(value)
  return undefined
}

function reasonForString(value: string): SanitizedLogFinding['reason'] | undefined {
  if (/https?:\/\/[^\s]+\?(x-goog-signature|signature|token)=/i.test(value)) return 'signed_url'
  if (/bearer\s+[a-z0-9._-]+/i.test(value)) return 'auth_header'
  if (/[a-z]:\\users\\[^\\]+\\/i.test(value) && /(appdata|onedrive|documents|desktop)/i.test(value)) return 'sensitive_path'
  if (/sk-[a-z0-9_-]{12,}/i.test(value)) return 'secret'
  return undefined
}
