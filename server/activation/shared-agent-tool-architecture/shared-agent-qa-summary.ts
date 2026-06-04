import { existsSync } from 'node:fs'
import { agentRoleRegistry } from './agent-role-registry'
import { approvedPlanSnapshotSchema } from './approved-plan-snapshot-schema'
import { artifactSourceOfTruthPolicy } from './artifact-source-of-truth-policy'
import { crossTrackHandoffTemplate } from './cross-track-handoff-template'
import { editIntentSchema } from './edit-intent-schema'
import { agentFindingSchema } from './agent-finding-schema'
import { agentToolRoutingPolicy } from './agent-tool-routing-policy'
import { sharedAgentToolArchitectureRequiredDocs, sharedAgentToolArchitectureRequiredScripts, sharedAgentToolArchitectureSafetyFlags } from './shared-agent-tool-architecture-policy'
import { toolCapabilityManifestSchema } from './tool-capability-manifest-schema'
import { toolOwnershipMap } from './tool-ownership-map'
import type { SharedAgentToolArchitectureQaGate, SharedAgentToolArchitectureQaSummary } from './shared-agent-tool-architecture-types'

export function buildSharedAgentToolArchitectureQaSummary(packageScripts?: Record<string, string>): SharedAgentToolArchitectureQaSummary {
  const gates: SharedAgentToolArchitectureQaGate[] = [
    gate('agent_roles_defined', agentRoleRegistry.length === 12 && agentRoleRegistry.every((agent) => agent.cannotExecuteToolsDirectly && agent.cannotAuthorizeRawPromptExecution), 'All 12 required specialist agents are defined with direct execution and raw prompt execution blocked.'),
    gate('tool_ownership_defined', ['this_chat', 'ai_tools_chat', 'track_b', 'track_a_visual_video'].every((ownerId) => toolOwnershipMap.groups.some((group) => group.ownerId === ownerId)), 'This chat, AI Tools, Track B, and Track A ownership groups are mapped.'),
    gate('capability_manifest_schema', required(toolCapabilityManifestSchema.requiredFields, ['manifestVersion', 'toolId', 'owner', 'status', 'internalTestingReady', 'productionReady', 'readinessEvidence', 'lastValidatedPhase']) && (toolCapabilityManifestSchema.examples?.length ?? 0) >= 6, 'Capability manifest schema includes required readiness/ownership fields and examples.'),
    gate('agent_finding_schema', required(agentFindingSchema.requiredFields, ['findingId', 'agentId', 'evidenceRefs', 'confidence', 'blocked', 'blockedReason']) && Boolean(agentFindingSchema.forbiddenFields?.includes('directToolExecutionCommand')), 'Agent finding schema is structured and blocks direct commands/secrets.'),
    gate('edit_intent_schema', required(editIntentSchema.requiredFields, ['intentId', 'agentId', 'intentType', 'targetScope', 'proposedToolFamily', 'allowedInProduction']), 'Edit intent schema includes scope, evidence, risk, approval, and environment flags.'),
    gate('approved_plan_snapshot_schema', approvedPlanSnapshotSchema.requiredDefaults?.rawPromptExecution === false && approvedPlanSnapshotSchema.requiredDefaults.publicArtifactAllowed === false, 'Approved plan snapshot schema requires rawPromptExecution=false and blocks public artifacts by default.'),
    gate('routing_policy', agentToolRoutingPolicy.constraints.includes('Agents cannot execute tools directly.') && agentToolRoutingPolicy.constraints.includes('Workers reject raw chat as instructions.'), 'Routing policy blocks direct agent tool execution and raw chat worker instructions.'),
    gate('source_of_truth_policy', artifactSourceOfTruthPolicy.domains.some((domain) => domain.domain === 'map_geospatial' && domain.reviewArtifactsOnly.includes('preview screenshots')) && artifactSourceOfTruthPolicy.signedUrlsSourceOfTruthAllowed === false, 'Source-of-truth policy makes map manifests authoritative and keeps screenshots/previews non-authoritative.'),
    gate('cross_track_handoff_template', crossTrackHandoffTemplate.requiredSections.includes('tool ownership') && crossTrackHandoffTemplate.requiredSections.includes('capability manifest updates required'), 'Cross-track handoff template exists with ownership and capability manifest sections.'),
    gate('blocked_features', Object.values(sharedAgentToolArchitectureSafetyFlags).every((value) => value === true || value === false) && !sharedAgentToolArchitectureSafetyFlags.productionReadyAllowed && !sharedAgentToolArchitectureSafetyFlags.externalBetaAllowed && !sharedAgentToolArchitectureSafetyFlags.broadMediaAllowed && !sharedAgentToolArchitectureSafetyFlags.rawPromptExecutionAllowed && !sharedAgentToolArchitectureSafetyFlags.publicArtifactAllowed && docsAndScriptsPresent(packageScripts), 'Production, external beta, broad media, raw prompt execution, public artifacts, provider calls, docs, and scripts stay gated.'),
  ]
  const blockers = gates.filter((qaGate) => !qaGate.passed).map((qaGate) => `${qaGate.gateId} failed`)
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers,
    warnings: [
      'Phase 52A is architecture/schema only and does not execute capability registry audits yet.',
      'Track A visual readiness report script may be optional on this base.',
    ],
  }
}

function gate(gateId: SharedAgentToolArchitectureQaGate['gateId'], passed: boolean, summary: string): SharedAgentToolArchitectureQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function required(fields: string[], requiredFields: string[]): boolean {
  return requiredFields.every((field) => fields.includes(field))
}

function docsAndScriptsPresent(packageScripts?: Record<string, string>): boolean {
  const docsPresent = sharedAgentToolArchitectureRequiredDocs.every((doc) => existsSync(doc))
  const scriptsPresent = packageScripts ? sharedAgentToolArchitectureRequiredScripts.every((script) => Boolean(packageScripts[script])) : true
  return docsPresent && scriptsPresent
}
