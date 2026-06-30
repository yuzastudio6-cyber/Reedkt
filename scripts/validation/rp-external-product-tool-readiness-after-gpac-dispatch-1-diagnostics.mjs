#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-PRODUCT-TOOL-READINESS-AFTER-GPAC-DISPATCH-1'
const packetDir = 'docs/external-beta/tool-readiness-after-gpac-dispatch-1'
const decision = 'completed_external_product_tool_readiness_reconciliation_after_gpac_dispatch_scaffold'
const execution = 'completed_docs_only_tool_readiness_reconciliation_no_runtime_execution'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/readiness-reconciliation.md`,
  `${packetDir}/tool-readiness-matrix.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/tool-readiness-after-gpac-dispatch-record.json`,
  'docs/activation-phase-rp-external-product-tool-readiness-after-gpac-dispatch-1-results.md',
]

const requiredExistingFiles = [
  'docs/external-beta/tool-readiness-status-reconciliation-1/tool-readiness-status-reconciliation-record.json',
  'docs/external-beta/current-readiness-diagnostics-compatibility-1/current-readiness-diagnostics-compatibility-record.json',
  'docs/external-beta/controlled-enablement-1/controlled-enablement-record.json',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/active-lane-current-state-record.json',
  'docs/external-beta/qwen2-5-vl-product-route-runtime-readiness-rollup-1/qwen2-5-vl-product-route-runtime-readiness-rollup-record.json',
  'docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json',
  'docs/external-beta/remotion-private-preview-export-runtime-validation-1/runtime-validation-record.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-execution/gpac-mp4box-official-apt-install-source-execution-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-qa/gpac-mp4box-official-apt-install-source-qa-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-runtime-proof/gpac-mp4box-controlled-runtime-proof-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-qa/gpac-mp4box-controlled-synthetic-media-command-qa-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/external-beta/tool-execution-readiness-matrix-1/source-audit.md',
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix.md',
  'docs/external-beta/tool-execution-readiness-matrix-1/agent-execution-contract.md',
  'docs/external-beta/tool-execution-readiness-matrix-1/blocked-scope-register.md',
  'docs/external-beta/tool-execution-readiness-matrix-1/validation-results.md',
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json',
  'docs/activation-phase-rp-external-beta-tool-execution-readiness-matrix-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1.md',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-diagnostics.mjs',
  'scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-diagnostics.mjs',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/source-audit.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/draft-stack-triage.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/stack-readiness-matrix.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/validation-results.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/qwen-persisted-worker-dispatch-draft-stack-triage-record.json',
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-source-import-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-diagnostics.mjs',
  'docs/external-beta/qwen-real-dispatch-source-import-scope-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-source-import-scope-1/import-scope-review.md',
  'docs/external-beta/qwen-real-dispatch-source-import-scope-1/stack-risk-matrix.md',
  'docs/external-beta/qwen-real-dispatch-source-import-scope-1/validation-results.md',
  'docs/external-beta/qwen-real-dispatch-source-import-scope-1/qwen-real-dispatch-source-import-scope-record.json',
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-source-import-scope-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1.md',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-source-import-scope-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa',
  'blocked_no_additional_named_tester_list',
  'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation_after_official_apt_runtime_and_synthetic_command_qa',
  'qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock',
  'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation',
  'blocked_no_safe_package_source_for_core_vapoursynth_current_base',
  'blocked_pending_ai_graphics_owner_acceptance_for_film_runtime',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded as source-of-truth',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, IAM mutation, Google Group membership mutation, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this phase, MKVToolNix execution in this phase, GPAC/MP4Box execution in this phase, VapourSynth execution in this phase, Revideo execution in this phase, FILM execution, QWEN2.5-VL execution in this phase, AI Graphics execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution in this phase, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, Cloud Run readback, Cloud Run service update, or broad service-role handler was enabled.',
]

const falseSafetyKeys = [
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'deployment',
  'iamMutation',
  'googleGroupMembershipMutation',
  'broadExternalBetaAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'gstreamerExecutionInThisPhase',
  'mkvtoolnixExecutionInThisPhase',
  'gpacMp4boxExecutionInThisPhase',
  'vapoursynthExecutionInThisPhase',
  'revideoExecutionInThisPhase',
  'filmExecution',
  'qwen25VlExecutionInThisPhase',
  'aiGraphicsExecution',
  'ffmpegFfprobeExecution',
  'dockerExecution',
  'remotionExecutionInThisPhase',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'cloudRunReadback',
  'cloudRunServiceUpdate',
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
  /\bBroad external beta:\s*`?(ready|enabled|unlocked|approved)\b/i,
  /\bProduction(?: unlock)?:\s*`?(ready|enabled|unlocked|approved|production_ready)\b/i,
  /\bPaid production:\s*`?(ready|enabled|unlocked|approved)\b/i,
  /\bFinal delivery\/export:\s*`?(ready|enabled|unlocked|approved)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bGPAC\/MP4Box execution in this phase:\s*`?(true|enabled|completed|passed)\b/i,
  /\bQWEN2\.5-VL execution in this phase:\s*`?(true|enabled|completed|passed)\b/i,
  /\bGStreamer execution in this phase:\s*`?(true|enabled|completed|passed)\b/i,
  /\bMKVToolNix execution in this phase:\s*`?(true|enabled|completed|passed)\b/i,
  /\bVapourSynth execution in this phase:\s*`?(true|enabled|completed|passed)\b/i,
  /\bRevideo execution in this phase:\s*`?(true|enabled|completed|passed)\b/i,
  /\bFILM execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bRemotion execution in this phase:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run readback:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bdeployment:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed|passed)\b/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
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

const record = json(`${packetDir}/tool-readiness-after-gpac-dispatch-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== 'c77835cc2715f24726da617caca1b477d1c214d0') fail('integration base mismatch')
if (record.externalProductBeta !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('external product beta mismatch')
if (record.singleTesterRealUsageQa !== 'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa') fail('single tester real usage QA blocker mismatch')
if (record.broadExternalBeta !== 'blocked_no_additional_named_tester_list') fail('broad external beta mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.sourceChain.excludedRemotionPr !== '#577 open/draft/blocked/excluded') fail('excluded PR #577 mismatch')
if (record.sourceChain.draftSingleTesterRealUsageQaPr !== '#1686 open/draft/not_imported_as_source_of_truth') fail('draft PR #1686 source boundary mismatch')
if (record.toolReadiness.qwen25VlGpuModelRuntime !== 'qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock') fail('QWEN readiness mismatch')
if (record.toolReadiness.gpacMp4box !== 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation_after_official_apt_runtime_and_synthetic_command_qa') fail('GPAC readiness mismatch')
if (record.toolReadiness.coreVapoursynth !== 'blocked_no_safe_package_source_for_core_vapoursynth_current_base') fail('VapourSynth readiness mismatch')
if (record.toolReadiness.film !== 'blocked_pending_ai_graphics_owner_acceptance_for_film_runtime') fail('FILM readiness mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.safety.packageInstallationBeyondDependencyValidation !== false) fail('package install safety flag must be false')

const oldRecord = json('docs/external-beta/tool-readiness-status-reconciliation-1/tool-readiness-status-reconciliation-record.json')
if (oldRecord.toolGaps.gpacMp4box !== 'blocked_no_safe_package_source_for_gpac_mp4box_current_base') {
  fail('old GPAC source record unexpectedly changed; this packet should reconcile forward without rewriting history')
}
const gpacScaffold = json('docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json')
if (gpacScaffold.decision !== 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation') fail('GPAC scaffold source drift')
if (gpacScaffold.execution !== 'blocked_confirmation_absent_no_route_worker_or_tool_execution') fail('GPAC scaffold execution drift')
const qwenGo = json('docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json')
if (qwenGo.goScope.qwenRuntimeQa !== 'qa_passed_single_tester_qwen_product_flow_runtime_evidence') fail('QWEN go/no-go source drift')
const activeLane = json('docs/external-beta/active-lane-current-state-after-qwen-gate-1/active-lane-current-state-record.json')
if (activeLane.activeLane.status !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('active lane source drift')

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-product-tool-readiness-after-gpac-dispatch-1:diagnostics'] !==
  'node scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs'
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
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`generated/media artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log('External product beta: active_single_tester_external_beta_for_aiediting_reeditpro_com')
console.log('Single tester real-usage QA: blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa')
console.log('GPAC/MP4Box: blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation_after_official_apt_runtime_and_synthetic_command_qa')
