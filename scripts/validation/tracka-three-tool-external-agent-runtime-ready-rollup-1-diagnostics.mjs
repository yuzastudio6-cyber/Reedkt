#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-RUNTIME-READY-ROLLUP-1'
const decision = 'completed_three_tool_external_agent_runtime_ready_rollup_for_controlled_generated_fixture_paths'
const execution = 'completed_docs_only_three_tool_runtime_ready_rollup_no_new_runtime_execution'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-runtime-ready-rollup-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-runtime-ready-rollup-1-record.json`
const gstreamerMkvtoolnixRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-record.json'
const gpacRecordPath =
  'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1/gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-record.json'
const readiness = 'ready_for_external_agent_controlled_generated_fixture_runtime_handoff'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-HANDOFF-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-chain.md`,
  `${dir}/tool-matrix.md`,
  `${dir}/external-agent-boundary.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-tracka-three-tool-external-agent-runtime-ready-rollup-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-three-tool-external-agent-runtime-ready-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs',
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
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\bprivate media processing:\s*`?(true|enabled|approved|completed_private|user)/i,
  /\buser media processing:\s*`?(true|enabled|approved|completed_user|private)/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '2026-07-02T12-00-03-397Z-aa991010',
  '2026-07-02T21-38-32-756Z-c4ed2b30',
  '90d15f1944e4f86fd0085fbf483b145edf5ec7a9',
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute',
  '/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute',
  readiness,
  'controlled_generated_fixture_runtime_handoff_only',
  '#577 remains open/draft/blocked/excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
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

for (const file of [...packetFiles, ...implementationFiles, gstreamerMkvtoolnixRecordPath, gpacRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-runtime-ready-rollup-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-runtime-ready-rollup-1-diagnostics.mjs'
) fail('missing diagnostics package script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const gmRecord = json(gstreamerMkvtoolnixRecordPath)
if (gmRecord.readiness?.gstreamer !== readiness) fail('GStreamer source readiness mismatch')
if (gmRecord.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix source readiness mismatch')
if (gmRecord.acceptedConfirmedRuntimeEvidence?.runnerRunId !== '2026-07-02T12-00-03-397Z-aa991010') {
  fail('GStreamer/MKVToolNix source run ID mismatch')
}
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
  if (gmRecord.acceptedConfirmedRuntimeEvidence?.[key] !== false) fail(`GStreamer/MKVToolNix safety mismatch: ${key}`)
}

const gpacRecord = json(gpacRecordPath)
if (gpacRecord.readiness?.gpac_mp4box_packaging_validation !== readiness) fail('GPAC source readiness mismatch')
if (gpacRecord.acceptedConfirmedRuntimeEvidence?.runId !== '2026-07-02T21-38-32-756Z-c4ed2b30') {
  fail('GPAC source run ID mismatch')
}
for (const key of [
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'routeExecution',
  'workerExecution',
  'supabaseMutation',
  'sqlExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
]) {
  if (gpacRecord.acceptedConfirmedRuntimeEvidence?.[key] !== false) fail(`GPAC safety mismatch: ${key}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('active lane count mismatch')
if (record.sourceChain?.gpacMp4boxQaRollupMergeSha !== '90d15f1944e4f86fd0085fbf483b145edf5ec7a9') {
  fail('GPAC QA rollup merge SHA mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (record.readiness?.[tool] !== readiness) fail(`readiness mismatch: ${tool}`)
}
if (record.readiness?.externalAgentPathClass !== 'controlled_generated_fixture_runtime_handoff_only') {
  fail('external-agent path class mismatch')
}
for (const [key, value] of Object.entries(record.blockedScope ?? {})) {
  if (value !== true) fail(`blocked scope must remain true: ${key}`)
}
for (const [key, value] of Object.entries(record.rollupPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`rollup safety flag must be false: ${key}`)
  }
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'pending_local_validation' && record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')
gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json staged')

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
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile() && (/^docs\//.test(file) || file === 'package.json'))
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
  readiness: record.readiness,
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}, null, 2))
