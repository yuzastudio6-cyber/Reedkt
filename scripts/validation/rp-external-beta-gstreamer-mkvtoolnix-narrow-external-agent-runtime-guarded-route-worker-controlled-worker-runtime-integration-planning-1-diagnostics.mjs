#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PLANNING-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-record.json'
const runtimeRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-record.json'
const integrationBase = 'a5db0d091859b9887002e1b69e66bc936662d576'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_planning'
const execution =
  'completed_docs_only_narrow_controlled_worker_runtime_integration_planning_no_route_worker_or_tool_execution'
const sourceDecision =
  'qa_passed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_execution_packet_generated_fixture_evidence'
const runtimeDecision =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only'
const sourceRunId = '2026-07-01T20-56-05-033Z-b0ec74d8'
const guardedRunId = '2026-07-01T20-56-05-092Z-9330089b'
const readiness = 'ready_for_guarded_narrow_route_worker_runtime_integration_packet'
const planningReadiness = 'ready_for_future_confirmation_gated_narrow_route_worker_runtime_integration_packet'
const gate =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_RUNTIME_INTEGRATION_PACKET=true'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/integration-contract.md`,
  `${dir}/route-worker-boundary.md`,
  `${dir}/work-graph-and-manifest-plan.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runtimeDecision,
  sourceDecision,
  `Source runtime packet run ID: \`${sourceRunId}\``,
  `Guarded generated-fixture runtime run ID: \`${guardedRunId}\``,
  'Queue integration PR: `#2028`',
  'Dispatch dry-run PR: `#2036`',
  'Runtime execution packet PR: `#2044`',
  'Runtime QA rollup PR: `#2047`',
  gate,
  'generated_fixture_only_narrow_controlled_worker_runtime_source',
  'approved snapshot reference or explicit generated-fixture source envelope',
  'source idempotency key',
  'worker idempotency key',
  'worker lease reference',
  'artifact manifest checksums',
  'QA report checksums',
  `GStreamer readiness: \`${readiness}\``,
  `MKVToolNix readiness: \`${readiness}\``,
  `External-agent route/worker boundary readiness: \`${readiness}\``,
  `Runtime integration planning readiness: \`${planningReadiness}\``,
  'Production route file created in this planning phase: `false`',
  'Route registered at runtime in this planning phase: `false`',
  'Route execution in this planning phase: `false`',
  'Worker dispatch in this planning phase: `false`',
  'Worker execution in this planning phase: `false`',
  'Worker process start in this planning phase: `false`',
  'Worker lease claim in this planning phase: `false`',
  'Persistent job queue write in this planning phase: `false`',
  'Service-role secret payload access in this planning phase: `false`',
  'Frontend credential exposure in this planning phase: `false`',
  'Broad service-role handler in this planning phase: `false`',
  'GStreamer execution in this planning phase: `false`',
  'MKVToolNix execution in this planning phase: `false`',
  'Docker execution in this planning phase: `false`',
  'FFmpeg/FFprobe execution in this planning phase: `false`',
  'Remotion execution in this planning phase: `false`',
  'Private media processing in this planning phase: `false`',
  'User media processing in this planning phase: `false`',
  'Supabase mutation in this planning phase: `false`',
  'SQL execution in this planning phase: `false`',
  'Signed URL creation in this planning phase: `false`',
  'Public artifact creation in this planning phase: `false`',
  'Final render/export in this planning phase: `false`',
  'Broad external beta unlock in this planning phase: `false`',
  'Paid production unlock in this planning phase: `false`',
  'Production unlock in this planning phase: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Product-ready end-to-end local OSS tools: `0`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
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
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Production route file created in this planning phase|Route registered at runtime in this planning phase|Route execution in this planning phase|Worker dispatch in this planning phase|Worker execution in this planning phase|Worker process start in this planning phase|Worker lease claim in this planning phase|Persistent job queue write in this planning phase|Service-role secret payload access in this planning phase|Frontend credential exposure in this planning phase|Broad service-role handler in this planning phase|GStreamer execution in this planning phase|MKVToolNix execution in this planning phase|Docker execution in this planning phase|FFmpeg\/FFprobe execution in this planning phase|Remotion execution in this planning phase|Private media processing in this planning phase|User media processing in this planning phase|Media processing in this planning phase|Supabase mutation in this planning phase|SQL execution in this planning phase|Signed URL creation in this planning phase|Public artifact creation in this planning phase|Final render\/export in this planning phase|Broad external beta unlock in this planning phase|Paid production unlock in this planning phase|Production unlock in this planning phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisPlanningPhase"\s*:\s*true/i,
  /"routeRegisteredAtRuntimeInThisPlanningPhase"\s*:\s*true/i,
  /"routeExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"workerDispatchInThisPlanningPhase"\s*:\s*true/i,
  /"workerExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"workerProcessStartInThisPlanningPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisPlanningPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisPlanningPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"dockerExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"remotionExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisPlanningPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisPlanningPhase"\s*:\s*true/i,
  /"supabaseMutationInThisPlanningPhase"\s*:\s*true/i,
  /"sqlExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisPlanningPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisPlanningPhase"\s*:\s*true/i,
  /"finalRenderExportInThisPlanningPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisPlanningPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisPlanningPhase"\s*:\s*true/i,
  /"productionUnlockInThisPlanningPhase"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath, runtimeRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-diagnostics.mjs'
) {
  fail('missing runtime integration planning diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.packet !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-QA-ROLLUP-1') {
  fail('source QA rollup packet mismatch')
}
if (sourceRecord.decision !== sourceDecision) fail('source QA rollup decision mismatch')
if (sourceRecord.execution !== 'completed_docs_only_narrow_controlled_worker_runtime_qa_rollup_no_runtime_execution') {
  fail('source QA rollup execution mismatch')
}
if (sourceRecord.integrationBase !== '470eedc8975dc3879d66909c5d63c6d362ece512') {
  fail('source QA rollup integration base mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source QA rollup next milestone mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source QA rollup product-ready count mismatch')
if (sourceRecord.packageLock !== 'unchanged') fail('source QA rollup package-lock mismatch')
if (sourceRecord.generatedArtifactsCommitted !== 'none') fail('source QA rollup generated artifacts mismatch')

const runtimeRecord = json(runtimeRecordPath)
if (runtimeRecord.decision !== runtimeDecision) fail('runtime record decision mismatch')
if (runtimeRecord.runId !== sourceRunId) fail('runtime record run ID mismatch')
if (runtimeRecord.sourceChain?.guardedRuntimeRunId !== guardedRunId) fail('runtime record guarded run ID mismatch')
if (runtimeRecord.productReadyEndToEndLocalOssTools !== 0) fail('runtime record product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.queueIntegrationPr !== 2028) fail('queue integration PR mismatch')
if (record.sourceChain?.dispatchDryRunPr !== 2036) fail('dispatch dry-run PR mismatch')
if (record.sourceChain?.runtimeExecutionPacketPr !== 2044) fail('runtime packet PR mismatch')
if (record.sourceChain?.runtimeExecutionPacketMergeSha !== '470eedc8975dc3879d66909c5d63c6d362ece512') {
  fail('runtime packet merge SHA mismatch')
}
if (record.sourceChain?.runtimeExecutionPacketRunId !== sourceRunId) fail('runtime packet run ID mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== guardedRunId) fail('guarded runtime run ID mismatch')
if (record.sourceChain?.runtimeQaRollupPr !== 2047) fail('runtime QA rollup PR mismatch')
if (record.sourceChain?.runtimeQaRollupMergeSha !== integrationBase) fail('runtime QA rollup merge SHA mismatch')
if (record.sourceChain?.runtimeQaRollupDecision !== sourceDecision) fail('runtime QA rollup decision mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.futureIntegrationPacket?.confirmationGate !== gate) fail('future confirmation gate mismatch')
if (record.futureIntegrationPacket?.sourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source') {
  fail('future source class mismatch')
}
for (const key of ['requiresApprovedSnapshotOrGeneratedFixtureEnvelope', 'requiresIdempotencyKey', 'requiresWorkerLeaseReference', 'requiresArtifactManifest', 'requiresQaReport']) {
  if (record.futureIntegrationPacket?.[key] !== true) fail(`future packet field must be true: ${key}`)
}
for (const key of ['gstreamer', 'mkvtoolnix', 'externalAgentRouteWorkerBoundary']) {
  if (record.readiness?.[key] !== readiness) fail(`readiness mismatch: ${key}`)
}
if (record.readiness?.runtimeIntegrationPlanning !== planningReadiness) fail('planning readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

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
