import type { ProjectEditBriefBundleRecord, ProjectEditSessionExportSettingsRecord } from '../../types/project-edit-brief'
import {
  createProjectEditBriefPlannerInputPackage,
  createProjectEditBriefPlanReadableSummary,
} from '../../lib/project-edit-brief-plan-rules'

export { createProjectEditBriefPlannerInputPackage }

export function createProjectEditBriefPlanPackageFromBundle(input: {
  bundle: ProjectEditBriefBundleRecord
  exportSettings?: ProjectEditSessionExportSettingsRecord
  applicationLogSummary?: string
}) {
  return createProjectEditBriefPlannerInputPackage(input)
}

export function createProjectEditBriefPlanPackageSummary(input: ReturnType<typeof createProjectEditBriefPlannerInputPackage>): string {
  return createProjectEditBriefPlanReadableSummary(input)
}
