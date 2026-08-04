import { ArrowRight, Check, FolderKanban } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { useProjectPersistenceScope } from '../hooks/useProjectPersistenceScope'
import { createLocalProjectRecord, saveLocalProjectRecord } from '../lib/local-projects'
import {
  createBackendProjectForInternalTestingResult,
  createProjectCreateIntentId,
  normalizeProjectCreateIntentId,
} from '../lib/project-backend-sync'
import { buildProjectPersistenceScopeStorageKey } from '../lib/project-persistence-scope'
import { launchEditingCategories } from '../lib/product-taxonomy'
import type { EditingCategory } from '../types/reeditpro'

const PROJECT_CREATE_DRAFT_STORAGE_PREFIX = 'reeditpro.projectCreateDraft.v1'

type ProjectCreateDraft = {
  readonly version: 1
  readonly projectName: string
  readonly category: EditingCategory
  readonly createIntentId: string
}

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
  const draftStorageKey = useMemo(
    () => buildProjectPersistenceScopeStorageKey(
      PROJECT_CREATE_DRAFT_STORAGE_PREFIX,
      projectPersistenceScope,
    ),
    [projectPersistenceScope],
  )
  const initialDraft = useMemo(
    () => readProjectCreateDraft(draftStorageKey),
    [draftStorageKey],
  )
  const [projectName, setProjectName] = useState(initialDraft?.projectName ?? '')
  const [category, setCategory] = useState<EditingCategory>(
    initialDraft?.category ?? 'storytelling',
  )
  const [starting, setStarting] = useState(false)
  const [nameError, setNameError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saveLabel, setSaveLabel] = useState('Nothing is created until you continue.')
  const createIntentIdRef = useRef(
    initialDraft?.createIntentId ?? createProjectCreateIntentId(),
  )

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
    setSubmitError('')
    setStarting(true)
    setSaveLabel('Creating project...')
    persistProjectCreateDraft(draftStorageKey, {
      version: 1,
      projectName: normalizedProjectName,
      category,
      createIntentId: createIntentIdRef.current,
    })

    const backendResult = await createBackendProjectForInternalTestingResult({
      category,
      createIntentId: createIntentIdRef.current,
      projectName: normalizedProjectName,
      scope: projectPersistenceScope,
    })
    if (
      backendResult.status === 'failed'
      || (
        backendResult.status === 'not_configured'
        && projectPersistenceScope.authMode !== 'local_test'
      )
    ) {
      setStarting(false)
      setSubmitError(
        backendResult.status === 'failed'
          ? backendResult.errorMessage
          : 'Private workspace project creation is not configured. No local duplicate was created.',
      )
      setSaveLabel('Project not created. Your name and context are preserved for a safe retry.')
      return
    }
    const backendProjectId =
      backendResult.status === 'created' ? backendResult.projectId : undefined
    const project = createLocalProjectRecord({
      category,
      projectId: backendProjectId ?? `local-project-${createIntentIdRef.current}`,
      name: normalizedProjectName,
      workspaceId: projectPersistenceScope.workspaceId,
    })
    saveLocalProjectRecord(projectPersistenceScope, project)
    setSaveLabel(backendProjectId
      ? 'Project created. Open it to add an edit.'
      : 'Local-test project created. No account sync was attempted.')
    removeProjectCreateDraft(draftStorageKey)
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
                  const nextProjectName = event.currentTarget.value
                  const nextCreateIntentId = createProjectCreateIntentId()
                  setProjectName(nextProjectName)
                  setNameError('')
                  setSubmitError('')
                  createIntentIdRef.current = nextCreateIntentId
                  persistProjectCreateDraft(draftStorageKey, {
                    version: 1,
                    projectName: nextProjectName,
                    category,
                    createIntentId: nextCreateIntentId,
                  })
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
                  const nextCategory =
                    event.currentTarget.value as EditingCategory
                  const nextCreateIntentId = createProjectCreateIntentId()
                  setCategory(nextCategory)
                  setSubmitError('')
                  createIntentIdRef.current = nextCreateIntentId
                  persistProjectCreateDraft(draftStorageKey, {
                    version: 1,
                    projectName,
                    category: nextCategory,
                    createIntentId: nextCreateIntentId,
                  })
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
            <span
              aria-live="polite"
              className={submitError ? 'project-create-submit-error' : undefined}
              role={submitError ? 'alert' : undefined}
            >
              {submitError || saveLabel}
            </span>
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

function readProjectCreateDraft(
  storageKey: string,
): ProjectCreateDraft | undefined {
  if (typeof window === 'undefined') return
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(storageKey) ?? '')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    const draft = value as Record<string, unknown>
    if (
      draft.version !== 1
      || typeof draft.projectName !== 'string'
      || draft.projectName.length > 160
      || !isEditingCategory(draft.category)
      || typeof draft.createIntentId !== 'string'
      || !normalizeProjectCreateIntentId(draft.createIntentId)
    ) return
    return {
      version: 1,
      projectName: draft.projectName,
      category: draft.category,
      createIntentId: draft.createIntentId,
    }
  } catch {
    return
  }
}

function persistProjectCreateDraft(
  storageKey: string,
  draft: ProjectCreateDraft,
): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(draft))
  } catch {
    // The visible form state still preserves the draft for this mounted page.
  }
}

function removeProjectCreateDraft(storageKey: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(storageKey)
  } catch {
    // A stale recovery draft is safe because project creation is idempotent.
  }
}

function isEditingCategory(value: unknown): value is EditingCategory {
  return launchEditingCategories.some((category) => category.value === value)
}
