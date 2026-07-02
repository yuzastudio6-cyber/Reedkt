import { Badge } from '../../Badge'

type ProjectEditBriefMarkerChatBoundaryNoticeProps = {
  readinessLabel?: string
  readinessSummary?: string
  runtimeLabel?: string
  runtimeSummary?: string
  summary: string
}

export function ProjectEditBriefMarkerChatBoundaryNotice({
  readinessLabel,
  readinessSummary,
  runtimeLabel,
  runtimeSummary,
  summary,
}: ProjectEditBriefMarkerChatBoundaryNoticeProps) {
  return (
    <div className="project-edit-brief-marker-chat-boundary" data-testid="project-edit-brief-marker-chat-boundary">
      <Badge accent="cyan">Marker scoped</Badge>
      {runtimeLabel ? (
        <span data-testid="project-edit-brief-marker-chat-runtime">
          <Badge accent="cyan">{runtimeLabel}</Badge>
        </span>
      ) : null}
      <p>{summary}</p>
      {runtimeSummary ? <p>{runtimeSummary}</p> : null}
      {readinessLabel ? (
        <p data-testid="project-edit-brief-marker-chat-readiness">
          <strong>{readinessLabel}</strong>
          {readinessSummary ? ` ${readinessSummary}` : null}
        </p>
      ) : null}
    </div>
  )
}
