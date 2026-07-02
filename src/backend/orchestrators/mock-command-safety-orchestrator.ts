import type { CommandSafetyOrchestratorResult } from '../../types/command-safety'
import { createCommandSafetyReadableReport, createCommandSafetySummary } from '../command-safety/command-safety-summary-service'
import { SUPABASE_COMMAND_GUARD_POLICY } from '../command-safety/supabase-command-safety-policy'
import { validateCommandSafety } from '../command-safety/command-safety-validation-service'

function createResult(command: string): CommandSafetyOrchestratorResult {
  const validation = validateCommandSafety(command)
  return {
    policy: SUPABASE_COMMAND_GUARD_POLICY,
    validation,
    findings: validation.findings,
    summary: createCommandSafetySummary(validation),
    warnings: [
      ...validation.warnings,
      ...(!validation.ok ? ['RP-DB-03 remains blocked until owner gates and safe command plan are approved.'] : []),
    ],
    nextStep: validation.ok ? 'use_approved_gate_script' : 'rp_db_03_blocked',
  }
}

export function runMockCommandSafetyFlow(command = "rg -F 'supabase db push'"): CommandSafetyOrchestratorResult {
  return createResult(command)
}

export function runMockSupabaseCommandSafetyFlow(command = 'node scripts/inspect-supabase-remote-readonly.mjs'): CommandSafetyOrchestratorResult {
  return createResult(command)
}

export function runMockShellSearchSafetyFlow(command = 'rg `supabase db push`'): CommandSafetyOrchestratorResult {
  return createResult(command)
}

export function runMockForbiddenSupabaseCommandFlow(command = 'supabase db push'): CommandSafetyOrchestratorResult {
  return createResult(command)
}

export function runMockCommandOutputRedactionFlow(command = 'echo postgresql://user:pass@example.supabase.co/postgres'): CommandSafetyOrchestratorResult {
  return createResult(command)
}

export function runMockSupabaseCommandGuardPolicyFlow(): CommandSafetyOrchestratorResult {
  return createResult('node scripts/check-supabase-remote-gates.mjs')
}

export function runMockCommandSafetyReadinessFlow(): CommandSafetyOrchestratorResult {
  const result = createResult('supabase db push --dry-run --linked')
  return {
    ...result,
    summary: `${createCommandSafetyReadableReport(result.validation)}\nPolicy ready; remote execution remains blocked.`,
    nextStep: 'rp_db_03_blocked',
  }
}
