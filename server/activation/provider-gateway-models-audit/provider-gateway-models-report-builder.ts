import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { validateActivationMilestoneSyncBundle, validateActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { buildProviderGatewayRepoAudit } from './provider-gateway-repo-audit'
import {
  buildProviderCostPolicy,
  buildProviderDataPolicy,
  buildProviderExecutionPolicy,
  buildProviderModelDecisions,
  buildProviderPhaseRoadmap,
  buildProviderQuestionAnswers,
  buildProviderSecretPolicy,
} from './provider-gateway-models-policies'
import { buildProviderModelsAuditCommandPlan } from './provider-gateway-models-command-plan'
import { buildProviderModelsAuditIamPlan } from './provider-gateway-models-iam-plan'
import { makeProviderModelsAuditRunId, providerModelsAuditDisabledFeatureGates } from './provider-gateway-models-audit-policy'
import { buildProviderModelsAuditQaSummary } from './provider-gateway-models-qa-summary'
import {
  buildNotAttemptedProvider0SyncResult,
  buildProvider0SupabaseMilestoneBundle,
  buildProvider0SupabaseSyncInput,
} from './provider-gateway-models-supabase-sync'
import { buildProviderOfficialEvidence } from './provider-official-evidence'
import type {
  ProviderModelsAuditExecutionReport,
  ProviderModelsAuditManifest,
  ProviderModelsAuditReport,
} from './provider-gateway-models-audit-types'

export const PROVIDER_MODELS_AUDIT_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'provider-gateway-models-audit',
  'provider0',
  'job-execution',
  'provider0-report.json',
)

export function buildProviderModelsAuditReport(): ProviderModelsAuditReport {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      ...executionReport,
      reportId: 'activation-provider-0-provider-gateway-models-audit',
      executionReport,
    }
  }

  const runId = makeProviderModelsAuditRunId(new Date('2026-06-10T00:00:00Z'))
  const evidence = buildProviderOfficialEvidence()
  const repoAudit = buildProviderGatewayRepoAudit()
  const modelDecisions = buildProviderModelDecisions()
  const secretPolicy = buildProviderSecretPolicy()
  const dataPolicy = buildProviderDataPolicy()
  const costPolicy = buildProviderCostPolicy()
  const executionPolicy = buildProviderExecutionPolicy()
  const phaseRoadmap = buildProviderPhaseRoadmap(repoAudit.blockers.length === 0)
  const answers = buildProviderQuestionAnswers()
  const syncResult = buildNotAttemptedProvider0SyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const qa = buildProviderModelsAuditQaSummary({
    packageScripts: readProviderModelsAuditPackageScripts(),
    docsPresent: readProviderModelsAuditDocsPresent(),
    evidence,
    repoAudit,
    modelDecisions,
    secretPolicy,
    dataPolicy,
    costPolicy,
    executionPolicy,
    phaseRoadmap,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  const syncInput = buildProvider0SupabaseSyncInput(runId, qa)
  const milestoneBundle = buildProvider0SupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  const finalSyncResult = buildNotAttemptedProvider0SyncResult({
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers: [...inputValidation.blockers, ...bundleValidation.blockers],
    warnings: [...inputValidation.warnings, ...bundleValidation.warnings, 'Static report does not read Supabase credentials or write the milestone registry.'],
  })
  const provider1Ready = qa.status === 'passed'
  const manifest = buildProviderModelsAuditManifest({
    runId,
    repoAudit,
    evidence,
    modelDecisions,
    secretPolicy,
    dataPolicy,
    costPolicy,
    executionPolicy,
    phaseRoadmap,
    answers,
    warnings: [...repoAudit.warnings, ...finalSyncResult.warnings],
    blockers: [...repoAudit.blockers, ...finalSyncResult.blockers],
    provider1Ready,
  })
  return {
    reportId: 'activation-provider-0-provider-gateway-models-audit',
    createdAt: new Date().toISOString(),
    phase: 'PROVIDER-0',
    runId,
    status: 'planned',
    evidence,
    repoAudit,
    modelDecisions,
    secretPolicy,
    dataPolicy,
    costPolicy,
    executionPolicy,
    phaseRoadmap,
    answers,
    manifest,
    syncInput,
    milestoneBundle,
    supabaseSyncResult: finalSyncResult,
    commandPlan: buildProviderModelsAuditCommandPlan(),
    iamPlan: buildProviderModelsAuditIamPlan(),
    qa,
    artifacts: [],
    provider1Readiness: provider1Ready ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function buildProviderModelsAuditManifest(input: {
  runId: string
  repoAudit: ProviderModelsAuditManifest['repoAudit']
  evidence: ProviderModelsAuditManifest['evidence']
  modelDecisions: ProviderModelsAuditManifest['modelDecisions']
  secretPolicy: ProviderModelsAuditManifest['secretPolicy']
  dataPolicy: ProviderModelsAuditManifest['dataPolicy']
  costPolicy: ProviderModelsAuditManifest['costPolicy']
  executionPolicy: ProviderModelsAuditManifest['executionPolicy']
  phaseRoadmap: ProviderModelsAuditManifest['phaseRoadmap']
  answers: ProviderModelsAuditManifest['answers']
  warnings: string[]
  blockers: string[]
  provider1Ready: boolean
}): ProviderModelsAuditManifest {
  return {
    manifestId: 'provider0_provider_gateway_models_audit_manifest',
    runId: input.runId,
    phase: 'PROVIDER-0',
    repoAudit: input.repoAudit,
    evidence: input.evidence,
    modelDecisions: input.modelDecisions,
    secretPolicy: input.secretPolicy,
    dataPolicy: input.dataPolicy,
    costPolicy: input.costPolicy,
    executionPolicy: input.executionPolicy,
    phaseRoadmap: {
      ...input.phaseRoadmap,
      provider1Readiness: input.provider1Ready ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked',
    },
    answers: input.answers,
    supabaseMilestoneRefs: input.provider1Ready ? [`activation_runs/PROVIDER-0/${input.runId}`] : [],
    blockedFeatures: [...providerModelsAuditDisabledFeatureGates],
    warnings: Array.from(new Set(input.warnings)),
    blockers: Array.from(new Set(input.blockers)),
    provider1Readiness: input.provider1Ready ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked',
  }
}

export function summarizeProviderModelsAuditReport(report: ProviderModelsAuditReport): string {
  const lines = [
    'PROVIDER-0 provider gateway models audit',
    `Status: ${report.status}`,
    `Official evidence entries: ${report.evidence.length}`,
    `Model decisions: ${report.modelDecisions.map((model) => `${model.internalModelName}=${model.providerModelId}`).join(', ')}`,
    `Repo audit provider calls blocked: ${report.repoAudit.realProviderCallsBlocked}`,
    `QA: ${report.qa.status}`,
    `PROVIDER-1 readiness: ${report.provider1Readiness}`,
    `Supabase milestone sync: ${report.supabaseSyncResult.status}`,
  ]
  if (report.executionReport) {
    lines.push(`Run ID: ${report.executionReport.runId}`)
    lines.push(`Artifacts: ${report.executionReport.artifacts.length}`)
  }
  if (report.blockers.length) lines.push(`Report blockers: ${report.blockers.join('; ')}`)
  if (report.warnings.length) lines.push(`Warnings: ${report.warnings.join('; ')}`)
  return lines.join('\n')
}

export function readProviderModelsAuditPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

export function readProviderModelsAuditDocsPresent(): Record<string, boolean> {
  return {
    'docs/provider-gateway/provider-gateway-models-audit-runbook.md': existsSync('docs/provider-gateway/provider-gateway-models-audit-runbook.md'),
    'docs/provider-gateway/provider-gateway-models-audit-policy.md': existsSync('docs/provider-gateway/provider-gateway-models-audit-policy.md'),
    'docs/provider-gateway/provider-gateway-models-audit-qa-policy.md': existsSync('docs/provider-gateway/provider-gateway-models-audit-qa-policy.md'),
    'docs/provider-gateway/provider-gateway-models-audit-evidence.md': existsSync('docs/provider-gateway/provider-gateway-models-audit-evidence.md'),
    'docs/activation-phase-provider-0-provider-gateway-models-audit-results.md': existsSync('docs/activation-phase-provider-0-provider-gateway-models-audit-results.md'),
  }
}

function readLatestExecutionReport(): ProviderModelsAuditExecutionReport | null {
  try {
    if (!existsSync(PROVIDER_MODELS_AUDIT_LOCAL_REPORT_PATH)) return null
    return JSON.parse(readFileSync(PROVIDER_MODELS_AUDIT_LOCAL_REPORT_PATH, 'utf8')) as ProviderModelsAuditExecutionReport
  } catch {
    return null
  }
}
