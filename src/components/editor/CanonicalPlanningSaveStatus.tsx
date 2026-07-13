import { AlertTriangle, CheckCircle2, CircleDot, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import type { CanonicalPlanningPublicationHookResult } from '../../hooks/useCanonicalPlanningPublication'
import { Badge } from '../Badge'
import { IconButton } from '../Button'

type Tone = 'neutral' | 'active' | 'attention' | 'success'

const toneIcon = {
  neutral: CircleDot,
  active: Loader2,
  attention: AlertTriangle,
  success: CheckCircle2,
} as const

export function CanonicalPlanningSaveStatus({
  result,
  retry,
  saving,
}: Pick<CanonicalPlanningPublicationHookResult, 'result' | 'retry' | 'saving'>) {
  if (!saving && (!result || result.status === 'not_configured')) return null

  const presentation = saving
    ? {
        tone: 'active' as const,
        badge: 'Saving',
        title: 'Saving this exact plan',
        message: 'Verifying the current sources, preferences, brief, frame, cleanup, and planning details.',
      }
    : presentResult(result!)
  const Icon = toneIcon[presentation.tone]

  return (
    <section
      aria-label="Canonical plan save status"
      aria-live="polite"
      className={`canonical-journey-status canonical-journey-status-${presentation.tone} canonical-planning-save-status`}
      data-testid={`canonical-planning-save-${saving ? 'saving' : result!.status.replaceAll('_', '-')}`}
    >
      <div className="canonical-journey-status-icon" data-tone={presentation.tone}>
        <Icon aria-hidden="true" className={saving ? 'spin-icon' : undefined} size={18} />
      </div>
      <div className="canonical-journey-status-copy">
        <div className="canonical-journey-status-heading">
          <div>
            <span className="section-eyebrow">Saved plan</span>
            <strong>{presentation.title}</strong>
          </div>
          <Badge accent={badgeAccent(presentation.tone)}>{presentation.badge}</Badge>
        </div>
        <p>{presentation.message}</p>
        <div className="canonical-journey-boundary">
          <ShieldCheck aria-hidden="true" size={14} />
          <span>Saving never approves credits or starts editing.</span>
        </div>
      </div>
      {!saving && result?.retryable ? (
        <IconButton
          icon={RefreshCw}
          label="Retry saving this exact plan"
          onClick={() => void retry()}
        />
      ) : null}
    </section>
  )
}

function presentResult(result: NonNullable<CanonicalPlanningPublicationHookResult['result']>): {
  tone: Tone
  badge: string
  title: string
  message: string
} {
  if (result.status === 'plan_published_waiting_for_approval') {
    return { tone: 'success', badge: 'Ready', title: 'Exact plan saved', message: result.message }
  }
  if (result.status === 'candidate_saved_pending_internal_publication') {
    return { tone: 'active', badge: 'Verifying', title: 'Execution plan is being verified', message: result.message }
  }
  if (result.status === 'handoff_saved_waiting_for_compiler') {
    return {
      tone: 'attention',
      badge: 'Saved · gated',
      title: 'Planning inputs saved',
      message: 'This direction includes work that still needs an exact execution path. Approval stays locked so nothing is omitted.',
    }
  }
  if (result.status === 'access_denied') {
    return { tone: 'attention', badge: 'Access needed', title: 'Plan was not saved', message: result.message }
  }
  if (result.status === 'invalid_response') {
    return { tone: 'attention', badge: 'Verification needed', title: 'Saved response was rejected', message: result.message }
  }
  if (result.status === 'blocked') {
    return { tone: 'attention', badge: 'Needs refresh', title: 'Plan needs a fresh save', message: result.message }
  }
  return { tone: 'neutral', badge: 'Retry', title: 'Plan save did not finish', message: result.message }
}

function badgeAccent(tone: Tone): 'muted' | 'cyan' | 'warning' | 'success' {
  if (tone === 'active') return 'cyan'
  if (tone === 'attention') return 'warning'
  if (tone === 'success') return 'success'
  return 'muted'
}
