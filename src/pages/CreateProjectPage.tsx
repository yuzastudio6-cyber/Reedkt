import { ArrowRight, FolderPlus, MessageSquareText, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { createProjectHomePath } from '../lib/project-edit-session-navigation'
import { MOCK_PROJECT_HOME_PROJECT_ID } from '../lib/project-edit-session-project-home-ui-adapter'

const projectHomeWithNewEdit = `${createProjectHomePath(MOCK_PROJECT_HOME_PROJECT_ID)}?newEdit=1`

export function CreateProjectPage() {
  return (
    <AppShell
      description="Name the project, then create an edit inside it. Upload happens inside the edit workspace."
      eyebrow="New project"
      primaryAction="Open projects"
      primaryActionTo="/projects"
      title="Create a project"
    >
      <section className="project-start-shell project-start-shell-clean" data-testid="project-create-flow">
        <Card className="project-start-card">
          <div className="project-start-heading">
            <Badge accent="cyan">Step 1</Badge>
            <h2>Start with the project</h2>
            <p>
              A project is the container for every edit, source video, brief, preview, and version. Create the project first, then add the edit you want to work on.
            </p>
          </div>

          <label className="planning-field">
            <span>Project name</span>
            <input defaultValue="Untitled ReEditPro project" />
          </label>

          <div className="project-start-actions">
            <Button icon={FolderPlus} to={projectHomeWithNewEdit} variant="primary">
              Create project
            </Button>
            <Button icon={ArrowRight} to="/projects" variant="secondary">
              Back to projects
            </Button>
          </div>
        </Card>

        <aside className="project-start-side">
          <Card>
            <MessageSquareText aria-hidden="true" size={24} />
            <h3>Create an edit next</h3>
            <p>Inside the project, create a named edit workspace for the specific video you want ReEditPro to make.</p>
          </Card>
          <Card>
            <UploadCloud aria-hidden="true" size={24} />
            <h3>Upload inside the edit</h3>
            <p>Source video belongs to the edit workspace so planning, brief notes, preview, and review stay together.</p>
          </Card>
          <Card>
            <h3>Approval stays later</h3>
            <p>Planning and credit approval remain separate from project creation. Creating a project should not start tools or generation.</p>
          </Card>
        </aside>
      </section>
    </AppShell>
  )
}
