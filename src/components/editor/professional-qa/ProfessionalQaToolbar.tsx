import { CheckCircle2, ClipboardCheck, RefreshCcw, RotateCcw, ShieldCheck } from 'lucide-react'
import { Button } from '../../Button'
import type { ProfessionalQaSummary } from '../../../types'

type ProfessionalQaToolbarProps = {
  summary: ProfessionalQaSummary | null
  operationCount?: number
  onRunQa?: () => void
  onRerunQa?: () => void
  onAcceptAllWarnings?: () => void
  onMarkReviewed?: () => void
  onResetQa?: () => void
}

export function ProfessionalQaToolbar({
  onAcceptAllWarnings,
  onMarkReviewed,
  onRerunQa,
  onResetQa,
  onRunQa,
  operationCount = 0,
  summary,
}: ProfessionalQaToolbarProps) {
  const hasReport = Boolean(summary && summary.status !== 'not_run')
  const hasWarnings = (summary?.warningCount ?? 0) > 0
  const hasBlocking = (summary?.blockingCount ?? 0) > 0

  return (
    <section className="inline-chat-card professional-qa-toolbar">
      <div className="professional-qa-toolbar-row">
        <div>
          <span className="section-eyebrow">Local QA controls</span>
          <h3>{hasReport ? 'Review or refresh QA' : 'Run Professional QA'}</h3>
          <p className="inline-helper">{operationCount} local QA change{operationCount === 1 ? '' : 's'}</p>
        </div>
        <div className="professional-qa-toolbar-actions">
          {!hasReport && (
            <Button icon={ShieldCheck} onClick={onRunQa} variant="primary">
              Run QA
            </Button>
          )}
          {hasReport && (
            <Button icon={RefreshCcw} onClick={onRerunQa} variant="secondary">
              Rerun QA
            </Button>
          )}
          {hasReport && (
            <Button icon={CheckCircle2} disabled={!hasWarnings} onClick={onAcceptAllWarnings} variant="secondary">
              Accept All Warnings
            </Button>
          )}
          {hasReport && (
            <Button icon={ClipboardCheck} disabled={hasBlocking} onClick={onMarkReviewed} variant="primary">
              Mark Reviewed
            </Button>
          )}
          {hasReport && (
            <Button icon={RotateCcw} onClick={onResetQa} variant="ghost">
              Reset QA
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
