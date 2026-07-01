#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_execution_packet_generated_fixture_only'
const execution = 'completed_confirmation_gated_agent_controlled_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch'
const runId = '2026-07-01T00-16-10-927Z-8b7402d8'
const guardedRuntimeRunId = '2026-07-01T00-16-10-989Z-a9752eae'
const integrationBase = '6cc86d71f383a64254ce2324e02e5d83e70bc031'
const dispatchDryRunRunId = '2026-06-30T20-56-18-927Z-8e5d25d9'
const queueRunId = '2026-06-30T19-45-59-915Z-af80c9f8'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_EXECUTION=true'
const guardedConfirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_EXECUTION=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-RUNTIME-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-runtime-execution-packet-result.md`,
  `${dir}/runtime-packet-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1/gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-record.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1.mjs',
]

const followOnQaRollupFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/runtime-qa-rollup.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/evidence-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...followOnQaRollupFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runId,
  guardedRuntimeRunId,
  dispatchDryRunRunId,
  queueRunId,
  confirmationGate,
  guardedConfirmationGate,
  'Confirmation gate observed: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_EXECUTION=true`',
  'Runtime packet status: `completed_controlled_worker_runtime_execution_packet_generated_fixture_only`',
  'Runtime execution mode: `controlled_generated_fixture_runtime_execution`',
  'Fixture scope: `generated_srt_and_generated_subtitle_only_mkv_fixture`',
  'Worker runtime mode: `runner_invoked_guarded_runtime_no_route_dispatch`',
  'Runtime packet accepted: `true`',
  'approved-snapshot-agent-controlled-dispatch-1',
  'approval-record-agent-controlled-dispatch-1',
  'no-spend-fixture-policy-agent-controlled-dispatch-1',
  'job-agent-controlled-dispatch-1',
  'worker-lease-agent-controlled-dispatch-1',
  'gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'Route execution: `not_run_agent_runtime_packet_runner_only`',
  'Worker dispatch: `not_run_agent_runtime_packet_runner_only`',
  'Worker execution: `not_run_agent_runtime_packet_runner_only`',
  'Worker lease claim: `not_run_agent_runtime_packet_runner_only`',
  'Persistent job queue write: `not_run_agent_runtime_packet_runner_only`',
  'GStreamer execution: `completed_controlled_generated_fixture_only`',
  'MKVToolNix execution: `completed_controlled_generated_fixture_only`',
  'Media processing: `controlled_generated_fixture_only`',
  'Docker execution: `completed_local_image_only_network_disabled_no_push_no_deploy`',
  'ready_for_agent_controlled_worker_runtime_qa_rollup',
  'f61416714a8ac4333448e7f1d6e3f2351c7bb29faab4473fc920e1bb94c7b45a',
  'b3cf94090b250dc1fb5e4ebbd7cb56cbe4d6bdbd070d28243f2756c2a98e16d9',
  '1a9321f9272b184f5003cac99c338bc8d011f33e87e79e07612dca0a7e8aab3e',
  'af90e2292be7af0f72cbec78fe512cb63ff4b5ea4d10c995d6c7500d6ad9f332',
  'a3942b2e55ca80c4ea954db1164d1117cdb238761225bcfc1a3d7edf1fccda93',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-smoke\.ts$)/,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|Worker lease claim|Persistent job queue write|FFmpeg\/FFprobe execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bDocker push\/deploy:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-smoke.ts'
) {
  fail('missing runtime packet smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1'] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1.ts'
) {
  fail('missing runtime packet runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-diagnostics.mjs'
) {
  fail('missing runtime packet diagnostics package script')
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
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.confirmationGate?.observed !== 'present_true') fail('confirmation gate mismatch')
if (record.sourceChain?.agentControlledWorkerDispatchDryRunPr !== 1905) fail('dispatch dry-run PR mismatch')
if (record.sourceChain?.agentControlledWorkerDispatchDryRunMergeSha !== integrationBase) fail('dispatch dry-run merge mismatch')
if (record.sourceChain?.agentControlledWorkerDispatchDryRunRunId !== dispatchDryRunRunId) fail('dispatch dry-run run ID mismatch')
if (record.sourceChain?.agentControlledWorkerQueuePr !== 1902) fail('queue PR mismatch')
if (record.sourceChain?.agentControlledWorkerQueueMergeSha !== 'cc18a07622a3107c589d2d2957432026da27b8cd') fail('queue merge mismatch')
if (record.sourceChain?.agentControlledWorkerQueueRunId !== queueRunId) fail('queue run ID mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== guardedRuntimeRunId) fail('guarded runtime run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.workerRuntimeExecutionPacket?.status !== 'completed_controlled_worker_runtime_execution_packet_generated_fixture_only') fail('runtime status mismatch')
if (record.workerRuntimeExecutionPacket?.runtimeExecutionMode !== 'controlled_generated_fixture_runtime_execution') fail('runtime execution mode mismatch')
if (record.workerRuntimeExecutionPacket?.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture') fail('fixture scope mismatch')
if (record.workerRuntimeExecutionPacket?.workerRuntimeMode !== 'runner_invoked_guarded_runtime_no_route_dispatch') fail('worker runtime mode mismatch')
if (record.workerRuntimeExecutionPacket?.runtimePacketAccepted !== true) fail('runtime packet accepted flag mismatch')
if (record.workerRuntimeExecutionPacket?.dockerNetwork !== 'none') fail('docker network mismatch')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'workerLeaseClaim', 'persistentJobQueueWrite']) {
  if (record.workerRuntimeExecutionPacket?.[key] !== 'not_run_agent_runtime_packet_runner_only') fail(`${key} boundary mismatch`)
}
if (record.workerRuntimeExecutionPacket?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer runtime mismatch')
if (record.workerRuntimeExecutionPacket?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix runtime mismatch')
if (record.workerRuntimeExecutionPacket?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media processing scope mismatch')
if (record.workerRuntimeExecutionPacket?.privateMediaProcessing !== false) fail('private media processing mismatch')
if (record.workerRuntimeExecutionPacket?.userMediaProcessing !== false) fail('user media processing mismatch')
if (record.workerRuntimeExecutionPacket?.nextSourceStatus !== 'ready_for_agent_controlled_worker_runtime_qa_rollup') fail('next source status mismatch')
if (record.guardedRuntime?.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture') fail('guarded runtime decision mismatch')
if (record.guardedRuntime?.execution !== 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only') fail('guarded runtime execution mismatch')
if (!Array.isArray(record.guardedRuntime?.commandResults) || record.guardedRuntime.commandResults.length !== 4) fail('guarded command result count mismatch')
for (const result of record.guardedRuntime.commandResults) {
  if (result.ok !== true || result.exitStatus !== 0) fail(`guarded command failed: ${result.templateId}`)
}
if (record.safety?.dockerExecution !== 'completed_local_image_only_network_disabled_no_push_no_deploy') fail('docker execution safety mismatch')
if (record.safety?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer safety mismatch')
if (record.safety?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix safety mismatch')
for (const key of [
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerLeaseClaim',
  'persistentJobQueueWrite',
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'dockerPushDeploy',
  'remotionExecution',
  'supabaseMutation',
  'sqlExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
]) {
  if (record.safety?.[key] !== false) fail(`safety ${key} must be false`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json has unstaged changes')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json has staged changes')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Execution: ${execution}`)
console.log(`Run ID: ${runId}`)
console.log(`Product-ready end-to-end local OSS tools: 0`)
