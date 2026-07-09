import { Film, PlaySquare } from 'lucide-react'
import type { ProjectEditSessionHomeCardViewModel } from '../../lib/project-edit-session-project-home-ui-adapter'

type ProjectEditSessionAspectFrameProps = {
  card: ProjectEditSessionHomeCardViewModel
}

export function ProjectEditSessionAspectFrame({ card }: ProjectEditSessionAspectFrameProps) {
  const hasReviewOutput = /ready|reviewed/i.test(card.latestPreviewLabel)

  return (
    <div
      aria-label={`${card.name} ${card.frameLabel} ${card.latestPreviewLabel}`}
      className={`project-edit-session-aspect-frame project-edit-session-aspect-frame--${card.cardShape}`}
      data-testid={`edit-session-aspect-${card.cardShape}`}
    >
      <div className="project-edit-session-aspect-frame__screen">
        {hasReviewOutput ? <PlaySquare aria-hidden="true" size={24} /> : <Film aria-hidden="true" size={24} />}
        <span>{card.aspectRatio}</span>
      </div>
      <small>{card.latestPreviewLabel}</small>
    </div>
  )
}
