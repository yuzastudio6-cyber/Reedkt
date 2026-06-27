#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-PRODUCT-TOOL-READINESS-STATUS-RECONCILIATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/tool-readiness-status-reconciliation-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/status-reconciliation.md`,
  `${packetDir}/tool-production-gap-matrix.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/tool-readiness-status-reconciliation-record.json`,
  'docs/activation-phase-rp-external-product-tool-readiness-status-reconciliation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-tool-runtime-stack-integration-triage-1.md',
  'docs/production-go-no-go-checklist.md',
  'docs/production-hardening-overview.md',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnTriageFiles = [
  'docs/external-beta/tool-runtime-stack-integration-triage-1/source-audit.md',
  'docs/external-beta/tool-runtime-stack-integration-triage-1/qwen-stack-map.md',
  'docs/external-beta/tool-runtime-stack-integration-triage-1/ai-graphics-tool-stack-map.md',
  'docs/external-beta/tool-runtime-stack-integration-triage-1/integration-decision.md',
  'docs/external-beta/tool-runtime-stack-integration-triage-1/validation-results.md',
  'docs/external-beta/tool-runtime-stack-integration-triage-1/tool-runtime-stack-integration-triage-record.json',
  'docs/activation-phase-rp-external-product-tool-runtime-stack-integration-triage-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-stack-integration-rollup-1.md',
  'scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs',
]

const allowedFiles = new Set([...requiredFiles, ...followOnTriageFiles])

const requiredText = [
  packet,
  'completed_external_product_tool_readiness_status_reconciliation_controlled_single_tester_beta_only',
  'completed_docs_only_tool_readiness_status_reconciliation_no_runtime_execution',
  'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list',
  'ready_for_aiediting_reeditpro_com',
  'blocked_no_additional_named_tester_list',
  'blocked_pending_broad_beta_tool_runtime_billing_support_legal_security_and_final_export_gates',
  'Product-ready end-to-end local OSS tools: `0`',
  'QWEN2.5-VL',
  'blocked_pending_stack_integration_triage',
  'GPAC/MP4Box',
  'blocked_no_safe_package_source_for_gpac_mp4box_current_base',
  'blocked_no_safe_package_source_for_core_vapoursynth_current_base',
  'safe current-base package sources are resolved from repo/source evidence',
  'blocked_pending_ai_graphics_owner_acceptance_for_film_runtime',
  'external-beta-testers@reeditpro.com',
  'RP-EXTERNAL-PRODUCT-TOOL-RUNTIME-STACK-INTEGRATION-TRIAGE-1',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Broad external beta',
  'Production and broad external beta remain blocked',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, IAM mutation, Google Group membership mutation, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this phase, MKVToolNix execution in this phase, GPAC/MP4Box execution in this phase, VapourSynth execution in this phase, Revideo execution in this phase, FILM execution, QWEN2.5-VL execution, AI Graphics execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.',
]

const falseSafetyKeys = [
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
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
  'finalRenderExport',
  'mediaProcessing',
  'toolExecution',
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
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
]

const forbiddenClaims = [
  /\bExternal production:\s*`?(ready|enabled|unlocked|production_ready)\b/i,
  /\bBroad external beta:\s*`?(ready|enabled|unlocked|approved)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed)\b/i,
  /\bAI Graphics execution:\s*`?(true|enabled|completed)\b/i,
  /\bGStreamer execution in this phase:\s*`?(true|enabled|completed)\b/i,
  /\bMKVToolNix execution in this phase:\s*`?(true|enabled|completed)\b/i,
  /\bGPAC\/MP4Box execution in this phase:\s*`?(true|enabled|completed)\b/i,
  /\bVapourSynth execution in this phase:\s*`?(true|enabled|completed)\b/i,
  /\bRevideo execution in this phase:\s*`?(true|enabled|completed)\b/i,
  /\bFILM execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bdeployment:\s*`?(true|enabled|completed)\b/i,
  /\bIAM mutation:\s*`?(true|enabled|completed)\b/i,
  /\bGoogle Group membership mutation:\s*`?(true|enabled|completed)\b/i,
  /\bpackage installation:\s*`?(true|enabled|completed)\b/i,
  /\bdependency mutation:\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/tool-readiness-status-reconciliation-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_product_tool_readiness_status_reconciliation_controlled_single_tester_beta_only') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_tool_readiness_status_reconciliation_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'e45dd929ef9de8b1451b0935217ad5386356c8cd') fail('integration base mismatch')
if (record.controlledSingleTesterExternalBeta !== 'ready_for_aiediting_reeditpro_com') fail('single tester status mismatch')
if (record.broadExternalBeta !== 'blocked_no_additional_named_tester_list') fail('broad beta status mismatch')
if (record.externalProduction !== 'blocked_pending_broad_beta_tool_runtime_billing_support_legal_security_and_final_export_gates') fail('external production status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.nextRecommendedMilestone !== 'RP-EXTERNAL-PRODUCT-TOOL-RUNTIME-STACK-INTEGRATION-TRIAGE-1') fail('next milestone mismatch')
if (record.sourceChain.excludedRemotionPr !== '#577 open/draft/blocked/excluded') fail('excluded Remotion PR mismatch')
if (record.toolGaps.qwen25VlGpuModelRuntime !== 'blocked_pending_stack_integration_triage') fail('QWEN stack status mismatch')
if (record.toolGaps.aiGraphicsToolStack !== 'blocked_pending_stack_integration_triage') fail('AI Graphics stack status mismatch')
if (record.toolGaps.gpacMp4box !== 'blocked_no_safe_package_source_for_gpac_mp4box_current_base') fail('GPAC/MP4Box status mismatch')
if (record.toolGaps.coreVapoursynth !== 'blocked_no_safe_package_source_for_core_vapoursynth_current_base') fail('VapourSynth status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-product-tool-readiness-status-reconciliation-1:diagnostics'] !==
  'node scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs'
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
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Controlled single-tester external beta: ready_for_aiediting_reeditpro_com')
console.log('External production: blocked_pending_broad_beta_tool_runtime_billing_support_legal_security_and_final_export_gates')
