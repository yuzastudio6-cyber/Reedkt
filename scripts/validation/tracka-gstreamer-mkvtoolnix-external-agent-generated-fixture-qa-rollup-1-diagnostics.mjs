#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-GENERATED-FIXTURE-QA-ROLLUP-1'
const decision = 'qa_passed_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution_evidence'
const execution = 'completed_docs_only_gstreamer_mkvtoolnix_execution_qa_no_new_runtime_execution'
const acceptance = 'qa_passed_external_agent_generated_fixture_execution_evidence'
const nextMilestone = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-DRY-RUN-1'
const dir = 'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1'
const recordPath = `${dir}/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1-record.json`
const executionRecordPath =
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-record.json'
const activationPath = 'docs/activation-phase-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1-results.md'
const nextPromptPath =
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-dry-run-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const executionMergeSha = '900db68dc6c1feffc272ab35874d9140556b9300'
const executionRunId = '2026-07-03T02-41-43-899Z-665590e9'
const childRunId = '2026-07-03T02-41-43-966Z-3daa5b9d'
const guardedRuntimeRunId = '2026-07-03T02-41-44-030Z-5c8e826a'
const sourceWorkerProcessMergeSha = '4f5d526e27973ca130d12139a586e2c2a997458f'
const reportSha = 'd5c5af00bd16619f2a92e7586e3309eaa4320caee69f85b1cb3cb4223805a6aa'
const manifestSha = '71392b0eb2176048b67f661264df13e717664731c9c7d43156816867b21d7307'

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-review.md`,
  `${dir}/tool-readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1-diagnostics.mjs',
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
  /\bexternal beta unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\binternal beta unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Route execution|Real worker dispatch|Worker process start|Worker execution|Worker lease claim|Persistent job queue write|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Private media processing|User media processing|Final render\/export|GPAC\/MP4Box execution):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer execution in this QA phase|MKVToolNix execution in this QA phase|Docker execution in this QA phase|FFmpeg\/FFprobe execution in this QA phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"newRuntimeExecutionInThisQaPhase"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  acceptance,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  executionMergeSha,
  executionRunId,
  childRunId,
  guardedRuntimeRunId,
  sourceWorkerProcessMergeSha,
  reportSha,
  manifestSha,
  '#577 open_draft_blocked_excluded',
  'ready_for_external_agent_generated_fixture_post_qa_execution_lane',
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

for (const file of [...packetFiles, ...implementationFiles, executionRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing QA rollup diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(executionRecordPath)
if (sourceRecord.decision !== 'completed_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution') {
  fail('source execution decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source execution next milestone mismatch')
if (sourceRecord.sourceChain?.workerProcessNoopMergeSha !== sourceWorkerProcessMergeSha) {
  fail('source worker-process merge mismatch')
}
if (sourceRecord.runId !== executionRunId) fail('source execution run ID mismatch')
if (sourceRecord.sourceChain?.childRunId !== childRunId) fail('source child run ID mismatch')
if (sourceRecord.sourceChain?.guardedRuntimeRunId !== guardedRuntimeRunId) {
  fail('source guarded runtime run ID mismatch')
}
if (sourceRecord.readiness?.gstreamer !== 'ready_for_external_agent_generated_fixture_qa_rollup') {
  fail('source GStreamer readiness mismatch')
}
if (sourceRecord.readiness?.mkvtoolnix !== 'ready_for_external_agent_generated_fixture_qa_rollup') {
  fail('source MKVToolNix readiness mismatch')
}
if (sourceRecord.readiness?.gpacMp4box !== 'blocked_pending_package_source_install_proof') {
  fail('source GPAC readiness mismatch')
}
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.sourceChain?.executionMergeSha !== executionMergeSha) fail('execution merge SHA mismatch')
if (record.sourceChain?.executionRunId !== executionRunId) fail('execution run ID mismatch')
if (record.sourceChain?.childRunId !== childRunId) fail('child run ID mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== guardedRuntimeRunId) fail('guarded runtime run ID mismatch')
if (record.sourceChain?.workerProcessNoopMergeSha !== sourceWorkerProcessMergeSha) {
  fail('worker process merge SHA mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.qa?.acceptance !== acceptance) fail('QA acceptance mismatch')
if (record.qa?.sourceEvidenceReviewOnly !== true) fail('source-evidence-only flag mismatch')
if (record.qa?.newRuntimeExecutionInThisQaPhase !== false) fail('new runtime execution flag mismatch')
for (const field of ['privateMediaProcessing', 'userMediaProcessing', 'publicArtifacts', 'signedUrls', 'finalRenderExport']) {
  if (record.qa?.[field] !== false) fail(`QA blocked flag mismatch: ${field}`)
}
const expectedCommands = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]
for (const templateId of expectedCommands) {
  const item = record.commandEvidence?.find((entry) => entry.templateId === templateId)
  if (!item || item.result !== 'passed') fail(`command evidence mismatch: ${templateId}`)
}
if (!record.artifactEvidence?.some((artifact) => artifact.fileName === 'gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-report.json' && artifact.bytes === 8023 && artifact.sha256 === reportSha)) {
  fail('report artifact evidence mismatch')
}
if (!record.artifactEvidence?.some((artifact) => artifact.fileName === 'gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-manifest.json' && artifact.bytes === 1464 && artifact.sha256 === manifestSha)) {
  fail('manifest artifact evidence mismatch')
}
if (
  record.readiness?.gstreamer_render_pipeline_support !==
  'ready_for_external_agent_generated_fixture_post_qa_execution_lane'
) {
  fail('GStreamer readiness mismatch')
}
if (
  record.readiness?.mkvtoolnix_container_validation !==
  'ready_for_external_agent_generated_fixture_post_qa_execution_lane'
) {
  fail('MKVToolNix readiness mismatch')
}
if (record.readiness?.gpac_mp4box_packaging_validation !== 'blocked_pending_package_source_install_proof') {
  fail('GPAC readiness mismatch')
}
for (const [key, value] of Object.entries(record.blockedScope ?? {})) {
  if (value !== true) fail(`blocked scope must stay true: ${key}`)
}
if (record.validation !== 'pending_local_validation' && record.validation !== 'passed') fail('validation status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
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
      acceptance,
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
      nextMilestone,
    },
    null,
    2,
  ),
)
