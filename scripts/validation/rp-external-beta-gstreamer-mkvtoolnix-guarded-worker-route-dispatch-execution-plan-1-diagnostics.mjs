#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PLAN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-record.json'
const decision =
  'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_plan_ready_for_confirmation_gated_execution_packet'
const execution = 'completed_docs_only_route_dispatch_execution_plan_no_route_worker_or_tool_execution'
const integrationBase = '1832483edd8c03113d2aa9ba04cf3a92c4fcb080'
const dryRunDecision = 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_dry_run_metadata_only'
const dryRunRunId = '2026-07-01T01-21-40-972Z-40ea3844'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_EXECUTION=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/execution-decision.md`,
  `${dir}/execution-contract.md`,
  `${dir}/route-dispatch-boundary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-diagnostics.mjs',
  'package.json',
]

const executionPacketFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1/route-dispatch-execution-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1/route-handler-metadata.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1.md',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...executionPacketFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  dryRunDecision,
  dryRunRunId,
  gate,
  'completed_confirmation_gated_guarded_worker_route_dispatch_dry_run_metadata_only_no_route_worker_or_tool_execution',
  'metadata_only_route_dispatch_dry_run',
  'metadata_only_no_worker_process_started',
  'approved_for_confirmation_gated_local_route_handler_invocation_metadata_only',
  'not_approved_in_route_dispatch_execution_packet',
  'not_approved_until_worker_dispatch_execution_packet',
  'not_approved_until_staging_queue_write_packet',
  'ready_for_confirmation_gated_route_dispatch_execution_packet',
  'approved-snapshot-agent-controlled-dispatch-1',
  'approval-record-agent-controlled-dispatch-1',
  'no-spend-fixture-policy-agent-controlled-dispatch-1',
  'job-agent-controlled-dispatch-1',
  'worker-lease-agent-controlled-dispatch-1',
  'route-dispatch-execution-idempotency-key-agent-controlled-dispatch-1',
  'gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template',
  'gstreamer-mkvtoolnix:guarded-route-dispatch-execution-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1',
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
  'Route handler invocation in this phase: `false`',
  'Worker dispatch in this phase: `false`',
  'Worker execution in this phase: `false`',
  'Worker lease claim in this phase: `false`',
  'Persistent job queue write in this phase: `false`',
  'GStreamer execution in this phase: `false`',
  'MKVToolNix execution in this phase: `false`',
  'PR #577 Remotion runtime proof',
  'open_draft_blocked_excluded',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
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
  /\b(?:Route handler invocation in this phase|Worker dispatch in this phase|Worker execution in this phase|Worker lease claim in this phase|Persistent job queue write in this phase|GStreamer execution in this phase|MKVToolNix execution in this phase|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeHandlerInvocationInThisPhase"\s*:\s*true/i,
  /"workerDispatchInThisPhase"\s*:\s*true/i,
  /"workerExecutionInThisPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisPhase"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-diagnostics.mjs'
) {
  fail('missing guarded route-dispatch execution-plan diagnostics package script')
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
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.routeDispatchDryRunPr !== 1929) fail('route-dispatch dry-run PR mismatch')
if (record.sourceChain?.routeDispatchDryRunMergeSha !== integrationBase) fail('route-dispatch dry-run merge mismatch')
if (record.sourceChain?.routeDispatchReadinessPr !== 1925) fail('route-dispatch readiness PR mismatch')
if (record.sourceChain?.routeDispatchReadinessMergeSha !== '746a017a626d6874d2513e4250af645692dff84e') fail('route-dispatch readiness merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.dryRunEvidence?.runId !== dryRunRunId) fail('dry-run run ID mismatch')
if (record.dryRunEvidence?.routeDispatchMode !== 'metadata_only_route_dispatch_dry_run') fail('dry-run route dispatch mode mismatch')
if (record.dryRunEvidence?.workerDispatchMode !== 'metadata_only_no_worker_process_started') fail('dry-run worker dispatch mode mismatch')
if (record.executionPlan?.status !== 'ready_for_confirmation_gated_route_dispatch_execution_packet') fail('execution plan status mismatch')
if (record.executionPlan?.confirmationGate !== gate) fail('confirmation gate mismatch')
if (record.executionPlan?.futureRouteHandlerInvocation !== 'approved_for_confirmation_gated_local_route_handler_invocation_metadata_only') fail('future route handler mismatch')
if (record.executionPlan?.futureWorkerDispatch !== 'metadata_only_no_worker_process_started') fail('future worker dispatch mismatch')
if (record.executionPlan?.futureWorkerExecution !== 'not_approved_in_route_dispatch_execution_packet') fail('future worker execution mismatch')
if (record.executionPlan?.futureWorkerLeaseClaim !== 'not_approved_until_worker_dispatch_execution_packet') fail('future worker lease mismatch')
if (record.executionPlan?.futurePersistentJobQueueWrite !== 'not_approved_until_staging_queue_write_packet') fail('future persistent queue mismatch')
if (record.executionPlan?.futureToolExecution !== 'not_approved_in_route_dispatch_execution_packet') fail('future tool execution mismatch')
if (record.executionPlan?.nextMilestone !== nextMilestone) fail('record execution plan next milestone mismatch')
for (const key of [
  'routeHandlerInvocationInThisPhase',
  'workerDispatchInThisPhase',
  'workerExecutionInThisPhase',
  'workerLeaseClaimInThisPhase',
  'persistentJobQueueWriteInThisPhase',
  'gstreamerExecutionInThisPhase',
  'mkvtoolnixExecutionInThisPhase',
]) {
  if (record.executionPlan?.[key] !== false) fail(`${key} must be false`)
}
if (!Array.isArray(record.requiredReferences) || record.requiredReferences.length < 12) fail('required reference count mismatch')
if (!Array.isArray(record.allowedCommandTemplates) || record.allowedCommandTemplates.length !== 4) fail('allowed command template count mismatch')
if (!Array.isArray(record.requiredFutureBlockers) || record.requiredFutureBlockers.length < 16) fail('required future blocker count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyRouteDispatchExecutionPlan') {
    if (value !== true) fail('docs-only safety flag must be true')
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
if (sourceRecord.decision !== dryRunDecision) fail('source dry-run decision mismatch')
if (sourceRecord.validation !== 'passed') fail('source dry-run validation mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source dry-run next milestone mismatch')
if (sourceRecord.runId !== dryRunRunId) fail('source dry-run run ID mismatch')

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
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
