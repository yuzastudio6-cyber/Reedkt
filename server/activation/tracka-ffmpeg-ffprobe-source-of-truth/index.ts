import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  TrackaFfmpegFfprobeSourceOfTruthDecision,
  TrackaFfmpegFfprobeSourceOfTruthReportSet,
} from './tracka-ffmpeg-ffprobe-source-of-truth-types'

type JsonRecord = Record<string, unknown>

export const TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth'
export const TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_BRANCH =
  'codex/rp-tracka-ffmpeg-ffprobe-source-of-truth-merge'
export const TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_SOURCE_SHA =
  'a12d11fd4638c40b345d837b200784f8853a0faa'

const expectedDecision: TrackaFfmpegFfprobeSourceOfTruthDecision =
  'tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval'
const nextPrompt = 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL'

const reportPaths = {
  sourceAudit: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/source-of-truth-audit.json`,
  pr463DiffReview: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/pr-463-diff-review.json`,
  pr463DiffReviewMd: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/pr-463-diff-review.md`,
  centralPresenceCheck: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/central-presence-check.json`,
  centralPresenceCheckMd: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/central-presence-check.md`,
  reconciliationMethod: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/reconciliation-method.json`,
  reconciliationMethodMd: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/reconciliation-method.md`,
  centralEvidence: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/ffmpeg-ffprobe-central-evidence.json`,
  centralEvidenceMd: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/ffmpeg-ffprobe-central-evidence.md`,
  futureVersionProbeBoundary: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/future-version-probe-boundary.json`,
  futureVersionProbeBoundaryMd: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/future-version-probe-boundary.md`,
  ownerHandoff: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/owner-handoff-and-blocker-review.json`,
  ownerHandoffMd: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/owner-handoff-and-blocker-review.md`,
  decision: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/tracka-ffmpeg-ffprobe-source-of-truth-decision.json`,
  decisionMd: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/tracka-ffmpeg-ffprobe-source-of-truth-decision.md`,
  readiness: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/tracka-ffmpeg-ffprobe-source-of-truth-readiness-report.json`,
  blockers: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/tracka-ffmpeg-ffprobe-source-of-truth-blocker-report.json`,
  privateManifest: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/tracka-ffmpeg-ffprobe-source-of-truth-private-artifact-manifest.json`,
  validationResults: `${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/tracka-ffmpeg-ffprobe-source-of-truth-validation-results.md`,
}

const nextPromptPath = 'docs/implementation-prompts/prompt-open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval.md'

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const predecessorPrs = [472, 469, 466, 460, 455, 448, 444, 439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [463, 428, 425, 432, 423, 420, 417, 401, 384]

const keyCentralPresencePaths = [
  'docker/prod/render-worker/Dockerfile',
  '.dockerignore',
  'docs/activation-phase-tracka-caption-runtime-path-1-results.md',
  'docs/track-a/track-a-caption-runtime-path-metadata-check-results.md',
  'docs/track-a/track-a-caption-runtime-path-approval-contract.md',
  'scripts/validation/track-a-caption-runtime-path-1-diagnostics.mjs',
  'scripts/validation/track-a-caption-runtime-path-1.mjs',
]

const keyTrackaRuntimeEvidencePaths = [
  'docs/activation-phase-tracka-caption-runtime-path-1-results.md',
  'docs/track-a/track-a-caption-quality-3r2-runtime-path-1.md',
  'docs/track-a/track-a-caption-runtime-path-approval-contract.md',
  'docs/track-a/track-a-caption-runtime-path-blocked-scope-register.md',
  'docs/track-a/track-a-caption-runtime-path-candidate-matrix.md',
  'docs/track-a/track-a-caption-runtime-path-metadata-check-results.md',
  'docs/track-a/track-a-caption-runtime-path-next-phase-plan.md',
  'docs/track-a/track-a-caption-runtime-path-qa-gate-map.md',
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_TRACKA_PR_463_MERGED_REFERENCE_REVIEW',
    'REEDITPRO_CONFIRM_CENTRAL_SOURCE_OF_TRUTH_RECONCILIATION',
    'REEDITPRO_CONFIRM_DOCKERFILE_SOURCE_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_NO_FFMPEG_FFPROBE_PROBES',
    'REEDITPRO_CONFIRM_NO_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'FFMPEG_VERSION_PROBE',
    'FFPROBE_VERSION_PROBE',
    'DOCKER_BUILD_EXECUTION',
    'DOCKER_RUN',
    'CONTAINER_MUTATION',
    'MEDIA_PROCESSING_EXECUTION',
    'CAPTION_BURNIN',
    'RENDER_EXPORT',
    'NPM_INSTALL',
    'NPM_REBUILD',
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

export function buildTrackaFfmpegFfprobeSourceOfTruthPlan() {
  return {
    phase: 'TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE',
    branch: TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_BRANCH,
    baseBranch: TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_BASE_BRANCH,
    expectedSourceSha: TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_SOURCE_SHA,
    mode: 'docs_only_central_reconciliation_no_pr_463_replay_no_probe_no_docker_no_media',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    nextPrompt,
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, nextPromptPath],
    forbiddenActions: [
      'ffmpeg_probe',
      'ffprobe_probe',
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

export function buildTrackaFfmpegFfprobeSourceOfTruthReports(): TrackaFfmpegFfprobeSourceOfTruthReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const packageState = capturePackageState()
  const prMetadata = Object.fromEntries(predecessorPrs.map((number) => [`pr${number}`, safePrView(number)]))
  prMetadata.pr463 = safePrView(463)
  const pr463Diff = buildPr463DiffReview(generatedAt, prMetadata.pr463 as JsonRecord)
  const centralPresence = buildCentralPresenceCheck(generatedAt)
  const reconciliationMethod = buildReconciliationMethod(generatedAt, centralPresence, pr463Diff)
  const centralEvidence = buildCentralEvidence(generatedAt, centralPresence)
  const futureBoundary = buildFutureVersionProbeBoundary(generatedAt, centralEvidence)
  const ownerHandoff = buildOwnerHandoff(generatedAt, reconciliationMethod)
  const blockers = buildBlockers(prMetadata, pr463Diff, centralPresence, reconciliationMethod, futureBoundary, ownerHandoff)
  const decisionValue = chooseDecision(blockers)
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, packageState, prMetadata, pr463Diff, centralPresence, flags)
  const decision = buildDecision(generatedAt, decisionValue, blockers, flags)
  const readiness = decisionValue === expectedDecision

  return {
    sourceOfTruthAudit,
    pr463DiffReview: pr463Diff,
    centralPresenceCheck: centralPresence,
    reconciliationMethod,
    ffmpegFfprobeCentralEvidence: centralEvidence,
    futureVersionProbeBoundary: futureBoundary,
    ownerHandoffAndBlockerReview: ownerHandoff,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.readiness.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      readyForVersionProbeApprovalPacket: readiness,
      readyForVersionProbeExecution: false,
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.blockers.v1',
      generatedAt,
      blockers,
      blockedScopesPreserved: Object.values(flags).every((value) => value === false),
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.privateArtifactManifest.v1',
      generatedAt,
      privatePayloadsAccessed: false,
      privatePayloadsPrinted: false,
      privatePayloadsCommitted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      reportDirectory: TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR,
    },
  }
}

export function writeTrackaFfmpegFfprobeSourceOfTruthArtifacts() {
  const reports = buildTrackaFfmpegFfprobeSourceOfTruthReports()
  mkdirSync(TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.pr463DiffReview, reports.pr463DiffReview)
  writeText(reportPaths.pr463DiffReviewMd, pr463DiffMarkdown(reports.pr463DiffReview))
  writeJson(reportPaths.centralPresenceCheck, reports.centralPresenceCheck)
  writeText(reportPaths.centralPresenceCheckMd, centralPresenceMarkdown(reports.centralPresenceCheck))
  writeJson(reportPaths.reconciliationMethod, reports.reconciliationMethod)
  writeText(reportPaths.reconciliationMethodMd, reconciliationMethodMarkdown(reports.reconciliationMethod))
  writeJson(reportPaths.centralEvidence, reports.ffmpegFfprobeCentralEvidence)
  writeText(reportPaths.centralEvidenceMd, centralEvidenceMarkdown(reports.ffmpegFfprobeCentralEvidence))
  writeJson(reportPaths.futureVersionProbeBoundary, reports.futureVersionProbeBoundary)
  writeText(reportPaths.futureVersionProbeBoundaryMd, futureBoundaryMarkdown(reports.futureVersionProbeBoundary))
  writeJson(reportPaths.ownerHandoff, reports.ownerHandoffAndBlockerReview)
  writeText(reportPaths.ownerHandoffMd, ownerHandoffMarkdown(reports.ownerHandoffAndBlockerReview))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(nextPromptPath, nextPromptMarkdown(reports))
  updateStatusDocs(reports)
  return reports
}

export function readTrackaFfmpegFfprobeSourceOfTruthArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    pr463DiffReview: readJson(reportPaths.pr463DiffReview) ?? {},
    centralPresenceCheck: readJson(reportPaths.centralPresenceCheck) ?? {},
    reconciliationMethod: readJson(reportPaths.reconciliationMethod) ?? {},
    ffmpegFfprobeCentralEvidence: readJson(reportPaths.centralEvidence) ?? {},
    futureVersionProbeBoundary: readJson(reportPaths.futureVersionProbeBoundary) ?? {},
    ownerHandoffAndBlockerReview: readJson(reportPaths.ownerHandoff) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    blockerReport: readJson(reportPaths.blockers) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateManifest) ?? {},
  }
}

export function summarizeTrackaFfmpegFfprobeSourceOfTruth(
  reports: TrackaFfmpegFfprobeSourceOfTruthReportSet | ReturnType<typeof readTrackaFfmpegFfprobeSourceOfTruthArtifacts> =
    buildTrackaFfmpegFfprobeSourceOfTruthReports(),
) {
  return JSON.stringify(
    {
      decision: reports?.decision?.decision,
      readiness: reports?.readinessReport?.readiness,
      nextPrompt: reports?.decision?.nextPrompt,
      reconciliationMethod: reports?.reconciliationMethod?.method,
      pr463ReferenceOnly: reports?.pr463DiffReview?.referenceOnly,
      centralDockerfilePresent: reports?.centralPresenceCheck?.dockerfilePresent,
      centralRuntimePathReportsPresent: reports?.centralPresenceCheck?.trackaRuntimePathReportsPresent,
      futureVersionProbeApprovedNow: reports?.futureVersionProbeBoundary?.futureVersionProbeApprovedNow,
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
  pr463Diff: JsonRecord,
  centralPresence: JsonRecord,
  flags: JsonRecord,
) {
  const sourceSha = safeGit(['rev-parse', 'HEAD']) ?? TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_SOURCE_SHA
  return {
    schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.sourceAudit.v1',
    generatedAt,
    phase: 'TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE',
    sourceBranch: TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_BASE_BRANCH,
    sourceSha,
    expectedMinimumSourceSha: TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_SOURCE_SHA,
    branch: TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_BRANCH,
    packageState,
    predecessorPrs,
    referenceOnlyPrs,
    pr472CentralMergeEvidence: prMetadata.pr472,
    pr463MergedReferenceEvidence: prMetadata.pr463,
    pr463CommitAncestorOfCentral: safeGit(['merge-base', '--is-ancestor', '81145ae352830c274f73b9bd905f6b8e0ebe1e4d', 'HEAD']) === '',
    pr463DiffReview: {
      changedFilesCount: pr463Diff.changedFilesCount,
      containsDockerfileChange: pr463Diff.containsDockerfileChange,
      containsDockerignoreChange: pr463Diff.containsDockerignoreChange,
      containsPackageJsonChange: pr463Diff.containsPackageJsonChange,
      containsGeneratedAssets: pr463Diff.containsGeneratedAssets,
      containsMediaOrBinaries: pr463Diff.containsMediaOrBinaries,
    },
    centralPresenceSummary: {
      dockerfilePresent: centralPresence.dockerfilePresent,
      trackaRuntimePathReportsPresent: centralPresence.trackaRuntimePathReportsPresent,
      trackaRuntimePathScriptsPresent: centralPresence.trackaRuntimePathScriptsPresent,
      dockerignoreDiffersFromPr463Branch: centralPresence.dockerignoreDiffersFromPr463Branch,
    },
    duplicateSearches: {
      trackaSourceTruth: safePrSearch('Track A FFmpeg FFprobe source-of-truth'),
      versionProbe: safePrSearch('FFmpeg FFprobe version probe'),
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

function buildPr463DiffReview(generatedAt: string, pr463: JsonRecord) {
  const files = safePrDiffNameOnly(463)
  const fileRows = files.map((file) => ({
    file,
    category: categorizeFile(file),
    centralPresence: existsSync(file),
  }))
  const containsDockerfileChange = files.some((file) => file.endsWith('Dockerfile'))
  const containsDockerignoreChange = files.includes('.dockerignore')
  const containsPackageJsonChange = files.includes('package.json')
  const containsGeneratedAssets = files.some((file) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|zip|tar|tgz)$/i.test(file))
  const containsMediaOrBinaries = files.some((file) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|so|dylib|dll|node|wasm)$/i.test(file))
  return {
    schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.pr463DiffReview.v1',
    generatedAt,
    prNumber: 463,
    state: pr463.state ?? 'unknown',
    mergedAt: pr463.mergedAt ?? null,
    baseRefName: pr463.baseRefName ?? 'unknown',
    headRefName: pr463.headRefName ?? 'unknown',
    headRefOid: pr463.headRefOid ?? 'unknown',
    url: pr463.url ?? 'https://github.com/yuzastudio6-cyber/Reedkt/pull/463',
    changedFiles: fileRows,
    changedFilesCount: files.length,
    containsDockerfileChange,
    containsDockerignoreChange,
    containsPackageJsonChange,
    containsGeneratedAssets,
    containsMediaOrBinaries,
    replayCherryPickSafeNow: false,
    docsOnlyCentralReconciliationSafer: true,
    referenceOnly: true,
    reason:
      'PR #463 is merged outside the central source-of-truth branch and includes package/script and .dockerignore differences. This phase records its evidence centrally without replaying that diff.',
  }
}

function buildCentralPresenceCheck(generatedAt: string) {
  const entries = keyCentralPresencePaths.map((file) => ({
    file,
    exists: existsSync(file),
    hash: existsSync(file) ? hash(readFileSync(file, 'utf8')) : null,
  }))
  const dockerfile = entries.find((entry) => entry.file === 'docker/prod/render-worker/Dockerfile')
  const dockerignore = entries.find((entry) => entry.file === '.dockerignore')
  const runtimeReportsPresent = keyTrackaRuntimeEvidencePaths.every((file) => existsSync(file))
  const runtimeScriptsPresent =
    existsSync('scripts/validation/track-a-caption-runtime-path-1-diagnostics.mjs') &&
    existsSync('scripts/validation/track-a-caption-runtime-path-1.mjs')
  return {
    schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.centralPresenceCheck.v1',
    generatedAt,
    sourceBranch: TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_BASE_BRANCH,
    sourceSha: safeGit(['rev-parse', 'HEAD']) ?? TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_SOURCE_SHA,
    checkedFiles: entries,
    dockerfilePresent: dockerfile?.exists === true,
    dockerignorePresent: dockerignore?.exists === true,
    dockerignoreDiffersFromPr463Branch: true,
    trackaRuntimePathReportsPresent: runtimeReportsPresent,
    trackaRuntimePathScriptsPresent: runtimeScriptsPresent,
    centralAlreadyContainsFullPr463Evidence: runtimeReportsPresent && runtimeScriptsPresent,
    centralHasRepoOwnedDockerfilePath: dockerfile?.exists === true,
  }
}

function buildReconciliationMethod(generatedAt: string, centralPresence: JsonRecord, pr463Diff: JsonRecord) {
  const docsOnly = centralPresence.centralAlreadyContainsFullPr463Evidence !== true
  return {
    schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.reconciliationMethod.v1',
    generatedAt,
    method: docsOnly ? 'docs_only_central_reconciliation' : 'central_evidence_already_present',
    pr463ReplayCherryPickUsed: false,
    pr463DiffReplayed: false,
    dockerfileMutated: false,
    dockerignoreMutated: false,
    packageJsonMutatedForTrackaScripts: false,
    trackaRuntimeFilesCopied: false,
    reason: docsOnly
      ? 'Central branch lacks PR #463 Track A runtime-path reports/scripts, so this packet records PR #463 as reference evidence and leaves exact file replay for a later explicit owner phase.'
      : 'Central branch already contains the key PR #463 evidence; no replay was needed.',
    replayWouldNeedSeparateApproval:
      pr463Diff.containsDockerignoreChange === true || pr463Diff.containsPackageJsonChange === true,
    centralSourceOfTruthOwnsRuntimePathFilesDirectly: centralPresence.centralAlreadyContainsFullPr463Evidence === true,
    futureVersionProbeRemainsBlockedUntilApproval: true,
  }
}

function buildCentralEvidence(generatedAt: string, centralPresence: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.centralEvidence.v1',
    generatedAt,
    ffmpegPath: 'docker://docker/prod/render-worker/Dockerfile#ffmpeg',
    ffprobePath: 'docker://docker/prod/render-worker/Dockerfile#ffprobe',
    libassSubtitlesEvidence: 'present_in_pr_463_tracka_reference_reports',
    dockerfileProvenance: 'docker/prod/render-worker/Dockerfile',
    dockerfilePresentInCentral: centralPresence.dockerfilePresent === true,
    trackaRuntimePathReportsPresentInCentral: centralPresence.trackaRuntimePathReportsPresent === true,
    trackaRuntimePathScriptsPresentInCentral: centralPresence.trackaRuntimePathScriptsPresent === true,
    centralEvidenceStatus: 'reference_reconciled_not_version_proven',
    ffmpegAcceptedAsInstalledAndProven: false,
    ffprobeAcceptedAsInstalledAndProven: false,
    versionProbeRunInThisPhase: false,
    mediaProcessingRunInThisPhase: false,
    dockerBuildRunInThisPhase: false,
    renderExportRunInThisPhase: false,
  }
}

function buildFutureVersionProbeBoundary(generatedAt: string, centralEvidence: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.futureVersionProbeBoundary.v1',
    generatedAt,
    readyForFutureVersionProbeApprovalPacket: true,
    futureVersionProbeApprovedNow: false,
    versionProbeExecutionApprovedNow: false,
    futureCommandCandidatesAfterApproval: [
      'ffmpeg -version',
      'ffprobe -version',
      'docker/worker-container equivalent version probe only if the source path remains container-only',
    ],
    sourcePathForFutureApproval: {
      ffmpegPath: centralEvidence.ffmpegPath,
      ffprobePath: centralEvidence.ffprobePath,
    },
    noMediaFiles: true,
    noDecodeEncode: true,
    noCaptionBurnIn: true,
    noRenderExport: true,
    noDockerBuildUnlessSeparatelyApproved: true,
    noSupabaseGcsPublicArtifactsSignedUrls: true,
    noBetaProduction: true,
    stopOnFirstFailure: true,
  }
}

function buildOwnerHandoff(generatedAt: string, reconciliation: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.ownerHandoff.v1',
    generatedAt,
    trackaOwnerStatus: 'pr_463_reference_evidence_reconciled_into_central_metadata',
    centralOpenSourceLaneStatus: 'ready_for_future_version_probe_approval_packet',
    workerRuntimeHandoffStatus: 'blocked_until_version_probe_and_worker_owner_approval',
    soundMusicAudioImplications: 'none_in_this_phase',
    versionProbeApprovalOwner: 'central_open_source_tool_stack_with_tracka_source_context',
    blockersBeforeRealMediaCaptionRenderExecution: [
      'future_version_probe_approval',
      'future_version_probe_execution',
      'Track A media/caption/render owner approval',
      'worker/runtime approval',
      'artifact/source-of-truth policy approval',
    ],
    reconciliationMethod: reconciliation.method,
    nextPrompt,
  }
}

function buildDecision(
  generatedAt: string,
  decision: TrackaFfmpegFfprobeSourceOfTruthDecision,
  blockers: string[],
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.decision.v1',
    generatedAt,
    decision,
    readiness: decision === expectedDecision,
    nextPrompt,
    nextPromptFile: nextPromptPath,
    blockers,
    pr463ReferenceOnly: true,
    pr463ReplayCherryPickUsed: false,
    ffmpegAcceptedAsInstalledAndProven: false,
    ffprobeAcceptedAsInstalledAndProven: false,
    futureVersionProbeApprovedNow: false,
    versionProbeExecutionApprovedNow: false,
    dockerBuildAttempted: false,
    dockerContainerMutationAttempted: false,
    mediaProcessingAttempted: false,
    renderExportAttempted: false,
    npmInstallAttempted: false,
    npmRebuildAttempted: false,
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
  prMetadata: JsonRecord,
  pr463Diff: JsonRecord,
  centralPresence: JsonRecord,
  reconciliation: JsonRecord,
  futureBoundary: JsonRecord,
  ownerHandoff: JsonRecord,
) {
  const blockers: string[] = []
  const pr472 = prMetadata.pr472 as JsonRecord | undefined
  const pr463 = prMetadata.pr463 as JsonRecord | undefined
  if (pr472?.state !== 'MERGED' || !pr472?.mergedAt) blockers.push('blocked_pending_central_presence_check')
  if (pr463?.state !== 'MERGED' || !pr463?.mergedAt) blockers.push('blocked_pending_pr_463_diff_replay')
  if (centralPresence.dockerfilePresent !== true) blockers.push('blocked_pending_dockerfile_source_policy')
  if (pr463Diff.containsGeneratedAssets === true || pr463Diff.containsMediaOrBinaries === true) {
    blockers.push('rejected_due_runtime_safety_risk')
  }
  if (reconciliation.method !== 'docs_only_central_reconciliation' && reconciliation.method !== 'central_evidence_already_present') {
    blockers.push('blocked_pending_pr_463_diff_replay')
  }
  if (futureBoundary.futureVersionProbeApprovedNow !== false) blockers.push('rejected_due_runtime_safety_risk')
  if (ownerHandoff.nextPrompt !== nextPrompt) blockers.push('blocked_pending_owner_handoff')
  return blockers
}

function chooseDecision(blockers: string[]): TrackaFfmpegFfprobeSourceOfTruthDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('blocked_pending_dockerfile_source_policy')) return 'blocked_pending_dockerfile_source_policy'
  if (blockers.includes('blocked_pending_central_presence_check')) return 'blocked_pending_central_presence_check'
  if (blockers.includes('blocked_pending_owner_handoff')) return 'blocked_pending_owner_handoff'
  if (blockers.includes('blocked_pending_pr_463_diff_replay')) return 'blocked_pending_pr_463_diff_replay'
  return expectedDecision
}

function blockedFlags() {
  return {
    ffmpegVersionProbeAllowed: false,
    ffprobeVersionProbeAllowed: false,
    dockerBuildAllowed: false,
    dockerContainerMutationAllowed: false,
    mediaProcessingAllowed: false,
    captionBurnInAllowed: false,
    renderExportAllowed: false,
    npmInstallAllowed: false,
    npmRebuildAllowed: false,
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

function categorizeFile(file: string) {
  if (file.startsWith('docs/')) return 'docs_or_reports'
  if (file === 'package.json') return 'package_script_metadata'
  if (file === '.dockerignore') return 'dockerignore_config'
  if (file.startsWith('scripts/validation/')) return 'diagnostics_source'
  if (file.endsWith('Dockerfile')) return 'dockerfile_source'
  return 'source_or_config'
}

function pr463DiffMarkdown(report: JsonRecord) {
  const rows = Array.isArray(report.changedFiles)
    ? report.changedFiles.map((item) => {
        const row = item as JsonRecord
        return `- \`${row.file}\` (${row.category}, central present: ${row.centralPresence})`
      })
    : []
  return `# PR #463 Diff Review

- PR #463 state: \`${report.state ?? 'unknown'}\`
- PR #463 mergedAt: \`${report.mergedAt ?? 'none'}\`
- Base branch: \`${report.baseRefName ?? 'unknown'}\`
- Head SHA: \`${report.headRefOid ?? 'unknown'}\`
- Changed files: ${report.changedFilesCount}
- Dockerfile change present: ${report.containsDockerfileChange}
- .dockerignore change present: ${report.containsDockerignoreChange}
- package.json change present: ${report.containsPackageJsonChange}
- Generated assets present: ${report.containsGeneratedAssets}
- Media/binaries present: ${report.containsMediaOrBinaries}
- Replay/cherry-pick safe now: ${report.replayCherryPickSafeNow}
- Docs-only central reconciliation safer: ${report.docsOnlyCentralReconciliationSafer}

${rows.join('\n')}
`
}

function centralPresenceMarkdown(report: JsonRecord) {
  const rows = Array.isArray(report.checkedFiles)
    ? report.checkedFiles.map((item) => {
        const row = item as JsonRecord
        return `- \`${row.file}\`: ${row.exists}`
      })
    : []
  return `# Central Presence Check

- Source branch: \`${report.sourceBranch}\`
- Source SHA: \`${report.sourceSha}\`
- Dockerfile present: ${report.dockerfilePresent}
- .dockerignore present: ${report.dockerignorePresent}
- .dockerignore differs from PR #463 branch: ${report.dockerignoreDiffersFromPr463Branch}
- Track A runtime-path reports present: ${report.trackaRuntimePathReportsPresent}
- Track A runtime-path scripts present: ${report.trackaRuntimePathScriptsPresent}
- Central already contains full PR #463 evidence: ${report.centralAlreadyContainsFullPr463Evidence}

${rows.join('\n')}
`
}

function reconciliationMethodMarkdown(report: JsonRecord) {
  return `# Reconciliation Method

Method: \`${report.method}\`

- PR #463 replay/cherry-pick used: ${report.pr463ReplayCherryPickUsed}
- PR #463 diff replayed: ${report.pr463DiffReplayed}
- Dockerfile mutated: ${report.dockerfileMutated}
- .dockerignore mutated: ${report.dockerignoreMutated}
- package.json mutated for Track A scripts: ${report.packageJsonMutatedForTrackaScripts}
- Track A runtime files copied: ${report.trackaRuntimeFilesCopied}
- Future version probe remains blocked until approval: ${report.futureVersionProbeRemainsBlockedUntilApproval}

${report.reason}
`
}

function centralEvidenceMarkdown(report: JsonRecord) {
  return `# FFmpeg / FFprobe Central Evidence

- FFmpeg path: \`${report.ffmpegPath}\`
- FFprobe path: \`${report.ffprobePath}\`
- libass/subtitles evidence: \`${report.libassSubtitlesEvidence}\`
- Dockerfile provenance: \`${report.dockerfileProvenance}\`
- Dockerfile present in central: ${report.dockerfilePresentInCentral}
- Track A runtime reports present in central: ${report.trackaRuntimePathReportsPresentInCentral}
- Track A runtime scripts present in central: ${report.trackaRuntimePathScriptsPresentInCentral}
- Central evidence status: \`${report.centralEvidenceStatus}\`
- FFmpeg accepted as installed/proven: ${report.ffmpegAcceptedAsInstalledAndProven}
- FFprobe accepted as installed/proven: ${report.ffprobeAcceptedAsInstalledAndProven}
- Version probe run in this phase: ${report.versionProbeRunInThisPhase}
- Media processing run in this phase: ${report.mediaProcessingRunInThisPhase}
- Docker build run in this phase: ${report.dockerBuildRunInThisPhase}
- Render/export run in this phase: ${report.renderExportRunInThisPhase}
`
}

function futureBoundaryMarkdown(report: JsonRecord) {
  return `# Future Version-Probe Boundary

- Ready for future approval packet: ${report.readyForFutureVersionProbeApprovalPacket}
- Future version probe approved now: ${report.futureVersionProbeApprovedNow}
- Version-probe execution approved now: ${report.versionProbeExecutionApprovedNow}
- Future command candidates after approval: \`${Array.isArray(report.futureCommandCandidatesAfterApproval) ? report.futureCommandCandidatesAfterApproval.join('`, `') : ''}\`
- No media files: ${report.noMediaFiles}
- No decode/encode: ${report.noDecodeEncode}
- No caption burn-in: ${report.noCaptionBurnIn}
- No render/export: ${report.noRenderExport}
- No Docker build unless separately approved: ${report.noDockerBuildUnlessSeparatelyApproved}
- No Supabase/GCS/public artifacts/signed URLs: ${report.noSupabaseGcsPublicArtifactsSignedUrls}
- No beta/production: ${report.noBetaProduction}
- Stop on first failure: ${report.stopOnFirstFailure}
`
}

function ownerHandoffMarkdown(report: JsonRecord) {
  const blockers = Array.isArray(report.blockersBeforeRealMediaCaptionRenderExecution)
    ? report.blockersBeforeRealMediaCaptionRenderExecution.map((item) => `- ${item}`).join('\n')
    : '- none'
  return `# Owner Handoff And Blocker Review

- Track A owner status: \`${report.trackaOwnerStatus}\`
- Central open-source lane status: \`${report.centralOpenSourceLaneStatus}\`
- Worker runtime handoff status: \`${report.workerRuntimeHandoffStatus}\`
- Sound/Music/Audio implications: \`${report.soundMusicAudioImplications}\`
- Version-probe approval owner: \`${report.versionProbeApprovalOwner}\`
- Reconciliation method: \`${report.reconciliationMethod}\`
- Next prompt: \`${report.nextPrompt}\`

Blockers before real media/caption/render execution:
${blockers}
`
}

function decisionMarkdown(decision: JsonRecord) {
  return `# Track A FFmpeg / FFprobe Source-Of-Truth Decision

Decision: \`${decision.decision}\`

- PR #463 reference-only: ${decision.pr463ReferenceOnly}
- PR #463 replay/cherry-pick used: ${decision.pr463ReplayCherryPickUsed}
- FFmpeg accepted as installed/proven: ${decision.ffmpegAcceptedAsInstalledAndProven}
- FFprobe accepted as installed/proven: ${decision.ffprobeAcceptedAsInstalledAndProven}
- Future version probe approved now: ${decision.futureVersionProbeApprovedNow}
- Version-probe execution approved now: ${decision.versionProbeExecutionApprovedNow}
- Next prompt: \`${decision.nextPrompt}\`

Supabase classification: no write / none / none / no.
`
}

function validationResultsMarkdown(reports: TrackaFfmpegFfprobeSourceOfTruthReportSet) {
  return `# Track A FFmpeg / FFprobe Source-Of-Truth Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: ${reports.readinessReport.readiness}
- Reconciliation method: \`${reports.reconciliationMethod.method}\`
- Central Dockerfile present: ${reports.centralPresenceCheck.dockerfilePresent}
- Central Track A runtime reports present: ${reports.centralPresenceCheck.trackaRuntimePathReportsPresent}
- Future version probe approved now: ${reports.futureVersionProbeBoundary.futureVersionProbeApprovedNow}
- Blockers: ${Array.isArray(reports.blockerReport.blockers) ? reports.blockerReport.blockers.length : 0}

No FFmpeg/FFprobe probe, Docker build, Docker/container mutation, media processing, caption burn-in, render/export, npm install/rebuild, DuckDB/Polars proof rerun, worker/route/provider execution, Supabase/SQL/GCS mutation, public artifact, signed URL, raw prompt, beta, production, PR merge, or secret printing occurred in this phase.
`
}

function nextPromptMarkdown(reports: TrackaFfmpegFfprobeSourceOfTruthReportSet) {
  return `# OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL

Use the central source-of-truth branch after the Track A FFmpeg/FFprobe reconciliation lands.

Decision from reconciliation: \`${reports.decision.decision}\`.

Goal: approve a future bounded FFmpeg/FFprobe version-probe packet only. Do not run the probes in the approval phase.

Allowed future command candidates after a separate approval:
- \`ffmpeg -version\`
- \`ffprobe -version\`
- Docker or worker-container equivalent only if the source path remains container-only and that container scope is separately approved.

Blocked:
- media input files
- file probing
- decode/encode
- caption burn-in
- render/export
- Docker build unless separately approved
- Supabase, SQL, GCS, public artifacts, signed URLs
- raw prompts
- beta or production unlock

Stop on the first source-of-truth, scope, or safety drift.
`
}

function updateStatusDocs(reports: TrackaFfmpegFfprobeSourceOfTruthReportSet) {
  const block = `TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE:

- Decision: \`${reports.decision.decision}\`.
- Reconciliation method: \`${reports.reconciliationMethod.method}\`.
- PR #463 remains non-central Track A reference evidence; its diff was not replayed or cherry-picked.
- Central branch has \`docker/prod/render-worker/Dockerfile\`, but PR #463 Track A runtime-path reports/scripts are recorded as absent unless a later owner merge/replay lands them.
- FFmpeg and FFprobe remain not installed/proven centrally; future version probes are not approved by this phase.
- Next prompt: \`${reports.decision.nextPrompt}\`.
- Supabase classification: no write / none / none / no.`
  for (const file of statusDocPaths) {
    if (!existsSync(file)) continue
    upsertMarkedBlock(file, 'TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_STATUS', block)
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
    packageLockGitStatus: safeGit(['status', '--short', '--', 'package-lock.json']),
    packageJsonGitStatus: safeGit(['status', '--short', '--', 'package.json']),
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

function safePrDiffNameOnly(number: number) {
  try {
    return execFileSync('gh', ['pr', 'diff', String(number), '--repo', 'yuzastudio6-cyber/Reedkt', '--name-only'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
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
          '30',
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ),
    )
  } catch {
    return []
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
