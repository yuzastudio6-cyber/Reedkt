import assert from 'node:assert/strict'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights } from './canonical-music-test-fixtures'

const runtime = await createCanonicalMusicTestRuntime()
const source = await runtime.makeWav({ id: 'user-uploaded-track', durationSeconds: 4, frequency: 220, volume: 0.12 })
const range = { rangeId: 'music-range-1', startFrame: 0, endFrameExclusive: 96 }
const cue = makeMusicCue({ cueId: 'music-cue-1', range, acquisitionPreference: 'user_upload' })
const request = makeCanonicalMusicRequest({
  requestId: 'music-source-sound-e2e', mode: 'private_internal', cues: [cue], assets: [source],
  rights: [makeMusicRights({ asset: source, source: 'user_upload' })], allowGeneration: false,
})

const result = await runtime.music.execute(request)
assert.equal(result.status, 'completed', JSON.stringify(result.unitReceipts.filter((item) => item.status !== 'completed')))
assert.equal(result.selectedMusicAssetRefs.length, 1)
assert.ok(result.processedMusicAssetRefs.length >= 1)
assert.ok(result.musicStemAssetRefs.length >= 1)
assert.equal(result.soundSupportReceipts.length, 1)
assert.match(result.soundSupportReceipts[0]!.soundPublicRequestHash, /^[a-f0-9]{64}$/u)
assert.match(result.soundSupportReceipts[0]!.exactOperationParametersHash, /^[a-f0-9]{64}$/u)
assert.deepEqual(result.soundSupportReceipts[0]!.delegatedRange, range)
assert.ok(result.soundSupportReceipts[0]!.mutationRanges.every((mutation) =>
  mutation.startFrame >= range.startFrame && mutation.endFrameExclusive <= range.endFrameExclusive))
assert.ok(result.soundSupportReceipts[0]!.technicalQaRefs.length > 0)
assert.ok(result.unitReceipts.every((receipt) => receipt.status === 'completed'))
assert.ok(result.unitReceipts.every((receipt) => receipt.stepReceipts.length === 1))
assert.ok(result.unitReceipts.flatMap((receipt) => receipt.stepReceipts).every((step) =>
  step.status === 'completed' && step.handlerIdentity.length > 0 && step.receiptHash.length === 64))
assert.ok(result.unitReceipts.every((receipt) => receipt.elapsedMilliseconds >= 0))
assert.ok(result.finalCompositionHandoff)
assert.equal(result.finalCompositionHandoff?.selectedMusicAssets[0]?.artifactId, source.artifactId)
assert.equal(result.callerReceipt.finalRenderOutsideMusic, true)
assert.equal(result.callerReceipt.musicDidNotOwnSoundTools, true)
assert.equal(result.actualMusicMutationRanges.length > 0, true)
assert.equal(result.costEvidence.totalActualCredits,
  result.costEvidence.actualMusicCredits + result.costEvidence.nestedSoundCredits)
assert.equal(result.costEvidence.serviceFeeIncluded, false)
assert.equal(result.costEvidence.walletMutationExecuted, false)
assert.match(result.costEvidence.rateCardHash, /^[a-f0-9]{64}$/u)
assert.match(result.executionFingerprint, /^[a-f0-9]{64}$/u)

const qa = await runtime.music.qa({ result })
assert.notEqual(qa.status, 'blocking')
const qaReport = qa.qaArtifact?.payload as { findings?: Array<{ code: string; status: string }>; segmentation?: {
  exactExecutionCoverage: boolean; soundOutputFindings: string[]
} } | undefined
assert.equal(qaReport?.segmentation?.exactExecutionCoverage, true)
assert.equal(qaReport?.segmentation?.soundOutputFindings.length, 1)
assert.equal(qaReport?.findings?.find((finding) =>
  finding.code === `technical.sound_output.${cue.cueId}`)?.status, 'pass')
assert.equal(qaReport?.findings?.find((finding) =>
  finding.code === `integration.sound_receipt.${cue.cueId}`)?.status, 'pass')

const replay = await runtime.music.execute(request)
assert.deepEqual(replay, result)
const collision = structuredClone(request)
collision.userMusicPolicy.customDirectives.push('materially changed input under reused key')
await assert.rejects(() => runtime.music.execute(collision), /idempotency collision/i)

console.log(JSON.stringify({
  status: 'ok', resultStatus: result.status, selectedAssets: result.selectedMusicAssetRefs.length,
  processedAssets: result.processedMusicAssetRefs.length, soundReceipts: result.soundSupportReceipts.length,
  mutationRanges: result.actualMusicMutationRanges.length, qaStatus: qa.status,
}, null, 2))
