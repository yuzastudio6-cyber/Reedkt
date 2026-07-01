#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-IMPLEMENTATION-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1-record.json'
const integrationBase = 'a599e64c3b70666a747c4894741005611e0d170e'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_implementation_ready_for_source_qa_rollup'
const execution = 'completed_backend_source_guarded_registered_noop_source_validation_no_route_worker_tool_or_media_execution'
const readiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_qa_rollup'
const sourceDecision =
  'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_planning_ready_for_guarded_source_implementation'
const sourceExecution = 'completed_docs_only_registered_noop_source_planning_no_route_worker_tool_or_media_execution'
const sourceReadiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_implementation'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-QA-ROLLUP-1'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/registered-noop-source-contract.md`,
  `${dir}/smoke-result.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-qa-rollup-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  sourceExecution,
  sourceReadiness,
  readiness,
  'Source planning PR: `#1984`',
  'Source planning merge SHA: `a599e64c3b70666a747c4894741005611e0d170e`',
  'source-gstreamer-mkvtoolnix-narrow-route-worker-registered-noop-1',
  'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource',
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary',
  'backend_service_role_only',
  'source_declared_registered_but_runtime_disabled',
  'disabled_registered_noop_source_contract_only',
  'source_declared_not_dispatched',
  `${gate}=true`,
  'accepted_registered_noop_source_contract',
  'runtimeEnabled: false',
  'routeRegisteredAtRuntime: false',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'toolExecution: false',
  'blocked_missing_registered_noop_source_reference',
  'blocked_invalid_registered_noop_source_state',
  'blocked_narrow_route_worker_registered_noop_boundary_validation_failed',
  'blocked_registered_noop_source_idempotency_mismatch',
  'blocked_registered_noop_source_runtime_enabled_without_future_packet',
  'blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled',
  'blocked_registered_noop_public_or_signed_artifact_attempt',
  'blocked_registered_noop_delivery_or_unlock_attempt',
  'Production route file created in this source phase: `false`',
  'Route registered in this source phase: `false`',
  'Route enabled in this source phase: `false`',
  'Route execution in this source phase: `false`',
  'Worker dispatch in this source phase: `false`',
  'Worker execution in this source phase: `false`',
  'GStreamer execution in this source phase: `false`',
  'MKVToolNix execution in this source phase: `false`',
  'Supabase mutation in this source phase: `false`',
  'SQL execution in this source phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const requiredServiceText = [
  'validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput',
  'buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput',
  'createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse',
  'summarizeGstreamerMkvtoolnixNarrowRegisteredNoopSourceBoundary',
  'source_declared_registered_but_runtime_disabled',
  'routeRegisteredAtRuntime: false',
  'productionRouteFileCreated: false',
  'routeRegistered: false',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'dockerExecution: false',
  'ffmpegFfprobeExecution: false',
  'supabaseMutation: false',
  'sqlExecution: false',
  'publicArtifactCreation: false',
  'finalRenderExport: false',
  'productReadyEndToEndLocalOssTools: 0',
]

const requiredSmokeText = [
  'valid_registered_noop_source_contract_validates',
  'response_shape_remains_runtime_disabled',
  'missing_registered_source_reference_blocks',
  'invalid_boundary_blocks',
  'invalid_registered_owner_modes_or_gate_block',
  'idempotency_mismatch_blocks',
  'runtime_enablement_drift_blocks',
  'route_worker_queue_tool_media_supabase_sql_runtime_requests_block',
  'signed_public_artifact_and_delivery_unlock_requests_block',
  'safety_flags_remain_false',
]

const forbiddenPathPatterns = [
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
  /\b(?:Production route file created in this source phase|Route registered in this source phase|Route enabled in this source phase|Route execution in this source phase|Worker dispatch in this source phase|Worker execution in this source phase|Worker process start in this source phase|Worker lease claim in this source phase|Persistent job queue write in this source phase|GStreamer execution in this source phase|MKVToolNix execution in this source phase|Docker execution in this source phase|FFmpeg\/FFprobe execution in this source phase|Remotion execution in this source phase|Private media processing in this source phase|User media processing in this source phase|Media processing in this source phase|Supabase mutation in this source phase|SQL execution in this source phase|Signed URL creation in this source phase|Public artifact creation in this source phase|Final render\/export in this source phase|Broad external beta unlock in this source phase|Paid production unlock in this source phase|Production unlock in this source phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisSourcePhase"\s*:\s*true/i,
  /"routeRegisteredInThisSourcePhase"\s*:\s*true/i,
  /"routeEnabledInThisSourcePhase"\s*:\s*true/i,
  /"routeExecutionInThisSourcePhase"\s*:\s*true/i,
  /"workerDispatchInThisSourcePhase"\s*:\s*true/i,
  /"workerExecutionInThisSourcePhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisSourcePhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisSourcePhase"\s*:\s*true/i,
  /"dockerExecutionInThisSourcePhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisSourcePhase"\s*:\s*true/i,
  /"supabaseMutationInThisSourcePhase"\s*:\s*true/i,
  /"sqlExecutionInThisSourcePhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisSourcePhase"\s*:\s*true/i,
  /"finalRenderExportInThisSourcePhase"\s*:\s*true/i,
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
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-smoke.ts'
) {
  fail('missing registered no-op source smoke package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1-diagnostics.mjs'
) {
  fail('missing registered no-op source diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const serviceText = read(implementationFiles[0])
for (const text of requiredServiceText) {
  if (!serviceText.includes(text)) fail(`missing required service text: ${text}`)
}
const smokeText = read(implementationFiles[1])
for (const text of requiredSmokeText) {
  if (!smokeText.includes(text)) fail(`missing required smoke text: ${text}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.registeredNoopSourcePlanningPr !== 1984) fail('source PR mismatch')
if (record.sourceChain?.registeredNoopSourcePlanningMergeSha !== integrationBase) fail('source merge SHA mismatch')
if (record.sourceChain?.registeredNoopSourcePlanningDecision !== sourceDecision) fail('source decision mismatch')
if (record.sourceChain?.registeredNoopSourcePlanningExecution !== sourceExecution) fail('source execution mismatch')
if (record.sourceChain?.registeredNoopSourcePlanningReadiness !== sourceReadiness) fail('source readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.sourceImplementation?.status !== readiness) fail('source implementation status mismatch')
if (record.sourceImplementation?.sourceImplementationId !== 'source-gstreamer-mkvtoolnix-narrow-route-worker-registered-noop-1') {
  fail('source implementation ID mismatch')
}
if (record.sourceImplementation?.routeSourceId !== 'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource') {
  fail('route source ID mismatch')
}
if (record.sourceImplementation?.routeRegistrationMode !== 'source_declared_registered_but_runtime_disabled') {
  fail('route registration mode mismatch')
}
if (record.sourceImplementation?.routeRuntimeMode !== 'disabled_registered_noop_source_contract_only') {
  fail('route runtime mode mismatch')
}
if (record.sourceImplementation?.workerSourceMode !== 'source_declared_not_dispatched') fail('worker source mode mismatch')
if (record.sourceImplementation?.futureDryRunConfirmationGate !== `${gate}=true`) fail('future gate mismatch')
if (record.sourceImplementation?.responseShapeStatus !== 'accepted_registered_noop_source_contract') {
  fail('response shape mismatch')
}
for (const flag of [
  'runtimeEnabled',
  'routeRegisteredAtRuntime',
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
  if (record.sourceImplementation?.[flag] !== false) fail(`source flag must be false: ${flag}`)
}
for (const blocker of [
  'blocked_missing_registered_noop_source_reference',
  'blocked_invalid_registered_noop_source_state',
  'blocked_narrow_route_worker_registered_noop_boundary_validation_failed',
  'blocked_registered_noop_source_idempotency_mismatch',
  'blocked_registered_noop_source_runtime_enabled_without_future_packet',
  'blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled',
  'blocked_registered_noop_public_or_signed_artifact_attempt',
  'blocked_registered_noop_delivery_or_unlock_attempt',
]) {
  if (!record.negativeCases?.includes(blocker)) fail(`missing negative case: ${blocker}`)
}
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
  for (const pattern of forbiddenPathPatterns) {
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
