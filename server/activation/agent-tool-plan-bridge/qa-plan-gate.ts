import type { AgentToolPlanBridgeManifest, QaPlanGateResult } from './agent-tool-plan-bridge-types'

export function runAgentToolPlanQaGate(input: {
  manifest: AgentToolPlanBridgeManifest
  supabaseSyncStatus: 'not_attempted' | 'completed' | 'blocked'
}): QaPlanGateResult[] {
  return [
    gate('no_tool_execution', input.manifest.blockedFeatures.includes('tool runtime execution'), 'Tool runtime execution remains blocked.', { blocked: true }),
    gate('no_worker_execution', input.manifest.blockedFeatures.includes('worker execution'), 'Worker execution remains blocked.', { blocked: true }),
    gate('no_model_provider_media_execution', input.manifest.blockedFeatures.includes('model/provider/media execution'), 'Models, providers, and media processing were not executed.', { blocked: true }),
    gate('approved_plan_schema_compliance', input.manifest.candidatePlanIds.length === 7 && input.manifest.blockedPlanIds.length === 4, 'Seven candidate plans and four blocked/handoff records were generated.', {
      candidatePlans: input.manifest.candidatePlanIds.length,
      blockedPlans: input.manifest.blockedPlanIds.length,
    }),
    gate('owner_routes_present', input.manifest.handoffPacketIds.length >= 7, 'Cross-track handoff packets cover every owner route.', { handoffPackets: input.manifest.handoffPacketIds.length }),
    gate('source_of_truth_policy', input.manifest.sourceOfTruthSummary.length >= 4, 'Source-of-truth policy remains manifest/private-artifact based.', { rules: input.manifest.sourceOfTruthSummary }),
    gate('supabase_milestone_sync', input.supabaseSyncStatus === 'completed', input.supabaseSyncStatus === 'completed' ? 'Supabase milestone sync completed.' : 'Supabase milestone sync did not complete.', {
      supabaseSyncStatus: input.supabaseSyncStatus,
    }),
  ]
}

function gate(gateId: string, passed: boolean, summary: string, evidence: Record<string, unknown>): QaPlanGateResult {
  return { gateId, status: passed ? 'passed' : 'blocked', summary, evidence }
}
