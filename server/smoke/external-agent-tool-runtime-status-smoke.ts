import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-runtime-status.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-runtime-status-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-runtime-status'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-runtime-status'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentRuntimeStatus'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['iam mutation command', /\bgcloud\s+projects\s+add-iam-policy-binding\b/i],
      ['runtime deploy command', /\bgcloud\s+run\s+deploy\b/i],
      ['cloud run job execute command', /\bgcloud\s+run\s+jobs\s+execute\b/i],
    ]

    for (const [name, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${name}`)
    }

    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nestedValue, `${prefix}.${key}`))
    }
  }

  return findings
}

for (const file of [
  CLI_PATH,
  SMOKE_PATH,
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'src/backend/mock/mock-external-agent-tool-execution-readiness-rollup.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-runtime-status.ts',
  'package runtime status script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-runtime-status-smoke.ts',
  'package runtime status smoke script mismatch',
)

const cliSource = read(CLI_PATH)
for (const required of [
  'external_agent_tool_runtime_status_report',
  'agentCallable',
  'runtimeExecutableNow',
  'safeEvidenceReviewExecutableNow',
  'safeEvidenceReviewToolIds',
  'accountSelectionGuidance',
  'accountIndexedCommands',
  'accountIndexed',
  'safePreflightCommand',
  'external-agent-tool-execute-qwen -- --preflight-only',
  'external-agent-tool-execute-broll-wan -- --preflight-only',
  'external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only',
  'soundEvidenceReview',
  'supabaseHarnessEvidenceReview',
  'runtimeSideEffects',
]) {
  assert.equal(cliSource.includes(required), true, `Runtime status CLI missing ${required}`)
}

for (const forbidden of [
  'gcloud projects add-iam-policy-binding',
  'gcloud run deploy',
  'gcloud run jobs execute',
  'compute instances create',
  'supabase ',
  'psql',
  'createdb',
  'dropdb',
  'from_pretrained',
  'WanPipeline',
  'torch.',
]) {
  assert.equal(cliSource.includes(forbidden), false, `Runtime status CLI must not include ${forbidden}`)
}

function runStatus(args: string[] = []) {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 24,
  })

  return JSON.parse(output)
}

const staticStatus = runStatus(['--static-only'])
assert.equal(staticStatus.ok, true)
assert.equal(staticStatus.mode, 'external_agent_tool_runtime_status_report')
assert.equal(staticStatus.decision, 'external_agent_tools_callable_static_status_only')
assert.equal(staticStatus.liveChecksRun, false)
assert.equal(staticStatus.paidProductionInScope, false)
assert.equal(staticStatus.dryRunPassedClaimed, false)
assert.equal(staticStatus.generatedLocalFixturePassedClaimed, false)
assert.equal(staticStatus.agentCallableToolCount, 4)
assert.deepEqual(staticStatus.agentCallableToolIds, [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.equal(staticStatus.readyForAnyExternalAgentRuntimeExecutionNow, false)
assert.deepEqual(staticStatus.runtimeExecutableToolIds, [])
assert.equal(staticStatus.safeEvidenceReviewToolCount, 2)
assert.deepEqual(staticStatus.safeEvidenceReviewToolIds, [
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.equal(staticStatus.readyForAnyExternalAgentSafeEvidenceReviewNow, true)
assert.equal(staticStatus.runtimeGatesAllFalse, true)
assert.equal(staticStatus.safeAgentCommands.liveStatus, 'npm run external-agent-tool-runtime-status')
assert.equal(staticStatus.safeAgentCommands.accountIndexed, undefined)
assert.equal(
  staticStatus.safeAgentCommands.brollInferencePreflight,
  'npm run external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only --json',
)
assert.equal(
  staticStatus.safeAgentCommands.soundEvidenceReview,
  'npm run external-agent-tool-execute-sound -- --execute --json',
)
assert.equal(
  staticStatus.safeAgentCommands.supabaseHarnessEvidenceReview,
  'npm run external-agent-tool-execute-supabase-harness -- --execute --json',
)
assert.equal(staticStatus.gcpAccessRepair.ok, true)
assert.equal(staticStatus.gcpAccessRepair.mode, 'external_agent_gcp_access_repair_plan_only')
assert.equal(staticStatus.gcpAccessRepair.projectId, 'reeditpro')
assert.equal(staticStatus.gcpAccessRepair.repairScope.doesNotGrantIam, true)
assert.equal(staticStatus.gcpAccessRepair.repairScope.doesNotMutateGcp, true)
assert.equal(staticStatus.gcpAccessRepair.repairScope.doesNotAuthorizeRuntimeExecution, true)
assert.equal(staticStatus.gcpAccessRepair.tools.length, 2)
assert.equal(
  staticStatus.gcpAccessRepair.failureResponsePolicy.ifReadAccessFails,
  'treat it as external GCP access or resource visibility work; do not weaken wrapper gates or mark runtime executable',
)
assert.equal(
  staticStatus.gcpAccessRepair.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index <redacted-index>',
  ),
  true,
)
assert.equal(
  staticStatus.gcpAccessRepair.tools.some(
    (tool: {
      toolId: string
      likelyMinimalRole: string
      failureMeaning: string
      unsafeBypasses: string[]
    }) =>
      tool.toolId === 'qwen2_5_vl_7b_instruct' &&
      tool.likelyMinimalRole === 'roles/run.viewer' &&
      tool.failureMeaning.includes('Token refresh can pass') &&
      tool.unsafeBypasses.includes('do not skip Cloud Run service/job describe checks'),
  ),
  true,
)
assert.equal(
  staticStatus.gcpAccessRepair.tools.some(
    (tool: {
      toolId: string
      likelyMinimalRole: string
      failureMeaning: string
      unsafeBypasses: string[]
    }) =>
      tool.toolId === 'ai_video_broll_generation_wan' &&
      tool.likelyMinimalRole === 'roles/compute.viewer' &&
      tool.failureMeaning.includes('cannot read project or regional Compute quota') &&
      tool.unsafeBypasses.includes('do not switch to an always-on GPU instance to bypass no-idle gating'),
  ),
  true,
)
for (const [flag, value] of Object.entries(staticStatus.gcpAccessRepair.runtimeSideEffects)) {
  assert.equal(value, false, `GCP repair side-effect flag must remain false: ${flag}`)
}
assert.equal(
  staticStatus.accountSelectionGuidance.diagnosticCommand,
  'npm run external-agent-gcloud-account-access:diagnostic',
)
assert.equal(staticStatus.accountSelectionGuidance.overrideIndexEnv, 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX')
assert.equal(staticStatus.accountSelectionGuidance.overrideEnv, 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT')
assert.equal(staticStatus.accountSelectionGuidance.cliAccountIndexFlag, '--account-index <account-index>')
assert.equal(
  staticStatus.accountSelectionGuidance.cliGcloudAccountIndexFlagAlias,
  '--gcloud-account-index <account-index>',
)
assert.equal(staticStatus.accountSelectionGuidance.cliAccountIndexProvided, false)
assert.equal(staticStatus.accountSelectionGuidance.cliAccountIndexValid, false)
assert.equal(
  staticStatus.accountSelectionGuidance.indexedRuntimeStatusCommand,
  'npm run external-agent-tool-runtime-status -- --account-index <account-index>',
)
assert.equal(
  staticStatus.accountSelectionGuidance.indexedPreflightCommand,
  'npm run external-agent-tool-blockers:preflight -- --account-index <account-index>',
)
assert.equal(
  staticStatus.accountSelectionGuidance.indexedAccessVerifyCommand,
  'npm run external-agent-gcp-access:verify -- --account-index <account-index>',
)
assert.equal(staticStatus.accountSelectionGuidance.mutatesLocalGcloudConfig, false)
assert.equal(staticStatus.accountSelectionGuidance.printsAccountValue, false)
assert.equal(staticStatus.accountSelectionGuidance.tokenStdoutSuppressed, true)
assert.equal(staticStatus.accountSelectionGuidance.liveAccountDiagnosticsRun, false)
assert.equal(staticStatus.tools.length, 4)

const indexedStaticStatus = runStatus(['--static-only', '--account-index', '2'])
assert.equal(indexedStaticStatus.ok, true)
assert.equal(indexedStaticStatus.accountSelectionGuidance.cliAccountIndexProvided, true)
assert.equal(indexedStaticStatus.accountSelectionGuidance.cliAccountIndex, 2)
assert.equal(indexedStaticStatus.accountSelectionGuidance.cliAccountIndexValid, true)
assert.equal(indexedStaticStatus.accountSelectionGuidance.cliAccountIndexMapsToChildEnv, true)
assert.equal(indexedStaticStatus.accountSelectionGuidance.printsAccountValue, false)
assert.equal(indexedStaticStatus.accountSelectionGuidance.mutatesLocalGcloudConfig, false)
assert.equal(
  indexedStaticStatus.gcpAccessRepair.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index 2',
  ),
  true,
)
assert.equal(
  indexedStaticStatus.gcpAccessRepair.postRepairVerificationCommands.includes(
    'npm run external-agent-gcp-access:verify -- --account-index 2',
  ),
  true,
)
assert.equal(
  indexedStaticStatus.gcpAccessRepair.tools.every((tool: { verificationCommand: string }) =>
    tool.verificationCommand.endsWith('--account-index 2'),
  ),
  true,
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.liveStatus,
  'npm run external-agent-tool-runtime-status -- --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.liveGate,
  'npm run external-agent-tool-execution-gate -- --live --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.nextCommand,
  'npm run external-agent-tool-next-command -- --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.blockerPreflight,
  'npm run external-agent-tool-blockers:preflight -- --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.gcpAccessVerify,
  'npm run external-agent-gcp-access:verify -- --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.qwenPreflight,
  'npm run external-agent-tool-execute-qwen -- --preflight-only --json --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.brollPreflight,
  'npm run external-agent-tool-execute-broll-wan -- --preflight-only --json --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.brollInferencePreflight,
  'npm run external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only --json --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.soundEvidenceReview,
  'npm run external-agent-tool-execute-sound -- --execute --json --account-index 2',
)
assert.equal(
  indexedStaticStatus.safeAgentCommands.accountIndexed.supabaseHarnessEvidenceReview,
  'npm run external-agent-tool-execute-supabase-harness -- --execute --json --account-index 2',
)

const invalidIndexedStaticStatus = runStatus(['--static-only', '--account-index', 'nope'])
assert.equal(invalidIndexedStaticStatus.ok, true)
assert.equal(invalidIndexedStaticStatus.accountSelectionGuidance.cliAccountIndexProvided, true)
assert.equal(invalidIndexedStaticStatus.accountSelectionGuidance.cliAccountIndexValid, false)
assert.equal(invalidIndexedStaticStatus.accountSelectionGuidance.cliAccountIndexMapsToChildEnv, false)

const staticToolsById = new Map(staticStatus.tools.map((tool: { toolId: string }) => [tool.toolId, tool]))
for (const tool of staticStatus.tools as Array<{
  toolId: string
  agentCallable: boolean
  runtimeExecutableNow: boolean
  safeEvidenceReviewExecutableNow: boolean
  executionAllowedNow: boolean
  wrapperStaticGuardCommand: string
  executionCommand: string
  confirmationEnv: string
}>) {
  assert.equal(tool.agentCallable, true, `${tool.toolId} should be agent-callable`)
  assert.equal(tool.runtimeExecutableNow, false, `${tool.toolId} should not be runtime-executable in static mode`)
  assert.equal(tool.executionAllowedNow, false, `${tool.toolId} should not execute from static mode`)
  assert.equal(
    tool.safeEvidenceReviewExecutableNow,
    tool.toolId === 'sound_music_audio' || tool.toolId === 'supabase_local_fixture_harness',
    `${tool.toolId} safe evidence review flag mismatch`,
  )
  assert.equal(typeof tool.wrapperStaticGuardCommand, 'string')
  assert.equal(typeof tool.executionCommand, 'string')
  assert.equal(typeof tool.confirmationEnv, 'string')
}

assert.equal(
  (staticToolsById.get('qwen2_5_vl_7b_instruct') as { safePreflightCommand: string }).safePreflightCommand,
  'npm run external-agent-tool-execute-qwen -- --preflight-only --json',
)
assert.equal(
  (staticToolsById.get('qwen2_5_vl_7b_instruct') as { accountIndexedCommands?: unknown })
    .accountIndexedCommands,
  undefined,
)
assert.equal(
  (staticToolsById.get('ai_video_broll_generation_wan') as { safePreflightCommand: string }).safePreflightCommand,
  'npm run external-agent-tool-execute-broll-wan -- --preflight-only --json',
)
assert.equal(
  (staticToolsById.get('sound_music_audio') as { supportingEvidenceOnly: boolean }).supportingEvidenceOnly,
  true,
)
assert.equal(
  (staticToolsById.get('sound_music_audio') as { safeEvidenceReviewExecutableNow: boolean })
    .safeEvidenceReviewExecutableNow,
  true,
)
assert.equal(
  (staticToolsById.get('supabase_local_fixture_harness') as { supportingEvidenceOnly: boolean })
    .supportingEvidenceOnly,
  true,
)
assert.equal(
  (staticToolsById.get('supabase_local_fixture_harness') as { safeEvidenceReviewExecutableNow: boolean })
    .safeEvidenceReviewExecutableNow,
  true,
)

const indexedStaticToolsById = new Map(
  indexedStaticStatus.tools.map((tool: { toolId: string }) => [tool.toolId, tool]),
)
assert.equal(
  (
    indexedStaticToolsById.get('qwen2_5_vl_7b_instruct') as {
      accountIndexedCommands: { safePreflightCommand: string; executionCommand: string }
    }
  ).accountIndexedCommands.safePreflightCommand,
  'npm run external-agent-tool-execute-qwen -- --preflight-only --json --account-index 2',
)
assert.equal(
  (
    indexedStaticToolsById.get('qwen2_5_vl_7b_instruct') as {
      accountIndexedCommands: { safePreflightCommand: string; executionCommand: string }
    }
  ).accountIndexedCommands.executionCommand,
  'npm run external-agent-tool-execute-qwen -- --execute --json --account-index 2',
)
assert.equal(
  (
    indexedStaticToolsById.get('ai_video_broll_generation_wan') as {
      accountIndexedCommands: { safePreflightCommand: string; executionCommand: string }
    }
  ).accountIndexedCommands.safePreflightCommand,
  'npm run external-agent-tool-execute-broll-wan -- --preflight-only --json --account-index 2',
)
assert.equal(
  (
    indexedStaticToolsById.get('sound_music_audio') as {
      accountIndexedCommands: { wrapperStaticGuardCommand: string; executionCommand: string }
    }
  ).accountIndexedCommands.executionCommand,
  'npm run external-agent-tool-execute-sound -- --execute --json --account-index 2',
)

const liveStatus = runStatus()
assert.equal(liveStatus.ok, true)
assert.equal(liveStatus.mode, 'external_agent_tool_runtime_status_report')
assert.equal(liveStatus.liveChecksRun, true)
assert.equal(typeof liveStatus.decision, 'string')
assert.equal(typeof liveStatus.readyForAnyExternalAgentRuntimeExecutionNow, 'boolean')
assert.equal(Array.isArray(liveStatus.runtimeExecutableToolIds), true)
assert.equal(liveStatus.agentCallableToolCount, 4)
assert.equal(liveStatus.safeEvidenceReviewToolCount, 2)
assert.deepEqual(liveStatus.safeEvidenceReviewToolIds, [
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.equal(liveStatus.readyForAnyExternalAgentSafeEvidenceReviewNow, true)
assert.equal(liveStatus.runtimeGatesAllFalse, true)
assert.equal(typeof liveStatus.liveGate.ok, 'boolean')
assert.equal(typeof liveStatus.liveGate.executionAllowedNow, 'boolean')
assert.equal(liveStatus.accountSelectionGuidance.liveAccountDiagnosticsRun, true)
assert.equal(typeof liveStatus.accountSelectionGuidance.visibleAccountCount, 'number')
assert.equal(Array.isArray(liveStatus.accountSelectionGuidance.visibleAccounts), true)
assert.equal(Array.isArray(liveStatus.accountSelectionGuidance.tokenRefreshPassedAccountIndexes), true)
assert.equal(Array.isArray(liveStatus.accountSelectionGuidance.readyAccountIndexes), true)
if (
  liveStatus.accountSelectionGuidance.tokenRefreshPassedAccountIndexes.length > 0 &&
  liveStatus.accountSelectionGuidance.readyAccountIndexes.length === 0
) {
  assert.equal(
    liveStatus.recommendedNextPrompt.includes('Cloud Run and Compute quota read access'),
    true,
    'status should point at GCP read-access repair when a visible account can refresh but no account is ready',
  )
  assert.equal(
    liveStatus.recommendedNextPrompt.includes('refresh the active local gcloud account/configuration'),
    false,
    'status should not point at active-account refresh when another visible account already refreshes',
  )
}
for (const account of liveStatus.accountSelectionGuidance.visibleAccounts as Array<{
  accountIndex: number
  active: boolean
  tokenRefreshPassed: boolean
  qwenReadAccessPassed: boolean
  brollQuotaReadAccessPassed: boolean
  brollQuotaSufficient: boolean
  blockers: Record<string, string>
}>) {
  assert.equal(typeof account.accountIndex, 'number')
  assert.equal(typeof account.active, 'boolean')
  assert.equal(typeof account.tokenRefreshPassed, 'boolean')
  assert.equal(typeof account.qwenReadAccessPassed, 'boolean')
  assert.equal(typeof account.brollQuotaReadAccessPassed, 'boolean')
  assert.equal(typeof account.brollQuotaSufficient, 'boolean')
  assert.equal(typeof account.blockers, 'object')
}
assert.equal(liveStatus.gcpAccessRepair.ok, true)
assert.equal(
  liveStatus.gcpAccessRepair.failureResponsePolicy.ifReadAccessFails,
  'treat it as external GCP access or resource visibility work; do not weaken wrapper gates or mark runtime executable',
)
assert.equal(
  liveStatus.gcpAccessRepair.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index <redacted-index>',
  ),
  true,
)
assert.equal(Array.isArray(liveStatus.gcpAccessRepair.postRepairVerificationCommands), true)
assert.equal(
  liveStatus.gcpAccessRepair.postRepairVerificationCommands.includes(
    'npm run external-agent-gcp-access:verify -- --account-index <redacted-index>',
  ),
  true,
)
for (const [flag, value] of Object.entries(liveStatus.gcpAccessRepair.runtimeSideEffects)) {
  assert.equal(value, false, `Live GCP repair side-effect flag must remain false: ${flag}`)
}
assert.equal(typeof liveStatus.nextCommand.ok, 'boolean')
assert.equal(typeof liveStatus.nextCommand.chosenNextCommand === 'string' || liveStatus.nextCommand.chosenNextCommand === null, true)
assert.equal(typeof liveStatus.recommendedNextPrompt, 'string')

const indexedLiveStatus = runStatus(['--account-index', '2'])
assert.equal(indexedLiveStatus.ok, true)
assert.equal(indexedLiveStatus.liveChecksRun, true)
assert.equal(indexedLiveStatus.accountSelectionGuidance.cliAccountIndexProvided, true)
assert.equal(indexedLiveStatus.accountSelectionGuidance.cliAccountIndex, 2)
assert.equal(indexedLiveStatus.accountSelectionGuidance.cliAccountIndexValid, true)
assert.equal(indexedLiveStatus.accountSelectionGuidance.cliAccountIndexMapsToChildEnv, true)
assert.equal(
  indexedLiveStatus.gcpAccessRepair.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index 2',
  ),
  true,
)
assert.equal(
  indexedLiveStatus.gcpAccessRepair.postRepairVerificationCommands.includes(
    'npm run external-agent-gcp-access:verify -- --account-index 2',
  ),
  true,
)
assert.equal(
  indexedLiveStatus.gcpAccessRepair.tools.every((tool: { verificationCommand: string }) =>
    tool.verificationCommand.endsWith('--account-index 2'),
  ),
  true,
)

for (const [flag, value] of Object.entries(liveStatus.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must remain false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ staticStatus, liveStatus, indexedLiveStatus })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: liveStatus.mode,
      staticDecision: staticStatus.decision,
      liveDecision: liveStatus.decision,
      agentCallableToolIds: liveStatus.agentCallableToolIds,
      runtimeExecutableToolIds: liveStatus.runtimeExecutableToolIds,
      readyForAnyExternalAgentRuntimeExecutionNow:
        liveStatus.readyForAnyExternalAgentRuntimeExecutionNow,
      liveChecksRun: liveStatus.liveChecksRun,
      runtimeGatesAllFalse: liveStatus.runtimeGatesAllFalse,
      recommendedNextPrompt: liveStatus.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
