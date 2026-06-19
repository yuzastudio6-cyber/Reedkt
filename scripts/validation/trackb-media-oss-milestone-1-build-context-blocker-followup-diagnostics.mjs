#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-build-context-blocker-followup'
const expectedSourceSha = 'cd4e5f0e234c4ff4bf3cefacba84a2f31530c3e8'
const imageTag = `reeditpro-cpu-worker:trackb-milestone1-${expectedSourceSha}`
const targetDockerfile = 'docker/prod/cpu-worker/Dockerfile'
const allowedDecisions = new Set([
  'trackb_media_oss_milestone1_build_context_followup_passed_all_four_tools_cpu_bounded',
  'trackb_media_oss_milestone1_build_context_followup_passed_with_mediainfo_fixture_deferred',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_dependency_hydration',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_build_context_generation',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_generated_artifact_scan',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_docker_build',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_exiftool_proof',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_mediainfo_proof',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_imagemagick_proof',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_artifact_cleanup',
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_safety_scan',
  'rejected_due_runtime_safety_risk',
])
const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'build-context-command-review.json',
  'build-context-command-review.md',
  'dependency-hydration-report.json',
  'dependency-hydration-report.md',
  'build-context-generation-report.json',
  'build-context-generation-report.md',
  'generated-artifact-scan-report.json',
  'generated-artifact-scan-report.md',
  'docker-build-report.json',
  'docker-build-report.md',
  'version-proof-report.json',
  'version-proof-report.md',
  'synthetic-fixture-proof-report.json',
  'synthetic-fixture-proof-report.md',
  'artifact-cleanup-report.json',
  'artifact-cleanup-report.md',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'milestone-1-followup-status-matrix.json',
  'milestone-1-followup-status-matrix.md',
  'milestone-1-build-context-followup-decision.json',
  'milestone-1-build-context-followup-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${reportDir}/${file}`)

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
function requireItems(actual, expected, label) {
  const set = new Set(actual || [])
  for (const item of expected) if (!set.has(item)) fail(`${label}_missing:${item}`)
}

for (const file of requiredFiles) readText(file)

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const commandReview = readJson(`${reportDir}/build-context-command-review.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const artifactScan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const versions = readJson(`${reportDir}/version-proof-report.json`)
const fixtures = readJson(`${reportDir}/synthetic-fixture-proof-report.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-1-followup-status-matrix.json`)
const decision = readJson(`${reportDir}/milestone-1-build-context-followup-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const packageJson = readJson('package.json')

if (!allowedDecisions.has(decision.decision)) fail(`unexpected_decision:${decision.decision}`)
for (const report of [
  sourceAudit,
  commandReview,
  hydration,
  generation,
  artifactScan,
  dockerBuild,
  versions,
  fixtures,
  cleanup,
  safety,
  matrix,
  readiness,
  manifest,
]) {
  if (report.decision !== decision.decision) fail(`decision_drift:${report.schema || 'unknown'}:${report.decision}`)
}

if (sourceAudit.expectedSourceSha !== expectedSourceSha) fail('expected_source_sha_drift')
if (sourceAudit.evidence?.find((entry) => entry.pr === 551)?.state !== 'MERGED') fail('missing_pr551_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 549)?.state !== 'MERGED') fail('missing_pr549_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 546)?.state !== 'MERGED') fail('missing_pr546_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 545)?.state !== 'MERGED') fail('missing_pr545_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 542)?.state !== 'MERGED') fail('missing_pr542_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 553)?.relationship !== 'track_a_atlas_different_base_out_of_track_b_scope') {
  fail('pr553_scope_not_recorded')
}

if (decision.targetDockerfile !== targetDockerfile || commandReview.targetDockerfile !== targetDockerfile) fail('target_dockerfile_drift')
requireItems(decision.buildContextOutputs, ['dist-server', 'dist-staging-fixture-worker'], 'decision_build_context')
requireItems(commandReview.requiredBuildContextOutputs, ['dist-server', 'dist-staging-fixture-worker'], 'review_build_context')
requireItems(commandReview.dockerfileCopyTargets, ['dist-server', 'dist-staging-fixture-worker'], 'dockerfile_copy_target')
requireItems(decision.approvedPackages, ['libimage-exiftool-perl', 'mediainfo', 'tesseract-ocr', 'tesseract-ocr-eng', 'imagemagick'], 'approved_packages')
requireItems(decision.targetTools, ['exiftool', 'mediainfo', 'tesseract', 'imagemagick'], 'target_tools')
if (commandReview.graphicsMagickDefaultIncluded !== false || decision.graphicsMagickRole !== 'optional_fallback_not_default') fail('graphicsmagick_default_drift')
if (dockerBuild.command !== `docker build -f ${targetDockerfile} -t ${imageTag} .`) fail('docker_build_command_drift')
if (decision.imageTag !== imageTag || dockerBuild.imageTag !== imageTag) fail('image_tag_drift')

if (hydration.command !== 'npm ci --ignore-scripts --no-audit --no-fund') fail('hydration_command_drift')
if (hydration.packageFilesUnchanged !== true) fail('package_files_mutated_by_hydration')
const generationCommands = new Map((generation.results || []).map((entry) => [entry.outputDir, entry.command]))
if (generationCommands.get('dist-server') !== 'npm run build:server') fail('dist_server_command_drift')
if (generationCommands.get('dist-staging-fixture-worker') !== 'npm run build:staging-fixture-worker') fail('dist_staging_fixture_worker_command_drift')
if ((artifactScan.forbiddenFindings || []).length) fail(`forbidden_generated_artifact_findings:${artifactScan.forbiddenFindings.length}`)
if (versions.localHostProbeRun !== false) fail('local_host_probe_not_false')
for (const report of versions.reports || []) {
  if (report.command && !report.command.startsWith('docker run --rm --network none --entrypoint ')) fail(`version_command_not_container_only:${report.id}`)
}
if (fixtures.syntheticFixturesOnly !== true || fixtures.realUserMediaUsed !== false) fail('fixture_policy_invalid')
if (fixtures.publicArtifactsCreated !== false || fixtures.signedUrlsCreated !== false) fail('fixture_public_scope_invalid')
if (cleanup.generatedOutputsCleaned !== true) fail('generated_outputs_not_cleaned')
if (manifest.generatedBuildContextOutputsCommitted !== false || manifest.fixtureOutputsCommitted !== false) fail('generated_artifacts_committed_flag_invalid')
if (manifest.localDockerImagePushed !== false || decision.dockerImagePushRun !== false) fail('docker_image_push_not_false')
if (decision.endToEndProductReadyTools !== 0 || decision.fortyPlusEndToEndClaimAllowed !== false) fail('tool_count_claim_policy_drift')

for (const flag of [
  'npmInstallRunOnHost',
  'npmRebuildRunOnHost',
  'packageLockMutationAllowed',
  'hostPackageInstallRun',
  'hostToolProofRun',
  'dockerImagePushRun',
  'ffmpegFfprobeRunInThisPhase',
  'forbiddenTrackBToolsRunInThisPhase',
  'graphicsMagickRunInThisPhase',
  'realUserMediaUsed',
  'mediaProcessingAccepted',
  'renderExportAccepted',
  'workerRuntimeAccepted',
  'routeProviderRuntimeAccepted',
  'supabaseGcsPublicDeliveryAccepted',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'rawPromptExecutionAccepted',
  'betaProductionAccepted',
]) {
  if (decision[flag] !== false) fail(`decision_flag_not_false:${flag}`)
}
if (decision.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_not_no_write')
if (decision.supabaseClassification?.environmentTouched !== 'none') fail('supabase_environment_not_none')
if (decision.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_not_none')
if (decision.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_not_no')

const tools = new Map((matrix.tools || []).map((entry) => [entry.id, entry]))
for (const id of ['exiftool', 'mediainfo', 'tesseract', 'imagemagick']) if (!tools.has(id)) fail(`matrix_tool_missing:${id}`)
if (decision.decision === 'trackb_media_oss_milestone1_build_context_followup_passed_all_four_tools_cpu_bounded') {
  if (dockerBuild.exitCode !== 0) fail('pass_without_docker_build')
  for (const id of ['exiftool', 'mediainfo', 'tesseract', 'imagemagick']) {
    const row = tools.get(id)
    if (row.container_version_proven !== true || row.synthetic_fixture_proven !== true || row.accepted_proven !== true) {
      fail(`pass_without_complete_tool_proof:${id}`)
    }
  }
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-qa-review.md'))) {
    fail('missing_qa_next_prompt')
  }
}
if (decision.decision === 'trackb_media_oss_milestone1_build_context_followup_passed_with_mediainfo_fixture_deferred') {
  if (tools.get('mediainfo')?.container_version_proven !== true) fail('mediainfo_deferred_without_version')
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-mediainfo-fixture-followup.md'))) {
    fail('missing_mediainfo_next_prompt')
  }
}
if (!decision.decision.includes('_passed_') && decision.decision !== 'rejected_due_runtime_safety_risk') {
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-build-context-followup-blocker-review.md'))) {
    fail('missing_blocker_next_prompt')
  }
}

if (
  packageJson.scripts?.['trackb-media-oss:milestone-1-build-context-blocker-followup:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-1-build-context-blocker-followup-diagnostics.mjs'
) {
  fail('missing_package_diagnostics_script')
}

const protectedDiff = git(['diff', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile'])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile'])
if (protectedDiff || protectedCachedDiff) fail('protected_file_mutation')
for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}
for (const broadDoc of ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md']) {
  if (fs.existsSync(path.join(repoRoot, broadDoc))) fail(`broad_doc_created:${broadDoc}`)
}

const changedFiles = git(['diff', '--name-only']).split('\n').filter(Boolean)
const cachedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const scanFiles = [...new Set([...requiredFiles, ...changedFiles, ...cachedFiles])].filter((file) => {
  return fs.existsSync(path.join(repoRoot, file)) && fs.statSync(path.join(repoRoot, file)).isFile()
})
const forbiddenPatterns = [
  /\b40\+\s+tools\s+(?:are\s+)?(?:installed|proven).{0,80}end-to-end/i,
  /\bend-to-end product-ready (?:Track B )?tools:\s*[1-9]/i,
  /\b(ffmpeg|ffprobe|opencv|pyav|pyscenedetect|paddleocr|paddlepaddle|opencolorio|openimageio)\s+(?:version|fixture|proof|execution).{0,50}(?:passed|ran|accepted|proven)\b/i,
  /\b(media processing|render\/export|worker runtime|provider runtime|route runtime|Supabase|GCS|public artifact|signed URL|raw prompt|beta|production)\s+(?:is\s+)?(?:approved|enabled|accepted|unblocked)\b/i,
  /\b(sk-proj-|sk-live-|ghp_|postgres:\/\/|BEGIN [A-Z ]*PRIVATE KEY|X-Amz-Signature=)\b/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const line of text.split(/\r?\n/)) {
    const negative = /\b(no|not|do not|does not|did not|must not|remain blocked|blocked|false|without|future|separate|optional fallback|not installed|not created|not selected|no write|out of Track B scope|skipped)\b/i.test(line)
    for (const pattern of forbiddenPatterns) {
      if (!negative && pattern.test(line)) fail(`forbidden_claim:${file}:${line.trim()}`)
    }
  }
}

if (failures.length) {
  console.error('Track B Milestone 1 build-context blocker follow-up diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: decision.decision,
  imageTag,
  nextPrompt: decision.nextPrompt,
  supabaseClassification: decision.supabaseClassification,
}, null, 2))
