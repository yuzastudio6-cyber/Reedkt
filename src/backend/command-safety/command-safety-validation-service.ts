import type {
  CommandSafetyDecision,
  CommandSafetyFinding,
  CommandSafetyValidationResult,
  SupabaseCommandPatternKind,
} from '../../types/command-safety'
import { redactCommandSafetySecretLikeValues, validateNoCommandSafetySecretsPrinted } from './command-output-redaction-service'
import { classifySupabaseCommandPattern, detectSafeSupabaseGateScript } from './supabase-command-pattern-service'

const BLOCKED_KINDS: Partial<Record<SupabaseCommandPatternKind, CommandSafetyDecision>> = {
  dangerous_command_substitution: 'blocked_command_substitution_risk',
  forbidden_db_push: 'blocked_forbidden_command',
  forbidden_db_pull: 'blocked_forbidden_command',
  forbidden_db_dump: 'blocked_forbidden_command',
  forbidden_db_query: 'blocked_forbidden_command',
  forbidden_migration_repair: 'blocked_forbidden_command',
  forbidden_remote_typegen: 'blocked_forbidden_command',
  gated_db_push_dry_run: 'requires_approved_wrapper',
  gated_migration_list: 'requires_approved_wrapper',
  gated_link: 'requires_approved_wrapper',
  unknown_supabase_command: 'requires_approved_wrapper',
}

function findingFor(kind: SupabaseCommandPatternKind, command: string): CommandSafetyFinding {
  const blockedDecision = BLOCKED_KINDS[kind]
  const blocksExecution = Boolean(blockedDecision)
  const severity = kind === 'dangerous_command_substitution'
    ? 'critical'
    : kind.startsWith('forbidden')
      ? 'critical'
      : kind.startsWith('gated') || kind === 'unknown_supabase_command'
        ? 'high'
        : 'info'
  return {
    id: `command-safety-${kind}`,
    domain: kind === 'safe_fixed_string_search' || kind === 'dangerous_command_substitution' ? 'shell_search' : 'supabase',
    patternKind: kind,
    severity,
    title: kind.replaceAll('_', ' '),
    summary: blocksExecution
      ? `Blocked or gated command preview: ${redactCommandSafetySecretLikeValues(command)}`
      : `Safe local command preview: ${redactCommandSafetySecretLikeValues(command)}`,
    recommendation: kind === 'safe_fixed_string_search'
      ? 'Use quoted fixed-string search and avoid shell backticks.'
      : kind === 'safe_local_gate_script'
        ? 'Continue using approved local gate scripts only.'
        : 'Use an approved RP-DB gate script or keep the command blocked until a future milestone explicitly enables it.',
    blocksExecution,
    mockOnly: true,
  }
}

function decisionFor(kind: SupabaseCommandPatternKind): CommandSafetyDecision {
  if (kind === 'safe_local_gate_script' || kind === 'safe_fixed_string_search') return 'allowed_local_safe'
  return BLOCKED_KINDS[kind] ?? 'warning'
}

export function validateSupabaseCommandSafety(command: string, env: Record<string, string | undefined> = {}): CommandSafetyValidationResult {
  const kind = classifySupabaseCommandPattern(command)
  const sanitizedCommandPreview = redactCommandSafetySecretLikeValues(command, env)
  const secretSafeBeforeRedaction = validateNoCommandSafetySecretsPrinted(command, env)
  const secretSafeAfterRedaction = validateNoCommandSafetySecretsPrinted(sanitizedCommandPreview, env)
  const secretFinding: CommandSafetyFinding[] = secretSafeBeforeRedaction && secretSafeAfterRedaction
    ? []
    : [{
      id: 'command-safety-secret-exposure-risk',
      domain: 'secret_redaction',
      patternKind: kind,
      severity: 'critical',
      title: 'secret exposure risk',
      summary: 'A secret-like value appeared in the command preview before redaction.',
      recommendation: 'Do not print command values; report presence booleans and sanitized previews only.',
      blocksExecution: true,
      mockOnly: true,
    }]
  const findings = [findingFor(kind, command), ...secretFinding]
  const decision = secretSafeBeforeRedaction && secretSafeAfterRedaction ? decisionFor(kind) : 'blocked_secret_exposure_risk'
  return {
    ok: decision === 'allowed_local_safe',
    decision,
    findings,
    sanitizedCommandPreview,
    remoteCommandWouldRun: false,
    remoteMutationWouldRun: false,
    secretsPrinted: false,
    warnings: findings.filter((finding) => finding.blocksExecution).map((finding) => finding.recommendation),
  }
}

export function validateCommandSafety(command: string, env: Record<string, string | undefined> = {}): CommandSafetyValidationResult {
  return validateSupabaseCommandSafety(command, env)
}

export function validateShellSearchSafety(command: string): CommandSafetyValidationResult {
  return validateCommandSafety(command)
}

export function validateApprovedSupabaseEntrypoint(command: string): CommandSafetyValidationResult {
  return validateCommandSafety(command)
}

export function validateNoRemoteMutationWouldRun(result: CommandSafetyValidationResult): boolean {
  return result.remoteCommandWouldRun === false && result.remoteMutationWouldRun === false
}

export function createCommandSafetyValidationSummary(result: CommandSafetyValidationResult): string {
  return `Command safety decision=${result.decision}; ok=${result.ok}; findings=${result.findings.length}; remoteMutationWouldRun=${result.remoteMutationWouldRun}; secretsPrinted=${result.secretsPrinted}.`
}

export function isApprovedSupabaseGateEntrypoint(command: string): boolean {
  return detectSafeSupabaseGateScript(command)
}
