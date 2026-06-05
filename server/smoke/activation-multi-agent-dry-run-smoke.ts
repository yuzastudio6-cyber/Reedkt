import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildMultiAgentDryRunCommandPlan,
  buildMultiAgentDryRunIamPlan,
  buildMultiAgentDryRunQaSummary,
  buildMultiAgentDryRunReport,
  buildNotAttemptedPhase52CSyncResult,
  generateEditIntentCandidates,
  generateMultiAgentFindings,
  multiAgentDryRunRequiredScripts,
  multiAgentDryRunSafetyFlags,
  multiAgentDryRunScenarios,
  runProducerGate,
  runQaSafetyGate,
  validateEditIntentSchemaCompliance,
  validateFindingSchemaCompliance,
  validateProducerGate,
} from '../activation/multi-agent-dry-run'
import { agentRoleRegistry, editIntentSchema } from '../activation/shared-agent-tool-architecture'
import { toolCapabilityRecords } from '../activation/tool-capability-registry-audit'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const report = buildMultiAgentDryRunReport()
const commandPlan = buildMultiAgentDryRunCommandPlan()
const iamPlan = buildMultiAgentDryRunIamPlan()
const findings = generateMultiAgentFindings(multiAgentDryRunScenarios, '2026-06-05T00:00:00.000Z')
const intents = generateEditIntentCandidates(multiAgentDryRunScenarios, toolCapabilityRecords)
const producerGateResults = runProducerGate(intents, toolCapabilityRecords)
const qaSafetyGateResults = runQaSafetyGate({ manifest: report.manifest, supabaseSyncStatus: 'completed' })
const findingSchema = validateFindingSchemaCompliance(findings)
const intentSchema = validateEditIntentSchemaCompliance(intents)
const producerGate = validateProducerGate(producerGateResults)
const qa = buildMultiAgentDryRunQaSummary({
  packageScripts: packageJson.scripts,
  scenarios: multiAgentDryRunScenarios,
  findings,
  editIntents: intents,
  producerGateResults,
  qaSafetyGateResults,
  manifest: report.manifest,
  findingSchemaBlockers: findingSchema.blockers,
  intentSchemaBlockers: intentSchema.blockers,
  producerGateBlockers: producerGate.blockers,
  supabaseSyncResult: buildNotAttemptedPhase52CSyncResult(),
  executionMode: false,
})

assert.equal(report.phase, '52C')
assert.equal(multiAgentDryRunScenarios.length, 6)
assert.equal(report.evidenceContext.committedRegistryRecordCount, 67)
assert.equal(report.evidenceContext.phase52B.runId, 'phase52b-20260605T121905')
assert.equal(findings.length >= agentRoleRegistry.length, true)
assert.deepEqual(findingSchema.blockers, [])
assert.deepEqual(intentSchema.blockers, [])
assert.deepEqual(producerGate.blockers, [])

const coveredAgents = new Set(findings.map((finding) => finding.agentId))
for (const role of agentRoleRegistry) {
  assert.equal(coveredAgents.has(role.agentId as never), true, `Missing agent coverage for ${role.agentId}`)
}
for (const requiredIntentType of [
  'conservative_color_adjustment',
  'caption_burnin_preview',
  'text_behind_subject_preview',
  'route_map_overlay',
  'location_context_card',
  'motion_graphics_lower_third',
  'noise_cleanup',
  'slow_motion_segment',
  'web_research_planning_context',
  'qwen_vlm_visual_understanding_request',
  'demucs_stem_separation_request',
]) {
  assert.equal(intents.some((intent) => intent.intentType === requiredIntentType), true, `Missing intent ${requiredIntentType}`)
}

const vlm = producerGateResults.find((item) => item.intentType === 'qwen_vlm_visual_understanding_request')
const demucs = producerGateResults.find((item) => item.intentType === 'demucs_stem_separation_request')
const lowerThird = producerGateResults.find((item) => item.intentType === 'motion_graphics_lower_third')
assert.equal(vlm?.decision, 'blocked')
assert.equal(demucs?.decision, 'blocked')
assert.equal(lowerThird?.decision, 'blocked')
assert.equal(producerGateResults.some((item) => item.decision === 'allowed_candidate_plan_only'), true)

for (const field of editIntentSchema.requiredFields) {
  assert.equal(field in intents[0], true, `Edit intent missing schema field ${field}`)
}
for (const script of multiAgentDryRunRequiredScripts) {
  assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
}
for (const gateId of [
  'phase52b_evidence',
  'agent_coverage',
  'scenario_coverage',
  'finding_schema_compliance',
  'edit_intent_schema_compliance',
  'capability_gating',
  'producer_gate',
  'qa_safety_gate',
  'source_of_truth_policy',
  'supabase_milestone_sync',
  'blocked_features',
]) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing gate ${gateId}`)
}
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.noToolRuntimeExecution, true)
assert.equal(commandPlan.noProviderCalls, true)
assert.equal(commandPlan.noMigrations, true)
assert.equal(iamPlan.defaultMutationAllowed, false)
assert.equal(iamPlan.supabasePlan.migrationsAllowed, false)
assert.equal(iamPlan.supabasePlan.historicalBackfillAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.toolRuntimeExecutionAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.workerExecutionAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.modelInferenceAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.providerCallsAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.webSearchAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.mapRenderingAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.productionReadyAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.externalBetaAllowed, false)
assert.equal(multiAgentDryRunSafetyFlags.broadMediaAllowed, false)
assert.equal(report.phase52DReadiness, report.status === 'completed' ? 'ready_for_agent_to_tool_plan_bridge_on_existing_evidence' : 'blocked')

console.log('Phase 52C multi-agent dry-run smoke passed.')
