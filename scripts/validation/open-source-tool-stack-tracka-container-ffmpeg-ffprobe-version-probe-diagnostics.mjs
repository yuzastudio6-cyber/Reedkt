import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution'
const expectedDecision = 'blocked_pending_exact_probe_command_source'

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
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution.md',
]

const sourceEvidenceFiles = [
  'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/future-probe-command-approval.json',
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
  ['exact_container_invocation_present_true', /\bexactContainerInvocationPresent["']?\s*[:=]\s*true\b/i],
  ['local_host_probe_used_true', /\blocalHostSystemBinaryProbeUsed["']?\s*[:=]\s*true\b/i],
  ['probe_run_true', /\bprobeRun["']?\s*[:=]\s*true\b/i],
  ['ffmpeg_probe_run_true', /\bffmpegProbeRun["']?\s*[:=]\s*true\b/i],
  ['ffprobe_probe_run_true', /\bffprobeProbeRun["']?\s*[:=]\s*true\b/i],
  ['docker_build_attempted_true', /\bdockerBuildAttempted["']?\s*[:=]\s*true\b/i],
  ['docker_run_attempted_true', /\bdockerRunAttempted["']?\s*[:=]\s*true\b/i],
  ['docker_image_push_true', /\bdockerImagePushAttempted["']?\s*[:=]\s*true\b/i],
  ['dockerfile_mutation_true', /\bdockerfileMutationAttempted["']?\s*[:=]\s*true\b/i],
  ['media_input_true', /\bmediaInputUsed["']?\s*[:=]\s*true\b/i],
  ['media_processing_true', /\bmediaProcessingAttempted["']?\s*[:=]\s*true\b/i],
  ['render_export_true', /\brenderExportAttempted["']?\s*[:=]\s*true\b/i],
  ['package_lock_mutation_true', /\bpackageLockMutationAttempted["']?\s*[:=]\s*true\b/i],
  ['worker_execution_true', /\bworkerExecutionAttempted["']?\s*[:=]\s*true\b/i],
  ['route_execution_true', /\brouteExecutionAttempted["']?\s*[:=]\s*true\b/i],
  ['provider_calls_true', /\bproviderCallsAttempted["']?\s*[:=]\s*true\b/i],
  ['supabase_writes_true', /\bsupabaseWritesAttempted["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_true', /\bgcsUploadAttempted["']?\s*[:=]\s*true\b/i],
  ['public_artifacts_true', /\bpublicArtifactsCreated["']?\s*[:=]\s*true\b/i],
  ['signed_urls_true', /\bsignedUrlsCreated["']?\s*[:=]\s*true\b/i],
  ['raw_prompts_true', /\brawPromptsExecuted["']?\s*[:=]\s*true\b/i],
  ['production_unlock_true', /\bbetaProductionUnlocked["']?\s*[:=]\s*true\b/i],
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

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION') {
    failures.push(`next_prompt:${decision.nextPrompt}`)
  }
  if (decision.selectedRuntimePath !== 'tracka_repo_owned_render_worker_container') {
    failures.push(`selected_runtime_path:${decision.selectedRuntimePath}`)
  }
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
}

if (exactCommand?.exactContainerInvocationPresent !== false) failures.push('exact_container_invocation_not_false')
if (exactCommand?.exactFfmpegProbeCommand !== 'ffmpeg -version') failures.push('ffmpeg_inner_command_missing')
if (exactCommand?.exactFfprobeProbeCommand !== 'ffprobe -version') failures.push('ffprobe_inner_command_missing')
if (exactCommand?.commandUnambiguous !== false) failures.push('command_unambiguous_not_false')
if (exactCommand?.blocker !== expectedDecision) failures.push(`exact_command_blocker:${exactCommand?.blocker}`)
if (dockerReadiness?.dockerRuntimeCheckRun !== false) failures.push('docker_runtime_check_ran')
if (dockerReadiness?.blockedBeforeDockerReadiness !== true) failures.push('not_blocked_before_docker')
if (ffmpegProbe?.probeRun !== false) failures.push('ffmpeg_probe_ran')
if (ffprobeProbe?.probeRun !== false) failures.push('ffprobe_probe_ran')
if (sideEffect?.passed !== true) failures.push('side_effect_safety_not_passed')

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
  console.error('Track A container FFmpeg/FFprobe version-probe diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      selectedRuntimePath: decision?.selectedRuntimePath,
      approvedInnerCommands: decision?.approvedInnerCommands,
      exactContainerInvocationPresent: exactCommand?.exactContainerInvocationPresent,
      ffmpegProbeRun: ffmpegProbe?.probeRun,
      ffprobeProbeRun: ffprobeProbe?.probeRun,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
