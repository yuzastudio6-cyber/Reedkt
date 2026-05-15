import { MessageCircle, Plus, UploadCloud, UsersRound } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

const projectTypes = [
  'Let AI decide',
  'Social short',
  'Real estate / property tour',
  'Product demo',
  'Education / explainer',
  'Marketing ad',
]

export function CreateProjectPage() {
  return (
    <AppShell
      description="Create the project shell, then upload clips, add references, choose style, approve credits, and request edits inside the AI chat editor."
      eyebrow="New project"
      primaryAction="Open AI chat editor"
      title="Create project"
    >
      <section className="project-start-shell">
        <Card className="project-start-card">
          <div className="project-start-heading">
            <Badge accent="cyan">Chat-native editing</Badge>
            <h2>Start a project, then edit through chat</h2>
            <p>
              ReeditPro does not need a giant setup form. Create a project, open the AI chat editor, send clips in order, and approve the edit plan before credits are used.
            </p>
          </div>

          <label className="planning-field">
            <span>Project name</span>
            <input defaultValue="Premium property walkthrough" />
          </label>

          <label className="planning-field">
            <span>Optional project type</span>
            <select defaultValue="Real estate / property tour">
              {projectTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="planning-field">
            <span>Workspace / team</span>
            <select defaultValue="Creator workspace">
              <option>Creator workspace</option>
              <option>Business team placeholder</option>
              <option>Client workspace placeholder</option>
            </select>
          </label>

          <div className="project-start-actions">
            <Button icon={Plus} variant="secondary">Create project</Button>
            <Button icon={MessageCircle} to="/editor" variant="primary">Open AI chat editor</Button>
            <Button icon={UploadCloud} to="/editor" variant="ghost">Upload clips in chat</Button>
          </div>
        </Card>

        <aside className="project-start-side">
          <Card>
            <MessageCircle size={24} />
            <h3>Everything editing-related happens in chat</h3>
            <p>You can upload clips, add references, choose style, approve credits, and request edits inside the AI chat editor.</p>
          </Card>
          <Card>
            <UsersRound size={24} />
            <h3>Business placeholder</h3>
            <p>Team/client routing, Brand Kit defaults, and workspace permissions are mock-only until backend integration.</p>
          </Card>
          <Card>
            <h3>Core rule</h3>
            <p>Plan first. Approve credits. Then the AI edits in the background. This demo does not deduct real credits.</p>
          </Card>
        </aside>
      </section>
    </AppShell>
  )
}
