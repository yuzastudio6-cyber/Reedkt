import { execFile as execFileCallback } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, stat, writeFile, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { runSupabaseRemoteActivityAudit } from './supabase-activity-audit'
import { buildSupabaseBetaReadinessImpact } from './supabase-beta-readiness-impact'
import { buildSupabaseDataModelGapAnalysis } from './supabase-data-model-gap-analysis'
import { buildSupabaseDataPlaneCommandPlan } from './supabase-data-plane-command-plan'
import {
  makeSupabaseDataPlaneRunId,
  supabaseDataPlaneArtifactPrefix,
  supabaseDataPlaneAuditConfig,
  supabaseDataPlaneSafetyFlags,
  validateSupabaseDataPlaneExecutionEnv,
} from './supabase-data-plane-audit-policy'
import { buildSupabaseDataPlaneQaSummary } from './supabase-data-plane-qa-summary'
import { SUPABASE_DATA_PLANE_LOCAL_REPORT_PATH } from './supabase-data-plane-report-builder'
import { buildSupabaseEnvSecretAudit } from './supabase-env-secret-audit'
import { buildSupabaseMigrationAudit } from './supabase-migration-audit'
import { resolveSupabaseRepoSchema } from './supabase-repo-schema-resolver'
import { buildSupabaseRlsPolicyAudit } from './supabase-rls-policy-audit'
import { buildSupabaseRuntimeIntegrationAudit } from './supabase-runtime-integration-audit'
import type { SupabaseDataPlaneArtifact, SupabaseDataPlaneExecutionReport } from './supabase-data-plane-audit-types'

const execFile = promisify(execFileCallback)

export async function runSupabaseDataPlaneAudit(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_SUPABASE_READONLY_AUDIT=true to run Phase 51A.')
  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateSupabaseDataPlaneExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE51A_RUN_ID ?? makeSupabaseDataPlaneRunId()
  const artifactPrefix = supabaseDataPlaneArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase51a-supabase-data-plane-audit-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const executionBlockers: string[] = []
  const executionWarnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) executionWarnings.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers, executionWarnings)

  const repoDiscovery = resolveSupabaseRepoSchema()
  const envSecretAudit = buildSupabaseEnvSecretAudit()
  const migrationAudit = buildSupabaseMigrationAudit(repoDiscovery.migrationFiles)
  const rlsPolicyAudit = buildSupabaseRlsPolicyAudit(migrationAudit)
  const runtimeIntegrationAudit = buildSupabaseRuntimeIntegrationAudit()
  const remoteActivityAudit = await runSupabaseRemoteActivityAudit()
  const dataModelGapAnalysis = buildSupabaseDataModelGapAnalysis({
    migrationAudit,
    rlsPolicyAudit,
    runtimeIntegrationAudit,
    remoteActivityAudit,
  })
  const betaReadinessImpact = buildSupabaseBetaReadinessImpact(dataModelGapAnalysis)
  const commandPlan = buildSupabaseDataPlaneCommandPlan()
  const qa = buildSupabaseDataPlaneQaSummary({
    repoDiscovery,
    envSecretAudit,
    migrationAudit,
    rlsPolicyAudit,
    runtimeIntegrationAudit,
    remoteActivityAudit,
    dataModelGapAnalysis,
    betaReadinessImpact,
    docsPresent: true,
    scriptsPresent: true,
    executionBlockers,
    executionWarnings,
  })
  const artifacts: SupabaseDataPlaneArtifact[] = []
  const executionReport: SupabaseDataPlaneExecutionReport = {
    ok: qa.status === 'passed',
    phase: '51A',
    runId,
    createdAt: new Date().toISOString(),
    projectId: 'reeditpro',
    mode: supabaseDataPlaneAuditConfig.mode,
    repoDiscovery,
    envSecretAudit,
    migrationAudit,
    rlsPolicyAudit,
    runtimeIntegrationAudit,
    remoteActivityAudit,
    dataModelGapAnalysis,
    betaReadinessImpact,
    commandPlan,
    qa,
    artifacts,
    safetyFlags: supabaseDataPlaneSafetyFlags,
    canRunLocalSql: dataModelGapAnalysis.canRunLocalSql,
    canProceedToPrompt20B: dataModelGapAnalysis.canProceedToPrompt20B,
    phase51BReadiness: betaReadinessImpact.phase51BReadiness,
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.ok = false
  }
  await mkdir(path.dirname(SUPABASE_DATA_PLANE_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(SUPABASE_DATA_PLANE_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  return {
    executionReport,
    localReportPath: SUPABASE_DATA_PLANE_LOCAL_REPORT_PATH,
    iamChanges: uploadBlockers.length ? ['not_applied: upload failed; see IAM plan for prefix-scoped objectCreator only'] : ['not_required: existing private GCS permissions allowed Phase 51A JSON upload'],
  }
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', supabaseDataPlaneAuditConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) warnings.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) warnings.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
  void blockers
}

async function verifyBuckets(blockers: string[], warnings: string[]): Promise<void> {
  for (const bucket of [supabaseDataPlaneAuditConfig.generatedAssetsBucket, supabaseDataPlaneAuditConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) warnings.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
    const iam = await safeGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (!iam.ok) warnings.push(`Unable to inspect IAM for private bucket gs://${bucket}: ${iam.error}`)
    else if (iam.stdout.includes('allUsers') || iam.stdout.includes('allAuthenticatedUsers')) blockers.push(`Private bucket gs://${bucket} exposes a public principal.`)
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: SupabaseDataPlaneExecutionReport, artifacts: SupabaseDataPlaneArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      artifacts.push(await uploadJson(localRoot, bucket, objectPath, value, id))
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(supabaseDataPlaneAuditConfig.generatedAssetsBucket, `${artifactPrefix}/repo/repo-supabase-structure.json`, report.repoDiscovery, 'repo_supabase_structure')
  await upload(supabaseDataPlaneAuditConfig.generatedAssetsBucket, `${artifactPrefix}/env/env-secret-audit.json`, report.envSecretAudit, 'env_secret_audit')
  await upload(supabaseDataPlaneAuditConfig.generatedAssetsBucket, `${artifactPrefix}/migrations/migration-schema-audit.json`, report.migrationAudit, 'migration_schema_audit')
  await upload(supabaseDataPlaneAuditConfig.generatedAssetsBucket, `${artifactPrefix}/rls/rls-security-audit.json`, report.rlsPolicyAudit, 'rls_security_audit')
  await upload(supabaseDataPlaneAuditConfig.generatedAssetsBucket, `${artifactPrefix}/runtime/runtime-integration-audit.json`, report.runtimeIntegrationAudit, 'runtime_integration_audit')
  await upload(supabaseDataPlaneAuditConfig.generatedAssetsBucket, `${artifactPrefix}/activity/remote-activity-audit.json`, report.remoteActivityAudit, 'remote_activity_audit')
  await upload(supabaseDataPlaneAuditConfig.generatedAssetsBucket, `${artifactPrefix}/gaps/data-model-gap-analysis.json`, report.dataModelGapAnalysis, 'data_model_gap_analysis')
  await upload(supabaseDataPlaneAuditConfig.generatedAssetsBucket, `${artifactPrefix}/readiness/beta-readiness-impact.json`, report.betaReadinessImpact, 'beta_readiness_impact')
  await upload(supabaseDataPlaneAuditConfig.qaBucket, `${artifactPrefix}/qa/supabase-data-plane-audit-qa.json`, report.qa, 'supabase_data_plane_qa')
  report.artifacts = artifacts
  await upload(supabaseDataPlaneAuditConfig.qaBucket, `${artifactPrefix}/reports/phase51a-report.json`, report, 'phase51a_report')
  return blockers
}

async function uploadJson(localRoot: string, bucket: string, objectPath: string, value: unknown, id: string): Promise<SupabaseDataPlaneArtifact> {
  const filePath = path.join(localRoot, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await runGcloud(['storage', 'cp', filePath, `gs://${bucket}/${objectPath}`])
  const fileStat = await stat(filePath)
  const bytes = await readFile(filePath)
  return {
    id,
    kind: 'private_json',
    bucket,
    object: objectPath,
    gcsUri: `gs://${bucket}/${objectPath}`,
    sizeBytes: fileStat.size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

async function runGcloud(args: string[]): Promise<string> {
  const { stdout } = await execFile('gcloud', args, { maxBuffer: 8 * 1024 * 1024 })
  return stdout
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; error: string; stdout: string }> {
  try {
    const stdout = await runGcloud(args)
    return { ok: true, stdout }
  } catch (error) {
    const err = error as { message?: string; stdout?: string; stderr?: string }
    return { ok: false, error: sanitizeCommandError(err.stderr || err.message || String(error)), stdout: err.stdout ?? '' }
  }
}

function sanitizeCommandError(message: string): string {
  if (message.includes('Reauthentication failed') || message.includes('cannot prompt during non-interactive execution')) {
    return 'gcloud reauthentication failed during non-interactive execution; run gcloud auth login or select an already authenticated account.'
  }
  return message
    .replace(/WARNING:\s+Python 3\.9\.x[\s\S]*?FutureWarning\)/g, 'gcloud Python runtime warning.')
    .replace(/\/var\/folders\/[^\s]+/g, '<local-temp-file>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .slice(0, 500)
}
