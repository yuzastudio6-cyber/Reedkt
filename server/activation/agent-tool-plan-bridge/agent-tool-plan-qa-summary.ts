import { agentToolPlanBridgeRequiredDocs, agentToolPlanBridgeRequiredScripts, agentToolPlanBridgeSafetyFlags } from './agent-tool-plan-bridge-policy'
import type {
  AgentToolPlanBridgeManifest,
  AgentToolPlanBridgeQaGate,
  AgentToolPlanBridgeQaSummary,
  AgentToolPlanBridgeSupabaseSyncResult,
  BlockedPlanRecord,
  CandidateApprovedPlanSnapshot,
  CrossTrackHandoffPacket,
  ProducerPlanGateResult,
  QaPlanGateResult,
  RepoOwnershipAudit,
} from './agent-tool-plan-bridge-types'

export function buildAgentToolPlanBridgeQaSummary(input: {
  packageScripts: Record<string, string>
  docsPresent: Record<string, boolean>
  repoOwnershipAudit: RepoOwnershipAudit
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
  producerGateResults: ProducerPlanGateResult[]
  qaPlanGateResults: QaPlanGateResult[]
  handoffPackets: CrossTrackHandoffPacket[]
  manifest: AgentToolPlanBridgeManifest
  scopeValidationBlockers: string[]
  producerGateBlockers: string[]
  supabaseSyncResult?: AgentToolPlanBridgeSupabaseSyncResult
  executionMode: boolean
}): AgentToolPlanBridgeQaSummary {
  const scriptSummary = agentToolPlanBridgeRequiredScripts.every((script) => Boolean(input.packageScripts[script]))
  const docSummary = agentToolPlanBridgeRequiredDocs.every((doc) => input.docsPresent[doc] !== false)
  const gates: AgentToolPlanBridgeQaGate[] = [
    gate('source_of_truth_repo_audit', input.repoOwnershipAudit.implementationAllowed && !input.repoOwnershipAudit.duplicateBridgeDetected, input.repoOwnershipAudit.blockers[0] ?? 'Repo ownership audit completed; docs/cross-chat absence is recorded as base-state warning only.'),
    gate('phase52c_evidence', input.manifest.evidenceContextSummary.phase52CRunId === 'phase52c-20260605T134904' && input.manifest.evidenceContextSummary.editIntentCount >= 11, 'Canonical Phase 52C run phase52c-20260605T134904 provides the dry-run intents.'),
    gate('candidate_plan_generation', input.candidatePlans.length === 7, `Candidate approved-plan snapshots generated: ${input.candidatePlans.length}/7.`),
    gate('blocked_plan_generation', input.blockedPlans.length === 4, `Blocked/handoff records generated: ${input.blockedPlans.length}/4.`),
    gate('approved_plan_schema_compliance', input.scopeValidationBlockers.length === 0, input.scopeValidationBlockers[0] ?? 'Candidate and blocked records preserve rawPromptExecution=false, runtime=false, publicArtifact=false, signedUrl=false.'),
    gate('ownership_routing', input.candidatePlans.every((plan) => plan.selectedToolRoutes.length > 0) && input.blockedPlans.every((plan) => Boolean(plan.ownerRoute)), 'Every plan record has an explicit owner route.'),
    gate('producer_plan_gate', input.producerGateBlockers.length === 0, input.producerGateBlockers[0] ?? 'Producer gate keeps allowed records candidate_plan_only and blocked records handoff/blocked.'),
    gate('qa_plan_gate', input.qaPlanGateResults.every((result) => result.status === 'passed'), input.qaPlanGateResults.find((result) => result.status !== 'passed')?.summary ?? 'QA/Safety gate passed runtime absence and source-of-truth checks.'),
    gate('cross_track_handoffs', input.handoffPackets.length >= 7, `Cross-track handoff packets generated: ${input.handoffPackets.length}.`),
    gate('source_of_truth_policy', input.manifest.sourceOfTruthSummary.length >= 4, 'Source-of-truth rules are carried forward for web, map, video, graphics, audio, and Supabase metadata.'),
    gate('supabase_milestone_sync', input.executionMode ? input.supabaseSyncResult?.status === 'completed' : true, input.executionMode ? input.supabaseSyncResult?.blockers[0] ?? 'Phase 52D Supabase milestone sync completed.' : 'Static mode records Supabase sync as execution-only.'),
    gate(
      'blocked_features',
      scriptSummary &&
        docSummary &&
        !agentToolPlanBridgeSafetyFlags.toolRuntimeAllowed &&
        !agentToolPlanBridgeSafetyFlags.workerExecutionAllowed &&
        !agentToolPlanBridgeSafetyFlags.modelInferenceAllowed &&
        !agentToolPlanBridgeSafetyFlags.providerCallsAllowed &&
        !agentToolPlanBridgeSafetyFlags.webSearchAllowed &&
        !agentToolPlanBridgeSafetyFlags.mapRenderingAllowed &&
        !agentToolPlanBridgeSafetyFlags.productionReadyAllowed &&
        !agentToolPlanBridgeSafetyFlags.externalBetaAllowed &&
        !agentToolPlanBridgeSafetyFlags.broadMediaAllowed,
      'Package scripts/docs are present and runtime/provider/model/search/map/production/beta/broad-media paths remain blocked.',
    ),
  ]
  const blockers = gates.filter((item) => item.mandatory && !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers,
    warnings: input.executionMode ? input.repoOwnershipAudit.warnings : ['Supabase readback and artifact upload are verified only during confirmed execution.', ...input.repoOwnershipAudit.warnings],
  }
}

function gate(gateId: AgentToolPlanBridgeQaGate['gateId'], passed: boolean | undefined, summary: string): AgentToolPlanBridgeQaGate {
  return { gateId, passed: Boolean(passed), mandatory: true, summary }
}
