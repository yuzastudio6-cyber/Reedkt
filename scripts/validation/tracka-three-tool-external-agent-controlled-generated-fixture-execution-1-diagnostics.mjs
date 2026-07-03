#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-EXECUTION-1'
const decision = 'completed_three_tool_external_agent_controlled_generated_fixture_execution'
const execution = 'completed_confirmation_gated_three_tool_controlled_generated_fixture_runtime_execution'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-record.json`
const activationPath =
  'docs/activation-phase-tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-results.md'
const promptPath =
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1.md'
const qaDir = 'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1'
const handoffRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1-record.json'
const rollupRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-runtime-ready-rollup-1/tracka-three-tool-external-agent-runtime-ready-rollup-1-record.json'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const runId = '2026-07-02T23-06-37-783Z-735edf80'
const gstreamerRunId = '2026-07-02T23-06-37-953Z-ee1ebbec'
const gstreamerGuardedRunId = '2026-07-02T23-06-38-140Z-687e30fc'
const gpacRunId = '2026-07-02T23-06-42-095Z-21ff9b93'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-QA-ROLLUP-1'

const packetFiles = [
  `${dir}/source-chain.md`,
  `${dir}/execution-result.md`,
  `${dir}/command-matrix.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  promptPath,
]

const downstreamQaFiles = [
  `${qaDir}/source-audit.md`,
  `${qaDir}/evidence-review.md`,
  `${qaDir}/tool-readiness.md`,
  `${qaDir}/safety-boundary.md`,
  `${qaDir}/validation-results.md`,
  `${qaDir}/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-record.json`,
  'docs/activation-phase-tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-execution-bridge-1.md',
]

const approvedSnapshotJobExecutionFiles = [
  'docs/activation-phase-tracka-three-tool-external-agent-approved-snapshot-job-execution-1-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/execution-result.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/command-matrix.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/artifact-manifest-summary.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-record.json',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-production-readiness-review-1.md',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1.mjs',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1.mjs',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-noop-invoke-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...downstreamQaFiles,
  ...approvedSnapshotJobExecutionFiles,
  ...implementationFiles,
])
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
  /^tmp\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]
const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\bexternal beta unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\binternal beta unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Route execution|Worker execution|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Private media processing|User media processing|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  runId,
  gstreamerRunId,
  gstreamerGuardedRunId,
  gpacRunId,
  'ready_for_external_agent_three_tool_runtime_qa_rollup',
  'completed_local_images_only_network_disabled_no_push_no_deploy',
  'completed_controlled_generated_fixture_only',
  'controlled_generated_fixture_only',
  'not_run_runtime_runners_only',
  'e8cf179250214f473da15d18203680fd37fb6b3a',
  '#577 open_draft_blocked_excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '102828f889cff62f865f13a856582f07197e8a321032f7b651f14a46a7047df4',
  '0a60bd92ee776ccf0ba3eb78d8e25172206b331e44d70e0006b1d00c248e0b36',
  '476fa99ab7a07a467f7998f2877ce36144f2b37e4ff057b6baaa5ffb71e60870',
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

for (const file of [...packetFiles, ...implementationFiles, handoffRecordPath, rollupRecordPath]) {
  read(file)
}

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-controlled-generated-fixture-execution-1'] !==
  'node scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1.mjs'
) {
  fail('missing execution package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-controlled-generated-fixture-execution-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('active tool lane count mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.sourceChain?.threeToolRuntimeReadyRollupMergeSha !== 'e8cf179250214f473da15d18203680fd37fb6b3a') {
  fail('three-tool rollup merge SHA mismatch')
}
if (record.childRuntimeEvidence?.gstreamerMkvtoolnix?.runId !== gstreamerRunId) fail('GStreamer/MKVToolNix run ID mismatch')
if (record.childRuntimeEvidence?.gstreamerMkvtoolnix?.guardedRuntimeRunId !== gstreamerGuardedRunId) {
  fail('GStreamer/MKVToolNix guarded runtime run ID mismatch')
}
if (record.childRuntimeEvidence?.gpacMp4box?.runId !== gpacRunId) fail('GPAC/MP4Box run ID mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (record.readiness?.[tool] !== 'ready_for_external_agent_three_tool_runtime_qa_rollup') {
    fail(`tool readiness mismatch: ${tool}`)
  }
}
if (record.runtimeExecution?.status !== 'completed_three_tool_controlled_generated_fixture_runtime_execution') {
  fail('runtime execution status mismatch')
}
if (record.runtimeExecution?.routeExecution !== 'not_run_runtime_runners_only') fail('route execution boundary mismatch')
if (record.runtimeExecution?.workerExecution !== 'not_run_runtime_runners_only') fail('worker execution boundary mismatch')
if (record.runtimeExecution?.privateMediaProcessing !== false) fail('private media boundary mismatch')
if (record.runtimeExecution?.userMediaProcessing !== false) fail('user media boundary mismatch')
for (const [key, value] of Object.entries(record.blockedScope ?? {})) {
  if (value !== true) fail(`blocked scope must stay true: ${key}`)
}
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const handoffRecord = json(handoffRecordPath)
if (handoffRecord.decision !== 'completed_three_tool_external_agent_controlled_generated_fixture_handoff_ready_for_guarded_execution') {
  fail('three-tool handoff decision mismatch')
}
const rollupRecord = json(rollupRecordPath)
if (rollupRecord.decision !== 'completed_three_tool_external_agent_runtime_ready_rollup_for_controlled_generated_fixture_paths') {
  fail('three-tool runtime-ready rollup decision mismatch')
}

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
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
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
  runId,
  childRunIds: {
    gstreamerMkvtoolnix: gstreamerRunId,
    gpacMp4box: gpacRunId,
  },
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}, null, 2))
