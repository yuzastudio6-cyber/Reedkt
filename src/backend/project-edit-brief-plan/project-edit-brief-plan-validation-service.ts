export {
  validateNoProjectEditBriefPlanSideEffects,
  validateProjectEditBriefMarkerPlanInstruction,
  validateProjectEditBriefPlanApplicationResult,
  validateProjectEditBriefPlannerInputPackage,
} from '../../lib/project-edit-brief-plan-rules'

import type { ProjectEditBriefPlanValidationResult } from '../../types/project-edit-brief-plan'

export function createProjectEditBriefPlanValidationSummary(result: ProjectEditBriefPlanValidationResult): string {
  return result.ok
    ? 'Project Edit Brief plan-hint validation passed with no execution side effects.'
    : `Project Edit Brief plan-hint validation blocked: ${result.blockedReasons.join(' ')}`
}
