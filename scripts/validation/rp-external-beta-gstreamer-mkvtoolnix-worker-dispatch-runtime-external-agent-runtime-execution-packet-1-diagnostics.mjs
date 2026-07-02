#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-RUNTIME-EXECUTION-PACKET-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_runtime_execution_packet'
const execution = 'completed_docs_only_runtime_execution_packet_no_route_worker_tool_or_media_execution'
const executionQaDecision = 'qa_passed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_execution_packet_evidence'
const executionQaMergeSha = '5621ee3cfb7146ee0ba13617b5c8d24f9ebf80d2'
const executionPacketRunId = '2026-07-02T17-37-48-276Z-d4767789'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const workerSource = 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_RUNTIME_EXECUTION'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-CONFIRMED-RUNTIME-EXECUTION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/runtime-execution-packet.md`,
  `${dir}/route-runtime-boundary.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-diagnostics.mjs',
]

const confirmedRuntimeExecutionPacketDir =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1'
const confirmedRuntimeExecutionPacketFiles = [
  `${confirmedRuntimeExecutionPacketDir}/source-audit.md`,
  `${confirmedRuntimeExecutionPacketDir}/evidence-reconciliation.md`,
  `${confirmedRuntimeExecutionPacketDir}/route-worker-runtime-evidence.md`,
  `${confirmedRuntimeExecutionPacketDir}/readiness.md`,
  `${confirmedRuntimeExecutionPacketDir}/safety-boundary.md`,
  `${confirmedRuntimeExecutionPacketDir}/validation-results.md`,
  `${confirmedRuntimeExecutionPacketDir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...confirmedRuntimeExecutionPacketFiles])
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
const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Route execution in this runtime-execution-packet phase|External agent runtime invocation in this runtime-execution-packet phase|Real worker dispatch in this runtime-execution-packet phase|Worker process started in this runtime-execution-packet phase|Worker execution in this runtime-execution-packet phase|Worker lease claim in this runtime-execution-packet phase|Worker lease mutation in this runtime-execution-packet phase|Persistent job queue write in this runtime-execution-packet phase|GStreamer execution in this runtime-execution-packet phase|MKVToolNix execution in this runtime-execution-packet phase|FFmpeg\/FFprobe execution in this runtime-execution-packet phase|Docker execution in this runtime-execution-packet phase|Supabase mutation in this runtime-execution-packet phase|SQL execution in this runtime-execution-packet phase|Public artifact creation in this runtime-execution-packet phase|Final render\/export in this runtime-execution-packet phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"externalAgentRuntimeInvocationInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"workerExecutionInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"dockerExecutionInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"supabaseMutationInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"sqlExecutionInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
  /"finalRenderExportInThisRuntimeExecutionPacketPhase"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  executionQaDecision,
  executionQaMergeSha,
  executionPacketRunId,
  routePath,
  workerSource,
  confirmEnv,
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  'controlled_generated_fixture_only',
  'No runtime command/package runner was added in this packet',
  'must_name_exact_invoker_before_execution',
  'ready_for_confirmation_gated_external_agent_runtime_execution_attempt',
  'Route execution in this runtime-execution-packet phase: `false`',
  'External agent runtime invocation in this runtime-execution-packet phase: `false`',
  'Real worker dispatch in this runtime-execution-packet phase: `false`',
  'Worker process started in this runtime-execution-packet phase: `false`',
  'Worker execution in this runtime-execution-packet phase: `false`',
  'Worker lease claim in this runtime-execution-packet phase: `false`',
  'Persistent job queue write in this runtime-execution-packet phase: `false`',
  'GStreamer execution in this runtime-execution-packet phase: `false`',
  'MKVToolNix execution in this runtime-execution-packet phase: `false`',
  'FFmpeg/FFprobe execution in this runtime-execution-packet phase: `false`',
  'Docker execution in this runtime-execution-packet phase: `false`',
  'Supabase mutation in this runtime-execution-packet phase: `false`',
  'SQL execution in this runtime-execution-packet phase: `false`',
  'Public artifact creation in this runtime-execution-packet phase: `false`',
  'Final render/export in this runtime-execution-packet phase: `false`',
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath]) read(file)
const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-diagnostics.mjs'
) fail('missing runtime execution packet diagnostics package script')
if (packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1']) {
  fail('runtime execution runner package script must not be added by this docs-only packet')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== executionQaDecision) fail('source QA decision mismatch')
if (sourceRecord.qa?.acceptance !== 'ready_for_separate_confirmation_gated_external_agent_runtime_execution_packet') {
  fail('source QA acceptance mismatch')
}
if (sourceRecord.sourceChain?.externalAgentExecutionPacketRunId !== executionPacketRunId) fail('source run ID mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.validation !== 'passed') fail('source validation mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.externalAgentExecutionQaMergeSha !== executionQaMergeSha) fail('execution QA merge SHA mismatch')
if (record.sourceChain?.externalAgentExecutionPacketRunId !== executionPacketRunId) fail('execution packet run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.workerSourcePath !== workerSource) fail('worker source mismatch')
if (record.requiredFutureRuntimeGate !== confirmEnv) fail('future runtime gate mismatch')
if (record.runtimePacket?.runtimeCommandPackageRunnerAdded !== false) fail('runtime runner must not be added')
if (record.runtimePacket?.fixtureScope !== 'controlled_generated_fixture_only') fail('fixture scope mismatch')
if (record.futureRuntimeRequirements?.routeRuntimeInvocation !== 'must_name_exact_invoker_before_execution') {
  fail('future route invocation requirement mismatch')
}
for (const [key, value] of Object.entries(record.runtimeExecutionPacketPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`runtime execution packet safety flag must be false: ${key}`)
  }
}
if (record.readiness?.externalAgentRuntimeExecution !== 'ready_for_confirmation_gated_external_agent_runtime_execution_attempt') {
  fail('readiness mismatch')
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
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  readiness: record.readiness.externalAgentRuntimeExecution,
  changedFiles: uniqueChangedFiles,
}, null, 2))
