import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa'
const rerunReportDir = 'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun'
const sourceSha = 'a0ad97abce12f7b8265feeaefa30390a41de03e4'
const rerunSourceSha = '9225347e636a50aa0ef241badbf51f9a3947b1f8'
const imageTag = `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-${rerunSourceSha}`
const expectedBuildCommand = `docker build -f docker/prod/render-worker/Dockerfile -t ${imageTag} .`
const expectedFfmpegCommand = `docker run --rm --network none --entrypoint ffmpeg ${imageTag} -version`
const expectedFfprobeCommand = `docker run --rm --network none --entrypoint ffprobe ${imageTag} -version`
const expectedDecision =
  'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_qa_passed_media_processing_still_blocked_ready_for_batch1_rollup'
const expectedNextPrompt = 'OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_AFTER_FFMPEG_FFPROBE_PROOF'

const requiredFiles = [
  'source-of-truth-audit.json',
  'evidence-revalidation-report.json',
  'evidence-revalidation-report.md',
  'docker-build-qa.json',
  'docker-build-qa.md',
  'ffmpeg-version-qa.json',
  'ffmpeg-version-qa.md',
  'ffprobe-version-qa.json',
  'ffprobe-version-qa.md',
  'generated-artifact-cleanup-qa.json',
  'generated-artifact-cleanup-qa.md',
  'media-render-blocked-scope-qa.json',
  'media-render-blocked-scope-qa.md',
  'central-open-source-status-update.json',
  'central-open-source-status-update.md',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-decision.json',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-decision.md',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-readiness-report.json',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-private-artifact-manifest.json',
  'tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-validation-results.md',
].map((file) => `${reportDir}/${file}`)

const requiredSourceEvidence = [
  `${rerunReportDir}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.json`,
  `${rerunReportDir}/docker-build-report.json`,
  `${rerunReportDir}/ffmpeg-container-version-probe-report.json`,
  `${rerunReportDir}/ffprobe-container-version-probe-report.json`,
  `${rerunReportDir}/generated-artifact-scan-report.json`,
  `${rerunReportDir}/generated-output-cleanup-report.json`,
  'docs/open-source-tool-stack/tracka-build-context-generation-execution/build-context-generation-execution-decision.json',
  'docs/open-source-tool-stack/tracka-build-context-generation-approval/build-context-generation-approval-decision.json',
  'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-probe-command-blocker-resolution-decision.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
  'docs/implementation-prompts/prompt-open-source-tool-stack-batch-1-final-rollup-after-ffmpeg-ffprobe-proof.md',
]

const failures = []
for (const file of [...requiredFiles, ...requiredSourceEvidence]) {
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

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function gitStatus(path) {
  return git(['status', '--short', '--', path])
}

function packageJsonAt(ref) {
  try {
    return JSON.parse(git(['show', `${ref}:package.json`]))
  } catch {
    return null
  }
}

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const evidence = readJson(`${reportDir}/evidence-revalidation-report.json`)
const dockerQa = readJson(`${reportDir}/docker-build-qa.json`)
const ffmpegQa = readJson(`${reportDir}/ffmpeg-version-qa.json`)
const ffprobeQa = readJson(`${reportDir}/ffprobe-version-qa.json`)
const cleanupQa = readJson(`${reportDir}/generated-artifact-cleanup-qa.json`)
const mediaScopeQa = readJson(`${reportDir}/media-render-blocked-scope-qa.json`)
const statusUpdate = readJson(`${reportDir}/central-open-source-status-update.json`)
const decision = readJson(`${reportDir}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-decision.json`)
const readiness = readJson(`${reportDir}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-readiness-report.json`)
const privateManifest = readJson(
  `${reportDir}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-private-artifact-manifest.json`,
)
const rerunDecision = readJson(`${rerunReportDir}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.json`)
const rerunFfmpeg = readJson(`${rerunReportDir}/ffmpeg-container-version-probe-report.json`)
const rerunFfprobe = readJson(`${rerunReportDir}/ffprobe-container-version-probe-report.json`)

if (decision.schema !== 'reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.decision.v1') {
  failures.push(`decision_schema:${decision.schema}`)
}
if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
if (decision.nextPrompt !== expectedNextPrompt) failures.push(`next_prompt:${decision.nextPrompt}`)
if (readiness.readiness !== true) failures.push('readiness_not_true')
if (sourceAudit.expectedSourceSha !== sourceSha) failures.push(`source_sha:${sourceAudit.expectedSourceSha}`)
if (sourceAudit.promptScriptNameMismatchAuditFact?.treatedAsBlocker !== false) failures.push('script_name_mismatch_not_audit_fact')
if (evidence.passed !== true) failures.push('evidence_revalidation_not_passed')

for (const [name, report] of [
  ['docker_build_qa', dockerQa],
  ['ffmpeg_version_qa', ffmpegQa],
  ['ffprobe_version_qa', ffprobeQa],
  ['cleanup_qa', cleanupQa],
  ['media_scope_qa', mediaScopeQa],
  ['status_update', statusUpdate],
]) {
  if (report.accepted !== true) failures.push(`${name}_not_accepted`)
}

if (dockerQa.details?.expectedDockerBuildCommand !== expectedBuildCommand) failures.push('docker_build_expected_command_mismatch')
if (dockerQa.details?.actualDockerBuildCommand !== expectedBuildCommand) failures.push('docker_build_actual_command_mismatch')
if (ffmpegQa.details?.expectedCommand !== expectedFfmpegCommand) failures.push('ffmpeg_expected_command_mismatch')
if (ffmpegQa.details?.actualCommand !== expectedFfmpegCommand) failures.push('ffmpeg_actual_command_mismatch')
if (ffprobeQa.details?.expectedCommand !== expectedFfprobeCommand) failures.push('ffprobe_expected_command_mismatch')
if (ffprobeQa.details?.actualCommand !== expectedFfprobeCommand) failures.push('ffprobe_actual_command_mismatch')
if (ffmpegQa.details?.version !== '5.1.9-0+deb12u1') failures.push(`ffmpeg_version:${ffmpegQa.details?.version}`)
if (ffprobeQa.details?.version !== '5.1.9-0+deb12u1') failures.push(`ffprobe_version:${ffprobeQa.details?.version}`)
if (ffmpegQa.details?.containerOnlyProbe !== true || ffprobeQa.details?.containerOnlyProbe !== true) {
  failures.push('container_only_probe_not_true')
}
if (ffmpegQa.details?.localHostProbing !== false || ffprobeQa.details?.localHostProbing !== false) {
  failures.push('local_host_probing_not_false')
}
if (ffmpegQa.details?.mediaInput !== false || ffprobeQa.details?.mediaInput !== false) failures.push('media_input_not_false')
if (ffmpegQa.details?.outputMedia !== false || ffprobeQa.details?.outputMedia !== false) failures.push('output_media_not_false')

if (statusUpdate.details?.ffmpeg !== 'version_proven_for_tracka_container_path_only') failures.push('ffmpeg_status_not_container_only')
if (statusUpdate.details?.ffprobe !== 'version_proven_for_tracka_container_path_only') failures.push('ffprobe_status_not_container_only')
if (statusUpdate.details?.mediaProcessingAccepted !== false) failures.push('media_processing_status_not_false')
if (statusUpdate.details?.captionBurnInAccepted !== false) failures.push('caption_burn_in_status_not_false')
if (statusUpdate.details?.renderExportAccepted !== false) failures.push('render_export_status_not_false')

if (rerunDecision.decision !== 'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_rerun_passed_media_processing_still_blocked') {
  failures.push(`rerun_decision:${rerunDecision.decision}`)
}
if (!Array.isArray(rerunFfmpeg.versionSummary) || !rerunFfmpeg.versionSummary[0]?.includes('5.1.9-0+deb12u1')) {
  failures.push('rerun_ffmpeg_version_missing')
}
if (!Array.isArray(rerunFfprobe.versionSummary) || !rerunFfprobe.versionSummary[0]?.includes('5.1.9-0+deb12u1')) {
  failures.push('rerun_ffprobe_version_missing')
}

const falseDecisionFields = [
  'mediaProcessingAccepted',
  'captionBurnInAccepted',
  'renderExportAccepted',
  'dockerBuildRunInThisPhase',
  'dockerRunRunInThisPhase',
  'ffmpegProbeRunInThisPhase',
  'ffprobeProbeRunInThisPhase',
  'buildContextGenerationRunInThisPhase',
  'npmInstallRunInThisPhase',
  'npmRebuildRunInThisPhase',
  'workerExecutionRunInThisPhase',
  'routeExecutionRunInThisPhase',
  'providerCallsRunInThisPhase',
  'supabaseWritesRunInThisPhase',
  'gcsUploadRunInThisPhase',
  'publicArtifactsCreatedInThisPhase',
  'signedUrlsCreatedInThisPhase',
  'betaProductionUnlockedInThisPhase',
  'rawPromptsRunInThisPhase',
  'secretsPrintedInThisPhase',
]
for (const field of falseDecisionFields) {
  if (decision[field] !== false) failures.push(`decision_${field}_not_false`)
}

for (const field of [
  'dockerBuildRunInThisPhase',
  'dockerRunRunInThisPhase',
  'ffmpegProbeRunInThisPhase',
  'ffprobeProbeRunInThisPhase',
  'generatedDistOutputsCreatedInThisPhase',
  'mediaArtifactsCreated',
  'privatePayloadsAccessed',
  'secretsAccessed',
  'secretsPrinted',
  'secretsCommitted',
  'publicArtifactsCreated',
  'signedUrlsCreated',
]) {
  if (privateManifest[field] !== false) failures.push(`private_manifest_${field}_not_false`)
}
if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('decision_supabase_not_no_write')
if (privateManifest.supabaseClassification?.environmentTouched !== 'none') failures.push('manifest_supabase_environment_not_none')

for (const directory of [
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
  'node_modules',
]) {
  if (existsSync(directory)) failures.push(`forbidden_local_output_present:${directory}`)
  const status = gitStatus(directory)
  if (status) failures.push(`forbidden_output_staged_or_tracked:${directory}:${status}`)
}

for (const path of ['package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']) {
  const status = gitStatus(path)
  if (status) failures.push(`protected_file_changed:${path}:${status}`)
}

const basePackageJson = packageJsonAt('origin/codex/rp-github-merge-hygiene-open-pr-stack-audit')
const localPackageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (basePackageJson) {
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(localPackageJson[key] ?? {}) !== JSON.stringify(basePackageJson[key] ?? {})) {
      failures.push(`package_dependency_section_changed:${key}`)
    }
  }
}
if (localPackageJson.dependencies?.ffmpeg || localPackageJson.dependencies?.ffprobe) failures.push('ffmpeg_dependency_added')

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
const forbiddenPatterns = [
  ['secret_material', /\b(AKIA[0-9A-Z]{16}|sk-(?:proj|live|test)-[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
  ['media_processing_accepted_true', /\bmediaProcessingAccepted["']?\s*[:=]\s*true\b/i],
  ['caption_burn_in_accepted_true', /\bcaptionBurnInAccepted["']?\s*[:=]\s*true\b/i],
  ['render_export_accepted_true', /\brenderExportAccepted["']?\s*[:=]\s*true\b/i],
  ['docker_run_this_phase_true', /\bdockerRunRunInThisPhase["']?\s*[:=]\s*true\b/i],
  ['ffmpeg_probe_this_phase_true', /\bffmpegProbeRunInThisPhase["']?\s*[:=]\s*true\b/i],
  ['ffprobe_probe_this_phase_true', /\bffprobeProbeRunInThisPhase["']?\s*[:=]\s*true\b/i],
  ['public_artifacts_true', /\bpublicArtifactsCreated(?:InThisPhase)?["']?\s*[:=]\s*true\b/i],
  ['signed_urls_true', /\bsignedUrlsCreated(?:InThisPhase)?["']?\s*[:=]\s*true\b/i],
  ['supabase_write_true', /\bsupabaseWrites(?:Run|Attempted|RunInThisPhase)?["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_true', /\bgcsUpload(?:Run|Attempted|RunInThisPhase)?["']?\s*[:=]\s*true\b/i],
  ['raw_prompts_true', /\brawPrompts(?:Run|Executed|RunInThisPhase)?["']?\s*[:=]\s*true\b/i],
]
for (const [name, pattern] of forbiddenPatterns) {
  if (pattern.test(docsText)) failures.push(`forbidden_pattern:${name}`)
}

if (failures.length) {
  console.error('Track A container Docker build FFmpeg/FFprobe version-probe QA diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision.decision,
      sourceSha,
      ffmpeg: statusUpdate.details?.ffmpeg,
      ffprobe: statusUpdate.details?.ffprobe,
      mediaProcessingAccepted: statusUpdate.details?.mediaProcessingAccepted,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
