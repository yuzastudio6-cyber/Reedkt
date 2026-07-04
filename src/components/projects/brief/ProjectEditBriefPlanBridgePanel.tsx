import { useEffect, useState } from 'react'
import { Badge } from '../../Badge'
import { Card } from '../../Card'
import type { ProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import type { ProjectEditBriefPlanPanelModel } from '../../../types/project-edit-brief-plan'
import {
  createProjectEditBriefPlanBoundarySummary,
  loadProjectEditBriefPlanPanelForUI,
  prepareProjectEditBriefPlanHintsForUI,
} from '../../../lib/project-edit-brief-plan-ui-adapter'
import { ProjectEditBriefApplicationLogSummary } from './ProjectEditBriefApplicationLogSummary'
import { ProjectEditBriefPlanApplyButton } from './ProjectEditBriefPlanApplyButton'
import { ProjectEditBriefPlanBoundaryNotice } from './ProjectEditBriefPlanBoundaryNotice'
import { ProjectEditBriefPlanInstructionList } from './ProjectEditBriefPlanInstructionList'
import { ProjectEditBriefPlanReadinessCard } from './ProjectEditBriefPlanReadinessCard'
import { ProjectEditBriefSkippedMarkerList } from './ProjectEditBriefSkippedMarkerList'

type ProjectEditBriefPlanBridgePanelProps = {
  client?: ProjectEditBriefApiClient
  editSessionId: string
  onPrepared?: (message: string) => void
  projectId: string
}

export function ProjectEditBriefPlanBridgePanel({
  client,
  editSessionId,
  onPrepared,
  projectId,
}: ProjectEditBriefPlanBridgePanelProps) {
  const [model, setModel] = useState<ProjectEditBriefPlanPanelModel | undefined>()
  const [status, setStatus] = useState('Plan Hints have not been prepared in this UI session.')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadProjectEditBriefPlanPanelForUI({ client, editSessionId, projectId }).then((loaded) => {
      if (cancelled) return
      setModel(loaded.panelModel)
    }).catch(() => {
      if (!cancelled) setStatus('Mock Plan Bridge failed safely without production side effects.')
    })
    return () => {
      cancelled = true
    }
  }, [client, editSessionId, projectId])

  async function preparePlanHints() {
    setBusy(true)
    try {
      const result = await prepareProjectEditBriefPlanHintsForUI({ client, editSessionId, projectId })
      if (result.panelModel) {
        setModel(result.panelModel)
        const message = `Prepared ${result.panelModel.eligibleMarkerCount} mock plan hint(s). No planner, render, provider, worker, credit, media, or Supabase action started.`
        setStatus(message)
        onPrepared?.(message)
      } else {
        setStatus(result.warnings.join(' ') || 'Mock Plan Bridge could not prepare hints safely.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="project-edit-brief-plan-bridge" data-testid="project-edit-brief-plan-bridge">
      <div className="project-edit-brief-plan-bridge__header">
        <div>
          <span className="section-eyebrow">Plan Bridge</span>
          <h3>Brief Plan Hints</h3>
          <p>Prepare eligible marker instructions as mock planner-input metadata.</p>
        </div>
        <div className="project-edit-brief-plan-bridge__actions">
          <Badge accent="cyan">Mock/local</Badge>
          <ProjectEditBriefPlanApplyButton
            busy={busy}
            disabled={!model?.canPreparePlanHints}
            onPrepare={preparePlanHints}
          />
        </div>
      </div>
      {model ? (
        <>
          <ProjectEditBriefPlanReadinessCard model={model} />
          <dl className="project-edit-brief-detail-list">
            <div><dt>Export settings</dt><dd>{model.exportSettingsSummary ?? 'Unavailable'}</dd></div>
            <div><dt>Priority policy</dt><dd>{model.priorityPolicySummary}</dd></div>
          </dl>
          <ProjectEditBriefPlanInstructionList instructions={model.instructions} />
          <ProjectEditBriefSkippedMarkerList skippedMarkers={model.skippedMarkers} />
          <ProjectEditBriefApplicationLogSummary summary={model.applicationLogSummary} />
          <ProjectEditBriefPlanBoundaryNotice summary={model.boundarySummary} />
        </>
      ) : (
        <ProjectEditBriefPlanBoundaryNotice summary={createProjectEditBriefPlanBoundarySummary()} />
      )}
      <p className="project-edit-brief-muted" data-testid="project-edit-brief-plan-status">{status}</p>
    </Card>
  )
}
