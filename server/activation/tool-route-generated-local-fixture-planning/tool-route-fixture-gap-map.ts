import type {
  FixtureQaGateMap,
  ToolRouteFixtureGap,
  ToolRouteFixtureGapMap,
  ToolRouteFixtureOwner,
} from './tool-route-fixture-planning-types'

const GAPS: Array<{
  gapId: string
  owner: ToolRouteFixtureOwner
  nextAction: string
}> = [
  {
    gapId: 'generated_local_fixture_contract_tests',
    owner: 'WORKER_RUNTIME_JOBS',
    nextAction: 'Implement TOOL-ROUTE-3 contract tests against synthetic local manifests only.',
  },
  {
    gapId: 'owner_fixture_review_signoff',
    owner: 'COMPLIANCE_SECURITY',
    nextAction: 'Require owner review before any future fixture execution or runtime work.',
  },
  {
    gapId: 'runtime_execution_gate',
    owner: 'WORKER_RUNTIME_JOBS',
    nextAction: 'Keep runtime/tool/worker/provider execution blocked until a separate execution milestone.',
  },
  {
    gapId: 'supabase_sync_layer_absent',
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    nextAction: 'No Supabase writer is added in TOOL-ROUTE-2; sync remains blocked_current_branch_missing_sync_layer.',
  },
]

export function buildToolRouteFixtureGapMap(qaGateMap: FixtureQaGateMap): ToolRouteFixtureGapMap {
  const gaps: ToolRouteFixtureGap[] = GAPS.map((gap) => ({
    ...gap,
    status: qaGateMap.allRequiredGatesPassed ? 'ready_for_contract_tests' : 'blocked_until_future_phase',
  }))
  return {
    phase: 'TOOL_ROUTE_2',
    status: qaGateMap.allRequiredGatesPassed ? 'passed' : 'blocked',
    gaps,
    toolRoute3Readiness: qaGateMap.allRequiredGatesPassed
      ? 'ready_for_TOOL_ROUTE_3_generated_local_fixture_contract_tests'
      : 'blocked',
    activeBlockers: qaGateMap.activeBlockers,
  }
}
