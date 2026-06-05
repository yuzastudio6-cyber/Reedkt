import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { buildApprovedPlanValidationCommandPlan } from './approved-plan-validation-command-plan'
import { resolveApprovedPlanEvidenceContext } from './approved-plan-evidence-resolver'
import { validateApprovedPlanFeatureGates } from './approved-plan-feature-gate-validator'
import { buildApprovedPlanValidationIamPlan } from './approved-plan-validation-iam-plan'
import { buildApprovedPlanValidationManifest } from './approved-plan-validation-manifest-builder'
import { makeApprovedPlanValidationRunId } from './approved-plan-validation-policy'
import { buildApprovedPlanValidationQaSummary } from './approved-plan-validation-qa-summary'
import { buildApprovedPlanSourceAudit } from './approved-plan-source-audit'
import { buildMissingContractInventory } from './missing-contract-inventory'
import { validateApprovedPlanOwnership } from './approved-plan-ownership-validator'
import { validateApprovedPlanRuntimeBlocks } from './approved-plan-runtime-block-validator'
import { validateBlockedPlanSchemas, validateCandidateApprovedPlanSchemas } from './approved-plan-schema-validator'
import { buildNotAttemptedPhase52ESyncResult, buildPhase52ESupabaseMilestoneBundle, buildPhase52ESupabaseSyncInput } from './approved-plan-validation-supabase-sync'
import { buildSystemReconciliationSummary } from './system-reconciliation-builder'
import { buildValidatedHandoffPackets } from './validated-handoff-builder'
import type { ApprovedPlanValidationExecutionReport, ApprovedPlanValidationReport } from './approved-plan-validation-types'

export const APPROVED_PLAN_VALIDATION_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'approved-plan-snapshot-validation',
  'phase52e',
  'job-execution',
  'phase52e-report.json',
)

export async function buildApprovedPlanValidationReport(): Promise<ApprovedPlanValidationReport> {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      reportId: 'activation-phase-52e-approved-plan-snapshot-validation',
      createdAt: new Date().toISOString(),
      phase: '52E',
      status: executionReport.status,
      repoOwnershipAudit: executionReport.repoOwnershipAudit,
      evidenceContext: executionReport.evidenceContext,
      candidatePlans: executionReport.candidatePlans,
      blockedPlans: executionReport.blockedPlans,
      candidateSchemaValidation: executionReport.candidateSchemaValidation,
      blockedPlanValidation: executionReport.blockedPlanValidation,
      ownershipValidation: executionReport.ownershipValidation,
      runtimeBlockValidation: executionReport.runtimeBlockValidation,
      featureGateValidation: executionReport.featureGateValidation,
      systemReconciliation: executionReport.systemReconciliation,
      missingContractInventory: executionReport.missingContractInventory,
      validatedHandoffs: executionReport.validatedHandoffs,
      manifest: executionReport.manifest,
      qa: executionReport.qa,
      commandPlan: executionReport.commandPlan,
      iamPlan: executionReport.iamPlan,
      executionReport,
      phase52FReadiness: executionReport.phase52FReadiness,
      blockers: executionReport.blockers,
      warnings: executionReport.warnings,
    }
  }

  const runId = makeApprovedPlanValidationRunId(new Date('2026-06-05T00:00:00Z'))
  const repoOwnershipAudit = buildApprovedPlanSourceAudit(new Date('2026-06-05T00:00:00.000Z'))
  const evidenceContext = await resolveApprovedPlanEvidenceContext({ preferPrivateGcs: false })
  const candidateSchemaValidation = validateCandidateApprovedPlanSchemas(evidenceContext.candidatePlans)
  const blockedPlanValidation = validateBlockedPlanSchemas(evidenceContext.blockedPlans)
  const ownershipValidation = validateApprovedPlanOwnership({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
  const runtimeBlockValidation = validateApprovedPlanRuntimeBlocks({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
  const featureGateValidation = validateApprovedPlanFeatureGates({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
  const missingContractInventory = buildMissingContractInventory(repoOwnershipAudit)
  const systemReconciliation = buildSystemReconciliationSummary({
    evidenceContext,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    missingContractInventory,
  })
  const validatedHandoffs = buildValidatedHandoffPackets({ runId, sourceHandoffs: evidenceContext.handoffPackets, missingContractInventory })
  const syncResult = buildNotAttemptedPhase52ESyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const manifestBeforeQa = buildApprovedPlanValidationManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    supabaseSyncResult: syncResult,
  })
  const qa = buildApprovedPlanValidationQaSummary({
    packageScripts: readApprovedPlanValidationPackageScripts(),
    docsPresent: readApprovedPlanValidationDocsPresent(),
    repoOwnershipAudit,
    evidenceContext,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    manifest: manifestBeforeQa,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  const manifest = buildApprovedPlanValidationManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    qa,
    supabaseSyncResult: syncResult,
  })
  const syncInput = buildPhase52ESupabaseSyncInput(runId, qa)
  buildPhase52ESupabaseMilestoneBundle(syncInput)

  return {
    reportId: 'activation-phase-52e-approved-plan-snapshot-validation',
    createdAt: new Date().toISOString(),
    phase: '52E',
    status: 'planned',
    repoOwnershipAudit,
    evidenceContext,
    candidatePlans: evidenceContext.candidatePlans,
    blockedPlans: evidenceContext.blockedPlans,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    manifest,
    qa,
    commandPlan: buildApprovedPlanValidationCommandPlan(),
    iamPlan: buildApprovedPlanValidationIamPlan(),
    phase52FReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeApprovedPlanValidationReport(report: ApprovedPlanValidationReport): string {
  const lines = [
    `Phase ${report.phase} approved-plan snapshot validation`,
    `Status: ${report.status}`,
    `Candidate plans validated: ${report.candidatePlans.length}`,
    `Blocked/handoff records validated: ${report.blockedPlans.length}`,
    `Validated handoffs: ${report.validatedHandoffs.length}`,
    `QA: ${report.qa.status}`,
    `Phase52F readiness: ${report.phase52FReadiness}`,
  ]
  if (report.executionReport) {
    lines.push(`Run ID: ${report.executionReport.runId}`)
    lines.push(`Supabase sync: ${report.executionReport.supabaseSyncResult.status}`)
    lines.push(`Artifacts: ${report.executionReport.artifacts.length}`)
  }
  if (report.blockers.length) lines.push(`Blockers: ${report.blockers.join('; ')}`)
  if (report.warnings.length) lines.push(`Warnings: ${report.warnings.join('; ')}`)
  return lines.join('\n')
}

export function readApprovedPlanValidationPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

export function readApprovedPlanValidationDocsPresent(): Record<string, boolean> {
  return {
    'docs/agents/approved-plan-snapshot-validation-runbook.md': existsSync('docs/agents/approved-plan-snapshot-validation-runbook.md'),
    'docs/agents/approved-plan-snapshot-validation-policy.md': existsSync('docs/agents/approved-plan-snapshot-validation-policy.md'),
    'docs/agents/approved-plan-snapshot-validation-qa-policy.md': existsSync('docs/agents/approved-plan-snapshot-validation-qa-policy.md'),
    'docs/activation-phase-52e-approved-plan-snapshot-validation-results.md': existsSync('docs/activation-phase-52e-approved-plan-snapshot-validation-results.md'),
  }
}

function readLatestExecutionReport(): ApprovedPlanValidationExecutionReport | null {
  try {
    if (!existsSync(APPROVED_PLAN_VALIDATION_LOCAL_REPORT_PATH)) return null
    return JSON.parse(readFileSync(APPROVED_PLAN_VALIDATION_LOCAL_REPORT_PATH, 'utf8')) as ApprovedPlanValidationExecutionReport
  } catch {
    return null
  }
}
