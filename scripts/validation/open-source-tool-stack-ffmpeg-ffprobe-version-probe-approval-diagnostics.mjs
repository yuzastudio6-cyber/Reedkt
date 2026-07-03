import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval'
const expectedDecision = 'ffmpeg_ffprobe_version_probe_approval_passed_ready_for_tracka_container_probe_execution'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/evidence-revalidation-report.json`,
  `${reportDir}/evidence-revalidation-report.md`,
  `${reportDir}/runtime-path-selection.json`,
  `${reportDir}/runtime-path-selection.md`,
  `${reportDir}/future-probe-command-approval.json`,
  `${reportDir}/future-probe-command-approval.md`,
  `${reportDir}/blocked-scope-policy.json`,
  `${reportDir}/blocked-scope-policy.md`,
  `${reportDir}/package-docker-artifact-policy.json`,
  `${reportDir}/package-docker-artifact-policy.md`,
  `${reportDir}/ffmpeg-ffprobe-version-probe-approval-decision.json`,
  `${reportDir}/ffmpeg-ffprobe-version-probe-approval-decision.md`,
  `${reportDir}/ffmpeg-ffprobe-version-probe-approval-readiness-report.json`,
  `${reportDir}/ffmpeg-ffprobe-version-probe-approval-blocker-report.json`,
  `${reportDir}/ffmpeg-ffprobe-version-probe-approval-private-artifact-manifest.json`,
  `${reportDir}/ffmpeg-ffprobe-version-probe-approval-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-execution.md',
]

const sourceEvidenceFiles = [
  'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/ffmpeg-ffprobe-central-evidence.json',
  'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/future-version-probe-boundary.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
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
  ['ffmpeg_installed_claim', /\bffmpegAcceptedAsInstalledAndProven["']?\s*[:=]\s*true\b/i],
  ['ffprobe_installed_claim', /\bffprobeAcceptedAsInstalledAndProven["']?\s*[:=]\s*true\b/i],
  ['local_host_binary_approved', /\blocalHostSystemBinaryApproved["']?\s*[:=]\s*true\b/i],
  ['version_probe_run_now', /\bversionProbeRunInThisPhase["']?\s*[:=]\s*true\b/i],
  ['ffmpeg_probe_run', /\bffmpegProbeRun["']?\s*[:=]\s*true\b/i],
  ['ffprobe_probe_run', /\bffprobeProbeRun["']?\s*[:=]\s*true\b/i],
  ['docker_build_approved_now', /\bdockerBuildApprovedNow["']?\s*[:=]\s*true\b/i],
  ['docker_run_approved_now', /\bdockerRunApprovedNow["']?\s*[:=]\s*true\b/i],
  ['docker_mutation_approved_now', /\bdockerContainerMutationApprovedNow["']?\s*[:=]\s*true\b/i],
  ['media_input_allowed', /\bmediaInputAllowed["']?\s*[:=]\s*true\b/i],
  ['file_probe_allowed', /\bfileProbeAllowed["']?\s*[:=]\s*true\b/i],
  ['decode_allowed', /\bdecodeAllowed["']?\s*[:=]\s*true\b/i],
  ['encode_allowed', /\bencodeAllowed["']?\s*[:=]\s*true\b/i],
  ['output_files_allowed', /\boutputFilesAllowed["']?\s*[:=]\s*true\b/i],
  ['package_lock_mutation_allowed', /\bpackageLockMutationAllowed["']?\s*[:=]\s*true\b/i],
  ['dockerfile_mutation_allowed', /\bdockerfileMutationAllowed["']?\s*[:=]\s*true\b/i],
  ['worker_execution_allowed', /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['provider_execution_allowed', /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_writes_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_allowed', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifacts_allowed', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_urls_allowed', /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_allowed', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['production_unlock_allowed', /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/ffmpeg-ffprobe-version-probe-approval-decision.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-version-probe-approval-decision.json`)
  : undefined
const evidence = existsSync(`${reportDir}/evidence-revalidation-report.json`)
  ? readJson(`${reportDir}/evidence-revalidation-report.json`)
  : undefined
const runtimePath = existsSync(`${reportDir}/runtime-path-selection.json`)
  ? readJson(`${reportDir}/runtime-path-selection.json`)
  : undefined
const commands = existsSync(`${reportDir}/future-probe-command-approval.json`)
  ? readJson(`${reportDir}/future-probe-command-approval.json`)
  : undefined
const scope = existsSync(`${reportDir}/blocked-scope-policy.json`)
  ? readJson(`${reportDir}/blocked-scope-policy.json`)
  : undefined
const packageDocker = existsSync(`${reportDir}/package-docker-artifact-policy.json`)
  ? readJson(`${reportDir}/package-docker-artifact-policy.json`)
  : undefined
const readiness = existsSync(`${reportDir}/ffmpeg-ffprobe-version-probe-approval-readiness-report.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-version-probe-approval-readiness-report.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION') {
    failures.push(`next_prompt:${decision.nextPrompt}`)
  }
  if (decision.selectedRuntimePath !== 'tracka_repo_owned_render_worker_container') {
    failures.push(`selected_runtime_path:${decision.selectedRuntimePath}`)
  }
  if (decision.localHostSystemBinaryApproved !== false) failures.push('local_host_binary_approved')
  if (decision.versionProbeRunInThisPhase !== false) failures.push('version_probe_run_in_phase')
  if (decision.ffmpegAcceptedAsInstalledAndProven !== false) failures.push('ffmpeg_incorrectly_accepted')
  if (decision.ffprobeAcceptedAsInstalledAndProven !== false) failures.push('ffprobe_incorrectly_accepted')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
}

if (evidence?.passed !== true) failures.push('evidence_revalidation_not_passed')
if (runtimePath?.selectedRuntimePath !== 'tracka_repo_owned_render_worker_container') {
  failures.push(`runtime_selected_path:${runtimePath?.selectedRuntimePath}`)
}
if (runtimePath?.dockerfilePresentInCentral !== true) failures.push('runtime_dockerfile_missing')
if (runtimePath?.localHostSystemBinaryApproved !== false) failures.push('runtime_local_host_approved')
if (runtimePath?.versionProbeExecutionRunNow !== false) failures.push('runtime_probe_run_now')
if (!Array.isArray(commands?.commandsApprovedForFutureSeparateExecution)) {
  failures.push('commands_not_array')
} else {
  if (!commands.commandsApprovedForFutureSeparateExecution.includes('ffmpeg -version')) failures.push('ffmpeg_command_missing')
  if (!commands.commandsApprovedForFutureSeparateExecution.includes('ffprobe -version')) failures.push('ffprobe_command_missing')
}
if (commands?.executionEnvironment !== 'tracka_repo_owned_render_worker_container') {
  failures.push(`command_environment:${commands?.executionEnvironment}`)
}
if (commands?.versionProbeRunInThisPhase !== false) failures.push('commands_probe_run_now')
if (commands?.mediaInputAllowed !== false) failures.push('commands_media_input_allowed')
if (commands?.fileProbeAllowed !== false) failures.push('commands_file_probe_allowed')
if (scope?.allExecutionUnlockFlagsFalse !== true) failures.push('scope_flags_not_false')
if (packageDocker?.packageLockMutationAllowed !== false) failures.push('package_lock_mutation_allowed')
if (packageDocker?.dockerfileMutationAllowed !== false) failures.push('dockerfile_mutation_allowed')
if (packageDocker?.dockerBuildApprovedNow !== false) failures.push('docker_build_approved_now')
if (readiness?.readiness !== true) failures.push('readiness_not_true')

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
  console.error('Open-source FFmpeg/FFprobe version-probe approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      selectedRuntimePath: runtimePath?.selectedRuntimePath,
      commandsApprovedForFutureSeparateExecution: commands?.commandsApprovedForFutureSeparateExecution,
      localHostSystemBinaryApproved: runtimePath?.localHostSystemBinaryApproved,
      versionProbeRunInThisPhase: decision?.versionProbeRunInThisPhase,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
