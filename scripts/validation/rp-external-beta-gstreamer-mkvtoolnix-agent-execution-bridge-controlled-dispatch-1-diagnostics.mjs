#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-CONTROLLED-DISPATCH-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_controlled_dispatch_boundary'
const execution = 'completed_confirmation_gated_agent_execution_bridge_controlled_dispatch_metadata_only_no_route_worker_or_tool_execution'
const runId = '2026-06-30T18-50-40-467Z-7ae8262d'
const integrationBase = 'd5d0ab318eb98f5b08f3e6dce9c1e87cb5d6bc7f'
const dryRunId = '2026-06-30T18-13-47-512Z-1707fbec'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-QUEUE-INTEGRATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/controlled-dispatch-result.md`,
  `${dir}/dispatch-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-diagnostics.mjs',
  'package.json',
]

const followOnControlledWorkerQueueFiles = [
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/worker-queue-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/queue-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1/gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-record.json',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-diagnostics.mjs',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/gstreamer-mkvtoolnix-agent-execution-bridge-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-record.json',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1.ts',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...followOnControlledWorkerQueueFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  dryRunId,
  '4effa512450664c648db9cf9e95b0653de41e96d',
  '4dec43f1edce87531eee61a7704b58545afd50b9',
  '2026-06-30T16-19-10-513Z-a91246d2',
  confirmationGate,
  'Confirmation gate observed: `present_true`',
  'accepted_controlled_dispatch_metadata_only',
  'ready_for_confirmation_gated_agent_execution_bridge_dry_run',
  'ready_for_agent_controlled_worker_queue_integration',
  'dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1',
  'metadata_only_controlled_dispatch',
  'external-agent-request-gstreamer-mkvtoolnix-controlled-dispatch-1',
  'approved-snapshot-agent-controlled-dispatch-1',
  'approval-record-agent-controlled-dispatch-1',
  'no-spend-fixture-policy-agent-controlled-dispatch-1',
  'job-agent-controlled-dispatch-1',
  'worker-lease-agent-controlled-dispatch-1',
  'gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template',
  'gst_controlled_generated_fixture_pipeline_v1',
  'private-input-manifest-agent-controlled-dispatch-1',
  'output-manifest-schema-agent-controlled-dispatch-1',
  'qa-report-schema-agent-controlled-dispatch-1',
  'cleanup-policy-agent-controlled-dispatch-1',
  'retention-policy-agent-controlled-dispatch-1',
  'failure-policy-agent-controlled-dispatch-1',
  'audit-parent-agent-controlled-dispatch-1',
  'Route execution: `not_run_controlled_dispatch_metadata_only`',
  'Worker dispatch: `not_run_controlled_dispatch_metadata_only`',
  'Worker execution: `not_run_controlled_dispatch_metadata_only`',
  'Tool execution: `not_run_controlled_dispatch_metadata_only`',
  'GStreamer execution in this dispatch: `false`',
  'MKVToolNix execution in this dispatch: `false`',
  '10dac7c0a8bd761ed89da72e75a620b0fae5adba36849dd495c6f6a77a3dfa20',
  '8bc1b12620d137c11871a2ca90ada637211066f73764dbd5ac854f79e1929e11',
  '2b3ac914256ab8d173914157e065edb4c9300057cbd268b8aef1240de4b9e2a4',
  'bd804d9d7af81d8088aaf72b85382b132056d4e99e256f0ed65b7bac28c4df6a',
  'eeca7f7b30ca940384c3c7c31b8a6e8d08cdf7dc7141037612fdb14b5269c9f1',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-smoke\.ts$|services\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-smoke\.ts$)/,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|Tool execution|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisDispatch"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDispatch"\s*:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-smoke.ts'
) {
  fail('missing controlled dispatch smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1'] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.ts'
) {
  fail('missing controlled dispatch runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-diagnostics.mjs'
) {
  fail('missing controlled dispatch diagnostics package script')
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
if (record.sourceChain?.agentExecutionBridgeDryRunPr !== 1892) fail('dry-run PR mismatch')
if (record.sourceChain?.agentExecutionBridgeDryRunMergeSha !== integrationBase) fail('dry-run merge mismatch')
if (record.sourceChain?.agentExecutionBridgeDryRunRunId !== dryRunId) fail('dry-run run ID mismatch')
if (record.sourceChain?.agentExecutionBridgePr !== 1887) fail('bridge PR mismatch')
if (record.sourceChain?.agentExecutionBridgeMergeSha !== '4effa512450664c648db9cf9e95b0653de41e96d') fail('bridge merge mismatch')
if (record.sourceChain?.runtimeExecutionImplementationPr !== 1882) fail('runtime source PR mismatch')
if (record.sourceChain?.runtimeExecutionImplementationMergeSha !== '4dec43f1edce87531eee61a7704b58545afd50b9') fail('runtime source merge mismatch')
if (record.sourceChain?.runtimeExecutionRunId !== '2026-06-30T16-19-10-513Z-a91246d2') fail('runtime source run id mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.controlledDispatch?.status !== 'accepted_controlled_dispatch_metadata_only') fail('controlled dispatch status mismatch')
if (record.controlledDispatch?.bridgeStatus !== 'ready_for_confirmation_gated_agent_execution_bridge_dry_run') fail('bridge status mismatch')
if (record.controlledDispatch?.controlledDispatchAccepted !== true) fail('controlled dispatch accepted flag mismatch')
if (record.controlledDispatch?.queueIntegration !== 'pending_next_milestone') fail('queue integration mismatch')
if (record.controlledDispatch?.dispatchMode !== 'metadata_only_controlled_dispatch') fail('dispatch mode mismatch')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'toolExecution']) {
  if (record.controlledDispatch?.[key] !== 'not_run_controlled_dispatch_metadata_only') fail(`${key} mismatch`)
}
if (record.controlledDispatch?.nextSourceStatus !== 'ready_for_agent_controlled_worker_queue_integration') fail('next source status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}

const dryRunRecord = json('docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-record.json')
if (dryRunRecord.decision !== 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_dry_run_envelope_validation') fail('dry-run source decision mismatch')
if (dryRunRecord.runId !== dryRunId) fail('dry-run source run ID mismatch')

const bridgeRecord = json('docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/gstreamer-mkvtoolnix-agent-execution-bridge-record.json')
if (bridgeRecord.decision !== 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run') fail('bridge source decision mismatch')

const service = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.ts')
for (const text of [
  'blocked_missing_controlled_dispatch_confirmation',
  'blocked_bridge_validation_failed',
  'blocked_controlled_dispatch_idempotency_mismatch',
  'blocked_runtime_execution_not_enabled',
  'workerDispatchRequestedNow',
  'gstreamerExecutionRequestedNow',
  "queueIntegration: 'pending_next_milestone'",
  'routeExecution: false',
  'workerDispatch: false',
  'gstreamerExecution: false',
]) {
  if (!service.includes(text)) fail(`controlled dispatch service missing required text: ${text}`)
}

const smoke = read('server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-smoke.ts')
for (const text of [
  'confirmation_gate_blocks',
  'invalid_bridge_blocks',
  'raw_command_bridge_blocks',
  'dispatch_idempotency_mismatch_blocks',
  'runtime_dispatch_and_tool_execution_requests_block',
  'missing_dispatch_refs_block',
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
