import { useEffect, useState } from 'react'
import { Badge } from '../../Badge'
import { Card } from '../../Card'
import type { ProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import type { ProjectEditBriefPlanPanelModel } from '../../../types/project-edit-brief-plan'
import type { PreferenceApplicationDownstreamContext } from '../../../types/edit-reference-integration'
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
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}

export function ProjectEditBriefPlanBridgePanel({
  client,
  editSessionId,
  onPrepared,
  projectId,
  preferenceApplicationContext,
}: ProjectEditBriefPlanBridgePanelProps) {
  const [model, setModel] = useState<ProjectEditBriefPlanPanelModel | undefined>()
  const [status, setStatus] = useState('Plan Hints have not been prepared in this UI session.')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadProjectEditBriefPlanPanelForUI({ client, editSessionId, projectId, preferenceApplicationContext }).then((loaded) => {
      if (cancelled) return
      setModel(loaded.panelModel)
    }).catch(() => {
      if (!cancelled) setStatus('Mock Plan Bridge failed safely without production side effects.')
    })
    return () => {
      cancelled = true
    }
  }, [client, editSessionId, preferenceApplicationContext, projectId])

  async function preparePlanHints() {
    setBusy(true)
    try {
      const result = await prepareProjectEditBriefPlanHintsForUI({ client, editSessionId, projectId, preferenceApplicationContext })
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

  const activePreferenceGuidance = model?.preferenceGuidance.filter((item) => item.status === 'active_hint') ?? []
  const heldBackPreferenceGuidance = model?.preferenceGuidance.filter((item) => item.status !== 'active_hint') ?? []

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
          {model.preferenceGuidance.length ? (
            <section className="project-edit-brief-preference-plan-hints" data-testid="project-edit-brief-preference-plan-hints">
              <div className="project-edit-brief-preference-plan-hints__header">
                <div>
                  <h4>Target-adapted Preference DNA</h4>
                  <p>{activePreferenceGuidance.length} usable here · {heldBackPreferenceGuidance.length} protected by marker priority</p>
                </div>
                <Badge accent="violet">Lower priority</Badge>
              </div>
              <ul>
                {activePreferenceGuidance.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.instruction}</span>
                  </li>
                ))}
              </ul>
              {activePreferenceGuidance.length > 3 ? (
                <details>
                  <summary>Review {activePreferenceGuidance.length - 3} more adapted hints</summary>
                  <ul>
                    {activePreferenceGuidance.slice(3).map((item) => (
                      <li key={item.id}>
                        <strong>{item.title}</strong>
                        <span>{item.instruction}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {heldBackPreferenceGuidance.length ? (
                <details>
                  <summary>Review {heldBackPreferenceGuidance.length} held-back hint{heldBackPreferenceGuidance.length === 1 ? '' : 's'}</summary>
                  <ul>
                    {heldBackPreferenceGuidance.map((item) => (
                      <li className="is-held-back" key={item.id}>
                        <strong>{item.title}</strong>
                        <span>{item.reason}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <p>{model.preferenceApplicationQA?.prioritySummary}</p>
            </section>
          ) : null}
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
