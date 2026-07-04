import type { ProjectEditBriefMarkerPlanInstruction } from '../../../types/project-edit-brief-plan'
import { ProjectEditBriefPlanInstructionCard } from './ProjectEditBriefPlanInstructionCard'

type ProjectEditBriefPlanInstructionListProps = {
  instructions: ProjectEditBriefMarkerPlanInstruction[]
}

export function ProjectEditBriefPlanInstructionList({ instructions }: ProjectEditBriefPlanInstructionListProps) {
  if (!instructions.length) {
    return <p className="project-edit-brief-muted">No eligible marker plan hints yet.</p>
  }
  return (
    <ul className="project-edit-brief-plan-instruction-list" data-testid="project-edit-brief-plan-instruction-list">
      {instructions.map((instruction) => (
        <ProjectEditBriefPlanInstructionCard instruction={instruction} key={instruction.id} />
      ))}
    </ul>
  )
}
