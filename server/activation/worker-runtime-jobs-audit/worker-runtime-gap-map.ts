import type {
  ApprovedPlanIntakeAudit,
  WorkerArtifactScopeAudit,
  WorkerClaimLeaseAudit,
  WorkerEventLogAudit,
  WorkerRuntimeGap,
  WorkerRuntimeGapMap,
  WorkerRuntimeSourceAudit,
  WorkerSchemaAudit,
} from './worker-runtime-audit-types'

export function buildWorkerRuntimeGapMap(input: {
  sourceAudit: WorkerRuntimeSourceAudit
  workerSchemaAudit: WorkerSchemaAudit
  approvedPlanIntakeAudit: ApprovedPlanIntakeAudit
  workerClaimLeaseAudit: WorkerClaimLeaseAudit
  workerArtifactScopeAudit: WorkerArtifactScopeAudit
  workerEventLogAudit: WorkerEventLogAudit
}): WorkerRuntimeGapMap {
  const blockingInputs = [
    ...input.sourceAudit.activeBlockers,
    ...input.workerSchemaAudit.activeBlockers,
    ...input.approvedPlanIntakeAudit.activeBlockers,
    ...input.workerArtifactScopeAudit.activeBlockers,
    ...input.workerEventLogAudit.activeBlockers,
  ]
  const gaps: WorkerRuntimeGap[] = [
    {
      id: 'approved_snapshot_persistence_runtime_write',
      area: 'approved_plan_intake',
      severity: 'future_blocker',
      status: 'must_resolve_before_real_runtime',
      description: 'Candidate PLAN-SNAPSHOT-1 evidence is review-only; real approved snapshot persistence remains future backend work.',
      worker1Handling: 'Use committed candidate evidence as immutable input for dry-run simulation only.',
    },
    {
      id: 'transactional_worker_claim_rpc',
      area: 'worker_claim_lease',
      severity: 'future_blocker',
      status: 'must_resolve_before_real_runtime',
      description: 'Server worker claim service records transaction/RPC race-window TODOs.',
      worker1Handling: 'Simulate claim/lease transitions without concurrent real workers or service-role mutation.',
    },
    {
      id: 'heartbeat_and_lease_enforcement',
      area: 'worker_claim_lease',
      severity: 'future_blocker',
      status: 'must_resolve_before_real_runtime',
      description: 'Lease heartbeat and stale-claim enforcement are mock/local boundaries until Worker Runtime service execution is approved.',
      worker1Handling: 'Dry-run heartbeat states as local JSON evidence; do not dispatch workers.',
    },
    {
      id: 'artifact_checksum_and_storage_enforcement',
      area: 'private_artifact_scope',
      severity: 'dry_run_constraint',
      status: 'bounded_for_worker1_dry_run',
      description: 'Storage object records exist locally, but real storage checksum enforcement is not exercised in WORKER-0.',
      worker1Handling: 'Record private gs:// refs and checksum expectations in simulated manifests only.',
    },
    {
      id: 'supabase_milestone_sync_absent_on_current_branch',
      area: 'source_of_truth',
      severity: 'documentation',
      status: 'documented',
      description: 'server/activation/supabase-milestone-sync is absent on the PLAN-SNAPSHOT-1 base.',
      worker1Handling: 'Record milestone sync as not attempted unless a later branch explicitly imports the approved sync layer.',
    },
    {
      id: 'tool_owner_handoffs_review_only',
      area: 'worker1_next_phase',
      severity: 'dry_run_constraint',
      status: 'bounded_for_worker1_dry_run',
      description: 'Owner routes exist for review, but tools/routes/providers/workers remain non-executing.',
      worker1Handling: 'Model owner handoffs as review states and do not call tool, provider, route, or worker code.',
    },
    {
      id: 'event_log_dry_run_only',
      area: 'job_event_log',
      severity: 'dry_run_constraint',
      status: 'bounded_for_worker1_dry_run',
      description: 'Job event and agent output tables exist locally, but WORKER-1 must not write live event rows without a later approval.',
      worker1Handling: 'Generate local sanitized event-log simulation artifacts only.',
    },
  ]
  const activeBlockers = [
    ...blockingInputs,
    ...input.workerClaimLeaseAudit.activeBlockers,
  ]

  return {
    phase: 'WORKER_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    worker1Readiness: activeBlockers.length > 0 ? 'blocked' : 'ready for approved-plan snapshot dry-run',
    gaps,
    activeBlockers,
  }
}
