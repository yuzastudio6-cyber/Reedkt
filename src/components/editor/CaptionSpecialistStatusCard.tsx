import type { CaptionSpecialistChatPresentation } from
  '../../types/caption-specialist-integration'

export type CaptionSpecialistStatusCardProps = {
  presentation: CaptionSpecialistChatPresentation
  compact?: boolean
}

/**
 * Presentation-only Caption surface. It has no approval, credit, provider,
 * render, repair, or delivery action; those remain with the existing workflow.
 */
export function CaptionSpecialistStatusCard({
  compact = false,
  presentation,
}: CaptionSpecialistStatusCardProps) {
  return (
    <section
      aria-label="Caption plan status"
      className="caption-specialist-status"
      data-phase={presentation.phase}
      data-testid="caption-specialist-status"
    >
      <div className="caption-specialist-status-heading">
        <div>
          <span>Captions</span>
          <strong>{presentation.title}</strong>
        </div>
        <span className="caption-specialist-status-badge">
          {presentation.statusLabel}
        </span>
      </div>
      <p>{presentation.summary}</p>
      {!compact && presentation.details.length > 0 ? (
        <dl className="caption-specialist-status-facts">
          {presentation.details.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {presentation.revisionHint ? (
        <details className="caption-specialist-status-details">
          <summary>Caption review details</summary>
          <p>{presentation.revisionHint}</p>
          <p>
            Captions use this plan&apos;s approval and credit estimate. There is
            no separate Caption approval or charge.
          </p>
        </details>
      ) : null}
    </section>
  )
}
