import assert from 'node:assert/strict'
import type { MusicContextArtifactResolver, ResolvedMusicContextEvidence } from '../music/music-context'
import { hashMusicValue, type MusicEvidenceRef, type MusicFrameRange } from '../music/music-contracts'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue } from './canonical-music-test-fixtures'

const writeRanges: MusicFrameRange[] = Array.from({ length: 5 }, (_, index) => ({
  rangeId: `grouping-write-${index + 1}`,
  startFrame: index * 576,
  endFrameExclusive: (index + 1) * 576,
}))

class GroupingContextResolver implements MusicContextArtifactResolver {
  async resolve(reference: MusicEvidenceRef): Promise<ResolvedMusicContextEvidence> {
    const scenes = Array.from({ length: 20 }, (_, index) => {
      const startFrame = index * 144
      const silenceChapter = index >= 8 && index < 12
      const speech = index % 4 === 1
      return {
        sceneId: `grouping-scene-${index + 1}`,
        exactRange: { rangeId: `grouping-scene-range-${index + 1}`, startFrame, endFrameExclusive: startFrame + 144 },
        storyFunction: silenceChapter ? 'testimony' as const : index % 4 === 0 ? 'opening' as const : 'exposition' as const,
        currentStoryState: `story-state-${index + 1}`,
        targetStoryState: `story-state-${index + 2}`,
        importantSpeech: silenceChapter || speech,
        speechDensity: silenceChapter ? 0.85 : speech ? 0.45 : 0.1,
        naturalAmbienceValue: silenceChapter ? 'high' as const : 'neutral' as const,
        visualPacing: index % 2 === 0 ? 'measured' as const : 'active' as const,
        visualRhythmAnchors: [startFrame, startFrame + 36, startFrame + 72, startFrame + 108],
        emotionalPauseRanges: silenceChapter && index === 10
          ? [{ rangeId: 'grouping-emotional-pause', startFrame: startFrame + 48, endFrameExclusive: startFrame + 96 }]
          : [],
        transitionBoundaryIds: [],
      }
    })
    const protectedSpeechRanges = scenes.filter((scene) => scene.importantSpeech).map((scene, index) => ({
      rangeId: `grouping-speech-${index + 1}`,
      startFrame: scene.exactRange.startFrame + 24,
      endFrameExclusive: scene.exactRange.endFrameExclusive - 24,
    }))
    const payload = {
      storyPurpose: 'Group atomic evidence boundaries into a restrained professional soundtrack.',
      audience: 'approved project audience', platform: 'platform-test', scenes, protectedSpeechRanges,
      sourceMusicArtifactIds: [], existingSoundPlanArtifactIds: [],
      declaredMusicDirection: ['Use no more than four active Music cues and protect testimony.'],
    }
    return { reference: structuredClone(reference), payload, payloadHash: hashMusicValue(payload),
      resolverEvidence: ['deterministic_grouping_fixture_context'] }
  }
}

const runtime = await createCanonicalMusicTestRuntime({ context: new GroupingContextResolver() })
const request = makeCanonicalMusicRequest({
  requestId: 'music-cue-grouping-enforcement', mode: 'fixture', cues: [], writeRanges,
  inspectRanges: [{ rangeId: 'grouping-inspect', startFrame: 0, endFrameExclusive: 2_880 }],
  allowGeneration: true, maximumCueCount: 4, maximumCueChangesPerMinute: 2,
})
const first = await runtime.music.plan(request)
const second = await runtime.music.plan(structuredClone(request))

assert.ok(first.segmentationPlan.segments.length >= 20)
assert.ok(first.cueGroupingPlan.maximumCueCountCalculation.actualFinal >= 4 &&
  first.cueGroupingPlan.maximumCueCountCalculation.actualFinal <= 6)
assert.ok(first.cueGroupingPlan.groups.some((group) => group.memberSegmentIds.length > 1))
assert.equal(first.cueGroupingPlan.maximumCueCountCalculation.satisfied, true)
assert.equal(first.cueGroupingPlan.maximumCueChangesPerMinuteCalculation.satisfied, true)
assert.ok(first.cueGroupingPlan.maximumCueCountCalculation.actualFinal <= 4)
assert.ok(first.cueGroupingPlan.maximumCueChangesPerMinuteCalculation.actualFinal <= 2)
assert.equal(first.cuePolicyConflict, undefined)
assert.equal(first.cueGroupingPlan.groupingHash, second.cueGroupingPlan.groupingHash)
assert.deepEqual(first.cueGroupingPlan, second.cueGroupingPlan)

for (const segment of first.segmentationPlan.segments) {
  const groups = first.cueGroupingPlan.groups.filter((group) => group.memberSegmentIds.includes(segment.segmentId))
  assert.equal(groups.length, 1, `${segment.segmentId} must belong to one final cue group`)
}
for (const group of first.cueGroupingPlan.groups) {
  const memberDecisions = new Set(group.members.map((member) => member.decision))
  assert.equal(memberDecisions.size, 1)
  if (group.noMusicOrSilenceBoundary) {
    assert.ok(['no_music', 'intentional_silence', 'ambience_only'].includes(group.acquisitionFamily))
  }
}

const lockedRanges: MusicFrameRange[] = Array.from({ length: 3 }, (_, index) => ({
  rangeId: `locked-policy-${index + 1}`, startFrame: index * 960, endFrameExclusive: (index + 1) * 960,
}))
const lockedRequest = makeCanonicalMusicRequest({
  requestId: 'music-cue-grouping-locked-conflict', mode: 'fixture',
  cues: lockedRanges.map((range, index) => makeMusicCue({ cueId: `locked-cue-${index + 1}`, range,
    acquisitionPreference: 'generate_original' })),
  writeRanges: [{ rangeId: 'locked-policy-write', startFrame: 0, endFrameExclusive: 2_880 }],
  inspectRanges: [{ rangeId: 'locked-policy-inspect', startFrame: 0, endFrameExclusive: 2_880 }],
  allowGeneration: true, maximumCueCount: 1, maximumCueChangesPerMinute: 0,
})
const blockedPlan = await runtime.music.plan(lockedRequest)
assert.equal(blockedPlan.plannedResult.status, 'blocked')
assert.ok(blockedPlan.cuePolicyConflict)
assert.equal(blockedPlan.cuePolicyConflict?.requestedMaximumCueCount, 1)
assert.ok((blockedPlan.cuePolicyConflict?.minimumPossibleCueCount ?? 0) >= 3)
assert.deepEqual(blockedPlan.cuePolicyConflict?.hardConstraintIds.sort(),
  lockedRequest.cueConstraints.lockedCueIds.sort())
assert.equal((await runtime.music.execute(lockedRequest)).status, 'blocked')

console.log(JSON.stringify({
  status: 'ok', atomicSegmentCount: first.segmentationPlan.segments.length,
  finalGroupCount: first.cueGroupingPlan.groups.length,
  activeCueCount: first.cueGroupingPlan.maximumCueCountCalculation.actualFinal,
  cueChangesPerMinute: first.cueGroupingPlan.maximumCueChangesPerMinuteCalculation.actualFinal,
  groupingHash: first.cueGroupingPlan.groupingHash,
  conflictHash: blockedPlan.cuePolicyConflict?.conflictHash,
}, null, 2))
