const SECRET_ENV_NAMES = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_DB_PASSWORD',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'POSTGRES_URL',
  'QWEN_API_KEY',
  'DEEPSEEK_API_KEY',
  'STRIPE_SECRET_KEY',
  'GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON',
]

export function redactSupabaseProjectRefInCommandPreview(command: string): string {
  return command.replace(/--project-ref\s+[A-Za-z0-9_-]+/gi, '--project-ref [REDACTED_PROJECT_REF]')
}

export function redactCommandSafetySecretLikeValues(value: string, env: Record<string, string | undefined> = {}): string {
  let redacted = value
  for (const name of SECRET_ENV_NAMES) {
    const secret = env[name]
    if (secret && secret.length > 2) {
      redacted = redacted.split(secret).join('[REDACTED_SECRET_LIKE_VALUE]')
    }
  }
  redacted = redactSupabaseProjectRefInCommandPreview(redacted)
  redacted = redacted
    .replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/gi, '[REDACTED_DATABASE_URL]')
    .replace(/(?:supabase|sbp|eyJ)[A-Za-z0-9._-]{24,}/g, '[REDACTED_SECRET_LIKE_VALUE]')
    .replace(/(?:password|token|secret|service[_-]?role)\s*[:=]\s*[^\s'"<>]+/gi, (match) => {
      const key = match.split(/[:=]/)[0]
      return `${key}: [REDACTED_SECRET_LIKE_VALUE]`
    })
  return redacted
}

export function validateNoCommandSafetySecretsPrinted(value: string, env: Record<string, string | undefined> = {}): boolean {
  return SECRET_ENV_NAMES.every((name) => {
    const secret = env[name]
    return !secret || secret.length <= 2 || !value.includes(secret)
  })
}

export function createCommandOutputRedactionSummary(value: string, env: Record<string, string | undefined> = {}): string {
  const redacted = redactCommandSafetySecretLikeValues(value, env)
  const safe = validateNoCommandSafetySecretsPrinted(redacted, env)
  return `Command redaction safe=${safe}; length=${redacted.length}.`
}

export function listCommandSafetySecretEnvNames(): string[] {
  return [...SECRET_ENV_NAMES]
}
