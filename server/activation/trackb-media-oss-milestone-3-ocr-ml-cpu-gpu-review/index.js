import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..', '..', '..')

export const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review'
export const branchName = 'codex/rp-trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '0a05d4a39ab11675465efc2622299e28c132da02'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const passDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_gpu_review_passed_ready_for_cpu_execution'
export const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION'
export const nextPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-execution.md'

const reviewTools = [
  {
    id: 'paddleocr',
    name: 'PaddleOCR',
    packageName: 'paddleocr',
    selectedVersion: '3.0.0',
    purpose:
      'OCR engine for generated UI/text/frame OCR, caption safe-zone metadata, text-region extraction, and future edit-assistance workflows.',
  },
  {
    id: 'paddlepaddle',
    name: 'PaddlePaddle',
    packageName: 'paddlepaddle',
    selectedVersion: '3.0.0',
    purpose: 'OCR/ML framework dependency for PaddleOCR and future OCR/vision workloads.',
  },
]
const blockedAfterReview = ['paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio']
const acceptedAfterMilestone2 = [
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
]
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
]
const forbiddenOutputDirs = [
  'node_modules',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
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
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_MILESTONE_3_PACKAGE_STRATEGY_REVIEW',
    'REEDITPRO_CONFIRM_MILESTONE_3_MODEL_ASSET_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_CPU_FIRST_OCR_ML_POLICY',
    'REEDITPRO_CONFIRM_GPU_ESCALATION_REQUIRES_SEPARATE_APPROVAL',
    'REEDITPRO_CONFIRM_SYNTHETIC_FIXTURES_ONLY',
    'REEDITPRO_CONFIRM_NO_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_NO_MODEL_DOWNLOAD',
    'REEDITPRO_CONFIRM_NO_OCR_INFERENCE',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_SUPABASE_MUTATION',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_CPU_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEOCR_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEPADDLE_EXECUTION',
    'REEDITPRO_CONFIRM_PYTHON_PACKAGE_INSTALL',
    'REEDITPRO_CONFIRM_PIP_INSTALL',
    'REEDITPRO_CONFIRM_REQUIREMENTS_MUTATION',
    'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION',
    'REEDITPRO_CONFIRM_MODEL_DOWNLOAD',
    'REEDITPRO_CONFIRM_MODEL_ASSET_COPY',
    'REEDITPRO_CONFIRM_MODEL_ASSET_UPLOAD',
    'REEDITPRO_CONFIRM_OCR_INFERENCE',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_DOCKER_RUN',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_TOOL_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_GPU_RUNTIME_EXECUTION',
    'REEDITPRO_CONFIRM_GPU_JOB',
    'REEDITPRO_CONFIRM_CLOUD_RUN_GPU',
    'REEDITPRO_CONFIRM_CLOUD_BUILD',
    'REEDITPRO_CONFIRM_GCP_IAM_MUTATION',
    'REEDITPRO_CONFIRM_OPENCV_EXECUTION',
    'REEDITPRO_CONFIRM_PYAV_EXECUTION',
    'REEDITPRO_CONFIRM_PYSCENEDETECT_EXECUTION',
    'REEDITPRO_CONFIRM_OPENIMAGEIO_EXECUTION',
    'REEDITPRO_CONFIRM_OPENCOLORIO_EXECUTION',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
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

function readJsonOptional(relativePath, fallback = {}) {
  const fullPath = join(repoRoot, relativePath)
  if (!existsSync(fullPath)) return fallback
  return JSON.parse(readFileSync(fullPath, 'utf8'))
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

function markdownReport(title, lines) {
  return `# ${title}\n\n${lines.join('\n')}\n`
}

function sourceEvidence() {
  return [
    {
      pr: 574,
      title: '[tools] Track B media OSS Milestone 2 QA review',
      state: 'MERGED',
      mergedAt: '2026-06-20T12:28:24Z',
      headRefOid: '9c46718f8d2275abfd16b9f011edef7fa25bfd64',
      decision: 'trackb_media_oss_milestone2_qa_passed_ready_for_milestone3_ocr_ml_cpu_gpu_review',
    },
    { pr: 571, title: '[tools] Track B media OSS Milestone 2 video analysis execution', state: 'MERGED' },
    { pr: 567, title: '[tools] Track B media OSS Milestone 2 video analysis approval', state: 'MERGED' },
    { pr: 563, title: '[tools] Track B media OSS Milestone 1 QA review', state: 'MERGED' },
    { pr: 559, title: '[tools] Track B media OSS Milestone 1 Tesseract fixture proof follow-up', state: 'MERGED' },
    { pr: 557, title: '[tools] Track B media OSS Milestone 1 build-context blocker follow-up', state: 'MERGED' },
    { pr: 551, title: '[tools] Track B media OSS Milestone 1 system packaging execution', state: 'MERGED' },
    { pr: 549, title: '[tools] Track B media OSS Milestone 1 system packaging approval', state: 'MERGED' },
    { pr: 546, title: '[tools] Track B media OSS Milestone 1 low-risk metadata tooling execution', state: 'MERGED' },
    { pr: 545, title: '[tools] Track B media OSS install/proof milestone plan', state: 'MERGED' },
    { pr: 542, title: '[tools] Track B media OSS steward owner registry', state: 'MERGED' },
  ]
}

function historicalEvidence() {
  return [
    {
      pr: 51,
      title: '[activation] Phase 37A PaddleOCR model/runtime approval workflow',
      status: 'historical_context_only',
      selectedAsCurrentProof: false,
      note: 'Planning context for PaddleOCR/PaddlePaddle model/runtime approval.',
    },
    {
      pr: 56,
      title: '[activation] Verify Phase 37C generated OCR runtime',
      status: 'historical_context_only',
      selectedAsCurrentProof: false,
      note: 'Generated OCR runtime verification context; not current Track B install/proof authority.',
    },
    {
      pr: 59,
      title: '[activation] Phase 37D OCR safe-zone execution',
      status: 'historical_context_only',
      selectedAsCurrentProof: false,
      note: 'Controlled OCR safe-zone context; no current media/OCR execution is approved.',
    },
    {
      pr: 99,
      title: '[foundation] Prompt 13 tool readiness worker runtime checks',
      status: 'historical_context_only',
      selectedAsCurrentProof: false,
      note: 'Readiness registry context where tools were not product-ready runtime evidence.',
    },
    {
      pr: 161,
      title: '[activation] Track B capability manifest baseline',
      status: 'historical_context_only',
      selectedAsCurrentProof: false,
      note: 'Capability manifest context only.',
    },
    {
      pr: 164,
      title: '[activation] Phase 44I Track B tool route manifest integration',
      status: 'historical_context_only',
      selectedAsCurrentProof: false,
      note: 'Route manifest context only, not current proof authority.',
    },
  ]
}

function noScope() {
  return {
    packageInstallRun: false,
    npmCiRun: false,
    npmInstallRun: false,
    npmRebuildRun: false,
    packageLockMutated: false,
    requirementsMutated: false,
    dockerfileMutated: false,
    dockerBuildRun: false,
    dockerContainerRun: false,
    paddleOcrRun: false,
    paddlePaddleRun: false,
    ocrInferenceRun: false,
    modelDownloadRun: false,
    modelAssetCopied: false,
    modelAssetUploaded: false,
    gpuExecutionRun: false,
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

function buildReports() {
  const now = generatedAt()
  const sourceSha = git(['rev-parse', 'HEAD'])
  const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
  const ocrRequirements = readText('docker/prod/ocr-runtime/requirements.ocr.txt')
  const ocrDockerfile = readText('docker/prod/ocr-runtime/Dockerfile')
  const broadDocs = [
    'docs/beta-readiness-scorecard.md',
    'docs/production-beta-blocker-inventory.md',
    'PRODUCTION_FOUNDATION_STATUS.md',
  ].map((path) => ({ path, exists: existsSync(join(repoRoot, path)) }))

  const base = {
    decision: passDecision,
    generatedAt: now,
    ownerId,
    sourceSha,
    reviewPhaseOnly: true,
    noScope: noScope(),
    supabaseClassification: supabaseClassification(),
  }

  const sourceAudit = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.sourceAudit.v1',
    ...base,
    baseBranch,
    branchName,
    expectedSourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    sourceEvidence: sourceEvidence(),
    aiGraphicsPr543: {
      pr: 543,
      title: '[tools] Register AI graphics owner assignment',
      state: 'OPEN',
      isDraft: true,
      ownsPaddleTools: false,
      canonicalTrackBSource: false,
    },
    historicalContextPrs: historicalEvidence(),
    countsFromPr574: {
      ownedTools: 16,
      acceptedProvenBounded: 12,
      blockedNotInstalledProven: 4,
      endToEndProductReady: 0,
    },
    fileHashes: {
      packageJson: hashFile('package.json'),
      packageLock: hashFile('package-lock.json'),
      ocrRuntimeDockerfile: hashFile('docker/prod/ocr-runtime/Dockerfile'),
      ocrRuntimeRequirements: hashFile('docker/prod/ocr-runtime/requirements.ocr.txt'),
      cpuWorkerDockerfile: hashFile('docker/prod/cpu-worker/Dockerfile'),
      cpuWorkerRequirements: hashFile('docker/prod/cpu-worker/requirements.cpu.txt'),
      dockerignore: hashFile('.dockerignore'),
    },
    broadProductionDocs: broadDocs,
  }

  const historicalReview = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.historicalEvidence.v1',
    ...base,
    historicalEvidence: historicalEvidence(),
    conclusion:
      'Historical PaddleOCR/PaddlePaddle evidence is useful context but is not accepted as current Track B Milestone 3 install/proof completion.',
    currentTrackBProofStillRequired: true,
    runtimeScopeApprovedByHistoricalEvidence: false,
  }

  const ownershipReview = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.ownershipDuplicate.v1',
    ...base,
    tools: reviewTools.map((tool) => ({
      ...tool,
      ownerId,
      ownerLane: 'TRACK_B_MEDIA_PROCESSING',
      stillBlockedNotInstalledProven: true,
    })),
    aiGraphicsOwnsTools: false,
    trackAOwnsTools: false,
    soundOwnsTools: false,
    providerLaneOwnsTools: false,
    duplicateMilestone3ReviewFound: false,
    duplicateOwnerConflictFound: false,
  }

  const packageStrategy = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.packageStrategy.v1',
    ...base,
    selectedFutureTargetRequirements: 'docker/prod/ocr-runtime/requirements.ocr.txt',
    selectedFutureTargetDockerfile: 'docker/prod/ocr-runtime/Dockerfile',
    currentRequirementsAlreadyDeclareSelectedPins:
      ocrRequirements.includes('paddlepaddle==3.0.0') && ocrRequirements.includes('paddleocr==3.0.0'),
    selectedPackages: [
      { name: 'paddlepaddle', version: '3.0.0', role: 'framework_dependency' },
      { name: 'paddleocr', version: '3.0.0', role: 'ocr_engine' },
      { name: 'Pillow', version: '10.4.0', role: 'synthetic_fixture_image_support' },
      { name: 'numpy', version: '1.26.4', role: 'array_tensor_support' },
      { name: 'opencv-python-headless', version: '4.10.0.84', role: 'supporting_image_dependency' },
      { name: 'PyYAML', version: '6.0.2', role: 'configuration_dependency' },
    ],
    futureRequirementsMutationNeeded: false,
    requirementsMutationThisPhase: false,
    packageLockMutationThisPhase: false,
    packageInstallThisPhase: false,
    deterministicPinsRequired: true,
  }

  const modelAssetPolicy = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.modelAssetPolicy.v1',
    ...base,
    cpuExecutionWithoutModelAssetsAllowed: true,
    allowedWithoutModelAssets: [
      'PaddlePaddle import/version proof',
      'PaddlePaddle tiny model-free tensor/device check',
      'PaddleOCR import/version/API-shape proof',
    ],
    ocrInferenceAllowedInNextCpuExecution: false,
    ocrInferenceRequiresSeparateModelAssetApproval: true,
    modelDownloadsAllowed: false,
    modelAssetCopyAllowed: false,
    modelAssetUploadAllowed: false,
    privateModelAssetPolicyRequiredBeforeInference: true,
    requiredFutureModelAssetControls: [
      'source provenance',
      'checksums',
      'private storage location',
      'network/download block',
      'no public artifacts',
      'no signed URLs',
    ],
  }

  const workerTarget = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.workerContainerTarget.v1',
    ...base,
    selectedFutureCpuTarget: 'docker/prod/ocr-runtime/Dockerfile',
    selectedFutureRequirements: 'docker/prod/ocr-runtime/requirements.ocr.txt',
    targetExists: existsSync(join(repoRoot, 'docker/prod/ocr-runtime/Dockerfile')),
    requirementsExist: existsSync(join(repoRoot, 'docker/prod/ocr-runtime/requirements.ocr.txt')),
    ocrRuntimeDisablesModelDownloads: ocrDockerfile.includes('MODEL_DOWNLOADS_ENABLED=false'),
    ocrRuntimeDisablesRealMedia: ocrDockerfile.includes('REAL_MEDIA_INPUT_ENABLED=false'),
    ocrRuntimeDisablesProviderExecution: ocrDockerfile.includes('PROVIDER_EXECUTION_ENABLED=false'),
    rationale:
      'Use the existing dedicated OCR runtime rather than general CPU worker because PaddleOCR/PaddlePaddle have heavier OCR/ML dependencies and historical model-asset boundaries.',
    futureGpuTarget: 'separate_gpu_worker_or_gpu_cloud_run_job_requires_separate_approval',
    dockerfileMutationThisPhase: false,
    dockerBuildRunThisPhase: false,
  }

  const cpuPolicy = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.cpuProofPolicy.v1',
    ...base,
    cpuFirstRequired: true,
    futureCpuProofs: [
      'python -c "import paddle; print(paddle.__version__)"',
      'tiny model-free Paddle tensor/device capability check',
      'python -c "import paddleocr; print(getattr(paddleocr, \'__version__\', \'unknown\'))"',
      'PaddleOCR import/API-shape proof without OCR inference',
    ],
    ocrInferenceApproved: false,
    syntheticTextImageAllowedOnlyAfterModelAssetApproval: true,
    recordLatencyMemoryInFutureExecution: true,
    noRealUserMedia: true,
    cleanupRequired: true,
  }

  const gpuPolicy = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.gpuEscalationPolicy.v1',
    ...base,
    gpuExecutionApprovedThisPhase: false,
    gpuRequiresSeparateApproval: true,
    gpuRecommendedWhen: [
      'CPU import/startup latency exceeds accepted worker cold-start threshold',
      'OCR inference latency is too slow after model assets are approved',
      'high-resolution frame OCR is required',
      'long videos or many-frame batches make CPU queue time impractical',
      'beta-quality latency cannot be met on CPU',
    ],
    futureGpuTargetCandidates: [
      'dedicated GPU worker',
      'GPU Cloud Run Job',
      'batch GPU job with scale-to-zero or job-based lifecycle',
    ],
    costControls: ['CPU default', 'GPU only by threshold', 'async queue for heavy jobs', 'no production cost commitment'],
  }

  const fixtureSafety = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.syntheticFixtureSafety.v1',
    ...base,
    fixturePolicy: 'synthetic_text_image_only_after_model_asset_and_inference_approval',
    noUserDocuments: true,
    noRealMedia: true,
    noCommittedFixtureOutputsExpected: true,
    noPublicArtifacts: true,
    noSignedUrls: true,
    noExternalModelDownloads: true,
    tempOutputCleanupRequired: true,
  }

  const cloudPolicy = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.cloudRuntimeCostPerformance.v1',
    ...base,
    cpuProofTarget: 'OCR CPU worker or CPU Cloud Run Job',
    suggestedCpuResources: '4-8 vCPU / 8-16 GiB RAM depending dependency footprint',
    futureGpuTarget: 'on-demand GPU worker, GPU Cloud Run Job, or batch GPU path',
    gpuScalePolicy: 'scale_to_zero_or_job_based',
    gpuExecutionThisPhase: false,
    editSpeedRule: 'Escalate to GPU only when CPU OCR would make edit workflows slow, laggy, or timeout-prone.',
    costFriendlyRule: 'CPU by default; GPU only after thresholds and job routing are approved.',
  }

  const commandPlan = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.futureCommands.v1',
    ...base,
    commandsApprovedForFutureCpuExecution: [
      'python -c "import paddle; print(paddle.__version__)"',
      'python -c "import paddle; import json; print(json.dumps({\\"version\\": paddle.__version__, \\"device\\": paddle.device.get_device()}))"',
      'python -c "import paddleocr; print(getattr(paddleocr, \'__version__\', \'unknown\'))"',
      'python -c "from paddleocr import PaddleOCR; import inspect; print(sorted(inspect.signature(PaddleOCR.__init__).parameters.keys()))"',
    ],
    commandsNotRunThisPhase: true,
    ocrInferenceCommandsApproved: false,
    gpuCommandsApproved: false,
    dockerCommandsRunThisPhase: false,
  }

  const decisionReport = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.decision.v1',
    ...base,
    nextPrompt,
    nextPromptPath,
    counts: {
      ownedTools: 16,
      acceptedProvenBounded: 12,
      blockedNotInstalledProven: 4,
      endToEndProductReady: 0,
    },
    reviewTools: reviewTools.map((tool) => tool.id),
    blockedNotInstalledProven: blockedAfterReview,
    acceptedProvenBounded: acceptedAfterMilestone2,
    cpuExecutionReady: true,
    modelAssetApprovalNeededBeforeInference: true,
    gpuExecutionApprovalNeededBeforeGpuUse: true,
    fortyPlusEndToEndClaimAllowed: false,
  }

  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.readiness.v1',
    ...base,
    readyForCpuExecution: true,
    readyForModelAssetInference: false,
    readyForGpuExecution: false,
    nextPrompt,
    blockersRemaining: [
      'OCR inference remains blocked pending model asset approval',
      'GPU execution remains blocked pending separate GPU approval',
      'PaddleOCR/PaddlePaddle remain not installed-proven until CPU execution lands',
    ],
  }

  const privateManifest = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.privateManifest.v1',
    ...base,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    modelFilesCommitted: false,
    mediaFilesCommitted: false,
    generatedOutputsCommitted: false,
    broadProductionDocs: broadDocs,
  }

  const validationResults = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone3OcrMlCpuGpuReview.validationResults.v1',
    ...base,
    validationMode: 'no_install_metadata_only',
    expectedDiagnostics: [
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
    dependencyBackedChecks: 'run_only_if_node_modules_already_exists_without_installation',
  }

  return {
    sourceAudit,
    historicalReview,
    ownershipReview,
    packageStrategy,
    modelAssetPolicy,
    workerTarget,
    cpuPolicy,
    gpuPolicy,
    fixtureSafety,
    cloudPolicy,
    commandPlan,
    decisionReport,
    readinessReport,
    privateManifest,
    validationResults,
    status,
  }
}

function writeReportPair(jsonName, mdName, jsonValue, title, lines) {
  writeJson(`${reportDir}/${jsonName}`, jsonValue)
  writeText(`${reportDir}/${mdName}`, markdownReport(title, lines))
}

function updateJsonStatus(reports) {
  const status = reports.status
  status.counts = {
    ownedTools: 16,
    acceptedProvenBounded: 12,
    blockedNotInstalledProven: 4,
    endToEndProductReady: 0,
  }
  status.blockedNotInstalledProven = blockedAfterReview
  status.milestone3OcrMlCpuGpuReview = {
    decision: passDecision,
    reportKey: 'trackb_milestone_3_ocr_ml_cpu_gpu_review_reports',
    targetTools: reviewTools.map((tool) => tool.id),
    selectedCpuTarget: 'docker/prod/ocr-runtime/Dockerfile',
    selectedRequirements: 'docker/prod/ocr-runtime/requirements.ocr.txt',
    selectedPackages: ['paddlepaddle==3.0.0', 'paddleocr==3.0.0'],
    modelAssetPolicy: 'import_version_api_shape_allowed_without_model_assets_ocr_inference_blocked',
    gpuPolicy: 'future_only_requires_separate_approval',
    countsUnchanged: true,
    nextPrompt,
    ...noScope(),
    supabaseClassification: supabaseClassification(),
  }
  writeJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json', status)

  const steward = readJsonOptional('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json', {})
  steward.milestone3OcrMlCpuGpuReview = status.milestone3OcrMlCpuGpuReview
  if (steward.statusCounts) {
    steward.statusCounts.acceptedProvenBounded = 12
    steward.statusCounts.blockedNotInstalledProven = 4
    steward.statusCounts.endToEndProductReady = 0
  }
  writeJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json', steward)

  const registry = readJsonOptional('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json', {})
  const owner = registry.owners?.find((entry) => entry.ownerId === ownerId)
  if (owner) {
    owner.acceptedProvenBoundedCount = 12
    owner.blockedNotInstalledProvenCount = 4
    owner.endToEndProductReadyToolCount = 0
    owner.milestone3OcrMlCpuGpuReview = {
      decision: passDecision,
      nextPrompt,
      reviewTools: reviewTools.map((tool) => tool.id),
    }
    writeJson('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json', registry)
  }
}

function statusBlock() {
  return `TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW:

- Decision: \`${passDecision}\`
- Review tools: PaddleOCR and PaddlePaddle.
- Future CPU target: \`docker/prod/ocr-runtime/Dockerfile\` with \`docker/prod/ocr-runtime/requirements.ocr.txt\`.
- Package strategy: existing pinned \`paddlepaddle==3.0.0\` and \`paddleocr==3.0.0\` remain future execution inputs; no requirements mutation occurred in this review.
- CPU proof policy: future import/version/API-shape and model-free tensor/device checks only.
- Model asset policy: OCR inference remains blocked until model asset provenance, checksum, and private storage approval lands.
- GPU policy: future-only and requires separate approval for heavy OCR, frame-heavy batches, high-resolution OCR, or CPU latency/timeouts.
- Track B counts remain: 16 owned tools, 12 bounded accepted/proven tools, 4 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- Still blocked/not installed-proven: PaddleOCR, PaddlePaddle, OpenColorIO, and OpenImageIO.
- Forty-plus end-to-end proof claims remain disallowed.
- No package install, npm ci/install/rebuild, pip install, requirements mutation, Dockerfile mutation, Docker build/run, PaddleOCR/PaddlePaddle execution, OCR inference, model download/copy/upload, GPU job, media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, or production scope ran.
- Next prompt: \`${nextPrompt}\`
- Supabase classification: no write / environment none / SQL none / migration no.`
}

function updateMarkdownStatus() {
  const start = '<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW_STATUS:start -->'
  const end = '<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW_STATUS:end -->'
  for (const file of [
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
  ]) {
    replaceOrAppend(file, start, end, statusBlock())
  }
}

function writePrompt() {
  writeText(
    nextPromptPath,
    `# Track B Media OSS Milestone 3 OCR/ML CPU Execution

## Summary
Execute the CPU-first Track B OCR/ML proof for PaddleOCR and PaddlePaddle using the reviewed \`docker/prod/ocr-runtime\` target only.

## Approved Future Scope
- PaddlePaddle import/version and model-free tensor/device checks.
- PaddleOCR import/version/API-shape checks.
- No OCR inference unless a separate model-asset approval has landed.
- No model download, model copy, model upload, real user media, GPU job, public artifact, signed URL, beta, or production scope.

## Required Source Decision
- \`${passDecision}\`
`,
  )
}

export function buildTrackBMilestone3OcrMlCpuGpuReviewPlan() {
  return {
    branchName,
    baseBranch,
    expectedSourceSha,
    reportDir,
    decision: passDecision,
    nextPrompt,
    reviewTools,
    selectedCpuTarget: 'docker/prod/ocr-runtime/Dockerfile',
    requiredConfirmations: requiredConfirmations(),
    forbiddenConfirmations: forbiddenConfirmations(),
  }
}

export function writeTrackBMilestone3OcrMlCpuGpuReviewArtifacts({ requireConfirmations = false } = {}) {
  if (requireConfirmations) assertConfirmations()
  const reports = buildReports()

  writeReportPair('source-of-truth-audit.json', 'source-of-truth-audit.md', reports.sourceAudit, 'Source Of Truth Audit', [
    `Decision: \`${passDecision}\`.`,
    `Source SHA: \`${reports.sourceAudit.sourceSha}\`.`,
    'PR #574 and Track B predecessor evidence are recorded as source of truth.',
    'Historical OCR PRs are context only.',
  ])
  writeReportPair(
    'historical-ocr-evidence-review.json',
    'historical-ocr-evidence-review.md',
    reports.historicalReview,
    'Historical OCR Evidence Review',
    [
      'PR #51/#56/#59/#99/#161/#164 are reviewed as historical context only.',
      'They do not make PaddleOCR/PaddlePaddle accepted or product-ready in the current Track B lane.',
    ],
  )
  writeReportPair(
    'tool-ownership-duplicate-review.json',
    'tool-ownership-duplicate-review.md',
    reports.ownershipReview,
    'Tool Ownership And Duplicate Review',
    [
      'PaddleOCR and PaddlePaddle remain owned by TRACK_B_MEDIA_OSS_STEWARD.',
      'AI graphics, Track A, Sound, and provider lanes are not canonical owners for these tools.',
      'No duplicate Milestone 3 OCR/ML CPU-GPU review PR is selected.',
    ],
  )
  writeReportPair('package-strategy-review.json', 'package-strategy-review.md', reports.packageStrategy, 'Package Strategy Review', [
    'Future CPU target already declares pinned Paddle packages in the OCR runtime requirements.',
    'No package install, package-lock mutation, requirements mutation, or Dockerfile mutation occurred.',
  ])
  writeReportPair(
    'model-asset-policy-review.json',
    'model-asset-policy-review.md',
    reports.modelAssetPolicy,
    'Model Asset Policy Review',
    [
      'Import/version/API-shape proof can proceed without model assets.',
      'OCR inference remains blocked pending model asset approval.',
      'Model downloads, copies, uploads, public artifacts, and signed URLs remain blocked.',
    ],
  )
  writeReportPair(
    'worker-container-target-review.json',
    'worker-container-target-review.md',
    reports.workerTarget,
    'Worker Container Target Review',
    [
      'Future CPU execution target is the existing dedicated OCR runtime.',
      'The general CPU worker is not selected for PaddleOCR/PaddlePaddle dependency proof.',
      'GPU target remains future-only and separately approved.',
    ],
  )
  writeReportPair('cpu-proof-policy.json', 'cpu-proof-policy.md', reports.cpuPolicy, 'CPU Proof Policy', [
    'Future CPU proof is import/version/API-shape and model-free tensor/device only.',
    'OCR inference remains blocked until model assets are approved.',
  ])
  writeReportPair('gpu-escalation-policy.json', 'gpu-escalation-policy.md', reports.gpuPolicy, 'GPU Escalation Policy', [
    'No GPU execution is approved in this review.',
    'GPU escalation requires separate approval and cost/runtime thresholds.',
  ])
  writeReportPair(
    'synthetic-fixture-safety-policy.json',
    'synthetic-fixture-safety-policy.md',
    reports.fixtureSafety,
    'Synthetic Fixture Safety Policy',
    [
      'Synthetic OCR fixtures are future-only and require model asset/inference approval.',
      'No real user media, public artifact, signed URL, or committed fixture output is allowed.',
    ],
  )
  writeReportPair(
    'cloud-runtime-cost-performance-policy.json',
    'cloud-runtime-cost-performance-policy.md',
    reports.cloudPolicy,
    'Cloud Runtime Cost Performance Policy',
    [
      'CPU is default for proof and low-cost fallback.',
      'GPU is future-only for heavy OCR workloads or CPU latency thresholds.',
    ],
  )
  writeReportPair(
    'future-verification-command-plan.json',
    'future-verification-command-plan.md',
    reports.commandPlan,
    'Future Verification Command Plan',
    [
      'Future commands are approved for CPU execution only.',
      'No commands are run in this review phase.',
    ],
  )
  writeReportPair(
    'milestone-3-ocr-ml-cpu-gpu-review-decision.json',
    'milestone-3-ocr-ml-cpu-gpu-review-decision.md',
    reports.decisionReport,
    'Milestone 3 OCR ML CPU GPU Review Decision',
    [`Decision: \`${passDecision}\`.`, `Next prompt: \`${nextPrompt}\`.`],
  )
  writeJson(`${reportDir}/readiness-report.json`, reports.readinessReport)
  writeJson(`${reportDir}/private-artifact-manifest.json`, reports.privateManifest)
  writeText(
    `${reportDir}/validation-results.md`,
    markdownReport('Validation Results', [
      'Validation mode: no-install metadata-only.',
      'Run the new diagnostics plus Track B predecessor diagnostics and diff checks.',
    ]),
  )
  writeJson(`${reportDir}/validation-results.json`, reports.validationResults)

  updateJsonStatus(reports)
  updateMarkdownStatus()
  writePrompt()

  return reports
}

export function readTrackBMilestone3OcrMlCpuGpuReviewArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    historicalReview: readJson(`${reportDir}/historical-ocr-evidence-review.json`),
    ownershipReview: readJson(`${reportDir}/tool-ownership-duplicate-review.json`),
    packageStrategy: readJson(`${reportDir}/package-strategy-review.json`),
    modelAssetPolicy: readJson(`${reportDir}/model-asset-policy-review.json`),
    workerTarget: readJson(`${reportDir}/worker-container-target-review.json`),
    cpuPolicy: readJson(`${reportDir}/cpu-proof-policy.json`),
    gpuPolicy: readJson(`${reportDir}/gpu-escalation-policy.json`),
    fixtureSafety: readJson(`${reportDir}/synthetic-fixture-safety-policy.json`),
    cloudPolicy: readJson(`${reportDir}/cloud-runtime-cost-performance-policy.json`),
    commandPlan: readJson(`${reportDir}/future-verification-command-plan.json`),
    decisionReport: readJson(`${reportDir}/milestone-3-ocr-ml-cpu-gpu-review-decision.json`),
    readinessReport: readJson(`${reportDir}/readiness-report.json`),
    privateManifest: readJson(`${reportDir}/private-artifact-manifest.json`),
    validationResults: readJson(`${reportDir}/validation-results.json`),
  }
}

export function protectedFilesHaveNoDiff() {
  const unstaged = git(['diff', '--name-only', '--', ...protectedNoDiffFiles])
  const staged = git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles])
  return !unstaged && !staged
}

export function forbiddenOutputsPresent() {
  return forbiddenOutputDirs.filter((entry) => existsSync(join(repoRoot, entry)))
}

export function stagedModelOrMediaArtifacts() {
  const staged = git(['diff', '--cached', '--name-only'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return staged.filter((file) =>
    /\.(onnx|pdmodel|pdiparams|bin|mp4|mov|mkv|wav|mp3|png|jpg|jpeg|webp|tif|tiff)$/i.test(file),
  )
}
