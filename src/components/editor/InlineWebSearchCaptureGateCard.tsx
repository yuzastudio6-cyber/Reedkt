import { Badge } from '../Badge'
import { createMockWebSearchUiApiGateState } from '../../backend/contracts/web-search-capture-contracts'
import type { ChatPlanningCardDescriptor } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineWebSearchCaptureGateCardProps = {
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

export function InlineWebSearchCaptureGateCard({ descriptor }: InlineWebSearchCaptureGateCardProps) {
  const gate = createMockWebSearchUiApiGateState()

  return (
    <InlinePlanCardShell
      className="web-search-capture-gate-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{gate.defaultProvider}</span>
          <span className="compact-summary-chip">{label(gate.providerMode)}</span>
          <span className="compact-summary-chip">{gate.maxResults} result gate</span>
          <span className="compact-summary-chip">capture blocked</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Internal web research"
      helper="Internal gate only: the frontend can display readiness and create mock-safe gated requests, but it cannot run live search, browser capture, screenshot processing, extraction, providers, or storage operations."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Web search/capture gate"
    >
      <div className="tool-registry-summary-grid">
        <span><strong>{gate.phase}</strong>Phase</span>
        <span><strong>{gate.status === 'ready_internal_gate_only' ? 'Ready' : 'Blocked'}</strong>Internal gate</span>
        <span><strong>{gate.maxResults}</strong>Max results</span>
        <span><strong>{gate.maxCapturePages}</strong>Capture pages</span>
      </div>

      <div className="understanding-chip-row">
        <Badge accent="cyan">SearXNG default</Badge>
        <Badge accent="success">Private service evidence</Badge>
        <Badge accent="warning">Fixture provider only</Badge>
        <Badge accent="blue">No frontend secrets</Badge>
      </div>

      <details className="understanding-section" open>
        <summary>Allowed internal controls</summary>
        <div className="layout-mode-meta">
          {[
            'View readiness status',
            'Create gate-only plan snapshot',
            'Run mock API envelope',
          ].map((control) => (
            <span key={control}><strong>Allowed</strong>{control}</span>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Blocked scopes</summary>
        <div className="layout-mode-meta">
          {gate.blockedScopes.slice(0, 8).map((scope) => (
            <span key={scope}><strong>Blocked</strong>{scope}</span>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Evidence</summary>
        <div className="layout-mode-meta">
          <span><strong>Phase 49H</strong>{gate.phase49HRunId}</span>
          <span><strong>Service</strong>{gate.privateSearxngService}</span>
          <span><strong>Frontend</strong>{gate.frontendSecretSafe ? 'secret-safe display gate' : 'blocked'}</span>
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
