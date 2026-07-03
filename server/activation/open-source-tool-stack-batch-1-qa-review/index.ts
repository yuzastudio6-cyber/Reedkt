import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { Batch1QaDecision, Batch1QaReviewReportSet } from './batch-1-qa-review-types'

type JsonObject = Record<string, unknown>

export const BATCH_1_QA_REVIEW_REPORT_DIR = 'docs/open-source-tool-stack/batch-1-qa-review'
export const BATCH_1_QA_REVIEW_BRANCH = 'codex/rp-open-source-tool-stack-batch-1-qa-review'
export const BATCH_1_QA_REVIEW_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const BATCH_1_QA_REVIEW_SOURCE_SHA = 'd79c4ece6eacdea0fbc836536aa8fe34d818ac22'

const executionReportDir = 'docs/open-source-tool-stack/batch-1-execution'
const expectedExecutionDecision = 'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools'
const expectedQaDecision =
  'open_source_tool_stack_batch_1_qa_passed_with_missing_optional_tools_ready_for_missing_optional_install_review'

const passedTargetIds = [
  'sharp_libvips_import_version_probe',
  'route_capability_manifest_validation',
  'fixture_report_validation_harness',
  'open_source_tool_inventory_validator',
]

const missingOptionalTargets = [
  { targetId: 'duckdb_metadata_query_proof', status: 'blocked_missing_dependency_or_module', installReviewRequired: true },
  { targetId: 'polars_metadata_dataframe_proof', status: 'blocked_missing_dependency_or_module', installReviewRequired: true },
  { targetId: 'ffmpeg_version_probe', status: 'blocked_missing_system_binary', installReviewRequired: true },
  { targetId: 'ffprobe_version_probe', status: 'blocked_missing_system_binary', installReviewRequired: true },
]

const executionReportPaths = {
  sourceAudit: `${executionReportDir}/source-of-truth-audit.json`,
  dependencyBaseline: `${executionReportDir}/dependency-baseline-validation.json`,
  selectedTargetGuard: `${executionReportDir}/selected-target-guard.json`,
  duckdb: `${executionReportDir}/duckdb-proof-report.json`,
  polars: `${executionReportDir}/polars-proof-report.json`,
  sharp: `${executionReportDir}/sharp-libvips-proof-report.json`,
  ffmpeg: `${executionReportDir}/ffmpeg-version-probe-report.json`,
  ffprobe: `${executionReportDir}/ffprobe-version-probe-report.json`,
  route: `${executionReportDir}/route-capability-manifest-validation-report.json`,
  fixture: `${executionReportDir}/fixture-report-validation-report.json`,
  inventory: `${executionReportDir}/inventory-proof-matrix-validation-report.json`,
  sideEffects: `${executionReportDir}/side-effect-and-lock-integrity-report.json`,
  decision: `${executionReportDir}/batch-1-execution-decision.json`,
  readiness: `${executionReportDir}/batch-1-execution-readiness-report.json`,
  blockers: `${executionReportDir}/batch-1-execution-blocker-report.json`,
}

const reportPaths = {
  sourceAudit: `${BATCH_1_QA_REVIEW_REPORT_DIR}/source-of-truth-audit.json`,
  pr435ExecutionEvidenceReview: `${BATCH_1_QA_REVIEW_REPORT_DIR}/pr-435-execution-evidence-review.json`,
  pr435ExecutionEvidenceReviewMd: `${BATCH_1_QA_REVIEW_REPORT_DIR}/pr-435-execution-evidence-review.md`,
  passedTargetQualityReview: `${BATCH_1_QA_REVIEW_REPORT_DIR}/passed-target-quality-review.json`,
  passedTargetQualityReviewMd: `${BATCH_1_QA_REVIEW_REPORT_DIR}/passed-target-quality-review.md`,
  missingOptionalToolImpactReview: `${BATCH_1_QA_REVIEW_REPORT_DIR}/missing-optional-tool-impact-review.json`,
  missingOptionalToolImpactReviewMd: `${BATCH_1_QA_REVIEW_REPORT_DIR}/missing-optional-tool-impact-review.md`,
  packageLockIntegrityReview: `${BATCH_1_QA_REVIEW_REPORT_DIR}/package-lock-integrity-review.json`,
  packageLockIntegrityReviewMd: `${BATCH_1_QA_REVIEW_REPORT_DIR}/package-lock-integrity-review.md`,
  internalBetaRelevanceReview: `${BATCH_1_QA_REVIEW_REPORT_DIR}/internal-beta-relevance-review.json`,
  internalBetaRelevanceReviewMd: `${BATCH_1_QA_REVIEW_REPORT_DIR}/internal-beta-relevance-review.md`,
  blockedScopeVerification: `${BATCH_1_QA_REVIEW_REPORT_DIR}/blocked-scope-verification.json`,
  blockedScopeVerificationMd: `${BATCH_1_QA_REVIEW_REPORT_DIR}/blocked-scope-verification.md`,
  decision: `${BATCH_1_QA_REVIEW_REPORT_DIR}/batch-1-qa-review-decision.json`,
  decisionMd: `${BATCH_1_QA_REVIEW_REPORT_DIR}/batch-1-qa-review-decision.md`,
  readiness: `${BATCH_1_QA_REVIEW_REPORT_DIR}/batch-1-qa-review-readiness-report.json`,
  blockers: `${BATCH_1_QA_REVIEW_REPORT_DIR}/batch-1-qa-review-blocker-report.json`,
  privateArtifactManifest: `${BATCH_1_QA_REVIEW_REPORT_DIR}/batch-1-qa-review-private-artifact-manifest.json`,
  validationResults: `${BATCH_1_QA_REVIEW_REPORT_DIR}/batch-1-qa-review-validation-results.md`,
}

const docPaths = [
  'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-tool-install-review.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
  'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW',
    'REEDITPRO_CONFIRM_BATCH_1_EXECUTION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_MISSING_OPTIONAL_TOOLS_REVIEW',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_INTEGRITY_REVIEW',
    'REEDITPRO_CONFIRM_INTERNAL_BETA_RELEVANCE_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'MISSING_OPTIONAL_TOOL_INSTALL',
    'DEPENDENCY_INSTALL',
    'PACKAGE_LOCK_MUTATION',
    'TOOL_IMPORT_SMOKE',
    'TOOL_VERSION_PROBE',
    'TOOL_FIXTURE_PROOF',
    'TOOL_ROUTE_EXECUTION',
    'REAL_TOOL_EXECUTION',
    'BROAD_TOOL_EXECUTION',
    'WORKER_EXECUTION',
    'PROVIDER_CALLS',
    'MEDIA_PROCESSING',
    'AUDIO_PROCESSING',
    'RENDER_EXPORT',
    'IMAGE_GENERATION',
    'IMAGE_EDITING',
    'BROWSER_CAPTURE',
    'MAP_RENDERING',
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

export function buildOpenSourceToolStackBatch1QaReviewPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW',
    branch: BATCH_1_QA_REVIEW_BRANCH,
    baseBranch: BATCH_1_QA_REVIEW_BASE_BRANCH,
    expectedSourceSha: BATCH_1_QA_REVIEW_SOURCE_SHA,
    mode: 'metadata_review_only_no_new_proofs',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision: expectedQaDecision,
    passedTargetsAcceptedAsCentralEvidence: passedTargetIds,
    missingOptionalTargetsRequiringInstallReview: missingOptionalTargets,
    reports: Object.values(reportPaths),
    docs: docPaths,
    forbiddenActions: [
      'dependency_install',
      'package_lock_mutation',
      'new_tool_import_smoke',
      'new_tool_version_probe',
      'new_synthetic_fixture_proof',
      'tool_route_worker_provider_execution',
      'media_or_audio_or_render_or_image_or_browser_or_map_execution',
      'supabase_sql_gcs_public_artifact_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildOpenSourceToolStackBatch1QaReviewReports(): Batch1QaReviewReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const executionReports = readExecutionReports()
  const sourceAudit = buildSourceOfTruthAudit(generatedAt, flags, executionReports)
  const pr435ExecutionEvidenceReview = buildPr435ExecutionEvidenceReview(generatedAt, executionReports)
  const passedTargetQualityReview = buildPassedTargetQualityReview(generatedAt, executionReports)
  const missingOptionalToolImpactReview = buildMissingOptionalToolImpactReview(generatedAt, executionReports)
  const packageLockIntegrityReview = buildPackageLockIntegrityReview(generatedAt, executionReports)
  const internalBetaRelevanceReview = buildInternalBetaRelevanceReview(generatedAt, executionReports)
  const blockedScopeVerification = buildBlockedScopeVerification(generatedAt, flags, executionReports)

  const blockers = buildBlockers({
    pr435ExecutionEvidenceReview,
    passedTargetQualityReview,
    missingOptionalToolImpactReview,
    packageLockIntegrityReview,
    internalBetaRelevanceReview,
    blockedScopeVerification,
  })
  const decisionValue = chooseDecision(blockers, {
    pr435ExecutionEvidenceReview,
    missingOptionalToolImpactReview,
    packageLockIntegrityReview,
    internalBetaRelevanceReview,
    blockedScopeVerification,
  })
  const readiness = decisionValue === expectedQaDecision || decisionValue === 'open_source_tool_stack_batch_1_qa_passed_ready_for_batch_2_approval'

  const decision = {
    schema: 'reeditpro.openSourceToolStack.batch1QaReview.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    qaReviewComplete: readiness,
    acceptedWithWarnings: decisionValue === expectedQaDecision,
    passedTargetsAcceptedAsCentralEvidence: passedTargetIds,
    missingOptionalTargetsRequiringInstallReview: missingOptionalTargets,
    missingOptionalToolsCountedAsInstalledOrProven: false,
    fullToolImplementationReadinessClaimed: false,
    nextPrompt: readiness ? 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW' : 'OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_BLOCKER_RESOLUTION',
    blockers,
    packageLockUnchanged: packageLockIntegrityReview.packageLockUnchanged === true,
    dependencyInstallAttempted: false,
    packageLockMutationAttempted: false,
    newToolImportSmokeRun: false,
    newToolVersionProbeRun: false,
    newFixtureProofRun: false,
    realToolExecutionAttempted: false,
    routeExecutionAttempted: false,
    workerExecutionAttempted: false,
    providerCallsAttempted: false,
    mediaProcessingAttempted: false,
    supabaseWritesAttempted: false,
    gcsUploadAttempted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptsExecuted: false,
    betaProductionUnlocked: false,
    supabaseClassification: supabaseClassification(),
    executionScope: flags,
  }

  return {
    sourceOfTruthAudit: sourceAudit,
    pr435ExecutionEvidenceReview,
    passedTargetQualityReview,
    missingOptionalToolImpactReview,
    packageLockIntegrityReview,
    internalBetaRelevanceReview,
    blockedScopeVerification,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.batch1QaReview.readinessReport.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      batch1UsefulForInternalBetaReadiness: internalBetaRelevanceReview.batch1UsefulForInternalBetaReadiness === true,
      missingOptionalInstallReviewRequired: missingOptionalToolImpactReview.installReviewRequiredBeforeCountingMissingTools === true,
      packageLockIntegrityPassed: packageLockIntegrityReview.passed === true,
      blockedScopesPreserved: blockedScopeVerification.passed === true,
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.batch1QaReview.blockerReport.v1',
      generatedAt,
      decision: decisionValue,
      blockers,
      missingOptionalTargets,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.batch1QaReview.privateArtifactManifest.v1',
      generatedAt,
      artifactScope: 'repo_committed_json_markdown_docs_only',
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      gcsUploads: false,
      mediaArtifactsCommitted: false,
      privatePayloadsCommitted: false,
      reportDirectory: BATCH_1_QA_REVIEW_REPORT_DIR,
      reports: Object.values(reportPaths),
      docs: docPaths,
    },
  }
}

export function writeOpenSourceToolStackBatch1QaReviewArtifacts() {
  const reports = buildOpenSourceToolStackBatch1QaReviewReports()
  mkdirSync(BATCH_1_QA_REVIEW_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.pr435ExecutionEvidenceReview, reports.pr435ExecutionEvidenceReview)
  writeText(reportPaths.pr435ExecutionEvidenceReviewMd, evidenceMarkdown(reports.pr435ExecutionEvidenceReview))
  writeJson(reportPaths.passedTargetQualityReview, reports.passedTargetQualityReview)
  writeText(reportPaths.passedTargetQualityReviewMd, passedTargetMarkdown(reports.passedTargetQualityReview))
  writeJson(reportPaths.missingOptionalToolImpactReview, reports.missingOptionalToolImpactReview)
  writeText(reportPaths.missingOptionalToolImpactReviewMd, missingOptionalMarkdown(reports.missingOptionalToolImpactReview))
  writeJson(reportPaths.packageLockIntegrityReview, reports.packageLockIntegrityReview)
  writeText(reportPaths.packageLockIntegrityReviewMd, packageLockMarkdown(reports.packageLockIntegrityReview))
  writeJson(reportPaths.internalBetaRelevanceReview, reports.internalBetaRelevanceReview)
  writeText(reportPaths.internalBetaRelevanceReviewMd, internalBetaMarkdown(reports.internalBetaRelevanceReview))
  writeJson(reportPaths.blockedScopeVerification, reports.blockedScopeVerification)
  writeText(reportPaths.blockedScopeVerificationMd, blockedScopeMarkdown(reports.blockedScopeVerification))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(
    'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-tool-install-review.md',
    missingOptionalInstallReviewPrompt()
  )
  updateOpenSourceDocs(reports)
  updateCrossChatDocs(reports)
  return reports
}

export function readOpenSourceToolStackBatch1QaReviewArtifacts(): Batch1QaReviewReportSet | undefined {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit),
    pr435ExecutionEvidenceReview: readJson(reportPaths.pr435ExecutionEvidenceReview),
    passedTargetQualityReview: readJson(reportPaths.passedTargetQualityReview),
    missingOptionalToolImpactReview: readJson(reportPaths.missingOptionalToolImpactReview),
    packageLockIntegrityReview: readJson(reportPaths.packageLockIntegrityReview),
    internalBetaRelevanceReview: readJson(reportPaths.internalBetaRelevanceReview),
    blockedScopeVerification: readJson(reportPaths.blockedScopeVerification),
    decision: readJson(reportPaths.decision),
    readinessReport: readJson(reportPaths.readiness),
    blockerReport: readJson(reportPaths.blockers),
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest),
  }
}

export function summarizeOpenSourceToolStackBatch1QaReview(reports = buildOpenSourceToolStackBatch1QaReviewReports()) {
  const decision = String(reports.decision.decision)
  const blockers = Array.isArray(reports.blockerReport.blockers) ? reports.blockerReport.blockers : []
  return [
    `Open-source Batch 1 QA review: ${decision}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'true' : 'false'}`,
    `Accepted passed targets: ${passedTargetIds.join(', ')}`,
    `Missing optional targets: ${missingOptionalTargets.map((target) => target.targetId).join(', ')}`,
    `Next prompt: ${String(reports.decision.nextPrompt)}`,
    `Blockers: ${blockers.length ? blockers.join(', ') : 'none'}`,
  ].join('\n')
}

function readExecutionReports() {
  return Object.fromEntries(Object.entries(executionReportPaths).map(([key, value]) => [key, readJson(value)]))
}

function buildSourceOfTruthAudit(generatedAt: string, flags: Record<string, false>, executionReports: Record<string, JsonObject>) {
  const pr435 = readGithubPr(435)
  const currentHead = runOptional('git', ['rev-parse', 'HEAD'])
  return {
    schema: 'reeditpro.openSourceToolStack.batch1QaReview.sourceOfTruthAudit.v1',
    generatedAt,
    branch: BATCH_1_QA_REVIEW_BRANCH,
    baseBranch: BATCH_1_QA_REVIEW_BASE_BRANCH,
    expectedSourceSha: BATCH_1_QA_REVIEW_SOURCE_SHA,
    currentHead,
    pr435,
    pr435EvidenceDecision: executionReports.decision?.decision ?? null,
    pr435MergedEvidencePresent:
      pr435?.state === 'MERGED' && Boolean(pr435?.mergedAt) && pr435?.headRefOid === '9fa82db4bfd25868aebc82f3d3d1779c149ee5db',
    predecessorPrEvidence: [430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387].map((number) => ({
      pr: number,
      role: 'merged_source_evidence',
    })),
    referenceOnlyPrs: [384, 401, 417, 420, 423, 425, 428, 432].map((number) => ({
      pr: number,
      role: 'reference_only_non_canonical',
    })),
    broadProductionDocsPresent: {
      betaReadinessScorecard: existsSync('docs/beta-readiness-scorecard.md'),
      productionBetaBlockerInventory: existsSync('docs/production-beta-blocker-inventory.md'),
      productionFoundationStatus: existsSync('PRODUCTION_FOUNDATION_STATUS.md'),
    },
    executionScope: flags,
  }
}

function buildPr435ExecutionEvidenceReview(generatedAt: string, executionReports: Record<string, JsonObject>) {
  const decisionPassed = executionReports.decision?.decision === expectedExecutionDecision
  const readinessPassed = executionReports.readiness?.readiness === true
  const noBlockers = Array.isArray(executionReports.decision?.blockers) && executionReports.decision.blockers.length === 0
  const requiredReportsPresent = Object.values(executionReportPaths).every((reportPath) => existsSync(reportPath))
  return {
    schema: 'reeditpro.openSourceToolStack.batch1QaReview.pr435ExecutionEvidenceReview.v1',
    generatedAt,
    requiredReportsPresent,
    executionDecision: executionReports.decision?.decision ?? null,
    expectedExecutionDecision,
    executionDecisionAccepted: decisionPassed,
    executionReadinessAccepted: readinessPassed,
    executionBlockersEmpty: noBlockers,
    noExtraProofExecutionRunByQa: true,
    passed: requiredReportsPresent && decisionPassed && readinessPassed && noBlockers,
  }
}

function buildPassedTargetQualityReview(generatedAt: string, executionReports: Record<string, JsonObject>) {
  const targetReports: Record<string, JsonObject | undefined> = {
    sharp_libvips_import_version_probe: executionReports.sharp,
    route_capability_manifest_validation: executionReports.route,
    fixture_report_validation_harness: executionReports.fixture,
    open_source_tool_inventory_validator: executionReports.inventory,
  }
  const targets = passedTargetIds.map((targetId) => ({
    targetId,
    acceptedAsCentralEvidence: targetReports[targetId]?.passed === true,
    sourceReportPassed: targetReports[targetId]?.passed === true,
    evidenceQuality: targetId === 'sharp_libvips_import_version_probe' ? 'import_version_only_no_file_processing' : 'committed_metadata_validator',
  }))
  return {
    schema: 'reeditpro.openSourceToolStack.batch1QaReview.passedTargetQualityReview.v1',
    generatedAt,
    targets,
    passedTargetCount: targets.filter((target) => target.acceptedAsCentralEvidence).length,
    fullToolImplementationReadinessClaimed: false,
    passed: targets.every((target) => target.acceptedAsCentralEvidence),
  }
}

function buildMissingOptionalToolImpactReview(generatedAt: string, executionReports: Record<string, JsonObject>) {
  const reports: Record<string, JsonObject | undefined> = {
    duckdb_metadata_query_proof: executionReports.duckdb,
    polars_metadata_dataframe_proof: executionReports.polars,
    ffmpeg_version_probe: executionReports.ffmpeg,
    ffprobe_version_probe: executionReports.ffprobe,
  }
  const targets = missingOptionalTargets.map((expected) => ({
    ...expected,
    sourceStatus: reports[expected.targetId]?.status ?? null,
    sourcePassed: reports[expected.targetId]?.passed === true,
    countedAsInstalledOrProven: false,
  }))
  return {
    schema: 'reeditpro.openSourceToolStack.batch1QaReview.missingOptionalToolImpactReview.v1',
    generatedAt,
    targets,
    missingOptionalTargetsClearlyRecorded: targets.every((target) => target.sourceStatus === target.status && target.sourcePassed === false),
    installReviewRequiredBeforeCountingMissingTools: true,
    blocksBatch1QaAcceptance: false,
    blocksBatch2ExecutionRecommendation: true,
    nextRequiredReview: 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW',
    passed: targets.every((target) => target.sourceStatus === target.status && target.sourcePassed === false),
  }
}

function buildPackageLockIntegrityReview(generatedAt: string, executionReports: Record<string, JsonObject>) {
  const packageLockStatus = runOptional('git', ['status', '--short', '--', 'package-lock.json']) ?? ''
  const packageJsonStatus = runOptional('git', ['status', '--short', '--', 'package.json']) ?? ''
  return {
    schema: 'reeditpro.openSourceToolStack.batch1QaReview.packageLockIntegrityReview.v1',
    generatedAt,
    packageLockGitStatus: packageLockStatus.trim(),
    packageJsonGitStatus: packageJsonStatus.trim(),
    packageLockUnchanged: packageLockStatus.trim() === '',
    executionReportedPackageLockChanged: executionReports.sideEffects?.packageLockChanged === false,
    executionReportedDependencyInstallAttempted: executionReports.decision?.dependencyInstallAttempted === false,
    executionReportedPackageLockMutationAttempted: executionReports.decision?.packageLockMutationAttempted === false,
    newDependencyAdditionsAllowed: false,
    passed:
      packageLockStatus.trim() === '' &&
      executionReports.sideEffects?.packageLockChanged === false &&
      executionReports.decision?.dependencyInstallAttempted === false &&
      executionReports.decision?.packageLockMutationAttempted === false,
  }
}

function buildInternalBetaRelevanceReview(generatedAt: string, executionReports: Record<string, JsonObject>) {
  return {
    schema: 'reeditpro.openSourceToolStack.batch1QaReview.internalBetaRelevanceReview.v1',
    generatedAt,
    batch1UsefulForInternalBetaReadiness: true,
    reason:
      'Batch 1 provides central proof for Sharp/libvips import/version metadata and three committed metadata validators without broad tool execution.',
    missingOptionalInstallReviewRecommendedBeforeRelyingOnDuckdbPolarsFfmpegFfprobe: true,
    batch2PlanningAllowedWhileMissingOptionalToolsTracked: false,
    batch2ExecutionAllowedFromThisQa: false,
    full30To40ToolReadinessClaimed: false,
    sourceDecision: executionReports.decision?.decision ?? null,
    passed: executionReports.decision?.decision === expectedExecutionDecision,
  }
}

function buildBlockedScopeVerification(generatedAt: string, flags: Record<string, false>, executionReports: Record<string, JsonObject>) {
  const decisionFlags = executionReports.decision?.executionScope
  const allSourceFlagsFalse =
    typeof decisionFlags === 'object' &&
    decisionFlags !== null &&
    Object.values(decisionFlags as Record<string, unknown>).every((value) => value === false)
  return {
    schema: 'reeditpro.openSourceToolStack.batch1QaReview.blockedScopeVerification.v1',
    generatedAt,
    noInstall: true,
    noPackageLockMutation: true,
    noNewImportSmoke: true,
    noNewVersionProbe: true,
    noNewFixtureProof: true,
    noToolRouteWorkerProviderExecution: true,
    noMediaAudioRenderImageBrowserMapExecution: true,
    noSupabaseSqlGcsPublicArtifactSignedUrlMutation: true,
    noRawPromptExecution: true,
    noGithubPrMerge: true,
    noBetaProductionUnlock: true,
    executionSourceFlagsAllFalse: allSourceFlagsFalse,
    executionScope: flags,
    supabaseClassification: supabaseClassification(),
    passed: allSourceFlagsFalse,
  }
}

function buildBlockers(reviews: Record<string, JsonObject>) {
  const blockers: string[] = []
  if (reviews.blockedScopeVerification?.passed !== true) blockers.push('rejected_due_runtime_safety_risk')
  if (reviews.pr435ExecutionEvidenceReview?.passed !== true) blockers.push('blocked_pending_batch_1_execution_evidence_review')
  if (reviews.passedTargetQualityReview?.passed !== true) blockers.push('blocked_pending_batch_1_execution_evidence_review')
  if (reviews.missingOptionalToolImpactReview?.passed !== true) blockers.push('blocked_pending_missing_optional_tool_install_review')
  if (reviews.packageLockIntegrityReview?.passed !== true) blockers.push('blocked_pending_package_lock_integrity_review')
  if (reviews.internalBetaRelevanceReview?.passed !== true) blockers.push('blocked_pending_internal_beta_relevance_review')
  return blockers
}

function chooseDecision(blockers: string[], reviews: Record<string, JsonObject>): Batch1QaDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('blocked_pending_batch_1_execution_evidence_review')) return 'blocked_pending_batch_1_execution_evidence_review'
  if (blockers.includes('blocked_pending_package_lock_integrity_review')) return 'blocked_pending_package_lock_integrity_review'
  if (blockers.includes('blocked_pending_internal_beta_relevance_review')) return 'blocked_pending_internal_beta_relevance_review'
  if (blockers.includes('blocked_pending_missing_optional_tool_install_review')) return 'blocked_pending_missing_optional_tool_install_review'
  if (reviews.missingOptionalToolImpactReview?.installReviewRequiredBeforeCountingMissingTools === true) return expectedQaDecision
  return 'open_source_tool_stack_batch_1_qa_passed_ready_for_batch_2_approval'
}

function blockedFlags(): Record<string, false> {
  return {
    dependencyInstallAllowed: false,
    packageLockMutationAllowed: false,
    newToolImportSmokeAllowed: false,
    newToolVersionProbeAllowed: false,
    newFixtureProofAllowed: false,
    broadToolExecutionAllowed: false,
    toolExecutionAllowed: false,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    providerExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    mediaProcessingAllowed: false,
    audioProcessingAllowed: false,
    renderExecutionAllowed: false,
    imageGenerationAllowed: false,
    imageEditingAllowed: false,
    browserCaptureAllowed: false,
    mapRenderingAllowed: false,
    supabaseWritesAllowed: false,
    sqlAllowed: false,
    gcsUploadAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
    rawPromptExecutionAllowed: false,
    githubPrMergeAllowed: false,
    externalBetaUnlockAllowed: false,
    paidProductionUnlockAllowed: false,
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

function readGithubPr(number: number) {
  const output = runOptional('gh', [
    'pr',
    'view',
    String(number),
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--json',
    'number,title,state,isDraft,mergedAt,baseRefName,headRefName,headRefOid,url',
  ])
  if (!output) return { number, githubMetadataAvailable: false }
  try {
    return { githubMetadataAvailable: true, ...JSON.parse(output) }
  } catch {
    return { number, githubMetadataAvailable: false, parseFailed: true }
  }
}

function readJson(filePath: string): JsonObject {
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonObject
}

function writeJson(filePath: string, value: unknown) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(filePath: string, value: string) {
  writeFileSync(filePath, value)
}

function runOptional(command: string, args: string[]) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    }).trim()
  } catch {
    return null
  }
}

function evidenceMarkdown(review: JsonObject) {
  return `# PR #435 Execution Evidence Review

- Decision: \`${review.executionDecision}\`
- Required reports present: \`${review.requiredReportsPresent}\`
- Execution readiness accepted: \`${review.executionReadinessAccepted}\`
- Execution blockers empty: \`${review.executionBlockersEmpty}\`
- QA reran proof execution: \`false\`
`
}

function passedTargetMarkdown(review: JsonObject) {
  const targets = Array.isArray(review.targets) ? review.targets : []
  return `# Passed Target Quality Review

Accepted central Batch 1 evidence:

${targets.map((target) => `- \`${target.targetId}\`: accepted \`${target.acceptedAsCentralEvidence}\`, quality \`${target.evidenceQuality}\``).join('\n')}

Full tool implementation readiness claimed: \`false\`
`
}

function missingOptionalMarkdown(review: JsonObject) {
  const targets = Array.isArray(review.targets) ? review.targets : []
  return `# Missing Optional Tool Impact Review

Missing optional tools are not counted as installed or proven:

${targets.map((target) => `- \`${target.targetId}\`: \`${target.sourceStatus}\`, install review required \`${target.installReviewRequired}\``).join('\n')}

Next required review: \`${review.nextRequiredReview}\`
`
}

function packageLockMarkdown(review: JsonObject) {
  return `# Package Lock Integrity Review

- package-lock unchanged: \`${review.packageLockUnchanged}\`
- execution reported package-lock changed: \`${review.executionReportedPackageLockChanged}\`
- execution reported dependency install attempted: \`${review.executionReportedDependencyInstallAttempted}\`
- execution reported package-lock mutation attempted: \`${review.executionReportedPackageLockMutationAttempted}\`
`
}

function internalBetaMarkdown(review: JsonObject) {
  return `# Internal Beta Relevance Review

- Batch 1 useful for internal beta readiness: \`${review.batch1UsefulForInternalBetaReadiness}\`
- Missing optional install review recommended: \`${review.missingOptionalInstallReviewRecommendedBeforeRelyingOnDuckdbPolarsFfmpegFfprobe}\`
- Batch 2 execution allowed from this QA: \`${review.batch2ExecutionAllowedFromThisQa}\`
- Full 30-40 tool readiness claimed: \`${review.full30To40ToolReadinessClaimed}\`
`
}

function blockedScopeMarkdown(review: JsonObject) {
  return `# Blocked Scope Verification

All real execution and product scopes remain blocked.

- installs: \`${review.noInstall}\`
- package-lock mutation: \`${review.noPackageLockMutation}\`
- tool/route/worker/provider execution: \`${review.noToolRouteWorkerProviderExecution}\`
- media/audio/render/image/browser/map execution: \`${review.noMediaAudioRenderImageBrowserMapExecution}\`
- Supabase/SQL/GCS/public/signed URL mutation: \`${review.noSupabaseSqlGcsPublicArtifactSignedUrlMutation}\`
- beta/production unlock: \`${review.noBetaProductionUnlock}\`
`
}

function decisionMarkdown(decision: JsonObject) {
  return `# Batch 1 QA Review Decision

Decision: \`${decision.decision}\`

The central Batch 1 proof execution is accepted with missing optional tools. DuckDB, Polars, FFmpeg, and FFprobe remain uninstalled/unproven and require a separate install review before they can count as available.

Next prompt: \`${decision.nextPrompt}\`
`
}

function validationResultsMarkdown(reports: Batch1QaReviewReportSet) {
  return `# Batch 1 QA Review Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: \`${reports.readinessReport.readiness}\`
- Package-lock unchanged: \`${reports.packageLockIntegrityReview.packageLockUnchanged}\`
- Missing optional install review required: \`${reports.missingOptionalToolImpactReview.installReviewRequiredBeforeCountingMissingTools}\`
- Blockers: \`${Array.isArray(reports.blockerReport.blockers) && reports.blockerReport.blockers.length ? reports.blockerReport.blockers.join(', ') : 'none'}\`
`
}

function missingOptionalInstallReviewPrompt() {
  return `# OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW

Review whether DuckDB, Polars, FFmpeg, and FFprobe should be installed/proven in a future explicit phase.

This prompt does not authorize installation, package-lock mutation, tool execution, media processing, workers, routes, providers, Supabase/GCS mutation, public artifacts, signed URLs, raw prompts, beta, or production.
`
}

function updateOpenSourceDocs(reports: Batch1QaReviewReportSet) {
  upsertBlock(
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'OPEN_SOURCE_BATCH_1_QA_REVIEW_STATUS',
    openSourceStatusBlock(reports)
  )
  upsertBlock(
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'OPEN_SOURCE_BATCH_1_QA_REVIEW_STATUS',
    openSourceStatusBlock(reports)
  )
}

function updateCrossChatDocs(reports: Batch1QaReviewReportSet) {
  for (const filePath of [
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
    'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
  ]) {
    upsertBlock(filePath, 'OPEN_SOURCE_BATCH_1_QA_REVIEW_STATUS', openSourceStatusBlock(reports))
  }
}

function openSourceStatusBlock(reports: Batch1QaReviewReportSet) {
  return `OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW:

- Decision: \`${reports.decision.decision}\`.
- Accepted central Batch 1 evidence: Sharp/libvips import/version proof, route/capability manifest validation, fixture/report validation, and open-source inventory/proof matrix validation.
- Missing optional tools: DuckDB local module, Polars local module, FFmpeg system binary, and FFprobe system binary.
- Missing optional tools are not counted as installed or proven.
- Next prompt: \`${reports.decision.nextPrompt}\`.
- Real tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.`
}

function upsertBlock(filePath: string, marker: string, body: string) {
  if (!existsSync(filePath)) return
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const block = `${start}\n${body}\n${end}`
  const current = readFileSync(filePath, 'utf8')
  if (current.includes(start) && current.includes(end)) {
    const next = current.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`), block)
    writeText(filePath, next)
    return
  }
  writeText(filePath, `${current.trimEnd()}\n\n${block}\n`)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
