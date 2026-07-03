#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-LEASE-DRY-RUN-1'
const decision = 'completed_three_tool_external_agent_worker_lease_dry_run'
const execution =
  'completed_confirmation_gated_three_tool_worker_lease_envelope_validation_no_lease_claim_worker_tool_media_execution'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN=true'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-NOOP-INVOKE-1'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-worker-lease-dry-run-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-worker-lease-dry-run-1-record.json`
const sourceQueueRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1-record.json'
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-worker-lease-dry-run-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-worker-process-noop-invoke-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const sourceQueueMergeSha = '3a076b78ea632efec1a36f08542bb45ec31d4c9f'
const sourceQueueHeadSha = 'dd6e86a607dfce722eac13b9cb353cde6125763d'
const sourceQueueRunId = '2026-07-03T01-37-36-983Z-e5cc7cbf'
const runId = '2026-07-03T01-47-00-547Z-17432713'
const outputDir = `/tmp/reeditpro-tracka-three-tool-external-agent-worker-lease-dry-run-1/${runId}`
const reportSha = 'b5973684fb467cdb75165d17b37fed8a2cf0a893b00c3a8981f47039df5acaf4'
const manifestSha = '51b4e1183711c8486e9848d862af32ffaf7014684c8dd0259c3c7b0bd6e35e7e'

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/lease-dry-run-result.md`,
  `${dir}/lease-contract.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
  'server/services/tracka-three-tool-external-agent-worker-lease-dry-run-1.ts',
  'server/cli/tracka-three-tool-external-agent-worker-lease-dry-run-1.ts',
  'scripts/validation/tracka-three-tool-external-agent-worker-lease-dry-run-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-worker-lease-dry-run-1\.ts$|cli\/tracka-three-tool-external-agent-worker-lease-dry-run-1\.ts$)/,
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
  /\b(?:Worker lease claim|Worker process start|Worker execution|Persistent job queue write|Route execution|Worker dispatch|Tool execution|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Secret payload access|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Package-lock mutation|Dependency mutation|Generated artifacts committed)\s*:\s*`?(true|enabled|completed|run|executed)\b/i,
  /\b(?:GStreamer execution in this lease dry-run phase|MKVToolNix execution in this lease dry-run phase|GPAC\/MP4Box execution in this lease dry-run phase|Docker execution in this lease dry-run phase)\s*:\s*`?(true|enabled|completed|run|executed)\b/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"toolExecution"\s*:\s*true/i,
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
  sourceQueueMergeSha,
  sourceQueueHeadSha,
  sourceQueueRunId,
  runId,
  outputDir,
  reportSha,
  manifestSha,
  'tracka-three-tool-external-agent-lease-dry-run-1',
  'metadata_only_dry_run_no_lease_claim',
  'dry_run_exponential_backoff_metadata_only',
  'dry_run_private_artifact_cleanup_metadata_only',
  'accepted_three_tool_worker_lease_dry_run_contract',
  'Lease envelope validation: `passed`',
  'Retry policy validation: `passed`',
  'Cleanup policy validation: `passed`',
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

for (const file of [...requiredFiles, sourceQueueRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-worker-lease-dry-run-1'] !==
  'tsx server/cli/tracka-three-tool-external-agent-worker-lease-dry-run-1.ts'
) {
  fail('missing worker lease dry-run package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-worker-lease-dry-run-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-worker-lease-dry-run-1-diagnostics.mjs'
) {
  fail('missing worker lease dry-run diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in lease dry-run corpus: ${pattern}`)
}

const sourceRecord = json(sourceQueueRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_persistent_job_queue_dry_run') {
  fail('source queue dry-run decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source queue dry-run next milestone mismatch')
if (sourceRecord.runId !== sourceQueueRunId) fail('source queue dry-run run ID mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceQueueDryRun?.mergeSha !== sourceQueueMergeSha) fail('source merge SHA mismatch')
if (record.sourceQueueDryRun?.headSha !== sourceQueueHeadSha) fail('source head SHA mismatch')
if (record.sourceQueueDryRun?.runId !== sourceQueueRunId) fail('source run ID mismatch')
if (record.leaseDryRun?.leaseId !== 'tracka-three-tool-external-agent-lease-dry-run-1') fail('lease ID mismatch')
if (record.leaseDryRun?.leaseMode !== 'metadata_only_dry_run_no_lease_claim') fail('lease mode mismatch')
if (record.leaseDryRun?.leaseTtlSeconds !== 900) fail('lease TTL mismatch')
for (const field of ['leaseEnvelopeValidation', 'retryPolicyValidation', 'cleanupPolicyValidation']) {
  if (record.leaseDryRun?.[field] !== 'passed') fail(`lease validation mismatch: ${field}`)
}
for (const [key, value] of Object.entries(record.leaseDryRun ?? {})) {
  if (
    ![
      'leaseId',
      'queueName',
      'leaseMode',
      'leaseTtlSeconds',
      'retryPolicy',
      'cleanupPolicy',
      'failureCategories',
      'leaseEnvelopeValidation',
      'retryPolicyValidation',
      'cleanupPolicyValidation',
    ].includes(key) &&
    value !== false
  ) {
    fail(`lease dry-run flag must be false: ${key}`)
  }
}
if (record.response?.status !== 'accepted_three_tool_worker_lease_dry_run_contract') {
  fail('response status mismatch')
}
for (const field of ['leaseEnvelopeValidation', 'retryPolicyValidation', 'cleanupPolicyValidation']) {
  if (record.response?.[field] !== 'passed') fail(`response validation mismatch: ${field}`)
}
for (const [key, value] of Object.entries(record.response ?? {})) {
  if (!['status', 'leaseEnvelopeValidation', 'retryPolicyValidation', 'cleanupPolicyValidation'].includes(key) && value !== false) {
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
      artifact.fileName === 'three-tool-external-agent-worker-lease-dry-run-report.json' &&
      artifact.bytes === 24295 &&
      artifact.sha256 === reportSha,
  )
) {
  fail('report artifact evidence mismatch')
}
if (
  !record.artifacts?.some(
    (artifact) =>
      artifact.fileName === 'three-tool-external-agent-worker-lease-dry-run-manifest.json' &&
      artifact.bytes === 1212 &&
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

const serviceSource = read('server/services/tracka-three-tool-external-agent-worker-lease-dry-run-1.ts')
for (const text of [
  'runThreeToolExternalAgentWorkerLeaseDryRun',
  'runThreeToolExternalAgentPersistentJobQueueDryRun',
  'metadata_only_dry_run_no_lease_claim',
  'accepted_three_tool_worker_lease_dry_run_contract',
  'workerLeaseClaim: false',
  'workerProcessStart: false',
  'workerExecution: false',
  'persistentJobQueueWrite: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required text: ${text}`)
}

const cliSource = read('server/cli/tracka-three-tool-external-agent-worker-lease-dry-run-1.ts')
for (const text of [
  '/tmp/reeditpro-tracka-three-tool-external-agent-worker-lease-dry-run-1',
  'runThreeToolExternalAgentWorkerLeaseDryRun',
  'three-tool-external-agent-worker-lease-dry-run-report.json',
  'three-tool-external-agent-worker-lease-dry-run-manifest.json',
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
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
