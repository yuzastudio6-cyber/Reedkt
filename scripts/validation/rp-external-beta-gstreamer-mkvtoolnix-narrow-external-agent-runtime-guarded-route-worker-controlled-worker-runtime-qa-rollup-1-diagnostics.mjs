#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-QA-ROLLUP-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-record.json`
const runtimeRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-record.json'
const decision =
  'qa_passed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_execution_packet_generated_fixture_evidence'
const execution = 'completed_docs_only_narrow_controlled_worker_runtime_qa_rollup_no_runtime_execution'
const integrationBase = '470eedc8975dc3879d66909c5d63c6d362ece512'
const sourceDecision =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only'
const sourceExecution =
  'completed_confirmation_gated_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch'
const sourceRunId = '2026-07-01T20-56-05-033Z-b0ec74d8'
const guardedRunId = '2026-07-01T20-56-05-092Z-9330089b'
const readiness = 'ready_for_guarded_narrow_route_worker_runtime_integration_planning'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PLANNING-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/qa-decision.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-diagnostics.mjs',
]

const runtimeIntegrationPlanningDir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1'
const runtimeIntegrationPlanningFiles = [
  `${runtimeIntegrationPlanningDir}/source-audit.md`,
  `${runtimeIntegrationPlanningDir}/integration-contract.md`,
  `${runtimeIntegrationPlanningDir}/route-worker-boundary.md`,
  `${runtimeIntegrationPlanningDir}/work-graph-and-manifest-plan.md`,
  `${runtimeIntegrationPlanningDir}/readiness.md`,
  `${runtimeIntegrationPlanningDir}/safety-boundary.md`,
  `${runtimeIntegrationPlanningDir}/validation-results.md`,
  `${runtimeIntegrationPlanningDir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...runtimeIntegrationPlanningFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  `Source runtime packet run ID: \`${sourceRunId}\``,
  `Guarded generated-fixture runtime run ID: \`${guardedRunId}\``,
  'Source runtime packet PR: `#2044`',
  'Source runtime packet merge SHA: `470eedc8975dc3879d66909c5d63c6d362ece512`',
  'GStreamer command scope',
  'MKVToolNix command scope',
  'Docker scope',
  'Route/worker boundary',
  'Artifact boundary',
  '0efe96d011b860a9477157883363814b4e417cddd6894110af3b7b091a2bc97a',
  '238a8b9ff5a04d4e3735114917876963697a8818798f58081f03949c83f5300a',
  'f46b27090bd493bd450cdae8312a7f9a03536efa38d1567b757bba2aa6ba939d',
  '4a79c11f3f391753c72941a672dcda9e8a0e72e32020a52f03c661d0e1f1567d',
  '452986a7673704bf3af3adfdb97fe6978b3a999ab9f94aad958c9c8b05f7ae07',
  `GStreamer readiness: \`${readiness}\``,
  `MKVToolNix readiness: \`${readiness}\``,
  `External-agent route/worker boundary readiness: \`${readiness}\``,
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
  /\b(?:Route execution in this QA rollup phase|Worker dispatch in this QA rollup phase|Worker execution in this QA rollup phase|Worker process start in this QA rollup phase|Worker lease claim in this QA rollup phase|Persistent job queue write in this QA rollup phase|GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|Docker execution in this QA rollup phase|FFmpeg\/FFprobe execution in this QA rollup phase|Remotion execution in this QA rollup phase|Private media processing in this QA rollup phase|User media processing in this QA rollup phase|Supabase mutation in this QA rollup phase|SQL execution in this QA rollup phase|Signed URL creation in this QA rollup phase|Public artifact creation in this QA rollup phase|Final render\/export in this QA rollup phase|Broad external beta unlock in this QA rollup phase|Paid production unlock in this QA rollup phase|Production unlock in this QA rollup phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
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

for (const file of [...packetFiles, ...implementationFiles, runtimeRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-diagnostics.mjs'
) fail('missing runtime QA rollup diagnostics package script')

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const source = json(runtimeRecordPath)
if (source.integrationBase !== 'aa2627a18540828d7a391e569d8f21b70eb2d58f') fail('source integration base mismatch')
if (source.decision !== sourceDecision) fail('source decision mismatch')
if (source.execution !== sourceExecution) fail('source execution mismatch')
if (source.runId !== sourceRunId) fail('source run ID mismatch')
if (source.sourceChain?.guardedRuntimeRunId !== guardedRunId) fail('source guarded run ID mismatch')
if (source.workerRuntimeExecutionPacket?.nextSourceStatus !== 'ready_for_guarded_narrow_route_worker_runtime_qa_rollup') {
  fail('source next status mismatch')
}
if (source.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')
if (source.packageLock !== 'unchanged') fail('source package-lock mismatch')
if (source.generatedArtifactsCommitted !== 'none') fail('source generated artifact status mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.runtimeExecutionPacketPr !== 2044) fail('runtime packet PR mismatch')
if (record.sourceChain?.runtimeExecutionPacketMergeSha !== integrationBase) fail('runtime packet merge mismatch')
if (record.sourceChain?.runtimeExecutionPacketRunId !== sourceRunId) fail('runtime packet run mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== guardedRunId) fail('guarded runtime run mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
for (const key of [
  'sourceEvidenceReview',
  'checksumReview',
  'commandMatrixReview',
  'routeWorkerBoundaryReview',
  'generatedFixtureBoundaryReview',
]) {
  if (record.qa?.[key] !== 'passed') fail(`QA field mismatch: ${key}`)
}
if (record.qa?.acceptedRuntimeSourceStatus !== 'completed_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only') {
  fail('accepted runtime source mismatch')
}
for (const key of ['gstreamer', 'mkvtoolnix', 'externalAgentRouteWorkerBoundary']) {
  if (record.readiness?.[key] !== readiness) fail(`readiness mismatch: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
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
