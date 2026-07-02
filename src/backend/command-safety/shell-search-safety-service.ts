import type { CommandSafetyValidationResult } from '../../types/command-safety'
import { validateCommandSafety } from './command-safety-validation-service'
import { detectDangerousSupabaseCommandSubstitution, detectSafeFixedStringSearch } from './supabase-command-pattern-service'

export function detectShellCommandSubstitutionRisk(command: string): boolean {
  return detectDangerousSupabaseCommandSubstitution(command)
}

export function createSafeFixedStringSearchExample(searchText = 'supabase db push'): string {
  return `rg -F '${searchText}'`
}

export function createUnsafeBacktickSearchWarning(searchText = 'supabase db push'): string {
  return `Do not run rg \`${searchText}\`; shell backticks execute the text before rg sees it.`
}

export function validateShellSearchCommandSafety(command: string): CommandSafetyValidationResult {
  return validateCommandSafety(command)
}

export function createShellSearchSafetySummary(command: string): string {
  if (detectShellCommandSubstitutionRisk(command)) return 'Blocked: shell command substitution risk detected.'
  if (detectSafeFixedStringSearch(command)) return 'Allowed: quoted fixed-string search preview.'
  return 'Warning: use rg -F with quoted fixed-string text for command searches.'
}
