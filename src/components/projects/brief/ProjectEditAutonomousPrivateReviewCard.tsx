import { Check, LoaderCircle, Play, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { Card } from '../../Card'
import type { ProjectEditPlanExecutionGate } from '../../../lib/project-edit-plan-approval'
import {
  runAutonomousPrivateReview,
  type AutonomousPrivateReviewExecutionView,
} from '../../../lib/autonomous-private-review-api'
import { ProjectEditBriefArtifactReviewPlayer } from './ProjectEditBriefArtifactReviewPlayer'

export function ProjectEditAutonomousPrivateReviewCard(props: {
  apiBaseUrl?: string
  workspaceId: string
  executionGate?: ProjectEditPlanExecutionGate
  execution?: AutonomousPrivateReviewExecutionView
  onExecutionChange?: (execution: AutonomousPrivateReviewExecutionView) => void
  onStatusMessage?: (message: string) => void
}) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const execution = props.execution
  const ready = execution?.status === 'private_review_ready'
  const disabled = running || !props.apiBaseUrl || !props.executionGate

  async function runEdit() {
    if (!props.apiBaseUrl || !props.executionGate) return
    setRunning(true)
    setError(undefined)
    props.onStatusMessage?.('ReEditPro is executing the approved edit and preparing a private review.')
    try {
      const result = await runAutonomousPrivateReview({
        apiBaseUrl: props.apiBaseUrl,
        planId: props.executionGate.planId,
        workspaceId: props.workspaceId,
        onProgress: props.onExecutionChange,
      })
      props.onExecutionChange?.(result)
      props.onStatusMessage?.('Private review is ready. Technical checks passed; review the creative result next.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Private review stopped safely.'
      setError(message)
      props.onStatusMessage?.(message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="project-edit-autonomous-review" data-testid="project-edit-autonomous-private-review">
      <div className="project-edit-autonomous-review__header">
        <div>
          <span className="section-eyebrow">Approved edit</span>
          <h3>{ready ? 'Private review ready' : 'Create the edit'}</h3>
          <p>
            {ready
              ? 'The approved story, timing, captions, visuals, picture, and sound decisions were rendered and checked.'
              : 'Runs only the approved private work graph. The source video and review artifacts stay private.'}
          </p>
        </div>
        <Badge accent={ready ? 'success' : execution?.status === 'failed' || execution?.status === 'blocked' ? 'danger' : 'cyan'}>
          {ready ? 'Ready' : running || execution?.status === 'running' ? `${execution?.progressPercent ?? 0}%` : 'Waiting'}
        </Badge>
      </div>

      {execution?.progress?.length ? (
        <ol className="project-edit-autonomous-review__progress" aria-label="Edit progress">
          {execution.progress.map((item) => (
            <li data-state={item.status} key={item.stage}>
              <span className="project-edit-autonomous-review__progress-icon" aria-hidden="true">
                {item.status === 'completed' ? <Check size={15} /> : item.status === 'running' ? <LoaderCircle size={15} /> : null}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {!ready ? (
        <Button
          data-testid="project-edit-autonomous-private-review-button"
          disabled={disabled}
          icon={running ? LoaderCircle : Play}
          onClick={runEdit}
          size="sm"
          type="button"
          variant="primary"
        >
          {running ? 'Creating private review' : props.executionGate ? 'Create private review' : 'Approve plan first'}
        </Button>
      ) : null}

      {ready && execution.previewStorageObjectRecordId ? (
        <>
          <ProjectEditBriefArtifactReviewPlayer
            apiBaseUrl={props.apiBaseUrl}
            artifactLabel="Private review"
            disabledMessage="Private review is ready."
            storageObjectRecordId={execution.previewStorageObjectRecordId}
            workspaceId={props.workspaceId}
          />
          <div className="project-edit-autonomous-review__summary">
            <div><ShieldCheck size={16} /><span>{execution.qaSummary?.passedGateCount ?? 0} technical checks passed</span></div>
            {execution.executedActivitySummary.map((summary) => <div key={summary}><Check size={16} /><span>{summary}</span></div>)}
          </div>
          <p className="project-edit-brief-muted">Creative review is still yours. This artifact is private and has not been published.</p>
        </>
      ) : null}
      {error || execution?.error ? <p className="project-edit-brief-source-video-picker__error">{error ?? execution?.error}</p> : null}
    </Card>
  )
}
