import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Clock3,
  Film,
  LockKeyhole,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router'

import { useMotionStudioStorytellingLibrary } from '../../hooks/useMotionStudioStorytellingLibrary'
import {
  formatStorytellingLibraryUpdate,
  type StorytellingLibraryItem,
} from '../../lib/motion-studio/storytelling/library-model'
import { motionStudioStorytellingWorkspaceRoute } from '../../lib/motion-studio/contracts/storytelling-workflow'
import { Button } from '../Button'
import styles from './MotionStudioHome.module.css'

interface MotionStudioHomeProps {
  onOpenStorytelling: () => void
}

export function MotionStudioHome({ onOpenStorytelling }: MotionStudioHomeProps) {
  return (
    <div className={styles.page} data-testid="motion-studio-home">
      <WorkflowLauncher onOpenStorytelling={onOpenStorytelling} />
    </div>
  )
}

function WorkflowLauncher({ onOpenStorytelling }: { onOpenStorytelling: () => void }) {
  return (
    <section aria-labelledby="motion-studio-workflow-heading" className={styles.launcher}>
      <header className={styles.sectionHeading}>
        <div>
          <h2 id="motion-studio-workflow-heading">Choose a workflow</h2>
          <p>Each workflow stays organized inside Motion Studio and opens its own dedicated creative workspace while retaining the same ReEditPro project identity.</p>
        </div>
      </header>

      <div className={styles.workflowList}>
        <article className={`${styles.workflowRow} ${styles.workflowAvailable}`}>
          <span aria-hidden="true" className={styles.workflowIcon}><BookOpenText size={22} /></span>
          <div className={styles.workflowCopy}>
            <span className={styles.currentLabel}>Motion Studio workflow</span>
            <h3>Open Storytelling</h3>
            <p>Develop an idea, research, script, or prepared package into a professional motion story.</p>
          </div>
          <Button icon={ArrowRight} onClick={onOpenStorytelling} variant="primary">
            Open Storytelling
          </Button>
        </article>

      </div>
    </section>
  )
}

export function MotionStudioStorytellingLibrary({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const library = useMotionStudioStorytellingLibrary()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()
  const nameErrorId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!createOpen) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [createOpen])

  function openCreate() {
    setName('')
    setErrorMessage(undefined)
    setCreateOpen(true)
  }

  function closeCreate() {
    if (library.creating) return
    setName('')
    setErrorMessage(undefined)
    setCreateOpen(false)
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = normalizeStorytellingName(name)
    if (!normalizedName) {
      setErrorMessage('Name the story before creating it.')
      inputRef.current?.focus()
      return
    }

    await createAndOpen(normalizedName, true)
  }

  async function createAndOpen(storyName: string, focusInputOnFailure = false) {
    setErrorMessage(undefined)
    try {
      const handoff = await library.createStorytelling(storyName)
      navigate(motionStudioStorytellingWorkspaceRoute(handoff.projectId, handoff.editSessionId))
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? error.message
        : 'The story could not be created. Nothing else was started.')
      if (focusInputOnFailure) inputRef.current?.focus()
    }
  }

  function discardInvalidCreateRecovery() {
    setErrorMessage(undefined)
    library.discardInvalidCreateRecovery()
    window.requestAnimationFrame(() => headingRef.current?.focus())
  }

  return (
    <section aria-labelledby="motion-studio-storytelling-heading" className={styles.storytelling}>
      <header className={styles.storytellingHeader}>
        <div className={styles.storytellingTitle}>
          <Button icon={ArrowLeft} onClick={onBack} variant="ghost">All workflows</Button>
          <div>
            <span className={styles.storytellingMark} aria-hidden="true"><BookOpenText size={20} /></span>
            <div>
              <h1 id="motion-studio-storytelling-heading" ref={headingRef} tabIndex={-1}>Storytelling</h1>
              <p>Continue an existing story or create a new one. Every story opens in its dedicated Storytelling Director Chat.</p>
            </div>
          </div>
        </div>
        {!createOpen && !library.pendingCreate && library.state === 'ready' && library.items.length > 0 && (
          <Button
            disabled={library.preferenceDefaultsLoading}
            icon={Plus}
            onClick={openCreate}
            variant="primary"
          >
            Create storytelling
          </Button>
        )}
      </header>

      {library.state === 'access_denied' ? (
        <StorytellingLibraryContent
          items={library.items}
          message={library.message}
          onCreate={openCreate}
          onResume={(item) => navigate(item.workspacePath)}
          onRetry={library.refresh}
          state={library.state}
        />
      ) : createOpen ? (
        <form className={styles.createPanel} onSubmit={(event) => { void submitCreate(event) }}>
          <div className={styles.createCopy}>
            <span className={styles.eyebrow}>New storytelling</span>
            <h2>Name the story</h2>
            <p>ReEditPro will create its project and named edit, then open the dedicated Director Chat to understand what you want to make.</p>
          </div>
          <label className={styles.field}>
            <span>Story name</span>
            <input
              aria-describedby={errorMessage ? nameErrorId : undefined}
              aria-invalid={Boolean(errorMessage)}
              disabled={library.creating}
              maxLength={80}
              onChange={(event) => {
                setName(event.currentTarget.value)
                if (errorMessage && normalizeStorytellingName(event.currentTarget.value)) {
                  setErrorMessage(undefined)
                }
              }}
              placeholder="The operation that changed everything"
              ref={inputRef}
              value={name}
            />
          </label>
          {errorMessage && <p className={styles.error} id={nameErrorId} role="alert">{errorMessage}</p>}
          <div className={styles.createActions}>
            <Button disabled={library.creating} icon={ArrowRight} type="submit" variant="primary">
              {library.creating ? 'Creating…' : 'Create and open Director Chat'}
            </Button>
            <Button disabled={library.creating} onClick={closeCreate} variant="ghost">Cancel</Button>
          </div>
          {library.creating && (
            <span aria-live="polite" className={styles.liveStatus} role="status">
              Creating the project and named edit…
            </span>
          )}
        </form>
      ) : library.pendingCreate ? (
        <StorytellingPendingCreate
          creating={library.creating}
          errorMessage={errorMessage}
          onDiscard={discardInvalidCreateRecovery}
          onResume={(storyName) => { void createAndOpen(storyName) }}
          pending={library.pendingCreate}
        />
      ) : (
        <StorytellingLibraryContent
          items={library.items}
          message={library.message}
          onCreate={openCreate}
          onResume={(item) => navigate(item.workspacePath)}
          onRetry={library.refresh}
          state={library.state}
        />
      )}
    </section>
  )
}

function StorytellingPendingCreate({
  creating,
  errorMessage,
  onDiscard,
  onResume,
  pending,
}: {
  creating: boolean
  errorMessage?: string
  onDiscard: () => void
  onResume: (name: string) => void
  pending: NonNullable<ReturnType<typeof useMotionStudioStorytellingLibrary>['pendingCreate']>
}) {
  if (pending.status === 'blocked') {
    return (
      <div
        className={`${styles.resourceState} ${styles.resourceBlocked}`}
        data-testid="motion-studio-library-pending-create-blocked"
        role="alert"
      >
        <span aria-hidden="true" className={styles.resourceIcon}><AlertTriangle size={23} /></span>
        <div>
          <h2>Story creation recovery is blocked</h2>
          <p>The saved browser recovery data could not be verified. Discarding it will reload account stories without deleting a saved project.</p>
        </div>
        <Button icon={Trash2} onClick={onDiscard} variant="secondary">Discard invalid recovery data</Button>
      </div>
    )
  }

  return (
    <div
      className={`${styles.resourceState} ${styles.resourcePending}`}
      data-testid="motion-studio-library-pending-create"
    >
      <span aria-hidden="true" className={styles.resourceIcon}><RefreshCw size={23} /></span>
      <div>
        <h2>Finish creating “{pending.name}”</h2>
        <p>{pending.projectCreated
          ? 'The exact project request is saved. ReEditPro will recheck it and finish saving the named edit before opening Director Chat.'
          : 'The exact create request is saved. Resume it so ReEditPro can confirm the project before opening Director Chat.'}</p>
        {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
      </div>
      <Button disabled={creating} icon={RefreshCw} onClick={() => onResume(pending.name)} variant="primary">
        {creating ? 'Resuming…' : 'Resume creation'}
      </Button>
    </div>
  )
}

function StorytellingLibraryContent({
  items,
  message,
  onCreate,
  onResume,
  onRetry,
  state,
}: {
  items: readonly StorytellingLibraryItem[]
  message?: string
  onCreate: () => void
  onResume: (item: StorytellingLibraryItem) => void
  onRetry: () => void
  state: ReturnType<typeof useMotionStudioStorytellingLibrary>['state']
}) {
  if (state === 'loading') {
    return (
      <div aria-live="polite" className={styles.resourceState} data-testid="motion-studio-library-loading" role="status">
        <span aria-hidden="true" className={styles.resourceIcon}><Film size={23} /></span>
        <div><h2>Loading your stories</h2><p>Recovering the Storytelling work attached to this workspace.</p></div>
      </div>
    )
  }

  if (state === 'access_denied') {
    return (
      <div className={`${styles.resourceState} ${styles.resourceBlocked}`} data-testid="motion-studio-library-access-denied" role="alert">
        <span aria-hidden="true" className={styles.resourceIcon}><LockKeyhole size={23} /></span>
        <div><h2>Storytelling is not available</h2><p>{message}</p></div>
      </div>
    )
  }

  if (state === 'unavailable') {
    return (
      <div className={`${styles.resourceState} ${styles.resourceBlocked}`} data-testid="motion-studio-library-unavailable" role="alert">
        <span aria-hidden="true" className={styles.resourceIcon}><AlertTriangle size={23} /></span>
        <div><h2>Your stories could not be loaded</h2><p>{message}</p></div>
        <Button icon={RefreshCw} onClick={onRetry} variant="secondary">Try again</Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={styles.resourceState} data-testid="motion-studio-library-empty">
        <span aria-hidden="true" className={styles.resourceIcon}><BookOpenText size={23} /></span>
        <div>
          <h2>No stories yet</h2>
          <p>Create the first Storytelling project and begin with an idea, research, a script, or a prepared package.</p>
        </div>
        <Button icon={Plus} onClick={onCreate} variant="primary">Create storytelling</Button>
      </div>
    )
  }

  return (
    <div className={styles.library} data-testid="motion-studio-storytelling-library">
      <div className={styles.libraryHeading}>
        <div>
          <strong>{items.length} stor{items.length === 1 ? 'y' : 'ies'}</strong>
          <span>Most recently updated first</span>
        </div>
        {message && <p aria-live="polite" role="status">{message}</p>}
      </div>
      <div className={styles.storyList}>
        {items.map((item) => (
          <StoryRow item={item} key={`${item.projectId}:${item.editSessionId}`} onResume={onResume} />
        ))}
      </div>
    </div>
  )
}

function StoryRow({
  item,
  onResume,
}: {
  item: StorytellingLibraryItem
  onResume: (item: StorytellingLibraryItem) => void
}) {
  return (
    <article className={styles.storyRow} data-testid={`motion-studio-story-${item.editSessionId}`}>
      <div className={styles.storyMain}>
        <span className={`${styles.status} ${styles[`status_${item.tone}`]}`}>
          <span aria-hidden="true" />
          {item.statusLabel}
        </span>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <div className={styles.storyMeta}>
          <span>{item.projectName}</span>
          <span><Clock3 aria-hidden="true" size={14} />{formatStorytellingLibraryUpdate(item.updatedAt)}</span>
          <span>{item.sourceFileCount > 0
            ? `${item.sourceFileCount} source ${item.sourceFileCount === 1 ? 'file' : 'files'}`
            : 'Idea-first'}</span>
        </div>
      </div>
      <Button icon={ArrowRight} onClick={() => onResume(item)} variant="secondary">Continue in Director Chat</Button>
    </article>
  )
}

function normalizeStorytellingName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 80)
}
