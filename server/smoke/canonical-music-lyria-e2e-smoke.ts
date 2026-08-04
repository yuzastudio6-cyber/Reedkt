import assert from 'node:assert/strict'
import { LYRIA_3_PROVIDER_PROFILE } from '../music/lyria-provider'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue } from './canonical-music-test-fixtures'
import { makeMusicRights } from './canonical-music-test-fixtures'

const runtime = await createCanonicalMusicTestRuntime()
const range = { rangeId: 'generated-range', startFrame: 0, endFrameExclusive: 96 }
const cue = makeMusicCue({ cueId: 'generated-cue', range, acquisitionPreference: 'generate_original' })
const request = makeCanonicalMusicRequest({
  requestId: 'music-lyria-e2e', mode: 'fixture', cues: [cue], allowGeneration: true,
})
const result = await runtime.music.execute(request)

assert.equal(result.status, 'completed')
assert.equal(result.providerAttemptRefs.length, 1)
assert.equal(result.candidateArtifactRefs.length, 3)
assert.equal(result.candidateAnalysisRefs.length, 3)
assert.equal(result.selectionDecisionRefs.length, 1)
assert.equal(result.selectedMusicAssetRefs.length, 1)
assert.equal(result.selectedMusicAssetRefs[0]?.artifactId, 'music-candidate-music-lyria-e2e-generated-cue-2')
assert.ok(result.processedMusicAssetRefs.length > 0)
assert.ok(result.soundSupportReceipts.length > 0)
assert.equal(result.costEvidence.actualMusicCredits, 2.4)
assert.ok(result.artifacts.some((artifact) => artifact.artifactType === 'music_composition_brief_v1'))
assert.ok(result.artifacts.filter((artifact) => artifact.artifactType === 'music_candidate_analysis_v1').length === 3)
assert.equal(result.qualificationStatusUsed, 'planning_qualified')
assert.equal(LYRIA_3_PROVIDER_PROFILE.requestStore, false)
assert.equal(LYRIA_3_PROVIDER_PROFILE.liveQualification, 'blocked_pending_external_evidence')
assert.equal(result.finalCompositionHandoff?.selectedMusicAssets.length, 1)

const variationRuntime = await createCanonicalMusicTestRuntime()
const original = await variationRuntime.makeWav({ id: 'variation-original', durationSeconds: 4, frequency: 215, volume: 0.1 })
const variationCue = makeMusicCue({ cueId: 'variation-cue', range, acquisitionPreference: 'generate_original' })
const variationRequest = makeCanonicalMusicRequest({
  requestId: 'music-lyria-variation', mode: 'fixture', jobType: 'generate_music_variation',
  cues: [variationCue], assets: [original], rights: [makeMusicRights({ asset: original, source: 'project_library' })],
  allowGeneration: true,
})
const variationResult = await variationRuntime.music.execute(variationRequest)
assert.equal(variationResult.status, 'completed')
assert.equal(variationResult.providerAttemptRefs.length, 1)
assert.ok(variationResult.artifacts.some((artifact) => artifact.artifactType === 'music_composition_brief_v1' &&
  (artifact.payload as { sourceEvidenceRefs: string[] }).sourceEvidenceRefs.includes(original.checksumSha256)))

console.log(JSON.stringify({
  status: 'ok', providerProfile: LYRIA_3_PROVIDER_PROFILE.profileKey,
  providerModel: LYRIA_3_PROVIDER_PROFILE.modelId,
  candidatesProcessed: result.candidateAnalysisRefs.length,
  selectedCandidate: result.selectedMusicAssetRefs[0]?.artifactId,
  variationStatus: variationResult.status,
  liveQualification: LYRIA_3_PROVIDER_PROFILE.liveQualification,
}, null, 2))
