import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution'
const sourceSha = '2f6ab6463870dc12d6837dc71f816ad5eefcd88f'
const imageTag = `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-${sourceSha}`
const expectedBuildCommand = `docker build -f docker/prod/render-worker/Dockerfile -t ${imageTag} .`
const expectedFfmpegCommand = `docker run --rm --network none --entrypoint ffmpeg ${imageTag} -version`
const expectedFfprobeCommand = `docker run --rm --network none --entrypoint ffprobe ${imageTag} -version`
const passDecision = 'tracka_container_docker_build_then_ffmpeg_ffprobe_version_probe_passed_media_processing_still_blocked'
const allowedDecisions = new Set([
  passDecision,
  'blocked_pending_docker_runtime_availability',
  'blocked_pending_docker_build',
  'blocked_pending_ffmpeg_version_probe',
  'blocked_pending_ffprobe_version_probe',
  'blocked_pending_artifact_safety_review',
  'rejected_due_runtime_safety_risk',
])

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/exact-command-source-review.json`,
  `${reportDir}/exact-command-source-review.md`,
  `${reportDir}/pre-execution-validation-report.json`,
  `${reportDir}/pre-execution-validation-report.md`,
  `${reportDir}/docker-container-readiness-report.json`,
  `${reportDir}/ffmpeg-version-probe-report.json`,
  `${reportDir}/ffprobe-version-probe-report.json`,
  `${reportDir}/side-effect-artifact-safety-report.json`,
  `${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-decision.json`,
  `${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-decision.md`,
  `${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-readiness-report.json`,
  `${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-blocker-report.json`,
  `${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-private-artifact-manifest.json`,
  `${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-validation-results.md`,
]

const sourceEvidenceFiles = [
  'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-probe-command-blocker-resolution-decision.json',
  'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-future-probe-commands.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/runtime-path-selection.json',
  'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
]

const failures = []

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return undefined
  }
}

for (const file of [...requiredFiles, ...sourceEvidenceFiles]) {
  if (!existsSync(file)) failures.push(`missing_file:${file}`)
}

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

const forbiddenPatterns = [
  ['local_host_probe_used_true', /\blocalHostSystemBinaryProbeUsed["']?\s*[:=]\s*true\b/i],
  ['docker_image_push_true', /\bdockerImagePush(?:Attempted|Run|ed)?["']?\s*[:=]\s*true\b/i],
  ['dockerfile_mutation_true', /\bdockerfileMutation(?:Attempted|Run)?["']?\s*[:=]\s*true\b/i],
  ['container_definition_mutation_true', /\bcontainerDefinitionMutation(?:Attempted|Run)?["']?\s*[:=]\s*true\b/i],
  ['media_input_true', /\bmediaInputUsed["']?\s*[:=]\s*true\b/i],
  ['media_processing_true', /\bmediaProcessingAttempted["']?\s*[:=]\s*true\b/i],
  ['caption_burn_in_true', /\bcaptionBurnInAttempted["']?\s*[:=]\s*true\b/i],
  ['render_export_true', /\brenderExportAttempted["']?\s*[:=]\s*true\b/i],
  ['npm_install_true', /\bnpmInstallAttempted["']?\s*[:=]\s*true\b/i],
  ['npm_rebuild_true', /\bnpmRebuildAttempted["']?\s*[:=]\s*true\b/i],
  ['package_lifecycle_true', /\bpackageLifecycleScriptsAttempted["']?\s*[:=]\s*true\b/i],
  ['package_lock_mutation_true', /\bpackageLockMutationAttempted["']?\s*[:=]\s*true\b/i],
  ['duckdb_proof_rerun_true', /\bduckdbProofRerun["']?\s*[:=]\s*true\b/i],
  ['polars_proof_rerun_true', /\bpolarsProofRerun["']?\s*[:=]\s*true\b/i],
  ['worker_execution_true', /\bworkerExecutionAttempted["']?\s*[:=]\s*true\b/i],
  ['route_execution_true', /\brouteExecutionAttempted["']?\s*[:=]\s*true\b/i],
  ['provider_calls_true', /\bproviderCallsAttempted["']?\s*[:=]\s*true\b/i],
  ['supabase_writes_true', /\bsupabaseWritesAttempted["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_true', /\bgcsUploadAttempted["']?\s*[:=]\s*true\b/i],
  ['public_artifacts_true', /\bpublicArtifactsCreated["']?\s*[:=]\s*true\b/i],
  ['signed_urls_true', /\bsignedUrlsCreated["']?\s*[:=]\s*true\b/i],
  ['raw_prompts_true', /\brawPromptsExecuted["']?\s*[:=]\s*true\b/i],
  ['production_unlock_true', /\bbetaProductionUnlocked["']?\s*[:=]\s*true\b/i],
  ['old_exact_command_blocker_decision', /blocked_pending_exact_probe_command_source/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-decision.json`)
  ? readJson(`${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-decision.json`)
  : undefined
const exactCommand = existsSync(`${reportDir}/exact-command-source-review.json`)
  ? readJson(`${reportDir}/exact-command-source-review.json`)
  : undefined
const dockerReadiness = existsSync(`${reportDir}/docker-container-readiness-report.json`)
  ? readJson(`${reportDir}/docker-container-readiness-report.json`)
  : undefined
const ffmpegProbe = existsSync(`${reportDir}/ffmpeg-version-probe-report.json`)
  ? readJson(`${reportDir}/ffmpeg-version-probe-report.json`)
  : undefined
const ffprobeProbe = existsSync(`${reportDir}/ffprobe-version-probe-report.json`)
  ? readJson(`${reportDir}/ffprobe-version-probe-report.json`)
  : undefined
const sideEffect = existsSync(`${reportDir}/side-effect-artifact-safety-report.json`)
  ? readJson(`${reportDir}/side-effect-artifact-safety-report.json`)
  : undefined
const privateManifest = existsSync(`${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-private-artifact-manifest.json`)
  ? readJson(`${reportDir}/tracka-container-ffmpeg-ffprobe-version-probe-private-artifact-manifest.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (!allowedDecisions.has(decision.decision)) failures.push(`decision:${decision.decision}`)
  if (decision.selectedRuntimePath !== 'tracka_repo_owned_render_worker_container') {
    failures.push(`selected_runtime_path:${decision.selectedRuntimePath}`)
  }
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
  if (decision.approvedCommands?.dockerBuildCommand !== expectedBuildCommand) failures.push('decision_build_command_mismatch')
  if (decision.approvedCommands?.dockerFfmpegCommand !== expectedFfmpegCommand) failures.push('decision_ffmpeg_command_mismatch')
  if (decision.approvedCommands?.dockerFfprobeCommand !== expectedFfprobeCommand) failures.push('decision_ffprobe_command_mismatch')
  if (decision.dockerRunAttempted === true && decision.dockerBuildExitCode !== 0) failures.push('docker_run_without_successful_build')
}

if (exactCommand?.imageTag !== imageTag) failures.push(`image_tag:${exactCommand?.imageTag}`)
if (exactCommand?.exactContainerInvocationPresent !== true) failures.push('exact_container_invocation_not_true')
if (exactCommand?.approvedDockerBuildCommand !== expectedBuildCommand) failures.push('exact_build_command_mismatch')
if (exactCommand?.approvedFfmpegProbeCommand !== expectedFfmpegCommand) failures.push('exact_ffmpeg_command_mismatch')
if (exactCommand?.approvedFfprobeProbeCommand !== expectedFfprobeCommand) failures.push('exact_ffprobe_command_mismatch')
if (exactCommand?.localHostProbingApproved !== false) failures.push('local_host_probing_not_blocked')
if (exactCommand?.mediaInputAllowed !== false) failures.push('media_input_not_blocked')
if (exactCommand?.dockerImagePushApproved !== false) failures.push('docker_push_not_blocked')
if (exactCommand?.commandUnambiguous !== true) failures.push('command_not_unambiguous')

if (dockerReadiness?.dockerBuildCommand !== expectedBuildCommand) failures.push('docker_report_build_command_mismatch')
if (dockerReadiness?.dockerImagePushRun !== false) failures.push('docker_push_ran')
if (dockerReadiness?.dockerfileMutationRun !== false) failures.push('dockerfile_mutation_ran')
if (dockerReadiness?.containerDefinitionMutationRun !== false) failures.push('container_definition_mutation_ran')

if (ffmpegProbe?.approvedContainerCommand !== expectedFfmpegCommand) failures.push('ffmpeg_report_command_mismatch')
if (ffprobeProbe?.approvedContainerCommand !== expectedFfprobeCommand) failures.push('ffprobe_report_command_mismatch')
if (ffmpegProbe?.noLocalHostProbe !== true) failures.push('ffmpeg_local_host_not_blocked')
if (ffprobeProbe?.noLocalHostProbe !== true) failures.push('ffprobe_local_host_not_blocked')
if (ffmpegProbe?.noMediaInput !== true) failures.push('ffmpeg_media_input_not_blocked')
if (ffprobeProbe?.noMediaInput !== true) failures.push('ffprobe_media_input_not_blocked')
if (sideEffect?.passed !== true) failures.push('side_effect_safety_not_passed')
if (privateManifest?.dockerImagesPushed !== false) failures.push('private_manifest_push_not_false')
if (privateManifest?.mediaArtifactsCreated !== false) failures.push('private_manifest_media_not_false')

if (decision?.decision === passDecision) {
  if (dockerReadiness?.dockerBuildRun !== true || dockerReadiness?.dockerBuildExitCode !== 0) failures.push('pass_without_successful_docker_build')
  if (ffmpegProbe?.probeRun !== true || ffmpegProbe?.exitCode !== 0) failures.push('pass_without_successful_ffmpeg_probe')
  if (ffprobeProbe?.probeRun !== true || ffprobeProbe?.exitCode !== 0) failures.push('pass_without_successful_ffprobe_probe')
  if (!ffmpegProbe?.versionDetected) failures.push('ffmpeg_version_not_detected')
  if (!ffprobeProbe?.versionDetected) failures.push('ffprobe_version_not_detected')
  if (decision?.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW') {
    failures.push(`pass_next_prompt:${decision?.nextPrompt}`)
  }
}

if (decision?.decision === 'blocked_pending_docker_runtime_availability') {
  if (ffmpegProbe?.probeRun === true || ffprobeProbe?.probeRun === true) failures.push('probe_ran_after_docker_runtime_block')
}

function gitStatus(path) {
  return execFileSync('git', ['status', '--short', '--', path], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

try {
  const packageJsonStatus = gitStatus('package.json')
  const packageLockStatus = gitStatus('package-lock.json')
  const dockerfileStatus = gitStatus('docker/prod/render-worker/Dockerfile')
  if (packageLockStatus) failures.push(`package_lock_has_git_status:${packageLockStatus}`)
  if (dockerfileStatus) failures.push(`dockerfile_has_git_status:${dockerfileStatus}`)
  const headPackage = JSON.parse(
    execFileSync('git', ['show', 'HEAD:package.json'], {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    }),
  )
  const workingPackage = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const head = JSON.stringify(headPackage[section] ?? {})
    const working = JSON.stringify(workingPackage[section] ?? {})
    if (head !== working) failures.push(`package_json_dependency_section_changed:${section}`)
  }
  if (packageJsonStatus && !/^( M|M) package\.json$/.test(packageJsonStatus)) {
    failures.push(`unexpected_package_json_status:${packageJsonStatus}`)
  }
} catch (error) {
  failures.push(`git_or_package_check_failed:${error.message}`)
}

if (failures.length) {
  console.error('Track A container Docker build then FFmpeg/FFprobe version-probe diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      imageTag,
      dockerBuildRun: dockerReadiness?.dockerBuildRun,
      dockerBuildExitCode: dockerReadiness?.dockerBuildExitCode,
      ffmpegProbeRun: ffmpegProbe?.probeRun,
      ffmpegExitCode: ffmpegProbe?.exitCode,
      ffmpegVersionDetected: ffmpegProbe?.versionDetected,
      ffprobeProbeRun: ffprobeProbe?.probeRun,
      ffprobeExitCode: ffprobeProbe?.exitCode,
      ffprobeVersionDetected: ffprobeProbe?.versionDetected,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
