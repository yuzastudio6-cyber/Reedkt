import type { SignatureRouteRecord } from '../../types/planning'
import type {
  MasterTimingMapRecord,
  SignatureOverlaySafetyRisk,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

export function detectRealMotionFaceSafetyRisk(
  route?: SignatureRouteRecord,
  event?: TimingEventRecord,
): SignatureOverlaySafetyRisk {
  const notes = [
    route?.reason,
    ...(event?.notes ?? []),
    String(route?.metadata?.faceSafetyRisk ?? ''),
    String(route?.metadata?.safePlacement ?? ''),
  ].join(' ').toLowerCase()

  if (notes.includes('force_face_block') || notes.includes('blocks face') || notes.includes('face_blocking')) {
    return 'face_blocking'
  }

  if (notes.includes('manual_review')) {
    return 'manual_review'
  }

  if (!route?.metadata?.faceSafePlacement && !route?.metadata?.safePlacement) {
    return 'manual_review'
  }

  return 'none'
}

export function createRealMotionFaceSafetyDependency(
  masterTimingMap: MasterTimingMapRecord,
  realMotionEvent: TimingEventRecord,
): TimingDependencyRecord {
  return {
    id: createMockId('real-motion-face-safety-dependency'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    fromEventId: realMotionEvent.id,
    dependencyType: 'must_not_overlap',
    required: true,
    reason: 'Real Motion must remain outside face and important object safe zones.',
    notes: ['Mock face-safety dependency only; no vision detection or masking ran.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

export function createRealMotionFaceSafetySummary(events: TimingEventRecord[]): string {
  const realMotionEvents = events.filter((event) => event.trackType === 'real_motion')

  return `${realMotionEvents.length} Real Motion event(s) checked for face/object safety with mock metadata only.`
}
