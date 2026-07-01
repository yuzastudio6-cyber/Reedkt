#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-DISPATCH-PLANNING-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1-record.json'
const integrationBase = '2d9efe1d7cc0d31b8d2588ec398c7688134918b2'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_controlled_dispatch_planning'
const execution = 'completed_docs_only_controlled_dispatch_planning_no_route_worker_tool_or_media_execution'
const sourceDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_execution_packet_evidence'
const sourceExecution =
  'completed_docs_only_registered_noop_source_route_worker_execution_packet_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceReadiness = 'ready_for_guarded_registered_noop_source_route_worker_controlled_dispatch_planning'
const readiness = 'ready_for_guarded_registered_noop_source_route_worker_controlled_dispatch_execution_packet'
const planningReadiness = 'ready_for_future_confirmation_gated_controlled_dispatch_execution_packet'
const gate =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_CONTROLLED_DISPATCH_EXECUTION=true'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-DISPATCH-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dispatch-boundary.md`,
  `${dir}/guard-matrix.md`,
  `${dir}/command-scope.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1/qa-decision.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1/readiness.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1.md',
]

const controlledDispatchExecutionDir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1'
const controlledDispatchExecutionFiles = [
  `${controlledDispatchExecutionDir}/source-audit.md`,
  `${controlledDispatchExecutionDir}/execution-result.md`,
  `${controlledDispatchExecutionDir}/command-matrix.md`,
  `${controlledDispatchExecutionDir}/artifact-manifest.md`,
  `${controlledDispatchExecutionDir}/negative-cases.md`,
  `${controlledDispatchExecutionDir}/readiness.md`,
  `${controlledDispatchExecutionDir}/safety-boundary.md`,
  `${controlledDispatchExecutionDir}/validation-results.md`,
  `${controlledDispatchExecutionDir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-qa-rollup-1.md',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...controlledDispatchExecutionFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  sourceExecution,
  sourceReadiness,
  readiness,
  planningReadiness,
  'Source QA rollup PR: `#2011`',
  'Source QA rollup merge SHA: `2d9efe1d7cc0d31b8d2588ec398c7688134918b2`',
  'Prior source execution packet PR: `#2006`',
  'Prior source execution packet merge SHA: `565124cf4fc62295c1788df51de0bc951f459413`',
  gate,
  'registered_noop_source_route_worker_controlled_dispatch_contract_only',
  'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource',
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary',
  'confirmation_gated_controlled_dispatch_contract_without_tool_or_media_execution',
  'Production route file created in this planning phase: `false`',
  'Route registered at runtime in this planning phase: `false`',
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
  'Signed URL creation in this planning phase: `false`',
  'Public artifact creation in this planning phase: `false`',
  'Final render/export in this planning phase: `false`',
  `GStreamer readiness: \`${readiness}\``,
  `MKVToolNix readiness: \`${readiness}\``,
  `External-agent route/worker boundary readiness: \`${readiness}\``,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1\.ts$)/,
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
  /\b(?:Production route file created in this planning phase|Route registered at runtime in this planning phase|Route execution in this planning phase|Worker dispatch in this planning phase|Worker execution in this planning phase|Worker process start in this planning phase|Worker lease claim in this planning phase|Persistent job queue write in this planning phase|Service-role secret payload access in this planning phase|Frontend credential exposure in this planning phase|Broad service-role handler in this planning phase|GStreamer execution in this planning phase|MKVToolNix execution in this planning phase|Docker execution in this planning phase|FFmpeg\/FFprobe execution in this planning phase|Remotion execution in this planning phase|Private media processing in this planning phase|User media processing in this planning phase|Media processing in this planning phase|Supabase mutation in this planning phase|SQL execution in this planning phase|Signed URL creation in this planning phase|Public artifact creation in this planning phase|Final render\/export in this planning phase|Broad external beta unlock in this planning phase|Paid production unlock in this planning phase|Production unlock in this planning phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisPlanningPhase"\s*:\s*true/i,
  /"routeRegisteredAtRuntimeInThisPlanningPhase"\s*:\s*true/i,
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
  /"signedUrlCreationInThisPlanningPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisPlanningPhase"\s*:\s*true/i,
  /"finalRenderExportInThisPlanningPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisPlanningPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisPlanningPhase"\s*:\s*true/i,
  /"productionUnlockInThisPlanningPhase"\s*:\s*true/i,
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
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1-diagnostics.mjs'
) {
  fail('missing controlled dispatch planning diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== sourceDecision) fail('source record decision mismatch')
if (sourceRecord.execution !== sourceExecution) fail('source record execution mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketQaRollupPr !== 2011) fail('source PR mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketQaRollupMergeSha !== integrationBase) fail('source merge SHA mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketQaRollupDecision !== sourceDecision) fail('source decision mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketQaRollupExecution !== sourceExecution) fail('source execution mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketQaRollupReadiness !== sourceReadiness) fail('source readiness mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketPr !== 2006) fail('prior source PR mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketMergeSha !== '565124cf4fc62295c1788df51de0bc951f459413') {
  fail('prior source merge SHA mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.plannedFutureExecution?.confirmationGate !== gate.replace('=true', '')) fail('future confirmation gate mismatch')
if (record.plannedFutureExecution?.confirmationValue !== 'true') fail('future confirmation value mismatch')
if (record.plannedFutureExecution?.fixtureClass !== 'registered_noop_source_route_worker_controlled_dispatch_contract_only') fail('fixture class mismatch')
if (record.plannedFutureExecution?.dispatchMode !== 'confirmation_gated_controlled_dispatch_contract_without_tool_or_media_execution') fail('dispatch mode mismatch')
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
if (record.readiness?.externalAgentBoundary !== readiness) fail('external-agent readiness mismatch')
if (record.readiness?.controlledDispatchPlanning !== planningReadiness) fail('planning readiness mismatch')
for (const key of Object.keys(record.safety ?? {})) {
  if (record.safety[key] !== false) fail(`safety flag must stay false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

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
      changedFiles,
      nextMilestone,
    },
    null,
    2,
  ),
)
