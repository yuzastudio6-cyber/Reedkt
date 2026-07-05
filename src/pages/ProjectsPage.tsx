import { FolderPlus, Search } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProjectCard } from '../components/ProjectCard'
import { projects } from '../data/mockData'
import { createProjectHomePath } from '../lib/project-edit-session-navigation'
import { MOCK_PROJECT_HOME_PROJECT_ID } from '../lib/project-edit-session-project-home-ui-adapter'

const currentProjectPath = createProjectHomePath(MOCK_PROJECT_HOME_PROJECT_ID)

export function ProjectsPage() {
  return (
    <AppShell
      description="Projects are the top-level container. Create a project first, then create edits inside it."
      eyebrow="Projects"
      title="Projects"
    >
      <section className="projects-clean-header" data-testid="projects-clean-header">
        <div>
          <Badge accent="cyan">Clean workspace</Badge>
          <h2>Create or open a project</h2>
          <p>
            Keep source clips, edit briefs, upload state, approvals, previews, and versions attached to one project instead of scattering them across the app.
          </p>
        </div>
        <Button icon={FolderPlus} to="/projects/new" variant="primary">
          Create project
        </Button>
      </section>

      <section className="projects-clean-list" data-testid="projects-clean-list">
        <div className="projects-clean-toolbar">
          <span>
            <Search aria-hidden="true" size={17} />
            Search comes after project persistence is connected.
          </span>
          <Badge>{projects.length} sample projects</Badge>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </section>

      <Card className="projects-clean-current">
        <h3>Current project</h3>
        <p>Open the current project to continue the project-to-edit-to-upload flow.</p>
        <Button to={currentProjectPath} variant="secondary">
          Open current project
        </Button>
      </Card>
    </AppShell>
  )
}
