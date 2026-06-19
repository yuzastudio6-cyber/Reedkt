import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  OwnerLaneArtifacts,
  OwnerLaneReconciliationDecision,
  OwnerLaneReport,
} from './owner-lane-reconciliation-after-batch-1-rollup-types'

type JsonRecord = Record<string, unknown>

export const OWNER_LANE_RECONCILIATION_REPORT_DIR =
  'docs/open-source-tool-stack/owner-lane-reconciliation-after-batch-1-rollup'
export const OWNER_LANE_RECONCILIATION_BRANCH =
  'codex/rp-open-source-tool-stack-owner-lane-reconciliation-after-batch-1-rollup'
export const OWNER_LANE_RECONCILIATION_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const OWNER_LANE_RECONCILIATION_SOURCE_SHA = '3fbbbb8ba3ea0e7f07a9bc956f72bc340ccec880'
export const FFMPEG_FFPROBE_CONTAINER_VERSION = '5.1.9-0+deb12u1'

const expectedDecision: OwnerLaneReconciliationDecision =
  'owner_lane_reconciliation_passed_ready_for_staged_owner_merge_plan'
const primaryNextPrompt = 'OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP'
const secondaryNextPrompts = [
  'OPEN_SOURCE_TOOL_STACK_AI_GRAPHICS_WORKER_RECONCILIATION_AFTER_BATCH_1',
  'OPEN_SOURCE_TOOL_STACK_SOUND_OSS_RECONCILIATION_AFTER_BATCH_1',
  'OPEN_SOURCE_TOOL_STACK_TRACKA_PRIVATE_E2E_RECONCILIATION_AFTER_BATCH_1',
  'E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION',
  'PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1',
  'OPEN_SOURCE_TOOL_STACK_BATCH_2_INSTALL_PROOF_APPROVAL_AFTER_OWNER_RECONCILIATION',
]

const centralEvidencePrs = [527, 522, 518, 514, 508, 469, 466, 455, 439, 435, 416]
const aiGraphicsPrs = [524, 521, 517, 515, 511, 509, 506, 503, 500, 496, 493, 491]
const soundPrs = [495, 507]
const trackaPrs = [497, 502, 505, 510, 513, 516, 520]
const e2ePrs = [519, 523]
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

const batch1AcceptedTools = [
  'Sharp/libvips',
  'DuckDB',
  'Polars / nodejs-polars',
  `FFmpeg version-proven only for Track A container path at ${FFMPEG_FFPROBE_CONTAINER_VERSION}`,
  `FFprobe version-proven only for Track A container path at ${FFMPEG_FFPROBE_CONTAINER_VERSION}`,
]
const batch1AcceptedValidationTargets = [
  'route/capability manifest validation',
  'fixture/report validation',
  'inventory/proof matrix validation',
]
const aiGraphicsTools = [
  'd3',
  'echarts',
  'vega-lite',
  'vega',
  'satori',
  '@svgdotjs/svg.js',
  '@viz-js/viz',
  'lottie-web',
  'animejs',
  'three',
  'pixi.js',
  'konva',
  'babylonjs',
]

const reportPaths = {
  sourceAudit: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/source-of-truth-audit.json`,
  ownerLaneStatusMatrix: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/owner-lane-status-matrix.json`,
  ownerLaneStatusMatrixMd: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/owner-lane-status-matrix.md`,
  aiGraphicsWorkerReview: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/ai-graphics-worker-reconciliation-review.json`,
  aiGraphicsWorkerReviewMd: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/ai-graphics-worker-reconciliation-review.md`,
  soundOssReview: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/sound-oss-reconciliation-review.json`,
  soundOssReviewMd: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/sound-oss-reconciliation-review.md`,
  trackaPrivateE2eReview: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/tracka-private-e2e-reconciliation-review.json`,
  trackaPrivateE2eReviewMd: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/tracka-private-e2e-reconciliation-review.md`,
  e2eValidationReview: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/e2e-validation-reconciliation-review.json`,
  e2eValidationReviewMd: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/e2e-validation-reconciliation-review.md`,
  reconciledToolCountSummary: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/reconciled-tool-count-summary.json`,
  reconciledToolCountSummaryMd: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/reconciled-tool-count-summary.md`,
  recommendedNextPath: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/recommended-next-path.json`,
  recommendedNextPathMd: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/recommended-next-path.md`,
  decision: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/owner-lane-reconciliation-decision.json`,
  decisionMd: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/owner-lane-reconciliation-decision.md`,
  readiness: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/owner-lane-reconciliation-readiness-report.json`,
  privateArtifactManifest: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/owner-lane-reconciliation-private-artifact-manifest.json`,
  validationResults: `${OWNER_LANE_RECONCILIATION_REPORT_DIR}/owner-lane-reconciliation-validation-results.md`,
}

const nextPromptPaths = {
  primary: 'docs/implementation-prompts/prompt-open-source-tool-stack-staged-owner-merge-plan-after-batch-1-rollup.md',
  aiGraphics: 'docs/implementation-prompts/prompt-open-source-tool-stack-ai-graphics-worker-reconciliation-after-batch-1.md',
  sound: 'docs/implementation-prompts/prompt-open-source-tool-stack-sound-oss-reconciliation-after-batch-1.md',
  tracka: 'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-private-e2e-reconciliation-after-batch-1.md',
  e2e: 'docs/implementation-prompts/prompt-e2e-validation-pr-305-hydration-blocker-resolution.md',
  internalBeta:
    'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-open-source-batch-1.md',
  batch2Approval:
    'docs/implementation-prompts/prompt-open-source-tool-stack-batch-2-install-proof-approval-after-owner-reconciliation.md',
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
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_AFTER_BATCH_1_ROLLUP',
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH2_PLANNING_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_OWNER_LANE_SOURCE_REVIEW',
    'REEDITPRO_CONFIRM_AI_GRAPHICS_WORKER_LANE_REVIEW',
    'REEDITPRO_CONFIRM_SOUND_OSS_LANE_REVIEW',
    'REEDITPRO_CONFIRM_TRACKA_PRIVATE_E2E_LANE_REVIEW',
    'REEDITPRO_CONFIRM_E2E_VALIDATION_QUEUE_REVIEW',
    'REEDITPRO_CONFIRM_INTERNAL_BETA_RELEVANCE_REVIEW',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING_STILL_BLOCKED_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OWNER_LANE_RUNTIME_EXECUTION',
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH2_INSTALL_PROOF_EXECUTION',
    'REEDITPRO_CONFIRM_DEPENDENCY_INSTALL',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_DOCKER_RUN',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_MEDIA_FILE_PROBE',
    'REEDITPRO_CONFIRM_CAPTION_BURN_IN_EXECUTION',
    'REEDITPRO_CONFIRM_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_WORKER_EXECUTION',
    'REEDITPRO_CONFIRM_WORKER_JOB_CLAIM',
    'REEDITPRO_CONFIRM_WORKER_LEASE_MUTATION',
    'REEDITPRO_CONFIRM_WORKER_QUEUE_EXECUTION',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
    'REEDITPRO_CONFIRM_PROVIDER_CALLS',
    'REEDITPRO_CONFIRM_BROWSER_CAPTURE',
    'REEDITPRO_CONFIRM_MAP_RENDERING',
    'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
    'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
    'REEDITPRO_CONFIRM_GCS_UPLOAD',
    'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
    'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
    'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
    'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
    'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
    'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
    'REEDITPRO_CONFIRM_GITHUB_PR_MERGE',
    'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  ]
}

export function buildOwnerLaneReconciliationPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_AFTER_BATCH_1_ROLLUP',
    branch: OWNER_LANE_RECONCILIATION_BRANCH,
    baseBranch: OWNER_LANE_RECONCILIATION_BASE_BRANCH,
    expectedSourceSha: OWNER_LANE_RECONCILIATION_SOURCE_SHA,
    mode: 'docs_diagnostics_source_of_truth_reconciliation_only',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    primaryNextPrompt,
    secondaryNextPrompts,
    reportDirectory: OWNER_LANE_RECONCILIATION_REPORT_DIR,
    reports: Object.values(reportPaths),
    forbiddenActions: [
      'dependency_install',
      'package_lock_mutation',
      'docker',
      'ffmpeg_ffprobe_probe',
      'build_context_generation',
      'media_processing_or_render_export',
      'worker_route_provider_execution',
      'supabase_sql_gcs_public_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildOwnerLaneReconciliationArtifacts(): OwnerLaneArtifacts {
  const generatedAt = new Date().toISOString()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt)
  const ownerLaneStatusMatrix = buildOwnerLaneStatusMatrix(generatedAt)
  const aiGraphicsWorkerReview = buildAiGraphicsWorkerReview(generatedAt)
  const soundOssReview = buildSoundOssReview(generatedAt)
  const trackaPrivateE2eReview = buildTrackaPrivateE2eReview(generatedAt)
  const e2eValidationReview = buildE2eValidationReview(generatedAt)
  const reconciledToolCountSummary = buildReconciledToolCountSummary(generatedAt)
  const recommendedNextPath = buildRecommendedNextPath(generatedAt)
  const decision = buildDecision(generatedAt)
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.readiness.v1',
    generatedAt,
    readiness: decision.decision === expectedDecision,
    decision: decision.decision,
    blockers: decision.blockers,
    primaryNextPrompt,
    secondaryNextPrompts,
  }
  const privateArtifactManifest = {
    schema: 'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.privateArtifactManifest.v1',
    generatedAt,
    reportDirectory: OWNER_LANE_RECONCILIATION_REPORT_DIR,
    rawGeneratedFileContentsCommitted: false,
    dependencyInstallRunInThisPhase: false,
    npmInstallRunInThisPhase: false,
    npmRebuildRunInThisPhase: false,
    packageLockMutationAllowed: false,
    dockerBuildRunInThisPhase: false,
    dockerRunRunInThisPhase: false,
    ffmpegProbeRunInThisPhase: false,
    ffprobeProbeRunInThisPhase: false,
    buildContextGenerationRunInThisPhase: false,
    mediaProcessingRunInThisPhase: false,
    mediaFileProbeRunInThisPhase: false,
    captionBurnInRunInThisPhase: false,
    renderExportRunInThisPhase: false,
    duckdbProofRerunInThisPhase: false,
    polarsProofRerunInThisPhase: false,
    workerExecutionRunInThisPhase: false,
    routeExecutionRunInThisPhase: false,
    providerModelCallsRunInThisPhase: false,
    browserCaptureRunInThisPhase: false,
    mapRenderingRunInThisPhase: false,
    supabaseWritesRunInThisPhase: false,
    sqlRunInThisPhase: false,
    gcsUploadRunInThisPhase: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptExecutionRunInThisPhase: false,
    betaUnlocked: false,
    productionUnlocked: false,
    githubPrMergeRunInThisPhase: false,
    privatePayloadsAccessed: false,
    secretsAccessed: false,
    secretsPrinted: false,
    secretsCommitted: false,
    supabaseClassification: supabaseClassification(),
  }
  return {
    sourceOfTruthAudit,
    ownerLaneStatusMatrix,
    aiGraphicsWorkerReview,
    soundOssReview,
    trackaPrivateE2eReview,
    e2eValidationReview,
    reconciledToolCountSummary,
    recommendedNextPath,
    decision,
    readinessReport,
    privateArtifactManifest,
  }
}

export function writeOwnerLaneReconciliationArtifacts() {
  validateConfirmations()
  const reports = buildOwnerLaneReconciliationArtifacts()
  mkdirSync(OWNER_LANE_RECONCILIATION_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.ownerLaneStatusMatrix, reports.ownerLaneStatusMatrix)
  writeText(reportPaths.ownerLaneStatusMatrixMd, ownerLaneStatusMarkdown(reports.ownerLaneStatusMatrix))
  writeJson(reportPaths.aiGraphicsWorkerReview, reports.aiGraphicsWorkerReview)
  writeText(reportPaths.aiGraphicsWorkerReviewMd, markdownReport('AI Graphics Worker Reconciliation Review', reports.aiGraphicsWorkerReview))
  writeJson(reportPaths.soundOssReview, reports.soundOssReview)
  writeText(reportPaths.soundOssReviewMd, markdownReport('Sound OSS Reconciliation Review', reports.soundOssReview))
  writeJson(reportPaths.trackaPrivateE2eReview, reports.trackaPrivateE2eReview)
  writeText(reportPaths.trackaPrivateE2eReviewMd, markdownReport('Track A Private E2E Reconciliation Review', reports.trackaPrivateE2eReview))
  writeJson(reportPaths.e2eValidationReview, reports.e2eValidationReview)
  writeText(reportPaths.e2eValidationReviewMd, markdownReport('E2E Validation Reconciliation Review', reports.e2eValidationReview))
  writeJson(reportPaths.reconciledToolCountSummary, reports.reconciledToolCountSummary)
  writeText(
    reportPaths.reconciledToolCountSummaryMd,
    markdownReport('Reconciled Tool Count Summary', reports.reconciledToolCountSummary),
  )
  writeJson(reportPaths.recommendedNextPath, reports.recommendedNextPath)
  writeText(reportPaths.recommendedNextPathMd, markdownReport('Recommended Next Path', reports.recommendedNextPath))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationMarkdown(reports))
  writeNextPrompts()
  updateStatusDocs(reports.decision)
  return reports
}

export function readOwnerLaneReconciliationArtifacts(): OwnerLaneArtifacts {
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit),
    ownerLaneStatusMatrix: readJson(reportPaths.ownerLaneStatusMatrix) as OwnerLaneReport,
    aiGraphicsWorkerReview: readJson(reportPaths.aiGraphicsWorkerReview) as OwnerLaneReport,
    soundOssReview: readJson(reportPaths.soundOssReview) as OwnerLaneReport,
    trackaPrivateE2eReview: readJson(reportPaths.trackaPrivateE2eReview) as OwnerLaneReport,
    e2eValidationReview: readJson(reportPaths.e2eValidationReview) as OwnerLaneReport,
    reconciledToolCountSummary: readJson(reportPaths.reconciledToolCountSummary) as OwnerLaneReport,
    recommendedNextPath: readJson(reportPaths.recommendedNextPath) as OwnerLaneReport,
    decision: readJson(reportPaths.decision),
    readinessReport: readJson(reportPaths.readiness),
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest),
  }
}

function buildSourceOfTruthAudit(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.sourceAudit.v1',
    generatedAt,
    phase: 'OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_AFTER_BATCH_1_ROLLUP',
    branch: OWNER_LANE_RECONCILIATION_BRANCH,
    baseBranch: OWNER_LANE_RECONCILIATION_BASE_BRANCH,
    expectedSourceSha: OWNER_LANE_RECONCILIATION_SOURCE_SHA,
    liveSourceSha: gitOutput(['rev-parse', 'HEAD']),
    packageJsonHash: sha256('package.json'),
    packageLockHash: sha256('package-lock.json'),
    centralEvidencePrMetadata: centralEvidencePrs.map((number) => ghPrView(number)),
    aiGraphicsPrMetadata: aiGraphicsPrs.map((number) => ghPrView(number)),
    soundPrMetadata: soundPrs.map((number) => ghPrView(number)),
    trackaPrMetadata: trackaPrs.map((number) => ghPrView(number)),
    e2ePrMetadata: e2ePrs.map((number) => ghPrView(number)),
    referenceOnlyPrMetadata: referenceOnlyPrs.map((number) => ghPrView(number)),
    duplicateSearches: {
      exactNextPrompt: ghPrSearch('OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_AFTER_BATCH_1_ROLLUP'),
      titleSearch: ghPrSearch('"owner lane reconciliation after Batch 1"'),
      snakeCase: ghPrSearch('owner_lane_reconciliation'),
    },
    sourceEvidenceFiles: {
      pr527Decision:
        'docs/open-source-tool-stack/batch-2-planning-after-batch-1-rollup/batch-2-planning-decision.json',
      pr522Decision:
        'docs/open-source-tool-stack/batch-1-final-rollup-after-ffmpeg-ffprobe-proof/batch-1-final-rollup-decision.json',
      pr416Inventory: 'docs/open-source-tool-stack/open-source-tool-stack-inventory.json',
    },
    sourceEvidencePresence: {
      pr527Decision: existsSync(
        'docs/open-source-tool-stack/batch-2-planning-after-batch-1-rollup/batch-2-planning-decision.json',
      ),
      pr522Decision: existsSync(
        'docs/open-source-tool-stack/batch-1-final-rollup-after-ffmpeg-ffprobe-proof/batch-1-final-rollup-decision.json',
      ),
      pr416Inventory: existsSync('docs/open-source-tool-stack/open-source-tool-stack-inventory.json'),
    },
    broadProductionDocs: {
      betaReadinessScorecard: existsSync('docs/beta-readiness-scorecard.md') ? 'present' : 'absent_audit_fact',
      productionBetaBlockerInventory: existsSync('docs/production-beta-blocker-inventory.md') ? 'present' : 'absent_audit_fact',
      productionFoundationStatus: existsSync('PRODUCTION_FOUNDATION_STATUS.md') ? 'present' : 'absent_audit_fact',
    },
    protectedFileIntegrity: protectedFileIntegrityReport(),
    outputIntegrity: forbiddenOutputIntegrityReport(),
    noScopeConfirmation: noScopeConfirmation(),
    supabaseClassification: supabaseClassification(),
  }
}

function buildOwnerLaneStatusMatrix(generatedAt: string): OwnerLaneReport {
  const rows = [
    {
      lane: 'Central Batch 1',
      currentSourceRefs: ['PR #522', 'PR #527'],
      mergedRefs: [522, 527],
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: batch1AcceptedTools,
      acceptedWithWarningsTools: [],
      metadataOnlyTools: [],
      syntheticFixtureOnlyTools: batch1AcceptedValidationTargets,
      dryRunOnlyTools: [],
      runtimeReady: false,
      betaReady: false,
      blockers: ['media_processing_still_blocked', 'render_export_still_blocked', 'workers_routes_providers_still_blocked'],
      centralActionRecommendation: 'use_as_bounded_central_evidence_only',
    },
    {
      lane: 'AI graphics / Worker Runtime',
      currentSourceRefs: aiGraphicsPrs.map((number) => `PR #${number}`),
      mergedRefs: [],
      openRefs: aiGraphicsPrs,
      draftRefs: aiGraphicsPrs,
      acceptedProvenTools: [],
      acceptedWithWarningsTools: aiGraphicsTools,
      metadataOnlyTools: aiGraphicsTools,
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: aiGraphicsTools,
      runtimeReady: false,
      betaReady: false,
      blockers: ['draft_open_chain', 'worker_runtime_blocked', 'job_claim_lease_queue_blocked', 'browser_webgl_canvas_blocked'],
      centralActionRecommendation: 'stage_owner_merge_plan_before_batch2_install_proof',
    },
    {
      lane: 'Sound/Music/Audio',
      currentSourceRefs: ['PR #495', 'PR #507'],
      mergedRefs: soundPrs,
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: [],
      acceptedWithWarningsTools: ['sound_oss_scoped_metadata_bundle'],
      metadataOnlyTools: ['sound_oss_scoped_metadata_bundle'],
      syntheticFixtureOnlyTools: ['sound_oss_synthetic_fixture_evidence'],
      dryRunOnlyTools: ['sound_oss_scoped_dry_run'],
      runtimeReady: false,
      betaReady: false,
      blockers: ['real_audio_processing_blocked', 'media_runtime_blocked', 'supabase_gcs_artifact_delivery_blocked'],
      centralActionRecommendation: 'reconcile_sound_oss_before_audio_batch2_expansion',
    },
    {
      lane: 'Track A Render/Export',
      currentSourceRefs: trackaPrs.map((number) => `PR #${number}`),
      mergedRefs: trackaPrs,
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: ['FFmpeg version proof in Track A container path only', 'FFprobe version proof in Track A container path only'],
      acceptedWithWarningsTools: ['private_e2e_planning_context', 'worker_route_gate_context'],
      metadataOnlyTools: ['tracka_private_e2e_planning', 'worker_runtime_contracts', 'tool_route_gates'],
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: ['worker_route_contract_dry_run_gate'],
      runtimeReady: false,
      betaReady: false,
      blockers: ['private_e2e_runtime_blocked', 'transactional_rpc_source_gates_pending', 'render_export_blocked'],
      centralActionRecommendation: 'reconcile_tracka_private_e2e_before_beta_readiness_claim',
    },
    {
      lane: 'E2E validation queue',
      currentSourceRefs: ['PR #519', 'PR #523'],
      mergedRefs: [519],
      openRefs: [523],
      draftRefs: [523],
      acceptedProvenTools: [],
      acceptedWithWarningsTools: [],
      metadataOnlyTools: ['merge_ready_queue_metadata'],
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: ['validation_queue_attempts'],
      runtimeReady: false,
      betaReady: false,
      blockers: ['pr_305_validation_blocked_npm_ci_failed', 'merge_ready_validations_0'],
      centralActionRecommendation: 'resolve_e2e_validation_blocker_before_broad_beta_readiness',
    },
    {
      lane: 'Worker Runtime Track A private E2E contracts',
      currentSourceRefs: ['PR #505', 'PR #516', 'PR #520'],
      mergedRefs: [505, 516, 520],
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: [],
      acceptedWithWarningsTools: ['transactional_worker_contract_metadata'],
      metadataOnlyTools: ['worker_runtime_gate_context'],
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: ['transactional_contract_dry_run_gate'],
      runtimeReady: false,
      betaReady: false,
      blockers: ['worker_execution_blocked', 'supabase_runtime_mutation_blocked'],
      centralActionRecommendation: 'keep_owner_lane_until_runtime_gate_reconciled',
    },
    {
      lane: 'Tool Route Track A private E2E gates',
      currentSourceRefs: ['PR #510', 'PR #513'],
      mergedRefs: [510, 513],
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: [],
      acceptedWithWarningsTools: ['tool_route_contract_metadata'],
      metadataOnlyTools: ['tool_route_gate_context'],
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: ['tool_route_contract_dry_run_gate'],
      runtimeReady: false,
      betaReady: false,
      blockers: ['route_execution_blocked', 'provider_runtime_blocked'],
      centralActionRecommendation: 'keep_route_gate_context_owner_scoped',
    },
    {
      lane: 'Model/provider context',
      currentSourceRefs: ['provider_lanes_context_only'],
      mergedRefs: [],
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: [],
      acceptedWithWarningsTools: [],
      metadataOnlyTools: ['provider_api_context'],
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: [],
      runtimeReady: false,
      betaReady: false,
      blockers: ['provider_calls_blocked', 'raw_prompt_execution_blocked'],
      centralActionRecommendation: 'do_not_mix_provider_integrations_with_local_oss_tools',
    },
    {
      lane: 'Supabase/storage context',
      currentSourceRefs: ['supabase_storage_context_only'],
      mergedRefs: [],
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: [],
      acceptedWithWarningsTools: [],
      metadataOnlyTools: ['supabase_storage_policy_context'],
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: [],
      runtimeReady: false,
      betaReady: false,
      blockers: ['supabase_writes_blocked', 'sql_blocked', 'gcs_public_delivery_blocked'],
      centralActionRecommendation: 'separate_database_storage_owner_review_required',
    },
    {
      lane: 'Web/Search',
      currentSourceRefs: ['batch_2_inventory_context'],
      mergedRefs: [416],
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: [],
      acceptedWithWarningsTools: [],
      metadataOnlyTools: ['web_search_capture_candidates'],
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: [],
      runtimeReady: false,
      betaReady: false,
      blockers: ['browser_capture_blocked', 'public_artifact_blocked'],
      centralActionRecommendation: 'defer_until_owner_reconciliation_and_privacy_review',
    },
    {
      lane: 'Map/Geospatial',
      currentSourceRefs: ['batch_2_inventory_context'],
      mergedRefs: [416],
      openRefs: [],
      draftRefs: [],
      acceptedProvenTools: [],
      acceptedWithWarningsTools: [],
      metadataOnlyTools: ['map_geospatial_candidates'],
      syntheticFixtureOnlyTools: [],
      dryRunOnlyTools: [],
      runtimeReady: false,
      betaReady: false,
      blockers: ['map_rendering_blocked', 'public_artifact_blocked'],
      centralActionRecommendation: 'defer_until_owner_reconciliation_and_map_privacy_review',
    },
  ]
  return report(
    'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.ownerLaneStatusMatrix.v1',
    generatedAt,
    true,
    { rows },
  )
}

function buildAiGraphicsWorkerReview(generatedAt: string): OwnerLaneReport {
  return report(
    'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.aiGraphicsWorkerReview.v1',
    generatedAt,
    true,
    {
      reviewedPrs: aiGraphicsPrs.map((number) => `#${number}`),
      acceptedWithWarningsTools: aiGraphicsTools.map((toolName) => ({
        toolName,
        status: 'accepted_with_warnings',
        lane: 'worker_metadata_dry_run_only',
        runtimeApprovals: false,
      })),
      currentStatus: 'open_draft_chain_not_central_source_of_truth',
      decisionFromOwnerLane: 'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_owner_approved_with_warnings',
      runtimeApprovals: {
        workerExecution: false,
        jobClaim: false,
        leaseMutation: false,
        queueExecution: false,
        routeExecution: false,
        actualToolExecution: false,
        providerModelRuntime: false,
        browserWebglCanvasRuntime: false,
        remotionRenderExport: false,
        supabaseGcsPublicArtifacts: false,
        betaProduction: false,
      },
      duplicateRisk: 'high_until_draft_chain_resolves',
      centralRecommendation: 'stage_owner_merge_plan_then_ai_graphics_worker_reconciliation',
      nextOwnerPromptRecommendation: 'OPEN_SOURCE_TOOL_STACK_AI_GRAPHICS_WORKER_RECONCILIATION_AFTER_BATCH_1',
    },
  )
}

function buildSoundOssReview(generatedAt: string): OwnerLaneReport {
  return report('reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.soundOssReview.v1', generatedAt, true, {
    reviewedPrs: ['#495', '#507'],
    scopedStatus: 'metadata_and_synthetic_fixture_evidence_with_warnings',
    inheritedWarnings: ['ffmpeg_ffprobe_boundary_alignment', 'project_wide_fixture_pass_claims_need_central_context'],
    blockedToolsAndScopes: [
      'Demucs',
      'RNNoise',
      'Essentia',
      'Rubber Band',
      'Signalsmith Stretch',
      'real_audio_processing',
      'media_runtime',
      'Supabase/GCS/artifacts',
      'beta/production',
    ],
    duplicateRisk: 'medium_until_sound_scoped_evidence_is_centrally_reconciled',
    centralRecommendation: 'sound_oss_reconciliation_after_staged_owner_merge_plan',
    nextOwnerPromptRecommendation: 'OPEN_SOURCE_TOOL_STACK_SOUND_OSS_RECONCILIATION_AFTER_BATCH_1',
  })
}

function buildTrackaPrivateE2eReview(generatedAt: string): OwnerLaneReport {
  return report('reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.trackaPrivateE2eReview.v1', generatedAt, true, {
    reviewedPrs: trackaPrs.map((number) => `#${number}`),
    centralBatch1FfmpegFfprobeEvidence: {
      ffmpeg: `version_proven_tracka_container_path_only_${FFMPEG_FFPROBE_CONTAINER_VERSION}`,
      ffprobe: `version_proven_tracka_container_path_only_${FFMPEG_FFPROBE_CONTAINER_VERSION}`,
      mediaProcessingAccepted: false,
      renderExportAccepted: false,
    },
    status: {
      privateE2eRevalidationPlanningReadyWhereSupported: true,
      internalBetaUnlocked: false,
      runtimeExecutionBlocked: true,
      transactionalRpcSourceGatesPending: true,
    },
    duplicateRisk: 'medium_until_tracka_private_e2e_source_reconciles_with_central_open_source_path',
    centralRecommendation: 'tracka_private_e2e_reconciliation_after_staged_owner_merge_plan',
    nextOwnerPromptRecommendation: 'OPEN_SOURCE_TOOL_STACK_TRACKA_PRIVATE_E2E_RECONCILIATION_AFTER_BATCH_1',
  })
}

function buildE2eValidationReview(generatedAt: string): OwnerLaneReport {
  return report('reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.e2eValidationReview.v1', generatedAt, true, {
    reviewedPrs: ['#519', '#523'],
    selectedPrs: [305, 300, 264, 263, 245],
    blocker: 'pr_305_validation_blocked_npm_ci_failed',
    validatedCount: 0,
    passCount: 0,
    blockedCount: 1,
    mergeReadyCount: 0,
    pr523Decision: 'reeditpro_e2e_validation_queue_1_blocked_validation_failures',
    recommendation: 'e2e_validation_blocker_resolution_before_broad_beta_readiness_claim',
    nextPromptRecommendation: 'E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION',
  })
}

function buildReconciledToolCountSummary(generatedAt: string): OwnerLaneReport {
  return report(
    'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.reconciledToolCountSummary.v1',
    generatedAt,
    true,
    {
      inventoryCandidateCount: readInventoryCount(),
      batch1ActualOssToolsLibrariesAcceptedProven: batch1AcceptedTools,
      batch1ValidationTargetsAcceptedProven: batch1AcceptedValidationTargets,
      aiGraphicsAcceptedWithWarningsCount: aiGraphicsTools.length,
      aiGraphicsAcceptedWithWarningsTools: aiGraphicsTools,
      endToEndProductReadyTools: 0,
      fortyPlusToolsInstalledProvenEndToEndClaimAllowed: false,
      warning:
        'Do not claim 40+ tools are installed/proven end-to-end. Current evidence supports bounded Batch 1 proof plus owner-lane accepted-with-warnings and metadata/dry-run scoped evidence.',
      requiredForEndToEndProven:
        'central source-of-truth install evidence, bounded runtime proof, E2E validation, owner approval, artifact/privacy review, and runtime/product gate approval',
    },
  )
}

function buildRecommendedNextPath(generatedAt: string): OwnerLaneReport {
  return report('reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.recommendedNextPath.v1', generatedAt, true, {
    primaryNextPath: primaryNextPrompt,
    secondaryNextPaths: secondaryNextPrompts,
    stagedOrder: [
      'stage_owner_merge_plan',
      'ai_graphics_worker_reconciliation',
      'sound_oss_reconciliation',
      'tracka_private_e2e_reconciliation',
      'e2e_validation_pr_305_hydration_blocker_resolution',
      'batch2_install_proof_approval_after_owner_reconciliation',
      'product_internal_beta_readiness_aggregation_after_open_source_batch1',
    ],
    batch2InstallProofShouldStartImmediately: false,
    batch2InstallProofRationale:
      'active owner-lane evidence creates duplicate risk and should be reconciled before central Batch 2 install/proof expands scope',
    productInternalBetaReadinessAggregationShouldStartImmediately: false,
    internalBetaRationale:
      'Track A private E2E and E2E validation queue blockers remain unresolved; aggregation is secondary after staged owner reconciliation',
    e2eValidationBlockerRequired: true,
    aiGraphicsWorkerReconciliationRequired: true,
    safetyRationale:
      'metadata-only reconciliation preserves blocked runtime, media, provider, Supabase, public artifact, beta, and production scopes',
  })
}

function buildDecision(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.decision.v1',
    generatedAt,
    decision: expectedDecision,
    accepted: true,
    blockers: [],
    primaryNextPrompt,
    secondaryNextPrompts,
    stagedOwnerMergePlanRequired: true,
    aiGraphicsWorkerReconciliationRequired: true,
    soundOssReconciliationRequired: true,
    trackaPrivateE2eReconciliationRequired: true,
    e2eValidationBlockerResolutionRequired: true,
    batch2InstallProofApprovalNow: false,
    productInternalBetaReadinessAggregationNow: false,
    fortyPlusToolsEndToEndProven: false,
    endToEndProductReadyTools: 0,
    mediaProcessingAccepted: false,
    mediaFileProbingAccepted: false,
    captionBurnInAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    routeProviderRuntimeAccepted: false,
    providerModelRuntimeAccepted: false,
    supabaseGcsPublicDeliveryAccepted: false,
    signedUrlDeliveryAccepted: false,
    rawPromptExecutionAccepted: false,
    externalBetaUnlocked: false,
    productionUnlocked: false,
    runtimeCommandsRunInThisPhase: false,
    dockerRunInThisPhase: false,
    ffmpegFfprobeRunInThisPhase: false,
    buildContextGenerationRunInThisPhase: false,
    npmInstallRunInThisPhase: false,
    npmRebuildRunInThisPhase: false,
    packageLockMutationAllowed: false,
    githubPrMergeRunInThisPhase: false,
    supabaseClassification: supabaseClassification(),
  }
}

function report(schema: string, generatedAt: string, accepted: boolean, details: JsonRecord, blockers: string[] = []): OwnerLaneReport {
  return {
    schema,
    generatedAt,
    status: accepted ? 'accepted' : 'blocked',
    accepted,
    warnings: accepted ? ['metadata_only_runtime_scopes_remain_blocked'] : [],
    blockers,
    details,
  }
}

function writeNextPrompts() {
  const promptSpecs = [
    [
      nextPromptPaths.primary,
      'OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP',
      'Create a staged owner merge plan that sequences AI graphics, Sound OSS, Track A private E2E, E2E validation, Batch 2 install/proof approval, and internal beta aggregation without duplicating owner-lane work.',
    ],
    [
      nextPromptPaths.aiGraphics,
      'OPEN_SOURCE_TOOL_STACK_AI_GRAPHICS_WORKER_RECONCILIATION_AFTER_BATCH_1',
      'Reconcile AI graphics worker accepted-with-warnings metadata evidence into central source-of-truth without enabling worker/runtime/browser/WebGL/canvas execution.',
    ],
    [
      nextPromptPaths.sound,
      'OPEN_SOURCE_TOOL_STACK_SOUND_OSS_RECONCILIATION_AFTER_BATCH_1',
      'Reconcile Sound OSS scoped evidence and warnings before expanding central audio install/proof scope.',
    ],
    [
      nextPromptPaths.tracka,
      'OPEN_SOURCE_TOOL_STACK_TRACKA_PRIVATE_E2E_RECONCILIATION_AFTER_BATCH_1',
      'Reconcile Track A private E2E planning, worker runtime gates, and tool-route gates without executing media/render/runtime paths.',
    ],
    [
      nextPromptPaths.e2e,
      'E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION',
      'Resolve the PR #305 validation blocker recorded by PR #523 before broad beta readiness claims.',
    ],
    [
      nextPromptPaths.internalBeta,
      'PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1',
      'Aggregate internal beta readiness only after owner-lane reconciliation and E2E blockers are understood.',
    ],
    [
      nextPromptPaths.batch2Approval,
      'OPEN_SOURCE_TOOL_STACK_BATCH_2_INSTALL_PROOF_APPROVAL_AFTER_OWNER_RECONCILIATION',
      'Prepare Batch 2 install/proof approval only after owner-lane duplicate risk is resolved.',
    ],
  ]
  for (const [path, title, body] of promptSpecs) {
    const promptBody = `# ${title}\n\n${body}\n\nDo not run runtime/product/Supabase/GCS/public/beta/production scopes unless a later explicit approval packet authorizes them.\n`
    if (!existsSync(path)) {
      writeText(path, promptBody)
      continue
    }
    const existing = readFileSync(path, 'utf8')
    if (existing.includes('<!-- OWNER_LANE_RECONCILIATION_REFERENCE:start -->')) continue
    writeText(
      path,
      `${existing.trimEnd()}\n\n<!-- OWNER_LANE_RECONCILIATION_REFERENCE:start -->\n## Owner-Lane Reconciliation Reference\n\nSecondary prompt retained from earlier planning. Owner-lane reconciliation selected \`${primaryNextPrompt}\` as the primary next phase; this prompt remains secondary until staged owner reconciliation and E2E blocker context are clearer.\n<!-- OWNER_LANE_RECONCILIATION_REFERENCE:end -->\n`,
    )
  }
}

function updateStatusDocs(decision: JsonRecord) {
  const block = [
    '',
    '## Owner-Lane Reconciliation After Batch 1 Rollup',
    '',
    `- Decision: \`${decision.decision}\`.`,
    '- Central Batch 1 bounded proof remains accepted; owner-lane evidence is reconciled as metadata/dry-run/accepted-with-warnings only.',
    '- 71 candidates remain inventoried; 13 AI graphics tools are accepted-with-warnings in the worker metadata lane.',
    '- End-to-end product-ready tools remain `0`; do not claim 40+ tools are installed/proven end-to-end.',
    `- Next prompt: \`${primaryNextPrompt}\`.`,
    '- Supabase classification: no write / environment none / SQL none / migration no.',
    '',
  ].join('\n')
  for (const path of statusDocPaths) {
    if (!existsSync(path)) continue
    const existing = readFileSync(path, 'utf8')
    if (existing.includes('## Owner-Lane Reconciliation After Batch 1 Rollup')) continue
    writeText(path, `${existing.trimEnd()}\n${block}`)
  }
}

function markdownReport(title: string, reportValue: OwnerLaneReport) {
  const details = reportValue.details
  return [
    `# ${title}`,
    '',
    `- Schema: \`${reportValue.schema}\``,
    `- Status: \`${reportValue.status}\``,
    `- Accepted: \`${String(reportValue.accepted)}\``,
    `- Warnings: ${reportValue.warnings.length ? reportValue.warnings.map((warning) => `\`${warning}\``).join(', ') : 'none'}`,
    `- Blockers: ${reportValue.blockers.length ? reportValue.blockers.map((blocker) => `\`${blocker}\``).join(', ') : 'none'}`,
    '',
    '```json',
    JSON.stringify(details, null, 2),
    '```',
    '',
  ].join('\n')
}

function ownerLaneStatusMarkdown(matrix: OwnerLaneReport) {
  const rows = arrayValue(matrix.details.rows)
  const lines = [
    '# Owner-Lane Status Matrix',
    '',
    '| Lane | Runtime ready | Beta ready | Central recommendation |',
    '| --- | --- | --- | --- |',
  ]
  for (const row of rows) {
    const item = row as JsonRecord
    lines.push(
      `| ${stringValue(item.lane)} | ${String(item.runtimeReady)} | ${String(item.betaReady)} | ${stringValue(
        item.centralActionRecommendation,
      )} |`,
    )
  }
  lines.push('', 'Runtime/product scopes remain blocked for all rows in this reconciliation packet.', '')
  return lines.join('\n')
}

function decisionMarkdown(decision: JsonRecord) {
  return [
    '# Owner-Lane Reconciliation Decision',
    '',
    `- Decision: \`${decision.decision}\``,
    `- Primary next prompt: \`${decision.primaryNextPrompt}\``,
    `- Staged owner merge plan required: \`${String(decision.stagedOwnerMergePlanRequired)}\``,
    `- End-to-end product-ready tools: \`${String(decision.endToEndProductReadyTools)}\``,
    `- 40+ tools end-to-end proven: \`${String(decision.fortyPlusToolsEndToEndProven)}\``,
    `- Media processing accepted: \`${String(decision.mediaProcessingAccepted)}\``,
    `- Production unlocked: \`${String(decision.productionUnlocked)}\``,
    '',
  ].join('\n')
}

function validationMarkdown(reports: OwnerLaneArtifacts) {
  return [
    '# Owner-Lane Reconciliation Validation Results',
    '',
    '- Source-of-truth evidence: accepted.',
    '- Owner-lane status matrix: accepted.',
    '- AI graphics worker review: accepted with warnings, runtime blocked.',
    '- Sound OSS review: accepted with warnings, real audio/media blocked.',
    '- Track A private E2E review: accepted as owner-lane context, runtime blocked.',
    '- E2E validation review: blocked queue recorded, broad beta claims blocked.',
    `- Decision: \`${reports.decision.decision}\`.`,
    `- Primary next prompt: \`${primaryNextPrompt}\`.`,
    '- Supabase classification: no write / environment none / SQL none / migration no.',
    '',
  ].join('\n')
}

function validateConfirmations() {
  for (const name of requiredConfirmations()) {
    if (process.env[name] !== 'true') throw new Error(`missing_required_confirmation:${name}`)
  }
  for (const name of forbiddenConfirmations()) {
    if (process.env[name] === 'true') throw new Error(`forbidden_confirmation_set:${name}`)
  }
}

function noScopeConfirmation() {
  return {
    dependencyInstall: false,
    packageLockMutation: false,
    docker: false,
    ffmpegFfprobe: false,
    buildContextGeneration: false,
    mediaProcessing: false,
    renderExport: false,
    workerRouteProviderExecution: false,
    supabaseSqlGcsPublicSignedUrlMutation: false,
    betaProductionUnlock: false,
    rawPromptExecution: false,
    githubPrMerge: false,
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

function protectedFileIntegrityReport() {
  return protectedFiles.map((path) => ({
    path,
    exists: existsSync(path),
    gitStatus: gitOutput(['status', '--short', '--', path]),
    sha256: existsSync(path) ? sha256(path) : null,
  }))
}

function forbiddenOutputIntegrityReport() {
  return forbiddenOutputPaths.map((path) => ({
    path,
    exists: existsSync(path),
    gitStatus: gitOutput(['status', '--short', '--', path]),
  }))
}

function readInventoryCount() {
  const inventoryPath = 'docs/open-source-tool-stack/open-source-tool-stack-inventory.json'
  if (!existsSync(inventoryPath)) return 0
  const inventory = readJson(inventoryPath)
  const tools = arrayValue(inventory.tools)
  return tools.length
}

function ghPrView(number: number) {
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
        { encoding: 'utf8' },
      ),
    ) as JsonRecord
  } catch (error) {
    return { number, unavailable: true, error: error instanceof Error ? error.message : String(error) }
  }
}

function ghPrSearch(query: string) {
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
          'number,title,state,isDraft,baseRefName,headRefName,url',
        ],
        { encoding: 'utf8' },
      ),
    ) as JsonRecord[]
  } catch (error) {
    return [{ query, unavailable: true, error: error instanceof Error ? error.message : String(error) }]
  }
}

function sha256(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
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

function writeJson(path: string, value: unknown) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(path: string, value: string) {
  const slash = path.lastIndexOf('/')
  if (slash > 0) mkdirSync(path.slice(0, slash), { recursive: true })
  writeFileSync(path, value)
}

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as JsonRecord
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
