#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2o_actual_route_readiness_evaluator_source_created_with_warnings_ready_for_source_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_source_creation_plan_owner_review_passed_with_warnings_ready_for_actual_evaluator_source_creation'
const gate2nDecision = 'sound_runtime_media_gate_2n_route_readiness_evaluator_source_creation_plan_completed_with_warnings_ready_for_source_plan_owner_review'
const sourceHead = '24dbf1f4efded0a7bc0c654e3b5b600d84d5eb1a'
const pr828MergeCommit = 'dd1f133eecbe9a963a82f8e92be7526f2c951699'
const evaluatorPath = 'server/workers/sound-cpu/route-readiness-evaluator.mjs'

const docs = [
  ['docs/sound-runtime-media-gate-2o-actual-route-readiness-evaluator-source-result.md', 'sound-runtime-media-gate-2o-actual-route-readiness-evaluator-source-result'],
  ['docs/sound-runtime-media-gate-2o-evaluator-source-content-register.md', 'sound-runtime-media-gate-2o-evaluator-source-content-register'],
  ['docs/sound-runtime-media-gate-2o-source-static-validation-report.md', 'sound-runtime-media-gate-2o-source-static-validation-report'],
  ['docs/sound-runtime-media-gate-2o-owner-handoff.md', 'sound-runtime-media-gate-2o-owner-handoff'],
  ['docs/sound-runtime-media-gate-2o-blocker-register.md', 'sound-runtime-media-gate-2o-blocker-register'],
  ['docs/sound-runtime-media-gate-2o-runtime-claim-policy.md', 'sound-runtime-media-gate-2o-runtime-claim-policy'],
]

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function parseBlock(file, label) {
  const text = read(file)
  const marker = `\`\`\`json ${label}`
  const start = text.indexOf(marker)
  assert(start >= 0, `${file} missing JSON block ${label}`)
  const jsonStart = start + marker.length
  const end = text.indexOf('```', jsonStart)
  assert(end >= 0, `${file} missing JSON close`)
  return JSON.parse(text.slice(jsonStart, end).trim())
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must remain false`)
  }
}

for (const [file, label] of docs) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
  parseBlock(file, label)
}

const result = parseBlock(docs[0][0], docs[0][1])
const content = parseBlock(docs[1][0], docs[1][1])
const validation = parseBlock(docs[2][0], docs[2][1])
const handoff = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review')
const gate2n = parseBlock('docs/sound-runtime-media-gate-2n-route-readiness-evaluator-source-creation-plan.md', 'sound-runtime-media-gate-2n-route-readiness-evaluator-source-creation-plan')

for (const entry of [result, content, validation, handoff, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2O decision mismatch')
}

assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr830.status === 'merged', 'PR #830 must be merged')
assert(result.sourceVerification.pr830.mergeCommit === sourceHead, 'PR #830 merge commit mismatch')
assert(result.sourceVerification.pr830.decision === ownerDecision, 'PR #830 decision mismatch')
assert(result.sourceVerification.pr828.status === 'merged', 'PR #828 must be merged')
assert(result.sourceVerification.pr828.mergeCommit === pr828MergeCommit, 'PR #828 merge commit mismatch')
assert(result.sourceVerification.pr828.decision === gate2nDecision, 'PR #828 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(gate2n.decision === gate2nDecision, 'Gate 2N decision mismatch')

assert(result.sourceResult.evaluatorSourceCreated === true, 'evaluator source must be created')
assert(result.sourceResult.evaluatorSourcePath === evaluatorPath, 'evaluator path mismatch')
assert(result.sourceResult.nodeBuiltinsOnly === true, 'node-builtins-only claim missing')
assert(result.sourceResult.staticFixtureScoped === true, 'static fixture scope missing')
assert(result.sourceResult.failClosedReadinessClaim === true, 'fail-closed readiness claim missing')
assert(result.sourceResult.routeContractCount === 4, 'route count mismatch')
assert(result.sourceResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(result.sourceResult.rejectedPayloadFieldCount === 14, 'rejected field count mismatch')
assert(result.sourceResult.mismatchCaseCount === 5, 'mismatch count mismatch')
for (const key of [
  'routeResolverImported',
  'routeExecutionRun',
  'serverRouteExecuted',
  'workerDispatchRun',
  'workerExecutionRun',
  'toolExecutionRun',
  'mediaProcessingRun',
  'dockerOrGcpRun',
  'supabaseOrSqlRun',
  'artifactCreated',
  'routeReadinessClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'mediaReadinessClaimed',
  'betaOrProductionReadinessClaimed',
]) {
  assert(result.sourceResult[key] === false, `sourceResult.${key} must remain false`)
}

const sourceFile = path.join(root, evaluatorPath)
assert(fs.existsSync(sourceFile), 'evaluator source file missing')
const sourceText = fs.readFileSync(sourceFile, 'utf8')
assert(sourceText.includes('SOUND-RUNTIME-MEDIA-GATE-2O'), 'source missing gate marker')
assert(sourceText.includes('readinessClaim: false'), 'source must fail closed on readiness claim')
assert(sourceText.includes('generatedLocalFixturePassed: false'), 'source must keep generated fixture claim closed')
assert(sourceText.includes('dryRunPassed: false'), 'source must keep dry-run claim closed')
assert(sourceText.includes('export function evaluateSoundCpuRouteReadinessFixtures'), 'source missing evaluator export')
assert(sourceText.includes('export function summarizeSoundCpuRouteReadiness'), 'source missing summary export')
assert(!/(^|\n)\s*import\s+/.test(sourceText), 'source must not import dependencies')
assert(!/\brequire\s*\(/.test(sourceText), 'source must not require dependencies')
assert(!/\bfetch\s*\(/.test(sourceText), 'source must not call fetch')
assert(!/child_process|execFile|execSync|spawn|spawnSync|new\s+Worker|process\.env|Deno\.|Bun\./i.test(sourceText), 'source contains prohibited runtime execution marker')

assert(content.sourceContent.path === evaluatorPath, 'content path mismatch')
assert(content.sourceContent.exports.length === 6, 'export count mismatch')
assert(content.sourceContent.expectedCounts.routeContractCount === 4, 'content route count mismatch')
assert(content.sourceContent.readinessClaimDefault === false, 'readiness default must remain false')
for (const value of Object.values(content.prohibitedContent)) {
  assert(value === true, 'prohibited content entries must be true')
}

assert(validation.staticValidation.sourceExists === true, 'validation source exists missing')
assert(validation.staticValidation.nodeCheckPassed === true, 'node check missing')
assert(validation.staticValidation.diagnosticsPassed === true, 'diagnostics flag missing')
for (const [key, value] of Object.entries(validation.staticValidation)) {
  if (!['sourceExists', 'nodeCheckPassed', 'diagnosticsPassed'].includes(key)) {
    assert(value === false, `staticValidation.${key} must remain false`)
  }
}
assertAllFalse(validation.validationMode, 'validation mode')
assert(handoff.handoffTarget === 'WORKER_RUNTIME_JOBS', 'handoff target mismatch')
assert(handoff.acceptedInputs.evaluatorSourcePath === evaluatorPath, 'handoff path mismatch')
assertAllFalse(handoff.acceptedForExecutionToday, 'accepted for execution today')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_runtime_jobs_evaluator_source_owner_review_pending' && row.status === 'next'), 'source owner review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.evaluatorSourceCreated === true, 'allowed source created claim missing')
assert(policy.allowedClaims.staticSourceValidationPassed === true, 'allowed static validation claim missing')
assert(policy.allowedClaims.futureOwnerReviewRequired === true, 'allowed owner review claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-owner-review.md')
assert(nextPrompt.includes(decision), 'owner-review prompt must require Gate 2O decision')
assert(nextPrompt.includes('no execution'), 'owner-review prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2o:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2o-diagnostics.mjs', 'Gate 2O package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2o_diagnostics_passed',
  decision,
  sourceHead,
  pr830Verified: true,
  evaluatorSourceCreated: result.sourceResult.evaluatorSourceCreated,
  evaluatorSourcePath: result.sourceResult.evaluatorSourcePath,
  routeContractCount: result.sourceResult.routeContractCount,
  acceptedFixtureCount: result.sourceResult.acceptedFixtureCount,
  rejectedPayloadFieldCount: result.sourceResult.rejectedPayloadFieldCount,
  mismatchCaseCount: result.sourceResult.mismatchCaseCount,
  routeResolverImported: result.sourceResult.routeResolverImported,
  routeExecutionRun: result.sourceResult.routeExecutionRun,
  workerExecutionRun: result.sourceResult.workerExecutionRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
