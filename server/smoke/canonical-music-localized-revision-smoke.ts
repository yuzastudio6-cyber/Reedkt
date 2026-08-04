import assert from 'node:assert/strict'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights } from './canonical-music-test-fixtures'

const runtime = await createCanonicalMusicTestRuntime()
const source = await runtime.makeWav({ id: 'revision-source', durationSeconds: 4, frequency: 230, volume: 0.1 })
const rangeOne = { rangeId: 'revision-range-1', startFrame: 0, endFrameExclusive: 96 }
const rangeTwo = { rangeId: 'revision-range-2', startFrame: 96, endFrameExclusive: 192 }
const cueOne = makeMusicCue({ cueId: 'revision-cue-1', range: rangeOne, acquisitionPreference: 'user_upload', motifRole: 'introduce' })
const cueTwo = makeMusicCue({ cueId: 'revision-cue-2', range: rangeTwo, acquisitionPreference: 'user_upload', motifRole: 'return' })
const request = makeCanonicalMusicRequest({
  requestId: 'music-localized-revision', mode: 'private_internal', cues: [cueOne, cueTwo],
  assets: [source], rights: [makeMusicRights({ asset: source, source: 'user_upload' })],
})
const previous = await runtime.music.execute(request)
assert.equal(previous.status, 'completed')
assert.equal(previous.soundSupportReceipts.length, 2)
const preservedArtifactHashes = previous.artifacts.filter((artifact) => artifact.cueId === cueOne.cueId)
  .map((artifact) => artifact.artifactHash)
const preservedSoundHash = previous.soundSupportReceipts.find((receipt) => receipt.cueId === cueOne.cueId)!.soundResultHash
const affectedSoundHash = previous.soundSupportReceipts.find((receipt) => receipt.cueId === cueTwo.cueId)!.soundResultHash

const revisedRequest = structuredClone(request)
revisedRequest.proposedCues[1]!.instrumentation = ['restrained piano', 'subtle pulse']
const revisionPlan = await runtime.music.planRevision({ request: revisedRequest, previousResult: previous,
  invalidatedRanges: [rangeTwo], reason: 'Approved cue-two instrumentation revision.' })
assert.deepEqual(revisionPlan.preservedCueIds, [cueOne.cueId])
assert.deepEqual(revisionPlan.replacementCueIds, [cueTwo.cueId])
assert.ok(revisionPlan.neighboringContinuityCueIds.includes(cueOne.cueId))

const revised = await runtime.music.executeRevision({
  request: revisedRequest, previousResult: previous, invalidatedRanges: [rangeTwo],
  reason: 'Approved cue-two instrumentation revision.',
  approvedRevisionSnapshotId: revisedRequest.approvedSnapshotRef.snapshotId,
  approvedRevisionSnapshotHash: revisedRequest.approvedSnapshotRef.snapshotHash,
  revisionIdempotencyKey: 'music-idempotency-localized-revision-2',
})
assert.equal(revised.status, 'completed')
assert.ok(preservedArtifactHashes.every((hash) => revised.artifacts.some((artifact) => artifact.artifactHash === hash)))
assert.equal(revised.soundSupportReceipts.find((receipt) => receipt.cueId === cueOne.cueId)?.soundResultHash, preservedSoundHash)
assert.notEqual(revised.soundSupportReceipts.find((receipt) => receipt.cueId === cueTwo.cueId)?.soundResultHash, affectedSoundHash)
assert.equal(revised.soundSupportReceipts.length, 2)
assert.equal(revised.actualMusicMutationRanges.length, 2)
assert.ok(revised.revisionEvidenceRef)
assert.ok(revised.artifacts.some((artifact) => artifact.artifactType === 'music_revision_receipt_v1'))
assert.ok(revised.finalCompositionHandoff)
assert.equal(revised.finalCompositionHandoff?.placementManifestRefs.length, 2)
assert.equal(new Set(revised.artifacts.map((artifact) => `${artifact.artifactId}:${artifact.artifactHash}`)).size,
  revised.artifacts.length)

console.log(JSON.stringify({
  status: 'ok', preservedCueCount: revisionPlan.preservedCueIds.length,
  replacedCueCount: revisionPlan.replacementCueIds.length,
  preservedSoundUnchanged: true, affectedSoundRerun: true,
  finalPlacementCount: revised.finalCompositionHandoff?.placementManifestRefs.length,
}, null, 2))
