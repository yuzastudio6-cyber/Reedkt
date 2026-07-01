import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase91_caption_render_runtime_hook_controlled_manifest_instance_creation_planning_owner_review_passed_with_warnings_ready_for_controlled_manifest_instance_creation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase92_caption_render_runtime_hook_controlled_manifest_instance_creation_passed_with_warnings_ready_for_controlled_manifest_instance_creation_owner_review_no_persistence_no_execution'
const sourceMergeCommit = '1f271f9fd7c7e9dab34e6e2063d16bedc90fdd83'
const sourceHead = 'c76ac8170bdd629053ea1e1e174e16b4bc8d24bf'
const sourceResultHead = 'c718af54fc2f8f7b2dbd686d7bfc17ef97a00f6e'
const sourceResultMergeCommit = '04bda1ad9be74e11fa3679df5ef7b0d4024636ee'
const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-runner.mjs'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE92-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-MANIFEST-INSTANCE-CREATION-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-result.md',
  runnerOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-runner-output-register.md',
  content:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-manifest-instance-content-register.md',
  persistence:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-no-persistence-proof-register.md',
  scan:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-prohibited-runtime-scan-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-review.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, message) {
  assert(value === false, message)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) assertFalse(value, `${label}.${key} must be false`)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'persistManifestToday": ' + 'true',
    'manifestInstancePersistedToday": ' + 'true',
    'realMediaBytesUsedToday": ' + 'true',
    'useRealMediaBytesToday": ' + 'true',
    'openMediaFileToday": ' + 'true',
    'mediaFileOpenedToday": ' + 'true',
    'createArtifactToday": ' + 'true',
    'artifactCreatedToday": ' + 'true',
    'createSignedUrlToday": ' + 'true',
    'signedUrlCreatedToday": ' + 'true',
    'dispatchWorkerToday": ' + 'true',
    'workerDispatchedToday": ' + 'true',
    'callRouteToolProviderToday": ' + 'true',
    'routeToolProviderExecutedToday": ' + 'true',
    'touchSupabaseSqlToday": ' + 'true',
    'supabaseSqlTouchedToday": ' + 'true',
    'unlockBetaToday": ' + 'true',
    'unlockProductionToday": ' + 'true',
    'generatedLocalFixturePassedClaimed": ' + 'true',
    'dryRunPassedClaimed": ' + 'true',
    'runtimeReadinessClaimed": ' + 'true',
    'realUserMediaBetaReadyClaimed": ' + 'true',
    'productionReadinessClaimed": ' + 'true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-result',
  ),
  runnerOutput: parseJsonBlock(
    docs.runnerOutput,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-runner-output-register',
  ),
  content: parseJsonBlock(
    docs.content,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-manifest-instance-content-register',
  ),
  persistence: parseJsonBlock(
    docs.persistence,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-no-persistence-proof-register',
  ),
  scan: parseJsonBlock(
    docs.scan,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-prohibited-runtime-scan-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

const runnerOutput = JSON.parse(execFileSync(process.execPath, [runnerPath], { encoding: 'utf8' }))
assert(runnerOutput.ok === true, 'runner output must pass')
assert(runnerOutput.sourcePath === sourcePath, 'runner source path mismatch')
assert(runnerOutput.controlledInMemoryProof.controlledInMemoryManifestInstanceCreated === true, 'runner did not create in-memory manifest')
assert(runnerOutput.controlledInMemoryProof.validationOk === true, 'runner validation failed')
assert(runnerOutput.controlledInMemoryProof.validationIssueCount === 0, 'runner issue count mismatch')
assert(runnerOutput.controlledInMemoryProof.runtimeDefaultsAllFalse === true, 'runner defaults not false')
assert(runnerOutput.controlledInMemoryProof.prohibitedFieldsAbsent === true, 'runner prohibited fields present')
assert(runnerOutput.controlledInMemoryProof.discardedAfterValidation === true, 'runner did not discard')
assertAllFalse(runnerOutput.noPersistenceNoExecution, 'runner.noPersistenceNoExecution')

const sourceText = read(sourcePath)
for (const token of [
  'validateSoundCpuPrivateMediaManifest',
  'SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(token), `private manifest source missing ${token}`)
}

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.executionScope.createControlledInMemoryManifestInstance === true, 'source prompt proof scope missing')
assert(parsed.sourcePrompt.executionScope.discardInMemoryManifestAfterValidation === true, 'source prompt discard missing')
for (const key of [
  'persistManifestToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.sourcePrompt.executionScope[key], `sourcePrompt.executionScope.${key}`)
}

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 1997, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === sourceResultHead, 'source result source head mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === sourceResultMergeCommit, 'source result source merge mismatch')
assert(parsed.sourceResult.ownerReview.controlledInMemoryManifestInstanceCreationProofMayProceed === true, 'source result proof may proceed')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tool count')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result real execution count')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1998, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.controlledInMemoryProof.runner === runnerPath, 'result runner path mismatch')
assert(parsed.result.controlledInMemoryProof.controlledInMemoryManifestInstanceCreated === true, 'result proof missing')
assert(parsed.result.controlledInMemoryProof.validationOk === true, 'result validation')
assert(parsed.result.controlledInMemoryProof.validationIssueCount === 0, 'result validation issue count')
assert(parsed.result.controlledInMemoryProof.discardedAfterValidation === true, 'result discard')
for (const key of [
  'persistManifestToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.result.controlledInMemoryProof[key], `result.controlledInMemoryProof.${key}`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution count')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt')

assert(parsed.runnerOutput.runnerOutput.ok === true, 'runner doc ok')
assert(parsed.runnerOutput.runnerOutput.controlledInMemoryManifestInstanceCreated === true, 'runner doc creation')
assert(parsed.runnerOutput.runnerOutput.manifestFrozen === true, 'runner doc freeze')
assert(parsed.runnerOutput.runnerOutput.validationIssueCount === 0, 'runner doc issue count')
assertAllFalse(parsed.runnerOutput.noPersistenceNoExecution, 'runnerOutput.noPersistenceNoExecution')

assert(parsed.content.manifestShapeValidated.requiredFieldCount === 11, 'content required fields')
assert(parsed.content.manifestShapeValidated.workerNamesAllowed.length === 2, 'content worker count')
assert(parsed.content.manifestShapeValidated.jobTypesAllowed.length === 4, 'content job count')
assert(parsed.content.manifestShapeValidated.runtimeDefaultFalseKeyCount === 11, 'content defaults')
assert(parsed.content.manifestShapeValidated.signedUrlAbsent === true, 'content signed URL absence')
assertAllFalse(parsed.content.executionState, 'content.executionState')

assertAllFalse(parsed.persistence.closedBoundaries, 'persistence.closedBoundaries')
assert(parsed.persistence.proofCleanup.discardedAfterValidation === true, 'persistence discarded')
assertFalse(parsed.persistence.proofCleanup.temporaryFilesCreated, 'persistence temp files')
assertFalse(parsed.persistence.proofCleanup.artifactsCreated, 'persistence artifacts')
assertFalse(parsed.persistence.proofCleanup.storageObjectsCreated, 'persistence storage')

assert(parsed.scan.prohibitedRuntimeScan.scanPassed === true, 'scan did not pass')
for (const [key, value] of Object.entries(parsed.scan.prohibitedRuntimeScan)) {
  if (key.endsWith('Detected')) assertFalse(value, `scan.${key}`)
}

assert(parsed.blockers.resolvedForThisGate.includes('controlledInMemoryManifestInstanceCreationPassed'), 'blockers proof resolution')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.controlledManifestInstanceCreationOwnerReview === 'required_next', 'blockers next owner review')
assert(parsed.blockers.executionApprovalsToday === 'controlled_in_memory_manifest_instance_only', 'blockers execution scope')
assert(parsed.policy.allowedClaims.controlledInMemoryManifestInstanceCreationPassed === true, 'policy proof claim')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assert(parsed.policy.executionApprovalsToday === 'controlled_in_memory_manifest_instance_only', 'policy execution scope')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase92_caption_render_runtime_hook_controlled_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_planning_no_execution', 'next expected decision mismatch')
assert(parsed.next.reviewScope.acceptForPersistencePlanningOnly === true, 'next prompt persistence planning only')
for (const key of [
  'persistManifestToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.next.reviewScope[key], `next.reviewScope.${key}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      reviewedSourcePr: parsed.result.sourceVerification.sourcePr,
      controlledInMemoryManifestInstanceCreated:
        parsed.result.controlledInMemoryProof.controlledInMemoryManifestInstanceCreated,
      persistedManifestToday: parsed.result.controlledInMemoryProof.persistManifestToday,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      executionApprovalsToday: parsed.policy.executionApprovalsToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
