import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  createProjectEditBriefApiRouteRegistrySummary,
} from '../../src/backend/api/project-edit-brief-api-route-registry'
import { buildBetaReadinessReport, evaluateBetaGoNoGo } from '../beta-readiness'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const docs = [
  'docs/project-edit-brief-owner-review-production-gate-evidence.md',
  'docs/project-edit-brief-owner-review-production-gate-evidence.json',
  'docs/project-edit-brief-production-readiness-gates.md',
  'docs/project-edit-brief-supabase-persistence-plan.md',
  'docs/edit-brief-milestone-roadmap.md',
]

for (const doc of docs) {
  assert.equal(existsSync(path.join(repoRoot, doc)), true, `${doc} should exist`)
}

const evidenceDoc = read('docs/project-edit-brief-owner-review-production-gate-evidence.md')
const evidenceJson = JSON.parse(read('docs/project-edit-brief-owner-review-production-gate-evidence.json')) as {
  decision?: string
  status?: string
  requiredOwnerInputs?: string[]
  currentEvidenceState?: Record<string, string | boolean>
  blockedScope?: Record<string, boolean>
  nextMilestone?: string
}

assert.equal(evidenceJson.decision, 'project_edit_brief_owner_review_production_gate_evidence_collection_blocked_pending_owner_inputs')
assert.equal(evidenceJson.status, 'blocked_pending_owner_inputs')
assert.equal(evidenceJson.requiredOwnerInputs?.length, 10, 'owner evidence collection should name ten owner input groups')
assert.equal(evidenceJson.nextMilestone, 'RP-EDITBRIEF-16 - Production Persistence Implementation Plan')

for (const input of [
  'canonical_workflow_approval',
  'durable_root_schema_approval',
  'auth_access_policy_approval',
  'supabase_security_approval',
  'media_lifecycle_approval',
  'planner_integration_approval',
  'credit_cost_approval',
  'provider_model_approval',
  'worker_render_approval',
  'operations_approval',
]) {
  assert.ok(evidenceJson.requiredOwnerInputs?.includes(input), `required owner input ${input} should be listed`)
}

for (const [key, value] of Object.entries(evidenceJson.blockedScope ?? {})) {
  assert.equal(value, true, `${key} should remain blocked while owner inputs are missing`)
}

const defaultReport = buildBetaReadinessReport()
assert.equal(defaultReport.goNoGo.externalBetaAllowed, false, 'external beta should remain blocked by default')
assert.equal(defaultReport.goNoGo.realUserMediaBetaAllowed, false, 'real-user-media beta should remain blocked by default')
assert.equal(defaultReport.goNoGo.paidProductionAllowed, false, 'paid production should remain blocked by default')

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0, 'Project Edit Brief routes should remain non-production')

const technicalEvidenceOnly = evaluateBetaGoNoGo({
  checklist: [],
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
})
assert.equal(technicalEvidenceOnly.externalBetaAllowed, true, 'gate evaluator can pass when technical evidence is supplied')
assert.equal(
  evidenceJson.currentEvidenceState?.externalBetaAllowedByDefault,
  false,
  'Edit Brief owner evidence packet should keep default external beta blocked until owner inputs are recorded',
)
assert.ok(evidenceDoc.includes('blocked until named owner inputs are supplied'), 'evidence doc should explicitly block pending owner inputs')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-owner-review-production-gate-evidence',
  status: 'passed',
  decision: evidenceJson.decision,
  requiredOwnerInputs: evidenceJson.requiredOwnerInputs?.length,
  projectEditBriefProductionReadyRoutes: routeSummary.productionReadyCount,
  defaultExternalBetaAllowed: defaultReport.goNoGo.externalBetaAllowed,
  nextMilestone: evidenceJson.nextMilestone,
}, null, 2))
