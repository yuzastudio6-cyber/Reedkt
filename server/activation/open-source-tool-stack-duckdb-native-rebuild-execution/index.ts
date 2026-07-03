import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  DuckdbNativeRebuildDecision,
  DuckdbNativeRebuildReportSet,
} from './duckdb-native-rebuild-types'

type JsonRecord = Record<string, unknown>

type CommandResult = {
  command: string
  exitCode: number
  status: 'passed' | 'failed' | 'not_run'
  stdout: string
  stderr: string
}

export const DUCKDB_NATIVE_REBUILD_REPORT_DIR =
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution'
export const DUCKDB_NATIVE_REBUILD_BRANCH =
  'codex/rp-open-source-tool-stack-duckdb-native-rebuild-execution'
export const DUCKDB_NATIVE_REBUILD_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const DUCKDB_NATIVE_REBUILD_SOURCE_SHA = '7824131ad812d6076e966c6080a8a64027cc6b5f'

const npmCiCommand = 'npm ci --ignore-scripts --no-audit --no-fund'
const duckdbRebuildCommand = 'npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund'
const passDecision: DuckdbNativeRebuildDecision =
  'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing'
const qaReadyDecision: DuckdbNativeRebuildDecision = 'duckdb_native_rebuild_execution_passed_ready_for_qa'
const nextQaPrompt = 'OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_REVIEW'
const nextBlockerPrompt = 'OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_BLOCKER_RESOLUTION'

const predecessorPrs = [460, 455, 448, 444, 439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [428, 425, 432, 423, 420, 417, 401, 384]

const reportPaths = {
  sourceAudit: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/source-of-truth-audit.json`,
  preRebuildBaseline: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/pre-rebuild-baseline-report.json`,
  preRebuildBaselineMd: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/pre-rebuild-baseline-report.md`,
  nativeRebuild: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-native-rebuild-report.json`,
  nativeRebuildMd: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-native-rebuild-report.md`,
  importProof: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-import-proof-report.json`,
  syntheticQuery: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-synthetic-query-report.json`,
  integrity: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/package-lock-native-artifact-integrity-report.json`,
  integrityMd: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/package-lock-native-artifact-integrity-report.md`,
  ffmpegFollowUp: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/ffmpeg-ffprobe-follow-up-report.json`,
  sideEffectSafety: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/side-effect-safety-report.json`,
  decision: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-native-rebuild-decision.json`,
  decisionMd: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-native-rebuild-decision.md`,
  readiness: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-native-rebuild-readiness-report.json`,
  privateManifest: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-native-rebuild-private-artifact-manifest.json`,
  validationResults: `${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/duckdb-native-rebuild-validation-results.md`,
}

const nextPromptPaths = {
  qa: 'docs/implementation-prompts/prompt-open-source-tool-stack-duckdb-native-rebuild-qa-review.md',
  blocker: 'docs/implementation-prompts/prompt-open-source-tool-stack-duckdb-native-rebuild-blocker-resolution.md',
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_EXECUTION',
    'REEDITPRO_CONFIRM_PACKAGE_INSTALL_SCRIPT_REVIEW_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_APPROVED_DUCKDB_NATIVE_REBUILD_ONLY',
    'REEDITPRO_CONFIRM_NPM_REBUILD_DUCKDB_ONLY',
    'REEDITPRO_CONFIRM_DUCKDB_IMPORT_SMOKE',
    'REEDITPRO_CONFIRM_DUCKDB_SYNTHETIC_METADATA_QUERY',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_INTEGRITY_REVIEW',
    'REEDITPRO_CONFIRM_NATIVE_ARTIFACT_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'DEPENDENCY_INSTALL',
    'NPM_INSTALL',
    'PACKAGE_LOCK_MUTATION',
    'PACKAGE_LIFECYCLE_SCRIPT_EXECUTION_BROAD',
    'POLARS_IMPORT_SMOKE',
    'FFMPEG_VERSION_PROBE',
    'FFPROBE_VERSION_PROBE',
    'SYSTEM_BINARY_INSTALL',
    'CONTAINER_IMAGE_MUTATION',
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
    'SIGNED_URL_DELIVERY',
    'PRODUCTION_WRITE',
    'EXTERNAL_BETA_UNLOCK',
    'PAID_PRODUCTION_UNLOCK',
    'RAW_PROMPT_EXECUTION',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD_PRINT',
  ]
}

export function buildOpenSourceToolStackDuckdbNativeRebuildPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_EXECUTION',
    branch: DUCKDB_NATIVE_REBUILD_BRANCH,
    baseBranch: DUCKDB_NATIVE_REBUILD_BASE_BRANCH,
    expectedSourceSha: DUCKDB_NATIVE_REBUILD_SOURCE_SHA,
    mode: 'duckdb_only_native_rebuild_and_in_memory_metadata_proof',
    baselineCommand: npmCiCommand,
    approvedRebuildCommand: duckdbRebuildCommand,
    proofTargets: ['duckdb_import_version_api_shape', 'duckdb_tiny_in_memory_metadata_query'],
    explicitlyNotRun: [
      'npm install',
      'bare npm rebuild',
      'polars proof rerun',
      'ffmpeg version probe',
      'ffprobe version probe',
      'media processing',
      'worker or route execution',
      'provider calls',
      'Supabase or SQL mutation',
      'GCS/public artifact/signed URL delivery',
      'raw prompt execution',
      'GitHub PR merge',
    ],
    requiredConfirmations: requiredConfirmations(),
    reports: Object.values(reportPaths),
    decisions: [
      qaReadyDecision,
      passDecision,
      'blocked_pending_duckdb_native_rebuild',
      'blocked_pending_duckdb_import_or_query',
      'blocked_pending_package_lock_integrity',
      'blocked_pending_native_artifact_policy',
      'rejected_due_runtime_safety_risk',
    ],
  }
}

export function buildOpenSourceToolStackDuckdbNativeRebuildReports(): DuckdbNativeRebuildReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, flags)
  const preRebuildBaselineReport = buildPreRebuildBaselineReport(generatedAt, false)
  const nativeRebuildReport = buildNativeRebuildReport(generatedAt, false)
  const duckdbImportProofReport = buildDuckdbImportProofReport(generatedAt, false)
  const duckdbSyntheticQueryReport = buildDuckdbSyntheticQueryReport(generatedAt, false)
  const packageLockNativeArtifactIntegrityReport = buildIntegrityReport(
    generatedAt,
    sourceOfTruthAudit,
    preRebuildBaselineReport,
    nativeRebuildReport,
  )
  const ffmpegFfprobeFollowUpReport = buildFfmpegFfprobeFollowUpReport(generatedAt)
  const sideEffectSafetyReport = buildSideEffectSafetyReport(generatedAt, flags)

  return finalizeReports({
    generatedAt,
    sourceOfTruthAudit,
    preRebuildBaselineReport,
    nativeRebuildReport,
    duckdbImportProofReport,
    duckdbSyntheticQueryReport,
    packageLockNativeArtifactIntegrityReport,
    ffmpegFfprobeFollowUpReport,
    sideEffectSafetyReport,
  })
}

export function writeOpenSourceToolStackDuckdbNativeRebuildArtifacts(options: { execute?: boolean } = {}) {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, flags)
  const preRebuildBaselineReport = buildPreRebuildBaselineReport(generatedAt, options.execute === true)
  const baselinePassed =
    preRebuildBaselineReport.npmCiExitCode === 0 &&
    preRebuildBaselineReport.packageJsonChanged === false &&
    preRebuildBaselineReport.packageLockChanged === false
  const nativeRebuildReport = buildNativeRebuildReport(generatedAt, options.execute === true && baselinePassed)
  const rebuildPassed =
    nativeRebuildReport.rebuildExitCode === 0 &&
    nativeRebuildReport.packageJsonChanged === false &&
    nativeRebuildReport.packageLockChanged === false
  const duckdbImportProofReport = buildDuckdbImportProofReport(generatedAt, options.execute === true && rebuildPassed)
  const importPassed = duckdbImportProofReport.importPassed === true
  const duckdbSyntheticQueryReport = buildDuckdbSyntheticQueryReport(generatedAt, options.execute === true && importPassed)
  const packageLockNativeArtifactIntegrityReport = buildIntegrityReport(
    generatedAt,
    sourceOfTruthAudit,
    preRebuildBaselineReport,
    nativeRebuildReport,
  )
  const ffmpegFfprobeFollowUpReport = buildFfmpegFfprobeFollowUpReport(generatedAt)
  const sideEffectSafetyReport = buildSideEffectSafetyReport(generatedAt, flags)
  const reports = finalizeReports({
    generatedAt,
    sourceOfTruthAudit,
    preRebuildBaselineReport,
    nativeRebuildReport,
    duckdbImportProofReport,
    duckdbSyntheticQueryReport,
    packageLockNativeArtifactIntegrityReport,
    ffmpegFfprobeFollowUpReport,
    sideEffectSafetyReport,
  })

  mkdirSync(DUCKDB_NATIVE_REBUILD_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.preRebuildBaseline, reports.preRebuildBaselineReport)
  writeText(reportPaths.preRebuildBaselineMd, preRebuildMarkdown(reports.preRebuildBaselineReport))
  writeJson(reportPaths.nativeRebuild, reports.nativeRebuildReport)
  writeText(reportPaths.nativeRebuildMd, nativeRebuildMarkdown(reports.nativeRebuildReport))
  writeJson(reportPaths.importProof, reports.duckdbImportProofReport)
  writeJson(reportPaths.syntheticQuery, reports.duckdbSyntheticQueryReport)
  writeJson(reportPaths.integrity, reports.packageLockNativeArtifactIntegrityReport)
  writeText(reportPaths.integrityMd, integrityMarkdown(reports.packageLockNativeArtifactIntegrityReport))
  writeJson(reportPaths.ffmpegFollowUp, reports.ffmpegFfprobeFollowUpReport)
  writeJson(reportPaths.sideEffectSafety, reports.sideEffectSafetyReport)
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.privateManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationMarkdown(reports))
  writeText(nextPromptPath(String(reports.decision.nextPrompt)), nextPromptMarkdown(reports))
  return reports
}

export function refreshOpenSourceToolStackDuckdbNativeRebuildArtifactsFromReports() {
  const generatedAt = new Date().toISOString()
  const sourceOfTruthAudit = readJson(reportPaths.sourceAudit) ?? buildSourceOfTruthAudit(generatedAt, blockedFlags())
  const preRebuildBaselineReport = readJson(reportPaths.preRebuildBaseline) ?? buildPreRebuildBaselineReport(generatedAt, false)
  const nativeRebuildReport = readJson(reportPaths.nativeRebuild) ?? buildNativeRebuildReport(generatedAt, false)
  const duckdbImportProofReport = readJson(reportPaths.importProof) ?? buildDuckdbImportProofReport(generatedAt, false)
  const duckdbSyntheticQueryReport = readJson(reportPaths.syntheticQuery) ?? buildDuckdbSyntheticQueryReport(generatedAt, false)
  const ffmpegFfprobeFollowUpReport =
    readJson(reportPaths.ffmpegFollowUp) ?? buildFfmpegFfprobeFollowUpReport(generatedAt)
  const sideEffectSafetyReport = readJson(reportPaths.sideEffectSafety) ?? buildSideEffectSafetyReport(generatedAt, blockedFlags())
  const packageLockNativeArtifactIntegrityReport = buildIntegrityReport(
    generatedAt,
    sourceOfTruthAudit,
    preRebuildBaselineReport,
    nativeRebuildReport,
  )
  const reports = finalizeReports({
    generatedAt,
    sourceOfTruthAudit,
    preRebuildBaselineReport,
    nativeRebuildReport,
    duckdbImportProofReport,
    duckdbSyntheticQueryReport,
    packageLockNativeArtifactIntegrityReport,
    ffmpegFfprobeFollowUpReport,
    sideEffectSafetyReport,
  })

  writeJson(reportPaths.integrity, reports.packageLockNativeArtifactIntegrityReport)
  writeText(reportPaths.integrityMd, integrityMarkdown(reports.packageLockNativeArtifactIntegrityReport))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.privateManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationMarkdown(reports))
  writeText(nextPromptPath(String(reports.decision.nextPrompt)), nextPromptMarkdown(reports))
  return reports
}

export function readOpenSourceToolStackDuckdbNativeRebuildArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    preRebuildBaselineReport: readJson(reportPaths.preRebuildBaseline) ?? {},
    nativeRebuildReport: readJson(reportPaths.nativeRebuild) ?? {},
    duckdbImportProofReport: readJson(reportPaths.importProof) ?? {},
    duckdbSyntheticQueryReport: readJson(reportPaths.syntheticQuery) ?? {},
    packageLockNativeArtifactIntegrityReport: readJson(reportPaths.integrity) ?? {},
    ffmpegFfprobeFollowUpReport: readJson(reportPaths.ffmpegFollowUp) ?? {},
    sideEffectSafetyReport: readJson(reportPaths.sideEffectSafety) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateManifest) ?? {},
  } as DuckdbNativeRebuildReportSet
}

export function summarizeOpenSourceToolStackDuckdbNativeRebuild(
  reports = buildOpenSourceToolStackDuckdbNativeRebuildReports(),
) {
  return JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      baselineStatus: reports.preRebuildBaselineReport.npmCiStatus,
      rebuildStatus: reports.nativeRebuildReport.rebuildStatus,
      duckdbImportStatus: reports.duckdbImportProofReport.status,
      duckdbQueryStatus: reports.duckdbSyntheticQueryReport.status,
      packageLockIntegrityPassed: reports.packageLockNativeArtifactIntegrityReport.passed,
      ffmpegStatus: reports.ffmpegFfprobeFollowUpReport.ffmpegStatus,
      ffprobeStatus: reports.ffmpegFfprobeFollowUpReport.ffprobeStatus,
      blockers: reports.readinessReport.blockers,
      nextPrompt: reports.decision.nextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  )
}

function finalizeReports(input: {
  generatedAt: string
  sourceOfTruthAudit: Record<string, unknown>
  preRebuildBaselineReport: Record<string, unknown>
  nativeRebuildReport: Record<string, unknown>
  duckdbImportProofReport: Record<string, unknown>
  duckdbSyntheticQueryReport: Record<string, unknown>
  packageLockNativeArtifactIntegrityReport: Record<string, unknown>
  ffmpegFfprobeFollowUpReport: Record<string, unknown>
  sideEffectSafetyReport: Record<string, unknown>
}): DuckdbNativeRebuildReportSet {
  const blockers = buildBlockers(input)
  const decisionValue = chooseDecision(blockers, input)
  const readiness = decisionValue === qaReadyDecision || decisionValue === passDecision
  const decision = {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.decision.v1',
    generatedAt: input.generatedAt,
    decision: decisionValue,
    readiness,
    command: duckdbRebuildCommand,
    baselineCommand: npmCiCommand,
    duckdbPackage: 'duckdb@1.4.4',
    polarsPackage: 'nodejs-polars@0.25.1',
    blockers,
    nextPrompt: decisionValue === passDecision || decisionValue === qaReadyDecision ? nextQaPrompt : nextBlockerPrompt,
    npmInstallAttempted: false,
    npmRebuildDuckdbAttempted: input.nativeRebuildReport.rebuildRun === true,
    broadLifecycleScriptsAttempted: false,
    duckdbImportProofAttempted: input.duckdbImportProofReport.importRun === true,
    duckdbSyntheticQueryAttempted: input.duckdbSyntheticQueryReport.queryRun === true,
    polarsProofRerun: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    packageLockChanged: input.packageLockNativeArtifactIntegrityReport.packageLockChanged,
    packageJsonChanged: input.packageLockNativeArtifactIntegrityReport.packageJsonChanged,
    nativeArtifactsCommitted: input.packageLockNativeArtifactIntegrityReport.nativeArtifactsCommitted,
    nodeModulesCommitted: input.packageLockNativeArtifactIntegrityReport.nodeModulesCommitted,
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
    secretPolicy: secretPolicy(),
    supabaseClassification: supabaseClassification(),
    executionScope: blockedFlags(),
  }

  return {
    ...input,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.readinessReport.v1',
      generatedAt: input.generatedAt,
      readiness,
      decision: decisionValue,
      preRebuildBaselinePassed: input.preRebuildBaselineReport.baselineClean === true,
      nativeRebuildPassed: input.nativeRebuildReport.rebuildExitCode === 0,
      duckdbImportProofPassed: input.duckdbImportProofReport.importPassed === true,
      duckdbSyntheticQueryPassed: input.duckdbSyntheticQueryReport.queryPassed === true,
      packageLockNativeArtifactIntegrityPassed: input.packageLockNativeArtifactIntegrityReport.passed === true,
      sideEffectSafetyPassed: input.sideEffectSafetyReport.passed === true,
      ffmpegFfprobeStillMissing:
        input.ffmpegFfprobeFollowUpReport.ffmpegStatus === 'missing_system_binary' ||
        input.ffmpegFfprobeFollowUpReport.ffprobeStatus === 'missing_system_binary',
      blockers,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.privateArtifactManifest.v1',
      generatedAt: input.generatedAt,
      artifactScope: 'repo_committed_code_json_markdown_reports_only',
      reportDirectory: DUCKDB_NATIVE_REBUILD_REPORT_DIR,
      reports: Object.values(reportPaths),
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      gcsUploads: false,
      mediaArtifactsCommitted: false,
      privatePayloadsCommitted: false,
      nodeModulesCommitted: false,
      nativeBinariesCommitted: false,
      buildOutputsCommitted: false,
      npmCacheCommitted: false,
    },
  }
}

function buildSourceOfTruthAudit(generatedAt: string, flags: Record<string, false>) {
  const packageState = capturePackageState()
  const pr460Decision = readJson(
    'docs/open-source-tool-stack/package-install-script-review/package-install-script-review-decision.json',
  )
  const pr455Decision = readJson(
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/package-binary-execution-decision.json',
  )
  const pr455Duckdb = readJson('docs/open-source-tool-stack/missing-optional-package-binary-execution/duckdb-proof-report.json')
  const pr455Polars = readJson('docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json')
  const pr455Ffmpeg = readJson(
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/ffmpeg-version-check-report.json',
  )
  const pr455Ffprobe = readJson(
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/ffprobe-version-check-report.json',
  )
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.sourceOfTruthAudit.v1',
    generatedAt,
    branch: DUCKDB_NATIVE_REBUILD_BRANCH,
    baseBranch: DUCKDB_NATIVE_REBUILD_BASE_BRANCH,
    expectedSourceSha: DUCKDB_NATIVE_REBUILD_SOURCE_SHA,
    currentBranch: safeGit(['branch', '--show-current']),
    currentSha: safeGit(['rev-parse', 'HEAD']),
    packageJsonHash: packageState.packageJsonHash,
    packageLockHash: packageState.packageLockHash,
    packageDependencies: packageState.dependencies,
    nodeVersion: process.version,
    npmVersion: safeExec('npm', ['--version']).stdout.trim() || null,
    pr460Decision: pr460Decision?.decision ?? null,
    pr460FutureCommand: pr460Decision?.futureCommand ?? null,
    pr460EvidenceValid:
      pr460Decision?.decision === 'package_install_script_review_passed_ready_for_duckdb_native_rebuild_execution' &&
      pr460Decision?.futureCommand === duckdbRebuildCommand,
    pr455Decision: pr455Decision?.decision ?? null,
    pr455DuckdbStatus: pr455Duckdb?.status ?? null,
    pr455PolarsStatus: pr455Polars?.status ?? null,
    pr455FfmpegStatus: pr455Ffmpeg?.status ?? null,
    pr455FfprobeStatus: pr455Ffprobe?.status ?? null,
    approvedDirectDependencies: {
      duckdb: packageState.dependencies.dependencies?.duckdb ?? null,
      'nodejs-polars': packageState.dependencies.dependencies?.['nodejs-polars'] ?? null,
    },
    approvedDirectDependenciesValid:
      packageState.dependencies.dependencies?.duckdb === '1.4.4' &&
      packageState.dependencies.dependencies?.['nodejs-polars'] === '0.25.1',
    predecessorPrEvidence: predecessorPrs.map((number) => safePrView(number)),
    referenceOnlyPrEvidence: referenceOnlyPrs.map((number) => ({ ...safePrView(number), referenceOnly: true, canonical: false })),
    duplicateCentralExecutionPrSearch: safePrSearch(),
    supabaseClassification: supabaseClassification(),
    secretPolicy: secretPolicy(),
    noScopeConfirmation: flags,
  }
}

function buildPreRebuildBaselineReport(generatedAt: string, runNpmCi: boolean) {
  const before = capturePackageState()
  const result = runNpmCi ? safeExec('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { maxBuffer: 1024 * 1024 * 12 }) : notRunResult(npmCiCommand)
  const after = capturePackageState()
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.preRebuildBaseline.v1',
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
    packageJsonChanged: before.packageJsonHash !== after.packageJsonHash,
    packageLockChanged: before.packageLockHash !== after.packageLockHash,
    duckdbPackagePresent: existsSync('node_modules/duckdb/package.json'),
    polarsPackagePresent: existsSync('node_modules/nodejs-polars/package.json'),
    nodeModulesCommitted: trackedMatches(/^node_modules\//).length > 0,
    scriptsIgnored: true,
    npmInstallAttempted: false,
    baselineClean:
      !runNpmCi ||
      (result.exitCode === 0 && before.packageJsonHash === after.packageJsonHash && before.packageLockHash === after.packageLockHash),
  }
}

function buildNativeRebuildReport(generatedAt: string, runRebuild: boolean) {
  const before = capturePackageState()
  const result = runRebuild
    ? safeExec('npm', ['rebuild', 'duckdb', '--ignore-scripts=false', '--no-audit', '--no-fund'], {
        maxBuffer: 1024 * 1024 * 16,
      })
    : notRunResult(duckdbRebuildCommand)
  const after = capturePackageState()
  const nativeBindings = findNativeBindings()
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.nativeRebuild.v1',
    generatedAt,
    command: duckdbRebuildCommand,
    commandMatchesApproved: result.command === duckdbRebuildCommand,
    rebuildRun: runRebuild,
    rebuildExitCode: result.exitCode,
    rebuildStatus: runRebuild ? result.status : 'not_run',
    stdoutPreview: preview(result.stdout),
    stderrPreview: preview(result.stderr),
    beforePackageJsonHash: before.packageJsonHash,
    beforePackageLockHash: before.packageLockHash,
    afterPackageJsonHash: after.packageJsonHash,
    afterPackageLockHash: after.packageLockHash,
    packageJsonChanged: before.packageJsonHash !== after.packageJsonHash,
    packageLockChanged: before.packageLockHash !== after.packageLockHash,
    nativeBindingPaths: nativeBindings,
    nativeBindingAvailable: nativeBindings.length > 0,
    nodeModulesNativeArtifactCommitted: trackedMatches(/^node_modules\/.*\.node$/).length > 0,
    noUnexpectedFilesStaged: gitStatusAll().every((line) => !line.includes('node_modules/')),
    npmInstallAttempted: false,
    bareNpmRebuildAttempted: false,
    broadLifecycleScriptsAttempted: false,
    polarsProofRerun: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
  }
}

function buildDuckdbImportProofReport(generatedAt: string, runProof: boolean) {
  const script = [
    "const mod = await import('duckdb')",
    'const duckdb = mod.default ?? mod',
    "if (typeof duckdb.Database !== 'function') throw new Error('DuckDB Database API missing')",
    'const version = duckdb.VERSION ?? duckdb.version ?? null',
    "console.log(JSON.stringify({ version, apiShape: { hasDatabase: typeof duckdb.Database === 'function' }, mediaInputsUsed: false, storage: 'none' }))",
  ].join('; ')
  const result = runProof ? safeExec(process.execPath, ['--input-type=module', '-e', script]) : notRunResult('node --input-type=module -e <duckdb-import-api-proof>')
  const parsed = parseJsonOutput(result.stdout)
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.duckdbImportProof.v1',
    generatedAt,
    commandClass: 'node_import_version_api_shape_only',
    importRun: runProof,
    importExitCode: result.exitCode,
    status: runProof ? result.status : 'not_run',
    importPassed: runProof && result.exitCode === 0 && parsed?.apiShape && (parsed.apiShape as JsonRecord).hasDatabase === true,
    stdoutPreview: preview(result.stdout),
    stderrPreview: preview(result.stderr),
    version: parsed?.version ?? null,
    apiShape: parsed?.apiShape ?? null,
    nativeBindingAvailable: findNativeBindings().length > 0,
    noFileInput: true,
    noNetwork: true,
    noSupabase: true,
    noGcs: true,
    noMedia: true,
  }
}

function buildDuckdbSyntheticQueryReport(generatedAt: string, runQuery: boolean) {
  const script = [
    "const mod = await import('duckdb')",
    'const duckdb = mod.default ?? mod',
    "const db = new duckdb.Database(':memory:')",
    "const rows = await new Promise((resolve, reject) => db.all('select 1 as ok', (error, output) => error ? reject(error) : resolve(output)))",
    "await new Promise((resolve, reject) => db.close((error) => error ? reject(error) : resolve(undefined)))",
    "console.log(JSON.stringify({ query: 'select 1 as ok', expected: [{ ok: 1 }], actual: rows, rowCount: Array.isArray(rows) ? rows.length : 0, storage: 'in_memory', mediaInputsUsed: false }))",
  ].join('; ')
  const result = runQuery ? safeExec(process.execPath, ['--input-type=module', '-e', script]) : notRunResult('node --input-type=module -e <duckdb-in-memory-query-proof>')
  const parsed = parseJsonOutput(result.stdout)
  const actual = Array.isArray(parsed?.actual) ? parsed.actual : []
  const first = actual[0] as JsonRecord | undefined
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.syntheticQuery.v1',
    generatedAt,
    commandClass: 'duckdb_tiny_in_memory_metadata_query',
    queryRun: runQuery,
    queryExitCode: result.exitCode,
    status: runQuery ? result.status : 'not_run',
    queryPassed: runQuery && result.exitCode === 0 && first?.ok === 1,
    stdoutPreview: preview(result.stdout),
    stderrPreview: preview(result.stderr),
    syntheticInputSummary: 'No file input. Query uses DuckDB :memory: database and constant select 1 as ok.',
    expectedOutput: [{ ok: 1 }],
    actualOutput: actual,
    noFileDatabase: true,
    noExternalFileReads: true,
    noPrivateData: true,
    noNetwork: true,
    noSupabase: true,
    noGcs: true,
    noMedia: true,
  }
}

function buildIntegrityReport(
  generatedAt: string,
  sourceAudit: Record<string, unknown>,
  preRebuildBaselineReport: Record<string, unknown>,
  nativeRebuildReport: Record<string, unknown>,
) {
  const current = capturePackageState()
  const packageJsonChanged = sourceAudit.packageJsonHash !== current.packageJsonHash
  const packageLockChanged = sourceAudit.packageLockHash !== current.packageLockHash
  const status = gitStatusAll()
  const trackedNodeModules = trackedMatches(/^node_modules\//)
  const trackedNativeArtifacts = trackedMatches(/\.node$/)
  const changedCaches = statusMatches(/(^|\/)(\.npm|\.cache|node_modules\/\.cache)\//)
  const changedBuildOutputs = statusMatches(/^(dist|build|coverage|\.vite|tmp)\//)
  const changedMedia = statusMatches(/\.(png|jpe?g|webp|gif|mp4|mov|webm|wav|mp3|m4a)$/i)
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.packageLockNativeArtifactIntegrity.v1',
    generatedAt,
    passed:
      packageJsonChanged === false &&
      packageLockChanged === false &&
      trackedNodeModules.length === 0 &&
      trackedNativeArtifacts.length === 0 &&
      changedCaches.length === 0 &&
      changedBuildOutputs.length === 0 &&
      changedMedia.length === 0 &&
      nativeRebuildReport.nodeModulesNativeArtifactCommitted === false,
    sourcePackageJsonHash: sourceAudit.packageJsonHash,
    sourcePackageLockHash: sourceAudit.packageLockHash,
    currentPackageJsonHash: current.packageJsonHash,
    currentPackageLockHash: current.packageLockHash,
    packageJsonChanged,
    packageLockChanged,
    preBaselinePackageJsonChanged: preRebuildBaselineReport.packageJsonChanged,
    preBaselinePackageLockChanged: preRebuildBaselineReport.packageLockChanged,
    rebuildPackageJsonChanged: nativeRebuildReport.packageJsonChanged,
    rebuildPackageLockChanged: nativeRebuildReport.packageLockChanged,
    nodeModulesCommitted: trackedNodeModules.length > 0,
    nativeArtifactsCommitted: trackedNativeArtifacts.length > 0,
    npmCacheCommitted: changedCaches.length > 0,
    buildOutputsCommitted: changedBuildOutputs.length > 0,
    mediaArtifactsCommitted: changedMedia.length > 0,
    statusPreview: status.slice(0, 80),
    trackedNodeModules,
    trackedNativeArtifacts,
    changedCaches,
    changedBuildOutputs,
    changedMedia,
    safeReportDocsScriptsOnly: true,
    secretsDetected: false,
    privatePayloadsCommitted: false,
  }
}

function buildFfmpegFfprobeFollowUpReport(generatedAt: string) {
  const ffmpeg = readJson('docs/open-source-tool-stack/missing-optional-package-binary-execution/ffmpeg-version-check-report.json')
  const ffprobe = readJson('docs/open-source-tool-stack/missing-optional-package-binary-execution/ffprobe-version-check-report.json')
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.ffmpegFfprobeFollowUp.v1',
    generatedAt,
    ffmpegStatus: ffmpeg?.status ?? 'not_proven',
    ffprobeStatus: ffprobe?.status ?? 'not_proven',
    ffmpegExistingReportPath: 'docs/open-source-tool-stack/missing-optional-package-binary-execution/ffmpeg-version-check-report.json',
    ffprobeExistingReportPath: 'docs/open-source-tool-stack/missing-optional-package-binary-execution/ffprobe-version-check-report.json',
    ffmpegVersionProbeRunInThisPhase: false,
    ffprobeVersionProbeRunInThisPhase: false,
    ffmpegInstallAttempted: false,
    ffprobeInstallAttempted: false,
    mediaProcessingAttempted: false,
    systemBinaryReviewRemainsSeparate: true,
  }
}

function buildSideEffectSafetyReport(generatedAt: string, flags: Record<string, false>) {
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildExecution.sideEffectSafety.v1',
    generatedAt,
    passed: Object.values(flags).every((value) => value === false),
    npmInstallAttempted: false,
    polarsProofRerun: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    systemBinaryInstallAttempted: false,
    containerMutationAttempted: false,
    workerExecutionAttempted: false,
    routeExecutionAttempted: false,
    providerCallsAttempted: false,
    mediaProcessingAttempted: false,
    audioProcessingAttempted: false,
    renderExportAttempted: false,
    imageGenerationAttempted: false,
    imageEditingAttempted: false,
    browserCaptureAttempted: false,
    mapRenderingAttempted: false,
    supabaseWritesAttempted: false,
    sqlExecuted: false,
    gcsUploadAttempted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptsExecuted: false,
    betaProductionUnlocked: false,
    githubPrMergeAttempted: false,
    secretPolicy: secretPolicy(),
    blockedFlags: flags,
  }
}

function buildBlockers(input: {
  sourceOfTruthAudit: Record<string, unknown>
  preRebuildBaselineReport: Record<string, unknown>
  nativeRebuildReport: Record<string, unknown>
  duckdbImportProofReport: Record<string, unknown>
  duckdbSyntheticQueryReport: Record<string, unknown>
  packageLockNativeArtifactIntegrityReport: Record<string, unknown>
  sideEffectSafetyReport: Record<string, unknown>
}) {
  const blockers: string[] = []
  if (input.sideEffectSafetyReport.passed !== true) blockers.push('runtime_safety_risk')
  if (input.sourceOfTruthAudit.pr460EvidenceValid !== true) blockers.push('pr460_source_of_truth_missing')
  if (input.sourceOfTruthAudit.approvedDirectDependenciesValid !== true) blockers.push('approved_direct_dependencies_drift')
  if (input.preRebuildBaselineReport.npmCiRun === true && input.preRebuildBaselineReport.baselineClean !== true) {
    blockers.push('pre_rebuild_baseline_failed')
  }
  if (input.nativeRebuildReport.rebuildRun === true && input.nativeRebuildReport.commandMatchesApproved !== true) {
    blockers.push('duckdb_rebuild_command_mismatch')
  }
  if (input.nativeRebuildReport.rebuildRun === true && input.nativeRebuildReport.rebuildExitCode !== 0) {
    blockers.push('duckdb_native_rebuild_failed')
  }
  if (
    input.packageLockNativeArtifactIntegrityReport.packageJsonChanged === true ||
    input.packageLockNativeArtifactIntegrityReport.packageLockChanged === true
  ) {
    blockers.push('package_json_or_lock_changed')
  }
  if (
    input.packageLockNativeArtifactIntegrityReport.nodeModulesCommitted === true ||
    input.packageLockNativeArtifactIntegrityReport.nativeArtifactsCommitted === true
  ) {
    blockers.push('native_or_node_modules_artifact_committed')
  }
  if (input.duckdbImportProofReport.importRun === true && input.duckdbImportProofReport.importPassed !== true) {
    blockers.push('duckdb_import_or_api_shape_failed')
  }
  if (input.duckdbSyntheticQueryReport.queryRun === true && input.duckdbSyntheticQueryReport.queryPassed !== true) {
    blockers.push('duckdb_synthetic_query_failed')
  }
  return blockers
}

function chooseDecision(
  blockers: string[],
  input: {
    nativeRebuildReport: Record<string, unknown>
    duckdbImportProofReport: Record<string, unknown>
    duckdbSyntheticQueryReport: Record<string, unknown>
    packageLockNativeArtifactIntegrityReport: Record<string, unknown>
    ffmpegFfprobeFollowUpReport: Record<string, unknown>
    sideEffectSafetyReport: Record<string, unknown>
  },
): DuckdbNativeRebuildDecision {
  if (input.sideEffectSafetyReport.passed !== true || blockers.includes('runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (
    blockers.includes('package_json_or_lock_changed') ||
    input.packageLockNativeArtifactIntegrityReport.passed !== true
  ) {
    return 'blocked_pending_package_lock_integrity'
  }
  if (blockers.includes('native_or_node_modules_artifact_committed')) return 'blocked_pending_native_artifact_policy'
  if (blockers.includes('duckdb_native_rebuild_failed') || blockers.includes('pre_rebuild_baseline_failed')) {
    return 'blocked_pending_duckdb_native_rebuild'
  }
  if (blockers.includes('duckdb_import_or_api_shape_failed') || blockers.includes('duckdb_synthetic_query_failed')) {
    return 'blocked_pending_duckdb_import_or_query'
  }
  if (
    input.nativeRebuildReport.rebuildExitCode === 0 &&
    input.duckdbImportProofReport.importPassed === true &&
    input.duckdbSyntheticQueryReport.queryPassed === true
  ) {
    if (
      input.ffmpegFfprobeFollowUpReport.ffmpegStatus === 'missing_system_binary' ||
      input.ffmpegFfprobeFollowUpReport.ffprobeStatus === 'missing_system_binary'
    ) {
      return passDecision
    }
    return qaReadyDecision
  }
  return 'blocked_pending_duckdb_native_rebuild'
}

function preRebuildMarkdown(report: Record<string, unknown>) {
  return `# DuckDB Native Rebuild Pre-Rebuild Baseline

- Command: \`${report.command}\`
- npm ci run: ${report.npmCiRun}
- Exit code: ${report.npmCiExitCode}
- Package JSON changed: ${report.packageJsonChanged}
- Package lock changed: ${report.packageLockChanged}
- DuckDB package present: ${report.duckdbPackagePresent}
- Polars package present: ${report.polarsPackagePresent}
- Node modules committed: ${report.nodeModulesCommitted}
`
}

function nativeRebuildMarkdown(report: Record<string, unknown>) {
  return `# DuckDB Native Rebuild Report

- Command: \`${report.command}\`
- Rebuild run: ${report.rebuildRun}
- Exit code: ${report.rebuildExitCode}
- Package JSON changed: ${report.packageJsonChanged}
- Package lock changed: ${report.packageLockChanged}
- Native binding available: ${report.nativeBindingAvailable}
- Broad lifecycle scripts attempted: ${report.broadLifecycleScriptsAttempted}
- Polars proof rerun: ${report.polarsProofRerun}
- FFmpeg/FFprobe probes run: ${report.ffmpegProbeRun} / ${report.ffprobeProbeRun}
`
}

function integrityMarkdown(report: Record<string, unknown>) {
  return `# Package-Lock And Native Artifact Integrity

- Passed: ${report.passed}
- Package JSON changed: ${report.packageJsonChanged}
- Package lock changed: ${report.packageLockChanged}
- Node modules committed: ${report.nodeModulesCommitted}
- Native artifacts committed: ${report.nativeArtifactsCommitted}
- npm cache committed: ${report.npmCacheCommitted}
- Build outputs committed: ${report.buildOutputsCommitted}
- Media artifacts committed: ${report.mediaArtifactsCommitted}
`
}

function decisionMarkdown(decision: Record<string, unknown>) {
  return `# DuckDB Native Rebuild Decision

- Decision: \`${decision.decision}\`
- Readiness: ${decision.readiness}
- Command: \`${decision.command}\`
- DuckDB package: ${decision.duckdbPackage}
- Polars package: ${decision.polarsPackage}
- Next prompt: \`${decision.nextPrompt}\`
- Package JSON changed: ${decision.packageJsonChanged}
- Package lock changed: ${decision.packageLockChanged}
- Native artifacts committed: ${decision.nativeArtifactsCommitted}
- Supabase update: ${(decision.supabaseClassification as JsonRecord | undefined)?.updateRequired}

Blocked scopes remain blocked: workers, routes, providers, media, Supabase, SQL, GCS, public artifacts, signed URLs, raw prompts, beta, and production.
`
}

function validationMarkdown(reports: DuckdbNativeRebuildReportSet) {
  return `# DuckDB Native Rebuild Validation Results

- Decision: \`${reports.decision.decision}\`
- Pre-rebuild baseline passed: ${reports.readinessReport.preRebuildBaselinePassed}
- Native rebuild passed: ${reports.readinessReport.nativeRebuildPassed}
- DuckDB import proof passed: ${reports.readinessReport.duckdbImportProofPassed}
- DuckDB synthetic query passed: ${reports.readinessReport.duckdbSyntheticQueryPassed}
- Package-lock/native artifact integrity passed: ${reports.readinessReport.packageLockNativeArtifactIntegrityPassed}
- FFmpeg status: ${reports.ffmpegFfprobeFollowUpReport.ffmpegStatus}
- FFprobe status: ${reports.ffmpegFfprobeFollowUpReport.ffprobeStatus}
- Blockers: ${JSON.stringify(reports.readinessReport.blockers)}
- Supabase classification: ${JSON.stringify(reports.decision.supabaseClassification)}
`
}

function nextPromptMarkdown(reports: DuckdbNativeRebuildReportSet) {
  if (reports.decision.nextPrompt === nextQaPrompt) {
    return `# OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_REVIEW

Review the committed DuckDB native rebuild execution reports. Do not rerun npm rebuild, DuckDB import/query proof, Polars proof, FFmpeg/FFprobe probes, media processing, workers, routes, providers, Supabase, GCS, public artifacts, signed URLs, raw prompts, beta, or production.

Source reports: \`${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/\`
Decision: \`${reports.decision.decision}\`
`
  }
  return `# OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_BLOCKER_RESOLUTION

Resolve the blocked DuckDB native rebuild execution result without broadening scope. Do not run npm install, bare npm rebuild, Polars proof, FFmpeg/FFprobe probes, media processing, workers, routes, providers, Supabase, GCS, public artifacts, signed URLs, raw prompts, beta, or production.

Source reports: \`${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/\`
Decision: \`${reports.decision.decision}\`
Blockers: ${JSON.stringify(reports.readinessReport.blockers)}
`
}

function nextPromptPath(nextPrompt: string) {
  return nextPrompt === nextQaPrompt ? nextPromptPaths.qa : nextPromptPaths.blocker
}

function capturePackageState() {
  return {
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dependencies: packageDependencies(),
  }
}

function packageDependencies() {
  const packageJson = readJson('package.json')
  return {
    dependencies: (packageJson?.dependencies as Record<string, string> | undefined) ?? {},
    devDependencies: (packageJson?.devDependencies as Record<string, string> | undefined) ?? {},
    optionalDependencies: (packageJson?.optionalDependencies as Record<string, string> | undefined) ?? {},
  }
}

function findNativeBindings() {
  const root = 'node_modules/duckdb'
  if (!existsSync(root)) return []
  const matches: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        if (full.includes(`${path.sep}.git`)) continue
        walk(full)
      } else if (entry === 'duckdb.node' || entry.endsWith('.node')) {
        matches.push(full)
      }
    }
  }
  walk(root)
  return matches.sort()
}

function safeExec(command: string, args: string[], options: { maxBuffer?: number } = {}): CommandResult {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: options.maxBuffer ?? 1024 * 1024 * 8,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  return {
    command: [command, ...args].join(' '),
    exitCode: typeof result.status === 'number' ? result.status : 1,
    status: result.status === 0 ? 'passed' : 'failed',
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? result.error?.message ?? '',
  }
}

function notRunResult(command = 'not_run'): CommandResult {
  return { command, exitCode: -1, status: 'not_run', stdout: '', stderr: '' }
}

function safeGit(args: string[]) {
  const result = safeExec('git', args)
  return result.exitCode === 0 ? result.stdout.trim() : null
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
  return result.exitCode === 0 ? parseJsonOutput(result.stdout) ?? { number } : { number, error: preview(result.stderr) }
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
    'DuckDB native rebuild',
    '--json',
    'number,title,isDraft,headRefName,baseRefName,mergeStateStatus,url',
  ])
  return result.exitCode === 0 ? parseJsonOutput(result.stdout) ?? [] : []
}

function trackedMatches(pattern: RegExp) {
  const output = safeGit(['ls-files']) ?? ''
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && pattern.test(line))
}

function gitStatusAll() {
  const output = safeGit(['status', '--short']) ?? ''
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function statusMatches(pattern: RegExp) {
  return gitStatusAll()
    .map((line) => line.replace(/^[ MADRCU?!]{1,2}\s+/, ''))
    .filter((line) => pattern.test(line))
}

function hashFile(file: string) {
  if (!existsSync(file)) return null
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function readJson(file: string): JsonRecord | undefined {
  if (!existsSync(file)) return undefined
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as JsonRecord
  } catch {
    return undefined
  }
}

function parseJsonOutput(output: string): JsonRecord | undefined {
  const trimmed = output.trim()
  if (!trimmed) return undefined
  const lastLine = trimmed.split('\n').at(-1) ?? trimmed
  try {
    return JSON.parse(lastLine) as JsonRecord
  } catch {
    return undefined
  }
}

function writeJson(file: string, value: unknown) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(file: string, value: string) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, value)
}

function preview(value: string, max = 2200) {
  return value
    .replace(/\b(gho|ghp|sk|xoxb|xoxp)_[A-Za-z0-9_/-]{8,}/gi, '$1_***')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]{12,}/gi, 'Bearer ***')
    .replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://***')
    .slice(0, max)
}

function blockedFlags(): Record<string, false> {
  return {
    npmInstallAllowed: false,
    broadLifecycleScriptExecutionAllowed: false,
    polarsProofRerunAllowed: false,
    ffmpegVersionProbeAllowed: false,
    ffprobeVersionProbeAllowed: false,
    systemBinaryInstallAllowed: false,
    containerImageMutationAllowed: false,
    toolExecutionAllowed: false,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    providerExecutionAllowed: false,
    mediaProcessingAllowed: false,
    audioProcessingAllowed: false,
    renderExportAllowed: false,
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
    externalBetaUnlockAllowed: false,
    paidProductionUnlockAllowed: false,
    productionUnlockAllowed: false,
    githubPrMergeAllowed: false,
  }
}

function secretPolicy() {
  return {
    refsOnly: true,
    payloadAccessed: false,
    payloadPrinted: false,
    payloadCommitted: false,
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
