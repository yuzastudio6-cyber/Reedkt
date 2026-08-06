import { Sparkles } from 'lucide-react'
import { Button } from '../../Button'

type FootagePrepEmptyStateProps = {
  blockedReason?: string
  canRunPrep?: boolean
  isRunning?: boolean
  onRunPrep?: () => void
}

export function FootagePrepEmptyState({
  blockedReason,
  canRunPrep = true,
  isRunning = false,
  onRunPrep,
}: FootagePrepEmptyStateProps) {
  const runDisabled = isRunning || !canRunPrep

  return (
    <section className="inline-chat-card footage-prep-empty-state">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Source prep</span>
          <h3>Prepare your footage</h3>
        </div>
        <span className="footage-prep-trust-pill">Raw source preserved</span>
      </div>

      <p className="inline-helper">
        Before creative editing, ReeditPro can clean up raw footage, find silence and retakes, select stronger takes, and build a non-destructive clean assembly.
      </p>

      {blockedReason && <p className="frame-confirmation-warning">{blockedReason}</p>}

      <div className="footage-prep-empty-actions">
        <Button disabled={runDisabled} icon={Sparkles} onClick={onRunPrep} variant="primary">
          {isRunning ? 'Preparing source...' : 'Prepare source'}
        </Button>
        <span>Source prep runs before the edit plan.</span>
      </div>
    </section>
  )
}
