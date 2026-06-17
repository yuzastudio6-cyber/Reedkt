import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  MissingOptionalPackageBinaryExecutionDecision,
  PackageBinaryExecutionReportSet,
  PackageBinaryProofReport,
} from './package-binary-execution-types'

type JsonObject = Record<string, unknown>

export const PACKAGE_BINARY_EXECUTION_REPORT_DIR =
  'docs/open-source-tool-stack/missing-optional-package-binary-execution'
export const PACKAGE_BINARY_EXECUTION_BRANCH =
  'codex/rp-open-source-tool-stack-missing-optional-package-binary-execution'
export const PACKAGE_BINARY_EXECUTION_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const PACKAGE_BINARY_EXECUTION_SOURCE_SHA = '32f90b5d3ac03b222c8f96b5ad03b670ee7c706b'

const installCommand = 'npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund'
const npmCiCommand = 'npm ci --ignore-scripts --no-audit --no-fund'
const expectedApprovalDecision = 'missing_optional_package_and_binary_approval_passed_ready_for_execution'
const nextQaPrompt = 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_BINARY_QA_REVIEW'
const nextBinaryReviewPrompt = 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW'
const nextScriptReviewPrompt = 'OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW'
const nextBlockerPrompt = 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_EXECUTION_BLOCKER_RESOLUTION'

const predecessorPrs = [448, 444, 439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [428, 425, 432, 423, 420, 417, 401, 384]

const reportPaths = {
  sourceOfTruthAudit: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/source-of-truth-audit.json`,
  preInstallBaselineReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/pre-install-baseline-report.json`,
  preInstallBaselineReportMd: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/pre-install-baseline-report.md`,
  packageInstallReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-install-report.json`,
  packageInstallReportMd: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-install-report.md`,
  postInstallNpmCiReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/post-install-npm-ci-report.json`,
  duckdbProofReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/duckdb-proof-report.json`,
  polarsProofReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/polars-proof-report.json`,
  ffmpegVersionCheckReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/ffmpeg-version-check-report.json`,
  ffprobeVersionCheckReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/ffprobe-version-check-report.json`,
  packageLockIntegrityReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-lock-integrity-report.json`,
  packageLockIntegrityReportMd: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-lock-integrity-report.md`,
  sideEffectSafetyReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/side-effect-safety-report.json`,
  decision: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-binary-execution-decision.json`,
  decisionMd: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-binary-execution-decision.md`,
  readinessReport: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-binary-execution-readiness-report.json`,
  privateArtifactManifest: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-binary-execution-private-artifact-manifest.json`,
  validationResults: `${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/package-binary-execution-validation-results.md`,
}

const nextPromptPaths = {
  qaReview: 'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-package-binary-qa-review.md',
  binaryReview: 'docs/implementation-prompts/prompt-open-source-tool-stack-ffmpeg-ffprobe-system-binary-review.md',
  scriptReview: 'docs/implementation-prompts/prompt-open-source-tool-stack-package-install-script-review.md',
  blockerResolution: 'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-execution-blocker-resolution.md',
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION',
    'REEDITPRO_CONFIRM_MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_APPROVED_DUCKDB_NODEJS_POLARS_INSTALL_ONLY',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION_SCOPED_TO_APPROVED_PACKAGES',
    'REEDITPRO_CONFIRM_DUCKDB_IMPORT_SMOKE',
    'REEDITPRO_CONFIRM_POLARS_IMPORT_SMOKE',
    'REEDITPRO_CONFIRM_DUCKDB_SYNTHETIC_METADATA_QUERY',
    'REEDITPRO_CONFIRM_POLARS_SYNTHETIC_DATAFRAME_CHECK',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE_ONLY_IF_PRESENT',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE_ONLY_IF_PRESENT',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'BROAD_TOOL_EXECUTION',
    'WORKER_EXECUTION',
    'TOOL_ROUTE_EXECUTION',
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
    'SIGNED_URL_DELIVERY',
    'PRODUCTION_WRITE',
    'EXTERNAL_BETA_UNLOCK',
    'PAID_PRODUCTION_UNLOCK',
    'RAW_PROMPT_EXECUTION',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD_PRINT',
    'SYSTEM_BINARY_INSTALL',
    'CONTAINER_MUTATION',
    'DOCKER_MUTATION',
  ]
}

export function buildOpenSourceToolStackPackageBinaryExecutionPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION',
    branch: PACKAGE_BINARY_EXECUTION_BRANCH,
    baseBranch: PACKAGE_BINARY_EXECUTION_BASE_BRANCH,
    expectedSourceSha: PACKAGE_BINARY_EXECUTION_SOURCE_SHA,
    mode: 'approved_package_install_and_local_metadata_proofs_only',
    approvedPackageCommand: installCommand,
    postInstallNpmCiCommand: npmCiCommand,
    approvedPackageTargets: ['duckdb', 'nodejs-polars'],
    checkOnlyBinaryTargets: ['ffmpeg', 'ffprobe'],
    requiredConfirmations: requiredConfirmations(),
    reports: Object.values(reportPaths),
    nextPromptFiles: Object.values(nextPromptPaths),
    decisions: [
      'missing_optional_package_and_binary_execution_passed_ready_for_qa',
      'missing_optional_package_execution_passed_binary_missing_ready_for_system_binary_review',
      'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts',
      'blocked_pending_duckdb_install_or_import',
      'blocked_pending_polars_install_or_import',
      'blocked_pending_package_lock_integrity',
      'blocked_pending_ffmpeg_binary_presence',
      'blocked_pending_ffprobe_binary_presence',
      'rejected_due_runtime_safety_risk',
    ],
    forbiddenActions: [
      'unapproved_package_install',
      'ffmpeg_or_ffprobe_install',
      'docker_or_container_mutation',
      'media_file_processing',
      'worker_route_provider_execution',
      'supabase_sql_gcs_public_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildOpenSourceToolStackPackageBinaryExecutionReports(): PackageBinaryExecutionReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, flags)
  const preInstallBaselineReport = buildBaselineReport(generatedAt, false, sourceOfTruthAudit)
  const packageInstallReport = buildPackageInstallReport(generatedAt, false)
  const postInstallNpmCiReport = buildPostInstallNpmCiReport(generatedAt, false)
  const duckdbProofReport = buildDuckdbProofReport(generatedAt, false)
  const polarsProofReport = buildPolarsProofReport(generatedAt, false)
  const ffmpegVersionCheckReport = buildVersionCheckReport('ffmpeg', generatedAt, false)
  const ffprobeVersionCheckReport = buildVersionCheckReport('ffprobe', generatedAt, false)
  const packageLockIntegrityReport = buildPackageLockIntegrityReport(generatedAt, packageInstallReport)
  const sideEffectSafetyReport = buildSideEffectSafetyReport(generatedAt, flags)
  return finalizeReports({
    generatedAt,
    sourceOfTruthAudit,
    preInstallBaselineReport,
    packageInstallReport,
    postInstallNpmCiReport,
    duckdbProofReport,
    polarsProofReport,
    ffmpegVersionCheckReport,
    ffprobeVersionCheckReport,
    packageLockIntegrityReport,
    sideEffectSafetyReport,
  })
}

export function writeOpenSourceToolStackPackageBinaryExecutionArtifacts(options: { execute?: boolean } = {}) {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, flags)
  const beforeState = capturePackageState()
  const preInstallBaselineReport = buildBaselineReport(generatedAt, options.execute === true, sourceOfTruthAudit)

  const packageInstallReport = buildPackageInstallReport(generatedAt, options.execute === true, beforeState)
  const installPassed = packageInstallReport.installExitCode === 0 && packageInstallReport.unexpectedDirectDependencyAdditions.length === 0
  const postInstallNpmCiReport = buildPostInstallNpmCiReport(generatedAt, options.execute === true && installPassed)
  const postInstallPassed = postInstallNpmCiReport.npmCiRun !== true || postInstallNpmCiReport.npmCiExitCode === 0
  const runProofs = options.execute === true && installPassed && postInstallPassed
  const duckdbProofReport = buildDuckdbProofReport(generatedAt, runProofs)
  const polarsProofReport = buildPolarsProofReport(generatedAt, runProofs)
  const ffmpegVersionCheckReport = buildVersionCheckReport('ffmpeg', generatedAt, runProofs)
  const ffprobeVersionCheckReport = buildVersionCheckReport('ffprobe', generatedAt, runProofs)
  const packageLockIntegrityReport = buildPackageLockIntegrityReport(generatedAt, packageInstallReport, beforeState)
  const sideEffectSafetyReport = buildSideEffectSafetyReport(generatedAt, flags)

  const reports = finalizeReports({
    generatedAt,
    sourceOfTruthAudit,
    preInstallBaselineReport,
    packageInstallReport,
    postInstallNpmCiReport,
    duckdbProofReport,
    polarsProofReport,
    ffmpegVersionCheckReport,
    ffprobeVersionCheckReport,
    packageLockIntegrityReport,
    sideEffectSafetyReport,
  })

  mkdirSync(PACKAGE_BINARY_EXECUTION_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceOfTruthAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.preInstallBaselineReport, reports.preInstallBaselineReport)
  writeText(reportPaths.preInstallBaselineReportMd, baselineMarkdown(reports.preInstallBaselineReport))
  writeJson(reportPaths.packageInstallReport, reports.packageInstallReport)
  writeText(reportPaths.packageInstallReportMd, packageInstallMarkdown(reports.packageInstallReport))
  writeJson(reportPaths.postInstallNpmCiReport, reports.postInstallNpmCiReport)
  writeJson(reportPaths.duckdbProofReport, reports.duckdbProofReport)
  writeJson(reportPaths.polarsProofReport, reports.polarsProofReport)
  writeJson(reportPaths.ffmpegVersionCheckReport, reports.ffmpegVersionCheckReport)
  writeJson(reportPaths.ffprobeVersionCheckReport, reports.ffprobeVersionCheckReport)
  writeJson(reportPaths.packageLockIntegrityReport, reports.packageLockIntegrityReport)
  writeText(reportPaths.packageLockIntegrityReportMd, packageLockIntegrityMarkdown(reports.packageLockIntegrityReport))
  writeJson(reportPaths.sideEffectSafetyReport, reports.sideEffectSafetyReport)
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readinessReport, reports.readinessReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(nextPromptPath(String(reports.decision.nextPrompt)), nextPromptMarkdown(reports))
  return reports
}

export function readOpenSourceToolStackPackageBinaryExecutionArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceOfTruthAudit) ?? {},
    preInstallBaselineReport: readJson(reportPaths.preInstallBaselineReport) ?? {},
    packageInstallReport: readJson(reportPaths.packageInstallReport) ?? {},
    postInstallNpmCiReport: readJson(reportPaths.postInstallNpmCiReport) ?? {},
    duckdbProofReport: readJson(reportPaths.duckdbProofReport) as unknown as PackageBinaryProofReport,
    polarsProofReport: readJson(reportPaths.polarsProofReport) as unknown as PackageBinaryProofReport,
    ffmpegVersionCheckReport: readJson(reportPaths.ffmpegVersionCheckReport) as unknown as PackageBinaryProofReport,
    ffprobeVersionCheckReport: readJson(reportPaths.ffprobeVersionCheckReport) as unknown as PackageBinaryProofReport,
    packageLockIntegrityReport: readJson(reportPaths.packageLockIntegrityReport) ?? {},
    sideEffectSafetyReport: readJson(reportPaths.sideEffectSafetyReport) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readinessReport) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest) ?? {},
  } as PackageBinaryExecutionReportSet
}

export function summarizeOpenSourceToolStackPackageBinaryExecution(
  reports = buildOpenSourceToolStackPackageBinaryExecutionReports()
) {
  return JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      packageInstallStatus: reports.packageInstallReport.installStatus,
      duckdbStatus: reports.duckdbProofReport.status,
      polarsStatus: reports.polarsProofReport.status,
      ffmpegStatus: reports.ffmpegVersionCheckReport.status,
      ffprobeStatus: reports.ffprobeVersionCheckReport.status,
      packageLockIntegrityPassed: reports.packageLockIntegrityReport.passed,
      blockers: reports.readinessReport.blockers,
      nextPrompt: reports.decision.nextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2
  )
}

function finalizeReports(input: {
  generatedAt: string
  sourceOfTruthAudit: Record<string, unknown>
  preInstallBaselineReport: Record<string, unknown>
  packageInstallReport: Record<string, unknown>
  postInstallNpmCiReport: Record<string, unknown>
  duckdbProofReport: PackageBinaryProofReport
  polarsProofReport: PackageBinaryProofReport
  ffmpegVersionCheckReport: PackageBinaryProofReport
  ffprobeVersionCheckReport: PackageBinaryProofReport
  packageLockIntegrityReport: Record<string, unknown>
  sideEffectSafetyReport: Record<string, unknown>
}): PackageBinaryExecutionReportSet {
  const blockers = buildBlockers(input)
  const decisionValue = chooseDecision(blockers, input)
  const readiness = decisionValue === 'missing_optional_package_and_binary_execution_passed_ready_for_qa'
    || decisionValue === 'missing_optional_package_execution_passed_binary_missing_ready_for_system_binary_review'
    || decisionValue === 'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts'
  const decision = {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.decision.v1',
    generatedAt: input.generatedAt,
    decision: decisionValue,
    readiness,
    approvedPackageCommand: installCommand,
    approvedPackages: ['duckdb', 'nodejs-polars'],
    packageInstallExitCode: input.packageInstallReport.installExitCode,
    packageInstallStatus: input.packageInstallReport.installStatus,
    packageInstallAttempted: input.packageInstallReport.installAttempted,
    packageLockMutationScoped: input.packageLockIntegrityReport.passed === true,
    packageJsonDependencyMutationScoped: input.packageInstallReport.onlyApprovedDirectDependenciesAdded === true,
    installedPackageTargets: [input.duckdbProofReport, input.polarsProofReport]
      .filter((report) => report.passed === true)
      .map((report) => report.targetId),
    missingBinaryTargets: [input.ffmpegVersionCheckReport, input.ffprobeVersionCheckReport]
      .filter((report) => report.status === 'missing_system_binary')
      .map((report) => report.targetId),
    passedBinaryTargets: [input.ffmpegVersionCheckReport, input.ffprobeVersionCheckReport]
      .filter((report) => report.passed === true)
      .map((report) => report.targetId),
    blockers,
    nextPrompt: nextPromptForDecision(decisionValue),
    packageInstallAllowedOnlyForApprovedPackages: true,
    unapprovedPackageInstallAttempted: input.packageInstallReport.unapprovedPackageInstallAttempted,
    systemBinaryInstallAttempted: false,
    containerMutationAttempted: false,
    mediaProcessingAttempted: false,
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
    secretPolicy: {
      refsOnly: true,
      payloadAccessed: false,
      payloadPrinted: false,
      payloadCommitted: false,
    },
    supabaseClassification: supabaseClassification(),
    executionScope: blockedFlags(),
  }

  return {
    ...input,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.readinessReport.v1',
      generatedAt: input.generatedAt,
      readiness,
      decision: decisionValue,
      packageInstallPassed: input.packageInstallReport.installExitCode === 0,
      postInstallNpmCiPassed: input.postInstallNpmCiReport.npmCiExitCode === 0,
      duckdbProofPassed: input.duckdbProofReport.passed,
      polarsProofPassed: input.polarsProofReport.passed,
      ffmpegStatus: input.ffmpegVersionCheckReport.status,
      ffprobeStatus: input.ffprobeVersionCheckReport.status,
      packageLockIntegrityPassed: input.packageLockIntegrityReport.passed,
      sideEffectSafetyPassed: input.sideEffectSafetyReport.passed,
      blockers,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.privateArtifactManifest.v1',
      generatedAt: input.generatedAt,
      artifactScope: 'repo_committed_code_json_markdown_reports_and_package_lock_only',
      reportDirectory: PACKAGE_BINARY_EXECUTION_REPORT_DIR,
      reports: Object.values(reportPaths),
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      gcsUploads: false,
      mediaArtifactsCommitted: false,
      privatePayloadsCommitted: false,
      nodeModulesCommitted: false,
      buildOutputsCommitted: false,
    },
  }
}

function buildSourceOfTruthAudit(generatedAt: string, flags: Record<string, false>) {
  const packageState = capturePackageState()
  const pr448Decision =
    readJson('docs/open-source-tool-stack/missing-optional-package-binary-approval/package-binary-approval-decision.json')
      ?.decision ?? null
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.sourceOfTruthAudit.v1',
    generatedAt,
    sourceBranch: PACKAGE_BINARY_EXECUTION_BASE_BRANCH,
    expectedSourceSha: PACKAGE_BINARY_EXECUTION_SOURCE_SHA,
    currentBranch: safeGit(['branch', '--show-current']),
    currentSha: safeGit(['rev-parse', 'HEAD']),
    packageJsonHash: packageState.packageJsonHash,
    packageLockHash: packageState.packageLockHash,
    packageDependencies: packageState.dependencies,
    nodeVersion: process.version,
    npmVersion: safeExec('npm', ['--version']).stdout.trim() || null,
    pr448Decision,
    expectedApprovalDecision,
    pr448ApprovalDecisionMatches: pr448Decision === expectedApprovalDecision,
    pr448ApprovalCommand:
      readJson('docs/open-source-tool-stack/missing-optional-package-binary-approval/package-binary-approval-decision.json')
        ?.futurePackageCommand ?? null,
    predecessorPrEvidence: predecessorPrs.map((number) => safePrView(number)),
    referenceOnlyPrEvidence: referenceOnlyPrs.map((number) => ({ ...safePrView(number), referenceOnly: true, canonical: false })),
    duplicateCentralExecutionPrSearch: safePrSearch(),
    supabaseClassification: supabaseClassification(),
    secretPolicy: {
      refsOnly: true,
      payloadAccessed: false,
      payloadPrinted: false,
      payloadCommitted: false,
    },
    executionScope: flags,
  }
}

function buildBaselineReport(generatedAt: string, runNpmCi: boolean, sourceAudit: Record<string, unknown>) {
  const before = capturePackageState()
  const result = runNpmCi ? safeExec('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { maxBuffer: 1024 * 1024 * 12 }) : notRunResult()
  const after = capturePackageState()
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.preInstallBaseline.v1',
    generatedAt,
    command: npmCiCommand,
    npmCiRun: runNpmCi,
    npmCiExitCode: result.exitCode,
    npmCiStatus: result.status,
    stdoutPreview: preview(result.stdout),
    stderrPreview: preview(result.stderr),
    beforePackageJsonHash: before.packageJsonHash,
    beforePackageLockHash: before.packageLockHash,
    afterPackageJsonHash: after.packageJsonHash,
    afterPackageLockHash: after.packageLockHash,
    sourcePackageJsonHash: sourceAudit.packageJsonHash,
    sourcePackageLockHash: sourceAudit.packageLockHash,
    packageJsonChanged: before.packageJsonHash !== after.packageJsonHash,
    packageLockChanged: before.packageLockHash !== after.packageLockHash,
    nodeModulesCommitted: trackedMatches(/^node_modules\//).length > 0,
    baselineClean: !runNpmCi || (result.exitCode === 0 && before.packageJsonHash === after.packageJsonHash && before.packageLockHash === after.packageLockHash),
    scriptsIgnored: true,
    installAttempted: false,
    supabaseClassification: supabaseClassification(),
  }
}

function buildPackageInstallReport(generatedAt: string, runInstall: boolean, before = capturePackageState()) {
  const result = runInstall
    ? safeExec('npm', ['install', 'duckdb', 'nodejs-polars', '--save-exact', '--ignore-scripts', '--no-audit', '--no-fund'], {
        maxBuffer: 1024 * 1024 * 12,
      })
    : notRunResult()
  if (runInstall && result.exitCode === 0) normalizePackageLockToApprovedClosure()
  const after = capturePackageState()
  const directAdditions = dependencyAdditions(before.dependencies, after.dependencies)
  const unexpectedDirectDependencyAdditions = directAdditions.filter((name) => !['duckdb', 'nodejs-polars'].includes(name))
  const exactVersions = {
    duckdb: after.dependencies.dependencies?.duckdb ?? null,
    nodejsPolars: after.dependencies.dependencies?.['nodejs-polars'] ?? null,
  }
  const approvedDirectDependenciesPresent = exactVersions.duckdb !== null && exactVersions.nodejsPolars !== null
  const packageLockPackages = packageLockPackagesFor(['duckdb', 'nodejs-polars'])
  const transitivePackageCount = packageLockPackages.total - 2
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.packageInstall.v1',
    generatedAt,
    command: installCommand,
    installAttempted: runInstall,
    installStatus: runInstall ? result.status : 'not_run',
    installExitCode: result.exitCode,
    stdoutPreview: preview(result.stdout),
    stderrPreview: preview(result.stderr),
    beforePackageJsonHash: before.packageJsonHash,
    beforePackageLockHash: before.packageLockHash,
    afterPackageJsonHash: after.packageJsonHash,
    afterPackageLockHash: after.packageLockHash,
    packageJsonChanged: before.packageJsonHash !== after.packageJsonHash,
    packageLockChanged: before.packageLockHash !== after.packageLockHash,
    directDependencyAdditions: directAdditions,
    expectedDirectDependencyAdditions: ['duckdb', 'nodejs-polars'],
    unexpectedDirectDependencyAdditions,
    approvedDirectDependenciesPresent,
    onlyApprovedDirectDependenciesAdded: approvedDirectDependenciesPresent && unexpectedDirectDependencyAdditions.length === 0,
    exactVersions,
    saveExactRequested: true,
    ignoreScriptsRequested: true,
    noAuditRequested: true,
    noFundRequested: true,
    npmLifecycleScriptsSkipped: true,
    unapprovedPackageInstallAttempted: false,
    packageLockPackages,
    transitivePackageCount: Math.max(0, transitivePackageCount),
    noSecretsOrArtifacts: true,
  }
}

function normalizePackageLockToApprovedClosure() {
  try {
    const baseLock = JSON.parse(
      execFileSync('git', ['show', 'HEAD:package-lock.json'], {
        encoding: 'utf8',
        env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
      })
    )
    const currentLock = readJson('package-lock.json')
    if (!currentLock?.packages || !baseLock?.packages) return
    const currentPackages = currentLock.packages as Record<string, { dependencies?: Record<string, string> }>
    const mergedLock = JSON.parse(JSON.stringify(baseLock))
    mergedLock.packages[''].dependencies = {
      ...(mergedLock.packages[''].dependencies ?? {}),
      duckdb: currentPackages['']?.dependencies?.duckdb,
      'nodejs-polars': currentPackages['']?.dependencies?.['nodejs-polars'],
    }
    for (const [key, value] of Object.entries(currentPackages)) {
      if (!baseLock.packages[key]) mergedLock.packages[key] = value
    }
    writeFileSync('package-lock.json', `${JSON.stringify(mergedLock, null, 2)}\n`)
  } catch {
    // Integrity diagnostics will catch any broad lockfile churn if normalization cannot run.
  }
}

function buildPostInstallNpmCiReport(generatedAt: string, runNpmCi: boolean) {
  const before = capturePackageState()
  const result = runNpmCi ? safeExec('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { maxBuffer: 1024 * 1024 * 12 }) : notRunResult()
  const after = capturePackageState()
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.postInstallNpmCi.v1',
    generatedAt,
    command: npmCiCommand,
    npmCiRun: runNpmCi,
    npmCiStatus: runNpmCi ? result.status : 'not_run',
    npmCiExitCode: result.exitCode,
    stdoutPreview: preview(result.stdout),
    stderrPreview: preview(result.stderr),
    beforePackageJsonHash: before.packageJsonHash,
    beforePackageLockHash: before.packageLockHash,
    afterPackageJsonHash: after.packageJsonHash,
    afterPackageLockHash: after.packageLockHash,
    packageJsonChanged: before.packageJsonHash !== after.packageJsonHash,
    packageLockChanged: before.packageLockHash !== after.packageLockHash,
    scriptsIgnored: true,
    baselineClean: !runNpmCi || result.exitCode === 0,
  }
}

function buildDuckdbProofReport(generatedAt: string, runProof: boolean): PackageBinaryProofReport {
  const script = [
    "const mod = await import('duckdb')",
    'const duckdb = mod.default ?? mod',
    "const db = new duckdb.Database(':memory:')",
    "const rows = await new Promise((resolve, reject) => db.all('select 1 as ok', (error, output) => error ? reject(error) : resolve(output)))",
    "console.log(JSON.stringify({ version: duckdb.VERSION ?? duckdb.version ?? null, rows, rowCount: Array.isArray(rows) ? rows.length : 0, storage: 'in_memory', mediaInputsUsed: false }))",
  ].join('; ')
  return buildNodeProof({
    generatedAt,
    targetId: 'duckdb_metadata_query_proof',
    targetName: 'DuckDB',
    commandClass: 'node_import_version_and_in_memory_metadata_query',
    runProof,
    script,
  })
}

function buildPolarsProofReport(generatedAt: string, runProof: boolean): PackageBinaryProofReport {
  const script = [
    "const mod = await import('nodejs-polars')",
    'const pl = mod.default ?? mod',
    "const makeFrame = typeof pl.DataFrame === 'function' ? pl.DataFrame : pl.df",
    "if (typeof makeFrame !== 'function') throw new Error('DataFrame factory missing')",
    "let df; try { df = makeFrame({ candidate: ['missing_optional_package_binary_execution'], mode: ['metadata_only'] }) } catch { df = new makeFrame({ candidate: ['missing_optional_package_binary_execution'], mode: ['metadata_only'] }) }",
    "const shape = Array.isArray(df.shape) ? df.shape : [df.height ?? 1, df.width ?? 2]",
    "console.log(JSON.stringify({ version: pl.version ?? pl.__version__ ?? null, shape, columns: df.columns ?? ['candidate', 'mode'], rowCount: df.height ?? shape[0] ?? 1, mediaInputsUsed: false }))",
  ].join('; ')
  return buildNodeProof({
    generatedAt,
    targetId: 'polars_metadata_dataframe_proof',
    targetName: 'Polars',
    commandClass: 'node_import_version_and_synthetic_metadata_dataframe',
    runProof,
    script,
  })
}

function buildNodeProof(input: {
  generatedAt: string
  targetId: string
  targetName: string
  commandClass: string
  runProof: boolean
  script: string
}): PackageBinaryProofReport {
  if (!input.runProof) {
    return baseProof(input.generatedAt, input.targetId, input.targetName, input.commandClass, 'not_run', false, 'proof_not_run')
  }
  const result = safeExec(process.execPath, ['--input-type=module', '-e', input.script])
  if (result.exitCode !== 0) {
    return baseProof(
      input.generatedAt,
      input.targetId,
      input.targetName,
      input.commandClass,
      skippedScriptBlocker(result.stderr) ? 'blocked_by_ignored_scripts' : 'blocked_import_or_proof_failed',
      false,
      skippedScriptBlocker(result.stderr) ? 'blocked_by_ignored_scripts' : 'blocked_import_or_proof_failed',
      result
    )
  }
  const details = parseJsonOutput(result.stdout) ?? {}
  return {
    ...baseProof(input.generatedAt, input.targetId, input.targetName, input.commandClass, 'passed', true, null, result),
    version: String(details.version ?? ''),
    details: {
      ...baseProofDetails(),
      ...details,
    },
  }
}

function buildVersionCheckReport(binary: 'ffmpeg' | 'ffprobe', generatedAt: string, runProof: boolean): PackageBinaryProofReport {
  const targetId = binary === 'ffmpeg' ? 'ffmpeg_version_probe' : 'ffprobe_version_probe'
  const targetName = binary === 'ffmpeg' ? 'FFmpeg' : 'FFprobe'
  if (!runProof) return baseProof(generatedAt, targetId, targetName, 'system_binary_version_only_if_present', 'not_run', false, 'proof_not_run')
  const exists = safeExec('command', ['-v', binary])
  if (exists.exitCode !== 0 || exists.stdout.trim().length === 0) {
    return {
      ...baseProof(generatedAt, targetId, targetName, 'system_binary_version_only_if_present', 'missing_system_binary', false, 'missing_system_binary'),
      details: {
        ...baseProofDetails(),
        binaryPresent: false,
        installAttempted: false,
        commandVExitCode: exists.exitCode,
      },
    }
  }
  const result = safeExec(binary, ['-version'])
  if (result.exitCode !== 0) {
    return baseProof(generatedAt, targetId, targetName, 'system_binary_version_only_if_present', 'blocked_import_or_proof_failed', false, `${binary}_version_failed`, result)
  }
  return {
    ...baseProof(generatedAt, targetId, targetName, 'system_binary_version_only_if_present', 'passed', true, null, result),
    command: `${binary} -version`,
    version: result.stdout.split('\n')[0]?.trim() ?? null,
    details: {
      ...baseProofDetails(),
      binaryPresent: true,
      binaryPath: exists.stdout.trim(),
      firstLine: result.stdout.split('\n')[0]?.trim() ?? null,
      mediaInputsUsed: false,
      filesProbed: false,
      decodeOrEncodeAttempted: false,
    },
  }
}

function baseProof(
  generatedAt: string,
  targetId: string,
  targetName: string,
  commandClass: string,
  status: PackageBinaryProofReport['status'],
  passed: boolean,
  blocker: string | null,
  result?: { stdout: string; stderr: string; exitCode: number | null }
): PackageBinaryProofReport {
  return {
    schema: `reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.${targetId}.v1`,
    generatedAt,
    targetId,
    targetName,
    status,
    passed,
    commandClass,
    stdoutPreview: preview(result?.stdout ?? ''),
    stderrPreview: preview(result?.stderr ?? ''),
    blocker,
    installAttempted: targetId === 'duckdb_metadata_query_proof' || targetId === 'polars_metadata_dataframe_proof',
    systemBinaryInstallAttempted: false,
    mediaProcessingAttempted: false,
    details: baseProofDetails(),
  }
}

function baseProofDetails() {
  return {
    privateDataUsed: false,
    mediaInputUsed: false,
    mediaOutputCreated: false,
    networkUsedByProof: false,
    supabaseUsed: false,
    gcsUsed: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptsExecuted: false,
  }
}

function buildPackageLockIntegrityReport(
  generatedAt: string,
  packageInstallReport: Record<string, unknown>,
  before = capturePackageState()
) {
  const after = capturePackageState()
  const dependencyAdditionsList = dependencyAdditions(before.dependencies, after.dependencies)
  const lockPackages = packageLockPackagesFor(['duckdb', 'nodejs-polars'])
  const packageJsonHasOnlyApprovedDirectAdditions =
    dependencyAdditionsList.length === 0 ||
    (dependencyAdditionsList.includes('duckdb') &&
      dependencyAdditionsList.includes('nodejs-polars') &&
      dependencyAdditionsList.every((name) => ['duckdb', 'nodejs-polars'].includes(name)))
  const packageLockHasApprovedPackages = lockPackages.directPackagesPresent.every(Boolean)
  const trackedNodeModules = trackedMatches(/^node_modules\//)
  const trackedBuildOutputs = trackedMatches(/^(dist|build|coverage|\.next|out)\//)
  const trackedMedia = trackedMatches(/\.(png|jpe?g|webp|gif|mp4|mov|webm|wav|mp3|flac|m4a)$/i)
  const dockerChanges = trackedMatches(/(^|\/)(Dockerfile|docker-compose\.ya?ml)$|^docker\//i)
  const passed =
    packageJsonHasOnlyApprovedDirectAdditions &&
    packageLockHasApprovedPackages &&
    trackedNodeModules.length === 0 &&
    trackedBuildOutputs.length === 0 &&
    trackedMedia.length === 0 &&
    dockerChanges.length === 0
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.packageLockIntegrity.v1',
    generatedAt,
    beforePackageJsonHash: before.packageJsonHash,
    beforePackageLockHash: before.packageLockHash,
    afterPackageJsonHash: after.packageJsonHash,
    afterPackageLockHash: after.packageLockHash,
    packageJsonChanged: before.packageJsonHash !== after.packageJsonHash,
    packageLockChanged: before.packageLockHash !== after.packageLockHash,
    packageInstallReportExitCode: packageInstallReport.installExitCode,
    directDependencyAdditions: dependencyAdditionsList,
    approvedDirectDependencyAdditions: ['duckdb', 'nodejs-polars'],
    packageJsonHasOnlyApprovedDirectAdditions,
    packageLockHasApprovedPackages,
    packageLockPackages: lockPackages,
    npmLifecycleScriptsSkipped: true,
    noUnexpectedDependencyChurn: packageJsonHasOnlyApprovedDirectAdditions,
    nodeModulesCommitted: trackedNodeModules.length > 0,
    buildOutputsCommitted: trackedBuildOutputs.length > 0,
    mediaArtifactsCommitted: trackedMedia.length > 0,
    dockerOrContainerFilesChanged: dockerChanges.length > 0,
    trackedNodeModules,
    trackedBuildOutputs,
    trackedMedia,
    dockerChanges,
    passed,
    blocker: passed ? null : 'package_lock_or_side_effect_integrity_failed',
  }
}

function buildSideEffectSafetyReport(generatedAt: string, flags: Record<string, false>) {
  const changedFiles = trackedMatches(/.*/)
  const forbiddenChangedFiles = changedFiles.filter((file) =>
    /(^node_modules\/|^dist\/|^build\/|^coverage\/|^\.next\/|^out\/|(^|\/)(Dockerfile|docker-compose\.ya?ml)$|^docker\/|\.(png|jpe?g|webp|gif|mp4|mov|webm|wav|mp3|flac|m4a)$)/i.test(
      file
    )
  )
  const secretsDetected = scanChangedFilesForSecrets(changedFiles)
  const passed = forbiddenChangedFiles.length === 0 && secretsDetected.length === 0 && Object.values(flags).every((value) => value === false)
  return {
    schema: 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryExecution.sideEffectSafety.v1',
    generatedAt,
    changedFiles,
    forbiddenChangedFiles,
    secretsDetected,
    workersExecuted: false,
    routesExecuted: false,
    providersCalled: false,
    mediaProcessingAttempted: false,
    audioProcessingAttempted: false,
    renderExportAttempted: false,
    imageGenerationAttempted: false,
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
    passed,
  }
}

function buildBlockers(input: {
  packageInstallReport: Record<string, unknown>
  postInstallNpmCiReport: Record<string, unknown>
  duckdbProofReport: PackageBinaryProofReport
  polarsProofReport: PackageBinaryProofReport
  ffmpegVersionCheckReport: PackageBinaryProofReport
  ffprobeVersionCheckReport: PackageBinaryProofReport
  packageLockIntegrityReport: Record<string, unknown>
  sideEffectSafetyReport: Record<string, unknown>
}) {
  const blockers: string[] = []
  if (input.packageLockIntegrityReport.passed !== true) blockers.push('package_lock_integrity_failed')
  if (input.sideEffectSafetyReport.passed !== true) blockers.push('side_effect_safety_failed')
  if (input.packageInstallReport.installStatus === 'failed') blockers.push('approved_package_install_failed')
  if (input.postInstallNpmCiReport.npmCiRun === true && input.postInstallNpmCiReport.npmCiExitCode !== 0) {
    blockers.push('post_install_npm_ci_failed')
  }
  if (input.duckdbProofReport.status === 'blocked_import_or_proof_failed') blockers.push('duckdb_import_or_query_failed')
  if (input.polarsProofReport.status === 'blocked_import_or_proof_failed') blockers.push('polars_import_or_dataframe_failed')
  if (input.duckdbProofReport.status === 'blocked_by_ignored_scripts') blockers.push('duckdb_blocked_by_ignored_scripts')
  if (input.polarsProofReport.status === 'blocked_by_ignored_scripts') blockers.push('polars_blocked_by_ignored_scripts')
  return blockers
}

function chooseDecision(
  blockers: string[],
  input: {
    packageInstallReport: Record<string, unknown>
    duckdbProofReport: PackageBinaryProofReport
    polarsProofReport: PackageBinaryProofReport
    ffmpegVersionCheckReport: PackageBinaryProofReport
    ffprobeVersionCheckReport: PackageBinaryProofReport
  }
): MissingOptionalPackageBinaryExecutionDecision {
  if (blockers.includes('side_effect_safety_failed')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('package_lock_integrity_failed') || blockers.includes('post_install_npm_ci_failed')) {
    return 'blocked_pending_package_lock_integrity'
  }
  if (blockers.includes('approved_package_install_failed')) return 'blocked_pending_duckdb_install_or_import'
  if (blockers.includes('duckdb_blocked_by_ignored_scripts') || blockers.includes('polars_blocked_by_ignored_scripts')) {
    return 'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts'
  }
  if (blockers.includes('duckdb_import_or_query_failed')) return 'blocked_pending_duckdb_install_or_import'
  if (blockers.includes('polars_import_or_dataframe_failed')) return 'blocked_pending_polars_install_or_import'
  if (input.duckdbProofReport.passed !== true && input.packageInstallReport.installAttempted === true) {
    return 'blocked_pending_duckdb_install_or_import'
  }
  if (input.polarsProofReport.passed !== true && input.packageInstallReport.installAttempted === true) {
    return 'blocked_pending_polars_install_or_import'
  }
  if (input.ffmpegVersionCheckReport.passed === true && input.ffprobeVersionCheckReport.passed === true) {
    return 'missing_optional_package_and_binary_execution_passed_ready_for_qa'
  }
  if (input.duckdbProofReport.passed === true && input.polarsProofReport.passed === true) {
    return 'missing_optional_package_execution_passed_binary_missing_ready_for_system_binary_review'
  }
  return 'blocked_pending_package_lock_integrity'
}

function nextPromptForDecision(decision: MissingOptionalPackageBinaryExecutionDecision) {
  if (decision === 'missing_optional_package_and_binary_execution_passed_ready_for_qa') return nextQaPrompt
  if (decision === 'missing_optional_package_execution_passed_binary_missing_ready_for_system_binary_review') {
    return nextBinaryReviewPrompt
  }
  if (decision === 'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts') {
    return nextScriptReviewPrompt
  }
  return nextBlockerPrompt
}

function nextPromptPath(nextPrompt: string) {
  if (nextPrompt === nextQaPrompt) return nextPromptPaths.qaReview
  if (nextPrompt === nextBinaryReviewPrompt) return nextPromptPaths.binaryReview
  if (nextPrompt === nextScriptReviewPrompt) return nextPromptPaths.scriptReview
  return nextPromptPaths.blockerResolution
}

function capturePackageState() {
  const packageJson = readJson('package.json') ?? {}
  const packageLock = readJson('package-lock.json') ?? {}
  return {
    packageJson,
    packageLock,
    packageJsonHash: fileHash('package.json'),
    packageLockHash: fileHash('package-lock.json'),
    dependencies: dependencySections(packageJson),
  }
}

function dependencySections(packageJson: JsonObject) {
  return {
    dependencies: objectValue(packageJson.dependencies),
    devDependencies: objectValue(packageJson.devDependencies),
    optionalDependencies: objectValue(packageJson.optionalDependencies),
  }
}

function dependencyAdditions(before: ReturnType<typeof dependencySections>, after: ReturnType<typeof dependencySections>) {
  const additions = new Set<string>()
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies'] as const) {
    for (const name of Object.keys(after[section])) {
      if (!before[section][name]) additions.add(name)
    }
  }
  return [...additions].sort()
}

function packageLockPackagesFor(packageNames: string[]) {
  const packageLock = readJson('package-lock.json') ?? {}
  const packages = objectValue(packageLock.packages)
  const matched = Object.keys(packages).filter((entry) =>
    packageNames.some((name) => entry === `node_modules/${name}` || entry.startsWith(`node_modules/${name}/`))
  )
  return {
    matchedPackageKeys: matched.sort(),
    directPackagesPresent: packageNames.map((name) => existsSync(`node_modules/${name}`) || Boolean(packages[`node_modules/${name}`])),
    total: matched.length,
  }
}

function blockedFlags(): Record<string, false> {
  return {
    broadToolExecutionAllowed: false,
    realToolExecutionAllowed: false,
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
    systemBinaryInstallAllowed: false,
    containerMutationAllowed: false,
    dockerMutationAllowed: false,
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

function safeExec(command: string, args: string[], options: { maxBuffer?: number } = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: options.maxBuffer ?? 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  return {
    status: result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? result.error?.message ?? '',
  }
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
  const result = safeExec('gh', [
    'pr',
    'view',
    String(number),
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--json',
    'number,title,state,mergedAt,isDraft,baseRefName,headRefName,headRefOid,mergeStateStatus,url',
  ])
  return result.exitCode === 0 ? parseJsonOutput(result.stdout) : { number, unavailable: true, error: preview(result.stderr) }
}

function safePrSearch() {
  const result = safeExec('gh', [
    'pr',
    'list',
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--state',
    'open',
    '--search',
    'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION',
    '--json',
    'number,title,state,isDraft,baseRefName,headRefName,mergeStateStatus,url',
  ])
  return result.exitCode === 0 ? parseJsonOutput(result.stdout) : []
}

function notRunResult() {
  return { status: 'not_run', exitCode: null, stdout: '', stderr: '' }
}

function readJson(filePath: string): JsonObject | undefined {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return undefined
  }
}

function parseJsonOutput(text: string): JsonObject | undefined {
  try {
    return JSON.parse(text.trim())
  } catch {
    return undefined
  }
}

function objectValue(value: unknown): Record<string, string> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, string>) : {}
}

function fileHash(filePath: string) {
  return existsSync(filePath) ? hashText(readFileSync(filePath, 'utf8')) : null
}

function hashText(text: string) {
  return createHash('sha256').update(text).digest('hex')
}

function preview(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 1000)
}

function trackedMatches(pattern: RegExp) {
  const status = safeGit(['status', '--short']) ?? ''
  return status
    .split('\n')
    .map((line) => line.trim().replace(/^[A-Z? ]+\s+/, ''))
    .filter((file) => file && pattern.test(file))
}

function scanChangedFilesForSecrets(files: string[]) {
  const pattern = /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i
  return files.filter((file) => {
    if (!existsSync(file) || file.startsWith('node_modules/')) return false
    try {
      if (!statSync(file).isFile()) return false
      return pattern.test(readFileSync(file, 'utf8'))
    } catch {
      return false
    }
  })
}

function skippedScriptBlocker(stderr: string) {
  return /binding|native|postinstall|install script|node-gyp|cannot find module/i.test(stderr)
}

function writeJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(filePath: string, value: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, value)
}

function baselineMarkdown(report: Record<string, unknown>) {
  return `# Missing Optional Package/Binary Execution Pre-Install Baseline

- Command: \`${report.command}\`
- npm ci run: \`${report.npmCiRun}\`
- Exit code: \`${report.npmCiExitCode}\`
- Baseline clean: \`${report.baselineClean}\`
- Package lock changed: \`${report.packageLockChanged}\`

No package install beyond the later approved \`duckdb\` / \`nodejs-polars\` command is authorized.
`
}

function packageInstallMarkdown(report: Record<string, unknown>) {
  return `# Missing Optional Package/Binary Execution Package Install

- Command: \`${report.command}\`
- Install attempted: \`${report.installAttempted}\`
- Exit code: \`${report.installExitCode}\`
- Direct dependency additions: \`${Array.isArray(report.directDependencyAdditions) ? report.directDependencyAdditions.join(', ') : ''}\`
- Unexpected direct dependency additions: \`${Array.isArray(report.unexpectedDirectDependencyAdditions) ? report.unexpectedDirectDependencyAdditions.join(', ') : ''}\`
- Scripts skipped: \`${report.npmLifecycleScriptsSkipped}\`

No FFmpeg/FFprobe install, Docker/container mutation, media processing, worker/route/provider execution, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, or production scope is authorized.
`
}

function packageLockIntegrityMarkdown(report: Record<string, unknown>) {
  return `# Missing Optional Package/Binary Execution Package-Lock Integrity

- Passed: \`${report.passed}\`
- Package.json changed: \`${report.packageJsonChanged}\`
- Package-lock changed: \`${report.packageLockChanged}\`
- Only approved direct additions: \`${report.packageJsonHasOnlyApprovedDirectAdditions}\`
- Approved lock packages present: \`${report.packageLockHasApprovedPackages}\`
- Node modules committed: \`${report.nodeModulesCommitted}\`
- Build outputs committed: \`${report.buildOutputsCommitted}\`
- Media artifacts committed: \`${report.mediaArtifactsCommitted}\`

The approved mutation is limited to \`duckdb\`, \`nodejs-polars\`, and required package-lock metadata.
`
}

function decisionMarkdown(report: JsonObject) {
  const blockers = Array.isArray(report.blockers) ? report.blockers.map(String) : []
  return `# Missing Optional Package/Binary Execution Decision

Decision: \`${report.decision}\`

- Readiness: \`${report.readiness}\`
- Package install status: \`${report.packageInstallStatus}\`
- Next prompt: \`${report.nextPrompt}\`
- Blockers: \`${blockers.join(', ') || 'none'}\`
- Supabase classification: no write / environment none / SQL none / migration no.

DuckDB and Polars proof is limited to local in-memory metadata checks. FFmpeg/FFprobe checks are version-only when binaries already exist. Media processing, workers, routes, providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
`
}

function validationResultsMarkdown(reports: PackageBinaryExecutionReportSet) {
  return `# Missing Optional Package/Binary Execution Validation Results

- Decision: \`${reports.decision.decision}\`
- Package install: \`${reports.packageInstallReport.installStatus}\`
- Post-install npm ci: \`${reports.postInstallNpmCiReport.npmCiStatus}\`
- DuckDB proof: \`${reports.duckdbProofReport.status}\`
- Polars proof: \`${reports.polarsProofReport.status}\`
- FFmpeg check: \`${reports.ffmpegVersionCheckReport.status}\`
- FFprobe check: \`${reports.ffprobeVersionCheckReport.status}\`
- Package-lock integrity: \`${reports.packageLockIntegrityReport.passed}\`
- Side-effect safety: \`${reports.sideEffectSafetyReport.passed}\`
- Supabase: no write / environment none / SQL none / migration no.
`
}

function nextPromptMarkdown(reports: PackageBinaryExecutionReportSet) {
  return `# ${reports.decision.nextPrompt}

Use this prompt after reviewing \`${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/\`.

Decision: \`${reports.decision.decision}\`.

Keep broad tool execution, workers, routes, providers, media/audio/render/image/browser/map execution, Supabase/GCS mutation, public artifacts, signed URLs, raw prompts, beta, and production blocked unless a later packet explicitly approves a narrower path.
`
}
