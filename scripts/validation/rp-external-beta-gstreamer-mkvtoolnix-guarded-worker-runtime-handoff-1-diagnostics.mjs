#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-HANDOFF-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1-record.json`
const dispatchRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-record.json'
const runtimeRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-record.json'
const decision =
  'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_handoff_ready_for_post_dispatch_runtime_execution_packet'
const execution = 'completed_docs_only_worker_runtime_handoff_no_worker_or_tool_execution'
const integrationBase = '32678a9ef55aec2eeebd2447774fd42da7ef8fb1'
const dispatchRunId = '2026-07-01T02-06-35-344Z-8210a119'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PACKET-2'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-runtime-handoff-contract.md`,
  `${dir}/source-chain-reconciliation.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  dispatchRecordPath,
  runtimeRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  dispatchRunId,
  'completed_guarded_local_mock_worker_dispatch_metadata_envelope',
  'accepted_guarded_local_mock_worker_dispatch_metadata_only',
  'mock-job-runtime-queue-item-0001',
  'ready_for_confirmation_gated_post_dispatch_worker_runtime_execution_packet',
  nextMilestone,
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION=true',
  'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture',
  'Real worker dispatch in this runtime handoff phase: `false`',
  'Worker process started in this runtime handoff phase: `false`',
  'Worker execution in this runtime handoff phase: `false`',
  'Worker lease claim in this runtime handoff phase: `false`',
  'Persistent job queue write in this runtime handoff phase: `false`',
  'GStreamer execution in this runtime handoff phase: `false`',
  'MKVToolNix execution in this runtime handoff phase: `false`',
  'FFmpeg/FFprobe execution in this runtime handoff phase: `false`',
  'Docker execution in this runtime handoff phase: `false`',
  'Supabase mutation in this runtime handoff phase: `false`',
  'SQL execution in this runtime handoff phase: `false`',
  'Final render/export in this runtime handoff phase: `false`',
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
  /\b(?:Real worker dispatch in this runtime handoff phase|Worker process started in this runtime handoff phase|Worker execution in this runtime handoff phase|Worker lease claim in this runtime handoff phase|Persistent job queue write in this runtime handoff phase|GStreamer execution in this runtime handoff phase|MKVToolNix execution in this runtime handoff phase|FFmpeg\/FFprobe execution in this runtime handoff phase|Docker execution in this runtime handoff phase|Remotion execution in this runtime handoff phase|Private media processing in this runtime handoff phase|User media processing in this runtime handoff phase|Supabase mutation in this runtime handoff phase|SQL execution in this runtime handoff phase|Signed URL creation in this runtime handoff phase|Public artifact creation in this runtime handoff phase|Final render\/export in this runtime handoff phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"realWorkerDispatchInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"workerExecutionInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"mediaProcessingInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"dockerExecutionInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"remotionExecutionInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"supabaseMutationInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"sqlExecutionInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"finalRenderExportInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisRuntimeHandoffPhase"\s*:\s*true/i,
  /"productionUnlockInThisRuntimeHandoffPhase"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1-diagnostics.mjs'
) {
  fail('missing guarded worker runtime handoff diagnostics package script')
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
if (record.sourceChain?.workerDispatchExecutionPacketPr !== 1949) fail('worker-dispatch PR mismatch')
if (record.sourceChain?.workerDispatchExecutionPacketMergeSha !== integrationBase) fail('worker-dispatch merge mismatch')
if (record.sourceChain?.workerDispatchExecutionPacketRunId !== dispatchRunId) fail('worker-dispatch run ID mismatch')
if (record.sourceChain?.workerDispatchMetadataEnvelope !== 'completed_guarded_local_mock_worker_dispatch_metadata_envelope') fail('worker-dispatch envelope mismatch')
if (record.sourceChain?.workerDispatchMetadataStatus !== 'accepted_guarded_local_mock_worker_dispatch_metadata_only') fail('worker-dispatch status mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.handoff?.status !== 'ready_for_confirmation_gated_post_dispatch_worker_runtime_execution_packet') fail('handoff status mismatch')
if (record.handoff?.nextPacket !== nextMilestone) fail('next packet mismatch')
if (record.handoff?.requiredFutureGate !== 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION=true') fail('future gate mismatch')
if (record.handoff?.localMockQueueItem !== 'mock-job-runtime-queue-item-0001') fail('local mock queue item mismatch')
if (record.handoff?.rawCallerCommandsAccepted !== false) fail('raw caller command flag mismatch')
if (record.handoff?.metadataOnlyInThisPhase !== true) fail('metadata-only flag mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly' || key === 'workerRuntimeHandoffSource') {
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

const dispatchRecord = json(dispatchRecordPath)
if (dispatchRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_dispatch_execution_packet_metadata_only') fail('dispatch source decision mismatch')
if (dispatchRecord.runId !== dispatchRunId) fail('dispatch source run ID mismatch')
if (dispatchRecord.nextMilestone !== packet) fail('dispatch source next milestone mismatch')
if (dispatchRecord.workerDispatchMetadata?.queueItemId !== 'mock-job-runtime-queue-item-0001') fail('dispatch source queue item mismatch')

const runtimeRecord = json(runtimeRecordPath)
if (runtimeRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture') fail('runtime source decision mismatch')
if (runtimeRecord.runtimeExecution?.status !== 'completed_controlled_generated_fixture_runtime_execution') fail('runtime source status mismatch')

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
