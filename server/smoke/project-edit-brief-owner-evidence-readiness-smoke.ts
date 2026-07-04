import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS,
  evaluateProjectEditBriefOwnerEvidenceReadiness,
  type ProjectEditBriefOwnerEvidenceIntake,
} from '../../src/backend/project-edit-brief-production/owner-evidence-readiness'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const docs = [
  'docs/project-edit-brief-owner-evidence-readiness-evaluator.md',
  'docs/project-edit-brief-owner-evidence-readiness-evaluator.json',
  'docs/project-edit-brief-owner-evidence-intake-template.json',
]

for (const doc of docs) {
  assert.equal(existsSync(path.join(repoRoot, doc)), true, `${doc} should exist`)
}

const template = JSON.parse(read('docs/project-edit-brief-owner-evidence-intake-template.json')) as ProjectEditBriefOwnerEvidenceIntake
const evaluatorDoc = read('docs/project-edit-brief-owner-evidence-readiness-evaluator.md')
const evaluatorJson = JSON.parse(read('docs/project-edit-brief-owner-evidence-readiness-evaluator.json')) as {
  decision?: string
  requiredInputCount?: number
  checkedInTemplateExpectedReady?: boolean
  syntheticCompleteIntakeExpectedReady?: boolean
  launchBoundary?: Record<string, boolean>
  nextMilestoneWhenReady?: string
}

const templateReadiness = evaluateProjectEditBriefOwnerEvidenceReadiness(template)
assert.equal(templateReadiness.readyForRpEditBrief16, false, 'checked-in owner evidence template should remain blocked')
assert.equal(templateReadiness.decision, 'project_edit_brief_owner_evidence_readiness_blocked_pending_inputs')
assert.deepEqual(templateReadiness.missingInputs, [...PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS])
assert.equal(templateReadiness.externalBetaAllowed, false)
assert.equal(templateReadiness.realUserMediaBetaAllowed, false)
assert.equal(templateReadiness.paidProductionAllowed, false)

const completeIntake: ProjectEditBriefOwnerEvidenceIntake = {
  ...template,
  status: 'complete_owner_inputs_for_smoke_only',
  requiredOwnerInputs: template.requiredOwnerInputs.map((input, index) => ({
    ...input,
    status: 'approved',
    owner: `owner-team-${index + 1}`,
    evidenceRef: `https://example.com/reeditpro/edit-brief-owner-evidence/${input.id}`,
    reviewedAt: '2026-07-04T12:00:00.000Z',
    notes: [`Synthetic smoke-only approval for ${input.id}.`],
  })),
}
const completeReadiness = evaluateProjectEditBriefOwnerEvidenceReadiness(completeIntake)
assert.equal(completeReadiness.readyForRpEditBrief16, true, 'complete owner evidence intake should unlock RP-EDITBRIEF-16 planning')
assert.equal(completeReadiness.supabasePersistenceImplementationAllowed, true)
assert.equal(completeReadiness.decision, 'project_edit_brief_owner_evidence_readiness_passed_ready_for_rp_editbrief_16')
assert.equal(completeReadiness.approvedOrWaivedInputs.length, PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS.length)
assert.deepEqual(completeReadiness.missingInputs, [])
assert.deepEqual(completeReadiness.invalidInputs, [])
assert.deepEqual(completeReadiness.rejectedInputs, [])
assert.equal(completeReadiness.externalBetaAllowed, false, 'complete owner evidence does not directly allow external beta')
assert.equal(completeReadiness.realUserMediaBetaAllowed, false, 'complete owner evidence does not directly allow real-user-media beta')
assert.equal(completeReadiness.paidProductionAllowed, false, 'complete owner evidence does not directly allow paid production')

assert.equal(evaluatorJson.decision, 'project_edit_brief_owner_evidence_readiness_evaluator_passed_ready_for_owner_input_collection')
assert.equal(evaluatorJson.requiredInputCount, PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS.length)
assert.equal(evaluatorJson.checkedInTemplateExpectedReady, false)
assert.equal(evaluatorJson.syntheticCompleteIntakeExpectedReady, true)
assert.equal(evaluatorJson.launchBoundary?.externalBetaAllowed, false)
assert.equal(evaluatorJson.launchBoundary?.realUserMediaBetaAllowed, false)
assert.equal(evaluatorJson.launchBoundary?.paidProductionAllowed, false)
assert.equal(evaluatorJson.nextMilestoneWhenReady, 'RP-EDITBRIEF-16 - Production Persistence Implementation Plan')
assert.equal(evaluatorDoc.includes('It does not approve any owner input'), true)
assert.equal(evaluatorDoc.includes('*** Add File'), false, 'evaluator doc should not contain patch markers')
assert.equal(evaluatorDoc.includes('import assert'), false, 'evaluator doc should not contain embedded source')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-owner-evidence-readiness',
  status: 'passed',
  checkedInTemplateReady: templateReadiness.readyForRpEditBrief16,
  syntheticCompleteReady: completeReadiness.readyForRpEditBrief16,
  requiredOwnerInputs: PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS.length,
  nextMilestone: completeReadiness.nextMilestone,
}, null, 2))
