import assert from 'node:assert/strict'
import { getToolOperationCapability } from '../tool-registry'
import { musicSkillCapabilityManifest, MUSIC_PRODUCED_ARTIFACT_TYPES } from '../edit-skills/music/music-capability-manifest'
import { MUSIC_MINI_SKILL_MANIFESTS } from '../edit-skills/music/music-mini-skill-registry'
import { validateMusicOperationHandlerCoverage } from '../edit-skills/music/music-operation-handler-registry'
import { validateCanonicalMusicPublication } from '../edit-skills/music/music-publication-validation'
import { getMusicToolRouteManifest } from '../music/music-tool-routes'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest } from './canonical-music-test-fixtures'

validateCanonicalMusicPublication()
validateMusicOperationHandlerCoverage()

const requiredV3Outputs = [
  'music_soundtrack_segmentation_plan_v3', 'music_cue_grouping_plan_v3',
  'music_cue_policy_conflict_v3', 'music_crossfade_plan_v3', 'music_crossfade_audio',
  'music_crossfade_receipt_v3', 'music_sound_operation_receipt_v3',
]
for (const artifactType of requiredV3Outputs) {
  assert.ok(MUSIC_PRODUCED_ARTIFACT_TYPES.includes(artifactType), `Manifest omitted ${artifactType}.`)
  assert.ok(musicSkillCapabilityManifest.producedArtifactTypes.includes(artifactType),
    `Published manifest omitted ${artifactType}.`)
}

const groupingRoute = getMusicToolRouteManifest('music.route.plan.cue_grouping.v3', '3.1.0')
assert.ok(groupingRoute)
assert.deepEqual(groupingRoute.producedArtifactTypes, ['music_cue_grouping_plan_v3'])
assert.deepEqual(groupingRoute.optionalProducedArtifactTypes, ['music_cue_policy_conflict_v3'])
assert.equal(groupingRoute.steps[0]?.operationKey, 'group_music_cues')
assert.ok(getToolOperationCapability('music_cue_grouping_engine', 'group_music_cues', '3.1.0'))

const crossfadeRoute = getMusicToolRouteManifest('music.route.support.two_source_crossfade.v3', '3.1.0')
assert.ok(crossfadeRoute)
assert.deepEqual(crossfadeRoute.producedArtifactTypes, ['music_crossfade_audio', 'music_crossfade_receipt_v3'])
assert.equal(crossfadeRoute.steps[0]?.operationKey, 'crossfade_music_through_public_sound_service')
assert.ok(getToolOperationCapability('canonical_sound_v4_port',
  'crossfade_music_through_public_sound_service', '4.2.0'))

const groupingMiniSkill = MUSIC_MINI_SKILL_MANIFESTS.find((mini) =>
  mini.miniSkillKey === 'music.mini.cue_grouping_director')
assert.ok(groupingMiniSkill)
assert.equal(groupingMiniSkill.implementationStatus, 'implemented')
assert.ok(groupingMiniSkill.toolRouteRefs.some((route) =>
  route.routeKey === groupingRoute.routeKey && route.routeHash === groupingRoute.routeHash))
const soundCoordinator = MUSIC_MINI_SKILL_MANIFESTS.find((mini) =>
  mini.miniSkillKey === 'music.mini.sound_support_coordinator')
assert.ok(soundCoordinator?.toolRouteRefs.some((route) =>
  route.routeKey === crossfadeRoute.routeKey && route.routeHash === crossfadeRoute.routeHash))

const runtime = await createCanonicalMusicTestRuntime()
const request = makeCanonicalMusicRequest({
  requestId: 'music-manifest-v3-completeness', mode: 'planning', cues: [], allowGeneration: false,
  writeRanges: [{ rangeId: 'manifest-write', startFrame: 0, endFrameExclusive: 240 }],
})
const plan = await runtime.music.plan(request)
assert.equal(plan.executionGraph.units.some((unit) => unit.unitKind === 'cue_grouping' &&
  unit.route.routeKey === groupingRoute.routeKey), true)
assert.equal(plan.cueSheet.payload.cueGroupingPlanHash, plan.cueGroupingPlan.groupingHash)
assert.equal(plan.cueGrouping.artifactType, 'music_cue_grouping_plan_v3')
assert.ok(plan.plannedResult.artifacts.every((artifact) =>
  musicSkillCapabilityManifest.producedArtifactTypes.includes(artifact.artifactType)))

console.log(JSON.stringify({
  status: 'ok', musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  manifestHash: musicSkillCapabilityManifest.manifestHash,
  groupingRoute: `${groupingRoute.routeKey}@${groupingRoute.routeVersion}#${groupingRoute.routeHash}`,
  crossfadeRoute: `${crossfadeRoute.routeKey}@${crossfadeRoute.routeVersion}#${crossfadeRoute.routeHash}`,
  requiredV3Outputs, plannedArtifactTypes: plan.plannedResult.artifacts.map((artifact) => artifact.artifactType),
}, null, 2))
