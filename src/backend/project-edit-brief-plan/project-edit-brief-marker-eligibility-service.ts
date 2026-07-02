export {
  classifyProjectEditBriefMarkerPlanEligibility,
  createProjectEditBriefSkippedMarker,
} from '../../lib/project-edit-brief-plan-rules'

import type { ProjectEditBriefBundleRecord } from '../../types/project-edit-brief'
import {
  classifyProjectEditBriefMarkerPlanEligibility,
  createProjectEditBriefMarkerPlanInstructions,
} from '../../lib/project-edit-brief-plan-rules'

export function filterProjectEditBriefEligibleMarkers(bundle: ProjectEditBriefBundleRecord) {
  return createProjectEditBriefMarkerPlanInstructions({ bundle }).eligibleMarkers
}

export function createProjectEditBriefMarkerEligibilitySummary(bundle: ProjectEditBriefBundleRecord): string {
  const result = createProjectEditBriefMarkerPlanInstructions({ bundle })
  return `${result.eligibleMarkers.length} marker(s) eligible and ${result.skippedMarkers.length} skipped for mock plan hints.`
}

export function classifyProjectEditBriefBundleMarkerEligibility(bundle: ProjectEditBriefBundleRecord) {
  return bundle.markers.map((marker) => classifyProjectEditBriefMarkerPlanEligibility({
    marker,
    intent: bundle.intents.find((intent) => intent.id === marker.intentId || intent.markerId === marker.id),
    attachments: bundle.attachments,
    conflicts: bundle.conflicts,
  }))
}
