import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  buildNotAttemptedWriteVerification,
  createSupabaseMilestoneServiceClient,
  inspectSupabaseMilestoneRegistryTables,
  resolveSupabaseMilestoneCredentials,
  validateSupabaseMilestoneBundle,
  writeMilestoneBundle,
} from '../supabase-milestone-registry'
import { buildActivationMilestoneBundle, buildPhase51DSelfSyncInput } from './activation-milestone-bundle-builder'
import { enforceActivationMilestoneSyncPolicy } from './activation-milestone-sanitizer'
import { buildFuturePhaseSyncContract, writeSupabaseMilestoneSyncLocalArtifact } from './activation-milestone-sync-artifacts'
import { verifyActivationMilestoneSyncReadback, phase52AReadinessFromSync } from './activation-milestone-sync-verifier'
import { buildSupabaseMilestoneSyncCommandPlan } from './supabase-milestone-sync-command-plan'
import { buildSupabaseMilestoneSyncIamPlan } from './supabase-milestone-sync-iam-plan'
import {
  makeSupabaseMilestoneSyncRunId,
  supabaseMilestoneSyncArtifactPrefix,
  supabaseMilestoneSyncConfig,
  supabaseMilestoneSyncSafetyFlags,
  validateSupabaseMilestoneSyncEnv,
} from './supabase-milestone-sync-policy'
import { buildSupabaseMilestoneSyncQaSummary } from './supabase-milestone-sync-qa-summary'
import { detectPhase51CEvidence, SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH } from './supabase-milestone-sync-report-builder'
import type { SupabaseMilestoneSyncArtifact, SupabaseMilestoneSyncExecutionReport } from './supabase-milestone-sync-types'

const execFile = promisify(execFileCallback)

export async function runSupabaseMilestoneSync(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 51D.')
  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateSupabaseMilestoneSyncEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE51D_RUN_ID ?? makeSupabaseMilestoneSyncRunId()
  const artifactPrefix = supabaseMilestoneSyncArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase51d-supabase-milestone-sync-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const executionBlockers: string[] = []
  const executionWarnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) executionBlockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers)

  const syncInput = buildPhase51DSelfSyncInput({ runId, artifactPrefix })
  const milestoneBundle = buildActivationMilestoneBundle(syncInput)
  const bundleValidation = validateSupabaseMilestoneBundle(milestoneBundle)
  const sanitizer = enforceActivationMilestoneSyncPolicy({ syncInput, bundle: milestoneBundle })
  const commandPlan = buildSupabaseMilestoneSyncCommandPlan()
  const iamPlan = buildSupabaseMilestoneSyncIamPlan(runId)

  const credentialResolution = await resolveSupabaseMilestoneCredentials()
  executionWarnings.push(...credentialResolution.warnings)
  if (credentialResolution.blockers.length) executionBlockers.push(...credentialResolution.blockers)
  const client = credentialResolution.configured ? createSupabaseMilestoneServiceClient(credentialResolution) : undefined
  const schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
  if (schemaVerification.blockers.length) executionBlockers.push(...schemaVerification.blockers)

  const writeAllowed = Boolean(client && schemaVerification.allTablesPresent && bundleValidation.ok && sanitizer.ok && !executionBlockers.length)
  const writeVerification = writeAllowed
    ? await writeMilestoneBundle(client!, milestoneBundle)
    : buildNotAttemptedWriteVerification(Array.from(new Set([...executionBlockers, ...bundleValidation.blockers, ...sanitizer.blockers])))
  const readbackVerification = await verifyActivationMilestoneSyncReadback({ client, bundle: milestoneBundle, writeVerification })
  const artifacts: SupabaseMilestoneSyncArtifact[] = []
  const qa = buildSupabaseMilestoneSyncQaSummary({
    phase51cEvidencePresent: detectPhase51CEvidence(),
    schemaVerification,
    bundleValidation,
    sanitizer,
    writeVerification,
    readbackVerification,
    docsPresent: true,
    scriptsPresent: true,
    executionWarnings,
  })
  const report: SupabaseMilestoneSyncExecutionReport = {
    ok: writeVerification.status === 'completed' && readbackVerification.status === 'completed' && qa.status === 'passed',
    phase: '51D',
    runId,
    createdAt: new Date().toISOString(),
    projectId: 'reeditpro',
    mode: supabaseMilestoneSyncConfig.mode,
    syncInput,
    milestoneBundle,
    bundleValidation,
    sanitizer,
    schemaVerification,
    writeVerification,
    readbackVerification,
    commandPlan,
    iamPlan,
    qa,
    artifacts,
    safetyFlags: supabaseMilestoneSyncSafetyFlags,
    phase52AReadiness: phase52AReadinessFromSync({ writeVerification, readbackVerification }),
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, report, artifacts)
  if (uploadBlockers.length) {
    report.blockers = Array.from(new Set([...report.blockers, ...uploadBlockers]))
    report.qa.blockers = Array.from(new Set([...report.qa.blockers, ...uploadBlockers]))
    report.qa.status = 'blocked'
    report.ok = false
    report.phase52AReadiness = 'blocked'
  }

  await mkdir(path.dirname(SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return {
    executionReport: report,
    localReportPath: SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 51D IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: SupabaseMilestoneSyncExecutionReport, artifacts: SupabaseMilestoneSyncArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeSupabaseMilestoneSyncLocalArtifact({ localRoot, bucket, objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/sync/phase51d-milestone-sync-input.json`, report.syncInput, 'phase51d_milestone_sync_input')
  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/sync/phase51d-milestone-bundle.json`, report.milestoneBundle, 'phase51d_milestone_bundle')
  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/sync/phase51d-supabase-sync-result.json`, { writeVerification: report.writeVerification, readbackVerification: report.readbackVerification, phase52AReadiness: report.phase52AReadiness }, 'phase51d_supabase_sync_result')
  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/verification/phase51d-readback-verification.json`, report.readbackVerification, 'phase51d_readback_verification')
  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/docs/future-phase-sync-contract.json`, buildFuturePhaseSyncContract(), 'future_phase_sync_contract')
  await upload(supabaseMilestoneSyncConfig.qaBucket, `${artifactPrefix}/qa/supabase-milestone-sync-qa.json`, report.qa, 'supabase_milestone_sync_qa')
  report.artifacts = artifacts
  await upload(supabaseMilestoneSyncConfig.qaBucket, `${artifactPrefix}/reports/phase51d-report.json`, report, 'phase51d_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', supabaseMilestoneSyncConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [supabaseMilestoneSyncConfig.generatedAssetsBucket, supabaseMilestoneSyncConfig.qaBucket]) {
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
