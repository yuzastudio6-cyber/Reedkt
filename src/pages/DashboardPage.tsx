import { ArrowRight, FolderPlus, MessageSquareText, SlidersHorizontal, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

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
          <h2>Continue from the clean project workspace</h2>
        </div>
        <div className="home-current-layout">
          <Card className="home-edit-entry-card">
            <UploadCloud aria-hidden="true" size={24} />
            <h3>Open projects</h3>
            <p>
              Open a real project from backend-local readback, then create the edit and upload video inside that edit workspace.
            </p>
            <Button icon={MessageSquareText} to="/projects" variant="primary">
              View projects
            </Button>
          </Card>
          <Card className="home-edit-entry-card">
            <SlidersHorizontal aria-hidden="true" size={24} />
            <h3>Set preferences</h3>
            <p>
              Keep edit defaults in one place so each new project starts clean, then refine details inside the edit brief.
            </p>
            <Button icon={ArrowRight} to="/preferences" variant="secondary">
              Open preferences
            </Button>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}
