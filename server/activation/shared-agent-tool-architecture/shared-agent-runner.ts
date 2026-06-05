import { execFile as execFileCallback } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createSupabaseMilestoneServiceClient,
  inspectSupabaseMilestoneRegistryTables,
  readActivationRun,
  resolveSupabaseMilestoneCredentials,
  writeMilestoneBundle,
} from '../supabase-milestone-registry'
import { validateActivationMilestoneSyncBundle, validateActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { agentFindingSchema } from './agent-finding-schema'
import { agentRoleRegistry } from './agent-role-registry'
import { agentToolRoutingPolicy } from './agent-tool-routing-policy'
import { approvedPlanSnapshotSchema } from './approved-plan-snapshot-schema'
import { artifactSourceOfTruthPolicy } from './artifact-source-of-truth-policy'
import { crossTrackHandoffTemplate } from './cross-track-handoff-template'
import { editIntentSchema } from './edit-intent-schema'
import { sharedAgentToolArchitectureSafetyFlags } from './shared-agent-tool-architecture-policy'
import { toolCapabilityManifestSchema } from './tool-capability-manifest-schema'
import { toolOwnershipMap } from './tool-ownership-map'
import { writeSharedAgentToolArchitectureLocalArtifact } from './shared-agent-artifact-writer'
import { buildSharedAgentToolArchitectureCommandPlan } from './shared-agent-command-plan'
import { buildSharedAgentToolArchitectureIamPlan } from './shared-agent-iam-plan'
import { buildSharedAgentToolArchitectureQaSummary } from './shared-agent-qa-summary'
import {
  makeSharedAgentToolArchitectureRunId,
  sharedAgentToolArchitectureArtifactPrefix,
  sharedAgentToolArchitectureConfig,
  validateSharedAgentToolArchitectureExecutionEnv,
} from './shared-agent-tool-architecture-policy'
import { SHARED_AGENT_TOOL_ARCHITECTURE_LOCAL_REPORT_PATH } from './shared-agent-report-builder'
import {
  buildPhase52ASupabaseMilestoneBundle,
  buildPhase52ASupabaseSyncInput,
  sharedAgentToolArchitectureSupabaseSyncPolicy,
} from './shared-agent-supabase-sync'
import type {
  SharedAgentToolArchitectureArtifact,
  SharedAgentToolArchitectureExecutionReport,
  SharedAgentToolArchitectureSupabaseSyncResult,
} from './shared-agent-tool-architecture-types'

const execFile = promisify(execFileCallback)

export async function runSharedAgentToolArchitecture(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_SHARED_AGENT_TOOL_ARCHITECTURE=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 52A.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateSharedAgentToolArchitectureExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE52A_RUN_ID ?? makeSharedAgentToolArchitectureRunId()
  const artifactPrefix = sharedAgentToolArchitectureArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase52a-shared-agent-tool-architecture-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const blockers: string[] = []
  const warnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) blockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(blockers, warnings)
  await verifyBuckets(blockers)

  const optimisticQa = buildSharedAgentToolArchitectureQaSummary(readPackageScripts(), { supabaseMilestoneSyncPassed: true, executionMode: true })
  const supabaseSyncInput = buildPhase52ASupabaseSyncInput(runId, optimisticQa)
  const supabaseMilestoneBundle = buildPhase52ASupabaseMilestoneBundle(supabaseSyncInput)
  const inputValidation = validateActivationMilestoneSyncInput(supabaseSyncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(supabaseMilestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  const credentialResolution = await resolveSupabaseMilestoneCredentials()
  warnings.push(...credentialResolution.warnings)
  blockers.push(...credentialResolution.blockers)
  const client = credentialResolution.configured ? createSupabaseMilestoneServiceClient(credentialResolution) : undefined
  const schemaVerification = await inspectSupabaseMilestoneRegistryTables(client)
  blockers.push(...schemaVerification.blockers)

  let supabaseSyncResult: SharedAgentToolArchitectureSupabaseSyncResult = {
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
      blockers,
      warnings,
    },
    readbackMatched: false,
    writesLimitedToMilestoneRegistry: true,
    migrationsApplied: false,
    historicalBackfillRerun: false,
    blockers,
    warnings,
  }

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const writeVerification = await writeMilestoneBundle(client, supabaseMilestoneBundle)
    const readback = await safeReadback(client, supabaseMilestoneBundle.phaseId, supabaseMilestoneBundle.runId)
    supabaseSyncResult = {
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
      warnings: [...writeVerification.warnings, ...readback.warnings, ...warnings],
    }
  }

  const qa = buildSharedAgentToolArchitectureQaSummary(readPackageScripts(), {
    supabaseMilestoneSyncPassed: supabaseSyncResult.status === 'completed' && supabaseSyncResult.readbackMatched,
    executionMode: true,
  })
  const commandPlan = buildSharedAgentToolArchitectureCommandPlan()
  const iamPlan = buildSharedAgentToolArchitectureIamPlan(runId)
  const artifacts: SharedAgentToolArchitectureArtifact[] = []
  const executionReport: SharedAgentToolArchitectureExecutionReport = {
    ok: supabaseSyncResult.status === 'completed' && qa.status === 'passed',
    phase: '52A',
    runId,
    createdAt: new Date().toISOString(),
    mode: sharedAgentToolArchitectureConfig.mode,
    projectId: sharedAgentToolArchitectureConfig.projectId,
    region: sharedAgentToolArchitectureConfig.region,
    env: sharedAgentToolArchitectureConfig.env,
    agentRegistry: agentRoleRegistry,
    toolOwnershipMap,
    capabilityManifestSchema: toolCapabilityManifestSchema,
    agentFindingSchema,
    editIntentSchema,
    approvedPlanSnapshotSchema,
    routingPolicy: agentToolRoutingPolicy,
    sourceOfTruthPolicy: artifactSourceOfTruthPolicy,
    crossTrackHandoffTemplate,
    commandPlan,
    iamPlan,
    schemaVerification,
    supabaseSyncInput,
    supabaseMilestoneBundle,
    supabaseSyncPolicy: sharedAgentToolArchitectureSupabaseSyncPolicy,
    supabaseSyncResult,
    qa,
    safetyFlags: sharedAgentToolArchitectureSafetyFlags,
    artifacts,
    phase52BReadiness: supabaseSyncResult.status === 'completed' && qa.status === 'passed' ? 'ready_for_tool_capability_registry_audit' : 'blocked',
    blockers: Array.from(new Set([...qa.blockers, ...supabaseSyncResult.blockers])),
    warnings: Array.from(new Set([...qa.warnings, ...supabaseSyncResult.warnings])),
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.ok = false
    executionReport.phase52BReadiness = 'blocked'
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(SHARED_AGENT_TOOL_ARCHITECTURE_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(SHARED_AGENT_TOOL_ARCHITECTURE_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: SHARED_AGENT_TOOL_ARCHITECTURE_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 52A IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

function buildArchitectureManifest(runId: string) {
  return {
    phase: '52A',
    runId,
    basePhase: sharedAgentToolArchitectureConfig.basePhase,
    baseEvidence: sharedAgentToolArchitectureConfig.canonicalPhase51DRunId,
    agentCount: agentRoleRegistry.length,
    ownershipGroups: toolOwnershipMap.groups.map((group) => group.ownerId),
    schemas: [
      toolCapabilityManifestSchema.schemaId,
      agentFindingSchema.schemaId,
      editIntentSchema.schemaId,
      approvedPlanSnapshotSchema.schemaId,
    ],
    policies: [
      agentToolRoutingPolicy.policyId,
      artifactSourceOfTruthPolicy.policyId,
      crossTrackHandoffTemplate.templateId,
    ],
    rawPromptExecutionAllowed: false,
    publicArtifactsAllowed: false,
    directAgentToolExecutionAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

async function uploadExecutionArtifacts(localRoot: string, artifactPrefix: string, report: SharedAgentToolArchitectureExecutionReport, artifacts: SharedAgentToolArchitectureArtifact[]): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeSharedAgentToolArchitectureLocalArtifact({ localRoot, bucket, object: objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  const generatedBucket = sharedAgentToolArchitectureConfig.generatedAssetsBucket
  const qaBucket = sharedAgentToolArchitectureConfig.qaBucket
  await upload(generatedBucket, `${artifactPrefix}/architecture/agent-role-registry.json`, agentRoleRegistry, 'phase52a_agent_roles')
  await upload(generatedBucket, `${artifactPrefix}/architecture/tool-ownership-map.json`, toolOwnershipMap, 'phase52a_tool_ownership')
  await upload(generatedBucket, `${artifactPrefix}/schemas/tool-capability-manifest-schema.json`, toolCapabilityManifestSchema, 'phase52a_capability_schema')
  await upload(generatedBucket, `${artifactPrefix}/schemas/agent-finding-schema.json`, agentFindingSchema, 'phase52a_agent_finding_schema')
  await upload(generatedBucket, `${artifactPrefix}/schemas/edit-intent-schema.json`, editIntentSchema, 'phase52a_edit_intent_schema')
  await upload(generatedBucket, `${artifactPrefix}/schemas/approved-plan-snapshot-schema.json`, approvedPlanSnapshotSchema, 'phase52a_approved_snapshot_schema')
  await upload(generatedBucket, `${artifactPrefix}/policy/agent-tool-routing-policy.json`, agentToolRoutingPolicy, 'phase52a_routing_policy')
  await upload(generatedBucket, `${artifactPrefix}/policy/source-of-truth-policy.json`, artifactSourceOfTruthPolicy, 'phase52a_source_of_truth_policy')
  await upload(generatedBucket, `${artifactPrefix}/handoff/cross-track-handoff-template.json`, crossTrackHandoffTemplate, 'phase52a_handoff_template')
  await upload(generatedBucket, `${artifactPrefix}/manifest/shared-agent-tool-architecture-manifest.json`, buildArchitectureManifest(report.runId), 'phase52a_manifest')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52a-milestone-sync-input.json`, report.supabaseSyncInput, 'phase52a_sync_input')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52a-milestone-sync-result.json`, report.supabaseSyncResult, 'phase52a_sync_result')
  await upload(qaBucket, `${artifactPrefix}/qa/shared-agent-tool-architecture-qa.json`, report.qa, 'phase52a_qa')
  report.artifacts = artifacts
  await upload(qaBucket, `${artifactPrefix}/reports/phase52a-report.json`, report, 'phase52a_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', sharedAgentToolArchitectureConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [sharedAgentToolArchitectureConfig.generatedAssetsBucket, sharedAgentToolArchitectureConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
    const iam = await safeGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (!iam.ok) blockers.push(`Unable to inspect IAM for private bucket gs://${bucket}: ${iam.error}`)
    else if (iam.stdout.includes('allUsers') || iam.stdout.includes('allAuthenticatedUsers')) blockers.push(`Private bucket gs://${bucket} exposes a public principal.`)
  }
}

async function safeReadback(client: SupabaseClient, phaseId: string, runId: string): Promise<{ readbackMatched: boolean; blockers: string[]; warnings: string[] }> {
  try {
    const readback = await readActivationRun(client, phaseId, runId)
    const matched = readback?.run_id === runId
    return {
      readbackMatched: matched,
      blockers: matched ? [] : [`Activation run ${phaseId}/${runId} was not found during readback.`],
      warnings: [],
    }
  } catch (error) {
    return {
      readbackMatched: false,
      blockers: [sanitizeCommandError(error instanceof Error ? error.message : String(error))],
      warnings: [],
    }
  }
}

function readPackageScripts(): Record<string, string> {
  return JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>
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
