import type { CommandSafetyDecision, CommandSafetyScenario } from '../../types/command-safety'

type ScenarioSeed = [string, string, string, CommandSafetyDecision, boolean]

const seeds: ScenarioSeed[] = [
  ['approved-gate-script', 'Approved gate script allowed', 'node scripts/check-supabase-remote-gates.mjs', 'allowed_local_safe', false],
  ['inspector-script', 'Inspector script allowed', 'node scripts/inspect-supabase-remote-readonly.mjs', 'allowed_local_safe', false],
  ['fixed-search-single', 'Fixed-string search with single quotes allowed', "rg -F 'supabase db push'", 'allowed_local_safe', false],
  ['fixed-search-double', 'Fixed-string search with double quotes allowed', 'rg -F "supabase db push"', 'allowed_local_safe', false],
  ['backtick-substitution', 'Backtick command substitution blocked', 'rg `supabase db push`', 'blocked_command_substitution_risk', true],
  ['db-push-blocked', 'Supabase db push blocked', 'supabase db push', 'blocked_forbidden_command', true],
  ['db-push-dry-run-gated', 'Supabase db push dry-run requires gate', 'supabase db push --dry-run --linked', 'requires_approved_wrapper', true],
  ['migration-list-gated', 'Supabase migration list requires gate', 'supabase migration list --linked', 'requires_approved_wrapper', true],
  ['link-gated', 'Supabase link requires gate', 'supabase link --project-ref abcdefghijkl', 'requires_approved_wrapper', true],
  ['db-pull-blocked', 'Supabase db pull blocked', 'supabase db pull', 'blocked_forbidden_command', true],
  ['db-dump-blocked', 'Supabase db dump blocked', 'supabase db dump', 'blocked_forbidden_command', true],
  ['db-query-blocked', 'Supabase db query blocked', 'supabase db query "select 1"', 'blocked_forbidden_command', true],
  ['migration-repair-blocked', 'Supabase migration repair blocked', 'supabase migration repair', 'blocked_forbidden_command', true],
  ['typegen-linked-blocked', 'Supabase linked typegen blocked', 'supabase gen types --linked', 'blocked_forbidden_command', true],
  ['typegen-project-blocked', 'Supabase project typegen blocked', 'supabase gen types --project-id abcdefghijkl', 'blocked_forbidden_command', true],
  ['unknown-supabase-blocked', 'Unknown Supabase command requires wrapper', 'supabase functions list', 'requires_approved_wrapper', true],
  ['project-ref-redaction', 'Command preview redacts project ref', 'supabase link --project-ref abcdefghijklmnop', 'requires_approved_wrapper', true],
  ['database-url-redaction', 'Command preview redacts database URL', 'echo postgresql://user:pass@example.supabase.co/postgres', 'allowed_local_safe', false],
  ['token-redaction', 'Command preview redacts token-like value', 'echo sbp_abcdefghijklmnopqrstuvwxyz012345', 'allowed_local_safe', false],
  ['secret-output-after-redaction', 'Secret output validation passes after redaction', 'echo [REDACTED_SECRET_LIKE_VALUE]', 'allowed_local_safe', false],
  ['secret-output-before-redaction', 'Secret output validation fails before redaction', 'echo secret=plain-text-token', 'blocked_secret_exposure_risk', true],
  ['no-remote-mutation', 'No remote mutation would run for guard', 'node scripts/supabase-command-guard.mjs -- "supabase db push"', 'allowed_local_safe', false],
  ['policy-summary', 'Guard policy summary readable', 'npm run check:supabase-remote-gates', 'allowed_local_safe', false],
  ['shell-summary', 'Shell safety summary readable', "grep -R -F 'supabase db push' .", 'allowed_local_safe', false],
  ['report-summary', 'Command safety report readable', 'npm run inspect:supabase-remote-readonly', 'allowed_local_safe', false],
  ['package-smoke-allowed', 'Package script scan allows smoke scripts', 'npm run smoke:supabase-remote-inspection', 'allowed_local_safe', false],
  ['package-gate-allowed', 'Package script scan allows gate checks', 'npm run check:supabase-remote-gates', 'allowed_local_safe', false],
  ['package-direct-push-blocked', 'Package script scan blocks direct db push', 'unsafe package script: supabase db push', 'blocked_forbidden_command', true],
  ['scripts-approved-inspector', 'Scripts directory scan allows approved inspectors', 'scripts/inspect-supabase-remote-readonly.mjs', 'allowed_local_safe', false],
  ['scripts-unguarded-warning', 'Scripts directory scan warns on unguarded command', 'node scripts/unsafe-direct-supabase.mjs would run supabase db push', 'blocked_forbidden_command', true],
  ['incident-report', 'Incident report captures command substitution caveat', 'rg `supabase db push`', 'blocked_command_substitution_risk', true],
  ['rp-db-03-blocked', 'RP-DB-03 remains blocked after hardening', 'supabase db push --dry-run', 'requires_approved_wrapper', true],
  ['no-secret-value-printed', 'No secret value printed', 'echo SUPABASE_ACCESS_TOKEN=present', 'allowed_local_safe', false],
  ['no-command-executed', 'No Supabase command executed', 'node scripts/supabase-command-guard.mjs -- "supabase db push"', 'allowed_local_safe', false],
  ['safe-examples-rg-f', 'Search examples include rg -F', "rg -F 'supabase migration list'", 'allowed_local_safe', false],
  ['unsafe-examples-backticks', 'Unsafe examples include backticks', 'rg `supabase migration list`', 'blocked_command_substitution_risk', true],
]

export const MOCK_COMMAND_SAFETY_SCENARIOS: CommandSafetyScenario[] = seeds.map((seed, index) => ({
  id: `command-safety-scenario-${String(index + 1).padStart(2, '0')}-${seed[0]}`,
  title: seed[1],
  input: seed[2],
  expectedDecision: seed[3],
  expectedBlocksExecution: seed[4],
  expectedRemoteMutationWouldRun: false,
  expectedSecretsPrinted: false,
  mockOnly: true,
}))

export function listMockCommandSafetyScenarios(): CommandSafetyScenario[] {
  return [...MOCK_COMMAND_SAFETY_SCENARIOS]
}

export function createMockCommandSafetyScenarioSummary(): string {
  return `${MOCK_COMMAND_SAFETY_SCENARIOS.length} command safety scenarios cover Supabase guard scripts, shell search safety, forbidden commands, redaction, and blocked RP-DB-03 readiness.`
}
