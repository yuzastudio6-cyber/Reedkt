import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  agentToolPlanBridgeRequiredScripts,
  agentToolPlanBridgeSafetyFlags,
  buildAgentToolPlanBridgeCommandPlan,
  buildAgentToolPlanBridgeIamPlan,
  buildAgentToolPlanBridgeQaSummary,
  buildAgentToolPlanBridgeReport,
  buildBlockedPlanRecords,
  buildCandidateApprovedPlanSnapshots,
  buildCrossTrackHandoffPackets,
  buildNotAttemptedPhase52DSyncResult,
  buildPhase52DSupabaseSyncInput,
  buildAgentToolPlanSourceAudit,
  phase52DAllowedIntentTypes,
  phase52DBlockedIntentTypes,
  resolveAgentToolPlanEvidenceContext,
  runAgentToolPlanProducerGate,
  runAgentToolPlanQaGate,
  validateAgentToolPlanProducerGate,
  validateAgentToolPlanScope,
} from '../activation/agent-tool-plan-bridge'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const report = await buildAgentToolPlanBridgeReport()
const evidenceContext = await resolveAgentToolPlanEvidenceContext()
const audit = buildAgentToolPlanSourceAudit(new Date('2026-06-05T00:00:00.000Z'))
const candidatePlans = buildCandidateApprovedPlanSnapshots({
  runId: 'phase52d-20260605T000000',
  createdAt: '2026-06-05T00:00:00.000Z',
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
const producerGateResults = runAgentToolPlanProducerGate({ candidatePlans, blockedPlans })
const producerGate = validateAgentToolPlanProducerGate(producerGateResults)
const handoffPackets = buildCrossTrackHandoffPackets({ runId: 'phase52d-20260605T000000', candidatePlans, blockedPlans })
const qaPlanGateResults = runAgentToolPlanQaGate({ manifest: report.manifest, supabaseSyncStatus: 'completed' })
const syncResult = buildNotAttemptedPhase52DSyncResult()
const qa = buildAgentToolPlanBridgeQaSummary({
  packageScripts: packageJson.scripts,
  docsPresent: {
    'docs/agents/agent-tool-plan-bridge-runbook.md': true,
    'docs/agents/agent-tool-plan-bridge-policy.md': true,
    'docs/agents/agent-tool-plan-bridge-qa-policy.md': true,
    'docs/activation-phase-52d-agent-tool-plan-bridge-results.md': true,
  },
  repoOwnershipAudit: audit,
  candidatePlans,
  blockedPlans,
  producerGateResults,
  qaPlanGateResults,
  handoffPackets,
  manifest: report.manifest,
  scopeValidationBlockers: scopeValidation.blockers,
  producerGateBlockers: producerGate.blockers,
  supabaseSyncResult: syncResult,
  executionMode: false,
})
const commandPlan = buildAgentToolPlanBridgeCommandPlan()
const iamPlan = buildAgentToolPlanBridgeIamPlan()
const syncInput = buildPhase52DSupabaseSyncInput('phase52d-20260605T000000', qa)

assert.equal(report.phase, '52D')
assert.equal(evidenceContext.phase52C.runId, 'phase52c-20260605T134904')
assert.equal(candidatePlans.length, 7)
assert.equal(blockedPlans.length, 4)
assert.deepEqual(candidatePlans.map((plan) => plan.sourceIntentTypes[0]).sort(), phase52DAllowedIntentTypes.slice().sort())
assert.deepEqual(blockedPlans.map((plan) => plan.sourceIntentTypes[0]).sort(), phase52DBlockedIntentTypes.slice().sort())
assert.deepEqual(scopeValidation.blockers, [])
assert.deepEqual(producerGate.blockers, [])
assert.equal(producerGateResults.filter((result) => result.decision === 'candidate_plan_only').length, 7)
assert.equal(producerGateResults.filter((result) => result.decision === 'handoff_only').length, 2)
assert.equal(producerGateResults.filter((result) => result.decision === 'blocked').length, 2)
assert.equal(handoffPackets.length >= 7, true)
assert.equal(blockedPlans.some((plan) => plan.sourceIntentTypes.includes('qwen_vlm_visual_understanding_request') && plan.decision === 'blocked'), true)
assert.equal(blockedPlans.some((plan) => plan.sourceIntentTypes.includes('demucs_stem_separation_request') && plan.decision === 'blocked'), true)
assert.equal(blockedPlans.some((plan) => plan.sourceIntentTypes.includes('motion_graphics_lower_third') && plan.ownerRoute === 'AI_TOOLS_CREATIVE_GRAPHICS'), true)
assert.equal(blockedPlans.some((plan) => plan.sourceIntentTypes.includes('noise_cleanup') && plan.ownerRoute === 'TRACK_B_MEDIA_PROCESSING'), true)
assert.equal(candidatePlans.every((plan) => plan.rawPromptExecution === false && plan.workerExecutionAllowed === false && plan.approvedForRuntime === false), true)
assert.equal(candidatePlans.every((plan) => plan.safetyFlags.publicArtifactAllowed === false && plan.safetyFlags.signedUrlSourceOfTruthAllowed === false), true)
assert.equal(report.manifest.sourceOfTruthSummary.some((rule) => rule.includes('Map/geospatial source of truth')), true)
assert.equal(syncInput.phaseId, '52D')
assert.equal(syncInput.supabaseSyncPolicy.rawPromptExecutionAllowed, false)
for (const script of agentToolPlanBridgeRequiredScripts) assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.noToolRuntimeExecution, true)
assert.equal(commandPlan.noWorkerExecution, true)
assert.equal(commandPlan.noProviderCalls, true)
assert.equal(commandPlan.noMigrations, true)
assert.equal(iamPlan.defaultMutationAllowed, false)
assert.equal(iamPlan.supabasePlan.migrationsAllowed, false)
assert.equal(iamPlan.supabasePlan.historicalBackfillAllowed, false)
assert.equal(agentToolPlanBridgeSafetyFlags.toolRuntimeAllowed, false)
assert.equal(agentToolPlanBridgeSafetyFlags.workerExecutionAllowed, false)
assert.equal(agentToolPlanBridgeSafetyFlags.modelInferenceAllowed, false)
assert.equal(agentToolPlanBridgeSafetyFlags.providerCallsAllowed, false)
assert.equal(agentToolPlanBridgeSafetyFlags.productionReadyAllowed, false)
assert.equal(agentToolPlanBridgeSafetyFlags.externalBetaAllowed, false)
assert.equal(agentToolPlanBridgeSafetyFlags.broadMediaAllowed, false)
assert.equal(report.phase52EReadiness, report.status === 'completed' ? 'ready_for_approved_plan_snapshot_validation_system_reconciliation' : 'blocked')

console.log('Phase 52D agent-to-tool plan bridge smoke passed.')
