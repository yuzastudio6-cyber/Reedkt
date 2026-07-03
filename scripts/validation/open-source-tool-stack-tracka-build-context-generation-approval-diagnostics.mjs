import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/tracka-build-context-generation-approval'
const expectedDecision = 'build_context_generation_approval_passed_ready_for_generation_execution'
const expectedNextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/build-command-approval-matrix.json`,
  `${reportDir}/build-command-approval-matrix.md`,
  `${reportDir}/generated-artifact-policy.json`,
  `${reportDir}/generated-artifact-policy.md`,
  `${reportDir}/future-execution-scope.json`,
  `${reportDir}/future-execution-scope.md`,
  `${reportDir}/build-context-generation-approval-decision.json`,
  `${reportDir}/build-context-generation-approval-decision.md`,
  `${reportDir}/build-context-generation-approval-readiness-report.json`,
  `${reportDir}/build-context-generation-approval-private-artifact-manifest.json`,
  `${reportDir}/build-context-generation-approval-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-build-context-generation-execution.md',
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
  ['build_context_generation_claimed_run', /\bcurrentPhaseBuildContextGenerationRun["']?\s*[:=]\s*true\b/i],
  ['dist_output_generation_claimed_run', /\bdistOutputGenerationRun["']?\s*[:=]\s*true\b/i],
  ['docker_build_claimed_run', /\bcurrentPhaseDockerBuildRun["']?\s*[:=]\s*true\b/i],
  ['docker_run_claimed_run', /\bcurrentPhaseDockerRun["']?\s*[:=]\s*true\b/i],
  ['ffmpeg_probe_claimed_run', /\bcurrentPhaseFfmpegProbeRun["']?\s*[:=]\s*true\b/i],
  ['ffprobe_probe_claimed_run', /\bcurrentPhaseFfprobeProbeRun["']?\s*[:=]\s*true\b/i],
  ['generated_outputs_committable', /\bgeneratedOutputsMayBeCommitted["']?\s*[:=]\s*true\b/i],
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

const decision = existsSync(`${reportDir}/build-context-generation-approval-decision.json`)
  ? readJson(`${reportDir}/build-context-generation-approval-decision.json`)
  : undefined
const matrix = existsSync(`${reportDir}/build-command-approval-matrix.json`)
  ? readJson(`${reportDir}/build-command-approval-matrix.json`)
  : undefined
const policy = existsSync(`${reportDir}/generated-artifact-policy.json`)
  ? readJson(`${reportDir}/generated-artifact-policy.json`)
  : undefined
const futureScope = existsSync(`${reportDir}/future-execution-scope.json`)
  ? readJson(`${reportDir}/future-execution-scope.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.trackaBuildContextGenerationApproval.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== expectedNextPrompt) failures.push(`next_prompt:${decision.nextPrompt}`)
  if (decision.readyForGenerationExecution !== true) failures.push('decision_not_ready_for_generation_execution')
  if (decision.readyForGenerationThenDockerProbeExecution !== false) failures.push('decision_probe_execution_not_false')
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

const matrixCommands = Array.isArray(matrix?.commands) ? matrix.commands.map((item) => item.command) : []
if (JSON.stringify(matrixCommands) !== JSON.stringify(expectedCommands)) failures.push('future_build_context_commands_mismatch')
if (matrix?.allCommandsExact !== true) failures.push('matrix_commands_not_exact')
if (matrix?.allOutputsExact !== true) failures.push('matrix_outputs_not_exact')
if (matrix?.allApprovedForFutureGenerationOnly !== true) failures.push('matrix_not_generation_only_approved')
if (matrix?.currentPhaseBuildContextGenerationRun !== false) failures.push('matrix_generation_run_not_false')
if (policy?.generatedOutputsMayBeCommitted !== false) failures.push('generated_outputs_may_be_committed_not_false')
if (policy?.cleanupPolicyDefined !== true) failures.push('cleanup_policy_not_defined')
if (policy?.exactCleanupCommand !== 'rm -rf dist-server dist-remotion-worker dist-staging-fixture-worker dist-staging-real-video-export-worker') {
  failures.push(`cleanup_command:${policy?.exactCleanupCommand}`)
}
if (futureScope?.selectedPath !== 'build_context_generation_only') failures.push(`future_scope:${futureScope?.selectedPath}`)
if (futureScope?.dockerBuildIncludedInNextPhase !== false) failures.push('docker_build_not_false')
if (futureScope?.ffmpegFfprobeProbesIncludedInNextPhase !== false) failures.push('probes_not_false')

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
  console.error('Track A build-context generation approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      futureBuildContextCommands: matrixCommands,
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
