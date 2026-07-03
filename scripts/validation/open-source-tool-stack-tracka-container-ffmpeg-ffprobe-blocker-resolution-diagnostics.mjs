import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution'
const expectedDecision = 'exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/command-source-inventory.json`,
  `${reportDir}/command-source-inventory.md`,
  `${reportDir}/docker-container-invocation-policy.json`,
  `${reportDir}/docker-container-invocation-policy.md`,
  `${reportDir}/exact-future-probe-commands.json`,
  `${reportDir}/exact-future-probe-commands.md`,
  `${reportDir}/safety-and-artifact-policy.json`,
  `${reportDir}/safety-and-artifact-policy.md`,
  `${reportDir}/owner-handoff-review.json`,
  `${reportDir}/owner-handoff-review.md`,
  `${reportDir}/exact-probe-command-blocker-resolution-decision.json`,
  `${reportDir}/exact-probe-command-blocker-resolution-decision.md`,
  `${reportDir}/exact-probe-command-blocker-resolution-readiness-report.json`,
  `${reportDir}/exact-probe-command-blocker-resolution-blocker-report.json`,
  `${reportDir}/exact-probe-command-blocker-resolution-private-artifact-manifest.json`,
  `${reportDir}/exact-probe-command-blocker-resolution-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-docker-build-then-ffmpeg-ffprobe-version-probe-execution.md',
]

const sourceEvidenceFiles = [
  'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/tracka-container-ffmpeg-ffprobe-version-probe-decision.json',
  'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/exact-command-source-review.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/future-probe-command-approval.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/runtime-path-selection.json',
  'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
  'docker/prod/render-worker/Dockerfile',
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
  ['current_phase_ffmpeg_probe_true', /\bcurrentPhaseFfmpegProbeRun["']?\s*[:=]\s*true\b/i],
  ['current_phase_ffprobe_probe_true', /\bcurrentPhaseFfprobeProbeRun["']?\s*[:=]\s*true\b/i],
  ['current_phase_version_probe_true', /\bcurrentPhaseVersionProbeRun["']?\s*[:=]\s*true\b/i],
  ['current_phase_docker_build_true', /\bcurrentPhaseDockerBuildRun["']?\s*[:=]\s*true\b/i],
  ['current_phase_docker_run_true', /\bcurrentPhaseDockerRun["']?\s*[:=]\s*true\b/i],
  ['local_host_selected_true', /\blocalHostBinariesSelected["']?\s*[:=]\s*true\b/i],
  ['media_referenced_true', /\bmediaReferencedByFutureCommands["']?\s*[:=]\s*true\b/i],
  ['media_input_allowed_true', /\bmediaInputAllowed["']?\s*[:=]\s*true\b/i],
  ['render_export_allowed_true', /\brenderExportAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_writes_allowed_true', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_allowed_true', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifacts_allowed_true', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_urls_allowed_true', /\bsignedUrlsAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_allowed_true', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['beta_production_allowed_true', /\bbetaProductionUnlockAllowed["']?\s*[:=]\s*true\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/exact-probe-command-blocker-resolution-decision.json`)
  ? readJson(`${reportDir}/exact-probe-command-blocker-resolution-decision.json`)
  : undefined
const commands = existsSync(`${reportDir}/exact-future-probe-commands.json`)
  ? readJson(`${reportDir}/exact-future-probe-commands.json`)
  : undefined
const dockerPolicy = existsSync(`${reportDir}/docker-container-invocation-policy.json`)
  ? readJson(`${reportDir}/docker-container-invocation-policy.json`)
  : undefined
const safety = existsSync(`${reportDir}/safety-and-artifact-policy.json`)
  ? readJson(`${reportDir}/safety-and-artifact-policy.json`)
  : undefined
const inventory = existsSync(`${reportDir}/command-source-inventory.json`)
  ? readJson(`${reportDir}/command-source-inventory.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION') {
    failures.push(`next_prompt:${decision.nextPrompt}`)
  }
  if (decision.currentPhaseFfmpegProbeRun !== false) failures.push('decision_ffmpeg_probe_not_false')
  if (decision.currentPhaseFfprobeProbeRun !== false) failures.push('decision_ffprobe_probe_not_false')
  if (decision.currentPhaseDockerBuildRun !== false) failures.push('decision_docker_build_not_false')
  if (decision.currentPhaseDockerRun !== false) failures.push('decision_docker_run_not_false')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
}

if (commands?.futureBuildCommand !== 'docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> .') {
  failures.push('future_build_command_mismatch')
}
if (commands?.futureFfmpegRunCommand !== 'docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version') {
  failures.push('future_ffmpeg_command_mismatch')
}
if (commands?.futureFfprobeRunCommand !== 'docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version') {
  failures.push('future_ffprobe_command_mismatch')
}
if (commands?.currentPhaseVersionProbeRun !== false) failures.push('commands_version_probe_not_false')
if (dockerPolicy?.futureDockerBuildApproved !== true) failures.push('future_docker_build_not_approved')
if (dockerPolicy?.imagePushAllowed !== false) failures.push('image_push_not_false')
if (dockerPolicy?.mediaMountsAllowed !== false) failures.push('media_mounts_not_false')
if (dockerPolicy?.currentPhaseDockerBuildRun !== false) failures.push('policy_docker_build_not_false')
if (dockerPolicy?.currentPhaseDockerRun !== false) failures.push('policy_docker_run_not_false')
if (safety?.passed !== true) failures.push('safety_not_passed')
if (inventory?.exactFutureCommandsDefined !== true) failures.push('inventory_exact_commands_not_defined')

function gitStatus(path) {
  return execFileSync('git', ['status', '--short', '--', path], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

try {
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
} catch (error) {
  failures.push(`git_or_package_check_failed:${error.message}`)
}

if (failures.length) {
  console.error('Track A container FFmpeg/FFprobe blocker-resolution diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      futureBuildCommand: commands?.futureBuildCommand,
      futureFfmpegRunCommand: commands?.futureFfmpegRunCommand,
      futureFfprobeRunCommand: commands?.futureFfprobeRunCommand,
      currentPhaseDockerBuildRun: decision?.currentPhaseDockerBuildRun,
      currentPhaseDockerRun: decision?.currentPhaseDockerRun,
      currentPhaseFfmpegProbeRun: decision?.currentPhaseFfmpegProbeRun,
      currentPhaseFfprobeProbeRun: decision?.currentPhaseFfprobeProbeRun,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
