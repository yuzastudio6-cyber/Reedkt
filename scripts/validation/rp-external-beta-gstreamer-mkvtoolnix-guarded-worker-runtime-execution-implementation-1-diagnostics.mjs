#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture'
const execution = 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only'
const runId = '2026-06-30T16-19-10-513Z-a91246d2'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-1'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_EXECUTION=true'
const imageTag = 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/runtime-execution-result.md`,
  `${dir}/command-template-results.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-diagnostics.mjs',
  'package.json',
]

const followOnBridgeFiles = [
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/bridge-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/request-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/gstreamer-mkvtoolnix-agent-execution-bridge-record.json',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-diagnostics.mjs',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-smoke.ts',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1/gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-implementation-1/gstreamer-mkvtoolnix-guarded-worker-route-implementation-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...followOnBridgeFiles])

const allowedCommandTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]

const requiredCorpusText = [
  packet,
  decision,
  execution,
  runId,
  confirmationGate,
  imageTag,
  'Docker network: `none`',
  'GStreamer execution: `completed_controlled_generated_fixture_only`',
  'MKVToolNix execution: `completed_controlled_generated_fixture_only`',
  'Media processing: `controlled_generated_fixture_only`',
  'Route execution: `not_run_runtime_runner_only`',
  'Worker dispatch: `not_run_runtime_runner_only`',
  'Worker execution: `not_run_runtime_runner_only`',
  'ready_for_external_agent_guarded_tool_execution_bridge',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'mkvmerge v74.0.0',
  'Track ID 0: subtitles (SubRip/SRT)',
  '922f680d93c4e7372d18ea307221e81ee7ff3da84bac15350b87941048d9973a',
  '74791deaa1e64a82e380edd561544c7412bc485f2e64b57163ca4cc26fa735ab',
  '78c6c374cd50cdd05d20e3e515dcf7b8b4b3df38cbc2ff6380c167af7f414a57',
  '2a9c4f544fc7e4c0d6594ab9125a4ff0f1bc1e0afcb87432b39cb95511df9d67',
  '4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357',
  '0092fbd28c276dc0102b194e82b0195fc950246e7a6e7f94085107683af4b07a',
  '3639d4d422a4eb5b960e8eec3139149eae1dbdd7f22c1f240ec96e14d6d75c92',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: `not_applicable_runtime_generated_fixture_only`',
  'PR #577 remains open/draft/blocked/excluded',
]

const falseSafetyKeys = [
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'ffmpegFfprobeExecution',
  'remotionExecution',
  'privateMediaProcessing',
  'userMediaProcessing',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'providerCall',
  'modelCall',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'deployment',
  'dockerPush',
  'dockerDeployment',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
  'finalRenderExport',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'broadServiceRoleHandler',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-smoke\.ts$)/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|FFmpeg\/FFprobe execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Docker push|Docker deployment):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
  /"dockerPush"\s*:\s*true/i,
  /"dockerDeployment"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1.mjs'
) {
  fail('missing runtime execution runner script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-diagnostics.mjs'
) {
  fail('missing runtime execution diagnostics script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredCorpusText) {
  if (!corpus.includes(text)) fail(`missing required packet text: ${text}`)
}
for (const template of allowedCommandTemplates) {
  if (!corpus.includes(template)) fail(`missing command-template id: ${template}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '620c003b92ae6d219652206260c441bbdd264bb9') fail('integration base mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.imageTag !== imageTag) fail('image tag mismatch')
if (record.confirmationGate?.observed !== 'present_true') fail('confirmation gate mismatch')
if (record.sourceChain?.guardedRuntimeDryRunMerge !== '620c003b92ae6d219652206260c441bbdd264bb9') fail('dry-run merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.runtimeExecution?.status !== 'completed_controlled_generated_fixture_runtime_execution') fail('runtime status mismatch')
if (record.runtimeExecution?.dockerNetwork !== 'none') fail('docker network mismatch')
if (record.runtimeExecution?.routeExecution !== 'not_run_runtime_runner_only') fail('route execution mismatch')
if (record.runtimeExecution?.workerDispatch !== 'not_run_runtime_runner_only') fail('worker dispatch mismatch')
if (record.runtimeExecution?.workerExecution !== 'not_run_runtime_runner_only') fail('worker execution mismatch')
if (record.runtimeExecution?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer execution mismatch')
if (record.runtimeExecution?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix execution mismatch')
if (record.runtimeExecution?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media boundary mismatch')
if (record.readiness?.gstreamer !== 'ready_for_external_agent_guarded_tool_execution_bridge') fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== 'ready_for_external_agent_guarded_tool_execution_bridge') fail('MKVToolNix readiness mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (!Array.isArray(record.commandResults) || record.commandResults.length !== 4) fail('command result count mismatch')
for (const command of record.commandResults) {
  if (!allowedCommandTemplates.includes(command.templateId)) fail(`unapproved template in record: ${command.templateId}`)
  if (command.ok !== true || command.exitStatus !== 0) fail(`command did not pass: ${command.templateId}`)
}
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 7) fail('artifact summary mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety ${key} was enabled or missing`)
}
if (record.safety?.dockerExecution !== 'completed_local_image_only_network_disabled_no_push_no_deploy') fail('docker execution scope mismatch')
if (record.safety?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer safety scope mismatch')
if (record.safety?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix safety scope mismatch')
if (record.safety?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media safety scope mismatch')

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  const content = read(file)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(content)) fail(`forbidden claim matched in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Execution: ${execution}`)
console.log(`Run ID: ${runId}`)
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
