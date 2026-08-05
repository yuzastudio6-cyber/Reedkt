import assert from 'node:assert/strict'
import { StandaloneCanonicalMusicSkillService } from '../edit-skills/music/canonical-music-skill-service'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest } from './canonical-music-test-fixtures'

const range = { rangeId: 'autonomous-range', startFrame: 0, endFrameExclusive: 240 }
const runtime = await createCanonicalMusicTestRuntime()
const request = makeCanonicalMusicRequest({
  requestId: 'music-autonomous-context', mode: 'fixture', cues: [], writeRanges: [range],
  inspectRanges: [range], allowGeneration: true, jobType: 'full_video_music_pass',
})
request.userMusicPolicy.customDirectives.push(
  'The footage visits Lake Como, Paris, and Japan; location must not become genre authority.',
)

const plan = await runtime.music.plan(request)
assert.equal(plan.resolvedContext.resolutionStatus, 'resolved')
assert.equal(plan.cueSheet.payload.lockedCueIds.length, 0)
assert.equal(plan.cueSheet.payload.cues.length, 1)
assert.equal(plan.cueSheet.payload.cues[0]?.acquisitionPreference, 'generate_original')
assert.ok(plan.cueSheet.payload.generatedCueIds.includes(plan.cueSheet.payload.cues[0]!.cueId))
assert.deepEqual(plan.cueSheet.payload.cues[0]?.instrumentation, ['tonal bed', 'measured rhythmic texture'])
assert.doesNotMatch(plan.cueSheet.payload.cues[0]?.instrumentation.join(' ') ?? '', /French|Italian|Japanese|tropical/iu)
assert.ok(plan.estimate.categories.providerGeneration > 0)
assert.equal(plan.estimate.reservationRequired, true)

const result = await runtime.music.execute(request)
assert.equal(result.status, 'completed')
assert.equal(result.soundSupportReceipts.length, 1)
assert.ok(result.finalCompositionHandoff?.selectedMusicAssets.length)

const unresolved = new StandaloneCanonicalMusicSkillService({ artifacts: runtime.resolver })
await assert.rejects(() => unresolved.execute({ ...request, idempotencyKey: 'music-unresolved-autonomous-context' }),
  /requires resolved, hash-verified story and scene context/i)

console.log(JSON.stringify({
  status: 'ok', contextPackageHash: plan.resolvedContext.packageHash,
  generatedCueIds: plan.cueSheet.payload.generatedCueIds,
  locationKeywordAuthorityRetired: true, unresolvedAutonomyFailedClosed: true,
}, null, 2))
