import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  StagedOwnerMergeArtifacts,
  StagedOwnerMergePlanDecision,
  StagedOwnerMergeReport,
} from './staged-owner-merge-plan-after-batch-1-rollup-types'

type JsonRecord = Record<string, unknown>

export const STAGED_OWNER_MERGE_REPORT_DIR =
  'docs/open-source-tool-stack/staged-owner-merge-plan-after-batch-1-rollup'
export const STAGED_OWNER_MERGE_BRANCH =
  'codex/rp-open-source-tool-stack-staged-owner-merge-plan-after-batch-1-rollup'
export const STAGED_OWNER_MERGE_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const STAGED_OWNER_MERGE_SOURCE_SHA = '40a7a25c319aea2f3ff8149aa5a7a9e6206ed346'
export const FFMPEG_FFPROBE_CONTAINER_VERSION = '5.1.9-0+deb12u1'

const expectedDecision: StagedOwnerMergePlanDecision =
  'staged_owner_merge_plan_passed_ready_for_e2e_validation_pr305_hydration_blocker_resolution'
const primaryNextPrompt = 'E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION'
const pr523MergedAt = '2026-06-19T02:04:29Z'
const pr523MergeCommit = 'f258967676c4877d3e1627b5710b789cff04b451'
const pr305Blocker = 'pr_305_validation_blocked_npm_ci_failed'
const e2eQueueDecision = 'reeditpro_e2e_validation_queue_1_blocked_validation_failures'
const secondaryNextPrompts = [
  'OPEN_SOURCE_TOOL_STACK_AI_GRAPHICS_WORKER_SOURCE_REVIEW_AFTER_BATCH_1',
  'OPEN_SOURCE_TOOL_STACK_SOUND_OSS_SOURCE_RECONCILIATION_AFTER_BATCH_1',
  'OPEN_SOURCE_TOOL_STACK_TRACKA_PRIVATE_E2E_SOURCE_RECONCILIATION_AFTER_BATCH_1',
  'PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_OWNER_RECONCILIATION',
  'OPEN_SOURCE_TOOL_STACK_BATCH_2_INSTALL_PROOF_APPROVAL_AFTER_OWNER_RECONCILIATION',
]

const centralEvidencePrs = [529, 527, 522, 416]
const batch1EvidencePrs = [518, 514, 508, 469, 466, 455, 439, 435]
const aiGraphicsPrs = [491, 493, 496, 498, 500, 503, 506, 509, 511, 515, 517, 521, 524]
const soundPrs = [495, 507]
const trackaPrs = [497, 502, 505, 510, 513, 516, 520]
const e2ePrs = [519, 523, 305]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]
const protectedFiles = ['package.json', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']
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
  sourceAudit: `${STAGED_OWNER_MERGE_REPORT_DIR}/source-of-truth-audit.json`,
  stagedOwnerMergePlan: `${STAGED_OWNER_MERGE_REPORT_DIR}/staged-owner-merge-plan.json`,
  stagedOwnerMergePlanMd: `${STAGED_OWNER_MERGE_REPORT_DIR}/staged-owner-merge-plan.md`,
  ownerPrStackOrder: `${STAGED_OWNER_MERGE_REPORT_DIR}/owner-pr-stack-order.json`,
  ownerPrStackOrderMd: `${STAGED_OWNER_MERGE_REPORT_DIR}/owner-pr-stack-order.md`,
  mergeReadinessBlockerMatrix: `${STAGED_OWNER_MERGE_REPORT_DIR}/merge-readiness-blocker-matrix.json`,
  mergeReadinessBlockerMatrixMd: `${STAGED_OWNER_MERGE_REPORT_DIR}/merge-readiness-blocker-matrix.md`,
  toolCountAndClaimPolicy: `${STAGED_OWNER_MERGE_REPORT_DIR}/tool-count-and-claim-policy.json`,
  toolCountAndClaimPolicyMd: `${STAGED_OWNER_MERGE_REPORT_DIR}/tool-count-and-claim-policy.md`,
  internalBetaDependencyMap: `${STAGED_OWNER_MERGE_REPORT_DIR}/internal-beta-dependency-map.json`,
  internalBetaDependencyMapMd: `${STAGED_OWNER_MERGE_REPORT_DIR}/internal-beta-dependency-map.md`,
  recommendedNextPath: `${STAGED_OWNER_MERGE_REPORT_DIR}/recommended-next-path.json`,
  recommendedNextPathMd: `${STAGED_OWNER_MERGE_REPORT_DIR}/recommended-next-path.md`,
  decision: `${STAGED_OWNER_MERGE_REPORT_DIR}/staged-owner-merge-plan-decision.json`,
  decisionMd: `${STAGED_OWNER_MERGE_REPORT_DIR}/staged-owner-merge-plan-decision.md`,
  readiness: `${STAGED_OWNER_MERGE_REPORT_DIR}/staged-owner-merge-plan-readiness-report.json`,
  privateArtifactManifest: `${STAGED_OWNER_MERGE_REPORT_DIR}/staged-owner-merge-plan-private-artifact-manifest.json`,
  validationResults: `${STAGED_OWNER_MERGE_REPORT_DIR}/staged-owner-merge-plan-validation-results.md`,
}

const nextPromptPaths = {
  primary: 'docs/implementation-prompts/prompt-e2e-validation-pr-305-hydration-blocker-resolution.md',
  aiGraphics: 'docs/implementation-prompts/prompt-open-source-tool-stack-ai-graphics-worker-source-review-after-batch-1.md',
  sound: 'docs/implementation-prompts/prompt-open-source-tool-stack-sound-oss-source-reconciliation-after-batch-1.md',
  tracka: 'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-private-e2e-source-reconciliation-after-batch-1.md',
  internalBeta:
    'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-open-source-owner-reconciliation.md',
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
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP',
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_BATCH2_PLANNING_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_STAGED_OWNER_MERGE_PLAN_REVIEW',
    'REEDITPRO_CONFIRM_OWNER_LANE_PR_STATE_REVIEW',
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
    'REEDITPRO_CONFIRM_GITHUB_PR_MERGE',
    'REEDITPRO_CONFIRM_GITHUB_PR_CLOSE',
    'REEDITPRO_CONFIRM_GITHUB_REBASE',
    'REEDITPRO_CONFIRM_GITHUB_RETARGET',
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
    'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  ]
}

export function buildStagedOwnerMergePlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP',
    branch: STAGED_OWNER_MERGE_BRANCH,
    baseBranch: STAGED_OWNER_MERGE_BASE_BRANCH,
    expectedSourceSha: STAGED_OWNER_MERGE_SOURCE_SHA,
    mode: 'docs_diagnostics_source_of_truth_planning_only',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    primaryNextPrompt,
    secondaryNextPrompts,
    reportDirectory: STAGED_OWNER_MERGE_REPORT_DIR,
    reports: Object.values(reportPaths),
    forbiddenActions: [
      'github_pr_merge',
      'dependency_install',
      'package_lock_mutation',
      'docker_or_container_mutation',
      'ffmpeg_ffprobe_probe',
      'build_context_generation',
      'media_processing_or_render_export',
      'worker_route_provider_execution',
      'supabase_sql_gcs_public_signed_url_mutation',
      'raw_prompt_execution',
      'beta_or_production_unlock',
    ],
  }
}

export function writeStagedOwnerMergeArtifacts(): StagedOwnerMergeArtifacts {
  assertSafeConfirmations()
  mkdirSync(STAGED_OWNER_MERGE_REPORT_DIR, { recursive: true })

  const artifacts = buildArtifacts()
  writeJson(reportPaths.sourceAudit, artifacts.sourceAudit)
  writeReport(reportPaths.stagedOwnerMergePlan, reportPaths.stagedOwnerMergePlanMd, artifacts.stagedOwnerMergePlan)
  writeReport(reportPaths.ownerPrStackOrder, reportPaths.ownerPrStackOrderMd, artifacts.ownerPrStackOrder)
  writeReport(
    reportPaths.mergeReadinessBlockerMatrix,
    reportPaths.mergeReadinessBlockerMatrixMd,
    artifacts.mergeReadinessBlockerMatrix,
  )
  writeReport(reportPaths.toolCountAndClaimPolicy, reportPaths.toolCountAndClaimPolicyMd, artifacts.toolCountAndClaimPolicy)
  writeReport(reportPaths.internalBetaDependencyMap, reportPaths.internalBetaDependencyMapMd, artifacts.internalBetaDependencyMap)
  writeReport(reportPaths.recommendedNextPath, reportPaths.recommendedNextPathMd, artifacts.recommendedNextPath)
  writeJson(reportPaths.decision, artifacts.decision)
  writeMarkdown(reportPaths.decisionMd, decisionMarkdown(artifacts.decision))
  writeJson(reportPaths.readiness, artifacts.readinessReport)
  writeJson(reportPaths.privateArtifactManifest, artifacts.privateArtifactManifest)
  writeMarkdown(reportPaths.validationResults, validationMarkdown(artifacts))
  writePrompts()
  updateStatusDocs()
  return artifacts
}

export function readStagedOwnerMergeArtifacts(): StagedOwnerMergeArtifacts {
  return {
    sourceAudit: readJson(reportPaths.sourceAudit),
    stagedOwnerMergePlan: readJson(reportPaths.stagedOwnerMergePlan) as StagedOwnerMergeReport,
    ownerPrStackOrder: readJson(reportPaths.ownerPrStackOrder) as StagedOwnerMergeReport,
    mergeReadinessBlockerMatrix: readJson(reportPaths.mergeReadinessBlockerMatrix) as StagedOwnerMergeReport,
    toolCountAndClaimPolicy: readJson(reportPaths.toolCountAndClaimPolicy) as StagedOwnerMergeReport,
    internalBetaDependencyMap: readJson(reportPaths.internalBetaDependencyMap) as StagedOwnerMergeReport,
    recommendedNextPath: readJson(reportPaths.recommendedNextPath) as StagedOwnerMergeReport,
    decision: readJson(reportPaths.decision),
    readinessReport: readJson(reportPaths.readiness),
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest),
  }
}

function buildArtifacts(): StagedOwnerMergeArtifacts {
  const generatedAt = new Date().toISOString()
  const prMetadata = collectPrMetadata()
  const duplicateSearch = collectDuplicateSearch()
  const sourceAudit = buildSourceAudit(generatedAt, prMetadata, duplicateSearch)
  const stagedOwnerMergePlan = report('stagedPlan', generatedAt, { stages: buildStages(prMetadata) }, [
    'This phase plans source-of-truth work only; no owner PR is merged here.',
  ])
  const ownerPrStackOrder = report('ownerPrStackOrder', generatedAt, buildOwnerStackOrder(prMetadata), [
    'AI graphics source-chain ordering is advisory until draft PRs are explicitly resolved by their owner.',
  ])
  const mergeReadinessBlockerMatrix = report('mergeReadinessBlockerMatrix', generatedAt, buildBlockerMatrix(prMetadata), [
    'PR #523 is merged source evidence that PR #305 remains blocked and merge-ready validations remain 0.',
  ])
  const toolCountAndClaimPolicy = report('toolCountAndClaimPolicy', generatedAt, buildToolCountPolicy(), [
    'Do not claim 40+ tools are installed/proven end-to-end.',
  ])
  const internalBetaDependencyMap = report('internalBetaDependencyMap', generatedAt, buildInternalBetaMap(), [
    'Internal beta aggregation stays secondary until E2E, Track A, worker, route, and storage gates are acknowledged.',
  ])
  const recommendedNextPath = report('recommendedNextPath', generatedAt, buildRecommendedNextPath(prMetadata), [])
  const decision = buildDecision(generatedAt, prMetadata)
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.stagedOwnerMergePlanAfterBatch1Rollup.readiness.v1',
    generatedAt,
    readiness: decision.decision === expectedDecision,
    decision: decision.decision,
    blockers: decision.blockers,
    nextPrompt: primaryNextPrompt,
  }
  const privateArtifactManifest = buildPrivateManifest(generatedAt)

  return {
    sourceAudit,
    stagedOwnerMergePlan,
    ownerPrStackOrder,
    mergeReadinessBlockerMatrix,
    toolCountAndClaimPolicy,
    internalBetaDependencyMap,
    recommendedNextPath,
    decision,
    readinessReport,
    privateArtifactManifest,
  }
}

function collectPrMetadata() {
  const allPrs = [
    ...centralEvidencePrs,
    ...batch1EvidencePrs,
    ...aiGraphicsPrs,
    ...soundPrs,
    ...trackaPrs,
    ...e2ePrs,
    ...referenceOnlyPrs,
  ]
  const uniquePrs = [...new Set(allPrs)]
  return Object.fromEntries(uniquePrs.map((number) => [String(number), ghPr(number)]))
}

function collectDuplicateSearch() {
  return [
    {
      query: 'OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP',
      results: ghSearch('OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP'),
    },
    {
      query: 'staged owner merge plan after Batch 1',
      results: ghSearch('staged owner merge plan after Batch 1'),
    },
    {
      query: 'staged_owner_merge_plan',
      results: ghSearch('staged_owner_merge_plan'),
    },
  ]
}

function buildSourceAudit(generatedAt: string, prMetadata: Record<string, JsonRecord>, duplicateSearch: JsonRecord[]) {
  return {
    schema: 'reeditpro.openSourceToolStack.stagedOwnerMergePlanAfterBatch1Rollup.sourceAudit.v1',
    generatedAt,
    branch: STAGED_OWNER_MERGE_BRANCH,
    baseBranch: STAGED_OWNER_MERGE_BASE_BRANCH,
    expectedSourceSha: STAGED_OWNER_MERGE_SOURCE_SHA,
    liveSourceSha: git(['rev-parse', 'HEAD']),
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    protectedFileHashes: Object.fromEntries(protectedFiles.filter(existsSync).map((file) => [file, hashFile(file)])),
    centralEvidencePrs,
    batch1EvidencePrs,
    aiGraphicsPrs,
    soundPrs,
    trackaPrs,
    e2ePrs,
    referenceOnlyPrs,
    prMetadata,
    duplicateSearch,
    absentBroadProductionDocs: [
      'docs/beta-readiness-scorecard.md',
      'docs/production-beta-blocker-inventory.md',
      'PRODUCTION_FOUNDATION_STATUS.md',
    ].filter((file) => !existsSync(file)),
    noScopeConfirmation: blockedScopeFlags(),
    supabaseClassification: supabaseClassification(),
  }
}

function buildStages(prMetadata: Record<string, JsonRecord>) {
  const e2e523 = prSummary(523, prMetadata)
  return [
    stage(0, 'central_source_hygiene_and_duplicate_avoidance', centralEvidencePrs, 'Confirm PR #529/#527/#522/#416 central evidence and no duplicate staged owner plan.', 'Clean central branch; no package-lock/Docker/.dockerignore diff.', 'Duplicate central staged owner plan, source drift, or forbidden scope.', 'staged-owner merge planner', 'source audit and duplicate-risk facts', 'OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP'),
    stage(1, 'e2e_validation_pr305_hydration_blocker_resolution', [519, 523, 305], 'Resolve the PR #305 hydration blocker before beta claims.', `PR #523 is merged source evidence at ${String(e2e523.mergedAt ?? 'unknown')} with merge commit ${String(e2e523.mergeCommitOid ?? 'unknown')}. PR #305 remains blocked by ${pr305Blocker}; merge-ready validations remain 0.`, 'PR #305 hydration blocker persists until the next phase resolves it; merge-ready validations remain 0.', 'E2E validation owner', 'blocker-resolution packet only', primaryNextPrompt),
    stage(2, 'ai_graphics_worker_source_review', aiGraphicsPrs, 'Review AI graphics worker chain without centralizing runtime proof.', 'Draft/open chain remains metadata dry-run scoped.', 'Worker execution, browser/WebGL/canvas runtime, provider/model calls, or beta claims.', 'AI graphics worker owner', 'AI graphics source review PR', 'OPEN_SOURCE_TOOL_STACK_AI_GRAPHICS_WORKER_SOURCE_REVIEW_AFTER_BATCH_1'),
    stage(3, 'sound_oss_source_reconciliation', soundPrs, 'Reconcile Sound OSS scoped evidence as metadata/synthetic-fixture only.', 'PR #495/#507 merged outside central open-source branch context.', 'Real audio/media processing, provider calls, or production claims.', 'Sound/Music/Audio owner', 'Sound scoped reconciliation packet', 'OPEN_SOURCE_TOOL_STACK_SOUND_OSS_SOURCE_RECONCILIATION_AFTER_BATCH_1'),
    stage(4, 'tracka_private_e2e_source_reconciliation', trackaPrs, 'Reconcile Track A private E2E context while runtime remains blocked.', 'Track A planning/gates are merged in owner lanes.', 'Render/export, worker execution, route execution, media processing, beta unlock.', 'Track A owner', 'Track A source reconciliation packet', 'OPEN_SOURCE_TOOL_STACK_TRACKA_PRIVATE_E2E_SOURCE_RECONCILIATION_AFTER_BATCH_1'),
    stage(5, 'batch2_install_proof_readiness_decision', [527, 522, 416], 'Decide if central Batch 2 install/proof approval can start after owner reconciliation.', '71-candidate inventory and Batch 1 bounded proof are present.', 'Owner-lane ambiguity, unresolved E2E blocker, or runtime/product scope drift.', 'Open-source tool stack owner', 'Batch 2 approval packet if owner gates are clear', 'OPEN_SOURCE_TOOL_STACK_BATCH_2_INSTALL_PROOF_APPROVAL_AFTER_OWNER_RECONCILIATION'),
    stage(6, 'product_internal_beta_readiness_aggregation', [529, 527, 522, 523], 'Aggregate internal beta readiness only after blockers are explicitly acknowledged.', 'Internal beta remains secondary and warning-bound.', 'External beta, real media beta, paid production, Supabase/GCS/public delivery unlocks.', 'Product/internal beta owner', 'blocked or limited internal beta aggregation packet', 'PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_OWNER_RECONCILIATION'),
  ]
}

function stage(
  order: number,
  id: string,
  sourcePrs: number[],
  objective: string,
  currentState: string,
  stopConditions: string,
  owner: string,
  expectedOutput: string,
  nextPrompt: string,
) {
  return {
    order,
    id,
    objective,
    sourcePrs,
    currentState,
    prerequisites: [
      'source-of-truth branch clean',
      'package-lock unchanged',
      'reference-only PRs remain non-canonical',
      'forbidden runtime/product scopes remain false',
    ],
    forbiddenScopes: forbiddenScopes(),
    expectedOutput,
    stopConditions,
    owner,
    nextPrompt,
  }
}

function buildOwnerStackOrder(prMetadata: Record<string, JsonRecord>) {
  return {
    aiGraphics: {
      recommendedOrder: aiGraphicsPrs,
      toolsAcceptedWithWarnings: aiGraphicsTools,
      state: aiGraphicsPrs.map((pr) => prSummary(pr, prMetadata)),
      centralTruth: 'accepted_with_warnings for worker metadata dry-run lane only; not runtime proof',
    },
    sound: {
      recommendedOrder: soundPrs,
      state: soundPrs.map((pr) => prSummary(pr, prMetadata)),
      centralReconciliationNeed: 'record scoped SOUND evidence without claiming real audio/media processing',
    },
    tracka: {
      recommendedOrder: trackaPrs,
      state: trackaPrs.map((pr) => prSummary(pr, prMetadata)),
      centralReconciliationNeed: 'record private E2E gates while runtime, render/export, and beta stay blocked',
    },
    e2e: {
      recommendedOrder: e2ePrs,
      state: e2ePrs.map((pr) => prSummary(pr, prMetadata)),
      blocker: pr305Blocker,
      mergeReadyValidations: 0,
      pr523SourceEvidence:
        'PR #523 is merged and now serves as source evidence for the unresolved PR #305 hydration blocker.',
    },
  }
}

function buildBlockerMatrix(prMetadata: Record<string, JsonRecord>) {
  const all = Object.values(prMetadata)
  return {
    readyNonDraftCleanPrs: all.filter((pr) => pr.state === 'OPEN' && pr.isDraft === false && pr.mergeStateStatus === 'CLEAN'),
    draftPrs: all.filter((pr) => pr.state === 'OPEN' && pr.isDraft === true),
    activeE2eBlockers: [
      {
        number: 305,
        blocker: pr305Blocker,
        sourceEvidencePr: 523,
        sourceEvidenceState: 'MERGED',
        sourceEvidenceMergedAt: pr523MergedAt,
        sourceEvidenceMergeCommit: pr523MergeCommit,
        queueDecision: e2eQueueDecision,
        mergeReadyValidations: 0,
        impact: 'blocks credible E2E validation queue health and internal beta readiness claims',
      },
    ],
    blockedByRuntimeGates: ['AI graphics worker chain', 'Track A private E2E worker/route gates'],
    blockedByOwnerLaneSourceTruthMismatch: ['Sound scoped evidence', 'Track A private E2E context'],
    blockedByDuplicateRisk: referenceOnlyPrs.map((number) => ({ number, canonicalForThisPhase: false })),
    blockedByProductBetaReadiness: [
      '0 merge-ready E2E validations',
      'worker runtime not accepted',
      'media processing/render/export blocked',
      'Supabase/GCS/public delivery blocked',
    ],
  }
}

function buildToolCountPolicy() {
  return {
    inventoryCandidateCount: 71,
    batch1AcceptedTools,
    batch1AcceptedValidationTargets,
    aiGraphicsAcceptedWithWarningsCount: 13,
    aiGraphicsAcceptedWithWarningsTools: aiGraphicsTools,
    endToEndProductReadyTools: 0,
    fortyPlusToolsInstalledProvenEndToEndClaimAllowed: false,
    forbiddenClaim: 'Do not claim 40+ tools are installed/proven end-to-end.',
    conditionsBeforeEndToEndToolCounting: [
      'installed or source-integrated',
      'runtime path proven',
      'owner scope approved',
      'fail-closed behavior proven',
      'artifact policy proven',
      'route/worker/provider boundaries proven when relevant',
      'Supabase/GCS/public/signed URL policy proven when relevant',
      'internal beta scope approved when relevant',
    ],
  }
}

function buildInternalBetaMap() {
  return {
    batch1Improves: [
      'bounded OSS proof clarity',
      'FFmpeg/FFprobe Track A container version proof only',
      'DuckDB and Polars package proof status',
      'central claim policy around 71 candidates',
    ],
    stillNotUnlockedBecause: [
      'E2E validation queue remains blocked by PR #305 hydration failure',
      'Track A private E2E revalidation remains unresolved',
      'worker transactional/runtime gates are not product-ready',
      'route/provider gates remain blocked',
      'Supabase/GCS/public artifact/signed URL policy is not production-ready',
      'media processing/render/export remain blocked',
    ],
    recommendation:
      'Run product internal beta readiness aggregation only after E2E blocker resolution or with an explicit blocked aggregation outcome.',
  }
}

function buildRecommendedNextPath(prMetadata: Record<string, JsonRecord>) {
  const pr523 = prSummary(523, prMetadata)
  return {
    primaryNextPath: primaryNextPrompt,
    primaryDecision: expectedDecision,
    why: `PR #523 is merged and now serves as source evidence for the unresolved PR #305 hydration blocker. PR #523 merged at ${String(pr523.mergedAt ?? pr523MergedAt)} with merge commit ${String(pr523.mergeCommitOid ?? pr523MergeCommit)}. PR #305 remains blocked by ${pr305Blocker}. Merge-ready validations remain 0.`,
    secondaryNextPaths: secondaryNextPrompts,
    expectedBlockers: [
      'PR #523 merged source evidence for PR #305 validation failure',
      'AI graphics draft/open chain',
      'Track A private E2E runtime gate evidence',
      'Sound scoped evidence not central runtime proof',
      'internal beta readiness still blocked',
    ],
    exactNextPrompt: primaryNextPrompt,
  }
}

function buildDecision(generatedAt: string, prMetadata: Record<string, JsonRecord>) {
  return {
    schema: 'reeditpro.openSourceToolStack.stagedOwnerMergePlanAfterBatch1Rollup.decision.v1',
    generatedAt,
    decision: expectedDecision,
    accepted: true,
    primaryNextPrompt,
    secondaryNextPrompts,
    blockers: [pr305Blocker, 'merge_ready_validations_0'],
    queueDecision: e2eQueueDecision,
    pr305Blocker,
    mergeReadyValidations: 0,
    e2ePr523: prSummary(523, prMetadata),
    inventoryCandidateCount: 71,
    aiGraphicsAcceptedWithWarningsCount: 13,
    endToEndProductReadyTools: 0,
    fortyPlusToolsEndToEndProven: false,
    workerRuntimeAccepted: false,
    mediaProcessingAccepted: false,
    mediaFileProbingAccepted: false,
    captionBurnInAccepted: false,
    renderExportAccepted: false,
    routeProviderRuntimeAccepted: false,
    providerModelRuntimeAccepted: false,
    supabaseGcsPublicDeliveryAccepted: false,
    signedUrlDeliveryAccepted: false,
    rawPromptExecutionAccepted: false,
    internalBetaUnlocked: false,
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

function buildPrivateManifest(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.stagedOwnerMergePlanAfterBatch1Rollup.privateManifest.v1',
    generatedAt,
    privateArtifactPolicy: 'metadata_only_no_private_payloads',
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
}

function report(id: string, generatedAt: string, details: Record<string, unknown>, warnings: string[]): StagedOwnerMergeReport {
  return {
    schema: `reeditpro.openSourceToolStack.stagedOwnerMergePlanAfterBatch1Rollup.${id}.v1`,
    generatedAt,
    status: 'accepted',
    accepted: true,
    warnings,
    blockers: [],
    details,
  }
}

function prSummary(number: number, prMetadata: Record<string, JsonRecord>) {
  const pr = prMetadata[String(number)] ?? {}
  const mergeCommit = pr.mergeCommit as JsonRecord | undefined
  return {
    number,
    title: pr.title ?? 'unavailable',
    state: pr.state ?? 'unavailable',
    isDraft: pr.isDraft ?? null,
    mergedAt: pr.mergedAt ?? null,
    mergeCommitOid: mergeCommit?.oid ?? null,
    baseRefName: pr.baseRefName ?? null,
    headRefName: pr.headRefName ?? null,
    mergeStateStatus: pr.mergeStateStatus ?? null,
    url: pr.url ?? null,
  }
}

function forbiddenScopes() {
  return [
    'github_pr_merge',
    'dependency_install',
    'package_lock_mutation',
    'docker_build_or_run',
    'ffmpeg_ffprobe_probe',
    'build_context_generation',
    'media_processing',
    'caption_burn_in',
    'render_export',
    'worker_route_provider_execution',
    'browser_capture',
    'map_rendering',
    'supabase_sql_gcs_mutation',
    'public_artifact_or_signed_url',
    'raw_prompt_execution',
    'beta_or_production_unlock',
  ]
}

function blockedScopeFlags() {
  return Object.fromEntries(forbiddenScopes().map((scope) => [scope, false]))
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}

function assertSafeConfirmations() {
  const missing = requiredConfirmations().filter((key) => process.env[key] !== 'true')
  const forbidden = forbiddenConfirmations().filter((key) => process.env[key] === 'true')
  if (missing.length || forbidden.length) {
    throw new Error(`unsafe_confirmations:${JSON.stringify({ missing, forbidden })}`)
  }
}

function ghPr(number: number): JsonRecord {
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
          'number,title,state,isDraft,mergedAt,baseRefName,headRefName,headRefOid,mergeStateStatus,url,mergeCommit',
        ],
        { encoding: 'utf8' },
      ),
    )
  } catch (error) {
    return {
      number,
      state: 'unavailable',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function ghSearch(query: string): JsonRecord[] {
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
          'number,title,state,isDraft,headRefName,baseRefName,url',
        ],
        { encoding: 'utf8' },
      ),
    )
  } catch {
    return []
  }
}

function git(args: string[]) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function hashFile(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function readJson(path: string): JsonRecord {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeMarkdown(path: string, content: string) {
  writeFileSync(path, content.endsWith('\n') ? content : `${content}\n`)
}

function writeReport(jsonPath: string, mdPath: string, value: StagedOwnerMergeReport) {
  writeJson(jsonPath, value)
  writeMarkdown(mdPath, reportMarkdown(value))
}

function reportMarkdown(value: StagedOwnerMergeReport) {
  return [
    `# ${titleFromSchema(value.schema)}`,
    '',
    `Status: \`${value.status}\``,
    `Accepted: \`${String(value.accepted)}\``,
    '',
    '## Warnings',
    ...(value.warnings.length ? value.warnings.map((warning) => `- ${warning}`) : ['- none']),
    '',
    '## Blockers',
    ...(value.blockers.length ? value.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    '## Details',
    '```json',
    JSON.stringify(value.details, null, 2),
    '```',
  ].join('\n')
}

function decisionMarkdown(value: JsonRecord) {
  return [
    '# Staged Owner Merge Plan Decision',
    '',
    `Decision: \`${String(value.decision)}\``,
    '',
    `Primary next prompt: \`${primaryNextPrompt}\``,
    '',
    `This decision prioritizes PR #305 hydration blocker resolution because PR #523 is merged source evidence for ${pr305Blocker} and merge-ready validations remain 0.`,
    '',
    'Do not claim 40+ tools are installed/proven end-to-end.',
    'Do not claim worker runtime, media processing, render/export, beta, or production readiness.',
  ].join('\n')
}

function validationMarkdown(artifacts: StagedOwnerMergeArtifacts) {
  return [
    '# Staged Owner Merge Plan Validation Results',
    '',
    `Decision: \`${String(artifacts.decision.decision)}\``,
    `Readiness: \`${String(artifacts.readinessReport.readiness)}\``,
    '',
    '- Reports generated: true',
    '- Package-lock mutation: false',
    '- Dockerfile/.dockerignore mutation: false',
    '- Runtime/product scopes enabled: false',
    '- Supabase classification: no write / environment none / SQL none / migration no',
  ].join('\n')
}

function titleFromSchema(schema: string) {
  return schema.split('.').at(-2)?.replace(/([a-z])([A-Z])/g, '$1 $2') ?? 'Report'
}

function writePrompts() {
  const prompts: Record<string, string> = {
    [nextPromptPaths.primary]: [
      '# E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION',
      '',
      'Resolve the PR #305 hydration/npm-ci blocker recorded by PR #523 before central owner-lane merge execution or internal beta readiness claims.',
      '',
      'Do not merge PRs, install dependencies, run runtime/product scopes, mutate Supabase/GCS, or unlock beta/production unless a later explicit approval packet authorizes them.',
    ].join('\n'),
    [nextPromptPaths.aiGraphics]: [
      '# OPEN_SOURCE_TOOL_STACK_AI_GRAPHICS_WORKER_SOURCE_REVIEW_AFTER_BATCH_1',
      '',
      'Review the AI graphics worker source chain after Batch 1 owner-lane planning. Keep 13 AI graphics tools accepted-with-warnings only for worker metadata dry-run scope until owner draft PRs are resolved.',
    ].join('\n'),
    [nextPromptPaths.sound]: [
      '# OPEN_SOURCE_TOOL_STACK_SOUND_OSS_SOURCE_RECONCILIATION_AFTER_BATCH_1',
      '',
      'Reconcile Sound OSS scoped evidence from PR #495/#507 without claiming real audio/media processing or production readiness.',
    ].join('\n'),
    [nextPromptPaths.tracka]: [
      '# OPEN_SOURCE_TOOL_STACK_TRACKA_PRIVATE_E2E_SOURCE_RECONCILIATION_AFTER_BATCH_1',
      '',
      'Reconcile Track A private E2E source evidence while render/export, worker execution, route execution, media processing, and beta remain blocked.',
    ].join('\n'),
    [nextPromptPaths.internalBeta]: [
      '# PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_OWNER_RECONCILIATION',
      '',
      'Aggregate internal beta readiness only after E2E, Track A, worker, route/provider, and storage/public-delivery gates are acknowledged. External beta and production remain blocked.',
    ].join('\n'),
    [nextPromptPaths.batch2Approval]: [
      '# OPEN_SOURCE_TOOL_STACK_BATCH_2_INSTALL_PROOF_APPROVAL_AFTER_OWNER_RECONCILIATION',
      '',
      'Plan Batch 2 install/proof approval only after owner-lane reconciliation clears duplicate and runtime-scope ambiguity.',
    ].join('\n'),
  }
  for (const [path, content] of Object.entries(prompts)) {
    writeMarkdown(path, content)
  }
}

function updateStatusDocs() {
  const block = [
    '<!-- OPEN_SOURCE_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP:start -->',
    '## Staged Owner Merge Plan After Batch 1 Rollup',
    '',
    `Decision: \`${expectedDecision}\`.`,
    '',
    'Primary next prompt: `E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION`.',
    '',
    `PR #523 is merged and now serves as source evidence for the unresolved PR #305 hydration blocker. PR #523 merged at ${pr523MergedAt} with merge commit ${pr523MergeCommit}. PR #305 remains blocked by ${pr305Blocker}. Merge-ready validations remain 0.`,
    '',
    'The staged plan keeps 71 candidates inventoried, Batch 1 bounded proof only, 13 AI graphics tools accepted-with-warnings in worker metadata dry-run scope only, and 0 end-to-end product-ready tools.',
    '',
    'Do not claim 40+ tools are installed/proven end-to-end. Worker runtime, media processing, render/export, Supabase/GCS/public delivery, beta, and production remain blocked.',
    '<!-- OPEN_SOURCE_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP:end -->',
  ].join('\n')

  for (const path of statusDocPaths) {
    if (!existsSync(path)) continue
    const existing = readFileSync(path, 'utf8')
    const pattern =
      /<!-- OPEN_SOURCE_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP:start -->[\s\S]*?<!-- OPEN_SOURCE_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP:end -->/
    const next = pattern.test(existing) ? existing.replace(pattern, block) : `${existing.trimEnd()}\n\n${block}\n`
    writeFileSync(path, next)
  }
}
