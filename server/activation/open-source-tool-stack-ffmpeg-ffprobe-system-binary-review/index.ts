import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  FfmpegFfprobeSystemBinaryReviewDecision,
  FfmpegFfprobeSystemBinaryReviewReportSet,
} from './ffmpeg-ffprobe-system-binary-review-types'

type JsonRecord = Record<string, unknown>

export const FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR =
  'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review'
export const FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_BRANCH =
  'codex/rp-open-source-tool-stack-ffmpeg-ffprobe-system-binary-review'
export const FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_SOURCE_SHA =
  '24a2a975489e1e2f9c52f10ad2be8191133968c6'

const expectedDecision: FfmpegFfprobeSystemBinaryReviewDecision =
  'ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge'
const nextPrompt = 'TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE'

const sourceEvidencePaths = {
  duckdbQaDecision: 'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
  duckdbQaFfmpeg: 'docs/open-source-tool-stack/duckdb-native-rebuild-qa/ffmpeg-ffprobe-missing-binary-qa.json',
  duckdbExecutionDecision:
    'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json',
  packageBinaryExecutionDecision:
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/package-binary-execution-decision.json',
  packageBinaryPolars:
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json',
  openSourceInventory: 'docs/open-source-tool-stack/open-source-tool-stack-inventory.json',
  openSourceDecision: 'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
}

const trackaCentralEvidencePaths = [
  'docs/track-a/track-a-caption-runtime-path-metadata-check-results.md',
  'docs/track-a/track-a-caption-runtime-path-approval-contract.md',
  'docs/activation-phase-tracka-caption-runtime-path-1-results.md',
  'scripts/validation/track-a-caption-runtime-path-1-diagnostics.mjs',
]

const reportPaths = {
  sourceAudit: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/source-of-truth-audit.json`,
  evidenceRevalidation: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/evidence-revalidation-report.json`,
  evidenceRevalidationMd: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/evidence-revalidation-report.md`,
  trackaPr463Reference: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/tracka-pr-463-reference-review.json`,
  trackaPr463ReferenceMd: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/tracka-pr-463-reference-review.md`,
  strategySelection: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/strategy-selection-review.json`,
  strategySelectionMd: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/strategy-selection-review.md`,
  futureVersionProbeScope: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/future-version-probe-scope.json`,
  futureVersionProbeScopeMd: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/future-version-probe-scope.md`,
  ownerHandoff: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/owner-handoff-review.json`,
  ownerHandoffMd: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/owner-handoff-review.md`,
  internalBetaImpact: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/internal-beta-impact-review.json`,
  internalBetaImpactMd: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/internal-beta-impact-review.md`,
  decision: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-system-binary-review-decision.json`,
  decisionMd: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-system-binary-review-decision.md`,
  readiness: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-system-binary-review-readiness-report.json`,
  blockers: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-system-binary-review-blocker-report.json`,
  privateArtifactManifest: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-system-binary-review-private-artifact-manifest.json`,
  validationResults: `${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-system-binary-review-validation-results.md`,
}

const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-ffmpeg-ffprobe-source-of-truth-merge.md'

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const predecessorPrs = [469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [428, 425, 432, 423, 420, 417, 401, 384]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW',
    'REEDITPRO_CONFIRM_DUCKDB_NATIVE_REBUILD_QA_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_MISSING_REVIEW',
    'REEDITPRO_CONFIRM_TRACKA_PR_463_REFERENCE_REVIEW',
    'REEDITPRO_CONFIRM_SYSTEM_BINARY_STRATEGY_REVIEW',
    'REEDITPRO_CONFIRM_WORKER_CONTAINER_HANDOFF_REVIEW',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'FFMPEG_VERSION_PROBE',
    'FFPROBE_VERSION_PROBE',
    'SYSTEM_BINARY_INSTALL',
    'CONTAINER_IMAGE_MUTATION',
    'DOCKER_BUILD',
    'MEDIA_PROCESSING',
    'RENDER_EXPORT',
    'WORKER_EXECUTION',
    'TOOL_ROUTE_EXECUTION',
    'PROVIDER_CALLS',
    'SUPABASE_METADATA_WRITE',
    'SUPABASE_PRODUCTION_SQL',
    'GCS_UPLOAD',
    'PUBLIC_ARTIFACTS',
    'SIGNED_URL',
    'PRODUCTION_WRITE',
    'EXTERNAL_BETA',
    'PAID_PRODUCTION',
    'RAW_PROMPT',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD',
  ]
}

export function buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW',
    branch: FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_BRANCH,
    baseBranch: FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_BASE_BRANCH,
    expectedSourceSha: FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_SOURCE_SHA,
    mode: 'metadata_strategy_review_only_no_install_no_probe_no_media',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    nextPrompt,
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, nextPromptPath],
    forbiddenActions: [
      'ffmpeg_probe',
      'ffprobe_probe',
      'system_binary_install',
      'docker_build_or_container_mutation',
      'media_processing',
      'render_export',
      'worker_route_provider_execution',
      'supabase_sql_gcs_public_artifact_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewReports(): FfmpegFfprobeSystemBinaryReviewReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceEvidence = readSourceEvidence()
  const packageState = capturePackageState()
  const prMetadata = {
    pr469: safePrView(469),
    pr466: safePrView(466),
    pr455: safePrView(455),
    pr416: safePrView(416),
    pr463: safePrView(463),
  }
  const trackaCentralEvidence = trackaCentralEvidencePaths.map((file) => ({ file, exists: existsSync(file) }))
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, flags, sourceEvidence, packageState, prMetadata, trackaCentralEvidence)
  const evidenceRevalidationReport = buildEvidenceRevalidationReport(generatedAt, sourceEvidence)
  const trackaPr463ReferenceReview = buildTrackaPr463ReferenceReview(generatedAt, prMetadata.pr463, trackaCentralEvidence)
  const strategySelectionReview = buildStrategySelectionReview(generatedAt, trackaPr463ReferenceReview)
  const futureVersionProbeScope = buildFutureVersionProbeScope(generatedAt)
  const ownerHandoffReview = buildOwnerHandoffReview(generatedAt, trackaPr463ReferenceReview)
  const internalBetaImpactReview = buildInternalBetaImpactReview(generatedAt)
  const blockers = buildBlockers(evidenceRevalidationReport, trackaPr463ReferenceReview, futureVersionProbeScope)
  const decisionValue = chooseDecision(blockers)
  const readiness = decisionValue === expectedDecision
  const decision = buildDecision(generatedAt, decisionValue, readiness, blockers, flags)

  return {
    sourceOfTruthAudit,
    evidenceRevalidationReport,
    trackaPr463ReferenceReview,
    strategySelectionReview,
    futureVersionProbeScope,
    ownerHandoffReview,
    internalBetaImpactReview,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.readiness.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      readyForVersionProbeApproval: false,
      readyForTrackaSourceOfTruthMerge: readiness,
      readyForWorkerContainerHandoff: false,
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.blockers.v1',
      generatedAt,
      blockers,
      blockedScopesPreserved: Object.values(flags).every((value) => value === false),
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.privateArtifactManifest.v1',
      generatedAt,
      privatePayloadsAccessed: false,
      privatePayloadsPrinted: false,
      privatePayloadsCommitted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      reportDirectory: FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR,
    },
  }
}

export function writeOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewArtifacts() {
  const reports = buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewReports()
  mkdirSync(FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.evidenceRevalidation, reports.evidenceRevalidationReport)
  writeText(reportPaths.evidenceRevalidationMd, evidenceRevalidationMarkdown(reports.evidenceRevalidationReport))
  writeJson(reportPaths.trackaPr463Reference, reports.trackaPr463ReferenceReview)
  writeText(reportPaths.trackaPr463ReferenceMd, trackaPr463Markdown(reports.trackaPr463ReferenceReview))
  writeJson(reportPaths.strategySelection, reports.strategySelectionReview)
  writeText(reportPaths.strategySelectionMd, strategySelectionMarkdown(reports.strategySelectionReview))
  writeJson(reportPaths.futureVersionProbeScope, reports.futureVersionProbeScope)
  writeText(reportPaths.futureVersionProbeScopeMd, futureVersionProbeScopeMarkdown(reports.futureVersionProbeScope))
  writeJson(reportPaths.ownerHandoff, reports.ownerHandoffReview)
  writeText(reportPaths.ownerHandoffMd, ownerHandoffMarkdown(reports.ownerHandoffReview))
  writeJson(reportPaths.internalBetaImpact, reports.internalBetaImpactReview)
  writeText(reportPaths.internalBetaImpactMd, internalBetaImpactMarkdown(reports.internalBetaImpactReview))
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

export function readOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    evidenceRevalidationReport: readJson(reportPaths.evidenceRevalidation) ?? {},
    trackaPr463ReferenceReview: readJson(reportPaths.trackaPr463Reference) ?? {},
    strategySelectionReview: readJson(reportPaths.strategySelection) ?? {},
    futureVersionProbeScope: readJson(reportPaths.futureVersionProbeScope) ?? {},
    ownerHandoffReview: readJson(reportPaths.ownerHandoff) ?? {},
    internalBetaImpactReview: readJson(reportPaths.internalBetaImpact) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    blockerReport: readJson(reportPaths.blockers) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest) ?? {},
  }
}

export function summarizeOpenSourceToolStackFfmpegFfprobeSystemBinaryReview(
  reports: FfmpegFfprobeSystemBinaryReviewReportSet | ReturnType<typeof readOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewArtifacts> =
    buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewReports(),
) {
  return JSON.stringify(
    {
      decision: reports?.decision?.decision,
      readiness: reports?.readinessReport?.readiness,
      nextPrompt: reports?.decision?.nextPrompt,
      ffmpegAcceptedAsInstalledAndProven: reports?.decision?.ffmpegAcceptedAsInstalledAndProven,
      ffprobeAcceptedAsInstalledAndProven: reports?.decision?.ffprobeAcceptedAsInstalledAndProven,
      futureVersionProbeApprovedNow: reports?.futureVersionProbeScope?.futureVersionProbeApprovedNow,
      trackaSourceOfTruthMergeRequired: reports?.ownerHandoffReview?.trackaSourceOfTruthMergeRequired,
      supabaseClassification: reports?.decision?.supabaseClassification,
      blockers: reports?.blockerReport?.blockers,
    },
    null,
    2,
  )
}

function buildSourceOfTruthAudit(
  generatedAt: string,
  flags: JsonRecord,
  sourceEvidence: JsonRecord,
  packageState: JsonRecord,
  prMetadata: JsonRecord,
  trackaCentralEvidence: JsonRecord[],
) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.sourceOfTruthAudit.v1',
    generatedAt,
    phase: 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW',
    sourceBranch: FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_BASE_BRANCH,
    sourceSha: safeGit(['rev-parse', 'HEAD']) ?? FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_SOURCE_SHA,
    packageState,
    predecessorPrs,
    referenceOnlyPrs,
    prMetadata,
    sourceEvidence,
    trackaCentralEvidence,
    trackaEvidencePresentInCentralBranch: trackaCentralEvidence.every((entry) => entry.exists === true),
    duplicateSearches: {
      systemBinaryReview: safePrSearch('FFmpeg FFprobe system binary'),
      explicitPhase: safePrSearch('OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW'),
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

function buildEvidenceRevalidationReport(generatedAt: string, sourceEvidence: JsonRecord) {
  const duckdbQaDecision = sourceEvidence.duckdbQaDecision as JsonRecord | undefined
  const duckdbExecutionDecision = sourceEvidence.duckdbExecutionDecision as JsonRecord | undefined
  const packageBinaryDecision = sourceEvidence.packageBinaryExecutionDecision as JsonRecord | undefined
  const polarsReport = sourceEvidence.packageBinaryPolars as JsonRecord | undefined
  const ffmpegStatus = ((sourceEvidence.duckdbQaFfmpeg as JsonRecord | undefined)?.ffmpegStatus ??
    (packageBinaryDecision?.ffmpegStatus as string | undefined) ??
    'missing_system_binary') as string
  const ffprobeStatus = ((sourceEvidence.duckdbQaFfmpeg as JsonRecord | undefined)?.ffprobeStatus ??
    (packageBinaryDecision?.ffprobeStatus as string | undefined) ??
    'missing_system_binary') as string
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.evidenceRevalidation.v1',
    generatedAt,
    requiredEvidence: Object.entries(sourceEvidencePaths).map(([key, file]) => ({
      key,
      file,
      exists: sourceEvidence[key] !== undefined,
    })),
    pr469Decision: duckdbQaDecision?.decision,
    pr466Decision: duckdbExecutionDecision?.decision,
    pr455Decision: packageBinaryDecision?.decision,
    duckdbAccepted: duckdbQaDecision?.duckdbAcceptedAsInstalledAndProven === true,
    polarsAccepted: duckdbQaDecision?.polarsAcceptedAsInstalledAndProven === true || polarsReport?.status === 'passed',
    ffmpegStatus,
    ffprobeStatus,
    ffmpegAcceptedAsInstalledAndProven: false,
    ffprobeAcceptedAsInstalledAndProven: false,
    versionProbeRunInThisPhase: false,
    mediaProcessingRunInThisPhase: false,
    passed:
      duckdbQaDecision?.decision === 'duckdb_native_rebuild_qa_passed_ready_for_ffmpeg_ffprobe_system_binary_review' &&
      duckdbExecutionDecision?.decision === 'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing' &&
      typeof packageBinaryDecision?.decision === 'string' &&
      ffmpegStatus === 'missing_system_binary' &&
      ffprobeStatus === 'missing_system_binary',
  }
}

function buildTrackaPr463ReferenceReview(generatedAt: string, pr463: JsonRecord, trackaCentralEvidence: JsonRecord[]) {
  const centralEvidencePresent = trackaCentralEvidence.every((entry) => entry.exists === true)
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.trackaPr463ReferenceReview.v1',
    generatedAt,
    prNumber: 463,
    state: pr463.state ?? 'unknown',
    mergedAt: pr463.mergedAt ?? null,
    baseRefName: pr463.baseRefName ?? 'unknown',
    headRefName: pr463.headRefName ?? 'unknown',
    headRefOid: pr463.headRefOid ?? 'unknown',
    url: pr463.url ?? 'https://github.com/yuzastudio6-cyber/Reedkt/pull/463',
    centralSourceOfTruth: false,
    centralSourceOfTruthReason:
      'PR #463 merged into a Track A/model-orchestration branch and its Track A runtime path reports are absent from the central source branch.',
    centralEvidencePresent,
    centralEvidenceFiles: trackaCentralEvidence,
    ffmpegPath: 'docker://docker/prod/render-worker/Dockerfile#ffmpeg',
    ffprobePath: 'docker://docker/prod/render-worker/Dockerfile#ffprobe',
    libassEvidence: 'repo-owned render-worker Dockerfile metadata referenced by PR #463',
    dockerImageBuildStatus: 'reference_only_reported_passed_not_central_source_of_truth',
    safetyClaims: {
      mediaInputOutput: false,
      renderExportExecution: false,
      supabaseWrites: false,
      gcsUpload: false,
      publicArtifacts: false,
      signedUrls: false,
      betaProductionUnlock: false,
    },
    useAsReferenceOnly: true,
    shouldWaitForCentralMergeOrReconciliation: true,
  }
}

function buildStrategySelectionReview(generatedAt: string, trackaReview: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.strategySelection.v1',
    generatedAt,
    strategies: [
      {
        strategy: 'central_local_system_binary',
        owner: 'OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF',
        evidence: 'central branch only records missing_system_binary for FFmpeg and FFprobe',
        risks: ['host-specific binary drift', 'not tied to worker/runtime source-of-truth'],
        packageLockImpact: 'none',
        dockerContainerImpact: 'none',
        mediaProcessingRisk: 'low only for future version probes; high if expanded beyond version probes',
        internalBetaUsefulness: 'limited until source-of-truth owner path is reconciled',
        recommended: false,
        reason: 'Central source-of-truth does not yet contain enough FFmpeg/FFprobe binary provenance.',
      },
      {
        strategy: 'repo_owned_render_worker_dockerfile_path',
        owner: 'TRACK_A_RENDER_EXPORT',
        evidence: 'PR #463 reference evidence reports Dockerfile FFmpeg/FFprobe/libass metadata',
        risks: ['merged outside central source-of-truth branch', 'requires Track A reconciliation before central proof'],
        packageLockImpact: 'none',
        dockerContainerImpact: 'metadata-only in this phase; future container proof requires separate approval',
        mediaProcessingRisk: 'blocked in this phase',
        internalBetaUsefulness: 'highest once central source-of-truth contains Track A runtime path evidence',
        recommended: true,
        reason: trackaReview.centralSourceOfTruth === true ? 'Track A evidence is central.' : 'Relevant Track A evidence exists but must be reconciled into central source-of-truth first.',
      },
      {
        strategy: 'worker_container_image',
        owner: 'WORKER_RUNTIME_JOBS',
        evidence: 'worker execution remains blocked; no central worker-container binary proof',
        risks: ['worker execution boundary not approved', 'container mutation not allowed in this phase'],
        packageLockImpact: 'none',
        dockerContainerImpact: 'future owner handoff only',
        mediaProcessingRisk: 'blocked',
        internalBetaUsefulness: 'useful after Track A and worker ownership converge',
        recommended: false,
        reason: 'Worker/container ownership should follow Track A source-of-truth reconciliation.',
      },
      {
        strategy: 'sound_music_audio_owner_lane',
        owner: 'SOUND_MUSIC_AUDIO',
        evidence: 'Sound/Music/Audio owns audio planning lanes but not central FFmpeg/FFprobe binary source in this phase',
        risks: ['owner ambiguity for render/export binary path'],
        packageLockImpact: 'none',
        dockerContainerImpact: 'none',
        mediaProcessingRisk: 'audio processing remains blocked',
        internalBetaUsefulness: 'future audio-specific FFmpeg policy may be needed',
        recommended: false,
        reason: 'Sound handoff is informative, not the central next blocker.',
      },
    ],
    recommendedStrategy: 'repo_owned_render_worker_dockerfile_path_after_tracka_source_of_truth_merge',
  }
}

function buildFutureVersionProbeScope(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.futureVersionProbeScope.v1',
    generatedAt,
    futureVersionProbeApprovedNow: false,
    blockedUntil: 'Track A FFmpeg/FFprobe source-of-truth evidence is reconciled into central branch',
    futureCommandsAfterApproval: ['ffmpeg -version', 'ffprobe -version'],
    allowedEnvironmentAfterApproval: ['repo-owned Docker image or worker container selected by Track A/Worker Runtime source-of-truth'],
    localSystemEnvironmentApprovedNow: false,
    repoOwnedDockerImageApprovedNow: false,
    workerContainerApprovedNow: false,
    noMediaInput: true,
    noMediaOutput: true,
    noFileProbing: true,
    noDecodeEncode: true,
    noRenderExport: true,
    noOutputFiles: true,
    noPublicArtifact: true,
    timeoutSecondsAfterApproval: 15,
    reportPathAfterApproval:
      'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval-or-execution/',
    stopOnFirstFailure: true,
  }
}

function buildOwnerHandoffReview(generatedAt: string, trackaReview: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.ownerHandoff.v1',
    generatedAt,
    trackaHandoffNeeded: true,
    soundMusicAudioHandoffNeeded: false,
    workerRuntimeHandoffNeeded: true,
    centralLaneCanProceedAlone: false,
    trackaSourceOfTruthMergeRequired: true,
    pr463ReferenceOnly: true,
    pr463State: trackaReview.state,
    nextOwner: 'TRACK_A_RENDER_EXPORT',
    nextPrompt,
    nextPromptFile: nextPromptPath,
  }
}

function buildInternalBetaImpactReview(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.internalBetaImpact.v1',
    generatedAt,
    internalBetaCanRelyOn: [
      'DuckDB from PR #466 evidence',
      'Polars from PR #455 evidence',
      'Sharp/libvips from Batch 1 evidence',
      'manifest/report validators',
    ],
    internalBetaCannotRelyOnYet: [
      'FFmpeg',
      'FFprobe',
      'real media processing',
      'render/export execution',
      'audio processing',
    ],
    blockedBetaPathsUntilSystemBinaryProof: [
      'media probing',
      'caption burn-in runtime execution',
      'final render/export',
      'audio loudness or normalization processing',
    ],
    externalBetaAllowed: false,
    paidProductionAllowed: false,
  }
}

function buildDecision(
  generatedAt: string,
  decisionValue: FfmpegFfprobeSystemBinaryReviewDecision,
  readiness: boolean,
  blockers: string[],
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    nextPrompt,
    nextPromptFile: nextPromptPath,
    blockers,
    duckdbAcceptedAsInstalledAndProven: true,
    polarsAcceptedAsInstalledAndProven: true,
    ffmpegAcceptedAsInstalledAndProven: false,
    ffprobeAcceptedAsInstalledAndProven: false,
    futureVersionProbeApprovedNow: false,
    trackaSourceOfTruthMergeRequired: true,
    workerContainerHandoffRequiredAfterTracka: true,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    systemBinaryInstallAttempted: false,
    dockerBuildAttempted: false,
    dockerfileMutationAttempted: false,
    packageLockMutationAttempted: false,
    npmInstallAttempted: false,
    npmRebuildAttempted: false,
    packageLifecycleScriptsAttempted: false,
    duckdbProofRerun: false,
    polarsProofRerun: false,
    mediaProcessingAttempted: false,
    renderExportAttempted: false,
    routeExecutionAttempted: false,
    workerExecutionAttempted: false,
    providerCallsAttempted: false,
    supabaseWritesAttempted: false,
    gcsUploadAttempted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptsExecuted: false,
    betaProductionUnlocked: false,
    supabaseClassification: supabaseClassification(),
    executionScope: flags,
  }
}

function buildBlockers(evidence: JsonRecord, trackaReview: JsonRecord, futureScope: JsonRecord) {
  const blockers: string[] = []
  if (evidence.passed !== true) blockers.push('blocked_pending_open_source_evidence_revalidation')
  if (trackaReview.shouldWaitForCentralMergeOrReconciliation !== true) {
    blockers.push('blocked_pending_tracka_runtime_path_source_of_truth')
  }
  if (futureScope.futureVersionProbeApprovedNow !== false) blockers.push('rejected_due_runtime_safety_risk')
  return blockers
}

function chooseDecision(blockers: string[]): FfmpegFfprobeSystemBinaryReviewDecision {
  if (blockers.includes('blocked_pending_open_source_evidence_revalidation')) {
    return 'blocked_pending_system_binary_source_selection'
  }
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  return expectedDecision
}

function readSourceEvidence() {
  return Object.fromEntries(
    Object.entries(sourceEvidencePaths).map(([key, file]) => [key, readJson(file)]),
  ) as JsonRecord
}

function blockedFlags() {
  return {
    ffmpegVersionProbeAllowed: false,
    ffprobeVersionProbeAllowed: false,
    systemBinaryInstallAllowed: false,
    dockerBuildAllowed: false,
    dockerContainerMutationAllowed: false,
    mediaProcessingAllowed: false,
    renderExportAllowed: false,
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

function evidenceRevalidationMarkdown(report: JsonRecord) {
  return `# FFmpeg / FFprobe Evidence Revalidation

- PR #469 decision: \`${report.pr469Decision ?? 'unknown'}\`
- PR #466 decision: \`${report.pr466Decision ?? 'unknown'}\`
- PR #455 decision: \`${report.pr455Decision ?? 'unknown'}\`
- DuckDB accepted: ${report.duckdbAccepted}
- Polars accepted: ${report.polarsAccepted}
- FFmpeg status: \`${report.ffmpegStatus ?? 'unknown'}\`
- FFprobe status: \`${report.ffprobeStatus ?? 'unknown'}\`
- Version probe run in this phase: ${report.versionProbeRunInThisPhase}
- Media processing run in this phase: ${report.mediaProcessingRunInThisPhase}
- Passed: ${report.passed}
`
}

function trackaPr463Markdown(report: JsonRecord) {
  return `# Track A PR #463 Reference Review

- PR #463 state: \`${report.state ?? 'unknown'}\`
- PR #463 mergedAt: \`${report.mergedAt ?? 'none'}\`
- Base branch: \`${report.baseRefName ?? 'unknown'}\`
- Head branch: \`${report.headRefName ?? 'unknown'}\`
- Central source-of-truth: ${report.centralSourceOfTruth}
- Central evidence present on this branch: ${report.centralEvidencePresent}
- FFmpeg path: \`${report.ffmpegPath}\`
- FFprobe path: \`${report.ffprobePath}\`
- libass evidence: ${report.libassEvidence}
- Docker image build status: \`${report.dockerImageBuildStatus}\`
- Use as reference only: ${report.useAsReferenceOnly}
- Wait for central merge/reconciliation: ${report.shouldWaitForCentralMergeOrReconciliation}
`
}

function strategySelectionMarkdown(report: JsonRecord) {
  const strategies = Array.isArray(report.strategies) ? report.strategies : []
  return `${`# FFmpeg / FFprobe Strategy Selection Review

Recommended strategy: \`${report.recommendedStrategy}\`

${strategies
  .map((item) => {
    const strategy = item as JsonRecord
    return `## ${strategy.strategy}

- Owner: \`${strategy.owner}\`
- Recommended: ${strategy.recommended}
- Package-lock impact: ${strategy.packageLockImpact}
- Docker/container impact: ${strategy.dockerContainerImpact}
- Media-processing risk: ${strategy.mediaProcessingRisk}
- Reason: ${strategy.reason}
`
  })
  .join('\n')}
`.trimEnd()}
`
}

function futureVersionProbeScopeMarkdown(report: JsonRecord) {
  return `# Future Version-Probe Scope

- Future version probe approved now: ${report.futureVersionProbeApprovedNow}
- Blocked until: ${report.blockedUntil}
- Future commands after approval: \`${Array.isArray(report.futureCommandsAfterApproval) ? report.futureCommandsAfterApproval.join('`, `') : ''}\`
- Local system environment approved now: ${report.localSystemEnvironmentApprovedNow}
- Repo-owned Docker image approved now: ${report.repoOwnedDockerImageApprovedNow}
- Worker container approved now: ${report.workerContainerApprovedNow}
- No media input/output: ${report.noMediaInput} / ${report.noMediaOutput}
- No file probing: ${report.noFileProbing}
- No decode/encode: ${report.noDecodeEncode}
- No render/export: ${report.noRenderExport}
- Stop on first failure after approval: ${report.stopOnFirstFailure}
`
}

function ownerHandoffMarkdown(report: JsonRecord) {
  return `# Owner Handoff Review

- Track A handoff needed: ${report.trackaHandoffNeeded}
- Sound/Music/Audio handoff needed now: ${report.soundMusicAudioHandoffNeeded}
- Worker Runtime handoff needed: ${report.workerRuntimeHandoffNeeded}
- Central lane can proceed alone: ${report.centralLaneCanProceedAlone}
- Track A source-of-truth merge required: ${report.trackaSourceOfTruthMergeRequired}
- Next owner: \`${report.nextOwner}\`
- Next prompt: \`${report.nextPrompt}\`
`
}

function internalBetaImpactMarkdown(report: JsonRecord) {
  return `# Internal Beta Impact Review

Internal beta can rely on:
${Array.isArray(report.internalBetaCanRelyOn) ? report.internalBetaCanRelyOn.map((item) => `- ${item}`).join('\n') : '- none'}

Internal beta cannot rely on yet:
${Array.isArray(report.internalBetaCannotRelyOnYet) ? report.internalBetaCannotRelyOnYet.map((item) => `- ${item}`).join('\n') : '- none'}

- External beta allowed: ${report.externalBetaAllowed}
- Paid production allowed: ${report.paidProductionAllowed}
`
}

function decisionMarkdown(decision: JsonRecord) {
  return `# FFmpeg / FFprobe System-Binary Review Decision

Decision: \`${decision.decision}\`

- DuckDB accepted as installed/proven: ${decision.duckdbAcceptedAsInstalledAndProven}
- Polars accepted as installed/proven: ${decision.polarsAcceptedAsInstalledAndProven}
- FFmpeg accepted as installed/proven: ${decision.ffmpegAcceptedAsInstalledAndProven}
- FFprobe accepted as installed/proven: ${decision.ffprobeAcceptedAsInstalledAndProven}
- Future version-probe approved now: ${decision.futureVersionProbeApprovedNow}
- Track A source-of-truth merge required: ${decision.trackaSourceOfTruthMergeRequired}
- Next prompt: \`${decision.nextPrompt}\`

Supabase classification: no write / none / none / no.
`
}

function validationResultsMarkdown(reports: FfmpegFfprobeSystemBinaryReviewReportSet) {
  return `# FFmpeg / FFprobe System-Binary Review Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: ${reports.readinessReport.readiness}
- FFmpeg accepted: ${reports.decision.ffmpegAcceptedAsInstalledAndProven}
- FFprobe accepted: ${reports.decision.ffprobeAcceptedAsInstalledAndProven}
- Future version-probe approved now: ${reports.futureVersionProbeScope.futureVersionProbeApprovedNow}
- Track A source-of-truth merge required: ${reports.ownerHandoffReview.trackaSourceOfTruthMergeRequired}
- Blockers: ${Array.isArray(reports.blockerReport.blockers) ? reports.blockerReport.blockers.length : 0}

No FFmpeg/FFprobe probe, binary install, Docker build, Docker/container mutation, media processing, npm install/rebuild, DuckDB/Polars proof rerun, worker/route/provider execution, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, production, or GitHub merge occurred in this phase.
`
}

function nextPromptMarkdown(reports: FfmpegFfprobeSystemBinaryReviewReportSet) {
  return `# TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE

Use the central source-of-truth branch after the FFmpeg/FFprobe system-binary review lands.

Decision from this review: \`${reports.decision.decision}\`.

Goal: reconcile or merge the Track A PR #463 FFmpeg/FFprobe/libass runtime path evidence into the central source-of-truth path before any central FFmpeg/FFprobe version-probe approval.

Do not run FFmpeg, FFprobe, Docker builds, media processing, render/export, workers, routes, providers, Supabase/GCS mutation, public artifacts, signed URLs, raw prompts, beta, or production unless a later prompt explicitly approves that exact scope.
`
}

function updateStatusDocs(reports: FfmpegFfprobeSystemBinaryReviewReportSet) {
  const block = `OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW:

- Decision: \`${reports.decision.decision}\`.
- DuckDB remains accepted/proven from PR #466 evidence; Polars remains accepted/proven from PR #455 evidence.
- FFmpeg and FFprobe remain missing/unproven in the central lane.
- PR #463 is relevant Track A FFmpeg/FFprobe/libass runtime-path evidence, but it is not present on the central source-of-truth branch and must be reconciled before central version-probe approval.
- Future FFmpeg/FFprobe version probes are not approved by this phase.
- Next prompt: \`${reports.decision.nextPrompt}\`.
- Supabase classification: no write / none / none / no.`
  for (const file of statusDocPaths) {
    if (!existsSync(file)) continue
    upsertMarkedBlock(file, 'OPEN_SOURCE_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_STATUS', block)
  }
}

function capturePackageState() {
  const packageJson = existsSync('package.json') ? readFileSync('package.json', 'utf8') : ''
  const packageLock = existsSync('package-lock.json') ? readFileSync('package-lock.json', 'utf8') : ''
  let dependencySections: JsonRecord
  try {
    const parsed = JSON.parse(packageJson) as JsonRecord
    dependencySections = {
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
      optionalDependencies: parsed.optionalDependencies ?? {},
    }
  } catch {
    dependencySections = {}
  }
  return {
    packageJsonHash: hash(packageJson),
    packageLockHash: hash(packageLock),
    dependencySections,
  }
}

function readJson(file: string) {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as JsonRecord
  } catch {
    return undefined
  }
}

function writeJson(file: string, value: unknown) {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(file: string, value: string) {
  writeFileSync(file, value)
}

function upsertMarkedBlock(file: string, marker: string, body: string) {
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const block = `${start}\n${body}\n${end}`
  const current = readFileSync(file, 'utf8')
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`)
  const next = pattern.test(current) ? current.replace(pattern, block) : `${current.trimEnd()}\n\n${block}\n`
  writeText(file, next)
}

function hash(input: string) {
  return createHash('sha256').update(input).digest('hex')
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
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ),
    ) as JsonRecord
  } catch {
    return { number, metadataAvailable: false }
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
          'number,title,state,isDraft,baseRefName,headRefName,mergeStateStatus,url',
          '--limit',
          '20',
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ),
    ) as unknown[]
  } catch {
    return []
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
