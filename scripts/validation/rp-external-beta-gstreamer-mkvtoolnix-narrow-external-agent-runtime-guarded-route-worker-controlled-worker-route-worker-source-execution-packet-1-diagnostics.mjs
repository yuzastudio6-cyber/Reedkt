#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-EXECUTION-PACKET-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1-record.json`
const sourceQaRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_route_worker_source_execution_packet'
const execution =
  'completed_confirmation_gated_narrow_route_worker_source_execution_packet_metadata_only_no_route_worker_tool_or_media_execution'
const sourceQaDecision =
  'qa_passed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_implementation_source_envelope_evidence'
const sourceImplementationDecision =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_implementation_source_envelope'
const sourceImplementationExecution =
  'completed_confirmation_gated_narrow_controlled_worker_runtime_integration_implementation_metadata_only_no_route_worker_or_tool_execution'
const integrationBase = 'd84252da9b7e09a493110dd24b884c0cb3c7dc8f'
const implementationMergeSha = '6dc0dee942eedb2e15de741b39d853f9e9ce99ef'
const sourceRunId = '2026-07-02T00-34-22-766Z-c5302439'
const runId = '2026-07-02T01-15-31-287Z-6bbab797'
const readiness = 'ready_for_guarded_narrow_route_worker_source_execution_packet_qa_rollup'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-EXECUTION-PACKET-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/source-execution-envelope.md`,
  `${dir}/execution-result.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-qa-rollup-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...sourceFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceQaDecision,
  implementationMergeSha,
  sourceRunId,
  runId,
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_PACKET=true',
  'metadata_only_route_source_declared_no_runtime_registration',
  'metadata_only_worker_source_declared_no_process_start',
  'metadata_only_queue_source_declared_no_persistent_write',
  'metadata_only_source_execution_packet_no_runtime_execution',
  'generated_fixture_only_narrow_controlled_worker_runtime_source',
  'accepted_narrow_route_worker_source_execution_packet',
  'blocked_missing_narrow_route_worker_source_execution_confirmation',
  'blocked_missing_runtime_integration_implementation_qa_source',
  'blocked_invalid_route_worker_source_execution_state',
  'blocked_runtime_execution_not_enabled',
  'blocked_route_worker_source_execution_idempotency_mismatch',
  '8866c66fc61aa3726ad60cfd7c7baaae9eb2543a9b3f14a94bfbd5bac53b94e1',
  'cc30ec18a545ae27f22198269f68560d12fb7ca2af97f160d67dfeac15958488',
  '3d56522579a215557a79dd2fd4dd0a5c7f271247abf06e11b9ddff13a9a69eba',
  'dd046dda184ecc07e1ddc22291a451876a1b94976697b5dfbb3259b7c03a1901',
  '1216e3cfa1c4dc58caeba53c10a6c8f11e6f97071009d6c4651ff82fffbca8f3',
  `GStreamer readiness: \`${readiness}\``,
  `MKVToolNix readiness: \`${readiness}\``,
  `External-agent route/worker boundary readiness: \`${readiness}\``,
  'Route registered at runtime in this source-execution packet phase: `false`',
  'Production route file created in this source-execution packet phase: `false`',
  'Route execution in this source-execution packet phase: `false`',
  'Worker dispatch in this source-execution packet phase: `false`',
  'Worker execution in this source-execution packet phase: `false`',
  'Worker process start in this source-execution packet phase: `false`',
  'Worker lease claim in this source-execution packet phase: `false`',
  'Persistent job queue write in this source-execution packet phase: `false`',
  'GStreamer execution in this source-execution packet phase: `false`',
  'MKVToolNix execution in this source-execution packet phase: `false`',
  'Docker execution in this source-execution packet phase: `false`',
  'FFmpeg/FFprobe execution in this source-execution packet phase: `false`',
  'Supabase mutation in this source-execution packet phase: `false`',
  'SQL execution in this source-execution packet phase: `false`',
  'Signed URL creation in this source-execution packet phase: `false`',
  'Public artifact creation in this source-execution packet phase: `false`',
  'Final render/export in this source-execution packet phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
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
  /\b(?:Route registered at runtime in this source-execution packet phase|Production route file created in this source-execution packet phase|Route execution in this source-execution packet phase|Worker dispatch in this source-execution packet phase|Worker execution in this source-execution packet phase|Worker process start in this source-execution packet phase|Worker lease claim in this source-execution packet phase|Persistent job queue write in this source-execution packet phase|GStreamer execution in this source-execution packet phase|MKVToolNix execution in this source-execution packet phase|Docker execution in this source-execution packet phase|FFmpeg\/FFprobe execution in this source-execution packet phase|Remotion execution in this source-execution packet phase|Media processing in this source-execution packet phase|Private media processing in this source-execution packet phase|User media processing in this source-execution packet phase|Supabase mutation in this source-execution packet phase|SQL execution in this source-execution packet phase|Signed URL creation in this source-execution packet phase|Public artifact creation in this source-execution packet phase|Final render\/export in this source-execution packet phase|Broad external beta unlock in this source-execution packet phase|Paid production unlock in this source-execution packet phase|Production unlock in this source-execution packet phase):\s*`?(true|enabled|completed|run|executed)\b/i,
  /"routeRegisteredAtRuntimeInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"productionRouteFileCreatedInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"routeExecutionInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"workerDispatchInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"workerExecutionInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"workerProcessStartInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"dockerExecutionInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"remotionExecutionInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"mediaProcessingInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"supabaseMutationInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"sqlExecutionInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"providerCallInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"modelCallInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"finalRenderExportInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisSourceExecutionPacketPhase"\s*:\s*true/i,
  /"productionUnlockInThisSourceExecutionPacketPhase"\s*:\s*true/i,
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
  'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1':
    'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1-smoke.ts',
  'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1':
    'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1.ts',
  'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1:diagnostics':
    'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1-diagnostics.mjs',
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

const source = json(sourceQaRecordPath)
if (source.decision !== sourceQaDecision) fail('source QA decision mismatch')
if (source.sourceChain?.runtimeIntegrationImplementationMergeSha !== implementationMergeSha) fail('source implementation merge mismatch')
if (source.sourceChain?.runtimeIntegrationImplementationRunId !== sourceRunId) fail('source implementation run mismatch')
if (source.sourceChain?.runtimeIntegrationImplementationDecision !== sourceImplementationDecision) fail('source implementation decision mismatch')
if (source.sourceChain?.runtimeIntegrationImplementationExecution !== sourceImplementationExecution) fail('source implementation execution mismatch')
if (source.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 source exclusion mismatch')
if (source.readiness?.externalAgentRouteWorkerBoundary !== 'ready_for_guarded_narrow_route_worker_source_execution_packet') fail('source readiness mismatch')
if (source.validation !== 'passed') fail('source validation mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationQaRollupPr !== 2074) fail('source QA PR mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationQaRollupMergeSha !== integrationBase) fail('source QA merge mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationQaRollupDecision !== sourceQaDecision) fail('source QA decision field mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationPr !== 2065) fail('source implementation PR field mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationMergeSha !== implementationMergeSha) fail('source implementation merge field mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationRunId !== sourceRunId) fail('source implementation run field mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationDecision !== sourceImplementationDecision) fail('source implementation decision field mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationExecution !== sourceImplementationExecution) fail('source implementation execution field mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.confirmationGate !== 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_PACKET=true') fail('confirmation gate mismatch')
if (record.routeWorkerSourceExecutionPacket?.status !== 'completed_narrow_route_worker_source_execution_packet') fail('packet status mismatch')
if (record.routeWorkerSourceExecutionPacket?.responseShape !== 'accepted_narrow_route_worker_source_execution_packet') fail('response shape mismatch')
if (record.routeWorkerSourceExecutionPacket?.routeSourceMode !== 'metadata_only_route_source_declared_no_runtime_registration') fail('route source mode mismatch')
if (record.routeWorkerSourceExecutionPacket?.workerSourceMode !== 'metadata_only_worker_source_declared_no_process_start') fail('worker source mode mismatch')
if (record.routeWorkerSourceExecutionPacket?.queueSourceMode !== 'metadata_only_queue_source_declared_no_persistent_write') fail('queue source mode mismatch')
if (record.routeWorkerSourceExecutionPacket?.sourceExecutionMode !== 'metadata_only_source_execution_packet_no_runtime_execution') fail('source execution mode mismatch')
if (record.routeWorkerSourceExecutionPacket?.sourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source') fail('source class mismatch')
if (record.routeWorkerSourceExecutionPacket?.approvedSnapshotRequirement !== 'required_before_future_runtime') fail('approved snapshot requirement mismatch')
if (record.routeWorkerSourceExecutionPacket?.generatedFixtureEvidenceAccepted !== true) fail('generated fixture evidence mismatch')
for (const key of ['positiveValidation', 'negativeMatrix', 'sourceQaRollupReview', 'routeWorkerBoundaryReview', 'safetyReview']) {
  if (record.qa?.[key] !== 'passed') fail(`QA field mismatch: ${key}`)
}
for (const [name, artifact] of Object.entries(record.artifacts ?? {})) {
  if (typeof artifact?.bytes !== 'number' || artifact.bytes <= 0) fail(`artifact bytes missing for ${name}`)
  if (!/^[a-f0-9]{64}$/.test(String(artifact?.sha256))) fail(`artifact checksum missing for ${name}`)
}
for (const key of ['gstreamer', 'mkvtoolnix', 'externalAgentRouteWorkerBoundary']) {
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

const serviceSource = read(sourceFiles[0])
for (const text of [
  packet,
  decision,
  execution,
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_PACKET',
  'metadata_only_route_source_declared_no_runtime_registration',
  'metadata_only_worker_source_declared_no_process_start',
  'metadata_only_queue_source_declared_no_persistent_write',
  'metadata_only_source_execution_packet_no_runtime_execution',
  'generated_fixture_only_narrow_controlled_worker_runtime_source',
  'required_before_future_runtime',
  'accepted_narrow_route_worker_source_execution_packet',
  nextMilestone,
]) {
  if (!serviceSource.includes(text)) fail(`service source missing required text: ${text}`)
}
for (const forbidden of ['createClient(', 'service_role', 'SUPABASE_SERVICE_ROLE', 'child_process', 'execFile', 'spawn(', 'docker ', 'gst-launch', 'mkvmerge ', 'ffprobe ', 'ffmpeg ']) {
  if (serviceSource.includes(forbidden)) fail(`service source includes forbidden runtime signal: ${forbidden}`)
}

const runnerSource = read(sourceFiles[2])
if (!runnerSource.includes('process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_CONFIRM_ENV]')) fail('runner missing confirmation check')
for (const forbidden of ['execFile(', 'spawn(', 'docker ', 'gst-launch', 'mkvmerge ', 'ffprobe ', 'ffmpeg ', 'createClient(']) {
  if (runnerSource.includes(forbidden)) fail(`runner includes forbidden runtime signal: ${forbidden}`)
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
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const content = fs.readFileSync(file, 'utf8')
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(content)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
