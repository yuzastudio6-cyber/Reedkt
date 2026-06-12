import type {
  WorkerDryRunEvidenceContext,
  WorkerDryRunValidation,
} from './worker-approved-plan-dry-run-types'

export function validateApprovedPlanSnapshotForDryRun(
  context: WorkerDryRunEvidenceContext,
): WorkerDryRunValidation {
  const snapshot = context.candidateSnapshot
  const activeBlockers = [...context.activeBlockers]
  const requiredFieldsPresent = snapshot.planId !== 'missing' &&
    snapshot.selectedIntents.length === 4 &&
    snapshot.implementationProposalRefs.length > 0 &&
    snapshot.ownerRoutes.length > 0
  const executionFlagsAllFalse = [
    snapshot.approvedForRuntime,
    snapshot.workerExecutionAllowed,
    snapshot.toolExecutionAllowed,
    snapshot.routeExecutionAllowed,
    snapshot.providerExecutionAllowed,
    snapshot.publicArtifactAllowed,
    snapshot.signedUrlSourceOfTruthAllowed,
    snapshot.rawPromptExecution,
    snapshot.productionReadyAllowed,
    snapshot.externalBetaAllowed,
    snapshot.broadMediaAllowed,
  ].every((value) => value === false)

  if (snapshot.executionStatus !== 'candidate_only') {
    activeBlockers.push(`invalid_execution_status:${snapshot.executionStatus}`)
  }
  if (!requiredFieldsPresent) activeBlockers.push('candidate_snapshot_missing_required_dry_run_fields')
  if (!executionFlagsAllFalse) activeBlockers.push('candidate_snapshot_has_unsafe_execution_flag')
  if (snapshot.selectedIntents.some((intent) => intent.executionAllowed || intent.routeExecutionAllowed)) {
    activeBlockers.push('selected_intent_claims_execution_allowed')
  }
  if (snapshot.implementationProposalRefs.some((proposal) => proposal.executionAllowed)) {
    activeBlockers.push('implementation_proposal_claims_execution_allowed')
  }
  if (snapshot.ownerRoutes.some((route) => route.executionAllowed || route.runtimeReady)) {
    activeBlockers.push('owner_route_claims_runtime_ready')
  }

  return {
    phase: 'WORKER_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    acceptedForDryRunOnly: activeBlockers.length === 0,
    realWorkerValidationInvoked: false,
    requiredFieldsPresent,
    executionFlagsAllFalse,
    activeBlockers,
  }
}
