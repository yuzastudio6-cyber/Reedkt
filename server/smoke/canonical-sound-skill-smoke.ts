import assert from 'node:assert/strict'
import {
  applyLocalizedSoundRevision,
  runCanonicalSoundController,
  validatePlannedCueAuthority,
} from '../sound/sound-controller'
import {
  parseCanonicalSoundRequest,
  type CanonicalSoundResult,
} from '../sound/sound-contracts'
import {
  evaluateSoundScopeGuard,
  validateSoundResultAuthority,
} from '../sound/sound-scope-guard'
import { soundSkillCapabilityManifest } from '../sound/sound-manifest'
import {
  buildSoundRequest,
  fixtureHash,
  soundArtifact,
  soundRange,
} from './sound-test-fixtures'

const exactRequest = buildSoundRequest({
  audioRanges: [soundRange('exact-five-seconds', 90, 240)],
  eventFrames: [120, 210],
  allowProviderGeneration: true,
})
const exactAdmission = evaluateSoundScopeGuard(exactRequest)
assert.equal(exactAdmission.ok, true)
const exact = runCanonicalSoundController(exactRequest)
assert.equal(exact.assignment.ok, true)
assert.equal(exact.assignment.binding?.manifestHash, soundSkillCapabilityManifest.manifestHash)
assert.equal(exact.result.cueManifest.cues.length, 2)
assert.equal(exact.childWorkItems.length, 2)
assert.equal(exact.childWorkItems.every((item) => item.miniSkillKey === 'video_conditioned_sfx'), true)
assert.equal(new Set(exact.childWorkItems.map((item) => item.workItemId)).size, 2)
assert.equal(exact.childWorkItems.every((item) =>
  item.skillBinding.skillKey === 'sound' &&
  item.skillBinding.skillVersion === soundSkillCapabilityManifest.skillVersion &&
  item.skillBinding.manifestHash === soundSkillCapabilityManifest.manifestHash &&
  item.skillBinding.capabilityKey === exactRequest.requestedCapabilityKey &&
  item.skillBinding.capabilityVersion.length > 0), true)
assert.deepEqual(exact.result.cueManifest.cues.map((cue) => cue.hitFrame), [120, 210])
assert.equal(validatePlannedCueAuthority(exactRequest, exact.result.cueManifest.cues), true)
assert.equal(validateSoundResultAuthority(exactRequest, exact.result).ok, true)

const multiRequest = buildSoundRequest({
  assignmentMode: 'multi_range',
  audioRanges: [soundRange('first', 0, 90), soundRange('second', 180, 270)],
  eventFrames: [30, 210],
  allowProviderGeneration: true,
})
const multi = runCanonicalSoundController(multiRequest)
assert.equal(multi.result.cueManifest.cues.length, 2)
assert.equal(validatePlannedCueAuthority(multiRequest, multi.result.cueManifest.cues), true)

const wholeRequest = buildSoundRequest({
  job: 'full_video_sound_pass',
  assignmentMode: 'whole_video',
  audioRanges: [soundRange('whole', 0, 900)],
  eventFrames: [60, 420, 780],
  allowProviderGeneration: true,
})
const whole = runCanonicalSoundController(wholeRequest)
assert.equal(whole.assignment.ok, true)
assert.equal((whole.result.soundDesignPlan as Record<string, unknown>).wholeVideoContinuityConsidered, true)

for (const [callerType, job] of [
  ['living_frame', 'support_living_frame_sound'],
  ['three_d', 'support_3d_sound'],
  ['motion_design', 'support_motion_design_sound'],
  ['transitions', 'support_transition_sound'],
  ['graphic_design', 'support_graphic_design_sound'],
] as const) {
  const request = buildSoundRequest({ callerType, job, allowProviderGeneration: true })
  const response = runCanonicalSoundController(request)
  assert.equal(response.assignment.ok, true, `${callerType} must be admitted.`)
  assert.equal(response.result.callerReceipt.callerType, callerType)
  assert.equal(response.result.callerReceipt.authorityEscalated, false)
  assert.equal(response.result.callerReceipt.parentWorkItemId, `parent-work-${callerType}`)
}

const escalated = buildSoundRequest({
  callerType: 'living_frame',
  job: 'support_living_frame_sound',
  audioRanges: [soundRange('delegated-too-far', 0, 500)],
  callerOwnedAudioRanges: [soundRange('caller-owns-less', 0, 120)],
})
assert.equal(evaluateSoundScopeGuard(escalated).code, 'peer_authority_escalation')

const circular = buildSoundRequest({
  callerType: 'living_frame',
  job: 'support_living_frame_sound',
  dependencyChain: ['living_frame', 'sound'],
})
assert.equal(evaluateSoundScopeGuard(circular).code, 'circular_dependency')

const broadReadSmallWrite = buildSoundRequest({
  inspectWholeVideo: true,
  audioRanges: [soundRange('five-second-write', 300, 450)],
  eventFrames: [330],
  allowProviderGeneration: true,
})
const broad = runCanonicalSoundController(broadReadSmallWrite)
assert.equal(broadReadSmallWrite.assignmentScope.inspectWholeVideo, true)
const broadCue = broad.result.cueManifest.cues[0]
assert.ok(broadCue)
assert.equal(broadCue.startFrame >= 300, true)
assert.equal(broadCue.endFrameExclusive <= 450, true)

const lockedTrack = buildSoundRequest({
  lockedAudioTracks: ['sound-effects'],
  targetAudioTracks: ['sound-effects'],
})
assert.equal(evaluateSoundScopeGuard(lockedTrack).code, 'locked_layer_violation')
const lockedLayer = buildSoundRequest({
  lockedVisualLayers: ['primary-picture'],
  targetVisualLayers: ['primary-picture'],
})
assert.equal(evaluateSoundScopeGuard(lockedLayer).code, 'locked_layer_violation')

const clampedRequest = buildSoundRequest({
  audioRanges: [soundRange('clamp', 0, 100)],
  eventFrames: [96],
  allowProviderGeneration: true,
})
const clamped = runCanonicalSoundController(clampedRequest)
assert.equal(clamped.result.cueManifest.cues[0]?.endFrameExclusive, 100)

const overlapRequest = buildSoundRequest({
  eventFrames: [60, 65],
  eventTypes: ['object_contact', 'object_contact'],
  allowProviderGeneration: true,
})
const overlap = runCanonicalSoundController(overlapRequest)
assert.equal(overlap.result.cueManifest.cues.length, 1)
assert.equal(overlap.result.mergedCueRequests.length, 1)
assert.equal(overlap.result.acceptedCueRequests.length, 1)

const silenceRequest = buildSoundRequest({
  eventFrames: [60],
  eventSoundUseful: [false],
  allowProviderGeneration: true,
})
const silence = runCanonicalSoundController(silenceRequest)
assert.equal(silence.result.status, 'no_sound')
assert.equal(silence.result.cueManifest.cues.length, 0)
assert.equal(silence.result.rejectedCueRequests[0]?.decision, 'rejected')

const emotionalRequest = buildSoundRequest({
  eventFrames: [120],
  allowProviderGeneration: true,
})
const emotional = runCanonicalSoundController(emotionalRequest, {
  emotionalSilenceRanges: [soundRange('emotional-pause', 100, 150)],
})
assert.equal(emotional.result.status, 'no_sound')

const protectedSpeech = soundRange('protected-dialogue', 100, 180)
const speechRequest = buildSoundRequest({
  eventFrames: [120],
  allowProviderGeneration: true,
})
const speech = runCanonicalSoundController(speechRequest, {
  protectedSpeechRanges: [protectedSpeech],
})
assert.equal(speech.result.mixAutomationManifest.automations[0]?.dialogueDuckingDb, -9)
assert.equal(speech.result.mixAutomationManifest.automations[0]?.protectedSpeechRanges.length, 1)
const speechAutomation = speech.result.mixAutomationManifest.automations[0]
assert.ok(speechAutomation)
assert.equal(speechAutomation.headroomDb >= 3, true)
assert.equal(speech.result.mixAutomationManifest.automations[0]?.musicInteractionPolicy, 'avoid_accents')

const sourceAsset = soundArtifact('natural-source-cue', 'approved_source_audio', 'audio/wav', 30)
const acquisitionRequest = buildSoundRequest({ eventFrames: [60], allowProviderGeneration: true })
const sourceFirst = runCanonicalSoundController(acquisitionRequest, {
  sourceMatches: [{ anchorId: 'event-1', artifact: sourceAsset, usable: true, requiresRepair: false }],
  internalLibraryMatches: [{
    anchorId: 'event-1',
    artifact: soundArtifact('library-cue', 'candidate_sfx_asset', 'audio/wav', 30),
    semanticScore: 0.99,
    provenanceApproved: true,
    projectAuthorized: true,
  }],
})
assert.equal(sourceFirst.result.cueManifest.cues[0]?.acquisitionDecision, 'preserve_project_source')
const libraryFirst = runCanonicalSoundController(acquisitionRequest, {
  internalLibraryMatches: [{
    anchorId: 'event-1',
    artifact: soundArtifact('library-cue', 'candidate_sfx_asset', 'audio/wav', 30),
    semanticScore: 0.95,
    provenanceApproved: true,
    projectAuthorized: true,
  }],
})
assert.equal(libraryFirst.result.cueManifest.cues[0]?.acquisitionDecision, 'internal_library')
const extractFirst = runCanonicalSoundController(acquisitionRequest, {
  projectExtractionMatches: [{
    anchorId: 'event-1',
    artifact: soundArtifact('project-extract', 'approved_source_audio', 'audio/wav', 30),
    usable: true,
    requiresRepair: true,
  }],
})
assert.equal(extractFirst.result.cueManifest.cues[0]?.acquisitionDecision, 'project_source_extraction')

const outOfRangeRequest = buildSoundRequest({
  audioRanges: [soundRange('only-first-second', 0, 30)],
  eventFrames: [120],
  allowProviderGeneration: true,
  requestedOperations: ['design', 'propose_visual_retime'],
})
const outOfRange = runCanonicalSoundController(outOfRangeRequest)
assert.equal(outOfRange.result.status, 'needs_visual_revision')
assert.equal(outOfRange.result.proposedVisualRevisions[0]?.routeThroughHead, true)
assert.equal(outOfRange.result.modifiedVisualRanges.length, 0)

const unauthorizedVisualResult: CanonicalSoundResult = structuredClone(exact.result)
unauthorizedVisualResult.modifiedVisualRanges = [soundRange('visual-change', 100, 110)]
assert.equal(
  validateSoundResultAuthority(exactRequest, unauthorizedVisualResult).code,
  'unauthorized_visual_write',
)
const authorizedVisualRequest = buildSoundRequest({
  visualRanges: [soundRange('visual-authority', 100, 130)],
  eventFrames: [110],
  allowProviderGeneration: true,
})
const authorizedVisual = runCanonicalSoundController(authorizedVisualRequest)
const authorizedVisualResult = structuredClone(authorizedVisual.result)
authorizedVisualResult.modifiedVisualRanges = [soundRange('bounded-visual-change', 105, 115)]
assert.equal(validateSoundResultAuthority(authorizedVisualRequest, authorizedVisualResult).ok, true)

const noTailRequest = buildSoundRequest({
  audioRanges: [soundRange('tail-owner', 0, 100)],
  eventFrames: [90],
  allowProviderGeneration: true,
})
const noTail = runCanonicalSoundController(noTailRequest)
const outsideTail = structuredClone(noTail.result)
outsideTail.cueManifest.cues[0]!.endFrameExclusive = 110
outsideTail.modifiedAudioRanges = [soundRange('tail-write', 100, 110)]
assert.equal(validateSoundResultAuthority(noTailRequest, outsideTail).code, 'range_violation')
const handledTailRequest = buildSoundRequest({
  audioRanges: [soundRange('tail-owner', 0, 100)],
  eventFrames: [90],
  allowProviderGeneration: true,
  tailPolicy: 'use_authorized_context_handle',
  contextHandles: [{
    contextHandleId: 'tail-context',
    authorizedRange: soundRange('tail-context-range', 100, 120),
    purpose: 'sound_tail',
  }],
})
const handledTail = runCanonicalSoundController(handledTailRequest)
const handledTailResult = structuredClone(handledTail.result)
handledTailResult.cueManifest.cues[0]!.endFrameExclusive = 110
handledTailResult.modifiedAudioRanges = [soundRange('tail-write', 100, 110)]
assert.equal(validateSoundResultAuthority(handledTailRequest, handledTailResult).ok, true)

const revisionPrevious = exact.result
const replacement = {
  ...revisionPrevious.cueManifest.cues[0]!,
  cueId: 'replacement-cue',
  startFrame: 100,
  hitFrame: 125,
  endFrameExclusive: 150,
}
const localized = applyLocalizedSoundRevision({
  previous: revisionPrevious,
  invalidatedRanges: [soundRange('localized-change', 90, 160)],
  replacementCues: [replacement],
})
assert.equal(localized.some((cue) => cue.cueId === 'replacement-cue'), true)
assert.equal(localized.some((cue) => cue.hitFrame === 210), true)

assert.equal(exact.result.callerReceipt.finalRenderOwnedBySound, false)
assert.equal(exact.result.callerReceipt.musicCompositionPerformed, false)
assert.deepEqual(exact.result.finalHandoffTargets, ['head_of_orchestra'])
const handoffRequest = buildSoundRequest({ job: 'handoff_sound_to_final_composition' })
const handoff = runCanonicalSoundController(handoffRequest)
assert.deepEqual(handoff.result.finalHandoffTargets, ['head_of_orchestra', 'final_composition'])
assert.equal(handoff.result.callerReceipt.finalRenderOwnedBySound, false)

assert.throws(() => parseCanonicalSoundRequest({
  ...exactRequest,
  rawWorkerPrompt: 'run this directly',
}), /Unsafe canonical Sound request/)
assert.throws(() => parseCanonicalSoundRequest({
  ...exactRequest,
  arbitraryUrl: 'https://example.com/signed?signature=secret',
}), /Unsafe canonical Sound request/)
const staleVisual = structuredClone(exactRequest)
staleVisual.visualDependencies[0]!.timingManifestHash = fixtureHash('different-timing')
assert.equal(evaluateSoundScopeGuard(staleVisual).code, 'stale_source')

process.stdout.write('Canonical Sound controller and scope smoke passed.\n')
