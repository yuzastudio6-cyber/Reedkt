import { CheckCircle2, Circle, LockKeyhole } from 'lucide-react'
import type { ProjectEditLifecycleModel, ProjectEditLifecycleStageStatus } from '../../lib/project-edit-lifecycle'
import { Badge } from '../Badge'
import { Card } from '../Card'

type ProjectEditLifecycleStatusCardProps = {
  model: ProjectEditLifecycleModel
}

function statusIcon(status: ProjectEditLifecycleStageStatus) {
  if (status === 'complete') return CheckCircle2
  if (status === 'ready') return Circle
  return LockKeyhole
}

function badgeAccent(status: ProjectEditLifecycleStageStatus) {
  if (status === 'complete') return 'success' as const
  if (status === 'ready') return 'cyan' as const
  return 'muted' as const
}

export function ProjectEditLifecycleStatusCard({ model }: ProjectEditLifecycleStatusCardProps) {
  return (
    <Card className="project-edit-lifecycle-card" data-testid="project-edit-lifecycle-card">
      <div className="project-edit-lifecycle-card__header">
        <div>
          <span className="section-eyebrow">Edit lifecycle</span>
          <h3>What can happen next</h3>
          <p>{model.nextAction}</p>
        </div>
        <Badge accent={model.productReady || model.finalExportAllowed ? 'success' : 'cyan'}>
          {model.productReady ? 'Product ready' : model.finalExportAllowed ? 'Private export ready' : 'Testing gated'}
        </Badge>
      </div>

      <ol className="project-edit-lifecycle-card__list">
        {model.stages.map((stage) => {
          const Icon = statusIcon(stage.status)
          return (
            <li className={`project-edit-lifecycle-card__stage project-edit-lifecycle-card__stage--${stage.status}`} key={stage.id}>
              <Icon aria-hidden="true" size={17} />
              <div>
                <strong>{stage.label}</strong>
                <p>{stage.summary}</p>
              </div>
              <Badge accent={badgeAccent(stage.status)}>{stage.status}</Badge>
            </li>
          )
        })}
      </ol>

      <div className="project-edit-lifecycle-card__facts" data-testid="project-edit-lifecycle-facts">
        <span>Backend upload allowed: {model.backendUploadAllowed ? 'yes' : 'no'}</span>
        <span>Internal preview allowed: {model.internalPreviewAllowed ? 'yes' : 'no'}</span>
        <span>Tool execution allowed: {model.toolExecutionAllowed ? 'yes' : 'no'}</span>
        <span>Final export allowed: {model.finalExportAllowed ? 'yes' : 'no'}</span>
      </div>

      <div className="project-edit-lifecycle-card__export-readiness" data-testid="project-edit-final-export-readiness">
        <strong>Final export readiness</strong>
        <p>{model.finalExportReadiness.summary}</p>
        {model.finalExportReadiness.blockers.length > 0 ? (
          <ul>
            {model.finalExportReadiness.gates.filter((gate) => !gate.passed).slice(0, 4).map((gate) => (
              <li key={gate.id}>{gate.label}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  )
}
