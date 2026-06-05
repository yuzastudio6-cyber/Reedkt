import { execFile as execFileCallback } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildSupabaseMilestoneBackfillPlan } from './supabase-milestone-backfill-plan'
import {
  applySupabaseMilestoneMigrationWithPsql,
  createSupabaseMilestoneServiceClient,
  inspectSupabaseMilestoneRegistryTables,
  psqlAvailable,
  resolveSupabaseMilestoneCredentials,
  resolveSupabaseMilestoneDbUrl,
} from './supabase-milestone-client'
import { buildSupabaseMilestoneRegistryCommandPlan, buildSupabaseMilestoneRegistryIamPlan } from './supabase-milestone-command-plan'
import {
  makeSupabaseMilestoneRegistryRunId,
  supabaseMilestoneRegistryArtifactPrefix,
  supabaseMilestoneRegistryConfig,
  supabaseMilestoneRegistrySafetyFlags,
  validateSupabaseMilestoneMigrationApplyEnv,
  validateSupabaseMilestoneRegistryExecutionEnv,
} from './supabase-milestone-registry-policy'
import { buildSupabaseMilestoneRegistryQaSummary } from './supabase-milestone-qa-summary'
import { SUPABASE_MILESTONE_REGISTRY_LOCAL_REPORT_PATH, buildPhase51BMilestoneBundle, detectPhase51AEvidence } from './supabase-milestone-report-builder'
import { buildSupabaseMilestoneSchemaMetadata } from './supabase-milestone-schema-metadata'
import { buildNotAttemptedWriteVerification, validateSupabaseMilestoneBundle, writeMilestoneBundle } from './supabase-milestone-writer'
import type {
  SupabaseMilestoneRegistryArtifact,
  SupabaseMilestoneRegistryExecutionReport,
  SupabaseRegistryMigrationSummary,
  SupabaseRegistrySchemaVerification,
} from './supabase-milestone-registry-types'

const execFile = promisify(execFileCallback)

export async function runSupabaseMilestoneRegistry(input: { execute: boolean; applyMigration?: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY=true to run Phase 51B.')
  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateSupabaseMilestoneRegistryExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE51B_RUN_ID ?? makeSupabaseMilestoneRegistryRunId()
  const artifactPrefix = supabaseMilestoneRegistryArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase51b-supabase-milestone-registry-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const executionBlockers: string[] = []
  const executionWarnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) executionBlockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers)

  const schemaMetadata = buildSupabaseMilestoneSchemaMetadata()
  const psqlReady = await psqlAvailable()
  const credentialResolution = await resolveSupabaseMilestoneCredentials()
  executionWarnings.push(...credentialResolution.warnings)
  if (credentialResolution.blockers.length) executionWarnings.push(...credentialResolution.blockers)
  const dbUrlResolution = await resolveSupabaseMilestoneDbUrl()
  executionWarnings.push(...dbUrlResolution.warnings)
  const client = credentialResolution.configured ? createSupabaseMilestoneServiceClient(credentialResolution) : undefined

  let schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
  let migrationSummary = buildMigrationSummary({
    applyRequested: Boolean(input.applyMigration),
    psqlAvailable: psqlReady,
    dbUrlResolved: dbUrlResolution.configured,
    dbUrlSource: dbUrlResolution.source,
    schemaVerification,
  })

  if (!schemaVerification.allTablesPresent && input.applyMigration) {
    const migrationValidation = validateSupabaseMilestoneMigrationApplyEnv({ dbUrlResolved: dbUrlResolution.configured })
    if (!migrationValidation.ok) {
      migrationSummary = { ...migrationSummary, status: dbUrlResolution.configured ? 'blocked_missing_confirmation' : 'blocked_missing_db_url', blockers: migrationValidation.blockers }
    } else if (!dbUrlResolution.dbUrl) {
      migrationSummary = { ...migrationSummary, status: 'blocked_missing_db_url', blockers: ['DB URL resolved metadata was unavailable to psql.'] }
    } else {
      const result = await applySupabaseMilestoneMigrationWithPsql(dbUrlResolution.dbUrl, supabaseMilestoneRegistryConfig.migrationFile)
      migrationSummary = {
        ...migrationSummary,
        applyConfirmationPresent: true,
        status: result.ok ? 'applied' : 'blocked_psql_failed',
        blockers: result.ok ? [] : [result.error ?? 'psql migration apply failed.'],
        warnings: result.ok ? ['Phase 51B migration applied through local psql after explicit confirmation.'] : migrationSummary.warnings,
      }
      if (result.ok) schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
    }
  }

  const commandPlan = buildSupabaseMilestoneRegistryCommandPlan()
  const iamPlan = buildSupabaseMilestoneRegistryIamPlan(runId)
  const backfillPlan = buildSupabaseMilestoneBackfillPlan()
  const initialBundle = buildPhase51BMilestoneBundle({
    runId,
    status: schemaVerification.allTablesPresent ? 'partial' : 'blocked',
    qaStatus: schemaVerification.allTablesPresent ? 'warning' : 'blocked',
    readinessStatus: schemaVerification.allTablesPresent ? 'schema_verified_write_pending' : 'blocked_registry_schema_missing_or_unreadable',
    artifactPrefix,
    blockers: schemaVerification.blockers,
    warnings: [...executionWarnings, ...migrationSummary.warnings],
  })
  let writeVerification = buildNotAttemptedWriteVerification(schemaVerification.allTablesPresent ? [] : schemaVerification.blockers, schemaVerification.warnings)
  let milestoneBundle = initialBundle
  if (schemaVerification.allTablesPresent && client) {
    writeVerification = await writeMilestoneBundle(client, initialBundle)
    writeVerification = {
      ...writeVerification,
      migrationApplied: migrationSummary.status === 'applied',
    }
    milestoneBundle = {
      ...initialBundle,
      status: writeVerification.status === 'completed' ? 'completed' : 'blocked',
      qaStatus: writeVerification.status === 'completed' ? 'passed' : 'blocked',
      readinessStatus: writeVerification.status === 'completed' ? 'ready_for_historical_activation_evidence_backfill' : 'blocked_registry_write_failed',
      blockers: writeVerification.blockers,
      warnings: [...initialBundle.warnings, ...writeVerification.warnings],
    }
  }

  const qa = buildSupabaseMilestoneRegistryQaSummary({
    phase51aEvidencePresent: detectPhase51AEvidence(),
    schemaMetadata,
    migrationSummary,
    schemaVerification,
    bundle: milestoneBundle,
    bundleValidation: validateSupabaseMilestoneBundle(milestoneBundle),
    writeVerification,
    backfillPlan,
    commandPlan,
    iamPlan,
    docsPresent: true,
    scriptsPresent: true,
    executionBlockers,
    executionWarnings,
  })
  const phase51CReadiness = writeVerification.status === 'completed' && qa.status === 'passed' ? 'ready_for_historical_activation_evidence_backfill' : 'blocked'
  const artifacts: SupabaseMilestoneRegistryArtifact[] = []
  const executionReport: SupabaseMilestoneRegistryExecutionReport = {
    ok: phase51CReadiness === 'ready_for_historical_activation_evidence_backfill',
    phase: '51B',
    runId,
    createdAt: new Date().toISOString(),
    projectId: 'reeditpro',
    mode: supabaseMilestoneRegistryConfig.mode,
    schemaMetadata,
    schemaVerification,
    migrationSummary,
    milestoneBundle,
    backfillPlan,
    commandPlan,
    iamPlan,
    qa,
    writeVerification,
    artifacts,
    safetyFlags: supabaseMilestoneRegistrySafetyFlags,
    phase51CReadiness,
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.ok = false
    executionReport.phase51CReadiness = 'blocked'
  }

  await mkdir(path.dirname(SUPABASE_MILESTONE_REGISTRY_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(SUPABASE_MILESTONE_REGISTRY_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: SUPABASE_MILESTONE_REGISTRY_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 51B IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

function buildMigrationSummary(input: {
  applyRequested: boolean
  psqlAvailable: boolean
  dbUrlResolved: boolean
  dbUrlSource: SupabaseRegistryMigrationSummary['dbUrlSource']
  schemaVerification: SupabaseRegistrySchemaVerification
}): SupabaseRegistryMigrationSummary {
  const missingSchema = !input.schemaVerification.allTablesPresent
  return {
    migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
    applyRequested: input.applyRequested,
    applyConfirmationPresent: process.env.REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY === 'true',
    dbUrlResolved: input.dbUrlResolved,
    dbUrlSource: input.dbUrlSource,
    status: missingSchema ? 'blocked_schema_missing' : 'not_required_schema_present',
    psqlAvailable: input.psqlAvailable,
    destructiveStatementsDetected: false,
    ddlViaSupabaseRestAttempted: false,
    blockers: missingSchema ? ['Registry tables are missing or unreadable. Migration apply requires --apply-migration, REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY=true, and a direct DB URL.'] : [],
    warnings: input.applyRequested ? [] : ['Migration apply was not requested; existing schema must be present for the write verification to run.'],
  }
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', supabaseMilestoneRegistryConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [supabaseMilestoneRegistryConfig.generatedAssetsBucket, supabaseMilestoneRegistryConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
    const iam = await safeGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (!iam.ok) blockers.push(`Unable to inspect IAM for private bucket gs://${bucket}: ${iam.error}`)
    else if (iam.stdout.includes('allUsers') || iam.stdout.includes('allAuthenticatedUsers')) blockers.push(`Private bucket gs://${bucket} exposes a public principal.`)
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: SupabaseMilestoneRegistryExecutionReport, artifacts: SupabaseMilestoneRegistryArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      artifacts.push(await uploadJson(localRoot, bucket, objectPath, value, id))
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(supabaseMilestoneRegistryConfig.generatedAssetsBucket, `${artifactPrefix}/schema/activation-milestone-schema.json`, report.schemaMetadata, 'activation_milestone_schema')
  await upload(supabaseMilestoneRegistryConfig.generatedAssetsBucket, `${artifactPrefix}/migration/activation-milestone-migration-summary.json`, report.migrationSummary, 'activation_milestone_migration_summary')
  await upload(supabaseMilestoneRegistryConfig.generatedAssetsBucket, `${artifactPrefix}/bundle/phase51b-milestone-bundle.json`, report.milestoneBundle, 'phase51b_milestone_bundle')
  await upload(supabaseMilestoneRegistryConfig.generatedAssetsBucket, `${artifactPrefix}/backfill/activation-milestone-backfill-plan.json`, report.backfillPlan, 'activation_milestone_backfill_plan')
  if (report.writeVerification.status === 'completed') {
    await upload(supabaseMilestoneRegistryConfig.generatedAssetsBucket, `${artifactPrefix}/verification/supabase-write-verification.json`, report.writeVerification, 'supabase_write_verification')
  }
  await upload(supabaseMilestoneRegistryConfig.qaBucket, `${artifactPrefix}/qa/supabase-milestone-registry-qa.json`, report.qa, 'supabase_milestone_registry_qa')
  report.artifacts = artifacts
  await upload(supabaseMilestoneRegistryConfig.qaBucket, `${artifactPrefix}/reports/phase51b-report.json`, report, 'phase51b_report')
  return blockers
}

async function uploadJson(localRoot: string, bucket: string, objectPath: string, value: unknown, id: string): Promise<SupabaseMilestoneRegistryArtifact> {
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
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/\/var\/folders\/[^\s]+/g, '<local-temp-file>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 700)
}
