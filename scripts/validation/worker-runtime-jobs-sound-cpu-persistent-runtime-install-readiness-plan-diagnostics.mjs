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
  plan: 'docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-readiness-plan.md',
  target: 'docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-target-register.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-evidence-reconciliation.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-blocker-register.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-plan.md',
  cleanup: 'docs/reeditpro-local-validation-disk-cleanup-2-sound-cpu-beta-readiness-result.md',
  gate2a: 'docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md',
  packageRetry: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md',
  dockerReview: 'docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md',
  approvalRefresh: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh.md',
  dockerfile: 'server/workers/sound-cpu/Dockerfile',
  requirements: 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_persistent_runtime_install_readiness_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof_plan'
const plan = parseJsonBlock(files.plan, 'worker-runtime-jobs-sound-cpu-persistent-runtime-install-readiness-plan')
const target = parseJsonBlock(files.target, 'worker-runtime-jobs-sound-cpu-persistent-runtime-install-target-register')
const evidence = parseJsonBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-persistent-runtime-install-evidence-reconciliation')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-persistent-runtime-install-blocker-register')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-persistent-runtime-install-next-step-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-persistent-runtime-install-claim-policy')
const cleanup = parseJsonBlock(files.cleanup, 'reeditpro-local-validation-disk-cleanup-2-sound-cpu-beta-readiness-result')
const gate2a = parseJsonBlock(files.gate2a, 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')
const packageRetry = parseJsonBlock(files.packageRetry, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result')
const dockerReview = parseJsonBlock(files.dockerReview, 'worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review')
const approvalRefresh = parseJsonBlock(files.approvalRefresh, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh')

assert(plan.decision === decision, 'unexpected plan decision')
assert(plan.sourceVerification.sourceHead === 'cac038eb6ef58231ae1a2d4a1efbde43be72c022', 'unexpected source head')
assert(plan.sourceVerification.pr1134.status === 'merged', 'PR #1134 must be merged')
assert(plan.planResult.acceptedSoundCpuToolCount === 15, 'accepted tool count must be 15')
assert(plan.planResult.directPinnedPackageCount === 13, 'direct package count must be 13')
assert(plan.planResult.aliasCoveredToolCount === 2, 'alias count must be 2')
assert(plan.planResult.persistentRuntimeTargetSelected === 'sound_cpu_worker_docker_image_source', 'wrong selected target')
assert(plan.planResult.persistentRuntimeTargetPath === files.dockerfile, 'wrong Dockerfile path')
assert(plan.planResult.requirementsSource === files.requirements, 'wrong requirements source')
assert(plan.planResult.sourceDockerfileExists === true, 'Dockerfile must exist')
assert(plan.planResult.controlledLocalDockerBuildProofAccepted === true, 'Docker build proof must be accepted')
for (const key of [
  'durableImageArtifactExistsToday',
  'containerRuntimeImportProofExistsToday'
]) assert(plan.planResult[key] === false, `${key} must be false`)
for (const key of [
  'persistentRuntimeInstallReadyCount',
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) assert(plan.planResult[key] === 0, `${key} must remain zero`)

assert(target.selectedTarget.targetPath === files.dockerfile, 'target Dockerfile mismatch')
assert(target.selectedTarget.requirementsSource === files.requirements, 'target requirements mismatch')
assert(target.selectedTarget.workerNames.length === 2, 'expected two worker names')
assert(target.selectedTarget.jobTypes.length === 4, 'expected four job types')
assert(target.nonSelectedTargets.some((row) => row.targetId === 'frontend_node_modules'), 'must reject frontend node_modules target')

assert(evidence.acceptedEvidence.length >= 5, 'expected accepted evidence rows')
assert(evidence.reconciledCounts.acceptedSoundCpuToolCount === 15, 'reconciled tool count mismatch')
assert(evidence.reconciledCounts.durablePersistentRuntimeInstallReadyCount === 0, 'durable install count must be zero')
assert(evidence.duplicateGuard.rerunGate2aSyntheticProof === false, 'must not rerun Gate 2A')
assert(evidence.duplicateGuard.rerunDockerBuildProof === false, 'must not rerun Docker build proof')

assert(blockers.remainingBlockers[0].id === 'container_runtime_import_proof_missing', 'first blocker must be container import proof')
assert(blockers.resolvedBlockers[0].id === 'local_validation_disk_hydration_below_25_gib', 'disk blocker must be resolved')
assert(next.selectedNextStep.prompt.includes('CONTROLLED-IMAGE-RUNTIME-IMPORT-PROOF-PLAN'), 'wrong next prompt')

assert(policy.allowedClaims.persistentRuntimeTargetSelected === true, 'target selection claim must be allowed')
assert(policy.allowedClaims.nextSafeGateIsControlledImageRuntimeImportProofPlan === true, 'next gate claim mismatch')
for (const value of Object.values(policy.runtimeFlags)) assert(value === false, 'runtime flags must be false')
for (const claim of ['persistent runtime install ready', 'product tool-call execution ready', 'external beta ready', 'runtime readiness']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(cleanup.decision === 'reeditpro_local_validation_disk_cleanup_2_sound_cpu_beta_readiness_completed_with_warnings_ready_for_persistent_runtime_install_readiness_plan', 'cleanup decision mismatch')
assert(gate2a.toolCandidateCount === 15, 'Gate 2A tool count mismatch')
assert(gate2a.probePassedCount === 15, 'Gate 2A passed probes mismatch')
assert(packageRetry.proofResult.metadataPassedCount === 13, 'package retry metadata count mismatch')
assert(dockerReview.ownerReviewResult.controlledLocalDockerBuildProofAccepted === true, 'Docker review must accept build proof')
assert(dockerReview.ownerReviewResult.acceptedForDockerRunToday === false, 'Docker run must remain closed')
assert(approvalRefresh.approvalGateRefresh.persistentRuntimeInstallReadyCount === 0, 'approval refresh persistent install must be zero')

const dockerfile = read(files.dockerfile)
assert(dockerfile.includes('FROM python:3.13-slim'), 'Dockerfile must use Python 3.13 slim')
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'Dockerfile must disable SOUND CPU runtime')
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'Dockerfile must disable worker execution')
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'Dockerfile must disable media processing')
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile must use non-root user')

const changedText = [
  files.plan,
  files.target,
  files.evidence,
  files.blockers,
  files.next,
  files.policy,
  files.prompt
].map(read).join('\n')

for (const forbidden of [
  'persistentRuntimeInstallReadyCount": 15',
  'productToolCallExecutionReadyCount": 15',
  'externalBetaReadyCount": 1',
  'productionReadyCount": 1',
  'packageInstallAttempted": true',
  'toolCallAttempted": true',
  'dockerBuildAttempted": true',
  'dockerRunAttempted": true',
  'dockerPushAttempted": true',
  'workerExecutionAttempted": true',
  'routeExecutionAttempted": true',
  'sqlExecutionAttempted": true',
  'supabaseMutationAttempted": true'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_persistent_runtime_install_readiness_plan_diagnostics_passed',
  decision,
  persistentRuntimeTargetSelected: plan.planResult.persistentRuntimeTargetSelected,
  acceptedSoundCpuToolCount: plan.planResult.acceptedSoundCpuToolCount,
  persistentRuntimeInstallReadyCount: plan.planResult.persistentRuntimeInstallReadyCount,
  nextPrompt: plan.nextPrompt
}, null, 2))
