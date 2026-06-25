import {
  SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS,
  SOUND_CPU_SYNTHETIC_ROUTE_CONTRACTS,
  SOUND_CPU_SYNTHETIC_STATIC_RUNTIME_FLAGS,
  assertSoundCpuSyntheticRouteAccepted,
  resolveSoundCpuSyntheticRoute,
  type SoundCpuSyntheticRouteContract,
  type SoundCpuSyntheticRoutePayload,
} from '../../server/workers/sound-cpu/index'

const decision = 'sound_runtime_media_gate_2h_controlled_synthetic_route_execution_proof_passed_with_warnings_ready_for_proof_owner_review'
const sourceHead = '78500c700920dadbe4078ce8a852bc803c82c306'

function payloadFor(contract: SoundCpuSyntheticRouteContract, attempt: number): SoundCpuSyntheticRoutePayload {
  return {
    approvedPlanSnapshotId: `synthetic-approved-plan-${attempt}`,
    workspaceId: `synthetic-workspace-${attempt}`,
    projectId: `synthetic-project-${attempt}`,
    jobId: `synthetic-job-${attempt}`,
    idempotencyKey: `synthetic-idempotency-${contract.jobType}`,
    workerName: contract.workerName,
    imageName: contract.imageName,
    jobType: contract.jobType,
    attemptMetadata: {
      attempt,
      source: 'sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof',
      ownerReviewDecision: 'worker_runtime_jobs_sound_cpu_controlled_route_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_route_execution_proof',
    },
    syntheticFixtureDescriptor: contract.syntheticFixtureDescriptor,
    staticOnlyRuntimeFlags: { ...SOUND_CPU_SYNTHETIC_STATIC_RUNTIME_FLAGS },
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const acceptedResults = SOUND_CPU_SYNTHETIC_ROUTE_CONTRACTS.map((contract, index) => {
  const payload = payloadFor(contract, index + 1)
  const resolved = resolveSoundCpuSyntheticRoute(payload)
  assert(resolved.accepted, `valid synthetic route payload was rejected: ${contract.jobType}`)
  const asserted = assertSoundCpuSyntheticRouteAccepted(payload)
  assert(asserted.accepted, `asserted route payload was rejected: ${contract.jobType}`)
  return {
    jobType: asserted.jobType,
    workerName: asserted.workerName,
    imageName: asserted.imageName,
    syntheticFixtureDescriptor: asserted.syntheticFixtureDescriptor,
    decisionMode: asserted.decisionMode,
  }
})

const rejectedPayloadResults = SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS.map((field, index) => {
  const base = payloadFor(SOUND_CPU_SYNTHETIC_ROUTE_CONTRACTS[0], index + 10) as unknown as Record<string, unknown>
  base[field] = `blocked-${field}`
  const result = resolveSoundCpuSyntheticRoute(base)
  assert(!result.accepted, `unsafe payload field was accepted: ${field}`)
  assert(result.reason === 'rejected_payload_field', `unexpected rejection reason for ${field}: ${result.reason}`)
  assert(result.field === field, `unexpected rejected field for ${field}: ${result.field}`)
  return { field, reason: result.reason }
})

const mismatchCases = [
  { label: 'unsafe_runtime_flag', patch: { staticOnlyRuntimeFlags: { ...SOUND_CPU_SYNTHETIC_STATIC_RUNTIME_FLAGS, mediaProcessingEnabled: true } }, expectedReason: 'unsafe_runtime_flag' },
  { label: 'worker_mismatch', patch: { workerName: 'sound-audio-metadata-worker' }, expectedReason: 'worker_mismatch' },
  { label: 'image_mismatch', patch: { imageName: 'reeditpro/sound-audio-metadata-worker' }, expectedReason: 'image_mismatch' },
  { label: 'fixture_mismatch', patch: { syntheticFixtureDescriptor: 'unexpected-fixture' }, expectedReason: 'fixture_mismatch' },
  { label: 'unknown_job_type', patch: { jobType: 'sound.unknown_job_type' }, expectedReason: 'unknown_job_type' },
] as const

const mismatchResults = mismatchCases.map((testCase, index) => {
  const payload = {
    ...(payloadFor(SOUND_CPU_SYNTHETIC_ROUTE_CONTRACTS[0], index + 100) as unknown as Record<string, unknown>),
    ...testCase.patch,
  }
  const result = resolveSoundCpuSyntheticRoute(payload)
  assert(!result.accepted, `mismatch case was accepted: ${testCase.label}`)
  assert(result.reason === testCase.expectedReason, `unexpected mismatch reason for ${testCase.label}: ${result.reason}`)
  return { label: testCase.label, reason: result.reason, field: result.field ?? null }
})

const report = {
  status: 'sound_runtime_media_gate_2h_controlled_synthetic_route_execution_proof_passed',
  decision,
  sourceHead,
  proofMode: 'local_in_memory_synthetic_route_resolver_only',
  sourceImported: true,
  routeResolverImported: true,
  syntheticRouteResolverExecuted: true,
  serverRouteExecuted: false,
  workerDispatchRun: false,
  workerClaimRun: false,
  workerLeaseRun: false,
  workerExecutionRun: false,
  toolExecutionRun: false,
  mediaFileOpenRun: false,
  mediaProcessingRun: false,
  ffmpegRun: false,
  ffprobeRun: false,
  dockerBuildRun: false,
  dockerRun: false,
  dockerPush: false,
  gcpTouched: false,
  cloudRunTouched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  artifactCreated: false,
  signedUrlCreated: false,
  publicArtifactCreated: false,
  generatedLocalFixturePassedClaimed: false,
  dryRunPassedClaimed: false,
  runtimeReadinessClaimed: false,
  workerReadinessClaimed: false,
  mediaReadinessClaimed: false,
  routeContractCount: SOUND_CPU_SYNTHETIC_ROUTE_CONTRACTS.length,
  acceptedRouteResultCount: acceptedResults.length,
  rejectedPayloadFieldCount: SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS.length,
  rejectedPayloadCaseCount: rejectedPayloadResults.length,
  mismatchCaseCount: mismatchResults.length,
  acceptedResults,
  rejectedPayloadResults,
  mismatchResults,
}

console.log(JSON.stringify(report, null, 2))
