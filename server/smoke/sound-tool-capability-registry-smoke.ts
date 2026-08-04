import assert from 'node:assert/strict'
import {
  getToolOperationCapability,
  qualificationSupportsToolMode,
} from '../tool-registry'
import { soundSkillCapabilityManifest, validateCanonicalSoundPublication } from '../edit-skills/sound'
import { soundMiniSkillManifests } from '../edit-skills/sound/sound-mini-skill-registry'
import {
  getSoundToolRouteManifest,
  listSoundToolRouteManifests,
  publishSoundToolRouteManifest,
  registerSoundToolRouteManifest,
  type UnpublishedSoundToolRouteManifest,
  validateSoundToolRouteRegistry,
} from '../sound/sound-tool-route-manifest'
import '../sound/sound-tool-routes'
import { validateSoundOperationHandlerCoverage } from '../edit-skills/sound/sound-operation-handler-registry'

validateCanonicalSoundPublication()
const routes = listSoundToolRouteManifests()
assert.equal(routes.length, 19)
for (const route of routes) {
  assert.equal(route.routeVersion, '3.0.0')
  assert.match(route.routeHash, /^[a-f0-9]{64}$/)
  for (const step of route.orderedOrGraphSteps) {
    const operation = getToolOperationCapability(step.toolKey, step.operationKey, step.toolVersionConstraint)
    assert.ok(operation, `${route.routeKey}:${step.stepKey}`)
    assert.equal(operation.manifest.toolManifestHash.length, 64)
    assert.ok(step.outputBindings.every((output) => operation.operation.producedArtifactTypes.includes(output)))
  }
  assert.ok(route.producedArtifactTypes.every((output) =>
    route.orderedOrGraphSteps.some((step) => step.outputBindings.includes(output))))
}
validateSoundOperationHandlerCoverage(routes)
const routeWithUnregisteredRequiredHandler = structuredClone(
  getSoundToolRouteManifest('sound.route.generate.video_sfx.mirelo.v1', '3.0.0')!,
)
const optionalAdvancedStep = routeWithUnregisteredRequiredHandler.orderedOrGraphSteps.find((step) =>
  step.toolKey === 'pedalboard')!
optionalAdvancedStep.required = true
assert.throws(
  () => validateSoundOperationHandlerCoverage([routeWithUnregisteredRequiredHandler]),
  /has no registered operation handler/i,
)

const mirelo = getSoundToolRouteManifest('sound.route.generate.video_sfx.mirelo.v1', '3.0.0')!
assert.equal(mirelo.qualificationStatus, 'planning_qualified')
assert.ok(mirelo.qualificationEvidenceRefs.some((ref) => ref.includes('injected_transport')))
const mireloOperation = getToolOperationCapability('mirelo_sfx', 'generate_video_conditioned_sfx', '1.6')!
assert.equal(mireloOperation.operation.qualificationEvidenceLevel, 'fixture')
assert.equal(qualificationSupportsToolMode(
  mireloOperation.operation.qualificationByMode.preview_execution,
  'preview_execution',
  mireloOperation.operation.qualificationEvidenceLevel,
), true)
assert.equal(qualificationSupportsToolMode(
  mireloOperation.operation.qualificationByMode.final_execution,
  'final_execution',
  mireloOperation.operation.qualificationEvidenceLevel,
), false)

const mmaudio = getSoundToolRouteManifest('sound.route.generate.video_sfx.mmaudio.v1', '3.0.0')!
assert.equal(mmaudio.qualificationStatus, 'blocked')
assert.equal(soundSkillCapabilityManifest.toolRoutes.some((route) => route.routeKey === mmaudio.routeKey), false)
assert.equal(soundSkillCapabilityManifest.fallbackRoutes.some((route) => route.routeKey === mmaudio.routeKey), false)

for (const mini of Object.values(soundMiniSkillManifests)) {
  for (const ref of [...mini.routeRefs, ...mini.fallbackRouteRefs, ...mini.lowerCostRouteRefs]) {
    assert.equal(getSoundToolRouteManifest(ref.routeKey, ref.routeVersion)?.routeHash, ref.routeHash)
  }
}
const ambienceMini = soundMiniSkillManifests.ambience!
assert.throws(() => validateCanonicalSoundPublication({
  miniSkills: {
    ...soundMiniSkillManifests,
    ambience: { ...ambienceMini, qualificationStatus: 'production_qualified' },
  },
}), /qualification exceeds its exact routes/i)
const [firstMiniKey, firstMini] = Object.entries(soundMiniSkillManifests)[0]!
const invalidMiniSkills = {
  ...soundMiniSkillManifests,
  [firstMiniKey]: { ...firstMini, routeRefs: [{
  routeKey: 'sound.route.unregistered.mini.v1', routeVersion: '3.0.0', routeHash: '0'.repeat(64),
  }, ...firstMini.routeRefs.slice(1)] },
}
assert.throws(() => validateCanonicalSoundPublication({
  miniSkills: invalidMiniSkills,
}), /unresolved Sound route/i)

const noSound = getSoundToolRouteManifest('sound.route.no_sound.v1', '3.0.0')!
const {
  routeHash: _hash,
  qualificationStatus: _status,
  qualificationByMode: _byMode,
  ...noSoundSeed
} = noSound
void _hash
void _status
void _byMode
assert.throws(() => publishSoundToolRouteManifest({
  ...(structuredClone(noSoundSeed) as UnpublishedSoundToolRouteManifest),
  routeKey: 'sound.route.invalid.unknown_operation.v1',
  routeVersion: '3.0.0',
  orderedOrGraphSteps: [{
    ...structuredClone(noSoundSeed.orderedOrGraphSteps[0]!),
    toolKey: 'unknown_tool', operationKey: 'unknown_operation',
  }],
}), /unknown operation/i)
assert.throws(() => publishSoundToolRouteManifest({
  ...(structuredClone(noSoundSeed) as UnpublishedSoundToolRouteManifest),
  routeKey: 'sound.route.invalid.job_operation_mismatch.v1',
  routeVersion: '3.0.0',
  supportedJobTypes: ['normalize_audio'],
}), /does not support route jobs/i)
assert.throws(() => publishSoundToolRouteManifest({
  ...(structuredClone(noSoundSeed) as UnpublishedSoundToolRouteManifest),
  routeKey: 'sound.route.invalid.step_output.v1',
  routeVersion: '3.0.0',
  orderedOrGraphSteps: [{
    ...structuredClone(noSoundSeed.orderedOrGraphSteps[0]!),
    outputBindings: ['undeclared_step_output'],
  }],
}), /undeclared operation outputs/i)
assert.throws(() => publishSoundToolRouteManifest({
  ...(structuredClone(noSoundSeed) as UnpublishedSoundToolRouteManifest),
  routeKey: 'sound.route.invalid.output.v1',
  routeVersion: '3.0.0',
  producedArtifactTypes: ['undeclared_output'],
}), /not produced/i)

const invalidFallback = publishSoundToolRouteManifest({
  ...(structuredClone(noSoundSeed) as UnpublishedSoundToolRouteManifest),
  routeKey: 'sound.route.invalid.fallback_input.v1',
  routeVersion: '3.0.0',
  supportedJobTypes: ['extract_project_owned_sound'],
  fallbackPolicy: {
    ...structuredClone(noSoundSeed.fallbackPolicy),
    fallbackRouteRefs: [{ routeKey: 'sound.route.acquire.project_source.v1', routeVersion: '3.0.0' }],
  },
})
registerSoundToolRouteManifest(invalidFallback)
assert.throws(() => validateSoundToolRouteRegistry(), /cannot accept route inputs/i)

console.log(JSON.stringify({
  status: 'ok', routeCount: routes.length,
  miniSkillCount: Object.keys(soundMiniSkillManifests).length,
  mireloQualification: mirelo.qualificationStatus,
  mmaudioQualification: mmaudio.qualificationStatus,
}, null, 2))
