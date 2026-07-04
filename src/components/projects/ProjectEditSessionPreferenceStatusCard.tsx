import { Badge } from '../Badge'
import type { ProjectEditSessionPreferencePanelModel } from '../../types/project-edit-session-preference'

type ProjectEditSessionPreferenceStatusCardProps = {
  model: ProjectEditSessionPreferencePanelModel
}

export function ProjectEditSessionPreferenceStatusCard({ model }: ProjectEditSessionPreferenceStatusCardProps) {
  return (
    <section className="project-edit-session-preference-status-card" data-testid="edit-session-preference-status-card">
      <div className="project-edit-session-preference-status-card__heading">
        <div>
          <span className="section-eyebrow">Edit Preference</span>
          <h3>{model.selectedPreferenceHandle ?? model.selectedPreferenceName ?? 'No Edit Preference selected'}</h3>
        </div>
        <Badge accent={model.selectedPreferenceHandle ? 'cyan' : 'muted'}>{model.statusLabel}</Badge>
      </div>
      <div className="project-edit-session-preference-status-card__badges">
        {model.badges.map((badge) => (
          <Badge accent={badge.toLowerCase().includes('blocked') ? 'danger' : badge.toLowerCase().includes('dna') ? 'violet' : 'muted'} key={badge}>
            {badge}
          </Badge>
        ))}
      </div>
      {model.selectedPreferenceName ? <p>{model.selectedPreferenceName}</p> : null}
      {model.warnings.length ? <p>{model.warnings[0]}</p> : null}
    </section>
  )
}
