#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-QUEUE-INTEGRATION-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-qa-rollup-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_queue_integration_metadata_only'
const execution =
  'completed_confirmation_gated_narrow_controlled_worker_queue_metadata_only_no_route_worker_tool_or_media_execution'
const integrationBase = 'b0b32faefc809dd90ceb37fe99be8e9bbf5fbdf3'
const sourceRecordIntegrationBase = '582a3ae2d5b418910363a111a84e59261bbc238f'
const runId = '2026-07-01T19-06-40-470Z-35b9b73b'
const sourceDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_controlled_dispatch_execution_packet_evidence'
const readiness = 'ready_for_guarded_narrow_route_worker_controlled_worker_dispatch_dry_run'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-queue-result.md`,
  `${dir}/queue-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-qa-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  readiness,
  'Source QA rollup PR: `#2022`',
  'Source QA rollup merge SHA: `b0b32faefc809dd90ceb37fe99be8e9bbf5fbdf3`',
  `Run ID: \`${runId}\``,
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_CONTROLLED_WORKER_QUEUE_INTEGRATION=true',
  'queued_narrow_controlled_worker_queue_metadata_only',
  'mock_queue_metadata_only',
  'queue-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
  'mock-job-runtime-queue-item-0001',
  'job-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
  'Local mock queue item created: `true`',
  'Persistent job queue write: `not_run_local_mock_queue_metadata_only`',
  'Route execution: `not_run_controlled_worker_queue_metadata_only`',
  'Worker dispatch: `not_run_controlled_worker_queue_metadata_only`',
  'Worker execution: `not_run_controlled_worker_queue_metadata_only`',
  'Tool execution: `not_run_controlled_worker_queue_metadata_only`',
  'narrow-controlled-worker-queue-input.json',
  'narrow-controlled-worker-queue-report.json',
  'narrow-controlled-worker-queue-manifest.json',
  '50bd457490092eafe244aff2e219fd653abea810f199fa8424a456f09a0aeead',
  'ae4d8862eaf86681fe0a95d1aec25d3a22f2894fe4a2546d2525d114a5385f10',
  'dc663d8039a43be4c9b15b2f70547cc61d904f30ba2f343b3f0019d1314ae96a',
  'Route execution in this queue integration: `false`',
  'Worker dispatch in this queue integration: `false`',
  'Worker execution in this queue integration: `false`',
  'GStreamer execution in this queue integration: `false`',
  'MKVToolNix execution in this queue integration: `false`',
  'Supabase mutation in this queue integration: `false`',
  'SQL execution in this queue integration: `false`',
  'Public artifact creation in this queue integration: `false`',
  'Final render/export in this queue integration: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-smoke\.ts$)/,
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
  /\b(?:Route execution in this queue integration|Worker dispatch in this queue integration|Worker execution in this queue integration|GStreamer execution in this queue integration|MKVToolNix execution in this queue integration|FFmpeg\/FFprobe execution in this queue integration|Docker execution in this queue integration|Remotion execution in this queue integration|Private media processing in this queue integration|User media processing in this queue integration|Supabase mutation in this queue integration|SQL execution in this queue integration|Signed URL creation in this queue integration|Public artifact creation in this queue integration|Final render\/export in this queue integration|Broad external beta unlock in this queue integration|Paid production unlock in this queue integration|Production unlock in this queue integration):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisQueueIntegration"\s*:\s*true/i,
  /"workerDispatchInThisQueueIntegration"\s*:\s*true/i,
  /"workerExecutionInThisQueueIntegration"\s*:\s*true/i,
  /"gstreamerExecutionInThisQueueIntegration"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQueueIntegration"\s*:\s*true/i,
  /"supabaseMutationInThisQueueIntegration"\s*:\s*true/i,
  /"sqlExecutionInThisQueueIntegration"\s*:\s*true/i,
  /"publicArtifactCreationInThisQueueIntegration"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-smoke.ts'
) fail('missing narrow controlled worker queue smoke package script')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1'
  ] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1.ts'
) fail('missing narrow controlled worker queue runner package script')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-diagnostics.mjs'
) fail('missing narrow controlled worker queue diagnostics package script')

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== sourceDecision) fail('source decision mismatch')
if (sourceRecord.integrationBase !== sourceRecordIntegrationBase) fail('source integration base mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.controlledDispatchExecutionPacketQaRollupPr !== 2022) fail('source PR mismatch')
if (record.sourceChain?.controlledDispatchExecutionPacketQaRollupMergeSha !== integrationBase) fail('source merge SHA mismatch')
if (record.sourceChain?.controlledDispatchExecutionPacketQaDecision !== sourceDecision) fail('source QA decision mismatch')
if (record.sourceChain?.controlledDispatchExecutionPacketQaReadiness !== 'ready_for_guarded_narrow_route_worker_controlled_worker_queue_integration') fail('source readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.workerQueueIntegration?.status !== 'queued_narrow_controlled_worker_queue_metadata_only') fail('queue status mismatch')
if (record.workerQueueIntegration?.queueMode !== 'mock_queue_metadata_only') fail('queue mode mismatch')
if (record.workerQueueIntegration?.localMockQueueItemCreated !== true) fail('local mock queue mismatch')
if (record.workerQueueIntegration?.queueStatus !== 'queued') fail('queue item status mismatch')
if (record.workerQueueIntegration?.persistentJobQueueWrite !== 'not_run_local_mock_queue_metadata_only') fail('persistent queue status mismatch')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'toolExecution']) {
  if (record.workerQueueIntegration?.[key] !== 'not_run_controlled_worker_queue_metadata_only') fail(`${key} mismatch`)
}
if (record.workerQueueIntegration?.nextSourceStatus !== readiness) fail('next source status mismatch')
if (record.artifacts?.input?.sha256 !== '50bd457490092eafe244aff2e219fd653abea810f199fa8424a456f09a0aeead') fail('input checksum mismatch')
if (record.artifacts?.report?.sha256 !== 'ae4d8862eaf86681fe0a95d1aec25d3a22f2894fe4a2546d2525d114a5385f10') fail('report checksum mismatch')
if (record.artifacts?.manifest?.sha256 !== 'dc663d8039a43be4c9b15b2f70547cc61d904f30ba2f343b3f0019d1314ae96a') fail('manifest checksum mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const service = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1.ts')
for (const text of [
  'blocked_missing_narrow_controlled_worker_queue_confirmation',
  'blocked_registered_noop_source_validation_failed',
  'blocked_route_worker_or_tool_execution_not_enabled',
  'queueMockJob',
  'mock_queue_metadata_only',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'persistentQueueWrite: false',
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
