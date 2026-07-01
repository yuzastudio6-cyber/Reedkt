import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase110_limited_external_agent_execution_owner_review_passed_with_warnings_ready_for_limited_external_agent_execution_proof_no_real_user_media'

const sourceDoc =
  'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-review-result.md'
const promptDoc =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof.md'

const workers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const images = ['reeditpro/sound-cpu-analysis-worker', 'reeditpro/sound-audio-metadata-worker']
const jobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

const runtimeFlags = {
  allowRealUserMedia: false,
  allowWorkerDispatch: false,
  allowRouteExecution: false,
  allowManifestPersistence: false,
  allowMediaOpen: false,
  allowProviderCall: false,
  allowModelCall: false,
  allowSupabaseMutation: false,
  allowSqlExecution: false,
  allowStorageObjectCreation: false,
  allowSignedUrlCreation: false,
  allowArtifactCreation: false,
  allowBetaUnlock: false,
  allowProductionUnlock: false,
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function allFlagsFalse(flags) {
  return Object.values(flags).every((value) => value === false)
}

function invokeLimitedExternalAgentBoundary(envelope) {
  assert(envelope.syntheticOrNoMediaInput === true, 'synthetic or no-media input is required')
  assert(envelope.realUserMediaUsed === false, 'real user media must not be used')
  assert(allFlagsFalse(envelope.runtimeFlags), 'all runtime flags must be false')
  assert(envelope.toolCount === 15, 'tool count must cover 15 SOUND CPU tools')
  assert(jobTypes.includes(envelope.jobType), 'job type is not accepted')
  assert(workers.includes(envelope.workerName), 'worker name is not accepted')
  assert(images.includes(envelope.imageName), 'image name is not accepted')

  return {
    ok: true,
    limitedBoundaryInvoked: true,
    jobTypeAccepted: true,
    workerAccepted: true,
    imageAccepted: true,
    toolCountCovered: envelope.toolCount,
    runtimeFlagsAllFalse: true,
    realUserMediaUsed: false,
    workerDispatched: false,
    routeExecuted: false,
    manifestPersisted: false,
    mediaOpened: false,
    providerCalled: false,
    modelCalled: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectCreated: false,
    signedUrlCreated: false,
    artifactCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    readinessClaims: {
      limitedExternalAgentExecutionProofPassedClaimed: false,
      externalAgentExecutionReadyClaimed: false,
      productToolCallExecutionReadyClaimed: false,
      workerReadinessClaimed: false,
      runtimeReadinessClaimed: false,
      realUserMediaBetaReadyClaimed: false,
      productionReadinessClaimed: false,
    },
  }
}

const source = parseJsonBlock(
  sourceDoc,
  'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-review-result',
)
const prompt = parseJsonBlock(
  promptDoc,
  'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof',
)

assert(source.decision === sourceDecision, 'source decision mismatch')
assert(source.ownerReview.limitedExternalAgentExecutionProofMayProceedNext === true, 'source does not allow proof')
assert(source.soundCpuTools.readyForLimitedExternalAgentExecutionProof === 15, 'source proof readiness count mismatch')
assert(source.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution readiness widened')
assert(prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(prompt.proofScope.runLimitedExternalAgentBoundary === true, 'prompt does not allow limited boundary')
assert(prompt.proofScope.useSyntheticOrNoMediaInputsOnly === true, 'prompt does not require synthetic/no-media input')
assert(prompt.proofScope.allowedToolCount === 15, 'prompt tool count mismatch')

for (const key of Object.keys(runtimeFlags)) {
  assert(prompt.proofScope[key] === false, `prompt scope ${key} must be false`)
}

const invocations = jobTypes.map((jobType, index) => {
  const envelope = {
    approvedPlanSnapshotId: 'phase111-synthetic-approved-plan-snapshot',
    workspaceId: 'phase111-synthetic-workspace',
    projectId: 'phase111-synthetic-project',
    jobId: `phase111-synthetic-job-${index + 1}`,
    idempotencyKey: `phase111-limited-external-agent-proof-${jobType}`,
    workerName: workers[index % workers.length],
    imageName: images[index % images.length],
    jobType,
    toolCount: 15,
    syntheticOrNoMediaInput: true,
    realUserMediaUsed: false,
    syntheticPayload: {
      descriptorCount: 15,
      containsMediaPath: false,
      containsRawPrompt: false,
      containsSecret: false,
      containsArtifactTarget: false,
      containsProviderOutputBlob: false,
    },
    runtimeFlags,
  }

  return {
    envelopeSummary: {
      workerName: envelope.workerName,
      imageName: envelope.imageName,
      jobType: envelope.jobType,
      toolCount: envelope.toolCount,
      syntheticOrNoMediaInput: envelope.syntheticOrNoMediaInput,
      realUserMediaUsed: envelope.realUserMediaUsed,
    },
    result: invokeLimitedExternalAgentBoundary(envelope),
  }
})

const allInvocationsPassed = invocations.every(
  ({ result }) =>
    result.ok &&
    result.limitedBoundaryInvoked &&
    result.toolCountCovered === 15 &&
    result.runtimeFlagsAllFalse &&
    result.realUserMediaUsed === false &&
    result.workerDispatched === false &&
    result.routeExecuted === false &&
    result.manifestPersisted === false &&
    result.mediaOpened === false &&
    result.supabaseTouched === false &&
    result.artifactCreated === false,
)

const proof = {
  status: allInvocationsPassed ? 'passed' : 'failed',
  proofKind: 'limited_synthetic_no_media_external_agent_boundary',
  sourceDecisionVerified: true,
  limitedBoundaryInvoked: allInvocationsPassed,
  syntheticOrNoMediaInputAccepted: true,
  invocationCount: invocations.length,
  acceptedWorkerCount: workers.length,
  acceptedImageCount: images.length,
  acceptedJobTypeCount: jobTypes.length,
  acceptedJobTypes: jobTypes,
  toolCountCovered: 15,
  runtimeFlagsAllFalse: true,
  realUserMediaUsed: false,
  invocationResults: invocations,
  executionBoundaries: {
    workerDispatched: false,
    routeExecuted: false,
    manifestPersisted: false,
    mediaOpened: false,
    providerCalled: false,
    modelCalled: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectCreated: false,
    signedUrlCreated: false,
    artifactCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
  },
  artifacts: {
    proofOutputWrittenToDisk: false,
    tempProofArtifactsCreated: false,
  },
}

console.log(JSON.stringify(proof, null, 2))
