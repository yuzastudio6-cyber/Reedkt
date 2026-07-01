#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-BRIDGE-IMPLEMENTATION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-record.json`
const dryRunRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-record.json'
const handoffRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-record.json'
const integrationBase = 'aa2a51681c161f3005d5fc1de06370b4f7ed7bb3'
const decision =
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_bridge_implementation_ready_for_qa_rollup'
const execution =
  'completed_backend_source_narrow_external_agent_runtime_bridge_validation_no_route_worker_tool_or_media_execution'
const readyStatus = 'ready_for_narrow_external_agent_runtime_bridge_qa_rollup'
const dryRunRunId = '2026-07-01T07-13-36-296Z-7ebd9826'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-BRIDGE-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/bridge-contract.md`,
  `${dir}/smoke-result.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1.md',
]

const implementationFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  dryRunRecordPath,
  handoffRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  readyStatus,
  dryRunRunId,
  '8e93c0275e25ba703ddfa7c63c9a6f0403a2ffe7',
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_dry_run_reference_validation_only',
  'completed_confirmation_gated_narrow_external_agent_runtime_dry_run_no_route_worker_tool_or_media_execution',
  'external-agent-handoff-gstreamer-mkvtoolnix-narrow-runtime-1',
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
  'cleanup-policy-gstreamer-mkvtoolnix-generated-fixture-only',
  'retention-policy-gstreamer-mkvtoolnix-generated-fixture-only',
  'failure-policy-gstreamer-mkvtoolnix-narrow-runtime-handoff',
  'audit-event-parent-gstreamer-mkvtoolnix-narrow-runtime-handoff-1',
  'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  'dockerNetwork',
  'none',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'backend_source_reference_validation_only',
  'blocked_missing_narrow_external_agent_runtime_bridge_reference',
  'blocked_invalid_narrow_external_agent_runtime_bridge_state',
  'blocked_unapproved_narrow_external_agent_runtime_command_template',
  'blocked_unsupported_narrow_external_agent_runtime_input',
  'blocked_unsafe_narrow_external_agent_runtime_bridge_request',
  'blocked_narrow_external_agent_runtime_source_evidence_mismatch',
  'Live HTTP route execution in this bridge phase: `false`',
  'External-agent runtime execution in this bridge phase: `false`',
  'Real worker dispatch in this bridge phase: `false`',
  'Worker process start in this bridge phase: `false`',
  'Worker lease claim in this bridge phase: `false`',
  'Persistent job queue write in this bridge phase: `false`',
  'GStreamer execution in this bridge phase: `false`',
  'MKVToolNix execution in this bridge phase: `false`',
  'Docker execution in this bridge phase: `false`',
  'FFmpeg/FFprobe execution in this bridge phase: `false`',
  'Supabase mutation in this bridge phase: `false`',
  'SQL execution in this bridge phase: `false`',
  'Public artifact creation in this bridge phase: `false`',
  'Final render/export in this bridge phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/routes?\//,
  /^server\/workers?\//,
  /^server\/providers?\//,
  /^server\/repositories?\//,
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
  /\b(?:Live HTTP route execution in this bridge phase|External-agent runtime execution in this bridge phase|Real worker dispatch in this bridge phase|Worker process start in this bridge phase|Worker execution in this bridge phase|Worker lease claim in this bridge phase|Persistent job queue write in this bridge phase|GStreamer execution in this bridge phase|MKVToolNix execution in this bridge phase|Docker execution in this bridge phase|FFmpeg\/FFprobe execution in this bridge phase|Remotion execution in this bridge phase|Private media processing in this bridge phase|User media processing in this bridge phase|Supabase mutation in this bridge phase|SQL execution in this bridge phase|Signed URL creation in this bridge phase|Public artifact creation in this bridge phase|Final render\/export in this bridge phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"liveHttpRouteExecutionInThisBridgePhase"\s*:\s*true/i,
  /"externalAgentRuntimeExecutionInThisBridgePhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisBridgePhase"\s*:\s*true/i,
  /"workerProcessStartedInThisBridgePhase"\s*:\s*true/i,
  /"workerExecutionInThisBridgePhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisBridgePhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisBridgePhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisBridgePhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisBridgePhase"\s*:\s*true/i,
  /"dockerExecutionInThisBridgePhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisBridgePhase"\s*:\s*true/i,
  /"remotionExecutionInThisBridgePhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisBridgePhase"\s*:\s*true/i,
  /"userMediaProcessingInThisBridgePhase"\s*:\s*true/i,
  /"supabaseMutationInThisBridgePhase"\s*:\s*true/i,
  /"sqlExecutionInThisBridgePhase"\s*:\s*true/i,
  /"signedUrlCreationInThisBridgePhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisBridgePhase"\s*:\s*true/i,
  /"finalRenderExportInThisBridgePhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisBridgePhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisBridgePhase"\s*:\s*true/i,
  /"productionUnlockInThisBridgePhase"\s*:\s*true/i,
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
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-smoke.ts'
) {
  fail('missing narrow external-agent runtime bridge smoke package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-diagnostics.mjs'
) {
  fail('missing narrow external-agent runtime bridge diagnostics package script')
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
if (record.sourceChain?.handoffPr !== 1959) fail('handoff PR mismatch')
if (record.sourceChain?.handoffMergeSha !== '8e93c0275e25ba703ddfa7c63c9a6f0403a2ffe7') fail('handoff merge mismatch')
if (record.sourceChain?.dryRunPr !== 1962) fail('dry-run PR mismatch')
if (record.sourceChain?.dryRunMergeSha !== integrationBase) fail('dry-run merge mismatch')
if (record.sourceChain?.dryRunRunId !== dryRunRunId) fail('dry-run run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.bridge?.status !== readyStatus) fail('bridge status mismatch')
if (record.bridge?.validationMode !== 'backend_source_reference_validation_only') fail('bridge validation mode mismatch')
if (record.bridge?.dockerNetwork !== 'none') fail('docker network mismatch')
if (!Array.isArray(record.bridge?.allowedCommandTemplates) || record.bridge.allowedCommandTemplates.length !== 4) {
  fail('allowed command template count mismatch')
}
if (!Array.isArray(record.negativeCases) || record.negativeCases.length !== 6) fail('negative case count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const dryRunRecord = json(dryRunRecordPath)
if (
  dryRunRecord.decision !==
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_dry_run_reference_validation_only'
) {
  fail('dry-run source decision mismatch')
}
if (dryRunRecord.runId !== dryRunRunId) fail('dry-run source run ID mismatch')
if (dryRunRecord.nextMilestone !== packet) fail('dry-run source next milestone mismatch')
if (dryRunRecord.productReadyEndToEndLocalOssTools !== 0) fail('dry-run product-ready count mismatch')

const handoffRecord = json(handoffRecordPath)
if (
  handoffRecord.decision !==
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_handoff_contract_ready_for_confirmation_gated_dry_run'
) {
  fail('handoff source decision mismatch')
}
if (handoffRecord.productReadyEndToEndLocalOssTools !== 0) fail('handoff product-ready count mismatch')

const serviceText = read(
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1.ts',
)
for (const text of [
  'validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput',
  'buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput',
  'summarizeGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeBoundary',
  'blocked_unsupported_narrow_external_agent_runtime_input',
  'blocked_unsafe_narrow_external_agent_runtime_bridge_request',
  'productReadyEndToEndLocalOssTools: 0',
]) {
  if (!serviceText.includes(text)) fail(`service missing required text: ${text}`)
}

const smokeText = read(
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-smoke.ts',
)
for (const text of [
  'all_allowed_command_templates_accept',
  'missing_reference_blocks',
  'source_evidence_mismatch_blocks',
  'unapproved_template_blocks',
  'raw_command_and_public_url_block',
  'route_worker_tool_supabase_and_export_requests_block',
  'safety_flags_remain_false',
]) {
  if (!smokeText.includes(text)) fail(`smoke missing required check: ${text}`)
}

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
  if (file.startsWith(dir) || file.startsWith('docs/activation-phase')) {
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim matched in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
