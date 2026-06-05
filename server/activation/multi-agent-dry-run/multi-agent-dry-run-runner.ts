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
import { attachQaSafetyGateSummary, buildMultiAgentDryRunManifest } from './agent-dry-run-manifest-builder'
import { multiAgentDryRunScenarios } from './agent-dry-run-scenarios'
import { generateMultiAgentFindings, validateFindingSchemaCompliance } from './agent-finding-generator'
import { generateEditIntentCandidates, validateEditIntentSchemaCompliance } from './edit-intent-candidate-generator'
import { writeMultiAgentDryRunLocalArtifact } from './multi-agent-dry-run-artifacts'
import { buildMultiAgentDryRunCommandPlan } from './multi-agent-dry-run-command-plan'
import { buildMultiAgentDryRunIamPlan } from './multi-agent-dry-run-iam-plan'
import {
  makeMultiAgentDryRunRunId,
  multiAgentDryRunArtifactPrefix,
  multiAgentDryRunConfig,
  multiAgentDryRunSafetyFlags,
  validateMultiAgentDryRunExecutionEnv,
} from './multi-agent-dry-run-policy'
import { buildMultiAgentDryRunQaSummary } from './multi-agent-dry-run-qa-summary'
import { MULTI_AGENT_DRY_RUN_LOCAL_REPORT_PATH, readMultiAgentDryRunPackageScripts } from './multi-agent-dry-run-report-builder'
import {
  buildNotAttemptedPhase52CSyncResult,
  buildPhase52CSupabaseMilestoneBundle,
  buildPhase52CSupabaseSyncInput,
  readbackPhase52CMilestone,
} from './multi-agent-supabase-sync'
import { loadExecutedToolCapabilityContext } from './tool-capability-context-loader'
import { runProducerGate, validateProducerGate } from './producer-gate-runner'
import { runQaSafetyGate } from './qa-safety-gate-runner'
import type {
  MultiAgentDryRunArtifact,
  MultiAgentDryRunExecutionReport,
  MultiAgentDryRunSupabaseSyncResult,
} from './multi-agent-dry-run-types'

const execFile = promisify(execFileCallback)

export async function runMultiAgentDryRun(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_MULTI_AGENT_DRY_RUN=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to run Phase 52C.')

  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateMultiAgentDryRunExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE52C_RUN_ID ?? makeMultiAgentDryRunRunId()
  const artifactPrefix = multiAgentDryRunArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase52c-multi-agent-dry-run-${runId}`)
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

  const evidenceContext = await loadExecutedToolCapabilityContext(client)
  blockers.push(...evidenceContext.supabaseCapabilityReadback.blockers)
  warnings.push(...evidenceContext.supabaseCapabilityReadback.warnings)

  const scenarios = multiAgentDryRunScenarios
  const findings = generateMultiAgentFindings(scenarios)
  const editIntents = generateEditIntentCandidates(scenarios, evidenceContext.capabilities)
  const producerGateResults = runProducerGate(editIntents, evidenceContext.capabilities)
  const findingSchema = validateFindingSchemaCompliance(findings)
  const intentSchema = validateEditIntentSchemaCompliance(editIntents)
  const producerGate = validateProducerGate(producerGateResults)
  blockers.push(...findingSchema.blockers, ...intentSchema.blockers, ...producerGate.blockers)

  const optimisticManifest = buildMultiAgentDryRunManifest({
    runId,
    scenarios,
    findings,
    editIntents,
    producerGateResults,
    sourceOfTruthPolicy: evidenceContext.sourceOfTruthRules,
    supabaseMilestoneSyncStatus: 'not_attempted',
  })
  const optimisticQaSafety = runQaSafetyGate({ manifest: optimisticManifest, supabaseSyncStatus: 'completed' })
  const optimisticManifestWithQa = attachQaSafetyGateSummary(optimisticManifest, {
    passed: optimisticQaSafety.filter((gate) => gate.status === 'passed').length,
    blocked: optimisticQaSafety.filter((gate) => gate.status === 'blocked').length,
  })
  const optimisticQa = buildMultiAgentDryRunQaSummary({
    packageScripts: readMultiAgentDryRunPackageScripts(),
    scenarios,
    findings,
    editIntents,
    producerGateResults,
    qaSafetyGateResults: optimisticQaSafety,
    manifest: optimisticManifestWithQa,
    findingSchemaBlockers: findingSchema.blockers,
    intentSchemaBlockers: intentSchema.blockers,
    producerGateBlockers: producerGate.blockers,
    executionMode: false,
  })
  const supabaseSyncInput = buildPhase52CSupabaseSyncInput(runId, optimisticQa)
  const supabaseMilestoneBundle = buildPhase52CSupabaseMilestoneBundle(supabaseSyncInput)
  const inputValidation = validateActivationMilestoneSyncInput(supabaseSyncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(supabaseMilestoneBundle)
  blockers.push(...inputValidation.blockers, ...bundleValidation.blockers)
  warnings.push(...inputValidation.warnings, ...bundleValidation.warnings)

  let supabaseSyncResult: MultiAgentDryRunSupabaseSyncResult = buildNotAttemptedPhase52CSyncResult({
    schemaPresent: schemaVerification.allTablesPresent,
    inputValidated: inputValidation.ok,
    bundleValidated: bundleValidation.ok,
    blockers,
    warnings,
  })

  if (client && schemaVerification.allTablesPresent && inputValidation.ok && bundleValidation.ok && blockers.length === 0) {
    const milestoneWrite = await writeMilestoneBundle(client, supabaseMilestoneBundle)
    supabaseSyncResult = await readbackPhase52CMilestone({
      client,
      runId,
      schemaVerification,
      milestoneWrite,
      inputValidated: inputValidation.ok,
      bundleValidated: bundleValidation.ok,
    })
  }

  const manifestBeforeQa = buildMultiAgentDryRunManifest({
    runId,
    scenarios,
    findings,
    editIntents,
    producerGateResults,
    sourceOfTruthPolicy: evidenceContext.sourceOfTruthRules,
    supabaseMilestoneSyncStatus: supabaseSyncResult.status === 'completed' ? 'completed' : 'blocked',
  })
  const qaSafetyGateResults = runQaSafetyGate({
    manifest: manifestBeforeQa,
    supabaseSyncStatus: supabaseSyncResult.status === 'completed' ? 'completed' : 'blocked',
  })
  const manifest = attachQaSafetyGateSummary(manifestBeforeQa, {
    passed: qaSafetyGateResults.filter((gate) => gate.status === 'passed').length,
    blocked: qaSafetyGateResults.filter((gate) => gate.status === 'blocked').length,
  })
  const qa = buildMultiAgentDryRunQaSummary({
    packageScripts: readMultiAgentDryRunPackageScripts(),
    scenarios,
    findings,
    editIntents,
    producerGateResults,
    qaSafetyGateResults,
    manifest,
    findingSchemaBlockers: findingSchema.blockers,
    intentSchemaBlockers: intentSchema.blockers,
    producerGateBlockers: producerGate.blockers,
    supabaseSyncResult,
    executionMode: true,
  })
  const commandPlan = buildMultiAgentDryRunCommandPlan()
  const iamPlan = buildMultiAgentDryRunIamPlan(runId)
  const artifacts: MultiAgentDryRunArtifact[] = []
  const status = qa.status === 'passed' && supabaseSyncResult.status === 'completed' ? 'completed' : blockers.length ? 'blocked' : 'partial'
  const executionReport: MultiAgentDryRunExecutionReport = {
    ok: status === 'completed',
    phase: '52C',
    runId,
    createdAt: new Date().toISOString(),
    status,
    evidenceContext,
    scenarios,
    findings,
    editIntents,
    producerGateResults,
    qaSafetyGateResults,
    manifest,
    qa,
    commandPlan,
    iamPlan,
    schemaVerification,
    supabaseSyncInput,
    supabaseMilestoneBundle,
    supabaseSyncPolicy: multiAgentDryRunSafetyFlags,
    supabaseSyncResult,
    artifacts,
    safetyFlags: multiAgentDryRunSafetyFlags,
    phase52DReadiness: status === 'completed' ? 'ready_for_agent_to_tool_plan_bridge_on_existing_evidence' : 'blocked',
    blockers: Array.from(new Set([...blockers, ...qa.blockers, ...supabaseSyncResult.blockers])),
    warnings: Array.from(new Set([...warnings, ...qa.warnings, ...supabaseSyncResult.warnings])),
  }

  const uploadBlockers = await uploadExecutionArtifacts(localRoot, artifactPrefix, executionReport, artifacts)
  if (uploadBlockers.length) {
    executionReport.ok = false
    executionReport.status = 'blocked'
    executionReport.phase52DReadiness = 'blocked'
    executionReport.blockers = Array.from(new Set([...executionReport.blockers, ...uploadBlockers]))
    executionReport.qa.status = 'blocked'
    executionReport.qa.blockers = Array.from(new Set([...executionReport.qa.blockers, ...uploadBlockers]))
    executionReport.supabaseSyncResult.status = 'blocked'
    executionReport.supabaseSyncResult.blockers = Array.from(new Set([...executionReport.supabaseSyncResult.blockers, ...uploadBlockers]))
  }

  await mkdir(path.dirname(MULTI_AGENT_DRY_RUN_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(MULTI_AGENT_DRY_RUN_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: MULTI_AGENT_DRY_RUN_LOCAL_REPORT_PATH,
    iamChanges: ['not_applied: Phase 52C IAM plan is report-only; existing permissions were used if uploads succeeded'],
  }
}

async function uploadExecutionArtifacts(
  localRoot: string,
  artifactPrefix: string,
  report: MultiAgentDryRunExecutionReport,
  artifacts: MultiAgentDryRunArtifact[],
): Promise<string[]> {
  const blockers: string[] = []
  const upload = async (bucket: string, objectPath: string, value: unknown, id: string) => {
    try {
      const { localPath, artifact } = await writeMultiAgentDryRunLocalArtifact({ localRoot, bucket, object: objectPath, value, id })
      await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${objectPath}`])
      artifacts.push(artifact)
    } catch (error) {
      blockers.push(`Unable to upload ${id}: ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`)
    }
  }

  const generatedBucket = multiAgentDryRunConfig.generatedAssetsBucket
  const qaBucket = multiAgentDryRunConfig.qaBucket
  await upload(generatedBucket, `${artifactPrefix}/evidence/multi-agent-evidence-context.json`, report.evidenceContext, 'phase52c_evidence_context')
  await upload(generatedBucket, `${artifactPrefix}/scenarios/multi-agent-dry-run-scenarios.json`, report.scenarios, 'phase52c_scenarios')
  await upload(generatedBucket, `${artifactPrefix}/findings/agent-findings.json`, report.findings, 'phase52c_agent_findings')
  await upload(generatedBucket, `${artifactPrefix}/intents/edit-intent-candidates.json`, report.editIntents, 'phase52c_edit_intents')
  await upload(generatedBucket, `${artifactPrefix}/gates/producer-gate-results.json`, report.producerGateResults, 'phase52c_producer_gate')
  await upload(generatedBucket, `${artifactPrefix}/gates/qa-safety-gate-results.json`, report.qaSafetyGateResults, 'phase52c_qa_safety_gate')
  await upload(generatedBucket, `${artifactPrefix}/manifest/multi-agent-dry-run-manifest.json`, report.manifest, 'phase52c_manifest')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52c-milestone-sync-input.json`, report.supabaseSyncInput, 'phase52c_sync_input')
  await upload(generatedBucket, `${artifactPrefix}/supabase/phase52c-milestone-sync-result.json`, report.supabaseSyncResult, 'phase52c_sync_result')
  await upload(qaBucket, `${artifactPrefix}/qa/multi-agent-dry-run-qa.json`, report.qa, 'phase52c_qa')
  report.artifacts = artifacts
  await upload(qaBucket, `${artifactPrefix}/reports/phase52c-report.json`, report, 'phase52c_report')
  return blockers
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', multiAgentDryRunConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [multiAgentDryRunConfig.generatedAssetsBucket, multiAgentDryRunConfig.qaBucket]) {
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
