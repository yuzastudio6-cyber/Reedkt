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
  review: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-acceptance-register.md',
  proof: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-import-proof-register.md',
  dockerfile: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-dockerfile-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-claim-policy.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-next-step-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-import-proof-register.md',
  sourceDockerfile: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-dockerfile-register.md',
  dockerfileSource: 'server/workers/sound-cpu/Dockerfile',
  packageJson: 'package.json'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_source_fix_owner_review_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation_refresh'
const review = parseJsonBlock(files.review, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-review')
const acceptance = parseJsonBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-acceptance-register')
const proof = parseJsonBlock(files.proof, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-import-proof-register')
const dockerfile = parseJsonBlock(files.dockerfile, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-dockerfile-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-blocker-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-claim-policy')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-next-step-register')
const sourceResult = parseJsonBlock(files.sourceResult, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-result')
const sourceProof = parseJsonBlock(files.sourceProof, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-import-proof-register')
const sourceDockerfile = parseJsonBlock(files.sourceDockerfile, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-dockerfile-register')

for (const doc of [review, acceptance, proof, dockerfile, blockers, policy, next]) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
  assert(doc.decision === decision, 'decision mismatch')
}

assert(review.sourceVerification.sourceHead === 'e45995ba81609e8bcb8580a22d48bd0baad6ae09', 'source head mismatch')
assert(review.sourceVerification.pr1150.status === 'merged', 'PR #1150 status mismatch')
assert(review.sourceVerification.pr1150.decision === sourceResult.decision, 'PR #1150 decision mismatch')
assert(review.sourceVerification.repoEvidenceInspected === true, 'repo evidence inspection missing')
assert(review.sourceVerification.ownerChatWaitRequired === false, 'owner wait must be false')
assert(review.reviewOutcome.sourceFixAcceptedForPlanning === true, 'source fix acceptance missing')
assert(review.reviewOutcome.metadataPassed === 13, 'review metadata count mismatch')
assert(review.reviewOutcome.importsPassed === 14, 'review import count mismatch')
assert(review.reviewOutcome.imageRemoved === true, 'image cleanup acceptance missing')
for (const key of ['productToolCallReady', 'externalBetaReady', 'productionReady']) {
  assert(review.reviewOutcome[key] === false, `${key} must remain false`)
}

assert(acceptance.acceptedForPlanning.length === 3, 'accepted planning row count mismatch')
for (const row of acceptance.acceptedForPlanning) assert(row.accepted === true, `${row.id} must be accepted`)
for (const blocked of ['Docker push', 'Cloud Run or GCP deployment', 'product tool-call execution', 'external beta unlock', 'production unlock']) {
  assert(acceptance.notAcceptedForToday.includes(blocked), `missing today-blocked item ${blocked}`)
}

assert(proof.sourceProof === files.sourceProof, 'source proof path mismatch')
assert(proof.metadata.passed === sourceProof.metadata.passed, 'metadata source mismatch')
assert(proof.imports.passed === sourceProof.imports.passed, 'import source mismatch')
assert(proof.imports.failed === 0, 'owner proof cannot accept failed imports')
for (const moduleName of ['audioflux', 'pedalboard']) assert(proof.imports.requiredModules.includes(moduleName), `${moduleName} missing`)
for (const key of ['mediaOpened', 'workerExecutionAttempted', 'routeExecutionAttempted', 'toolExecutionAttempted', 'artifactCreated']) {
  assert(proof.proofGuards[key] === false, `${key} must be false`)
}
assert(proof.proofGuards.runtimeFlagsZero === true, 'runtime flag guard missing')

assert(dockerfile.dockerfilePath === 'server/workers/sound-cpu/Dockerfile', 'dockerfile path mismatch')
assert(dockerfile.acceptedSourceProperties.explicitPlatform === 'linux/amd64', 'platform acceptance mismatch')
assert(dockerfile.acceptedSourceProperties.debianRuntimePackage === 'libatomic1', 'libatomic acceptance mismatch')
for (const value of Object.values(dockerfile.prohibitedSourceExpansionAbsent)) assert(value === true, 'prohibited expansion must be absent')
assert(dockerfile.acceptedWarning.id === 'FromPlatformFlagConstDisallowed', 'platform warning acceptance missing')

const dockerfileText = read(files.dockerfileSource)
assert(dockerfileText.includes('FROM --platform=linux/amd64 python:3.13-slim'), 'Dockerfile platform missing')
assert(dockerfileText.includes('libatomic1'), 'Dockerfile libatomic missing')
assert(dockerfileText.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'runtime disabled flag missing')
assert(dockerfileText.includes('USER reeditpro'), 'non-root user missing')
assert(dockerfileText.includes('runtime execution is disabled pending owner gates'), 'fail-closed CMD missing')

assert(sourceResult.controlledProofResult.metadataPassed === 13, 'source result metadata mismatch')
assert(sourceResult.controlledProofResult.importsPassed === 14, 'source result import mismatch')
assert(sourceResult.readinessClaims.productToolCallReady === false, 'source result product readiness widened')
assert(sourceDockerfile.expectedInstructions.aptPackage === 'libatomic1', 'source Dockerfile register libatomic mismatch')

assert(blockers.resolvedForPlanning.some((row) => row.id === 'container_image_import_blocker'), 'container blocker not resolved')
assert(blockers.resolvedForPlanning.some((row) => row.id === 'audioflux_architecture_blocker'), 'audioflux blocker not resolved')
assert(blockers.stillBlocked.some((row) => row.id === 'product_tool_call_execution'), 'product blocker missing')
assert(blockers.stillBlocked.some((row) => row.id === 'worker_route_execution'), 'worker route blocker missing')

assert(policy.allowedClaims.controlledImageImportProofAccepted === true, 'proof accepted claim missing')
assert(policy.allowedClaims.importChecksPassed === '14/14', 'import claim mismatch')
for (const claim of ['product tool-call execution ready', 'worker execution ready', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(next.nextStep.recommendedPrompt.includes('AFTER-IMAGE-IMPORT-PROOF'), 'next prompt mismatch')
assert(next.nextStep.recommendedPromptFile === files.nextPrompt, 'next prompt file mismatch')
for (const key of ['doNotResumeOldBetaPromptBlindly', 'doNotStartToolCalls', 'doNotStartWorkersRoutes', 'doNotStartMedia', 'doNotStartSupabase', 'doNotUnlockBeta', 'doNotUnlockProduction']) {
  assert(next.nextStep[key] === true, `${key} guard missing`)
}

const nextPromptText = read(files.nextPrompt)
assert(nextPromptText.includes(decision), 'next prompt must require owner review decision')
assert(nextPromptText.includes('no-execution and decision-only'), 'next prompt must be no-execution')
assert(nextPromptText.includes('Docker build/run/push'), 'next prompt must block Docker actions')
assert(nextPromptText.includes('If evidence is insufficient'), 'next prompt must stop on insufficient evidence')

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dockerfile-runtime-dependency-source-fix-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-review-diagnostics.mjs',
  'package diagnostics script missing'
)

const changedText = [
  files.review,
  files.acceptance,
  files.proof,
  files.dockerfile,
  files.blockers,
  files.policy,
  files.next,
  files.nextPrompt
].map(read).join('\n')

for (const forbidden of [
  'productToolCallReady": true',
  'externalBetaReady": true',
  'productionReady": true',
  'workerExecutionReady": true',
  'mediaProcessingReady": true',
  'sqlExecuted": "yes"',
  'updateRequired": "yes"'
]) assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_source_fix_owner_review_diagnostics_passed',
  decision,
  metadataPassed: review.reviewOutcome.metadataPassed,
  importsPassed: review.reviewOutcome.importsPassed,
  productToolCallReady: review.reviewOutcome.productToolCallReady,
  nextPrompt: review.nextPrompt
}, null, 2))
