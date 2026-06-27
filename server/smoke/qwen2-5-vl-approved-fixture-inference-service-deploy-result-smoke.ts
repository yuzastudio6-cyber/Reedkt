import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_DEPLOY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-deploy-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_SOURCE } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-source'

const ROOT = process.cwd()
const MODE = 'qwen2_5_vl_approved_fixture_inference_service_deploy_result'
const DECISION =
  'qwen2_5_vl_approved_fixture_inference_service_deployed_no_fixture_inference_yet'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58B-APPROVED-FIXTURE-INFERENCE-SMOKE-EXECUTE: run first private approved-fixture Qwen inference smoke against gated service, no generated assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(cpuCallerJobExecuted|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|fixtureInferenceSmokeExecuted|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|renderExportRun|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
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
  const findings = forbiddenTextPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
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
    'gpuServicePublicUnauthenticatedAccessAllowed',
    'cpuCallerJobExecuted',
    'identityTokenFetched',
    'identityTokenPrinted',
    'identityTokenValueStored',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'fixtureInferenceSmokeExecuted',
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
    'renderExportRun',
    'betaUnlocked',
    'productionUnlocked',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-deploy-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-deploy-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-source.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-service-deploy-result-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-approved-fixture-inference-service-deploy-result'],
  'tsx server/smoke/qwen2-5-vl-approved-fixture-inference-service-deploy-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-approved-fixture-inference-service-deploy-result.md')
for (const phrase of [
  MODE,
  DECISION,
  '`0d9e476b-933d-4bf4-9575-b04fb9919444`',
  '`22155166-7b2a-4f15-9ce0-ce320f787299`',
  '`approved-fixture-service-source-d40a0a5d-20260627t171657z`',
  '`approved-fixture-service-source-d40a0a5d-20260627t1739z`',
  '`reeditpro-qwen2-5-vl-l4-worker-00005-bw9`',
  '`reeditpro-qwen2-5-vl-private-caller`',
  '`nvidia-l4`',
  '`internal-and-cloud-load-balancing`',
  '`QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`',
  '`QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`',
  '`gpuServiceImageBuilt=true`',
  '`gpuServiceDeployed=true`',
  '`gpuServiceReady=true`',
  '`gpuServiceTemplateMaxInstancesOne=true`',
  '`gpuServiceMinInstancesZero=true`',
  '`cpuCallerImageBuilt=true`',
  '`cpuCallerJobUpdated=true`',
  '`cpuCallerJobExecuted=false`',
  '`cloudRunInvocationAttempted=false`',
  '`fixtureInferenceSmokeExecuted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_DEPLOY_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamApprovedFixtureInferenceServiceSourceDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_SOURCE.decision,
)
assert.equal(result.gpuServiceBuild.buildStatus, 'SUCCESS')
assert.equal(result.gpuServiceBuild.imageBuilt, true)
assert.equal(result.gpuServiceBuild.imagePushed, true)
assert.equal(result.gpuServiceBuild.modelWeightsIncluded, false)
assert.equal(result.gpuServiceBuild.generatedMediaIncluded, false)
assert.equal(result.gpuServiceBuild.secretsIncluded, false)
assert.equal(result.gpuServiceDeploy.serviceReady, true)
assert.equal(result.gpuServiceDeploy.revisionReady, true)
assert.equal(result.gpuServiceDeploy.latestReadyRevision, 'reeditpro-qwen2-5-vl-l4-worker-00005-bw9')
assert.equal(result.gpuServiceDeploy.gpuType, 'nvidia-l4')
assert.equal(result.gpuServiceDeploy.minInstances, 0)
assert.equal(result.gpuServiceDeploy.templateMaxInstances, 1)
assert.equal(result.gpuServiceDeploy.ingress, 'internal-and-cloud-load-balancing')
assert.equal(result.gpuServiceDeploy.publicUnauthenticatedAccessAllowed, false)
assert.equal(result.gpuModelCacheMount.readOnly, true)
assert.equal(result.gpuModelCacheMount.bucket, 'reeditpro-staging-reeditpro-model-cache')
assert.equal(result.cpuCallerBuild.buildStatus, 'SUCCESS')
assert.equal(result.cpuCallerBuild.imageBuilt, true)
assert.equal(result.cpuCallerBuild.imagePushed, true)
assert.equal(result.cpuCallerBuild.modelWeightsIncluded, false)
assert.equal(result.cpuCallerBuild.generatedMediaIncluded, false)
assert.equal(result.cpuCallerBuild.secretsIncluded, false)
assert.equal(result.cpuCallerJobDeploy.ready, true)
assert.equal(result.cpuCallerJobDeploy.gpuRequired, false)
assert.equal(result.cpuCallerJobDeploy.jobExecutedByThisPrompt, false)
assert.equal(result.failClosedEnvironment.QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED, 'false')
assert.equal(result.failClosedEnvironment.QWEN_INFERENCE_ENABLED, 'false')
assert.equal(result.failClosedEnvironment.QWEN_CPU_CALLER_EXECUTION_ENABLED, 'false')
assert.equal(result.failClosedEnvironment.QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE, 'false')
assert.equal(result.runtimeFlags.deployResultRecorded, true)
assert.equal(result.runtimeFlags.gpuServiceImageBuilt, true)
assert.equal(result.runtimeFlags.gpuServiceImagePushed, true)
assert.equal(result.runtimeFlags.gpuServiceDeployed, true)
assert.equal(result.runtimeFlags.gpuServiceReady, true)
assert.equal(result.runtimeFlags.gpuServiceRevisionReady, true)
assert.equal(result.runtimeFlags.gpuServiceInternalIngressOnly, true)
assert.equal(result.runtimeFlags.gpuServiceMinInstancesZero, true)
assert.equal(result.runtimeFlags.gpuServiceTemplateMaxInstancesOne, true)
assert.equal(result.runtimeFlags.gpuServiceModelCacheMountedReadOnly, true)
assert.equal(result.runtimeFlags.cpuCallerImageBuilt, true)
assert.equal(result.runtimeFlags.cpuCallerImagePushed, true)
assert.equal(result.runtimeFlags.cpuCallerJobUpdated, true)
assert.equal(result.runtimeFlags.cpuCallerJobReady, true)
assertFalseRuntimeFlags(result.runtimeFlags as JsonRecord)
assert.deepEqual(result.remainingBlockers.map((blocker) => blocker.id), [
  'approved_fixture_inference_smoke_execution_required',
  'beta_and_production_approval_required',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-deploy-result.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-deploy-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen approved fixture deploy result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  decision: result.decision,
  gpuBuildId: result.gpuServiceBuild.buildId,
  gpuRevision: result.gpuServiceDeploy.latestReadyRevision,
  cpuBuildId: result.cpuCallerBuild.buildId,
  cpuCallerJobReady: result.runtimeFlags.cpuCallerJobReady,
  cpuCallerJobExecuted: result.runtimeFlags.cpuCallerJobExecuted,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
