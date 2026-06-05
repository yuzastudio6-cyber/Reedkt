import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildControlledInternalTestPlan,
  buildNotAttemptedPhase52FSyncResult,
  buildPhase52FSupabaseSyncInput,
  buildSystemBlockerInventory,
  buildSystemHandoffPackets,
  buildSystemReadinessCommandPlan,
  buildSystemReadinessIamPlan,
  buildSystemReadinessManifest,
  buildSystemReadinessQaSummary,
  buildSystemReadinessReport,
  buildSystemRiskRegister,
  buildSystemSourceAudit,
  reconcileSystemFeatureGates,
  resolveSystemEvidenceContext,
  resolveWorkstreamReadiness,
  systemReadinessRequiredScripts,
  systemReadinessSafetyFlags,
} from '../activation/system-readiness-reconciliation'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const report = buildSystemReadinessReport()
const audit = buildSystemSourceAudit(new Date('2026-06-05T00:00:00.000Z'))
const evidence = resolveSystemEvidenceContext(audit)
const readiness = resolveWorkstreamReadiness(evidence)
const plan = buildControlledInternalTestPlan(readiness)
const blockers = buildSystemBlockerInventory(audit)
const gates = reconcileSystemFeatureGates()
const risks = buildSystemRiskRegister()
const handoffs = buildSystemHandoffPackets({ readiness, blockers })
const syncResult = buildNotAttemptedPhase52FSyncResult()
const manifest = buildSystemReadinessManifest({
  runId: 'phase52f-20260605T000000',
  repoOwnershipAudit: audit,
  evidenceContext: evidence,
  workstreamReadiness: readiness,
  controlledInternalTestPlan: plan,
  blockerInventory: blockers,
  featureGateReconciliation: gates,
  systemRiskRegister: risks,
  handoffPackets: handoffs,
})
const qa = buildSystemReadinessQaSummary({
  packageScripts: packageJson.scripts,
  docsPresent: {
    'docs/agents/system-readiness-reconciliation-runbook.md': true,
    'docs/agents/system-readiness-reconciliation-policy.md': true,
    'docs/agents/system-readiness-reconciliation-qa-policy.md': true,
    'docs/activation-phase-52f-system-readiness-reconciliation-results.md': true,
  },
  repoOwnershipAudit: audit,
  evidenceContext: evidence,
  workstreamReadiness: readiness,
  controlledInternalTestPlan: plan,
  blockerInventory: blockers,
  featureGateReconciliation: gates,
  systemRiskRegister: risks,
  handoffPackets: handoffs,
  manifest,
  supabaseSyncResult: syncResult,
  executionMode: false,
})
const syncInput = buildPhase52FSupabaseSyncInput('phase52f-20260605T000000', qa)
const commandPlan = buildSystemReadinessCommandPlan()
const iamPlan = buildSystemReadinessIamPlan()

assert.equal(report.phase, '52F')
assert.equal(evidence.phase52E.runId, 'phase52e-20260605T175613')
assert.equal(readiness.length, 12)
assert.equal(plan.length, 7)
assert.equal(plan.every((lane) => lane.executableInPhase52F === false), true)
assert.equal(blockers.some((blocker) => blocker.blockerId === 'worker_execution_not_allowed_in_phase52f'), true)
assert.equal(gates.every((gate) => gate.actualEnabled === false), true)
assert.equal(risks.length >= 14, true)
assert.equal(handoffs.length, 12)
assert.equal(qa.status, 'passed')
assert.equal(syncInput.phaseId, '52F')
assert.equal(syncInput.supabaseSyncPolicy.rawPromptExecutionAllowed, false)
for (const script of systemReadinessRequiredScripts) assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
assert.equal(commandPlan.noToolRuntimeExecution, true)
assert.equal(commandPlan.noWorkerExecution, true)
assert.equal(commandPlan.noProviderCalls, true)
assert.equal(commandPlan.noMigrations, true)
assert.equal(iamPlan.defaultMutationAllowed, false)
assert.equal(iamPlan.supabasePlan.migrationsAllowed, false)
assert.equal(systemReadinessSafetyFlags.toolRuntimeAllowed, false)
assert.equal(systemReadinessSafetyFlags.workerExecutionAllowed, false)
assert.equal(systemReadinessSafetyFlags.modelInferenceAllowed, false)
assert.equal(systemReadinessSafetyFlags.providerCallsAllowed, false)
assert.equal(systemReadinessSafetyFlags.productionReadyAllowed, false)
assert.equal(systemReadinessSafetyFlags.externalBetaAllowed, false)
assert.equal(systemReadinessSafetyFlags.broadMediaAllowed, false)

console.log('Phase 52F system readiness reconciliation smoke passed.')
