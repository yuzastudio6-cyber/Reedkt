import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import { buildBetaReadinessReport } from '../../beta-readiness'
import {
  buildUnifiedProductionReadinessReport,
  summarizeProductionReadinessReport,
} from '../../workers/readiness-validation'
import type {
  ProductInternalBetaReadinessDecision,
  ProductInternalBetaReadinessReports,
} from './internal-beta-readiness-types'

export const PRODUCT_INTERNAL_BETA_READINESS_PHASE =
  'product-internal-beta-readiness-aggregation'
export const PRODUCT_INTERNAL_BETA_READINESS_RUN_ID =
  'product-internal-beta-readiness-aggregation-20260611'
export const PRODUCT_INTERNAL_BETA_READINESS_BRANCH =
  'codex/rp-product-internal-beta-readiness-aggregation'
export const PRODUCT_INTERNAL_BETA_READINESS_BASE_BRANCH =
  'codex/rp-foundation-supabase-trackb-clean-staging-backfill'
export const PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR =
  'docs/activation-product-internal-beta-readiness-reports'

const PR298_REPORT_DIR = 'docs/activation-supabase-trackb-clean-staging-backfill-reports'
const PR283_REPORT_DIR = 'docs/activation-supabase-clean-staging-branch-execution-reports'
const TRACK_B_ROLLUP_REPORT_DIR = 'docs/activation-track-b-readiness-rollup-reports'
const TRACK_B_CAPABILITY_REPORT_DIR = 'docs/activation-track-b-capability-manifests-reports'
const TRACK_B_ROUTE_REPORT_DIR = 'docs/activation-track-b-tool-route-manifest-reports'
const CLEAN_STAGING_PROJECT_REF = 'fnjiylwirntrqdcwpbho'
const BROKEN_STAGING_PROJECT_REF = 'wmyyttnynmteqgcdishd'

export const PRODUCT_INTERNAL_BETA_READINESS_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'internal_beta_readiness_plan.json',
  'trackb_clean_staging_sync_verification.json',
  'internal_beta_workstream_inventory.json',
  'restricted_internal_testing_scope.json',
  'internal_beta_blocker_inventory.json',
  'internal_beta_owner_map.json',
  'internal_beta_go_no_go_decision.json',
  'internal_beta_readiness_blocker_report.json',
  'internal_beta_readiness_summary.json',
  'internal_beta_private_artifact_manifest.json',
] as const

export const PRODUCT_INTERNAL_BETA_READINESS_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_PRODUCT_INTERNAL_BETA_AGGREGATION',
  'REEDITPRO_CONFIRM_READINESS_METADATA_AGGREGATION',
  'REEDITPRO_CONFIRM_CLEAN_STAGING_METADATA_READ',
] as const

export const PRODUCT_INTERNAL_BETA_READINESS_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_PRODUCT_INTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
] as const

const SOURCE_OF_TRUTH_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
  PR298_REPORT_DIR,
  PR283_REPORT_DIR,
  TRACK_B_ROLLUP_REPORT_DIR,
  TRACK_B_CAPABILITY_REPORT_DIR,
  TRACK_B_ROUTE_REPORT_DIR,
] as const

const ALLOWED_INTERNAL_TESTING_SCOPE = [
  'metadata_readiness_dashboards',
  'track_b_readiness_review',
  'clean_staging_milestone_registry_review',
  'approved_noop_metadata_route_simulation_review',
  'duckdb_polars_metadata_reporting_evidence_review',
  'completed_phase_evidence_review',
] as const

const BLOCKED_SCOPE_IDS = [
  'production',
  'external_beta',
  'paid_production',
  'provider_calls',
  'live_tool_execution',
  'worker_execution',
  'route_execution',
  'public_artifacts',
  'signed_urls_as_source_of_truth',
  'broad_media_processing',
  'vlm_qwen_runtime',
  'demucs_runtime',
  'raw_prompt_execution',
  'supabase_production_promotion',
  'track_a_runtime',
] as const

const OWNER_MAP = [
  owner('SUPABASE_RLS_STORAGE_DATABASE', 'Supabase schema/RLS/storage/migration/milestone sync', 'clean_staging_metadata_synced'),
  owner('TRACK_B_MEDIA_PROCESSING', 'Track B tool readiness and exports', 'restricted_internal_candidate'),
  owner('WORKER_RUNTIME_JOBS', 'Worker execution gates', 'blocked_pending_separate_approval'),
  owner('PROVIDER_GATEWAY', 'Provider execution gates', 'blocked_pending_separate_approval'),
  owner('MODEL_ORCHESTRATION', 'Qwen/VLM/provider model orchestration', 'qwen_vlm_runtime_excluded'),
  owner('OBSERVABILITY_AUDIT_COST', 'Audit/cost/abuse signals', 'metadata_review_only'),
  owner('PUBLIC_ARTIFACT_DELIVERY', 'Public artifact and signed URL policy', 'blocked_pending_separate_approval'),
  owner('FRONTEND_PRODUCT_UX', 'Internal testing UX and operator scope signoff', 'next_owner_for_scope_freeze'),
  owner('TRACK_A_VISUAL_VIDEO_PIPELINE', 'Track A visual/video runtime', 'not_touched'),
] as const

function owner(ownerId: string, ownership: string, status: string) {
  return { ownerId, ownership, status }
}

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asString(value: unknown, fallback = 'missing'): string {
  return typeof value === 'string' ? value : fallback
}

export function getProductInternalBetaReadinessPlan() {
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    branch: PRODUCT_INTERNAL_BETA_READINESS_BRANCH,
    baseBranch: PRODUCT_INTERNAL_BETA_READINESS_BASE_BRANCH,
    prTitle: '[product] Internal beta readiness aggregation after Track B backfill',
    mode: 'metadata_readiness_aggregation_only',
    reportDir: PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR,
    expectedReports: PRODUCT_INTERNAL_BETA_READINESS_EXPECTED_REPORTS,
    requiredConfirmations: PRODUCT_INTERNAL_BETA_READINESS_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: PRODUCT_INTERNAL_BETA_READINESS_FORBIDDEN_CONFIRMATIONS,
    sourcePrs: {
      trackBCleanStagingBackfill: 298,
      cleanStagingSchemaRls: 283,
      trackBReadinessRollupExport: 196,
      trackBCapabilityManifests: 161,
      trackBRouteManifest: 164,
    },
    docsBasis: [
      'https://supabase.com/docs/reference/cli/supabase-db-push',
      'https://supabase.com/docs/guides/deployment/database-migrations',
      'https://supabase.com/changelog.md',
    ],
    noSupabaseWrites: true,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noPublicArtifacts: true,
    noProductionUnlock: true,
    noExternalBetaUnlock: true,
    noPaidProductionUnlock: true,
    nextRecommendedPhase: 'PRODUCT_INTERNAL_BETA_AGGREGATION - Internal testing scope freeze and operator signoff.',
  }
}

export function buildProductInternalBetaReadinessReports(): ProductInternalBetaReadinessReports {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const trackBCleanStagingSyncVerification = buildTrackBCleanStagingSyncVerification()
  const workstreamInventory = buildWorkstreamInventory(trackBCleanStagingSyncVerification)
  const restrictedInternalTestingScope = buildRestrictedInternalTestingScope()
  const blockerInventory = buildBlockerInventory()
  const ownerMap = buildOwnerMap()
  const goNoGoDecision = buildGoNoGoDecision(
    trackBCleanStagingSyncVerification,
    restrictedInternalTestingScope,
    blockerInventory,
  )
  const blockerReport = buildBlockerReport(goNoGoDecision, trackBCleanStagingSyncVerification)
  const summary = buildSummary(goNoGoDecision, trackBCleanStagingSyncVerification, blockerReport)

  return {
    sourceOfTruthOwnershipAudit,
    plan: getProductInternalBetaReadinessPlan(),
    trackBCleanStagingSyncVerification,
    workstreamInventory,
    restrictedInternalTestingScope,
    blockerInventory,
    ownerMap,
    goNoGoDecision,
    blockerReport,
    summary,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeProductInternalBetaReadinessArtifacts(
  reports = buildProductInternalBetaReadinessReports(),
  reportDir = PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_beta_readiness_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_sync_verification.json'), reports.trackBCleanStagingSyncVerification)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_beta_workstream_inventory.json'), reports.workstreamInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'restricted_internal_testing_scope.json'), reports.restrictedInternalTestingScope)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_beta_blocker_inventory.json'), reports.blockerInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_beta_owner_map.json'), reports.ownerMap)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_beta_go_no_go_decision.json'), reports.goNoGoDecision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_beta_readiness_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_beta_readiness_summary.json'), reports.summary)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_beta_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/product-internal-beta-readiness-aggregation.md', renderAggregationMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-scope.md', renderRestrictedScopeMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/internal-beta-owner-map.md', renderOwnerMapMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/internal-beta-readiness-decision.md', renderDecisionMarkdown(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-product-internal-testing-scope-freeze.md',
    renderNextPromptMarkdown(reports),
  )
}

export function readProductInternalBetaReadinessSummary() {
  const reports = buildProductInternalBetaReadinessReports()
  return reports.summary
}

export async function executeProductInternalBetaReadiness(options: {
  execute?: boolean
  metadataOnly?: boolean
  keepTemp?: boolean
} = {}): Promise<{ exitCode: number }> {
  if (!options.execute || !options.metadataOnly) {
    await writeProductInternalBetaReadinessArtifacts()
    return { exitCode: 0 }
  }
  const missing = PRODUCT_INTERNAL_BETA_READINESS_REQUIRED_CONFIRMATIONS.filter(
    (name) => process.env[name] !== 'true',
  )
  const forbidden = PRODUCT_INTERNAL_BETA_READINESS_FORBIDDEN_CONFIRMATIONS.filter(
    (name) => process.env[name] === 'true',
  )
  if (missing.length > 0 || forbidden.length > 0) {
    const reports = buildProductInternalBetaReadinessReports()
    await writeProductInternalBetaReadinessArtifacts({
      ...reports,
      blockerReport: {
        phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
        runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
        status: 'blocked',
        activeBlockers: [
          ...missing.map((name) => `missing_confirmation:${name}`),
          ...forbidden.map((name) => `forbidden_confirmation:${name}`),
        ],
        productionAffected: false,
        externalBetaUnlocked: false,
        paidProductionUnlocked: false,
        runtimeExecution: false,
        supabaseWrite: false,
      },
      summary: {
        ...reports.summary,
        status: 'blocked',
        decision: 'blocked_pending_owner_review',
        activeBlockers: [
          ...missing.map((name) => `missing_confirmation:${name}`),
          ...forbidden.map((name) => `forbidden_confirmation:${name}`),
        ],
      },
    })
    return { exitCode: 1 }
  }
  await writeProductInternalBetaReadinessArtifacts()
  return { exitCode: 0 }
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    workstreamOwner: 'PRODUCT_INTERNAL_BETA_AGGREGATION',
    relatedWorkstreams: OWNER_MAP.map((entry) => entry.ownerId),
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      kind: existsSync(sourcePath) ? 'repo_safe_source' : 'missing_audit_fact',
    })),
    duplicateWorkAvoided: [
      'no_new_track_b_export',
      'no_new_supabase_schema',
      'no_new_backfill',
      'no_new_route_manifest',
      'no_runtime_execution',
    ],
    productionAffected: false,
    supabaseWrite: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildTrackBCleanStagingSyncVerification() {
  const exportValidation = readJson(path.join(PR298_REPORT_DIR, 'trackb_export_validation_report.json'))
  const write = readJson(path.join(PR298_REPORT_DIR, 'trackb_clean_staging_backfill_write_report.json'))
  const verification = readJson(path.join(PR298_REPORT_DIR, 'trackb_clean_staging_backfill_verification_report.json'))
  const readiness = readJson(path.join(PR298_REPORT_DIR, 'trackb_clean_staging_backfill_readiness_report.json'))

  const recordCount = asNumber(exportValidation?.recordCount)
  const rowsVerifiedTotal = asNumber(verification?.rowsVerifiedTotal, asNumber(write?.rowsWrittenTotal))
  const toolIdsVerified = Array.isArray(verification?.toolIdsVerified) ? verification.toolIdsVerified : []
  const syncCompleted =
    exportValidation?.status === 'passed' &&
    write?.status === 'passed' &&
    verification?.status === 'passed' &&
    readiness?.status === 'passed' &&
    asString(verification?.targetProjectRef, asString(write?.targetProjectRef)) === CLEAN_STAGING_PROJECT_REF &&
    recordCount === 30 &&
    rowsVerifiedTotal === 259 &&
    asBool(verification?.canonicalToolIdsCovered, asBool(exportValidation?.canonicalToolIdsCovered)) &&
    asBool(write?.productionAffected) === false &&
    asBool(write?.brokenOriginalStagingAffected) === false &&
    asBool(write?.trackBRuntimeExecution) === false

  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    status: syncCompleted ? 'passed' : 'blocked',
    syncStatus: syncCompleted ? 'completed' : 'not_completed',
    targetProjectRef: CLEAN_STAGING_PROJECT_REF,
    brokenOriginalStagingProjectRef: BROKEN_STAGING_PROJECT_REF,
    environment: 'clean_staging',
    cleanStagingMetadataRead: true,
    sourceEvidence: {
      exportValidationReport: path.join(PR298_REPORT_DIR, 'trackb_export_validation_report.json'),
      writeReport: path.join(PR298_REPORT_DIR, 'trackb_clean_staging_backfill_write_report.json'),
      verificationReport: path.join(PR298_REPORT_DIR, 'trackb_clean_staging_backfill_verification_report.json'),
      readinessReport: path.join(PR298_REPORT_DIR, 'trackb_clean_staging_backfill_readiness_report.json'),
    },
    recordCount,
    canonicalToolIdsCovered: asBool(verification?.canonicalToolIdsCovered, asBool(exportValidation?.canonicalToolIdsCovered)),
    canonicalToolCount: toolIdsVerified.length,
    toolIdsVerified,
    rowsWrittenTotal: asNumber(write?.rowsWrittenTotal),
    rowsVerifiedTotal,
    expectedCounts: verification?.expectedCounts,
    actualCounts: verification?.actualCounts,
    tableCount: Object.keys((verification?.actualCounts ?? {}) as Record<string, unknown>).length,
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    trackBRuntimeExecution: false,
    routeExecution: false,
    workerExecution: false,
    toolExecution: false,
    providerCalls: false,
    mediaProcessing: false,
    migrationDeployed: false,
    supabaseWriteInThisPhase: false,
    sqlExecutedInThisPhase: false,
    blockers: syncCompleted ? [] : ['track_b_clean_staging_sync_not_verified'],
  }
}

function buildWorkstreamInventory(trackBSync: Record<string, unknown>) {
  const beta = buildBetaReadinessReport()
  const production = buildUnifiedProductionReadinessReport()
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    status: 'restricted_internal_scope_inventory_built',
    readinessSources: {
      betaOverallStatus: beta.overallStatus,
      internalDryRunAllowedByCurrentBetaReport: beta.goNoGo.internalDryRunTestingAllowed,
      externalBetaAllowedByCurrentBetaReport: beta.goNoGo.externalBetaAllowed,
      realUserMediaBetaAllowedByCurrentBetaReport: beta.goNoGo.realUserMediaBetaAllowed,
      paidProductionAllowedByCurrentBetaReport: beta.goNoGo.paidProductionAllowed,
      productionSummary: summarizeProductionReadinessReport(production),
    },
    workstreams: [
      workstream('supabase_milestone_registry', 'SUPABASE_RLS_STORAGE_DATABASE', 'track_b_clean_staging_milestone_sync_completed', true, ['metadata registry review'], ['production promotion'], 'internal_testing_scope_freeze'),
      workstream('track_b_media_tool_readiness', 'TRACK_B_MEDIA_PROCESSING', asString(trackBSync.syncStatus), true, ['readiness evidence review'], ['tool runtime execution', 'broad media'], 'scope freeze and operator signoff'),
      workstream('worker_runtime', 'WORKER_RUNTIME_JOBS', 'blocked', false, ['none'], ['worker execution'], 'separate worker runtime approval'),
      workstream('provider_gateway', 'PROVIDER_GATEWAY', 'blocked', false, ['none'], ['provider calls'], 'separate provider gateway approval'),
      workstream('model_orchestration_qwen_vlm', 'MODEL_ORCHESTRATION', 'excluded_or_blocked', false, ['metadata-only exclusion review'], ['Qwen/VLM runtime'], 'separate model runtime review'),
      workstream('public_artifacts', 'PUBLIC_ARTIFACT_DELIVERY', 'blocked', false, ['none'], ['public artifacts', 'signed URL source-of-truth'], 'public artifact policy approval'),
      workstream('web_search_browser_capture', 'PUBLIC_ARTIFACT_DELIVERY', 'blocked_for_runtime', false, ['metadata evidence review only'], ['browser capture runtime', 'signed URL delivery'], 'separate capture/delivery approval'),
      workstream('track_a_visual_video_pipeline', 'TRACK_A_VISUAL_VIDEO_PIPELINE', 'not_touched', false, ['none'], ['Track A runtime'], 'separate Track A approval'),
      workstream('observability_audit_cost', 'OBSERVABILITY_AUDIT_COST', 'metadata_review_only', true, ['cost/readiness/audit evidence review'], ['billing mutation'], 'operator signoff'),
      workstream('frontend_internal_ux', 'FRONTEND_PRODUCT_UX', 'pending_scope_freeze', true, ['restricted scope docs and dashboards'], ['external beta UI unlock'], 'internal testing scope freeze'),
      workstream('production_external_beta_paid', 'PRODUCT_INTERNAL_BETA_AGGREGATION', 'blocked', false, ['none'], ['production', 'external beta', 'paid production'], 'future separate production readiness approval'),
    ],
    productionAffected: false,
    externalBetaUnlocked: false,
    paidProductionUnlocked: false,
  }
}

function workstream(
  id: string,
  ownerId: string,
  currentStatus: string,
  internalTestEligible: boolean,
  allowedScope: string[],
  blockedScope: string[],
  nextRequiredPhase: string,
) {
  return { id, ownerId, currentStatus, internalTestEligible, allowedScope, blockedScope, nextRequiredPhase }
}

function buildRestrictedInternalTestingScope() {
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    status: 'restricted_scope_defined',
    allowedScope: ALLOWED_INTERNAL_TESTING_SCOPE,
    blockedScope: BLOCKED_SCOPE_IDS,
    internalTestingCandidate: true,
    productBetaUnlocked: false,
    productionAllowed: false,
    externalBetaUnlocked: false,
    paidProductionUnlocked: false,
    publicArtifactsAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    rawPromptExecutionAllowed: false,
    providerCallsAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    routeExecutionAllowed: false,
    broadMediaProcessingAllowed: false,
  }
}

function buildBlockerInventory() {
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    status: 'blocked_scopes_preserved',
    blockers: BLOCKED_SCOPE_IDS.map((id) => ({
      id,
      status: 'blocked',
      blocksExternalBeta: ['production', 'external_beta', 'paid_production', 'public_artifacts', 'provider_calls'].includes(id),
      requiredNextPhase: blockerNextPhase(id),
    })),
    productionBlocked: true,
    externalBetaBlocked: true,
    paidProductionBlocked: true,
    runtimeExecutionBlocked: true,
    providerCallsBlocked: true,
    publicArtifactsBlocked: true,
    supabaseProductionPromotionBlocked: true,
  }
}

function blockerNextPhase(id: string) {
  if (id === 'production' || id === 'supabase_production_promotion') return 'separate production promotion approval'
  if (id === 'external_beta') return 'separate external beta approval'
  if (id === 'paid_production') return 'separate paid production approval'
  if (id.includes('worker')) return 'worker runtime gate'
  if (id.includes('provider')) return 'provider gateway gate'
  if (id.includes('public') || id.includes('signed')) return 'public artifact delivery gate'
  return 'separate owner approval'
}

function buildOwnerMap() {
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    status: 'owner_map_recorded',
    owners: OWNER_MAP,
    nextOwner: 'FRONTEND_PRODUCT_UX',
    nextPrompt: 'docs/implementation-prompts/prompt-product-internal-testing-scope-freeze.md',
  }
}

function buildGoNoGoDecision(
  trackBSync: Record<string, unknown>,
  restrictedScope: Record<string, unknown>,
  blockerInventory: Record<string, unknown>,
) {
  const blockers = [
    ...(trackBSync.syncStatus === 'completed' ? [] : ['track_b_clean_staging_sync_not_completed']),
    ...(restrictedScope.status === 'restricted_scope_defined' ? [] : ['restricted_scope_missing']),
    ...(blockerInventory.status === 'blocked_scopes_preserved' ? [] : ['blocked_scope_inventory_missing']),
  ]
  const decision: ProductInternalBetaReadinessDecision =
    blockers.length === 0 ? 'restricted_internal_testing_candidate' : 'blocked_pending_scope_freeze'
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    decision,
    status: decision === 'restricted_internal_testing_candidate' ? 'passed' : 'blocked',
    goNoGoRecommendation: decision,
    restrictedInternalTestingCandidate: decision === 'restricted_internal_testing_candidate',
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    productionAllowed: false,
    publicArtifactsAllowed: false,
    runtimeExecutionAllowed: false,
    providerCallsAllowed: false,
    supabaseWritesAllowedInThisPhase: false,
    blockers,
    nextRecommendedPhase: 'PRODUCT_INTERNAL_BETA_AGGREGATION - Internal testing scope freeze and operator signoff.',
  }
}

function buildBlockerReport(
  decision: Record<string, unknown>,
  trackBSync: Record<string, unknown>,
) {
  const activeBlockers = Array.isArray(decision.blockers) ? decision.blockers : []
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    trackBCleanStagingSync: trackBSync.syncStatus,
    blockedScopesPreserved: BLOCKED_SCOPE_IDS,
    productionAffected: false,
    externalBetaUnlocked: false,
    paidProductionUnlocked: false,
    publicArtifactsCreated: false,
    providerCalls: false,
    runtimeExecution: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildSummary(
  decision: Record<string, unknown>,
  trackBSync: Record<string, unknown>,
  blockerReport: Record<string, unknown>,
) {
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    trackBCleanStagingSync: trackBSync.syncStatus,
    cleanStagingProjectRef: CLEAN_STAGING_PROJECT_REF,
    trackBRowsVerified: trackBSync.rowsVerifiedTotal,
    canonicalTrackBToolsVerified: trackBSync.canonicalToolCount,
    allowedScope: ALLOWED_INTERNAL_TESTING_SCOPE,
    blockedScope: BLOCKED_SCOPE_IDS,
    ownerMapStatus: 'recorded',
    activeBlockers: blockerReport.activeBlockers,
    supabaseUpdateRequired: 'read_only_verification_aggregation_only',
    supabaseUpdateStatus: 'track_b_clean_staging_milestone_sync_completed',
    supabaseEnvironmentTouched: 'none_by_this_phase',
    sqlExecuted: false,
    migrationDeployed: false,
    runtimeToolsWorkersRoutes: false,
    providers: false,
    publicArtifacts: false,
    production: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: 'PRODUCT_INTERNAL_BETA_AGGREGATION - Internal testing scope freeze and operator signoff.',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: PRODUCT_INTERNAL_BETA_READINESS_PHASE,
    runId: PRODUCT_INTERNAL_BETA_READINESS_RUN_ID,
    status: 'safe_metadata_only',
    reportDir: PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR,
    reports: PRODUCT_INTERNAL_BETA_READINESS_EXPECTED_REPORTS,
    committedArtifactsAllowed: ['json_reports', 'markdown_docs', 'server_only_typescript', 'package_scripts'],
    excludedArtifacts: [
      'secrets',
      'db_urls',
      'service_role_keys',
      'anon_keys',
      'access_tokens',
      'private_payloads',
      'media_payloads',
      'node_modules',
      'caches',
      'build_output',
    ],
  }
}

function renderAggregationMarkdown(reports: ProductInternalBetaReadinessReports) {
  return [
    '# Product Internal Beta Readiness Aggregation',
    '',
    `Decision: \`${reports.goNoGoDecision.decision}\`.`,
    '',
    `Track B clean-staging sync: \`${reports.trackBCleanStagingSyncVerification.syncStatus}\`.`,
    `Clean staging project: \`${CLEAN_STAGING_PROJECT_REF}\`.`,
    '',
    'This phase aggregates safe readiness metadata only. It does not mutate Supabase, write milestone rows, execute tools/workers/providers/routes, process media, create public artifacts, or unlock production/external beta/paid production.',
    '',
    'Docs basis: https://supabase.com/docs/reference/cli/supabase-db-push, https://supabase.com/docs/guides/deployment/database-migrations, https://supabase.com/changelog.md.',
  ].join('\n')
}

function renderRestrictedScopeMarkdown(reports: ProductInternalBetaReadinessReports) {
  const scope = reports.restrictedInternalTestingScope
  const allowed = Array.isArray(scope.allowedScope) ? scope.allowedScope : []
  const blocked = Array.isArray(scope.blockedScope) ? scope.blockedScope : []
  return [
    '# Restricted Internal Testing Scope',
    '',
    'Allowed:',
    ...allowed.map((item) => `- \`${item}\``),
    '',
    'Blocked:',
    ...blocked.map((item) => `- \`${item}\``),
    '',
    'External beta, paid production, production, public artifacts, signed URL source-of-truth, providers, workers, live tool routes, raw prompt execution, and broad media remain blocked.',
  ].join('\n')
}

function renderOwnerMapMarkdown(reports: ProductInternalBetaReadinessReports) {
  const ownerMap = reports.ownerMap.owners
  const owners = Array.isArray(ownerMap) ? ownerMap as Array<{ ownerId?: string; ownership?: string; status?: string }> : []
  return [
    '# Internal Beta Owner Map',
    '',
    ...owners.map((entry) => `- \`${entry.ownerId}\`: ${entry.ownership} (${entry.status})`),
  ].join('\n')
}

function renderDecisionMarkdown(reports: ProductInternalBetaReadinessReports) {
  return [
    '# Internal Beta Readiness Decision',
    '',
    `Decision: \`${reports.goNoGoDecision.decision}\`.`,
    '',
    'Restricted internal testing is a candidate only for metadata/readiness review and operator signoff. This does not unlock external beta, paid production, production, public artifacts, providers, workers, route/tool runtime, broad media, raw prompts, or Supabase production promotion.',
  ].join('\n')
}

function renderNextPromptMarkdown(reports: ProductInternalBetaReadinessReports) {
  return [
    '# PRODUCT_INTERNAL_BETA_AGGREGATION - Internal Testing Scope Freeze And Operator Signoff',
    '',
    `Current decision: \`${reports.goNoGoDecision.decision}\`.`,
    '',
    'Use this prompt for the next phase only after reviewing the restricted internal testing scope and owner map from this packet.',
    '',
    'The next phase must freeze the allowed metadata/readiness-only internal testing scope, collect operator signoff, and keep external beta, paid production, production, public artifacts, signed URL source-of-truth, provider calls, workers, route/tool runtime, broad media, raw prompt execution, and Track A runtime blocked unless separately approved.',
  ].join('\n')
}
