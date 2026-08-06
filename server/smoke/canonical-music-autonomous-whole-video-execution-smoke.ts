import assert from 'node:assert/strict'
import { hashMusicValue, type MusicEvidenceRef } from '../music/music-contracts'
import type { CanonicalMusicQaReport } from '../music/music-qa'
import { validateSoundAudioFile } from '../sound/sound-local-audio-processor'
import type { MusicContextArtifactResolver, ResolvedMusicContextEvidence } from '../music/music-context'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicRights, testHash } from './canonical-music-test-fixtures'

class AutonomousWholeVideoContext implements MusicContextArtifactResolver {
  readonly sourceArtifactId: string

  constructor(sourceArtifactId: string) { this.sourceArtifactId = sourceArtifactId }

  async resolve(reference: MusicEvidenceRef): Promise<ResolvedMusicContextEvidence> {
    const payload = {
      storyPurpose: 'Open clearly, protect testimony, then finish with purposeful montage motion.',
      audience: 'approved project audience', platform: 'platform-test',
      scenes: [
        {
          sceneId: 'scene-opening', exactRange: { rangeId: 'scene-opening-range', startFrame: 0, endFrameExclusive: 72 },
          storyFunction: 'opening' as const, currentStoryState: 'arrival', targetStoryState: 'orientation',
          importantSpeech: false, speechDensity: 0.05, naturalAmbienceValue: 'neutral' as const,
          visualPacing: 'measured' as const, visualRhythmAnchors: [0, 24, 48], emotionalPauseRanges: [],
          transitionBoundaryIds: ['boundary-opening-testimony'],
        },
        {
          sceneId: 'scene-testimony', exactRange: { rangeId: 'scene-testimony-range', startFrame: 72, endFrameExclusive: 144 },
          storyFunction: 'testimony' as const, currentStoryState: 'evidence', targetStoryState: 'understanding',
          importantSpeech: true, speechDensity: 0.9, naturalAmbienceValue: 'neutral' as const,
          visualPacing: 'still' as const, visualRhythmAnchors: [], emotionalPauseRanges: [],
          transitionBoundaryIds: ['boundary-testimony-montage'],
        },
        {
          sceneId: 'scene-montage', exactRange: { rangeId: 'scene-montage-range', startFrame: 144, endFrameExclusive: 216 },
          storyFunction: 'montage' as const, currentStoryState: 'proof assembled', targetStoryState: 'forward motion',
          importantSpeech: false, speechDensity: 0.05, naturalAmbienceValue: 'low' as const,
          visualPacing: 'active' as const, visualRhythmAnchors: [144, 168, 192], emotionalPauseRanges: [],
          transitionBoundaryIds: [],
        },
      ],
      protectedSpeechRanges: [{ rangeId: 'testimony-speech', startFrame: 72, endFrameExclusive: 144 }],
      sourceMusicArtifactIds: [this.sourceArtifactId], existingSoundPlanArtifactIds: [],
      declaredMusicDirection: ['Use restraint and make an autonomous professional per-range decision.'],
    }
    return {
      reference: structuredClone(reference), payload, payloadHash: hashMusicValue(payload),
      resolverEvidence: ['resolved_structured_whole_video_fixture', 'no_caller_authored_cues'],
    }
  }
}

const sourceArtifactId = 'autonomous-whole-video-source'
const runtime = await createCanonicalMusicTestRuntime({ context: new AutonomousWholeVideoContext(sourceArtifactId) })
const authorizedSource = await runtime.makeWav({
  id: sourceArtifactId, durationSeconds: 3, frequency: 210, volume: 0.11,
})
const request = makeCanonicalMusicRequest({
  requestId: 'music-autonomous-whole-video', mode: 'fixture', cues: [], assets: [authorizedSource],
  rights: [makeMusicRights({ asset: authorizedSource, source: 'source_media' })],
  allowGeneration: true,
  writeRanges: [{ rangeId: 'whole-video-write', startFrame: 0, endFrameExclusive: 216 }],
  inspectRanges: [{ rangeId: 'whole-video-inspect', startFrame: 0, endFrameExclusive: 216 }],
  maximumCueCount: 4, maximumCueChangesPerMinute: 20,
  musicAssetDescriptors: [{
    assetId: authorizedSource.artifactId, assetVersion: authorizedSource.version,
    assetHash: authorizedSource.checksumSha256, sourceType: 'source_media', availability: 'available',
    descriptiveEvidenceLevel: 'structured', narrativeFunctions: ['establish_tone'],
    energyProfile: 'low', structuralTags: ['clean_intro', 'clean_ending'],
    declaredVocalPolicy: 'instrumental', estimatedCredits: 0,
    evidenceRefs: [{ evidenceId: 'descriptor-autonomous-source', evidenceType: 'music_asset_descriptor', version: 1,
      evidenceHash: testHash('descriptor-autonomous-source'), evidenceLevel: 'structured' }],
  }],
})
assert.equal(request.cueConstraints.requestedCues.length, 0)
assert.equal(request.proposedCues.length, 0)

const result = await runtime.music.execute(request)
assert.equal(result.status, 'completed', JSON.stringify(result.unitReceipts.filter((item) => item.status !== 'completed')))
assert.equal(result.cueGroupingPlan?.maximumCueCountCalculation.satisfied, true)
assert.equal(result.cueGroupingPlan?.maximumCueChangesPerMinuteCalculation.satisfied, true)
assert.equal(result.cueGroupingPlan?.groups.length, 3)
assert.ok(result.segmentationPlan)
assert.equal(result.segmentationPlan?.coverageStatus, 'exact')
assert.equal(result.segmentationPlan?.segments[0]?.exactRange.startFrame, 0)
assert.equal(result.segmentationPlan?.segments.at(-1)?.exactRange.endFrameExclusive, 216)
assert.ok(result.segmentationPlan?.segments.slice(1).every((segment, index) =>
  result.segmentationPlan!.segments[index]!.exactRange.endFrameExclusive === segment.exactRange.startFrame))
const acquisitionArtifact = result.artifacts.find((artifact) => artifact.artifactType === 'music_acquisition_plan_v2')
assert.ok(acquisitionArtifact)
const bindings = acquisitionArtifact.payload as Array<{ cueId: string; acquisitionDecision: string; routeKey: string }>
assert.deepEqual(bindings.map((binding) => binding.acquisitionDecision), [
  'preserve_source_music', 'no_music', 'generate_original_music',
])
assert.equal(new Set(bindings.map((binding) => binding.routeKey)).size, 3)
assert.ok(result.providerAttemptRefs.length >= 1)
assert.equal(new Set(result.providerAttemptRefs).size, result.providerAttemptRefs.length)
assert.equal(result.soundSupportReceipts.length, 2)
assert.ok(result.selectedMusicAssetRefs.some((asset) => asset.artifactId === authorizedSource.artifactId))
assert.ok(result.selectedMusicAssetRefs.some((asset) => asset.artifactId !== authorizedSource.artifactId))
assert.equal(result.intentionalNoMusicRanges.length, 1)
assert.equal(result.intentionalNoMusicRanges[0]!.startFrame, 72)
assert.equal(result.intentionalNoMusicRanges[0]!.endFrameExclusive, 144)
assert.equal(result.actualMusicMutationRanges.length, 2)
assert.ok(result.actualMusicMutationRanges.every((range) => range.startFrame >= 0 && range.endFrameExclusive <= 216))
assert.ok(result.actualMusicMutationRanges.slice(1).every((range, index) =>
  result.actualMusicMutationRanges[index]!.endFrameExclusive <= range.startFrame))
assert.ok(result.actualMusicMutationRanges.every((range) => result.intentionalNoMusicRanges.every((silent) =>
  range.endFrameExclusive <= silent.startFrame || range.startFrame >= silent.endFrameExclusive)))
assert.deepEqual(result.actualMusicMutationRanges.map((range) => [range.startFrame, range.endFrameExclusive]),
  result.soundSupportReceipts.flatMap((receipt) => receipt.mutationRanges)
    .map((range) => [range.startFrame, range.endFrameExclusive]))
const qaArtifact = result.artifacts.find((artifact) => artifact.artifactType === 'music_qa_report_v2')
assert.ok(qaArtifact)
const qa = qaArtifact.payload as CanonicalMusicQaReport
assert.notEqual(qa.status, 'blocking', JSON.stringify(qa, null, 2))
assert.equal(qa.segmentation.exactPlannedCoverage, true)
assert.equal(qa.segmentation.exactExecutionCoverage, true)
assert.deepEqual(qa.segmentation.gapSegmentIds, [])
assert.deepEqual(qa.segmentation.illegalOverlapFindings, [])
assert.equal(qa.segmentation.plannedSegmentIds.length, qa.segmentation.resolvedSegmentIds.length)
assert.equal(qa.findings.some((finding) => finding.status === 'blocking'), false)
assert.ok(result.candidateAnalysisRefs.length >= result.selectedMusicAssetRefs.length)
for (const artifact of [...result.selectedMusicAssetRefs, ...result.processedMusicAssetRefs,
  ...result.musicStemAssetRefs]) {
  assert.equal(artifact.private, true)
  assert.match(artifact.checksumSha256, /^[a-f0-9]{64}$/u)
  assert.match(artifact.contentType, /^audio\//u)
  assert.ok(!artifact.storageObjectId.startsWith('mock://'))
  const resolvedArtifact = await runtime.resolver.resolve(artifact)
  const decoded = await validateSoundAudioFile(resolvedArtifact.absolutePath)
  assert.ok(decoded.decodedSampleCount > 0)
}
assert.ok(result.soundSupportReceipts.every((receipt) =>
  receipt.processedMusicAssets.length > 0 && receipt.musicStemAssets.length > 0 &&
  receipt.technicalQaRefs.length > 0 && receipt.mixQaRefs.length > 0))
assert.ok(result.finalCompositionHandoff)
assert.equal(result.finalCompositionHandoff?.selectedMusicAssets.length, 2)
assert.equal(result.callerReceipt.finalRenderOutsideMusic, true)

console.log(JSON.stringify({
  status: 'ok', callerAuthoredCueCount: 0,
  groupingCount: result.cueGroupingPlan?.groups.length,
  acquisitionDecisions: bindings.map((binding) => binding.acquisitionDecision),
  selectedAssetHashes: result.selectedMusicAssetRefs.map((asset) => asset.checksumSha256),
  processedAssetHashes: result.processedMusicAssetRefs.map((asset) => asset.checksumSha256),
  providerAttemptCount: result.providerAttemptRefs.length,
  soundReceiptCount: result.soundSupportReceipts.length,
  exactPlannedCoverage: qa.segmentation.exactPlannedCoverage,
  exactExecutionCoverage: qa.segmentation.exactExecutionCoverage,
  candidateAnalysisCount: result.candidateAnalysisRefs.length,
  intentionalNoMusicRanges: result.intentionalNoMusicRanges,
}, null, 2))
