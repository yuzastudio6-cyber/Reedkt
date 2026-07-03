import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir =
  'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-build-context-blocker-resolution'
const expectedDecision = 'docker_build_blocker_resolution_passed_ready_for_build_context_generation_approval'
const expectedNextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/dockerfile-build-context-review.json`,
  `${reportDir}/dockerfile-build-context-review.md`,
  `${reportDir}/build-script-inventory.json`,
  `${reportDir}/build-script-inventory.md`,
  `${reportDir}/build-context-generation-policy.json`,
  `${reportDir}/build-context-generation-policy.md`,
  `${reportDir}/docker-build-strategy-review.json`,
  `${reportDir}/docker-build-strategy-review.md`,
  `${reportDir}/future-execution-scope.json`,
  `${reportDir}/future-execution-scope.md`,
  `${reportDir}/docker-build-blocker-resolution-decision.json`,
  `${reportDir}/docker-build-blocker-resolution-decision.md`,
  `${reportDir}/docker-build-blocker-resolution-readiness-report.json`,
  `${reportDir}/docker-build-blocker-resolution-private-artifact-manifest.json`,
  `${reportDir}/docker-build-blocker-resolution-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-build-context-generation-approval.md',
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

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing_file:${file}`)
}

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

const forbiddenPatterns = [
  ['docker_build_claimed_run', /\bcurrentPhaseDockerBuildRun["']?\s*[:=]\s*true\b/i],
  ['docker_run_claimed_run', /\bcurrentPhaseDockerRun["']?\s*[:=]\s*true\b/i],
  ['build_context_generation_claimed_run', /\bcurrentPhaseBuildContextGenerationRun["']?\s*[:=]\s*true\b/i],
  ['ffmpeg_probe_claimed_run', /\bcurrentPhaseFfmpegProbeRun["']?\s*[:=]\s*true\b/i],
  ['ffprobe_probe_claimed_run', /\bcurrentPhaseFfprobeProbeRun["']?\s*[:=]\s*true\b/i],
  ['media_processing_allowed', /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i],
  ['render_export_allowed', /\brenderExportAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_writes_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_allowed', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifacts_allowed', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_urls_allowed', /\bsignedUrlsAllowed["']?\s*[:=]\s*true\b/i],
  ['beta_production_allowed', /\bbetaProductionUnlockAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_allowed', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/docker-build-blocker-resolution-decision.json`)
  ? readJson(`${reportDir}/docker-build-blocker-resolution-decision.json`)
  : undefined
const policy = existsSync(`${reportDir}/build-context-generation-policy.json`)
  ? readJson(`${reportDir}/build-context-generation-policy.json`)
  : undefined
const inventory = existsSync(`${reportDir}/build-script-inventory.json`)
  ? readJson(`${reportDir}/build-script-inventory.json`)
  : undefined
const dockerfileReview = existsSync(`${reportDir}/dockerfile-build-context-review.json`)
  ? readJson(`${reportDir}/dockerfile-build-context-review.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== expectedNextPrompt) failures.push(`next_prompt:${decision.nextPrompt}`)
  if (decision.readyForBuildContextGenerationApproval !== true) failures.push('decision_not_ready_for_generation_approval')
  if (decision.readyForBuildContextGenerationAndProbeExecution !== false) failures.push('decision_probe_execution_not_false')
  if (decision.currentPhaseBuildContextGenerationRun !== false) failures.push('decision_generation_not_false')
  if (decision.currentPhaseDockerBuildRun !== false) failures.push('decision_docker_build_not_false')
  if (decision.currentPhaseFfmpegProbeRun !== false) failures.push('decision_ffmpeg_probe_not_false')
  if (decision.currentPhaseFfprobeProbeRun !== false) failures.push('decision_ffprobe_probe_not_false')
  if (decision.generatedDistOutputsCommitted !== false) failures.push('generated_outputs_committed_not_false')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
}

const expectedCommands = [
  'npm run build:server',
  'npm run build:remotion-worker:mock',
  'npm run build:staging-fixture-worker',
  'npm run build:staging-real-video-export-worker',
]

if (JSON.stringify(policy?.futureBuildContextCommands) !== JSON.stringify(expectedCommands)) {
  failures.push('future_build_context_commands_mismatch')
}
if (policy?.futureBuildContextGenerationApprovedNow !== false) failures.push('generation_approved_now_not_false')
if (policy?.readyForFutureBuildContextGenerationApproval !== true) failures.push('generation_approval_readiness_not_true')
if (policy?.generatedOutputsMayBeCommitted !== false) failures.push('generated_outputs_may_be_committed_not_false')
if (policy?.dockerBuildStillSeparate !== true) failures.push('docker_build_not_separate')
if (policy?.ffmpegFfprobeProbesStillSeparate !== true) failures.push('probes_not_separate')
if (inventory?.exactBuildContextGenerationCommandsDerived !== true) failures.push('exact_commands_not_derived')
if (inventory?.currentPhaseBuildScriptsRun !== false) failures.push('build_scripts_run_not_false')
if (dockerfileReview?.mutationOccurred !== false) failures.push('dockerfile_mutation_not_false')
if (dockerfileReview?.dockerfileTooBroadForVersionProbeOnly !== true) failures.push('dockerfile_broad_review_missing')

function gitStatus(path) {
  return execFileSync('git', ['status', '--short', '--', path], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

for (const path of [
  'package-lock.json',
  'docker/prod/render-worker/Dockerfile',
  '.dockerignore',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]) {
  const status = gitStatus(path)
  if (status) failures.push(`unexpected_git_status:${path}:${status}`)
}

try {
  const headPackage = JSON.parse(
    execFileSync('git', ['show', 'HEAD:package.json'], {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    }),
  )
  const workingPackage = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(headPackage[section] ?? {}) !== JSON.stringify(workingPackage[section] ?? {})) {
      failures.push(`package_json_dependency_section_changed:${section}`)
    }
  }
} catch (error) {
  failures.push(`package_json_dependency_check_failed:${error.message}`)
}

if (failures.length) {
  console.error('Track A Docker build blocker-resolution diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      futureBuildContextCommands: policy?.futureBuildContextCommands,
      currentPhaseBuildContextGenerationRun: decision?.currentPhaseBuildContextGenerationRun,
      currentPhaseDockerBuildRun: decision?.currentPhaseDockerBuildRun,
      currentPhaseFfmpegProbeRun: decision?.currentPhaseFfmpegProbeRun,
      currentPhaseFfprobeProbeRun: decision?.currentPhaseFfprobeProbeRun,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
