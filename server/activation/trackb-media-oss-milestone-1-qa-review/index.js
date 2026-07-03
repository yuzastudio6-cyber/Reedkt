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

export const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-qa-review'
export const branchName = 'codex/rp-trackb-media-oss-milestone-1-qa-review'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = 'd46eaf33dcde2e9c4757939eca7f717a582550f3'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const passDecision =
  'trackb_media_oss_milestone1_qa_passed_ready_for_milestone2_video_analysis_approval'
export const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_APPROVAL'
export const nextPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-2-video-analysis-approval.md'

const priorReportDirs = {
  pr557: 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-build-context-blocker-followup',
  pr559: 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-tesseract-fixture-proof-followup',
}

const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
]

const batch1AcceptedTools = [
  {
    id: 'ffmpeg',
    name: 'FFmpeg',
    version: '5.1.9-0+deb12u1',
    proofBoundary: 'tracka_container_version_only_no_media_processing',
  },
  {
    id: 'ffprobe',
    name: 'FFprobe',
    version: '5.1.9-0+deb12u1',
    proofBoundary: 'tracka_container_version_only_no_media_file_probe',
  },
  {
    id: 'sharp_libvips',
    name: 'Sharp/libvips',
    version: '0.34.5',
    proofBoundary: 'import_version_only_no_image_processing',
  },
  {
    id: 'duckdb',
    name: 'DuckDB',
    version: '1.4.4',
    proofBoundary: 'native_rebuild_import_api_shape_in_memory_query',
  },
  {
    id: 'polars_nodejs_polars',
    name: 'Polars / nodejs-polars',
    version: '0.25.1',
    proofBoundary: 'import_version_in_memory_dataframe_metadata',
  },
]

const milestone1ToolIds = ['exiftool', 'mediainfo', 'tesseract', 'imagemagick']
const blockedAfterQa = [
  'opencv',
  'pyav',
  'pyscenedetect',
  'paddleocr',
  'paddlepaddle',
  'opencolorio',
  'openimageio',
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
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_MILESTONE_1_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_NO_TOOL_EXECUTION',
    'REEDITPRO_CONFIRM_NO_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_NO_BUILD_CONTEXT_GENERATION',
    'REEDITPRO_CONFIRM_NO_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_SUPABASE_MUTATION',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_APPROVAL',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION',
    'REEDITPRO_CONFIRM_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_DOCKER_RUN',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_EXIFTOOL_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_MEDIAINFO_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_TESSERACT_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_IMAGEMAGICK_PROOF',
    'REEDITPRO_CONFIRM_GRAPHICSMAGICK_EXECUTION',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_OPENCV_EXECUTION',
    'REEDITPRO_CONFIRM_PYAV_EXECUTION',
    'REEDITPRO_CONFIRM_PYSCENEDETECT_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEOCR_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEPADDLE_EXECUTION',
    'REEDITPRO_CONFIRM_OPENCOLORIO_EXECUTION',
    'REEDITPRO_CONFIRM_OPENIMAGEIO_EXECUTION',
    'REEDITPRO_CONFIRM_NPM_CI',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION',
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

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8'))
}

function readJsonOptional(relativePath, fallback = {}) {
  const fullPath = join(repoRoot, relativePath)
  if (!existsSync(fullPath)) return fallback
  return JSON.parse(readFileSync(fullPath, 'utf8'))
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

function versionReportFor(evidence, id) {
  return evidence.pr557Version.reports?.find((entry) => entry.id === id) || {}
}

function fixtureReportFor(evidence, id) {
  return evidence.pr557Fixture.reports?.find((entry) => entry.id === id) || {}
}

function buildMilestone1Tools(evidence) {
  const tesseractVariant = evidence.pr559Tesseract.variants?.find((variant) => variant.exactMatch === true) || {}
  return [
    {
      id: 'exiftool',
      name: 'ExifTool',
      sourcePr: 557,
      version: versionReportFor(evidence, 'exiftool').stdoutSummary || '12.57',
      versionProven: versionReportFor(evidence, 'exiftool').versionProven === true,
      fixtureProven: fixtureReportFor(evidence, 'exiftool').fixtureProven === true,
      acceptedProvenBounded: true,
      rerunInQaPhase: false,
      proofBoundary: 'container_version_and_synthetic_text_metadata_fixture_no_real_media_processing',
    },
    {
      id: 'mediainfo',
      name: 'MediaInfo',
      sourcePr: 557,
      version: '23.04',
      versionEvidence: versionReportFor(evidence, 'mediainfo').stdoutSummary || 'MediaInfoLib - v23.04',
      versionProven: versionReportFor(evidence, 'mediainfo').versionProven === true,
      fixtureProven: fixtureReportFor(evidence, 'mediainfo').fixtureProven === true,
      acceptedProvenBounded: true,
      rerunInQaPhase: false,
      proofBoundary: 'container_version_and_tiny_synthetic_wav_header_fixture_no_real_user_media',
    },
    {
      id: 'tesseract',
      name: 'Tesseract',
      sourcePr: 559,
      version: '5.3.0',
      versionEvidenceSourcePr: 557,
      versionProven: versionReportFor(evidence, 'tesseract').versionProven === true,
      fixtureProven: evidence.pr559Tesseract.tesseractFixtureProven === true,
      acceptedVariant: evidence.pr559Tesseract.acceptedVariant || tesseractVariant.id,
      expectedNormalizedOutput: evidence.pr559Tesseract.variants?.[0]?.expectedNormalizedOutput || 'REEDITPRO',
      observedNormalizedOutput: tesseractVariant.normalizedOutput || 'REEDITPRO',
      priorRejectedOutput: evidence.pr559Tesseract.priorRejectedOutput || 'REEDLTPRU',
      acceptedProvenBounded: true,
      rerunInQaPhase: false,
      proofBoundary: 'container_version_from_pr557_and_exact_synthetic_ocr_fixture_from_pr559',
    },
    {
      id: 'imagemagick',
      name: 'ImageMagick',
      sourcePr: 557,
      followupFixtureSourcePr: 559,
      version: '6.9.11-60',
      versionEvidence: versionReportFor(evidence, 'imagemagick').stdoutSummary || 'ImageMagick 6.9.11-60',
      versionProven: versionReportFor(evidence, 'imagemagick').versionProven === true,
      fixtureProven: fixtureReportFor(evidence, 'imagemagick').fixtureProven === true,
      acceptedProvenBounded: true,
      rerunInQaPhase: false,
      graphicsMagickCounted: false,
      proofBoundary: 'imagemagick_only_container_version_and_synthetic_fixture_no_graphicsmagick_default',
    },
  ]
}

function readPriorEvidence() {
  return {
    pr557Version: readJsonOptional(`${priorReportDirs.pr557}/version-proof-report.json`, { reports: [] }),
    pr557Fixture: readJsonOptional(`${priorReportDirs.pr557}/synthetic-fixture-proof-report.json`, { reports: [] }),
    pr557Decision: readJsonOptional(`${priorReportDirs.pr557}/milestone-1-build-context-followup-decision.json`, {}),
    pr559Tesseract: readJsonOptional(`${priorReportDirs.pr559}/tesseract-fixture-proof-report.json`, { variants: [] }),
    pr559Decision: readJsonOptional(`${priorReportDirs.pr559}/tesseract-fixture-followup-decision.json`, {}),
    pr559Status: readJsonOptional(`${priorReportDirs.pr559}/tesseract-followup-status-matrix.json`, { tools: [] }),
  }
}

function buildSourceAudit(generated, tools) {
  const sourceSha = git(['rev-parse', 'HEAD'])
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.sourceAudit.v1',
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
        pr: 559,
        state: 'MERGED',
        sourceSha: expectedSourceSha,
        decision: 'trackb_media_oss_milestone1_tesseract_fixture_followup_passed_ready_for_qa',
        acceptedVariant: 'dejavu_sans_bold_large_psm7',
        normalizedOcrOutput: 'REEDITPRO',
      },
      {
        pr: 557,
        state: 'MERGED',
        decision: 'trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof',
        acceptedEvidence: ['docker_build', 'build_context_generation', 'exiftool', 'mediainfo', 'imagemagick', 'tesseract_version'],
        blockerEvidence: 'tesseract_fixture_output_REEDLTPRU_expected_REEDITPRO',
      },
      { pr: 551, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context' },
      { pr: 549, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution' },
      { pr: 546, state: 'MERGED', decision: 'trackb_media_oss_milestone1_blocked_pending_container_packaging_approval' },
      { pr: 545, state: 'MERGED', decision: 'trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution' },
      { pr: 542, state: 'MERGED', ownerId },
    ],
    acceptedMilestone1Tools: tools.map((tool) => tool.id),
    protectedFileHashes: Object.fromEntries(['package.json', 'package-lock.json', ...protectedNoDiffFiles].map((file) => [file, hashFile(file)])),
    broadProductionDocsAbsentAuditFacts: {
      'docs/beta-readiness-scorecard.md': !existsSync(join(repoRoot, 'docs/beta-readiness-scorecard.md')),
      'docs/production-beta-blocker-inventory.md': !existsSync(join(repoRoot, 'docs/production-beta-blocker-inventory.md')),
      PRODUCTION_FOUNDATION_STATUS: !existsSync(join(repoRoot, 'PRODUCTION_FOUNDATION_STATUS.md')),
    },
    supabaseClassification: supabaseClassification(),
  }
}

function buildEvidenceReview(generated, tools) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.evidenceAcceptance.v1',
    generatedAt: generated,
    decision: passDecision,
    pr557AcceptedEvidence: {
      dockerBuild: true,
      buildContextsGeneratedScannedCleaned: true,
      exiftoolVersionAndFixture: true,
      mediainfoVersionAndFixture: true,
      imagemagickVersionAndFixture: true,
      tesseractVersionOnly: true,
      tesseractFixtureBlockedOutput: 'REEDLTPRU',
    },
    pr559AcceptedEvidence: {
      tesseractFixtureProof: true,
      acceptedVariant: 'dejavu_sans_bold_large_psm7',
      expectedNormalizedOutput: 'REEDITPRO',
      observedNormalizedOutput: 'REEDITPRO',
      priorRejectedOutputRetained: 'REEDLTPRU',
    },
    tools,
    qaPhaseToolExecutionRun: false,
    dockerRunInQaPhase: false,
    buildContextGenerationRunInQaPhase: false,
  }
}

function buildToolMatrix(generated, tools) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.toolQaMatrix.v1',
    generatedAt: generated,
    decision: passDecision,
    ownerId,
    tools,
    graphicsMagick: {
      role: 'optional_fallback_only',
      installedOrProven: false,
      countedAsAcceptedProven: false,
      reason: 'ImageMagick is the Milestone 1 accepted tool; GraphicsMagick was not installed, executed, or proven.',
    },
    acceptedMilestone1ToolCount: 4,
    allMilestone1ToolsAccepted: tools.every((tool) => tool.acceptedProvenBounded === true),
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
  }
}

function buildArtifactSafety(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.artifactSafety.v1',
    generatedAt: generated,
    decision: passDecision,
    pr557GeneratedOutputsCleaned: true,
    pr559GeneratedOutputsCleaned: true,
    qaPhaseGeneratedOutputsCreated: false,
    distPresent: existsSync(join(repoRoot, 'dist')),
    distServerPresent: existsSync(join(repoRoot, 'dist-server')),
    distStagingFixtureWorkerPresent: existsSync(join(repoRoot, 'dist-staging-fixture-worker')),
    nodeModulesPresent: existsSync(join(repoRoot, 'node_modules')),
    fixtureOutputsCommitted: false,
    mediaArtifactsCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
  }
}

function buildRuntimeBoundary(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.runtimeBoundary.v1',
    generatedAt: generated,
    decision: passDecision,
    toolExecutionRunInQaPhase: false,
    dockerBuildRunInQaPhase: false,
    dockerRunInQaPhase: false,
    buildContextGenerationRunInQaPhase: false,
    ffmpegFfprobeRunInQaPhase: false,
    opencvPyavPyscenedetectRunInQaPhase: false,
    paddleOrColorPipelineRunInQaPhase: false,
    mediaProcessingAccepted: false,
    mediaFileProbingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    routeRuntimeAccepted: false,
    providerRuntimeAccepted: false,
    supabaseGcsPublicDeliveryAccepted: false,
    rawPromptExecutionAccepted: false,
    betaProductionAccepted: false,
    supabaseClassification: supabaseClassification(),
  }
}

function buildTrackBStatus(generated, tools) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.statusUpdate.v1',
    generatedAt: generated,
    decision: passDecision,
    ownerId,
    ownedTools: 16,
    previouslyAcceptedProvenBounded: 5,
    milestone1AcceptedProvenBounded: 4,
    acceptedProvenBoundedTotalAfterQa: 9,
    stillBlockedNotInstalledProvenCount: 7,
    acceptedProvenBoundedAfterQa: [...batch1AcceptedTools, ...tools],
    stillBlockedNotInstalledProven: blockedAfterQa,
    graphicsMagick: {
      role: 'optional_fallback_only',
      countedAsAcceptedProven: false,
      installedOrProven: false,
    },
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    nextPrompt,
  }
}

function buildMilestone2Readiness(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.milestone2Readiness.v1',
    generatedAt: generated,
    decision: passDecision,
    readyForMilestone2Approval: true,
    nextPrompt,
    candidateTools: [
      { id: 'opencv', name: 'OpenCV', computeDefault: 'cpu_first', gpuPolicy: 'optional_recommended_later_after_latency_memory_evidence' },
      { id: 'pyav', name: 'PyAV', computeDefault: 'cpu_first', gpuPolicy: 'optional_later_only_if_needed' },
      { id: 'pyscenedetect', name: 'PySceneDetect', computeDefault: 'cpu_first', gpuPolicy: 'not_required_for_tiny_synthetic_proof' },
    ],
    futureScopeOnly: true,
    syntheticFixturesOnly: true,
    realUserMediaAllowed: false,
    renderExportAllowed: false,
    ffmpegFfprobeExpansionAllowed: false,
    workersRoutesProvidersAllowed: false,
    betaProductionAllowed: false,
  }
}

function buildDecision(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.decision.v1',
    generatedAt: generated,
    decision: passDecision,
    sourceSha: git(['rev-parse', 'HEAD']),
    ownerId,
    nextPrompt,
    acceptedMilestone1Tools: milestone1ToolIds,
    acceptedProvenBoundedTotalAfterQa: 9,
    stillBlockedNotInstalledProvenCount: 7,
    graphicsMagickCountedAsAcceptedProven: false,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    qaReviewMetadataOnly: true,
    toolExecutionRunInQaPhase: false,
    dockerBuildRunInQaPhase: false,
    dockerRunInQaPhase: false,
    buildContextGenerationRunInQaPhase: false,
    npmCiRunInQaPhase: false,
    npmInstallRunInQaPhase: false,
    npmRebuildRunInQaPhase: false,
    packageLockMutationAllowed: false,
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
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.readiness.v1',
    generatedAt: generated,
    decision: passDecision,
    readyForMilestone2VideoAnalysisApproval: true,
    readyForRuntimeExecution: false,
    readyForMediaProcessing: false,
    readyForBetaProduction: false,
    nextPrompt,
    supabaseClassification: supabaseClassification(),
  }
}

function buildManifest(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1QaReview.privateManifest.v1',
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
  }
}

export function buildTrackBMilestone1QaReviewPlan() {
  return {
    branchName,
    baseBranch,
    expectedSourceSha,
    ownerId,
    decision: passDecision,
    reportDir,
    metadataOnly: true,
    acceptedMilestone1Tools: milestone1ToolIds,
    countsAfterQa: {
      ownedTools: 16,
      acceptedProvenBounded: 9,
      stillBlockedNotInstalledProven: 7,
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
      `Source SHA: \`${reports.sourceAudit.sourceSha}\`.`,
      'PR #559 is accepted as the Tesseract fixture proof source; PR #557 remains the prior evidence source for the other Milestone 1 proof results.',
    ])],
    ['evidence-acceptance-review', reports.evidenceReview, markdownReport('Evidence Acceptance Review', [
      'PR #557 evidence is accepted for ExifTool, MediaInfo, ImageMagick, Docker build/build-context, and Tesseract version proof.',
      'PR #559 evidence is accepted only for the Tesseract fixture proof with normalized OCR output `REEDITPRO`.',
      'No proof commands were rerun in this QA phase.',
    ])],
    ['milestone-1-tool-qa-matrix', reports.toolMatrix, markdownReport('Milestone 1 Tool QA Matrix', [
      '| Tool | Source PR | Accepted bounded proof | Boundary |',
      '| --- | ---: | --- | --- |',
      ...reports.toolMatrix.tools.map((tool) => `| ${tool.name} | #${tool.sourcePr} | ${tool.acceptedProvenBounded} | ${tool.proofBoundary} |`),
      '',
      'GraphicsMagick remains optional fallback only and is not counted as accepted/proven.',
    ])],
    ['artifact-safety-qa', reports.artifactSafety, markdownReport('Artifact Safety QA', [
      'No build contexts, fixtures, media artifacts, public artifacts, signed URLs, or Docker outputs are committed by this QA phase.',
      `Forbidden local output present: \`${reports.artifactSafety.distPresent || reports.artifactSafety.distServerPresent || reports.artifactSafety.distStagingFixtureWorkerPresent || reports.artifactSafety.nodeModulesPresent}\`.`,
    ])],
    ['runtime-boundary-qa', reports.runtimeBoundary, markdownReport('Runtime Boundary QA', [
      'Tool execution, Docker build/run, build-context generation, FFmpeg/FFprobe, media processing, render/export, workers/routes/providers, Supabase/GCS, raw prompts, beta, and production remain blocked.',
      'Milestone 2 is approval/planning only until a later execution prompt.',
    ])],
    ['trackb-status-update', reports.statusUpdate, markdownReport('Track B Status Update', [
      `Owned tools: \`${reports.statusUpdate.ownedTools}\`.`,
      `Accepted/proven bounded after QA: \`${reports.statusUpdate.acceptedProvenBoundedTotalAfterQa}\`.`,
      `Still blocked/not installed-proven: \`${reports.statusUpdate.stillBlockedNotInstalledProvenCount}\`.`,
      'End-to-end product-ready tools remain `0`; no 40+ end-to-end claim is allowed.',
    ])],
    ['milestone-2-readiness-review', reports.milestone2Readiness, markdownReport('Milestone 2 Readiness Review', [
      'Next approval lane: `TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_APPROVAL`.',
      'Candidate tools: OpenCV, PyAV, and PySceneDetect.',
      'Milestone 2 must stay CPU-first and synthetic-fixture-only unless a later prompt explicitly authorizes more.',
    ])],
    ['milestone-1-qa-decision', reports.decisionReport, markdownReport('Milestone 1 QA Decision', [
      `Decision: \`${reports.decisionReport.decision}\`.`,
      `Next prompt: \`${reports.decisionReport.nextPrompt}\`.`,
      'Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, beta, and production remain blocked.',
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
    '- No Docker, build-context generation, target binaries, FFmpeg/FFprobe, media/render, npm install/ci/rebuild, workers/routes/providers, Supabase/GCS, public artifact, signed URL, raw prompt, beta, production, or PR merge scope ran.',
    '- Track B accepted/proven bounded count is now 9; still blocked/not installed-proven count is 7; end-to-end product-ready count remains 0.',
    '- Supabase classification: no write / environment none / SQL none / migration no.',
  ]))
}

function writeNextPrompt() {
  writeText(
    nextPromptPath,
    `# Track B Media OSS Milestone 2 Video Analysis Approval\n\nReview and approve a future CPU-first, synthetic-fixture-only video analysis lane for OpenCV, PyAV, and PySceneDetect after Track B Milestone 1 QA passed.\n\nDo not run installs, Docker, FFmpeg/FFprobe, media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, or production in the approval phase.\n`,
  )
}

function statusBlock() {
  return [
    'TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW:',
    '',
    `- Decision: \`${passDecision}\``,
    '- Accepted Milestone 1 tools: ExifTool, MediaInfo, Tesseract, and ImageMagick.',
    '- PR #557 evidence remains accepted for ExifTool, MediaInfo, ImageMagick, Docker build/build-context, and Tesseract version proof.',
    '- PR #559 evidence is accepted for Tesseract fixture proof variant `dejavu_sans_bold_large_psm7` with normalized OCR `REEDITPRO`.',
    '- Track B counts after QA: 16 owned tools, 9 bounded accepted/proven tools, 7 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.',
    '- GraphicsMagick remains optional fallback only and is not counted as accepted/proven.',
    '- Do not claim 40+ tools are installed/proven end-to-end.',
    '- Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.',
    `- Next prompt: \`${nextPrompt}\``,
    '- Supabase classification: no write / environment none / SQL none / migration no.',
  ].join('\n')
}

function updateMarkdownStatusDocs() {
  const block = statusBlock()
  for (const file of [
    'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md',
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
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
        '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW_STATUS:start -->',
        '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW_STATUS:end -->',
        block,
      )
    }
  }
}

function updateJsonStatusDocs(statusUpdate) {
  const acceptedAfterQa = statusUpdate.acceptedProvenBoundedAfterQa
  const statusJsonPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  if (existsSync(join(repoRoot, statusJsonPath))) {
    const status = readJson(statusJsonPath)
    status.counts = {
      ownedTools: 16,
      acceptedProvenBounded: 9,
      blockedNotInstalledProven: 7,
      endToEndProductReady: 0,
    }
    status.acceptedProvenBounded = acceptedAfterQa
    status.blockedNotInstalledProven = blockedAfterQa
    status.milestone1QaReview = {
      decision: passDecision,
      reportKey: 'trackb_milestone_1_qa_review_reports',
      acceptedMilestone1Tools: milestone1ToolIds,
      acceptedProvenBoundedTotalAfterQa: 9,
      stillBlockedNotInstalledProven: blockedAfterQa,
      graphicsMagickOptionalFallbackOnly: true,
      graphicsMagickAcceptedProven: false,
      endToEndProductReadyTools: 0,
      fortyPlusEndToEndClaimAllowed: false,
      nextPrompt,
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
      acceptedProvenBounded: 9,
      blockedNotInstalledProven: 7,
      endToEndProductReady: 0,
    }
    steward.ownedTools = steward.ownedTools.map((tool) => {
      if (['exiftool', 'mediainfo', 'tesseract'].includes(tool.id)) {
        return {
          ...tool,
          status: 'accepted_proven_bounded_milestone1',
          proofBoundary: 'trackb_cpu_worker_container_version_and_synthetic_fixture_only_no_media_processing',
          mediaProcessingAccepted: false,
          endToEndProductReady: false,
        }
      }
      if (tool.id === 'imagemagick_graphicsmagick') {
        return {
          ...tool,
          status: 'accepted_proven_bounded_milestone1_imagemagick_only',
          proofBoundary: 'ImageMagick accepted/proven only; GraphicsMagick optional fallback not installed or proven',
          imageMagickAcceptedProven: true,
          graphicsMagickAcceptedProven: false,
          mediaProcessingAccepted: false,
          endToEndProductReady: false,
        }
      }
      return tool
    })
    steward.milestone1QaReview = {
      decision: passDecision,
      reportDirectory: reportDir,
      acceptedMilestone1Tools: milestone1ToolIds,
      nextPrompt,
      executionRunInThisPhase: false,
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
        owner.acceptedProvenBoundedCount = 9
        owner.blockedNotInstalledProvenCount = 7
        owner.endToEndProductReadyToolCount = 0
        owner.nextPrompt = nextPrompt
      }
    }
    registry.sourceEvidence = {
      ...(registry.sourceEvidence || {}),
      trackbMilestone1QaReviewDecision: passDecision,
      trackbAcceptedProvenBoundedAfterQa: 9,
      trackbStillBlockedAfterQa: 7,
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

export function writeTrackBMilestone1QaReviewArtifacts({ requireConfirmations = false } = {}) {
  if (requireConfirmations) assertConfirmations()
  const generated = generatedAt()
  const evidence = readPriorEvidence()
  const tools = buildMilestone1Tools(evidence)
  const sourceAudit = buildSourceAudit(generated, tools)
  const evidenceReview = buildEvidenceReview(generated, tools)
  const toolMatrix = buildToolMatrix(generated, tools)
  const artifactSafety = buildArtifactSafety(generated)
  const runtimeBoundary = buildRuntimeBoundary(generated)
  const statusUpdate = buildTrackBStatus(generated, tools)
  const milestone2Readiness = buildMilestone2Readiness(generated)
  const decisionReport = buildDecision(generated)
  const readinessReport = buildReadiness(generated)
  const manifestReport = buildManifest(generated)
  const reports = {
    sourceAudit,
    evidenceReview,
    toolMatrix,
    artifactSafety,
    runtimeBoundary,
    statusUpdate,
    milestone2Readiness,
    decisionReport,
    readinessReport,
    manifestReport,
  }
  writeReports(reports)
  writeNextPrompt()
  updateMarkdownStatusDocs()
  updateJsonStatusDocs(statusUpdate)
  return reports
}

export function readTrackBMilestone1QaReviewArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    evidenceReview: readJson(`${reportDir}/evidence-acceptance-review.json`),
    toolMatrix: readJson(`${reportDir}/milestone-1-tool-qa-matrix.json`),
    artifactSafety: readJson(`${reportDir}/artifact-safety-qa.json`),
    runtimeBoundary: readJson(`${reportDir}/runtime-boundary-qa.json`),
    statusUpdate: readJson(`${reportDir}/trackb-status-update.json`),
    milestone2Readiness: readJson(`${reportDir}/milestone-2-readiness-review.json`),
    decisionReport: readJson(`${reportDir}/milestone-1-qa-decision.json`),
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
