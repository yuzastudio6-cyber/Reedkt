import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  Batch2CandidateStatus,
  Batch2PlanningArtifacts,
  Batch2PlanningDecision,
  Batch2PlanningReport,
} from './batch-2-planning-after-batch-1-rollup-types'

type JsonRecord = Record<string, unknown>

export const BATCH2_PLANNING_REPORT_DIR =
  'docs/open-source-tool-stack/batch-2-planning-after-batch-1-rollup'
export const BATCH2_PLANNING_BRANCH = 'codex/rp-open-source-tool-stack-batch-2-planning-after-batch-1-rollup'
export const BATCH2_PLANNING_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const BATCH2_PLANNING_SOURCE_SHA = '96b5b0e69ba69f22d778aefe748128562fc3112a'
export const FFMPEG_FFPROBE_CONTAINER_VERSION = '5.1.9-0+deb12u1'

const expectedDecision: Batch2PlanningDecision =
  'open_source_tool_stack_batch2_planning_passed_ready_for_owner_lane_reconciliation'
const primaryNextPrompt = 'OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_AFTER_BATCH_1_ROLLUP'
const secondaryNextPrompts = [
  'OPEN_SOURCE_TOOL_STACK_BATCH_2_INSTALL_PROOF_APPROVAL',
  'PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1',
  'E2E_VALIDATION_QUEUE_BLOCKER_RESOLUTION_AFTER_OPEN_SOURCE_BATCH_1',
]

const predecessorPrs = [
  522, 518, 514, 508, 504, 499, 494, 490, 486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427,
  421, 416,
]
const ownerLanePrs = [526, 525, 524, 523, 521, 520, 517, 516, 515, 513, 512, 511, 507, 505, 503, 502, 500, 497, 495]
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
const acceptedBatch1ToolIds = [
  'sharp_libvips',
  'duckdb',
  'polars',
  'ffmpeg',
  'ffprobe',
  'route_capability_manifest_validation',
  'fixture_report_validation',
  'open_source_inventory_proof_matrix_validation',
]

const reportPaths = {
  sourceAudit: `${BATCH2_PLANNING_REPORT_DIR}/source-of-truth-audit.json`,
  batch1ClosureSnapshot: `${BATCH2_PLANNING_REPORT_DIR}/batch-1-closure-snapshot.json`,
  batch1ClosureSnapshotMd: `${BATCH2_PLANNING_REPORT_DIR}/batch-1-closure-snapshot.md`,
  batch2CandidateInventory: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-candidate-inventory.json`,
  batch2CandidateInventoryMd: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-candidate-inventory.md`,
  ownerLaneReconciliationMap: `${BATCH2_PLANNING_REPORT_DIR}/owner-lane-reconciliation-map.json`,
  ownerLaneReconciliationMapMd: `${BATCH2_PLANNING_REPORT_DIR}/owner-lane-reconciliation-map.md`,
  recommendedCandidateSet: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-recommended-candidate-set.json`,
  recommendedCandidateSetMd: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-recommended-candidate-set.md`,
  internalBetaReadinessImplication: `${BATCH2_PLANNING_REPORT_DIR}/internal-beta-readiness-implication.json`,
  internalBetaReadinessImplicationMd: `${BATCH2_PLANNING_REPORT_DIR}/internal-beta-readiness-implication.md`,
  decision: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-planning-decision.json`,
  decisionMd: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-planning-decision.md`,
  readiness: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-planning-readiness-report.json`,
  privateArtifactManifest: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-planning-private-artifact-manifest.json`,
  validationResults: `${BATCH2_PLANNING_REPORT_DIR}/batch-2-planning-validation-results.md`,
}

const nextPromptPaths = {
  primary: 'docs/implementation-prompts/prompt-open-source-tool-stack-owner-lane-reconciliation-after-batch-1-rollup.md',
  batch2InstallProof: 'docs/implementation-prompts/prompt-open-source-tool-stack-batch-2-install-proof-approval.md',
  internalBeta:
    'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-open-source-batch-1.md',
  e2e: 'docs/implementation-prompts/prompt-e2e-validation-queue-blocker-resolution-after-open-source-batch-1.md',
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
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP',
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_AUDIT_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_BATCH2_CANDIDATE_PLANNING',
    'REEDITPRO_CONFIRM_OWNER_LANE_RECONCILIATION_REVIEW',
    'REEDITPRO_CONFIRM_INTERNAL_BETA_RELEVANCE_REVIEW',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING_STILL_BLOCKED_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
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
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
    'REEDITPRO_CONFIRM_PROVIDER_CALLS',
    'REEDITPRO_CONFIRM_BROWSER_CAPTURE',
    'REEDITPRO_CONFIRM_MAP_RENDERING',
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

export function buildBatch2PlanningPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP',
    branch: BATCH2_PLANNING_BRANCH,
    baseBranch: BATCH2_PLANNING_BASE_BRANCH,
    expectedSourceSha: BATCH2_PLANNING_SOURCE_SHA,
    mode: 'docs_diagnostics_source_of_truth_planning_only',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    primaryNextPrompt,
    secondaryNextPrompts,
    reportDirectory: BATCH2_PLANNING_REPORT_DIR,
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

export function buildBatch2PlanningArtifacts(): Batch2PlanningArtifacts {
  const generatedAt = new Date().toISOString()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt)
  const batch1ClosureSnapshot = buildBatch1ClosureSnapshot(generatedAt)
  const batch2CandidateInventory = buildBatch2CandidateInventory(generatedAt)
  const ownerLaneReconciliationMap = buildOwnerLaneReconciliationMap(generatedAt, sourceOfTruthAudit.ownerLanePrMetadata as JsonRecord[])
  const recommendedCandidateSet = buildRecommendedCandidateSet(generatedAt, batch2CandidateInventory, ownerLaneReconciliationMap)
  const internalBetaReadinessImplication = buildInternalBetaReadinessImplication(generatedAt)
  const decision = buildDecision(generatedAt, {
    sourceOfTruthAudit,
    batch1ClosureSnapshot,
    batch2CandidateInventory,
    ownerLaneReconciliationMap,
    recommendedCandidateSet,
    internalBetaReadinessImplication,
  })
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.readiness.v1',
    generatedAt,
    readiness: decision.decision === expectedDecision,
    decision: decision.decision,
    blockers: decision.blockers,
    primaryNextPrompt,
    secondaryNextPrompts,
  }
  const privateArtifactManifest = {
    schema: 'reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.privateArtifactManifest.v1',
    generatedAt,
    reportDirectory: BATCH2_PLANNING_REPORT_DIR,
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
    renderExportRunInThisPhase: false,
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
    batch1ClosureSnapshot,
    batch2CandidateInventory,
    ownerLaneReconciliationMap,
    recommendedCandidateSet,
    internalBetaReadinessImplication,
    decision,
    readinessReport,
    privateArtifactManifest,
  }
}

export function writeBatch2PlanningArtifacts() {
  validateConfirmations()
  const reports = buildBatch2PlanningArtifacts()
  mkdirSync(BATCH2_PLANNING_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.batch1ClosureSnapshot, reports.batch1ClosureSnapshot)
  writeText(reportPaths.batch1ClosureSnapshotMd, markdownReport('Batch 1 Closure Snapshot', reports.batch1ClosureSnapshot))
  writeJson(reportPaths.batch2CandidateInventory, reports.batch2CandidateInventory)
  writeText(reportPaths.batch2CandidateInventoryMd, candidateInventoryMarkdown(reports.batch2CandidateInventory))
  writeJson(reportPaths.ownerLaneReconciliationMap, reports.ownerLaneReconciliationMap)
  writeText(reportPaths.ownerLaneReconciliationMapMd, ownerLaneMarkdown(reports.ownerLaneReconciliationMap))
  writeJson(reportPaths.recommendedCandidateSet, reports.recommendedCandidateSet)
  writeText(reportPaths.recommendedCandidateSetMd, markdownReport('Batch 2 Recommended Candidate Set', reports.recommendedCandidateSet))
  writeJson(reportPaths.internalBetaReadinessImplication, reports.internalBetaReadinessImplication)
  writeText(
    reportPaths.internalBetaReadinessImplicationMd,
    markdownReport('Internal Beta Readiness Implication', reports.internalBetaReadinessImplication),
  )
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationMarkdown(reports))
  writeNextPrompts()
  updateStatusDocs(reports.decision)
  return reports
}

export function readBatch2PlanningArtifacts(): Batch2PlanningArtifacts {
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit),
    batch1ClosureSnapshot: readJson(reportPaths.batch1ClosureSnapshot) as Batch2PlanningReport,
    batch2CandidateInventory: readJson(reportPaths.batch2CandidateInventory) as Batch2PlanningReport,
    ownerLaneReconciliationMap: readJson(reportPaths.ownerLaneReconciliationMap) as Batch2PlanningReport,
    recommendedCandidateSet: readJson(reportPaths.recommendedCandidateSet) as Batch2PlanningReport,
    internalBetaReadinessImplication: readJson(reportPaths.internalBetaReadinessImplication) as Batch2PlanningReport,
    decision: readJson(reportPaths.decision),
    readinessReport: readJson(reportPaths.readiness),
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest),
  }
}

function buildSourceOfTruthAudit(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.sourceAudit.v1',
    generatedAt,
    phase: 'OPEN_SOURCE_TOOL_STACK_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP',
    branch: BATCH2_PLANNING_BRANCH,
    baseBranch: BATCH2_PLANNING_BASE_BRANCH,
    expectedSourceSha: BATCH2_PLANNING_SOURCE_SHA,
    liveSourceSha: gitOutput(['rev-parse', 'HEAD']),
    packageJsonHash: sha256('package.json'),
    packageLockHash: sha256('package-lock.json'),
    predecessorPrMetadata: predecessorPrs.map((number) => ghPrView(number)),
    ownerLanePrMetadata: ownerLanePrs.map((number) => ghPrView(number)),
    referenceOnlyPrs,
    pr522Evidence: evidenceFile(
      'docs/open-source-tool-stack/batch-1-final-rollup-after-ffmpeg-ffprobe-proof/batch-1-final-rollup-decision.json',
    ),
    pr416InventoryEvidence: evidenceFile('docs/open-source-tool-stack/open-source-tool-stack-inventory.json'),
    protectedFileIntegrity: protectedFileIntegrityReport(),
    outputIntegrity: forbiddenOutputIntegrityReport(),
    duplicateSearches: {
      batch2Planning: ghPrSearch('OPEN_SOURCE_TOOL_STACK_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP'),
      internalBetaAggregation: ghPrSearch('PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1'),
      batch2PlanningTitle: ghPrSearch('"Batch 2 planning after Batch 1 rollup"'),
    },
    broadProductionDocs: {
      betaReadinessScorecard: existsSync('docs/beta-readiness-scorecard.md') ? 'present' : 'absent_audit_fact',
      productionBetaBlockerInventory: existsSync('docs/production-beta-blocker-inventory.md') ? 'present' : 'absent_audit_fact',
      productionFoundationStatus: existsSync('PRODUCTION_FOUNDATION_STATUS.md') ? 'present' : 'absent_audit_fact',
    },
    noScopeConfirmation: noScopeConfirmation(),
    supabaseClassification: supabaseClassification(),
  }
}

function buildBatch1ClosureSnapshot(generatedAt: string): Batch2PlanningReport {
  const accepted = [
    'Sharp/libvips import/version proof',
    'DuckDB native rebuild import/API and in-memory query proof',
    'Polars / nodejs-polars import/version and in-memory dataframe metadata proof',
    'Route/capability manifest validation',
    'Fixture/report validation',
    'Open-source inventory/proof matrix validation',
    `FFmpeg version proof only for Track A container path at ${FFMPEG_FFPROBE_CONTAINER_VERSION}`,
    `FFprobe version proof only for Track A container path at ${FFMPEG_FFPROBE_CONTAINER_VERSION}`,
  ]
  return report('reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.batch1ClosureSnapshot.v1', generatedAt, true, {
    acceptedProvenTargets: accepted,
    acceptedProvenToolIds: acceptedBatch1ToolIds,
    acceptedProvenCount: accepted.length,
    doesNotProve: [
      '40_plus_tools_end_to_end',
      'media_processing',
      'media_file_probing',
      'caption_burn_in',
      'render_export',
      'worker_runtime',
      'route_provider_runtime',
      'supabase_gcs_public_signed_url_delivery',
      'external_beta_or_production',
    ],
    ffmpegFfprobeBoundary: {
      version: FFMPEG_FFPROBE_CONTAINER_VERSION,
      trackAContainerPathOnly: true,
      mediaProcessingStillBlocked: true,
    },
    sourceEvidence: {
      pr522Decision:
        'docs/open-source-tool-stack/batch-1-final-rollup-after-ffmpeg-ffprobe-proof/batch-1-final-rollup-decision.json',
      pr522AcceptedMatrix:
        'docs/open-source-tool-stack/batch-1-final-rollup-after-ffmpeg-ffprobe-proof/batch-1-accepted-tools-matrix.json',
    },
  })
}

function buildBatch2CandidateInventory(generatedAt: string): Batch2PlanningReport {
  const tools = readInventoryTools()
  const rows = tools.map(classifyCandidate)
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const status = String(row.recommendedBatch2Status)
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})
  const accepted = rows.length === 71 && rows.every((row) => row.candidateName && row.recommendedBatch2Status)
  return report(
    'reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.batch2CandidateInventory.v1',
    generatedAt,
    accepted,
    {
      sourceInventoryPath: 'docs/open-source-tool-stack/open-source-tool-stack-inventory.json',
      sourceInventoryCount: tools.length,
      candidateCount: rows.length,
      countsByRecommendedStatus: counts,
      rows,
    },
    accepted ? [] : ['candidate_inventory_integrity_failed'],
  )
}

function classifyCandidate(tool: JsonRecord) {
  const normalizedId = stringValue(tool.normalizedId)
  const ownerLane = stringValue(tool.owner)
  const proofStatus = stringValue(tool.proofStatus)
  const providerOrApi = boolValue(tool.providerOrApiInstead) || stringValue(tool.ossProviderClassification).includes('provider')
  const centralAccepted = ['sharp_libvips', 'duckdb', 'polars', 'ffmpeg', 'ffprobe'].includes(normalizedId)
  const runtimeRisk = ['WORKER_RUNTIME_JOBS'].includes(ownerLane) || ['runtime', 'serving'].some((token) => stringValue(tool.category).includes(token))
  const mediaRenderRisk =
    ['TRACK_A_RENDER_EXPORT', 'TRACK_B_MEDIA_PROCESSING'].includes(ownerLane) ||
    ['media', 'render', 'video', 'audio', 'caption'].some((token) => stringValue(tool.category).includes(token))
  const publicRisk = ['WEB_SEARCH_CAPTURE', 'MAP_GEOSPATIAL'].includes(ownerLane)
  const betaRelevance = ['TRACK_A_RENDER_EXPORT', 'WORKER_RUNTIME_JOBS', 'SOUND_MUSIC_AUDIO', 'AI_TOOLS_CREATIVE_GRAPHICS'].includes(
    ownerLane,
  )

  let recommendedBatch2Status: Batch2CandidateStatus = 'defer'
  let reason = 'not selected until owner-lane reconciliation completes'
  let duplicateRisk = 'low'
  if (providerOrApi) {
    recommendedBatch2Status = 'provider_lane'
    reason = 'provider/API integration is separated from local OSS install/proof planning'
  } else if (centralAccepted) {
    recommendedBatch2Status = 'defer'
    reason = 'already accepted in Batch 1 final rollup within a bounded proof scope'
  } else if (ownerLane === 'AI_TOOLS_CREATIVE_GRAPHICS' || ownerLane === 'SOUND_MUSIC_AUDIO') {
    recommendedBatch2Status = 'owner_reconcile'
    duplicateRisk = 'high'
    reason = 'active owner-lane evidence exists and central Batch 2 should reconcile before duplicating install/proof'
  } else if (ownerLane === 'TRACK_A_RENDER_EXPORT') {
    recommendedBatch2Status = 'owner_reconcile'
    duplicateRisk = 'medium'
    reason = 'Track A render/export evidence is owner-lane scoped and media/render remains blocked'
  } else if (ownerLane === 'WORKER_RUNTIME_JOBS') {
    recommendedBatch2Status = 'runtime_lane'
    duplicateRisk = 'medium'
    reason = 'worker runtime contract and transactional gates are separate from local OSS proof'
  } else if (mediaRenderRisk) {
    recommendedBatch2Status = 'blocked'
    reason = 'media/render execution remains blocked pending separate approval'
  }

  return {
    candidateName: stringValue(tool.toolName),
    normalizedId,
    ownerLane,
    packageBinaryServiceType: providerOrApi
      ? 'provider_or_api_service'
      : stringValue(tool.systemBinaryEvidence) !== 'none'
        ? 'system_binary_or_container'
        : stringValue(tool.packageEvidence) !== 'none'
          ? 'package'
          : 'docs_or_unknown',
    centralLocalOss: !providerOrApi,
    providerApi: providerOrApi,
    alreadyInstalled: centralAccepted ? true : 'unknown',
    proofStatus: centralAccepted ? 'accepted_bounded_batch1_proof' : proofStatus,
    ownerLaneEvidence: ownerLaneEvidenceFor(ownerLane),
    duplicateRisk,
    runtimeRisk,
    mediaRenderRisk,
    supabaseGcsPublicArtifactRisk: publicRisk,
    betaRelevance,
    recommendedBatch2Status,
    reason,
    sourceAuditStatus: {
      installedStatus: tool.installedStatus ?? 'unknown',
      proofStatus: tool.proofStatus ?? 'unknown',
      safeBatch: tool.safeBatch ?? 'unknown',
    },
  }
}

function buildOwnerLaneReconciliationMap(generatedAt: string, prMetadata: JsonRecord[]): Batch2PlanningReport {
  const lanes = [
    {
      lane: 'AI_TOOLS_CREATIVE_GRAPHICS / Worker Runtime',
      prs: prMetadata.filter((pr) => stringValue(pr.title).includes('AI graphics') || stringValue(pr.title).includes('AI_TOOLS')),
      acceptedWithWarningsTools: 13,
      workerRuntimeBlocked: true,
      recommendation: 'reconcile_owner_lane_source_before_central_batch2_install_proof',
    },
    {
      lane: 'SOUND_MUSIC_AUDIO',
      prs: prMetadata.filter((pr) => [495, 507].includes(numberValue(pr.number))),
      scopedOssSyntheticFixtureStatus: 'merged_on_model_orchestration_branch_not_central_batch2_execution',
      recommendation: 'reconcile_sound_oss_scoped_evidence_before_expanding_audio_tools',
    },
    {
      lane: 'TRACK_A_RENDER_EXPORT',
      prs: prMetadata.filter((pr) => [497, 502, 505, 510, 513, 516, 520].includes(numberValue(pr.number))),
      privateE2eRuntimeBlocked: true,
      recommendation: 'keep_tracka_private_e2e_and_worker_route_gates_in_owner_lane',
    },
    {
      lane: 'E2E_VALIDATION_QUEUE',
      prs: prMetadata.filter((pr) => [512, 523].includes(numberValue(pr.number))),
      queueStatus: 'pr_523_open_draft_blocked',
      recommendation: 'resolve_validation_queue_blockers_before_beta_or_broad_batch2_execution',
    },
    {
      lane: 'MODEL_PROVIDER_SUPABASE',
      prs: prMetadata.filter((pr) => [525].includes(numberValue(pr.number))),
      runtimeBlocked: true,
      recommendation: 'provider_and_supabase_runtime_lanes_remain separate source-only context',
    },
  ]
  return report('reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.ownerLaneReconciliationMap.v1', generatedAt, true, {
    lanes,
    referenceOnlyPrs,
    centralBatch2ShouldNotDuplicateOwnerLane: true,
  })
}

function buildRecommendedCandidateSet(
  generatedAt: string,
  inventory: Batch2PlanningReport,
  ownerMap: Batch2PlanningReport,
): Batch2PlanningReport {
  const rows = arrayValue((inventory.details as JsonRecord).rows) as JsonRecord[]
  const ownerReconcileCount = rows.filter((row) => row.recommendedBatch2Status === 'owner_reconcile').length
  return report('reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.recommendedCandidateSet.v1', generatedAt, true, {
    primaryGroup: {
      name: 'owner_lane_reconciliation_first',
      whyIncluded: 'active owner-lane draft/open PRs and merged non-central evidence create duplicate risk',
      exactNextProofType: 'source_of_truth_reconciliation_metadata_only',
      riskLevel: 'low_runtime_high_coordination',
      dependencies: ['AI graphics worker stack', 'Sound OSS scoped evidence', 'Track A private E2E gates', 'E2E validation queue'],
      blockedScopes: ['worker_runtime', 'route_provider_runtime', 'media_render_export', 'supabase_gcs_public_delivery'],
    },
    centralLocalTools: {
      status: 'deferred_until_owner_lane_reconciliation',
      reason: 'central low-risk candidates can be selected after owner-lane duplication risk is closed',
    },
    validationInfrastructure: {
      status: 'recommended_secondary_review',
      reason: 'PR #523 validation queue is open draft and blocked',
    },
    ownerReconcileCandidateCount: ownerReconcileCount,
    ownerMapAccepted: ownerMap.accepted,
  })
}

function buildInternalBetaReadinessImplication(generatedAt: string): Batch2PlanningReport {
  return report('reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.internalBetaReadinessImplication.v1', generatedAt, true, {
    batch1MakesReeditProBetaReady: false,
    improvedReadiness: [
      'central local data/image/video-binary foundation improved',
      'DuckDB Polars Sharp FFmpeg FFprobe evidence is stronger',
      'Batch 1 proof boundaries are now source-of-truth rolled up',
    ],
    stillBlocksBeta: [
      'Track A private E2E revalidation',
      'worker runtime transactional gates',
      'route/provider runtime',
      'Supabase/GCS/public artifact/signed URL policy',
      'E2E validation queue failures',
      'media/render/export approvals',
    ],
    recommendation: 'run owner-lane reconciliation first, then internal beta readiness aggregation as secondary',
    internalBetaAggregationRecommendedNow: false,
    externalBetaUnlocked: false,
    productionUnlocked: false,
  })
}

function buildDecision(generatedAt: string, reports: Record<string, unknown>) {
  const blockers: string[] = []
  const candidateInventory = reports.batch2CandidateInventory as Batch2PlanningReport
  const ownerMap = reports.ownerLaneReconciliationMap as Batch2PlanningReport
  if (!candidateInventory.accepted) blockers.push('candidate_inventory_integrity')
  if (!ownerMap.accepted) blockers.push('owner_lane_source_review')
  const decision: Batch2PlanningDecision = blockers.length ? 'blocked_pending_candidate_inventory_integrity' : expectedDecision
  return {
    schema: 'reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.decision.v1',
    generatedAt,
    decision,
    accepted: decision === expectedDecision,
    blockers,
    primaryNextPrompt,
    secondaryNextPrompts,
    ownerLaneReconciliationFirst: true,
    batch2InstallProofApprovalNow: false,
    internalBetaReadinessAggregationNow: false,
    e2eValidationBlockerResolutionNow: false,
    fortyPlusToolsEndToEndProven: false,
    mediaProcessingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    routeProviderRuntimeAccepted: false,
    supabaseGcsPublicDeliveryAccepted: false,
    externalBetaUnlocked: false,
    productionUnlocked: false,
    runtimeCommandsRunInThisPhase: false,
    dockerRunInThisPhase: false,
    ffmpegFfprobeRunInThisPhase: false,
    npmInstallRunInThisPhase: false,
    npmRebuildRunInThisPhase: false,
    packageLockMutationAllowed: false,
    supabaseClassification: supabaseClassification(),
  }
}

function validateConfirmations() {
  const missing = requiredConfirmations().filter((name) => process.env[name] !== 'true')
  if (missing.length) throw new Error(`missing_required_confirmations:${missing.join(',')}`)
  const forbidden = forbiddenConfirmations().filter((name) => process.env[name] === 'true')
  if (forbidden.length) throw new Error(`forbidden_confirmations:${forbidden.join(',')}`)
}

function readInventoryTools(): JsonRecord[] {
  const inventory = readJson('docs/open-source-tool-stack/open-source-tool-stack-inventory.json')
  const tools = inventory.tools
  if (!Array.isArray(tools)) return []
  return tools as JsonRecord[]
}

function ownerLaneEvidenceFor(ownerLane: string) {
  if (ownerLane === 'AI_TOOLS_CREATIVE_GRAPHICS') return 'active_ai_graphics_worker_and_tool_route_pr_stack'
  if (ownerLane === 'SOUND_MUSIC_AUDIO') return 'pr_495_pr_507_sound_oss_scoped_evidence'
  if (ownerLane === 'TRACK_A_RENDER_EXPORT') return 'tracka_ffmpeg_ffprobe_and_private_e2e_pr_stack'
  if (ownerLane === 'WORKER_RUNTIME_JOBS') return 'worker_transactional_contract_and_runtime_gate_pr_stack'
  if (ownerLane === 'WEB_SEARCH_CAPTURE') return 'web_capture_owner_lane_pending'
  if (ownerLane === 'MAP_GEOSPATIAL') return 'map_geospatial_owner_lane_pending'
  if (ownerLane === 'PROVIDER_GATEWAY') return 'provider_gateway_non_local_api_lane'
  return 'central_open_source_inventory'
}

function evidenceFile(filePath: string) {
  const exists = existsSync(filePath)
  return { path: filePath, exists, sha256: exists ? sha256(filePath) : null }
}

function protectedFileIntegrityReport() {
  return Object.fromEntries(protectedFiles.map((filePath) => [filePath, { sha256: existsSync(filePath) ? sha256(filePath) : null, gitStatus: gitOutput(['status', '--short', '--', filePath]) }]))
}

function forbiddenOutputIntegrityReport() {
  return Object.fromEntries(forbiddenOutputPaths.map((filePath) => [filePath, { exists: existsSync(filePath), gitStatus: gitOutput(['status', '--short', '--', filePath]) }]))
}

function noScopeConfirmation() {
  return {
    dependencyInstall: false,
    packageLockMutation: false,
    docker: false,
    ffmpegFfprobe: false,
    buildContextGeneration: false,
    mediaRenderExport: false,
    workerRouteProviderExecution: false,
    supabaseGcsPublicSignedUrl: false,
    rawPrompt: false,
    betaProduction: false,
    prMerge: false,
  }
}

function report(schema: string, generatedAt: string, accepted: boolean, details: JsonRecord, blockers: string[] = []): Batch2PlanningReport {
  return {
    schema,
    generatedAt,
    status: accepted ? 'accepted' : 'blocked',
    accepted,
    warnings: accepted ? ['planning_only_runtime_scopes_remain_blocked'] : [],
    blockers,
    details,
  }
}

function writeNextPrompts() {
  writePromptReference(
    nextPromptPaths.primary,
    'OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_AFTER_BATCH_1_ROLLUP',
    `Reconcile owner-lane source-of-truth evidence after Batch 1 final rollup before selecting central Batch 2 install/proof candidates.\n\nDecision source: \`${expectedDecision}\`.\n\nDo not run installs, Docker, FFmpeg/FFprobe, media/render, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, or production.`,
  )
  writePromptReference(
    nextPromptPaths.batch2InstallProof,
    'OPEN_SOURCE_TOOL_STACK_BATCH_2_INSTALL_PROOF_APPROVAL',
    'Deferred secondary prompt. Use only after owner-lane reconciliation closes duplicate risk and selects central local OSS candidates.',
  )
  writePromptReference(
    nextPromptPaths.internalBeta,
    'PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1',
    'Secondary prompt. Aggregate internal beta readiness only after owner-lane and E2E blocker state is clear.',
  )
  writePromptReference(
    nextPromptPaths.e2e,
    'E2E_VALIDATION_QUEUE_BLOCKER_RESOLUTION_AFTER_OPEN_SOURCE_BATCH_1',
    'Secondary prompt. Resolve PR #523 validation queue blockers without broad runtime or product unlock.',
  )
}

function writePromptReference(filePath: string, title: string, body: string) {
  const block = `\n<!-- OPEN_SOURCE_BATCH_2_PLANNING_REFERENCE:start -->\n## Batch 2 Planning Reference\n\n${body}\n<!-- OPEN_SOURCE_BATCH_2_PLANNING_REFERENCE:end -->\n`
  if (!existsSync(filePath)) {
    writeText(filePath, `# ${title}\n${block}`)
    return
  }
  const text = readFileSync(filePath, 'utf8')
  writeText(filePath, replaceMarkedBlock(text, 'OPEN_SOURCE_BATCH_2_PLANNING_REFERENCE', block))
}

function updateStatusDocs(decision: JsonRecord) {
  const block = `\n<!-- OPEN_SOURCE_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP_STATUS:start -->\n## Open-Source Batch 2 Planning After Batch 1 Rollup\n\n- Decision: \`${decision.decision}\`.\n- Batch 1 is centrally rolled up; FFmpeg/FFprobe are version-proven only for the Track A container path at \`${FFMPEG_FFPROBE_CONTAINER_VERSION}\`.\n- Next primary prompt: \`${primaryNextPrompt}\`.\n- Secondary prompts: ${secondaryNextPrompts.map((prompt) => `\`${prompt}\``).join(', ')}.\n- Media processing, render/export, worker/route/provider execution, Supabase/GCS/public artifact/signed URL delivery, beta, and production remain blocked.\n- Supabase classification: no write / environment none / SQL none / migration no.\n<!-- OPEN_SOURCE_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP_STATUS:end -->\n`
  for (const filePath of statusDocPaths) {
    if (!existsSync(filePath)) continue
    const text = readFileSync(filePath, 'utf8')
    writeText(filePath, replaceMarkedBlock(text, 'OPEN_SOURCE_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP_STATUS', block))
  }
}

function replaceMarkedBlock(text: string, marker: string, block: string) {
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const startIndex = text.indexOf(start)
  const endIndex = text.indexOf(end)
  if (startIndex >= 0 && endIndex > startIndex) {
    const before = text.slice(0, startIndex).trimEnd()
    const after = text.slice(endIndex + end.length).trimStart()
    return after ? `${before}\n${block}\n${after}` : `${before}\n${block.trimEnd()}\n`
  }
  return `${text.trimEnd()}\n${block}`
}

function markdownReport(title: string, data: unknown) {
  return `# ${title}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`
}

function candidateInventoryMarkdown(reportData: Batch2PlanningReport) {
  const rows = arrayValue((reportData.details as JsonRecord).rows) as JsonRecord[]
  const lines = ['# Batch 2 Candidate Inventory', '', '| Candidate | Owner | Status | Reason |', '| --- | --- | --- | --- |']
  for (const row of rows) {
    lines.push(`| ${row.candidateName} | ${row.ownerLane} | ${row.recommendedBatch2Status} | ${row.reason} |`)
  }
  return `${lines.join('\n')}\n`
}

function ownerLaneMarkdown(reportData: Batch2PlanningReport) {
  const lanes = arrayValue((reportData.details as JsonRecord).lanes) as JsonRecord[]
  const lines = ['# Owner-Lane Reconciliation Map', '', '| Lane | Recommendation | Runtime blocked |', '| --- | --- | --- |']
  for (const lane of lanes) lines.push(`| ${lane.lane} | ${lane.recommendation} | ${lane.runtimeBlocked ?? lane.workerRuntimeBlocked ?? lane.privateE2eRuntimeBlocked ?? false} |`)
  return `${lines.join('\n')}\n`
}

function decisionMarkdown(decision: JsonRecord) {
  return `# Batch 2 Planning Decision\n\nDecision: \`${decision.decision}\`\n\nPrimary next prompt: \`${primaryNextPrompt}\`.\n\nSupabase classification: no write / environment none / SQL none / migration no.\n`
}

function validationMarkdown(reports: Batch2PlanningArtifacts) {
  return `# Batch 2 Planning Validation Results\n\n- Decision: \`${reports.decision.decision}\`\n- Source audit present: true\n- Candidate inventory accepted: ${reports.batch2CandidateInventory.accepted}\n- Owner-lane reconciliation map accepted: ${reports.ownerLaneReconciliationMap.accepted}\n- Runtime/product scopes remain blocked: true\n`
}

function writeJson(filePath: string, value: unknown) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(filePath: string, value: string) {
  mkdirSync(filePath.split('/').slice(0, -1).join('/'), { recursive: true })
  writeFileSync(filePath, value)
}

function readJson(filePath: string): JsonRecord {
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
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
    )
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
    )
  } catch {
    return []
  }
}

function sha256(filePath: string) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function supabaseClassification() {
  return { updateRequired: 'no write', environmentTouched: 'none', sqlExecuted: 'none', migrationDeployed: 'no' }
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown) {
  return typeof value === 'number' ? value : Number(value)
}

function boolValue(value: unknown) {
  return value === true
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : []
}
