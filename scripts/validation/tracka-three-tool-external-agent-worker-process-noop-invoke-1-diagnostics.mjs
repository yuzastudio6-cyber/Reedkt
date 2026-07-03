#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-NOOP-INVOKE-1'
const decision = 'completed_three_tool_external_agent_worker_process_noop_invoke'
const execution =
  'completed_confirmation_gated_three_tool_worker_process_noop_invoke_no_worker_process_tool_media_execution'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_PROCESS_NOOP_INVOKE=true'
const nextMilestone = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-GENERATED-FIXTURE-EXECUTION-1'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-worker-process-noop-invoke-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-worker-process-noop-invoke-1-record.json`
const sourceLeaseRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-worker-lease-dry-run-1/tracka-three-tool-external-agent-worker-lease-dry-run-1-record.json'
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-worker-process-noop-invoke-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const sourceLeaseMergeSha = 'a517b398b081aaa6e728679812f492a65e34315e'
const sourceLeaseHeadSha = '90d5c21d090369d9238895667e7c90149800ea37'
const sourceLeaseRunId = '2026-07-03T01-47-00-547Z-17432713'
const runId = '2026-07-03T01-56-20-543Z-b12b79bf'
const outputDir = `/tmp/reeditpro-tracka-three-tool-external-agent-worker-process-noop-invoke-1/${runId}`
const reportSha = '28b1986aa5c144530ff64f3fe8cc5f1e448ea9a14530880a3467933a602eb26c'
const manifestSha = '1b1eae16cc17dd8fc0f398251839d250a2847a7fe4dc05908ed189b656e6a2a6'

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-process-noop-result.md`,
  `${dir}/worker-process-contract.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
  'server/services/tracka-three-tool-external-agent-worker-process-noop-invoke-1.ts',
  'server/cli/tracka-three-tool-external-agent-worker-process-noop-invoke-1.ts',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-noop-invoke-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-lease-dry-run-1-diagnostics.mjs',
  'package.json',
]

const followUpFiles = [
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-1-diagnostics.mjs',
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/source-chain.md',
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/execution-result.md',
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/command-matrix.md',
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/artifact-manifest-summary.md',
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/safety-boundary.md',
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/validation-results.md',
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-record.json',
  'docs/activation-phase-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-diagnostics.mjs',
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
const followUpFileSet = new Set(followUpFiles)
const allowedChangedFiles = new Set([...requiredFiles, ...followUpFiles])
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-worker-process-noop-invoke-1\.ts$|cli\/tracka-three-tool-external-agent-worker-process-noop-invoke-1\.ts$)/,
  /^docker\//,
  /^\.dockerignore$/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /(?:^|\/)(?:dist|node_modules)\//,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]
const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Worker process start|Worker execution|Tool execution|Persistent job queue write|Worker lease claim|Route execution|Worker dispatch|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Secret payload access|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Package-lock mutation|Dependency mutation|Generated artifacts committed)\s*:\s*`?(true|enabled|completed|run|executed)\b/i,
  /\b(?:GStreamer execution in this worker-process no-op phase|MKVToolNix execution in this worker-process no-op phase|GPAC\/MP4Box execution in this worker-process no-op phase|Docker execution in this worker-process no-op phase)\s*:\s*`?(true|enabled|completed|run|executed)\b/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"toolExecution"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  confirmGate,
  nextMilestone,
  sourceLeaseMergeSha,
  sourceLeaseHeadSha,
  sourceLeaseRunId,
  runId,
  outputDir,
  reportSha,
  manifestSha,
  'tracka-three-tool-external-agent-worker-process-noop-entrypoint-1',
  'metadata_only_in_process_noop_worker_entrypoint',
  'accepted_three_tool_worker_process_noop_contract',
  'Worker entrypoint validation: `passed`',
  'Approved snapshot handoff validation: `passed`',
  'Artifact manifest placeholder assembly: `passed`',
  '#577 open_draft_blocked_excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Validation status: `passed`',
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

for (const file of [...requiredFiles, sourceLeaseRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-worker-process-noop-invoke-1'] !==
  'tsx server/cli/tracka-three-tool-external-agent-worker-process-noop-invoke-1.ts'
) {
  fail('missing worker-process no-op package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-worker-process-noop-invoke-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-worker-process-noop-invoke-1-diagnostics.mjs'
) {
  fail('missing worker-process no-op diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in worker-process no-op corpus: ${pattern}`)
}

const sourceRecord = json(sourceLeaseRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_worker_lease_dry_run') {
  fail('source lease dry-run decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source lease dry-run next milestone mismatch')
if (sourceRecord.runId !== sourceLeaseRunId) fail('source lease dry-run run ID mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceLeaseDryRun?.mergeSha !== sourceLeaseMergeSha) fail('source merge SHA mismatch')
if (record.sourceLeaseDryRun?.headSha !== sourceLeaseHeadSha) fail('source head SHA mismatch')
if (record.sourceLeaseDryRun?.runId !== sourceLeaseRunId) fail('source run ID mismatch')
if (record.workerProcessNoop?.entrypointId !== 'tracka-three-tool-external-agent-worker-process-noop-entrypoint-1') {
  fail('entrypoint ID mismatch')
}
if (record.workerProcessNoop?.processMode !== 'metadata_only_in_process_noop_worker_entrypoint') {
  fail('process mode mismatch')
}
for (const field of [
  'approvedSnapshotHandoffValidation',
  'artifactManifestPlaceholderAssembly',
  'workerEntrypointValidation',
]) {
  if (record.workerProcessNoop?.[field] !== 'passed') fail(`worker-process validation mismatch: ${field}`)
}
for (const [key, value] of Object.entries(record.workerProcessNoop ?? {})) {
  if (
    ![
      'entrypointId',
      'leaseId',
      'processMode',
      'approvedSnapshotHandoffValidation',
      'artifactManifestPlaceholderAssembly',
      'workerEntrypointValidation',
    ].includes(key) &&
    value !== false
  ) {
    fail(`worker-process flag must be false: ${key}`)
  }
}
if (record.response?.status !== 'accepted_three_tool_worker_process_noop_contract') fail('response status mismatch')
for (const field of [
  'workerEntrypointValidation',
  'approvedSnapshotHandoffValidation',
  'artifactManifestPlaceholderAssembly',
]) {
  if (record.response?.[field] !== 'passed') fail(`response validation mismatch: ${field}`)
}
for (const [key, value] of Object.entries(record.response ?? {})) {
  if (
    ![
      'status',
      'workerEntrypointValidation',
      'approvedSnapshotHandoffValidation',
      'artifactManifestPlaceholderAssembly',
    ].includes(key) &&
    value !== false
  ) {
    fail(`response flag must be false: ${key}`)
  }
}
if (record.sourceEvidence?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (
  !record.artifacts?.some(
    (artifact) =>
      artifact.fileName === 'three-tool-external-agent-worker-process-noop-invoke-report.json' &&
      artifact.bytes === 27949 &&
      artifact.sha256 === reportSha,
  )
) {
  fail('report artifact evidence mismatch')
}
if (
  !record.artifacts?.some(
    (artifact) =>
      artifact.fileName === 'three-tool-external-agent-worker-process-noop-invoke-manifest.json' &&
      artifact.bytes === 1258 &&
      artifact.sha256 === manifestSha,
  )
) {
  fail('manifest artifact evidence mismatch')
}
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const serviceSource = read('server/services/tracka-three-tool-external-agent-worker-process-noop-invoke-1.ts')
for (const text of [
  'invokeThreeToolExternalAgentWorkerProcessNoop',
  'runThreeToolExternalAgentWorkerLeaseDryRun',
  'metadata_only_in_process_noop_worker_entrypoint',
  'accepted_three_tool_worker_process_noop_contract',
  'workerProcessStart: false',
  'workerExecution: false',
  'toolExecution: false',
  'persistentJobQueueWrite: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required text: ${text}`)
}

const cliSource = read('server/cli/tracka-three-tool-external-agent-worker-process-noop-invoke-1.ts')
for (const text of [
  '/tmp/reeditpro-tracka-three-tool-external-agent-worker-process-noop-invoke-1',
  'invokeThreeToolExternalAgentWorkerProcessNoop',
  'three-tool-external-agent-worker-process-noop-invoke-report.json',
  'three-tool-external-agent-worker-process-noop-invoke-manifest.json',
]) {
  if (!cliSource.includes(text)) fail(`CLI missing required text: ${text}`)
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
  if (blockedChangedPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
}
const changedCorpus = uniqueChangedFiles
  .filter((file) => !followUpFileSet.has(file))
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
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
  runId,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
