import type {
  MasterTimingMapRecord,
  MusicBeatGridRecord,
  MusicDuckingTimingPlanRecord,
  StoryTimingQACheckRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

const createQACheck = (input: {
  masterTimingMap: MasterTimingMapRecord
  checkType: StoryTimingQACheckRecord['checkType']
  status: StoryTimingQACheckRecord['status']
  summary: string
  score: number
  relatedEventIds?: string[]
  relatedAnchorIds?: string[]
  recommendedFix?: string
  blocksRender?: boolean
  requiresManualReview?: boolean
}): StoryTimingQACheckRecord => ({
  id: createMockId('soundsync-qa'),
  masterTimingMapId: input.masterTimingMap.id,
  projectId: input.masterTimingMap.projectId,
  editPlanId: input.masterTimingMap.editPlanId,
  checkType: input.checkType,
  status: input.status,
  score: input.score,
  relatedEventIds: input.relatedEventIds ?? [],
  relatedAnchorIds: input.relatedAnchorIds ?? [],
  summary: input.summary,
  recommendedFix: input.recommendedFix,
  blocksRender: input.blocksRender ?? false,
  requiresManualReview: input.requiresManualReview ?? false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: {
    scope: 'soundsync',
  },
})

export function checkMusicBeatAlignment(
  masterTimingMap: MasterTimingMapRecord,
  beatGrids: MusicBeatGridRecord[],
): StoryTimingQACheckRecord {
  return createQACheck({
    masterTimingMap,
    checkType: 'music_beat_alignment',
    status: beatGrids.length > 0 ? 'passed' : 'warning',
    summary: beatGrids.length > 0
      ? `${beatGrids.length} mock beat grid(s) are available for music-aware timing.`
      : 'No mock beat grid was available; music timing stays cue-based only.',
    score: beatGrids.length > 0 ? 92 : 76,
  })
}

export function checkMusicDuckingTiming(
  masterTimingMap: MasterTimingMapRecord,
  duckingPlans: MusicDuckingTimingPlanRecord[],
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const duckingConflicts = conflicts.filter((conflict) => conflict.conflictType === 'music_ducking_misses_speech')
  return createQACheck({
    masterTimingMap,
    checkType: 'music_ducking_timing',
    status: duckingConflicts.length === 0 ? 'passed' : 'requires_adjustment',
    summary: duckingConflicts.length === 0
      ? `${duckingPlans.length} music ducking window(s) protect speech.`
      : 'Music ducking timing misses or overreaches speech in this mock pass.',
    score: duckingConflicts.length === 0 ? 95 : 66,
    relatedEventIds: duckingConflicts.flatMap((conflict) => conflict.relatedEventIds),
    recommendedFix: duckingConflicts.length === 0 ? undefined : 'Move music ducking to 150-400ms before speech starts.',
    blocksRender: duckingConflicts.some((conflict) => conflict.blocksRender),
  })
}

export function checkSFXHitAlignment(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const sfxConflicts = conflicts.filter((conflict) => conflict.conflictType === 'sfx_hit_late' || conflict.conflictType === 'sfx_hit_early')
  return createQACheck({
    masterTimingMap,
    checkType: 'sfx_hit_alignment',
    status: sfxConflicts.length === 0 ? 'passed' : 'requires_adjustment',
    summary: sfxConflicts.length === 0
      ? 'SFX hits align to timing anchors in the mock pass.'
      : 'One or more SFX hits are early or late.',
    score: sfxConflicts.length === 0 ? 96 : 64,
    relatedEventIds: sfxConflicts.flatMap((conflict) => conflict.relatedEventIds),
    recommendedFix: sfxConflicts.length === 0 ? undefined : 'Shift SFX hit timing or adjust hit offset inside the trim.',
    blocksRender: sfxConflicts.some((conflict) => conflict.blocksRender),
  })
}

export function checkSFXTailSafety(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const tailConflicts = conflicts.filter((conflict) => conflict.conflictType === 'sfx_tail_over_speech')
  return createQACheck({
    masterTimingMap,
    checkType: 'sfx_tail_safety',
    status: tailConflicts.length === 0 ? 'passed' : 'requires_adjustment',
    summary: tailConflicts.length === 0
      ? 'SFX tails avoid important speech in the mock pass.'
      : 'One or more SFX tails risk covering speech.',
    score: tailConflicts.length === 0 ? 95 : 68,
    relatedEventIds: tailConflicts.flatMap((conflict) => conflict.relatedEventIds),
    recommendedFix: tailConflicts.length === 0 ? undefined : 'Shorten tail, lower gain, or shift the SFX earlier.',
    blocksRender: tailConflicts.some((conflict) => conflict.blocksRender),
  })
}

export function checkMusicSFXDensity(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const densityConflicts = conflicts.filter((conflict) => conflict.conflictType === 'too_many_events_same_moment')
  return createQACheck({
    masterTimingMap,
    checkType: 'overall_rhythm',
    status: densityConflicts.length === 0 ? 'passed' : 'warning',
    summary: densityConflicts.length === 0
      ? 'Music/SFX event density is controlled.'
      : 'Music/SFX timing is crowded in one or more moments.',
    score: densityConflicts.length === 0 ? 92 : 72,
    relatedEventIds: densityConflicts.flatMap((conflict) => conflict.relatedEventIds),
    recommendedFix: densityConflicts.length === 0 ? undefined : 'Reduce decorative hits or spread them away from speech and transitions.',
  })
}

export function checkAmbiencePreservationTiming(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const ambienceConflicts = conflicts.filter((conflict) => conflict.description.toLowerCase().includes('ambience'))
  const ambienceEvents = events.filter((event) => event.notes.some((note) => note.toLowerCase().includes('ambience')))
  return createQACheck({
    masterTimingMap,
    checkType: 'platform_pacing',
    status: ambienceConflicts.length === 0 ? 'passed' : 'warning',
    summary: ambienceConflicts.length === 0
      ? `${ambienceEvents.length} ambience-sensitive event(s) remain voice- and scene-safe.`
      : 'Ambience may be masked by dense music/SFX timing.',
    score: ambienceConflicts.length === 0 ? 90 : 70,
    relatedEventIds: ambienceConflicts.flatMap((conflict) => conflict.relatedEventIds),
    recommendedFix: ambienceConflicts.length === 0 ? undefined : 'Lower music/SFX density and preserve source ambience.',
  })
}

export function createSoundSyncTimingQAChecks(input: {
  masterTimingMap: MasterTimingMapRecord
  beatGrids: MusicBeatGridRecord[]
  duckingPlans: MusicDuckingTimingPlanRecord[]
  events: TimingEventRecord[]
  conflicts: TimingConflictRecord[]
}): StoryTimingQACheckRecord[] {
  return [
    checkMusicBeatAlignment(input.masterTimingMap, input.beatGrids),
    checkMusicDuckingTiming(input.masterTimingMap, input.duckingPlans, input.conflicts),
    checkSFXHitAlignment(input.masterTimingMap, input.conflicts),
    checkSFXTailSafety(input.masterTimingMap, input.conflicts),
    checkMusicSFXDensity(input.masterTimingMap, input.conflicts),
    checkAmbiencePreservationTiming(input.masterTimingMap, input.events, input.conflicts),
  ]
}

export function runSoundSyncTimingQA(input: {
  masterTimingMap: MasterTimingMapRecord
  beatGrids: MusicBeatGridRecord[]
  duckingPlans: MusicDuckingTimingPlanRecord[]
  events: TimingEventRecord[]
  conflicts: TimingConflictRecord[]
}): ServiceResult<{ qaChecks: StoryTimingQACheckRecord[]; warnings: string[] }> {
  const qaChecks = createSoundSyncTimingQAChecks(input)
  const warnings = qaChecks.some((check) => check.status === 'requires_adjustment' || check.status === 'failed')
    ? ['SoundSync timing QA found mock music/SFX timing issues.']
    : []

  return ok({ qaChecks, warnings }, warnings)
}

export function createSoundSyncTimingQASummary(qaChecks: StoryTimingQACheckRecord[]): string {
  const needsWork = qaChecks.filter((check) => check.status !== 'passed')
  return needsWork.length === 0
    ? 'SoundSync timing QA passed for mock music/SFX timing.'
    : `${needsWork.length} SoundSync QA check(s) need timing review.`
}
