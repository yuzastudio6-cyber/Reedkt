import { readFileSync } from 'node:fs'
import { agentRoleRegistry } from './agent-role-registry'
import { approvedPlanSnapshotSchema } from './approved-plan-snapshot-schema'
import { artifactSourceOfTruthPolicy } from './artifact-source-of-truth-policy'
import { crossTrackHandoffTemplate } from './cross-track-handoff-template'
import { editIntentSchema } from './edit-intent-schema'
import { agentFindingSchema } from './agent-finding-schema'
import { agentToolRoutingPolicy } from './agent-tool-routing-policy'
import { sharedAgentToolArchitectureConfig, sharedAgentToolArchitectureSafetyFlags } from './shared-agent-tool-architecture-policy'
import { buildSharedAgentToolArchitectureQaSummary } from './shared-agent-qa-summary'
import { toolCapabilityManifestSchema } from './tool-capability-manifest-schema'
import { toolOwnershipMap } from './tool-ownership-map'
import type { SharedAgentToolArchitectureReport } from './shared-agent-tool-architecture-types'

export function buildSharedAgentToolArchitectureReport(): SharedAgentToolArchitectureReport {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
  const qa = buildSharedAgentToolArchitectureQaSummary(packageJson.scripts)
  return {
    reportId: 'activation-phase-52a-shared-agent-tool-architecture',
    createdAt: new Date().toISOString(),
    phase: '52A',
    status: qa.status === 'passed' ? 'completed' : 'blocked',
    agentRegistry: agentRoleRegistry,
    toolOwnershipMap,
    capabilityManifestSchema: toolCapabilityManifestSchema,
    agentFindingSchema,
    editIntentSchema,
    approvedPlanSnapshotSchema,
    routingPolicy: agentToolRoutingPolicy,
    sourceOfTruthPolicy: artifactSourceOfTruthPolicy,
    crossTrackHandoffTemplate,
    qa,
    safetyFlags: sharedAgentToolArchitectureSafetyFlags,
    phase52BReadiness: qa.status === 'passed' ? sharedAgentToolArchitectureConfig.phase52BReadinessWhenPassed : 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeSharedAgentToolArchitectureReport(report: SharedAgentToolArchitectureReport): string {
  return [
    'Phase 52A shared agent/tool ownership architecture',
    `Status: ${report.status}`,
    `Agents: ${report.agentRegistry.length}`,
    `Ownership groups: ${report.toolOwnershipMap.groups.map((group) => group.ownerId).join(', ')}`,
    `Capability schema fields: ${report.capabilityManifestSchema.requiredFields.length}`,
    `Agent finding schema fields: ${report.agentFindingSchema.requiredFields.length}`,
    `Edit intent schema fields: ${report.editIntentSchema.requiredFields.length}`,
    `Approved snapshot rawPromptExecution: ${report.approvedPlanSnapshotSchema.requiredDefaults?.rawPromptExecution}`,
    `Phase52B readiness: ${report.phase52BReadiness}`,
    'Production/external beta/broad media/raw prompt execution/public artifacts/provider calls: blocked',
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}
