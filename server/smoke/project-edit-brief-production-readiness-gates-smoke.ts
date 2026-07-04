import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROJECT_EDIT_BRIEF_API_ROUTES,
  createProjectEditBriefApiRouteRegistrySummary,
} from '../../src/backend/api/project-edit-brief-api-route-registry'
import {
  buildBetaReadinessReport,
  evaluateBetaGoNoGo,
  launchReadinessGatePolicy,
} from '../beta-readiness'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const docs = [
  'docs/project-edit-brief-production-readiness-gates.md',
  'docs/project-edit-brief-production-readiness-gates.json',
  'docs/project-edit-brief-supabase-persistence-plan.md',
  'docs/edit-brief-milestone-roadmap.md',
]

for (const doc of docs) {
  assert.equal(existsSync(path.join(repoRoot, doc)), true, `${doc} should exist`)
}

const gateDoc = read('docs/project-edit-brief-production-readiness-gates.md')
const gateJson = JSON.parse(read('docs/project-edit-brief-production-readiness-gates.json')) as {
  decision?: string
  launchStages?: string[]
  defaultAllowed?: Record<string, boolean>
  conditionalPassesWhenEvidenceSupplied?: Record<string, boolean>
  hardInvariants?: string[]
  blockedScope?: Record<string, boolean>
  nextMilestone?: string
}

assert.equal(gateJson.decision, 'project_edit_brief_production_readiness_gates_passed_conditional_gate_policy_ready_for_owner_review')
assert.deepEqual(gateJson.launchStages, ['internal_dry_run', 'bounded_tool_execution', 'external_beta', 'real_user_media_beta', 'paid_production'])
assert.deepEqual(launchReadinessGatePolicy.map((item) => item.stage), gateJson.launchStages)
assert.equal(gateJson.nextMilestone, 'RP-EDITBRIEF-15 - Owner Review and Production Gate Evidence Collection')

for (const invariant of [
  'no_raw_prompts_as_source_truth',
  'no_secrets_or_service_role_in_frontend',
  'no_signed_urls_as_source_truth',
  'approved_plan_snapshot_required',
  'credit_estimate_reservation_required',
  'no_silent_billing',
]) {
  assert.ok(gateJson.hardInvariants?.includes(invariant), `gate JSON should preserve ${invariant}`)
}

for (const [key, value] of Object.entries(gateJson.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain disabled by RP-EDITBRIEF-14`)
}

const defaultReport = buildBetaReadinessReport()
assert.equal(defaultReport.goNoGo.internalDryRunTestingAllowed, gateJson.defaultAllowed?.internalDryRunTestingAllowed)
assert.equal(defaultReport.goNoGo.externalBetaAllowed, false)
assert.equal(defaultReport.goNoGo.realUserMediaBetaAllowed, false)
assert.equal(defaultReport.goNoGo.paidProductionAllowed, false)
assert.equal(defaultReport.productionReady, false)

const passedChecklist = [
  { id: 'architecture_docs_complete', label: 'Architecture docs complete', status: 'passed' as const, requiredForExternalBeta: true, notes: [] },
  { id: 'contracts_schema_complete', label: 'Contracts/schema complete', status: 'passed' as const, requiredForExternalBeta: true, notes: [] },
]
const externalAllowed = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
})
assert.equal(externalAllowed.externalBetaAllowed, true, 'external beta should be conditional, not permanently false')

const productionAllowed = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
  privateMediaApproved: true,
  artifactPrivacyEvidenceApproved: true,
  productionDeploymentApproved: true,
  billingLedgerPersistenceApproved: true,
  costControlsApproved: true,
  incidentRunbookApproved: true,
  observabilityApproved: true,
  noHardLaunchBlockers: true,
})
assert.equal(productionAllowed.realUserMediaBetaAllowed, true, 'real-user-media beta should pass with explicit evidence')
assert.equal(productionAllowed.paidProductionAllowed, true, 'paid production should pass with explicit evidence')

const rawPromptBlocked = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
  rawPromptSafetyPassed: false,
})
assert.equal(rawPromptBlocked.externalBetaAllowed, false, 'raw prompt safety should remain a hard blocker')

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0, 'Project Edit Brief routes should remain non-production in RP-EDITBRIEF-14')
assert.equal(PROJECT_EDIT_BRIEF_API_ROUTES.every((route) => !route.requiresSupabase), true, 'Project Edit Brief mock routes should not require Supabase yet')
assert.ok(gateDoc.includes('stale blanket blocking'), 'gate doc should explain stale blocker replacement')
assert.ok(gateDoc.includes('No production route was enabled.'), 'gate doc should preserve no-runtime boundary')
assert.equal(gateDoc.includes('*** Add File'), false, 'gate doc must not contain patch markers')
assert.equal(gateDoc.includes('server/smoke/'), false, 'gate doc must not contain embedded smoke paths')
assert.equal(gateDoc.includes('import assert'), false, 'gate doc must not contain embedded source code')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-production-readiness-gates',
  status: 'passed',
  decision: gateJson.decision,
  defaultExternalBetaAllowed: defaultReport.goNoGo.externalBetaAllowed,
  conditionalExternalBetaAllowed: externalAllowed.externalBetaAllowed,
  conditionalPaidProductionAllowed: productionAllowed.paidProductionAllowed,
  productionReadyRoutes: routeSummary.productionReadyCount,
  nextMilestone: gateJson.nextMilestone,
}, null, 2))
