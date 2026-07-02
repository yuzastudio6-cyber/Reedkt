import {
  createProjectEditBriefConflictRecordsFromFindings,
  createProjectEditBriefQAPackage,
  createProjectEditBriefQAReadableSummary,
  runProjectEditBriefMarkerQA,
} from '../../lib/project-edit-brief-qa-rules'

export {
  createProjectEditBriefConflictRecordsFromFindings,
  createProjectEditBriefQAPackage,
  runProjectEditBriefMarkerQA as createProjectEditBriefMarkerQAPackage,
}

export function createProjectEditBriefQAPackageSummary(input: ReturnType<typeof createProjectEditBriefQAPackage>): string {
  return createProjectEditBriefQAReadableSummary(input)
}
