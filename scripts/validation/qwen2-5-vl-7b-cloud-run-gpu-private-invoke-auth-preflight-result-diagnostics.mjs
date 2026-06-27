#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_SMOKE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke-result.ts'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_AUTH_PREFLIGHT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight-result.ts'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_auth_preflight_blocked_gcloud_reauth_no_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_38-BLOCKED-GCLOUD-REAUTH: refresh gcloud auth session for read-only IAM preflight, no invocation'

const REQUIRED_FILES = [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight-result.ts',
  'scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result-diagnostics.mjs',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke-result.ts',
  'package.json'
]

const REQUIRED_DOC_PHRASES = [
  DECISION,
  '`reeditpro`',
  '`reeditpro-qwen2-5-vl-l4-worker`',
  '`us-central1`',
  '`reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`',
  'interactive reauthentication required',
  '`cloudRunServiceDescribeSucceeded=false`',
  '`cloudRunIamPolicyReadSucceeded=false`',
  '`runtimeServiceAccountDescribeSucceeded=false`',
  '`projectInvokerPolicyReadSucceeded=false`',
  '`authSessionRequiresReauthentication=true`',
  '`readyForPrivateInvocation=false`',
  '`interactiveAuthRun=false`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT
]

const TRUE_FLAGS = [
  'privateInvokeAuthPreflightAttempted',
  'gcloudAvailable',
  'gcloudProjectVerified',
  'gcloudAuthListRead',
  'gcloudConfigListRead',
  'authSessionRequiresReauthentication'
]

const FALSE_FLAGS = [
  'cloudRunServiceDescribeSucceeded',
  'cloudRunIamPolicyReadSucceeded',
  'runtimeServiceAccountDescribeSucceeded',
  'projectInvokerPolicyReadSucceeded',
  'privateInvokeAuthPreflightPassed',
  'readyForPrivateInvocation',
  'interactiveAuthRun',
  'serviceUrlResolvedNow',
  'audienceResolvedNow',
  'identityTokenFetched',
  'cloudRunInvocationAttempted',
  'serviceRuntimeRequestSent',
  'iamBindingCreated',
  'serviceAccountKeyCreated',
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

const REQUIRED_MISSING_EVIDENCE = [
  'cloud_run_service_describe',
  'cloud_run_service_iam_policy',
  'approved_backend_caller_identity',
  'minimal_cloud_run_invoker_grant',
  'runtime_service_account_enabled',
  'no_unauthenticated_invoker_binding',
  'restricted_ingress_confirmed'
]

const FORBIDDEN_PATTERNS = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|iamBindingCreated|serviceAccountKeyCreated|dispatchSubmitted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.['qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result:diagnostics'] ===
    'tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result-diagnostics.mjs',
  'package.json diagnostics script mismatch'
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result.md')
const changeLog = parseBlock(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result-change-log.md',
  'qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result-change-log'
)
const result = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_AUTH_PREFLIGHT_RESULT
const upstream = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_SMOKE_RESULT

includesAll(doc, REQUIRED_DOC_PHRASES, 'private invoke auth preflight result doc')

check(upstream.runtimeFlags.privateInvokeConfigSmokePassed === true, 'Upstream config smoke must be passed')
check(upstream.runtimeFlags.cloudRunInvocationAttempted === false, 'Upstream must not invoke Cloud Run')
check(upstream.runtimeFlags.inferenceRun === false, 'Upstream must not run inference')

check(result.decision === DECISION, 'Result decision mismatch')
check(changeLog.decision === DECISION, 'Change log decision mismatch')
check(result.nextPrompt === NEXT_PROMPT, 'Result next prompt mismatch')
check(changeLog.nextPrompt === NEXT_PROMPT, 'Change log next prompt mismatch')
check(result.preflight.blockedReason === 'gcloud_auth_session_requires_interactive_reauthentication', 'Blocked reason mismatch')
check(changeLog.preflight.blockedReason === result.preflight.blockedReason, 'Change log blocked reason mismatch')
check(result.target.project === 'reeditpro', 'Project mismatch')
check(result.target.region === 'us-central1', 'Region mismatch')
check(result.target.service === 'reeditpro-qwen2-5-vl-l4-worker', 'Service mismatch')

for (const evidence of REQUIRED_MISSING_EVIDENCE) {
  check(result.requiredEvidenceStillMissing.includes(evidence), `Missing evidence item ${evidence}`)
  check(changeLog.requiredEvidenceStillMissing.includes(evidence), `Change log missing evidence item ${evidence}`)
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
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight-result.ts'
]) {
  assertNoForbiddenText(file)
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  project: result.target.project,
  service: result.target.service,
  authSessionRequiresReauthentication: result.runtimeFlags.authSessionRequiresReauthentication,
  readyForPrivateInvocation: result.runtimeFlags.readyForPrivateInvocation,
  identityTokenFetched: result.runtimeFlags.identityTokenFetched,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2))
