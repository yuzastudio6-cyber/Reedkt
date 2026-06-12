import type {
  WorkerDryRunArtifactScopeValidation,
  WorkerDryRunBlockedRouteValidation,
  WorkerDryRunClaimLeaseResult,
  WorkerDryRunEventLogPlan,
  WorkerDryRunGap,
  WorkerDryRunGapMap,
  WorkerDryRunSourceAudit,
  WorkerDryRunValidation,
} from './worker-approved-plan-dry-run-types'

export function buildWorkerDryRunGapMap(input: {
  sourceAudit: WorkerDryRunSourceAudit
  snapshotValidation: WorkerDryRunValidation
  claimLeaseResult: WorkerDryRunClaimLeaseResult
  artifactScopeValidation: WorkerDryRunArtifactScopeValidation
  blockedRouteValidation: WorkerDryRunBlockedRouteValidation
  eventLogPlan: WorkerDryRunEventLogPlan
}): WorkerDryRunGapMap {
  const activeBlockers = [
    ...input.sourceAudit.activeBlockers,
    ...input.snapshotValidation.activeBlockers,
    ...input.claimLeaseResult.activeBlockers,
    ...input.artifactScopeValidation.activeBlockers,
    ...input.blockedRouteValidation.activeBlockers,
    ...input.eventLogPlan.activeBlockers,
  ]
  const gaps: WorkerDryRunGap[] = [
    {
      id: 'transactional_worker_claim_rpc',
      area: 'claim_lease',
      severity: 'future_blocker',
      status: 'must_resolve_before_real_runtime',
      description: 'Real worker claims remain blocked until transactional RPC/backend runtime is approved.',
      nextPhaseHandling: 'TOOL-ROUTE-0 must audit routes only and must not attempt worker claims.',
    },
    {
      id: 'tool_owner_studies_required',
      area: 'tool_routes',
      severity: 'dry_run_constraint',
      status: 'bounded_for_tool_route_0_audit',
      description: 'Tool execution requires tool-owner studies/capability routing and owner acceptance.',
      nextPhaseHandling: 'TOOL-ROUTE-0 audits mapping and gaps without executing tools or routes.',
    },
    {
      id: 'supabase_milestone_sync_absent',
      area: 'supabase',
      severity: 'documentation',
      status: 'documented',
      description: 'The current branch lacks server/activation/supabase-milestone-sync.',
      nextPhaseHandling: 'Record milestone sync as not attempted unless a later branch imports the approved layer.',
    },
    {
      id: 'event_log_persistence_not_attempted',
      area: 'event_log',
      severity: 'dry_run_constraint',
      status: 'bounded_for_tool_route_0_audit',
      description: 'Event-log entries are local/private plan evidence only and are not written to job_events or event_log.',
      nextPhaseHandling: 'Future runtime must define service-role event persistence before real execution.',
    },
    {
      id: 'public_artifact_signed_url_policy_blocked',
      area: 'artifact_scope',
      severity: 'future_blocker',
      status: 'must_resolve_before_real_runtime',
      description: 'Public artifacts and signed URL source-of-truth flows remain blocked.',
      nextPhaseHandling: 'TOOL-ROUTE-0 keeps private gs:// refs only.',
    },
  ]

  return {
    phase: 'WORKER_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    toolRoute0Readiness: activeBlockers.length > 0 ? 'blocked' : 'ready for tool-route execution unlock audit',
    gaps,
    activeBlockers,
  }
}
