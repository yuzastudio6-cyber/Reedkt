#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-QA-ROLLUP-2'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-record.json`
const packet2RecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-record.json'
const decision = 'qa_passed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_evidence'
const execution = 'completed_docs_only_post_dispatch_worker_runtime_qa_rollup_no_runtime_execution'
const integrationBase = 'eaa0119d73f037bf2a78aa99f8d6e36c3f2fd64b'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-HANDOFF-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/qa-rollup.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  packet2RecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
for (const file of [
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/handoff-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/reference-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/command-template-allowlist.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
  '2026-07-01T04-29-30-784Z-d39bdd98',
  '2026-07-01T04-29-30-842Z-7cc784a7',
  'accepted_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
  'ready_for_narrowly_guarded_external_agent_runtime_handoff',
  'ready_for_confirmation_gated_narrow_external_agent_runtime_handoff',
  'Route execution in this QA rollup phase: `false`',
  'Real worker dispatch in this QA rollup phase: `false`',
  'Worker process started in this QA rollup phase: `false`',
  'Worker execution in this QA rollup phase: `false`',
  'Worker lease claim in this QA rollup phase: `false`',
  'Persistent job queue write in this QA rollup phase: `false`',
  'GStreamer execution in this QA rollup phase: `false`',
  'MKVToolNix execution in this QA rollup phase: `false`',
  'FFmpeg/FFprobe execution in this QA rollup phase: `false`',
  'Docker execution in this QA rollup phase: `false`',
  'Supabase mutation in this QA rollup phase: `false`',
  'SQL execution in this QA rollup phase: `false`',
  'Public artifact creation in this QA rollup phase: `false`',
  'Final render/export in this QA rollup phase: `false`',
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
  /\b(?:Route execution in this QA rollup phase|Real worker dispatch in this QA rollup phase|Worker process started in this QA rollup phase|Worker execution in this QA rollup phase|Worker lease claim in this QA rollup phase|Persistent job queue write in this QA rollup phase|GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|FFmpeg\/FFprobe execution in this QA rollup phase|Docker execution in this QA rollup phase|Supabase mutation in this QA rollup phase|SQL execution in this QA rollup phase|Public artifact creation in this QA rollup phase|Final render\/export in this QA rollup phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisQaRollupPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisQaRollupPhase"\s*:\s*true/i,
  /"workerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisQaRollupPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisQaRollupPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"dockerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"supabaseMutationInThisQaRollupPhase"\s*:\s*true/i,
  /"sqlExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"finalRenderExportInThisQaRollupPhase"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-qa-rollup-2-diagnostics.mjs'
) {
  fail('missing guarded worker runtime QA rollup 2 diagnostics package script')
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
if (record.sourceChain?.runtimeExecutionPacket2Pr !== 1954) fail('packet 2 PR mismatch')
if (record.sourceChain?.runtimeExecutionPacket2MergeSha !== integrationBase) fail('packet 2 merge mismatch')
if (record.sourceChain?.runtimeExecutionPacket2RunId !== '2026-07-01T04-29-30-784Z-d39bdd98') fail('packet 2 run ID mismatch')
if (record.sourceChain?.runtimeExecutionPacket2Status !== 'accepted_post_dispatch_worker_runtime_execution_packet_generated_fixture_only') fail('packet 2 status mismatch')
if (record.sourceChain?.guardedRuntimeRunId !== '2026-07-01T04-29-30-842Z-7cc784a7') fail('guarded runtime run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.qa?.scope !== 'source_evidence_review_only') fail('QA scope mismatch')
if (record.qa?.status !== 'passed') fail('QA status mismatch')
if (record.qa?.acceptance !== 'ready_for_narrowly_guarded_external_agent_runtime_handoff') fail('QA acceptance mismatch')
if (record.readiness?.externalAgentHandoff !== 'ready_for_confirmation_gated_narrow_external_agent_runtime_handoff') fail('external agent readiness mismatch')
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

const packet2Record = json(packet2RecordPath)
if (packet2Record.decision !== 'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only') fail('packet 2 source decision mismatch')
if (packet2Record.runId !== '2026-07-01T04-29-30-784Z-d39bdd98') fail('packet 2 source run ID mismatch')
if (packet2Record.nextMilestone !== packet) fail('packet 2 source next milestone mismatch')

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
