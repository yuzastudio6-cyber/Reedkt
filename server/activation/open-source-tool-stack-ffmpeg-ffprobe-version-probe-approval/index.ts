import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  FfmpegFfprobeVersionProbeApprovalDecision,
  FfmpegFfprobeVersionProbeApprovalReportSet,
} from './ffmpeg-ffprobe-version-probe-approval-types'

type JsonRecord = Record<string, unknown>

export const FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR =
  'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval'
export const FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_BRANCH =
  'codex/rp-open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval'
export const FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_SOURCE_SHA =
  '33d7a6696b92f69f0bdad92b5ee43ecef80adcab'

const expectedDecision: FfmpegFfprobeVersionProbeApprovalDecision =
  'ffmpeg_ffprobe_version_probe_approval_passed_ready_for_tracka_container_probe_execution'
const nextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION'
const nextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-execution.md'

const sourceEvidencePaths = {
  trackaDecision:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  trackaCentralEvidence:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/ffmpeg-ffprobe-central-evidence.json',
  trackaFutureBoundary:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/future-version-probe-boundary.json',
  trackaCentralPresence:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/central-presence-check.json',
  systemBinaryReviewDecision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
  duckdbQaDecision: 'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
  polarsProof:
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json',
}

const reportPaths = {
  sourceAudit: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/source-of-truth-audit.json`,
  evidenceRevalidation: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/evidence-revalidation-report.json`,
  evidenceRevalidationMd: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/evidence-revalidation-report.md`,
  runtimePathSelection: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/runtime-path-selection.json`,
  runtimePathSelectionMd: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/runtime-path-selection.md`,
  futureProbeCommandApproval: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/future-probe-command-approval.json`,
  futureProbeCommandApprovalMd: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/future-probe-command-approval.md`,
  blockedScopePolicy: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/blocked-scope-policy.json`,
  blockedScopePolicyMd: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/blocked-scope-policy.md`,
  packageDockerArtifactPolicy: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/package-docker-artifact-policy.json`,
  packageDockerArtifactPolicyMd: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/package-docker-artifact-policy.md`,
  decision: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/ffmpeg-ffprobe-version-probe-approval-decision.json`,
  decisionMd: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/ffmpeg-ffprobe-version-probe-approval-decision.md`,
  readiness: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/ffmpeg-ffprobe-version-probe-approval-readiness-report.json`,
  blockers: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/ffmpeg-ffprobe-version-probe-approval-blocker-report.json`,
  privateArtifactManifest: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/ffmpeg-ffprobe-version-probe-approval-private-artifact-manifest.json`,
  validationResults: `${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/ffmpeg-ffprobe-version-probe-approval-validation-results.md`,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const predecessorPrs = [477, 472, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [463, 428, 425, 432, 423, 420, 417, 401, 384]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL',
    'REEDITPRO_CONFIRM_TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_COMPLETED',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_RUNTIME_PATH_SELECTION',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_VERSION_COMMAND_BOUNDARY',
    'REEDITPRO_CONFIRM_NO_FFMPEG_FFPROBE_PROBES',
    'REEDITPRO_CONFIRM_NO_DOCKER_BUILD_OR_CONTAINER_MUTATION',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING_OR_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'LOCAL_HOST_BINARY_PROBE',
    'FFMPEG_PROBE_EXECUTION',
    'FFPROBE_PROBE_EXECUTION',
    'FFMPEG_VERSION_PROBE_EXECUTION',
    'FFPROBE_VERSION_PROBE_EXECUTION',
    'DOCKER_BUILD',
    'DOCKER_RUN',
    'CONTAINER_MUTATION',
    'MEDIA_PROCESSING',
    'CAPTION_BURNIN',
    'RENDER_EXPORT',
    'NPM_INSTALL',
    'NPM_REBUILD',
    'LIFECYCLE_SCRIPT',
    'DUCKDB_PROOF',
    'POLARS_PROOF',
    'WORKER_EXECUTION',
    'TOOL_ROUTE_EXECUTION',
    'PROVIDER_CALLS',
    'SUPABASE_WRITE',
    'SUPABASE_SQL',
    'GCS_UPLOAD',
    'PUBLIC_ARTIFACT',
    'SIGNED_URL',
    'RAW_PROMPT',
    'EXTERNAL_BETA',
    'PAID_PRODUCTION',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD',
  ]
}

export function buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL',
    branch: FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_BRANCH,
    baseBranch: FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_BASE_BRANCH,
    expectedSourceSha: FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_SOURCE_SHA,
    mode: 'metadata_approval_only_no_probe_no_docker_no_media',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    nextPrompt,
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, nextPromptPath],
    selectedFutureRuntimePath: 'tracka_repo_owned_render_worker_container',
    forbiddenActions: [
      'ffmpeg_or_ffprobe_probe_now',
      'local_host_binary_probe',
      'docker_build_or_container_mutation',
      'media_processing_or_caption_burnin',
      'render_export',
      'npm_install_or_rebuild',
      'duckdb_polars_proof_rerun',
      'worker_route_provider_execution',
      'supabase_sql_gcs_public_artifact_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalReports(): FfmpegFfprobeVersionProbeApprovalReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceEvidence = readSourceEvidence()
  const packageState = capturePackageState()
  const prMetadata = buildPrMetadata()
  const evidenceRevalidationReport = buildEvidenceRevalidationReport(generatedAt, sourceEvidence, prMetadata)
  const runtimePathSelection = buildRuntimePathSelection(generatedAt, sourceEvidence)
  const futureProbeCommandApproval = buildFutureProbeCommandApproval(generatedAt, runtimePathSelection)
  const blockedScopePolicy = buildBlockedScopePolicy(generatedAt, flags)
  const packageDockerArtifactPolicy = buildPackageDockerArtifactPolicy(generatedAt)
  const blockers = buildBlockers(
    evidenceRevalidationReport,
    runtimePathSelection,
    futureProbeCommandApproval,
    blockedScopePolicy,
    packageDockerArtifactPolicy,
  )
  const decisionValue = chooseDecision(blockers)
  const readiness = decisionValue === expectedDecision
  const decision = buildDecision(generatedAt, decisionValue, readiness, blockers, flags)

  return {
    sourceOfTruthAudit: buildSourceOfTruthAudit(generatedAt, packageState, prMetadata, sourceEvidence, flags),
    evidenceRevalidationReport,
    runtimePathSelection,
    futureProbeCommandApproval,
    blockedScopePolicy,
    packageDockerArtifactPolicy,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.readiness.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      readyForTrackaContainerProbeExecutionPacket: readiness,
      readyForImmediateVersionProbeExecution: false,
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.blockers.v1',
      generatedAt,
      blockers,
      blockedScopesPreserved: Object.values(flags).every((value) => value === false),
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.privateArtifactManifest.v1',
      generatedAt,
      privatePayloadsAccessed: false,
      privatePayloadsPrinted: false,
      privatePayloadsCommitted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      reportDirectory: FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR,
    },
  }
}

export function writeOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalArtifacts() {
  const reports = buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalReports()
  mkdirSync(FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.evidenceRevalidation, reports.evidenceRevalidationReport)
  writeText(reportPaths.evidenceRevalidationMd, evidenceRevalidationMarkdown(reports.evidenceRevalidationReport))
  writeJson(reportPaths.runtimePathSelection, reports.runtimePathSelection)
  writeText(reportPaths.runtimePathSelectionMd, runtimePathSelectionMarkdown(reports.runtimePathSelection))
  writeJson(reportPaths.futureProbeCommandApproval, reports.futureProbeCommandApproval)
  writeText(reportPaths.futureProbeCommandApprovalMd, futureProbeCommandApprovalMarkdown(reports.futureProbeCommandApproval))
  writeJson(reportPaths.blockedScopePolicy, reports.blockedScopePolicy)
  writeText(reportPaths.blockedScopePolicyMd, blockedScopePolicyMarkdown(reports.blockedScopePolicy))
  writeJson(reportPaths.packageDockerArtifactPolicy, reports.packageDockerArtifactPolicy)
  writeText(reportPaths.packageDockerArtifactPolicyMd, packageDockerArtifactPolicyMarkdown(reports.packageDockerArtifactPolicy))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(nextPromptPath, nextPromptMarkdown(reports))
  updateStatusDocs(reports)
  return reports
}

export function readOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    evidenceRevalidationReport: readJson(reportPaths.evidenceRevalidation) ?? {},
    runtimePathSelection: readJson(reportPaths.runtimePathSelection) ?? {},
    futureProbeCommandApproval: readJson(reportPaths.futureProbeCommandApproval) ?? {},
    blockedScopePolicy: readJson(reportPaths.blockedScopePolicy) ?? {},
    packageDockerArtifactPolicy: readJson(reportPaths.packageDockerArtifactPolicy) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    blockerReport: readJson(reportPaths.blockers) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest) ?? {},
  }
}

export function summarizeOpenSourceToolStackFfmpegFfprobeVersionProbeApproval(
  reports:
    | FfmpegFfprobeVersionProbeApprovalReportSet
    | ReturnType<typeof readOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalArtifacts> =
    buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalReports(),
) {
  return JSON.stringify(
    {
      decision: reports?.decision?.decision,
      readiness: reports?.readinessReport?.readiness,
      nextPrompt: reports?.decision?.nextPrompt,
      selectedRuntimePath: reports?.runtimePathSelection?.selectedRuntimePath,
      localHostSystemBinaryApproved: reports?.runtimePathSelection?.localHostSystemBinaryApproved,
      futureCommands: reports?.futureProbeCommandApproval?.commandsApprovedForFutureSeparateExecution,
      versionProbeRunInThisPhase: reports?.decision?.versionProbeRunInThisPhase,
      supabaseClassification: reports?.decision?.supabaseClassification,
      blockers: reports?.blockerReport?.blockers,
    },
    null,
    2,
  )
}

function buildSourceOfTruthAudit(
  generatedAt: string,
  packageState: JsonRecord,
  prMetadata: JsonRecord,
  sourceEvidence: JsonRecord,
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.sourceAudit.v1',
    generatedAt,
    phase: 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL',
    sourceBranch: FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_BASE_BRANCH,
    sourceSha: safeGit(['rev-parse', 'HEAD']) ?? FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_SOURCE_SHA,
    expectedMinimumSourceSha: FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_SOURCE_SHA,
    branch: FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_BRANCH,
    packageState,
    predecessorPrs,
    referenceOnlyPrs,
    pr477CentralMergeEvidence: prMetadata.pr477,
    pr463ReferenceEvidence: prMetadata.pr463,
    duplicateSearches: {
      versionProbeApproval: safePrSearch('FFmpeg FFprobe version probe approval'),
      trackaContainerProbeExecution: safePrSearch('Track A container FFmpeg FFprobe version probe execution'),
    },
    sourceEvidenceSummary: {
      trackaDecision: valueFrom(sourceEvidence.trackaDecision, 'decision'),
      centralEvidenceStatus: valueFrom(sourceEvidence.trackaCentralEvidence, 'centralEvidenceStatus'),
      systemBinaryReviewDecision: valueFrom(sourceEvidence.systemBinaryReviewDecision, 'decision'),
      duckdbQaDecision: valueFrom(sourceEvidence.duckdbQaDecision, 'decision'),
      polarsProofStatus: valueFrom(sourceEvidence.polarsProof, 'status'),
    },
    absentBroadProductionDocs: [
      'docs/beta-readiness-scorecard.md',
      'docs/production-beta-blocker-inventory.md',
      'PRODUCTION_FOUNDATION_STATUS.md',
    ].filter((file) => !existsSync(file)),
    executionScope: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildEvidenceRevalidationReport(generatedAt: string, sourceEvidence: JsonRecord, prMetadata: JsonRecord) {
  const trackaDecision = sourceEvidence.trackaDecision as JsonRecord
  const trackaCentralEvidence = sourceEvidence.trackaCentralEvidence as JsonRecord
  const trackaFutureBoundary = sourceEvidence.trackaFutureBoundary as JsonRecord
  const systemDecision = sourceEvidence.systemBinaryReviewDecision as JsonRecord
  const duckdbDecision = sourceEvidence.duckdbQaDecision as JsonRecord
  const polarsProof = sourceEvidence.polarsProof as JsonRecord
  const checks = {
    pr477Merged: valueFrom(prMetadata.pr477, 'state') === 'MERGED' && Boolean(valueFrom(prMetadata.pr477, 'mergedAt')),
    pr463MergedReference:
      valueFrom(prMetadata.pr463, 'state') === 'MERGED' &&
      valueFrom(prMetadata.pr463, 'baseRefName') !== FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_BASE_BRANCH,
    trackaDecisionReady:
      trackaDecision.decision ===
      'tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval',
    centralEvidenceReconciled: trackaCentralEvidence.centralEvidenceStatus === 'reference_reconciled_not_version_proven',
    centralDockerfilePresent: trackaCentralEvidence.dockerfilePresentInCentral === true,
    trackaFutureApprovalReady: trackaFutureBoundary.readyForFutureVersionProbeApprovalPacket === true,
    systemBinaryReviewReady:
      systemDecision.decision === 'ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge',
    duckdbAccepted: duckdbDecision.duckdbAcceptedAsInstalledAndProven === true,
    polarsAccepted:
      duckdbDecision.polarsAcceptedAsInstalledAndProven === true || polarsProof.status === 'passed' || polarsProof.passed === true,
    ffmpegNotProven:
      trackaCentralEvidence.ffmpegAcceptedAsInstalledAndProven === false &&
      systemDecision.ffmpegAcceptedAsInstalledAndProven === false,
    ffprobeNotProven:
      trackaCentralEvidence.ffprobeAcceptedAsInstalledAndProven === false &&
      systemDecision.ffprobeAcceptedAsInstalledAndProven === false,
  }
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.evidenceRevalidation.v1',
    generatedAt,
    passed: Object.values(checks).every(Boolean),
    checks,
    pr463ReferenceOnly: true,
    pr463CentralCanonical: false,
    ffmpegAcceptedAsInstalledAndProven: false,
    ffprobeAcceptedAsInstalledAndProven: false,
    versionProbeRunInThisPhase: false,
    evidenceFiles: sourceEvidencePaths,
  }
}

function buildRuntimePathSelection(generatedAt: string, sourceEvidence: JsonRecord) {
  const centralEvidence = sourceEvidence.trackaCentralEvidence as JsonRecord
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.runtimePathSelection.v1',
    generatedAt,
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    selectionReason:
      'Central source evidence points to docker/prod/render-worker/Dockerfile for FFmpeg/FFprobe. A local host binary probe is not the source-of-truth path.',
    ffmpegSourcePath: centralEvidence.ffmpegPath ?? 'docker://docker/prod/render-worker/Dockerfile#ffmpeg',
    ffprobeSourcePath: centralEvidence.ffprobePath ?? 'docker://docker/prod/render-worker/Dockerfile#ffprobe',
    dockerfilePath: 'docker/prod/render-worker/Dockerfile',
    dockerfilePresentInCentral: existsSync('docker/prod/render-worker/Dockerfile'),
    localHostSystemBinaryApproved: false,
    localHostSystemBinaryProbeBlocked: true,
    trackaContainerVersionProbeApprovedForFutureSeparateExecution: true,
    workerContainerEquivalentAllowedForFutureSeparateExecution: true,
    dockerBuildApprovedNow: false,
    dockerRunApprovedNow: false,
    dockerContainerMutationApprovedNow: false,
    versionProbeExecutionRunNow: false,
    mediaProcessingApproved: false,
  }
}

function buildFutureProbeCommandApproval(generatedAt: string, runtimePathSelection: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.futureProbeCommandApproval.v1',
    generatedAt,
    approvalScope: 'future_separate_execution_packet_only',
    executionEnvironment: runtimePathSelection.selectedRuntimePath,
    commandsApprovedForFutureSeparateExecution: ['ffmpeg -version', 'ffprobe -version'],
    exactCommandClasses: ['ffmpeg_version_output_only', 'ffprobe_version_output_only'],
    timeoutSeconds: 15,
    stdoutPolicy: 'capture_bounded_private_report_preview_only',
    stderrPolicy: 'capture_bounded_private_report_preview_only',
    mediaInputAllowed: false,
    fileProbeAllowed: false,
    decodeAllowed: false,
    encodeAllowed: false,
    captionBurnInAllowed: false,
    renderExportAllowed: false,
    outputFilesAllowed: false,
    privateDataMountsAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
    versionProbeRunInThisPhase: false,
    stopOnFirstFailure: true,
  }
}

function buildBlockedScopePolicy(generatedAt: string, flags: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.blockedScopePolicy.v1',
    generatedAt,
    allExecutionUnlockFlagsFalse: Object.values(flags).every((value) => value === false),
    executionScope: flags,
    blockedScopes: [
      'ffmpeg_ffprobe_probe_now',
      'local_host_binary_probe',
      'docker_build',
      'docker_run',
      'docker_container_mutation',
      'media_processing',
      'caption_burnin',
      'render_export',
      'worker_execution',
      'route_execution',
      'provider_calls',
      'supabase_sql_gcs_public_artifact_signed_url_mutation',
      'raw_prompt_execution',
      'beta_or_production_unlock',
    ],
  }
}

function buildPackageDockerArtifactPolicy(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.packageDockerArtifactPolicy.v1',
    generatedAt,
    packageJsonDependencyMutationAllowed: false,
    packageLockMutationAllowed: false,
    npmInstallAllowed: false,
    npmRebuildAllowed: false,
    packageLifecycleScriptsAllowed: false,
    dockerfileMutationAllowed: false,
    dockerignoreMutationAllowed: false,
    dockerBuildApprovedNow: false,
    dockerRunApprovedNow: false,
    containerRuntimeMutationApprovedNow: false,
    nativeArtifactsCommittedAllowed: false,
    nodeModulesCommittedAllowed: false,
    mediaArtifactsCommittedAllowed: false,
    futureContainerProbeMayUseExistingRepoDockerfileReference: true,
    trackedFileDiffsExpected: [
      'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/**',
      'server/activation/open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval/**',
      'server/cli/open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval*.ts',
      'server/smoke/open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval-smoke.ts',
      'scripts/validation/open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval-diagnostics.mjs',
      'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-execution.md',
      'safe package.json script additions only',
    ],
  }
}

function buildDecision(
  generatedAt: string,
  decision: FfmpegFfprobeVersionProbeApprovalDecision,
  readiness: boolean,
  blockers: string[],
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeVersionProbeApproval.decision.v1',
    generatedAt,
    decision,
    readiness,
    nextPrompt,
    nextPromptFile: nextPromptPath,
    blockers,
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    ffmpegAcceptedAsInstalledAndProven: false,
    ffprobeAcceptedAsInstalledAndProven: false,
    ffmpegVersionProbeApprovedForFutureSeparateExecution: readiness,
    ffprobeVersionProbeApprovedForFutureSeparateExecution: readiness,
    futureVersionProbeExecutionRequiresSeparatePrompt: true,
    localHostSystemBinaryApproved: false,
    versionProbeRunInThisPhase: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    dockerBuildAttempted: false,
    dockerRunAttempted: false,
    dockerContainerMutationAttempted: false,
    dockerBuildApprovedNow: false,
    dockerRunApprovedNow: false,
    mediaProcessingAttempted: false,
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
  evidence: JsonRecord,
  runtimePath: JsonRecord,
  commandApproval: JsonRecord,
  blockedScopePolicy: JsonRecord,
  packageDockerPolicy: JsonRecord,
) {
  const blockers: string[] = []
  if (evidence.passed !== true) blockers.push('blocked_pending_tracka_source_of_truth_evidence')
  if (
    runtimePath.selectedRuntimePath !== 'tracka_repo_owned_render_worker_container' ||
    runtimePath.dockerfilePresentInCentral !== true ||
    runtimePath.localHostSystemBinaryApproved !== false
  ) {
    blockers.push('blocked_pending_tracka_container_runtime_path')
  }
  if (
    !Array.isArray(commandApproval.commandsApprovedForFutureSeparateExecution) ||
    !commandApproval.commandsApprovedForFutureSeparateExecution.includes('ffmpeg -version') ||
    !commandApproval.commandsApprovedForFutureSeparateExecution.includes('ffprobe -version') ||
    commandApproval.versionProbeRunInThisPhase !== false ||
    commandApproval.mediaInputAllowed !== false
  ) {
    blockers.push('blocked_pending_future_probe_command_boundary')
  }
  if (blockedScopePolicy.allExecutionUnlockFlagsFalse !== true) blockers.push('blocked_pending_blocked_scope_policy')
  if (
    packageDockerPolicy.packageLockMutationAllowed !== false ||
    packageDockerPolicy.dockerfileMutationAllowed !== false ||
    packageDockerPolicy.dockerBuildApprovedNow !== false ||
    packageDockerPolicy.containerRuntimeMutationApprovedNow !== false
  ) {
    blockers.push('blocked_pending_package_docker_artifact_policy')
  }
  return [...new Set(blockers)]
}

function chooseDecision(blockers: string[]): FfmpegFfprobeVersionProbeApprovalDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('blocked_pending_tracka_container_runtime_path')) return 'blocked_pending_tracka_container_runtime_path'
  if (blockers.includes('blocked_pending_future_probe_command_boundary')) {
    return 'blocked_pending_future_probe_command_boundary'
  }
  if (blockers.includes('blocked_pending_package_docker_artifact_policy')) {
    return 'blocked_pending_package_docker_artifact_policy'
  }
  if (blockers.includes('blocked_pending_blocked_scope_policy')) return 'blocked_pending_blocked_scope_policy'
  if (blockers.includes('blocked_pending_tracka_source_of_truth_evidence')) {
    return 'blocked_pending_tracka_source_of_truth_evidence'
  }
  return expectedDecision
}

function blockedFlags() {
  return {
    ffmpegVersionProbeRunNowAllowed: false,
    ffprobeVersionProbeRunNowAllowed: false,
    localHostBinaryProbeAllowed: false,
    dockerBuildAllowed: false,
    dockerRunAllowed: false,
    dockerContainerMutationAllowed: false,
    mediaProcessingAllowed: false,
    captionBurnInAllowed: false,
    renderExportAllowed: false,
    npmInstallAllowed: false,
    npmRebuildAllowed: false,
    packageLifecycleScriptsAllowed: false,
    duckdbProofRerunAllowed: false,
    polarsProofRerunAllowed: false,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    providerExecutionAllowed: false,
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

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}

function readSourceEvidence() {
  return Object.fromEntries(Object.entries(sourceEvidencePaths).map(([key, file]) => [key, readJson(file) ?? { missing: true, file }]))
}

function buildPrMetadata() {
  const rows: JsonRecord = {}
  for (const number of predecessorPrs) rows[`pr${number}`] = safePrView(number)
  rows.pr463 = safePrView(463)
  return rows
}

function capturePackageState() {
  const packageJson = readJson('package.json') ?? {}
  const packageLock = existsSync('package-lock.json') ? readFileSync('package-lock.json', 'utf8') : ''
  return {
    packageJsonHash: existsSync('package.json') ? hash(readFileSync('package.json', 'utf8')) : null,
    packageLockHash: packageLock ? hash(packageLock) : null,
    dependencies: Object.keys((packageJson.dependencies as JsonRecord | undefined) ?? {}).sort(),
    devDependencies: Object.keys((packageJson.devDependencies as JsonRecord | undefined) ?? {}).sort(),
    packageLockPresent: packageLock.length > 0,
  }
}

function evidenceRevalidationMarkdown(report: JsonRecord) {
  return `# Evidence Revalidation

- Passed: ${report.passed}
- PR #477 merged into central source: ${(report.checks as JsonRecord)?.pr477Merged}
- PR #463 reference-only evidence: ${(report.checks as JsonRecord)?.pr463MergedReference}
- Track A central evidence reconciled: ${(report.checks as JsonRecord)?.centralEvidenceReconciled}
- Dockerfile present in central source: ${(report.checks as JsonRecord)?.centralDockerfilePresent}
- FFmpeg proven now: ${report.ffmpegAcceptedAsInstalledAndProven}
- FFprobe proven now: ${report.ffprobeAcceptedAsInstalledAndProven}
- Version probe run in this phase: ${report.versionProbeRunInThisPhase}
`
}

function runtimePathSelectionMarkdown(report: JsonRecord) {
  return `# Runtime Path Selection

Selected future runtime path: \`${report.selectedRuntimePath}\`.

The approved future target is the Track A repo-owned render-worker/container-equivalent path represented by \`${report.dockerfilePath}\`. Local host binary probing is not approved.

- FFmpeg source path: \`${report.ffmpegSourcePath}\`
- FFprobe source path: \`${report.ffprobeSourcePath}\`
- Local host binary approved: ${report.localHostSystemBinaryApproved}
- Docker build approved now: ${report.dockerBuildApprovedNow}
- Version probe run now: ${report.versionProbeExecutionRunNow}
`
}

function futureProbeCommandApprovalMarkdown(report: JsonRecord) {
  const commands = Array.isArray(report.commandsApprovedForFutureSeparateExecution)
    ? report.commandsApprovedForFutureSeparateExecution.map((command) => `- \`${command}\``).join('\n')
    : ''
  return `# Future Probe Command Approval

This packet approves command shape for a future separately authorized execution packet only.

${commands}

- Execution environment: \`${report.executionEnvironment}\`
- Timeout seconds: ${report.timeoutSeconds}
- Media input allowed: ${report.mediaInputAllowed}
- File probe allowed: ${report.fileProbeAllowed}
- Decode allowed: ${report.decodeAllowed}
- Encode allowed: ${report.encodeAllowed}
- Output files allowed: ${report.outputFilesAllowed}
- Version probe run in this phase: ${report.versionProbeRunInThisPhase}
`
}

function blockedScopePolicyMarkdown(report: JsonRecord) {
  const blocked = Array.isArray(report.blockedScopes) ? report.blockedScopes.map((scope) => `- \`${scope}\``).join('\n') : ''
  return `# Blocked Scope Policy

All execution unlock flags false: ${report.allExecutionUnlockFlagsFalse}

${blocked}
`
}

function packageDockerArtifactPolicyMarkdown(report: JsonRecord) {
  return `# Package And Docker Artifact Policy

- package.json dependency mutation allowed: ${report.packageJsonDependencyMutationAllowed}
- package-lock mutation allowed: ${report.packageLockMutationAllowed}
- npm install allowed: ${report.npmInstallAllowed}
- npm rebuild allowed: ${report.npmRebuildAllowed}
- Dockerfile mutation allowed: ${report.dockerfileMutationAllowed}
- Docker build approved now: ${report.dockerBuildApprovedNow}
- Docker run approved now: ${report.dockerRunApprovedNow}
- Native artifacts committed allowed: ${report.nativeArtifactsCommittedAllowed}
- Future packet may use existing repo Dockerfile reference: ${report.futureContainerProbeMayUseExistingRepoDockerfileReference}
`
}

function decisionMarkdown(report: JsonRecord) {
  return `# FFmpeg/FFprobe Version-Probe Approval Decision

Decision: \`${report.decision}\`

Selected future runtime path: \`${report.selectedRuntimePath}\`.

Approved future command shape:
- \`ffmpeg -version\`
- \`ffprobe -version\`

FFmpeg and FFprobe are not installed/proven by this packet, and no probe ran in this phase. Local host probing, Docker build/run, media processing, render/export, package mutation, Supabase/GCS mutation, public artifacts, signed URLs, raw prompt execution, beta, and production remain blocked.

Next prompt: \`${report.nextPrompt}\`

Supabase classification: no write / none / none / no.
`
}

function validationResultsMarkdown(reports: FfmpegFfprobeVersionProbeApprovalReportSet) {
  return `# FFmpeg/FFprobe Version-Probe Approval Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: ${reports.readinessReport.readiness}
- Selected runtime path: \`${reports.runtimePathSelection.selectedRuntimePath}\`
- Local host system binary approved: ${reports.runtimePathSelection.localHostSystemBinaryApproved}
- Version probe run in this phase: ${reports.decision.versionProbeRunInThisPhase}
- Docker build approved now: ${reports.packageDockerArtifactPolicy.dockerBuildApprovedNow}
- Package-lock mutation allowed: ${reports.packageDockerArtifactPolicy.packageLockMutationAllowed}
- Blockers: ${Array.isArray(reports.blockerReport.blockers) && reports.blockerReport.blockers.length ? reports.blockerReport.blockers.join(', ') : 'none'}
- Supabase classification: no write / none / none / no
`
}

function nextPromptMarkdown(reports: FfmpegFfprobeVersionProbeApprovalReportSet) {
  return `# ${nextPrompt}

Use central source-of-truth branch \`${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_BASE_BRANCH}\` after this approval packet lands.

Approval decision: \`${reports.decision.decision}\`.

Future execution target:
- Runtime path: \`${reports.runtimePathSelection.selectedRuntimePath}\`
- Source path: \`${reports.runtimePathSelection.dockerfilePath}\`
- Commands: \`ffmpeg -version\` and \`ffprobe -version\`
- Timeout: ${reports.futureProbeCommandApproval.timeoutSeconds} seconds

This future phase must remain version-output-only. Do not process media, probe files, decode, encode, caption burn-in, render/export, use local host binaries as source of truth, mutate Docker/container files, install packages, rebuild packages, run DuckDB/Polars proofs, execute workers/routes/providers, mutate Supabase/GCS, create public artifacts or signed URLs, run raw prompts, or unlock beta/production.

Stop on any source-of-truth, runtime path, command boundary, artifact policy, or safety drift.
`
}

function updateStatusDocs(reports: FfmpegFfprobeVersionProbeApprovalReportSet) {
  const status = `OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL:

- Decision: \`${reports.decision.decision}\`.
- Selected future runtime path: \`${reports.runtimePathSelection.selectedRuntimePath}\` using \`${reports.runtimePathSelection.dockerfilePath}\`.
- Approved future commands for a separate execution packet: \`ffmpeg -version\` and \`ffprobe -version\`.
- Local host probing is not approved; FFmpeg/FFprobe are still not version-proven by this phase.
- Next prompt: \`${reports.decision.nextPrompt}\`.
- No FFmpeg/FFprobe probe, Docker build/run, Docker/container mutation, media processing, caption burn-in, render/export, npm install/rebuild, DuckDB/Polars proof rerun, worker/route/provider execution, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, or production scope is enabled.
- Supabase classification: no write / none / none / no.`
  for (const path of statusDocPaths) {
    if (existsSync(path)) upsertSection(path, 'OPEN_SOURCE_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_STATUS', status)
  }
}

function upsertSection(path: string, marker: string, body: string) {
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const text = readFileSync(path, 'utf8')
  const section = `${start}\n${body}\n${end}`
  if (text.includes(start) && text.includes(end)) {
    const updated = text.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`), section)
    writeText(path, updated)
    return
  }
  writeText(path, `${text.trimEnd()}\n\n${section}\n`)
}

function safePrView(number: number) {
  try {
    return JSON.parse(
      execFileSync(
        'gh',
        [
          'pr',
          'view',
          String(number),
          '--repo',
          'yuzastudio6-cyber/Reedkt',
          '--json',
          'number,title,state,isDraft,mergedAt,baseRefName,headRefName,headRefOid,mergeStateStatus,url',
        ],
        { encoding: 'utf8' },
      ),
    )
  } catch (error) {
    return { number, error: error instanceof Error ? error.message : String(error) }
  }
}

function safePrSearch(query: string) {
  try {
    return JSON.parse(
      execFileSync(
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
          '--limit',
          '20',
        ],
        { encoding: 'utf8' },
      ),
    )
  } catch (error) {
    return [{ query, error: error instanceof Error ? error.message : String(error) }]
  }
}

function safeGit(args: string[]) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    }).trim()
  } catch {
    return undefined
  }
}

function readJson(path: string) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return undefined
  }
}

function writeJson(path: string, value: unknown) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(path: string, value: string) {
  writeFileSync(path, value)
}

function valueFrom(value: unknown, key: string) {
  return typeof value === 'object' && value !== null ? (value as JsonRecord)[key] : undefined
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
