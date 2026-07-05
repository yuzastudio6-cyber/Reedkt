import { Badge } from '../Badge'
import type { ProjectEditSessionRouteSection } from '../../types/project-edit-session-navigation'

type ProjectEditSessionRouteSectionHeaderProps = {
  section: ProjectEditSessionRouteSection
  summary: string
}

function labelFor(section: ProjectEditSessionRouteSection): string {
  if (section === 'project_home') return 'Project Home'
  if (section === 'legacy_editor') return 'Retired Editor Alias'
  return section.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ProjectEditSessionRouteSectionHeader({ section, summary }: ProjectEditSessionRouteSectionHeaderProps) {
  return (
    <section className="project-edit-session-route-section-header" data-testid="edit-session-route-section-header">
      <div>
        <span className="section-eyebrow">Route section</span>
        <h2>{labelFor(section)}</h2>
        <p>{summary}</p>
      </div>
      <Badge accent={section === 'versions' || section === 'preview' ? 'warning' : 'cyan'}>
        {section === 'versions' || section === 'preview' ? 'Future route slot' : 'Mock route'}
      </Badge>
    </section>
  )
}
