#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-TOOL-EXECUTION-READINESS-MATRIX-1'
const dir = 'docs/external-beta/tool-execution-readiness-matrix-1'
const recordPath = `${dir}/tool-execution-readiness-matrix-record.json`
const decision = 'completed_external_beta_tool_execution_readiness_matrix_for_guarded_agent_execution'
const execution = 'completed_docs_only_tool_execution_readiness_matrix_no_runtime_execution'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/tool-execution-readiness-matrix.md`,
  `${dir}/agent-execution-contract.md`,
  `${dir}/blocked-scope-register.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-tool-execution-readiness-matrix-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1.md',
]

const sourceFiles = [
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-after-gpac-dispatch-record.json',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-record.json',
  'docs/track-a/native-container-render-tools/rollup-after-gstreamer-mkvtoolnix-qa/rollup.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-qa/gpac-mp4box-controlled-synthetic-media-command-qa-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json',
  'docs/track-a/native-container-render-tools/package-source-owner-decision-1/package-source-owner-decision-1.json',
  'docs/track-a/film-frame-interpolation/ai-graphics-owner-acceptance-1/owner-acceptance.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/agent-execution-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/command-template-registry.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/worker-io-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/fail-closed-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/readiness-report.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/gstreamer-mkvtoolnix-agent-execution-contract-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-diagnostics.mjs',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/disabled-worker-scaffold.md',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/negative-test-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/gstreamer-mkvtoolnix-disabled-worker-scaffold-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1.md',
  'src/backend/contracts/gstreamer-mkvtoolnix-disabled-worker-scaffold-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-diagnostics.mjs',
  'scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  'd816ebc9060c5daa875fa06fa45ce2b4284ee2f8',
  '2026-06-30T12-18-28-184Z-535a64dd',
  'Open-source/local tool areas covered: `8`',
  'Product-ready end-to-end local OSS tools: `0`',
  'ready_for_guarded_agent_execution_contract_planning',
  'blocked_pending_confirmed_guarded_runtime_dispatch',
  'blocked_no_safe_package_source_for_core_vapoursynth_current_base',
  'evaluation_only_non_core_source_evidence_insufficient_for_install_source',
  'blocked_pending_ai_graphics_owner_acceptance_for_film_runtime',
  'handoff_only_no_executable_tool_target',
  'blocked_in_this_lane_unless_track_b_coordinates',
  'approved plan snapshot reference',
  'allowed command template ID',
  'private input manifest',
  'private artifact manifest',
  'PR #577 remains open/draft/blocked/excluded as source-of-truth',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const falseSafetyKeys = [
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCallInThisPhase',
  'modelCallInThisPhase',
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
  'filmExecutionInThisPhase',
  'qwenExecutionInThisPhase',
  'aiGraphicsExecution',
  'ffmpegFfprobeExecutionInThisPhase',
  'dockerExecutionInThisPhase',
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
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bbroad external beta unlock(?:ed)?\s*:\s*`?(true|enabled|completed|passed|approved|unlocked)\b/i,
  /\bpaid production unlock(?:ed)?\s*:\s*`?(true|enabled|completed|passed|approved|unlocked)\b/i,
  /\bproduction unlock(?:ed)?\s*:\s*`?(true|enabled|completed|passed|approved|unlocked)\b/i,
  /\bfinal render\/export\s*:\s*`?(true|enabled|completed|passed|approved|unlocked)\b/i,
  /\b(?:GStreamer|MKVToolNix|GPAC\/MP4Box|VapourSynth|Revideo|FILM|QWEN|FFmpeg\/FFprobe|Docker|Remotion) execution in this matrix phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
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
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== 'd816ebc9060c5daa875fa06fa45ce2b4284ee2f8') fail('integration base mismatch')
if (record.coveredOpenSourceLocalToolAreas !== 8) fail('covered OSS/local tool count mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.sourceChain?.qwenConfirmedRuntime1rMerge !== 'd816ebc9060c5daa875fa06fa45ce2b4284ee2f8') fail('QWEN 1R merge source mismatch')
if (record.sourceChain?.qwenConfirmedRuntimeRunId !== '2026-06-30T12-18-28-184Z-535a64dd') fail('QWEN run ID source mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open/draft/blocked/excluded') fail('#577 exclusion mismatch')
if (record.toolReadiness?.gstreamer_render_pipeline_support?.agentExecutionReadiness !== 'ready_for_guarded_agent_execution_contract_planning') fail('GStreamer readiness mismatch')
if (record.toolReadiness?.mkvtoolnix_container_validation?.agentExecutionReadiness !== 'ready_for_guarded_agent_execution_contract_planning') fail('MKVToolNix readiness mismatch')
if (record.toolReadiness?.gpac_mp4box_packaging_validation?.agentExecutionReadiness !== 'blocked_pending_confirmed_guarded_runtime_dispatch') fail('GPAC readiness mismatch')
if (record.toolReadiness?.vapoursynth_frame_pipeline?.agentExecutionReadiness !== 'blocked_not_agent_executable') fail('VapourSynth readiness mismatch')
if (record.toolReadiness?.revideo_render_preview_alternative?.agentExecutionReadiness !== 'blocked_not_agent_executable') fail('Revideo readiness mismatch')
if (record.toolReadiness?.film_frame_interpolation?.agentExecutionReadiness !== 'blocked_not_agent_executable') fail('FILM readiness mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.safety?.docsOnly !== true) fail('docs-only safety flag mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const qwenRecord = json(
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-record.json',
)
if (qwenRecord.decision !== 'completed_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime') fail('QWEN predecessor decision mismatch')
if (qwenRecord.runtime?.runId !== '2026-06-30T12-18-28-184Z-535a64dd') fail('QWEN predecessor run ID mismatch')

const afterGpac = json('docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-after-gpac-dispatch-record.json')
if (afterGpac.toolReadiness?.gpacMp4box !== 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation_after_official_apt_runtime_and_synthetic_command_qa') fail('after-GPAC readiness source mismatch')
if (afterGpac.productReadyEndToEndLocalOssTools !== 0) fail('after-GPAC product-ready source drift')

const rollup = json('docs/track-a/native-container-render-tools/rollup-after-gstreamer-mkvtoolnix-qa/rollup.json')
if (rollup.decision !== 'completed_native_container_rollup_after_gstreamer_mkvtoolnix_qa') fail('GStreamer/MKVToolNix rollup source mismatch')

const gpacQa = json(
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-qa/gpac-mp4box-controlled-synthetic-media-command-qa-decision.json',
)
if (gpacQa.decision !== 'tracka_gpac_mp4box_controlled_synthetic_media_command_qa_passed_ready_for_worker_contract_review') fail('GPAC synthetic QA source mismatch')

const gpacScaffold = json(
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json',
)
if (gpacScaffold.decision !== 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation') fail('GPAC dispatch scaffold source mismatch')

const ownerDecision = json('docs/track-a/native-container-render-tools/package-source-owner-decision-1/package-source-owner-decision-1.json')
if (ownerDecision.decision !== 'blocked_no_owner_package_source_approval_for_gpac_mp4box_or_core_vapoursynth') fail('owner decision source mismatch')

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-tool-execution-readiness-matrix-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`changed file is outside packet scope: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`blocked changed path: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase API URL leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log('Covered open-source/local tool areas: 8')
console.log('GStreamer/MKVToolNix: ready_for_guarded_agent_execution_contract_planning')
console.log('GPAC/MP4Box: blocked_pending_confirmed_guarded_runtime_dispatch')
