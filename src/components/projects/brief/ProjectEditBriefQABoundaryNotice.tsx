type ProjectEditBriefQABoundaryNoticeProps = {
  summary: string
}

export function ProjectEditBriefQABoundaryNotice({ summary }: ProjectEditBriefQABoundaryNoticeProps) {
  return (
    <p className="project-edit-brief-qa-boundary" data-testid="project-edit-brief-qa-boundary">
      {summary}
    </p>
  )
}
