#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PACKET-2'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-record.json`
const handoffRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1/gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1-record.json'
const dispatchRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only'
const execution =
  'completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch'
const integrationBase = '97ee8b7fa9d161ad781effdfa5d1ff8c2ea308df'
const runId = '2026-07-01T04-29-30-784Z-d39bdd98'
const guardedRuntimeRunId = '2026-07-01T04-29-30-842Z-7cc784a7'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-QA-ROLLUP-2'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/runtime-execution-result.md`,
  `${dir}/runtime-packet-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2.md',
]

const followOnRuntimeQaRollup2Files = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2/qa-rollup.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-diagnostics.mjs',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  handoffRecordPath,
  dispatchRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...followOnRuntimeQaRollup2Files, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runId,
  guardedRuntimeRunId,
  gate,
  'accepted_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
  'runtime-packet-gstreamer-mkvtoolnix-post-dispatch-worker-2',
  'runtime-execution-gstreamer-mkvtoolnix-post-dispatch-worker-2',
  'mock-job-runtime-queue-item-0001',
  'completed_guarded_local_mock_worker_dispatch_metadata_envelope',
  'accepted_guarded_local_mock_worker_dispatch_metadata_only',
  'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'GStreamer execution: `completed_controlled_generated_fixture_only`',
  'MKVToolNix execution: `completed_controlled_generated_fixture_only`',
  'Media processing: `controlled_generated_fixture_only`',
  'Route execution: `false`',
  'Real worker dispatch: `false`',
  'Worker process started: `false`',
  'Worker execution: `false`',
  'Worker lease claim: `false`',
  'Persistent job queue write: `false`',
  'Private media processing: `false`',
  'User media processing: `false`',
  'FFmpeg/FFprobe execution: `false`',
  'Docker push/deploy: `false`',
  'Supabase mutation: `false`',
  'SQL execution: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Final render/export: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '9bcc735b7813d49e04ceb46fe3aaa342cc3b43e55d98449d254e109169ba3089',
  'f93dfa659d83ff86f2a537540c358dab1e1cc30bcbe5cb842fda3af35d8bbe77',
  '02abb9f9c853c1b374e1d76fe3bf8cc10ab12e02c327a3b873d3ca7f1387a477',
  '8a9252935c70fc2a2d127e7008e944b0d8e27477af63b25b98487d4060bd50d2',
  'b7ac00c9ad0089091f461fa6536b091cfce405f94e1625d18678d223c795a640',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Route execution|Real worker dispatch|Worker process started|Worker execution|Worker lease claim|Persistent job queue write|Private media processing|User media processing|FFmpeg\/FFprobe execution|Docker push\/deploy|Remotion execution|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export|Broad external beta unlock|Paid production unlock|Production unlock):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"realWorkerDispatch"\s*:\s*true/i,
  /"workerProcessStarted"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"dockerPushDeploy"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"broadExternalBetaUnlock"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
  /"dependencyMutation"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles, ...sourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs'
) {
  fail('missing guarded worker runtime execution packet 2 package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-diagnostics.mjs'
) {
  fail('missing guarded worker runtime execution packet 2 diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.confirmationGate?.env !== gate) fail('confirmation gate env mismatch')
if (record.confirmationGate?.observed !== 'present_true') fail('confirmation gate observed mismatch')
if (record.sourceChain?.runtimeHandoffMergeSha !== integrationBase) fail('runtime handoff merge mismatch')
if (record.sourceChain?.runtimeHandoffDecision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_handoff_ready_for_post_dispatch_runtime_execution_packet') fail('runtime handoff decision mismatch')
if (record.sourceChain?.workerDispatchExecutionPacketPr !== 1949) fail('worker-dispatch PR mismatch')
if (record.sourceChain?.workerDispatchExecutionPacketRunId !== '2026-07-01T02-06-35-344Z-8210a119') fail('worker-dispatch run ID mismatch')
if (record.sourceChain?.localMockQueueItem !== 'mock-job-runtime-queue-item-0001') fail('local mock queue item mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.guardedRuntime?.runId !== guardedRuntimeRunId) fail('guarded runtime run ID mismatch')
if (record.guardedRuntime?.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture') fail('guarded runtime decision mismatch')
if (record.guardedRuntime?.execution !== 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only') fail('guarded runtime execution mismatch')
if (!Array.isArray(record.guardedRuntime?.commandResults) || record.guardedRuntime.commandResults.length !== 4) fail('command result count mismatch')
for (const template of [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]) {
  const result = record.guardedRuntime.commandResults.find((item) => item.templateId === template)
  if (!result || result.ok !== true || result.exitStatus !== 0) fail(`command result mismatch: ${template}`)
}
if (record.postDispatchRuntimePacket?.status !== 'accepted_post_dispatch_worker_runtime_execution_packet_generated_fixture_only') fail('runtime packet status mismatch')
if (record.postDispatchRuntimePacket?.runtimePacketAccepted !== true) fail('runtime packet accepted mismatch')
if (record.postDispatchRuntimePacket?.routeExecution !== 'not_run_post_dispatch_runtime_packet_runner_only') fail('route execution marker mismatch')
if (record.postDispatchRuntimePacket?.realWorkerDispatch !== 'not_run_post_dispatch_runtime_packet_runner_only') fail('real worker dispatch marker mismatch')
if (record.postDispatchRuntimePacket?.workerExecution !== 'not_run_post_dispatch_runtime_packet_runner_only') fail('worker execution marker mismatch')
if (record.postDispatchRuntimePacket?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('gstreamer marker mismatch')
if (record.postDispatchRuntimePacket?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('mkvtoolnix marker mismatch')
if (record.postDispatchRuntimePacket?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media marker mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (['dockerExecution', 'gstreamerExecution', 'mkvtoolnixExecution', 'mediaProcessing'].includes(key)) continue
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.safety?.dockerExecution !== 'completed_local_image_only_network_disabled_no_push_no_deploy') fail('docker safety marker mismatch')
if (record.safety?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('gstreamer safety marker mismatch')
if (record.safety?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('mkvtoolnix safety marker mismatch')
if (record.safety?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media safety marker mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const handoffRecord = json(handoffRecordPath)
if (handoffRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_handoff_ready_for_post_dispatch_runtime_execution_packet') fail('handoff source decision mismatch')
if (handoffRecord.nextMilestone !== packet) fail('handoff source next milestone mismatch')
const dispatchRecord = json(dispatchRecordPath)
if (dispatchRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_dispatch_execution_packet_metadata_only') fail('dispatch source decision mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
].sort()
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (!fs.existsSync(file)) continue
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
