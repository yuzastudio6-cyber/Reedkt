import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  evaluateProjectEditBriefOwnerEvidenceReadiness,
  parseProjectEditBriefOwnerEvidenceIntake,
  scanProjectEditBriefOwnerEvidenceSafety,
  type ProjectEditBriefOwnerEvidenceIntake,
} from '../../src/backend/project-edit-brief-production/owner-evidence-readiness'
import {
  createProjectEditBriefOwnerEvidenceExample,
} from '../../scripts/validation/project-edit-brief-owner-evidence-example-generator'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const requiredFiles = [
  'scripts/validation/project-edit-brief-owner-evidence-example-generator.ts',
  'docs/project-edit-brief-owner-evidence-example-generator.md',
  'docs/project-edit-brief-owner-evidence-example-generator.json',
  'docs/project-edit-brief-owner-evidence-intake-template.json',
  'docs/project-edit-brief-owner-evidence-review-packet.json',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const parsedTemplate = parseProjectEditBriefOwnerEvidenceIntake(JSON.parse(read('docs/project-edit-brief-owner-evidence-intake-template.json')))
assert.equal(parsedTemplate.success, true, 'checked-in owner evidence template should parse')
const template = (parsedTemplate as { success: true; intake: ProjectEditBriefOwnerEvidenceIntake }).intake
const reviewPacket = JSON.parse(read('docs/project-edit-brief-owner-evidence-review-packet.json')) as {
  requiredOwnerInputs: Array<{
    id: string
    label: string
    reviewGroup: string
    decisionRequired: string
    minimumEvidence: string[]
  }>
}

const draft = createProjectEditBriefOwnerEvidenceExample(template, reviewPacket, {
  mode: 'draft',
  reviewedAt: '2026-07-04T12:00:00.000Z',
})
const draftReadiness = evaluateProjectEditBriefOwnerEvidenceReadiness(draft)
const draftSafety = scanProjectEditBriefOwnerEvidenceSafety(draft)
assert.equal(draftReadiness.readyForRpEditBrief16, false, 'draft example should remain blocked')
assert.equal(draftSafety.safe, true, 'draft example should be safety-clean')
assert.ok(draft.requiredOwnerInputs.every((input) => input.status === 'missing'), 'draft inputs should remain missing')
assert.ok(draft.requiredOwnerInputs.every((input) => input.notes.some((note) => note.includes('Minimum evidence:'))), 'draft inputs should include minimum evidence notes')

const strictExample = createProjectEditBriefOwnerEvidenceExample(template, reviewPacket, {
  mode: 'strict-example',
  reviewedAt: '2026-07-04T12:00:00.000Z',
})
const strictReadiness = evaluateProjectEditBriefOwnerEvidenceReadiness(strictExample)
const strictSafety = scanProjectEditBriefOwnerEvidenceSafety(strictExample)
assert.equal(strictReadiness.readyForRpEditBrief16, true, 'strict synthetic example should pass readiness')
assert.equal(strictSafety.safe, true, 'strict synthetic example should be safety-clean')
assert.ok(strictExample.requiredOwnerInputs.every((input) => input.status === 'approved'), 'strict example inputs should be approved placeholders')
assert.ok(strictExample.requiredOwnerInputs.every((input) => input.evidenceRef?.startsWith('https://example.com/reeditpro/project-edit-brief-owner-evidence/')), 'strict example should use placeholder evidence refs')
assert.equal(strictExample.gateState.externalBetaAllowed, false)
assert.equal(strictExample.gateState.realUserMediaBetaAllowed, false)
assert.equal(strictExample.gateState.paidProductionAllowed, false)

const generatorDoc = read('docs/project-edit-brief-owner-evidence-example-generator.md')
const generatorJson = JSON.parse(read('docs/project-edit-brief-owner-evidence-example-generator.json')) as {
  decision?: string
  defaultMode?: string
  draftExpectedReadyForRpEditBrief16?: boolean
  strictExampleExpectedReadyForRpEditBrief16?: boolean
  strictExampleIsRealApproval?: boolean
  safetyScanRequired?: boolean
  launchBoundary?: Record<string, boolean>
}
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }

assert.equal(generatorJson.decision, 'project_edit_brief_owner_evidence_example_generator_passed_ready_for_safe_owner_evidence_drafting')
assert.equal(generatorJson.defaultMode, 'draft')
assert.equal(generatorJson.draftExpectedReadyForRpEditBrief16, false)
assert.equal(generatorJson.strictExampleExpectedReadyForRpEditBrief16, true)
assert.equal(generatorJson.strictExampleIsRealApproval, false)
assert.equal(generatorJson.safetyScanRequired, true)
assert.equal(generatorJson.launchBoundary?.externalBetaAllowed, false)
assert.equal(generatorJson.launchBoundary?.realUserMediaBetaAllowed, false)
assert.equal(generatorJson.launchBoundary?.paidProductionAllowed, false)
assert.equal(packageJson.scripts?.['generate:project-edit-brief-owner-evidence-draft'], 'tsx scripts/validation/project-edit-brief-owner-evidence-example-generator.ts --mode draft --stdout')
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-owner-evidence-example-generator'], 'tsx server/smoke/project-edit-brief-owner-evidence-example-generator-smoke.ts')
assert.equal(generatorDoc.includes('must not be committed as real owner evidence'), true)
assert.equal(generatorDoc.includes('*** Add File'), false, 'generator doc should not contain patch markers')
assert.equal(generatorDoc.includes('import assert'), false, 'generator doc should not contain embedded source')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-owner-evidence-example-generator',
  status: 'passed',
  draftReady: draftReadiness.readyForRpEditBrief16,
  strictExampleReady: strictReadiness.readyForRpEditBrief16,
  decision: generatorJson.decision,
}, null, 2))
