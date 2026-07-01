#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-PLANNING-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-noop-source-dry-run-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-noop-source-dry-run-qa-rollup-1-record.json'
const integrationBase = '0253d1f9fb6d2c856cbdcb14a710b67156966150'
const decision =
  'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_planning_ready_for_guarded_source_implementation'
const execution = 'completed_docs_only_registered_noop_source_planning_no_route_worker_tool_or_media_execution'
const sourceDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_route_worker_noop_source_dry_run_evidence'
const sourceExecution = 'completed_docs_only_noop_source_dry_run_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceReadiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_planning'
const readiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_implementation'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-IMPLEMENTATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/registered-noop-source-plan.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-noop-source-dry-run-qa-rollup-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1.md',
]

const nextRegisteredNoopSourceImplementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-diagnostics.mjs',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1/registered-noop-source-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1/smoke-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1/negative-cases.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-qa-rollup-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...implementationFiles,
  ...nextRegisteredNoopSourceImplementationFiles,
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  sourceExecution,
  sourceReadiness,
  readiness,
  'Dry-run run ID reviewed: `2026-07-01T11-13-12-564Z-e4d8f28a`',
  'source-gstreamer-mkvtoolnix-narrow-route-worker-registered-noop-1',
  'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource',
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary',
  'backend_service_role_only',
  'source_declared_registered_but_runtime_disabled',
  'disabled_registered_noop_source_contract_only',
  'source_declared_not_dispatched',
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN=true',
  'blocked_missing_registered_noop_source_reference',
  'blocked_invalid_registered_noop_source_state',
  'blocked_registered_noop_route_execution_attempt',
  'blocked_registered_noop_worker_dispatch_attempt',
  'blocked_registered_noop_tool_execution_attempt',
  'blocked_registered_noop_media_processing_attempt',
  'blocked_registered_noop_public_or_signed_artifact_attempt',
  'blocked_registered_noop_delivery_or_unlock_attempt',
  'Production route file created in this planning phase: `false`',
  'Route registered in this planning phase: `false`',
  'Route enabled in this planning phase: `false`',
  'Route execution in this planning phase: `false`',
  'Worker dispatch in this planning phase: `false`',
  'Worker execution in this planning phase: `false`',
  'Worker process start in this planning phase: `false`',
  'Worker lease claim in this planning phase: `false`',
  'Persistent job queue write in this planning phase: `false`',
  'GStreamer execution in this planning phase: `false`',
  'MKVToolNix execution in this planning phase: `false`',
  'Docker execution in this planning phase: `false`',
  'FFmpeg/FFprobe execution in this planning phase: `false`',
  'Supabase mutation in this planning phase: `false`',
  'SQL execution in this planning phase: `false`',
  'Public artifact creation in this planning phase: `false`',
  'Final render/export in this planning phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-smoke\.ts$)/,
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
  /\b(?:Production route file created in this planning phase|Route registered in this planning phase|Route enabled in this planning phase|Route execution in this planning phase|Worker dispatch in this planning phase|Worker execution in this planning phase|Worker process start in this planning phase|Worker lease claim in this planning phase|Persistent job queue write in this planning phase|GStreamer execution in this planning phase|MKVToolNix execution in this planning phase|Docker execution in this planning phase|FFmpeg\/FFprobe execution in this planning phase|Remotion execution in this planning phase|Private media processing in this planning phase|User media processing in this planning phase|Media processing in this planning phase|Supabase mutation in this planning phase|SQL execution in this planning phase|Signed URL creation in this planning phase|Public artifact creation in this planning phase|Final render\/export in this planning phase|Broad external beta unlock in this planning phase|Paid production unlock in this planning phase|Production unlock in this planning phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisPlanningPhase"\s*:\s*true/i,
  /"routeRegisteredInThisPlanningPhase"\s*:\s*true/i,
  /"routeEnabledInThisPlanningPhase"\s*:\s*true/i,
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
  /"supabaseMutationInThisPlanningPhase"\s*:\s*true/i,
  /"sqlExecutionInThisPlanningPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisPlanningPhase"\s*:\s*true/i,
  /"finalRenderExportInThisPlanningPhase"\s*:\s*true/i,
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
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1-diagnostics.mjs'
) {
  fail('missing registered no-op source planning diagnostics package script')
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
if (record.sourceChain?.noopSourceDryRunQaRollupPr !== 1982) fail('source PR mismatch')
if (record.sourceChain?.noopSourceDryRunQaRollupMergeSha !== integrationBase) fail('source merge SHA mismatch')
if (record.sourceChain?.noopSourceDryRunQaDecision !== sourceDecision) fail('source decision mismatch')
if (record.sourceChain?.noopSourceDryRunQaExecution !== sourceExecution) fail('source execution mismatch')
if (record.sourceChain?.noopSourceDryRunQaReadiness !== sourceReadiness) fail('source readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.plannedSource?.implementationId !== 'source-gstreamer-mkvtoolnix-narrow-route-worker-registered-noop-1') {
  fail('planned implementation ID mismatch')
}
if (record.plannedSource?.routeSourceId !== 'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource') {
  fail('planned route source ID mismatch')
}
if (record.plannedSource?.routeRegistrationMode !== 'source_declared_registered_but_runtime_disabled') {
  fail('planned route registration mode mismatch')
}
if (record.plannedSource?.routeRuntimeMode !== 'disabled_registered_noop_source_contract_only') {
  fail('planned route runtime mode mismatch')
}
if (record.plannedSource?.workerSourceMode !== 'source_declared_not_dispatched') fail('worker source mode mismatch')
if (record.plannedSource?.futureDryRunConfirmationGate !== 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN=true') {
  fail('future dry-run gate mismatch')
}
for (const flag of [
  'productionRouteFileCreated',
  'routeRegistered',
  'routeEnabled',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseClaim',
  'persistentQueueWrite',
]) {
  if (record.plannedSource?.[flag] !== false) fail(`planned source flag must be false: ${flag}`)
}
if (!Array.isArray(record.negativeCases) || record.negativeCases.length !== 8) fail('negative case count mismatch')
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
if (record.readiness?.externalAgentBoundary !== readiness) fail('external-agent readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== sourceDecision) fail('source record decision mismatch')
if (sourceRecord.execution !== sourceExecution) fail('source record execution mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source record next milestone mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source record product-ready count mismatch')

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
  if (!fs.existsSync(file) || file.startsWith('scripts/validation/')) continue
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
      changedFiles,
      nextMilestone,
    },
    null,
    2,
  ),
)
