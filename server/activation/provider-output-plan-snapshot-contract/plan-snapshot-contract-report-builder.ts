import {
  buildCandidateApprovedPlanSnapshot,
} from './approved-plan-snapshot-contract-builder'
import {
  validateCandidateApprovedPlanSnapshot,
  validateExecutionBlocks,
} from './approved-plan-snapshot-contract-validator'
import {
  mapDeepSeekOutputToImplementationProposalRefs,
  mapDeepSeekOutputToRuntimeLimits,
} from './deepseek-output-to-implementation-proposal-mapper'
import { buildOwnerRouteMap } from './owner-route-mapper'
import { resolveProviderOutputEvidenceContext } from './provider-output-evidence-resolver'
import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_BASE_BRANCH,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_BRANCH,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_MODE,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_PHASE,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_PR_TITLE,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_DECISION,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID,
  buildSupabaseMilestoneSyncPolicy,
  getProviderOutputPlanSnapshotGeneratedPrefix,
  getProviderOutputPlanSnapshotQaPrefix,
} from './provider-output-plan-snapshot-policy'
import type {
  ProviderOutputPlanSnapshotDecision,
  ProviderOutputPlanSnapshotQa,
  ProviderOutputPlanSnapshotReportBundle,
  ProviderOutputPlanSnapshotStatus,
} from './provider-output-plan-snapshot-types'
import { buildProviderOutputSourceAudit } from './provider-output-source-audit'
import {
  mapQwenOutputToPlanLimits,
  mapQwenOutputToSelectedIntents,
} from './qwen-output-to-plan-mapper'
import {
  buildOwnerReviewHandoff,
  buildWorkerRuntimeHandoff,
} from './worker-runtime-handoff-builder'

function selectDecision(input: {
  evidenceBlockers: string[]
  schemaBlockers: string[]
  executionBlockers: string[]
  ownerRoutesComplete: boolean
}): ProviderOutputPlanSnapshotDecision {
  if (input.evidenceBlockers.length > 0) {
    if (input.evidenceBlockers.some((item) => item.includes('schema') || item.includes('model'))) {
      return 'blocked_provider_dry_run_schema_mismatch'
    }
    return 'blocked_missing_provider_dry_run_evidence'
  }
  if (input.executionBlockers.length > 0) return 'blocked_unsafe_execution_flags'
  if (!input.ownerRoutesComplete || input.schemaBlockers.some((item) => item.includes('owner'))) {
    return 'blocked_missing_owner_routes'
  }
  if (input.schemaBlockers.length > 0) return 'blocked_provider_dry_run_schema_mismatch'
  return 'provider_output_plan_snapshot_contract_passed_ready_for_worker_runtime_audit'
}

function statusFromDecision(decision: ProviderOutputPlanSnapshotDecision): ProviderOutputPlanSnapshotStatus {
  return decision.startsWith('blocked_') ? 'blocked' : decision === 'not_attempted' ? 'not_attempted' : 'passed'
}

export function buildProviderOutputPlanSnapshotContractBundle(input: {
  runId: string
  uploadStatus?: Record<string, unknown>
}): ProviderOutputPlanSnapshotReportBundle {
  const evidenceContext = resolveProviderOutputEvidenceContext()
  const selectedIntents = mapQwenOutputToSelectedIntents(evidenceContext.qwen)
  const implementationProposalRefs = mapDeepSeekOutputToImplementationProposalRefs(evidenceContext.deepseek)
  const ownerRouteMap = buildOwnerRouteMap({ selectedIntents, implementationProposalRefs })
  const qwenLimits = mapQwenOutputToPlanLimits(evidenceContext.qwen)
  const runtimeLimits = [
    ...mapDeepSeekOutputToRuntimeLimits(evidenceContext.deepseek),
    'This candidate snapshot cannot dispatch workers, tools, routes, providers, models, media, SQL, migrations, rendering, billing, production, or external beta paths.',
    'Runtime approval requires a later Worker Runtime owner audit and approved snapshot persistence implementation.',
  ]
  const candidateSnapshot = buildCandidateApprovedPlanSnapshot({
    runId: input.runId,
    evidence: evidenceContext,
    selectedIntents,
    implementationProposalRefs,
    ownerRoutes: ownerRouteMap.ownerRoutes,
    qaRequirements: qwenLimits.qaRequirements,
    privacyLimits: qwenLimits.privacyLimits,
    costLimits: qwenLimits.costLimits,
    runtimeLimits,
  })
  const schemaValidation = validateCandidateApprovedPlanSnapshot(candidateSnapshot)
  const executionBlockValidation = validateExecutionBlocks(candidateSnapshot)
  const validationPassed =
    evidenceContext.activeBlockers.length === 0 &&
    schemaValidation.status === 'passed' &&
    executionBlockValidation.status === 'passed'
  const workerRuntimeHandoff = buildWorkerRuntimeHandoff(candidateSnapshot, validationPassed)
  const ownerReviewHandoff = buildOwnerReviewHandoff(ownerRouteMap.ownerRoutes, validationPassed)
  const decision = selectDecision({
    evidenceBlockers: evidenceContext.activeBlockers,
    schemaBlockers: schemaValidation.activeBlockers,
    executionBlockers: executionBlockValidation.activeBlockers,
    ownerRoutesComplete: schemaValidation.ownerRoutesComplete,
  })
  const status = statusFromDecision(decision)
  const sourceAudit = buildProviderOutputSourceAudit(evidenceContext)
  const privateArtifactUploadStatus = String(input.uploadStatus?.status ?? 'not_attempted')
  const manifest = {
    phase: PROVIDER_OUTPUT_PLAN_SNAPSHOT_PHASE,
    runId: input.runId,
    reportDir: PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR,
    branch: PROVIDER_OUTPUT_PLAN_SNAPSHOT_BRANCH,
    baseBranch: PROVIDER_OUTPUT_PLAN_SNAPSHOT_BASE_BRANCH,
    generatedArtifactPrefix: getProviderOutputPlanSnapshotGeneratedPrefix(input.runId),
    qaArtifactPrefix: getProviderOutputPlanSnapshotQaPrefix(input.runId),
    sourceProviderRunId: PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID,
    sourceDecision: PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_DECISION,
    committedArtifactClasses: ['safe_json_reports', 'safe_markdown_docs', 'server_only_activation_code'],
    excludedArtifactClasses: [
      'provider_keys',
      'db_urls',
      'service_role_keys',
      'jwt_tokens',
      'bearer_tokens',
      'stripe_keys',
      'signed_urls',
      'raw_provider_responses',
      'raw_prompts',
      'secret_payloads',
      'media_payloads',
      'node_modules',
      'build_outputs',
    ],
    privateArtifactUpload: input.uploadStatus ?? {
      status: 'not_attempted',
      generatedPrefix: getProviderOutputPlanSnapshotGeneratedPrefix(input.runId),
      qaPrefix: getProviderOutputPlanSnapshotQaPrefix(input.runId),
      publicArtifacts: false,
      signedUrls: false,
    },
    supabaseMilestoneSync: buildSupabaseMilestoneSyncPolicy(true),
    publicArtifacts: false,
    signedUrls: false,
    rawProviderResponsesStored: false,
    rawPromptPayloadsStored: false,
    secretPayloadsStored: false,
    providerCallsExecuted: false,
    workersToolsRoutesExecuted: false,
    sqlExecuted: false,
    migrationDeployed: false,
  }
  const qa: ProviderOutputPlanSnapshotQa = {
    phase: PROVIDER_OUTPUT_PLAN_SNAPSHOT_PHASE,
    runId: input.runId,
    status,
    decision,
    gates: {
      provider_dry_run_evidence: evidenceContext,
      source_audit: sourceAudit,
      candidate_snapshot_schema_validation: schemaValidation,
      execution_block_validation: executionBlockValidation,
      owner_routes: ownerRouteMap,
      worker_runtime_handoff: workerRuntimeHandoff,
      private_artifact_upload_status: privateArtifactUploadStatus,
      supabase_milestone_sync: buildSupabaseMilestoneSyncPolicy(true),
    },
    passed: decision === 'provider_output_plan_snapshot_contract_passed_ready_for_worker_runtime_audit' &&
      (privateArtifactUploadStatus === 'uploaded' || privateArtifactUploadStatus === 'not_attempted'),
  }
  const report = {
    phase: PROVIDER_OUTPUT_PLAN_SNAPSHOT_PHASE,
    runId: input.runId,
    status,
    decision,
    mode: PROVIDER_OUTPUT_PLAN_SNAPSHOT_MODE,
    branch: PROVIDER_OUTPUT_PLAN_SNAPSHOT_BRANCH,
    baseBranch: PROVIDER_OUTPUT_PLAN_SNAPSHOT_BASE_BRANCH,
    prTitle: PROVIDER_OUTPUT_PLAN_SNAPSHOT_PR_TITLE,
    sourceProviderRunId: evidenceContext.sourceProviderRunId,
    sourceDecision: evidenceContext.sourceDecision,
    qwen: {
      modelId: evidenceContext.qwen?.modelId ?? 'missing',
      schemaId: evidenceContext.qwen?.schemaId ?? 'missing',
      mappedIntentCount: selectedIntents.length,
    },
    deepseek: {
      modelId: evidenceContext.deepseek?.modelId ?? 'missing',
      schemaId: evidenceContext.deepseek?.schemaId ?? 'missing',
      implementationProposalRefCount: implementationProposalRefs.length,
    },
    candidatePlanId: candidateSnapshot.planId,
    executionStatus: candidateSnapshot.executionStatus,
    approvedForRuntime: false,
    workerExecutionAllowed: false,
    providerCallsExecuted: false,
    toolsWorkersRoutesExecuted: false,
    publicArtifacts: false,
    signedUrls: false,
    productionAffected: false,
    externalBetaAffected: false,
    broadMediaAffected: false,
    rawProviderResponsesStored: false,
    rawPromptPayloadsStored: false,
    secretPayloadsStored: false,
    privateArtifactUploadStatus,
    privateGeneratedArtifactPrefix: getProviderOutputPlanSnapshotGeneratedPrefix(input.runId),
    privateQaArtifactPrefix: getProviderOutputPlanSnapshotQaPrefix(input.runId),
    supabaseMilestoneSync: buildSupabaseMilestoneSyncPolicy(true),
    activeBlockers: [
      ...evidenceContext.activeBlockers,
      ...schemaValidation.activeBlockers,
      ...executionBlockValidation.activeBlockers,
    ],
    provider2RuntimeReadiness: 'not_runtime_ready_candidate_contract_only',
    workerRuntimeAuditReadiness: workerRuntimeHandoff.status,
  }
  const summary = {
    phase: PROVIDER_OUTPUT_PLAN_SNAPSHOT_PHASE,
    runId: input.runId,
    status,
    decision,
    sourceProviderRunId: evidenceContext.sourceProviderRunId,
    sourceDecision: evidenceContext.sourceDecision,
    candidatePlanId: candidateSnapshot.planId,
    executionStatus: candidateSnapshot.executionStatus,
    approvedForRuntime: false,
    workerRuntimeAuditReadiness: workerRuntimeHandoff.status,
    privateArtifactUploadStatus,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncPolicy(true),
    activeBlockers: report.activeBlockers,
  }

  return {
    sourceAudit,
    evidenceContext,
    candidateSnapshot,
    schemaValidation,
    executionBlockValidation,
    ownerRouteMap,
    workerRuntimeHandoff,
    ownerReviewHandoff,
    manifest,
    qa,
    report,
    summary,
  }
}
