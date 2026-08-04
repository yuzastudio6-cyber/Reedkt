import assert from 'node:assert/strict'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights } from './canonical-music-test-fixtures'

const runtime = await createCanonicalMusicTestRuntime()
const recurringBed = await runtime.makeWav({ id: 'whole-video-recurring-bed', durationSeconds: 4, frequency: 200, volume: 0.09 })
const ranges = Array.from({ length: 4 }, (_, index) => ({
  rangeId: `whole-range-${index + 1}`, startFrame: index * 96, endFrameExclusive: (index + 1) * 96,
}))
const cues = [
  makeMusicCue({ cueId: 'whole-cue-1', range: ranges[0]!, acquisitionPreference: 'user_upload', motifRole: 'introduce' }),
  makeMusicCue({ cueId: 'whole-cue-2', range: ranges[1]!, acquisitionPreference: 'no_music', role: 'silence',
    protectedSpeechRanges: [{ rangeId: 'testimony', startFrame: 104, endFrameExclusive: 184 }] }),
  makeMusicCue({ cueId: 'whole-cue-3', range: ranges[2]!, acquisitionPreference: 'generate_original', motifRole: 'vary' }),
  makeMusicCue({ cueId: 'whole-cue-4', range: ranges[3]!, acquisitionPreference: 'user_upload', motifRole: 'return' }),
]
const request = makeCanonicalMusicRequest({ requestId: 'music-whole-video', mode: 'fixture', cues,
  assets: [recurringBed], rights: [makeMusicRights({ asset: recurringBed, source: 'user_upload' })],
  allowGeneration: true, inspectRanges: [{ rangeId: 'whole-inspect', startFrame: 0, endFrameExclusive: 384 }],
  writeRanges: ranges })
request.userMusicPolicy.customDirectives = [
  'Travel story includes Lake Como, Japan, and Paris; location alone must not choose genre or instrumentation.',
]
const result = await runtime.music.execute(request)
assert.equal(result.status, 'completed')
assert.equal(result.soundSupportReceipts.length, 3)
assert.equal(result.actualMusicMutationRanges.length, 3)
assert.ok(result.intentionalNoMusicRanges.some((range) => range.rangeId === 'whole-range-2'))
assert.ok(result.artifacts.some((artifact) => artifact.artifactType === 'music_motif_plan_v1'))
assert.ok(result.artifacts.some((artifact) => artifact.artifactType === 'music_continuity_plan_v1'))
const continuity = result.artifacts.find((artifact) => artifact.artifactType === 'music_continuity_report_v1')
assert.ok(continuity)
const report = continuity.payload as {
  cueIds: string[]; cueFamilyContinuity: string[]; silenceFindings: string[];
  speechPriorityFindings: string[]; musicSfxCollisions: string[]; recommendedLocalizedRevisions: unknown[]
}
assert.equal(report.cueIds.length, 4)
assert.deepEqual(report.cueFamilyContinuity, [
  'user_provided_music', 'no_music', 'generate_original_music', 'user_provided_music',
])
assert.ok(report.silenceFindings.some((finding) => finding.includes('whole-cue-2')))
assert.ok(report.speechPriorityFindings.some((finding) => finding.includes('whole-cue-2')))
assert.equal(report.musicSfxCollisions.length, 0)
const qa = await runtime.music.qa({ result })
assert.notEqual(qa.status, 'blocking')

const denseRuntime = await createCanonicalMusicTestRuntime()
const denseRanges = Array.from({ length: 4 }, (_, index) => ({ rangeId: `dense-${index}`, startFrame: index * 6,
  endFrameExclusive: (index + 1) * 6 }))
const denseRequest = makeCanonicalMusicRequest({ requestId: 'music-cue-density', mode: 'planning',
  cues: denseRanges.map((range, index) => makeMusicCue({ cueId: `dense-cue-${index}`, range,
    acquisitionPreference: 'no_music' })), inspectRanges: [{ rangeId: 'dense-inspect', startFrame: 0, endFrameExclusive: 24 }],
  writeRanges: denseRanges })
const densePlan = await denseRuntime.music.plan(denseRequest)
assert.ok(densePlan.cueSheet.payload.overScoringWarnings.includes('cue_change_density_exceeds_policy'))
assert.equal(densePlan.arc.payload.cueFamilyStrategy, 'chapter_score')

console.log(JSON.stringify({ status: 'ok', cueCount: report.cueIds.length,
  routeFamilies: report.cueFamilyContinuity, intentionalSilenceFindings: report.silenceFindings.length,
  protectedSpeechFindings: report.speechPriorityFindings.length,
  overScoringWarnings: densePlan.cueSheet.payload.overScoringWarnings }, null, 2))
