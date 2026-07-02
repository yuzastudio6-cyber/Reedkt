import type {
  ProjectEditBriefMarkerPlanInstruction,
  ProjectEditBriefPlanReadinessStatus,
  ProjectEditBriefSkippedMarker,
} from '../../types/project-edit-brief-plan'
import {
  PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY,
  classifyProjectEditBriefPlanReadiness,
} from '../../lib/project-edit-brief-plan-rules'

export { PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY, classifyProjectEditBriefPlanReadiness }

export function createProjectEditBriefPlanPriorityPolicy(): string[] {
  return PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY
}

export function createProjectEditBriefPlanPolicySummary(): string {
  return `${PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY.join(' > ')}. Mock plan hints never override safety or do-not-copy policy.`
}

export function createProjectEditBriefPlanReadinessSummary(input: {
  instructions: ProjectEditBriefMarkerPlanInstruction[]
  skippedMarkers: ProjectEditBriefSkippedMarker[]
  warnings?: string[]
}): ProjectEditBriefPlanReadinessStatus {
  return classifyProjectEditBriefPlanReadiness(input)
}
