#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-SOURCE-IMPORT-SCOPE-1'
const packetDir = 'docs/external-beta/qwen-real-dispatch-source-import-scope-1'
const decision = 'completed_qwen_real_dispatch_source_import_scope_review_surgical_mock_import_required'
const execution = 'completed_docs_only_qwen_source_import_scope_review_no_runtime_execution'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/import-scope-review.md`,
  `${packetDir}/stack-risk-matrix.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-real-dispatch-source-import-scope-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-source-import-scope-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1.md',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/qwen-persisted-worker-dispatch-draft-stack-triage-record.json',
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-after-gpac-dispatch-record.json',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-source-import-scope-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-qwen-real-dispatch-source-import-scope-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/mock-only-source-import.md',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/preflight-envelope.md',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/validation-results.md',
  'docs/external-beta/qwen-real-dispatch-mock-only-source-import-1/qwen-real-dispatch-mock-only-source-import-record.json',
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-mock-only-source-import-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-mock-only-source-import-1-diagnostics.mjs',
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
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  'e149ca8bf962b8438d97f2c4a5c252a09caaa37c',
  'completed_qwen_persisted_worker_dispatch_draft_stack_triage_no_blind_merge',
  'PR #1695',
  '634d4a81ed720834d67622291c6e4fc810ef61d5',
  'PR #1690',
  '83b8bda891ce36e61551088ed46f297a4f10a6b9',
  'PR #1702',
  '89d7a9ddde85cff3cd4abd4547a3abb65b570d18',
  'Diff size: `5150` files changed.',
  'Insertions: `278957`.',
  'Deletions: `267632`.',
  'blocked_full_stack_import_rejected_surgical_mock_source_import_required',
  'rejected_dependency_fanout_crosses_runtime_boundary',
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa',
  'qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock',
  'blocked_no_additional_named_tester_list',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded as source-of-truth',
  'No full draft stack import, PR merge, retarget, branch rewrite, source code import, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, Cloud Run invocation, Cloud Run deployment, identity token fetch, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.',
]

const falseSafetyKeys = [
  'fullDraftStackImport',
  'prMerge',
  'prRetarget',
  'branchRewrite',
  'sourceCodeImport',
  'workerRuntimeImport',
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
  'cloudbuild/',
  '.github/',
  '.dockerignore',
  'Dockerfile',
  'requirements',
  '.env',
]

const forbiddenClaims = [
  /\bfull draft stack import:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsource code import:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker runtime import:\s*`?(true|enabled|completed|passed)\b/i,
  /\bPR merge:\s*`?(true|enabled|completed|passed)\b/i,
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

const record = parseJson(`${packetDir}/qwen-real-dispatch-source-import-scope-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== 'e149ca8bf962b8438d97f2c4a5c252a09caaa37c') fail('integration base mismatch')
if (record.duplicateScan !== 'none_found') fail('duplicate scan mismatch')
if (record.sourceChain.qwenDraftStackTriage !== 'e149ca8bf962b8438d97f2c4a5c252a09caaa37c') fail('source chain triage mismatch')
if (!record.sourceChain.topDraftApprovalPr.includes('634d4a81ed720834d67622291c6e4fc810ef61d5')) fail('top draft approval source mismatch')
if (!record.sourceChain.lowerExecutionPlanPr.includes('83b8bda891ce36e61551088ed46f297a4f10a6b9')) fail('lower execution plan source mismatch')
if (!record.sourceChain.newerPreflightPr.includes('89d7a9ddde85cff3cd4abd4547a3abb65b570d18')) fail('preflight source mismatch')
if (record.importRisk.githubStackedPr1695FileCount !== 10) fail('stacked PR file count mismatch')
if (record.importRisk.currentIntegrationToPr1695FileCount !== 5150) fail('current-integration file count mismatch')
if (record.importRisk.currentIntegrationToPr1695Insertions !== 278957) fail('current-integration insertions mismatch')
if (record.importRisk.currentIntegrationToPr1695Deletions !== 267632) fail('current-integration deletions mismatch')
if (record.importRisk.fullStackImportDecision !== 'blocked_full_stack_import_rejected_surgical_mock_source_import_required') fail('full import decision mismatch')
if (record.importRisk.workerRuntimeSourceImportInThisPhase !== 'rejected_dependency_fanout_crosses_runtime_boundary') fail('worker runtime import decision mismatch')
if (record.candidateMockOnlyImport.nextMilestone !== 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1') fail('next milestone mismatch')
if (record.candidateMockOnlyImport.workerRuntimeImport !== false) fail('worker runtime import must be false')
if (record.readiness.qwenRealDispatchSourceImportScope !== 'surgical_mock_import_required_before_runtime_preflight') fail('source import readiness mismatch')
if (record.readiness.singleTesterRealUsageQa !== 'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa') fail('single tester blocker mismatch')
if (record.readiness.qwenControlledProductFlow !== 'qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock') fail('QWEN controlled flow readiness mismatch')
if (record.readiness.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.safety.packageInstallationBeyondDependencyValidation !== false) fail('package installation beyond dependency validation must be false')

const triage = parseJson('docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/qwen-persisted-worker-dispatch-draft-stack-triage-record.json')
if (triage.decision !== 'completed_qwen_persisted_worker_dispatch_draft_stack_triage_no_blind_merge') fail('triage source drift')
if (triage.nextMilestone !== 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_SOURCE_IMPORT_1') fail('triage next milestone drift')
const afterGpac = parseJson('docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-after-gpac-dispatch-record.json')
if (afterGpac.toolReadiness.qwen25VlGpuModelRuntime !== 'qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock') fail('after-GPAC QWEN readiness drift')
const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-real-dispatch-source-import-scope-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-real-dispatch-source-import-scope-1-diagnostics.mjs'
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
    if ((file === blocked || file.startsWith(`${blocked}/`)) && !allowedChangedFiles.has(file)) {
      fail(`blocked file scope changed: ${file}`)
    }
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
console.log('Decision: completed_qwen_real_dispatch_source_import_scope_review_surgical_mock_import_required')
console.log('Next milestone: QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1')
