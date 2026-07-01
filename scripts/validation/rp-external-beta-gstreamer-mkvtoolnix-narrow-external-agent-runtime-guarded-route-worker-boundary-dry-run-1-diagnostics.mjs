#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-DRY-RUN-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-record.json'
const integrationBase = '64ac4a5f8bd02b28533d3e8c1d6e2e65aca430c7'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_route_worker_boundary_noop_dry_run'
const execution =
  'completed_confirmation_gated_narrow_route_worker_boundary_noop_dry_run_no_route_worker_tool_or_media_execution'
const runId = '2026-07-01T09-10-00-006Z-4412669b'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN=true'
const blockedNoGate = 'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_boundary_dry_run_confirmation'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/boundary-envelope.md`,
  `${dir}/negative-cases.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-qa-rollup-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runId,
  gate,
  blockedNoGate,
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_guarded_route_worker_boundary_contract_ready_for_confirmation_gated_noop_dry_run',
  'completed_backend_source_guarded_route_worker_boundary_no_route_worker_tool_or_media_execution',
  'ready_for_confirmation_gated_narrow_route_worker_boundary_noop_dry_run',
  'noop_boundary_validation_only',
  'positiveBoundaryValidation',
  'negativeBoundaryValidation',
  'reject_missing_boundary_reference',
  'reject_route_registered',
  'reject_route_enabled',
  'reject_route_execution',
  'reject_worker_dispatch',
  'reject_worker_execution',
  'reject_worker_lease_claim',
  'reject_persistent_queue_write',
  'reject_tool_execution',
  'reject_supabase_sql',
  'reject_signed_public_artifact',
  'reject_final_export_unlock',
  'boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1',
  'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeBoundary',
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/runtime-boundary',
  'backend_service_role_only',
  'not_dispatched_boundary_only',
  'gstreamer-mkvtoolnix:narrow-external-agent-route-worker-boundary-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:gst_controlled_generated_fixture_pipeline_v1:boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1',
  'narrow-route-worker-boundary-dry-run-envelope.json',
  'f138b22df48c4fcdb78451d853ae66dcd9f5404e17ea5fa67bdb3bb93ac436c5',
  'narrow-route-worker-boundary-dry-run-report.json',
  'ab82196f389830d58f5e2a8bbb69d44009cb6cb0010947414643c2dfb77881ba',
  'narrow-route-worker-boundary-dry-run-manifest.json',
  '2713f64fa1c0f7fc5a3e1674c5c8f203b8d98a7cf497aae3349e1bd85484fe91',
  'Route registered in this dry-run phase: `false`',
  'Route enabled in this dry-run phase: `false`',
  'Route execution in this dry-run phase: `false`',
  'Worker dispatch in this dry-run phase: `false`',
  'Worker execution in this dry-run phase: `false`',
  'Worker process start in this dry-run phase: `false`',
  'Worker lease claim in this dry-run phase: `false`',
  'Persistent job queue write in this dry-run phase: `false`',
  'GStreamer execution in this dry-run phase: `false`',
  'MKVToolNix execution in this dry-run phase: `false`',
  'Docker execution in this dry-run phase: `false`',
  'FFmpeg/FFprobe execution in this dry-run phase: `false`',
  'Supabase mutation in this dry-run phase: `false`',
  'SQL execution in this dry-run phase: `false`',
  'Public artifact creation in this dry-run phase: `false`',
  'Final render/export in this dry-run phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
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
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Route registered in this dry-run phase|Route enabled in this dry-run phase|Route execution in this dry-run phase|Worker dispatch in this dry-run phase|Worker execution in this dry-run phase|Worker process start in this dry-run phase|Worker lease claim in this dry-run phase|Persistent job queue write in this dry-run phase|GStreamer execution in this dry-run phase|MKVToolNix execution in this dry-run phase|Docker execution in this dry-run phase|FFmpeg\/FFprobe execution in this dry-run phase|Remotion execution in this dry-run phase|Private media processing in this dry-run phase|User media processing in this dry-run phase|Supabase mutation in this dry-run phase|SQL execution in this dry-run phase|Signed URL creation in this dry-run phase|Public artifact creation in this dry-run phase|Final render\/export in this dry-run phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeRegisteredInThisDryRunPhase"\s*:\s*true/i,
  /"routeEnabledInThisDryRunPhase"\s*:\s*true/i,
  /"routeExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"workerDispatchInThisDryRunPhase"\s*:\s*true/i,
  /"workerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisDryRunPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisDryRunPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisDryRunPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"dockerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"remotionExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisDryRunPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisDryRunPhase"\s*:\s*true/i,
  /"supabaseMutationInThisDryRunPhase"\s*:\s*true/i,
  /"sqlExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisDryRunPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisDryRunPhase"\s*:\s*true/i,
  /"finalRenderExportInThisDryRunPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisDryRunPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisDryRunPhase"\s*:\s*true/i,
  /"productionUnlockInThisDryRunPhase"\s*:\s*true/i,
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
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1.mjs'
) {
  fail('missing narrow route/worker boundary dry-run package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1-diagnostics.mjs'
) {
  fail('missing narrow route/worker boundary dry-run diagnostics package script')
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
if (record.runId !== runId) fail('run ID mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.confirmationGate !== gate) fail('confirmation gate mismatch')
if (record.failClosedNoGateBlocker !== blockedNoGate) fail('fail-closed blocker mismatch')
if (record.sourceChain?.boundaryPr !== 1967) fail('boundary source PR mismatch')
if (record.sourceChain?.boundaryMergeSha !== integrationBase) fail('boundary source merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.dryRun?.mode !== 'noop_boundary_validation_only') fail('dry-run mode mismatch')
if (record.dryRun?.positiveBoundaryValidation !== 'passed') fail('positive validation mismatch')
if (record.dryRun?.negativeBoundaryValidation !== 'passed') fail('negative validation mismatch')
if (!Array.isArray(record.dryRun?.rejectedCases) || record.dryRun.rejectedCases.length !== 12) {
  fail('rejected case count mismatch')
}
for (const flag of [
  'routeRegistered',
  'routeEnabled',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseClaim',
  'persistentQueueWrite',
]) {
  if (record.dryRun?.[flag] !== false) fail(`dry-run flag must be false: ${flag}`)
}
if (record.acceptedBoundary?.proposedRouteOwner !== 'backend_service_role_only') fail('route owner mismatch')
if (record.acceptedBoundary?.routeBoundaryMode !== 'noop_validation_only') fail('route boundary mode mismatch')
if (record.acceptedBoundary?.workerBoundaryMode !== 'not_dispatched_boundary_only') fail('worker boundary mode mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 3) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.nextMilestone !== packet) fail('source boundary next milestone mismatch')
if (sourceRecord.boundary?.status !== 'ready_for_confirmation_gated_narrow_route_worker_boundary_noop_dry_run') {
  fail('source boundary status mismatch')
}
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
].sort()
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (!fs.existsSync(file)) continue
  const text = read(file)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in changed file ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json has unstaged changes')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json has staged changes')

console.log(
  JSON.stringify(
    {
      ok: true,
      packet,
      decision,
      execution,
      runId,
      changedFiles,
      nextMilestone,
    },
    null,
    2,
  ),
)
