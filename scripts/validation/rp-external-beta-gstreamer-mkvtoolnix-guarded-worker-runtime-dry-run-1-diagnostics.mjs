#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-DRY-RUN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_dry_run_envelope_validation'
const execution = 'completed_confirmation_gated_guarded_worker_runtime_dry_run_no_worker_dispatch_or_tool_execution'
const runId = '2026-06-30T16-06-39-689Z-7f400705'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_DRY_RUN=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/worker-runtime-dry-run-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/blocked-scope-register.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1/gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-implementation-1/gstreamer-mkvtoolnix-guarded-worker-route-implementation-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const allowedCommandTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]

const requiredCorpusText = [
  packet,
  decision,
  execution,
  runId,
  confirmationGate,
  'Confirmation gate observed: `present_true`',
  'completed_guarded_worker_runtime_dry_run_envelope_validation',
  'approved-snapshot-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  'approval-record-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  'no-spend-fixture-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  'worker-lease-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  'route-idempotency-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  'private-input-manifest-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  'output-manifest-schema-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  'qa-report-schema-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  'Worker dispatch: `not_run_dry_run_envelope_validation_only`',
  'Worker execution: `not_run_dry_run_envelope_validation_only`',
  'Tool execution: `not_run_dry_run_envelope_validation_only`',
  'ready_for_guarded_worker_runtime_execution_implementation',
  '6d9ba02c069ad1a7da1b861186e55125d9a8ac7f0ecc52ec73c9887adb1ff34e',
  'b4b6dbfcb184209204fe82e364073c4da8e5a44823ad6625607bfa2b9e65361f',
  '2bafd556886073b76f378771e4255b47adb2f52794e3a3ac5b31975d851d9900',
  'a22b1f2c535ea709297ae461990fa7515d0b004550c1d0681ade53f07f9a55ab',
  'b94b4b18b8c22baee07a574f6d428b0418c190dbb8efc369921e37343ba6fab4',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: `not_applicable_docs_only`',
  'PR #577 remains open/draft/blocked/excluded',
]

const falseSafetyKeys = [
  'runtimeExecution',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'gstreamerExecution',
  'mkvtoolnixExecution',
  'ffmpegFfprobeExecution',
  'dockerExecution',
  'remotionExecution',
  'mediaProcessing',
  'privateMediaProcessing',
  'userMediaProcessing',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'providerCall',
  'modelCall',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'deployment',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
  'finalRenderExport',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
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
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Runtime execution|Route execution|Worker dispatch|Worker execution|Tool execution|GStreamer execution|MKVToolNix execution|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"runtimeExecution"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles, ...sourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1.mjs'
) {
  fail('missing package dry-run script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredCorpusText) {
  if (!corpus.includes(text)) fail(`missing required packet text: ${text}`)
}
for (const template of allowedCommandTemplates) {
  if (!corpus.includes(template)) fail(`missing command-template id: ${template}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '3e85e9296de45d4ac0283b3981a03db8178ff625') fail('integration base mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.confirmationGate?.observed !== 'present_true') fail('confirmation gate mismatch')
if (record.sourceChain?.guardedRuntimeExecutionPlanMerge !== '3e85e9296de45d4ac0283b3981a03db8178ff625') {
  fail('runtime plan merge mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.dryRun?.status !== 'completed_guarded_worker_runtime_dry_run_envelope_validation') {
  fail('dry-run status mismatch')
}
if (record.dryRun?.requiredReferencesNamed !== true) fail('required refs mismatch')
if (record.dryRun?.workerDispatch !== 'not_run_dry_run_envelope_validation_only') fail('worker dispatch mismatch')
if (record.dryRun?.workerExecution !== 'not_run_dry_run_envelope_validation_only') fail('worker execution mismatch')
if (record.dryRun?.toolExecution !== 'not_run_dry_run_envelope_validation_only') fail('tool execution mismatch')
if (record.readiness?.gstreamer !== 'ready_for_guarded_worker_runtime_execution_implementation') fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== 'ready_for_guarded_worker_runtime_execution_implementation') fail('MKVToolNix readiness mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact summary mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety ${key} was enabled or missing`)
}

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
console.log(`Run ID: ${runId}`)
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
