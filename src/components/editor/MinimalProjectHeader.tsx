import { ArrowLeft, FileText, MessageSquare, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../Button'
import { getInternalEditPersistenceStatusCopy } from '../../lib/internal-edit-persistence-copy'
import type { InternalEditPersistenceStatus } from '../../lib/local-project-handoff'
import type { EditBriefStatus } from '../../types'
import type { EditWorkspaceStage } from './EditWorkspaceProgressCard'

type MinimalProjectHeaderProps = {
  activeWorkspaceView?: 'chat' | 'preferences'
  currentEditPreferenceOverrideCount?: number
  editBriefAvailable?: boolean
  editBriefStatus?: EditBriefStatus | null
  editPreferencesAvailable?: boolean
  estimateReady: boolean
  onOpenChat?: () => void
  onOpenEditBrief?: () => void
  onOpenEditPreferences?: () => void
  onRetryPersistence?: () => void
  persistenceStatus?: InternalEditPersistenceStatus | null
  parentProjectName?: string
  projectPath?: string
  projectName?: string
  stage: EditWorkspaceStage
}

export function MinimalProjectHeader({
  activeWorkspaceView = 'chat',
  currentEditPreferenceOverrideCount = 0,
  editBriefAvailable = false,
  editBriefStatus = null,
  editPreferencesAvailable = false,
  estimateReady,
  onOpenChat,
  onOpenEditBrief,
  onOpenEditPreferences,
  onRetryPersistence,
  persistenceStatus = null,
  parentProjectName,
  projectPath,
  projectName = 'Untitled ReeditPro edit',
  stage,
}: MinimalProjectHeaderProps) {
  const status = headerStatus(stage)
  const editBriefState = headerEditBriefState(editBriefStatus)
  const estimateLabel = estimateReady ? 'Estimate in plan' : 'Estimate pending'
  const persistenceCopy = persistenceStatus
    ? getInternalEditPersistenceStatusCopy(persistenceStatus)
    : null
  const showPersistenceStatus = persistenceStatus?.status === 'saving' || persistenceStatus?.status === 'needs_retry'
  const showEditBriefStatus = editBriefState.label !== 'Optional'

  return (
    <header aria-label="Editor project status" className="chat-native-header" data-testid="editor-header">
      <div className="chat-native-header-copy">
        {projectPath && parentProjectName ? (
          <Link aria-label={`Back to ${parentProjectName}`} className="editor-project-back" to={projectPath}>
            <ArrowLeft aria-hidden="true" size={13} />
            <span>{parentProjectName}</span>
          </Link>
        ) : null}
        <h1>{projectName}</h1>
      </div>
      <div className="chat-native-header-actions">
        {editPreferencesAvailable && onOpenChat && onOpenEditPreferences ? (
          <nav aria-label="Edit workspace" className="editor-workspace-switcher" data-testid="edit-workspace-nav">
            <Button
              aria-current={activeWorkspaceView === 'chat' ? 'page' : undefined}
              data-testid="edit-workspace-view-chat"
              icon={MessageSquare}
              onClick={onOpenChat}
              size="sm"
              variant="ghost"
            >
              Chat
            </Button>
            {editBriefAvailable && onOpenEditBrief ? (
              <div className="editor-header-edit-brief-control">
                <Button
                  aria-controls="edit-brief-workspace"
                  aria-describedby={showEditBriefStatus ? 'editor-header-edit-brief-status' : undefined}
                  aria-label="Open Edit Brief"
                  className="editor-header-edit-brief-trigger"
                  data-testid="editor-header-edit-brief"
                  icon={FileText}
                  onClick={onOpenEditBrief}
                  size="sm"
                  variant="ghost"
                >
                  Edit Brief
                </Button>
                {showEditBriefStatus && (
                  <span
                    className={`editor-header-edit-brief-status editor-header-edit-brief-status-${editBriefState.tone}`}
                    data-testid="editor-header-edit-brief-status"
                    id="editor-header-edit-brief-status"
                  >
                    {editBriefState.label}
                  </span>
                )}
              </div>
            ) : null}
            <div className="editor-header-edit-brief-control editor-header-preferences-control">
              <Button
                aria-current={activeWorkspaceView === 'preferences' ? 'page' : undefined}
                aria-describedby={currentEditPreferenceOverrideCount > 0 ? 'editor-header-preferences-status' : undefined}
                data-testid="current-edit-preferences-trigger"
                icon={SlidersHorizontal}
                onClick={onOpenEditPreferences}
                size="sm"
                variant="ghost"
              >
                Edit Preferences
              </Button>
              {currentEditPreferenceOverrideCount > 0 && (
                <span
                  className="editor-header-edit-brief-status editor-header-edit-brief-status-warning"
                  data-testid="editor-header-preferences-status"
                  id="editor-header-preferences-status"
                >
                  {currentEditPreferenceOverrideCount} changed
                </span>
              )}
            </div>
          </nav>
        ) : editBriefAvailable && onOpenEditBrief ? (
          <div className="editor-header-edit-brief-control">
            <Button
              aria-controls="edit-brief-workspace"
              aria-describedby={showEditBriefStatus ? 'editor-header-edit-brief-status' : undefined}
              aria-label="Open Edit Brief"
              className="editor-header-edit-brief-trigger"
              data-testid="editor-header-edit-brief"
              icon={FileText}
              onClick={onOpenEditBrief}
              size="sm"
              variant="ghost"
            >
              Edit Brief
            </Button>
            {showEditBriefStatus && (
              <span
                className={`editor-header-edit-brief-status editor-header-edit-brief-status-${editBriefState.tone}`}
                data-testid="editor-header-edit-brief-status"
                id="editor-header-edit-brief-status"
              >
                {editBriefState.label}
              </span>
            )}
          </div>
        ) : null}
        {persistenceStatus && showPersistenceStatus && (
          <div
            className={`editor-header-persistence editor-header-persistence-${persistenceStatus.status}`}
            data-testid="editor-header-persistence"
            title={persistenceCopy?.title}
          >
            <span
              aria-live="polite"
              className="editor-header-persistence-status"
              data-testid="editor-header-persistence-status"
              role="status"
            >
              <span aria-hidden="true" className="editor-header-persistence-dot" />
              {persistenceCopy?.label}
            </span>
            {persistenceStatus.status === 'needs_retry' && onRetryPersistence && (
              <Button
                aria-label="Retry saving the latest edit state"
                data-testid="editor-header-persistence-retry"
                icon={RotateCcw}
                onClick={onRetryPersistence}
                size="sm"
                variant="ghost"
              >
                Retry
              </Button>
            )}
          </div>
        )}
        <div className="editor-header-state" aria-label="Edit status">
          <span className={`editor-header-stage editor-header-stage-${status.tone}`}>
            <span aria-hidden="true" />
            {status.label}
          </span>
          <span aria-hidden="true" className="editor-header-state-separator">·</span>
          <span className="editor-header-estimate">{estimateLabel}</span>
        </div>
      </div>
    </header>
  )
}

function headerEditBriefState(status: EditBriefStatus | null): {
  label: 'Optional' | 'Draft' | 'Ready'
  tone: 'muted' | 'warning' | 'success'
} {
  if (status === 'ready' || status === 'used_in_plan') {
    return { label: 'Ready', tone: 'success' }
  }

  if (status === 'draft' || status === 'superseded') {
    return { label: 'Draft', tone: 'warning' }
  }

  return { label: 'Optional', tone: 'muted' }
}

function headerStatus(stage: EditWorkspaceStage): {
  label: string
  tone: 'active' | 'attention' | 'neutral' | 'success'
} {
  if (stage === 'upload_required') return { label: 'Source needed', tone: 'neutral' }
  if (stage === 'planning_setup') return { label: 'Planning setup', tone: 'active' }
  if (stage === 'plan_review') return { label: 'Plan ready', tone: 'attention' }
  if (stage === 'approved_review_building') return { label: 'Plan + credits approved', tone: 'success' }
  if (stage === 'review_ready') return { label: 'Review ready', tone: 'success' }
  if (stage === 'revision_requested') return { label: 'Revision requested', tone: 'attention' }
  return { label: 'Needs attention', tone: 'attention' }
}
