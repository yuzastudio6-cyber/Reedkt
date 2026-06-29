#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_plan_after_policy_completed_with_warnings_ready_for_source_change_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_evaluation_only_production_selection_policy_after_model_gpu_routing_completed_with_warnings_ready_for_readiness_semantics_source_plan_no_runtime'
const SOURCE_HEAD = 'c5b07c6301fda299306576e44db71669dcc4ea77'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-READINESS-SEMANTICS-SOURCE-CHANGE-AFTER-PLAN'
const TOOLS = ['whisper_cpp', 'transparent_background', 'revideo']

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-plan-after-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-plan-after-policy',
  },
  sourceMap: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-map.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-map',
  },
  testMap: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-test-impact-map.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-test-impact-map',
  },
  risks: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-risk-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-risk-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-after-plan',
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
  'sourceCodeMutatedInThisGate',
  'sourceReadinessCodeChanged',
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

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'source evaluation-only policy decision missing')

const specs = read('server/workers/production-readiness/production-tool-readiness-specs.ts')
assert(
  specs.includes("profile.productionStatus === 'evaluation_only'") && specs.includes('blocksProductionIfMissing'),
  'current source evidence for evaluation-only production blocking is missing',
)

const readinessPolicy = read('server/workers/production-readiness/production-tool-readiness-policy.ts')
assert(
  readinessPolicy.includes('Revideo must be production-blocked and not launch core.') ||
    readinessPolicy.includes('Revideo must be evaluation-only, static-readiness visible, execution-blocked, and not launch core.'),
  'Revideo evaluation-only execution-blocked assertion missing',
)

const reportBuilder = read('server/workers/readiness-validation/production-readiness-report-builder.ts')
assert(
  reportBuilder.includes("'evaluation_only'") && reportBuilder.includes('evaluation_only_production_execution'),
  'current readiness report evaluation-only blocker evidence missing',
)

const runtimePolicy = read('server/tool-registry/tool-runtime-policy.ts')
assert(runtimePolicy.includes('productionExecutionAllowed: !evaluationOnly'), 'runtime policy must deny evaluation-only execution')

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

const plan = parsed.plan
assert(plan.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(plan.sourceBase.sourcePr === 1553, 'source PR mismatch')
assert(plan.sourceBase.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
for (const tool of TOOLS) {
  assert(plan.targetTools.includes(tool), `plan target missing ${tool}`)
}
assert(plan.currentStateVerified.evaluationOnlyExecutionDenied === true, 'execution denial evidence missing')
assert(plan.currentStateVerified.evaluationOnlyStillHardBlocksProductionReadiness === true, 'current hard-block evidence missing')
assert(plan.sourcePlan.plannedSemantics.evaluationOnlyAloneHardBlocksProduction === false, 'planned static semantics mismatch')
assert(plan.sourcePlan.plannedSemantics.runtimePolicyStillDeniesExecution === true, 'runtime denial planned semantics missing')
assert(plan.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const sourceMap = parsed.sourceMap
const sourcePaths = sourceMap.sourceFilesToReview.map((entry) => entry.path)
for (const requiredPath of [
  'server/workers/production-readiness/production-tool-readiness-specs.ts',
  'server/workers/production-readiness/production-tool-readiness-policy.ts',
  'server/workers/readiness-validation/production-readiness-report-builder.ts',
  'server/workers/readiness-validation/production-readiness-blocker-policy.ts',
  'server/tool-registry/tool-runtime-policy.ts',
]) {
  assert(sourcePaths.includes(requiredPath), `source map missing ${requiredPath}`)
}
const revideoOutcome = sourceMap.expectedToolOutcomesAfterFutureChange.find((entry) => entry.toolId === 'revideo')
assert(revideoOutcome?.executionAllowed === false, 'Revideo execution must remain blocked')
assert(revideoOutcome?.hardBlockReason === 'none_for_static_readiness_if_not_requested_for_execution', 'Revideo planned hard-block reason mismatch')

const testMap = parsed.testMap
assert(testMap.testImpact.some((entry) => entry.path === 'server/smoke/production-readiness-validation-smoke.ts'), 'test impact missing production readiness smoke')
assert(testMap.forbiddenTestShortcuts.includes('do not unlock real-user media beta or paid production'), 'forbidden test shortcut missing beta/production boundary')

assert(parsed.risks.duplicateLanePolicy.qwenRepresentativePr === 1542, 'duplicate lane QWEN representative mismatch')
assert(parsed.risks.duplicateLanePolicy.aiBrollRepresentativePr === 962, 'duplicate lane AI B-roll representative mismatch')
assert(parsed.claims.allowedClaims.sourceSemanticsPlanCompleted === true, 'source plan allowed claim missing')
assert(parsed.claims.readinessBoundaries.realUserMediaBetaAllowed === false, 'real-user media beta boundary mismatch')

const prompt = parsed.prompt
for (const tool of TOOLS) {
  assert(prompt.targetTools.includes(tool), `prompt target missing ${tool}`)
}
assert(prompt.requiredSourceChanges.includes('preserve runtime execution denial in tool-runtime-policy'), 'prompt must preserve runtime denial')
assert(prompt.blockedScope.includes('real-user media beta unlock'), 'prompt real-user beta block missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-evaluation-only-readiness-semantics-source-plan-after-policy:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-plan-after-policy-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      targetTools: TOOLS,
      sourceReadinessCodeChanged: false,
      futureSourceChangeReady: true,
      runtimeExecutionStillBlocked: true,
      nextPrompt: NEXT_PROMPT,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
