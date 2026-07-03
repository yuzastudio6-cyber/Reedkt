#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-GENERATED-FIXTURE-EXECUTION-1'
const decision = 'completed_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution'
const execution = 'completed_confirmation_gated_external_agent_generated_fixture_execution_for_gstreamer_mkvtoolnix_only'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_GENERATED_FIXTURE_EXECUTION=true'
const nextMilestone = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-GENERATED-FIXTURE-QA-ROLLUP-1'
const dir = 'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1'
const recordPath = `${dir}/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-record.json`
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-worker-process-noop-invoke-1/tracka-three-tool-external-agent-worker-process-noop-invoke-1-record.json'
const activationPath =
  'docs/activation-phase-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-results.md'
const promptPath =
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const runId = '2026-07-03T02-41-43-899Z-665590e9'
const outputDir = `/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1/${runId}`
const sourceMergeSha = '4f5d526e27973ca130d12139a586e2c2a997458f'
const sourceRunId = '2026-07-03T01-56-20-543Z-b12b79bf'
const childRunId = '2026-07-03T02-41-43-966Z-3daa5b9d'
const guardedRunId = '2026-07-03T02-41-44-030Z-5c8e826a'
const imageTag = 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8'
const reportSha = 'd5c5af00bd16619f2a92e7586e3309eaa4320caee69f85b1cb3cb4223805a6aa'
const manifestSha = '71392b0eb2176048b67f661264df13e717664731c9c7d43156816867b21d7307'

const requiredFiles = [
  `${dir}/source-chain.md`,
  `${dir}/execution-result.md`,
  `${dir}/command-matrix.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  promptPath,
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-noop-invoke-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
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
const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Route execution|Real worker dispatch|Worker process start|Worker execution|Worker lease claim|Persistent job queue write|Private media processing|User media processing|FFmpeg\/FFprobe execution|GPAC\/MP4Box execution|Supabase mutation|SQL execution|Secret payload access|Signed URL creation|Public artifact creation|Provider\/model call|Credit mutation|Stripe checkout\/webhook\/payment processing|Deployment|Internal beta unlock|External beta expansion|Production unlock|Final render\/export|Package installation|Dependency mutation|Package-lock mutation|Dockerfile install-source change|Requirements install-source change)\s*:\s*`?(true|enabled|completed|run|executed|passed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"realWorkerDispatch"\s*:\s*true/i,
  /"workerProcessStarted"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  confirmGate,
  nextMilestone,
  runId,
  outputDir,
  sourceMergeSha,
  sourceRunId,
  childRunId,
  guardedRunId,
  imageTag,
  reportSha,
  manifestSha,
  'completed_local_image_only_network_disabled_no_push_no_deploy',
  'completed_controlled_generated_fixture_only',
  'generated_srt_fixture_only',
  'generated_subtitle_only_mkv_fixture',
  'not_run_excluded_pending_package_source_install_proof',
  'ready_for_external_agent_generated_fixture_qa_rollup',
  'blocked_pending_package_source_install_proof',
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

for (const file of [...requiredFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1'] !==
  'node scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1.mjs'
) {
  fail('missing generated-fixture execution package script')
}
if (
  packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1:diagnostics'] !==
  'node scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-diagnostics.mjs'
) {
  fail('missing generated-fixture execution diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in generated-fixture corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_worker_process_noop_invoke') {
  fail('source worker-process no-op decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.runId !== sourceRunId) fail('source run ID mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceChain?.workerProcessNoopMergeSha !== sourceMergeSha) fail('source merge SHA mismatch')
if (record.sourceChain?.workerProcessNoopRunId !== sourceRunId) fail('source run ID mismatch')
if (record.sourceChain?.childRunId !== childRunId) fail('child run ID mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== guardedRunId) fail('guarded runtime run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.imageTag !== imageTag) fail('image tag mismatch')
if (record.dockerNetwork !== 'none') fail('docker network mismatch')
if (record.runtimeExecution?.dockerExecution !== 'completed_local_image_only_network_disabled_no_push_no_deploy') {
  fail('docker execution status mismatch')
}
if (record.runtimeExecution?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') {
  fail('GStreamer execution status mismatch')
}
if (record.runtimeExecution?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') {
  fail('MKVToolNix execution status mismatch')
}
if (record.runtimeExecution?.gpacMp4boxExecution !== 'not_run_excluded_pending_package_source_install_proof') {
  fail('GPAC execution exclusion mismatch')
}
for (const field of [
  'routeExecution',
  'workerDispatch',
  'workerProcessStarted',
  'workerExecution',
  'workerLeaseClaim',
  'persistentJobQueueWrite',
]) {
  if (record.runtimeExecution?.[field] !== 'not_run_runtime_runner_only') fail(`runtime non-execution status mismatch: ${field}`)
}
if (record.runtimeExecution?.privateMediaProcessing !== false) fail('private media must remain false')
if (record.runtimeExecution?.userMediaProcessing !== false) fail('user media must remain false')
const expectedTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]
for (const templateId of expectedTemplates) {
  const result = record.commandResults?.find((entry) => entry.templateId === templateId)
  if (!result || result.ok !== true || result.exitStatus !== 0) fail(`missing passed command result: ${templateId}`)
}
if (record.readiness?.gstreamer !== 'ready_for_external_agent_generated_fixture_qa_rollup') {
  fail('GStreamer readiness mismatch')
}
if (record.readiness?.mkvtoolnix !== 'ready_for_external_agent_generated_fixture_qa_rollup') {
  fail('MKVToolNix readiness mismatch')
}
if (record.readiness?.gpacMp4box !== 'blocked_pending_package_source_install_proof') {
  fail('GPAC readiness mismatch')
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-report.json' && artifact.bytes === 8023 && artifact.sha256 === reportSha)) {
  fail('report artifact evidence mismatch')
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-manifest.json' && artifact.bytes === 1464 && artifact.sha256 === manifestSha)) {
  fail('manifest artifact evidence mismatch')
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')
gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed or untracked file: ${file}`)
  if (blockedChangedPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed file: ${file}`)
}

for (const file of changedFiles.filter((name) => fs.existsSync(name) && fs.statSync(name).isFile())) {
  const text = read(file)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim matched in changed file ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
