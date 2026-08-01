import assert from 'node:assert/strict'

import type {
  CanonicalLivingFrameMotionSpec,
} from '../../src/types/living-frame-canonical-motion'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileCanonicalLivingFrameMotionSpec,
} from '../living-frame/canonical-living-frame-motion'
import {
  compileLivingFrameAttentionSoundSyncIntegration,
  verifyLivingFrameAttentionSoundSyncIntegration,
  type CompileLivingFrameAttentionSoundSyncIntegrationInput,
} from '../living-frame/living-frame-attention-soundsync-integration'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  createLivingFrameSemanticSoundTimingReconciliationSmokeFixture,
} from './fixtures/living-frame-semantic-sound-timing-reconciliation-fixture'

const fixture =
  await createLivingFrameSemanticSoundTimingReconciliationSmokeFixture(
    'hormuz',
  )
const scene = fixture.input.publication.binding.selectedComponent
  .scenePlans[0]!
const canonicalMotionSpecs = scene.components.map((component) =>
  compileCanonicalLivingFrameMotionSpec({
    publication: fixture.input.publication,
    timingBinding: fixture.input.canonicalTimingBinding,
    components: fixture.input.components,
    sceneId: scene.sceneId,
    componentId: component.componentId,
  }))
const input: CompileLivingFrameAttentionSoundSyncIntegrationInput = {
  integrationId: 'living-frame.attention-soundsync.hormuz.v1',
  sceneId: scene.sceneId,
  ownerScopeAmendment:
    compileLivingFrameOwnerScopeAmendment(),
  publication: fixture.input.publication,
  requirements: fixture.input.requirements,
  canonicalTimingBinding:
    fixture.input.canonicalTimingBinding,
  choreographyBinding:
    fixture.input.choreographyBinding,
  canonicalMotionSpecs,
  components: fixture.input.components,
}
const result =
  await compileLivingFrameAttentionSoundSyncIntegration(input)

assert.equal(
  await verifyLivingFrameAttentionSoundSyncIntegration(result, input),
  true,
)
assert.equal(
  result.integrationState,
  'exact_attention_scale_and_camera_handoff_ready_canonical_renderer_and_soundsync_resolution_pending',
)
assert.equal(result.attentionJourney.length, scene.attentionSequence.length)
assert.equal(
  result.attentionOrderAndCanonicalPhaseAlignmentVerified,
  true,
)
assert.equal(result.focusHandoffRestorePolicyVerified, true)
assert.equal(result.literalAndDataScaleTruthPreserved, true)
assert.equal(
  result.pausedLivingCharacterAndMechanicalRiggingExcluded,
  true,
)
assert.deepEqual(
  result.attentionJourney.map((event) => ({
    eventType: event.eventType,
    phase: event.requiredSemanticPhase,
    start: event.frameRange.startFrame,
    end: event.frameRange.endFrameExclusive,
  })),
  scene.attentionSequence.map((event) => {
    const phase = ({
      prepare: 'prepare',
      handoff: 'activate',
      hold: 'demonstrate',
      restore: 'resolve',
      transition_away: 'resolve',
    } as const)[event.eventType]
    const exact = fixture.input.canonicalTimingBinding.scenes[0]!
      .semanticPhaseBindings.find((binding) =>
        binding.phase === phase)!
    return {
      eventType: event.eventType,
      phase,
      start: exact.frameRange.startFrame,
      end: exact.frameRange.endFrameExclusive,
    }
  }),
)

const handoff = result.attentionJourney.find((event) =>
  event.eventType === 'handoff')!
assert.equal(
  handoff.methodResolutions.some((method) =>
    method.method === 'focus_depth_expectation'
    && method.resolution === 'canonical_motion_v3_tracks'
    && method.motionTracks.some((track) =>
      track.target === 'source'
      && track.property === 'blur_pixels')),
  true,
)
assert.equal(
  handoff.motionTracks.some((track) =>
    track.target === 'layer'
    && (
      track.role === 'primary'
      || track.role === 'secondary'
    )),
  true,
)
assert.equal(
  result.localContrastPrimitiveRequests.every((request) =>
    request.localContrastCannotBeSilentlyReplacedWithBlur
    && request.exactRendererValuesProvided === false),
  true,
)
assert.equal(
  result.semanticScaleBindings[0]?.treatment,
  'literal_relationship_preserved_at_unit_scale',
)
assert.equal(
  result.semanticScaleBindings[0]?.scaleTrackIds.every((trackId) => {
    const track = canonicalMotionSpecs.flatMap((spec) => spec.tracks)
      .find((candidate) => candidate.trackId === trackId)
    return track?.keyframes.every((keyframe) => keyframe.value === 1)
  }),
  true,
)
assert.equal(result.soundSyncRequests.length, scene.soundRequests.length)
for (const request of result.soundSyncRequests) {
  assert.equal(request.currentResolutionState,
    'pending_canonical_soundsync_resolution')
  assert.equal(request.exactCuePlacementProvidedByLivingFrame, false)
  assert.equal(request.exactMixProvidedByLivingFrame, false)
  assert.equal(
    request.semanticTrigger.finalHitFrameAuthorityProvidedByLivingFrame,
    false,
  )
  assert.equal(
    request.semanticTrigger.preferredHitFrameCandidate >=
      request.semanticTrigger.exactAllowedFrameRange.startFrame
    && request.semanticTrigger.preferredHitFrameCandidate <
      request.semanticTrigger.exactAllowedFrameRange.endFrameExclusive,
    true,
  )
  assert.equal(request.canonicalSoundSyncMustReturn
    .exactStartHitAndEndFrames, true)
  assert.equal(request.canonicalSoundSyncMustReturn
    .narrationDuckingAutomation, true)
  assert.equal(request.canonicalSoundSyncMustReturn
    .audioQaAndPrivateReviewEvidence, true)
}
assert.equal(result.canonicalSoundSyncResolutionPending, true)
assert.equal(result.activePrivateInternalReady, false)
assert.equal(result.authorityBoundary.masterTimingAuthority, false)
assert.equal(result.authorityBoundary.soundSyncAuthority, false)
assert.equal(result.authorityBoundary.rendererAuthority, false)
assert.equal(result.authorityBoundary.productionAuthority, false)

let adversarialAssertions = 0

await assert.rejects(
  compileLivingFrameAttentionSoundSyncIntegration({
    ...input,
    rawPrompt: 'smuggled',
  } as never),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameAttentionSoundSyncIntegration({
    ...input,
    canonicalMotionSpecs: canonicalMotionSpecs.slice(1),
  }),
)
adversarialAssertions += 1

await assert.rejects(
  compileLivingFrameAttentionSoundSyncIntegration({
    ...input,
    canonicalMotionSpecs: [
      ...canonicalMotionSpecs,
      canonicalMotionSpecs[0]!,
    ],
  }),
)
adversarialAssertions += 1

const forgedMotion = structuredClone(
  canonicalMotionSpecs[0]!,
) as unknown as CanonicalLivingFrameMotionSpec
;(forgedMotion as unknown as {
  tracks: Array<{ keyframes: Array<{ value: number }> }>
}).tracks[0]!.keyframes[0]!.value += 0.1
;(forgedMotion as unknown as { motionSpecDigestSha256: string })
  .motionSpecDigestSha256 = sha256AuthorityValue(
    withoutDigest(forgedMotion),
  )
await assert.rejects(
  compileLivingFrameAttentionSoundSyncIntegration({
    ...input,
    canonicalMotionSpecs: [
      forgedMotion,
      ...canonicalMotionSpecs.slice(1),
    ],
  }),
)
adversarialAssertions += 1

const forgedOwnerScope = structuredClone(
  input.ownerScopeAmendment,
) as unknown as {
  ownerDecision: { mechanicalRiggingPausedPendingSeparateOwnerSpecification: boolean }
  amendmentDigestSha256: string
}
forgedOwnerScope.ownerDecision
  .mechanicalRiggingPausedPendingSeparateOwnerSpecification = false
forgedOwnerScope.amendmentDigestSha256 = sha256AuthorityValue(
  withoutDigest(forgedOwnerScope),
)
await assert.rejects(
  compileLivingFrameAttentionSoundSyncIntegration({
    ...input,
    ownerScopeAmendment: forgedOwnerScope as never,
  }),
)
adversarialAssertions += 1

const forgedResult = structuredClone(result) as unknown as {
  authorityBoundary: { soundSyncAuthority: boolean }
}
forgedResult.authorityBoundary.soundSyncAuthority = true
assert.equal(
  await verifyLivingFrameAttentionSoundSyncIntegration(
    forgedResult,
    input,
  ),
  false,
)
adversarialAssertions += 1

const pausedCharacterFixture =
  await createLivingFrameSemanticSoundTimingReconciliationSmokeFixture(
    'musashi',
  )
const pausedCharacterScene =
  pausedCharacterFixture.input.publication.binding.selectedComponent
    .scenePlans[0]!
const pausedMotionSpecs = pausedCharacterScene.components.map((component) =>
  compileCanonicalLivingFrameMotionSpec({
    publication: pausedCharacterFixture.input.publication,
    timingBinding:
      pausedCharacterFixture.input.canonicalTimingBinding,
    components: pausedCharacterFixture.input.components,
    sceneId: pausedCharacterScene.sceneId,
    componentId: component.componentId,
  }))
await assert.rejects(
  compileLivingFrameAttentionSoundSyncIntegration({
    integrationId:
      'living-frame.attention-soundsync.paused-character',
    sceneId: pausedCharacterScene.sceneId,
    ownerScopeAmendment:
      compileLivingFrameOwnerScopeAmendment(),
    publication: pausedCharacterFixture.input.publication,
    requirements: pausedCharacterFixture.input.requirements,
    canonicalTimingBinding:
      pausedCharacterFixture.input.canonicalTimingBinding,
    choreographyBinding:
      pausedCharacterFixture.input.choreographyBinding,
    canonicalMotionSpecs: pausedMotionSpecs,
    components: pausedCharacterFixture.input.components,
  }),
  /paused|Character|mechanical action/i,
)
adversarialAssertions += 1

const serialized = JSON.stringify(result)
for (const forbidden of [
  'Strait of Hormuz',
  'rawChat',
  'transcriptText',
  'audioBytes',
  'https://',
  'credential',
  'providerPrompt',
]) assert.equal(serialized.includes(forbidden), false)

console.log(JSON.stringify({
  smoke: 'living-frame-attention-soundsync-integration',
  controlledCases: 1,
  adversarialAssertions,
  attentionEventCount: result.metrics.attentionEventCount,
  semanticScaleBindingCount:
    result.metrics.semanticScaleBindingCount,
  soundSyncRequestCount: result.metrics.soundSyncRequestCount,
  localContrastPrimitiveRequestCount:
    result.metrics.localContrastPrimitiveRequestCount,
  cameraTrackCount: result.metrics.cameraTrackCount,
  characterAndMechanicalRoutesPaused: true,
  canonicalRendererResolutionPending:
    result.canonicalRendererResolutionPending,
  canonicalSoundSyncResolutionPending:
    result.canonicalSoundSyncResolutionPending,
  activePrivateInternalReady: result.activePrivateInternalReady,
  productionReady: result.productionReady,
  status: 'passed',
}))

function withoutDigest(value: unknown): Record<string, unknown> {
  const clone = structuredClone(value) as Record<string, unknown>
  delete clone.motionSpecDigestSha256
  delete clone.amendmentDigestSha256
  return clone
}
