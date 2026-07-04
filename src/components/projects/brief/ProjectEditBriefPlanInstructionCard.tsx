import { Badge } from '../../Badge'
import type { ProjectEditBriefMarkerPlanInstruction } from '../../../types/project-edit-brief-plan'

type ProjectEditBriefPlanInstructionCardProps = {
  instruction: ProjectEditBriefMarkerPlanInstruction
}

export function ProjectEditBriefPlanInstructionCard({ instruction }: ProjectEditBriefPlanInstructionCardProps) {
  return (
    <li className="project-edit-brief-plan-instruction-card" data-testid="project-edit-brief-plan-instruction-card">
      <div>
        <strong>{instruction.markerTitle}</strong>
        <span>{instruction.timeRangeLabel}</span>
      </div>
      <p>{instruction.instructionText}</p>
      <div className="project-edit-brief-plan-instruction-card__badges">
        <Badge accent="cyan">{instruction.instructionKind.replaceAll('_', ' ')}</Badge>
        <Badge>{instruction.markerPriority.replaceAll('_', ' ')}</Badge>
        <Badge>{instruction.qaStatus.replaceAll('_', ' ')}</Badge>
      </div>
      {instruction.warnings.length ? (
        <p className="project-edit-brief-muted">{instruction.warnings.join(' ')}</p>
      ) : null}
    </li>
  )
}
