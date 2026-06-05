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
import { writeApprovedPlanValidationLocalArtifact } from './approved-plan-validation-artifacts'
import { buildApprovedPlanValidationCommandPlan } from './approved-plan-validation-command-plan'
import { resolveApprovedPlanEvidenceContext } from './approved-plan-evidence-resolver'
import { validateApprovedPlanFeatureGates } from './approved-plan-feature-gate-validator'
import { buildApprovedPlanValidationIamPlan } from './approved-plan-validation-iam-plan'
import { buildApprovedPlanValidationManifest } from './approved-plan-validation-manifest-builder'
import {
  approvedPlanValidationArtifactPrefix,
  approvedPlanValidationConfig,
  approvedPlanValidationSafetyFlags,
  makeApprovedPlanValidationRunId,
  validateApprovedPlanValidationEnv,
} from './approved-plan-validation-policy'
import { buildApprovedPlanValidationQaSummary } from './approved-plan-validation-qa-summary'
import { APPROVED_PLAN_VALIDATION_LOCAL_REPORT_PATH, readApprovedPlanValidationDocsPresent, readApprovedPlanValidationPackageScripts } from './approved-plan-validation-report-builder'
import {
  buildNotAttemptedPhase52ESyncResult,
  buildPhase52ESupabaseMilestoneBundle,
  buildPhase52ESupabaseSyncInput,
  readbackPhase52EMilestone,
} from './approved-plan-validation-supabase-sync'
import { buildApprovedPlanSourceAudit } from './approved-plan-source-audit'
import { buildMissingContractInventory } from './missing-contract-inventory'
import { validateApprovedPlanOwnership } from './approved-plan-ownership-validator'
import { validateApprovedPlanRuntimeBlocks } from './approved-plan-runtime-block-validator'
import { validateBlockedPlanSchemas, validateCandidateApprovedPlanSchemas } from './approved-plan-schema-validator'
import { buildSystemReconciliationSummary } from './system-reconciliation-builder'
import { buildValidatedHandoffPackets } from './validated-handoff-builder'
import type { ApprovedPlanValidationArtifact, ApprovedPlanValidationExecutionReport, ApprovedPlanValidationSupabaseSyncResult } from './approved-plan-validation-types'

const execFile = promisify(execFileCallback)

export async function runApprovedPlanValidation(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_VALIDATION=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 52E.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateApprovedPlanValidationEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE52E_RUN_ID ?? makeApprovedPlanValidationRunId()
  const createdAt = new Date().toISOString()
  const artifactPrefix = approvedPlanValidationArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase52e-approved-plan-validation-${runId}`)
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

  const repoOwnershipAudit = buildApprovedPlanSourceAudit(new Date(createdAt))
  const evidenceContext = await resolveApprovedPlanEvidenceContext({ preferPrivateGcs: true })
  blockers.push(...repoOwnershipAudit.blockers, ...evidenceContext.blockers)
  warnings.push(...repoOwnershipAudit.warnings, ...evidenceContext.warnings)

  const candidateSchemaValidation = validateCandidateApprovedPlanSchemas(evidenceContext.candidatePlans)
  const blockedPlanValidation = validateBlockedPlanSchemas(evidenceContext.blockedPlans)
  const ownershipValidation = validateApprovedPlanOwnership({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
  const runtimeBlockValidation = validateApprovedPlanRuntimeBlocks({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
  const featureGateValidation = validateApprovedPlanFeatureGates({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
  const missingContractInventory = buildMissingContractInventory(repoOwnershipAudit)
  const systemReconciliation = buildSystemReconciliationSummary({
    evidenceContext,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    missingContractInventory,
  })
  const validatedHandoffs = buildValidatedHandoffPackets({ runId, sourceHandoffs: evidenceContext.handoffPackets, missingContractInventory })

  const optimisticSync = buildNotAttemptedPhase52ESyncResult({ schemaPresent: schemaVerification.allTablesPresent })
  const optimisticManifest = buildApprovedPlanValidationManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    supabaseSyncResult: optimisticSync,
    blockers,
    warnings,
  })
  const optimisticQa = buildApprovedPlanValidationQaSummary({
    packageScripts: readApprovedPlanValidationPackageScripts(),
    docsPresent: readApprovedPlanValidationDocsPresent(),
    repoOwnershipAudit,
    evidenceContext,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    manifest: optimisticManifest,
    supabaseSyncResult: { ...optimisticSync, status: 'completed' },
    executionMode: true,
  })
  const supabaseSyncInput = buildPhase52ESupabaseSyncInput(runId, optimisticQa)
  const supabaseMilestoneBundle = buildPhase52ESupabaseMilestoneBundle(supabaseSyncInput)
  const inputValidation = validateActivationMilestoneSyncInput(supabaseSyncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(supabaseMilestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: ApprovedPlanValidationSupabaseSyncResult = buildNotAttemptedPhase52ESyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, supabaseMilestoneBundle)
    supabaseSyncResult = await readbackPhase52EMilestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

  const manifestBeforeQa = buildApprovedPlanValidationManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    supabaseSyncResult,
    blockers,
    warnings,
  })
  const qa = buildApprovedPlanValidationQaSummary({
    packageScripts: readApprovedPlanValidationPackageScripts(),
    docsPresent: readApprovedPlanValidationDocsPresent(),
    repoOwnershipAudit,
    evidenceContext,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    manifest: manifestBeforeQa,
    supabaseSyncResult,
    executionMode: true,
  })
  const manifest = buildApprovedPlanValidationManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    qa,
    supabaseSyncResult,
    blockers,
    warnings,
  })
  const commandPlan = buildApprovedPlanValidationCommandPlan()
  const iamPlan = buildApprovedPlanValidationIamPlan(runId)
  const artifacts: ApprovedPlanValidationArtifact[] = []
  const status = qa.status === 'passed' && supabaseSyncResult.status === 'completed' ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const executionReport: ApprovedPlanValidationExecutionReport = {
    ok: status === 'completed',
    phase: '52E',
    runId,
    createdAt,
    status,
    repoOwnershipAudit,
    evidenceContext,
    candidatePlans: evidenceContext.candidatePlans,
    blockedPlans: evidenceContext.blockedPlans,
    candidateSchemaValidation,
    blockedPlanValidation,
    ownershipValidation,
    runtimeBlockValidation,
    featureGateValidation,
    systemReconciliation,
    missingContractInventory,
    validatedHandoffs,
    manifest,
    qa,
    commandPlan,
    iamPlan,
    schemaVerification,
    supabaseSyncInput,
    supabaseMilestoneBundle,
    supabaseSyncPolicy: approvedPlanValidationSafetyFlags,
    supabaseSyncResult,
    artifacts,
    safetyFlags: approvedPlanValidationSafetyFlags,
    phase52FReadiness: status === 'completed' ? 'ready_for_system_readiness_reconciliation_controlled_internal_test_planning' : 'blocked',
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.ok = false
    executionReport.status = 'blocked'
    executionReport.phase52FReadiness = 'blocked'
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
    executionReport.manifest.phase52FReadiness = 'blocked'
  }

  await mkdir(path.dirname(APPROVED_PLAN_VALIDATION_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(APPROVED_PLAN_VALIDATION_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: APPROVED_PLAN_VALIDATION_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 52E IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(
  localRoot: string,
  artifactPrefix: string,
  report: ApprovedPlanValidationExecutionReport,
  artifacts: ApprovedPlanValidationArtifact[],
): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeApprovedPlanValidationLocalArtifact({ localRoot, bucket, object: objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  const generatedBucket = approvedPlanValidationConfig.generatedAssetsBucket
  const qaBucket = approvedPlanValidationConfig.qaBucket
  await upload(generatedBucket, `${artifactPrefix}/audit/repo-ownership-audit.json`, report.repoOwnershipAudit, 'phase52e_repo_ownership_audit')
  await upload(generatedBucket, `${artifactPrefix}/evidence/approved-plan-validation-evidence-context.json`, report.evidenceContext, 'phase52e_evidence_context')
  await upload(generatedBucket, `${artifactPrefix}/validation/approved-plan-schema-validation.json`, { candidateSchemaValidation: report.candidateSchemaValidation, blockedPlanValidation: report.blockedPlanValidation }, 'phase52e_schema_validation')
  await upload(generatedBucket, `${artifactPrefix}/validation/ownership-validation.json`, report.ownershipValidation, 'phase52e_ownership_validation')
  await upload(generatedBucket, `${artifactPrefix}/validation/runtime-block-validation.json`, report.runtimeBlockValidation, 'phase52e_runtime_block_validation')
  await upload(generatedBucket, `${artifactPrefix}/validation/feature-gate-validation.json`, report.featureGateValidation, 'phase52e_feature_gate_validation')
  await upload(generatedBucket, `${artifactPrefix}/reconciliation/system-reconciliation-summary.json`, report.systemReconciliation, 'phase52e_system_reconciliation')
  await upload(generatedBucket, `${artifactPrefix}/reconciliation/missing-contract-inventory.json`, report.missingContractInventory, 'phase52e_missing_contracts')
  await upload(generatedBucket, `${artifactPrefix}/handoff/validated-handoff-packets.json`, report.validatedHandoffs, 'phase52e_validated_handoffs')
  for (const handoff of report.validatedHandoffs) {
    await upload(generatedBucket, `${artifactPrefix}/handoff/${handoff.packetId}.json`, handoff, handoff.packetId)
  }
  await upload(generatedBucket, `${artifactPrefix}/manifest/approved-plan-snapshot-validation-manifest.json`, report.manifest, 'phase52e_manifest')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52e-milestone-sync-input.json`, report.supabaseSyncInput, 'phase52e_sync_input')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52e-milestone-sync-result.json`, report.supabaseSyncResult, 'phase52e_sync_result')
  await upload(qaBucket, `${artifactPrefix}/qa/approved-plan-snapshot-validation-qa.json`, report.qa, 'phase52e_qa')
  report.artifacts = artifacts
  await upload(qaBucket, `${artifactPrefix}/reports/phase52e-report.json`, report, 'phase52e_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', approvedPlanValidationConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [approvedPlanValidationConfig.generatedAssetsBucket, approvedPlanValidationConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket ${bucket}: ${result.error}`)
    if (result.ok && /allUsers|allAuthenticatedUsers/.test(result.stdout)) blockers.push(`Private bucket ${bucket} appears to include a public principal.`)
  }
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; error: string }> {
  try {
    const { stdout } = await execFile('gcloud', args, { maxBuffer: 16 * 1024 * 1024 })
    return { ok: true, stdout }
  } catch (error) {
    return { ok: false, error: sanitizeCommandError(error instanceof Error ? error.message : String(error)) }
  }
}

async function runGcloud(args: string[]): Promise<void> {
  await execFile('gcloud', args, { maxBuffer: 16 * 1024 * 1024 })
}

function sanitizeCommandError(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 700)
}
