#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-DISPATCH-EXECUTION-PACKET-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_dispatch_execution_packet_metadata_only'
const execution = 'completed_confirmation_gated_local_mock_worker_dispatch_metadata_only_no_worker_execution_or_tool_execution'
const integrationBase = '03a3b2192f82e29f3638ef9483032dea14ed2a18'
const runId = '2026-07-01T02-06-35-344Z-8210a119'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_DISPATCH_EXECUTION=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-HANDOFF-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-dispatch-execution-result.md`,
  `${dir}/worker-dispatch-metadata.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runId,
  gate,
  'Confirmation gate observed: `present_true`',
  'completed_guarded_local_mock_worker_dispatch_metadata_envelope',
  'accepted_guarded_local_mock_worker_dispatch_metadata_only',
  'dispatched_controlled_worker_dispatch_dry_run_metadata_only',
  'mock-job-runtime-queue-item-0001',
  'worker_dispatch_request_blocks',
  'worker_lease_claim_request_blocks',
  'tool_execution_request_blocks',
  'persistent_queue_write_request_blocks',
  'blocked_runtime_execution_not_enabled',
  'Real worker dispatch: `false`',
  'Worker process started: `false`',
  'Worker execution: `false`',
  'Worker lease claim: `false`',
  'Persistent job queue write: `false`',
  'GStreamer execution in this worker dispatch execution packet: `false`',
  'MKVToolNix execution in this worker dispatch execution packet: `false`',
  '0a57e3be8999d7aab0f1cdc5fba7b1422c1c629a78aca856c06b713bb01b4369',
  'd8369790edcbd05ef8fc4c588cab9ceaa8d93168701b1b60a0b917daf1d85ade',
  '6256df33bcb2243da2e8c5bd385d610dbcd65aa8b61f2234a6aa5d31cc039fb0',
  '47b9e2615b9e9c91d7db4279371c4488ed9331bc957489373c9c91630ada9ed8',
  '7ee3a853d5ebe4e2261b9dc9691c855723e7e16f7f4aab4b3c55a41e5c598746',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
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
  /\b(?:Real worker dispatch|Worker process started|Worker execution|Worker lease claim|Persistent job queue write|GStreamer execution in this worker dispatch execution packet|MKVToolNix execution in this worker dispatch execution packet|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"realWorkerDispatch"\s*:\s*true/i,
  /"workerProcessStarted"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"gstreamerExecutionInThisWorkerDispatchExecutionPacket"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisWorkerDispatchExecutionPacket"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1'] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1.ts'
) {
  fail('missing guarded worker-dispatch execution-packet package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-diagnostics.mjs'
) {
  fail('missing guarded worker-dispatch execution-packet diagnostics package script')
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
if (record.sourceChain?.routeDispatchExecutionPacketPr !== 1939) fail('route-dispatch packet PR mismatch')
if (record.sourceChain?.routeDispatchExecutionPacketMergeSha !== integrationBase) fail('route-dispatch packet merge mismatch')
if (record.sourceChain?.routeDispatchExecutionPacketRunId !== '2026-07-01T01-48-47-456Z-977b002e') fail('route-dispatch packet run ID mismatch')
if (record.sourceChain?.routeDispatchExecutionPlanPr !== 1935) fail('source plan PR mismatch')
if (record.sourceChain?.routeDispatchDryRunPr !== 1929) fail('source dry-run PR mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.workerDispatchMetadata?.status !== 'accepted_guarded_local_mock_worker_dispatch_metadata_only') fail('worker dispatch status mismatch')
if (record.workerDispatchMetadata?.workerDispatchMetadataEnvelope !== 'completed_guarded_local_mock_worker_dispatch_metadata_envelope') fail('worker dispatch envelope mismatch')
if (record.workerDispatchMetadata?.dryRunStatus !== 'dispatched_controlled_worker_dispatch_dry_run_metadata_only') fail('dry-run status mismatch')
if (record.workerDispatchMetadata?.queueItemId !== 'mock-job-runtime-queue-item-0001') fail('queue item mismatch')
if (record.workerDispatchMetadata?.queueStatus !== 'queued') fail('queue status mismatch')
if (record.workerDispatchMetadata?.localMockQueueItemCreated !== true) fail('local mock queue item flag mismatch')
for (const key of ['realWorkerDispatch', 'workerProcessStarted', 'workerExecution', 'workerLeaseClaim', 'persistentJobQueueWrite', 'gstreamerExecution', 'mkvtoolnixExecution', 'mediaProcessing', 'signedUrlCreation', 'publicArtifactCreation', 'finalRenderExport']) {
  if (record.workerDispatchMetadata?.[key] !== false) fail(`${key} must be false`)
}
if (!Array.isArray(record.negativeChecks) || record.negativeChecks.length !== 4 || !record.negativeChecks.every((check) => check.passed === true && check.blocker === 'blocked_runtime_execution_not_enabled')) fail('negative checks mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'guardedLocalMockWorkerDispatchMetadataOnly' || key === 'localMockQueueItemCreated') {
    if (value !== true) fail(`${key} safety flag must be true`)
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
if (sourceRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_packet_metadata_only') fail('source packet decision mismatch')
if (sourceRecord.runId !== '2026-07-01T01-48-47-456Z-977b002e') fail('source packet run ID mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source packet next milestone mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
].sort()
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (!fs.existsSync(file)) continue
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
