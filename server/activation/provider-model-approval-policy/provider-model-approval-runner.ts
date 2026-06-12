import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  createSupabaseMilestoneServiceClient,
  inspectSupabaseMilestoneRegistryTables,
  resolveSupabaseMilestoneCredentials,
  writeMilestoneBundle,
} from '../supabase-milestone-registry'
import { validateActivationMilestoneSyncBundle, validateActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { buildDeepSeekRoleApprovals, buildDeepSeekV4ApprovalEvidence } from './deepseek-v4-approval-evidence'
import { buildProviderCostPolicy } from './provider-cost-policy'
import { buildProviderDataPolicy } from './provider-data-policy'
import { writeProviderModelApprovalLocalArtifact } from './provider-model-approval-artifacts'
import { buildProviderModelApprovalCommandPlan } from './provider-model-approval-command-plan'
import { buildProviderModelApprovalIamPlan } from './provider-model-approval-iam-plan'
import {
  makeProviderModelApprovalRunId,
  providerModelApprovalArtifactPrefix,
  providerModelApprovalConfig,
  validateProviderModelApprovalExecutionEnv,
} from './provider-model-approval-policy'
import { buildProviderModelApprovalQaSummary } from './provider-model-approval-qa-summary'
import {
  buildProviderModelApprovalManifest,
  PROVIDER_MODEL_APPROVAL_LOCAL_REPORT_PATH,
  readProviderModelApprovalDocsPresent,
  readProviderModelApprovalPackageScripts,
} from './provider-model-approval-report-builder'
import {
  buildNotAttemptedProvider1SyncResult,
  buildProvider1SupabaseMilestoneBundle,
  buildProvider1SupabaseSyncInput,
  readbackProvider1Milestone,
} from './provider-model-approval-supabase-sync'
import { buildProviderNextPhasePlan } from './provider-next-phase-plan'
import { buildProviderRiskRegister } from './provider-risk-register'
import { buildProviderOwnershipCheck, buildProviderRoutingPolicy } from './provider-routing-policy'
import { buildProviderSecretPolicy } from './provider-secret-policy'
import { buildProviderStoragePolicy } from './provider-storage-policy'
import { buildQwen37MaxApprovalEvidence, buildQwenRoleApprovals } from './qwen37-max-approval-evidence'
import type {
  ProviderModelApprovalArtifact,
  ProviderModelApprovalExecutionReport,
  ProviderModelApprovalRunnerInput,
  ProviderModelApprovalSupabaseSyncResult,
} from './provider-model-approval-types'

const execFile = promisify(execFileCallback)

export async function runProviderModelApproval(input: ProviderModelApprovalRunnerInput) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_PROVIDER_MODEL_APPROVAL_POLICY=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run PROVIDER-1.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateProviderModelApprovalExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PROVIDER1_RUN_ID ?? makeProviderModelApprovalRunId()
  const createdAt = new Date().toISOString()
  const artifactPrefix = providerModelApprovalArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-provider1-model-approval-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const blockers: string[] = []
  const warnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) blockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(blockers)
  await verifyBuckets(blockers)

  const credentialResolution = await resolveSupabaseMilestoneCredentials()
  warnings.push(...credentialResolution.warnings)
  blockers.push(...credentialResolution.blockers)
  const client = credentialResolution.configured ? createSupabaseMilestoneServiceClient(credentialResolution) : undefined
  const schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
  blockers.push(...schemaVerification.blockers)

  const evidence = [...buildDeepSeekV4ApprovalEvidence(), ...buildQwen37MaxApprovalEvidence()]
  const roleApprovals = [...buildDeepSeekRoleApprovals(), ...buildQwenRoleApprovals()]
  const secretPolicy = buildProviderSecretPolicy()
  const dataPolicy = buildProviderDataPolicy()
  const costPolicy = buildProviderCostPolicy()
  const routingPolicy = buildProviderRoutingPolicy()
  const storagePolicy = buildProviderStoragePolicy()
  const riskRegister = buildProviderRiskRegister()
  const nextPhasePlan = buildProviderNextPhasePlan(true)
  const crossChatOwnershipCheck = buildProviderOwnershipCheck()

  const optimisticSync = buildNotAttemptedProvider1SyncResult({ schemaPresent: schemaVerification.allTablesPresent })
  const optimisticQa = buildProviderModelApprovalQaSummary({
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
    supabaseSyncResult: { ...optimisticSync, status: 'completed' },
    executionMode: true,
  })
  const syncInput = buildProvider1SupabaseSyncInput(runId, optimisticQa)
  const milestoneBundle = buildProvider1SupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: ProviderModelApprovalSupabaseSyncResult = buildNotAttemptedProvider1SyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, milestoneBundle)
    supabaseSyncResult = await readbackProvider1Milestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

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
    supabaseSyncResult,
    executionMode: true,
  })
  const provider2Ready = qa.status === 'passed' && supabaseSyncResult.status === 'completed'
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
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    provider2Ready,
  })
  const status = provider2Ready ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const artifacts: ProviderModelApprovalArtifact[] = []
  const executionReport: ProviderModelApprovalExecutionReport = {
    ok: status === 'completed',
    phase: 'PROVIDER-1',
    runId,
    createdAt,
    status,
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
    schemaVerification,
    supabaseSyncResult,
    commandPlan: buildProviderModelApprovalCommandPlan(),
    iamPlan: buildProviderModelApprovalIamPlan(runId),
    qa,
    artifacts,
    provider2Readiness: provider2Ready ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked',
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.ok = false
    executionReport.status = executionReport.supabaseSyncResult.status === 'completed' ? 'partial' : 'blocked'
    executionReport.provider2Readiness = 'blocked'
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(PROVIDER_MODEL_APPROVAL_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(PROVIDER_MODEL_APPROVAL_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: PROVIDER_MODEL_APPROVAL_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: PROVIDER-1 IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: ProviderModelApprovalExecutionReport, artifacts: ProviderModelApprovalArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, artifactId: string, artifactType: string) => {
    try {
      const { localPath, artifact } = await writeProviderModelApprovalLocalArtifact({ localRoot, bucket, object: objectPath, value, artifactId, artifactType })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${artifactId}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  const deepSeekEvidence = report.evidence.filter((entry) => entry.provider === 'deepseek')
  const qwenEvidence = report.evidence.filter((entry) => entry.provider === 'qwen')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/audit/repo-ownership-audit.json`, report.crossChatOwnershipCheck, 'provider1_repo_ownership_audit', 'repo_ownership_audit')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/deepseek-v4-approval-evidence.json`, deepSeekEvidence, 'provider1_deepseek_evidence', 'deepseek_approval_evidence')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/qwen37-max-approval-evidence.json`, qwenEvidence, 'provider1_qwen_evidence', 'qwen_approval_evidence')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/policy/provider-secret-policy.json`, report.secretPolicy, 'provider1_secret_policy', 'provider_secret_policy')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/policy/provider-data-policy.json`, report.dataPolicy, 'provider1_data_policy', 'provider_data_policy')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/policy/provider-cost-policy.json`, report.costPolicy, 'provider1_cost_policy', 'provider_cost_policy')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/policy/provider-routing-policy.json`, report.routingPolicy, 'provider1_routing_policy', 'provider_routing_policy')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/policy/provider-storage-policy.json`, report.storagePolicy, 'provider1_storage_policy', 'provider_storage_policy')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/risk/provider-risk-register.json`, report.riskRegister, 'provider1_risk_register', 'provider_risk_register')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/roadmap/provider-next-phase-plan.json`, report.nextPhasePlan, 'provider1_next_phase_plan', 'provider_next_phase_plan')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/provider-model-approval-manifest.json`, report.manifest, 'provider1_manifest', 'approval_manifest')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/provider1-milestone-sync-input.json`, report.syncInput, 'provider1_sync_input', 'milestone_sync_input')
  await upload(providerModelApprovalConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/provider1-milestone-sync-result.json`, report.supabaseSyncResult, 'provider1_sync_result', 'milestone_sync_result')
  await upload(providerModelApprovalConfig.qaBucket, `${artifactPrefix}/qa/provider-model-approval-policy-qa.json`, report.qa, 'provider1_qa', 'qa')
  report.artifacts = artifacts
  await upload(providerModelApprovalConfig.qaBucket, `${artifactPrefix}/reports/provider1-report.json`, report, 'provider1_report', 'report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', providerModelApprovalConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [providerModelApprovalConfig.generatedAssetsBucket, providerModelApprovalConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
  }
}

async function runGcloud(args: string[]): Promise<void> {
  const { stderr } = await execFile('gcloud', args, { maxBuffer: 1024 * 1024 * 10 })
  if (stderr && /ERROR/i.test(stderr)) throw new Error(stderr)
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; error: string }> {
  try {
    const { stdout } = await execFile('gcloud', args, { maxBuffer: 1024 * 1024 * 10 })
    return { ok: true, stdout }
  } catch (error) {
    return { ok: false, error: sanitizeCommandError(error instanceof Error ? error.message : String(error)) }
  }
}

function sanitizeCommandError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token|SUPABASE_[A-Z_]+|DASHSCOPE|DEEPSEEK)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
