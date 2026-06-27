#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/qwen-stack-decision.md`,
  `${packetDir}/source-import-plan.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-stack-rollup-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-structured-output-source-import-1.md',
  'scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSourceImportFiles = [
  'server/workers/qwen2_5_vl_cloud_run_gpu/__init__.py',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/__init__.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'server/smoke/qwen2-5-vl-external-beta-structured-output-source-import-1-smoke.ts',
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-source-import-1/source-import.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-source-import-1/runtime-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-source-import-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-source-import-1/qwen2-5-vl-structured-output-source-import-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-structured-output-source-import-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-structured-output-smoke-retry-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-source-import-1-diagnostics.mjs',
]

const followOnPrivateCallerImageSourceImportFiles = [
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile',
  'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1/source-import.md',
  'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1/runtime-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-private-caller-image-source-import-1/qwen2-5-vl-private-caller-image-source-import-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-results.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1-diagnostics.mjs',
]

const followOnStructuredOutputSmokeRetryFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1/runtime-result.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1/fail-closed-restore.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-structured-output-smoke-retry-1/qwen2-5-vl-structured-output-smoke-retry-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-vllm-l4-kv-cache-tuning-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...followOnSourceImportFiles,
  ...followOnPrivateCallerImageSourceImportFiles,
  ...followOnStructuredOutputSmokeRetryFiles,
])
const smokeRetryFiles = new Set(followOnStructuredOutputSmokeRetryFiles)

const requiredText = [
  packet,
  'completed_qwen2_5_vl_stack_source_rollup_ready_for_fresh_fail_closed_source_import',
  'completed_docs_only_qwen_stack_rollup_no_runtime_execution',
  '1ee47c1cec29ddf60f494a72416d03b9ba9027a0',
  '#1287',
  '46e43a0dcbe7de602a9403caf96f1b7693a74eb5',
  'qwen2_5_vl_structured_fixture_output_source_fix_ready_smoke_retry_required',
  'The QWEN stack branch has no merge base with the current integration branch',
  'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1',
  'blocked_pending_fresh_integration_source_import_and_structured_output_smoke_retry',
  'controlled_single_tester_external_beta_remains_ready_for_aiediting_reeditpro_com_but_qwen_runtime_not_enabled',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const falseSafetyKeys = [
  'prMerge',
  'stackMerge',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'routeExecution',
  'cloudRunDeployment',
  'cloudRunInvocation',
  'identityTokenFetch',
  'qwenExecution',
  'modelImportLoad',
  'vllmInitialization',
  'dockerExecution',
  'mediaProcessing',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'deployment',
  'productionUnlock',
  'packageInstallation',
  'dependencyMutation',
  'packageLockMutation',
]

const blockedPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'src/',
  'server/',
  'docker/',
  'cloudbuild/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
]

const forbiddenClaims = [
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed)\b/i,
  /\bQWEN runtime:\s*`?(ready|enabled|completed|production_ready)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run invocation:\s*`?(true|enabled|completed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed)\b/i,
  /\bmodel import\/load:\s*`?(true|enabled|completed)\b/i,
  /\bvLLM initialization:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bdeployment:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bpackage installation:\s*`?(true|enabled|completed)\b/i,
  /\bdependency mutation:\s*`?(true|enabled|completed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-stack-rollup-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_stack_source_rollup_ready_for_fresh_fail_closed_source_import') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_qwen_stack_rollup_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '1ee47c1cec29ddf60f494a72416d03b9ba9027a0') fail('integration base mismatch')
if (record.currentTopPr?.number !== 1287) fail('current top PR mismatch')
if (record.currentTopPr?.head !== '46e43a0dcbe7de602a9403caf96f1b7693a74eb5') fail('current top head mismatch')
if (record.acceptedEvidence?.structuredOutputSourceFixAcceptedForImportPlanning !== true) fail('structured output source fix not accepted for import planning')
if (record.acceptedEvidence?.runtimeReadinessAdvanced !== false) fail('runtime readiness must not advance')
if (record.integrationRisk?.stackHasMergeBaseWithIntegration !== false) fail('merge-base risk mismatch')
if (record.integrationRisk?.directStackMergeApproved !== false) fail('direct stack merge must be false')
if (record.integrationRisk?.freshSourceImportRequired !== true) fail('fresh source import required mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1') fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-stack-integration-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(`${blocked}/`)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
  if (smokeRetryFiles.has(file)) continue
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_stack_source_rollup_ready_for_fresh_fail_closed_source_import')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1')
