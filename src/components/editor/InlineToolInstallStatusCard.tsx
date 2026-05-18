import { useState } from 'react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { checkBrowserToolInstallations, type BrowserToolInstallCheck } from '../../lib/browser-tool-loaders'
import {
  getFrontendFutureTools,
  getFrontendInstalledTools,
  getFrontendToolInstallSummary,
  getFrontendWorkerOnlyTools,
} from '../../lib/tool-install-status'
import type { ChatPlanningCardDescriptor, ToolProfile } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineToolInstallStatusCardProps = {
  compact?: boolean
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function packageName(tool: ToolProfile) {
  return tool.frontendInstallInfo?.packageName ?? 'no frontend package'
}

function installBadge(tool: ToolProfile) {
  const status = tool.frontendInstallInfo?.installStatus ?? 'future'
  const installed = tool.frontendInstallInfo?.installedInFrontend

  if (installed) {
    return <Badge accent="success">frontend installed</Badge>
  }

  if (status === 'worker_only') {
    return <Badge accent="warning">worker only</Badge>
  }

  return <Badge accent="violet">{label(status)}</Badge>
}

function checkStatusClass(status: BrowserToolInstallCheck['status']) {
  return `tool-install-check-${status}`
}

export function InlineToolInstallStatusCard({ compact = false, descriptor }: InlineToolInstallStatusCardProps) {
  const summary = getFrontendToolInstallSummary()
  const installedTools = getFrontendInstalledTools()
  const workerOnlyTools = getFrontendWorkerOnlyTools()
  const futureTools = getFrontendFutureTools()
  const [checks, setChecks] = useState<BrowserToolInstallCheck[] | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleCheckLazyImports() {
    setChecking(true)
    try {
      setChecks(await checkBrowserToolInstallations())
    } finally {
      setChecking(false)
    }
  }

  return (
    <InlinePlanCardShell
      className="tool-install-status-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{summary.installedCount} installed</span>
          <span className="compact-summary-chip">{summary.lazyLoadCount} lazy-load</span>
          <span className="compact-summary-chip">{summary.workerOnlyCount} worker-only</span>
          <span className="compact-summary-chip">no auto execution</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Developer tools"
      helper="Browser-safe tools are installed for future previews. They are not running production rendering yet."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Tool install status"
    >
      <div className="tool-install-summary-grid">
        <span><strong>{summary.installedCount}</strong>Frontend installed</span>
        <span><strong>{summary.lazyLoadCount}</strong>Lazy-load recommended</span>
        <span><strong>{summary.workerOnlyCount}</strong>Worker-only excluded</span>
        <span><strong>{summary.futureCount}</strong>Future/planned</span>
      </div>

      <div className="understanding-chip-row">
        <Badge accent="cyan">No auto execution</Badge>
        <Badge accent="violet">No previews yet</Badge>
        <Badge accent="warning">No worker tools</Badge>
        <Badge accent="cyan">No model routing changes</Badge>
      </div>

      <details className="understanding-section" open={!compact}>
        <summary>Installed browser-safe tools</summary>
        <div className="tool-install-list">
          {installedTools.map((tool) => (
            <article className="tool-install-item" key={tool.id}>
              <div>
                <strong>{tool.label}</strong>
                <p>{tool.description}</p>
              </div>
              <div className="tool-install-meta">
                <span><strong>Package</strong>{packageName(tool)}</span>
                <span><strong>Status</strong>{installBadge(tool)}</span>
                <span><strong>Lazy load</strong>{tool.frontendInstallInfo?.lazyLoadRecommended ? 'recommended' : 'not required'}</span>
              </div>
              <div className="understanding-chip-row">
                {(tool.frontendInstallInfo?.installNotes ?? []).slice(0, 2).map((note) => (
                  <span className="tool-install-note" key={note}>{note}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Worker-only tools not installed in frontend</summary>
        <div className="tool-install-chip-list">
          {workerOnlyTools.map((tool) => (
            <span key={tool.id}>
              <strong>{tool.label}</strong>
              {packageName(tool)}
            </span>
          ))}
        </div>
        <p className="tool-install-boundary-note">Worker-only tools like FFmpeg, OpenCV, Playwright, and Essentia are not installed in the frontend.</p>
      </details>

      <details className="understanding-section">
        <summary>Future and planning-only tools</summary>
        <div className="tool-install-chip-list">
          {futureTools.slice(0, 12).map((tool) => (
            <span key={tool.id}>
              <strong>{tool.label}</strong>
              {label(tool.frontendInstallInfo?.installStatus ?? 'future')}
            </span>
          ))}
        </div>
      </details>

      <div className="tool-install-check-panel">
        <div>
          <strong>Lazy import smoke check</strong>
          <p>Checks only whether package imports are available. It does not render maps, charts, or animations and does not access the network.</p>
        </div>
        <Button disabled={checking} onClick={handleCheckLazyImports} size="sm" variant="secondary">
          {checking ? 'Checking...' : 'Check lazy imports'}
        </Button>
      </div>

      {checks && (
        <div className="tool-install-check-list">
          {checks.map((check) => (
            <span className={checkStatusClass(check.status)} key={check.toolId}>
              <strong>{check.label}</strong>
              <em>{check.status}</em>
              {check.message}
            </span>
          ))}
        </div>
      )}

      <details className="understanding-section">
        <summary>Install notes</summary>
        <div className="layout-mode-meta">
          {summary.notes.map((note) => (
            <span key={note}><strong>Rule</strong>{note}</span>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
