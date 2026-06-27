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
  result: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-result.md',
  proof: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-import-proof-register.md',
  dockerfileRegister: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-dockerfile-register.md',
  image: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-image-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-review.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-fix-plan.md',
  dockerfile: 'server/workers/sound-cpu/Dockerfile',
  packageJson: 'package.json'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_source_fix_passed_with_warnings_ready_for_source_fix_owner_review'
const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-result')
const proof = parseJsonBlock(files.proof, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-import-proof-register')
const dockerfileRegister = parseJsonBlock(files.dockerfileRegister, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-dockerfile-register')
const image = parseJsonBlock(files.image, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-image-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-blocker-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-claim-policy')
const sourcePlan = parseJsonBlock(files.sourcePlan, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-fix-plan')

for (const doc of [result, proof, dockerfileRegister, image, blockers, policy]) {
  assert(doc.decision === decision, 'decision mismatch')
}

assert(result.sourceEvidence.sourceHead === '649656bc871a4fad4acb1fced2071f252e736827', 'source head mismatch')
assert(sourcePlan.decision === 'worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_fix_plan_completed_with_warnings_ready_for_dockerfile_runtime_dependency_source_fix', 'source plan decision mismatch')
assert(result.sourceChanges.explicitPlatform === 'linux/amd64', 'explicit platform missing')
assert(result.sourceChanges.debianRuntimePackagesAdded.includes('libatomic1'), 'libatomic1 missing')
assert(result.controlledProofResult.metadataPassed === 13, 'metadata pass count mismatch')
assert(result.controlledProofResult.importsPassed === 14, 'import pass count mismatch')
assert(result.controlledProofResult.importsFailed === 0, 'imports must not fail')
assert(result.controlledProofResult.imageRemoved === true, 'image must be removed')
assert(result.readinessClaims.productToolCallReady === false, 'product readiness must remain false')
assert(result.readinessClaims.externalBetaReady === false, 'external beta must remain false')

assert(proof.metadata.passed === 13 && proof.metadata.expected === 13, 'proof metadata mismatch')
assert(proof.imports.passed === 14 && proof.imports.failed === 0, 'proof import mismatch')
for (const moduleName of ['audioflux', 'pedalboard']) {
  assert(proof.imports.modules.includes(moduleName), `${moduleName} import missing`)
}
for (const value of Object.values(proof.runtimeFlags)) assert(value === '0', 'runtime flag must be zero')
for (const key of ['mediaOpened', 'workerExecutionAttempted', 'routeExecutionAttempted', 'toolExecutionAttempted', 'artifactCreated']) {
  assert(proof.executionScope[key] === false, `${key} must be false`)
}

const dockerfile = read(files.dockerfile)
assert(dockerfile.includes('FROM --platform=linux/amd64 python:3.13-slim'), 'Dockerfile platform pin missing')
assert(dockerfile.includes('apt-get install --no-install-recommends -y libatomic1'), 'Dockerfile libatomic1 install missing')
for (const expected of dockerfileRegister.expectedInstructions.runtimeDisabledEnv) {
  const [key, value] = expected.split('=')
  assert(dockerfile.includes(`${key}=${value}`), `Dockerfile missing ${expected}`)
}
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile non-root user missing')
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'Dockerfile fail-closed CMD missing')
for (const prohibited of dockerfileRegister.prohibitedInstructions) {
  assert(!dockerfile.toLowerCase().includes(prohibited.toLowerCase()), `Dockerfile contains prohibited token ${prohibited}`)
}

assert(image.image.architecture === 'amd64', 'image architecture mismatch')
assert(image.cleanup.imageRemoved === true, 'image cleanup missing')
assert(image.cleanup.dockerPush === false, 'docker push must be false')

assert(blockers.resolvedBlockers.some((row) => row.id === 'audioflux_container_import_failure'), 'audioflux blocker not resolved')
assert(blockers.resolvedBlockers.some((row) => row.id === 'pedalboard_missing_libatomic'), 'pedalboard blocker not resolved')
assert(blockers.remainingBlockers.some((row) => row.id === 'source_fix_owner_review_required'), 'owner review blocker missing')

assert(policy.allowedClaims.containerRuntimeImportProofPassed === true, 'container import proof claim must be allowed')
for (const [key, value] of Object.entries(policy.blockedClaims)) {
  assert(value === false, `${key} must be false`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dockerfile-runtime-dependency-source-fix:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-diagnostics.mjs',
  'package script missing'
)

const nextPromptText = read(files.nextPrompt)
assert(nextPromptText.includes('14/14 import checks'), 'next prompt must include import proof result')
assert(nextPromptText.includes('Docker push'), 'next prompt must preserve Docker push blocker')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_source_fix_passed',
  decision,
  metadataPassed: result.controlledProofResult.metadataPassed,
  importsPassed: result.controlledProofResult.importsPassed,
  imageRemoved: image.cleanup.imageRemoved,
  productToolCallReady: result.readinessClaims.productToolCallReady,
  nextPrompt: result.nextPrompt
}, null, 2))
