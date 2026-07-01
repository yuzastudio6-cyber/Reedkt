#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_dispatch_dry_run_metadata_only'
const execution =
  'completed_confirmation_gated_narrow_controlled_worker_dispatch_dry_run_metadata_only_no_worker_execution_or_tool_execution'
const integrationBase = 'c40b7f9165230bc575bd53823398941d44d48b97'
const sourceDecision = 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_queue_integration_metadata_only'
const sourceIntegrationBase = 'b0b32faefc809dd90ceb37fe99be8e9bbf5fbdf3'
const sourceRunId = '2026-07-01T19-06-40-470Z-35b9b73b'
const runId = '2026-07-01T20-04-10-357Z-0b18d0c3'
const readiness = 'ready_for_guarded_narrow_route_worker_runtime_execution_packet'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-dispatch-dry-run-result.md`,
  `${dir}/dispatch-dry-run-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1-diagnostics.mjs',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-diagnostics.mjs',
  'package.json',
]

const runtimePacketDir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1'
const runtimePacketFiles = [
  `${runtimePacketDir}/source-audit.md`,
  `${runtimePacketDir}/worker-runtime-execution-packet-result.md`,
  `${runtimePacketDir}/runtime-packet-envelope.md`,
  `${runtimePacketDir}/artifact-manifest-summary.md`,
  `${runtimePacketDir}/safety-boundary.md`,
  `${runtimePacketDir}/validation-results.md`,
  `${runtimePacketDir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...runtimePacketFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  sourceRunId,
  `Run ID: \`${runId}\``,
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_CONTROLLED_WORKER_DISPATCH_DRY_RUN=true',
  'dispatched_narrow_controlled_worker_dispatch_dry_run_metadata_only',
  'ready_for_guarded_narrow_route_worker_controlled_worker_dispatch_dry_run',
  readiness,
  'metadata_only_worker_dispatch_dry_run',
  'dry_run_no_worker_claim',
  'mock-job-runtime-queue-item-0001',
  'queue-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
  'job-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
  'lease-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
  'Dry-run dispatch envelope created: `true`',
  'Dry-run dispatch accepted: `true`',
  'Route execution: `not_run_narrow_controlled_worker_dispatch_dry_run_metadata_only`',
  'Worker dispatch: `not_run_narrow_controlled_worker_dispatch_dry_run_metadata_only`',
  'Worker execution: `not_run_narrow_controlled_worker_dispatch_dry_run_metadata_only`',
  'Worker process start: `not_run_narrow_controlled_worker_dispatch_dry_run_metadata_only`',
  'Worker lease claim: `not_run_narrow_controlled_worker_dispatch_dry_run_metadata_only`',
  'Persistent job queue write: `not_run_narrow_controlled_worker_dispatch_dry_run_metadata_only`',
  'Tool execution: `not_run_narrow_controlled_worker_dispatch_dry_run_metadata_only`',
  'narrow-controlled-worker-dispatch-dry-run-envelope.json',
  'narrow-controlled-worker-dispatch-dry-run-output-manifest.json',
  'narrow-controlled-worker-dispatch-dry-run-qa-report.json',
  'narrow-controlled-worker-dispatch-dry-run-report.json',
  'narrow-controlled-worker-dispatch-dry-run-manifest.json',
  'ac9ab8ff2ac5d50559caaafa38678cc87026b0a47ed43434af90d95f5b967ca2',
  'aaf21b9745e88792aba3fb565944620fcbae7425b430a420aec85ada13a4fa4e',
  'f481a71d091c34f40052a84611c043194dbd43ef591283011596fb9f17633437',
  '235347d77e31453fd58fe0e0d4d68992a34b5a7f5cb3efe3d4c5488196013297',
  'f666d10bf8185e567b7c9d24b863f64a94dd2c96b5d035c03ce04f023860d9ab',
  'Route execution in this dispatch dry run: `false`',
  'Worker dispatch in this dispatch dry run: `false`',
  'Worker execution in this dispatch dry run: `false`',
  'Worker process start in this dispatch dry run: `false`',
  'Worker lease claim in this dispatch dry run: `false`',
  'Persistent job queue write in this dispatch dry run: `false`',
  'GStreamer execution in this dispatch dry run: `false`',
  'MKVToolNix execution in this dispatch dry run: `false`',
  'Supabase mutation in this dispatch dry run: `false`',
  'SQL execution in this dispatch dry run: `false`',
  'Public artifact creation in this dispatch dry run: `false`',
  'Final render/export in this dispatch dry run: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-smoke\.ts$|services\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-smoke\.ts$)/,
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
  /\b(?:Route execution in this dispatch dry run|Worker dispatch in this dispatch dry run|Worker execution in this dispatch dry run|Worker process start in this dispatch dry run|Worker lease claim in this dispatch dry run|Persistent job queue write in this dispatch dry run|GStreamer execution in this dispatch dry run|MKVToolNix execution in this dispatch dry run|FFmpeg\/FFprobe execution in this dispatch dry run|Docker execution in this dispatch dry run|Remotion execution in this dispatch dry run|Private media processing in this dispatch dry run|User media processing in this dispatch dry run|Supabase mutation in this dispatch dry run|SQL execution in this dispatch dry run|Signed URL creation in this dispatch dry run|Public artifact creation in this dispatch dry run|Final render\/export in this dispatch dry run|Broad external beta unlock in this dispatch dry run|Paid production unlock in this dispatch dry run|Production unlock in this dispatch dry run):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"workerDispatchInThisDispatchDryRun"\s*:\s*true/i,
  /"workerExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"workerProcessStartInThisDispatchDryRun"\s*:\s*true/i,
  /"workerLeaseClaimInThisDispatchDryRun"\s*:\s*true/i,
  /"gstreamerExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"supabaseMutationInThisDispatchDryRun"\s*:\s*true/i,
  /"sqlExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"publicArtifactCreationInThisDispatchDryRun"\s*:\s*true/i,
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
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-smoke.ts'
) fail('missing narrow controlled worker dispatch dry-run smoke package script')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1'
  ] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1.ts'
) fail('missing narrow controlled worker dispatch dry-run runner package script')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1-diagnostics.mjs'
) fail('missing narrow controlled worker dispatch dry-run diagnostics package script')

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== sourceDecision) fail('source queue decision mismatch')
if (sourceRecord.integrationBase !== sourceIntegrationBase) fail('source queue integration base mismatch')
if (sourceRecord.runId !== sourceRunId) fail('source queue run ID mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source queue next milestone mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source queue product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.narrowControlledWorkerQueuePr !== 2028) fail('source PR mismatch')
if (record.sourceChain?.narrowControlledWorkerQueueMergeSha !== integrationBase) fail('source merge SHA mismatch')
if (record.sourceChain?.narrowControlledWorkerQueueDecision !== sourceDecision) fail('source decision mismatch')
if (
  record.sourceChain?.narrowControlledWorkerQueueReadiness !==
  'ready_for_guarded_narrow_route_worker_controlled_worker_dispatch_dry_run'
) fail('source readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.workerDispatchDryRun?.status !== 'dispatched_narrow_controlled_worker_dispatch_dry_run_metadata_only') fail('dry-run status mismatch')
if (record.workerDispatchDryRun?.controlledWorkerQueueStatus !== 'ready_for_guarded_narrow_route_worker_controlled_worker_dispatch_dry_run') fail('controlled queue status mismatch')
if (record.workerDispatchDryRun?.dispatchDryRunMode !== 'metadata_only_worker_dispatch_dry_run') fail('dispatch mode mismatch')
if (record.workerDispatchDryRun?.workerRuntimeMode !== 'dry_run_no_worker_claim') fail('worker runtime mode mismatch')
if (record.workerDispatchDryRun?.queueStatusAtDryRun !== 'queued') fail('queue status mismatch')
if (record.workerDispatchDryRun?.dryRunDispatchEnvelopeCreated !== true) fail('dry-run envelope created mismatch')
if (record.workerDispatchDryRun?.dryRunDispatchAccepted !== true) fail('dry-run accepted mismatch')
for (const key of [
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseClaim',
  'toolExecution',
  'persistentJobQueueWrite',
]) {
  if (record.workerDispatchDryRun?.[key] !== 'not_run_narrow_controlled_worker_dispatch_dry_run_metadata_only') {
    fail(`${key} mismatch`)
  }
}
if (record.workerDispatchDryRun?.nextSourceStatus !== readiness) fail('next source status mismatch')
if (record.artifacts?.envelope?.sha256 !== 'ac9ab8ff2ac5d50559caaafa38678cc87026b0a47ed43434af90d95f5b967ca2') fail('envelope checksum mismatch')
if (record.artifacts?.outputManifest?.sha256 !== 'aaf21b9745e88792aba3fb565944620fcbae7425b430a420aec85ada13a4fa4e') fail('output manifest checksum mismatch')
if (record.artifacts?.qaReport?.sha256 !== 'f481a71d091c34f40052a84611c043194dbd43ef591283011596fb9f17633437') fail('QA report checksum mismatch')
if (record.artifacts?.report?.sha256 !== '235347d77e31453fd58fe0e0d4d68992a34b5a7f5cb3efe3d4c5488196013297') fail('report checksum mismatch')
if (record.artifacts?.manifest?.sha256 !== 'f666d10bf8185e567b7c9d24b863f64a94dd2c96b5d035c03ce04f023860d9ab') fail('manifest checksum mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const service = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1.ts')
for (const text of [
  'blocked_missing_narrow_controlled_worker_dispatch_dry_run_confirmation',
  'blocked_narrow_controlled_worker_queue_validation_failed',
  'blocked_route_worker_or_tool_execution_not_enabled',
  'queueGstreamerMkvtoolnixNarrowControlledWorkerQueueMetadataMock',
  'metadata_only_worker_dispatch_dry_run',
  'dry_run_no_worker_claim',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'workerLeaseClaim: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'persistentJobQueueWrite: false',
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
