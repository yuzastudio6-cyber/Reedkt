import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import {
  editSkillArtifactSchemaRegistry,
  editSkillCapabilityRegistry,
  editSkillEstimatorRegistry,
  editSkillQaRegistry,
  editSkillReferenceCatalog,
  editSkillRuntimeBindingRegistry,
  editSkillWorkGraphJobDefinitions,
} from '../edit-skills/internal-fixture-runtime'
import {
  createSkillCapabilityManifest,
  validateSkillCapabilityManifests,
} from '../edit-skills/core'
import {
  SOUND_SKILL_VERSION,
  resolveSoundCapabilityModeMatrixEntry,
  soundSkillCapabilityManifest,
  validateCanonicalSoundPublication,
  validateSoundExecutionGraphMode,
} from '../edit-skills/sound'
import { getSoundToolRouteManifest } from '../sound/sound-tool-route-manifest'

validateCanonicalSoundPublication()
const validation = validateSkillCapabilityManifests({
  registry: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  catalog: editSkillReferenceCatalog,
  runtimeBindings: editSkillRuntimeBindingRegistry,
  workGraphJobs: editSkillWorkGraphJobDefinitions,
})
assert.equal(validation.manifestCount, 2)
assert.equal(SOUND_SKILL_VERSION, '4.0.0')
assert.equal(soundSkillCapabilityManifest.contractVersion, 'sound.skill_contract.v4')
assert.equal(soundSkillCapabilityManifest.qualificationStatus, 'planning_qualified')
assert.equal(Object.isFrozen(soundSkillCapabilityManifest), true)
assert.equal(soundSkillCapabilityManifest.capabilityEntries?.length, 39)
assert.equal(editSkillCapabilityRegistry.resolveLatest('sound').manifestHash, soundSkillCapabilityManifest.manifestHash)
assert.equal(editSkillCapabilityRegistry.resolveLatest('b_roll').skillKey, 'b_roll')

assert.equal(resolveSoundCapabilityModeMatrixEntry({
  jobType: 'design_scene_sound', mode: 'planning',
}).disposition, 'planning_only')
assert.equal(resolveSoundCapabilityModeMatrixEntry({
  jobType: 'design_scene_sound', mode: 'private_internal',
}).disposition, 'composite_child_execution')
assert.equal(resolveSoundCapabilityModeMatrixEntry({
  jobType: 'generate_text_conditioned_sfx', mode: 'fixture',
}).disposition, 'direct_execution')
assert.equal(resolveSoundCapabilityModeMatrixEntry({
  jobType: 'generate_text_conditioned_sfx', mode: 'production',
}).disposition, 'blocked')

const compositePolicy = {
  schemaVersion: 'composite-sound-execution-policy-v1' as const,
  parentJobType: 'design_scene_sound', parentMayExecuteDirectly: false as const,
  childRoutesMustBeExactAndModeQualified: true as const,
  privateInternalExecution: 'admit_only_when_every_required_child_route_is_qualified' as const,
  fixtureExecution: 'admit_fixture_routes_and_internal_routes' as const,
  productionExecution: 'admit_only_production_qualified_child_routes' as const,
  completionPolicy: 'all_required_units_or_typed_partial_result' as const,
}
const internalRoute = getSoundToolRouteManifest('sound.route.acquire.project_source.v1', '4.0.0')!
const providerRoute = getSoundToolRouteManifest('sound.route.generate.text_sfx.v1', '4.0.0')!
validateSoundExecutionGraphMode({
  jobType: 'design_scene_sound', mode: 'private_internal', compositePolicy,
  units: [{ unitId: 'private-child', unitKind: 'audio_operation', route: internalRoute }],
})
validateSoundExecutionGraphMode({
  jobType: 'design_scene_sound', mode: 'fixture', compositePolicy,
  units: [{ unitId: 'fixture-child', unitKind: 'provider_generation', route: providerRoute }],
})
assert.throws(() => validateSoundExecutionGraphMode({
  jobType: 'design_scene_sound', mode: 'private_internal', compositePolicy,
  units: [{ unitId: 'private-provider-child', unitKind: 'provider_generation', route: providerRoute }],
}), /not qualified for private_internal/i)

for (const capability of soundSkillCapabilityManifest.capabilityEntries ?? []) {
  for (const ref of [...capability.primaryRouteRefs, ...capability.fallbackRouteRefs, ...capability.lowerCostRouteRefs]) {
    const route = getSoundToolRouteManifest(ref.routeKey, ref.routeVersion)
    assert.ok(route)
    assert.equal(route.routeHash, ref.routeHash)
    assert.ok(capability.supportedJobTypes.some((job) => route.supportedJobTypes.includes(job)))
  }
}

const unknownRouteManifest = structuredClone(soundSkillCapabilityManifest)
unknownRouteManifest.capabilityEntries![0]!.primaryRouteRefs = [{
  routeKey: 'sound.route.unknown.v99', routeVersion: '99.0.0', routeHash: '0'.repeat(64),
}, ...unknownRouteManifest.capabilityEntries![0]!.primaryRouteRefs.slice(1)]
assert.throws(() => validateCanonicalSoundPublication({ manifest: unknownRouteManifest }), /unresolved Sound route/i)

const mismatchedJobManifest = structuredClone(soundSkillCapabilityManifest)
const normalizationCapability = mismatchedJobManifest.capabilityEntries!.find((entry) =>
  entry.capabilityKey === 'sound.normalize_audio')!
const studyRoute = getSoundToolRouteManifest('sound.route.study.source_audio.v1', '4.0.0')!
normalizationCapability.primaryRouteRefs = [{
  routeKey: studyRoute.routeKey, routeVersion: studyRoute.routeVersion, routeHash: studyRoute.routeHash,
}]
assert.throws(() => validateCanonicalSoundPublication({ manifest: mismatchedJobManifest }), /supports none of its jobs/i)

const invalidLowerCostManifest = structuredClone(soundSkillCapabilityManifest)
const invalidLowerCapability = invalidLowerCostManifest.capabilityEntries!.find((entry) =>
  entry.capabilityKey === 'sound.normalize_audio')!
invalidLowerCapability.lowerCostRouteRefs = [structuredClone(invalidLowerCapability.primaryRouteRefs[0]!)]
assert.throws(() => validateCanonicalSoundPublication({ manifest: invalidLowerCostManifest }), /not cheaper/i)

const overclaimedQualificationManifest = structuredClone(soundSkillCapabilityManifest)
overclaimedQualificationManifest.capabilityEntries!.find((entry) =>
  entry.capabilityKey === 'sound.generate_ambience')!.qualificationStatus = 'production_qualified'
assert.throws(() => validateCanonicalSoundPublication({
  manifest: overclaimedQualificationManifest,
}), /qualification does not match its exact routes/i)

const { manifestHash: _ignored, ...core } = soundSkillCapabilityManifest
void _ignored
const republished = createSkillCapabilityManifest(core)
assert.equal(republished.manifestHash, soundSkillCapabilityManifest.manifestHash)
const changed = createSkillCapabilityManifest({
  ...core,
  skillVersion: '2.0.1',
  knownLimitations: [...core.knownLimitations, 'Version-bump fixture.'],
})
assert.notEqual(changed.manifestHash, soundSkillCapabilityManifest.manifestHash)
assert.throws(() => editSkillCapabilityRegistry.registerManifest({
  ...soundSkillCapabilityManifest,
  manifestHash: '0'.repeat(64),
}), /hash/i)

await assert.rejects(access(new URL('../orchestra/head-of-orchestra.ts', import.meta.url)), /ENOENT/)
await access(new URL('../../src/types/skill-capability-manifest.ts', import.meta.url))

console.log(JSON.stringify({
  status: 'ok',
  sharedManifestCount: validation.manifestCount,
  soundSkillVersion: SOUND_SKILL_VERSION,
  soundManifestHash: soundSkillCapabilityManifest.manifestHash,
  exactCapabilityCount: soundSkillCapabilityManifest.capabilityEntries?.length,
  futureOrchestraPublicManifestSeamPresent: true,
  actualOrchestraIntegration: 'pending_by_design',
}, null, 2))
