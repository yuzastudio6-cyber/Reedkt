#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_change_after_plan_completed_with_warnings_ready_for_owner_review_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_plan_after_policy_completed_with_warnings_ready_for_source_change_no_runtime'
const SOURCE_HEAD = '2ba78d7c9477394195b359ebbf1672fd9051cb30'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-READINESS-SEMANTICS-SOURCE-CHANGE-OWNER-REVIEW'
const TOOLS = ['whisper_cpp', 'transparent_background', 'revideo']

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-after-plan',
  },
  code: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-code-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-code-register',
  },
  delta: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-readiness-delta-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-readiness-delta-register',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-validation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-validation-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review',
  },
}

const FALSE_FIELDS = new Set([
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

const sourcePlanDoc = read('docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-plan-after-policy.md')
assert(sourcePlanDoc.includes(SOURCE_DECISION), 'source-plan decision missing')

const specs = read('server/workers/production-readiness/production-tool-readiness-specs.ts')
const blocksExpression = specs.match(/blocksProductionIfMissing:([\s\S]*?),\n    blocksWorkerTypes/)
assert(blocksExpression, 'blocksProductionIfMissing expression missing')
assert(!blocksExpression[1].includes('evaluation_only'), 'evaluation_only must not independently hard-block production specs')
assert(blocksExpression[1].includes('profile.modelWeightsRequired'), 'model weight blocker must remain')
assert(blocksExpression[1].includes("profile.productionStatus === 'needs_license_review'"), 'license review blocker must remain')

const policy = read('server/workers/production-readiness/production-tool-readiness-policy.ts')
assert(policy.includes('static-readiness visible, execution-blocked'), 'Revideo static visibility assertion missing')
assert(policy.includes('revideo.blocksProductionIfMissing || revideo.productionRequired || profile.launchCore'), 'Revideo static hard-block denial assertion missing')

const reportBuilder = read('server/workers/readiness-validation/production-readiness-report-builder.ts')
const statusFunction = reportBuilder.match(/function statusBlocksProduction[\s\S]*?\n}\n/)
assert(statusFunction, 'statusBlocksProduction function missing')
assert(!statusFunction[0].includes("'evaluation_only'"), 'evaluation_only status alone must not block production')
assert(reportBuilder.includes('function toolBlocksProduction'), 'tool hard-block helper missing')
assert(reportBuilder.includes('evaluation_only_static_visibility'), 'static visibility blocker missing from report builder')

const blockerPolicy = read('server/workers/readiness-validation/production-readiness-blocker-policy.ts')
assert(blockerPolicy.includes("'evaluation_only_static_visibility'"), 'static visibility blocker kind missing')
const hardBlockerSet = blockerPolicy.match(/const hardBlockerKinds[\s\S]*?\]\)/)
assert(hardBlockerSet, 'hardBlockerKinds set missing')
assert(!hardBlockerSet[0].includes('evaluation_only_static_visibility'), 'static visibility blocker must not be hard')
assert(hardBlockerSet[0].includes('evaluation_only_production_execution'), 'production execution blocker must remain hard')
assert(hardBlockerSet[0].includes('revideo_production_execution'), 'Revideo production execution blocker must remain hard')

const runtimePolicy = read('server/tool-registry/tool-runtime-policy.ts')
assert(runtimePolicy.includes('productionExecutionAllowed: !evaluationOnly'), 'runtime policy must still deny evaluation-only execution')

for (const file of [
  'server/smoke/production-readiness-validation-smoke.ts',
  'server/smoke/production-core-tool-install-smoke.ts',
  'server/smoke/production-gpu-ai-install-smoke.ts',
  'server/smoke/production-container-tool-readiness-smoke.ts',
]) {
  const text = read(file)
  assert(!text.includes('Revideo must be production-blocked'), `${file} still has old Revideo production-blocked expectation`)
}

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

const result = parsed.result
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.sourcePr === 1555, 'source PR mismatch')
assert(result.sourceChange.implemented === true, 'source change implemented flag missing')
assert(result.sourceChange.evaluationOnlyAloneHardBlocksProduction === false, 'evaluation-only static semantics mismatch')
assert(result.sourceChange.runtimePolicyStillDeniesExecution === true, 'runtime denial flag missing')
for (const tool of TOOLS) {
  assert(result.targetToolOutcomes.some((entry) => entry.toolId === tool), `target outcome missing ${tool}`)
}
const revideoOutcome = result.targetToolOutcomes.find((entry) => entry.toolId === 'revideo')
assert(revideoOutcome?.executionAllowed === false, 'Revideo execution must remain false')
assert(revideoOutcome?.hardBlockReason === 'none_for_static_readiness_if_not_requested_for_execution', 'Revideo hard-block reason mismatch')

assert(parsed.delta.afterSourceChange.hardBlockers === 57, 'hard blocker count mismatch')
assert(parsed.delta.afterSourceChange.warnings === 32, 'warning count mismatch')
assert(parsed.delta.afterSourceChange.realUserMediaBetaAllowed === false, 'real-user media beta must remain false')
assert(parsed.delta.afterSourceChange.paidProductionAllowed === false, 'paid production must remain false')
assert(parsed.claims.allowedClaims.sourceReadinessCodeChanged === true, 'source code changed claim missing')
assert(parsed.claims.allowedClaims.runtimeExecutionStillBlocked === true, 'runtime execution blocked claim missing')
assert(parsed.claims.blockedClaims.evaluationOnlyToolsReadyForExecution === false, 'evaluation-only execution readiness must be false')
assert(parsed.prompt.reviewRequired.includes('confirm real-user media beta and paid production remain blocked'), 'owner-review beta/production review missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-evaluation-only-readiness-semantics-source-change-after-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-after-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      targetTools: TOOLS,
      hardBlockersAfterChange: 57,
      warningsAfterChange: 32,
      runtimeExecutionStillBlocked: true,
      nextPrompt: NEXT_PROMPT,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
