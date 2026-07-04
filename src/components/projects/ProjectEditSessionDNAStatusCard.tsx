import { ShieldCheck } from 'lucide-react'
import { Badge } from '../Badge'
import type { ProjectEditSessionPreferencePanelModel } from '../../types/project-edit-session-preference'

type ProjectEditSessionDNAStatusCardProps = {
  model: ProjectEditSessionPreferencePanelModel
}

export function ProjectEditSessionDNAStatusCard({ model }: ProjectEditSessionDNAStatusCardProps) {
  const blocked = model.blockedReasons.length > 0
  return (
    <section className="project-edit-session-preference-subcard" data-testid="edit-session-preference-dna-card">
      <div className="project-edit-session-preference-subcard__heading">
        <ShieldCheck aria-hidden="true" size={16} />
        <h4>Preference DNA</h4>
        <Badge accent={blocked ? 'danger' : model.dnaStatusLabel ? 'violet' : 'muted'}>
          {model.dnaStatusLabel ?? 'Legacy no-DNA'}
        </Badge>
      </div>
      <p>{model.dnaQAStatusLabel ?? 'No DNA QA package is active.'}</p>
      {model.requiresUserReview ? <p className="project-edit-session-preference-warning">Review required before approval.</p> : null}
      {blocked ? (
        <ul>
          {model.blockedReasons.slice(0, 3).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
