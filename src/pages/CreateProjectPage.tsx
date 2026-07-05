import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, FolderPlus, Loader2, MessageSquareText, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  createProjectBackendLocal,
  createProjectBackendLocalConfig,
} from '../lib/project-backend-local'

export function CreateProjectPage() {
  const navigate = useNavigate()
  const projectConfig = createProjectBackendLocalConfig(import.meta.env)
  const [projectName, setProjectName] = useState('Untitled ReEditPro project')
  const [status, setStatus] = useState(projectConfig.message)
  const [error, setError] = useState<string | undefined>()
  const [creating, setCreating] = useState(false)

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!projectConfig.available || !projectConfig.apiBaseUrl || creating) return

    setCreating(true)
    setError(undefined)
    setStatus('Creating project through the backend-local project gate...')

    try {
      const result = await createProjectBackendLocal({
        apiBaseUrl: projectConfig.apiBaseUrl,
        name: projectName,
        workspaceId: projectConfig.workspaceId,
      })
      setStatus(`${result.readback.name} created and read back. Opening the project so you can create an edit.`)
      navigate(`/projects/${encodeURIComponent(result.project.id)}?newEdit=1`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Project creation failed safely.')
      setStatus('Project creation failed safely. No edit, upload, tools, render, billing, or production work started.')
    } finally {
      setCreating(false)
    }
  }

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
          <form onSubmit={handleCreateProject}>
            <div className="project-start-heading">
              <Badge accent="cyan">Step 1</Badge>
              <h2>Start with the project</h2>
              <p>
                A project is the container for every edit, source video, brief, preview, and version. Create the project first, then add the edit you want to work on.
              </p>
            </div>

            <label className="planning-field">
              <span>Project name</span>
              <input
                data-testid="project-create-name-input"
                onChange={(event) => {
                  setProjectName(event.currentTarget.value)
                  setError(undefined)
                }}
                value={projectName}
              />
            </label>

            <div className="project-start-status" data-testid="project-create-status" role="status">
              <p>{status}</p>
              {projectConfig.warnings.map((warning) => <span key={warning}>{warning}</span>)}
              {error ? <strong>{error}</strong> : null}
            </div>

            <div className="project-start-actions">
              <Button disabled={!projectConfig.available || creating || !projectName.trim()} icon={creating ? Loader2 : FolderPlus} type="submit" variant="primary">
                {creating ? 'Creating project' : 'Create project'}
              </Button>
              <Button icon={ArrowRight} to="/projects" variant="secondary">
                Back to projects
              </Button>
            </div>
          </form>
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
