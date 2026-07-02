import type {
  MasterTimingMapRecord,
  RenderTimingManifestRecord,
  StoryTimingQACheckRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'

export function createTimingConflictChatSummary(conflicts: TimingConflictRecord[]): string {
  if (conflicts.length === 0) {
    return 'I did not find blocking timing conflicts in the mock StoryTiming pass.'
  }

  const blocking = conflicts.filter((conflict) => conflict.blocksRender).length
  const firstConflict = conflicts[0]

  return `I found ${conflicts.length} timing issue(s), including ${blocking} render blocker(s). First issue: ${firstConflict.description}`
}

export function createRenderTimingManifestChatSummary(renderTimingManifest: RenderTimingManifestRecord): string {
  return renderTimingManifest.readyForRender
    ? `This timing map is ready for render planning with ${renderTimingManifest.tracks.length} tracks and ${renderTimingManifest.events.length} timed events.`
    : 'The render timing manifest is still draft because timing conflicts or QA checks need adjustment.'
}

export function createStoryTimingApprovalSummary(
  qaChecks: StoryTimingQACheckRecord[],
  renderTimingManifest: RenderTimingManifestRecord,
): string {
  const blockingChecks = qaChecks.filter((check) => check.blocksRender).length

  if (blockingChecks > 0 || !renderTimingManifest.readyForRender) {
    return 'StoryTiming needs review before approval because timing QA found unresolved blocking checks.'
  }

  return 'StoryTiming is ready for user review: cuts, captions, music cues, SFX hits, signature overlays, and render markers are coordinated.'
}

export function createStoryTimingChatSummary(input: {
  masterTimingMap: MasterTimingMapRecord
  events: TimingEventRecord[]
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  renderTimingManifest: RenderTimingManifestRecord
}): string[] {
  const tracks = new Set(input.events.map((event) => event.trackType))
  const sfxHits = input.events.filter((event) => event.eventType === 'sfx_hit').length
  const musicDucks = input.events.filter((event) => event.eventType === 'music_duck_start').length

  return [
    `I created a master timing map for ${input.masterTimingMap.summary}. It coordinates ${tracks.size} timing track(s).`,
    `The map includes ${sfxHits} SFX hit point(s) and ${musicDucks} music ducking cue(s), with captions tied to speech windows where present.`,
    createTimingConflictChatSummary(input.conflicts),
    createRenderTimingManifestChatSummary(input.renderTimingManifest),
    createStoryTimingApprovalSummary(input.qaChecks, input.renderTimingManifest),
  ]
}
