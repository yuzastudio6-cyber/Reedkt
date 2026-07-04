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

const requiredDocs = [
  'docs/project-edit-brief-owner-evidence-review-packet.md',
  'docs/project-edit-brief-owner-evidence-review-packet.json',
  'docs/project-edit-brief-owner-evidence-intake-template.json',
  'docs/project-edit-brief-owner-evidence-readiness-evaluator.md',
  'src/backend/project-edit-brief-production/owner-evidence-readiness.ts',
]

for (const doc of requiredDocs) {
  assert.equal(existsSync(path.join(repoRoot, doc)), true, `${doc} should exist`)
}

const packet = JSON.parse(read('docs/project-edit-brief-owner-evidence-review-packet.json')) as {
  milestone?: string
  decision?: string
  status?: string
  requiredOwnerInputs?: Array<{
    id?: string
    label?: string
    reviewGroup?: string
    decisionRequired?: string
    minimumEvidence?: string[]
    acceptedStatuses?: string[]
  }>
  evidenceRecordRequirements?: {
    approvedOrWaivedRequires?: string[]
    missingOrRejectedBlocksRpEditBrief16?: boolean
    secretsRawPromptsSignedUrlsForbiddenAsEvidence?: boolean
    sourceControlMustNotContainPrivateMediaOrCredentials?: boolean
  }
  currentReadiness?: {
    checkedInTemplateReadyForRpEditBrief16?: boolean
    missingInputCount?: number
    supabasePersistenceImplementationAllowed?: boolean
  }
  launchBoundary?: Record<string, boolean>
  nextMilestoneWhenEvidencePasses?: string
}

const markdown = read('docs/project-edit-brief-owner-evidence-review-packet.md')
const roadmap = read('docs/edit-brief-milestone-roadmap.md')
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const template = JSON.parse(read('docs/project-edit-brief-owner-evidence-intake-template.json')) as ProjectEditBriefOwnerEvidenceIntake
const templateReadiness = evaluateProjectEditBriefOwnerEvidenceReadiness(template)

assert.equal(packet.milestone, 'RP-EDITBRIEF-15C')
assert.equal(packet.decision, 'project_edit_brief_owner_evidence_review_packet_passed_ready_for_owner_assignment')
assert.equal(packet.status, 'ready_for_owner_assignment')
assert.equal(packet.requiredOwnerInputs?.length, PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS.length)

const packetIds = packet.requiredOwnerInputs?.map((input) => input.id) ?? []
assert.deepEqual(packetIds, [...PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS])
for (const input of packet.requiredOwnerInputs ?? []) {
  assert.equal(typeof input.label, 'string', `${input.id} should have a label`)
  assert.ok(input.label && input.label.length > 0, `${input.id} should have a label`)
  assert.ok(input.reviewGroup && input.reviewGroup.length > 0, `${input.id} should have a review group`)
  assert.ok(input.decisionRequired && input.decisionRequired.length > 0, `${input.id} should describe the decision`)
  assert.ok(Array.isArray(input.minimumEvidence), `${input.id} should list minimum evidence`)
  assert.ok((input.minimumEvidence?.length ?? 0) >= 5, `${input.id} should have specific minimum evidence`)
  assert.deepEqual(input.acceptedStatuses, ['approved', 'waived', 'rejected'])
}

assert.deepEqual(packet.evidenceRecordRequirements?.approvedOrWaivedRequires, ['owner', 'evidenceRef', 'reviewedAt', 'notes'])
assert.equal(packet.evidenceRecordRequirements?.missingOrRejectedBlocksRpEditBrief16, true)
assert.equal(packet.evidenceRecordRequirements?.secretsRawPromptsSignedUrlsForbiddenAsEvidence, true)
assert.equal(packet.evidenceRecordRequirements?.sourceControlMustNotContainPrivateMediaOrCredentials, true)
assert.equal(packet.currentReadiness?.checkedInTemplateReadyForRpEditBrief16, false)
assert.equal(packet.currentReadiness?.missingInputCount, PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS.length)
assert.equal(packet.currentReadiness?.supabasePersistenceImplementationAllowed, false)
assert.equal(packet.launchBoundary?.externalBetaAllowed, false)
assert.equal(packet.launchBoundary?.realUserMediaBetaAllowed, false)
assert.equal(packet.launchBoundary?.paidProductionAllowed, false)
assert.equal(packet.nextMilestoneWhenEvidencePasses, 'RP-EDITBRIEF-16 - Production Persistence Implementation Plan')

assert.equal(templateReadiness.readyForRpEditBrief16, false, 'checked-in owner evidence template should remain blocked')
assert.equal(templateReadiness.missingInputs.length, PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS.length)
assert.equal(roadmap.includes('RP-EDITBRIEF-15C'), true, 'roadmap should include RP-EDITBRIEF-15C')
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-owner-evidence-review-packet'], 'tsx server/smoke/project-edit-brief-owner-evidence-review-packet-smoke.ts')
assert.equal(markdown.includes('This packet makes the owner review actionable; it does not remove the blocker.'), true)
assert.equal(markdown.includes('*** Add File'), false, 'review packet doc should not contain patch markers')
assert.equal(markdown.includes('import assert'), false, 'review packet doc should not contain embedded source')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-owner-evidence-review-packet',
  status: 'passed',
  requiredOwnerInputs: packet.requiredOwnerInputs?.length,
  checkedInTemplateReady: templateReadiness.readyForRpEditBrief16,
  decision: packet.decision,
  nextMilestone: packet.nextMilestoneWhenEvidencePasses,
}, null, 2))
