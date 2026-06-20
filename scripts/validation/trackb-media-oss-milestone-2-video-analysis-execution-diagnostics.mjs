#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-2-video-analysis-execution'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const passDecision = 'trackb_media_oss_milestone2_video_analysis_execution_passed_all_three_tools_cpu_bounded'
const acceptableDecisions = new Set([
  passDecision,
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyav_fixture_deferred',
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyscenedetect_fixture_deferred',
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyav_and_pyscenedetect_fixtures_deferred',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_source_target_drift',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_dependency_hydration',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_build_context_generation',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_generated_artifact_scan',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_docker_build',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_opencv_import_or_fixture',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_pyav_import_or_fixture',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_pyscenedetect_import_or_fixture',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_artifact_cleanup',
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_safety_scan',
  'rejected_due_runtime_safety_risk',
])
const nextPromptPass = 'TRACKB_MEDIA_OSS_MILESTONE_2_QA_REVIEW'
const nextPromptBlock = 'TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION_BLOCKER_FOLLOWUP'
const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'source-target-check.json',
  'source-target-check.md',
  'dependency-hydration-report.json',
  'dependency-hydration-report.md',
  'build-context-generation-report.json',
  'build-context-generation-report.md',
  'generated-artifact-scan-report.json',
  'generated-artifact-scan-report.md',
  'docker-build-report.json',
  'docker-build-report.md',
  'import-version-proof-report.json',
  'import-version-proof-report.md',
  'synthetic-fixture-proof-report.json',
  'synthetic-fixture-proof-report.md',
  'artifact-cleanup-report.json',
  'artifact-cleanup-report.md',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'milestone-2-video-analysis-status-matrix.json',
  'milestone-2-video-analysis-status-matrix.md',
  'milestone-2-video-analysis-execution-decision.json',
  'milestone-2-video-analysis-execution-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${reportDir}/${file}`)
const statusFiles = [
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const failures = []
function fail(message) {
  failures.push(message)
}
function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    fail(`missing_file:${relativePath}`)
    return ''
  }
  return fs.readFileSync(fullPath, 'utf8')
}
function readJson(relativePath) {
  const text = readText(relativePath)
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`invalid_json:${relativePath}:${error.message}`)
    return {}
  }
}
function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
}
function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}

for (const file of [...requiredFiles, ...statusFiles]) readText(file)
const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const target = readJson(`${reportDir}/source-target-check.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const scan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const version = readJson(`${reportDir}/import-version-proof-report.json`)
const fixture = readJson(`${reportDir}/synthetic-fixture-proof-report.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-2-video-analysis-status-matrix.json`)
const decision = readJson(`${reportDir}/milestone-2-video-analysis-execution-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const packageJson = readJson('package.json')

for (const [label, report] of Object.entries({
  source,
  target,
  hydration,
  generation,
  scan,
  dockerBuild,
  version,
  fixture,
  cleanup,
  safety,
  matrix,
  decision,
  readiness,
  manifest,
})) {
  if (!acceptableDecisions.has(report.decision)) fail(`decision_unknown:${label}:${report.decision}`)
  if (report.decision !== decision.decision) fail(`decision_drift:${label}:${report.decision}`)
}
if (source.ownerId !== ownerId || decision.ownerId !== ownerId) fail('owner_id_drift')
for (const pr of [567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') fail(`missing_pr${pr}_merged_source`)
}
if (source.sourceEvidence?.find((entry) => entry.pr === 567)?.targetRequirements !== 'docker/prod/cpu-worker/requirements.cpu.txt') {
  fail('missing_pr567_target_requirements')
}

sameSet(matrix.tools?.map((tool) => tool.id), ['opencv', 'pyav', 'pyscenedetect'], 'matrix_tools')
sameSet(decision.targetTools, ['opencv', 'pyav', 'pyscenedetect'], 'decision_tools')
sameSet(Object.keys(target.packagePresence || {}), ['opencv-python-headless', 'av', 'scenedetect'], 'target_packages')
for (const value of Object.values(target.packagePresence || {})) if (value !== true) fail('target_package_missing')
if (target.dockerfileCopiesRequirements !== true || target.dockerfileInstallsRequirements !== true) fail('dockerfile_requirements_target_drift')
if (target.ffmpegFfprobeExpansionApproved !== false) fail('ffmpeg_expansion_approved')
if (hydration.packageFilesUnchanged !== true) fail('package_files_changed_by_hydration')
if (scan.realUserMediaUsed !== false || scan.publicArtifactsCreated !== false || scan.signedUrlsCreated !== false) fail('scan_scope_unblocked')
if (dockerBuild.dockerImagePushRun !== false) fail('docker_image_push_claimed')
if (version.localHostProbeRun !== false) fail('local_host_probe_claimed')
if (fixture.realUserMediaUsed !== false || fixture.ffmpegFfprobeCommandRun !== false) fail('fixture_scope_unblocked')
if (cleanup.generatedOutputsCleaned !== true) fail('cleanup_failed')
if (safety.passed !== true) fail('safety_scan_failed')
if (safety.generatedOutputsCommitted !== false || safety.fixtureOutputsCommitted !== false) fail('generated_outputs_committed')
if (decision.endToEndProductReadyTools !== 0 || decision.fortyPlusEndToEndClaimAllowed !== false) fail('product_ready_or_40_plus_claim_drift')
if (decision.cpuOnly !== true || decision.gpuRunInThisPhase !== false) fail('cpu_gpu_scope_drift')
if (decision.pipInstallRunOnHost !== false || decision.npmInstallRunOnHost !== false || decision.npmRebuildRunOnHost !== false) fail('host_install_scope_unblocked')
if (decision.requirementsMutationAllowed !== false || decision.dockerfileMutationAllowed !== false) fail('packaging_mutation_allowed')
if (decision.ffmpegFfprobeCommandRunInThisPhase !== false) fail('ffmpeg_ffprobe_command_claimed')
if (decision.milestone1ToolsRunInThisPhase !== false) fail('milestone1_tools_claimed')
if (decision.mediaProcessingAccepted !== false || decision.renderExportAccepted !== false) fail('media_render_scope_unblocked')
if (decision.workerRuntimeAccepted !== false || decision.routeProviderRuntimeAccepted !== false) fail('runtime_scope_unblocked')
if (decision.supabaseGcsPublicDeliveryAccepted !== false) fail('supabase_gcs_scope_unblocked')
if (manifest.localDockerImagePushed !== false || manifest.generatedBuildContextOutputsCommitted !== false) fail('manifest_artifact_scope_unblocked')
if (decision.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_drift')
if (decision.supabaseClassification?.environmentTouched !== 'none') fail('supabase_env_drift')
if (decision.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_drift')
if (decision.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_drift')
if (
  [
    passDecision,
    'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyav_fixture_deferred',
    'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyscenedetect_fixture_deferred',
    'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyav_and_pyscenedetect_fixtures_deferred',
  ].includes(decision.decision)
) {
  if (readiness.nextPrompt !== nextPromptPass) fail('pass_next_prompt_drift')
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-2-qa-review.md'))) fail('missing_qa_prompt')
} else if (readiness.nextPrompt !== nextPromptBlock) {
  fail('blocker_next_prompt_drift')
}

if (status.counts?.ownedTools !== 16) fail('owned_count_drift')
if (status.counts?.acceptedProvenBounded !== 9) fail('canonical_accepted_count_should_remain_9_until_qa')
if (status.counts?.blockedNotInstalledProven !== 7) fail('canonical_blocked_count_should_remain_7_until_qa')
if (status.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
if (status.milestone2VideoAnalysisExecution?.decision !== decision.decision) fail('missing_status_json_milestone2_execution')
if (status.milestone2VideoAnalysisExecution?.canonicalCountsRemainPendingQa !== true) fail('missing_pending_qa_count_boundary')

if (
  packageJson.scripts?.['trackb-media-oss:milestone-2-video-analysis-execution:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-2-video-analysis-execution-diagnostics.mjs'
) {
  fail('missing_package_diagnostics_script')
}
if (
  packageJson.scripts?.['smoke:trackb-media-oss-milestone-2-video-analysis-execution'] !==
  'node server/smoke/trackb-media-oss-milestone-2-video-analysis-execution-smoke.js'
) {
  fail('missing_package_smoke_script')
}

const protectedPaths = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
]
const protectedDiff = git(['diff', '--name-only', '--', ...protectedPaths])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', ...protectedPaths])
if (protectedDiff || protectedCachedDiff) fail('protected_or_runtime_packaging_file_mutation')
for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}

const scanFiles = [...requiredFiles, ...statusFiles]
const forbiddenPatterns = [
  /40\+\s+tools.*end-to-end.*proven/i,
  /end-to-end product-ready (?:Track B )?tools:\s*[1-9]/i,
  /GPU execution approved/i,
  /FFmpeg\/FFprobe expansion approved/i,
  /real user media used/i,
  /media processing approved/i,
  /render\/export approved/i,
  /beta .*unlocked/i,
  /production .*unlocked/i,
  /sk-[A-Za-z0-9_-]{20,}/,
  /postgres(?:ql)?:\/\//i,
  /X-Amz-Signature=/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden_text:${file}:${pattern}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: decision.decision,
  ownerId,
  tools: matrix.tools?.map((tool) => tool.id),
  targetDockerfile: decision.targetDockerfile,
  targetRequirements: decision.targetRequirements,
  canonicalAcceptedProvenBoundedBeforeMilestone2: decision.canonicalAcceptedProvenBoundedBeforeMilestone2,
  newlyProofedBoundedForQaReview: decision.newlyProofedBoundedForQaReview,
  nextPrompt: decision.nextPrompt,
  supabaseClassification: decision.supabaseClassification,
}, null, 2))
