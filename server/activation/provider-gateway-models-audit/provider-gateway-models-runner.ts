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
import { writeProviderModelsAuditLocalArtifact } from './provider-gateway-models-artifacts'
import { buildProviderModelsAuditCommandPlan } from './provider-gateway-models-command-plan'
import { buildProviderModelsAuditIamPlan } from './provider-gateway-models-iam-plan'
import {
  makeProviderModelsAuditRunId,
  providerModelsAuditArtifactPrefix,
  providerModelsAuditConfig,
  validateProviderModelsAuditExecutionEnv,
} from './provider-gateway-models-audit-policy'
import { buildProviderModelsAuditQaSummary } from './provider-gateway-models-qa-summary'
import {
  buildProviderModelsAuditManifest,
  PROVIDER_MODELS_AUDIT_LOCAL_REPORT_PATH,
  readProviderModelsAuditDocsPresent,
  readProviderModelsAuditPackageScripts,
} from './provider-gateway-models-report-builder'
import {
  buildNotAttemptedProvider0SyncResult,
  buildProvider0SupabaseMilestoneBundle,
  buildProvider0SupabaseSyncInput,
  readbackProvider0Milestone,
} from './provider-gateway-models-supabase-sync'
import { buildProviderOfficialEvidence } from './provider-official-evidence'
import type {
  ProviderModelsAuditArtifact,
  ProviderModelsAuditExecutionReport,
  ProviderModelsAuditRunnerInput,
  ProviderModelsAuditSupabaseSyncResult,
} from './provider-gateway-models-audit-types'

const execFile = promisify(execFileCallback)

export async function runProviderModelsAudit(input: ProviderModelsAuditRunnerInput) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_PROVIDER_GATEWAY_MODELS_AUDIT=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run PROVIDER-0.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateProviderModelsAuditExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PROVIDER0_RUN_ID ?? makeProviderModelsAuditRunId()
  const createdAt = new Date().toISOString()
  const artifactPrefix = providerModelsAuditArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-provider0-provider-gateway-models-audit-${runId}`)
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

  const evidence = buildProviderOfficialEvidence()
  const repoAudit = buildProviderGatewayRepoAudit()
  const modelDecisions = buildProviderModelDecisions()
  const secretPolicy = buildProviderSecretPolicy()
  const dataPolicy = buildProviderDataPolicy()
  const costPolicy = buildProviderCostPolicy()
  const executionPolicy = buildProviderExecutionPolicy()
  const phaseRoadmap = buildProviderPhaseRoadmap(repoAudit.blockers.length === 0)
  const answers = buildProviderQuestionAnswers()
  blockers.push(...repoAudit.blockers)
  warnings.push(...repoAudit.warnings)

  const optimisticSync = buildNotAttemptedProvider0SyncResult({ schemaPresent: schemaVerification.allTablesPresent })
  const optimisticQa = buildProviderModelsAuditQaSummary({
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
    supabaseSyncResult: { ...optimisticSync, status: 'completed' },
    executionMode: true,
  })
  const syncInput = buildProvider0SupabaseSyncInput(runId, optimisticQa)
  const milestoneBundle = buildProvider0SupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: ProviderModelsAuditSupabaseSyncResult = buildNotAttemptedProvider0SyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, milestoneBundle)
    supabaseSyncResult = await readbackProvider0Milestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

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
    supabaseSyncResult,
    executionMode: true,
  })
  const provider1Ready = qa.status === 'passed' && supabaseSyncResult.status === 'completed'
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
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    provider1Ready,
  })
  const status = provider1Ready ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const artifacts: ProviderModelsAuditArtifact[] = []
  const executionReport: ProviderModelsAuditExecutionReport = {
    ok: status === 'completed',
    phase: 'PROVIDER-0',
    runId,
    createdAt,
    status,
    evidence,
    repoAudit,
    modelDecisions,
    secretPolicy,
    dataPolicy,
    costPolicy,
    executionPolicy,
    phaseRoadmap: { ...phaseRoadmap, provider1Readiness: provider1Ready ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked' },
    answers,
    manifest,
    syncInput,
    milestoneBundle,
    schemaVerification,
    supabaseSyncResult,
    commandPlan: buildProviderModelsAuditCommandPlan(),
    iamPlan: buildProviderModelsAuditIamPlan(runId),
    qa,
    artifacts,
    provider1Readiness: provider1Ready ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked',
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
    executionReport.provider1Readiness = 'blocked'
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(PROVIDER_MODELS_AUDIT_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(PROVIDER_MODELS_AUDIT_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: PROVIDER_MODELS_AUDIT_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: PROVIDER-0 IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: ProviderModelsAuditExecutionReport, artifacts: ProviderModelsAuditArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, artifactId: string, artifactType: string) => {
    try {
      const { localPath, artifact } = await writeProviderModelsAuditLocalArtifact({ localRoot, bucket, object: objectPath, value, artifactId, artifactType })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${artifactId}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/audit/provider-gateway-repo-audit.json`, report.repoAudit, 'provider0_repo_audit', 'repo_audit')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/provider-model-official-evidence.json`, report.evidence, 'provider0_official_evidence', 'official_provider_evidence')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/decisions/provider-model-decisions.json`, report.modelDecisions, 'provider0_model_decisions', 'model_decisions')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/policy/provider-data-policy.json`, report.dataPolicy, 'provider0_data_policy', 'data_policy')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/policy/provider-cost-policy.json`, report.costPolicy, 'provider0_cost_policy', 'cost_policy')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/policy/provider-secret-policy.json`, report.secretPolicy, 'provider0_secret_policy', 'provider_secret_policy')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/roadmap/provider-phase-roadmap.json`, report.phaseRoadmap, 'provider0_phase_roadmap', 'phase_roadmap')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/answers/provider0-questions-answers.json`, report.answers, 'provider0_answers', 'question_answers')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/provider-gateway-models-audit-manifest.json`, report.manifest, 'provider0_manifest', 'audit_manifest')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/provider0-milestone-sync-input.json`, report.syncInput, 'provider0_sync_input', 'milestone_sync_input')
  await upload(providerModelsAuditConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/provider0-milestone-sync-result.json`, report.supabaseSyncResult, 'provider0_sync_result', 'milestone_sync_result')
  await upload(providerModelsAuditConfig.qaBucket, `${artifactPrefix}/qa/provider-gateway-models-audit-qa.json`, report.qa, 'provider0_qa', 'qa')
  report.artifacts = artifacts
  await upload(providerModelsAuditConfig.qaBucket, `${artifactPrefix}/reports/provider0-report.json`, report, 'provider0_report', 'report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', providerModelsAuditConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [providerModelsAuditConfig.generatedAssetsBucket, providerModelsAuditConfig.qaBucket]) {
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
