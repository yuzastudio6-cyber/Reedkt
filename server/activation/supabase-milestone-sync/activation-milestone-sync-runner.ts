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
import { buildPhase51DSelfSyncInput, buildSupabaseMilestoneBundleFromSyncInput } from './activation-milestone-bundle-builder'
import { buildFuturePhaseSyncContract, writeSupabaseMilestoneSyncLocalArtifact } from './activation-milestone-sync-artifacts'
import { verifySupabaseMilestoneSyncReadback } from './activation-milestone-sync-verifier'
import { validateActivationMilestoneSyncBundle, validateActivationMilestoneSyncInput } from './activation-milestone-sanitizer'
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
import type { SupabaseMilestoneSyncArtifact, SupabaseMilestoneSyncExecutionReport, SupabaseMilestoneSyncResult } from './supabase-milestone-sync-types'

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

  const syncInput = buildPhase51DSelfSyncInput(runId)
  const milestoneBundle = buildSupabaseMilestoneBundleFromSyncInput(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  executionBlockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  executionWarnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  const credentialResolution = await resolveSupabaseMilestoneCredentials()
  executionWarnings.push(...credentialResolution.warnings)
  if (credentialResolution.blockers.length) executionBlockers.push(...credentialResolution.blockers)
  const client = credentialResolution.configured ? createSupabaseMilestoneServiceClient(credentialResolution) : undefined
  const schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
  if (schemaVerification.blockers.length) executionBlockers.push(...schemaVerification.blockers)

  let syncResult: SupabaseMilestoneSyncResult = {
    status: 'blocked',
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    schemaPresent: schemaVerification.allTablesPresent,
    writeVerification: {
      status: 'not_attempted',
      schemaPresent: schemaVerification.allTablesPresent,
      migrationApplied: false,
      bundleValidated: bundleValidation.ok,
      activationRunWritten: false,
      artifactRowsWritten: 0,
      qaGateRowsWritten: 0,
      readinessRowsWritten: 0,
      toolCapabilityRowsWritten: 0,
      featureGateRowsWritten: 0,
      readbackMatched: false,
      publicArtifactRejected: true,
      signedUrlRejected: true,
      secretLookingValueRejected: true,
      blockers: executionBlockers,
      warnings: executionWarnings,
    },
    readbackMatched: false,
    writesLimitedToMilestoneRegistry: true,
    migrationsApplied: false,
    historicalBackfillRerun: false,
    blockers: executionBlockers,
    warnings: executionWarnings,
  }

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && !executionBlockers.length) {
    const writeVerification = await writeMilestoneBundle(client, milestoneBundle)
    const readback = await verifySupabaseMilestoneSyncReadback({ client, phaseId: milestoneBundle.phaseId, runId: milestoneBundle.runId })
    syncResult = {
      status: writeVerification.status === 'completed' && readback.readbackMatched ? 'completed' : 'blocked',
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
      schemaPresent: schemaVerification.allTablesPresent,
      writeVerification,
      readbackMatched: readback.readbackMatched,
      writesLimitedToMilestoneRegistry: true,
      migrationsApplied: false,
      historicalBackfillRerun: false,
      blockers: [...writeVerification.blockers, ...readback.blockers],
      warnings: [...writeVerification.warnings, ...readback.warnings, ...executionWarnings],
    }
  }

  const commandPlan = buildSupabaseMilestoneSyncCommandPlan()
  const iamPlan = buildSupabaseMilestoneSyncIamPlan(runId)
  let qa = buildSupabaseMilestoneSyncQaSummary({
    phase51cEvidencePresent: detectPhase51CEvidence(),
    inputValidation,
    bundleValidation,
    schemaVerification,
    syncResult,
    docsPresent: true,
    scriptsPresent: true,
    executionWarnings,
  })
  const artifacts: SupabaseMilestoneSyncArtifact[] = []
  const executionReport: SupabaseMilestoneSyncExecutionReport = {
    ok: syncResult.status === 'completed' && qa.status === 'passed',
    phase: '51D',
    runId,
    createdAt: new Date().toISOString(),
    projectId: supabaseMilestoneSyncConfig.projectId,
    mode: supabaseMilestoneSyncConfig.mode,
    syncInput,
    milestoneBundle,
    schemaVerification,
    syncResult,
    commandPlan,
    iamPlan,
    qa,
    artifacts,
    safetyFlags: supabaseMilestoneSyncSafetyFlags,
    phase52AReadiness: syncResult.status === 'completed' && qa.status === 'passed' ? 'ready_for_shared_agent_and_tool_ownership_architecture' : 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.ok = false
    executionReport.phase52AReadiness = 'blocked'
    executionReport.syncResult.status = 'blocked'
    executionReport.syncResult.blockers = Array.from(new Set([...executionReport.syncResult.blockers, ...uploadBlockers]))
    qa = { ...qa, status: 'blocked', blockers: executionReport.qa.blockers }
    executionReport.qa = qa
  }

  await mkdir(path.dirname(SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 51D IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: SupabaseMilestoneSyncExecutionReport, artifacts: SupabaseMilestoneSyncArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeSupabaseMilestoneSyncLocalArtifact({ localRoot, bucket, object: objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/sync/phase51d-milestone-sync-input.json`, report.syncInput, 'phase51d_sync_input')
  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/sync/phase51d-milestone-bundle.json`, report.milestoneBundle, 'phase51d_milestone_bundle')
  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/sync/phase51d-supabase-sync-result.json`, report.syncResult, 'phase51d_sync_result')
  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/verification/phase51d-readback-verification.json`, { readbackMatched: report.syncResult.readbackMatched, writeVerification: report.syncResult.writeVerification }, 'phase51d_readback_verification')
  await upload(supabaseMilestoneSyncConfig.generatedAssetsBucket, `${artifactPrefix}/docs/future-phase-sync-contract.json`, buildFuturePhaseSyncContract(), 'future_phase_sync_contract')
  await upload(supabaseMilestoneSyncConfig.qaBucket, `${artifactPrefix}/qa/supabase-milestone-sync-qa.json`, report.qa, 'phase51d_qa')
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
