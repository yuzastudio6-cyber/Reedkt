import type { CreditUIAction, CreditUIBadge, CreditUILineItem, CreditUIMetric, CreditUITone } from '../../lib/credit-ui-adapter'
import { Badge } from '../Badge'
import { Button } from '../Button'

function toneToAccent(tone: CreditUITone): 'blue' | 'cyan' | 'violet' | 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  return tone
}

export function CreditCardHeader({ badge, eyebrow, title }: { badge: CreditUIBadge; eyebrow: string; title: string }) {
  return (
    <div className="credit-card-heading">
      <div>
        <span className="section-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <Badge accent={toneToAccent(badge.tone)}>{badge.label}</Badge>
    </div>
  )
}

export function CreditMetricGrid({ metrics }: { metrics: CreditUIMetric[] }) {
  return (
    <div className="credit-ui-metric-grid">
      {metrics.map((metric) => (
        <article className={`credit-ui-metric credit-ui-tone-${metric.tone ?? 'muted'}`} key={`${metric.label}-${metric.value}`}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.detail && <small>{metric.detail}</small>}
        </article>
      ))}
    </div>
  )
}

export function CreditLineList({ lines }: { lines: CreditUILineItem[] }) {
  if (lines.length === 0) return null

  return (
    <div className="credit-ui-line-list">
      {lines.map((line) => (
        <div className={`credit-ui-line credit-ui-tone-${line.tone ?? 'muted'}`} key={`${line.label}-${line.value}`}>
          <span>{line.label}</span>
          <strong>{line.value}</strong>
          {line.detail && <small>{line.detail}</small>}
        </div>
      ))}
    </div>
  )
}

export function CreditActionRow({ actions }: { actions: CreditUIAction[] }) {
  if (actions.length === 0) return null

  return (
    <div className="credit-ui-actions">
      {actions.map((action) => (
        <div className="credit-ui-action" key={action.label}>
          <Button disabled={action.disabled} variant={action.tone === 'warning' ? 'secondary' : action.tone === 'danger' ? 'danger' : 'primary'}>
            {action.label}
          </Button>
          <small>{action.helper}</small>
        </div>
      ))}
    </div>
  )
}

export function CreditCopyList({ copy }: { copy: string[] }) {
  if (copy.length === 0) return null

  return (
    <div className="credit-ui-copy-list">
      {copy.map((item) => <p key={item}>{item}</p>)}
    </div>
  )
}

export function CreditWarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null

  return (
    <div className="credit-ui-warning-list">
      {warnings.map((warning) => <span key={warning}>{warning}</span>)}
    </div>
  )
}
