import { ArrowRight, FolderPlus, MessageSquareText, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProjectCard } from '../components/ProjectCard'
import { projects } from '../data/mockData'
import { createProjectHomePath } from '../lib/project-edit-session-navigation'
import { MOCK_PROJECT_HOME_PROJECT_ID } from '../lib/project-edit-session-project-home-ui-adapter'

const featuredProjectPath = createProjectHomePath(MOCK_PROJECT_HOME_PROJECT_ID)

export function DashboardPage() {
  return (
    <AppShell
      description="Create a project, create an edit inside it, then upload and guide that edit from the edit workspace."
      eyebrow="Home"
      title="Start a clean ReEditPro edit"
    >
      <section className="home-flow-shell" data-testid="home-flow-shell">
        <Card className="home-flow-primary">
          <Badge accent="cyan">Project first</Badge>
          <h2>Every edit lives inside a project.</h2>
          <p>
            Keep ReEditPro simple: create a project, create an edit inside that project, then upload video and guide the edit from that edit workspace.
          </p>
          <div className="home-flow-actions">
            <Button icon={FolderPlus} to="/projects/new" variant="primary">
              Create project
            </Button>
            <Button icon={ArrowRight} to="/projects" variant="secondary">
              View projects
            </Button>
          </div>
        </Card>

        <div className="home-flow-steps" aria-label="ReEditPro edit flow">
          {[
            ['1', 'Create project', 'A project keeps all edits, source clips, notes, and versions together.'],
            ['2', 'Create edit', 'Each edit is its own workspace with brief, chat, upload, preview, and review state.'],
            ['3', 'Upload video', 'Upload or select source video inside the edit before planning and approval.'],
          ].map(([step, title, detail]) => (
            <Card className="home-flow-step" key={step}>
              <span>{step}</span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="home-current-project" data-testid="home-current-project">
        <div className="section-heading compact">
          <span className="section-eyebrow">Continue</span>
          <h2>Open the current project or create a fresh one</h2>
        </div>
        <div className="home-current-layout">
          <ProjectCard project={projects[0]} />
          <Card className="home-edit-entry-card">
            <UploadCloud aria-hidden="true" size={24} />
            <h3>Use the edit workspace for upload</h3>
            <p>
              The upload and edit brief should happen after a project and edit exist. That keeps testing clean and avoids duplicate editor entry points.
            </p>
            <Button icon={MessageSquareText} to={featuredProjectPath} variant="primary">
              Open project
            </Button>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}
