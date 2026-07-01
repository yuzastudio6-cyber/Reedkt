#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-DRY-RUN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_dry_run_metadata_only'
const execution = 'completed_confirmation_gated_guarded_worker_route_dispatch_dry_run_metadata_only_no_route_worker_or_tool_execution'
const integrationBase = '746a017a626d6874d2513e4250af645692dff84e'
const runId = '2026-07-01T01-21-40-972Z-40ea3844'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PLAN-1'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_DRY_RUN=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-dispatch-dry-run-result.md`,
  `${dir}/route-dispatch-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-diagnostics.mjs',
  'package.json',
]

const executionPlanFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/execution-decision.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/execution-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/route-dispatch-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1.md',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...executionPlanFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runId,
  gate,
  'Confirmation gate observed: `present_true`',
  'validated_guarded_worker_route_dispatch_dry_run_metadata_only',
  'metadata_only_route_dispatch_dry_run',
  'metadata_only_no_worker_process_started',
  'generated_srt_and_generated_subtitle_only_mkv_fixture',
  'ready_for_guarded_worker_route_dispatch_execution_plan',
  'approved-snapshot-agent-controlled-dispatch-1',
  'approval-record-agent-controlled-dispatch-1',
  'no-spend-fixture-policy-agent-controlled-dispatch-1',
  'job-agent-controlled-dispatch-1',
  'worker-lease-agent-controlled-dispatch-1',
  'gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template',
  'gstreamer-mkvtoolnix:guarded-route-dispatch-dry-run-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1',
  'private-input-manifest-agent-controlled-dispatch-1',
  'output-manifest-schema-agent-controlled-dispatch-1',
  'qa-report-schema-agent-controlled-dispatch-1',
  'cleanup-policy-agent-controlled-dispatch-1',
  'retry-policy-agent-controlled-dispatch-1',
  'non-public-artifact-policy-agent-controlled-dispatch-1',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'Route execution: `not_run_guarded_worker_route_dispatch_dry_run_metadata_only`',
  'Worker dispatch: `not_run_guarded_worker_route_dispatch_dry_run_metadata_only`',
  'Worker execution: `not_run_guarded_worker_route_dispatch_dry_run_metadata_only`',
  'Worker lease claim: `not_run_guarded_worker_route_dispatch_dry_run_metadata_only`',
  'Tool execution: `not_run_guarded_worker_route_dispatch_dry_run_metadata_only`',
  'Persistent job queue write: `not_run_guarded_worker_route_dispatch_dry_run_metadata_only`',
  'GStreamer execution in this route dispatch dry-run: `false`',
  'MKVToolNix execution in this route dispatch dry-run: `false`',
  'f6a319365a4976c08f32d149e2466bb421567c1ceffacde419773438821fc7bd',
  'b1b795fb8fe26cf88ae68ea1c215a8fa9ac8f2d5ac8686c3b68891bc26e8a479',
  '4f9c40a324d0b047854be77a55a995a2c84382c780d10c2de41da6b478875ad1',
  '5ebacfc1aa8e5b6264342a2296a89af777121854e6a5cec31db180e69206ca9e',
  '2af1aa490754b7996c8812992a0002476ad31173a32a2004c8802a9349c3e78f',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.github\//,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|Worker lease claim|Tool execution|Persistent job queue write|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"gstreamerExecutionInThisRouteDispatchDryRun"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisRouteDispatchDryRun"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"dockerPushDeploy"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"broadExternalBetaUnlock"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
  /"dependencyMutation"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1.mjs'
) {
  fail('missing guarded route-dispatch dry-run package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-diagnostics.mjs'
) {
  fail('missing guarded route-dispatch dry-run diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.confirmationGate?.observed !== 'present_true') fail('confirmation gate mismatch')
if (record.sourceChain?.routeDispatchReadinessPr !== 1925) fail('readiness PR mismatch')
if (record.sourceChain?.routeDispatchReadinessMergeSha !== integrationBase) fail('readiness merge mismatch')
if (record.sourceChain?.runtimeQaRollupPr !== 1921) fail('QA rollup PR mismatch')
if (record.sourceChain?.runtimePacketPr !== 1918) fail('runtime packet PR mismatch')
if (record.sourceChain?.dispatchDryRunPr !== 1905) fail('dispatch dry-run PR mismatch')
if (record.sourceChain?.queueIntegrationPr !== 1902) fail('queue integration PR mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routeDispatchDryRun?.status !== 'validated_guarded_worker_route_dispatch_dry_run_metadata_only') fail('dry-run status mismatch')
if (record.routeDispatchDryRun?.readinessSourceStatus !== 'ready_for_confirmation_gated_guarded_worker_route_dispatch_dry_run') fail('readiness source mismatch')
if (record.routeDispatchDryRun?.routeDispatchMode !== 'metadata_only_route_dispatch_dry_run') fail('route dispatch mode mismatch')
if (record.routeDispatchDryRun?.workerDispatchMode !== 'metadata_only_no_worker_process_started') fail('worker dispatch mode mismatch')
if (record.routeDispatchDryRun?.routeDispatchEnvelopeCreated !== true) fail('route dispatch envelope created mismatch')
if (record.routeDispatchDryRun?.routeDispatchAccepted !== true) fail('route dispatch accepted mismatch')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'workerLeaseClaim', 'toolExecution', 'persistentJobQueueWrite']) {
  if (record.routeDispatchDryRun?.[key] !== 'not_run_guarded_worker_route_dispatch_dry_run_metadata_only') fail(`${key} mismatch`)
}
if (record.routeDispatchDryRun?.nextSourceStatus !== 'ready_for_guarded_worker_route_dispatch_execution_plan') fail('next source status mismatch')
if (!Array.isArray(record.routeDispatchDryRun?.acceptedCommandTemplates) || record.routeDispatchDryRun.acceptedCommandTemplates.length !== 4) fail('accepted command template count mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'guardedWorkerRouteDispatchDryRunMetadataOnly') {
    if (value !== true) fail('metadata-only safety flag must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_readiness_for_confirmation_gated_dry_run') fail('source readiness decision mismatch')
if (sourceRecord.validation !== 'passed') fail('source readiness validation mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json has unstaged changes')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json has staged changes')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Execution: ${execution}`)
console.log(`Run ID: ${runId}`)
console.log('Product-ready end-to-end local OSS tools: 0')
