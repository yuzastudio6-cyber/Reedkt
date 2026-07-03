#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXTERNAL-BETA-READINESS-ROLLUP-1'
const decision = 'completed_three_tool_external_agent_generated_fixture_execution_ready_for_external_beta_orchestration'
const execution = 'completed_docs_only_external_beta_readiness_rollup_no_new_runtime_execution'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-external-beta-readiness-rollup-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-external-beta-readiness-rollup-1-record.json`
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-external-beta-readiness-rollup-1-results.md'
const nextPromptPath =
  'docs/implementation-prompts/prompt-rp-external-beta-orchestration-three-tool-generated-fixture-job-enablement-1.md'
const workerProcessRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1-record.json'
const nextMilestone = 'RP-EXTERNAL-BETA-ORCHESTRATION-THREE-TOOL-GENERATED-FIXTURE-JOB-ENABLEMENT-1'
const workerProcessMergeSha = 'e21a34af69d8bd52ed7085e95f12b3d45d0c0ea7'
const workerProcessRunId = '2026-07-03T13-43-18-998Z-5466071d'
const childRunId = '2026-07-03T13-43-19-052Z-273c9624'
const readiness = 'external_agent_generated_fixture_worker_process_execution_ready'
const sourceReadiness = 'external_agent_worker_process_approved_snapshot_execution_passed'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-chain.md`,
  `${dir}/tool-readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-three-tool-external-agent-external-beta-readiness-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-diagnostics.mjs',
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
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Secret payload access|Provider call|Model call|Worker dispatch|Persistent job queue write|Remote worker claim mutation|Signed URL creation|Public artifact creation|Final render\/export|Private media processing|User media processing|FFmpeg\/FFprobe execution|Docker push\/deploy|Remotion execution|Package installation|Dependency mutation|Package-lock mutation):\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /"newRuntimeExecutionInThisRollupPhase"\s*:\s*true/i,
]

const requiredText = [
  packet,
  decision,
  execution,
  'Active Track A tool lane count: `3`',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  readiness,
  'approved_snapshot_controlled_generated_fixture_only',
  workerProcessMergeSha,
  workerProcessRunId,
  childRunId,
  '#577',
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

for (const file of [...packetFiles, ...implementationFiles, workerProcessRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-external-beta-readiness-rollup-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-external-beta-readiness-rollup-1-diagnostics.mjs'
) {
  fail('missing external-beta readiness rollup diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(workerProcessRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_worker_process_approved_snapshot_execution') {
  fail('worker-process source decision mismatch')
}
if (sourceRecord.execution !== 'completed_worker_process_delegate_to_approved_snapshot_generated_fixture_runtime') {
  fail('worker-process source execution mismatch')
}
if (sourceRecord.validation !== 'passed') fail('worker-process source validation mismatch')
if (sourceRecord.runId !== workerProcessRunId) fail('worker-process source run ID mismatch')
if (sourceRecord.childApprovedSnapshotExecution?.runId !== childRunId) fail('child approved-snapshot run ID mismatch')
if (sourceRecord.sourceChain?.workerClaimLeaseMergeSha !== 'ac992038ff5c196b54488f908e83c6816a892d5b') {
  fail('worker claim source merge mismatch')
}
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (sourceRecord.readiness?.[tool] !== sourceReadiness) fail(`source readiness mismatch: ${tool}`)
}
if (sourceRecord.packageLock !== 'unchanged') fail('worker-process source package-lock mismatch')
if (sourceRecord.generatedArtifactsCommitted !== 'none') fail('worker-process source generated artifact mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (!['pending_local_validation', 'passed'].includes(record.validation)) fail('record validation status mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('active tool lane count mismatch')
if (record.sourceChain?.workerProcessApprovedSnapshotExecutionMergeSha !== workerProcessMergeSha) {
  fail('worker-process merge SHA mismatch')
}
if (record.sourceChain?.workerProcessApprovedSnapshotExecutionRunId !== workerProcessRunId) {
  fail('worker-process run ID mismatch')
}
if (record.sourceChain?.workerProcessApprovedSnapshotExecutionChildRunId !== childRunId) {
  fail('worker-process child run ID mismatch')
}
if (record.sourceChain?.blockedExcludedPr !== '#577 open/draft/blocked/excluded') fail('#577 exclusion mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (record.tools?.[tool]?.readiness !== readiness) fail(`record readiness mismatch: ${tool}`)
  if (record.tools?.[tool]?.scope !== 'approved_snapshot_controlled_generated_fixture_only') {
    fail(`record scope mismatch: ${tool}`)
  }
}
for (const [key, value] of Object.entries(record.readyPath ?? {})) {
  if (value !== true) fail(`ready path flag must be true: ${key}`)
}
for (const [key, value] of Object.entries(record.blockedScope ?? {})) {
  if (value !== true) fail(`blocked scope flag must stay true: ${key}`)
}
for (const [key, value] of Object.entries(record.rollupPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} must be true`)
  } else if (value !== false) {
    fail(`rollup safety flag must be false: ${key}`)
  }
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
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
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden claim matched in changed files: ${pattern}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      packet,
      decision,
      execution,
      activeNativeContainerToolLaneCount: 3,
      readiness,
      nextMilestone,
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    null,
    2,
  ),
)
