#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const targetDockerfile = 'docker/prod/ocr-runtime/Dockerfile'
const targetRequirements = 'docker/prod/ocr-runtime/requirements.ocr.txt'
const expectedSourceSha = 'b17a20898d5c046447905e5a411a733133afa535'
const imageTag = `reeditpro-ocr-runtime:trackb-milestone3-cpu-libgomp-${expectedSourceSha}`
const passDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_passed_import_api_shape_no_model_assets'
const modelAssetDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_passed_ready_for_model_asset_approval'
const modelAssetRequiredDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_model_asset_required'
const allowedDecisions = new Set([
  passDecision,
  modelAssetDecision,
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_source_target_drift',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_package_strategy_review',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_dockerfile_patch',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_dependency_hydration',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_build_context_generation',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_generated_artifact_scan',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_docker_build',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_paddlepaddle_import_or_api_shape',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_paddleocr_import_or_api_shape',
  modelAssetRequiredDecision,
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_artifact_cleanup',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_safety_scan',
  'rejected_due_runtime_safety_risk',
])
const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'libgomp-root-cause-review.json',
  'libgomp-root-cause-review.md',
  'source-target-check.json',
  'source-target-check.md',
  'dockerfile-patch-report.json',
  'dockerfile-patch-report.md',
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
  'libgomp-presence-report.json',
  'libgomp-presence-report.md',
  'paddlepaddle-proof-report.json',
  'paddlepaddle-proof-report.md',
  'paddleocr-api-proof-report.json',
  'paddleocr-api-proof-report.md',
  'model-ocr-gpu-boundary-verification.json',
  'model-ocr-gpu-boundary-verification.md',
  'cpu-latency-memory-cost-report.json',
  'cpu-latency-memory-cost-report.md',
  'artifact-cleanup-report.json',
  'artifact-cleanup-report.md',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'milestone-3-cpu-blocker-followup-status-matrix.json',
  'milestone-3-cpu-blocker-followup-status-matrix.md',
  'milestone-3-ocr-ml-cpu-blocker-followup-decision.json',
  'milestone-3-ocr-ml-cpu-blocker-followup-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.json',
  'validation-results.md',
].map((file) => `${reportDir}/${file}`)
const statusFiles = [
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

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
function ensureFalse(report, keys) {
  for (const key of keys) if (report[key] !== false) fail(`${key}_not_false`)
}
function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}

for (const file of [...requiredFiles, ...statusFiles]) readText(file)

const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const rootCause = readJson(`${reportDir}/libgomp-root-cause-review.json`)
const target = readJson(`${reportDir}/source-target-check.json`)
const patch = readJson(`${reportDir}/dockerfile-patch-report.json`)
const buildContext = readJson(`${reportDir}/build-context-command-review.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const scan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const libgomp = readJson(`${reportDir}/libgomp-presence-report.json`)
const paddlePaddle = readJson(`${reportDir}/paddlepaddle-proof-report.json`)
const paddleOcr = readJson(`${reportDir}/paddleocr-api-proof-report.json`)
const boundary = readJson(`${reportDir}/model-ocr-gpu-boundary-verification.json`)
const latency = readJson(`${reportDir}/cpu-latency-memory-cost-report.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-3-cpu-blocker-followup-status-matrix.json`)
const decision = readJson(`${reportDir}/milestone-3-ocr-ml-cpu-blocker-followup-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const validation = readJson(`${reportDir}/validation-results.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const packageJson = readJson('package.json')
const dockerfile = readText(targetDockerfile)

for (const [label, report] of Object.entries({
  source,
  rootCause,
  target,
  patch,
  buildContext,
  hydration,
  generation,
  scan,
  dockerBuild,
  libgomp,
  paddlePaddle,
  paddleOcr,
  boundary,
  latency,
  cleanup,
  safety,
  matrix,
  decision,
  readiness,
  manifest,
  validation,
})) {
  if (!allowedDecisions.has(report.decision)) fail(`decision_unknown:${label}:${report.decision}`)
  if (report.decision !== decision.decision) fail(`decision_drift:${label}:${report.decision}`)
}

if (source.expectedSourceSha !== expectedSourceSha) fail('expected_source_sha_drift')
if (source.ownerId !== ownerId || decision.ownerId !== ownerId) fail('owner_id_drift')
for (const pr of [583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_pr${pr}_merged_source`)
  }
}
if (
  source.sourceEvidence?.find((entry) => entry.pr === 583)?.blocker !==
  'missing_libgomp_so_1_while_loading_paddle_base_libpaddle_so'
) {
  fail('missing_pr583_libgomp_blocker_evidence')
}
sameSet(source.tools, ['paddlepaddle', 'paddleocr'], 'source_tools')
sameSet(decision.targetTools, ['paddlepaddle', 'paddleocr'], 'decision_tools')
sameSet(matrix.tools?.map((tool) => tool.id), ['paddlepaddle', 'paddleocr'], 'matrix_tools')

if (rootCause.selectedPackage !== 'libgomp1') fail('root_cause_package_drift')
if (rootCause.packageStrategyClear !== true) fail('root_cause_strategy_not_clear')
if (rootCause.exactBlocker !== 'libgomp.so.1: cannot open shared object file') fail('root_cause_blocker_drift')
if (target.targetDockerfile !== targetDockerfile) fail('target_dockerfile_drift')
if (target.targetRequirements !== targetRequirements) fail('target_requirements_drift')
if (target.packagePresence?.['paddlepaddle==3.0.0'] !== true) fail('paddlepaddle_pin_missing')
if (target.packagePresence?.['paddleocr==3.0.0'] !== true) fail('paddleocr_pin_missing')
if (target.envGuards?.modelDownloadsDisabled !== true) fail('model_download_guard_missing')
if (target.envGuards?.realMediaInputDisabled !== true) fail('real_media_guard_missing')
if (target.envGuards?.providerExecutionDisabled !== true) fail('provider_guard_missing')
if (target.packageStrategy?.approvedPackage !== 'libgomp1') fail('source_target_package_drift')
if (target.packageStrategy?.aptLayerPresent !== true) fail('libgomp_apt_layer_missing')
if (target.packageStrategy?.unrelatedPackagesAdded !== false) fail('unrelated_package_added')
if (!/apt-get install -y --no-install-recommends libgomp1/.test(dockerfile)) fail('dockerfile_missing_libgomp_install')
if (/apt-get install -y --no-install-recommends(?!\s+libgomp1\b)/.test(dockerfile)) {
  fail('dockerfile_contains_unapproved_apt_install')
}
if (patch.patchApplied !== true || patch.onlyApprovedPackageAdded !== true) fail('dockerfile_patch_report_invalid')
if (patch.requirementsMutated !== false || patch.packageLockMutated !== false) fail('patch_claims_protected_mutation')
if (buildContext.buildContextGenerationRequired !== false) fail('build_context_unexpectedly_required')
if (hydration.skipped !== true || hydration.nodeModulesCreatedByThisPhase !== false) fail('hydration_scope_drift')
if (generation.skipped !== true || generation.allCommandsPassed !== true) fail('build_context_generation_scope_drift')
if (scan.passed !== true || scan.publicArtifactsCreated !== false || scan.signedUrlsCreated !== false) {
  fail('artifact_scan_scope_drift')
}
if (dockerBuild.imageTag !== imageTag || dockerBuild.dockerImagePushRun !== false) fail('docker_build_image_scope_drift')
if (libgomp.skipped !== true && libgomp.dockerRunNetworkNone !== true) fail('libgomp_probe_not_network_none')
if (paddlePaddle.localHostProbeRun !== false || paddleOcr.localHostProbeRun !== false) fail('local_host_probe_claimed')
if (paddlePaddle.gpuExecutionRun !== false || paddleOcr.gpuExecutionRun !== false) fail('gpu_execution_claimed')
if (paddlePaddle.modelAssetsUsed !== false) fail('paddlepaddle_model_assets_claimed')
if (paddleOcr.ocrInferenceRun !== false) fail('ocr_inference_claimed')
if (paddleOcr.modelDownloadRun !== false || paddleOcr.modelAssetCopyRun !== false || paddleOcr.modelAssetUploadRun !== false) {
  fail('model_asset_operation_claimed')
}
if (boundary.ocrInferenceRun !== false || boundary.modelDownloadRun !== false) fail('boundary_unblocked')
if (cleanup.generatedOutputsCleaned !== true) fail('cleanup_failed')
if (safety.passed !== true) fail('safety_scan_failed')
if (safety.changedProtectedFiles?.length) fail(`protected_file_drift:${safety.changedProtectedFiles.join(',')}`)
if (safety.generatedOutputsCommitted !== false || safety.modelFilesCommitted !== false || safety.mediaArtifactsCommitted !== false) {
  fail('unsafe_artifacts_committed')
}
if (manifest.localDockerImagePushed !== false || manifest.modelFilesCommitted !== false || manifest.mediaFilesCommitted !== false) {
  fail('manifest_artifact_scope_unblocked')
}

ensureFalse(decision, [
  'gpuRunInThisPhase',
  'dependencyHydrationRun',
  'buildContextGenerationRun',
  'pipInstallRunOnHost',
  'npmInstallRunOnHost',
  'npmRebuildRunOnHost',
  'packageLockMutationAllowed',
  'requirementsMutationAllowed',
  'unrelatedDockerfileMutationAllowed',
  'dockerImagePushRun',
  'ocrInferenceRunInThisPhase',
  'modelDownloadRunInThisPhase',
  'modelAssetCopyRunInThisPhase',
  'modelAssetUploadRunInThisPhase',
  'ffmpegFfprobeCommandRunInThisPhase',
  'otherTrackBToolsRunInThisPhase',
  'realUserMediaUsed',
  'realUserDocumentsUsed',
  'mediaProcessingAccepted',
  'renderExportAccepted',
  'workerRuntimeAccepted',
  'routeProviderRuntimeAccepted',
  'supabaseGcsPublicDeliveryAccepted',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'rawPromptExecutionAccepted',
  'betaProductionAccepted',
])
if (decision.dockerfileMutationAllowed !== true || decision.approvedDockerfilePatchPackage !== 'libgomp1') {
  fail('approved_dockerfile_patch_boundary_missing')
}
if (decision.canonicalAcceptedProvenBoundedBeforeMilestone3 !== 12) fail('pre_followup_count_drift')
if (decision.acceptedProvenBoundedTotalPendingQa !== 12) fail('accepted_count_should_remain_12_until_qa')
if (decision.endToEndProductReadyTools !== 0 || decision.fortyPlusEndToEndClaimAllowed !== false) {
  fail('product_ready_or_40_plus_claim_drift')
}
if (decision.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_drift')
if (decision.supabaseClassification?.environmentTouched !== 'none') fail('supabase_env_drift')
if (decision.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_drift')
if (decision.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_drift')

if (decision.decision === passDecision) {
  if (dockerBuild.exitCode !== 0) fail('pass_without_docker_build')
  if (libgomp.libgompPresent !== true) fail('pass_without_libgomp_presence')
  if (paddlePaddle.importVersionProven !== true || paddlePaddle.tensorDeviceProven !== true) {
    fail('pass_without_paddlepaddle_proof')
  }
  if (paddleOcr.importApiProven !== true) fail('pass_without_paddleocr_api_proof')
  if (readiness.nextPrompt !== 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW') fail('pass_next_prompt_drift')
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md'))) {
    fail('missing_cpu_qa_prompt')
  }
} else if (decision.decision === modelAssetDecision || decision.decision === modelAssetRequiredDecision) {
  if (readiness.nextPrompt !== 'TRACKB_MEDIA_OSS_MILESTONE_3_MODEL_ASSET_APPROVAL') fail('model_asset_next_prompt_drift')
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-model-asset-approval.md'))) {
    fail('missing_model_asset_prompt')
  }
} else {
  if (readiness.nextPrompt !== 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_BLOCKER_FOLLOWUP_RESOLUTION') {
    fail('blocker_next_prompt_drift')
  }
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-followup-resolution.md'))) {
    fail('missing_blocker_resolution_prompt')
  }
}

if (status.counts?.ownedTools !== 16) fail('owned_count_drift')
if (status.counts?.acceptedProvenBounded !== 12) fail('canonical_accepted_count_should_remain_12_until_qa')
if (status.counts?.blockedNotInstalledProven !== 4) fail('canonical_blocked_count_should_remain_4_until_qa')
if (status.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
if (status.milestone3OcrMlCpuExecution?.decision !== 'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_paddlepaddle_import_or_api_shape') {
  fail('prior_pr583_status_was_overwritten')
}
if (status.milestone3OcrMlCpuExecutionBlockerFollowup?.decision !== decision.decision) {
  fail('missing_followup_status_json')
}
if (status.milestone3OcrMlCpuExecutionBlockerFollowup?.canonicalCountsRemainPendingQa !== true) {
  fail('missing_pending_qa_count_boundary')
}

const expectedScripts = {
  'trackb-media-oss:milestone-3-ocr-ml-cpu-execution-blocker-followup:plan':
    'node server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup-plan.js',
  'trackb-media-oss:milestone-3-ocr-ml-cpu-execution-blocker-followup':
    'node server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup.js',
  'trackb-media-oss:milestone-3-ocr-ml-cpu-execution-blocker-followup:report':
    'node server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup-report.js',
  'trackb-media-oss:milestone-3-ocr-ml-cpu-execution-blocker-followup:summary':
    'node server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup-summary.js',
  'trackb-media-oss:milestone-3-ocr-ml-cpu-execution-blocker-followup:diagnostics':
    'node scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup-diagnostics.mjs',
  'smoke:trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup':
    'node server/smoke/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup-smoke.js',
}
for (const [script, command] of Object.entries(expectedScripts)) {
  if (packageJson.scripts?.[script] !== command) fail(`package_script_drift:${script}`)
}

for (const output of [
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
  'node_modules',
]) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}

const noDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  targetRequirements,
]
const protectedDiffs = [
  ...git(['diff', '--name-only', '--', ...noDiffFiles]).split('\n').filter(Boolean),
  ...git(['diff', '--cached', '--name-only', '--', ...noDiffFiles]).split('\n').filter(Boolean),
]
if (protectedDiffs.length) fail(`protected_file_diff:${protectedDiffs.join(',')}`)
const dockerfileDiff = [
  ...git(['diff', '--name-only', '--', targetDockerfile]).split('\n').filter(Boolean),
  ...git(['diff', '--cached', '--name-only', '--', targetDockerfile]).split('\n').filter(Boolean),
]
if (dockerfileDiff.some((file) => file !== targetDockerfile)) {
  fail(`ocr_dockerfile_diff_unexpected:${dockerfileDiff.join(',')}`)
}

const textCorpus = [
  ...requiredFiles,
  ...statusFiles,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-model-asset-approval.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-followup-resolution.md',
]
  .filter((file) => fs.existsSync(path.join(repoRoot, file)))
  .map((file) => readText(file))
  .join('\n')
const forbiddenClaims = [
  /40\+ tools (?:are )?(?:installed|proven|end-to-end)/i,
  /OCR inference (?:passed|approved|accepted|enabled)/i,
  /model downloads? (?:passed|approved|accepted|enabled|ran)/i,
  /GPU execution (?:passed|approved|accepted|enabled|ran)/i,
  /beta (?:unlocked|enabled|ready)/i,
  /production (?:unlocked|enabled|ready)/i,
]
for (const pattern of forbiddenClaims) {
  const matchedLine = textCorpus
    .split(/\r?\n/)
    .find((line) => pattern.test(line) && !/\b(?:no|not|never|do not|don’t|cannot|must not|blocked|future-only|remains)\b/i.test(line))
  if (matchedLine) fail(`forbidden_claim:${pattern}:${matchedLine.trim().slice(0, 160)}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      ownerId,
      targetDockerfile,
      approvedPackage: 'libgomp1',
      dockerBuildExitCode: dockerBuild.exitCode,
      libgompPresent: libgomp.libgompPresent,
      paddlePaddleImportVersionProven: paddlePaddle.importVersionProven,
      paddlePaddleTensorDeviceProven: paddlePaddle.tensorDeviceProven,
      paddleOcrImportApiProven: paddleOcr.importApiProven,
      nextPrompt: readiness.nextPrompt,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
