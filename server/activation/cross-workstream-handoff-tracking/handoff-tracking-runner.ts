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
import {
  crossWorkstreamHandoffArtifactPrefix,
  crossWorkstreamHandoffConfig,
  makeCrossWorkstreamHandoffRunId,
  validateCrossWorkstreamHandoffTrackingEnv,
} from './cross-workstream-handoff-policy'
import { writeCrossWorkstreamLocalArtifact } from './handoff-tracking-artifacts'
import { buildCrossWorkstreamHandoffCommandPlan } from './handoff-tracking-command-plan'
import { buildCrossWorkstreamHandoffIamPlan } from './handoff-tracking-iam-plan'
import { buildCrossWorkstreamHandoffManifest, buildOwnerResponseIntakeInstructions } from './handoff-intake-manifest-builder'
import { buildCrossWorkstreamHandoffQaSummary } from './handoff-tracking-qa-summary'
import { CROSS_WORKSTREAM_HANDOFF_LOCAL_REPORT_PATH, readCrossWorkstreamHandoffDocsPresent, readCrossWorkstreamHandoffPackageScripts } from './handoff-tracking-report-builder'
import { buildCrossWorkstreamSourceAudit } from './handoff-source-audit'
import { resolveCrossWorkstreamHandoffEvidence } from './handoff-evidence-resolver'
import { buildOwnerPromptPacketReferences } from './owner-prompt-packet-references'
import { buildOwnerResponseLedger } from './handoff-tracking-ledger-builder'
import { buildOwnerResponseSchema } from './owner-response-schema'
import { buildOwnerResponseTemplate } from './owner-response-template-builder'
import {
  buildNotAttemptedPhase52HSyncResult,
  buildPhase52HSupabaseMilestoneBundle,
  buildPhase52HSupabaseSyncInput,
  readbackPhase52HMilestone,
} from './handoff-tracking-supabase-sync'
import type { CrossWorkstreamArtifact, CrossWorkstreamExecutionReport, CrossWorkstreamSupabaseSyncResult } from './cross-workstream-handoff-types'

const execFile = promisify(execFileCallback)

export async function runCrossWorkstreamHandoffTracking(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_CROSS_WORKSTREAM_HANDOFF_TRACKING=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 52H.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateCrossWorkstreamHandoffTrackingEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE52H_RUN_ID ?? makeCrossWorkstreamHandoffRunId()
  const createdAt = new Date().toISOString()
  const artifactPrefix = crossWorkstreamHandoffArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase52h-cross-workstream-${runId}`)
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

  const repoOwnershipAudit = buildCrossWorkstreamSourceAudit(new Date(createdAt))
  const evidenceContext = resolveCrossWorkstreamHandoffEvidence(repoOwnershipAudit)
  const ownerResponseSchema = buildOwnerResponseSchema()
  const ownerResponseTemplate = buildOwnerResponseTemplate()
  const ownerPromptPacketRefs = buildOwnerPromptPacketReferences(evidenceContext)
  const ownerResponseLedger = buildOwnerResponseLedger({ runId, evidence: evidenceContext, createdAt })
  const responseIntakeInstructions = buildOwnerResponseIntakeInstructions()
  blockers.push(...repoOwnershipAudit.blockers, ...evidenceContext.blockers)
  warnings.push(...repoOwnershipAudit.warnings, ...evidenceContext.warnings)

  const optimisticSync = buildNotAttemptedPhase52HSyncResult({ schemaPresent: schemaVerification.allTablesPresent })
  const optimisticManifest = buildCrossWorkstreamHandoffManifest({
    runId,
    repoOwnershipAudit,
    ownerResponseSchema,
    ownerResponseLedger,
    ownerPromptPacketRefs,
    responseIntakeInstructions,
    warnings,
    blockers,
    phase52IReady: true,
  })
  const optimisticQa = buildCrossWorkstreamHandoffQaSummary({
    packageScripts: readCrossWorkstreamHandoffPackageScripts(),
    docsPresent: readCrossWorkstreamHandoffDocsPresent(),
    repoOwnershipAudit,
    ownerResponseSchema,
    ownerResponseLedger,
    ownerPromptPacketRefs,
    intakeManifest: optimisticManifest,
    supabaseSyncResult: { ...optimisticSync, status: 'completed' },
    executionMode: true,
  })
  const syncInput = buildPhase52HSupabaseSyncInput(runId, optimisticQa)
  const milestoneBundle = buildPhase52HSupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: CrossWorkstreamSupabaseSyncResult = buildNotAttemptedPhase52HSyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, milestoneBundle)
    supabaseSyncResult = await readbackPhase52HMilestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

  const manifestBeforeQa = buildCrossWorkstreamHandoffManifest({
    runId,
    repoOwnershipAudit,
    ownerResponseSchema,
    ownerResponseLedger,
    ownerPromptPacketRefs,
    responseIntakeInstructions,
    warnings,
    blockers,
    phase52IReady: supabaseSyncResult.status === 'completed',
  })
  const qa = buildCrossWorkstreamHandoffQaSummary({
    packageScripts: readCrossWorkstreamHandoffPackageScripts(),
    docsPresent: readCrossWorkstreamHandoffDocsPresent(),
    repoOwnershipAudit,
    ownerResponseSchema,
    ownerResponseLedger,
    ownerPromptPacketRefs,
    intakeManifest: manifestBeforeQa,
    supabaseSyncResult,
    executionMode: true,
  })
  const intakeManifest = buildCrossWorkstreamHandoffManifest({
    runId,
    repoOwnershipAudit,
    ownerResponseSchema,
    ownerResponseLedger,
    ownerPromptPacketRefs,
    responseIntakeInstructions,
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    phase52IReady: qa.status === 'passed' && supabaseSyncResult.status === 'completed',
  })
  const status = qa.status === 'passed' && supabaseSyncResult.status === 'completed' ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const artifacts: CrossWorkstreamArtifact[] = []
  const executionReport: CrossWorkstreamExecutionReport = {
    ok: status === 'completed',
    phase: '52H',
    runId,
    createdAt,
    status,
    repoOwnershipAudit,
    evidenceContext,
    ownerResponseSchema,
    ownerResponseTemplate,
    ownerPromptPacketRefs,
    ownerResponseLedger,
    responseIntakeInstructions,
    intakeManifest,
    syncInput,
    milestoneBundle,
    schemaVerification,
    supabaseSyncResult,
    commandPlan: buildCrossWorkstreamHandoffCommandPlan(),
    iamPlan: buildCrossWorkstreamHandoffIamPlan(runId),
    qa,
    artifacts,
    phase52IReadiness: status === 'completed' ? 'ready_for_owner_response_intake_update' : 'blocked',
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
    executionReport.phase52IReadiness = 'blocked'
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(CROSS_WORKSTREAM_HANDOFF_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(CROSS_WORKSTREAM_HANDOFF_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: CROSS_WORKSTREAM_HANDOFF_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 52H IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: CrossWorkstreamExecutionReport, artifacts: CrossWorkstreamArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeCrossWorkstreamLocalArtifact({ localRoot, bucket, object: objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/audit/repo-ownership-audit.json`, report.repoOwnershipAudit, 'phase52h_repo_ownership_audit')
  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/schema/owner-response-schema.json`, report.ownerResponseSchema, 'phase52h_owner_response_schema')
  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/ledger/owner-response-tracking-ledger.json`, report.ownerResponseLedger, 'phase52h_owner_response_ledger')
  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/templates/owner-response-template.json`, report.ownerResponseTemplate, 'phase52h_owner_response_template')
  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/prompts/owner-prompt-packet-references.json`, report.ownerPromptPacketRefs, 'phase52h_owner_prompt_refs')
  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/intake/owner-response-intake-instructions.json`, report.responseIntakeInstructions, 'phase52h_intake_instructions')
  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/cross-workstream-handoff-tracking-manifest.json`, report.intakeManifest, 'phase52h_manifest')
  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/phase52h-milestone-sync-input.json`, report.syncInput, 'phase52h_sync_input')
  await upload(crossWorkstreamHandoffConfig.generatedAssetsBucket, `${artifactPrefix}/supabase/phase52h-milestone-sync-result.json`, report.supabaseSyncResult, 'phase52h_sync_result')
  await upload(crossWorkstreamHandoffConfig.qaBucket, `${artifactPrefix}/qa/cross-workstream-handoff-tracking-qa.json`, report.qa, 'phase52h_qa')
  report.artifacts = artifacts
  await upload(crossWorkstreamHandoffConfig.qaBucket, `${artifactPrefix}/reports/phase52h-report.json`, report, 'phase52h_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', crossWorkstreamHandoffConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [crossWorkstreamHandoffConfig.generatedAssetsBucket, crossWorkstreamHandoffConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
    if (result.ok && /allUsers|allAuthenticatedUsers/.test(result.stdout)) blockers.push(`Bucket gs://${bucket} output included a public principal.`)
  }
}

async function runGcloud(args: string[]): Promise<string> {
  const { stdout } = await execFile('gcloud', args, { maxBuffer: 1024 * 1024 * 8 })
  return stdout
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; error: string }> {
  try {
    const stdout = await runGcloud(args)
    return { ok: true, stdout }
  } catch (error) {
    return { ok: false, error: sanitizeCommandError(error instanceof Error ? error.message : String(error)) }
  }
}

function sanitizeCommandError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
