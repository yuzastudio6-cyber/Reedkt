import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chmod, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { MusicArtifactRef, MusicRightsBinding } from '../music/music-contracts'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights, testHash } from './canonical-music-test-fixtures'

async function executeAuthorizedSource(sourceType: MusicRightsBinding['source'], preference:
  'preserve_source' | 'user_upload' | 'project_library' | 'workspace_library' | 'internal_library') {
  const runtime = await createCanonicalMusicTestRuntime()
  const asset = await runtime.makeWav({ id: `${sourceType}-asset`, durationSeconds: 4, frequency: 190, volume: 0.1 })
  const range = { rangeId: `${sourceType}-range`, startFrame: 0, endFrameExclusive: 96 }
  const cue = makeMusicCue({ cueId: `${sourceType}-cue`, range, acquisitionPreference: preference })
  const request = makeCanonicalMusicRequest({ requestId: `music-${sourceType}`, mode: 'private_internal', cues: [cue],
    assets: [asset], rights: [makeMusicRights({ asset, source: sourceType })] })
  const result = await runtime.music.execute(request)
  assert.equal(result.status, 'completed')
  assert.equal(result.selectedMusicAssetRefs[0]?.artifactId, asset.artifactId)
  assert.ok(result.provenanceRefs.includes(`rights-${asset.artifactId}`))
  return { runtime, asset, result }
}

const sourceResults = await Promise.all([
  executeAuthorizedSource('source_media', 'preserve_source'),
  executeAuthorizedSource('user_upload', 'user_upload'),
  executeAuthorizedSource('project_library', 'project_library'),
  executeAuthorizedSource('workspace_library', 'workspace_library'),
  executeAuthorizedSource('internal_library', 'internal_library'),
])
assert.equal(sourceResults.length, 5)

const noMusicRuntime = await createCanonicalMusicTestRuntime()
const silenceRange = { rangeId: 'silence-range', startFrame: 0, endFrameExclusive: 120 }
const silenceCue = makeMusicCue({ cueId: 'silence-cue', range: silenceRange, role: 'silence', acquisitionPreference: 'no_music' })
const noMusic = await noMusicRuntime.music.execute(makeCanonicalMusicRequest({
  requestId: 'music-intentional-silence', mode: 'private_internal', cues: [silenceCue], allowGeneration: false,
}))
assert.equal(noMusic.status, 'no_music')
assert.equal(noMusic.selectedMusicAssetRefs.length, 0)
assert.equal(noMusic.finalCompositionHandoff?.intentionalNoMusic, true)
assert.ok(noMusic.artifacts.some((artifact) => artifact.artifactType === 'intentional_silence_decision_v1'))
assert.ok(noMusic.artifacts.some((artifact) => artifact.artifactType === 'intentional_no_music_handoff_v1'))

const ambienceRuntime = await createCanonicalMusicTestRuntime()
const ambienceRange = { rangeId: 'ambience-range', startFrame: 0, endFrameExclusive: 120 }
const ambienceCue = makeMusicCue({ cueId: 'ambience-cue', range: ambienceRange, role: 'ambience_only', acquisitionPreference: 'ambience_only' })
const ambience = await ambienceRuntime.music.execute(makeCanonicalMusicRequest({
  requestId: 'music-ambience-only', mode: 'private_internal', cues: [ambienceCue], allowGeneration: false,
}))
assert.equal(ambience.status, 'ambience_only')
assert.equal(ambience.finalCompositionHandoff?.ambienceOnly, true)
const ambienceHandoff = ambience.artifacts.find((artifact) => artifact.artifactType === 'music_ambience_only_handoff_v1')
assert.ok(ambienceHandoff)
assert.equal((ambienceHandoff.payload as { soundSupportRequirement: { musicMayGenerateAmbience: boolean } })
  .soundSupportRequirement.musicMayGenerateAmbience, false)

const syncOnlyRuntime = await createCanonicalMusicTestRuntime()
const syncOnlyAsset = await syncOnlyRuntime.makeWav({ id: 'approved-sync-only', durationSeconds: 4, frequency: 205, volume: 0.1 })
const syncRange = { rangeId: 'sync-only-range', startFrame: 0, endFrameExclusive: 96 }
const syncCue = makeMusicCue({ cueId: 'sync-only-cue', range: syncRange, acquisitionPreference: 'preserve_source' })
syncCue.soundProcessingIntent = []
const syncOnly = await syncOnlyRuntime.music.execute(makeCanonicalMusicRequest({
  requestId: 'music-sync-only', mode: 'private_internal', cues: [syncCue], assets: [syncOnlyAsset],
  rights: [makeMusicRights({ asset: syncOnlyAsset, source: 'source_media' })],
}))
assert.equal(syncOnly.status, 'completed')
assert.equal(syncOnly.actualMusicMutationRanges.length, 0)
assert.equal(syncOnly.soundSupportReceipts.length, 0)
assert.equal(syncOnly.selectedMusicAssetRefs[0]?.artifactId, syncOnlyAsset.artifactId)
assert.notEqual((await syncOnlyRuntime.music.qa({ result: syncOnly })).status, 'blocking')

const referenceRuntime = await createCanonicalMusicTestRuntime()
const reference = await referenceRuntime.makeWav({ id: 'authorized-reference', durationSeconds: 4, frequency: 330, volume: 0.09 })
const referenceRange = { rangeId: 'reference-range', startFrame: 0, endFrameExclusive: 96 }
const referenceCue = makeMusicCue({ cueId: 'reference-cue', range: referenceRange, acquisitionPreference: 'user_upload' })
referenceCue.soundProcessingIntent = []
const referenceRequest = makeCanonicalMusicRequest({ requestId: 'music-reference-dna', mode: 'private_internal',
  jobType: 'create_music_reference_dna', cues: [referenceCue], assets: [reference],
  rights: [makeMusicRights({ asset: reference, source: 'user_upload' })] })
referenceRequest.referenceMusicRefs = [reference]
const referenceResult = await referenceRuntime.music.execute(referenceRequest)
const dna = referenceResult.artifacts.find((artifact) => artifact.artifactType === 'music_reference_dna_v1')
assert.ok(dna)
assert.equal((dna.payload as { automaticCopyrightClearanceClaimed: boolean }).automaticCopyrightClearanceClaimed, false)
assert.ok((dna.payload as { doNotCopyRules: string[] }).doNotCopyRules.includes('no_artist_imitation'))

const peerRuntime = await createCanonicalMusicTestRuntime()
const peerRange = { rangeId: 'peer-range', startFrame: 100, endFrameExclusive: 196 }
const peerCue = makeMusicCue({ cueId: 'peer-cue', range: peerRange, acquisitionPreference: 'no_music' })
const peerRequest = makeCanonicalMusicRequest({ requestId: 'music-peer-support', mode: 'private_internal',
  jobType: 'support_motion_studio_music', assignmentMode: 'range', cues: [peerCue], caller: {
    callerType: 'motion_studio', callerSkillKey: 'motion_studio', callerSkillVersion: '1.0.0',
    callerManifestHash: testHash('motion-studio-manifest'), parentWorkItemId: 'motion-work-1',
    authorityRef: 'authority-music-peer-support', ancestorSkillKeys: [], callerOwnedRanges: [peerRange],
  } })
const peerResult = await peerRuntime.music.execute(peerRequest)
assert.equal(peerResult.status, 'no_music')
assert.equal(peerResult.callerReceipt.callerSkillKey, 'motion_studio')

const partialRuntime = await createCanonicalMusicTestRuntime()
const badPath = join(partialRuntime.root, 'inputs', 'invalid-audio.wav')
await writeFile(badPath, Buffer.from('not valid audio'), { mode: 0o600 })
await chmod(badPath, 0o600)
const badBytes = await stat(badPath)
const badArtifact: MusicArtifactRef = {
  artifactId: 'invalid-user-track', artifactType: 'approved_private_music_audio', version: 1,
  checksumSha256: createHash('sha256').update(Buffer.from('not valid audio')).digest('hex'),
  storageObjectId: 'inputs:invalid-audio.wav', private: true, contentType: 'audio/wav', byteSize: badBytes.size,
}
partialRuntime.resolver.register(badArtifact, badPath)
const badRange = { rangeId: 'partial-bad-range', startFrame: 0, endFrameExclusive: 96 }
const goodRange = { rangeId: 'partial-good-range', startFrame: 96, endFrameExclusive: 192 }
const partialRequest = makeCanonicalMusicRequest({ requestId: 'music-partial', mode: 'fixture', allowGeneration: true,
  cues: [
    makeMusicCue({ cueId: 'partial-bad', range: badRange, acquisitionPreference: 'user_upload' }),
    makeMusicCue({ cueId: 'partial-good', range: goodRange, acquisitionPreference: 'generate_original' }),
  ], assets: [badArtifact], rights: [makeMusicRights({ asset: badArtifact, source: 'user_upload' })] })
const partial = await partialRuntime.music.execute(partialRequest)
assert.equal(partial.status, 'partial')
assert.ok(partial.selectedMusicAssetRefs.some((asset) => asset.artifactId.includes('partial-good')))
assert.ok(partial.unitReceipts.some((receipt) => receipt.cueId === 'partial-bad' && receipt.status === 'failed'))
assert.ok(partial.unitReceipts.some((receipt) => receipt.status === 'blocked'))
assert.equal(partial.finalCompositionHandoff?.selectedMusicAssets.length, 1)

assert.equal(testHash('Lake Como').length, 64)
console.log(JSON.stringify({
  status: 'ok', authorizedSourceRoutes: sourceResults.length, noMusic: noMusic.status,
  ambienceOnly: ambience.status, synchronizationOnlyMutations: syncOnly.actualMusicMutationRanges.length,
  referenceDna: Boolean(dna), peerStatus: peerResult.status, partialStatus: partial.status,
}, null, 2))
