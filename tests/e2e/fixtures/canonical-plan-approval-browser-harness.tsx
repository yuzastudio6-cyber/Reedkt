import { useCanonicalEditJourney } from '../../../src/hooks/useCanonicalEditJourney'
import { useCanonicalPlanApproval } from '../../../src/hooks/useCanonicalPlanApproval'
import { canonicalPlanApprovalReadyForPresentedPlan } from '../../../src/lib/canonical-plan-approval-readiness'
import { createGuidedMockEditPlan } from '../../../src/lib/mock-planner/guided'
import type { ProjectPersistenceScope } from '../../../src/lib/project-persistence-scope'
import { CanonicalJourneyStatusCard } from '../../../src/components/editor/CanonicalJourneyStatusCard'
import { CanonicalPlanApprovalStatus } from '../../../src/components/editor/CanonicalPlanApprovalStatus'
import { PlanReviewApprovalCard } from '../../../src/components/editor/PlanReviewApprovalCard'

const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const projectId = 'canonical-project-approval-browser'
const editSessionId = 'canonical-edit-approval-browser'
const presentedPlan = {
  planId: 'plan-canonical-approval-browser',
  planVersion: 1,
  planHash: '1'.repeat(64),
}
const visibleMaximumCredits = 38
const plan = createGuidedMockEditPlan({
  projectName: 'Canonical approval browser proof',
  targetPlatform: 'custom',
  aspectRatio: '9:16',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'storytelling',
  workflowType: 'talking_head',
  editLevel: 'pro',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions: 'Preserve the source and keep the caption treatment restrained.',
  creditPreference: 'balanced',
  clips: [{
    id: 'canonical-approval-browser-clip',
    uploadedOrder: 1,
    fileName: 'canonical-approval-browser.mp4',
    duration: '00:02',
    detectedType: 'Primary source',
    sourceRole: 'main_story',
  }],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'preserve_natural',
  cleanupPreferenceConfirmed: true,
})
plan.creditEstimate = {
  ...plan.creditEstimate,
  total: visibleMaximumCredits,
  approvalBlocked: false,
  draftReason: undefined,
}

export function CanonicalPlanApprovalBrowserHarness() {
  const journey = useCanonicalEditJourney({
    editSessionId,
    enabled: true,
    projectId,
    scope,
  })
  const approval = useCanonicalPlanApproval({
    editSessionId,
    enabled: true,
    projectId,
    scope,
  })
  const currentJourney = journey.result?.status === 'ready' ? journey.result.journey : undefined
  const authorityReady = canonicalPlanApprovalReadyForPresentedPlan({
    backendConnected: true,
    journey: currentJourney,
    publicationStatus: 'plan_published_waiting_for_approval',
    presentedPlan,
    visibleMaximumCredits,
  })
  const approved = approval.result?.status === 'approved' || Boolean(
    currentJourney?.stage === 'approved_snapshot_available' &&
    currentJourney.plan?.status === 'approved' &&
    currentJourney.plan.estimateStatus === 'approved',
  )

  async function handleApprove() {
    if (!currentJourney || !authorityReady) return
    const result = await approval.approve(currentJourney)
    if (result.status === 'approved') journey.refresh()
  }

  return (
    <main style={{ margin: '0 auto', maxWidth: 920, padding: '32px 20px 80px' }}>
      <CanonicalJourneyStatusCard {...journey} />
      <PlanReviewApprovalCard
        approved={approved}
        approvalAuthorityBlockedLabel="Waiting for exact saved plan"
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
      />
    </main>
  )
}
