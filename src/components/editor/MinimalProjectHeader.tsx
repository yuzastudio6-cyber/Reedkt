import { Bell, MoreHorizontal, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Badge } from '../Badge'
import { IconButton } from '../Button'
import { useAppShellChatToolbar } from '../AppShellChatToolbarContext'

type MinimalProjectHeaderProps = {
  approved: boolean
  credits: number
  onToggleSidebar?: () => void
  previewReady: boolean
  sidebarVisible?: boolean
}

export function MinimalProjectHeader({ approved, credits, onToggleSidebar, previewReady, sidebarVisible }: MinimalProjectHeaderProps) {
  const shellToolbar = useAppShellChatToolbar()
  const resolvedSidebarVisible = sidebarVisible ?? shellToolbar.sidebarVisible
  const handleToggleSidebar = onToggleSidebar ?? shellToolbar.toggleSidebar
  const SidebarToggleIcon = resolvedSidebarVisible ? PanelLeftClose : PanelLeftOpen
  const canToggleSidebar = Boolean(onToggleSidebar) || shellToolbar.sidebarToggleEnabled

  return (
    <header className="chat-project-strip" aria-label="Editor project status">
      <div className="chat-project-strip-main">
        <h1>Premium real estate short</h1>
        <div className="chat-project-status">
          <Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Plan approved' : 'Waiting for approval'}</Badge>
          <Badge accent={previewReady ? 'cyan' : 'muted'}>{previewReady ? 'Preview ready' : `${credits} estimated`}</Badge>
        </div>
      </div>
      <div className="chat-project-utility">
        {canToggleSidebar && (
          <IconButton
            className="sidebar-toggle-button"
            icon={SidebarToggleIcon}
            label={resolvedSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
            onClick={handleToggleSidebar}
          />
        )}
        <Badge accent="cyan">100 credits</Badge>
        <Badge accent="violet">Personal</Badge>
        <IconButton icon={Bell} label="Notifications" />
        <IconButton icon={MoreHorizontal} label="Project menu" />
      </div>
    </header>
  )
}
