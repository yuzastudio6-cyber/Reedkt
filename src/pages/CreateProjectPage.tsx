import { ArrowRight, Check, FolderKanban } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { useProjectPersistenceScope } from '../hooks/useProjectPersistenceScope'
import { createLocalProjectRecord, saveLocalProjectRecord } from '../lib/local-projects'
import {
  createBackendProjectForInternalTesting,
  createProjectCreateIntentId,
} from '../lib/project-backend-sync'
import { launchEditingCategories } from '../lib/product-taxonomy'
import type { EditingCategory } from '../types/reeditpro'

const categoryDescriptions: Partial<Record<EditingCategory, string>> = {
  storytelling: 'Story, proof, personal, and case-based edits.',
  lifestyle: 'Creator, travel, fitness, food, motivation, and everyday videos.',
  business_brand: 'Product, service, offer, SaaS, ecommerce, agency, and brand videos.',
  education_explainer: 'Lessons, frameworks, tutorials, and step-by-step explainers.',
  documentary_case_study: 'Timelines, evidence, investigations, and case-study videos.',
}

export function CreateProjectPage() {
  const navigate = useNavigate()
  const projectPersistenceScope = useProjectPersistenceScope()
  const [projectName, setProjectName] = useState('')
  const [category, setCategory] = useState<EditingCategory>('storytelling')
  const [starting, setStarting] = useState(false)
  const [nameError, setNameError] = useState('')
  const [saveLabel, setSaveLabel] = useState('Nothing is created until you continue.')
  const createIntentIdRef = useRef(createProjectCreateIntentId())

  const selectedCategory = useMemo(
    () => launchEditingCategories.find((item) => item.value === category) ?? launchEditingCategories[0],
    [category],
  )

  async function handleStartEdit() {
    if (starting) return
    const normalizedProjectName = projectName.trim().replace(/\s+/g, ' ')
    if (!normalizedProjectName) {
      setNameError('Name the project before creating it.')
      return
    }

    setNameError('')
    setStarting(true)
    setSaveLabel('Creating project...')

    const backendProject = await createBackendProjectForInternalTesting({
      category,
      createIntentId: createIntentIdRef.current,
      projectName: normalizedProjectName,
      scope: projectPersistenceScope,
    })
    if (!backendProject && projectPersistenceScope.authMode === 'supabase') {
      setStarting(false)
      setSaveLabel('Project creation was not authorized. Revalidate the signed-in workspace and try again.')
      return
    }
    const project = createLocalProjectRecord({
      category,
      projectId: backendProject?.id ?? `local-project-${createIntentIdRef.current}`,
      name: normalizedProjectName,
      workspaceId: projectPersistenceScope.workspaceId,
    })
    saveLocalProjectRecord(projectPersistenceScope, project)
    setSaveLabel(backendProject
      ? 'Project created. Open it to add an edit.'
      : 'Project created locally. Account sync may be unavailable.')
    navigate(`/projects/${encodeURIComponent(project.id)}`)
  }

  return (
    <AppShell
      description="Create one organized workspace for the edits, source, approvals, and reviews that belong together."
      eyebrow="Projects"
      primaryAction={false}
      title="New project"
    >
      <section className="project-create-workspace" data-testid="project-create-flow">
        <form
          className="project-create-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void handleStartEdit()
          }}
        >
          <header className="project-create-form-heading">
            <span className="section-eyebrow">Project setup</span>
            <h2>What are you working on?</h2>
            <p>Name the workspace and choose the closest editing context. You can refine the brief and Edit Preferences inside each edit.</p>
          </header>

          <div className="project-create-fields">
            <label className="planning-field">
              <span>Project name</span>
              <input
                aria-describedby={nameError ? 'project-name-error' : 'project-name-help'}
                aria-invalid={Boolean(nameError)}
                autoFocus
                data-testid="project-create-name-input"
                disabled={starting}
                onChange={(event) => {
                  setProjectName(event.currentTarget.value)
                  setNameError('')
                  createIntentIdRef.current = createProjectCreateIntentId()
                }}
                placeholder="Example: Summer launch campaign"
                required
                value={projectName}
              />
              {nameError ? (
                <small className="project-create-error" id="project-name-error" role="alert">{nameError}</small>
              ) : (
                <small id="project-name-help">Use a client, campaign, or production name you will recognize later.</small>
              )}
            </label>

            <label className="planning-field">
              <span>Editing context</span>
              <select
                disabled={starting}
                onChange={(event) => {
                  setCategory(event.currentTarget.value as EditingCategory)
                  createIntentIdRef.current = createProjectCreateIntentId()
                }}
                value={category}
              >
                {launchEditingCategories.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <small>Context guides ReeditPro's questions; it never locks the creative direction.</small>
            </label>
          </div>

          <footer className="project-create-actions">
            <div>
              <Button disabled={starting} icon={ArrowRight} type="submit" variant="primary">
                {starting ? 'Creating project...' : 'Create project'}
              </Button>
              <Button disabled={starting} to="/projects" variant="ghost">Cancel</Button>
            </div>
            <span aria-live="polite">{saveLabel}</span>
          </footer>
        </form>

        <aside aria-label="What happens next" className="project-create-context">
          <div className="project-create-context-heading">
            <span className="project-create-context-icon"><FolderKanban aria-hidden="true" size={19} /></span>
            <div>
              <span className="section-eyebrow">Selected context</span>
              <h3>{selectedCategory.label}</h3>
            </div>
          </div>
          <p>{categoryDescriptions[selectedCategory.value] ?? selectedCategory.description}</p>

          <ol className="project-create-next-steps">
            <li><Check aria-hidden="true" size={15} /><span><strong>Create a named edit</strong><small>Keep versions and revisions attached to one deliverable.</small></span></li>
            <li><Check aria-hidden="true" size={15} /><span><strong>Add source video</strong><small>Uploading never starts editing or uses credits.</small></span></li>
            <li><Check aria-hidden="true" size={15} /><span><strong>Shape the plan</strong><small>Use Chat, Edit Brief, and Edit Preferences before approval.</small></span></li>
          </ol>
        </aside>
      </section>
    </AppShell>
  )
}
