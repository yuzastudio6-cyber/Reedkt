import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  createCommandOutputRedactionSummary,
  createCommandSafetyReadableReport,
  createMockCommandSafetyScenarioSummary,
  createSafeFixedStringSearchExample,
  createShellSearchSafetySummary,
  createSupabaseCommandGuardPolicySummary,
  detectDangerousSupabaseCommandSubstitution,
  listAllowedSupabaseScriptEntrypoints,
  listForbiddenSupabaseCommandPatterns,
  listGatedSupabaseCommandPatterns,
  listMockCommandSafetyScenarios,
  redactCommandSafetySecretLikeValues,
  runMockCommandSafetyReadinessFlow,
  runMockForbiddenSupabaseCommandFlow,
  runMockShellSearchSafetyFlow,
  validateCommandSafety,
  validateNoCommandSafetySecretsPrinted,
  validateNoRemoteMutationWouldRun,
} from '../../src/backend'

const repoRoot = process.cwd()

function parseJsonCommand(args: string[], env: NodeJS.ProcessEnv = process.env): Record<string, unknown> {
  return JSON.parse(execFileSync('node', args, {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
  }))
}

function assertNoSideEffects(result: {
  remoteCommandWouldRun?: unknown
  remoteMutationWouldRun?: unknown
  remoteCommandsRun?: unknown
  remoteMutationsRun?: unknown
  remoteSQLRun?: unknown
  remoteTypegenRun?: unknown
  remoteSQLWouldRun?: unknown
  remoteTypegenWouldRun?: unknown
  secretsPrinted?: unknown
}): void {
  for (const key of [
    'remoteCommandWouldRun',
    'remoteMutationWouldRun',
    'remoteCommandsRun',
    'remoteMutationsRun',
    'remoteSQLRun',
    'remoteTypegenRun',
    'remoteSQLWouldRun',
    'remoteTypegenWouldRun',
    'secretsPrinted',
  ] as const) {
    if (key in result) assert.equal(result[key], false, `${key} must be false`)
  }
}

const approvedGate = validateCommandSafety('node scripts/check-supabase-remote-gates.mjs')
assert.equal(approvedGate.decision, 'allowed_local_safe')
assert.equal(approvedGate.ok, true)
assertNoSideEffects(approvedGate)

const inspectorGate = validateCommandSafety('node scripts/inspect-supabase-remote-readonly.mjs')
assert.equal(inspectorGate.decision, 'allowed_local_safe')

const safeSearchSingle = validateCommandSafety("rg -F 'supabase db push'")
assert.equal(safeSearchSingle.decision, 'allowed_local_safe')

const safeSearchDouble = validateCommandSafety('rg -F "supabase db push"')
assert.equal(safeSearchDouble.decision, 'allowed_local_safe')

const backtickSearch = validateCommandSafety('rg `supabase db push`')
assert.equal(backtickSearch.decision, 'blocked_command_substitution_risk')
assert.equal(detectDangerousSupabaseCommandSubstitution('rg `supabase db push`'), true)

const commandSubstitution = validateCommandSafety('rg $(supabase db push)')
assert.equal(commandSubstitution.decision, 'blocked_command_substitution_risk')

for (const command of [
  'supabase db push',
  'supabase db pull',
  'supabase db dump',
  'supabase db query "select 1"',
  'supabase migration repair',
  'supabase gen types --linked',
  'supabase gen types --project-id abcdefghijkl',
]) {
  const result = validateCommandSafety(command)
  assert.equal(result.decision, 'blocked_forbidden_command', `${command} should be forbidden`)
  assertNoSideEffects(result)
}

for (const command of [
  'supabase db push --dry-run --linked',
  'supabase migration list --linked',
  'supabase link --project-ref abcdefghijkl',
]) {
  const result = validateCommandSafety(command)
  assert.equal(result.decision, 'requires_approved_wrapper', `${command} should require approved wrapper`)
  assertNoSideEffects(result)
}

const secretEnv = { ...process.env, SUPABASE_ACCESS_TOKEN: 'plain-text-token' }
const secretResult = validateCommandSafety('echo plain-text-token', secretEnv)
assert.equal(secretResult.decision, 'blocked_secret_exposure_risk')
assert.equal(secretResult.sanitizedCommandPreview.includes('plain-text-token'), false)
assert.equal(validateNoCommandSafetySecretsPrinted(secretResult.sanitizedCommandPreview, secretEnv), true)

const redacted = redactCommandSafetySecretLikeValues('supabase link --project-ref abcdefghijklmnop postgresql://user:pass@example.supabase.co/postgres')
assert.equal(redacted.includes('abcdefghijklmnop'), false)
assert.equal(redacted.includes('postgresql://'), false)

const guardBlocked = parseJsonCommand(['scripts/supabase-command-guard.mjs', '--', 'supabase db push'])
assert.equal(guardBlocked.decision, 'blocked_forbidden_command')
assertNoSideEffects(guardBlocked)

const guardSafe = parseJsonCommand(['scripts/supabase-command-guard.mjs', '--', "rg -F 'supabase db push'"])
assert.equal(guardSafe.decision, 'allowed_local_safe')
assertNoSideEffects(guardSafe)

const staticCheck = parseJsonCommand(['scripts/check-supabase-command-safety.mjs'])
assert.equal(staticCheck.ok, true)
assertNoSideEffects(staticCheck)

const scenarios = listMockCommandSafetyScenarios()
assert.ok(scenarios.length >= 34, 'at least 34 command safety scenarios should exist')
for (const scenario of scenarios) {
  const env = scenario.id.includes('secret-output-before-redaction') ? secretEnv : process.env
  const result = validateCommandSafety(scenario.input, env)
  assert.equal(result.decision, scenario.expectedDecision, scenario.id)
  assert.equal(result.findings.some((finding) => finding.blocksExecution), scenario.expectedBlocksExecution, scenario.id)
  assert.equal(result.remoteMutationWouldRun, scenario.expectedRemoteMutationWouldRun, scenario.id)
  assert.equal(result.secretsPrinted, scenario.expectedSecretsPrinted, scenario.id)
}

const forbiddenFlow = runMockForbiddenSupabaseCommandFlow()
assert.equal(forbiddenFlow.validation.decision, 'blocked_forbidden_command')
assert.equal(forbiddenFlow.nextStep, 'rp_db_03_blocked')

const shellFlow = runMockShellSearchSafetyFlow()
assert.equal(shellFlow.validation.decision, 'blocked_command_substitution_risk')

const readinessFlow = runMockCommandSafetyReadinessFlow()
assert.equal(readinessFlow.nextStep, 'rp_db_03_blocked')

assert.ok(listAllowedSupabaseScriptEntrypoints().length >= 4)
assert.ok(listForbiddenSupabaseCommandPatterns().includes('supabase db push'))
assert.ok(listGatedSupabaseCommandPatterns().includes('supabase db push --dry-run'))
assert.ok(createSafeFixedStringSearchExample().includes('rg -F'))
assert.ok(createShellSearchSafetySummary("rg -F 'supabase db push'").includes('Allowed'))
assert.ok(createCommandOutputRedactionSummary('token=plain-text-token', secretEnv).includes('safe=true'))
assert.ok(createSupabaseCommandGuardPolicySummary().includes('approved entrypoints'))
assert.ok(createMockCommandSafetyScenarioSummary().includes('command safety scenarios'))
assert.ok(createCommandSafetyReadableReport(backtickSearch).includes('RP-DB-03 remains blocked'))
assert.equal(validateNoRemoteMutationWouldRun(backtickSearch), true)

console.log(JSON.stringify({
  ok: true,
  scenarios: scenarios.length,
  approvedGateDecision: approvedGate.decision,
  backtickDecision: backtickSearch.decision,
  forbiddenDecision: guardBlocked.decision,
  safeSearchDecision: guardSafe.decision,
  staticCheckOk: staticCheck.ok,
  remoteCommandsRun: false,
  remoteMutationsRun: false,
  remoteSQLRun: false,
  remoteTypegenRun: false,
  secretsPrinted: false,
  rpDb03Blocked: true,
}, null, 2))
