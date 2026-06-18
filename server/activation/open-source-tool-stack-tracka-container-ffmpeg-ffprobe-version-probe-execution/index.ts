import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  TrackaContainerFfmpegFfprobeVersionProbeDecision,
  TrackaContainerFfmpegFfprobeVersionProbeReportSet,
} from './tracka-container-ffmpeg-ffprobe-version-probe-types'

type JsonRecord = Record<string, unknown>

export const TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BRANCH =
  'codex/rp-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-execution'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA =
  'adfb8f98b5ba618205c59327d06615e28e9b6b7f'

const expectedDecision: TrackaContainerFfmpegFfprobeVersionProbeDecision =
  'blocked_pending_exact_probe_command_source'
const blockerNextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION'
const passNextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW'
const blockerNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution.md'
const passNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-qa-review.md'

const sourceEvidencePaths = {
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
  trackaFutureBoundary:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/future-version-probe-boundary.json',
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

const predecessorPrs = [481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416]
const referenceOnlyPrs = [428, 425, 432, 423, 420, 417, 401, 384]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_TRACKA_RUNTIME_PATH_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_VERSION_PROBE_ONLY',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_NO_LOCAL_HOST_FFMPEG_FFPROBE',
    'REEDITPRO_CONFIRM_NO_MEDIA_INPUT',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_DOCKER_ARTIFACT_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'SYSTEM_BINARY_INSTALL',
    'DOCKERFILE_MUTATION',
    'CONTAINER_IMAGE_MUTATION',
    'DOCKER_IMAGE_PUSH',
    'MEDIA_PROCESSING',
    'MEDIA_FILE_PROBE',
    'CAPTION_BURN_IN_EXECUTION',
    'RENDER_EXPORT',
    'WORKER_EXECUTION',
    'TOOL_ROUTE_EXECUTION',
    'PROVIDER_CALLS',
    'DEPENDENCY_INSTALL',
    'NPM_INSTALL',
    'NPM_REBUILD',
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
    phase: 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION',
    branch: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BRANCH,
    baseBranch: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BASE_BRANCH,
    expectedSourceSha: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA,
    mode: 'blocked_before_probe_until_exact_container_invocation_source_exists',
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    approvedInnerCommands: ['ffmpeg -version', 'ffprobe -version'],
    expectedDecision,
    nextPrompt: blockerNextPrompt,
    requiredConfirmations: requiredConfirmations(),
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, blockerNextPromptPath],
    explicitlyNotRun: [
      'local host ffmpeg or ffprobe',
      'docker build',
      'docker run',
      'docker/container mutation',
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
  const generatedAt = new Date().toISOString()
  const sourceEvidence = readSourceEvidence()
  const packageState = capturePackageState()
  const prMetadata = buildPrMetadata()
  const flags = blockedFlags()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, sourceEvidence, packageState, prMetadata, flags)
  const exactCommandSourceReview = buildExactCommandSourceReview(generatedAt, sourceEvidence)
  const preExecutionValidationReport = buildPreExecutionValidationReport(generatedAt, sourceEvidence, exactCommandSourceReview)
  const dockerContainerReadinessReport = buildDockerContainerReadinessReport(generatedAt, exactCommandSourceReview)
  const ffmpegVersionProbeReport = buildVersionProbeReport(generatedAt, 'ffmpeg', exactCommandSourceReview)
  const ffprobeVersionProbeReport = buildVersionProbeReport(generatedAt, 'ffprobe', exactCommandSourceReview)
  const sideEffectArtifactSafetyReport = buildSideEffectArtifactSafetyReport(generatedAt, flags)
  const blockers = buildBlockers(
    exactCommandSourceReview,
    preExecutionValidationReport,
    dockerContainerReadinessReport,
    sideEffectArtifactSafetyReport,
  )
  const decisionValue = chooseDecision(blockers)
  const readiness = decisionValue === 'tracka_container_ffmpeg_ffprobe_version_probe_passed_media_processing_still_blocked'
  const decision = buildDecision(generatedAt, decisionValue, readiness, blockers, flags)

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
      readyForBlockerResolution: decisionValue === 'blocked_pending_exact_probe_command_source',
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.blockers.v1',
      generatedAt,
      blockers,
      exactProbeCommandSourceMissing: blockers.includes('blocked_pending_exact_probe_command_source'),
      blockedScopesPreserved: Object.values(flags).every((value) => value === false),
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
      dockerImagesPushed: false,
      reportDirectory: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR,
    },
  }
}

export function writeTrackaContainerFfmpegFfprobeVersionProbeArtifacts() {
  const reports = buildTrackaContainerFfmpegFfprobeVersionProbeReports()
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
  writeText(blockerNextPromptPath, blockerNextPromptMarkdown(reports))
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
      selectedRuntimePath: reports?.exactCommandSourceReview?.selectedRuntimePath,
      approvedInnerCommands: reports?.exactCommandSourceReview?.approvedInnerCommands,
      exactContainerInvocationPresent: reports?.exactCommandSourceReview?.exactContainerInvocationPresent,
      ffmpegProbeRun: reports?.ffmpegVersionProbeReport?.probeRun,
      ffprobeProbeRun: reports?.ffprobeVersionProbeReport?.probeRun,
      localHostSystemBinaryProbeUsed: reports?.decision?.localHostSystemBinaryProbeUsed,
      mediaProcessingAttempted: reports?.decision?.mediaProcessingAttempted,
      supabaseClassification: reports?.decision?.supabaseClassification,
      blockers: reports?.blockerReport?.blockers,
    },
    null,
    2,
  )
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
    phase: 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION',
    branch: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BRANCH,
    baseBranch: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BASE_BRANCH,
    sourceSha: safeGit(['rev-parse', 'HEAD']) ?? TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA,
    expectedMinimumSourceSha: TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_SHA,
    packageState,
    predecessorPrs,
    referenceOnlyPrs,
    pr481ApprovalEvidence: {
      decision: valueFrom(sourceEvidence.approvalDecision, 'decision'),
      mergedState: valueFrom(prMetadata.pr481, 'state'),
      mergedAt: valueFrom(prMetadata.pr481, 'mergedAt'),
      headRefOid: valueFrom(prMetadata.pr481, 'headRefOid'),
      mergeCommit: valueFrom(prMetadata.pr481, 'mergeCommit'),
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
      exactPhase: safePrSearch('OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION'),
      title: safePrSearch('Track A container FFmpeg FFprobe version probe execution'),
      commands: safePrSearch('ffmpeg -version ffprobe -version'),
    },
    evidenceFiles: sourceEvidencePaths,
    sourceEvidenceSummary: {
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
  const approvalDecision = sourceEvidence.approvalDecision as JsonRecord
  const futureCommands = sourceEvidence.approvalFutureCommands as JsonRecord
  const runtimePath = sourceEvidence.approvalRuntimePath as JsonRecord
  const artifactPolicy = sourceEvidence.approvalArtifactPolicy as JsonRecord
  const approvedInnerCommands = Array.isArray(futureCommands.commandsApprovedForFutureSeparateExecution)
    ? futureCommands.commandsApprovedForFutureSeparateExecution.filter((value): value is string => typeof value === 'string')
    : []
  const exactContainerInvocationPresent = false
  const dockerBuildRequired = false
  const dockerRunRequired = false

  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.exactCommandSourceReview.v1',
    generatedAt,
    sourceFilesReviewed: [
      sourceEvidencePaths.approvalDecision,
      sourceEvidencePaths.approvalFutureCommands,
      sourceEvidencePaths.approvalRuntimePath,
      sourceEvidencePaths.approvalArtifactPolicy,
      'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-execution.md',
    ],
    selectedRuntimePath: runtimePath.selectedRuntimePath ?? 'tracka_repo_owned_render_worker_container',
    approvedInnerCommands,
    exactFfmpegProbeCommand: approvedInnerCommands.includes('ffmpeg -version') ? 'ffmpeg -version' : null,
    exactFfprobeProbeCommand: approvedInnerCommands.includes('ffprobe -version') ? 'ffprobe -version' : null,
    exactContainerInvocationPresent,
    exactContainerInvocationSourceFile: null,
    exactContainerInvocation: null,
    dockerBuildRequired,
    dockerRunRequired,
    dockerBuildApprovedBySource: runtimePath.dockerBuildApprovedNow === true || artifactPolicy.dockerBuildApprovedNow === true,
    dockerRunApprovedBySource: runtimePath.dockerRunApprovedNow === true || artifactPolicy.dockerRunApprovedNow === true,
    dockerContainerMutationApprovedBySource:
      runtimePath.dockerContainerMutationApprovedNow === true || artifactPolicy.containerRuntimeMutationApprovedNow === true,
    localHostProbingApproved: runtimePath.localHostSystemBinaryApproved === true,
    localHostProbingUsed: false,
    mediaInputRequired: false,
    mediaInputAllowed: futureCommands.mediaInputAllowed === true,
    commandUnambiguous: false,
    exactContainerCommandMissingReason:
      'PR #481 approves only the inner version commands for a future Track A container path. It does not define an exact Docker/container invocation, and Docker build/run are explicitly not approved in the approval packet.',
    stopBeforeProbeExecution: true,
    blocker: 'blocked_pending_exact_probe_command_source',
    approvalDecision: approvalDecision.decision,
  }
}

function buildPreExecutionValidationReport(generatedAt: string, sourceEvidence: JsonRecord, exactCommand: JsonRecord) {
  const checks = {
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
    dockerfilePresent: existsSync('docker/prod/render-worker/Dockerfile'),
    localHostProbeBlocked: exactCommand.localHostProbingApproved === false,
    exactContainerInvocationMissing: exactCommand.exactContainerInvocationPresent === false,
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.preExecutionValidation.v1',
    generatedAt,
    checks,
    passedForBlockedPacket: Object.values(checks).every(Boolean),
    passedForProbeExecution: false,
    validationCommandsRequiredExternally: [
      'npm ci --ignore-scripts --no-audit --no-fund',
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

function buildDockerContainerReadinessReport(generatedAt: string, exactCommand: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.dockerContainerReadiness.v1',
    generatedAt,
    dockerRuntimeCheckRun: false,
    dockerBuildRun: false,
    dockerRunRun: false,
    dockerImagePushRun: false,
    dockerfileMutationRun: false,
    containerDefinitionMutationRun: false,
    readinessStatus: 'not_checked_blocked_before_runtime',
    blockedBeforeDockerReadiness: exactCommand.exactContainerInvocationPresent === false,
    blocker: 'blocked_pending_exact_probe_command_source',
  }
}

function buildVersionProbeReport(generatedAt: string, binary: 'ffmpeg' | 'ffprobe', exactCommand: JsonRecord) {
  const command = binary === 'ffmpeg' ? exactCommand.exactFfmpegProbeCommand : exactCommand.exactFfprobeProbeCommand
  return {
    schema: `reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.${binary}VersionProbe.v1`,
    generatedAt,
    binary,
    approvedInnerCommand: command,
    exactContainerInvocationPresent: exactCommand.exactContainerInvocationPresent,
    probeRun: false,
    exitCode: null,
    stdoutPreview: '',
    stderrPreview: '',
    versionDetected: null,
    noMediaInput: true,
    noFileProbe: true,
    noDecode: true,
    noEncode: true,
    noOutputFiles: true,
    blockedBeforeProbe: true,
    blocker: binary === 'ffmpeg' ? 'blocked_pending_ffmpeg_version_probe' : 'blocked_pending_ffprobe_version_probe',
    rootBlocker: 'blocked_pending_exact_probe_command_source',
  }
}

function buildSideEffectArtifactSafetyReport(generatedAt: string, flags: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.sideEffectArtifactSafety.v1',
    generatedAt,
    noMediaInput: true,
    noMediaOutput: true,
    noGeneratedMediaArtifacts: true,
    noDockerImagePush: true,
    noDockerfileMutation: true,
    noContainerConfigMutation: true,
    noPackageJsonDependencyMutation: true,
    noPackageLockMutation: gitStatus('package-lock.json') === '',
    noSupabaseWrites: true,
    noSql: true,
    noGcsUpload: true,
    noPublicArtifacts: true,
    noSignedUrls: true,
    noBetaProductionUnlock: true,
    noNonApprovedCommandRun: true,
    executionScope: flags,
    passed: Object.values(flags).every((value) => value === false) && gitStatus('package-lock.json') === '',
  }
}

function buildDecision(
  generatedAt: string,
  decision: TrackaContainerFfmpegFfprobeVersionProbeDecision,
  readiness: boolean,
  blockers: string[],
  flags: JsonRecord,
) {
  const nextPrompt = decision === 'blocked_pending_exact_probe_command_source' ? blockerNextPrompt : passNextPrompt
  const nextPromptFile = decision === 'blocked_pending_exact_probe_command_source' ? blockerNextPromptPath : passNextPromptPath
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeVersionProbe.decision.v1',
    generatedAt,
    decision,
    readiness,
    nextPrompt,
    nextPromptFile,
    blockers,
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    approvedInnerCommands: ['ffmpeg -version', 'ffprobe -version'],
    exactContainerInvocationPresent: false,
    ffmpegAcceptedAsInstalledAndProven: false,
    ffprobeAcceptedAsInstalledAndProven: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    localHostSystemBinaryProbeUsed: false,
    dockerAvailabilityChecked: false,
    dockerBuildAttempted: false,
    dockerRunAttempted: false,
    dockerImagePushAttempted: false,
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
  exactCommand: JsonRecord,
  preExecution: JsonRecord,
  dockerReadiness: JsonRecord,
  sideEffectSafety: JsonRecord,
) {
  const blockers: string[] = []
  if (exactCommand.exactContainerInvocationPresent !== true) blockers.push('blocked_pending_exact_probe_command_source')
  if (preExecution.passedForBlockedPacket !== true) blockers.push('blocked_pending_tracka_container_runtime')
  if (dockerReadiness.blockedBeforeDockerReadiness !== true) blockers.push('blocked_pending_docker_runtime_availability')
  if (sideEffectSafety.passed !== true) blockers.push('blocked_pending_artifact_safety_review')
  return [...new Set(blockers)]
}

function chooseDecision(blockers: string[]): TrackaContainerFfmpegFfprobeVersionProbeDecision {
  if (blockers.includes('blocked_pending_exact_probe_command_source')) return 'blocked_pending_exact_probe_command_source'
  if (blockers.includes('blocked_pending_artifact_safety_review')) return 'blocked_pending_artifact_safety_review'
  return 'tracka_container_ffmpeg_ffprobe_version_probe_passed_media_processing_still_blocked'
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
    packageJsonChanged: gitStatus('package.json') !== '',
    packageLockChanged: gitStatus('package-lock.json') !== '',
    dockerfileChanged: gitStatus('docker/prod/render-worker/Dockerfile') !== '',
  }
}

function blockedFlags() {
  return {
    ffmpegProbeAllowedWithoutExactContainerInvocation: false,
    ffprobeProbeAllowedWithoutExactContainerInvocation: false,
    localHostSystemBinaryProbeAllowed: false,
    dockerBuildAllowed: false,
    dockerRunAllowed: false,
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

function exactCommandSourceReviewMarkdown(report: JsonRecord) {
  return `# Exact Command Source Review

Decision: \`${report.blocker}\`

- Selected runtime path: \`${report.selectedRuntimePath}\`
- Approved inner commands: \`${(report.approvedInnerCommands as string[]).join('`, `')}\`
- Exact container invocation present: \`${report.exactContainerInvocationPresent}\`
- Docker build approved by source: \`${report.dockerBuildApprovedBySource}\`
- Docker run approved by source: \`${report.dockerRunApprovedBySource}\`
- Local host probing approved: \`${report.localHostProbingApproved}\`

The packet stops before FFmpeg/FFprobe version probes because PR #481 does not define an exact container command. The approved inner commands are not enough to infer Docker build/run mechanics.
`
}

function preExecutionValidationMarkdown(report: JsonRecord) {
  return `# Pre-Execution Validation

Blocked-packet validation passed: \`${report.passedForBlockedPacket}\`

Probe execution validation passed: \`${report.passedForProbeExecution}\`

This report confirms source evidence is present while preserving the stop-before-probe blocker.
`
}

function decisionMarkdown(report: JsonRecord) {
  return `# Track A Container FFmpeg/FFprobe Version-Probe Decision

Decision: \`${report.decision}\`

Next prompt: \`${report.nextPrompt}\`

The version probes were not run. PR #481 approves the Track A render-worker/container path and the inner commands \`ffmpeg -version\` and \`ffprobe -version\`, but it does not provide an exact container invocation. Local host probing remains disallowed.
`
}

function validationResultsMarkdown(reports: TrackaContainerFfmpegFfprobeVersionProbeReportSet) {
  return `# Validation Results

- Decision: \`${reports.decision.decision}\`
- Source-of-truth audit generated: yes
- Exact command source review generated: yes
- FFmpeg probe run: \`${reports.ffmpegVersionProbeReport.probeRun}\`
- FFprobe probe run: \`${reports.ffprobeVersionProbeReport.probeRun}\`
- Side-effect safety passed: \`${reports.sideEffectArtifactSafetyReport.passed}\`
- Supabase classification: no write / none / none / no
`
}

function blockerNextPromptMarkdown(reports: TrackaContainerFfmpegFfprobeVersionProbeReportSet) {
  return `# OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION

Resolve the exact container invocation blocker before running any FFmpeg/FFprobe version probes.

Current decision: \`${reports.decision.decision}\`

Required source update:
- Provide the exact approved Track A container command(s) that execute only \`ffmpeg -version\` and \`ffprobe -version\`.
- State whether Docker build/run is approved, and if so provide the exact bounded command.
- Preserve no media input, no media probing, no decode/encode, no caption burn-in, no render/export, no Dockerfile/container mutation, no image push, and no public artifact or signed URL behavior.

Do not fall back to local host binaries.
`
}

function updateStatusDocs(reports: TrackaContainerFfmpegFfprobeVersionProbeReportSet) {
  const section = `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION:

- Decision: \`${reports.decision.decision}\`.
- Selected runtime path: \`tracka_repo_owned_render_worker_container\`.
- Approved inner commands from PR #481: \`ffmpeg -version\` and \`ffprobe -version\`.
- Exact container invocation source: missing, so FFmpeg/FFprobe probes were not run.
- Local host probing remains not approved.
- Next prompt: \`${reports.decision.nextPrompt}\`.
- No FFmpeg/FFprobe probe, Docker build/run, Docker/container mutation, media input/probe/decode/encode, caption burn-in, render/export, npm install/rebuild, DuckDB/Polars proof rerun, worker/route/provider execution, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, or production scope is enabled.
- Supabase classification: no write / none / none / no.`

  for (const file of statusDocPaths) {
    upsertSection(file, 'OPEN_SOURCE_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_STATUS', section)
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
