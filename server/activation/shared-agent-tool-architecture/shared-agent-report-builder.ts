import { existsSync, readFileSync } from 'node:fs'
import { agentRoleRegistry } from './agent-role-registry'
import { approvedPlanSnapshotSchema } from './approved-plan-snapshot-schema'
import { artifactSourceOfTruthPolicy } from './artifact-source-of-truth-policy'
import { crossTrackHandoffTemplate } from './cross-track-handoff-template'
import { editIntentSchema } from './edit-intent-schema'
import { agentFindingSchema } from './agent-finding-schema'
import { agentToolRoutingPolicy } from './agent-tool-routing-policy'
import { sharedAgentToolArchitectureConfig, sharedAgentToolArchitectureSafetyFlags } from './shared-agent-tool-architecture-policy'
import { buildSharedAgentToolArchitectureIamPlan } from './shared-agent-iam-plan'
import { buildSharedAgentToolArchitectureQaSummary } from './shared-agent-qa-summary'
import { buildPhase52ASupabaseMilestoneBundle, buildPhase52ASupabaseSyncInput, sharedAgentToolArchitectureSupabaseSyncPolicy } from './shared-agent-supabase-sync'
import { buildSharedAgentToolArchitectureCommandPlan } from './shared-agent-command-plan'
import { toolCapabilityManifestSchema } from './tool-capability-manifest-schema'
import { toolOwnershipMap } from './tool-ownership-map'
import type { SharedAgentToolArchitectureExecutionReport, SharedAgentToolArchitectureReport, SharedAgentToolArchitectureSupabaseSyncResult } from './shared-agent-tool-architecture-types'
import { buildNotAttemptedWriteVerification, buildPlannedSchemaVerification } from '../supabase-milestone-registry'

export const SHARED_AGENT_TOOL_ARCHITECTURE_LOCAL_REPORT_PATH = 'activation-logs/shared-agent-tool-architecture/phase52a/job-execution/phase52a-report.json'

export function buildSharedAgentToolArchitectureReport(): SharedAgentToolArchitectureReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
  const qa = buildSharedAgentToolArchitectureQaSummary(packageJson.scripts)
  const runId = 'phase52a-planned'
  const supabaseSyncInput = buildPhase52ASupabaseSyncInput(runId, qa)
  const supabaseMilestoneBundle = buildPhase52ASupabaseMilestoneBundle(supabaseSyncInput)
  const schemaVerification = buildPlannedSchemaVerification()
  const supabaseSyncResult = buildPlannedSyncResult()
  return {
    reportId: 'activation-phase-52a-shared-agent-tool-architecture',
    createdAt: new Date().toISOString(),
    phase: '52A',
    status: 'planned',
    runId,
    agentRegistry: agentRoleRegistry,
    toolOwnershipMap,
    capabilityManifestSchema: toolCapabilityManifestSchema,
    agentFindingSchema,
    editIntentSchema,
    approvedPlanSnapshotSchema,
    routingPolicy: agentToolRoutingPolicy,
    sourceOfTruthPolicy: artifactSourceOfTruthPolicy,
    crossTrackHandoffTemplate,
    commandPlan: buildSharedAgentToolArchitectureCommandPlan(),
    iamPlan: buildSharedAgentToolArchitectureIamPlan(runId),
    supabaseSyncResult,
    qa,
    safetyFlags: sharedAgentToolArchitectureSafetyFlags,
    phase52BReadiness: 'blocked',
    blockers: ['Static report mode has not written/read back the Phase 52A Supabase milestone sync record.'],
    warnings: [
      ...qa.warnings,
      'Confirmed execution will build and upload private architecture artifacts, then write one Supabase milestone sync record.',
      `Planned Supabase bundle: ${supabaseMilestoneBundle.phaseId}/${supabaseMilestoneBundle.runId}`,
      `Planned schema probe status: ${schemaVerification.status}`,
      `Base evidence dependency: ${sharedAgentToolArchitectureConfig.canonicalPhase51DRunId}`,
    ],
  }
}

export function summarizeSharedAgentToolArchitectureReport(report: SharedAgentToolArchitectureReport): string {
  return [
    'Phase 52A shared agent/tool ownership architecture',
    `Status: ${report.status}`,
    `Run ID: ${report.runId}`,
    `Agents: ${report.agentRegistry.length}`,
    `Ownership groups: ${report.toolOwnershipMap.groups.map((group) => group.ownerId).join(', ')}`,
    `Capability schema fields: ${report.capabilityManifestSchema.requiredFields.length}`,
    `Agent finding schema fields: ${report.agentFindingSchema.requiredFields.length}`,
    `Edit intent schema fields: ${report.editIntentSchema.requiredFields.length}`,
    `Approved snapshot rawPromptExecution: ${report.approvedPlanSnapshotSchema.requiredDefaults?.rawPromptExecution}`,
    `Supabase milestone sync: ${report.supabaseSyncResult.status} (readback matched: ${report.supabaseSyncResult.readbackMatched})`,
    `Phase52B readiness: ${report.phase52BReadiness}`,
    'Production/external beta/broad media/raw prompt execution/public artifacts/provider calls: blocked',
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Artifacts:',
    ...(report.executionReport?.artifacts.length ? report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`) : ['- none recorded locally yet']),
  ].join('\n')
}

function executionToReport(executionReport: SharedAgentToolArchitectureExecutionReport): SharedAgentToolArchitectureReport {
  return {
    reportId: 'activation-phase-52a-shared-agent-tool-architecture',
    createdAt: new Date().toISOString(),
    phase: '52A',
    status: executionReport.ok ? 'completed' : executionReport.supabaseSyncResult.writeVerification.status === 'completed' ? 'partial' : 'blocked',
    runId: executionReport.runId,
    executionReport,
    agentRegistry: executionReport.agentRegistry,
    toolOwnershipMap: executionReport.toolOwnershipMap,
    capabilityManifestSchema: executionReport.capabilityManifestSchema,
    agentFindingSchema: executionReport.agentFindingSchema,
    editIntentSchema: executionReport.editIntentSchema,
    approvedPlanSnapshotSchema: executionReport.approvedPlanSnapshotSchema,
    routingPolicy: executionReport.routingPolicy,
    sourceOfTruthPolicy: executionReport.sourceOfTruthPolicy,
    crossTrackHandoffTemplate: executionReport.crossTrackHandoffTemplate,
    commandPlan: executionReport.commandPlan,
    iamPlan: executionReport.iamPlan,
    supabaseSyncResult: executionReport.supabaseSyncResult,
    qa: executionReport.qa,
    safetyFlags: executionReport.safetyFlags,
    phase52BReadiness: executionReport.phase52BReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

function buildPlannedSyncResult(): SharedAgentToolArchitectureSupabaseSyncResult {
  return {
    status: 'blocked',
    inputValidated: true,
    bundleValidated: true,
    schemaPresent: false,
    writeVerification: buildNotAttemptedWriteVerification(['Static report mode does not write to Supabase.']),
    readbackMatched: false,
    writesLimitedToMilestoneRegistry: true,
    migrationsApplied: false,
    historicalBackfillRerun: false,
    blockers: ['Static report mode does not write to Supabase.'],
    warnings: [
      'Confirmed execution requires REEDITPRO_CONFIRM_SHARED_AGENT_TOOL_ARCHITECTURE=true and REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true.',
      `Supabase sync policy writesAllowed=${sharedAgentToolArchitectureSupabaseSyncPolicy.writesAllowed} and migrationsAllowed=false.`,
    ],
  }
}

function readLocalExecutionReport(): SharedAgentToolArchitectureExecutionReport | undefined {
  if (!existsSync(SHARED_AGENT_TOOL_ARCHITECTURE_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(SHARED_AGENT_TOOL_ARCHITECTURE_LOCAL_REPORT_PATH, 'utf8')) as SharedAgentToolArchitectureExecutionReport
  } catch {
    return undefined
  }
}
