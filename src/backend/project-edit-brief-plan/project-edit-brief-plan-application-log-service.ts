import type { ProjectEditBriefApplicationLogRecord } from '../../types/project-edit-brief'
import type { ProjectEditBriefPlannerInputPackage } from '../../types/project-edit-brief-plan'
import { createProjectEditBriefPlanApplicationLogSummary } from '../../lib/project-edit-brief-plan-rules'

export { createProjectEditBriefPlanApplicationLogSummary }

export function createProjectEditBriefPlanApplicationLog(pkg: ProjectEditBriefPlannerInputPackage): ProjectEditBriefApplicationLogRecord {
  return {
    id: `project-edit-brief-plan-log-${pkg.briefId}`,
    projectId: pkg.projectId,
    editSessionId: pkg.editSessionId,
    briefId: pkg.briefId,
    summary: createProjectEditBriefPlanApplicationLogSummary(pkg),
    appliedToPlan: false,
    createdAt: '2026-06-24T14:00:00.000Z',
    mockOnly: true,
    metadata: {
      preparedMockPlanHints: true,
      plannerExecuted: false,
      editPlanCreated: false,
      eligibleMarkerCount: pkg.eligibleMarkerCount,
      skippedMarkerCount: pkg.skippedMarkerCount,
    },
  }
}

export function createProjectEditBriefApplicationLogPayload(pkg: ProjectEditBriefPlannerInputPackage) {
  const log = createProjectEditBriefPlanApplicationLog(pkg)
  return {
    id: log.id,
    projectId: log.projectId,
    editSessionId: log.editSessionId,
    briefId: log.briefId,
    summary: log.summary,
    appliedToPlan: log.appliedToPlan,
    metadata: log.metadata,
  }
}
