import type { ProjectEditBriefApplicationLogRecord, ProjectEditBriefBundleRecord, ProjectEditSessionExportSettingsRecord } from '../../types/project-edit-brief'
import {
  createProjectEditBriefPlanApplicationResult,
  createProjectEditBriefPlanReadableSummary,
  createProjectEditBriefPlannerInputPackage,
} from '../../lib/project-edit-brief-plan-rules'

export { createProjectEditBriefPlanApplicationResult }

export function prepareProjectEditBriefPlanHints(input: {
  bundle: ProjectEditBriefBundleRecord
  exportSettings?: ProjectEditSessionExportSettingsRecord
  applicationLog?: ProjectEditBriefApplicationLogRecord
}) {
  const plannerInputPackage = createProjectEditBriefPlannerInputPackage({
    bundle: input.bundle,
    exportSettings: input.exportSettings,
    applicationLogSummary: input.applicationLog?.summary,
  })
  return createProjectEditBriefPlanApplicationResult({
    package: plannerInputPackage,
    applicationLog: input.applicationLog,
  })
}

export const applyProjectEditBriefMarkersToMockPlanHints = prepareProjectEditBriefPlanHints

export function createProjectEditBriefPlanApplicationSummary(input: ReturnType<typeof prepareProjectEditBriefPlanHints>): string {
  return createProjectEditBriefPlanReadableSummary(input.package)
}
