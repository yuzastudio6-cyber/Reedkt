import { useId } from 'react'
import {
  createCurrentEditReferenceApplicationView,
  type CurrentEditReferenceApplicationMappingItem,
  type CurrentEditReferenceApplicationResource,
} from '../../../lib/current-edit-reference-application-ui'
import { Button } from '../../Button'

export function CurrentEditReferenceApplicationStatus({
  expectedEditReferenceId,
  onReturnToChat,
  resource,
}: {
  expectedEditReferenceId: string
  onReturnToChat: () => void
  resource: CurrentEditReferenceApplicationResource
}) {
  const titleId = useId()
  const view = createCurrentEditReferenceApplicationView(resource, expectedEditReferenceId)
  const hasMapping = view.adapted.length + view.heldBack.length + view.safetyBoundaries.length > 0

  return (
    <section
      aria-busy={view.busy ? true : undefined}
      aria-labelledby={titleId}
      className="current-edit-reference-application"
      data-state={view.state}
      data-testid="current-edit-reference-application"
    >
      <header className="current-edit-reference-application__heading">
        <div>
          <span className="section-eyebrow">Target-aware guidance</span>
          <h3 id={titleId}>{view.title}</h3>
          <p aria-live={view.announcementAriaLive} role={view.announcementRole}>
            {view.description}
          </p>
        </div>
        <span className={`current-edit-reference-application__status is-${view.tone}`}>
          <span aria-hidden="true" />
          {view.statusLabel}
        </span>
      </header>

      {view.facts.length ? (
        <p className="current-edit-reference-application__facts">
          {view.facts.map((fact) => <span key={fact}>{fact}</span>)}
        </p>
      ) : null}

      {hasMapping ? (
        <details className="current-edit-reference-application__details">
          <summary>Review guidance mapping</summary>
          <div>
            <MappingSection items={view.adapted} title="Adapted for this edit" />
            <MappingSection items={view.heldBack} title="Held back" />
            <MappingSection items={view.safetyBoundaries} title="Copy-safety boundaries" />
          </div>
        </details>
      ) : null}

      {view.showReturnToChat ? (
        <div className="current-edit-reference-application__actions">
          <Button onClick={onReturnToChat} variant="secondary">Return to Chat</Button>
        </div>
      ) : null}
    </section>
  )
}

function MappingSection({
  items,
  title,
}: {
  items: CurrentEditReferenceApplicationMappingItem[]
  title: string
}) {
  if (!items.length) return null
  return (
    <section className="current-edit-reference-application__mapping-section">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
