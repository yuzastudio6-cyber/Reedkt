import assert from 'node:assert/strict'
import {
  decimalSecondsToFrames,
  framesToRationalSeconds,
  framesToSamples,
  rationalSecondsToFrames,
  samplesToFrames,
  timelineRatesEqual,
  type TimelineRate,
} from '../edit-skills/core/timeline-rate'
import { standaloneSoundSkillService } from '../edit-skills/registry'
import { analyzeWholeVideoSoundContinuity } from '../sound/sound-continuity'
import { runCanonicalSoundController } from '../sound/sound-controller'
import { evaluateSoundScopeGuard, validateSoundResultAuthority } from '../sound/sound-scope-guard'
import { buildSoundRequest, soundRange } from './sound-test-fixtures'

const rates: TimelineRate[] = [
  { numerator: 24, denominator: 1 },
  { numerator: 25, denominator: 1 },
  { numerator: 30_000, denominator: 1_001 },
  { numerator: 30, denominator: 1 },
  { numerator: 50, denominator: 1 },
  { numerator: 60_000, denominator: 1_001 },
  { numerator: 60, denominator: 1 },
]

for (const rate of rates) {
  const tenHoursFrames = decimalSecondsToFrames({ seconds: 36_000, rate, rounding: 'nearest_half_up' })
  const seconds = framesToRationalSeconds(tenHoursFrames, rate)
  const reconstructed = Number(seconds.numerator) / Number(seconds.denominator)
  assert.ok(Math.abs(reconstructed - 36_000) <= rate.denominator / rate.numerator)
  const samples = framesToSamples({ frames: tenHoursFrames, rate, sampleRate: 48_000, rounding: 'nearest_half_up' })
  const frames = samplesToFrames({ samples, rate, sampleRate: 48_000, rounding: 'nearest_half_up' })
  assert.ok(Math.abs(frames - tenHoursFrames) <= 1)

  const eventFrame = rationalSecondsToFrames({
    secondsNumerator: 1, secondsDenominator: 1, rate, rounding: 'nearest_half_up',
  })
  const rateRequest = buildSoundRequest({
    job: 'design_scene_sound', mode: 'planning',
    audioRanges: [soundRange(`rate-authority-${rate.numerator}-${rate.denominator}`, 0, eventFrame * 3)],
    eventFrames: [eventFrame],
  })
  rateRequest.timelineRate = rate
  rateRequest.timelineManifestRate = rate
  rateRequest.timelineManifestRef.timelineRate = rate
  rateRequest.timelineFps = rate.numerator / rate.denominator
  delete rateRequest.eventAnchors[0]!.endFrameExclusive
  const ratePlan = runCanonicalSoundController(rateRequest, {
    sourceMatches: [{
      anchorId: rateRequest.eventAnchors[0]!.anchorId,
      artifact: rateRequest.sourceAudioRefs[0]!,
      usable: true,
      requiresRepair: false,
    }],
  })
  const cue = ratePlan.result.cueManifest.cues[0]!
  const automation = ratePlan.result.mixAutomationManifest.automations[0]!
  const leadFrames = rationalSecondsToFrames({
    secondsNumerator: 1, secondsDenominator: 25, rate, rounding: 'nearest_half_up',
  })
  const tailFrames = rationalSecondsToFrames({
    secondsNumerator: 3, secondsDenominator: 5, rate, rounding: 'nearest_half_up',
  })
  assert.equal(cue.startFrame, eventFrame - leadFrames)
  assert.equal(cue.hitFrame, eventFrame)
  assert.equal(cue.endFrameExclusive, eventFrame + tailFrames)
  assert.equal(automation.fadeInFrames, Math.max(1, leadFrames))
  assert.equal(automation.fadeOutFrames, Math.max(1, leadFrames))
  assert.equal(automation.duckAttackFrames, Math.max(1, rationalSecondsToFrames({
    secondsNumerator: 3, secondsDenominator: 100, rate, rounding: 'nearest_half_up',
  })))
  assert.equal(automation.duckReleaseFrames, Math.max(1, rationalSecondsToFrames({
    secondsNumerator: 4, secondsDenominator: 25, rate, rounding: 'nearest_half_up',
  })))
}
assert.equal(timelineRatesEqual({ numerator: 30_000, denominator: 1_001 }, { numerator: 60_000, denominator: 2_002 }), true)

const exact = buildSoundRequest({ assignmentMode: 'range', audioRanges: [soundRange('exact', 30, 180)] })
const exactPlan = await standaloneSoundSkillService.plan(exact)
assert.equal(exactPlan.request.timelineRate.numerator, 30)
assert.equal(exactPlan.controller.result.timelineRate.numerator, 30)
assert.equal(exactPlan.controller.result.modifiedVisualRanges.length, 0)

const multi = buildSoundRequest({
  assignmentMode: 'multi_range',
  audioRanges: [soundRange('a', 0, 90), soundRange('b', 150, 240)],
  eventFrames: [30, 180],
})
assert.equal((await standaloneSoundSkillService.plan(multi)).request.assignmentScope.authorizedAudioWriteRanges.length, 2)
const whole = buildSoundRequest({ job: 'full_video_sound_pass', assignmentMode: 'whole_video', inspectWholeVideo: true })
const wholePlan = await standaloneSoundSkillService.plan(whole)
assert.equal(wholePlan.continuity.wholeVideoReadOnly, true)
assert.notEqual(wholePlan.controller.result.soundDesignPlan?.wholeVideoContinuity, true)

const peer = buildSoundRequest({ callerType: 'living_frame', job: 'support_living_frame_sound' })
assert.equal((await standaloneSoundSkillService.plan(peer)).controller.result.callerReceipt.authorityEscalated, false)
const peerView = standaloneSoundSkillService.getPeerCapabilityView({
  callerType: 'living_frame', callerSkillKey: 'living_frame', jobType: 'support_living_frame_sound',
})
assert.equal(peerView.accepted, true)
assert.equal(peerView.peerMayInvokeSoundToolsDirectly, false)
assert.equal(peerView.peerMaySupplyProviderPayload, false)
assert.equal(evaluateSoundScopeGuard(exact).ok, true)
assert.equal(evaluateSoundScopeGuard(buildSoundRequest({
  inspectWholeVideo: true, audioRanges: [soundRange('bounded-write', 60, 90)],
})).ok, true)

const mismatch = buildSoundRequest()
mismatch.timelineManifestRate = { numerator: 24, denominator: 1 }
assert.equal(evaluateSoundScopeGuard(mismatch).code, 'invalid_contract')
const escalation = buildSoundRequest({
  callerType: 'transitions',
  audioRanges: [soundRange('delegated', 0, 500)],
  callerOwnedAudioRanges: [soundRange('owner', 0, 100)],
})
assert.equal(evaluateSoundScopeGuard(escalation).code, 'peer_authority_escalation')
assert.equal(evaluateSoundScopeGuard(buildSoundRequest({ dependencyChain: ['head_of_orchestra', 'sound'] })).code,
  'circular_dependency')
assert.equal(evaluateSoundScopeGuard(buildSoundRequest({
  lockedAudioTracks: ['sound-effects'], targetAudioTracks: ['sound-effects'],
})).code, 'locked_layer_violation')
assert.equal(evaluateSoundScopeGuard(buildSoundRequest({
  lockedVisualLayers: ['approved-visual'], targetVisualLayers: ['approved-visual'],
})).code, 'locked_layer_violation')
const staleTiming = buildSoundRequest()
staleTiming.visualDependencies[0]!.timingManifestHash = '0'.repeat(64)
assert.equal(evaluateSoundScopeGuard(staleTiming).code, 'stale_source')
const staleVisual = buildSoundRequest()
staleVisual.assignmentScope.sourceArtifactVersions = staleVisual.assignmentScope.sourceArtifactVersions.map((ref) =>
  ref.artifactId === staleVisual.visualDependencies[0]!.artifact.artifactId
    ? { ...ref, checksumSha256: '0'.repeat(64) } : ref)
assert.equal(evaluateSoundScopeGuard(staleVisual).code, 'stale_source')

const authorityRequest = buildSoundRequest({
  job: 'design_scene_sound', audioRanges: [soundRange('result-authority', 0, 120)], eventFrames: [60],
})
const authorityController = runCanonicalSoundController(authorityRequest, {
  sourceMatches: [{ anchorId: 'event-1', artifact: authorityRequest.sourceAudioRefs[0]!, usable: true, requiresRepair: false }],
})
assert.equal(validateSoundResultAuthority(authorityRequest, authorityController.result).ok, true)
const visualLeak = structuredClone(authorityController.result)
visualLeak.modifiedVisualRanges = [soundRange('unauthorized-visual', 0, 10)]
assert.equal(validateSoundResultAuthority(authorityRequest, visualLeak).code, 'unauthorized_visual_write')
const tailLeak = structuredClone(authorityController.result)
tailLeak.cueManifest.cues[0]!.endFrameExclusive = 130
assert.equal(validateSoundResultAuthority(authorityRequest, tailLeak).code, 'range_violation')

const handledTailRequest = buildSoundRequest({
  job: 'design_scene_sound', audioRanges: [soundRange('tail-body', 0, 100)], eventFrames: [60],
  tailPolicy: 'use_authorized_context_handle',
  contextHandles: [{
    contextHandleId: 'approved-tail', authorizedRange: soundRange('tail-handle', 100, 130), purpose: 'sound_tail',
  }],
})
const handledTailResult = structuredClone(runCanonicalSoundController(handledTailRequest, {
  sourceMatches: [{ anchorId: 'event-1', artifact: handledTailRequest.sourceAudioRefs[0]!, usable: true, requiresRepair: false }],
}).result)
handledTailResult.cueManifest.cues[0]!.endFrameExclusive = 120
assert.equal(validateSoundResultAuthority(handledTailRequest, handledTailResult).ok, true)

const continuity = analyzeWholeVideoSoundContinuity({
  reportId: 'continuity-fixture', timelineRate: { numerator: 30, denominator: 1 },
  maximumCueDensityPerMinute: 3,
  scenes: [
    { sceneId: 'scene-a', range: soundRange('scene-a', 0, 90), acousticEnvironment: 'room-a', roomToneOrAmbienceId: 'roomtone-a', sourceAudioPresent: true, dialogueImportance: 'high', musicContext: 'none', foregroundPerspective: 'medium', backgroundPerspective: 'distant', intentionalSilence: false, cueIdentityKeys: ['wood-hit'] },
    { sceneId: 'scene-b', range: soundRange('scene-b', 90, 180), acousticEnvironment: 'room-a', environmentChangeIntent: 'same_environment', sourceAudioPresent: true, dialogueImportance: 'critical', musicContext: 'accent', foregroundPerspective: 'medium', backgroundPerspective: 'distant', intentionalSilence: false, cueIdentityKeys: ['wood-hit'] },
    { sceneId: 'scene-c', range: soundRange('scene-c', 180, 270), acousticEnvironment: 'exterior', environmentChangeIntent: 'deliberate_change', roomToneOrAmbienceId: 'street', sourceAudioPresent: true, dialogueImportance: 'none', musicContext: 'none', foregroundPerspective: 'distant', backgroundPerspective: 'distant', intentionalSilence: true, cueIdentityKeys: [] },
  ],
  cues: [],
})
assert.ok(continuity.boundaryFindings.some((finding) => finding.category === 'ambience'))
assert.ok(continuity.boundaryFindings.some((finding) => finding.category === 'environment'))
assert.ok(continuity.repeatedCueMaterialWarnings.some((finding) => finding.category === 'repetition'))
assert.ok(continuity.intentionalSilenceFindings.length > 0)
assert.ok(continuity.recommendedLocalizedRevisions.every((revision) => revision.range.endFrameExclusive <= 270))

const stableContinuity = analyzeWholeVideoSoundContinuity({
  reportId: 'stable-continuity', timelineRate: { numerator: 30, denominator: 1 },
  maximumCueDensityPerMinute: 30, cues: [],
  scenes: [
    { sceneId: 'stable-a', range: soundRange('stable-a', 0, 90), acousticEnvironment: 'same-room', roomToneOrAmbienceId: 'roomtone', sourceAudioPresent: true, dialogueImportance: 'high', musicContext: 'none', foregroundPerspective: 'medium', intentionalSilence: false, cueIdentityKeys: [] },
    { sceneId: 'stable-b', range: soundRange('stable-b', 90, 180), acousticEnvironment: 'same-room', environmentChangeIntent: 'same_environment', roomToneOrAmbienceId: 'roomtone', sourceAudioPresent: true, dialogueImportance: 'critical', musicContext: 'none', foregroundPerspective: 'medium', intentionalSilence: false, cueIdentityKeys: [] },
  ],
})
assert.equal(stableContinuity.status, 'passed')
assert.equal(stableContinuity.boundaryFindings.length, 0)

const denseCues = Array.from({ length: 4 }, (_, index) => ({
  cueId: `dense-${index}`, startFrame: index * 15, hitFrame: index * 15 + 2,
  endFrameExclusive: index * 15 + 10, acquisitionDecision: 'preserve_project_source' as const,
  miniSkillKey: 'source_sound_study', layerRole: 'subtle_support' as const,
  storyReason: 'Density fixture.', staleIfVisualChanges: true,
}))
const issueContinuity = analyzeWholeVideoSoundContinuity({
  reportId: 'issue-continuity', timelineRate: { numerator: 30, denominator: 1 },
  maximumCueDensityPerMinute: 3, cues: denseCues,
  scenes: [
    { sceneId: 'issue-a', range: soundRange('issue-a', 0, 90), acousticEnvironment: 'room', roomToneOrAmbienceId: 'roomtone', sourceAudioPresent: true, dialogueImportance: 'critical', musicContext: 'accent', foregroundPerspective: 'medium', intentionalSilence: false, cueIdentityKeys: ['cue-a'] },
    { sceneId: 'issue-b', range: soundRange('issue-b', 90, 180), acousticEnvironment: 'room', environmentChangeIntent: 'same_environment', sourceAudioPresent: true, dialogueImportance: 'high', musicContext: 'bed', foregroundPerspective: 'medium', intentionalSilence: false, cueIdentityKeys: ['cue-b'] },
    { sceneId: 'unaffected-c', range: soundRange('unaffected-c', 180, 270), acousticEnvironment: 'room', environmentChangeIntent: 'same_environment', roomToneOrAmbienceId: 'roomtone', sourceAudioPresent: true, dialogueImportance: 'none', musicContext: 'none', foregroundPerspective: 'medium', intentionalSilence: false, cueIdentityKeys: [] },
  ],
})
assert.ok(issueContinuity.boundaryFindings.some((finding) => finding.category === 'density'))
assert.ok(issueContinuity.boundaryFindings.some((finding) => finding.category === 'music_collision'))
assert.ok(issueContinuity.boundaryFindings.some((finding) => finding.category === 'ambience'))
assert.ok(issueContinuity.recommendedLocalizedRevisions.every((revision) =>
  !revision.sceneIds.includes('unaffected-c')))

const missingContinuityEvidence = analyzeWholeVideoSoundContinuity({
  reportId: 'missing-continuity', timelineRate: { numerator: 30, denominator: 1 },
  maximumCueDensityPerMinute: 30, cues: [], scenes: [{
    sceneId: 'missing', range: soundRange('missing', 0, 90), sourceAudioPresent: false,
    dialogueImportance: 'none', musicContext: 'none', intentionalSilence: false, cueIdentityKeys: [],
  }],
})
assert.equal(missingContinuityEvidence.status, 'blocked_missing_evidence')
assert.ok(missingContinuityEvidence.unresolvedContinuityDependencies.length >= 2)

console.log(JSON.stringify({
  status: 'ok', rates: rates.map((rate) => `${rate.numerator}/${rate.denominator}`),
  exactRoute: exactPlan.selectedRoute,
  wholeVideoContinuityStatus: wholePlan.continuity.status,
  peerCapability: peerView.capabilityKey,
}, null, 2))
