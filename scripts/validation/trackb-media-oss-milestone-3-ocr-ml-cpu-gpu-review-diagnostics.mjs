#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review'
const decision = 'trackb_media_oss_milestone3_ocr_ml_cpu_gpu_review_passed_ready_for_cpu_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'

const requiredReports = [
  'source-of-truth-audit',
  'historical-ocr-evidence-review',
  'tool-ownership-duplicate-review',
  'package-strategy-review',
  'model-asset-policy-review',
  'worker-container-target-review',
  'cpu-proof-policy',
  'gpu-escalation-policy',
  'synthetic-fixture-safety-policy',
  'cloud-runtime-cost-performance-policy',
  'future-verification-command-plan',
  'milestone-3-ocr-ml-cpu-gpu-review-decision',
]
const requiredJsonFiles = [
  ...requiredReports.map((name) => `${reportDir}/${name}.json`),
  `${reportDir}/readiness-report.json`,
  `${reportDir}/private-artifact-manifest.json`,
  `${reportDir}/validation-results.json`,
]
const requiredTextFiles = [
  ...requiredReports.map((name) => `${reportDir}/${name}.md`),
  `${reportDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-execution.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
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
function isAllowedFontConfigDockerfileDiff(diff) {
  if (!diff) return true
  const localFontEnv = 'PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
  if (!diff.includes(localFontEnv)) return false

  const changedLines = diff
    .split('\n')
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line))
    .map((line) => line.slice(1).trim())

  return changedLines.every((line) =>
    [
      'PROVIDER_EXECUTION_ENABLED=false',
      'PROVIDER_EXECUTION_ENABLED=false \\',
      localFontEnv,
    ].includes(line),
  )
}
function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}

for (const file of [...requiredJsonFiles, ...requiredTextFiles]) readText(file)

const reports = Object.fromEntries(requiredJsonFiles.map((file) => [file, readJson(file)]))
const sourceAudit = reports[`${reportDir}/source-of-truth-audit.json`]
const historical = reports[`${reportDir}/historical-ocr-evidence-review.json`]
const ownership = reports[`${reportDir}/tool-ownership-duplicate-review.json`]
const packageStrategy = reports[`${reportDir}/package-strategy-review.json`]
const modelPolicy = reports[`${reportDir}/model-asset-policy-review.json`]
const workerTarget = reports[`${reportDir}/worker-container-target-review.json`]
const cpuPolicy = reports[`${reportDir}/cpu-proof-policy.json`]
const gpuPolicy = reports[`${reportDir}/gpu-escalation-policy.json`]
const fixturePolicy = reports[`${reportDir}/synthetic-fixture-safety-policy.json`]
const cloudPolicy = reports[`${reportDir}/cloud-runtime-cost-performance-policy.json`]
const commandPlan = reports[`${reportDir}/future-verification-command-plan.json`]
const decisionReport = reports[`${reportDir}/milestone-3-ocr-ml-cpu-gpu-review-decision.json`]
const readiness = reports[`${reportDir}/readiness-report.json`]
const manifest = reports[`${reportDir}/private-artifact-manifest.json`]
const validation = reports[`${reportDir}/validation-results.json`]
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const steward = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json')
const registry = readJson('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json')
const packageJson = readJson('package.json')
const ocrRequirements = readText('docker/prod/ocr-runtime/requirements.ocr.txt')
const ocrDockerfile = readText('docker/prod/ocr-runtime/Dockerfile')

for (const [file, report] of Object.entries(reports)) {
  if (report.decision !== decision) fail(`decision_drift:${file}:${report.decision}`)
}

if (sourceAudit.ownerId !== ownerId || decisionReport.ownerId !== ownerId) fail('owner_id_drift')
if (sourceAudit.sourceSha !== '0a05d4a39ab11675465efc2622299e28c132da02') {
  fail(`source_sha_drift:${sourceAudit.sourceSha}`)
}
for (const pr of [574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (sourceAudit.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_pr${pr}_merged_evidence`)
  }
}
if (sourceAudit.aiGraphicsPr543?.ownsPaddleTools !== false || sourceAudit.aiGraphicsPr543?.canonicalTrackBSource !== false) {
  fail('pr543_owner_scope_drift')
}
for (const pr of [51, 56, 59, 99, 161, 164]) {
  const entry = historical.historicalEvidence?.find((item) => item.pr === pr)
  if (!entry) fail(`missing_historical_pr:${pr}`)
  if (entry?.selectedAsCurrentProof !== false || entry?.status !== 'historical_context_only') {
    fail(`historical_pr_not_context_only:${pr}`)
  }
}
if (historical.currentTrackBProofStillRequired !== true || historical.runtimeScopeApprovedByHistoricalEvidence !== false) {
  fail('historical_authority_drift')
}

sameSet(
  (ownership.tools || []).map((tool) => tool.id),
  ['paddleocr', 'paddlepaddle'],
  'ownership_tools',
)
for (const tool of ownership.tools || []) {
  if (tool.ownerId !== ownerId) fail(`tool_owner_drift:${tool.id}`)
  if (tool.stillBlockedNotInstalledProven !== true) fail(`tool_not_blocked:${tool.id}`)
}
for (const key of ['aiGraphicsOwnsTools', 'trackAOwnsTools', 'soundOwnsTools', 'providerLaneOwnsTools', 'duplicateMilestone3ReviewFound', 'duplicateOwnerConflictFound']) {
  if (ownership[key] !== false) fail(`ownership_flag_not_false:${key}`)
}

if (!ocrRequirements.includes('paddlepaddle==3.0.0')) fail('missing_paddlepaddle_pin')
if (!ocrRequirements.includes('paddleocr==3.0.0')) fail('missing_paddleocr_pin')
if (packageStrategy.selectedFutureTargetRequirements !== 'docker/prod/ocr-runtime/requirements.ocr.txt') {
  fail('package_target_drift')
}
if (packageStrategy.currentRequirementsAlreadyDeclareSelectedPins !== true) fail('requirements_pins_not_detected')
if (packageStrategy.futureRequirementsMutationNeeded !== false) fail('future_requirements_mutation_unexpected')
if (packageStrategy.packageInstallThisPhase !== false) fail('package_install_claimed')
if (packageStrategy.requirementsMutationThisPhase !== false) fail('requirements_mutation_claimed')

if (modelPolicy.cpuExecutionWithoutModelAssetsAllowed !== true) fail('cpu_without_model_assets_not_allowed')
if (modelPolicy.ocrInferenceAllowedInNextCpuExecution !== false) fail('ocr_inference_unblocked')
if (modelPolicy.ocrInferenceRequiresSeparateModelAssetApproval !== true) fail('model_asset_gate_missing')
for (const key of ['modelDownloadsAllowed', 'modelAssetCopyAllowed', 'modelAssetUploadAllowed']) {
  if (modelPolicy[key] !== false) fail(`model_asset_flag_not_false:${key}`)
}

if (workerTarget.selectedFutureCpuTarget !== 'docker/prod/ocr-runtime/Dockerfile') fail('worker_target_drift')
if (workerTarget.selectedFutureRequirements !== 'docker/prod/ocr-runtime/requirements.ocr.txt') fail('worker_requirements_drift')
if (!ocrDockerfile.includes('MODEL_DOWNLOADS_ENABLED=false')) fail('ocr_runtime_model_download_flag_missing')
if (workerTarget.dockerfileMutationThisPhase !== false || workerTarget.dockerBuildRunThisPhase !== false) {
  fail('worker_target_runtime_mutation_claimed')
}

if (cpuPolicy.cpuFirstRequired !== true) fail('cpu_first_missing')
if (cpuPolicy.ocrInferenceApproved !== false) fail('cpu_policy_ocr_inference_unblocked')
if (cpuPolicy.recordLatencyMemoryInFutureExecution !== true) fail('cpu_latency_policy_missing')
if (gpuPolicy.gpuExecutionApprovedThisPhase !== false || gpuPolicy.gpuRequiresSeparateApproval !== true) {
  fail('gpu_policy_unblocked')
}
if (fixturePolicy.noRealMedia !== true || fixturePolicy.noExternalModelDownloads !== true) fail('fixture_policy_scope_drift')
if (cloudPolicy.gpuExecutionThisPhase !== false) fail('cloud_gpu_execution_unblocked')
if (commandPlan.commandsNotRunThisPhase !== true || commandPlan.ocrInferenceCommandsApproved !== false || commandPlan.gpuCommandsApproved !== false) {
  fail('command_plan_scope_unblocked')
}

sameSet(decisionReport.reviewTools, ['paddleocr', 'paddlepaddle'], 'decision_review_tools')
sameSet(decisionReport.blockedNotInstalledProven, ['paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio'], 'decision_blocked_tools')
sameSet(
  decisionReport.acceptedProvenBounded,
  [
    'ffmpeg',
    'ffprobe',
    'sharp_libvips',
    'duckdb',
    'polars_nodejs_polars',
    'exiftool',
    'mediainfo',
    'tesseract',
    'imagemagick',
    'opencv',
    'pyav',
    'pyscenedetect',
  ],
  'decision_accepted_tools',
)
if (decisionReport.counts?.ownedTools !== 16) fail('owned_count_drift')
if (decisionReport.counts?.acceptedProvenBounded !== 12) fail('accepted_count_drift')
if (decisionReport.counts?.blockedNotInstalledProven !== 4) fail('blocked_count_drift')
if (decisionReport.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
if (decisionReport.nextPrompt !== nextPrompt || readiness.nextPrompt !== nextPrompt) fail('next_prompt_drift')
if (decisionReport.cpuExecutionReady !== true || readiness.readyForCpuExecution !== true) fail('cpu_execution_not_ready')
if (decisionReport.modelAssetApprovalNeededBeforeInference !== true || readiness.readyForModelAssetInference !== false) {
  fail('model_asset_readiness_drift')
}
if (decisionReport.gpuExecutionApprovalNeededBeforeGpuUse !== true || readiness.readyForGpuExecution !== false) {
  fail('gpu_readiness_drift')
}
if (decisionReport.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')

const milestone3OcrMlCpuQaAccepted =
  status.milestone3OcrMlCpuQaReview?.decision ===
  'trackb_media_oss_milestone3_ocr_ml_cpu_qa_passed_ready_for_milestone4_color_image_pipeline_approval'
const expectedCurrentAcceptedCount = milestone3OcrMlCpuQaAccepted ? 14 : 12
const expectedCurrentBlockedCount = milestone3OcrMlCpuQaAccepted ? 2 : 4
const expectedCurrentBlockedTools = milestone3OcrMlCpuQaAccepted
  ? ['opencolorio', 'openimageio']
  : ['paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio']
if (
  status.counts?.ownedTools !== 16 ||
  status.counts?.acceptedProvenBounded !== expectedCurrentAcceptedCount ||
  status.counts?.blockedNotInstalledProven !== expectedCurrentBlockedCount ||
  status.counts?.endToEndProductReady !== 0
) {
  fail('status_counts_drift')
}
sameSet(status.blockedNotInstalledProven, expectedCurrentBlockedTools, 'status_blocked_tools')
if (status.milestone3OcrMlCpuGpuReview?.decision !== decision) fail('status_milestone3_missing')
if (steward.milestone3OcrMlCpuGpuReview?.decision !== decision) fail('steward_milestone3_missing')
const owner = registry.owners?.find((entry) => entry.ownerId === ownerId)
if (!owner) fail('registry_owner_missing')
if (owner?.milestone3OcrMlCpuGpuReview?.decision !== decision) fail('registry_milestone3_missing')

for (const file of requiredTextFiles) {
  const text = readText(file)
  if (text.includes('PaddleOCR installed in this phase')) fail(`bad_install_claim:${file}`)
  if (text.includes('PaddlePaddle installed in this phase')) fail(`bad_install_claim:${file}`)
  if (text.includes('OCR inference ran in this phase')) fail(`bad_ocr_claim:${file}`)
  if (text.includes('model files downloaded in this phase')) fail(`bad_model_download_claim:${file}`)
  for (const line of text.split('\n')) {
    if (/GPU execution is approved in this review/i.test(line) && !/\b(no|not)\b/i.test(line)) {
      fail(`bad_gpu_claim:${file}`)
    }
    if (/40\+ tools (are )?(installed|proven).*end-to-end/i.test(line) && !/\b(do not|no|not|disallow|disallowed)\b/i.test(line)) {
      fail(`bad_forty_plus_claim:${file}`)
    }
  }
}

if (
  packageJson.scripts?.['trackb-media-oss:milestone-3-ocr-ml-cpu-gpu-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review-diagnostics.mjs'
) {
  fail('missing_diagnostics_script')
}
if (
  packageJson.scripts?.['smoke:trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review'] !==
  'node server/smoke/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review-smoke.js'
) {
  fail('missing_smoke_script')
}

const protectedFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
]
const protectedDiffFailures = []
for (const protectedFile of protectedFiles) {
  const diff = git(['diff', '--', protectedFile])
  const stagedDiff = git(['diff', '--cached', '--', protectedFile])
  if (
    protectedFile === 'docker/prod/ocr-runtime/Dockerfile' &&
    isAllowedFontConfigDockerfileDiff(diff) &&
    isAllowedFontConfigDockerfileDiff(stagedDiff)
  ) {
    continue
  }
  if (diff || stagedDiff) protectedDiffFailures.push(protectedFile)
}
if (protectedDiffFailures.length) fail('protected_file_mutation')
for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}
const staged = git(['diff', '--cached', '--name-only'])
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
const badStaged = staged.filter((file) => /\.(onnx|pdmodel|pdiparams|bin|mp4|mov|mkv|wav|mp3|png|jpg|jpeg|webp|tif|tiff)$/i.test(file))
if (badStaged.length) fail(`staged_model_or_media_artifacts:${badStaged.join(',')}`)

if (manifest.publicArtifactsCreated !== false || manifest.signedUrlsCreated !== false || manifest.modelFilesCommitted !== false || manifest.mediaFilesCommitted !== false) {
  fail('private_manifest_scope_drift')
}
if (validation.validationMode !== 'no_install_metadata_only') fail('validation_mode_drift')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      ownerId,
      reviewTools: ['paddleocr', 'paddlepaddle'],
      futureCpuTarget: workerTarget.selectedFutureCpuTarget,
      counts: decisionReport.counts,
      nextPrompt,
      supabaseClassification: decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
