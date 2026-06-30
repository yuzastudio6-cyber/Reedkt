#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMATION-GATED-WORKER-EXECUTION-PLAN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_confirmation_gated_worker_execution_plan_ready_for_confirmed_dry_run'
const execution = 'completed_docs_only_confirmation_gated_worker_execution_plan_no_runtime_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_EXECUTION=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/execution-plan.md`,
  `${dir}/gate-and-input-contract.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/gstreamer-mkvtoolnix-guarded-worker-enablement-review-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/gstreamer-mkvtoolnix-disabled-worker-scaffold-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/gstreamer-mkvtoolnix-agent-execution-contract-record.json',
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json',
  'approved-plan-snapshot-policy.md',
  'async-edit-work-graph.md',
  'editing-agent-execution-architecture.md',
  'editing-asset-manifest.md',
]

const dryRunFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/blocked-scope-register.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...dryRunFiles])

const requiredText = [
  packet,
  decision,
  execution,
  'f04cb79b9945d8d24fbd273506cd10c05c57b72f',
  'approved_gstreamer_mkvtoolnix_guarded_worker_enablement_review_ready_for_confirmation_gated_worker_execution_plan',
  'completed_gstreamer_mkvtoolnix_disabled_worker_scaffold_negative_tests_ready_for_guarded_worker_enablement_review',
  'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold',
  'completed_external_beta_tool_execution_readiness_matrix_for_guarded_agent_execution',
  'ready_for_confirmed_worker_execution_dry_run_only',
  confirmationGate,
  'Worker enablement in this phase: `false`',
  'Worker execution in this phase: `false`',
  'Tool execution in this phase: `false`',
  nextMilestone,
  'blocked_missing_confirmation_gate',
  'blocked_missing_approved_plan_snapshot',
  'blocked_missing_approval_record',
  'blocked_missing_credit_or_no_spend_policy',
  'blocked_missing_worker_lease',
  'blocked_missing_idempotency_key',
  'blocked_unapproved_command_template',
  'blocked_raw_command_string',
  'blocked_missing_private_input_manifest',
  'blocked_manifest_checksum_mismatch',
  'blocked_unapproved_media_source',
  'blocked_public_or_signed_url_source',
  'blocked_output_manifest_missing',
  'blocked_qa_report_missing',
  'blocked_cleanup_policy_missing',
  'blocked_unexpected_worker_or_tool_execution',
  'blocked_delivery_or_unlock_attempt',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked/excluded',
]

const falseSafetyKeys = [
  'workerEnablementInThisPhase',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCallInThisPhase',
  'modelCallInThisPhase',
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
  'filmExecutionInThisPhase',
  'qwenExecutionInThisPhase',
  'aiGraphicsExecution',
  'ffmpegFfprobeExecutionInThisPhase',
  'dockerExecutionInThisPhase',
  'remotionExecutionInThisPhase',
  'packageInstallationBeyondDependencyValidation',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'cloudRunReadback',
  'cloudRunServiceUpdate',
  'broadServiceRoleHandler',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_live_worker_dispatch\b/i,
  /\bWorker enablement in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bWorker execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bTool execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer|MKVToolNix|GPAC\/MP4Box|VapourSynth|Revideo|FILM|QWEN|FFmpeg\/FFprobe|Docker|Remotion) execution in this plan phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Worker dispatch|Route execution|Service-role route execution|Signed URL creation|Public artifact creation|Private media processing|User media processing|Dependency mutation|Package-lock mutation)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"workerEnablementInThisPhase"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisPhase"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles, ...sourceFiles]) read(file)

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== 'f04cb79b9945d8d24fbd273506cd10c05c57b72f') fail('integration base mismatch')
if (record.sourceChain?.guardedWorkerEnablementReviewMerge !== 'f04cb79b9945d8d24fbd273506cd10c05c57b72f') fail('enablement review merge mismatch')
if (record.sourceChain?.guardedWorkerEnablementReview !== 'approved_gstreamer_mkvtoolnix_guarded_worker_enablement_review_ready_for_confirmation_gated_worker_execution_plan') fail('enablement review source mismatch')
if (record.sourceChain?.disabledWorkerScaffold !== 'completed_gstreamer_mkvtoolnix_disabled_worker_scaffold_negative_tests_ready_for_guarded_worker_enablement_review') fail('disabled scaffold source mismatch')
if (record.sourceChain?.agentExecutionContract !== 'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold') fail('agent contract source mismatch')
if (record.sourceChain?.toolExecutionReadinessMatrix !== 'completed_external_beta_tool_execution_readiness_matrix_for_guarded_agent_execution') fail('matrix source mismatch')
if (record.plan?.status !== 'ready_for_confirmed_worker_execution_dry_run_only') fail('plan status mismatch')
if (record.plan?.confirmationGate !== confirmationGate) fail('confirmation gate mismatch')
if (record.plan?.workerEnablementInThisPhase !== false) fail('worker enablement must be false')
if (record.plan?.workerExecutionInThisPhase !== false) fail('worker execution must be false')
if (record.plan?.toolExecutionInThisPhase !== false) fail('tool execution must be false')
if (record.plan?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (!record.requiredFailureCategories?.includes('blocked_missing_confirmation_gate')) fail('missing confirmation-gate blocker')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.safety?.docsOnly !== true) fail('docs-only safety flag mismatch')
if (record.safety?.futureConfirmedDryRunPlanOnly !== true) fail('future-dry-run-only safety flag mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const review = json('docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/gstreamer-mkvtoolnix-guarded-worker-enablement-review-record.json')
if (review.decision !== 'approved_gstreamer_mkvtoolnix_guarded_worker_enablement_review_ready_for_confirmation_gated_worker_execution_plan') fail('review source drift')
const scaffold = json('docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/gstreamer-mkvtoolnix-disabled-worker-scaffold-record.json')
if (scaffold.scaffold?.scaffoldStatus !== 'disabled_worker_scaffold_registered_no_tool_execution') fail('disabled scaffold status drift')

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-diagnostics.mjs'
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
  if (!allowedChangedFiles.has(file)) fail(`changed file is outside packet scope: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`blocked changed path: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase API URL leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log('GStreamer/MKVToolNix: ready_for_confirmed_worker_execution_dry_run_only')
console.log(`Next milestone: ${nextMilestone}`)
