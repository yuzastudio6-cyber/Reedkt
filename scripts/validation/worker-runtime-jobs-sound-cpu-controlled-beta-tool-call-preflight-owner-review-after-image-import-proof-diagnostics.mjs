import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_beta_tool_call_preflight_owner_review_after_image_import_proof_passed_with_warnings_ready_for_limited_beta_tool_call_gap_closure_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-acceptance-register-after-image-import-proof.md',
  gapMap: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-gap-map-after-image-import-proof.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-boundary-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-after-image-import-proof.md',
  sourcePreflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof.md',
  sourceChecklist: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-checklist-after-image-import-proof.md'
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${relativePath}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${relativePath}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-acceptance-register-after-image-import-proof')
const gapMap = parseBlock(files.gapMap, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-gap-map-after-image-import-proof')
const boundary = parseBlock(files.boundary, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-boundary-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-claim-policy-after-image-import-proof')
const sourcePreflight = parseBlock(files.sourcePreflight, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof')
const sourceChecklist = parseBlock(files.sourceChecklist, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-checklist-after-image-import-proof')

read(files.prompt)

assert(review.decision === decision, 'review decision mismatch')
assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(gapMap.decision === decision, 'gap map decision mismatch')
assert(boundary.decision === decision, 'boundary decision mismatch')
assert(policy.decision === decision, 'policy decision mismatch')
assert(review.sourcePr === 1175, 'source PR mismatch')
assert(review.sourceMergeCommit === '06a5b69480ac48add381bf4ecb782e72f31f7542', 'source merge mismatch')
assert(review.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.acceptedEvidence.betaFacingExecutionReadyCount === 0, 'beta execution count widened')
assert(review.acceptedEvidence.externalBetaReadyCount === 0, 'external beta widened')
assert(review.acceptedEvidence.productionReadyCount === 0, 'production widened')

assert(acceptance.acceptedForGapClosurePlanning.length === 6, 'accepted planning item count mismatch')
assert(acceptance.counts.acceptedForExecutionTodayCount === 0, 'execution accepted unexpectedly')
assert(acceptance.notAcceptedForExecutionToday.includes('worker_execution'), 'worker execution non-acceptance missing')

assert(gapMap.counts.openGapCount === 4, 'open gap count mismatch')
assert(gapMap.counts.closedGapCount === 0, 'closed gap count must remain zero')
for (const row of gapMap.remainingGapsBeforeNoMediaNoArtifactBetaToolCalls) assert(row.status === 'open', `gap must remain open: ${row.gapId}`)

assert(boundary.boundary.limitedBetaToolCallGapClosurePlanningMayProceed === true, 'gap closure planning should proceed')
for (const key of [
  'productToolCallExecutionReadyToday',
  'workerExecutionReadyToday',
  'routeExecutionReadyToday',
  'mediaProcessingReadyToday',
  'artifactDeliveryReadyToday',
  'externalBetaReadyToday',
  'productionReadyToday'
]) {
  assert(boundary.boundary[key] === false, `${key} must remain false`)
}

assert(policy.allowedClaims.limitedBetaToolCallGapClosurePlanningMayProceed === true, 'allowed gap closure claim missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden claim missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')

assert(
  sourcePreflight.decision ===
    'worker_runtime_jobs_sound_cpu_controlled_beta_tool_call_preflight_after_image_import_proof_completed_with_warnings_ready_for_controlled_beta_tool_call_preflight_owner_review_after_image_import_proof',
  'source preflight decision mismatch'
)
assert(sourcePreflight.preflightResult.productToolCallExecutionApprovedToday === false, 'source preflight widened execution')
assert(sourceChecklist.counts.passedCheckCount === 0, 'source checklist should remain pending')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-beta-tool-call-preflight-owner-review-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-review-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecutionReadyToday": true',
  '"workerExecutionReadyToday": true',
  '"routeExecutionReadyToday": true',
  '"externalBetaReadyToday": true',
  '"productionReadyToday": true',
  '"acceptedForExecutionTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_controlled_beta_tool_call_preflight_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.acceptedEvidence.acceptedSoundCpuToolCount,
      openGapCount: gapMap.counts.openGapCount,
      externalBetaReadyToday: boundary.boundary.externalBetaReadyToday,
      productionReadyToday: boundary.boundary.productionReadyToday,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
