import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const requiredFiles = [
  'scripts/validation/project-edit-brief-owner-evidence-pr-diff.ts',
  'docs/project-edit-brief-owner-evidence-pr-diff-validation.md',
  'docs/project-edit-brief-owner-evidence-pr-diff-validation.json',
  'scripts/validation/project-edit-brief-owner-evidence-readiness-cli.ts',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const validationDoc = read('docs/project-edit-brief-owner-evidence-pr-diff-validation.md')
const validationJson = JSON.parse(read('docs/project-edit-brief-owner-evidence-pr-diff-validation.json')) as {
  decision?: string
  ownerEvidenceIntakePath?: string
  strictModeRequires?: string[]
  forbiddenInEvidencePr?: string[]
  launchBoundary?: Record<string, boolean>
  nextMilestoneWhenStrictPasses?: string
}
const validator = read('scripts/validation/project-edit-brief-owner-evidence-pr-diff.ts')

assert.equal(packageJson.scripts?.['check:project-edit-brief-owner-evidence-pr-diff'], 'tsx scripts/validation/project-edit-brief-owner-evidence-pr-diff.ts --staged --allow-no-diff')
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-owner-evidence-pr-diff-validation'], 'tsx server/smoke/project-edit-brief-owner-evidence-pr-diff-validation-smoke.ts')
assert.equal(validationJson.decision, 'project_edit_brief_owner_evidence_pr_diff_validation_passed_ready_for_reviewed_evidence_pr')
assert.equal(validationJson.ownerEvidenceIntakePath, 'docs/project-edit-brief-owner-evidence-intake-template.json')
assert.deepEqual(validationJson.strictModeRequires, [
  'owner_evidence_intake_changed',
  'no_other_files_staged',
  'owner_evidence_readiness_passed',
  'owner_evidence_safety_scan_passed',
])
assert.ok(validationJson.forbiddenInEvidencePr?.includes('private_media'))
assert.ok(validationJson.forbiddenInEvidencePr?.includes('runtime_source'))
assert.ok(validationJson.forbiddenInEvidencePr?.includes('supabase_migrations'))
assert.ok(validationJson.forbiddenInEvidencePr?.includes('lockfile_churn'))
assert.ok(validationJson.forbiddenInEvidencePr?.includes('generated_artifacts'))
assert.ok(validationJson.forbiddenInEvidencePr?.includes('signed_urls'))
assert.ok(validationJson.forbiddenInEvidencePr?.includes('raw_prompts'))
assert.ok(validationJson.forbiddenInEvidencePr?.includes('secrets'))
assert.equal(validationJson.launchBoundary?.externalBetaAllowed, false)
assert.equal(validationJson.launchBoundary?.realUserMediaBetaAllowed, false)
assert.equal(validationJson.launchBoundary?.paidProductionAllowed, false)
assert.equal(validationJson.nextMilestoneWhenStrictPasses, 'RP-EDITBRIEF-16 - Production Persistence Implementation Plan')

assert.equal(validator.includes('git'), true, 'validator should inspect git diff')
assert.equal(validator.includes('docs/project-edit-brief-owner-evidence-intake-template.json'), true)
assert.equal(validator.includes('scanProjectEditBriefOwnerEvidenceSafety'), true)
assert.equal(validator.includes('evaluateProjectEditBriefOwnerEvidenceReadiness'), true)
assert.equal(validationDoc.includes('no other files are staged'), true)
assert.equal(validationDoc.includes('*** Add File'), false, 'diff validation doc should not contain patch markers')
assert.equal(validationDoc.includes('import assert'), false, 'diff validation doc should not contain embedded source')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-owner-evidence-pr-diff-validation',
  status: 'passed',
  decision: validationJson.decision,
  strictModeRequires: validationJson.strictModeRequires?.length,
  nextMilestone: validationJson.nextMilestoneWhenStrictPasses,
}, null, 2))
