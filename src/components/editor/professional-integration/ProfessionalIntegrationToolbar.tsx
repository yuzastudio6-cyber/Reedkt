import { CheckCircle2, RefreshCcw, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '../../Button'
import type { ProfessionalIntegrationSummary } from '../../../types'

type ProfessionalIntegrationToolbarProps = {
  summary: ProfessionalIntegrationSummary | null
  operationCount?: number
  onCreate?: () => void
  onRegenerate?: () => void
  onAccept?: () => void
  onReset?: () => void
}

export function ProfessionalIntegrationToolbar({
  onAccept,
  onCreate,
  onRegenerate,
  onReset,
  operationCount = 0,
  summary,
}: ProfessionalIntegrationToolbarProps) {
  const hasState = Boolean(summary)
  const blocked = summary?.status === 'blocked'
  const accepted = summary?.accepted ?? false

  return (
    <section className="inline-chat-card professional-integration-toolbar">
      <div className="professional-integration-toolbar-row">
        <div>
          <span className="section-eyebrow">Local treatment controls</span>
          <h3>{hasState ? 'Review or refresh treatment decisions' : 'Create professional treatment decisions'}</h3>
          <p className="inline-helper">{operationCount} local change{operationCount === 1 ? '' : 's'}</p>
        </div>
        <div className="professional-integration-toolbar-actions">
          {!hasState && (
            <Button icon={Sparkles} onClick={onCreate} variant="primary">
              Create Professional Integration
            </Button>
          )}
          {hasState && (
            <Button icon={RefreshCcw} onClick={onRegenerate} variant="secondary">
              Regenerate
            </Button>
          )}
          {hasState && (
            <Button icon={CheckCircle2} disabled={blocked || accepted} onClick={onAccept} variant="primary">
              Accept Professional Integration
            </Button>
          )}
          {hasState && (
            <Button icon={RotateCcw} onClick={onReset} variant="ghost">
              Reset
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
