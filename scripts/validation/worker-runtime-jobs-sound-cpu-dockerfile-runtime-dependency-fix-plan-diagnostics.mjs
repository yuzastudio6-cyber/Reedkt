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
  plan: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-fix-plan.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-evidence-register.md',
  changes: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-proposed-change-register.md',
  architecture: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-architecture-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix.md',
  sourceFailure: 'docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-detail-register.md',
  packageJson: 'package.json'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_fix_plan_completed_with_warnings_ready_for_dockerfile_runtime_dependency_source_fix'
const plan = parseJsonBlock(files.plan, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-fix-plan')
const evidence = parseJsonBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-evidence-register')
const changes = parseJsonBlock(files.changes, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-proposed-change-register')
const architecture = parseJsonBlock(files.architecture, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-architecture-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-blocker-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-claim-policy')
const sourceFailure = parseJsonBlock(files.sourceFailure, 'worker-runtime-jobs-sound-cpu-image-runtime-import-failure-detail-register')

for (const doc of [plan, evidence, changes, architecture, blockers, policy]) {
  assert(doc.decision === decision, 'decision mismatch')
}

assert(plan.sourceEvidence.sourceHead === 'a15d72f3bb74868140b0620d8500f54f5da70404', 'source head mismatch')
assert(plan.currentReadiness.metadataPackagesPassed === 13, 'metadata count mismatch')
assert(plan.currentReadiness.containerImportModulesPassed === 12, 'passed import count mismatch')
assert(plan.currentReadiness.containerImportModulesFailed === 2, 'failed import count mismatch')
assert(plan.currentReadiness.productToolCallReadyCount === 0, 'product tool readiness must be zero')
assert(plan.fixPlan.pedalboard.plannedDebianPackage === 'libatomic1', 'pedalboard package plan mismatch')
assert(plan.fixPlan.audioflux.currentImageArchitecture === 'linux/arm64', 'audioflux source image arch mismatch')
assert(plan.fixPlan.audioflux.bundledSharedLibraryArchitecture === 'x86_64', 'audioflux bundled arch mismatch')

const audiofluxFailure = sourceFailure.failureDetails.find((row) => row.module === 'audioflux')
const pedalboardFailure = sourceFailure.failureDetails.find((row) => row.module === 'pedalboard')
assert(audiofluxFailure?.errorType === 'OSError', 'source audioflux failure missing')
assert(pedalboardFailure?.sanitizedMessage.includes('libatomic.so.1'), 'source pedalboard libatomic failure missing')

assert(evidence.audiofluxPackageLayout.sharedLibraryFilesExist === true, 'audioflux shared libraries must exist')
assert(evidence.audiofluxPackageLayout.ldLibraryPathProbePassed === false, 'LD_LIBRARY_PATH probe must remain failed')
assert(evidence.elfArchitectureEvidence.imageArchitecture === 'linux/arm64', 'diagnostic image arch mismatch')
for (const row of evidence.elfArchitectureEvidence.audiofluxSharedObjects) {
  assert(row.machineName === 'x86_64', `unexpected audioflux ELF machine for ${row.relativePath}`)
}
assert(evidence.cleanup.postCleanupImagePresent === false, 'diagnostic image must be absent')

const changeIds = changes.proposedSourceChangesForNextGate.map((row) => row.id)
assert(changeIds.includes('pin_or_build_sound_cpu_image_as_linux_amd64'), 'amd64 source change missing')
assert(changeIds.includes('install_debian_libatomic1'), 'libatomic source change missing')
assert(changes.requiredProofAfterSourceChange.expectedImportPassCount === 14, 'proof must require 14 imports')
assert(changes.requiredProofAfterSourceChange.dockerPush === false, 'docker push must be false')
assert(changes.requiredProofAfterSourceChange.productToolExecution === false, 'product tool execution must be false')

assert(architecture.architectureFinding.arm64AudiofluxReadiness === 'blocked', 'arm64 audioflux must remain blocked')
assert(architecture.allowedNextArchitectureLane.lane === 'linux/amd64', 'amd64 lane missing')
assert(architecture.decisionIfAmd64LaneRejected.includes('keep audioflux blocked'), 'fallback decision missing')

assert(blockers.resolvedByThisPlan.some((row) => row.id === 'pedalboard_blocker_classified'), 'pedalboard resolved classification missing')
assert(blockers.resolvedByThisPlan.some((row) => row.id === 'audioflux_missing_object_classified'), 'audioflux resolved classification missing')
assert(blockers.remainingBlockers.some((row) => row.id === 'container_import_proof_not_rerun_after_fix'), 'rerun blocker missing')

assert(policy.allowedClaims.pedalboardPlannedDebianPackage === 'libatomic1', 'policy libatomic claim missing')
assert(policy.allowedClaims.audiofluxArchitectureMismatchIdentified === true, 'policy audioflux architecture claim missing')
for (const [key, value] of Object.entries(policy.blockedClaims)) {
  assert(value === false, `${key} must be false`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

const nextPromptText = read(files.nextPrompt)
assert(nextPromptText.includes('linux/amd64'), 'next prompt must mention linux/amd64')
assert(nextPromptText.includes('libatomic1'), 'next prompt must mention libatomic1')
assert(nextPromptText.includes('14/14 import checks'), 'next prompt must require 14/14 imports')

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dockerfile-runtime-dependency-fix-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-fix-plan-diagnostics.mjs',
  'package script missing'
)

const changedText = [
  files.plan,
  files.evidence,
  files.changes,
  files.architecture,
  files.blockers,
  files.policy,
  files.nextPrompt
].map(read).join('\n')

for (const forbidden of [
  'containerRuntimeImportProofPassed": true',
  'all15ToolsRuntimeReady": true',
  'productToolCallsReady": true',
  'externalBetaReady": true',
  'productionReady": true',
  'dockerPushReady": true',
  'gcpCloudRunReady": true',
  'workerExecutionReady": true',
  'mediaProcessingReady": true',
  'sqlExecuted": "yes"',
  'updateRequired": "yes"'
]) assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_fix_plan_passed',
  decision,
  plannedDebianPackage: plan.fixPlan.pedalboard.plannedDebianPackage,
  audiofluxFinding: architecture.architectureFinding,
  nextPrompt: plan.nextPrompt
}, null, 2))
