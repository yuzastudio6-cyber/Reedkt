import { ShieldCheck } from 'lucide-react'
import { Button } from '../../Button'
import type { ProfessionalQaState } from '../../../types'
import { ProfessionalQaCategoryBreakdown } from './ProfessionalQaCategoryBreakdown'
import { ProfessionalQaExplainer } from './ProfessionalQaExplainer'
import { ProfessionalQaIssueList } from './ProfessionalQaIssueList'
import { ProfessionalQaReadinessGate } from './ProfessionalQaReadinessGate'
import { ProfessionalQaSummaryCard } from './ProfessionalQaSummaryCard'
import { ProfessionalQaToolbar } from './ProfessionalQaToolbar'

type ProfessionalQaPanelProps = {
  state: ProfessionalQaState | null
  readinessMessage?: string
  canPreviewProceed?: boolean
  onRunQa?: () => void
  onRerunQa?: () => void
  onAcceptWarning?: (itemId: string) => void
  onAcceptAllWarnings?: () => void
  onMarkReviewed?: () => void
  onResetQa?: () => void
  className?: string
}

export function ProfessionalQaPanel({
  canPreviewProceed = false,
  className = '',
  onAcceptAllWarnings,
  onAcceptWarning,
  onMarkReviewed,
  onRerunQa,
  onResetQa,
  onRunQa,
  readinessMessage,
  state,
}: ProfessionalQaPanelProps) {
  if (!state?.report) {
    return (
      <section className={`inline-chat-card professional-qa-panel ${className}`.trim()}>
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Professional QA</span>
            <h3>Run QA before treating the private review as ready</h3>
          </div>
        </div>
        <p className="inline-helper">
          Run QA before treating the private review as ready. ReeditPro will check cues, overlays, B-roll, audio, privacy, safe zones, and professional treatment risks.
        </p>
        <p className="inline-helper">QA is local and non-destructive. It does not render or modify media.</p>
        <Button icon={ShieldCheck} onClick={onRunQa} variant="primary">
          Run Professional QA
        </Button>
      </section>
    )
  }

  return (
    <section className={`professional-qa-panel ${className}`.trim()}>
      <section className="inline-chat-card professional-qa-intro">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Professional QA</span>
            <h3>Private review readiness checks</h3>
          </div>
        </div>
        <p className="inline-helper">
          Professional QA checks whether the planned edit is polished enough to move toward private review.
        </p>
        <p className="inline-helper">QA is local and non-destructive. It does not render or modify source media.</p>
      </section>

      <ProfessionalQaSummaryCard
        readinessMessage={readinessMessage}
        summary={state.summary}
      />
      <ProfessionalQaToolbar
        onAcceptAllWarnings={onAcceptAllWarnings}
        onMarkReviewed={onMarkReviewed}
        onRerunQa={onRerunQa}
        onResetQa={onResetQa}
        onRunQa={onRunQa}
        operationCount={state.operations.length}
        summary={state.summary}
      />
      <ProfessionalQaReadinessGate
        canPreviewProceed={canPreviewProceed}
        readinessMessage={readinessMessage}
        summary={state.summary}
      />
      <ProfessionalQaExplainer />
      <ProfessionalQaCategoryBreakdown summary={state.summary} />
      <ProfessionalQaIssueList
        items={state.items}
        onAcceptWarning={onAcceptWarning}
      />
    </section>
  )
}
