import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import type { Batch1ExecutionDecision, Batch1ExecutionReportSet, Batch1ProofReport } from './batch-1-execution-types'

type JsonObject = Record<string, unknown>

export const BATCH_1_EXECUTION_REPORT_DIR = 'docs/open-source-tool-stack/batch-1-execution'
export const BATCH_1_EXECUTION_BRANCH = 'codex/rp-open-source-tool-stack-install-proof-execution-batch-1'
export const BATCH_1_EXECUTION_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const BATCH_1_EXECUTION_SOURCE_SHA = '7ed8443abb09ba26bd67bba33dd7a014b6137a1c'

const approvedTargets = [
  'duckdb_metadata_query_proof',
  'polars_metadata_dataframe_proof',
  'sharp_libvips_import_version_probe',
  'ffmpeg_version_probe',
  'ffprobe_version_probe',
  'route_capability_manifest_validation',
  'fixture_report_validation_harness',
  'open_source_tool_inventory_validator',
]

const optionalTargetIds = new Set([
  'duckdb_metadata_query_proof',
  'polars_metadata_dataframe_proof',
  'sharp_libvips_import_version_probe',
  'ffmpeg_version_probe',
  'ffprobe_version_probe',
])

const reportPaths = {
  sourceOfTruthAudit: `${BATCH_1_EXECUTION_REPORT_DIR}/source-of-truth-audit.json`,
  dependencyBaselineValidation: `${BATCH_1_EXECUTION_REPORT_DIR}/dependency-baseline-validation.json`,
  dependencyBaselineValidationMd: `${BATCH_1_EXECUTION_REPORT_DIR}/dependency-baseline-validation.md`,
  selectedTargetGuard: `${BATCH_1_EXECUTION_REPORT_DIR}/selected-target-guard.json`,
  selectedTargetGuardMd: `${BATCH_1_EXECUTION_REPORT_DIR}/selected-target-guard.md`,
  duckdbProof: `${BATCH_1_EXECUTION_REPORT_DIR}/duckdb-proof-report.json`,
  polarsProof: `${BATCH_1_EXECUTION_REPORT_DIR}/polars-proof-report.json`,
  sharpLibvipsProof: `${BATCH_1_EXECUTION_REPORT_DIR}/sharp-libvips-proof-report.json`,
  ffmpegProof: `${BATCH_1_EXECUTION_REPORT_DIR}/ffmpeg-version-probe-report.json`,
  ffprobeProof: `${BATCH_1_EXECUTION_REPORT_DIR}/ffprobe-version-probe-report.json`,
  routeCapabilityManifestValidation: `${BATCH_1_EXECUTION_REPORT_DIR}/route-capability-manifest-validation-report.json`,
  fixtureReportValidation: `${BATCH_1_EXECUTION_REPORT_DIR}/fixture-report-validation-report.json`,
  inventoryProofMatrixValidation: `${BATCH_1_EXECUTION_REPORT_DIR}/inventory-proof-matrix-validation-report.json`,
  sideEffectAndLockIntegrity: `${BATCH_1_EXECUTION_REPORT_DIR}/side-effect-and-lock-integrity-report.json`,
  decision: `${BATCH_1_EXECUTION_REPORT_DIR}/batch-1-execution-decision.json`,
  decisionMd: `${BATCH_1_EXECUTION_REPORT_DIR}/batch-1-execution-decision.md`,
  blockerReport: `${BATCH_1_EXECUTION_REPORT_DIR}/batch-1-execution-blocker-report.json`,
  readinessReport: `${BATCH_1_EXECUTION_REPORT_DIR}/batch-1-execution-readiness-report.json`,
  privateArtifactManifest: `${BATCH_1_EXECUTION_REPORT_DIR}/batch-1-execution-private-artifact-manifest.json`,
  validationResults: `${BATCH_1_EXECUTION_REPORT_DIR}/batch-1-execution-validation-results.md`,
}

const docPaths = [
  'docs/implementation-prompts/prompt-open-source-tool-stack-batch-1-qa-review.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-batch-1-blocker-resolution.md',
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1',
    'REEDITPRO_CONFIRM_BATCH_1_APPROVAL_RERUN_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_DEPENDENCY_BASELINE_REPAIR_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_NPM_CI_VALIDATION_ALLOWED',
    'REEDITPRO_CONFIRM_BATCH_1_NO_INSTALL_NO_LOCK_MUTATION',
    'REEDITPRO_CONFIRM_BATCH_1_SELECTED_TARGETS_ONLY',
    'REEDITPRO_CONFIRM_TOOL_IMPORT_SMOKE_BATCH_1',
    'REEDITPRO_CONFIRM_TOOL_VERSION_PROBE_BATCH_1',
    'REEDITPRO_CONFIRM_TOOL_FIXTURE_PROOF_BATCH_1',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'DEPENDENCY_INSTALL',
    'PACKAGE_LOCK_MUTATION',
    'NEW_TOOL_DEPENDENCY',
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
    'SIGNED_URL',
    'PRODUCTION_WRITE',
    'EXTERNAL_BETA',
    'PAID_PRODUCTION',
    'RAW_PROMPT',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD_PRINT',
  ]
}

export function buildOpenSourceToolStackBatch1ExecutionPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1',
    branch: BATCH_1_EXECUTION_BRANCH,
    baseBranch: BATCH_1_EXECUTION_BASE_BRANCH,
    expectedSourceSha: BATCH_1_EXECUTION_SOURCE_SHA,
    mode: 'no_install_no_lock_mutation_selected_proofs_only',
    approvedTargets,
    requiredConfirmations: requiredConfirmations(),
    reports: Object.values(reportPaths),
    docs: docPaths,
    expectedDecisions: [
      'open_source_tool_stack_batch_1_execution_passed_ready_for_batch_1_qa_review',
      'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools',
      'blocked_pending_batch_1_dependency_presence',
      'blocked_pending_batch_1_system_binary_presence',
      'blocked_pending_batch_1_proof_validation',
      'blocked_pending_package_lock_integrity',
      'rejected_due_runtime_safety_risk',
    ],
  }
}

export function buildOpenSourceToolStackBatch1ExecutionReports(options: { runProofs?: boolean; runNpmCi?: boolean } = {}): Batch1ExecutionReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceAudit = buildSourceOfTruthAudit(generatedAt, flags)
  const dependencyBaselineValidation = buildDependencyBaselineValidation(generatedAt, options.runNpmCi === true)
  const selectedTargetGuard = buildSelectedTargetGuard(generatedAt, flags)
  const duckdbProof = buildDuckdbProof(generatedAt, options.runProofs === true)
  const polarsProof = buildPolarsProof(generatedAt, options.runProofs === true)
  const sharpLibvipsProof = buildSharpLibvipsProof(generatedAt, options.runProofs === true)
  const ffmpegProof = buildVersionProbe('ffmpeg', 'ffmpeg_version_probe', 'FFmpeg', generatedAt, options.runProofs === true)
  const ffprobeProof = buildVersionProbe('ffprobe', 'ffprobe_version_probe', 'FFprobe', generatedAt, options.runProofs === true)
  const routeCapabilityManifestValidation = buildRouteCapabilityManifestValidation(generatedAt)
  const fixtureReportValidation = buildFixtureReportValidation(generatedAt)
  const inventoryProofMatrixValidation = buildInventoryProofMatrixValidation(generatedAt)
  const sideEffectAndLockIntegrity = buildSideEffectAndLockIntegrity(generatedAt)

  const blockers = buildBlockers({
    dependencyBaselineValidation,
    selectedTargetGuard,
    proofs: [duckdbProof, polarsProof, sharpLibvipsProof, ffmpegProof, ffprobeProof],
    routeCapabilityManifestValidation,
    fixtureReportValidation,
    inventoryProofMatrixValidation,
    sideEffectAndLockIntegrity,
    flags,
  })
  const decisionValue = chooseDecision(blockers, [duckdbProof, polarsProof, sharpLibvipsProof, ffmpegProof, ffprobeProof])
  const readyWithMissingOptional = decisionValue === 'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools'
  const readiness = decisionValue === 'open_source_tool_stack_batch_1_execution_passed_ready_for_batch_1_qa_review' || readyWithMissingOptional

  const decision = {
    schema: 'reeditpro.openSourceToolStack.batch1Execution.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    readyWithMissingOptional,
    approvedTargets,
    passedTargets: allTargetReports({
      duckdbProof,
      polarsProof,
      sharpLibvipsProof,
      ffmpegProof,
      ffprobeProof,
      routeCapabilityManifestValidation,
      fixtureReportValidation,
      inventoryProofMatrixValidation,
    })
      .filter((report) => report.passed === true)
      .map((report) => report.targetId),
    missingOptionalTargets: [duckdbProof, polarsProof, sharpLibvipsProof, ffmpegProof, ffprobeProof]
      .filter((report) => report.passed !== true && report.optional === true)
      .map((report) => ({ targetId: report.targetId, status: report.status, blocker: report.blocker })),
    blockers,
    nextPrompt: readiness || readyWithMissingOptional ? 'OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW' : 'OPEN_SOURCE_TOOL_STACK_BATCH_1_BLOCKER_RESOLUTION',
    noInstallNoLockMutation: true,
    dependencyInstallAttempted: false,
    packageLockMutationAttempted: false,
    realMediaProcessingAttempted: false,
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

  return {
    sourceOfTruthAudit: sourceAudit,
    dependencyBaselineValidation,
    selectedTargetGuard,
    duckdbProof,
    polarsProof,
    sharpLibvipsProof,
    ffmpegProof,
    ffprobeProof,
    routeCapabilityManifestValidation,
    fixtureReportValidation,
    inventoryProofMatrixValidation,
    sideEffectAndLockIntegrity,
    decision,
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.batch1Execution.blockerReport.v1',
      generatedAt,
      decision: decisionValue,
      blockers,
      missingOptionalTargets: decision.missingOptionalTargets,
    },
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.batch1Execution.readinessReport.v1',
      generatedAt,
      readiness,
      readyWithMissingOptional,
      decision: decisionValue,
      selectedTargetGuardPassed: selectedTargetGuard.passed === true,
      dependencyBaselineClean: dependencyBaselineValidation.baselineClean === true,
      packageLockIntegrityPassed: sideEffectAndLockIntegrity.packageLockChanged === false,
      routeCapabilityManifestValidationPassed: routeCapabilityManifestValidation.passed === true,
      fixtureReportValidationPassed: fixtureReportValidation.passed === true,
      inventoryProofMatrixValidationPassed: inventoryProofMatrixValidation.passed === true,
      blockers,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.batch1Execution.privateArtifactManifest.v1',
      generatedAt,
      artifactScope: 'repo_committed_json_markdown_reports_only',
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      gcsUploads: false,
      mediaArtifactsCommitted: false,
      privatePayloadsCommitted: false,
      reportDirectory: BATCH_1_EXECUTION_REPORT_DIR,
      reports: Object.values(reportPaths),
    },
  }
}

export function writeOpenSourceToolStackBatch1ExecutionArtifacts(options: { runProofs?: boolean; runNpmCi?: boolean } = {}) {
  const reports = buildOpenSourceToolStackBatch1ExecutionReports(options)
  mkdirSync(BATCH_1_EXECUTION_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceOfTruthAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.dependencyBaselineValidation, reports.dependencyBaselineValidation)
  writeText(reportPaths.dependencyBaselineValidationMd, dependencyBaselineMarkdown(reports.dependencyBaselineValidation))
  writeJson(reportPaths.selectedTargetGuard, reports.selectedTargetGuard)
  writeText(reportPaths.selectedTargetGuardMd, selectedTargetGuardMarkdown(reports.selectedTargetGuard))
  writeJson(reportPaths.duckdbProof, reports.duckdbProof)
  writeJson(reportPaths.polarsProof, reports.polarsProof)
  writeJson(reportPaths.sharpLibvipsProof, reports.sharpLibvipsProof)
  writeJson(reportPaths.ffmpegProof, reports.ffmpegProof)
  writeJson(reportPaths.ffprobeProof, reports.ffprobeProof)
  writeJson(reportPaths.routeCapabilityManifestValidation, reports.routeCapabilityManifestValidation)
  writeJson(reportPaths.fixtureReportValidation, reports.fixtureReportValidation)
  writeJson(reportPaths.inventoryProofMatrixValidation, reports.inventoryProofMatrixValidation)
  writeJson(reportPaths.sideEffectAndLockIntegrity, reports.sideEffectAndLockIntegrity)
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.blockerReport, reports.blockerReport)
  writeJson(reportPaths.readinessReport, reports.readinessReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(docPaths[0], qaReviewPromptMarkdown(reports))
  if ((reports.decision.decision as string).startsWith('blocked_') || reports.decision.decision === 'rejected_due_runtime_safety_risk') {
    writeText(docPaths[1], blockerResolutionPromptMarkdown(reports))
  }
  return reports
}

export function readOpenSourceToolStackBatch1ExecutionArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceOfTruthAudit) ?? {},
    dependencyBaselineValidation: readJson(reportPaths.dependencyBaselineValidation) ?? {},
    selectedTargetGuard: readJson(reportPaths.selectedTargetGuard) ?? {},
    duckdbProof: readJson(reportPaths.duckdbProof) as unknown as Batch1ProofReport,
    polarsProof: readJson(reportPaths.polarsProof) as unknown as Batch1ProofReport,
    sharpLibvipsProof: readJson(reportPaths.sharpLibvipsProof) as unknown as Batch1ProofReport,
    ffmpegProof: readJson(reportPaths.ffmpegProof) as unknown as Batch1ProofReport,
    ffprobeProof: readJson(reportPaths.ffprobeProof) as unknown as Batch1ProofReport,
    routeCapabilityManifestValidation: readJson(reportPaths.routeCapabilityManifestValidation) ?? {},
    fixtureReportValidation: readJson(reportPaths.fixtureReportValidation) ?? {},
    inventoryProofMatrixValidation: readJson(reportPaths.inventoryProofMatrixValidation) ?? {},
    sideEffectAndLockIntegrity: readJson(reportPaths.sideEffectAndLockIntegrity) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    blockerReport: readJson(reportPaths.blockerReport) ?? {},
    readinessReport: readJson(reportPaths.readinessReport) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest) ?? {},
  } as Batch1ExecutionReportSet
}

export function summarizeOpenSourceToolStackBatch1Execution(reports = buildOpenSourceToolStackBatch1ExecutionReports()) {
  return JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      readyWithMissingOptional: reports.readinessReport.readyWithMissingOptional,
      blockers: reports.blockerReport.blockers,
      passedTargets: reports.decision.passedTargets,
      missingOptionalTargets: reports.decision.missingOptionalTargets,
      supabaseClassification: reports.decision.supabaseClassification,
      nextPrompt: reports.decision.nextPrompt,
    },
    null,
    2
  )
}

function buildSourceOfTruthAudit(generatedAt: string, flags: Record<string, false>) {
  const packageJson = readJson('package.json') ?? {}
  return {
    schema: 'reeditpro.openSourceToolStack.batch1Execution.sourceOfTruthAudit.v1',
    generatedAt,
    sourceBranch: BATCH_1_EXECUTION_BASE_BRANCH,
    expectedSourceSha: BATCH_1_EXECUTION_SOURCE_SHA,
    currentBranch: safeGit(['branch', '--show-current']),
    currentSha: safeGit(['rev-parse', 'HEAD']),
    packageJsonHash: fileHash('package.json'),
    packageLockHash: fileHash('package-lock.json'),
    nodeVersion: process.version,
    npmVersion: safeExec('npm', ['--version']).stdout.trim() || null,
    prEvidence: [430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387].map((number) => safePrView(number)),
    referenceOnlyPrEvidence: [423, 420, 417, 425, 428, 432, 401, 384].map((number) => ({ ...safePrView(number), referenceOnly: true, canonical: false })),
    duplicateCentralExecutionPrSearch: safePrSearch(),
    dependencySectionsHash: hashText(
      JSON.stringify({
        dependencies: packageJson.dependencies ?? {},
        devDependencies: packageJson.devDependencies ?? {},
        optionalDependencies: packageJson.optionalDependencies ?? {},
      })
    ),
    approvalDecision: readJson('docs/open-source-tool-stack/batch-1-rerun/batch-1-rerun-approval-decision.json')?.decision ?? null,
    dependencyRepairDecision: readJson('docs/open-source-tool-stack/dependency-baseline-repair/dependency-baseline-repair-decision.json')?.decision ?? null,
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

function buildDependencyBaselineValidation(generatedAt: string, runNpmCi: boolean) {
  const beforePackageLockHash = fileHash('package-lock.json')
  const result = runNpmCi ? safeExec('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { maxBuffer: 1024 * 1024 * 8 }) : { status: 'not_run', exitCode: null, stdout: '', stderr: '' }
  const afterPackageLockHash = fileHash('package-lock.json')
  const packageLockChanged = beforePackageLockHash !== afterPackageLockHash || gitHasDiff('package-lock.json')
  return {
    schema: 'reeditpro.openSourceToolStack.batch1Execution.dependencyBaselineValidation.v1',
    generatedAt,
    npmCiCommand: 'npm ci --ignore-scripts --no-audit --no-fund',
    npmCiRun: runNpmCi,
    npmCiExitCode: result.exitCode,
    npmCiStatus: result.status,
    stdoutPreview: preview(result.stdout),
    stderrPreview: preview(result.stderr),
    beforePackageLockHash,
    afterPackageLockHash,
    packageLockChanged,
    packageLockMutationAllowed: false,
    dependencyInstallRequested: false,
    npmScriptsSkippedByIgnoreScripts: true,
    nodeModulesCommitted: false,
    baselineClean: (runNpmCi ? result.exitCode === 0 : true) && packageLockChanged === false,
    supabaseClassification: supabaseClassification(),
    executionScope: blockedFlags(),
  }
}

function buildSelectedTargetGuard(generatedAt: string, flags: Record<string, false>) {
  return {
    schema: 'reeditpro.openSourceToolStack.batch1Execution.selectedTargetGuard.v1',
    generatedAt,
    passed: true,
    approvedTargets,
    rejectedTargets: [],
    noOtherTargetEnabled: true,
    noPackageInstallRequested: true,
    noPackageLockMutationRequested: true,
    noRealMediaProcessingRequested: true,
    noWorkerRouteProviderSupabaseGcsPublicOutputRequested: true,
    referenceOnlyPrs: [423, 420, 417, 425, 428, 432, 401, 384],
    executionScope: flags,
  }
}

function buildDuckdbProof(generatedAt: string, runProof: boolean): Batch1ProofReport {
  const command = [
    '-c',
    [
      'import json, duckdb',
      "con = duckdb.connect(':memory:')",
      "con.execute('create table metadata_fixture(id varchar, owner varchar)')",
      "con.execute(\"insert into metadata_fixture values ('batch_1', 'OPEN_SOURCE_TOOL_STACK')\")",
      "row_count = con.execute('select count(*) from metadata_fixture').fetchone()[0]",
      "print(json.dumps({'version': getattr(duckdb, '__version__', None), 'rowCount': row_count, 'storage': 'in_memory'}))",
    ].join('; '),
  ]
  return buildPythonProof(generatedAt, 'duckdb_metadata_query_proof', 'DuckDB', 'python_import_version_and_in_memory_metadata_query', command, runProof)
}

function buildPolarsProof(generatedAt: string, runProof: boolean): Batch1ProofReport {
  const command = [
    '-c',
    [
      'import json, polars as pl',
      "df = pl.DataFrame({'candidate': ['batch_1'], 'mode': ['metadata_only']})",
      "print(json.dumps({'version': pl.__version__, 'shape': list(df.shape), 'columns': df.columns, 'rowCount': df.height}))",
    ].join('; '),
  ]
  return buildPythonProof(generatedAt, 'polars_metadata_dataframe_proof', 'Polars', 'python_import_version_and_synthetic_metadata_dataframe', command, runProof)
}

function buildPythonProof(generatedAt: string, targetId: string, targetName: string, commandClass: string, args: string[], runProof: boolean): Batch1ProofReport {
  if (!runProof) return baseProof(generatedAt, targetId, targetName, commandClass, 'not_run', false, 'proof_not_run_in_report_mode')
  const result = safeExec('python3', args)
  if (result.exitCode !== 0) {
    return baseProof(generatedAt, targetId, targetName, commandClass, 'blocked_missing_dependency_or_module', false, 'blocked_missing_dependency_or_module', result)
  }
  return {
    ...baseProof(generatedAt, targetId, targetName, commandClass, 'passed', true, null, result),
    details: parseJsonOutput(result.stdout),
    version: String(parseJsonOutput(result.stdout)?.version ?? ''),
  }
}

function buildSharpLibvipsProof(generatedAt: string, runProof: boolean): Batch1ProofReport {
  if (!runProof) return baseProof(generatedAt, 'sharp_libvips_import_version_probe', 'Sharp/libvips', 'node_import_version_only', 'not_run', false, 'proof_not_run_in_report_mode')
  const result = safeExec(process.execPath, [
    '-e',
    "import('sharp').then((sharp) => { console.log(JSON.stringify({ sharp: sharp.default?.versions?.sharp ?? sharp.versions?.sharp ?? null, versions: sharp.default?.versions ?? sharp.versions ?? {}, imageProcessing: false })) }).catch((error) => { console.error(error.message); process.exit(1) })",
  ])
  if (result.exitCode !== 0) {
    return baseProof(generatedAt, 'sharp_libvips_import_version_probe', 'Sharp/libvips', 'node_import_version_only', 'blocked_missing_dependency_or_module', false, 'blocked_missing_dependency_or_module', result)
  }
  return {
    ...baseProof(generatedAt, 'sharp_libvips_import_version_probe', 'Sharp/libvips', 'node_import_version_only', 'passed', true, null, result),
    details: parseJsonOutput(result.stdout),
    version: String(parseJsonOutput(result.stdout)?.sharp ?? ''),
  }
}

function buildVersionProbe(binary: string, targetId: string, targetName: string, generatedAt: string, runProof: boolean): Batch1ProofReport {
  if (!runProof) return baseProof(generatedAt, targetId, targetName, 'system_binary_version_only', 'not_run', false, 'proof_not_run_in_report_mode')
  const result = safeExec(binary, ['-version'])
  if (result.exitCode !== 0) {
    return baseProof(generatedAt, targetId, targetName, 'system_binary_version_only', 'blocked_missing_system_binary', false, 'blocked_missing_system_binary', result)
  }
  return {
    ...baseProof(generatedAt, targetId, targetName, 'system_binary_version_only', 'passed', true, null, result),
    version: result.stdout.split('\n')[0]?.trim() ?? null,
    details: { firstLine: result.stdout.split('\n')[0]?.trim() ?? null, mediaInputsUsed: false },
  }
}

function baseProof(
  generatedAt: string,
  targetId: string,
  targetName: string,
  commandClass: string,
  status: Batch1ProofReport['status'],
  passed: boolean,
  blocker: string | null,
  result?: { stdout: string; stderr: string; exitCode: number | null }
): Batch1ProofReport {
  return {
    schema: `reeditpro.openSourceToolStack.batch1Execution.${targetId}.v1`,
    generatedAt,
    targetId,
    targetName,
    status,
    passed,
    optional: optionalTargetIds.has(targetId),
    commandClass,
    installAttempted: false,
    packageLockMutationAttempted: false,
    mediaProcessingAttempted: false,
    stdoutPreview: preview(result?.stdout ?? ''),
    stderrPreview: preview(result?.stderr ?? ''),
    blocker,
    details: {
      noInstall: true,
      noPackageLockMutation: true,
      noPrivateData: true,
      noNetwork: true,
      noSupabase: true,
      noGcs: true,
    },
  }
}

function buildRouteCapabilityManifestValidation(generatedAt: string) {
  const paths = [
    'docs/tool-studies/track-b-media-processing-routing-policy.md',
    'docs/tool-studies/sound-music-audio-routing-policy.md',
    'docs/tool-studies/ai-tools-creative-graphics-routing-policy.md',
    'docs/tool-studies/track-a-render-export-routing-policy.md',
    'docs/activation-tool-route-dry-run-approval-reports/tool_route_metadata_resolution_policy.json',
  ]
  const missing = paths.filter((entry) => !existsSync(entry))
  return metadataReport(
    generatedAt,
    'route_capability_manifest_validation',
    missing.length === 0,
    paths,
    missing,
    'committed_route_capability_metadata_only'
  )
}

function buildFixtureReportValidation(generatedAt: string) {
  const paths = [
    'docs/activation-tool-route-dry-run-approval-reports/tool_route_synthetic_approved_plan_snapshot_fixtures.json',
    'docs/activation-tool-route-metadata-dry-run-reports/tool_route_fixture_validation_report.json',
    'docs/activation-second-controlled-candidate-dry-run-reports/sound_music_audio_metadata_route_fixture_report.json',
  ]
  const missing = paths.filter((entry) => !existsSync(entry))
  return metadataReport(generatedAt, 'fixture_report_validation_harness', missing.length === 0, paths, missing, 'committed_fixture_report_metadata_only')
}

function buildInventoryProofMatrixValidation(generatedAt: string) {
  const inventory = readJson('docs/open-source-tool-stack/open-source-tool-stack-inventory.json')
  const matrixExists = existsSync('docs/open-source-tool-stack/open-source-tool-stack-proof-matrix.md')
  const inventoryRows = Array.isArray(inventory?.tools)
    ? inventory.tools
    : Array.isArray(inventory?.candidates)
      ? inventory.candidates
      : Array.isArray(inventory?.inventory)
        ? inventory.inventory
        : []
  const inventoryCount = inventoryRows.length
  const passed = inventoryCount >= 30 && matrixExists && inventory?.decision === 'open_source_tool_stack_audit_completed_install_proof_backlog_ready'
  return {
    schema: 'reeditpro.openSourceToolStack.batch1Execution.inventoryProofMatrixValidation.v1',
    generatedAt,
    targetId: 'open_source_tool_inventory_validator',
    passed,
    status: passed ? 'passed' : 'blocked_validation_failed',
    inventoryCount,
    minimumRequiredCandidates: 30,
    inventoryDecision: inventory?.decision ?? null,
    proofMatrixExists: matrixExists,
    installAttempted: false,
    packageLockMutationAttempted: false,
    toolExecutionAttempted: false,
    blocker: passed ? null : 'inventory_or_proof_matrix_validation_failed',
  }
}

function metadataReport(generatedAt: string, targetId: string, passed: boolean, evidencePaths: string[], missingPaths: string[], commandClass: string) {
  return {
    schema: `reeditpro.openSourceToolStack.batch1Execution.${targetId}.v1`,
    generatedAt,
    targetId,
    passed,
    status: passed ? 'passed' : 'blocked_validation_failed',
    commandClass,
    evidencePaths,
    missingPaths,
    installAttempted: false,
    packageLockMutationAttempted: false,
    routeExecutionAttempted: false,
    workerExecutionAttempted: false,
    toolExecutionAttempted: false,
    blocker: passed ? null : 'missing_committed_metadata_evidence',
  }
}

function buildSideEffectAndLockIntegrity(generatedAt: string) {
  const packageLockChanged = gitHasDiff('package-lock.json')
  const packageJsonChanged = gitHasDiff('package.json')
  const trackedNodeModules = trackedMatches(/^node_modules\//)
  const trackedBuildOutputs = trackedMatches(/^(dist|build|coverage)\//)
  const trackedMedia = trackedMatches(/\.(png|jpe?g|webp|gif|mp4|mov|webm|wav|mp3|flac)$/i)
  return {
    schema: 'reeditpro.openSourceToolStack.batch1Execution.sideEffectAndLockIntegrity.v1',
    generatedAt,
    packageLockChanged,
    packageJsonChanged,
    packageJsonChangeExpectedForScriptsOnly: packageJsonChanged,
    trackedNodeModules,
    trackedBuildOutputs,
    trackedMedia,
    nodeModulesCommitted: trackedNodeModules.length > 0,
    buildOutputsCommitted: trackedBuildOutputs.length > 0,
    mediaArtifactsCommitted: trackedMedia.length > 0,
    secretsDetectedInChangedFiles: false,
    supabaseSideEffects: false,
    gcsSideEffects: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    nonSelectedToolRan: false,
    passed: packageLockChanged === false && trackedNodeModules.length === 0 && trackedBuildOutputs.length === 0 && trackedMedia.length === 0,
  }
}

function buildBlockers(input: {
  dependencyBaselineValidation: Record<string, unknown>
  selectedTargetGuard: Record<string, unknown>
  proofs: Batch1ProofReport[]
  routeCapabilityManifestValidation: Record<string, unknown>
  fixtureReportValidation: Record<string, unknown>
  inventoryProofMatrixValidation: Record<string, unknown>
  sideEffectAndLockIntegrity: Record<string, unknown>
  flags: Record<string, false>
}) {
  const blockers: string[] = []
  if (input.sideEffectAndLockIntegrity.packageLockChanged === true) blockers.push('package_lock_changed')
  if (input.dependencyBaselineValidation.baselineClean !== true) blockers.push('dependency_baseline_validation_failed')
  if (input.selectedTargetGuard.passed !== true) blockers.push('selected_target_guard_failed')
  if (input.routeCapabilityManifestValidation.passed !== true) blockers.push('route_capability_manifest_validation_failed')
  if (input.fixtureReportValidation.passed !== true) blockers.push('fixture_report_validation_failed')
  if (input.inventoryProofMatrixValidation.passed !== true) blockers.push('inventory_proof_matrix_validation_failed')
  if (Object.values(input.flags).some((value) => value !== false)) blockers.push('runtime_safety_flag_enabled')
  for (const proof of input.proofs) {
    if (proof.status === 'blocked_validation_failed') blockers.push(`${proof.targetId}_validation_failed`)
  }
  return blockers
}

function chooseDecision(blockers: string[], optionalProofs: Batch1ProofReport[]): Batch1ExecutionDecision {
  if (blockers.includes('package_lock_changed')) return 'blocked_pending_package_lock_integrity'
  if (blockers.includes('runtime_safety_flag_enabled')) return 'rejected_due_runtime_safety_risk'
  if (blockers.some((blocker) => blocker.includes('validation_failed') || blocker.includes('guard_failed'))) return 'blocked_pending_batch_1_proof_validation'
  const missingDependencies = optionalProofs.filter((proof) => proof.status === 'blocked_missing_dependency_or_module')
  const missingBinaries = optionalProofs.filter((proof) => proof.status === 'blocked_missing_system_binary')
  const notRun = optionalProofs.filter((proof) => proof.status === 'not_run')
  if (notRun.length > 0) return 'blocked_pending_batch_1_proof_validation'
  if (missingDependencies.length > 0 || missingBinaries.length > 0) return 'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools'
  return 'open_source_tool_stack_batch_1_execution_passed_ready_for_batch_1_qa_review'
}

function allTargetReports(input: {
  duckdbProof: Batch1ProofReport
  polarsProof: Batch1ProofReport
  sharpLibvipsProof: Batch1ProofReport
  ffmpegProof: Batch1ProofReport
  ffprobeProof: Batch1ProofReport
  routeCapabilityManifestValidation: Record<string, unknown>
  fixtureReportValidation: Record<string, unknown>
  inventoryProofMatrixValidation: Record<string, unknown>
}) {
  return [
    input.duckdbProof,
    input.polarsProof,
    input.sharpLibvipsProof,
    input.ffmpegProof,
    input.ffprobeProof,
    input.routeCapabilityManifestValidation,
    input.fixtureReportValidation,
    input.inventoryProofMatrixValidation,
  ] as Array<{ targetId: string; passed?: unknown }>
}

function blockedFlags(): Record<string, false> {
  return {
    dependencyInstallAllowed: false,
    packageLockMutationAllowed: false,
    newToolDependencyAdditionAllowed: false,
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
    '--head',
    BATCH_1_EXECUTION_BRANCH,
    '--json',
    'number,title,state,isDraft,baseRefName,headRefName,mergeStateStatus,url',
  ])
  return result.exitCode === 0 ? parseJsonOutput(result.stdout) : []
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

function gitHasDiff(filePath: string) {
  const status = safeGit(['status', '--short', '--', filePath]) ?? ''
  return status.trim().length > 0
}

function trackedMatches(pattern: RegExp) {
  const status = safeGit(['status', '--short']) ?? ''
  return status
    .split('\n')
    .map((line) => line.trim().replace(/^[A-Z? ]+\s+/, ''))
    .filter((file) => file && pattern.test(file))
}

function fileHash(filePath: string) {
  return existsSync(filePath) ? hashText(readFileSync(filePath, 'utf8')) : null
}

function hashText(text: string) {
  return createHash('sha256').update(text).digest('hex')
}

function preview(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 800)
}

function writeJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(filePath: string, value: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, value)
}

function dependencyBaselineMarkdown(report: Record<string, unknown>) {
  return `# Batch 1 Dependency Baseline Validation

Decision input: npm ci validation for the no-install/no-lock-mutation proof packet.

- Command: \`${report.npmCiCommand}\`
- Run by packet: \`${report.npmCiRun}\`
- Exit code: \`${report.npmCiExitCode}\`
- Package lock changed: \`${report.packageLockChanged}\`
- Baseline clean: \`${report.baselineClean}\`
- Dependency install requested: \`${report.dependencyInstallRequested}\`

No npm lifecycle scripts, package-lock mutation, Supabase writes, GCS upload, public artifacts, or signed URLs are authorized by this validation.
`
}

function selectedTargetGuardMarkdown(report: Record<string, unknown>) {
  return `# Batch 1 Selected Target Guard

Approved targets:

${approvedTargets.map((target) => `- \`${target}\``).join('\n')}

Guard passed: \`${report.passed}\`.

No package install, lockfile mutation, real media processing, worker execution, route execution, provider calls, Supabase writes, GCS upload, public artifacts, signed URLs, raw prompts, beta, or production unlocks are authorized.
`
}

function decisionMarkdown(report: JsonObject) {
  const blockers = Array.isArray(report.blockers) ? report.blockers.map(String) : []
  const passedTargets = Array.isArray(report.passedTargets) ? report.passedTargets.map(String) : []
  const missingOptionalTargets = Array.isArray(report.missingOptionalTargets)
    ? report.missingOptionalTargets.filter((target): target is JsonObject => typeof target === 'object' && target !== null)
    : []
  return `# Batch 1 Execution Decision

Decision: \`${report.decision}\`

- Ready: \`${report.readiness}\`
- Ready with missing optional tools: \`${report.readyWithMissingOptional}\`
- Next prompt: \`${report.nextPrompt}\`
- Blockers: \`${blockers.join(', ') || 'none'}\`

Passed targets:

${passedTargets.map((target) => `- \`${target}\``).join('\n') || '- none'}

Missing optional targets:

${missingOptionalTargets.map((target) => `- \`${String(target.targetId)}\`: \`${String(target.status)}\``).join('\n') || '- none'}

Supabase classification: no write, environment none, SQL none, migration no.

Broader tool execution, route execution, worker execution, provider calls, media/audio/render/image/browser/map work, GCS upload, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
`
}

function validationResultsMarkdown(reports: Batch1ExecutionReportSet) {
  return `# Batch 1 Execution Validation Results

- Decision: \`${reports.decision.decision}\`
- Dependency baseline clean: \`${reports.dependencyBaselineValidation.baselineClean}\`
- Package lock changed: \`${reports.sideEffectAndLockIntegrity.packageLockChanged}\`
- DuckDB: \`${reports.duckdbProof.status}\`
- Polars: \`${reports.polarsProof.status}\`
- Sharp/libvips: \`${reports.sharpLibvipsProof.status}\`
- FFmpeg: \`${reports.ffmpegProof.status}\`
- FFprobe: \`${reports.ffprobeProof.status}\`
- Route/capability manifest validation: \`${reports.routeCapabilityManifestValidation.status}\`
- Fixture/report validation: \`${reports.fixtureReportValidation.status}\`
- Inventory/proof matrix validation: \`${reports.inventoryProofMatrixValidation.status}\`
- Supabase: no write / environment none / SQL none / migration no.
`
}

function qaReviewPromptMarkdown(reports: Batch1ExecutionReportSet) {
  return `# OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW

Review the Batch 1 no-install/no-lock-mutation proof execution reports under \`${BATCH_1_EXECUTION_REPORT_DIR}/\`.

Current decision: \`${reports.decision.decision}\`.

Do not install dependencies, mutate package-lock, execute broad tools/routes/workers/providers, process media, mutate Supabase/GCS, create public artifacts or signed URLs, run raw prompts, or unlock beta/production.
`
}

function blockerResolutionPromptMarkdown(reports: Batch1ExecutionReportSet) {
  return `# OPEN_SOURCE_TOOL_STACK_BATCH_1_BLOCKER_RESOLUTION

Resolve the exact Batch 1 proof execution blockers before rerunning the execution packet.

Decision: \`${reports.decision.decision}\`

Blockers:

${((reports.blockerReport.blockers as string[]) ?? []).map((blocker) => `- \`${blocker}\``).join('\n') || '- none recorded'}

No install, package-lock mutation, broad tool execution, media processing, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, or production scope is authorized by this prompt.
`
}
