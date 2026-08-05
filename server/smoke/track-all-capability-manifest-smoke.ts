import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { skillCapabilityManifestSchema } from '../edit-skills/core/skill-capability-manifest-schema'
import { assertSkillManifestHash, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { generateSkillManifestProjection } from '../edit-skills/core/skill-manifest-projection'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_JOB_TYPES,
  TRACK_ALL_SAM_OPERATION_V2,
} from '../edit-skills/track-all/track-all-capability-manifest'

const manifest = skillCapabilityManifestSchema.parse(TRACK_ALL_CAPABILITY_MANIFEST)
assert.equal(assertSkillManifestHash(manifest), manifest)
assert.equal(manifest.skillKey, 'track_all')
assert.equal(manifest.skillVersion, '1.0.0')
assert.equal(manifest.contractVersion, 'track_all.skill_contract.v1')
assert.equal(manifest.skillClass, 'temporal_visual_geometry_skill')
assert.equal(manifest.coordinationCritical, true)
assert.equal(manifest.canOwnPrimaryVisual, true)
assert.equal(manifest.canActAsSupport, true)
assert.equal(manifest.canOperateAtVideoLevel, 'bounded_plan_and_execution')
assert.equal(manifest.canOperateAtSceneLevel, 'bounded_plan_and_execution')
assert.equal(manifest.canOperateAtBoundaryLevel, 'bounded_plan_and_execution')
assert.equal(Object.isFrozen(TRACK_ALL_CAPABILITY_MANIFEST), true)
assert.equal(Object.isFrozen(TRACK_ALL_CAPABILITY_MANIFEST.supportedJobTypes), true)
assert.deepEqual(manifest.supportedJobTypes.map((job) => job.jobType), [...TRACK_ALL_JOB_TYPES])
assert.equal(manifest.supportedJobTypes.every((job) => job.runtimeBindingRequired), true)
assert.equal(manifest.unsupportedJobTypes.some((job) => job.jobType === 'track_all.sam2_new_execution'), true)
assert.equal(manifest.unsupportedJobTypes.some((job) => job.jobType === 'track_all.sam2_fallback'), true)
assert.equal(manifest.unsupportedJobTypes.some((job) => job.jobType === 'track_all.raw_chat_to_gpu'), true)
assert.equal(manifest.toolRoutes.some((route) => route.operationIds.includes(TRACK_ALL_SAM_OPERATION_V2)), true)
assert.equal(manifest.toolRoutes.every((route) => !route.callerSelectable && !route.automaticRetry && !route.automaticAlternateProviderFallback), true)
assert.equal(manifest.attemptPolicy.automaticRetryAllowed, false)
assert.equal(manifest.attemptPolicy.alternateProviderFallbackAllowed, false)
assert.equal(manifest.trackingRequirements.every((requirement) => requirement.modelSpecificDependencyAllowed === false), true)
assert.equal(manifest.visualIntelligenceRequirements.some((requirement) => requirement.requiredArtifactType === 'visual_intelligence_target_evidence_v1'), true)
assert.deepEqual(skillManifestReference(manifest), {
  schemaVersion: 'edit-skill-manifest-reference-v1',
  skillKey: 'track_all', skillVersion: '1.0.0', contractVersion: 'track_all.skill_contract.v1', manifestHash: manifest.manifestHash,
})

const generated = readFileSync('docs/edit-skills/manifests/track-all-capability-manifest.generated.json', 'utf8')
assert.equal(generated, generateSkillManifestProjection(manifest))

console.log(JSON.stringify({
  status: 'ok', manifestHash: manifest.manifestHash,
  supportedJobs: manifest.supportedJobTypes.length,
  unsupportedJobs: manifest.unsupportedJobTypes.length,
  routes: manifest.toolRoutes.length + manifest.fallbackRoutes.length + manifest.lowerCostRoutes.length,
}))
