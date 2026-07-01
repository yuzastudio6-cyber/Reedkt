#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-EXECUTION-PACKET-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-record.json`
const integrationBase = 'dbb4884f08aa9c77467ec07039633784db6d798b'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_execution_packet'
const execution =
  'completed_confirmation_gated_registered_noop_source_route_worker_execution_packet_no_route_worker_tool_or_media_execution'
const gate =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_ROUTE_WORKER_EXECUTION_PACKET=true'
const runId = '2026-07-01T17-09-09-384Z-6d4e5122'
const readiness = 'ready_for_registered_noop_source_route_worker_execution_packet_qa_rollup'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-EXECUTION-PACKET-QA-ROLLUP-1'
const sourceDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_dry_run_evidence'
const sourceExecution = 'completed_docs_only_registered_noop_source_route_worker_dry_run_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceReadiness = 'ready_for_guarded_registered_noop_source_route_worker_execution_packet'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/execution-result.md`,
  `${dir}/command-matrix.md`,
  `${dir}/artifact-manifest.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1.md',
]

const implementationFiles = [
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  integrationBase,
  decision,
  execution,
  sourceDecision,
  sourceExecution,
  sourceReadiness,
  gate,
  runId,
  'registered_noop_route_worker_execution_packet_contract_only',
  'accepted_registered_noop_source_contract',
  'Source QA rollup merge SHA: `dbb4884f08aa9c77467ec07039633784db6d798b`',
  'Route source id: `externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource`',
  'Route source path: `/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary`',
  'Route owner: `backend_service_role_only`',
  'Route registration mode: `source_declared_registered_but_runtime_disabled`',
  'Route runtime mode: `disabled_registered_noop_source_contract_only`',
  'Worker source mode: `source_declared_not_dispatched`',
  'Fail-closed no-gate check: `passed`',
  'Negative fail-closed route/worker blocker matrix | `passed`',
  'registered-noop-source-route-worker-execution-packet-envelope.json',
  'registered-noop-source-route-worker-execution-packet-report.json',
  'registered-noop-source-route-worker-execution-packet-manifest.json',
  'a956ec96c00fcc5d064ddf316d72c4e493308b2eafcfc6319d82398b6a99b37e',
  '76b0e134c2a83ae8a19a3a2a2f25f03bad079b8f2b96195b852a551ac9c60601',
  '41fab60d996d8838b87734f5ef57022b54e47f42e2e5d1527377538e746ec201',
  'Production route file created in this execution packet phase: `false`',
  'Route registered at runtime in this execution packet phase: `false`',
  'Route execution in this execution packet phase: `false`',
  'Worker dispatch in this execution packet phase: `false`',
  'Worker execution in this execution packet phase: `false`',
  'Worker process start in this execution packet phase: `false`',
  'Worker lease claim in this execution packet phase: `false`',
  'Persistent job queue write in this execution packet phase: `false`',
  'GStreamer execution in this execution packet phase: `false`',
  'MKVToolNix execution in this execution packet phase: `false`',
  'Docker execution in this execution packet phase: `false`',
  'FFmpeg/FFprobe execution in this execution packet phase: `false`',
  'Supabase mutation in this execution packet phase: `false`',
  'SQL execution in this execution packet phase: `false`',
  'Public artifact creation in this execution packet phase: `false`',
  'Final render/export in this execution packet phase: `false`',
  `GStreamer readiness: \`${readiness}\``,
  `MKVToolNix readiness: \`${readiness}\``,
  `External-agent route/worker boundary readiness: \`${readiness}\``,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const runnerText = [
  'const confirmationEnv =',
  gate.replace('=true', ''),
  'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_registered_noop_source_route_worker_execution_packet_confirmation',
  'buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput',
  'validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput',
  'createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse',
  'registered_noop_route_worker_execution_packet_contract_only',
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
  /^server\/(?!smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1\.ts$)/,
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
  /\b(?:Production route file created in this execution packet phase|Route registered at runtime in this execution packet phase|Route execution in this execution packet phase|Worker dispatch in this execution packet phase|Worker execution in this execution packet phase|Worker process start in this execution packet phase|Worker lease claim in this execution packet phase|Persistent job queue write in this execution packet phase|GStreamer execution in this execution packet phase|MKVToolNix execution in this execution packet phase|Docker execution in this execution packet phase|FFmpeg\/FFprobe execution in this execution packet phase|Remotion execution in this execution packet phase|Private media processing in this execution packet phase|User media processing in this execution packet phase|Media processing in this execution packet phase|Supabase mutation in this execution packet phase|SQL execution in this execution packet phase|Signed URL creation in this execution packet phase|Public artifact creation in this execution packet phase|Final render\/export in this execution packet phase|Broad external beta unlock in this execution packet phase|Paid production unlock in this execution packet phase|Production unlock in this execution packet phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisExecutionPacketPhase"\s*:\s*true/i,
  /"routeRegisteredAtRuntimeInThisExecutionPacketPhase"\s*:\s*true/i,
  /"routeExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"workerDispatchInThisExecutionPacketPhase"\s*:\s*true/i,
  /"workerExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"workerProcessStartInThisExecutionPacketPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisExecutionPacketPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisExecutionPacketPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"dockerExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"supabaseMutationInThisExecutionPacketPhase"\s*:\s*true/i,
  /"sqlExecutionInThisExecutionPacketPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisExecutionPacketPhase"\s*:\s*true/i,
  /"finalRenderExportInThisExecutionPacketPhase"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1.ts'
) {
  fail('missing execution packet package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-diagnostics.mjs'
) {
  fail('missing execution packet diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const runner = read(implementationFiles[0])
for (const text of runnerText) {
  if (!runner.includes(text)) fail(`missing runner text: ${text}`)
}
for (const pattern of [/child_process/, /\bfetch\s*\(/, /createClient\s*\(/, /SERVICE_ROLE_KEY|service_role_key|service-role-key/i, /docker\s+(build|run|push|deploy)/i]) {
  if (pattern.test(runner)) fail(`forbidden executable pattern in runner: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaRollupMergeSha !== integrationBase) fail('source merge SHA mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaDecision !== sourceDecision) fail('source decision mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaExecution !== sourceExecution) fail('source execution mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunQaReadiness !== sourceReadiness) fail('source readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.confirmation?.gate !== gate.replace('=true', '')) fail('confirmation gate mismatch')
if (record.confirmation?.value !== 'true') fail('confirmation value mismatch')
if (record.executionPacket?.result !== 'passed') fail('execution packet result mismatch')
if (record.executionPacket?.mode !== 'registered_noop_route_worker_execution_packet_contract_only') fail('execution packet mode mismatch')
if (record.executionPacket?.acceptedSourceStatus !== 'accepted_registered_noop_source_contract') fail('accepted source status mismatch')
if (record.executionPacket?.positiveEnvelopeValidation !== 'passed') fail('positive validation mismatch')
if (record.executionPacket?.negativeFailClosedMatrix !== 'passed') fail('negative matrix mismatch')
for (const key of [
  'routeRegisteredAtRuntime',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseClaim',
  'persistentQueueWrite',
]) {
  if (record.executionPacket?.[key] !== false) fail(`execution packet flag must stay false: ${key}`)
}
for (const key of Object.keys(record.safety ?? {})) {
  if (record.safety[key] !== false) fail(`safety flag must stay false: ${key}`)
}
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
if (record.readiness?.externalAgentBoundary !== readiness) fail('external-agent readiness mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.artifacts?.envelope?.bytes !== 4734) fail('envelope byte count mismatch')
if (record.artifacts?.envelope?.sha256 !== 'a956ec96c00fcc5d064ddf316d72c4e493308b2eafcfc6319d82398b6a99b37e') fail('envelope checksum mismatch')
if (record.artifacts?.report?.bytes !== 5743) fail('report byte count mismatch')
if (record.artifacts?.report?.sha256 !== '76b0e134c2a83ae8a19a3a2a2f25f03bad079b8f2b96195b852a551ac9c60601') fail('report checksum mismatch')
if (record.artifacts?.manifest?.bytes !== 1309) fail('manifest byte count mismatch')
if (record.artifacts?.manifest?.sha256 !== '41fab60d996d8838b87734f5ef57022b54e47f42e2e5d1527377538e746ec201') fail('manifest checksum mismatch')

const changedFiles = [...new Set([...gitLines(['diff', '--name-only']), ...gitLines(['ls-files', '--others', '--exclude-standard'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = fs.readFileSync(file, 'utf8')
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim matched in ${file}: ${pattern}`)
    }
  }
}
if (gitLines(['diff', '--name-only', '--', 'package-lock.json']).length > 0) fail('package-lock changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')

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
