import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..', '..', '..')

export const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-execution'
export const branchName = 'codex/rp-trackb-media-oss-milestone-3-ocr-ml-cpu-execution'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '3cc82ddad41854860a4b06421dc9e22e74a1435f'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const dockerfilePath = 'docker/prod/ocr-runtime/Dockerfile'
export const requirementsPath = 'docker/prod/ocr-runtime/requirements.ocr.txt'
export const imageTag = `reeditpro-ocr-runtime:trackb-milestone3-cpu-${expectedSourceSha}`

export const passDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_passed_import_api_shape_no_model_assets'
export const modelAssetDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_passed_ready_for_model_asset_approval'
export const sourceTargetDriftDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_source_target_drift'
export const dependencyHydrationDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_dependency_hydration'
export const buildContextGenerationDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_build_context_generation'
export const artifactScanDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_generated_artifact_scan'
export const dockerBuildDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_docker_build'
export const paddlePaddleDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_paddlepaddle_import_or_api_shape'
export const paddleOcrDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_paddleocr_import_or_api_shape'
export const modelAssetRequiredDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_model_asset_required'
export const cleanupDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_artifact_cleanup'
export const safetyScanDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_safety_scan'
export const runtimeSafetyDecision = 'rejected_due_runtime_safety_risk'

const qaNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW'
const modelAssetNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_MODEL_ASSET_APPROVAL'
const blockerNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_BLOCKER_FOLLOWUP'
const qaNextPromptPath = 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md'
const modelAssetPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-model-asset-approval.md'
const blockerPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup.md'

const targetTools = [
  {
    id: 'paddlepaddle',
    name: 'PaddlePaddle',
    packageName: 'paddlepaddle',
    selectedVersion: '3.0.0',
  },
  {
    id: 'paddleocr',
    name: 'PaddleOCR',
    packageName: 'paddleocr',
    selectedVersion: '3.0.0',
  },
]
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  dockerfilePath,
  requirementsPath,
]
const cleanupOutputs = [
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
  'node_modules',
]
const forbiddenArtifactExtensions = new Set([
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.pdf',
  '.onnx',
  '.pdmodel',
  '.pdiparams',
  '.node',
  '.wasm',
])
const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9_]{20,}\b/,
  /\bpostgres(?:ql)?:\/\/[^\s"'`]+/i,
  /\bX-Amz-Signature=/i,
  /BEGIN [A-Z ]*PRIVATE KEY/,
]

function generatedAt() {
  return new Date().toISOString()
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_MILESTONE_3_CPU_ONLY_EXECUTION',
    'REEDITPRO_CONFIRM_OCR_RUNTIME_TARGET',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_PADDLEPADDLE_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_PADDLEOCR_IMPORT_API_PROOF',
    'REEDITPRO_CONFIRM_NO_OCR_INFERENCE',
    'REEDITPRO_CONFIRM_NO_MODEL_DOWNLOAD',
    'REEDITPRO_CONFIRM_NO_MODEL_ASSET_COPY',
    'REEDITPRO_CONFIRM_NO_MODEL_ASSET_UPLOAD',
    'REEDITPRO_CONFIRM_NO_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_NO_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_NO_REAL_USER_DOCUMENTS',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_SUPABASE_MUTATION',
    'REEDITPRO_CONFIRM_NO_DOCKER_IMAGE_PUSH',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_OCR_INFERENCE_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEOCR_OCR_INFERENCE',
    'REEDITPRO_CONFIRM_MODEL_DOWNLOAD',
    'REEDITPRO_CONFIRM_MODEL_ASSET_COPY',
    'REEDITPRO_CONFIRM_MODEL_ASSET_UPLOAD',
    'REEDITPRO_CONFIRM_GPU_JOB',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_TOOL_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_GPU_RUNTIME_EXECUTION',
    'REEDITPRO_CONFIRM_CLOUD_RUN_GPU',
    'REEDITPRO_CONFIRM_CLOUD_BUILD',
    'REEDITPRO_CONFIRM_GCP_IAM_MUTATION',
    'REEDITPRO_CONFIRM_PYTHON_PACKAGE_INSTALL',
    'REEDITPRO_CONFIRM_PIP_INSTALL',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION',
    'REEDITPRO_CONFIRM_REQUIREMENTS_MUTATION',
    'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION',
    'REEDITPRO_CONFIRM_OPENCV_EXECUTION',
    'REEDITPRO_CONFIRM_PYAV_EXECUTION',
    'REEDITPRO_CONFIRM_PYSCENEDETECT_EXECUTION',
    'REEDITPRO_CONFIRM_OPENIMAGEIO_EXECUTION',
    'REEDITPRO_CONFIRM_OPENCOLORIO_EXECUTION',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_EXIFTOOL_EXECUTION',
    'REEDITPRO_CONFIRM_MEDIAINFO_EXECUTION',
    'REEDITPRO_CONFIRM_TESSERACT_EXECUTION',
    'REEDITPRO_CONFIRM_IMAGEMAGICK_EXECUTION',
    'REEDITPRO_CONFIRM_GRAPHICSMAGICK_EXECUTION',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_MEDIA_FILE_PROBE',
    'REEDITPRO_CONFIRM_CAPTION_BURN_IN_EXECUTION',
    'REEDITPRO_CONFIRM_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_WORKER_EXECUTION',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
    'REEDITPRO_CONFIRM_PROVIDER_CALLS',
    'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
    'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
    'REEDITPRO_CONFIRM_GCS_UPLOAD',
    'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
    'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
    'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
    'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
    'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
    'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
    'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
    'REEDITPRO_CONFIRM_GITHUB_PR_MERGE',
    'REEDITPRO_CONFIRM_DOCKER_IMAGE_PUSH',
  ]
}

function assertConfirmations() {
  const missing = requiredConfirmations().filter((name) => process.env[name] !== 'true')
  const forbidden = forbiddenConfirmations().filter((name) => process.env[name] === 'true')
  if (missing.length || forbidden.length) {
    throw new Error(`confirmation_gate_failed:${JSON.stringify({ missing, forbidden })}`)
  }
}

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
}

function run(command, args, options = {}) {
  const started = Date.now()
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    timeout: options.timeout || 60000,
    maxBuffer: 80 * 1024 * 1024,
    env: { ...process.env, ...(options.env || {}) },
  })
  return {
    command: [command, ...args].join(' '),
    exitCode: result.status ?? null,
    signal: result.signal ?? null,
    durationMs: Date.now() - started,
    stdoutSummary: sanitize(result.stdout),
    stderrSummary: sanitize(result.stderr),
    error: result.error?.message || null,
  }
}

function dockerPython(script, options = {}) {
  return run(
    'docker',
    ['run', '--rm', '--network', 'none', '--entrypoint', 'python', imageTag, '-c', script],
    { timeout: options.timeout || 180000 },
  )
}

function sanitize(value = '') {
  const lines = String(value)
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[email-redacted]')
    .replace(
      /\b(sk-[A-Za-z0-9_-]+|sk-proj-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|X-Amz-Signature=[A-Za-z0-9%]+)\b/g,
      '[secret-redacted]',
    )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length <= 80) return lines.join('\n')
  return [...lines.slice(0, 32), '[...output truncated...]', ...lines.slice(-48)].join('\n')
}

function hashFile(relativePath) {
  const fullPath = join(repoRoot, relativePath)
  if (!existsSync(fullPath)) return null
  return createHash('sha256').update(readFileSync(fullPath)).digest('hex')
}

function readText(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath))
}

function writeJson(relativePath, value) {
  const fullPath = join(repoRoot, relativePath)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(relativePath, value) {
  const fullPath = join(repoRoot, relativePath)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, value)
}

function replaceOrAppend(relativePath, start, end, body) {
  const fullPath = join(repoRoot, relativePath)
  const current = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : ''
  const block = `${start}\n${body.trim()}\n${end}`
  const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`)
  const next = pattern.test(current) ? current.replace(pattern, block) : `${current.trimEnd()}\n\n${block}\n`
  writeFileSync(fullPath, next)
}

export function buildTrackBMilestone3OcrMlCpuExecutionPlan() {
  return {
    branchName,
    baseBranch,
    expectedSourceSha,
    ownerId,
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    imageTag,
    decisionCandidates: [
      passDecision,
      modelAssetDecision,
      sourceTargetDriftDecision,
      dependencyHydrationDecision,
      buildContextGenerationDecision,
      artifactScanDecision,
      dockerBuildDecision,
      paddlePaddleDecision,
      paddleOcrDecision,
      modelAssetRequiredDecision,
      cleanupDecision,
      safetyScanDecision,
      runtimeSafetyDecision,
    ],
    dockerBuildCommand: `docker build -f ${dockerfilePath} -t ${imageTag} .`,
    proofBoundary: 'container_only_python_import_api_shape_with_network_none',
    buildContextGenerationRequiredByReviewedTarget: false,
    cleanupCommand: `rm -rf ${cleanupOutputs.join(' ')}`,
    supabaseClassification: supabaseClassification(),
  }
}

function buildSourceAudit(generated) {
  const sourceSha = git(['rev-parse', 'HEAD'])
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.sourceAudit.v1',
    generatedAt: generated,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    ownerId,
    sourceEvidence: [
      {
        pr: 578,
        state: 'MERGED',
        decision: 'trackb_media_oss_milestone3_ocr_ml_cpu_gpu_review_passed_ready_for_cpu_execution',
        targetDockerfile: dockerfilePath,
        targetRequirements: requirementsPath,
      },
      { pr: 574, state: 'MERGED', decision: 'trackb_media_oss_milestone2_qa_passed_ready_for_milestone3_ocr_ml_cpu_gpu_review' },
      { pr: 571, state: 'MERGED', decision: 'trackb_media_oss_milestone2_video_analysis_execution_passed_all_three_tools_cpu_bounded' },
      { pr: 567, state: 'MERGED', decision: 'trackb_media_oss_milestone2_video_analysis_approval_passed_ready_for_execution' },
      { pr: 563, state: 'MERGED', decision: 'trackb_media_oss_milestone1_qa_passed_ready_for_milestone2_video_analysis_approval' },
      { pr: 559, state: 'MERGED', decision: 'trackb_media_oss_milestone1_tesseract_fixture_followup_passed_ready_for_qa' },
      { pr: 557, state: 'MERGED', decision: 'trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof' },
      { pr: 551, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context' },
      { pr: 549, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution' },
      { pr: 546, state: 'MERGED', decision: 'trackb_media_oss_milestone1_blocked_pending_container_packaging_approval' },
      { pr: 545, state: 'MERGED', decision: 'trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution' },
      { pr: 542, state: 'MERGED', ownerId },
    ],
    contextOnlyPrs: [
      { pr: 543, status: 'ai_graphics_context_only', canonicalTrackBSource: false },
      { pr: 51, status: 'historical_paddleocr_context_only', selectedAsCurrentProof: false },
      { pr: 56, status: 'historical_paddleocr_context_only', selectedAsCurrentProof: false },
    ],
    tools: targetTools.map((tool) => tool.id),
    fileHashes: {
      packageJson: hashFile('package.json'),
      packageLock: hashFile('package-lock.json'),
      dockerfile: hashFile(dockerfilePath),
      requirements: hashFile(requirementsPath),
      dockerignore: hashFile('.dockerignore'),
    },
    noScope: noScope(),
    supabaseClassification: supabaseClassification(),
  }
}

function noScope() {
  return {
    ocrInferenceRun: false,
    modelDownloadRun: false,
    modelAssetCopied: false,
    modelAssetUploaded: false,
    gpuExecutionRun: false,
    realUserMediaUsed: false,
    realUserDocumentsUsed: false,
    mediaProcessingRun: false,
    renderExportRun: false,
    workerRouteProviderRun: false,
    supabaseMutationRun: false,
    gcsUploadRun: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    betaProductionUnlocked: false,
    rawPromptExecuted: false,
    secretPayloadPrinted: false,
  }
}

function buildSourceTargetCheck(generated) {
  const dockerfileExists = existsSync(join(repoRoot, dockerfilePath))
  const requirementsExists = existsSync(join(repoRoot, requirementsPath))
  const dockerfile = dockerfileExists ? readText(dockerfilePath) : ''
  const requirements = requirementsExists ? readText(requirementsPath) : ''
  const packagePresence = {
    'paddlepaddle==3.0.0': requirements.includes('paddlepaddle==3.0.0'),
    'paddleocr==3.0.0': requirements.includes('paddleocr==3.0.0'),
  }
  const envGuards = {
    modelDownloadsDisabled: dockerfile.includes('MODEL_DOWNLOADS_ENABLED=false'),
    realMediaInputDisabled: dockerfile.includes('REAL_MEDIA_INPUT_ENABLED=false'),
    providerExecutionDisabled: dockerfile.includes('PROVIDER_EXECUTION_ENABLED=false'),
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.sourceTargetCheck.v1',
    generatedAt: generated,
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    dockerfileExists,
    requirementsExists,
    dockerfileCopiesRequirements: dockerfile.includes(`COPY ${requirementsPath} /tmp/requirements.ocr.txt`),
    dockerfileCopiesOcrRuntime: dockerfile.includes('COPY server/workers/ocr-runtime /app/server/workers/ocr-runtime'),
    dockerfileInstallsRequirements: dockerfile.includes('pip install --no-cache-dir -r /tmp/requirements.ocr.txt'),
    packagePresence,
    allRequiredPackagesDeclared: Object.values(packagePresence).every(Boolean),
    envGuards,
    allRuntimeGuardsDeclared: Object.values(envGuards).every(Boolean),
    buildContextGenerationRequired: false,
    packageLockMutationAllowed: false,
    requirementsMutationAllowed: false,
    dockerfileMutationAllowed: false,
    sourceTargetValid:
      dockerfileExists &&
      requirementsExists &&
      Object.values(packagePresence).every(Boolean) &&
      Object.values(envGuards).every(Boolean),
  }
}

function buildBuildContextReview(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.buildContextReview.v1',
    generatedAt: generated,
    dockerfile: dockerfilePath,
    buildContextGenerationRequired: false,
    reason:
      'The reviewed OCR runtime target copies committed requirements and server/workers/ocr-runtime files from repository context; it does not copy dist-server or staging worker build outputs.',
    approvedBuildContextCommands: [],
    buildContextConfirmationsSet: false,
  }
}

function runDependencyHydration(execute) {
  const before = {
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    nodeModulesPresentBefore: existsSync(join(repoRoot, 'node_modules')),
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.dependencyHydration.v1',
    ...before,
    command: 'npm ci --ignore-scripts --no-audit --no-fund',
    skipped: true,
    skipReason: 'not_required_for_ocr_runtime_docker_build_context',
    exitCode: null,
    packageFilesUnchanged:
      before.packageJsonHash === hashFile('package.json') &&
      before.packageLockHash === hashFile('package-lock.json'),
    nodeModulesCreatedByThisPhase: false,
    executeMode: execute,
  }
}

function buildBuildContextGenerationReport(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.buildContextGeneration.v1',
    generatedAt: generated,
    skipped: true,
    skipReason: 'not_required_for_ocr_runtime_target',
    allCommandsPassed: true,
    allOutputsPresent: true,
    generatedOutputs: [],
  }
}

function buildGeneratedArtifactScan(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.generatedArtifactScan.v1',
    generatedAt: generated,
    skipped: true,
    skipReason: 'no_build_context_generation_required',
    forbiddenFindings: [],
    warnings: [],
    passed: true,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
  }
}

function runDockerBuild(execute, sourceTargetCheck) {
  const command = `docker build -f ${dockerfilePath} -t ${imageTag} .`
  if (!execute || sourceTargetCheck.sourceTargetValid !== true) {
    return {
      command,
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'source_target_check_failed',
      exitCode: null,
      imageTag,
      dockerImagePushRun: false,
      exactApprovedCommandUsed: false,
    }
  }
  const readiness = run('docker', ['version', '--format', '{{json .}}'], { timeout: 30000 })
  if (readiness.exitCode !== 0) {
    return {
      command,
      readiness,
      skipped: true,
      skipReason: 'docker_runtime_unavailable',
      exitCode: null,
      imageTag,
      dockerImagePushRun: false,
      exactApprovedCommandUsed: false,
    }
  }
  const result = run('docker', ['build', '-f', dockerfilePath, '-t', imageTag, '.'], {
    timeout: 3600000,
  })
  return {
    ...result,
    readiness,
    skipped: false,
    imageTag,
    exactApprovedCommandUsed: result.command === command,
    dockerImagePushRun: false,
  }
}

function runPaddlePaddleProof(execute, dockerBuildReport) {
  if (!execute || dockerBuildReport.exitCode !== 0) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'docker_build_not_passed',
      importVersion: null,
      tensorDevice: null,
      importVersionProven: false,
      tensorDeviceProven: false,
      localHostProbeRun: false,
    }
  }
  const importVersion = dockerPython(
    "import json, paddle; print(json.dumps({'tool':'paddlepaddle','version':paddle.__version__,'compiled_with_cuda':bool(paddle.device.is_compiled_with_cuda())}))",
  )
  const tensorDevice = dockerPython(
    "import json, paddle; x=paddle.to_tensor([1,2,3], dtype='int64'); print(json.dumps({'tool':'paddlepaddle','tensor':x.numpy().tolist(),'device':paddle.device.get_device(),'place':str(x.place)}))",
  )
  return {
    skipped: false,
    imageTag,
    importVersion,
    tensorDevice,
    importVersionProven: importVersion.exitCode === 0 && /"version":/.test(importVersion.stdoutSummary),
    tensorDeviceProven:
      tensorDevice.exitCode === 0 &&
      /"tensor":\s*\[\s*1,\s*2,\s*3\s*\]/.test(tensorDevice.stdoutSummary),
    localHostProbeRun: false,
    cpuOnly: true,
    gpuExecutionRun: false,
    modelAssetsUsed: false,
  }
}

function runPaddleOcrProof(execute, dockerBuildReport, paddlePaddleReport) {
  if (!execute || dockerBuildReport.exitCode !== 0 || paddlePaddleReport.tensorDeviceProven !== true) {
    return {
      skipped: true,
      skipReason: !execute
        ? 'not_execute_mode'
        : dockerBuildReport.exitCode !== 0
          ? 'docker_build_not_passed'
          : 'paddlepaddle_proof_not_passed',
      importApi: null,
      importApiProven: false,
      modelAssetRequired: false,
      ocrInferenceRun: false,
      modelDownloadRun: false,
      modelAssetCopyRun: false,
      modelAssetUploadRun: false,
      localHostProbeRun: false,
      cpuOnly: true,
      gpuExecutionRun: false,
    }
  }
  const script = `
import importlib.metadata, json
import paddleocr
version = importlib.metadata.version('paddleocr')
attrs = {
  'PaddleOCR': hasattr(paddleocr, 'PaddleOCR'),
  'PPStructure': hasattr(paddleocr, 'PPStructure'),
  'draw_ocr': hasattr(paddleocr, 'draw_ocr'),
}
print(json.dumps({'tool':'paddleocr','version':version,'attrs':attrs,'module_file':bool(getattr(paddleocr, '__file__', None))}))
`
  const importApi = dockerPython(script)
  const combinedOutput = `${importApi.stdoutSummary}\n${importApi.stderrSummary}`.toLowerCase()
  const modelAssetRequired =
    importApi.exitCode !== 0 && /(download|model|inference|det_model|rec_model|cls_model)/i.test(combinedOutput)
  return {
    skipped: false,
    imageTag,
    importApi,
    importApiProven:
      importApi.exitCode === 0 &&
      /"version":\s*"3\.0\.0"/.test(importApi.stdoutSummary) &&
      /"PaddleOCR":\s*true/.test(importApi.stdoutSummary),
    modelAssetRequired,
    ocrInferenceRun: false,
    modelDownloadRun: false,
    modelAssetCopyRun: false,
    modelAssetUploadRun: false,
    localHostProbeRun: false,
    cpuOnly: true,
    gpuExecutionRun: false,
  }
}

function buildModelOcrBoundary(generated, paddleOcrReport) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.modelOcrBoundary.v1',
    generatedAt: generated,
    ocrInferenceRun: false,
    modelDownloadRun: false,
    modelAssetCopyRun: false,
    modelAssetUploadRun: false,
    modelFilesStaged: false,
    dockerRunNetworkNone: true,
    paddleOcrImportApiProofAvoidedInstantiation: true,
    paddleOcrModelAssetRequiredForImportApiShape: paddleOcrReport.modelAssetRequired === true,
    ocrInferenceFutureOnly: true,
    modelAssetApprovalRequiredBeforeInference: true,
  }
}

function buildLatencyMemoryCostReport(generated, dockerBuildReport, paddlePaddleReport, paddleOcrReport) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.cpuLatencyMemoryCost.v1',
    generatedAt: generated,
    dockerBuildDurationMs: dockerBuildReport.durationMs ?? null,
    paddlePaddleImportVersionDurationMs: paddlePaddleReport.importVersion?.durationMs ?? null,
    paddlePaddleTensorDeviceDurationMs: paddlePaddleReport.tensorDevice?.durationMs ?? null,
    paddleOcrImportApiDurationMs: paddleOcrReport.importApi?.durationMs ?? null,
    memoryNotes:
      'No Docker stats sampling was used. This phase records bounded command latency and keeps heavy OCR inference/model loading out of scope.',
    costTier: 'cpu_probe_only_local_docker',
    gpuUsed: false,
    gpuApprovalNeededForHeavyOcrWorkloads: true,
  }
}

function cleanupArtifacts(execute, dockerBuildReport) {
  const before = Object.fromEntries(cleanupOutputs.map((output) => [output, existsSync(join(repoRoot, output))]))
  let imageCleanup = {
    command: `docker image rm ${imageTag}`,
    exitCode: null,
    notRunReason: 'image_not_built_or_not_execute_mode',
  }
  if (execute && dockerBuildReport.exitCode === 0) {
    imageCleanup = run('docker', ['image', 'rm', imageTag], { timeout: 120000 })
  }
  if (execute) {
    for (const output of cleanupOutputs) rmSync(join(repoRoot, output), { recursive: true, force: true })
  }
  const after = Object.fromEntries(cleanupOutputs.map((output) => [output, existsSync(join(repoRoot, output))]))
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.artifactCleanup.v1',
    before,
    after,
    cleanupCommand: `rm -rf ${cleanupOutputs.join(' ')}`,
    generatedOutputsCleaned: Object.values(after).every((present) => present === false),
    localImageCleanupCommand: imageCleanup.command,
    localImageCleanupExitCode: imageCleanup.exitCode ?? null,
    localImageCleanupNotRunReason: imageCleanup.notRunReason || null,
    localImageCleanupAllowedFailure:
      imageCleanup.exitCode === 1 && /No such image/i.test(`${imageCleanup.stderrSummary}\n${imageCleanup.stdoutSummary}`),
    dockerImagePushed: false,
  }
}

function protectedDiffs() {
  return [
    ...git(['diff', '--name-only', '--', ...protectedNoDiffFiles]).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles]).split('\n').filter(Boolean),
  ]
}

export function forbiddenOutputsPresent() {
  return cleanupOutputs.filter((output) => existsSync(join(repoRoot, output)))
}

export function protectedFilesHaveNoDiff() {
  return protectedDiffs().length === 0
}

function walkFiles(relativeDir) {
  const root = join(repoRoot, relativeDir)
  const files = []
  if (!existsSync(root)) return files
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const fullPath = join(dir, name)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) walk(fullPath)
      else files.push(fullPath)
    }
  }
  walk(root)
  return files
}

function runSafetyScan(generated, cleanupReport) {
  const changedProtectedFiles = [...new Set(protectedDiffs())]
  const forbiddenOutputs = forbiddenOutputsPresent()
  const findings = []
  const filesToScan = [
    ...walkFiles(reportDir),
    ...['docs/cross-chat', 'docs/open-source-tool-stack/owner-registry'].flatMap((dir) => walkFiles(dir)),
  ]
  for (const file of filesToScan) {
    const relativeFile = file.replace(`${repoRoot}/`, '')
    const extension = /\.[^.\\/]+$/.exec(file)?.[0]?.toLowerCase() || ''
    if (forbiddenArtifactExtensions.has(extension)) {
      findings.push({ type: 'forbidden_artifact_extension', file: relativeFile, extension })
      continue
    }
    const stat = statSync(file)
    if (stat.size > 1024 * 1024) continue
    const text = readFileSync(file, 'utf8')
    for (const pattern of secretPatterns) {
      if (pattern.test(text)) {
        findings.push({ type: 'secret_like_pattern', file: relativeFile })
        break
      }
    }
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.safetyScan.v1',
    generatedAt: generated,
    forbiddenOutputsPresent: forbiddenOutputs,
    changedProtectedFiles,
    forbiddenFindings: findings,
    packageLockHash: hashFile('package-lock.json'),
    requirementsHash: hashFile(requirementsPath),
    dockerfileHash: hashFile(dockerfilePath),
    generatedOutputsCommitted: false,
    modelFilesCommitted: false,
    mediaArtifactsCommitted: false,
    dockerImagePushed: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    cleanupPassed: cleanupReport.generatedOutputsCleaned === true,
    passed:
      forbiddenOutputs.length === 0 &&
      changedProtectedFiles.length === 0 &&
      findings.length === 0 &&
      cleanupReport.generatedOutputsCleaned === true,
  }
}

function deriveDecision({
  sourceTargetCheck,
  hydrationReport,
  generationReport,
  scanReport,
  dockerBuildReport,
  paddlePaddleReport,
  paddleOcrReport,
  cleanupReport,
  safetyReport,
}) {
  if (sourceTargetCheck.sourceTargetValid !== true) return sourceTargetDriftDecision
  if (hydrationReport.packageFilesUnchanged !== true) return dependencyHydrationDecision
  if (generationReport.allCommandsPassed !== true || generationReport.allOutputsPresent !== true) {
    return buildContextGenerationDecision
  }
  if (scanReport.passed !== true) return artifactScanDecision
  if (dockerBuildReport.exitCode !== 0 || dockerBuildReport.exactApprovedCommandUsed !== true) {
    return dockerBuildDecision
  }
  if (paddlePaddleReport.importVersionProven !== true || paddlePaddleReport.tensorDeviceProven !== true) {
    return paddlePaddleDecision
  }
  if (paddleOcrReport.modelAssetRequired === true) return modelAssetRequiredDecision
  if (paddleOcrReport.importApiProven !== true) return paddleOcrDecision
  if (cleanupReport.generatedOutputsCleaned !== true) return cleanupDecision
  if (safetyReport.passed !== true) return safetyScanDecision
  return passDecision
}

function nextPromptForDecision(decision) {
  if (decision === passDecision) return qaNextPrompt
  if (decision === modelAssetDecision || decision === modelAssetRequiredDecision) return modelAssetNextPrompt
  return blockerNextPrompt
}

function buildStatusMatrix(generated, decision, paddlePaddleReport, paddleOcrReport) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.statusMatrix.v1',
    generatedAt: generated,
    decision,
    tools: [
      {
        id: 'paddlepaddle',
        name: 'PaddlePaddle',
        packageDeclared: true,
        dockerBuildPassed: paddlePaddleReport.skipped !== true,
        importVersionProven: paddlePaddleReport.importVersionProven === true,
        apiTensorProofProven: paddlePaddleReport.tensorDeviceProven === true,
        ocrInferenceRun: false,
        modelAssetsRequired: false,
        modelAssetsDownloaded: false,
        gpuUsed: false,
        boundedCpuProofAcceptedForQaReview:
          paddlePaddleReport.importVersionProven === true && paddlePaddleReport.tensorDeviceProven === true,
        blocker:
          paddlePaddleReport.importVersionProven === true && paddlePaddleReport.tensorDeviceProven === true
            ? null
            : 'paddlepaddle_import_or_tensor_api_not_proven',
      },
      {
        id: 'paddleocr',
        name: 'PaddleOCR',
        packageDeclared: true,
        dockerBuildPassed: paddleOcrReport.skipped !== true,
        importVersionProven: paddleOcrReport.importApiProven === true,
        apiTensorProofProven: paddleOcrReport.importApiProven === true,
        ocrInferenceRun: false,
        modelAssetsRequired: paddleOcrReport.modelAssetRequired === true,
        modelAssetsDownloaded: false,
        gpuUsed: false,
        boundedCpuProofAcceptedForQaReview: paddleOcrReport.importApiProven === true,
        blocker:
          paddleOcrReport.importApiProven === true
            ? null
            : paddleOcrReport.modelAssetRequired === true
              ? 'model_asset_required_for_api_shape'
              : 'paddleocr_import_or_api_shape_not_proven',
      },
    ],
  }
}

function buildDecisionReport(generated, decision, nextPrompt) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.decision.v1',
    generatedAt: generated,
    decision,
    sourceSha: git(['rev-parse', 'HEAD']),
    ownerId,
    imageTag,
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    targetTools: targetTools.map((tool) => tool.id),
    nextPrompt,
    canonicalAcceptedProvenBoundedBeforeMilestone3: 12,
    newlyProofedCpuEvidencePendingQa: decision === passDecision ? 2 : 0,
    acceptedProvenBoundedTotalPendingQa: decision === passDecision ? 14 : 12,
    canonicalTrackBStatusCountsRemainPendingQa: true,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    cpuOnly: true,
    gpuRunInThisPhase: false,
    dependencyHydrationRun: false,
    buildContextGenerationRun: false,
    pipInstallRunOnHost: false,
    npmInstallRunOnHost: false,
    npmRebuildRunOnHost: false,
    packageLockMutationAllowed: false,
    requirementsMutationAllowed: false,
    dockerfileMutationAllowed: false,
    dockerImagePushRun: false,
    dockerBuildRunInThisPhase: true,
    containerOnlyToolProofs: true,
    ocrInferenceRunInThisPhase: false,
    modelDownloadRunInThisPhase: false,
    modelAssetCopyRunInThisPhase: false,
    modelAssetUploadRunInThisPhase: false,
    ffmpegFfprobeCommandRunInThisPhase: false,
    otherTrackBToolsRunInThisPhase: false,
    realUserMediaUsed: false,
    realUserDocumentsUsed: false,
    mediaProcessingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    routeProviderRuntimeAccepted: false,
    supabaseGcsPublicDeliveryAccepted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptExecutionAccepted: false,
    betaProductionAccepted: false,
    supabaseClassification: supabaseClassification(),
  }
}

function buildReports({ execute = false } = {}) {
  if (execute) assertConfirmations()
  const generated = generatedAt()
  const sourceAudit = buildSourceAudit(generated)
  const sourceTargetCheck = buildSourceTargetCheck(generated)
  const buildContextReview = buildBuildContextReview(generated)
  const hydrationReport = runDependencyHydration(execute)
  const generationReport = buildBuildContextGenerationReport(generated)
  const scanReport = buildGeneratedArtifactScan(generated)
  const dockerBuildReport = runDockerBuild(execute, sourceTargetCheck)
  const paddlePaddleReport = runPaddlePaddleProof(execute, dockerBuildReport)
  const paddleOcrReport = runPaddleOcrProof(execute, dockerBuildReport, paddlePaddleReport)
  const boundaryReport = buildModelOcrBoundary(generated, paddleOcrReport)
  const latencyReport = buildLatencyMemoryCostReport(
    generated,
    dockerBuildReport,
    paddlePaddleReport,
    paddleOcrReport,
  )
  const cleanupReport = cleanupArtifacts(execute, dockerBuildReport)
  const safetyReport = runSafetyScan(generated, cleanupReport)
  const decision = deriveDecision({
    sourceTargetCheck,
    hydrationReport,
    generationReport,
    scanReport,
    dockerBuildReport,
    paddlePaddleReport,
    paddleOcrReport,
    cleanupReport,
    safetyReport,
  })
  const nextPrompt = nextPromptForDecision(decision)
  const decisionReport = buildDecisionReport(generated, decision, nextPrompt)
  return {
    sourceAudit: { ...sourceAudit, decision, nextPrompt },
    sourceTargetCheck: { ...sourceTargetCheck, decision },
    buildContextReview: { ...buildContextReview, decision },
    hydrationReport: { ...hydrationReport, generatedAt: generated, decision },
    generationReport: { ...generationReport, decision },
    scanReport: { ...scanReport, decision },
    dockerBuildReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.dockerBuild.v1',
      generatedAt: generated,
      decision,
      ...dockerBuildReport,
    },
    paddlePaddleReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.paddlePaddleProof.v1',
      generatedAt: generated,
      decision,
      ...paddlePaddleReport,
    },
    paddleOcrReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.paddleOcrApiProof.v1',
      generatedAt: generated,
      decision,
      ...paddleOcrReport,
    },
    boundaryReport: { ...boundaryReport, decision },
    latencyReport: { ...latencyReport, decision },
    cleanupReport: { ...cleanupReport, generatedAt: generated, decision },
    safetyReport: { ...safetyReport, decision },
    statusMatrix: buildStatusMatrix(generated, decision, paddlePaddleReport, paddleOcrReport),
    decisionReport,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.readiness.v1',
      generatedAt: generated,
      decision,
      readyForMilestone3CpuQaReview: decision === passDecision,
      readyForModelAssetApproval: decision === modelAssetDecision || decision === modelAssetRequiredDecision,
      readyForBlockerFollowup: ![passDecision, modelAssetDecision, modelAssetRequiredDecision].includes(decision),
      readyForOcrInference: false,
      readyForGpuExecution: false,
      readyForBetaProduction: false,
      nextPrompt,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.privateArtifactManifest.v1',
      generatedAt: generated,
      decision,
      reportDirectory: reportDir,
      localDockerImageTag: imageTag,
      localDockerImagePushed: false,
      modelFilesCommitted: false,
      mediaFilesCommitted: false,
      generatedBuildContextOutputsCommitted: false,
      rawUserMediaAccessed: false,
      rawUserDocumentsAccessed: false,
      secretsPrinted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      supabaseClassification: supabaseClassification(),
    },
    validationResults: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuExecution.validationResults.v1',
      generatedAt: generated,
      decision,
      validationMode: 'container_cpu_import_api_shape_proof_with_no_model_assets',
      expectedDiagnostics: [
        'trackb-media-oss:milestone-3-ocr-ml-cpu-execution:diagnostics',
        'trackb-media-oss:milestone-3-ocr-ml-cpu-gpu-review:diagnostics',
        'trackb-media-oss:milestone-2-qa-review:diagnostics',
        'trackb-media-oss:milestone-2-video-analysis-execution:diagnostics',
        'trackb-media-oss:milestone-2-video-analysis-approval:diagnostics',
        'trackb-media-oss:milestone-1-qa-review:diagnostics',
        'trackb-media-oss:milestone-1-tesseract-fixture-proof-followup:diagnostics',
        'trackb-media-oss:milestone-1-build-context-blocker-followup:diagnostics',
        'trackb-media-oss:milestone-1-system-packaging-execution:diagnostics',
        'trackb-media-oss:milestone-1-system-packaging-approval:diagnostics',
        'trackb-media-oss:milestone-1-low-risk-metadata-tooling:diagnostics',
        'trackb-media-oss:install-proof-milestone-plan:diagnostics',
        'open-source-tool-owner-registry:trackb-media-oss-steward:diagnostics',
        'open-source-tool-stack:batch-2-planning-after-batch-1-rollup:diagnostics',
        'open-source-tool-stack:owner-lane-reconciliation-after-batch-1-rollup:diagnostics',
        'open-source-tool-stack:batch-1-final-rollup-after-ffmpeg-ffprobe-proof:diagnostics',
        'git diff --check',
        'git diff --cached --check',
      ],
    },
  }
}

export function writeTrackBMilestone3OcrMlCpuExecutionArtifacts(options = {}) {
  const reports = buildReports(options)
  writeReports(reports)
  writeNextPrompt(reports)
  updateStatusDocs(reports)
  return reports
}

export function readTrackBMilestone3OcrMlCpuExecutionArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    sourceTargetCheck: readJson(`${reportDir}/source-target-check.json`),
    buildContextReview: readJson(`${reportDir}/build-context-command-review.json`),
    hydrationReport: readJson(`${reportDir}/dependency-hydration-report.json`),
    generationReport: readJson(`${reportDir}/build-context-generation-report.json`),
    scanReport: readJson(`${reportDir}/generated-artifact-scan-report.json`),
    dockerBuildReport: readJson(`${reportDir}/docker-build-report.json`),
    paddlePaddleReport: readJson(`${reportDir}/paddlepaddle-proof-report.json`),
    paddleOcrReport: readJson(`${reportDir}/paddleocr-api-proof-report.json`),
    boundaryReport: readJson(`${reportDir}/model-ocr-boundary-verification.json`),
    latencyReport: readJson(`${reportDir}/cpu-latency-memory-cost-report.json`),
    cleanupReport: readJson(`${reportDir}/artifact-cleanup-report.json`),
    safetyReport: readJson(`${reportDir}/safety-scan-report.json`),
    statusMatrix: readJson(`${reportDir}/milestone-3-cpu-status-matrix.json`),
    decisionReport: readJson(`${reportDir}/milestone-3-ocr-ml-cpu-execution-decision.json`),
    readinessReport: readJson(`${reportDir}/readiness-report.json`),
    privateArtifactManifest: readJson(`${reportDir}/private-artifact-manifest.json`),
    validationResults: readJson(`${reportDir}/validation-results.json`),
  }
}

function writeReports(reports) {
  writeJson(`${reportDir}/source-of-truth-audit.json`, reports.sourceAudit)
  writeJson(`${reportDir}/source-target-check.json`, reports.sourceTargetCheck)
  writeJson(`${reportDir}/build-context-command-review.json`, reports.buildContextReview)
  writeJson(`${reportDir}/dependency-hydration-report.json`, reports.hydrationReport)
  writeJson(`${reportDir}/build-context-generation-report.json`, reports.generationReport)
  writeJson(`${reportDir}/generated-artifact-scan-report.json`, reports.scanReport)
  writeJson(`${reportDir}/docker-build-report.json`, reports.dockerBuildReport)
  writeJson(`${reportDir}/paddlepaddle-proof-report.json`, reports.paddlePaddleReport)
  writeJson(`${reportDir}/paddleocr-api-proof-report.json`, reports.paddleOcrReport)
  writeJson(`${reportDir}/model-ocr-boundary-verification.json`, reports.boundaryReport)
  writeJson(`${reportDir}/cpu-latency-memory-cost-report.json`, reports.latencyReport)
  writeJson(`${reportDir}/artifact-cleanup-report.json`, reports.cleanupReport)
  writeJson(`${reportDir}/safety-scan-report.json`, reports.safetyReport)
  writeJson(`${reportDir}/milestone-3-cpu-status-matrix.json`, reports.statusMatrix)
  writeJson(`${reportDir}/milestone-3-ocr-ml-cpu-execution-decision.json`, reports.decisionReport)
  writeJson(`${reportDir}/readiness-report.json`, reports.readinessReport)
  writeJson(`${reportDir}/private-artifact-manifest.json`, reports.privateArtifactManifest)
  writeJson(`${reportDir}/validation-results.json`, reports.validationResults)

  const decision = reports.decisionReport.decision
  const rows = reports.statusMatrix.tools
    .map(
      (tool) =>
        `| \`${tool.id}\` | ${tool.importVersionProven} | ${tool.apiTensorProofProven} | ${tool.ocrInferenceRun} | ${tool.modelAssetsDownloaded} | ${tool.gpuUsed} | ${tool.boundedCpuProofAcceptedForQaReview} | ${tool.blocker || 'none'} |`,
    )
    .join('\n')
  writeText(
    `${reportDir}/source-of-truth-audit.md`,
    `# Track B Milestone 3 OCR/ML CPU Execution Source Audit\n\nDecision: \`${decision}\`.\n\nSource SHA: \`${reports.sourceAudit.sourceSha}\`.\n\nPR #578 is merged source-of-truth approval for CPU-only PaddleOCR/PaddlePaddle import/API-shape proof against \`${dockerfilePath}\`. PR #574/#571/#567/#563/#559/#557/#551/#549/#546/#545/#542 remain merged supporting evidence. PR #543 and historical OCR PRs #51/#56 remain context-only.\n`,
  )
  writeText(
    `${reportDir}/source-target-check.md`,
    `# Source Target Check\n\nTarget Dockerfile: \`${dockerfilePath}\`.\n\nTarget requirements: \`${requirementsPath}\`.\n\nPinned PaddlePaddle declared: \`${reports.sourceTargetCheck.packagePresence['paddlepaddle==3.0.0']}\`.\n\nPinned PaddleOCR declared: \`${reports.sourceTargetCheck.packagePresence['paddleocr==3.0.0']}\`.\n\nRuntime guard env vars declared: \`${reports.sourceTargetCheck.allRuntimeGuardsDeclared}\`.\n`,
  )
  writeText(
    `${reportDir}/build-context-command-review.md`,
    `# Build Context Command Review\n\nBuild context generation required: \`${reports.buildContextReview.buildContextGenerationRequired}\`.\n\nReason: ${reports.buildContextReview.reason}\n`,
  )
  writeText(
    `${reportDir}/dependency-hydration-report.md`,
    `# Dependency Hydration Report\n\nSkipped: \`${reports.hydrationReport.skipped}\`.\n\nReason: \`${reports.hydrationReport.skipReason}\`.\n\nPackage files unchanged: \`${reports.hydrationReport.packageFilesUnchanged}\`.\n`,
  )
  writeText(
    `${reportDir}/build-context-generation-report.md`,
    `# Build Context Generation Report\n\nSkipped: \`${reports.generationReport.skipped}\`.\n\nReason: \`${reports.generationReport.skipReason}\`.\n\nAll commands passed: \`${reports.generationReport.allCommandsPassed}\`.\n`,
  )
  writeText(
    `${reportDir}/generated-artifact-scan-report.md`,
    `# Generated Artifact Scan Report\n\nPassed: \`${reports.scanReport.passed}\`.\n\nForbidden findings: ${reports.scanReport.forbiddenFindings.length ? reports.scanReport.forbiddenFindings.map((finding) => `\`${finding.type}\``).join(', ') : 'none'}.\n`,
  )
  writeText(
    `${reportDir}/docker-build-report.md`,
    `# Docker Build Report\n\nCommand: \`${reports.dockerBuildReport.command}\`.\n\nExit code: \`${reports.dockerBuildReport.exitCode ?? 'not_run'}\`.\n\nDocker image push: \`false\`.\n`,
  )
  writeText(
    `${reportDir}/paddlepaddle-proof-report.md`,
    `# PaddlePaddle Proof Report\n\nImport/version proven: \`${reports.paddlePaddleReport.importVersionProven}\`.\n\nModel-free tensor/device proof proven: \`${reports.paddlePaddleReport.tensorDeviceProven}\`.\n\nGPU execution: \`false\`.\n`,
  )
  writeText(
    `${reportDir}/paddleocr-api-proof-report.md`,
    `# PaddleOCR API Proof Report\n\nImport/API shape proven: \`${reports.paddleOcrReport.importApiProven}\`.\n\nOCR inference run: \`false\`.\n\nModel download/copy/upload run: \`false\`.\n`,
  )
  writeText(
    `${reportDir}/model-ocr-boundary-verification.md`,
    `# Model/OCR Boundary Verification\n\nOCR inference run: \`false\`.\n\nModel downloads: \`false\`.\n\nModel copies/uploads: \`false\`.\n\nOCR inference remains future-only pending separate model-asset approval.\n`,
  )
  writeText(
    `${reportDir}/cpu-latency-memory-cost-report.md`,
    `# CPU Latency, Memory, And Cost Report\n\nDocker build duration ms: \`${reports.latencyReport.dockerBuildDurationMs ?? 'not_run'}\`.\n\nPaddlePaddle import/version duration ms: \`${reports.latencyReport.paddlePaddleImportVersionDurationMs ?? 'not_run'}\`.\n\nPaddlePaddle tensor/device duration ms: \`${reports.latencyReport.paddlePaddleTensorDeviceDurationMs ?? 'not_run'}\`.\n\nPaddleOCR import/API duration ms: \`${reports.latencyReport.paddleOcrImportApiDurationMs ?? 'not_run'}\`.\n\nGPU used: \`false\`.\n`,
  )
  writeText(
    `${reportDir}/artifact-cleanup-report.md`,
    `# Artifact Cleanup Report\n\nCleanup command: \`${reports.cleanupReport.cleanupCommand}\`.\n\nGenerated outputs cleaned: \`${reports.cleanupReport.generatedOutputsCleaned}\`.\n\nLocal image cleanup command: \`${reports.cleanupReport.localImageCleanupCommand}\`.\n\nLocal image cleanup exit: \`${reports.cleanupReport.localImageCleanupExitCode ?? 'not_run'}\`.\n`,
  )
  writeText(
    `${reportDir}/safety-scan-report.md`,
    `# Safety Scan Report\n\nPassed: \`${reports.safetyReport.passed}\`.\n\nForbidden outputs present after cleanup: ${reports.safetyReport.forbiddenOutputsPresent.join(', ') || 'none'}.\n\nProtected file drift: ${reports.safetyReport.changedProtectedFiles.join(', ') || 'none'}.\n`,
  )
  writeText(
    `${reportDir}/milestone-3-cpu-status-matrix.md`,
    `# Milestone 3 CPU Status Matrix\n\n| Tool | Import/version proven | API/tensor proof proven | OCR inference run | Model assets downloaded | GPU used | Accepted for QA review | Blocker |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n${rows}\n`,
  )
  writeText(
    `${reportDir}/milestone-3-ocr-ml-cpu-execution-decision.md`,
    `# Milestone 3 OCR/ML CPU Execution Decision\n\nDecision: \`${decision}\`.\n\nNext prompt: \`${reports.decisionReport.nextPrompt}\`.\n\nCanonical Track B accepted/proven totals remain at the Milestone 2 QA state until the next QA review accepts this CPU evidence. End-to-end product-ready tools remain \`0\`, and no 40+ installed/proven end-to-end claim is allowed.\n\nOCR inference, model asset download/copy/upload, GPU execution, media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.\n`,
  )
  writeText(
    `${reportDir}/validation-results.md`,
    `# Validation Results\n\nGenerated decision: \`${decision}\`.\n\nValidation commands expected before commit include the new Milestone 3 CPU diagnostics, Track B predecessor diagnostics, Batch 2 planning, owner-lane reconciliation, Batch 1 final rollup diagnostics, and diff checks.\n`,
  )
}

function writeNextPrompt(reports) {
  const decision = reports.decisionReport.decision
  rmSync(join(repoRoot, qaNextPromptPath), { force: true })
  rmSync(join(repoRoot, modelAssetPromptPath), { force: true })
  rmSync(join(repoRoot, blockerPromptPath), { force: true })
  if (decision === passDecision) {
    writeText(
      qaNextPromptPath,
      '# TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW\n\nReview the Track B Milestone 3 CPU-only import/version/API-shape evidence for PaddlePaddle and PaddleOCR. Keep OCR inference, model downloads/copies/uploads, GPU execution, real media/documents, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, beta, and production blocked unless a later explicit approval changes scope.\n',
    )
  } else if (decision === modelAssetDecision || decision === modelAssetRequiredDecision) {
    writeText(
      modelAssetPromptPath,
      '# TRACKB_MEDIA_OSS_MILESTONE_3_MODEL_ASSET_APPROVAL\n\nReview exact model asset provenance, checksums, private storage, and no-network execution policy before any PaddleOCR inference can be approved. Do not run OCR inference, download/copy/upload models, or unlock GPU/runtime/product scope in this approval phase.\n',
    )
  } else {
    writeText(
      blockerPromptPath,
      '# TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_BLOCKER_FOLLOWUP\n\nResolve the blocked Track B Milestone 3 CPU execution evidence before any rerun. Keep scope limited to the OCR runtime target, local Docker build, and container-only PaddlePaddle/PaddleOCR import/API-shape checks with no model assets, OCR inference, GPU, media, or runtime/product unlock.\n',
    )
  }
}

function updateStatusDocs(reports) {
  const body = `
TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION:

- Decision: \`${reports.decisionReport.decision}\`
- Owner: \`${ownerId}\`
- Target: \`${dockerfilePath}\` with \`${requirementsPath}\`.
- Target tools: PaddlePaddle and PaddleOCR only.
- Build-context generation: not required for the OCR runtime target.
- Local image tag: \`${imageTag}\`
- Canonical Track B counts remain pending QA: 16 owned tools, 12 bounded accepted/proven tools, 4 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- Newly proofed CPU evidence pending QA: \`${reports.decisionReport.newlyProofedCpuEvidencePendingQa}\`.
- Do not claim 40+ tools are installed/proven end-to-end.
- No OCR inference, model download/copy/upload, GPU execution, real media/documents, FFmpeg/FFprobe, other Track B tool execution, render/export, workers/routes/providers, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production scope is accepted.
- Next prompt: \`${reports.decisionReport.nextPrompt}\`
- Supabase classification: no write / environment none / SQL none / migration no.
`
  for (const statusPath of [
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  ]) {
    replaceOrAppend(
      statusPath,
      '<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_STATUS:start -->',
      '<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_STATUS:end -->',
      body,
    )
  }

  const statusPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  const status = readJson(statusPath)
  status.milestone3OcrMlCpuExecution = {
    decision: reports.decisionReport.decision,
    reportKey: 'trackb_milestone_3_ocr_ml_cpu_execution_reports',
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    imageTag,
    tools: reports.statusMatrix.tools,
    canonicalCountsRemainPendingQa: true,
    canonicalAcceptedProvenBoundedBeforeMilestone3: 12,
    newlyProofedCpuEvidencePendingQa: reports.decisionReport.newlyProofedCpuEvidencePendingQa,
    acceptedProvenBoundedTotalPendingQa: reports.decisionReport.acceptedProvenBoundedTotalPendingQa,
    nextPrompt: reports.decisionReport.nextPrompt,
    ocrInferenceAccepted: false,
    modelAssetOperationsAccepted: false,
    gpuExecutionAccepted: false,
    mediaProcessingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    betaProductionAccepted: false,
  }
  writeJson(statusPath, status)
}
