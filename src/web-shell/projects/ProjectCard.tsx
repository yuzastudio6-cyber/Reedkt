import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProjectRoutePath } from '../web-shell-routes'
import type { WebShellProject } from '../web-shell-types'
import { StatusBadge } from '../components/StatusBadge'

interface ProjectCardProps {
  project: WebShellProject
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="web-shell-panel web-shell-project-card">
      <div className="web-shell-panel-heading">
        <div>
          <p className="web-shell-eyebrow">Controlled project</p>
          <h2>{project.name}</h2>
        </div>
        <StatusBadge tone="private">
          <LockKeyhole aria-hidden="true" size={14} />
          Private
        </StatusBadge>
      </div>
      <p>{project.safetySummary}</p>
      <dl className="web-shell-meta-grid">
        <div>
          <dt>Owner</dt>
          <dd>{project.ownerLabel}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{project.sourceLabel}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{project.updatedLabel}</dd>
        </div>
      </dl>
      <ul className="web-shell-check-list">
        {project.chainSummary.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="web-shell-actions">
        <Link className="web-shell-button primary" to={getProjectRoutePath('editor_workspace', project.projectId)}>
          <span>Open editor shell</span>
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
        <Link className="web-shell-button" to={getProjectRoutePath('artifact_library', project.projectId)}>
          Review artifacts
        </Link>
      </div>
    </article>
  )
}
