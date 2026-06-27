#!/usr/bin/env node
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const exists = (path) => fs.existsSync(path)
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const parseJsonBlock = (path, label) => {
  const text = read(path)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${path}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${path}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result.md',
  build: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-build-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-probe-blocker-register.md',
  cleanup: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-image-cleanup-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result-claim-policy.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result-next-step-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-plan.md',
  sourceCommandPlan: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-command-plan.md',
  dockerfile: 'server/workers/sound-cpu/Dockerfile',
  requirements: 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt',
  packageJson: 'package.json'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_blocked_probe_invocation_no_output_ready_for_fix'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof'
const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result')
const build = parseJsonBlock(files.build, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-build-register')
const blocker = parseJsonBlock(files.blocker, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-probe-blocker-register')
const cleanup = parseJsonBlock(files.cleanup, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-image-cleanup-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result-claim-policy')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result-next-step-register')
const sourcePlan = parseJsonBlock(files.sourcePlan, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-plan')
const sourceCommandPlan = parseJsonBlock(files.sourceCommandPlan, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-command-plan')

assert(result.decision === decision, 'unexpected result decision')
assert(result.sourceVerification.sourceHead === '1365e0db50c554491f741089128e87465b6ef85b', 'unexpected source head')
assert(result.sourceVerification.pr1137.status === 'merged', 'PR #1137 must be merged')
assert(result.sourceVerification.pr1137.decision === sourceDecision, 'PR #1137 decision mismatch')
assert(result.proofResult.dockerVersion === '29.5.2', 'Docker version mismatch')
assert(result.proofResult.dockerDaemonAvailable === true, 'Docker daemon must be available')
assert(result.proofResult.dockerBuildPassed === true, 'Docker build must pass')
assert(result.proofResult.dockerRunInvoked === true, 'Docker run invocation must be recorded')
assert(result.proofResult.dockerRunNetwork === 'none', 'Docker run must be networkless')
assert(result.proofResult.probeJsonProduced === false, 'probe JSON must be false for this blocker')
assert(result.proofResult.metadataPassedCount === 0, 'metadata count must not be claimed')
assert(result.proofResult.importPassedCount === 0, 'import count must not be claimed')
assert(result.proofResult.imageInspectPassed === true, 'image inspect must pass')
assert(result.proofResult.imageRemoved === true, 'image removal must pass')
assert(result.proofResult.containerRuntimeImportProofPassed === false, 'container proof must not pass')
assert(result.proofResult.productToolCallExecutionReadyCount === 0, 'product tool-call readiness must be zero')
assert(result.proofResult.externalBetaReadyCount === 0, 'external beta readiness must be zero')
assert(result.proofResult.productionReadyCount === 0, 'production readiness must be zero')
assert(result.proofResult.blocker === 'probe_invocation_no_output_due_missing_stdin_attachment', 'blocker mismatch')

assert(build.buildEvidence.buildPassed === true, 'build register must record pass')
assert(build.buildEvidence.pipInstallLayerPassed === true, 'pip layer must pass')
assert(build.buildEvidence.dockerPushAttempted === false, 'Docker push must be false')
assert(build.buildEvidence.gcpCloudRunAttempted === false, 'GCP must be false')

assert(blocker.blockingFailure.status === 'blocked_for_fix', 'blocker status mismatch')
assert(blocker.blockingFailure.dockerRunExitCode === 0, 'docker run exit code must be recorded')
assert(blocker.blockingFailure.probeJsonProduced === false, 'blocker must record no JSON')
assert(blocker.blockingFailure.metadataImportsProven === false, 'metadata imports must be unproven')
assert(blocker.fixRequirements.some((line) => line.includes('docker run -i')), 'fix must require docker run -i')

assert(cleanup.imageMetadata.imageId === 'sha256:bade0b2adf0598a8d265017db101d013821dd6e7427f6b49328518d1fb074161', 'image id mismatch')
assert(cleanup.imageMetadata.sizeBytes === 333378210, 'image size mismatch')
assert(cleanup.imageMetadata.user === 'reeditpro', 'image user mismatch')
assert(cleanup.imageMetadata.runtimeDisabledEnvVerified === true, 'runtime disabled env must be verified')
assert(cleanup.cleanup.imageInspectPassed === true, 'cleanup inspect must pass')
assert(cleanup.cleanup.dockerImageRmPassed === true, 'image rm must pass')
assert(cleanup.cleanup.postRemovalInspectFoundImage === false, 'image must be absent after removal')

assert(policy.allowedClaims.controlledLocalDockerBuildPassed === true, 'build pass claim must be allowed')
assert(policy.allowedClaims.probeInvocationBlockerRecorded === true, 'blocker claim must be allowed')
assert(policy.runtimeFlags.dockerBuildAttempted === true, 'docker build attempt must be recorded')
assert(policy.runtimeFlags.dockerRunAttempted === true, 'docker run attempt must be recorded')
for (const key of [
  'dockerPushAttempted',
  'gcpCloudRunAttempted',
  'providerCallAttempted',
  'modelCallAttempted',
  'workerExecutionAttempted',
  'routeExecutionAttempted',
  'toolExecutionAttempted',
  'mediaProcessingAttempted',
  'supabaseMutationAttempted',
  'sqlExecutionAttempted',
  'artifactCreationAttempted',
  'externalBetaUnlockAttempted',
  'productionUnlockAttempted'
]) assert(policy.runtimeFlags[key] === false, `${key} must be false`)
for (const claim of [
  'container runtime import proof passed',
  'metadata imports passed inside image',
  'product tool-call execution ready',
  'external beta ready',
  'runtime readiness'
]) assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(next.selectedNextStep.prompt.includes('CONTROLLED-IMAGE-RUNTIME-IMPORT-PROOF-FIX'), 'wrong next prompt')
assert(next.selectedNextStep.promptFile === files.nextPrompt, 'wrong next prompt file')
assert(sourcePlan.decision === sourceDecision, 'source plan decision mismatch')
assert(sourceCommandPlan.commandMode === 'proposed_not_executed_in_this_prompt', 'source command plan mode mismatch')

const dockerfile = read(files.dockerfile)
for (const expected of [
  'FROM python:3.13-slim',
  'requirements.sound-oss-tools.txt',
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0',
  'REEDITPRO_WORKER_EXECUTION_ENABLED=0',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED=0',
  'USER reeditpro'
]) assert(dockerfile.includes(expected), `Dockerfile missing ${expected}`)

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-image-runtime-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = [
  files.result,
  files.build,
  files.blocker,
  files.cleanup,
  files.policy,
  files.next,
  files.nextPrompt
].map(read).join('\n')

for (const forbidden of [
  'containerRuntimeImportProofPassed": true',
  'metadataImportsProven": true',
  'productToolCallExecutionReadyCount": 15',
  'externalBetaReadyCount": 1',
  'productionReadyCount": 1',
  'dockerPushAttempted": true',
  'gcpCloudRunAttempted": true',
  'workerExecutionAttempted": true',
  'routeExecutionAttempted": true',
  'toolExecutionAttempted": true',
  'mediaProcessingAttempted": true',
  'sqlExecutionAttempted": true',
  'supabaseMutationAttempted": true',
  'artifactCreationAttempted": true'
]) assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_diagnostics_passed',
  decision,
  dockerBuildPassed: result.proofResult.dockerBuildPassed,
  probeJsonProduced: result.proofResult.probeJsonProduced,
  imageRemoved: result.proofResult.imageRemoved,
  containerRuntimeImportProofPassed: result.proofResult.containerRuntimeImportProofPassed,
  nextPrompt: result.nextPrompt
}, null, 2))
