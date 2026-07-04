import { existsSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

const ROOT = process.cwd()

type EvidenceCheck = {
  toolId: string
  evidence: string
  kind: 'file' | 'reference'
  present: boolean
}

const executionGateKeys = [
  'modelInferenceRun',
  'generatedVideoCreated',
  'generatedAudioCreated',
  'generatedAssetsCreated',
  'cloudRunServiceMutated',
  'cloudRunJobExecuted',
  'computeVmCreated',
  'dockerRun',
  'providerCallsMade',
  'workersDispatched',
  'supabaseTouched',
  'sqlExecuted',
  'storageObjectsCreated',
  'signedUrlsCreated',
  'publicArtifactsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
] as const

function readArgValue(names: string[]): string | undefined {
  for (const name of names) {
    const equalsPrefix = `${name}=`
    const equalsMatch = process.argv.find((arg) => arg.startsWith(equalsPrefix))
    if (equalsMatch) return equalsMatch.slice(equalsPrefix.length).trim()

    const index = process.argv.indexOf(name)
    if (index >= 0) {
      const next = process.argv[index + 1]?.trim()
      if (next && !next.startsWith('--')) return next
    }
  }

  return undefined
}

function selectedAccountIndex(): number | undefined {
  const rawIndex = readArgValue(['--account-index', '--gcloud-account-index'])
  const parsed = rawIndex ? Number(rawIndex) : undefined
  return Number.isInteger(parsed) && Number(parsed) > 0 ? Number(parsed) : undefined
}

function replaceAccountIndexPlaceholders(value: string, accountIndex: number | undefined) {
  if (!accountIndex) return value

  return value
    .replace(/<account-index>/g, String(accountIndex))
    .replace(/<redacted-index>/g, String(accountIndex))
}

const cliAccountIndexCommands = new Set([
  'npm run external-agent-tool-action-plan',
  'npm run external-agent-tool-readiness:check',
  'npm run external-agent-tool-execution-gate',
  'npm run external-agent-tool-next-command',
  'npm run external-agent-tool-blockers:preflight',
  'npm run external-agent-gcp-access:repair-plan',
  'npm run external-agent-gcp-access:verify',
  'npm run external-agent-tool-runtime-status',
  'npm run external-agent-tool-execute-qwen',
  'npm run external-agent-tool-execute-broll-wan',
])

const envAccountIndexCommands = new Set(['npm run ai-video-broll-wan-gpu-global-quota:verify'])

function commandWithAccountIndex(command: string, accountIndex: number | undefined): string {
  if (!accountIndex) return command
  if (
    command.includes('--account-index') ||
    command.includes('--gcloud-account-index') ||
    command.includes('REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=')
  ) {
    return replaceAccountIndexPlaceholders(command, accountIndex)
  }

  const runPrefix = command.startsWith('run ')
  const body = runPrefix ? command.slice('run '.length) : command
  const prefix = runPrefix ? 'run ' : ''

  if (cliAccountIndexCommands.has(body)) {
    return `${prefix}${body} -- --account-index ${accountIndex}`
  }

  if (envAccountIndexCommands.has(body)) {
    return `${prefix}REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=${accountIndex} ${body}`
  }

  return replaceAccountIndexPlaceholders(command, accountIndex)
}

function isFileEvidence(evidence: string): boolean {
  return (
    evidence.startsWith('docs/') ||
    evidence.startsWith('server/') ||
    evidence.startsWith('src/') ||
    evidence.startsWith('scripts/') ||
    evidence.startsWith('database/')
  )
}

function checkEvidence(): EvidenceCheck[] {
  return EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.flatMap((tool) =>
    tool.evidence.map((evidence) => {
      const kind = isFileEvidence(evidence) ? 'file' : 'reference'
      return {
        toolId: tool.toolId,
        evidence,
        kind,
        present: kind === 'file' ? existsSync(path.join(ROOT, evidence)) : true,
      }
    }),
  )
}

function main() {
  if (process.argv.includes('--live') || process.argv.includes('--run-live-checks')) {
    throw new Error(
      'Live checks are intentionally not implemented here. Use this checker for fast static readiness only.',
    )
  }

  const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
  const accountIndex = selectedAccountIndex()
  const evidence = checkEvidence()
  const missingEvidence = evidence.filter((item) => !item.present)
  const staticReadyTools = rollup.tools.filter((tool) => tool.readyForExternalAgentExecutionNow)
  const explicitToolGateReadyTools = rollup.tools.filter(
    (tool) =>
      String(tool.status) === 'ready_for_explicit_tool_gate' ||
      String(tool.status) === 'ready_for_bounded_model_import_proof_after_private_cache_staging' ||
      String(tool.status) === 'bounded_model_import_load_proof_reviewed_inference_boundary_plan_required' ||
      String(tool.status) === 'bounded_inference_boundary_planned_runner_required' ||
      String(tool.status) === 'bounded_inference_proof_execution_attempted_failed_cleanup_verified_fix_required' ||
      String(tool.status) === 'bounded_inference_proof_fix_implemented_retry_required',
  )
  const retryReadyAfterBlockerClears = rollup.tools.filter((tool) => tool.readyForBoundedRetryAfterBlockerClears)
  const noIdleLifecycleGateTools = rollup.tools.filter((tool) => tool.noIdleLifecycleGate)
  const blockedTools = rollup.tools.filter((tool) => !tool.readyForExternalAgentExecutionNow)
  const runtimeGatesAllFalse = executionGateKeys.every((key) => rollup.runtimeSideEffects[key] === false)
  const gcpAccessRepairRuntimeGatesAllFalse = Object.values(
    EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.runtimeSideEffects,
  ).every((value) => value === false)
  const safeNextCommands = rollup.safeNextCommands
  const accountIndexedSafeNextCommands = accountIndex
    ? safeNextCommands.map((command) => ({
        ...command,
        command: commandWithAccountIndex(command.command, accountIndex),
      }))
    : undefined
  const preferredNextSafeCommand =
    safeNextCommands.find((command) => command.id === 'live_next_command_decision') ?? safeNextCommands[0]
  const accountIndexedPreferredNextSafeCommand =
    accountIndexedSafeNextCommands?.find((command) => command.id === 'live_next_command_decision') ??
    accountIndexedSafeNextCommands?.[0]

  const summary = {
    ok: missingEvidence.length === 0 && runtimeGatesAllFalse && gcpAccessRepairRuntimeGatesAllFalse,
    mode: 'fast_static_external_agent_tool_readiness_check',
    decision: rollup.decision,
    paidProductionInScope: rollup.paidProductionInScope,
    dryRunPassedClaimed: rollup.dryRunPassedClaimed,
    generatedLocalFixturePassedClaimed: rollup.generatedLocalFixturePassedClaimed,
    runtimeGatesAllFalse,
    liveChecksRun: false,
    cloudRunTouched: false,
    computeTouched: false,
    dockerRun: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    modelInferenceRun: false,
    generatedAssetsCreated: false,
    readyForAnyExternalAgentExecutionNow: false,
    readyForAnyExternalAgentRuntimeExecutionNow: false,
    staticReadyForAnyExternalAgentExecutionGateNow: staticReadyTools.length > 0,
    readyToolIds: [],
    staticReadyToolIds: staticReadyTools.map((tool) => tool.toolId),
    staticExplicitToolGateReadyToolIds: explicitToolGateReadyTools.map((tool) => tool.toolId),
    livePreflightRequiredBeforeRuntime: explicitToolGateReadyTools.length > 0,
    executionNowBlockedByLivePreflight: explicitToolGateReadyTools.length > 0,
    blockedToolCount: blockedTools.length,
    retryReadyAfterBlockerClearsToolIds: retryReadyAfterBlockerClears.map((tool) => tool.toolId),
    noIdleLifecycleGateToolIds: noIdleLifecycleGateTools.map((tool) => tool.toolId),
    noIdleLifecycleGates: noIdleLifecycleGateTools.map((tool) => ({
      toolId: tool.toolId,
      gate: tool.noIdleLifecycleGate,
    })),
    gcpAccessRepair: {
      accountSelection: {
        ...EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.accountSelection,
        cliAccountIndexProvided: Boolean(accountIndex),
        cliAccountIndex: accountIndex,
        cliAccountIndexValid: Boolean(accountIndex),
        cliAccountIndexMapsToChildEnv: Boolean(accountIndex),
      },
      decision: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.decision,
      mode: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.mode,
      projectId: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.projectId,
      currentLiveBlockers: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.currentLiveBlockers,
      repairScope: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.repairScope,
      tools: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.tools.map((tool) => ({
        ...tool,
        verificationCommand: replaceAccountIndexPlaceholders(tool.verificationCommand, accountIndex),
      })),
      failureResponsePolicy: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.failureResponsePolicy,
      safeRetryChecklist: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.safeRetryChecklist.map((step) =>
        replaceAccountIndexPlaceholders(step, accountIndex),
      ),
      postRepairVerificationCommands: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.postRepairVerificationCommands.map(
        (command) => replaceAccountIndexPlaceholders(command, accountIndex),
      ),
      runtimeGatesAllFalse: gcpAccessRepairRuntimeGatesAllFalse,
      runtimeSideEffects: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.runtimeSideEffects,
    },
    manualBlockerActionToolIds: blockedTools
      .filter((tool) => (tool.manualBlockerActions ?? []).length > 0)
      .map((tool) => tool.toolId),
    blockers: blockedTools.map((tool) => ({
      toolId: tool.toolId,
      blocker: tool.primaryBlocker,
      nextAction: tool.nextAction,
      manualBlockerActions: tool.manualBlockerActions ?? [],
    })),
    safeNextCommands,
    preferredNextSafeCommand,
    accountIndexedSafeNextCommands,
    accountIndexedPreferredNextSafeCommand,
    evidenceChecked: evidence.length,
    missingEvidence,
    recommendedNextPrompt: rollup.recommendedNextPrompt,
  }

  console.log(JSON.stringify(summary, null, 2))
}

main()
