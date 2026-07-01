#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-DRY-RUN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-record.json`
const handoffRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-record.json'
const integrationBase = '8e93c0275e25ba703ddfa7c63c9a6f0403a2ffe7'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_dry_run_reference_validation_only'
const execution = 'completed_confirmation_gated_narrow_external_agent_runtime_dry_run_no_route_worker_tool_or_media_execution'
const runId = '2026-07-01T07-13-36-296Z-7ebd9826'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-BRIDGE-IMPLEMENTATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/reference-validation.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-diagnostics.mjs',
  'package.json',
]

const bridgeImplementationFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/bridge-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/smoke-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/negative-cases.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-diagnostics.mjs',
]

const sourceFiles = [
  handoffRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...bridgeImplementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runId,
  'blocked_pending_narrow_external_agent_runtime_dry_run_confirmation',
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_DRY_RUN=true',
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_handoff_contract_ready_for_confirmation_gated_dry_run',
  'ready_for_confirmation_gated_narrow_external_agent_runtime_dry_run',
  '2026-07-01T04-29-30-784Z-d39bdd98',
  '2026-07-01T04-29-30-842Z-7cc784a7',
  'reference_validation_only',
  'positiveEnvelopeValidation',
  'negativeEnvelopeValidation',
  'reject_raw_command',
  'reject_arbitrary_private_media',
  'reject_route_execution',
  'reject_worker_dispatch',
  'reject_persistent_queue_write',
  'reject_supabase_sql',
  'reject_signed_public_artifact',
  'reject_final_export_production',
  'ready_for_narrow_external_agent_runtime_bridge_implementation_planning',
  'narrow-external-agent-runtime-handoff-envelope-validation.json',
  'f1a2713af52f01fdbe40dec86183c45e1f1f76a8d0c0a75569a67741b57179fe',
  'narrow-external-agent-runtime-dry-run-report.json',
  'cf6c1343ec83567edb9b129c8949e0d6a327c4b7957468ee0bdaee979eda31ef',
  'narrow-external-agent-runtime-dry-run-manifest.json',
  '307e6f735676f3fb092f03dcf660dc7f71182ea5bf4812fb5bb0271dd8383d82',
  'External-agent runtime execution in this dry-run phase: `false`',
  'Live HTTP route execution in this dry-run phase: `false`',
  'Real worker dispatch in this dry-run phase: `false`',
  'Worker process start in this dry-run phase: `false`',
  'Worker lease claim in this dry-run phase: `false`',
  'Persistent job queue write in this dry-run phase: `false`',
  'GStreamer execution in this dry-run phase: `false`',
  'MKVToolNix execution in this dry-run phase: `false`',
  'Docker execution in this dry-run phase: `false`',
  'FFmpeg/FFprobe execution in this dry-run phase: `false`',
  'Supabase mutation in this dry-run phase: `false`',
  'SQL execution in this dry-run phase: `false`',
  'Public artifact creation in this dry-run phase: `false`',
  'Final render/export in this dry-run phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!.*rp-external-beta-gstreamer-mkvtoolnix)/,
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
  /\b(?:External-agent runtime execution in this dry-run phase|Live HTTP route execution in this dry-run phase|Real worker dispatch in this dry-run phase|Worker process start in this dry-run phase|Worker execution in this dry-run phase|Worker lease claim in this dry-run phase|Persistent job queue write in this dry-run phase|GStreamer execution in this dry-run phase|MKVToolNix execution in this dry-run phase|Docker execution in this dry-run phase|FFmpeg\/FFprobe execution in this dry-run phase|Remotion execution in this dry-run phase|Private media processing in this dry-run phase|User media processing in this dry-run phase|Supabase mutation in this dry-run phase|SQL execution in this dry-run phase|Signed URL creation in this dry-run phase|Public artifact creation in this dry-run phase|Final render\/export in this dry-run phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"liveHttpRouteExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"externalAgentRuntimeExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisDryRunPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisDryRunPhase"\s*:\s*true/i,
  /"workerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisDryRunPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisDryRunPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"dockerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"remotionExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisDryRunPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisDryRunPhase"\s*:\s*true/i,
  /"supabaseMutationInThisDryRunPhase"\s*:\s*true/i,
  /"sqlExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisDryRunPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisDryRunPhase"\s*:\s*true/i,
  /"finalRenderExportInThisDryRunPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisDryRunPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisDryRunPhase"\s*:\s*true/i,
  /"productionUnlockInThisDryRunPhase"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1.mjs'
) {
  fail('missing narrow external-agent runtime dry-run package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1-diagnostics.mjs'
) {
  fail('missing narrow external-agent runtime dry-run diagnostics package script')
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
if (record.runId !== runId) fail('run ID mismatch')
if (record.confirmationGate !== 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_DRY_RUN=true') fail('confirmation gate mismatch')
if (record.failClosedNoGateBlocker !== 'blocked_pending_narrow_external_agent_runtime_dry_run_confirmation') fail('fail-closed blocker mismatch')
if (record.sourceChain?.handoffPr !== 1959) fail('handoff PR mismatch')
if (record.sourceChain?.handoffMergeSha !== integrationBase) fail('handoff merge mismatch')
if (record.sourceChain?.handoffStatus !== 'ready_for_confirmation_gated_narrow_external_agent_runtime_dry_run') fail('handoff status mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.dryRun?.mode !== 'reference_validation_only') fail('dry-run mode mismatch')
if (record.dryRun?.positiveEnvelopeValidation !== 'passed') fail('positive validation mismatch')
if (record.dryRun?.negativeEnvelopeValidation !== 'passed') fail('negative validation mismatch')
if (!Array.isArray(record.dryRun?.rejectedCases) || record.dryRun.rejectedCases.length !== 8) fail('rejected case count mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 3) fail('artifact count mismatch')
if (record.readiness?.externalAgentRuntimeDryRun !== 'passed_reference_validation_only') fail('readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const handoffRecord = json(handoffRecordPath)
if (handoffRecord.decision !== 'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_handoff_contract_ready_for_confirmation_gated_dry_run') fail('handoff source decision mismatch')
if (handoffRecord.nextMilestone !== packet) fail('handoff source next milestone mismatch')
if (handoffRecord.productReadyEndToEndLocalOssTools !== 0) fail('handoff product-ready count mismatch')

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
