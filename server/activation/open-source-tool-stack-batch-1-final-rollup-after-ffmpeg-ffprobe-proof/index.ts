import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  Batch1FinalRollupDecision,
  Batch1FinalRollupReport,
  Batch1FinalRollupReports,
} from './batch-1-final-rollup-after-ffmpeg-ffprobe-proof-types'

type JsonRecord = Record<string, unknown>

export const BATCH1_FINAL_ROLLUP_REPORT_DIR =
  'docs/open-source-tool-stack/batch-1-final-rollup-after-ffmpeg-ffprobe-proof'
export const BATCH1_FINAL_ROLLUP_BRANCH =
  'codex/rp-open-source-tool-stack-batch1-final-rollup-after-ffmpeg-ffprobe-proof'
export const BATCH1_FINAL_ROLLUP_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const BATCH1_FINAL_ROLLUP_SOURCE_SHA = 'aed2a8ecc06b7a68a4139d38d3bb5f568a949ffc'
export const FFMPEG_FFPROBE_CONTAINER_VERSION = '5.1.9-0+deb12u1'

const expectedDecision: Batch1FinalRollupDecision =
  'open_source_tool_stack_batch1_final_rollup_passed_media_processing_still_blocked_ready_for_batch2_planning'
const primaryNextPrompt = 'OPEN_SOURCE_TOOL_STACK_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP'
const secondaryNextPrompt = 'PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1'
const primaryNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-batch-2-planning-after-batch-1-rollup.md'
const secondaryNextPromptPath =
  'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-open-source-batch-1.md'
const blockerPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-batch-1-final-rollup-blocker-resolution.md'

const predecessorPrs = [
  518, 514, 508, 504, 499, 494, 490, 486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427,
  421, 416,
]
const controlledToolPredecessors = [412, 407, 402, 399, 394, 388, 387]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]
const protectedFiles = ['package.json', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']
const forbiddenOutputPaths = [
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
  'node_modules',
]

const acceptedToolIds = [
  'sharp_libvips_import_version_probe',
  'duckdb_native_rebuild_import_query_proof',
  'polars_metadata_dataframe_proof',
  'ffmpeg_tracka_container_version_probe',
  'ffprobe_tracka_container_version_probe',
  'route_capability_manifest_validation',
  'fixture_report_validation',
  'open_source_inventory_proof_matrix_validation',
]

const stillBlockedScopes = [
  'media_processing',
  'media_file_probing',
  'decode_encode',
  'caption_burn_in',
  'render_export',
  'real_worker_jobs',
  'app_route_execution',
  'provider_model_calls',
  'browser_capture',
  'map_rendering',
  'supabase_writes',
  'sql',
  'gcs_upload',
  'public_artifacts',
  'signed_urls',
  'external_beta',
  'paid_production',
  'production',
  'raw_prompts',
]

const evidencePaths = {
  pr518Decision:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-decision.json',
  pr518Status:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa/central-open-source-status-update.json',
  pr514Decision:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.json',
  pr514Ffmpeg:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/ffmpeg-container-version-probe-report.json',
  pr514Ffprobe:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/ffprobe-container-version-probe-report.json',
  pr508Decision:
    'docs/open-source-tool-stack/tracka-build-context-generation-execution/build-context-generation-execution-decision.json',
  pr469Decision: 'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
  pr466Decision: 'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json',
  pr466DuckdbImport: 'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-import-proof-report.json',
  pr466DuckdbQuery: 'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-synthetic-query-report.json',
  pr455Decision:
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/package-binary-execution-decision.json',
  pr455Polars: 'docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json',
  pr439Decision: 'docs/open-source-tool-stack/batch-1-qa-review/batch-1-qa-review-decision.json',
  pr435Decision: 'docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json',
  pr435Sharp: 'docs/open-source-tool-stack/batch-1-execution/sharp-libvips-proof-report.json',
  pr435Route: 'docs/open-source-tool-stack/batch-1-execution/route-capability-manifest-validation-report.json',
  pr435Fixture: 'docs/open-source-tool-stack/batch-1-execution/fixture-report-validation-report.json',
  pr435Inventory: 'docs/open-source-tool-stack/batch-1-execution/inventory-proof-matrix-validation-report.json',
  pr416Decision: 'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  pr416Inventory: 'docs/open-source-tool-stack/open-source-tool-stack-inventory.json',
  pr416ProofMatrix: 'docs/open-source-tool-stack/open-source-tool-stack-proof-matrix.md',
}

const reportPaths = {
  sourceAudit: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/source-of-truth-audit.json`,
  evidenceRevalidation: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/evidence-revalidation-report.json`,
  evidenceRevalidationMd: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/evidence-revalidation-report.md`,
  acceptedToolsMatrix: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-1-accepted-tools-matrix.json`,
  acceptedToolsMatrixMd: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-1-accepted-tools-matrix.md`,
  stillBlockedScopeMatrix: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/still-blocked-scope-matrix.json`,
  stillBlockedScopeMatrixMd: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/still-blocked-scope-matrix.md`,
  internalBetaImpactReview: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/internal-beta-impact-review.json`,
  internalBetaImpactReviewMd: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/internal-beta-impact-review.md`,
  batch2PlanningHandoff: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-2-planning-handoff.json`,
  batch2PlanningHandoffMd: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-2-planning-handoff.md`,
  decision: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-1-final-rollup-decision.json`,
  decisionMd: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-1-final-rollup-decision.md`,
  readiness: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-1-final-rollup-readiness-report.json`,
  privateArtifactManifest: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-1-final-rollup-private-artifact-manifest.json`,
  validationResults: `${BATCH1_FINAL_ROLLUP_REPORT_DIR}/batch-1-final-rollup-validation-results.md`,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_AFTER_FFMPEG_FFPROBE_PROOF',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_BATCH1_EVIDENCE_ROLLUP',
    'REEDITPRO_CONFIRM_DUCKDB_POLARS_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_SHARP_LIBVIPS_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_VERSION_PROOF_REVIEW',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING_STILL_BLOCKED_REVIEW',
    'REEDITPRO_CONFIRM_INTERNAL_BETA_RELEVANCE_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DIST_OUTPUT_GENERATION',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_DOCKER_RUN',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_LOCAL_HOST_FFMPEG_FFPROBE',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_MEDIA_FILE_PROBE',
    'REEDITPRO_CONFIRM_MEDIA_DECODE_ENCODE',
    'REEDITPRO_CONFIRM_CAPTION_BURN_IN_EXECUTION',
    'REEDITPRO_CONFIRM_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_WORKER_EXECUTION',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
    'REEDITPRO_CONFIRM_PROVIDER_CALLS',
    'REEDITPRO_CONFIRM_BROWSER_CAPTURE',
    'REEDITPRO_CONFIRM_MAP_RENDERING',
    'REEDITPRO_CONFIRM_DEPENDENCY_INSTALL',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_PACKAGE_LIFECYCLE_SCRIPTS',
    'REEDITPRO_CONFIRM_DUCKDB_IMPORT_SMOKE',
    'REEDITPRO_CONFIRM_POLARS_IMPORT_SMOKE',
    'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
    'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
    'REEDITPRO_CONFIRM_GCS_UPLOAD',
    'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
    'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
    'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
    'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
    'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
    'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
    'REEDITPRO_CONFIRM_GITHUB_PR_MERGE',
    'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  ]
}

export function buildBatch1FinalRollupPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_AFTER_FFMPEG_FFPROBE_PROOF',
    branch: BATCH1_FINAL_ROLLUP_BRANCH,
    baseBranch: BATCH1_FINAL_ROLLUP_BASE_BRANCH,
    expectedSourceSha: BATCH1_FINAL_ROLLUP_SOURCE_SHA,
    mode: 'docs_diagnostics_source_of_truth_rollup_only',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    primaryNextPrompt,
    secondaryNextPrompt,
    reportDir: BATCH1_FINAL_ROLLUP_REPORT_DIR,
    reports: Object.values(reportPaths),
    acceptedToolIds,
    stillBlockedScopes,
    forbiddenActions: [
      'docker',
      'ffmpeg_ffprobe_probe',
      'build_context_generation',
      'media_processing_or_render_export',
      'npm_install_or_rebuild',
      'duckdb_or_polars_proof_rerun',
      'worker_route_provider_execution',
      'supabase_sql_gcs_public_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildBatch1FinalRollupReports(): Batch1FinalRollupReports {
  const generatedAt = new Date().toISOString()
  const evidence = readEvidenceReports()
  const protectedFileIntegrity = protectedFileIntegrityReport()
  const outputIntegrity = forbiddenOutputIntegrityReport()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, evidence, protectedFileIntegrity, outputIntegrity)
  const evidenceRevalidationReport = buildEvidenceRevalidationReport(generatedAt, evidence)
  const acceptedToolsMatrix = buildAcceptedToolsMatrix(generatedAt, evidence)
  const stillBlockedScopeMatrix = buildStillBlockedScopeMatrix(generatedAt, evidence, outputIntegrity)
  const internalBetaImpactReview = buildInternalBetaImpactReview(generatedAt, acceptedToolsMatrix, stillBlockedScopeMatrix)
  const batch2PlanningHandoff = buildBatch2PlanningHandoff(generatedAt)
  const decision = buildDecision(generatedAt, {
    evidenceRevalidationReport,
    acceptedToolsMatrix,
    stillBlockedScopeMatrix,
    internalBetaImpactReview,
    batch2PlanningHandoff,
    protectedFileIntegrity,
  })
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.batch1FinalRollup.readiness.v1',
    generatedAt,
    readiness: decision.decision === expectedDecision,
    decision: decision.decision,
    blockers: decision.blockers,
    primaryNextPrompt: decision.primaryNextPrompt,
    secondaryNextPrompt: decision.secondaryNextPrompt,
  }
  const privateArtifactManifest = {
    schema: 'reeditpro.openSourceToolStack.batch1FinalRollup.privateArtifactManifest.v1',
    generatedAt,
    reportDirectory: BATCH1_FINAL_ROLLUP_REPORT_DIR,
    rawGeneratedFileContentsCommitted: false,
    dockerBuildRunInThisPhase: false,
    dockerRunRunInThisPhase: false,
    ffmpegProbeRunInThisPhase: false,
    ffprobeProbeRunInThisPhase: false,
    localHostProbingRunInThisPhase: false,
    buildContextGenerationRunInThisPhase: false,
    mediaProcessingRunInThisPhase: false,
    renderExportRunInThisPhase: false,
    npmInstallRunInThisPhase: false,
    npmRebuildRunInThisPhase: false,
    duckdbProofRerunInThisPhase: false,
    polarsProofRerunInThisPhase: false,
    workersRoutesProvidersRunInThisPhase: false,
    supabaseWritesRunInThisPhase: false,
    gcsUploadRunInThisPhase: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    privatePayloadsAccessed: false,
    secretsAccessed: false,
    secretsPrinted: false,
    secretsCommitted: false,
    supabaseClassification: supabaseClassification(),
  }

  return {
    sourceOfTruthAudit,
    evidenceRevalidationReport,
    acceptedToolsMatrix,
    stillBlockedScopeMatrix,
    internalBetaImpactReview,
    batch2PlanningHandoff,
    decision,
    readinessReport,
    privateArtifactManifest,
  }
}

export function writeBatch1FinalRollupArtifacts() {
  validateConfirmations()
  const reports = buildBatch1FinalRollupReports()
  mkdirSync(BATCH1_FINAL_ROLLUP_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.evidenceRevalidation, reports.evidenceRevalidationReport)
  writeText(reportPaths.evidenceRevalidationMd, markdownReport('Evidence Revalidation', reports.evidenceRevalidationReport))
  writeJson(reportPaths.acceptedToolsMatrix, reports.acceptedToolsMatrix)
  writeText(reportPaths.acceptedToolsMatrixMd, acceptedMatrixMarkdown(reports.acceptedToolsMatrix))
  writeJson(reportPaths.stillBlockedScopeMatrix, reports.stillBlockedScopeMatrix)
  writeText(reportPaths.stillBlockedScopeMatrixMd, stillBlockedMarkdown(reports.stillBlockedScopeMatrix))
  writeJson(reportPaths.internalBetaImpactReview, reports.internalBetaImpactReview)
  writeText(reportPaths.internalBetaImpactReviewMd, markdownReport('Internal Beta Impact Review', reports.internalBetaImpactReview))
  writeJson(reportPaths.batch2PlanningHandoff, reports.batch2PlanningHandoff)
  writeText(reportPaths.batch2PlanningHandoffMd, markdownReport('Batch 2 Planning Handoff', reports.batch2PlanningHandoff))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationMarkdown(reports))
  writeNextPrompts(reports.decision)
  updateStatusDocs(reports.decision)
  return reports
}

export function readBatch1FinalRollupArtifacts(): Batch1FinalRollupReports {
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit),
    evidenceRevalidationReport: readJson(reportPaths.evidenceRevalidation) as Batch1FinalRollupReport,
    acceptedToolsMatrix: readJson(reportPaths.acceptedToolsMatrix) as Batch1FinalRollupReport,
    stillBlockedScopeMatrix: readJson(reportPaths.stillBlockedScopeMatrix) as Batch1FinalRollupReport,
    internalBetaImpactReview: readJson(reportPaths.internalBetaImpactReview) as Batch1FinalRollupReport,
    batch2PlanningHandoff: readJson(reportPaths.batch2PlanningHandoff) as Batch1FinalRollupReport,
    decision: readJson(reportPaths.decision),
    readinessReport: readJson(reportPaths.readiness),
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest),
  }
}

function validateConfirmations() {
  const missing = requiredConfirmations().filter((name) => process.env[name] !== 'true')
  if (missing.length) throw new Error(`missing_required_confirmations:${missing.join(',')}`)
  const forbidden = forbiddenConfirmations().filter((name) => process.env[name] === 'true')
  if (forbidden.length) throw new Error(`forbidden_confirmations:${forbidden.join(',')}`)
}

function readEvidenceReports() {
  return Object.fromEntries(Object.entries(evidencePaths).map(([key, filePath]) => [key, evidenceFile(filePath)]))
}

function evidenceFile(filePath: string) {
  const exists = existsSync(filePath)
  return {
    path: filePath,
    exists,
    sha256: exists ? sha256(filePath) : null,
    json: filePath.endsWith('.json') && exists ? readJson(filePath) : undefined,
  }
}

function buildSourceOfTruthAudit(
  generatedAt: string,
  evidence: JsonRecord,
  protectedFileIntegrity: JsonRecord,
  outputIntegrity: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.batch1FinalRollup.sourceAudit.v1',
    generatedAt,
    phase: 'OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_AFTER_FFMPEG_FFPROBE_PROOF',
    branch: BATCH1_FINAL_ROLLUP_BRANCH,
    baseBranch: BATCH1_FINAL_ROLLUP_BASE_BRANCH,
    expectedSourceSha: BATCH1_FINAL_ROLLUP_SOURCE_SHA,
    liveSourceSha: gitOutput(['rev-parse', 'HEAD']),
    predecessorPrs,
    controlledToolPredecessors,
    referenceOnlyPrs,
    sourceEvidence: evidence,
    protectedFileIntegrity,
    outputIntegrity,
    broadProductionDocs: {
      betaReadinessScorecard: existsSync('docs/beta-readiness-scorecard.md') ? 'present' : 'absent_audit_fact',
      productionBetaBlockerInventory: existsSync('docs/production-beta-blocker-inventory.md') ? 'present' : 'absent_audit_fact',
      productionFoundationStatus: existsSync('PRODUCTION_FOUNDATION_STATUS.md') ? 'present' : 'absent_audit_fact',
    },
    supabaseClassification: supabaseClassification(),
  }
}

function buildEvidenceRevalidationReport(generatedAt: string, evidence: JsonRecord): Batch1FinalRollupReport {
  const checks = [
    ['pr518_qa_decision_present', evidenceExists(evidence, 'pr518Decision')],
    ['pr518_status_update_present', evidenceExists(evidence, 'pr518Status')],
    ['pr514_rerun_decision_present', evidenceExists(evidence, 'pr514Decision')],
    ['pr514_ffmpeg_report_present', evidenceExists(evidence, 'pr514Ffmpeg')],
    ['pr514_ffprobe_report_present', evidenceExists(evidence, 'pr514Ffprobe')],
    ['pr508_build_context_generation_present', evidenceExists(evidence, 'pr508Decision')],
    ['pr469_duckdb_qa_present', evidenceExists(evidence, 'pr469Decision')],
    ['pr466_duckdb_execution_present', evidenceExists(evidence, 'pr466Decision')],
    ['pr455_polars_execution_present', evidenceExists(evidence, 'pr455Decision')],
    ['pr439_batch1_qa_present', evidenceExists(evidence, 'pr439Decision')],
    ['pr435_batch1_execution_present', evidenceExists(evidence, 'pr435Decision')],
    ['pr416_open_source_audit_present', evidenceExists(evidence, 'pr416Inventory')],
  ].map(([id, passed]) => ({ id, passed }))
  return rollupReport('reeditpro.openSourceToolStack.batch1FinalRollup.evidenceRevalidation.v1', generatedAt, checks.every((check) => check.passed), {
    checks,
    validationOnly: true,
    runtimeCommandsRun: false,
  })
}

function buildAcceptedToolsMatrix(generatedAt: string, evidence: JsonRecord): Batch1FinalRollupReport {
  const pr518 = evidenceJson(evidence, 'pr518Decision')
  const pr518Status = evidenceJson(evidence, 'pr518Status')
  const pr518StatusDetails = (pr518Status.details as JsonRecord | undefined) ?? {}
  const pr514Ffmpeg = evidenceJson(evidence, 'pr514Ffmpeg')
  const pr514Ffprobe = evidenceJson(evidence, 'pr514Ffprobe')
  const pr469 = evidenceJson(evidence, 'pr469Decision')
  const pr466 = evidenceJson(evidence, 'pr466Decision')
  const pr455 = evidenceJson(evidence, 'pr455Decision')
  const pr435Decision = evidenceJson(evidence, 'pr435Decision')
  const sharp = evidenceJson(evidence, 'pr435Sharp')
  const route = evidenceJson(evidence, 'pr435Route')
  const fixture = evidenceJson(evidence, 'pr435Fixture')
  const inventory = evidenceJson(evidence, 'pr435Inventory')

  const rows = [
    acceptedToolRow('Sharp/libvips', 'sharp_libvips_import_version_probe', 'image_processing_metadata', {
      accepted: boolValue(sharp.passed) && stringValue(sharp.status) === 'passed',
      proofBoundary: 'import_version_only_no_image_processing',
      version: stringValue(sharp.version),
      evidence: evidencePath(evidence, 'pr435Sharp'),
      mediaProcessingAccepted: false,
    }),
    acceptedToolRow('DuckDB', 'duckdb_native_rebuild_import_query_proof', 'metadata_query', {
      accepted:
        boolValue(pr469.duckdbAcceptedAsInstalledAndProven) &&
        stringValue(pr466.decision) === 'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing',
      proofBoundary: 'native_rebuild_import_api_shape_in_memory_query',
      version: '1.4.4',
      evidence: [evidencePath(evidence, 'pr469Decision'), evidencePath(evidence, 'pr466Decision')],
      mediaProcessingAccepted: false,
    }),
    acceptedToolRow('Polars', 'polars_metadata_dataframe_proof', 'metadata_dataframe', {
      accepted: boolValue(pr469.polarsAcceptedAsInstalledAndProven) && arrayValue(pr455.installedPackageTargets).includes('polars_metadata_dataframe_proof'),
      proofBoundary: 'import_version_in_memory_dataframe_metadata',
      version: '0.25.1',
      evidence: [evidencePath(evidence, 'pr469Decision'), evidencePath(evidence, 'pr455Decision'), evidencePath(evidence, 'pr455Polars')],
      mediaProcessingAccepted: false,
    }),
    acceptedToolRow('FFmpeg', 'ffmpeg_tracka_container_version_probe', 'tracka_container_version_only', {
      accepted:
        boolValue(pr518.ffmpegAcceptedAsVersionProvenForTrackaContainerPath) &&
        stringValue(pr518StatusDetails.ffmpeg) === 'version_proven_for_tracka_container_path_only' &&
        versionLine(pr514Ffmpeg).includes(FFMPEG_FFPROBE_CONTAINER_VERSION),
      proofBoundary: 'tracka_container_version_only_no_media_processing',
      version: FFMPEG_FFPROBE_CONTAINER_VERSION,
      evidence: [evidencePath(evidence, 'pr518Decision'), evidencePath(evidence, 'pr514Ffmpeg')],
      mediaProcessingAccepted: false,
      containerPathOnly: true,
    }),
    acceptedToolRow('FFprobe', 'ffprobe_tracka_container_version_probe', 'tracka_container_version_only', {
      accepted:
        boolValue(pr518.ffprobeAcceptedAsVersionProvenForTrackaContainerPath) &&
        stringValue(pr518StatusDetails.ffprobe) === 'version_proven_for_tracka_container_path_only' &&
        versionLine(pr514Ffprobe).includes(FFMPEG_FFPROBE_CONTAINER_VERSION),
      proofBoundary: 'tracka_container_version_only_no_media_file_probe',
      version: FFMPEG_FFPROBE_CONTAINER_VERSION,
      evidence: [evidencePath(evidence, 'pr518Decision'), evidencePath(evidence, 'pr514Ffprobe')],
      mediaFileProbingAccepted: false,
      containerPathOnly: true,
    }),
    acceptedToolRow('Route/capability manifest validation', 'route_capability_manifest_validation', 'committed_metadata_validation', {
      accepted: boolValue(route.passed) && stringValue(route.status) === 'passed',
      proofBoundary: 'committed_docs_and_reports_only',
      evidence: evidencePath(evidence, 'pr435Route'),
    }),
    acceptedToolRow('Fixture/report validation', 'fixture_report_validation', 'committed_report_validation', {
      accepted: boolValue(fixture.passed) && stringValue(fixture.status) === 'passed',
      proofBoundary: 'committed_fixture_report_validation_only',
      evidence: evidencePath(evidence, 'pr435Fixture'),
    }),
    acceptedToolRow('Open-source inventory/proof matrix validation', 'open_source_inventory_proof_matrix_validation', 'committed_inventory_validation', {
      accepted: boolValue(inventory.passed) && stringValue(inventory.status) === 'passed' && stringValue(pr435Decision.decision).includes('passed'),
      proofBoundary: 'committed_inventory_and_proof_matrix_only',
      evidence: [evidencePath(evidence, 'pr435Inventory'), evidencePath(evidence, 'pr416Inventory'), evidencePath(evidence, 'pr416ProofMatrix')],
    }),
  ]
  const accepted = rows.length === acceptedToolIds.length && rows.every((row) => row.accepted === true)
  return rollupReport('reeditpro.openSourceToolStack.batch1FinalRollup.acceptedToolsMatrix.v1', generatedAt, accepted, {
    rows,
    acceptedToolIds,
    ffmpegFfprobeVersion: FFMPEG_FFPROBE_CONTAINER_VERSION,
    ffmpegContainerPathOnly: true,
    ffprobeContainerPathOnly: true,
    mediaProcessingAccepted: false,
    mediaFileProbingAccepted: false,
  })
}

function buildStillBlockedScopeMatrix(
  generatedAt: string,
  evidence: JsonRecord,
  outputIntegrity: JsonRecord,
): Batch1FinalRollupReport {
  const pr518 = evidenceJson(evidence, 'pr518Decision')
  const rows = stillBlockedScopes.map((scope) => ({
    scope,
    blocked: true,
    acceptedForBatch1: false,
    source: scope.includes('media') || scope.includes('render') ? evidencePath(evidence, 'pr518Decision') : 'rollup_policy',
  }))
  const falseFields = [
    'mediaProcessingAccepted',
    'captionBurnInAccepted',
    'renderExportAccepted',
    'dockerBuildRunInThisPhase',
    'dockerRunRunInThisPhase',
    'ffmpegProbeRunInThisPhase',
    'ffprobeProbeRunInThisPhase',
    'buildContextGenerationRunInThisPhase',
    'npmInstallRunInThisPhase',
    'npmRebuildRunInThisPhase',
    'workerExecutionRunInThisPhase',
    'routeExecutionRunInThisPhase',
    'providerCallsRunInThisPhase',
    'supabaseWritesRunInThisPhase',
    'gcsUploadRunInThisPhase',
    'publicArtifactsCreatedInThisPhase',
    'signedUrlsCreatedInThisPhase',
    'betaProductionUnlockedInThisPhase',
    'rawPromptsRunInThisPhase',
    'secretsPrintedInThisPhase',
  ]
  const fieldChecks = falseFields.map((field) => ({ field, passed: pr518[field] === false }))
  const accepted =
    rows.every((row) => row.blocked === true && row.acceptedForBatch1 === false) &&
    fieldChecks.every((check) => check.passed)
  return rollupReport('reeditpro.openSourceToolStack.batch1FinalRollup.stillBlockedScopeMatrix.v1', generatedAt, accepted, {
    rows,
    fieldChecks,
    outputIntegrity,
    externalBetaUnlocked: false,
    paidProductionUnlocked: false,
    productionUnlocked: false,
  })
}

function buildInternalBetaImpactReview(
  generatedAt: string,
  acceptedToolsMatrix: Batch1FinalRollupReport,
  stillBlockedScopeMatrix: Batch1FinalRollupReport,
): Batch1FinalRollupReport {
  const accepted = acceptedToolsMatrix.accepted && stillBlockedScopeMatrix.accepted
  return rollupReport('reeditpro.openSourceToolStack.batch1FinalRollup.internalBetaImpact.v1', generatedAt, accepted, {
    impact: 'improves_internal_testing_evidence_but_does_not_unlock_external_beta_or_production',
    internalTestingOnly: true,
    externalBetaReady: false,
    paidProductionReady: false,
    productionReady: false,
    requiredBeforeExternalBeta: [
      'media_processing_scope_review',
      'render_export_scope_review',
      'worker_route_provider_runtime_review',
      'supabase_gcs_public_delivery_review',
      'product_beta_readiness_aggregation',
    ],
  })
}

function buildBatch2PlanningHandoff(generatedAt: string): Batch1FinalRollupReport {
  const recommendations = [
    'AI graphics installed/proven PR evidence rollup for the owner lane.',
    'Sound OSS final scoped evidence rollup.',
    'Track A restricted beta scope and E2E planning.',
    'Central Batch 2 candidates selected from the 71-candidate inventory.',
    'Preserve approval gates, source-of-truth checks, and blocked runtime/product scopes.',
  ]
  return rollupReport('reeditpro.openSourceToolStack.batch1FinalRollup.batch2PlanningHandoff.v1', generatedAt, true, {
    primaryNextPrompt,
    secondaryNextPrompt,
    recommendations,
    batch2ExecutionApprovedNow: false,
    betaProductionApprovedNow: false,
  })
}

function buildDecision(
  generatedAt: string,
  inputs: {
    evidenceRevalidationReport: Batch1FinalRollupReport
    acceptedToolsMatrix: Batch1FinalRollupReport
    stillBlockedScopeMatrix: Batch1FinalRollupReport
    internalBetaImpactReview: Batch1FinalRollupReport
    batch2PlanningHandoff: Batch1FinalRollupReport
    protectedFileIntegrity: JsonRecord
  },
) {
  let decision: Batch1FinalRollupDecision = expectedDecision
  const blockers: string[] = []
  if (!inputs.evidenceRevalidationReport.accepted) {
    decision = 'blocked_pending_batch1_evidence_revalidation'
    blockers.push('batch1_source_evidence_missing_or_inconsistent')
  } else if (!inputs.acceptedToolsMatrix.accepted) {
    decision = 'blocked_pending_accepted_tools_matrix_review'
    blockers.push('accepted_tool_matrix_not_complete')
  } else if (!inputs.stillBlockedScopeMatrix.accepted) {
    decision = 'blocked_pending_still_blocked_scope_review'
    blockers.push('still_blocked_scope_matrix_not_safe')
  } else if (!inputs.internalBetaImpactReview.accepted) {
    decision = 'blocked_pending_internal_beta_impact_review'
    blockers.push('internal_beta_impact_review_not_safe')
  } else if (!inputs.batch2PlanningHandoff.accepted) {
    decision = 'blocked_pending_batch2_planning_handoff'
    blockers.push('batch2_handoff_not_ready')
  } else if (!boolValue(inputs.protectedFileIntegrity.passed)) {
    decision = 'rejected_due_runtime_safety_risk'
    blockers.push('protected_file_integrity_failed')
  }
  return {
    schema: 'reeditpro.openSourceToolStack.batch1FinalRollup.decision.v1',
    generatedAt,
    decision,
    readiness: decision === expectedDecision,
    acceptedTools: acceptedToolIds,
    ffmpegVersionProvenForTrackaContainerPathOnly: decision === expectedDecision,
    ffprobeVersionProvenForTrackaContainerPathOnly: decision === expectedDecision,
    ffmpegVersion: FFMPEG_FFPROBE_CONTAINER_VERSION,
    ffprobeVersion: FFMPEG_FFPROBE_CONTAINER_VERSION,
    mediaProcessingAccepted: false,
    mediaFileProbingAccepted: false,
    captionBurnInAccepted: false,
    renderExportAccepted: false,
    internalBetaEvidenceImproved: decision === expectedDecision,
    externalBetaUnlocked: false,
    paidProductionUnlocked: false,
    productionUnlocked: false,
    primaryNextPrompt: decision === expectedDecision ? primaryNextPrompt : 'OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_BLOCKER_RESOLUTION',
    secondaryNextPrompt: decision === expectedDecision ? secondaryNextPrompt : null,
    primaryNextPromptFile: decision === expectedDecision ? primaryNextPromptPath : blockerPromptPath,
    secondaryNextPromptFile: decision === expectedDecision ? secondaryNextPromptPath : null,
    blockers,
    dockerBuildRunInThisPhase: false,
    dockerRunRunInThisPhase: false,
    ffmpegProbeRunInThisPhase: false,
    ffprobeProbeRunInThisPhase: false,
    localHostProbingRunInThisPhase: false,
    buildContextGenerationRunInThisPhase: false,
    mediaProcessingRunInThisPhase: false,
    renderExportRunInThisPhase: false,
    npmInstallRunInThisPhase: false,
    npmRebuildRunInThisPhase: false,
    duckdbProofRerunInThisPhase: false,
    polarsProofRerunInThisPhase: false,
    workerExecutionRunInThisPhase: false,
    routeExecutionRunInThisPhase: false,
    providerCallsRunInThisPhase: false,
    browserCaptureRunInThisPhase: false,
    mapRenderingRunInThisPhase: false,
    supabaseWritesRunInThisPhase: false,
    sqlRunInThisPhase: false,
    gcsUploadRunInThisPhase: false,
    publicArtifactsCreatedInThisPhase: false,
    signedUrlsCreatedInThisPhase: false,
    rawPromptsRunInThisPhase: false,
    secretsPrintedInThisPhase: false,
    supabaseClassification: supabaseClassification(),
  }
}

function acceptedToolRow(toolName: string, normalizedId: string, category: string, details: JsonRecord) {
  return {
    toolName,
    normalizedId,
    category,
    status: details.accepted ? 'accepted_proven' : 'blocked',
    accepted: details.accepted === true,
    owner: category.includes('container') ? 'TRACK_A_RENDER_EXPORT' : 'OPEN_SOURCE_TOOL_STACK',
    details,
  }
}

function rollupReport(
  schema: string,
  generatedAt: string,
  accepted: boolean,
  details: JsonRecord,
): Batch1FinalRollupReport {
  return {
    schema,
    generatedAt,
    status: accepted ? 'accepted' : 'blocked',
    accepted,
    warnings: accepted ? ['media_processing_render_export_external_beta_and_production_remain_blocked'] : [],
    blockers: accepted ? [] : ['rollup_review_failed'],
    details,
  }
}

function protectedFileIntegrityReport() {
  const files = protectedFiles.map((filePath) => ({
    path: filePath,
    exists: existsSync(filePath),
    sha256: sha256OrNull(filePath),
    gitStatus: gitOutput(['status', '--short', '--', filePath]),
    dependencySectionsUnchanged: filePath === 'package.json' ? packageDependencySectionsUnchanged() : true,
    allowedLocalScriptChange: filePath === 'package.json',
  }))
  return {
    schema: 'reeditpro.openSourceToolStack.batch1FinalRollup.protectedFileIntegrity.v1',
    files,
    passed: files.every((file) => {
      if (!file.exists) return false
      if (file.path === 'package.json') return file.dependencySectionsUnchanged
      return !file.gitStatus
    }),
  }
}

function forbiddenOutputIntegrityReport() {
  const outputs = forbiddenOutputPaths.map((filePath) => ({
    path: filePath,
    exists: existsSync(filePath),
    gitStatus: gitOutput(['status', '--short', '--', filePath]),
    validationOnlyDependencyDirectory: filePath === 'node_modules',
  }))
  return {
    schema: 'reeditpro.openSourceToolStack.batch1FinalRollup.outputIntegrity.v1',
    outputs,
    passed: outputs.every((output) => (!output.exists || output.validationOnlyDependencyDirectory) && !output.gitStatus),
  }
}

function writeNextPrompts(decision: JsonRecord) {
  if (decision.decision !== expectedDecision) {
    writeText(
      blockerPromptPath,
      '# OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_BLOCKER_RESOLUTION\n\nResolve the blocked Batch 1 final rollup evidence before Batch 2 planning.\n',
    )
    return
  }
  writeText(
    primaryNextPromptPath,
    [
      '# OPEN_SOURCE_TOOL_STACK_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP',
      '',
      'Plan the next open-source tool stack Batch 2 candidates using the Batch 1 final rollup as central source-of-truth evidence.',
      '',
      'Inputs:',
      '- Sharp/libvips, DuckDB, Polars, route/capability manifest validation, fixture/report validation, and inventory/proof matrix validation are accepted/proven for their bounded Batch 1 scopes.',
      `- FFmpeg and FFprobe are version-proven only for the Track A container path at \`${FFMPEG_FFPROBE_CONTAINER_VERSION}\`.`,
      '- Media processing, media file probing, caption burn-in, render/export, workers/routes/providers, Supabase/GCS, public delivery, beta, and production remain blocked.',
      '- Preserve source-of-truth preflight, package-lock integrity, Docker/package mutation guards, and Supabase no-write classification.',
      '',
    ].join('\n'),
  )
  writeText(
    secondaryNextPromptPath,
    [
      '# PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1',
      '',
      'Aggregate internal beta readiness after the open-source Batch 1 final rollup.',
      '',
      'Scope:',
      '- Treat the Batch 1 rollup as improved internal-testing evidence only.',
      '- Do not unlock external beta, paid production, production, runtime execution, Supabase writes, GCS delivery, public artifacts, or signed URLs.',
      '- Keep absent broad production docs as audit facts unless a later prompt explicitly authorizes creating them.',
      '',
    ].join('\n'),
  )
}

function updateStatusDocs(decision: JsonRecord) {
  const section = [
    '',
    '## Open-Source Tool Stack Batch 1 Final Rollup After FFmpeg/FFprobe Proof',
    '',
    `- Source SHA: \`${BATCH1_FINAL_ROLLUP_SOURCE_SHA}\``,
    `- Decision: \`${decision.decision}\``,
    '- Accepted/proven Batch 1 targets: Sharp/libvips, DuckDB, Polars, route/capability manifest validation, fixture/report validation, and open-source inventory/proof matrix validation.',
    `- FFmpeg and FFprobe: version-proven only for the Track A container path at \`${FFMPEG_FFPROBE_CONTAINER_VERSION}\`.`,
    '- Media processing, media file probing, caption burn-in, render/export, workers, routes, providers, Supabase/GCS, public delivery, beta, and production remain blocked.',
    `- Primary next prompt: \`${decision.primaryNextPrompt}\``,
    `- Secondary next prompt: \`${decision.secondaryNextPrompt}\``,
    '- Supabase: no write / environment none / SQL none / migration no.',
    '',
  ].join('\n')
  for (const filePath of statusDocPaths) appendText(filePath, section)
}

function acceptedMatrixMarkdown(report: Batch1FinalRollupReport) {
  const rows = arrayValue(report.details.rows)
  return [
    '# Batch 1 Accepted Tools Matrix',
    '',
    '| Tool | Scope | Status | Boundary |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => {
      const item = row as JsonRecord
      const details = item.details as JsonRecord
      return `| ${item.toolName} | ${item.category} | ${item.status} | ${details.proofBoundary} |`
    }),
    '',
  ].join('\n')
}

function stillBlockedMarkdown(report: Batch1FinalRollupReport) {
  const rows = arrayValue(report.details.rows)
  return [
    '# Still-Blocked Scope Matrix',
    '',
    '| Scope | Blocked | Accepted For Batch 1 |',
    '| --- | --- | --- |',
    ...rows.map((row) => {
      const item = row as JsonRecord
      return `| ${item.scope} | ${item.blocked} | ${item.acceptedForBatch1} |`
    }),
    '',
  ].join('\n')
}

function decisionMarkdown(decision: JsonRecord) {
  return [
    '# Batch 1 Final Rollup Decision',
    '',
    `Decision: \`${decision.decision}\``,
    '',
    `Primary next prompt: \`${decision.primaryNextPrompt}\``,
    '',
    `Secondary next prompt: \`${decision.secondaryNextPrompt}\``,
    '',
    `FFmpeg/FFprobe version: \`${FFMPEG_FFPROBE_CONTAINER_VERSION}\` for the Track A container path only.`,
    '',
    'Media processing, media file probing, caption burn-in, render/export, workers/routes/providers, Supabase/GCS, public delivery, external beta, paid production, and production remain blocked.',
    '',
  ].join('\n')
}

function validationMarkdown(reports: Batch1FinalRollupReports) {
  return [
    '# Batch 1 Final Rollup Validation Results',
    '',
    `Decision: \`${reports.decision.decision}\``,
    '',
    `Evidence revalidation accepted: ${reports.evidenceRevalidationReport.accepted}`,
    `Accepted tools matrix accepted: ${reports.acceptedToolsMatrix.accepted}`,
    `Still-blocked scope matrix accepted: ${reports.stillBlockedScopeMatrix.accepted}`,
    `Internal beta impact review accepted: ${reports.internalBetaImpactReview.accepted}`,
    `Batch 2 planning handoff accepted: ${reports.batch2PlanningHandoff.accepted}`,
    '',
    'No Docker, FFmpeg/FFprobe, build-context generation, media/render/export, installs/rebuilds, DuckDB/Polars proofs, workers/routes/providers, Supabase/GCS, public artifact, signed URL, raw prompt, beta, production, or PR merge execution is performed by this rollup.',
    '',
  ].join('\n')
}

function markdownReport(title: string, report: JsonRecord) {
  return [`# ${title}`, '', '```json', JSON.stringify(report, null, 2), '```', ''].join('\n')
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'not_applicable',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}

function evidenceExists(evidence: JsonRecord, key: string) {
  return boolValue((evidence[key] as JsonRecord | undefined)?.exists)
}

function evidenceJson(evidence: JsonRecord, key: string): JsonRecord {
  const entry = evidence[key] as JsonRecord | undefined
  return (entry?.json as JsonRecord | undefined) ?? {}
}

function evidencePath(evidence: JsonRecord, key: string) {
  return stringValue((evidence[key] as JsonRecord | undefined)?.path)
}

function versionLine(report: JsonRecord) {
  const summary = arrayValue(report.versionSummary)
  const first = summary[0]
  return typeof first === 'string' ? first : ''
}

function readJson(filePath: string): JsonRecord {
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
}

function writeJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(filePath: string, value: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`)
}

function appendText(filePath: string, value: string) {
  if (!existsSync(filePath)) return
  const existing = readFileSync(filePath, 'utf8')
  writeText(filePath, `${existing.trimEnd()}\n${value}`)
}

function sha256(filePath: string) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function sha256OrNull(filePath: string) {
  return existsSync(filePath) ? sha256(filePath) : null
}

function gitOutput(args: string[]) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    }).trim()
  } catch {
    return ''
  }
}

function packageDependencySectionsUnchanged() {
  try {
    const current = readJson('package.json')
    const base = JSON.parse(gitOutput(['show', `origin/${BATCH1_FINAL_ROLLUP_BASE_BRANCH}:package.json`])) as JsonRecord
    const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
    return sections.every((section) => JSON.stringify(current[section] ?? {}) === JSON.stringify(base[section] ?? {}))
  } catch {
    return false
  }
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function boolValue(value: unknown) {
  return value === true
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
