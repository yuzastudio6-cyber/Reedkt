#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-DRAFT-STACK-TRIAGE-1'
const packetDir = 'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1'
const decision = 'completed_qwen_persisted_worker_dispatch_draft_stack_triage_no_blind_merge'
const execution = 'completed_docs_only_qwen_dispatch_stack_triage_no_runtime_execution'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/draft-stack-triage.md`,
  `${packetDir}/stack-readiness-matrix.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-persisted-worker-dispatch-draft-stack-triage-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-source-import-1.md',
]

const requiredExistingFiles = [
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-after-gpac-dispatch-record.json',
  'docs/external-beta/tool-runtime-stack-integration-triage-1/tool-runtime-stack-integration-triage-record.json',
  'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/qwen2-5-vl-stack-rollup-record.json',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  '987dd4565bfa5cfedef74814fede477ae36a42d4',
  'PR #1695',
  '634d4a81ed720834d67622291c6e4fc810ef61d5',
  'PR #1690',
  '83b8bda891ce36e61551088ed46f297a4f10a6b9',
  'Open QWEN2.5-VL PR readback: `173` open QWEN2.5-VL PRs, `50` draft, `123` non-draft, `173` mergeable/CLEAN, `0` dirty',
  'Duplicate scan for this exact branch/title: `none_found`',
  'source_import_required_before_runtime_or_merge',
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_SOURCE_IMPORT_1',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa',
  'qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock',
  'blocked_no_additional_named_tester_list',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded as source-of-truth',
  'No PR merge, retarget, close, branch rewrite, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, Cloud Run invocation, Cloud Run deployment, identity token fetch, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.',
]

const falseSafetyKeys = [
  'prMerge',
  'prRetarget',
  'branchRewrite',
  'sourceImport',
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
  'src/',
  'server/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
]

const forbiddenClaims = [
  /\bPR merge:\s*`?(true|enabled|completed)\b/i,
  /\bsource import:\s*`?(true|enabled|completed)\b/i,
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

const record = parseJson(`${packetDir}/qwen-persisted-worker-dispatch-draft-stack-triage-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '987dd4565bfa5cfedef74814fede477ae36a42d4') fail('integration base mismatch')
if (record.duplicateScan !== 'none_found') fail('duplicate scan mismatch')
if (record.openQwenPrReadback.count !== 173) fail('open QWEN count mismatch')
if (record.openQwenPrReadback.draft !== 50) fail('draft QWEN count mismatch')
if (record.openQwenPrReadback.nonDraft !== 123) fail('non-draft QWEN count mismatch')
if (record.openQwenPrReadback.clean !== 173) fail('clean QWEN count mismatch')
if (record.openQwenPrReadback.dirty !== 0) fail('dirty QWEN count mismatch')
if (record.topDraftStack.currentTopPr.number !== 1695) fail('top PR mismatch')
if (record.topDraftStack.currentTopPr.head !== '634d4a81ed720834d67622291c6e4fc810ef61d5') fail('top PR head mismatch')
if (record.topDraftStack.currentTopPr.acceptedAs !== 'draft_stack_evidence_only') fail('top PR acceptance mismatch')
if (record.topDraftStack.executionPlanPr.number !== 1690) fail('execution plan PR mismatch')
if (record.topDraftStack.executionPlanPr.head !== '83b8bda891ce36e61551088ed46f297a4f10a6b9') fail('execution plan PR head mismatch')
if (record.sourceChain.excludedRemotionPr !== '#577 open/draft/blocked/excluded') fail('excluded PR #577 mismatch')
if (record.readiness.qwenPersistedWorkerDispatchDraftStack !== 'source_import_required_before_runtime_or_merge') fail('draft stack readiness mismatch')
if (record.readiness.qwenControlledProductFlow !== 'qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock') fail('controlled QWEN readiness mismatch')
if (record.readiness.singleTesterRealUsageQa !== 'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa') fail('single-tester blocker mismatch')
if (record.readiness.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.nextMilestone !== 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_SOURCE_IMPORT_1') fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.safety.packageInstallationBeyondDependencyValidation !== false) fail('package installation beyond dependency validation must be false')

const afterGpac = parseJson('docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-after-gpac-dispatch-record.json')
if (afterGpac.decision !== 'completed_external_product_tool_readiness_reconciliation_after_gpac_dispatch_scaffold') fail('after-GPAC readiness source drift')
if (afterGpac.toolReadiness.qwen25VlGpuModelRuntime !== 'qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock') fail('after-GPAC QWEN source drift')
const oldStack = parseJson('docs/external-beta/tool-runtime-stack-integration-triage-1/tool-runtime-stack-integration-triage-record.json')
if (oldStack.qwen25VlStack.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1') fail('older stack triage source drift')
const rollup = parseJson('docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/qwen2-5-vl-stack-rollup-record.json')
if (rollup.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1') fail('older QWEN rollup source drift')
const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
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
console.log('Decision: completed_qwen_persisted_worker_dispatch_draft_stack_triage_no_blind_merge')
console.log('Next milestone: QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_SOURCE_IMPORT_1')
