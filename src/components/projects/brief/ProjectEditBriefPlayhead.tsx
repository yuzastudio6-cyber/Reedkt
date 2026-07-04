type ProjectEditBriefPlayheadProps = {
  leftPercent: number
}

export function ProjectEditBriefPlayhead({ leftPercent }: ProjectEditBriefPlayheadProps) {
  return (
    <div
      aria-label="Mock playhead"
      className="project-edit-brief-playhead"
      data-testid="project-edit-brief-playhead"
      style={{ left: `${leftPercent}%` }}
    />
  )
}
