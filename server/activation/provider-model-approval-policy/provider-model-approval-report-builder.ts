import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { validateActivationMilestoneSyncBundle, validateActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { buildDeepSeekRoleApprovals, buildDeepSeekV4ApprovalEvidence } from './deepseek-v4-approval-evidence'
import { buildProviderCostPolicy } from './provider-cost-policy'
import { buildProviderDataPolicy } from './provider-data-policy'
import { buildProviderModelApprovalCommandPlan } from './provider-model-approval-command-plan'
import { buildProviderModelApprovalIamPlan } from './provider-model-approval-iam-plan'
import { makeProviderModelApprovalRunId, providerModelApprovalDisabledFeatureGates } from './provider-model-approval-policy'
import { buildProviderModelApprovalQaSummary } from './provider-model-approval-qa-summary'
import {
  buildNotAttemptedProvider1SyncResult,
  buildProvider1SupabaseMilestoneBundle,
  buildProvider1SupabaseSyncInput,
} from './provider-model-approval-supabase-sync'
import { buildProviderNextPhasePlan } from './provider-next-phase-plan'
import { buildProviderRiskRegister } from './provider-risk-register'
import { buildProviderOwnershipCheck, buildProviderRoutingPolicy } from './provider-routing-policy'
import { buildProviderSecretPolicy } from './provider-secret-policy'
import { buildProviderStoragePolicy } from './provider-storage-policy'
import { buildQwen37MaxApprovalEvidence, buildQwenRoleApprovals } from './qwen37-max-approval-evidence'
import type {
  ProviderModelApprovalExecutionReport,
  ProviderModelApprovalManifest,
  ProviderModelApprovalReport,
} from './provider-model-approval-types'

export const PROVIDER_MODEL_APPROVAL_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'provider-model-approval-policy',
  'provider1',
  'job-execution',
  'provider1-report.json',
)

export function buildProviderModelApprovalReport(): ProviderModelApprovalReport {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      ...executionReport,
      reportId: 'activation-provider-1-deepseek-qwen-api-approval-policy',
      executionReport,
    }
  }

  const runId = makeProviderModelApprovalRunId(new Date('2026-06-12T00:00:00Z'))
  const evidence = [...buildDeepSeekV4ApprovalEvidence(), ...buildQwen37MaxApprovalEvidence()]
  const roleApprovals = [...buildDeepSeekRoleApprovals(), ...buildQwenRoleApprovals()]
  const secretPolicy = buildProviderSecretPolicy()
  const dataPolicy = buildProviderDataPolicy()
  const costPolicy = buildProviderCostPolicy()
  const routingPolicy = buildProviderRoutingPolicy()
  const storagePolicy = buildProviderStoragePolicy()
  const riskRegister = buildProviderRiskRegister()
  const crossChatOwnershipCheck = buildProviderOwnershipCheck()
  const syncResult = buildNotAttemptedProvider1SyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const nextPhasePlan = buildProviderNextPhasePlan(true)
  const qa = buildProviderModelApprovalQaSummary({
    packageScripts: readProviderModelApprovalPackageScripts(),
    docsPresent: readProviderModelApprovalDocsPresent(),
    evidence,
    roleApprovals,
    secretPolicy,
    dataPolicy,
    costPolicy,
    routingPolicy,
    storagePolicy,
    nextPhasePlan,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  const syncInput = buildProvider1SupabaseSyncInput(runId, qa)
  const milestoneBundle = buildProvider1SupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  const finalSyncResult = buildNotAttemptedProvider1SyncResult({
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers: [...inputValidation.blockers, ...bundleValidation.blockers],
    warnings: [...inputValidation.warnings, ...bundleValidation.warnings, 'Static report does not read Supabase credentials or write the milestone registry.'],
  })
  const finalQa = buildProviderModelApprovalQaSummary({
    packageScripts: readProviderModelApprovalPackageScripts(),
    docsPresent: readProviderModelApprovalDocsPresent(),
    evidence,
    roleApprovals,
    secretPolicy,
    dataPolicy,
    costPolicy,
    routingPolicy,
    storagePolicy,
    nextPhasePlan,
    supabaseSyncResult: finalSyncResult,
    executionMode: false,
  })
  const provider2Ready = finalQa.status === 'passed'
  const manifest = buildProviderModelApprovalManifest({
    runId,
    evidence,
    roleApprovals,
    secretPolicy,
    dataPolicy,
    costPolicy,
    routingPolicy,
    storagePolicy,
    riskRegister,
    nextPhasePlan,
    crossChatOwnershipCheck,
    warnings: finalSyncResult.warnings,
    blockers: finalSyncResult.blockers,
    provider2Ready,
  })
  return {
    reportId: 'activation-provider-1-deepseek-qwen-api-approval-policy',
    createdAt: new Date().toISOString(),
    phase: 'PROVIDER-1',
    runId,
    status: 'planned',
    evidence,
    roleApprovals,
    secretPolicy,
    dataPolicy,
    costPolicy,
    routingPolicy,
    storagePolicy,
    riskRegister,
    nextPhasePlan: { ...nextPhasePlan, provider2Readiness: provider2Ready ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked' },
    crossChatOwnershipCheck,
    manifest,
    syncInput,
    milestoneBundle,
    supabaseSyncResult: finalSyncResult,
    commandPlan: buildProviderModelApprovalCommandPlan(),
    iamPlan: buildProviderModelApprovalIamPlan(),
    qa: finalQa,
    artifacts: [],
    provider2Readiness: provider2Ready ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked',
    blockers: finalQa.blockers,
    warnings: finalQa.warnings,
  }
}

export function buildProviderModelApprovalManifest(input: {
  runId: string
  evidence: ProviderModelApprovalManifest['evidence']
  roleApprovals: ProviderModelApprovalManifest['roleApprovals']
  secretPolicy: ProviderModelApprovalManifest['secretPolicy']
  dataPolicy: ProviderModelApprovalManifest['dataPolicy']
  costPolicy: ProviderModelApprovalManifest['costPolicy']
  routingPolicy: ProviderModelApprovalManifest['routingPolicy']
  storagePolicy: ProviderModelApprovalManifest['storagePolicy']
  riskRegister: ProviderModelApprovalManifest['riskRegister']
  nextPhasePlan: ProviderModelApprovalManifest['nextPhasePlan']
  crossChatOwnershipCheck: ProviderModelApprovalManifest['crossChatOwnershipCheck']
  warnings: string[]
  blockers: string[]
  provider2Ready: boolean
}): ProviderModelApprovalManifest {
  return {
    manifestId: 'provider1_provider_model_approval_manifest',
    runId: input.runId,
    phase: 'PROVIDER-1',
    provider0EvidenceBranch: 'codex/rp-provider-0-provider-gateway-models-repo-audit',
    evidence: input.evidence,
    roleApprovals: input.roleApprovals,
    secretPolicy: input.secretPolicy,
    dataPolicy: input.dataPolicy,
    costPolicy: input.costPolicy,
    routingPolicy: input.routingPolicy,
    storagePolicy: input.storagePolicy,
    riskRegister: input.riskRegister,
    nextPhasePlan: {
      ...input.nextPhasePlan,
      provider2Readiness: input.provider2Ready ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked',
    },
    crossChatOwnershipCheck: input.crossChatOwnershipCheck,
    supabaseMilestoneRefs: input.provider2Ready ? [`activation_runs/PROVIDER-1/${input.runId}`] : [],
    blockedFeatures: [...providerModelApprovalDisabledFeatureGates],
    warnings: Array.from(new Set(input.warnings)),
    blockers: Array.from(new Set(input.blockers)),
    provider2Readiness: input.provider2Ready ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked',
  }
}

export function summarizeProviderModelApprovalReport(report: ProviderModelApprovalReport): string {
  const qwen = report.roleApprovals.find((role) => role.roleId === 'qwen_3_7_max_head_planning_agent')
  const deepSeek = report.roleApprovals.filter((role) => role.provider === 'deepseek').flatMap((role) => role.providerModelIds)
  const lines = [
    'PROVIDER-1 DeepSeek/Qwen API approval policy',
    `Status: ${report.status}`,
    `Official evidence entries: ${report.evidence.length}`,
    `DeepSeek models: ${deepSeek.join(', ')}`,
    `Qwen models: ${qwen?.providerModelIds.join(', ') ?? 'none'}`,
    `Provider calls blocked: ${report.costPolicy.providerCallsBlockedByDefault}`,
    `Secret values resolved: ${report.secretPolicy.secretValuesResolvedInProvider1}`,
    `QA: ${report.qa.status}`,
    `PROVIDER-2 readiness: ${report.provider2Readiness}`,
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

export function readProviderModelApprovalPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

export function readProviderModelApprovalDocsPresent(): Record<string, boolean> {
  return {
    'docs/provider-agent-integration/provider-model-approval-policy.md': existsSync('docs/provider-agent-integration/provider-model-approval-policy.md'),
    'docs/provider-agent-integration/deepseek-v4-provider-approval.md': existsSync('docs/provider-agent-integration/deepseek-v4-provider-approval.md'),
    'docs/provider-agent-integration/qwen37-max-provider-approval.md': existsSync('docs/provider-agent-integration/qwen37-max-provider-approval.md'),
    'docs/provider-agent-integration/provider-secret-policy.md': existsSync('docs/provider-agent-integration/provider-secret-policy.md'),
    'docs/provider-agent-integration/provider-data-policy.md': existsSync('docs/provider-agent-integration/provider-data-policy.md'),
    'docs/provider-agent-integration/provider-cost-policy.md': existsSync('docs/provider-agent-integration/provider-cost-policy.md'),
    'docs/provider-agent-integration/provider-routing-policy.md': existsSync('docs/provider-agent-integration/provider-routing-policy.md'),
    'docs/provider-agent-integration/provider-storage-policy.md': existsSync('docs/provider-agent-integration/provider-storage-policy.md'),
    'docs/activation-phase-provider-1-deepseek-qwen-api-approval-policy-results.md': existsSync('docs/activation-phase-provider-1-deepseek-qwen-api-approval-policy-results.md'),
  }
}

function readLatestExecutionReport(): ProviderModelApprovalExecutionReport | null {
  try {
    if (!existsSync(PROVIDER_MODEL_APPROVAL_LOCAL_REPORT_PATH)) return null
    return JSON.parse(readFileSync(PROVIDER_MODEL_APPROVAL_LOCAL_REPORT_PATH, 'utf8')) as ProviderModelApprovalExecutionReport
  } catch {
    return null
  }
}
