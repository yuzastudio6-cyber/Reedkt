import { useEffect, useState } from 'react'
import { Badge } from '../../Badge'
import { Card } from '../../Card'
import type { ProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import type { ProjectEditBriefQASummaryModel } from '../../../types/project-edit-brief-qa'
import type { PreferenceApplicationDownstreamContext } from '../../../types/edit-reference-integration'
import {
  createProjectEditBriefQASummaryModel,
  loadProjectEditBriefQAPackageForUI,
  runProjectEditBriefQAViaApi,
} from '../../../lib/project-edit-brief-qa-ui-adapter'
import { ProjectEditBriefQABoundaryNotice } from './ProjectEditBriefQABoundaryNotice'
import { ProjectEditBriefRunQAButton } from './ProjectEditBriefRunQAButton'

type ProjectEditBriefQASummaryCardProps = {
  client?: ProjectEditBriefApiClient
  editSessionId: string
  onRan?: (message: string) => void
  projectId: string
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}

export function ProjectEditBriefQASummaryCard({
  client,
  editSessionId,
  onRan,
  projectId,
  preferenceApplicationContext,
}: ProjectEditBriefQASummaryCardProps) {
  const [model, setModel] = useState<ProjectEditBriefQASummaryModel | undefined>()
  const [status, setStatus] = useState('Marker QA has not run in this UI session.')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadProjectEditBriefQAPackageForUI({ client, editSessionId, projectId, preferenceApplicationContext }).then((qaPackage) => {
      if (cancelled || !qaPackage) return
      setModel(createProjectEditBriefQASummaryModel(qaPackage))
    }).catch(() => {
      if (!cancelled) setStatus('Mock QA package failed safely without production side effects.')
    })
    return () => {
      cancelled = true
    }
  }, [client, editSessionId, preferenceApplicationContext, projectId])

  async function runQA() {
    setBusy(true)
    try {
      const result = await runProjectEditBriefQAViaApi({ client, editSessionId, projectId, preferenceApplicationContext })
      if (result.summaryModel) {
        setModel(result.summaryModel)
        const message = `Brief QA complete: ${result.summaryModel.readinessLabel}. No planner, render, provider, worker, credit, media, or Supabase action started.`
        setStatus(message)
        onRan?.(message)
      } else {
        setStatus('Brief QA failed safely without production side effects.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="project-edit-brief-qa-summary-card" data-testid="project-edit-brief-qa-summary">
      <div className="project-edit-brief-qa-summary-card__header">
        <div>
          <span className="section-eyebrow">Marker QA</span>
          <h3>Brief QA summary</h3>
        </div>
        <ProjectEditBriefRunQAButton busy={busy} onRun={runQA} />
      </div>
      {model ? (
        <>
          <div className="project-edit-brief-qa-summary-card__badges">
            <Badge accent={model.conflictCount || model.blockedCount ? 'danger' : model.warningCount || model.needsAssetCount || model.needsClarificationCount ? 'warning' : 'success'}>
              {model.readinessLabel}
            </Badge>
            <Badge>{model.markerCountLabel}</Badge>
            <Badge>{model.conflictCount} conflict(s)</Badge>
          </div>
          <dl className="project-edit-brief-detail-list">
            <div><dt>Passed</dt><dd>{model.passedCount}</dd></div>
            <div><dt>Warnings</dt><dd>{model.warningCount}</dd></div>
            <div><dt>Needs asset</dt><dd>{model.needsAssetCount}</dd></div>
            <div><dt>Needs clarification</dt><dd>{model.needsClarificationCount}</dd></div>
            <div><dt>Blocked</dt><dd>{model.blockedCount}</dd></div>
          </dl>
          <p>{model.readableSummary}</p>
          {model.preferenceApplicationQA ? (
            <section className="project-edit-brief-preference-qa" data-testid="project-edit-brief-preference-qa">
              <div>
                <strong>Target-adapted Preference DNA</strong>
                <Badge accent={model.preferenceApplicationQA.status === 'blocked' ? 'danger' : model.preferenceApplicationQA.status === 'warning' ? 'warning' : 'success'}>
                  {model.preferenceApplicationQA.status}
                </Badge>
              </div>
              <p>{model.preferenceApplicationQA.findings.join(' ')}</p>
              <p>{model.preferenceApplicationQA.prioritySummary}</p>
            </section>
          ) : null}
          <ProjectEditBriefQABoundaryNotice summary={model.boundarySummary} />
        </>
      ) : (
        <ProjectEditBriefQABoundaryNotice summary="Marker QA is mock/local and available when an active mock Brief bundle exists." />
      )}
      <p className="project-edit-brief-muted" data-testid="project-edit-brief-qa-status">{status}</p>
    </Card>
  )
}
