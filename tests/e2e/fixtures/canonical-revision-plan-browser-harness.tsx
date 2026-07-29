import { useCanonicalEditJourney } from '../../../src/hooks/useCanonicalEditJourney'
import { useCanonicalPlanApproval } from '../../../src/hooks/useCanonicalPlanApproval'
import { useCanonicalSourceLedCaptionRevision } from '../../../src/hooks/useCanonicalSourceLedCaptionRevision'
import { canonicalPlanApprovalReadyForPresentedPlan } from '../../../src/lib/canonical-plan-approval-readiness'
import { createGuidedMockEditPlan } from '../../../src/lib/mock-planner/guided'
import { buildProfessionalExportCreditCoverage } from '../../../src/lib/professional-export-policy'
import type { ProjectPersistenceScope } from '../../../src/lib/project-persistence-scope'
import type { EditPlan, PlannerInput } from '../../../src/types/reeditpro'
import { CanonicalJourneyStatusCard } from '../../../src/components/editor/CanonicalJourneyStatusCard'
import { CanonicalPlanApprovalStatus } from '../../../src/components/editor/CanonicalPlanApprovalStatus'
import { PlanReviewApprovalCard } from '../../../src/components/editor/PlanReviewApprovalCard'

const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const projectId = 'canonical-project-revision-browser'
const editSessionId = 'canonical-edit-revision-browser'
const plannerInput: PlannerInput = {
  projectName: 'Canonical revision browser proof',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'youtube_side_panel',
  editingCategory: 'business_brand',
  workflowType: 'product_demo',
  editLevel: 'pro',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions: 'Make the approved caption smaller while preserving source meaning and source order.',
  userInstructionHistory: [
    'Make the approved caption smaller while preserving source meaning and source order.',
  ],
  creditPreference: 'balanced',
  clips: [{
    id: 'canonical-revision-browser-clip',
    uploadedOrder: 1,
    fileName: 'canonical-revision-browser.mp4',
    duration: '00:02',
    detectedType: 'Primary source',
    sourceRole: 'main_story',
  }],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'preserve_natural',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'browser-revision-preference',
  currentEditPreferenceRevision: 0,
}
const plan = createExactRevisionPlan()

export function CanonicalRevisionPlanBrowserHarness() {
  const journey = useCanonicalEditJourney({
    editSessionId,
    enabled: true,
    projectId,
    scope,
  })
  const sourceLedCaptionRevision = useCanonicalSourceLedCaptionRevision({
    editSessionId,
    enabled: true,
    onPresented: journey.refresh,
    projectId,
    scope,
  })
  const approval = useCanonicalPlanApproval({
    editSessionId,
    enabled: true,
    projectId,
    scope,
  })
  const currentJourney = journey.result?.status === 'ready'
    ? journey.result.journey
    : undefined
  const sourceLedReceipt =
    sourceLedCaptionRevision.result?.status === 'ready'
      ? sourceLedCaptionRevision.result.receipt
      : undefined
  const authorityReady = canonicalPlanApprovalReadyForPresentedPlan({
    backendConnected: true,
    journey: currentJourney,
    publicationStatus: sourceLedReceipt
      ? 'plan_published_waiting_for_approval'
      : undefined,
    presentedPlan: sourceLedReceipt
      ? {
          planId: sourceLedReceipt.replacementPlanId,
          planVersion: sourceLedReceipt.replacementPlanVersion,
          planHash: sourceLedReceipt.replacementPlanHash,
        }
      : undefined,
    visibleMaximumCredits:
      currentJourney?.plan?.maximumCredits ?? plan.creditEstimate.total,
  })
  const approved = approval.result?.status === 'approved' || Boolean(
    currentJourney?.stage === 'approved_snapshot_available' &&
    currentJourney.plan?.version === 2,
  )

  async function handleApprove() {
    if (!currentJourney || !authorityReady) return
    const result = await approval.approve(currentJourney)
    if (result.status === 'approved') journey.refresh()
  }

  return (
    <main
      data-testid="editor-page"
      style={{ margin: '0 auto', maxWidth: 920, padding: '32px 20px 80px' }}
    >
      <CanonicalJourneyStatusCard
        {...journey}
        onPresentSourceLedCaptionRevision={() =>
          void sourceLedCaptionRevision.presentLatest()}
        sourceLedCaptionRevision={sourceLedCaptionRevision}
      />
      <PlanReviewApprovalCard
        approved={approved}
        approvalAuthorityBlockedLabel="Fresh approval required"
        approvalAuthorityReady={authorityReady}
        approvalAuthorityStatus={(
          <CanonicalPlanApprovalStatus
            approving={approval.approving}
            result={approval.result}
          />
        )}
        approvalPending={approval.approving}
        onApprove={() => void handleApprove()}
        onAskQuestion={() => undefined}
        onLowerCost={() => undefined}
        onRemoveRealMotion={() => undefined}
        onReviseSetup={() => undefined}
        plan={plan}
        planningContextReady
        visibleEstimateCredits={
          currentJourney?.plan?.maximumCredits ?? plan.creditEstimate.total
        }
      />
    </main>
  )
}

function createExactRevisionPlan(): EditPlan {
  const exactPlan = createGuidedMockEditPlan(plannerInput)
  const timing = exactPlan.masterTimingPlan!
  timing.timingBase = {
    ...timing.timingBase,
    fps: 24,
    totalDurationSeconds: 2,
    totalFrames: 48,
    sourceDurationSeconds: 2,
    finalDurationSeconds: 2,
  }
  timing.finalTimelineSegments = [{
    ...timing.finalTimelineSegments[0]!,
    segmentId: 'segment-1',
    finalRange: frameRange(0, 2, 0, 48),
  }]
  timing.captionTimingItems = [{
    ...timing.captionTimingItems[0]!,
    captionText: 'Approved revised caption',
    timeRange: frameRange(0, 2, 0, 48),
  }]
  timing.visualTimingItems = []
  timing.transitionTimingItems = []
  timing.sfxTimingItems = []
  timing.musicDuckingTimingItems = []
  timing.providerClipTimingItems = []
  const cleanupDecision = exactPlan.sourceCleanupPlan!.decisions[0]!
  cleanupDecision.selectedRange = frameRange(0, 2, 0, 48)
  cleanupDecision.sourceRange = {
    clipId: plannerInput.clips[0]!.id,
    startSeconds: 0,
    endSeconds: 2,
    durationSeconds: 2,
    startFrame: 0,
    endFrame: 48,
    notes: [],
  }
  cleanupDecision.decision = 'preserve'
  cleanupDecision.riskLevel = 'low'
  exactPlan.visualAssetPlan = []
  exactPlan.providerPromptPlans = []
  exactPlan.segmentEditPlans = []
  exactPlan.colorPipelinePlan = undefined
  exactPlan.audioPipelinePlan = undefined
  synchronizeProfessionalExportCoverage(exactPlan)
  return exactPlan
}

function synchronizeProfessionalExportCoverage(plan: EditPlan): void {
  const timingBase = plan.masterTimingPlan?.timingBase
  const approvedAspectRatio = plannerInput.aspectRatio
  if (!timingBase || approvedAspectRatio === 'let_ai_decide') {
    throw new Error('Canonical revision fixture requires confirmed timing and output frame authority.')
  }
  const coverage = buildProfessionalExportCreditCoverage({
    durationSeconds: timingBase.totalFrames / timingBase.fps,
    outputFps: timingBase.fps,
    approvedAspectRatio,
  })
  const exportLine = plan.creditEstimate.breakdown.find((item) =>
    item.label === '4K UHD render and export ceiling')
  if (!exportLine || !plan.creditEstimate.professionalExportCoverage) {
    throw new Error('Canonical revision fixture requires the mandatory 4K estimate line.')
  }
  plan.creditEstimate.total +=
    coverage.maximumInternalToolCostCredits - exportLine.credits
  exportLine.credits = coverage.maximumInternalToolCostCredits
  plan.creditEstimate.professionalExportCoverage = coverage
}

function frameRange(
  startSeconds: number,
  endSeconds: number,
  startFrame: number,
  endFrame: number,
) {
  return {
    startSeconds,
    endSeconds,
    durationSeconds: endSeconds - startSeconds,
    startFrame,
    endFrame,
    durationFrames: endFrame - startFrame,
    fps: 24,
  }
}
