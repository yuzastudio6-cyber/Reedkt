#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GPAC-MP4BOX-EXECUTION-READY-ROUTE-WORKER-BRIDGE-QA-ROLLUP-1'
const decision = 'qa_passed_gpac_mp4box_execution_ready_route_worker_bridge_confirmed_runtime_evidence'
const execution = 'completed_docs_only_route_worker_bridge_qa_rollup_with_confirmed_generated_fixture_runtime_evidence'
const dir = 'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1'
const recordPath = `${dir}/gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-record.json`
const existingBridgeRecordPath =
  'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-1/gpac-mp4box-execution-ready-route-worker-bridge-1-record.json'
const gstreamerMkvtoolnixRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-record.json'
const runId = '2026-07-02T21-38-32-756Z-c4ed2b30'
const imageTag = 'reeditpro-tracka-gpac-mp4box-controlled-synthetic-media-command-proof-1:20260625T1158Z-1f33b4a'
const imageId = 'sha256:4a24c0c5744a02616dd5f8da989fd3e07295ad1fb5a66af5cce9203e5e06c50d'
const readiness = 'ready_for_external_agent_controlled_generated_fixture_runtime_handoff'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-RUNTIME-READY-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/runtime-evidence.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-runtime-ready-rollup-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-runtime-ready-rollup-1-diagnostics.mjs',
]

const threeToolRollupDir = 'docs/external-beta/tracka-three-tool-external-agent-runtime-ready-rollup-1'
const threeToolRollupFiles = [
  `${threeToolRollupDir}/source-chain.md`,
  `${threeToolRollupDir}/tool-matrix.md`,
  `${threeToolRollupDir}/external-agent-boundary.md`,
  `${threeToolRollupDir}/artifact-manifest-summary.md`,
  `${threeToolRollupDir}/validation-results.md`,
  `${threeToolRollupDir}/tracka-three-tool-external-agent-runtime-ready-rollup-1-record.json`,
  'docs/activation-phase-tracka-three-tool-external-agent-runtime-ready-rollup-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1.md',
]

const threeToolHandoffDir = 'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1'
const threeToolHandoffFiles = [
  `${threeToolHandoffDir}/source-chain.md`,
  `${threeToolHandoffDir}/handoff-contract.md`,
  `${threeToolHandoffDir}/execution-readiness.md`,
  `${threeToolHandoffDir}/artifact-manifest-policy.md`,
  `${threeToolHandoffDir}/safety-boundary.md`,
  `${threeToolHandoffDir}/validation-results.md`,
  `${threeToolHandoffDir}/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1-record.json`,
  'docs/activation-phase-tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-controlled-generated-fixture-execution-1.md',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...implementationFiles,
  ...threeToolRollupFiles,
  ...threeToolHandoffFiles,
])
const forbiddenPathPatterns = [
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
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /ready_for_paid_production/i,
  /ready_for_production/i,
  /ready_for_final_delivery/i,
  /private media processing:\s*`?(true|enabled|approved|completed_private|user)/i,
  /user media processing:\s*`?(true|enabled|approved|completed_user|private)/i,
  /Supabase mutation:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /SQL execution:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /signed URL creation:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /public artifact creation:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /final render\/export:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
  /production unlock:\s*`?(true|enabled|completed|passed|run|executed|approved)/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  'Active native/container tool lane count: `3`',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-CONFIRMED-RUNTIME-EXECUTION-1',
  'TRACKA-GPAC-MP4BOX-GENERATED-FIXTURE-RUNTIME-EXECUTION-1',
  'completed_gpac_mp4box_generated_fixture_runtime_execution',
  'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only',
  runId,
  imageTag,
  imageId,
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
  readiness,
  'Private media processing: `false`',
  'User media processing: `false`',
  'FFmpeg/FFprobe execution: `false`',
  'Supabase mutation: `false`',
  'SQL execution: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Final render/export: `false`',
  '#577 remains open/draft/blocked/excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
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

for (const file of [...packetFiles, ...implementationFiles, existingBridgeRecordPath, gstreamerMkvtoolnixRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs'
) fail('missing package diagnostics script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required packet text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const existingBridgeRecord = json(existingBridgeRecordPath)
if (existingBridgeRecord.decision !== 'completed_gpac_mp4box_execution_ready_route_worker_bridge') {
  fail('existing GPAC bridge decision mismatch')
}
if (existingBridgeRecord.activeNativeContainerToolLaneCount !== 3) fail('existing bridge active lane count mismatch')
if (existingBridgeRecord.nextMilestone !== packet) fail('existing bridge next milestone mismatch')

const gstreamerMkvtoolnixRecord = json(gstreamerMkvtoolnixRecordPath)
if (
  gstreamerMkvtoolnixRecord.decision !==
  'satisfied_by_existing_confirmed_route_worker_bridge_runtime_execution_evidence_for_external_agent_runtime_path'
) fail('GStreamer/MKVToolNix confirmed runtime decision mismatch')
if (gstreamerMkvtoolnixRecord.readiness?.externalAgentRuntimeExecution !== readiness) {
  fail('GStreamer/MKVToolNix readiness mismatch')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('active lane count mismatch')
if (record.sourceChain?.gpacMp4boxRouteWorkerBridgeMergeSha !== '120a51320fbd8f86653f2d4deda29194f263a4f1') {
  fail('GPAC route worker bridge merge SHA mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.runId !== runId) fail('accepted run ID mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.imageTag !== imageTag) fail('accepted image tag mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.imageId !== imageId) fail('accepted image ID mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.dockerNetwork !== 'none') fail('Docker network mismatch')
if (record.acceptedConfirmedRuntimeEvidence?.gpacMp4boxExecution !== 'completed_controlled_generated_fixture_only') {
  fail('accepted GPAC execution mismatch')
}
if (record.acceptedConfirmedRuntimeEvidence?.mediaProcessing !== 'controlled_generated_fixture_only') {
  fail('accepted media processing mismatch')
}
for (const key of [
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'routeExecution',
  'workerExecution',
  'supabaseMutation',
  'sqlExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
]) {
  if (record.acceptedConfirmedRuntimeEvidence?.[key] !== false) fail(`accepted safety mismatch: ${key}`)
}
for (const [tool, value] of Object.entries(record.readiness ?? {})) {
  if (value !== readiness) fail(`tool readiness mismatch: ${tool}`)
}
for (const [name, artifact] of Object.entries(record.artifacts ?? {})) {
  if (typeof artifact?.bytes !== 'number' || artifact.bytes <= 0) fail(`artifact bytes missing: ${name}`)
  if (!/^[a-f0-9]{64}$/.test(String(artifact?.sha256))) fail(`artifact checksum missing: ${name}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
]
for (const file of new Set(changedFiles)) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed/staged file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed/staged path: ${file}`)
  }
}

for (const file of new Set(changedFiles.filter((changedFile) => packetFiles.includes(changedFile)))) {
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim matched in changed file ${file}: ${pattern}`)
  }
}

const stagedGenerated = gitLines(['diff', '--cached', '--name-only']).filter((file) =>
  forbiddenPathPatterns.some((pattern) => pattern.test(file))
)
if (stagedGenerated.length) fail(`forbidden staged generated/artifact paths: ${stagedGenerated.join(', ')}`)

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')

console.log(
  JSON.stringify(
    {
      packet,
      status: 'passed',
      decision,
      execution,
      runId,
      readiness,
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    null,
    2
  )
)
