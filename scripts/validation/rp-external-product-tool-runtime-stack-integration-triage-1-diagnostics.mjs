#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-PRODUCT-TOOL-RUNTIME-STACK-INTEGRATION-TRIAGE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/tool-runtime-stack-integration-triage-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/qwen-stack-map.md`,
  `${packetDir}/ai-graphics-tool-stack-map.md`,
  `${packetDir}/integration-decision.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/tool-runtime-stack-integration-triage-record.json`,
  'docs/activation-phase-rp-external-product-tool-runtime-stack-integration-triage-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-stack-integration-rollup-1.md',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs',
  'package.json',
]

const followOnQwenRollupFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/qwen-stack-decision.md',
  'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/source-import-plan.md',
  'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/qwen2-5-vl-stack-rollup-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-structured-output-source-import-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-stack-integration-rollup-1-diagnostics.mjs',
]

const followOnQwenPersistedWorkerDispatchDraftStackTriageFiles = [
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/source-audit.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/draft-stack-triage.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/stack-readiness-matrix.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/validation-results.md',
  'docs/external-beta/qwen-persisted-worker-dispatch-draft-stack-triage-1/qwen-persisted-worker-dispatch-draft-stack-triage-record.json',
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-source-import-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-draft-stack-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...followOnQwenRollupFiles,
  ...followOnQwenPersistedWorkerDispatchDraftStackTriageFiles,
])

const requiredText = [
  packet,
  'completed_tool_runtime_stack_integration_triage_ready_for_qwen_rollup_bridge',
  'completed_docs_only_stack_triage_no_pr_merge_or_runtime_execution',
  'ed5c296dafcd843d298a2933bf0febfbf7029ffe',
  'Open PRs inspected: `300`',
  'QWEN2.5-VL stack: `96` open PRs, `73` non-draft, `23` draft, `96` mergeable/CLEAN, `0` dirty',
  'AI Graphics/tool stack: `153` open PRs, `0` non-draft, `153` draft, `151` mergeable/CLEAN, `2` dirty or unknown',
  'QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1',
  'AI_GRAPHICS_TOOL_STACK_SPLIT_REPAIR_RETIREMENT_TRIAGE_1',
  'SOUND_TOOL_CALLING_STACK_SPLIT_REPAIR_RETIREMENT_TRIAGE_1',
  '#577 remains open, draft, conflicting/dirty or unknown, and excluded as source-of-truth',
  'Do not merge the stacked PRs directly into integration from this triage packet.',
  'controlled single-tester external beta as ready for `aiediting@reeditpro.com`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No PR merge, retarget, close, branch rewrite, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, IAM mutation, Google Group membership mutation, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, QWEN2.5-VL execution, AI Graphics execution, Sound/tool execution, GStreamer execution in this phase, MKVToolNix execution in this phase, GPAC/MP4Box execution in this phase, VapourSynth execution in this phase, Revideo execution in this phase, FILM execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.',
]

const falseSafetyKeys = [
  'prMerge',
  'prRetarget',
  'branchRewrite',
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
  /\bPR merge:\s*`?(true|enabled|completed)\b/i,
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed)\b/i,
  /\bAI Graphics execution:\s*`?(true|enabled|completed)\b/i,
  /\bSound\/tool execution:\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/tool-runtime-stack-integration-triage-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_tool_runtime_stack_integration_triage_ready_for_qwen_rollup_bridge') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_stack_triage_no_pr_merge_or_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'ed5c296dafcd843d298a2933bf0febfbf7029ffe') fail('integration base mismatch')
if (record.openPrsInspected !== 300) fail('open PR inspected count mismatch')
if (record.directIntegrationPrs?.onlyPr !== '#577') fail('direct integration PR mismatch')
if (record.qwen25VlStack?.count !== 96) fail('QWEN count mismatch')
if (record.qwen25VlStack?.nonDraft !== 73) fail('QWEN non-draft count mismatch')
if (record.qwen25VlStack?.draft !== 23) fail('QWEN draft count mismatch')
if (record.qwen25VlStack?.clean !== 96) fail('QWEN clean count mismatch')
if (record.qwen25VlStack?.dirty !== 0) fail('QWEN dirty count mismatch')
if (record.qwen25VlStack?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1') fail('QWEN next milestone mismatch')
if (record.aiGraphicsToolStack?.count !== 153) fail('AI Graphics count mismatch')
if (record.aiGraphicsToolStack?.draft !== 153) fail('AI Graphics draft count mismatch')
if (record.aiGraphicsToolStack?.dirtyOrUnknown !== 2) fail('AI Graphics dirty/unknown count mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-product-tool-runtime-stack-integration-triage-1:diagnostics'] !==
  'node scripts/validation/rp-external-product-tool-runtime-stack-integration-triage-1-diagnostics.mjs'
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
console.log('Decision: completed_tool_runtime_stack_integration_triage_ready_for_qwen_rollup_bridge')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1')
