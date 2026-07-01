#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-DISPATCH-EXECUTION-PACKET-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1-record.json'
const integrationBase = 'c4228c3939f30fae3646d7f477207d64d566309c'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_controlled_dispatch_execution_packet'
const execution = 'completed_confirmation_gated_controlled_dispatch_contract_no_route_worker_tool_or_media_execution'
const sourceDecision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_controlled_dispatch_planning'
const sourceReadiness = 'ready_for_guarded_registered_noop_source_route_worker_controlled_dispatch_execution_packet'
const readiness = 'ready_for_controlled_dispatch_execution_packet_qa_rollup'
const runId = '2026-07-01T18-17-14-399Z-aac75a2e'
const gate =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_CONTROLLED_DISPATCH_EXECUTION=true'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-DISPATCH-EXECUTION-PACKET-QA-ROLLUP-1'
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
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-qa-rollup-1.md',
]

const implementationFiles = [
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1/readiness.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  integrationBase,
  decision,
  execution,
  sourceDecision,
  sourceReadiness,
  readiness,
  'Source planning PR: `#2014`',
  'Source planning merge SHA: `c4228c3939f30fae3646d7f477207d64d566309c`',
  `Run ID: \`${runId}\``,
  gate,
  'Fail-closed no-gate check: `passed`',
  'Controlled dispatch envelope validation: `passed`',
  'Negative fail-closed controlled dispatch blocker matrix: `passed`',
  'registered_noop_source_route_worker_controlled_dispatch_contract_only',
  'confirmation_gated_controlled_dispatch_contract_without_tool_or_media_execution',
  'controlled-dispatch-contract-gstreamer-mkvtoolnix-narrow-1',
  'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource',
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary',
  'controlled-dispatch-execution-packet-envelope.json',
  'controlled-dispatch-execution-packet-report.json',
  'controlled-dispatch-execution-packet-manifest.json',
  '9d4adf6219f2c1cada965264899c5b50116640a964934f3bede6b95be8335fa4',
  '0bfd227e8a59ffc729d43ceadf8f7b387a3a5c87e7b751c81d0d805b521cb7f5',
  'ec29c9ed135ec29ff39c8d3094c9cae1cf459abec187d28fb6ad4c9507526542',
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
  'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_controlled_dispatch_execution_confirmation',
  'registered_noop_source_route_worker_controlled_dispatch_contract_only',
  'confirmation_gated_controlled_dispatch_contract_without_tool_or_media_execution',
  'validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput',
  'createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse',
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
  /\b(?:Route execution in this execution packet phase|Worker dispatch in this execution packet phase|Worker execution in this execution packet phase|Worker process start in this execution packet phase|Worker lease claim in this execution packet phase|Persistent job queue write in this execution packet phase|GStreamer execution in this execution packet phase|MKVToolNix execution in this execution packet phase|Docker execution in this execution packet phase|FFmpeg\/FFprobe execution in this execution packet phase|Remotion execution in this execution packet phase|Private media processing in this execution packet phase|User media processing in this execution packet phase|Media processing in this execution packet phase|Supabase mutation in this execution packet phase|SQL execution in this execution packet phase|Signed URL creation in this execution packet phase|Public artifact creation in this execution packet phase|Final render\/export in this execution packet phase|Broad external beta unlock in this execution packet phase|Paid production unlock in this execution packet phase|Production unlock in this execution packet phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
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

for (const file of [...packetFiles, ...implementationFiles, ...sourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1.ts'
) {
  fail('missing controlled dispatch execution package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1-diagnostics.mjs'
) {
  fail('missing controlled dispatch execution diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const runner = read('server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-execution-packet-1.ts')
for (const text of runnerText) {
  if (!runner.includes(text)) fail(`missing runner text: ${text}`)
}
for (const pattern of [/child_process/, /\bfetch\s*\(/, /createClient\s*\(/, /SERVICE_ROLE_KEY|service_role_key|service-role-key/i, /docker\s+(build|run|push|deploy)/i]) {
  if (pattern.test(runner)) fail(`forbidden executable pattern in runner: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== sourceDecision) fail('source record decision mismatch')
if (sourceRecord.readiness?.gstreamer !== sourceReadiness) fail('source readiness mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source next milestone mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.controlledDispatchPlanningPr !== 2014) fail('source PR mismatch')
if (record.sourceChain?.controlledDispatchPlanningMergeSha !== integrationBase) fail('source merge SHA mismatch')
if (record.sourceChain?.controlledDispatchPlanningDecision !== sourceDecision) fail('source decision mismatch')
if (record.sourceChain?.controlledDispatchPlanningReadiness !== sourceReadiness) fail('source readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.confirmation?.gate !== gate.replace('=true', '')) fail('confirmation gate mismatch')
if (record.confirmation?.value !== 'true') fail('confirmation value mismatch')
if (record.executionPacket?.failClosedNoGateCheck !== 'passed') fail('fail-closed no-gate mismatch')
if (record.executionPacket?.confirmedExecution !== 'passed') fail('confirmed execution mismatch')
if (record.executionPacket?.mode !== 'registered_noop_source_route_worker_controlled_dispatch_contract_only') fail('mode mismatch')
if (record.executionPacket?.dispatchMode !== 'confirmation_gated_controlled_dispatch_contract_without_tool_or_media_execution') {
  fail('dispatch mode mismatch')
}
if (record.executionPacket?.positiveEnvelopeValidation !== 'passed') fail('positive validation mismatch')
if (record.executionPacket?.negativeFailClosedMatrix !== 'passed') fail('negative matrix mismatch')
if (record.artifacts?.envelope?.bytes !== 5838) fail('envelope bytes mismatch')
if (record.artifacts?.envelope?.sha256 !== '9d4adf6219f2c1cada965264899c5b50116640a964934f3bede6b95be8335fa4') fail('envelope checksum mismatch')
if (record.artifacts?.report?.bytes !== 6020) fail('report bytes mismatch')
if (record.artifacts?.report?.sha256 !== '0bfd227e8a59ffc729d43ceadf8f7b387a3a5c87e7b751c81d0d805b521cb7f5') fail('report checksum mismatch')
if (record.artifacts?.manifest?.bytes !== 1181) fail('manifest bytes mismatch')
if (record.artifacts?.manifest?.sha256 !== 'ec29c9ed135ec29ff39c8d3094c9cae1cf459abec187d28fb6ad4c9507526542') fail('manifest checksum mismatch')
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
if (record.readiness?.externalAgentBoundary !== readiness) fail('external-agent readiness mismatch')
if (record.readiness?.controlledDispatchExecutionPacket !== 'ready_for_source_evidence_qa_rollup') fail('packet readiness mismatch')
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
      runId,
      changedFiles,
      nextMilestone,
    },
    null,
    2,
  ),
)
