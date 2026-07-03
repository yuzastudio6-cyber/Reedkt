import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  TrackaContainerFfmpegFfprobeVersionProbeDecision,
  TrackaContainerFfmpegFfprobeVersionProbeReportSet,
} from './tracka-container-ffmpeg-ffprobe-version-probe-types'

type JsonRecord = Record<string, unknown>

type CommandRunReport = {
  command: string
  args: string[]
  exactApprovedCommand: boolean
  run: boolean
  exitCode: number | null
  status: 'passed' | 'failed' | 'blocked' | 'not_run'
  stdoutPreview: string
  stderrPreview: string
  errorMessage: string | null
  timedOut: boolean
}

export const TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BRANCH =
  'codex/rp-open-source-tool-stack-tracka-container-docker-build-then-ffmpeg-ffprobe-version-probe-execution'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA =
  '2f6ab6463870dc12d6837dc71f816ad5eefcd88f'

const imageTag =
  'reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f'
const dockerfilePath = 'docker/prod/render-worker/Dockerfile'
const dockerBuildArgs = ['build', '-f', dockerfilePath, '-t', imageTag, '.']
const dockerFfmpegArgs = ['run', '--rm', '--network', 'none', '--entrypoint', 'ffmpeg', imageTag, '-version']
const dockerFfprobeArgs = ['run', '--rm', '--network', 'none', '--entrypoint', 'ffprobe', imageTag, '-version']
const dockerBuildCommand = `docker ${dockerBuildArgs.join(' ')}`
const dockerFfmpegCommand = `docker ${dockerFfmpegArgs.join(' ')}`
const dockerFfprobeCommand = `docker ${dockerFfprobeArgs.join(' ')}`

const passDecision: TrackaContainerFfmpegFfprobeVersionProbeDecision =
  'tracka_container_docker_build_then_ffmpeg_ffprobe_version_probe_passed_media_processing_still_blocked'
const passNextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW'
const blockerNextPrompt =
  'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION'
const passNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-qa-review.md'
const blockerNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-docker-build-then-ffmpeg-ffprobe-version-probe-blocker-resolution.md'

const sourceEvidencePaths = {
  blockerResolutionDecision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-probe-command-blocker-resolution-decision.json',
  blockerResolutionCommands:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-future-probe-commands.json',
  approvalDecision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  approvalFutureCommands:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/future-probe-command-approval.json',
  approvalRuntimePath:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/runtime-path-selection.json',
  approvalArtifactPolicy:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/package-docker-artifact-policy.json',
  trackaSourceDecision:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  trackaCentralEvidence:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/ffmpeg-ffprobe-central-evidence.json',
  systemBinaryReviewDecision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
  duckdbQaDecision: 'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
  duckdbExecutionDecision:
    'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json',
  polarsProof:
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json',
}

const reportPaths = {
  sourceAudit: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/source-of-truth-audit.json`,
  exactCommandSourceReview: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/exact-command-source-review.json`,
  exactCommandSourceReviewMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/exact-command-source-review.md`,
  preExecutionValidation: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/pre-execution-validation-report.json`,
  preExecutionValidationMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/pre-execution-validation-report.md`,
  dockerReadiness: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/docker-container-readiness-report.json`,
  ffmpegProbe: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/ffmpeg-version-probe-report.json`,
  ffprobeProbe: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/ffprobe-version-probe-report.json`,
  sideEffectSafety: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/side-effect-artifact-safety-report.json`,
  decision: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/tracka-container-ffmpeg-ffprobe-version-probe-decision.json`,
  decisionMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/tracka-container-ffmpeg-ffprobe-version-probe-decision.md`,
  readiness: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/tracka-container-ffmpeg-ffprobe-version-probe-readiness-report.json`,
  blockers: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/tracka-container-ffmpeg-ffprobe-version-probe-blocker-report.json`,
  privateManifest: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/tracka-container-ffmpeg-ffprobe-version-probe-private-artifact-manifest.json`,
  validationResults: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/tracka-container-ffmpeg-ffprobe-version-probe-validation-results.md`,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const predecessorPrs = [490, 486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416]
const referenceOnlyPrs = [428, 425, 432, 423, 420, 417, 401, 384]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_COMMAND_RESOLUTION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_TRACKA_RUNTIME_PATH_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_DOCKER_BUILD_EXACT_APPROVED_COMMAND',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_VERSION_PROBE_ONLY',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_NO_LOCAL_HOST_FFMPEG_FFPROBE',
    'REEDITPRO_CONFIRM_NO_MEDIA_INPUT',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_DOCKER_IMAGE_PUSH',
    'REEDITPRO_CONFIRM_DOCKER_ARTIFACT_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'LOCAL_HOST_FFMPEG_FFPROBE_PROBE',
    'SYSTEM_BINARY_INSTALL',
    'DOCKERFILE_MUTATION',
    'CONTAINER_DEFINITION_MUTATION',
    'CONTAINER_IMAGE_MUTATION',
    'DOCKER_IMAGE_PUSH',
    'MEDIA_FILE_PROBE',
    'CAPTION_BURN_IN_EXECUTION',
    'RENDER_EXPORT',
    'WORKER_EXECUTION',
    'TOOL_ROUTE_EXECUTION',
    'PROVIDER_CALLS',
    'DEPENDENCY_INSTALL',
    'NPM_INSTALL',
    'NPM_REBUILD',
    'PACKAGE_LIFECYCLE_SCRIPT_EXECUTION',
    'DUCKDB_IMPORT_SMOKE',
    'POLARS_IMPORT_SMOKE',
    'SUPABASE_METADATA_WRITE',
    'SUPABASE_PRODUCTION_SQL',
    'GCS_UPLOAD',
    'PUBLIC_ARTIFACTS',
    'SIGNED_URL_DELIVERY',
    'PRODUCTION_WRITE',
    'EXTERNAL_BETA_UNLOCK',
    'PAID_PRODUCTION_UNLOCK',
    'RAW_PROMPT_EXECUTION',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD_PRINT',
  ]
}

export function buildTrackaContainerFfmpegFfprobeVersionProbePlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION',
    branch: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BRANCH,
    baseBranch: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BASE_BRANCH,
    sourceSha: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA,
    mode: 'exact_tracka_render_worker_docker_build_then_container_version_probes',
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    imageTag,
    approvedCommands: {
      dockerBuildCommand,
      dockerFfmpegCommand,
      dockerFfprobeCommand,
    },
    expectedDecision: passDecision,
    nextPrompt: passNextPrompt,
    requiredConfirmations: requiredConfirmations(),
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, passNextPromptPath],
    explicitlyNotRun: [
      'local host ffmpeg or ffprobe',
      'Docker image push',
      'Dockerfile or container definition mutation',
      'media input or media probe',
      'decode encode caption burn-in render export',
      'npm install or rebuild',
      'DuckDB or Polars proof rerun',
      'worker route provider execution',
      'Supabase SQL GCS public artifact signed URL mutation',
      'raw prompt execution',
      'PR merge',
      'beta or production unlock',
    ],
  }
}

export function buildTrackaContainerFfmpegFfprobeVersionProbeReports(): TrackaContainerFfmpegFfprobeVersionProbeReportSet {
  return buildReports({ execute: false })
}

export function writeTrackaContainerFfmpegFfprobeVersionProbeArtifacts(options: { execute?: boolean } = {}) {
  const reports = buildReports(options)
  mkdirSync(TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.exactCommandSourceReview, reports.exactCommandSourceReview)
  writeText(reportPaths.exactCommandSourceReviewMd, exactCommandSourceReviewMarkdown(reports.exactCommandSourceReview))
  writeJson(reportPaths.preExecutionValidation, reports.preExecutionValidationReport)
  writeText(reportPaths.preExecutionValidationMd, preExecutionValidationMarkdown(reports.preExecutionValidationReport))
  writeJson(reportPaths.dockerReadiness, reports.dockerContainerReadinessReport)
  writeJson(reportPaths.ffmpegProbe, reports.ffmpegVersionProbeReport)
  writeJson(reportPaths.ffprobeProbe, reports.ffprobeVersionProbeReport)
  writeJson(reportPaths.sideEffectSafety, reports.sideEffectArtifactSafetyReport)
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(String(reports.decision.nextPromptFile), nextPromptMarkdown(reports))
  updateStatusDocs(reports)
  return reports
}

export function readTrackaContainerFfmpegFfprobeVersionProbeArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    exactCommandSourceReview: readJson(reportPaths.exactCommandSourceReview) ?? {},
    preExecutionValidationReport: readJson(reportPaths.preExecutionValidation) ?? {},
    dockerContainerReadinessReport: readJson(reportPaths.dockerReadiness) ?? {},
    ffmpegVersionProbeReport: readJson(reportPaths.ffmpegProbe) ?? {},
    ffprobeVersionProbeReport: readJson(reportPaths.ffprobeProbe) ?? {},
    sideEffectArtifactSafetyReport: readJson(reportPaths.sideEffectSafety) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    blockerReport: readJson(reportPaths.blockers) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateManifest) ?? {},
  }
}

export function summarizeTrackaContainerFfmpegFfprobeVersionProbe(
  reports:
    | TrackaContainerFfmpegFfprobeVersionProbeReportSet
    | ReturnType<typeof readTrackaContainerFfmpegFfprobeVersionProbeArtifacts> =
    buildTrackaContainerFfmpegFfprobeVersionProbeReports(),
) {
  return JSON.stringify(
    {
      decision: reports?.decision?.decision,
      readiness: reports?.readinessReport?.readiness,
      nextPrompt: reports?.decision?.nextPrompt,
      imageTag: reports?.exactCommandSourceReview?.imageTag,
      dockerBuildRun: reports?.dockerContainerReadinessReport?.dockerBuildRun,
      dockerBuildExitCode: reports?.dockerContainerReadinessReport?.dockerBuildExitCode,
      ffmpegProbeRun: reports?.ffmpegVersionProbeReport?.probeRun,
      ffmpegExitCode: reports?.ffmpegVersionProbeReport?.exitCode,
      ffprobeProbeRun: reports?.ffprobeVersionProbeReport?.probeRun,
      ffprobeExitCode: reports?.ffprobeVersionProbeReport?.exitCode,
      localHostSystemBinaryProbeUsed: reports?.decision?.localHostSystemBinaryProbeUsed,
      mediaProcessingAttempted: reports?.decision?.mediaProcessingAttempted,
      supabaseClassification: reports?.decision?.supabaseClassification,
      blockers: reports?.blockerReport?.blockers,
    },
    null,
    2,
  )
}

function buildReports(options: { execute?: boolean }): TrackaContainerFfmpegFfprobeVersionProbeReportSet {
  const generatedAt = new Date().toISOString()
  const sourceEvidence = readSourceEvidence()
  const packageState = capturePackageState()
  const prMetadata = buildPrMetadata()
  const flags = blockedFlags()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, sourceEvidence, packageState, prMetadata, flags)
  const exactCommandSourceReview = buildExactCommandSourceReview(generatedAt, sourceEvidence)
  const preExecutionValidationReport = buildPreExecutionValidationReport(generatedAt, sourceEvidence, exactCommandSourceReview)
  const dockerContainerReadinessReport = buildDockerContainerReadinessReport(
    generatedAt,
    options.execute === true && preExecutionValidationReport.passedForProbeExecution === true,
  )
  const ffmpegVersionProbeReport = buildVersionProbeReport(
    generatedAt,
    'ffmpeg',
    dockerContainerReadinessReport,
    options.execute === true &&
      preExecutionValidationReport.passedForProbeExecution === true &&
      dockerContainerReadinessReport.dockerBuildExitCode === 0,
  )
  const ffprobeVersionProbeReport = buildVersionProbeReport(
    generatedAt,
    'ffprobe',
    dockerContainerReadinessReport,
    options.execute === true &&
      preExecutionValidationReport.passedForProbeExecution === true &&
      dockerContainerReadinessReport.dockerBuildExitCode === 0 &&
      ffmpegVersionProbeReport.exitCode === 0,
  )
  const sideEffectArtifactSafetyReport = buildSideEffectArtifactSafetyReport(
    generatedAt,
    flags,
    dockerContainerReadinessReport,
    ffmpegVersionProbeReport,
    ffprobeVersionProbeReport,
  )
  const blockers = buildBlockers(
    preExecutionValidationReport,
    dockerContainerReadinessReport,
    ffmpegVersionProbeReport,
    ffprobeVersionProbeReport,
    sideEffectArtifactSafetyReport,
  )
  const decisionValue = chooseDecision(
    blockers,
    dockerContainerReadinessReport,
    ffmpegVersionProbeReport,
    ffprobeVersionProbeReport,
  )
  const readiness = decisionValue === passDecision
  const decision = buildDecision(generatedAt, decisionValue, readiness, blockers, flags, {
    dockerContainerReadinessReport,
    ffmpegVersionProbeReport,
    ffprobeVersionProbeReport,
  })

  return {
    sourceOfTruthAudit,
    exactCommandSourceReview,
    preExecutionValidationReport,
    dockerContainerReadinessReport,
    ffmpegVersionProbeReport,
    ffprobeVersionProbeReport,
    sideEffectArtifactSafetyReport,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.readiness.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      readyForQaReview: readiness,
      readyForDockerRuntimeFix: decisionValue === 'blocked_pending_docker_runtime_availability',
      readyForDockerBuildFix: decisionValue === 'blocked_pending_docker_build',
      readyForFfmpegProbeFix: decisionValue === 'blocked_pending_ffmpeg_version_probe',
      readyForFfprobeProbeFix: decisionValue === 'blocked_pending_ffprobe_version_probe',
      blockers,
      nextPrompt: decision.nextPrompt,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.blockers.v1',
      generatedAt,
      blockers,
      blockedScopesPreserved: sideEffectArtifactSafetyReport.passed === true,
      dockerRuntimeUnavailable: decisionValue === 'blocked_pending_docker_runtime_availability',
      dockerBuildFailed: decisionValue === 'blocked_pending_docker_build',
      ffmpegVersionProbeFailed: decisionValue === 'blocked_pending_ffmpeg_version_probe',
      ffprobeVersionProbeFailed: decisionValue === 'blocked_pending_ffprobe_version_probe',
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.privateArtifactManifest.v1',
      generatedAt,
      privatePayloadsAccessed: false,
      privatePayloadsPrinted: false,
      privatePayloadsCommitted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      mediaArtifactsCreated: false,
      dockerImagesBuilt: dockerContainerReadinessReport.dockerBuildExitCode === 0,
      dockerImagesPushed: false,
      reportDirectory: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR,
    },
  }
}

function buildSourceOfTruthAudit(
  generatedAt: string,
  sourceEvidence: JsonRecord,
  packageState: JsonRecord,
  prMetadata: JsonRecord,
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.sourceAudit.v1',
    generatedAt,
    phase: 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION',
    branch: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BRANCH,
    baseBranch: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BASE_BRANCH,
    sourceSha: safeGit(['rev-parse', 'HEAD']) ?? TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA,
    expectedMinimumSourceSha: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA,
    packageState,
    predecessorPrs,
    referenceOnlyPrs,
    pr490CommandResolutionEvidence: {
      decision: valueFrom(sourceEvidence.blockerResolutionDecision, 'decision'),
      mergedState: valueFrom(prMetadata.pr490, 'state'),
      mergedAt: valueFrom(prMetadata.pr490, 'mergedAt'),
      headRefOid: valueFrom(prMetadata.pr490, 'headRefOid'),
      mergeCommit: valueFrom(prMetadata.pr490, 'mergeCommit'),
    },
    pr481ApprovalEvidence: {
      decision: valueFrom(sourceEvidence.approvalDecision, 'decision'),
      mergedState: valueFrom(prMetadata.pr481, 'state'),
      mergedAt: valueFrom(prMetadata.pr481, 'mergedAt'),
    },
    pr477TrackaSourceEvidence: {
      decision: valueFrom(sourceEvidence.trackaSourceDecision, 'decision'),
      mergedState: valueFrom(prMetadata.pr477, 'state'),
      mergedAt: valueFrom(prMetadata.pr477, 'mergedAt'),
    },
    pr463ReferenceEvidence: {
      state: valueFrom(prMetadata.pr463, 'state'),
      mergedAt: valueFrom(prMetadata.pr463, 'mergedAt'),
      baseRefName: valueFrom(prMetadata.pr463, 'baseRefName'),
      centralCanonical: false,
    },
    duplicateSearches: {
      exactPhase: safePrSearch('OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION'),
      title: safePrSearch('Track A container Docker build FFmpeg FFprobe version probe execution'),
      imageTag: safePrSearch(imageTag),
    },
    evidenceFiles: sourceEvidencePaths,
    sourceEvidenceSummary: {
      blockerResolutionDecision: valueFrom(sourceEvidence.blockerResolutionDecision, 'decision'),
      approvalDecision: valueFrom(sourceEvidence.approvalDecision, 'decision'),
      trackaDecision: valueFrom(sourceEvidence.trackaSourceDecision, 'decision'),
      systemBinaryReviewDecision: valueFrom(sourceEvidence.systemBinaryReviewDecision, 'decision'),
      duckdbQaDecision: valueFrom(sourceEvidence.duckdbQaDecision, 'decision'),
      duckdbExecutionDecision: valueFrom(sourceEvidence.duckdbExecutionDecision, 'decision'),
      polarsProofStatus: valueFrom(sourceEvidence.polarsProof, 'status'),
    },
    noScopeConfirmation: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildExactCommandSourceReview(generatedAt: string, sourceEvidence: JsonRecord) {
  const blockerDecision = sourceEvidence.blockerResolutionDecision as JsonRecord
  const blockerCommands = sourceEvidence.blockerResolutionCommands as JsonRecord
  const resolvedForCurrentSourceSha = blockerCommands.resolvedForCurrentSourceSha as JsonRecord | undefined
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.exactCommandSourceReview.v1',
    generatedAt,
    sourceFilesReviewed: [
      sourceEvidencePaths.blockerResolutionDecision,
      sourceEvidencePaths.blockerResolutionCommands,
      sourceEvidencePaths.approvalDecision,
      sourceEvidencePaths.approvalRuntimePath,
      'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-docker-build-then-ffmpeg-ffprobe-version-probe-execution.md',
    ],
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    imageTag,
    exactContainerInvocationPresent: true,
    exactContainerInvocationSourceFile: sourceEvidencePaths.blockerResolutionCommands,
    approvedDockerBuildCommand: dockerBuildCommand,
    approvedFfmpegProbeCommand: dockerFfmpegCommand,
    approvedFfprobeProbeCommand: dockerFfprobeCommand,
    templateBuildCommand: blockerCommands.futureBuildCommand,
    templateFfmpegRunCommand: blockerCommands.futureFfmpegRunCommand,
    templateFfprobeRunCommand: blockerCommands.futureFfprobeRunCommand,
    pr490ResolvedBuildCommand: resolvedForCurrentSourceSha?.futureBuildCommand ?? null,
    pr490ResolvedFfmpegRunCommand: resolvedForCurrentSourceSha?.futureFfmpegRunCommand ?? null,
    pr490ResolvedFfprobeRunCommand: resolvedForCurrentSourceSha?.futureFfprobeRunCommand ?? null,
    commandTemplateToken: blockerCommands.commandTemplateToken,
    sourceSha: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA,
    localHostProbingApproved: false,
    localHostProbingUsed: false,
    mediaInputRequired: false,
    mediaInputAllowed: false,
    dockerImagePushApproved: false,
    commandUnambiguous: true,
    blocker: null,
    blockerResolutionDecision: blockerDecision.decision,
  }
}

function buildPreExecutionValidationReport(generatedAt: string, sourceEvidence: JsonRecord, exactCommand: JsonRecord) {
  const checks = {
    pr490BlockerResolutionDecision:
      valueFrom(sourceEvidence.blockerResolutionDecision, 'decision') ===
      'exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution',
    pr490FutureBuildCommandTemplate:
      valueFrom(sourceEvidence.blockerResolutionCommands, 'futureBuildCommand') ===
      'docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> .',
    pr490FutureFfmpegCommandTemplate:
      valueFrom(sourceEvidence.blockerResolutionCommands, 'futureFfmpegRunCommand') ===
      'docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version',
    pr490FutureFfprobeCommandTemplate:
      valueFrom(sourceEvidence.blockerResolutionCommands, 'futureFfprobeRunCommand') ===
      'docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version',
    pr481ApprovalDecision:
      valueFrom(sourceEvidence.approvalDecision, 'decision') ===
      'ffmpeg_ffprobe_version_probe_approval_passed_ready_for_tracka_container_probe_execution',
    pr477SourceDecision:
      valueFrom(sourceEvidence.trackaSourceDecision, 'decision') ===
      'tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval',
    pr472ReviewDecision:
      valueFrom(sourceEvidence.systemBinaryReviewDecision, 'decision') ===
      'ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge',
    duckdbQaAccepted:
      valueFrom(sourceEvidence.duckdbQaDecision, 'duckdbAccepted') === true ||
      valueFrom(sourceEvidence.duckdbQaDecision, 'duckdbAcceptedAsInstalledAndProven') === true,
    duckdbExecutionPassed:
      valueFrom(sourceEvidence.duckdbExecutionDecision, 'decision') ===
      'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing',
    polarsProofPresent:
      valueFrom(sourceEvidence.polarsProof, 'status') === 'passed' || valueFrom(sourceEvidence.polarsProof, 'passed') === true,
    dockerfilePresent: existsSync(dockerfilePath),
    exactContainerInvocationPresent: exactCommand.exactContainerInvocationPresent === true,
    localHostProbeBlocked: exactCommand.localHostProbingApproved === false,
    mediaInputBlocked: exactCommand.mediaInputAllowed === false,
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.preExecutionValidation.v1',
    generatedAt,
    checks,
    passedForProbeExecution: Object.values(checks).every(Boolean),
    exactCommandsRequired: [dockerBuildCommand, dockerFfmpegCommand, dockerFfprobeCommand],
    validationCommandsRequiredExternally: [
      'npm ci --ignore-scripts --no-audit --no-fund',
      'npm run open-source-tool-stack:tracka-container-ffmpeg-ffprobe-blocker-resolution:diagnostics',
      'npm run open-source-tool-stack:tracka-container-ffmpeg-ffprobe-version-probe:diagnostics',
      'npm run open-source-tool-stack:ffmpeg-ffprobe-version-probe-approval:diagnostics',
      'npm run tracka:ffmpeg-ffprobe-source-of-truth:diagnostics',
      'npm run open-source-tool-stack:ffmpeg-ffprobe-system-binary-review:diagnostics',
      'npm run open-source-tool-stack:duckdb-native-rebuild:qa:diagnostics',
      'npm run open-source-tool-stack:duckdb-native-rebuild:diagnostics',
      'npm run open-source-tool-stack:missing-optional-package-binary-execution:diagnostics',
      'npm run open-source-tool-stack:batch-1:qa-review:diagnostics',
      'npm run open-source-tool-stack:batch-1:execution:diagnostics',
      'npm run dependency-baseline:repair-before-tool-batch-1:diagnostics',
      'npm run open-source-tool-stack:audit:diagnostics',
    ],
  }
}

function buildDockerContainerReadinessReport(generatedAt: string, runBuild: boolean) {
  const result = runExactCommand(dockerBuildCommand, dockerBuildArgs, runBuild)
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.dockerContainerReadiness.v1',
    generatedAt,
    imageTag,
    dockerBuildCommand,
    dockerBuildArgs,
    dockerRuntimeCheckRun: false,
    dockerBuildRun: result.run,
    dockerBuildExitCode: result.exitCode,
    dockerBuildStatus: result.status,
    dockerBuildStdoutPreview: result.stdoutPreview,
    dockerBuildStderrPreview: result.stderrPreview,
    dockerBuildErrorMessage: result.errorMessage,
    dockerRuntimeUnavailable: result.errorMessage === 'spawn_enoent' || /cannot connect to the docker daemon|is the docker daemon running|docker daemon/i.test(result.stderrPreview),
    dockerRunRun: false,
    dockerImagePushRun: false,
    dockerfileMutationRun: false,
    containerDefinitionMutationRun: false,
    readinessStatus: result.run ? result.status : 'not_run',
    commandMatchesApproved: result.exactApprovedCommand,
  }
}

function buildVersionProbeReport(
  generatedAt: string,
  binary: 'ffmpeg' | 'ffprobe',
  dockerBuildReport: JsonRecord,
  runProbe: boolean,
) {
  const command = binary === 'ffmpeg' ? dockerFfmpegCommand : dockerFfprobeCommand
  const args = binary === 'ffmpeg' ? dockerFfmpegArgs : dockerFfprobeArgs
  const result = runExactCommand(command, args, runProbe)
  return {
    schema: `reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.${binary}VersionProbe.v1`,
    generatedAt,
    binary,
    imageTag,
    approvedContainerCommand: command,
    exactContainerInvocationPresent: true,
    probeRun: result.run,
    exitCode: result.exitCode,
    status: result.status,
    stdoutPreview: result.stdoutPreview,
    stderrPreview: result.stderrPreview,
    errorMessage: result.errorMessage,
    versionDetected: detectVersion(binary, result.stdoutPreview),
    noLocalHostProbe: true,
    noMediaInput: true,
    noFileProbe: true,
    noDecode: true,
    noEncode: true,
    noOutputFiles: true,
    blockedBeforeProbe: runProbe === false,
    dockerBuildExitCode: dockerBuildReport.dockerBuildExitCode,
    commandMatchesApproved: result.exactApprovedCommand,
  }
}

function buildSideEffectArtifactSafetyReport(
  generatedAt: string,
  flags: JsonRecord,
  dockerBuildReport: JsonRecord,
  ffmpegReport: JsonRecord,
  ffprobeReport: JsonRecord,
) {
  const packageJsonClean = gitStatus('package.json') === ''
  const packageLockClean = gitStatus('package-lock.json') === ''
  const dockerfileClean = gitStatus(dockerfilePath) === ''
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.sideEffectArtifactSafety.v1',
    generatedAt,
    noLocalHostProbe: true,
    noMediaInput: true,
    noMediaOutput: true,
    noGeneratedMediaArtifacts: true,
    noDockerImagePush: true,
    dockerImageBuiltLocally: dockerBuildReport.dockerBuildExitCode === 0,
    noDockerfileMutation: dockerfileClean,
    noContainerConfigMutation: true,
    noPackageJsonDependencyMutation: packageJsonClean,
    noPackageLockMutation: packageLockClean,
    noSupabaseWrites: true,
    noSql: true,
    noGcsUpload: true,
    noPublicArtifacts: true,
    noSignedUrls: true,
    noBetaProductionUnlock: true,
    noNonApprovedCommandRun:
      dockerBuildReport.commandMatchesApproved === true &&
      (ffmpegReport.probeRun !== true || ffmpegReport.commandMatchesApproved === true) &&
      (ffprobeReport.probeRun !== true || ffprobeReport.commandMatchesApproved === true),
    executionScope: flags,
    passed:
      Object.values(flags).every((value) => value === false) &&
      packageJsonClean &&
      packageLockClean &&
      dockerfileClean &&
      dockerBuildReport.dockerImagePushRun === false &&
      ffmpegReport.noMediaInput === true &&
      ffprobeReport.noMediaInput === true,
  }
}

function buildDecision(
  generatedAt: string,
  decision: TrackaContainerFfmpegFfprobeVersionProbeDecision,
  readiness: boolean,
  blockers: string[],
  flags: JsonRecord,
  reports: {
    dockerContainerReadinessReport: JsonRecord
    ffmpegVersionProbeReport: JsonRecord
    ffprobeVersionProbeReport: JsonRecord
  },
) {
  const nextPrompt = readiness ? passNextPrompt : blockerNextPrompt
  const nextPromptFile = readiness ? passNextPromptPath : blockerNextPromptPath
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.decision.v1',
    generatedAt,
    decision,
    readiness,
    nextPrompt,
    nextPromptFile,
    blockers,
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    imageTag,
    approvedCommands: {
      dockerBuildCommand,
      dockerFfmpegCommand,
      dockerFfprobeCommand,
    },
    exactContainerInvocationPresent: true,
    ffmpegAcceptedAsInstalledAndProven: reports.ffmpegVersionProbeReport.exitCode === 0,
    ffprobeAcceptedAsInstalledAndProven: reports.ffprobeVersionProbeReport.exitCode === 0,
    ffmpegProbeRun: reports.ffmpegVersionProbeReport.probeRun === true,
    ffprobeProbeRun: reports.ffprobeVersionProbeReport.probeRun === true,
    dockerAvailabilityChecked: reports.dockerContainerReadinessReport.dockerBuildRun === true,
    dockerBuildAttempted: reports.dockerContainerReadinessReport.dockerBuildRun === true,
    dockerBuildExitCode: reports.dockerContainerReadinessReport.dockerBuildExitCode,
    dockerRunAttempted:
      reports.ffmpegVersionProbeReport.probeRun === true || reports.ffprobeVersionProbeReport.probeRun === true,
    dockerImagePushAttempted: false,
    localHostSystemBinaryProbeUsed: false,
    dockerfileMutationAttempted: false,
    containerDefinitionMutationAttempted: false,
    mediaProcessingAttempted: false,
    mediaInputUsed: false,
    mediaOutputCreated: false,
    captionBurnInAttempted: false,
    renderExportAttempted: false,
    packageJsonDependencyMutationAttempted: false,
    packageLockMutationAttempted: false,
    npmInstallAttempted: false,
    npmRebuildAttempted: false,
    packageLifecycleScriptsAttempted: false,
    duckdbProofRerun: false,
    polarsProofRerun: false,
    routeExecutionAttempted: false,
    workerExecutionAttempted: false,
    providerCallsAttempted: false,
    browserCaptureAttempted: false,
    mapRenderingAttempted: false,
    supabaseWritesAttempted: false,
    sqlExecuted: false,
    gcsUploadAttempted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptsExecuted: false,
    betaProductionUnlocked: false,
    executionScope: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildBlockers(
  preExecution: JsonRecord,
  dockerBuild: JsonRecord,
  ffmpegProbe: JsonRecord,
  ffprobeProbe: JsonRecord,
  sideEffectSafety: JsonRecord,
) {
  const blockers: string[] = []
  if (preExecution.passedForProbeExecution !== true) blockers.push('rejected_due_runtime_safety_risk')
  if (dockerBuild.dockerBuildRun !== true) blockers.push('blocked_pending_docker_runtime_availability')
  if (dockerBuild.dockerRuntimeUnavailable === true) blockers.push('blocked_pending_docker_runtime_availability')
  if (dockerBuild.dockerBuildRun === true && dockerBuild.dockerBuildExitCode !== 0) blockers.push('blocked_pending_docker_build')
  if (dockerBuild.dockerBuildExitCode === 0 && ffmpegProbe.exitCode !== 0) blockers.push('blocked_pending_ffmpeg_version_probe')
  if (dockerBuild.dockerBuildExitCode === 0 && ffmpegProbe.exitCode === 0 && ffprobeProbe.exitCode !== 0) {
    blockers.push('blocked_pending_ffprobe_version_probe')
  }
  if (sideEffectSafety.passed !== true) blockers.push('blocked_pending_artifact_safety_review')
  return [...new Set(blockers)]
}

function chooseDecision(
  blockers: string[],
  dockerBuild: JsonRecord,
  ffmpegProbe: JsonRecord,
  ffprobeProbe: JsonRecord,
): TrackaContainerFfmpegFfprobeVersionProbeDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('blocked_pending_artifact_safety_review')) return 'blocked_pending_artifact_safety_review'
  if (blockers.includes('blocked_pending_docker_runtime_availability')) return 'blocked_pending_docker_runtime_availability'
  if (blockers.includes('blocked_pending_docker_build')) return 'blocked_pending_docker_build'
  if (blockers.includes('blocked_pending_ffmpeg_version_probe')) return 'blocked_pending_ffmpeg_version_probe'
  if (blockers.includes('blocked_pending_ffprobe_version_probe')) return 'blocked_pending_ffprobe_version_probe'
  if (dockerBuild.dockerBuildExitCode === 0 && ffmpegProbe.exitCode === 0 && ffprobeProbe.exitCode === 0) return passDecision
  return 'blocked_pending_docker_runtime_availability'
}

function readSourceEvidence() {
  return Object.fromEntries(Object.entries(sourceEvidencePaths).map(([key, path]) => [key, readJson(path) ?? {}]))
}

function buildPrMetadata() {
  return Object.fromEntries(predecessorPrs.map((number) => [`pr${number}`, safePrView(number)]))
}

function capturePackageState() {
  return {
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile(dockerfilePath),
    packageJsonChanged: gitStatus('package.json') !== '',
    packageLockChanged: gitStatus('package-lock.json') !== '',
    dockerfileChanged: gitStatus(dockerfilePath) !== '',
  }
}

function blockedFlags() {
  return {
    localHostSystemBinaryProbeAllowed: false,
    dockerImagePushAllowed: false,
    dockerfileMutationAllowed: false,
    containerDefinitionMutationAllowed: false,
    mediaInputAllowed: false,
    mediaFileProbeAllowed: false,
    decodeAllowed: false,
    encodeAllowed: false,
    captionBurnInAllowed: false,
    renderExportAllowed: false,
    outputFilesAllowed: false,
    npmInstallAllowed: false,
    npmRebuildAllowed: false,
    packageLifecycleScriptsAllowed: false,
    packageLockMutationAllowed: false,
    duckdbProofRerunAllowed: false,
    polarsProofRerunAllowed: false,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    providerExecutionAllowed: false,
    browserCaptureAllowed: false,
    mapRenderingAllowed: false,
    supabaseWritesAllowed: false,
    sqlAllowed: false,
    gcsUploadAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
    rawPromptExecutionAllowed: false,
    betaUnlockAllowed: false,
    productionUnlockAllowed: false,
  }
}

function runExactCommand(command: string, args: string[], run: boolean): CommandRunReport {
  if (!run) {
    return {
      command,
      args,
      exactApprovedCommand: isApprovedCommand(command),
      run: false,
      exitCode: null,
      status: 'not_run',
      stdoutPreview: '',
      stderrPreview: '',
      errorMessage: null,
      timedOut: false,
    }
  }

  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
    timeout: 1000 * 60 * 30,
  })
  const exitCode = typeof result.status === 'number' ? result.status : result.error ? 1 : 0
  const errorMessage = result.error
    ? result.error.message.includes('ENOENT')
      ? 'spawn_enoent'
      : result.error.message
    : null

  return {
    command,
    args,
    exactApprovedCommand: isApprovedCommand(command),
    run: true,
    exitCode,
    status: exitCode === 0 ? 'passed' : 'failed',
    stdoutPreview: preview(result.stdout ?? ''),
    stderrPreview: preview(result.stderr ?? ''),
    errorMessage,
    timedOut: result.error?.message.includes('ETIMEDOUT') === true,
  }
}

function isApprovedCommand(command: string) {
  return command === dockerBuildCommand || command === dockerFfmpegCommand || command === dockerFfprobeCommand
}

function detectVersion(binary: 'ffmpeg' | 'ffprobe', output: string) {
  const match = output.match(new RegExp(`${binary}\\s+version\\s+([^\\s]+)`, 'i'))
  return match?.[1] ?? null
}

function exactCommandSourceReviewMarkdown(report: JsonRecord) {
  return `# Exact Command Source Review

- Selected runtime path: \`${report.selectedRuntimePath}\`
- Image tag: \`${report.imageTag}\`
- Exact container invocation present: \`${report.exactContainerInvocationPresent}\`
- Docker build command: \`${report.approvedDockerBuildCommand}\`
- FFmpeg probe command: \`${report.approvedFfmpegProbeCommand}\`
- FFprobe probe command: \`${report.approvedFfprobeProbeCommand}\`
- Local host probing approved: \`${report.localHostProbingApproved}\`
- Media input allowed: \`${report.mediaInputAllowed}\`

PR #490 resolves the prior exact-command blocker with a build-then-container-version-probe path.
`
}

function preExecutionValidationMarkdown(report: JsonRecord) {
  return `# Pre-Execution Validation

Probe execution validation passed: \`${report.passedForProbeExecution}\`

Exact commands:
- \`${(report.exactCommandsRequired as string[]).join('`\n- `')}\`
`
}

function decisionMarkdown(report: JsonRecord) {
  return `# Track A Container Docker Build Then FFmpeg/FFprobe Version-Probe Decision

Decision: \`${report.decision}\`

Next prompt: \`${report.nextPrompt}\`

- Docker build attempted: \`${report.dockerBuildAttempted}\`
- Docker build exit code: \`${report.dockerBuildExitCode}\`
- FFmpeg probe run: \`${report.ffmpegProbeRun}\`
- FFprobe probe run: \`${report.ffprobeProbeRun}\`
- Local host probing used: \`${report.localHostSystemBinaryProbeUsed}\`
- Media processing attempted: \`${report.mediaProcessingAttempted}\`
- Supabase update: \`${(report.supabaseClassification as JsonRecord).updateRequired}\`
`
}

function validationResultsMarkdown(reports: TrackaContainerFfmpegFfprobeVersionProbeReportSet) {
  return `# Validation Results

- Decision: \`${reports.decision.decision}\`
- Docker build command: \`${reports.exactCommandSourceReview.approvedDockerBuildCommand}\`
- Docker build run: \`${reports.dockerContainerReadinessReport.dockerBuildRun}\`
- Docker build exit code: \`${reports.dockerContainerReadinessReport.dockerBuildExitCode}\`
- FFmpeg probe run: \`${reports.ffmpegVersionProbeReport.probeRun}\`
- FFmpeg exit code: \`${reports.ffmpegVersionProbeReport.exitCode}\`
- FFmpeg version detected: \`${reports.ffmpegVersionProbeReport.versionDetected}\`
- FFprobe probe run: \`${reports.ffprobeVersionProbeReport.probeRun}\`
- FFprobe exit code: \`${reports.ffprobeVersionProbeReport.exitCode}\`
- FFprobe version detected: \`${reports.ffprobeVersionProbeReport.versionDetected}\`
- Side-effect safety passed: \`${reports.sideEffectArtifactSafetyReport.passed}\`
- Docker image pushed: \`${reports.decision.dockerImagePushAttempted}\`
- Media processing attempted: \`${reports.decision.mediaProcessingAttempted}\`
- Supabase classification: no write / none / none / no
`
}

function nextPromptMarkdown(reports: TrackaContainerFfmpegFfprobeVersionProbeReportSet) {
  if (reports.decision.decision === passDecision) {
    return `# OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW

Review the committed Track A container Docker build and FFmpeg/FFprobe version-probe reports. Do not rerun Docker build/run, FFmpeg/FFprobe probes, media processing, render/export, workers, routes, providers, Supabase, GCS, public artifacts, signed URLs, raw prompts, beta, or production.

Decision: \`${reports.decision.decision}\`
`
  }

  return `# OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION

Resolve the blocked Track A container Docker build then FFmpeg/FFprobe version-probe result without broadening scope.

Decision: \`${reports.decision.decision}\`

Do not fall back to local host binaries, media file probes, Dockerfile mutation, image push, or production/runtime unlocks.
`
}

function updateStatusDocs(reports: TrackaContainerFfmpegFfprobeVersionProbeReportSet) {
  const section = `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION:

- Decision: \`${reports.decision.decision}\`.
- Selected runtime path: \`tracka_repo_owned_render_worker_container\`.
- Image tag: \`${reports.exactCommandSourceReview.imageTag}\`.
- Docker build run / exit: \`${reports.dockerContainerReadinessReport.dockerBuildRun}\` / \`${reports.dockerContainerReadinessReport.dockerBuildExitCode}\`.
- FFmpeg probe run / exit / version: \`${reports.ffmpegVersionProbeReport.probeRun}\` / \`${reports.ffmpegVersionProbeReport.exitCode}\` / \`${reports.ffmpegVersionProbeReport.versionDetected}\`.
- FFprobe probe run / exit / version: \`${reports.ffprobeVersionProbeReport.probeRun}\` / \`${reports.ffprobeVersionProbeReport.exitCode}\` / \`${reports.ffprobeVersionProbeReport.versionDetected}\`.
- Local host probing remains not approved and was not used.
- Media processing, caption burn-in, render/export, Docker image push, Dockerfile/container mutation, npm install/rebuild, DuckDB/Polars proof rerun, worker/route/provider execution, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.
- Next prompt: \`${reports.decision.nextPrompt}\`.
- Supabase classification: no write / none / none / no.`

  for (const file of statusDocPaths) {
    upsertSection(file, 'OPEN_SOURCE_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_STATUS', section)
  }
}

function readJson(path: string) {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as JsonRecord
}

function writeJson(path: string, value: unknown) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(path: string, value: string) {
  const directory = path.split('/').slice(0, -1).join('/')
  if (directory) mkdirSync(directory, { recursive: true })
  writeFileSync(path, value)
}

function hashFile(path: string) {
  if (!existsSync(path)) return null
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function safeGit(args: string[]) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    }).trim()
  } catch {
    return null
  }
}

function gitStatus(path: string) {
  return safeGit(['status', '--short', '--', path]) ?? ''
}

function safePrView(number: number) {
  try {
    const output = execFileSync(
      'gh',
      [
        'pr',
        'view',
        String(number),
        '--repo',
        'yuzastudio6-cyber/Reedkt',
        '--json',
        'number,title,state,mergedAt,baseRefName,headRefName,headRefOid,mergeCommit,url',
      ],
      { encoding: 'utf8' },
    )
    return JSON.parse(output) as JsonRecord
  } catch {
    return {}
  }
}

function safePrSearch(query: string) {
  try {
    const output = execFileSync(
      'gh',
      [
        'pr',
        'list',
        '--repo',
        'yuzastudio6-cyber/Reedkt',
        '--state',
        'open',
        '--search',
        query,
        '--json',
        'number,title,headRefName,baseRefName,isDraft,url',
      ],
      { encoding: 'utf8' },
    )
    return JSON.parse(output) as unknown
  } catch {
    return []
  }
}

function valueFrom(source: unknown, key: string) {
  if (!source || typeof source !== 'object') return undefined
  return (source as JsonRecord)[key]
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}

function upsertSection(file: string, marker: string, body: string) {
  if (!existsSync(file)) return
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const block = `${start}\n${body}\n${end}`
  const current = readFileSync(file, 'utf8')
  if (current.includes(start) && current.includes(end)) {
    const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`)
    writeText(file, current.replace(pattern, block))
    return
  }
  writeText(file, `${current.trimEnd()}\n\n${block}\n`)
}

function preview(value: string) {
  return value.slice(0, 12000)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
