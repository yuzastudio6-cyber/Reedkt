#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-EXECUTION-PACKET-QA-ROLLUP-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-record.json'
const integrationBase = '565124cf4fc62295c1788df51de0bc951f459413'
const decision = 'qa_passed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_execution_packet_evidence'
const execution =
  'completed_docs_only_registered_noop_source_route_worker_execution_packet_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceDecision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_execution_packet'
const sourceExecution =
  'completed_confirmation_gated_registered_noop_source_route_worker_execution_packet_no_route_worker_tool_or_media_execution'
const sourceReadiness = 'ready_for_registered_noop_source_route_worker_execution_packet_qa_rollup'
const readiness = 'ready_for_guarded_registered_noop_source_route_worker_controlled_dispatch_planning'
const runId = '2026-07-01T17-09-09-384Z-6d4e5122'
const gate =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_ROUTE_WORKER_EXECUTION_PACKET=true'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-DISPATCH-PLANNING-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/qa-decision.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-dispatch-planning-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/execution-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/command-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/artifact-manifest.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/negative-cases.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-1/validation-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1.md',
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
  'Source execution packet PR: `#2006`',
  'Source execution packet merge SHA: `565124cf4fc62295c1788df51de0bc951f459413`',
  `Source run ID: \`${runId}\``,
  gate,
  'Fail-closed no-gate check',
  'Positive envelope validation',
  'Negative fail-closed route/worker blocker matrix',
  'Route execution false flag',
  'Worker dispatch false flag',
  'Worker execution false flag',
  'Tool/media/Supabase/SQL/public artifact/unlock false flags',
  'registered-noop-source-route-worker-execution-packet-envelope.json',
  'registered-noop-source-route-worker-execution-packet-report.json',
  'registered-noop-source-route-worker-execution-packet-manifest.json',
  'a956ec96c00fcc5d064ddf316d72c4e493308b2eafcfc6319d82398b6a99b37e',
  '76b0e134c2a83ae8a19a3a2a2f25f03bad079b8f2b96195b852a551ac9c60601',
  '41fab60d996d8838b87734f5ef57022b54e47f42e2e5d1527377538e746ec201',
  'Production route file created in this QA rollup phase: `false`',
  'Route registered at runtime in this QA rollup phase: `false`',
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
  /\b(?:Production route file created in this QA rollup phase|Route registered at runtime in this QA rollup phase|Route execution in this QA rollup phase|Worker dispatch in this QA rollup phase|Worker execution in this QA rollup phase|Worker process start in this QA rollup phase|Worker lease claim in this QA rollup phase|Persistent job queue write in this QA rollup phase|Service-role secret payload access in this QA rollup phase|Frontend credential exposure in this QA rollup phase|Broad service-role handler in this QA rollup phase|GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|Docker execution in this QA rollup phase|FFmpeg\/FFprobe execution in this QA rollup phase|Remotion execution in this QA rollup phase|Private media processing in this QA rollup phase|User media processing in this QA rollup phase|Media processing in this QA rollup phase|Supabase mutation in this QA rollup phase|SQL execution in this QA rollup phase|Signed URL creation in this QA rollup phase|Public artifact creation in this QA rollup phase|Final render\/export in this QA rollup phase|Broad external beta unlock in this QA rollup phase|Paid production unlock in this QA rollup phase|Production unlock in this QA rollup phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisQaRollupPhase"\s*:\s*true/i,
  /"routeRegisteredAtRuntimeInThisQaRollupPhase"\s*:\s*true/i,
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
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-execution-packet-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing execution packet QA rollup diagnostics package script')
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
if (sourceRecord.runId !== runId) fail('source run ID mismatch')
if (sourceRecord.nextMilestone !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-EXECUTION-PACKET-QA-ROLLUP-1') {
  fail('source next milestone mismatch')
}
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketPr !== 2006) fail('source PR mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketMergeSha !== integrationBase) fail('source merge SHA mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketDecision !== sourceDecision) fail('source decision mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketExecution !== sourceExecution) fail('source execution mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerExecutionPacketReadiness !== sourceReadiness) fail('source readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.qa?.scope !== 'source_evidence_review_only') fail('QA scope mismatch')
if (record.qa?.sourceRunId !== runId) fail('source run ID mismatch')
if (record.qa?.failClosedNoGateCheck !== 'passed') fail('fail-closed no-gate mismatch')
if (record.qa?.positiveEnvelopeValidation !== 'passed') fail('positive envelope validation mismatch')
if (record.qa?.negativeFailClosedMatrix !== 'passed') fail('negative matrix mismatch')
if (record.qa?.routeExecutionFalseFlag !== 'passed') fail('route false-flag mismatch')
if (record.qa?.workerDispatchFalseFlag !== 'passed') fail('worker dispatch false-flag mismatch')
if (record.qa?.workerExecutionFalseFlag !== 'passed') fail('worker execution false-flag mismatch')
if (record.qa?.toolMediaSupabaseSqlUnlockFalseFlags !== 'passed') fail('tool/media/safety false-flag mismatch')
if (record.artifacts?.envelope?.bytes !== 4734) fail('envelope byte count mismatch')
if (record.artifacts?.envelope?.sha256 !== 'a956ec96c00fcc5d064ddf316d72c4e493308b2eafcfc6319d82398b6a99b37e') fail('envelope checksum mismatch')
if (record.artifacts?.report?.bytes !== 5743) fail('report byte count mismatch')
if (record.artifacts?.report?.sha256 !== '76b0e134c2a83ae8a19a3a2a2f25f03bad079b8f2b96195b852a551ac9c60601') fail('report checksum mismatch')
if (record.artifacts?.manifest?.bytes !== 1309) fail('manifest byte count mismatch')
if (record.artifacts?.manifest?.sha256 !== '41fab60d996d8838b87734f5ef57022b54e47f42e2e5d1527377538e746ec201') fail('manifest checksum mismatch')
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
if (record.readiness?.externalAgentBoundary !== readiness) fail('external-agent readiness mismatch')
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
