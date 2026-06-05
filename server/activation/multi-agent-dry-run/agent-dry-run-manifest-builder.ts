import type {
  EditIntentCandidate,
  MultiAgentDryRunManifest,
  MultiAgentDryRunScenario,
  MultiAgentFinding,
  ProducerGateResult,
} from './multi-agent-dry-run-types'

export function buildMultiAgentDryRunManifest(input: {
  runId: string
  scenarios: MultiAgentDryRunScenario[]
  findings: MultiAgentFinding[]
  editIntents: EditIntentCandidate[]
  producerGateResults: ProducerGateResult[]
  sourceOfTruthPolicy: string[]
  supabaseMilestoneSyncStatus?: 'not_attempted' | 'completed' | 'blocked'
  blockers?: string[]
  warnings?: string[]
}): MultiAgentDryRunManifest {
  const agentCoverage = Array.from(new Set(input.findings.map((finding) => finding.agentId))).sort()
  const allowedIntentIds = input.producerGateResults
    .filter((result) => result.decision === 'allowed_candidate_plan_only')
    .map((result) => result.intentId)
  const blockedIntentIds = input.producerGateResults
    .filter((result) => result.decision === 'blocked')
    .map((result) => result.intentId)
  return {
    manifestId: 'phase52c_multi_agent_dry_run_manifest',
    runId: input.runId,
    scenarioCount: input.scenarios.length,
    findingCount: input.findings.length,
    intentCount: input.editIntents.length,
    agentCoverage,
    allowedIntentIds,
    blockedIntentIds,
    producerGateSummary: {
      allowedCandidatePlanOnly: allowedIntentIds.length,
      blocked: blockedIntentIds.length,
    },
    qaSafetyGateSummary: {
      passed: 0,
      blocked: 0,
    },
    sourceOfTruthPolicy: input.sourceOfTruthPolicy,
    runtimeExecutionUsed: false,
    supabaseMilestoneSyncStatus: input.supabaseMilestoneSyncStatus ?? 'not_attempted',
    blockers: input.blockers ?? [
      'Production/external beta/paid production/broad media remain blocked.',
      'Public artifacts, signed URLs as source of truth, raw prompt execution, and direct agent-to-tool execution remain blocked.',
      'No tools, workers, models, providers, web search, map rendering, browser capture, media processing, migrations, Docker, or Cloud Run execution is authorized.',
    ],
    warnings: input.warnings ?? ['Dry-run output is advisory and must be bridged into approved plan snapshots in Phase 52D before worker execution can be considered.'],
  }
}

export function attachQaSafetyGateSummary(
  manifest: MultiAgentDryRunManifest,
  qaGateSummary: { passed: number; blocked: number },
): MultiAgentDryRunManifest {
  return {
    ...manifest,
    qaSafetyGateSummary: qaGateSummary,
  }
}
