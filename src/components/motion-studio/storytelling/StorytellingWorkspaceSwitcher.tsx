import {
  AudioLines,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Images,
  Library,
  MessageCircle,
  MoreHorizontal,
  PanelsTopLeft,
  Play,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import {
  STORYTELLING_ADVANCED_WORKSPACES,
  STORYTELLING_PRIMARY_WORKSPACES,
  isStorytellingAdvancedWorkspace,
  storytellingWorkspaceLabel,
  type StorytellingAdvancedWorkspace,
  type StorytellingPrimaryWorkspace,
  type StorytellingWorkspace,
} from '../../../lib/motion-studio/storytelling-workspace-model'
import styles from './StorytellingWorkspaceSwitcher.module.css'

interface StorytellingWorkspaceSwitcherProps {
  activeWorkspace: StorytellingWorkspace
  onSelect: (workspace: StorytellingWorkspace) => void
  variant?: 'standalone' | 'header'
}

const primaryIcons: Record<StorytellingPrimaryWorkspace, LucideIcon> = {
  chat: MessageCircle,
  story: BookOpenText,
  scenes: PanelsTopLeft,
  preview: Play,
  review: CheckCircle2,
}

const advancedIcons: Record<StorytellingAdvancedWorkspace, LucideIcon> = {
  timeline: Clock3,
  assets: Images,
  audio: AudioLines,
  sources: Library,
}

export function StorytellingWorkspaceSwitcher({
  activeWorkspace,
  onSelect,
  variant = 'standalone',
}: StorytellingWorkspaceSwitcherProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const primaryRefs = useRef<Array<HTMLButtonElement | null>>([])
  const advancedRefs = useRef<Array<HTMLButtonElement | null>>([])
  const advancedActive = isStorytellingAdvancedWorkspace(activeWorkspace)

  useEffect(() => {
    if (!moreOpen) return
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMoreOpen(false)
      moreRef.current?.querySelector<HTMLButtonElement>('[data-storytelling-more-trigger]')?.focus()
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [moreOpen])

  function handlePrimaryKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    let nextIndex = index
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + STORYTELLING_PRIMARY_WORKSPACES.length) % STORYTELLING_PRIMARY_WORKSPACES.length
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % STORYTELLING_PRIMARY_WORKSPACES.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = STORYTELLING_PRIMARY_WORKSPACES.length - 1
    const nextWorkspace = STORYTELLING_PRIMARY_WORKSPACES[nextIndex]
    onSelect(nextWorkspace)
    primaryRefs.current[nextIndex]?.focus()
  }

  function openMoreAndFocus(index: number) {
    setMoreOpen(true)
    window.requestAnimationFrame(() => advancedRefs.current[index]?.focus())
  }

  function handleMoreTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    openMoreAndFocus(event.key === 'ArrowDown' ? 0 : STORYTELLING_ADVANCED_WORKSPACES.length - 1)
  }

  function handleAdvancedKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    let nextIndex = index
    if (event.key === 'ArrowDown') nextIndex = (index + 1) % STORYTELLING_ADVANCED_WORKSPACES.length
    if (event.key === 'ArrowUp') nextIndex = (index - 1 + STORYTELLING_ADVANCED_WORKSPACES.length) % STORYTELLING_ADVANCED_WORKSPACES.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = STORYTELLING_ADVANCED_WORKSPACES.length - 1
    advancedRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      className={`${styles.bar} ${variant === 'header' ? styles.headerBar : ''}`.trim()}
      data-testid="storytelling-workspace-switcher"
    >
      <div className={styles.context}>
        <span className={styles.mark} aria-hidden="true"><BookOpenText size={16} /></span>
        <span>Storytelling</span>
      </div>

      <nav aria-label="Storytelling workspaces" className={styles.navigation}>
        <div className={styles.primary} role="tablist" aria-label="Primary Storytelling workspaces">
          {STORYTELLING_PRIMARY_WORKSPACES.map((workspace, index) => {
            const Icon = primaryIcons[workspace]
            const selected = activeWorkspace === workspace
            return (
              <button
                aria-label={storytellingWorkspaceLabel(workspace)}
                aria-controls={workspace === 'chat' ? 'storytelling-chat-panel' : 'storytelling-workspace-panel'}
                aria-selected={selected}
                className={selected ? styles.activeTab : styles.tab}
                data-testid={`storytelling-workspace-${workspace}`}
                id={`storytelling-workspace-tab-${workspace}`}
                key={workspace}
                onClick={() => onSelect(workspace)}
                onKeyDown={(event) => handlePrimaryKeyDown(event, index)}
                ref={(node) => { primaryRefs.current[index] = node }}
                role="tab"
                tabIndex={selected || (advancedActive && workspace === 'chat') ? 0 : -1}
                title={storytellingWorkspaceLabel(workspace)}
                type="button"
              >
                <Icon aria-hidden="true" size={16} />
                <span>{storytellingWorkspaceLabel(workspace)}</span>
              </button>
            )
          })}
        </div>

        <div className={styles.more} ref={moreRef}>
          <button
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className={advancedActive ? styles.activeMoreTrigger : styles.moreTrigger}
            data-storytelling-more-trigger="true"
            data-testid="storytelling-workspace-more"
            onClick={() => setMoreOpen((current) => !current)}
            onKeyDown={handleMoreTriggerKeyDown}
            type="button"
          >
            <MoreHorizontal aria-hidden="true" size={17} />
            <span>{advancedActive ? storytellingWorkspaceLabel(activeWorkspace) : 'More'}</span>
          </button>
          {moreOpen ? (
            <div aria-label="Advanced Storytelling workspaces" className={styles.menu} role="menu">
              {STORYTELLING_ADVANCED_WORKSPACES.map((workspace, index) => {
                const Icon = advancedIcons[workspace]
                const selected = activeWorkspace === workspace
                return (
                  <button
                    aria-current={selected ? 'page' : undefined}
                    className={selected ? styles.activeMenuItem : styles.menuItem}
                    data-testid={`storytelling-workspace-${workspace}`}
                    key={workspace}
                    onClick={() => {
                      setMoreOpen(false)
                      onSelect(workspace)
                    }}
                    onKeyDown={(event) => handleAdvancedKeyDown(event, index)}
                    ref={(node) => { advancedRefs.current[index] = node }}
                    role="menuitem"
                    type="button"
                  >
                    <Icon aria-hidden="true" size={16} />
                    <span>{storytellingWorkspaceLabel(workspace)}</span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
