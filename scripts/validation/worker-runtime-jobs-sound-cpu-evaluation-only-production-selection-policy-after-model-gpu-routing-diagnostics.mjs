#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_evaluation_only_production_selection_policy_after_model_gpu_routing_completed_with_warnings_ready_for_readiness_semantics_source_plan_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_model_gpu_evaluation_blocker_routing_after_launch_core_recheck_completed_with_warnings_ready_for_evaluation_only_policy_closure_no_runtime'
const SOURCE_HEAD = 'bca6b820ed7559a3a6902106c0ae621c644b4ecf'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-READINESS-SEMANTICS-SOURCE-PLAN-AFTER-POLICY'
const TOOLS = ['whisper_cpp', 'transparent_background', 'revideo']

const FILES = {
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing',
  },
  tools: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-tool-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-tool-register',
  },
  gap: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-gap-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-gap-register',
  },
  duplicate: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-duplicate-lane-register.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-duplicate-lane-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-plan-after-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-plan-after-policy',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForLaunchCoreProductionSelectionToday',
  'acceptedForMediaProcessingToday',
  'acceptedForPaidProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForToolCallExecutionToday',
  'acceptedForWorkerExecutionToday',
  'artifactCreation',
  'dockerBuildRunPush',
  'dry_run_passed',
  'evaluationOnlyToolsPromotedToLaunchCore',
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
  'selectedForExecutionToday',
  'selectedForRealUserMediaBetaToday',
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

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'source model/GPU routing decision missing')
assert(sourceDoc.includes('evaluationOnlyPolicySelectedAsNextSoundCpuClosure'), 'source evaluation-only selection missing')

const specs = read('server/workers/production-readiness/production-tool-readiness-specs.ts')
assert(specs.includes("profile.productionStatus === 'evaluation_only'"), 'readiness specs missing evaluation-only branch')
assert(specs.includes("profile.productionStatus === 'evaluation_only'"), 'readiness specs missing evaluation-only status marker')
assert(specs.includes('blocksProductionIfMissing'), 'readiness specs missing blocksProductionIfMissing')

const policy = read('server/workers/production-readiness/production-tool-readiness-policy.ts')
assert(policy.includes('assertRevideoReadinessBlocked'), 'policy missing Revideo readiness assertion')
assert(
  policy.includes('Revideo must be production-blocked and not launch core.') ||
    policy.includes('Revideo must be evaluation-only, static-readiness visible, execution-blocked, and not launch core.'),
  'policy missing Revideo evaluation-only execution-blocked expectation',
)

const runtimePolicy = read('server/tool-registry/tool-runtime-policy.ts')
assert(runtimePolicy.includes('productionExecutionAllowed: !evaluationOnly'), 'runtime policy must deny evaluation-only production execution')

const profiles = read('server/tool-registry/production-tool-profiles.ts')
for (const tool of TOOLS) {
  assert(profiles.includes(`toolId: '${tool}'`), `profile missing ${tool}`)
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

const policyDoc = parsed.policy
assert(policyDoc.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(policyDoc.sourceBase.sourcePr === 1549, 'source PR mismatch')
assert(policyDoc.sourceBase.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
for (const tool of TOOLS) {
  assert(policyDoc.policyDecision.evaluationOnlyToolsReviewed.includes(tool), `policy decision missing ${tool}`)
}
assert(policyDoc.policyDecision.currentReadinessSemanticsGapFound === true, 'semantics gap flag missing')
assert(policyDoc.policyDecision.sourceSemanticsPlanRequiredBeforeCodeChange === true, 'source plan flag missing')
assert(policyDoc.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const toolRows = parsed.tools.tools
assert(toolRows.length === TOOLS.length, 'tool row count mismatch')
for (const tool of TOOLS) {
  const row = toolRows.find((entry) => entry.toolId === tool)
  assert(row, `missing tool row ${tool}`)
  assert(row.status === 'evaluation_only', `${tool} status mismatch`)
  assert(row.launchCoreRequired === false, `${tool} launchCoreRequired must be false`)
}
assert(parsed.tools.policyConclusion.evaluationOnlyToolsMustRemainExecutionBlocked === true, 'execution block policy missing')
assert(parsed.tools.policyConclusion.sourceSemanticsReviewCanProceed === true, 'source semantics review flag missing')

const gap = parsed.gap
assert(gap.currentSourceEvidence.currentEvaluationOnlyBlocksProductionIfMissing === true, 'current block evidence mismatch')
assert(gap.currentSourceEvidence.currentRevideoPolicyRequiresProductionBlocked === true, 'current Revideo evidence mismatch')
assert(gap.currentSourceEvidence.currentRuntimePolicyBlocksEvaluationOnlyExecution === true, 'runtime policy evidence mismatch')
assert(gap.semanticsGap.gapFound === true, 'gap found flag missing')
assert(
  gap.requiredSourcePlanBeforeCodeChange.includes('preserve execution block in tool-runtime policy'),
  'source plan requirement missing runtime denial',
)

assert(parsed.duplicate.duplicateReview.samePurposeBranchFoundBeforePacket === false, 'same-purpose branch duplicate mismatch')
assert(parsed.duplicate.duplicateReview.samePurposeOpenPrFoundBeforePacket === false, 'same-purpose PR duplicate mismatch')
assert(parsed.duplicate.activeAdjacentLanePolicy.qwenBackendRuntimePersistence === 'do_not_duplicate', 'QWEN adjacent policy mismatch')

assert(parsed.claims.allowedClaims.evaluationOnlyProductionSelectionReviewed === true, 'allowed policy review claim missing')
assert(parsed.claims.allowedClaims.readinessSemanticsGapIdentified === true, 'allowed gap claim missing')
assert(parsed.claims.blockedClaims.evaluationOnlyToolsReadyForExecution === false, 'execution readiness claim must be false')

const prompt = parsed.prompt
for (const tool of TOOLS) {
  assert(prompt.targetTools.includes(tool), `prompt target missing ${tool}`)
}
assert(prompt.scope.blocked.includes('source code mutation without an explicit plan'), 'prompt source mutation block missing')
assert(prompt.scope.blocked.includes('real-user media beta unlock'), 'prompt real-user beta block missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      evaluationOnlyTools: TOOLS,
      currentReadinessSemanticsGapFound: true,
      executionStillBlocked: true,
      selectedNextPrompt: NEXT_PROMPT,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
