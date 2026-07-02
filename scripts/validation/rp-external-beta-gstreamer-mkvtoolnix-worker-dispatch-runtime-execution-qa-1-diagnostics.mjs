#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-QA-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-record.json'
const decision = 'qa_passed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet_evidence'
const execution = 'completed_docs_only_worker_dispatch_runtime_execution_qa_no_runtime_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-HANDOFF-1'
const sourceGateMergeSha = '488df755ef9f9954e8696ed336f9106bada06319'
const dryRunMergeSha = 'ef5b15adcf5de407f3083abb64ffc14b298692cc'
const executionPacketMergeSha = 'fc0706786e3413fdfc364d62a87adb45cc64ca36'
const executionPacketRunId = '2026-07-02T16-27-38-186Z-1ce73813'
const runtimeDelegateRunId = '2026-07-02T16-27-38-291Z-a5f6a279'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const workerSource = 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/qa-review.md`,
  `${dir}/route-runtime-boundary.md`,
  `${dir}/artifact-evidence.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-|smoke\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-)/,
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
  /\b(?:Route execution in this QA phase|Real worker dispatch in this QA phase|Worker process started in this QA phase|Worker execution in this QA phase|Worker lease claim in this QA phase|Persistent job queue write in this QA phase|GStreamer execution in this QA phase|MKVToolNix execution in this QA phase|FFmpeg\/FFprobe execution in this QA phase|Docker execution in this QA phase|Supabase mutation in this QA phase|SQL execution in this QA phase|Public artifact creation in this QA phase|Final render\/export in this QA phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisQaPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisQaPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisQaPhase"\s*:\s*true/i,
  /"workerExecutionInThisQaPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisQaPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisQaPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisQaPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQaPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisQaPhase"\s*:\s*true/i,
  /"dockerExecutionInThisQaPhase"\s*:\s*true/i,
  /"remotionExecutionInThisQaPhase"\s*:\s*true/i,
  /"supabaseMutationInThisQaPhase"\s*:\s*true/i,
  /"sqlExecutionInThisQaPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisQaPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisQaPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisQaPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisQaPhase"\s*:\s*true/i,
  /"finalRenderExportInThisQaPhase"\s*:\s*true/i,
  /"externalBetaUnlockInThisQaPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisQaPhase"\s*:\s*true/i,
  /"productionUnlockInThisQaPhase"\s*:\s*true/i,
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
  'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet',
  executionPacketRunId,
  runtimeDelegateRunId,
  routePath,
  workerSource,
  'completed_guarded_route_handler',
  'completed_existing_guarded_route_delegate',
  'completed_controlled_generated_fixture_only',
  'completed_local_image_only_network_disabled_no_push_no_deploy',
  'Route execution in this QA phase: `false`',
  'Real worker dispatch in this QA phase: `false`',
  'Worker process started in this QA phase: `false`',
  'Worker execution in this QA phase: `false`',
  'Worker lease claim in this QA phase: `false`',
  'Persistent job queue write in this QA phase: `false`',
  'GStreamer execution in this QA phase: `false`',
  'MKVToolNix execution in this QA phase: `false`',
  'FFmpeg/FFprobe execution in this QA phase: `false`',
  'Docker execution in this QA phase: `false`',
  'Supabase mutation in this QA phase: `false`',
  'SQL execution in this QA phase: `false`',
  'Public artifact creation in this QA phase: `false`',
  'Final render/export in this QA phase: `false`',
  'ready_for_external_agent_worker_dispatch_runtime_handoff',
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-diagnostics.mjs'
) {
  fail('missing worker dispatch runtime execution QA diagnostics package script')
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
if (record.sourceChain?.executionPacketDecision !== 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet') fail('execution packet decision mismatch')
if (record.sourceChain?.executionPacketRunId !== executionPacketRunId) fail('execution packet run ID mismatch')
if (record.sourceChain?.runtimeDelegateRunId !== runtimeDelegateRunId) fail('runtime delegate run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target project ref mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.workerSourcePath !== workerSource) fail('worker source mismatch')
if (record.qa?.scope !== 'source_evidence_review_only') fail('QA scope mismatch')
if (record.qa?.status !== 'passed') fail('QA status mismatch')
if (record.qa?.acceptance !== 'ready_for_external_agent_worker_dispatch_runtime_handoff') fail('QA acceptance mismatch')
if (record.acceptedEvidence?.routeHandlerInvocation !== 'completed_guarded_route_handler') fail('accepted route evidence mismatch')
if (record.acceptedEvidence?.runtimeRouteDelegate !== 'completed_existing_guarded_route_delegate') fail('accepted delegate evidence mismatch')
if (record.acceptedEvidence?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('accepted GStreamer evidence mismatch')
if (record.acceptedEvidence?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('accepted MKVToolNix evidence mismatch')
if (record.acceptedEvidence?.dockerExecution !== 'completed_local_image_only_network_disabled_no_push_no_deploy') fail('accepted Docker evidence mismatch')
for (const [key, value] of Object.entries(record.qaPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`QA phase safety flag must be false: ${key}`)
  }
}
if (record.readiness?.externalAgentHandoff !== 'ready_for_external_agent_worker_dispatch_runtime_handoff') fail('readiness mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet') fail('source record decision mismatch')
if (sourceRecord.confirmedRun?.runId !== executionPacketRunId) fail('source record execution run ID mismatch')
if (sourceRecord.runtimeRouteDelegate?.runnerRunId !== runtimeDelegateRunId) fail('source record runtime delegate run ID mismatch')
if (sourceRecord.routePath !== routePath) fail('source record route mismatch')
if (sourceRecord.workerSourcePath !== workerSource) fail('source record worker source mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source record next milestone mismatch')
for (const key of [
  'realWorkerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseMutation',
  'persistentJobQueueWrite',
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'dockerPushDeploy',
  'remotionExecution',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
  'externalBetaUnlock',
  'paidProductionUnlock',
  'productionUnlock',
]) {
  if (sourceRecord[key] !== false) fail(`source record safety key must be false: ${key}`)
}

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
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
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
  readiness: 'ready_for_external_agent_worker_dispatch_runtime_handoff',
  changedFiles: uniqueChangedFiles,
}, null, 2))
