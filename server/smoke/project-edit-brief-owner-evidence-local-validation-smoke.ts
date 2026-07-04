import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS,
  evaluateProjectEditBriefOwnerEvidenceReadiness,
  scanProjectEditBriefOwnerEvidenceSafety,
  type ProjectEditBriefOwnerEvidenceIntake,
} from '../../src/backend/project-edit-brief-production/owner-evidence-readiness'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const requiredFiles = [
  'scripts/validation/project-edit-brief-owner-evidence-readiness-cli.ts',
  'docs/project-edit-brief-owner-evidence-local-validation.md',
  'docs/project-edit-brief-owner-evidence-local-validation.json',
  'docs/project-edit-brief-owner-evidence-intake-template.json',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const validationDoc = read('docs/project-edit-brief-owner-evidence-local-validation.md')
const validationJson = JSON.parse(read('docs/project-edit-brief-owner-evidence-local-validation.json')) as {
  decision?: string
  requiredOwnerInputCount?: number
  defaultInputAllowBlocked?: boolean
  safetyFailures?: string[]
  launchBoundary?: Record<string, boolean>
  nextMilestoneWhenStrictPasses?: string
}
const template = JSON.parse(read('docs/project-edit-brief-owner-evidence-intake-template.json')) as ProjectEditBriefOwnerEvidenceIntake
const templateReadiness = evaluateProjectEditBriefOwnerEvidenceReadiness(template)
const templateSafety = scanProjectEditBriefOwnerEvidenceSafety(template)

const safeCompleteIntake: ProjectEditBriefOwnerEvidenceIntake = {
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
const safeReadiness = evaluateProjectEditBriefOwnerEvidenceReadiness(safeCompleteIntake)
const safeSafety = scanProjectEditBriefOwnerEvidenceSafety(safeCompleteIntake)

const unsafeIntake: ProjectEditBriefOwnerEvidenceIntake = {
  ...safeCompleteIntake,
  requiredOwnerInputs: safeCompleteIntake.requiredOwnerInputs.map((input, index) => index === 0
    ? {
      ...input,
      evidenceRef: 'https://storage.example.com/source.mp4?X-Amz-Signature=abc123',
      notes: ['Contains raw prompt transcript and service_role key placeholder.'],
    }
    : input),
}
const unsafeSafety = scanProjectEditBriefOwnerEvidenceSafety(unsafeIntake)

assert.equal(packageJson.scripts?.['check:project-edit-brief-owner-evidence-readiness'], 'tsx scripts/validation/project-edit-brief-owner-evidence-readiness-cli.ts --input docs/project-edit-brief-owner-evidence-intake-template.json --allow-blocked')
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-owner-evidence-local-validation'], 'tsx server/smoke/project-edit-brief-owner-evidence-local-validation-smoke.ts')
assert.equal(validationJson.decision, 'project_edit_brief_owner_evidence_local_validation_passed_ready_for_owner_evidence_preflight')
assert.equal(validationJson.requiredOwnerInputCount, PROJECT_EDIT_BRIEF_OWNER_EVIDENCE_INPUT_IDS.length)
assert.equal(validationJson.defaultInputAllowBlocked, true)
assert.deepEqual(validationJson.safetyFailures, [
  'secret_like_evidence',
  'signed_url_like_evidence',
  'raw_prompt_like_evidence',
  'private_media_or_artifact_like_evidence',
])
assert.equal(validationJson.launchBoundary?.externalBetaAllowed, false)
assert.equal(validationJson.launchBoundary?.realUserMediaBetaAllowed, false)
assert.equal(validationJson.launchBoundary?.paidProductionAllowed, false)
assert.equal(validationJson.nextMilestoneWhenStrictPasses, 'RP-EDITBRIEF-16 - Production Persistence Implementation Plan')

assert.equal(templateReadiness.readyForRpEditBrief16, false, 'checked-in template remains blocked')
assert.equal(templateSafety.safe, true, 'checked-in template should not contain unsafe evidence')
assert.equal(safeReadiness.readyForRpEditBrief16, true, 'safe complete intake should pass readiness')
assert.equal(safeSafety.safe, true, 'safe complete intake should pass safety scan')
assert.equal(unsafeSafety.safe, false, 'unsafe evidence should fail safety scan')
assert.ok(unsafeSafety.signedUrlEvidence.length > 0, 'signed URL-like evidence should be reported')
assert.ok(unsafeSafety.rawPromptEvidence.length > 0, 'raw prompt-like evidence should be reported')
assert.ok(unsafeSafety.secretLikeEvidence.length > 0, 'secret-like evidence should be reported')
assert.ok(unsafeSafety.privateArtifactEvidence.length > 0, 'private artifact-like evidence should be reported')

assert.equal(validationDoc.includes('Strict mode exits non-zero'), true)
assert.equal(validationDoc.includes('*** Add File'), false, 'local validation doc should not contain patch markers')
assert.equal(validationDoc.includes('import assert'), false, 'local validation doc should not contain embedded source')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-owner-evidence-local-validation',
  status: 'passed',
  checkedInTemplateReady: templateReadiness.readyForRpEditBrief16,
  safeCompleteReady: safeReadiness.readyForRpEditBrief16,
  unsafeEvidenceSafe: unsafeSafety.safe,
  decision: validationJson.decision,
}, null, 2))
