import type {
  WorkerDryRunArtifactScopeValidation,
  WorkerDryRunEvidenceContext,
  WorkerDryRunJobBatchPlan,
} from './worker-approved-plan-dry-run-types'

export function validateWorkerDryRunArtifactScope(input: {
  evidence: WorkerDryRunEvidenceContext
  jobBatchPlan: WorkerDryRunJobBatchPlan
}): WorkerDryRunArtifactScopeValidation {
  const activeBlockers: string[] = []
  const scopes = input.jobBatchPlan.artifactScopes
  const privateGsPrefixesOnly = scopes.every((scope) =>
    scope.privateOnly && scope.gcsPrefix.startsWith('gs://reeditpro-staging-reeditpro-') &&
    scope.gcsPrefix.includes('/activation-worker-runtime/worker1/'),
  )
  const noPublicArtifacts = scopes.every((scope) => scope.publicArtifactAllowed === false) &&
    input.evidence.candidateSnapshot.publicArtifactAllowed === false
  const noSignedUrlSourceOfTruth = scopes.every((scope) => scope.signedUrlSourceOfTruthAllowed === false) &&
    input.evidence.candidateSnapshot.signedUrlSourceOfTruthAllowed === false
  const manifestRequired = scopes.every((scope) => scope.manifestRequired)
  const checksumRequired = scopes.every((scope) => scope.checksumRequired)
  const cleanupRollbackRequired = scopes.every((scope) => scope.cleanupRollbackRequired)
  const ownerRouteRequired = scopes.every((scope) => scope.ownerRoute !== 'missing' && scope.ownerRoute.length > 0)

  if (!privateGsPrefixesOnly) activeBlockers.push('artifact_scope_not_private_worker1_gs_prefix')
  if (!noPublicArtifacts) activeBlockers.push('artifact_scope_allows_public_artifacts')
  if (!noSignedUrlSourceOfTruth) activeBlockers.push('artifact_scope_allows_signed_url_source_of_truth')
  if (!manifestRequired) activeBlockers.push('artifact_scope_missing_manifest_requirement')
  if (!checksumRequired) activeBlockers.push('artifact_scope_missing_checksum_requirement')
  if (!cleanupRollbackRequired) activeBlockers.push('artifact_scope_missing_cleanup_rollback_requirement')
  if (!ownerRouteRequired) activeBlockers.push('artifact_scope_missing_owner_route')

  return {
    phase: 'WORKER_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    privateGsPrefixesOnly,
    noPublicArtifacts,
    noSignedUrlSourceOfTruth,
    manifestRequired,
    checksumRequired,
    cleanupRollbackRequired,
    ownerRouteRequired,
    activeBlockers,
  }
}
