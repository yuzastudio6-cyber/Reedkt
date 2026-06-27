import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-reverify-result'

const MODE =
  'qwen2_5_vl_private_invoke_auth_reverify_result_passed_no_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_51-PRIVATE-INVOKE-SMOKE-PLAN: define controlled private invoke smoke after auth/IAM reverify, no inference'

type JsonRecord = Record<string, unknown>

const docText = readFileSync('docs/qwen2-5-vl-7b-private-invoke-auth-reverify-result.md', 'utf8')
const routeDocText = readFileSync(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-route-contract.md',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-auth-reverify-result'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-auth-reverify-result-smoke.ts',
)

for (const phrase of [
  MODE,
  '`qwen25-private-invoke-auth-20260627T095446`',
  '`reeditpro`',
  '`us-central1`',
  '`reeditpro-qwen2-5-vl-l4-worker`',
  '`gcloud_version`',
  '`active_project`',
  '`active_account`',
  '`cloud_run_service_describe`',
  '`cloud_run_service_iam_policy`',
  '`runtime_service_account_describe`',
  '`project_invoker_policy_read`',
  '`nvidia_l4`',
  '`1`',
  '`3`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.ok(
  routeDocText.includes('jobs.qwen2_5_vl.privateInvoke.dryRun'),
  'route contract evidence must precede reverify result',
)

const result = QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.runId, 'qwen25-private-invoke-auth-20260627T095446')
assert.equal(result.status, 'passed')
assert.equal(result.target.project, 'reeditpro')
assert.equal(result.target.region, 'us-central1')
assert.equal(result.target.service, 'reeditpro-qwen2-5-vl-l4-worker')
assert.equal(result.verifiedToolState.gcloudVersionChecked, true)
assert.equal(result.verifiedToolState.gcloudVersion, 'Google Cloud SDK 558.0.0')
assert.equal(result.verifiedToolState.activeProjectVerified, true)
assert.equal(result.verifiedToolState.activeProject, 'reeditpro')
assert.equal(result.verifiedToolState.activeAccountPresent, true)
assert.equal(result.verifiedToolState.activeAccountValueStored, false)
assert.equal(result.verifiedToolState.activeAccountDomain, 'reeditpro.com')
assert.equal(result.verifiedToolState.cloudRunServiceDescribeVerified, true)
assert.equal(result.verifiedToolState.cloudRunServiceUrlStored, false)
assert.equal(result.verifiedToolState.cloudRunIngress, 'internal-and-cloud-load-balancing')
assert.equal(result.verifiedToolState.cloudRunServiceIamPolicyReadVerified, true)
assert.equal(result.verifiedToolState.cloudRunServiceIamBindingCount, 0)
assert.equal(result.verifiedToolState.runtimeServiceAccountVerified, true)
assert.equal(result.verifiedToolState.projectInvokerPolicyReadVerified, true)
assert.equal(result.verifiedToolState.projectInvokerPolicyBindingCount, 0)
assert.equal(result.remainingBlocker, 'private_invoke_smoke_plan_required_no_token_no_invocation')
assert.equal(result.nextPrompt, NEXT_PROMPT)

assert.equal(result.observedCloudRunCostPosture.gpuLimit, '1')
assert.equal(result.observedCloudRunCostPosture.gpuType, 'nvidia_l4')
assert.equal(result.observedCloudRunCostPosture.cpuLimit, '8')
assert.equal(result.observedCloudRunCostPosture.memoryLimit, '32Gi')
assert.equal(result.observedCloudRunCostPosture.containerConcurrency, 1)
assert.equal(result.observedCloudRunCostPosture.timeoutSeconds, 900)
assert.equal(result.observedCloudRunCostPosture.minScaleAnnotationPresent, false)
assert.equal(result.observedCloudRunCostPosture.templateMaxScale, '1')
assert.equal(result.observedCloudRunCostPosture.serviceMaxScale, '3')
assert.equal(result.observedCloudRunCostPosture.costGuardReviewRequiredBeforeInvoke, true)

for (const id of [
  'gcloud_version',
  'active_project',
  'active_account',
  'cloud_run_service_describe',
  'cloud_run_service_iam_policy',
  'runtime_service_account_describe',
  'project_invoker_policy_read',
]) {
  assert.ok((result.passedProbeIds as readonly string[]).includes(id), `missing passed probe ${id}`)
}

assert.deepEqual(result.blockedProbeIds, [])

for (const [key, value] of Object.entries(result.runtimeFlags as JsonRecord)) {
  if ([
    'authPreflightRunnerDefined',
    'defaultModeNonMutating',
    'requiresExplicitExecutionFlag',
    'requiresConfirmationEnv',
  ].includes(key)) {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must be false`)
  }
}

assert.equal(result.qwenRuntimeReadiness.privateInvocationAuthVerified, true)
assert.equal(result.qwenRuntimeReadiness.cloudRunServiceDescribeVerified, true)
assert.equal(result.qwenRuntimeReadiness.cloudRunIamPolicyVerified, true)
assert.equal(result.qwenRuntimeReadiness.runtimeServiceAccountVerified, true)
assert.equal(result.qwenRuntimeReadiness.projectInvokerPolicyVerified, true)
assert.equal(result.qwenRuntimeReadiness.readyForPrivateInvocationSmoke, false)
assert.equal(result.qwenRuntimeReadiness.betaProductionReadyClaimed, false)

const forbiddenPatterns: Array<[string, RegExp]> = [
  ['URL', /\bhttps?:\/\//i],
  ['token', /\b(ya29\.|Bearer\s+|identity[_-]?token\s*[:=]|access[_-]?token\s*[:=])/i],
  ['service account key', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['cloud run invocation true', /\bcloudRunInvocationAttempted\b\s*[:=]\s*(true|"true")/i],
  ['identity token true', /\bidentityTokenFetched\b\s*[:=]\s*(true|"true")/i],
  ['inference true', /\binferenceRun\b\s*[:=]\s*(true|"true")/i],
]

for (const [label, pattern] of forbiddenPatterns) {
  assert.equal(pattern.test(docText), false, `doc contains forbidden ${label}`)
}

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  status: result.status,
  runId: result.runId,
  passedProbeCount: result.passedProbeIds.length,
  blockedProbeCount: result.blockedProbeIds.length,
  remainingBlocker: result.remainingBlocker,
  serviceMaxScale: result.observedCloudRunCostPosture.serviceMaxScale,
  identityTokenFetched: result.runtimeFlags.identityTokenFetched,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
