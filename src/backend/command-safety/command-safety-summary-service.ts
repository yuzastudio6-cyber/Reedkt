import type { CommandSafetyValidationResult } from '../../types/command-safety'
import { SUPABASE_COMMAND_GUARD_POLICY, createSupabaseCommandGuardPolicySummary } from './supabase-command-safety-policy'

export function createCommandSafetySummary(result: CommandSafetyValidationResult): string {
  return `Command safety ${result.decision}; remoteCommandWouldRun=${result.remoteCommandWouldRun}; remoteMutationWouldRun=${result.remoteMutationWouldRun}; secretsPrinted=${result.secretsPrinted}.`
}

export function createCommandSafetyReadableReport(result: CommandSafetyValidationResult): string {
  const findingTitles = result.findings.map((finding) => finding.title).join(', ') || 'none'
  return [
    createCommandSafetySummary(result),
    `Sanitized preview: ${result.sanitizedCommandPreview}`,
    `Findings: ${findingTitles}`,
    'RP-DB-03 remains blocked until owner gates and safe command plan are approved.',
  ].join('\n')
}

export function createSupabaseCommandSafetyReadinessSummary(): string {
  return `${createSupabaseCommandGuardPolicySummary(SUPABASE_COMMAND_GUARD_POLICY)} Remote commands run=false; remote mutations run=false; secrets printed=false.`
}
