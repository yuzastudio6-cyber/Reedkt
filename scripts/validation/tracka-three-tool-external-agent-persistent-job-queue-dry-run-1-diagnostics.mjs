#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTENT-JOB-QUEUE-DRY-RUN-1'
const decision = 'completed_three_tool_external_agent_persistent_job_queue_dry_run'
const execution =
  'completed_confirmation_gated_three_tool_persistent_job_queue_payload_validation_no_queue_write_worker_tool_media_execution'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN=true'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-LEASE-DRY-RUN-1'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1-record.json`
const sourceWorkerDispatchRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-record.json'
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-persistent-job-queue-dry-run-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-worker-lease-dry-run-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const sourceWorkerDispatchMergeSha = '275a8010236f02dbc6640f8711d0bf64a29b4caf'
const sourceWorkerDispatchHeadSha = 'e45c99f5c476764359f382c27894bd0da05b3745'
const sourceWorkerDispatchRunId = '2026-07-03T01-28-17-653Z-f2a11fd7'
const runId = '2026-07-03T01-37-36-983Z-e5cc7cbf'
const outputDir = `/tmp/reeditpro-tracka-three-tool-external-agent-persistent-job-queue-dry-run-1/${runId}`
const idempotencyKey = 'cfdedaba0ff1a6ea1f29ee0caf9a05f139ec7b157560b57ce439028ac4027dbf'
const reportSha = 'ddc499efc294e0814775d29ada3e5e7585fc3a7768de372dcb10257e77704903'
const manifestSha = '5254ccbb672daac138103e1eb8583d9480d7ff44274b78f2c557771d7411476b'

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/queue-dry-run-result.md`,
  `${dir}/queue-contract.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
  'server/services/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1.ts',
  'server/cli/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1.ts',
  'scripts/validation/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1\.ts$|cli\/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1\.ts$)/,
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
  /\b(?:Persistent job queue write|Route execution|Worker dispatch|Worker execution|Worker process start|Worker lease claim|Tool execution|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Secret payload access|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Package-lock mutation|Dependency mutation|Generated artifacts committed)\s*:\s*`?(true|enabled|completed|run|executed)\b/i,
  /\b(?:GStreamer execution in this queue dry-run phase|MKVToolNix execution in this queue dry-run phase|GPAC\/MP4Box execution in this queue dry-run phase|Docker execution in this queue dry-run phase)\s*:\s*`?(true|enabled|completed|run|executed)\b/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"toolExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisQueueDryRun"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQueueDryRun"\s*:\s*true/i,
  /"gpacMp4boxExecutionInThisQueueDryRun"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"serviceRoleSecretPayloadAccess"\s*:\s*true/i,
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
  confirmGate,
  nextMilestone,
  sourceWorkerDispatchMergeSha,
  sourceWorkerDispatchHeadSha,
  sourceWorkerDispatchRunId,
  runId,
  outputDir,
  idempotencyKey,
  reportSha,
  manifestSha,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  'tracka-three-tool-external-agent-persistent-jobs',
  'tracka-three-tool-external-agent-noop',
  'externalBeta.trackaThreeTool.guardedNoopWorkerDispatchSource',
  'tracka_three_tool_external_agent_worker',
  'tracka_three_tool_external_agent_generated_fixture_execution',
  'metadata_only_dry_run_no_persistent_write',
  'accepted_three_tool_persistent_job_queue_dry_run_contract',
  'Payload shape validation: `passed`',
  'Idempotency key validation: `passed`',
  '#577 open_draft_blocked_excluded',
  'Raw command strings allowed: `false`',
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

for (const file of [...requiredFiles, sourceWorkerDispatchRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-persistent-job-queue-dry-run-1'] !==
  'tsx server/cli/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1.ts'
) {
  fail('missing persistent job queue dry-run package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-persistent-job-queue-dry-run-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1-diagnostics.mjs'
) {
  fail('missing persistent job queue dry-run diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in queue dry-run corpus: ${pattern}`)
}

const sourceRecord = json(sourceWorkerDispatchRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_guarded_worker_dispatch_noop_invoke') {
  fail('source worker-dispatch no-op decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source worker-dispatch no-op next milestone mismatch')
if (sourceRecord.runId !== sourceWorkerDispatchRunId) fail('source worker-dispatch no-op run ID mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceWorkerDispatchNoop?.mergeSha !== sourceWorkerDispatchMergeSha) fail('source merge SHA mismatch')
if (record.sourceWorkerDispatchNoop?.headSha !== sourceWorkerDispatchHeadSha) fail('source head SHA mismatch')
if (record.sourceWorkerDispatchNoop?.runId !== sourceWorkerDispatchRunId) fail('source run ID mismatch')
if (record.queueDryRun?.queueName !== 'tracka-three-tool-external-agent-persistent-jobs') fail('queue name mismatch')
if (record.queueDryRun?.queueWriteMode !== 'metadata_only_dry_run_no_persistent_write') fail('queue write mode mismatch')
if (record.queueDryRun?.idempotencyKey !== idempotencyKey) fail('idempotency key mismatch')
for (const field of [
  'payloadShapeValidation',
  'idempotencyKeyValidation',
  'leasePolicyValidation',
  'artifactManifestPlaceholderValidation',
]) {
  if (record.queueDryRun?.[field] !== 'passed') fail(`queue validation mismatch: ${field}`)
}
for (const [key, value] of Object.entries(record.queueDryRun ?? {})) {
  if (
    ![
      'queueName',
      'sourceNoopQueueName',
      'workerDispatchSourceId',
      'workerKind',
      'jobType',
      'queueWriteMode',
      'idempotencyKey',
      'payloadShapeValidation',
      'idempotencyKeyValidation',
      'leasePolicyValidation',
      'artifactManifestPlaceholderValidation',
    ].includes(key) &&
    value !== false
  ) {
    fail(`queue dry-run flag must be false: ${key}`)
  }
}
if (record.response?.status !== 'accepted_three_tool_persistent_job_queue_dry_run_contract') {
  fail('response status mismatch')
}
if (record.response?.queuePayloadValidation !== 'passed') fail('queue payload validation response mismatch')
if (record.response?.idempotencyKeyValidation !== 'passed') fail('idempotency response mismatch')
for (const [key, value] of Object.entries(record.response ?? {})) {
  if (!['status', 'queuePayloadValidation', 'idempotencyKeyValidation'].includes(key) && value !== false) {
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
      artifact.fileName === 'three-tool-external-agent-persistent-job-queue-dry-run-report.json' &&
      artifact.bytes === 20705 &&
      artifact.sha256 === reportSha,
  )
) {
  fail('report artifact evidence mismatch')
}
if (
  !record.artifacts?.some(
    (artifact) =>
      artifact.fileName === 'three-tool-external-agent-persistent-job-queue-dry-run-manifest.json' &&
      artifact.bytes === 1281 &&
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

const serviceSource = read('server/services/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1.ts')
for (const text of [
  'runThreeToolExternalAgentPersistentJobQueueDryRun',
  'invokeThreeToolExternalAgentGuardedWorkerDispatchNoop',
  'metadata_only_dry_run_no_persistent_write',
  'accepted_three_tool_persistent_job_queue_dry_run_contract',
  'payloadShapeValidation',
  'idempotencyKeyValidation',
  'persistentJobQueueWrite: false',
  'workerLeaseClaim: false',
  'workerDispatch: false',
  'workerExecution: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required text: ${text}`)
}

const cliSource = read('server/cli/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1.ts')
for (const text of [
  '/tmp/reeditpro-tracka-three-tool-external-agent-persistent-job-queue-dry-run-1',
  'runThreeToolExternalAgentPersistentJobQueueDryRun',
  'three-tool-external-agent-persistent-job-queue-dry-run-report.json',
  'three-tool-external-agent-persistent-job-queue-dry-run-manifest.json',
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
  idempotencyKey,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
