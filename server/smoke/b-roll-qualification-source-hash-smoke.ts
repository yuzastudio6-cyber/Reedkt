import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  BROLL_QUALIFICATION_RELEVANT_PACKAGE_SCRIPT_KEYS,
  computeBrollRelevantSourceTreeHash,
  listBrollQualificationRelevantFiles,
  projectBrollQualificationPackageScripts,
} from '../edit-skills/b-roll/b-roll-qualification-source-hash'
import { hashSkillValue } from
  '../edit-skills/core/skill-capability-manifest-hash'

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
) as { scripts: Record<string, unknown> }
const projected = projectBrollQualificationPackageScripts(
  packageJson.scripts)
const withUnrelatedCaptionScript =
  projectBrollQualificationPackageScripts({
    ...packageJson.scripts,
    'smoke:caption-unrelated-to-b-roll':
      'tsx server/smoke/caption-unrelated.ts',
  })
assert.equal(
  hashSkillValue(withUnrelatedCaptionScript),
  hashSkillValue(projected),
  'Unrelated specialist scripts must not invalidate B-roll qualification.',
)
const withChangedBrollScript = projectBrollQualificationPackageScripts({
  ...packageJson.scripts,
  'test:b-roll-planning': 'tsx server/smoke/changed-b-roll-planning.ts',
})
assert.notEqual(
  hashSkillValue(withChangedBrollScript),
  hashSkillValue(projected),
  'A changed B-roll qualification command must invalidate its authority.',
)
assert.equal(
  Object.keys(projected).length,
  BROLL_QUALIFICATION_RELEVANT_PACKAGE_SCRIPT_KEYS.length,
)
assert.ok(!listBrollQualificationRelevantFiles().includes('package.json'))
assert.match(computeBrollRelevantSourceTreeHash(), /^[a-f0-9]{64}$/u)

console.log(JSON.stringify({
  smoke: 'b_roll_qualification_source_hash',
  status: 'passed',
  relevantPackageScriptCount: Object.keys(projected).length,
  unrelatedSpecialistScriptIgnored: true,
  changedBrollScriptInvalidates: true,
}, null, 2))
