#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-EXECUTION-QA-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1-record.json'
const decision = 'qa_passed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_execution_packet_evidence'
const execution = 'completed_docs_only_external_agent_execution_packet_qa_no_runtime_execution'
const executionPacketMergeSha = '311f82290808bf4db20876d35b858d57c54a90db'
const executionPacketRunId = '2026-07-02T17-37-48-276Z-d4767789'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const workerSource = 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-RUNTIME-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/qa-review.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
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
  /\b(?:Route execution in this QA phase|External agent runtime invocation in this QA phase|Real worker dispatch in this QA phase|Worker process started in this QA phase|Worker execution in this QA phase|Worker lease claim in this QA phase|Worker lease mutation in this QA phase|Persistent job queue write in this QA phase|GStreamer execution in this QA phase|MKVToolNix execution in this QA phase|FFmpeg\/FFprobe execution in this QA phase|Docker execution in this QA phase|Supabase mutation in this QA phase|SQL execution in this QA phase|Public artifact creation in this QA phase|Final render\/export in this QA phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisQaPhase"\s*:\s*true/i,
  /"externalAgentRuntimeInvocationInThisQaPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisQaPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisQaPhase"\s*:\s*true/i,
  /"workerExecutionInThisQaPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisQaPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisQaPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisQaPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQaPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisQaPhase"\s*:\s*true/i,
  /"dockerExecutionInThisQaPhase"\s*:\s*true/i,
  /"supabaseMutationInThisQaPhase"\s*:\s*true/i,
  /"sqlExecutionInThisQaPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisQaPhase"\s*:\s*true/i,
  /"finalRenderExportInThisQaPhase"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  executionPacketMergeSha,
  executionPacketRunId,
  routePath,
  workerSource,
  'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_execution_packet',
  'completed_confirmation_gated_external_agent_execution_packet_no_route_worker_tool_or_media_execution',
  'source_evidence_review_only',
  'QA status: `passed`',
  'ready_for_separate_confirmation_gated_external_agent_runtime_execution_packet',
  'Route execution in this QA phase: `false`',
  'External agent runtime invocation in this QA phase: `false`',
  'Real worker dispatch in this QA phase: `false`',
  'Worker process started in this QA phase: `false`',
  'Worker execution in this QA phase: `false`',
  'Worker lease claim in this QA phase: `false`',
  'Persistent job queue write in this QA phase: `false`',
  'GStreamer execution in this QA phase: `false`',
  'MKVToolNix execution in this QA phase: `false`',
  'FFmpeg/FFprobe execution in this QA phase: `false`',
  'Docker execution in this QA phase: `false`',
  'Supabase mutation in this QA phase: `false`',
  'SQL execution in this QA phase: `false`',
  'Public artifact creation in this QA phase: `false`',
  'Final render/export in this QA phase: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Product-ready end-to-end local OSS tools: `0`',
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-qa-1-diagnostics.mjs'
) fail('missing execution QA diagnostics package script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_execution_packet') fail('source decision mismatch')
if (sourceRecord.runId !== executionPacketRunId) fail('source run ID mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.validation !== 'passed') fail('source validation mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.qa?.scope !== 'source_evidence_review_only') fail('QA scope mismatch')
if (record.qa?.status !== 'passed') fail('QA status mismatch')
if (record.qa?.acceptance !== 'ready_for_separate_confirmation_gated_external_agent_runtime_execution_packet') fail('QA acceptance mismatch')
if (record.sourceChain?.externalAgentExecutionPacketMergeSha !== executionPacketMergeSha) fail('execution packet merge SHA mismatch')
if (record.sourceChain?.externalAgentExecutionPacketRunId !== executionPacketRunId) fail('execution packet run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.workerSourcePath !== workerSource) fail('worker source mismatch')
if (record.acceptedEvidence?.executionPacketDecision !== sourceRecord.decision) fail('accepted decision mismatch')
if (record.acceptedEvidence?.executionPacketExecution !== sourceRecord.execution) fail('accepted execution mismatch')
for (const [key, value] of Object.entries(record.qaPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`QA phase safety flag must be false: ${key}`)
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
