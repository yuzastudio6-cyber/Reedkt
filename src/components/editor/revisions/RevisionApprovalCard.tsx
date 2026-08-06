import { useState } from 'react'
import { CheckCircle2, Play, XCircle } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type {
  RevisionApproval,
  RevisionCreditEstimate,
  RevisionRequest,
} from '../../../types'

type RevisionApprovalCardProps = {
  revisionRequest: RevisionRequest | null
  creditEstimate?: RevisionCreditEstimate | null
  approval?: RevisionApproval | null
  onApprove?: (options: { acceptsMockCredits: boolean; understandsPreviewIsMock: boolean; understandsRevisionIsLocal: boolean }) => void
  onReject?: () => void
  onQueueJob?: () => void
}

export function RevisionApprovalCard({
  approval,
  creditEstimate,
  onApprove,
  onQueueJob,
  onReject,
  revisionRequest,
}: RevisionApprovalCardProps) {
  const [understandsRevisionIsLocal, setUnderstandsRevisionIsLocal] = useState(false)
  const [understandsPreviewIsMock, setUnderstandsPreviewIsMock] = useState(false)
  const [acceptsMockCredits, setAcceptsMockCredits] = useState(false)
  const creditsRequired = Boolean(creditEstimate && creditEstimate.totalCredits > 0)
  const approved = approval?.status === 'approved' || approval?.status === 'not_required'
  const approveDisabled = !revisionRequest ||
    approved ||
    !understandsRevisionIsLocal ||
    !understandsPreviewIsMock ||
    (creditsRequired && !acceptsMockCredits)
  const queueDisabled = !revisionRequest ||
    revisionRequest.status === 'rejected' ||
    revisionRequest.status === 'preview_ready' ||
    (creditsRequired && !approved)

  return (
    <section className="inline-chat-card revision-approval-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Revision approval</span>
          <h3>Approve the revised private review</h3>
        </div>
        <Badge accent={approved ? 'success' : creditsRequired ? 'warning' : 'info'}>
          {approval?.status ?? (creditsRequired ? 'required' : 'not required')}
        </Badge>
      </div>
      <p className="inline-helper">
        This approval applies only to the requested changes. The uploaded source video, approved edit direction,
        and private review record stay attached, and public sharing remains off.
      </p>
      <div className="revision-approval-checks">
        <label>
          <input
            checked={understandsRevisionIsLocal}
            onChange={(event) => setUnderstandsRevisionIsLocal(event.target.checked)}
            type="checkbox"
          />
          <span>I understand this is an internal test revision.</span>
        </label>
        <label>
          <input
            checked={understandsPreviewIsMock}
            onChange={(event) => setUnderstandsPreviewIsMock(event.target.checked)}
            type="checkbox"
          />
          <span>I understand this prepares a private review only and does not publish media.</span>
        </label>
        {creditsRequired && (
          <label>
            <input
              checked={acceptsMockCredits}
              onChange={(event) => setAcceptsMockCredits(event.target.checked)}
              type="checkbox"
            />
            <span>I accept the internal revision credit estimate.</span>
          </label>
        )}
      </div>
      <div className="inline-card-actions">
        <Button
          disabled={approveDisabled}
          icon={CheckCircle2}
          onClick={() => onApprove?.({ acceptsMockCredits: creditsRequired ? acceptsMockCredits : true, understandsPreviewIsMock, understandsRevisionIsLocal })}
          variant="primary"
        >
          Approve revision
        </Button>
        <Button disabled={!revisionRequest || revisionRequest.status === 'rejected'} icon={XCircle} onClick={onReject} variant="secondary">
          Reject revision
        </Button>
        <Button disabled={queueDisabled} icon={Play} onClick={onQueueJob} variant="secondary">
          {revisionRequest?.status === 'failed' ? 'Retry revised review' : 'Prepare revised review'}
        </Button>
      </div>
    </section>
  )
}
