#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-WORKER-LEASE-NOOP-1'
const decision = 'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_worker_lease_noop'
const execution =
  'completed_confirmation_gated_worker_lease_noop_contract_validation_no_persistent_queue_write_worker_process_tool_media_execution'
const confirmGate =
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_WORKER_LEASE_NOOP=true'
const nextMilestone = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1'
const dir = 'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1'
const recordPath = `${dir}/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1-record.json`
const sourceRecordPath =
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-route-dry-run-1/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-route-dry-run-1-record.json'
const activationPath =
  'docs/activation-phase-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1-results.md'
const nextPromptPath =
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const runId = '2026-07-03T03-18-07-159Z-a8bfe642'
const outputDir = `/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1/${runId}`
const sourceMergeSha = '217426b0730f45644deeb0f9fe3f4f75e13f68ae'
const sourceHeadSha = '13b45f805182fbd8252d1f65cc9a27ee0021e4b0'
const sourceRunId = '2026-07-03T03-10-51-404Z-c37eaafa'
const sourceDecision = 'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_job_route_dry_run'
const routeIdempotencyKey = 'edd9e5a10252c85e8f0b34867b08dad5c6f4a10fc2fa3038a278678911fe330b'
const approvedSnapshotId = 'approved-snapshot-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1'
const jobId = 'job-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1'
const workerLane = 'tracka_gstreamer_mkvtoolnix_external_agent_generated_fixture'
const leaseNoopId = '8b740ef8f6fe600e6be61acd2891b9740865b8c1a0622c6b4bdd38c5d977635b'
const leaseNoopTokenHash = '8b0fcdd803227d393789622fb05c7bb73c3f79b667337ab04d4f06e79b52a5c9'
const reportSha = 'aa575523b3dd753965f07bad97df571603d514847510d41b3354bc10b2e5a3bb'
const manifestSha = 'd95d4478a0c2790c0ad2fc622b94e0e055db2bf4468dd1d51cda3ae649fffcb3'

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-lease-noop-result.md`,
  `${dir}/worker-lease-contract.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'server/services/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1.ts',
  'server/cli/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1.ts',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-route-dry-run-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
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
  /\b(?:Persistent job queue write|Persistent lease claim|Real worker dispatch|Worker process start|Worker execution|Tool execution|GStreamer execution|MKVToolNix execution|GPAC\/MP4Box execution|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Provider\/model call|Credit mutation|Deployment|Internal beta unlock|External beta expansion|Production unlock|Final render\/export|Package installation|Dependency mutation|Package-lock mutation|Dockerfile install-source change|Requirements install-source change):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"persistentLeaseClaim"\s*:\s*true/i,
  /"realWorkerDispatch"\s*:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"toolExecution"\s*:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
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
  confirmGate,
  runId,
  outputDir,
  sourceMergeSha,
  sourceHeadSha,
  sourceRunId,
  sourceDecision,
  routeIdempotencyKey,
  approvedSnapshotId,
  jobId,
  workerLane,
  leaseNoopId,
  leaseNoopTokenHash,
  reportSha,
  manifestSha,
  '#577 open_draft_blocked_excluded',
  'ready_for_external_agent_approved_snapshot_job_execution',
  'blocked_pending_package_source_install_proof',
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1'] !==
  'tsx server/cli/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1.ts'
) {
  fail('missing worker lease no-op package script')
}
if (
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1:diagnostics'] !==
  'node scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1-diagnostics.mjs'
) {
  fail('missing worker lease no-op diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== sourceDecision) fail('source decision mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.runId !== sourceRunId) fail('source run ID mismatch')
if (sourceRecord.routeDryRun?.idempotencyKey !== routeIdempotencyKey) fail('source route idempotency key mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceRouteDryRun?.mergeSha !== sourceMergeSha) fail('source merge SHA mismatch')
if (record.sourceRouteDryRun?.headSha !== sourceHeadSha) fail('source head SHA mismatch')
if (record.sourceRouteDryRun?.runId !== sourceRunId) fail('source run ID mismatch')
if (record.sourceRouteDryRun?.decision !== sourceDecision) fail('source decision mismatch')
if (record.sourceRouteDryRun?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.workerLeaseNoop?.workerLane !== workerLane) fail('worker lane mismatch')
if (record.workerLeaseNoop?.approvedSnapshotId !== approvedSnapshotId) fail('approved snapshot ID mismatch')
if (record.workerLeaseNoop?.jobId !== jobId) fail('job ID mismatch')
if (record.workerLeaseNoop?.sourceRouteIdempotencyKey !== routeIdempotencyKey) fail('route idempotency key mismatch')
if (record.workerLeaseNoop?.leaseNoopId !== leaseNoopId) fail('lease no-op ID mismatch')
if (record.workerLeaseNoop?.leaseNoopTokenHash !== leaseNoopTokenHash) fail('lease token hash mismatch')
for (const statusField of [
  'leaseEnvelopeValidation',
  'approvedSnapshotReferenceValidation',
  'routeEvidenceValidation',
  'cleanupPolicyValidation',
]) {
  if (record.workerLeaseNoop?.[statusField] !== 'passed') fail(`${statusField} mismatch`)
}
for (const falseField of [
  'persistentJobQueueWrite',
  'persistentLeaseClaim',
  'realWorkerDispatch',
  'workerProcessStart',
  'workerExecution',
  'toolExecution',
]) {
  if (record.workerLeaseNoop?.[falseField] !== false) fail(`${falseField} must be false`)
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-report.json' && artifact.bytes === 4077 && artifact.sha256 === reportSha)) {
  fail('report artifact evidence mismatch')
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-manifest.json' && artifact.bytes === 1259 && artifact.sha256 === manifestSha)) {
  fail('manifest artifact evidence mismatch')
}
if (
  record.readiness?.gstreamer_render_pipeline_support !== 'ready_for_external_agent_approved_snapshot_job_execution' ||
  record.readiness?.mkvtoolnix_container_validation !== 'ready_for_external_agent_approved_snapshot_job_execution'
) {
  fail('GStreamer/MKVToolNix readiness mismatch')
}
if (record.readiness?.gpac_mp4box_packaging_validation !== 'blocked_pending_package_source_install_proof') {
  fail('GPAC readiness mismatch')
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
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
      workerLane,
      approvedSnapshotId,
      jobId,
      leaseNoopId,
      readiness: {
        gstreamer_render_pipeline_support: 'ready_for_external_agent_approved_snapshot_job_execution',
        mkvtoolnix_container_validation: 'ready_for_external_agent_approved_snapshot_job_execution',
        gpac_mp4box_packaging_validation: 'blocked_pending_package_source_install_proof',
      },
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
