#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-TRACKA-TOOL-LANE-OWNERSHIP-REALIGNMENT-1'
const dir = 'docs/external-beta/tracka-tool-lane-ownership-realignment-1'
const recordPath = `${dir}/tracka-tool-lane-ownership-realignment-record.json`
const decision = 'completed_tracka_tool_lane_ownership_realignment_for_external_agent_execution'
const execution = 'completed_docs_only_tool_lane_realignment_no_runtime_execution'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/tool-lane-matrix.md`,
  `${dir}/next-action-plan.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-tracka-tool-lane-ownership-realignment-1-results.md',
]

const sourceFiles = [
  'docs/tool-ownership/central-tool-owner-registry.md',
  'server/activation/track-b-capability-manifests/track-b-tool-registry.ts',
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix.md',
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-matrix.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1.md',
  'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1/gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1-record.json',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix.md',
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/source-of-truth-audit.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/source-of-truth-audit.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/pinned-dispatch-contract.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/pinned-dispatch-contract.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/fail-closed-result.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/fail-closed-result.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/readiness-report.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/readiness-report.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/validation-results.md',
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1.md',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tracka-tool-lane-ownership-realignment-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  'Active native/container tool lanes owned for this external-agent execution push: `3`',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  'ready_for_guarded_external_agent_controlled_generated_fixture_execution',
  'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation_with_route_worker_contract_pinned',
  'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1',
  'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true',
  'remotion',
  'not_this_lane_track_b_or_render_runtime_owned_current_external_beta_evidence_exists',
  'revideo_render_preview_alternative',
  'excluded_by_operator_instruction_no_active_tracka_execution_work',
  'ffmpeg_ffprobe_shared_dependency',
  'track_b_owned_shared_dependency_boundary',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded as source-of-truth',
]

const falseSafetyKeys = [
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'deployment',
  'iamMutation',
  'googleGroupMembershipMutation',
  'broadExternalBetaAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'gstreamerExecutionInThisPhase',
  'mkvtoolnixExecutionInThisPhase',
  'gpacMp4boxExecutionInThisPhase',
  'vapoursynthExecutionInThisPhase',
  'revideoExecutionInThisPhase',
  'filmExecution',
  'qwen25VlExecutionInThisPhase',
  'aiGraphicsExecution',
  'ffmpegFfprobeExecution',
  'dockerExecution',
  'remotionExecutionInThisPhase',
  'packageInstallationBeyondDependencyValidation',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'cloudRunReadback',
  'cloudRunServiceUpdate',
  'broadServiceRoleHandler',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^src\//,
  /^server\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenClaimPatterns = [
  /\bActive native\/container tool lanes owned for this external-agent execution push:\s*`?(?!3\b)\d+/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bpaid production unlock(?:ed)?\s*:\s*`?(true|enabled|completed|passed|approved|unlocked)\b/i,
  /\bproduction unlock(?:ed)?\s*:\s*`?(true|enabled|completed|passed|approved|unlocked)\b/i,
  /\bfinal render\/export\s*:\s*`?(true|enabled|completed|passed|approved|unlocked)\b/i,
  /\b(?:GStreamer|MKVToolNix|GPAC\/MP4Box|VapourSynth|Revideo|FILM|QWEN2\.5-VL|FFmpeg\/FFprobe|Docker|Remotion) execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Worker execution|Worker dispatch|Route execution|Service-role route execution|Signed URL creation|Public artifact creation|Private media processing|User media processing|Dependency mutation|Package-lock mutation)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
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

for (const file of [...packetFiles, ...sourceFiles]) read(file)

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '82048ece6eacfa90bee2bf9d700ead3de2dc4b77') fail('integration base mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('active tool count mismatch')
for (const tool of ['gstreamer_render_pipeline_support', 'mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation']) {
  if (record.activeToolLanes?.[tool]?.activeInThisAgentLane !== true) fail(`active tool missing: ${tool}`)
}
if (record.excludedOrOtherLaneTools?.remotion !== 'not_this_lane_track_b_or_render_runtime_owned_current_external_beta_evidence_exists') fail('remotion boundary drift')
if (record.excludedOrOtherLaneTools?.revideo_render_preview_alternative !== 'excluded_by_operator_instruction_no_active_tracka_execution_work') fail('revideo boundary drift')
if (record.excludedOrOtherLaneTools?.ffmpeg_ffprobe_shared_dependency !== 'track_b_owned_shared_dependency_boundary') fail('ffmpeg/ffprobe boundary drift')
if (record.confirmationGateObserved?.REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH !== 'absent') fail('gate observation drift')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count drift')
if (record.packageLock !== 'unchanged') fail('package-lock drift')
if (record.generatedArtifactsCommitted !== 'none') fail('artifact drift')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety key ${key} drift`)
}

const packageJson = json('package.json')
if (packageJson.scripts?.['rp-external-beta-tracka-tool-lane-ownership-realignment-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-tracka-tool-lane-ownership-realignment-1-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenChangedPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log('Active native/container tool lanes: 3')
console.log('Next GPAC/MP4Box gate: TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1')
