import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  approvedPlanValidationRequiredScripts,
  approvedPlanValidationSafetyFlags,
  buildApprovedPlanSourceAudit,
  buildApprovedPlanValidationCommandPlan,
  buildApprovedPlanValidationIamPlan,
  buildApprovedPlanValidationQaSummary,
  buildApprovedPlanValidationReport,
  buildMissingContractInventory,
  buildNotAttemptedPhase52ESyncResult,
  buildPhase52ESupabaseSyncInput,
  buildSystemReconciliationSummary,
  buildValidatedHandoffPackets,
  resolveApprovedPlanEvidenceContext,
  validateApprovedPlanFeatureGates,
  validateApprovedPlanOwnership,
  validateApprovedPlanRuntimeBlocks,
  validateBlockedPlanSchemas,
  validateCandidateApprovedPlanSchemas,
} from '../activation/approved-plan-snapshot-validation'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const report = await buildApprovedPlanValidationReport()
const evidenceContext = await resolveApprovedPlanEvidenceContext({ preferPrivateGcs: false })
const audit = buildApprovedPlanSourceAudit(new Date('2026-06-05T00:00:00.000Z'))
const missingContractInventory = buildMissingContractInventory(audit)
const candidateSchemaValidation = validateCandidateApprovedPlanSchemas(evidenceContext.candidatePlans)
const blockedPlanValidation = validateBlockedPlanSchemas(evidenceContext.blockedPlans)
const ownershipValidation = validateApprovedPlanOwnership({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
const runtimeBlockValidation = validateApprovedPlanRuntimeBlocks({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
const featureGateValidation = validateApprovedPlanFeatureGates({ candidatePlans: evidenceContext.candidatePlans, blockedPlans: evidenceContext.blockedPlans })
const systemReconciliation = buildSystemReconciliationSummary({ evidenceContext, ownershipValidation, runtimeBlockValidation, featureGateValidation, missingContractInventory })
const validatedHandoffs = buildValidatedHandoffPackets({ runId: 'phase52e-20260605T000000', sourceHandoffs: evidenceContext.handoffPackets, missingContractInventory })
const syncResult = buildNotAttemptedPhase52ESyncResult()
const qa = buildApprovedPlanValidationQaSummary({
  packageScripts: packageJson.scripts,
  docsPresent: {
    'docs/agents/approved-plan-snapshot-validation-runbook.md': true,
    'docs/agents/approved-plan-snapshot-validation-policy.md': true,
    'docs/agents/approved-plan-snapshot-validation-qa-policy.md': true,
    'docs/activation-phase-52e-approved-plan-snapshot-validation-results.md': true,
  },
  repoOwnershipAudit: audit,
  evidenceContext,
  candidateSchemaValidation,
  blockedPlanValidation,
  ownershipValidation,
  runtimeBlockValidation,
  featureGateValidation,
  systemReconciliation,
  missingContractInventory,
  validatedHandoffs,
  manifest: report.manifest,
  supabaseSyncResult: syncResult,
  executionMode: false,
})
const commandPlan = buildApprovedPlanValidationCommandPlan()
const iamPlan = buildApprovedPlanValidationIamPlan()
const syncInput = buildPhase52ESupabaseSyncInput('phase52e-20260605T000000', qa)

assert.equal(report.phase, '52E')
assert.equal(evidenceContext.phase52D.runId, 'phase52d-20260605T164423')
assert.equal(evidenceContext.candidatePlans.length, 7)
assert.equal(evidenceContext.blockedPlans.length, 4)
assert.equal(evidenceContext.handoffPackets.length >= 7, true)
assert.equal(candidateSchemaValidation.status, 'passed')
assert.equal(blockedPlanValidation.status, 'passed')
assert.equal(ownershipValidation.status, 'passed')
assert.equal(runtimeBlockValidation.status, 'passed')
assert.equal(featureGateValidation.status, 'passed')
assert.equal(systemReconciliation.blockedScopes.includes('candidate approved-plan snapshot execution'), true)
assert.equal(validatedHandoffs.length >= 8, true)
assert.equal(validatedHandoffs.some((handoff) => handoff.packetId === 'missing-contracts-handoff'), true)
assert.equal(evidenceContext.candidatePlans.every((plan) => plan.rawPromptExecution === false && plan.workerExecutionAllowed === false && plan.approvedForRuntime === false), true)
assert.equal(evidenceContext.blockedPlans.some((plan) => plan.sourceIntentTypes.includes('qwen_vlm_visual_understanding_request') && plan.decision === 'blocked'), true)
assert.equal(evidenceContext.blockedPlans.some((plan) => plan.sourceIntentTypes.includes('demucs_stem_separation_request') && plan.decision === 'blocked'), true)
assert.equal(syncInput.phaseId, '52E')
assert.equal(syncInput.supabaseSyncPolicy.rawPromptExecutionAllowed, false)
for (const script of approvedPlanValidationRequiredScripts) assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.noToolRuntimeExecution, true)
assert.equal(commandPlan.noWorkerExecution, true)
assert.equal(commandPlan.noProviderCalls, true)
assert.equal(commandPlan.noMigrations, true)
assert.equal(iamPlan.defaultMutationAllowed, false)
assert.equal(iamPlan.supabasePlan.migrationsAllowed, false)
assert.equal(iamPlan.supabasePlan.historicalBackfillAllowed, false)
assert.equal(approvedPlanValidationSafetyFlags.candidatePlanGenerationAllowed, false)
assert.equal(approvedPlanValidationSafetyFlags.toolRuntimeAllowed, false)
assert.equal(approvedPlanValidationSafetyFlags.workerExecutionAllowed, false)
assert.equal(approvedPlanValidationSafetyFlags.modelInferenceAllowed, false)
assert.equal(approvedPlanValidationSafetyFlags.providerCallsAllowed, false)
assert.equal(approvedPlanValidationSafetyFlags.productionReadyAllowed, false)
assert.equal(approvedPlanValidationSafetyFlags.externalBetaAllowed, false)
assert.equal(approvedPlanValidationSafetyFlags.broadMediaAllowed, false)

console.log('Phase 52E approved-plan snapshot validation smoke passed.')
