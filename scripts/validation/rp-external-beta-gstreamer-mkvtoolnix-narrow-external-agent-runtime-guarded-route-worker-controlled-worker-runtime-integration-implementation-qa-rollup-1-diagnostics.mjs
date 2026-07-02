#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-IMPLEMENTATION-QA-ROLLUP-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-record.json'
const decision =
  'qa_passed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_implementation_source_envelope_evidence'
const execution =
  'completed_docs_only_narrow_controlled_worker_runtime_integration_implementation_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceDecision =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_implementation_source_envelope'
const sourceExecution =
  'completed_confirmation_gated_narrow_controlled_worker_runtime_integration_implementation_metadata_only_no_route_worker_or_tool_execution'
const integrationBase = '6dc0dee942eedb2e15de741b39d853f9e9ce99ef'
const sourceHead = 'c11cd95538f1003faa0ceab69ff0a970095892ea'
const runId = '2026-07-02T00-34-22-766Z-c5302439'
const readiness = 'ready_for_guarded_narrow_route_worker_source_execution_packet'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/qa-decision.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceHead,
  sourceDecision,
  sourceExecution,
  `Source run ID: \`${runId}\``,
  'Source implementation PR: `#2065`',
  'Source implementation merge SHA: `6dc0dee942eedb2e15de741b39d853f9e9ce99ef`',
  'Source implementation head SHA: `c11cd95538f1003faa0ceab69ff0a970095892ea`',
  'passed_after_disk_space_closure',
  'deferred_no_route_registration',
  'deferred_no_worker_dispatch',
  'deferred_no_worker_lease_claim',
  'deferred_no_persistent_job_queue_write',
  'generated_fixture_only_narrow_controlled_worker_runtime_source',
  'cf8c175bce2e38897b5c419d395faa0ee8000aa4b5edd9485f37bb8a0e03967f',
  '9758827ff49ee6c04b7cf33c40662887b0d2ed7ecc074a12459724578260cfe4',
  '0e0966620b2c5f5d92027dad5d4a4448dd874263d5f5bd32f40fcebc7eb5a850',
  'f83ce9caa97187f7ab10a6a487f2d1742b7d358856ee16e09ebd674e05cb3f6f',
  '7c2b99caa5f035dbac77e1725eb25ee076e8b8f69da57b92036c899d5428b700',
  `GStreamer readiness: \`${readiness}\``,
  `MKVToolNix readiness: \`${readiness}\``,
  `External-agent route/worker boundary readiness: \`${readiness}\``,
  'Route registered at runtime in this QA rollup phase: `false`',
  'Production route file created in this QA rollup phase: `false`',
  'Route execution in this QA rollup phase: `false`',
  'Worker dispatch in this QA rollup phase: `false`',
  'Worker execution in this QA rollup phase: `false`',
  'Worker process start in this QA rollup phase: `false`',
  'Worker lease claim in this QA rollup phase: `false`',
  'Persistent job queue write in this QA rollup phase: `false`',
  'GStreamer execution in this QA rollup phase: `false`',
  'MKVToolNix execution in this QA rollup phase: `false`',
  'Docker execution in this QA rollup phase: `false`',
  'FFmpeg/FFprobe execution in this QA rollup phase: `false`',
  'Supabase mutation in this QA rollup phase: `false`',
  'SQL execution in this QA rollup phase: `false`',
  'Signed URL creation in this QA rollup phase: `false`',
  'Public artifact creation in this QA rollup phase: `false`',
  'Final render/export in this QA rollup phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
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
  /\b(?:Route registered at runtime in this QA rollup phase|Production route file created in this QA rollup phase|Route execution in this QA rollup phase|Worker dispatch in this QA rollup phase|Worker execution in this QA rollup phase|Worker process start in this QA rollup phase|Worker lease claim in this QA rollup phase|Persistent job queue write in this QA rollup phase|GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|Docker execution in this QA rollup phase|FFmpeg\/FFprobe execution in this QA rollup phase|Remotion execution in this QA rollup phase|Private media processing in this QA rollup phase|User media processing in this QA rollup phase|Media processing in this QA rollup phase|Supabase mutation in this QA rollup phase|SQL execution in this QA rollup phase|Signed URL creation in this QA rollup phase|Public artifact creation in this QA rollup phase|Final render\/export in this QA rollup phase|Broad external beta unlock in this QA rollup phase|Paid production unlock in this QA rollup phase|Production unlock in this QA rollup phase):\s*`?(true|enabled|completed|run|executed)\b/i,
  /"routeRegisteredAtRuntimeInThisQaRollupPhase"\s*:\s*true/i,
  /"productionRouteFileCreatedInThisQaRollupPhase"\s*:\s*true/i,
  /"routeExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"workerDispatchInThisQaRollupPhase"\s*:\s*true/i,
  /"workerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"workerProcessStartInThisQaRollupPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisQaRollupPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisQaRollupPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"dockerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"remotionExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"mediaProcessingInThisQaRollupPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisQaRollupPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisQaRollupPhase"\s*:\s*true/i,
  /"supabaseMutationInThisQaRollupPhase"\s*:\s*true/i,
  /"sqlExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"finalRenderExportInThisQaRollupPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisQaRollupPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisQaRollupPhase"\s*:\s*true/i,
  /"productionUnlockInThisQaRollupPhase"\s*:\s*true/i,
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

for (const file of [...packetFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing runtime integration implementation QA rollup diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const source = json(sourceRecordPath)
if (source.packet !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-IMPLEMENTATION-1') fail('source packet mismatch')
if (source.integrationBase !== 'c26213e85bb9305c7270229432495810ede6ee87') fail('source integration base mismatch')
if (source.decision !== sourceDecision) fail('source decision mismatch')
if (source.execution !== sourceExecution) fail('source execution mismatch')
if (source.runId !== runId) fail('source run ID mismatch')
if (source.sourceChain?.runtimeIntegrationPacketQaRollupPr !== 2059) fail('source QA rollup PR mismatch')
if (source.sourceChain?.runtimeIntegrationPacketQaRollupMergeSha !== 'c26213e85bb9305c7270229432495810ede6ee87') fail('source QA rollup merge mismatch')
if (source.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 source exclusion mismatch')
if (source.integrationEnvelope?.runtimeIntegrationMode !== 'metadata_only_generated_fixture_source_envelope') fail('source runtime integration mode mismatch')
if (source.integrationEnvelope?.routeBindingMode !== 'deferred_no_route_registration') fail('source route binding mismatch')
if (source.integrationEnvelope?.workerDispatchMode !== 'deferred_no_worker_dispatch') fail('source worker dispatch mismatch')
if (source.integrationEnvelope?.workerLeaseMode !== 'deferred_no_worker_lease_claim') fail('source worker lease mismatch')
if (source.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')
if (source.packageLock !== 'unchanged') fail('source package-lock mismatch')
if (source.generatedArtifactsCommitted !== 'none') fail('source generated artifact mismatch')
if (source.validation !== 'passed') fail('source validation mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationPr !== 2065) fail('source PR mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationHeadSha !== sourceHead) fail('source head mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationMergeSha !== integrationBase) fail('source merge mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationRunId !== runId) fail('source run mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationDecision !== sourceDecision) fail('source decision field mismatch')
if (record.sourceChain?.runtimeIntegrationImplementationExecution !== sourceExecution) fail('source execution field mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.qa?.scope !== 'source_evidence_review_only') fail('QA scope mismatch')
for (const key of [
  'sourceEnvelopeReview',
  'validationClosureReview',
  'checksumReview',
  'commandMatrixReview',
  'routeWorkerBoundaryReview',
  'generatedFixtureBoundaryReview',
]) {
  if (record.qa?.[key] !== 'passed') fail(`QA field mismatch: ${key}`)
}
if (record.qa?.acceptedSourceStatus !== sourceDecision) fail('accepted source status mismatch')
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
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const content = fs.readFileSync(file, 'utf8')
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(content)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
