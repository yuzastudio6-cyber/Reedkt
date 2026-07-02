import type { SupabaseCommandGuardPolicy } from '../../types/command-safety'

export const SUPABASE_COMMAND_GUARD_POLICY: SupabaseCommandGuardPolicy = {
  id: 'rp-db-02s-supabase-command-guard-policy',
  allowedScriptEntrypoints: [
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
  ],
  forbiddenPatterns: [
    'supabase db push',
    'supabase db pull',
    'supabase db dump',
    'supabase db query',
    'supabase migration repair',
    'supabase gen types --linked',
    'supabase gen types --project-id',
    'remote SQL',
  ],
  gatedPatterns: [
    'supabase db push --dry-run',
    'supabase migration list',
    'supabase link',
  ],
  safeSearchExamples: [
    "rg -F 'supabase db push'",
    'rg -F "supabase db push"',
    "grep -R -F 'supabase db push' .",
  ],
  unsafeSearchExamples: [
    'rg `supabase db push`',
    'rg $(supabase db push)',
  ],
  defaultDecision: 'blocked_missing_gate',
  mockOnly: true,
}

export function listAllowedSupabaseScriptEntrypoints(): string[] {
  return [...SUPABASE_COMMAND_GUARD_POLICY.allowedScriptEntrypoints]
}

export function listForbiddenSupabaseCommandPatterns(): string[] {
  return [...SUPABASE_COMMAND_GUARD_POLICY.forbiddenPatterns]
}

export function listGatedSupabaseCommandPatterns(): string[] {
  return [...SUPABASE_COMMAND_GUARD_POLICY.gatedPatterns]
}

export function createSupabaseCommandGuardPolicySummary(policy = SUPABASE_COMMAND_GUARD_POLICY): string {
  return `${policy.id}: ${policy.allowedScriptEntrypoints.length} approved entrypoints, ${policy.forbiddenPatterns.length} forbidden patterns, ${policy.gatedPatterns.length} gated patterns, default=${policy.defaultDecision}.`
}
