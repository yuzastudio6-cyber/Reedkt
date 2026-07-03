#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1'
const decision = 'completed_three_tool_external_agent_approved_snapshot_job_execution'
const execution = 'completed_confirmation_gated_three_tool_approved_snapshot_job_execution_generated_fixture_only'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-record.json`
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-worker-process-noop-invoke-1/tracka-three-tool-external-agent-worker-process-noop-invoke-1-record.json'
const childSourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-record.json'
const activationPath =
  'docs/activation-phase-tracka-three-tool-external-agent-approved-snapshot-job-execution-1-results.md'
const nextPromptPath =
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-production-readiness-review-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const runId = '2026-07-03T03-41-30-494Z-41a3b873'
const outputDir = `/tmp/reeditpro-tracka-three-tool-external-agent-approved-snapshot-job-execution-1/${runId}`
const childRunId = '2026-07-03T03-41-30-650Z-41ce5185'
const approvedSnapshotId = 'approved-snapshot-three-tool-external-agent-generated-fixture-post-qa-1'
const jobId = 'job-three-tool-external-agent-generated-fixture-post-qa-1'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PRODUCTION-READINESS-REVIEW-1'

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/execution-result.md`,
  `${dir}/command-matrix.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-noop-invoke-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1.mjs',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
const forbiddenPathPatterns = [
  /^package-lock\.json$/,
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
  /\b(?:Route execution|Persistent job queue write|Worker dispatch|Worker lease claim|Worker process start|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Provider call|Model call|Credit mutation|Deployment|External beta expansion|Production unlock|Final render\/export|Package installation|Dependency mutation|Package-lock mutation|Docker push\/deploy):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"externalBetaExpansion"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION=true',
  runId,
  outputDir,
  childRunId,
  approvedSnapshotId,
  jobId,
  'completed_three_tool_external_agent_controlled_generated_fixture_execution',
  'completed_confirmation_gated_three_tool_controlled_generated_fixture_runtime_execution',
  'external_agent_approved_snapshot_job_execution_passed',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains open/draft/blocked/excluded',
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath, childSourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-approved-snapshot-job-execution-1'] !==
  'node scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1.mjs'
) fail('missing approved snapshot job execution package script')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-approved-snapshot-job-execution-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs'
) fail('missing approved snapshot job execution diagnostics package script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_worker_process_noop_invoke') {
  fail('source worker-process no-op decision mismatch')
}
if (sourceRecord.runId !== '2026-07-03T01-56-20-543Z-b12b79bf') fail('source worker-process run ID mismatch')
if (sourceRecord.workerProcessNoop?.entrypointId !== 'tracka-three-tool-external-agent-worker-process-noop-entrypoint-1') {
  fail('source worker-process entrypoint mismatch')
}

const childSourceRecord = json(childSourceRecordPath)
if (childSourceRecord.decision !== 'completed_three_tool_external_agent_controlled_generated_fixture_execution') {
  fail('child source decision mismatch')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION=true') {
  fail('confirmation gate mismatch')
}
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.approvedSnapshotJobExecution?.approvedSnapshotId !== approvedSnapshotId) fail('approved snapshot ID mismatch')
if (record.approvedSnapshotJobExecution?.jobId !== jobId) fail('job ID mismatch')
if (record.approvedSnapshotJobExecution?.childRunId !== childRunId) fail('child run ID mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (record.readiness?.[tool] !== 'external_agent_approved_snapshot_job_execution_passed') {
    fail(`tool readiness mismatch: ${tool}`)
  }
}
for (const key of [
  'routeExecution',
  'persistentJobQueueWrite',
  'workerDispatch',
  'workerLeaseClaim',
  'workerProcessStart',
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'signedUrlCreation',
  'publicArtifactCreation',
  'providerCall',
  'modelCall',
  'creditMutation',
  'deployment',
  'externalBetaExpansion',
  'productionUnlock',
  'finalRenderExport',
  'packageInstallation',
  'dependencyMutation',
  'packageLockMutation',
  'dockerPushDeploy',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
for (const [fileName, bytes, sha256] of [
  ['three-tool-external-agent-approved-snapshot-job-execution-1-report.json', 6942, '77d7e31b79258ef28155a7e5be2ae1adb14ac4868cf9006763a6da8d1d9defaf'],
  ['approved-snapshot-runtime-envelope.json', 2098, '391967ec13bd29c6ec3f69f74474ace181ee73fd91d20ab46a3da2e9281365a0'],
  ['output-manifest.json', 671, '1c08e08e41ee86546d490281dab165b3b6672a39e9f633cbb2203c431c7f7c15'],
  ['qa-report.json', 752, '48725a8f29e7853064554f5b6d3aa74ef42b4d82745b818870de73c7bae894f5'],
  ['three-tool-external-agent-approved-snapshot-job-execution-1-manifest.json', 1432, 'f1628f0f59f9b60006ba3a30609592337a5cccaee4f8ae3441d1e96cef0ed353'],
]) {
  if (!record.artifacts?.some((artifact) => artifact.fileName === fileName && artifact.bytes === bytes && artifact.sha256 === sha256)) {
    fail(`artifact evidence mismatch: ${fileName}`)
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
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file claim matched: ${pattern}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      packet,
      decision,
      execution,
      runId,
      childRunId,
      approvedSnapshotId,
      jobId,
      readiness: record.readiness,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
      productReadyEndToEndLocalOssTools: 0,
      nextMilestone,
      changedFiles: uniqueChangedFiles,
    },
    null,
    2,
  ),
)
