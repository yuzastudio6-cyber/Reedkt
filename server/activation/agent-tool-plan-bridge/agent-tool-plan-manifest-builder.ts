import type {
  AgentToolPlanBridgeManifest,
  BlockedPlanRecord,
  CandidateApprovedPlanSnapshot,
  CrossTrackHandoffPacket,
  ProducerPlanGateResult,
  QaPlanGateResult,
  RepoOwnershipAudit,
} from './agent-tool-plan-bridge-types'

export const phase52DBlockedFeatures = [
  'tool runtime execution',
  'worker execution',
  'model/provider/media execution',
  'web search execution',
  'browser capture',
  'map rendering',
  'Docker or Cloud Run mutation',
  'Supabase migrations or schema changes',
  'historical backfill rerun',
  'production/external beta/paid production/broad media',
  'public artifacts and signed URL source of truth',
  'raw prompt execution',
]

export function buildAgentToolPlanBridgeManifest(input: {
  runId: string
  repoOwnershipAudit: RepoOwnershipAudit
  findingCount: number
  editIntentCount: number
  capabilityRecordCount: number
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
  handoffPackets: CrossTrackHandoffPacket[]
  producerGateResults: ProducerPlanGateResult[]
  qaPlanGateResults: QaPlanGateResult[]
  sourceOfTruthSummary: string[]
  supabaseMilestoneSyncStatus: AgentToolPlanBridgeManifest['supabaseMilestoneSyncStatus']
  blockers?: string[]
  warnings?: string[]
}): AgentToolPlanBridgeManifest {
  const blockers = Array.from(new Set(input.blockers ?? []))
  const warnings = Array.from(new Set(input.warnings ?? []))
  const qaBlocked = input.qaPlanGateResults.filter((gate) => gate.status === 'blocked').length
  return {
    manifestId: 'phase52d_agent_tool_plan_bridge_manifest',
    runId: input.runId,
    phase: '52D',
    repoOwnershipAudit: input.repoOwnershipAudit,
    evidenceContextSummary: {
      findingCount: input.findingCount,
      editIntentCount: input.editIntentCount,
      capabilityRecordCount: input.capabilityRecordCount,
      phase52CRunId: 'phase52c-20260605T134904',
    },
    candidatePlanIds: input.candidatePlans.map((plan) => plan.planId),
    blockedPlanIds: input.blockedPlans.map((plan) => plan.planId),
    handoffPacketIds: input.handoffPackets.map((packet) => packet.packetId),
    producerGateSummary: {
      candidatePlanOnly: input.producerGateResults.filter((result) => result.decision === 'candidate_plan_only').length,
      handoffOnly: input.producerGateResults.filter((result) => result.decision === 'handoff_only').length,
      blocked: input.producerGateResults.filter((result) => result.decision === 'blocked').length,
    },
    qaGateSummary: {
      passed: input.qaPlanGateResults.filter((gate) => gate.status === 'passed').length,
      blocked: qaBlocked,
    },
    sourceOfTruthSummary: input.sourceOfTruthSummary,
    supabaseMilestoneSyncStatus: input.supabaseMilestoneSyncStatus,
    blockedFeatures: phase52DBlockedFeatures,
    warnings,
    blockers,
    phase52EReadiness: input.supabaseMilestoneSyncStatus === 'completed' && !blockers.length && !qaBlocked
      ? 'ready_for_approved_plan_snapshot_validation_system_reconciliation'
      : 'blocked',
  }
}
