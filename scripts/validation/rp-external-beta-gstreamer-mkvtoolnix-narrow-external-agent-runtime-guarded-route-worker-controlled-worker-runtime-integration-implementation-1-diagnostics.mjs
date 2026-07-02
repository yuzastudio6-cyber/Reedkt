#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-IMPLEMENTATION-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-record.json`
const sourceQaRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-qa-rollup-1-record.json'
const decision =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_implementation_source_envelope'
const execution =
  'completed_confirmation_gated_narrow_controlled_worker_runtime_integration_implementation_metadata_only_no_route_worker_or_tool_execution'
const integrationBase = 'c26213e85bb9305c7270229432495810ede6ee87'
const sourceQaDecision =
  'qa_passed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_packet_source_envelope_evidence'
const confirmEnv =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_RUNTIME_INTEGRATION_IMPLEMENTATION=true'
const readyStatus =
  'ready_for_guarded_narrow_route_worker_runtime_integration_implementation_qa_rollup'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-IMPLEMENTATION-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/implementation-result.md`,
  `${dir}/integration-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-qa-rollup-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...implementationFiles,
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceQaDecision,
  confirmEnv,
  'Source class: `generated_fixture_only_narrow_controlled_worker_runtime_source`',
  'Source QA status: `passed_source_evidence_review`',
  'Runtime integration mode: `metadata_only_generated_fixture_source_envelope`',
  'Route binding mode: `deferred_no_route_registration`',
  'Worker dispatch mode: `deferred_no_worker_dispatch`',
  'Worker lease mode: `deferred_no_worker_lease_claim`',
  'runtime-integration-implementation-gstreamer-mkvtoolnix-narrow-controlled-worker-1',
  'externalBeta.gstreamerMkvtoolnix.narrowControlledWorkerRuntimeIntegrationImplementation1',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1.ts',
  'narrow-runtime-integration-implementation-input.json',
  'narrow-runtime-integration-implementation-envelope.json',
  'narrow-runtime-integration-implementation-qa-report.json',
  'narrow-runtime-integration-implementation-report.json',
  'narrow-runtime-integration-implementation-manifest.json',
  `GStreamer readiness: \`${readyStatus}\``,
  `MKVToolNix readiness: \`${readyStatus}\``,
  `External-agent route/worker boundary readiness: \`${readyStatus}\``,
  'Route registered at runtime in this implementation phase: `false`',
  'Production route file created in this implementation phase: `false`',
  'Route execution in this implementation phase: `false`',
  'Worker dispatch in this implementation phase: `false`',
  'Worker execution in this implementation phase: `false`',
  'Worker process start in this implementation phase: `false`',
  'Worker lease claim in this implementation phase: `false`',
  'Persistent job queue write in this implementation phase: `false`',
  'GStreamer execution in this implementation phase: `false`',
  'MKVToolNix execution in this implementation phase: `false`',
  'Docker execution in this implementation phase: `false`',
  'FFmpeg/FFprobe execution in this implementation phase: `false`',
  'Remotion execution in this implementation phase: `false`',
  'Media processing in this implementation phase: `false`',
  'Private media processing in this implementation phase: `false`',
  'User media processing in this implementation phase: `false`',
  'Supabase mutation in this implementation phase: `false`',
  'SQL execution in this implementation phase: `false`',
  'Signed URL creation in this implementation phase: `false`',
  'Public artifact creation in this implementation phase: `false`',
  'Final render/export in this implementation phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Validation status: `passed`',
  'Host disk closure',
  'cf8c175bce2e38897b5c419d395faa0ee8000aa4b5edd9485f37bb8a0e03967f',
  '9758827ff49ee6c04b7cf33c40662887b0d2ed7ecc074a12459724578260cfe4',
  '0e0966620b2c5f5d92027dad5d4a4448dd874263d5f5bd32f40fcebc7eb5a850',
  'f83ce9caa97187f7ab10a6a487f2d1742b7d358856ee16e09ebd674e05cb3f6f',
  '7c2b99caa5f035dbac77e1725eb25ee076e8b8f69da57b92036c899d5428b700',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-smoke\.ts$)/,
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
  /\bpending_runner_validation\b/i,
  /\bpending_final_validation\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Route registered at runtime in this implementation phase|Production route file created in this implementation phase|Route execution in this implementation phase|Worker dispatch in this implementation phase|Worker execution in this implementation phase|Worker process start in this implementation phase|Worker lease claim in this implementation phase|Persistent job queue write in this implementation phase|GStreamer execution in this implementation phase|MKVToolNix execution in this implementation phase|Docker execution in this implementation phase|FFmpeg\/FFprobe execution in this implementation phase|Remotion execution in this implementation phase|Media processing in this implementation phase|Private media processing in this implementation phase|User media processing in this implementation phase|Supabase mutation in this implementation phase|SQL execution in this implementation phase|Signed URL creation in this implementation phase|Public artifact creation in this implementation phase|Final render\/export in this implementation phase|Broad external beta unlock in this implementation phase|Paid production unlock in this implementation phase|Production unlock in this implementation phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeRegisteredAtRuntimeInThisImplementationPhase"\s*:\s*true/i,
  /"productionRouteFileCreatedInThisImplementationPhase"\s*:\s*true/i,
  /"routeExecutionInThisImplementationPhase"\s*:\s*true/i,
  /"workerDispatchInThisImplementationPhase"\s*:\s*true/i,
  /"workerExecutionInThisImplementationPhase"\s*:\s*true/i,
  /"workerProcessStartInThisImplementationPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisImplementationPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisImplementationPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisImplementationPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisImplementationPhase"\s*:\s*true/i,
  /"dockerExecutionInThisImplementationPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisImplementationPhase"\s*:\s*true/i,
  /"remotionExecutionInThisImplementationPhase"\s*:\s*true/i,
  /"mediaProcessingInThisImplementationPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisImplementationPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisImplementationPhase"\s*:\s*true/i,
  /"supabaseMutationInThisImplementationPhase"\s*:\s*true/i,
  /"sqlExecutionInThisImplementationPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisImplementationPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisImplementationPhase"\s*:\s*true/i,
  /"finalRenderExportInThisImplementationPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisImplementationPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisImplementationPhase"\s*:\s*true/i,
  /"productionUnlockInThisImplementationPhase"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles, sourceQaRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-smoke.ts'
) fail('missing runtime integration implementation smoke package script')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1'
  ] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1.ts'
) fail('missing runtime integration implementation runner package script')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1-diagnostics.mjs'
) fail('missing runtime integration implementation diagnostics package script')

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceQaRecord = json(sourceQaRecordPath)
if (sourceQaRecord.packet !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PACKET-QA-ROLLUP-1') {
  fail('source QA rollup packet mismatch')
}
if (sourceQaRecord.decision !== sourceQaDecision) fail('source QA rollup decision mismatch')
if (sourceQaRecord.validation !== 'passed') fail('source QA validation mismatch')
if (sourceQaRecord.productReadyEndToEndLocalOssTools !== 0) fail('source QA product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.confirmationGate !== confirmEnv) fail('confirmation gate mismatch')
if (record.sourceChain?.runtimeIntegrationPacketQaRollupPr !== 2059) fail('source QA PR mismatch')
if (record.sourceChain?.runtimeIntegrationPacketQaRollupMergeSha !== integrationBase) fail('source QA merge mismatch')
if (record.sourceChain?.runtimeIntegrationPacketQaRollupDecision !== sourceQaDecision) {
  fail('source QA decision reference mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 source exclusion mismatch')
if (record.integrationEnvelope?.runtimeIntegrationMode !== 'metadata_only_generated_fixture_source_envelope') {
  fail('runtime integration mode mismatch')
}
if (record.integrationEnvelope?.routeBindingMode !== 'deferred_no_route_registration') fail('route binding mode mismatch')
if (record.integrationEnvelope?.workerDispatchMode !== 'deferred_no_worker_dispatch') fail('worker dispatch mode mismatch')
if (record.integrationEnvelope?.workerLeaseMode !== 'deferred_no_worker_lease_claim') fail('worker lease mode mismatch')
if (record.integrationEnvelope?.acceptedSourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source') {
  fail('accepted source class mismatch')
}
if (record.integrationEnvelope?.generatedFixtureEvidenceAccepted !== true) fail('generated fixture evidence mismatch')
if (record.integrationEnvelope?.routeRegisteredAtRuntime !== false) fail('route registration flag mismatch')
if (record.integrationEnvelope?.productionRouteFileCreated !== false) fail('production route flag mismatch')
if (record.readiness?.gstreamer !== readyStatus) fail('gstreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readyStatus) fail('mkvtoolnix readiness mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if ('blocker' in record) fail('unexpected validation blocker remains recorded')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const safety = record.safety ?? {}
for (const [key, value] of Object.entries(safety)) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}

for (const [name, artifact] of Object.entries(record.artifacts ?? {})) {
  if (typeof artifact?.bytes !== 'number' || artifact.bytes <= 0) fail(`artifact bytes missing for ${name}`)
  if (!/^[a-f0-9]{64}$/.test(String(artifact?.sha256))) fail(`artifact checksum missing for ${name}`)
}

const changedFiles = gitLines(['diff', '--name-only'])
const stagedFiles = gitLines(['diff', '--cached', '--name-only'])
const statusFiles = gitLines(['status', '--short', '--untracked-files=all']).map((line) =>
  line.replace(/^.{1,2}\s+/, ''),
)
const filesToCheck = [...new Set([...changedFiles, ...stagedFiles, ...statusFiles])]

for (const file of filesToCheck) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed/staged file: ${file}`)
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed/staged path: ${file}`)
}

const packageLockStatus = gitLines(['status', '--short', '--', 'package-lock.json'])
if (packageLockStatus.length) fail('package-lock.json is changed')

const generatedArtifactFiles = filesToCheck.filter((file) =>
  /(^|\/)(dist|node_modules|tmp|fixture|artifacts?|outputs?)(\/|$)/i.test(file) ||
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|jsonl)$/i.test(file) && !packetFiles.includes(file)
)
if (generatedArtifactFiles.length) fail(`generated artifact paths changed: ${generatedArtifactFiles.join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  packet,
  checkedFiles: filesToCheck,
  decision,
  execution,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
