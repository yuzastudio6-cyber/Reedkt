import { Badge } from '../Badge'
import type { ProjectEditSessionRouteSection } from '../../types/project-edit-session-navigation'

type ProjectEditSessionRouteSectionHeaderProps = {
  section: ProjectEditSessionRouteSection
  summary: string
}

function labelFor(section: ProjectEditSessionRouteSection): string {
  if (section === 'project_home') return 'Project'
  if (section === 'legacy_editor') return 'Retired editor alias'
  return section.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ProjectEditSessionRouteSectionHeader({ section, summary }: ProjectEditSessionRouteSectionHeaderProps) {
  return (
    <section className="project-edit-session-route-section-header" data-testid="edit-session-route-section-header">
      <div>
        <span className="section-eyebrow">Edit section</span>
        <h2>{labelFor(section)}</h2>
        <p>{summary}</p>
      </div>
      <Badge accent={section === 'versions' || section === 'preview' ? 'warning' : 'cyan'}>
        {section === 'versions' || section === 'preview' ? 'Coming soon' : 'Available'}
      </Badge>
    </section>
  )
}
