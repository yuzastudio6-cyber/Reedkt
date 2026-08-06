import assert from 'node:assert/strict'
import { getToolOperationCapability } from '../tool-registry'
import { createSkillCapabilityManifest } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  MUSIC_PUBLIC_SERVICE_OUTPUT_ARTIFACT_TYPES,
  musicSkillCapabilityManifest,
  MUSIC_PRODUCED_ARTIFACT_TYPES,
} from '../edit-skills/music/music-capability-manifest'
import { MUSIC_MINI_SKILL_MANIFESTS } from '../edit-skills/music/music-mini-skill-registry'
import { validateMusicOperationHandlerCoverage } from '../edit-skills/music/music-operation-handler-registry'
import { validateCanonicalMusicPublication } from '../edit-skills/music/music-publication-validation'
import { getMusicToolRouteManifest, publishMusicToolRouteManifest,
  type MusicToolRouteManifest } from '../music/music-tool-routes'
import { MUSIC_CANONICAL_SOUND_DEPENDENCY_IDENTITY } from '../music/music-sound-support-port'
import { soundSkillCapabilityManifest } from '../edit-skills/sound'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights, testHash } from './canonical-music-test-fixtures'

validateCanonicalMusicPublication()
validateMusicOperationHandlerCoverage()

const requiredV3Outputs = [
  'music_soundtrack_segmentation_plan_v3', 'music_cue_grouping_plan_v3',
  'music_cue_constraint_resolution_v3', 'music_cue_policy_conflict_v3',
  'music_acceptance_receipt_v3', 'music_crossfade_plan_v3', 'music_crossfade_audio',
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

const cueSheetRoute = getMusicToolRouteManifest('music.route.plan.cue_sheet.v3', '3.2.0')
assert.ok(cueSheetRoute)
assert.deepEqual(cueSheetRoute.producedArtifactTypes,
  ['music_cue_sheet_v2', 'music_cue_constraint_resolution_v3'])
assert.ok(cueSheetRoute.steps.some((step) => step.operationKey === 'publish_cue_constraint_resolutions'))

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
assert.ok(plan.plannedResult.artifacts.some((artifact) =>
  artifact.artifactType === 'music_cue_constraint_resolution_v3'))
assert.ok(plan.plannedResult.artifacts.some((artifact) =>
  artifact.artifactType === 'music_acceptance_receipt_v3'))

const realRange = { rangeId: 'manifest-real-range', startFrame: 0, endFrameExclusive: 96 }
const source = await runtime.makeWav({ id: 'manifest-real-source', durationSeconds: 4, frequency: 330, volume: 0.12 })
const cue = makeMusicCue({ cueId: 'manifest-real-cue', range: realRange, acquisitionPreference: 'user_upload' })
const executionRequest = makeCanonicalMusicRequest({
  requestId: 'music-manifest-v3-real-execution', mode: 'private_internal', cues: [cue], assets: [source],
  rights: [makeMusicRights({ asset: source, source: 'user_upload' })], allowGeneration: false,
})
const execution = await runtime.music.execute(executionRequest)
assert.equal(execution.status, 'completed')
const qa = await runtime.music.qa({ result: execution })
assert.notEqual(qa.status, 'blocking')
const revisedRequest = structuredClone(executionRequest)
revisedRequest.cueConstraints.requestedCues[0]!.instrumentation = ['restrained piano', 'soft pulse']
const revision = await runtime.music.executeRevision({
  request: revisedRequest, previousResult: execution, invalidatedRanges: [realRange],
  reason: 'Manifest completeness revision proof.',
  approvedRevisionSnapshotId: revisedRequest.approvedSnapshotRef.snapshotId,
  approvedRevisionSnapshotHash: revisedRequest.approvedSnapshotRef.snapshotHash,
  revisionIdempotencyKey: 'music-manifest-v3-revision-2',
})
assert.ok(revision.artifacts.some((artifact) => artifact.artifactType === 'music_revision_receipt_v2'))
assert.ok(revision.finalCompositionHandoff)

const authoritativeArtifacts = [
  ...plan.plannedResult.artifacts,
  ...execution.artifacts,
  ...revision.artifacts,
  ...(qa.qaArtifact ? [qa.qaArtifact] : []),
]
for (const artifact of authoritativeArtifacts) {
  assert.ok(MUSIC_PRODUCED_ARTIFACT_TYPES.includes(artifact.artifactType),
    `Runtime returned undeclared Music artifact ${artifact.artifactType}.`)
  assert.match(artifact.artifactHash, /^[a-f0-9]{64}$/u)
}
for (const artifactType of MUSIC_PUBLIC_SERVICE_OUTPUT_ARTIFACT_TYPES) {
  assert.ok(MUSIC_PRODUCED_ARTIFACT_TYPES.includes(artifactType))
}

assert.equal(MUSIC_CANONICAL_SOUND_DEPENDENCY_IDENTITY.soundSkillVersion,
  soundSkillCapabilityManifest.skillVersion)
assert.equal(MUSIC_CANONICAL_SOUND_DEPENDENCY_IDENTITY.soundContractVersion,
  soundSkillCapabilityManifest.contractVersion)
assert.equal(MUSIC_CANONICAL_SOUND_DEPENDENCY_IDENTITY.soundManifestHash,
  soundSkillCapabilityManifest.manifestHash)
assert.equal(MUSIC_CANONICAL_SOUND_DEPENDENCY_IDENTITY.capabilityKey,
  'sound.edit_music_technical_automation')

function republishedMusicManifest(input: {
  omitProducedArtifact?: string
  staleRouteHash?: boolean
}) {
  const { manifestHash: _manifestHash, ...core } = structuredClone(musicSkillCapabilityManifest)
  assert.equal(_manifestHash, musicSkillCapabilityManifest.manifestHash)
  const toolRoutes = input.staleRouteHash ? core.toolRoutes.map((route, index) => index === 0
    ? { ...route, routeHash: testHash('stale-route-hash') } : route) : core.toolRoutes
  return createSkillCapabilityManifest({
    ...core,
    producedArtifactTypes: input.omitProducedArtifact
      ? core.producedArtifactTypes.filter((artifactType) => artifactType !== input.omitProducedArtifact)
      : core.producedArtifactTypes,
    toolRoutes,
  })
}

assert.throws(() => validateCanonicalMusicPublication({
  ...musicSkillCapabilityManifest, manifestHash: testHash('stale-manifest-hash'),
}), /hash is stale or forged/u)
assert.throws(() => validateCanonicalMusicPublication(republishedMusicManifest({
  omitProducedArtifact: 'music_acceptance_receipt_v3',
})), /omits public-service output/u)
assert.throws(() => validateCanonicalMusicPublication(republishedMusicManifest({ staleRouteHash: true })),
  /unresolved Music route/u)

const missingHandlerRoute = structuredClone(cueSheetRoute)
missingHandlerRoute.steps[0]!.operationKey = 'missing_music_handler'
assert.throws(() => validateMusicOperationHandlerCoverage([missingHandlerRoute]), /lacks an exact handler/u)

function unpublished(route: MusicToolRouteManifest): Parameters<typeof publishMusicToolRouteManifest>[0] {
  return {
    routeKey: route.routeKey, routeVersion: route.routeVersion,
    supportedCapabilityKeys: [...route.supportedCapabilityKeys], supportedJobTypes: [...route.supportedJobTypes],
    routeRole: route.routeRole, qualificationEvidenceRefs: [...route.qualificationEvidenceRefs],
    requiredInputs: [...route.requiredInputs], producedArtifactTypes: [...route.producedArtifactTypes],
    optionalProducedArtifactTypes: [...route.optionalProducedArtifactTypes], eligibilityRules: [...route.eligibilityRules],
    steps: structuredClone(route.steps), timeEstimatorKey: route.timeEstimatorKey,
    creditEstimatorKey: route.creditEstimatorKey, attemptPolicyKey: route.attemptPolicyKey,
    fallbackRouteRefs: structuredClone(route.fallbackRouteRefs), automaticFallbackAllowed: false,
    unknownOutcomeResubmissionAllowed: false, freshApprovalRequiredForCostIncrease: true,
    planningQa: [...route.planningQa], outputQa: [...route.outputQa], integrationQa: [...route.integrationQa],
    invalidationRules: [...route.invalidationRules], knownLimitations: [...route.knownLimitations],
  }
}

const undeclaredStepOutput = unpublished(cueSheetRoute)
undeclaredStepOutput.steps[0]!.outputBindings.push('music_undeclared_step_output_v3')
assert.throws(() => publishMusicToolRouteManifest(undeclaredStepOutput), /claims undeclared operation output/u)
const unsupportedJob = unpublished(cueSheetRoute)
unsupportedJob.steps[0]!.stepJobType = 'generate_foley'
assert.throws(() => publishMusicToolRouteManifest(unsupportedJob), /operation does not support/u)
const unreachableFinal = unpublished(cueSheetRoute)
unreachableFinal.producedArtifactTypes.push('music_unreachable_final_v3')
assert.throws(() => publishMusicToolRouteManifest(unreachableFinal), /output music_unreachable_final_v3 is unreachable/u)

console.log(JSON.stringify({
  status: 'ok', musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  manifestHash: musicSkillCapabilityManifest.manifestHash,
  groupingRoute: `${groupingRoute.routeKey}@${groupingRoute.routeVersion}#${groupingRoute.routeHash}`,
  crossfadeRoute: `${crossfadeRoute.routeKey}@${crossfadeRoute.routeVersion}#${crossfadeRoute.routeHash}`,
  requiredV3Outputs, plannedArtifactTypes: plan.plannedResult.artifacts.map((artifact) => artifact.artifactType),
  executionArtifactTypes: [...new Set(execution.artifacts.map((artifact) => artifact.artifactType))],
  revisionArtifactTypes: [...new Set(revision.artifacts.map((artifact) => artifact.artifactType))],
  negativePublicationCasesRejected: 7,
}, null, 2))
