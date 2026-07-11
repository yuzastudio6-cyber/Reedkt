import { GitBranchPlus } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { hideInternalToolNamesInCopy } from '../../../lib/tool-display-labels'
import { createProfessionalSkillDisplayModel } from '../../../lib/professional-skills'
import type {
  EditMapLocalOperation,
  MockRevisionJob,
  ProfessionalSkillPlan,
  RevisionApproval,
  RevisionCreditEstimate,
  RevisionWorkflowState,
} from '../../../types'
import type { RevisionRequestStatus } from '../../../types/revision-workflow'
import { RevisionApprovalCard } from './RevisionApprovalCard'
import { RevisionCreditEstimateCard } from './RevisionCreditEstimateCard'
import { RevisionExplainer } from './RevisionExplainer'
import { RevisionHistoryCard } from './RevisionHistoryCard'
import { RevisionJobProgressCard } from './RevisionJobProgressCard'
import { RevisionOperationList } from './RevisionOperationList'
import { RevisionRequestCard } from './RevisionRequestCard'
import { RevisionSummaryCard } from './RevisionSummaryCard'

type RevisionWorkflowPanelProps = {
  state: RevisionWorkflowState | null
  pendingOperations?: EditMapLocalOperation[]
  activeCreditEstimate?: RevisionCreditEstimate | null
  activeApproval?: RevisionApproval | null
  activeJob?: MockRevisionJob | null
  manifestVerified?: boolean
  reviewDecision?: 'accepted_for_internal_testing' | 'changes_requested' | null
  reviewNote?: string | null
  skillPlan?: ProfessionalSkillPlan | null
  onCreateRevision?: () => void
  onApproveRevision?: (options: { acceptsMockCredits: boolean; understandsPreviewIsMock: boolean; understandsRevisionIsLocal: boolean }) => void
  onRejectRevision?: () => void
  onQueueRevisionJob?: () => void
  onAdvanceRevisionJob?: () => void
  onCompleteRevisionJob?: () => void
  onFailRevisionJob?: () => void
  onResetActiveRevision?: () => void
  onClearRevisionHistory?: () => void
  className?: string
}

export function RevisionWorkflowPanel({
  activeApproval,
  activeCreditEstimate,
  activeJob,
  className = '',
  manifestVerified = false,
  onAdvanceRevisionJob,
  onApproveRevision,
  onClearRevisionHistory,
  onCompleteRevisionJob,
  onCreateRevision,
  onFailRevisionJob,
  onQueueRevisionJob,
  onRejectRevision,
  onResetActiveRevision,
  pendingOperations = [],
  reviewDecision = null,
  reviewNote,
  skillPlan,
  state,
}: RevisionWorkflowPanelProps) {
  const activeRequest = state?.activeRevisionRequest ?? null
  const shouldShowTrace = Boolean(skillPlan) ||
    reviewDecision === 'changes_requested' ||
    Boolean(reviewNote?.trim()) ||
    Boolean(activeRequest) ||
    pendingOperations.length > 0

  return (
    <section className={`revision-workflow-panel ${className}`.trim()}>
      <RevisionSummaryCard state={state} />
      <RevisionExplainer />
      {shouldShowTrace && (
        <RevisionDirectionTraceCard
          activeRequestStatus={activeRequest?.status ?? null}
          manifestVerified={manifestVerified}
          pendingOperationCount={pendingOperations.length}
          reviewDecision={reviewDecision}
          reviewNote={reviewNote}
          skillPlan={skillPlan}
        />
      )}
      <section className="inline-chat-card revision-create-card">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Create revision</span>
            <h3>Group pending Edit Map changes</h3>
          </div>
        </div>
        <p className="inline-helper">
          Revision Requests turn Edit Map changes into a new preview version when a local operation needs rerender,
          regeneration, or approval.
        </p>
        <div className="inline-card-actions">
          <Button disabled={pendingOperations.length === 0} icon={GitBranchPlus} onClick={onCreateRevision} variant="primary">
            Create Revision Request
          </Button>
        </div>
      </section>
      {activeRequest && (
        <RevisionRequestCard
          manifestVerified={manifestVerified}
          onResetActiveRevision={onResetActiveRevision}
          reviewNote={reviewNote}
          revisionRequest={activeRequest}
        />
      )}
      {activeRequest && <RevisionCreditEstimateCard estimate={activeCreditEstimate ?? null} />}
      {activeRequest && (
        <RevisionApprovalCard
          approval={activeApproval}
          creditEstimate={activeCreditEstimate}
          onApprove={onApproveRevision}
          onQueueJob={onQueueRevisionJob}
          onReject={onRejectRevision}
          revisionRequest={activeRequest}
        />
      )}
      <RevisionJobProgressCard
        job={activeJob ?? null}
        onAdvance={onAdvanceRevisionJob}
        onComplete={onCompleteRevisionJob}
        onFail={onFailRevisionJob}
      />
      <RevisionOperationList
        classifications={activeRequest?.classifications}
        operations={pendingOperations}
      />
      <RevisionHistoryCard
        onClearHistory={onClearRevisionHistory}
        revisionRequests={state?.revisionRequests ?? []}
        versions={state?.versions ?? []}
      />
    </section>
  )
}

function RevisionDirectionTraceCard({
  activeRequestStatus,
  manifestVerified,
  pendingOperationCount,
  reviewDecision,
  reviewNote,
  skillPlan,
}: {
  activeRequestStatus: RevisionRequestStatus | null
  manifestVerified: boolean
  pendingOperationCount: number
  reviewDecision: 'accepted_for_internal_testing' | 'changes_requested' | null
  reviewNote?: string | null
  skillPlan?: ProfessionalSkillPlan | null
}) {
  const skillDisplay = skillPlan
    ? createProfessionalSkillDisplayModel(skillPlan, { activityLimit: 3, evidenceLimit: 3 })
    : null
  const cleanedReviewNote = reviewNote?.trim()

  return (
    <section className="inline-chat-card revision-direction-trace-card" data-testid="revision-direction-trace-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Revision context</span>
          <h3>Revision keeps the approved direction</h3>
        </div>
        <Badge accent={reviewDecision === 'changes_requested' || activeRequestStatus ? 'warning' : 'info'}>
          {revisionTraceStatusLabel(reviewDecision, activeRequestStatus)}
        </Badge>
      </div>

      <p className="inline-helper">
        {reviewDecision === 'changes_requested'
          ? 'Your requested changes stay attached to the same source video, approved plan record, and private review record. A revised plan approval and a new private review are required before revised output is accepted.'
          : 'If you request changes, the source video, approved plan record, and private review record stay attached while the revised work gets a fresh approval and private review pass.'}
      </p>

      {cleanedReviewNote && (
        <blockquote className="revision-direction-note">
          {hideInternalToolNamesInCopy(cleanedReviewNote)}
        </blockquote>
      )}

      <div className="revision-direction-meta" aria-label="Revision continuity summary">
        <span><strong>{manifestVerified ? 'Verified' : 'Pending'}</strong><small>Review record</small></span>
        <span><strong>{pendingOperationCount}</strong><small>Local changes</small></span>
        {skillPlan && <span><strong>{skillPlan.editBriefUsed ? 'Brief included' : 'Prompt-led'}</strong><small>Planning source</small></span>}
      </div>

      {skillDisplay && skillDisplay.activityItems.length > 0 && (
        <ul className="revision-direction-list">
          {skillDisplay.activityItems.map((group) => (
            <li key={group.id}>
              <span>{group.label}</span>
              {group.summary && <small>{group.summary}</small>}
            </li>
          ))}
        </ul>
      )}

      {skillDisplay && skillDisplay.evidenceItems.length > 0 && (
        <details className="revision-direction-evidence">
          <summary>What stays attached</summary>
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
    </section>
  )
}

function revisionTraceStatusLabel(
  reviewDecision: 'accepted_for_internal_testing' | 'changes_requested' | null,
  activeRequestStatus: RevisionRequestStatus | null,
): string {
  if (activeRequestStatus) return activeRequestStatus.replace(/_/g, ' ')
  if (reviewDecision === 'changes_requested') return 'Fresh approval needed'
  if (reviewDecision === 'accepted_for_internal_testing') return 'Accepted review attached'
  return 'Attached'
}
