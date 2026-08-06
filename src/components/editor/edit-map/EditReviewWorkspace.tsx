import { ElementInspector } from './ElementInspector'
import { EditMapEmptyState } from './EditMapEmptyState'
import { EditMapPanel } from './EditMapPanel'
import { EditMapToolbar } from './EditMapToolbar'
import { EditOperationHistoryCard } from './EditOperationHistoryCard'
import { InteractivePreview } from './InteractivePreview'
import type { ReactNode } from 'react'
import { Badge } from '../../Badge'
import { hideInternalToolNamesInCopy } from '../../../lib/tool-display-labels'
import {
  createProfessionalSkillDisplayModel,
  professionalSkillReviewContextSummary,
} from '../../../lib/professional-skills'
import type {
  BoundingBox,
  EditElement,
  EditGroup,
  EditMapSelectablePreviewElement,
  EditMapState,
  EditMapSummary,
  EditScope,
  EditSystem,
  ProfessionalSkillPlan,
} from '../../../types'

type ReviewDecisionState = 'accepted_for_internal_testing' | 'changes_requested' | null | undefined

type EditReviewWorkspaceProps = {
  editMapState: EditMapState | null
  manifestVerified?: boolean
  reviewDecision?: ReviewDecisionState
  reviewSummary?: string | null
  summary?: EditMapSummary | null
  skillPlan?: ProfessionalSkillPlan | null
  selectablePreviewElements?: EditMapSelectablePreviewElement[]
  selectedElement?: EditElement
  selectedGroup?: EditGroup
  selectedSystem?: EditSystem
  selectedLabel?: string
  availableScopes?: EditScope[]
  onCreateEditMap?: () => void
  onSelectElement?: (elementId: string) => void
  onSelectGroup?: (groupId: string) => void
  onSelectSystem?: (systemId: string) => void
  onChangeScope?: (scope: EditScope) => void
  onSetSystemVisibility?: (systemId: string, visible: boolean) => void
  onSetGroupVisibility?: (groupId: string, visible: boolean) => void
  onSetElementVisibility?: (elementId: string, visible: boolean) => void
  onToggleSelectedVisibility?: () => void
  onToggleSelectedLock?: () => void
  onUpdateGroupStyle?: (groupId: string, patch: Record<string, unknown>) => void
  onMoveElement?: (elementId: string, boundsPatch: Partial<BoundingBox>) => void
  onReplaceElementAsset?: (elementId: string, mediaAssetId: string) => void
  onRegenerateElement?: (elementId: string) => void
  onDeleteElement?: (elementId: string) => void
  onRestoreElement?: (elementId: string) => void
  onResetEditMap?: () => void
  revisionWorkflowSlot?: ReactNode
  exportWorkflowSlot?: ReactNode
  className?: string
}

export function EditReviewWorkspace({
  availableScopes = [],
  className = '',
  editMapState,
  onChangeScope,
  onCreateEditMap,
  onDeleteElement,
  onMoveElement,
  onRegenerateElement,
  onReplaceElementAsset,
  onResetEditMap,
  onRestoreElement,
  onSelectElement,
  onSelectGroup,
  onSelectSystem,
  onSetElementVisibility,
  onSetGroupVisibility,
  onSetSystemVisibility,
  onToggleSelectedLock,
  onToggleSelectedVisibility,
  onUpdateGroupStyle,
  selectablePreviewElements = [],
  selectedElement,
  selectedGroup,
  selectedLabel,
  selectedSystem,
  summary,
  manifestVerified = false,
  reviewDecision,
  reviewSummary,
  skillPlan,
  exportWorkflowSlot,
  revisionWorkflowSlot,
}: EditReviewWorkspaceProps) {
  if (!editMapState?.editDocument) {
    return (
      <EditMapEmptyState
        onCreateEditMap={onCreateEditMap}
        previewReady={Boolean(editMapState?.previewJobId)}
      />
    )
  }

  return (
    <section className={`edit-review-workspace ${className}`.trim()} data-testid="edit-review-workspace">
      <EditMapToolbar
        onCreateEditMap={onCreateEditMap}
        onResetEditMap={onResetEditMap}
        summary={summary}
      />
      <EditReviewDirectionCard
        manifestVerified={manifestVerified}
        reviewDecision={reviewDecision}
        reviewSummary={reviewSummary}
        skillPlan={skillPlan}
      />
      <section className="inline-chat-card edit-review-intro">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Edit Map</span>
            <h3>Select anything in the preview or map</h3>
          </div>
        </div>
        <p className="inline-helper">
          Select anything in the preview or map to edit connected systems, groups, and elements.
          These are local non-destructive operations. Re-rendered revisions come later.
        </p>
      </section>
      <div className="edit-review-layout">
        <InteractivePreview
          onSelectElement={onSelectElement}
          selectableElements={selectablePreviewElements}
          selectedElementId={selectedElement?.id}
        />
        <EditMapPanel
          activeSelection={editMapState.activeSelection}
          elements={editMapState.elements}
          groups={editMapState.groups}
          onSelectElement={onSelectElement}
          onSelectGroup={onSelectGroup}
          onSelectSystem={onSelectSystem}
          onSetElementVisibility={onSetElementVisibility}
          onSetGroupVisibility={onSetGroupVisibility}
          onSetSystemVisibility={onSetSystemVisibility}
          systems={editMapState.systems}
        />
      </div>
      <ElementInspector
        activeScope={editMapState.activeSelection?.activeScope}
        availableScopes={availableScopes}
        onChangeScope={onChangeScope}
        onDeleteElement={onDeleteElement}
        onMoveElement={onMoveElement}
        onRegenerateElement={onRegenerateElement}
        onReplaceElementAsset={onReplaceElementAsset}
        onRestoreElement={onRestoreElement}
        onToggleLock={onToggleSelectedLock}
        onToggleVisibility={onToggleSelectedVisibility}
        onUpdateGroupStyle={onUpdateGroupStyle}
        selectedElement={selectedElement}
        selectedGroup={selectedGroup}
        selectedLabel={selectedLabel}
        selectedSystem={selectedSystem}
      />
      <EditOperationHistoryCard
        onResetEditMap={onResetEditMap}
        operations={editMapState.operations}
      />
      {revisionWorkflowSlot}
      {exportWorkflowSlot}
    </section>
  )
}

function EditReviewDirectionCard({
  manifestVerified,
  reviewDecision,
  reviewSummary,
  skillPlan,
}: {
  manifestVerified: boolean
  reviewDecision: ReviewDecisionState
  reviewSummary?: string | null
  skillPlan?: ProfessionalSkillPlan | null
}) {
  const skillDisplay = skillPlan
    ? createProfessionalSkillDisplayModel(skillPlan, { activityLimit: 4, evidenceLimit: 3 })
    : null

  return (
    <section className="inline-chat-card edit-review-direction-card" data-testid="edit-review-direction-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Approved review context</span>
          <h3>Approved edit direction</h3>
        </div>
        <Badge accent={reviewDecision === 'changes_requested' ? 'warning' : reviewDecision ? 'success' : 'cyan'}>
          {reviewDecisionLabel(reviewDecision)}
        </Badge>
      </div>

      <p className="inline-helper">
        {skillPlan
          ? professionalSkillReviewContextSummary(skillPlan)
          : 'The review workspace keeps approved plan context attached while you inspect the edit and request changes.'}
      </p>

      <div className="edit-review-direction-meta" aria-label="Private review decision summary">
        <span><strong>{manifestVerified ? 'Verified' : 'Pending'}</strong><small>Review record</small></span>
        <span><strong>{reviewDecisionLabel(reviewDecision)}</strong><small>Decision</small></span>
        {skillPlan && <span><strong>{skillPlan.editBriefUsed ? 'Included' : 'Prompt-led'}</strong><small>Direction source</small></span>}
      </div>

      {skillDisplay && skillDisplay.activityItems.length > 0 && (
        <ul className="edit-review-direction-list">
          {skillDisplay.activityItems.map((group) => (
            <li key={group.id}>
              <span>{group.label}</span>
              {group.summary && <small>{group.summary}</small>}
            </li>
          ))}
        </ul>
      )}

      {skillDisplay && skillDisplay.evidenceItems.length > 0 && (
        <details className="edit-review-direction-evidence">
          <summary>Why this direction is attached</summary>
          <ul>
            {skillDisplay.evidenceItems.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <small>{item.summary}</small>
              </li>
            ))}
          </ul>
        </details>
      )}

      {reviewSummary && <p className="inline-helper">{hideInternalToolNamesInCopy(reviewSummary)}</p>}
      <p className="inline-helper">
        Local workspace changes are non-destructive. A new private review is required before any revised output is accepted.
      </p>
    </section>
  )
}

function reviewDecisionLabel(decision: ReviewDecisionState): string {
  if (decision === 'accepted_for_internal_testing') return 'Accepted'
  if (decision === 'changes_requested') return 'Changes requested'
  return 'Pending review'
}
