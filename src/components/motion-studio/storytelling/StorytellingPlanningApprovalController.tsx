import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getFrontendApiClientStatus } from '../../../backend/api/frontend-api-client'
import { useCanonicalEditJourney } from '../../../hooks/useCanonicalEditJourney'
import { useCanonicalPlanApproval } from '../../../hooks/useCanonicalPlanApproval'
import { useCanonicalPlanningPublication } from '../../../hooks/useCanonicalPlanningPublication'
import { useMockFootagePrep } from '../../../hooks/useMockFootagePrep'
import { useProjectPersistenceScope } from '../../../hooks/useProjectPersistenceScope'
import { useStorytellingStylePlanReview } from '../../../hooks/useStorytellingStylePlanReview'
import type { UseMotionStudioStorytellingWorkspaceHandoffResult } from '../../../hooks/useMotionStudioStorytellingWorkspaceHandoff'
import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from '../../../lib/approved-edit-execution-package-client'
import { canonicalPlanApprovalReadyForPresentedPlan } from '../../../lib/canonical-plan-approval-readiness'
import { runMockFootagePrep, type MockFootagePrepInput } from '../../../lib/footage-prep'
import { getDefaultFrameTemplateForAspectRatio } from '../../../lib/frame-layouts'
import { createEditReferenceDeterministicHash } from '../../../lib/edit-reference-deterministic-hash'
import type {
  LocalInternalEditSetupSnapshot,
  LocalInternalProjectHandoff,
} from '../../../lib/local-project-handoff'
import { createGuidedMockEditPlan } from '../../../lib/mock-planner/guided'
import {
  buildPlanningContext,
  createContextAwareMockEditPlan,
  createContextAwarePlannerInput,
} from '../../../lib/planning'
import {
  joinOrderedUserInstructions,
  normalizeOrderedUserInstructions,
} from '../../../lib/planning-input-safety'
import { createInitialSourceLibraryState } from '../../../lib/source-library'
import type { ContextAwareMockEditPlanResult, EditBriefState, EditBriefStatus, MediaKind } from '../../../types'
import type { MotionStudioProductionDto } from '../../../types/motion-studio'
import type {
  AspectRatio,
  CleanupPreference,
  ClipSource,
  EditLevel,
  EditPlan,
  PlannerInput,
  VisualPreference,
} from '../../../types/reeditpro'
import { Button } from '../../Button'
import { CanonicalPlanReviewController } from '../../editor/CanonicalPlanReviewController'
import {
  CleanupSetup,
  EditLevelSetup,
  FrameSetup,
  ReferenceSetup,
  VisualSetup,
} from '../../editor/CleanEditSetupSurface'
import { CleanPlanningPrepSurface } from '../../editor/CleanPlanningPrepSurface'
import { StorytellingStylePlanReviewSummary } from './StorytellingStylePlanReviewSummary'
import styles from './StorytellingDirectorWorkspace.module.css'

type StorytellingPlanningApprovalControllerProps = {
  handoff: LocalInternalProjectHandoff
  onDraftDirection: (direction: string) => void
  production: MotionStudioProductionDto
  updateHandoff: UseMotionStudioStorytellingWorkspaceHandoffResult['updateHandoff']
}

type StorytellingPlanDraft = {
  inputIdentity: string
  plan: EditPlan
  plannerInput: PlannerInput
  recovered: boolean
}

type StorytellingPlanRecoveryMarker = {
  schemaVersion: 'motion-studio.storytelling-plan-review-recovery.v1'
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  inputIdentity: string
  savedAt: string
}

const SOURCE_CLEANUP_OPTIONS: CleanupPreference[] = [
  'preserve_natural',
  'light_cleanup',
  'balanced_cleanup',
  'tight_retention_cleanup',
  'documentary_faithful',
  'custom',
]

const RECOVERABLE_CANONICAL_STAGES = new Set([
  'publication_request_required',
  'internal_publication_pending',
  'plan_approval_required',
  'approved_snapshot_available',
  'execution_in_progress',
  'private_review_assembly_required',
  'private_review_ready',
  'private_review_accepted',
  'revision_requested',
  'cancellation_pending',
  'replanning_required',
])

/**
 * Director-native adapter into ReeditPro's one canonical planning spine.
 *
 * Storytelling owns a distinct conversation and setup surface, while source
 * preparation, Edit Brief/context planning, plan publication, estimate,
 * approval, and immutable snapshot authority remain the shared Edit pipeline.
 */
export function StorytellingPlanningApprovalController({
  handoff,
  onDraftDirection,
  production,
  updateHandoff,
}: StorytellingPlanningApprovalControllerProps) {
  const scope = useProjectPersistenceScope()
  const runtime = getFrontendApiClientStatus()
  const backendConnected = !runtime.mockOnly && Boolean(runtime.apiBaseUrl)
  const setup = handoff.setup ?? {}
  const sourceMediaAssets = useMemo(
    () => [...(handoff.sourceMediaAssets ?? [])].sort((left, right) => left.uploadedOrder - right.uploadedOrder),
    [handoff.sourceMediaAssets],
  )
  const clips = useMemo(() => createStorytellingClips(sourceMediaAssets), [sourceMediaAssets])
  const directionHistory = useMemo(
    () => normalizeOrderedUserInstructions(
      setup.userInstructionHistory,
      setup.customInstructions,
    ),
    [setup.customInstructions, setup.userInstructionHistory],
  )
  const plannerInput = useMemo(
    () => createStorytellingPlannerInput(handoff, clips, directionHistory),
    [clips, directionHistory, handoff],
  )
  const inputIdentity = useMemo(() => createPlanInputIdentity({
    editBriefState: handoff.editBriefState,
    plannerInput,
    productionId: production.id,
    sourceMediaAssets,
  }), [handoff.editBriefState, plannerInput, production.id, sourceMediaAssets])
  const [planDraft, setPlanDraft] = useState<StorytellingPlanDraft | null>(null)
  const [planNote, setPlanNote] = useState<string>()
  const publicationAttemptRef = useRef<string | null>(null)
  const recoveryCheckedIdentityRef = useRef<string | null>(null)
  const {
    isRunning: footagePrepRunning,
    resetPrep,
    result: footagePrepResult,
    runPrep,
  } = useMockFootagePrep()

  // Journey discovery is intentionally independent from the local create-plan
  // button so a reload can recover existing canonical authority without POSTing
  // another handoff.
  const canonicalJourney = useCanonicalEditJourney({
    editSessionId: handoff.editSessionId,
    enabled: backendConnected,
    projectId: handoff.projectId,
    scope,
  })
  const planningPublication = useCanonicalPlanningPublication({
    editSessionId: handoff.editSessionId,
    enabled: backendConnected,
    onSaved: canonicalJourney.refresh,
    projectId: handoff.projectId,
    scope,
  })
  const planApproval = useCanonicalPlanApproval({
    editSessionId: handoff.editSessionId,
    enabled: backendConnected,
    projectId: handoff.projectId,
    scope,
  })
  const stylePlan = useStorytellingStylePlanReview({
    active: Boolean(planDraft),
    directionHistory,
    editLevel: plannerInput.editLevel,
    editSessionId: handoff.editSessionId,
    productionId: production.id,
    projectId: handoff.projectId,
    workspaceId: scope.workspaceId,
  })
  const savedRecoveryMarker = readPlanRecoveryMarker(handoff.projectId, handoff.editSessionId)
  const recoveryReadCanRetry = Boolean(
    savedRecoveryMarker &&
    (canonicalJourney.result?.status === 'not_found' || canonicalJourney.result?.status === 'unavailable'),
  )

  const resetPublication = planningPublication.reset
  const resetApproval = planApproval.reset
  const submitPublication = planningPublication.submit
  const retryPublication = planningPublication.retry

  const invalidatePlan = useCallback((message?: string) => {
    publicationAttemptRef.current = null
    removePlanRecoveryMarker(handoff.projectId, handoff.editSessionId)
    setPlanDraft(null)
    setPlanNote(message)
    resetPublication()
    resetApproval()
  }, [handoff.editSessionId, handoff.projectId, resetApproval, resetPublication])

  useEffect(() => {
    if (!planDraft || planDraft.inputIdentity === inputIdentity) return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        invalidatePlan('Storytelling inputs changed. Create a fresh plan and estimate before approval.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [inputIdentity, invalidatePlan, planDraft])

  useEffect(() => {
    if (
      !backendConnected ||
      planDraft ||
      canonicalJourney.loading ||
      canonicalJourney.refreshing ||
      recoveryCheckedIdentityRef.current === inputIdentity
    ) return

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      const marker = readPlanRecoveryMarker(handoff.projectId, handoff.editSessionId)
      if (!marker) {
        recoveryCheckedIdentityRef.current = inputIdentity
        return
      }
      if (!recoveryMarkerMatches(marker, {
        editSessionId: handoff.editSessionId,
        inputIdentity,
        productionId: production.id,
        projectId: handoff.projectId,
        workspaceId: scope.workspaceId,
      })) {
        recoveryCheckedIdentityRef.current = inputIdentity
        removePlanRecoveryMarker(handoff.projectId, handoff.editSessionId)
        setPlanNote('The saved Storytelling inputs changed. Create a fresh plan and estimate before approval.')
        return
      }

      if (!canonicalJourney.result) return
      if (canonicalJourney.result.status !== 'ready') {
        // A saved marker can briefly outrun the canonical journey projection
        // after publication or during a backend interruption. Keep this exact
        // identity eligible for an explicit refresh instead of converting a
        // temporary read into a permanent local decision.
        if (
          canonicalJourney.result.status === 'not_found' ||
          canonicalJourney.result.status === 'unavailable'
        ) return
        recoveryCheckedIdentityRef.current = inputIdentity
        return
      }

      const journey = canonicalJourney.result.journey
      if (!RECOVERABLE_CANONICAL_STAGES.has(journey.stage)) {
        recoveryCheckedIdentityRef.current = inputIdentity
        return
      }

      const recovered = rebuildStorytellingPlanDraft({
        editBriefState: handoff.editBriefState,
        handoff,
        inputIdentity,
        plannerInput,
        sourceMediaAssets,
      })
      if (!recovered) {
        recoveryCheckedIdentityRef.current = inputIdentity
        removePlanRecoveryMarker(handoff.projectId, handoff.editSessionId)
        setPlanNote('The saved Plan Review could not be matched to the current source and Edit Brief. Create a fresh plan.')
        return
      }
      recoveryCheckedIdentityRef.current = inputIdentity
      publicationAttemptRef.current = recovered.inputIdentity
      setPlanDraft({ ...recovered, recovered: true })
      setPlanNote('Restored the existing canonical Plan Review. No new planning handoff was submitted.')
    })
    return () => {
      cancelled = true
    }
  }, [
    backendConnected,
    canonicalJourney.loading,
    canonicalJourney.refreshing,
    canonicalJourney.result,
    handoff,
    inputIdentity,
    planDraft,
    plannerInput,
    production.id,
    scope.workspaceId,
    sourceMediaAssets,
  ])

  const stylePlanReviewInput = stylePlan.planReviewInput
  const publicationIdentity = useMemo(() => planDraft && stylePlanReviewInput
    ? JSON.stringify({
        inputIdentity: planDraft.inputIdentity,
        styleSelectionDigest: stylePlanReviewInput.styleSelection.selectionDigest,
        calibrationPlanDigest: stylePlanReviewInput.calibrationPlan.planDigest,
      })
    : null, [planDraft, stylePlanReviewInput])

  useEffect(() => {
    if (
      !backendConnected ||
      !planDraft ||
      planDraft.recovered ||
      !stylePlan.approvalReady ||
      !stylePlanReviewInput ||
      !publicationIdentity ||
      planningPublication.saving ||
      planningPublication.result ||
      publicationAttemptRef.current === publicationIdentity
    ) return

    // Set the ref synchronously before dispatch. React StrictMode may replay
    // the effect, but it cannot issue a second browser request for this plan.
    publicationAttemptRef.current = publicationIdentity
    const journey = canonicalJourney.result?.status === 'ready'
      ? canonicalJourney.result.journey
      : undefined
    void submitPublication({
      plan: planDraft.plan,
      plannerInput: planDraft.plannerInput,
      sourceMediaAssets,
      motionStudioStorytellingStylePlan: stylePlanReviewInput,
      ...(journey?.stage === 'revision_requested' ? { revisionJourney: journey } : {}),
    }).then((result) => {
      if (result.handoffSaved) {
        writePlanRecoveryMarker({
          schemaVersion: 'motion-studio.storytelling-plan-review-recovery.v1',
          workspaceId: scope.workspaceId,
          projectId: handoff.projectId,
          editSessionId: handoff.editSessionId,
          productionId: production.id,
          inputIdentity: planDraft.inputIdentity,
          savedAt: new Date().toISOString(),
        })
      } else if (!result.retryable) {
        removePlanRecoveryMarker(handoff.projectId, handoff.editSessionId)
      }
    })
  }, [
    backendConnected,
    canonicalJourney.result,
    handoff.editSessionId,
    handoff.projectId,
    planDraft,
    planningPublication.result,
    planningPublication.saving,
    production.id,
    publicationIdentity,
    scope.workspaceId,
    sourceMediaAssets,
    stylePlan.approvalReady,
    stylePlanReviewInput,
    submitPublication,
  ])

  const retryExactPublication = useCallback(async () => {
    if (publicationIdentity) publicationAttemptRef.current = publicationIdentity
    return retryPublication()
  }, [publicationIdentity, retryPublication])
  const reviewPublication = useMemo(() => ({
    ...planningPublication,
    retry: retryExactPublication,
  }), [planningPublication, retryExactPublication])

  const setupStage = resolveSetupStage(setup, sourceMediaAssets.length)
  if (!planDraft) {
    return (
      <div className={styles.planning} data-testid="storytelling-planning-controller">
        {setupStage !== 'ready' ? renderSetupStage({
          clips,
          handoff,
          persistSetup: (patch) => {
            setPlanNote(undefined)
            persistStorytellingSetup(handoff, patch, updateHandoff)
          },
          setup,
          setupStage,
        }) : sourceMediaAssets.length > 0 ? (
          <CleanPlanningPrepSurface
            canCreatePlan={Boolean(footagePrepResult)}
            createPlanBlockedReason={undefined}
            editBriefPlanImpactNotice={false}
            initialEditBriefState={handoff.editBriefState}
            isRunning={footagePrepRunning}
            onContextAwarePlanCreated={(result) => {
              const exactPlannerInput = createContextAwarePlannerInput(result.planningContext, plannerInput)
              setPlanNote(undefined)
              setPlanDraft({
                inputIdentity,
                plan: result.editPlan,
                plannerInput: exactPlannerInput,
                recovered: false,
              })
            }}
            onContextAwarePlanInvalidated={() => {
              if (planDraft) invalidatePlan('The planning context changed. Create a fresh plan and estimate.')
            }}
            onEditBriefStateChange={(state) => updateHandoff({ editBriefState: state })}
            onEditBriefStatusChange={noopEditBriefStatusChange}
            onRunPrep={() => {
              setPlanNote(undefined)
              runPrep(buildStorytellingFootagePrepInput({
                clips,
                projectId: handoff.projectId,
                sourceMediaAssets,
                userId: scope.backendUserId ?? scope.userId,
                workspaceId: scope.workspaceId,
              }))
            }}
            plannerInput={plannerInput}
            prepCanRun={clips.length > 0 && setup.sourceOrderConfirmed === true}
            result={footagePrepResult}
            scope={{
              workspaceId: scope.workspaceId,
              projectId: handoff.projectId,
              editSessionId: handoff.editSessionId,
            }}
          />
        ) : (
          <section className="clean-edit-step clean-prep-step" data-testid="storytelling-plan-preparation">
            <header className="clean-edit-step-header">
              <div>
                <span className="clean-edit-step-count">Ready to plan</span>
                <h2>Prepare the Storytelling plan</h2>
                <p>The prepared story, Director direction, frame, and editing choices enter the one canonical Plan Review without fabricating an upload.</p>
              </div>
            </header>
            <div className="clean-edit-step-actions clean-edit-step-actions-split">
              <span>Nothing is generated or charged until the exact plan and estimate are approved.</span>
              <Button onClick={() => {
                setPlanNote(undefined)
                setPlanDraft({
                  inputIdentity,
                  plan: createGuidedMockEditPlan(plannerInput),
                  plannerInput,
                  recovered: false,
                })
              }} variant="primary">Create edit plan</Button>
            </div>
          </section>
        )}
        {planNote ? <p className="clean-edit-inline-warning" role="status">{planNote}</p> : null}
        {recoveryReadCanRetry ? (
          <div className="clean-edit-step-actions">
            <Button
              disabled={canonicalJourney.loading || canonicalJourney.refreshing}
              onClick={canonicalJourney.refresh}
              variant="ghost"
            >
              {canonicalJourney.loading || canonicalJourney.refreshing
                ? 'Checking saved Plan Review…'
                : 'Check saved Plan Review again'}
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  const journey = canonicalJourney.result?.status === 'ready'
    ? canonicalJourney.result.journey
    : undefined
  const approvalRecorded = planApproval.result?.status === 'approved' || Boolean(
    journey?.plan?.status === 'approved' &&
    journey.plan.estimateStatus === 'approved' &&
    journey.approval,
  )
  const recoveredPresentedPlan = journey?.approvalAuthority && journey.plan
    ? {
        planId: journey.approvalAuthority.planId,
        planVersion: journey.plan.version,
        planHash: journey.approvalAuthority.expectedPlanHash,
      }
    : undefined
  const presentedPlan = planningPublication.result?.presentedPlan ?? recoveredPresentedPlan
  const publicationStatus = planningPublication.result?.status ?? (
    recoveredPresentedPlan ? 'plan_published_waiting_for_approval' : undefined
  )
  const canonicalApprovalReady = stylePlan.approvalReady && canonicalPlanApprovalReadyForPresentedPlan({
    backendConnected,
    journey,
    publicationStatus,
    presentedPlan,
    visibleMaximumCredits: planDraft.plan.creditEstimate.total,
  })
  const blockedLabel = approvalRecorded
    ? 'Plan approved'
    : !stylePlan.approvalReady
      ? 'Choose a Storytelling direction'
      : !backendConnected
        ? 'Saved plan authority required'
        : planningPublication.saving
          ? 'Saving exact plan…'
          : canonicalJourney.loading || canonicalJourney.refreshing
            ? 'Checking saved plan…'
            : canonicalApprovalReady
              ? 'Approve plan and estimate'
              : journey?.stage === 'publication_request_required' ||
                  planningPublication.result?.status === 'handoff_saved_waiting_for_compiler'
                ? 'Approval not ready'
                : planningPublication.result
                  ? 'Refresh saved plan'
                  : 'Waiting for saved plan'

  async function approve() {
    if (!canonicalApprovalReady || !journey) return
    await planApproval.approve(journey)
    canonicalJourney.refresh()
  }

  return (
    <div className={styles.planning} data-testid="storytelling-planning-controller">
      <CanonicalPlanReviewController
        approved={approvalRecorded}
        approvalAuthorityBlockedLabel={blockedLabel}
        approvalAuthorityReady={canonicalApprovalReady}
        onApprove={() => { void approve() }}
        onAskQuestion={() => onDraftDirection('I have a question about this Storytelling plan: ')}
        onLowerCost={() => onDraftDirection('Revise this Storytelling plan with a lower-cost approach while preserving professional quality. ')}
        onRemoveRealMotion={() => onDraftDirection('Simplify the motion treatment and prepare a fresh Storytelling plan and estimate. ')}
        onReviseSetup={() => {
          persistStorytellingSetup(handoff, { aspectRatioConfirmed: false }, updateHandoff)
          resetPrep()
          invalidatePlan()
        }}
        plan={planDraft.plan}
        planApproval={backendConnected ? planApproval : undefined}
        planningContextBlockedReason={!stylePlan.approvalReady
          ? stylePlan.message ?? 'Choose and verify one Storytelling motion direction before approval.'
          : undefined}
        planningContextReady={stylePlan.approvalReady}
        planningPublication={backendConnected && !planDraft.recovered ? reviewPublication : undefined}
        planSupplement={(
          <StorytellingStylePlanReviewSummary
            onChooseDirection={() => onDraftDirection('Use Editorial Collage as the motion direction for this story. ')}
            onRetry={() => { void stylePlan.refresh() }}
            stylePlan={stylePlan}
          />
        )}
        statusSupplement={(
          <>
            {planDraft.recovered ? (
              <p className="clean-edit-inline-warning" data-testid="storytelling-plan-review-recovered" role="status">
                Restored this exact saved Plan Review. No new planning handoff was submitted.
              </p>
            ) : null}
            {planNote ? <p className="clean-edit-inline-warning" role="status">{planNote}</p> : null}
          </>
        )}
      />
    </div>
  )
}

type SetupStage = 'source' | 'frame' | 'cleanup' | 'edit_level' | 'visual' | 'reference' | 'ready'

function resolveSetupStage(
  setup: LocalInternalEditSetupSnapshot,
  sourceCount: number,
): SetupStage {
  if (sourceCount > 0 && setup.sourceOrderConfirmed !== true) return 'source'
  if (setup.aspectRatio === undefined || setup.aspectRatio === 'let_ai_decide' || setup.aspectRatioConfirmed !== true) return 'frame'
  if (sourceCount > 0 && (!setup.cleanupPreference || setup.cleanupPreferenceConfirmed !== true)) return 'cleanup'
  if (!setup.editLevel || setup.editLevelConfirmed !== true) return 'edit_level'
  if (!setup.visualPreference || setup.visualPreferenceConfirmed !== true) return 'visual'
  if (setup.referenceAttached !== true && setup.referenceSkipped !== true) return 'reference'
  return 'ready'
}

function renderSetupStage(input: {
  clips: ClipSource[]
  handoff: LocalInternalProjectHandoff
  persistSetup: (patch: Partial<LocalInternalEditSetupSnapshot>) => void
  setup: LocalInternalEditSetupSnapshot
  setupStage: Exclude<SetupStage, 'ready'>
}) {
  const { clips, persistSetup, setup, setupStage } = input
  if (setupStage === 'source') {
    return (
      <section className="clean-edit-step" data-testid="source-summary">
        <header className="clean-edit-step-header">
          <div>
            <span className="clean-edit-step-count">Storytelling source</span>
            <h2>{clips.length === 1 ? 'Use this source video' : 'Confirm source order'}</h2>
            <p>Confirm the private source order for this Storytelling plan. Source changes remain in the Sources workspace.</p>
          </div>
          <span className="clean-edit-step-meta">{clips.length} source{clips.length === 1 ? '' : 's'}</span>
        </header>
        <div className="clean-source-list">
          {clips.map((clip) => (
            <div className="clean-source-row" key={clip.id}>
              <span className="clean-source-index">{clip.uploadedOrder}</span>
              <div className="clean-source-copy"><strong>{clip.fileName}</strong><span>{clip.duration} · {clip.detectedType}</span></div>
            </div>
          ))}
        </div>
        <div className="clean-edit-step-actions">
          <Button onClick={() => persistSetup({
            sourceOrderConfirmed: true,
            sourceSequenceMode: clips.length === 1 ? 'single_complete_video' : 'multi_clip_story_order',
          })} variant="primary">
            {clips.length === 1 ? 'Use this source' : 'Confirm order'}
          </Button>
        </div>
      </section>
    )
  }
  if (setupStage === 'frame') {
    return (
      <FrameSetup
        onConfirm={() => persistSetup({ aspectRatioConfirmed: true, aspectRatioSource: 'user_selected' })}
        onSelect={(aspectRatio: AspectRatio) => persistSetup({
          aspectRatio,
          aspectRatioConfirmed: false,
          aspectRatioSource: 'user_selected',
          frameTemplateType: getDefaultFrameTemplateForAspectRatio(aspectRatio).templateType,
        })}
        selected={setup.aspectRatio ?? 'let_ai_decide'}
      />
    )
  }
  if (setupStage === 'cleanup') {
    const selected = setup.cleanupPreference ?? 'balanced_cleanup'
    return (
      <CleanupSetup
        onConfirm={() => persistSetup({ cleanupPreference: selected, cleanupPreferenceConfirmed: true })}
        onSelect={(cleanupPreference) => persistSetup({ cleanupPreference, cleanupPreferenceConfirmed: false })}
        options={SOURCE_CLEANUP_OPTIONS}
        recommended="balanced_cleanup"
        selected={selected}
      />
    )
  }
  if (setupStage === 'edit_level') {
    const selected = setup.editLevel ?? 'pro'
    return (
      <EditLevelSetup
        onConfirm={() => persistSetup({ editLevel: selected, editLevelConfirmed: true })}
        onSelect={(editLevel: EditLevel) => persistSetup({ editLevel, editLevelConfirmed: false })}
        selected={selected}
      />
    )
  }
  if (setupStage === 'visual') {
    const selected = setup.visualPreference ?? 'more_stroke_motion'
    return (
      <VisualSetup
        onConfirm={() => persistSetup({ visualPreference: selected, visualPreferenceConfirmed: true })}
        onSelect={(visualPreference: VisualPreference) => persistSetup({ visualPreference, visualPreferenceConfirmed: false })}
        selected={selected}
      />
    )
  }
  return (
    <ReferenceSetup
      onAttach={() => persistSetup({ referenceAttached: true, referenceSkipped: false })}
      onChangeUrl={(referenceUrl) => persistSetup({ referenceAttached: false, referenceSkipped: false, referenceUrl })}
      onSkip={() => persistSetup({ referenceAttached: false, referenceSkipped: true })}
      onToggleFocus={(selection) => {
        const current = setup.referenceFocusSelections ?? []
        persistSetup({
          referenceFocusSelections: current.includes(selection)
            ? current.filter((item) => item !== selection)
            : [...current, selection],
        })
      }}
      selectedFocus={setup.referenceFocusSelections ?? []}
      url={setup.referenceUrl ?? ''}
    />
  )
}

function persistStorytellingSetup(
  handoff: LocalInternalProjectHandoff,
  patch: Partial<LocalInternalEditSetupSnapshot>,
  updateHandoff: UseMotionStudioStorytellingWorkspaceHandoffResult['updateHandoff'],
) {
  const setup = { ...handoff.setup, ...patch }
  const directions = normalizeOrderedUserInstructions(
    setup.userInstructionHistory,
    setup.customInstructions,
  )
  updateHandoff({
    setup: {
      ...setup,
      customInstructions: joinOrderedUserInstructions(directions),
      userInstructionHistory: directions,
    },
  })
}

function createStorytellingPlannerInput(
  handoff: LocalInternalProjectHandoff,
  clips: ClipSource[],
  directionHistory: readonly string[],
): PlannerInput {
  const setup = handoff.setup ?? {}
  const noUploadedSources = clips.length === 0
  const aspectRatio = setup.aspectRatio ?? 'let_ai_decide'
  return {
    projectName: handoff.editName ?? handoff.projectName,
    targetPlatform: setup.targetPlatform ?? 'custom',
    aspectRatio,
    aspectRatioConfirmed: setup.aspectRatioConfirmed === true,
    aspectRatioSource: setup.aspectRatioSource ?? 'user_selected',
    frameTemplateType: setup.frameTemplateType ?? getDefaultFrameTemplateForAspectRatio(aspectRatio).templateType,
    editingCategory: 'storytelling',
    workflowType: setup.workflowType ?? 'social_short_viral_clip',
    editLevel: setup.editLevel ?? 'pro',
    structurePreference: 'improve_if_needed',
    moodStyle: setup.moodStyle ?? 'emotional',
    visualPreference: setup.visualPreference ?? 'more_stroke_motion',
    referenceUrl: setup.referenceAttached ? setup.referenceUrl ?? '' : '',
    customInstructions: joinOrderedUserInstructions([...directionHistory]),
    userInstructionHistory: [...directionHistory],
    preferenceDefaultsApplied: setup.preferenceDefaultsApplied,
    preferenceSnapshotId: setup.preferenceSnapshotId,
    preferenceSnapshotAppliedAt: setup.preferenceSnapshotAppliedAt,
    preferencePersistenceSource: setup.preferencePersistenceSource,
    currentEditPreferenceOverrideKeys: setup.preferenceOverrideKeys,
    currentEditPreferenceRevision: setup.preferenceRevision,
    creditPreference: setup.creditPreference ?? 'balanced',
    clips,
    sourceSequenceMode: setup.sourceSequenceMode ?? (clips.length <= 1 ? 'single_complete_video' : 'multi_clip_story_order'),
    sourceOrderConfirmed: noUploadedSources || setup.sourceOrderConfirmed === true,
    cleanupPreference: setup.cleanupPreference ?? 'balanced_cleanup',
    cleanupPreferenceConfirmed: noUploadedSources || setup.cleanupPreferenceConfirmed === true,
  }
}

function createStorytellingClips(
  sourceMediaAssets: readonly ApprovedEditExecutionUploadedMediaSourceAssetClientInput[],
): ClipSource[] {
  return sourceMediaAssets.map((asset, index) => {
    const metadata = asset.sourceMetadata?.probeStatus === 'probed'
      ? asset.sourceMetadata
      : undefined
    return {
      id: asset.uploadedClipId ?? asset.sourceSequenceItemId ?? `storytelling-source-${index + 1}`,
      uploadedOrder: index + 1,
      fileName: asset.fileName,
      duration: formatDuration(metadata?.durationSeconds),
      detectedType: metadata?.hasVideo === false && metadata.hasAudio
        ? 'Private audio source'
        : 'Private Storytelling video source',
      notes: metadata?.width && metadata.height
        ? `Bound to the exact finalized private source record. ${metadata.width}x${metadata.height}.`
        : 'Bound to the exact finalized private source record for this named edit.',
      sourceRole: metadata?.hasVideo === false && metadata.hasAudio ? 'context' : 'main_story',
    }
  })
}

function buildStorytellingFootagePrepInput(input: {
  clips: ClipSource[]
  projectId: string
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  userId: string
  workspaceId: string
}): MockFootagePrepInput {
  const byOrder = new Map(input.sourceMediaAssets.map((asset) => [asset.uploadedOrder, asset]))
  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    sourceMedia: input.clips.map((clip, index) => {
      const asset = byOrder.get(clip.uploadedOrder || index + 1)
      const metadata = asset?.sourceMetadata?.probeStatus === 'probed' ? asset.sourceMetadata : undefined
      const mediaKind = mediaKindForSource(asset)
      return {
        mediaAssetId: asset?.mediaAssetId ?? asset?.sourceSequenceItemId ?? clip.id,
        label: `${index + 1}. ${clip.fileName}`,
        mediaKind,
        durationMs: mediaKind === 'image' ? 0 : Math.max(1000, Math.round((metadata?.durationSeconds ?? 9) * 1000)),
        width: metadata?.width,
        height: metadata?.height,
        frameRate: mediaKind === 'video' ? 30 : undefined,
        hasAudio: metadata?.hasAudio ?? asset?.mimeType.startsWith('audio/') ?? false,
      }
    }),
  }
}

function rebuildStorytellingPlanDraft(input: {
  editBriefState?: EditBriefState
  handoff: LocalInternalProjectHandoff
  inputIdentity: string
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
}): Omit<StorytellingPlanDraft, 'recovered'> | null {
  if (input.sourceMediaAssets.length === 0) {
    return {
      inputIdentity: input.inputIdentity,
      plan: createGuidedMockEditPlan(input.plannerInput),
      plannerInput: input.plannerInput,
    }
  }
  try {
    const clips = createStorytellingClips(input.sourceMediaAssets)
    const prepInput = buildStorytellingFootagePrepInput({
      clips,
      projectId: input.handoff.projectId,
      sourceMediaAssets: input.sourceMediaAssets,
      userId: input.editBriefState?.userId ?? 'storytelling-plan-recovery-user',
      workspaceId: input.handoff.workspaceId,
    })
    const prep = runMockFootagePrep(prepInput)
    const planningContext = buildPlanningContext({
      projectId: prep.cleanupPlan.projectId,
      workspaceId: prep.cleanupPlan.workspaceId,
      userId: prep.cleanupPlan.userId,
      cleanAssembly: prep.cleanAssembly,
      cleanAssemblySegments: prep.cleanAssemblySegments,
      sourceTimeMappings: prep.sourceTimeMappings,
      sourceLibraryState: createInitialSourceLibraryState(prep),
      editBriefState: input.editBriefState,
    })
    const result: ContextAwareMockEditPlanResult = createContextAwareMockEditPlan({
      planningContext,
      existingPlannerInput: input.plannerInput,
    })
    return {
      inputIdentity: input.inputIdentity,
      plan: result.editPlan,
      plannerInput: createContextAwarePlannerInput(result.planningContext, input.plannerInput),
    }
  } catch {
    return null
  }
}

function createPlanInputIdentity(input: {
  editBriefState?: EditBriefState
  plannerInput: PlannerInput
  productionId: string
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
}): string {
  const privateInput = {
    schemaVersion: 'motion-studio.storytelling-plan-input.v1',
    productionId: input.productionId,
    plannerInput: input.plannerInput,
    editBriefState: input.editBriefState ?? null,
    sourceMediaAssets: input.sourceMediaAssets.map((asset) => ({
      mediaAssetId: asset.mediaAssetId,
      sourceSequenceItemId: asset.sourceSequenceItemId,
      uploadedClipId: asset.uploadedClipId,
      uploadedOrder: asset.uploadedOrder,
      checksumSha256: asset.checksumSha256,
      byteSize: asset.byteSize,
      mimeType: asset.mimeType,
      sourceMetadata: asset.sourceMetadata,
    })),
  }
  return `storytelling-plan-input:${createEditReferenceDeterministicHash(privateInput)}`
}

function mediaKindForSource(
  asset: ApprovedEditExecutionUploadedMediaSourceAssetClientInput | undefined,
): MediaKind {
  const mimeType = asset?.mimeType.toLowerCase() ?? ''
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'unknown'
}

function formatDuration(durationSeconds: number | undefined): string {
  if (!durationSeconds || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return 'Pending analysis'
  const seconds = Math.max(1, Math.round(durationSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function noopEditBriefStatusChange(status: EditBriefStatus | null, ready: boolean) {
  void status
  void ready
}

function planRecoveryStorageKey(projectId: string, editSessionId: string): string {
  return `reeditpro.motion-storytelling-plan-review.v1:${projectId}:${editSessionId}`
}

function readPlanRecoveryMarker(
  projectId: string,
  editSessionId: string,
): StorytellingPlanRecoveryMarker | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(planRecoveryStorageKey(projectId, editSessionId))
    if (!raw) return null
    const marker = JSON.parse(raw) as Partial<StorytellingPlanRecoveryMarker>
    return marker.schemaVersion === 'motion-studio.storytelling-plan-review-recovery.v1' &&
      typeof marker.workspaceId === 'string' &&
      typeof marker.projectId === 'string' &&
      typeof marker.editSessionId === 'string' &&
      typeof marker.productionId === 'string' &&
      typeof marker.inputIdentity === 'string' &&
      /^storytelling-plan-input:[a-f0-9]{16}$/u.test(marker.inputIdentity) &&
      typeof marker.savedAt === 'string'
      ? marker as StorytellingPlanRecoveryMarker
      : null
  } catch {
    return null
  }
}

function writePlanRecoveryMarker(marker: StorytellingPlanRecoveryMarker) {
  try {
    globalThis.sessionStorage?.setItem(
      planRecoveryStorageKey(marker.projectId, marker.editSessionId),
      JSON.stringify(marker),
    )
  } catch {
    // The marker is only a credential-free browser recovery hint. Canonical
    // journey authority remains server-owned when storage is unavailable.
  }
}

function removePlanRecoveryMarker(projectId: string, editSessionId: string) {
  try {
    globalThis.sessionStorage?.removeItem(planRecoveryStorageKey(projectId, editSessionId))
  } catch {
    // No authority is lost; the next visit fails closed to fresh planning.
  }
}

function recoveryMarkerMatches(
  marker: StorytellingPlanRecoveryMarker,
  expected: Omit<StorytellingPlanRecoveryMarker, 'schemaVersion' | 'savedAt'>,
): boolean {
  return marker.workspaceId === expected.workspaceId &&
    marker.projectId === expected.projectId &&
    marker.editSessionId === expected.editSessionId &&
    marker.productionId === expected.productionId &&
    marker.inputIdentity === expected.inputIdentity
}
