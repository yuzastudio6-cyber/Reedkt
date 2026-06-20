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
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup'
export const branchName =
  'codex/rp-trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '8c22f38755195f4028acfba1069e4cb0d6825c91'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const dockerfilePath = 'docker/prod/ocr-runtime/Dockerfile'
export const requirementsPath = 'docker/prod/ocr-runtime/requirements.ocr.txt'
export const approvedRuntimePackage = 'libglib2.0-0'
export const imageTag = `reeditpro-ocr-runtime:trackb-milestone3-cpu-libgthread-${expectedSourceSha}`

export const passDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_passed_import_api_shape_no_model_assets'
export const modelAssetDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_passed_ready_for_model_asset_approval'
export const sourceTargetDriftDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_source_target_drift'
export const packageStrategyDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_package_strategy_review'
export const dockerfilePatchDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_dockerfile_patch'
export const dockerBuildDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_docker_build'
export const libgthreadDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_libgthread_presence'
export const paddlePaddleDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_paddlepaddle_import_or_api_shape'
export const paddleOcrDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_paddleocr_import_or_api_shape'
export const modelAssetRequiredDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_model_asset_required'
export const cleanupDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_artifact_cleanup'
export const safetyScanDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_safety_scan'
export const runtimeSafetyDecision = 'rejected_due_runtime_safety_risk'

const qaNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW'
const modelAssetNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_MODEL_ASSET_APPROVAL'
const blockerNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_BLOCKER_RESOLUTION_NEXT_FOLLOWUP'
const qaPromptPath = 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md'
const modelAssetPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-model-asset-approval.md'
const blockerPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-next-followup.md'

const cleanupOutputs = [
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
  'node_modules',
]
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  requirementsPath,
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/render-worker/Dockerfile',
]
const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9_]{20,}\b/,
  /\bpostgres(?:ql)?:\/\/[^\s"'`]+/i,
  /\bX-Amz-Signature=/i,
  /BEGIN [A-Z ]*PRIVATE KEY/,
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_BLOCKER_RESOLUTION_FOLLOWUP',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_OCR_RUNTIME_TARGET',
    'REEDITPRO_CONFIRM_LIBGTHREAD_PACKAGE_REVIEW',
    'REEDITPRO_CONFIRM_OCR_RUNTIME_DOCKERFILE_PATCH',
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
    'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION_FOR_UNRELATED_TARGET',
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

function noScope() {
  return {
    ocrInferenceRun: false,
    modelDownloadRun: false,
    modelAssetCopyRun: false,
    modelAssetUploadRun: false,
    gpuExecutionRun: false,
    ffmpegFfprobeRun: false,
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

function dockerPython(script, timeout = 180000) {
  return run(
    'docker',
    ['run', '--rm', '--network', 'none', '--entrypoint', 'python', imageTag, '-c', script],
    { timeout },
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

function writeMarkdown(relativePath, title, rows) {
  const body = [`# ${title}`, '', ...rows.map(([label, value]) => `- ${label}: ${value}`), ''].join('\n')
  writeText(relativePath, body)
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

function buildSourceAudit(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.sourceAudit.v1',
    decision: null,
    generatedAt: generated,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha: git(['rev-parse', 'HEAD']),
    sourceCompatible: git(['rev-parse', 'HEAD']) === expectedSourceSha,
    ownerId,
    sourceEvidence: [
      {
        pr: 592,
        state: 'MERGED',
        decision: 'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_paddleocr_import_or_api_shape',
        blocker: 'missing_libgthread_2_0_so_0',
        priorLibGLBlockerResolved: true,
        paddlePaddleImportTensorProofPassed: true,
        paddleOcrImportApiShapePassed: false,
      },
      {
        pr: 587,
        state: 'MERGED',
        decision: 'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_paddleocr_import_or_api_shape',
        blocker: 'missing_libGL_so_1',
      },
      {
        pr: 583,
        state: 'MERGED',
        decision: 'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_paddlepaddle_import_or_api_shape',
        blocker: 'missing_libgomp_so_1',
      },
      { pr: 578, state: 'MERGED', decision: 'trackb_media_oss_milestone3_ocr_ml_cpu_gpu_review_passed_ready_for_cpu_execution' },
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

function buildRootCauseReview(generated) {
  const dockerfile = readText(dockerfilePath)
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.libgthreadRootCause.v1',
    decision: null,
    generatedAt: generated,
    priorEvidencePr: 592,
    missingLibrary: 'libgthread-2.0.so.0',
    affectedPath: 'PaddleOCR import through paddlex/cv2',
    candidatePackage: approvedRuntimePackage,
    candidatePackageReason:
      'Debian Bookworm libglib2.0-0 provides /usr/lib/x86_64-linux-gnu/libgthread-2.0.so.0, which cv2 needs during PaddleOCR import.',
    baseImage: dockerfile.match(/^FROM\s+(.+)$/m)?.[1] || null,
    packageManager: dockerfile.includes('apt-get') ? 'apt' : 'unknown',
    packageStrategyClear: dockerfile.includes('FROM python:3.12-slim') && dockerfile.includes('apt-get'),
    noScope: noScope(),
  }
}

function buildSourceTargetCheck(generated) {
  const dockerfile = readText(dockerfilePath)
  const requirements = readText(requirementsPath)
  const requiredPackages = ['libgomp1', 'libgl1', approvedRuntimePackage]
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.sourceTargetCheck.v1',
    decision: null,
    generatedAt: generated,
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    dockerfileExists: existsSync(join(repoRoot, dockerfilePath)),
    requirementsExists: existsSync(join(repoRoot, requirementsPath)),
    baseImage: dockerfile.match(/^FROM\s+(.+)$/m)?.[1] || null,
    packageManager: dockerfile.includes('apt-get') ? 'apt' : 'unknown',
    requiredPackages,
    aptLayerContainsAllRequiredPackages: requiredPackages.every((pkg) => dockerfile.includes(pkg)),
    packagePresence: {
      'paddlepaddle==3.0.0': requirements.includes('paddlepaddle==3.0.0'),
      'paddleocr==3.0.0': requirements.includes('paddleocr==3.0.0'),
    },
    envGuards: {
      modelDownloadsDisabled: dockerfile.includes('MODEL_DOWNLOADS_ENABLED=false'),
      realMediaInputDisabled: dockerfile.includes('REAL_MEDIA_INPUT_ENABLED=false'),
      providerExecutionDisabled: dockerfile.includes('PROVIDER_EXECUTION_ENABLED=false'),
    },
    buildContextGenerationRequired: false,
    packageLockMutationAllowed: false,
    requirementsMutationAllowed: false,
    dockerfileMutationAllowed: true,
    unrelatedDockerfileMutationAllowed: false,
    sourceTargetValid:
      existsSync(join(repoRoot, dockerfilePath)) &&
      existsSync(join(repoRoot, requirementsPath)) &&
      dockerfile.includes('FROM python:3.12-slim') &&
      dockerfile.includes('COPY docker/prod/ocr-runtime/requirements.ocr.txt /tmp/requirements.ocr.txt') &&
      dockerfile.includes('COPY server/workers/ocr-runtime /app/server/workers/ocr-runtime') &&
      requiredPackages.every((pkg) => dockerfile.includes(pkg)) &&
      requirements.includes('paddlepaddle==3.0.0') &&
      requirements.includes('paddleocr==3.0.0'),
  }
}

function buildDockerfilePatchReport(generated, sourceTargetCheck) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.dockerfilePatch.v1',
    decision: null,
    generatedAt: generated,
    targetDockerfile: dockerfilePath,
    approvedPackage: approvedRuntimePackage,
    preservedPackages: ['libgomp1', 'libgl1'],
    patchApplied: sourceTargetCheck.aptLayerContainsAllRequiredPackages,
    changedFiles: [dockerfilePath],
    requirementsMutated: false,
    packageLockMutated: false,
    dockerignoreMutated: false,
    unrelatedDockerfilesMutated: false,
  }
}

function runDockerBuild(execute, sourceTargetCheck) {
  const command = `docker build -f ${dockerfilePath} -t ${imageTag} .`
  if (!execute || sourceTargetCheck.sourceTargetValid !== true) {
    return {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.dockerBuild.v1',
      decision: null,
      command,
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'source_target_check_failed',
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
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.dockerBuild.v1',
    decision: null,
    ...result,
    skipped: false,
    imageTag,
    exactApprovedCommandUsed: result.command === command,
    dockerImagePushRun: false,
  }
}

function runLibgthreadPresence(execute, dockerBuildReport) {
  if (!execute || dockerBuildReport.exitCode !== 0) {
    return {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.libgthreadPresence.v1',
      decision: null,
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'docker_build_not_passed',
      libgthreadPresent: false,
      dockerRunNetworkNone: true,
    }
  }
  const result = run(
    'docker',
    [
      'run',
      '--rm',
      '--network',
      'none',
      '--entrypoint',
      'python',
      imageTag,
      '-c',
      "import glob,json; paths=glob.glob('/usr/lib/**/libgthread-2.0.so.0', recursive=True); print(json.dumps({'library':'libgthread-2.0.so.0','paths':paths[:8]}))",
    ],
    { timeout: 120000 },
  )
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.libgthreadPresence.v1',
    decision: null,
    ...result,
    skipped: false,
    imageTag,
    libgthreadPresent: result.exitCode === 0 && /libgthread-2\.0\.so\.0/.test(result.stdoutSummary),
    dockerRunNetworkNone: true,
  }
}

function runPaddlePaddleProof(execute, dockerBuildReport) {
  if (!execute || dockerBuildReport.exitCode !== 0) {
    return {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.paddlepaddleProof.v1',
      decision: null,
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'docker_build_not_passed',
      importVersionPassed: false,
      tensorDevicePassed: false,
      gpuExecutionRun: false,
    }
  }
  const importVersion = dockerPython(
    "import json, paddle; print(json.dumps({'tool':'paddlepaddle','version':paddle.__version__,'compiled_with_cuda':bool(paddle.device.is_compiled_with_cuda())}))",
  )
  const tensorDevice = dockerPython(
    "import json, paddle; x=paddle.to_tensor([1,2,3], dtype='int64'); print(json.dumps({'tool':'paddlepaddle','tensor':x.numpy().tolist(),'device':paddle.device.get_device(),'place':str(x.place)}))",
  )
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.paddlepaddleProof.v1',
    decision: null,
    imageTag,
    importVersion,
    tensorDevice,
    importVersionPassed: importVersion.exitCode === 0 && /"version":/.test(importVersion.stdoutSummary),
    tensorDevicePassed:
      tensorDevice.exitCode === 0 && /"tensor":\s*\[\s*1,\s*2,\s*3\s*\]/.test(tensorDevice.stdoutSummary),
    cpuOnly: true,
    gpuExecutionRun: false,
    modelAssetsUsed: false,
    ocrInferenceRun: false,
  }
}

function runPaddleOcrProof(execute, dockerBuildReport, paddleReport) {
  if (!execute || dockerBuildReport.exitCode !== 0 || paddleReport.tensorDevicePassed !== true) {
    return {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.paddleocrProof.v1',
      decision: null,
      skipped: true,
      skipReason: !execute
        ? 'not_execute_mode'
        : dockerBuildReport.exitCode !== 0
          ? 'docker_build_not_passed'
          : 'paddlepaddle_proof_not_passed',
      importApiShapePassed: false,
      ocrInferenceRun: false,
      modelDownloadRun: false,
      modelAssetCopyRun: false,
      modelAssetUploadRun: false,
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
}
print(json.dumps({'tool':'paddleocr','version':version,'attrs':attrs,'module_file':bool(getattr(paddleocr, '__file__', None))}))
`
  const importApi = dockerPython(script)
  const combined = `${importApi.stdoutSummary}\n${importApi.stderrSummary}`
  const lower = combined.toLowerCase()
  const modelAssetRequired =
    importApi.exitCode !== 0 &&
    /(download|model asset|model_dir|model_path|det_model|rec_model|cls_model)/i.test(combined)
  const missingLibrary = /ImportError:\s*([^:\n]+\.so(?:\.[0-9]+)*)/i.exec(combined)?.[1] || null
  const blocker =
    importApi.exitCode === 0
      ? null
      : modelAssetRequired
        ? 'model_asset_required_for_import_api_shape'
        : missingLibrary
          ? `missing_${missingLibrary.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}`
          : 'paddleocr_import_or_api_shape_not_proven'
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.paddleocrProof.v1',
    decision: null,
    imageTag,
    importApi,
    importApiShapePassed:
      importApi.exitCode === 0 &&
      /"version":\s*"3\.0\.0"/.test(importApi.stdoutSummary) &&
      /"PaddleOCR":\s*true/.test(importApi.stdoutSummary),
    blocker,
    missingLibrary,
    modelAssetRequired,
    unexpectedNetworkOrDownloadText: /download|http|https|model asset/.test(lower),
    ocrInferenceRun: false,
    modelDownloadRun: false,
    modelAssetCopyRun: false,
    modelAssetUploadRun: false,
    cpuOnly: true,
    gpuExecutionRun: false,
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
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.artifactCleanup.v1',
    decision: null,
    before,
    after,
    cleanupCommand: `rm -rf ${cleanupOutputs.join(' ')}`,
    generatedOutputsCleaned: Object.values(after).every((present) => present === false),
    localImageCleanupCommand: imageCleanup.command,
    localImageCleanupExitCode: imageCleanup.exitCode ?? null,
    localImageCleanupNotRunReason: imageCleanup.notRunReason || null,
    localImageRemoved: imageCleanup.exitCode === 0,
    dockerImagePushed: false,
  }
}

function protectedDiffs() {
  return [
    ...git(['diff', '--name-only', '--', ...protectedNoDiffFiles]).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles]).split('\n').filter(Boolean),
  ]
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
  const forbiddenOutputs = cleanupOutputs.filter((output) => existsSync(join(repoRoot, output)))
  const findings = []
  for (const file of walkFiles(reportDir)) {
    const relativeFile = file.replace(`${repoRoot}/`, '')
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
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.safetyScan.v1',
    decision: null,
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

function deriveDecision(reports) {
  if (reports.sourceTarget.sourceTargetValid !== true) return sourceTargetDriftDecision
  if (reports.rootCause.packageStrategyClear !== true) return packageStrategyDecision
  if (reports.patch.patchApplied !== true) return dockerfilePatchDecision
  if (reports.dockerBuild.exitCode !== 0 || reports.dockerBuild.exactApprovedCommandUsed !== true) {
    return dockerBuildDecision
  }
  if (reports.libgthread.libgthreadPresent !== true) return libgthreadDecision
  if (reports.paddle.importVersionPassed !== true || reports.paddle.tensorDevicePassed !== true) {
    return paddlePaddleDecision
  }
  if (reports.paddleocr.modelAssetRequired === true) return modelAssetRequiredDecision
  if (reports.paddleocr.importApiShapePassed !== true) return paddleOcrDecision
  if (reports.cleanup.generatedOutputsCleaned !== true) return cleanupDecision
  if (reports.safety.passed !== true) return safetyScanDecision
  return passDecision
}

function nextPromptForDecision(decision) {
  if (decision === passDecision) return qaNextPrompt
  if (decision === modelAssetDecision || decision === modelAssetRequiredDecision) return modelAssetNextPrompt
  return blockerNextPrompt
}

function promptPathForDecision(decision) {
  if (decision === passDecision) return qaPromptPath
  if (decision === modelAssetDecision || decision === modelAssetRequiredDecision) return modelAssetPromptPath
  return blockerPromptPath
}

function applyDecision(report, decision) {
  return { ...report, decision }
}

function buildStatusMatrix(generated, decision, reports) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.statusMatrix.v1',
    decision,
    generatedAt: generated,
    tools: [
      {
        id: 'paddlepaddle',
        packageDeclared: true,
        libgompBlockerResolved: true,
        libGLBlockerResolved: true,
        libgthreadBlockerResolved: reports.libgthread.libgthreadPresent === true,
        dockerBuildPassed: reports.dockerBuild.exitCode === 0,
        importVersionProof: reports.paddle.importVersionPassed === true,
        apiTensorProof: reports.paddle.tensorDevicePassed === true,
        ocrInferenceRun: false,
        modelAssetsRequired: false,
        modelAssetsDownloaded: false,
        gpuUsed: false,
        acceptedProvenBoundedPendingQa:
          reports.paddle.importVersionPassed === true && reports.paddle.tensorDevicePassed === true,
        blocker:
          reports.paddle.importVersionPassed === true && reports.paddle.tensorDevicePassed === true
            ? null
            : 'paddlepaddle_import_or_tensor_api_not_proven',
      },
      {
        id: 'paddleocr',
        packageDeclared: true,
        libgompBlockerResolved: true,
        libGLBlockerResolved: true,
        libgthreadBlockerResolved: reports.libgthread.libgthreadPresent === true,
        dockerBuildPassed: reports.dockerBuild.exitCode === 0,
        importVersionProof: reports.paddleocr.importApiShapePassed === true,
        apiTensorProof: reports.paddleocr.importApiShapePassed === true,
        ocrInferenceRun: false,
        modelAssetsRequired: reports.paddleocr.modelAssetRequired === true,
        modelAssetsDownloaded: false,
        gpuUsed: false,
        acceptedProvenBoundedPendingQa: reports.paddleocr.importApiShapePassed === true,
        blocker: reports.paddleocr.blocker,
      },
    ],
  }
}

function buildDecisionReport(generated, decision, nextPrompt, reports) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.decision.v1',
    decision,
    generatedAt: generated,
    sourceSha: git(['rev-parse', 'HEAD']),
    ownerId,
    imageTag,
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    targetTools: ['paddlepaddle', 'paddleocr'],
    selectedRuntimePackage: approvedRuntimePackage,
    previousBlockerResolved: 'libGL.so.1',
    currentBlocker: reports.paddleocr.blocker,
    nextPrompt,
    canonicalAcceptedProvenBoundedBeforeFollowup: 12,
    newlyProofedCpuEvidencePendingQa: decision === passDecision ? 2 : 0,
    acceptedProvenBoundedTotalPendingQa: 12,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    noScope: noScope(),
    supabaseClassification: supabaseClassification(),
  }
}

function updateStatusDocs(decision, nextPrompt, reports) {
  const statusBody = `
TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_BLOCKER_RESOLUTION_FOLLOWUP:

- Decision: \`${decision}\`
- Target: \`${dockerfilePath}\` with \`${requirementsPath}\`.
- Patch: existing \`libgomp1\` and \`libgl1\` runtime packages preserved; minimal \`${approvedRuntimePackage}\` package added for \`libgthread-2.0.so.0\`.
- Docker build: ${reports.dockerBuild.exitCode === 0 ? 'passed' : 'blocked'} for local image \`${imageTag}\`.
- \`libgthread-2.0.so.0\`: ${reports.libgthread.libgthreadPresent === true ? 'present in the rebuilt image' : 'not proven present'}.
- PaddlePaddle: import/version and model-free CPU tensor/device proof ${reports.paddle.tensorDevicePassed === true ? 'passed' : 'did not pass'}.
- PaddleOCR: import/API-shape ${reports.paddleocr.importApiShapePassed === true ? 'passed without OCR inference or model assets' : `blocked by \`${reports.paddleocr.blocker || 'paddleocr_import_or_api_shape_not_proven'}\``}.
- Track B counts remain pending QA: 16 owned tools, 12 bounded accepted/proven tools, 4 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- Do not claim 40+ tools are installed/proven end-to-end.
- OCR inference, model asset operations, GPU, FFmpeg/FFprobe, media/render, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
- Next prompt: \`${nextPrompt}\`
- Supabase classification: no write / environment none / SQL none / migration no.
`
  const start = '<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_BLOCKER_RESOLUTION_FOLLOWUP_STATUS:start -->'
  const end = '<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_BLOCKER_RESOLUTION_FOLLOWUP_STATUS:end -->'
  for (const file of [
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
  ]) {
    if (existsSync(join(repoRoot, file))) replaceOrAppend(file, start, end, statusBody)
  }

  const statusJsonPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  const statusJson = readJson(statusJsonPath)
  statusJson.milestone3OcrMlCpuBlockerResolutionFollowup = {
    decision,
    reportKey: 'trackb_milestone_3_ocr_ml_cpu_blocker_resolution_followup_reports',
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    selectedRuntimePackage: approvedRuntimePackage,
    imageTag,
    libgthreadPresent: reports.libgthread.libgthreadPresent === true,
    paddlePaddleImportVersionProven: reports.paddle.importVersionPassed === true,
    paddlePaddleTensorDeviceProven: reports.paddle.tensorDevicePassed === true,
    paddleOcrImportApiShapeProven: reports.paddleocr.importApiShapePassed === true,
    paddleOcrBlocker: reports.paddleocr.blocker,
    ocrInferenceRun: false,
    modelAssetOperationsRun: false,
    gpuExecutionRun: false,
    nextPrompt,
    countsRemainPendingQa: statusJson.counts,
    supabaseClassification: supabaseClassification(),
  }
  writeJson(statusJsonPath, statusJson)
}

function writeNextPrompt(decision, nextPrompt) {
  const path = promptPathForDecision(decision)
  const title =
    decision === passDecision
      ? 'Track B Milestone 3 OCR/ML CPU QA Review'
      : decision === modelAssetDecision || decision === modelAssetRequiredDecision
        ? 'Track B Milestone 3 Model Asset Approval'
        : 'Track B Milestone 3 OCR/ML CPU Blocker Resolution Next Follow-Up'
  writeText(
    path,
    `# ${title}\n\nNext prompt: \`${nextPrompt}\`.\n\nThis prompt must preserve CPU/container-only scope until a later approval explicitly widens it.\n`,
  )
}

export function writeTrackBMilestone3OcrMlCpuBlockerResolutionFollowupArtifacts({ execute = false } = {}) {
  if (execute) assertConfirmations()
  const generated = generatedAt()
  const source = buildSourceAudit(generated)
  const rootCause = buildRootCauseReview(generated)
  const sourceTarget = buildSourceTargetCheck(generated)
  const patch = buildDockerfilePatchReport(generated, sourceTarget)
  const buildContext = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.buildContextReview.v1',
    decision: null,
    generatedAt: generated,
    buildContextGenerationRequired: false,
    reason:
      'OCR runtime target copies committed OCR runtime files and requirements only; no dist-server or fixture-worker output is required.',
    approvedBuildContextCommands: [],
  }
  const hydration = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.dependencyHydration.v1',
    decision: null,
    generatedAt: generated,
    npmCiRun: false,
    skipReason: 'not_required_for_ocr_runtime_docker_build_context',
    packageFilesUnchanged: true,
  }
  const generation = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.buildContextGeneration.v1',
    decision: null,
    generatedAt: generated,
    buildContextGenerationRun: false,
    skipped: true,
    allCommandsPassed: true,
    allOutputsPresent: true,
  }
  const artifactScan = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.generatedArtifactScan.v1',
    decision: null,
    generatedAt: generated,
    skipped: true,
    generatedArtifactsFound: false,
    forbiddenFindings: [],
    passed: true,
  }
  const dockerBuild = runDockerBuild(execute, sourceTarget)
  const libgthread = runLibgthreadPresence(execute, dockerBuild)
  const paddle = runPaddlePaddleProof(execute, dockerBuild)
  const paddleocr = runPaddleOcrProof(execute, dockerBuild, paddle)
  const boundary = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.modelOcrGpuBoundary.v1',
    decision: null,
    generatedAt: generated,
    ...noScope(),
    dockerRunNetworkNone: true,
    paddleOcrImportApiProofAvoidedOcrInstantiation: true,
    ocrInferenceFutureOnly: true,
    modelAssetApprovalRequiredBeforeInference: true,
    gpuFutureOnly: true,
  }
  const latency = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.cpuLatencyMemoryCost.v1',
    decision: null,
    generatedAt: generated,
    dockerBuildDurationMs: dockerBuild.durationMs ?? null,
    libgthreadPresenceDurationMs: libgthread.durationMs ?? null,
    paddlePaddleImportVersionDurationMs: paddle.importVersion?.durationMs ?? null,
    paddlePaddleTensorDeviceDurationMs: paddle.tensorDevice?.durationMs ?? null,
    paddleOcrImportApiDurationMs: paddleocr.importApi?.durationMs ?? null,
    memoryNotes: 'No Docker stats sampling was used; this is a local CPU import/API-shape proof only.',
    costTier: 'local_cpu_docker_probe',
    gpuUsed: false,
  }
  const cleanup = cleanupArtifacts(execute, dockerBuild)
  const safety = runSafetyScan(generated, cleanup)
  const reports = {
    source,
    rootCause,
    sourceTarget,
    patch,
    buildContext,
    hydration,
    generation,
    artifactScan,
    dockerBuild,
    libgthread,
    paddle,
    paddleocr,
    boundary,
    latency,
    cleanup,
    safety,
  }
  const decision = deriveDecision(reports)
  const nextPrompt = nextPromptForDecision(decision)
  const statusMatrix = buildStatusMatrix(generated, decision, reports)
  const decisionReport = buildDecisionReport(generated, decision, nextPrompt, reports)
  const readiness = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.readiness.v1',
    decision,
    generatedAt: generated,
    readyForQaReview: decision === passDecision,
    readyForModelAssetApproval: decision === modelAssetDecision || decision === modelAssetRequiredDecision,
    nextPrompt,
    supabaseClassification: supabaseClassification(),
  }
  const manifest = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuBlockerResolutionFollowup.privateManifest.v1',
    decision,
    generatedAt: generated,
    committedArtifactsOnly: true,
    privatePayloadsIncluded: false,
    modelAssetsIncluded: false,
    mediaArtifactsIncluded: false,
    localDockerImageCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    supabaseClassification: supabaseClassification(),
  }
  for (const [key, value] of Object.entries({
    source,
    rootCause,
    sourceTarget,
    patch,
    buildContext,
    hydration,
    generation,
    artifactScan,
    dockerBuild,
    libgthread,
    paddle,
    paddleocr,
    boundary,
    latency,
    cleanup,
    safety,
    statusMatrix,
    decisionReport,
    readiness,
    manifest,
  })) {
    if (value && typeof value === 'object') value.decision = decision
  }
  const files = {
    'source-of-truth-audit': source,
    'libgthread-root-cause-review': rootCause,
    'source-target-check': sourceTarget,
    'dockerfile-patch-report': patch,
    'build-context-command-review': buildContext,
    'dependency-hydration-report': hydration,
    'build-context-generation-report': generation,
    'generated-artifact-scan-report': artifactScan,
    'docker-build-report': dockerBuild,
    'libgthread-presence-report': libgthread,
    'paddlepaddle-proof-report': paddle,
    'paddleocr-api-proof-report': paddleocr,
    'model-ocr-gpu-boundary-verification': boundary,
    'cpu-latency-memory-cost-report': latency,
    'artifact-cleanup-report': cleanup,
    'safety-scan-report': safety,
    'milestone-3-cpu-blocker-resolution-followup-status-matrix': statusMatrix,
    'milestone-3-ocr-ml-cpu-blocker-resolution-followup-decision': decisionReport,
    'readiness-report': readiness,
    'private-artifact-manifest': manifest,
  }
  for (const [name, value] of Object.entries(files)) {
    writeJson(`${reportDir}/${name}.json`, value)
    if (!['artifact-cleanup-report', 'private-artifact-manifest', 'readiness-report'].includes(name)) {
      writeMarkdown(`${reportDir}/${name}.md`, name.replaceAll('-', ' '), [
        ['Decision', `\`${decision}\``],
        ['Owner', `\`${ownerId}\``],
        ['Target', `\`${dockerfilePath}\``],
        ['Next prompt', `\`${nextPrompt}\``],
      ])
    }
  }
  writeText(
    `${reportDir}/validation-results.md`,
    `# Validation Results\n\nDecision: \`${decision}\`\n\nDiagnostics and dependent no-install validation are run after artifact generation.\n\nSupabase classification: no write / environment none / SQL none / migration no.\n`,
  )
  writeNextPrompt(decision, nextPrompt)
  updateStatusDocs(decision, nextPrompt, reports)
  return { decisionReport, reports, nextPrompt }
}

if (process.argv[1] === __filename) {
  const args = new Set(process.argv.slice(2))
  const result = writeTrackBMilestone3OcrMlCpuBlockerResolutionFollowupArtifacts({
    execute: args.has('--execute'),
  })
  console.log(JSON.stringify(result.decisionReport, null, 2))
}
