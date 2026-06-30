#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-QUEUE-INTEGRATION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_queue_integration_metadata_only'
const execution = 'completed_confirmation_gated_agent_controlled_worker_queue_metadata_only_no_worker_dispatch_or_tool_execution'
const runId = '2026-06-30T19-45-59-915Z-af80c9f8'
const integrationBase = '30b06246fe4a3b2834217279816777dc1d721b53'
const controlledDispatchRunId = '2026-06-30T18-50-40-467Z-7ae8262d'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_INTEGRATION=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-queue-result.md`,
  `${dir}/queue-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/gstreamer-mkvtoolnix-agent-execution-bridge-record.json',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.ts',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  controlledDispatchRunId,
  'd5d0ab318eb98f5b08f3e6dce9c1e87cb5d6bc7f',
  '4effa512450664c648db9cf9e95b0653de41e96d',
  '4dec43f1edce87531eee61a7704b58545afd50b9',
  '2026-06-30T16-19-10-513Z-a91246d2',
  confirmationGate,
  'Confirmation gate observed: `present_true`',
  'queued_controlled_worker_queue_metadata_only',
  'ready_for_agent_controlled_worker_queue_integration',
  'ready_for_agent_controlled_worker_dispatch_dry_run',
  'queue-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
  'mock_queue_metadata_only',
  'gstreamer-mkvtoolnix-agent-controlled-worker-queue:workspace-agent-controlled-dispatch-1:project-agent-controlled-dispatch-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1:queue-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
  'queue-contract-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
  'retry-policy-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
  'audit-event-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
  'non-public-artifact-policy-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
  'mock-job-runtime-queue-item-0001',
  'Local mock queue item created: `true`',
  'Persistent job queue write: `not_run_local_mock_queue_metadata_only`',
  'Route execution: `not_run_controlled_worker_queue_metadata_only`',
  'Worker dispatch: `not_run_controlled_worker_queue_metadata_only`',
  'Worker execution: `not_run_controlled_worker_queue_metadata_only`',
  'Tool execution: `not_run_controlled_worker_queue_metadata_only`',
  'GStreamer execution in this queue integration: `false`',
  'MKVToolNix execution in this queue integration: `false`',
  '23c0503b69f6403d6a93ed72b06a4b7b58f5075e4054ec5e63afc9b8666ecd7e',
  'bef3b157790c2cc4342dc19ba0894e779e83bb702a4f4b2f5407f5f90f78eed6',
  '0b67277bdd78d820106e2f9919e7753f4f9a7fd44cc779efeb1d81ebb678a3d5',
  '914e3cd2e89fe05d66d8bd95d9103e8470d18a5561c83aaf449a81bbdc80ab9f',
  'f40c0e25d876624bbbb67a72f49127ab0ec11bada0b1925e95d2be739809723f',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-smoke\.ts$)/,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|Tool execution|Persistent job queue write|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisQueueIntegration"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQueueIntegration"\s*:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-smoke.ts'
) {
  fail('missing worker queue smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1'] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.ts'
) {
  fail('missing worker queue runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-diagnostics.mjs'
) {
  fail('missing worker queue diagnostics package script')
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
if (record.sourceChain?.agentControlledDispatchPr !== 1896) fail('controlled dispatch PR mismatch')
if (record.sourceChain?.agentControlledDispatchMergeSha !== integrationBase) fail('controlled dispatch merge mismatch')
if (record.sourceChain?.agentControlledDispatchRunId !== controlledDispatchRunId) fail('controlled dispatch run ID mismatch')
if (record.sourceChain?.agentExecutionBridgeDryRunPr !== 1892) fail('dry-run PR mismatch')
if (record.sourceChain?.agentExecutionBridgePr !== 1887) fail('bridge PR mismatch')
if (record.sourceChain?.runtimeExecutionImplementationPr !== 1882) fail('runtime PR mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.workerQueueIntegration?.status !== 'queued_controlled_worker_queue_metadata_only') fail('queue status mismatch')
if (record.workerQueueIntegration?.controlledDispatchStatus !== 'ready_for_agent_controlled_worker_queue_integration') fail('controlled dispatch status mismatch')
if (record.workerQueueIntegration?.localMockQueueItemCreated !== true) fail('local mock queue flag mismatch')
if (record.workerQueueIntegration?.queueStatus !== 'queued') fail('mock queue status mismatch')
if (record.workerQueueIntegration?.queueMode !== 'mock_queue_metadata_only') fail('queue mode mismatch')
if (record.workerQueueIntegration?.persistentJobQueueWrite !== 'not_run_local_mock_queue_metadata_only') fail('persistent queue write mismatch')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'toolExecution']) {
  if (record.workerQueueIntegration?.[key] !== 'not_run_controlled_worker_queue_metadata_only') fail(`${key} mismatch`)
}
if (record.workerQueueIntegration?.nextSourceStatus !== 'ready_for_agent_controlled_worker_dispatch_dry_run') fail('next source status mismatch')
if (record.queueItem?.queueStatus !== 'queued') fail('queue item status mismatch')
if (record.queueItem?.mockOnly !== true || record.queueItem?.payloadMockOnly !== true) fail('mock-only queue item mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'localMockQueueMetadataOnly') {
    if (value !== true) fail('local mock queue metadata flag must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const dispatchRecord = json('docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-record.json')
if (dispatchRecord.decision !== 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_controlled_dispatch_boundary') fail('controlled dispatch source decision mismatch')
if (dispatchRecord.runId !== controlledDispatchRunId) fail('controlled dispatch run ID mismatch')

const service = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.ts')
for (const text of [
  'blocked_missing_controlled_worker_queue_confirmation',
  'blocked_controlled_dispatch_validation_failed',
  'blocked_controlled_worker_queue_idempotency_mismatch',
  'blocked_runtime_execution_not_enabled',
  'queueMockJob',
  'persistentJobQueueWriteRequestedNow',
  'workerDispatchRequestedNow',
  'mkvtoolnixExecutionRequestedNow',
  'localMockQueueItemCreated: true',
  'persistentJobQueueWrite: false',
]) {
  if (!service.includes(text)) fail(`worker queue service missing required text: ${text}`)
}

const smoke = read('server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-smoke.ts')
for (const text of [
  'local_mock_queue_item_created',
  'queue_payload_sanitized_refs_only',
  'confirmation_gate_blocks',
  'invalid_dispatch_blocks',
  'queue_idempotency_mismatch_blocks',
  'runtime_dispatch_and_tool_execution_requests_block',
]) {
  if (!smoke.includes(text)) fail(`smoke missing required assertion summary: ${text}`)
}

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ...gitLines(['diff', '--cached', '--name-only']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const content = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(content)) fail(`Supabase token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(content)) fail(`Supabase URL leaked in ${file}`)
  const redacted = content.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(content)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(content)) fail(`forbidden claim matched in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Execution: ${execution}`)
console.log(`Run ID: ${runId}`)
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
