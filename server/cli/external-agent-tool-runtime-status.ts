import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

type JsonRecord = Record<string, unknown>

const TOOL_COMMANDS: Record<
  string,
  {
    staticGuardCommand: string
    safePreflightCommand?: string
    executionCommand: string
    confirmationEnv: string
    runtimeKind: 'bounded_model_runtime' | 'metadata_evidence_only' | 'local_harness_evidence_only'
  }
> = {
  qwen2_5_vl_7b_instruct: {
    staticGuardCommand: 'npm run external-agent-tool-execute-qwen -- --json',
    safePreflightCommand: 'npm run external-agent-tool-execute-qwen -- --preflight-only --json',
    executionCommand: 'npm run external-agent-tool-execute-qwen -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION',
    runtimeKind: 'bounded_model_runtime',
  },
  ai_video_broll_generation_wan: {
    staticGuardCommand: 'npm run external-agent-tool-execute-broll-wan -- --json',
    safePreflightCommand: 'npm run external-agent-tool-execute-broll-wan -- --preflight-only --json',
    executionCommand: 'npm run external-agent-tool-execute-broll-wan -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF',
    runtimeKind: 'bounded_model_runtime',
  },
  sound_music_audio: {
    staticGuardCommand: 'npm run external-agent-tool-execute-sound -- --json',
    executionCommand: 'npm run external-agent-tool-execute-sound -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW',
    runtimeKind: 'metadata_evidence_only',
  },
  supabase_local_fixture_harness: {
    staticGuardCommand: 'npm run external-agent-tool-execute-supabase-harness -- --json',
    executionCommand: 'npm run external-agent-tool-execute-supabase-harness -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW',
    runtimeKind: 'local_harness_evidence_only',
  },
}

function runJson(id: string, command: string, args: string[]) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 24,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let json: JsonRecord | undefined
  try {
    json = JSON.parse(String(result.stdout ?? '')) as JsonRecord
  } catch {
    json = undefined
  }

  return {
    id,
    ok: result.status === 0 && Boolean(json),
    exitCode: result.status,
    json,
    stderrSummary: String(result.stderr ?? '').trim().slice(0, 1200) || undefined,
  }
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function nestedBoolean(document: JsonRecord | undefined, keys: string[]): boolean {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return false
    value = (value as JsonRecord)[key]
  }
  return value === true
}

function nestedString(document: JsonRecord | undefined, keys: string[]): string | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }
  return typeof value === 'string' ? value : undefined
}

function nestedNumber(document: JsonRecord | undefined, keys: string[]): number | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }
  return typeof value === 'number' ? value : undefined
}

function main() {
  const staticOnly = process.argv.includes('--static-only')
  const liveChecksRun = !staticOnly
  const readiness = runJson('static_readiness', 'npx', [
    'tsx',
    'server/cli/external-agent-tool-readiness-check.ts',
  ])
  const gcpRepairPlan = runJson('gcp_access_repair_plan', 'npx', [
    'tsx',
    'server/cli/external-agent-gcp-access-repair-plan.ts',
  ])
  const liveGate = liveChecksRun
    ? runJson('live_execution_gate', 'npx', [
        'tsx',
        'server/cli/external-agent-tool-execution-gate.ts',
        '--live',
      ])
    : undefined
  const nextCommand = liveChecksRun
    ? runJson('live_next_command', 'npx', ['tsx', 'server/cli/external-agent-tool-next-command.ts'])
    : undefined

  const liveGateJson = liveGate?.json
  const nextCommandJson = nextCommand?.json
  const liveReadyToolIds = asStringArray(liveGateJson?.readyToolIds)
  const staticExplicitToolGateReadyToolIds = asStringArray(
    liveChecksRun
      ? liveGateJson?.staticExplicitToolGateReadyToolIds
      : readiness.json?.staticExplicitToolGateReadyToolIds,
  )
  const runtimeGatesAllFalse = liveChecksRun
    ? nestedBoolean(liveGateJson, ['runtimeGatesAllFalse'])
    : nestedBoolean(readiness.json, ['runtimeGatesAllFalse'])
  const liveExecutionAllowedNow = liveChecksRun
    ? nestedBoolean(liveGateJson, ['executionAllowedNow']) &&
      nestedBoolean(nextCommandJson, ['executionAllowedNow'])
    : false

  const toolRows = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.map((tool) => {
    const commands = TOOL_COMMANDS[tool.toolId]
    const agentCallable = Boolean(commands)
    const staticExplicitToolGateReady = staticExplicitToolGateReadyToolIds.includes(tool.toolId)
    const executionAllowedNow =
      liveChecksRun && liveExecutionAllowedNow && liveReadyToolIds.includes(tool.toolId)
    const runtimeExecutableNow =
      executionAllowedNow && commands?.runtimeKind === 'bounded_model_runtime'
    const supportingEvidenceOnly =
      commands?.runtimeKind === 'metadata_evidence_only' ||
      commands?.runtimeKind === 'local_harness_evidence_only'

    return {
      toolId: tool.toolId,
      lane: tool.lane,
      selectedModelOrTool: tool.selectedModelOrTool,
      agentCallable,
      wrapperStaticGuardCommand: commands?.staticGuardCommand,
      safePreflightCommand: commands?.safePreflightCommand,
      executionCommand: commands?.executionCommand,
      confirmationEnv: commands?.confirmationEnv,
      runtimeKind: commands?.runtimeKind,
      staticStatus: tool.status,
      staticExplicitToolGateReady,
      liveChecksRun,
      executionAllowedNow,
      runtimeExecutableNow,
      supportingEvidenceOnly,
      selectedGpu: tool.selectedGpu,
      scaleToZeroRequired: tool.scaleToZeroRequired,
      currentBlocker:
        liveChecksRun && tool.toolId === 'qwen2_5_vl_7b_instruct'
          ? nestedString(nextCommandJson, ['liveBlockerSummary', 'qwen', 'blocker']) ?? tool.primaryBlocker
          : liveChecksRun && tool.toolId === 'ai_video_broll_generation_wan'
            ? nestedString(nextCommandJson, ['liveBlockerSummary', 'broll', 'blocker']) ??
              tool.primaryBlocker
            : tool.primaryBlocker,
      nextAction:
        liveChecksRun && tool.toolId === 'qwen2_5_vl_7b_instruct'
          ? nestedString(nextCommandJson, ['liveBlockerSummary', 'qwen', 'nextAction']) ??
            tool.nextAction
          : liveChecksRun && tool.toolId === 'ai_video_broll_generation_wan'
            ? nestedString(nextCommandJson, ['liveBlockerSummary', 'broll', 'nextAction']) ??
              tool.nextAction
            : tool.nextAction,
      noIdleLifecycleGate: tool.noIdleLifecycleGate,
    }
  })

  const runtimeExecutableToolIds = toolRows
    .filter((tool) => tool.runtimeExecutableNow)
    .map((tool) => tool.toolId)
  const agentCallableToolIds = toolRows.filter((tool) => tool.agentCallable).map((tool) => tool.toolId)

  const report = {
    ok: readiness.ok && (!liveChecksRun || liveGate?.ok === true) && runtimeGatesAllFalse,
    mode: 'external_agent_tool_runtime_status_report',
    decision: runtimeExecutableToolIds.length
      ? 'external_agent_runtime_execution_ready_for_some_tools'
      : liveChecksRun
        ? 'external_agent_tools_callable_runtime_execution_blocked'
        : 'external_agent_tools_callable_static_status_only',
    liveChecksRun,
    paidProductionInScope: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
    agentCallableToolCount: agentCallableToolIds.length,
    agentCallableToolIds,
    runtimeExecutableToolCount: runtimeExecutableToolIds.length,
    runtimeExecutableToolIds,
    readyForAnyExternalAgentRuntimeExecutionNow: runtimeExecutableToolIds.length > 0,
    staticExplicitToolGateReadyToolIds,
    runtimeGatesAllFalse,
    liveGate: liveChecksRun
      ? {
          ok: liveGate?.ok === true,
          decision: liveGateJson?.decision,
          executionAllowedNow: liveGateJson?.executionAllowedNow,
          readyForAnyExternalAgentExecutionNow: liveGateJson?.readyForAnyExternalAgentExecutionNow,
          blockedToolIds: liveGateJson?.blockedToolIds,
          liveVerifier: {
            allRequiredReadAccessVerified: nestedBoolean(liveGateJson, [
              'liveVerifier',
              'allRequiredReadAccessVerified',
            ]),
            qwenReadAccessPassed: nestedBoolean(liveGateJson, [
              'liveVerifier',
              'qwenReadAccessPassed',
            ]),
            brollQuotaReadAccessPassed: nestedBoolean(liveGateJson, [
              'liveVerifier',
              'brollQuotaReadAccessPassed',
            ]),
            brollQuotaSufficientForOneL4Vm: nestedBoolean(liveGateJson, [
              'liveVerifier',
              'brollQuotaSufficientForOneL4Vm',
            ]),
            accountAccessDiagnostic: {
              accountCount: nestedNumber(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'accountCount',
              ]),
              qwenReadyAccountCount: nestedNumber(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'qwenReadyAccountCount',
              ]),
              brollQuotaReadAccountCount: nestedNumber(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'brollQuotaReadAccountCount',
              ]),
              brollQuotaReadyAccountCount: nestedNumber(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'brollQuotaReadyAccountCount',
              ]),
              anyAccountReadyForBoth: nestedBoolean(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'anyAccountReadyForBoth',
              ]),
            },
          },
        }
      : undefined,
    gcpAccessRepair: {
      ok: gcpRepairPlan.ok,
      decision: gcpRepairPlan.json?.decision,
      mode: gcpRepairPlan.json?.mode,
      projectId: gcpRepairPlan.json?.projectId,
      currentLiveBlockers: gcpRepairPlan.json?.currentLiveBlockers,
      repairScope: gcpRepairPlan.json?.repairScope,
      tools: Array.isArray(gcpRepairPlan.json?.tools)
        ? gcpRepairPlan.json.tools.map((tool) => {
            const row = tool as JsonRecord
            return {
              toolId: row.toolId,
              blocker: row.blocker,
              likelyMinimalRole: row.likelyMinimalRole,
              requiredResourceScope: row.requiredResourceScope,
              requiredReadPermissions: row.requiredReadPermissions,
              verificationCommand: row.verificationCommand,
              runtimeExecutionStillRequiresWrapperGate: row.runtimeExecutionStillRequiresWrapperGate,
            }
          })
        : [],
      postRepairVerificationCommands: gcpRepairPlan.json?.postRepairVerificationCommands,
      runtimeGatesAllFalse: gcpRepairPlan.json?.runtimeGatesAllFalse,
      runtimeSideEffects: gcpRepairPlan.json?.runtimeSideEffects,
    },
    nextCommand: liveChecksRun
      ? {
          ok: nextCommand?.ok === true,
          chosenNextCommand: nextCommandJson?.chosenNextCommand,
          chosenNextCommandAlreadyExecutedInThisRun:
            nextCommandJson?.chosenNextCommandAlreadyExecutedInThisRun,
          manualActionRequired: nextCommandJson?.manualActionRequired,
          manualActionReason: nextCommandJson?.manualActionReason,
          rerunAfterManualAction: nextCommandJson?.rerunAfterManualAction,
        }
      : undefined,
    tools: toolRows,
    safeAgentCommands: {
      staticReadiness: 'npm run external-agent-tool-readiness:check',
      liveStatus: 'npm run external-agent-tool-runtime-status',
      liveGate: 'npm run external-agent-tool-execution-gate -- --live',
      nextCommand: 'npm run external-agent-tool-next-command',
      qwenPreflight: TOOL_COMMANDS.qwen2_5_vl_7b_instruct.safePreflightCommand,
      brollPreflight: TOOL_COMMANDS.ai_video_broll_generation_wan.safePreflightCommand,
      brollInferencePreflight:
        'npm run external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only --json',
    },
    forbiddenRuntimeActions: [
      'do not execute wrappers without explicit confirmation envs',
      'do not execute model runtime unless this report shows runtimeExecutableNow=true for that tool',
      'do not bypass live GCP read/quota preflight',
      'do not run raw chat as worker input',
      'do not touch Supabase, SQL, storage, signed URLs, credits, beta, or production from this status command',
    ],
    runtimeSideEffects: {
      cloudRunServiceMutated: false,
      cloudRunJobExecuted: false,
      computeVmCreated: false,
      quotaRequestCreated: false,
      dockerRun: false,
      modelImportRun: false,
      modelInferenceRun: false,
      generatedVideoCreated: false,
      generatedAssetsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      supabaseTouched: false,
      sqlExecuted: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      publicArtifactsCreated: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
    },
    recommendedNextPrompt:
      (liveChecksRun && nestedString(nextCommandJson, ['chosenManualAction'])) ||
      (liveChecksRun && nestedString(liveGateJson, ['recommendedNextPrompt'])) ||
      EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.recommendedNextPrompt,
    probeSummaries: [
      {
        id: gcpRepairPlan.id,
        ok: gcpRepairPlan.ok,
        exitCode: gcpRepairPlan.exitCode,
        mode: gcpRepairPlan.json?.mode,
        decision: gcpRepairPlan.json?.decision,
      },
      {
        id: readiness.id,
        ok: readiness.ok,
        exitCode: readiness.exitCode,
        mode: readiness.json?.mode,
        decision: readiness.json?.decision,
      },
      liveGate
        ? {
            id: liveGate.id,
            ok: liveGate.ok,
            exitCode: liveGate.exitCode,
            mode: liveGate.json?.mode,
            decision: liveGate.json?.decision,
          }
        : undefined,
      nextCommand
        ? {
            id: nextCommand.id,
            ok: nextCommand.ok,
            exitCode: nextCommand.exitCode,
            mode: nextCommand.json?.mode,
            decision: nextCommand.json?.decision,
          }
        : undefined,
    ].filter(Boolean),
  }

  console.log(JSON.stringify(report, null, 2))
}

main()
