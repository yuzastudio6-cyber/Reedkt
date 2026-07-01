import { existsSync } from 'node:fs'
import path from 'node:path'

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
  const readyTools = rollup.tools.filter((tool) => tool.readyForExternalAgentExecutionNow)
  const retryReadyAfterBlockerClears = rollup.tools.filter((tool) => tool.readyForBoundedRetryAfterBlockerClears)
  const blockedTools = rollup.tools.filter((tool) => !tool.readyForExternalAgentExecutionNow)
  const runtimeGatesAllFalse = executionGateKeys.every((key) => rollup.runtimeSideEffects[key] === false)

  const summary = {
    ok: missingEvidence.length === 0 && runtimeGatesAllFalse,
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
    readyForAnyExternalAgentExecutionNow: readyTools.length > 0,
    readyToolIds: readyTools.map((tool) => tool.toolId),
    blockedToolCount: blockedTools.length,
    retryReadyAfterBlockerClearsToolIds: retryReadyAfterBlockerClears.map((tool) => tool.toolId),
    blockers: blockedTools.map((tool) => ({
      toolId: tool.toolId,
      blocker: tool.primaryBlocker,
      nextAction: tool.nextAction,
    })),
    evidenceChecked: evidence.length,
    missingEvidence,
    recommendedNextPrompt: rollup.recommendedNextPrompt,
  }

  console.log(JSON.stringify(summary, null, 2))
}

main()
