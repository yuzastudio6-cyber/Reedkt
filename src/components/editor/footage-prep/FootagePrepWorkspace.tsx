import { useEffect, useRef } from 'react'
import type { MockFootagePrepResult } from '../../../lib/footage-prep'
import { useCleanupReview } from '../../../hooks/useCleanupReview'
import { useEditBrief } from '../../../hooks/useEditBrief'
import { useEditCues } from '../../../hooks/useEditCues'
import { useGenerationReadiness } from '../../../hooks/useGenerationReadiness'
import { usePlanningContext } from '../../../hooks/usePlanningContext'
import { useProfessionalIntegration } from '../../../hooks/useProfessionalIntegration'
import { useProfessionalQa } from '../../../hooks/useProfessionalQa'
import { useSourceLibrary } from '../../../hooks/useSourceLibrary'
import type {
  CleanAssembly,
  ContextAwareMockEditPlanResult,
  EditBriefStatus,
  EditCuesState,
  GenerationReadinessState,
  MockPreviewJob,
  PlanningContext,
  ProfessionalIntegrationState,
  ProfessionalQaState,
  SourceLibraryState,
} from '../../../types'
import type { PlannerInput } from '../../../types/reeditpro'
import { Button } from '../../Button'
import { EditBriefPanel } from '../edit-brief'
import { EditCuesPanel } from '../edit-cues'
import { GenerationReadinessPanel } from '../generation-readiness'
import { PlanningContextPanel } from '../planning-context'
import { ProfessionalIntegrationPanel } from '../professional-integration'
import { ProfessionalQaPanel } from '../professional-qa'
import { SourceLibraryPanel } from '../source-library'
import { CleanAssemblyPreviewCard } from './CleanAssemblyPreviewCard'
import { CleanupDecisionList } from './CleanupDecisionList'
import { CleanupReviewToolbar } from './CleanupReviewToolbar'
import { CleanupSummaryCard } from './CleanupSummaryCard'
import { FootagePrepEmptyState } from './FootagePrepEmptyState'
import { FootagePrepNextActions } from './FootagePrepNextActions'
import { FootagePrepProgressCard } from './FootagePrepProgressCard'
import { SourceUnderstandingCard } from './SourceUnderstandingCard'
import { ChevronUp, FileText, ListChecks } from 'lucide-react'

type FootagePrepWorkspaceProps = {
  result: MockFootagePrepResult | null
  canCreatePlanFromContext?: boolean
  createPlanBlockedReason?: string
  editBriefOpenRequestId?: number
  editBriefPlanImpactNotice?: boolean
  prepBlockedReason?: string
  prepCanRun?: boolean
  isRunning?: boolean
  onRunPrep?: () => void
  onContinueWithAiPlan?: () => void
  onAddEditBrief?: () => void
  onAddEditCues?: () => void
  onContextAwarePlanCreated?: (result: ContextAwareMockEditPlanResult) => void
  onContextAwarePlanInvalidated?: () => void
  onEditBriefStatusChange?: (status: EditBriefStatus | null, ready: boolean) => void
  onMockPreviewReady?: (payload: FootagePrepMockPreviewReadyPayload) => void
  onReviewCleanupDecisions?: () => void
  plannerInput?: PlannerInput
  className?: string
}

export type FootagePrepMockPreviewReadyPayload = {
  generationReadinessState: GenerationReadinessState
  previewJob: MockPreviewJob | null
  planningContext: PlanningContext | null
  professionalIntegrationState: ProfessionalIntegrationState | null
  professionalQaState: ProfessionalQaState | null
  editCuesState: EditCuesState | null
  sourceLibraryState: SourceLibraryState | null
  cleanAssembly: CleanAssembly | null
}

export function FootagePrepWorkspace({
  canCreatePlanFromContext = true,
  className = '',
  createPlanBlockedReason,
  editBriefOpenRequestId = 0,
  editBriefPlanImpactNotice = false,
  isRunning = false,
  onAddEditBrief,
  onAddEditCues,
  onContinueWithAiPlan,
  onContextAwarePlanCreated,
  onContextAwarePlanInvalidated,
  onEditBriefStatusChange,
  onMockPreviewReady,
  onReviewCleanupDecisions,
  onRunPrep,
  prepBlockedReason,
  prepCanRun = true,
  plannerInput,
  result,
}: FootagePrepWorkspaceProps) {
  const cleanupReview = useCleanupReview(result)
  const sourceLibrary = useSourceLibrary(result)
  const editBrief = useEditBrief(result, sourceLibrary.sourceLibraryState)
  const editBriefWorkspaceRef = useRef<HTMLDivElement | null>(null)
  const lastEditBriefOpenRequestIdRef = useRef(editBriefOpenRequestId)
  const pendingEditBriefFocusRequestRef = useRef(false)
  const activeEditBriefState = editBrief.hasStarted ? editBrief.editBriefState : null
  const activeCleanAssembly = cleanupReview.updatedCleanAssembly ?? result?.cleanAssembly ?? null
  const activeSourceTimeMappings = cleanupReview.updatedSourceTimeMappings.length > 0
    ? cleanupReview.updatedSourceTimeMappings
    : result?.sourceTimeMappings ?? []
  const editCues = useEditCues(result, sourceLibrary.sourceLibraryState, activeEditBriefState, {
    cleanAssembly: activeCleanAssembly,
    sourceTimeMappings: activeSourceTimeMappings,
  })
  const planningContext = usePlanningContext({
    result,
    cleanupReviewState: cleanupReview.reviewState,
    sourceLibraryState: sourceLibrary.sourceLibraryState,
    editBriefState: activeEditBriefState,
    editCuesState: editCues.editCuesState,
    editCueConflictState: editCues.conflictState,
    plannerInput,
  })
  const professionalIntegration = useProfessionalIntegration({
    planningContext: planningContext.planningContext,
    sourceLibraryState: sourceLibrary.sourceLibraryState,
    editCuesState: editCues.editCuesState,
    contextAwarePlanResult: planningContext.latestPlanResult,
  })
  const professionalQa = useProfessionalQa({
    planningContext: planningContext.planningContext,
    professionalIntegrationState: professionalIntegration.professionalIntegrationState,
    sourceLibraryState: sourceLibrary.sourceLibraryState,
    editCuesState: editCues.editCuesState,
    editCueConflictState: editCues.conflictState,
  })
  const generationReadiness = useGenerationReadiness({
    planningContext: planningContext.planningContext,
    contextAwarePlanResult: planningContext.latestPlanResult,
    professionalIntegrationState: professionalIntegration.professionalIntegrationState,
    professionalQaState: professionalQa.professionalQaState,
  })
  const hasUserEditedBriefDirection = Boolean(
    activeEditBriefState?.operations.some((operation) =>
      operation.type !== 'create_brief' &&
      operation.type !== 'mark_ready' &&
      operation.type !== 'reset_brief',
    ),
  )
  const editedBriefNeedsReady = Boolean(
    hasUserEditedBriefDirection &&
    activeEditBriefState?.editBrief.status !== 'ready' &&
    activeEditBriefState?.editBrief.status !== 'used_in_plan',
  )
  const localCreatePlanBlockedReason = [
    createPlanBlockedReason,
    editedBriefNeedsReady
      ? 'Draft Edit Brief changes are optional and will be treated as flexible direction until marked ready.'
      : '',
  ].filter(Boolean).join(' ')
  const localCanCreatePlanFromContext = canCreatePlanFromContext

  useEffect(() => {
    if (planningContext.planningContext && !planningContext.latestPlanResult) {
      onContextAwarePlanInvalidated?.()
    }
  }, [
    onContextAwarePlanInvalidated,
    planningContext.latestPlanResult,
    planningContext.planningContext,
  ])

  useEffect(() => {
    onEditBriefStatusChange?.(
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
    if (!result || editBriefOpenRequestId === lastEditBriefOpenRequestIdRef.current) {
      return
    }

    lastEditBriefOpenRequestIdRef.current = editBriefOpenRequestId
    pendingEditBriefFocusRequestRef.current = true
    editBrief.openBrief()
    onAddEditBrief?.()
  }, [editBrief, editBriefOpenRequestId, onAddEditBrief, result])

  useEffect(() => {
    if (!editBrief.isOpen || !pendingEditBriefFocusRequestRef.current) {
      return
    }

    const focusFrame = window.requestAnimationFrame(() => {
      const workspace = editBriefWorkspaceRef.current
      const focusTarget = workspace?.querySelector<HTMLElement>('[data-testid="edit-brief-goal-input"]')

      focusTarget?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      focusTarget?.focus({ preventScroll: true })
      pendingEditBriefFocusRequestRef.current = false
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [editBrief.isOpen, editBriefOpenRequestId])

  function handleAddEditBrief() {
    editBrief.openBrief()
    onAddEditBrief?.()
  }

  function handleAddEditCues() {
    editCues.openCues()
    onAddEditCues?.()
  }

  function handleCreatePlanFromContext() {
    if (!localCanCreatePlanFromContext) {
      return
    }

    const planResult = planningContext.createPlanFromContext()
    if (planResult) {
      onContextAwarePlanCreated?.(planResult)
    }
  }

  function handleContinueWithAiPlan() {
    handleCreatePlanFromContext()
    onContinueWithAiPlan?.()
  }

  function buildMockPreviewReadyPayload(state: GenerationReadinessState): FootagePrepMockPreviewReadyPayload {
    return {
      generationReadinessState: state,
      previewJob: state.previewJob,
      planningContext: planningContext.planningContext,
      professionalIntegrationState: professionalIntegration.professionalIntegrationState,
      professionalQaState: professionalQa.professionalQaState,
      editCuesState: editCues.editCuesState,
      sourceLibraryState: sourceLibrary.sourceLibraryState,
      cleanAssembly: activeCleanAssembly,
    }
  }

  function handleAdvanceMockPreviewJob() {
    const nextState = generationReadiness.advanceMockPreviewJobStep()
    if (nextState?.previewJob?.status === 'completed') {
      onMockPreviewReady?.(buildMockPreviewReadyPayload(nextState))
    }
  }

  function handleCompleteMockPreviewJob() {
    const nextState = generationReadiness.completeMockPreviewJob()
    if (nextState?.previewJob?.status === 'completed') {
      onMockPreviewReady?.(buildMockPreviewReadyPayload(nextState))
    }
  }

  if (!result) {
    return (
      <div className={className}>
        <FootagePrepEmptyState
          blockedReason={prepBlockedReason}
          canRunPrep={prepCanRun}
          isRunning={isRunning}
          onRunPrep={onRunPrep}
        />
      </div>
    )
  }

  return (
    <div className={`footage-prep-workspace ${className}`.trim()}>
      <FootagePrepProgressCard
        activityEvents={[
          ...result.activityEvents,
          ...cleanupReview.activityEvents,
          ...sourceLibrary.activityEvents,
          ...editBrief.activityEvents,
          ...editCues.activityEvents,
          ...planningContext.activityEvents,
          ...professionalIntegration.activityEvents,
          ...professionalQa.activityEvents,
          ...generationReadiness.activityEvents,
        ]}
        footagePrepSession={result.footagePrepSession}
        progressSnapshot={result.progressSnapshot}
      />

      <div className="footage-prep-summary-grid">
        <CleanupSummaryCard
          accepted={cleanupReview.accepted}
          cleanupPlan={result.cleanupPlan}
          cleanupReviewCard={result.cleanupReviewCard}
          operationCount={cleanupReview.reviewState?.operations.length ?? 0}
          prepSummary={result.prepSummary}
          updatedCleanDurationMs={cleanupReview.updatedCleanAssembly?.durationMs}
        />
        <SourceUnderstandingCard
          assetAnalysisReports={result.assetAnalysisReports}
          retakeGroups={result.retakeGroups}
          sceneSegments={result.sceneSegments}
          silenceRegions={result.silenceRegions}
          sourceQualityFlags={result.sourceQualityFlags}
          sourceUnderstandingMap={result.sourceUnderstandingMap}
          transcriptSegments={result.transcriptSegments}
        />
      </div>

      <CleanupReviewToolbar
        accepted={cleanupReview.accepted}
        onAcceptCleanup={cleanupReview.acceptCleanup}
        onResetAll={cleanupReview.resetAll}
        operationCount={cleanupReview.reviewState?.operations.length ?? 0}
      />

      <SourceLibraryPanel
        onAcceptSuggestion={sourceLibrary.acceptSuggestion}
        onConfirmLibrary={sourceLibrary.confirmLibrary}
        onMarkDoNotUse={sourceLibrary.markDoNotUse}
        onResetAll={sourceLibrary.resetAll}
        onResetAsset={sourceLibrary.resetAsset}
        onUpdateNotes={sourceLibrary.updateNotes}
        onUpdatePriority={sourceLibrary.updatePriority}
        onUpdateRole={sourceLibrary.updateRole}
        result={result}
        sourceLibraryState={sourceLibrary.sourceLibraryState}
        summary={sourceLibrary.summary}
      />

      <section className="inline-chat-card edit-brief-launch-card">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Edit Brief</span>
            <h3>{editBrief.editBrief?.status === 'ready' ? 'Edit Brief ready for planning' : 'Optional creative direction'}</h3>
          </div>
        </div>
        <p className="inline-helper">
          Optional structure for goal, platform, style, pacing, captions, music, and source boundaries.
        </p>
        <div className="edit-brief-launch-actions">
          <Button icon={editBrief.isOpen ? ChevronUp : FileText} onClick={editBrief.isOpen ? editBrief.closeBrief : handleAddEditBrief} variant="secondary">
            {editBrief.isOpen ? 'Hide Edit Brief' : 'Open Edit Brief'}
          </Button>
        </div>
      </section>

      {editBrief.isOpen && (
        <div id="edit-brief-workspace" ref={editBriefWorkspaceRef}>
          {editBriefPlanImpactNotice && (
            <p className="edit-brief-plan-impact" data-testid="edit-brief-plan-impact" role="note">
              Opening this brief does not change the current plan. Any edits require a fresh plan, credit estimate, and approval before more editing runs.
            </p>
          )}
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
            onUpdateStyleKeywords={editBrief.updateStyleKeywords}
            onUpdateTargetDuration={editBrief.updateTargetDuration}
            readiness={editBrief.readiness}
            sourceAssets={sourceLibrary.assets}
            summary={editBrief.summary}
          />
        </div>
      )}

      <section className="inline-chat-card edit-cues-launch-card">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Optional Edit Cues</span>
            <h3>{editCues.summary?.totalCues ? `${editCues.summary.totalCues} precise cues added` : 'Add moment-level planning instructions'}</h3>
          </div>
        </div>
        <p className="inline-helper">
          Place specific instructions on Clean Assembly time, transcript lines, scenes, assets, or global rules before AI creates the plan.
        </p>
        <div className="edit-cues-launch-actions">
          <Button icon={editCues.isOpen ? ChevronUp : ListChecks} onClick={editCues.isOpen ? editCues.closeCues : handleAddEditCues} variant="secondary">
            {editCues.isOpen ? 'Hide Edit Cues' : 'Open Edit Cues'}
          </Button>
        </div>
      </section>

      {editCues.isOpen && (
        <EditCuesPanel
          activityEvents={editCues.activityEvents}
          anchorOptions={editCues.anchorOptions}
          assetOptions={editCues.assetOptions}
          conflictState={editCues.conflictState}
          conflictSummary={editCues.conflictSummary}
          editCuesState={editCues.editCuesState}
          onAddAsset={editCues.addAsset}
          onAddTag={editCues.addTag}
          onCreateCue={editCues.createCue}
          onDeleteCue={editCues.deleteCue}
          onDuplicateCue={editCues.duplicateCue}
          onIgnoreConflict={editCues.ignoreConflict}
          onMarkReady={editCues.markReady}
          onRemapAllCues={editCues.remapAllCues}
          onRemapCue={editCues.remapCue}
          onRemoveAsset={editCues.removeAsset}
          onRemoveTag={editCues.removeTag}
          onResetAllConflicts={editCues.resetAllConflicts}
          onResetConflict={editCues.resetConflict}
          onResetCues={editCues.resetCues}
          onResolveConflict={editCues.resolveConflict}
          onUpdateAnchor={editCues.updateAnchor}
          onUpdateAudioBehavior={editCues.updateAudioBehavior}
          onUpdateInstructions={editCues.updateInstructions}
          onUpdatePriority={editCues.updatePriority}
          onUpdateRole={editCues.updateRole}
          onUpdateTimingFlexibility={editCues.updateTimingFlexibility}
          onUpdateTitle={editCues.updateTitle}
          onUpdateVisualBehavior={editCues.updateVisualBehavior}
          remapResults={editCues.remapResults}
          summary={editCues.summary}
          validationIssues={editCues.validationIssues}
        />
      )}

      <PlanningContextPanel
        canCreatePlanFromContext={localCanCreatePlanFromContext}
        createPlanBlockedReason={localCreatePlanBlockedReason}
        latestPlanResult={planningContext.latestPlanResult}
        onCreatePlanFromContext={handleCreatePlanFromContext}
        planningContext={planningContext.planningContext}
        readinessMessage={planningContext.readinessMessage}
        summary={planningContext.planningContextSummary}
      />

      <ProfessionalIntegrationPanel
        onAcceptAssetTreatment={professionalIntegration.acceptAssetTreatment}
        onAcceptBrollTreatment={professionalIntegration.acceptBrollTreatment}
        onAcceptCueCompliance={professionalIntegration.acceptCueCompliance}
        onAcceptOverlayTreatment={professionalIntegration.acceptOverlayTreatment}
        onAcceptProfessionalIntegration={professionalIntegration.acceptProfessionalIntegration}
        onCreateProfessionalIntegration={professionalIntegration.createProfessionalIntegration}
        onRegenerateProfessionalIntegration={professionalIntegration.regenerateProfessionalIntegration}
        onResetProfessionalIntegration={professionalIntegration.resetProfessionalIntegration}
        readinessMessage={professionalIntegration.readinessMessage}
        state={professionalIntegration.professionalIntegrationState}
      />

      <ProfessionalQaPanel
        canPreviewProceed={professionalQa.canPreviewProceed}
        onAcceptAllWarnings={professionalQa.acceptAllWarnings}
        onAcceptWarning={professionalQa.acceptWarning}
        onMarkReviewed={professionalQa.markReviewed}
        onRerunQa={professionalQa.rerunQa}
        onResetQa={professionalQa.resetQa}
        onRunQa={professionalQa.runQa}
        readinessMessage={professionalQa.readinessMessage}
        state={professionalQa.professionalQaState}
      />

      <GenerationReadinessPanel
        onAdvanceJob={handleAdvanceMockPreviewJob}
        onApproveGeneration={generationReadiness.approveGeneration}
        onCompleteJob={handleCompleteMockPreviewJob}
        onQueueMockPreviewJob={generationReadiness.queueMockPreviewJob}
        onRefresh={generationReadiness.refreshGenerationReadiness}
        onReset={generationReadiness.resetGenerationReadiness}
        state={generationReadiness.generationReadinessState}
      />

      <CleanAssemblyPreviewCard
        cleanAssembly={cleanupReview.updatedCleanAssembly ?? result.cleanAssembly}
        cleanAssemblySegments={cleanupReview.updatedCleanAssemblySegments.length > 0 ? cleanupReview.updatedCleanAssemblySegments : result.cleanAssemblySegments}
        sourceTimeMappings={cleanupReview.updatedSourceTimeMappings.length > 0 ? cleanupReview.updatedSourceTimeMappings : result.sourceTimeMappings}
      />

      <CleanupDecisionList
        cleanupPlan={result.cleanupPlan}
        cleanupPlanItems={result.cleanupPlanItems}
        itemStates={cleanupReview.reviewState?.itemStates}
        onAcceptItem={cleanupReview.acceptItem}
        onMarkDoNotUse={cleanupReview.markDoNotUse}
        onMarkImportant={cleanupReview.markImportant}
        onResetItem={cleanupReview.resetItem}
        onRestoreItem={cleanupReview.restoreItem}
      />

      <FootagePrepNextActions
        accepted={cleanupReview.accepted}
        cueCount={editCues.summary?.totalCues ?? 0}
        editBriefStatus={editBrief.editBrief?.status}
        onAddEditBrief={handleAddEditBrief}
        onAddEditCues={handleAddEditCues}
        onContinueWithAiPlan={handleContinueWithAiPlan}
        onReviewCleanupDecisions={onReviewCleanupDecisions}
      />
    </div>
  )
}
