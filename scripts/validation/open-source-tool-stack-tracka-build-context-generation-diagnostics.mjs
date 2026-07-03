import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/tracka-build-context-generation-execution'
const expectedDecision = 'build_context_generation_execution_passed_ready_for_docker_build_probe_execution'
const expectedNextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_RERUN'

const distDirs = [
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/pre-execution-validation-report.json`,
  `${reportDir}/pre-execution-validation-report.md`,
  `${reportDir}/dist-server-generation-report.json`,
  `${reportDir}/dist-remotion-worker-generation-report.json`,
  `${reportDir}/dist-staging-fixture-worker-generation-report.json`,
  `${reportDir}/dist-staging-real-video-export-worker-generation-report.json`,
  `${reportDir}/generated-artifact-scan-report.json`,
  `${reportDir}/generated-artifact-scan-report.md`,
  `${reportDir}/build-context-generation-manifest.json`,
  `${reportDir}/build-context-generation-manifest.md`,
  `${reportDir}/generated-artifact-cleanup-report.json`,
  `${reportDir}/package-dockerfile-integrity-report.json`,
  `${reportDir}/package-dockerfile-integrity-report.md`,
  `${reportDir}/side-effect-safety-report.json`,
  `${reportDir}/build-context-generation-execution-decision.json`,
  `${reportDir}/build-context-generation-execution-decision.md`,
  `${reportDir}/build-context-generation-execution-readiness-report.json`,
  `${reportDir}/build-context-generation-execution-private-artifact-manifest.json`,
  `${reportDir}/build-context-generation-execution-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-docker-build-ffmpeg-ffprobe-version-probe-execution-rerun.md',
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

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing_file:${file}`)
}

for (const dir of distDirs) {
  if (existsSync(dir)) failures.push(`generated_dist_directory_present:${dir}`)
  const status = git(['status', '--short', '--', dir])
  if (status) failures.push(`generated_dist_directory_staged_or_tracked:${dir}:${status}`)
}

for (const protectedPath of ['package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']) {
  const status = git(['status', '--short', '--', protectedPath])
  if (status) failures.push(`protected_path_changed:${protectedPath}:${status}`)
}

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

const forbiddenPatterns = [
  ['docker_build_claimed_run', /\bdockerBuildRun["']?\s*[:=]\s*true\b/i],
  ['docker_run_claimed_run', /\bdockerRunRun["']?\s*[:=]\s*true\b/i],
  ['ffmpeg_probe_claimed_run', /\bffmpegProbeRun["']?\s*[:=]\s*true\b/i],
  ['ffprobe_probe_claimed_run', /\bffprobeProbeRun["']?\s*[:=]\s*true\b/i],
  ['local_host_probe_claimed_run', /\blocalHostProbingRun["']?\s*[:=]\s*true\b/i],
  ['dockerfile_mutation_claimed_run', /\bdockerfileMutationRun["']?\s*[:=]\s*true\b/i],
  ['dockerignore_mutation_claimed_run', /\bdockerignoreMutationRun["']?\s*[:=]\s*true\b/i],
  ['container_mutation_claimed_run', /\bcontainerMutationRun["']?\s*[:=]\s*true\b/i],
  ['media_processing_claimed_run', /\bmediaProcessingRun["']?\s*[:=]\s*true\b/i],
  ['render_export_claimed_run', /\brenderExportRun["']?\s*[:=]\s*true\b/i],
  ['npm_install_claimed_run', /\bnpmInstallRun["']?\s*[:=]\s*true\b/i],
  ['npm_rebuild_claimed_run', /\bnpmRebuildRun["']?\s*[:=]\s*true\b/i],
  ['duckdb_proof_rerun_claimed', /\bduckdbProofRerun["']?\s*[:=]\s*true\b/i],
  ['polars_proof_rerun_claimed', /\bpolarsProofRerun["']?\s*[:=]\s*true\b/i],
  ['worker_execution_claimed', /\bworkerExecutionRun["']?\s*[:=]\s*true\b/i],
  ['route_execution_claimed', /\brouteExecutionRun["']?\s*[:=]\s*true\b/i],
  ['provider_calls_claimed', /\bproviderModelCallsRun["']?\s*[:=]\s*true\b/i],
  ['supabase_writes_claimed', /\bsupabaseWritesRun["']?\s*[:=]\s*true\b/i],
  ['sql_claimed', /\bsqlRun["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_claimed', /\bgcsUploadRun["']?\s*[:=]\s*true\b/i],
  ['public_artifacts_claimed', /\bpublicArtifactsCreated["']?\s*[:=]\s*true\b/i],
  ['signed_urls_claimed', /\bsignedUrlsCreated["']?\s*[:=]\s*true\b/i],
  ['beta_production_claimed', /\bbetaProductionUnlocked["']?\s*[:=]\s*true\b/i],
  ['raw_prompts_claimed', /\brawPromptsRun["']?\s*[:=]\s*true\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=|-----BEGIN [A-Z ]*PRIVATE KEY-----)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/build-context-generation-execution-decision.json`)
  ? readJson(`${reportDir}/build-context-generation-execution-decision.json`)
  : undefined
const scan = existsSync(`${reportDir}/generated-artifact-scan-report.json`)
  ? readJson(`${reportDir}/generated-artifact-scan-report.json`)
  : undefined
const cleanup = existsSync(`${reportDir}/generated-artifact-cleanup-report.json`)
  ? readJson(`${reportDir}/generated-artifact-cleanup-report.json`)
  : undefined
const integrity = existsSync(`${reportDir}/package-dockerfile-integrity-report.json`)
  ? readJson(`${reportDir}/package-dockerfile-integrity-report.json`)
  : undefined
const manifest = existsSync(`${reportDir}/build-context-generation-manifest.json`)
  ? readJson(`${reportDir}/build-context-generation-manifest.json`)
  : undefined
const safety = existsSync(`${reportDir}/side-effect-safety-report.json`)
  ? readJson(`${reportDir}/side-effect-safety-report.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== expectedNextPrompt) failures.push(`next_prompt:${decision.nextPrompt}`)
  if (decision.readyForDockerBuildProbeExecution !== true) failures.push('not_ready_for_docker_build_probe_execution')
  if (decision.generatedDistOutputsCommitted !== false) failures.push('generated_dist_outputs_committed_not_false')
  if (decision.cleanupPassed !== true) failures.push('cleanup_not_passed')
  if (decision.scanPassed !== true) failures.push('scan_not_passed')
  if (decision.packageDockerfileIntegrityPassed !== true) failures.push('integrity_not_passed')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
}

if (scan?.passed !== true) failures.push('scan_report_not_passed')
if (Array.isArray(scan?.forbiddenFindings) && scan.forbiddenFindings.length) failures.push('scan_has_forbidden_findings')
if (cleanup?.passed !== true) failures.push('cleanup_report_not_passed')
if (integrity?.passed !== true) failures.push('integrity_report_not_passed')
if (manifest?.allGenerated !== true) failures.push('manifest_all_generated_not_true')
if (manifest?.commitAllowed !== false) failures.push('manifest_commit_allowed_not_false')
if (safety?.dockerBuildRun !== false || safety?.ffmpegProbeRun !== false || safety?.ffprobeProbeRun !== false) {
  failures.push('side_effect_safety_probe_or_docker_not_false')
}

const generationReports = [
  'dist-server-generation-report.json',
  'dist-remotion-worker-generation-report.json',
  'dist-staging-fixture-worker-generation-report.json',
  'dist-staging-real-video-export-worker-generation-report.json',
].map((file) => readJson(`${reportDir}/${file}`))

for (const report of generationReports) {
  if (!report) continue
  if (report.run !== true) failures.push(`generation_not_run:${report.targetId}`)
  if (report.exactApprovedCommand !== true) failures.push(`generation_command_not_exact:${report.targetId}`)
  if (report.status !== 'passed') failures.push(`generation_not_passed:${report.targetId}:${report.status}`)
  if (report.directoryExists !== true) failures.push(`generation_directory_missing:${report.targetId}`)
  if (report.fileCount <= 0) failures.push(`generation_empty:${report.targetId}`)
}

try {
  const headPackage = JSON.parse(git(['show', 'HEAD:package.json']))
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
  console.error('Track A build-context generation execution diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      generatedDirectoriesRemoved: distDirs.every((dir) => !existsSync(dir)),
      generatedArtifactScanPassed: scan?.passed,
      cleanupPassed: cleanup?.passed,
      packageDockerfileIntegrityPassed: integrity?.passed,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
