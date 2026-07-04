type ProjectEditBriefPlanBoundaryNoticeProps = {
  summary: string
}

export function ProjectEditBriefPlanBoundaryNotice({ summary }: ProjectEditBriefPlanBoundaryNoticeProps) {
  return (
    <p className="project-edit-brief-plan-boundary" data-testid="project-edit-brief-plan-boundary">
      {summary}
    </p>
  )
}
