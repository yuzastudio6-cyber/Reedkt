import fs from 'node:fs'

const decision =
  'sound_runtime_media_gate_2aj_runtime_guard_source_hardening_completed_with_warnings_ready_for_runtime_guard_source_hardening_owner_review'
const ownerDecision =
  'worker_runtime_jobs_sound_cpu_runtime_guard_hardening_owner_review_passed_with_warnings_ready_for_runtime_guard_source_hardening'
const gate2aiDecision =
  'sound_runtime_media_gate_2ai_runtime_guard_hardening_plan_completed_with_warnings_ready_for_runtime_guard_hardening_owner_review'
const sourceHead = '13f4fa37451e01f58e38a534a3a358a724007c47'
const runtimeGuardPath = 'server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts'

const docs = [
  'docs/sound-runtime-media-gate-2aj-runtime-guard-source-hardening-result.md',
  'docs/sound-runtime-media-gate-2aj-runtime-guard-source-diff-register.md',
  'docs/sound-runtime-media-gate-2aj-disabled-flag-assertion-proof.md',
  'docs/sound-runtime-media-gate-2aj-no-execution-regression-register.md',
  'docs/sound-runtime-media-gate-2aj-runtime-guard-blocker-register.md',
  'docs/sound-runtime-media-gate-2aj-runtime-claim-policy.md',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function parseJsonBlock(path) {
  const text = read(path)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${path} missing fenced json block`)
  return JSON.parse(match[1])
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.decision === decision, `${path} decision mismatch`)
}

const result = parsed['docs/sound-runtime-media-gate-2aj-runtime-guard-source-hardening-result.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr956.status === 'merged', 'PR #956 evidence missing')
assert(result.sourceVerification.pr956.mergeCommit === sourceHead, 'PR #956 merge commit mismatch')
assert(result.sourceVerification.pr956.decision === ownerDecision, 'PR #956 decision mismatch')
assert(result.sourceVerification.pr954.decision === gate2aiDecision, 'PR #954 decision mismatch')
assert(result.sourceHardeningResult.runtimeSourceFilesModified.includes(runtimeGuardPath), 'runtime guard path missing')
assert(result.sourceHardeningResult.disabledFlagKeyListAdded === true, 'disabled flag key list missing')
assert(result.sourceHardeningResult.disabledFlagAssertionHelperAdded === true, 'assertion helper missing')
assert(result.sourceHardeningResult.runtimeDisabledFlagsStillZero === true, 'disabled flags must remain zero')
for (const [key, value] of Object.entries(result.sourceHardeningResult)) {
  if (['runtimeSourceFilesModified', 'disabledFlagKeyListAdded', 'disabledFlagAssertionHelperAdded', 'runtimeDisabledFlagsStillZero'].includes(key)) continue
  assert(value === false, `${key} must remain false`)
}

const diff = parsed['docs/sound-runtime-media-gate-2aj-runtime-guard-source-diff-register.md']
assert(diff.runtimeSourceDiff.modifiedFiles.length === 1, 'source diff must be one file')
assert(diff.runtimeSourceDiff.modifiedFiles[0].path === runtimeGuardPath, 'source diff path mismatch')
for (const [key, value] of Object.entries(diff.runtimeSourceDiff)) {
  if (key === 'modifiedFiles') continue
  assert(value === false, `${key} must remain false`)
}

const flags = parsed['docs/sound-runtime-media-gate-2aj-disabled-flag-assertion-proof.md']
assert(flags.disabledFlagAssertions.flagKeyCount === 5, 'flag key count mismatch')
assert(flags.disabledFlagAssertions.flagKeys.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED'), 'runtime flag key missing')
assert(flags.disabledFlagAssertions.flagKeys.includes('REEDITPRO_ARTIFACT_WRITE_ENABLED'), 'artifact flag key missing')
assert(flags.disabledFlagAssertions.allDefaultValues === '0', 'disabled flag defaults mismatch')
assert(flags.disabledFlagAssertions.assertionHelper === 'assertSoundCpuRuntimeDisabledFlags', 'assertion helper mismatch')
assert(flags.disabledFlagAssertions.assertionFailureMode === 'throw_fail_closed', 'assertion failure mode mismatch')
assert(flags.disabledFlagAssertions.assertionExecutedInThisGate === false, 'assertion must not execute in this gate')

const regression = parsed['docs/sound-runtime-media-gate-2aj-no-execution-regression-register.md']
for (const [key, value] of Object.entries(regression.noExecutionRegressionChecks)) {
  assert(value === true, `${key} must be true`)
}
const gate2ahDiagnostic = read('scripts/validation/sound-runtime-media-gate-2ah-diagnostics.mjs')
assert(
  gate2ahDiagnostic.includes('missing baseline export'),
  'Gate 2AH diagnostic must allow hardened export supersets while preserving baseline exports'
)
assert(regression.runtimeReadinessClaimed === false, 'runtime readiness must remain false')
assert(regression.workerReadinessClaimed === false, 'worker readiness must remain false')

const blockers = parsed['docs/sound-runtime-media-gate-2aj-runtime-guard-blocker-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_guard_source_hardening_pending'), 'resolved source-hardening blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_guard_source_hardening_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2aj-runtime-claim-policy.md']
assert(policy.allowedClaims.runtimeGuardSourceHardeningCompletedToday === true, 'source hardening claim missing')
assert(policy.allowedClaims.disabledFlagAssertionHelperAddedToday === true, 'assertion helper claim missing')
assert(policy.allowedClaims.runtimeExecutionEnabledToday === false, 'runtime execution claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must remain true')
}

const runtimeGuardSource = read(runtimeGuardPath)
assert(runtimeGuardSource.includes('SOUND_CPU_RUNTIME_DISABLED_FLAG_KEYS'), 'runtime guard key list missing in source')
assert(runtimeGuardSource.includes('assertSoundCpuRuntimeDisabledFlags'), 'runtime disabled assertion missing in source')
assert(runtimeGuardSource.includes('satisfies SoundCpuRuntimeDisabledFlags'), 'runtime flags must satisfy contract type')
for (const key of flags.disabledFlagAssertions.flagKeys) {
  const pattern = new RegExp(`${key}: '0'`)
  assert(pattern.test(runtimeGuardSource), `${key} must default to 0`)
}
assert(!/REEDITPRO_[A-Z_]+_ENABLED:\s*'1'/.test(runtimeGuardSource), 'runtime source must not enable flags')
assert(!/docker\s+(build|run|push)/i.test(runtimeGuardSource), 'runtime source must not add Docker actions')
assert(!/supabase\.|createSignedUrl|service_role|serviceRole/i.test(runtimeGuardSource), 'runtime source must not add Supabase/service-role actions')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AJ decision')
assert(nextPrompt.includes('Do not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2aj:diagnostics'] ===
    'node scripts/validation/sound-runtime-media-gate-2aj-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2aj_diagnostics_passed',
  decision,
  sourceHead,
  pr956Verified: true,
  runtimeGuardSourceHardened: true,
  modifiedRuntimeSourceFiles: [runtimeGuardPath],
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-GUARD-SOURCE-HARDENING-OWNER-REVIEW: review runtime guard source hardening, no execution'
}, null, 2))
