import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildToolCapabilityRegistryCommandPlan,
  buildToolCapabilityRegistryIamPlan,
  buildToolCapabilityRegistryQaSummary,
  buildToolCapabilityRegistryReport,
  buildToolCapabilityRegistrySummary,
  toolCapabilityRecords,
  toolCapabilityRegistryExpectedCounts,
  toolCapabilityRegistryRequiredScripts,
  toolCapabilityRegistrySafetyFlags,
  validateToolCapabilityRegistry,
} from '../activation/tool-capability-registry-audit'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const validation = validateToolCapabilityRegistry(toolCapabilityRecords)
const summary = buildToolCapabilityRegistrySummary(toolCapabilityRecords)
const qa = buildToolCapabilityRegistryQaSummary({
  packageScripts: packageJson.scripts,
  validation,
  executionMode: false,
})
const report = buildToolCapabilityRegistryReport()
const commandPlan = buildToolCapabilityRegistryCommandPlan()
const iamPlan = buildToolCapabilityRegistryIamPlan()

assert.equal(report.phase, '52B')
assert.equal(summary.totalRecords, toolCapabilityRegistryExpectedCounts.total)
assert.equal(summary.byTrack.track_a_visual_video, 13)
assert.equal(summary.byTrack.web_search, 8)
assert.equal(summary.byTrack.map_geospatial, 12)
assert.equal(summary.byTrack.supabase, 4)
assert.equal(summary.byTrack.ai_tools, 12)
assert.equal(summary.byTrack.track_b, 18)
assert.deepEqual(summary.duplicateKeys, [])
assert.equal(validation.ok, true, validation.blockers.join('; '))

for (const item of toolCapabilityRecords) {
  assert.equal(item.productionReady, false, `${item.track}:${item.toolId} productionReady must be false`)
  assert.equal(item.runtimeExecutionAllowed, false, `${item.track}:${item.toolId} runtime execution must be false`)
  assert.equal(item.providerCallAllowed, false, `${item.track}:${item.toolId} provider calls must be false`)
  assert.equal(item.publicArtifactAllowed, false, `${item.track}:${item.toolId} public artifacts must be false`)
  assert.equal(item.signedUrlSourceOfTruthAllowed, false, `${item.track}:${item.toolId} signed URL source of truth must be false`)
  assert.equal(Boolean(item.internalBetaCandidateReady), item.status === 'ready_for_internal_beta_candidate')
  assert.equal(Boolean(item.readinessEvidence.length), true, `${item.track}:${item.toolId} missing readiness evidence`)
  assert.equal(Boolean(item.supabaseMilestoneRefs.length), true, `${item.track}:${item.toolId} missing Supabase milestone refs`)
}

const d3 = toolCapabilityRecords.find((item) => item.toolId === 'd3_dataviz')
const three = toolCapabilityRecords.find((item) => item.toolId === 'threejs_creative_3d')
const sharp = toolCapabilityRecords.find((item) => item.toolId === 'sharp_libvips_general')
const vlm = toolCapabilityRecords.find((item) => item.toolId === 'qwen3_vl')
const vllm = toolCapabilityRecords.find((item) => item.toolId === 'vllm_runtime')
const demucs = toolCapabilityRecords.find((item) => item.toolId === 'demucs')
assert.equal(d3?.owningChat, 'ai_tools')
assert.equal(three?.owningChat, 'ai_tools')
assert.equal(sharp?.owningChat, 'track_b')
assert.equal(vlm?.status, 'excluded_for_initial_internal_testing')
assert.equal(vllm?.status, 'blocked_pending_runtime_resolution')
assert.equal(demucs?.status, 'blocked_pending_model_provenance')
assert.equal(demucs?.blockerReason?.includes('model provenance'), true)

for (const script of toolCapabilityRegistryRequiredScripts) {
  assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
}
for (const gateId of [
  'phase52a_evidence',
  'capability_schema_compliance',
  'track_a_capabilities',
  'web_search_capabilities',
  'map_geospatial_capabilities',
  'supabase_capabilities',
  'ai_tools_placeholders',
  'track_b_placeholders',
  'ownership_boundaries',
  'supabase_tool_capability_sync',
  'supabase_milestone_sync',
  'blocked_features',
]) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing gate ${gateId}`)
}
assert.equal(qa.status, 'passed', qa.blockers.join('; '))
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.noMigrationCommands, true)
assert.equal(commandPlan.noToolRuntimeExecution, true)
assert.equal(commandPlan.blockedAlways.includes('AI model inference'), true)
assert.equal(iamPlan.defaultMutationAllowed, false)
assert.equal(iamPlan.supabasePlan.migrationsAllowed, false)
assert.equal(iamPlan.supabasePlan.schemaChangesAllowed, false)
assert.equal(toolCapabilityRegistrySafetyFlags.productionReadyAllowed, false)
assert.equal(toolCapabilityRegistrySafetyFlags.externalBetaAllowed, false)
assert.equal(toolCapabilityRegistrySafetyFlags.broadMediaAllowed, false)
assert.equal(toolCapabilityRegistrySafetyFlags.providerCallsAllowed, false)
assert.equal(toolCapabilityRegistrySafetyFlags.toolRuntimeExecutionAllowed, false)

if (report.status === 'completed') {
  assert.equal(report.phase52CReadiness, 'ready_for_multi_agent_dry_run_on_existing_evidence')
} else {
  assert.equal(report.phase52CReadiness, 'blocked')
}

console.log('Phase 52B tool capability registry audit smoke passed.')
