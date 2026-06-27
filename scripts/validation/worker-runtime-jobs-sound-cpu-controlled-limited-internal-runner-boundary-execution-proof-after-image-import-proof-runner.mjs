import {
  acceptedToolIds,
  runProof as runPreflightProof
} from './worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-after-image-import-proof-runner.mjs'

const decision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_execution_proof_owner_review_after_image_import_proof'

export function runProof() {
  const proof = runPreflightProof()

  return {
    ...proof,
    status: proof.status,
    decision,
    sourcePr: 1224,
    sourceMergeCommit: 'b04e7f27520ed7c860690f709d54385c1ebb009f',
    sourceDecision:
      'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof',
    proofKind: 'controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof',
    upstreamPreflightProofDecision: proof.decision,
    acceptedToolCount: acceptedToolIds.length,
    controlledLimitedInternalRunnerBoundaryExecutionProof: proof.status === 'passed' ? 'passed' : 'failed',
    productToolCallExecution: 'no',
    workerExecution: 'no',
    routeExecution: 'no',
    mediaFileOpen: 'no',
    mediaProcessing: 'no',
    artifactWrites: 'no',
    supabaseSql: 'no',
    providerModelCalls: 'no',
    dockerGcp: 'no',
    internalBetaUnlock: 'no',
    externalBetaUnlock: 'no',
    productionUnlock: 'no'
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runProof(), null, 2))
}
