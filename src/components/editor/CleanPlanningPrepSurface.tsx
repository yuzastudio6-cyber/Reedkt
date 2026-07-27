import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'
import type { MockFootagePrepResult } from '../../lib/footage-prep'
import { useEditBrief } from '../../hooks/useEditBrief'
import { usePlanningContext } from '../../hooks/usePlanningContext'
import { useSourceLibrary } from '../../hooks/useSourceLibrary'
import type { ContextAwareMockEditPlanResult, EditBriefState, EditBriefStatus } from '../../types'
import type { PlannerInput } from '../../types/reeditpro'
import type { CanonicalEditBriefScope } from '../../lib/edit-brief-authority-client'
import type {
  CanonicalEditBriefAudioPlanningInput,
} from '../../types/edit-brief-authority'
import { Button } from '../Button'
import { EditBriefPanel } from './edit-brief'
import { ProfessionalEditBriefWorkspace } from './edit-brief/ProfessionalEditBriefWorkspace'

export type CanonicalBriefPlanningGateState = {
  editBriefAudioPlanningInputs: CanonicalEditBriefAudioPlanningInput[]
  message: string
  ready: boolean
  status: string
}

type CleanPlanningPrepSurfaceProps = {
  active?: boolean
  briefWorkspaceActive?: boolean
  canonicalBriefPlanningGate?: CanonicalBriefPlanningGateState
  canCreatePlan: boolean
  createPlanBlockedReason?: string
  editBriefOpenRequestId?: number
  editBriefPlanImpactNotice?: boolean
  editBriefLocked?: boolean
  initialEditBriefState?: EditBriefState | null
  isRunning?: boolean
  onContextAwarePlanCreated: (result: ContextAwareMockEditPlanResult) => void
  onContextAwarePlanInvalidated: () => void
  onCloseEditBrief?: () => void
  onCanonicalBriefPlanningGateChange?: (state: CanonicalBriefPlanningGateState) => void
  onEditBriefStatusChange: (status: EditBriefStatus | null, ready: boolean) => void
  onEditBriefStateChange?: (state: EditBriefState) => void
  onOpenEditBrief?: () => void
  onRunPrep: () => void
  plannerInput: PlannerInput
  prepBlockedReason?: string
  prepCanRun: boolean
  result: MockFootagePrepResult | null
  scope: CanonicalEditBriefScope
  sourcePreviewFile?: File | null
}

function formatDuration(durationMs: number | undefined) {
  if (!durationMs || durationMs <= 0) return 'Duration pending'
  const seconds = Math.max(1, Math.round(durationMs / 1000))
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return minutes > 0 ? `${minutes}:${String(remainder).padStart(2, '0')}` : `${seconds}s`
}

export function CleanPlanningPrepSurface({
  active = true,
  briefWorkspaceActive = false,
  canonicalBriefPlanningGate,
  canCreatePlan,
  createPlanBlockedReason,
  editBriefOpenRequestId = 0,
  editBriefPlanImpactNotice = false,
  editBriefLocked = false,
  initialEditBriefState,
  isRunning = false,
  onContextAwarePlanCreated,
  onContextAwarePlanInvalidated,
  onCloseEditBrief,
  onCanonicalBriefPlanningGateChange,
  onEditBriefStatusChange,
  onEditBriefStateChange,
  onOpenEditBrief,
  onRunPrep,
  plannerInput,
  prepBlockedReason,
  prepCanRun,
  result,
  scope,
  sourcePreviewFile,
}: CleanPlanningPrepSurfaceProps) {
  const sourceLibrary = useSourceLibrary(result)
  const editBrief = useEditBrief(result, sourceLibrary.sourceLibraryState, true, {
    onStateChange: onEditBriefStateChange,
    readOnly: editBriefLocked,
    restoredState: initialEditBriefState,
  })
  const activeEditBriefState = editBrief.hasStarted ? editBrief.editBriefState : null
  const planningContext = usePlanningContext({
    editBriefState: activeEditBriefState,
    plannerInput,
    result,
    sourceLibraryState: sourceLibrary.sourceLibraryState,
  })
  const briefWorkspaceSurfaceRef = useRef<HTMLElement | null>(null)
  const editBriefWorkspaceRef = useRef<HTMLDivElement | null>(null)
  const lastOpenRequestRef = useRef(editBriefOpenRequestId)
  const pendingFocusRequestRef = useRef(false)
  const briefWorkspaceActiveRef = useRef(false)
  const [localCanonicalBriefPlanningGate, setLocalCanonicalBriefPlanningGate] =
    useState<CanonicalBriefPlanningGateState>({
      editBriefAudioPlanningInputs: [],
      message: 'The exact Edit Brief timeline has not been loaded yet.',
      ready: false,
      status: 'idle',
    })
  const handleLocalCanonicalBriefPlanningGateChange = useCallback(
    (state: CanonicalBriefPlanningGateState) => {
      setLocalCanonicalBriefPlanningGate((current) => (
        current.message === state.message
        && current.ready === state.ready
        && current.status === state.status
        && JSON.stringify(current.editBriefAudioPlanningInputs) ===
          JSON.stringify(state.editBriefAudioPlanningInputs)
          ? current
          : state
      ))
    },
    [],
  )
  const activeCanonicalBriefPlanningGate =
    canonicalBriefPlanningGate ?? localCanonicalBriefPlanningGate
  const handleCanonicalBriefPlanningGateChange =
    onCanonicalBriefPlanningGateChange ?? handleLocalCanonicalBriefPlanningGateChange
  const editBriefReadyForCanonicalPlan = !editBrief.hasStarted || Boolean(
    editBrief.editBrief?.status === 'ready'
    && activeCanonicalBriefPlanningGate.ready,
  )
  const canCreateExactPlan = canCreatePlan && editBriefReadyForCanonicalPlan

  useEffect(() => {
    onEditBriefStatusChange(
      editBrief.hasStarted ? editBrief.editBrief?.status ?? null : null,
      editBrief.hasStarted && Boolean(editBrief.readiness?.ready),
    )
  }, [
    editBrief.editBrief?.status,
    editBrief.hasStarted,
    editBrief.readiness?.ready,
    onEditBriefStatusChange,
  ])

  useEffect(() => {
    if (planningContext.planningContext && !planningContext.latestPlanResult) {
      onContextAwarePlanInvalidated()
    }
  }, [
    onContextAwarePlanInvalidated,
    planningContext.latestPlanResult,
    planningContext.planningContext,
  ])

  useEffect(() => {
    if (!result || editBriefOpenRequestId === lastOpenRequestRef.current) return
    lastOpenRequestRef.current = editBriefOpenRequestId
    pendingFocusRequestRef.current = true
    editBrief.openBrief()
    onOpenEditBrief?.()
  }, [editBrief, editBriefOpenRequestId, onOpenEditBrief, result])

  useEffect(() => {
    if (!briefWorkspaceActive || !result) {
      briefWorkspaceActiveRef.current = false
      return
    }
    if (briefWorkspaceActiveRef.current) return
    briefWorkspaceActiveRef.current = true
    pendingFocusRequestRef.current = true
    if (!editBrief.isOpen) editBrief.openBrief()
  }, [briefWorkspaceActive, editBrief, result])

  useEffect(() => {
    if (!editBrief.isOpen || !pendingFocusRequestRef.current) return
    pendingFocusRequestRef.current = false
    const focusFrame = window.requestAnimationFrame(() => {
      const workspace = briefWorkspaceActive
        ? briefWorkspaceSurfaceRef.current
        : editBriefWorkspaceRef.current
          ?.querySelector<HTMLElement>('[data-testid="professional-edit-brief-workspace"]')
      workspace?.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' })
      workspace?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(focusFrame)
  }, [briefWorkspaceActive, editBrief.isOpen, editBriefOpenRequestId])

  function handleToggleBrief() {
    if (onOpenEditBrief) {
      onOpenEditBrief()
      return
    }
    if (editBrief.isOpen) {
      editBrief.closeBrief()
      return
    }
    editBrief.openBrief()
  }

  function handleCloseBriefWorkspace() {
    editBrief.closeBrief()
    onCloseEditBrief?.()
  }

  function handleCreatePlan() {
    if (!canCreateExactPlan) return
    const nextPlan = planningContext.createPlanFromContext()
    if (nextPlan) onContextAwarePlanCreated(nextPlan)
  }

  const editBriefContent = editBrief.isOpen && (briefWorkspaceActive || !onOpenEditBrief) ? (
    <div className="clean-edit-brief" ref={editBriefWorkspaceRef}>
      {editBriefPlanImpactNotice ? (
        <p className="clean-edit-inline-warning" data-testid="edit-brief-plan-impact" role="note">
          Changes here require a fresh plan and credit approval before more editing runs.
        </p>
      ) : null}
      <ProfessionalEditBriefWorkspace
        editBrief={editBrief.editBrief}
        readOnly={editBriefLocked}
        onTimelineStarted={editBrief.startBrief}
        onPlanningAuthorityReadyChange={handleCanonicalBriefPlanningGateChange}
        scope={scope}
        sourceClips={plannerInput.clips}
        sourcePreviewFile={sourcePreviewFile}
        started={editBrief.hasStarted}
      >
        <EditBriefPanel
          activityEvents={editBrief.activityEvents}
          editBriefState={editBrief.editBriefState}
          onAddAvoidAsset={editBrief.addAvoidAsset}
          onAddAvoidNote={editBrief.addAvoidNote}
          onAddMustIncludeNote={editBrief.addMustIncludeNote}
          onAddMustUseAsset={editBrief.addMustUseAsset}
          onMarkReady={editBrief.markReady}
          onRemoveAvoidAsset={editBrief.removeAvoidAsset}
          onRemoveAvoidNote={editBrief.removeAvoidNote}
          onRemoveMustIncludeNote={editBrief.removeMustIncludeNote}
          onRemoveMustUseAsset={editBrief.removeMustUseAsset}
          onResetBrief={editBrief.resetBrief}
          onUpdateAudience={editBrief.updateAudience}
          onUpdateBRollPreference={editBrief.updateBRollPreference}
          onUpdateBrandNotes={editBrief.updateBrandNotes}
          onUpdateCaptionPreference={editBrief.updateCaptionPreference}
          onUpdateGoal={editBrief.updateGoal}
          onUpdateMusicPreference={editBrief.updateMusicPreference}
          onUpdatePacingPreference={editBrief.updatePacingPreference}
          onUpdatePlatforms={editBrief.updatePlatforms}
          onUpdateSpecialInstructions={editBrief.updateSpecialInstructions}
          onUpdateReferenceUrls={editBrief.updateReferenceUrls}
          onUpdateStyleKeywords={editBrief.updateStyleKeywords}
          onUpdateTargetDuration={editBrief.updateTargetDuration}
          readOnly={editBriefLocked}
          readiness={editBrief.readiness}
          sourceAssets={sourceLibrary.assets}
          summary={editBrief.summary}
        />
      </ProfessionalEditBriefWorkspace>
    </div>
  ) : null

  if (briefWorkspaceActive) {
    return (
      <section
        aria-label="Edit Brief"
        className="edit-brief-workspace-surface"
        data-testid="edit-brief-workspace-surface"
        id="edit-brief-workspace"
        ref={briefWorkspaceSurfaceRef}
        tabIndex={-1}
      >
        {!result ? (
          <div className="edit-brief-workspace-empty" role="status">
            <FileText aria-hidden="true" size={28} />
            <strong>Prepare the source in Chat first</strong>
            <p>The marker timeline opens only after this named edit has a prepared private source.</p>
            <Button onClick={handleCloseBriefWorkspace} variant="secondary">Go to Chat</Button>
          </div>
        ) : editBriefContent ?? (
          <p className="edit-brief-workspace-loading" role="status">Opening the Edit Brief timeline…</p>
        )}
      </section>
    )
  }

  if (!active) {
    if (!editBriefContent) return null
    return (
      <section className="clean-edit-step clean-edit-brief-only" data-testid="planning-preparation-brief">
        <header className="clean-edit-step-header">
          <div>
            <span className="clean-edit-step-count">Edit Brief</span>
            <h2>Update this edit’s direction</h2>
            <p>Changes remain editable, but the current plan is cleared until you create and approve a fresh one.</p>
          </div>
          <Button onClick={editBrief.closeBrief} variant="ghost">Close brief</Button>
        </header>
        {editBriefContent}
      </section>
    )
  }

  if (!result) {
    return (
      <section className="clean-edit-step clean-prep-step" data-testid="planning-preparation">
        <header className="clean-edit-step-header">
          <div>
            <span className="clean-edit-step-count">Ready to plan</span>
            <h2>Prepare the source</h2>
            <p>ReeditPro will create a private, non-destructive source assembly before building the plan.</p>
          </div>
          <Sparkles aria-hidden="true" size={20} />
        </header>
        {prepBlockedReason ? <p className="clean-edit-inline-warning">{prepBlockedReason}</p> : null}
        <div className="clean-edit-step-actions">
          <Button disabled={!prepCanRun || isRunning} onClick={onRunPrep} variant="primary">
            {isRunning ? 'Preparing source…' : 'Prepare source'}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="clean-edit-step clean-prep-step" data-testid="planning-preparation">
      <header className="clean-edit-step-header">
        <div>
          <span className="clean-edit-step-count">Source prepared</span>
          <h2>Ready to create the plan</h2>
          <p>Add an Edit Brief only if you want more control. It is optional.</p>
        </div>
        <div className="clean-prep-summary" aria-label="Prepared source summary">
          <strong>{result.footagePrepSession.sourceMediaIds.length} source{result.footagePrepSession.sourceMediaIds.length === 1 ? '' : 's'}</strong>
          <span>{formatDuration(result.cleanAssembly?.durationMs)}</span>
        </div>
      </header>

      <div className="clean-prep-actions">
        <Button icon={FileText} onClick={handleToggleBrief} variant="secondary">
          {editBrief.isOpen ? 'Close Edit Brief' : editBrief.hasStarted ? 'Edit Brief' : 'Add Edit Brief'}
        </Button>
        <span>
          {editBrief.hasStarted
            ? `Brief ${editBrief.editBrief?.status?.replaceAll('_', ' ') ?? 'started'}`
            : 'Optional · What this edit should accomplish'}
        </span>
      </div>

      {editBriefContent}

      {createPlanBlockedReason ? <p className="clean-edit-inline-warning">{createPlanBlockedReason}</p> : null}
      {!editBriefReadyForCanonicalPlan ? (
        <p className="clean-edit-inline-warning" data-testid="edit-brief-canonical-plan-gate" role="status">
          {editBrief.editBrief?.status !== 'ready'
            ? 'Finish the optional Edit Brief and choose Use Brief in Plan, or reset it before creating the plan.'
            : activeCanonicalBriefPlanningGate.message}
        </p>
      ) : null}
      {planningContext.hasBlockingIssues ? (
        <p className="clean-edit-inline-warning">{planningContext.readinessMessage}</p>
      ) : null}
      <div className="clean-edit-step-actions clean-edit-step-actions-split">
        <span>Credits remain untouched until you review and approve the completed plan.</span>
        <Button disabled={!canCreateExactPlan} onClick={handleCreatePlan} variant="primary">Create edit plan</Button>
      </div>
    </section>
  )
}
