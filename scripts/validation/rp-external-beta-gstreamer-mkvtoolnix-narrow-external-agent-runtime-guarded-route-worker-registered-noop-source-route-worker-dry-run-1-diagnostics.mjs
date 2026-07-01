#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-DRY-RUN-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-record.json'
const integrationBase = '399e2e6692b9cc097aff0e44082b4f64d56e6ffe'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_dry_run'
const execution =
  'completed_confirmation_gated_registered_noop_source_route_worker_contract_dry_run_no_route_worker_tool_or_media_execution'
const sourceDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_registered_noop_source_dry_run_evidence'
const sourceExecution = 'completed_docs_only_registered_noop_source_dry_run_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceReadiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_route_worker_dry_run'
const readiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_route_worker_dry_run_qa_rollup'
const runId = '2026-07-01T13-38-39-805Z-d8448f0f'
const gate =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_ROUTE_WORKER_DRY_RUN=true'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-DRY-RUN-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/command-matrix.md`,
  `${dir}/artifact-manifest.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-qa-rollup-1.md',
]

const implementationFiles = [
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-diagnostics.mjs',
  'package.json',
]

const qaRollupDir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-qa-rollup-1'
const qaRollupFiles = [
  `${qaRollupDir}/source-audit.md`,
  `${qaRollupDir}/evidence-matrix.md`,
  `${qaRollupDir}/qa-decision.md`,
  `${qaRollupDir}/artifact-manifest-summary.md`,
  `${qaRollupDir}/readiness.md`,
  `${qaRollupDir}/safety-boundary.md`,
  `${qaRollupDir}/validation-results.md`,
  `${qaRollupDir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-qa-rollup-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-qa-rollup-1-diagnostics.mjs',
]

const executionPacketDir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1'
const executionPacketFiles = [
  `${executionPacketDir}/source-audit.md`,
  `${executionPacketDir}/execution-result.md`,
  `${executionPacketDir}/command-matrix.md`,
  `${executionPacketDir}/artifact-manifest.md`,
  `${executionPacketDir}/negative-cases.md`,
  `${executionPacketDir}/readiness.md`,
  `${executionPacketDir}/safety-boundary.md`,
  `${executionPacketDir}/validation-results.md`,
  `${executionPacketDir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1.md',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-diagnostics.mjs',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1.ts',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...qaRollupFiles, ...executionPacketFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  sourceExecution,
  sourceReadiness,
  readiness,
  'Source QA rollup PR: `#1993`',
  'Source QA rollup merge SHA: `399e2e6692b9cc097aff0e44082b4f64d56e6ffe`',
  `Run ID: \`${runId}\``,
  gate,
  'accepted_registered_noop_source_contract',
  'Dry-run mode: `registered_noop_route_worker_contract_only`',
  'Negative fail-closed route/worker blocker matrix: `passed`',
  'registered-noop-source-route-worker-dry-run-envelope.json',
  'registered-noop-source-route-worker-dry-run-report.json',
  'registered-noop-source-route-worker-dry-run-manifest.json',
  '16adee99db3f53e24a0d40cc10513260356e24954cff0d0daff9ea38128b2c2e',
  'cf7522a6e2ee48cd129db062bee2ad32685733d0f175e4698caa952d5872001e',
  '9e12c1b4c751738e52d328719ff71f95f4fb1ef3097e8fd8f26e9419090f4a65',
  'Production route file created in this route/worker dry-run phase: `false`',
  'Route registered at runtime in this route/worker dry-run phase: `false`',
  'Route execution in this route/worker dry-run phase: `false`',
  'Worker dispatch in this route/worker dry-run phase: `false`',
  'Worker execution in this route/worker dry-run phase: `false`',
  'Worker process start in this route/worker dry-run phase: `false`',
  'Worker lease claim in this route/worker dry-run phase: `false`',
  'Persistent job queue write in this route/worker dry-run phase: `false`',
  'GStreamer execution in this route/worker dry-run phase: `false`',
  'MKVToolNix execution in this route/worker dry-run phase: `false`',
  'Docker execution in this route/worker dry-run phase: `false`',
  'FFmpeg/FFprobe execution in this route/worker dry-run phase: `false`',
  'Supabase mutation in this route/worker dry-run phase: `false`',
  'SQL execution in this route/worker dry-run phase: `false`',
  'Public artifact creation in this route/worker dry-run phase: `false`',
  'Final render/export in this route/worker dry-run phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const requiredRunnerText = [
  'const confirmationEnv =',
  gate.replace('=true', ''),
  'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_registered_noop_source_route_worker_dry_run_confirmation',
  'buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput',
  'validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput',
  'createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse',
  'registered_noop_route_worker_contract_only',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'workerProcessStart: false',
  'workerLeaseClaim: false',
  'persistentQueueWrite: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'supabaseMutation: false',
  'sqlExecution: false',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!smoke\/(?:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1|rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1)\.ts$)/,
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
  /\b(?:Production route file created in this route\/worker dry-run phase|Route registered at runtime in this route\/worker dry-run phase|Route execution in this route\/worker dry-run phase|Worker dispatch in this route\/worker dry-run phase|Worker execution in this route\/worker dry-run phase|Worker process start in this route\/worker dry-run phase|Worker lease claim in this route\/worker dry-run phase|Persistent job queue write in this route\/worker dry-run phase|GStreamer execution in this route\/worker dry-run phase|MKVToolNix execution in this route\/worker dry-run phase|Docker execution in this route\/worker dry-run phase|FFmpeg\/FFprobe execution in this route\/worker dry-run phase|Remotion execution in this route\/worker dry-run phase|Private media processing in this route\/worker dry-run phase|User media processing in this route\/worker dry-run phase|Media processing in this route\/worker dry-run phase|Supabase mutation in this route\/worker dry-run phase|SQL execution in this route\/worker dry-run phase|Signed URL creation in this route\/worker dry-run phase|Public artifact creation in this route\/worker dry-run phase|Final render\/export in this route\/worker dry-run phase|Broad external beta unlock in this route\/worker dry-run phase|Paid production unlock in this route\/worker dry-run phase|Production unlock in this route\/worker dry-run phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"routeRegisteredAtRuntimeInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"routeExecutionInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"workerDispatchInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"workerExecutionInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"workerProcessStartInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"dockerExecutionInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"supabaseMutationInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"sqlExecutionInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
  /"finalRenderExportInThisRouteWorkerDryRunPhase"\s*:\s*true/i,
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
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1.ts'
) {
  fail('missing registered no-op route/worker dry-run package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-diagnostics.mjs'
) {
  fail('missing registered no-op route/worker dry-run diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const runnerText = read(implementationFiles[0])
for (const text of requiredRunnerText) {
  if (!runnerText.includes(text)) fail(`missing required runner text: ${text}`)
}
for (const pattern of [/child_process/, /\bfetch\s*\(/, /createClient\s*\(/, /SERVICE_ROLE_KEY|service_role_key|service-role-key/i, /docker\s+(build|run|push|deploy)/i]) {
  if (pattern.test(runnerText)) fail(`forbidden executable pattern in runner: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaRollupPr !== 1993) fail('source QA rollup PR mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaRollupMergeSha !== integrationBase) fail('source QA rollup merge SHA mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaDecision !== sourceDecision) fail('source QA decision mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaExecution !== sourceExecution) fail('source QA execution mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaReadiness !== sourceReadiness) fail('source QA readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.confirmation?.gate !== gate.replace('=true', '')) fail('confirmation gate mismatch')
if (record.confirmation?.value !== 'true') fail('confirmation value mismatch')
if (record.dryRun?.result !== 'passed') fail('dry-run result mismatch')
if (record.dryRun?.mode !== 'registered_noop_route_worker_contract_only') fail('dry-run mode mismatch')
if (record.dryRun?.acceptedSourceStatus !== 'accepted_registered_noop_source_contract') fail('accepted source status mismatch')
if (record.dryRun?.positiveEnvelopeValidation !== 'passed') fail('positive envelope validation mismatch')
if (record.dryRun?.negativeFailClosedMatrix !== 'passed') fail('negative matrix mismatch')
for (const flag of [
  'routeRegisteredAtRuntime',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseClaim',
  'persistentQueueWrite',
]) {
  if (record.dryRun?.[flag] !== false) fail(`dry-run flag must be false: ${flag}`)
}
if (record.artifacts?.envelope?.bytes !== 4688) fail('envelope bytes mismatch')
if (record.artifacts?.envelope?.sha256 !== '16adee99db3f53e24a0d40cc10513260356e24954cff0d0daff9ea38128b2c2e') {
  fail('envelope checksum mismatch')
}
if (record.artifacts?.report?.bytes !== 5620) fail('report bytes mismatch')
if (record.artifacts?.report?.sha256 !== 'cf7522a6e2ee48cd129db062bee2ad32685733d0f175e4698caa952d5872001e') {
  fail('report checksum mismatch')
}
if (record.artifacts?.manifest?.bytes !== 1237) fail('manifest bytes mismatch')
if (record.artifacts?.manifest?.sha256 !== '9e12c1b4c751738e52d328719ff71f95f4fb1ef3097e8fd8f26e9419090f4a65') {
  fail('manifest checksum mismatch')
}
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
if (sourceRecord.readiness?.gstreamer !== sourceReadiness) fail('source record readiness mismatch')
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
      runId,
      changedFiles,
      nextMilestone,
    },
    null,
    2,
  ),
)
