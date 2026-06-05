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
import { buildCandidateApprovedPlanSnapshots, buildBlockedPlanRecords } from './approved-plan-candidate-builder'
import { buildAgentToolPlanBridgeCommandPlan } from './agent-tool-plan-command-plan'
import { writeAgentToolPlanBridgeLocalArtifact } from './agent-tool-plan-artifacts'
import { buildAgentToolPlanBridgeIamPlan } from './agent-tool-plan-iam-plan'
import { buildAgentToolPlanBridgeManifest } from './agent-tool-plan-manifest-builder'
import {
  agentToolPlanBridgeArtifactPrefix,
  agentToolPlanBridgeConfig,
  agentToolPlanBridgeSafetyFlags,
  makeAgentToolPlanBridgeRunId,
  validateAgentToolPlanBridgeEnv,
} from './agent-tool-plan-bridge-policy'
import { buildAgentToolPlanBridgeQaSummary } from './agent-tool-plan-qa-summary'
import { AGENT_TOOL_PLAN_BRIDGE_LOCAL_REPORT_PATH, readAgentToolPlanBridgeDocsPresent, readAgentToolPlanBridgePackageScripts } from './agent-tool-plan-report-builder'
import {
  buildNotAttemptedPhase52DSyncResult,
  buildPhase52DSupabaseMilestoneBundle,
  buildPhase52DSupabaseSyncInput,
  readbackPhase52DMilestone,
} from './agent-tool-plan-supabase-sync'
import { buildAgentToolPlanSourceAudit } from './agent-tool-plan-source-audit'
import { resolveAgentToolPlanEvidenceContext } from './agent-tool-plan-evidence-resolver'
import { buildCrossTrackHandoffPackets } from './cross-track-handoff-builder'
import { validateAgentToolPlanScope } from './plan-scope-validator'
import { runAgentToolPlanProducerGate, validateAgentToolPlanProducerGate } from './producer-plan-gate'
import { runAgentToolPlanQaGate } from './qa-plan-gate'
import type {
  AgentToolPlanBridgeArtifact,
  AgentToolPlanBridgeExecutionReport,
  AgentToolPlanBridgeSupabaseSyncResult,
} from './agent-tool-plan-bridge-types'

const execFile = promisify(execFileCallback)

export async function runAgentToolPlanBridge(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_AGENT_TO_TOOL_PLAN_BRIDGE=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 52D.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateAgentToolPlanBridgeEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE52D_RUN_ID ?? makeAgentToolPlanBridgeRunId()
  const createdAt = new Date().toISOString()
  const artifactPrefix = agentToolPlanBridgeArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase52d-agent-tool-plan-bridge-${runId}`)
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

  const repoOwnershipAudit = buildAgentToolPlanSourceAudit(new Date(createdAt))
  const evidenceContext = await resolveAgentToolPlanEvidenceContext(client)
  blockers.push(...repoOwnershipAudit.blockers, ...evidenceContext.blockers)
  warnings.push(...repoOwnershipAudit.warnings, ...evidenceContext.warnings)

  const candidatePlans = buildCandidateApprovedPlanSnapshots({
    runId,
    createdAt,
    findings: evidenceContext.sourceAgentFindings,
    intents: evidenceContext.sourceEditIntents,
    producerGateResults: evidenceContext.sourceProducerGateResults,
  })
  const blockedPlans = buildBlockedPlanRecords({
    findings: evidenceContext.sourceAgentFindings,
    intents: evidenceContext.sourceEditIntents,
    producerGateResults: evidenceContext.sourceProducerGateResults,
  })
  const scopeValidation = validateAgentToolPlanScope({ candidatePlans, blockedPlans })
  blockers.push(...scopeValidation.blockers)
  warnings.push(...scopeValidation.warnings)

  const producerGateResults = runAgentToolPlanProducerGate({ candidatePlans, blockedPlans })
  const producerGate = validateAgentToolPlanProducerGate(producerGateResults)
  blockers.push(...producerGate.blockers)
  const handoffPackets = buildCrossTrackHandoffPackets({ runId, candidatePlans, blockedPlans })

  const optimisticManifest = buildAgentToolPlanBridgeManifest({
    runId,
    repoOwnershipAudit,
    findingCount: evidenceContext.sourceAgentFindings.length,
    editIntentCount: evidenceContext.sourceEditIntents.length,
    capabilityRecordCount: evidenceContext.capabilityRecords.length,
    candidatePlans,
    blockedPlans,
    handoffPackets,
    producerGateResults,
    qaPlanGateResults: [],
    sourceOfTruthSummary: evidenceContext.sourceOfTruthRules,
    supabaseMilestoneSyncStatus: 'not_attempted',
    blockers,
    warnings,
  })
  const optimisticQaPlanGates = runAgentToolPlanQaGate({ manifest: optimisticManifest, supabaseSyncStatus: 'completed' })
  const optimisticManifestWithQa = buildAgentToolPlanBridgeManifest({
    runId,
    repoOwnershipAudit,
    findingCount: evidenceContext.sourceAgentFindings.length,
    editIntentCount: evidenceContext.sourceEditIntents.length,
    capabilityRecordCount: evidenceContext.capabilityRecords.length,
    candidatePlans,
    blockedPlans,
    handoffPackets,
    producerGateResults,
    qaPlanGateResults: optimisticQaPlanGates,
    sourceOfTruthSummary: evidenceContext.sourceOfTruthRules,
    supabaseMilestoneSyncStatus: 'not_attempted',
    blockers,
    warnings,
  })
  const optimisticQa = buildAgentToolPlanBridgeQaSummary({
    packageScripts: readAgentToolPlanBridgePackageScripts(),
    docsPresent: readAgentToolPlanBridgeDocsPresent(),
    repoOwnershipAudit,
    candidatePlans,
    blockedPlans,
    producerGateResults,
    qaPlanGateResults: optimisticQaPlanGates,
    handoffPackets,
    manifest: optimisticManifestWithQa,
    scopeValidationBlockers: scopeValidation.blockers,
    producerGateBlockers: producerGate.blockers,
    executionMode: false,
  })
  const supabaseSyncInput = buildPhase52DSupabaseSyncInput(runId, optimisticQa)
  const supabaseMilestoneBundle = buildPhase52DSupabaseMilestoneBundle(supabaseSyncInput)
  const inputValidation = validateActivationMilestoneSyncInput(supabaseSyncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(supabaseMilestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: AgentToolPlanBridgeSupabaseSyncResult = buildNotAttemptedPhase52DSyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, supabaseMilestoneBundle)
    supabaseSyncResult = await readbackPhase52DMilestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

  const manifestBeforeQa = buildAgentToolPlanBridgeManifest({
    runId,
    repoOwnershipAudit,
    findingCount: evidenceContext.sourceAgentFindings.length,
    editIntentCount: evidenceContext.sourceEditIntents.length,
    capabilityRecordCount: evidenceContext.capabilityRecords.length,
    candidatePlans,
    blockedPlans,
    handoffPackets,
    producerGateResults,
    qaPlanGateResults: [],
    sourceOfTruthSummary: evidenceContext.sourceOfTruthRules,
    supabaseMilestoneSyncStatus: supabaseSyncResult.status === 'completed' ? 'completed' : 'blocked',
    blockers,
    warnings,
  })
  const qaPlanGateResults = runAgentToolPlanQaGate({
    manifest: manifestBeforeQa,
    supabaseSyncStatus: supabaseSyncResult.status === 'completed' ? 'completed' : 'blocked',
  })
  const manifest = buildAgentToolPlanBridgeManifest({
    runId,
    repoOwnershipAudit,
    findingCount: evidenceContext.sourceAgentFindings.length,
    editIntentCount: evidenceContext.sourceEditIntents.length,
    capabilityRecordCount: evidenceContext.capabilityRecords.length,
    candidatePlans,
    blockedPlans,
    handoffPackets,
    producerGateResults,
    qaPlanGateResults,
    sourceOfTruthSummary: evidenceContext.sourceOfTruthRules,
    supabaseMilestoneSyncStatus: supabaseSyncResult.status === 'completed' ? 'completed' : 'blocked',
    blockers,
    warnings,
  })
  const qa = buildAgentToolPlanBridgeQaSummary({
    packageScripts: readAgentToolPlanBridgePackageScripts(),
    docsPresent: readAgentToolPlanBridgeDocsPresent(),
    repoOwnershipAudit,
    candidatePlans,
    blockedPlans,
    producerGateResults,
    qaPlanGateResults,
    handoffPackets,
    manifest,
    scopeValidationBlockers: scopeValidation.blockers,
    producerGateBlockers: producerGate.blockers,
    supabaseSyncResult,
    executionMode: true,
  })
  const commandPlan = buildAgentToolPlanBridgeCommandPlan()
  const iamPlan = buildAgentToolPlanBridgeIamPlan(runId)
  const artifacts: AgentToolPlanBridgeArtifact[] = []
  const status = qa.status === 'passed' && supabaseSyncResult.status === 'completed' ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const executionReport: AgentToolPlanBridgeExecutionReport = {
    ok: status === 'completed',
    phase: '52D',
    runId,
    createdAt,
    status,
    repoOwnershipAudit,
    evidenceContext,
    candidatePlans,
    blockedPlans,
    producerGateResults,
    qaPlanGateResults,
    handoffPackets,
    manifest,
    qa,
    commandPlan,
    iamPlan,
    schemaVerification,
    supabaseSyncInput,
    supabaseMilestoneBundle,
    supabaseSyncPolicy: agentToolPlanBridgeSafetyFlags,
    supabaseSyncResult,
    artifacts,
    safetyFlags: agentToolPlanBridgeSafetyFlags,
    phase52EReadiness: status === 'completed' ? 'ready_for_approved_plan_snapshot_validation_system_reconciliation' : 'blocked',
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.ok = false
    executionReport.status = 'blocked'
    executionReport.phase52EReadiness = 'blocked'
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
    executionReport.manifest.phase52EReadiness = 'blocked'
  }

  await mkdir(path.dirname(AGENT_TOOL_PLAN_BRIDGE_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(AGENT_TOOL_PLAN_BRIDGE_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: AGENT_TOOL_PLAN_BRIDGE_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 52D IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(
  localRoot: string,
  artifactPrefix: string,
  report: AgentToolPlanBridgeExecutionReport,
  artifacts: AgentToolPlanBridgeArtifact[],
): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeAgentToolPlanBridgeLocalArtifact({ localRoot, bucket, object: objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  const generatedBucket = agentToolPlanBridgeConfig.generatedAssetsBucket
  const qaBucket = agentToolPlanBridgeConfig.qaBucket
  await upload(generatedBucket, `${artifactPrefix}/audit/repo-ownership-audit.json`, report.repoOwnershipAudit, 'phase52d_repo_ownership_audit')
  await upload(generatedBucket, `${artifactPrefix}/evidence/agent-tool-plan-evidence-context.json`, report.evidenceContext, 'phase52d_evidence_context')
  await upload(generatedBucket, `${artifactPrefix}/plans/candidate-approved-plan-snapshots.json`, report.candidatePlans, 'phase52d_candidate_plans')
  await upload(generatedBucket, `${artifactPrefix}/plans/blocked-plan-records.json`, report.blockedPlans, 'phase52d_blocked_plans')
  await upload(generatedBucket, `${artifactPrefix}/gates/producer-plan-gate-results.json`, report.producerGateResults, 'phase52d_producer_gate')
  await upload(generatedBucket, `${artifactPrefix}/gates/qa-plan-gate-results.json`, report.qaPlanGateResults, 'phase52d_qa_gate')
  await upload(generatedBucket, `${artifactPrefix}/handoff/agent-tool-plan-handoff-packets.json`, report.handoffPackets, 'phase52d_handoff_packets')
  for (const packet of report.handoffPackets) {
    await upload(generatedBucket, `${artifactPrefix}/handoff/${packet.packetId}.json`, packet, packet.packetId)
  }
  await upload(generatedBucket, `${artifactPrefix}/manifest/agent-tool-plan-bridge-manifest.json`, report.manifest, 'phase52d_manifest')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52d-milestone-sync-input.json`, report.supabaseSyncInput, 'phase52d_sync_input')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52d-milestone-sync-result.json`, report.supabaseSyncResult, 'phase52d_sync_result')
  await upload(qaBucket, `${artifactPrefix}/qa/agent-tool-plan-bridge-qa.json`, report.qa, 'phase52d_qa')
  report.artifacts = artifacts
  await upload(qaBucket, `${artifactPrefix}/reports/phase52d-report.json`, report, 'phase52d_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', agentToolPlanBridgeConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [agentToolPlanBridgeConfig.generatedAssetsBucket, agentToolPlanBridgeConfig.qaBucket]) {
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
