import { useParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { ProjectCard } from '../projects/ProjectCard'
import { sampleProject } from '../web-shell-fixtures'

export function ProjectDashboardPage() {
  const { projectId } = useParams()
  const isProjectOverview = Boolean(projectId)

  return (
    <div className="web-shell-page">
      <section className="web-shell-page-heading">
        <div>
          <p className="web-shell-eyebrow">{isProjectOverview ? 'Project overview' : 'Project dashboard'}</p>
          <h2>{isProjectOverview ? sampleProject.name : 'Projects'}</h2>
          <p>
            Controlled private project state is visible, while uploads, live backend jobs, public delivery, and broad
            real media remain disabled.
          </p>
        </div>
        <StatusBadge tone="private">Private test only</StatusBadge>
      </section>
      <ProjectCard project={sampleProject} />
    </div>
  )
}
