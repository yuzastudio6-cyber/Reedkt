import type { ProjectEditBriefQAFinding } from '../../types/project-edit-brief-qa'
import {
  PROJECT_EDIT_BRIEF_QA_PRIORITY_SUMMARY,
  classifyProjectEditBriefQAReadiness,
} from '../../lib/project-edit-brief-qa-rules'

export function createProjectEditBriefQAPolicy() {
  return {
    mockOnly: true,
    prioritySummary: PROJECT_EDIT_BRIEF_QA_PRIORITY_SUMMARY,
    noExecutionSummary: 'Marker QA never applies markers to plans, calls providers, processes media, renders, exports, or spends credits.',
    allowedActions: ['run_marker_qa', 'run_brief_qa', 'save_conflict', 'update_marker_qa_status', 'refresh_qa_summary'],
  }
}

export { classifyProjectEditBriefQAReadiness }

export function createProjectEditBriefQAPrioritySummary(): string {
  return PROJECT_EDIT_BRIEF_QA_PRIORITY_SUMMARY
}

export function createProjectEditBriefQAPolicySummary(findings: ProjectEditBriefQAFinding[] = []): string {
  const readiness = classifyProjectEditBriefQAReadiness(findings)
  return `Edit Brief QA policy is mock/local; readiness is ${readiness}. ${PROJECT_EDIT_BRIEF_QA_PRIORITY_SUMMARY}`
}
