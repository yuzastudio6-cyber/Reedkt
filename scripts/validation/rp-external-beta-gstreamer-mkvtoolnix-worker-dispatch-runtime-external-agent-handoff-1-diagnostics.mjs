#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-HANDOFF-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1-record.json`
const qaRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_handoff_contract'
const execution = 'completed_docs_only_external_agent_handoff_no_runtime_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-DRY-RUN-1'
const sourceGateMergeSha = '488df755ef9f9954e8696ed336f9106bada06319'
const dryRunMergeSha = 'ef5b15adcf5de407f3083abb64ffc14b298692cc'
const executionPacketMergeSha = 'fc0706786e3413fdfc364d62a87adb45cc64ca36'
const executionQaMergeSha = 'b5e0177750f2fdaef0a3e8780e31026838b17d23'
const executionPacketRunId = '2026-07-02T16-27-38-186Z-1ce73813'
const runtimeDelegateRunId = '2026-07-02T16-27-38-291Z-a5f6a279'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const workerSource = 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_DRY_RUN'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/handoff-contract.md`,
  `${dir}/command-template-allowlist.md`,
  `${dir}/readiness.md`,
  `${dir}/rollback-cleanup.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1-diagnostics.mjs',
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
  /\b(?:Route execution in this handoff phase|External agent runtime invocation in this handoff phase|Real worker dispatch in this handoff phase|Worker process started in this handoff phase|Worker execution in this handoff phase|Worker lease claim in this handoff phase|Persistent job queue write in this handoff phase|GStreamer execution in this handoff phase|MKVToolNix execution in this handoff phase|FFmpeg\/FFprobe execution in this handoff phase|Docker execution in this handoff phase|Supabase mutation in this handoff phase|SQL execution in this handoff phase|Public artifact creation in this handoff phase|Final render\/export in this handoff phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"externalAgentRuntimeInvocationInThisHandoffPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisHandoffPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisHandoffPhase"\s*:\s*true/i,
  /"workerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisHandoffPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisHandoffPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"dockerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"remotionExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"supabaseMutationInThisHandoffPhase"\s*:\s*true/i,
  /"sqlExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisHandoffPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisHandoffPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisHandoffPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisHandoffPhase"\s*:\s*true/i,
  /"finalRenderExportInThisHandoffPhase"\s*:\s*true/i,
  /"externalBetaUnlockInThisHandoffPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisHandoffPhase"\s*:\s*true/i,
  /"productionUnlockInThisHandoffPhase"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
  /"dependencyMutation"\s*:\s*true/i,
]

const requiredText = [
  packet,
  decision,
  execution,
  sourceGateMergeSha,
  dryRunMergeSha,
  executionPacketMergeSha,
  executionQaMergeSha,
  'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet',
  'qa_passed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet_evidence',
  executionPacketRunId,
  runtimeDelegateRunId,
  routePath,
  workerSource,
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  confirmEnv,
  'controlled_generated_fixture_only',
  'ready_for_confirmation_gated_external_agent_dispatch_dry_run',
  'Route execution in this handoff phase: `false`',
  'External agent runtime invocation in this handoff phase: `false`',
  'Real worker dispatch in this handoff phase: `false`',
  'Worker process started in this handoff phase: `false`',
  'Worker execution in this handoff phase: `false`',
  'Worker lease claim in this handoff phase: `false`',
  'Persistent job queue write in this handoff phase: `false`',
  'GStreamer execution in this handoff phase: `false`',
  'MKVToolNix execution in this handoff phase: `false`',
  'FFmpeg/FFprobe execution in this handoff phase: `false`',
  'Docker execution in this handoff phase: `false`',
  'Supabase mutation in this handoff phase: `false`',
  'SQL execution in this handoff phase: `false`',
  'Public artifact creation in this handoff phase: `false`',
  'Final render/export in this handoff phase: `false`',
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

for (const file of [...packetFiles, ...implementationFiles, qaRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1-diagnostics.mjs'
) {
  fail('missing external-agent handoff diagnostics package script')
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
if (record.sourceChain?.executionPacketRunId !== executionPacketRunId) fail('execution packet run ID mismatch')
if (record.sourceChain?.runtimeDelegateRunId !== runtimeDelegateRunId) fail('runtime delegate run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target project ref mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.workerSourcePath !== workerSource) fail('worker source mismatch')
if (record.requiredFutureConfirmationGate !== confirmEnv) fail('confirmation gate mismatch')
if (record.allowlist?.fixtureScope !== 'controlled_generated_fixture_only') fail('fixture scope mismatch')
for (const [key, value] of Object.entries(record.allowlist ?? {})) {
  if (key !== 'fixtureScope' && value !== false) fail(`allowlist restriction must be false: ${key}`)
}
for (const [key, value] of Object.entries(record.handoffPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`handoff phase safety flag must be false: ${key}`)
  }
}
if (record.readiness?.externalAgentDryRun !== 'ready_for_confirmation_gated_external_agent_dispatch_dry_run') fail('readiness mismatch')
if (record.rollbackPlanId !== 'rollback-remote-claim-lease-already-verified-no-persistent-dispatch-residue') fail('rollback plan mismatch')
if (record.cleanupPlanId !== 'cleanup-tmp-evidence-only-no-persistent-public-artifacts') fail('cleanup plan mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const qaRecord = json(qaRecordPath)
if (qaRecord.decision !== 'qa_passed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet_evidence') fail('QA record decision mismatch')
if (qaRecord.sourceChain?.executionQaMergeSha && qaRecord.sourceChain.executionQaMergeSha !== executionQaMergeSha) fail('unexpected QA record merge mismatch')
if (qaRecord.sourceChain?.executionPacketRunId !== executionPacketRunId) fail('QA record execution run ID mismatch')
if (qaRecord.sourceChain?.runtimeDelegateRunId !== runtimeDelegateRunId) fail('QA record runtime delegate run ID mismatch')
if (qaRecord.routePath !== routePath) fail('QA record route mismatch')
if (qaRecord.workerSourcePath !== workerSource) fail('QA record worker source mismatch')
if (qaRecord.nextMilestone !== packet) fail('QA record next milestone mismatch')

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
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile() && /^(docs\/|package\.json$)/.test(file))
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
  readiness: 'ready_for_confirmation_gated_external_agent_dispatch_dry_run',
  changedFiles: uniqueChangedFiles,
}, null, 2))
