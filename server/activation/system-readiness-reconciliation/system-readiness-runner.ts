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
import { buildControlledInternalTestPlan } from './controlled-internal-test-plan-builder'
import { reconcileSystemFeatureGates } from './feature-gate-reconciliation'
import { buildSystemHandoffPackets, handoffIdForWorkstream } from './system-handoff-builder'
import { writeSystemReadinessLocalArtifact } from './system-readiness-artifacts'
import { buildSystemReadinessCommandPlan } from './system-readiness-command-plan'
import { buildSystemReadinessIamPlan } from './system-readiness-iam-plan'
import { buildSystemReadinessManifest } from './system-readiness-manifest-builder'
import {
  makeSystemReadinessRunId,
  systemReadinessArtifactPrefix,
  systemReadinessConfig,
  validateSystemReadinessEnv,
} from './system-readiness-reconciliation-policy'
import { buildSystemReadinessQaSummary } from './system-readiness-qa-summary'
import { SYSTEM_READINESS_LOCAL_REPORT_PATH, readSystemReadinessDocsPresent, readSystemReadinessPackageScripts } from './system-readiness-report-builder'
import {
  buildNotAttemptedPhase52FSyncResult,
  buildPhase52FSupabaseMilestoneBundle,
  buildPhase52FSupabaseSyncInput,
  readbackPhase52FMilestone,
} from './system-readiness-supabase-sync'
import { buildSystemRiskRegister } from './system-risk-register'
import { resolveSystemEvidenceContext } from './system-evidence-resolver'
import { buildSystemSourceAudit } from './system-source-audit'
import { buildSystemBlockerInventory } from './workstream-blocker-inventory'
import { resolveWorkstreamReadiness } from './workstream-readiness-resolver'
import type { SystemReadinessArtifact, SystemReadinessExecutionReport, SystemReadinessSupabaseSyncResult } from './system-readiness-reconciliation-types'

const execFile = promisify(execFileCallback)

export async function runSystemReadinessReconciliation(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_SYSTEM_READINESS_RECONCILIATION=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 52F.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateSystemReadinessEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE52F_RUN_ID ?? makeSystemReadinessRunId()
  const createdAt = new Date().toISOString()
  const artifactPrefix = systemReadinessArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase52f-system-readiness-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const blockers: string[] = []
  const warnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) blockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(blockers, warnings)
  await verifyBuckets(blockers)

  const credentialResolution = await resolveSupabaseMilestoneCredentials()
  warnings.push(...credentialResolution.warnings)
  blockers.push(...credentialResolution.blockers)
  const client = credentialResolution.configured ? createSupabaseMilestoneServiceClient(credentialResolution) : undefined
  const schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
  blockers.push(...schemaVerification.blockers)

  const repoOwnershipAudit = buildSystemSourceAudit(new Date(createdAt))
  const evidenceContext = resolveSystemEvidenceContext(repoOwnershipAudit)
  const workstreamReadiness = resolveWorkstreamReadiness(evidenceContext)
  const controlledInternalTestPlan = buildControlledInternalTestPlan(workstreamReadiness)
  const blockerInventory = buildSystemBlockerInventory(repoOwnershipAudit)
  const featureGateReconciliation = reconcileSystemFeatureGates()
  const systemRiskRegister = buildSystemRiskRegister()
  const handoffPackets = buildSystemHandoffPackets({ readiness: workstreamReadiness, blockers: blockerInventory })
  blockers.push(...repoOwnershipAudit.blockers, ...evidenceContext.blockers)
  warnings.push(...repoOwnershipAudit.warnings, ...evidenceContext.warnings)

  const optimisticSync = buildNotAttemptedPhase52FSyncResult({ schemaPresent: schemaVerification.allTablesPresent })
  const optimisticManifest = buildSystemReadinessManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    blockers,
    warnings,
  })
  const optimisticQa = buildSystemReadinessQaSummary({
    packageScripts: readSystemReadinessPackageScripts(),
    docsPresent: readSystemReadinessDocsPresent(),
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    manifest: optimisticManifest,
    supabaseSyncResult: { ...optimisticSync, status: 'completed' },
    executionMode: true,
  })
  const syncInput = buildPhase52FSupabaseSyncInput(runId, optimisticQa)
  const milestoneBundle = buildPhase52FSupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: SystemReadinessSupabaseSyncResult = buildNotAttemptedPhase52FSyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, milestoneBundle)
    supabaseSyncResult = await readbackPhase52FMilestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

  const manifestBeforeQa = buildSystemReadinessManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    blockers,
    warnings,
  })
  const qa = buildSystemReadinessQaSummary({
    packageScripts: readSystemReadinessPackageScripts(),
    docsPresent: readSystemReadinessDocsPresent(),
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    manifest: manifestBeforeQa,
    supabaseSyncResult,
    executionMode: true,
  })
  const manifest = buildSystemReadinessManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    qa,
    blockers,
    warnings,
  })
  const commandPlan = buildSystemReadinessCommandPlan()
  const iamPlan = buildSystemReadinessIamPlan(runId)
  const status = qa.status === 'passed' && supabaseSyncResult.status === 'completed' ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const artifacts: SystemReadinessArtifact[] = []
  const executionReport: SystemReadinessExecutionReport = {
    ok: status === 'completed',
    phase: '52F',
    runId,
    createdAt,
    status,
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    manifest,
    syncInput,
    milestoneBundle,
    schemaVerification,
    supabaseSyncResult,
    commandPlan,
    iamPlan,
    qa,
    artifacts,
    phase52GReadiness: status === 'completed' ? 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch' : 'blocked',
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
    executionReport.phase52GReadiness = 'blocked'
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(SYSTEM_READINESS_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(SYSTEM_READINESS_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: SYSTEM_READINESS_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 52F IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: SystemReadinessExecutionReport, artifacts: SystemReadinessArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeSystemReadinessLocalArtifact({ localRoot, bucket, object: objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/audit/repo-ownership-audit.json`, report.repoOwnershipAudit, 'phase52f_repo_ownership_audit')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/system-readiness-evidence-context.json`, report.evidenceContext, 'phase52f_evidence_context')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/readiness/workstream-readiness-reconciliation.json`, report.workstreamReadiness, 'phase52f_workstream_readiness')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/plan/controlled-internal-test-plan.json`, report.controlledInternalTestPlan, 'phase52f_controlled_test_plan')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/blockers/system-blocker-inventory.json`, report.blockerInventory, 'phase52f_blocker_inventory')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/gates/feature-gate-reconciliation.json`, report.featureGateReconciliation, 'phase52f_feature_gates')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/risks/system-exposure-register.json`, report.systemRiskRegister, 'phase52f_exposure_register')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/handoff/system-readiness-handoff-packets.json`, report.handoffPackets, 'phase52f_handoffs')
  for (const handoff of report.handoffPackets) {
    await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/handoff/${handoffIdForWorkstream(handoff.workstream)}.json`, handoff, handoff.packetId)
  }
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/system-readiness-reconciliation-manifest.json`, report.manifest, 'phase52f_manifest')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/phase52f-milestone-sync-input.json`, report.syncInput, 'phase52f_sync_input')
  await upload(systemReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/phase52f-milestone-sync-result.json`, report.supabaseSyncResult, 'phase52f_sync_result')
  await upload(systemReadinessConfig.qaBucket, `${artifactPrefix}/qa/system-readiness-reconciliation-qa.json`, report.qa, 'phase52f_qa')
  report.artifacts = artifacts
  await upload(systemReadinessConfig.qaBucket, `${artifactPrefix}/reports/phase52f-report.json`, report, 'phase52f_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', systemReadinessConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [systemReadinessConfig.generatedAssetsBucket, systemReadinessConfig.qaBucket]) {
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
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 800)
}
