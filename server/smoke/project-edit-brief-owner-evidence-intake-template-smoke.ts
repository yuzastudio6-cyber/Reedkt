import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { buildBetaReadinessReport } from '../beta-readiness'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const markdownPath = 'docs/project-edit-brief-owner-evidence-intake-template.md'
const jsonPath = 'docs/project-edit-brief-owner-evidence-intake-template.json'

assert.equal(existsSync(path.join(repoRoot, markdownPath)), true, `${markdownPath} should exist`)
assert.equal(existsSync(path.join(repoRoot, jsonPath)), true, `${jsonPath} should exist`)

const markdown = read(markdownPath)
const intake = JSON.parse(read(jsonPath)) as {
  decision?: string
  status?: string
  allowedStatuses?: string[]
  requiredOwnerInputs?: Array<{
    id?: string
    status?: string
    owner?: string | null
    evidenceRef?: string | null
    reviewedAt?: string | null
  }>
  gateState?: Record<string, boolean>
  nextMilestoneWhenComplete?: string
}

const expectedInputs = [
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
]

assert.equal(intake.decision, 'project_edit_brief_owner_evidence_intake_template_ready_blocked_until_completed')
assert.equal(intake.status, 'template_missing_owner_inputs')
assert.deepEqual(intake.allowedStatuses, ['missing', 'approved', 'rejected', 'waived'])
assert.deepEqual(intake.requiredOwnerInputs?.map((input) => input.id), expectedInputs)
assert.equal(intake.requiredOwnerInputs?.every((input) => input.status === 'missing'), true, 'checked-in template should not fake approvals')
assert.equal(intake.requiredOwnerInputs?.every((input) => input.owner === null && input.evidenceRef === null && input.reviewedAt === null), true, 'checked-in template should not include placeholder owners as evidence')

for (const [key, value] of Object.entries(intake.gateState ?? {})) {
  assert.equal(value, false, `${key} should remain false while intake is incomplete`)
}

const defaultReadiness = buildBetaReadinessReport()
assert.equal(defaultReadiness.goNoGo.externalBetaAllowed, false, 'external beta should remain blocked with missing owner inputs')
assert.equal(defaultReadiness.goNoGo.realUserMediaBetaAllowed, false, 'real-user-media beta should remain blocked with missing owner inputs')
assert.equal(defaultReadiness.goNoGo.paidProductionAllowed, false, 'paid production should remain blocked with missing owner inputs')
assert.equal(markdown.includes('This RP-EDITBRIEF-15A template'), true, 'markdown should describe RP-EDITBRIEF-15A')
assert.equal(markdown.includes('It is not an approval.'), true, 'markdown should preserve approval boundary')
assert.equal(markdown.includes('*** Add File'), false, 'markdown should not contain patch markers')
assert.equal(markdown.includes('import assert'), false, 'markdown should not contain embedded source code')
assert.equal(intake.nextMilestoneWhenComplete, 'RP-EDITBRIEF-16 - Production Persistence Implementation Plan')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-owner-evidence-intake-template',
  status: 'passed',
  decision: intake.decision,
  requiredOwnerInputs: intake.requiredOwnerInputs?.length,
  readyForRpEditBrief16: intake.gateState?.readyForRpEditBrief16,
  nextMilestoneWhenComplete: intake.nextMilestoneWhenComplete,
}, null, 2))
