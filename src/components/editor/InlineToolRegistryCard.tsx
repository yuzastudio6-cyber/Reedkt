import { useEffect, useState } from 'react'

import {
  readPrivateInternalToolRuntimeReadiness,
  type PrivateInternalToolRuntimeReadiness,
} from '../../lib/private-internal-tool-runtime-readiness-client'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
} from '../../types/reeditpro'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineToolRegistryCardProps = {
  plan?: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

type RuntimeReadinessState =
  | { status: 'checking' }
  | {
      status: 'ready'
      readiness: PrivateInternalToolRuntimeReadiness
    }
  | {
      status: 'connection_required'
      message: string
    }

function label(value: string) {
  return value.replaceAll('_', ' ')
}

export function InlineToolRegistryCard({
  descriptor,
}: InlineToolRegistryCardProps) {
  const [runtimeState, setRuntimeState] =
    useState<RuntimeReadinessState>({ status: 'checking' })

  useEffect(() => {
    let active = true

    void readPrivateInternalToolRuntimeReadiness()
      .then((readiness) => {
        if (active) {
          setRuntimeState({ status: 'ready', readiness })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setRuntimeState({
            status: 'connection_required',
            message:
              error instanceof Error
                ? error.message
                : 'The authenticated private runtime status could not be read.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [])

  const readiness =
    runtimeState.status === 'ready' ? runtimeState.readiness : undefined

  return (
    <InlinePlanCardShell
      className="tool-registry-card"
      compactSummary={(
        <div className="compact-summary-row" aria-live="polite">
          {readiness ? (
            <>
              <span className="compact-summary-chip">
                {readiness.readyToolCount} canonical tools ready
              </span>
              <span className="compact-summary-chip">
                {readiness.runtimeAuthorityCount} verified runtimes
              </span>
              <span className="compact-summary-chip">
                private internal execution
              </span>
            </>
          ) : (
            <span className="compact-summary-chip">
              {runtimeState.status === 'checking'
                ? 'Checking authenticated runtime status'
                : 'Connect the private internal backend to inspect runtimes'}
            </span>
          )}
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Editing runtime status"
      helper="This is a read-only status from the authenticated backend process. Ready means the verified runtime is active for private internal execution; it does not claim customer or production release."
      priority={descriptor?.priority}
      status={readiness ? 'ready' : undefined}
      title="Canonical editing tools"
    >
      {readiness ? (
        <>
          <div className="tool-registry-summary-grid">
            <span>
              <strong>{readiness.readyToolCount}</strong>
              Ready tools
            </span>
            <span>
              <strong>{readiness.runnerClassCount}</strong>
              Runner classes
            </span>
            <span>
              <strong>{readiness.runtimeAuthorityCount}</strong>
              Runtime authorities
            </span>
            <span>
              <strong>{readiness.canonicalToolCount}</strong>
              Canonical identities
            </span>
          </div>

          <div className="understanding-chip-row">
            <Badge accent="success">All canonical tools ready</Badge>
            <Badge accent="cyan">Private internal execution</Badge>
            <Badge accent="muted">Production promotion separate</Badge>
          </div>

          <details className="understanding-section">
            <summary>
              Verified canonical tools ({readiness.readyToolCount})
            </summary>
            <div className="tool-profile-list">
              {readiness.tools.map((tool) => (
                <article className="tool-profile-item" key={tool.toolId}>
                  <div>
                    <span className="section-eyebrow">
                      {label(tool.runtimeFamily)}
                    </span>
                    <h4>{tool.displayName}</h4>
                    <p>{tool.operationId}</p>
                  </div>
                  <div className="understanding-chip-row">
                    <Badge accent="success">Ready</Badge>
                  </div>
                </article>
              ))}
            </div>
          </details>

          <details className="understanding-section">
            <summary>Release boundary</summary>
            <div className="layout-mode-meta">
              <span>
                <strong>Internal execution</strong>
                Ready in this authenticated private process
              </span>
              <span>
                <strong>Customer production</strong>
                Requires separate deployment, service identity, storage,
                observability, and release evidence
              </span>
              {readiness.releaseBlockers.map((blocker) => (
                <span key={blocker}>
                  <strong>Open release gate</strong>
                  {label(blocker)}
                </span>
              ))}
            </div>
          </details>
        </>
      ) : (
        <div className="inline-runtime-status" role="status">
          <strong>
            {runtimeState.status === 'checking'
              ? 'Reading verified runtime authorities…'
              : 'Private backend connection required'}
          </strong>
          <p>
            {runtimeState.status === 'checking'
              ? 'The interface is waiting for the authenticated backend result and will not guess from planning metadata.'
              : runtimeState.status === 'connection_required'
                ? runtimeState.message
                : 'The authenticated backend result is being applied.'}
          </p>
        </div>
      )}
    </InlinePlanCardShell>
  )
}
