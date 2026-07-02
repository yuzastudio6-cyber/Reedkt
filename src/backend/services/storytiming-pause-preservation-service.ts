import type {
  PacingAnalysisRecord,
} from '../../types/edit-quality'
import type {
  MasterTimingMapRecord,
  PausePreservationDecision,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { createTimingConflict } from './storytiming-conflict-service'

export function classifyPauseForTiming(analysis: PacingAnalysisRecord): PausePreservationDecision {
  if (analysis.preserveEmotionalPauses || analysis.pauseQuality === 'emotional_pause' || analysis.pauseQuality === 'dramatic_pause') {
    return 'preserve'
  }

  if (analysis.pauseQuality === 'natural_breath' && analysis.preserveBreaths) {
    return 'preserve'
  }

  if (analysis.pauseQuality === 'thinking_pause') {
    return 'tighten'
  }

  if (analysis.pauseQuality === 'dead_space' || analysis.pauseQuality === 'mistake_pause') {
    return 'remove'
  }

  return analysis.emotionalPauseSecondsToPreserve > 0 ? 'preserve' : 'tighten'
}

export function decidePausePreservation(
  analysis: PacingAnalysisRecord,
  context: { faithOrSerious?: boolean; socialShort?: boolean } = {},
): PausePreservationDecision {
  const baseDecision = classifyPauseForTiming(analysis)

  if (context.faithOrSerious && baseDecision !== 'remove') {
    return 'preserve'
  }

  if (context.socialShort && baseDecision === 'tighten') {
    return 'tighten'
  }

  return baseDecision
}

export function createPausePreservationAnchors(
  masterTimingMap: MasterTimingMapRecord,
  pacingAnalysis: PacingAnalysisRecord[] = [],
): TimingAnchorRecord[] {
  return pacingAnalysis
    .filter((analysis) => decidePausePreservation(analysis) !== 'remove')
    .map((analysis) => ({
      id: createMockId('pause-anchor'),
      masterTimingMapId: masterTimingMap.id,
      projectId: masterTimingMap.projectId,
      editPlanId: masterTimingMap.editPlanId,
      sourceSystem: 'pacing_analysis',
      sourceRecordId: analysis.id,
      sourceRef: {
        sourceSystem: 'pacing_analysis',
        sourceRecordId: analysis.id,
        sourceTableName: 'pacing_analysis',
        label: analysis.pauseQuality ?? 'pause',
      },
      anchorType: analysis.pauseQuality === 'natural_breath' ? 'breath' : 'pause',
      anchorLabel: analysis.pauseQuality ?? 'pause preservation',
      timeSeconds: analysis.timeRange.startSeconds,
      endTimeSeconds: analysis.timeRange.endSeconds,
      frameNumber: Math.round(analysis.timeRange.startSeconds * masterTimingMap.frameRate),
      importance: decidePausePreservation(analysis) === 'preserve' ? 'critical' : 'medium',
      primaryAuthority: analysis.pauseQuality === 'natural_breath' ? 'speech_meaning' : 'emotional_timing',
      syncMode: 'emotion_locked',
      locked: decidePausePreservation(analysis) === 'preserve',
      notes: [
        analysis.recommendedPaceSummary,
        `Pause decision: ${decidePausePreservation(analysis)}.`,
      ],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: {
        mockOnly: true,
        pauseDecision: decidePausePreservation(analysis),
      },
    }))
}

export function createEmotionalPauseDependencies(
  masterTimingMap: MasterTimingMapRecord,
  pauseAnchors: TimingAnchorRecord[],
  cutEvents: TimingEventRecord[],
): TimingDependencyRecord[] {
  return pauseAnchors
    .filter((anchor) => anchor.locked)
    .flatMap((anchor) =>
      cutEvents.map((cutEvent) => ({
        id: createMockId('pause-dependency'),
        masterTimingMapId: masterTimingMap.id,
        projectId: masterTimingMap.projectId,
        editPlanId: masterTimingMap.editPlanId,
        fromEventId: cutEvent.id,
        toAnchorId: anchor.id,
        dependencyType: 'must_not_overlap',
        required: true,
        reason: 'Cuts must not remove protected emotional pauses or meaningful breaths.',
        notes: ['Mock pause preservation dependency.'],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        metadata: {},
      })),
    )
}

export function detectEmotionalPauseRemovedConflict(
  masterTimingMap: MasterTimingMapRecord,
  pauseAnchors: TimingAnchorRecord[],
  cutEvents: TimingEventRecord[],
): TimingConflictRecord[] {
  return cutEvents.flatMap((cutEvent) =>
    pauseAnchors
      .filter((anchor) =>
        anchor.locked &&
        cutEvent.startTimeSeconds >= anchor.timeSeconds &&
        cutEvent.startTimeSeconds <= (anchor.endTimeSeconds ?? anchor.timeSeconds),
      )
      .map((anchor) =>
        createTimingConflict(
          masterTimingMap,
          'emotional_pause_removed',
          'critical',
          {
            startSeconds: anchor.timeSeconds,
            endSeconds: anchor.endTimeSeconds ?? anchor.timeSeconds,
          },
          `Cut "${cutEvent.label}" removes a protected pause.`,
          'Emotional and teaching pauses are part of the meaning, not disposable dead space.',
          'preserve_pause',
          [cutEvent],
          [anchor],
        ),
      ),
  )
}

export function createPausePreservationSummary(pauseAnchors: TimingAnchorRecord[]): string {
  const locked = pauseAnchors.filter((anchor) => anchor.locked).length

  return `${pauseAnchors.length} pause/breath anchor(s) created; ${locked} are protected.`
}
