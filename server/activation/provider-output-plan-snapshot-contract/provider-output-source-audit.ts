import { existsSync } from 'node:fs'
import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_BASE_BRANCH,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_BRANCH,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_PHASE,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_PR_TITLE,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_DECISION,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID,
  buildSupabaseMilestoneSyncPolicy,
} from './provider-output-plan-snapshot-policy'
import type { ProviderOutputEvidenceContext } from './provider-output-plan-snapshot-types'

const SOURCE_PATHS = [
  'approved-plan-snapshot-policy.md',
  'model-routing-policy.md',
  'intent-led-edit-planning.md',
  'provider-prompt-architecture.md',
  'edit-planning-database-architecture.md',
  'editing-agent-execution-architecture.md',
  'docs/activation-phase-model-provider-dry-run-results.md',
  `${PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR}/provider_dry_run_readiness_report.json`,
  `${PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR}/qwen_provider_dry_run_report.json`,
  `${PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR}/deepseek_provider_dry_run_report.json`,
  `${PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR}/provider_dry_run_private_artifact_manifest.json`,
]

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

export function buildProviderOutputSourceAudit(evidence: ProviderOutputEvidenceContext) {
  return {
    phase: PROVIDER_OUTPUT_PLAN_SNAPSHOT_PHASE,
    branch: PROVIDER_OUTPUT_PLAN_SNAPSHOT_BRANCH,
    baseBranch: PROVIDER_OUTPUT_PLAN_SNAPSHOT_BASE_BRANCH,
    prTitle: PROVIDER_OUTPUT_PLAN_SNAPSHOT_PR_TITLE,
    ownerWorkstream: 'PLAN_SNAPSHOT_CONTRACT',
    sourceEvidence: 'Committed MODEL-DRYRUN-1 sanitized reports from PR #331 only',
    sourceProviderRunId: evidence.sourceProviderRunId,
    expectedSourceProviderRunId: PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID,
    sourceDecision: evidence.sourceDecision,
    expectedSourceDecision: PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_DECISION,
    sourcePlanSnapshotContractReady: evidence.sourcePlanSnapshotContractReady,
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    qwenSchema: evidence.qwen?.schemaId ?? 'missing',
    deepseekSchema: evidence.deepseek?.schemaId ?? 'missing',
    rawProviderResponsesStored: false,
    rawPromptPayloadsStored: false,
    secretPayloadsStored: false,
    providerRuntimeImported: false,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    routeExecutionAllowed: false,
    mediaProcessingAllowed: false,
    sqlOrMigrationAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
    productionAffected: false,
    externalBetaAffected: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncPolicy(true),
    activeBlockers: evidence.activeBlockers,
  }
}
