import { Ban } from 'lucide-react'
import { Badge } from '../Badge'
import type { ProjectEditSessionPreferencePanelModel } from '../../types/project-edit-session-preference'

type ProjectEditSessionDoNotCopyRulesCardProps = {
  model: ProjectEditSessionPreferencePanelModel
}

export function ProjectEditSessionDoNotCopyRulesCard({ model }: ProjectEditSessionDoNotCopyRulesCardProps) {
  return (
    <section className="project-edit-session-preference-subcard" data-testid="edit-session-preference-do-not-copy-card">
      <div className="project-edit-session-preference-subcard__heading">
        <Ban aria-hidden="true" size={16} />
        <h4>Do-not-copy rules</h4>
        <Badge accent={model.doNotCopyRules.length ? 'success' : 'muted'}>
          {model.doNotCopyRules.length ? 'Active' : 'Not active'}
        </Badge>
      </div>
      {model.doNotCopyRules.length ? (
        <ul>
          {model.doNotCopyRules.slice(0, 4).map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      ) : (
        <p>Legacy no-DNA fallback. Saved preference metadata can guide the Edit Chat without DNA rules.</p>
      )}
    </section>
  )
}
