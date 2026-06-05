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
import { buildToolCapabilityRegistrySummary, recordsByTrack, toolCapabilityRecords } from './canonical-tool-capability-records'
import { writeToolCapabilityRegistryLocalArtifact } from './tool-capability-registry-artifacts'
import { buildToolCapabilityRegistryCommandPlan } from './tool-capability-registry-command-plan'
import { buildToolCapabilityRegistryIamPlan } from './tool-capability-registry-iam-plan'
import {
  makeToolCapabilityRegistryRunId,
  toolCapabilityRegistryArtifactPrefix,
  toolCapabilityRegistryConfig,
  toolCapabilityRegistrySafetyFlags,
  validateToolCapabilityRegistryExecutionEnv,
} from './tool-capability-registry-policy'
import { buildToolCapabilityRegistryQaSummary } from './tool-capability-registry-qa-summary'
import { TOOL_CAPABILITY_REGISTRY_LOCAL_REPORT_PATH, readToolCapabilityRegistryPackageScripts } from './tool-capability-registry-report-builder'
import {
  buildPhase52BSupabaseMilestoneBundle,
  buildPhase52BSupabaseSyncInput,
  readbackPhase52BRegistry,
} from './tool-capability-supabase-writer'
import { validateToolCapabilityRegistry } from './tool-capability-registry-validator'
import type {
  ToolCapabilityRegistryArtifact,
  ToolCapabilityRegistryExecutionReport,
  ToolCapabilityRegistrySupabaseSyncResult,
} from './tool-capability-registry-types'

const execFile = promisify(execFileCallback)

export async function runToolCapabilityRegistryAudit(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_TOOL_CAPABILITY_REGISTRY_AUDIT=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 52B.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateToolCapabilityRegistryExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE52B_RUN_ID ?? makeToolCapabilityRegistryRunId()
  const artifactPrefix = toolCapabilityRegistryArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase52b-tool-capability-registry-audit-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const blockers: string[] = []
  const warnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) blockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(blockers, warnings)
  await verifyBuckets(blockers)

  const validation = validateToolCapabilityRegistry(toolCapabilityRecords)
  blockers.push(...validation.blockers)
  warnings.push(...validation.warnings)

  const optimisticQa = buildToolCapabilityRegistryQaSummary({
    packageScripts: readToolCapabilityRegistryPackageScripts(),
    validation,
    executionMode: false,
  })
  const syncInput = buildPhase52BSupabaseSyncInput(runId, optimisticQa)
  const milestoneBundle = buildPhase52BSupabaseMilestoneBundle(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  const credentialResolution = await resolveSupabaseMilestoneCredentials()
  warnings.push(...credentialResolution.warnings)
  blockers.push(...credentialResolution.blockers)
  const client = credentialResolution.configured ? createSupabaseMilestoneServiceClient(credentialResolution) : undefined
  const schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
  blockers.push(...schemaVerification.blockers)

  let supabaseSyncResult: ToolCapabilityRegistrySupabaseSyncResult = {
    status: 'not_attempted',
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    milestoneWrite: {
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
      blockers,
      warnings,
    },
    activationRunReadback: false,
    toolCapabilityReadbackCount: 0,
    toolCapabilityReadbackExpected: toolCapabilityRecords.length,
    readinessSnapshotReadback: false,
    migrationsApplied: false,
    schemaChangesApplied: false,
    blockers,
    warnings,
  }

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, milestoneBundle)
    supabaseSyncResult = await readbackPhase52BRegistry({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

  const qa = buildToolCapabilityRegistryQaSummary({
    packageScripts: readToolCapabilityRegistryPackageScripts(),
    validation,
    supabaseSyncResult,
    executionMode: true,
  })
  const commandPlan = buildToolCapabilityRegistryCommandPlan()
  const iamPlan = buildToolCapabilityRegistryIamPlan(runId)
  const artifacts: ToolCapabilityRegistryArtifact[] = []
  const executionReport: ToolCapabilityRegistryExecutionReport = {
    ok: qa.status === 'passed' && supabaseSyncResult.status === 'completed',
    phase: '52B',
    runId,
    createdAt: new Date().toISOString(),
    status: qa.status === 'passed' && supabaseSyncResult.status === 'completed' ? 'completed' : 'blocked',
    registry: toolCapabilityRecords,
    registrySummary: buildToolCapabilityRegistrySummary(toolCapabilityRecords),
    validation,
    qa,
    commandPlan,
    iamPlan,
    schemaVerification,
    supabaseSyncInput: syncInput,
    supabaseMilestoneBundle: milestoneBundle,
    supabaseSyncPolicy: toolCapabilityRegistrySafetyFlags,
    supabaseSyncResult,
    artifacts,
    safetyFlags: toolCapabilityRegistrySafetyFlags,
    phase52CReadiness: qa.status === 'passed' && supabaseSyncResult.status === 'completed' ? 'ready_for_multi_agent_dry_run_on_existing_evidence' : 'blocked',
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.ok = false
    executionReport.status = 'blocked'
    executionReport.phase52CReadiness = 'blocked'
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(TOOL_CAPABILITY_REGISTRY_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(TOOL_CAPABILITY_REGISTRY_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: TOOL_CAPABILITY_REGISTRY_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 52B IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: ToolCapabilityRegistryExecutionReport, artifacts: ToolCapabilityRegistryArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeToolCapabilityRegistryLocalArtifact({ localRoot, bucket, object: objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  const generatedBucket = toolCapabilityRegistryConfig.generatedAssetsBucket
  const qaBucket = toolCapabilityRegistryConfig.qaBucket
  await upload(generatedBucket, `${artifactPrefix}/registry/tool-capability-registry.json`, report.registry, 'phase52b_tool_capability_registry')
  await upload(generatedBucket, `${artifactPrefix}/registry/tool-capability-summary.json`, report.registrySummary, 'phase52b_tool_capability_summary')
  await upload(generatedBucket, `${artifactPrefix}/registry/track-a-capabilities.json`, recordsByTrack('track_a_visual_video'), 'phase52b_track_a_capabilities')
  await upload(generatedBucket, `${artifactPrefix}/registry/web-search-capabilities.json`, recordsByTrack('web_search'), 'phase52b_web_search_capabilities')
  await upload(generatedBucket, `${artifactPrefix}/registry/map-geospatial-capabilities.json`, recordsByTrack('map_geospatial'), 'phase52b_map_geospatial_capabilities')
  await upload(generatedBucket, `${artifactPrefix}/registry/supabase-capabilities.json`, recordsByTrack('supabase'), 'phase52b_supabase_capabilities')
  await upload(generatedBucket, `${artifactPrefix}/registry/ai-tools-placeholder-capabilities.json`, recordsByTrack('ai_tools'), 'phase52b_ai_tools_placeholder_capabilities')
  await upload(generatedBucket, `${artifactPrefix}/registry/track-b-placeholder-capabilities.json`, recordsByTrack('track_b'), 'phase52b_track_b_placeholder_capabilities')
  await upload(generatedBucket, `${artifactPrefix}/validation/tool-capability-registry-validation.json`, report.validation, 'phase52b_registry_validation')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52b-tool-capability-write-result.json`, report.supabaseSyncResult, 'phase52b_tool_capability_write_result')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52b-milestone-sync-result.json`, report.supabaseSyncResult, 'phase52b_milestone_sync_result')
  await upload(qaBucket, `${artifactPrefix}/qa/tool-capability-registry-audit-qa.json`, report.qa, 'phase52b_qa')
  report.artifacts = artifacts
  await upload(qaBucket, `${artifactPrefix}/reports/phase52b-report.json`, report, 'phase52b_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', toolCapabilityRegistryConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [toolCapabilityRegistryConfig.generatedAssetsBucket, toolCapabilityRegistryConfig.qaBucket]) {
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
