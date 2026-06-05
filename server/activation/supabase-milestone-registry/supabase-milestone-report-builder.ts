import { existsSync, readFileSync } from 'node:fs'
import { buildSupabaseMilestoneBackfillPlan } from './supabase-milestone-backfill-plan'
import { buildSupabaseMilestoneRegistryCommandPlan, buildSupabaseMilestoneRegistryIamPlan } from './supabase-milestone-command-plan'
import { supabaseMilestoneRegistryConfig, supabaseMilestoneRegistrySafetyFlags } from './supabase-milestone-registry-policy'
import { buildSupabaseMilestoneRegistryQaSummary } from './supabase-milestone-qa-summary'
import { buildSupabaseMilestoneSchemaMetadata } from './supabase-milestone-schema-metadata'
import { buildNotAttemptedWriteVerification, validateSupabaseMilestoneBundle } from './supabase-milestone-writer'
import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneRegistryExecutionReport,
  SupabaseMilestoneRegistryReport,
  SupabaseRegistryMigrationSummary,
  SupabaseRegistrySchemaVerification,
} from './supabase-milestone-registry-types'

export const SUPABASE_MILESTONE_REGISTRY_LOCAL_REPORT_PATH = 'activation-logs/supabase-milestone-registry/phase51b/job-execution/phase51b-report.json'

export function buildSupabaseMilestoneRegistryReport(): SupabaseMilestoneRegistryReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const schemaMetadata = buildSupabaseMilestoneSchemaMetadata()
  const schemaVerification = buildPlannedSchemaVerification()
  const migrationSummary = buildPlannedMigrationSummary()
  const milestoneBundle = buildPhase51BMilestoneBundle({ runId: 'phase51b-planned', status: 'planned', qaStatus: 'warning', readinessStatus: 'schema_planned_write_not_executed' })
  const backfillPlan = buildSupabaseMilestoneBackfillPlan()
  const commandPlan = buildSupabaseMilestoneRegistryCommandPlan()
  const iamPlan = buildSupabaseMilestoneRegistryIamPlan()
  const writeVerification = buildNotAttemptedWriteVerification()
  const bundleValidation = validateSupabaseMilestoneBundle(milestoneBundle)
  const qa = buildSupabaseMilestoneRegistryQaSummary({
    phase51aEvidencePresent: detectPhase51AEvidence(),
    schemaMetadata,
    migrationSummary,
    schemaVerification,
    bundle: milestoneBundle,
    bundleValidation,
    writeVerification,
    backfillPlan,
    commandPlan,
    iamPlan,
    docsPresent: true,
    scriptsPresent: true,
  })
  return {
    reportId: 'activation-phase-51b-supabase-milestone-registry',
    createdAt: new Date().toISOString(),
    phase: '51B',
    status: 'planned',
    config: supabaseMilestoneRegistryConfig,
    schemaMetadata,
    schemaVerification,
    migrationSummary,
    milestoneBundle,
    backfillPlan,
    commandPlan,
    iamPlan,
    qa,
    writeVerification,
    safetyFlags: supabaseMilestoneRegistrySafetyFlags,
    phase51CReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeSupabaseMilestoneRegistryReport(report: SupabaseMilestoneRegistryReport): string {
  return [
    'Phase 51B Supabase activation milestone registry',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Schema tables: ${report.schemaMetadata.tables.map((table) => table.tableName).join(', ')}`,
    `Schema verification: ${report.schemaVerification.status}`,
    `Migration status: ${report.migrationSummary.status}`,
    `Write verification: ${report.writeVerification.status}`,
    `Bundle status: ${report.milestoneBundle.status}`,
    `Backfill candidates: ${report.backfillPlan.candidates.map((candidate) => candidate.phaseId).join(', ')}`,
    `Phase51C readiness: ${report.phase51CReadiness}`,
    'Production/external beta/broad media/public artifacts/signed URL truth/raw prompt execution: blocked',
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Artifacts:',
    ...(report.executionReport?.artifacts.length ? report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`) : ['- none recorded locally yet']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function buildPhase51BMilestoneBundle(input: {
  runId: string
  status: SupabaseMilestoneBundle['status']
  qaStatus: SupabaseMilestoneBundle['qaStatus']
  readinessStatus: string
  commitSha?: string | null
  prNumber?: number | null
  prUrl?: string | null
  artifactPrefix?: string
  blockers?: string[]
  warnings?: string[]
}): SupabaseMilestoneBundle {
  const artifactPrefix = input.artifactPrefix ?? `${supabaseMilestoneRegistryConfig.artifactPrefixBase}/${input.runId}`
  const artifact = (artifactId: string, artifactType: string, objectPath: string) => ({
    artifactId,
    artifactType,
    gcsUri: `gs://${supabaseMilestoneRegistryConfig.generatedAssetsBucket}/${artifactPrefix}/${objectPath}`,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '51B', runId: input.runId },
  })
  const qaArtifact = (artifactId: string, artifactType: string, objectPath: string) => ({
    artifactId,
    artifactType,
    gcsUri: `gs://${supabaseMilestoneRegistryConfig.qaBucket}/${artifactPrefix}/${objectPath}`,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '51B', runId: input.runId },
  })
  const featureGate = (gateKey: string, gateName: string) => ({
    gateKey,
    gateName,
    gateStatus: 'disabled' as const,
    enabled: false as const,
    productionAllowed: false as const,
    externalBetaAllowed: false as const,
    paidProductionAllowed: false as const,
    broadMediaAllowed: false as const,
    evidence: { phase51B: 'disabled_by_policy' },
  })

  return {
    phaseId: '51B',
    phaseName: 'Supabase activation milestone registry',
    runId: input.runId,
    status: input.status,
    track: 'activation',
    subsystem: 'supabase',
    branch: 'codex/rp-activation-51b-supabase-activation-milestone-registry',
    prNumber: input.prNumber ?? null,
    prUrl: input.prUrl ?? null,
    baseBranch: supabaseMilestoneRegistryConfig.baseBranch,
    commitSha: input.commitSha ?? null,
    qaStatus: input.qaStatus,
    readinessStatus: input.readinessStatus,
    completedAt: input.status === 'completed' || input.status === 'partial' ? new Date().toISOString() : null,
    artifacts: [
      artifact('activation_milestone_schema', 'schema_metadata', 'schema/activation-milestone-schema.json'),
      artifact('activation_milestone_migration_summary', 'migration_summary', 'migration/activation-milestone-migration-summary.json'),
      artifact('phase51b_milestone_bundle', 'milestone_bundle', 'bundle/phase51b-milestone-bundle.json'),
      artifact('activation_milestone_backfill_plan', 'backfill_plan', 'backfill/activation-milestone-backfill-plan.json'),
      qaArtifact('supabase_milestone_registry_qa', 'qa_summary', 'qa/supabase-milestone-registry-qa.json'),
      qaArtifact('phase51b_report', 'phase_report', 'reports/phase51b-report.json'),
    ],
    qaGates: [
      { gateId: 'schema_metadata', status: 'passed', summary: 'Six registry tables and service-role-only RLS expectations are defined.', mandatory: true },
      { gateId: 'migration_safety', status: 'passed', summary: 'Migration is idempotent and guarded by local psql confirmation.', mandatory: true },
      { gateId: 'writer_validation', status: 'passed', summary: 'Writer rejects public artifacts, signed URL truth, secret-looking values, and feature unlocks.', mandatory: true },
      { gateId: 'blocked_features', status: 'passed', summary: 'Production, external beta, paid production, broad media, public artifacts, providers, and raw prompt execution remain blocked.', mandatory: true },
    ],
    readinessSnapshots: [
      {
        subsystem: 'supabase',
        readinessKey: 'activation_milestone_registry',
        readinessStatus: input.readinessStatus,
        scope: 'activation_readiness_ledger_only_gcs_remains_private_artifact_store',
        evidence: { phase51A: 'phase51a-20260604T204225', phase51B: input.runId },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'supabase_activation_registry',
        displayName: 'Supabase Activation Milestone Registry',
        track: 'activation',
        subsystem: 'supabase',
        readinessState: input.readinessStatus,
        runtimeAllowed: input.status === 'completed',
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase51B: input.runId, gcsRemainsArtifactStore: true },
      },
    ],
    featureGateUpdates: [
      featureGate('production_ready', 'Production ready'),
      featureGate('external_beta_ready', 'External beta ready'),
      featureGate('paid_production_ready', 'Paid production ready'),
      featureGate('broad_media_ready', 'Broad media ready'),
      featureGate('public_artifacts_allowed', 'Public artifacts allowed'),
      featureGate('signed_url_source_of_truth_allowed', 'Signed URL source of truth allowed'),
      featureGate('raw_prompt_execution_allowed', 'Raw prompt execution allowed'),
      featureGate('provider_execution_allowed', 'Provider execution allowed'),
      featureGate('service_role_frontend_exposure_allowed', 'Service role frontend exposure allowed'),
    ],
    summary: 'Phase 51B defines Supabase as the structured activation/readiness ledger while GCS remains the private artifact store.',
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? [],
  }
}

export function buildPlannedSchemaVerification(): SupabaseRegistrySchemaVerification {
  return {
    status: 'not_attempted',
    tables: [],
    allTablesPresent: false,
    serviceRoleRestUsed: false,
    ddlUsedThroughRest: false,
    blockers: [],
    warnings: ['Static report mode does not inspect remote Supabase registry tables.'],
  }
}

export function buildPlannedMigrationSummary(): SupabaseRegistryMigrationSummary {
  return {
    migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
    applyRequested: false,
    applyConfirmationPresent: false,
    dbUrlResolved: false,
    dbUrlSource: 'unavailable',
    status: 'not_requested',
    psqlAvailable: false,
    destructiveStatementsDetected: false,
    ddlViaSupabaseRestAttempted: false,
    blockers: [],
    warnings: ['Static report mode does not apply migrations.'],
  }
}

export function detectPhase51AEvidence(): boolean {
  if (!existsSync('docs/activation-phase-51a-supabase-data-plane-audit-results.md')) return false
  const text = readFileSync('docs/activation-phase-51a-supabase-data-plane-audit-results.md', 'utf8')
  return text.includes('phase51a-20260604T204225') && text.includes('Phase51B readiness')
}

function executionToReport(executionReport: SupabaseMilestoneRegistryExecutionReport): SupabaseMilestoneRegistryReport {
  return {
    reportId: 'activation-phase-51b-supabase-milestone-registry',
    createdAt: new Date().toISOString(),
    phase: '51B',
    status: executionReport.ok ? 'completed' : executionReport.writeVerification.status === 'not_attempted' ? 'partial' : 'blocked',
    config: supabaseMilestoneRegistryConfig,
    executionReport,
    schemaMetadata: executionReport.schemaMetadata,
    schemaVerification: executionReport.schemaVerification,
    migrationSummary: executionReport.migrationSummary,
    milestoneBundle: executionReport.milestoneBundle,
    backfillPlan: executionReport.backfillPlan,
    commandPlan: executionReport.commandPlan,
    iamPlan: executionReport.iamPlan,
    qa: executionReport.qa,
    writeVerification: executionReport.writeVerification,
    safetyFlags: executionReport.safetyFlags,
    phase51CReadiness: executionReport.phase51CReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

function readLocalExecutionReport(): SupabaseMilestoneRegistryExecutionReport | undefined {
  if (!existsSync(SUPABASE_MILESTONE_REGISTRY_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(SUPABASE_MILESTONE_REGISTRY_LOCAL_REPORT_PATH, 'utf8')) as SupabaseMilestoneRegistryExecutionReport
  } catch {
    return undefined
  }
}
