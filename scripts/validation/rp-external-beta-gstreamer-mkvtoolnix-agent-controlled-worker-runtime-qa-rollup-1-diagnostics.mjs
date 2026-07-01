#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-RUNTIME-QA-ROLLUP-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_qa_rollup_generated_fixture_only'
const execution = 'completed_docs_only_runtime_qa_rollup_no_runtime_execution'
const integrationBase = 'f7e2b76235d9b66a56cae7a6df74e0bc29045b3a'
const runtimePacketRunId = '2026-07-01T00-16-10-927Z-8b7402d8'
const guardedRuntimeRunId = '2026-07-01T00-16-10-989Z-a9752eae'
const dispatchDryRunRunId = '2026-06-30T20-56-18-927Z-8e5d25d9'
const queueRunId = '2026-06-30T19-45-59-915Z-af80c9f8'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-READINESS-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/runtime-qa-rollup.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1/gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
for (const file of [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/readiness-decision.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/evidence-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/route-dispatch-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runtimePacketRunId,
  guardedRuntimeRunId,
  dispatchDryRunRunId,
  queueRunId,
  'accepted_runtime_packet_evidence_for_guarded_worker_route_dispatch_readiness_planning',
  'accepted_runtime_packet_generated_fixture_only',
  'ready_for_guarded_worker_route_dispatch_readiness_planning',
  'completed_controlled_generated_fixture_only',
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
  'GStreamer execution in this QA rollup phase: `false`',
  'MKVToolNix execution in this QA rollup phase: `false`',
  'Docker execution in this QA rollup phase: `false`',
  'Route execution: `false`',
  'Worker dispatch: `false`',
  'Worker execution: `false`',
  'Worker lease claim: `false`',
  'Persistent job queue write: `false`',
  'FFmpeg/FFprobe execution: `false`',
  'Supabase mutation: `false`',
  'SQL execution: `false`',
  'f61416714a8ac4333448e7f1d6e3f2351c7bb29faab4473fc920e1bb94c7b45a',
  'a3942b2e55ca80c4ea954db1164d1117cdb238761225bcfc1a3d7edf1fccda93',
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
  /\b(?:GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|Docker execution in this QA rollup phase|Route execution|Worker dispatch|Worker execution|Worker lease claim|Persistent job queue write|FFmpeg\/FFprobe execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"gstreamerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"dockerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing runtime QA rollup diagnostics package script')
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
if (record.qaDisposition !== 'accepted_runtime_packet_evidence_for_guarded_worker_route_dispatch_readiness_planning') fail('QA disposition mismatch')
if (record.sourceChain?.runtimePacketPr !== 1918) fail('runtime packet PR mismatch')
if (record.sourceChain?.runtimePacketMergeSha !== integrationBase) fail('runtime packet merge mismatch')
if (record.sourceChain?.runtimePacketRunId !== runtimePacketRunId) fail('runtime packet run ID mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== guardedRuntimeRunId) fail('guarded runtime run ID mismatch')
if (record.sourceChain?.dispatchDryRunPr !== 1905) fail('dispatch dry-run PR mismatch')
if (record.sourceChain?.dispatchDryRunRunId !== dispatchDryRunRunId) fail('dispatch dry-run run ID mismatch')
if (record.sourceChain?.queueIntegrationPr !== 1902) fail('queue PR mismatch')
if (record.sourceChain?.queueIntegrationRunId !== queueRunId) fail('queue run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.readiness?.gstreamer_render_pipeline_support !== 'ready_for_guarded_worker_route_dispatch_readiness_planning') fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix_container_validation !== 'ready_for_guarded_worker_route_dispatch_readiness_planning') fail('MKVToolNix readiness mismatch')
if (!Array.isArray(record.evidence?.acceptedCommandTemplates) || record.evidence.acceptedCommandTemplates.length !== 4) fail('accepted command template count mismatch')
if (!Array.isArray(record.evidence?.artifactChecksums) || record.evidence.artifactChecksums.length !== 5) fail('artifact checksum count mismatch')
for (const key of [
  'gstreamerExecutionInThisQaRollupPhase',
  'mkvtoolnixExecutionInThisQaRollupPhase',
  'dockerExecutionInThisQaRollupPhase',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerLeaseClaim',
  'persistentJobQueueWrite',
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

const runtimeRecord = json('docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-record.json')
if (runtimeRecord.runId !== runtimePacketRunId) fail('source runtime packet run ID mismatch')
if (runtimeRecord.validation !== 'passed') fail('source runtime packet validation mismatch')
if (runtimeRecord.workerRuntimeExecutionPacket?.nextSourceStatus !== 'ready_for_agent_controlled_worker_runtime_qa_rollup') fail('source runtime packet next status mismatch')

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
console.log('Product-ready end-to-end local OSS tools: 0')
