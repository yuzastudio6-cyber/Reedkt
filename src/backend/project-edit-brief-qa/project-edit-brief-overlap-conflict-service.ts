import type { ProjectEditBriefMarkerRecord } from '../../types/project-edit-brief'
import {
  detectProjectEditBriefOverlapConflicts,
  markersOverlap,
} from '../../lib/project-edit-brief-qa-rules'

export function detectProjectEditBriefMarkerOverlap(
  marker: ProjectEditBriefMarkerRecord,
  relatedMarker: ProjectEditBriefMarkerRecord,
): boolean {
  return markersOverlap(marker, relatedMarker)
}

export function detectProjectEditBriefCutVsBrollConflict(input: Parameters<typeof detectProjectEditBriefOverlapConflicts>[0]) {
  return detectProjectEditBriefOverlapConflicts(input).filter((finding) => finding.conflictKind === 'cut_vs_broll')
}

export function detectProjectEditBriefCutVsKeepConflict(input: Parameters<typeof detectProjectEditBriefOverlapConflicts>[0]) {
  return detectProjectEditBriefOverlapConflicts(input).filter((finding) => finding.conflictKind === 'cut_vs_keep')
}

export function detectProjectEditBriefDoNotUseVsActionConflict(input: Parameters<typeof detectProjectEditBriefOverlapConflicts>[0]) {
  return detectProjectEditBriefOverlapConflicts(input).filter((finding) => finding.conflictKind === 'do_not_use_vs_action')
}

export function createProjectEditBriefOverlapConflictSummary(input: Parameters<typeof detectProjectEditBriefOverlapConflicts>[0]): string {
  const conflicts = detectProjectEditBriefOverlapConflicts(input)
  return `${conflicts.length} mock overlap conflict(s) detected; no planner execution started.`
}
