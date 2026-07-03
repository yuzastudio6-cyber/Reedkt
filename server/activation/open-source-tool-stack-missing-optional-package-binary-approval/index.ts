import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  MissingOptionalPackageBinaryApprovalDecision,
  MissingOptionalPackageBinaryApprovalReportSet,
} from './missing-optional-package-binary-approval-types'

type JsonObject = Record<string, unknown>

export const MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR =
  'docs/open-source-tool-stack/missing-optional-package-binary-approval'
export const MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_BRANCH =
  'codex/rp-open-source-tool-stack-missing-optional-package-binary-approval'
export const MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_SOURCE_SHA =
  '5b68a207144df9b6498f13f282582d5bcf2c65b7'

const expectedDecision = 'missing_optional_package_and_binary_approval_passed_ready_for_execution'
const expectedInstallReviewDecision = 'missing_optional_install_review_passed_ready_for_package_and_binary_approval'
const expectedQaDecision =
  'open_source_tool_stack_batch_1_qa_passed_with_missing_optional_tools_ready_for_missing_optional_install_review'
const expectedExecutionDecision = 'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools'
const expectedRerunDecision = 'approved_for_future_open_source_tool_stack_batch_1_install_proof_execution'
const expectedDependencyBaselineDecision = 'dependency_baseline_repair_passed_ready_for_batch_1_approval_rerun'
const nextPrompt = 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION'
const futurePackageCommand = 'npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund'

const sourceEvidencePaths = {
  missingInstallDecision: 'docs/open-source-tool-stack/missing-optional-install-review/missing-optional-install-review-decision.json',
  missingInstallEvidence: 'docs/open-source-tool-stack/missing-optional-install-review/evidence-revalidation-report.json',
  missingInstallDuckdb: 'docs/open-source-tool-stack/missing-optional-install-review/duckdb-install-strategy.json',
  missingInstallPolars: 'docs/open-source-tool-stack/missing-optional-install-review/polars-install-strategy.json',
  missingInstallFfmpeg: 'docs/open-source-tool-stack/missing-optional-install-review/ffmpeg-ffprobe-install-strategy.json',
  missingInstallPackageLock: 'docs/open-source-tool-stack/missing-optional-install-review/package-lock-dependency-policy.json',
  missingInstallSystemBinary: 'docs/open-source-tool-stack/missing-optional-install-review/system-binary-container-policy.json',
  qaDecision: 'docs/open-source-tool-stack/batch-1-qa-review/batch-1-qa-review-decision.json',
  executionDecision: 'docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json',
  rerunDecision: 'docs/open-source-tool-stack/batch-1-rerun/batch-1-rerun-approval-decision.json',
  dependencyBaselineDecision:
    'docs/open-source-tool-stack/dependency-baseline-repair/dependency-baseline-repair-decision.json',
  auditDecision: 'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
}

const reportPaths = {
  sourceAudit: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/source-of-truth-audit.json`,
  evidenceRevalidationReport: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/evidence-revalidation-report.json`,
  evidenceRevalidationReportMd: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/evidence-revalidation-report.md`,
  duckdbPackageApproval: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/duckdb-package-approval.json`,
  duckdbPackageApprovalMd: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/duckdb-package-approval.md`,
  polarsPackageApproval: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/polars-package-approval.json`,
  polarsPackageApprovalMd: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/polars-package-approval.md`,
  ffmpegFfprobeBinaryApproval: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/ffmpeg-ffprobe-binary-approval.json`,
  ffmpegFfprobeBinaryApprovalMd: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/ffmpeg-ffprobe-binary-approval.md`,
  packageLockPolicy: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/package-lock-policy.json`,
  packageLockPolicyMd: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/package-lock-policy.md`,
  systemBinaryWorkerContainerPolicy: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/system-binary-worker-container-policy.json`,
  systemBinaryWorkerContainerPolicyMd: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/system-binary-worker-container-policy.md`,
  futureExecutionScope: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/future-execution-scope.json`,
  futureExecutionScopeMd: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/future-execution-scope.md`,
  decision: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/package-binary-approval-decision.json`,
  decisionMd: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/package-binary-approval-decision.md`,
  readiness: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/package-binary-approval-readiness-report.json`,
  blockers: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/package-binary-approval-blocker-report.json`,
  privateArtifactManifest: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/package-binary-approval-private-artifact-manifest.json`,
  validationResults: `${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/package-binary-approval-validation-results.md`,
}

const docPaths = [
  'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-package-and-binary-execution.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
  'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
]

const predecessorPrs = [444, 439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL',
    'REEDITPRO_CONFIRM_MISSING_OPTIONAL_INSTALL_REVIEW_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_DUCKDB_PACKAGE_APPROVAL_REVIEW',
    'REEDITPRO_CONFIRM_POLARS_PACKAGE_APPROVAL_REVIEW',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_BINARY_APPROVAL_REVIEW',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_SYSTEM_BINARY_STRATEGY_REVIEW',
    'REEDITPRO_CONFIRM_CONTAINER_WORKER_HANDOFF_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'PACKAGE_INSTALL_EXECUTION',
    'DEPENDENCY_INSTALL_EXECUTION',
    'PACKAGE_LOCK_MUTATION_EXECUTION',
    'SYSTEM_BINARY_INSTALL_EXECUTION',
    'CONTAINER_IMAGE_MUTATION',
    'DOCKER_MUTATION',
    'CLOUD_BUILD',
    'CLOUD_RUN',
    'IMPORT_SMOKE_EXECUTION',
    'VERSION_PROBE_EXECUTION',
    'FIXTURE_PROOF_EXECUTION',
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

export function buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL',
    branch: MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_BRANCH,
    baseBranch: MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_BASE_BRANCH,
    expectedSourceSha: MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_SOURCE_SHA,
    mode: 'approval_metadata_only_no_install_no_lock_mutation_no_proofs',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    packageCandidates: ['duckdb', 'nodejs-polars'],
    systemBinaryCandidates: ['ffmpeg', 'ffprobe'],
    futurePackageCommand,
    futureCheckOnlyBinaryCommands: [
      'command -v ffmpeg && ffmpeg -version',
      'command -v ffprobe && ffprobe -version',
    ],
    nextPrompt,
    reports: Object.values(reportPaths),
    docs: docPaths,
    forbiddenActions: [
      'package_install',
      'package_lock_mutation',
      'system_binary_install',
      'container_mutation',
      'tool_import_smoke',
      'version_probe',
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

export function buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports():
  MissingOptionalPackageBinaryApprovalReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const evidence = readSourceEvidence()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, flags, evidence)
  const evidenceRevalidationReport = buildEvidenceRevalidationReport(generatedAt, evidence, sourceOfTruthAudit)
  const duckdbPackageApproval = buildDuckdbPackageApproval(generatedAt)
  const polarsPackageApproval = buildPolarsPackageApproval(generatedAt)
  const ffmpegFfprobeBinaryApproval = buildFfmpegFfprobeBinaryApproval(generatedAt)
  const packageLockPolicy = buildPackageLockPolicy(generatedAt)
  const systemBinaryWorkerContainerPolicy = buildSystemBinaryWorkerContainerPolicy(generatedAt)
  const futureExecutionScope = buildFutureExecutionScope(generatedAt)
  const blockers = buildBlockers({
    evidenceRevalidationReport,
    duckdbPackageApproval,
    polarsPackageApproval,
    ffmpegFfprobeBinaryApproval,
    packageLockPolicy,
    systemBinaryWorkerContainerPolicy,
    futureExecutionScope,
  })
  const decisionValue = chooseDecision(blockers, {
    duckdbPackageApproval,
    polarsPackageApproval,
    ffmpegFfprobeBinaryApproval,
  })
  const readiness = decisionValue === expectedDecision

  const decision = {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    approvalComplete: readiness,
    packageCandidates: ['duckdb', 'nodejs-polars'],
    systemBinaryCandidates: ['ffmpeg', 'ffprobe'],
    futurePackageCommand,
    futureFfmpegCommand: 'command -v ffmpeg && ffmpeg -version',
    futureFfprobeCommand: 'command -v ffprobe && ffprobe -version',
    nextPrompt: readiness
      ? nextPrompt
      : 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL_BLOCKER_RESOLUTION',
    blockers,
    packageInstallAttempted: false,
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
    duckdbPackageApproval,
    polarsPackageApproval,
    ffmpegFfprobeBinaryApproval,
    packageLockPolicy,
    systemBinaryWorkerContainerPolicy,
    futureExecutionScope,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.readinessReport.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      packageApprovalReady: decisionValue === expectedDecision || decisionValue === 'missing_optional_package_only_approval_passed_ready_for_execution',
      systemBinaryApprovalReady:
        decisionValue === expectedDecision || decisionValue === 'missing_optional_system_binary_approval_passed_ready_for_execution',
      installOrProofAuthorizedHere: false,
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.blockerReport.v1',
      generatedAt,
      decision: decisionValue,
      blockers,
      blockerCount: blockers.length,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.privateArtifactManifest.v1',
      generatedAt,
      artifactScope: 'repo_committed_json_markdown_docs_only',
      reportDirectory: MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR,
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

export function writeOpenSourceToolStackMissingOptionalPackageBinaryApprovalArtifacts() {
  const reports = buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports()
  mkdirSync(MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.evidenceRevalidationReport, reports.evidenceRevalidationReport)
  writeText(reportPaths.evidenceRevalidationReportMd, evidenceMarkdown(reports.evidenceRevalidationReport))
  writeJson(reportPaths.duckdbPackageApproval, reports.duckdbPackageApproval)
  writeText(reportPaths.duckdbPackageApprovalMd, packageApprovalMarkdown('DuckDB Package Approval', reports.duckdbPackageApproval))
  writeJson(reportPaths.polarsPackageApproval, reports.polarsPackageApproval)
  writeText(reportPaths.polarsPackageApprovalMd, packageApprovalMarkdown('Polars Package Approval', reports.polarsPackageApproval))
  writeJson(reportPaths.ffmpegFfprobeBinaryApproval, reports.ffmpegFfprobeBinaryApproval)
  writeText(
    reportPaths.ffmpegFfprobeBinaryApprovalMd,
    binaryApprovalMarkdown(reports.ffmpegFfprobeBinaryApproval)
  )
  writeJson(reportPaths.packageLockPolicy, reports.packageLockPolicy)
  writeText(reportPaths.packageLockPolicyMd, packageLockPolicyMarkdown(reports.packageLockPolicy))
  writeJson(reportPaths.systemBinaryWorkerContainerPolicy, reports.systemBinaryWorkerContainerPolicy)
  writeText(
    reportPaths.systemBinaryWorkerContainerPolicyMd,
    systemBinaryWorkerContainerPolicyMarkdown(reports.systemBinaryWorkerContainerPolicy)
  )
  writeJson(reportPaths.futureExecutionScope, reports.futureExecutionScope)
  writeText(reportPaths.futureExecutionScopeMd, futureExecutionScopeMarkdown(reports.futureExecutionScope))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(
    'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-package-and-binary-execution.md',
    nextPromptMarkdown(reports)
  )
  updateOpenSourceDocs(reports)
  updateCrossChatDocs(reports)
  return reports
}

export function readOpenSourceToolStackMissingOptionalPackageBinaryApprovalArtifacts():
  | MissingOptionalPackageBinaryApprovalReportSet
  | undefined {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit),
    evidenceRevalidationReport: readJson(reportPaths.evidenceRevalidationReport),
    duckdbPackageApproval: readJson(reportPaths.duckdbPackageApproval),
    polarsPackageApproval: readJson(reportPaths.polarsPackageApproval),
    ffmpegFfprobeBinaryApproval: readJson(reportPaths.ffmpegFfprobeBinaryApproval),
    packageLockPolicy: readJson(reportPaths.packageLockPolicy),
    systemBinaryWorkerContainerPolicy: readJson(reportPaths.systemBinaryWorkerContainerPolicy),
    futureExecutionScope: readJson(reportPaths.futureExecutionScope),
    decision: readJson(reportPaths.decision),
    readinessReport: readJson(reportPaths.readiness),
    blockerReport: readJson(reportPaths.blockers),
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest),
  }
}

export function summarizeOpenSourceToolStackMissingOptionalPackageBinaryApproval(
  reports = buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports()
) {
  const blockers = Array.isArray(reports.blockerReport.blockers) ? reports.blockerReport.blockers : []
  return [
    `Open-source missing optional package/binary approval: ${String(reports.decision.decision)}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'true' : 'false'}`,
    `Future package command: ${futurePackageCommand}`,
    `System binary checks: ffmpeg -version, ffprobe -version`,
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
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.sourceOfTruthAudit.v1',
    generatedAt,
    branch: MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_BRANCH,
    baseBranch: MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_BASE_BRANCH,
    expectedSourceSha: MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_SOURCE_SHA,
    currentHead: runOptional('git', ['rev-parse', 'HEAD']),
    packageJsonSha256: hashFile('package.json'),
    packageLockSha256: hashFile('package-lock.json'),
    packageLockGitStatus: runOptional('git', ['status', '--short', '--', 'package-lock.json']) ?? '',
    packageJsonDependencySections: {
      dependencies: Object.keys(packageSection(packageJson, 'dependencies')).sort(),
      devDependencies: Object.keys(packageSection(packageJson, 'devDependencies')).sort(),
      optionalDependencies: Object.keys(packageSection(packageJson, 'optionalDependencies')).sort(),
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
    duplicateSearch: readGithubOpenPrSearch('missing optional package binary approval'),
    broadProductionDocsPresent: {
      betaReadinessScorecard: existsSync('docs/beta-readiness-scorecard.md'),
      productionBetaBlockerInventory: existsSync('docs/production-beta-blocker-inventory.md'),
      productionFoundationStatus: existsSync('PRODUCTION_FOUNDATION_STATUS.md'),
    },
    pr384Canonical: false,
    pr401Canonical: false,
    pr417Canonical: false,
    pr420Canonical: false,
    pr423Canonical: false,
    pr425Canonical: false,
    pr428Canonical: false,
    pr432Canonical: false,
    executionScope: flags,
    supabaseClassification: supabaseClassification(),
    evidenceSnapshot: {
      missingInstallDecision: evidence.missingInstallDecision?.decision ?? null,
      qaDecision: evidence.qaDecision?.decision ?? null,
      executionDecision: evidence.executionDecision?.decision ?? null,
      rerunDecision: evidence.rerunDecision?.decision ?? null,
      dependencyBaselineDecision: evidence.dependencyBaselineDecision?.decision ?? null,
    },
  }
}

function buildEvidenceRevalidationReport(
  generatedAt: string,
  evidence: Record<string, JsonObject | null>,
  sourceAudit: JsonObject
) {
  const predecessorPrEvidence = Array.isArray(sourceAudit.predecessorPrEvidence) ? sourceAudit.predecessorPrEvidence : []
  const predecessorPrsMerged = predecessorPrEvidence.every((entry: JsonObject) => {
    const metadata = typeof entry.metadata === 'object' && entry.metadata !== null ? (entry.metadata as JsonObject) : {}
    return metadata.state === 'MERGED' && typeof metadata.mergedAt === 'string' && metadata.mergedAt.length > 0
  })
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.evidenceRevalidationReport.v1',
    generatedAt,
    expectedSourceSha: MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_SOURCE_SHA,
    currentHead: sourceAudit.currentHead,
    sourceShaAccepted: sourceAudit.currentHead === MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_SOURCE_SHA,
    predecessorPrsMerged,
    missingInstallDecision: evidence.missingInstallDecision?.decision ?? null,
    expectedInstallReviewDecision,
    missingInstallDecisionAccepted: evidence.missingInstallDecision?.decision === expectedInstallReviewDecision,
    qaDecision: evidence.qaDecision?.decision ?? null,
    expectedQaDecision,
    qaDecisionAccepted: evidence.qaDecision?.decision === expectedQaDecision,
    executionDecision: evidence.executionDecision?.decision ?? null,
    expectedExecutionDecision,
    executionDecisionAccepted: evidence.executionDecision?.decision === expectedExecutionDecision,
    rerunDecision: evidence.rerunDecision?.decision ?? null,
    expectedRerunDecision,
    rerunDecisionAccepted: evidence.rerunDecision?.decision === expectedRerunDecision,
    dependencyBaselineDecision: evidence.dependencyBaselineDecision?.decision ?? null,
    expectedDependencyBaselineDecision,
    dependencyBaselineAccepted: evidence.dependencyBaselineDecision?.decision === expectedDependencyBaselineDecision,
    installReviewEvidencePassed: evidence.missingInstallEvidence?.passed === true,
    packageLockInstallReviewPassed: evidence.missingInstallPackageLock?.passed === true,
    systemBinaryInstallReviewPassed: evidence.missingInstallSystemBinary?.passed === true,
    duckdbCandidateAccepted: evidence.missingInstallDuckdb?.selectedFuturePackageCandidate === 'duckdb',
    polarsCandidateAccepted: evidence.missingInstallPolars?.selectedFuturePackageCandidate === 'nodejs-polars',
    ffmpegFfprobeStrategyAccepted:
      evidence.missingInstallFfmpeg?.npmWrapperSelected === false &&
      evidence.missingInstallFfmpeg?.ffmpegReviewedReadyForFutureApproval === true &&
      evidence.missingInstallFfmpeg?.ffprobeReviewedReadyForFutureApproval === true,
    priorMutationFlagsClean: [
      evidence.missingInstallDecision?.dependencyInstallAttempted,
      evidence.missingInstallDecision?.packageLockMutationAttempted,
      evidence.missingInstallDecision?.systemBinaryInstallAttempted,
      evidence.missingInstallDecision?.containerImageMutationAttempted,
      evidence.qaDecision?.dependencyInstallAttempted,
      evidence.qaDecision?.packageLockMutationAttempted,
      evidence.executionDecision?.dependencyInstallAttempted,
      evidence.executionDecision?.packageLockMutationAttempted,
    ].every((value) => value !== true),
    passed:
      predecessorPrsMerged &&
      evidence.missingInstallDecision?.decision === expectedInstallReviewDecision &&
      evidence.qaDecision?.decision === expectedQaDecision &&
      evidence.executionDecision?.decision === expectedExecutionDecision &&
      evidence.rerunDecision?.decision === expectedRerunDecision &&
      evidence.dependencyBaselineDecision?.decision === expectedDependencyBaselineDecision &&
      evidence.missingInstallEvidence?.passed === true &&
      evidence.missingInstallPackageLock?.passed === true &&
      evidence.missingInstallSystemBinary?.passed === true &&
      evidence.missingInstallDuckdb?.selectedFuturePackageCandidate === 'duckdb' &&
      evidence.missingInstallPolars?.selectedFuturePackageCandidate === 'nodejs-polars' &&
      evidence.missingInstallFfmpeg?.npmWrapperSelected === false,
  }
}

function buildDuckdbPackageApproval(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.duckdbPackageApproval.v1',
    generatedAt,
    toolName: 'DuckDB',
    normalizedId: 'duckdb',
    owner: 'TRACK_B_MEDIA_PROCESSING',
    selectedFuturePackageCandidate: 'duckdb',
    futurePackageCommand,
    currentPhasePackageInstallAttempted: false,
    currentPhasePackageLockMutationAttempted: false,
    currentPhaseImportOrProofAttempted: false,
    futureProofLimit:
      'import/version plus one tiny in-memory synthetic metadata query; no file, network, media, route, worker, or provider access',
    futureInstallRequiresSeparateExecutionApproval: true,
    allowedFutureDependencyMutation: ['package.json dependencies.duckdb', 'package-lock transitive metadata for duckdb only'],
    blockedFutureDiffs: ['unrelated package.json dependency changes', 'unrelated package-lock churn', 'media or worker artifacts'],
    failClosedRules: [
      'stop if the package name changes',
      'stop if install wants lifecycle scripts',
      'stop if lockfile changes include unrelated packages',
      'stop if the proof reads files, media, network, secrets, or user payloads',
    ],
    approvedForFutureExecutionPacket: true,
    passed: true,
  }
}

function buildPolarsPackageApproval(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.polarsPackageApproval.v1',
    generatedAt,
    toolName: 'Polars',
    normalizedId: 'polars',
    owner: 'TRACK_B_MEDIA_PROCESSING',
    selectedFuturePackageCandidate: 'nodejs-polars',
    futurePackageCommand,
    currentPhasePackageInstallAttempted: false,
    currentPhasePackageLockMutationAttempted: false,
    currentPhaseImportOrProofAttempted: false,
    futureProofLimit:
      'import/version plus one tiny in-memory synthetic dataframe metadata check; no file, network, media, route, worker, or provider access',
    futureInstallRequiresSeparateExecutionApproval: true,
    allowedFutureDependencyMutation: ['package.json dependencies.nodejs-polars', 'package-lock transitive metadata for nodejs-polars only'],
    blockedFutureDiffs: ['unrelated package.json dependency changes', 'unrelated package-lock churn', 'media or worker artifacts'],
    failClosedRules: [
      'stop if the package name changes',
      'stop if install wants lifecycle scripts',
      'stop if lockfile changes include unrelated packages',
      'stop if the proof reads files, media, network, secrets, or user payloads',
    ],
    approvedForFutureExecutionPacket: true,
    passed: true,
  }
}

function buildFfmpegFfprobeBinaryApproval(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.ffmpegFfprobeBinaryApproval.v1',
    generatedAt,
    tools: [
      {
        toolName: 'FFmpeg',
        normalizedId: 'ffmpeg',
        ownerHandoff: ['TRACK_A_RENDER_EXPORT', 'SOUND_MUSIC_AUDIO', 'WORKER_RUNTIME_JOBS'],
        futureCheckOnlyCommand: 'command -v ffmpeg && ffmpeg -version',
      },
      {
        toolName: 'FFprobe',
        normalizedId: 'ffprobe',
        ownerHandoff: ['TRACK_A_RENDER_EXPORT', 'SOUND_MUSIC_AUDIO', 'WORKER_RUNTIME_JOBS'],
        futureCheckOnlyCommand: 'command -v ffprobe && ffprobe -version',
      },
    ],
    npmWrapperSelected: false,
    repoPackageMutationPlanned: false,
    dockerOrContainerMutationPlannedInThisLane: false,
    currentPhaseSystemBinaryInstallAttempted: false,
    currentPhaseVersionProbeAttempted: false,
    futureProofLimit: 'command existence and version text only; no media input, decode, encode, probe, render, or export',
    absenceHandling:
      'future execution must fail closed if binaries are absent unless a separate worker/container owner approval supplies binaries',
    licensePolicy: 'LGPL/GPL/nonfree build metadata must be reviewed before any production FFmpeg/FFprobe use',
    approvedForFutureExecutionPacket: true,
    passed: true,
  }
}

function buildPackageLockPolicy(generatedAt: string) {
  const packageJson = readJson('package.json')
  const packageLockStatus = runOptional('git', ['status', '--short', '--', 'package-lock.json']) ?? ''
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.packageLockPolicy.v1',
    generatedAt,
    packageLockGitStatus: packageLockStatus.trim(),
    packageLockUnchangedInThisApproval: packageLockStatus.trim() === '',
    currentPhasePackageJsonDependencySectionsChanged: false,
    currentPhasePackageLockMutationAttempted: false,
    currentPhasePackageInstallAttempted: false,
    currentDependencyPresence: candidateDependencyPresence(packageJson),
    futureAllowedDependencyEntries: ['duckdb', 'nodejs-polars'],
    futureAllowedPackageLockMutation:
      'only duckdb and nodejs-polars direct dependency entries plus their package-lock transitive metadata',
    futureBlockedPackageLockMutation: [
      'FFmpeg npm wrappers',
      'FFprobe npm wrappers',
      'D3/ECharts/Vega/Vega-Lite additions',
      'unrelated open-source tool additions',
      'lockfile churn outside selected package transitive metadata',
    ],
    failClosedRules: [
      'block if package-lock changes in this approval packet',
      'block if package.json dependency sections change in this approval packet',
      'block future execution if any unrelated dependency or transitive lockfile churn appears',
    ],
    passed: packageLockStatus.trim() === '' && Object.values(candidateDependencyPresence(packageJson)).every((entry) => {
      return Array.isArray(entry) && entry.length === 0
    }),
  }
}

function buildSystemBinaryWorkerContainerPolicy(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.systemBinaryWorkerContainerPolicy.v1',
    generatedAt,
    targets: ['ffmpeg', 'ffprobe'],
    currentPhaseSystemBinaryInstallAttempted: false,
    currentPhaseDockerfileMutationAttempted: false,
    currentPhaseCloudBuildMutationAttempted: false,
    currentPhaseCloudRunMutationAttempted: false,
    approvedCurrentLane: 'check_only_commands_for_existing_binaries',
    workerContainerOwnerApprovalRequiredIfAbsent: true,
    futureOwnerApprovalMustDefine: [
      'binary source and runtime image boundary',
      'license flags and LGPL/GPL/nonfree review',
      'version-only proof commands',
      'no-media validation boundary',
      'rollback and cache policy',
    ],
    packageLockMutationExpected: false,
    passed: true,
  }
}

function buildFutureExecutionScope(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.futureExecutionScope.v1',
    generatedAt,
    approvedOnlyForFutureExecutionPacket: true,
    currentPhaseExecutionAllowed: false,
    packageTargets: [
      {
        targetId: 'duckdb_metadata_query_proof',
        packageName: 'duckdb',
        futureCommand: futurePackageCommand,
        futureProof: 'import/version and in-memory metadata query only',
      },
      {
        targetId: 'polars_metadata_dataframe_proof',
        packageName: 'nodejs-polars',
        futureCommand: futurePackageCommand,
        futureProof: 'import/version and in-memory dataframe metadata check only',
      },
    ],
    systemBinaryTargets: [
      {
        targetId: 'ffmpeg_version_probe',
        futureCommand: 'command -v ffmpeg && ffmpeg -version',
        absenceOutcome: 'blocked_missing_system_binary',
      },
      {
        targetId: 'ffprobe_version_probe',
        futureCommand: 'command -v ffprobe && ffprobe -version',
        absenceOutcome: 'blocked_missing_system_binary',
      },
    ],
    sideEffectGuards: blockedFlags(),
    failClosedCases: [
      'package command adds anything except duckdb/nodejs-polars and their transitive lock metadata',
      'package install requires scripts',
      'ffmpeg or ffprobe absent without worker/container owner approval',
      'proof reads media, private files, network resources, secrets, or user payloads',
      'any route, worker, provider, Supabase, GCS, public artifact, signed URL, raw prompt, beta, or production path appears',
    ],
    passed: true,
  }
}

function buildBlockers(reviews: Record<string, JsonObject>) {
  const blockers: string[] = []
  if (reviews.evidenceRevalidationReport?.passed !== true) blockers.push('blocked_pending_container_worker_policy')
  if (reviews.duckdbPackageApproval?.passed !== true) blockers.push('blocked_pending_duckdb_package_approval')
  if (reviews.polarsPackageApproval?.passed !== true) blockers.push('blocked_pending_polars_package_approval')
  if (reviews.ffmpegFfprobeBinaryApproval?.passed !== true) {
    blockers.push('blocked_pending_ffmpeg_binary_approval', 'blocked_pending_ffprobe_binary_approval')
  }
  if (reviews.packageLockPolicy?.passed !== true) blockers.push('blocked_pending_package_lock_policy')
  if (reviews.systemBinaryWorkerContainerPolicy?.passed !== true || reviews.futureExecutionScope?.passed !== true) {
    blockers.push('blocked_pending_container_worker_policy')
  }
  if (hasRuntimeSafetyRisk(reviews)) blockers.unshift('rejected_due_runtime_safety_risk')
  return [...new Set(blockers)]
}

function chooseDecision(
  blockers: string[],
  approvals: {
    duckdbPackageApproval: JsonObject
    polarsPackageApproval: JsonObject
    ffmpegFfprobeBinaryApproval: JsonObject
  }
): MissingOptionalPackageBinaryApprovalDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('blocked_pending_duckdb_package_approval')) return 'blocked_pending_duckdb_package_approval'
  if (blockers.includes('blocked_pending_polars_package_approval')) return 'blocked_pending_polars_package_approval'
  if (blockers.includes('blocked_pending_ffmpeg_binary_approval')) return 'blocked_pending_ffmpeg_binary_approval'
  if (blockers.includes('blocked_pending_ffprobe_binary_approval')) return 'blocked_pending_ffprobe_binary_approval'
  if (blockers.includes('blocked_pending_package_lock_policy')) return 'blocked_pending_package_lock_policy'
  if (blockers.includes('blocked_pending_container_worker_policy')) return 'blocked_pending_container_worker_policy'
  const packagesReady =
    approvals.duckdbPackageApproval.passed === true && approvals.polarsPackageApproval.passed === true
  const binariesReady = approvals.ffmpegFfprobeBinaryApproval.passed === true
  if (packagesReady && binariesReady) return expectedDecision
  if (packagesReady) return 'missing_optional_package_only_approval_passed_ready_for_execution'
  if (binariesReady) return 'missing_optional_system_binary_approval_passed_ready_for_execution'
  return 'blocked_pending_container_worker_policy'
}

function hasRuntimeSafetyRisk(reviews: Record<string, JsonObject>) {
  const serialized = JSON.stringify(reviews)
  return [
    /"currentPhasePackageInstallAttempted"\s*:\s*true/i,
    /"currentPhasePackageLockMutationAttempted"\s*:\s*true/i,
    /"currentPhaseSystemBinaryInstallAttempted"\s*:\s*true/i,
    /"currentPhaseVersionProbeAttempted"\s*:\s*true/i,
    /"currentPhaseImportOrProofAttempted"\s*:\s*true/i,
    /"currentPhaseExecutionAllowed"\s*:\s*true/i,
  ].some((pattern) => pattern.test(serialized))
}

function blockedFlags(): Record<string, false> {
  return {
    dependencyInstallAllowed: false,
    packageInstallAllowed: false,
    packageLockMutationAllowed: false,
    packageJsonDependencyMutationAllowed: false,
    newToolDependencyAdditionAllowed: false,
    systemBinaryInstallAllowed: false,
    containerImageMutationAllowed: false,
    dockerMutationAllowed: false,
    cloudBuildMutationAllowed: false,
    cloudRunMutationAllowed: false,
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

function readGithubOpenPrSearch(query: string) {
  const output = runOptional('gh', [
    'pr',
    'list',
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--state',
    'open',
    '--limit',
    '100',
    '--search',
    query,
    '--json',
    'number,title,state,isDraft,baseRefName,headRefName,url',
  ])
  if (!output) return { githubMetadataAvailable: false, query, results: [] }
  try {
    return { githubMetadataAvailable: true, query, results: JSON.parse(output) }
  } catch {
    return { githubMetadataAvailable: false, query, parseFailed: true, results: [] }
  }
}

function candidateDependencyPresence(packageJson: JsonObject) {
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies']
  const candidates = ['duckdb', 'nodejs-polars', 'ffmpeg', 'ffprobe', 'fluent-ffmpeg', '@ffmpeg/ffmpeg', '@ffmpeg/core']
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

- Current head: \`${report.currentHead}\`
- Source SHA accepted: \`${report.sourceShaAccepted}\`
- Predecessor PRs merged: \`${report.predecessorPrsMerged}\`
- Missing optional install review decision: \`${report.missingInstallDecision}\`
- Batch 1 QA decision: \`${report.qaDecision}\`
- Batch 1 execution decision: \`${report.executionDecision}\`
- Batch 1 rerun decision: \`${report.rerunDecision}\`
- Dependency baseline decision: \`${report.dependencyBaselineDecision}\`
- Review passed: \`${report.passed}\`
`
}

function packageApprovalMarkdown(title: string, approval: JsonObject) {
  return `# ${title}

- Tool: \`${approval.toolName}\`
- Package candidate: \`${approval.selectedFuturePackageCandidate}\`
- Future package command: \`${approval.futurePackageCommand}\`
- Current phase package install attempted: \`${approval.currentPhasePackageInstallAttempted}\`
- Current phase package-lock mutation attempted: \`${approval.currentPhasePackageLockMutationAttempted}\`
- Current phase import/proof attempted: \`${approval.currentPhaseImportOrProofAttempted}\`
- Future proof limit: ${approval.futureProofLimit}
- Approved for future execution packet: \`${approval.approvedForFutureExecutionPacket}\`
`
}

function binaryApprovalMarkdown(approval: JsonObject) {
  const tools = Array.isArray(approval.tools) ? approval.tools : []
  return `# FFmpeg / FFprobe Binary Approval

${tools.map((tool: JsonObject) => `- \`${tool.toolName}\`: future check-only command \`${tool.futureCheckOnlyCommand}\``).join('\n')}

- NPM wrapper selected: \`${approval.npmWrapperSelected}\`
- Repo package mutation planned: \`${approval.repoPackageMutationPlanned}\`
- Docker/container mutation planned in this lane: \`${approval.dockerOrContainerMutationPlannedInThisLane}\`
- Current phase system binary install attempted: \`${approval.currentPhaseSystemBinaryInstallAttempted}\`
- Current phase version probe attempted: \`${approval.currentPhaseVersionProbeAttempted}\`
- Absence handling: ${approval.absenceHandling}
`
}

function packageLockPolicyMarkdown(policy: JsonObject) {
  return `# Package-Lock Policy

- Package-lock unchanged in this approval: \`${policy.packageLockUnchangedInThisApproval}\`
- Current phase package.json dependency sections changed: \`${policy.currentPhasePackageJsonDependencySectionsChanged}\`
- Current phase package-lock mutation attempted: \`${policy.currentPhasePackageLockMutationAttempted}\`
- Current phase package install attempted: \`${policy.currentPhasePackageInstallAttempted}\`
- Future allowed dependency entries: \`${Array.isArray(policy.futureAllowedDependencyEntries) ? policy.futureAllowedDependencyEntries.join(', ') : ''}\`
- Future allowed package-lock mutation: ${policy.futureAllowedPackageLockMutation}
`
}

function systemBinaryWorkerContainerPolicyMarkdown(policy: JsonObject) {
  return `# System Binary / Worker Container Policy

- Targets: \`${Array.isArray(policy.targets) ? policy.targets.join(', ') : ''}\`
- Current phase system binary install attempted: \`${policy.currentPhaseSystemBinaryInstallAttempted}\`
- Current phase Dockerfile mutation attempted: \`${policy.currentPhaseDockerfileMutationAttempted}\`
- Current phase Cloud Build mutation attempted: \`${policy.currentPhaseCloudBuildMutationAttempted}\`
- Current phase Cloud Run mutation attempted: \`${policy.currentPhaseCloudRunMutationAttempted}\`
- Approved current lane: ${policy.approvedCurrentLane}
- Worker/container owner approval required if absent: \`${policy.workerContainerOwnerApprovalRequiredIfAbsent}\`
`
}

function futureExecutionScopeMarkdown(scope: JsonObject) {
  const packageTargets = Array.isArray(scope.packageTargets) ? scope.packageTargets : []
  const systemBinaryTargets = Array.isArray(scope.systemBinaryTargets) ? scope.systemBinaryTargets : []
  return `# Future Execution Scope

Current phase execution allowed: \`${scope.currentPhaseExecutionAllowed}\`

Package targets:

${packageTargets.map((target: JsonObject) => `- \`${target.targetId}\`: package \`${target.packageName}\`, future proof ${target.futureProof}`).join('\n')}

System binary targets:

${systemBinaryTargets.map((target: JsonObject) => `- \`${target.targetId}\`: \`${target.futureCommand}\`, absence outcome \`${target.absenceOutcome}\``).join('\n')}

Every target remains future and separately approved.
`
}

function decisionMarkdown(decision: JsonObject) {
  return `# Missing Optional Package/Binary Approval Decision

Decision: \`${decision.decision}\`

This packet approves a future controlled execution packet only. It does not install packages, mutate package-lock, run imports, run version probes, execute proofs, install system binaries, mutate containers, execute tools/routes/workers/providers/media/Supabase/GCS, create public artifacts or signed URLs, run raw prompts, merge PRs, or unlock beta/production.

Next prompt: \`${decision.nextPrompt}\`
`
}

function validationResultsMarkdown(reports: MissingOptionalPackageBinaryApprovalReportSet) {
  return `# Missing Optional Package/Binary Approval Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: \`${reports.readinessReport.readiness}\`
- DuckDB package candidate: \`${reports.duckdbPackageApproval.selectedFuturePackageCandidate}\`
- Polars package candidate: \`${reports.polarsPackageApproval.selectedFuturePackageCandidate}\`
- FFmpeg/FFprobe binary approval passed: \`${reports.ffmpegFfprobeBinaryApproval.passed}\`
- Package-lock unchanged: \`${reports.packageLockPolicy.packageLockUnchangedInThisApproval}\`
- Blockers: \`${Array.isArray(reports.blockerReport.blockers) && reports.blockerReport.blockers.length ? reports.blockerReport.blockers.join(', ') : 'none'}\`
`
}

function nextPromptMarkdown(reports: MissingOptionalPackageBinaryApprovalReportSet) {
  return `# OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION

Execute only the approved missing optional package/binary checks if the source-of-truth approval remains at decision \`${reports.decision.decision}\`.

Allowed future package command:

\`\`\`bash
${futurePackageCommand}
\`\`\`

Allowed future binary checks:

\`\`\`bash
command -v ffmpeg && ffmpeg -version
command -v ffprobe && ffprobe -version
\`\`\`

Future proof limits:

- DuckDB: import/version plus one tiny in-memory synthetic metadata query.
- Polars: import/version plus one tiny in-memory dataframe metadata check.
- FFmpeg/FFprobe: command existence plus version text only, with absence fail-closed unless a separate worker/container owner approval supplies binaries.

Do not run media processing, route execution, worker execution, provider calls, Supabase/SQL/GCS mutation, public artifacts, signed URLs, raw prompts, GitHub merges, beta, or production.
`
}

function updateOpenSourceDocs(reports: MissingOptionalPackageBinaryApprovalReportSet) {
  upsertBlock(
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_STATUS',
    openSourceStatusBlock(reports)
  )
  upsertBlock(
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_STATUS',
    openSourceStatusBlock(reports)
  )
}

function updateCrossChatDocs(reports: MissingOptionalPackageBinaryApprovalReportSet) {
  for (const filePath of [
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
    'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
  ]) {
    upsertBlock(filePath, 'OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_STATUS', openSourceStatusBlock(reports))
  }
}

function openSourceStatusBlock(reports: MissingOptionalPackageBinaryApprovalReportSet) {
  return `OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL:

- Decision: \`${reports.decision.decision}\`.
- DuckDB future package candidate: \`duckdb\`; not installed or proven here.
- Polars future package candidate: \`nodejs-polars\`; not installed or proven here.
- Future package command: \`${futurePackageCommand}\`.
- FFmpeg/FFprobe future path: existing-binary check-only commands, with absence fail-closed unless a separate worker/container owner approval supplies binaries.
- Next prompt: \`${reports.decision.nextPrompt}\`.
- Real installs, package-lock mutation, import smoke, version probes, fixture proofs, system binary installation, container mutation, tool/route/worker/provider execution, media/audio/render/image/browser/map work, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.`
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
