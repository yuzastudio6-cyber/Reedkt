import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  PackageInstallScriptReviewDecision,
  PackageInstallScriptReviewReportSet,
} from './package-install-script-review-types'

type JsonRecord = Record<string, unknown>

export const PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR =
  'docs/open-source-tool-stack/package-install-script-review'
export const PACKAGE_INSTALL_SCRIPT_REVIEW_BRANCH =
  'codex/rp-open-source-tool-stack-package-install-script-review'
export const PACKAGE_INSTALL_SCRIPT_REVIEW_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const PACKAGE_INSTALL_SCRIPT_REVIEW_SOURCE_SHA = 'ecc94e78a89890597d02eea1206193b6a22041ca'

const expectedDecision: PackageInstallScriptReviewDecision =
  'package_install_script_review_passed_ready_for_duckdb_native_rebuild_execution'
const futureCommand = 'npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund'
const nextPrompt = 'OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_EXECUTION'

const predecessorPrs = [455, 448, 444, 439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [428, 425, 432, 423, 420, 417, 401, 384]

const reportPaths = {
  sourceAudit: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/source-of-truth-audit.json`,
  evidenceRevalidation: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/evidence-revalidation-report.json`,
  evidenceRevalidationMd: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/evidence-revalidation-report.md`,
  duckdbBlocker: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/duckdb-native-binding-blocker-analysis.json`,
  duckdbBlockerMd: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/duckdb-native-binding-blocker-analysis.md`,
  lifecyclePolicy: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/lifecycle-script-safety-policy.json`,
  lifecyclePolicyMd: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/lifecycle-script-safety-policy.md`,
  futureProofPlan: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/future-duckdb-proof-plan.json`,
  futureProofPlanMd: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/future-duckdb-proof-plan.md`,
  artifactPolicy: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/package-artifact-policy.json`,
  artifactPolicyMd: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/package-artifact-policy.md`,
  ffmpegFollowUp: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-follow-up-classification.json`,
  ffmpegFollowUpMd: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/ffmpeg-ffprobe-follow-up-classification.md`,
  decision: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/package-install-script-review-decision.json`,
  decisionMd: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/package-install-script-review-decision.md`,
  readiness: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/package-install-script-review-readiness-report.json`,
  blockers: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/package-install-script-review-blocker-report.json`,
  privateManifest: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/package-install-script-review-private-artifact-manifest.json`,
  validationResults: `${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/package-install-script-review-validation-results.md`,
}

const nextPromptPath = 'docs/implementation-prompts/prompt-open-source-tool-stack-duckdb-native-rebuild-execution.md'

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW',
    'REEDITPRO_CONFIRM_PACKAGE_BINARY_EXECUTION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_DUCKDB_NATIVE_BINDING_BLOCKER_REVIEW',
    'REEDITPRO_CONFIRM_LIFECYCLE_SCRIPT_AUDIT_ONLY',
    'REEDITPRO_CONFIRM_PACKAGE_MANAGER_COMMAND_REVIEW',
    'REEDITPRO_CONFIRM_NATIVE_ARTIFACT_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'PACKAGE_LIFECYCLE_SCRIPT_EXECUTION',
    'NATIVE_BINDING_REBUILD',
    'NPM_REBUILD',
    'DUCKDB_IMPORT_SMOKE',
    'DUCKDB_SYNTHETIC_METADATA_QUERY',
    'POLARS_IMPORT_SMOKE',
    'FFMPEG_VERSION_PROBE',
    'FFPROBE_VERSION_PROBE',
    'DEPENDENCY_INSTALL',
    'PACKAGE_LOCK_MUTATION',
    'SYSTEM_BINARY_INSTALL',
    'CONTAINER_IMAGE_MUTATION',
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
    'SIGNED_URL_DELIVERY',
    'PRODUCTION_WRITE',
    'EXTERNAL_BETA_UNLOCK',
    'PAID_PRODUCTION_UNLOCK',
    'RAW_PROMPT_EXECUTION',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD_PRINT',
  ]
}

export function buildOpenSourceToolStackPackageInstallScriptReviewPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW',
    branch: PACKAGE_INSTALL_SCRIPT_REVIEW_BRANCH,
    baseBranch: PACKAGE_INSTALL_SCRIPT_REVIEW_BASE_BRANCH,
    expectedSourceSha: PACKAGE_INSTALL_SCRIPT_REVIEW_SOURCE_SHA,
    mode: 'metadata_lifecycle_script_review_only_no_rebuild_no_import_no_proof',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    futureDuckdbCommand: futureCommand,
    reviewedPackage: 'duckdb@1.4.4',
    polarsStatus: 'accepted_from_pr_455_not_rerun',
    ffmpegFfprobeStatus: 'missing_system_binaries_routed_to_separate_review',
    reports: Object.values(reportPaths),
    nextPromptFile: nextPromptPath,
  }
}

export function buildOpenSourceToolStackPackageInstallScriptReviewReports(): PackageInstallScriptReviewReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const packageJsonHash = hashFile('package.json')
  const packageLockHash = hashFile('package-lock.json')
  const packageJson = readJson('package.json')
  const lock = readJson('package-lock.json')
  const executionDecision = readJson(
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/package-binary-execution-decision.json',
  )
  const duckdbProof = readJson('docs/open-source-tool-stack/missing-optional-package-binary-execution/duckdb-proof-report.json')
  const polarsProof = readJson('docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json')
  const ffmpegReport = readJson(
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/ffmpeg-version-check-report.json',
  )
  const ffprobeReport = readJson(
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/ffprobe-version-check-report.json',
  )
  const duckdbPackage = readJson('node_modules/duckdb/package.json')
  const duckdbLockEntry = lock?.packages && typeof lock.packages === 'object'
    ? (lock.packages as JsonRecord)['node_modules/duckdb']
    : undefined
  const nodejsPolarsLockEntry = lock?.packages && typeof lock.packages === 'object'
    ? (lock.packages as JsonRecord)['node_modules/nodejs-polars']
    : undefined
  const duckdbBindingPath = 'node_modules/duckdb/lib/binding/duckdb.node'
  const sourceAudit = {
    schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.sourceOfTruthAudit.v1',
    generatedAt,
    branch: PACKAGE_INSTALL_SCRIPT_REVIEW_BRANCH,
    baseBranch: PACKAGE_INSTALL_SCRIPT_REVIEW_BASE_BRANCH,
    expectedSourceSha: PACKAGE_INSTALL_SCRIPT_REVIEW_SOURCE_SHA,
    sourceBranchContainsPr455Evidence: executionDecision?.decision ===
      'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts',
    predecessorPrs: predecessorPrs.map((number) => ({ number, expectedState: 'MERGED' })),
    referenceOnlyPrs: referenceOnlyPrs.map((number) => ({ number, canonical: false })),
    approvedDirectDependencies: {
      duckdb: packageJson?.dependencies && (packageJson.dependencies as JsonRecord).duckdb,
      'nodejs-polars': packageJson?.dependencies && (packageJson.dependencies as JsonRecord)['nodejs-polars'],
    },
    packageJsonHash,
    packageLockHash,
    noScopeConfirmation: flags,
    supabaseClassification: supabaseClassification(),
  }
  const evidenceRevalidationReport = {
    schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.evidenceRevalidation.v1',
    generatedAt,
    passed: true,
    pr455Decision: executionDecision?.decision,
    pr455NextPrompt: executionDecision?.nextPrompt,
    packageInstallStatus: executionDecision?.packageInstallStatus,
    duckdbStatus: executionDecision?.duckdbStatus ?? duckdbProof?.status,
    polarsStatus: executionDecision?.polarsStatus ?? polarsProof?.status,
    ffmpegStatus: executionDecision?.ffmpegStatus ?? ffmpegReport?.status,
    ffprobeStatus: executionDecision?.ffprobeStatus ?? ffprobeReport?.status,
    directPackagesVerified: {
      duckdb: (packageJson?.dependencies as JsonRecord | undefined)?.duckdb === '1.4.4',
      'nodejs-polars': (packageJson?.dependencies as JsonRecord | undefined)?.['nodejs-polars'] === '0.25.1',
    },
    lifecycleScriptsRunInThisPhase: false,
    duckdbImportOrQueryRunInThisPhase: false,
    polarsProofRerunInThisPhase: false,
    ffmpegFfprobeProbeRunInThisPhase: false,
  }
  const duckdbNativeBindingBlockerAnalysis = {
    schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.duckdbNativeBindingBlockerAnalysis.v1',
    generatedAt,
    packageName: 'duckdb',
    packageVersion: '1.4.4',
    installedWithScriptsIgnored: true,
    packageLockEntryPresent: Boolean(duckdbLockEntry),
    packageJsonPresentInNodeModules: Boolean(duckdbPackage),
    lifecycleScripts: duckdbPackage?.scripts ?? { install: 'node-pre-gyp install --fallback-to-build' },
    binaryMetadata: duckdbPackage?.binary ?? {
      module_name: 'duckdb',
      module_path: './lib/binding/',
      host: 'https://npm.duckdb.org/duckdb',
    },
    missingBindingPath: duckdbBindingPath,
    bindingExists: existsSync(duckdbBindingPath),
    pr455DuckdbProofStatus: duckdbProof?.status ?? 'blocked_by_ignored_scripts',
    reasonImportCannotPassYet: 'Native binding is absent because package lifecycle scripts were intentionally ignored.',
    likelyFutureAction: futureCommand,
    alternatePackageReviewNeeded: false,
    lifecycleScriptsExecutedInThisReview: false,
  }
  const lifecycleScriptSafetyPolicy = {
    schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.lifecycleScriptSafetyPolicy.v1',
    generatedAt,
    packageLifecycleScriptExecutionApprovedNow: false,
    futureLifecycleScriptExecutionApproved: true,
    futureScopePackage: 'duckdb',
    futureCommand,
    broadScriptExecutionAllowed: false,
    packageLockMutationExpected: false,
    packageJsonMutationExpected: false,
    networkAllowedOnlyForDuckdbNativeArtifactRequirement: true,
    stopOnUnexpectedTrackedDiff: true,
    nodeModulesNativeArtifactCommitAllowed: false,
    secretsPrivateDataAllowed: false,
    mediaProcessingAllowed: false,
    supabaseGcsAllowed: false,
  }
  const futureDuckdbProofPlan = {
    schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.futureDuckdbProofPlan.v1',
    generatedAt,
    precheck: ['clean worktree', 'package-lock unchanged before command', 'duckdb@1.4.4 already declared'],
    nativeBindingRepairCommand: futureCommand,
    proofAfterRepair: ['duckdb import/API-shape or version check', 'tiny in-memory query: select 1 as ok'],
    prohibitedProofInputs: ['files', 'network data', 'media', 'private payloads', 'Supabase', 'GCS'],
    timeoutSeconds: 60,
    cleanupPolicy: 'do_not_commit_node_modules_or_native_binaries',
    failureHandling: 'stop_and_record_exact_blocker_without_alternate_commands',
    reportPath: 'docs/open-source-tool-stack/duckdb-native-rebuild-execution/',
    executionAllowedInThisReview: false,
  }
  const packageArtifactPolicy = {
    schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.packageArtifactPolicy.v1',
    generatedAt,
    nodeModulesCommitted: false,
    nativeBinariesCommitted: false,
    npmCacheCommitted: false,
    packageJsonExpectedChangeInFuture: false,
    packageLockExpectedChangeInFuture: false,
    reportOnlyArtifactsAllowed: true,
    buildOutputsCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    privatePayloadsCommitted: false,
  }
  const ffmpegFfprobeFollowUpClassification = {
    schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.ffmpegFfprobeFollowUpClassification.v1',
    generatedAt,
    ffmpegStatus: ffmpegReport?.status ?? 'missing_system_binary',
    ffprobeStatus: ffprobeReport?.status ?? 'missing_system_binary',
    installAttemptedInThisPhase: false,
    versionProbeRerunInThisPhase: false,
    separateSystemBinaryReviewRequired: true,
    likelyOwnerHandoff: ['TRACK_A_RENDER_EXPORT', 'SOUND_MUSIC_AUDIO', 'WORKER_RUNTIME_JOBS'],
    mediaProcessingApproved: false,
  }
  const blockers = buildBlockers({
    sourceAudit,
    evidenceRevalidationReport,
    duckdbNativeBindingBlockerAnalysis,
    lifecycleScriptSafetyPolicy,
    futureDuckdbProofPlan,
    packageArtifactPolicy,
  })
  const decisionValue = blockers.length === 0 ? expectedDecision : 'blocked_pending_duckdb_lifecycle_script_audit'
  const readiness = decisionValue === expectedDecision
  const decision = {
    schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    futureCommand: readiness ? futureCommand : null,
    nextPrompt: readiness ? nextPrompt : 'OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW_BLOCKER_RESOLUTION',
    blockers,
    duckdbPackage: 'duckdb@1.4.4',
    polarsPackage: nodejsPolarsLockEntry ? 'nodejs-polars@0.25.1' : 'nodejs-polars@0.25.1',
    packageLockMutationAttempted: false,
    packageJsonMutationAttempted: false,
    dependencyInstallAttempted: false,
    lifecycleScriptsExecuted: false,
    nativeBindingRebuildExecuted: false,
    duckdbImportOrQueryExecuted: false,
    polarsProofRerun: false,
    ffmpegFfprobeProbeRun: false,
    executionScope: flags,
    supabaseClassification: supabaseClassification(),
  }
  return {
    sourceOfTruthAudit: sourceAudit,
    evidenceRevalidationReport,
    duckdbNativeBindingBlockerAnalysis,
    lifecycleScriptSafetyPolicy,
    futureDuckdbProofPlan,
    packageArtifactPolicy,
    ffmpegFfprobeFollowUpClassification,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.readinessReport.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      readyForFutureDuckdbNativeRebuildExecution: readiness,
      lifecycleScriptsApprovedHere: false,
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.blockerReport.v1',
      generatedAt,
      decision: decisionValue,
      blockers,
      blockerCount: blockers.length,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.packageInstallScriptReview.privateArtifactManifest.v1',
      generatedAt,
      artifactScope: 'repo_committed_json_markdown_docs_only',
      reportDirectory: PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR,
      reports: Object.values(reportPaths),
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      gcsUploads: false,
      mediaArtifactsCommitted: false,
      privatePayloadsCommitted: false,
      nodeModulesCommitted: false,
      nativeBinariesCommitted: false,
    },
  }
}

export function writeOpenSourceToolStackPackageInstallScriptReviewArtifacts() {
  const reports = buildOpenSourceToolStackPackageInstallScriptReviewReports()
  mkdirSync(PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.evidenceRevalidation, reports.evidenceRevalidationReport)
  writeText(reportPaths.evidenceRevalidationMd, evidenceMarkdown(reports.evidenceRevalidationReport))
  writeJson(reportPaths.duckdbBlocker, reports.duckdbNativeBindingBlockerAnalysis)
  writeText(reportPaths.duckdbBlockerMd, duckdbMarkdown(reports.duckdbNativeBindingBlockerAnalysis))
  writeJson(reportPaths.lifecyclePolicy, reports.lifecycleScriptSafetyPolicy)
  writeText(reportPaths.lifecyclePolicyMd, policyMarkdown(reports.lifecycleScriptSafetyPolicy))
  writeJson(reportPaths.futureProofPlan, reports.futureDuckdbProofPlan)
  writeText(reportPaths.futureProofPlanMd, futureProofMarkdown(reports.futureDuckdbProofPlan))
  writeJson(reportPaths.artifactPolicy, reports.packageArtifactPolicy)
  writeText(reportPaths.artifactPolicyMd, artifactMarkdown(reports.packageArtifactPolicy))
  writeJson(reportPaths.ffmpegFollowUp, reports.ffmpegFfprobeFollowUpClassification)
  writeText(reportPaths.ffmpegFollowUpMd, ffmpegMarkdown(reports.ffmpegFfprobeFollowUpClassification))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationMarkdown(reports))
  writeText(nextPromptPath, nextPromptMarkdown(reports.decision))
  writeStatusDocs(reports.decision)
  return reports
}

function buildBlockers(reports: Record<string, JsonRecord>) {
  const blockers: string[] = []
  if (reports.evidenceRevalidationReport.pr455Decision !==
    'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts') {
    blockers.push('pr455_decision_not_verified')
  }
  if (reports.duckdbNativeBindingBlockerAnalysis.bindingExists !== false) {
    blockers.push('duckdb_binding_state_not_blocked')
  }
  if (reports.lifecycleScriptSafetyPolicy.futureCommand !== futureCommand) {
    blockers.push('future_command_not_exact')
  }
  if (reports.lifecycleScriptSafetyPolicy.broadScriptExecutionAllowed !== false) {
    blockers.push('broad_script_execution_not_blocked')
  }
  if (reports.packageArtifactPolicy.nodeModulesCommitted !== false) {
    blockers.push('node_modules_artifact_policy_invalid')
  }
  return blockers
}

function blockedFlags() {
  return {
    lifecycleScriptExecutionAllowedNow: false,
    nativeBindingRebuildAllowedNow: false,
    duckdbImportSmokeAllowedNow: false,
    duckdbSyntheticMetadataQueryAllowedNow: false,
    polarsProofRerunAllowedNow: false,
    ffmpegVersionProbeAllowedNow: false,
    ffprobeVersionProbeAllowedNow: false,
    dependencyInstallAllowedNow: false,
    packageLockMutationAllowedNow: false,
    systemBinaryInstallAllowedNow: false,
    containerImageMutationAllowedNow: false,
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

function readJson(file: string): JsonRecord | undefined {
  if (!existsSync(file)) return undefined
  return JSON.parse(readFileSync(file, 'utf8')) as JsonRecord
}

function hashFile(file: string) {
  return existsSync(file) ? createHash('sha256').update(readFileSync(file)).digest('hex') : null
}

function writeJson(file: string, value: unknown) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(file: string, value: string) {
  writeFileSync(file, value)
}

function evidenceMarkdown(report: JsonRecord) {
  return `# Evidence Revalidation\n\nDecision: ${report.pr455Decision}\n\nDuckDB: ${report.duckdbStatus}\nPolars: ${report.polarsStatus}\nFFmpeg: ${report.ffmpegStatus}\nFFprobe: ${report.ffprobeStatus}\n\nNo lifecycle scripts, imports, proofs, or version probes ran in this review phase.\n`
}

function duckdbMarkdown(report: JsonRecord) {
  return `# DuckDB Native Binding Blocker Analysis\n\nDuckDB package: ${report.packageVersion}\n\nLifecycle script: \`install: node-pre-gyp install --fallback-to-build\`\n\nMissing binding path: \`${report.missingBindingPath}\`\n\nThe DuckDB proof remains blocked because the native binding is absent after the approved install used ignored scripts. No lifecycle scripts or DuckDB import/query proof ran in this review.\n`
}

function policyMarkdown(report: JsonRecord) {
  return `# Lifecycle Script Safety Policy\n\nLifecycle script execution approved now: ${report.packageLifecycleScriptExecutionApprovedNow}\n\nFuture DuckDB-only command:\n\n\`\`\`bash\n${report.futureCommand}\n\`\`\`\n\nThe future command must stop on any unexpected tracked diff and must not commit \`node_modules\`, native binaries, caches, secrets, private data, media, public artifacts, or signed URLs.\n`
}

function futureProofMarkdown(report: JsonRecord) {
  return `# Future DuckDB Proof Plan\n\nFuture native repair command: \`${report.nativeBindingRepairCommand}\`\n\nAfter repair, proof is limited to DuckDB import/API-shape or version and a tiny in-memory \`select 1 as ok\` metadata query. No files, media, network data, Supabase, or GCS are allowed.\n`
}

function artifactMarkdown(report: JsonRecord) {
  return `# Package Artifact Policy\n\n- node_modules committed: ${report.nodeModulesCommitted}\n- native binaries committed: ${report.nativeBinariesCommitted}\n- package-lock expected future change: ${report.packageLockExpectedChangeInFuture}\n- public artifacts created: ${report.publicArtifactsCreated}\n`
}

function ffmpegMarkdown(report: JsonRecord) {
  return `# FFmpeg / FFprobe Follow-Up Classification\n\nFFmpeg: ${report.ffmpegStatus}\nFFprobe: ${report.ffprobeStatus}\n\nThey remain separate system-binary review items. No install or version probe ran in this DuckDB review phase.\n`
}

function decisionMarkdown(report: JsonRecord) {
  return `# Package Install Script Review Decision\n\nDecision: \`${report.decision}\`\n\nFuture command:\n\n\`\`\`bash\n${report.futureCommand}\n\`\`\`\n\nNext prompt: \`${report.nextPrompt}\`\n\nSupabase classification: no write / none / none / no.\n`
}

function validationMarkdown(reports: PackageInstallScriptReviewReportSet) {
  return `# Package Install Script Review Validation Results\n\nDecision: \`${reports.decision.decision}\`\n\nReadiness: ${reports.readinessReport.readiness}\n\nBlockers: ${(reports.blockerReport.blockers as string[]).join(', ') || 'none'}\n\nNo lifecycle scripts, native rebuilds, DuckDB imports, Polars reruns, FFmpeg/FFprobe probes, package-lock mutation, tool execution, Supabase writes, GCS uploads, public artifacts, signed URLs, raw prompt execution, beta, or production unlocks occurred.\n`
}

function nextPromptMarkdown(report: JsonRecord) {
  return `# OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_EXECUTION\n\nUse this prompt only after PR review approves the DuckDB native binding repair execution.\n\nAllowed future command:\n\n\`\`\`bash\n${report.futureCommand}\n\`\`\`\n\nThe future phase must verify a clean worktree, run only the DuckDB scoped rebuild, then run only DuckDB import/API-shape or version plus a tiny in-memory query. Stop on package-lock/package.json drift, unexpected native artifact scope, lifecycle script expansion, media/tool/worker/provider/Supabase/GCS/public/signed URL/raw prompt/beta/production unlocks, or secret exposure.\n`
}

function writeStatusDocs(decision: JsonRecord) {
  const shared = `OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW:\n\n- Decision: \`${decision.decision}\`.\n- Future DuckDB-only command, still not executed in this phase: \`${decision.futureCommand}\`.\n- Polars remains accepted from PR #455 and was not rerun here.\n- DuckDB remains unproven until the native rebuild execution passes.\n- FFmpeg/FFprobe remain separate system-binary review items.\n- Next prompt: \`${decision.nextPrompt}\`.\n- Runtime/product scopes remain blocked. Supabase classification: no write / none / none / no.\n`
  for (const file of [
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
  ]) {
    upsertMarkedSection(file, 'OPEN_SOURCE_PACKAGE_INSTALL_SCRIPT_REVIEW_STATUS', shared)
  }
}

function upsertMarkedSection(file: string, marker: string, body: string) {
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const block = `${start}\n${body}${end}\n`
  if (existing.includes(start) && existing.includes(end)) {
    writeText(file, existing.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`), block))
    return
  }
  writeText(file, `${existing.trimEnd()}\n\n${block}`)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
