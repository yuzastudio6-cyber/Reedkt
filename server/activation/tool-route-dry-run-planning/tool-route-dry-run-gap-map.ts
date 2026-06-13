import type {
  ToolRouteDryRunGap,
  ToolRouteDryRunGapMap,
  ToolRouteQaGateMap,
} from './tool-route-dry-run-planning-types'

export function buildToolRouteDryRunGapMap(qaGateMap: ToolRouteQaGateMap): ToolRouteDryRunGapMap {
  const gaps: ToolRouteDryRunGap[] = [
    {
      gapId: 'generated_local_fixture_route_planning',
      owner: 'WORKER_RUNTIME_JOBS',
      status: qaGateMap.allRequiredGatesPassed ? 'ready_for_fixture_planning' : 'blocked_until_future_phase',
      nextAction: 'Use TOOL-ROUTE-2 to plan generated local fixtures without executing tools or workers.',
    },
    {
      gapId: 'runtime_execution_approval',
      owner: 'COMPLIANCE_SECURITY',
      status: 'blocked_until_future_phase',
      nextAction: 'Keep runtime/tool/worker/provider execution blocked until explicit runtime approval phase.',
    },
    {
      gapId: 'supabase_sync_layer_absent',
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      status: 'blocked_until_future_phase',
      nextAction: 'Do not add a Supabase writer in TOOL-ROUTE-1; record missing sync layer only.',
    },
    {
      gapId: 'artifact_checksum_enforcement',
      owner: 'OBSERVABILITY_AUDIT_COST',
      status: 'blocked_until_future_phase',
      nextAction: 'Future phases must bind generated fixture refs to checksums before any runtime path.',
    },
    {
      gapId: 'billing_credit_runtime',
      owner: 'BILLING_STRIPE_CREDITS',
      status: 'blocked_until_future_phase',
      nextAction: 'Keep credit and Stripe mutation blocked until billing runtime approval.',
    },
  ]
  const activeBlockers = [...qaGateMap.activeBlockers]

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    gaps,
    toolRoute2Readiness: activeBlockers.length > 0
      ? 'blocked'
      : 'ready_for_TOOL_ROUTE_2_generated_local_fixture_planning',
    activeBlockers,
  }
}
