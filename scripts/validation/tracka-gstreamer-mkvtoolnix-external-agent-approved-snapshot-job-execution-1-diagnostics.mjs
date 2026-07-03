#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1'
const decision = 'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_job_execution'
const execution = 'completed_confirmation_gated_approved_snapshot_job_execution_for_gstreamer_mkvtoolnix_generated_fixture_only'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION=true'
const nextMilestone = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-PRODUCTION-READINESS-REVIEW-1'
const dir = 'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1'
const recordPath = `${dir}/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-record.json`
const sourceRecordPath =
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1-record.json'
const activationPath =
  'docs/activation-phase-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-results.md'
const nextPromptPath =
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-external-agent-production-readiness-review-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const runId = '2026-07-03T03-25-34-270Z-d1b6d1f6'
const outputDir = `/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1/${runId}`
const childRunId = '2026-07-03T03-25-34-334Z-35d3d62c'
const sourceMergeSha = '6f48c37de5da54b91480b03ebab7c2d61fe98025'
const sourceRunId = '2026-07-03T03-18-07-159Z-a8bfe642'
const leaseNoopId = '8b740ef8f6fe600e6be61acd2891b9740865b8c1a0622c6b4bdd38c5d977635b'
const approvedSnapshotId = 'approved-snapshot-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1'
const jobId = 'job-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1'
const imageTag = 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8'
const reportSha = '41e04b8cf92877d42787c620b4f812f98569a961c8e2fa016634674615bb3cce'
const envelopeSha = 'de31d9e780ee34297dd1d8310d6c7bb8f32f80d2f8b07de20edd1f6693d4e6d9'
const outputManifestSha = '04e06c6eab20082130becc430941eab81a884c4a24f04fdfc30220bd3377d8e0'
const qaSha = '347e854b28ebd1d63dd477bdf19cb7b1180fd80d4726b410fbe69bdd2a92e47a'
const manifestSha = '345b38ba65bee17f68c7cc53f240278b3f2be6646bb5caea7d26720c4b240360'

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
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1-diagnostics.mjs',
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
  /\b(?:Private media processing|User media processing|Arbitrary media processing|GPAC\/MP4Box execution|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Provider\/model call|Credit mutation|Deployment|Internal beta unlock|External beta expansion|Production unlock|Final render\/export|Package installation|Dependency mutation|Package-lock mutation|Dockerfile install-source change|Requirements install-source change):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
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
  childRunId,
  sourceMergeSha,
  sourceRunId,
  leaseNoopId,
  approvedSnapshotId,
  jobId,
  imageTag,
  reportSha,
  envelopeSha,
  outputManifestSha,
  qaSha,
  manifestSha,
  '#577 open_draft_blocked_excluded',
  'external_agent_approved_snapshot_job_execution_passed',
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
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1'] !==
  'node scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1.mjs'
) {
  fail('missing approved snapshot job execution package script')
}
if (
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1:diagnostics'] !==
  'node scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs'
) {
  fail('missing approved snapshot job execution diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_worker_lease_noop') {
  fail('source decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.runId !== sourceRunId) fail('source run ID mismatch')
if (sourceRecord.workerLeaseNoop?.leaseNoopId !== leaseNoopId) fail('source lease no-op ID mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceWorkerLeaseNoop?.mergeSha !== sourceMergeSha) fail('source merge SHA mismatch')
if (record.sourceWorkerLeaseNoop?.runId !== sourceRunId) fail('source run ID mismatch')
if (record.sourceWorkerLeaseNoop?.leaseNoopId !== leaseNoopId) fail('lease no-op ID mismatch')
if (record.sourceWorkerLeaseNoop?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.approvedSnapshotJobExecution?.approvedSnapshotId !== approvedSnapshotId) fail('approved snapshot ID mismatch')
if (record.approvedSnapshotJobExecution?.jobId !== jobId) fail('job ID mismatch')
if (record.approvedSnapshotJobExecution?.childRunId !== childRunId) fail('child run ID mismatch')
if (record.approvedSnapshotJobExecution?.dockerImageTag !== imageTag) fail('image tag mismatch')
if (record.approvedSnapshotJobExecution?.dockerNetwork !== 'none') fail('docker network mismatch')
if (record.approvedSnapshotJobExecution?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') {
  fail('GStreamer execution status mismatch')
}
if (record.approvedSnapshotJobExecution?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') {
  fail('MKVToolNix execution status mismatch')
}
if (record.approvedSnapshotJobExecution?.gpacMp4boxExecution !== 'not_run_excluded_pending_package_source_install_proof') {
  fail('GPAC exclusion mismatch')
}
const expectedCommands = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]
for (const templateId of expectedCommands) {
  if (!record.commandResults?.includes(templateId)) fail(`missing command result: ${templateId}`)
}
const expectedArtifacts = [
  ['gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-report.json', 7124, reportSha],
  ['approved-snapshot-runtime-envelope.json', 2287, envelopeSha],
  ['output-manifest.json', 813, outputManifestSha],
  ['qa-report.json', 837, qaSha],
  ['gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-manifest.json', 1496, manifestSha],
]
for (const [fileName, bytes, sha256] of expectedArtifacts) {
  if (!record.artifacts?.some((artifact) => artifact.fileName === fileName && artifact.bytes === bytes && artifact.sha256 === sha256)) {
    fail(`artifact evidence mismatch: ${fileName}`)
  }
}
if (
  record.readiness?.gstreamer_render_pipeline_support !== 'external_agent_approved_snapshot_job_execution_passed' ||
  record.readiness?.mkvtoolnix_container_validation !== 'external_agent_approved_snapshot_job_execution_passed'
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
      childRunId,
      approvedSnapshotId,
      jobId,
      readiness: {
        gstreamer_render_pipeline_support: 'external_agent_approved_snapshot_job_execution_passed',
        mkvtoolnix_container_validation: 'external_agent_approved_snapshot_job_execution_passed',
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
