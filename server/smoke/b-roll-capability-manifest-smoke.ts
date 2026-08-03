import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  editSkillArtifactSchemaRegistry,
  editSkillCapabilityRegistry,
  editSkillEstimatorRegistry,
  editSkillQaRegistry,
  editSkillQualificationRegistry,
  editSkillReferenceCatalog,
} from '../edit-skills/registry'
import { validateSkillCapabilityManifests } from '../edit-skills/core/skill-capability-validator'
import { generateSkillManifestProjection } from '../edit-skills/core/skill-manifest-projection'
import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import { BROLL_QUALIFICATION_FIXTURES } from '../edit-skills/b-roll/b-roll-qualification'

const validation = validateSkillCapabilityManifests({
  registry: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  catalog: editSkillReferenceCatalog,
})
assert.equal(validation.manifestCount, 1)
assert.equal(validation.manifestHashes[0], BROLL_CAPABILITY_MANIFEST.manifestHash)
assert.equal(BROLL_CAPABILITY_MANIFEST.skillKey, 'b_roll')
assert.equal(BROLL_CAPABILITY_MANIFEST.skillVersion, '1.0.0')
assert.equal(BROLL_CAPABILITY_MANIFEST.contractVersion, 'b_roll.skill_contract.v1')
assert.equal(BROLL_CAPABILITY_MANIFEST.qualificationStatus, 'implementation_pending')
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.maximumInitialAttempts, 1)
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.maximumRefinements, 1)
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.automaticRetryAllowed, false)
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.alternateProviderFallbackAllowed, false)
assert.equal(BROLL_CAPABILITY_MANIFEST.trackingRequirements.includes('consume_track_graph_v1_only'), true)
assert.equal(BROLL_QUALIFICATION_FIXTURES.length >= 40, true)

const forbiddenRoutes = ['wan', 'hailuo', 'veo', 'kling', 'stock']
const routeText = JSON.stringify([
  ...BROLL_CAPABILITY_MANIFEST.toolRoutes,
  ...BROLL_CAPABILITY_MANIFEST.fallbackRoutes,
  ...BROLL_CAPABILITY_MANIFEST.lowerCostRoutes,
]).toLowerCase()
for (const forbidden of forbiddenRoutes) assert.equal(routeText.includes(forbidden), false, `${forbidden} re-entered B-roll routing`)
assert.equal(routeText.includes('provider.google.generate_b_roll_candidate.v1'), true)

const projection = await readFile(
  'docs/edit-skills/manifests/b-roll-capability-manifest.generated.json',
  'utf8',
)
assert.equal(projection, generateSkillManifestProjection(BROLL_CAPABILITY_MANIFEST))
editSkillQualificationRegistry.assertClaim(
  editSkillCapabilityRegistry.referenceFor('b_roll'),
  'implementation_pending',
)
assert.throws(
  () => editSkillQualificationRegistry.assertClaim(
    editSkillCapabilityRegistry.referenceFor('b_roll'),
    'planning_qualified',
  ),
  /exceeds/,
)

console.log(JSON.stringify({
  status: 'ok',
  manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
  qualificationFixtureCount: BROLL_QUALIFICATION_FIXTURES.length,
  supportedJobCount: BROLL_CAPABILITY_MANIFEST.supportedJobTypes.length,
  qaCount: BROLL_CAPABILITY_MANIFEST.planningQa.length + BROLL_CAPABILITY_MANIFEST.outputQa.length + BROLL_CAPABILITY_MANIFEST.integrationQa.length,
}, null, 2))
