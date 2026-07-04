import { Eye, Loader2 } from 'lucide-react'
import { Button } from '../../Button'

type ProjectEditBriefAnalyzeVisualContextButtonProps = {
  busy: boolean
  disabled?: boolean
  disabledReason?: string
  onAnalyze: () => void
}

export function ProjectEditBriefAnalyzeVisualContextButton({
  busy,
  disabled = false,
  disabledReason,
  onAnalyze,
}: ProjectEditBriefAnalyzeVisualContextButtonProps) {
  return (
    <Button
      data-testid="project-edit-brief-analyze-visual-context-button"
      disabled={busy || disabled}
      icon={busy ? Loader2 : Eye}
      onClick={onAnalyze}
      title={disabled ? disabledReason : 'Analyze visual context'}
      variant="primary"
    >
      {busy ? 'Analyzing' : 'Analyze Visual Context'}
    </Button>
  )
}
