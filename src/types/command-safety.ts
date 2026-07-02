export type CommandSafetyDomain =
  | 'supabase'
  | 'shell_search'
  | 'secret_redaction'
  | 'generic'

export type CommandSafetyDecision =
  | 'allowed_local_safe'
  | 'blocked_forbidden_command'
  | 'blocked_missing_gate'
  | 'blocked_command_substitution_risk'
  | 'blocked_secret_exposure_risk'
  | 'requires_approved_wrapper'
  | 'warning'

export type SupabaseCommandPatternKind =
  | 'safe_local_gate_script'
  | 'safe_fixed_string_search'
  | 'dangerous_command_substitution'
  | 'forbidden_db_push'
  | 'forbidden_db_pull'
  | 'forbidden_db_dump'
  | 'forbidden_db_query'
  | 'forbidden_migration_repair'
  | 'forbidden_remote_typegen'
  | 'gated_db_push_dry_run'
  | 'gated_migration_list'
  | 'gated_link'
  | 'unknown_supabase_command'

export type CommandSafetySeverity =
  | 'info'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export interface CommandSafetyFinding {
  id: string
  domain: CommandSafetyDomain
  patternKind: SupabaseCommandPatternKind
  severity: CommandSafetySeverity
  title: string
  summary: string
  recommendation: string
  blocksExecution: boolean
  mockOnly: boolean
}

export interface CommandSafetyValidationResult {
  ok: boolean
  decision: CommandSafetyDecision
  findings: CommandSafetyFinding[]
  sanitizedCommandPreview: string
  remoteCommandWouldRun: false
  remoteMutationWouldRun: false
  secretsPrinted: false
  warnings: string[]
}

export interface SupabaseCommandGuardPolicy {
  id: string
  allowedScriptEntrypoints: string[]
  forbiddenPatterns: string[]
  gatedPatterns: string[]
  safeSearchExamples: string[]
  unsafeSearchExamples: string[]
  defaultDecision: 'blocked_missing_gate'
  mockOnly: boolean
}

export interface CommandSafetyScenario {
  id: string
  title: string
  input: string
  expectedDecision: CommandSafetyDecision
  expectedBlocksExecution: boolean
  expectedRemoteMutationWouldRun: false
  expectedSecretsPrinted: false
  mockOnly: true
}

export interface CommandSafetyOrchestratorResult {
  policy: SupabaseCommandGuardPolicy
  validation: CommandSafetyValidationResult
  findings: CommandSafetyFinding[]
  summary: string
  warnings: string[]
  nextStep: 'rp_db_03_blocked' | 'use_approved_gate_script' | 'manual_review'
}

export const REEDITPRO_SUPABASE_CLI_SAFETY_RULE =
  'Supabase CLI commands must go through approved gate scripts/guards and must not be invoked directly in shell searches or command substitution.'

export const REEDITPRO_SHELL_SEARCH_SAFETY_RULE =
  'Search for command text with fixed-string quoted searches such as rg -F, never shell backticks or command substitution.'

export const REEDITPRO_SUPABASE_NO_DIRECT_REMOTE_COMMAND_RULE =
  'Direct Supabase remote-capable commands remain blocked until explicit DB milestone gates authorize them.'
