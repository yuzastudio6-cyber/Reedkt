import { Badge } from '../Badge'
import type { ProjectEditSessionPreferencePanelModel } from '../../types/project-edit-session-preference'

type ProjectEditSessionPreferenceStatusCardProps = {
  model: ProjectEditSessionPreferencePanelModel
}

export function ProjectEditSessionPreferenceStatusCard({ model }: ProjectEditSessionPreferenceStatusCardProps) {
  const connectedReference = model.integrationStatus === 'connected_mock' && Boolean(model.applicationContext)
  const visibleBadges = connectedReference
    ? ['Target-adapted guidance', model.doNotCopyRules.length ? 'Do-not-copy active' : 'Boundaries unavailable', 'Planning only']
    : model.badges
  return (
    <section className="project-edit-session-preference-status-card" data-testid="edit-session-preference-status-card">
      <div className="project-edit-session-preference-status-card__heading">
        <div>
          <span className="section-eyebrow">Edit Preference</span>
          <h3>{model.selectedPreferenceHandle ?? model.selectedPreferenceName ?? 'No Edit Preference selected'}</h3>
        </div>
        <Badge accent={connectedReference || model.selectedPreferenceHandle ? 'cyan' : 'muted'}>
          {connectedReference ? 'Guidance active' : model.statusLabel}
        </Badge>
      </div>
      <div className="project-edit-session-preference-status-card__badges">
        {visibleBadges.map((badge) => (
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
