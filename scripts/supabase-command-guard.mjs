#!/usr/bin/env node

const failOnBlocked = process.argv.includes('--fail-on-blocked')
const separatorIndex = process.argv.indexOf('--')
const commandPreview = separatorIndex >= 0 ? process.argv.slice(separatorIndex + 1).join(' ') : process.argv.slice(2).filter((arg) => arg !== '--fail-on-blocked').join(' ')

const secretNames = [
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

const allowedEntrypoints = [
  'scripts/check-supabase-remote-gates.mjs',
  'scripts/inspect-supabase-remote-readonly.mjs',
  'scripts/supabase-command-guard.mjs',
  'scripts/check-supabase-command-safety.mjs',
  'npm run check:supabase-remote-gates',
  'npm run inspect:supabase-remote-readonly',
  'npm run inspect:supabase-remote-readonly -- --write-owner-packet',
  'npm run smoke:supabase-deployment-gates',
  'npm run smoke:supabase-remote-inspection',
  'npm run smoke:supabase-remote-gate-activation',
  'npm run smoke:supabase-command-safety',
  'npm run check:supabase-command-safety',
  'npm run guard:supabase-command',
]

function normalize(command) {
  return command.trim().replace(/\s+/g, ' ')
}

function redact(value) {
  let redacted = value
  for (const name of secretNames) {
    const secret = process.env[name]
    if (secret && secret.length > 2) redacted = redacted.split(secret).join('[REDACTED_SECRET_LIKE_VALUE]')
  }
  return redacted
    .replace(/--project-ref\s+[A-Za-z0-9_-]+/gi, '--project-ref [REDACTED_PROJECT_REF]')
    .replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/gi, '[REDACTED_DATABASE_URL]')
    .replace(/(?:supabase|sbp|eyJ)[A-Za-z0-9._-]{24,}/g, '[REDACTED_SECRET_LIKE_VALUE]')
    .replace(/(?:password|token|secret|service[_-]?role)\s*[:=]\s*[^\s'"<>]+/gi, (match) => `${match.split(/[:=]/)[0]}: [REDACTED_SECRET_LIKE_VALUE]`)
}

function hasSecretBeforeRedaction(command) {
  return secretNames.some((name) => {
    const secret = process.env[name]
    return Boolean(secret && secret.length > 2 && command.includes(secret))
  })
}

function hasStandaloneSupabase(command) {
  return /(^|[\s"'`(])supabase(\s|$)/i.test(normalize(command))
}

function classify(command) {
  const text = normalize(command)
  const lower = text.toLowerCase()
  if (/`[^`]*supabase[^`]*`/i.test(text) || /\$\([^)]*supabase[^)]*\)/i.test(text)) return 'dangerous_command_substitution'
  if (allowedEntrypoints.some((entrypoint) => lower.includes(entrypoint.toLowerCase()))) return 'safe_local_gate_script'
  if ((/\brg\s+.*-F\b/.test(text) || /\bgrep\s+.*-F\b/.test(text)) && /['"][^'"]*supabase[^'"]*['"]/i.test(text)) return 'safe_fixed_string_search'
  if (lower.includes('supabase db push') && lower.includes('--dry-run')) return 'gated_db_push_dry_run'
  if (lower.includes('supabase migration list')) return 'gated_migration_list'
  if (lower.includes('supabase link')) return 'gated_link'
  if (lower.includes('supabase db pull')) return 'forbidden_db_pull'
  if (lower.includes('supabase db dump')) return 'forbidden_db_dump'
  if (lower.includes('supabase db query')) return 'forbidden_db_query'
  if (lower.includes('supabase migration repair')) return 'forbidden_migration_repair'
  if (lower.includes('supabase gen types --linked') || lower.includes('supabase gen types --project-id')) return 'forbidden_remote_typegen'
  if (lower.includes('supabase db push')) return 'forbidden_db_push'
  if (hasStandaloneSupabase(text)) return 'unknown_supabase_command'
  return 'safe_fixed_string_search'
}

function decisionFor(patternKind, secretRisk) {
  if (secretRisk) return 'blocked_secret_exposure_risk'
  if (patternKind === 'safe_local_gate_script' || patternKind === 'safe_fixed_string_search') return 'allowed_local_safe'
  if (patternKind === 'dangerous_command_substitution') return 'blocked_command_substitution_risk'
  if (patternKind.startsWith('forbidden')) return 'blocked_forbidden_command'
  return 'requires_approved_wrapper'
}

const patternKind = classify(commandPreview)
const secretRisk = hasSecretBeforeRedaction(commandPreview)
const decision = decisionFor(patternKind, secretRisk)
const blocked = decision !== 'allowed_local_safe'
const output = {
  ok: !blocked,
  decision,
  patternKind,
  sanitizedCommandPreview: redact(commandPreview),
  remoteCommandWouldRun: false,
  remoteMutationWouldRun: false,
  remoteSQLWouldRun: false,
  remoteTypegenWouldRun: false,
  secretsPrinted: false,
  warnings: blocked ? ['Command preview is blocked or requires an approved RP-DB gate wrapper.'] : [],
  mockOnly: true,
}

console.log(JSON.stringify(output, null, 2))

if (blocked && failOnBlocked) process.exit(1)
