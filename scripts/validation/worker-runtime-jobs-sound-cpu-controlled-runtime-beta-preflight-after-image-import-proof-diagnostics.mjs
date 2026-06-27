import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  main: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-evidence-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-validation-blocker-register.md',
  duplicate: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-duplicate-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-readiness-register.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-hydration.md'
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = read(relativePath)
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\`\`\`json ${escapedLabel}\\n([\\s\\S]*?)\\n\`\`\``)
  const match = text.match(pattern)
  assert(match, `missing json block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

const main = parseJsonBlock(files.main, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof')
const evidence = parseJsonBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-evidence-register')
const blocker = parseJsonBlock(files.blocker, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-validation-blocker-register')
const duplicate = parseJsonBlock(files.duplicate, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-duplicate-register')
const readiness = parseJsonBlock(files.readiness, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-readiness-register')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-next-step-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-claim-policy')

assert(
  main.decision ===
    'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_image_import_proof_blocked_dependency_hydration_disk_risk',
  'unexpected decision'
)
assert(main.sourceHead === '3974ce1407dd8e016ce097bcea2dce0b794c2fc1', 'source head mismatch')
assert(main.dependencyHydrationStarted === false, 'dependency hydration must not be marked started')
assert(main.runtimeExecutionStarted === false, 'runtime execution must remain closed')
assert(main.dockerBuildStarted === false && main.dockerRunStarted === false && main.dockerPushStarted === false, 'docker action widened')

assert(evidence.containerImportProof.metadataPassed === 13, 'metadata pass count mismatch')
assert(evidence.containerImportProof.importsPassed === 14, 'import pass count mismatch')
assert(evidence.containerImportProof.failedImports.length === 0, 'failed imports must be empty')
assert(evidence.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(evidence.productToolCallExecutionReadyCount === 0, 'product execution readiness widened')
assert(evidence.externalBetaReadyCount === 0 && evidence.productionReadyCount === 0, 'beta/production widened')

assert(blocker.blockingCategory === 'dependency_hydration_disk_risk', 'blocker category mismatch')
assert(blocker.nodeModulesPresent === false, 'node modules must be absent')
assert(blocker.safeHydratedSiblingFound === false, 'safe hydrated sibling should not be claimed')
assert(blocker.freeSpaceObservedGiBApprox < blocker.conservativeRetryThresholdGiB, 'blocker requires below-threshold disk')
assert(blocker.dependencyHydrationStarted === false, 'blocked hydration must not be started')

assert(duplicate.sameHeadOpenPrFound === false, 'same-head duplicate found')
assert(duplicate.samePurposeOpenPrFound === false, 'same-purpose duplicate found')
assert(duplicate.ownershipConflictFound === false, 'ownership conflict found')

assert(readiness.containerImportBlockerCleared === true, 'container import blocker should be cleared')
assert(readiness.dependencyBackedPreflightPassed === false, 'dependency preflight must not pass')
assert(readiness.productToolCallExecutionReady === false, 'product tool-call execution widened')
assert(readiness.externalBetaReady === false && readiness.productionReady === false, 'beta/production widened')

assert(next.minimumRecommendedFreeSpaceGiB === 25, 'minimum free-space threshold mismatch')
assert(next.requiredNextPrompt.includes('REEDITPRO-LOCAL-VALIDATION-DISK-CLEANUP-3'), 'next prompt mismatch')
read(files.nextPrompt)

assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql execution widened')
for (const forbidden of policy.forbiddenClaims) {
  assert(!readiness[forbidden], `forbidden readiness key truthy: ${forbidden}`)
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
const forbiddenPatterns = [
  '"externalBetaReady": true',
  '"productionReady": true',
  '"productToolCallExecutionReady": true',
  '"workerExecutionReady": true',
  '"routeExecutionReady": true',
  '"mediaProcessingReady": true',
  '"supabaseSqlReady": true',
  '"artifactDeliveryReady": true',
  '"dockerBuildStarted": true',
  '"dockerRunStarted": true',
  '"dockerPushStarted": true'
]
for (const forbiddenPattern of forbiddenPatterns) {
  assert(!changedText.includes(forbiddenPattern), `forbidden readiness claim found: ${forbiddenPattern}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_image_import_proof_diagnostics_passed',
      decision: main.decision,
      sourceHead: main.sourceHead,
      importsPassed: evidence.containerImportProof.importsPassed,
      blocker: blocker.blockingCategory,
      freeSpaceObservedGiBApprox: blocker.freeSpaceObservedGiBApprox,
      nextPrompt: next.requiredNextPrompt
    },
    null,
    2
  )
)
