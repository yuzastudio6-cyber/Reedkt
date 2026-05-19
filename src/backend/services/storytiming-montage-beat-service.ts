import type {
  MasterTimingMapRecord,
  MusicBeatGridRecord,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { findNearestDownbeat } from './storytiming-music-beat-grid-service'

export interface MontageBeatTimingPlan {
  id: string
  masterTimingMapId: string
  segmentId: string
  downbeatSeconds: number
  recommendedDensity: 'breathing' | 'steady' | 'tight'
  notes: string[]
}

export function createMontageBeatTimingPlan(
  masterTimingMap: MasterTimingMapRecord,
  segment: StoryTimingSegmentRecord,
  beatGrid: MusicBeatGridRecord | undefined,
): MontageBeatTimingPlan | undefined {
  const downbeatSeconds = findNearestDownbeat(beatGrid, segment.outputTimeRange.startSeconds)
  if (downbeatSeconds === undefined) return undefined

  return {
    id: createMockId('montage-beat-plan'),
    masterTimingMapId: masterTimingMap.id,
    segmentId: segment.id,
    downbeatSeconds,
    recommendedDensity: segment.purpose.toLowerCase().includes('fitness') ? 'tight' : 'breathing',
    notes: [
      'Mock montage beat plan; cuts/SFX may follow music only when speech is not dominant.',
    ],
  }
}

export function createMontageCutBeatAnchors(
  masterTimingMap: MasterTimingMapRecord,
  plans: MontageBeatTimingPlan[],
): TimingAnchorRecord[] {
  return plans.map((plan) => ({
    id: createMockId('montage-cut-anchor'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: plan.segmentId,
    sourceSystem: 'music_cue',
    anchorType: 'music_downbeat',
    anchorLabel: `Montage cut downbeat at ${plan.downbeatSeconds.toFixed(3)}s`,
    timeSeconds: plan.downbeatSeconds,
    frameNumber: Math.round(plan.downbeatSeconds * masterTimingMap.frameRate),
    importance: plan.recommendedDensity === 'tight' ? 'high' : 'medium',
    primaryAuthority: 'music_rhythm',
    syncMode: 'beat_locked',
    locked: false,
    notes: plan.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      recommendedDensity: plan.recommendedDensity,
    },
  }))
}

export function createMontageSFXBeatAnchors(
  masterTimingMap: MasterTimingMapRecord,
  plans: MontageBeatTimingPlan[],
): TimingAnchorRecord[] {
  return plans.map((plan) => ({
    id: createMockId('montage-sfx-anchor'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: plan.segmentId,
    sourceSystem: 'sfx_event',
    anchorType: 'sfx_hit',
    anchorLabel: `Montage SFX hit on downbeat ${plan.downbeatSeconds.toFixed(3)}s`,
    timeSeconds: plan.downbeatSeconds,
    frameNumber: Math.round(plan.downbeatSeconds * masterTimingMap.frameRate),
    importance: 'medium',
    primaryAuthority: 'sfx_hit',
    syncMode: 'beat_locked',
    locked: false,
    notes: plan.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      recommendedDensity: plan.recommendedDensity,
    },
  }))
}

export function createMontageTimingSummary(plans: MontageBeatTimingPlan[]): string {
  return plans.length === 0
    ? 'No montage beat guidance was needed.'
    : `${plans.length} montage segment(s) received mock beat-guided cut/SFX timing.`
}
