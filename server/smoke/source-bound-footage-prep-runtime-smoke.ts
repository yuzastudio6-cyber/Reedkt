import assert from 'node:assert/strict'
import {
  createSourceBoundFootagePrepInputFingerprint,
  runSourceBoundFootagePrep,
  type MockFootagePrepInput,
} from '../../src/lib/footage-prep'

const input: MockFootagePrepInput = {
  projectId: 'source-bound-prep-smoke',
  workspaceId: 'workspace-source-bound-prep',
  userId: 'user-source-bound-prep',
  sourceMedia: [
    {
      mediaAssetId: 'source-video-a',
      label: '1. source-a.mp4',
      mediaKind: 'video',
      durationMs: 3_000,
      width: 1920,
      height: 1080,
      hasAudio: true,
      sourceMetadataAuthority: 'verified_private_upload_probe',
    },
    {
      mediaAssetId: 'source-video-b',
      label: '2. source-b.mp4',
      mediaKind: 'video',
      durationMs: 5_000,
      width: 1080,
      height: 1920,
      hasAudio: false,
      sourceMetadataAuthority: 'verified_private_upload_probe',
    },
    {
      mediaAssetId: 'support-image',
      label: '3. evidence.png',
      mediaKind: 'image',
      durationMs: 0,
      width: 1200,
      height: 800,
      hasAudio: false,
    },
  ],
}

const result = runSourceBoundFootagePrep(input)
const inputFingerprint = createSourceBoundFootagePrepInputFingerprint(input)

assert.equal(result.cleanAssembly.durationMs, 8_000)
assert.equal(createSourceBoundFootagePrepInputFingerprint(structuredClone(input)), inputFingerprint)
assert.notEqual(createSourceBoundFootagePrepInputFingerprint({
  ...input,
  sourceMedia: input.sourceMedia.map((source, index) => index === 0
    ? { ...source, durationMs: source.durationMs + 1 }
    : source),
}), inputFingerprint)
assert.notEqual(createSourceBoundFootagePrepInputFingerprint({
  ...input,
  sourceMedia: [input.sourceMedia[1]!, input.sourceMedia[0]!, input.sourceMedia[2]!],
}), inputFingerprint)
assert.equal(result.cleanupPlan.estimatedOriginalDurationMs, 8_000)
assert.equal(result.cleanupPlan.estimatedCleanDurationMs, 8_000)
assert.equal(result.cleanAssemblySegments.length, 2)
assert.deepEqual(
  result.cleanAssemblySegments.map((segment) => ({
    mediaAssetId: segment.mediaAssetId,
    rawSourceRange: segment.rawSourceRange,
    cleanAssemblyRange: segment.cleanAssemblyRange,
  })),
  [
    {
      mediaAssetId: 'source-video-a',
      rawSourceRange: { startMs: 0, endMs: 3_000 },
      cleanAssemblyRange: { startMs: 0, endMs: 3_000 },
    },
    {
      mediaAssetId: 'source-video-b',
      rawSourceRange: { startMs: 0, endMs: 5_000 },
      cleanAssemblyRange: { startMs: 3_000, endMs: 8_000 },
    },
  ],
)
assert.equal(result.transcriptSegments.length, 0)
assert.equal(result.sceneSegments.length, 0)
assert.equal(result.silenceRegions.length, 0)
assert.equal(result.retakeGroups.length, 0)
assert.equal(result.sourceQualityFlags.length, 0)
assert.equal(result.cleanupPlanItems.length, 0)
assert.equal(result.cleanupReviewCard.removedSilenceCount, 0)
assert.equal(result.cleanupReviewCard.retakeGroupCount, 0)
assert.equal(result.cleanupReviewCard.falseStartCount, 0)
assert.match(result.sourceUnderstandingMap.summary, /Deeper content understanding remains pending/)
assert.ok(result.activityEvents.every((event) => !/Transcribing|Transcript ready|Scenes detected|Best takes selected/i.test(event.title)))
assert.match(
  result.activityEvents.at(-1)?.message ?? '',
  /No transcript, scene, silence, retake, or cleanup analysis was invented/,
)

assert.throws(
  () => runSourceBoundFootagePrep({
    ...input,
    sourceMedia: [{
      ...input.sourceMedia[0],
      sourceMetadataAuthority: undefined,
    }],
  }),
  /verified positive media duration/,
)

assert.throws(
  () => runSourceBoundFootagePrep({
    ...input,
    sourceMedia: [{
      ...input.sourceMedia[0],
      mockScenario: 'messy_talking_head',
    }],
  }),
  /cannot consume a controlled demo scenario/,
)

console.log(JSON.stringify({
  smoke: 'source_bound_footage_prep_runtime',
  status: 'passed',
  sourceCount: input.sourceMedia.length,
  timelineSourceCount: result.cleanAssemblySegments.length,
  exactDurationMs: result.cleanAssembly.durationMs,
  recoveryInputFingerprintBound: true,
  fabricatedTranscriptCount: result.transcriptSegments.length,
  fabricatedCleanupDecisionCount: result.cleanupPlanItems.length,
}))
