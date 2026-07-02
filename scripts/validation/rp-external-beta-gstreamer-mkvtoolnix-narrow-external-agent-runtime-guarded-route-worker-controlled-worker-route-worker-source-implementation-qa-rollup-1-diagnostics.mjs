#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-IMPLEMENTATION-QA-ROLLUP-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1-record.json'
const decision = 'qa_passed_gstreamer_mkvtoolnix_narrow_route_worker_source_implementation_evidence'
const execution =
  'completed_docs_only_narrow_route_worker_source_implementation_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceDecision = 'completed_gstreamer_mkvtoolnix_narrow_route_worker_source_implementation'
const sourceExecution = 'completed_source_only_route_worker_files_created_not_registered_or_executed'
const integrationBase = '0b62398ed306a85f074d756bbbc00cd79f22ee9c'
const sourceHead = '1b901e97f421448a6c3c24308359ad148b7a7f72'
const sourceReadiness = 'ready_for_guarded_narrow_route_worker_source_implementation_qa_rollup'
const gstreamerReadiness = 'ready_for_guarded_narrow_route_worker_source_registration_planning'
const routeWorkerReadiness = 'qa_passed_source_only_route_worker_files_ready_for_registration_planning'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-REGISTRATION-PLAN-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/qa-decision.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-registration-plan-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  sourceDecision,
  sourceExecution,
  integrationBase,
  sourceHead,
  'Source implementation PR: `#2089`',
  'Source implementation merge SHA: `0b62398ed306a85f074d756bbbc00cd79f22ee9c`',
  'Source implementation readiness: `ready_for_guarded_narrow_route_worker_source_implementation_qa_rollup`',
  'source_implementation_evidence_review_only',
  'sourceImplementationReview',
  'routeSourceContractReview',
  'workerSourceContractReview',
  'confirmationGateReview',
  'negativeMatrixReview',
  'runtimeBoundaryReview',
  'safetyBoundaryReview',
  'source_file_created_not_registered',
  'source_file_created_not_registered_not_dispatched',
  'metadata_only_queue_source_declared_no_persistent_write',
  'generated_fixture_only_narrow_controlled_worker_runtime_source',
  'required_before_future_runtime',
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION',
  `GStreamer readiness: \`${gstreamerReadiness}\``,
  `MKVToolNix readiness: \`${gstreamerReadiness}\``,
  `External-agent route/worker source readiness: \`${routeWorkerReadiness}\``,
  'Route registered at runtime in this QA rollup phase: `false`',
  'Production route file created in this QA rollup phase: `false`',
  'Route execution in this QA rollup phase: `false`',
  'Worker dispatch in this QA rollup phase: `false`',
  'Worker execution in this QA rollup phase: `false`',
  'GStreamer execution in this QA rollup phase: `false`',
  'MKVToolNix execution in this QA rollup phase: `false`',
  'Supabase mutation in this QA rollup phase: `false`',
  'SQL execution in this QA rollup phase: `false`',
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
  /\b(?:Route registered at runtime in this QA rollup phase|Production route file created in this QA rollup phase|Route execution in this QA rollup phase|Worker dispatch in this QA rollup phase|Worker execution in this QA rollup phase|Worker process start in this QA rollup phase|Worker lease claim in this QA rollup phase|Persistent job queue write in this QA rollup phase|GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|Docker execution in this QA rollup phase|FFmpeg\/FFprobe execution in this QA rollup phase|Remotion execution in this QA rollup phase|Media processing in this QA rollup phase|Private media processing in this QA rollup phase|User media processing in this QA rollup phase|Supabase mutation in this QA rollup phase|SQL execution in this QA rollup phase|Signed URL creation in this QA rollup phase|Public artifact creation in this QA rollup phase|Final render\/export in this QA rollup phase|Broad external beta unlock in this QA rollup phase|Paid production unlock in this QA rollup phase|Production unlock in this QA rollup phase):\s*`?(true|enabled|completed|run|executed)\b/i,
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
  /"supabaseMutationInThisQaRollupPhase"\s*:\s*true/i,
  /"sqlExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"providerCallInThisQaRollupPhase"\s*:\s*true/i,
  /"modelCallInThisQaRollupPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"finalRenderExportInThisQaRollupPhase"\s*:\s*true/i,
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
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing QA rollup diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const source = json(sourceRecordPath)
if (source.packet !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-IMPLEMENTATION-1') fail('source packet mismatch')
if (source.integrationBase !== 'ee557c2322317f7fdc3e3f0f85b6571f9bf88fc4') fail('source integration base mismatch')
if (source.decision !== sourceDecision) fail('source decision mismatch')
if (source.execution !== sourceExecution) fail('source execution mismatch')
if (source.sourceChain?.routeWorkerSourceExecutionPacketQaRollupPr !== 2085) fail('source QA rollup PR mismatch')
if (source.sourceChain?.routeWorkerSourceExecutionPacketQaRollupMergeSha !== 'ee557c2322317f7fdc3e3f0f85b6571f9bf88fc4') fail('source QA rollup merge mismatch')
if (source.sourceChain?.routeWorkerSourceExecutionPacketRunId !== '2026-07-02T01-15-31-287Z-6bbab797') fail('source execution packet run mismatch')
if (source.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 source exclusion mismatch')
if (source.sourceImplementation?.readiness !== sourceReadiness) fail('source readiness mismatch')
if (source.sourceImplementation?.routeSourceMode !== 'source_file_created_not_registered') fail('source route mode mismatch')
if (source.sourceImplementation?.workerSourceMode !== 'source_file_created_not_registered_not_dispatched') fail('source worker mode mismatch')
if (source.sourceImplementation?.queueSourceMode !== 'metadata_only_queue_source_declared_no_persistent_write') fail('source queue mode mismatch')
if (source.sourceImplementation?.sourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source') fail('source class mismatch')
if (source.sourceImplementation?.approvedSnapshotRequirement !== 'required_before_future_runtime') fail('approved snapshot requirement mismatch')
if (source.validation !== 'passed') fail('source validation mismatch')
if (source.packageLock !== 'unchanged') fail('source package-lock mismatch')
if (source.generatedArtifactsCommitted !== 'none') fail('source generated artifact mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.routeWorkerSourceImplementationPr !== 2089) fail('source implementation PR mismatch')
if (record.sourceChain?.routeWorkerSourceImplementationHeadSha !== sourceHead) fail('source head mismatch')
if (record.sourceChain?.routeWorkerSourceImplementationMergeSha !== integrationBase) fail('source merge mismatch')
if (record.sourceChain?.routeWorkerSourceImplementationDecision !== sourceDecision) fail('source decision field mismatch')
if (record.sourceChain?.routeWorkerSourceImplementationExecution !== sourceExecution) fail('source execution field mismatch')
if (record.sourceChain?.routeWorkerSourceExecutionPacketRunId !== '2026-07-02T01-15-31-287Z-6bbab797') fail('source packet run field mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
for (const key of ['sourceImplementationReview', 'routeSourceContractReview', 'workerSourceContractReview', 'confirmationGateReview', 'negativeMatrixReview', 'runtimeBoundaryReview', 'safetyBoundaryReview']) {
  if (record.qa?.[key] !== 'passed') fail(`QA field mismatch: ${key}`)
}
if (record.sourceImplementation?.routeSourceMode !== 'source_file_created_not_registered') fail('record route mode mismatch')
if (record.sourceImplementation?.workerSourceMode !== 'source_file_created_not_registered_not_dispatched') fail('record worker mode mismatch')
if (record.sourceImplementation?.queueSourceMode !== 'metadata_only_queue_source_declared_no_persistent_write') fail('record queue mode mismatch')
if (record.sourceImplementation?.sourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source') fail('record source class mismatch')
if (record.sourceImplementation?.approvedSnapshotRequirement !== 'required_before_future_runtime') fail('record approved snapshot mismatch')
if (record.sourceImplementation?.confirmationGate !== 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION') fail('record confirmation gate mismatch')
if (record.sourceImplementation?.generatedFixtureEvidenceAccepted !== true) fail('generated fixture evidence mismatch')
if (record.readiness?.gstreamer !== gstreamerReadiness) fail('gstreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== gstreamerReadiness) fail('mkvtoolnix readiness mismatch')
if (record.readiness?.externalAgentRouteWorkerSource !== routeWorkerReadiness) fail('route worker readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (
  ![
    'pending_final_validation',
    'passed',
    'blocked_host_resource_limit_no_space_left_on_device_during_npm_ci',
  ].includes(record.validation)
) fail('validation status mismatch')
if (record.validation === 'blocked_host_resource_limit_no_space_left_on_device_during_npm_ci') {
  const blocker = record.blocker ?? {}
  if (blocker.code !== 'blocked_host_resource_limit_no_space_left_on_device_during_npm_ci') fail('blocker code mismatch')
  if (blocker.attemptedCommand !== 'npm ci --no-audit --no-fund --progress=false') fail('blocker attempted command mismatch')
  if (!String(blocker.observedError ?? '').includes('ENOSPC')) fail('blocker must record ENOSPC')
  if (blocker.validationVolume !== '/Volumes/backup') fail('blocker validation volume mismatch')
}
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
