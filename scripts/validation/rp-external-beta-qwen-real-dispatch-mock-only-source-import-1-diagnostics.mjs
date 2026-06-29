#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-MOCK-ONLY-SOURCE-IMPORT-1'
const packetDir = 'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1'
const decision =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_mock_only_source_import_recorded_preflight_required'
const execution = 'completed_mock_only_source_import_no_runtime_execution'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/mock-only-source-import.md`,
  `${packetDir}/preflight-envelope.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-real-dispatch-mock-only-source-import-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-mock-only-source-import-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1-smoke.ts',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-real-dispatch-source-import-scope-1/qwen-real-dispatch-source-import-scope-record.json',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-source-import-scope-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-mock-only-source-import-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-qwen-real-dispatch-mock-only-source-import-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-source-import-scope-1-diagnostics.mjs',
  'docs/external-beta/qwen-real-dispatch-preflight-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-preflight-1/preflight-gate.md',
  'docs/external-beta/qwen-real-dispatch-preflight-1/runtime-boundary.md',
  'docs/external-beta/qwen-real-dispatch-preflight-1/validation-results.md',
  'docs/external-beta/qwen-real-dispatch-preflight-1/qwen-real-dispatch-preflight-record.json',
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-preflight-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-confirmed-preflight-1.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-preflight-1-diagnostics.mjs',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/confirmed-preflight-result.md',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/runtime-boundary.md',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/validation-results.md',
  'docs/external-beta/qwen-real-dispatch-confirmed-preflight-1/qwen-real-dispatch-confirmed-preflight-record.json',
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-confirmed-preflight-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-dry-run-attempt-1.md',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-confirmed-preflight-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-confirmed-preflight-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  '6dce0272d56fb83a90e3ced99d1ee0d811a7c52c',
  'completed_qwen_real_dispatch_source_import_scope_review_surgical_mock_import_required',
  'PR #1695',
  '634d4a81ed720834d67622291c6e4fc810ef61d5',
  'PR #1690',
  '83b8bda891ce36e61551088ed46f297a4f10a6b9',
  'PR #1702',
  '89d7a9ddde85cff3cd4abd4547a3abb65b570d18',
  'worker runtime source imported: `false`',
  'Cloud Run invocation: `false`',
  'QWEN2.5-VL execution: `false`',
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded as source-of-truth',
  'No full draft stack import, PR merge, retarget, branch rewrite, worker runtime source import, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, Cloud Run invocation, Cloud Run deployment, identity token fetch, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.',
]

const falseSafetyKeys = [
  'fullDraftStackImport',
  'workerRuntimeSourceImport',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'qwen25VlExecution',
  'cloudRunInvocation',
  'cloudRunDeployment',
  'identityTokenFetch',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'generatedAssetCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'broadExternalBetaAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'dockerExecution',
  'remotionExecution',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'broadServiceRoleHandler',
]

const blockedPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'docker/',
  'cloudbuild/',
  '.github/',
  '.dockerignore',
  'Dockerfile',
  'requirements',
  '.env',
]

const forbiddenClaims = [
  /\bfull draft stack import:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker runtime source import:\s*`?(true|enabled|completed|passed)\b/i,
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed|passed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bgenerated asset creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bbroad external beta:\s*`?(ready|enabled|unlocked|approved)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bDockerfile install-source change:\s*`?(true|enabled|completed|passed)\b/i,
  /\brequirements install-source change:\s*`?(true|enabled|completed|passed)\b/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...requiredExistingFiles]) read(file)

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/qwen-real-dispatch-mock-only-source-import-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '6dce0272d56fb83a90e3ced99d1ee0d811a7c52c') fail('integration base mismatch')
if (record.duplicateScan !== 'none_found') fail('duplicate scan mismatch')
if (record.importScope.sourceImportType !== 'mock_only_plan_approval_preflight_record') fail('source import type mismatch')
if (record.importScope.fullDraftStackImported !== false) fail('full draft stack import must be false')
if (record.importScope.workerRuntimeSourceImported !== false) fail('worker runtime source import must be false')
if (record.runtimePosture.preflightRequired !== true) fail('preflight must be required')
if (record.runtimePosture.cloudRunInvocation !== false) fail('Cloud Run invocation must be false')
if (record.runtimePosture.qwen25VlExecution !== false) fail('QWEN execution must be false')
if (record.runtimePosture.workerDispatch !== false) fail('worker dispatch must be false')
if (record.preflightEnvelopeStepCount !== 10) fail('preflight envelope step count mismatch')
if (record.readiness.qwenRealDispatchMockOnlySourceImport !== 'preflight_required_runtime_disabled') fail('mock-only readiness mismatch')
if (record.readiness.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.nextMilestone !== 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1') fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.safety.mockOnlySourceImport !== true) fail('mock-only import flag must be true')

const sourceScope = parseJson('docs/external-beta/qwen-real-dispatch-source-import-scope-1/qwen-real-dispatch-source-import-scope-record.json')
if (sourceScope.decision !== 'completed_qwen_real_dispatch_source_import_scope_review_surgical_mock_import_required') fail('source scope source drift')
if (sourceScope.candidateMockOnlyImport.nextMilestone !== 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1') fail('source scope next milestone drift')
const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1'] !==
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-real-dispatch-mock-only-source-import-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-real-dispatch-mock-only-source-import-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(`${blocked}/`)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc|bin)$/i.test(file)) fail(`generated/media artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_mock_only_source_import_recorded_preflight_required')
console.log('Next milestone: QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1')
