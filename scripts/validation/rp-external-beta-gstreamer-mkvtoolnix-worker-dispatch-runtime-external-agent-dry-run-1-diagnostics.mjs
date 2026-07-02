#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-DRY-RUN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1-record.json`
const handoffRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_dry_run_envelope'
const execution = 'completed_confirmation_gated_external_agent_dry_run_metadata_only_no_runtime_execution'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_DRY_RUN'
const sourceGateMergeSha = '488df755ef9f9954e8696ed336f9106bada06319'
const dryRunMergeSha = 'ef5b15adcf5de407f3083abb64ffc14b298692cc'
const executionPacketMergeSha = 'fc0706786e3413fdfc364d62a87adb45cc64ca36'
const executionQaMergeSha = 'b5e0177750f2fdaef0a3e8780e31026838b17d23'
const handoffMergeSha = '3b96c009902fe72265446264398018b489401880'
const executionPacketRunId = '2026-07-02T16-27-38-186Z-1ce73813'
const runtimeDelegateRunId = '2026-07-02T16-27-38-291Z-a5f6a279'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const workerSource = 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
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
  /\b(?:Route execution in this dry-run phase|External agent runtime invocation in this dry-run phase|Real worker dispatch in this dry-run phase|Worker process started in this dry-run phase|Worker execution in this dry-run phase|Worker lease claim in this dry-run phase|Worker lease mutation in this dry-run phase|Persistent job queue write in this dry-run phase|GStreamer execution in this dry-run phase|MKVToolNix execution in this dry-run phase|FFmpeg\/FFprobe execution in this dry-run phase|Docker execution in this dry-run phase|Supabase mutation in this dry-run phase|SQL execution in this dry-run phase|Public artifact creation in this dry-run phase|Final render\/export in this dry-run phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"externalAgentRuntimeInvocationInThisDryRunPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisDryRunPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisDryRunPhase"\s*:\s*true/i,
  /"workerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisDryRunPhase"\s*:\s*true/i,
  /"workerLeaseMutationInThisDryRunPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisDryRunPhase"\s*:\s*true/i,
  /"serviceRoleRouteExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"serviceRoleSecretPayloadAccessInThisDryRunPhase"\s*:\s*true/i,
  /"secretPayloadAccessInThisDryRunPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"dockerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"remotionExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"mediaProcessingInThisDryRunPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisDryRunPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisDryRunPhase"\s*:\s*true/i,
  /"supabaseMutationInThisDryRunPhase"\s*:\s*true/i,
  /"sqlExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisDryRunPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisDryRunPhase"\s*:\s*true/i,
  /"creditMutationInThisDryRunPhase"\s*:\s*true/i,
  /"providerCallInThisDryRunPhase"\s*:\s*true/i,
  /"modelCallInThisDryRunPhase"\s*:\s*true/i,
  /"deploymentInThisDryRunPhase"\s*:\s*true/i,
  /"externalBetaUnlockInThisDryRunPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisDryRunPhase"\s*:\s*true/i,
  /"productionUnlockInThisDryRunPhase"\s*:\s*true/i,
  /"finalRenderExportInThisDryRunPhase"\s*:\s*true/i,
  /"packageLockMutationInThisDryRunPhase"\s*:\s*true/i,
  /"dependencyMutationInThisDryRunPhase"\s*:\s*true/i,
]

const requiredText = [
  packet,
  decision,
  execution,
  confirmEnv,
  sourceGateMergeSha,
  dryRunMergeSha,
  executionPacketMergeSha,
  executionQaMergeSha,
  handoffMergeSha,
  executionPacketRunId,
  runtimeDelegateRunId,
  routePath,
  workerSource,
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  'controlled_generated_fixture_only',
  'completed_confirmation_gated_external_agent_dry_run_metadata_only',
  'ready_for_guarded_external_agent_dispatch_runtime_execution_packet_not_broad_media',
  'Route execution in this dry-run phase: `false`',
  'External agent runtime invocation in this dry-run phase: `false`',
  'Real worker dispatch in this dry-run phase: `false`',
  'Worker process started in this dry-run phase: `false`',
  'Worker execution in this dry-run phase: `false`',
  'Worker lease claim in this dry-run phase: `false`',
  'Worker lease mutation in this dry-run phase: `false`',
  'Persistent job queue write in this dry-run phase: `false`',
  'GStreamer execution in this dry-run phase: `false`',
  'MKVToolNix execution in this dry-run phase: `false`',
  'FFmpeg/FFprobe execution in this dry-run phase: `false`',
  'Docker execution in this dry-run phase: `false`',
  'Supabase mutation in this dry-run phase: `false`',
  'SQL execution in this dry-run phase: `false`',
  'Public artifact creation in this dry-run phase: `false`',
  'Final render/export in this dry-run phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked and excluded',
  nextMilestone,
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

for (const file of [...packetFiles, ...implementationFiles, handoffRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1.mjs'
) {
  fail('missing external-agent dry-run runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1-diagnostics.mjs'
) {
  fail('missing external-agent dry-run diagnostics package script')
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
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.sourceGateMergeSha !== sourceGateMergeSha) fail('source-gate merge SHA mismatch')
if (record.sourceChain?.dryRunMergeSha !== dryRunMergeSha) fail('dry-run merge SHA mismatch')
if (record.sourceChain?.executionPacketMergeSha !== executionPacketMergeSha) fail('execution packet merge SHA mismatch')
if (record.sourceChain?.executionQaMergeSha !== executionQaMergeSha) fail('execution QA merge SHA mismatch')
if (record.sourceChain?.externalAgentHandoffMergeSha !== handoffMergeSha) fail('handoff merge SHA mismatch')
if (record.sourceChain?.executionPacketRunId !== executionPacketRunId) fail('execution packet run ID mismatch')
if (record.sourceChain?.runtimeDelegateRunId !== runtimeDelegateRunId) fail('runtime delegate run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target project ref mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.workerSourcePath !== workerSource) fail('worker source mismatch')
if (record.confirmationGate !== confirmEnv) fail('confirmation gate mismatch')
if (!/^2026-/.test(record.runId)) fail('run ID not recorded')
if (!String(record.outputDir).startsWith('/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1/')) {
  fail('output directory must be local /tmp dry-run evidence path')
}
if (!String(record.report).endsWith('/external-agent-dry-run-report.json')) fail('report path mismatch')
if (!String(record.manifest).endsWith('/external-agent-dry-run-manifest.json')) fail('manifest path mismatch')
if (!String(record.envelope?.path).endsWith('/external-agent-dry-run-envelope.json')) fail('envelope path mismatch')
if (!/^[a-f0-9]{64}$/.test(record.envelope?.sha256 ?? '')) fail('envelope checksum mismatch')
if (!String(record.qaReport?.path).endsWith('/external-agent-dry-run-qa-report.json')) fail('QA report path mismatch')
if (!/^[a-f0-9]{64}$/.test(record.qaReport?.sha256 ?? '')) fail('QA report checksum mismatch')
if (record.dryRun?.status !== 'completed_confirmation_gated_external_agent_dry_run_metadata_only') fail('dry-run status mismatch')
for (const [key, value] of Object.entries(record.dryRunPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsAndLocalEnvelopeOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`dry-run phase safety flag must be false: ${key}`)
  }
}
if (
  record.readiness?.externalAgentExecutionPacket !==
  'ready_for_guarded_external_agent_dispatch_runtime_execution_packet_not_broad_media'
) {
  fail('external-agent execution packet readiness mismatch')
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const handoffRecord = json(handoffRecordPath)
if (handoffRecord.decision !== 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_handoff_contract') {
  fail('handoff record decision mismatch')
}
if (handoffRecord.requiredFutureConfirmationGate !== confirmEnv) fail('handoff confirmation gate mismatch')
if (handoffRecord.nextMilestone !== packet) fail('handoff next milestone mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenChangedPathPatterns.some((pattern) => pattern.test(file))) {
    fail(`forbidden changed path: ${file}`)
  }
}

const changedCorpus = uniqueChangedFiles
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile() && /^(docs\/|scripts\/validation\/|package\.json$)/.test(file))
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  runId: record.runId,
  readiness: record.readiness.externalAgentExecutionPacket,
  changedFiles: uniqueChangedFiles,
}, null, 2))
