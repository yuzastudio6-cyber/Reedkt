import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  createSupabaseMilestoneServiceClient,
  inspectSupabaseMilestoneRegistryTables,
  resolveSupabaseMilestoneCredentials,
} from '../supabase-milestone-registry'
import { supabaseHistoricalBackfillCanonicalPhases } from './supabase-backfill-canonical-phases'
import { buildSupabaseHistoricalBundleRecords } from './supabase-backfill-bundle-builder'
import { buildSupabaseHistoricalBackfillCommandPlan } from './supabase-backfill-command-plan'
import { resolveSupabaseHistoricalEvidence } from './supabase-backfill-evidence-resolver'
import { writeSupabaseHistoricalBackfillBundles } from './supabase-backfill-writer'
import { buildSupabaseHistoricalBackfillIamPlan } from './supabase-backfill-iam-plan'
import { buildSupabaseHistoricalBackfillQaSummary } from './supabase-backfill-qa-summary'
import { buildSupabaseHistoricalBackfillPlan, detectPhase51BEvidence, SUPABASE_HISTORICAL_BACKFILL_LOCAL_REPORT_PATH } from './supabase-backfill-report-builder'
import { buildSupabaseHistoricalBackfillSummary, phase51DReadinessFromSummary } from './supabase-backfill-verifier'
import { writeSupabaseHistoricalBackfillLocalArtifact } from './supabase-backfill-artifact-builder'
import {
  makeSupabaseHistoricalBackfillRunId,
  supabaseHistoricalBackfillArtifactPrefix,
  supabaseHistoricalBackfillConfig,
  supabaseHistoricalBackfillSafetyFlags,
  validateSupabaseHistoricalBackfillEnv,
} from './supabase-historical-backfill-policy'
import type { SupabaseHistoricalBackfillArtifact, SupabaseHistoricalBackfillExecutionReport } from './supabase-historical-backfill-types'

const execFile = promisify(execFileCallback)

export async function runSupabaseHistoricalBackfill(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL=true to run Phase 51C.')
  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateSupabaseHistoricalBackfillEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE51C_RUN_ID ?? makeSupabaseHistoricalBackfillRunId()
  const artifactPrefix = supabaseHistoricalBackfillArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase51c-supabase-historical-backfill-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const executionBlockers: string[] = []
  const executionWarnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) executionBlockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers)

  const plan = buildSupabaseHistoricalBackfillPlan()
  const commandPlan = buildSupabaseHistoricalBackfillCommandPlan()
  const iamPlan = buildSupabaseHistoricalBackfillIamPlan(runId)
  const evidence = resolveSupabaseHistoricalEvidence(supabaseHistoricalBackfillCanonicalPhases)
  let bundleRecords = buildSupabaseHistoricalBundleRecords({ phases: supabaseHistoricalBackfillCanonicalPhases, evidence })

  const credentialResolution = await resolveSupabaseMilestoneCredentials()
  executionWarnings.push(...credentialResolution.warnings)
  if (credentialResolution.blockers.length) executionBlockers.push(...credentialResolution.blockers)
  const client = credentialResolution.configured ? createSupabaseMilestoneServiceClient(credentialResolution) : undefined
  const schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
  if (schemaVerification.blockers.length) executionBlockers.push(...schemaVerification.blockers)

  if (client && schemaVerification.allTablesPresent) {
    bundleRecords = await writeSupabaseHistoricalBackfillBundles({ client, schemaPresent: true, records: bundleRecords })
  } else {
    bundleRecords = await writeSupabaseHistoricalBackfillBundles({ client, schemaPresent: false, records: bundleRecords })
  }

  let summary = buildSupabaseHistoricalBackfillSummary({ runId, records: bundleRecords })
  let qa = buildSupabaseHistoricalBackfillQaSummary({
    phase51bEvidencePresent: detectPhase51BEvidence(),
    schemaVerification,
    plan,
    records: bundleRecords,
    summary,
    docsPresent: true,
    scriptsPresent: true,
    executionBlockers,
    executionWarnings,
  })
  const artifacts: SupabaseHistoricalBackfillArtifact[] = []
  const executionReport: SupabaseHistoricalBackfillExecutionReport = {
    ok: phase51DReadinessFromSummary(summary) === 'ready_for_automatic_per_phase_supabase_milestone_sync' && qa.status === 'passed',
    phase: '51C',
    runId,
    createdAt: new Date().toISOString(),
    projectId: 'reeditpro',
    mode: supabaseHistoricalBackfillConfig.mode,
    plan,
    schemaVerification,
    evidence,
    bundleRecords,
    summary,
    commandPlan,
    iamPlan,
    qa,
    artifacts,
    safetyFlags: supabaseHistoricalBackfillSafetyFlags,
    phase51DReadiness: phase51DReadinessFromSummary(summary),
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.ok = false
    executionReport.phase51DReadiness = 'blocked'
    summary = { ...summary, p0MissingOrBlocked: Array.from(new Set([...summary.p0MissingOrBlocked, 'artifact_upload'])) }
    executionReport.summary = summary
    qa = { ...qa, status: 'blocked', blockers: executionReport.qa.blockers }
    executionReport.qa = qa
  }

  await mkdir(path.dirname(SUPABASE_HISTORICAL_BACKFILL_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(SUPABASE_HISTORICAL_BACKFILL_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: SUPABASE_HISTORICAL_BACKFILL_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 51C IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: SupabaseHistoricalBackfillExecutionReport, artifacts: SupabaseHistoricalBackfillArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeSupabaseHistoricalBackfillLocalArtifact({ localRoot, bucket, objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(supabaseHistoricalBackfillConfig.generatedAssetsBucket, `${artifactPrefix}/plan/historical-backfill-plan.json`, report.plan, 'historical_backfill_plan')
  await upload(supabaseHistoricalBackfillConfig.generatedAssetsBucket, `${artifactPrefix}/bundles/historical-milestone-bundles.json`, report.bundleRecords.map((record) => record.bundle).filter(Boolean), 'historical_milestone_bundles')
  await upload(supabaseHistoricalBackfillConfig.generatedAssetsBucket, `${artifactPrefix}/verification/historical-backfill-write-verification.json`, report.bundleRecords.map((record) => ({ phaseId: record.phase.phaseId, runId: record.phase.runId, writeStatus: record.writeStatus, readbackMatched: record.readbackMatched, writeVerification: record.writeVerification, blockers: record.blockers })), 'historical_backfill_write_verification')
  await upload(supabaseHistoricalBackfillConfig.generatedAssetsBucket, `${artifactPrefix}/skipped/historical-backfill-skipped-phases.json`, report.summary.skippedPhases, 'historical_backfill_skipped_phases')
  await upload(supabaseHistoricalBackfillConfig.generatedAssetsBucket, `${artifactPrefix}/summary/historical-backfill-summary.json`, report.summary, 'historical_backfill_summary')
  await upload(supabaseHistoricalBackfillConfig.qaBucket, `${artifactPrefix}/qa/supabase-historical-backfill-qa.json`, report.qa, 'supabase_historical_backfill_qa')
  report.artifacts = artifacts
  await upload(supabaseHistoricalBackfillConfig.qaBucket, `${artifactPrefix}/reports/phase51c-report.json`, report, 'phase51c_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', supabaseHistoricalBackfillConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [supabaseHistoricalBackfillConfig.generatedAssetsBucket, supabaseHistoricalBackfillConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
    const iam = await safeGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (!iam.ok) blockers.push(`Unable to inspect IAM for private bucket gs://${bucket}: ${iam.error}`)
    else if (iam.stdout.includes('allUsers') || iam.stdout.includes('allAuthenticatedUsers')) blockers.push(`Private bucket gs://${bucket} exposes a public principal.`)
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
