#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PACKET-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1-record.json`
const planningRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-record.json'
const integrationBase = '3f04e2df7f3723e22933c7800ccc6f2b44cf3def'
const decision =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_packet_generated_fixture_source_envelope'
const execution =
  'completed_confirmation_gated_narrow_controlled_worker_runtime_integration_packet_metadata_only_no_route_worker_or_tool_execution'
const gate =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_RUNTIME_INTEGRATION_PACKET=true'
const readiness = 'ready_for_guarded_narrow_route_worker_runtime_integration_packet_qa_rollup'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PACKET-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/execution-result.md`,
  `${dir}/integration-envelope.md`,
  `${dir}/artifact-manifest.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-qa-rollup-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  integrationBase,
  gate,
  'Runtime integration planning PR: `#2052`',
  'Runtime integration planning merge SHA: `3f04e2df7f3723e22933c7800ccc6f2b44cf3def`',
  'generated_fixture_only_narrow_controlled_worker_runtime_source',
  'metadata_only_source_envelope_for_future_route_worker_runtime_integration',
  'Route execution in this integration packet phase: `false`',
  'Worker dispatch in this integration packet phase: `false`',
  'Worker execution in this integration packet phase: `false`',
  'Worker process start in this integration packet phase: `false`',
  'Worker lease claim in this integration packet phase: `false`',
  'Persistent job queue write in this integration packet phase: `false`',
  'GStreamer execution in this integration packet phase: `false`',
  'MKVToolNix execution in this integration packet phase: `false`',
  'Docker execution in this integration packet phase: `false`',
  'FFmpeg/FFprobe execution in this integration packet phase: `false`',
  'Remotion execution in this integration packet phase: `false`',
  'Supabase mutation in this integration packet phase: `false`',
  'SQL execution in this integration packet phase: `false`',
  'Signed URL creation in this integration packet phase: `false`',
  'Public artifact creation in this integration packet phase: `false`',
  'Final render/export in this integration packet phase: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Product-ready end-to-end local OSS tools: `0`',
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
  /\b(?:Route execution in this integration packet phase|Worker dispatch in this integration packet phase|Worker execution in this integration packet phase|Worker process start in this integration packet phase|Worker lease claim in this integration packet phase|Persistent job queue write in this integration packet phase|GStreamer execution in this integration packet phase|MKVToolNix execution in this integration packet phase|Docker execution in this integration packet phase|FFmpeg\/FFprobe execution in this integration packet phase|Remotion execution in this integration packet phase|Private media processing in this integration packet phase|User media processing in this integration packet phase|Supabase mutation in this integration packet phase|SQL execution in this integration packet phase|Signed URL creation in this integration packet phase|Public artifact creation in this integration packet phase|Final render\/export in this integration packet phase|Broad external beta unlock in this integration packet phase|Paid production unlock in this integration packet phase|Production unlock in this integration packet phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"workerDispatchInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"workerExecutionInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"workerProcessStartInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"dockerExecutionInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"remotionExecutionInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"supabaseMutationInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"sqlExecutionInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"finalRenderExportInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisIntegrationPacketPhase"\s*:\s*true/i,
  /"productionUnlockInThisIntegrationPacketPhase"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...implementationFiles, planningRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1.mjs'
) {
  fail('missing runtime integration packet runner package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-packet-1-diagnostics.mjs'
) {
  fail('missing runtime integration packet diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const planningRecord = json(planningRecordPath)
if (planningRecord.packet !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PLANNING-1') {
  fail('planning packet mismatch')
}
if (planningRecord.decision !== 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_planning') {
  fail('planning decision mismatch')
}
if (planningRecord.validation !== 'passed') fail('planning validation mismatch')
if (planningRecord.nextMilestone !== packet) fail('planning next milestone mismatch')
if (planningRecord.productReadyEndToEndLocalOssTools !== 0) fail('planning product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (![decision, 'pending'].includes(record.decision)) fail('decision mismatch')
if (![execution, 'pending'].includes(record.execution)) fail('execution mismatch')
if (record.confirmationGate !== gate) fail('confirmation gate mismatch')
if (record.sourceChain?.runtimeIntegrationPlanningPr !== 2052) fail('planning PR mismatch')
if (record.sourceChain?.runtimeIntegrationPlanningMergeSha !== integrationBase) fail('planning merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.integrationEnvelope?.sourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source') {
  fail('source class mismatch')
}
if (record.integrationEnvelope?.routeWorkerIntegrationMode !== 'metadata_only_source_envelope_for_future_route_worker_runtime_integration') {
  fail('integration mode mismatch')
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.validation === 'passed') {
  if (record.decision !== decision) fail('passed record must carry completed decision')
  if (record.execution !== execution) fail('passed record must carry completed execution')
  for (const key of ['gstreamer', 'mkvtoolnix', 'externalAgentRouteWorkerBoundary']) {
    if (record.readiness?.[key] !== readiness) fail(`readiness mismatch: ${key}`)
  }
  if (!record.runId || record.runId === 'pending') fail('passed record missing run ID')
  if (!record.outputDirectory || record.outputDirectory === 'pending') fail('passed record missing output directory')
  for (const artifactKey of ['input', 'envelope', 'qaReport', 'report', 'manifest']) {
    const artifact = record.artifacts?.[artifactKey]
    if (!artifact || typeof artifact.bytes !== 'number' || !/^[a-f0-9]{64}$/.test(artifact.sha256 ?? '')) {
      fail(`missing artifact summary: ${artifactKey}`)
    }
  }
}

for (const file of ['package-lock.json']) {
  if (gitLines(['diff', '--name-only', '--', file]).length) fail(`${file} must be unchanged`)
  if (gitLines(['diff', '--cached', '--name-only', '--', file]).length) fail(`${file} must not be staged`)
}

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChanged = [...new Set(changedFiles)].sort()
for (const file of uniqueChanged) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
}
for (const file of uniqueChanged.filter((candidate) => fs.existsSync(candidate))) {
  const text = read(file)
  const isValidator = /^scripts\/validation\//.test(file)
  if (!isValidator) {
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim matched in changed file ${file}: ${pattern}`)
    }
  }
}

try {
  execFileSync('git', ['diff', '--check'], { env: gitEnv, stdio: 'pipe' })
  execFileSync('git', ['diff', '--cached', '--check'], { env: gitEnv, stdio: 'pipe' })
} catch {
  fail('git diff check failed')
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision: record.decision,
  execution: record.execution,
  validation: record.validation,
  changedFiles: uniqueChanged,
  nextMilestone,
}, null, 2))
