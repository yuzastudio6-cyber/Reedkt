import { useState } from 'react'
import { CheckCircle2, ListChecks, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '../../Button'
import type { GenerationReadinessState } from '../../../types'

type GenerationApprovalCardProps = {
  state: GenerationReadinessState
  onApproveGeneration?: (options: { acceptsQaWarnings: boolean; understandsPreviewIsMock: boolean }) => void
  onQueueMockPreviewJob?: () => void
  onCompleteJob?: () => void
  onReset?: () => void
}

export function GenerationApprovalCard({
  onApproveGeneration,
  onCompleteJob,
  onQueueMockPreviewJob,
  onReset,
  state,
}: GenerationApprovalCardProps) {
  const [understandsPreviewIsMock, setUnderstandsPreviewIsMock] = useState(false)
  const [acceptsQaWarnings, setAcceptsQaWarnings] = useState(false)
  const warningsExist = state.issues.some((issue) => issue.severity === 'warning') ||
    state.status === 'ready_with_warnings'
  const hasJob = Boolean(state.previewJob)
  const canComplete = state.previewJob?.status === 'queued' || state.previewJob?.status === 'running'
  const canApprove = state.canApprove &&
    understandsPreviewIsMock &&
    (!warningsExist || acceptsQaWarnings)

  return (
    <section className="inline-chat-card generation-approval-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Local approval</span>
          <h3>Approve before preparing the private review</h3>
        </div>
      </div>

      <div className="generation-approval-checks">
        <label>
          <input
            checked={understandsPreviewIsMock}
            onChange={(event) => setUnderstandsPreviewIsMock(event.target.checked)}
            type="checkbox"
          />
          <span>I understand this is an internal private review and does not publish or charge.</span>
        </label>
        {warningsExist && (
          <label>
            <input
              checked={acceptsQaWarnings}
              onChange={(event) => setAcceptsQaWarnings(event.target.checked)}
              type="checkbox"
            />
            <span>I accept the QA warnings for this internal private review.</span>
          </label>
        )}
      </div>

      <div className="generation-readiness-toolbar-actions">
        <Button
          disabled={!canApprove}
          icon={CheckCircle2}
          onClick={() => onApproveGeneration?.({
            acceptsQaWarnings: warningsExist ? acceptsQaWarnings : true,
            understandsPreviewIsMock,
          })}
          variant="primary"
        >
          Approve private review
        </Button>
        <Button
          disabled={!state.canGenerate}
          icon={ListChecks}
          onClick={onQueueMockPreviewJob}
          variant="secondary"
        >
          Queue private review
        </Button>
        <Button
          disabled={!canComplete}
          icon={Sparkles}
          onClick={onCompleteJob}
          variant="secondary"
        >
          Complete review
        </Button>
        <Button
          disabled={!state.approval && !hasJob}
          icon={RotateCcw}
          onClick={onReset}
          variant="ghost"
        >
          Reset
        </Button>
      </div>

      <p className="inline-helper">
        Approval is internal only. It does not reserve credits, charge credits, publish media, or start production jobs.
      </p>
    </section>
  )
}
