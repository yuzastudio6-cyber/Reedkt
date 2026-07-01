#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-record.json`
const bridgeQaRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1-record.json'
const integrationBase = 'b0397d71832fe596a49e663e6a40144ca48e6dd3'
const decision =
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_guarded_route_worker_boundary_contract_ready_for_confirmation_gated_noop_dry_run'
const execution =
  'completed_backend_source_guarded_route_worker_boundary_no_route_worker_tool_or_media_execution'
const readyStatus = 'ready_for_confirmation_gated_narrow_route_worker_boundary_noop_dry_run'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-DRY-RUN-1'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-worker-boundary-contract.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1-diagnostics.mjs',
  'package.json',
]

const futureBoundaryDryRunFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1/boundary-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1/negative-cases.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-qa-rollup-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1-diagnostics.mjs',
]

const sourceFiles = [
  bridgeQaRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...futureBoundaryDryRunFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  'b0397d71832fe596a49e663e6a40144ca48e6dd3',
  '0bab179dd626a7d6f688a63071af492d4f3d1cb8',
  'aa2a51681c161f3005d5fc1de06370b4f7ed7bb3',
  '8e93c0275e25ba703ddfa7c63c9a6f0403a2ffe7',
  '2026-07-01T07-13-36-296Z-7ebd9826',
  'qa_passed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_bridge_source_evidence',
  'completed_docs_only_narrow_external_agent_runtime_bridge_qa_rollup_no_route_worker_tool_or_media_execution',
  readyStatus,
  gate,
  'noop_validation_only',
  'not_dispatched_boundary_only',
  'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeBoundary',
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/runtime-boundary',
  'backend_service_role_only',
  'boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1',
  'gstreamer-mkvtoolnix:narrow-external-agent-route-worker-boundary-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:gst_controlled_generated_fixture_pipeline_v1:boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1',
  'blocked_missing_narrow_route_worker_boundary_reference',
  'blocked_invalid_narrow_route_worker_boundary_state',
  'blocked_narrow_bridge_validation_failed',
  'blocked_narrow_route_worker_boundary_idempotency_mismatch',
  'blocked_route_or_worker_runtime_not_enabled',
  'blocked_public_or_signed_artifact_attempt',
  'blocked_delivery_or_unlock_attempt',
  'Route registered in this boundary phase: `false`',
  'Route enabled in this boundary phase: `false`',
  'Route execution in this boundary phase: `false`',
  'Worker dispatch in this boundary phase: `false`',
  'Worker execution in this boundary phase: `false`',
  'Worker process start in this boundary phase: `false`',
  'Worker lease claim in this boundary phase: `false`',
  'Persistent job queue write in this boundary phase: `false`',
  'GStreamer execution in this boundary phase: `false`',
  'MKVToolNix execution in this boundary phase: `false`',
  'Docker execution in this boundary phase: `false`',
  'FFmpeg/FFprobe execution in this boundary phase: `false`',
  'Supabase mutation in this boundary phase: `false`',
  'SQL execution in this boundary phase: `false`',
  'Public artifact creation in this boundary phase: `false`',
  'Final render/export in this boundary phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-smoke\.ts$)/,
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
  /\b(?:Route registered in this boundary phase|Route enabled in this boundary phase|Route execution in this boundary phase|Worker dispatch in this boundary phase|Worker execution in this boundary phase|Worker process start in this boundary phase|Worker lease claim in this boundary phase|Persistent job queue write in this boundary phase|GStreamer execution in this boundary phase|MKVToolNix execution in this boundary phase|Docker execution in this boundary phase|FFmpeg\/FFprobe execution in this boundary phase|Remotion execution in this boundary phase|Private media processing in this boundary phase|User media processing in this boundary phase|Supabase mutation in this boundary phase|SQL execution in this boundary phase|Signed URL creation in this boundary phase|Public artifact creation in this boundary phase|Final render\/export in this boundary phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeRegisteredInThisBoundaryPhase"\s*:\s*true/i,
  /"routeEnabledInThisBoundaryPhase"\s*:\s*true/i,
  /"routeExecutionInThisBoundaryPhase"\s*:\s*true/i,
  /"workerDispatchInThisBoundaryPhase"\s*:\s*true/i,
  /"workerExecutionInThisBoundaryPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisBoundaryPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisBoundaryPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisBoundaryPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisBoundaryPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisBoundaryPhase"\s*:\s*true/i,
  /"dockerExecutionInThisBoundaryPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisBoundaryPhase"\s*:\s*true/i,
  /"remotionExecutionInThisBoundaryPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisBoundaryPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisBoundaryPhase"\s*:\s*true/i,
  /"supabaseMutationInThisBoundaryPhase"\s*:\s*true/i,
  /"sqlExecutionInThisBoundaryPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisBoundaryPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisBoundaryPhase"\s*:\s*true/i,
  /"finalRenderExportInThisBoundaryPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisBoundaryPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisBoundaryPhase"\s*:\s*true/i,
  /"productionUnlockInThisBoundaryPhase"\s*:\s*true/i,
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
  packageJson.scripts?.[
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-smoke.ts'
) {
  fail('missing narrow route/worker boundary smoke package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-diagnostics.mjs'
) {
  fail('missing narrow route/worker boundary diagnostics package script')
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
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.bridgeQaRollupPr !== 1966) fail('bridge QA rollup PR mismatch')
if (record.sourceChain?.bridgeQaRollupMergeSha !== integrationBase) fail('bridge QA rollup merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.boundary?.status !== readyStatus) fail('boundary status mismatch')
if (record.boundary?.routeBoundaryMode !== 'noop_validation_only') fail('route boundary mode mismatch')
if (record.boundary?.workerBoundaryMode !== 'not_dispatched_boundary_only') fail('worker boundary mode mismatch')
if (record.boundary?.futureDryRunConfirmationGate !== gate) fail('future dry-run gate mismatch')
if (record.boundary?.routeRegistered !== false) fail('route registered must be false')
if (record.boundary?.routeEnabled !== false) fail('route enabled must be false')
if (record.boundary?.routeExecution !== false) fail('route execution must be false')
if (record.boundary?.workerDispatch !== false) fail('worker dispatch must be false')
if (record.boundary?.workerExecution !== false) fail('worker execution must be false')
if (record.boundary?.persistentQueueWrite !== false) fail('queue write must be false')
if (!Array.isArray(record.negativeCases) || record.negativeCases.length !== 7) fail('negative case count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const bridgeQaRecord = json(bridgeQaRecordPath)
if (bridgeQaRecord.decision !== 'qa_passed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_bridge_source_evidence') {
  fail('bridge QA source decision mismatch')
}
if (bridgeQaRecord.nextMilestone !== packet) fail('bridge QA source next milestone mismatch')
if (bridgeQaRecord.productReadyEndToEndLocalOssTools !== 0) fail('bridge QA product-ready count mismatch')

const serviceText = read(
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1.ts',
)
for (const text of [
  'validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput',
  'buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput',
  'summarizeGstreamerMkvtoolnixNarrowRouteWorkerBoundary',
  'blocked_route_or_worker_runtime_not_enabled',
  'blocked_narrow_bridge_validation_failed',
  'productReadyEndToEndLocalOssTools: 0',
]) {
  if (!serviceText.includes(text)) fail(`service missing required text: ${text}`)
}

const smokeText = read(
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-smoke.ts',
)
for (const text of [
  'valid_noop_route_worker_boundary_validates',
  'missing_boundary_reference_blocks',
  'invalid_bridge_blocks',
  'frontend_owner_and_live_modes_block',
  'idempotency_mismatch_blocks',
  'route_worker_queue_tool_media_supabase_sql_runtime_requests_block',
  'signed_public_artifact_and_delivery_unlock_requests_block',
  'safety_flags_remain_false',
]) {
  if (!smokeText.includes(text)) fail(`smoke missing required check: ${text}`)
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
].sort()
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (!fs.existsSync(file)) continue
  if (file.startsWith(dir) || file.startsWith('docs/activation-phase')) {
    const text = fs.readFileSync(file, 'utf8')
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim matched in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
