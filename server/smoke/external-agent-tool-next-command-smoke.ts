import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

const ROOT = process.cwd()
const SPEC_PATH = 'src/backend/mock/mock-external-agent-tool-next-command.ts'
const CLI_PATH = 'server/cli/external-agent-tool-next-command.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-next-command-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-next-command'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-next-command'
const QWEN_NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-FIX: tighten Qwen fixture structured-output generation after schema-invalid bounded retry, no generated assets/no mutation'
const QWEN_AUTH_NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'nextCommand'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
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

for (const file of [SPEC_PATH, CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-next-command.ts',
  'package next command script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-next-command-smoke.ts',
  'package next command smoke script mismatch',
)

const spec = EXTERNAL_AGENT_TOOL_NEXT_COMMAND
assert.equal(spec.decision, 'external_agent_live_next_command_read_only_decision_defined')
assert.equal(spec.mode, 'read_only_external_agent_tool_next_command_decision')
assert.equal(spec.paidProductionInScope, false)
assert.equal(spec.dryRunPassedClaimed, false)
assert.equal(spec.generatedLocalFixturePassedClaimed, false)
assert.equal(spec.allowedProbeScripts.length, 3)
assert.equal(
  spec.nextCommandRules.whenStaticGateAllowsButQwenLivePreflightFails,
  'npm run external-agent-tool-blockers:preflight',
)
assert.equal(
  spec.nextCommandRules.whenQwenLivePreflightPassesButExecutionGateBlocked,
  QWEN_NEXT_PROMPT,
)

for (const probe of spec.allowedProbeScripts) {
  assert.equal(probe.mutatesRuntime, false, `${probe.id} must not mutate runtime`)
  assert.equal(probe.runsModel, false, `${probe.id} must not run models`)
  assert.equal(probe.createsAssets, false, `${probe.id} must not create assets`)
}

const cliSource = read(CLI_PATH)
assert.equal(cliSource.includes('spawnSync'), true)
for (const forbidden of [
  'gcloud ',
  'docker ',
  'psql',
  'run deploy',
  'jobs execute',
  'instances create',
  'from_pretrained',
  'torch.',
]) {
  assert.equal(cliSource.includes(forbidden), false, `Next command CLI must not contain runtime marker: ${forbidden}`)
}

const output = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 8,
})
const decision = JSON.parse(output)
assert.equal(decision.ok, true)
assert.equal(decision.mode, spec.mode)
assert.equal(decision.liveReadOnlyChecksRun, true)
assert.equal(decision.staticExecutionGateAllowed, decision.executionGateAllowsRuntime)
assert.equal(typeof decision.staticExplicitToolGateReady, 'boolean')
assert.equal(decision.staticExplicitToolGatePrepared, decision.staticExplicitToolGateReady)
assert.equal(
  decision.staticGatePlanningOnly,
  decision.staticExplicitToolGateReady && !decision.executionGateAllowsRuntime,
)
assert.equal(decision.staticGateDoesNotAuthorizeRuntime, !decision.executionGateAllowsRuntime)
assert.equal(typeof decision.executionGateAllowsRuntime, 'boolean')
assert.equal(Array.isArray(decision.executionGateToolSummaries), true)
assert.equal(decision.executionGateToolSummaries.length, 4)
const gateToolSummaries = new Map(
  decision.executionGateToolSummaries.map((row: { toolId: string }) => [row.toolId, row]),
)
const qwenGateSummary = gateToolSummaries.get('qwen2_5_vl_7b_instruct') as {
  executionAllowedNow: boolean
  staticExplicitToolGateReady: boolean
  currentBlocker: string
  safeNextCommand: string
  manualBlockerActions: Array<{
    id: string
    runInsideCodex: boolean
    mutatesRuntime: boolean
    runsModel: boolean
    createsAssets: boolean
    mutatesCloud: boolean
    mutatesLocalGcloudAuth: boolean
    mutatesLocalGcloudConfig: boolean
    changesQuotaRequest: boolean
    afterCompletionCommand: string
  }>
}
assert.equal(qwenGateSummary.executionAllowedNow, false)
assert.equal(qwenGateSummary.staticExplicitToolGateReady, false)
assert.equal(qwenGateSummary.currentBlocker, 'structured_metadata_schema_invalid_after_bounded_58dw_retry')
assert.equal(qwenGateSummary.safeNextCommand, QWEN_NEXT_PROMPT)
assert.equal(qwenGateSummary.manualBlockerActions.length, 2)
assert.equal(qwenGateSummary.manualBlockerActions.every((action) => action.runInsideCodex === false), true)
assert.equal(qwenGateSummary.manualBlockerActions.every((action) => action.mutatesRuntime === false), true)
assert.equal(qwenGateSummary.manualBlockerActions.every((action) => action.runsModel === false), true)
assert.equal(qwenGateSummary.manualBlockerActions.every((action) => action.createsAssets === false), true)
assert.equal(
  qwenGateSummary.manualBlockerActions.some(
    (action) =>
      action.id === 'refresh_active_gcloud_login' &&
      action.mutatesCloud === false &&
      action.mutatesLocalGcloudAuth === true &&
      action.mutatesLocalGcloudConfig === false &&
      action.changesQuotaRequest === false &&
      action.afterCompletionCommand === 'npm run external-agent-tool-blockers:preflight',
  ),
  true,
)
assert.equal(
  qwenGateSummary.manualBlockerActions.some(
    (action) =>
      action.id === 'select_authenticated_gcloud_account_if_needed' &&
      action.mutatesCloud === false &&
      action.mutatesLocalGcloudAuth === false &&
      action.mutatesLocalGcloudConfig === true &&
      action.changesQuotaRequest === false &&
      action.afterCompletionCommand === 'npm run external-agent-tool-blockers:preflight',
  ),
  true,
)
const brollGateSummary = gateToolSummaries.get('ai_video_broll_generation_wan') as {
  executionAllowedNow: boolean
  staticExplicitToolGateReady: boolean
  currentBlocker: string
  safeNextCommand: string
  manualBlockerActions: Array<{
    id: string
    runInsideCodex: boolean
    mutatesRuntime: boolean
    runsModel: boolean
    createsAssets: boolean
    mutatesCloud: boolean
    mutatesLocalGcloudAuth: boolean
    mutatesLocalGcloudConfig: boolean
    changesQuotaRequest: boolean
    afterCompletionCommand: string
  }>
  noIdleLifecycleGate: {
    proofVmName: string
    noPublicIpRequired: boolean
    externalIpAllowed: boolean
    idleGpuAllowed: boolean
    vmCreateAllowedNow: boolean
    modelInferenceAllowedNow: boolean
  }
}
assert.equal(brollGateSummary.executionAllowedNow, false)
assert.equal(brollGateSummary.staticExplicitToolGateReady, false)
assert.equal(brollGateSummary.currentBlocker, 'gpus_all_regions_quota_zero_or_unverified')
assert.equal(brollGateSummary.safeNextCommand, 'npm run external-agent-tool-blockers:preflight')
assert.equal(brollGateSummary.manualBlockerActions.length, 1)
assert.equal(brollGateSummary.manualBlockerActions[0].id, 'request_gpus_all_regions_quota_in_console')
assert.equal(brollGateSummary.manualBlockerActions[0].runInsideCodex, false)
assert.equal(brollGateSummary.manualBlockerActions[0].mutatesRuntime, false)
assert.equal(brollGateSummary.manualBlockerActions[0].runsModel, false)
assert.equal(brollGateSummary.manualBlockerActions[0].createsAssets, false)
assert.equal(brollGateSummary.manualBlockerActions[0].mutatesCloud, true)
assert.equal(brollGateSummary.manualBlockerActions[0].mutatesLocalGcloudAuth, false)
assert.equal(brollGateSummary.manualBlockerActions[0].mutatesLocalGcloudConfig, false)
assert.equal(brollGateSummary.manualBlockerActions[0].changesQuotaRequest, true)
assert.equal(
  brollGateSummary.manualBlockerActions[0].afterCompletionCommand,
  'npm run external-agent-tool-blockers:preflight',
)
assert.equal(brollGateSummary.noIdleLifecycleGate.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(brollGateSummary.noIdleLifecycleGate.noPublicIpRequired, true)
assert.equal(brollGateSummary.noIdleLifecycleGate.externalIpAllowed, false)
assert.equal(brollGateSummary.noIdleLifecycleGate.idleGpuAllowed, false)
assert.equal(brollGateSummary.noIdleLifecycleGate.vmCreateAllowedNow, false)
assert.equal(brollGateSummary.noIdleLifecycleGate.modelInferenceAllowedNow, false)
assert.equal(
  decision.executionAllowedNow,
  decision.executionGateAllowsRuntime && decision.qwenLivePreflightPassed,
)
for (const summary of decision.executionGateToolSummaries as Array<{
  toolId: string
  manualBlockerActions: Array<{
    runInsideCodex: boolean
    mutatesRuntime: boolean
    runsModel: boolean
    createsAssets: boolean
  }>
}>) {
  for (const action of summary.manualBlockerActions) {
    assert.equal(action.runInsideCodex, false, `${summary.toolId} live-selector manual action must stay outside Codex`)
    assert.equal(action.mutatesRuntime, false, `${summary.toolId} live-selector manual action must not run runtime`)
    assert.equal(action.runsModel, false, `${summary.toolId} live-selector manual action must not run models`)
    assert.equal(action.createsAssets, false, `${summary.toolId} live-selector manual action must not create assets`)
  }
}
assert.equal(decision.readyForAnyExternalAgentExecutionNow, decision.executionAllowedNow)
assert.equal(decision.runtimeGatesAllFalse, true)
assert.equal(Array.isArray(decision.probeSummaries), true)
assert.equal(decision.probeSummaries.length >= 2, true)
assert.equal(typeof decision.liveBlockerSummary, 'object')
assert.equal(typeof decision.liveBlockerSummary.qwen, 'object')
assert.equal(typeof decision.liveBlockerSummary.broll, 'object')
assert.equal(typeof decision.chosenManualAction, 'string')
assert.equal(typeof decision.chosenNextCommand === 'string' || decision.chosenNextCommand === undefined, true)
assert.equal(typeof decision.chosenNextCommandAlreadyExecutedInThisRun, 'boolean')
assert.equal(
  typeof decision.codexRunnableNextCommandNow === 'string' ||
    decision.codexRunnableNextCommandNow === null ||
    decision.codexRunnableNextCommandNow === undefined,
  true,
)
if (decision.qwenLivePreflightPassed && decision.executionGateAllowsRuntime) {
  assert.equal(decision.executionAllowedNow, true)
  assert.equal(decision.chosenManualAction, QWEN_NEXT_PROMPT)
  assert.equal(decision.chosenNextCommand, undefined)
  assert.equal(decision.chosenNextCommandAlreadyExecutedInThisRun, false)
  assert.equal(decision.codexRunnableNextCommandNow, null)
  assert.equal(decision.manualActionRequired, false)
  assert.equal(decision.manualActionReason, undefined)
  assert.equal(decision.manualActionBlocksRuntime, undefined)
  assert.equal(decision.rerunAfterManualAction, undefined)
  assert.equal(decision.nextCodexCommandAfterManualAction, undefined)
} else if (decision.qwenLivePreflightPassed) {
  assert.equal(decision.executionAllowedNow, false)
  assert.equal(decision.qwenLivePreflightVerificationRequired, true)
  assert.equal(
    decision.chosenNextCommand,
    spec.nextCommandRules.whenQwenLivePreflightPassesButExecutionGateBlocked,
  )
  assert.equal(decision.chosenNextCommandAlreadyExecutedInThisRun, false)
  assert.equal(decision.codexRunnableNextCommandNow, decision.chosenNextCommand)
  assert.equal(decision.chosenManualAction, QWEN_NEXT_PROMPT)
  assert.equal(decision.manualActionRequired, false)
  assert.equal(decision.nextCodexCommandAfterManualAction, undefined)
} else {
  assert.equal(decision.executionAllowedNow, false)
  assert.equal(
    decision.chosenNextCommand,
    decision.qwenAuthRefreshPassed
      ? spec.nextCommandRules.whenStaticGateAllowsButQwenLivePreflightFails
      : spec.nextCommandRules.whenQwenAuthRefreshFails,
  )
}
if (decision.gcloudDiagnosticRun) {
  assert.equal(decision.chosenManualAction, QWEN_AUTH_NEXT_PROMPT)
  assert.equal(decision.manualActionRequired, true)
  assert.equal(decision.manualActionReason, spec.manualActionRules.whenQwenAuthRefreshFails.reason)
  assert.equal(decision.manualActionBlocksRuntime, true)
  assert.equal(decision.chosenNextCommandAlreadyExecutedInThisRun, true)
  assert.equal(decision.codexRunnableNextCommandNow, null)
  assert.equal(
    decision.rerunAfterManualAction,
    spec.manualActionRules.whenQwenAuthRefreshFails.rerunAfterManualAction,
  )
  assert.equal(
    decision.nextCodexCommandAfterManualAction,
    spec.manualActionRules.whenQwenAuthRefreshFails.rerunAfterManualAction,
  )
  assert.equal(typeof decision.gcloudDiagnosticSummary, 'object')
  assert.equal(typeof decision.gcloudDiagnosticSummary.path, 'string')
  assert.equal(Array.isArray(decision.gcloudDiagnosticSummary.pathCandidates), true)
  assert.equal(typeof decision.gcloudDiagnosticSummary.pathCandidateCount, 'number')
  assert.equal(decision.gcloudDiagnosticSummary.pathCandidateCount >= 1, true)
  assert.equal(Array.isArray(decision.gcloudDiagnosticSummary.pathToolSearchEntries), true)
  assert.equal(typeof decision.gcloudDiagnosticSummary.pathPrefersAppleSiliconHomebrew, 'boolean')
  assert.equal(typeof decision.gcloudDiagnosticSummary.appleSiliconHomebrewPrecedesUsrLocal, 'boolean')
  assert.equal(typeof decision.gcloudDiagnosticSummary.expectedAppleSiliconHomebrewPath, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.expectedAppleSiliconHomebrewGcloudPresent, 'boolean')
  assert.equal(typeof decision.gcloudDiagnosticSummary.usrLocalGcloudPath, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.usrLocalGcloudPresent, 'boolean')
  assert.equal(typeof decision.gcloudDiagnosticSummary.installationSdkRoot, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.globalConfigDir, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.activeConfigPath, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.configuredProject, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.activeAccountDomain, 'string')
  assert.equal(typeof decision.gcloudDiagnosticSummary.accessTokenRefreshPassed, 'boolean')
  assert.equal(typeof decision.gcloudDiagnosticSummary.authFailure, 'object')
  assert.equal(Array.isArray(decision.gcloudDiagnosticSummary.manualOnlyRepairActions), true)
  assert.equal(
    decision.gcloudDiagnosticSummary.manualOnlyRepairActions.every(
      (action: {
        runInsideCodex: boolean
        mutatesCloud: boolean
        runsRuntime: boolean
        pathSpecificCommand: string
        usesResolvedGcloudPath: boolean
      }) =>
        action.runInsideCodex === false &&
        action.mutatesCloud === false &&
        action.runsRuntime === false &&
        typeof action.pathSpecificCommand === 'string' &&
        typeof action.usesResolvedGcloudPath === 'boolean',
    ),
    true,
  )
  assert.equal(
    decision.gcloudDiagnosticSummary.manualOnlyRepairActions.every(
      (action: { pathSpecificCommand: string }) =>
        action.pathSpecificCommand.startsWith(decision.gcloudDiagnosticSummary.path),
    ),
    true,
  )
  assert.equal(
    decision.gcloudDiagnosticSummary.postRepairCodexVerificationCommand,
    spec.manualActionRules.whenQwenAuthRefreshFails.rerunAfterManualAction,
  )
  assert.equal(decision.liveBlockerSummary.qwen.blocker, 'local_gcloud_reauthentication_required')
  assert.equal(decision.liveBlockerSummary.qwen.downstreamProbeSkipped, true)
  assert.equal(decision.liveBlockerSummary.broll.blocker, 'quota_probe_skipped_auth_refresh_failed')
  assert.equal(decision.liveBlockerSummary.broll.quotaProbeSkipped, true)
} else if (!decision.qwenLivePreflightPassed) {
  assert.equal(decision.manualActionRequired, false)
  assert.equal(decision.qwenAuthRefreshPassed, true)
  assert.equal(decision.qwenServiceDescribePassed && decision.qwenJobDescribePassed, false)
}

for (const [flag, value] of Object.entries(decision.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `Runtime side-effect flag must remain false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ spec, decision })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      mode: decision.mode,
      executionAllowedNow: decision.executionAllowedNow,
      qwenAuthRefreshPassed: decision.qwenAuthRefreshPassed,
      brollQuotaSufficientForOneL4Vm: decision.brollQuotaSufficientForOneL4Vm,
      liveBlockerSummary: decision.liveBlockerSummary,
      gcloudDiagnosticRun: decision.gcloudDiagnosticRun,
      gcloudDiagnosticSummary: decision.gcloudDiagnosticSummary,
      chosenNextCommand: decision.chosenNextCommand,
      chosenManualAction: decision.chosenManualAction,
      manualActionRequired: decision.manualActionRequired,
      manualActionReason: decision.manualActionReason,
      rerunAfterManualAction: decision.rerunAfterManualAction,
      runtimeGatesAllFalse: decision.runtimeGatesAllFalse,
    },
    null,
    2,
  ),
)
