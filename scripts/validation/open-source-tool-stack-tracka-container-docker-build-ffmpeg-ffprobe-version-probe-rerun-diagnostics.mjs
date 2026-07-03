import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun'
const sourceSha = '9225347e636a50aa0ef241badbf51f9a3947b1f8'
const imageTag = `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-${sourceSha}`
const expectedBuildCommand = `docker build -f docker/prod/render-worker/Dockerfile -t ${imageTag} .`
const expectedFfmpegCommand = `docker run --rm --network none --entrypoint ffmpeg ${imageTag} -version`
const expectedFfprobeCommand = `docker run --rm --network none --entrypoint ffprobe ${imageTag} -version`
const passDecision = 'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_rerun_passed_media_processing_still_blocked'
const allowedDecisions = new Set([
  'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_rerun_passed_ready_for_qa',
  passDecision,
  'blocked_pending_build_context_generation',
  'blocked_pending_generated_artifact_scan',
  'blocked_pending_generated_artifact_cleanup',
  'blocked_pending_docker_runtime_availability',
  'blocked_pending_docker_build',
  'blocked_pending_ffmpeg_version_probe',
  'blocked_pending_ffprobe_version_probe',
  'blocked_pending_artifact_safety_review',
  'rejected_due_runtime_safety_risk',
])

const requiredFiles = [
  'source-of-truth-audit.json',
  'pre-execution-validation-report.json',
  'pre-execution-validation-report.md',
  'build-context-regeneration-report.json',
  'build-context-regeneration-report.md',
  'generated-artifact-scan-report.json',
  'generated-artifact-scan-report.md',
  'docker-readiness-report.json',
  'docker-build-report.json',
  'docker-build-report.md',
  'ffmpeg-container-version-probe-report.json',
  'ffprobe-container-version-probe-report.json',
  'generated-output-cleanup-report.json',
  'docker-image-cleanup-report.json',
  'side-effect-artifact-safety-report.json',
  'side-effect-artifact-safety-report.md',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.json',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.md',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-readiness-report.json',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-private-artifact-manifest.json',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-validation-results.md',
].map((file) => `${reportDir}/${file}`)

const failures = []
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing_file:${file}`)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return {}
  }
}

const decision = readJson(`${reportDir}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.json`)
const buildContext = readJson(`${reportDir}/build-context-regeneration-report.json`)
const scan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const ffmpeg = readJson(`${reportDir}/ffmpeg-container-version-probe-report.json`)
const ffprobe = readJson(`${reportDir}/ffprobe-container-version-probe-report.json`)
const cleanup = readJson(`${reportDir}/generated-output-cleanup-report.json`)
const sideEffect = readJson(`${reportDir}/side-effect-artifact-safety-report.json`)
const privateManifest = readJson(`${reportDir}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-private-artifact-manifest.json`)

if (!allowedDecisions.has(decision.decision)) failures.push(`decision:${decision.decision}`)
if (decision.approvedCommands?.dockerBuildCommand !== expectedBuildCommand) failures.push('decision_build_command_mismatch')
if (decision.approvedCommands?.dockerFfmpegCommand !== expectedFfmpegCommand) failures.push('decision_ffmpeg_command_mismatch')
if (decision.approvedCommands?.dockerFfprobeCommand !== expectedFfprobeCommand) failures.push('decision_ffprobe_command_mismatch')
if (decision.localHostProbingRun !== false) failures.push('local_host_probe_not_false')
if (decision.mediaInputUsed !== false) failures.push('media_input_not_false')
if (decision.mediaProcessingRun !== false) failures.push('media_processing_not_false')
if (decision.renderExportRun !== false) failures.push('render_export_not_false')
if (decision.dockerImagePushRun !== false) failures.push('docker_image_push_not_false')
if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_not_no_write')

if (!Array.isArray(buildContext.reports) || buildContext.reports.length !== 4) failures.push('build_context_report_count')
if (scan.passed !== true) failures.push('generated_artifact_scan_not_passed')
if (Array.isArray(scan.forbiddenFindings) && scan.forbiddenFindings.length > 0) failures.push('generated_artifact_forbidden_findings')
if (dockerBuild.command !== expectedBuildCommand) failures.push('docker_build_command_mismatch')
if (ffmpeg.approvedContainerCommand !== expectedFfmpegCommand) failures.push('ffmpeg_command_mismatch')
if (ffprobe.approvedContainerCommand !== expectedFfprobeCommand) failures.push('ffprobe_command_mismatch')
if (ffmpeg.noLocalHostProbe !== true || ffprobe.noLocalHostProbe !== true) failures.push('local_host_probe_not_blocked')
if (ffmpeg.noMediaInput !== true || ffprobe.noMediaInput !== true) failures.push('media_input_not_blocked')
if (cleanup.passed !== true) failures.push('cleanup_not_passed')
if (sideEffect.passed !== true) failures.push('side_effect_safety_not_passed')
if (privateManifest.dockerImagePushed !== false) failures.push('private_manifest_docker_push_not_false')
if (privateManifest.mediaArtifactsCreated !== false) failures.push('private_manifest_media_artifacts_not_false')

if (decision.decision === passDecision) {
  if (buildContext.passed !== true) failures.push('pass_without_build_context')
  if (dockerBuild.exitCode !== 0) failures.push('pass_without_docker_build')
  if (ffmpeg.exitCode !== 0 || ffmpeg.versionDetected !== true) failures.push('pass_without_ffmpeg_version')
  if (ffprobe.exitCode !== 0 || ffprobe.versionDetected !== true) failures.push('pass_without_ffprobe_version')
}

for (const directory of [
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
  'dist',
]) {
  if (existsSync(directory)) failures.push(`forbidden_local_output_present:${directory}`)
}

function gitStatus(path) {
  return execFileSync('git', ['status', '--short', '--', path], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

for (const path of ['package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']) {
  const status = gitStatus(path)
  if (status) failures.push(`protected_file_changed:${path}:${status}`)
}

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
const forbiddenPatterns = [
  ['secret_material', /\b(AKIA[0-9A-Z]{16}|sk-(?:proj|live|test)-[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
  ['public_artifacts_true', /\bpublicArtifactsCreated["']?\s*[:=]\s*true\b/i],
  ['signed_urls_true', /\bsignedUrlsCreated["']?\s*[:=]\s*true\b/i],
  ['supabase_write_true', /\bsupabaseWrites(?:Run|Attempted)?["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_true', /\bgcsUpload(?:Run|Attempted)?["']?\s*[:=]\s*true\b/i],
  ['raw_prompts_true', /\brawPrompts(?:Run|Executed)?["']?\s*[:=]\s*true\b/i],
]
for (const [name, pattern] of forbiddenPatterns) {
  if (pattern.test(docsText)) failures.push(`forbidden_pattern:${name}`)
}

if (failures.length) {
  console.error('Track A Docker build FFmpeg/FFprobe rerun diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision.decision,
      imageTag,
      cleanupPassed: cleanup.passed,
      sideEffectSafetyPassed: sideEffect.passed,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
