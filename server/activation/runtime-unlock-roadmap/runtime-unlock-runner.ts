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
import { buildOwnerAcceptanceChecklist } from './owner-acceptance-checklist'
import { buildOwnerRepoAuditPrompts } from './owner-repo-audit-prompt-builder'
import { buildRuntimeUnlockBlockedScopePolicy } from './runtime-unlock-blocked-scope-policy'
import { buildRuntimeUnlockCommandPlan } from './runtime-unlock-command-plan'
import { buildRuntimeUnlockIamPlan } from './runtime-unlock-iam-plan'
import { buildRuntimeUnlockLadder } from './runtime-unlock-ladder'
import { buildOwnerAcceptanceMatrix } from './runtime-unlock-owner-matrix'
import {
  makeRuntimeUnlockRunId,
  runtimeUnlockArtifactPrefix,
  runtimeUnlockConfig,
  validateRuntimeUnlockExecutionEnv,
} from './runtime-unlock-roadmap-policy'
import { buildRuntimeUnlockQaSummary } from './runtime-unlock-qa-summary'
import {
  buildRuntimeUnlockManifest,
  buildRuntimeUnlockRoadmap,
  readRuntimeUnlockDocsPresent,
  readRuntimeUnlockPackageScripts,
  RUNTIME_UNLOCK_LOCAL_REPORT_PATH,
} from './runtime-unlock-report-builder'
import { buildRuntimeUnlockRiskRegister } from './runtime-unlock-risk-register'
import { buildRuntimeUnlockSourceAudit } from './runtime-unlock-source-audit'
import { writeRuntimeUnlockLocalArtifact } from './runtime-unlock-artifacts'
import {
  buildNotAttemptedPhase53ASyncResult,
  buildPhase53ASupabaseMilestoneBundle,
  buildPhase53ASupabaseSyncInput,
  readbackPhase53AMilestone,
} from './runtime-unlock-supabase-sync'
import type { RuntimeUnlockArtifact, RuntimeUnlockExecutionReport, RuntimeUnlockRunnerInput, RuntimeUnlockSupabaseSyncResult } from './runtime-unlock-roadmap-types'

const execFile = promisify(execFileCallback)

export async function runRuntimeUnlockRoadmap(input: RuntimeUnlockRunnerInput) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_RUNTIME_UNLOCK_ROADMAP=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 53A.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateRuntimeUnlockExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE53A_RUN_ID ?? makeRuntimeUnlockRunId()
  const createdAt = new Date().toISOString()
  const artifactPrefix = runtimeUnlockArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase53a-runtime-unlock-${runId}`)
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

  const sourceAudit = buildRuntimeUnlockSourceAudit()
  const ladder = buildRuntimeUnlockLadder()
  const blockedScopePolicy = buildRuntimeUnlockBlockedScopePolicy()
  const ownerAcceptanceMatrix = buildOwnerAcceptanceMatrix()
  const ownerAcceptanceChecklist = buildOwnerAcceptanceChecklist()
  const ownerRepoAuditPrompts = buildOwnerRepoAuditPrompts(ownerAcceptanceMatrix)
  const riskRegister = buildRuntimeUnlockRiskRegister()
  const roadmap = buildRuntimeUnlockRoadmap({ ladder, ownerAcceptanceMatrix, blockedScopePolicy })
  blockers.push(...sourceAudit.blockers)
  warnings.push(...sourceAudit.warnings)

  const optimisticSync = buildNotAttemptedPhase53ASyncResult({ schemaPresent: schemaVerification.allTablesPresent })
  const optimisticQa = buildRuntimeUnlockQaSummary({
    packageScripts: readRuntimeUnlockPackageScripts(),
    docsPresent: readRuntimeUnlockDocsPresent(),
    sourceAudit,
    ladder,
    blockedScopePolicy,
    ownerAcceptanceMatrix,
    ownerRepoAuditPrompts,
    supabaseSyncResult: { ...optimisticSync, status: 'completed' },
    executionMode: true,
  })
  const syncInput = buildPhase53ASupabaseSyncInput(runId, optimisticQa)
  const milestoneBundle = buildPhase53ASupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: RuntimeUnlockSupabaseSyncResult = buildNotAttemptedPhase53ASyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, milestoneBundle)
    supabaseSyncResult = await readbackPhase53AMilestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

  const qa = buildRuntimeUnlockQaSummary({
    packageScripts: readRuntimeUnlockPackageScripts(),
    docsPresent: readRuntimeUnlockDocsPresent(),
    sourceAudit,
    ladder,
    blockedScopePolicy,
    ownerAcceptanceMatrix,
    ownerRepoAuditPrompts,
    supabaseSyncResult,
    executionMode: true,
  })
  const phase53BReady = qa.status === 'passed' && supabaseSyncResult.status === 'completed'
  const manifest = buildRuntimeUnlockManifest({
    runId,
    sourceAudit,
    roadmap,
    ownerAcceptanceChecklist,
    ownerRepoAuditPrompts,
    riskRegister,
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    phase53BReady,
  })
  const status = phase53BReady ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const artifacts: RuntimeUnlockArtifact[] = []
  const executionReport: RuntimeUnlockExecutionReport = {
    ok: status === 'completed',
    phase: '53A',
    runId,
    createdAt,
    status,
    sourceAudit,
    ladder,
    blockedScopePolicy,
    ownerAcceptanceMatrix,
    ownerAcceptanceChecklist,
    ownerRepoAuditPrompts,
    riskRegister,
    roadmap: { ...roadmap, phase53BReadiness: phase53BReady ? 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits' : 'blocked' },
    manifest,
    syncInput,
    milestoneBundle,
    schemaVerification,
    supabaseSyncResult,
    commandPlan: buildRuntimeUnlockCommandPlan(),
    iamPlan: buildRuntimeUnlockIamPlan(runId),
    qa,
    artifacts,
    phase53BReadiness: phase53BReady ? 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits' : 'blocked',
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
    executionReport.phase53BReadiness = 'blocked'
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(RUNTIME_UNLOCK_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(RUNTIME_UNLOCK_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: RUNTIME_UNLOCK_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 53A IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: RuntimeUnlockExecutionReport, artifacts: RuntimeUnlockArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, artifactId: string, artifactType: string) => {
    try {
      const { localPath, artifact } = await writeRuntimeUnlockLocalArtifact({ localRoot, bucket, object: objectPath, value, artifactId, artifactType })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${artifactId}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/audit/repo-ownership-audit.json`, report.sourceAudit, 'phase53a_repo_ownership_audit', 'repo_ownership_audit')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/roadmap/runtime-unlock-roadmap.json`, report.roadmap, 'phase53a_runtime_unlock_roadmap', 'runtime_unlock_roadmap')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/matrix/owner-acceptance-matrix.json`, report.ownerAcceptanceMatrix, 'phase53a_owner_acceptance_matrix', 'owner_acceptance_matrix')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/policy/blocked-scope-policy.json`, report.blockedScopePolicy, 'phase53a_blocked_scope_policy', 'blocked_scope_policy')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/ladder/runtime-unlock-ladder.json`, report.ladder, 'phase53a_runtime_unlock_ladder', 'runtime_unlock_ladder')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/prompts/owner-repo-audit-prompts.json`, report.ownerRepoAuditPrompts, 'phase53a_owner_repo_audit_prompts', 'owner_repo_audit_prompts')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/exposure/runtime-unlock-exposure-register.json`, report.riskRegister, 'phase53a_runtime_unlock_risk_register', 'runtime_unlock_risk_register')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/runtime-unlock-roadmap-manifest.json`, report.manifest, 'phase53a_manifest', 'runtime_unlock_manifest')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/phase53a-milestone-sync-input.json`, report.syncInput, 'phase53a_sync_input', 'milestone_sync_input')
  await upload(runtimeUnlockConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/phase53a-milestone-sync-result.json`, report.supabaseSyncResult, 'phase53a_sync_result', 'milestone_sync_result')
  await upload(runtimeUnlockConfig.qaBucket, `${artifactPrefix}/qa/runtime-unlock-roadmap-qa.json`, report.qa, 'phase53a_qa', 'qa')
  report.artifacts = artifacts
  await upload(runtimeUnlockConfig.qaBucket, `${artifactPrefix}/reports/phase53a-report.json`, report, 'phase53a_report', 'report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', runtimeUnlockConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [runtimeUnlockConfig.generatedAssetsBucket, runtimeUnlockConfig.qaBucket]) {
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
    .replace(/(service_role|apikey|authorization|password|token|SUPABASE_[A-Z_]+)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
