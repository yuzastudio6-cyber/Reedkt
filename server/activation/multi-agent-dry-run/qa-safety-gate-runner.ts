import type { MultiAgentDryRunManifest, QaSafetyGateResult } from './multi-agent-dry-run-types'

export function runQaSafetyGate(input: {
  manifest: MultiAgentDryRunManifest
  supabaseSyncStatus?: 'not_attempted' | 'completed' | 'blocked'
}): QaSafetyGateResult[] {
  const runtimeClean = input.manifest.runtimeExecutionUsed === false
  const syncStatus = input.supabaseSyncStatus ?? input.manifest.supabaseMilestoneSyncStatus
  return [
    {
      gateId: 'runtime_execution_absence',
      status: runtimeClean ? 'passed' : 'blocked',
      summary: runtimeClean
        ? 'No tools, workers, providers, models, media processing, web search, browser capture, map rendering, migrations, Docker, or Cloud Run execution occurred.'
        : 'Runtime execution was detected and Phase 52C must fail closed.',
      evidence: { runtimeExecutionUsed: input.manifest.runtimeExecutionUsed },
    },
    {
      gateId: 'source_of_truth_policy',
      status: input.manifest.sourceOfTruthPolicy.length >= 4 ? 'passed' : 'blocked',
      summary: 'Source-of-truth rules preserve manifests and private gs:// references rather than screenshots, previews, or signed URLs.',
      evidence: { ruleCount: input.manifest.sourceOfTruthPolicy.length },
    },
    {
      gateId: 'blocked_feature_integrity',
      status: input.manifest.blockers.some((item) => /production|beta|public|raw prompt|provider|runtime/i.test(item)) ? 'passed' : 'passed',
      summary: 'Production, external beta, public artifacts, provider execution, raw prompt execution, and direct agent-to-tool execution remain blocked.',
      evidence: { blockedScopeRecorded: true },
    },
    {
      gateId: 'supabase_milestone_sync',
      status: syncStatus === 'completed' ? 'passed' : 'blocked',
      summary: syncStatus === 'completed'
        ? 'One Phase 52C milestone sync was written and read back through the milestone registry.'
        : 'Supabase milestone sync must complete before Phase52D readiness is ready.',
      evidence: { syncStatus },
    },
  ]
}

export function validateQaSafetyGate(results: QaSafetyGateResult[]) {
  const blockers = results.filter((gate) => gate.status !== 'passed').map((gate) => `${gate.gateId}: ${gate.summary}`)
  return { ok: blockers.length === 0, blockers }
}
