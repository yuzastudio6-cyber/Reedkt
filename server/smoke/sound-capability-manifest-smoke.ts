import assert from 'node:assert/strict'
import {
  calculateSkillCapabilityManifestHash,
  publishSkillCapabilityManifest,
  qualificationSupportsMode,
  skillCapabilityManifestSchema,
} from '../orchestra/skill-capability-manifest'
import { SkillCapabilityRegistry } from '../orchestra/skill-capability-registry'
import {
  evaluateManifestBindingInvalidation,
  findEligibleSkills,
  getSkillCapabilityManifest,
  planSkillAssignment,
} from '../orchestra/head-of-orchestra'
import { createSoundJobDescriptor } from '../sound/sound-controller'
import {
  SOUND_SUPPORTED_JOB_TYPES,
  SOUND_UNSUPPORTED_JOB_TYPES,
  soundMiniSkillManifests,
  soundSkillCapabilityManifest,
} from '../sound/sound-manifest'
import { buildSoundRequest } from './sound-test-fixtures'

const parsed = skillCapabilityManifestSchema.parse(soundSkillCapabilityManifest)
assert.equal(parsed.skillKey, 'sound')
assert.equal(parsed.manifestHash, calculateSkillCapabilityManifestHash(parsed))
assert.equal(soundSkillCapabilityManifest.capabilityEntries.length, SOUND_SUPPORTED_JOB_TYPES.length)
assert.deepEqual(
  new Set(soundSkillCapabilityManifest.capabilityEntries.map((entry) => entry.supportedJobType)),
  new Set(SOUND_SUPPORTED_JOB_TYPES),
)
assert.equal(Object.isFrozen(soundSkillCapabilityManifest), true)
assert.equal(Object.isFrozen(soundSkillCapabilityManifest.capabilityEntries), true)
assert.equal(Object.isFrozen(soundSkillCapabilityManifest.capabilityEntries[0]), true)

const registry = new SkillCapabilityRegistry()
registry.register(soundSkillCapabilityManifest)
registry.register(soundSkillCapabilityManifest)
assert.equal(registry.get('sound')?.manifestHash, soundSkillCapabilityManifest.manifestHash)
assert.equal(registry.get('unknown'), undefined)
const { manifestHash: _oldHash, ...unpublished } = structuredClone(soundSkillCapabilityManifest)
void _oldHash
const mutated = publishSkillCapabilityManifest({
  ...unpublished,
  knownLimitations: [...unpublished.knownLimitations, 'immutable-version-test'],
})
assert.throws(() => registry.register(mutated), /immutable/)

assert.equal(getSkillCapabilityManifest('sound')?.manifestId, soundSkillCapabilityManifest.manifestId)
assert.equal(getSkillCapabilityManifest('unknown'), undefined)
assert.equal(findEligibleSkills(createSoundJobDescriptor(buildSoundRequest())).length, 1)
assert.equal(findEligibleSkills({
  ...createSoundJobDescriptor(buildSoundRequest()),
  jobType: 'compose_music',
}).length, 0)
assert.equal(SOUND_UNSUPPORTED_JOB_TYPES.includes('compose_music'), true)
assert.equal(SOUND_UNSUPPORTED_JOB_TYPES.includes('final_video_render'), true)
assert.equal(soundSkillCapabilityManifest.canActAsSupport, true)
assert.equal(soundSkillCapabilityManifest.canOwnPrimaryVisual, false)
assert.equal(soundSkillCapabilityManifest.canOperateAtVideoLevel, true)
assert.equal(soundSkillCapabilityManifest.canOperateAtSceneLevel, true)
assert.equal(soundSkillCapabilityManifest.canOperateAtBoundaryLevel, true)
assert.equal(soundSkillCapabilityManifest.coordinationCritical, true)

const sceneRequest = buildSoundRequest({ job: 'design_scene_sound' })
const sceneJob = createSoundJobDescriptor(sceneRequest)
const scenePlan = planSkillAssignment('sound', sceneJob)
assert.equal(scenePlan.ok, true)
assert.equal(scenePlan.binding?.manifestHash, soundSkillCapabilityManifest.manifestHash)
assert.equal(scenePlan.binding?.skillVersion, soundSkillCapabilityManifest.skillVersion)
assert.equal(scenePlan.binding?.manifestSchemaVersion, soundSkillCapabilityManifest.manifestSchemaVersion)
assert.equal(scenePlan.binding?.capabilityKey, 'sound.design_scene_sound')
assert.equal(scenePlan.binding?.qualificationStatus, 'planning_qualified')
assert.equal(scenePlan.requiredQa.planning.includes('assignment_authority'), true)
assert.equal(scenePlan.requiredQa.output.includes('true_peak'), true)
assert.equal(scenePlan.requiredQa.integration.includes('no_music_composition'), true)
assert.equal(scenePlan.lowerCostRoutes[0]?.routeKey, 'sound.route.acquire.project_source.v1')
assert.equal(scenePlan.lowerCostRoutes.some((route) => route.routeKey === 'sound.route.no_sound.v1'), true)

const unsupportedMusic = planSkillAssignment('sound', { ...sceneJob, jobType: 'compose_music' })
assert.equal(unsupportedMusic.ok, false)
assert.equal(unsupportedMusic.blockCode, 'unsupported_capability')
const unsupportedRender = planSkillAssignment('sound', { ...sceneJob, jobType: 'final_video_render' })
assert.equal(unsupportedRender.ok, false)
assert.equal(unsupportedRender.blockCode, 'unsupported_capability')

const studyRequest = buildSoundRequest({ job: 'study_source_audio' })
const studyJob = createSoundJobDescriptor(studyRequest)
const missingInput = planSkillAssignment('sound', {
  ...studyJob,
  inputArtifactTypes: studyJob.inputArtifactTypes.filter((type) => type !== 'approved_source_audio'),
})
assert.equal(missingInput.ok, false)
assert.equal(missingInput.blockCode, 'unmet_requirements')
assert.equal(missingInput.reasons.includes('missing_input:approved_source_audio'), true)

const providerPlanningRequest = buildSoundRequest({
  job: 'generate_video_conditioned_sfx',
  mode: 'planning',
})
const providerPlanning = planSkillAssignment(
  'sound',
  createSoundJobDescriptor(providerPlanningRequest),
)
assert.equal(providerPlanning.ok, true)
assert.equal(providerPlanning.primaryToolRoutes[0]?.routeKey, 'sound.route.generate.video_sfx.mirelo.v1')
assert.equal(providerPlanning.primaryToolRoutes[0]?.qualificationStatus, 'fixture_qualified')
assert.equal(providerPlanning.fallbackRoutes[0]?.qualificationStatus, 'blocked')
assert.equal(qualificationSupportsMode('fixture_qualified', 'production'), false)
const providerProduction = planSkillAssignment('sound', {
  ...createSoundJobDescriptor(providerPlanningRequest),
  requestedMode: 'production',
})
assert.equal(providerProduction.ok, false)
assert.equal(providerProduction.blockCode, 'qualification_blocked')

const earlyStudy = planSkillAssignment('sound', studyJob)
assert.equal(earlyStudy.ordering.planningPhase, 'early_study')
assert.equal(earlyStudy.ordering.mustRunAfter.length, 0)
const foleyRequest = buildSoundRequest({ job: 'generate_foley' })
const foley = planSkillAssignment('sound', createSoundJobDescriptor(foleyRequest))
assert.equal(foley.ordering.mustRunAfter.includes('versioned_visual_artifact'), true)
const syncRequest = buildSoundRequest({ job: 'sync_audio_to_visual' })
const sync = planSkillAssignment('sound', createSoundJobDescriptor(syncRequest))
assert.equal(sync.ordering.mustRunAfter.includes('visual_timing_lock'), true)
const mixRequest = buildSoundRequest({ job: 'mix_sound_layers' })
const mix = planSkillAssignment('sound', createSoundJobDescriptor(mixRequest))
assert.equal(mix.ordering.mustRunAfter.includes('approved_music_context'), true)
const handoffRequest = buildSoundRequest({ job: 'handoff_sound_to_final_composition' })
const handoff = planSkillAssignment('sound', createSoundJobDescriptor(handoffRequest))
assert.equal(handoff.ordering.mustRunBefore.includes('final_video_render'), true)

const readOnlyOverlap = planSkillAssignment('sound', {
  ...sceneJob,
  activeAssignments: [{
    assignmentId: 'music-read',
    skillKey: 'music',
    capabilityKey: 'music.read_context',
    audioWriteRanges: sceneJob.audioWriteRanges,
    visualWriteRanges: [],
    readOnly: true,
  }],
})
assert.equal(readOnlyOverlap.ok, true)
const writeConflict = planSkillAssignment('sound', {
  ...sceneJob,
  activeAssignments: [{
    assignmentId: 'other-sound-write',
    skillKey: 'sound_duplicate_authority',
    capabilityKey: 'legacy.sound',
    audioWriteRanges: sceneJob.audioWriteRanges,
    visualWriteRanges: [],
    readOnly: false,
  }],
})
assert.equal(writeConflict.ok, false)
assert.equal(writeConflict.blockCode, 'conflict_detected')

assert.deepEqual(scenePlan.timeEstimate, planSkillAssignment('sound', sceneJob).timeEstimate)
assert.deepEqual(scenePlan.creditEstimate, planSkillAssignment('sound', sceneJob).creditEstimate)
const oneCandidate = createSoundJobDescriptor(buildSoundRequest({
  job: 'generate_video_conditioned_sfx',
  mode: 'planning',
}))
oneCandidate.candidateCount = 1
const fourCandidate = { ...oneCandidate, candidateCount: 4 }
const oneEstimate = planSkillAssignment('sound', oneCandidate).creditEstimate!
const fourEstimate = planSkillAssignment('sound', fourCandidate).creditEstimate!
assert.ok(fourEstimate.expected > oneEstimate.expected)
const longProvider = { ...oneCandidate, providerDurationSeconds: oneCandidate.providerDurationSeconds * 3 }
assert.ok(
  planSkillAssignment('sound', longProvider).creditEstimate!.expected > oneEstimate.expected,
)

const binding = scenePlan.binding!
assert.deepEqual(evaluateManifestBindingInvalidation({
  binding,
  currentManifest: soundSkillCapabilityManifest,
  executed: false,
}), { stale: false, incompatible: false, reasons: [], rules: [] })
const visualInvalidation = evaluateManifestBindingInvalidation({
  binding,
  currentManifest: soundSkillCapabilityManifest,
  changedSignals: ['visual_artifact_version_changed'],
  executed: true,
})
assert.equal(visualInvalidation.stale, true)
assert.equal(visualInvalidation.incompatible, false)
const manifestInvalidation = evaluateManifestBindingInvalidation({
  binding,
  currentManifest: { ...soundSkillCapabilityManifest, manifestHash: '0'.repeat(64) },
  executed: false,
})
assert.equal(manifestInvalidation.stale, true)
assert.equal(manifestInvalidation.incompatible, true)

const evidenceIds = new Set(soundSkillCapabilityManifest.qualificationEvidenceRefs.map((item) => item.evidenceId))
for (const entry of soundSkillCapabilityManifest.capabilityEntries) {
  assert.ok(entry.qualificationEvidenceRefs.length > 0)
  assert.equal(entry.qualificationEvidenceRefs.every((id) => evidenceIds.has(id)), true)
}
assert.equal(
  soundSkillCapabilityManifest.capabilityEntries
    .filter((entry) => entry.supportedJobType.startsWith('generate_'))
    .every((entry) => entry.qualificationStatus !== 'production_qualified'),
  true,
)
assert.equal(
  Object.values(soundMiniSkillManifests)
    .filter((mini) => mini.miniSkillKey.includes('conditioned') || mini.miniSkillKey === 'foley')
    .every((mini) => mini.qualificationStatus === 'fixture_qualified'),
  true,
)
assert.equal(soundSkillCapabilityManifest.knownLimitations.length > 0, true)

process.stdout.write(`Sound capability manifest smoke passed: ${soundSkillCapabilityManifest.manifestHash}\n`)
