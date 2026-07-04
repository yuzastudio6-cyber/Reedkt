import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  evaluateProjectEditBriefOwnerEvidenceReadiness,
  parseProjectEditBriefOwnerEvidenceIntake,
  type ProjectEditBriefOwnerEvidenceIntake,
} from '../../src/backend/project-edit-brief-production/owner-evidence-readiness'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const requiredFiles = [
  'docs/project-edit-brief-owner-evidence-schema-validation.md',
  'docs/project-edit-brief-owner-evidence-schema-validation.json',
  'docs/project-edit-brief-owner-evidence-intake-template.json',
  'src/backend/project-edit-brief-production/owner-evidence-readiness.ts',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const templateUnknown = JSON.parse(read('docs/project-edit-brief-owner-evidence-intake-template.json')) as unknown
const parsedTemplate = parseProjectEditBriefOwnerEvidenceIntake(templateUnknown)
assert.equal(parsedTemplate.success, true, 'checked-in owner evidence template should be schema-valid')
assert.equal(
  evaluateProjectEditBriefOwnerEvidenceReadiness((parsedTemplate as { success: true; intake: ProjectEditBriefOwnerEvidenceIntake }).intake).readyForRpEditBrief16,
  false,
  'schema-valid template should still be readiness-blocked',
)

const template = templateUnknown as ProjectEditBriefOwnerEvidenceIntake
const missingGateState = { ...template, gateState: undefined }
const invalidNotes = {
  ...template,
  requiredOwnerInputs: template.requiredOwnerInputs.map((input, index) => index === 0
    ? { ...input, notes: 'not-an-array' }
    : input),
}
const extraTopLevel = { ...template, unexpectedField: true }
const extraInputField = {
  ...template,
  requiredOwnerInputs: template.requiredOwnerInputs.map((input, index) => index === 0
    ? { ...input, unexpectedField: true }
    : input),
}

const malformedCases = [
  ['missing gateState', missingGateState],
  ['invalid notes', invalidNotes],
  ['extra top-level field', extraTopLevel],
  ['extra input field', extraInputField],
] as const

for (const [label, value] of malformedCases) {
  const parsed = parseProjectEditBriefOwnerEvidenceIntake(value)
  assert.equal(parsed.success, false, `${label} should fail schema validation`)
  assert.ok((parsed as { success: false; errors: string[] }).errors.length > 0, `${label} should produce schema errors`)
}

const validationDoc = read('docs/project-edit-brief-owner-evidence-schema-validation.md')
const validationJson = JSON.parse(read('docs/project-edit-brief-owner-evidence-schema-validation.json')) as {
  decision?: string
  parser?: string
  checkedInTemplateExpectedSchemaValid?: boolean
  malformedInputExpectedSchemaValid?: boolean
  schemaValidationDoesNotApproveOwnerEvidence?: boolean
  launchBoundary?: Record<string, boolean>
  nextMilestoneWhenEvidencePasses?: string
}
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }

assert.equal(validationJson.decision, 'project_edit_brief_owner_evidence_schema_validation_passed_ready_for_strict_owner_evidence_updates')
assert.equal(validationJson.parser, 'parseProjectEditBriefOwnerEvidenceIntake')
assert.equal(validationJson.checkedInTemplateExpectedSchemaValid, true)
assert.equal(validationJson.malformedInputExpectedSchemaValid, false)
assert.equal(validationJson.schemaValidationDoesNotApproveOwnerEvidence, true)
assert.equal(validationJson.launchBoundary?.externalBetaAllowed, false)
assert.equal(validationJson.launchBoundary?.realUserMediaBetaAllowed, false)
assert.equal(validationJson.launchBoundary?.paidProductionAllowed, false)
assert.equal(validationJson.nextMilestoneWhenEvidencePasses, 'RP-EDITBRIEF-16 - Production Persistence Implementation Plan')
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-owner-evidence-schema-validation'], 'tsx server/smoke/project-edit-brief-owner-evidence-schema-validation-smoke.ts')
assert.equal(validationDoc.includes('Schema validation proves the file is structurally safe to evaluate; it does not prove owner approval.'), true)
assert.equal(validationDoc.includes('*** Add File'), false, 'schema validation doc should not contain patch markers')
assert.equal(validationDoc.includes('import assert'), false, 'schema validation doc should not contain embedded source')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-owner-evidence-schema-validation',
  status: 'passed',
  checkedInTemplateSchemaValid: parsedTemplate.success,
  malformedCases: malformedCases.length,
  decision: validationJson.decision,
}, null, 2))
