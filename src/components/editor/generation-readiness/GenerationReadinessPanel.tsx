import { RefreshCcw } from 'lucide-react'
import { Button } from '../../Button'
import type { GenerationReadinessState } from '../../../types'
import { GenerationApprovalCard } from './GenerationApprovalCard'
import { GenerationReadinessExplainer } from './GenerationReadinessExplainer'
import { GenerationReadinessIssueList } from './GenerationReadinessIssueList'
import { GenerationReadinessSummaryCard } from './GenerationReadinessSummaryCard'
import { MockCreditEstimateCard } from './MockCreditEstimateCard'
import { MockPreviewJobProgressCard } from './MockPreviewJobProgressCard'

type GenerationReadinessPanelProps = {
  state: GenerationReadinessState | null
  onApproveGeneration?: (options: { acceptsQaWarnings: boolean; understandsPreviewIsMock: boolean }) => void
  onQueueMockPreviewJob?: () => void
  onAdvanceJob?: () => void
  onCompleteJob?: () => void
  onReset?: () => void
  onRefresh?: () => void
  className?: string
}

export function GenerationReadinessPanel({
  className = '',
  onAdvanceJob,
  onApproveGeneration,
  onCompleteJob,
  onQueueMockPreviewJob,
  onRefresh,
  onReset,
  state,
}: GenerationReadinessPanelProps) {
  if (!state) {
    return (
      <section className={`inline-chat-card generation-readiness-panel ${className}`.trim()}>
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Review readiness</span>
            <h3>Readiness appears after planning, treatment review, and QA</h3>
          </div>
        </div>
        <p className="inline-helper">
          This local gate creates an internal estimate, requires explicit approval, and rehearses private review progress without publishing media.
        </p>
      </section>
    )
  }

  return (
    <section className={`generation-readiness-panel ${className}`.trim()}>
      <section className="inline-chat-card generation-readiness-intro">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Review readiness</span>
            <h3>Private review approval</h3>
          </div>
          <Button icon={RefreshCcw} onClick={onRefresh} variant="ghost">
            Refresh
          </Button>
        </div>
        <p className="inline-helper">
          This is an internal readiness gate. It does not charge credits or publish media.
        </p>
      </section>

      <GenerationReadinessSummaryCard state={state} />
      <MockCreditEstimateCard estimate={state.creditEstimate} />
      <GenerationReadinessIssueList issues={state.issues} />
      <GenerationApprovalCard
        onApproveGeneration={onApproveGeneration}
        onCompleteJob={onCompleteJob}
        onQueueMockPreviewJob={onQueueMockPreviewJob}
        onReset={onReset}
        state={state}
      />
      <MockPreviewJobProgressCard
        job={state.previewJob}
        onAdvanceJob={onAdvanceJob}
        onCompleteJob={onCompleteJob}
      />
      <GenerationReadinessExplainer />
    </section>
  )
}
