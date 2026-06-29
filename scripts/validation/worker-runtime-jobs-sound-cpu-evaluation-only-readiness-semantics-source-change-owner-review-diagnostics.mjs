#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_change_owner_review_passed_with_warnings_ready_for_next_blocker_reduction_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_change_after_plan_completed_with_warnings_ready_for_owner_review_no_runtime'
const SOURCE_HEAD = '886fbce87d9e868fae7d50a4ad2c61e02a5d9d9a'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-REMAINING-BLOCKER-SELECTION-AFTER-EVALUATION-ONLY-SEMANTICS'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-owner-acceptance-register',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-owner-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-owner-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selection-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selection-after-evaluation-only-semantics',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForPaidProduction',
  'acceptedForRealUserMediaBeta',
  'acceptedForRuntimeExecution',
  'acceptedForToolCalls',
  'acceptedForWorkerExecution',
  'artifactCreation',
  'dockerBuildRunPush',
  'dry_run_passed',
  'evaluationOnlyToolsReadyForExecution',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaProcessing',
  'modelDownload',
  'modelWeightMount',
  'paidProductionAllowed',
  'productionReady',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'sqlExecution',
  'supabaseMutation',
  'toolExecution',
  'workerExecution',
])

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function parseBlock(info) {
  const text = read(info.path)
  const marker = '```json ' + info.label
  const start = text.indexOf(marker)
  assert(start >= 0, `${info.path} missing fenced JSON label ${info.label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${info.path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function scanFalse(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanFalse(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (FALSE_FIELDS.has(key)) assert(child === false, `${trail.concat(key).join('.')} must be false`)
    scanFalse(child, trail.concat(key))
  }
}

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-after-plan.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'source change decision missing')

const specs = read('server/workers/production-readiness/production-tool-readiness-specs.ts')
const blocksExpression = specs.match(/blocksProductionIfMissing:([\s\S]*?),\n    blocksWorkerTypes/)
assert(blocksExpression, 'blocksProductionIfMissing expression missing')
assert(!blocksExpression[1].includes('evaluation_only'), 'evaluation_only must not independently hard-block production specs')

const reportBuilder = read('server/workers/readiness-validation/production-readiness-report-builder.ts')
assert(reportBuilder.includes('evaluation_only_static_visibility'), 'static visibility warning kind missing in report builder')

const blockerPolicy = read('server/workers/readiness-validation/production-readiness-blocker-policy.ts')
const hardBlockerSet = blockerPolicy.match(/const hardBlockerKinds[\s\S]*?\]\)/)
assert(hardBlockerSet, 'hardBlockerKinds set missing')
assert(!hardBlockerSet[0].includes('evaluation_only_static_visibility'), 'static visibility must not be hard blocker')
assert(hardBlockerSet[0].includes('evaluation_only_production_execution'), 'execution blocker must remain hard')

const runtimePolicy = read('server/tool-registry/tool-runtime-policy.ts')
assert(runtimePolicy.includes('productionExecutionAllowed: !evaluationOnly'), 'runtime policy must still deny evaluation-only execution')

const parsed = Object.fromEntries(Object.entries(FILES).map(([key, info]) => [key, parseBlock(info)]))
for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  if (key === 'prompt') {
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
  } else {
    assert(doc.decision === DECISION, `${key} decision mismatch`)
  }
  if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  scanFalse(doc, [key])
}

const review = parsed.review
assert(review.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(review.sourceBase.sourcePr === 1561, 'source PR mismatch')
assert(review.sourceBase.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.ownerReview.sourceChangeAccepted === true, 'source change acceptance missing')
assert(review.ownerReview.acceptedForStaticReadinessAccounting === true, 'static readiness acceptance missing')
assert(review.ownerReview.acceptedForRuntimeExecution === false, 'runtime execution must not be accepted')
assert(review.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

assert(parsed.acceptance.acceptedStaticSemantics.evaluationOnlyAloneHardBlocksProduction === false, 'static semantics acceptance mismatch')
const revideo = parsed.acceptance.toolAcceptance.find((entry) => entry.toolId === 'revideo')
assert(revideo?.executionAccepted === false, 'Revideo execution must not be accepted')
assert(revideo?.hardBlockerPreserved === 'none_for_static_readiness_if_not_requested_for_execution', 'Revideo hard-block acceptance mismatch')

assert(parsed.readiness.readinessSnapshot.hardBlockers === 57, 'hard blocker snapshot mismatch')
assert(parsed.readiness.readinessSnapshot.warnings === 32, 'warning snapshot mismatch')
assert(parsed.readiness.betaBoundary.realUserMediaBetaAllowed === false, 'real-user media beta boundary mismatch')
assert(parsed.readiness.remainingBlockerSelection.mayProceed === true, 'remaining blocker selection flag missing')

assert(parsed.blockers.resolvedFalseBlocker.id === 'revideo_static_evaluation_only_hard_block', 'resolved false blocker mismatch')
assert(parsed.blockers.duplicateLanePolicy.qwenRepresentativePr === 1542, 'QWEN duplicate policy mismatch')
assert(parsed.claims.allowedClaims.ownerReviewPassed === true, 'owner review allowed claim missing')
assert(parsed.claims.blockedClaims.evaluationOnlyToolsReadyForExecution === false, 'execution readiness must remain false')
assert(parsed.prompt.currentReadinessSnapshot.hardBlockers === 57, 'prompt hard blocker count mismatch')
assert(parsed.prompt.selectionRules.includes('inspect current readiness summary before choosing'), 'prompt live readiness rule missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      sourcePr: 1561,
      hardBlockers: 57,
      warnings: 32,
      sourceChangeAccepted: true,
      runtimeExecutionAccepted: false,
      nextPrompt: NEXT_PROMPT,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
