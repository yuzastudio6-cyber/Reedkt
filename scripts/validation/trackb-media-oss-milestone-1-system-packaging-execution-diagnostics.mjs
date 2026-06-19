#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-system-packaging-execution'
const targetDockerfile = 'docker/prod/cpu-worker/Dockerfile'
const approvedPackages = [
  'libimage-exiftool-perl',
  'mediainfo',
  'tesseract-ocr',
  'tesseract-ocr-eng',
  'imagemagick',
]
const expectedTools = ['exiftool', 'mediainfo', 'tesseract', 'imagemagick']
const allowedDecisions = new Set([
  'trackb_media_oss_milestone1_system_packaging_execution_passed_all_four_tools_cpu_bounded',
  'trackb_media_oss_milestone1_system_packaging_execution_passed_with_mediainfo_fixture_deferred',
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_runtime_availability',
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context',
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build',
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_exiftool_container_proof',
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_mediainfo_container_proof',
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_tesseract_container_proof',
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_imagemagick_container_proof',
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_artifact_safety_review',
  'rejected_due_runtime_safety_risk',
])
const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'dockerfile-patch-report.json',
  'dockerfile-patch-report.md',
  'docker-build-report.json',
  'docker-build-report.md',
  'version-proof-report.json',
  'version-proof-report.md',
  'synthetic-fixture-proof-report.json',
  'synthetic-fixture-proof-report.md',
  'artifact-cleanup-report.json',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'milestone-1-packaging-status-matrix.json',
  'milestone-1-packaging-status-matrix.md',
  'milestone-1-system-packaging-execution-decision.json',
  'milestone-1-system-packaging-execution-decision.md',
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
const patchReport = readJson(`${reportDir}/dockerfile-patch-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const versionProof = readJson(`${reportDir}/version-proof-report.json`)
const fixtureProof = readJson(`${reportDir}/synthetic-fixture-proof-report.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-1-packaging-status-matrix.json`)
const decision = readJson(`${reportDir}/milestone-1-system-packaging-execution-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const packageJson = readJson('package.json')

if (!allowedDecisions.has(decision.decision)) fail(`unexpected_decision:${decision.decision}`)
for (const report of [sourceAudit, patchReport, dockerBuild, versionProof, fixtureProof, cleanup, safety, matrix, readiness, manifest]) {
  if (report.decision !== decision.decision) fail(`decision_drift:${report.schema || 'unknown'}:${report.decision}`)
}
if (sourceAudit.evidence?.find((entry) => entry.pr === 549)?.state !== 'MERGED') fail('missing_pr549_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 546)?.state !== 'MERGED') fail('missing_pr546_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 545)?.state !== 'MERGED') fail('missing_pr545_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 542)?.state !== 'MERGED') fail('missing_pr542_merged_evidence')
if (sourceAudit.approvedTarget !== targetDockerfile || decision.targetDockerfile !== targetDockerfile) fail('target_dockerfile_drift')
requireItems(sourceAudit.approvedPackages, approvedPackages, 'source_packages')
requireItems(decision.approvedPackages, approvedPackages, 'decision_packages')
requireItems(decision.targetTools, expectedTools, 'decision_tools')
if (patchReport.allApprovedPackagesPresent !== true) fail('approved_packages_missing_from_dockerfile')
if (patchReport.graphicsMagickAdded !== false) fail('graphicsmagick_added_by_default')
if (decision.graphicsMagickRole !== 'optional_fallback_not_default') fail('graphicsmagick_role_drift')

const dockerfile = readText(targetDockerfile)
for (const pkg of approvedPackages) if (!new RegExp(`\\b${pkg}\\b`).test(dockerfile)) fail(`dockerfile_package_missing:${pkg}`)
if (/\bgraphicsmagick\b/.test(dockerfile)) fail('dockerfile_graphicsmagick_present')

if (!dockerBuild.command?.startsWith('docker build -f docker/prod/cpu-worker/Dockerfile -t reeditpro-cpu-worker:trackb-milestone1-')) {
  fail('docker_build_command_mismatch')
}
if (dockerBuild.dockerImagePushRun !== false || manifest.dockerImagePushed !== false) fail('docker_image_push_not_false')
if (versionProof.localHostProbeRun !== false) fail('local_host_probe_not_false')
if (fixtureProof.syntheticFixturesOnly !== true || fixtureProof.realUserMediaUsed !== false) fail('fixture_policy_invalid')
if (fixtureProof.publicArtifactsCreated !== false || fixtureProof.signedUrlsCreated !== false) fail('fixture_public_artifact_scope_invalid')
if (cleanup.tempProofDirCleaned !== true || manifest.fixtureOutputsCommitted !== false || manifest.fixtureOutputsCleaned !== true) {
  fail('fixture_cleanup_invalid')
}
if (safety.passed !== true) fail('safety_scan_not_passed')
if ((safety.forbiddenOutputsPresent || []).length) fail(`forbidden_outputs_present:${safety.forbiddenOutputsPresent.join(',')}`)
if ((safety.changedProtectedFiles || []).length) fail(`protected_no_diff_file_changed:${safety.changedProtectedFiles.join(',')}`)
if (decision.endToEndProductReadyTools !== 0) fail('product_ready_tools_claimed')
if (decision.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')
for (const flag of [
  'hostPackageInstallRun',
  'npmCiRunOnHost',
  'npmInstallRunOnHost',
  'npmRebuildRunOnHost',
  'packageLockMutationAllowed',
  'dockerImagePushRun',
  'ffmpegFfprobeRunInThisPhase',
  'forbiddenTrackBToolsRunInThisPhase',
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

if (decision.decision === 'trackb_media_oss_milestone1_system_packaging_execution_passed_all_four_tools_cpu_bounded') {
  if (dockerBuild.exitCode !== 0) fail('pass_without_docker_build')
  for (const row of matrix.tools || []) {
    if (row.container_version_proven !== true || row.synthetic_fixture_proven !== true) fail(`pass_without_complete_tool_proof:${row.id}`)
  }
}
if (decision.decision === 'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context') {
  if (!Array.isArray(dockerBuild.missingBuildContext) || dockerBuild.missingBuildContext.length === 0) {
    fail('build_context_block_without_missing_context')
  }
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-system-packaging-build-context-blocker-followup.md'))) {
    fail('missing_build_context_followup_prompt')
  }
}

if (
  packageJson.scripts?.['trackb-media-oss:milestone-1-system-packaging-execution:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-1-system-packaging-execution-diagnostics.mjs'
) {
  fail('missing_package_diagnostics_script')
}

const protectedDiff = git(['diff', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile'])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile'])
if (protectedDiff || protectedCachedDiff) fail('protected_no_diff_mutation')
for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}

const scanFiles = [
  ...requiredFiles,
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]
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
    const negative = /\b(no|not|do not|does not|did not|must not|remain blocked|blocked|false|without|future|separate|optional fallback|not installed|not created|not selected|no write)\b/i.test(line)
    for (const pattern of forbiddenPatterns) {
      if (!negative && pattern.test(line)) fail(`forbidden_claim:${file}:${line.trim()}`)
    }
  }
}
for (const broadDoc of ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md']) {
  if (fs.existsSync(path.join(repoRoot, broadDoc))) fail(`broad_doc_created:${broadDoc}`)
}

if (failures.length) {
  console.error('Track B Milestone 1 system packaging execution diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: decision.decision,
  targetDockerfile,
  approvedPackages,
  imageTag: decision.imageTag,
  nextPrompt: decision.nextPrompt,
  supabaseClassification: decision.supabaseClassification,
}, null, 2))
