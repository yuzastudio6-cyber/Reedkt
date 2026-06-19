#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-tesseract-fixture-proof-followup'
const expectedSourceSha = '89f920212dfd35f3dece781473df36665073f4b2'
const imageTag = `reeditpro-cpu-worker:trackb-milestone1-tesseract-followup-${expectedSourceSha}`
const targetDockerfile = 'docker/prod/cpu-worker/Dockerfile'
const passDecision = 'trackb_media_oss_milestone1_tesseract_fixture_followup_passed_ready_for_qa'
const allowedDecisions = new Set([
  passDecision,
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_dependency_hydration',
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_build_context_generation',
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_generated_artifact_scan',
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_docker_build',
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_imagemagick_fixture_generation',
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_tesseract_ocr_output',
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_artifact_cleanup',
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_safety_scan',
  'rejected_due_runtime_safety_risk',
])
const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'build-context-and-image-policy.json',
  'build-context-and-image-policy.md',
  'dependency-hydration-report.json',
  'dependency-hydration-report.md',
  'build-context-generation-report.json',
  'build-context-generation-report.md',
  'generated-artifact-scan-report.json',
  'generated-artifact-scan-report.md',
  'docker-build-report.json',
  'docker-build-report.md',
  'version-sanity-report.json',
  'version-sanity-report.md',
  'tesseract-fixture-proof-report.json',
  'tesseract-fixture-proof-report.md',
  'artifact-cleanup-report.json',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'tesseract-followup-status-matrix.json',
  'tesseract-followup-status-matrix.md',
  'tesseract-fixture-followup-decision.json',
  'tesseract-fixture-followup-decision.md',
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
const imagePolicy = readJson(`${reportDir}/build-context-and-image-policy.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const artifactScan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const versions = readJson(`${reportDir}/version-sanity-report.json`)
const fixtures = readJson(`${reportDir}/tesseract-fixture-proof-report.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/tesseract-followup-status-matrix.json`)
const decision = readJson(`${reportDir}/tesseract-fixture-followup-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const packageJson = readJson('package.json')

if (!allowedDecisions.has(decision.decision)) fail(`unexpected_decision:${decision.decision}`)
for (const report of [
  sourceAudit,
  imagePolicy,
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
if (sourceAudit.evidence?.find((entry) => entry.pr === 557)?.state !== 'MERGED') fail('missing_pr557_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 557)?.blocker !== 'tesseract_fixture_output_REEDLTPRU_expected_REEDITPRO') {
  fail('missing_pr557_tesseract_blocker_evidence')
}
for (const pr of [551, 549, 546, 545, 542]) {
  if (sourceAudit.evidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') fail(`missing_pr${pr}_merged_evidence`)
}
if (decision.targetDockerfile !== targetDockerfile || imagePolicy.dockerBuildCommand !== `docker build -f ${targetDockerfile} -t ${imageTag} .`) {
  fail('docker_target_or_command_drift')
}
if (decision.imageTag !== imageTag || dockerBuild.imageTag !== imageTag) fail('image_tag_drift')
requireItems(decision.expectedNormalizedOutput ? [decision.expectedNormalizedOutput] : [], ['REEDITPRO'], 'expected_output')
requireItems(imagePolicy.containerProofsAllowed, ['tesseract', 'imagemagick'], 'allowed_container_proofs')
requireItems(imagePolicy.containerProofsNotRerun, ['exiftool', 'mediainfo'], 'not_rerun_container_proofs')
if (hydration.command !== 'npm ci --ignore-scripts --no-audit --no-fund') fail('hydration_command_drift')
if (hydration.packageFilesUnchanged !== true) fail('package_files_mutated_by_hydration')
const generationCommands = new Map((generation.results || []).map((entry) => [entry.outputDir, entry.command]))
if (generationCommands.get('dist-server') !== 'npm run build:server') fail('dist_server_command_drift')
if (generationCommands.get('dist-staging-fixture-worker') !== 'npm run build:staging-fixture-worker') fail('dist_staging_fixture_worker_command_drift')
if ((artifactScan.forbiddenFindings || []).length) fail(`forbidden_generated_artifact_findings:${artifactScan.forbiddenFindings.length}`)
if (versions.localHostProbeRun !== false) fail('local_host_probe_not_false')
for (const report of versions.reports || []) {
  if (!['tesseract', 'imagemagick'].includes(report.id)) fail(`unexpected_version_rerun:${report.id}`)
  if (report.command && !report.command.startsWith('docker run --rm --network none --entrypoint ')) fail(`version_command_not_container_only:${report.id}`)
}
if (fixtures.syntheticFixturesOnly !== true || fixtures.realUserMediaUsed !== false) fail('fixture_policy_invalid')
if (fixtures.publicArtifactsCreated !== false || fixtures.signedUrlsCreated !== false) fail('fixture_public_scope_invalid')
if ((fixtures.variants || []).length > 3) fail('too_many_fixture_variants')
for (const variant of fixtures.variants || []) {
  if (variant.normalizedOutput === 'REEDLTPRU' && variant.exactMatch === true) fail('accepted_prior_bad_output')
  if (variant.exactMatch === true && variant.normalizedOutput !== 'REEDITPRO') fail(`non_exact_ocr_accepted:${variant.normalizedOutput}`)
  if (variant.setupCommand && !variant.setupCommand.includes('--network none')) fail(`imagemagick_setup_not_network_none:${variant.id}`)
  if (variant.tesseractCommand && !variant.tesseractCommand.includes('--network none')) fail(`tesseract_not_network_none:${variant.id}`)
}
if (decision.decision === passDecision && fixtures.tesseractFixtureProven !== true) fail('pass_without_tesseract_fixture')
if (decision.decision === passDecision && decision.acceptedVariant === null) fail('pass_without_accepted_variant')
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
  'exifToolRerunInThisPhase',
  'mediaInfoRerunInThisPhase',
  'graphicsMagickRunInThisPhase',
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
if (decision.containerOnlyTesseractProof !== true) fail('container_only_tesseract_not_true')
if (decision.containerOnlyImageMagickFixtureGeneration !== true) fail('container_only_imagemagick_not_true')
if (decision.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_not_no_write')
if (decision.supabaseClassification?.environmentTouched !== 'none') fail('supabase_environment_not_none')
if (decision.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_not_none')
if (decision.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_not_no')

const tools = new Map((matrix.tools || []).map((entry) => [entry.id, entry]))
for (const id of ['exiftool', 'mediainfo', 'tesseract', 'imagemagick']) if (!tools.has(id)) fail(`matrix_tool_missing:${id}`)
if (tools.get('exiftool')?.rerunInThisPhase !== false) fail('exiftool_rerun_not_false')
if (tools.get('mediainfo')?.rerunInThisPhase !== false) fail('mediainfo_rerun_not_false')
if (decision.decision === passDecision && !fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-qa-review.md'))) {
  fail('missing_qa_next_prompt')
}
if (decision.decision !== passDecision && !fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-tesseract-fixture-followup-blocker-resolution.md'))) {
  fail('missing_blocker_next_prompt')
}

if (
  packageJson.scripts?.['trackb-media-oss:milestone-1-tesseract-fixture-proof-followup:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-1-tesseract-fixture-proof-followup-diagnostics.mjs'
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
  /\b(ffmpeg|ffprobe|graphicsmagick|opencv|pyav|pyscenedetect|paddleocr|paddlepaddle|opencolorio|openimageio)\s+(?:version|fixture|proof|execution).{0,50}(?:passed|ran|accepted|proven)\b/i,
  /\b(exiftool|mediainfo)\s+(?:version|fixture|proof).{0,50}(?:reran|re-run|ran in this phase)\b/i,
  /\b(media processing|render\/export|worker runtime|provider runtime|route runtime|Supabase|GCS|public artifact|signed URL|raw prompt|beta|production)\s+(?:is\s+)?(?:approved|enabled|accepted|unblocked)\b/i,
  /\b(sk-proj-|sk-live-|ghp_|postgres:\/\/|BEGIN [A-Z ]*PRIVATE KEY|X-Amz-Signature=)\b/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const line of text.split(/\r?\n/)) {
    const negative = /\b(no|not|do not|does not|did not|must not|remain blocked|blocked|false|without|future|separate|optional fallback|not installed|not created|not selected|no write|skipped|accepted from PR #557|not rerun)\b/i.test(line)
    for (const pattern of forbiddenPatterns) {
      if (!negative && pattern.test(line)) fail(`forbidden_claim:${file}:${line.trim()}`)
    }
  }
}

if (failures.length) {
  console.error('Track B Milestone 1 Tesseract fixture proof follow-up diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: decision.decision,
  imageTag,
  acceptedVariant: decision.acceptedVariant,
  nextPrompt: decision.nextPrompt,
  supabaseClassification: decision.supabaseClassification,
}, null, 2))
