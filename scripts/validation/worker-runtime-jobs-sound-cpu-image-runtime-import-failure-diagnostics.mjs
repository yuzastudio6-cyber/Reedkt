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
  result: 'docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-diagnostics-result.md',
  detail: 'docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-detail-register.md',
  cleanup: 'docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-cleanup-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-claim-policy.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-next-step-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-fix-plan.md',
  sourceFix: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-result.md',
  packageJson: 'package.json'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_image_runtime_import_failure_diagnostics_completed_with_warnings_ready_for_dockerfile_runtime_dependency_fix_plan'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics'
const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-image-runtime-import-failure-diagnostics-result')
const detail = parseJsonBlock(files.detail, 'worker-runtime-jobs-sound-cpu-image-runtime-import-failure-detail-register')
const cleanup = parseJsonBlock(files.cleanup, 'worker-runtime-jobs-sound-cpu-image-runtime-import-failure-cleanup-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-image-runtime-import-failure-blocker-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-image-runtime-import-failure-claim-policy')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-image-runtime-import-failure-next-step-register')
const sourceFix = parseJsonBlock(files.sourceFix, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-result')

assert(result.decision === decision, 'unexpected decision')
assert(result.sourceVerification.sourceHead === '2166afddafefa5cb768d6a233d847d585c7642df', 'unexpected source head')
assert(result.sourceVerification.pr1141.status === 'merged', 'PR #1141 must be merged')
assert(result.sourceVerification.pr1141.decision === sourceDecision, 'PR #1141 decision mismatch')
assert(result.diagnosticsResult.dockerBuildPassed === true, 'Docker build must pass')
assert(result.diagnosticsResult.dockerBuildUsedCache === true, 'cached rebuild must be recorded')
assert(result.diagnosticsResult.diagnosticDockerRunInvoked === true, 'diagnostic Docker run must be recorded')
assert(result.diagnosticsResult.diagnosticDockerRunNetwork === 'none', 'diagnostic Docker run must be networkless')
assert(result.diagnosticsResult.diagnosticJsonProduced === true, 'diagnostic JSON must be produced')
assert(result.diagnosticsResult.diagnosedFailureCount === 2, 'diagnosed failure count mismatch')
assert(result.diagnosticsResult.imageRemoved === true, 'image must be removed')
assert(result.diagnosticsResult.containerRuntimeImportProofPassed === false, 'container proof must not pass')
assert(result.diagnosticsResult.productToolCallExecutionReadyCount === 0, 'product readiness must remain zero')
assert(result.diagnosticsResult.externalBetaReadyCount === 0, 'external beta must remain zero')
assert(result.diagnosticsResult.productionReadyCount === 0, 'production must remain zero')

const audioflux = detail.failureDetails.find((row) => row.module === 'audioflux')
const pedalboard = detail.failureDetails.find((row) => row.module === 'pedalboard')
assert(audioflux?.errorType === 'OSError', 'audioflux OSError missing')
assert(audioflux.pathRedacted === true, 'audioflux path must be redacted')
assert(audioflux.hints.includes('cannot open shared object file'), 'audioflux shared object hint missing')
assert(pedalboard?.errorType === 'ImportError', 'pedalboard ImportError missing')
assert(pedalboard.sanitizedMessage.includes('libatomic.so.1'), 'pedalboard libatomic message missing')
assert(pedalboard.pathRedacted === false, 'pedalboard path should not be redacted')
for (const value of Object.values(detail.runtimeFlags)) assert(value === '0', 'runtime flags must be zero')
for (const value of Object.values(detail.executionScope)) assert(value === false, 'execution scope flags must be false')

assert(cleanup.imageMetadata.imageId === 'sha256:73167f59d2e687194a5aa7ef85df07220196e9bbe328570a8431c8da8d280cba', 'image id mismatch')
assert(cleanup.cleanup.dockerImageRmPassed === true, 'image rm must pass')
assert(cleanup.cleanup.postRemovalInspectFoundImage === false, 'image must be absent after cleanup')

assert(blockers.resolvedBlockers.some((row) => row.id === 'missing_sanitized_failure_detail'), 'resolved diagnostics blocker missing')
assert(blockers.remainingBlockers.some((row) => row.id === 'audioflux_missing_shared_object'), 'audioflux blocker missing')
assert(blockers.remainingBlockers.some((row) => row.id === 'pedalboard_missing_libatomic'), 'pedalboard blocker missing')

assert(policy.allowedClaims.sanitizedFailureDetailCaptured === true, 'failure detail claim missing')
assert(policy.allowedClaims.pedalboardMissingLibrary === 'libatomic.so.1', 'libatomic claim mismatch')
assert(policy.runtimeFlags.dockerBuildAttempted === true, 'docker build attempt must be recorded')
assert(policy.runtimeFlags.diagnosticDockerRunAttempted === true, 'diagnostic docker run attempt must be recorded')
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
assert(policy.forbiddenClaims.includes('container runtime import proof passed'), 'must forbid import proof pass')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(next.selectedNextStep.prompt.includes('DOCKERFILE-RUNTIME-DEPENDENCY-FIX-PLAN'), 'wrong next prompt')
assert(next.selectedNextStep.promptFile === files.nextPrompt, 'wrong next prompt file')
assert(sourceFix.decision === sourceDecision, 'source fix decision mismatch')

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-image-runtime-import-failure-diagnostics:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-diagnostics.mjs',
  'package script missing'
)

const changedText = [
  files.result,
  files.detail,
  files.cleanup,
  files.blockers,
  files.policy,
  files.next,
  files.nextPrompt
].map(read).join('\n')

for (const forbidden of [
  'containerRuntimeImportProofPassed": true',
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
  status: 'worker_runtime_jobs_sound_cpu_image_runtime_import_failure_diagnostics_passed',
  decision,
  diagnosedModules: result.diagnosticsResult.diagnosedModules,
  audiofluxErrorType: audioflux.errorType,
  pedalboardMissingLibrary: policy.allowedClaims.pedalboardMissingLibrary,
  containerRuntimeImportProofPassed: result.diagnosticsResult.containerRuntimeImportProofPassed,
  nextPrompt: result.nextPrompt
}, null, 2))
