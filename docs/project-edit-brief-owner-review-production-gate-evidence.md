# Project Edit Brief Owner Review And Production Gate Evidence

## Decision

`project_edit_brief_owner_review_production_gate_evidence_collection_blocked_pending_owner_inputs`

## Scope

RP-EDITBRIEF-15 collects the exact owner/operator evidence needed after RP-EDITBRIEF-13 and RP-EDITBRIEF-14. It does not approve production, external beta, real-user-media beta, live Supabase persistence, Qwen/runtime behavior, uploads, workers, render/export, or credits.

The milestone is intentionally blocked until named owner inputs are supplied outside source control and then recorded in a later approved implementation phase.

## Required Owner Inputs

1. Canonical workflow approval: whether Project Edit Brief becomes the default first-pass workflow, remains optional, or is gated to internal users.
2. Durable root schema approval: `edit_briefs`, `edit_cues`, cue child tables, `edit_brief_application_logs`, and `edit_session_export_settings`.
3. Auth/access policy approval: workspace membership, project ownership, session access, read/write role matrix, and admin/archive boundaries.
4. Supabase security approval: RLS predicates, explicit Data API grants, exposed schemas, service-role boundary, Storage policy, migration ordering, generated type refresh, local validation, remote staging validation, and rollback.
5. Media lifecycle approval: source upload, private artifact inputs/outputs, metadata-only attachment upgrade path, retention/deletion, and signed URL delivery policy.
6. Planner integration approval: how Brief Plan Hints enter approved plan snapshots, conflict handling, priority rules, immutable versioning, and revision reset behavior.
7. Credit/cost approval: estimate display, reservation requirement, spend/release/refund behavior, cost metering event ownership, and no silent overage behavior.
8. Provider/model approval: Qwen Marker Chat mode, Qwen2.5-VL visual context mode, model/license review, prompt redaction, and provider fallback rules.
9. Worker/render approval: which backend workers may consume Brief outputs, idempotency keys, artifact manifests, QA gates, render readiness, progress events, and rollback.
10. Operations approval: monitoring, incident runbook, privacy/legal review, security review, deployment owner, rollback owner, beta cohort owner, and support escalation owner.

## Current Evidence State

- RP-EDITBRIEF-13 confirms durable Supabase roots and policy gates, but no migration or read/write enablement.
- RP-EDITBRIEF-14 confirms readiness is conditional and not permanently hardcoded false, but default external beta, real-user-media beta, and paid production remain blocked.
- Project Edit Brief mock routes remain non-production and do not require Supabase or service-role access.
- Internal dry-run can remain testable; external beta and production require the missing owner inputs above.

## Blocked Scope

- External beta: blocked.
- Real-user-media beta: blocked.
- Paid production: blocked.
- Supabase read/write: blocked.
- Storage write/signed URL source truth: blocked.
- Provider/model calls: blocked unless separately approved.
- Upload, media processing, worker dispatch, render/export, and credit reservation/spend: blocked.

## Next Milestone

`RP-EDITBRIEF-16 - Production Persistence Implementation Plan`
*** Add File: /private/tmp/reeditpro-edit-brief-reconciliation/docs/project-edit-brief-owner-review-production-gate-evidence.json
{
  "id": "project-edit-brief-owner-review-production-gate-evidence",
  "milestone": "RP-EDITBRIEF-15",
  "decision": "project_edit_brief_owner_review_production_gate_evidence_collection_blocked_pending_owner_inputs",
  "status": "blocked_pending_owner_inputs",
  "requiredOwnerInputs": [
    "canonical_workflow_approval",
    "durable_root_schema_approval",
    "auth_access_policy_approval",
    "supabase_security_approval",
    "media_lifecycle_approval",
    "planner_integration_approval",
    "credit_cost_approval",
    "provider_model_approval",
    "worker_render_approval",
    "operations_approval"
  ],
  "currentEvidenceState": {
    "rpEditBrief13SupabasePersistencePlan": "passed_plan_only",
    "rpEditBrief14ConditionalReadinessGates": "passed_conditional_policy_only",
    "projectEditBriefRoutesProductionReady": false,
    "externalBetaAllowedByDefault": false,
    "realUserMediaBetaAllowedByDefault": false,
    "paidProductionAllowedByDefault": false
  },
  "blockedScope": {
    "externalBeta": true,
    "realUserMediaBeta": true,
    "paidProduction": true,
    "supabaseReadWrite": true,
    "storageWrite": true,
    "signedUrlSourceTruth": true,
    "providerOrModelCalls": true,
    "uploads": true,
    "mediaProcessing": true,
    "workerDispatch": true,
    "renderOrExport": true,
    "creditReservationOrSpend": true
  },
  "nextMilestone": "RP-EDITBRIEF-16 - Production Persistence Implementation Plan"
}
*** Add File: /private/tmp/reeditpro-edit-brief-reconciliation/server/smoke/project-edit-brief-owner-review-production-gate-evidence-smoke.ts
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

const ownerlessAttempt = evaluateBetaGoNoGo({
  checklist: [],
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
})
assert.equal(ownerlessAttempt.externalBetaAllowed, true, 'gate evaluator can pass when technical evidence is supplied')
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
