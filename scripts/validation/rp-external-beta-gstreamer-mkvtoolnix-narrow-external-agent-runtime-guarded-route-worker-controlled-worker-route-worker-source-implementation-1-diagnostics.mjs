#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-IMPLEMENTATION-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1-record.json`
const sourceQaRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-qa-rollup-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_route_worker_source_implementation'
const execution = 'completed_source_only_route_worker_files_created_not_registered_or_executed'
const sourceQaDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_route_worker_source_execution_packet_evidence'
const integrationBase = 'ee557c2322317f7fdc3e3f0f85b6571f9bf88fc4'
const readiness = 'ready_for_guarded_narrow_route_worker_source_implementation_qa_rollup'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-IMPLEMENTATION-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/source-implementation-boundary.md`,
  `${dir}/route-source-contract.md`,
  `${dir}/worker-source-contract.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1.md',
]

const sourceFiles = [
  'server/routes/gstreamer-mkvtoolnix-narrow-source-execution-boundary-route-source.ts',
  'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1-diagnostics.mjs',
]

const priorDiagnosticsAllowlistFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-qa-rollup-1-diagnostics.mjs',
]

const qaRollupFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1/evidence-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1/qa-decision.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-registration-plan-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...sourceFiles,
  ...priorDiagnosticsAllowlistFiles,
  ...qaRollupFiles,
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceQaDecision,
  'completed_gstreamer_mkvtoolnix_narrow_route_worker_source_execution_packet',
  '2026-07-02T01-15-31-287Z-6bbab797',
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION',
  'source_file_created_not_registered',
  'source_file_created_not_registered_not_dispatched',
  'metadata_only_queue_source_declared_no_persistent_write',
  'generated_fixture_only_narrow_controlled_worker_runtime_source',
  'required_before_future_runtime',
  'accepted_narrow_route_worker_source_implementation',
  'blocked_missing_narrow_route_worker_source_implementation_confirmation',
  'blocked_source_execution_packet_validation_failed',
  'blocked_route_source_validation_failed',
  'blocked_worker_source_validation_failed',
  'blocked_missing_source_execution_packet_qa_rollup',
  'blocked_source_implementation_idempotency_mismatch',
  'blocked_route_worker_or_tool_execution_not_enabled',
  `GStreamer readiness: \`${readiness}\``,
  `MKVToolNix readiness: \`${readiness}\``,
  `External-agent route/worker source readiness: \`${readiness}\``,
  'Route registered at runtime in this source implementation phase: `false`',
  'Production route file created in this source implementation phase: `false`',
  'Route execution in this source implementation phase: `false`',
  'Worker dispatch in this source implementation phase: `false`',
  'Worker execution in this source implementation phase: `false`',
  'Worker process start in this source implementation phase: `false`',
  'Worker lease claim in this source implementation phase: `false`',
  'Persistent job queue write in this source implementation phase: `false`',
  'GStreamer execution in this source implementation phase: `false`',
  'MKVToolNix execution in this source implementation phase: `false`',
  'Docker execution in this source implementation phase: `false`',
  'FFmpeg/FFprobe execution in this source implementation phase: `false`',
  'Remotion execution in this source implementation phase: `false`',
  'Supabase mutation in this source implementation phase: `false`',
  'SQL execution in this source implementation phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
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
  /\b(?:Route registered at runtime in this source implementation phase|Production route file created in this source implementation phase|Route execution in this source implementation phase|Worker dispatch in this source implementation phase|Worker execution in this source implementation phase|Worker process start in this source implementation phase|Worker lease claim in this source implementation phase|Persistent job queue write in this source implementation phase|GStreamer execution in this source implementation phase|MKVToolNix execution in this source implementation phase|Docker execution in this source implementation phase|FFmpeg\/FFprobe execution in this source implementation phase|Remotion execution in this source implementation phase|Media processing in this source implementation phase|Private media processing in this source implementation phase|User media processing in this source implementation phase|Supabase mutation in this source implementation phase|SQL execution in this source implementation phase|Signed URL creation in this source implementation phase|Public artifact creation in this source implementation phase|Final render\/export in this source implementation phase|Broad external beta unlock in this source implementation phase|Paid production unlock in this source implementation phase|Production unlock in this source implementation phase):\s*`?(true|enabled|completed|run|executed)\b/i,
  /"routeRegisteredAtRuntimeInThisSourceImplementationPhase"\s*:\s*true/i,
  /"productionRouteFileCreatedInThisSourceImplementationPhase"\s*:\s*true/i,
  /"routeExecutionInThisSourceImplementationPhase"\s*:\s*true/i,
  /"workerDispatchInThisSourceImplementationPhase"\s*:\s*true/i,
  /"workerExecutionInThisSourceImplementationPhase"\s*:\s*true/i,
  /"workerProcessStartInThisSourceImplementationPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisSourceImplementationPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisSourceImplementationPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisSourceImplementationPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisSourceImplementationPhase"\s*:\s*true/i,
  /"dockerExecutionInThisSourceImplementationPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisSourceImplementationPhase"\s*:\s*true/i,
  /"remotionExecutionInThisSourceImplementationPhase"\s*:\s*true/i,
  /"mediaProcessingInThisSourceImplementationPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisSourceImplementationPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisSourceImplementationPhase"\s*:\s*true/i,
  /"supabaseMutationInThisSourceImplementationPhase"\s*:\s*true/i,
  /"sqlExecutionInThisSourceImplementationPhase"\s*:\s*true/i,
  /"providerCallInThisSourceImplementationPhase"\s*:\s*true/i,
  /"modelCallInThisSourceImplementationPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisSourceImplementationPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisSourceImplementationPhase"\s*:\s*true/i,
  /"finalRenderExportInThisSourceImplementationPhase"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...sourceFiles, sourceQaRecordPath]) read(file)

const packageJson = json('package.json')
const expectedScripts = {
  'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1':
    'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1-smoke.ts',
  'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1:diagnostics':
    'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1-diagnostics.mjs',
  'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1:diagnostics':
    'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-diagnostics.mjs',
}
for (const [name, command] of Object.entries(expectedScripts)) {
  if (packageJson.scripts?.[name] !== command) fail(`missing package script: ${name}`)
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceQa = json(sourceQaRecordPath)
if (sourceQa.decision !== sourceQaDecision) fail('source QA decision mismatch')
if (sourceQa.sourceChain?.routeWorkerSourceExecutionPacketPr !== 2080) fail('source packet PR mismatch')
if (sourceQa.sourceChain?.routeWorkerSourceExecutionPacketMergeSha !== '5161db42c75791f21561e4a667babd59c86381af') {
  fail('source packet merge mismatch')
}
if (sourceQa.nextMilestone !== packet) fail('source QA next milestone mismatch')
if (sourceQa.productReadyEndToEndLocalOssTools !== 0) fail('source QA product-ready count mismatch')
if (sourceQa.packageLock !== 'unchanged') fail('source QA package-lock mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.routeWorkerSourceExecutionPacketQaRollupPr !== 2085) fail('QA rollup PR mismatch')
if (record.sourceChain?.routeWorkerSourceExecutionPacketQaRollupMergeSha !== integrationBase) fail('QA rollup merge mismatch')
if (record.sourceChain?.routeWorkerSourceExecutionPacketQaRollupDecision !== sourceQaDecision) fail('QA rollup decision mismatch')
if (record.sourceChain?.routeWorkerSourceExecutionPacketRunId !== '2026-07-02T01-15-31-287Z-6bbab797') fail('source run mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.confirmationGate !== 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION') {
  fail('confirmation gate mismatch')
}
if (record.sourceImplementation?.status !== 'completed_narrow_route_worker_source_implementation') fail('implementation status mismatch')
if (record.sourceImplementation?.responseShape !== 'accepted_narrow_route_worker_source_implementation') fail('response shape mismatch')
if (record.sourceImplementation?.routeSourceMode !== 'source_file_created_not_registered') fail('route source mode mismatch')
if (record.sourceImplementation?.workerSourceMode !== 'source_file_created_not_registered_not_dispatched') fail('worker source mode mismatch')
if (record.sourceImplementation?.queueSourceMode !== 'metadata_only_queue_source_declared_no_persistent_write') fail('queue source mode mismatch')
if (record.sourceImplementation?.sourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source') fail('source class mismatch')
if (record.sourceImplementation?.approvedSnapshotRequirement !== 'required_before_future_runtime') fail('approved snapshot requirement mismatch')
if (record.sourceImplementation?.generatedFixtureEvidenceAccepted !== true) fail('generated fixture evidence mismatch')
for (const key of ['gstreamer', 'mkvtoolnix', 'externalAgentRouteWorkerSource']) {
  if (record.readiness?.[key] !== readiness) fail(`readiness mismatch: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (!['pending_final_validation', 'passed'].includes(record.validation)) fail('validation status mismatch')
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

const changedCorpus = uniqueChanged
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map((file) => read(file))
  .join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden claim matched in changed files: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  changedFiles: uniqueChanged,
  nextMilestone,
  safety: 'route_worker_tool_media_supabase_sql_unlock_paths_not_enabled',
}, null, 2))
