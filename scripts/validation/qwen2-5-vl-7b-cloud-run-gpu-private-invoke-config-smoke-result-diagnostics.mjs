#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_SMOKE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke-result.ts'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_smoke_passed_no_invocation'
const CONFIG_DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_contract_defined_no_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_38-CLOUD-RUN-GPU-PRIVATE-INVOKE-AUTH-PREFLIGHT: verify private Cloud Run IAM and service account preconditions, no token/no invocation'

const REQUIRED_FILES = [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke-result.ts',
  'scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result-diagnostics.mjs',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke.ts',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-change-log.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts',
  'package.json'
]

const REQUIRED_DOC_PHRASES = [
  DECISION,
  'npm run smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config',
  '`reeditpro-qwen2-5-vl-l4-worker`',
  '`us-central1`',
  '`google_signed_identity_token_backend_only`',
  '`65536`',
  '`privateInvokeConfigSmokePassed=true`',
  '`configValuesReadNow=false`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT
]

const TRUE_FLAGS = [
  'privateInvokeConfigSmokePassed',
  'configContractImported',
  'configDocsChecked',
  'packageScriptChecked',
  'validCandidateAcceptedForFutureRuntime',
  'unsafeConfigCandidatesRejected',
  'forbiddenValuesRejected'
]

const FALSE_FLAGS = [
  'configValuesReadNow',
  'serviceUrlStoredInRepo',
  'serviceUrlResolvedNow',
  'audienceResolvedNow',
  'identityTokenFetched',
  'cloudRunInvocationAttempted',
  'serviceRuntimeRequestSent',
  'dispatchSubmitted',
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
  'generatedLocalFixturePassedClaimed'
]

const FORBIDDEN_PATTERNS = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(configValuesReadNow|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|dispatchSubmitted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed|claimsDryRunPassed|claimsGeneratedLocalFixturePassed)\b\s*[:=]\s*(true|"true")/i]
]

function check(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp('```json\\s+' + escaped + '\\n([\\s\\S]*?)\\n```'))
  check(match, `Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function includesAll(text, values, label) {
  for (const value of values) {
    check(text.includes(value), `${label} missing ${value}`)
  }
}

function assertNoForbiddenText(relativePath) {
  const text = read(relativePath)
  const findings = []
  for (const [name, pattern] of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) findings.push(name)
  }
  check(findings.length === 0, `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
check(
  packageJson.scripts?.['qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result:diagnostics'] ===
    'tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result-diagnostics.mjs',
  'package.json diagnostics script mismatch'
)
check(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config'] ===
    'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke.ts',
  'package.json smoke script mismatch'
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result.md')
const changeLog = parseBlock(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result-change-log.md',
  'qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result-change-log'
)
const result = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_SMOKE_RESULT
const config = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG

includesAll(doc, REQUIRED_DOC_PHRASES, 'private invoke config smoke result doc')

check(config.decision === CONFIG_DECISION, 'Upstream config decision mismatch')
check(config.runtimeFlags.validConfigCandidateAcceptedForFutureRuntime === true, 'Upstream valid candidate must be accepted')
check(config.runtimeFlags.unsafeConfigCandidatesRejected === true, 'Upstream unsafe candidates must be rejected')
check(config.runtimeFlags.cloudRunInvocationAttempted === false, 'Upstream must not invoke Cloud Run')
check(config.runtimeFlags.inferenceRun === false, 'Upstream must not run inference')

check(result.decision === DECISION, 'Result decision mismatch')
check(changeLog.decision === DECISION, 'Change log decision mismatch')
check(result.nextPrompt === NEXT_PROMPT, 'Result next prompt mismatch')
check(changeLog.nextPrompt === NEXT_PROMPT, 'Change log next prompt mismatch')
check(result.validatedConfig.service === 'reeditpro-qwen2-5-vl-l4-worker', 'Service mismatch')
check(result.validatedConfig.region === 'us-central1', 'Region mismatch')
check(result.validatedConfig.maxBodyBytes === 65536, 'Max body bytes mismatch')
check(result.validatedConfig.allowedBackendConfigKeyCount === 7, 'Config key count mismatch')
check(changeLog.validatedConfig.allowedBackendConfigKeyCount === 7, 'Change log config key count mismatch')

for (const [key, value] of Object.entries(result.fixtureResults)) {
  check(value === true, `Fixture result ${key} must be true`)
  check(changeLog.fixtureResults?.[key] === true, `Change log fixture result ${key} must be true`)
}

for (const flag of TRUE_FLAGS) {
  check(result.runtimeFlags?.[flag] === true, `Result runtime flag ${flag} must be true`)
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`)
}
for (const flag of FALSE_FLAGS) {
  check(result.runtimeFlags?.[flag] === false, `Result runtime flag ${flag} must be false`)
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke-result.ts'
]) {
  assertNoForbiddenText(file)
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  service: result.validatedConfig.service,
  region: result.validatedConfig.region,
  configKeyCount: result.validatedConfig.allowedBackendConfigKeyCount,
  privateInvokeConfigSmokePassed: result.runtimeFlags.privateInvokeConfigSmokePassed,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2))
