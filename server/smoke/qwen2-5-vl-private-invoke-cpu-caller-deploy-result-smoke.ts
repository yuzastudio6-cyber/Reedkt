import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-deploy-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source'

const MODE = 'qwen2_5_vl_private_invoke_cpu_caller_deploy_result'
const DECISION = 'qwen2_5_vl_private_invoke_cpu_caller_deployed_no_execution_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_55E-PRIVATE-INVOKE-CPU-CALLER-CONTRACT-SMOKE: execute one controlled CPU-only caller contract smoke, no inference'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return readFileSync(relativePath, 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe execution true claim', /\b(callerHarnessExecuted|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|modelImportRun|modelLoadRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe asset true claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential-looking value', /\b(sk-[A-Za-z0-9]{12,}|hf_[A-Za-z0-9]{12,}|ya29\.[A-Za-z0-9._-]+)/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenTextPatterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

function scanValues(value: unknown, pathParts: string[] = []): string[] {
  if (typeof value === 'string') {
    return forbiddenValuePatterns
      .filter(([, pattern]) => pattern.test(value))
      .map(([name]) => `${pathParts.join('.')}: ${name}`)
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValues(item, [...pathParts, String(index)]))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'defaultSubnetChanged',
    'callerHarnessExecuted',
    'identityTokenFetched',
    'identityTokenPrinted',
    'identityTokenValueStored',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'promptProcessed',
    'forwardPassRun',
    'inferenceRun',
    'providerCallsMade',
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'creditMutationCreated',
    'betaUnlocked',
    'productionUnlocked',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-deploy-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-source.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-deploy-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source.ts',
  'server/smoke/qwen2-5-vl-private-invoke-cpu-caller-deploy-result-smoke.ts',
  'package.json',
]) {
  check(existsSync(file), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-cpu-caller-deploy-result'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-cpu-caller-deploy-result-smoke.ts',
)

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-deploy-result.md')
for (const phrase of [
  MODE,
  DECISION,
  '`reeditpro-qwen2-5-vl-private-caller`',
  '`qwen2-5-vl-private-invoke-cpu-caller`',
  '`20260627-8983a7a3`',
  '`qwen-private-caller-sa@reeditpro.iam.gserviceaccount.com`',
  'service-level `roles/run.invoker`',
  '`512Mi`',
  '`qwen-private-caller-us-central1`',
  '`QWEN_CPU_CALLER_EXECUTION_ENABLED=false`',
  '`cpuOnlyCallerImageBuilt=true`',
  '`cpuOnlyCallerImagePushed=true`',
  '`cpuOnlyCallerJobDeployed=true`',
  '`callerHarnessDeployed=true`',
  '`callerHarnessExecuted=false`',
  '`jobExecutionCount=0`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamCpuCallerSourceDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE.decision,
)
assert.equal(result.buildResult.imageBuilt, true)
assert.equal(result.buildResult.imagePushed, true)
assert.equal(result.buildResult.sourceFileCount, 5)
assert.equal(result.buildResult.modelWeightsIncluded, false)
assert.equal(result.buildResult.generatedMediaIncluded, false)
assert.equal(result.buildResult.secretsIncluded, false)
assert.equal(result.deployedJob.jobName, 'reeditpro-qwen2-5-vl-private-caller')
assert.equal(result.deployedJob.region, 'us-central1')
assert.equal(result.deployedJob.serviceAccount, 'qwen-private-caller-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(result.deployedJob.serviceAccountCreated, true)
assert.equal(result.deployedJob.targetServiceInvokerBindingAdded, true)
assert.equal(result.deployedJob.cpu, '1')
assert.equal(result.deployedJob.memory, '512Mi')
assert.equal(result.deployedJob.taskCount, 1)
assert.equal(result.deployedJob.maxRetries, 0)
assert.equal(result.deployedJob.timeoutSeconds, 60)
assert.equal(result.deployedJob.gpuRequired, false)
assert.equal(result.deployedJob.minInstances, 0)
assert.equal(result.deployedJob.directVpcSubnet, 'qwen-private-caller-us-central1')
assert.equal(result.deployedJob.vpcEgress, 'all-traffic')
assert.equal(result.deployedJob.ready, true)
assert.equal(result.deployedJob.executionsAfterDeploy, 0)
assert.equal(result.envGates.QWEN_CPU_CALLER_EXECUTION_ENABLED, 'false')
assert.equal(result.envGates.QWEN_INFERENCE_ENABLED, 'false')
assert.equal(result.runtimeFlags.cpuOnlyCallerDeployResultRecorded, true)
assert.equal(result.runtimeFlags.gcpImageBuildOccurred, true)
assert.equal(result.runtimeFlags.cpuOnlyCallerImageBuilt, true)
assert.equal(result.runtimeFlags.cpuOnlyCallerImagePushed, true)
assert.equal(result.runtimeFlags.serviceAccountCreated, true)
assert.equal(result.runtimeFlags.targetServiceInvokerIamChanged, true)
assert.equal(result.runtimeFlags.cpuOnlyCallerJobDeployed, true)
assert.equal(result.runtimeFlags.callerHarnessDeployed, true)
assert.equal(result.runtimeFlags.callerHarnessReady, true)
assert.equal(result.runtimeFlags.directVpcEgressConfigured, true)
assert.equal(result.runtimeFlags.dedicatedCallerSubnetPrivateGoogleAccess, true)
assert.equal(result.runtimeFlags.jobExecutionCount, 0)
assertFalseRuntimeFlags(result.runtimeFlags as JsonRecord)
assert.deepEqual(result.remainingBlockers.map((blocker) => blocker.id), [
  'internal_contract_response_not_observed',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-deploy-result.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-deploy-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen CPU caller deploy result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  decision: result.decision,
  jobName: result.deployedJob.jobName,
  imageBuilt: result.buildResult.imageBuilt,
  imagePushed: result.buildResult.imagePushed,
  callerHarnessDeployed: result.runtimeFlags.callerHarnessDeployed,
  callerHarnessExecuted: result.runtimeFlags.callerHarnessExecuted,
  jobExecutionCount: result.runtimeFlags.jobExecutionCount,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
