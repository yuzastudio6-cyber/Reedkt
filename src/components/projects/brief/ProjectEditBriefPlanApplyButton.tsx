import { ClipboardList, LoaderCircle } from 'lucide-react'
import { Button } from '../../Button'

type ProjectEditBriefPlanApplyButtonProps = {
  busy?: boolean
  disabled?: boolean
  onPrepare: () => void
}

export function ProjectEditBriefPlanApplyButton({ busy = false, disabled = false, onPrepare }: ProjectEditBriefPlanApplyButtonProps) {
  return (
    <Button
      data-testid="project-edit-brief-plan-prepare-button"
      disabled={busy || disabled}
      icon={busy ? LoaderCircle : ClipboardList}
      onClick={onPrepare}
      size="sm"
      type="button"
      variant="primary"
    >
      {busy ? 'Preparing hints' : 'Prepare Plan Hints'}
    </Button>
  )
}
