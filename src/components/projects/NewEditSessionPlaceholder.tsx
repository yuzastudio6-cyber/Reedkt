import { Plus, ShieldCheck } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import type { NewEditSessionPlaceholderModel } from '../../lib/project-edit-session-project-home-ui-adapter'

type NewEditSessionPlaceholderProps = {
  model: NewEditSessionPlaceholderModel
  visible: boolean
  onToggle: () => void
  lastCreatedName?: string
  lastCreatedRoute?: string
}

export function NewEditSessionPlaceholder({ lastCreatedName, lastCreatedRoute, model, onToggle, visible }: NewEditSessionPlaceholderProps) {
  return (
    <Card className="new-edit-session-placeholder" data-testid="new-edit-session-placeholder">
      <div>
        <span className="section-eyebrow">Mock create flow</span>
        <h2>{model.title}</h2>
        <p>{model.body}</p>
      </div>
      <div className="new-edit-session-placeholder__actions">
        <Button icon={Plus} onClick={onToggle} variant="primary">
          {visible ? 'Hide create panel' : 'Open create panel'}
        </Button>
        <Badge accent="warning">{model.nextMilestone}</Badge>
      </div>
      {visible ? (
        <div className="new-edit-session-placeholder__panel" data-testid="new-edit-session-placeholder-panel">
          <ShieldCheck aria-hidden="true" size={18} />
          <span>Create panel is open. No progress, preview, render, upload, provider, worker, or credit action will start.</span>
        </div>
      ) : null}
      {lastCreatedName ? (
        <div className="new-edit-session-placeholder__panel new-edit-session-placeholder__panel--success" data-testid="new-edit-session-created-note">
          <ShieldCheck aria-hidden="true" size={18} />
          <span>{lastCreatedName} was created in mock/local mode. Open the edit workspace when ready.</span>
          {lastCreatedRoute ? (
            <Button to={lastCreatedRoute} variant="secondary">
              Open edit
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
