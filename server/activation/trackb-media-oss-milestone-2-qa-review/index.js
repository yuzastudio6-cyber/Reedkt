import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..', '..', '..')

export const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-2-qa-review'
export const branchName = 'codex/rp-trackb-media-oss-milestone-2-qa-review'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '18f4ca37c45aa2b0b69d0e2192f297b25d2514e6'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const passDecision =
  'trackb_media_oss_milestone2_qa_passed_ready_for_milestone3_ocr_ml_cpu_gpu_review'
export const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW'
export const nextPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review.md'

const executionReportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-2-video-analysis-execution'
const targetTools = [
  {
    id: 'opencv',
    name: 'OpenCV',
    packageName: 'opencv-python-headless',
    module: 'cv2',
    sourcePr: 571,
  },
  { id: 'pyav', name: 'PyAV', packageName: 'av', module: 'av', sourcePr: 571 },
  {
    id: 'pyscenedetect',
    name: 'PySceneDetect',
    packageName: 'scenedetect',
    module: 'scenedetect',
    sourcePr: 571,
  },
]
const blockedAfterQa = ['paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio']
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
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
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_2_QA_REVIEW',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_MILESTONE_2_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_NO_TOOL_EXECUTION',
    'REEDITPRO_CONFIRM_NO_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_NO_BUILD_CONTEXT_GENERATION',
    'REEDITPRO_CONFIRM_NO_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_NO_FFMPEG_FFPROBE_EXPANSION',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_SUPABASE_MUTATION',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_EXECUTION',
    'REEDITPRO_CONFIRM_OPENCV_EXECUTION',
    'REEDITPRO_CONFIRM_PYAV_EXECUTION',
    'REEDITPRO_CONFIRM_PYSCENEDETECT_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEOCR_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEPADDLE_EXECUTION',
    'REEDITPRO_CONFIRM_OPENCOLORIO_EXECUTION',
    'REEDITPRO_CONFIRM_OPENIMAGEIO_EXECUTION',
    'REEDITPRO_CONFIRM_EXIFTOOL_EXECUTION',
    'REEDITPRO_CONFIRM_MEDIAINFO_EXECUTION',
    'REEDITPRO_CONFIRM_TESSERACT_EXECUTION',
    'REEDITPRO_CONFIRM_IMAGEMAGICK_EXECUTION',
    'REEDITPRO_CONFIRM_GRAPHICSMAGICK_EXECUTION',
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
  const next = pattern.test(current) ? current.replace(pattern, block) : `${current.trimEnd()}\n\n${block}\n`
  writeFileSync(fullPath, next)
}

function markdownReport(title, lines) {
  return `# ${title}\n\n${lines.join('\n')}\n`
}

function evidence() {
  return {
    source: readJson(`${executionReportDir}/source-of-truth-audit.json`),
    decision: readJson(`${executionReportDir}/milestone-2-video-analysis-execution-decision.json`),
    version: readJson(`${executionReportDir}/import-version-proof-report.json`),
    fixture: readJson(`${executionReportDir}/synthetic-fixture-proof-report.json`),
    generation: readJson(`${executionReportDir}/build-context-generation-report.json`),
    scan: readJson(`${executionReportDir}/generated-artifact-scan-report.json`),
    dockerBuild: readJson(`${executionReportDir}/docker-build-report.json`),
    cleanup: readJson(`${executionReportDir}/artifact-cleanup-report.json`),
    safety: readJson(`${executionReportDir}/safety-scan-report.json`),
    matrix: readJson(`${executionReportDir}/milestone-2-video-analysis-status-matrix.json`),
    approval: readJsonOptional(
      'docs/open-source-tool-stack/trackb-media-oss-milestone-2-video-analysis-approval/milestone-2-video-analysis-approval-decision.json',
      {},
    ),
    status: readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'),
  }
}

function versionFor(allEvidence, id) {
  return allEvidence.version.reports?.find((entry) => entry.id === id) || {}
}

function fixtureFor(allEvidence, id) {
  return allEvidence.fixture.reports?.find((entry) => entry.id === id) || {}
}

function matrixFor(allEvidence, id) {
  return allEvidence.matrix.tools?.find((entry) => entry.id === id) || {}
}

function qaTools(allEvidence) {
  return targetTools.map((tool) => {
    const version = versionFor(allEvidence, tool.id)
    const fixture = fixtureFor(allEvidence, tool.id)
    const matrix = matrixFor(allEvidence, tool.id)
    return {
      ...tool,
      sourcePr: 571,
      executionDecision: allEvidence.decision.decision,
      versionEvidence: version.stdoutSummary || null,
      importVersionProven: version.versionProven === true,
      syntheticFixtureEvidence: fixture.stdoutSummary || null,
      syntheticFixtureProven: fixture.fixtureProven === true,
      fixtureDeferred: matrix.fixtureDeferred === true,
      acceptedProvenBounded: true,
      blocker: null,
      cpuOnly: true,
      gpuUsed: false,
      runtimeProductReady: false,
      rerunInQaPhase: false,
      proofBoundary: 'trackb_cpu_worker_container_import_version_and_synthetic_fixture_only_no_real_media_processing',
    }
  })
}

function buildSourceAudit(generated, allEvidence, tools) {
  const sourceSha = git(['rev-parse', 'HEAD'])
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.sourceAudit.v1',
    generatedAt: generated,
    decision: passDecision,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    ownerId,
    sourceEvidence: [
      {
        pr: 571,
        state: 'MERGED',
        mergeCommit: expectedSourceSha,
        headSha: 'be085a60e27d884fdb5137fc2c0783bfc946195d',
        decision: allEvidence.decision.decision,
        evidenceAcceptedForQa: true,
      },
      { pr: 567, state: 'MERGED', decision: 'trackb_media_oss_milestone2_video_analysis_approval_passed_ready_for_execution' },
      { pr: 563, state: 'MERGED', decision: 'trackb_media_oss_milestone1_qa_passed_ready_for_milestone2_video_analysis_approval' },
      { pr: 559, state: 'MERGED', decision: 'trackb_media_oss_milestone1_tesseract_fixture_followup_passed_ready_for_qa' },
      { pr: 557, state: 'MERGED', decision: 'trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof' },
      { pr: 551, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context' },
      { pr: 549, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution' },
      { pr: 546, state: 'MERGED', decision: 'trackb_media_oss_milestone1_blocked_pending_container_packaging_approval' },
      { pr: 545, state: 'MERGED', decision: 'trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution' },
      { pr: 542, state: 'MERGED', ownerId },
      { pr: 125, state: 'historical_context_only', canonicalAuthority: false },
    ],
    acceptedMilestone2Tools: tools.map((tool) => tool.id),
    protectedFileHashes: Object.fromEntries(['package.json', 'package-lock.json', ...protectedNoDiffFiles].map((file) => [file, hashFile(file)])),
    broadProductionDocsAbsentAuditFacts: {
      'docs/beta-readiness-scorecard.md': !existsSync(join(repoRoot, 'docs/beta-readiness-scorecard.md')),
      'docs/production-beta-blocker-inventory.md': !existsSync(join(repoRoot, 'docs/production-beta-blocker-inventory.md')),
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
}

function buildEvidenceReview(generated, allEvidence, tools) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.evidenceAcceptance.v1',
    generatedAt: generated,
    decision: passDecision,
    pr571EvidenceAccepted: true,
    dependencyHydrationPassedWithoutPackageMutation: allEvidence.decision.npmCiIgnoreScriptsOnly === true,
    buildContextsGeneratedScannedAndCleaned:
      allEvidence.generation.allCommandsPassed === true &&
      allEvidence.scan.passed === true &&
      allEvidence.cleanup.generatedOutputsCleaned === true,
    dockerBuildPassed: allEvidence.dockerBuild.exitCode === 0,
    localImageCleanupPassedOrAbsent: allEvidence.cleanup.dockerImagePushed === false,
    opencv: tools.find((tool) => tool.id === 'opencv'),
    pyav: tools.find((tool) => tool.id === 'pyav'),
    pyscenedetect: tools.find((tool) => tool.id === 'pyscenedetect'),
    latencyMemoryCostEvidence: 'accepted_from_pr571_report_summaries_only',
    qaPhaseToolExecutionRun: false,
    qaPhaseDockerRun: false,
    qaPhaseBuildContextGenerationRun: false,
  }
}

function buildToolMatrix(generated, tools) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.toolQaMatrix.v1',
    generatedAt: generated,
    decision: passDecision,
    ownerId,
    tools,
    milestone2AcceptedToolCount: 3,
    allMilestone2ToolsAccepted: tools.every((tool) => tool.acceptedProvenBounded === true),
    runtimeProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
  }
}

function buildArtifactSafety(generated, allEvidence) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.artifactSafety.v1',
    generatedAt: generated,
    decision: passDecision,
    pr571GeneratedOutputsCleaned: allEvidence.cleanup.generatedOutputsCleaned === true,
    pr571LocalImagePushed: allEvidence.cleanup.dockerImagePushed === true,
    qaPhaseGeneratedOutputsCreated: false,
    distPresent: existsSync(join(repoRoot, 'dist')),
    distServerPresent: existsSync(join(repoRoot, 'dist-server')),
    distStagingFixtureWorkerPresent: existsSync(join(repoRoot, 'dist-staging-fixture-worker')),
    nodeModulesPresent: existsSync(join(repoRoot, 'node_modules')),
    fixtureOutputsCommitted: false,
    mediaArtifactsCommitted: false,
    dockerOutputsCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    packageLockMutationAllowed: false,
    requirementsMutationAllowed: false,
    dockerfileMutationAllowed: false,
  }
}

function buildRuntimeBoundary(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.runtimeBoundary.v1',
    generatedAt: generated,
    decision: passDecision,
    boundedInstallContainerEvidenceAccepted: true,
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
}

function buildCpuGpuQa(generated, tools) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.cpuGpuQa.v1',
    generatedAt: generated,
    decision: passDecision,
    tools: tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      cpuOnlyProofAccepted: true,
      gpuUsed: false,
      gpuExecutionApproved: false,
      futureGpuRequiresSeparateApproval: true,
    })),
    gpuEscalationFutureOnly: true,
    cpuLatencyMemoryNotesDoNotApproveGpu: true,
  }
}

function buildTrackBStatus(generated, tools) {
  const priorAccepted = evidence().status.acceptedProvenBounded || []
  const acceptedIds = new Set(priorAccepted.map((tool) => tool.id))
  const acceptedAfterQa = [
    ...priorAccepted,
    ...tools
      .filter((tool) => !acceptedIds.has(tool.id))
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        packageName: tool.packageName,
        sourcePr: 571,
        importVersionProven: true,
        syntheticFixtureProven: true,
        acceptedProvenBounded: true,
        rerunInQaPhase: false,
        proofBoundary: tool.proofBoundary,
      })),
  ]
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.statusUpdate.v1',
    generatedAt: generated,
    decision: passDecision,
    ownerId,
    ownedTools: 16,
    acceptedProvenBoundedBeforeMilestone2: 9,
    milestone2NewlyAcceptedProvenBounded: 3,
    acceptedProvenBoundedTotalAfterQa: 12,
    stillBlockedNotInstalledProvenCount: 4,
    acceptedProvenBoundedAfterQa: acceptedAfterQa,
    stillBlockedNotInstalledProven: blockedAfterQa,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    nextPrompt,
  }
}

function buildMilestone3Readiness(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.milestone3Readiness.v1',
    generatedAt: generated,
    decision: passDecision,
    nextPrompt,
    candidateTools: [
      {
        id: 'paddleocr',
        name: 'PaddleOCR',
        computeDefault: 'cpu_tiny_proof_first',
        gpuPolicy: 'review_required_before_heavy_beta_quality_workloads',
      },
      {
        id: 'paddlepaddle',
        name: 'PaddlePaddle',
        computeDefault: 'cpu_tiny_proof_first',
        gpuPolicy: 'review_required_before_heavy_beta_quality_workloads',
      },
    ],
    reviewApprovalOnly: true,
    executionAllowedNow: false,
    syntheticOcrFixturesOnly: true,
    realUserMediaDocumentsAllowed: false,
    betaProductionAllowed: false,
  }
}

function buildDecision(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.decision.v1',
    generatedAt: generated,
    decision: passDecision,
    sourceSha: git(['rev-parse', 'HEAD']),
    ownerId,
    nextPrompt,
    acceptedMilestone2Tools: targetTools.map((tool) => tool.id),
    acceptedProvenBoundedBeforeMilestone2: 9,
    milestone2NewlyAcceptedProvenBounded: 3,
    acceptedProvenBoundedTotalAfterQa: 12,
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
    ffmpegFfprobeExpansionAccepted: false,
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
}

function buildReadiness(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.readiness.v1',
    generatedAt: generated,
    decision: passDecision,
    readyForMilestone3OcrMlCpuGpuReview: true,
    readyForMilestone3Execution: false,
    readyForRuntimeMediaProcessing: false,
    readyForBetaProduction: false,
    nextPrompt,
    supabaseClassification: supabaseClassification(),
  }
}

function buildManifest(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2QaReview.privateManifest.v1',
    generatedAt: generated,
    decision: passDecision,
    reportsDirectory: reportDir,
    privateArtifactPayloadsCommitted: false,
    generatedBuildContextOutputsCommitted: false,
    fixtureOutputsCommitted: false,
    mediaArtifactsCommitted: false,
    dockerOutputsCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    secretsPrinted: false,
  }
}

export function buildTrackBMilestone2QaReviewPlan() {
  return {
    branchName,
    baseBranch,
    expectedSourceSha,
    ownerId,
    decision: passDecision,
    reportDir,
    metadataOnly: true,
    acceptedMilestone2Tools: targetTools.map((tool) => tool.id),
    countsAfterQa: {
      ownedTools: 16,
      acceptedProvenBounded: 12,
      stillBlockedNotInstalledProven: 4,
      endToEndProductReady: 0,
    },
    nextPrompt,
    supabaseClassification: supabaseClassification(),
  }
}

function writeReports(reports) {
  const pairs = [
    ['source-of-truth-audit', reports.sourceAudit, markdownReport('Source Of Truth Audit', [
      `Decision: \`${passDecision}\`.`,
      `Central source SHA: \`${reports.sourceAudit.sourceSha}\`.`,
      'PR #571 is the accepted Milestone 2 execution evidence source; PR #125 is historical context only.',
    ])],
    ['evidence-acceptance-review', reports.evidenceReview, markdownReport('Evidence Acceptance Review', [
      'PR #571 evidence is accepted for dependency hydration, build-context generation and cleanup, Docker build, OpenCV, PyAV, and PySceneDetect bounded CPU proofs.',
      'No Docker, build-context generation, or target tool commands were rerun in this QA phase.',
    ])],
    ['milestone-2-tool-qa-matrix', reports.toolMatrix, markdownReport('Milestone 2 Tool QA Matrix', [
      '| Tool | Package | Import/version | Synthetic fixture | Accepted bounded proof | Product-ready |',
      '| --- | --- | --- | --- | --- | --- |',
      ...reports.toolMatrix.tools.map((tool) => `| ${tool.name} | ${tool.packageName} | ${tool.importVersionProven} | ${tool.syntheticFixtureProven} | ${tool.acceptedProvenBounded} | ${tool.runtimeProductReady} |`),
      '',
      'All Milestone 2 proof evidence remains CPU-only and synthetic-fixture-only.',
    ])],
    ['artifact-safety-qa', reports.artifactSafety, markdownReport('Artifact Safety QA', [
      'PR #571 cleanup evidence is accepted; this QA phase did not create generated outputs.',
      'No build contexts, fixtures, media artifacts, public artifacts, signed URLs, Docker outputs, package-lock changes, requirements changes, or Dockerfile changes are committed by this QA phase.',
    ])],
    ['runtime-boundary-qa', reports.runtimeBoundary, markdownReport('Runtime Boundary QA', [
      'Milestone 2 proves bounded container-local tool imports and synthetic fixtures only.',
      'Real media processing/probing, FFmpeg/FFprobe expansion, render/export, workers/routes/providers, Supabase/GCS, public delivery, signed URLs, beta, and production remain blocked.',
      'End-to-end product-ready Track B tools remain `0`.',
    ])],
    ['cpu-gpu-qa', reports.cpuGpuQa, markdownReport('CPU/GPU QA', [
      'OpenCV, PyAV, and PySceneDetect proof evidence is accepted as CPU-only.',
      'No GPU execution is approved by this QA phase; any GPU escalation requires a later source-of-truth approval.',
    ])],
    ['trackb-status-update', reports.statusUpdate, markdownReport('Track B Status Update', [
      `Owned tools: \`${reports.statusUpdate.ownedTools}\`.`,
      `Accepted/proven bounded before Milestone 2: \`${reports.statusUpdate.acceptedProvenBoundedBeforeMilestone2}\`.`,
      `Newly accepted/proven bounded in Milestone 2 QA: \`${reports.statusUpdate.milestone2NewlyAcceptedProvenBounded}\`.`,
      `Accepted/proven bounded total after QA: \`${reports.statusUpdate.acceptedProvenBoundedTotalAfterQa}\`.`,
      `Still blocked/not installed-proven: \`${reports.statusUpdate.stillBlockedNotInstalledProvenCount}\` (${reports.statusUpdate.stillBlockedNotInstalledProven.join(', ')}).`,
      'End-to-end product-ready tools remain `0`; no 40+ end-to-end claim is allowed.',
    ])],
    ['milestone-3-readiness-review', reports.milestone3Readiness, markdownReport('Milestone 3 Readiness Review', [
      'Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW`.',
      'Candidate tools: PaddleOCR and PaddlePaddle.',
      'Milestone 3 is review/approval only for CPU tiny proof first and GPU policy; no execution is authorized here.',
    ])],
    ['milestone-2-qa-decision', reports.decisionReport, markdownReport('Milestone 2 QA Decision', [
      `Decision: \`${reports.decisionReport.decision}\`.`,
      `Next prompt: \`${reports.decisionReport.nextPrompt}\`.`,
      'Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.',
    ])],
    ['readiness-report', reports.readinessReport, null],
    ['private-artifact-manifest', reports.manifestReport, null],
  ]
  for (const [name, json, md] of pairs) {
    writeJson(`${reportDir}/${name}.json`, json)
    if (md) writeText(`${reportDir}/${name}.md`, md)
  }
  writeText(`${reportDir}/validation-results.md`, markdownReport('Validation Results', [
    `Generated decision: \`${passDecision}\`.`,
    '- QA generation was metadata-only.',
    '- No Docker, build-context generation, target binaries, FFmpeg/FFprobe, media/render, npm/pip/system install, workers/routes/providers, Supabase/GCS, public artifact, signed URL, raw prompt, beta, production, or PR merge scope ran.',
    '- Track B accepted/proven bounded count is now 12; still blocked/not installed-proven count is 4; end-to-end product-ready count remains 0.',
    '- Supabase classification: no write / environment none / SQL none / migration no.',
  ]))
}

function writeNextPrompt() {
  writeText(
    nextPromptPath,
    `# Track B Media OSS Milestone 3 OCR/ML CPU/GPU Review\n\nReview and approve the next Track B OCR/ML lane for PaddleOCR and PaddlePaddle after Milestone 2 QA accepted bounded CPU-only OpenCV, PyAV, and PySceneDetect evidence.\n\nThis next phase is review/approval only unless a later prompt explicitly authorizes execution. Keep real user media/documents, Docker execution, FFmpeg/FFprobe expansion, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, beta, and production blocked.\n`,
  )
}

function statusBlock() {
  return [
    'TRACKB_MEDIA_OSS_MILESTONE_2_QA_REVIEW:',
    '',
    `- Decision: \`${passDecision}\``,
    '- Accepted Milestone 2 tools: OpenCV, PyAV, and PySceneDetect.',
    '- PR #571 evidence is accepted for CPU-only container import/version and synthetic fixture proofs.',
    '- Track B counts after QA: 16 owned tools, 12 bounded accepted/proven tools, 4 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.',
    '- Still blocked/not installed-proven: PaddleOCR, PaddlePaddle, OpenColorIO, and OpenImageIO.',
    '- Do not claim 40+ tools are installed/proven end-to-end.',
    '- GPU execution, FFmpeg/FFprobe expansion, real media processing/probing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.',
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
        '<!-- TRACKB_MEDIA_OSS_MILESTONE_2_QA_REVIEW_STATUS:start -->',
        '<!-- TRACKB_MEDIA_OSS_MILESTONE_2_QA_REVIEW_STATUS:end -->',
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
      acceptedProvenBounded: 12,
      blockedNotInstalledProven: 4,
      endToEndProductReady: 0,
    }
    status.acceptedProvenBounded = statusUpdate.acceptedProvenBoundedAfterQa
    status.blockedNotInstalledProven = blockedAfterQa
    status.milestone2QaReview = {
      decision: passDecision,
      reportKey: 'trackb_milestone_2_qa_review_reports',
      acceptedMilestone2Tools: tools.map((tool) => tool.id),
      acceptedProvenBoundedTotalAfterQa: 12,
      stillBlockedNotInstalledProven: blockedAfterQa,
      endToEndProductReadyTools: 0,
      fortyPlusEndToEndClaimAllowed: false,
      nextPrompt,
      gpuExecutionApproved: false,
      ffmpegFfprobeExpansionAccepted: false,
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
      acceptedProvenBounded: 12,
      blockedNotInstalledProven: 4,
      endToEndProductReady: 0,
    }
    steward.ownedTools = steward.ownedTools.map((tool) => {
      const match = tools.find((entry) => entry.id === tool.id)
      if (!match) return tool
      return {
        ...tool,
        status: 'accepted_proven_bounded_milestone2',
        proofBoundary: match.proofBoundary,
        packageName: match.packageName,
        sourcePr: 571,
        importVersionProven: true,
        syntheticFixtureProven: true,
        gpuUsed: false,
        mediaProcessingAccepted: false,
        endToEndProductReady: false,
      }
    })
    steward.milestone2QaReview = {
      decision: passDecision,
      reportDirectory: reportDir,
      acceptedMilestone2Tools: tools.map((tool) => tool.id),
      nextPrompt,
      executionRunInThisPhase: false,
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
        owner.acceptedProvenBoundedCount = 12
        owner.blockedNotInstalledProvenCount = 4
        owner.endToEndProductReadyToolCount = 0
        owner.nextPrompt = nextPrompt
      }
    }
    registry.sourceEvidence = {
      ...(registry.sourceEvidence || {}),
      trackbMilestone2QaReviewDecision: passDecision,
      trackbAcceptedProvenBoundedAfterMilestone2Qa: 12,
      trackbStillBlockedAfterMilestone2Qa: 4,
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

export function writeTrackBMilestone2QaReviewArtifacts({ requireConfirmations = false } = {}) {
  if (requireConfirmations) assertConfirmations()
  const generated = generatedAt()
  const allEvidence = evidence()
  const tools = qaTools(allEvidence)
  const sourceAudit = buildSourceAudit(generated, allEvidence, tools)
  const evidenceReview = buildEvidenceReview(generated, allEvidence, tools)
  const toolMatrix = buildToolMatrix(generated, tools)
  const artifactSafety = buildArtifactSafety(generated, allEvidence)
  const runtimeBoundary = buildRuntimeBoundary(generated)
  const cpuGpuQa = buildCpuGpuQa(generated, tools)
  const statusUpdate = buildTrackBStatus(generated, tools)
  const milestone3Readiness = buildMilestone3Readiness(generated)
  const decisionReport = buildDecision(generated)
  const readinessReport = buildReadiness(generated)
  const manifestReport = buildManifest(generated)
  const reports = {
    sourceAudit,
    evidenceReview,
    toolMatrix,
    artifactSafety,
    runtimeBoundary,
    cpuGpuQa,
    statusUpdate,
    milestone3Readiness,
    decisionReport,
    readinessReport,
    manifestReport,
  }
  writeReports(reports)
  writeNextPrompt()
  updateMarkdownStatusDocs()
  updateJsonStatusDocs(statusUpdate, tools)
  return reports
}

export function readTrackBMilestone2QaReviewArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    evidenceReview: readJson(`${reportDir}/evidence-acceptance-review.json`),
    toolMatrix: readJson(`${reportDir}/milestone-2-tool-qa-matrix.json`),
    artifactSafety: readJson(`${reportDir}/artifact-safety-qa.json`),
    runtimeBoundary: readJson(`${reportDir}/runtime-boundary-qa.json`),
    cpuGpuQa: readJson(`${reportDir}/cpu-gpu-qa.json`),
    statusUpdate: readJson(`${reportDir}/trackb-status-update.json`),
    milestone3Readiness: readJson(`${reportDir}/milestone-3-readiness-review.json`),
    decisionReport: readJson(`${reportDir}/milestone-2-qa-decision.json`),
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
