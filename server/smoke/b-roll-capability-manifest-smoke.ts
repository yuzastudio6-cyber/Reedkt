import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  editSkillArtifactSchemaRegistry,
  editSkillCapabilityRegistry,
  editSkillEstimatorRegistry,
  editSkillQaRegistry,
  editSkillQualificationRegistry,
  editSkillReferenceCatalog,
  editSkillRuntimeBindingRegistry,
  editSkillWorkGraphJobDefinitions,
} from '../edit-skills/registry'
import { validateSkillCapabilityManifests } from '../edit-skills/core/skill-capability-validator'
import { createSkillCapabilityManifest } from '../edit-skills/core/skill-capability-manifest-hash'
import { generateSkillManifestProjection } from '../edit-skills/core/skill-manifest-projection'
import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import { BROLL_QUALIFICATION_FIXTURES } from '../edit-skills/b-roll/b-roll-qualification'

const validation = validateSkillCapabilityManifests({
  registry: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  catalog: editSkillReferenceCatalog,
  runtimeBindings: editSkillRuntimeBindingRegistry,
  workGraphJobs: editSkillWorkGraphJobDefinitions,
})
assert.equal(validation.manifestCount, 1)
assert.equal(validation.manifestHashes[0], BROLL_CAPABILITY_MANIFEST.manifestHash)
assert.equal(BROLL_CAPABILITY_MANIFEST.skillKey, 'b_roll')
assert.equal(BROLL_CAPABILITY_MANIFEST.schemaVersion, 'skill-capability-manifest-v2')
assert.equal(BROLL_CAPABILITY_MANIFEST.skillVersion, '1.0.0')
assert.equal(BROLL_CAPABILITY_MANIFEST.contractVersion, 'b_roll.skill_contract.v1')
assert.equal(BROLL_CAPABILITY_MANIFEST.qualificationStatus, 'internal_execution_qualified')
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.maximumInitialAttempts, 1)
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.maximumRefinements, 1)
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.automaticRetryAllowed, false)
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.alternateProviderFallbackAllowed, false)
assert.equal(BROLL_CAPABILITY_MANIFEST.trackingRequirements.length, 1)
assert.equal(BROLL_CAPABILITY_MANIFEST.trackingRequirements[0]?.acceptedArtifactType, 'track_graph_v1')
assert.equal(BROLL_CAPABILITY_MANIFEST.trackingRequirements[0]?.ownerSkill, 'track_all')
assert.equal(BROLL_CAPABILITY_MANIFEST.trackingRequirements[0]?.modelSpecificDependencyAllowed, false)
assert.equal(BROLL_QUALIFICATION_FIXTURES.length >= 40, true)

assert.equal(BROLL_CAPABILITY_MANIFEST.supportedJobTypes.every((job) =>
  job.runtimeBindingRequired && job.executionAllowed && job.allowedPhases.length === 1), true)
assert.equal(BROLL_CAPABILITY_MANIFEST.toolRoutes.every((route) =>
  !route.callerSelectable && !route.automaticRetry &&
  !route.automaticAlternateProviderFallback && route.operationIds.length === 1), true)
assert.deepEqual(
  new Set(BROLL_CAPABILITY_MANIFEST.conflictsWith.map((rule) => rule.ruleKey)),
  new Set([
    'exclusive_primary_owner_conflict',
    'no_extra_visuals_preference',
    'locked_evidence_visibility',
    'other_skill_hero_visual',
    'independent_b_roll_assignment_overlap',
    'transition_scene_boundary',
    'caption_safe_area',
  ]),
)
assert.equal(BROLL_CAPABILITY_MANIFEST.visualIntelligenceRequirements[0]?.wholeVideoEvidencePermission, 'read_only')
assert.equal(BROLL_CAPABILITY_MANIFEST.visualIntelligenceRequirements[0]?.injectedTestOnlyBehavior, 'reject_for_production')

const { manifestHash: _manifestHash, ...manifestCore } = BROLL_CAPABILITY_MANIFEST
assert.equal(_manifestHash, BROLL_CAPABILITY_MANIFEST.manifestHash)
assert.throws(() => createSkillCapabilityManifest({
  ...manifestCore,
  supportedJobTypes: manifestCore.supportedJobTypes.map((job, index) => index === 0
    ? { ...job, allowedPhases: ['unknown_phase'] }
    : job),
}), /unknown execution phase/u)
assert.throws(() => createSkillCapabilityManifest({
  ...manifestCore,
  conflictsWith: [...manifestCore.conflictsWith, manifestCore.conflictsWith[0]!],
}), /unique and disjoint/u)
assert.throws(() => createSkillCapabilityManifest({
  ...manifestCore,
  toolRoutes: manifestCore.toolRoutes.map((route, index) => index === 0
    ? { ...route, supportedJobTypes: ['unknown_job'] }
    : route),
}), /references an unsupported job/u)
assert.throws(() => createSkillCapabilityManifest({
  ...manifestCore,
  trackingRequirements: manifestCore.trackingRequirements.map((requirement) => ({
    ...requirement,
    modelSpecificDependencyAllowed: true as never,
  })),
}))
assert.throws(() => createSkillCapabilityManifest({
  ...manifestCore,
  toolRoutes: manifestCore.toolRoutes.map((route) => ({
    ...route,
    callerSelectable: true as never,
  })),
}))

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
if (process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING !== '1') {
  editSkillQualificationRegistry.assertClaim(
    editSkillCapabilityRegistry.referenceFor('b_roll'),
    'internal_execution_qualified',
  )
  assert.throws(
    () => editSkillQualificationRegistry.assertClaim(
      editSkillCapabilityRegistry.referenceFor('b_roll'),
      'production_qualified',
    ),
    /exceeds/,
  )
}

console.log(JSON.stringify({
  status: 'ok',
  manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
  qualificationFixtureCount: BROLL_QUALIFICATION_FIXTURES.length,
  supportedJobCount: BROLL_CAPABILITY_MANIFEST.supportedJobTypes.length,
  qaCount: BROLL_CAPABILITY_MANIFEST.planningQa.length + BROLL_CAPABILITY_MANIFEST.outputQa.length + BROLL_CAPABILITY_MANIFEST.integrationQa.length,
  qualificationStatus: BROLL_CAPABILITY_MANIFEST.qualificationStatus,
}, null, 2))
