#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-EXECUTION-PACKET-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1-record.json`
const dryRunRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_execution_packet'
const execution = 'completed_confirmation_gated_external_agent_execution_packet_no_route_worker_tool_or_media_execution'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_EXECUTION_PACKET'
const dryRunMergeSha = '85805fe2055f893a8e32f689d842c1ecafd7f6ff'
const dryRunRunId = '2026-07-02T17-27-30-594Z-c3ff4d53'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const workerSource = 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-EXECUTION-QA-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/execution-packet.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
for (const file of [
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1/qa-review.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1/evidence-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-diagnostics.mjs',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/runtime-execution-packet.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/route-runtime-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}
const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]
const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Route execution in this execution-packet phase|External agent runtime invocation in this execution-packet phase|Real worker dispatch in this execution-packet phase|Worker process started in this execution-packet phase|Worker execution in this execution-packet phase|Worker lease claim in this execution-packet phase|Worker lease mutation in this execution-packet phase|Persistent job queue write in this execution-packet phase|GStreamer execution in this execution-packet phase|MKVToolNix execution in this execution-packet phase|FFmpeg\/FFprobe execution in this execution-packet phase|Docker execution in this execution-packet phase|Supabase mutation in this execution-packet phase|SQL execution in this execution-packet phase|Public artifact creation in this execution-packet phase|Final render\/export in this execution-packet phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"externalAgentRuntimeInvocationInThisExecutionPacketPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisExecutionPacketPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisExecutionPacketPhase"\s*:\s*true/i,
  /"workerExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisExecutionPacketPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisExecutionPacketPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"dockerExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"supabaseMutationInThisExecutionPacketPhase"\s*:\s*true/i,
  /"sqlExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisExecutionPacketPhase"\s*:\s*true/i,
  /"finalRenderExportInThisExecutionPacketPhase"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  confirmEnv,
  dryRunMergeSha,
  dryRunRunId,
  routePath,
  workerSource,
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  'controlled_generated_fixture_only',
  'completed_confirmation_gated_external_agent_execution_packet_metadata_only',
  'ready_for_separate_confirmation_gated_external_agent_runtime_execution_packet',
  'Route execution in this execution-packet phase: `false`',
  'External agent runtime invocation in this execution-packet phase: `false`',
  'Real worker dispatch in this execution-packet phase: `false`',
  'Worker process started in this execution-packet phase: `false`',
  'Worker execution in this execution-packet phase: `false`',
  'Worker lease claim in this execution-packet phase: `false`',
  'Persistent job queue write in this execution-packet phase: `false`',
  'GStreamer execution in this execution-packet phase: `false`',
  'MKVToolNix execution in this execution-packet phase: `false`',
  'FFmpeg/FFprobe execution in this execution-packet phase: `false`',
  'Docker execution in this execution-packet phase: `false`',
  'Supabase mutation in this execution-packet phase: `false`',
  'SQL execution in this execution-packet phase: `false`',
  'Public artifact creation in this execution-packet phase: `false`',
  'Final render/export in this execution-packet phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked and excluded',
  nextMilestone,
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

for (const file of [...packetFiles, ...implementationFiles, dryRunRecordPath]) read(file)
const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1.mjs'
) fail('missing execution packet runner package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1-diagnostics.mjs'
) fail('missing execution packet diagnostics package script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const dryRunRecord = json(dryRunRecordPath)
if (dryRunRecord.decision !== 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_dry_run_envelope') fail('dry-run decision mismatch')
if (dryRunRecord.runId !== dryRunRunId) fail('dry-run run ID mismatch')
if (dryRunRecord.nextMilestone !== packet) fail('dry-run next milestone mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.externalAgentDryRunMergeSha !== dryRunMergeSha) fail('dry-run merge SHA mismatch')
if (record.sourceChain?.externalAgentDryRunRunId !== dryRunRunId) fail('dry-run run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.workerSourcePath !== workerSource) fail('worker source mismatch')
if (record.confirmationGate !== confirmEnv) fail('confirmation gate mismatch')
if (!/^2026-/.test(record.runId)) fail('run ID not recorded')
if (!String(record.outputDir).startsWith('/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1/')) {
  fail('output directory must be local /tmp execution-packet evidence path')
}
if (!/^[a-f0-9]{64}$/.test(record.envelope?.sha256 ?? '')) fail('envelope checksum mismatch')
if (!/^[a-f0-9]{64}$/.test(record.qaReport?.sha256 ?? '')) fail('QA report checksum mismatch')
if (record.executionPacket?.status !== 'completed_confirmation_gated_external_agent_execution_packet_metadata_only') fail('execution packet status mismatch')
for (const [key, value] of Object.entries(record.executionPacketPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsAndLocalEnvelopeOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`execution packet safety flag must be false: ${key}`)
  }
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
}
const changedCorpus = uniqueChangedFiles
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile() && /^(docs\/|scripts\/validation\/|package\.json$)/.test(file))
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  runId: record.runId,
  readiness: record.readiness.externalAgentRuntimeExecution,
  changedFiles: uniqueChangedFiles,
}, null, 2))
