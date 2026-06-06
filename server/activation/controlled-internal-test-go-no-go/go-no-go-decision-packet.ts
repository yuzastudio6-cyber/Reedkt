import type { GoNoGoDecisionPacket, WorkstreamGoNoGoDecision } from './controlled-internal-test-go-no-go-types'

export function buildGoNoGoDecisionPacket(runId: string, workstreamDecisions: WorkstreamGoNoGoDecision[]): GoNoGoDecisionPacket {
  return {
    packetId: 'phase52g_controlled_internal_test_go_no_go_decision',
    runId,
    phase: '52G',
    topLevelDecision: {
      positive: ['go_for_owner_handoff', 'conditional_go_for_non_executing_internal_test_plan'],
      blocked: ['no_go_for_runtime_execution', 'no_go_for_external_beta', 'no_go_for_production'],
      runtimeGoEmitted: false,
      externalBetaGoEmitted: false,
      productionGoEmitted: false,
    },
    workstreamDecisions,
    rationale: [
      'Phase 52F completed QA and Supabase milestone sync, so Phase 52G may dispatch controlled owner handoffs.',
      'Every go decision is limited to planning/handoff; runtime, external beta, and production are explicitly no-go.',
      'Owner workstreams must respond with their own readiness evidence before future execution gates can be considered.',
    ],
  }
}
