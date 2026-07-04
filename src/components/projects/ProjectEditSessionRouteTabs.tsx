import { Link } from 'react-router-dom'
import { Badge } from '../Badge'
import type { ProjectEditSessionRouteTab } from '../../types/project-edit-session-navigation'

type ProjectEditSessionRouteTabsProps = {
  tabs: ProjectEditSessionRouteTab[]
}

export function ProjectEditSessionRouteTabs({ tabs }: ProjectEditSessionRouteTabsProps) {
  return (
    <nav aria-label="Edit Chat route sections" className="project-edit-session-route-tabs" data-testid="edit-session-route-tabs">
      {tabs.map((tab) => {
        const className = `project-edit-session-route-tab ${tab.active ? 'is-active' : ''} ${tab.disabled ? 'is-disabled' : ''}`.trim()
        const content = (
          <>
            <span>{tab.label}</span>
            {tab.badge ? <Badge accent="cyan">{tab.badge}</Badge> : null}
          </>
        )

        if (tab.disabled || !tab.path) {
          return (
            <span aria-disabled="true" className={className} data-testid={`edit-session-route-tab-${tab.section}`} key={tab.section}>
              {content}
            </span>
          )
        }

        return (
          <Link
            aria-current={tab.active ? 'page' : undefined}
            className={className}
            data-testid={`edit-session-route-tab-${tab.section}`}
            key={tab.section}
            to={tab.path}
          >
            {content}
          </Link>
        )
      })}
    </nav>
  )
}
