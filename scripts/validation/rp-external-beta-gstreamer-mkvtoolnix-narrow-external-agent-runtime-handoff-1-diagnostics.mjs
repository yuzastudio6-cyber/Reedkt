#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-HANDOFF-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-record.json`
const qaRollupRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-record.json'
const packet2RecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-record.json'
const integrationBase = '91d5ae8c23ffe9972957574df641cf999df2eb67'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_handoff_contract_ready_for_confirmation_gated_dry_run'
const execution = 'completed_docs_only_narrow_external_agent_runtime_handoff_no_route_worker_or_tool_execution'
const handoffStatus = 'ready_for_confirmation_gated_narrow_external_agent_runtime_dry_run'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-DRY-RUN-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/handoff-contract.md`,
  `${dir}/reference-envelope.md`,
  `${dir}/command-template-allowlist.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  qaRollupRecordPath,
  packet2RecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
for (const file of [
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/reference-validation.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/negative-cases.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  decision,
  execution,
  handoffStatus,
  integrationBase,
  'qa_passed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_evidence',
  'completed_docs_only_post_dispatch_worker_runtime_qa_rollup_no_runtime_execution',
  'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
  '2026-07-01T04-29-30-784Z-d39bdd98',
  '2026-07-01T04-29-30-842Z-7cc784a7',
  'approved-snapshot-agent-controlled-dispatch-1',
  'approval-record-agent-controlled-dispatch-1',
  'no-spend-fixture-policy-agent-controlled-dispatch-1',
  'job-agent-controlled-dispatch-1',
  'worker-lease-agent-controlled-dispatch-1',
  'mock-job-runtime-queue-item-0001',
  'runtime-packet-gstreamer-mkvtoolnix-post-dispatch-worker-2',
  'runtime-execution-gstreamer-mkvtoolnix-post-dispatch-worker-2',
  'gstreamer-mkvtoolnix:narrow-external-agent-runtime-handoff-1:approved-snapshot:job:template',
  '4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357',
  'output-manifest-schema-agent-controlled-dispatch-1',
  'qa-report-schema-agent-controlled-dispatch-1',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  'dockerNetwork',
  'none',
  'open_draft_blocked_excluded',
  'External-agent runtime execution in this handoff phase: `false`',
  'Live HTTP route execution in this handoff phase: `false`',
  'Real worker dispatch in this handoff phase: `false`',
  'Worker process start in this handoff phase: `false`',
  'Worker lease claim in this handoff phase: `false`',
  'Persistent job queue write in this handoff phase: `false`',
  'GStreamer execution in this handoff phase: `false`',
  'MKVToolNix execution in this handoff phase: `false`',
  'Docker execution in this handoff phase: `false`',
  'FFmpeg/FFprobe execution in this handoff phase: `false`',
  'Supabase mutation in this handoff phase: `false`',
  'SQL execution in this handoff phase: `false`',
  'Public artifact creation in this handoff phase: `false`',
  'Final render/export in this handoff phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
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
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:External-agent runtime execution in this handoff phase|Live HTTP route execution in this handoff phase|Real worker dispatch in this handoff phase|Worker process start in this handoff phase|Worker execution in this handoff phase|Worker lease claim in this handoff phase|Persistent job queue write in this handoff phase|GStreamer execution in this handoff phase|MKVToolNix execution in this handoff phase|Docker execution in this handoff phase|FFmpeg\/FFprobe execution in this handoff phase|Remotion execution in this handoff phase|Private media processing in this handoff phase|User media processing in this handoff phase|Supabase mutation in this handoff phase|SQL execution in this handoff phase|Signed URL creation in this handoff phase|Public artifact creation in this handoff phase|Final render\/export in this handoff phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"liveHttpRouteExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"externalAgentRuntimeExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisHandoffPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisHandoffPhase"\s*:\s*true/i,
  /"workerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisHandoffPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisHandoffPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"dockerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"remotionExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisHandoffPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisHandoffPhase"\s*:\s*true/i,
  /"supabaseMutationInThisHandoffPhase"\s*:\s*true/i,
  /"sqlExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisHandoffPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisHandoffPhase"\s*:\s*true/i,
  /"finalRenderExportInThisHandoffPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisHandoffPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisHandoffPhase"\s*:\s*true/i,
  /"productionUnlockInThisHandoffPhase"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-diagnostics.mjs'
) {
  fail('missing narrow external-agent runtime handoff diagnostics package script')
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
if (record.handoffStatus !== handoffStatus) fail('handoff status mismatch')
if (record.sourceChain?.runtimeQaRollupPr !== 1958) fail('runtime QA rollup PR mismatch')
if (record.sourceChain?.runtimeQaRollupMergeSha !== integrationBase) fail('runtime QA rollup merge mismatch')
if (record.sourceChain?.runtimeQaDecision !== 'qa_passed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_evidence') fail('runtime QA decision mismatch')
if (record.sourceChain?.runtimeQaExecution !== 'completed_docs_only_post_dispatch_worker_runtime_qa_rollup_no_runtime_execution') fail('runtime QA execution mismatch')
if (record.sourceChain?.runtimeQaScope !== 'source_evidence_review_only') fail('runtime QA scope mismatch')
if (record.sourceChain?.packet2Pr !== 1954) fail('packet 2 PR mismatch')
if (record.sourceChain?.packet2MergeSha !== 'eaa0119d73f037bf2a78aa99f8d6e36c3f2fd64b') fail('packet 2 merge mismatch')
if (record.sourceChain?.packet2RunId !== '2026-07-01T04-29-30-784Z-d39bdd98') fail('packet 2 run ID mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== '2026-07-01T04-29-30-842Z-7cc784a7') fail('guarded runtime run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.handoffEnvelope?.approvedSnapshotId !== 'approved-snapshot-agent-controlled-dispatch-1') fail('approved snapshot mismatch')
if (record.handoffEnvelope?.approvalRecordId !== 'approval-record-agent-controlled-dispatch-1') fail('approval record mismatch')
if (record.handoffEnvelope?.creditPolicyId !== 'no-spend-fixture-policy-agent-controlled-dispatch-1') fail('credit policy mismatch')
if (record.handoffEnvelope?.jobId !== 'job-agent-controlled-dispatch-1') fail('job mismatch')
if (record.handoffEnvelope?.workerLeaseId !== 'worker-lease-agent-controlled-dispatch-1') fail('worker lease mismatch')
if (record.handoffEnvelope?.dockerNetwork !== 'none') fail('docker network mismatch')
if (!Array.isArray(record.allowedCommandTemplates) || record.allowedCommandTemplates.length !== 4) fail('allowed command template count mismatch')
if (!Array.isArray(record.packet2Artifacts) || record.packet2Artifacts.length !== 5) fail('packet 2 artifact count mismatch')
if (record.readiness?.externalAgentHandoff !== handoffStatus) fail('external-agent readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const qaRollupRecord = json(qaRollupRecordPath)
if (qaRollupRecord.decision !== 'qa_passed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_evidence') fail('QA rollup source decision mismatch')
if (qaRollupRecord.nextMilestone !== packet) fail('QA rollup source next milestone mismatch')
if (qaRollupRecord.productReadyEndToEndLocalOssTools !== 0) fail('QA rollup product-ready count mismatch')

const packet2Record = json(packet2RecordPath)
if (packet2Record.decision !== 'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only') fail('packet 2 source decision mismatch')
if (packet2Record.runId !== '2026-07-01T04-29-30-784Z-d39bdd98') fail('packet 2 source run ID mismatch')
if (packet2Record.postDispatchRuntimePacket?.dockerNetwork !== 'none') fail('packet 2 docker network mismatch')
if (packet2Record.productReadyEndToEndLocalOssTools !== 0) fail('packet 2 product-ready count mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
].sort()
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (!fs.existsSync(file)) continue
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
