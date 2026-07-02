import type { SupabaseCommandPatternKind } from '../../types/command-safety'
import { SUPABASE_COMMAND_GUARD_POLICY } from './supabase-command-safety-policy'

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, ' ')
}

function normalizeLower(command: string): string {
  return normalizeCommand(command).toLowerCase()
}

function includesSupabase(command: string): boolean {
  return /(^|[\s"'`(])supabase(\s|$)/i.test(normalizeCommand(command))
}

function containsPattern(command: string, pattern: string): boolean {
  return normalizeLower(command).includes(pattern.toLowerCase())
}

export function detectDangerousSupabaseCommandSubstitution(command: string): boolean {
  const text = normalizeCommand(command)
  return /`[^`]*supabase[^`]*`/i.test(text) || /\$\([^)]*supabase[^)]*\)/i.test(text)
}

export function detectSafeSupabaseGateScript(command: string): boolean {
  const lower = normalizeLower(command)
  return SUPABASE_COMMAND_GUARD_POLICY.allowedScriptEntrypoints.some((entrypoint) => lower.includes(entrypoint.toLowerCase()))
}

export function detectSafeFixedStringSearch(command: string): boolean {
  const text = normalizeCommand(command)
  return (
    /\brg\s+.*-F\b/.test(text) && /['"][^'"]*supabase[^'"]*['"]/i.test(text)
  ) || (
    /\bgrep\s+.*-F\b/.test(text) && /['"][^'"]*supabase[^'"]*['"]/i.test(text)
  )
}

export function detectGatedSupabaseCommand(command: string): SupabaseCommandPatternKind | undefined {
  const lower = normalizeLower(command)
  if (lower.includes('supabase db push') && lower.includes('--dry-run')) return 'gated_db_push_dry_run'
  if (lower.includes('supabase migration list')) return 'gated_migration_list'
  if (lower.includes('supabase link')) return 'gated_link'
  return undefined
}

export function detectForbiddenSupabaseCommand(command: string): SupabaseCommandPatternKind | undefined {
  if (containsPattern(command, 'supabase db pull')) return 'forbidden_db_pull'
  if (containsPattern(command, 'supabase db dump')) return 'forbidden_db_dump'
  if (containsPattern(command, 'supabase db query')) return 'forbidden_db_query'
  if (containsPattern(command, 'supabase migration repair')) return 'forbidden_migration_repair'
  if (containsPattern(command, 'supabase gen types --linked')) return 'forbidden_remote_typegen'
  if (containsPattern(command, 'supabase gen types --project-id')) return 'forbidden_remote_typegen'
  if (containsPattern(command, 'supabase db push')) return 'forbidden_db_push'
  return undefined
}

export function classifySupabaseCommandPattern(command: string): SupabaseCommandPatternKind {
  if (detectDangerousSupabaseCommandSubstitution(command)) return 'dangerous_command_substitution'
  if (detectSafeSupabaseGateScript(command)) return 'safe_local_gate_script'
  if (detectSafeFixedStringSearch(command)) return 'safe_fixed_string_search'
  const gated = detectGatedSupabaseCommand(command)
  if (gated) return gated
  const forbidden = detectForbiddenSupabaseCommand(command)
  if (forbidden) return forbidden
  if (includesSupabase(command)) return 'unknown_supabase_command'
  return 'safe_fixed_string_search'
}

export function createSupabaseCommandPatternSummary(command: string): string {
  return `Command pattern ${classifySupabaseCommandPattern(command)} for sanitized preview.`
}
