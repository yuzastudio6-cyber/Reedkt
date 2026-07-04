type ProjectEditBriefApplicationLogSummaryProps = {
  summary?: string
}

export function ProjectEditBriefApplicationLogSummary({ summary }: ProjectEditBriefApplicationLogSummaryProps) {
  return (
    <div className="project-edit-brief-plan-log" data-testid="project-edit-brief-plan-application-log">
      <strong>Application log</strong>
      <p>{summary ?? 'No mock plan-hints application log has been appended in this UI session.'}</p>
    </div>
  )
}
