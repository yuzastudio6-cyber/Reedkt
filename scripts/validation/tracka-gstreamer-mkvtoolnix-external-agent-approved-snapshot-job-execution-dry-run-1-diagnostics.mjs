#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-DRY-RUN-1'
const decision = 'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_job_execution_dry_run'
const execution =
  'completed_confirmation_gated_approved_snapshot_job_execution_envelope_validation_no_queue_write_worker_tool_media_execution'
const confirmGate =
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN=true'
const nextMilestone = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-ROUTE-DRY-RUN-1'
const dir = 'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1'
const recordPath =
  `${dir}/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1-record.json`
const sourceQaRecordPath =
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1-record.json'
const activationPath =
  'docs/activation-phase-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1-results.md'
const nextPromptPath =
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-route-dry-run-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const runId = '2026-07-03T03-00-07-116Z-cf848654'
const outputDir =
  `/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1/${runId}`
const sourceMergeSha = 'ec23c913705b58f5124e8d7a4bebee08c1b47ee0'
const sourceHeadSha = '12a99b6b9ac169d5351dd5e1fe5a09a8a22b67d2'
const sourceExecutionRunId = '2026-07-03T02-41-43-899Z-665590e9'
const sourceQaDecision = 'qa_passed_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution_evidence'
const idempotencyKey = '9462c9809eb45806596dbe914d83cffc1ddf4041973b6605682f53b4940c0bf3'
const approvedSnapshotId = 'approved-snapshot-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1'
const jobId = 'job-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1'
const reportSha = '5c0175407e8717658093e4ce9303d90dc2d738e10fd6cb352072b132b57aa380'
const manifestSha = '2f3099ba483e3c22f1d108a06a7e677e135d19294f995e08e47c3108699f9b28'

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/job-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'server/services/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1.ts',
  'server/cli/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1.ts',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1-diagnostics.mjs',
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
  /\b(?:Persistent job queue write|Route execution|Real worker dispatch|Worker process start|Worker execution|Worker lease claim|Tool execution|GStreamer execution|MKVToolNix execution|GPAC\/MP4Box execution|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Secret payload access|Signed URL creation|Public artifact creation|Provider\/model call|Credit mutation|Deployment|Internal beta unlock|External beta expansion|Production unlock|Final render\/export|Package installation|Dependency mutation|Package-lock mutation|Dockerfile install-source change|Requirements install-source change):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"realWorkerDispatch"\s*:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
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
  sourceExecutionRunId,
  sourceQaDecision,
  approvedSnapshotId,
  jobId,
  idempotencyKey,
  reportSha,
  manifestSha,
  '#577 open_draft_blocked_excluded',
  'ready_for_approved_snapshot_job_route_dry_run',
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

for (const file of [...packetFiles, ...implementationFiles, sourceQaRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1'] !==
  'tsx server/cli/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1.ts'
) {
  fail('missing approved-snapshot job dry-run package script')
}
if (
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1:diagnostics'] !==
  'node scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1-diagnostics.mjs'
) {
  fail('missing approved-snapshot job dry-run diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceQaRecord = json(sourceQaRecordPath)
if (sourceQaRecord.decision !== sourceQaDecision) fail('source QA decision mismatch')
if (sourceQaRecord.nextMilestone !== packet) fail('source QA next milestone mismatch')
if (sourceQaRecord.sourceChain?.executionRunId !== sourceExecutionRunId) fail('source execution run ID mismatch')
if (sourceQaRecord.readiness?.gstreamer_render_pipeline_support !== 'ready_for_external_agent_generated_fixture_post_qa_execution_lane') {
  fail('source GStreamer readiness mismatch')
}
if (sourceQaRecord.readiness?.mkvtoolnix_container_validation !== 'ready_for_external_agent_generated_fixture_post_qa_execution_lane') {
  fail('source MKVToolNix readiness mismatch')
}
if (sourceQaRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceQaRollup?.mergeSha !== sourceMergeSha) fail('source merge SHA mismatch')
if (record.sourceQaRollup?.headSha !== sourceHeadSha) fail('source head SHA mismatch')
if (record.sourceQaRollup?.executionRunId !== sourceExecutionRunId) fail('source execution run ID mismatch')
if (record.sourceQaRollup?.qaDecision !== sourceQaDecision) fail('source QA decision mismatch')
if (record.sourceQaRollup?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.approvedSnapshotJobExecutionDryRun?.approvedSnapshotId !== approvedSnapshotId) fail('approved snapshot ID mismatch')
if (record.approvedSnapshotJobExecutionDryRun?.approvedSnapshotStatus !== 'approved') fail('approved snapshot status mismatch')
if (record.approvedSnapshotJobExecutionDryRun?.approvedSnapshotSourceClass !== 'controlled_generated_fixture_only') {
  fail('approved snapshot source class mismatch')
}
if (record.approvedSnapshotJobExecutionDryRun?.jobId !== jobId) fail('job ID mismatch')
if (record.approvedSnapshotJobExecutionDryRun?.jobType !== 'gstreamer_mkvtoolnix_external_agent_generated_fixture') {
  fail('job type mismatch')
}
if (record.approvedSnapshotJobExecutionDryRun?.jobExecutionMode !== 'metadata_only_dry_run_no_queue_write_no_worker_execution') {
  fail('job execution mode mismatch')
}
if (record.approvedSnapshotJobExecutionDryRun?.idempotencyKey !== idempotencyKey) fail('idempotency key mismatch')
for (const statusField of [
  'payloadShapeValidation',
  'qaEvidenceValidation',
  'idempotencyKeyValidation',
  'artifactManifestReferenceValidation',
  'cleanupPolicyValidation',
]) {
  if (record.approvedSnapshotJobExecutionDryRun?.[statusField] !== 'passed') fail(`${statusField} mismatch`)
}
for (const falseField of [
  'persistentJobQueueWrite',
  'routeExecution',
  'realWorkerDispatch',
  'workerProcessStart',
  'workerExecution',
  'workerLeaseClaim',
  'toolExecution',
]) {
  if (record.approvedSnapshotJobExecutionDryRun?.[falseField] !== false) fail(`${falseField} must be false`)
}
const expectedCommands = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]
for (const templateId of expectedCommands) {
  if (!record.approvedSnapshotJobExecutionDryRun?.commandTemplates?.includes(templateId)) {
    fail(`missing command template: ${templateId}`)
  }
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-report.json' && artifact.bytes === 4241 && artifact.sha256 === reportSha)) {
  fail('report artifact evidence mismatch')
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-manifest.json' && artifact.bytes === 1330 && artifact.sha256 === manifestSha)) {
  fail('manifest artifact evidence mismatch')
}
if (
  record.readiness?.gstreamer_render_pipeline_support !== 'ready_for_approved_snapshot_job_route_dry_run' ||
  record.readiness?.mkvtoolnix_container_validation !== 'ready_for_approved_snapshot_job_route_dry_run'
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
      approvedSnapshotId,
      jobId,
      idempotencyKey,
      readiness: {
        gstreamer_render_pipeline_support: 'ready_for_approved_snapshot_job_route_dry_run',
        mkvtoolnix_container_validation: 'ready_for_approved_snapshot_job_route_dry_run',
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
