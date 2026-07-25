import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { hideInternalToolNamesInCopy } from '../../lib/tool-display-labels'
import {
  createProfessionalSkillDisplayModel,
  professionalSkillStageSummary,
} from '../../lib/professional-skills'
import type { ProfessionalSkillPlan } from '../../types'

export type EditWorkspaceStage =
  | 'upload_required'
  | 'planning_setup'
  | 'plan_review'
  | 'approved_review_building'
  | 'review_ready'
  | 'review_approved'
  | 'revision_requested'
  | 'blocked'

export type EditWorkspaceCompletedStep = {
  id: string
  label: string
}

export type EditWorkspaceRevisionPlanContext = {
  request: string
  previousReviewDecision?: 'accepted_for_internal_testing' | 'changes_requested'
  previousReviewVerified: boolean
  contextOnly: true
  freshPlanRequired: true
  freshPrivateReviewRequired: true
}

export type EditWorkspacePlanningInputStatus = {
  editBriefReady: boolean
  editBriefStarted: boolean
  promptCaptured: boolean
  setupReady: boolean
  sourceReady: boolean
}

type EditWorkspaceProgressCardProps = {
  actionLabel?: string
  blockedReason?: string
  completedSteps?: EditWorkspaceCompletedStep[]
  onAction?: () => void
  planningInputStatus?: EditWorkspacePlanningInputStatus
  revisionPlanContext?: EditWorkspaceRevisionPlanContext | null
  skillPlan?: ProfessionalSkillPlan | null
  stage: EditWorkspaceStage
}

const stageCopy: Record<EditWorkspaceStage, {
  badge: string
  description: string
  icon: typeof Upload
  title: string
}> = {
  upload_required: {
    badge: 'Waiting',
    description: 'Upload and finalize a private source video before chat planning opens.',
    icon: Upload,
    title: 'Upload source video',
  },
  planning_setup: {
    badge: 'Planning',
    description: 'Create the edit plan from the upload, prompt, setup choices, and any optional structured direction.',
    icon: CircleDot,
    title: 'Prepare the edit plan',
  },
  plan_review: {
    badge: 'Review',
    description: 'Review the plan and credit estimate. Nothing runs until you approve.',
    icon: ClipboardCheck,
    title: 'Review the edit plan',
  },
  approved_review_building: {
    badge: 'Preparing',
    description: 'The approved plan is being prepared for private review. Public sharing stays off.',
    icon: Loader2,
    title: 'Preparing private review',
  },
  review_ready: {
    badge: 'Ready',
    description: 'The private review is ready to inspect, approve, or request changes.',
    icon: CheckCircle2,
    title: 'Review edit ready',
  },
  review_approved: {
    badge: 'Approved',
    description: 'The private review decision is saved. Public sharing and delivery remain separate.',
    icon: CheckCircle2,
    title: 'Private review approved',
  },
  revision_requested: {
    badge: 'Revision',
    description: 'A change request is attached. The next pass keeps the same source and review trace.',
    icon: RotateCcw,
    title: 'Revision requested',
  },
  blocked: {
    badge: 'Blocked',
    description: 'Resolve the blocker below before continuing this edit.',
    icon: AlertTriangle,
    title: 'Next action needed',
  },
}

function badgeAccent(stage: EditWorkspaceStage) {
  if (stage === 'review_ready' || stage === 'review_approved') return 'success'
  if (stage === 'blocked') return 'warning'
  if (stage === 'approved_review_building') return 'cyan'
  return 'muted'
}

export function EditWorkspaceProgressCard({
  actionLabel,
  blockedReason,
  completedSteps = [],
  onAction,
  planningInputStatus,
  revisionPlanContext,
  skillPlan,
  stage,
}: EditWorkspaceProgressCardProps) {
  const copy = stageCopy[stage]
  const Icon = copy.icon
  const safeBlockedReason = blockedReason ? hideInternalToolNamesInCopy(blockedReason) : ''
  const skillDisplay = skillPlan ? createProfessionalSkillDisplayModel(skillPlan, { activityLimit: 3, evidenceLimit: 3 }) : null
  const showSkillInsight = Boolean(skillPlan && stage !== 'planning_setup' && stage !== 'upload_required')
  const showRevisionPlanContext = Boolean(revisionPlanContext && stage === 'planning_setup')
  const showPlanningInputStatus = Boolean(planningInputStatus && stage === 'planning_setup')

  return (
    <section className="inline-chat-card edit-workspace-progress-card" data-testid="edit-workspace-progress-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Current step</span>
          <h3><Icon aria-hidden="true" size={18} />{copy.title}</h3>
        </div>
        <Badge accent={badgeAccent(stage)}>{copy.badge}</Badge>
      </div>

      <p className="inline-helper">{safeBlockedReason || copy.description}</p>

      {showPlanningInputStatus && planningInputStatus && (
        <div className="edit-workspace-planning-inputs" data-testid="edit-workspace-planning-inputs">
          <div>
            <strong>{planningInputStatus.sourceReady ? 'Source ready' : 'Source needed'}</strong>
            <small>{planningInputStatus.sourceReady ? 'Uploaded video is attached.' : 'Upload video first.'}</small>
          </div>
          <div>
            <strong>{planningInputStatus.promptCaptured ? 'Prompt captured' : 'Prompt optional'}</strong>
            <small>{planningInputStatus.promptCaptured ? 'Chat direction is saved.' : 'Tell ReeditPro what to make.'}</small>
          </div>
          <div>
            <strong>{planningInputStatus.editBriefReady ? 'Edit Brief ready' : 'Edit Brief optional'}</strong>
            <small>
              {planningInputStatus.editBriefReady
                ? 'Structured direction is ready.'
                : planningInputStatus.editBriefStarted
                  ? 'Draft direction can be marked ready.'
                  : 'Add only if you want more control.'}
            </small>
          </div>
          <div>
            <strong>{planningInputStatus.setupReady ? 'Ready to plan' : 'Setup needed'}</strong>
            <small>{planningInputStatus.setupReady ? 'Create the plan, then approve credits.' : 'Confirm setup choices before approval.'}</small>
          </div>
        </div>
      )}

      {showRevisionPlanContext && revisionPlanContext && (
        <div className="edit-workspace-revision-context" data-testid="edit-workspace-revision-context">
          <div className="edit-workspace-revision-context-heading">
            <strong>Revision planning context</strong>
            <span>Fresh plan required</span>
          </div>
          <blockquote>{hideInternalToolNamesInCopy(revisionPlanContext.request)}</blockquote>
          <div className="edit-workspace-revision-context-meta">
            <span>
              <strong>{revisionPlanContext.previousReviewVerified ? 'Verified' : 'Pending'}</strong>
              <small>Previous private review</small>
            </span>
            <span>
              <strong>{revisionDecisionLabel(revisionPlanContext.previousReviewDecision)}</strong>
              <small>Previous decision</small>
            </span>
            <span>
              <strong>{revisionPlanContext.freshPrivateReviewRequired ? 'Required' : 'Not required'}</strong>
              <small>New private review</small>
            </span>
          </div>
          <p>
            The previous private review is attached as context only. A new plan approval and private review pass are needed before revised output is accepted.
          </p>
        </div>
      )}

      {showSkillInsight && skillPlan && (
        <div className="edit-workspace-progress-skill-preview" data-testid="edit-workspace-progress-skill-preview">
          <div className="edit-workspace-progress-skill-preview-heading">
            <strong>Planned edit work</strong>
            <span>{skillDisplay?.briefSourceLabel}</span>
          </div>
          <p>{professionalSkillStageSummary(
            stage === 'review_approved' ? 'review_ready' : stage,
            skillPlan,
          )}</p>
          <ul>
            {skillDisplay?.activityItems.map((activity) => (
              <li key={activity.id}>
                <span>{activity.label}</span>
                {activity.summary && <small>{activity.summary}</small>}
              </li>
            ))}
          </ul>
          {skillDisplay && skillDisplay.evidenceItems.length > 0 && (
            <details>
              <summary>Why this is planned</summary>
              <ul>
                {skillDisplay.evidenceItems.map((evidence) => (
                  <li key={evidence.id}>
                    <span>{evidence.label}</span>
                    <small>{evidence.summary}</small>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {completedSteps.length > 0 && (
        <details className="edit-workspace-progress-history">
          <summary>{completedSteps.length} completed step{completedSteps.length === 1 ? '' : 's'}</summary>
          <ol>
            {completedSteps.map((step) => (
              <li key={step.id}>
                <CheckCircle2 aria-hidden="true" size={14} />
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {actionLabel && onAction && (
        <div className="inline-card-actions">
          <Button icon={Sparkles} onClick={onAction} size="sm" variant={stage === 'blocked' ? 'secondary' : 'primary'}>
            {actionLabel}
          </Button>
        </div>
      )}
    </section>
  )
}

function revisionDecisionLabel(decision: EditWorkspaceRevisionPlanContext['previousReviewDecision']): string {
  if (decision === 'accepted_for_internal_testing') return 'Accepted'
  if (decision === 'changes_requested') return 'Changes requested'
  return 'Context only'
}
