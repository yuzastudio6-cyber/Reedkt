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
  main: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-evidence-register.md',
  counts: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-count-register.md',
  duplicate: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-duplicate-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-blocker-register.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof.md',
  sourceOwner: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-review.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-import-proof-register.md',
  oldPreflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md',
  productBeta: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  toolCall: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-reconciliation.md',
  runtimeGate: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review.md',
  packageJson: 'package.json'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_after_image_import_proof_completed_with_warnings_ready_for_controlled_runtime_beta_preflight_refresh'
const main = parseJsonBlock(files.main, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof')
const evidence = parseJsonBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-evidence-register')
const counts = parseJsonBlock(files.counts, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-count-register')
const duplicate = parseJsonBlock(files.duplicate, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-duplicate-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-blocker-register')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-next-step-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-claim-policy')
const sourceOwner = parseJsonBlock(files.sourceOwner, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-review')
const sourceProof = parseJsonBlock(files.sourceProof, 'worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-import-proof-register')
const oldPreflight = parseJsonBlock(files.oldPreflight, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight')
const productBeta = parseJsonBlock(files.productBeta, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure')
const toolCall = parseJsonBlock(files.toolCall, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-reconciliation')
const runtimeGate = parseJsonBlock(files.runtimeGate, 'worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review')

for (const doc of [main, evidence, counts, duplicate, blockers, next, policy]) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
  assert(doc.decision === decision, 'decision mismatch')
}

assert(main.sourceVerification.sourceHead === '57803a1f7e37ac859279532441bda1738c291844', 'source head mismatch')
assert(main.sourceVerification.pr1153.status === 'merged', 'PR #1153 status mismatch')
assert(main.sourceVerification.pr1153.decision === sourceOwner.decision, 'PR #1153 decision mismatch')
assert(main.reconciliationResult.containerImageImportProofAccepted === true, 'image proof acceptance missing')
assert(main.reconciliationResult.metadataPassed === 13, 'metadata count mismatch')
assert(main.reconciliationResult.importsPassed === 14, 'import count mismatch')
assert(main.reconciliationResult.priorControlledRuntimeBetaPreflightPredatesImageImportProof === true, 'stale preflight flag missing')
assert(main.reconciliationResult.currentSourceNeedsPreflightRefresh === true, 'preflight refresh flag missing')

for (const key of [
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'billingStripeApprovedToday',
  'externalBetaAllowedToday',
  'productionAllowedToday'
]) assert(main.reconciliationResult[key] === false, `${key} must be false`)

for (const row of evidence.evidenceRows) {
  assert(row.evidenceFiles.length > 0, `${row.lane} evidence missing`)
  for (const file of row.evidenceFiles) assert(exists(file), `missing evidence file ${file}`)
}
assert(evidence.evidenceRows.some((row) => row.lane === 'controlled_runtime_beta_preflight' && row.status === 'stale_after_image_import_proof'), 'stale preflight evidence missing')

assert(counts.counts.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(counts.counts.metadataPassedCount === sourceProof.metadata.passed, 'metadata source mismatch')
assert(counts.counts.containerImportPassedCount === sourceProof.imports.passed, 'import source mismatch')
assert(counts.counts.productToolCallExecutionReadyCount === 0, 'product tool-call count must be zero')
assert(counts.counts.externalBetaReadyCount === 0, 'external beta count must be zero')
assert(counts.interpretation.preflightRefreshRequiredBecauseSourceChanged === true, 'preflight refresh interpretation missing')

assert(duplicate.duplicateReview.samePurposeOpenPrFound === false, 'same-purpose PR must be false')
assert(duplicate.duplicateReview.samePurposeRemoteBranchFound === false, 'same-purpose branch must be false')
assert(duplicate.duplicateReview.adjacentOpenPrs.length >= 3, 'adjacent PRs must be recorded')
assert(duplicate.duplicateReview.adjacentOpenPrs.every((row) => row.blocksThisPacket === false), 'adjacent PRs must not block')

assert(blockers.resolvedForPlanning.some((row) => row.id === 'container_image_import_blocker'), 'image import resolved blocker missing')
assert(blockers.stillBlocked.some((row) => row.id === 'controlled_runtime_beta_preflight_stale' && row.status === 'next'), 'next blocker missing')
assert(blockers.stillBlocked.some((row) => row.id === 'product_tool_call_execution'), 'product tool-call blocker missing')

assert(next.selectedNextStep.prompt.includes('CONTROLLED-RUNTIME-BETA-PREFLIGHT-AFTER-IMAGE-IMPORT-PROOF'), 'next prompt mismatch')
assert(next.selectedNextStep.promptFile === files.nextPrompt, 'next prompt file mismatch')
assert(next.nonSelectedNextSteps.some((row) => row.prompt === 'external_beta_unlock'), 'external beta non-selection missing')

assert(policy.allowedClaims.imageImportProofAcceptedForPlanning === true, 'policy image proof claim missing')
assert(policy.allowedClaims.importsPassed === '14/14', 'policy imports claim mismatch')
for (const claim of ['product tool-call execution ready', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(sourceOwner.reviewOutcome.importsPassed === 14, 'source owner import mismatch')
assert(oldPreflight.preflightResult.externalBetaAllowed === false, 'old preflight external beta widened')
assert(oldPreflight.sourceVerification.sourceHead !== main.sourceVerification.sourceHead, 'old preflight should predate current source')
assert(productBeta.gapClosureResult.allPlanningGapsClosedToday === true, 'product beta planning gaps not closed')
assert(productBeta.gapClosureResult.externalBetaAllowed === false, 'product beta external beta widened')
assert(toolCall.reconciliationResult.productToolCallExecutionReadyCount === 0, 'tool-call readiness widened')
assert(runtimeGate.ownerReviewResult.runtimeExecutionApprovedToday === false, 'runtime execution widened')

const prompt = read(files.nextPrompt)
assert(prompt.includes(decision), 'next prompt must require reconciliation decision')
assert(prompt.includes('Docker build/run/push'), 'next prompt must block Docker')
assert(prompt.includes('If the preflight passes'), 'next prompt must describe pass behavior')

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-diagnostics.mjs',
  'package diagnostics script missing'
)

const changedText = [
  files.main,
  files.evidence,
  files.counts,
  files.duplicate,
  files.blockers,
  files.next,
  files.policy,
  files.nextPrompt
].map(read).join('\n')

for (const forbidden of [
  'externalBetaAllowedToday": true',
  'productionAllowedToday": true',
  'productToolCallExecutionReadyCount": 15',
  'workerExecutionReadyCount": 15',
  'routeExecutionReadyCount": 15',
  'supabaseSqlReadyCount": 1',
  'sqlExecuted": "yes"',
  'updateRequired": "yes"'
]) assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_after_image_import_proof_diagnostics_passed',
  decision,
  sourceHead: main.sourceVerification.sourceHead,
  importsPassed: main.reconciliationResult.importsPassed,
  productToolCallExecutionReadyCount: counts.counts.productToolCallExecutionReadyCount,
  externalBetaReadyCount: counts.counts.externalBetaReadyCount,
  nextPrompt: main.nextPrompt
}, null, 2))
