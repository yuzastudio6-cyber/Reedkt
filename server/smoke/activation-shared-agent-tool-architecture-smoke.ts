import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  agentFindingSchema,
  agentRoleRegistry,
  agentToolRoutingPolicy,
  approvedPlanSnapshotSchema,
  artifactSourceOfTruthPolicy,
  buildSharedAgentToolArchitectureCommandPlan,
  buildSharedAgentToolArchitectureIamPlan,
  buildSharedAgentToolArchitectureQaSummary,
  buildSharedAgentToolArchitectureReport,
  crossTrackHandoffTemplate,
  editIntentSchema,
  sharedAgentToolArchitectureRequiredDocs,
  sharedAgentToolArchitectureRequiredScripts,
  sharedAgentToolArchitectureSafetyFlags,
  toolCapabilityManifestSchema,
  toolOwnershipMap,
} from '../activation/shared-agent-tool-architecture'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const report = buildSharedAgentToolArchitectureReport()
const commandPlan = buildSharedAgentToolArchitectureCommandPlan()
const qa = buildSharedAgentToolArchitectureQaSummary(packageJson.scripts)

assert.equal(report.phase, '52A')
assert.equal(['planned', 'completed', 'partial', 'blocked'].includes(report.status), true)
assert.equal(agentRoleRegistry.length, 12)
for (const agentId of ['director', 'editor', 'cinematographer', 'colorist', 'compositor_vfx', 'motion', 'audio', 'search_research', 'map_location', 'graphics_design', 'producer', 'qa_safety']) {
  assert.equal(agentRoleRegistry.some((agent) => agent.agentId === agentId), true, `Missing agent ${agentId}`)
}
assert.equal(agentRoleRegistry.every((agent) => agent.cannotExecuteToolsDirectly), true)
assert.equal(agentRoleRegistry.every((agent) => agent.cannotAuthorizeRawPromptExecution), true)
for (const ownerId of ['this_chat', 'ai_tools_chat', 'track_b', 'track_a_visual_video']) {
  assert.equal(toolOwnershipMap.groups.some((group) => group.ownerId === ownerId), true, `Missing owner ${ownerId}`)
}
for (const field of ['manifestVersion', 'toolId', 'owner', 'status', 'internalTestingReady', 'internalBetaCandidateReady', 'productionReady', 'readinessEvidence', 'supabaseMilestoneRefs', 'lastValidatedPhase']) {
  assert.equal(toolCapabilityManifestSchema.requiredFields.includes(field), true, `Missing capability field ${field}`)
}
assert.equal((toolCapabilityManifestSchema.examples ?? []).some((example) => (example as { toolId?: string }).toolId === 'track_b_qwen_vlm_vllm'), true)
assert.equal((toolCapabilityManifestSchema.examples ?? []).some((example) => (example as { toolId?: string; status?: string }).toolId === 'demucs' && (example as { status?: string }).status === 'blocked_pending_model_provenance'), true)
for (const field of ['findingId', 'agentId', 'evidenceRefs', 'confidence', 'blocked', 'blockedReason']) {
  assert.equal(agentFindingSchema.requiredFields.includes(field), true, `Missing finding field ${field}`)
}
assert.equal(agentFindingSchema.forbiddenFields?.includes('directToolExecutionCommand'), true)
for (const field of ['intentId', 'intentType', 'targetScope', 'proposedToolFamily', 'allowedInProduction']) {
  assert.equal(editIntentSchema.requiredFields.includes(field), true, `Missing edit intent field ${field}`)
}
assert.equal(approvedPlanSnapshotSchema.requiredDefaults?.rawPromptExecution, false)
assert.equal(approvedPlanSnapshotSchema.requiredDefaults?.publicArtifactAllowed, false)
assert.equal(approvedPlanSnapshotSchema.requiredFields.includes('supabaseMilestoneSyncPolicy'), true)
assert.equal(agentToolRoutingPolicy.constraints.includes('Agents cannot execute tools directly.'), true)
assert.equal(agentToolRoutingPolicy.constraints.includes('Workers reject raw chat as instructions.'), true)
assert.equal(artifactSourceOfTruthPolicy.domains.some((domain) => domain.domain === 'map_geospatial' && domain.reviewArtifactsOnly.includes('preview screenshots')), true)
assert.equal(artifactSourceOfTruthPolicy.signedUrlsSourceOfTruthAllowed, false)
assert.equal(crossTrackHandoffTemplate.requiredSections.includes('capability manifest updates required'), true)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.executionMode, 'guarded_private_artifact_and_supabase_sync')
assert.equal(commandPlan.blockedAlways.includes('tool runtime execution'), true)
assert.equal(commandPlan.commands.some((command) => command.commandId === 'execute'), true)
const iamPlan = buildSharedAgentToolArchitectureIamPlan()
assert.equal(iamPlan.supabasePlan.writesAllowedOnlyToMilestoneRegistry, true)
assert.equal(iamPlan.supabasePlan.migrationsAllowed, false)
for (const script of sharedAgentToolArchitectureRequiredScripts) {
  assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
}
for (const doc of sharedAgentToolArchitectureRequiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}
assert.equal(sharedAgentToolArchitectureSafetyFlags.productionReadyAllowed, false)
assert.equal(sharedAgentToolArchitectureSafetyFlags.externalBetaAllowed, false)
assert.equal(sharedAgentToolArchitectureSafetyFlags.broadMediaAllowed, false)
assert.equal(sharedAgentToolArchitectureSafetyFlags.rawPromptExecutionAllowed, false)
assert.equal(sharedAgentToolArchitectureSafetyFlags.publicArtifactAllowed, false)
assert.equal(qa.status, 'passed')
for (const gateId of ['agent_roles_defined', 'tool_ownership_defined', 'capability_manifest_schema', 'agent_finding_schema', 'edit_intent_schema', 'approved_plan_snapshot_schema', 'routing_policy', 'source_of_truth_policy', 'cross_track_handoff_template', 'supabase_milestone_sync', 'blocked_features']) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing gate ${gateId}`)
}
if (report.status === 'completed') {
  assert.equal(report.phase52BReadiness, 'ready_for_tool_capability_registry_audit')
} else {
  assert.equal(report.phase52BReadiness, 'blocked')
}

console.log('Phase 52A shared agent/tool architecture smoke passed.')
