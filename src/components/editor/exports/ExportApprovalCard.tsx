import { useState } from 'react'
import { CheckCircle2, Play, RotateCcw, XCircle } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { ExportWorkflowState } from '../../../types'

type ExportApprovalCardProps = {
  state: ExportWorkflowState
  onApproveExport?: (options: { acceptsMockCredits: boolean; understandsExportIsMock: boolean; understandsNoRealFileWillBeCreated: boolean }) => void
  onRejectExport?: () => void
  onQueueExportJob?: () => void
  onResetExportWorkflow?: () => void
}

export function ExportApprovalCard({
  onApproveExport,
  onQueueExportJob,
  onRejectExport,
  onResetExportWorkflow,
  state,
}: ExportApprovalCardProps) {
  const [understandsExportIsMock, setUnderstandsExportIsMock] = useState(false)
  const [understandsNoRealFileWillBeCreated, setUnderstandsNoRealFileWillBeCreated] = useState(false)
  const [acceptsMockCredits, setAcceptsMockCredits] = useState(false)
  const creditsRequired = (state.exportEstimate?.totalCredits ?? 0) > 0
  const approved = state.approval?.status === 'approved'
  const approveDisabled = approved ||
    !state.canApprove ||
    !understandsExportIsMock ||
    !understandsNoRealFileWillBeCreated ||
    (creditsRequired && !acceptsMockCredits)

  return (
    <section className="inline-chat-card export-approval-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Export approval</span>
          <h3>Approve the internal rehearsal</h3>
        </div>
        <Badge accent={approved ? 'success' : state.canApprove ? 'warning' : 'danger'}>
          {state.approval?.status ?? 'required'}
        </Badge>
      </div>
      <div className="export-approval-checks">
        <label>
          <input
            checked={understandsExportIsMock}
            onChange={(event) => setUnderstandsExportIsMock(event.target.checked)}
            type="checkbox"
          />
          <span>I understand this is an internal export rehearsal.</span>
        </label>
        <label>
          <input
            checked={understandsNoRealFileWillBeCreated}
            onChange={(event) => setUnderstandsNoRealFileWillBeCreated(event.target.checked)}
            type="checkbox"
          />
          <span>I understand public delivery files are not created here.</span>
        </label>
        {creditsRequired && (
          <label>
            <input
              checked={acceptsMockCredits}
              onChange={(event) => setAcceptsMockCredits(event.target.checked)}
              type="checkbox"
            />
            <span>I accept this non-billing credit preview.</span>
          </label>
        )}
      </div>
      <div className="inline-card-actions">
        <Button
          disabled={approveDisabled}
          icon={CheckCircle2}
          onClick={() => onApproveExport?.({
            acceptsMockCredits: creditsRequired ? acceptsMockCredits : true,
            understandsExportIsMock,
            understandsNoRealFileWillBeCreated,
          })}
          variant="primary"
        >
          Approve rehearsal
        </Button>
        <Button disabled={!state.exportEstimate} icon={XCircle} onClick={onRejectExport} variant="secondary">Reject</Button>
        <Button disabled={!state.canExport} icon={Play} onClick={onQueueExportJob} variant="secondary">Queue rehearsal</Button>
        <Button disabled={!state.approval && !state.activeJob} icon={RotateCcw} onClick={onResetExportWorkflow} variant="ghost">Reset</Button>
      </div>
    </section>
  )
}
