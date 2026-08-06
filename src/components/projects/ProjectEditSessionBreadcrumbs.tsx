import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import type { ProjectEditSessionBreadcrumbItem } from '../../types/project-edit-session-navigation'

type ProjectEditSessionBreadcrumbsProps = {
  items: ProjectEditSessionBreadcrumbItem[]
}

export function ProjectEditSessionBreadcrumbs({ items }: ProjectEditSessionBreadcrumbsProps) {
  return (
    <nav aria-label="Project Edit Session breadcrumbs" className="project-edit-session-breadcrumbs" data-testid="edit-session-breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronRight aria-hidden="true" size={14} /> : null}
            {item.path && !item.current ? (
              <Link to={item.path}>{item.label}</Link>
            ) : (
              <span aria-current={item.current ? 'page' : undefined}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
