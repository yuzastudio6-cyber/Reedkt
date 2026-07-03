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
const QWEN_READY_PROMPT =
  'EXTERNAL-AGENT-TOOL-EXECUTION-READY-QWEN: Qwen controlled approved-fixture private inference is ready for the explicit external-agent gate; keep beta/production blocked'
const QWEN_RESULT_REVIEW_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DX-PRIVATE-INFERENCE-RESULT-REVIEW: review bounded Qwen private inference retry metadata, no generated assets/no beta'
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
  spec.nextCommandRules.whenBrollQuotaNeedsVerification,
  'npm run ai-video-broll-wan-gpu-global-quota:verify',
)
assert.equal(
  spec.nextCommandRules.whenQwenLivePreflightPassesButExecutionGateBlocked,
  QWEN_RESULT_REVIEW_PROMPT,
)
assert.equal(spec.nextCommandRules.whenExecutionGateAllowsRuntime, QWEN_READY_PROMPT)
assert.deepEqual(spec.qwenBoundedExecutionCommand.args, [
  'run',
  'qwen2-5-vl-58dw-bounded-private-inference-retry',
  '--',
  '--execute',
  '--json',
])
assert.equal(spec.qwenBoundedExecutionCommand.confirmationEnv, 'REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY')
assert.equal(spec.qwenBoundedExecutionCommand.confirmationEnvRequiredValue, 'true')
assert.equal(spec.qwenBoundedExecutionCommand.requiresLivePreflightPassed, true)
assert.equal(spec.qwenBoundedExecutionCommand.requiresStaticExplicitToolGateReady, true)
assert.equal(spec.qwenBoundedExecutionCommand.boundedApprovedFixtureOnly, true)
assert.equal(spec.qwenBoundedExecutionCommand.createsGeneratedAssets, false)
assert.equal(spec.qwenBoundedExecutionCommand.touchesSupabase, false)
assert.equal(spec.qwenBoundedExecutionCommand.touchesSql, false)
assert.equal(spec.qwenBoundedExecutionCommand.unlocksBetaOrProduction, false)
assert.deepEqual(spec.brollWanExternalAgentProofCommand.args, [
  'run',
  'external-agent-tool-execute-broll-wan',
  '--',
  '--execute',
  '--json',
])
assert.equal(
  spec.brollWanExternalAgentProofCommand.confirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF',
)
assert.equal(spec.brollWanExternalAgentProofCommand.confirmationEnvRequiredValue, 'true')
assert.equal(spec.brollWanExternalAgentProofCommand.verifiesLiveQuotaBeforeAnyVmAction, true)
assert.equal(spec.brollWanExternalAgentProofCommand.verifiesPrivateCacheBeforeAnyVmAction, true)
assert.equal(spec.brollWanExternalAgentProofCommand.requiresNoIdleLifecycleGate, true)
assert.equal(spec.brollWanExternalAgentProofCommand.blocksWhenGpusAllRegionsQuotaInsufficient, true)
assert.equal(spec.brollWanExternalAgentProofCommand.createsComputeVm, false)
assert.equal(spec.brollWanExternalAgentProofCommand.runsModel, false)
assert.equal(spec.brollWanExternalAgentProofCommand.createsGeneratedAssets, false)
assert.equal(spec.brollWanExternalAgentProofCommand.touchesSupabase, false)
assert.equal(spec.brollWanExternalAgentProofCommand.touchesSql, false)
assert.equal(spec.brollWanExternalAgentProofCommand.unlocksBetaOrProduction, false)
assert.deepEqual(spec.soundMusicAudioEvidenceCommand.args, [
  'run',
  'external-agent-tool-execute-sound',
  '--',
  '--execute',
  '--json',
])
assert.equal(
  spec.soundMusicAudioEvidenceCommand.confirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW',
)
assert.equal(spec.soundMusicAudioEvidenceCommand.confirmationEnvRequiredValue, 'true')
assert.equal(spec.soundMusicAudioEvidenceCommand.verifiesSoundOssArchiveDiagnosticsBeforeAnyRuntime, true)
assert.equal(spec.soundMusicAudioEvidenceCommand.verifiesSoundRuntimeRouteSourceDiagnosticsBeforeAnyRuntime, true)
assert.equal(spec.soundMusicAudioEvidenceCommand.blocksRealProviderWorkerStorageExport, true)
assert.equal(spec.soundMusicAudioEvidenceCommand.runsProvider, false)
assert.equal(spec.soundMusicAudioEvidenceCommand.dispatchesWorker, false)
assert.equal(spec.soundMusicAudioEvidenceCommand.runsMediaProcessing, false)
assert.equal(spec.soundMusicAudioEvidenceCommand.createsGeneratedAudio, false)
assert.equal(spec.soundMusicAudioEvidenceCommand.createsGeneratedAssets, false)
assert.equal(spec.soundMusicAudioEvidenceCommand.touchesSupabase, false)
assert.equal(spec.soundMusicAudioEvidenceCommand.touchesSql, false)
assert.equal(spec.soundMusicAudioEvidenceCommand.unlocksBetaOrProduction, false)
assert.deepEqual(spec.supabaseLocalHarnessEvidenceCommand.args, [
  'run',
  'external-agent-tool-execute-supabase-harness',
  '--',
  '--execute',
  '--json',
])
assert.equal(
  spec.supabaseLocalHarnessEvidenceCommand.confirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW',
)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.confirmationEnvRequiredValue, 'true')
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.verifiesLocalConfigBeforeAnyRuntime, true)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.verifiesLocalHarnessRetryEvidenceBeforeAnyRuntime, true)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.blocksLiveSupabaseMutation, true)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.runsSupabaseCli, false)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.runsDocker, false)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.executesSql, false)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.createsRows, false)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.createsStorageObjects, false)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.createsSignedUrls, false)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.touchesSupabaseCloud, false)
assert.equal(spec.supabaseLocalHarnessEvidenceCommand.unlocksBetaOrProduction, false)

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
assert.equal(qwenGateSummary.staticExplicitToolGateReady, true)
assert.equal(qwenGateSummary.currentBlocker, 'live_preflight_required_before_runtime')
assert.equal(qwenGateSummary.safeNextCommand, 'npm run external-agent-tool-next-command')
assert.equal(qwenGateSummary.manualBlockerActions.length, 0)
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
assert.equal(
  brollGateSummary.currentBlocker,
  'broll_10v_no_idle_l4_payload_install_retry_required',
)
assert.equal(
  brollGateSummary.safeNextCommand,
  'npm run smoke:ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result',
)
assert.equal(brollGateSummary.manualBlockerActions.length, 0)
assert.equal(brollGateSummary.noIdleLifecycleGate.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(brollGateSummary.noIdleLifecycleGate.noPublicIpRequired, true)
assert.equal(brollGateSummary.noIdleLifecycleGate.externalIpAllowed, false)
assert.equal(brollGateSummary.noIdleLifecycleGate.idleGpuAllowed, false)
assert.equal(brollGateSummary.noIdleLifecycleGate.vmCreateAllowedNow, false)
assert.equal(brollGateSummary.noIdleLifecycleGate.modelInferenceAllowedNow, false)
const soundGateSummary = gateToolSummaries.get('sound_music_audio') as {
  executionAllowedNow: boolean
  staticExplicitToolGateReady: boolean
  currentBlocker: string
  safeNextCommand: string
}
assert.equal(soundGateSummary.executionAllowedNow, false)
assert.equal(soundGateSummary.staticExplicitToolGateReady, false)
assert.equal(soundGateSummary.currentBlocker, 'real_provider_worker_storage_track_qa_billing_export_handoffs_required')
assert.equal(soundGateSummary.safeNextCommand, 'npm run external-agent-tool-execute-sound')
const supabaseHarnessGateSummary = gateToolSummaries.get('supabase_local_fixture_harness') as {
  executionAllowedNow: boolean
  staticExplicitToolGateReady: boolean
  currentBlocker: string
  safeNextCommand: string
}
assert.equal(supabaseHarnessGateSummary.executionAllowedNow, false)
assert.equal(supabaseHarnessGateSummary.staticExplicitToolGateReady, false)
assert.equal(supabaseHarnessGateSummary.currentBlocker, 'not_a_model_or_media_execution_lane_on_this_branch')
assert.equal(
  supabaseHarnessGateSummary.safeNextCommand,
  'npm run external-agent-tool-execute-supabase-harness',
)
assert.equal(
  decision.executionAllowedNow,
  (decision.executionGateAllowsRuntime || decision.staticExplicitToolGateReady) &&
    decision.qwenLivePreflightPassed,
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
assert.equal(typeof decision.brollWanExternalAgentProofCommand, 'object')
assert.deepEqual(decision.brollWanExternalAgentProofCommand.args, [
  'run',
  'external-agent-tool-execute-broll-wan',
  '--',
  '--execute',
  '--json',
])
assert.equal(
  decision.brollWanExternalAgentProofCommand.confirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF',
)
assert.equal(decision.brollWanExternalAgentProofCommand.confirmationEnvRequiredValue, 'true')
assert.equal(decision.brollWanExternalAgentProofCommand.verifiesLiveQuotaBeforeAnyVmAction, true)
assert.equal(decision.brollWanExternalAgentProofCommand.verifiesPrivateCacheBeforeAnyVmAction, true)
assert.equal(decision.brollWanExternalAgentProofCommand.requiresNoIdleLifecycleGate, true)
assert.equal(decision.brollWanExternalAgentProofCommand.blocksWhenGpusAllRegionsQuotaInsufficient, true)
assert.equal(decision.brollWanExternalAgentProofCommand.executionAllowedNow, false)
assert.equal(decision.brollWanExternalAgentProofCommand.createsComputeVm, false)
assert.equal(decision.brollWanExternalAgentProofCommand.runsModel, false)
assert.equal(decision.brollWanExternalAgentProofCommand.createsGeneratedAssets, false)
assert.equal(decision.brollWanExternalAgentProofCommand.touchesSupabase, false)
assert.equal(decision.brollWanExternalAgentProofCommand.touchesSql, false)
assert.equal(decision.brollWanExternalAgentProofCommand.unlocksBetaOrProduction, false)
assert.equal(
  decision.brollWanExternalAgentProofCommand.shellExample,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF=true npm run external-agent-tool-execute-broll-wan -- --execute --json',
)
assert.equal(typeof decision.soundMusicAudioEvidenceCommand, 'object')
assert.deepEqual(decision.soundMusicAudioEvidenceCommand.args, [
  'run',
  'external-agent-tool-execute-sound',
  '--',
  '--execute',
  '--json',
])
assert.equal(
  decision.soundMusicAudioEvidenceCommand.confirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW',
)
assert.equal(decision.soundMusicAudioEvidenceCommand.confirmationEnvRequiredValue, 'true')
assert.equal(decision.soundMusicAudioEvidenceCommand.verifiesSoundOssArchiveDiagnosticsBeforeAnyRuntime, true)
assert.equal(
  decision.soundMusicAudioEvidenceCommand.verifiesSoundRuntimeRouteSourceDiagnosticsBeforeAnyRuntime,
  true,
)
assert.equal(decision.soundMusicAudioEvidenceCommand.blocksRealProviderWorkerStorageExport, true)
assert.equal(decision.soundMusicAudioEvidenceCommand.executionAllowedNow, false)
assert.equal(decision.soundMusicAudioEvidenceCommand.runsProvider, false)
assert.equal(decision.soundMusicAudioEvidenceCommand.dispatchesWorker, false)
assert.equal(decision.soundMusicAudioEvidenceCommand.runsMediaProcessing, false)
assert.equal(decision.soundMusicAudioEvidenceCommand.createsGeneratedAudio, false)
assert.equal(decision.soundMusicAudioEvidenceCommand.createsGeneratedAssets, false)
assert.equal(decision.soundMusicAudioEvidenceCommand.touchesSupabase, false)
assert.equal(decision.soundMusicAudioEvidenceCommand.touchesSql, false)
assert.equal(decision.soundMusicAudioEvidenceCommand.unlocksBetaOrProduction, false)
assert.equal(
  decision.soundMusicAudioEvidenceCommand.shellExample,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW=true npm run external-agent-tool-execute-sound -- --execute --json',
)
assert.equal(typeof decision.supabaseLocalHarnessEvidenceCommand, 'object')
assert.deepEqual(decision.supabaseLocalHarnessEvidenceCommand.args, [
  'run',
  'external-agent-tool-execute-supabase-harness',
  '--',
  '--execute',
  '--json',
])
assert.equal(
  decision.supabaseLocalHarnessEvidenceCommand.confirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW',
)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.confirmationEnvRequiredValue, 'true')
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.verifiesLocalConfigBeforeAnyRuntime, true)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.verifiesLocalHarnessRetryEvidenceBeforeAnyRuntime, true)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.blocksLiveSupabaseMutation, true)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.executionAllowedNow, false)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.runsSupabaseCli, false)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.runsDocker, false)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.executesSql, false)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.createsRows, false)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.createsStorageObjects, false)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.createsSignedUrls, false)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.touchesSupabaseCloud, false)
assert.equal(decision.supabaseLocalHarnessEvidenceCommand.unlocksBetaOrProduction, false)
assert.equal(
  decision.supabaseLocalHarnessEvidenceCommand.shellExample,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW=true npm run external-agent-tool-execute-supabase-harness -- --execute --json',
)
assert.equal(typeof decision.chosenManualAction, 'string')
assert.equal(typeof decision.chosenNextCommand === 'string' || decision.chosenNextCommand === undefined, true)
assert.equal(typeof decision.chosenNextCommandAlreadyExecutedInThisRun, 'boolean')
assert.equal(
  typeof decision.codexRunnableNextCommandNow === 'string' ||
    decision.codexRunnableNextCommandNow === null ||
    decision.codexRunnableNextCommandNow === undefined,
  true,
)
if (decision.qwenLivePreflightPassed && decision.staticExplicitToolGateReady) {
  assert.equal(decision.executionAllowedNow, true)
  assert.equal(decision.chosenManualAction, QWEN_READY_PROMPT)
  assert.equal(decision.chosenNextCommand, undefined)
  assert.equal(decision.chosenNextCommandAlreadyExecutedInThisRun, false)
  assert.equal(decision.codexRunnableNextCommandNow, null)
  assert.deepEqual(decision.qwenBoundedExecutionCommand.args, [
    'run',
    'qwen2-5-vl-58dw-bounded-private-inference-retry',
    '--',
    '--execute',
    '--json',
  ])
  assert.equal(decision.qwenBoundedExecutionCommand.confirmationEnv, 'REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY')
  assert.equal(decision.qwenBoundedExecutionCommand.confirmationEnvRequiredValue, 'true')
  assert.equal(decision.qwenBoundedExecutionCommand.requiresLivePreflightPassed, true)
  assert.equal(decision.qwenBoundedExecutionCommand.requiresStaticExplicitToolGateReady, true)
  assert.equal(decision.qwenBoundedExecutionCommand.boundedApprovedFixtureOnly, true)
  assert.equal(decision.qwenBoundedExecutionCommand.createsGeneratedAssets, false)
  assert.equal(decision.qwenBoundedExecutionCommand.touchesSupabase, false)
  assert.equal(decision.qwenBoundedExecutionCommand.touchesSql, false)
  assert.equal(decision.qwenBoundedExecutionCommand.unlocksBetaOrProduction, false)
  assert.equal(
    decision.qwenBoundedExecutionCommand.shellExample,
    'REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY=true npm run qwen2-5-vl-58dw-bounded-private-inference-retry -- --execute --json',
  )
  assert.equal(decision.manualActionRequired, false)
  assert.equal(decision.manualActionReason, undefined)
  assert.equal(decision.manualActionBlocksRuntime, undefined)
  assert.equal(decision.rerunAfterManualAction, undefined)
  assert.equal(decision.nextCodexCommandAfterManualAction, undefined)
} else if (decision.qwenLivePreflightPassed) {
  assert.equal(decision.executionAllowedNow, false)
  assert.equal(decision.qwenBoundedExecutionCommand, null)
  assert.equal(decision.qwenLivePreflightVerificationRequired, true)
  assert.equal(
    decision.chosenNextCommand,
    spec.nextCommandRules.whenQwenLivePreflightPassesButExecutionGateBlocked,
  )
  assert.equal(decision.chosenNextCommandAlreadyExecutedInThisRun, false)
  assert.equal(decision.codexRunnableNextCommandNow, decision.chosenNextCommand)
  assert.equal(decision.chosenManualAction, QWEN_RESULT_REVIEW_PROMPT)
  assert.equal(decision.manualActionRequired, false)
  assert.equal(decision.nextCodexCommandAfterManualAction, undefined)
} else {
  assert.equal(decision.executionAllowedNow, false)
  assert.equal(decision.qwenBoundedExecutionCommand, null)
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
