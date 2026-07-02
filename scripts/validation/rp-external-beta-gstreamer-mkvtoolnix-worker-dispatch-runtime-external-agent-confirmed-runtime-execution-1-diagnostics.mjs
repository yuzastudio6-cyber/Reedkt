#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-CONFIRMED-RUNTIME-EXECUTION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-record.json`
const routeBridgeQaRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1/gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1-record.json'
const runtimePacketRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-record.json'
const decision = 'satisfied_by_existing_confirmed_route_worker_bridge_runtime_execution_evidence_for_external_agent_runtime_path'
const execution = 'completed_docs_only_confirmed_runtime_execution_evidence_reconciliation_no_new_runtime_execution'
const routeBridgeQaDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_execution_ready_route_worker_bridge_confirmed_invocation'
const routeBridgeQaMergeSha = '67602b088009779d45b0d1f26eabac65c48902fc'
const externalAgentRuntimePacketMergeSha = '14045c17a99a826557033e4b572db1dd4855f1f9'
const runId = '2026-07-02T12-00-03-397Z-aa991010'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const readiness = 'ready_for_external_agent_controlled_generated_fixture_runtime_handoff'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-RUNTIME-READY-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-reconciliation.md`,
  `${dir}/route-worker-runtime-evidence.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-runtime-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-diagnostics.mjs',
]

const readyRollupDir = 'docs/external-beta/gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1'
const readyRollupFiles = [
  `${readyRollupDir}/source-chain.md`,
  `${readyRollupDir}/readiness-rollup.md`,
  `${readyRollupDir}/external-agent-boundary.md`,
  `${readyRollupDir}/tool-matrix.md`,
  `${readyRollupDir}/validation-results.md`,
  `${readyRollupDir}/gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-diagnostics.mjs',
]

const gpacQaRollupDir =
  'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1'
const gpacQaRollupFiles = [
  `${gpacQaRollupDir}/source-audit.md`,
  `${gpacQaRollupDir}/evidence-matrix.md`,
  `${gpacQaRollupDir}/runtime-evidence.md`,
  `${gpacQaRollupDir}/readiness.md`,
  `${gpacQaRollupDir}/safety-boundary.md`,
  `${gpacQaRollupDir}/validation-results.md`,
  `${gpacQaRollupDir}/gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-record.json`,
  'docs/activation-phase-tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-runtime-ready-rollup-1.md',
  'scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...readyRollupFiles, ...gpacQaRollupFiles])
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
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Route execution in this reconciliation phase|External agent runtime invocation in this reconciliation phase|Real worker dispatch in this reconciliation phase|Worker process started in this reconciliation phase|Worker execution in this reconciliation phase|Worker lease claim in this reconciliation phase|Worker lease mutation in this reconciliation phase|Persistent job queue write in this reconciliation phase|GStreamer execution in this reconciliation phase|MKVToolNix execution in this reconciliation phase|FFmpeg\/FFprobe execution in this reconciliation phase|Docker execution in this reconciliation phase|Supabase mutation in this reconciliation phase|SQL execution in this reconciliation phase|Public artifact creation in this reconciliation phase|Final render\/export in this reconciliation phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisReconciliationPhase"\s*:\s*true/i,
  /"externalAgentRuntimeInvocationInThisReconciliationPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisReconciliationPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisReconciliationPhase"\s*:\s*true/i,
  /"workerExecutionInThisReconciliationPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisReconciliationPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisReconciliationPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisReconciliationPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisReconciliationPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisReconciliationPhase"\s*:\s*true/i,
  /"dockerExecutionInThisReconciliationPhase"\s*:\s*true/i,
  /"supabaseMutationInThisReconciliationPhase"\s*:\s*true/i,
  /"sqlExecutionInThisReconciliationPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisReconciliationPhase"\s*:\s*true/i,
  /"finalRenderExportInThisReconciliationPhase"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  routeBridgeQaDecision,
  routeBridgeQaMergeSha,
  externalAgentRuntimePacketMergeSha,
  routePath,
  runId,
  'completed_narrow_execution_ready_route_worker_bridge_controlled_generated_fixture_runtime_delegate',
  'completed_controlled_generated_fixture_only',
  'controlled_generated_fixture_only',
  'Private media processing: `false`',
  'User media processing: `false`',
  'FFmpeg/FFprobe execution: `false`',
  'Supabase mutation: `false`',
  'SQL execution: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Final render/export: `false`',
  readiness,
  'New runtime execution in this reconciliation phase: `false`',
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

for (const file of [...packetFiles, ...implementationFiles, routeBridgeQaRecordPath, runtimePacketRecordPath]) read(file)
const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-diagnostics.mjs'
) fail('missing confirmed runtime execution diagnostics package script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const routeBridgeRecord = json(routeBridgeQaRecordPath)
if (routeBridgeRecord.decision !== routeBridgeQaDecision) fail('route bridge QA decision mismatch')
if (routeBridgeRecord.sourceChain?.routeWorkerBridgeMergeSha !== routeBridgeQaMergeSha) fail('route bridge source merge mismatch')
if (routeBridgeRecord.confirmedInvocation?.runnerRunId !== runId) fail('route bridge runner run ID mismatch')
if (routeBridgeRecord.confirmedInvocation?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('route bridge GStreamer mismatch')
if (routeBridgeRecord.confirmedInvocation?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('route bridge MKVToolNix mismatch')

const runtimePacketRecord = json(runtimePacketRecordPath)
if (runtimePacketRecord.decision !== 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_runtime_execution_packet') {
  fail('runtime packet decision mismatch')
}
if (runtimePacketRecord.sourceChain?.externalAgentExecutionQaMergeSha !== '5621ee3cfb7146ee0ba13617b5c8d24f9ebf80d2') {
  fail('runtime packet source mismatch')
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.routeWorkerBridgeQaPr !== 2113) fail('route bridge PR mismatch')
if (record.sourceChain?.routeWorkerBridgeQaMergeSha !== routeBridgeQaMergeSha) fail('route bridge merge mismatch')
if (record.sourceChain?.externalAgentRuntimeExecutionPacketMergeSha !== externalAgentRuntimePacketMergeSha) fail('external-agent runtime packet merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.httpStatus !== 201) fail('HTTP status mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.runnerRunId !== runId) fail('accepted run ID mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('accepted GStreamer mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('accepted MKVToolNix mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.mediaProcessing !== 'controlled_generated_fixture_only') fail('accepted media processing mismatch')
for (const key of [
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'supabaseMutation',
  'sqlExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
]) {
  if (record.acceptedConfirmedRuntimeEvidence?.[key] !== false) fail(`accepted evidence safety mismatch: ${key}`)
}
for (const [key, value] of Object.entries(record.reconciliationPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`reconciliation safety flag must be false: ${key}`)
  }
}
for (const [name, artifact] of Object.entries(record.artifacts ?? {})) {
  if (typeof artifact?.bytes !== 'number' || artifact.bytes <= 0) fail(`artifact bytes missing: ${name}`)
  if (!/^[a-f0-9]{64}$/.test(String(artifact?.sha256))) fail(`artifact checksum missing: ${name}`)
}
if (record.readiness?.externalAgentRuntimeExecution !== readiness) fail('readiness mismatch')
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
  .filter(
    (file) =>
      fs.existsSync(file) &&
      fs.statSync(file).isFile() &&
      (packetFiles.includes(file) ||
        readyRollupFiles.includes(file) ||
        gpacQaRollupFiles.includes(file) ||
        file === 'package.json') &&
      (file.startsWith('docs/') || file === 'package.json')
  )
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
