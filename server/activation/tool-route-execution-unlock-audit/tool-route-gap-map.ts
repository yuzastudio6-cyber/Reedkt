import type {
  ToolRouteGap,
  ToolRouteGapMap,
  ToolStudyOwnerPromptMap,
} from './tool-route-audit-types'

export function buildToolRouteGapMap(ownerPromptMap: ToolStudyOwnerPromptMap): ToolRouteGapMap {
  const activeBlockers = [...ownerPromptMap.activeBlockers]
  const gaps: ToolRouteGap[] = [
    {
      gapId: 'missing_tool_study_0_contracts',
      owner: 'tool-owning workstreams',
      status: 'blocked_until_tool_study_0',
      nextAction: 'Dispatch owner TOOL-STUDY-0 prompts and collect capability routing contracts before any execution planning.',
    },
    {
      gapId: 'missing_owner_acceptance',
      owner: 'all route family owners',
      status: 'blocked_until_owner_acceptance',
      nextAction: 'Each owner must accept route boundaries, inputs, outputs, safety gates, and blocked scope.',
    },
    {
      gapId: 'transactional_worker_runtime_not_approved',
      owner: 'WORKER_RUNTIME_JOBS',
      status: 'blocked_until_future_runtime_approval',
      nextAction: 'Keep real worker claim/lease execution blocked until a transactional service-role backend runtime is approved.',
    },
    {
      gapId: 'artifact_delivery_policy_not_unlocked',
      owner: 'COMPLIANCE_SECURITY',
      status: 'blocked_until_future_runtime_approval',
      nextAction: 'Keep public artifacts and signed URLs blocked until a future source-of-truth policy phase approves them.',
    },
  ]

  return {
    phase: 'TOOL_ROUTE_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    gaps,
    toolRoute1Readiness: activeBlockers.length > 0 ? 'blocked' : 'ready for route dry-run planning',
    activeBlockers,
  }
}
