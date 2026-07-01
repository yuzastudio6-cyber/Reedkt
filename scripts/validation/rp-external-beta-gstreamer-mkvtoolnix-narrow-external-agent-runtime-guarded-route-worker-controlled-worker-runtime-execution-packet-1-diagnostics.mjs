#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-record.json`
const dispatchRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-record.json'
const queueRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-record.json'
const decision =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only'
const execution =
  'completed_confirmation_gated_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch'
const integrationBase = 'aa2627a18540828d7a391e569d8f21b70eb2d58f'
const runId = '2026-07-01T20-56-05-033Z-b0ec74d8'
const guardedRunId = '2026-07-01T20-56-05-092Z-9330089b'
const dispatchRunId = '2026-07-01T20-04-10-357Z-0b18d0c3'
const queueRunId = '2026-07-01T19-06-40-470Z-35b9b73b'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-QA-ROLLUP-1'
const readyStatus = 'ready_for_guarded_narrow_route_worker_runtime_qa_rollup'
const confirmEnv =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_CONTROLLED_WORKER_RUNTIME_EXECUTION=true'
const guardedConfirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_EXECUTION=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-runtime-execution-packet-result.md`,
  `${dir}/runtime-packet-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-diagnostics.mjs',
  'package.json',
]

const qaRollupDir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1'
const qaRollupFiles = [
  `${qaRollupDir}/source-audit.md`,
  `${qaRollupDir}/evidence-matrix.md`,
  `${qaRollupDir}/qa-decision.md`,
  `${qaRollupDir}/readiness.md`,
  `${qaRollupDir}/safety-boundary.md`,
  `${qaRollupDir}/validation-results.md`,
  `${qaRollupDir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...qaRollupFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  `Run ID: \`${runId}\``,
  `Guarded runtime run ID: \`${guardedRunId}\``,
  confirmEnv,
  guardedConfirmEnv,
  'completed_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only',
  'completed_controlled_generated_fixture_only',
  'controlled_generated_fixture_only',
  'completed_local_image_only_network_disabled_no_push_no_deploy',
  'runner_invoked_guarded_runtime_no_route_dispatch',
  'generated_srt_and_generated_subtitle_only_mkv_fixture',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'runtime-packet-gstreamer-mkvtoolnix-narrow-controlled-worker-1',
  'runtime-execution-gstreamer-mkvtoolnix-narrow-controlled-worker-1',
  'mock-job-runtime-queue-item-0001',
  'lease-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
  'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  'Docker network: `none`',
  'Route execution: `not_run_narrow_runtime_packet_runner_only`',
  'Worker dispatch: `not_run_narrow_runtime_packet_runner_only`',
  'Worker execution: `not_run_narrow_runtime_packet_runner_only`',
  'Worker process start: `not_run_narrow_runtime_packet_runner_only`',
  'Worker lease claim: `not_run_narrow_runtime_packet_runner_only`',
  'Persistent job queue write: `not_run_narrow_runtime_packet_runner_only`',
  'Private media processing: `false`',
  'User media processing: `false`',
  'FFmpeg/FFprobe execution: `false`',
  'Docker push/deploy: `false`',
  'Supabase mutation: `false`',
  'SQL execution: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Final render/export: `false`',
  'narrow-controlled-worker-runtime-packet-envelope.json',
  'narrow-controlled-worker-runtime-output-manifest.json',
  'narrow-controlled-worker-runtime-qa-report.json',
  'narrow-controlled-worker-runtime-execution-packet-report.json',
  'narrow-controlled-worker-runtime-execution-packet-manifest.json',
  '0efe96d011b860a9477157883363814b4e417cddd6894110af3b7b091a2bc97a',
  '238a8b9ff5a04d4e3735114917876963697a8818798f58081f03949c83f5300a',
  'f46b27090bd493bd450cdae8312a7f9a03536efa38d1567b757bba2aa6ba939d',
  '4a79c11f3f391753c72941a672dcda9e8a0e72e32020a52f03c661d0e1f1567d',
  '452986a7673704bf3af3adfdb97fe6978b3a999ab9f94aad958c9c8b05f7ae07',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-smoke\.ts$)/,
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
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Route execution in this runtime packet|Worker dispatch in this runtime packet|Worker execution in this runtime packet|Worker process start in this runtime packet|Worker lease claim in this runtime packet|Persistent job queue write in this runtime packet|Private media processing in this runtime packet|User media processing in this runtime packet|FFmpeg\/FFprobe execution in this runtime packet|Docker push\/deploy in this runtime packet|Remotion execution in this runtime packet|Supabase mutation in this runtime packet|SQL execution in this runtime packet|Signed URL creation in this runtime packet|Public artifact creation in this runtime packet|Final render\/export in this runtime packet|Broad external beta unlock in this runtime packet|Paid production unlock in this runtime packet|Production unlock in this runtime packet):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"externalBetaExpansion"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles, dispatchRecordPath, queueRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-smoke.ts'
) fail('missing narrow controlled worker runtime execution packet smoke package script')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1'
  ] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1.ts'
) fail('missing narrow controlled worker runtime execution packet runner package script')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-diagnostics.mjs'
) fail('missing narrow controlled worker runtime execution packet diagnostics package script')

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const queueRecord = json(queueRecordPath)
if (queueRecord.decision !== 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_queue_integration_metadata_only') {
  fail('queue source decision mismatch')
}
if (queueRecord.runId !== queueRunId) fail('queue source run ID mismatch')
if (queueRecord.productReadyEndToEndLocalOssTools !== 0) fail('queue source product-ready count mismatch')

const dispatchRecord = json(dispatchRecordPath)
if (dispatchRecord.decision !== 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_dispatch_dry_run_metadata_only') {
  fail('dispatch source decision mismatch')
}
if (dispatchRecord.integrationBase !== 'c40b7f9165230bc575bd53823398941d44d48b97') fail('dispatch source integration base mismatch')
if (dispatchRecord.runId !== dispatchRunId) fail('dispatch source run ID mismatch')
if (dispatchRecord.workerDispatchDryRun?.nextSourceStatus !== 'ready_for_guarded_narrow_route_worker_runtime_execution_packet') {
  fail('dispatch source next status mismatch')
}
if (dispatchRecord.productReadyEndToEndLocalOssTools !== 0) fail('dispatch source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.narrowControlledWorkerDispatchDryRunPr !== 2036) fail('dispatch PR mismatch')
if (record.sourceChain?.narrowControlledWorkerDispatchDryRunMergeSha !== integrationBase) fail('dispatch merge SHA mismatch')
if (record.sourceChain?.narrowControlledWorkerDispatchDryRunRunId !== dispatchRunId) fail('dispatch run ID mismatch')
if (record.sourceChain?.narrowControlledWorkerQueuePr !== 2028) fail('queue PR mismatch')
if (record.sourceChain?.narrowControlledWorkerQueueMergeSha !== 'c40b7f9165230bc575bd53823398941d44d48b97') fail('queue merge SHA mismatch')
if (record.sourceChain?.narrowControlledWorkerQueueRunId !== queueRunId) fail('queue run ID mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== guardedRunId) fail('guarded runtime run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')

const packetResult = record.workerRuntimeExecutionPacket ?? {}
if (packetResult.status !== 'completed_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only') fail('runtime status mismatch')
if (packetResult.confirmationGate !== confirmEnv) fail('confirmation gate mismatch')
if (packetResult.guardedRuntimeConfirmationGate !== guardedConfirmEnv) fail('guarded confirmation gate mismatch')
if (packetResult.runtimeExecutionMode !== 'controlled_generated_fixture_runtime_execution') fail('runtime mode mismatch')
if (packetResult.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture') fail('fixture scope mismatch')
if (packetResult.workerRuntimeMode !== 'runner_invoked_guarded_runtime_no_route_dispatch') fail('worker runtime mode mismatch')
if (packetResult.runtimePacketAccepted !== true) fail('runtime packet accepted mismatch')
if (packetResult.dockerNetwork !== 'none') fail('docker network mismatch')
if (packetResult.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer status mismatch')
if (packetResult.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix status mismatch')
if (packetResult.mediaProcessing !== 'controlled_generated_fixture_only') fail('media processing status mismatch')
if (packetResult.nextSourceStatus !== readyStatus) fail('next source status mismatch')
for (const key of [
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseClaim',
  'persistentJobQueueWrite',
]) {
  if (packetResult[key] !== 'not_run_narrow_runtime_packet_runner_only') fail(`${key} mismatch`)
}
for (const key of ['privateMediaProcessing', 'userMediaProcessing']) {
  if (packetResult[key] !== false) fail(`${key} mismatch`)
}

const expectedCommands = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]
const observedCommands = (record.commandResults ?? []).map((result) => result.templateId)
if (observedCommands.length !== expectedCommands.length) fail('command result count mismatch')
for (const command of expectedCommands) {
  if (!observedCommands.includes(command)) fail(`missing command result: ${command}`)
}
for (const result of record.commandResults ?? []) {
  if (result.ok !== true || result.exitStatus !== 0) fail(`command did not pass: ${result.templateId}`)
}

const expectedArtifacts = {
  envelope: ['narrow-controlled-worker-runtime-packet-envelope.json', 10158, '0efe96d011b860a9477157883363814b4e417cddd6894110af3b7b091a2bc97a'],
  outputManifest: ['narrow-controlled-worker-runtime-output-manifest.json', 610, '238a8b9ff5a04d4e3735114917876963697a8818798f58081f03949c83f5300a'],
  qaReport: ['narrow-controlled-worker-runtime-qa-report.json', 815, 'f46b27090bd493bd450cdae8312a7f9a03536efa38d1567b757bba2aa6ba939d'],
  report: ['narrow-controlled-worker-runtime-execution-packet-report.json', 9967, '4a79c11f3f391753c72941a672dcda9e8a0e72e32020a52f03c661d0e1f1567d'],
  manifest: ['narrow-controlled-worker-runtime-execution-packet-manifest.json', 2758, '452986a7673704bf3af3adfdb97fe6978b3a999ab9f94aad958c9c8b05f7ae07'],
}
for (const [key, [fileName, bytes, sha256]] of Object.entries(expectedArtifacts)) {
  if (record.artifacts?.[key]?.fileName !== fileName) fail(`${key} artifact file mismatch`)
  if (record.artifacts?.[key]?.bytes !== bytes) fail(`${key} artifact byte count mismatch`)
  if (record.artifacts?.[key]?.sha256 !== sha256) fail(`${key} artifact checksum mismatch`)
}

const expectedSafety = {
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  workerProcessStart: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  gstreamerExecution: 'completed_controlled_generated_fixture_only',
  mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
  mediaProcessing: 'controlled_generated_fixture_only',
  privateMediaProcessing: false,
  userMediaProcessing: false,
  ffmpegFfprobeExecution: false,
  dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy',
  dockerPushDeploy: false,
  remotionExecution: false,
  supabaseMutation: false,
  sqlExecution: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  finalRenderExport: false,
  externalBetaExpansion: false,
  paidProductionUnlock: false,
  productionUnlock: false,
}
for (const [key, value] of Object.entries(expectedSafety)) {
  if (record.safety?.[key] !== value) fail(`safety mismatch: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const service = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1.ts')
for (const text of [
  'blocked_missing_narrow_controlled_worker_runtime_execution_confirmation',
  'blocked_narrow_controlled_worker_dispatch_dry_run_validation_failed',
  'blocked_guarded_runtime_execution_result_failed',
  'blocked_unapproved_narrow_runtime_execution_scope',
  'blocked_runtime_execution_not_enabled',
  'runner_invoked_guarded_runtime_no_route_dispatch',
  'controlled_generated_fixture_runtime_execution',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'workerLeaseClaim: false',
  "gstreamerExecution: 'completed_controlled_generated_fixture_only'",
  "mkvtoolnixExecution: 'completed_controlled_generated_fixture_only'",
  "dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy'",
]) {
  if (!service.includes(text)) fail(`missing service guard text: ${text}`)
}
for (const pattern of [/createClient\s*\(/, /SERVICE_ROLE_KEY|service_role_key|service-role-key/i, /docker\s+(build|run|push|deploy)/i]) {
  if (pattern.test(service)) fail(`forbidden service pattern: ${pattern}`)
}

for (const file of ['package-lock.json']) {
  if (gitLines(['diff', '--name-only', '--', file]).length) fail(`${file} must be unchanged`)
  if (gitLines(['diff', '--cached', '--name-only', '--', file]).length) fail(`${file} must not be staged`)
}

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChanged = [...new Set(changedFiles)].sort()
for (const file of uniqueChanged) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
}
for (const file of uniqueChanged.filter((candidate) => fs.existsSync(candidate))) {
  const text = read(file)
  const isValidator = /^scripts\/validation\//.test(file)
  if (!isValidator) {
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim matched in changed file ${file}: ${pattern}`)
    }
  }
}

try {
  execFileSync('git', ['diff', '--check'], { env: gitEnv, stdio: 'pipe' })
  execFileSync('git', ['diff', '--cached', '--check'], { env: gitEnv, stdio: 'pipe' })
} catch {
  fail('git diff check failed')
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  validation: record.validation,
  changedFiles: uniqueChanged,
  nextMilestone,
}, null, 2))
