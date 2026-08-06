import assert from 'node:assert/strict'
import {
  CanonicalSoundV4MusicSupportAdapter,
  createMusicSoundSupportRequest,
  type MusicSoundSupportRequest,
} from '../music/music-sound-support-port'
import { hashMusicValue } from '../music/music-contracts'
import { measureSoundMixOutput } from '../sound/sound-local-audio-processor'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights } from './canonical-music-test-fixtures'

const runtime = await createCanonicalMusicTestRuntime()
const source = await runtime.makeWav({
  id: 'duck-envelope-source', durationSeconds: 8, frequency: 330, volume: 0.2,
})
const range = { rangeId: 'duck-output-range', startFrame: 0, endFrameExclusive: 192 }
const protectedSpeechRange = { rangeId: 'protected-speech', startFrame: 72, endFrameExclusive: 120 }
const cue = makeMusicCue({ cueId: 'duck-envelope-cue', range, acquisitionPreference: 'user_upload',
  protectedSpeechRanges: [protectedSpeechRange] })
const request = makeCanonicalMusicRequest({
  requestId: 'music-duck-envelope', mode: 'private_internal', cues: [cue], assets: [source],
  rights: [makeMusicRights({ asset: source, source: 'user_upload' })], allowGeneration: false,
})

const result = await runtime.music.execute(request)
assert.equal(result.status, 'completed', JSON.stringify(result.unitReceipts.filter((item) => item.status !== 'completed')))
assert.equal(result.soundSupportReceipts.length, 1)
const processed = result.processedMusicAssetRefs.at(-1)
assert.ok(processed)
const resolved = await runtime.resolver.resolve(processed)
const attackSeconds = 4 / 24
const releaseSeconds = 4 / 24
const measured = await measureSoundMixOutput({
  absolutePath: resolved.absolutePath,
  protectedSpeechWindows: [{ startSeconds: 3, endSeconds: 5 }],
  gainEnvelope: [], pan: 0, duckAttackSeconds: attackSeconds,
  duckReleaseSeconds: releaseSeconds, dialogueDuckingDb: -10,
})
const envelope = measured.duckEnvelopeMeasurements[0]
assert.ok(envelope)
assert.equal(envelope.attackRampPresent, true)
assert.equal(envelope.releaseRampPresent, true)
assert.equal(envelope.mode, 'range_envelope')
assert.equal(envelope.returnedToBaseline, true)
assert.equal(envelope.attackSampleCount, 1_333)
assert.equal(envelope.releaseSampleCount, 1_333)
assert.ok(Math.abs(envelope.effectiveAttackSeconds - attackSeconds) < 1 / 8_000)
assert.ok(Math.abs(envelope.effectiveReleaseSeconds - releaseSeconds) < 1 / 8_000)
assert.ok(envelope.attackEarlyRmsDbfs > envelope.attackLateRmsDbfs)
assert.ok(envelope.releaseEarlyRmsDbfs < envelope.releaseLateRmsDbfs)
assert.ok(envelope.holdRmsDbfs < envelope.attackEarlyRmsDbfs)
assert.ok(Math.abs(envelope.measuredHoldAttenuationDb - -10) <= 1)
assert.ok(Math.abs(envelope.measuredPostReleaseDeltaDb) <= 2)
assert.ok(Math.abs(envelope.postReleaseBaselineRmsDbfs - envelope.preAttackBaselineRmsDbfs) <= 2)
assert.ok(result.soundSupportReceipts[0]!.mixQaRefs.some((key) => key.includes('measured_duck_envelope')))
const canonicalDuckOperationReceipt = result.soundSupportReceipts[0]!.appliedOperationReceipts.find((operation) =>
  operation.operation === 'dialogue_ducking')
assert.ok(canonicalDuckOperationReceipt)
const canonicalDuckEvidence = canonicalDuckOperationReceipt.appliedExecutionEvidence as {
  evidenceType: string
  mode: string
  requestedAttenuationDb: number
  requestedAttackFrames: number
  requestedReleaseFrames: number
  protectedSpeechRanges: unknown[]
  appliedEnvelopeSegments: unknown[]
  measuredRampEvidence: Array<{ returnedToBaseline: boolean }>
}
assert.equal(canonicalDuckEvidence.evidenceType, 'sound.dialogue_ducking_execution.v2')
assert.equal(canonicalDuckEvidence.mode, 'range_envelope')
assert.equal(canonicalDuckEvidence.requestedAttenuationDb, -10)
assert.equal(canonicalDuckEvidence.requestedAttackFrames, 4)
assert.equal(canonicalDuckEvidence.requestedReleaseFrames, 4)
assert.equal(canonicalDuckEvidence.protectedSpeechRanges.length, 1)
assert.equal(canonicalDuckEvidence.appliedEnvelopeSegments.length, 1)
assert.equal(canonicalDuckEvidence.measuredRampEvidence[0]?.returnedToBaseline, true)
assert.equal(canonicalDuckOperationReceipt.appliedExecutionEvidenceHash,
  hashMusicValue(canonicalDuckOperationReceipt.appliedExecutionEvidence))

const adapter = new CanonicalSoundV4MusicSupportAdapter(runtime.sound)
const operationParameters = {
  sourceStartFrame: 0, sourceEndFrameExclusive: 192, targetDurationFrames: 192,
  fadeInFrames: 4, fadeOutFrames: 4, gainDb: -18,
  gainEnvelope: [{ frame: 0, gainDb: -18 }, { frame: 192, gainDb: -18 }],
  dialogueDuckingDb: -10, duckAttackFrames: 4, duckReleaseFrames: 4,
  eqProfile: 'speech_safe' as const, dynamicsProfile: 'gentle_compression' as const, pan: 0,
  distance: 'distant' as const, roomMatch: 'dry' as const, headroomDb: 8,
  targetLoudnessLufs: -20, maximumTruePeakDbtp: -1,
  sampleRate: 48_000 as const, channelLayout: 'stereo' as const,
}
const validSupportRequest = createMusicSoundSupportRequest({
  request, cueId: cue.cueId, delegatedRange: range, selectedMusicArtifact: source,
  protectedSpeechRanges: [protectedSpeechRange],
  requiredOperations: result.soundSupportReceipts[0]!.requiredMusicOperations as MusicSoundSupportRequest['requiredOperations'],
  operationParameters,
})
const tamperedReceipt = structuredClone(result.soundSupportReceipts[0]!)
const tamperedDuck = tamperedReceipt.appliedOperationReceipts.find((operation) =>
  operation.operation === 'dialogue_ducking')!
tamperedDuck.appliedExecutionEvidence = {
  ...tamperedDuck.appliedExecutionEvidence,
  measuredRampEvidence: [],
}
tamperedDuck.appliedExecutionEvidenceHash = hashMusicValue(tamperedDuck.appliedExecutionEvidence)
const tamperedQa = await adapter.qa({
  supportRequest: validSupportRequest,
  supportResult: { receipt: tamperedReceipt, soundResultStatus: 'completed' },
})
assert.equal(tamperedQa.accepted, false)
assert.ok(tamperedQa.errors.includes('sound_dialogue_ducking_execution_evidence_incomplete'))

const invalidAttack = createMusicSoundSupportRequest({
  request, cueId: cue.cueId, delegatedRange: range, selectedMusicArtifact: source,
  protectedSpeechRanges: [protectedSpeechRange],
  requiredOperations: ['trim', 'gain', 'dialogue_ducking', 'stem_rendering', 'technical_qa'],
  operationParameters: { ...operationParameters, duckAttackFrames: 0 },
})
await assert.rejects(() => adapter.execute(invalidAttack), /nonzero attack/i)

assert.throws(() => makeCanonicalMusicRequest({
  requestId: 'music-duck-reversed-range', mode: 'planning', cues: [makeMusicCue({
    cueId: 'reversed-duck-cue', range,
    protectedSpeechRanges: [{ rangeId: 'reversed-speech', startFrame: 120, endFrameExclusive: 72 }],
  })],
}), /end must exceed start|positive duration|range/i)

console.log(JSON.stringify({
  status: 'ok', outputChecksum: processed.checksumSha256,
  requestedAttackFrames: 4, requestedReleaseFrames: 4,
  attackEarlyRmsDbfs: envelope.attackEarlyRmsDbfs,
  attackLateRmsDbfs: envelope.attackLateRmsDbfs,
  releaseEarlyRmsDbfs: envelope.releaseEarlyRmsDbfs,
  releaseLateRmsDbfs: envelope.releaseLateRmsDbfs,
  measuredAttackDeltaDb: envelope.measuredAttackDeltaDb,
  measuredReleaseDeltaDb: envelope.measuredReleaseDeltaDb,
  measuredHoldAttenuationDb: envelope.measuredHoldAttenuationDb,
  measuredPostReleaseDeltaDb: envelope.measuredPostReleaseDeltaDb,
  canonicalDuckOperationReceiptHash: canonicalDuckOperationReceipt.receiptHash,
}, null, 2))
