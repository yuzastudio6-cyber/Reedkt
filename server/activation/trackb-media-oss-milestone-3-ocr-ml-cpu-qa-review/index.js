import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..', '..', '..')

export const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review'
export const branchName = 'codex/rp-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '99595b05b65dd2e6789aceecc144560db1e442cb'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const passDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_qa_passed_ready_for_milestone4_color_image_pipeline_approval'
export const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_APPROVAL'
export const nextPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-approval.md'

const evidenceDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-font-config-followup'
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
]
const acceptedBeforeQa = 12
const newlyAccepted = ['paddlepaddle', 'paddleocr']
const blockedAfterQa = ['opencolorio', 'openimageio']
const targetTools = [
  {
    id: 'paddlepaddle',
    name: 'PaddlePaddle',
    packageName: 'paddlepaddle',
    packageVersion: '3.0.0',
    sourcePr: 635,
    proofBoundary: 'ocr_runtime_container_cpu_import_version_model_free_tensor_device_no_model_assets',
  },
  {
    id: 'paddleocr',
    name: 'PaddleOCR',
    packageName: 'paddleocr',
    packageVersion: '3.0.0',
    sourcePr: 635,
    proofBoundary:
      'ocr_runtime_container_cpu_import_version_api_shape_local_noto_font_config_no_instantiation_no_inference_no_model_assets',
  },
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
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_MILESTONE_3_FONT_CONFIG_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_NO_TOOL_EXECUTION',
    'REEDITPRO_CONFIRM_NO_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_NO_BUILD_CONTEXT_GENERATION',
    'REEDITPRO_CONFIRM_NO_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_NO_OCR_INFERENCE',
    'REEDITPRO_CONFIRM_NO_MODEL_FONT_ASSET_OPERATIONS',
    'REEDITPRO_CONFIRM_NO_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_SUPABASE_MUTATION',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEOCR_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEPADDLE_EXECUTION',
    'REEDITPRO_CONFIRM_OCR_INFERENCE',
    'REEDITPRO_CONFIRM_MODEL_ASSET_DOWNLOAD',
    'REEDITPRO_CONFIRM_MODEL_ASSET_COPY',
    'REEDITPRO_CONFIRM_MODEL_ASSET_UPLOAD',
    'REEDITPRO_CONFIRM_FONT_ASSET_DOWNLOAD',
    'REEDITPRO_CONFIRM_FONT_ASSET_COPY',
    'REEDITPRO_CONFIRM_FONT_ASSET_UPLOAD',
    'REEDITPRO_CONFIRM_EXACT_PINGFANG_USE',
    'REEDITPRO_CONFIRM_OPENCOLORIO_EXECUTION',
    'REEDITPRO_CONFIRM_OPENIMAGEIO_EXECUTION',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_DOCKER_RUN',
    'REEDITPRO_CONFIRM_DOCKER_IMAGE_PUSH',
    'REEDITPRO_CONFIRM_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_NPM_CI',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_PIP_INSTALL',
    'REEDITPRO_CONFIRM_SYSTEM_PACKAGE_INSTALL',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION',
    'REEDITPRO_CONFIRM_REQUIREMENTS_MUTATION',
    'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION',
    'REEDITPRO_CONFIRM_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_MEDIA_FILE_PROBE',
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
    'REEDITPRO_CONFIRM_GITHUB_PR_MERGE',
    'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
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

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8'))
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
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current.trimEnd()}\n\n${block}\n`
  writeFileSync(fullPath, next)
}

function markdownReport(title, lines) {
  return `# ${title}\n\n${lines.join('\n')}\n`
}

function evidence() {
  return {
    decision: readJson(`${evidenceDir}/font-config-followup-decision.json`),
    matrix: readJson(`${evidenceDir}/milestone-3-font-config-status-matrix.json`),
    fontDiscovery: readJson(`${evidenceDir}/font-discovery-report.json`),
    paddlePaddle: readJson(`${evidenceDir}/paddlepaddle-proof-report.json`),
    paddleOcr: readJson(`${evidenceDir}/paddleocr-api-proof-report.json`),
    boundary: readJson(`${evidenceDir}/model-ocr-gpu-network-boundary-verification.json`),
    cleanup: readJson(`${evidenceDir}/artifact-cleanup-report.json`),
    safety: readJson(`${evidenceDir}/safety-scan-report.json`),
    status: readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'),
  }
}

function assertEvidence(allEvidence) {
  const expected = 'trackb_media_oss_milestone3_font_config_followup_passed_ready_for_ocr_ml_cpu_qa_review'
  if (allEvidence.decision.decision !== expected) throw new Error(`stale_pr635_decision:${allEvidence.decision.decision}`)
  if (allEvidence.decision.paddlePaddlePassed !== true || allEvidence.decision.paddleOcrPassed !== true) {
    throw new Error('pr635_missing_paddle_pass_evidence')
  }
  if (allEvidence.paddlePaddle.importVersionPassed !== true || allEvidence.paddlePaddle.tensorDevicePassed !== true) {
    throw new Error('paddlepaddle_evidence_not_passed')
  }
  if (allEvidence.paddleOcr.importApiShapePassed !== true || allEvidence.paddleOcr.paddleOcrInstantiated !== false) {
    throw new Error('paddleocr_api_shape_evidence_not_bounded')
  }
  if (
    allEvidence.paddleOcr.ocrInferenceRun !== false ||
    allEvidence.paddleOcr.modelDownloadRun !== false ||
    allEvidence.paddleOcr.fontDownloadCompleted !== false ||
    allEvidence.paddleOcr.assetCopiedOrUploaded !== false ||
    allEvidence.boundary.gpuExecutionRun !== false ||
    allEvidence.boundary.networkEnabledForProofs !== false
  ) {
    throw new Error('pr635_scope_widened')
  }
  if (
    allEvidence.fontDiscovery.fontsNotoCjkPresent !== true ||
    allEvidence.fontDiscovery.fontsNotoCjkExtraPresent !== false ||
    allEvidence.fontDiscovery.exactPingFangUsed !== false
  ) {
    throw new Error('font_config_evidence_drift')
  }
}

function qaTools(allEvidence) {
  return targetTools.map((tool) => {
    if (tool.id === 'paddlepaddle') {
      return {
        ...tool,
        importVersionProven: allEvidence.paddlePaddle.importVersionPassed === true,
        apiShapeOrTensorProven: allEvidence.paddlePaddle.tensorDevicePassed === true,
        version: allEvidence.paddlePaddle.version,
        device: allEvidence.paddlePaddle.device,
        acceptedProvenBounded: true,
        evidencePendingQa: false,
        rerunInQaPhase: false,
        cpuOnly: true,
        gpuUsed: false,
        ocrInferenceRun: false,
        modelAssetsUsed: false,
        fontAssetsUsed: false,
        runtimeProductReady: false,
      }
    }
    return {
      ...tool,
      importVersionProven: allEvidence.paddleOcr.importApiShapePassed === true,
      apiShapeOrTensorProven: allEvidence.paddleOcr.importApiShapePassed === true,
      version: allEvidence.paddleOcr.moduleVersion || allEvidence.paddleOcr.distributionVersion,
      envLocalFontPath: allEvidence.paddleOcr.envLocalFontPath,
      hasPaddleOCR: allEvidence.paddleOcr.hasPaddleOCR === true,
      paddleOcrInstantiated: false,
      acceptedProvenBounded: true,
      evidencePendingQa: false,
      rerunInQaPhase: false,
      cpuOnly: true,
      gpuUsed: false,
      ocrInferenceRun: false,
      modelAssetsUsed: false,
      fontAssetsUsed: false,
      runtimeProductReady: false,
    }
  })
}

function acceptedAfterQa(allEvidence, tools) {
  const priorAccepted = allEvidence.status.acceptedProvenBounded || []
  const seen = new Set(priorAccepted.map((tool) => tool.id))
  return [
    ...priorAccepted,
    ...tools
      .filter((tool) => !seen.has(tool.id))
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        packageName: tool.packageName,
        version: tool.version,
        sourcePr: 635,
        importVersionProven: true,
        apiShapeOrTensorProven: true,
        acceptedProvenBounded: true,
        rerunInQaPhase: false,
        cpuOnly: true,
        gpuUsed: false,
        ocrInferenceRun: false,
        modelAssetsUsed: false,
        fontAssetsUsed: false,
        endToEndProductReady: false,
        proofBoundary: tool.proofBoundary,
      })),
  ]
}

function buildReports(generated) {
  const allEvidence = evidence()
  assertEvidence(allEvidence)
  const tools = qaTools(allEvidence)
  const accepted = acceptedAfterQa(allEvidence, tools)
  const sourceSha = git(['rev-parse', 'HEAD'])
  const baseReport = {
    generatedAt: generated,
    decision: passDecision,
    ownerId,
    sourceSha,
  }
  const sourceAudit = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.sourceAudit.v1',
    ...baseReport,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    sourceEvidence: [
      { pr: 635, state: 'MERGED', decision: allEvidence.decision.decision, evidenceAcceptedForQa: true },
      { pr: 629, state: 'MERGED' },
      { pr: 625, state: 'MERGED' },
      { pr: 620, state: 'MERGED' },
      { pr: 615, state: 'MERGED' },
      { pr: 613, state: 'MERGED' },
      { pr: 606, state: 'MERGED' },
      { pr: 600, state: 'MERGED' },
      { pr: 592, state: 'MERGED' },
      { pr: 587, state: 'MERGED' },
      { pr: 583, state: 'MERGED' },
      { pr: 578, state: 'MERGED' },
      { pr: 574, state: 'MERGED' },
      { pr: 571, state: 'MERGED' },
      { pr: 567, state: 'MERGED' },
      { pr: 563, state: 'MERGED' },
      { pr: 559, state: 'MERGED' },
      { pr: 557, state: 'MERGED' },
      { pr: 551, state: 'MERGED' },
      { pr: 549, state: 'MERGED' },
      { pr: 546, state: 'MERGED' },
      { pr: 545, state: 'MERGED' },
      { pr: 542, state: 'MERGED', ownerId },
      { pr: 543, state: 'context_only_non_track_b_ai_graphics', canonicalAuthority: false },
    ],
    protectedFileHashes: Object.fromEntries(
      ['package.json', 'package-lock.json', ...protectedNoDiffFiles].map((file) => [file, hashFile(file)]),
    ),
    broadProductionDocsAbsentAuditFacts: {
      'docs/beta-readiness-scorecard.md': !existsSync(join(repoRoot, 'docs/beta-readiness-scorecard.md')),
      'docs/production-beta-blocker-inventory.md': !existsSync(
        join(repoRoot, 'docs/production-beta-blocker-inventory.md'),
      ),
      PRODUCTION_FOUNDATION_STATUS: !existsSync(join(repoRoot, 'PRODUCTION_FOUNDATION_STATUS.md')),
    },
    noScopeConfirmation: {
      toolExecutionRunInQaPhase: false,
      dockerRunInQaPhase: false,
      buildContextGenerationRunInQaPhase: false,
      installRunInQaPhase: false,
      supabaseClassification: supabaseClassification(),
    },
  }
  const evidenceReview = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.evidenceAcceptance.v1',
    ...baseReport,
    pr635EvidenceAccepted: true,
    fontConfigDecision: allEvidence.decision.decision,
    dockerBuildPassedInPrEvidence: allEvidence.decision.dockerBuildPassed === true,
    fontsNotoCjkPresent: allEvidence.fontDiscovery.fontsNotoCjkPresent === true,
    fontsNotoCjkExtraPresent: false,
    exactPingFangUsed: false,
    paddlePaddleProofAccepted: true,
    paddleOcrProofAccepted: true,
    qaPhaseToolExecutionRun: false,
    qaPhaseDockerRun: false,
    qaPhaseBuildContextGenerationRun: false,
  }
  const paddlePaddleQa = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.paddlePaddleQa.v1',
    ...baseReport,
    tool: tools.find((tool) => tool.id === 'paddlepaddle'),
    acceptedAsBoundedCpuProof: true,
    proofAcceptedFromPr: 635,
    proofSummary: allEvidence.paddlePaddle.stdoutSummary,
    modelFreeTensorDeviceProof: true,
    ocrInferenceRun: false,
    modelAssetsUsed: false,
    gpuUsed: false,
  }
  const paddleOcrQa = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.paddleOcrApiShapeQa.v1',
    ...baseReport,
    tool: tools.find((tool) => tool.id === 'paddleocr'),
    acceptedAsBoundedCpuProof: true,
    proofAcceptedFromPr: 635,
    proofSummary: allEvidence.paddleOcr.stdoutSummary,
    envLocalFontPath: allEvidence.paddleOcr.envLocalFontPath,
    paddleOcrInstantiated: false,
    ocrInferenceRun: false,
    modelDownloadRun: false,
    fontDownloadRun: false,
    assetCopiedOrUploaded: false,
    exactPingFangUsed: false,
    gpuUsed: false,
  }
  const fontConfigQa = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.fontConfigQa.v1',
    ...baseReport,
    acceptedLocalFontEnv: 'PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    fontsNotoCjkUsed: true,
    fontsNotoCjkExtraUsed: false,
    exactPingFangUsed: false,
    fontAssetsDownloaded: false,
    fontAssetsCommitted: false,
    assetOperationAccepted: false,
  }
  const runtimeBoundary = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.runtimeBoundary.v1',
    ...baseReport,
    boundedCpuImportApiEvidenceAccepted: true,
    ocrInferenceAccepted: false,
    modelAssetOperationAccepted: false,
    fontAssetOperationAccepted: false,
    gpuExecutionAccepted: false,
    realMediaProcessingAccepted: false,
    userMediaProbingAccepted: false,
    ffmpegFfprobeExpansionAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    routeRuntimeAccepted: false,
    providerRuntimeAccepted: false,
    supabaseGcsPublicDeliveryAccepted: false,
    signedUrlDeliveryAccepted: false,
    rawPromptExecutionAccepted: false,
    betaProductionAccepted: false,
    endToEndProductReadyTools: 0,
    qaPhaseToolExecutionRun: false,
  }
  const statusUpdate = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.statusUpdate.v1',
    ...baseReport,
    ownedTools: 16,
    acceptedProvenBoundedBeforeQa: acceptedBeforeQa,
    newlyAcceptedProvenBoundedInQa: 2,
    acceptedProvenBoundedTotalAfterQa: 14,
    stillBlockedNotInstalledProvenCount: 2,
    acceptedProvenBoundedAfterQa: accepted,
    stillBlockedNotInstalledProven: blockedAfterQa,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    nextPrompt,
  }
  const milestone4Readiness = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.milestone4Readiness.v1',
    ...baseReport,
    nextPrompt,
    candidateTools: [
      { id: 'opencolorio', name: 'OpenColorIO', status: 'blocked_not_installed_proven' },
      { id: 'openimageio', name: 'OpenImageIO', status: 'blocked_not_installed_proven' },
    ],
    approvalReviewOnlyNext: true,
    executionAllowedNow: false,
    colorImagePipelineExecutionAllowedNow: false,
    betaProductionAllowed: false,
  }
  const decisionReport = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.decision.v1',
    ...baseReport,
    nextPrompt,
    acceptedMilestone3Tools: newlyAccepted,
    acceptedProvenBoundedBeforeQa: acceptedBeforeQa,
    newlyAcceptedProvenBoundedInQa: 2,
    acceptedProvenBoundedTotalAfterQa: 14,
    stillBlockedNotInstalledProven: blockedAfterQa,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    qaReviewMetadataOnly: true,
    toolExecutionRunInQaPhase: false,
    dockerBuildRunInQaPhase: false,
    dockerRunInQaPhase: false,
    buildContextGenerationRunInQaPhase: false,
    npmCiRunInQaPhase: false,
    npmInstallRunInQaPhase: false,
    pipInstallRunInQaPhase: false,
    packageLockMutationAllowed: false,
    requirementsMutationAllowed: false,
    dockerfileMutationAllowed: false,
    ocrInferenceAccepted: false,
    modelAssetOperationAccepted: false,
    fontAssetOperationAccepted: false,
    gpuExecutionApproved: false,
    mediaProcessingAccepted: false,
    mediaFileProbingAccepted: false,
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
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.readiness.v1',
    ...baseReport,
    readyForMilestone4ColorImagePipelineApproval: true,
    readyForMilestone4Execution: false,
    readyForRuntimeMediaProcessing: false,
    readyForBetaProduction: false,
    nextPrompt,
    supabaseClassification: supabaseClassification(),
  }
  const manifestReport = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone3OcrMlCpuQaReview.privateManifest.v1',
    ...baseReport,
    reportsDirectory: reportDir,
    privateArtifactPayloadsCommitted: false,
    generatedBuildContextOutputsCommitted: false,
    fixtureOutputsCommitted: false,
    fontArtifactsCommitted: false,
    modelArtifactsCommitted: false,
    mediaArtifactsCommitted: false,
    dockerOutputsCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    secretsPrinted: false,
  }
  return {
    sourceAudit,
    evidenceReview,
    paddlePaddleQa,
    paddleOcrQa,
    fontConfigQa,
    runtimeBoundary,
    statusUpdate,
    milestone4Readiness,
    decisionReport,
    readinessReport,
    manifestReport,
  }
}

function writeReports(reports) {
  const pairs = [
    [
      'source-of-truth-audit',
      reports.sourceAudit,
      markdownReport('Source Of Truth Audit', [
        `Decision: \`${passDecision}\`.`,
        `Central source SHA: \`${reports.sourceAudit.sourceSha}\`.`,
        'PR #635 is accepted as the bounded CPU PaddlePaddle/PaddleOCR QA evidence source.',
      ]),
    ],
    [
      'evidence-acceptance-review',
      reports.evidenceReview,
      markdownReport('Evidence Acceptance Review', [
        'PR #635 evidence is accepted for local Noto CJK font config, PaddlePaddle CPU tensor/device proof, and PaddleOCR import/API-shape proof.',
        'No Docker, target tool commands, OCR inference, model/font asset operations, or runtime/product scope were rerun in this QA phase.',
      ]),
    ],
    [
      'paddlepaddle-qa-review',
      reports.paddlePaddleQa,
      markdownReport('PaddlePaddle QA Review', [
        'PaddlePaddle is accepted as bounded CPU proof only: import/version plus model-free tensor/device evidence.',
        'No OCR inference, model assets, font assets, GPU, media, or runtime worker scope is accepted.',
      ]),
    ],
    [
      'paddleocr-api-shape-qa-review',
      reports.paddleOcrQa,
      markdownReport('PaddleOCR API-Shape QA Review', [
        'PaddleOCR is accepted as bounded CPU import/API-shape proof only.',
        'The accepted local font config is `PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc`.',
        'No PaddleOCR object instantiation, OCR inference, model/font asset operation, exact PingFang use, or network access is accepted.',
      ]),
    ],
    [
      'font-config-qa-review',
      reports.fontConfigQa,
      markdownReport('Font Config QA Review', [
        '`fonts-noto-cjk` evidence is accepted; `fonts-noto-cjk-extra` remains absent/fallback-only.',
        'Exact `PingFang-SC-Regular.ttf` remains blocked and was not used.',
      ]),
    ],
    [
      'runtime-boundary-qa',
      reports.runtimeBoundary,
      markdownReport('Runtime Boundary QA', [
        'Milestone 3 OCR/ML CPU QA accepts bounded import/API evidence only.',
        'OCR inference, model/font assets, GPU, FFmpeg/FFprobe, media/render, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.',
        'End-to-end product-ready Track B tools remain `0`.',
      ]),
    ],
    [
      'trackb-status-update',
      reports.statusUpdate,
      markdownReport('Track B Status Update', [
        `Owned tools: \`${reports.statusUpdate.ownedTools}\`.`,
        `Accepted/proven bounded before QA: \`${reports.statusUpdate.acceptedProvenBoundedBeforeQa}\`.`,
        `Newly accepted/proven bounded in this QA: \`${reports.statusUpdate.newlyAcceptedProvenBoundedInQa}\`.`,
        `Accepted/proven bounded total after QA: \`${reports.statusUpdate.acceptedProvenBoundedTotalAfterQa}\`.`,
        `Still blocked/not installed-proven: \`${reports.statusUpdate.stillBlockedNotInstalledProvenCount}\` (${reports.statusUpdate.stillBlockedNotInstalledProven.join(', ')}).`,
        'End-to-end product-ready tools remain `0`; no 40+ end-to-end claim is allowed.',
      ]),
    ],
    [
      'milestone-4-readiness-review',
      reports.milestone4Readiness,
      markdownReport('Milestone 4 Readiness Review', [
        'Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_APPROVAL`.',
        'Candidate tools: OpenColorIO and OpenImageIO.',
        'Milestone 4 is approval/review only unless a later prompt explicitly authorizes execution.',
      ]),
    ],
    [
      'milestone-3-ocr-ml-cpu-qa-decision',
      reports.decisionReport,
      markdownReport('Milestone 3 OCR/ML CPU QA Decision', [
        `Decision: \`${reports.decisionReport.decision}\`.`,
        `Next prompt: \`${reports.decisionReport.nextPrompt}\`.`,
        'Docker, OCR inference, model/font assets, media/render, workers/routes/providers, Supabase/GCS, beta, and production remain blocked.',
      ]),
    ],
    ['readiness-report', reports.readinessReport, null],
    ['private-artifact-manifest', reports.manifestReport, null],
  ]
  for (const [name, json, md] of pairs) {
    writeJson(`${reportDir}/${name}.json`, json)
    if (md) writeText(`${reportDir}/${name}.md`, md)
  }
  writeText(
    `${reportDir}/validation-results.md`,
    markdownReport('Validation Results', [
      `Generated decision: \`${passDecision}\`.`,
      '- QA generation was metadata-only.',
      '- No Docker, PaddleOCR/PaddlePaddle execution, OCR inference, model/font asset operations, GPU, media/render, npm/pip/system install, workers/routes/providers, Supabase/GCS, public artifact, signed URL, raw prompt, beta, production, or PR merge scope ran.',
      '- Track B accepted/proven bounded count is now 14; still blocked/not installed-proven count is 2; end-to-end product-ready count remains 0.',
      '- Supabase classification: no write / environment none / SQL none / migration no.',
    ]),
  )
}

function writeNextPrompt() {
  writeText(
    nextPromptPath,
    `# Track B Media OSS Milestone 4 Color/Image Pipeline Approval\n\nReview the remaining Track B color/image pipeline candidates after Milestone 3 OCR/ML CPU QA accepted bounded CPU import/API evidence for PaddlePaddle and PaddleOCR.\n\nThis next phase is approval/review only for OpenColorIO and OpenImageIO unless a later prompt explicitly authorizes execution. Keep Docker execution, package installs, requirements mutation, media/render processing, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, beta, and production blocked.\n`,
  )
}

function statusBlock() {
  return [
    'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW:',
    '',
    `- Decision: \`${passDecision}\``,
    '- Accepted Milestone 3 OCR/ML CPU tools: PaddlePaddle and PaddleOCR.',
    '- PR #635 evidence is accepted for bounded CPU PaddlePaddle import/version plus model-free tensor/device proof and PaddleOCR import/API-shape proof.',
    '- Accepted local font config: `PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc`.',
    '- Track B counts after QA: 16 owned tools, 14 bounded accepted/proven tools, 2 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.',
    '- Still blocked/not installed-proven: OpenColorIO and OpenImageIO.',
    '- Do not claim 40+ tools are installed/proven end-to-end.',
    '- OCR inference, model/font assets, exact PingFang, GPU, media/render, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.',
    `- Next prompt: \`${nextPrompt}\``,
    '- Supabase classification: no write / environment none / SQL none / migration no.',
  ].join('\n')
}

function updateMarkdownStatusDocs() {
  const block = statusBlock()
  for (const file of [
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
  ]) {
    if (existsSync(join(repoRoot, file))) {
      replaceOrAppend(
        file,
        '<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW_STATUS:start -->',
        '<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW_STATUS:end -->',
        block,
      )
    }
  }
}

function updateJsonStatusDocs(statusUpdate, tools) {
  const statusJsonPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  if (existsSync(join(repoRoot, statusJsonPath))) {
    const status = readJson(statusJsonPath)
    status.counts = {
      ownedTools: 16,
      acceptedProvenBounded: 14,
      blockedNotInstalledProven: 2,
      endToEndProductReady: 0,
    }
    status.acceptedProvenBounded = statusUpdate.acceptedProvenBoundedAfterQa
    status.blockedNotInstalledProven = blockedAfterQa
    status.milestone3OcrMlCpuQaReview = {
      decision: passDecision,
      reportKey: 'trackb_milestone_3_ocr_ml_cpu_qa_review_reports',
      acceptedMilestone3Tools: tools.map((tool) => tool.id),
      acceptedProvenBoundedTotalAfterQa: 14,
      stillBlockedNotInstalledProven: blockedAfterQa,
      endToEndProductReadyTools: 0,
      fortyPlusEndToEndClaimAllowed: false,
      localFontConfig: 'PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
      nextPrompt,
      ocrInferenceAccepted: false,
      modelAssetOperationsAccepted: false,
      fontAssetOperationsAccepted: false,
      gpuExecutionApproved: false,
      mediaProcessingAccepted: false,
      renderExportAccepted: false,
      workerRuntimeAccepted: false,
      betaProductionAccepted: false,
    }
    writeJson(statusJsonPath, status)
  }

  const stewardPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json'
  if (existsSync(join(repoRoot, stewardPath))) {
    const steward = readJson(stewardPath)
    steward.statusCounts = {
      ownedTools: 16,
      acceptedProvenBounded: 14,
      blockedNotInstalledProven: 2,
      endToEndProductReady: 0,
    }
    steward.ownedTools = steward.ownedTools.map((tool) => {
      const match = tools.find((entry) => entry.id === tool.id)
      if (!match) return tool
      return {
        ...tool,
        status: 'accepted_proven_bounded_milestone3_ocr_ml_cpu',
        proofBoundary: match.proofBoundary,
        packageName: match.packageName,
        version: match.version,
        sourcePr: 635,
        importVersionProven: true,
        apiShapeOrTensorProven: true,
        gpuUsed: false,
        ocrInferenceAccepted: false,
        modelAssetOperationsAccepted: false,
        fontAssetOperationsAccepted: false,
        mediaProcessingAccepted: false,
        endToEndProductReady: false,
      }
    })
    steward.milestone3OcrMlCpuQaReview = {
      decision: passDecision,
      reportDirectory: reportDir,
      acceptedMilestone3Tools: tools.map((tool) => tool.id),
      nextPrompt,
      executionRunInThisPhase: false,
      ocrInferenceAccepted: false,
      gpuExecutionApproved: false,
      mediaProcessingApproved: false,
      renderExportApproved: false,
      workerRuntimeApproved: false,
      betaProductionApproved: false,
    }
    steward.nextPrompt = nextPrompt
    writeJson(stewardPath, steward)
  }

  const registryPath = 'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json'
  if (existsSync(join(repoRoot, registryPath))) {
    const registry = readJson(registryPath)
    for (const owner of registry.owners || []) {
      if (owner.ownerId === ownerId) {
        owner.acceptedProvenBoundedCount = 14
        owner.blockedNotInstalledProvenCount = 2
        owner.endToEndProductReadyToolCount = 0
        owner.nextPrompt = nextPrompt
      }
    }
    registry.sourceEvidence = {
      ...(registry.sourceEvidence || {}),
      trackbMilestone3OcrMlCpuQaReviewDecision: passDecision,
      trackbAcceptedProvenBoundedAfterMilestone3OcrMlCpuQa: 14,
      trackbStillBlockedAfterMilestone3OcrMlCpuQa: 2,
      endToEndProductReadyTools: 0,
      fortyPlusEndToEndClaimAllowed: false,
    }
    writeJson(registryPath, registry)
  }
}

export function protectedFilesHaveNoDiff() {
  const unstaged = git(['diff', '--name-only', '--', ...protectedNoDiffFiles])
  const staged = git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles])
  return unstaged === '' && staged === ''
}

export function forbiddenOutputsPresent() {
  return [
    'node_modules',
    'dist',
    'dist-server',
    'dist-remotion-worker',
    'dist-staging-fixture-worker',
    'dist-staging-real-video-export-worker',
  ].filter((output) => existsSync(join(repoRoot, output)))
}

export function buildTrackBMilestone3OcrMlCpuQaReviewPlan() {
  return {
    branchName,
    baseBranch,
    expectedSourceSha,
    ownerId,
    decision: passDecision,
    reportDir,
    metadataOnly: true,
    acceptedMilestone3Tools: newlyAccepted,
    countsAfterQa: {
      ownedTools: 16,
      acceptedProvenBounded: 14,
      stillBlockedNotInstalledProven: 2,
      endToEndProductReady: 0,
    },
    nextPrompt,
    supabaseClassification: supabaseClassification(),
  }
}

export function writeTrackBMilestone3OcrMlCpuQaReviewArtifacts({ requireConfirmations = false } = {}) {
  if (requireConfirmations) assertConfirmations()
  const reports = buildReports(generatedAt())
  writeReports(reports)
  writeNextPrompt()
  updateMarkdownStatusDocs()
  updateJsonStatusDocs(reports.statusUpdate, reports.paddlePaddleQa ? qaTools(evidence()) : targetTools)
  return reports
}

export function readTrackBMilestone3OcrMlCpuQaReviewArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    evidenceReview: readJson(`${reportDir}/evidence-acceptance-review.json`),
    paddlePaddleQa: readJson(`${reportDir}/paddlepaddle-qa-review.json`),
    paddleOcrQa: readJson(`${reportDir}/paddleocr-api-shape-qa-review.json`),
    fontConfigQa: readJson(`${reportDir}/font-config-qa-review.json`),
    runtimeBoundary: readJson(`${reportDir}/runtime-boundary-qa.json`),
    statusUpdate: readJson(`${reportDir}/trackb-status-update.json`),
    milestone4Readiness: readJson(`${reportDir}/milestone-4-readiness-review.json`),
    decisionReport: readJson(`${reportDir}/milestone-3-ocr-ml-cpu-qa-decision.json`),
    readinessReport: readJson(`${reportDir}/readiness-report.json`),
    manifestReport: readJson(`${reportDir}/private-artifact-manifest.json`),
  }
}

export function scanTextFilesForSecrets(relativeFiles) {
  const patterns = [
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
    /\bghp_[A-Za-z0-9_]{20,}\b/,
    /\bpostgres(?:ql)?:\/\/[^\s"'`]+/i,
    /\bX-Amz-Signature=/i,
    /BEGIN [A-Z ]*PRIVATE KEY/,
  ]
  const findings = []
  for (const file of relativeFiles) {
    const fullPath = join(repoRoot, file)
    if (!existsSync(fullPath) || !statSync(fullPath).isFile()) continue
    const text = readFileSync(fullPath, 'utf8')
    for (const pattern of patterns) {
      if (pattern.test(text)) findings.push(file)
    }
  }
  return findings
}
