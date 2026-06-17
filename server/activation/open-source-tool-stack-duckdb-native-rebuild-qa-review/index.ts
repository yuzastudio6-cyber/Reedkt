import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  DuckdbNativeRebuildQaDecision,
  DuckdbNativeRebuildQaReportSet,
} from './duckdb-native-rebuild-qa-review-types'

type JsonRecord = Record<string, unknown>

export const DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR = 'docs/open-source-tool-stack/duckdb-native-rebuild-qa'
export const DUCKDB_NATIVE_REBUILD_QA_BRANCH =
  'codex/rp-open-source-tool-stack-duckdb-native-rebuild-qa-review'
export const DUCKDB_NATIVE_REBUILD_QA_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const DUCKDB_NATIVE_REBUILD_QA_SOURCE_SHA = '93512cf4ea4d0c414d05b72f0cd94a480f617aa6'

const duckdbExecutionDir = 'docs/open-source-tool-stack/duckdb-native-rebuild-execution'
const packageBinaryExecutionDir = 'docs/open-source-tool-stack/missing-optional-package-binary-execution'
const expectedExecutionDecision = 'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing'
const expectedQaDecision: DuckdbNativeRebuildQaDecision =
  'duckdb_native_rebuild_qa_passed_ready_for_ffmpeg_ffprobe_system_binary_review'
const nextPrompt = 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW'
const blockerPrompt = 'OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_BLOCKER_RESOLUTION'

const predecessorPrs = [466, 460, 455, 448, 444, 439, 435, 430, 427, 421, 416, 412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [428, 425, 432, 423, 420, 417, 401, 384]

const evidencePaths = {
  executionDecision: `${duckdbExecutionDir}/duckdb-native-rebuild-decision.json`,
  nativeRebuild: `${duckdbExecutionDir}/duckdb-native-rebuild-report.json`,
  importProof: `${duckdbExecutionDir}/duckdb-import-proof-report.json`,
  queryProof: `${duckdbExecutionDir}/duckdb-synthetic-query-report.json`,
  integrity: `${duckdbExecutionDir}/package-lock-native-artifact-integrity-report.json`,
  ffmpegFfprobe: `${duckdbExecutionDir}/ffmpeg-ffprobe-follow-up-report.json`,
  sideEffectSafety: `${duckdbExecutionDir}/side-effect-safety-report.json`,
  readiness: `${duckdbExecutionDir}/duckdb-native-rebuild-readiness-report.json`,
  pr455Decision: `${packageBinaryExecutionDir}/package-binary-execution-decision.json`,
  pr455Polars: `${packageBinaryExecutionDir}/polars-proof-report.json`,
}

const reportPaths = {
  sourceAudit: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/source-of-truth-audit.json`,
  evidenceRevalidation: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/evidence-revalidation-report.json`,
  evidenceRevalidationMd: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/evidence-revalidation-report.md`,
  duckdbProofQa: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/duckdb-proof-qa.json`,
  duckdbProofQaMd: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/duckdb-proof-qa.md`,
  polarsStatusQa: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/polars-status-qa.json`,
  polarsStatusQaMd: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/polars-status-qa.md`,
  ffmpegFfprobeMissingBinaryQa: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/ffmpeg-ffprobe-missing-binary-qa.json`,
  ffmpegFfprobeMissingBinaryQaMd: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/ffmpeg-ffprobe-missing-binary-qa.md`,
  internalBetaImpactReview: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/internal-beta-impact-review.json`,
  internalBetaImpactReviewMd: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/internal-beta-impact-review.md`,
  packageLockNativeArtifactQa: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/package-lock-native-artifact-qa.json`,
  packageLockNativeArtifactQaMd: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/package-lock-native-artifact-qa.md`,
  decision: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/duckdb-native-rebuild-qa-decision.json`,
  decisionMd: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/duckdb-native-rebuild-qa-decision.md`,
  readiness: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/duckdb-native-rebuild-qa-readiness-report.json`,
  blockers: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/duckdb-native-rebuild-qa-blocker-report.json`,
  privateArtifactManifest: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/duckdb-native-rebuild-qa-private-artifact-manifest.json`,
  validationResults: `${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/duckdb-native-rebuild-qa-validation-results.md`,
}

const nextPromptPath = 'docs/implementation-prompts/prompt-open-source-tool-stack-ffmpeg-ffprobe-system-binary-review.md'

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_REVIEW',
    'REEDITPRO_CONFIRM_DUCKDB_NATIVE_REBUILD_EXECUTION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_DUCKDB_PROOF_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_INTEGRITY_REVIEW',
    'REEDITPRO_CONFIRM_NATIVE_ARTIFACT_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_MISSING_REVIEW',
    'REEDITPRO_CONFIRM_INTERNAL_BETA_RELEVANCE_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'DUCKDB_NATIVE_REBUILD_EXECUTION',
    'NPM_REBUILD',
    'PACKAGE_LIFECYCLE_SCRIPT_EXECUTION',
    'NATIVE_BINDING_REBUILD',
    'DUCKDB_IMPORT_SMOKE',
    'DUCKDB_SYNTHETIC_METADATA_QUERY',
    'POLARS_IMPORT_SMOKE',
    'FFMPEG_VERSION_PROBE',
    'FFPROBE_VERSION_PROBE',
    'DEPENDENCY_INSTALL',
    'PACKAGE_LOCK_MUTATION',
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

export function buildOpenSourceToolStackDuckdbNativeRebuildQaReviewPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_REVIEW',
    branch: DUCKDB_NATIVE_REBUILD_QA_BRANCH,
    baseBranch: DUCKDB_NATIVE_REBUILD_QA_BASE_BRANCH,
    expectedSourceSha: DUCKDB_NATIVE_REBUILD_QA_SOURCE_SHA,
    mode: 'qa_review_metadata_only_no_rebuild_no_import_no_probe',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision: expectedQaDecision,
    nextPrompt,
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, nextPromptPath],
    forbiddenActions: [
      'npm_install',
      'npm_rebuild',
      'package_lifecycle_scripts',
      'duckdb_import_or_query_rerun',
      'polars_proof_rerun',
      'ffmpeg_or_ffprobe_probe',
      'system_binary_install',
      'container_mutation',
      'tool_worker_route_provider_execution',
      'media_audio_render_image_browser_map_execution',
      'supabase_sql_gcs_public_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports(): DuckdbNativeRebuildQaReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const evidence = readEvidenceReports()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, flags, evidence)
  const evidenceRevalidationReport = buildEvidenceRevalidationReport(generatedAt, evidence)
  const duckdbProofQa = buildDuckdbProofQa(generatedAt, evidence)
  const polarsStatusQa = buildPolarsStatusQa(generatedAt, evidence)
  const ffmpegFfprobeMissingBinaryQa = buildFfmpegFfprobeMissingBinaryQa(generatedAt, evidence)
  const internalBetaImpactReview = buildInternalBetaImpactReview(generatedAt, duckdbProofQa, polarsStatusQa, ffmpegFfprobeMissingBinaryQa)
  const packageLockNativeArtifactQa = buildPackageLockNativeArtifactQa(generatedAt, evidence)
  return finalizeReports({
    generatedAt,
    sourceOfTruthAudit,
    evidenceRevalidationReport,
    duckdbProofQa,
    polarsStatusQa,
    ffmpegFfprobeMissingBinaryQa,
    internalBetaImpactReview,
    packageLockNativeArtifactQa,
  })
}

export function writeOpenSourceToolStackDuckdbNativeRebuildQaReviewArtifacts() {
  const reports = buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports()
  mkdirSync(DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.evidenceRevalidation, reports.evidenceRevalidationReport)
  writeText(reportPaths.evidenceRevalidationMd, evidenceRevalidationMarkdown(reports.evidenceRevalidationReport))
  writeJson(reportPaths.duckdbProofQa, reports.duckdbProofQa)
  writeText(reportPaths.duckdbProofQaMd, duckdbProofMarkdown(reports.duckdbProofQa))
  writeJson(reportPaths.polarsStatusQa, reports.polarsStatusQa)
  writeText(reportPaths.polarsStatusQaMd, polarsStatusMarkdown(reports.polarsStatusQa))
  writeJson(reportPaths.ffmpegFfprobeMissingBinaryQa, reports.ffmpegFfprobeMissingBinaryQa)
  writeText(reportPaths.ffmpegFfprobeMissingBinaryQaMd, ffmpegFfprobeMarkdown(reports.ffmpegFfprobeMissingBinaryQa))
  writeJson(reportPaths.internalBetaImpactReview, reports.internalBetaImpactReview)
  writeText(reportPaths.internalBetaImpactReviewMd, internalBetaMarkdown(reports.internalBetaImpactReview))
  writeJson(reportPaths.packageLockNativeArtifactQa, reports.packageLockNativeArtifactQa)
  writeText(reportPaths.packageLockNativeArtifactQaMd, packageLockMarkdown(reports.packageLockNativeArtifactQa))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationMarkdown(reports))
  writeText(nextPromptPath, nextPromptMarkdown(reports))
  updateStatusDocs(reports)
  return reports
}

export function readOpenSourceToolStackDuckdbNativeRebuildQaReviewArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    evidenceRevalidationReport: readJson(reportPaths.evidenceRevalidation) ?? {},
    duckdbProofQa: readJson(reportPaths.duckdbProofQa) ?? {},
    polarsStatusQa: readJson(reportPaths.polarsStatusQa) ?? {},
    ffmpegFfprobeMissingBinaryQa: readJson(reportPaths.ffmpegFfprobeMissingBinaryQa) ?? {},
    internalBetaImpactReview: readJson(reportPaths.internalBetaImpactReview) ?? {},
    packageLockNativeArtifactQa: readJson(reportPaths.packageLockNativeArtifactQa) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    blockerReport: readJson(reportPaths.blockers) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest) ?? {},
  } as DuckdbNativeRebuildQaReportSet
}

export function summarizeOpenSourceToolStackDuckdbNativeRebuildQaReview(
  reports = buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports(),
) {
  return JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      duckdbAccepted: reports.duckdbProofQa.accepted,
      polarsAccepted: reports.polarsStatusQa.accepted,
      ffmpegStatus: reports.ffmpegFfprobeMissingBinaryQa.ffmpegStatus,
      ffprobeStatus: reports.ffmpegFfprobeMissingBinaryQa.ffprobeStatus,
      nextPrompt: reports.decision.nextPrompt,
      blockers: reports.blockerReport.blockers,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  )
}

function finalizeReports(input: {
  generatedAt: string
  sourceOfTruthAudit: JsonRecord
  evidenceRevalidationReport: JsonRecord
  duckdbProofQa: JsonRecord
  polarsStatusQa: JsonRecord
  ffmpegFfprobeMissingBinaryQa: JsonRecord
  internalBetaImpactReview: JsonRecord
  packageLockNativeArtifactQa: JsonRecord
}): DuckdbNativeRebuildQaReportSet {
  const blockers = buildBlockers(input)
  const decisionValue = chooseDecision(blockers)
  const readiness = decisionValue === expectedQaDecision
  const decision = {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.decision.v1',
    generatedAt: input.generatedAt,
    decision: decisionValue,
    readiness,
    duckdbAcceptedAsInstalledAndProven: input.duckdbProofQa.accepted === true,
    polarsAcceptedAsInstalledAndProven: input.polarsStatusQa.accepted === true,
    ffmpegAcceptedAsInstalledAndProven: false,
    ffprobeAcceptedAsInstalledAndProven: false,
    nextPrompt: readiness ? nextPrompt : blockerPrompt,
    blockers,
    npmInstallAttempted: false,
    npmRebuildAttempted: false,
    packageLifecycleScriptsAttempted: false,
    duckdbImportProofRerun: false,
    duckdbQueryProofRerun: false,
    polarsProofRerun: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    packageJsonChanged: input.packageLockNativeArtifactQa.packageJsonChanged,
    packageLockChanged: input.packageLockNativeArtifactQa.packageLockChanged,
    nativeArtifactsCommitted: input.packageLockNativeArtifactQa.nativeArtifactsCommitted,
    nodeModulesCommitted: input.packageLockNativeArtifactQa.nodeModulesCommitted,
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
      schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.readinessReport.v1',
      generatedAt: input.generatedAt,
      readiness,
      decision: decisionValue,
      duckdbAcceptedAsInstalledAndProven: input.duckdbProofQa.accepted === true,
      polarsAcceptedAsInstalledAndProven: input.polarsStatusQa.accepted === true,
      ffmpegFfprobeSystemBinaryReviewRequired: input.ffmpegFfprobeMissingBinaryQa.systemBinaryReviewRequired === true,
      internalBetaMetadataUsefulnessImproved: input.internalBetaImpactReview.duckdbPolarsUsefulForInternalBetaMetadata === true,
      packageLockNativeArtifactQaPassed: input.packageLockNativeArtifactQa.passed === true,
      blockers,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.blockerReport.v1',
      generatedAt: input.generatedAt,
      decision: decisionValue,
      blockers,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.privateArtifactManifest.v1',
      generatedAt: input.generatedAt,
      artifactScope: 'repo_committed_json_markdown_docs_and_diagnostics_only',
      reportDirectory: DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR,
      reports: Object.values(reportPaths),
      docs: [...statusDocPaths, nextPromptPath],
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

function readEvidenceReports() {
  return {
    executionDecision: readJson(evidencePaths.executionDecision),
    nativeRebuild: readJson(evidencePaths.nativeRebuild),
    importProof: readJson(evidencePaths.importProof),
    queryProof: readJson(evidencePaths.queryProof),
    integrity: readJson(evidencePaths.integrity),
    ffmpegFfprobe: readJson(evidencePaths.ffmpegFfprobe),
    sideEffectSafety: readJson(evidencePaths.sideEffectSafety),
    readiness: readJson(evidencePaths.readiness),
    pr455Decision: readJson(evidencePaths.pr455Decision),
    pr455Polars: readJson(evidencePaths.pr455Polars),
  }
}

function buildSourceOfTruthAudit(generatedAt: string, flags: Record<string, false>, evidence: ReturnType<typeof readEvidenceReports>) {
  const packageState = capturePackageState()
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.sourceOfTruthAudit.v1',
    generatedAt,
    branch: DUCKDB_NATIVE_REBUILD_QA_BRANCH,
    baseBranch: DUCKDB_NATIVE_REBUILD_QA_BASE_BRANCH,
    expectedSourceSha: DUCKDB_NATIVE_REBUILD_QA_SOURCE_SHA,
    currentBranch: safeGit(['branch', '--show-current']),
    currentSha: safeGit(['rev-parse', 'HEAD']),
    packageJsonHash: packageState.packageJsonHash,
    packageLockHash: packageState.packageLockHash,
    packageDependencies: packageState.dependencies,
    pr466Evidence: {
      expectedDecision: expectedExecutionDecision,
      decision: evidence.executionDecision?.decision ?? null,
      mergedEvidence: safePrView(466),
      nativeRebuildPassed: evidence.nativeRebuild?.rebuildExitCode === 0,
      importProofPassed: evidence.importProof?.importPassed === true,
      inMemoryQueryProofPassed: evidence.queryProof?.queryPassed === true,
      packageJsonChanged: evidence.integrity?.packageJsonChanged ?? null,
      packageLockChanged: evidence.integrity?.packageLockChanged ?? null,
      nativeArtifactsCommitted: evidence.integrity?.nativeArtifactsCommitted ?? null,
    },
    predecessorPrEvidence: predecessorPrs.map((number) => safePrView(number)),
    referenceOnlyPrEvidence: referenceOnlyPrs.map((number) => ({ ...safePrView(number), referenceOnly: true, canonical: false })),
    duplicateQaPrSearch: safePrSearch('DuckDB native rebuild QA'),
    absentBroadProductionDocs: [
      'docs/beta-readiness-scorecard.md',
      'docs/production-beta-blocker-inventory.md',
      'PRODUCTION_FOUNDATION_STATUS.md',
    ].filter((file) => !existsSync(file)),
    sourceReportPaths: evidencePaths,
    noScopeConfirmation: flags,
    supabaseClassification: supabaseClassification(),
    secretPolicy: secretPolicy(),
  }
}

function buildEvidenceRevalidationReport(generatedAt: string, evidence: ReturnType<typeof readEvidenceReports>) {
  const requiredEvidence = Object.entries(evidencePaths).map(([id, file]) => ({
    id,
    file,
    exists: existsSync(file),
  }))
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.evidenceRevalidation.v1',
    generatedAt,
    requiredEvidence,
    safeValidationCommands: [
      'npm ci --ignore-scripts --no-audit --no-fund',
      'npm run smoke:open-source-tool-stack-duckdb-native-rebuild',
      'npm run open-source-tool-stack:duckdb-native-rebuild:report',
      'npm run open-source-tool-stack:duckdb-native-rebuild:summary',
      'npm run open-source-tool-stack:duckdb-native-rebuild:diagnostics',
      'npm run open-source-tool-stack:package-install-script-review:diagnostics',
      'npm run open-source-tool-stack:missing-optional-package-binary-execution:diagnostics',
      'npm run open-source-tool-stack:batch-1:qa-review:diagnostics',
      'npm run dependency-baseline:repair-before-tool-batch-1:diagnostics',
      'npm run open-source-tool-stack:audit:diagnostics',
    ],
    forbiddenRerunCommands: [
      'npm install',
      'npm rebuild',
      'DuckDB import/query proof rerun',
      'Polars proof rerun',
      'ffmpeg -version',
      'ffprobe -version',
    ],
    evidenceDecision: evidence.executionDecision?.decision ?? null,
    evidenceDecisionValid: evidence.executionDecision?.decision === expectedExecutionDecision,
    readinessValid: evidence.readiness?.readiness === true,
    passed: requiredEvidence.every((item) => item.exists) && evidence.executionDecision?.decision === expectedExecutionDecision,
  }
}

function buildDuckdbProofQa(generatedAt: string, evidence: ReturnType<typeof readEvidenceReports>) {
  const rebuildPassed = evidence.nativeRebuild?.rebuildExitCode === 0 && evidence.nativeRebuild?.rebuildStatus === 'passed'
  const importPassed = evidence.importProof?.importPassed === true && evidence.importProof?.status === 'passed'
  const queryPassed = evidence.queryProof?.queryPassed === true && evidence.queryProof?.status === 'passed'
  const safeInputs =
    evidence.importProof?.noMedia === true &&
    evidence.importProof?.noSupabase === true &&
    evidence.queryProof?.noFileDatabase === true &&
    evidence.queryProof?.noPrivateData === true
  const accepted = rebuildPassed && importPassed && queryPassed && safeInputs
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.duckdbProofQa.v1',
    generatedAt,
    rebuildEvidencePath: evidencePaths.nativeRebuild,
    importProofPath: evidencePaths.importProof,
    queryProofPath: evidencePaths.queryProof,
    rebuildPassed,
    importApiProofPassed: importPassed,
    inMemoryQueryProofPassed: queryPassed,
    deterministic: true,
    synthetic: true,
    noFileDatabase: evidence.queryProof?.noFileDatabase === true,
    noNetwork: evidence.queryProof?.noNetwork === true && evidence.importProof?.noNetwork === true,
    noPrivateData: evidence.queryProof?.noPrivateData === true,
    noSupabase: evidence.queryProof?.noSupabase === true && evidence.importProof?.noSupabase === true,
    noGcs: evidence.queryProof?.noGcs === true && evidence.importProof?.noGcs === true,
    noMedia: evidence.queryProof?.noMedia === true && evidence.importProof?.noMedia === true,
    packageLockImpact: {
      packageJsonChanged: evidence.integrity?.packageJsonChanged ?? null,
      packageLockChanged: evidence.integrity?.packageLockChanged ?? null,
    },
    nativeArtifactCommitStatus: {
      nativeArtifactsCommitted: evidence.integrity?.nativeArtifactsCommitted ?? null,
      nodeModulesCommitted: evidence.integrity?.nodeModulesCommitted ?? null,
    },
    accepted,
    warnings: accepted ? [] : ['DuckDB rebuild/import/query evidence did not fully pass.'],
    followUp: accepted ? 'Count DuckDB as installed/proven for local metadata/query validation.' : 'Review DuckDB rebuild evidence before counting it as proven.',
  }
}

function buildPolarsStatusQa(generatedAt: string, evidence: ReturnType<typeof readEvidenceReports>) {
  const accepted = evidence.pr455Polars?.passed === true && evidence.pr455Polars?.status === 'passed'
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.polarsStatusQa.v1',
    generatedAt,
    sourceEvidencePath: evidencePaths.pr455Polars,
    pr455Decision: evidence.pr455Decision?.decision ?? null,
    polarsProofPassedInPr455: evidence.pr455Polars?.passed === true,
    polarsVersion: evidence.pr455Polars?.version ?? null,
    polarsProofRerunInPr466: evidence.executionDecision?.polarsProofRerun === false ? false : null,
    polarsProofRerunInThisPhase: false,
    accepted,
    followUp: accepted ? 'No follow-up required for Polars unless later evidence invalidates PR #455.' : 'Review Polars PR #455 proof evidence.',
  }
}

function buildFfmpegFfprobeMissingBinaryQa(generatedAt: string, evidence: ReturnType<typeof readEvidenceReports>) {
  const ffmpegMissing = evidence.ffmpegFfprobe?.ffmpegStatus === 'missing_system_binary'
  const ffprobeMissing = evidence.ffmpegFfprobe?.ffprobeStatus === 'missing_system_binary'
  const noProbeRun =
    evidence.ffmpegFfprobe?.ffmpegVersionProbeRunInThisPhase === false &&
    evidence.ffmpegFfprobe?.ffprobeVersionProbeRunInThisPhase === false &&
    evidence.executionDecision?.ffmpegProbeRun === false &&
    evidence.executionDecision?.ffprobeProbeRun === false
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.ffmpegFfprobeMissingBinaryQa.v1',
    generatedAt,
    sourceEvidencePath: evidencePaths.ffmpegFfprobe,
    ffmpegStatus: evidence.ffmpegFfprobe?.ffmpegStatus ?? null,
    ffprobeStatus: evidence.ffmpegFfprobe?.ffprobeStatus ?? null,
    ffmpegMissing,
    ffprobeMissing,
    ffmpegProbeRunInPr466: false,
    ffprobeProbeRunInPr466: false,
    probeRunInThisPhase: false,
    installAttempted: false,
    mediaProcessingApproved: false,
    systemBinaryReviewRequired: ffmpegMissing || ffprobeMissing,
    nextRecommendedLane: nextPrompt,
    ownerHandoffCandidates: ['TRACK_A_RENDER_EXPORT', 'SOUND_MUSIC_AUDIO', 'WORKER_RUNTIME_JOBS'],
    passed: ffmpegMissing && ffprobeMissing && noProbeRun,
  }
}

function buildInternalBetaImpactReview(
  generatedAt: string,
  duckdbProofQa: JsonRecord,
  polarsStatusQa: JsonRecord,
  ffmpegFfprobeMissingBinaryQa: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.internalBetaImpactReview.v1',
    generatedAt,
    canUseDuckdbForLocalMetadataQueryValidation: duckdbProofQa.accepted === true,
    canUsePolarsForLocalDataframeMetadataValidation: polarsStatusQa.accepted === true,
    canUseFfmpegForMediaOrRenderLanes: false,
    canUseFfprobeForMediaOrRenderLanes: false,
    duckdbPolarsUsefulForInternalBetaMetadata: duckdbProofQa.accepted === true && polarsStatusQa.accepted === true,
    strengthenedClaims: [
      'DuckDB local metadata/query validation is now installed/proven from PR #466 evidence.',
      'Polars local dataframe metadata validation remains installed/proven from PR #455 evidence.',
    ],
    remainingBlockers: [
      'FFmpeg system binary remains missing/unproven.',
      'FFprobe system binary remains missing/unproven.',
      'Media/render/audio lanes that require FFmpeg/FFprobe stay blocked pending system-binary review.',
    ],
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    passed:
      duckdbProofQa.accepted === true &&
      polarsStatusQa.accepted === true &&
      ffmpegFfprobeMissingBinaryQa.systemBinaryReviewRequired === true,
  }
}

function buildPackageLockNativeArtifactQa(generatedAt: string, evidence: ReturnType<typeof readEvidenceReports>) {
  const status = gitStatusAll()
  const trackedNodeModules = trackedMatches(/^node_modules\//)
  const trackedNativeArtifacts = trackedMatches(/\.node$/)
  const changedCaches = statusMatches(/(^|\/)(\.npm|\.cache|node_modules\/\.cache)\//)
  const changedBuildOutputs = statusMatches(/^(dist|dist-server|build|coverage|\.vite|tmp)\//)
  const changedMedia = statusMatches(/\.(png|jpe?g|webp|gif|mp4|mov|webm|wav|mp3|m4a)$/i)
  const packageJsonChanged = evidence.integrity?.packageJsonChanged === true
  const packageLockChanged = evidence.integrity?.packageLockChanged === true
  const nativeArtifactsCommitted = evidence.integrity?.nativeArtifactsCommitted === true || trackedNativeArtifacts.length > 0
  const nodeModulesCommitted = evidence.integrity?.nodeModulesCommitted === true || trackedNodeModules.length > 0
  return {
    schema: 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.packageLockNativeArtifactQa.v1',
    generatedAt,
    sourceEvidencePath: evidencePaths.integrity,
    packageJsonChanged,
    packageLockChanged,
    nodeModulesCommitted,
    nativeArtifactsCommitted,
    npmCacheCommitted: changedCaches.length > 0,
    buildOutputsCommitted: changedBuildOutputs.length > 0,
    mediaArtifactsCommitted: changedMedia.length > 0,
    secretsDetected: detectSecretPatterns(status),
    privatePayloadsCommitted: false,
    statusPreview: status.slice(0, 30),
    passed:
      !packageJsonChanged &&
      !packageLockChanged &&
      !nodeModulesCommitted &&
      !nativeArtifactsCommitted &&
      changedCaches.length === 0 &&
      changedBuildOutputs.length === 0 &&
      changedMedia.length === 0,
  }
}

function buildBlockers(input: {
  evidenceRevalidationReport: JsonRecord
  duckdbProofQa: JsonRecord
  polarsStatusQa: JsonRecord
  ffmpegFfprobeMissingBinaryQa: JsonRecord
  internalBetaImpactReview: JsonRecord
  packageLockNativeArtifactQa: JsonRecord
}) {
  const blockers: DuckdbNativeRebuildQaDecision[] = []
  if (input.evidenceRevalidationReport.passed !== true || input.duckdbProofQa.rebuildPassed !== true) {
    blockers.push('blocked_pending_duckdb_rebuild_evidence_review')
  }
  if (input.duckdbProofQa.importApiProofPassed !== true || input.duckdbProofQa.inMemoryQueryProofPassed !== true) {
    blockers.push('blocked_pending_duckdb_import_query_evidence')
  }
  if (input.packageLockNativeArtifactQa.packageJsonChanged === true || input.packageLockNativeArtifactQa.packageLockChanged === true) {
    blockers.push('blocked_pending_package_lock_integrity_review')
  }
  if (input.packageLockNativeArtifactQa.nativeArtifactsCommitted === true || input.packageLockNativeArtifactQa.nodeModulesCommitted === true) {
    blockers.push('blocked_pending_native_artifact_policy_review')
  }
  if (
    input.ffmpegFfprobeMissingBinaryQa.probeRunInThisPhase !== false ||
    input.ffmpegFfprobeMissingBinaryQa.installAttempted !== false ||
    input.internalBetaImpactReview.externalBetaAllowed !== false
  ) {
    blockers.push('rejected_due_runtime_safety_risk')
  }
  return [...new Set(blockers)]
}

function chooseDecision(blockers: DuckdbNativeRebuildQaDecision[]): DuckdbNativeRebuildQaDecision {
  return blockers[0] ?? expectedQaDecision
}

function evidenceRevalidationMarkdown(report: JsonRecord) {
  return `# DuckDB Native Rebuild QA Evidence Revalidation

Decision evidence: \`${report.evidenceDecision ?? 'unknown'}\`

Required evidence files present: ${Array.isArray(report.requiredEvidence) ? report.requiredEvidence.every((item) => (item as JsonRecord).exists === true) : false}

This QA packet records safe report/diagnostic validation only. It does not rerun DuckDB rebuild, DuckDB import/query proof, Polars proof, FFmpeg, or FFprobe.
`
}

function duckdbProofMarkdown(report: JsonRecord) {
  return `# DuckDB Proof QA

- Native rebuild passed: ${report.rebuildPassed}
- Import/API proof passed: ${report.importApiProofPassed}
- In-memory query proof passed: ${report.inMemoryQueryProofPassed}
- Accepted as installed/proven: ${report.accepted}
- Follow-up: ${report.followUp}
`
}

function polarsStatusMarkdown(report: JsonRecord) {
  return `# Polars Status QA

- Polars proof passed in PR #455: ${report.polarsProofPassedInPr455}
- Polars proof rerun in PR #466: ${report.polarsProofRerunInPr466}
- Polars proof rerun in this QA phase: ${report.polarsProofRerunInThisPhase}
- Accepted as installed/proven: ${report.accepted}
`
}

function ffmpegFfprobeMarkdown(report: JsonRecord) {
  return `# FFmpeg / FFprobe Missing Binary QA

- FFmpeg status: \`${report.ffmpegStatus ?? 'unknown'}\`
- FFprobe status: \`${report.ffprobeStatus ?? 'unknown'}\`
- Probe run in this phase: ${report.probeRunInThisPhase}
- Install attempted: ${report.installAttempted}
- Media processing approved: ${report.mediaProcessingApproved}
- Next recommended lane: \`${report.nextRecommendedLane}\`
`
}

function internalBetaMarkdown(report: JsonRecord) {
  return `# Internal Beta Impact Review

- DuckDB local metadata/query validation usable: ${report.canUseDuckdbForLocalMetadataQueryValidation}
- Polars local dataframe metadata validation usable: ${report.canUsePolarsForLocalDataframeMetadataValidation}
- FFmpeg usable for media/render lanes: ${report.canUseFfmpegForMediaOrRenderLanes}
- FFprobe usable for media/render lanes: ${report.canUseFfprobeForMediaOrRenderLanes}
- External beta allowed: ${report.externalBetaAllowed}
- Paid production allowed: ${report.paidProductionAllowed}
`
}

function packageLockMarkdown(report: JsonRecord) {
  return `# Package Lock / Native Artifact QA

- package.json changed by rebuild evidence: ${report.packageJsonChanged}
- package-lock.json changed by rebuild evidence: ${report.packageLockChanged}
- node_modules committed: ${report.nodeModulesCommitted}
- native artifacts committed: ${report.nativeArtifactsCommitted}
- npm cache committed: ${report.npmCacheCommitted}
- build outputs committed: ${report.buildOutputsCommitted}
- media artifacts committed: ${report.mediaArtifactsCommitted}
- passed: ${report.passed}
`
}

function decisionMarkdown(decision: JsonRecord) {
  return `# DuckDB Native Rebuild QA Decision

Decision: \`${decision.decision}\`

DuckDB accepted as installed/proven: ${decision.duckdbAcceptedAsInstalledAndProven}

Polars accepted as installed/proven: ${decision.polarsAcceptedAsInstalledAndProven}

FFmpeg accepted as installed/proven: ${decision.ffmpegAcceptedAsInstalledAndProven}

FFprobe accepted as installed/proven: ${decision.ffprobeAcceptedAsInstalledAndProven}

Next prompt: \`${decision.nextPrompt}\`

Supabase classification: no write / none / none / no.
`
}

function validationMarkdown(reports: DuckdbNativeRebuildQaReportSet) {
  return `# DuckDB Native Rebuild QA Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: ${reports.readinessReport.readiness}
- DuckDB accepted: ${reports.duckdbProofQa.accepted}
- Polars accepted: ${reports.polarsStatusQa.accepted}
- FFmpeg status: \`${reports.ffmpegFfprobeMissingBinaryQa.ffmpegStatus ?? 'unknown'}\`
- FFprobe status: \`${reports.ffmpegFfprobeMissingBinaryQa.ffprobeStatus ?? 'unknown'}\`
- Blockers: ${Array.isArray(reports.blockerReport.blockers) ? reports.blockerReport.blockers.length : 0}

No rebuild, import/query proof rerun, Polars proof rerun, FFmpeg/FFprobe probe, media processing, Supabase mutation, public artifact, signed URL, beta, or production unlock occurred in this QA phase.
`
}

function nextPromptMarkdown(reports: DuckdbNativeRebuildQaReportSet) {
  return `# OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW

Start from the source-of-truth branch after the DuckDB native rebuild QA review lands.

This is a review phase only unless a later prompt explicitly approves binary checks or installation. Do not install FFmpeg or FFprobe, mutate Dockerfiles or container images, process media, run version probes, execute workers/routes/providers, mutate Supabase/GCS, create public artifacts, create signed URLs, run raw prompts, merge PRs, or unlock beta/production.

Source evidence to preserve:
- DuckDB accepted as installed/proven: ${reports.decision.duckdbAcceptedAsInstalledAndProven}
- Polars accepted as installed/proven: ${reports.decision.polarsAcceptedAsInstalledAndProven}
- FFmpeg remains missing/unproven.
- FFprobe remains missing/unproven.

Coordinate with Track A Render/Export, Sound/Music/Audio, and Worker Runtime Jobs owners before any future system-binary or worker-container approval.
`
}

function updateStatusDocs(reports: DuckdbNativeRebuildQaReportSet) {
  const block = `OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_REVIEW:

- Decision: \`${reports.decision.decision}\`.
- DuckDB is accepted as installed/proven from PR #466 native rebuild, import/API, and in-memory query evidence.
- Polars remains accepted/proven from PR #455 and was not rerun in PR #466 or this QA phase.
- FFmpeg and FFprobe remain missing/unproven and route to \`OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW\`.
- No npm install, npm rebuild, lifecycle script, proof rerun, version probe, tool/worker/route/provider/media, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production scope is enabled.
- Supabase classification: no write / none / none / no.`
  for (const file of statusDocPaths) {
    if (!existsSync(file)) continue
    upsertMarkedBlock(file, 'OPEN_SOURCE_DUCKDB_NATIVE_REBUILD_QA_STATUS', block)
  }
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

function capturePackageState() {
  const packageJson = existsSync('package.json') ? readFileSync('package.json', 'utf8') : ''
  const packageLock = existsSync('package-lock.json') ? readFileSync('package-lock.json', 'utf8') : ''
  let dependencies: JsonRecord
  try {
    const parsed = JSON.parse(packageJson) as JsonRecord
    dependencies = {
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
      optionalDependencies: parsed.optionalDependencies ?? {},
    }
  } catch {
    dependencies = {}
  }
  return {
    packageJsonHash: hash(packageJson),
    packageLockHash: hash(packageLock),
    dependencies,
  }
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
        ['pr', 'list', '--repo', 'yuzastudio6-cyber/Reedkt', '--state', 'open', '--search', query, '--json', 'number,title,state,isDraft,url', '--limit', '20'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ),
    ) as unknown[]
  } catch {
    return []
  }
}

function trackedMatches(pattern: RegExp) {
  const output = safeGit(['ls-files']) ?? ''
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && pattern.test(line))
}

function statusMatches(pattern: RegExp) {
  return gitStatusAll().filter((line) => pattern.test(line.slice(3)))
}

function gitStatusAll() {
  const output = safeGit(['status', '--short']) ?? ''
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
}

function detectSecretPatterns(lines: string[]) {
  return lines.some((line) => /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i.test(line))
}

function readJson(file: string): JsonRecord | undefined {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as JsonRecord
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function blockedFlags(): Record<string, false> {
  return {
    npmInstallAllowed: false,
    npmRebuildAllowed: false,
    packageLifecycleScriptsAllowed: false,
    duckdbImportProofRerunAllowed: false,
    duckdbQueryProofRerunAllowed: false,
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
