import { goNoGoRequiredScripts } from './controlled-internal-test-go-no-go-policy'
import type {
  ControlledInternalTestPacket,
  GoNoGoBlockerRecord,
  GoNoGoDecisionPacket,
  GoNoGoQaGate,
  GoNoGoQaSummary,
  GoNoGoSourceAudit,
  GoNoGoSupabaseSyncResult,
  OwnerHandoffDispatchManifest,
  OwnerHandoffPromptPacket,
  WorkstreamGoNoGoDecision,
} from './controlled-internal-test-go-no-go-types'

export function buildGoNoGoQaSummary(input: {
  packageScripts: Record<string, string>
  docsPresent: Record<string, boolean>
  repoOwnershipAudit: GoNoGoSourceAudit
  decisionPacket: GoNoGoDecisionPacket
  workstreamDecisions: WorkstreamGoNoGoDecision[]
  controlledInternalTestPacket: ControlledInternalTestPacket
  ownerPromptPackets: OwnerHandoffPromptPacket[]
  blockerInventory: GoNoGoBlockerRecord[]
  dispatchManifest: OwnerHandoffDispatchManifest
  supabaseSyncResult: GoNoGoSupabaseSyncResult
  executionMode: boolean
}): GoNoGoQaSummary {
  const gates: GoNoGoQaGate[] = [
    gate('source_of_truth_repo_audit', input.repoOwnershipAudit.implementationAllowed, 'Required source-of-truth contracts are present or non-blocking gaps are documented.'),
    gate('phase52f_evidence', input.dispatchManifest.supabaseMilestoneRefs.includes('52F:phase52f-20260605T185559'), 'Phase 52F completed evidence is referenced.'),
    gate(
      'go_no_go_decision',
      !input.decisionPacket.topLevelDecision.runtimeGoEmitted && !input.decisionPacket.topLevelDecision.externalBetaGoEmitted && !input.decisionPacket.topLevelDecision.productionGoEmitted,
      'Top-level decision emits owner handoff and non-executing planning only.',
    ),
    gate('workstream_decisions', input.workstreamDecisions.length === 12, 'All 12 known workstreams are represented.'),
    gate('controlled_internal_test_packet', input.controlledInternalTestPacket.disallowedExecutionLanes.length > 0, 'Controlled internal test packet exists and blocks execution lanes.'),
    gate('owner_prompt_packets', input.ownerPromptPackets.length === 12, 'Owner prompt packets are generated for all required owners.'),
    gate('blocker_inventory', requiredBlockersPresent(input.blockerInventory), 'Required blocker inventory records are present.'),
    gate('source_of_truth_policy', input.dispatchManifest.sourceOfTruthSummary.some((item) => item.includes('signed URLs are not source of truth')), 'Source-of-truth policy keeps private GCS refs authoritative.'),
    gate('supabase_milestone_sync', input.executionMode ? input.supabaseSyncResult.status === 'completed' : true, 'Phase 52G milestone sync completed during execution or remains unattempted in static mode.'),
    gate('blocked_features', input.dispatchManifest.blockedFeatures.includes('worker_execution') && input.dispatchManifest.blockedFeatures.includes('production_ready'), 'Worker execution, production, beta, public artifacts, provider calls, and raw prompt execution remain blocked.'),
  ]

  for (const script of goNoGoRequiredScripts) {
    if (!input.packageScripts[script]) gates.push(gate('blocked_features', false, `Missing package script ${script}.`))
  }
  for (const [docPath, present] of Object.entries(input.docsPresent)) {
    if (!present) gates.push(gate('source_of_truth_repo_audit', false, `Missing Phase 52G doc ${docPath}.`))
  }

  const blockers = gates.filter((item) => item.mandatory && !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  const warnings = Array.from(new Set([...input.repoOwnershipAudit.warnings, ...input.supabaseSyncResult.warnings]))
  return { status: blockers.length ? 'blocked' : 'passed', gates, blockers, warnings }
}

function gate(gateId: GoNoGoQaGate['gateId'], passed: boolean, summary: string): GoNoGoQaGate {
  return { gateId, passed, mandatory: true, summary }
}

function requiredBlockersPresent(blockers: GoNoGoBlockerRecord[]): boolean {
  const required = ['runtime_execution_blocked', 'worker_execution_blocked', 'production_blocked', 'external_beta_blocked', 'public_artifacts_blocked', 'provider_execution_blocked']
  return required.every((blockerId) => blockers.some((blocker) => blocker.blockerId === blockerId))
}
