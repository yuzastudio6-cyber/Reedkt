import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  MissingOptionalInstallReviewDecision,
  MissingOptionalInstallReviewReportSet,
} from './missing-optional-install-review-types'

type JsonObject = Record<string, unknown>

export const MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR = 'docs/open-source-tool-stack/missing-optional-install-review'
export const MISSING_OPTIONAL_INSTALL_REVIEW_BRANCH =
  'codex/rp-open-source-tool-stack-missing-optional-install-review'
export const MISSING_OPTIONAL_INSTALL_REVIEW_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const MISSING_OPTIONAL_INSTALL_REVIEW_SOURCE_SHA = '87c2d8fb3c3e4e475590a06f19a5fa81c6284d03'

const expectedDecision = 'missing_optional_install_review_passed_ready_for_package_and_binary_approval'
const expectedQaDecision =
  'open_source_tool_stack_batch_1_qa_passed_with_missing_optional_tools_ready_for_missing_optional_install_review'
const expectedExecutionDecision = 'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools'

const sourceEvidencePaths = {
  qaDecision: 'docs/open-source-tool-stack/batch-1-qa-review/batch-1-qa-review-decision.json',
  qaMissingOptional: 'docs/open-source-tool-stack/batch-1-qa-review/missing-optional-tool-impact-review.json',
  qaPackageLock: 'docs/open-source-tool-stack/batch-1-qa-review/package-lock-integrity-review.json',
  executionDecision: 'docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json',
  executionDuckdb: 'docs/open-source-tool-stack/batch-1-execution/duckdb-proof-report.json',
  executionPolars: 'docs/open-source-tool-stack/batch-1-execution/polars-proof-report.json',
  executionFfmpeg: 'docs/open-source-tool-stack/batch-1-execution/ffmpeg-version-probe-report.json',
  executionFfprobe: 'docs/open-source-tool-stack/batch-1-execution/ffprobe-version-probe-report.json',
  executionSharp: 'docs/open-source-tool-stack/batch-1-execution/sharp-libvips-proof-report.json',
  executionRoute: 'docs/open-source-tool-stack/batch-1-execution/route-capability-manifest-validation-report.json',
  executionFixture: 'docs/open-source-tool-stack/batch-1-execution/fixture-report-validation-report.json',
  executionInventory: 'docs/open-source-tool-stack/batch-1-execution/inventory-proof-matrix-validation-report.json',
  openSourceDecision: 'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
}

const reportPaths = {
  sourceAudit: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/source-of-truth-audit.json`,
  evidenceRevalidationReport: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/evidence-revalidation-report.json`,
  evidenceRevalidationReportMd: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/evidence-revalidation-report.md`,
  duckdbInstallStrategy: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/duckdb-install-strategy.json`,
  duckdbInstallStrategyMd: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/duckdb-install-strategy.md`,
  polarsInstallStrategy: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/polars-install-strategy.json`,
  polarsInstallStrategyMd: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/polars-install-strategy.md`,
  ffmpegFfprobeInstallStrategy: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-install-strategy.json`,
  ffmpegFfprobeInstallStrategyMd: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-install-strategy.md`,
  packageLockDependencyPolicy: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/package-lock-dependency-policy.json`,
  packageLockDependencyPolicyMd: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/package-lock-dependency-policy.md`,
  systemBinaryContainerPolicy: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/system-binary-container-policy.json`,
  systemBinaryContainerPolicyMd: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/system-binary-container-policy.md`,
  syntheticProofPlan: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/synthetic-proof-plan.json`,
  syntheticProofPlanMd: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/synthetic-proof-plan.md`,
  decision: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/missing-optional-install-review-decision.json`,
  decisionMd: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/missing-optional-install-review-decision.md`,
  readiness: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/missing-optional-install-review-readiness-report.json`,
  blockers: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/missing-optional-install-review-blocker-report.json`,
  privateArtifactManifest: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/missing-optional-install-review-private-artifact-manifest.json`,
  validationResults: `${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/missing-optional-install-review-validation-results.md`,
}

const docPaths = [
  'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-package-and-binary-approval.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
  'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
]

const predecessorPrs = [439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH_1_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW',
    'REEDITPRO_CONFIRM_BATCH_1_QA_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_MISSING_OPTIONAL_TOOL_STRATEGY_REVIEW',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_SYSTEM_BINARY_STRATEGY_REVIEW',
    'REEDITPRO_CONFIRM_CONTAINER_WORKER_HANDOFF_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'DEPENDENCY_INSTALL',
    'PACKAGE_LOCK_MUTATION',
    'SYSTEM_BINARY_INSTALL',
    'CONTAINER_IMAGE_MUTATION',
    'TOOL_IMPORT_SMOKE',
    'TOOL_VERSION_PROBE',
    'TOOL_FIXTURE_PROOF',
    'INSTALL_PROOF_EXECUTION',
    'REAL_TOOL_EXECUTION',
    'BROAD_TOOL_EXECUTION',
    'TOOL_ROUTE_EXECUTION',
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

export function buildOpenSourceToolStackMissingOptionalInstallReviewPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_BATCH_1_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW',
    branch: MISSING_OPTIONAL_INSTALL_REVIEW_BRANCH,
    baseBranch: MISSING_OPTIONAL_INSTALL_REVIEW_BASE_BRANCH,
    expectedSourceSha: MISSING_OPTIONAL_INSTALL_REVIEW_SOURCE_SHA,
    mode: 'metadata_install_strategy_review_only_no_install_no_proofs',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    reviewedMissingOptionalTargets: ['duckdb', 'polars', 'ffmpeg', 'ffprobe'],
    recommendedNextPrompt: 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL',
    reports: Object.values(reportPaths),
    docs: docPaths,
    forbiddenActions: [
      'dependency_install',
      'package_lock_mutation',
      'system_binary_install',
      'container_image_mutation',
      'tool_import_smoke',
      'tool_version_probe',
      'fixture_proof',
      'tool_route_worker_provider_execution',
      'media_audio_render_image_browser_map_execution',
      'supabase_sql_gcs_public_artifact_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildOpenSourceToolStackMissingOptionalInstallReviewReports(): MissingOptionalInstallReviewReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const evidence = readSourceEvidence()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, flags, evidence)
  const evidenceRevalidationReport = buildEvidenceRevalidationReport(generatedAt, evidence)
  const duckdbInstallStrategy = buildDuckdbInstallStrategy(generatedAt)
  const polarsInstallStrategy = buildPolarsInstallStrategy(generatedAt)
  const ffmpegFfprobeInstallStrategy = buildFfmpegFfprobeInstallStrategy(generatedAt)
  const packageLockDependencyPolicy = buildPackageLockDependencyPolicy(generatedAt)
  const systemBinaryContainerPolicy = buildSystemBinaryContainerPolicy(generatedAt)
  const syntheticProofPlan = buildSyntheticProofPlan(generatedAt)
  const blockers = buildBlockers({
    evidenceRevalidationReport,
    duckdbInstallStrategy,
    polarsInstallStrategy,
    ffmpegFfprobeInstallStrategy,
    packageLockDependencyPolicy,
    systemBinaryContainerPolicy,
    syntheticProofPlan,
  })
  const decisionValue = chooseDecision(blockers)
  const readiness = decisionValue === expectedDecision

  const decision = {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    reviewComplete: readiness,
    reviewedTargets: ['duckdb', 'polars', 'ffmpeg', 'ffprobe'],
    packageCandidates: ['duckdb', 'nodejs-polars'],
    systemBinaryCandidates: ['ffmpeg', 'ffprobe'],
    nextPrompt: readiness
      ? 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL'
      : 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_INSTALL_REVIEW_BLOCKER_RESOLUTION',
    blockers,
    dependencyInstallAttempted: false,
    packageLockMutationAttempted: false,
    packageJsonDependencySectionsChanged: false,
    systemBinaryInstallAttempted: false,
    containerImageMutationAttempted: false,
    importSmokeRun: false,
    versionProbeRun: false,
    fixtureProofRun: false,
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
    sourceOfTruthAudit,
    evidenceRevalidationReport,
    duckdbInstallStrategy,
    polarsInstallStrategy,
    ffmpegFfprobeInstallStrategy,
    packageLockDependencyPolicy,
    systemBinaryContainerPolicy,
    syntheticProofPlan,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.readinessReport.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      packageApprovalReady: readiness,
      systemBinaryApprovalReady: readiness,
      installOrProofAuthorizedHere: false,
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.blockerReport.v1',
      generatedAt,
      decision: decisionValue,
      blockers,
      blockerCount: blockers.length,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.privateArtifactManifest.v1',
      generatedAt,
      artifactScope: 'repo_committed_json_markdown_docs_only',
      reportDirectory: MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR,
      reports: Object.values(reportPaths),
      docs: docPaths,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      gcsUploads: false,
      mediaArtifactsCommitted: false,
      privatePayloadsCommitted: false,
    },
  }
}

export function writeOpenSourceToolStackMissingOptionalInstallReviewArtifacts() {
  const reports = buildOpenSourceToolStackMissingOptionalInstallReviewReports()
  mkdirSync(MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.evidenceRevalidationReport, reports.evidenceRevalidationReport)
  writeText(reportPaths.evidenceRevalidationReportMd, evidenceMarkdown(reports.evidenceRevalidationReport))
  writeJson(reportPaths.duckdbInstallStrategy, reports.duckdbInstallStrategy)
  writeText(reportPaths.duckdbInstallStrategyMd, toolStrategyMarkdown('DuckDB Install Strategy', reports.duckdbInstallStrategy))
  writeJson(reportPaths.polarsInstallStrategy, reports.polarsInstallStrategy)
  writeText(reportPaths.polarsInstallStrategyMd, toolStrategyMarkdown('Polars Install Strategy', reports.polarsInstallStrategy))
  writeJson(reportPaths.ffmpegFfprobeInstallStrategy, reports.ffmpegFfprobeInstallStrategy)
  writeText(
    reportPaths.ffmpegFfprobeInstallStrategyMd,
    ffmpegFfprobeStrategyMarkdown(reports.ffmpegFfprobeInstallStrategy)
  )
  writeJson(reportPaths.packageLockDependencyPolicy, reports.packageLockDependencyPolicy)
  writeText(reportPaths.packageLockDependencyPolicyMd, packageLockPolicyMarkdown(reports.packageLockDependencyPolicy))
  writeJson(reportPaths.systemBinaryContainerPolicy, reports.systemBinaryContainerPolicy)
  writeText(reportPaths.systemBinaryContainerPolicyMd, systemBinaryPolicyMarkdown(reports.systemBinaryContainerPolicy))
  writeJson(reportPaths.syntheticProofPlan, reports.syntheticProofPlan)
  writeText(reportPaths.syntheticProofPlanMd, syntheticProofPlanMarkdown(reports.syntheticProofPlan))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(
    'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-package-and-binary-approval.md',
    nextPromptMarkdown(reports)
  )
  updateOpenSourceDocs(reports)
  updateCrossChatDocs(reports)
  return reports
}

export function readOpenSourceToolStackMissingOptionalInstallReviewArtifacts():
  | MissingOptionalInstallReviewReportSet
  | undefined {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit),
    evidenceRevalidationReport: readJson(reportPaths.evidenceRevalidationReport),
    duckdbInstallStrategy: readJson(reportPaths.duckdbInstallStrategy),
    polarsInstallStrategy: readJson(reportPaths.polarsInstallStrategy),
    ffmpegFfprobeInstallStrategy: readJson(reportPaths.ffmpegFfprobeInstallStrategy),
    packageLockDependencyPolicy: readJson(reportPaths.packageLockDependencyPolicy),
    systemBinaryContainerPolicy: readJson(reportPaths.systemBinaryContainerPolicy),
    syntheticProofPlan: readJson(reportPaths.syntheticProofPlan),
    decision: readJson(reportPaths.decision),
    readinessReport: readJson(reportPaths.readiness),
    blockerReport: readJson(reportPaths.blockers),
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest),
  }
}

export function summarizeOpenSourceToolStackMissingOptionalInstallReview(
  reports = buildOpenSourceToolStackMissingOptionalInstallReviewReports()
) {
  const blockers = Array.isArray(reports.blockerReport.blockers) ? reports.blockerReport.blockers : []
  return [
    `Open-source missing optional install review: ${String(reports.decision.decision)}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'true' : 'false'}`,
    `Package candidates: duckdb, nodejs-polars`,
    `System binary candidates: ffmpeg, ffprobe`,
    `Next prompt: ${String(reports.decision.nextPrompt)}`,
    `Blockers: ${blockers.length ? blockers.join(', ') : 'none'}`,
  ].join('\n')
}

function readSourceEvidence(): Record<string, JsonObject | null> {
  return Object.fromEntries(
    Object.entries(sourceEvidencePaths).map(([key, value]) => [key, existsSync(value) ? readMaybeJsonOrText(value) : null])
  )
}

function buildSourceOfTruthAudit(
  generatedAt: string,
  flags: Record<string, false>,
  evidence: Record<string, JsonObject | null>
) {
  const packageJson = readJson('package.json')
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.sourceOfTruthAudit.v1',
    generatedAt,
    branch: MISSING_OPTIONAL_INSTALL_REVIEW_BRANCH,
    baseBranch: MISSING_OPTIONAL_INSTALL_REVIEW_BASE_BRANCH,
    expectedSourceSha: MISSING_OPTIONAL_INSTALL_REVIEW_SOURCE_SHA,
    currentHead: runOptional('git', ['rev-parse', 'HEAD']),
    packageJsonSha256: hashFile('package.json'),
    packageLockSha256: hashFile('package-lock.json'),
    packageJsonDependencySections: {
      dependencies: Object.keys(packageJson.dependencies ?? {}).sort(),
      devDependencies: Object.keys(packageJson.devDependencies ?? {}).sort(),
      optionalDependencies: Object.keys(packageJson.optionalDependencies ?? {}).sort(),
    },
    candidateDependencyPresenceNow: candidateDependencyPresence(packageJson),
    sourceEvidenceFilesPresent: Object.fromEntries(
      Object.entries(sourceEvidencePaths).map(([key, value]) => [key, existsSync(value)])
    ),
    predecessorPrEvidence: predecessorPrs.map((number) => ({
      pr: number,
      role: 'merged_source_evidence',
      metadata: readGithubPr(number),
    })),
    referenceOnlyPrs: referenceOnlyPrs.map((number) => ({
      pr: number,
      role: 'reference_only_non_canonical',
      metadata: readGithubPr(number),
    })),
    broadProductionDocsPresent: {
      betaReadinessScorecard: existsSync('docs/beta-readiness-scorecard.md'),
      productionBetaBlockerInventory: existsSync('docs/production-beta-blocker-inventory.md'),
      productionFoundationStatus: existsSync('PRODUCTION_FOUNDATION_STATUS.md'),
    },
    pr384Canonical: false,
    pr401Canonical: false,
    executionScope: flags,
    supabaseClassification: supabaseClassification(),
    evidenceSnapshot: {
      qaDecision: evidence.qaDecision?.decision ?? null,
      executionDecision: evidence.executionDecision?.decision ?? null,
    },
  }
}

function buildEvidenceRevalidationReport(generatedAt: string, evidence: Record<string, JsonObject | null>) {
  const missingOptionalTargets = Array.isArray(evidence.qaMissingOptional?.targets) ? evidence.qaMissingOptional.targets : []
  const requiredMissingTargetStatuses = {
    duckdb_metadata_query_proof: 'blocked_missing_dependency_or_module',
    polars_metadata_dataframe_proof: 'blocked_missing_dependency_or_module',
    ffmpeg_version_probe: 'blocked_missing_system_binary',
    ffprobe_version_probe: 'blocked_missing_system_binary',
  }
  const missingTargetReview = Object.entries(requiredMissingTargetStatuses).map(([targetId, expectedStatus]) => {
    const source = missingOptionalTargets.find((target: JsonObject) => target.targetId === targetId)
    return {
      targetId,
      expectedStatus,
      sourceStatus: source?.status ?? source?.sourceStatus ?? null,
      installReviewRequired: source?.installReviewRequired === true,
      countedAsInstalledOrProven: source?.countedAsInstalledOrProven === true,
      passed:
        (source?.status === expectedStatus || source?.sourceStatus === expectedStatus) &&
        source?.installReviewRequired === true &&
        source?.countedAsInstalledOrProven !== true,
    }
  })
  const passedTargets = [
    evidence.executionSharp?.passed === true,
    evidence.executionRoute?.passed === true,
    evidence.executionFixture?.passed === true,
    evidence.executionInventory?.passed === true,
  ]
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.evidenceRevalidationReport.v1',
    generatedAt,
    qaDecision: evidence.qaDecision?.decision ?? null,
    expectedQaDecision,
    executionDecision: evidence.executionDecision?.decision ?? null,
    expectedExecutionDecision,
    qaDecisionAccepted: evidence.qaDecision?.decision === expectedQaDecision,
    executionDecisionAccepted: evidence.executionDecision?.decision === expectedExecutionDecision,
    batch1QaInstallReviewPrompted:
      evidence.qaDecision?.nextPrompt === 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW',
    passedBatch1TargetsStillAccepted: passedTargets.every(Boolean),
    missingTargetReview,
    packageLockQaPassed: evidence.qaPackageLock?.passed === true && evidence.qaPackageLock?.packageLockUnchanged === true,
    packageLockMutationAttemptedInSourceEvidence: evidence.executionDecision?.packageLockMutationAttempted === true,
    dependencyInstallAttemptedInSourceEvidence: evidence.executionDecision?.dependencyInstallAttempted === true,
    passed:
      evidence.qaDecision?.decision === expectedQaDecision &&
      evidence.executionDecision?.decision === expectedExecutionDecision &&
      passedTargets.every(Boolean) &&
      missingTargetReview.every((target) => target.passed) &&
      evidence.qaPackageLock?.passed === true &&
      evidence.executionDecision?.packageLockMutationAttempted !== true &&
      evidence.executionDecision?.dependencyInstallAttempted !== true,
  }
}

function buildDuckdbInstallStrategy(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.duckdbInstallStrategy.v1',
    generatedAt,
    toolName: 'DuckDB',
    normalizedId: 'duckdb',
    owner: 'TRACK_B_MEDIA_PROCESSING',
    currentBatch1Status: 'blocked_missing_dependency_or_module',
    selectedFuturePackageCandidate: 'duckdb',
    candidateRuntime: 'node_server_only',
    installClass: 'npm_package',
    packageLockMutationExpectedInFutureApproval: true,
    packageLockMutationAllowedInThisReview: false,
    dependencyInstallAllowedInThisReview: false,
    futureProofScope:
      'import/version plus tiny in-memory synthetic metadata query after separate package-and-binary approval only',
    prohibitedUses: [
      'real media database processing',
      'reading user uploads',
      'worker route execution',
      'Supabase writes',
      'public artifacts',
      'production use',
    ],
    failClosedRules: [
      'block if package selection changes without review',
      'block if package-lock diff contains unrelated dependencies',
      'block if proof reads files or network resources',
    ],
    reviewedReadyForFutureApproval: true,
    passed: true,
  }
}

function buildPolarsInstallStrategy(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.polarsInstallStrategy.v1',
    generatedAt,
    toolName: 'Polars',
    normalizedId: 'polars',
    owner: 'TRACK_B_MEDIA_PROCESSING',
    currentBatch1Status: 'blocked_missing_dependency_or_module',
    selectedFuturePackageCandidate: 'nodejs-polars',
    candidateRuntime: 'node_server_only',
    installClass: 'npm_package',
    packageLockMutationExpectedInFutureApproval: true,
    packageLockMutationAllowedInThisReview: false,
    dependencyInstallAllowedInThisReview: false,
    futureProofScope:
      'import/version plus tiny in-memory synthetic dataframe metadata proof after separate package-and-binary approval only',
    prohibitedUses: [
      'real dataframe processing from user media',
      'filesystem scan of private uploads',
      'worker route execution',
      'Supabase writes',
      'public artifacts',
      'production use',
    ],
    failClosedRules: [
      'block if package selection changes without review',
      'block if package-lock diff contains unrelated dependencies',
      'block if proof reads files or network resources',
    ],
    reviewedReadyForFutureApproval: true,
    passed: true,
  }
}

function buildFfmpegFfprobeInstallStrategy(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.ffmpegFfprobeInstallStrategy.v1',
    generatedAt,
    tools: [
      {
        toolName: 'FFmpeg',
        normalizedId: 'ffmpeg',
        currentBatch1Status: 'blocked_missing_system_binary',
        futureBinaryName: 'ffmpeg',
      },
      {
        toolName: 'FFprobe',
        normalizedId: 'ffprobe',
        currentBatch1Status: 'blocked_missing_system_binary',
        futureBinaryName: 'ffprobe',
      },
    ],
    ownerHandoff: ['TRACK_A_RENDER_EXPORT', 'SOUND_MUSIC_AUDIO', 'WORKER_RUNTIME_JOBS'],
    installClass: 'system_binary_or_worker_container_layer',
    npmWrapperSelected: false,
    packageLockMutationExpectedInFutureApproval: false,
    systemBinaryInstallAllowedInThisReview: false,
    containerImageMutationAllowedInThisReview: false,
    futureProofScope: 'version probes only after separate system-binary/container approval; no media input or output',
    licensePolicy: 'LGPL-safe FFmpeg configuration review required before production use',
    prohibitedUses: [
      'media decode',
      'media encode',
      'media probe of user files',
      'audio processing',
      'render/export',
      'worker execution',
      'production use',
    ],
    failClosedRules: [
      'block if binaries are absent in the approved runtime',
      'block if GPL/nonfree build flags are unreviewed',
      'block if proof touches media files',
    ],
    ffmpegReviewedReadyForFutureApproval: true,
    ffprobeReviewedReadyForFutureApproval: true,
    passed: true,
  }
}

function buildPackageLockDependencyPolicy(generatedAt: string) {
  const packageJson = readJson('package.json')
  const packageLockStatus = runOptional('git', ['status', '--short', '--', 'package-lock.json']) ?? ''
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.packageLockDependencyPolicy.v1',
    generatedAt,
    packageLockGitStatus: packageLockStatus.trim(),
    packageLockUnchangedInThisReview: packageLockStatus.trim() === '',
    dependencySectionsContainSelectedFuturePackagesNow: candidateDependencyPresence(packageJson),
    dependencySectionsMutatedInThisReview: false,
    newDependencyAdditionsAllowedInThisReview: false,
    futureDuckdbPackageLockMutationRequiresSeparateApproval: true,
    futurePolarsPackageLockMutationRequiresSeparateApproval: true,
    futureFfmpegFfprobePackageLockMutationExpected: false,
    packageLockReviewRules: [
      'future package approval must show a lockfile diff limited to selected package metadata and transitive dependencies',
      'package.json dependency sections may change only in the separate package approval phase',
      'system binary approval must not add npm wrappers by default',
    ],
    passed: packageLockStatus.trim() === '',
  }
}

function buildSystemBinaryContainerPolicy(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.systemBinaryContainerPolicy.v1',
    generatedAt,
    systemBinaryTargets: ['ffmpeg', 'ffprobe'],
    installAllowedInThisReview: false,
    dockerfileMutationAllowedInThisReview: false,
    cloudBuildOrCloudRunMutationAllowedInThisReview: false,
    futureOwnerApprovalRequired: true,
    futureApprovalMustDefine: [
      'runtime image or local binary source',
      'LGPL/GPL/nonfree build flag review',
      'version probe command',
      'no-media proof boundary',
      'worker handoff and rollback owner',
    ],
    packageLockMutationExpected: false,
    passed: true,
  }
}

function buildSyntheticProofPlan(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalInstallReview.syntheticProofPlan.v1',
    generatedAt,
    proofExecutionAllowedInThisReview: false,
    futureProofs: [
      {
        targetId: 'duckdb_metadata_query_proof',
        futureProof: 'Node import/version plus in-memory SELECT 1 metadata query',
        inputClass: 'synthetic_in_memory_metadata_only',
        filesRead: false,
        mediaTouched: false,
      },
      {
        targetId: 'polars_metadata_dataframe_proof',
        futureProof: 'Node import/version plus in-memory dataframe construction and row-count metadata',
        inputClass: 'synthetic_in_memory_metadata_only',
        filesRead: false,
        mediaTouched: false,
      },
      {
        targetId: 'ffmpeg_version_probe',
        futureProof: 'ffmpeg -version only in an approved runtime',
        inputClass: 'no_input_version_metadata_only',
        filesRead: false,
        mediaTouched: false,
      },
      {
        targetId: 'ffprobe_version_probe',
        futureProof: 'ffprobe -version only in an approved runtime',
        inputClass: 'no_input_version_metadata_only',
        filesRead: false,
        mediaTouched: false,
      },
    ],
    failClosedRequirements: [
      'stop if any proof asks to install dependencies',
      'stop if any proof reads user files or media',
      'stop if any proof creates public artifacts or signed URLs',
      'stop if package-lock changes outside the approved phase',
    ],
    executionFlagsRemainFalse: true,
    passed: true,
  }
}

function buildBlockers(reviews: Record<string, JsonObject>) {
  const blockers: string[] = []
  if (reviews.evidenceRevalidationReport?.passed !== true) blockers.push('blocked_pending_container_or_worker_handoff')
  if (reviews.duckdbInstallStrategy?.passed !== true) blockers.push('blocked_pending_duckdb_package_selection')
  if (reviews.polarsInstallStrategy?.passed !== true) blockers.push('blocked_pending_polars_package_selection')
  if (reviews.ffmpegFfprobeInstallStrategy?.ffmpegReviewedReadyForFutureApproval !== true) {
    blockers.push('blocked_pending_ffmpeg_binary_strategy')
  }
  if (reviews.ffmpegFfprobeInstallStrategy?.ffprobeReviewedReadyForFutureApproval !== true) {
    blockers.push('blocked_pending_ffprobe_binary_strategy')
  }
  if (reviews.packageLockDependencyPolicy?.passed !== true) blockers.push('blocked_pending_package_lock_policy')
  if (reviews.systemBinaryContainerPolicy?.passed !== true || reviews.syntheticProofPlan?.passed !== true) {
    blockers.push('blocked_pending_container_or_worker_handoff')
  }
  if (hasRuntimeSafetyRisk(reviews)) blockers.unshift('rejected_due_runtime_safety_risk')
  return [...new Set(blockers)]
}

function chooseDecision(blockers: string[]): MissingOptionalInstallReviewDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('blocked_pending_duckdb_package_selection')) return 'blocked_pending_duckdb_package_selection'
  if (blockers.includes('blocked_pending_polars_package_selection')) return 'blocked_pending_polars_package_selection'
  if (blockers.includes('blocked_pending_ffmpeg_binary_strategy')) return 'blocked_pending_ffmpeg_binary_strategy'
  if (blockers.includes('blocked_pending_ffprobe_binary_strategy')) return 'blocked_pending_ffprobe_binary_strategy'
  if (blockers.includes('blocked_pending_package_lock_policy')) return 'blocked_pending_package_lock_policy'
  if (blockers.includes('blocked_pending_container_or_worker_handoff')) return 'blocked_pending_container_or_worker_handoff'
  return expectedDecision
}

function hasRuntimeSafetyRisk(reviews: Record<string, JsonObject>) {
  const serialized = JSON.stringify(reviews)
  return [
    /"dependencyInstallAllowedInThisReview"\s*:\s*true/i,
    /"packageLockMutationAllowedInThisReview"\s*:\s*true/i,
    /"systemBinaryInstallAllowedInThisReview"\s*:\s*true/i,
    /"containerImageMutationAllowedInThisReview"\s*:\s*true/i,
    /"proofExecutionAllowedInThisReview"\s*:\s*true/i,
  ].some((pattern) => pattern.test(serialized))
}

function blockedFlags(): Record<string, false> {
  return {
    dependencyInstallAllowed: false,
    packageLockMutationAllowed: false,
    newToolDependencyAdditionAllowed: false,
    systemBinaryInstallAllowed: false,
    containerImageMutationAllowed: false,
    importSmokeAllowed: false,
    versionProbeAllowed: false,
    fixtureProofAllowed: false,
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

function candidateDependencyPresence(packageJson: JsonObject) {
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies']
  const candidates = ['duckdb', 'nodejs-polars', 'ffmpeg', 'ffprobe', 'fluent-ffmpeg', '@ffmpeg/ffmpeg']
  return Object.fromEntries(
    candidates.map((candidate) => [
      candidate,
      sections
        .map((section) => ({ section, version: packageSection(packageJson, section)[candidate] ?? null }))
        .filter((entry) => entry.version !== null),
    ])
  )
}

function packageSection(packageJson: JsonObject, section: string): Record<string, unknown> {
  const value = packageJson[section]
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function hashFile(filePath: string) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function readJson(filePath: string): JsonObject {
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonObject
}

function readMaybeJsonOrText(filePath: string) {
  const text = readFileSync(filePath, 'utf8')
  try {
    return JSON.parse(text) as JsonObject
  } catch {
    return { text }
  }
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

function evidenceMarkdown(report: JsonObject) {
  return `# Evidence Revalidation Report

- QA decision: \`${report.qaDecision}\`
- Execution decision: \`${report.executionDecision}\`
- Batch 1 QA prompted install review: \`${report.batch1QaInstallReviewPrompted}\`
- Passed Batch 1 targets still accepted: \`${report.passedBatch1TargetsStillAccepted}\`
- Package-lock QA passed: \`${report.packageLockQaPassed}\`
- Review passed: \`${report.passed}\`
`
}

function toolStrategyMarkdown(title: string, strategy: JsonObject) {
  return `# ${title}

- Tool: \`${strategy.toolName}\`
- Candidate package: \`${strategy.selectedFuturePackageCandidate}\`
- Current Batch 1 status: \`${strategy.currentBatch1Status}\`
- Install class: \`${strategy.installClass}\`
- Future proof scope: ${strategy.futureProofScope}
- Dependency install allowed in this review: \`${strategy.dependencyInstallAllowedInThisReview}\`
- Package-lock mutation allowed in this review: \`${strategy.packageLockMutationAllowedInThisReview}\`
- Reviewed ready for future approval: \`${strategy.reviewedReadyForFutureApproval}\`
`
}

function ffmpegFfprobeStrategyMarkdown(strategy: JsonObject) {
  const tools = Array.isArray(strategy.tools) ? strategy.tools : []
  return `# FFmpeg / FFprobe Install Strategy

${tools.map((tool) => `- \`${tool.toolName}\`: \`${tool.currentBatch1Status}\`, future binary \`${tool.futureBinaryName}\``).join('\n')}

- Install class: \`${strategy.installClass}\`
- NPM wrapper selected: \`${strategy.npmWrapperSelected}\`
- Package-lock mutation expected in future approval: \`${strategy.packageLockMutationExpectedInFutureApproval}\`
- Future proof scope: ${strategy.futureProofScope}
- License policy: ${strategy.licensePolicy}
`
}

function packageLockPolicyMarkdown(policy: JsonObject) {
  return `# Package-Lock Dependency Policy

- Package-lock unchanged in this review: \`${policy.packageLockUnchangedInThisReview}\`
- Dependency sections mutated in this review: \`${policy.dependencySectionsMutatedInThisReview}\`
- New dependency additions allowed in this review: \`${policy.newDependencyAdditionsAllowedInThisReview}\`
- Future DuckDB package-lock mutation requires separate approval: \`${policy.futureDuckdbPackageLockMutationRequiresSeparateApproval}\`
- Future Polars package-lock mutation requires separate approval: \`${policy.futurePolarsPackageLockMutationRequiresSeparateApproval}\`
- Future FFmpeg/FFprobe package-lock mutation expected: \`${policy.futureFfmpegFfprobePackageLockMutationExpected}\`
`
}

function systemBinaryPolicyMarkdown(policy: JsonObject) {
  return `# System Binary / Container Policy

- Targets: \`${Array.isArray(policy.systemBinaryTargets) ? policy.systemBinaryTargets.join(', ') : ''}\`
- Install allowed in this review: \`${policy.installAllowedInThisReview}\`
- Dockerfile mutation allowed in this review: \`${policy.dockerfileMutationAllowedInThisReview}\`
- Cloud Build or Cloud Run mutation allowed in this review: \`${policy.cloudBuildOrCloudRunMutationAllowedInThisReview}\`
- Future owner approval required: \`${policy.futureOwnerApprovalRequired}\`
`
}

function syntheticProofPlanMarkdown(plan: JsonObject) {
  const proofs = Array.isArray(plan.futureProofs) ? plan.futureProofs : []
  return `# Synthetic Proof Plan

Proof execution allowed in this review: \`${plan.proofExecutionAllowedInThisReview}\`

${proofs.map((proof) => `- \`${proof.targetId}\`: ${proof.futureProof}`).join('\n')}

All proofs remain future and separately approved.
`
}

function decisionMarkdown(decision: JsonObject) {
  return `# Missing Optional Install Review Decision

Decision: \`${decision.decision}\`

DuckDB and Polars are reviewed as future npm package candidates. FFmpeg and FFprobe are reviewed as future system/container binary candidates. This review does not install dependencies, mutate package-lock, run probes, execute proofs, or unlock runtime/product scopes.

Next prompt: \`${decision.nextPrompt}\`
`
}

function validationResultsMarkdown(reports: MissingOptionalInstallReviewReportSet) {
  return `# Missing Optional Install Review Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: \`${reports.readinessReport.readiness}\`
- DuckDB package candidate: \`${reports.duckdbInstallStrategy.selectedFuturePackageCandidate}\`
- Polars package candidate: \`${reports.polarsInstallStrategy.selectedFuturePackageCandidate}\`
- FFmpeg/FFprobe strategy passed: \`${reports.ffmpegFfprobeInstallStrategy.passed}\`
- Package-lock unchanged: \`${reports.packageLockDependencyPolicy.packageLockUnchangedInThisReview}\`
- Blockers: \`${Array.isArray(reports.blockerReport.blockers) && reports.blockerReport.blockers.length ? reports.blockerReport.blockers.join(', ') : 'none'}\`
`
}

function nextPromptMarkdown(reports: MissingOptionalInstallReviewReportSet) {
  return `# OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL

Approve a future package/binary phase for DuckDB, Polars, FFmpeg, and FFprobe only if the source-of-truth review remains at decision \`${reports.decision.decision}\`.

Allowed future scope to request separately:

- DuckDB package approval for \`duckdb\` with a narrowly reviewed package-lock diff.
- Polars package approval for \`nodejs-polars\` with a narrowly reviewed package-lock diff.
- FFmpeg/FFprobe system binary or worker-container approval with LGPL-safe build metadata and version-probe-only validation.

This prompt does not authorize installation, package-lock mutation, system binary installation, container mutation, import smoke, version probes, fixture proofs, media processing, workers, routes, providers, Supabase/GCS mutation, public artifacts, signed URLs, raw prompts, beta, or production.
`
}

function updateOpenSourceDocs(reports: MissingOptionalInstallReviewReportSet) {
  upsertBlock(
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'OPEN_SOURCE_MISSING_OPTIONAL_INSTALL_REVIEW_STATUS',
    openSourceStatusBlock(reports)
  )
  upsertBlock(
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'OPEN_SOURCE_MISSING_OPTIONAL_INSTALL_REVIEW_STATUS',
    openSourceStatusBlock(reports)
  )
}

function updateCrossChatDocs(reports: MissingOptionalInstallReviewReportSet) {
  for (const filePath of [
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
    'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
  ]) {
    upsertBlock(filePath, 'OPEN_SOURCE_MISSING_OPTIONAL_INSTALL_REVIEW_STATUS', openSourceStatusBlock(reports))
  }
}

function openSourceStatusBlock(reports: MissingOptionalInstallReviewReportSet) {
  return `OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW:

- Decision: \`${reports.decision.decision}\`.
- DuckDB future package candidate: \`duckdb\`; not installed or proven here.
- Polars future package candidate: \`nodejs-polars\`; not installed or proven here.
- FFmpeg/FFprobe future strategy: system or worker-container binaries only; no npm wrapper and no media probing here.
- Next prompt: \`${reports.decision.nextPrompt}\`.
- Real installs, package-lock mutation, import smoke, version probes, tool/route/worker/provider execution, media/audio/render/image/browser/map work, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.`
}

function upsertBlock(filePath: string, marker: string, body: string) {
  if (!existsSync(filePath)) return
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const block = `${start}\n${body}\n${end}`
  const current = readFileSync(filePath, 'utf8')
  if (current.includes(start) && current.includes(end)) {
    writeText(filePath, current.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`), block))
    return
  }
  writeText(filePath, `${current.trimEnd()}\n\n${block}\n`)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
