#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PLAN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_plan_ready_for_confirmed_worker_runtime_dry_run'
const execution = 'completed_docs_only_guarded_worker_runtime_execution_plan_no_runtime_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-DRY-RUN-1'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_DRY_RUN=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/runtime-execution-plan.md`,
  `${dir}/gate-and-input-contract.md`,
  `${dir}/command-template-matrix.md`,
  `${dir}/failure-and-safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1.md',
]

const futureDryRunFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/worker-runtime-dry-run-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/blocked-scope-register.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-diagnostics.mjs',
]

const diagnosticsFile = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1-diagnostics.mjs'
const relatedDiagnosticsFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...futureDryRunFiles,
  diagnosticsFile,
  ...relatedDiagnosticsFiles,
  'package.json',
])

const requiredSourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-implementation-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/dry-run-result.md',
  'src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-skeleton-contracts.ts',
]

const allowedCommandTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]

const requiredFailureCategories = [
  'blocked_missing_runtime_dry_run_confirmation_gate',
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
  'blocked_worker_skeleton_not_disabled_before_confirmation',
  'blocked_worker_runtime_preflight_failed',
  'blocked_unexpected_route_or_worker_dispatch',
  'blocked_unexpected_tool_execution_scope',
  'blocked_unexpected_media_processing_scope',
  'blocked_delivery_or_unlock_attempt',
]

const requiredCorpusText = [
  packet,
  decision,
  execution,
  'completed_gstreamer_mkvtoolnix_confirmed_worker_execution_dry_run_contract_validation',
  'd5903b517f56ad117774c48488b932bd368f0941',
  '5bf9f05c3719503f20d66638d9650f87f96fa0bd',
  '3bc87ce85f44867662fc9fab1b936843480c255c',
  'PR #577 remains open/draft/blocked/excluded',
  'ready_for_confirmed_worker_runtime_dry_run_only',
  confirmationGate,
  'approved snapshot',
  'approval record',
  'credit/no-spend policy',
  'worker lease',
  'route idempotency key',
  'command-template allowlist',
  'private input manifest',
  'output manifest schema',
  'QA report schema',
  'cleanup policy',
  'retention policy',
  'failure policy',
  'audit parent',
  'raw command strings',
  'raw chat',
  'frontend file paths',
  'public URL source-of-truth',
  'signed URL source-of-truth',
  'arbitrary private media',
  'service-role secret payloads',
  'broad service-role handlers',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: `not_applicable_docs_only`',
]

const falseSafetyKeys = [
  'runtimeExecutionInThisPhase',
  'workerDispatchInThisPhase',
  'workerExecutionInThisPhase',
  'toolExecutionInThisPhase',
  'routeExecution',
  'gstreamerExecutionInThisPhase',
  'mkvtoolnixExecutionInThisPhase',
  'ffmpegFfprobeExecutionInThisPhase',
  'dockerExecutionInThisPhase',
  'remotionExecutionInThisPhase',
  'mediaProcessingInThisPhase',
  'privateMediaProcessing',
  'userMediaProcessing',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
  'packageInstallation',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'broadServiceRoleHandler',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
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
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Runtime execution|Worker dispatch|Worker execution|Tool execution|Route execution|GStreamer execution|MKVToolNix execution|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"runtimeExecutionInThisPhase"\s*:\s*true/i,
  /"workerDispatchInThisPhase"\s*:\s*true/i,
  /"workerExecutionInThisPhase"\s*:\s*true/i,
  /"toolExecutionInThisPhase"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisPhase"\s*:\s*true/i,
  /"dockerExecutionInThisPhase"\s*:\s*true/i,
  /"remotionExecutionInThisPhase"\s*:\s*true/i,
  /"mediaProcessingInThisPhase"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...requiredSourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredCorpusText) {
  if (!corpus.includes(text)) fail(`missing required packet text: ${text}`)
}
for (const template of allowedCommandTemplates) {
  if (!corpus.includes(template)) fail(`missing allowed command-template id: ${template}`)
}
for (const blocker of requiredFailureCategories) {
  if (!corpus.includes(blocker)) fail(`missing required blocker: ${blocker}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '3bc87ce85f44867662fc9fab1b936843480c255c') fail('integration base mismatch')
if (record.sourceChain?.guardedWorkerRouteMerge !== 'd5903b517f56ad117774c48488b932bd368f0941') {
  fail('route merge mismatch')
}
if (record.sourceChain?.guardedWorkerEnqueueMerge !== '5bf9f05c3719503f20d66638d9650f87f96fa0bd') {
  fail('enqueue merge mismatch')
}
if (record.sourceChain?.guardedWorkerSkeletonMerge !== '3bc87ce85f44867662fc9fab1b936843480c255c') {
  fail('skeleton merge mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.plan?.status !== 'ready_for_confirmed_worker_runtime_dry_run_only') fail('plan status mismatch')
if (record.plan?.confirmationGate !== confirmationGate) fail('confirmation gate mismatch')
if (record.plan?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
for (const template of allowedCommandTemplates) {
  if (!record.plan?.allowedCommandTemplates?.includes(template)) fail(`record missing command-template id: ${template}`)
}
for (const blocker of requiredFailureCategories) {
  if (!record.requiredFailureCategories?.includes(blocker)) fail(`record missing required blocker: ${blocker}`)
}
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety ${key} was enabled or missing`)
}
if (record.safety?.docsOnly !== true) fail('docsOnly safety flag missing')
if (record.safety?.futureConfirmedRuntimeDryRunPlanOnly !== true) fail('future plan safety flag missing')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  const content = read(file)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(content)) fail(`forbidden claim matched in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Execution: ${execution}`)
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
