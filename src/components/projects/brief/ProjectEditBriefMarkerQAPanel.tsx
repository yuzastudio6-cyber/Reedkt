import { useState } from 'react'
import { Badge } from '../../Badge'
import type { ProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import type { ProjectEditBriefMarkerDetailModel } from '../../../lib/project-edit-brief-ui-adapter'
import type { ProjectEditBriefMarkerQAPanelModel } from '../../../types/project-edit-brief-qa'
import type { PreferenceApplicationDownstreamContext } from '../../../types/edit-reference-integration'
import {
  runProjectEditBriefMarkerQAViaApi,
} from '../../../lib/project-edit-brief-qa-ui-adapter'
import { ProjectEditBriefConflictList } from './ProjectEditBriefConflictList'
import { ProjectEditBriefQABadge } from './ProjectEditBriefQABadge'
import { ProjectEditBriefQABoundaryNotice } from './ProjectEditBriefQABoundaryNotice'
import { ProjectEditBriefRunQAButton } from './ProjectEditBriefRunQAButton'

type ProjectEditBriefMarkerQAPanelProps = {
  client?: ProjectEditBriefApiClient
  marker?: ProjectEditBriefMarkerDetailModel
  onRan?: (message: string) => void
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}

export function ProjectEditBriefMarkerQAPanel({
  client,
  marker,
  onRan,
  preferenceApplicationContext,
}: ProjectEditBriefMarkerQAPanelProps) {
  const [model, setModel] = useState<ProjectEditBriefMarkerQAPanelModel | undefined>()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Run selected marker QA before future planning.')

  async function runQA() {
    if (!marker) return
    setBusy(true)
    try {
      const result = await runProjectEditBriefMarkerQAViaApi({ client, markerId: marker.markerId, preferenceApplicationContext })
      if (result?.panelModel) {
        setModel(result.panelModel)
        const message = `Marker QA complete: ${result.panelModel.qaStatusLabel}. No planner, render, provider, worker, credit, media, or Supabase action started.`
        setStatus(message)
        onRan?.(message)
      } else {
        setStatus('Marker QA failed safely without production side effects.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="project-edit-brief-marker-qa-panel" data-testid="project-edit-brief-marker-qa-panel">
      <div className="project-edit-brief-marker-qa-panel__header">
        <div>
          <h4>Marker QA</h4>
          <p className="project-edit-brief-muted">{marker ? marker.title : 'Select or save a marker to run QA.'}</p>
        </div>
        <ProjectEditBriefRunQAButton
          busy={busy}
          disabled={!marker}
          label="Run marker QA"
          onRun={runQA}
        />
      </div>

      <div className="project-edit-brief-marker-qa-panel__badges">
        <ProjectEditBriefQABadge status={model?.qaStatus ?? marker?.qaStatus} />
        <Badge>Mock/local</Badge>
      </div>

      {model ? (
        <>
          <ul className="project-edit-brief-qa-finding-list" data-testid="project-edit-brief-qa-findings">
            {model.findings.map((finding) => (
              <li key={finding.id}>
                <strong>{finding.title}</strong>
                <span>{finding.summary}</span>
                <em>{finding.recommendedResolution}</em>
              </li>
            ))}
          </ul>
          <ProjectEditBriefConflictList conflicts={model.conflicts} />
          {model.preferenceApplicationQA ? (
            <p className="project-edit-brief-muted" data-testid="project-edit-brief-marker-preference-qa">
              Edit Reference context: {model.preferenceApplicationQA.status}. {model.preferenceApplicationQA.findings.join(' ')}
            </p>
          ) : null}
          <p className="project-edit-brief-muted">{model.recommendedNextAction}</p>
          <ProjectEditBriefQABoundaryNotice summary={model.boundarySummary} />
        </>
      ) : (
        <ProjectEditBriefQABoundaryNotice summary="Selected-marker QA is deterministic mock/local metadata only and does not auto-fix or apply markers." />
      )}
      <p className="project-edit-brief-muted" data-testid="project-edit-brief-marker-qa-status">{status}</p>
    </section>
  )
}
