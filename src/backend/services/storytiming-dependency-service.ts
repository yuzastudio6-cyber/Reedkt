import type {
  MasterTimingMapRecord,
  TimingAnchorRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

interface DependencyInput {
  masterTimingMap: MasterTimingMapRecord
  fromEventId?: string
  toEventId?: string
  fromAnchorId?: string
  toAnchorId?: string
  dependencyType: TimingDependencyRecord['dependencyType']
  minOffsetSeconds?: number
  maxOffsetSeconds?: number
  required?: boolean
  reason: string
  notes?: string[]
}

const createDependency = (input: DependencyInput): TimingDependencyRecord => ({
  id: createMockId('timing-dependency'),
  masterTimingMapId: input.masterTimingMap.id,
  projectId: input.masterTimingMap.projectId,
  editPlanId: input.masterTimingMap.editPlanId,
  fromEventId: input.fromEventId,
  toEventId: input.toEventId,
  fromAnchorId: input.fromAnchorId,
  toAnchorId: input.toAnchorId,
  dependencyType: input.dependencyType,
  minOffsetSeconds: input.minOffsetSeconds,
  maxOffsetSeconds: input.maxOffsetSeconds,
  required: input.required ?? true,
  reason: input.reason,
  notes: input.notes ?? [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: {},
})

const nearestAnchor = (
  anchors: TimingAnchorRecord[],
  event: TimingEventRecord,
  anchorType: TimingAnchorRecord['anchorType'],
): TimingAnchorRecord | undefined =>
  anchors.find((anchor) => anchor.anchorType === anchorType && Math.abs(anchor.timeSeconds - (event.hitTimeSeconds ?? event.startTimeSeconds)) <= 0.15)

export function createSFXHitAnchorDependencies(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
): TimingDependencyRecord[] {
  return events
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((event) => {
      const anchor = nearestAnchor(anchors, event, 'sfx_hit')
      return anchor
        ? [
            createDependency({
              masterTimingMap,
              fromEventId: event.id,
              toAnchorId: anchor.id,
              dependencyType: 'sync_to_anchor',
              maxOffsetSeconds: 0.08,
              reason: 'SFX hit should land on its StoryTiming SFX anchor.',
            }),
          ]
        : []
    })
}

export function createCaptionOverlayDependencies(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingDependencyRecord[] {
  const captions = events.filter((event) => event.trackType === 'captions' && event.eventType === 'caption_on')
  const overlays = events.filter((event) => event.trackType === 'graphic_design' || event.trackType === 'real_motion')

  return captions.flatMap((caption) =>
    overlays.map((overlay) =>
      createDependency({
        masterTimingMap,
        fromEventId: caption.id,
        toEventId: overlay.id,
        dependencyType: 'must_not_overlap',
        required: true,
        reason: 'Captions must remain readable and should not collide with generated overlays.',
      }),
    ),
  )
}

export function createMusicDuckingDependencies(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingDependencyRecord[] {
  const duckStarts = events.filter((event) => event.eventType === 'music_duck_start')
  const captions = events.filter((event) => event.eventType === 'caption_on')

  return captions.flatMap((caption) =>
    duckStarts
      .filter((duck) => Math.abs(duck.startTimeSeconds - caption.startTimeSeconds) <= 0.6)
      .map((duck) =>
        createDependency({
          masterTimingMap,
          fromEventId: duck.id,
          toEventId: caption.id,
          dependencyType: 'starts_before',
          minOffsetSeconds: -0.5,
          maxOffsetSeconds: 0,
          reason: 'Music ducking should begin before speech captions enter.',
        }),
      ),
  )
}

export function createStrokeMotionWordSyncDependencies(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
): TimingDependencyRecord[] {
  return events
    .filter((event) => event.eventType === 'stroke_motion_complete')
    .flatMap((event) => {
      const anchor = nearestAnchor(anchors, event, 'stroke_motion_completion') ?? nearestAnchor(anchors, event, 'phrase')
      return anchor
        ? [
            createDependency({
              masterTimingMap,
              fromEventId: event.id,
              toAnchorId: anchor.id,
              dependencyType: 'sync_to_anchor',
              maxOffsetSeconds: 0.25,
              reason: 'Stroke Motion completion should land on phrase meaning.',
            }),
          ]
        : []
    })
}

export function createGraphicReadabilityDependencies(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingDependencyRecord[] {
  return events
    .filter((event) => event.trackType === 'graphic_design')
    .map((event) =>
      createDependency({
        masterTimingMap,
        fromEventId: event.id,
        dependencyType: 'ends_after',
        minOffsetSeconds: 1.2,
        required: true,
        reason: 'Graphic Design overlays need enough hold time to read.',
      }),
    )
}

export function createRealMotionFaceSafetyDependencies(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingDependencyRecord[] {
  const realMotionEvents = events.filter((event) => event.trackType === 'real_motion')
  const captionEvents = events.filter((event) => event.trackType === 'captions')

  return realMotionEvents.flatMap((realMotion) =>
    captionEvents.map((caption) =>
      createDependency({
        masterTimingMap,
        fromEventId: realMotion.id,
        toEventId: caption.id,
        dependencyType: 'must_not_overlap',
        required: true,
        reason: 'Real Motion objects should not block faces or caption readability during speech.',
      }),
    ),
  )
}

export function createTransitionStoryBeatDependencies(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
): TimingDependencyRecord[] {
  const storyAnchors = anchors.filter((anchor) => anchor.sourceSystem === 'story_beat')

  return events
    .filter((event) => event.eventType === 'transition_start')
    .flatMap((transition) =>
      storyAnchors
        .filter((anchor) => Math.abs(anchor.timeSeconds - transition.startTimeSeconds) <= 1)
        .map((anchor) =>
          createDependency({
            masterTimingMap,
            fromEventId: transition.id,
            toAnchorId: anchor.id,
            dependencyType: 'ends_after',
            reason: 'Transitions should not cut a story beat before meaning resolves.',
          }),
        ),
    )
}

export function createTimingDependencies(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
): ServiceResult<{ dependencies: TimingDependencyRecord[]; warnings: string[] }> {
  const dependencies = [
    ...createSFXHitAnchorDependencies(masterTimingMap, anchors, events),
    ...createCaptionOverlayDependencies(masterTimingMap, events),
    ...createMusicDuckingDependencies(masterTimingMap, events),
    ...createStrokeMotionWordSyncDependencies(masterTimingMap, anchors, events),
    ...createGraphicReadabilityDependencies(masterTimingMap, events),
    ...createRealMotionFaceSafetyDependencies(masterTimingMap, events),
    ...createTransitionStoryBeatDependencies(masterTimingMap, anchors, events),
  ]
  const warnings = dependencies.length === 0
    ? ['No cross-track timing dependencies were detected from the mock event set.']
    : []

  return ok({ dependencies, warnings }, warnings)
}

export function createDependencySummary(dependencies: TimingDependencyRecord[]): string {
  const requiredCount = dependencies.filter((dependency) => dependency.required).length

  return `${dependencies.length} dependencies created; ${requiredCount} are required for timing safety.`
}
