#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-READINESS-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_readiness_for_confirmation_gated_dry_run'
const execution = 'completed_docs_only_route_dispatch_readiness_no_route_or_worker_execution'
const integrationBase = '61619709d92f035b82ca9ef3d8013d9300bf3043'
const runtimePacketMergeSha = 'f7e2b76235d9b66a56cae7a6df74e0bc29045b3a'
const runtimePacketRunId = '2026-07-01T00-16-10-927Z-8b7402d8'
const guardedRuntimeRunId = '2026-07-01T00-16-10-989Z-a9752eae'
const dispatchDryRunRunId = '2026-06-30T20-56-18-927Z-8e5d25d9'
const queueRunId = '2026-06-30T19-45-59-915Z-af80c9f8'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-DRY-RUN-1'
const nextGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_DRY_RUN=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/readiness-decision.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/route-dispatch-contract.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1/gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runtimePacketMergeSha,
  runtimePacketRunId,
  guardedRuntimeRunId,
  dispatchDryRunRunId,
  queueRunId,
  'completed_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_qa_rollup_generated_fixture_only',
  'completed_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_execution_packet_generated_fixture_only',
  'completed_gstreamer_mkvtoolnix_agent_controlled_worker_dispatch_dry_run_metadata_only',
  'completed_gstreamer_mkvtoolnix_agent_controlled_worker_queue_integration_metadata_only',
  'ready_for_confirmation_gated_guarded_worker_route_dispatch_dry_run',
  nextGate,
  'metadata_only_route_dispatch_dry_run',
  'metadata_only_no_worker_process_started',
  'not_run_route_dispatch_dry_run_only',
  'not_claimed_route_dispatch_dry_run_only',
  'not_written_route_dispatch_dry_run_only',
  'generated_srt_and_generated_subtitle_only_mkv_fixture',
  'approved-snapshot-agent-controlled-dispatch-1',
  'approval-record-agent-controlled-dispatch-1',
  'no-spend-fixture-policy-agent-controlled-dispatch-1',
  'job-agent-controlled-dispatch-1',
  'worker-lease-agent-controlled-dispatch-1',
  'gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'Route execution in this readiness phase: `false`',
  'Worker dispatch in this readiness phase: `false`',
  'Worker execution in this readiness phase: `false`',
  'Worker lease claim in this readiness phase: `false`',
  'Persistent job queue write in this readiness phase: `false`',
  'GStreamer execution in this readiness phase: `false`',
  'MKVToolNix execution in this readiness phase: `false`',
  'Docker execution in this readiness phase: `false`',
  'FFmpeg/FFprobe execution: `false`',
  'Supabase mutation: `false`',
  'SQL execution: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked/excluded',
  nextMilestone,
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
  /\b(?:Route execution in this readiness phase|Worker dispatch in this readiness phase|Worker execution in this readiness phase|Worker lease claim in this readiness phase|Persistent job queue write in this readiness phase|GStreamer execution in this readiness phase|MKVToolNix execution in this readiness phase|Docker execution in this readiness phase|FFmpeg\/FFprobe execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export|Broad external beta unlock|Paid production unlock|Production unlock):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisReadinessPhase"\s*:\s*true/i,
  /"workerDispatchInThisReadinessPhase"\s*:\s*true/i,
  /"workerExecutionInThisReadinessPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisReadinessPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisReadinessPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisReadinessPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisReadinessPhase"\s*:\s*true/i,
  /"dockerExecutionInThisReadinessPhase"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"broadExternalBetaUnlock"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-diagnostics.mjs'
) {
  fail('missing guarded worker route-dispatch readiness diagnostics package script')
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
if (record.readinessDisposition !== 'ready_for_confirmation_gated_guarded_worker_route_dispatch_dry_run') fail('readiness disposition mismatch')
if (record.sourceChain?.runtimeQaRollupPr !== 1921) fail('runtime QA rollup PR mismatch')
if (record.sourceChain?.runtimeQaRollupMergeSha !== integrationBase) fail('runtime QA rollup merge mismatch')
if (record.sourceChain?.runtimeQaRollupDecision !== 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_qa_rollup_generated_fixture_only') fail('runtime QA rollup decision mismatch')
if (record.sourceChain?.runtimePacketPr !== 1918) fail('runtime packet PR mismatch')
if (record.sourceChain?.runtimePacketMergeSha !== runtimePacketMergeSha) fail('runtime packet merge mismatch')
if (record.sourceChain?.runtimePacketRunId !== runtimePacketRunId) fail('runtime packet run ID mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== guardedRuntimeRunId) fail('guarded runtime run ID mismatch')
if (record.sourceChain?.dispatchDryRunPr !== 1905) fail('dispatch dry-run PR mismatch')
if (record.sourceChain?.dispatchDryRunRunId !== dispatchDryRunRunId) fail('dispatch dry-run run ID mismatch')
if (record.sourceChain?.queueIntegrationPr !== 1902) fail('queue PR mismatch')
if (record.sourceChain?.queueIntegrationRunId !== queueRunId) fail('queue run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.readiness?.gstreamer_render_pipeline_support !== 'ready_for_confirmation_gated_guarded_worker_route_dispatch_dry_run') fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix_container_validation !== 'ready_for_confirmation_gated_guarded_worker_route_dispatch_dry_run') fail('MKVToolNix readiness mismatch')
if (record.nextDryRunGate?.env !== nextGate) fail('next dry-run gate mismatch')
if (record.nextDryRunGate?.routeExecutionMode !== 'metadata_only_route_dispatch_dry_run') fail('route execution mode mismatch')
if (record.nextDryRunGate?.workerDispatchMode !== 'metadata_only_no_worker_process_started') fail('worker dispatch mode mismatch')
if (record.nextDryRunGate?.workerExecution !== 'not_run_route_dispatch_dry_run_only') fail('worker execution mode mismatch')
if (record.nextDryRunGate?.workerLeaseClaim !== 'not_claimed_route_dispatch_dry_run_only') fail('worker lease mode mismatch')
if (record.nextDryRunGate?.persistentJobQueueWrite !== 'not_written_route_dispatch_dry_run_only') fail('persistent queue write mode mismatch')
if (record.nextDryRunGate?.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture') fail('fixture scope mismatch')

const requiredReferences = record.requiredReferences || {}
for (const [key, value] of Object.entries({
  approvedSnapshotReference: 'approved-snapshot-agent-controlled-dispatch-1',
  approvalRecordReference: 'approval-record-agent-controlled-dispatch-1',
  creditPolicyReference: 'no-spend-fixture-policy-agent-controlled-dispatch-1',
  jobReference: 'job-agent-controlled-dispatch-1',
  workerLeaseReference: 'worker-lease-agent-controlled-dispatch-1',
  routeIdempotencyKey: 'gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template',
})) {
  if (requiredReferences[key] !== value) fail(`${key} mismatch`)
}
if (!Array.isArray(requiredReferences.acceptedCommandTemplates) || requiredReferences.acceptedCommandTemplates.length !== 4) fail('accepted command template count mismatch')

for (const key of [
  'routeExecutionInThisReadinessPhase',
  'workerDispatchInThisReadinessPhase',
  'workerExecutionInThisReadinessPhase',
  'workerLeaseClaimInThisReadinessPhase',
  'persistentJobQueueWriteInThisReadinessPhase',
  'gstreamerExecutionInThisReadinessPhase',
  'mkvtoolnixExecutionInThisReadinessPhase',
  'dockerExecutionInThisReadinessPhase',
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'remotionExecution',
  'supabaseMutation',
  'sqlExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
  'broadExternalBetaUnlock',
  'paidProductionUnlock',
  'productionUnlock',
]) {
  if (record.safety?.[key] !== false) fail(`safety ${key} must be false`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_qa_rollup_generated_fixture_only') fail('source QA rollup decision mismatch')
if (sourceRecord.validation !== 'passed') fail('source QA rollup validation mismatch')
if (sourceRecord.qaDisposition !== 'accepted_runtime_packet_evidence_for_guarded_worker_route_dispatch_readiness_planning') fail('source QA disposition mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.sourceChain?.runtimePacketRunId !== runtimePacketRunId) fail('source runtime run ID mismatch')
if (sourceRecord.sourceChain?.guardedRuntimeRunId !== guardedRuntimeRunId) fail('source guarded runtime run ID mismatch')

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
console.log('Readiness: ready_for_confirmation_gated_guarded_worker_route_dispatch_dry_run')
console.log('Product-ready end-to-end local OSS tools: 0')
