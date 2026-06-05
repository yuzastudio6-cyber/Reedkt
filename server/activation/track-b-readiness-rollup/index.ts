import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  TRACK_B_CAPABILITY_MANIFESTS,
  TRACK_B_TOOL_IDS,
} from '../track-b-capability-manifests/track-b-tool-registry'
import type { TrackBToolFamily, TrackBToolId } from '../track-b-capability-manifests/track-b-capability-manifest-types'
import {
  TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR,
  TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
  buildTrackBRouteEntries,
} from '../track-b-tool-route-manifest'
import {
  TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR,
  buildTrackBMetadataRouteDryRunReports,
} from '../track-b-metadata-route-dry-run'
import type {
  TrackBReadinessRollupReports,
  TrackBReadinessRollupStatus,
  TrackBSupabaseMilestoneExportRecord,
  TrackBToolStatusRollupEntry,
} from './track-b-readiness-rollup-types'

export const TRACK_B_READINESS_ROLLUP_PHASE = '44P'
export const TRACK_B_READINESS_ROLLUP_RUN_ID = 'phase44p-trackb-readiness-rollup-supabase-milestone-export-20260605'
export const TRACK_B_READINESS_ROLLUP_BRANCH = 'codex/rp-trackb-readiness-rollup-supabase-milestone-export'
export const TRACK_B_READINESS_ROLLUP_BASE_BRANCH = 'codex/rp-activation-44o-metadata-route-dry-run-execution'
export const TRACK_B_READINESS_ROLLUP_REPORT_DIR = 'docs/activation-track-b-readiness-rollup-reports'
export const TRACK_B_READINESS_ROLLUP_EXPORT_VERSION = 'track-b-supabase-milestone-export-v1'
export const TRACK_B_READINESS_ROLLUP_SCHEMA_VERSION = 'track-b-readiness-rollup-v1'

export const TRACK_B_READINESS_ROLLUP_EXPECTED_REPORTS = [
  'track_b_readiness_rollup_plan.json',
  'track_b_pr_evidence_inventory.json',
  'track_b_tool_status_rollup.json',
  'track_b_phase_status_rollup.json',
  'track_b_internal_ready_scope_rollup.json',
  'track_b_blocked_scope_rollup.json',
  'track_b_route_dry_run_status_rollup.json',
  'track_b_supabase_milestone_export.json',
  'track_b_supabase_milestone_export.schema.json',
  'track_b_next_phase_recommendation.json',
  'track_b_readiness_rollup_report.json',
  'track_b_private_artifact_manifest.json',
  'track_b_readiness_blocker_report.json',
] as const

const GLOBAL_BLOCKED_SCOPES = [
  'supabase_remote_sql',
  'supabase_staging_sql',
  'supabase_production_sql',
  'migration_deployment',
  'supabase_write_or_backfill',
  'live_route_execution',
  'worker_execution',
  'sidecar_execution',
  'tool_execution',
  'media_processing',
  'audio_processing',
  'ocr_runtime_execution',
  'vlm_runtime_execution',
  'model_download_or_runtime',
  'provider_calls',
  'docker_cloud_gcp_iam_mutation',
  'public_output',
  'public_artifacts',
  'signed_urls_as_source_of_truth',
  'raw_chat_execution',
  'broad_media',
  'arbitrary_media',
  'product_wide_internal_beta',
  'external_beta',
  'paid_production',
  'production',
  'track_a',
] as const

const SAFE_SUPABASE_EXPORT_FORBIDDEN_PAYLOADS = [
  'service_role_key',
  'anon_key',
  'jwt_secret',
  'provider_key',
  'secret_value',
  'signed_url',
  'raw_media_payload',
  'raw_audio_payload',
  'raw_frame_payload',
  'raw_transcript_payload',
  'model_weight_payload',
  'private_artifact_contents',
  'cloud_run_log_contents',
  'raw_prompt',
  'user_pii',
] as const

const PHASE_EVIDENCE = [
  evidence('phase37a_paddleocr_approval', '37A', 51, 'PaddleOCR model/runtime approval workflow', 'codex/rp-activation-37a-paddleocr-model-runtime-approval', 'docs/activation-phase-37a-paddleocr-model-runtime-approval.md', ['paddleocr', 'paddlepaddle'], 'phase_complete_restricted_scope'),
  evidence('phase37b_paddleocr_assets', '37B', 53, 'PaddleOCR exact asset download/private staging workflow', 'codex/rp-activation-37b-paddleocr-exact-assets-download', 'docs/activation-phase-37b-paddleocr-exact-assets-download.md', ['paddleocr', 'paddlepaddle'], 'phase_complete_restricted_scope'),
  evidence('phase37c_generated_ocr_runtime', '37C', 56, 'Generated OCR runtime verification', 'codex/rp-activation-37c-generated-ocr-runtime-verification', 'docs/activation-phase-37c-generated-ocr-runtime-verification.md', ['paddleocr', 'paddlepaddle'], 'phase_complete_restricted_scope'),
  evidence('phase37d_ocr_safe_zone_gate', '37D-GATE', 57, 'Controlled real-video OCR safe-zone gate', 'codex/rp-activation-37d-controlled-real-video-ocr-safe-zone-gate', 'docs/activation-phase-37d-controlled-real-video-ocr-safe-zone.md', ['paddleocr', 'paddlepaddle'], 'phase_complete_restricted_scope'),
  evidence('phase37d_ocr_safe_zone_execution', '37D-EXECUTION', 59, 'Controlled real-video OCR safe-zone execution', 'codex/rp-activation-37d-controlled-real-video-ocr-safe-zone-execution', 'docs/activation-phase-37d-controlled-real-video-ocr-safe-zone-execution.md', ['paddleocr', 'paddlepaddle'], 'phase_complete_restricted_scope'),
  evidence('phase37e_ocr_caption_render_qa', '37E', 61, 'OCR safe-zone caption/render QA integration', 'codex/rp-activation-37e-ocr-safe-zone-caption-render-qa', 'docs/activation-phase-37e-ocr-caption-render-qa.md', ['paddleocr', 'paddlepaddle'], 'phase_complete_restricted_scope'),
  evidence('phase39c_vlm_decision_gate', '39C', 120, 'VLM decision gate', 'codex/rp-activation-39c-vlm-decision-gate-recovery-plan', 'docs/activation-phase-39c-vlm-decision-gate-reports/phase_39c_vlm_decision_record.json', ['qwen3_vl', 'vllm'], 'blocked'),
  evidence('phase46a_media_data_readiness', '46A', 123, 'Media/data tool readiness audit', 'codex/rp-activation-46a-media-data-tool-readiness-audit', 'docs/activation-phase-46a-media-data-readiness-reports', ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars'], 'phase_complete_restricted_scope'),
  evidence('phase46b_generated_media_data', '46B', 125, 'Generated media/data analysis suite', 'codex/rp-activation-46b-generated-media-data-analysis-suite', 'docs/activation-phase-46b-generated-media-data-suite-reports', ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars'], 'phase_complete_restricted_scope'),
  evidence('phase46c_controlled_media_data', '46C', 128, 'Controlled real-video media/data suite', 'codex/rp-activation-46c-controlled-real-video-media-data-suite', 'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports', ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars'], 'phase_complete_restricted_scope'),
  evidence('phase46d_reporting_qa', '46D', 135, 'DuckDB/Polars reporting QA integration and auth rerun', 'codex/rp-activation-46d-auth-rerun-duckdb-polars-reporting-qa', 'docs/activation-phase-46d-duckdb-polars-reporting-qa-reports', ['duckdb', 'polars'], 'phase_complete_restricted_scope'),
  evidence('phase46e_media_data_beta_gate', '46E', 138, 'Media/data internal beta readiness gate', 'codex/rp-activation-46e-media-data-internal-beta-readiness-gate', 'docs/activation-phase-46e-media-data-internal-beta-readiness-gate-reports', ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars'], 'internally_beta_ready_candidate_restricted_scope'),
  evidence('phase36h_deepfilternet', '36H', 140, 'DeepFilterNet runtime hardening controlled speech', 'codex/rp-activation-36h-deepfilternet-runtime-hardening-controlled-speech', 'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports', ['deepfilternet'], 'phase_complete_restricted_scope'),
  evidence('phase36i_signalsmith_generated', '36I', 147, 'Signalsmith Stretch generated fixture', 'codex/rp-activation-36i-signalsmith-stretch-generated-fixture', 'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports', ['signalsmith_stretch'], 'phase_complete_restricted_scope'),
  evidence('phase36j_signalsmith_controlled', '36J', 149, 'Controlled real-media timing stretch sample', 'codex/rp-activation-36j-controlled-real-media-timing-stretch-sample', 'docs/activation-phase-36j-controlled-real-media-timing-stretch-sample-reports', ['signalsmith_stretch'], 'phase_complete_restricted_scope'),
  evidence('phase36k_demucs_provenance', '36K', 156, 'Demucs provenance approval retry', 'codex/rp-activation-36k-demucs-provenance-approval-retry', 'docs/activation-phase-36k-demucs-provenance-approval-retry-reports', ['demucs'], 'blocked_pending_training_data_provenance'),
  evidence('phase36m_audio_timing_beta_gate', '36M', 159, 'Audio/timing internal beta readiness gate', 'codex/rp-activation-36m-audio-timing-internal-beta-readiness-gate', 'docs/activation-phase-36m-audio-timing-internal-beta-readiness-gate-reports', ['deepfilternet', 'signalsmith_stretch', 'demucs'], 'internally_beta_ready_candidate_restricted_scope'),
  evidence('phase44ia_capability_manifest', '44I-A', 161, 'Track B capability manifest baseline', 'codex/rp-trackb-capability-manifest-baseline', 'docs/activation-track-b-capability-manifests-reports', TRACK_B_TOOL_IDS, 'phase_complete_restricted_scope'),
  evidence('phase44i_route_manifest', '44I', 164, 'Track B tool route manifest integration', 'codex/rp-activation-44i-trackb-tool-route-manifest-integration', TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR, TRACK_B_TOOL_IDS, 'phase_complete_restricted_scope'),
  evidence('phase44d_web_capability_profiler', '44D', 167, 'Web capability profiler', 'codex/rp-activation-44d-web-capability-profiler', 'docs/activation-phase-44d-web-capability-profiler-reports', ['web_capability_profiler'], 'phase_complete_restricted_scope'),
  evidence('phase44e_desktop_capability_profiler', '44E', 176, 'Desktop capability profiler', 'codex/rp-activation-44e-desktop-capability-profiler', 'docs/activation-phase-44e-desktop-capability-profiler-reports', ['desktop_capability_profiler'], 'phase_complete_restricted_scope'),
  evidence('phase44f_desktop_benchmark_runner', '44F', 177, 'Desktop benchmark runner', 'codex/rp-activation-44f-desktop-benchmark-runner', 'docs/activation-phase-44f-desktop-benchmark-runner-reports', ['desktop_capability_profiler'], 'phase_complete_restricted_scope'),
  evidence('phase44h_cost_estimator', '44H', 180, 'Track B cost estimator', 'codex/rp-activation-44h-trackb-cost-estimator', 'docs/activation-phase-44h-track-b-cost-estimator-reports', ['cost_estimator'], 'phase_complete_restricted_scope'),
  evidence('phase44g_sidecar_foundation', '44G', 181, 'Local worker sidecar foundation', 'codex/rp-activation-44g-local-worker-sidecar-foundation', 'docs/activation-phase-44g-local-worker-sidecar-foundation-reports', ['local_worker_sidecar_planning'], 'phase_complete_restricted_scope'),
  evidence('phase44j_hybrid_e2e_simulation', '44J', 184, 'Hybrid compute E2E simulation', 'codex/rp-activation-44j-hybrid-compute-e2e-simulation', 'docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports', ['local_worker_sidecar_planning', 'cost_estimator', 'tool_route_manifest_integration'], 'phase_complete_restricted_scope'),
  evidence('phase44k_desktop_beta_gate', '44K', 187, 'Desktop beta readiness gate', 'codex/rp-activation-44k-desktop-beta-readiness-gate', 'docs/activation-phase-44k-desktop-beta-readiness-gate-reports', ['web_capability_profiler', 'desktop_capability_profiler', 'local_worker_sidecar_planning', 'cost_estimator', 'tool_route_manifest_integration'], 'internally_beta_ready_candidate_restricted_scope'),
  evidence('phase44l_route_dry_run_approval', '44L', 188, 'Track B route dry-run approval packet', 'codex/rp-activation-44l-trackb-route-dry-run-approval-packet', 'docs/activation-phase-44l-route-dry-run-approval-reports', ['local_worker_sidecar_planning', 'tool_route_manifest_integration'], 'phase_complete_restricted_scope'),
  evidence('phase44m_noop_route_dry_run', '44M', 189, 'No-op route dry-run execution', 'codex/rp-activation-44m-noop-route-dry-run-execution', 'docs/activation-phase-44m-noop-route-dry-run-execution-reports', ['local_worker_sidecar_planning', 'tool_route_manifest_integration'], 'phase_complete_restricted_scope'),
  evidence('phase44n_metadata_route_approval', '44N', 192, 'Metadata route dry-run approval packet', 'codex/rp-activation-44n-metadata-route-dry-run-approval-packet', 'docs/activation-phase-44n-metadata-route-dry-run-approval-reports', ['duckdb', 'tool_route_manifest_integration'], 'phase_complete_restricted_scope'),
  evidence('phase44o_metadata_route_dry_run', '44O', 194, 'Metadata route dry-run execution', 'codex/rp-activation-44o-metadata-route-dry-run-execution', TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR, ['duckdb', 'tool_route_manifest_integration'], 'phase_complete_restricted_scope', 'a06c901fa7cb2b5e0cb9d469c3773f1aa92602bb'),
] as const

const CURRENT_STATUS_OVERRIDES: Partial<Record<TrackBToolId, TrackBReadinessRollupStatus>> = {
  deepfilternet: 'internally_beta_ready_candidate_restricted_scope',
  signalsmith_stretch: 'internally_beta_ready_candidate_restricted_scope',
  demucs: 'blocked_pending_training_data_provenance',
  qwen3_vl: 'excluded_for_initial_internal_testing',
  vllm: 'excluded_for_initial_internal_testing',
  opencv: 'internally_beta_ready_candidate_restricted_scope',
  pyav: 'internally_beta_ready_candidate_restricted_scope',
  pyscenedetect: 'internally_beta_ready_candidate_restricted_scope',
  sharp_libvips: 'internally_beta_ready_candidate_restricted_scope',
  duckdb: 'internally_beta_ready_candidate_restricted_scope',
  polars: 'internally_beta_ready_candidate_restricted_scope',
  web_capability_profiler: 'phase_complete_restricted_scope',
  desktop_capability_profiler: 'phase_complete_restricted_scope',
  local_worker_sidecar_planning: 'phase_complete_restricted_scope',
  cost_estimator: 'phase_complete_restricted_scope',
  tool_route_manifest_integration: 'phase_complete_restricted_scope',
}

export function getTrackBReadinessRollupPlan() {
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    schemaVersion: TRACK_B_READINESS_ROLLUP_SCHEMA_VERSION,
    exportVersion: TRACK_B_READINESS_ROLLUP_EXPORT_VERSION,
    branch: TRACK_B_READINESS_ROLLUP_BRANCH,
    baseBranch: TRACK_B_READINESS_ROLLUP_BASE_BRANCH,
    sourcePr194: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/194',
    mode: 'metadata_reporting_only',
    reportDir: TRACK_B_READINESS_ROLLUP_REPORT_DIR,
    expectedReports: TRACK_B_READINESS_ROLLUP_EXPECTED_REPORTS,
    requiredConfirmationForExecute: 'REEDITPRO_CONFIRM_TRACK_B_READINESS_ROLLUP',
    forbiddenConfirmations: [
      'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
      'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL',
      'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
      'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS',
      'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
      'REEDITPRO_CONFIRM_WORKER_EXECUTION',
      'REEDITPRO_CONFIRM_PROVIDER_CALLS',
      'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
    ],
    noSupabaseWrites: true,
    noSql: true,
    noMigrationDeployment: true,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noBetaProductionUnlock: true,
    trackA: 'not_touched',
    nextRecommendedPhase: 'Foundation/Supabase staging milestone backfill approval/execution prompt using this safe export.',
  }
}

export function getTrackBReadinessRollupIamPlan() {
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    supabaseMutation: 'blocked',
    secretPayloadAccess: 'not_required',
    notes: [
      'Phase 44P reads committed safe Track B metadata and writes committed JSON/Markdown reports only.',
      'Future Supabase backfill must run in a separate Foundation/Supabase-approved phase with explicit guarded confirmations.',
    ],
  }
}

export function getTrackBReadinessRollupCostSummary() {
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedCloudCostUsd: 0,
    supabaseSql: 'not_run',
    cloudCalls: 'not_run',
    billingApiCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    providerCalls: 'not_run',
    privateUpload: 'not_required',
  }
}

export async function writeTrackBReadinessRollupArtifacts(reportDir = TRACK_B_READINESS_ROLLUP_REPORT_DIR): Promise<void> {
  const reports = buildTrackBReadinessRollupReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_readiness_rollup_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_pr_evidence_inventory.json'), reports.prEvidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_tool_status_rollup.json'), reports.toolStatusRollup)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_phase_status_rollup.json'), reports.phaseStatusRollup)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_internal_ready_scope_rollup.json'), reports.internalReadyScopeRollup)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_blocked_scope_rollup.json'), reports.blockedScopeRollup)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_dry_run_status_rollup.json'), reports.routeDryRunStatusRollup)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_supabase_milestone_export.json'), reports.supabaseMilestoneExport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_supabase_milestone_export.schema.json'), reports.supabaseMilestoneExportSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_next_phase_recommendation.json'), reports.nextPhaseRecommendation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_readiness_rollup_report.json'), reports.readinessRollupReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_readiness_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'track_b_readiness_rollup_report.md'), renderRollupMarkdown(reports))
}

export function readTrackBReadinessRollupSummary() {
  const reports = buildTrackBReadinessRollupReports()
  const report = reports.readinessRollupReport as { status?: string; totalTools?: number; supabaseExportEligibleTools?: number }
  const blockerReport = reports.blockerReport as { activeBlockers?: string[] }
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: report.status,
    totalTools: report.totalTools,
    supabaseExportEligibleTools: report.supabaseExportEligibleTools,
    exportVersion: TRACK_B_READINESS_ROLLUP_EXPORT_VERSION,
    supabaseWrite: 'not_run',
    remoteSql: 'not_run',
    migrationDeployment: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    production: 'blocked',
    externalBeta: 'blocked',
    trackA: 'not_touched',
    activeBlockers: blockerReport.activeBlockers,
    nextRecommendedPhase: 'Foundation/Supabase staging milestone backfill approval/execution prompt.',
  }
}

export function buildTrackBReadinessRollupReports(): TrackBReadinessRollupReports {
  const prEvidenceInventory = buildPrEvidenceInventory()
  const toolStatusEntries = buildToolStatusRollupEntries()
  const toolStatusRollup = buildToolStatusRollup(toolStatusEntries)
  const phaseStatusRollup = buildPhaseStatusRollup(prEvidenceInventory)
  const internalReadyScopeRollup = buildInternalReadyScopeRollup(toolStatusEntries)
  const blockedScopeRollup = buildBlockedScopeRollup(toolStatusEntries)
  const routeDryRunStatusRollup = buildRouteDryRunStatusRollup()
  const supabaseMilestoneExport = buildSupabaseMilestoneExport(toolStatusEntries, prEvidenceInventory)
  const supabaseMilestoneExportSchema = buildSupabaseMilestoneExportSchema()
  const nextPhaseRecommendation = buildNextPhaseRecommendation()
  const blockers = buildBlockers(toolStatusEntries, supabaseMilestoneExport)
  const readinessRollupReport = {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    totalTools: toolStatusEntries.length,
    canonicalToolIdsPresent: toolStatusEntries.length === TRACK_B_TOOL_IDS.length,
    supabaseExportEligibleTools: toolStatusEntries.filter((entry) => entry.supabaseExportEligible).length,
    supabaseExportRecords: (supabaseMilestoneExport.records as TrackBSupabaseMilestoneExportRecord[]).length,
    supabaseWrite: 'not_run',
    remoteSql: 'not_run',
    migrationDeployment: 'not_run',
    productionAffected: false,
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    toolExecution: 'not_run',
    providerCalls: 'not_run',
    publicOutput: 'blocked',
    productWideInternalBeta: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    production: 'blocked',
    trackA: 'not_touched',
    blockers,
  }
  return {
    plan: getTrackBReadinessRollupPlan(),
    prEvidenceInventory,
    toolStatusRollup,
    phaseStatusRollup,
    internalReadyScopeRollup,
    blockedScopeRollup,
    routeDryRunStatusRollup,
    supabaseMilestoneExport,
    supabaseMilestoneExportSchema,
    nextPhaseRecommendation,
    readinessRollupReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
    blockerReport: {
      phase: TRACK_B_READINESS_ROLLUP_PHASE,
      runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
      status: blockers.length === 0 ? 'passed' : 'blocked',
      activeBlockers: blockers,
      stillBlockedScopes: GLOBAL_BLOCKED_SCOPES,
    },
  }
}

function buildToolStatusRollupEntries(): TrackBToolStatusRollupEntry[] {
  const routes = buildTrackBRouteEntries()
  return TRACK_B_CAPABILITY_MANIFESTS.map((manifest) => {
    const route = routes.find((entry) => entry.toolId === manifest.toolId)
    const currentStatus = CURRENT_STATUS_OVERRIDES[manifest.toolId] ?? manifest.status as TrackBReadinessRollupStatus
    const latest = latestEvidenceForTool(manifest.toolId)
    return {
      toolId: manifest.toolId,
      family: manifest.family,
      track: 'track_b',
      currentStatus,
      internalReady: ['internally_beta_ready_candidate_restricted_scope', 'phase_complete_restricted_scope'].includes(currentStatus),
      initialInternalTestingIncluded: manifest.initialInternalTestingGroup === 'included' || currentStatus === 'phase_complete_restricted_scope',
      allowedScope: allowedScopeForTool(manifest.toolId, manifest.restrictedInternalScope, currentStatus),
      blockedScope: blockedScopeForTool(manifest.toolId, route?.blockedReasons ?? []),
      latestEvidencePr: latest?.prNumber,
      latestEvidencePhase: latest?.phase ?? manifest.evidence.at(-1)?.phase ?? 'not_available',
      artifactPrefix: safeArtifactPrefixForTool(manifest.toolId),
      nextRequiredPhase: nextRequiredPhaseForTool(manifest.toolId, manifest.nextPhase),
      supabaseExportEligible: supabaseExportEligibleForStatus(currentStatus),
    }
  })
}

function buildToolStatusRollup(entries: TrackBToolStatusRollupEntry[]) {
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: entries.length === TRACK_B_TOOL_IDS.length ? 'passed' : 'blocked',
    totalTools: entries.length,
    expectedToolIds: TRACK_B_TOOL_IDS,
    missingToolIds: TRACK_B_TOOL_IDS.filter((toolId) => !entries.some((entry) => entry.toolId === toolId)),
    tools: entries,
  }
}

function buildPrEvidenceInventory() {
  const inventory = PHASE_EVIDENCE.map((entry) => ({
    ...entry,
    prUrl: entry.prNumber ? `https://github.com/yuzastudio6-cyber/Reedkt/pull/${entry.prNumber}` : undefined,
    committedEvidenceExists: existsSync(entry.reportPath),
    privatePayloadsRead: false,
    secretPayloadsRead: false,
    acceptedForRollup: true,
  }))
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'committed_safe_evidence_inventory_built',
    sourceBasePr: 194,
    inventory,
    noPrivatePayloadsRead: true,
    noSecretPayloadsRead: true,
    noSupabaseReadOrWrite: true,
  }
}

function buildPhaseStatusRollup(prEvidenceInventory: Record<string, unknown>) {
  const inventory = prEvidenceInventory.inventory as Array<ReturnType<typeof evidence> & { committedEvidenceExists: boolean }>
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'passed',
    phases: inventory.map((entry) => ({
      phaseId: entry.phase,
      sourceId: entry.sourceId,
      prNumber: entry.prNumber,
      title: entry.title,
      status: entry.status,
      committedEvidenceExists: entry.committedEvidenceExists,
      toolIds: entry.toolIds,
      reportPath: entry.reportPath,
    })),
  }
}

function buildInternalReadyScopeRollup(entries: TrackBToolStatusRollupEntry[]) {
  const ready = entries.filter((entry) => entry.internalReady)
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'restricted_internal_metadata_scope_only',
    internalReadyToolIds: ready.map((entry) => entry.toolId),
    internalReadyCount: ready.length,
    allowedScopesByTool: Object.fromEntries(ready.map((entry) => [entry.toolId, entry.allowedScope])),
    scopeBoundaries: [
      'restricted internal QA/planning/simulation only',
      'no product-wide internal beta unlock',
      'no external beta unlock',
      'no production unlock',
      'no public artifacts',
      'no broad or arbitrary media',
      'no providers',
      'no Track A',
    ],
  }
}

function buildBlockedScopeRollup(entries: TrackBToolStatusRollupEntry[]) {
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'blocked_scopes_preserved',
    globalBlockedScopes: GLOBAL_BLOCKED_SCOPES,
    demucs: entries.find((entry) => entry.toolId === 'demucs')?.blockedScope,
    vlm: entries.filter((entry) => ['qwen3_vl', 'vllm'].includes(entry.toolId)).map((entry) => ({
      toolId: entry.toolId,
      blockedScope: entry.blockedScope,
    })),
    routeAndWorkerExecution: {
      liveRouteExecution: 'blocked',
      workerExecution: 'blocked',
      sidecarExecution: 'blocked',
      toolExecution: 'blocked',
    },
  }
}

function buildRouteDryRunStatusRollup() {
  const phase44oReports = buildTrackBMetadataRouteDryRunReports()
  const execution = phase44oReports.executionReport as { metadataRouteDryRunStatus?: string; executionPerformed?: boolean; routeExecutionPerformed?: boolean }
  const routeEntries = buildTrackBRouteEntries()
  const duckDbRoute = routeEntries.find((entry) => entry.toolId === 'duckdb')
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: execution.metadataRouteDryRunStatus === 'passed' ? 'passed' : 'blocked',
    routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    phase44mNoopDryRun: {
      prNumber: 189,
      status: 'phase_complete_restricted_scope',
      executionPerformed: false,
      reportDir: 'docs/activation-phase-44m-noop-route-dry-run-execution-reports',
    },
    phase44oMetadataDryRun: {
      prNumber: 194,
      status: execution.metadataRouteDryRunStatus,
      executionPerformed: execution.executionPerformed,
      routeExecutionPerformed: execution.routeExecutionPerformed,
      reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR,
    },
    duckDbRoute: {
      routeId: duckDbRoute?.routeId,
      routeStatus: duckDbRoute?.routeStatus,
      routeExecutionAllowed: duckDbRoute?.routeExecutionAllowed,
      runtimeExecutionAllowed: duckDbRoute?.runtimeExecutionAllowed,
      routeDryRunOnly: true,
    },
    liveRouteExecution: 'blocked',
    workerExecution: 'blocked',
    sidecarExecution: 'blocked',
    toolRuntimeExecution: 'blocked',
  }
}

function buildSupabaseMilestoneExport(entries: TrackBToolStatusRollupEntry[], prEvidenceInventory: Record<string, unknown>) {
  const inventory = prEvidenceInventory.inventory as Array<ReturnType<typeof evidence> & { prUrl?: string; committedEvidenceExists: boolean }>
  const records: TrackBSupabaseMilestoneExportRecord[] = inventory.map((entry) => {
    const toolEntries = entries.filter((tool) => entry.toolIds.includes(tool.toolId))
    return {
      phaseId: entry.phase,
      track: 'track_b',
      family: exportFamilyForTools(toolEntries),
      toolIds: entry.toolIds,
      milestoneName: entry.title,
      status: entry.status,
      readinessStatus: readinessStatusForPhase(entry.status),
      betaStatus: betaStatusForPhase(entry.status),
      branch: entry.branch,
      prNumber: entry.prNumber,
      prUrl: entry.prUrl,
      commitSha: entry.commitSha,
      artifactPrefix: safeArtifactPrefixForPhase(entry.phase),
      artifactObjectCount: entry.committedEvidenceExists ? 1 : 0,
      allowedScope: allowedScopeForPhase(entry.status, entry.toolIds),
      blockedScopes: [...GLOBAL_BLOCKED_SCOPES],
      nextPhase: nextPhaseForPhase(entry.phase),
      createdFromReportPath: entry.reportPath,
      exportVersion: TRACK_B_READINESS_ROLLUP_EXPORT_VERSION,
    }
  })
  return {
    exportVersion: TRACK_B_READINESS_ROLLUP_EXPORT_VERSION,
    generatedByPhase: TRACK_B_READINESS_ROLLUP_PHASE,
    generatedByRunId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'safe_metadata_export_ready_for_future_supabase_backfill',
    supabaseWritePerformed: false,
    remoteSqlRun: false,
    migrationDeployment: false,
    productionAffected: false,
    forbiddenPayloadClasses: SAFE_SUPABASE_EXPORT_FORBIDDEN_PAYLOADS,
    records,
  }
}

function buildSupabaseMilestoneExportSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://reeditpro.local/schemas/track-b-supabase-milestone-export.schema.json',
    title: 'Track B Supabase Milestone Export',
    type: 'object',
    additionalProperties: false,
    required: ['exportVersion', 'generatedByPhase', 'status', 'supabaseWritePerformed', 'remoteSqlRun', 'migrationDeployment', 'forbiddenPayloadClasses', 'records'],
    properties: {
      exportVersion: { const: TRACK_B_READINESS_ROLLUP_EXPORT_VERSION },
      generatedByPhase: { const: TRACK_B_READINESS_ROLLUP_PHASE },
      generatedByRunId: { type: 'string' },
      status: { const: 'safe_metadata_export_ready_for_future_supabase_backfill' },
      supabaseWritePerformed: { const: false },
      remoteSqlRun: { const: false },
      migrationDeployment: { const: false },
      productionAffected: { const: false },
      forbiddenPayloadClasses: { type: 'array', items: { enum: SAFE_SUPABASE_EXPORT_FORBIDDEN_PAYLOADS } },
      records: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['phaseId', 'track', 'family', 'toolIds', 'milestoneName', 'status', 'readinessStatus', 'betaStatus', 'branch', 'allowedScope', 'blockedScopes', 'nextPhase', 'createdFromReportPath', 'exportVersion'],
          properties: {
            phaseId: { type: 'string' },
            track: { const: 'track_b' },
            family: { type: 'string' },
            toolIds: { type: 'array', items: { enum: TRACK_B_TOOL_IDS } },
            milestoneName: { type: 'string' },
            status: { type: 'string' },
            readinessStatus: { type: 'string' },
            betaStatus: { type: 'string' },
            branch: { type: 'string' },
            prNumber: { type: 'number' },
            prUrl: { type: 'string', pattern: '^https://github.com/yuzastudio6-cyber/Reedkt/pull/[0-9]+$' },
            commitSha: { type: 'string', pattern: '^[0-9a-f]{40}$' },
            artifactPrefix: { type: 'string', pattern: '^(docs/|gs://reeditpro-staging-reeditpro-qa-artifacts/activation/)' },
            artifactObjectCount: { type: 'number', minimum: 0 },
            allowedScope: { type: 'array', items: { type: 'string' } },
            blockedScopes: { type: 'array', items: { type: 'string' } },
            nextPhase: { type: 'string' },
            createdFromReportPath: { type: 'string', pattern: '^docs/' },
            exportVersion: { const: TRACK_B_READINESS_ROLLUP_EXPORT_VERSION },
          },
          not: {
            anyOf: [
              { required: ['secretValue'] },
              { required: ['serviceRoleKey'] },
              { required: ['providerKey'] },
              { required: ['signedUrl'] },
              { required: ['rawPayload'] },
              { required: ['userPii'] },
            ],
          },
        },
      },
    },
    policy: {
      forbids: SAFE_SUPABASE_EXPORT_FORBIDDEN_PAYLOADS,
      noSupabaseWriteInPhase44P: true,
      futureBackfillRequiresFoundationSupabaseApproval: true,
    },
  }
}

function buildNextPhaseRecommendation() {
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'ready_for_future_foundation_supabase_backfill_prompt',
    recommendedPrompt: 'Track B Supabase milestone staging backfill',
    recommendedScope: 'Foundation/Supabase-approved safe metadata backfill only.',
    requiredFutureGates: [
      'human/Foundation approval for Supabase staging metadata backfill',
      'explicit environment confirmations for any staging Supabase write',
      'redacted staging target confirmation',
      'safe metadata export validation',
      'no production Supabase',
      'no remote SQL unless separately approved',
      'no secrets in frontend or committed artifacts',
    ],
    blockedInPhase44P: GLOBAL_BLOCKED_SCOPES,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: TRACK_B_READINESS_ROLLUP_PHASE,
    runId: TRACK_B_READINESS_ROLLUP_RUN_ID,
    status: 'committed_safe_metadata_only',
    privateUploadRequired: false,
    privateUploadPerformed: false,
    privatePayloadsCommitted: false,
    secretPayloadsCommitted: false,
    supabaseWritePerformed: false,
    reportDir: TRACK_B_READINESS_ROLLUP_REPORT_DIR,
    expectedReports: TRACK_B_READINESS_ROLLUP_EXPECTED_REPORTS,
  }
}

function buildBlockers(entries: TrackBToolStatusRollupEntry[], supabaseExport: Record<string, unknown>): string[] {
  const records = supabaseExport.records as TrackBSupabaseMilestoneExportRecord[]
  return [
    entries.length === TRACK_B_TOOL_IDS.length ? undefined : 'missing_canonical_tool_id',
    TRACK_B_TOOL_IDS.every((toolId) => entries.some((entry) => entry.toolId === toolId)) ? undefined : 'canonical_tool_id_mismatch',
    entries.find((entry) => entry.toolId === 'demucs')?.currentStatus === 'blocked_pending_training_data_provenance' ? undefined : 'demucs_not_blocked',
    ['qwen3_vl', 'vllm'].every((toolId) => entries.find((entry) => entry.toolId === toolId)?.currentStatus === 'excluded_for_initial_internal_testing') ? undefined : 'vlm_not_excluded',
    records.length >= PHASE_EVIDENCE.length ? undefined : 'supabase_export_missing_phase_records',
    supabaseExport.supabaseWritePerformed === false ? undefined : 'supabase_write_performed',
    supabaseExport.remoteSqlRun === false ? undefined : 'remote_sql_run',
    supabaseExport.migrationDeployment === false ? undefined : 'migration_deployment_performed',
  ].filter((value): value is string => Boolean(value))
}

function evidence(
  sourceId: string,
  phase: string,
  prNumber: number | undefined,
  title: string,
  branch: string,
  reportPath: string,
  toolIds: readonly TrackBToolId[],
  status: TrackBReadinessRollupStatus,
  commitSha?: string,
) {
  return {
    sourceId,
    phase,
    prNumber,
    title,
    branch,
    reportPath,
    toolIds: [...toolIds],
    status,
    commitSha,
  }
}

function latestEvidenceForTool(toolId: TrackBToolId) {
  return [...PHASE_EVIDENCE].reverse().find((entry) => entry.toolIds.includes(toolId))
}

function supabaseExportEligibleForStatus(status: TrackBReadinessRollupStatus): boolean {
  return [
    'internally_beta_ready_candidate_restricted_scope',
    'phase_complete_restricted_scope',
    'blocked_pending_training_data_provenance',
    'excluded_for_initial_internal_testing',
  ].includes(status)
}

function allowedScopeForTool(toolId: TrackBToolId, manifestScope: string, status: TrackBReadinessRollupStatus): string[] {
  if (status === 'blocked_pending_training_data_provenance' || status === 'excluded_for_initial_internal_testing' || status === 'blocked') {
    return ['none_currently_approved']
  }
  if (toolId === 'tool_route_manifest_integration') return ['metadata_gating_and_supabase_export_reference_only']
  if (toolId === 'cost_estimator') return ['static_planning_cost_metadata_only']
  if (toolId === 'local_worker_sidecar_planning') return ['protocol_policy_and_simulation_metadata_only']
  if (toolId === 'web_capability_profiler' || toolId === 'desktop_capability_profiler') return ['coarse_capability_planning_hints_only']
  return [manifestScope]
}

function blockedScopeForTool(toolId: TrackBToolId, routeBlockers: string[]): string[] {
  const toolSpecific: Partial<Record<TrackBToolId, string[]>> = {
    demucs: ['model_download', 'source_separation', 'runtime_execution', 'blocked_pending_training_data_provenance'],
    qwen3_vl: ['vlm_runtime_retry', 'controlled_real_frame_vlm', 'planning_integration'],
    vllm: ['vlm_runtime_retry', 'qwen_vllm_route', 'planning_integration'],
    duckdb: ['duckdb_runtime_execution_in_phase44p', 'live_metadata_route_execution'],
    polars: ['polars_runtime_execution_in_phase44p', 'live_metadata_route_execution'],
  }
  return [...new Set([...(toolSpecific[toolId] ?? []), ...routeBlockers, ...GLOBAL_BLOCKED_SCOPES])]
}

function safeArtifactPrefixForTool(toolId: TrackBToolId): string | undefined {
  const familyPrefixes: Partial<Record<TrackBToolFamily, string>> = {
    audio_timing: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36/',
    ocr: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37/',
    media_data: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46/',
    hybrid_compute_cost_routing: 'docs/activation-phase-44*/',
  }
  const manifest = TRACK_B_CAPABILITY_MANIFESTS.find((entry) => entry.toolId === toolId)
  if (!manifest) return undefined
  if (manifest.family === 'vlm' || toolId === 'demucs') return undefined
  return familyPrefixes[manifest.family]
}

function nextRequiredPhaseForTool(toolId: TrackBToolId, manifestNextPhase: string): string {
  const next: Partial<Record<TrackBToolId, string>> = {
    demucs: 'human/legal provenance approval before any Phase 36L runtime/download path',
    qwen3_vl: 'explicit VLM recovery approval; Phase 39D remains blocked',
    vllm: 'explicit VLM recovery approval; vLLM route remains blocked',
    duckdb: 'separate tool-runtime route approval packet or Foundation/Supabase metadata backfill, depending roadmap priority',
    tool_route_manifest_integration: 'Foundation/Supabase Track B milestone backfill prompt using Phase 44P export',
  }
  return next[toolId] ?? manifestNextPhase
}

function safeArtifactPrefixForPhase(phase: string): string | undefined {
  if (phase.startsWith('36')) return 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36/'
  if (phase.startsWith('37')) return 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37/'
  if (phase.startsWith('46')) return 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46/'
  if (phase.startsWith('44')) return 'docs/activation-phase-44*/'
  return undefined
}

function exportFamilyForTools(entries: TrackBToolStatusRollupEntry[]): TrackBToolFamily | 'hybrid_compute' {
  if (entries.some((entry) => entry.family === 'hybrid_compute_cost_routing')) return 'hybrid_compute'
  return entries[0]?.family ?? 'hybrid_compute'
}

function readinessStatusForPhase(status: TrackBReadinessRollupStatus): string {
  if (status === 'internally_beta_ready_candidate_restricted_scope') return 'internally_beta_ready_candidate_restricted_scope'
  if (status === 'phase_complete_restricted_scope') return 'phase_complete_restricted_scope'
  return 'blocked'
}

function betaStatusForPhase(status: TrackBReadinessRollupStatus): string {
  if (status === 'internally_beta_ready_candidate_restricted_scope') return 'restricted_internal_candidate_only'
  if (status === 'phase_complete_restricted_scope') return 'phase_complete_but_product_beta_blocked'
  return 'blocked'
}

function allowedScopeForPhase(status: TrackBReadinessRollupStatus, toolIds: readonly TrackBToolId[]): string[] {
  if (status === 'blocked_pending_training_data_provenance' || status === 'blocked' || status === 'excluded_for_initial_internal_testing') {
    return ['safe_metadata_record_only']
  }
  if (toolIds.some((toolId) => ['cost_estimator', 'local_worker_sidecar_planning', 'tool_route_manifest_integration'].includes(toolId))) {
    return ['restricted_internal_metadata_planning_simulation_only']
  }
  return ['restricted_internal_qa_planning_metadata_only']
}

function nextPhaseForPhase(phase: string): string {
  if (phase === '44O') return 'Phase 44P readiness rollup and Supabase milestone export'
  if (phase === '44P') return 'Foundation/Supabase milestone staging backfill prompt'
  if (phase === '36K') return 'Demucs remains blocked pending human/legal review'
  if (phase === '39C') return 'VLM remains blocked pending explicit recovery approval'
  return 'Track B milestone registry backfill or next approved restricted-scope phase'
}

function renderRollupMarkdown(reports: TrackBReadinessRollupReports): string {
  const rollup = reports.toolStatusRollup as { tools?: TrackBToolStatusRollupEntry[] }
  const rows = (rollup.tools ?? [])
    .map((entry) => `| \`${entry.toolId}\` | ${entry.currentStatus} | ${entry.internalReady ? 'yes' : 'no'} | ${entry.supabaseExportEligible ? 'yes' : 'no'} |`)
    .join('\n')
  return `# Track B Readiness Rollup

Run id: \`${TRACK_B_READINESS_ROLLUP_RUN_ID}\`

Phase 44P creates committed safe metadata only. It does not write Supabase, run SQL, deploy migrations, execute routes/workers/tools, process media/audio/OCR/VLM/model payloads, call providers, unlock beta/production, or touch Track A.

| Tool | Current status | Internal ready | Supabase export eligible |
| --- | --- | --- | --- |
${rows}
`
}
