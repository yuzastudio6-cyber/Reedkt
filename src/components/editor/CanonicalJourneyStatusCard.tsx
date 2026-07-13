import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '../Badge'
import { IconButton } from '../Button'
import {
  createCanonicalEditJourneyPresentation,
  type CanonicalEditJourneyTone,
} from '../../lib/canonical-edit-journey'
import type { CanonicalEditJourneyHookResult } from '../../hooks/useCanonicalEditJourney'

const toneIcon = {
  neutral: CircleDot,
  active: Loader2,
  attention: AlertTriangle,
  success: CheckCircle2,
} as const

export function CanonicalJourneyStatusCard({
  loading,
  refresh,
  refreshing,
  result,
  updatedAt,
}: CanonicalEditJourneyHookResult) {
  if (result?.status === 'not_configured') return null

  if (loading || (!result && refreshing)) {
    return (
      <section
        aria-label="Saved workflow status"
        className="canonical-journey-status canonical-journey-status-active"
        data-testid="canonical-journey-status-loading"
      >
        <Loader2 aria-hidden="true" className="spin-icon" size={18} />
        <div className="canonical-journey-status-copy">
          <strong>Checking the saved workflow</strong>
          <p>Recovering the latest safe planning, approval, preparation, and review state.</p>
        </div>
      </section>
    )
  }

  if (!result) return null

  if (result.status !== 'ready') {
    const tone: CanonicalEditJourneyTone = result.status === 'access_denied' || result.status === 'invalid_response'
      ? 'attention'
      : 'neutral'
    const Icon = toneIcon[tone]
    return (
      <section
        aria-label="Saved workflow status"
        className={`canonical-journey-status canonical-journey-status-${tone}`}
        data-testid={`canonical-journey-status-${result.status.replace('_', '-')}`}
      >
        <Icon aria-hidden="true" size={18} />
        <div className="canonical-journey-status-copy">
          <span className="section-eyebrow">Saved workflow</span>
          <strong>{failureTitle(result.status)}</strong>
          <p>{result.message}</p>
          <small>No editing, credit, or publishing action started.</small>
        </div>
        {result.retryable && (
          <IconButton
            disabled={refreshing}
            icon={RefreshCw}
            label="Retry saved workflow status"
            onClick={refresh}
          />
        )}
      </section>
    )
  }

  const presentation = createCanonicalEditJourneyPresentation(result.journey)
  const Icon = toneIcon[presentation.tone]
  const progress = presentation.progress
  const accent = badgeAccent(presentation.tone)

  return (
    <section
      aria-label="Saved workflow status"
      className={`canonical-journey-status canonical-journey-status-${presentation.tone}`}
      data-journey-stage={result.journey.stage}
      data-testid="canonical-journey-status"
    >
      <div className="canonical-journey-status-icon" data-tone={presentation.tone}>
        <Icon
          aria-hidden="true"
          className={presentation.tone === 'active' && refreshing ? 'spin-icon' : undefined}
          size={18}
        />
      </div>

      <div className="canonical-journey-status-copy">
        <div className="canonical-journey-status-heading">
          <div>
            <span className="section-eyebrow">Saved workflow</span>
            <strong>{presentation.title}</strong>
          </div>
          <Badge accent={accent}>{presentation.badge}</Badge>
        </div>
        <p>{presentation.summary}</p>
        <small>{presentation.nextStep}</small>

        {progress && (
          <div
            aria-label={`${progress.completedJobCount} of ${progress.totalJobCount} preparation steps complete`}
            aria-valuemax={progress.totalJobCount}
            aria-valuemin={0}
            aria-valuenow={progress.completedJobCount}
            className="canonical-journey-progress"
            role="progressbar"
          >
            <span
              style={{ width: `${Math.min(100, Math.round((progress.completedJobCount / progress.totalJobCount) * 100))}%` }}
            />
          </div>
        )}

        <div className="canonical-journey-boundary">
          <ShieldCheck aria-hidden="true" size={14} />
          <span>{presentation.boundary}</span>
          {updatedAt && <time dateTime={updatedAt}>{formatCheckedAt(updatedAt)}</time>}
        </div>
      </div>

      <IconButton
        disabled={refreshing}
        icon={RefreshCw}
        label="Refresh saved workflow status"
        onClick={refresh}
      />
    </section>
  )
}

function badgeAccent(tone: CanonicalEditJourneyTone): 'muted' | 'cyan' | 'warning' | 'success' {
  if (tone === 'active') return 'cyan'
  if (tone === 'attention') return 'warning'
  if (tone === 'success') return 'success'
  return 'muted'
}

function failureTitle(status: Exclude<CanonicalEditJourneyHookResult['result'], null>['status']): string {
  if (status === 'not_found') return 'Saved workflow not found'
  if (status === 'access_denied') return 'Saved workflow unavailable'
  if (status === 'invalid_response') return 'Saved workflow needs verification'
  return 'Saved workflow could not refresh'
}

function formatCheckedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Status checked'
  return `Checked ${new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`
}
