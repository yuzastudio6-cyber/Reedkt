#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_dispatch_dry_run_metadata_only'
const execution = 'completed_confirmation_gated_agent_controlled_worker_dispatch_dry_run_metadata_only_no_worker_execution_or_tool_execution'
const runId = '2026-06-30T20-56-18-927Z-8e5d25d9'
const integrationBase = 'cc18a07622a3107c589d2d2957432026da27b8cd'
const queueRunId = '2026-06-30T19-45-59-915Z-af80c9f8'
const controlledDispatchRunId = '2026-06-30T18-50-40-467Z-7ae8262d'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-dispatch-dry-run-result.md`,
  `${dir}/dispatch-dry-run-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-record.json',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.ts',
]

const followOnRuntimePacketFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/worker-runtime-execution-packet-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/runtime-packet-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1/gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-qa-rollup-1.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...followOnRuntimePacketFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  queueRunId,
  controlledDispatchRunId,
  confirmationGate,
  'Confirmation gate observed: `present_true`',
  'dispatched_controlled_worker_dispatch_dry_run_metadata_only',
  'ready_for_agent_controlled_worker_dispatch_dry_run',
  'ready_for_agent_controlled_worker_runtime_execution_packet',
  'dispatch-dry-run-gstreamer-mkvtoolnix-agent-controlled-worker-1',
  'metadata_only_worker_dispatch_dry_run',
  'gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run:workspace-agent-controlled-dispatch-1:project-agent-controlled-dispatch-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1:queue-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1:dispatch-dry-run-gstreamer-mkvtoolnix-agent-controlled-worker-1',
  'dispatch-contract-gstreamer-mkvtoolnix-agent-controlled-worker-dry-run-1',
  'audit-event-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1',
  'dry_run_no_worker_claim',
  'worker-runtime-packet-gstreamer-mkvtoolnix-agent-controlled-worker-1',
  'Queue status at dry run: `queued`',
  'mock-job-runtime-queue-item-0001',
  'Dry-run dispatch envelope created: `true`',
  'Dry-run dispatch accepted: `true`',
  'Worker lease claim: `not_run_controlled_worker_dispatch_dry_run_metadata_only`',
  'Worker dispatch: `not_run_controlled_worker_dispatch_dry_run_metadata_only`',
  'Worker execution: `not_run_controlled_worker_dispatch_dry_run_metadata_only`',
  'Tool execution: `not_run_controlled_worker_dispatch_dry_run_metadata_only`',
  'Persistent job queue write: `not_run_controlled_worker_dispatch_dry_run_metadata_only`',
  'GStreamer execution in this dispatch dry run: `false`',
  'MKVToolNix execution in this dispatch dry run: `false`',
  '397fade5ab697b10a087a367a95b1859076749a51d022c1e1bab54a15701b3d8',
  '61c6fa98505f6d4dd5d1b7a085d58ddacce27c9450f0bd9561235843b9990a35',
  'adae082d0d1b9abede7a9059b8800b07e879cb9c26a85dd2214836a10f07975b',
  'a09b951f071a0d382be2a1910e205da02b076b09f63482b71daaa8eadb96c321',
  '6b8103c980c33be43b9a9ef69d141a7db3f95c8a3326f4eec99dbe5448b87165',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-smoke\.ts$|services\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-smoke\.ts$)/,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|Worker lease claim|Tool execution|Persistent job queue write|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"gstreamerExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"dockerPushDeploy"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"broadExternalBetaUnlock"\s*:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-smoke.ts'
) {
  fail('missing worker dispatch dry-run smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1'] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1.ts'
) {
  fail('missing worker dispatch dry-run runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-diagnostics.mjs'
) {
  fail('missing worker dispatch dry-run diagnostics package script')
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
if (record.sourceChain?.agentControlledWorkerQueuePr !== 1902) fail('queue PR mismatch')
if (record.sourceChain?.agentControlledWorkerQueueMergeSha !== integrationBase) fail('queue merge mismatch')
if (record.sourceChain?.agentControlledWorkerQueueRunId !== queueRunId) fail('queue run ID mismatch')
if (record.sourceChain?.agentControlledDispatchPr !== 1896) fail('controlled dispatch PR mismatch')
if (record.sourceChain?.agentControlledDispatchMergeSha !== '30b06246fe4a3b2834217279816777dc1d721b53') fail('controlled dispatch merge mismatch')
if (record.sourceChain?.agentControlledDispatchRunId !== controlledDispatchRunId) fail('controlled dispatch run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.workerDispatchDryRun?.status !== 'dispatched_controlled_worker_dispatch_dry_run_metadata_only') fail('dispatch dry-run status mismatch')
if (record.workerDispatchDryRun?.controlledWorkerQueueStatus !== 'ready_for_agent_controlled_worker_dispatch_dry_run') fail('queue status mismatch')
if (record.workerDispatchDryRun?.dispatchDryRunMode !== 'metadata_only_worker_dispatch_dry_run') fail('dispatch dry-run mode mismatch')
if (record.workerDispatchDryRun?.workerRuntimeMode !== 'dry_run_no_worker_claim') fail('worker runtime mode mismatch')
if (record.workerDispatchDryRun?.queueStatusAtDryRun !== 'queued') fail('queue status at dry run mismatch')
if (record.workerDispatchDryRun?.dryRunDispatchEnvelopeCreated !== true) fail('dry-run envelope flag mismatch')
if (record.workerDispatchDryRun?.dryRunDispatchAccepted !== true) fail('dry-run accepted flag mismatch')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'workerLeaseClaim', 'toolExecution', 'persistentJobQueueWrite']) {
  if (record.workerDispatchDryRun?.[key] !== 'not_run_controlled_worker_dispatch_dry_run_metadata_only') fail(`${key} mismatch`)
}
if (record.workerDispatchDryRun?.nextSourceStatus !== 'ready_for_agent_controlled_worker_runtime_execution_packet') fail('next source status mismatch')
if (record.queueItem?.queueStatus !== 'queued') fail('queue item status mismatch')
if (record.queueItem?.mockOnly !== true || record.queueItem?.payloadMockOnly !== true) fail('mock-only queue item mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'controlledWorkerDispatchDryRunMetadataOnly') {
    if (value !== true) fail('controlled worker dispatch dry-run metadata flag must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const queueRecord = json('docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-record.json')
if (queueRecord.decision !== 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_queue_integration_metadata_only') fail('queue source decision mismatch')
if (queueRecord.runId !== queueRunId) fail('queue source run ID mismatch')

const service = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1.ts')
for (const text of [
  'blocked_missing_controlled_worker_dispatch_dry_run_confirmation',
  'blocked_controlled_worker_queue_validation_failed',
  'blocked_controlled_worker_dispatch_dry_run_idempotency_mismatch',
  'blocked_runtime_execution_not_enabled',
  'blocked_queue_item_not_ready_for_dispatch_dry_run',
  'dry_run_no_worker_claim',
  'workerLeaseClaimRequestedNow',
  'gstreamerExecutionRequestedNow',
  'persistentJobQueueWriteRequestedNow',
  'workerDispatch: false',
  'workerExecution: false',
  'workerLeaseClaim: false',
]) {
  if (!service.includes(text)) fail(`worker dispatch dry-run service missing required text: ${text}`)
}

const smoke = read('server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-smoke.ts')
for (const text of [
  'valid_controlled_worker_dispatch_dry_run_boundary',
  'local_mock_queue_item_reused_for_dry_run',
  'confirmation_gate_blocks',
  'worker_lease_claim_blocks',
  'worker_dispatch_and_tool_execution_requests_block',
]) {
  if (!smoke.includes(text)) fail(`worker dispatch dry-run smoke missing required text: ${text}`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) {
    fail(`unexpected changed file: ${file}`)
  }
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim matched in changed file ${file}: ${pattern}`)
    }
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json staged')

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Execution: ${execution}`)
console.log(`Run ID: ${runId}`)
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
