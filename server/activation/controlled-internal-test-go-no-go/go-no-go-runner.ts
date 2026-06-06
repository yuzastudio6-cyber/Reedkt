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
import { goNoGoArtifactPrefix, goNoGoConfig, makeGoNoGoRunId, validateControlledInternalTestGoNoGoEnv } from './controlled-internal-test-go-no-go-policy'
import { buildControlledInternalTestPacket, classifyInternalTestScopes } from './internal-test-scope-classifier'
import { writeGoNoGoLocalArtifact } from './go-no-go-artifacts'
import { buildGoNoGoBlockerInventory } from './go-no-go-blocker-inventory'
import { buildGoNoGoCommandPlan } from './go-no-go-command-plan'
import { buildGoNoGoDecisionPacket } from './go-no-go-decision-packet'
import { buildGoNoGoExposureRegister } from './go-no-go-risk-register'
import { buildGoNoGoIamPlan } from './go-no-go-iam-plan'
import { buildGoNoGoQaSummary } from './go-no-go-qa-summary'
import { GO_NO_GO_LOCAL_REPORT_PATH, readGoNoGoDocsPresent, readGoNoGoPackageScripts } from './go-no-go-report-builder'
import {
  buildNotAttemptedPhase52GSyncResult,
  buildPhase52GSupabaseMilestoneBundle,
  buildPhase52GSupabaseSyncInput,
  readbackPhase52GMilestone,
} from './go-no-go-supabase-sync'
import { resolveGoNoGoEvidenceContext } from './go-no-go-evidence-resolver'
import { buildGoNoGoSourceAudit } from './go-no-go-source-audit'
import { buildOwnerHandoffDispatchManifest } from './owner-handoff-dispatch-manifest'
import { buildOwnerHandoffPromptPackets } from './owner-handoff-prompt-builder'
import { evaluateWorkstreamGoNoGo } from './workstream-go-no-go-evaluator'
import type { GoNoGoArtifact, GoNoGoExecutionReport, GoNoGoSupabaseSyncResult } from './controlled-internal-test-go-no-go-types'

const execFile = promisify(execFileCallback)

export async function runControlledInternalTestGoNoGo(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_CONTROLLED_INTERNAL_TEST_GO_NO_GO=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 52G.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateControlledInternalTestGoNoGoEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE52G_RUN_ID ?? makeGoNoGoRunId()
  const createdAt = new Date().toISOString()
  const artifactPrefix = goNoGoArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase52g-go-no-go-${runId}`)
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

  const repoOwnershipAudit = buildGoNoGoSourceAudit(new Date(createdAt))
  const evidenceContext = resolveGoNoGoEvidenceContext(repoOwnershipAudit)
  const workstreamDecisions = evaluateWorkstreamGoNoGo(evidenceContext)
  const scopeClassifications = classifyInternalTestScopes(workstreamDecisions)
  const decisionPacket = buildGoNoGoDecisionPacket(runId, workstreamDecisions)
  const controlledInternalTestPacket = buildControlledInternalTestPacket(workstreamDecisions)
  const ownerPromptPackets = buildOwnerHandoffPromptPackets(workstreamDecisions, runId)
  const blockerInventory = buildGoNoGoBlockerInventory(repoOwnershipAudit)
  const exposureRegister = buildGoNoGoExposureRegister()
  blockers.push(...repoOwnershipAudit.blockers, ...evidenceContext.blockers)
  warnings.push(...repoOwnershipAudit.warnings, ...evidenceContext.warnings)

  const optimisticSync = buildNotAttemptedPhase52GSyncResult({ schemaPresent: schemaVerification.allTablesPresent })
  const optimisticManifest = buildOwnerHandoffDispatchManifest({
    runId,
    decisionPacket,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    warnings,
    blockers,
    phase52HReady: true,
  })
  const optimisticQa = buildGoNoGoQaSummary({
    packageScripts: readGoNoGoPackageScripts(),
    docsPresent: readGoNoGoDocsPresent(),
    repoOwnershipAudit,
    decisionPacket,
    workstreamDecisions,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    dispatchManifest: optimisticManifest,
    supabaseSyncResult: { ...optimisticSync, status: 'completed' },
    executionMode: true,
  })
  const syncInput = buildPhase52GSupabaseSyncInput(runId, optimisticQa)
  const milestoneBundle = buildPhase52GSupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: GoNoGoSupabaseSyncResult = buildNotAttemptedPhase52GSyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, milestoneBundle)
    supabaseSyncResult = await readbackPhase52GMilestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

  const dispatchManifestBeforeQa = buildOwnerHandoffDispatchManifest({
    runId,
    decisionPacket,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    warnings,
    blockers,
    phase52HReady: supabaseSyncResult.status === 'completed',
  })
  const qa = buildGoNoGoQaSummary({
    packageScripts: readGoNoGoPackageScripts(),
    docsPresent: readGoNoGoDocsPresent(),
    repoOwnershipAudit,
    decisionPacket,
    workstreamDecisions,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    dispatchManifest: dispatchManifestBeforeQa,
    supabaseSyncResult,
    executionMode: true,
  })
  const dispatchManifest = buildOwnerHandoffDispatchManifest({
    runId,
    decisionPacket,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    phase52HReady: qa.status === 'passed' && supabaseSyncResult.status === 'completed',
  })
  const commandPlan = buildGoNoGoCommandPlan()
  const iamPlan = buildGoNoGoIamPlan(runId)
  const status = qa.status === 'passed' && supabaseSyncResult.status === 'completed' ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const artifacts: GoNoGoArtifact[] = []
  const executionReport: GoNoGoExecutionReport = {
    ok: status === 'completed',
    phase: '52G',
    runId,
    createdAt,
    status,
    repoOwnershipAudit,
    evidenceContext,
    scopeClassifications,
    decisionPacket,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    exposureRegister,
    dispatchManifest,
    syncInput,
    milestoneBundle,
    schemaVerification,
    supabaseSyncResult,
    commandPlan,
    iamPlan,
    qa,
    artifacts,
    phase52HReadiness: status === 'completed' ? 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake' : 'blocked',
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
    executionReport.phase52HReadiness = 'blocked'
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(GO_NO_GO_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(GO_NO_GO_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: GO_NO_GO_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 52G IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: GoNoGoExecutionReport, artifacts: GoNoGoArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string, kind?: GoNoGoArtifact['kind']) => {
    try {
      const { localPath, artifact } = await writeGoNoGoLocalArtifact({ localRoot, bucket, object: objectPath, value, id, kind })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/audit/repo-ownership-audit.json`, report.repoOwnershipAudit, 'phase52g_repo_ownership_audit')
  await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/decision/controlled-internal-test-go-no-go-decision.json`, report.decisionPacket, 'phase52g_decision_packet')
  await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/plan/controlled-internal-test-packet.json`, report.controlledInternalTestPacket, 'phase52g_controlled_test_packet')
  await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/blockers/go-no-go-blocker-inventory.json`, report.blockerInventory, 'phase52g_blocker_inventory')
  await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/risks/go-no-go-exposure-register.json`, report.exposureRegister, 'phase52g_exposure_register')
  await upload(
    goNoGoConfig.generatedAssetsBucket,
    `${artifactPrefix}/prompts/owner-handoff-prompt-packets.json`,
    report.ownerPromptPackets.map((packet) => ({
      packetId: packet.packetId,
      fileName: packet.fileName,
      workstream: packet.workstream,
      owner: packet.owner,
      contentStoredSeparately: true,
    })),
    'phase52g_owner_prompts',
  )
  for (const packet of report.ownerPromptPackets) {
    await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/prompts/${packet.fileName}`, packet.content, packet.packetId, 'private_markdown')
  }
  await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/owner-handoff-dispatch-manifest.json`, report.dispatchManifest, 'phase52g_dispatch_manifest')
  await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/phase52g-milestone-sync-input.json`, report.syncInput, 'phase52g_sync_input')
  await upload(goNoGoConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/phase52g-milestone-sync-result.json`, report.supabaseSyncResult, 'phase52g_sync_result')
  await upload(goNoGoConfig.qaBucket, `${artifactPrefix}/qa/controlled-internal-test-go-no-go-qa.json`, report.qa, 'phase52g_qa')
  report.artifacts = artifacts
  await upload(goNoGoConfig.qaBucket, `${artifactPrefix}/reports/phase52g-report.json`, report, 'phase52g_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', goNoGoConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [goNoGoConfig.generatedAssetsBucket, goNoGoConfig.qaBucket]) {
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
