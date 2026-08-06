import assert from 'node:assert/strict'
import {
  framesToSamples,
  rationalSecondsToFrames,
  samplesToFrames,
  type TimelineRate,
} from '../edit-skills/core/timeline-rate'
import { compileMusicSync } from '../music/music-sync'
import type { MusicCandidateAnalysis } from '../music/music-contracts'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights } from './canonical-music-test-fixtures'

const rates: TimelineRate[] = [
  { numerator: 24, denominator: 1 }, { numerator: 25, denominator: 1 },
  { numerator: 30_000, denominator: 1_001 }, { numerator: 30, denominator: 1 },
  { numerator: 50, denominator: 1 }, { numerator: 60_000, denominator: 1_001 },
  { numerator: 60, denominator: 1 },
]
const evidence: Array<{ rate: string; endFrame: number; sourceSamples: number }> = []
for (const rate of rates) {
  const runtime = await createCanonicalMusicTestRuntime()
  const source = await runtime.makeWav({ id: `timing-${rate.numerator}-${rate.denominator}`, durationSeconds: 4,
    frequency: 260, volume: 0.1 })
  const endFrame = rationalSecondsToFrames({ secondsNumerator: 4, secondsDenominator: 1, rate, rounding: 'nearest_half_up' })
  const range = { rangeId: `timing-range-${rate.numerator}-${rate.denominator}`, startFrame: 0, endFrameExclusive: endFrame }
  const cue = makeMusicCue({ cueId: `timing-cue-${rate.numerator}-${rate.denominator}`, range, acquisitionPreference: 'user_upload' })
  cue.entryHandleFrames = 3
  cue.exitHandleFrames = 5
  cue.fadeInFrames = 4
  cue.fadeOutFrames = 6
  cue.syncAnchorFrames = [Math.floor(endFrame / 2)]
  cue.soundProcessingIntent = []
  const request = makeCanonicalMusicRequest({ requestId: `music-timing-${rate.numerator}-${rate.denominator}`,
    mode: 'private_internal', rate, cues: [cue], assets: [source],
    rights: [makeMusicRights({ asset: source, source: 'user_upload' })] })
  const result = await runtime.music.execute(request)
  assert.equal(result.status, 'completed')
  const placement = result.artifacts.find((artifact) => artifact.artifactType === 'music_placement_manifest_v2')
  const analysisArtifact = result.artifacts.find((artifact) => artifact.artifactType === 'music_candidate_analysis_v2')
  assert.ok(placement && analysisArtifact)
  const placementPayload = placement.payload as { targetStartFrame: number; targetEndFrameExclusive: number;
    timelineRate: TimelineRate; sourceStartSample: number; sourceEndSampleExclusive: number; residualAlignmentFrames: number }
  assert.ok(placementPayload.targetStartFrame >= 0 && placementPayload.targetStartFrame <= cue.entryHandleFrames)
  assert.equal(placementPayload.targetEndFrameExclusive, endFrame)
  assert.deepEqual(placementPayload.timelineRate, rate)
  const sourceSamples = placementPayload.sourceEndSampleExclusive - placementPayload.sourceStartSample
  const targetDurationFrames = endFrame - placementPayload.targetStartFrame
  assert.equal(samplesToFrames({ samples: sourceSamples, rate, sampleRate: 48_000, rounding: 'nearest_half_up' }), targetDurationFrames)
  const exactTargetSamples = framesToSamples({ frames: targetDurationFrames, rate, sampleRate: 48_000, rounding: 'nearest_half_up' })
  assert.ok(sourceSamples <= exactTargetSamples)
  assert.ok(exactTargetSamples - sourceSamples <= 200)
  assert.equal((result.artifacts.find((artifact) => artifact.artifactType === 'music_cue_sheet_v2')!.payload as {
    cues: Array<{ fadeInFrames: number; fadeOutFrames: number; entryHandleFrames: number; exitHandleFrames: number }>
  }).cues[0]?.fadeOutFrames, 6)
  const offBeat = compileMusicSync({ cue, analysis: analysisArtifact.payload as MusicCandidateAnalysis,
    timelineHash: request.timelineBinding.timelineManifestHash, timelineRate: rate, intent: 'intentionally_off_beat' })
  assert.equal(offBeat.placement.residualAlignmentFrames, 0)
  evidence.push({ rate: `${rate.numerator}/${rate.denominator}`, endFrame, sourceSamples })
}

const longRate = { numerator: 30_000, denominator: 1_001 }
const longFrames = rationalSecondsToFrames({ secondsNumerator: 86_400, secondsDenominator: 1,
  rate: longRate, rounding: 'nearest_half_up' })
const longSamples = framesToSamples({ frames: longFrames, rate: longRate, sampleRate: 48_000, rounding: 'nearest_half_up' })
assert.equal(samplesToFrames({ samples: longSamples, rate: longRate, sampleRate: 48_000, rounding: 'nearest_half_up' }), longFrames)

console.log(JSON.stringify({ status: 'ok', rates: evidence, longDurationFrames: longFrames,
  longDurationRoundTripFrames: samplesToFrames({ samples: longSamples, rate: longRate,
    sampleRate: 48_000, rounding: 'nearest_half_up' }) }, null, 2))
