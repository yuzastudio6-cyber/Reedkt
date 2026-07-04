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
  const preferredNextSafeCommand =
    safeNextCommands.find((command) => command.id === 'live_next_command_decision') ?? safeNextCommands[0]

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
      decision: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.decision,
      mode: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.mode,
      projectId: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.projectId,
      currentLiveBlockers: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.currentLiveBlockers,
      repairScope: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.repairScope,
      tools: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.tools,
      failureResponsePolicy: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.failureResponsePolicy,
      safeRetryChecklist: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.safeRetryChecklist,
      postRepairVerificationCommands: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.postRepairVerificationCommands,
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
    evidenceChecked: evidence.length,
    missingEvidence,
    recommendedNextPrompt: rollup.recommendedNextPrompt,
  }

  console.log(JSON.stringify(summary, null, 2))
}

main()
