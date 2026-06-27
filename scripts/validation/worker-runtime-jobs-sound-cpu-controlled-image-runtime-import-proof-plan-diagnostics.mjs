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
  plan: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-plan.md',
  command: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-command-plan.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-evidence-map.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-blocker-register.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-plan.md',
  persistentPlan: 'docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-readiness-plan.md',
  persistentTarget: 'docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-target-register.md',
  cleanup: 'docs/reeditpro-local-validation-disk-cleanup-2-sound-cpu-beta-readiness-result.md',
  gate2a: 'docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md',
  dockerReview: 'docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md',
  approvalRefresh: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh.md',
  dockerfile: 'server/workers/sound-cpu/Dockerfile',
  requirements: 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt',
  packageJson: 'package.json'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_persistent_runtime_install_readiness_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof_plan'
const plan = parseJsonBlock(files.plan, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-plan')
const command = parseJsonBlock(files.command, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-command-plan')
const evidence = parseJsonBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-evidence-map')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-blocker-register')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-next-step-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-claim-policy')
const persistentPlan = parseJsonBlock(files.persistentPlan, 'worker-runtime-jobs-sound-cpu-persistent-runtime-install-readiness-plan')
const persistentTarget = parseJsonBlock(files.persistentTarget, 'worker-runtime-jobs-sound-cpu-persistent-runtime-install-target-register')
const cleanup = parseJsonBlock(files.cleanup, 'reeditpro-local-validation-disk-cleanup-2-sound-cpu-beta-readiness-result')
const gate2a = parseJsonBlock(files.gate2a, 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')
const dockerReview = parseJsonBlock(files.dockerReview, 'worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review')
const approvalRefresh = parseJsonBlock(files.approvalRefresh, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh')

assert(plan.decision === decision, 'unexpected plan decision')
assert(plan.sourceVerification.sourceHead === '79ac0c05ff3a3a3b0871d8e744cf5055c278b047', 'unexpected source head')
assert(plan.sourceVerification.pr1136.status === 'merged', 'PR #1136 must be merged')
assert(plan.sourceVerification.pr1136.decision === sourceDecision, 'PR #1136 decision mismatch')
assert(plan.sourceVerification.samePurposeOpenPrFoundBeforeCreation === false, 'same-purpose PR guard must be false')
assert(plan.planResult.acceptedSoundCpuToolCount === 15, 'accepted tool count must be 15')
assert(plan.planResult.directPinnedPackageCount === 13, 'direct package count must be 13')
assert(plan.planResult.aliasCoveredToolCount === 2, 'alias count must be 2')
assert(plan.planResult.dockerfilePath === files.dockerfile, 'wrong Dockerfile path')
assert(plan.planResult.requirementsSource === files.requirements, 'wrong requirements source')
assert(plan.planResult.futureProofCommandsIdentified === true, 'future commands must be identified')
assert(plan.planResult.dockerCommandsExecutedInThisPrompt === false, 'Docker commands must not run in this prompt')
assert(plan.planResult.packageInstallExecutedInRepo === false, 'repo package install must not run')
assert(plan.planResult.containerRuntimeImportProofPassedToday === false, 'container import proof must not be claimed today')
assert(plan.planResult.durableImageArtifactCreatedToday === false, 'durable image artifact must not be created')
for (const key of [
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'mediaProcessingReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) assert(plan.planResult[key] === 0, `${key} must remain zero`)

assert(command.commandMode === 'proposed_not_executed_in_this_prompt', 'command mode must be proposed-only')
assert(command.futureProofCommands.length === 4, 'expected four future proof command steps')
for (const row of command.futureProofCommands) {
  assert(row.executedInThisPrompt === false, `${row.step} must not execute in this prompt`)
  assert(row.allowedOnlyInNextPrompt === true, `${row.step} must be next-prompt only`)
}
assert(command.futureProofCommands.some((row) => row.command.startsWith('docker build')), 'missing proposed docker build')
assert(command.futureProofCommands.some((row) => row.command.startsWith('docker run --rm --network=none')), 'missing proposed networkless docker run')
assert(command.futureProofCommands.some((row) => row.command.startsWith('docker image inspect')), 'missing proposed inspect')
assert(command.futureProofCommands.some((row) => row.command.startsWith('docker image rm')), 'missing proposed image cleanup')
assert(command.futurePythonProbeShape.metadataPackages.length === 13, 'metadata package count must be 13')
assert(command.futurePythonProbeShape.importModules.length === 14, 'import module count must be 14')
assert(command.futurePythonProbeShape.aliasCoverage.pydub_effects === 'pydub', 'pydub alias mismatch')
assert(command.futurePythonProbeShape.aliasCoverage.ebu_r128_pyloudnorm === 'pyloudnorm', 'pyloudnorm alias mismatch')
for (const flag of [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED',
  'REEDITPRO_WORKER_EXECUTION_ENABLED',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED'
]) assert(command.futurePythonProbeShape.runtimeFlagsExpectedFalse.includes(flag), `missing false runtime flag ${flag}`)

assert(evidence.acceptedSourceEvidence.length === 5, 'expected five accepted source evidence rows')
assert(evidence.reconciledCounts.acceptedSoundCpuToolCount === 15, 'evidence tool count mismatch')
assert(evidence.reconciledCounts.containerRuntimeImportProofPassedToday === 0, 'container proof count must be zero today')
assert(evidence.duplicateGuard.rerunGate2aSyntheticProof === false, 'must not rerun Gate 2A')
assert(evidence.duplicateGuard.rerunGate1jDockerBuildProof === false, 'must not rerun Gate 1J')
assert(evidence.duplicateGuard.waitForOwnerChat === false, 'must not wait for owner chat')

assert(blockers.resolvedBlockers.some((row) => row.id === 'local_validation_disk_hydration_below_25_gib'), 'disk blocker must be resolved')
assert(blockers.remainingBlockers[0].id === 'container_runtime_import_proof_not_yet_run', 'first remaining blocker mismatch')
assert(next.selectedNextStep.prompt.includes('CONTROLLED-IMAGE-RUNTIME-IMPORT-PROOF'), 'wrong selected next prompt')
assert(next.selectedNextStep.promptFile === files.nextPrompt, 'wrong next prompt file')

assert(policy.allowedClaims.futureProofCommandShapeIdentified === true, 'command-shape claim must be allowed')
assert(policy.allowedClaims.metadataPackageCountForFutureProof === 13, 'metadata count claim mismatch')
assert(policy.allowedClaims.importModuleCountForFutureProof === 14, 'import count claim mismatch')
assert(policy.allowedClaims.nextSafeGateIsControlledImageRuntimeImportProof === true, 'next gate claim mismatch')
for (const value of Object.values(policy.runtimeFlags)) assert(value === false, 'all runtime flags must be false')
for (const claim of [
  'container runtime import proof passed',
  'persistent runtime install ready',
  'product tool-call execution ready',
  'external beta ready',
  'runtime readiness'
]) assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(persistentPlan.decision === sourceDecision, 'persistent source decision mismatch')
assert(persistentPlan.planResult.nextNonDuplicateGate === 'controlled_image_runtime_import_proof_plan', 'source next gate mismatch')
assert(persistentTarget.selectedTarget.targetPath === files.dockerfile, 'source target mismatch')
assert(cleanup.decision === 'reeditpro_local_validation_disk_cleanup_2_sound_cpu_beta_readiness_completed_with_warnings_ready_for_persistent_runtime_install_readiness_plan', 'cleanup decision mismatch')
assert(gate2a.toolCandidateCount === 15, 'Gate 2A tool count mismatch')
assert(gate2a.probePassedCount === 15, 'Gate 2A proof count mismatch')
assert(dockerReview.ownerReviewResult.controlledLocalDockerBuildProofAccepted === true, 'Docker build proof must be accepted')
assert(dockerReview.ownerReviewResult.acceptedForDockerRunToday === false, 'Docker run must remain closed in source')
assert(approvalRefresh.approvalGateRefresh.persistentRuntimeInstallReadyCount === 0, 'approval refresh persistent install must be zero')
assert(approvalRefresh.approvalGateRefresh.toolCallExecutionReadyCount === 0, 'approval refresh tool-call readiness must be zero')

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
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-image-runtime-import-proof-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-plan-diagnostics.mjs',
  'package script missing'
)

const changedText = [
  files.plan,
  files.command,
  files.evidence,
  files.blockers,
  files.next,
  files.policy,
  files.nextPrompt
].map(read).join('\n')

for (const forbidden of [
  'containerRuntimeImportProofPassedToday": true',
  'durableImageArtifactCreatedToday": true',
  'productToolCallExecutionReadyCount": 15',
  'externalBetaReadyCount": 1',
  'productionReadyCount": 1',
  'dockerCommandsExecutedInThisPrompt": true',
  'packageInstallExecutedInRepo": true',
  'dockerBuildAttempted": true',
  'dockerRunAttempted": true',
  'dockerPushAttempted": true',
  'workerExecutionAttempted": true',
  'routeExecutionAttempted": true',
  'mediaProcessingAttempted": true',
  'sqlExecutionAttempted": true',
  'supabaseMutationAttempted": true'
]) assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_plan_diagnostics_passed',
  decision,
  acceptedSoundCpuToolCount: plan.planResult.acceptedSoundCpuToolCount,
  futureProofCommandsIdentified: plan.planResult.futureProofCommandsIdentified,
  dockerCommandsExecutedInThisPrompt: plan.planResult.dockerCommandsExecutedInThisPrompt,
  productToolCallExecutionReadyCount: plan.planResult.productToolCallExecutionReadyCount,
  nextPrompt: plan.nextPrompt
}, null, 2))
