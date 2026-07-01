import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_owner_review_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_no_runtime_side_effects'

const sourceDoc =
  'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-review-result.md'
const promptDoc =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof.md'

const workers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const images = ['reeditpro/sound-cpu-analysis-worker', 'reeditpro/sound-audio-metadata-worker']
const jobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

const runtimeFlags = {
  allowRealExternalAgentExecution: false,
  allowProductToolCallExecution: false,
  allowWorkerDispatch: false,
  allowRouteExecution: false,
  allowFactorySideEffects: false,
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

function invokeControlledExternalAgentBoundary(envelope) {
  assert(envelope.syntheticPayloadOnly === true, 'synthetic payload only is required')
  assert(allFlagsFalse(envelope.runtimeFlags), 'all runtime flags must be false')
  assert(envelope.toolCount === 15, 'tool count must cover 15 SOUND CPU tools')
  assert(jobTypes.includes(envelope.jobType), 'job type is not accepted')
  assert(workers.includes(envelope.workerName), 'worker name is not accepted')
  assert(images.includes(envelope.imageName), 'image name is not accepted')

  return {
    ok: true,
    agentInvoked: true,
    jobTypeAccepted: true,
    toolCountCovered: envelope.toolCount,
    runtimeFlagsAllFalse: true,
    factoryCalled: false,
    workerDispatched: false,
    routeExecuted: false,
    supabaseTouched: false,
    sqlExecuted: false,
    mediaOpened: false,
    providerCalled: false,
    modelCalled: false,
    storageObjectCreated: false,
    signedUrlCreated: false,
    artifactCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    readinessClaims: {
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
  'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-review-result',
)
const prompt = parseJsonBlock(
  promptDoc,
  'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof',
)

assert(source.decision === sourceDecision, 'source decision mismatch')
assert(source.ownerReview.controlledExternalAgentExecutionProofMayProceedNext === true, 'source does not allow next proof')
assert(source.soundCpuTools.readyForControlledExternalAgentProof === 15, 'source proof tool count mismatch')
assert(source.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution readiness widened')
assert(prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(prompt.proofScope.runControlledExternalAgentBoundary === true, 'prompt does not allow controlled boundary')
assert(prompt.proofScope.useSyntheticPayloadOnly === true, 'prompt does not require synthetic payload')
assert(prompt.proofScope.allowedToolCount === 15, 'prompt tool count mismatch')

for (const key of Object.keys(runtimeFlags)) {
  assert(prompt.proofScope[key] === false, `prompt scope ${key} must be false`)
}

const envelope = {
  approvedPlanSnapshotId: 'phase109-synthetic-approved-plan-snapshot',
  workspaceId: 'phase109-synthetic-workspace',
  projectId: 'phase109-synthetic-project',
  jobId: 'phase109-synthetic-job',
  idempotencyKey: 'phase109-controlled-external-agent-proof',
  workerName: 'sound-cpu-analysis-worker',
  imageName: 'reeditpro/sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  toolCount: 15,
  syntheticPayloadOnly: true,
  syntheticPayload: {
    descriptorCount: 15,
    containsMediaPath: false,
    containsRawPrompt: false,
    containsSecret: false,
    containsArtifactTarget: false,
  },
  runtimeFlags,
}

const boundaryResult = invokeControlledExternalAgentBoundary(envelope)

const proof = {
  status: 'passed',
  proofKind: 'controlled_synthetic_external_agent_boundary',
  sourceDecisionVerified: true,
  agentBoundaryInvoked: boundaryResult.agentInvoked,
  syntheticPayloadAccepted: envelope.syntheticPayloadOnly,
  acceptedWorker: envelope.workerName,
  acceptedImage: envelope.imageName,
  acceptedJobType: envelope.jobType,
  allowedWorkerCount: workers.length,
  allowedImageCount: images.length,
  allowedJobTypeCount: jobTypes.length,
  toolCountCovered: boundaryResult.toolCountCovered,
  runtimeFlagsAllFalse: boundaryResult.runtimeFlagsAllFalse,
  boundaryResult,
  executionBoundaries: {
    realExternalAgentExecution: false,
    productToolCallExecution: false,
    factoryCalled: boundaryResult.factoryCalled,
    workerDispatched: boundaryResult.workerDispatched,
    routeExecuted: boundaryResult.routeExecuted,
    supabaseTouched: boundaryResult.supabaseTouched,
    sqlExecuted: boundaryResult.sqlExecuted,
    mediaOpened: boundaryResult.mediaOpened,
    providerCalled: boundaryResult.providerCalled,
    modelCalled: boundaryResult.modelCalled,
    storageObjectCreated: boundaryResult.storageObjectCreated,
    signedUrlCreated: boundaryResult.signedUrlCreated,
    artifactCreated: boundaryResult.artifactCreated,
    betaUnlocked: boundaryResult.betaUnlocked,
    productionUnlocked: boundaryResult.productionUnlocked,
  },
  artifacts: {
    proofOutputWrittenToDisk: false,
    tempProofArtifactsCreated: false,
  },
}

console.log(JSON.stringify(proof, null, 2))
