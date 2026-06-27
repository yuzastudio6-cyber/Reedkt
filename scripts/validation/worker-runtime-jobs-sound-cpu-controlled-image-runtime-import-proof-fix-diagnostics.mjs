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
  result: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-result.md',
  imports: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-import-register.md',
  cleanup: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-image-cleanup-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-claim-policy.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-next-step-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-image-runtime-import-failure-diagnostics.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result.md',
  sourceFixPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix.md',
  packageJson: 'package.json'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_blocked_probe_invocation_no_output_ready_for_fix'
const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-result')
const imports = parseJsonBlock(files.imports, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-import-register')
const cleanup = parseJsonBlock(files.cleanup, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-image-cleanup-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-blocker-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-claim-policy')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-next-step-register')
const sourceResult = parseJsonBlock(files.sourceResult, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result')

assert(result.decision === decision, 'unexpected decision')
assert(result.sourceVerification.sourceHead === '99cd5368bc61fc42ac36ba4e7022d1acba317616', 'unexpected source head')
assert(result.sourceVerification.pr1139.status === 'merged', 'PR #1139 must be merged')
assert(result.sourceVerification.pr1139.decision === sourceDecision, 'PR #1139 decision mismatch')
assert(result.proofResult.dockerBuildPassed === true, 'Docker build must pass')
assert(result.proofResult.dockerBuildUsedCache === true, 'cached rebuild must be recorded')
assert(result.proofResult.dockerRunInvoked === true, 'Docker run must be recorded')
assert(result.proofResult.dockerRunUsedStdinSafeProbe === true, 'stdin-safe probe must be true')
assert(result.proofResult.dockerRunNetwork === 'none', 'Docker run must be networkless')
assert(result.proofResult.probeJsonProduced === true, 'probe JSON must be produced')
assert(result.proofResult.metadataPassedCount === 13, 'metadata count mismatch')
assert(result.proofResult.metadataFailedCount === 0, 'metadata failures must be zero')
assert(result.proofResult.importPassedCount === 12, 'import pass count mismatch')
assert(result.proofResult.importFailedCount === 2, 'import failure count mismatch')
assert(result.proofResult.failedImportModules.length === 2, 'expected two failed imports')
assert(result.proofResult.failedImportModules.some((row) => row.module === 'audioflux' && row.errorType === 'OSError'), 'audioflux failure missing')
assert(result.proofResult.failedImportModules.some((row) => row.module === 'pedalboard' && row.errorType === 'ImportError'), 'pedalboard failure missing')
assert(result.proofResult.pydubFfmpegWarningObserved === true, 'pydub warning must be recorded')
assert(result.proofResult.imageRemoved === true, 'image must be removed')
assert(result.proofResult.containerRuntimeImportProofPassed === false, 'container proof must not pass')
assert(result.proofResult.productToolCallExecutionReadyCount === 0, 'product readiness must be zero')
assert(result.proofResult.externalBetaReadyCount === 0, 'external beta must be zero')
assert(result.proofResult.productionReadyCount === 0, 'production must be zero')

assert(imports.metadataPackages.expectedCount === 13, 'expected metadata count mismatch')
assert(imports.metadataPackages.passedCount === 13, 'metadata pass count mismatch')
assert(imports.importModules.expectedCount === 14, 'expected import count mismatch')
assert(imports.importModules.passedCount === 12, 'import pass count mismatch')
assert(imports.importModules.failedCount === 2, 'import failed count mismatch')
assert(imports.importModules.failed.every((row) => row.sanitizedMessageCaptured === false), 'sanitized messages should not be claimed yet')
for (const value of Object.values(imports.runtimeFlags)) assert(value === '0', 'runtime flags must be zero')

assert(cleanup.imageMetadata.imageId === 'sha256:05dcd1f1b4a7feb0a13ec2144651be896c5dfefe5709ccf3954c7e2213567fd1', 'image id mismatch')
assert(cleanup.imageMetadata.sizeBytes === 333378210, 'image size mismatch')
assert(cleanup.cleanup.dockerImageRmPassed === true, 'image rm must pass')
assert(cleanup.cleanup.postRemovalInspectFoundImage === false, 'image must be absent after cleanup')

assert(blockers.resolvedBlockers.some((row) => row.id === 'probe_invocation_no_output_due_missing_stdin_attachment'), 'stdin blocker must be resolved')
assert(blockers.remainingBlockers.some((row) => row.id === 'audioflux_import_failure'), 'audioflux blocker missing')
assert(blockers.remainingBlockers.some((row) => row.id === 'pedalboard_import_failure'), 'pedalboard blocker missing')

assert(policy.allowedClaims.stdinSafeProbeProducedJson === true, 'stdin-safe JSON claim missing')
assert(policy.allowedClaims.importFailedCount === 2, 'allowed failure count mismatch')
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
assert(policy.forbiddenClaims.includes('container runtime import proof passed'), 'must forbid passed import proof')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(next.selectedNextStep.prompt.includes('IMAGE-RUNTIME-IMPORT-FAILURE-DIAGNOSTICS'), 'wrong next prompt')
assert(next.selectedNextStep.promptFile === files.nextPrompt, 'wrong next prompt file')
assert(sourceResult.decision === sourceDecision, 'source result decision mismatch')

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-image-runtime-import-proof-fix:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-diagnostics.mjs',
  'package script missing'
)

const changedText = [
  files.result,
  files.imports,
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
  status: 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_diagnostics_passed',
  decision,
  metadataPassedCount: result.proofResult.metadataPassedCount,
  importPassedCount: result.proofResult.importPassedCount,
  importFailedCount: result.proofResult.importFailedCount,
  failedImportModules: result.proofResult.failedImportModules.map((row) => row.module),
  containerRuntimeImportProofPassed: result.proofResult.containerRuntimeImportProofPassed,
  nextPrompt: result.nextPrompt
}, null, 2))
